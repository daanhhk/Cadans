import type {
  EventItem,
  PlannerDay,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  computeBlockCtlDelta,
  computeTsbTrend,
  deepFatigueThreshold,
  fatigueMinDataOk,
  fatigueTrigger,
  weekFatigueEnabled,
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

describe("computeBlockCtlDelta — ΔCTL-ankers over het blok", () => {
  // wc: een wellness-rij met een gekozen ctl (vorm doet er hier niet toe).
  const wc = (datum: string, ctl: number): WellnessInput => ({
    ...wl(datum, 0),
    ctl,
  });
  // weekMaandag 2026-07-20 → blok-eind-anker 07-19, blok-begin-anker 06-28.
  const MONDAY = "2026-07-20";

  it("exacte ankers → delta = toCtl − fromCtl (1 decimaal)", () => {
    const r = computeBlockCtlDelta(
      [wc("2026-06-28", 50.7), wc("2026-07-19", 45.7)],
      MONDAY,
    );
    expect(r).toEqual({ delta: -5.0, fromCtl: 50.7, toCtl: 45.7 });
  });

  it("een rij op 2 dagen afstand wordt gepakt, op 4 dagen niet", () => {
    // begin-anker 06-28: rij op 06-26 (2 dagen) telt; eind-anker 07-19: enige rij 07-15 (4 dagen) valt buiten → null.
    expect(
      computeBlockCtlDelta(
        [wc("2026-06-26", 50.0), wc("2026-07-15", 45.0)],
        MONDAY,
      ),
    ).toBeNull();
    // met een eind-rij binnen 3 dagen (07-17, 2 dagen) → wél een resultaat.
    const r = computeBlockCtlDelta(
      [wc("2026-06-26", 50.0), wc("2026-07-17", 45.0)],
      MONDAY,
    );
    expect(r).toEqual({ delta: -5.0, fromCtl: 50.0, toCtl: 45.0 });
  });

  it("ontbrekend anker → null", () => {
    // alleen een eind-anker, geen begin-anker binnen tolerantie.
    expect(computeBlockCtlDelta([wc("2026-07-19", 45.7)], MONDAY)).toBeNull();
  });

  it("gelijke afstand → de oudere rij wint (deterministisch)", () => {
    // eind-anker 07-19: rijen op 07-18 en 07-20, beide 1 dag; de oudere (07-18) telt.
    const r = computeBlockCtlDelta(
      [wc("2026-06-28", 50.0), wc("2026-07-18", 44.0), wc("2026-07-20", 46.0)],
      MONDAY,
    );
    expect(r?.toCtl).toBe(44.0);
  });
});

describe("deepFatigueThreshold — schaal-relatieve Form-put", () => {
  it("CTL 45 → −11,25 (de fractie wint van de vloer)", () => {
    expect(deepFatigueThreshold(45)).toBeCloseTo(-11.25, 5);
  });
  it("CTL 30 → −10 (de vloer wint)", () => {
    expect(deepFatigueThreshold(30)).toBe(-10);
  });
});

describe("fatigueTrigger — blok-signaal", () => {
  const base = { macroFase: "Build", nearTaper: false, minDataOk: true };

  it("juli-blok (mesoWeek 4, ΔCTL −5,0, TSB 4,4) → up", () => {
    // Echte recon-data: kalender-deload zonder opbouw → doortrainen; TSB speelt geen rol voor UP.
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 4,
        ctlDelta: -5.0,
        ctlNow: 45.7,
        tsbTrend: 4.4,
      }),
    ).toBe("up");
  });

  it("april-blok (mesoWeek 2, ΔCTL +12,0, TSB −17, CTL 48) → null (AND-regel houdt DOWN stil)", () => {
    // Diepe TSB maar productieve overload → geen vervroegde deload; dat is het vangnet-gedrag.
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 2,
        ctlDelta: 12.0,
        ctlNow: 48,
        tsbTrend: -17,
      }),
    ).toBeNull();
  });

  it("plateau-grens: ΔCTL exact +1,0 op mesoWeek 4 → up, +1,1 → null", () => {
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 4,
        ctlDelta: 1.0,
        ctlNow: 45,
        tsbTrend: 3,
      }),
    ).toBe("up");
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 4,
        ctlDelta: 1.1,
        ctlNow: 45,
        tsbTrend: 3,
      }),
    ).toBeNull();
  });

  it("echt DOWN-geval (mesoWeek 2, ΔCTL −3, CTL 45, TSB −12) → down", () => {
    // deepFatigueThreshold(45) = −11,25; −12 < −11,25 → de put is diep genoeg.
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 2,
        ctlDelta: -3,
        ctlNow: 45,
        tsbTrend: -12,
      }),
    ).toBe("down");
  });

  it("DOWN: geen opbouw maar de Form-put is niet diep genoeg → null", () => {
    // −10 < −11,25 is onwaar → geen vervroegde deload.
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 2,
        ctlDelta: -3,
        ctlNow: 45,
        tsbTrend: -10,
      }),
    ).toBeNull();
  });

  it("ontbrekend blok-anker (ctlDelta null) → null", () => {
    expect(
      fatigueTrigger({
        ...base,
        calendarMesoWeek: 4,
        ctlDelta: null,
        ctlNow: 45,
        tsbTrend: 4,
      }),
    ).toBeNull();
  });

  it("onderdrukt bij Test/Recovery, nearTaper, en !minDataOk", () => {
    // Elk geval zou zonder de onderdrukking "up" geven (mesoWeek 4, ΔCTL −5).
    const up = { calendarMesoWeek: 4, ctlDelta: -5, ctlNow: 45, tsbTrend: 4 };
    expect(
      fatigueTrigger({
        ...up,
        macroFase: "Test",
        nearTaper: false,
        minDataOk: true,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        ...up,
        macroFase: "Recovery",
        nearTaper: false,
        minDataOk: true,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        ...up,
        macroFase: "Build",
        nearTaper: true,
        minDataOk: true,
      }),
    ).toBeNull();
    expect(
      fatigueTrigger({
        ...up,
        macroFase: "Build",
        nearTaper: false,
        minDataOk: false,
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

describe("weekFatigueEnabled — week-brede fatigue-kaart gegate op de mesocyclus-profielvlag", () => {
  it("Onderhoud (mesoCyclus:false) → false", () => {
    expect(weekFatigueEnabled("Onderhoud")).toBe(false);
  });
  it("de vier doelen met mesocyclus → true", () => {
    for (const d of ["FTP", "Conditie", "Beklimmingen", "VO2max"]) {
      expect(weekFatigueEnabled(d)).toBe(true);
    }
  });
  it("leeg of onbekend doel → true (fail-open, klim-fallback zonder de vlag)", () => {
    expect(weekFatigueEnabled("")).toBe(true);
    expect(weekFatigueEnabled(null)).toBe(true);
    expect(weekFatigueEnabled("Iets Onbekends")).toBe(true);
  });
});
