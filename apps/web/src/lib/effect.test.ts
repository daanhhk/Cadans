import { DOEL_OPTIONS, normalizeDoel_ } from "@cadans/engine";
import type { EventItem, OverrideEntry } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { blokStartVoorWeek, buildBlokReview } from "./blok";
import {
  blokGelegenheid,
  blokMaximum,
  buildEffectReferent,
  doelTakVan_,
  dosisTerm,
  EFFECT_MIN_GEVULDE_WEKEN,
  instapNiveau,
  isStijging,
  laatsteGelegenheid,
  ROLLING_FTP_STIJGING_W,
  sprongDagen,
} from "./effect";
import { NO_BUILD_CTL_DELTA } from "./fatigue";
import { signatuurSeconden, ZONE5_GRENZEN_DEFAULT } from "./zonemunt";

// Geen vi.setSystemTime nodig: elke datum is een parameter (effect.ts leest de klok nergens).

/** De vijf doelen komen UIT de engine-constante, nooit met de hand overgetypt. De bestaande
 * fixtures draaien op de FTP-optie: dat is de tak `stijging` en dus het gedrag waarop deze suite
 * al geijkt was. ROADMAP punt 34 wijzigt de UITKOMST niet, alleen de copy en de kaart. */
const [
  FTP_DOEL,
  CONDITIE_DOEL,
  KLIM_KORT_DOEL,
  KLIM_LANG_DOEL,
  ONDERHOUD_DOEL,
] = DOEL_OPTIONS;

/** De ECHTE weekreeks uit docs/EFFECT-REFERENT-RECON.md §4, verbatim van schijf overgenomen:
 * laatste geldige rolling_ftp per kalenderweek. 2026-02-02 heeft daar geen rij — dat gat blijft
 * staan, want het voedt de dekkingspoort. */
const WEEKREEKS: [string, number][] = [
  ["2025-10-27", 276],
  ["2025-11-03", 276],
  ["2025-11-10", 276],
  ["2025-11-17", 276],
  ["2025-11-24", 273],
  ["2025-12-01", 273],
  ["2025-12-08", 273],
  ["2025-12-15", 273],
  ["2025-12-22", 271],
  ["2025-12-29", 270],
  ["2026-01-05", 267],
  ["2026-01-12", 276],
  ["2026-01-19", 276],
  ["2026-01-26", 276],
  // 2026-02-02 — geen rij (gat in de reeks)
  ["2026-02-09", 274],
  ["2026-02-16", 272],
  ["2026-02-23", 270],
  ["2026-03-02", 270],
  ["2026-03-09", 268],
  ["2026-03-16", 267],
  ["2026-03-23", 266],
  ["2026-03-30", 266],
  ["2026-04-06", 266],
  ["2026-04-13", 266],
  ["2026-04-20", 266],
  ["2026-04-27", 264],
  ["2026-05-04", 263],
  ["2026-05-11", 262],
  ["2026-05-18", 272],
  ["2026-05-25", 272],
  ["2026-06-01", 271],
  ["2026-06-08", 269],
  ["2026-06-15", 270],
  ["2026-06-22", 269],
  ["2026-06-29", 267],
  ["2026-07-06", 265],
  ["2026-07-13", 264],
  ["2026-07-20", 262],
];

/** Eén activiteiten-rij: idx0 Date, idx1 type, idx3 duur, idx14 rolling_ftp, idx15 zone-tijden. */
function act(
  datumISO: string,
  o: {
    type?: string;
    minuten?: number;
    rollingFtp?: number | null;
    high?: number;
  } = {},
): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  row[1] = o.type ?? "Ride";
  row[3] = o.minuten ?? 60;
  row[14] = o.rollingFtp === undefined ? null : o.rollingFtp;
  if (o.high != null) {
    // ZONE-MUNT fase 1b — `high` zijn WERKminuten, verdeeld in de vorm die het plan vraagt,
    // AFGELEID uit `bibliotheekSignatuur` en niet uitgetypt. Alles in Z4 zetten zou deze weken op de
    // zone-poort laten vallen, en dan meten deze tests de effect-poort niet meer maar de munt.
    const s = signatuurSeconden(o.high);
    row[15] = JSON.stringify([
      { id: "Z2", secs: 120 * 60 },
      { id: "Z3", secs: s.tempo },
      { id: "Z4", secs: s.drempel },
      { id: "Z5", secs: s.anaeroob },
    ]);
  }
  return row;
}

/** Eén rit per reeks-week, op de maandag zelf, met die rolling_ftp. */
const REEKS_ACTS: ActValuesRow[] = WEEKREEKS.map(([datum, v]) =>
  act(datum, { rollingFtp: v }),
);

// ── IJKING op de echte reeks ────────────────────────────────────────────────

describe("ijking op de weekreeks uit EFFECT-REFERENT-RECON.md §4", () => {
  it("blok 2026-06-29 — instap 269, maximum 267, verschil −2, vier gevulde weken", () => {
    expect(instapNiveau(REEKS_ACTS, "2026-06-29")).toBe(269);
    expect(blokMaximum(REEKS_ACTS, "2026-06-29")).toEqual({
      maximum: 267,
      gevuldeWeken: 4,
    });
  });

  it("blok 2026-01-12 — instap 267, maximum 276, verschil +9, drie gevulde weken", () => {
    // Het gat van 2026-02-02 valt in dit venster → drie in plaats van vier gevulde weken.
    expect(instapNiveau(REEKS_ACTS, "2026-01-12")).toBe(267);
    expect(blokMaximum(REEKS_ACTS, "2026-01-12")).toEqual({
      maximum: 276,
      gevuldeWeken: 3,
    });
  });

  it("blok 2026-05-18 — instap 262, maximum 272, verschil +10", () => {
    expect(instapNiveau(REEKS_ACTS, "2026-05-18")).toBe(262);
    expect(blokMaximum(REEKS_ACTS, "2026-05-18").maximum).toBe(272);
  });

  it("de drie verschillen komen uit de referent zoals het ontwerp ze noemt", () => {
    const v = (start: string) =>
      buildEffectReferent({
        activities: REEKS_ACTS,
        events: [],
        overrides: [],
        startMonday: start,
        ctlDelta: null,
        doel: FTP_DOEL,
      })?.verschil;
    expect(v("2026-06-29")).toBe(-2);
    expect(v("2026-01-12")).toBe(9);
    expect(v("2026-05-18")).toBe(10);
  });
});

// ── PLATEAU-TOETS op het app-raster ─────────────────────────────────────────

describe("plateau-toets — het raster van de app zelf (blokStartVoorWeek)", () => {
  // DE ENUMERATIE KOMT UIT DE APP (ontwerp §3): elke reeks-maandag wordt via `blokStartVoorWeek`
  // op zijn blokstart gemapt en gededupliceerd. NIET via een eigen lus van 28 dagen — die
  // reproduceert de verankering op `doelStart` niet en kan er een kwartslag naast liggen; dat
  // gebeurde in de eerste bouwronde, waarbij het ijk-blok van §8 buiten het toetsraster viel
  // zonder dat er iets faalde.
  //
  // FIXTURE-doelStart 2025-10-20: dezelfde rasterfase als de live `doelStart` 2026-06-29 (precies
  // negen blokken ervoor) en vóór het begin van de §4-reeks. Nodig omdat `blokWeekVanWeek`
  // negatieve verschillen op nul klemt — met de live doelStart zou de hele historische reeks op
  // blokweek 1 vallen.
  const FIXTURE_DOELSTART = "2025-10-20";
  const RASTER: string[] = [
    ...new Set(
      WEEKREEKS.map(([maandag]) =>
        blokStartVoorWeek(FIXTURE_DOELSTART, maandag),
      ),
    ),
  ].sort();

  /** De blokstarts die bij drempel T als "gestegen" gelden. */
  function gestegenBij(drempel: number): string[] {
    return RASTER.filter((start) => {
      const r = buildEffectReferent({
        activities: REEKS_ACTS,
        events: [],
        overrides: [],
        startMonday: start,
        ctlDelta: null,
        doel: FTP_DOEL,
      });
      return r != null && isStijging(r.verschil, drempel);
    });
  }

  it("het raster bevat de twee stijgings-blokken", () => {
    expect(RASTER).toContain("2026-01-12");
    expect(RASTER).toContain("2026-05-04");
  });

  it("het ijk-blok uit §8 ligt op DITZELFDE raster", () => {
    // Grendel op de fout van de eerste bouwronde: plateau-toets en ijk-blok moeten aantoonbaar
    // hetzelfde raster delen, anders toetst de een iets wat de app nooit uitrekent.
    expect(RASTER).toContain("2026-06-29");
  });

  it("drempel 1 t/m 8 geeft ELKE keer exact { 2026-01-12, 2026-05-04 }", () => {
    for (let t = 1; t <= 8; t++) {
      expect(gestegenBij(t)).toEqual(["2026-01-12", "2026-05-04"]);
    }
  });

  it("drempel 9 houdt alleen 2026-01-12 over", () => {
    expect(gestegenBij(9)).toEqual(["2026-01-12"]);
  });

  it("2026-01-12 meet +9 en 2026-05-04 meet +8 — de BOVENRAND van het plateau", () => {
    // Dragend: een latere verhoging van ROLLING_FTP_STIJGING_W boven 8 zet de meter stil zonder
    // dat er iets faalt. Deze assertie is de grendel daarop.
    const verschil = (start: string) =>
      buildEffectReferent({
        activities: REEKS_ACTS,
        events: [],
        overrides: [],
        startMonday: start,
        ctlDelta: null,
        doel: FTP_DOEL,
      })?.verschil;
    expect(verschil("2026-01-12")).toBe(9);
    expect(verschil("2026-05-04")).toBe(8);
    expect(ROLLING_FTP_STIJGING_W).toBeLessThanOrEqual(8);
  });
});

// ── poorten ─────────────────────────────────────────────────────────────────

describe("buildEffectReferent — poorten", () => {
  it("geen instapniveau → null", () => {
    // Alleen ritten BINNEN het venster, niets ervóór.
    const acts = [
      act("2026-06-29", { rollingFtp: 265 }),
      act("2026-07-06", { rollingFtp: 266 }),
      act("2026-07-13", { rollingFtp: 267 }),
    ];
    expect(instapNiveau(acts, "2026-06-29")).toBeNull();
    expect(
      buildEffectReferent({
        activities: acts,
        events: [],
        overrides: [],
        startMonday: "2026-06-29",
        ctlDelta: null,
        doel: FTP_DOEL,
      }),
    ).toBeNull();
  });

  it("minder gevulde weken dan EFFECT_MIN_GEVULDE_WEKEN → null", () => {
    const acts = [
      act("2026-06-22", { rollingFtp: 269 }),
      act("2026-06-29", { rollingFtp: 270 }),
      act("2026-07-06", { rollingFtp: 271 }),
    ];
    expect(blokMaximum(acts, "2026-06-29").gevuldeWeken).toBe(2);
    expect(EFFECT_MIN_GEVULDE_WEKEN).toBe(3);
    expect(
      buildEffectReferent({
        activities: acts,
        events: [],
        overrides: [],
        startMonday: "2026-06-29",
        ctlDelta: null,
        doel: FTP_DOEL,
      }),
    ).toBeNull();
  });

  it("stijging zonder bekende gelegenheid telt WEL — bewijs mag niet onderdrukt", () => {
    const r = buildEffectReferent({
      activities: REEKS_ACTS,
      events: [],
      overrides: [],
      startMonday: "2026-01-05",
      ctlDelta: null,
      doel: FTP_DOEL,
    });
    expect(r?.uitkomst).toBe("gestegen");
    expect(r?.gelegenheid.bron).toBeNull();
  });

  it("geen stijging én geen gelegenheid → niet_meetbaar", () => {
    const r = buildEffectReferent({
      activities: REEKS_ACTS,
      events: [],
      overrides: [],
      startMonday: "2026-06-29",
      ctlDelta: -5,
      doel: FTP_DOEL,
    });
    expect(r?.uitkomst).toBe("niet_meetbaar");
    expect(r?.dosisTerm).toBeNull();
  });
});

// ── gelegenheid ─────────────────────────────────────────────────────────────

describe("blokGelegenheid", () => {
  const start = "2026-06-29";
  const race = (datum: string, prioriteit: string): EventItem => ({
    datum,
    naam: "Ronde van Iets",
    type: "race",
    prioriteit,
    afstandKm: null,
    hoogtemeters: null,
    klimType: null,
    notitie: null,
  });
  const testOverride = (datum: string): OverrideEntry =>
    ({
      datum,
      override: { type: "library", workoutType: "test", durMin: 60 },
    }) as unknown as OverrideEntry;

  it("test-override op een GEREDEN dag → bron test", () => {
    const acts = [...REEKS_ACTS, act("2026-07-08", { minuten: 45 })];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [],
        overrides: [testOverride("2026-07-08")],
        startMonday: start,
      }),
    ).toEqual({ bron: "test", datum: "2026-07-08" });
  });

  it("test-override op een NIET gereden dag → geen bron", () => {
    expect(
      blokGelegenheid({
        activities: REEKS_ACTS,
        events: [],
        overrides: [testOverride("2026-07-08")],
        startMonday: start,
      }).bron,
    ).toBeNull();
  });

  it("te korte rit op de testdag telt niet (onder GELEGENHEID_MIN_MINUTEN)", () => {
    const acts = [...REEKS_ACTS, act("2026-07-08", { minuten: 10 })];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [],
        overrides: [testOverride("2026-07-08")],
        startMonday: start,
      }).bron,
    ).toBeNull();
  });

  it("wedstrijd prioriteit A telt, prioriteit C niet", () => {
    const acts = [...REEKS_ACTS, act("2026-07-11", { minuten: 90 })];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-07-11", "A")],
        overrides: [],
        startMonday: start,
      }),
    ).toEqual({ bron: "race", datum: "2026-07-11" });
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-07-11", "C")],
        overrides: [],
        startMonday: start,
      }).bron,
    ).toBeNull();
  });

  it("een wedstrijd BUITEN het venster telt niet", () => {
    const acts = [...REEKS_ACTS, act("2026-06-20", { minuten: 90 })];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-06-20", "A")],
        overrides: [],
        startMonday: start,
      }).bron,
    ).toBeNull();
  });

  it("test wint van race als beide gelden", () => {
    const acts = [
      ...REEKS_ACTS,
      act("2026-07-08", { minuten: 45 }),
      act("2026-07-11", { minuten: 90 }),
    ];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-07-11", "A")],
        overrides: [testOverride("2026-07-08")],
        startMonday: start,
      }).bron,
    ).toBe("test");
  });

  it("gelegenheid zonder stijging → niet_gestegen", () => {
    const acts = [...REEKS_ACTS, act("2026-07-11", { minuten: 90 })];
    const r = buildEffectReferent({
      activities: acts,
      events: [race("2026-07-11", "A")],
      overrides: [],
      startMonday: "2026-06-29",
      ctlDelta: -5,
      doel: FTP_DOEL,
    });
    expect(r?.uitkomst).toBe("niet_gestegen");
  });
});

// ── dosis-term ──────────────────────────────────────────────────────────────

describe("dosisTerm — volgt de procesmeter", () => {
  it("CTL steeg boven NO_BUILD_CTL_DELTA → tijd_in_zone (de kwaliteitsdosis was te licht)", () => {
    expect(dosisTerm("niet_gestegen", NO_BUILD_CTL_DELTA + 1)).toBe(
      "tijd_in_zone",
    );
  });

  it("CTL steeg niet → volume (meer drempeltijd is het verkeerde antwoord)", () => {
    expect(dosisTerm("niet_gestegen", NO_BUILD_CTL_DELTA)).toBe("volume");
    expect(dosisTerm("niet_gestegen", -5)).toBe("volume");
  });

  it("alleen bij niet_gestegen een term; ctlDelta null → null", () => {
    expect(dosisTerm("gestegen", 5)).toBeNull();
    expect(dosisTerm("niet_meetbaar", -5)).toBeNull();
    expect(dosisTerm("niet_gestegen", null)).toBeNull();
  });
});

// ── wiring in buildBlokReview ───────────────────────────────────────────────

describe("buildBlokReview — de twee effect-poorten", () => {
  /** Kwaliteitsritten zodat de uitvoering geleverd is (norm 84 bij FTP + 5 weekuren). */
  const KWALITEIT: ActValuesRow[] = [
    act("2026-06-30", { minuten: 210, high: 110 }),
    act("2026-07-07", { minuten: 210, high: 97 }),
    act("2026-07-14", { minuten: 210, high: 118 }),
  ];
  const ACTS = [...REEKS_ACTS, ...KWALITEIT];

  function review(o: { weekMondayISO: string; activities?: ActValuesRow[] }) {
    return buildBlokReview({
      activities: o.activities ?? ACTS,
      doel: "FTP",
      weekUren: 5,
      doelStart: "2026-06-29",
      // ROADMAP punt 14 fase 1 — poortset op alle drie de werkzones; deze test gaat over de
      // EFFECT-referent, niet over de zone-poort.
      weekplans: ["2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20"].map(
        (datum) => ({
          datum,
          // ROADMAP punt 17 — MET BANDEN. `planZone5_` leest `pctLo`/`pctHi`, niet `zone`; zonder
          // die twee velden vouwt dit plan naar NUL werkminuten en leest elke uitvoering
          // triviaal geleverd. De labels alleen volstonden onder de doel-brede norm, niet meer
          // onder een plan-relatieve referent.
          blokken: [
            { minuten: 20, zone: "tempo", pctLo: 80, pctHi: 88 },
            { minuten: 40, zone: "drempel", pctLo: 92, pctHi: 100 },
            { minuten: 10, zone: "anaeroob", pctLo: 110, pctHi: 120 },
          ],
        }),
      ),
      weekMondayISO: o.weekMondayISO,
      todayISO: "2026-07-27",
      grenzen: ZONE5_GRENZEN_DEFAULT,
      ctlDelta: -5,
      events: [],
      overrides: [],
    });
  }

  it("fase afgerond + uitvoering geleverd → effect gevuld", () => {
    const r = review({ weekMondayISO: "2026-07-27" });
    expect(r?.fase).toBe("afgerond");
    expect(r?.uitvoering.geleverd).toBe(true);
    expect(r?.effect).not.toBeNull();
    expect(r?.effect?.instap).toBe(269);
    expect(r?.effect?.maximum).toBe(267);
  });

  it("fase lopend → effect null (het venster is nog niet compleet)", () => {
    const r = review({ weekMondayISO: "2026-07-20" });
    expect(r?.fase).toBe("lopend");
    // POORT-ASSERTIE (ROADMAP punt 6, eerste eis): eerst dat de uitvoering GELEVERD is, dan pas de
    // effect-uitkomst. Zonder deze regel zou een fixture die stil onder de zone-norm zakt dezelfde
    // null geven — om de verkeerde reden, en de test blijft groen.
    expect(r?.uitvoering.geleverd).toBe(true);
    expect(r?.effect).toBeNull();
  });

  it("uitvoering NIET geleverd → effect null (uitvoering eerst, M5)", () => {
    // Wél beoordeelbaar (zonedata aanwezig, dus telt=true), maar ver onder de norm van 84.
    const mager: ActValuesRow[] = [
      act("2026-06-30", { minuten: 150, high: 20 }),
      act("2026-07-07", { minuten: 150, high: 20 }),
      act("2026-07-14", { minuten: 150, high: 20 }),
    ];
    const r = review({
      weekMondayISO: "2026-07-27",
      activities: [...REEKS_ACTS, ...mager],
    });
    expect(r?.uitvoering.beoordeeldeWeken).toBe(3);
    expect(r?.uitvoering.geleverd).toBe(false);
    expect(r?.effect).toBeNull();
  });
});

// ── 5b-ii — laatsteGelegenheid ──────────────────────────────────────────────

describe("laatsteGelegenheid — de laatste maximale inspanning over de hele historie", () => {
  const race = (datum: string, prioriteit = "A"): EventItem => ({
    datum,
    naam: "Ronde van Iets",
    type: "race",
    prioriteit,
    afstandKm: null,
    hoogtemeters: null,
    klimType: null,
    notitie: null,
  });
  const testOv = (datum: string): OverrideEntry =>
    ({
      datum,
      override: { type: "library", workoutType: "test", durMin: 60 },
    }) as unknown as OverrideEntry;
  const gereden = (datum: string) => act(datum, { minuten: 90 });

  it("pakt de LAATSTE, ongeacht bron", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-01-13"), gereden("2026-05-21")],
        events: [race("2026-05-21")],
        overrides: [testOv("2026-01-13")],
        totISO: "2026-07-26",
      }),
    ).toEqual({ bron: "race", datum: "2026-05-21" });
  });

  it("negeert een dag die niet gereden is", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-01-13")],
        events: [race("2026-05-21")], // geen rit op die dag
        overrides: [testOv("2026-01-13")],
        totISO: "2026-07-26",
      }),
    ).toEqual({ bron: "test", datum: "2026-01-13" });
  });

  it("negeert prioriteit C", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-05-21")],
        events: [race("2026-05-21", "C")],
        overrides: [],
        totISO: "2026-07-26",
      }),
    ).toBeNull();
  });

  it("respecteert totISO", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-01-13"), gereden("2026-05-21")],
        events: [race("2026-05-21")],
        overrides: [testOv("2026-01-13")],
        totISO: "2026-03-01",
      }),
    ).toEqual({ bron: "test", datum: "2026-01-13" });
  });

  it("gelijke datum → test wint (zelfde voorrang als blokGelegenheid)", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-05-21")],
        events: [race("2026-05-21")],
        overrides: [testOv("2026-05-21")],
        totISO: "2026-07-26",
      }),
    ).toEqual({ bron: "test", datum: "2026-05-21" });
  });

  it("niets gevonden → null", () => {
    expect(
      laatsteGelegenheid({
        activities: [gereden("2026-05-21")],
        events: [],
        overrides: [],
        totISO: "2026-07-26",
      }),
    ).toBeNull();
  });

  it("blokGelegenheid is ONGEWIJZIGD na de refactor", () => {
    // Zelfde drie eigenschappen als vóór het uittrekken van de predicaten: venster, gereden-eis
    // en de test-wint-van-race-voorrang.
    const acts = [...REEKS_ACTS, gereden("2026-07-08"), gereden("2026-07-11")];
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-07-11")],
        overrides: [testOv("2026-07-08")],
        startMonday: "2026-06-29",
      }),
    ).toEqual({ bron: "test", datum: "2026-07-08" });
    expect(
      blokGelegenheid({
        activities: REEKS_ACTS,
        events: [race("2026-07-11")],
        overrides: [],
        startMonday: "2026-06-29",
      }).bron,
    ).toBeNull();
    expect(
      blokGelegenheid({
        activities: acts,
        events: [race("2026-06-20")],
        overrides: [],
        startMonday: "2026-06-29",
      }).bron,
    ).toBeNull();
  });
});

// ── 5b-ii — de SPRONG in de reeks als derde meetmoment ──────────────────────

describe("sprongDagen", () => {
  it("vindt op de gepubliceerde reeks precies de twee sprongdagen", () => {
    // De §4-reeks draagt exact twee stijgingen: 2026-01-12 (267 → 276) en 2026-05-18 (262 → 272).
    expect(sprongDagen(REEKS_ACTS, "2026-07-26")).toEqual([
      "2026-01-12",
      "2026-05-18",
    ]);
  });

  it("geen enkele DALING telt mee", () => {
    // De reeks daalt 30 van de 38 overgangen; die mogen nooit als sprong verschijnen.
    const dalingen = ["2025-11-24", "2026-01-05", "2026-06-29", "2026-07-20"];
    const gevonden = sprongDagen(REEKS_ACTS, "2026-07-26");
    for (const d of dalingen) expect(gevonden).not.toContain(d);
  });

  it("twee ritten op DEZELFDE dag: de hoogste telt", () => {
    // 21-05-2026: 07:23 stond op 261, 16:23 op 272 — dat is één sprongdag, geen twee.
    const acts = [
      act("2026-05-20", { rollingFtp: 261 }),
      act("2026-05-21", { rollingFtp: 261 }),
      act("2026-05-21", { rollingFtp: 272 }),
    ];
    expect(sprongDagen(acts, "2026-07-26")).toEqual(["2026-05-21"]);
  });

  it("REGRESSIE: vergelijkt met de VORIGE dag, niet met het all-time maximum", () => {
    // Hier zat de val. Een latere sprong die LAGER ligt dan een eerdere piek moet tóch gevonden
    // worden — anders verdwijnt 21-05 (272) achter de piek van 13-01 (276).
    const acts = [
      act("2026-01-12", { rollingFtp: 267 }),
      act("2026-01-13", { rollingFtp: 276 }), // piek
      act("2026-05-11", { rollingFtp: 261 }), // weggezakt
      act("2026-05-21", { rollingFtp: 272 }), // sprong, maar ONDER de piek
    ];
    const gevonden = sprongDagen(acts, "2026-07-26");
    expect(gevonden).toContain("2026-05-21");
    expect(gevonden).toEqual(["2026-01-13", "2026-05-21"]);
  });

  it("de eerste dag met een waarde is nooit een sprong", () => {
    expect(
      sprongDagen([act("2026-01-12", { rollingFtp: 276 })], "2026-07-26"),
    ).toEqual([]);
  });

  it("totISO knipt af", () => {
    expect(sprongDagen(REEKS_ACTS, "2026-03-01")).toEqual(["2026-01-12"]);
  });

  it("een verschil ONDER de drempel telt niet", () => {
    const acts = [
      act("2026-05-11", { rollingFtp: 262 }),
      act("2026-05-18", { rollingFtp: 262 + ROLLING_FTP_STIJGING_W - 1 }),
    ];
    expect(sprongDagen(acts, "2026-07-26")).toEqual([]);
  });
});

describe("laatsteGelegenheid met de sprong-bron", () => {
  const race2 = (datum: string): EventItem => ({
    datum,
    naam: "Ronde",
    type: "race",
    prioriteit: "A",
    afstandKm: null,
    hoogtemeters: null,
    klimType: null,
    notitie: null,
  });

  it("een LATERE sprong wint van een eerdere wedstrijd", () => {
    const acts = [
      act("2026-01-13", { minuten: 90, rollingFtp: 267 }),
      act("2026-05-21", { minuten: 90, rollingFtp: 276 }),
    ];
    expect(
      laatsteGelegenheid({
        activities: acts,
        events: [race2("2026-01-13")],
        overrides: [],
        totISO: "2026-07-26",
      }),
    ).toEqual({ bron: "inspanning", datum: "2026-05-21" });
  });

  it("bij een GELIJKE datum wint test van sprong", () => {
    const acts = [
      act("2026-05-11", { minuten: 90, rollingFtp: 261 }),
      act("2026-05-21", { minuten: 90, rollingFtp: 272 }),
    ];
    expect(
      laatsteGelegenheid({
        activities: acts,
        events: [],
        overrides: [
          {
            datum: "2026-05-21",
            override: { type: "library", workoutType: "test", durMin: 60 },
          } as unknown as OverrideEntry,
        ],
        totISO: "2026-07-26",
      })?.bron,
    ).toBe("test");
  });

  it("een sprong telt ZONDER de gereden-poort (hij impliceert een rit)", () => {
    // De ritminuten staan hier onder GELEGENHEID_MIN_MINUTEN; een race zou afvallen, een sprong niet.
    const acts = [
      act("2026-05-11", { minuten: 5, rollingFtp: 261 }),
      act("2026-05-21", { minuten: 5, rollingFtp: 272 }),
    ];
    expect(
      laatsteGelegenheid({
        activities: acts,
        events: [race2("2026-05-21")],
        overrides: [],
        totISO: "2026-07-26",
      }),
    ).toEqual({ bron: "inspanning", datum: "2026-05-21" });
  });
});

// ── ROADMAP punt 34 — DE DOEL-TAK ────────────────────────────────────────────
// De referent was doel-BLIND: dezelfde rolling-FTP-vraag voor alle vijf doelen, terwijl
// DOELEN-SPEC §3.3 t/m §3.5 voor drie ervan een maat aanwijzen die de app niet kan uitrekenen en
// §3.2 bij Onderhoud het TEKEN omkeert. Deze suite pint de tak-keuze, niet de copy.
describe("doelTakVan_ — de tak per doel", () => {
  // DIT IS DE DRAGENDE TEST VAN DIT BLOK. `doelTakVan_` leest de vijf opties op INDEX uit
  // `DOEL_OPTIONS`; herschikt de engine die lijst, dan wijst elke tak stilzwijgend het verkeerde
  // doel aan en blijft alles groen. Deze assertie is de enige plek die dat vangt.
  it("DOEL_OPTIONS draagt vijf opties IN VOLGORDE — herschikken breekt de tak-keuze", () => {
    expect(DOEL_OPTIONS).toEqual([
      "FTP",
      "Conditie",
      "Korte beklimmingen",
      "Lange beklimmingen",
      "Onderhoud",
    ]);
  });

  it("elk van de vijf opties geeft zijn eigen tak", () => {
    expect(doelTakVan_(FTP_DOEL)).toBe("stijging");
    expect(doelTakVan_(ONDERHOUD_DOEL)).toBe("behoud");
    expect(doelTakVan_(CONDITIE_DOEL)).toBe("meter_ontbreekt");
    expect(doelTakVan_(KLIM_KORT_DOEL)).toBe("meter_ontbreekt");
    expect(doelTakVan_(KLIM_LANG_DOEL)).toBe("meter_ontbreekt");
  });

  it('normalizeDoel_ draait VOOR de tak-keuze: "Beklimmingen" is Korte beklimmingen, dus meter_ontbreekt', () => {
    expect(normalizeDoel_("Beklimmingen")).toBe(KLIM_KORT_DOEL);
    expect(doelTakVan_("Beklimmingen")).toBe("meter_ontbreekt");
  });

  it("leeg, null en onzin vallen op meter_ontbreekt — de ZWIJGENDE tak, niet de FTP-fallback", () => {
    // De grond: `normalizeDoel_` fail-opent naar de FTP-optie, want voor het PLAN is een doel
    // kiezen beter dan stilvallen. Voor een UITSPRAAK is dat precies verkeerd.
    expect(normalizeDoel_("")).toBe(FTP_DOEL);
    expect(doelTakVan_("")).toBe("meter_ontbreekt");
    expect(doelTakVan_(null)).toBe("meter_ontbreekt");
    expect(doelTakVan_(undefined)).toBe("meter_ontbreekt");
    expect(doelTakVan_("zomaar wat")).toBe("meter_ontbreekt");
  });

  it('"VO2max" geeft METER_ONTBREEKT, want hij normaliseert naar de FTP-FALLBACK en is daarmee niet van onzin te onderscheiden', () => {
    // De engine draagt geen geëxporteerde alias-tabel en geen is-bekend-predicaat, dus buiten
    // `normalizeDoel_` is een herkende legacy-waarde die op de fallback landt niet te scheiden van
    // een typefout. VO2max is als DOEL vervallen (DOELEN-SPEC §3.6); zwijgen is hier de veilige
    // kant. Verandert de engine dit, dan hoort deze test mee te bewegen.
    expect(normalizeDoel_("VO2max")).toBe(FTP_DOEL);
    expect(doelTakVan_("VO2max")).toBe("meter_ontbreekt");
  });
});

describe("buildEffectReferent — de tak stuurt de uitkomst", () => {
  const raceA = (datum: string): EventItem => ({
    datum,
    naam: "Ronde van Iets",
    type: "race",
    prioriteit: "A",
    afstandKm: null,
    hoogtemeters: null,
    klimType: null,
    notitie: null,
  });
  const metRace = [...REEKS_ACTS, act("2026-07-11", { minuten: 90 })];

  const bouw = (
    doel: string | null,
    o: { start: string; ctlDelta: number | null; race?: boolean },
  ) =>
    buildEffectReferent({
      activities: o.race ? metRace : REEKS_ACTS,
      events: o.race ? [raceA("2026-07-11")] : [],
      overrides: [],
      startMonday: o.start,
      ctlDelta: o.ctlDelta,
      doel,
    });

  it("doel FTP houdt zijn drie bestaande uitkomsten — punt 34 wijzigt de copy, niet het oordeel", () => {
    expect(
      bouw(FTP_DOEL, { start: "2026-01-05", ctlDelta: null })?.uitkomst,
    ).toBe("gestegen");
    expect(
      bouw(FTP_DOEL, { start: "2026-06-29", ctlDelta: -5 })?.uitkomst,
    ).toBe("niet_meetbaar");
    expect(
      bouw(FTP_DOEL, { start: "2026-06-29", ctlDelta: -5, race: true })
        ?.uitkomst,
    ).toBe("niet_gestegen");
  });

  it("doel Onderhoud draagt tak behoud en houdt dezelfde drie uitkomsten — het TEKEN zit in de copy", () => {
    for (const geval of [
      { start: "2026-01-05", ctlDelta: null },
      { start: "2026-06-29", ctlDelta: -5 },
      { start: "2026-06-29", ctlDelta: -5, race: true },
    ]) {
      expect(bouw(ONDERHOUD_DOEL, geval)?.doelTak).toBe("behoud");
    }
    expect(
      bouw(ONDERHOUD_DOEL, { start: "2026-01-05", ctlDelta: null })?.uitkomst,
    ).toBe("gestegen");
    expect(
      bouw(ONDERHOUD_DOEL, { start: "2026-06-29", ctlDelta: -5, race: true })
        ?.uitkomst,
    ).toBe("niet_gestegen");
  });

  it("bij meter_ontbreekt wordt de verdict-logica NIET gedraaid: altijd niet_meetbaar, ook bij een stijging", () => {
    // 2026-01-05 is een blok dat bij FTP "gestegen" oplevert — de TEGENKANT die deze test nodig
    // heeft. Het verschil wordt niet gehardcodeerd maar tegen de stijging-tak gelegd: zo toetst
    // de assertie dat alleen het OORDEEL vervalt en de term ongemoeid blijft.
    const bijFtp = bouw(FTP_DOEL, { start: "2026-01-05", ctlDelta: null });
    expect(bijFtp?.uitkomst).toBe("gestegen");
    for (const doel of [CONDITIE_DOEL, KLIM_KORT_DOEL, KLIM_LANG_DOEL]) {
      const r = bouw(doel, { start: "2026-01-05", ctlDelta: null });
      expect(r?.doelTak).toBe("meter_ontbreekt");
      expect(r?.uitkomst).toBe("niet_meetbaar");
      expect(r?.dosisTerm).toBeNull();
      expect(r?.verschil).toBe(bijFtp?.verschil);
      expect(r?.instap).toBe(bijFtp?.instap);
      expect(r?.maximum).toBe(bijFtp?.maximum);
    }
  });
});
