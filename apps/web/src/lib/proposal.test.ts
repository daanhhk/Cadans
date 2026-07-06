import type {
  EventItem,
  PlannerDay,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { buildWeekProposal, type ProposalWeek } from "./proposal";

// TODAY vast (woensdag); week-maandag = 2026-03-09. NB: weekIndexFromStart_ +
// computeMacroPhase lezen ambient new Date() (engine, niet todayISO-geparametreerd),
// dus doelStart=null houdt mesoWeek in {-1,0} (nooit de recovery-week 4) en de
// macroFase wordt via events gedreven (deterministisch op TODAY).
const TODAY = "2026-03-11";

function settings(o: Partial<SettingsInput> = {}): SettingsInput {
  return {
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
    ...o,
  };
}

function pday(datum: string, o: Partial<PlannerDay>): PlannerDay {
  return {
    datum,
    train: true,
    dag: null,
    minuten: 60,
    dagtype: "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
    ...o,
  };
}

// 17-koloms actValues-rij (idx0 = Date, zoals parseActivityRows levert).
function act(datum: string, iff: number, zoneJson: string): ActValuesRow {
  const [y, m, d] = datum.split("-").map(Number);
  const r: ActValuesRow = new Array(17).fill("");
  r[0] = new Date(y, m - 1, d);
  r[1] = "Ride";
  r[7] = iff;
  r[15] = zoneJson;
  return r;
}

function wl(datum: string, hrv: number, slaapU: number): WellnessInput {
  return {
    datum,
    rhr: 48,
    hrv,
    slaapU,
    slaapScore: 80,
    readiness: 90,
    mood: "ok",
    weightKg: 75,
    ctl: 50,
    atl: 45,
    vorm: 5,
    ramp: 1.2,
  };
}

const WEEK: PlannerDay[] = [
  pday("2026-03-09", {
    dag: "ma",
    voorgesteldType: "sweet_spot",
    gedaan: true,
  }),
  pday("2026-03-10", {
    dag: "di",
    dagtype: "pendel",
    minuten: 80,
    voorgesteldType: "pendel_z2",
    gedaan: true,
  }),
  pday("2026-03-11", { dag: "wo" }),
  pday("2026-03-12", { dag: "do", minuten: 75 }),
  pday("2026-03-13", { dag: "vr" }),
  pday("2026-03-14", { dag: "za", dagtype: "weekend", minuten: 120 }),
  pday("2026-03-15", {
    dag: "zo",
    dagtype: "recovery",
    train: false,
    minuten: null,
  }),
];

const ACTS: ActValuesRow[] = [
  act("2026-03-09", 0.9, JSON.stringify([{ id: "Z3", secs: 1800 }])), // high 30m
  act("2026-03-10", 0.65, JSON.stringify([{ id: "Z1", secs: 3000 }])), // low 50m
];

const WEEKPLANS = [
  { datum: "2026-03-09", intent: { low: 40, high: 20, anaerobic: 0 } },
  { datum: "2026-03-10", intent: { low: 80, high: 0, anaerobic: 0 } },
];

const WELL_OK: WellnessInput[] = [
  wl("2026-03-07", 65, 7.5),
  wl("2026-03-08", 65, 7.5),
  wl("2026-03-09", 65, 7.5),
  wl("2026-03-10", 65, 7.5),
  wl("2026-03-11", 65, 7.5),
];
const WELL_RECOVERY: WellnessInput[] = [
  wl("2026-03-07", 65, 7.5),
  wl("2026-03-08", 65, 7),
  wl("2026-03-09", 40, 4.5),
  wl("2026-03-10", 40, 4.5),
  wl("2026-03-11", 40, 4.5),
];

// Ver A-race → macroFase Base, geen taper (deterministisch op TODAY).
const EV_FAR: EventItem[] = [
  {
    datum: "2026-06-01",
    naam: "Doelrace",
    type: "race",
    prioriteit: "A",
    afstandKm: 120,
    hoogtemeters: 2000,
    klimType: "lang",
    notitie: null,
  },
];
// Nabije A-race (3 d) → taper.
const EV_TAPER: EventItem[] = [
  {
    datum: "2026-03-14",
    naam: "Kriterium",
    type: "race",
    prioriteit: "A",
    afstandKm: 60,
    hoogtemeters: 200,
    klimType: "vlak",
    notitie: null,
  },
];

const base = {
  activities: ACTS,
  weekplans: WEEKPLANS,
  rpe: [],
  todayISO: TODAY,
};

describe("buildWeekProposal", () => {
  it("structuur: weekMonday, 7 dagen chronologisch, voltooid→null, tePlannen→workout", () => {
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    expect(r.weekMonday).toBe("2026-03-09");
    expect(r.days).toHaveLength(7);
    expect(r.days.map((d) => d.datum)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
    // Voltooide dagen (datum<today, gedaan): geen sessies + behouden type (signal normal).
    expect(r.days[0].sessions).toHaveLength(0);
    expect(r.days[0].voorgesteldType).toBe("sweet_spot");
    expect(r.days[1].sessions).toHaveLength(0);
    expect(r.days[1].voorgesteldType).toBe("pendel_z2");
    // tePlannen (03-11..03-14, niet-pendel): 1 sessie met de verwachte keys.
    for (const i of [2, 3, 4, 5]) {
      expect(r.days[i].voorgesteldType).toBeTruthy();
      expect(r.days[i].sessions).toHaveLength(1);
      const w = r.days[i].sessions[0];
      expect(typeof w?.naam).toBe("string");
      expect(Array.isArray(w?.zones)).toBe(true);
      expect(w?.totaalMin).toBeGreaterThan(0);
      expect(w?.tss).toBeGreaterThan(0);
    }
    // Rustdag (03-15, !train): geen sessies.
    expect(r.days[6].sessions).toHaveLength(0);
  });

  it("wellness recovery → tePlannen-dag gedemoot naar recovery", () => {
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_RECOVERY,
      ...base,
    });
    expect(r.days[3].voorgesteldType).toBe("recovery"); // 03-12
    expect(r.days[3].reden).toBe("Herstel — wellness laag");
  });

  it("taper: nabij A-event → lichtere sessies vs controle zonder nabij event", () => {
    const taper = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_TAPER,
      wellness: WELL_OK,
      ...base,
    });
    const control = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    // 03-11 = eerste taper-dag → openers; 03-13 → korte taper-Z2.
    expect(taper.days[2].voorgesteldType).toBe("taper_openers");
    expect(taper.days[4].voorgesteldType).toBe("taper_z2_kort");
    // Getaperd < controle op dezelfde vrijdag (03-13).
    const tapered = taper.days[4].sessions[0]?.tss ?? 0;
    const normal = control.days[4].sessions[0]?.tss ?? 0;
    expect(tapered).toBeLessThan(normal);
  });

  it("pendel-dag → pendelAantal sessies (steady pendel_z2 + intent-dragende laatste)", () => {
    // Rustdag vóór de pendel-dag (geen consecutive-hard-downgrade); geen activities
    // (recentHard null) → de pendel-dag houdt zijn intervals-intent.
    const pendelWeek: PlannerDay[] = [
      pday("2026-03-11", {
        dag: "wo",
        train: false,
        dagtype: "recovery",
        minuten: null,
      }),
      pday("2026-03-12", { dag: "do", dagtype: "pendel", minuten: 80 }),
      pday("2026-03-13", { dag: "vr", dagtype: "vrij" }),
    ];
    const r = buildWeekProposal({
      settings: settings({ pendelDuurMin: 45, pendelAantal: 2 }),
      plannerDays: pendelWeek,
      events: EV_FAR,
      activities: [],
      weekplans: [],
      rpe: [],
      wellness: WELL_OK,
      todayISO: TODAY,
    });
    // Pendel-dag (dagIdx 1) → 2 sessies (pendelAantal).
    const pendel = r.days[1];
    expect(pendel.sessions).toHaveLength(2);
    const heen = pendel.sessions[0];
    const terug = pendel.sessions[1];
    expect(heen?.totaalMin).toBeGreaterThan(0);
    expect(terug?.totaalMin).toBeGreaterThan(0);
    // Asymmetrie: vroege sessie = steady (geen high/anaerobic); laatste draagt de intent (FTP → high).
    expect(heen?.zones.includes("high")).toBe(false);
    expect(heen?.zones.includes("anaerobic")).toBe(false);
    expect(terug?.zones.includes("high")).toBe(true);
    // Normale dag → 1 sessie; rustdag → 0.
    expect(r.days[2].sessions).toHaveLength(1);
    expect(r.days[0].sessions).toHaveLength(0);
  });

  it("rpe-combine: zware RPE deze week → week gedemoot vs geen-rpe controle", () => {
    // Voltooide dagen 03-09 (sweet_spot exp 7) + 03-10 (pendel_z2 exp 3.5); RPE zwaarder
    // → mismatch avg ≥2 → rpeSignal_ demote. Wellness = normal → combine kiest demote.
    const withRpe = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: WEEKPLANS,
      rpe: [
        { datum: "2026-03-09", rpe: 9 },
        { datum: "2026-03-10", rpe: 6 },
      ],
      todayISO: TODAY,
    });
    const noRpe = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    const demoted = (r: ProposalWeek) =>
      r.days.some((d) => d.reden === "Lichter gehouden — wellness laag");
    expect(demoted(withRpe)).toBe(true);
    expect(demoted(noRpe)).toBe(false);
  });

  it("rpe null/onvoldoende → genegeerd, geen down-regulatie", () => {
    // 03-09 null overgeslagen → 1 gegradeerd → <2 → normal → geen demote, geen crash.
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: WEEKPLANS,
      rpe: [
        { datum: "2026-03-09", rpe: null },
        { datum: "2026-03-10", rpe: 9 },
      ],
      todayISO: TODAY,
    });
    expect(r.days).toHaveLength(7);
    expect(
      r.days.some((d) => d.reden === "Lichter gehouden — wellness laag"),
    ).toBe(false);
  });

  it("randen: lege plannerDays → geen dagen; geen events → geen crash", () => {
    const empty = buildWeekProposal({
      settings: settings(),
      plannerDays: [],
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    expect(empty.days).toHaveLength(0);
    expect(empty.weekMonday).toBe("2026-03-09");

    const noEvents = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: [],
      wellness: WELL_OK,
      ...base,
    });
    expect(noEvents.days).toHaveLength(7);
  });
});
