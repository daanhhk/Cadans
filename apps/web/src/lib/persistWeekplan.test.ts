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
