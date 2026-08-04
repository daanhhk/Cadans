import { describe, expect, it } from "vitest";
import type { ProposalWeek } from "./proposal";
import type { SchemaDay, SchemaDayCoach, SchemaSession } from "./schema";
import {
  openSleutelDagen,
  planDraagtSleutelzone_,
  sleutelPrikkelOpen,
} from "./sleutelinhaal";

// ROADMAP punt 27 — DE LANGE RIT MET EFFORTS TELT NIET ALS SLEUTELSESSIE.
//
// `combo_long_with_efforts` staat niet in `COACH_TYPE_INTENT_`, dus `intentFromType_` valt door
// naar de terugval-scan, herkent "long" en levert "duur" — geen sleutel. GEMETEN gevolg: in 44 van
// de 119 vuur-cellen meldt de weekstem dat er geen trainingsdag meer staat, terwijl er een
// zaterdag staat met 30,0 tot 32,4 drempel-minuten. Zie docs/PUNT10-FASE-B-DEEL2-VERDICT.md §3.
//
// DEZE TESTS WONEN IN apps/web EN NIET IN DE ENGINE-SELFTEST, en dat is geen ontwijking van een
// vloer: ze vouwen met `werkzoneLabelsVan_` uit `zonelabels.ts`, en `packages/engine` kan per
// constructie niet uit `apps/web` importeren.

const TODAY = "2026-07-29"; // woensdag

function sessie(naam: string, minuten: number): SchemaSession {
  return {
    naam,
    focus: null,
    zones: [],
    totaalMin: minuten,
    tss: 0,
    structuur: [],
    blokken: [],
    eindopmerking: null,
  };
}

function coach(o: Partial<SchemaDayCoach>): SchemaDayCoach {
  return {
    state: "missed",
    plannedIntent: null,
    doneIntent: null,
    planned: null,
    narrative: null,
    ...o,
  };
}

function dag(o: Partial<SchemaDay> & { datum: string }): SchemaDay {
  return {
    dagIdx: 0,
    weekday: "za",
    dayNum: Number(o.datum.slice(8, 10)),
    state: "planned",
    isToday: false,
    voorgesteldType: null,
    reden: null,
    redenCode: null,
    sessions: [],
    planSessions: [],
    doneTss: 0,
    done: null,
    doneCompare: null,
    dispositie: null,
    coach: null,
    ...o,
  } as SchemaDay;
}

/** Rauwe blokken zoals de engine ze levert: een `zone`-label plus minuten. */
const blok = (zone: string, minuten: number) => ({ zone, minuten });

/** Een ProposalWeek met per datum de rauwe blokken van de (enige) sessie. */
function week(perDatum: Record<string, unknown[]>): ProposalWeek {
  return {
    days: Object.entries(perDatum).map(([datum, blokken]) => ({
      datum,
      sessions: [{ blokken }],
      plannedForDone: null,
    })),
  } as unknown as ProposalWeek;
}

// De efforts-rit zoals de planner hem levert: type `combo_long_with_efforts` — dus GEEN
// sleutel-type — met een core die nominaal `drempel` heet.
const EFFORTS_BLOKKEN = [
  blok("z2", 60),
  blok("drempel", 18.8),
  blok("anaeroob", 11.3),
  blok("z2", 30),
];

describe("punt 27 — het predicaat", () => {
  it("drempel en anaeroob tellen als sleutelzone", () => {
    expect(planDraagtSleutelzone_([blok("drempel", 20)])).toBe(true);
    expect(planDraagtSleutelzone_([blok("anaeroob", 8)])).toBe(true);
    expect(planDraagtSleutelzone_(EFFORTS_BLOKKEN)).toBe(true);
  });

  it("TEGENPROEF: tempo alleen is GEEN sleutelzone", () => {
    // `COACH_KEY_INTENTS_` kent tempo niet. Zou tempo hier wel meetellen, dan noemt de app een
    // gewone tempo-rit een sleutelsessie — de term zou te breed zijn.
    expect(planDraagtSleutelzone_([blok("z2", 60), blok("tempo", 25)])).toBe(
      false,
    );
    expect(planDraagtSleutelzone_([blok("z2", 90)])).toBe(false);
    expect(planDraagtSleutelzone_([])).toBe(false);
    // Een blok van nul minuten schrijft niets voor.
    expect(planDraagtSleutelzone_([blok("drempel", 0)])).toBe(false);
  });
});

describe("punt 27 — T1/T2: de resterende efforts-dag telt mee", () => {
  const zaterdag = dag({
    datum: "2026-08-01",
    weekday: "za",
    voorgesteldType: "combo_long_with_efforts",
    planSessions: [sessie("Lange rit met efforts", 180)],
  });
  const W = week({ "2026-08-01": EFFORTS_BLOKKEN });

  it("T1 openSleutelDagen noemt de resterende efforts-dag", () => {
    const uit = openSleutelDagen([zaterdag], TODAY, W);
    expect(uit.map((d) => d.datum)).toEqual(["2026-08-01"]);
    expect(uit[0].naam).toBe("Lange rit met efforts");
  });

  it("T1 TEGENPROEF: zonder de rauwe blokken ziet hij hem niet", () => {
    // Precies het gedrag van vóór deze bouw — de type-toets alleen laat hem vallen.
    expect(openSleutelDagen([zaterdag], TODAY, week({}))).toEqual([]);
  });

  it("T2 de weekstem zwijgt zolang die dag er nog staat", () => {
    // Poort 2 van de weekstem IS `openSleutelDagen(...).length > 0`. Staat de dag erin, dan heeft
    // de stem niets toe te voegen en zwijgt hij.
    expect(openSleutelDagen([zaterdag], TODAY, W).length).toBeGreaterThan(0);
  });
});

describe("punt 27 — T3/T4: beide takken van poort 1", () => {
  const D = "2026-07-27";
  const W = week({ [D]: EFFORTS_BLOKKEN });

  it("T3 GEMIST: een niet-gereden efforts-dag staat open", () => {
    const d = dag({
      datum: D,
      state: "gemist",
      voorgesteldType: "combo_long_with_efforts",
      // `plannedIntent` is "duur" — precies de verkeerde classificatie die dit punt repareert.
      coach: coach({ state: "missed", plannedIntent: "duur" }),
    });
    expect(sleutelPrikkelOpen(d, W)).toBe(true);
    expect(sleutelPrikkelOpen(d, week({}))).toBe(false);
  });

  it("T4 DIFFERENT: een te licht gereden efforts-dag staat open", () => {
    const d = dag({
      datum: D,
      state: "done",
      voorgesteldType: "combo_long_with_efforts",
      coach: coach({
        state: "different",
        plannedIntent: "duur",
        doneIntent: "duur",
      }),
    });
    expect(sleutelPrikkelOpen(d, W)).toBe(true);
    expect(sleutelPrikkelOpen(d, week({}))).toBe(false);
  });

  it("de DONE-kant blijft ongemoeid: drempel gereden sluit de prikkel", () => {
    const d = dag({
      datum: D,
      state: "done",
      voorgesteldType: "combo_long_with_efforts",
      coach: coach({
        state: "different",
        plannedIntent: "duur",
        doneIntent: "drempel",
      }),
    });
    expect(sleutelPrikkelOpen(d, W)).toBe(false);
  });

  it("TEGENPROEF: een dag met alleen tempo-blokken staat NIET open", () => {
    const d = dag({
      datum: D,
      state: "gemist",
      voorgesteldType: "tempo",
      coach: coach({ state: "missed", plannedIntent: "tempo" }),
    });
    expect(
      sleutelPrikkelOpen(d, week({ [D]: [blok("z2", 60), blok("tempo", 25)] })),
    ).toBe(false);
  });
});
