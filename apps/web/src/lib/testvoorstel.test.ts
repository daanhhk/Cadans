import type { EventItem, OverrideEntry, PlannerDay } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  buildTestVoorstel,
  TEST_DUUR_MIN,
  TEST_INTERVAL_DAGEN,
  WEDSTRIJD_HORIZON_DAGEN,
} from "./testvoorstel";

// Geen vi.setSystemTime nodig: elke datum is een parameter.

const DOELSTART = "2026-06-29";
/** Blokweek 4 van het blok dat op 2026-07-27 begint → de rustweek. */
const RUSTWEEK = "2026-08-17";

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

/** De rustweek 17-08 t/m 23-08: alleen zaterdag draagt genoeg tijd. */
function week(o: Partial<PlannerDay>[] = []): PlannerDay[] {
  const basis = [
    pday("2026-08-17", { train: false, minuten: null }),
    pday("2026-08-18", { minuten: 45 }),
    pday("2026-08-19", { train: false, minuten: null }),
    pday("2026-08-20", { minuten: 45 }),
    pday("2026-08-21", { train: false, minuten: null }),
    pday("2026-08-22", { minuten: 90 }),
    pday("2026-08-23", { train: false, minuten: null }),
  ];
  return basis.map((d, i) => ({ ...d, ...(o[i] ?? {}) }));
}

function act(datumISO: string, minuten = 90, type = "Ride"): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  row[1] = type;
  row[3] = minuten;
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
    doelStart: DOELSTART,
    weekMondayISO: o.weekMondayISO ?? RUSTWEEK,
    todayISO: o.todayISO ?? RUSTWEEK,
  });
}

describe("buildTestVoorstel — de poorten", () => {
  it("alleen in de RUSTWEEK: blokweek 1, 2 en 3 geven null", () => {
    for (const ma of ["2026-07-27", "2026-08-03", "2026-08-10"]) {
      expect(bouw({ weekMondayISO: ma, todayISO: ma })).toBeNull();
    }
    expect(bouw()).not.toBeNull();
  });

  it("doel Onderhoud → null (geen effect-meter)", () => {
    expect(bouw({ doel: "Onderhoud" })).toBeNull();
  });

  it("er staat al een test in dit blok → null", () => {
    // 2026-08-05 valt in hetzelfde blok (start 2026-07-27), maar in een andere week.
    expect(bouw({ overrides: [testOverride("2026-08-05")] })).toBeNull();
  });

  it("A- of B-wedstrijd binnen de horizon → null (die wedstrijd IS de meting)", () => {
    const binnen = "2026-09-05"; // 19 dagen na 17-08
    for (const p of ["A", "B"]) {
      expect(
        bouw({ events: [...OUDE_METING.events, race(binnen, p)] }),
      ).toBeNull();
    }
  });

  it("C-wedstrijd binnen de horizon → WEL een aanbod", () => {
    expect(
      bouw({ events: [...OUDE_METING.events, race("2026-09-05", "C")] }),
    ).not.toBeNull();
  });

  it("A-wedstrijd BUITEN de horizon → wel een aanbod", () => {
    const buiten = "2026-09-20"; // 34 dagen na 17-08, voorbij de horizon
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
    // Wedstrijd op 2026-08-01: 21 dagen vóór de testdatum 2026-08-22.
    expect(
      bouw({
        events: [race("2026-08-01")],
        activities: [act("2026-08-01")],
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
    // Wedstrijd van 2026-08-01 zonder rit die dag: geen gelegenheid, dus wél aanbieden.
    expect(
      bouw({ events: [race("2026-08-01")], activities: [] }),
    ).not.toBeNull();
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
    expect(bouw({ todayISO: "2026-08-23" })).toBeNull();
  });

  it("een dag met een override valt af", () => {
    expect(
      bouw({
        overrides: [
          { datum: "2026-08-22", override: { type: "rest" } } as OverrideEntry,
        ],
      }),
    ).toBeNull();
  });

  it("de MEESTE minuten wint", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 150 }; // donderdag 20-08
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-08-20");
  });

  it("gelijkspel → de LAATSTE datum", () => {
    const w = week();
    w[3] = { ...(w[3] as PlannerDay), minuten: 90 }; // do 20-08 gelijk aan za 22-08
    expect(bouw({ plannerDays: w })?.datum).toBe("2026-08-22");
  });
});

describe("IJK-CASUS op echte getallen", () => {
  // Laatste gelegenheid: de gereden A-wedstrijd van 21-05-2026 (de sprong 261 → 272).
  it("wedstrijd 21-05 → aanbod op 2026-08-22, 93 dagen ertussen", () => {
    const v = bouw();
    expect(v?.datum).toBe("2026-08-22");
    expect(v?.durMin).toBe(TEST_DUUR_MIN);
    expect(v?.beschikbaarMin).toBe(90);
    expect(v?.blokStart).toBe("2026-07-27");
    expect(v?.laatsteMeting).toEqual({ bron: "race", datum: "2026-05-21" });
    expect(v?.dagenSinds).toBe(93);
    expect(v?.dagenSinds as number).toBeGreaterThanOrEqual(TEST_INTERVAL_DAGEN);
  });

  it("toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 88 dagen", () => {
    // Dragend: daarom ligt de intervalpoort op de TESTDATUM en niet op de weekmaandag.
    // 2026-05-21 → 2026-08-17 is 88 dagen, onder TEST_INTERVAL_DAGEN.
    const MS = 86400000;
    const dagen = Math.round(
      (new Date(2026, 7, 17).getTime() - new Date(2026, 4, 21).getTime()) / MS,
    );
    expect(dagen).toBe(88);
    expect(dagen).toBeLessThan(TEST_INTERVAL_DAGEN);
    // En met de testdatum haalt hij het wél:
    expect(bouw()).not.toBeNull();
  });
});
