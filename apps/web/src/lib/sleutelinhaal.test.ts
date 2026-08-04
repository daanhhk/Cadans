import { describe, expect, it } from "vitest";
import type { ProposalWeek } from "./proposal";
import type { SchemaDay, SchemaDayCoach, SchemaSession } from "./schema";
import {
  isSleutelIntent,
  openSleutelDagen,
  sleutelPrikkelOpen,
} from "./sleutelinhaal";

const TODAY = "2026-07-29"; // woensdag

// ROADMAP punt 27 — de nieuwe parameter is VERPLICHT, zodat een aanroeper die hem vergeet niet
// stil terugvalt op niets. Deze fixtures dragen geen rauwe blokken, dus de optellende term is
// er per constructie inert en het bestaande gedrag blijft precies staan.
const GEEN_WEEK = { days: [] } as unknown as ProposalWeek;

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
  const d = Number(o.datum.slice(8, 10));
  return {
    dagIdx: 0,
    weekday: "wo",
    dayNum: d,
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

describe("isSleutelIntent — de lijst komt uit de engine", () => {
  it("kent drempel, vo2 en sweetspot als sleutel", () => {
    expect(isSleutelIntent("drempel")).toBe(true);
    expect(isSleutelIntent("vo2")).toBe(true);
    expect(isSleutelIntent("sweetspot")).toBe(true);
  });
  it("kent duur, tempo, herstel en leeg NIET als sleutel", () => {
    expect(isSleutelIntent("duur")).toBe(false);
    expect(isSleutelIntent("tempo")).toBe(false);
    expect(isSleutelIntent("herstel")).toBe(false);
    expect(isSleutelIntent(null)).toBe(false);
  });
});

describe("sleutelPrikkelOpen — twee poorten, en alleen die twee", () => {
  it("gemist met een sweet_spot-plan is OPEN", () => {
    const d = dag({
      datum: "2026-07-27",
      state: "gemist",
      coach: coach({ state: "missed", plannedIntent: "sweetspot" }),
    });
    expect(sleutelPrikkelOpen(d, GEEN_WEEK)).toBe(true);
  });

  it("gemist met een long_z2-plan is NIET open", () => {
    const d = dag({
      datum: "2026-07-27",
      state: "gemist",
      coach: coach({ state: "missed", plannedIntent: "duur" }),
    });
    expect(sleutelPrikkelOpen(d, GEEN_WEEK)).toBe(false);
  });

  it("different met een sleutel-plan en DUUR gereden is OPEN", () => {
    const d = dag({
      datum: "2026-07-27",
      state: "done",
      coach: coach({
        state: "different",
        plannedIntent: "sweetspot",
        doneIntent: "duur",
      }),
    });
    expect(sleutelPrikkelOpen(d, GEEN_WEEK)).toBe(true);
  });

  it("different met een sleutel-plan en DREMPEL gereden is NIET open", () => {
    const d = dag({
      datum: "2026-07-27",
      state: "done",
      coach: coach({
        state: "different",
        plannedIntent: "sweetspot",
        doneIntent: "drempel",
      }),
    });
    expect(sleutelPrikkelOpen(d, GEEN_WEEK)).toBe(false);
  });

  it("on-plan met een sleutel-plan is NIET open, en een dag zonder coach evenmin", () => {
    expect(
      sleutelPrikkelOpen(
        dag({
          datum: "2026-07-27",
          state: "done",
          coach: coach({
            state: "on-plan",
            plannedIntent: "sweetspot",
            doneIntent: "sweetspot",
          }),
        }),
        GEEN_WEEK,
      ),
    ).toBe(false);
    expect(sleutelPrikkelOpen(dag({ datum: "2026-07-30" }), GEEN_WEEK)).toBe(
      false,
    );
  });
});

describe("openSleutelDagen — wie kan de prikkel nog dragen", () => {
  const donderdag = dag({
    datum: "2026-07-30",
    weekday: "do",
    voorgesteldType: "threshold",
    planSessions: [sessie("Drempel 3×10", 60)],
  });
  const zaterdag = dag({
    datum: "2026-08-01",
    weekday: "za",
    voorgesteldType: "sweet_spot",
    planSessions: [sessie("Sweet Spot 2×20", 90)],
  });
  const rustdag = dag({ datum: "2026-07-31", weekday: "vr" });
  const gedaan = dag({
    datum: "2026-07-30",
    weekday: "do",
    voorgesteldType: "sweet_spot",
    planSessions: [sessie("Sweet Spot 3×8", 60)],
    done: { tss: 50 } as SchemaDay["done"],
  });
  const verstreken = dag({
    datum: "2026-07-27",
    weekday: "ma",
    voorgesteldType: "sweet_spot",
    planSessions: [sessie("Sweet Spot over/under", 45)],
  });
  const duurdag = dag({
    datum: "2026-08-01",
    weekday: "za",
    voorgesteldType: "long_z2",
    planSessions: [sessie("Lange duurrit", 180)],
  });

  it("geeft alleen toekomstige, niet-gedane dagen met een sleutel-type, op datum", () => {
    const uit = openSleutelDagen(
      [verstreken, donderdag, rustdag, zaterdag, duurdag],
      TODAY,
      GEEN_WEEK,
    );
    expect(uit.map((d) => d.datum)).toEqual(["2026-07-30", "2026-08-01"]);
    expect(uit[0]).toEqual({
      datum: "2026-07-30",
      weekday: "do",
      dayNum: 30,
      naam: "Drempel 3×10",
      minuten: 60,
    });
  });

  it("een GEDANE dag valt eruit, ook met een sleutel-type", () => {
    expect(openSleutelDagen([gedaan], TODAY, GEEN_WEEK)).toEqual([]);
  });

  it("een RUSTDAG valt eruit (geen planSessions)", () => {
    expect(openSleutelDagen([rustdag], TODAY, GEEN_WEEK)).toEqual([]);
  });

  it("een VERSTREKEN dag valt eruit, ook met een sleutel-type", () => {
    expect(openSleutelDagen([verstreken], TODAY, GEEN_WEEK)).toEqual([]);
  });

  it("een DUUR-dag valt eruit (geen sleutel-type)", () => {
    expect(openSleutelDagen([duurdag], TODAY, GEEN_WEEK)).toEqual([]);
  });

  // De TWEEDE render-tak, geen randgeval: de week is op en de kaart meldt dat eerlijk.
  it("week op: geen dag meer na vandaag geeft een LEGE lijst", () => {
    expect(openSleutelDagen([verstreken, rustdag], TODAY, GEEN_WEEK)).toEqual(
      [],
    );
    expect(openSleutelDagen([], TODAY, GEEN_WEEK)).toEqual([]);
    expect(openSleutelDagen(null, TODAY, GEEN_WEEK)).toEqual([]);
  });
});
