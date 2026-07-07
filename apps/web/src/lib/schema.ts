import { formatDate, stripTime_ } from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { parseActivityRows } from "./activities";
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

export interface SchemaSession {
  naam: string;
  focus: string | null;
  zones: ZoneKey[];
  totaalMin: number;
  tss: number;
  /** 5-tuples [label, dur, watt-range, hr-range, note] uit de engine. */
  structuur: string[][];
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
}

export interface LoadStat {
  gepland: number;
  gedaan: number;
}

/** Gedane belasting per datum (uit de activities: TSS idx8 + duur idx3-minuten). */
export interface DoneEntry {
  tss: number;
  minuten: number;
}

export interface SchemaView {
  weekMonday: string;
  /** NL macro-fase-label voor de tab-kopregel (week-niveau). */
  macroFaseLabel: string;
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
  const orderedZones = ZONE_ORDER.filter((z) => zones.includes(z));
  // Chip-dedup: de zone-pill (ZoneBar) is de canonieke plek voor het zone-woord.
  // Onderdruk de focus-subtitel als die (na NL-mapping) een woord toont dat een
  // zone-pill al toont; proza-focus (bv. "lactate clearance") blijft staan.
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
    };
  });

  return {
    weekMonday: proposalWeek.weekMonday,
    macroFaseLabel: macroFaseLabel(proposalWeek.macroFase),
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
    const e = doneByDate[key] ?? { tss: 0, minuten: 0 };
    e.tss += Number(row[8]) || 0; // idx8 = TSS
    e.minuten += Number(row[3]) || 0; // idx3 = Duur (min)
    doneByDate[key] = e;
  }

  const readiness = deriveReadiness(wellness, checkin);
  return { proposalWeek, doneByDate, readiness, todayISO };
}
