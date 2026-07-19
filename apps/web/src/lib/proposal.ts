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
import { PLAN_ADAPTATION_ENABLED } from "./planFlags";
import { deriveWellnessSignalResult, type ReadinessBand } from "./readiness";

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
  /** Machineleesbare reden-code (2a, additief NAAST `reden`); null als geen toewijzing/mapping. */
  redenCode: string | null;
  archetypeId: string | null;
  /** Dag-override (3b) — gezet ALLEEN als de D2-swap daadwerkelijk plaatsvond (buildOverrideWorkout_
   * leverde een workout); spiegelt GAS `override: true` op de weekplan-entry (overrideWeekplanEntry_).
   * Bij een override zijn voorgesteldType/reden/redenCode/archetypeId van de override, niet de coach-tak. */
  override: DayOverride | null;
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
  /** Week-index uit settings.doelStart (weekIndexFromStart_). Voedt de override-preview (B3) zodat
   * die EXACT dezelfde week-context gebruikt als de D2-tak in buildWeekProposal → preview == dagkaart. */
  mesoWeek: number;
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
  /** Holistische readiness-band (getReadinessScore_-afgeleid) → stuurt het plan-signaal
   * (ready→normal · caution→demote · rest→recovery). null/undefined → val terug op de wSig-vlag. */
  readinessBand?: ReadinessBand | null;
  todayISO?: string;
  /** LAAG 1a-vlag-override (default = PLAN_ADAPTATION_ENABLED, zie planFlags.ts).
   * true → de blob-gevoede BESLISSERS staan aan: `intentByDate` (dekking/zoneDebt_/
   * recentHardDate_/catchup_*) én `plannedTypeByDate` (rpeSignal_ → demote).
   * Bestaat zodat die engine-paden testbaar blijven zolang de vlag uit staat; laag 2
   * zet de constante zelf om. NIET vanuit de app meegeven. */
  planAdaptation?: boolean;
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
  redenCode: string | null;
  archetypeId: string | null;
}

/** weekplans-blob (opaque unknown[]) → per-datum beoogde minuten (aggIntent).
 *
 * LAAG 1a: zolang PLAN_ADAPTATION_ENABLED false is levert dit een LEGE map, óók als de blob
 * gevuld is. Zo blijven `rollingZoneCoverage_`/`zoneDebt_`/`recentHardDate_` (en daarmee de
 * `catchup_*`-takken) leeg-gevoed en is het vooruit-plannen byte-identiek aan vóór 1a.
 * Laag 2 zet de vlag om — zie planFlags.ts. */
function intentByDateFrom(
  weekplans: unknown[],
  planAdaptation: boolean,
): IntentByDate {
  const out: IntentByDate = {};
  if (!planAdaptation) return out;
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

/** Eén weekplan-entry zoals de blob 'm draagt — structureel getypeerd zodat proposal.ts
 * niet van weekplanBlob.ts hoeft te importeren (die importeert andersom de Proposal-types). */
interface FrozenEntry {
  datum?: unknown;
  workoutType?: unknown;
  naam?: unknown;
  zones?: unknown;
  totaalMin?: unknown;
  minuten?: unknown;
  tss?: unknown;
  blokken?: unknown;
  structuur?: unknown;
  intent?: unknown;
}

/** weekplans-blob → per-datum de BEVROREN entry (V24-leesbaan; NIET gegate op
 * PLAN_ADAPTATION_ENABLED — dit is een weergave-pad over het verleden, geen beslisser
 * over het vooruit-plan). Latere entries voor dezelfde datum winnen (het recent-venster
 * levert de weken oplopend aan). */
function frozenEntryByDate(weekplans: unknown[]): Map<string, FrozenEntry> {
  const out = new Map<string, FrozenEntry>();
  for (const raw of weekplans || []) {
    const e = raw as FrozenEntry;
    if (typeof e?.datum !== "string") continue;
    out.set(e.datum, e);
  }
  return out;
}

/** Bevroren entry → de ProposalWorkout-vorm die de VOLTOOID-vergelijking leest
 * (buildDoneCompareFull → toSession/coachPlannedArg_). Geen herberekening: puur de
 * opgeslagen waarden. Zonder bruikbare entry → null (gereduceerde kaart). */
function workoutFromFrozenEntry(
  e: FrozenEntry | undefined,
): ProposalWorkout | null {
  if (!e) return null;
  const totaalMin = Number(e.totaalMin ?? e.minuten);
  const naam = typeof e.naam === "string" ? e.naam : "";
  if (!naam && !Number.isFinite(totaalMin)) return null;
  return {
    naam,
    zones: Array.isArray(e.zones) ? e.zones.map(String) : [],
    totaalMin: Number.isFinite(totaalMin) ? totaalMin : 0,
    tss: Number(e.tss) || 0,
    blokken: Array.isArray(e.blokken) ? e.blokken : null,
    structuur: Array.isArray(e.structuur) ? e.structuur : null,
    intent: e.intent ?? null,
  };
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
  const planAdaptation = input.planAdaptation ?? PLAN_ADAPTATION_ENABLED;
  const intentByDate = intentByDateFrom(weekplans, planAdaptation);
  // V24-leesbaan: dezelfde blob, maar de HELE entry per datum — voor de bevroren
  // plannedForDone van voorbije dagen (zie de days-loop hieronder).
  const frozenByDate = frozenEntryByDate(weekplans);

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
    redenCode: null,
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
  //    LAAG 1a: gegate op PLAN_ADAPTATION_ENABLED — leeg → rpeSignal_ filtert alles weg
  //    (expectedRpe_ == null) en levert 'normal'. Zo zet het vullen van het plan-van-record
  //    geen STILLE demote-beslisser aan (R3-T30/T22); laag 2 doet dat mét voorstel-en-bevestig.
  const plannedTypeByDate: Record<string, string> = {};
  if (planAdaptation) {
    for (const pd of plannerDays || []) {
      if (pd.voorgesteldType) plannedTypeByDate[pd.datum] = pd.voorgesteldType;
    }
  }
  const wSig = deriveWellnessSignalResult(wellness || []);
  const rSig = rpeSignal_(rpe || [], plannedTypeByDate, todayLocalISO);
  // Cadans-divergentie t.o.v. GAS (bewust, CLIENT-ONLY): het week-plan-signaal leunt op de
  // HOLISTISCHE readiness-band (getReadinessScore_ weegt vorm/HRV/slaap/check-in) i.p.v. de botte
  // wellnessSignal_-vlag. Zo stuurt dezelfde readiness die de banner toont ook het plan, en werkt
  // de ochtend-check-in als hendel. band ready→normal · caution→demote · rest→recovery. RPE blijft
  // meetellen (combineSignals_, zwaarste wint). band null (te weinig data) → val terug op de botte
  // wSig-vlag. VERVANGT de b8b7ef9 single-bad-night-patch (met de band overbodig).
  const bandSignal =
    input.readinessBand === "ready"
      ? "normal"
      : input.readinessBand === "caution"
        ? "demote"
        : input.readinessBand === "rest"
          ? "recovery"
          : null;
  // cast: bandSignal ("normal"|"demote"|"recovery") is een geldige subset van wSig.signal
  // (WellnessSignalState); de nested ternary widet naar string → expliciet terug-casten (type-only).
  const baseWSig =
    bandSignal != null
      ? { ...wSig, signal: bandSignal as typeof wSig.signal }
      : wSig;
  const signal = combineSignals_(baseWSig, rSig).signal;

  // 6b. LAAG 1b — de cross-week recency-seed.
  //
  // ALLEEN de weken VÓÓR deze week. `recencyFromWeekplan_` neemt de LAATSTE kwaliteitsdag als
  // `lastIntent`; zonder deze filter zijn dat de entries die laag 1a zojuist voor DEZE week
  // heeft weggeschreven, en leest de seed dus zijn eigen output terug. Gemeten: met de huidige
  // week erin overschaduwt die de vorige volledig (plan identiek aan een lege blob) → de
  // cross-week-arm is dan dood, precies de arm die 1b moet toevoegen. Binnen de week roteert
  // de allocator al zelf (`rec.push`, planner.ts:420) — zie docs/RECENCY-1B-RECON.md §4.
  const recencySeedEntries = (weekplans || []).filter((raw) => {
    const d = (raw as { datum?: unknown })?.datum;
    return typeof d === "string" && d < weekMonday;
  });

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
    // LAAG 1b — cross-week recency-seed. `weekplans` is de al-gegatherde flat entry-lijst
    // (readRecentWeekplans eindigt op gatherWeekplanEntries_; de route geeft 'm ongewrapt
    // door), dus we voeden 'm rechtstreeks — een reader zou alleen hergroeperen + opnieuw
    // gatheren. BEWUST NIET gegate op PLAN_ADAPTATION_ENABLED: recency is BENIGN. Hij kiest
    // tussen even geldige sleutelsessies (welk kwaliteits-intent/archetype vandaag aan de
    // beurt is) en verzwaart of verlicht het plan niet — hij is dus geen beslisser over
    // belasting, en valt buiten de reden waarom 1a de deciders uit zette (stille demote).
    recencySeedEntries,
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
    // 3b: gezet ALLEEN als de swap echt gebeurde (buildOverrideWorkout_ → workout); stuurt de
    // dag-velden hieronder (spiegelt overrideWeekplanEntry_).
    let appliedOverride: DayOverride | null = null;
    if (ov && dayPlannable) {
      const woOv = buildOverrideWorkout_(
        ov,
        settingsE,
        mesoWeek,
        macroFase,
        undefined,
        d.dagIdx,
      ) as ProposalWorkout | null;
      if (woOv) {
        sessions.push(woOv);
        appliedOverride = ov;
      }
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
    // Geplande workout voor een dag die NIET te plannen is. Voedt de VOLTOOID-kaart-
    // vergelijking; telt NIET mee in `sessions` (week-load blijft ongewijzigd).
    //
    // V24 (LAAG 1a): een VOORBIJE dag wordt NIET meer gereconstrueerd met de settings-van-NU
    // (FTP/mesoWeek/fase schoven mee → de watt-targets van een gereden rit veranderden met
    // terugwerkende kracht). In plaats daarvan leest hij zijn BEVROREN entry uit de blob
    // (de worker-freeze houdt die vast, snapshotDayAction_-semantiek, GAS Algorithm.gs:185).
    // Geen entry → null → gereduceerde kaart; expliciet GEEN reconstructie.
    // VANDAAG (en een niet-te-plannen toekomstige dag) houdt het bestaande gedrag.
    let plannedForDone: ProposalWorkout | null = null;
    let frozenType: string | null = null;
    const isPast = stripTime_(d.datum).getTime() < todayT;
    if (!tePlannenSet.has(d.dagIdx)) {
      if (isPast) {
        const fe = frozenByDate.get(ovDISO);
        plannedForDone = workoutFromFrozenEntry(fe);
        // De bevroren entry draagt ook het TYPE; de dag-spiegel planner_days.voorgesteld_type
        // is nog null (laag 2 vult 'm). Zonder type doet buildDoneCompareFull niets.
        if (plannedForDone && typeof fe?.workoutType === "string")
          frozenType = fe.workoutType;
      } else if (d.train && d.voorgesteldType && d.minuten) {
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
    }
    return {
      datum: formatDate(stripTime_(d.datum), "yyyy-MM-dd"),
      dagIdx: d.dagIdx,
      // 3b: bij een toegepaste override komen deze dag-velden van de override i.p.v. de VERWORPEN
      // coach-tak (byte-getrouw aan overrideWeekplanEntry_, Algorithm.gs:2427/2439).
      // V24: een voorbije dag zonder dag-spiegel valt terug op het type uit de BEVROREN
      // entry (frozenType), zodat de VOLTOOID-vergelijking een plan-type heeft.
      voorgesteldType: appliedOverride
        ? appliedOverride.type === "free"
          ? "free"
          : appliedOverride.workoutType
        : (d.voorgesteldType ?? frozenType),
      reden: appliedOverride ? "Handmatig gekozen" : d.reden,
      redenCode: appliedOverride ? null : d.redenCode,
      archetypeId: appliedOverride ? null : d.archetypeId,
      override: appliedOverride,
      sessions,
      plannedForDone,
    };
  });

  return {
    weekMonday,
    macroFase,
    mesoWeek,
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
