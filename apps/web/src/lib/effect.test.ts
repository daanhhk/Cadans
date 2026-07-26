import type { EventItem, OverrideEntry } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { buildBlokReview, shiftIso_ } from "./blok";
import {
  blokGelegenheid,
  blokMaximum,
  buildEffectReferent,
  dosisTerm,
  EFFECT_MIN_GEVULDE_WEKEN,
  instapNiveau,
  isStijging,
  ROLLING_FTP_STIJGING_W,
} from "./effect";
import { NO_BUILD_CTL_DELTA } from "./fatigue";

// Geen vi.setSystemTime nodig: elke datum is een parameter (effect.ts leest de klok nergens).

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
    row[15] = JSON.stringify([
      { id: "Z2", secs: 120 * 60 },
      { id: "Z4", secs: Math.round(o.high * 60) },
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
      })?.verschil;
    expect(v("2026-06-29")).toBe(-2);
    expect(v("2026-01-12")).toBe(9);
    expect(v("2026-05-18")).toBe(10);
  });
});

// ── PLATEAU-TOETS op het app-raster ─────────────────────────────────────────

describe("plateau-toets — niet-overlappend raster, verankerd op 2026-01-05", () => {
  // Het raster dat de app zelf uitrekent: niet-overlappende blokken van 28 dagen. Een sweep over
  // ELKE maandag zou de gevoeligheid voor de RASTERFASE meten, niet voor de drempel (ontwerp §3).
  const eerste = WEEKREEKS[0]?.[0] as string;
  const laatste = WEEKREEKS[WEEKREEKS.length - 1]?.[0] as string;
  const RASTER: string[] = (() => {
    let s = "2026-01-05";
    while (shiftIso_(s, -28) >= eerste) s = shiftIso_(s, -28);
    const out: string[] = [];
    for (let d = s; d <= laatste; d = shiftIso_(d, 28)) out.push(d);
    return out;
  })();

  /** De blokstarts die bij drempel T als "gestegen" gelden. */
  function gestegenBij(drempel: number): string[] {
    return RASTER.filter((start) => {
      const r = buildEffectReferent({
        activities: REEKS_ACTS,
        events: [],
        overrides: [],
        startMonday: start,
        ctlDelta: null,
      });
      return r != null && isStijging(r.verschil, drempel);
    });
  }

  it("het raster bevat de twee stijgings-blokken", () => {
    expect(RASTER).toContain("2026-01-05");
    expect(RASTER).toContain("2026-04-27");
  });

  it("drempel 1 t/m 6 geeft ELKE keer exact { 2026-01-05, 2026-04-27 }", () => {
    for (let t = 1; t <= 6; t++) {
      expect(gestegenBij(t)).toEqual(["2026-01-05", "2026-04-27"]);
    }
  });

  it("drempel 7 en 8 geven een LEGE set", () => {
    expect(gestegenBij(7)).toEqual([]);
    expect(gestegenBij(8)).toEqual([]);
  });

  it("beide blokken meten precies +6 — de BOVENRAND van het plateau", () => {
    // Dragend: een latere verhoging van ROLLING_FTP_STIJGING_W boven 6 zet de meter stil zonder
    // dat er iets faalt. Deze assertie is de grendel daarop.
    const verschil = (start: string) =>
      buildEffectReferent({
        activities: REEKS_ACTS,
        events: [],
        overrides: [],
        startMonday: start,
        ctlDelta: null,
      })?.verschil;
    expect(verschil("2026-01-05")).toBe(6);
    expect(verschil("2026-04-27")).toBe(6);
    expect(ROLLING_FTP_STIJGING_W).toBeLessThanOrEqual(6);
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
      weekMondayISO: o.weekMondayISO,
      todayISO: "2026-07-27",
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
