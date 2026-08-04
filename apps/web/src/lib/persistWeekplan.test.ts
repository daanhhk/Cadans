import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// De schrijf-kant is fire-and-forget; mock de API-laag zodat we zien WAT er de deur uit gaat.
const putWeekplan = vi.fn(() => Promise.resolve());
vi.mock("./api", () => ({
  putWeekplan: (...args: unknown[]) => putWeekplan(...(args as [])),
}));

const { persistWeekplan } = await import("./schema");
const { buildWeekProposal } = await import("./proposal");
const { buildWeekplanEntries } = await import("./weekplanBlob");

const TODAY = "2026-03-11";

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

const WEEK: PlannerDay[] = [
  {
    datum: "2026-03-11",
    train: true,
    dag: "wo",
    minuten: 60,
    dagtype: "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  },
  {
    datum: "2026-03-14",
    train: true,
    dag: "za",
    minuten: 120,
    dagtype: "weekend",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  },
];

function week() {
  return buildWeekProposal({
    settings: SETTINGS,
    plannerDays: WEEK,
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: TODAY,
  });
}

beforeEach(() => {
  putWeekplan.mockClear();
});

describe("persistWeekplan (laag 1a — schrijf-kant)", () => {
  it("lege opslag → PUT met (maandag, entries, todayISO) in die volgorde", () => {
    const w = week();
    expect(persistWeekplan(w, "FTP", [], TODAY)).toBe(true);
    expect(putWeekplan).toHaveBeenCalledTimes(1);
    const [monday, entries, todayISO] = putWeekplan.mock
      .calls[0] as unknown as [string, { datum: string }[], string];
    // Arg-volgorde: doel en todayISO zijn allebei strings → een verwisseling zou
    // typechecken. Deze assertie pint 'm vast.
    expect(monday).toBe("2026-03-09");
    expect(todayISO).toBe(TODAY);
    expect(entries.map((e) => e.datum)).toEqual(["2026-03-11", "2026-03-14"]);
  });

  it("al opgeslagen, ongewijzigd → GEEN PUT (dedup; niet elke render schrijven)", () => {
    const w = week();
    const stored = buildWeekplanEntries(w, "FTP");
    expect(persistWeekplan(w, "FTP", stored, TODAY)).toBe(false);
    expect(putWeekplan).not.toHaveBeenCalled();
  });

  it("alleen het VERLEDEN verschilt → nog steeds geen PUT (dat bevriest de worker)", () => {
    const w = week();
    const stored = [
      { datum: "2026-03-09", naam: "oude maandag" },
      ...buildWeekplanEntries(w, "FTP"),
    ];
    expect(persistWeekplan(w, "FTP", stored, TODAY)).toBe(false);
    expect(putWeekplan).not.toHaveBeenCalled();
  });

  it("gewijzigde vooruit-dag → wél PUT", () => {
    const w = week();
    const stored = buildWeekplanEntries(w, "FTP").map((e) =>
      e.datum === "2026-03-14" ? { ...e, tss: e.tss + 25 } : e,
    );
    expect(persistWeekplan(w, "FTP", stored, TODAY)).toBe(true);
    expect(putWeekplan).toHaveBeenCalledTimes(1);
  });

  it("een falende PUT gooit niet door (fire-and-forget)", () => {
    putWeekplan.mockImplementationOnce(() => Promise.reject(new Error("503")));
    expect(() => persistWeekplan(week(), "FTP", [], TODAY)).not.toThrow();
  });
});

describe("persistWeekplan MET reconWeek (aanpak A — plan-van-record-gat)", () => {
  const MONDAY = "2026-03-09";
  // Een verstreken trainingsdag (03-10, di) + vandaag/toekomst. De datums staan expliciet in
  // elke buildWeekProposal-aanroep (todayISO), dus de entry-aanwezigheid is klok-onafhankelijk.
  const GAP_WEEK: PlannerDay[] = [
    {
      datum: "2026-03-10",
      train: true,
      dag: "di",
      minuten: 80,
      dagtype: "vrij",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-03-11",
      train: true,
      dag: "wo",
      minuten: 60,
      dagtype: "vrij",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-03-14",
      train: true,
      dag: "za",
      minuten: 120,
      dagtype: "weekend",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
  ];
  const build = (todayISO: string) =>
    buildWeekProposal({
      settings: SETTINGS,
      plannerDays: GAP_WEEK,
      events: [],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO,
    });

  beforeEach(() => putWeekplan.mockClear());

  it("schrijft OOK als de vooruit-dagen ongewijzigd zijn, en de payload draagt de gereconstrueerde verstreken dag", () => {
    const normal = build(TODAY); // vandaag 03-11 → 03-10 heeft geen sessies → geen entry
    const recon = build(MONDAY); // vandaag = maandag → 03-10 ligt vooruit → krijgt sessies
    // Vooruit-dagen identiek opgeslagen: zonder recon zou dedup de PUT overslaan.
    const stored = buildWeekplanEntries(normal, "FTP");

    expect(persistWeekplan(normal, "FTP", stored, TODAY, recon)).toBe(true);
    expect(putWeekplan).toHaveBeenCalledTimes(1);
    const [, entries] = putWeekplan.mock.calls[0] as unknown as [
      string,
      { datum: string }[],
      string,
    ];
    // De verstreken 03-10 zit alleen in de recon-payload — bewijs dat het gat gevuld wordt.
    expect(entries.map((e) => e.datum)).toContain("2026-03-10");
  });

  it("zonder reconWeek blijft de dedup werken (ongewijzigd → geen PUT)", () => {
    const normal = build(TODAY);
    const stored = buildWeekplanEntries(normal, "FTP");
    expect(persistWeekplan(normal, "FTP", stored, TODAY)).toBe(false);
    expect(putWeekplan).not.toHaveBeenCalled();
  });
});

// ROADMAP punt 26 — DE KETEN OVER TWEE OPEENVOLGENDE RENDERS.
//
// De eerste render schrijft de blob; de tweede leest die blob terug en schrijft opnieuw. Zonder
// term B verdwijnt de entry van een VANDAAG gereden dag bij die tweede schrijfbeurt: de dag heeft
// geen sessies meer, dus `buildWeekplanEntries` levert er geen entry voor, en de worker-freeze
// dekt alleen `d < todayISO`. Deze test valt zonder term B om.
describe("persistWeekplan — punt 26, twee renders op dezelfde dag", () => {
  const DAG = "2026-03-11";
  const actRow = (dt: Date, min: number, tss: number): unknown[] => {
    const r: unknown[] = new Array(17).fill("");
    r[0] = dt;
    r[1] = "Ride";
    r[3] = min;
    r[7] = 0.72;
    r[8] = tss;
    return r;
  };
  const RIT = [actRow(new Date(2026, 2, 11, 9, 30, 0), 55, 48)];

  const bouw = (weekplans: unknown[], activities: unknown[]) =>
    buildWeekProposal({
      settings: SETTINGS,
      plannerDays: WEEK,
      events: [],
      activities,
      weekplans,
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    } as never);

  beforeEach(() => putWeekplan.mockClear());

  it("de entry van de vandaag-gereden dag OVERLEEFT de tweede render", () => {
    // Render 1: nog geen rit geregistreerd → de dag heeft sessies en levert een entry.
    const w1 = bouw([], []);
    expect(persistWeekplan(w1, "FTP", [], TODAY)).toBe(true);
    const [, entries1] = putWeekplan.mock.calls[0] as unknown as [
      string,
      { datum: string }[],
      string,
    ];
    expect(entries1.map((e) => e.datum)).toContain(DAG);

    // Render 2: de rit is binnen. De dag verliest zijn sessies.
    putWeekplan.mockClear();
    const w2 = bouw(entries1 as unknown[], RIT);
    const dag2 = (
      w2 as never as { days: { datum: string; sessions: unknown[] }[] }
    ).days.find((d) => d.datum === DAG);
    expect(dag2?.sessions.length).toBe(0);

    persistWeekplan(w2, "FTP", entries1 as unknown[], TODAY);

    // DE EIS IS DE UITKOMST, niet of er geschreven wordt. Met term B ziet de dedup geen
    // wijziging en blijft de opslag staan; zonder term B mist de payload de dag en schrijft de
    // PUT hem weg. Toets dus de blob die ER NA AFLOOP STAAT.
    const naAfloop =
      putWeekplan.mock.calls.length > 0
        ? ((
            putWeekplan.mock.calls[0] as unknown as [
              string,
              { datum: string }[],
              string,
            ]
          )[1] as { datum: string }[])
        : (entries1 as { datum: string }[]);
    expect(naAfloop.map((e) => e.datum)).toContain(DAG);
  });
});
