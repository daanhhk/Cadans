import { workoutZones } from "@cadans/engine";
import type { DayOverride } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ProposalDay, ProposalWeek } from "./proposal";
import {
  buildVerlichtVoorstel,
  deriveSchemaView,
  type SchemaDay,
  verlichtResultaat,
} from "./schema";

const TODAY = "2026-03-11";

function day(o: Partial<SchemaDay> = {}): SchemaDay {
  return {
    datum: TODAY,
    dagIdx: 2,
    weekday: "wo",
    dayNum: 11,
    state: "today",
    isToday: true,
    voorgesteldType: "threshold",
    reden: null,
    redenCode: null,
    sessions: [
      {
        naam: "Drempel 3×10",
        focus: null,
        zones: ["low", "high"],
        totaalMin: 75,
        tss: 80,
        structuur: [],
        blokken: [],
        eindopmerking: null,
      },
    ],
    doneTss: 0,
    done: null,
    doneCompare: null,
    dispositie: null,
    coach: null,
    override: null,
    ...o,
  };
}

const V = (d: SchemaDay, fase = "Build", band: any = "caution", score = 55) =>
  buildVerlichtVoorstel(d, fase, band, score, "FTP");

describe("buildVerlichtVoorstel — condities (meetlat GAS WebApp.gs:1201-1215)", () => {
  it("caution + harde sessie vandaag → voorstel met gedemoot type", () => {
    const v = V(day());
    expect(v).not.toBeNull();
    expect(v?.fromType).toBe("threshold");
    expect(v?.toType).toBe("tempo"); // DEMOTE_MAP
    expect(v?.toNaam).toBe("Tempo-rit");
    expect(v?.band).toBe("caution");
  });

  it("rest → herstelrit", () => {
    const v = V(day(), "Build", "rest");
    expect(v?.toType).toBe("recovery");
    expect(v?.toNaam).toBe("Herstelrit");
  });

  it("band 'ready' of null → geen voorstel", () => {
    expect(V(day(), "Build", "ready")).toBeNull();
    expect(V(day(), "Build", null)).toBeNull();
  });

  it("niet vandaag → geen voorstel", () => {
    expect(V(day({ isToday: false, datum: "2026-03-12" }))).toBeNull();
  });

  it("Taper/Recovery-fase → geen voorstel (readinessAdjust_ keept)", () => {
    expect(V(day(), "Taper")).toBeNull();
    expect(V(day(), "Recovery")).toBeNull();
  });

  it("niet-harde sessie → geen voorstel", () => {
    // long_z2 draagt geen high/anaerobic → isHard false.
    expect(workoutZones("long_z2", "FTP")).not.toContain("high");
    const v = V(
      day({
        voorgesteldType: "long_z2",
        sessions: [
          {
            naam: "Duurrit",
            focus: null,
            zones: ["low"],
            totaalMin: 120,
            tss: 70,
            structuur: [],
            blokken: [],
            eindopmerking: null,
          },
        ],
      }),
    );
    expect(v).toBeNull();
  });

  it("al gereden (done) of gemist → geen voorstel", () => {
    expect(V(day({ state: "done" }))).toBeNull();
    expect(V(day({ state: "gemist" }))).toBeNull();
  });

  it("bestaande override → geen voorstel (handmatig wint; akkoord is al gegeven)", () => {
    const ov: DayOverride = {
      type: "library",
      workoutType: "tempo",
      durMin: 60,
    };
    expect(V(day({ override: ov }))).toBeNull();
  });

  it("rustdag (0 sessies) en pendel-multisessie (>1) → geen voorstel", () => {
    expect(V(day({ sessions: [] }))).toBeNull();
    const s = day().sessions[0];
    expect(V(day({ sessions: [s, s] }))).toBeNull(); // GAS-skip op wp.sessies.length > 1
  });
});

describe("buildVerlichtVoorstel — override-VORM (library vs free)", () => {
  it("toType in OVERRIDE_WORKOUT_TYPES → library-override met src 'readiness'", () => {
    const v = V(day());
    expect(v?.override.type).toBe("library");
    if (v?.override.type === "library") {
      expect(v.override.workoutType).toBe("tempo");
      // T28 2a-ii: caution maakt de dag óók korter → 75 × 0,8 = 60.
      expect(v.override.durMin).toBe(60);
    }
    expect(v?.override.src).toBe("readiness");
    expect(v?.override.label).toBe("Verlicht naar Tempo-rit");
  });

  it("toType BUITEN de lijst → free-override (zou als library een 400 geven)", () => {
    // combo_all_three demoot naar combo_long_with_efforts; dat type staat NIET in
    // OVERRIDE_WORKOUT_TYPES → moet de free-variant worden (zoals GAS altijd doet).
    const zs = workoutZones("combo_all_three", "FTP");
    expect(zs.some((z) => z === "high" || z === "anaerobic")).toBe(true);
    const v = V(
      day({
        voorgesteldType: "combo_all_three",
        sessions: [
          {
            naam: "Combo",
            focus: null,
            zones: ["low", "high", "anaerobic"],
            totaalMin: 120,
            tss: 110,
            structuur: [],
            blokken: [],
            eindopmerking: null,
          },
        ],
      }),
    );
    expect(v?.toType).toBe("combo_long_with_efforts");
    expect(v?.override.type).toBe("free");
    if (v?.override.type === "free") {
      expect(v.override.ritType).toBe("vrij");
      expect(["rustig", "tempo"]).toContain(v.override.intensiteit);
    }
    expect(v?.override.src).toBe("readiness");
  });

  it("durMin volgt de geplande sessieduur, met de contract-ondergrens 20", () => {
    const s = { ...day().sessions[0], totaalMin: 5 };
    const v = V(day({ sessions: [s] }));
    // caution op een threshold-dag → library-override (tempo); die draagt durMin.
    expect(v?.override.type).not.toBe("rest");
    if (v && v.override.type !== "rest") expect(v.override.durMin).toBe(20);
  });
});

describe("T28 2a-ii — korter (caution) + rust-keuze (rest)", () => {
  it("caution: durMin is ~0,8× de geplande duur", () => {
    // sessie 75 min → 75 × 0,8 = 60.
    const v = V(day());
    expect(v?.override.type).not.toBe("rest");
    if (v && v.override.type !== "rest") expect(v.override.durMin).toBe(60);
  });

  it("caution: clamp op de contract-ondergrens 20", () => {
    const s = { ...day().sessions[0], totaalMin: 22 }; // 22 × 0,8 = 17,6 → 20
    const v = V(day({ sessions: [s] }));
    if (v && v.override.type !== "rest") expect(v.override.durMin).toBe(20);
  });

  it("caution: GEEN rust-keuze (alleen bij lage gereedheid)", () => {
    const v = V(day());
    expect(v?.restOverride ?? null).toBeNull();
    expect(v?.restActieLabel ?? null).toBeNull();
  });

  it("rest: herstelrit BLIJFT de aanbeveling + rust als tweede keuze", () => {
    const v = V(day(), "Build", "rest");
    // primaire aanbeveling ongewijzigd
    expect(v?.toType).toBe("recovery");
    expect(v?.override.type).not.toBe("rest");
    // secundaire keuze
    expect(v?.restOverride).toEqual({
      type: "rest",
      src: "readiness",
      label: "Rust gehouden",
    });
    expect(v?.restActieLabel).toBe("Rust vandaag");
  });

  it("aanbod-copy noemt korter (caution) resp. de rust-optie (rest)", () => {
    expect(V(day())?.regel).toContain("iets korter");
    expect(V(day(), "Build", "rest")?.regel).toContain("helemaal over");
    // nog steeds voorwaardelijk, geen daad-claim
    expect(V(day())?.regel).not.toContain("Ik heb");
    expect(V(day(), "Build", "rest")?.regel).not.toContain("Ik heb");
  });

  it("verlichtResultaat op een rust-override → eigen regel (er is niet gereden)", () => {
    const v = V(day(), "Build", "rest");
    const r = verlichtResultaat(v?.restOverride ?? null);
    expect(r).toBe(
      "Rust gehouden vandaag — dit is waar de aanpassing gebeurt.",
    );
    // en die verschilt van de spin-variant
    expect(r).not.toBe(verlichtResultaat(v?.override ?? null));
  });

  it("rust-override zonder src 'readiness' → geen coachregel", () => {
    expect(verlichtResultaat({ type: "rest" })).toBeNull();
  });
});

describe("copy — voorwaardelijk (biedt aan, claimt niet)", () => {
  it("aanbod-regel caution: 'Ik kan', geen voltooide daad", () => {
    const v = V(day());
    expect(v?.regel).toBe(
      "Je gereedheid is vanochtend matig (55). Ik kan je Drempel 3×10 verlichten naar Tempo-rit en iets korter maken — fris train je de kwaliteit beter.",
    );
    expect(v?.regel).not.toContain("Ik heb");
  });

  it("aanbod-regel rest", () => {
    const v = V(day(), "Build", "rest", 40);
    expect(v?.regel).toBe(
      "Je gereedheid is laag (40). Een zware sessie stapelt nu vooral vermoeidheid. Ik kan er een rustige rit van maken, of je slaat 'm helemaal over — allebei prima vandaag.",
    );
  });

  it("actie-label matcht de badge op de override", () => {
    const c = V(day());
    expect(c?.actieLabel).toBe("Verlicht naar Tempo-rit");
    expect(c?.override.label).toBe("Verlicht naar Tempo-rit");
    const r = V(day(), "Build", "rest");
    expect(r?.actieLabel).toBe("Maak rustig");
    expect(r?.override.label).toBe("Rustig gehouden");
  });
});

describe("verlichtResultaat — coachregel ná akkoord", () => {
  it("readiness-override caution → resultaatregel met de toNaam", () => {
    const v = V(day());
    expect(verlichtResultaat(v?.override ?? null)).toBe(
      "Verlicht naar Tempo-rit — fris voor de kwaliteit later.",
    );
  });

  it("readiness-override rest → herstel-regel", () => {
    const v = V(day(), "Build", "rest");
    expect(verlichtResultaat(v?.override ?? null)).toBe(
      "Rustig gehouden vandaag — herstel telt nu zwaarder.",
    );
  });

  it("handmatige override (geen src) → GEEN coachregel", () => {
    expect(
      verlichtResultaat({ type: "library", workoutType: "tempo", durMin: 60 }),
    ).toBeNull();
    expect(verlichtResultaat(null)).toBeNull();
  });
});

describe("deriveSchemaView — verlicht op de view", () => {
  const pday = (datum: string, o: Partial<ProposalDay> = {}): ProposalDay => ({
    datum,
    dagIdx: 0,
    voorgesteldType: "threshold",
    reden: null,
    redenCode: null,
    archetypeId: null,
    override: null,
    sessions: [
      {
        naam: "Drempel 3×10",
        zones: ["low", "high"],
        totaalMin: 75,
        tss: 80,
      },
    ],
    plannedForDone: null,
    ...o,
  });
  const pweek = (days: ProposalDay[], fase = "Build"): ProposalWeek => ({
    weekMonday: "2026-03-09",
    macroFase: "Build",
    mesoWeek: 0,
    fase,
    eventNaam: null,
    wekenTotEvent: null,
    planModus: null,
    profielPreset: null,
    days,
  });
  const rdy = (band: any, score: number | null) =>
    ({
      score,
      band,
      factors: [],
      chips: [],
      checkinDone: false,
      checkinDelta: 0,
      checkinSummary: "",
      checkin: null,
    }) as never;

  it("caution → view.verlicht gevuld voor vandaag", () => {
    const v = deriveSchemaView(
      pweek([pday(TODAY)]),
      {},
      TODAY,
      {},
      rdy("caution", 55),
      { doel: "FTP" } as never,
    );
    expect(v.verlicht).not.toBeNull();
    expect(v.verlicht?.datum).toBe(TODAY);
  });

  it("geen readiness meegegeven → null (geen voorstel, geen crash)", () => {
    const v = deriveSchemaView(pweek([pday(TODAY)]), {}, TODAY, {});
    expect(v.verlicht).toBeNull();
  });
});
