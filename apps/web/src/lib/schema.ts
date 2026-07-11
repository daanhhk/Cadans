import {
  actualZoneMinutes_,
  coachFeedback_,
  formatDate,
  stripTime_,
  zoneTimesFromCell_,
} from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { type ActValuesRow, parseActivityRows } from "./activities";
import {
  getActivities,
  getCheckin,
  getEvents,
  getPlanner,
  getRpe,
  getSettings,
  getWeekplans,
  getWellness,
} from "./api";
import { parseLocalDate, todayIso, weekMondayIso } from "./dates";
import {
  buildWeekProposal,
  type ProposalWeek,
  type ProposalWorkout,
} from "./proposal";
import { deriveReadiness, type ReadinessResult } from "./readiness";
import { presetHoursLabel } from "./settings";

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
// Gerichte, end-anchored strip met ALLEEN bekende fase-tokens — "ingekort" blijft,
// lege haakjes verdwijnen. GEEN globale replace (voorkomt false positives).
const FASE_SUFFIX_RE = new RegExp(
  `\\s*\\((?:${Object.keys(MACRO_FASE_NL).join("|")})(,\\s*ingekort)?\\)\\s*$`,
);
export function stripFaseSuffix(naam: string): string {
  return naam.replace(FASE_SUFFIX_RE, (_m, ingekort) =>
    ingekort ? " (ingekort)" : "",
  );
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

export type DayState = "today" | "done" | "planned" | "rest";

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
  sessions: SchemaSession[];
  doneTss: number;
  /** De gereden rit van die dag (of null) — voedt de VOLTOOID-kaart (fase 2a). */
  done: DoneEntry | null;
  /** Plan-vs-gedaan-vergelijking als er een geplande sessie was; null → gereduceerde kaart (2b-2). */
  doneCompare: DoneCompare | null;
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
export function buildDoneCompare(
  done: DoneEntry,
  plannedWo: ProposalWorkout | null,
  voorgesteldType: string | null,
  macroFase: string,
): DoneCompare | null {
  if (!plannedWo || !voorgesteldType) return null;
  const plannedSession = toSession(plannedWo);
  const fb = coachFeedback_(
    {
      type: voorgesteldType,
      titel: plannedWo.naam,
      duurMin: plannedSession.totaalMin,
      tss: plannedSession.tss,
      segmenten: null,
    },
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
  return {
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
}

function toSession(w: ProposalWorkout): SchemaSession {
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
export function deriveSchemaView(
  proposalWeek: ProposalWeek,
  doneByDate: Record<string, DoneEntry>,
  todayISO: string,
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
    // STAP 1 (same-day-flip): een VOLTOOIDE activity wint van 'vandaag' → done-kaart, ook
    // vandaag (zoals GAS: readiness vervalt zodra er gereden is). isToday blijft apart voor
    // de dag-strip-markering. Vandaag zónder rit → 'today' (readiness + geplande workout).
    const state: DayState = isDone
      ? "done"
      : isToday
        ? "today"
        : hasSessions
          ? "planned"
          : "rest";

    for (const s of sessions) {
      tss.gepland += s.tss;
      minuten.gepland += s.totaalMin;
    }
    if (hasSessions) dagen.gepland += 1;
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
    const doneCompare =
      isDone && done
        ? buildDoneCompare(
            done,
            plannedForCompare,
            d.voorgesteldType,
            proposalWeek.macroFase,
          )
        : null;

    return {
      datum: d.datum,
      dagIdx: d.dagIdx,
      weekday: WEEKDAYS[dt.getDay()] ?? "",
      dayNum: dt.getDate(),
      state,
      isToday,
      voorgesteldType: d.voorgesteldType,
      reden: d.reden,
      sessions,
      doneTss,
      done: done ?? null,
      doneCompare,
    };
  });

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
  };
}

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
    checkin,
  ] = await Promise.all([
    getSettings(),
    getPlanner(monday),
    getEvents(),
    getActivities(),
    getWeekplans(monday),
    getWellness(),
    getRpe(),
    getCheckin(todayISO),
  ]);

  const activities = parseActivityRows(activitiesRes);
  const proposalWeek = buildWeekProposal({
    settings: settings ?? EMPTY_SETTINGS,
    plannerDays,
    events,
    activities,
    weekplans,
    wellness,
    rpe,
    todayISO,
  });

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

  const readiness = deriveReadiness(wellness, checkin);
  return { proposalWeek, doneByDate, readiness, todayISO };
}
