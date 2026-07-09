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
  zoneMinutes: Record<ZoneKey, number> | null;
  ifReal: number | null;
}

// ── Done-rit-afleidingen (fase 2a): PURE, getest ──────────────────────────
const DONE_BAR_HOOGTE: Record<ZoneKey, number> = {
  low: 45, // z2
  high: 85, // drempel
  anaerobic: 100, // anaeroob
};

/** Eén activity-rij → done-object (type idx1, naam idx2, duur idx3, IF idx7, tss idx8, reële zones uit idx15). */
export function buildDoneEntry(row: ActValuesRow): DoneEntry {
  const zm = actualZoneMinutes_(
    { icu_zone_times: zoneTimesFromCell_(row[15]) },
    null,
  ) as { low: number; high: number; anaerobic: number } | null;
  const rawIf = Number(row[7]);
  return {
    tss: Number(row[8]) || 0,
    minuten: Number(row[3]) || 0,
    type: String(row[1] ?? ""),
    naam: String(row[2] ?? ""),
    zoneMinutes: zm
      ? { low: zm.low, high: zm.high, anaerobic: zm.anaerobic }
      : null,
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
  return {
    tss: a.tss + b.tss,
    minuten: a.minuten + b.minuten,
    type: primary.type,
    naam: primary.naam,
    zoneMinutes,
    ifReal: primary.ifReal,
  };
}

/** De aanwezige reële zone-buckets (low→high→anaerobic). */
export function doneZones(zm: Record<ZoneKey, number> | null): ZoneKey[] {
  if (!zm) return [];
  return ZONE_ORDER.filter((z) => (zm[z] ?? 0) > 0);
}

/** 3-bucket reële zone-minuten → SessionBlok[] voor de done-ZoneBar (low→high→anaerobic). */
export function doneZoneBlokken(
  zm: Record<ZoneKey, number> | null,
): SessionBlok[] {
  if (!zm) return [];
  return doneZones(zm).map((z) => ({
    minuten: zm[z],
    hoogtePct: DONE_BAR_HOOGTE[z],
    color: ZONE_META[z].color,
  }));
}

/** NL-type-label van een gereden rit = de dominante reële zone (Duur/Drempel/VO2max); zonder zones → rauwe type of "Rit". */
export function doneLabel(done: DoneEntry): string {
  const zm = done.zoneMinutes;
  if (zm) {
    let best: ZoneKey | null = null;
    for (const z of ZONE_ORDER) {
      if ((zm[z] ?? 0) > 0 && (best == null || zm[z] > zm[best])) best = z;
    }
    if (best) return ZONE_META[best].label;
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

// Geplande blok-kleur (--zone-N, BAR_BUCKET) → zone-nummer; 3-bucket done (low/high/
// anaerobic) → representatieve zone (Z2/Z4/Z5 = de done-ZONE_META-kleuren, want het
// 3-bucket-model kent geen Z1/Z3 op de gedaan-kant).
const PLAN_COLOR_ZONE: Record<string, number> = {
  "var(--zone-1)": 1,
  "var(--zone-2)": 2,
  "var(--zone-3)": 3,
  "var(--zone-4)": 4,
  "var(--zone-5)": 5,
};
const DONE_ZONE_NUM: Record<ZoneKey, number> = {
  low: 2,
  high: 4,
  anaerobic: 5,
};

/**
 * Geplande blokken (SessionBlok[]) + reële done-zone-minuten → per-zone gepland-vs-gedaan
 * (Z1..Z5) voor de compare-bars. Gepland aggregeert de blok-kleuren; gedaan mapt de 3
 * engine-buckets op hun representatieve zone (low→Z2, high→Z4, anaerobic→Z5).
 */
export function zoneCompareRows(
  plannedBlokken: SessionBlok[],
  doneZm: Record<ZoneKey, number> | null,
): DoneCompareZone[] {
  const plan = [0, 0, 0, 0, 0, 0];
  for (const b of plannedBlokken) {
    const z = PLAN_COLOR_ZONE[b.color];
    if (z) plan[z] += b.minuten;
  }
  const done = [0, 0, 0, 0, 0, 0];
  if (doneZm) {
    for (const k of ZONE_ORDER) done[DONE_ZONE_NUM[k]] += doneZm[k] ?? 0;
  }
  return [1, 2, 3, 4, 5].map((z) => ({
    z,
    plan: Math.round(plan[z]),
    done: Math.round(done[z]),
  }));
}

// 3-bucket done-zones → de 5-bucket-vorm die coachFeedback_ leest (low→z2, high→drempel,
// anaerobic→anaeroob; rust/tempo bestaan niet in het 3-bucket-done-model).
function doneZm5_(
  zm: Record<ZoneKey, number> | null,
): Record<string, number> | undefined {
  if (!zm) return undefined;
  return {
    rust: 0,
    z2: zm.low,
    tempo: 0,
    drempel: zm.high,
    anaeroob: zm.anaerobic,
  };
}

/** Dominante reële zone → pill {zoneNum,label} (Duur/Drempel/VO2max) voor de reduced kaart; geen zones → null. */
export function doneBadge(
  done: DoneEntry,
): { zoneNum: number; label: string } | null {
  const zm = done.zoneMinutes;
  if (!zm) return null;
  let best: ZoneKey | null = null;
  for (const z of ZONE_ORDER) {
    if ((zm[z] ?? 0) > 0 && (best == null || zm[z] > zm[best])) best = z;
  }
  return best
    ? { zoneNum: DONE_ZONE_NUM[best], label: ZONE_META[best].label }
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
      zoneMin: doneZm5_(done.zoneMinutes),
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
    zones: zoneCompareRows(plannedSession.blokken, done.zoneMinutes),
  };
}

export interface SchemaView {
  weekMonday: string;
  /** NL macro-fase-label voor de periodisering-kaart (week-niveau). */
  macroFaseLabel: string;
  /** Rauwe macro-fase (Base/Build/Peak/…) — markeert de huidige fase in de sequentie-bar. */
  macroFase: string;
  eventNaam: string | null;
  wekenTotEvent: number | null;
  planModus: string | null;
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
    macroFaseLabel: macroFaseLabel(proposalWeek.macroFase),
    macroFase: proposalWeek.macroFase,
    eventNaam: proposalWeek.eventNaam,
    wekenTotEvent: proposalWeek.wekenTotEvent,
    planModus: proposalWeek.planModus,
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
