import type { EventItem, OverrideEntry, PlannerDay } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { BLOK_WEKEN, blokWeekVanWeek } from "./blok";
import {
  buildTestVoorstel,
  TEST_DUUR_MIN,
  TEST_INTERVAL_DAGEN,
  WEDSTRIJD_HORIZON_DAGEN,
} from "./testvoorstel";

// Geen vi.setSystemTime nodig: elke datum is een parameter.

const DOELSTART = "2026-06-29";
/**
 * DE DOELBLOK-TESTWEEK: week 12 van het twaalfweekse doelblok, weekindex 11 sinds `doelStart`.
 *
 * VERPLAATST 23-08-2026 van `2026-08-17` naar `2026-09-14`. Poort (1) toetst sinds die datum
 * `computeMacroPhase(...).isTestWeek` in plaats van de vierweekse blokweek. `2026-08-17` is óók een
 * vierweekse opening (blokweek 4) maar doelblokweek 8, en daar vuurt het aanbod dus niet meer —
 * dat is precies de versmalling, en er staat een eigen test op.
 */
const TESTWEEK = "2026-09-14";
/** Vierweekse openingen (blokweek 4) die GEEN doelblok-testweek zijn — hier hoort niets te vuren. */
const OPENING_GEEN_TESTWEEK = ["2026-07-20", "2026-08-17", "2026-10-12"];
/** Weekindex 0 t/m 10 sinds `doelStart` — doelblokweek 1 t/m 11. */
const ELF_WEKEN_VOOR_DE_TESTWEEK = [
  "2026-06-29",
  "2026-07-06",
  "2026-07-13",
  "2026-07-20",
  "2026-07-27",
  "2026-08-03",
  "2026-08-10",
  "2026-08-17",
  "2026-08-24",
  "2026-08-31",
  "2026-09-07",
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

/** De doelblok-testweek 14-09 t/m 20-09: alleen zaterdag draagt genoeg tijd. */
function week(o: Partial<PlannerDay>[] = []): PlannerDay[] {
  const basis = [
    pday("2026-09-14", { train: false, minuten: null }),
    pday("2026-09-15", { minuten: 45 }),
    pday("2026-09-16", { train: false, minuten: null }),
    pday("2026-09-17", { minuten: 45 }),
    pday("2026-09-18", { train: false, minuten: null }),
    pday("2026-09-19", { minuten: 90 }),
    pday("2026-09-20", { train: false, minuten: null }),
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
  } = {},
) {
  return buildTestVoorstel({
    plannerDays: o.plannerDays ?? week(),
    overrides: o.overrides ?? [],
    events: o.events ?? OUDE_METING.events,
    activities: o.activities ?? OUDE_METING.acts,
    doel: o.doel ?? "FTP",
    doelStart: o.doelStart === undefined ? DOELSTART : o.doelStart,
    weekMondayISO: o.weekMondayISO ?? TESTWEEK,
    todayISO: o.todayISO ?? TESTWEEK,
  });
}

describe("buildTestVoorstel — de poorten", () => {
  it("alleen in de DOELBLOK-TESTWEEK: de elf weken ervoor geven null", () => {
    // Weekindex 0 t/m 10 sinds doelStart — doelblokweek 1 t/m 11. Twee ervan zijn óók een
    // vierweekse opening (index 3 en 7), en juist die twee vuurden vóór de versmalling wél.
    for (const maandag of ELF_WEKEN_VOOR_DE_TESTWEEK) {
      expect(
        bouw({
          weekMondayISO: maandag,
          todayISO: maandag,
          plannerDays: weekVanaf(maandag),
        }),
      ).toBeNull();
    }
    expect(ELF_WEKEN_VOOR_DE_TESTWEEK).toHaveLength(11);
    expect(bouw()).not.toBeNull();
  });

  it("een vierweekse OPENING die geen doelblok-testweek is geeft null", () => {
    // DIT IS DE VERSMALLING VAN 23-08-2026. Alle drie zijn blokweek 4 — vóór die datum vuurde het
    // aanbod hier — maar hun doelblokweek is 4, 8 en 4, niet 12.
    for (const ma of OPENING_GEEN_TESTWEEK) {
      expect(blokWeekVanWeek(DOELSTART, ma)).toBe(BLOK_WEKEN);
      expect(
        bouw({ weekMondayISO: ma, todayISO: ma, plannerDays: weekVanaf(ma) }),
      ).toBeNull();
    }
  });

  it("de doelblok-testweek IS per constructie ook een vierweekse opening", () => {
    // Dragend: daarom mogen poort (3) en de afwijs-sleutel op de VIERWEEKSE klok blijven staan.
    // Vier opeenvolgende doelblok-testweken, elk 12 weken na de vorige.
    for (const ma of ["2026-09-14", "2026-12-07", "2027-03-01", "2027-05-24"]) {
      expect(blokWeekVanWeek(DOELSTART, ma)).toBe(BLOK_WEKEN);
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

  it("een GELDIGE maar afwijkend geschreven doelStart gedraagt zich als voorheen", () => {
    // Tegenproef bij de regressie hierboven: "2026/06/29" parseert wél naar een geldige datum, en
    // daar hoort het aanbod gewoon te vuren. De vang mag niet te breed zijn.
    expect(bouw({ doelStart: "2026/06/29" })?.datum).toBe("2026-09-19");
  });

  it("doel Onderhoud → null (geen effect-meter)", () => {
    expect(bouw({ doel: "Onderhoud" })).toBeNull();
  });

  it("er staat al een test in dit blok → null", () => {
    // Het vierweekse blok van de testweek 2026-09-14 begint op 2026-08-24 en eindigt vóór
    // 2026-09-21. 2026-08-26 valt daarbinnen, maar in een andere week.
    expect(bouw({ overrides: [testOverride("2026-08-26")] })).toBeNull();
  });

  it("A- of B-wedstrijd binnen de horizon → null (die wedstrijd IS de meting)", () => {
    const binnen = "2026-10-03"; // 19 dagen na 14-09
    for (const p of ["A", "B"]) {
      expect(
        bouw({ events: [...OUDE_METING.events, race(binnen, p)] }),
      ).toBeNull();
    }
  });

  it("C-wedstrijd binnen de horizon → WEL een aanbod", () => {
    expect(
      bouw({ events: [...OUDE_METING.events, race("2026-10-03", "C")] }),
    ).not.toBeNull();
  });

  it("A-wedstrijd BUITEN de horizon → wel een aanbod", () => {
    const buiten = "2026-10-18"; // 34 dagen na 14-09, voorbij de horizon
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
    // Wedstrijd op 2026-08-29: 21 dagen vóór de testdatum 2026-09-19.
    expect(
      bouw({
        events: [race("2026-08-29")],
        activities: [act("2026-08-29")],
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
    // Wedstrijd van 2026-08-29 zonder rit die dag: geen gelegenheid, dus wél aanbieden.
    expect(
      bouw({ events: [race("2026-08-29")], activities: [] }),
    ).not.toBeNull();
  });
});

describe("de INTERVALGRENS als dimensie, niet als vaste waarde", () => {
  // Nieuw 23-08-2026. De vorige twee bouwrondes strandden allebei op een gestipuleerde
  // beginconditie; deze toets loopt de dimensie AF in plaats van er één waarde uit te kiezen, en
  // pint waar de omslag ligt: op de GEKOZEN TESTDAG (2026-09-19), niet op de weekmaandag.
  const TESTDAG = "2026-09-19";
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
    // 2026-06-27 → 2026-09-19 is precies 84 dagen; 2026-06-28 is er 83.
    expect(dagenTot("2026-06-27", TESTDAG)).toBe(TEST_INTERVAL_DAGEN);
    expect(metingOp("2026-06-27")).not.toBeNull();
    expect(dagenTot("2026-06-28", TESTDAG)).toBe(TEST_INTERVAL_DAGEN - 1);
    expect(metingOp("2026-06-28")).toBeNull();
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
    expect(bouw({ todayISO: "2026-09-20" })).toBeNull();
  });

  it("een dag met een override valt af", () => {
    expect(
      bouw({
        overrides: [
          { datum: "2026-09-19", override: { type: "rest" } } as OverrideEntry,
        ],
      }),
    ).toBeNull();
  });

  it("de MEESTE minuten wint", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 150 }; // donderdag 17-09
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-09-17");
  });

  it("gelijkspel → de LAATSTE datum", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 90 }; // do 17-09 gelijk aan za 19-09
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-09-19");
  });

  it("de dagkeuze kijkt NIET naar de vloer", () => {
    // Poort (6) kiest op MINUTEN; of die dag de intervalvloer haalt weegt niet mee. Deze test pint
    // dat gedrag vast — hij toont het op een week met TWEE kandidaten.
    //
    // LET OP WAT DEZE TEST NIET ZEGT. Hij is NIET de oorzaak van het residu dat na de versmalling
    // overblijft; die toeschrijving is in de weerleggingspas van 23-08-2026 weerlegd. GEMETEN
    // (docs/PUNT47-BOUW.md §16): van de 176 gemiste doelblokgrenzen draagt de werkelijke week in
    // 176 van de 176 gevallen precies ÉÉN kandidaat, dus daar valt niets te kiezen, en alle 176
    // vuren alsnog zodra de vloer op 0 staat. Het residu komt dus van poort (7). Zie punt 58.
    const w = week();
    // Dinsdag ruimer dan zaterdag: poort (6) kiest dinsdag 15-09.
    w[1] = { ...(w[1] as PlannerDay), minuten: 150 };
    const laatste = "2026-06-25"; // 82 dagen vóór di 15-09, 86 vóór za 19-09
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
    expect(zonder?.datum).toBe("2026-09-19");
  });
});

describe("IJK-CASUS op echte getallen", () => {
  // Laatste gelegenheid: de gereden A-wedstrijd van 21-05-2026 (de sprong 261 → 272).
  it("wedstrijd 21-05 → aanbod op 2026-09-19, 121 dagen ertussen", () => {
    const v = bouw();
    expect(v?.datum).toBe("2026-09-19");
    expect(v?.durMin).toBe(TEST_DUUR_MIN);
    expect(v?.beschikbaarMin).toBe(90);
    expect(v?.blokStart).toBe("2026-08-24");
    expect(v?.laatsteMeting).toEqual({ bron: "race", datum: "2026-05-21" });
    expect(v?.dagenSinds).toBe(121);
    expect(v?.dagenSinds as number).toBeGreaterThanOrEqual(TEST_INTERVAL_DAGEN);
  });

  it("toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 81 tegen 86 dagen", () => {
    // Dragend: daarom ligt de intervalpoort op de TESTDATUM en niet op de weekmaandag.
    //
    // DE FIXTURE IS 23-08-2026 VERPLAATST, en niet de assertie verzwakt. Met de oude vloer van 90
    // droeg de wedstrijd van 21-05 dit contrast (88 dagen tot de maandag, 93 tot de testdag). Onder
    // de vloer van 84 liggen die twee ALLEBEI boven de vloer en toont die fixture niets meer. Een
    // meting van 25-06 herstelt het contrast op de nieuwe vloer.
    const MS = 86400000;
    const dagenTot = (mnd: number, dag: number) =>
      Math.round(
        (new Date(2026, mnd, dag).getTime() - new Date(2026, 5, 25).getTime()) /
          MS,
      );
    const naarMaandag = dagenTot(8, 14); // 2026-09-14
    const naarTestdag = dagenTot(8, 19); // 2026-09-19
    expect(naarMaandag).toBe(81);
    expect(naarTestdag).toBe(86);
    expect(naarMaandag).toBeLessThan(TEST_INTERVAL_DAGEN);
    expect(naarTestdag).toBeGreaterThanOrEqual(TEST_INTERVAL_DAGEN);
    // En met de testdatum haalt hij het wél:
    expect(
      bouw({ events: [race("2026-06-25")], activities: [act("2026-06-25")] }),
    ).not.toBeNull();
  });
});

describe("de SPRONG als derde meetmoment", () => {
  it("een sprongdag binnen TEST_INTERVAL_DAGEN vóór de testdatum ONDERDRUKT het aanbod", () => {
    // Geen test en geen wedstrijd, maar de rolling FTP sprong op 2026-08-29 (261 → 272):
    // 21 dagen vóór de testdatum 2026-09-19, dus ruim binnen het interval.
    const v = bouw({
      events: [],
      activities: [
        act("2026-08-22", 90, "Ride", 261),
        act("2026-08-29", 90, "Ride", 272),
      ],
    });
    expect(v).toBeNull();
  });

  it("zonder die sprong blijft het aanbod staan", () => {
    // Dezelfde twee dagen, maar zonder stijging → geen meetmoment → wél aanbieden.
    const v = bouw({
      events: [],
      activities: [
        act("2026-08-22", 90, "Ride", 261),
        act("2026-08-29", 90, "Ride", 261),
      ],
    });
    expect(v).not.toBeNull();
    expect(v?.laatsteMeting).toBeNull();
  });

  it("een sprong LANG geleden laat het aanbod staan en wordt als bron gemeld", () => {
    const v = bouw({
      events: [],
      activities: [
        act("2026-05-14", 90, "Ride", 261),
        act("2026-05-21", 90, "Ride", 272),
      ],
    });
    expect(v?.laatsteMeting).toEqual({
      bron: "inspanning",
      datum: "2026-05-21",
    });
    expect(v?.dagenSinds).toBe(121);
  });
});
