import { describe, expect, it } from "vitest";
import type { BlokReview } from "./blok";
import {
  blokEffectRegel,
  blokReviewRegel,
  coachNarrative,
  faseOvergangRegel,
} from "./coachNarrative";
import type { EffectReferent } from "./effect";

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

// ── ROADMAP punt 34 — DE EFFECT-COPY PER DOEL-TAK ────────────────────────────
// De keuze valt in deze volgorde: eerst `doelTak`, dan `uitkomst`, dan `gelegenheid`. Deze suite
// toetst wat de zinnen NIET meer beweren — een claim die de meter niet draagt is de schending die
// punt 34 sluit (M5), en dat is met een afwezigheids-assertie te vangen en niet met een
// gelijkheids-assertie op de hele zin.
describe("blokEffectRegel — de doel-takken", () => {
  function review(
    effect: Partial<EffectReferent> & Pick<EffectReferent, "doelTak">,
    o: Partial<BlokReview> = {},
  ): BlokReview {
    return {
      startMonday: "2026-06-29",
      eindMonday: "2026-07-20",
      fase: "afgerond",
      doel: null,
      norm: 84,
      normTempo: 24,
      normDrempel: 47,
      normAnaeroob: 13,
      weekUren: 5,
      weeks: [],
      uitvoering: {
        geleverd: true,
        geleverdeWeken: 3,
        beoordeeldeWeken: 3,
        tekortZones: [],
        verschuiving: false,
      },
      check: null,
      ctlDelta: -5,
      laatsteMeting: null,
      effect: {
        instap: 262,
        maximum: 272,
        verschil: 10,
        gevuldeWeken: 4,
        gelegenheid: { bron: null, datum: null },
        uitkomst: "gestegen",
        dosisTerm: null,
        ...effect,
      },
      ...o,
    };
  }

  const RACE = { bron: "race", datum: "2026-07-11" } as const;

  /** De poolkeuze is deterministisch geseed op `startMonday`, dus welke van de twee varianten je
   * krijgt hangt aan de datum. Deze reeks is breed genoeg dat élke pool zijn BEIDE varianten
   * ergens oplevert; met vier maandagen viel één sleutel er per toeval buiten. */
  const MAANDAGEN: string[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 0, 5 + i * 7);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });

  it("meter_ontbreekt: geen enkel watt-getal, geen oordeel", () => {
    const r = blokEffectRegel(
      review({ doelTak: "meter_ontbreekt", uitkomst: "niet_meetbaar" }),
    );
    expect(r).not.toBeNull();
    // GEEN GETAL. Een watt-getal noemen is bij een ontbrekende maat al een uitspraak.
    expect(r).not.toMatch(/\d/);
    expect(r).toContain("geen uitspraak");
  });

  it("stijging + gestegen ZONDER gelegenheid: noemt de stijging maar claimt geen winst", () => {
    const r = blokEffectRegel(review({ doelTak: "stijging" })) ?? "";
    expect(r).toContain("272");
    expect(r).not.toContain("winst");
    expect(r).toContain("schatting");
  });

  it("stijging + gestegen MET gelegenheid: de bestaande winst-zin blijft ongewijzigd", () => {
    const r =
      blokEffectRegel(review({ doelTak: "stijging", gelegenheid: RACE })) ?? "";
    expect(r).toContain("winst");
  });

  it("behoud + gestegen MET gelegenheid: een vloer, geen winst", () => {
    const r =
      blokEffectRegel(review({ doelTak: "behoud", gelegenheid: RACE })) ?? "";
    expect(r).not.toContain("winst waar dit blok voor bedoeld was");
    expect(r).not.toContain("de winst die dit blok moest opleveren");
    expect(r).toMatch(/onderhoud/i);
  });

  it("behoud + gestegen ZONDER gelegenheid: dezelfde gedeelde schattings-pool als stijging", () => {
    const zonder = blokEffectRegel(review({ doelTak: "behoud" })) ?? "";
    const stijging = blokEffectRegel(review({ doelTak: "stijging" })) ?? "";
    expect(zonder).toBe(stijging);
    expect(zonder).toContain("schatting");
  });

  it("behoud + niet_gestegen: GEEN dosis-advies, ongeacht dosisTerm", () => {
    for (const dosisTerm of ["tijd_in_zone", "volume", null] as const) {
      const r =
        blokEffectRegel(
          review({
            doelTak: "behoud",
            uitkomst: "niet_gestegen",
            gelegenheid: RACE,
            dosisTerm,
          }),
        ) ?? "";
      expect(r).not.toContain("tijd-in-zone");
      expect(r).not.toContain("volume toevoegen");
      // Beide varianten NOEMEN de dosis, en zeggen er allebei bij dat er niets bij gaat; de
      // formulering verschilt ("gaat hier niet omhoog" tegen "er gaat niets bij de dosis"), dus de
      // assertie gaat op de gedeelde term plus de afwezigheid van het advies.
      expect(r).toContain("dosis");
    }
  });

  it("de FTP-takken houden hun dosis-advies — punt 34 haalt het alleen bij BEHOUD weg", () => {
    const tijdInZone =
      blokEffectRegel(
        review({
          doelTak: "stijging",
          uitkomst: "niet_gestegen",
          gelegenheid: RACE,
          dosisTerm: "tijd_in_zone",
        }),
      ) ?? "";
    expect(tijdInZone).toContain("tijd-in-zone");
  });

  // ── bouwlijst (e) — DE HOOFDLETTER ────────────────────────────────────────
  // De labelset `GELEGENHEID_NAAM_` draagt kleine letters ("de wedstrijd") omdat hij ook MIDDEN in
  // een zin staat. De hoofdletter valt daarom op de gebruiksplek, niet op de constante.
  it("de drie zinsbegin-varianten beginnen met een hoofdletter", () => {
    // De pool-keuze is deterministisch geseed op `startMonday`; per tak wordt de maandag gezocht
    // die variant 2 oplevert — de variant die met de gelegenheid-naam OPENT.
    const zinsbegin = (o: Partial<EffectReferent>) => {
      for (const maandag of MAANDAGEN) {
        const r =
          blokEffectRegel(
            review({ gelegenheid: RACE, ...o } as never, {
              startMonday: maandag,
            }),
          ) ?? "";
        if (r.startsWith("De wedstrijd")) return r;
      }
      return null;
    };
    expect(
      zinsbegin({
        doelTak: "stijging",
        uitkomst: "niet_gestegen",
        dosisTerm: "tijd_in_zone",
      }),
    ).not.toBeNull();
    expect(
      zinsbegin({
        doelTak: "stijging",
        uitkomst: "niet_gestegen",
        dosisTerm: "volume",
      }),
    ).not.toBeNull();
    expect(
      zinsbegin({ doelTak: "behoud", uitkomst: "niet_gestegen" }),
    ).not.toBeNull();
  });

  it("de midden-in-de-zin-variant houdt zijn kleine letter", () => {
    // Tegenkant: zou de hoofdletter in `GELEGENHEID_NAAM_` zijn gezet, dan zou hier "Bij De
    // wedstrijd" staan en zou deze test vallen.
    const gezien: string[] = [];
    for (const maandag of MAANDAGEN) {
      const r =
        blokEffectRegel(
          review(
            {
              doelTak: "stijging",
              uitkomst: "niet_gestegen",
              gelegenheid: RACE,
              dosisTerm: "tijd_in_zone",
            },
            { startMonday: maandag },
          ),
        ) ?? "";
      if (r.startsWith("Bij ")) gezien.push(r);
    }
    expect(gezien.length).toBeGreaterThan(0);
    for (const r of gezien) expect(r).toContain("Bij de wedstrijd");
  });

  // ── ROADMAP punt 50 — DE TESTBELOFTE OP DE BEHOUD-TAK ─────────────────────
  // `buildTestVoorstel` valt voor Onderhoud op poort (2), dus de belofte "in een rustweek een
  // test" kan daar niet ingelost worden. BEIDE varianten worden getoetst en niet de ene die de
  // seed toevallig kiest: een pool-splitsing die maar één variant raakt is half werk, en de
  // rotatie zou dat pas maanden later zichtbaar maken.
  /** Alle DISTINCTE varianten die deze combinatie over de seed-as oplevert. */
  const varianten = (o: Partial<EffectReferent>) => [
    ...new Set(
      MAANDAGEN.map(
        (maandag) =>
          blokEffectRegel(review(o as never, { startMonday: maandag })) ?? "",
      ),
    ),
  ];

  it("behoud + niet_meetbaar zonder gelegenheid: GEEN variant belooft een test", () => {
    const v = varianten({ doelTak: "behoud", uitkomst: "niet_meetbaar" });
    expect(v.length).toBe(2); // beide varianten daadwerkelijk gezien
    for (const r of v) {
      // BIJGESTELD 23-08-2026 met M92: de belofte noemde een RUSTWEEK toen het aanbod in
      // vierweekse blokweek 4 stond (de deload). Sinds de verhuizing naar de doelblok-OPENING —
      // blokweek 1, `MESO_MOD[1]` is 1,0 en dus een volle opbouwweek — luidt zij "bij de start van
      // een nieuw blok". De EIS is ongewijzigd: op de behoud-tak staat geen enkele testbelofte.
      expect(r).not.toContain("start van een nieuw blok");
      expect(r).not.toContain("testvoorstel");
    }
  });

  it("stijging + niet_meetbaar zonder gelegenheid: de belofte staat er WEL nog", () => {
    // TEGENKANT. Zonder deze assertie zou het weghalen van de belofte op ÁLLE takken ook slagen,
    // en dat is een andere ingreep dan punt 50 vraagt.
    const v = varianten({ doelTak: "stijging", uitkomst: "niet_meetbaar" });
    expect(v.length).toBe(2);
    expect(v.some((r) => r.includes("start van een nieuw blok"))).toBe(true);
    expect(
      v.every(
        (r) =>
          r.includes("start van een nieuw blok") || r.includes("testvoorstel"),
      ),
    ).toBe(true);
    // En de oude belofte staat er NIET meer: die noemde een moment dat de poort niet produceert.
    for (const r of v) expect(r).not.toContain("rustweek");
  });

  it("de behoud-variant is de stijging-variant MINUS de laatste zin", () => {
    // De `key` blijft aan beide kanten `niet_meetbaar`, dus `seedIndex` kiest dezelfde index in
    // beide pools. Daarmee is per maandag aantoonbaar dezelfde zin met de belofte eraf, en niet
    // stilzwijgend de andere variant.
    for (const maandag of MAANDAGEN) {
      const behoud =
        blokEffectRegel(
          review({ doelTak: "behoud", uitkomst: "niet_meetbaar" } as never, {
            startMonday: maandag,
          }),
        ) ?? "";
      const stijging =
        blokEffectRegel(
          review({ doelTak: "stijging", uitkomst: "niet_meetbaar" } as never, {
            startMonday: maandag,
          }),
        ) ?? "";
      expect(stijging.startsWith(behoud)).toBe(true);
      expect(stijging.length).toBeGreaterThan(behoud.length);
    }
  });
});
