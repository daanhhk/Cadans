import type {
  EventItem,
  PlannerDay,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  computeTsbTrend,
  DOWN_TSB_THRESHOLD,
  fatigueMinDataOk,
  fatigueTrigger,
  UP_TSB_THRESHOLD,
} from "./fatigue";
import { buildWeekProposal } from "./proposal";

// ── pure logica ──────────────────────────────────────────────────────────────

function wl(datum: string, vorm: number | null): WellnessInput {
  return {
    datum,
    rhr: 48,
    hrv: 65,
    slaapU: 7.5,
    slaapScore: 80,
    readiness: 90,
    mood: "ok",
    weightKg: 75,
    ctl: 50,
    atl: 45,
    vorm,
    ramp: 1,
  };
}
// N opeenvolgende dagen vanaf startISO met een vaste vorm.
function series(
  startY: number,
  startM: number,
  startD: number,
  vorms: (number | null)[],
): WellnessInput[] {
  return vorms.map((v, i) => {
    const d = new Date(startY, startM - 1, startD + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return wl(iso, v);
  });
}

describe("computeTsbTrend", () => {
  it("gemiddelde over de laatste N rijen met numerieke vorm", () => {
    // 10 dagen, vorm 0..9 (oplopend); window 7 → gemiddelde van 3..9 = 6.
    const w = series(2026, 7, 1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const r = computeTsbTrend(w, "2026-07-10", 7);
    expect(r.n).toBe(7);
    expect(r.trend).toBeCloseTo(6, 5);
  });
  it("negeert null-vorm-rijen", () => {
    const w = series(2026, 7, 1, [10, null, 20, null, 30]);
    const r = computeTsbTrend(w, "2026-07-05", 7);
    expect(r.n).toBe(3);
    expect(r.trend).toBeCloseTo(20, 5);
  });
  it("respecteert datum ≤ todayISO (toekomst telt niet mee)", () => {
    const w = series(2026, 7, 1, [10, 10, 10, 999, 999]); // 07-04/05 = toekomst
    const r = computeTsbTrend(w, "2026-07-03", 7);
    expect(r.n).toBe(3);
    expect(r.trend).toBeCloseTo(10, 5);
  });
  it("geen bruikbare data → trend null", () => {
    expect(computeTsbTrend([], "2026-07-10").trend).toBeNull();
    expect(
      computeTsbTrend(series(2026, 7, 1, [null, null]), "2026-07-10").trend,
    ).toBeNull();
  });
});

describe("fatigueMinDataOk", () => {
  it("≥ 21 vorm-rijen binnen 42 dagen → ok", () => {
    const w = series(2026, 6, 20, new Array(21).fill(0)); // 21 dagen t/m 07-10
    expect(fatigueMinDataOk(w, "2026-07-10")).toBe(true);
  });
  it("20 rijen → onvoldoende", () => {
    const w = series(2026, 6, 21, new Array(20).fill(0));
    expect(fatigueMinDataOk(w, "2026-07-10")).toBe(false);
  });
  it("rijen buiten het 42-daags venster tellen niet", () => {
    // 21 rijen, maar startend ver terug → de meeste vallen buiten 42 dagen van todayISO.
    const w = series(2026, 1, 1, new Array(21).fill(0));
    expect(fatigueMinDataOk(w, "2026-07-10")).toBe(false);
  });
  it("null-vorm-rijen tellen niet mee voor de poort", () => {
    const w = series(2026, 6, 20, new Array(21).fill(null));
    expect(fatigueMinDataOk(w, "2026-07-10")).toBe(false);
  });
});

describe("fatigueTrigger — buffer-grenzen hard", () => {
  const base = { macroFase: "Build", nearTaper: false, minDataOk: true };
  it("deloadweek + TSB net onder de UP-buffer → NIET up", () => {
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 4,
        tsbTrend: UP_TSB_THRESHOLD - 2,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({ ...base, calendarMesoWeek: 4, tsbTrend: 6 }),
    ).toBeNull();
  });
  it("deloadweek + TSB ruim boven de UP-buffer → up", () => {
    expect(fatigueTrigger({ ...base, calendarMesoWeek: 4, tsbTrend: 10 })).toBe(
      "up",
    );
  });
  it("opbouwweek + TSB net boven de DOWN-buffer → NIET down (negatief is normaal)", () => {
    expect(
      fatigueTrigger({ ...base, calendarMesoWeek: 2, tsbTrend: -20 }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 2,
        tsbTrend: DOWN_TSB_THRESHOLD + 5,
      }),
    ).toBeNull();
  });
  it("opbouwweek + TSB diep onder de DOWN-buffer → down", () => {
    expect(
      fatigueTrigger({ ...base, calendarMesoWeek: 2, tsbTrend: -30 }),
    ).toBe("down");
  });
  it("onderdrukt bij Test/Recovery, nearTaper, en !minDataOk", () => {
    expect(
      fatigueTrigger({
        calendarMesoWeek: 4,
        macroFase: "Test",
        nearTaper: false,
        minDataOk: true,
        tsbTrend: 20,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        calendarMesoWeek: 4,
        macroFase: "Recovery",
        nearTaper: false,
        minDataOk: true,
        tsbTrend: 20,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        calendarMesoWeek: 4,
        macroFase: "Build",
        nearTaper: true,
        minDataOk: true,
        tsbTrend: 20,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        calendarMesoWeek: 4,
        macroFase: "Build",
        nearTaper: false,
        minDataOk: false,
        tsbTrend: 20,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        calendarMesoWeek: 4,
        macroFase: "Build",
        nearTaper: false,
        minDataOk: true,
        tsbTrend: null,
      }),
    ).toBeNull();
  });
});

// ── mesoWeekOverride-substitutie via buildWeekProposal (klok gepind) ───────────

describe("mesoWeekOverride-substitutie (buildWeekProposal)", () => {
  const MAANDAG = new Date(2026, 2, 9, 8, 0, 0); // 2026-03-09 ma
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MAANDAG);
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  const S: SettingsInput = {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel: "FTP",
    doelStart: "2026-02-16", // ~3 wk terug → een opbouw-macrofase
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
  };
  const iso = (n: number) => {
    const d = new Date(2026, 2, 9 + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dagen: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: true,
    dag: null,
    minuten: n === 5 ? 120 : 90,
    dagtype: n === 5 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
  const events: EventItem[] = [];
  const acts: ActValuesRow[] = [];
  function build(override?: number) {
    return buildWeekProposal({
      settings: S,
      plannerDays: dagen,
      events,
      activities: acts,
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: iso(0), // ma → de hele week ligt vooruit (alle dagen krijgen sessies)
      mesoWeekOverride: override,
    });
  }
  const weekLoad = (w: ReturnType<typeof build>) =>
    w.days.reduce(
      (acc, d) => acc + d.sessions.reduce((a, s) => a + s.tss, 0),
      0,
    );

  it("override zet ProposalWeek.mesoWeek direct (1 en 4); zonder → kalenderwaarde", () => {
    expect(build(1).mesoWeek).toBe(1);
    expect(build(4).mesoWeek).toBe(4);
    // zonder override = de cyclische kalender-mesoWeek (niet per se 1 of 4).
    expect([1, 2, 3, 4]).toContain(build().mesoWeek);
  });

  it("override 4 (vervroegde deload) < override 1 (normale week) in weekbelasting", () => {
    // mesoWeek 4 = reduced-load-deload (dosis ×0.6 + kwaliteit gestript op één prikkel na);
    // mesoWeek 1 = normale volle week → strikt hogere week-TSS.
    expect(weekLoad(build(4))).toBeLessThan(weekLoad(build(1)));
  });

  it("nearTaper is false zonder aanstaand event", () => {
    expect(build().nearTaper).toBe(false);
  });
});
