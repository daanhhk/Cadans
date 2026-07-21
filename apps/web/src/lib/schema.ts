import {
  actualZoneMinutes_,
  COACH_INTENT_LABEL_,
  coachFeedback_,
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
import {
  type ActValuesRow,
  derivePlannerGedaan,
  type GedaanPlannerDay,
  parseActivityRows,
} from "./activities";
import {
  getActivities,
  getCheckin,
  getDebtOptIn,
  getDispositions,
  getEvents,
  getOverrides,
  getPlanner,
  getRpe,
  getSettings,
  getWeekplans,
  getWellness,
  putWeekplan,
} from "./api";
import {
  type InhaalBucket,
  inhaalAanbodRegel,
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
  buildWeekProposal,
  type ProposalWeek,
  type ProposalWorkout,
} from "./proposal";
import { deriveReadiness, type ReadinessResult } from "./readiness";
import { presetHoursLabel } from "./settings";
import { buildWeekplanEntries, sameForwardEntries } from "./weekplanBlob";

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
 * de coach-proza-string (done → DoneCompareCard-box, gemist → GemistCard). `planned`/`adapt` blijven
 * beschikbaar voor 2c/3b (feiten-gedreven coach-copy resp. de override-picker). */
export interface SchemaDayCoach {
  state: string;
  adapt: string | null;
  planned: unknown;
  narrative: string | null;
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
}

// ── Done-rit-afleidingen (fase 2a): PURE, getest ──────────────────────────
// 5-bucket reële zones (brok 5, GAS-parity met WebApp.gs coachActualZoneMin_). De zone-bars +
// coachFeedback_ lezen de VOLLE 5-bucket-verdeling; de engine-3-bucket `actualZoneMinutes_`
// (load/debt, weekprep) blijft ongemoeid. rust=Z1 · z2=Z2 · tempo=Z3 · drempel=Z4 · anaeroob=Z5.
export type Zone5Key = "rust" | "z2" | "tempo" | "drempel" | "anaeroob";
export type Zone5 = Record<Zone5Key, number>;

const ZONE5_ORDER: Zone5Key[] = ["rust", "z2", "tempo", "drempel", "anaeroob"];
const ZT_TO_ZONE5: Record<string, Zone5Key> = {
  Z1: "rust",
  Z2: "z2",
  Z3: "tempo",
  Z4: "drempel",
  Z5: "anaeroob",
  Z6: "anaeroob",
  Z7: "anaeroob",
};
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

/**
 * Ruwe icu_zone_times (Z1..Z7 + SS) → 5-bucket reële zone-minuten. EXACTE spiegel van GAS
 * `coachActualZoneMin_` (WebApp.gs:728): Z1→rust · Z2→z2 · Z3→tempo · Z4→drempel · Z5-7→anaeroob;
 * SS/overlays → skip; minuten = secs/60. Leeg/geen power-zonedata → null.
 */
export function actualZone5_(iczt: unknown): Zone5 | null {
  if (!Array.isArray(iczt) || iczt.length === 0) return null;
  const zm: Zone5 = { rust: 0, z2: 0, tempo: 0, drempel: 0, anaeroob: 0 };
  let saw = false;
  for (const z of iczt) {
    const id = (z as { id?: unknown } | null)?.id;
    if (typeof id !== "string") continue;
    const bk = ZT_TO_ZONE5[id];
    if (!bk) continue;
    zm[bk] += (Number((z as { secs?: unknown }).secs) || 0) / 60;
    saw = true;
  }
  return saw ? zm : null;
}

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
  };
}

/** Aggregeer twee done-objecten van dezelfde dag: som tss/min/zones, houd naam/type van de langste. */
function mergeDone(a: DoneEntry, b: DoneEntry): DoneEntry {
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
    adapt: fb.adapt ?? null,
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
    adapt: fb.adapt ?? null,
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

// ── FASE 2b — het INHAAL-VOORSTEL (week-niveau, READ-ONLY) ─────────────────────────────
// Toont naast het actieve plan wat er zou veranderen als het tekort van deze week wordt
// ingehaald. Muteert NIETS: het actieve `proposalWeek` blijft het origineel, en er is in
// deze fase geen goedkeuring en geen persistentie (M10 — voorstellen, niet stil muteren).

/** Eén dag die in het voorstel zou wijzigen. */
export interface InhaalVoorstelDag {
  datum: string;
  fromType: string;
  toType: string;
  /** NL-weergavenamen (via de engine-intentlabels) — nooit de ruwe type-keys tonen. */
  fromNaam: string;
  toNaam: string;
  redenCode: string;
}

export interface InhaalVoorstel {
  /** Dominante ontbrekende prikkel (high > anaerobic > low) — stuurt de copy. */
  bucket: InhaalBucket;
  /** De dagen ≥ vandaag die zouden wijzigen. */
  dagen: InhaalVoorstelDag[];
  /** Aanbod-copy (voorwaardelijk; claimt de daad niet). */
  regel: string;
}

/** Ruw engine-type → NL-weergavenaam via de intent-labels (één bron, geen eigen tabel). */
export function typeNaam(type: string | null): string {
  if (!type) return "geen training";
  return String(COACH_INTENT_LABEL_[intentFromType_(type)] ?? "Training");
}

const CATCHUP_BUCKET: Record<string, InhaalBucket> = {
  catchup_high: "high",
  catchup_anaerobic: "anaerobic",
  catchup_low: "low",
};

/**
 * buildInhaalVoorstel — diff tussen het ACTIEVE plan en een plan-met-inhaal.
 *
 * `voorgesteld` is een tweede `buildWeekProposal`-run met `planAdaptation: true`; die run is
 * UITSLUITEND voor dit voorstel en raakt het actieve plan niet.
 *
 * Poorten (null zodra er één blokkeert):
 *  - **M66** — bij band 'caution'/'rest' wint verlichten of loslaten van inhalen; dan geen
 *    inhaal-voorstel. Dat maakt inhaal en het verlicht-voorstel wederzijds exclusief.
 *  - **M64 + M65** — alleen een betekenisvol tekort telt, en kwaliteit gaat vóór volume: er
 *    moet minstens één `catchup_high` of `catchup_anaerobic` in de diff zitten. Een diff met
 *    uitsluitend `catchup_low` (duurvolume) levert geen voorstel — dat wordt gespreid of
 *    losgelaten, niet ingehaald.
 *  - **M73** — de REDEN-weging. Draagt ELKE niet-geleverde verstreken trainingsdag van deze
 *    week een rust-vragende reden (bewuste rust, of bewust iets anders gedaan), dan is er
 *    niets in te halen: dat was een keuze, geen gemis. Alleen tijdgebrek — of een dag zónder
 *    ingevulde reden — houdt het aanbod open. Grove WEEK-poort: alles-onderdrukt → geen
 *    voorstel; één open dag → het voorstel mag door.
 */
export function buildInhaalVoorstel(
  origineel: ProposalWeek,
  voorgesteld: ProposalWeek | null,
  band: "ready" | "caution" | "rest" | null,
  todayISO: string,
  redenCtx?: {
    plannerDays: readonly GedaanPlannerDay[];
    activities: readonly ActValuesRow[];
    dispositionByDate: Record<string, DispositionReason>;
  },
): InhaalVoorstel | null {
  if (!voorgesteld) return null;
  if (band === "caution" || band === "rest") return null; // M66

  // M73 — reden-weging over de niet-geleverde VERSTREKEN trainingsdagen.
  if (redenCtx) {
    const gedaan = derivePlannerGedaan(
      redenCtx.plannerDays,
      redenCtx.activities,
    );
    const nietGeleverd = redenCtx.plannerDays.filter(
      (d) => d.train && d.datum < todayISO && !gedaan.has(d.datum),
    );
    // Alleen onderdrukken als er ÉCHT zulke dagen zijn: een tekort dat uit te-licht
    // geleverde (dus wél gedane) dagen komt, valt buiten deze poort.
    if (nietGeleverd.length > 0) {
      const allesOnderdrukt = nietGeleverd.every((d) => {
        const r = redenCtx.dispositionByDate[d.datum];
        return r === "bewust_gerust" || r === "iets_anders";
      });
      if (allesOnderdrukt) return null;
    }
  }

  const originExtra = new Map<string, string | null>();
  for (const d of origineel.days) originExtra.set(d.datum, d.redenCode);

  const dagen: InhaalVoorstelDag[] = [];
  for (const d of voorgesteld.days) {
    if (d.datum < todayISO) continue;
    const code = d.redenCode ?? "";
    if (!CATCHUP_BUCKET[code]) continue;
    if (originExtra.get(d.datum) === code) continue; // stond er al → geen wijziging
    const from = origineel.days.find((o) => o.datum === d.datum) ?? null;
    dagen.push({
      datum: d.datum,
      fromType: from?.voorgesteldType ?? "",
      toType: d.voorgesteldType ?? "",
      fromNaam: typeNaam(from?.voorgesteldType ?? null),
      toNaam: typeNaam(d.voorgesteldType ?? null),
      redenCode: code,
    });
  }
  if (!dagen.length) return null;

  // M64/M65: kwaliteit moet erbij zitten; alleen duurvolume is geen inhaal-aanleiding.
  const buckets = dagen.map((d) => CATCHUP_BUCKET[d.redenCode]);
  const bucket: InhaalBucket | null = buckets.includes("high")
    ? "high"
    : buckets.includes("anaerobic")
      ? "anaerobic"
      : null;
  if (!bucket) return null;

  return { bucket, dagen, regel: inhaalAanbodRegel(bucket, dagen.length) };
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
    const hasSessions = sessions.length > 0;
    const isToday = d.datum === todayISO;
    const isDone = doneTss > 0;
    const dispositie = dispositionByDate[d.datum] ?? null;
    // STAP 1 (same-day-flip): een VOLTOOIDE activity wint van 'vandaag' → done-kaart, ook
    // vandaag (zoals GAS: readiness vervalt zodra er gereden is). isToday blijft apart voor
    // de dag-strip-markering. Vandaag zónder rit → 'today' (readiness + geplande workout).
    // 'gemist' (A2/A4): gedisponeerde dag mét voorstel en GEEN rit — NÁ done, VÓÓR today
    // (byte-exact GAS WebApp.gs:1143: disp && voorstel && !actual overschrijft, behalve done).
    const state: DayState = isDone
      ? "done"
      : dispositie && hasSessions
        ? "gemist"
        : isToday
          ? "today"
          : hasSessions
            ? "planned"
            : "rest";

    for (const s of sessions) {
      tss.gepland += s.tss;
      minuten.gepland += s.totaalMin;
    }
    // "Dagen"-noemer: tel elke dag met GEPLANDE trainingsduur > 0 (GAS-parity,
    // weekPlanSummary_ WebApp.gs:973: geplandDagen = weekplan-entries met minuten > 0; een
    // rustdag telt niet, een pendel/multi-sessie-dag is al één entry → telt 1). Bron-getrouw
    // over de HELE week: vooruit-dagen dragen hun duur in `sessions`, maar verstreken/gedane
    // dagen krijgen sessions=[] (assignWorkouts bouwt sessions alleen voor tePlannen) → val
    // daar terug op `plannedForDone`, anders krimpt de noemer terwijl de week vordert (5 → 1/4).
    // Conditie = duur > 0 (NIET louter `!= null`): een naar-rust-gezette dag (0 min) telt niet.
    const plannedMinDay = hasSessions
      ? sessions.reduce((sum, s) => sum + s.totaalMin, 0)
      : (d.plannedForDone?.totaalMin ?? 0);
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
    const plannedForCompare =
      d.plannedForDone ?? d.sessions[d.sessions.length - 1] ?? null;
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
): boolean {
  const entries = buildWeekplanEntries(proposalWeek, doel);
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
  /** FASE 2b — read-only inhaal-voorstel (null = geen voorstel of al goedgekeurd). */
  inhaal: InhaalVoorstel | null;
  /** FASE 3a — is het inhaal-plan voor DEZE week goedgekeurd? */
  optedIn: boolean;
  /** De maandag van de getoonde week (de sleutel van de goedkeuring). */
  weekMonday: string;
}> {
  const monday = weekMondayIso();
  const todayISO = todayIso();
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
    debtOptInWeek,
  ] = await Promise.all([
    getSettings(),
    getPlanner(monday),
    getEvents(),
    getActivities(),
    getWeekplans(monday),
    getWellness(),
    getRpe(),
    getDispositions(),
    getOverrides(),
    getCheckin(todayISO),
    getDebtOptIn(),
  ]);

  const activities = parseActivityRows(activitiesRes);
  // deriveReadiness is puur → veilig vóór buildWeekProposal berekenen; de holistische band stuurt
  // het plan-signaal (band-gedreven demote). Hergebruikt voor de return (niet 2× berekend).
  const readiness = deriveReadiness(wellness, checkin);

  // FASE 3a — per-week GOEDKEURING. `debtOptInWeek` is de maandag van de week waarvoor de
  // gebruiker akkoord gaf; hij telt alleen als hij de maandag van de GETOONDE week is, dus
  // de goedkeuring vervalt vanzelf zodra er een nieuwe week begint (M68 — geen stilzwijgend
  // doorlopende aanpassing, en geen opruim-job).
  const optedIn = debtOptInWeek === monday;

  // Het ACTIEVE plan. Niet-goedgekeurd → planAdaptation false, exact zoals vóór 3a
  // (byte-identiek). Goedgekeurd → het herverdeelde plan IS het plan voor deze week.
  const proposalWeek = buildWeekProposal({
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
    planAdaptation: optedIn,
  });

  // PLAN-VAN-RECORD (laag 1a): persisteer de week als GAS-blob. Fire-and-forget (zoals de
  // auto-sync) — een mislukte PUT mag het scherm nooit blokkeren. DEDUP: alleen schrijven als
  // de NIET-BEVROREN dagen (vandaag/toekomst) afwijken van wat er al ligt; het verleden
  // bevriest de worker toch. `weekplans` is het 8-weken-venster → sameForwardEntries filtert
  // zelf op datum, dus geen extra fetch.
  persistWeekplan(proposalWeek, settings?.doel ?? null, weekplans, todayISO);

  // FASE 2b — het INHAAL-VOORSTEL. Tweede weekplan-run met de deciders geforceerd aan
  // (`planAdaptation: true`), UITSLUITEND om te tonen wát er zou veranderen. Het actieve
  // `proposalWeek` hierboven is en blijft de originele run; deze tweede run wordt nergens
  // anders gebruikt en niet gepersisteerd.
  //
  // Optimalisatie + M66: bij band 'caution'/'rest' wint verlichten van inhalen, dus dan
  // blokkeert de poort toch — die dubbele berekening slaan we over.
  // Is de week al goedgekeurd, dan is er niets meer voor te stellen — het voorstel IS het
  // actieve plan. De wat-als-run draait dus alleen voor niet-goedgekeurde weken.
  const inhaalBandOk =
    !optedIn && readiness.band !== "caution" && readiness.band !== "rest";
  const voorgesteldeWeek = inhaalBandOk
    ? buildWeekProposal({
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
        planAdaptation: true,
      })
    : null;
  // disposition-per-datum (A2) voor de gemist-state-afleiding + GemistCard.
  const dispositionByDate: Record<string, DispositionReason> = {};
  for (const d of dispositions) {
    dispositionByDate[d.datum] = d.reason;
  }

  const inhaal = buildInhaalVoorstel(
    proposalWeek,
    voorgesteldeWeek,
    readiness.band,
    todayISO,
    { plannerDays, activities, dispositionByDate },
  );

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
    inhaal,
    optedIn,
    weekMonday: monday,
  };
}
