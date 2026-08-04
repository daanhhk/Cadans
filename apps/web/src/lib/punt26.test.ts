import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { derivePlannerGedaan } from "./activities";
import { buildWeekProposal } from "./proposal";
import { withDoneTodayEntries } from "./weekplanBlob";

// ROADMAP punt 26 — DE VANDAAG-GEREDEN DAG VERLIEST ZIJN PLAN.
//
// Een dag die VANDAAG gereden is heeft geen sessies meer (de allocator bouwt die alleen voor nog
// te plannen dagen) en viel tot deze bouw ook buiten de bevroren-entry-tak, want die stond op
// `isPast` — strikt in het verleden. Gevolg: geen plan-vergelijking op de VOLTOOID-kaart en de
// dag valt uit alle drie de weeknoemers. Zie docs/PUNT26-BOUWDOC.md.
//
// DE HARNESS KAN DIT NIET FOTOGRAFEREN: hij zaait alleen de plan-kant, en de geleverde kant komt
// uit `activities` in de lokale D1 waar de enige schrijfroute `POST /sync/activities` is. De
// dekking moet dus volledig uit deze tests komen — vandaar dat T1 óók de POORT asserteert.

// Klok BINNEN de fixture-week: de grid-map en `dayPlannable` dateren zich op de ambient klok.
const VANDAAG = new Date(2026, 2, 11, 9, 0, 0); // 2026-03-11, wo
const TODAY = "2026-03-11";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(VANDAAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: null,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

const dag = (
  datum: string,
  d: string,
  minuten: number | null,
  train = true,
): PlannerDay => ({
  datum,
  train,
  dag: d,
  minuten,
  dagtype: minuten == null ? null : "vrij",
  toelichting: null,
  voorgesteldType: null,
  gedaan: false,
});

const WEEK: PlannerDay[] = [
  dag("2026-03-09", "ma", null, false),
  dag("2026-03-10", "di", null, false),
  dag("2026-03-11", "wo", 60), // VANDAAG, en die wordt gereden
  dag("2026-03-12", "do", null, false),
  dag("2026-03-13", "vr", null, false),
  dag("2026-03-14", "za", 120),
  dag("2026-03-15", "zo", null, false),
];

// De rit van vandaag. Activities zijn RIJEN (ActValuesRow), niet objecten: idx0 datum, idx1 type,
// idx3 minuten, idx7 IF, idx8 TSS. `derivePlannerGedaan` eist minstens 50% van de geplande duur,
// dus 60 min gepland vraagt 30 min gereden; 55 zit daar ruim boven en maakt de drempel niet fragiel.
function actRow(dt: Date, type: string, min: number, tss: number): unknown[] {
  const r: unknown[] = new Array(17).fill("");
  r[0] = dt;
  r[1] = type;
  r[3] = min;
  r[7] = 0.72;
  r[8] = tss;
  return r;
}
const ACT_VANDAAG = actRow(new Date(2026, 2, 11, 9, 30, 0), "Ride", 55, 48);

// De BEWAARDE entry van vandaag, met eigen waarden zodat een herberekening zichtbaar zou zijn.
const BEWAARD = {
  datum: TODAY,
  workoutType: "sweet_spot",
  archetypeId: "sweetspot_2x15",
  naam: "Sweet Spot 2x15 (bewaard)",
  variantId: "ss_2x15_v2",
  zones: ["tempo"],
  minuten: 61,
  tss: 57,
  sessies: [],
};

function bouw(opts: { metRit: boolean; blob?: unknown[] }) {
  return buildWeekProposal({
    settings: SETTINGS,
    plannerDays: WEEK,
    events: [],
    activities: opts.metRit ? [ACT_VANDAAG] : [],
    // `weekplans` is een PLATTE entry-array met een `datum`-veld (frozenEntryByDate,
    // proposal.ts:209) — geen {weekMonday, entries}-wikkel.
    weekplans: opts.blob ?? [BEWAARD],
    wellness: [],
    rpe: [],
    todayISO: TODAY,
  } as never);
}

const dagVan = (w: any, datum: string) =>
  (w.days as any[]).find((d) => d.datum === datum);

describe("punt 26 — T1 producent: de vandaag-gereden dag houdt zijn plan", () => {
  it("plannedForDone komt VERBATIM uit de bewaarde entry, en de poort staat open", () => {
    // DE POORT EXPLICIET. Verschuift `derivePlannerGedaan`, dan gaat deze test niet stil dood
    // maar valt hij hier om — het geval is dan simpelweg niet meer bereikbaar.
    const gedaan = derivePlannerGedaan(WEEK as never, [ACT_VANDAAG] as never);
    expect(gedaan).toContain(TODAY);

    const w = bouw({ metRit: true });
    const d = dagVan(w, TODAY);
    expect(d.sessions.length).toBe(0);
    expect(d.plannedForDone).not.toBeNull();
    // GEEN herberekening: exact de opgeslagen waarden.
    expect(d.plannedForDone.naam).toBe(BEWAARD.naam);
    expect(d.plannedForDone.totaalMin).toBe(BEWAARD.minuten);
    expect(d.plannedForDone.tss).toBe(BEWAARD.tss);
    // Het type valt terug op workoutType uit de entry.
    expect(d.voorgesteldType).toBe(BEWAARD.workoutType);
  });
});

describe("punt 26 — T2 poort: zonder rit gebeurt er niets", () => {
  it("dezelfde week ZONDER de activity → plannedForDone blijft null", () => {
    const d = dagVan(bouw({ metRit: false }), TODAY);
    expect(d.plannedForDone).toBeNull();
  });

  it("een NIET-trainingsdag van vandaag met een entry in de blob → ook null", () => {
    const rustWeek = WEEK.map((p) =>
      p.datum === TODAY ? { ...p, train: false, minuten: null } : p,
    );
    const w = buildWeekProposal({
      settings: SETTINGS,
      plannerDays: rustWeek,
      events: [],
      activities: [],
      weekplans: [BEWAARD],
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    } as never);
    expect(dagVan(w, TODAY).plannedForDone).toBeNull();
  });
});

describe("punt 26 — T3 schrijfkant: withDoneTodayEntries", () => {
  const week = () => bouw({ metRit: true });

  it("draagt de bewaarde entry VERBATIM over, inclusief variantId en archetypeId", () => {
    const uit = withDoneTodayEntries([], week() as never, [BEWAARD], TODAY);
    expect(uit.length).toBe(1);
    // Deep-equal: een herbouw uit plannedForDone zou variantId en archetypeId verliezen, en
    // juist die leest de recency-seed.
    expect(uit[0]).toEqual(BEWAARD);
  });

  it("voegt niets toe als de dag SESSIES heeft", () => {
    const w = bouw({ metRit: false }); // vandaag houdt zijn sessies
    expect(withDoneTodayEntries([], w as never, [BEWAARD], TODAY)).toEqual([]);
  });

  it("voegt niets toe voor een dag in het VERLEDEN (dat doet de worker-freeze)", () => {
    const morgen = "2026-03-12";
    expect(
      withDoneTodayEntries([], week() as never, [BEWAARD], morgen),
    ).toEqual([]);
  });

  it("voegt niets toe als plannedForDone null is", () => {
    const w = bouw({ metRit: false });
    expect(withDoneTodayEntries([], w as never, [BEWAARD], TODAY)).toEqual([]);
  });

  it("voegt niets toe als stored geen entry voor die datum heeft", () => {
    expect(
      withDoneTodayEntries(
        [],
        week() as never,
        [{ ...BEWAARD, datum: "2026-03-14" }],
        TODAY,
      ),
    ).toEqual([]);
  });

  it("muteert de invoer niet en dedupliceert op datum", () => {
    const entries = [{ ...BEWAARD }] as never[];
    const stored = [BEWAARD];
    const uit = withDoneTodayEntries(entries, week() as never, stored, TODAY);
    // De datum stond al in entries → niets erbij, en entries blijft één lang.
    expect(uit.length).toBe(1);
    expect(entries.length).toBe(1);
    expect(stored.length).toBe(1);
  });
});
