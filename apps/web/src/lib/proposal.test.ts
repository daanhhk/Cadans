import { demoteType_ } from "@cadans/engine";
import type {
  DayOverride,
  EventItem,
  PlannerDay,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  buildWeekProposal,
  type ProposalWeek,
  planModusLabel,
} from "./proposal";

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
// Single slechte nacht: laatste nacht 3u (<5 → wellnessSignal_ 'recovery' via de single-night-tak),
// maar sleepAvg3 = (8+8+3)/3 ≈ 6.3 (>=5) én HRV op baseline (deficit 0). Cadans downgrade't → 'demote'.
const WELL_SINGLE_NIGHT: WellnessInput[] = [
  wl("2026-03-07", 65, 7.5),
  wl("2026-03-08", 65, 7.5),
  wl("2026-03-09", 65, 8),
  wl("2026-03-10", 65, 8),
  wl("2026-03-11", 65, 3),
];
// Aanhoudend lage slaap: laatste 3 nachten 4u → sleepAvg3 = 4 (<5) → recovery BLIJFT (downgrade vuurt NIET).
const WELL_SUSTAINED_LOW: WellnessInput[] = [
  wl("2026-03-07", 65, 7.5),
  wl("2026-03-08", 65, 7.5),
  wl("2026-03-09", 65, 4),
  wl("2026-03-10", 65, 4),
  wl("2026-03-11", 65, 4),
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

  it("V24 — voorbije dag ZONDER bevroren entry: geen reconstructie meer → gereduceerde kaart", () => {
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base, // WEEKPLANS draagt alleen `intent`, geen workout-entry
    });
    // 03-09 is voorbij (TODAY = 03-11). Vóór laag 1a werd de geplande workout hier
    // HERBOUWD met de settings-van-NU (V24: FTP/mesoWeek/fase schuiven mee). Nu geldt:
    // geen bevroren entry → null → de VOLTOOID-kaart valt terug op de gereduceerde vorm.
    expect(r.days[0].sessions).toHaveLength(0);
    expect(r.days[0].plannedForDone).toBeNull();
    // tePlannen-dag (03-11) draagt zijn plan in `sessions` → geen plannedForDone.
    expect(r.days[2].plannedForDone).toBeNull();
    // Rustdag (03-15, !train) → geen plannedForDone.
    expect(r.days[6].plannedForDone).toBeNull();
  });

  it("V24 — voorbije dag MÉT bevroren entry: leest de entry, herberekent niet", () => {
    const frozen = {
      datum: "2026-03-09",
      workoutType: "sweet_spot",
      naam: "Sweet Spot 3×12",
      zones: ["low", "high"],
      intent: { low: 30, high: 36, anaerobic: 0 },
      blokken: [{ zone: "high", min: 36 }],
      structuur: [["Warmup", "15 min", "150-190W", "<150bpm"]],
      tss: 71,
      minuten: 66,
      totaalMin: 66,
      reden: "",
      sessies: [],
    };
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: [frozen],
      rpe: [],
      todayISO: TODAY,
    });
    const pfd = r.days[0].plannedForDone;
    expect(pfd).not.toBeNull();
    // Exact de OPGESLAGEN waarden — geen herberekening met de settings-van-nu.
    expect(pfd?.naam).toBe("Sweet Spot 3×12");
    expect(pfd?.totaalMin).toBe(66);
    expect(pfd?.tss).toBe(71);
    expect(pfd?.zones).toEqual(["low", "high"]);
    // Een andere FTP verandert de bevroren waarden NIET (dat was precies V24).
    const rHiFtp = buildWeekProposal({
      settings: settings({ ftp: 400 }),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: [frozen],
      rpe: [],
      todayISO: TODAY,
    });
    expect(rHiFtp.days[0].plannedForDone).toEqual(pfd);

    // De bevroren entry levert ook het plan-TYPE als de dag-spiegel leeg is
    // (planner_days.voorgesteld_type is null tot laag 2) → de VOLTOOID-vergelijking
    // heeft dan alsnog een plan-type om mee te vergelijken.
    const weekZonderSpiegel = WEEK.map((d, i) =>
      i === 0 ? { ...d, voorgesteldType: null } : d,
    );
    const rGeenSpiegel = buildWeekProposal({
      settings: settings(),
      plannerDays: weekZonderSpiegel,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: [frozen],
      rpe: [],
      todayISO: TODAY,
    });
    expect(rGeenSpiegel.days[0].voorgesteldType).toBe("sweet_spot");
    expect(rGeenSpiegel.days[0].plannedForDone?.naam).toBe("Sweet Spot 3×12");
  });

  it("LAAG 1a byte-identiek: een GESCHREVEN blob verandert het vooruit-plan NIET (vlag uit)", () => {
    // De kern-invariant van laag 1a. Een volledig gevulde weekplan-blob (intent + types,
    // precies wat de nieuwe schrijver wegschrijft) mag met PLAN_ADAPTATION_ENABLED=false
    // NIETS aan het vooruit-plannen veranderen t.o.v. een lege blob. Zonder de vlag zouden
    // intentByDate (dekking/zoneDebt_/recentHardDate_/catchup_*) en plannedTypeByDate
    // (rpeSignal_ → demote) hier wél gaan sturen.
    const gevuldeBlob = [
      {
        datum: "2026-03-09",
        workoutType: "sweet_spot",
        naam: "Sweet Spot 3×12",
        zones: ["low", "high"],
        intent: { low: 30, high: 36, anaerobic: 0 },
        tss: 71,
        minuten: 66,
        sessies: [],
      },
      {
        datum: "2026-03-10",
        workoutType: "pendel_z2",
        naam: "Pendel 2× 80m",
        zones: ["low"],
        intent: { low: 160, high: 0, anaerobic: 0 },
        tss: 90,
        minuten: 160,
        sessies: [],
      },
    ];
    // Een planner-week MÉT dag-spiegel (laag 2 vult die) — voedt plannedTypeByDate.
    const weekMetSpiegel = WEEK.map((d) =>
      d.gedaan ? d : { ...d, voorgesteldType: "threshold" },
    );
    const zwareRpe = [
      { datum: "2026-03-09", rpe: 9 },
      { datum: "2026-03-10", rpe: 6 },
    ];
    const metBlob = buildWeekProposal({
      settings: settings(),
      plannerDays: weekMetSpiegel,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: gevuldeBlob,
      rpe: zwareRpe,
      todayISO: TODAY,
    });
    const zonderBlob = buildWeekProposal({
      settings: settings(),
      plannerDays: weekMetSpiegel,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: [],
      rpe: zwareRpe,
      todayISO: TODAY,
    });
    // Het VOORUIT-plan (vandaag/toekomst): type, reden, redenCode, archetype en de
    // volledige sessies — byte-identiek.
    const vooruit = (r: ProposalWeek) =>
      r.days
        .filter((d) => d.datum >= TODAY)
        .map((d) => ({
          datum: d.datum,
          voorgesteldType: d.voorgesteldType,
          reden: d.reden,
          redenCode: d.redenCode,
          archetypeId: d.archetypeId,
          sessions: d.sessions,
        }));
    expect(JSON.stringify(vooruit(metBlob))).toBe(
      JSON.stringify(vooruit(zonderBlob)),
    );
    // Week-niveau eveneens ongewijzigd.
    expect(metBlob.macroFase).toBe(zonderBlob.macroFase);
    expect(metBlob.fase).toBe(zonderBlob.fase);
    expect(metBlob.mesoWeek).toBe(zonderBlob.mesoWeek);

    // Controle dat de test niet vacuüm is: mét de vlag AAN stuurt dezelfde blob wél
    // (rpeSignal_ vuurt op de gevulde plannedTypeByDate → demote-reden verschijnt).
    const metVlag = buildWeekProposal({
      settings: settings(),
      plannerDays: weekMetSpiegel,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: ACTS,
      weekplans: gevuldeBlob,
      rpe: zwareRpe,
      todayISO: TODAY,
      planAdaptation: true,
    });
    expect(JSON.stringify(vooruit(metVlag))).not.toBe(
      JSON.stringify(vooruit(zonderBlob)),
    );
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

  it("band 'ready' ondanks een slechte nacht → GEEN demote (normaal plan)", () => {
    // WELL_SINGLE_NIGHT geeft onder de botte vlag 'recovery' (slaap 3u); de holistische band 'ready'
    // overschrijft → normal → geen down-regulatie. De echte case: fris ondanks één slechte nacht.
    const control = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      readinessBand: "ready",
      ...base,
    });
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_SINGLE_NIGHT,
      readinessBand: "ready",
      ...base,
    });
    expect(r.days.some((d) => (d.reden ?? "").includes("wellness laag"))).toBe(
      false,
    );
    // Harde dagen houden hun oorspronkelijke type (identiek aan de neutrale control).
    expect(r.days.map((d) => d.voorgesteldType)).toEqual(
      control.days.map((d) => d.voorgesteldType),
    );
  });

  it("band 'caution' → demote (één stap lichter)", () => {
    const control = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      readinessBand: "ready",
      ...base,
    });
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      readinessBand: "caution",
      ...base,
    });
    expect(
      r.days.some((d) => d.reden === "Lichter gehouden — wellness laag"),
    ).toBe(true);
    expect(r.days.some((d) => d.reden === "Herstel — wellness laag")).toBe(
      false,
    );
    // Elke gedemote dag = exact één stap lichter: demoteType_ van zijn controle-origineel.
    for (let i = 0; i < r.days.length; i++) {
      if (r.days[i].reden === "Lichter gehouden — wellness laag") {
        expect(r.days[i].voorgesteldType).toBe(
          demoteType_(control.days[i].voorgesteldType),
        );
      }
    }
  });

  it("band 'rest' → recovery", () => {
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      readinessBand: "rest",
      ...base,
    });
    expect(r.days.some((d) => d.reden === "Herstel — wellness laag")).toBe(
      true,
    );
    expect(r.days[3].voorgesteldType).toBe("recovery"); // 03-12
  });

  it("band weggelaten (null) → val terug op de botte wSig-vlag", () => {
    // Aanhoudend lage slaap (sleepAvg3<5) zónder band → de wSig-vlag 'recovery' blijft leidend.
    const rest = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_SUSTAINED_LOW,
      ...base,
    });
    expect(rest.days[3].voorgesteldType).toBe("recovery"); // 03-12
    expect(rest.days[3].reden).toBe("Herstel — wellness laag");
    // Normale wellness zónder band → geen demote.
    const ok = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    expect(ok.days.some((d) => (d.reden ?? "").includes("wellness laag"))).toBe(
      false,
    );
  });

  it("band 'ready' + zware RPE → toch demote (RPE telt mee via combineSignals_)", () => {
    // bandSignal 'normal' + rSig 'demote' (zware RPE) → combineSignals_ neemt de zwaarste = demote.
    // planAdaptation: true — het RPE-pad hangt aan plannedTypeByDate, dat in laag 1a gegate is
    // (PLAN_ADAPTATION_ENABLED=false). Deze test dekt het engine-gedrag dat laag 2 aanzet.
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      readinessBand: "ready",
      activities: ACTS,
      weekplans: WEEKPLANS,
      rpe: [
        { datum: "2026-03-09", rpe: 9 },
        { datum: "2026-03-10", rpe: 6 },
      ],
      todayISO: TODAY,
      planAdaptation: true,
    });
    expect(
      r.days.some((d) => d.reden === "Lichter gehouden — wellness laag"),
    ).toBe(true);
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
      // Zie hierboven: het RPE-pad is in laag 1a gegate; hier expliciet aan.
      planAdaptation: true,
    });
    const noRpe = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
      planAdaptation: true,
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

  it("lege events (object-fallback) → geen '[object Object]' in naam of reden", () => {
    // Regressie: computeMacroPhase returnt { week, fase, isTestWeek }; de fallback
    // moet .fase (STRING) pakken. Vóór de fix bakte het rauwe object "[object Object]"
    // in de workout-naam (planner.ts renderVariant_) + de context-regel (reden). De
    // andere tests gebruiken EV_FAR (events≠leeg → macroFase-string) en misten dit pad.
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: [],
      wellness: WELL_OK,
      ...base,
    });
    for (const d of r.days) {
      expect(d.reden ?? "").not.toContain("[object Object]");
      for (const s of d.sessions) {
        expect(s.naam).not.toContain("[object Object]");
      }
    }
  });

  it("periodisering-threading: eventNaam + wekenTot + plan-modus op de week", () => {
    const withEvent = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    expect(withEvent.eventNaam).toBe("Doelrace");
    expect(typeof withEvent.wekenTotEvent).toBe("number");
    expect(withEvent.planModus).toBe("Doel-gericht");

    const noEvent = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: [],
      wellness: WELL_OK,
      ...base,
    });
    expect(noEvent.eventNaam).toBeNull();
    expect(noEvent.wekenTotEvent).toBeNull();
    // Geen event + doel "FTP" + fase null → planModeLabel_-tak "Opbouw" (niet meer null:
    // GAS toont de pill altijd).
    expect(noEvent.planModus).toBe("Opbouw");
  });
});

describe("buildWeekProposal — dag-override (3b)", () => {
  // 03-11 (wo) = plannbare vrij-dag (≥ today, !gedaan); 03-09 (ma) = voltooide dag (gedaan).
  const run = (overrides: { datum: string; override: DayOverride }[]) =>
    buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
      overrides,
    });

  it("library-override op een plannbare dag → override gezet, dag-velden uit de override", () => {
    const r = run([
      {
        datum: "2026-03-11",
        override: { type: "library", workoutType: "threshold", durMin: 60 },
      },
    ]);
    const d = r.days[2];
    expect(d.override).toEqual({
      type: "library",
      workoutType: "threshold",
      durMin: 60,
    });
    expect(d.voorgesteldType).toBe("threshold");
    expect(d.reden).toBe("Handmatig gekozen");
    expect(d.redenCode).toBeNull();
    expect(d.archetypeId).toBeNull();
    expect(d.sessions).toHaveLength(1);
  });

  it("free-override op een plannbare dag → voorgesteldType 'free'", () => {
    const r = run([
      {
        datum: "2026-03-11",
        override: {
          type: "free",
          ritType: "vrij",
          intensiteit: "tempo",
          durMin: 90,
        },
      },
    ]);
    const d = r.days[2];
    expect(d.override?.type).toBe("free");
    expect(d.voorgesteldType).toBe("free");
    expect(d.reden).toBe("Handmatig gekozen");
    expect(d.sessions).toHaveLength(1);
  });

  it("override op een NIET-plannbare (voltooide) dag → GEEN swap; coach-velden lekken niet", () => {
    const baseline = buildWeekProposal({
      settings: settings(),
      plannerDays: WEEK,
      events: EV_FAR,
      wellness: WELL_OK,
      ...base,
    });
    const r = run([
      {
        datum: "2026-03-09",
        override: { type: "library", workoutType: "tempo", durMin: 60 },
      },
    ]);
    // 03-09 = gedaan → niet plannbaar → override niet toegepast.
    expect(r.days[0].override).toBeNull();
    expect(r.days[0].reden).not.toBe("Handmatig gekozen");
    // De plannbare dag zonder override houdt zijn coach-reden + redenCode (tak lekt niet).
    expect(r.days[2].override).toBeNull();
    expect(r.days[2].reden).toBe(baseline.days[2].reden);
    expect(r.days[2].redenCode).toBe(baseline.days[2].redenCode);
  });
});

describe("weekgen — actual-gedreven avoid-consecutive-hard + debt-exceptie", () => {
  // READ-ONLY VERIFICATIE (test-only): bewijst dat een GEREDEN afwijking (harde actual,
  // idx7-IF ≥ 0,85) via recentHardDate_ de eerstvolgende harde plandag verlaagt (A), en dat
  // debt-geforceerde compensatie (debtForced) daarvan is uitgezonderd (B). Beide end-to-end via
  // buildWeekProposal: dat roept recentHardDate_ + zoneDebt_ + assignWorkouts intern aan, dus de
  // hele actual→recentHardDate_→guard-keten wordt geoefend. Fixture-datums liggen in het verleden
  // (2026-03) → de ambient-gedateerde week-allocator (allocateQualityWeek_) is inert, zodat de
  // per-dag-takken deterministisch sturen (zelfde regime als de bestaande tests).

  // Gedeelde debt-bron: een voltooide in-week dag met groot high-INTENT en geen actual →
  // zoneDebt_ high ≈ 60 (> DEBT_FORCE_HIGH_MIN 30). Stuurt de vrij-dag naar sweet_spot (HARD, NIET
  // debtForced) én forceert op de weekend-dag combo_long_with_efforts (debtForced).
  const DEBT_PLANS = [
    { datum: "2026-03-09", intent: { low: 0, high: 60, anaerobic: 0 } },
  ];
  // Harde actual: IF 0,90 (≥ 0,85) met enkel low-zones (Z1) → telt als "hard" via idx7, zonder de
  // high-debt af te trekken.
  const hardZ1 = JSON.stringify([{ id: "Z1", secs: 3000 }]);

  it("A — harde ACTUAL de dag ervoor → eerstvolgende (anders harde) dag gedowngraded naar long_z2", () => {
    // ma 03-09 = debt-bron (gedaan). di 03-10 = harde ACTUAL. wo 03-11 = TODAY, vrij → zou via de
    // high-debt sweet_spot (HARD) krijgen, maar 03-10 was hard → downgrade naar long_z2.
    const week: PlannerDay[] = [
      pday("2026-03-09", { dag: "ma", gedaan: true }),
      pday("2026-03-10", { dag: "di", gedaan: true }),
      pday("2026-03-11", { dag: "wo", dagtype: "vrij" }),
      pday("2026-03-12", {
        dag: "do",
        train: false,
        dagtype: "recovery",
        minuten: null,
      }),
    ];

    // Controle: identieke week, maar de 03-10 actual is NIET hard (IF 0,60) → recentHardDate null →
    // geen downgrade → 03-11 blijft de harde debt-keuze sweet_spot. Bewijst dat de harde ACTUAL de
    // oorzaak van de downgrade is (niet een andere tak).
    const control = buildWeekProposal({
      settings: settings(),
      plannerDays: week,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: [act("2026-03-10", 0.6, hardZ1)],
      weekplans: DEBT_PLANS,
      rpe: [],
      // debt-pad: hangt aan intentByDate, in laag 1a gegate (planFlags.ts). Expliciet aan
      // zodat deze engine-paden gedekt blijven tot laag 2 de vlag omzet.
      planAdaptation: true,
      todayISO: "2026-03-11",
    });
    expect(control.days[2].datum).toBe("2026-03-11");
    expect(control.days[2].voorgesteldType).toBe("sweet_spot");
    expect(control.days[2].reden ?? "").not.toContain("dag na een zware dag");

    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: week,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: [act("2026-03-10", 0.9, hardZ1)],
      weekplans: DEBT_PLANS,
      rpe: [],
      // debt-pad: hangt aan intentByDate, in laag 1a gegate (planFlags.ts). Expliciet aan
      // zodat deze engine-paden gedekt blijven tot laag 2 de vlag omzet.
      planAdaptation: true,
      todayISO: "2026-03-11",
    });
    expect(r.days[2].datum).toBe("2026-03-11");
    expect(r.days[2].voorgesteldType).toBe("long_z2");
    expect(r.days[2].reden ?? "").toContain("dag na een zware dag");
  });

  it("B — debt-geforceerde compensatie mag TOCH hard blijven de dag na een harde dag (exceptie)", () => {
    // ma 03-09 = debt-bron (gedaan). vr 03-13 = harde ACTUAL. za 03-14 = TODAY, weekend → high-debt
    // > 30 forceert combo_long_with_efforts (debtForced) → guard OVERGESLAGEN ondanks 03-13 hard.
    const week: PlannerDay[] = [
      pday("2026-03-09", { dag: "ma", gedaan: true }),
      pday("2026-03-13", { dag: "vr", gedaan: true }),
      pday("2026-03-14", { dag: "za", dagtype: "weekend", minuten: 120 }),
      pday("2026-03-15", {
        dag: "zo",
        train: false,
        dagtype: "recovery",
        minuten: null,
      }),
    ];
    const r = buildWeekProposal({
      settings: settings(),
      plannerDays: week,
      events: EV_FAR,
      wellness: WELL_OK,
      activities: [act("2026-03-13", 0.9, hardZ1)],
      weekplans: DEBT_PLANS,
      rpe: [],
      // debt-pad: hangt aan intentByDate, in laag 1a gegate (planFlags.ts). Expliciet aan
      // zodat deze engine-paden gedekt blijven tot laag 2 de vlag omzet.
      planAdaptation: true,
      todayISO: "2026-03-14",
    });
    // za 03-14 = index 2. Zelfde prev-dag-hard-conditie als A (recentHardDate 03-13), maar:
    expect(r.days[2].datum).toBe("2026-03-14");
    // (1) tóch een HARDE type (combo_long_with_efforts, zones incl. high), NIET long_z2;
    expect(r.days[2].voorgesteldType).toBe("combo_long_with_efforts");
    expect(r.days[2].sessions[0]?.zones.includes("high")).toBe(true);
    // (2) reden = debt-inhaalsessie, NIET de downgrade-reden → 2 harde dagen op rij toegestaan.
    expect(r.days[2].reden ?? "").toContain("Inhaalsessie");
    expect(r.days[2].reden ?? "").not.toContain("dag na een zware dag");
  });
});

describe("planModusLabel (plan-mode-pill, planModeLabel_-mirror)", () => {
  it("doel 'Onderhoud' → 'Onderhoud' (wint, ook event-driven)", () => {
    expect(planModusLabel(settings({ doel: "Onderhoud" }), false)).toBe(
      "Onderhoud",
    );
    expect(planModusLabel(settings({ doel: "Onderhoud" }), true)).toBe(
      "Onderhoud",
    );
  });
  it("event-driven (doel ≠ Onderhoud) → 'Doel-gericht'", () => {
    expect(planModusLabel(settings({ doel: "FTP" }), true)).toBe(
      "Doel-gericht",
    );
  });
  it("fase 'maintain' (geen event) → 'Onderhoud'", () => {
    expect(
      planModusLabel(settings({ doel: "FTP", fase: "maintain" }), false),
    ).toBe("Onderhoud");
  });
  it("else (geen event, geen maintain) → 'Opbouw'", () => {
    expect(planModusLabel(settings({ doel: "FTP", fase: null }), false)).toBe(
      "Opbouw",
    );
  });
});
