import { DOEL_BLOK_WEKEN } from "@cadans/engine";
import type { EventItem, OverrideEntry, PlannerDay } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { BLOK_WEKEN, blokStartVoorWeek, blokWeekVanWeek } from "./blok";
import { laatsteGelegenheid } from "./effect";
import { blokStartBijDoel } from "./settings";
import {
  buildTestVoorstel,
  doelblokOpeningVoorWeek,
  ijkStatus,
  TEST_DUUR_MIN,
  TEST_INTERVAL_DAGEN,
  WEDSTRIJD_HORIZON_DAGEN,
} from "./testvoorstel";

// Geen vi.setSystemTime nodig: elke datum is een parameter.

const DOELSTART = "2026-06-29";
/**
 * DE DOELBLOK-OPENING: week 1 van het twaalfweekse doelblok. Weekindex 12 sinds `doelStart`, dus
 * de TWEEDE opening — de eerste valt op `doelStart` zelf en is minder handig als fixture.
 *
 * TWEE KEER VERPLAATST OP 23-08-2026. Eerst van de vierweekse rustweek `2026-08-17` naar de
 * doelblok-testweek `2026-09-14` (poort (1) ging van blokweek 4 naar `isTestWeek`), en daarna
 * hierheen: poort (1) toetst sinds M92 `computeMacroPhase(...).week === 1`, de OPENING. De
 * drempelwaarde doet zijn werk vooruit, dus zij hoort aan het begin van het blok dat zij doseert.
 */
const OPENING = "2026-09-21";
/** Doelblok-TESTWEKEN (week 12). Tot M92 vuurde het aanbod juist hier; nu hoort er niets te komen. */
const TESTWEEK_GEEN_OPENING = ["2026-09-14", "2026-12-07"];
/** Weekindex 13 t/m 23 — doelblokweek 2 t/m 12, de elf weken NA de opening. */
const ELF_WEKEN_NA_DE_OPENING = [
  "2026-09-28",
  "2026-10-05",
  "2026-10-12",
  "2026-10-19",
  "2026-10-26",
  "2026-11-02",
  "2026-11-09",
  "2026-11-16",
  "2026-11-23",
  "2026-11-30",
  "2026-12-07",
];

function pday(datum: string, o: Partial<PlannerDay> = {}): PlannerDay {
  return {
    datum,
    train: true,
    dag: null,
    minuten: 90,
    dagtype: "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
    ...o,
  };
}

/** De doelblok-opening 21-09 t/m 27-09: alleen zaterdag draagt genoeg tijd. */
function week(o: Partial<PlannerDay>[] = []): PlannerDay[] {
  const basis = [
    pday("2026-09-21", { train: false, minuten: null }),
    pday("2026-09-22", { minuten: 45 }),
    pday("2026-09-23", { train: false, minuten: null }),
    pday("2026-09-24", { minuten: 45 }),
    pday("2026-09-25", { train: false, minuten: null }),
    pday("2026-09-26", { minuten: 90 }),
    pday("2026-09-27", { train: false, minuten: null }),
  ];
  return basis.map((d, i) => ({ ...d, ...(o[i] ?? {}) }));
}

/** Dezelfde weekvorm, maar op een andere maandag — voor de poort-(1)-toetsen. */
function weekVanaf(maandagISO: string): PlannerDay[] {
  const [y, m, d] = maandagISO.split("-").map(Number);
  const iso = (n: number) => {
    const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n);
    const p = (x: number) => String(x).padStart(2, "0");
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  };
  return [
    pday(iso(0), { train: false, minuten: null }),
    pday(iso(1), { minuten: 45 }),
    pday(iso(2), { train: false, minuten: null }),
    pday(iso(3), { minuten: 45 }),
    pday(iso(4), { train: false, minuten: null }),
    pday(iso(5), { minuten: 90 }),
    pday(iso(6), { train: false, minuten: null }),
  ];
}

function act(
  datumISO: string,
  minuten = 90,
  type = "Ride",
  rollingFtp: number | null = null,
): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  row[1] = type;
  row[3] = minuten;
  row[14] = rollingFtp;
  return row;
}

function race(datum: string, prioriteit = "A"): EventItem {
  return {
    datum,
    naam: "Ronde van Iets",
    type: "race",
    prioriteit,
    afstandKm: null,
    hoogtemeters: null,
    klimType: null,
    notitie: null,
  };
}

function testOverride(datum: string): OverrideEntry {
  return {
    datum,
    override: { type: "library", workoutType: "test", durMin: 60 },
  };
}

/** Laatste meting ver genoeg terug: een gereden A-wedstrijd op 2026-05-21. */
const OUDE_METING = { events: [race("2026-05-21")], acts: [act("2026-05-21")] };

/** `n` dagen vóór een yyyy-MM-dd. Lokaal gerekend, net als de bron. */
function isoMin(datumISO: string, n: number): string {
  const [y, m, d] = datumISO.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function bouw(
  o: {
    weekMondayISO?: string;
    todayISO?: string;
    doel?: string;
    doelStart?: string | null;
    plannerDays?: PlannerDay[];
    overrides?: OverrideEntry[];
    events?: EventItem[];
    activities?: ActValuesRow[];
    ijkingBeantwoordBlok?: string | null;
  } = {},
) {
  return buildTestVoorstel({
    plannerDays: o.plannerDays ?? week(),
    overrides: o.overrides ?? [],
    events: o.events ?? OUDE_METING.events,
    activities: o.activities ?? OUDE_METING.acts,
    doel: o.doel ?? "FTP",
    doelStart: o.doelStart === undefined ? DOELSTART : o.doelStart,
    weekMondayISO: o.weekMondayISO ?? OPENING,
    todayISO: o.todayISO ?? OPENING,
    ijkingBeantwoordBlok: o.ijkingBeantwoordBlok ?? null,
  });
}

describe("buildTestVoorstel — de poorten", () => {
  it("alleen in de DOELBLOK-OPENING: de elf weken erna geven null", () => {
    // Weekindex 13 t/m 23 — doelblokweek 2 t/m 12.
    for (const maandag of ELF_WEKEN_NA_DE_OPENING) {
      expect(
        bouw({
          weekMondayISO: maandag,
          todayISO: maandag,
          plannerDays: weekVanaf(maandag),
        }),
      ).toBeNull();
    }
    expect(ELF_WEKEN_NA_DE_OPENING).toHaveLength(11);
    expect(bouw()).not.toBeNull();
  });

  it("de doelblok-TESTWEEK geeft null — daar stond het aanbod tot M92", () => {
    // DIT IS DE VERHUIZING VAN 23-08-2026. Week 12 was het moment; nu is het week 1.
    for (const ma of TESTWEEK_GEEN_OPENING) {
      expect(
        bouw({ weekMondayISO: ma, todayISO: ma, plannerDays: weekVanaf(ma) }),
      ).toBeNull();
    }
  });

  it("de doelblok-opening IS per constructie ook vierweekse blokweek 1", () => {
    // Dragend: daarom mogen poort (3) en de afwijs-sleutel op de VIERWEEKSE klok blijven staan.
    // Week 1 is weekindex ≡ 0 (mod 12), en 0 mod 4 is 0 → blokweek 1. Vier opeenvolgende openingen.
    for (const ma of ["2026-06-29", "2026-09-21", "2026-12-14", "2027-03-08"]) {
      expect(blokWeekVanWeek(DOELSTART, ma)).toBe(1);
      expect(BLOK_WEKEN).toBe(4);
    }
  });

  it("zonder doelStart geen aanbod, en GEEN ambient klok", () => {
    // computeMacroPhase valt bij een ontbrekende startdatum terug op new Date(); deze laag belooft
    // geen ambient klok, dus poort (1) stopt ervóór.
    expect(bouw({ doelStart: null })).toBeNull();
  });

  it("een ONGELDIGE doelStart geeft null — anders vuurt het aanbod ELKE week", () => {
    // REGRESSIE-TEST, gevonden in de weerleggingspas van 23-08-2026. `doelStart` is vrije tekst in
    // D1. `parseLocalDate` geeft op onzin een Invalid Date, en die is TRUTHY — dus de vangregel
    // `if (!startDate)` in computeMacroPhase vuurt niet. Het dagverschil wordt NaN, de blokweek
    // wordt NaN, en `NaN <= 4`, `NaN <= 8` en `NaN <= 11` zijn alle drie onwaar, waardoor de keten
    // doorvalt naar de else-tak en `isTestWeek: true` teruggeeft — élke week. De OUDE poort had dit
    // gat niet, want `blokWeekVanWeek` draagt zijn eigen Number.isNaN-vang.
    for (const kapot of ["kapot", "", "29-06-2026", "niet-een-datum"]) {
      expect(bouw({ doelStart: kapot })).toBeNull();
      // En het is geen toevalstreffer via een andere poort: ook een week met alle dagen ruim,
      // zonder meethistorie, blijft null.
      expect(
        bouw({
          doelStart: kapot,
          events: [],
          activities: [],
          plannerDays: week().map((d) => ({ ...d, train: true, minuten: 150 })),
        }),
      ).toBeNull();
    }
  });

  it("een DOELWISSEL levert een aanbod in de wisselweek zelf — het geval dat M92 draagt", () => {
    // blokStartBijDoel zet doelStart bij een wissel op een VERSE maandag, en die is per constructie
    // week 1: de OPENING. Tot M92 eiste poort (1) week 12, dus leverde een wisselweek nooit een
    // aanbod en begon het nieuwe blok twaalf weken lang op een onbevestigde drempel.
    const nieuweStart = blokStartBijDoel(
      "FTP",
      DOELSTART,
      "Conditie",
      "2026-08-05",
    );
    expect(nieuweStart).toBe("2026-08-03");
    const v = buildTestVoorstel({
      plannerDays: weekVanaf(nieuweStart),
      overrides: [],
      events: [race("2026-01-15")],
      activities: [act("2026-01-15")],
      doel: "Conditie",
      doelStart: nieuweStart,
      weekMondayISO: nieuweStart,
      todayISO: nieuweStart,
    });
    expect(v?.datum).toBe("2026-08-08");
    expect(v?.blokStart).toBe(nieuweStart);
  });

  it("een weekmaandag VÓÓR doelStart geeft null — de geklemde weekteller", () => {
    // REGRESSIE-TEST, gevonden in de weerleggingspas van 23-08-2026. computeMacroPhase klemt zijn
    // absolute weekteller met `if (absWeek < 1) absWeek = 1;`, dus ELKE weekmaandag op of vóór
    // doelStart leest week 1 — precies de waarde waar poort (1) sinds M92 op staat. De OUDE poort
    // stond daar dicht (geklemde weken geven isTestWeek false). GEMETEN vóór de reparatie: over
    // weekindex −26 t/m 26 vuurde de poort 29 keer, waarvan 26 buiten een echte opening.
    for (const ma of [
      "2026-06-22",
      "2026-06-15",
      "2026-06-08",
      "2026-05-18",
      "2026-01-05",
    ]) {
      expect(
        bouw({
          weekMondayISO: ma,
          todayISO: ma,
          plannerDays: weekVanaf(ma),
          events: [],
          activities: [],
        }),
      ).toBeNull();
    }
    // En de opening zelf vuurt nog wel.
    expect(
      bouw({
        weekMondayISO: DOELSTART,
        todayISO: DOELSTART,
        plannerDays: weekVanaf(DOELSTART),
        events: [],
        activities: [],
      }),
    ).not.toBeNull();
  });

  it("een doelwissel op DONDERDAG legt doelStart in de toekomst en mag geen dubbel aanbod geven", () => {
    // blokStartBijDoel legt de nieuwe doelStart op de VOLGENDE maandag zodra de wissel op donderdag
    // t/m zondag valt — vier van de zeven dagen — en de app rendert altijd de HUIDIGE week. Zonder
    // poort (1b) gaf dat TWEE aanbiedingen, zeven dagen uit elkaar, met VERSCHILLENDE
    // afwijs-sleutels, zodat een afwijzing op de eerste de tweede niet onderdrukte.
    const nieuweStart = blokStartBijDoel(
      "FTP",
      DOELSTART,
      "Conditie",
      "2026-08-06",
    );
    expect(nieuweStart).toBe("2026-08-10"); // donderdag -> volgende maandag
    const huidigeWeek = "2026-08-03";
    const inHuidigeWeek = buildTestVoorstel({
      plannerDays: weekVanaf(huidigeWeek),
      overrides: [],
      events: [race("2026-01-15")],
      activities: [act("2026-01-15")],
      doel: "Conditie",
      doelStart: nieuweStart,
      weekMondayISO: huidigeWeek,
      todayISO: "2026-08-06",
    });
    expect(inHuidigeWeek).toBeNull();
    // In de ECHTE openingsweek komt het aanbod wél.
    const inOpening = buildTestVoorstel({
      plannerDays: weekVanaf(nieuweStart),
      overrides: [],
      events: [race("2026-01-15")],
      activities: [act("2026-01-15")],
      doel: "Conditie",
      doelStart: nieuweStart,
      weekMondayISO: nieuweStart,
      todayISO: nieuweStart,
    });
    expect(inOpening?.datum).toBe("2026-08-15");
  });

  it("een doelStart die geen maandag is vuurt precies ÉÉN keer", () => {
    // doelStart is een vrij datumveld; oudere waarden staan op een willekeurige dag (zie de
    // docstring van weekMondayVan_ in blok.ts). Bij een woensdag lazen DRIE opeenvolgende maandagen
    // week 1: twee geklemd en één echt.
    const woensdag = "2026-07-01";
    const uitslagen = [
      "2026-06-22",
      "2026-06-29",
      "2026-07-06",
      "2026-07-13",
    ].map(
      (ma) =>
        bouw({
          doelStart: woensdag,
          weekMondayISO: ma,
          todayISO: ma,
          plannerDays: weekVanaf(ma),
          events: [],
          activities: [],
        }) !== null,
    );
    expect(uitslagen).toEqual([false, false, true, false]);
  });

  it("een doelwissel KORT NA een meting levert GEEN aanbod — de vloer doet daar zijn werk", () => {
    // De tegenhanger van de test hierboven, en samen leggen ze de rolverdeling vast: poort (1)
    // bewaakt de FREQUENTIE, de vloer bewaakt de NABIJHEID van een reeds gedane inspanning.
    const nieuweStart = blokStartBijDoel(
      "FTP",
      DOELSTART,
      "Conditie",
      "2026-08-05",
    );
    const kortGeleden = "2026-07-16"; // 23 dagen vóór de kandidaat-testdag 2026-08-08
    const v = buildTestVoorstel({
      plannerDays: weekVanaf(nieuweStart),
      overrides: [],
      events: [race(kortGeleden)],
      activities: [act(kortGeleden)],
      doel: "Conditie",
      doelStart: nieuweStart,
      weekMondayISO: nieuweStart,
      todayISO: nieuweStart,
    });
    expect(v).toBeNull();
  });

  it("een GELDIGE maar afwijkend geschreven doelStart gedraagt zich als voorheen", () => {
    // Tegenproef bij de regressie hierboven: "2026/06/29" parseert wél naar een geldige datum, en
    // daar hoort het aanbod gewoon te vuren. De vang mag niet te breed zijn.
    expect(bouw({ doelStart: "2026/06/29" })?.datum).toBe("2026-09-26");
  });

  it("doel Onderhoud → null (geen effect-meter)", () => {
    expect(bouw({ doel: "Onderhoud" })).toBeNull();
  });

  it("er staat al een test rond deze opening → null", () => {
    // HET VENSTER IS 23-08-2026 OMGEDRAAID (punt 62). Het loopt nu `[opening − 21, opening + 7)` =
    // [2026-08-31, 2026-09-28) en eindigt dus MET de aanbodweek in plaats van eraan te beginnen.
    // 2026-09-08 ligt daarbinnen, in een andere week dan de opening.
    expect(bouw({ overrides: [testOverride("2026-09-08")] })).toBeNull();
    // En in de openingsweek zelf ook.
    expect(bouw({ overrides: [testOverride("2026-09-22")] })).toBeNull();
  });

  it("een NIET GEREDEN test kort VÓÓR de opening onderdrukt het aanbod", () => {
    // DE REGRESSIE DIE RONDE 4 MAAKTE EN RONDE 5 REPAREERT. Zolang het venster vooruit keek,
    // ontsnapte deze test aan poort (3) — hij lag ervóór — én aan poort (7), want
    // `laatsteGelegenheid` telt alleen wat GEREDEN is. De app bood dan een TWEEDE test aan.
    // GEMETEN op de gebouwde bron vóór de reparatie: aanbod op 2026-09-26.
    for (const dagenVoor of [5, 10]) {
      const datum = isoMin(OPENING, dagenVoor);
      // NIET gereden: geen activities-rij op die dag.
      expect(bouw({ overrides: [testOverride(datum)] })).toBeNull();
    }
  });

  it("een test die ver vóór de opening ligt onderdrukt NIET", () => {
    // TEGENKANT: het venster is vier weken, niet het hele doelblok. Een geaccepteerde test van de
    // VORIGE opening ligt 84 dagen terug en mag deze opening niet dichtzetten — poort (7) beslist
    // daar, niet poort (3).
    expect(
      bouw({ overrides: [testOverride(isoMin(OPENING, 30))] }),
    ).not.toBeNull();
  });

  it("A- of B-wedstrijd binnen de horizon → null (die wedstrijd IS de meting)", () => {
    const binnen = "2026-10-10"; // 19 dagen na 14-09
    for (const p of ["A", "B"]) {
      expect(
        bouw({ events: [...OUDE_METING.events, race(binnen, p)] }),
      ).toBeNull();
    }
  });

  it("C-wedstrijd binnen de horizon → WEL een aanbod", () => {
    expect(
      bouw({ events: [...OUDE_METING.events, race("2026-10-10", "C")] }),
    ).not.toBeNull();
  });

  it("A-wedstrijd BUITEN de horizon → wel een aanbod", () => {
    const buiten = "2026-10-25"; // 34 dagen na 14-09, voorbij de horizon
    expect(WEDSTRIJD_HORIZON_DAGEN).toBe(28);
    expect(
      bouw({ events: [...OUDE_METING.events, race(buiten)] }),
    ).not.toBeNull();
  });

  it("geen kandidaat-dag → null", () => {
    const geen = week().map((d) => ({ ...d, minuten: 30 }));
    expect(bouw({ plannerDays: geen })).toBeNull();
  });

  it("interval nog niet vol → null", () => {
    // Wedstrijd op 2026-09-05: 21 dagen vóór de testdatum 2026-09-26.
    expect(
      bouw({
        events: [race("2026-09-05")],
        activities: [act("2026-09-05")],
      }),
    ).toBeNull();
  });

  it("nog nooit een maximum gezien → WEL aanbieden", () => {
    const v = bouw({ events: [], activities: [] });
    expect(v).not.toBeNull();
    expect(v?.laatsteMeting).toBeNull();
    expect(v?.dagenSinds).toBeNull();
  });

  it("een NIET gereden wedstrijd telt niet als meting → interval blijft open", () => {
    // Wedstrijd van 2026-09-05 zonder rit die dag: geen gelegenheid, dus wél aanbieden.
    expect(
      bouw({ events: [race("2026-09-05")], activities: [] }),
    ).not.toBeNull();
  });
});

describe("de INTERVALGRENS als dimensie, niet als vaste waarde", () => {
  // Nieuw 23-08-2026. De vorige twee bouwrondes strandden allebei op een gestipuleerde
  // beginconditie; deze toets loopt de dimensie AF in plaats van er één waarde uit te kiezen, en
  // pint waar de omslag ligt: op de GEKOZEN TESTDAG (2026-09-26), niet op de weekmaandag.
  const TESTDAG = "2026-09-26";
  const MS = 86400000;
  function metingOp(datumISO: string) {
    return bouw({ events: [race(datumISO)], activities: [act(datumISO)] });
  }
  function dagenTot(datumISO: string, totISO: string) {
    const [y1, m1, d1] = datumISO.split("-").map(Number);
    const [y2, m2, d2] = totISO.split("-").map(Number);
    return Math.round(
      (new Date(y2 ?? 0, (m2 ?? 1) - 1, d2 ?? 1).getTime() -
        new Date(y1 ?? 0, (m1 ?? 1) - 1, d1 ?? 1).getTime()) /
        MS,
    );
  }

  it("de omslag ligt EXACT op TEST_INTERVAL_DAGEN vóór de gekozen testdag", () => {
    // 2026-07-11 → 2026-09-26 is precies 77 dagen; 2026-07-12 is er 76.
    expect(dagenTot("2026-07-11", TESTDAG)).toBe(TEST_INTERVAL_DAGEN);
    expect(metingOp("2026-07-11")).not.toBeNull();
    expect(dagenTot("2026-07-12", TESTDAG)).toBe(TEST_INTERVAL_DAGEN - 1);
    expect(metingOp("2026-07-12")).toBeNull();
  });

  it("de vloer is AFGELEID uit de meetkunde van poort (1), geen los getal", () => {
    // DOEL_BLOK_WEKEN * 7 is de afstand tussen twee openingsMAANDAGEN; het aanbodvenster is zeven
    // dagen breed, want poort (5) kandideert de hele openingsweek. GEMETEN: de afstand tussen twee
    // gekozen testdagen ligt tussen 78 en 90, dus een vloer boven 78 onderdrukt natuurlijke
    // openingen. 77 = 84 − 7 ligt daar met één structurele dag marge onder.
    expect(DOEL_BLOK_WEKEN).toBe(12);
    expect(TEST_INTERVAL_DAGEN).toBe(DOEL_BLOK_WEKEN * 7 - 7);
    expect(TEST_INTERVAL_DAGEN).toBe(77);
  });

  it("de dimensie afgelopen: monotoon, precies één omslagpunt, en dat is de vloer", () => {
    // Elke laatste-meting-datum van 120 dagen vóór de testdag tot 60 dagen ervoor.
    const uitslagen: { dagen: number; aanbod: boolean }[] = [];
    for (let terug = 120; terug >= 60; terug--) {
      const [y, m, d] = TESTDAG.split("-").map(Number);
      const dt = new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) - terug);
      const p = (x: number) => String(x).padStart(2, "0");
      const datum = `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
      uitslagen.push({ dagen: terug, aanbod: metingOp(datum) != null });
    }
    expect(uitslagen).toHaveLength(61);
    // Monotoon: zodra het aanbod wegvalt komt het niet meer terug.
    const omslagen = uitslagen.filter(
      (u, i) => i > 0 && u.aanbod !== uitslagen[i - 1]?.aanbod,
    );
    expect(omslagen).toHaveLength(1);
    expect(omslagen[0]?.dagen).toBe(TEST_INTERVAL_DAGEN - 1);
    // En de twee uiteinden liggen zoals verwacht.
    expect(uitslagen[0]).toEqual({ dagen: 120, aanbod: true });
    expect(uitslagen[uitslagen.length - 1]).toEqual({
      dagen: 60,
      aanbod: false,
    });
  });
});

describe("buildTestVoorstel — de dagkeuze", () => {
  it("pendel-dag valt af", () => {
    const w = week();
    w[5] = { ...(w[5] as PlannerDay), dagtype: "pendel" };
    expect(bouw({ plannerDays: w })).toBeNull();
  });

  it("dag onder de minimum-beschikbaarheid valt af", () => {
    const w = week();
    w[5] = { ...(w[5] as PlannerDay), minuten: 59 };
    expect(bouw({ plannerDays: w })).toBeNull();
  });

  it("een dag in het VERLEDEN valt af", () => {
    // todayISO na de zaterdag → geen kandidaat meer.
    expect(bouw({ todayISO: "2026-09-27" })).toBeNull();
  });

  it("een dag met een override valt af", () => {
    expect(
      bouw({
        overrides: [
          { datum: "2026-09-26", override: { type: "rest" } } as OverrideEntry,
        ],
      }),
    ).toBeNull();
  });

  it("de MEESTE minuten wint", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 150 }; // donderdag 24-09
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-09-24");
  });

  it("gelijkspel → de LAATSTE datum", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 90 }; // do 24-09 gelijk aan za 26-09
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-09-26");
  });

  it("de dagkeuze kijkt NIET naar de vloer", () => {
    // Poort (6) kiest op MINUTEN; of die dag de intervalvloer haalt weegt niet mee. Deze test pint
    // dat gedrag vast — hij toont het op een week met TWEE kandidaten.
    //
    // LET OP WAT DEZE TEST NIET ZEGT. Hij is NIET de oorzaak van het residu dat de vorige ronde
    // overhield; die toeschrijving is in de weerleggingspas van 23-08-2026 weerlegd. Sinds de
    // verhuizing naar de opening en de afgeleide vloer is dat residu bovendien WEG — 440 van de 440
    // openingen worden bediend. Deze test blijft staan omdat het GEDRAG bestaat, niet omdat het
    // vandaag iets kost.
    const w = week();
    // Dinsdag ruimer dan zaterdag: poort (6) kiest dinsdag 22-09.
    w[1] = { ...(w[1] as PlannerDay), minuten: 150 };
    const laatste = "2026-07-09"; // 75 dagen vóór di 22-09, 79 vóór za 26-09
    const v = bouw({
      plannerDays: w,
      events: [race(laatste)],
      activities: [act(laatste)],
    });
    expect(v).toBeNull();
    // Zonder die ruimere dinsdag valt de keuze op zaterdag en haalt hij de vloer wél.
    const zonder = bouw({
      events: [race(laatste)],
      activities: [act(laatste)],
    });
    expect(zonder?.datum).toBe("2026-09-26");
  });
});

describe("IJK-CASUS op echte getallen", () => {
  // Laatste gelegenheid: de gereden A-wedstrijd van 21-05-2026 (de sprong 261 → 272).
  it("wedstrijd 21-05 → aanbod op 2026-09-26, 128 dagen ertussen", () => {
    const v = bouw();
    expect(v?.datum).toBe("2026-09-26");
    expect(v?.durMin).toBe(TEST_DUUR_MIN);
    expect(v?.beschikbaarMin).toBe(90);
    // De openingsweek IS vierweekse blokweek 1, dus de afwijs-sleutel is de openingsmaandag zelf.
    // Tot M92 lag het aanbod in blokweek 4 en wees de sleutel drie weken terug.
    expect(v?.blokStart).toBe("2026-09-21");
    expect(v?.laatsteMeting).toEqual({ bron: "race", datum: "2026-05-21" });
    expect(v?.dagenSinds).toBe(128);
    expect(v?.dagenSinds as number).toBeGreaterThanOrEqual(TEST_INTERVAL_DAGEN);
  });

  it("toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 75 tegen 80 dagen", () => {
    // Dragend: daarom ligt de intervalpoort op de TESTDATUM en niet op de weekmaandag.
    //
    // DE FIXTURE IS DRIE KEER VERPLAATST OP 23-08-2026, en de assertie is nooit verzwakt. Met vloer
    // 90 droeg de wedstrijd van 21-05 dit contrast (88 tot de maandag, 93 tot de testdag); onder
    // vloer 84 lagen die twee beide boven de vloer, dus kwam er een meting van 25-06 (81 tegen 86);
    // onder vloer 77 en de verhuisde openingsweek geldt dat opnieuw, en herstelt een meting van
    // 08-07 het contrast. Elke keer verhuist de FIXTURE, nooit de eis.
    const MS = 86400000;
    const dagenTot = (mnd: number, dag: number) =>
      Math.round(
        (new Date(2026, mnd, dag).getTime() - new Date(2026, 6, 8).getTime()) /
          MS,
      );
    const naarMaandag = dagenTot(8, 21); // 2026-09-21
    const naarTestdag = dagenTot(8, 26); // 2026-09-26
    expect(naarMaandag).toBe(75);
    expect(naarTestdag).toBe(80);
    expect(naarMaandag).toBeLessThan(TEST_INTERVAL_DAGEN);
    expect(naarTestdag).toBeGreaterThanOrEqual(TEST_INTERVAL_DAGEN);
    // En met de testdatum haalt hij het wél:
    expect(
      bouw({ events: [race("2026-07-08")], activities: [act("2026-07-08")] }),
    ).not.toBeNull();
  });
});

describe("de DRIE UITGANGEN en de bewaarde keuze (punt 59)", () => {
  it("een beantwoorde opening geeft GEEN tweede aanbod", () => {
    // POORT (2b). Bevestigen en niet-nu onderdrukken allebei; het verschil zit in wat de app erover
    // vertelt, niet in of de vraag terugkomt (M92: hoogstens één aanbod per opening).
    expect(bouw({ ijkingBeantwoordBlok: OPENING })).toBeNull();
  });

  it("een antwoord op een ANDERE opening onderdrukt niet", () => {
    // De openingsmaandag IS de identiteit. Het antwoord van het vorige doelblok mag dit blok niet
    // dichtzetten — anders zou één bevestiging voorgoed gelden.
    expect(bouw({ ijkingBeantwoordBlok: "2026-06-29" })).not.toBeNull();
    expect(bouw({ ijkingBeantwoordBlok: null })).not.toBeNull();
    expect(bouw({ ijkingBeantwoordBlok: undefined })).not.toBeNull();
  });

  it("BEVESTIGD levert de staat bevestigd-niet-gemeten", () => {
    const s = ijkStatus({
      activities: OUDE_METING.acts,
      events: OUDE_METING.events,
      overrides: [],
      todayISO: OPENING,
      ijkingAntwoord: "bevestigd",
      ijkingBeantwoordBlok: OPENING,
      huidigeOpening: OPENING,
    });
    expect(s.bevestigd).toBe(true);
    expect(s.ongeijkt).toBe(false);
    expect(s.laatsteMeting).toEqual({ bron: "race", datum: "2026-05-21" });
    // 2026-05-21 → 2026-09-21 is 123 dagen; 123 / 84 = 1 vol doelblok.
    expect(s.blokkenOud).toBe(1);
  });

  it("NIET-NU levert de ONGEIJKT-staat (M91)", () => {
    const s = ijkStatus({
      activities: OUDE_METING.acts,
      events: OUDE_METING.events,
      overrides: [],
      todayISO: OPENING,
      ijkingAntwoord: "niet_nu",
      ijkingBeantwoordBlok: OPENING,
      huidigeOpening: OPENING,
    });
    expect(s.ongeijkt).toBe(true);
    expect(s.bevestigd).toBe(false);
  });

  it("een antwoord op een OUDERE opening telt niet meer voor de staat", () => {
    const s = ijkStatus({
      activities: OUDE_METING.acts,
      events: OUDE_METING.events,
      overrides: [],
      todayISO: OPENING,
      ijkingAntwoord: "bevestigd",
      ijkingBeantwoordBlok: "2026-06-29",
      huidigeOpening: OPENING,
    });
    expect(s.bevestigd).toBe(false);
    expect(s.ongeijkt).toBe(false);
    // De LEEFTIJD staat er nog wel: die hangt aan de meting en niet aan het antwoord.
    expect(s.blokkenOud).toBe(1);
  });

  it("de leeftijd telt SPRONGEN niet mee — een proxy is geen meting (M91)", () => {
    // Zonder gereden race of test, alleen een sprong: de drempel is NOOIT gemeten.
    const s = ijkStatus({
      activities: [
        act("2026-05-14", 90, "Ride", 261),
        act("2026-05-21", 90, "Ride", 272),
      ],
      events: [],
      overrides: [],
      todayISO: OPENING,
    });
    expect(s.laatsteMeting).toBeNull();
    expect(s.blokkenOud).toBeNull();
  });

  it("de teller vraagt geen eigen opslag: hij volgt uit de laatste ECHTE meting", () => {
    // BESLUIT VIER, en dit is de vorm waarin hij gebouwd is. Twee doelblokken verder zonder meting
    // is 2, drie is 3 — zonder dat er ergens een teller staat.
    const mk = (dagenGeleden: number) => {
      const d = isoMin(OPENING, dagenGeleden);
      return ijkStatus({
        activities: [act(d)],
        events: [race(d)],
        overrides: [],
        todayISO: OPENING,
      }).blokkenOud;
    };
    expect(mk(83)).toBe(0);
    expect(mk(84)).toBe(1);
    expect(mk(168)).toBe(2);
    expect(mk(252)).toBe(3);
  });
});

describe("de SPRONG onderdrukt het ijkaanbod NIET meer (M91)", () => {
  // OMGEDRAAID 23-08-2026. Tot die datum onderdrukte een sprong in `rolling_ftp` het aanbod, en
  // deze drie tests pinden dat vast. M91 zegt dat een proxy de ijking niet vervangt en het aanbod
  // niet mag onderdrukken; `rolling_ftp` is intervals' eigen SCHATTING van de drempel, dus precies
  // zo'n proxy. Een sprong toont dát er hard gereden is, niet WELKE waarde het blok moet doseren.
  // GEMETEN vóór de ingreep: 162 van de 440 openingen (36,8 procent) werd door een sprong alleen
  // onderdrukt.

  it("een sprongdag vlak vóór de testdatum onderdrukt het aanbod NIET", () => {
    // Was: "een sprongdag binnen TEST_INTERVAL_DAGEN vóór de testdatum ONDERDRUKT het aanbod".
    const v = bouw({
      events: [],
      activities: [
        act("2026-08-29", 90, "Ride", 261),
        act("2026-09-05", 90, "Ride", 272),
      ],
    });
    expect(v).not.toBeNull();
    // En de sprong wordt ook niet als laatste meting gemeld: de poort kent hem niet.
    expect(v?.laatsteMeting).toBeNull();
    expect(v?.dagenSinds).toBeNull();
  });

  it("zonder die sprong blijft het aanbod staan", () => {
    // ONGEWIJZIGD, en dat is de tegenkant: zonder stijging was er ook vóór de ingreep geen
    // meetmoment. Deze test moet groen blijven om te tonen dat de ingreep de sprong-DETECTIE
    // wegneemt en niet het hele pad.
    const v = bouw({
      events: [],
      activities: [
        act("2026-08-29", 90, "Ride", 261),
        act("2026-09-05", 90, "Ride", 261),
      ],
    });
    expect(v).not.toBeNull();
    expect(v?.laatsteMeting).toBeNull();
  });

  it("een GEREDEN wedstrijd onderdrukt nog WEL — alleen de proxy is eruit", () => {
    // DRAGEND. Zonder deze assertie zou het uitzetten van poort (7) in zijn geheel ook slagen, en
    // dat is een andere ingreep dan M91 vraagt.
    const kort = isoMin(OPENING, 20);
    expect(bouw({ events: [race(kort)], activities: [act(kort)] })).toBeNull();
  });

  it("de sprong blijft INFORMANT: laatsteGelegenheid ziet hem zonder de vlag", () => {
    // De ijk-poort zet `negeerSprong: true`; de blok-terugblik in `blok.ts` doet dat NIET en noemt
    // de sprong in zijn copy. M91 verbiedt onderdrukken, niet informeren (M17, M30).
    const acts = [
      act("2026-05-14", 90, "Ride", 261),
      act("2026-05-21", 90, "Ride", 272),
    ];
    expect(
      laatsteGelegenheid({
        activities: acts,
        events: [],
        overrides: [],
        totISO: OPENING,
      }),
    ).toEqual({ bron: "inspanning", datum: "2026-05-21" });
    expect(
      laatsteGelegenheid({
        activities: acts,
        events: [],
        overrides: [],
        totISO: OPENING,
        negeerSprong: true,
      }),
    ).toBeNull();
  });
});

describe("de opening waarop het antwoord GELDT is de TWAALFWEEKSE (weerleggingspas 23-08-2026)", () => {
  // WAT HIER MIS GING EN GEEN TEST ZAG. `loadSchemaWeek` voedde `ijkStatus` met
  // `blokStartVoorWeek(...)` — de VIERWEEKSE mesoteller — terwijl `huidigeOpening` de
  // twaalfweekse openingsmaandag is. In de OPENINGSWEEK vallen die twee samen (de opening is per
  // constructie ook mesoblok-week 1), en alle bestaande `ijkStatus`-tests gaven `huidigeOpening`
  // met de hand mee. Gevolg, gemeten: `bevestigd` en `ongeijkt` golden alleen doelblokweek 1 t/m
  // 4 en verdwenen daarna — acht van de twaalf weken zonder de zichtbaarheid die M91 vraagt.
  //
  // DEZE TESTS VALLEN OM ZODRA IEMAND DE VIERWEEKSE TELLER TERUGZET.

  it("levert dezelfde opening voor ALLE twaalf weken van het doelblok", () => {
    const opening = doelblokOpeningVoorWeek(DOELSTART, OPENING);
    expect(opening).toBe(OPENING);
    for (let w = 0; w < DOEL_BLOK_WEKEN; w++) {
      expect(doelblokOpeningVoorWeek(DOELSTART, isoMin(OPENING, -w * 7))).toBe(
        OPENING,
      );
    }
    // En de week erná is een NIEUWE opening — niet dezelfde.
    expect(
      doelblokOpeningVoorWeek(DOELSTART, isoMin(OPENING, -DOEL_BLOK_WEKEN * 7)),
    ).toBe(isoMin(OPENING, -DOEL_BLOK_WEKEN * 7));
  });

  it("wijkt af van de VIERWEEKSE mesoteller vanaf doelblokweek 5", () => {
    // Het bewijs dat de twee grootheden verschillen, en precies waar. Vier weken samenloop,
    // daarna acht weken uit elkaar — de reden dat de fout onzichtbaar bleef.
    let gelijk = 0;
    for (let w = 0; w < DOEL_BLOK_WEKEN; w++) {
      const ma = isoMin(OPENING, -w * 7);
      if (
        doelblokOpeningVoorWeek(DOELSTART, ma) ===
        blokStartVoorWeek(DOELSTART, ma)
      )
        gelijk++;
    }
    expect(gelijk).toBe(BLOK_WEKEN);
  });

  it("de bevestiging blijft het HELE doelblok staan", () => {
    // De gedragstest die de bug zou hebben gevangen: dezelfde bewaarde rij, twaalf weken lang.
    for (let w = 0; w < DOEL_BLOK_WEKEN; w++) {
      const ma = isoMin(OPENING, -w * 7);
      const s = ijkStatus({
        activities: OUDE_METING.acts,
        events: OUDE_METING.events,
        overrides: [],
        todayISO: ma,
        ijkingAntwoord: "bevestigd",
        ijkingBeantwoordBlok: OPENING,
        huidigeOpening: doelblokOpeningVoorWeek(DOELSTART, ma),
      });
      expect(s.bevestigd).toBe(true);
      expect(s.ongeijkt).toBe(false);
    }
  });

  it("en vervalt op de VOLGENDE opening", () => {
    const ma = isoMin(OPENING, -DOEL_BLOK_WEKEN * 7);
    const s = ijkStatus({
      activities: OUDE_METING.acts,
      events: OUDE_METING.events,
      overrides: [],
      todayISO: ma,
      ijkingAntwoord: "bevestigd",
      ijkingBeantwoordBlok: OPENING,
      huidigeOpening: doelblokOpeningVoorWeek(DOELSTART, ma),
    });
    expect(s.bevestigd).toBe(false);
  });

  it("geen doelStart en een week vóór doelStart leveren null", () => {
    expect(doelblokOpeningVoorWeek(null, OPENING)).toBeNull();
    expect(doelblokOpeningVoorWeek("", OPENING)).toBeNull();
    // ONPARSEERBAAR, en let op WELKE string dat is. `parseLocalDate` matcht eerst op
    // `yyyy-MM-dd` en valt daarna terug op `new Date(iso)` — en die slikt "2026/06/29" gewoon,
    // als 29 juni 2026. Deze test verwachtte dat eerst wél en viel om; de CODE had gelijk. De
    // slash-vorm is een LEXICOGRAFISCH gevaar (poort (1b) van ronde 4 vergeleek strings, en "/"
    // sorteert boven "-"), geen ongeldige datum.
    expect(doelblokOpeningVoorWeek("geen-datum", OPENING)).toBeNull();
    expect(doelblokOpeningVoorWeek("2026/06/29", OPENING)).toBe(OPENING);
    expect(doelblokOpeningVoorWeek(DOELSTART, isoMin(DOELSTART, 7))).toBeNull();
  });
});

describe("het venster van poort (3) is VERBREED, niet gedraaid (weerleggingspas 23-08-2026)", () => {
  // MIJN EERSTE VERSIE ZETTE HET VENSTER OP [opening − 21, opening + 7) — "dezelfde span, alleen
  // de richting klopt weer". Dat was geen correctie maar een ROTATIE: een niet-gereden test in
  // week 2 t/m 4 van het doelblok werd door het OUDE venster onderdrukt en door het geroteerde
  // niet meer. GEMETEN op de gebouwde bron, 20 ketens × 260 weken: 0 aanbiedingen op 440
  // openingen met het oude venster, 440 op 440 met het geroteerde. Het venster is nu strikt
  // ADDITIEF — de oude vier weken vanaf de opening, plus de aanloop van drie weken ervóór.
  const testOverride = (datum: string): OverrideEntry => ({
    datum,
    override: { type: "library", workoutType: "test", durMin: 60 },
  });

  it("onderdrukt een geplande test in de AANLOOP — de reparatie van ronde 5", () => {
    for (const d of [1, 5, 10, 14, 20]) {
      expect(
        bouw({ overrides: [testOverride(isoMin(OPENING, d))] }),
      ).toBeNull();
    }
  });

  it("onderdrukt een geplande test NA de opening — het gedrag van vóór 23-08-2026", () => {
    for (const d of [2, 7, 14, 21, 27]) {
      expect(
        bouw({ overrides: [testOverride(isoMin(OPENING, -d))] }),
      ).toBeNull();
    }
  });

  it("laat een test BUITEN het venster staan", () => {
    // De randen: 22 dagen ervóór en 28 dagen erná vallen er net buiten. Dat is de eerlijke helft —
    // een venster dat alles slikt zou het aanbod nooit meer laten vuren.
    expect(
      bouw({ overrides: [testOverride(isoMin(OPENING, 22))] }),
    ).not.toBeNull();
    expect(
      bouw({ overrides: [testOverride(isoMin(OPENING, -28))] }),
    ).not.toBeNull();
  });
});
