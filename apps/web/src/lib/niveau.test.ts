import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { maandLabel, tierProgress, weekTss, wkgSince } from "./niveau";

function act(dateISO: string, tss: number): ActValuesRow {
  const [y, m, d] = dateISO.split("-").map(Number);
  const r: ActValuesRow = new Array(17).fill("");
  r[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  r[8] = tss;
  return r;
}
const p = (maand: string, wkg: number | null) => ({
  maand,
  niveau: null,
  wkg,
  ctl: null,
});

describe("tierProgress", () => {
  it("Gevorderd @ 3,8 → nog 0,3 tot Zeer goed, 50%", () => {
    const t = tierProgress(3.8);
    expect(t?.tierLabel).toBe("Gevorderd");
    expect(t?.nextLabel).toBe("Zeer goed");
    expect(t?.remaining).toBe(0.3);
    expect(t?.pct).toBeCloseTo(0.5, 5);
  });
  it("Beginner @ 2,0 → nog 0,5 tot Recreatief", () => {
    const t = tierProgress(2.0);
    expect(t?.tierLabel).toBe("Beginner");
    expect(t?.nextLabel).toBe("Recreatief");
    expect(t?.remaining).toBe(0.5);
  });
  it("Elite → geen volgende tier", () => {
    const t = tierProgress(5.0);
    expect(t?.tierLabel).toBe("Elite");
    expect(t?.nextLabel).toBeNull();
    expect(t?.remaining).toBeNull();
  });
  it("null wkg → null", () => {
    expect(tierProgress(null)).toBeNull();
  });
});

describe("wkgSince", () => {
  it("delta + eerste maand", () => {
    const r = wkgSince([
      p("2024-06", 2.9),
      p("2025-01", 3.2),
      p("2026-06", 3.8),
    ]);
    expect(r?.delta).toBe(0.9);
    expect(r?.sinceMonth).toBe("jun '24");
  });
  it("negeert null-wkg-punten voor de baseline", () => {
    const r = wkgSince([
      p("2024-05", null),
      p("2024-06", 3.0),
      p("2026-06", 3.6),
    ]);
    expect(r?.sinceMonth).toBe("jun '24");
    expect(r?.delta).toBe(0.6);
  });
  it("<2 geldige punten → null", () => {
    expect(wkgSince([p("2026-06", 3.8)])).toBeNull();
    expect(wkgSince([])).toBeNull();
  });
});

describe("weekTss (kalenderweek [ma, ma+7))", () => {
  it("somt alleen de huidige week", () => {
    const rows = [
      act("2026-07-05", 40), // zondag ervoor → uit
      act("2026-07-06", 30), // maandag → in
      act("2026-07-09", 50), // do → in
      act("2026-07-13", 99), // volgende maandag → uit
    ];
    expect(weekTss(rows, "2026-07-06")).toBe(80);
  });
  it("geen ritten in de week → null", () => {
    expect(weekTss([act("2026-06-01", 50)], "2026-07-06")).toBeNull();
  });
});

describe("maandLabel", () => {
  it("yyyy-MM → mmm 'yy", () => {
    expect(maandLabel("2024-06")).toBe("jun '24");
    expect(maandLabel("2026-12")).toBe("dec '26");
  });
});
