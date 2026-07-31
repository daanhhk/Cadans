import { activeGoalProfile_ } from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  buildGoalDims,
  buildGoalInputs,
  maandLabel,
  onderhoudVloerW,
  projectionDirection,
  tierProgress,
  weekTss,
  wkgSince,
} from "./niveau";

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

describe("projectionDirection", () => {
  it("ctlAtTest ruim boven nu (≥ +1) → 'up'", () => {
    expect(projectionDirection(50, 55)).toBe("up");
    expect(projectionDirection(50, 51)).toBe("up"); // exact +1 telt als up
  });
  it("delta 0 → 'flat'", () => {
    expect(projectionDirection(50, 50)).toBe("flat");
  });
  it("delta net onder 1 → 'flat'", () => {
    expect(projectionDirection(50, 50.9)).toBe("flat");
    expect(projectionDirection(50, 49.2)).toBe("flat");
  });
  it("ctlAtTest ruim onder nu (≤ −1) → 'down'", () => {
    expect(projectionDirection(50, 45)).toBe("down");
    expect(projectionDirection(50, 49)).toBe("down"); // exact −1 telt als down
  });
  it("een van beide null → null", () => {
    expect(projectionDirection(null, 55)).toBeNull();
    expect(projectionDirection(50, null)).toBeNull();
    expect(projectionDirection(null, null)).toBeNull();
  });
});

// ── ROADMAP punt 8 — de behoud-vloer en de INVOER waarop hij rust ─────────────
// Rij-fixturevorm gelijk aan effect.test.ts: idx0 Date, idx1 type, idx3 duur, idx14 rolling_ftp.

function rit(datumISO: string, rollingFtp: number | null): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  row[1] = "Ride";
  row[3] = 60;
  row[14] = rollingFtp;
  return row;
}

const DOELSTART = "2026-06-29";
/** Instapwaarde: de laatste geldige rolling_ftp VÓÓR doelStart. */
const INSTAP = 273;

describe("onderhoudVloerW — 95 procent van de instapwaarde", () => {
  const voorStart = [rit("2026-06-15", 270), rit("2026-06-22", INSTAP)];

  it("instap 273 geeft 259,35 — ONAFGEROND, want afronden is presentatie", () => {
    const v = onderhoudVloerW(voorStart, DOELSTART);
    expect(v).not.toBeNull();
    expect(v as number).toBeCloseTo(259.35, 2);
  });

  it("geen doelStart geeft null — er is dan geen periode om tegen te meten", () => {
    expect(onderhoudVloerW(voorStart, null)).toBeNull();
    expect(onderhoudVloerW(voorStart, "")).toBeNull();
    expect(onderhoudVloerW(voorStart, "   ")).toBeNull();
  });

  it("geen rit vóór doelStart geeft null — niets om van af te leiden", () => {
    expect(onderhoudVloerW([rit("2026-07-06", 265)], DOELSTART)).toBeNull();
    expect(onderhoudVloerW([], DOELSTART)).toBeNull();
  });
});

describe("DE INVOER-TOETS — de behoud-lat leest de RITTEN, niet de ingestelde FTP", () => {
  // DIT IS DE DRAGENDE TEST van punt 8. §8 wees eerst ftpWkg aan, en die staat op
  // settings.ftp — een HANDMATIG veld dat alleen beweegt als de gebruiker het overtypt
  // (`ftp_auto_update` heeft nul lezers). De vloer komt uit rolling_ftp uit de ritten. Twee
  // verschillende grootheden tegen elkaar: het mechanisme werkt, de invoer niet, en de kaart
  // staat de hele periode groen op een ingevuld getal. Deze drie runs pinnen dat de current
  // ALLEEN op de ritten reageert.
  const prof = { dims: activeGoalProfile_({ doel: "Onderhoud" }).dims };

  function run(ftpInstelling: number, nieuwsteRollingFtp: number) {
    const rows = [
      rit("2026-06-22", INSTAP), // vóór doelStart → de instapwaarde
      rit("2026-07-13", nieuwsteRollingFtp), // ná doelStart → de huidige waarde
    ];
    const settings = {
      ftp: ftpInstelling,
      gewicht: 75,
      doel: "Onderhoud",
      doelStart: DOELSTART,
    } as unknown as SettingsInput;
    const dims = buildGoalDims(
      prof,
      buildGoalInputs(settings, rows),
      onderhoudVloerW(rows, DOELSTART),
    );
    return dims.find((d) => d.metric === "rollingFtpW");
  }

  const A = run(280, 250);
  const B = run(200, 250);
  const C = run(280, 265);

  it("A en B verschillen alleen in settings.ftp → de current is GELIJK", () => {
    expect(A?.current).toBe(250);
    expect(B?.current).toBe(A?.current);
  });

  it("A en C verschillen in de RITTEN → de current is VERANDERD", () => {
    expect(C?.current).toBe(265);
    expect(C?.current).not.toBe(A?.current);
  });

  it("de effectieve target is de afgeleide vloer, niet de null uit de lat", () => {
    expect(A?.target).toBeCloseTo(259.35, 2);
  });

  it("250 zakt onder de vloer, 265 niet", () => {
    expect(A?.onTrack).toBe(false);
    expect(C?.onTrack).toBe(true);
  });
});
