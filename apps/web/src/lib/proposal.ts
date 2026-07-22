import type { IntentByDate, ZoneBuckets } from "@cadans/engine";
import {
  actualZoneMinutes_,
  assignWorkouts,
  buildOverrideWorkout_,
  buildWorkout,
  computeMacroPhase,
  effectiveMacroFase_,
  eventFase_,
  formatDate,
  mesoCycleWeek_,
  planModeLabel_,
  recentHardDate_,
  rollingZoneCoverage_,
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
import { type ActValuesRow, derivePlannerGedaan } from "./activities";
import { parseLocalDate } from "./dates";
import { PLAN_ADAPTATION_ENABLED } from "./planFlags";
import type { ReadinessBand } from "./readiness";

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
  /** 3d stap 4 — client-side gespiegelde engine-conditie (planner.ts:510-523): een deload die
   * IN/vlak vóór de taper valt wordt onderdrukt. Voedt de fatigue-trigger (geen voorstel bij
   * nearTaper). Puur informatief; de engine berekent 'm zelf ongewijzigd. */
  nearTaper: boolean;
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
  /** LAAG 2: de readiness-band voedt het WEEK-signaal NIET meer (zie de toelichting bij
   * het week-signaal hieronder). Het veld blijft bestaan zodat callers/fixtures ongewijzigd
   * blijven compileren én zodat de tests kunnen vastleggen dat de band het vooruit-plan niet
   * meer verandert; `buildWeekProposal` LEEST 'm niet. De band stuurt nu het per-dag
   * verlicht-voorstel (schema.ts → buildVerlichtVoorstel). */
  readinessBand?: ReadinessBand | null;
  todayISO?: string;
  /** LAAG 1a-vlag-override (default = PLAN_ADAPTATION_ENABLED, zie planFlags.ts).
   * true → de blob-gevoede BESLISSER staat aan: `intentByDate` (dekking/zoneDebt_/
   * recentHardDate_/catchup_*). Sinds laag 2 is dat de ENIGE gegate decider — het
   * `rpeSignal_`-pad voedde uitsluitend de week-brede demote en is daarmee vervallen.
   * Bestaat zodat dat engine-pad testbaar blijft zolang de vlag uit staat. NIET vanuit
   * de app meegeven. */
  planAdaptation?: boolean;
  /** 3d stap 4 — OPTIONELE mesoWeek-substitutie (client-only, fatigue-aware). Vervangt de
   * kalender-mesoWeek zodat een wat-als-run een frisse deloadweek als normale week (→1) of een
   * opbouwweek als reduced-load-deload (→4) doorrekent. Weggelaten → de gewone kalender-mesoWeek.
   * De ENGINE blijft byte-identiek: hij leest de doorgegeven mesoWeek zonder wijziging. */
  mesoWeekOverride?: number;
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
  const { settings, plannerDays, events, activities, weekplans } = input;
  // `wellness` en `rpe` blijven op BuildProposalInput (callers/fixtures ongewijzigd), maar
  // worden sinds laag 2 niet meer door de weekgeneratie gelezen: ze voedden uitsluitend het
  // week-brede demote-signaal. De readiness-afleiding leeft in readiness.ts/schema.ts.

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

  // 3. mesoWeek uit settings.doelStart (vaste keuze; geen DocProp). weekIndexFromStart_
  // is 0-gebaseerd + monotoon; mesoCycleWeek_ mapt naar de cyclische 1..4-mesoweek die
  // MESO_MOD/isMesoRecovery verwachten (3d stap 1 — fixt off-by-one + nooit-meer-herstel).
  // 3d stap 4: een fatigue-wat-als mag de kalender-mesoWeek substitueren (client-only; de engine
  // krijgt de gesubstitueerde waarde ongewijzigd door → dosis mesoFactor + deload-flag isMesoRecovery).
  const mesoWeek =
    input.mesoWeekOverride != null
      ? input.mesoWeekOverride
      : mesoCycleWeek_(weekIndexFromStart_(settingsE));

  // 3d stap 4 — nearTaper client-side, EXACT de engine-logica (planner.ts:510-523): een deload
  // (isMesoRecovery = mesoWeek===4) die 0..7+venster dagen vóór de taper valt wordt onderdrukt.
  // Lokale datum-rekenkunde (parseLocalDate + stripTime_ = midnight-local, GEEN UTC-round-trip),
  // identiek aan de engine; voedt uitsluitend de fatigue-trigger.
  let nearTaper = false;
  if (taperCtx?.datum) {
    const daysToTaper = Math.floor(
      (stripTime_(parseLocalDate(taperCtx.datum)).getTime() -
        stripTime_(weekMondayDate).getTime()) /
        86400000,
    );
    nearTaper = daysToTaper >= 0 && daysToTaper <= 7 + (taperCtx.venster || 0);
  }

  // 4. intentByDate uit de weekplans-blob (aggIntent-minuten per datum).
  const planAdaptation = input.planAdaptation ?? PLAN_ADAPTATION_ENABLED;
  const intentByDate = intentByDateFrom(weekplans, planAdaptation);
  // V24-leesbaan: dezelfde blob, maar de HELE entry per datum — voor de bevroren
  // plannedForDone van voorbije dagen (zie de days-loop hieronder).
  const frozenByDate = frozenEntryByDate(weekplans);

  // FASE 1 — de GEDANE staat wordt AFGELEID uit de activities (GAS-match
  // `reconcilePlannerWithActivities`, Sync.gs:567-608), niet uit `pd.gedaan`: die kolom
  // wordt door de worker altijd als 0 weggeschreven (repo.ts) en is dus betekenisloos.
  // ÉÉN bron voor alle consumenten hieronder: grid, zoneDebt_, dekking-loop,
  // tePlannen-filter en dayPlannable. Zie docs/INHAAL-DEBT-RECON.md §2.
  const gedaanSet = derivePlannerGedaan(plannerDays || [], activities || []);
  // OR, geen vervanging: een expliciet gezette `pd.gedaan` blijft gelden. In productie is
  // die altijd false (de worker schrijft 0), dus daar telt uitsluitend de afleiding; maar zo
  // blijft de vlag betekenisvol als hij ooit wél gevuld wordt, en blijven fixtures die een
  // dag bewust op gedaan zetten hun betekenis houden.
  const isGedaan = (pd: { datum: string; gedaan?: boolean }): boolean =>
    pd.gedaan === true || gedaanSet.has(pd.datum);

  // Grid: mutabel dag-array (assignWorkouts leest d.type = dagtype + d.datum = Date).
  const grid: GridDay[] = (plannerDays || []).map((pd, i) => ({
    dagIdx: i,
    dag: pd.dag,
    datum: parseLocalDate(pd.datum),
    train: pd.train,
    gedaan: isGedaan(pd),
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
  // FASE 1-BORGING: deze dekking-VERFIJNING (per gedane dag de echte zone-minuten, of de
  // workoutZones-fallback) hangt aan `d.gedaan`. Zolang die altijd false was, draaide de lus
  // nooit; met de fase-1-afleiding zou hij WEL gaan draaien en de dekking-booleans
  // veranderen — GEMETEN: een gereden Z2+Z4-drempel zet `low` van false naar true, waar
  // `rollingZoneCoverage_` met de gate uit op de IF-fallback (één bucket) blijft.
  //
  // Die verfijning hoort bij de blob-gevoede deciders, niet bij fase 1: ze verandert het
  // vooruit-plan zonder dat er een voorstel aan te pas komt. Daarom achter DEZELFDE gate als
  // `intentByDate`. Met de gate uit is de dekking exact wat ze vóór fase 1 was (alleen
  // `rollingZoneCoverage_`) → het vooruit-plan blijft byte-identiek. Gaat de gate aan, dan
  // komen dekking-verfijning en debt-arm samen aan, zoals bedoeld.
  const actsByDate = zoneActsByDateFromTab_(activities);
  for (const d of planAdaptation ? grid : []) {
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
      gedaan: isGedaan(pd),
    })),
    activities,
    weekMonday,
    todayLocalISO,
  );
  const recentHard = recentHardDate_(activities, intentByDate);

  // 6. WEEK-SIGNAAL — LAAG 2: neutraal ('normal'). Er gaat GEEN week-breed demote/recovery
  //    meer naar `assignWorkouts`; het vooruit-plan is weer het onverzwakte beste plan.
  //
  //    Wat hier stond: de holistische readiness-band (ae00730) én de botte
  //    `wellnessSignal_`-vlag werden via `combineSignals_` tot één week-signaal gecombineerd
  //    en aan `assignWorkouts` gegeven. Die demote-pass loopt met `days.forEach` over ÁLLE
  //    te-plannen dagen (planner.ts:759-782) → één matige ochtend of één korte nacht
  //    verzachtte stil de hele rest van de week, zonder voorstel en zonder omkeerknop
  //    (R3-T22; schendt M10 "voorstellen, niet stil muteren" en M30).
  //
  //    De readiness stuurt nu uitsluitend het PER-DAG verlicht-VOORSTEL op vandaag
  //    (schema.ts → buildVerlichtVoorstel → VerlichtCard), dat de gebruiker aanvaardt of
  //    afwijst. De band-BEREKENING en de banner-weergave zijn ongemoeid.
  //
  //    RPE: het `rpeSignal_`-pad voedde ALLEEN deze week-pass en is daarmee vervallen. Een
  //    RPE-signaal hoort per M30/M15/M18 te INFORMEREN, niet stil te beslissen; komt het
  //    terug, dan via dezelfde voorstel-route. GEVOLG: `PLAN_ADAPTATION_ENABLED` gate't
  //    vanaf laag 2 nog uitsluitend `intentByDate` (de zone-dekking/debt-arm).
  //
  //    De ENGINE is niet aangeraakt: de demote-pass bestaat nog en blijft bereikbaar voor een
  //    caller die er wél een demote-signaal in stopt (o.a. de engine-selftest).
  const signal = "normal";

  // 6b. LAAG 1b — de cross-week recency-seed.
  //
  // ALLEEN de weken VÓÓR deze week. `recencyFromWeekplan_` neemt de LAATSTE kwaliteitsdag als
  // `lastIntent`; zonder deze filter zijn dat de entries die laag 1a zojuist voor DEZE week
  // heeft weggeschreven, en leest de seed dus zijn eigen output terug. Gemeten: met de huidige
  // week erin overschaduwt die de vorige volledig (plan identiek aan een lege blob) → de
  // cross-week-arm is dan dood, precies de arm die 1b moet toevoegen. Binnen de week roteert
  // de allocator al zelf (`rec.push`, planner.ts:420) — zie docs/RECENCY-1B-RECON.md §4.
  //
  // BEWUSTE GAS-DIVERGENTIE: GAS' `gatherWeekplanEntries_` (Algorithm.gs:971) loopt vanaf k=0 en
  // neemt de HUIDIGE week dus wél mee (refISO=null); wij filteren die er bewust uit, omdat Cadans
  // op ELKE render hergenereert én wegschrijft — anders dan GAS, waar generateProposal een
  // expliciete trigger is — zodat de seed ongefilterd zijn eigen zojuist-weggeschreven output
  // terugleest.
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
  // Anti-stapel: de allocator trekt gedane harde dagen van het kwaliteitsquotum af, maar leest
  // daarvoor d.voorgesteldType — op gedaan-dagen null (worker schrijft 'm leeg) → aftrek inert.
  // Leid de hardheid van een gedaan-dag af uit de WERKELIJK gereden zone-minuten en geef de
  // allocator een afgeleid hard type. weekDays wordt in de engine UITSLUITEND gelezen (doneHard +
  // weekvolume-som); het echte grid — en dus de UI/done-kaart — blijft ongemoeid. `minuten` blijft
  // behouden zodat de weekvolume-som identiek is.
  const weekDaysForAlloc = grid.map((d) => {
    if (!d.gedaan || !d.datum) return d;
    const k = formatDate(stripTime_(d.datum), "yyyy-MM-dd");
    let hi = 0;
    let ana = 0;
    for (const a of actsByDate[k] || []) {
      const az = actualZoneMinutes_(a, null);
      if (az) {
        hi += az.high;
        ana += az.anaerobic;
      }
    }
    if (hi < DEKKING_MIN_MIN && ana < DEKKING_MIN_MIN) return d;
    return { ...d, voorgesteldType: ana >= hi ? "vo2max" : "threshold" };
  });

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
    weekDaysForAlloc,
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
      } else if (ov.type === "rest") {
        // Bewuste rustdag: GEEN workout, maar de override telt wél als toegepast — anders
        // rendert de dag als een anonieme rustdag zonder pin en zonder "Terug naar voorstel".
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
        // T28 fase 3b-copy: op een pendeldag is de laatste rit de TERUGrit, de eerdere
        // ritten zijn heen. Zo krijgt een pendel_z2 de juiste richting-note; niet-pendel
        // valt op de default 'heen' (irrelevant, het is geen pendel-generic).
        const leg: "heen" | "terug" = isPendel && last ? "terug" : "heen";
        const wo = buildWorkout(
          sessieType,
          sessieMin,
          settingsE,
          mesoWeek,
          macroFase,
          undefined,
          d.dagIdx,
          sessieArch,
          leg,
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
          : appliedOverride.type === "rest"
            ? "rest"
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
    nearTaper,
    profielPreset: settings.profielPreset ?? null,
    coachNaam: settings.coachNaam ?? null,
    days,
  };
}
