import { describe, expect, it } from "vitest";
import type { BlokReview } from "./blok";
import {
  blokReviewRegel,
  coachNarrative,
  faseOvergangRegel,
} from "./coachNarrative";

// De 3 warm-varianten van key_session (uit de pool) — voor de fallback-assert.
const KEY_WARM = [
  "Dit is je sleutelsessie deze week — de training die je echt vooruit helpt. Ga er met focus in.",
  "Vandaag de belangrijkste prikkel van je blok. Geef 'm de aandacht die-ie verdient, hier zit je progressie.",
  "Je sleutelsessie staat op het menu. Dit is waar je fitheid groeit — maak 'm af.",
];

describe("coachNarrative", () => {
  it("seed-determinisme: zelfde datum+code+persona → zelfde zin", () => {
    const a = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "warm",
    );
    const b = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "warm",
    );
    expect(a).toBe(b);
    expect(KEY_WARM).toContain(a);
  });

  it("seed varieert over datums (niet één vaste zin)", () => {
    const picks = new Set(
      [
        "2026-03-09",
        "2026-03-10",
        "2026-03-11",
        "2026-03-12",
        "2026-03-13",
      ].map((dt) => coachNarrative("demote_recent_hard", "x", dt, "warm")),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("fallback: ontbrekende persona (disciplined) → warm-tekst", () => {
    const r = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "disciplined",
    );
    expect(KEY_WARM).toContain(r); // warm-pool gebruikt (disciplined leeg)
  });

  it("null code → droge reden terug; null reden → null", () => {
    expect(coachNarrative(null, "Rustige dag", "2026-03-11", "warm")).toBe(
      "Rustige dag",
    );
    expect(coachNarrative(null, null, "2026-03-11", "warm")).toBeNull();
  });

  it("onbekende code → droge reden terug (vangnet)", () => {
    expect(
      coachNarrative("does_not_exist", "Kale reden", "2026-03-11", "warm"),
    ).toBe("Kale reden");
  });

  it("default persona = warm", () => {
    const withDefault = coachNarrative("commute", "Pendelrit", "2026-03-11");
    const explicit = coachNarrative(
      "commute",
      "Pendelrit",
      "2026-03-11",
      "warm",
    );
    expect(withDefault).toBe(explicit);
    expect(withDefault).not.toBe("Pendelrit"); // warme zin, niet de droge reden
  });
});

describe("faseOvergangRegel", () => {
  it("naar taper: noemt taper + fris aan de start; M55-veilig", () => {
    const r = faseOvergangRegel({
      naar: "Taper",
      eventNaam: "Marmotte",
      wekenTotEvent: 1,
    });
    expect(r).toContain("taper");
    expect(r).toContain("fris aan de start");
    expect(r).toContain("Marmotte");
    expect(r).toContain("1 week"); // enkelvoud
    expect(r.startsWith("Vanaf deze week")).toBe(true);
    expect(r).not.toMatch(/Ik heb/i);
  });

  it("zonder event: de regel loopt en laat het event-deel weg", () => {
    const r = faseOvergangRegel({
      naar: "Build",
      eventNaam: null,
      wekenTotEvent: null,
    });
    expect(r).toContain("opbouw");
    expect(r).not.toContain("richting");
    expect(r.startsWith("Vanaf deze week")).toBe(true);
  });

  it("naar herstel: noemt het event bij naam, ZONDER countdown ('nog 0 weken')", () => {
    const r = faseOvergangRegel({
      naar: "Recovery",
      eventNaam: "Doelrace",
      wekenTotEvent: 0,
    });
    expect(r).toContain("Doelrace zit erop");
    expect(r).toContain("herstel");
    expect(r).not.toContain("weken");
    expect(r).not.toContain("(nog");
    expect(r).not.toMatch(/Ik heb/i);
  });
});

describe("blokReviewRegel — de vijf takken", () => {
  function review(o: Partial<BlokReview> = {}): BlokReview {
    return {
      startMonday: "2026-06-29",
      eindMonday: "2026-07-20",
      fase: "afgerond",
      doel: "FTP",
      norm: 84,
      normTempo: 24,
      normDrempel: 47,
      normAnaeroob: 13,
      weekUren: 5,
      // ROADMAP punt 14 fase 1 — de zone-norm-zin noemt alleen zones die in een MEEGETELDE week
      // zijn voorgeschreven. Deze fixture opent alle drie, want deze tests gaan over de
      // COPY-TAKKEN en niet over de zone-poort; de poort zelf heeft zijn eigen tests in blok.test.
      weeks: [
        {
          telt: true,
          zonesVoorgeschreven: ["tempo", "drempel", "anaeroob"],
        } as unknown as BlokReview["weeks"][number],
      ],
      uitvoering: {
        geleverd: true,
        geleverdeWeken: 3,
        beoordeeldeWeken: 3,
        tekortZones: [],
        verschuiving: false,
      },
      check: {
        uitkomst: "geleverd_niet_gestegen",
        geleverdeWeken: 3,
        beoordeeldeWeken: 3,
        ctlDelta: -5,
        gestegen: false,
      },
      ctlDelta: -5,
      effect: null,
      ...o,
    };
  }

  // ZONE-MUNT fase 1b — het getal dat de coach noemt is het getal waarop het oordeel viel, en dat
  // zijn sinds 1b de drie zone-normen, niet één totaal van 84.
  it("geleverd_niet_gestegen: het plan was te licht, de dosis mag omhoog", () => {
    const r = blokReviewRegel(review());
    expect(r).toContain("3 van de 3 opbouwweken");
    expect(r).toContain("24 Tempo, 47 Drempel en 13 VO2max minuten");
    expect(r).not.toContain("84 minuten");
    expect(r).toContain("zakte je CTL met 5,0");
    expect(r).toMatch(/dosis/);
  });

  it("geleverd_gestegen: een trede erbij", () => {
    const r = blokReviewRegel(
      review({
        check: {
          uitkomst: "geleverd_gestegen",
          geleverdeWeken: 3,
          beoordeeldeWeken: 3,
          ctlDelta: 4,
          gestegen: true,
        },
        ctlDelta: 4,
      }),
    );
    expect(r).toContain("3 van de 3 opbouwweken");
    expect(r).toContain("4,0");
    expect(r).toContain("trede");
  });

  it("niet_geleverd: de dosis blijft staan", () => {
    const r = blokReviewRegel(
      review({
        uitvoering: {
          geleverd: false,
          geleverdeWeken: 1,
          beoordeeldeWeken: 3,
          tekortZones: ["drempel"],
          verschuiving: false,
        },
        check: {
          uitkomst: "niet_geleverd",
          geleverdeWeken: 1,
          beoordeeldeWeken: 3,
          ctlDelta: -5,
          gestegen: false,
        },
      }),
    );
    expect(r).toContain("1 van de 3 opbouwweken");
    expect(r).toMatch(/blijft staan/);
    // Congruentie bij 1: enkelvoud, en het blok als onderwerp krijgt een lidwoord.
    expect(r).not.toMatch(/opbouwweken (haalden|kwamen)/);
    expect(r).not.toMatch(/zegt vorig blok/);
  });

  it("niet_geleverd bij 2 van de 3: meervoud", () => {
    const r = blokReviewRegel(
      review({
        startMonday: "2026-05-04",
        uitvoering: {
          geleverd: false,
          geleverdeWeken: 2,
          beoordeeldeWeken: 3,
          tekortZones: ["drempel"],
          verschuiving: false,
        },
        check: {
          uitkomst: "niet_geleverd",
          geleverdeWeken: 2,
          beoordeeldeWeken: 3,
          ctlDelta: -5,
          gestegen: false,
        },
      }),
    );
    expect(r).toMatch(/2 van de 3 opbouwweken (haalden|kwamen)/);
  });

  it("niet-opbouwdoel, wel geleverd: frequentie is de hele vraag, zakkende CTL hoort erbij", () => {
    const r = blokReviewRegel(
      review({ doel: "Onderhoud", check: null, ctlDelta: -5 }),
    );
    expect(r).toContain("3 van de 3 kwaliteitsweken");
    expect(r).toMatch(/onderhoud/i);
    expect(r).not.toContain("opbouwweken");
  });

  it("niet-opbouwdoel, niet geleverd: de frequentie mag niet wegzakken", () => {
    const r = blokReviewRegel(
      review({
        doel: "Onderhoud",
        check: null,
        uitvoering: {
          geleverd: false,
          geleverdeWeken: 1,
          beoordeeldeWeken: 3,
          tekortZones: ["tempo"],
          verschuiving: false,
        },
      }),
    );
    expect(r).toContain("1 van de 3 kwaliteitsweken");
    expect(r).toMatch(/frequentie/i);
  });

  // (e) — de tak niet_geleverd splitst op de VERSCHUIVING. Bij true is de bruikbare boodschap
  // "verschuiven", niet "meer": de dosis gaat expliciet NIET omhoog.
  it("niet_geleverd MET verschuiving: verschuiven naar de tekortzone, niet meer dosis", () => {
    const r = blokReviewRegel(
      review({
        uitvoering: {
          geleverd: false,
          geleverdeWeken: 0,
          beoordeeldeWeken: 3,
          tekortZones: ["drempel"],
          verschuiving: true,
        },
        check: {
          uitkomst: "niet_geleverd",
          geleverdeWeken: 0,
          beoordeeldeWeken: 3,
          ctlDelta: -5,
          gestegen: false,
        },
      }),
    );
    expect(r).toMatch(/verschuif|verschuiven/i);
    expect(r).toContain("Drempel");
    expect(r).not.toMatch(/dosis (mag|kan) .*omhoog/);
    expect(r).not.toMatch(/blijft staan/);
  });

  it("niet_geleverd ZONDER verschuiving: de bestaande boodschap, plus de tekortzone", () => {
    const r = blokReviewRegel(
      review({
        uitvoering: {
          geleverd: false,
          geleverdeWeken: 0,
          beoordeeldeWeken: 3,
          tekortZones: ["tempo"],
          verschuiving: false,
        },
        check: {
          uitkomst: "niet_geleverd",
          geleverdeWeken: 0,
          beoordeeldeWeken: 3,
          ctlDelta: -5,
          gestegen: false,
        },
      }),
    );
    expect(r).toMatch(/blijft staan|niet zien of het plan klopt/);
    expect(r).toContain("Tempo");
    expect(r).not.toMatch(/verschuiv/i);
  });

  it("fase-woordpaar: afgerond zegt 'vorig blok' + 'dit blok', lopend zegt 'dit blok' + 'het volgende blok'", () => {
    const af = blokReviewRegel(review({ fase: "afgerond" }));
    expect(af).toContain("vorig blok");
    expect(af).toContain("dit blok");
    expect(af).not.toContain("het volgende blok");

    const lo = blokReviewRegel(review({ fase: "lopend" }));
    expect(lo).toContain("dit blok");
    expect(lo).toContain("het volgende blok");
    expect(lo).not.toContain("vorig blok");
  });

  it("vlakke CTL: geen 'zakte met', wel 'bleef je CTL vlak'", () => {
    const r = blokReviewRegel(review({ ctlDelta: 0 }));
    expect(r).toContain("bleef je CTL vlak");
    expect(r).not.toContain("zakte je CTL");
  });

  it("deterministisch: dezelfde review geeft dezelfde zin", () => {
    expect(blokReviewRegel(review())).toBe(blokReviewRegel(review()));
  });
});
