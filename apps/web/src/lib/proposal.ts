import type { IntentByDate, ZoneBuckets } from "@cadans/engine";
import {
  actualZoneMinutes_,
  assignWorkouts,
  buildOverrideWorkout_,
  buildWorkout,
  combineSignals_,
  computeMacroPhase,
  effectiveMacroFase_,
  eventFase_,
  formatDate,
  planModeLabel_,
  recentHardDate_,
  rollingZoneCoverage_,
  rpeSignal_,
  stripTime_,
  weekIndexFromStart_,
  weekStartDate,
  workoutZones,
  zoneActsByDateFromTab_,
  zoneDebt_,
} from "@cadans/engine";
import type {
  DayOverride,
  EventItem,
  OverrideEntry,
  PlannerDay,
  RpeEntry,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import type { ActValuesRow } from "./activities";
import { parseLocalDate } from "./dates";
import { deriveWellnessSignalResult } from "./readiness";

// ≥15 werkelijke minuten in een bucket (deze week, voltooide dag) = gedekt.
// Spiegelt Algorithm.gs DEKKING_MIN_MIN (de dekking-assembly :108-126).
const DEKKING_MIN_MIN = 15;

export interface ProposalWorkout {
  naam: string;
  zones: string[];
  totaalMin: number;
  tss: number;
  [k: string]: unknown;
}

export interface ProposalDay {
  datum: string; // yyyy-MM-dd
  dagIdx: number;
  voorgesteldType: string | null;
  reden: string | null;
  archetypeId: string | null;
  // Realisatie: rustdag → []; normale dag → 1 sessie; pendel-dag → pendelAantal
  // sessies (vroege = steady pendel_z2, laatste = de dag-intent). Dag-niveau
  // voorgesteldType/reden/archetypeId beschrijven de intent, sessions de realisatie.
  sessions: ProposalWorkout[];
  // De GEPLANDE workout voor een reeds-verstreken/voltooide trainingsdag (assignWorkouts
  // bouwt `sessions` ALLEEN voor tePlannen → done-dagen houden sessions=[]). Gereconstrueerd
  // uit voorgesteldType + planner-minuten zodat de VOLTOOID-kaart plan-vs-gedaan kan
  // vergelijken (2b-2). null = geen intent (bv. wedstrijd zonder voorstel) → reduced kaart.
  plannedForDone: ProposalWorkout | null;
}

export interface ProposalWeek {
  weekMonday: string;
  /** Week-niveau macro-fase (rauwe engine-waarde: Base/Build/Peak/Test/Recovery). */
  macroFase: string;
  /** Naam van het A/trip-hoofdevent, of null als er geen komend event is. */
  eventNaam: string | null;
  /** Weken tot het hoofdevent (afgerond), of null zonder event. */
  wekenTotEvent: number | null;
  /** Plan-modus voor de ModeChip ("Doel-gericht" bij een event; null anders). */
  planModus: string | null;
  /** Volume-profiel-key (settings.profielPreset) → §2 Volume-stat via de web-mapping
   * (presetHoursLabel). WEB-ONLY: de engine leest profielPreset niet. */
  profielPreset: string | null;
  /** Coach-naam (settings.coachNaam) → §6 coach-impact-box-kop. Presentatie-only; optioneel
   * zodat /preview- + test-fixtures ongemoeid blijven. */
  coachNaam?: string | null;
  /** Effectieve huidige fase incl. taper-overlay (engine `eventFase_` 'fase': Base/Build/Peak/Taper/
   * Recovery/Test). Voedt het ACTIEVE segment van de periodisering-balk (Taper licht hierop op);
   * `macroFase` blijft de onderliggende macro voor de kop/label. */
  fase: string;
  days: ProposalDay[];
}

export interface BuildProposalInput {
  settings: SettingsInput;
  plannerDays: PlannerDay[];
  events: EventItem[];
  activities: ActValuesRow[];
  weekplans: unknown[];
  wellness: WellnessInput[];
  rpe: RpeEntry[];
  /** Dag-overrides (D2): plannbare dagen worden via buildOverrideWorkout_ geswapt.
   * Optioneel + default [] → bestaande fixtures/callers ongewijzigd. */
  overrides?: OverrideEntry[];
  todayISO?: string;
}

// Intern mutabel dag-element — de vorm die assignWorkouts leest (d.type = dagtype,
// d.datum = Date) én schrijft (voorgesteldType/reden/archetypeId).
interface GridDay {
  dagIdx: number;
  dag: string | null;
  datum: Date;
  train: boolean;
  gedaan: boolean;
  minuten: number | null;
  type: string | null;
  voorgesteldType: string | null;
  reden: string | null;
  archetypeId: string | null;
}

/** weekplans-blob (opaque unknown[]) → per-datum beoogde minuten (aggIntent). */
function intentByDateFrom(weekplans: unknown[]): IntentByDate {
  const out: IntentByDate = {};
  for (const raw of weekplans || []) {
    const e = raw as { datum?: unknown; intent?: unknown };
    if (typeof e?.datum !== "string") continue;
    const it = e.intent as Partial<ZoneBuckets> | undefined;
    if (!it) continue;
    out[e.datum] = {
      low: Number(it.low) || 0,
      high: Number(it.high) || 0,
      anaerobic: Number(it.anaerobic) || 0,
    };
  }
  return out;
}

/**
 * Plan-mode-pill-label — web-only glue over de engine-1:1-GAS-port `planModeLabel_` (phase.ts).
 * `eventFase_` emit géén `eventDriven`-veld → we synthetiseren die uit macro-truthiness (macro ===
 * null ⟺ geen komend event). De labels "Onderhoud"/"Doel-gericht"/"Opbouw" komen uit de engine-port
 * (single source, geen duplicatie). doel==="Onderhoud" wint; anders event→"Doel-gericht",
 * fase==="maintain"→"Onderhoud", else "Opbouw".
 */
export function planModusLabel(
  settings: SettingsInput,
  eventDriven: boolean,
): string {
  return planModeLabel_(settings, { eventDriven }) as string;
}

/**
 * buildWeekProposal — client-side weekgeneratie-orkestratie (getrouw aan de GAS
 * generateProposal, plan-gekoppeld). PUUR: rekent op reeds-gehaalde /api-data, doet
 * zelf GEEN fetch en persisteert NIETS. Ambient Amsterdam-TZ (browser) = correct.
 *
 * Bewuste vereenvoudigingen t.o.v. de GAS (gemeld): geen freeze, geen loadCarry, en eventCtx =
 * undefined (eventContextFrom_ niet geport → long_z2 zonder event-scaling). Day-overrides (D2, FASE B):
 * een override op een plannbare dag wordt via buildOverrideWorkout_ geswapt → telt mee in de week-load.
 * Pendel-multisession (5.3c-i.b) + RPE-combine (5.3d-iii) WEL ondersteund.
 */
export function buildWeekProposal(input: BuildProposalInput): ProposalWeek {
  const {
    settings,
    plannerDays,
    events,
    activities,
    weekplans,
    wellness,
    rpe,
  } = input;

  // D2: dag-override-lookup (plannbare dag → buildOverrideWorkout_ i.p.v. het coach-voorstel).
  const overridesByDate = new Map<string, DayOverride>();
  for (const o of input.overrides ?? [])
    overridesByDate.set(o.datum, o.override);

  // 1. Datums (lokale middernacht; nooit UTC).
  const today = stripTime_(
    input.todayISO ? parseLocalDate(input.todayISO) : new Date(),
  );
  const todayLocalISO = formatDate(today, "yyyy-MM-dd");
  const weekMondayDate = weekStartDate(today);
  const weekMonday = formatDate(weekMondayDate, "yyyy-MM-dd");

  // Settings met doelStart als Date (de engine verwacht een Date, niet de ISO-string).
  const settingsE = {
    ...settings,
    doelStart: settings.doelStart ? parseLocalDate(settings.doelStart) : null,
  };

  // 2. macro/taper/klim/trip uit events (datum → Date; ref = vandaag, huidige week).
  const eventsD = (events || []).map((e) => ({
    ...e,
    datum: parseLocalDate(e.datum),
  }));
  const macro = eventFase_(eventsD, today);
  // computeMacroPhase returnt een OBJECT { week, fase, isTestWeek }; we willen de
  // fase-STRING (net als macro?.macroFase). Rauw het object gebruiken bakte
  // "[object Object]" in de workout-naam + context-regel bij lege events.
  const macroFaseBase =
    macro?.macroFase ?? computeMacroPhase(settingsE.doelStart, today).fase;
  const macroFase = effectiveMacroFase_(macroFaseBase, settingsE);
  const klimType: string | null = macro?.hoofdEvent?.klimType ?? null;
  const isTripEvent = macro?.hoofdEvent?.type === "trip";
  const taperCtx = macro?.taperEvent
    ? {
        datum: macro.taperEvent.datum,
        venster: macro.taperVenster,
        isTrip: macro.taperEvent.type === "trip",
      }
    : null;
  // Periodisering-kaart-data (week-niveau) — puur uit `macro`, engine ongewijzigd.
  // Plan-modus: de VOLLE planModeLabel_-logica (Onderhoud/Doel-gericht/Opbouw) via de web-glue
  // planModusLabel; event-driven = macro-truthiness (macro===null ⟺ geen event). GAS toont de
  // pill altijd → geen null-tak meer. Volume-target zit NIET op `macro` → weggelaten.
  const eventNaam: string | null =
    (macro?.hoofdEvent?.naam as string | undefined) ?? null;
  const wekenTotEvent: number | null =
    typeof macro?.wekenTot === "number" ? macro.wekenTot : null;
  const planModus: string | null = planModusLabel(settings, macro != null);

  // 3. mesoWeek uit settings.doelStart (vaste keuze; geen DocProp).
  const mesoWeek = weekIndexFromStart_(settingsE);

  // 4. intentByDate uit de weekplans-blob (aggIntent-minuten per datum).
  const intentByDate = intentByDateFrom(weekplans);

  // Grid: mutabel dag-array (assignWorkouts leest d.type = dagtype + d.datum = Date).
  const grid: GridDay[] = (plannerDays || []).map((pd, i) => ({
    dagIdx: i,
    dag: pd.dag,
    datum: parseLocalDate(pd.datum),
    train: pd.train,
    gedaan: pd.gedaan,
    minuten: pd.minuten,
    type: pd.dagtype,
    voorgesteldType: pd.voorgesteldType,
    reden: null,
    archetypeId: null,
  }));

  // 5. dekking-BOOLEANS (composiet, Algorithm.gs :108-126): rolling-count>0, dán per
  //    voltooide deze-week-dag ≥DEKKING_MIN_MIN actual-minuten, anders workoutZones-
  //    intent-fallback.
  const rolling = rollingZoneCoverage_(
    activities,
    intentByDate,
    todayLocalISO,
    7,
  );
  const dekking = {
    low: rolling.low > 0,
    high: rolling.high > 0,
    anaerobic: rolling.anaerobic > 0,
  };
  const actsByDate = zoneActsByDateFromTab_(activities);
  for (const d of grid) {
    if (!d.train || !d.gedaan) continue;
    const key = formatDate(stripTime_(d.datum), "yyyy-MM-dd");
    const dayActs = actsByDate[key] || [];
    let actual: ZoneBuckets | null = null;
    for (const a of dayActs) {
      const az = actualZoneMinutes_(a, null);
      if (az) {
        if (!actual) actual = { low: 0, high: 0, anaerobic: 0 };
        actual.low += az.low;
        actual.high += az.high;
        actual.anaerobic += az.anaerobic;
      }
    }
    if (actual) {
      if (actual.low >= DEKKING_MIN_MIN) dekking.low = true;
      if (actual.high >= DEKKING_MIN_MIN) dekking.high = true;
      if (actual.anaerobic >= DEKKING_MIN_MIN) dekking.anaerobic = true;
    } else if (d.voorgesteldType) {
      for (const z of workoutZones(d.voorgesteldType, settings.doel ?? "")) {
        if (z === "low" || z === "high" || z === "anaerobic") {
          dekking[z] = true;
        }
      }
    }
  }

  // debt + recentHard uit de 5.3a-fns.
  const debt = zoneDebt_(
    intentByDate,
    (plannerDays || []).map((pd) => ({
      datum: pd.datum,
      train: pd.train,
      gedaan: pd.gedaan,
    })),
    activities,
    weekMonday,
  );
  const recentHard = recentHardDate_(activities, intentByDate);

  // 6. signaal = wellness-signaal (oudste-eerst) GECOMBINEERD met het RPE-signaal van
  //    de voltooide deze-week-dagen (combineSignals_ neemt de zwaarste). plannedTypeByDate
  //    uit PlannerDay.voorgesteldType (dag-mirror van de weekplan-workoutType); datums
  //    zonder type vallen weg (rpeSignal_ filtert ze via expectedRpe_ == null).
  const plannedTypeByDate: Record<string, string> = {};
  for (const pd of plannerDays || []) {
    if (pd.voorgesteldType) plannedTypeByDate[pd.datum] = pd.voorgesteldType;
  }
  const wSig = deriveWellnessSignalResult(wellness || []);
  const rSig = rpeSignal_(rpe || [], plannedTypeByDate, todayLocalISO);
  const signal = combineSignals_(wSig, rSig).signal;

  // 7. tePlannen = train, niet-gedaan, vandaag/toekomst → assignWorkouts muteert ze.
  const todayT = today.getTime();
  const tePlannen = grid.filter(
    (d) =>
      d.train &&
      !d.gedaan &&
      (!d.datum || stripTime_(d.datum).getTime() >= todayT),
  );
  assignWorkouts(
    tePlannen,
    settingsE,
    mesoWeek,
    macroFase,
    dekking,
    { signal },
    klimType,
    recentHard,
    debt,
    isTripEvent,
    taperCtx,
    grid,
  );
  const tePlannenSet = new Set(tePlannen.map((d) => d.dagIdx));

  // 8-9. per dag → sessions (getrouw aan de GAS-loop Algorithm.gs:189-204). Pendel-dag
  //   (d.type === 'pendel') = pendelAantal sessies van pendelDuurMin: de vroege sessie(s)
  //   geforceerd 'pendel_z2' (steady, geen archetype), de LAATSTE draagt de dag-intent
  //   (d.voorgesteldType + d.archetypeId). Niet-pendel = 1 sessie. voltooid/rust → [].
  const days: ProposalDay[] = grid.map((d) => {
    const sessions: ProposalWorkout[] = [];
    // D2: een override op een plannbare dag (niet-gedaan, ≥ vandaag; GEEN d.train-eis — een override
    // mag een rustdag activeren) heeft VOORRANG op het coach-voorstel → precies één sessie.
    const ovDISO = formatDate(stripTime_(d.datum), "yyyy-MM-dd");
    const ov = overridesByDate.get(ovDISO);
    const dayPlannable = !d.gedaan && stripTime_(d.datum).getTime() >= todayT;
    if (ov && dayPlannable) {
      const woOv = buildOverrideWorkout_(
        ov,
        settingsE,
        mesoWeek,
        macroFase,
        undefined,
        d.dagIdx,
      ) as ProposalWorkout | null;
      if (woOv) sessions.push(woOv);
    } else if (tePlannenSet.has(d.dagIdx) && d.voorgesteldType) {
      const isPendel = d.type === "pendel";
      const sessieCount = isPendel
        ? Math.max(1, Math.round(settings.pendelAantal ?? 0) || 1)
        : 1;
      const sessieMin = isPendel
        ? settings.pendelDuurMin || d.minuten
        : d.minuten;
      for (let si = 0; si < sessieCount; si++) {
        const last = si === sessieCount - 1;
        const sessieType = isPendel && !last ? "pendel_z2" : d.voorgesteldType;
        const sessieArch = isPendel && !last ? null : d.archetypeId;
        const wo = buildWorkout(
          sessieType,
          sessieMin,
          settingsE,
          mesoWeek,
          macroFase,
          undefined,
          d.dagIdx,
          sessieArch,
        ) as ProposalWorkout | null;
        if (wo) sessions.push(wo);
      }
    }
    // Verstreken/voltooide trainingsdag (niet in tePlannen) met een intent → reconstrueer
    // de geplande workout (deterministisch uit voorgesteldType + planner-minuten). Voedt de
    // VOLTOOID-kaart-vergelijking; telt NIET mee in `sessions` (week-load blijft ongewijzigd).
    let plannedForDone: ProposalWorkout | null = null;
    if (
      !tePlannenSet.has(d.dagIdx) &&
      d.train &&
      d.voorgesteldType &&
      d.minuten
    ) {
      plannedForDone =
        (buildWorkout(
          d.voorgesteldType,
          d.minuten,
          settingsE,
          mesoWeek,
          macroFase,
          undefined,
          d.dagIdx,
          d.archetypeId,
        ) as ProposalWorkout | null) ?? null;
    }
    return {
      datum: formatDate(stripTime_(d.datum), "yyyy-MM-dd"),
      dagIdx: d.dagIdx,
      voorgesteldType: d.voorgesteldType,
      reden: d.reden,
      archetypeId: d.archetypeId,
      sessions,
      plannedForDone,
    };
  });

  return {
    weekMonday,
    macroFase,
    eventNaam,
    wekenTotEvent,
    planModus,
    // FASE 2 Brok 1: exact de engine-'fase' (overlay incl. "Taper"); geen event/macro → val terug op
    // de (effectieve) macroFase. Voedt de balk-actieve-fase; macroFase blijft voor kop/label.
    fase: (macro?.fase as string | undefined) ?? macroFase,
    profielPreset: settings.profielPreset ?? null,
    coachNaam: settings.coachNaam ?? null,
    days,
  };
}
