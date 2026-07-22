import type { RideStreams } from "@cadans/shared";

// RITDETAILS fase 2 — PURE, DOM-loze client-helpers voor de ritdetail-popup (testbaar zoals
// silhouetSegments): (1) de klasse-badge uit de IF, byte-exacte port van GAS intentFromIF_ +
// cfNormIf_ (Coach.gs:15/55) + de intent→zone/label-maps (COACH_INTENT_ZONE_ /
// COACH_INTENT_LABEL_, Coach.gs:42-43); (2) de hand-SVG-geometrie voor de watts/HR-grafiek.

/** IF-percentage/ratio → { zoneNum, label } (klasse-badge). Byte-exact GAS intentFromIF_ +
 * cfNormIf_: normaliseer >3 → /100; null → Training(2) · <0.70 Duur(2) · <0.80 Tempo(3) ·
 * <0.88 Sweet Spot(4) · <0.95 Drempel(4) · >=0.95 VO2max(5). Herstel/Vrije rit zijn via IF
 * onbereikbaar. */
export function rideBadgeFromIf(ifPct: number | null): {
  zoneNum: number;
  label: string;
} {
  const ifNorm = ifPct == null ? null : ifPct > 3 ? ifPct / 100 : ifPct;
  if (ifNorm == null) return { zoneNum: 2, label: "Training" };
  if (ifNorm < 0.7) return { zoneNum: 2, label: "Duur" };
  if (ifNorm < 0.8) return { zoneNum: 3, label: "Tempo" };
  if (ifNorm < 0.88) return { zoneNum: 4, label: "Sweet Spot" };
  if (ifNorm < 0.95) return { zoneNum: 4, label: "Drempel" };
  return { zoneNum: 5, label: "VO2max" };
}

export interface RideChartOpts {
  width: number;
  height: number;
  padTop: number;
  padBottom: number;
  padLeft: number;
  padRight: number;
}

export interface RideChartGeometry {
  wattsSegments: string[]; // elk = SVG points-string "x,y x,y …"; nieuw segment na elke null
  hrSegments: string[];
  maxWatts: number; // linker-as bovengrens (0..maxWatts)
  minHr: number; // rechter-as ondergrens
  maxHr: number; // rechter-as bovengrens
  xTicks: { x: number; label: string }[];
  // Plot-rechthoek + tijd-as (viewBox-coördinaten) — de component mapt hiermee pointer↔data.
  plotLeft: number;
  plotWidth: number;
  plotTop: number;
  plotHeight: number;
  t0: number;
  span: number;
}

/** Index van de sample waarvan t[i] het dichtst bij targetT ligt (lineaire scan); leeg → -1. */
export function nearestSampleIndex(t: number[], targetT: number): number {
  if (t.length === 0) return -1;
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < t.length; i++) {
    const ti = t[i];
    if (ti == null) continue;
    const d = Math.abs(ti - targetT);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** intervals.icu-zone → onze NL zone-naam (exact DONE5_META in schema.ts): 1 Herstel · 2 Duur ·
 * 3 Tempo · 4 Drempel · 5/6/7 VO2max; null of buiten 1..7 → "—". */
export function intervalZoneName(zone: number | null): string {
  switch (zone) {
    case 1:
      return "Herstel";
    case 2:
      return "Duur";
    case 3:
      return "Tempo";
    case 4:
      return "Drempel";
    case 5:
    case 6:
    case 7:
      return "VO2max";
    default:
      return "—";
  }
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** Elapsed seconden → "m:ss" (rit < 1u) of "h:mm" (langer). */
export function secToClock(sec: number, hourMode: boolean): string {
  const s = Math.max(0, Math.round(sec));
  if (hourMode) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}:${String(m).padStart(2, "0")}`;
  }
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

/** Bouw de losse polyline-segmenten: één punt per index (x=xOf(t), y=yOf(v)); bij elke null
 * (of null-tijd) breekt de lijn af (nieuw segment) — NIET interpoleren over gaten. */
function buildSegments_(
  t: number[],
  vals: (number | null)[],
  xOf: (tt: number) => number,
  yOf: (v: number) => number,
): string[] {
  const segs: string[] = [];
  let cur: string[] = [];
  const n = Math.min(t.length, vals.length);
  for (let i = 0; i < n; i++) {
    const v = vals[i];
    const tt = t[i];
    if (v == null || tt == null) {
      if (cur.length) {
        segs.push(cur.join(" "));
        cur = [];
      }
      continue;
    }
    cur.push(`${round1(xOf(tt))},${round1(yOf(v))}`);
  }
  if (cur.length) segs.push(cur.join(" "));
  return segs;
}

/**
 * Pure SVG-geometrie voor de vermogens/HR-curve. Watts geschaald 0..maxWatts (linker-as),
 * HR geschaald minHr..maxHr (rechter-as), x = tijd (seconden) lineair over de breedte.
 * Onderbroken lijn bij null-gaten. Lege/volledig-null serie → lege segments-arrays.
 */
export function rideChartGeometry(
  streams: RideStreams | null,
  opts: RideChartOpts,
): RideChartGeometry {
  const empty: RideChartGeometry = {
    wattsSegments: [],
    hrSegments: [],
    maxWatts: 0,
    minHr: 0,
    maxHr: 0,
    xTicks: [],
    plotLeft: 0,
    plotWidth: 0,
    plotTop: 0,
    plotHeight: 0,
    t0: 0,
    span: 0,
  };
  if (!streams) return empty;
  const t = streams.t ?? [];
  const watts = streams.watts ?? [];
  const hr = streams.hr ?? [];
  const n = t.length;
  if (n === 0) return empty;

  const plotW = opts.width - opts.padLeft - opts.padRight;
  const plotH = opts.height - opts.padTop - opts.padBottom;
  const t0 = t[0] ?? 0;
  const tN = t[n - 1] ?? t0;
  const span = tN - t0;
  const xOf = (tt: number): number =>
    span > 0 ? opts.padLeft + ((tt - t0) / span) * plotW : opts.padLeft;

  // Watts-as: 0..nette bovengrens (op 50 afgerond).
  const wVals = watts.filter((v): v is number => v != null);
  const rawMaxW = wVals.length ? Math.max(...wVals) : 0;
  const maxWatts = rawMaxW > 0 ? Math.ceil(rawMaxW / 50) * 50 : 0;
  const yWatts = (v: number): number =>
    opts.padTop + plotH - (v / maxWatts) * plotH;
  const wattsSegments =
    maxWatts > 0 ? buildSegments_(t, watts, xOf, yWatts) : [];

  // HR-as: nette min..max (op 10 afgerond).
  const hVals = hr.filter((v): v is number => v != null);
  let minHr = 0;
  let maxHr = 0;
  let hrSegments: string[] = [];
  if (hVals.length) {
    minHr = Math.floor(Math.min(...hVals) / 10) * 10;
    maxHr = Math.ceil(Math.max(...hVals) / 10) * 10;
    if (maxHr <= minHr) maxHr = minHr + 10;
    const yHr = (v: number): number =>
      opts.padTop + plotH - ((v - minHr) / (maxHr - minHr)) * plotH;
    hrSegments = buildSegments_(t, hr, xOf, yHr);
  }

  // ~5 x-ticks (0..4), label m:ss (< 1u) of h:mm.
  const hourMode = span >= 3600;
  const TICKS = 4;
  const xTicks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const tt = t0 + (span * i) / TICKS;
    return { x: round1(xOf(tt)), label: secToClock(tt - t0, hourMode) };
  });

  return {
    wattsSegments,
    hrSegments,
    maxWatts,
    minHr,
    maxHr,
    xTicks,
    plotLeft: opts.padLeft,
    plotWidth: plotW,
    plotTop: opts.padTop,
    plotHeight: plotH,
    t0,
    span,
  };
}
