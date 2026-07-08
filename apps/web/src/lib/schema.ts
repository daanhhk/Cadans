import {
  actualZoneMinutes_,
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
  voorgesteldType: string | null;
  reden: string | null;
  sessions: SchemaSession[];
  doneTss: number;
  /** De gereden rit van die dag (of null) — voedt de VOLTOOID-kaart (fase 2a). */
  done: DoneEntry | null;
}

export interface LoadStat {
  gepland: number;
  gedaan: number;
}

/**
 * Gedane belasting per datum (uit de activities). tss idx8 + duur idx3; type idx1 + naam idx2 +
 * reële zone-minuten (idx15 via `actualZoneMinutes_`) voeden de VOLTOOID-kaart (fase 2a).
 */
export interface DoneEntry {
  tss: number;
  minuten: number;
  type: string;
  naam: string;
  zoneMinutes: Record<ZoneKey, number> | null;
}

// ── Done-rit-afleidingen (fase 2a): PURE, getest ──────────────────────────
const DONE_BAR_HOOGTE: Record<ZoneKey, number> = {
  low: 45, // z2
  high: 85, // drempel
  anaerobic: 100, // anaeroob
};

/** Eén activity-rij → done-object (type idx1, naam idx2, duur idx3, tss idx8, reële zones uit idx15). */
export function buildDoneEntry(row: ActValuesRow): DoneEntry {
  const zm = actualZoneMinutes_(
    { icu_zone_times: zoneTimesFromCell_(row[15]) },
    null,
  ) as { low: number; high: number; anaerobic: number } | null;
  return {
    tss: Number(row[8]) || 0,
    minuten: Number(row[3]) || 0,
    type: String(row[1] ?? ""),
    naam: String(row[2] ?? ""),
    zoneMinutes: zm
      ? { low: zm.low, high: zm.high, anaerobic: zm.anaerobic }
      : null,
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
  };
}

/** De aanwezige reële zone-buckets (low→high→anaerobic), voor de ZoneLegend. */
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
    const state: DayState = isToday
      ? "today"
      : isDone
        ? "done"
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

    return {
      datum: d.datum,
      dagIdx: d.dagIdx,
      weekday: WEEKDAYS[dt.getDay()] ?? "",
      dayNum: dt.getDate(),
      state,
      voorgesteldType: d.voorgesteldType,
      reden: d.reden,
      sessions,
      doneTss,
      done: done ?? null,
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
