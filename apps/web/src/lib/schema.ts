import { parseLocalDate } from "./dates";
import type { ProposalWeek, ProposalWorkout } from "./proposal";

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

export interface SchemaView {
  weekMonday: string;
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
  return {
    naam: String(w.naam ?? ""),
    focus: typeof w.focus === "string" ? w.focus : null,
    zones: ZONE_ORDER.filter((z) => zones.includes(z)),
    totaalMin: Number(w.totaalMin) || 0,
    tss: Number(w.tss) || 0,
    structuur,
    eindopmerking: typeof w.eindopmerking === "string" ? w.eindopmerking : null,
  };
}

/** ProposalWeek + gedane-TSS-per-datum → het Schema-view-model (puur). */
export function deriveSchemaView(
  proposalWeek: ProposalWeek,
  doneTssByDate: Record<string, number>,
  todayISO: string,
): SchemaView {
  const tss: LoadStat = { gepland: 0, gedaan: 0 };
  const minuten: LoadStat = { gepland: 0, gedaan: 0 };
  const dagen: LoadStat = { gepland: 0, gedaan: 0 };

  const days: SchemaDay[] = proposalWeek.days.map((d) => {
    const sessions = d.sessions.map(toSession);
    const doneTss = doneTssByDate[d.datum] ?? 0;
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

  // NB: gedaan-minuten is NIET af te leiden uit doneTssByDate (alleen TSS) → 0 tot een
  // done-minuten-bron bestaat (stap 3). Voor de verse week is alles 0.
  return {
    weekMonday: proposalWeek.weekMonday,
    todayISO,
    days,
    tss,
    minuten,
    dagen,
  };
}
