/**
 * zones.ts — zone classification, TSS, workout-zone lookup, block scaling,
 * and the DSL/ZWO row parsers. Combed from training/src/Algorithm.gs (pure).
 */
import { ACT_ZONE_TIMES_IDX } from "./sync";
import { formatDate, stripTime_ } from "./utils";

// Activity-types die als fiets-volume tellen (incl. gravel/MTB).
export const CYCLING_TYPES = [
  "Ride",
  "VirtualRide",
  "GravelRide",
  "MountainBikeRide",
];

export function actualZoneMinutes_(activity: any, _zoneBoundaries: any): any {
  const p = tryPowerZoneTimes_(activity);
  if (p) {
    p.source = "power";
    return p;
  }
  const h = tryHrZoneTimes_(activity);
  if (h) {
    h.source = "hr";
    return h;
  }
  return null;
}

export function tryPowerZoneTimes_(activity: any): any {
  const zt = activity && activity.icu_zone_times;
  if (!zt || !Array.isArray(zt) || zt.length === 0) return null;
  const map: any = {
    Z1: "low",
    Z2: "low",
    Z3: "high",
    Z4: "high",
    Z5: "anaerobic",
    Z6: "anaerobic",
    Z7: "anaerobic",
  };
  const b: any = { low: 0, high: 0, anaerobic: 0 };
  let saw = false;
  for (let i = 0; i < zt.length; i++) {
    const z = zt[i];
    if (!z || typeof z.id !== "string") continue;
    const bk = map[z.id]; // 'SS' en overlays → undefined → skip
    if (!bk) continue;
    b[bk] += Number(z.secs) || 0;
    saw = true;
  }
  if (!saw) return null;
  return { low: b.low / 60, high: b.high / 60, anaerobic: b.anaerobic / 60 };
}

export function tryHrZoneTimes_(activity: any): any {
  const zt = activity && activity.icu_hr_zone_times;
  if (!zt || !Array.isArray(zt) || zt.length === 0) return null;
  const idxBucket = [
    "low",
    "low",
    "high",
    "high",
    "anaerobic",
    "anaerobic",
    "anaerobic",
  ];
  const b: any = { low: 0, high: 0, anaerobic: 0 };
  let saw = false;
  for (let i = 0; i < Math.min(zt.length, 7); i++) {
    const secs = Number(zt[i]) || 0;
    if (secs <= 0) continue;
    b[idxBucket[i] as string] += secs;
    saw = true;
  }
  if (!saw) return null;
  return { low: b.low / 60, high: b.high / 60, anaerobic: b.anaerobic / 60 };
}

/** Primaire load-focus bucket van een workout-type. */
export function typeBucket_(type: string, doel: string): string {
  const z = workoutZones(type, doel);
  if (z.indexOf("anaerobic") >= 0) return "anaerobic";
  if (z.indexOf("high") >= 0) return "high";
  return "low";
}

export function zoneTimesFromCell_(cellValue: any): any {
  if (cellValue == null) return null;
  const s = String(cellValue).trim();
  if (!s) return null;
  let arr: any;
  try {
    arr = JSON.parse(s);
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr;
}

export function zoneActsByDateFromTab_(actValues: any): any {
  const byDate: any = {};
  if (!actValues || !actValues.length) return byDate;
  actValues.forEach((r: any) => {
    if (!(r[0] instanceof Date)) return; // idx0 = Datum
    if (CYCLING_TYPES.indexOf(String(r[1] || "")) < 0) return; // idx1 = Type, alleen fiets
    const key = formatDate(stripTime_(r[0]), "yyyy-MM-dd");
    (byDate[key] = byDate[key] || []).push({
      type: r[1],
      start_date_local: r[0],
      icu_zone_times: zoneTimesFromCell_(r[ACT_ZONE_TIMES_IDX]),
    });
  });
  return byDate;
}

export function scaleBlocksToFit_(
  blocks: any,
  mins: number,
  warm: number,
  cool: number,
): any {
  if (!mins || mins <= 0) return blocks;
  function mainDur(bs: any): number {
    let t = 0;
    bs.forEach((b: any) => {
      if (b.kind === "int") {
        const on = b.onMin != null ? b.onMin : b.onSec / 60;
        const off = b.offMin != null ? b.offMin : b.offSec / 60;
        t += b.reps * (on + off);
      } else {
        t += b.durMin;
      }
    });
    return t;
  }
  const target = mins - warm - cool;
  if (target <= 0) return blocks;
  if (mainDur(blocks) <= target) return blocks;
  const out = blocks.map((b: any) => {
    const c: any = {};
    for (const k in b) c[k] = b[k];
    return c;
  });
  const factor = target / mainDur(out);
  out.forEach((b: any) => {
    if (b.kind === "int") {
      const on = b.onMin != null ? b.onMin : b.onSec / 60;
      const floorReps = Math.min(b.reps, on >= 8 ? 2 : 3);
      b.reps = Math.max(floorReps, Math.round(b.reps * factor));
    } else {
      b.durMin = Math.max(
        b.minMin != null ? b.minMin : 10,
        Math.round(b.durMin * factor),
      );
    }
  });
  let guard = 0;
  while (mainDur(out) > target && guard++ < 50) {
    let pick: any = null,
      pickDur = -1;
    out.forEach((b: any) => {
      if (b.kind !== "int") return;
      const on = b.onMin != null ? b.onMin : b.onSec / 60;
      const floorReps = Math.min(b.reps, on >= 8 ? 2 : 3);
      if (b.reps > floorReps) {
        const off = b.offMin != null ? b.offMin : b.offSec / 60;
        const dur = b.reps * (on + off);
        if (dur > pickDur) {
          pickDur = dur;
          pick = b;
        }
      }
    });
    if (!pick) break;
    pick.reps -= 1;
  }
  if (mainDur(out) > target) {
    const f2 = target / mainDur(out); // < 1
    out.forEach((b: any) => {
      if (b.kind === "int") {
        if (b.onMin != null) {
          b.onMin = Math.max(5, Math.round(b.onMin * f2));
          if (b.offMin != null)
            b.offMin = Math.max(2, Math.round(b.offMin * f2));
        }
      } else {
        b.durMin = Math.max(
          b.minMin != null ? b.minMin : 8,
          Math.round(b.durMin * f2),
        );
      }
    });
  }
  return out;
}

/** %FTP → zone-bucket (5-bucket): rust <56 / z2 56-75 / tempo 76-90 / drempel 91-105 / anaeroob >105. */
export function pctZoneBucket_(pct: any): string {
  pct = Number(pct) || 0;
  if (pct < 56) return "rust";
  if (pct <= 75) return "z2";
  if (pct <= 90) return "tempo";
  if (pct <= 105) return "drempel";
  return "anaeroob";
}

/** Zone-gewogen TSS — ENIGE bron van de per-zone-rates. buckets in MINUTEN. */
export function tssFromZoneMinutes_(buckets: any): number {
  buckets = buckets || {};
  const low = buckets.low || 0,
    high = buckets.high || 0,
    anaerobic = buckets.anaerobic || 0;
  return Math.round(low * 0.7 + high * 0.95 + anaerobic * 1.05);
}

/** Lookup: welke load-focus zones dekt deze workout? (low/high/anaerobic) */
export function workoutZones(type: string, doel: string): string[] {
  if (!type) return [];
  if (type === "taper_z2_kort") return ["low"];
  if (type === "tour_taper_z2") return ["low"];
  if (type === "taper_openers") return ["anaerobic"];
  if (type === "vo2_hill_repeats" || type === "anaerobic_capacity")
    return ["anaerobic"];
  if (type === "threshold_long" || type === "sweet_spot_long") return ["high"];
  if (
    type === "long_z2" ||
    type === "recovery" ||
    type === "pendel_z2" ||
    type === "fatox"
  )
    return ["low"];
  if (
    type === "sweet_spot" ||
    type === "threshold" ||
    type === "tempo" ||
    type === "klim" ||
    type === "conditie" ||
    type === "ss_lang" ||
    type === "low_cad" ||
    type === "big_gear" ||
    type === "bergsim"
  )
    return ["high"];
  if (
    type === "vo2max" ||
    type === "vo2_short" ||
    type === "vo2_medium" ||
    type === "vo2_long" ||
    type === "vo2_3015" ||
    type === "microbursts"
  )
    return ["anaerobic"];
  if (type === "pendel_trip_intervals") return ["low", "high"];
  if (type.indexOf("pendel_") === 0) {
    if (doel === "VO2max") return ["low", "anaerobic"];
    return ["low", "high"];
  }
  if (type === "combo_long_with_efforts") return ["low", "high"];
  if (type === "combo_z2_tempo") return ["low", "high"];
  if (type === "combo_z2_vo2") return ["low", "anaerobic"];
  if (type === "combo_ss_sprints") return ["high", "anaerobic"];
  if (type === "combo_all_three") return ["low", "high", "anaerobic"];
  if (type === "test") {
    if (doel === "FTP" || doel === "Beklimmingen") return ["high"];
    if (doel === "VO2max") return ["anaerobic"];
    return ["low", "high"];
  }
  return [];
}

// ── DSL row parsers (ftp passed in — pure) ──────────────────────────
export function dslBlockFromRow_(row: any, ftp: number): any {
  const name = String(row[0] || "");
  const durStr = String(row[1] || "");
  const powStr = String(row[2] || "");
  const note = String(row[4] || "");

  const repMatch = /^\s*(\d+)\s*x\s*(\d+)\s*(min|sec|s)\b/i.exec(durStr);
  if (repMatch) {
    const reps = parseInt(repMatch[1] as string, 10);
    const workDur = parseInt(repMatch[2] as string, 10);
    const workUnit = /min/i.test(repMatch[3] as string) ? "m" : "s";
    const workPct = dslMidPct_(powStr, ftp);
    if (workPct == null) return null;

    const lines = [`${reps}x`, `- ${workDur}${workUnit} ${workPct}%`];

    const rest = dslRestFromNote_(note);
    if (rest && rest.duration > 0) {
      const restUnit =
        rest.duration >= 60 && rest.duration % 60 === 0 ? "m" : "s";
      const restDur = restUnit === "m" ? rest.duration / 60 : rest.duration;
      lines.push(`- ${restDur}${restUnit} ${rest.pct}%`);
    }
    return lines.join("\n");
  }

  const seconds = dslDurationSec_(durStr);
  if (!seconds) return null;
  const durTxt = seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`;

  const isWarmup = /warm[ -]?up|inrijden|opbouw/i.test(`${name} ${note}`);
  const isCooldown = /cool[ -]?down|uitrijden|easy uit/i.test(
    `${name} ${note}`,
  );
  const label = isWarmup ? " Warmup" : isCooldown ? " Cooldown" : "";

  const rng = dslPowerRange_(powStr, ftp);
  if (!rng) return null;

  if (isWarmup && rng.lo !== rng.hi) {
    return `- ${durTxt} ${rng.lo}-${rng.hi}%${label}`;
  }
  return `- ${durTxt} ${rng.mid}%${label}`;
}

export function dslPowerRange_(powStr: any, ftp: number): any {
  if (!powStr || powStr === "—") return null;
  const rangeMatch = /(\d+)\s*[-–]\s*(\d+)\s*W/i.exec(powStr);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1] as string, 10);
    const hi = parseInt(rangeMatch[2] as string, 10);
    return {
      lo: Math.round((lo / ftp) * 100),
      hi: Math.round((hi / ftp) * 100),
      mid: Math.round(((lo + hi) / 2 / ftp) * 100),
    };
  }
  const singleMatch = />?\s*(\d+)\s*W/i.exec(powStr);
  if (singleMatch) {
    const w = parseInt(singleMatch[1] as string, 10);
    const p = Math.round((w / ftp) * 100);
    return { lo: p, hi: p, mid: p };
  }
  return null;
}

export function dslMidPct_(powStr: any, ftp: number): any {
  const r = dslPowerRange_(powStr, ftp);
  return r ? r.mid : null;
}

export function dslDurationSec_(str: any): number {
  if (!str) return 0;
  const m = /(\d+)\s*min/i.exec(str);
  if (m) return parseInt(m[1] as string, 10) * 60;
  const s = /(\d+)\s*(?:sec|s)\b/i.exec(str);
  if (s) return parseInt(s[1] as string, 10);
  return 0;
}

export function dslRestFromNote_(note: any): any {
  if (!note) return null;
  const m = /(\d+)\s*(min|sec|s)\s+(rust|pauze|recovery)/i.exec(note);
  if (!m) return null;
  const val = parseInt(m[1] as string, 10);
  const seconds = /min/i.test(m[2] as string) ? val * 60 : val;
  const pctMatch = /@\s*(\d+)\s*%/i.exec(note);
  return {
    duration: seconds,
    pct: pctMatch ? parseInt(pctMatch[1] as string, 10) : 50,
  };
}

// ── ZWO step builders (pure leaf helpers) ───────────────────────────
export function zwoStepFromRow_(row: any, ftp: number): any {
  const name = String(row[0] || "");
  const durStr = String(row[1] || "");
  const powStr = String(row[2] || "");
  const note = String(row[4] || "");

  const repMatch = /^\s*(\d+)\s*x\s*(\d+)\s*(min|sec|s)\b/i.exec(durStr);
  if (repMatch) {
    const reps = parseInt(repMatch[1] as string, 10);
    const workDur = parseInt(repMatch[2] as string, 10);
    const workSec = /min/i.test(repMatch[3] as string) ? workDur * 60 : workDur;
    const workRange = dslPowerRange_(powStr, ftp);
    if (!workRange) return null;

    const rest = dslRestFromNote_(note);
    const restSec = rest ? rest.duration : 0;
    const restPct = rest ? rest.pct : 50;

    return `<IntervalsT Repeat="${reps}" OnDuration="${workSec}" OnPower="${zwoPct_(workRange.mid)}" OffDuration="${restSec}" OffPower="${zwoPct_(restPct)}"/>`;
  }

  const seconds = dslDurationSec_(durStr);
  if (!seconds) return null;
  const rng = dslPowerRange_(powStr, ftp);
  if (!rng) return null;

  const isWarmup = /warm[ -]?up|inrijden|opbouw/i.test(`${name} ${note}`);
  const isCooldown = /cool[ -]?down|uitrijden|easy uit/i.test(
    `${name} ${note}`,
  );

  if (isWarmup) {
    let lo = rng.lo;
    const hi = rng.hi;
    if (lo === hi) lo = Math.max(40, hi - 20);
    return `<Warmup Duration="${seconds}" PowerLow="${zwoPct_(lo)}" PowerHigh="${zwoPct_(hi)}"/>`;
  }
  if (isCooldown) {
    const clo = rng.lo;
    let chi = rng.hi;
    if (clo === chi) chi = clo;
    return `<Cooldown Duration="${seconds}" PowerLow="${zwoPct_(clo)}" PowerHigh="${zwoPct_(chi)}"/>`;
  }

  return `<SteadyState Duration="${seconds}" Power="${zwoPct_(rng.mid)}"/>`;
}

export function zwoPct_(pct: number): string {
  return (pct / 100).toFixed(2);
}

export function xmlEscape_(s: any): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── FASE-C C1 — workout-ASSEMBLER-WRAPPERS (byte-faithful port van GAS @ 3e8090a) ──
// Itereren over `workout.structuur` (5-tuples [label, duur, watt-range, hr-range, note]) en
// bouwen de ZWO-XML / DSL / plain-text-description die intervals.icu → structured FIT verwacht.
// ENIGE bewuste GAS-afwijking: `ftp` komt als PARAMETER binnen (GAS las `getDocProp('ftp','275')`);
// pure dependency-injection, geen logica-wijziging. De naam-tag is `<name>` — exact zoals de GAS-bron
// (Algorithm.gs:1742), NIET `<n>`.

/** ZWO-XML (primary push-format). null → één rij niet parsebaar → caller valt terug op DSL. */
export function buildWorkoutZwo_(workout: any, ftp: number): string | null {
  if (
    !workout ||
    !Array.isArray(workout.structuur) ||
    !workout.structuur.length
  )
    return null;

  const stepXmls: string[] = [];
  for (let i = 0; i < workout.structuur.length; i++) {
    const xml = zwoStepFromRow_(workout.structuur[i], ftp);
    if (!xml) return null; // GAS-parity: terugval op DSL
    stepXmls.push(xml);
  }

  const name = xmlEscape_(workout.naam || "Workout");
  const desc = xmlEscape_(workout.focus || workout.eindopmerking || "");

  return [
    "<workout_file>",
    "  <author>Coach</author>",
    "  <name>" + name + "</name>",
    "  <description>" + desc + "</description>",
    "  <sportType>bike</sportType>",
    "  <tags/>",
    "  <workout>",
    "    " + stepXmls.join("\n    "),
    "  </workout>",
    "</workout_file>",
  ].join("\n");
}

/** DSL-string (fallback in de event-description als ZWO faalt). null → één blok niet parsebaar. */
export function buildWorkoutDsl_(workout: any, ftp: number): string | null {
  if (
    !workout ||
    !Array.isArray(workout.structuur) ||
    !workout.structuur.length
  )
    return null;

  const blocks: string[] = [];
  for (let i = 0; i < workout.structuur.length; i++) {
    const block = dslBlockFromRow_(workout.structuur[i], ftp);
    if (!block) return null; // GAS-parity: terugval op description-only
    blocks.push(block);
  }

  // Blocks gescheiden door dubbele newline — sluit ook impliciet repeat-blokken.
  return blocks.join("\n\n");
}

/** Plain-text-description (laatste fallback). Levert ALTIJD een string (kop-regel + segmenten). */
export function buildWorkoutDescription_(workout: any): string {
  const lines: string[] = [];
  lines.push(
    workout.naam +
      " — " +
      (workout.totaalMin || "?") +
      "min" +
      (workout.tss ? " (TSS " + workout.tss + ")" : ""),
  );
  if (workout.focus) lines.push("Focus: " + workout.focus);
  lines.push("");

  if (Array.isArray(workout.structuur)) {
    workout.structuur.forEach((seg: any) => {
      // seg = [Segment, Duur, Vermogen, Hartslag, Toelichting]
      const label = seg[0] || "";
      const dur = seg[1] || "";
      const pow = seg[2] || "";
      lines.push(label + " " + dur + (pow ? " @ " + pow : ""));
    });
  }

  if (workout.eindopmerking) {
    lines.push("");
    const note = String(workout.eindopmerking);
    lines.push(note.length > 200 ? note.substring(0, 197) + "..." : note);
  }

  return lines.join("\n");
}
