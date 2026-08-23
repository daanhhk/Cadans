import {
  actualZoneMinutes_,
  COACH_INTENT_LABEL_,
  coachFeedback_,
  computeMacroPhase,
  eventFase_,
  formatDate,
  intentFromType_,
  readinessAdjust_,
  readinessEaseNaam_,
  stripTime_,
  workoutZones,
  zoneTimesFromCell_,
} from "@cadans/engine";
import {
  type DayOverride,
  type DispositionReason,
  OVERRIDE_WORKOUT_TYPES,
  type OverrideWorkoutType,
  type SettingsInput,
} from "@cadans/shared";
import { type ActValuesRow, parseActivityRows } from "./activities";
import {
  getActivities,
  getCheckin,
  getDispositions,
  getDoelPassend,
  getDosisTrede,
  getEventOvername,
  getEvents,
  getFatigueShift,
  getIjking,
  getOverrides,
  getPlanner,
  getPowerZones,
  getRpe,
  getSettings,
  getWeekplans,
  getWellness,
  putWeekplan,
} from "./api";
import {
  type BlokReview,
  blokCheckEnabled,
  blokReviewVenster,
  dosisTredeVoorstel as bouwDosisTredeVoorstel,
  buildBlokReview,
  type DosisTredeVoorstel,
} from "./blok";
import {
  testBadgeLabel,
  testResultaatRegel,
  type VerlichtBand,
  verlengBadgeLabel,
  verlengResultaatRegel,
  verlichtAanbodRegel,
  verlichtActieLabel,
  verlichtBadgeLabel,
  verlichtResultaatRegel,
  verlichtRustActieLabel,
  verlichtRustBadgeLabel,
  verlichtRustResultaatRegel,
} from "./coachNarrative";
import { parseLocalDate, todayIso, weekMondayIso } from "./dates";
import {
  type DoelPassendVoorstel,
  doelPassendVoorstel,
  kaartPrecedentie,
} from "./doelpassend";
import {
  type EventOvernameVoorstel,
  eventOvernameVoorstel,
} from "./eventOvername";
import {
  computeBlockCtlDelta,
  computeTsbTrend,
  fatigueMinDataOk,
  fatigueTrigger,
  latestCtl,
  weekFatigueEnabled,
} from "./fatigue";
import {
  buildWeekProposal,
  type ProposalWeek,
  type ProposalWorkout,
} from "./proposal";
import { deriveReadiness, type ReadinessResult } from "./readiness";
import { laadGelabeld, retryLoad } from "./schemaLoad";
import { presetHoursLabel } from "./settings";
import {
  buildTestVoorstel,
  doelblokOpeningVoorWeek,
  type IjkStatus,
  ijkStatus,
  type TestVoorstel,
} from "./testvoorstel";
import {
  buildWeekplanEntries,
  hasUnrecordedPastTrainingDay,
  mergeReconEntries,
  sameForwardEntries,
  withDoneTodayEntries,
} from "./weekplanBlob";
// De 5-bucket-vouwing van de GEREDEN kant woont sinds fase 1a van de zone-munt in
// `zonemunt.ts` (docs/ZONE-MUNT-ONTWERP.md §2): één bron voor beide kanten van de munt.
// Hier alleen geïmporteerd en her-geëxporteerd, zodat bestaande aanroepers ongemoeid blijven.
import {
  actualZone5_,
  type Zone5,
  type Zone5Key,
  zone5Grenzen,
} from "./zonemunt";

export { actualZone5_, type Zone5, type Zone5Key };

// View-model voor de Schema-tab. ALLE derivatie hier (componenten = puur). De engine-
// ProposalWorkout is los `any`-getypeerd; we casten 'm hier 1-op-1 naar SchemaSession
// (keys uit de echte engine-emit: naam/focus/zones/totaalMin/structuur/tss/eindopmerking/
// variantId). Zone-model = de 3 engine-buckets (low/high/anaerobic), NIET de 7-zone-
// design-index — de engine emit `zones[]`-buckets, geen z:1-7 (zie rapport).

export type ZoneKey = "low" | "high" | "anaerobic";

/** bucket → representatieve zonekleur + NL-label (engine 3-bucket-model). */
export const ZONE_META: Record<ZoneKey, { label: string; color: string }> = {
  low: { label: "Duur", color: "var(--zone-2)" },
  high: { label: "Drempel", color: "var(--zone-4)" },
  anaerobic: { label: "VO2max", color: "var(--zone-5)" },
};

/**
 * Rauwe engine focus-bucket (low/high/anaerobic) → NL ZONE_META-label; elke andere
 * (proza-)focus, bv. "lactate clearance", gaat onveranderd terug.
 */
export function focusLabel(focus: string): string {
  return focus in ZONE_META ? ZONE_META[focus as ZoneKey].label : focus;
}

/**
 * Macro-fase (rauwe engine-waarde) → NL-label. ÉÉN bron: de keys zijn tevens de
 * fase-tokens die de engine in het workout-naam-suffix bakt (planner.ts renderVariant_),
 * hergebruikt door `stripFaseSuffix`. Onbekende waarden gaan onveranderd terug.
 */
export const MACRO_FASE_NL: Record<string, string> = {
  Base: "Basis",
  Recovery: "Herstel",
  Build: "Build",
  Peak: "Peak",
  Test: "Test",
};

export function macroFaseLabel(fase: string): string {
  return MACRO_FASE_NL[fase] ?? fase;
}

// Engine-naam-suffix (planner.ts renderVariant_): "<naam> (<Fase>[, ingekort])".
// Gerichte, end-anchored strip met ALLEEN bekende fase-tokens → het HELE door-de-engine
// toegevoegde trailing haakje verdwijnt, inclusief ", ingekort" (display-only; de engine-naam
// blijft ongewijzigd). Een haakje dat deel is van de basis-naam ("Pendel + Z2 (75 min)") blijft
// staan: "75 min" is geen fase-token, dus de regex raakt 'm niet. GEEN globale replace.
const FASE_SUFFIX_RE = new RegExp(
  `\\s*\\((?:${Object.keys(MACRO_FASE_NL).join("|")})(?:,\\s*ingekort)?\\)\\s*$`,
);
export function stripFaseSuffix(naam: string): string {
  return naam.replace(FASE_SUFFIX_RE, "");
}

const ZONE_ORDER: ZoneKey[] = ["low", "high", "anaerobic"];
const WEEKDAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];

/**
 * Blok-bucket (engine `pctZoneBucket_`: rust/z2/tempo/drempel/anaeroob) → staafhoogte
 * (0-100 intensiteit) + Cadans zone-kleur voor de proportionele workout-bar. De
 * hoogtePct-stappen zijn 1-op-1 geport uit de GAS-bron (WebApp.gs `DASH_BUCKET_STYLE_`:
 * 25/45/65/85/100); de kleuren gebruiken de bestaande --zone-*-tokens zodat de bar met de
 * legend-chips lijnt (z2→--zone-2, drempel→--zone-4, anaeroob→--zone-5 = exact de
 * ZONE_META-legendkleuren). Onbekende bucket → z2-default (zoals GAS).
 */
const BAR_BUCKET: Record<string, { hoogtePct: number; color: string }> = {
  rust: { hoogtePct: 25, color: "var(--zone-1)" },
  z2: { hoogtePct: 45, color: "var(--zone-2)" },
  tempo: { hoogtePct: 65, color: "var(--zone-3)" },
  drempel: { hoogtePct: 85, color: "var(--zone-4)" },
  anaeroob: { hoogtePct: 100, color: "var(--zone-5)" },
};
const BAR_FALLBACK = { hoogtePct: 45, color: "var(--zone-2)" }; // z2 (zoals GAS)

/** Eén workout-blok, klaar voor de proportionele bar: minuten + staafhoogte + kleur. */
export interface SessionBlok {
  minuten: number;
  hoogtePct: number;
  color: string;
}

/** Rauw engine-blok `{ minuten, zone, pctLo?, pctHi? }` → SessionBlok (of null als leeg). */
export function blokFromEngine(b: unknown): SessionBlok | null {
  if (!b || typeof b !== "object") return null;
  const o = b as { minuten?: unknown; zone?: unknown };
  const minuten = Number(o.minuten) || 0;
  if (minuten <= 0) return null;
  const meta = BAR_BUCKET[String(o.zone)] ?? BAR_FALLBACK;
  return { minuten, hoogtePct: meta.hoogtePct, color: meta.color };
}

/** Eén rect in het proportionele per-interval silhouet (viewBox 0 0 100 100). */
export interface SilhouetSeg {
  x: number; // linkerrand, cumulatief in ARRAY-volgorde
  bw: number; // breedte ∝ minuten (min. MINW, gerenormaliseerd naar 100)
  y: number; // bovenrand — bottom-aligned: 100 − hoogte
  h: number; // hoogte = hoogtePct
  color: string;
}
/**
 * Silhouet-geometrie voor de ZoneBar, geport uit de GAS `zoneBar` (Script.html): per blok
 * één rect in tijd-volgorde, breedte ∝ minuten/som-minuten (MINW-vloer zodat korte blokken
 * zichtbaar blijven, daarna gerenormaliseerd naar exact 100), hoogte = hoogtePct, staven
 * groeien van onderaf (y = 100 − hoogte). Pure geometrie → testbaar zonder DOM.
 */
export function silhouetSegments(blokken: SessionBlok[]): SilhouetSeg[] {
  if (blokken.length === 0) return [];
  const W = 100;
  const MINW = 1.4; // min. staafbreedte
  const GAP = 0.6; // smalle gap tussen staven
  const totMin = blokken.reduce((a, b) => a + b.minuten, 0) || 1;
  const weights = blokken.map((b) => Math.max(MINW, (b.minuten / totMin) * W));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let x = 0;
  return blokken.map((b, i) => {
    const w = ((weights[i] ?? 0) / sum) * W; // renormaliseer naar exact 100
    const seg: SilhouetSeg = {
      x,
      bw: Math.max(0.8, w - GAP),
      y: 100 - b.hoogtePct,
      h: b.hoogtePct,
      color: b.color,
    };
    x += w;
    return seg;
  });
}

export interface SchemaSession {
  naam: string;
  focus: string | null;
  zones: ZoneKey[];
  totaalMin: number;
  tss: number;
  /** 5-tuples [label, dur, watt-range, hr-range, note] uit de engine. */
  structuur: string[][];
  /** Per-interval blokken voor de proportionele workout-bar (afgeleid uit engine-blokken). */
  blokken: SessionBlok[];
  eindopmerking: string | null;
}

export type DayState = "today" | "done" | "planned" | "rest" | "gemist";

// Disposition-labels (byte-exact GAS DISP_LABEL, Script.html:447) — "waarom niet gedaan?".
export const DISPOSITION_LABELS: Record<DispositionReason, string> = {
  geen_tijd: "Geen tijd",
  bewust_gerust: "Bewust gerust",
  iets_anders: "Iets anders gedaan",
};

/** Rauwe per-dag coach-feedback (2a): de coachFeedback_-velden op dagniveau. `state` is de RAUWE
 * engine-state ('on-plan'|'deviated'|'different'|'missed'), NIET de AlignKind-mapping. `narrative` =
 * de coach-proza-string (done → DoneCompareCard-box, gemist → GemistCard).
 *
 * ROADMAP punt 5b — `adapt` is hier WEG. Dat veld droeg generieke copy over een ingekorte sessie
 * die het plan niet uitvoert, en het is geen sleutel-signaal: drie van de vijf takken die het
 * vullen horen bij een endurance-ruil (`docs/INHAAL-5B-RECON.md` §1). In plaats daarvan staan hier
 * `plannedIntent` en `doneIntent`: MACHINELEESBAAR, geen copy, en de enige twee termen die de
 * sleutel-vraag nodig heeft. De ENGINE blijft `adapt` gewoon leveren. */
export interface SchemaDayCoach {
  state: string;
  plannedIntent: string | null;
  doneIntent: string | null;
  planned: unknown;
  narrative: string | null;
}

/** `fb.planned` / `fb.done` zijn `any` (engine-shape); defensief één veld eruit lezen. */
function intentVan_(blok: unknown): string | null {
  const i = (blok as { intent?: unknown } | null | undefined)?.intent;
  return typeof i === "string" && i ? i : null;
}

export interface SchemaDay {
  datum: string;
  dagIdx: number;
  weekday: string;
  dayNum: number;
  state: DayState;
  /** Kalender-vandaag (los van `state`: een voltooide vandaag flipt naar state 'done',
   * maar houdt de vandaag-markering op de dag-strip — 2b-2 STAP 1). */
  isToday: boolean;
  voorgesteldType: string | null;
  reden: string | null;
  /** Machineleesbare reden-code (2a) → voedt de coach-narrative-laag; null = droge reden/geen. */
  redenCode: string | null;
  sessions: SchemaSession[];
  /** DE GEPLANDE SESSIES van deze dag, ongeacht of hij nog vooruit ligt. `sessions` is leeg zodra
   * een dag VERSTREKEN is — assignWorkouts bouwt hem alleen voor tePlannen (train && !gedaan &&
   * datum >= vandaag) — en daardoor toonde de dagkaart een gemiste sleutelsessie als rustdag.
   * Hier valt hij terug op de BEVROREN entry `plannedForDone`, met dezelfde nul-conditie die de
   * weekkaart al hanteert, zodat week en dag per constructie niet uiteen kunnen lopen. LEZEN, nooit
   * herberekenen: de bevroren entry draagt wat er destijds is gerenderd. */
  planSessions: SchemaSession[];
  /** PENDEL-fix (docs/PENDEL-RECON.md §5): de geplande sessies die nog GEEN rit tegenover zich
   * hebben, op VOLGORDE gekoppeld (heen vóór terug). Op een pendeldag met twee sessies en één
   * rit staat er dus nog één open. `state` verandert hier NIET van: er komt geen half-gedaan-
   * state bij, want meer dan één state kan die toestand dragen. */
  openSessions: SchemaSession[];
  doneTss: number;
  /** De gereden rit van die dag (of null) — voedt de VOLTOOID-kaart (fase 2a). */
  done: DoneEntry | null;
  /** Plan-vs-gedaan-vergelijking als er een geplande sessie was; null → gereduceerde kaart (2b-2). */
  doneCompare: DoneCompare | null;
  /** Dag-dispositie ("waarom niet gedaan?", A2) — voedt de gemist-state + GemistCard. */
  dispositie: DispositionReason | null;
  /** Rauwe per-dag coach-feedback (2a): done → coachFeedback_-fb (→ DoneCompareCard-box); gemist →
   * missed-fb (→ GemistCard); anders null. */
  coach: SchemaDayCoach | null;
  /** Dag-override (3b): 1-op-1 uit ProposalDay.override; niet-null → OverriddenDetail + "Terug naar
   * voorstel". GEEN eigen conditie (een herberekening zou de dayPlannable-render-bug dupliceren). */
  override: DayOverride | null;
}

export interface LoadStat {
  gepland: number;
  gedaan: number;
}

/**
 * Gedane belasting per datum (uit de activities). tss idx8 + duur idx3; type idx1 + naam idx2 +
 * reële zone-minuten (idx15 via `actualZoneMinutes_`) voeden de VOLTOOID-kaart (fase 2a).
 * ifReal (idx7, icu-schaal — coachFeedback_ normaliseert) voedt de plan-vs-gedaan-alignment (2b-2).
 */
export interface DoneEntry {
  tss: number;
  minuten: number;
  type: string;
  naam: string;
  /** 3-bucket (low/high/anaerobic) — behouden voor load/debt-adjacente afleidingen. */
  zoneMinutes: Record<ZoneKey, number> | null;
  /** 5-bucket reële zones (rust/z2/tempo/drempel/anaeroob) — voedt de done-zone-bars,
   * de gepland-vs-gedaan-vergelijking én de coachFeedback_-aanroep (GAS-parity). */
  zoneMin5: Zone5 | null;
  ifReal: number | null;
  /** intervals.icu activity-id (idx16 = activity_id_ext); leeg = pre-migratie rit → geen
   * ritdetail-affordance. Voedt de "Bekijk ritdetails"-knop → GET /api/ride/:idExt. */
  idExt: string;
  /** PENDEL-fix (docs/PENDEL-RECON.md §5): HOEVEEL ritten deze dag draagt. Eén per activiteit,
   * opgeteld door `mergeDone`. Voedt `openSessions`: op een pendeldag met twee geplande sessies
   * en één rit staat er nog één open. VERPLICHT en niet optioneel, zodat de compiler elke
   * constructie-plek aanwijst in plaats van er stil een 0 in te laten vallen. */
  ritten: number;
}

// ── Done-rit-afleidingen (fase 2a): PURE, getest ──────────────────────────
// De 5-bucket-typen, de ZT→zone-map en `actualZone5_` zijn VERHUISD naar `zonemunt.ts`
// (fase 1a van de zone-munt); hierboven geïmporteerd en her-geëxporteerd. Wat hieronder
// staat is presentatie — volgorde, kleur, label — en blijft van `schema.ts`.
const ZONE5_ORDER: Zone5Key[] = ["rust", "z2", "tempo", "drempel", "anaeroob"];
// Per bucket: zone-nummer + kleur + staafhoogte (parity met de plan-BAR_BUCKET) + NL-label.
const DONE5_META: Record<
  Zone5Key,
  { zone: number; color: string; hoogtePct: number; label: string }
> = {
  rust: { zone: 1, color: "var(--zone-1)", hoogtePct: 25, label: "Herstel" },
  z2: { zone: 2, color: "var(--zone-2)", hoogtePct: 45, label: "Duur" },
  tempo: { zone: 3, color: "var(--zone-3)", hoogtePct: 65, label: "Tempo" },
  drempel: { zone: 4, color: "var(--zone-4)", hoogtePct: 85, label: "Drempel" },
  anaeroob: {
    zone: 5,
    color: "var(--zone-5)",
    hoogtePct: 100,
    label: "VO2max",
  },
};

/** Eén activity-rij → done-object (type idx1, naam idx2, duur idx3, IF idx7, tss idx8, reële zones uit idx15). */
export function buildDoneEntry(row: ActValuesRow): DoneEntry {
  const iczt = zoneTimesFromCell_(row[15]);
  const zm = actualZoneMinutes_({ icu_zone_times: iczt }, null) as {
    low: number;
    high: number;
    anaerobic: number;
  } | null;
  const rawIf = Number(row[7]);
  return {
    tss: Number(row[8]) || 0,
    minuten: Number(row[3]) || 0,
    type: String(row[1] ?? ""),
    naam: String(row[2] ?? ""),
    zoneMinutes: zm
      ? { low: zm.low, high: zm.high, anaerobic: zm.anaerobic }
      : null,
    zoneMin5: actualZone5_(iczt),
    ifReal:
      row[7] !== "" && row[7] != null && Number.isFinite(rawIf) ? rawIf : null,
    idExt: String(row[16] ?? ""),
    ritten: 1,
  };
}

/** Aggregeer twee done-objecten van dezelfde dag: som tss/min/zones, houd naam/type/idExt van de langste. */
export function mergeDone(a: DoneEntry, b: DoneEntry): DoneEntry {
  const primary = b.minuten > a.minuten ? b : a;
  const zoneMinutes =
    a.zoneMinutes || b.zoneMinutes
      ? {
          low: (a.zoneMinutes?.low ?? 0) + (b.zoneMinutes?.low ?? 0),
          high: (a.zoneMinutes?.high ?? 0) + (b.zoneMinutes?.high ?? 0),
          anaerobic:
            (a.zoneMinutes?.anaerobic ?? 0) + (b.zoneMinutes?.anaerobic ?? 0),
        }
      : null;
  const zoneMin5 =
    a.zoneMin5 || b.zoneMin5
      ? {
          rust: (a.zoneMin5?.rust ?? 0) + (b.zoneMin5?.rust ?? 0),
          z2: (a.zoneMin5?.z2 ?? 0) + (b.zoneMin5?.z2 ?? 0),
          tempo: (a.zoneMin5?.tempo ?? 0) + (b.zoneMin5?.tempo ?? 0),
          drempel: (a.zoneMin5?.drempel ?? 0) + (b.zoneMin5?.drempel ?? 0),
          anaeroob: (a.zoneMin5?.anaeroob ?? 0) + (b.zoneMin5?.anaeroob ?? 0),
        }
      : null;
  return {
    tss: a.tss + b.tss,
    minuten: a.minuten + b.minuten,
    type: primary.type,
    naam: primary.naam,
    zoneMinutes,
    zoneMin5,
    ifReal: primary.ifReal,
    idExt: primary.idExt,
    ritten: a.ritten + b.ritten,
  };
}

/** De aanwezige reële 5-bucket-zones (rust→…→anaeroob). */
function doneZones5(zm: Zone5 | null): Zone5Key[] {
  if (!zm) return [];
  return ZONE5_ORDER.filter((z) => (zm[z] ?? 0) > 0);
}

/** 5-bucket reële zone-minuten → SessionBlok[] voor de done-ZoneBars (rust→…→anaeroob). */
export function doneZoneBlokken(zm: Zone5 | null): SessionBlok[] {
  if (!zm) return [];
  return doneZones5(zm).map((z) => ({
    minuten: zm[z],
    hoogtePct: DONE5_META[z].hoogtePct,
    color: DONE5_META[z].color,
  }));
}

/** NL-type-label van een gereden rit = de dominante reële zone (Herstel/Duur/Tempo/Drempel/
 * VO2max); zonder zones → rauwe type of "Rit". */
export function doneLabel(done: DoneEntry): string {
  const zm = done.zoneMin5;
  if (zm) {
    let best: Zone5Key | null = null;
    for (const z of ZONE5_ORDER) {
      if ((zm[z] ?? 0) > 0 && (best == null || zm[z] > zm[best])) best = z;
    }
    if (best) return DONE5_META[best].label;
  }
  return done.type || "Rit";
}

/** Duur "1u01"-stijl (GAS cfDur_) — spiegelt DoelProjectie.tsx:62. */
export function formatDuurU(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}u${String(m).padStart(2, "0")}` : `${h}u`;
}

// ── VOLTOOID plan-vs-gedaan (fase 2b-2): coachFeedback_-brug + compare-aggregatie ──
// Design-autoriteit: design/src/coach-feedback.jsx (DayHead/AlignChip/AlignBar/Reading/
// ZoneCompare). De engine (coach.ts) levert state/score/type-labels; hier alleen mappen.

/** Design AlignChip-kind. */
export type AlignKind = "op-plan" | "afgeweken" | "anders" | "gemist";

/** Eén metric-rij van de gepland|gedaan-tabel (Type/Duur/IF/TSS). */
export interface DoneCompareTableRow {
  k: string;
  p: string;
  d: string;
}

/** Eén zone-rij van de compare-bars (gepland vs gedaan, minuten). */
export interface DoneCompareZone {
  z: number;
  plan: number;
  done: number;
}

/** View-model voor de VOLLE VOLTOOID-kaart (geplande sessie bestaat → vergelijking). */
export interface DoneCompare {
  /** GAS-stijl "Drempel-rit · 1u01" (rit-type + duur). */
  titel: string;
  badgeZone: number;
  badgeName: string;
  chipKind: AlignKind;
  chipLabel: string;
  /** Uitvoering-volgt-plan-% (coach-score), of null. */
  scorePct: number | null;
  planType: string;
  doneType: string;
  deviate: boolean;
  rows: DoneCompareTableRow[];
  zones: DoneCompareZone[];
  /** Coach-impact-proza (coachFeedback_ narrative; §6/2c). null = geen tekst → box weglaten. */
  narrative: string | null;
}

/** IF-getal → NL "0,88" (2 decimalen, komma); null/NaN → "–". */
export function formatIf(ifv: number | null): string {
  return ifv == null || !Number.isFinite(ifv)
    ? "–"
    : ifv.toFixed(2).replace(".", ",");
}

/** "--zone-4" → 4; fallback 2 (duur/z2, de engine-default). */
export function zoneNumFromToken(token: string): number {
  const m = /--zone-(\d)/.exec(token);
  return m ? Number(m[1]) : 2;
}

const ALIGN_KIND: Record<string, AlignKind> = {
  "on-plan": "op-plan",
  deviated: "afgeweken",
  different: "anders",
  missed: "gemist",
};
/** Engine alignment-state → design AlignChip-kind. */
export function alignKindFromState(state: string): AlignKind {
  return ALIGN_KIND[state] ?? "anders";
}

// Geplande blok-kleur (--zone-N, BAR_BUCKET) → zone-nummer. De gedaan-kant is nu 5-bucket
// (Zone5) → elke bucket op zijn eigen zone (rust→Z1 … anaeroob→Z5 via DONE5_META).
const PLAN_COLOR_ZONE: Record<string, number> = {
  "var(--zone-1)": 1,
  "var(--zone-2)": 2,
  "var(--zone-3)": 3,
  "var(--zone-4)": 4,
  "var(--zone-5)": 5,
};

/**
 * Geplande blokken (SessionBlok[]) + reële done-zone-minuten (5-bucket) → per-zone
 * gepland-vs-gedaan (Z1..Z5) voor de compare-bars. Gepland aggregeert de blok-kleuren;
 * gedaan mapt elke 5-bucket op zijn eigen zone (rust→Z1 … anaeroob→Z5).
 */
export function zoneCompareRows(
  plannedBlokken: SessionBlok[],
  doneZm: Zone5 | null,
): DoneCompareZone[] {
  const plan = [0, 0, 0, 0, 0, 0];
  for (const b of plannedBlokken) {
    const z = PLAN_COLOR_ZONE[b.color];
    if (z) plan[z] += b.minuten;
  }
  const done = [0, 0, 0, 0, 0, 0];
  if (doneZm) {
    for (const k of ZONE5_ORDER) done[DONE5_META[k].zone] += doneZm[k] ?? 0;
  }
  return [1, 2, 3, 4, 5].map((z) => ({
    z,
    plan: Math.round(plan[z]),
    done: Math.round(done[z]),
  }));
}

/** Dominante reële zone → pill {zoneNum,label} (Herstel/Duur/Tempo/Drempel/VO2max) voor de
 * reduced kaart; geen zones → null. */
export function doneBadge(
  done: DoneEntry,
): { zoneNum: number; label: string } | null {
  const zm = done.zoneMin5;
  if (!zm) return null;
  let best: Zone5Key | null = null;
  for (const z of ZONE5_ORDER) {
    if ((zm[z] ?? 0) > 0 && (best == null || zm[z] > zm[best])) best = z;
  }
  return best
    ? { zoneNum: DONE5_META[best].zone, label: DONE5_META[best].label }
    : null;
}

/**
 * coachFeedback_ (engine, PUUR aangeroepen — niet gewijzigd) + de reële zones → het VOLLE
 * VOLTOOID-vergelijk-view-model. Geen geplande workout (bv. wedstrijd zonder voorstel) of
 * geen intent → null → de aanroeper valt terug op de gereduceerde kaart (2b-2 STAP 2).
 */
/** Coach-planned-arg — gedeeld door de done- + missed-fb (byte-getrouwe planned-constructie). */
function coachPlannedArg_(
  plannedWo: ProposalWorkout,
  voorgesteldType: string,
  plannedSession: SchemaSession,
) {
  return {
    type: voorgesteldType,
    titel: plannedWo.naam,
    duurMin: plannedSession.totaalMin,
    tss: plannedSession.tss,
    segmenten: null,
  };
}

/**
 * coachFeedback_ (engine, PUUR) → { compare, coach }: het VOLLE VOLTOOID-vergelijk-view-model
 * PLUS de rauwe coach-velden (2a). Eén coachFeedback_-aanroep. Geen geplande workout/intent → null.
 */
function buildDoneCompareFull(
  done: DoneEntry,
  plannedWo: ProposalWorkout | null,
  voorgesteldType: string | null,
  macroFase: string,
): { compare: DoneCompare; coach: SchemaDayCoach } | null {
  if (!plannedWo || !voorgesteldType) return null;
  const plannedSession = toSession(plannedWo);
  const fb = coachFeedback_(
    coachPlannedArg_(plannedWo, voorgesteldType, plannedSession),
    {
      naam: done.naam,
      duurMin: done.minuten,
      tss: done.tss,
      ifReal: done.ifReal,
      zoneMin: done.zoneMin5 ?? undefined,
    },
    { fase: macroFase },
    false,
  );
  if (!fb?.done) return null;
  const compare: DoneCompare = {
    // P2 (GAS coachTitle_, Script.html:581): `planned.naam` bij on-plan/afgeweken; alleen bij
    // 'different' de "<doneType>-rit · <duur>"-vorm.
    titel:
      fb.state === "different"
        ? `${fb.done.typeLabel}-rit · ${formatDuurU(done.minuten)}`
        : plannedSession.naam,
    badgeZone: zoneNumFromToken(fb.done.badgeZone),
    badgeName: fb.done.typeLabel,
    chipKind: alignKindFromState(fb.state),
    chipLabel: fb.chipLabel,
    scorePct: typeof fb.score === "number" ? fb.score : null,
    planType: fb.planned.typeLabel,
    doneType: fb.done.typeLabel,
    deviate: fb.state === "different",
    rows: [
      {
        k: "Duur",
        p: formatDuurU(fb.planned.duurMin),
        d: formatDuurU(done.minuten),
      },
      { k: "IF", p: formatIf(fb.planned.ifv), d: formatIf(fb.done.ifv) },
      { k: "TSS", p: String(fb.planned.tss), d: String(done.tss) },
    ],
    zones: zoneCompareRows(plannedSession.blokken, done.zoneMin5),
    // §6/2c: het coach-proza uit coachFeedback_ (niet meer weggegooid); leeg → box weglaten.
    narrative:
      typeof fb.narrative === "string" && fb.narrative.trim()
        ? fb.narrative
        : null,
  };
  const coach: SchemaDayCoach = {
    state: fb.state,
    plannedIntent: intentVan_(fb.planned),
    doneIntent: intentVan_(fb.done),
    planned: fb.planned,
    narrative:
      typeof fb.narrative === "string" && fb.narrative.trim()
        ? fb.narrative
        : null,
  };
  return { compare, coach };
}

/** VOLLE VOLTOOID-vergelijking (2b-2) — dunne wrapper (behoudt de publieke signatuur voor de tests). */
export function buildDoneCompare(
  done: DoneEntry,
  plannedWo: ProposalWorkout | null,
  voorgesteldType: string | null,
  macroFase: string,
): DoneCompare | null {
  return (
    buildDoneCompareFull(done, plannedWo, voorgesteldType, macroFase)
      ?.compare ?? null
  );
}

/** Gemist-dag coach-feedback (2a): coachFeedback_ met actual=null + isMissed=true → missed-fb.
 * Spiegelt exact de planned-constructie van buildDoneCompareFull. */
function missedCoach_(
  plannedWo: ProposalWorkout | null,
  voorgesteldType: string | null,
  macroFase: string,
): SchemaDayCoach | null {
  if (!plannedWo || !voorgesteldType) return null;
  const plannedSession = toSession(plannedWo);
  const fb = coachFeedback_(
    coachPlannedArg_(plannedWo, voorgesteldType, plannedSession),
    null,
    { fase: macroFase },
    true,
  );
  if (!fb) return null;
  return {
    state: fb.state,
    plannedIntent: intentVan_(fb.planned),
    doneIntent: intentVan_(fb.done),
    planned: fb.planned,
    narrative:
      typeof fb.narrative === "string" && fb.narrative.trim()
        ? fb.narrative
        : null,
  };
}

export interface SchemaView {
  weekMonday: string;
  /** NL-label van de EFFECTIEVE fase (incl. Taper-override) — voedt de kop-regel én de FASE-stat,
   * exact de fase die de sequentie-bar markeert (GAS-conform: kop/stat/bar delen één bron). */
  faseLabel: string;
  /** Rauwe onderliggende macro-fase (Base/Build/Peak/…) — NIET de kop (die = faseLabel). */
  macroFase: string;
  /** Effectieve fase incl. taper-overlay (Base/Build/Peak/Taper/Recovery/Test) — het actieve balk-segment. */
  fase: string;
  eventNaam: string | null;
  wekenTotEvent: number | null;
  planModus: string | null;
  /** §2 Volume-stat: uren-doel uit profielPreset (web-only mapping), of null → lege staat
   * (geen preset / onbekende key / custom-profiel zonder uren-bron). */
  volumeUren: string | null;
  /** Coach-naam (settings.coachNaam) → §6 coach-impact-box-kop; null → "Coach"-default. */
  coachNaam: string | null;
  todayISO: string;
  days: SchemaDay[];
  tss: LoadStat;
  minuten: LoadStat;
  dagen: LoadStat;
  /** LAAG 2 — het per-dag verlicht-VOORSTEL voor vandaag, of null. Muteert niets; de
   * dagkaart rendert 'm als aanbod met [Verlicht…] / [Hou origineel]. */
  verlicht: VerlichtVoorstel | null;
}

/**
 * "Niet gedaan?"-affordance (GAS canDispose_, Script.html:448). Leunt op `planSessions`, niet op
 * `sessions`: een VERSTREKEN dag heeft geen sessions meer, en juist daar moet de reden alsnog in
 * te vullen zijn. Verder ongewijzigd — niet voltooid, nog niet gedisponeerd, datum <= vandaag.
 */
export function canDisposeDay(
  day: {
    planSessions: SchemaSession[];
    done: DoneEntry | null;
    dispositie: DispositionReason | null;
    datum: string;
  } | null,
  todayISO: string,
): boolean {
  return (
    !!day &&
    day.planSessions.length > 0 &&
    !day.done &&
    !day.dispositie &&
    day.datum <= todayISO
  );
}

export function toSession(w: ProposalWorkout): SchemaSession {
  const zones = (Array.isArray(w.zones) ? w.zones : []).filter(
    (z): z is ZoneKey => z === "low" || z === "high" || z === "anaerobic",
  );
  const structuur = Array.isArray(w.structuur)
    ? (w.structuur as unknown[]).map((row) =>
        Array.isArray(row) ? row.map((c) => String(c ?? "")) : [String(row)],
      )
    : [];
  const blokken = Array.isArray(w.blokken)
    ? (w.blokken as unknown[])
        .map(blokFromEngine)
        .filter((b): b is SessionBlok => b !== null)
    : [];
  const orderedZones = ZONE_ORDER.filter((z) => zones.includes(z));
  // Chip-dedup: de zone-legend (ZoneLegend) is de canonieke plek voor het zone-woord.
  // Onderdruk de focus-subtitel als die (na NL-mapping) een woord toont dat een
  // legend-chip al toont; proza-focus (bv. "lactate clearance") blijft staan.
  const zoneLabels = new Set(orderedZones.map((z) => ZONE_META[z].label));
  const rawFocus = typeof w.focus === "string" ? w.focus : null;
  const focusDisplay = rawFocus ? focusLabel(rawFocus) : null;
  const focus =
    focusDisplay && !zoneLabels.has(focusDisplay) ? focusDisplay : null;
  return {
    naam: stripFaseSuffix(String(w.naam ?? "")),
    focus,
    zones: orderedZones,
    totaalMin: Number(w.totaalMin) || 0,
    tss: Number(w.tss) || 0,
    structuur,
    blokken,
    eindopmerking: typeof w.eindopmerking === "string" ? w.eindopmerking : null,
  };
}

/** ProposalWeek + gedane-belasting-per-datum → het Schema-view-model (puur). */
const EMPTY_SETTINGS: SettingsInput = {
  ftp: null,
  lthr: null,
  gewicht: null,
  doel: null,
  doelStart: null,
  hrMax: null,
  hrRest: null,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: null,
  pendelAantal: null,
};

/**
 * Duur-label (byte-getrouwe port van GAS `trnDurLabel_`, Script.html:1907). Minuten → "1u 30" / "1u"
 * / "1u 05" / "45 min". Minuten < 60 → "N min"; ≥ 60 → "Hu" + (rest ? " MM" met nul-pad < 10).
 */
export function durLabel(mins: number): string {
  const t = Math.round(mins);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return h > 0 ? `${h}u${m ? ` ${m < 10 ? `0${m}` : m}` : ""}` : `${m} min`;
}

/** ProposalWeek + gedane-belasting-per-datum → het Schema-view-model (puur). De override-data reist
 * nu via `proposalWeek` (ProposalDay.override, 3b) → geen aparte overrides-param meer. `readiness` +
 * `settings` voeden sinds laag 2 het per-dag verlicht-voorstel (buildVerlichtVoorstel). */
// ── LAAG 2 — het per-dag verlicht-VOORSTEL (meetlat: GAS WebApp.gs:1198-1226) ────────────
// Read-side overlay op de VANDAAG-dag. Muteert het plan niet: pas bij akkoord wordt er een
// dag-override met src:'readiness' geschreven, via de bestaande override-keten.

/** Het voorstel zoals de dagkaart 'm rendert; null = geen voorstel voor vandaag. */
export interface VerlichtVoorstel {
  datum: string;
  band: VerlichtBand;
  score: number | null;
  fromType: string;
  toType: string;
  fromNaam: string;
  toNaam: string;
  /** 'rustig' | 'tempo' — uit readinessAdjust_; voedt de free-override-variant. */
  intensiteit: string;
  /** Aanbod-copy (voorwaardelijk, claimt de daad niet). */
  regel: string;
  /** Label van de primaire actieknop. */
  actieLabel: string;
  /** De override die bij akkoord geschreven wordt (library als het type mag, anders free). */
  override: DayOverride;
  /** T28 fase 2a-ii — SECUNDAIRE keuze: volledige rust i.p.v. de aangeboden herstelrit.
   * Alleen gevuld bij band 'rest'; null = geen tweede knop. */
  restOverride?: DayOverride | null;
  /** Label van die tweede knop; null als er geen rust-keuze is. */
  restActieLabel?: string | null;
}

/** Mag `toType` als LIBRARY-override over de draad? Leest de gedeelde runtime-lijst
 * (packages/shared) die de worker-validatie óók gebruikt — niet gehardcodeerd. Types buiten
 * de lijst (o.a. combo_long_with_efforts, pendel_z2) zouden een 400 geven → free-override. */
function isLibraryOverrideType(t: string): t is OverrideWorkoutType {
  return (OVERRIDE_WORKOUT_TYPES as readonly string[]).includes(t);
}

/**
 * buildVerlichtVoorstel — het voorstel voor VANDAAG, of null.
 *
 * Guards, 1-op-1 met GAS (WebApp.gs:1201-1215):
 *  - alleen de kalenderdag vandaag; al gereden (state 'done') → niets;
 *  - er moet een geplande engine-sessie zijn (geen rustdag, geen 'free');
 *  - band moet bestaan (te weinig data → null → geen voorstel);
 *  - een BESTAANDE override onderdrukt het voorstel (handmatig gekozen wint; een
 *    readiness-override is het reeds gegeven akkoord → de kaart toont dan OverriddenDetail);
 *  - multi-sessie (pendel) wordt overgeslagen — GAS doet dat ook, en het vermijdt meteen het
 *    pendel_z2-type dat niet als library-override mag.
 * De beslissing zelf komt uit de engine-port `readinessAdjust_` (coach.ts:595, 1:1 Coach.gs:306):
 * ready → keep · Taper/Recovery → keep · niet-hard → keep · caution → demoteType_ · rest → recovery.
 */
export function buildVerlichtVoorstel(
  day: SchemaDay,
  fase: string,
  band: "ready" | "caution" | "rest" | null,
  score: number | null,
  doel: string,
): VerlichtVoorstel | null {
  if (!day.isToday) return null;
  if (day.state === "done" || day.state === "gemist") return null;
  if (day.override) return null;
  if (!band || band === "ready") return null;
  const type = day.voorgesteldType;
  if (!type || type === "free") return null;
  if (day.sessions.length !== 1) return null; // rustdag (0) of pendel-multisessie (>1)

  const zs = workoutZones(type, doel);
  const isHard = zs.indexOf("high") >= 0 || zs.indexOf("anaerobic") >= 0;
  const adj = readinessAdjust_({ type, isHard }, band, fase);
  if (!adj || adj.action !== "demote") return null;

  const toType = String(adj.toType);
  const fromNaam = day.sessions[0]?.naam || "je sessie";
  const toNaam = readinessEaseNaam_(toType);
  // T28 fase 2a-ii: caution maakt de dag óók iets korter (adj.durFactor uit de engine).
  // Clamp op de contract-ondergrens 20 (override.durMin ∈ [20,360]).
  const curDur = day.sessions[0]?.totaalMin || 60;
  const durMin = Math.max(
    20,
    Math.round(curDur * (Number(adj.durFactor) || 1)),
  );
  const label = verlichtBadgeLabel(band, toNaam);

  // library als het type is toegestaan; anders free (GAS kiest altijd free).
  const override: DayOverride = isLibraryOverrideType(toType)
    ? {
        type: "library",
        workoutType: toType,
        durMin,
        src: "readiness",
        label,
      }
    : {
        type: "free",
        ritType: "vrij",
        intensiteit: adj.intensiteit === "tempo" ? "tempo" : "rustig",
        durMin,
        src: "readiness",
        label,
      };

  // T28 fase 2a-ii: bij lage gereedheid is volledige rust een GELIJKWAARDIGE keuze naast
  // de aanbevolen herstelrit. De atleet kiest; de coach dringt niets op (M10).
  const restOverride: DayOverride | null = adj.restAllowed
    ? { type: "rest", src: "readiness", label: verlichtRustBadgeLabel() }
    : null;

  return {
    datum: day.datum,
    band,
    score,
    fromType: type,
    toType,
    fromNaam,
    toNaam,
    intensiteit: String(adj.intensiteit),
    regel: verlichtAanbodRegel(band, score, fromNaam, toNaam),
    actieLabel: verlichtActieLabel(band, toNaam),
    override,
    restOverride,
    restActieLabel: restOverride ? verlichtRustActieLabel() : null,
  };
}

/**
 * De coach-RESULTAATregel op een reeds-geaccepteerd verlicht-voorstel (override.src ===
 * 'readiness'). Null voor elke andere override — een handmatige keuze krijgt geen coach-regel
 * (GAS overrideKaart_ doet dat ook niet; de pin IS de reden).
 *
 * De band wordt uit de OVERRIDE zelf afgeleid, niet uit de readiness-van-nu: die kan de dag
 * erna hersteld zijn terwijl de override nog staat, en de regel beschrijft wat er is gebeurd.
 * 'Rustig gehouden' (rest) ⟺ het aanbod ging naar een herstelrit; anders de caution-variant.
 */
export function verlichtResultaat(override: DayOverride | null): string | null {
  if (!override || override.src !== "readiness") return null;
  // T28 fase 2a-ii: volledige rust heeft geen workoutType en geen intensiteit — eigen tak,
  // vóór de library/free-afleiding, met eigen woorden (er is niet gereden).
  if (override.type === "rest") return verlichtRustResultaatRegel();
  const toNaam =
    override.type === "library"
      ? readinessEaseNaam_(override.workoutType)
      : override.type === "free" && override.intensiteit === "tempo"
        ? "Tempo-rit"
        : "Rustige rit";
  const band: VerlichtBand =
    override.label === verlichtBadgeLabel("rest", toNaam) ? "rest" : "caution";
  return verlichtResultaatRegel(band, toNaam);
}

/** 3d stap 2b — coach-resultaatregel bij een geaccepteerd VERLENG-voorstel. Herkent de override
 * aan het "Verlengd naar … min"-label (verlengBadgeLabel); een handmatig gekozen long_z2 draagt
 * dat label NIET → geen coach-regel (GAS overrideKaart_-parity, net als verlichtResultaat op een
 * manuele keuze). Los van verlichtResultaat: die gate't op src==='readiness', dat de verleng
 * bewust NIET zet (anders zou de verlicht-copy de verleng kapen). */
export function verlengResultaat(override: DayOverride | null): string | null {
  if (
    !override ||
    override.type !== "library" ||
    override.workoutType !== "long_z2" ||
    override.label !== verlengBadgeLabel(override.durMin)
  )
    return null;
  return verlengResultaatRegel(override.durMin);
}

/** 5b-ii — resultaat-regel voor een geaccepteerd TESTVOORSTEL. Matcht op het EXACTE badge-label:
 * een handmatig gekozen test (mocht die ooit bestaan) draagt dat label niet en krijgt dus ook niet
 * de coach-regel die bij het voorstel hoort. `weekdag` komt van de caller (presentatie). */
export function testResultaat(
  override: DayOverride | null,
  weekdag: string,
): string | null {
  if (
    !override ||
    override.type !== "library" ||
    override.workoutType !== "test" ||
    override.label !== testBadgeLabel()
  )
    return null;
  return testResultaatRegel(weekdag);
}

/** 3d stap 4 — het FATIGUE-voorstel (laag-1 data; laag-2 rendert de kaart). `offer` = de trigger
 * vuurde, nog niet goedgekeurd → `preview` is de wat-als-week voor de delta. `applied` = de
 * gebruiker gaf akkoord voor deze week → de ACTIEVE proposalWeek draagt de shift al. */
export interface FatigueVoorstel {
  state: "offer" | "applied";
  /** 'up' = doortrainen (deload→normale week) · 'down' = vervroegde deload (opbouwweek→deload). */
  dir: "up" | "down";
  /** De TSB-trend (offer); null in 'applied'. Blijft: de DOWN-copy noemt 'm nog (de Form-put). */
  tsbTrend: number | null;
  /** Het BLOK-signaal dat de trigger dreef (ΔCTL over het blok, offer); null in 'applied'. */
  blok: { delta: number; fromCtl: number; toCtl: number } | null;
  /** De wat-als-week (mesoWeek gesubstitueerd) — voedt de laag-2-kaart-delta. null in 'applied'. */
  preview: ProposalWeek | null;
}

/** Σ geplande sessie-minuten van een week — DEZELFDE som die `deriveSchemaView` als `minuten.gepland`
 * (de WeekLoad-"Uren"-stat) berekent (Σ `sessions[].totaalMin`). Geëxporteerd zodat de fatigue-delta
 * (preview − baseline) dezelfde reken-basis gebruikt zonder de logica te dupliceren. */
export function weekPlannedMinuten(week: ProposalWeek): number {
  return week.days.reduce(
    (acc, d) => acc + d.sessions.reduce((a, s) => a + s.totaalMin, 0),
    0,
  );
}

/** FASE-C C3 — de PUSH-waardige dagen uit de schema-view: VOORUIT + niet-gedaan (incl. vandaag als
 * die nog niet gereden is), mét sessies. Byte-parity met GAS' pushAllPending_ (toekomst incl.
 * vandaag). state 'today'/'planned' = een geplande, niet-voltooide dag; 'done'/'gemist'/'rest'
 * vallen af. De extra `datum >= todayISO`-gate sluit een verleden-dag met sessies (kan niet, maar
 * defensief) uit. Pure functie → testbaar zonder de fetch/UI. */
export function collectPushDays(
  days: SchemaDay[],
  todayISO: string,
): { dateISO: string; type: string; sessions: SchemaSession[] }[] {
  return days
    .filter(
      (d) =>
        // PENDEL-fix (docs/PENDEL-RECON.md §5): "done" staat er nu bij, want een pendeldag met één
        // gereden rit is done ÉN heeft nog een open sessie. DE STATE-LIJST BLIJFT STAAN in plaats
        // van te vervallen: hem laten vallen zou een op vandaag GEDISPONEERDE dag (state "gemist",
        // sessies wél gevuld) alsnog pushen, en dat is precies wat "Niet gedaan?" moet voorkomen.
        (d.state === "today" || d.state === "planned" || d.state === "done") &&
        d.openSessions.length > 0 &&
        d.datum >= todayISO,
    )
    .map((d) => ({ dateISO: d.datum, type: "Ride", sessions: d.openSessions }));
}

/** FASE-C C3 — pure poort vóór de push: geen FTP → geen push (de stille-0-watt-hoek); geen
 * push-waardige dagen → niets te doen. Zo is de guard testbaar zonder de React-component. */
export interface PushGuard {
  ok: boolean;
  reason?: "no-ftp" | "no-days";
}
export function pushGuard(
  ftp: number | null | undefined,
  pushDayCount: number,
): PushGuard {
  if (ftp == null) return { ok: false, reason: "no-ftp" };
  if (pushDayCount === 0) return { ok: false, reason: "no-days" };
  return { ok: true };
}

/** Ruw engine-type → NL-weergavenaam via de intent-labels (één bron, geen eigen tabel). */
export function typeNaam(type: string | null): string {
  if (!type) return "geen training";
  return String(COACH_INTENT_LABEL_[intentFromType_(type)] ?? "Training");
}

export function deriveSchemaView(
  proposalWeek: ProposalWeek,
  doneByDate: Record<string, DoneEntry>,
  todayISO: string,
  dispositionByDate: Record<string, DispositionReason>,
  readiness: ReadinessResult | null = null,
  settings: SettingsInput = EMPTY_SETTINGS,
): SchemaView {
  const tss: LoadStat = { gepland: 0, gedaan: 0 };
  const minuten: LoadStat = { gepland: 0, gedaan: 0 };
  const dagen: LoadStat = { gepland: 0, gedaan: 0 };

  const days: SchemaDay[] = proposalWeek.days.map((d) => {
    const sessions = d.sessions.map(toSession);
    const done = doneByDate[d.datum];
    const doneTss = done?.tss ?? 0;
    const dt = parseLocalDate(d.datum);
    const isToday = d.datum === todayISO;
    const isDone = doneTss > 0;
    const isVerstreken = d.datum < todayISO;
    const dispositie = dispositionByDate[d.datum] ?? null;

    // DE AFGELEIDE, één keer. Vooruit-dagen dragen hun plan in `sessions`; een verstreken dag heeft
    // er nul en valt terug op de bevroren entry. De nul-conditie is dezelfde die de weekkaart al
    // hanteerde (`plannedMinDay > 0`), dus een naar-rust-gezette dag (0 min) telt nergens mee.
    const planSessions: SchemaSession[] =
      sessions.length > 0
        ? sessions
        : d.plannedForDone && (d.plannedForDone.totaalMin ?? 0) > 0
          ? [toSession(d.plannedForDone)]
          : [];
    // PENDEL-fix: welke geplande sessies staan nog OPEN. `ritten` telt de activiteiten van de
    // dag; k ritten dekken de EERSTE k sessies. Zonder rit is dit gewoon `sessions`.
    const gereden = done?.ritten ?? 0;
    const openSessions = sessions.slice(Math.min(gereden, sessions.length));
    const heeftPlan = planSessions.length > 0;
    // STAP 1 (same-day-flip): een VOLTOOIDE activity wint van 'vandaag' → done-kaart, ook
    // vandaag (zoals GAS: readiness vervalt zodra er gereden is). isToday blijft apart voor
    // de dag-strip-markering. Vandaag zónder rit → 'today' (readiness + geplande workout).
    // 'gemist' (A2/A4): gedisponeerde dag mét voorstel en GEEN rit — NÁ done, VÓÓR today
    // (byte-exact GAS WebApp.gs:1143: disp && voorstel && !actual overschrijft, behalve done).
    // 'gemist' vuurt nu ook op een VERSTREKEN dag met plan en zonder rit — niet alleen op een
    // gedisponeerde. Daarmee houdt een gedisponeerde dag zijn gemist-state ook nádat hij
    // verstrijkt (voorheen viel hij dan terug naar "rest"), en toont een gemiste sleutelsessie
    // niet langer de rustdag-copy. Een verstreken RUSTdag, of een dag zonder bevroren entry,
    // draagt geen plan en blijft dus gewoon "rest".
    const state: DayState = isDone
      ? "done"
      : heeftPlan && (dispositie || isVerstreken)
        ? "gemist"
        : isToday
          ? "today"
          : heeftPlan
            ? "planned"
            : "rest";

    // GEPLANDE dagwaarde — ÉÉN keer per dag, met DEZELFDE terugval voor alle drie de stats (TSS, Uren,
    // Dagen). Vooruit-dagen dragen hun plan in `sessions`; verstreken/gedane dagen krijgen sessions=[]
    // (assignWorkouts bouwt sessions alleen voor tePlannen = train && !gedaan && datum >= vandaag) → val
    // daar terug op `d.plannedForDone`, dat DAGTOTALEN draagt (buildWeekplanEntries sommeert de sessies
    // naar minuten/tss; een verstreken pendeldag telt dus voor beide ritten). Zonder die terugval krimpt
    // de gepland-noemer terwijl de week vordert (5 → 1/4). `plannedForDone` is per constructie alléén
    // gezet als de dag GEEN sessies heeft → geen dubbeltelling.
    // "Dagen"-noemer (GAS-parity, weekPlanSummary_ WebApp.gs:973: geplandDagen = weekplan-entries met
    // minuten > 0; een rustdag telt niet, een pendel/multi-sessie-dag is één entry → telt 1). Conditie =
    // duur > 0 (NIET louter `!= null`): een naar-rust-gezette dag (0 min) telt nergens mee.
    // Leunt nu op DEZELFDE afgeleide als de dagkant, zodat week en dag niet meer uiteen kunnen
    // lopen. Gelijkwaardige herschrijving: `planSessions` is `sessions` als die er zijn, anders de
    // bevroren entry als één sessie — precies de terugval die hier al stond.
    const plannedMinDay = planSessions.reduce((sum, x) => sum + x.totaalMin, 0);
    const plannedTssDay = planSessions.reduce((sum, x) => sum + x.tss, 0);
    minuten.gepland += plannedMinDay;
    tss.gepland += plannedTssDay;
    if (plannedMinDay > 0) dagen.gepland += 1;
    tss.gedaan += doneTss;
    minuten.gedaan += done?.minuten ?? 0;
    if (isDone) dagen.gedaan += 1;

    // VOLLE vergelijking als er een geplande workout was (2b-2 STAP 3); anders (bv.
    // wedstrijd zonder voorstel) blijft dit null → gereduceerde kaart (STAP 2).
    // P1 (render-bug): de plan-bron mag NIET aan de planner-`gedaan`-vlag (tePlannen) hangen.
    // Een done-dag (activity-afgeleid `isDone`) levert zijn geplande workout via `plannedForDone`
    // (verstreken dag) OF — voor een done-VANDAAG die nog in tePlannen zit (gedaan=0) — via de
    // al-gebouwde dag-sessie `d.sessions[laatste]`. Spiegelt GAS' `voorstel && actual`
    // (WebApp.gs:1152), los van de gedaan-vlag. Beide zijn dezelfde ProposalWorkout-shape.
    //
    // PENDEL-fix (docs/PENDEL-RECON.md §6): de counterpart is een VOLGORDE-koppeling — heen vóór
    // terug, dus rit k hoort bij sessie k. Zonder dit zou de half-gereden pendeldag de HEENrit
    // tegen de TERUGrit vergelijken, en dat is een onware bewering. `plannedForDone` houdt
    // voorrang, waardoor een volledig gereden of VERSTREKEN dag byte-identiek blijft. Bij
    // pendelAantal 3 met twee ritten gereden blijft de vergelijking een benadering (de
    // samengevoegde dag-entry tegen sessie 2); dat is in de test vastgelegd, niet verzwegen.
    const plannedForCompare =
      d.plannedForDone ??
      d.sessions[
        Math.min(Math.max(gereden - 1, 0), Math.max(d.sessions.length - 1, 0))
      ] ??
      null;
    // Per-dag coach-feedback (2a): done → hergebruik de fb die de compare al berekent (ÉÉN
    // coachFeedback_-aanroep via buildDoneCompareFull); gemist → een missed-fb (actual=null,
    // isMissed=true). Anders null. Voedt de coach-box (done) / GemistCard (gemist).
    let doneCompare: DoneCompare | null = null;
    let coach: SchemaDayCoach | null = null;
    if (state === "done" && done) {
      const full = buildDoneCompareFull(
        done,
        plannedForCompare,
        d.voorgesteldType,
        proposalWeek.macroFase,
      );
      doneCompare = full?.compare ?? null;
      coach = full?.coach ?? null;
    } else if (state === "gemist") {
      coach = missedCoach_(
        plannedForCompare,
        d.voorgesteldType,
        proposalWeek.macroFase,
      );
    }

    return {
      datum: d.datum,
      dagIdx: d.dagIdx,
      weekday: WEEKDAYS[dt.getDay()] ?? "",
      dayNum: dt.getDate(),
      state,
      isToday,
      voorgesteldType: d.voorgesteldType,
      reden: d.reden,
      redenCode: d.redenCode,
      sessions,
      planSessions,
      openSessions,
      doneTss,
      done: done ?? null,
      doneCompare,
      dispositie,
      coach,
      override: d.override,
    };
  });

  // LAAG 2 — verlicht-voorstel voor VANDAAG (read-side, muteert niets). `fase` is de
  // EFFECTIEVE fase incl. Taper/Recovery — precies wat readinessAdjust_ verwacht (die keept
  // in een taper/herstelweek); `macroFase` zou daar de verkeerde bron zijn.
  const todayDay = days.find((d) => d.isToday) ?? null;
  const verlicht = todayDay
    ? buildVerlichtVoorstel(
        todayDay,
        proposalWeek.fase,
        readiness?.band ?? null,
        readiness?.score ?? null,
        settings.doel ?? "",
      )
    : null;

  return {
    weekMonday: proposalWeek.weekMonday,
    faseLabel: macroFaseLabel(proposalWeek.fase),
    macroFase: proposalWeek.macroFase,
    fase: proposalWeek.fase,
    eventNaam: proposalWeek.eventNaam,
    wekenTotEvent: proposalWeek.wekenTotEvent,
    planModus: proposalWeek.planModus,
    volumeUren: presetHoursLabel(proposalWeek.profielPreset),
    coachNaam: proposalWeek.coachNaam ?? null,
    todayISO,
    days,
    tss,
    minuten,
    dagen,
    verlicht,
  };
}

/**
 * persistWeekplan — schrijf het voorstel weg als plan-van-record (laag 1a).
 * Fire-and-forget: fouten worden gesluikt (het is een achtergrond-persistentie, geen
 * render-afhankelijkheid). Slaat de PUT over als de vooruit-dagen al identiek opgeslagen zijn.
 * Geëxporteerd zodat de dedup-/serialisatie-keten testbaar is zonder loadSchemaWeek te draaien.
 */
export function persistWeekplan(
  proposalWeek: ProposalWeek,
  doel: string | null,
  storedWeekplans: unknown[],
  todayISO: string,
  reconWeek?: ProposalWeek | null,
): boolean {
  // ROADMAP punt 26 — VÓÓR beide takken. Een dag die VANDAAG gereden is heeft geen sessies meer,
  // dus `buildWeekplanEntries` levert er geen entry voor, en de worker-freeze dekt alleen het
  // VERLEDEN — de bewaarde entry zou dus stil verdwijnen. Dit haalt hem terug, verbatim.
  const entries = withDoneTodayEntries(
    buildWeekplanEntries(proposalWeek, doel),
    proposalWeek,
    storedWeekplans,
    todayISO,
  );
  if (reconWeek) {
    // Aanpak A: er is een gat (een verstreken trainingsdag zonder opgeslagen entry). Vul het met
    // het schone weekmaandag-plan en schrijf ALTIJD — de dedup zou anders overslaan omdat de
    // vooruit-dagen ongewijzigd zijn, terwijl juist het verleden aangevuld moet worden. De
    // worker-freeze houdt correct bewaarde verleden-dagen vast; de reconstructie vult enkel de gaten.
    const reconEntries = buildWeekplanEntries(reconWeek, doel);
    const payload = mergeReconEntries(entries, reconEntries, todayISO);
    void putWeekplan(proposalWeek.weekMonday, payload, todayISO).catch(
      () => {},
    );
    return true;
  }
  if (sameForwardEntries(entries, storedWeekplans, todayISO)) return false;
  void putWeekplan(proposalWeek.weekMonday, entries, todayISO).catch(() => {});
  return true;
}

/**
 * loadSchemaWeek — haalt de doelweek-data PARALLEL op, assembleert de
 * BuildProposalInput en draait buildWeekProposal + deriveReadiness client-side.
 * done-belasting = per-datum-sommen (TSS idx8 + duur idx3-minuten) uit de activities,
 * gefilterd op de 7 doelweek-datums. getWellness wordt ÉÉN keer gehaald (voedt zowel
 * de proposal-input als deriveReadiness). Verse user (settings null) → EMPTY_SETTINGS.
 */
export async function loadSchemaWeek(): Promise<{
  proposalWeek: ProposalWeek;
  doneByDate: Record<string, DoneEntry>;
  readiness: ReadinessResult;
  todayISO: string;
  rpeByDate: Record<string, number>;
  dispositionByDate: Record<string, DispositionReason>;
  settings: SettingsInput;
  /** 3d stap 4 — fatigue-voorstel (offer/applied), of null. Laag-2 rendert de kaart. */
  fatigue: FatigueVoorstel | null;
  /** 5a-ii — blok-terugblik (alleen in blokweek 4 en 1), of null. Laag-2 rendert de kaart. */
  blokReview: BlokReview | null;
  /** 5b-ii — testvoorstel voor de rustweek, of null. Laag-2 rendert de kaart. */
  testVoorstel: TestVoorstel | null;
  /**
   * ROADMAP punt 59 — de staat van de drempelwaarde, ook als er geen aanbod staat. Null bij een
   * doel zonder effect-meter of zonder `doelStart`: daar kan per constructie nooit een ijkaanbod
   * komen, dus een staat-melding zou onwegwerkbaar zijn.
   */
  ijkStaat: IjkStatus | null;
  /** ROADMAP stap 2 — dosis-trede-voorstel (null = geen kaart). Laag-2 rendert 'm. */
  dosisTredeVoorstel: DosisTredeVoorstel | null;
  /** ROADMAP punt 9 fase B — de overname-vraag, of null als er niets te vragen valt. */
  eventOvernameVoorstel: EventOvernameVoorstel | null;
  doelPassendVoorstel: DoelPassendVoorstel | null;
  /** De zone-grenzen waarop dit beeld is gerekend (ROADMAP punt 6 fase 2). */
  grenzen: readonly number[];
  /** De maandag van de getoonde week (de sleutel van de goedkeuring). */
  weekMonday: string;
}> {
  const monday = weekMondayIso();
  const todayISO = todayIso();
  // M87 — de drie voorafgaande weekmaandagen, als REFERENT voor de herstelweek-volumefactor.
  // Kalender-constructor met dezelfde lokale-datum-rekenkunde als `weekMondayIso` hierboven:
  // GEEN UTC-round-trip, anders schuift dit over de DST-sprong een dag op.
  const maandagVoor = (weken: number): string => {
    const [y, m, d] = monday.split("-").map(Number);
    const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - weken * 7);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };
  const [
    settings,
    plannerDays,
    events,
    activitiesRes,
    weekplans,
    wellness,
    rpe,
    dispositions,
    overrides,
    checkin,
    fatigueShift,
    dosisTredeRow,
    powerZonesRow,
    eventOvernameRow,
    doelPassendRow,
    ijkingRow,
    plannerVorige1,
    plannerVorige2,
    plannerVorige3,
  ] = await retryLoad(
    // ROADMAP punt 30 — DE HELE BOUW WORDT HERHAALD, en de rijen dragen een NAAM.
    //
    // Twee dingen die dit NIET doet, en allebei bewust. Het degradeert niet: twaalf van deze
    // vijftien rijen voeden `buildWeekProposal`, en de getoonde week gaat via `persistWeekplan`
    // hieronder als plan-van-record de opslag in — een stil vervangen rij zou dus geen
    // ontbrekende kaart opleveren maar een ANDER plan-van-record. En het dekt het
    // propagatievenster na een deploy niet; zie docs/PUNT30-BOUWDOC.md §5.
    //
    // De labels zijn de hele winst van `laadGelabeld`: de melding zegt voortaan WÉLKE bron viel
    // in plaats van de eerste de beste afwijzing door te geven.
    () =>
      laadGelabeld([
        { label: "instellingen", laad: () => getSettings() },
        { label: "weekplanner", laad: () => getPlanner(monday) },
        { label: "events", laad: () => getEvents() },
        { label: "activiteiten", laad: () => getActivities() },
        { label: "weekplannen", laad: () => getWeekplans(monday) },
        { label: "wellness", laad: () => getWellness() },
        { label: "rpe", laad: () => getRpe() },
        { label: "disposities", laad: () => getDispositions() },
        { label: "overrides", laad: () => getOverrides() },
        { label: "check-in", laad: () => getCheckin(todayISO) },
        { label: "fatigue-shift", laad: () => getFatigueShift() },
        { label: "dosis-trede", laad: () => getDosisTrede() },
        { label: "power-zones", laad: () => getPowerZones() },
        { label: "event-overname", laad: () => getEventOvername() },
        { label: "doel-passendheid", laad: () => getDoelPassend() },
        { label: "ijking", laad: () => getIjking() },
        // M87 — de referent-weken. Ze voeden UITSLUITEND `plannerHistorie`; de bestaande
        // "weekplanner"-rij hierboven blijft de enige bron voor het grid en wordt niet breder.
        { label: "weekplanner -1", laad: () => getPlanner(maandagVoor(1)) },
        { label: "weekplanner -2", laad: () => getPlanner(maandagVoor(2)) },
        { label: "weekplanner -3", laad: () => getPlanner(maandagVoor(3)) },
      ]) as unknown as Promise<
        [
          Awaited<ReturnType<typeof getSettings>>,
          Awaited<ReturnType<typeof getPlanner>>,
          Awaited<ReturnType<typeof getEvents>>,
          Awaited<ReturnType<typeof getActivities>>,
          Awaited<ReturnType<typeof getWeekplans>>,
          Awaited<ReturnType<typeof getWellness>>,
          Awaited<ReturnType<typeof getRpe>>,
          Awaited<ReturnType<typeof getDispositions>>,
          Awaited<ReturnType<typeof getOverrides>>,
          Awaited<ReturnType<typeof getCheckin>>,
          Awaited<ReturnType<typeof getFatigueShift>>,
          Awaited<ReturnType<typeof getDosisTrede>>,
          Awaited<ReturnType<typeof getPowerZones>>,
          Awaited<ReturnType<typeof getEventOvername>>,
          Awaited<ReturnType<typeof getDoelPassend>>,
          Awaited<ReturnType<typeof getIjking>>,
          Awaited<ReturnType<typeof getPlanner>>,
          Awaited<ReturnType<typeof getPlanner>>,
          Awaited<ReturnType<typeof getPlanner>>,
        ]
      >,
  );

  const activities = parseActivityRows(activitiesRes);
  // deriveReadiness is puur → veilig vóór buildWeekProposal berekenen; de holistische band stuurt
  // het plan-signaal (band-gedreven demote). Hergebruikt voor de return (niet 2× berekend).
  const readiness = deriveReadiness(wellness, checkin);

  // Stap 1b (DOELEN-SPEC 3.2) — de WEEK-BREDE vermoeidheidskaart vuurt niet bij een doel zonder
  // mesocyclus (vandaag Onderhoud). ÉÉN keer berekend uit het doel; ZOWEL de opt-in-tak als de
  // trigger-tak hangen eraan. Staat er nog een niet-vervallen fatigue_shift-rij van vóór een
  // doel-wissel, dan mag die geen applied-kaart tonen én geen mesoWeekOverride naar buildWeekProposal
  // sturen (die override gaat in proposal.ts vóór effectiveMesoWeek_ en zou de week alsnog naar deload 4
  // duwen). We laten die rij staan en schrijven NIETS naar D1 — hij vervalt vanzelf de maandag erna (M68).
  const weekFatigueOn = weekFatigueEnabled(settings?.doel);

  // ROADMAP stap 2 — DE DOSIS-TREDE. LEESREGEL: de trede geldt alleen voor het doel waarop hij is
  // opgebouwd; staat er nog een rij van vóór een doel-wissel, dan LEZEN we hem als 0. Bewust geen
  // extra schrijfactie — de eerstvolgende bevestiging overschrijft de rij toch, en stilzwijgend
  // opruimen bij een READ is precies het soort verborgen mutatie dat we niet willen (M68-lijn).
  // Ontbrekend of null telt eveneens als 0.
  const dosisTrede =
    dosisTredeRow.doel != null &&
    dosisTredeRow.doel === (settings?.doel ?? null) &&
    Number.isFinite(Number(dosisTredeRow.trede))
      ? Math.max(0, Math.trunc(Number(dosisTredeRow.trede)))
      : 0;

  // 3d stap 4 — FATIGUE-shift opt-in (spiegelt de inhaal-opt-in, M68): geldt alleen voor DEZE
  // maandag + een geldige richting, vervalt vanzelf de week erna. Goedgekeurd → de ACTIEVE
  // proposalWeek krijgt de mesoWeek-substitutie (up→1 doortrainen, down→4 vervroegde deload).
  const fatigueOptIn =
    weekFatigueOn &&
    fatigueShift.monday === monday &&
    (fatigueShift.dir === "up" || fatigueShift.dir === "down");
  const fatigueOverride: number | undefined = fatigueOptIn
    ? fatigueShift.dir === "up"
      ? 1
      : 4
    : undefined;

  // Het ACTIEVE plan. `planAdaptation` wordt NIET meegegeven sinds de opruiming van de
  // week-inhaal-kaart (ROADMAP punt 5c, `docs/INHAAL-5C-VERDICT.md` §7) en valt dus terug op
  // `PLAN_ADAPTATION_ENABLED` (false) — precies de waarde waarmee het plan vandaag al draait,
  // want de goedkeuring kon alleen via die kaart waar worden. `mesoWeekOverride` undefined →
  // de kalender-mesoWeek; is de fatigue-deload goedgekeurd, dan IS dat het plan voor deze week.
  // ROADMAP punt 9 fase B — IS DE OVERNAME BEVESTIGD? Alleen 'ja' telt, en alleen als de
  // opgeslagen rij over HET HUIDIGE hoofdevent gaat. Staat er nog een antwoord van een ander
  // (of verzet) event, dan leest dat als NIET bevestigd — en we ruimen niets op bij een read:
  // een leesactie hoort geen state te muteren, en de volgende PUT overschrijft de rij toch.
  const hoofdEventDatum = eventFase_(
    (events || []).map((e) => ({ ...e, datum: parseLocalDate(e.datum) })),
    parseLocalDate(todayISO),
  )?.hoofdEvent?.datum as Date | undefined;
  const hoofdEventISO = hoofdEventDatum
    ? (formatDate(hoofdEventDatum, "yyyy-MM-dd") as string)
    : null;
  const overnameBevestigd =
    eventOvernameRow.antwoord === "ja" &&
    eventOvernameRow.event != null &&
    eventOvernameRow.event === hoofdEventISO;

  const proposalInput = {
    settings: settings ?? EMPTY_SETTINGS,
    plannerDays,
    events,
    activities,
    weekplans,
    wellness,
    rpe,
    overrides,
    readinessBand: readiness.band,
    todayISO,
    mesoWeekOverride: fatigueOverride,
    dosisTrede,
    overnameBevestigd,
    // M87 — de referent voor de herstelweek-volumefactor. Buiten de herstelweek leest
    // `buildWeekProposal` dit veld niet, dus de gewone week is byte-identiek aan vóór deze bouw.
    plannerHistorie: [plannerVorige1, plannerVorige2, plannerVorige3],
  };
  const proposalWeek = buildWeekProposal(proposalInput);

  // 3d stap 4 — het FATIGUE-VOORSTEL. Bij opt-in: `applied` (de shift zit al in proposalWeek).
  // Anders: bereken de TSB-trend uit de LOAD (wellness `vorm`, NIET de readiness-band) en toets de
  // trigger tegen de KALENDER-context van proposalWeek (mesoWeek/macroFase/nearTaper zijn hier
  // ongesubstitueerd). Vuurt de trigger → `offer` met een wat-als-preview. Geen her-trigger bij
  // opt-in (de opt-in IS de weekbeslissing).
  let fatigue: FatigueVoorstel | null = null;
  if (fatigueOptIn) {
    fatigue = {
      state: "applied",
      dir: fatigueShift.dir as "up" | "down",
      tsbTrend: null,
      blok: null,
      preview: null,
    };
  } else if (weekFatigueOn) {
    const { trend } = computeTsbTrend(wellness, todayISO);
    const blok = computeBlockCtlDelta(wellness, monday);
    const ctlNow = latestCtl(wellness, todayISO);
    const dir = fatigueTrigger({
      calendarMesoWeek: proposalWeek.mesoWeek,
      macroFase: proposalWeek.macroFase,
      nearTaper: proposalWeek.nearTaper,
      tsbTrend: trend,
      minDataOk: fatigueMinDataOk(wellness, todayISO),
      ctlDelta: blok?.delta ?? null,
      ctlNow,
    });
    if (dir) {
      const preview = buildWeekProposal({
        settings: settings ?? EMPTY_SETTINGS,
        plannerDays,
        events,
        activities,
        weekplans,
        wellness,
        rpe,
        overrides,
        readinessBand: readiness.band,
        todayISO,
        mesoWeekOverride: dir === "up" ? 1 : 4,
        plannerHistorie: [plannerVorige1, plannerVorige2, plannerVorige3],
      });
      fatigue = { state: "offer", dir, tsbTrend: trend, blok, preview };
    }
  }
  // ROADMAP punt 6 fase 2 — DE ZONE-GRENZEN. Eén afgeleide, gevoed uit de route en NOOIT uit een
  // constante: zowel de blok-terugblik als het dosis-trede-voorstel krijgen deze waarde verplicht
  // mee. `zone5Grenzen` doet de volledige toets en valt bij null of onbruikbaar terug op
  // ZONE5_GRENZEN_DEFAULT, dus zonder gesynchroniseerde zones is het gedrag dat van vandaag.
  const grenzen = zone5Grenzen(powerZonesRow);

  // 5a-ii — de BLOK-TERUGBLIK. Eigen CTL-anker: `blokReviewVenster` levert de maandag van blokweek 4
  // van het BEOORDEELDE blok, zodat computeBlockCtlDelta exact de drie opbouwweken meet. Het
  // fatigue-pad hierboven blijft ONGEWIJZIGD en houdt zijn eigen anker op de huidige maandag — dat
  // beantwoordt een andere vraag (mag de deload vervallen) op een ander moment.
  const blokVenster = blokReviewVenster(settings?.doelStart ?? null, monday);
  const blokReview = blokVenster
    ? buildBlokReview({
        activities,
        doel: settings?.doel ?? null,
        weekUren: settings?.weekUren ?? null,
        doelStart: settings?.doelStart ?? null,
        weekMondayISO: monday,
        todayISO,
        ctlDelta:
          computeBlockCtlDelta(wellness, blokVenster.ctlAnker)?.delta ?? null,
        // 5b-i — voeden de gelegenheid-detectie (test-override of wedstrijd). Beide staan al in
        // loadSchemaWeek; geen extra fetch.
        events,
        overrides,
        dosisTrede,
        grenzen,
        // ROADMAP punt 14 fase 1 — de poortset per week. Dezelfde blob die hierboven al is
        // opgehaald; geen extra fetch.
        weekplans,
      })
    : null;

  // ROADMAP stap 2 — het DOSIS-TREDE-voorstel. Alle poorten zitten in de bouwer; hier alleen de
  // invoer. `beantwoordBlok` is de blokstart waarvoor al bevestigd OF afgewezen is.
  // ROADMAP punt 9 fase B — het OVERNAME-VOORSTEL. Alle poorten zitten in `eventOvernameVoorstel`;
  // hier alleen de invoer. De twee fases komen daar uit `effectiveMacroFase_` zelf.
  const overnameMacro = eventFase_(
    (events || []).map((e) => ({ ...e, datum: parseLocalDate(e.datum) })),
    parseLocalDate(todayISO),
  );
  const eventOvernameKaart = eventOvernameVoorstel({
    eventNaam: (overnameMacro?.hoofdEvent?.naam as string | undefined) ?? null,
    eventDatum: hoofdEventISO,
    wekenTot:
      typeof overnameMacro?.wekenTot === "number"
        ? overnameMacro.wekenTot
        : null,
    taperActief: overnameMacro?.taperEvent != null,
    doel: settings?.doel ?? null,
    doelFase: computeMacroPhase(
      settings?.doelStart ? parseLocalDate(settings.doelStart) : null,
      parseLocalDate(todayISO),
    ).fase,
    eventMacroFase: (overnameMacro?.macroFase as string | undefined) ?? null,
    settings: settings ?? EMPTY_SETTINGS,
    doelStart: settings?.doelStart ?? null,
    weekMondayISO: monday,
    beantwoordEvent: eventOvernameRow.event,
    beantwoordBlok: eventOvernameRow.blok,
    antwoord: eventOvernameRow.antwoord,
  });

  // ROADMAP punt 12 — het DOEL-PASSENDHEID-VOORSTEL. Alle poorten zitten in
  // `doelPassendVoorstel`; hier alleen de invoer. De uren zijn de GEDECLAREERDE weekuren uit
  // Instellingen, niet de som van de planner-dagminuten (DOELEN-SPEC §2A).
  const doelPassendRuw = doelPassendVoorstel({
    doel: settings?.doel ?? null,
    weekUren: settings?.weekUren ?? null,
    doelStart: settings?.doelStart ?? null,
    weekMondayISO: monday,
    beantwoordBlok: doelPassendRow.blok,
    beantwoordDoel: doelPassendRow.doel,
  });

  const dosisTredeKaart = bouwDosisTredeVoorstel({
    review: blokReview,
    doelStart: settings?.doelStart ?? null,
    weekMondayISO: monday,
    doel: settings?.doel ?? null,
    weekUren: settings?.weekUren ?? null,
    trede: dosisTrede,
    beantwoordBlok:
      dosisTredeRow.doel === (settings?.doel ?? null)
        ? (dosisTredeRow.blok ?? null)
        : null,
  });

  // ROADMAP punt 12 — EEN VRAAG TEGELIJK. De precedentie landt HIER en niet in JSX: hier is ze
  // toetsbaar, en `apps/web` heeft geen render-testinfrastructuur. Dit is de ENIGE call-site.
  const kaarten = kaartPrecedentie(
    eventOvernameKaart,
    doelPassendRuw,
    dosisTredeKaart,
  );

  // 5b-ii — het TESTVOORSTEL voor de rustweek. Leest uitsluitend uit wat hierboven al opgehaald
  // is (plannerDays, overrides, events, activities, settings) — GEEN extra fetch.
  const testVoorstel = buildTestVoorstel({
    plannerDays,
    overrides,
    events,
    activities,
    doel: settings?.doel ?? null,
    doelStart: settings?.doelStart ?? null,
    weekMondayISO: monday,
    todayISO,
    // ROADMAP punt 59 — het bewaarde antwoord op DEZE opening. Vervangt de vluchtige module-Set in
    // TestVoorstelCard die geen app-herstart overleefde. ROADMAP punt 64 — het DOEL hoort in de
    // sleutel: een bevestiging geldt voor het doel waarvoor zij gegeven is.
    ijkingBeantwoordBlok: ijkingRow.blok,
    ijkingBeantwoordDoel: ijkingRow.doel,
  });

  // ROADMAP punt 59 — de STAAT van de drempelwaarde, los van of er een aanbod staat. Blijft
  // zichtbaar nadat het aanbod is beantwoord; dat is de zichtbaarheid die M91 vraagt.
  //
  // DE DOEL-POORT STAAT HIER OOK. `buildTestVoorstel` valt voor Onderhoud op poort (2)
  // (`blokCheckEnabled`, DOELEN-SPEC §3.2) en zonder `doelStart` op poort (1). Zonder dezelfde
  // poort hier zou de staat-regel bij Onderhoud permanent "Ik heb je drempel nog nooit gemeten."
  // tonen terwijl er per constructie nooit een ijkaanbod kan komen om er iets aan te doen — een
  // melding die de gebruiker niet kan wegwerken. M55: niets tonen wat er niet is.
  const ijkStaat =
    settings?.doelStart && blokCheckEnabled(settings?.doel ?? null)
      ? ijkStatus({
          activities,
          events,
          overrides,
          todayISO,
          ijkingAntwoord: ijkingRow.antwoord,
          ijkingBeantwoordBlok: ijkingRow.blok,
          ijkingBeantwoordDoel: ijkingRow.doel,
          doel: settings?.doel ?? null,
          // De opening van het LOPENDE doelblok — de TWAALFWEEKSE teller, niet de vierweekse.
          // `blokStartVoorWeek` stond hier eerst en dat was fout: die rijdt `blokWeekVanWeek`
          // modulo BLOK_WEKEN (4). In de openingsweek vallen beide samen, dus geen test zag het;
          // vanaf doelblokweek 5 viel `geldt` om en verdween de bevestiging van het scherm.
          huidigeOpening: doelblokOpeningVoorWeek(settings.doelStart, monday),
        })
      : null;

  // PLAN-VAN-RECORD-GAT (aanpak A — docs/PLAN-VAN-RECORD-GAT-RECON.md). Een geplande dag die
  // gereden is vóórdat de app 'm als vooruit-dag zag, kreeg nooit een entry en valt uit de
  // weekkaart-noemer + compare. Detecteer zo'n gat; alleen dán een TWEEDE buildWeekProposal met
  // het SCHONE plan (weekmaandag als vandaag + lege activities → alle dagen vooruit → de coach
  // vult de hele week). Verder identieke inputs → zelfde settings/fase/mesoweek → dosis-getrouw.
  const gap = hasUnrecordedPastTrainingDay(
    plannerDays,
    weekplans,
    proposalWeek.weekMonday,
    todayISO,
  );
  const reconWeek = gap
    ? buildWeekProposal({
        ...proposalInput,
        todayISO: proposalWeek.weekMonday,
        activities: [],
      })
    : null;

  // PLAN-VAN-RECORD (laag 1a): persisteer de week als GAS-blob. Fire-and-forget (zoals de
  // auto-sync) — een mislukte PUT mag het scherm nooit blokkeren. DEDUP: alleen schrijven als
  // de NIET-BEVROREN dagen (vandaag/toekomst) afwijken van wat er al ligt; het verleden
  // bevriest de worker toch. `weekplans` is het 8-weken-venster → sameForwardEntries filtert
  // zelf op datum, dus geen extra fetch. Bij een gat (reconWeek gezet) wordt ALTIJD geschreven:
  // de recon-payload vult het ontbrekende verleden, dat de worker-freeze daarna vasthoudt.
  persistWeekplan(
    proposalWeek,
    settings?.doel ?? null,
    weekplans,
    todayISO,
    reconWeek,
  );

  // disposition-per-datum (A2) voor de gemist-state-afleiding + GemistCard.
  const dispositionByDate: Record<string, DispositionReason> = {};
  for (const d of dispositions) {
    dispositionByDate[d.datum] = d.reason;
  }

  const weekDates = new Set(proposalWeek.days.map((d) => d.datum));
  const doneByDate: Record<string, DoneEntry> = {};
  for (const row of activities) {
    const d = row[0];
    if (!(d instanceof Date)) continue;
    const key = formatDate(stripTime_(d), "yyyy-MM-dd");
    if (!weekDates.has(key)) continue;
    const de = buildDoneEntry(row);
    const prev = doneByDate[key];
    doneByDate[key] = prev ? mergeDone(prev, de) : de;
  }

  // rpe-per-datum voor de done-kaart-highlight (de engine leest de rpe-rijen apart via buildWeekProposal).
  const rpeByDate: Record<string, number> = {};
  for (const r of rpe) {
    if (r.rpe != null) rpeByDate[r.datum] = r.rpe;
  }
  return {
    proposalWeek,
    doneByDate,
    readiness,
    todayISO,
    rpeByDate,
    dispositionByDate,
    settings: settings ?? EMPTY_SETTINGS,
    fatigue,
    blokReview,
    testVoorstel,
    ijkStaat,
    dosisTredeVoorstel: kaarten.dosisTrede,
    eventOvernameVoorstel: kaarten.eventOvername,
    doelPassendVoorstel: kaarten.doelPassend,
    // ROADMAP punt 10 fase B: de weekstem rekent per zone en heeft dus de GESYNCHRONISEERDE
    // grenzen nodig. Ze gaan mee in de payload in plaats van client-zijde opnieuw afgeleid te
    // worden — één bron, dezelfde die de blok-terugblik al gebruikt.
    grenzen,
    weekMonday: monday,
  };
}
