/**
 * readiness.ts — readiness score + check-in nudge (port of the pure readiness
 * seam in training/src/Algorithm.gs).
 *
 * DATA-IN lifts (storage-port): getReadinessScore_ no longer auto-reads
 * getFormScore_/getWellnessSignal/dashVormReeks_ (the caller passes fs/wellness/
 * reeks) nor getTodayCheckin_ (a DocProp) — the check-in arrives as the 4th
 * parameter `checkin` (default null). The SelfTest always passes fs/wellness/reeks
 * and no check-in, so behaviour is identical to the GAS original.
 */

export const READINESS_PRESETS: any = {
  objectief: { vormTrend: 0.3, belasting: 0.3, hrv: 0.25, slaap: 0.15 }, // som 1,00
  gebalanceerd: null,
  subjectief: null,
};

export function rdyClamp_(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Lineaire normalisatie v∈[lo,hi] → [0,100], geklemd. null → null. */
export function rdyLerp_(v: any, lo: number, hi: number): any {
  if (v == null) return null;
  return rdyClamp_(((v - lo) / (hi - lo)) * 100);
}

/** Decimale uren → "Xu YY" (7,33 → "7u20"). */
export function rdyUren_(h: number): string {
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    hh++;
    mm = 0;
  }
  return `${hh}u${mm < 10 ? `0${mm}` : mm}`;
}

export const CHECKIN_LEVELS: any = {
  slaap: { goed: 2, matig: 0, slecht: -2 },
  benen: { fris: 2, normaal: 0, zwaar: -2 },
  stress: { laag: 2, normaal: 0, hoog: -2 },
};
export const CHECKIN_QUESTIONS: any[] = [
  { key: "slaap", label: "Slaap", opts: ["goed", "matig", "slecht"] },
  { key: "benen", label: "Benen", opts: ["fris", "normaal", "zwaar"] },
  { key: "stress", label: "Stress", opts: ["laag", "normaal", "hoog"] },
];

/** Som van de drie deltas, geklemd op −6..+6. Onbekend niveau → 0. */
export function checkinDelta_(checkin: any): number {
  if (!checkin) return 0;
  let d = 0;
  ["slaap", "benen", "stress"].forEach((k) => {
    const v = CHECKIN_LEVELS[k] ? CHECKIN_LEVELS[k][checkin[k]] : undefined;
    if (typeof v === "number") d += v;
  });
  return Math.max(-6, Math.min(6, d));
}

/** Leesbare samenvatting "Slaap goed · Benen oké · Stress laag". */
export function checkinSummary_(checkin: any): string {
  if (!checkin) return "";
  return CHECKIN_QUESTIONS.map(
    (q) => `${q.label} ${checkin[q.key] || "?"}`,
  ).join(" · ");
}

export function getReadinessScore_(
  fs: any,
  wellness: any,
  reeks: any,
  checkin?: any,
): any {
  const W = READINESS_PRESETS.objectief;
  fs = fs || {};
  wellness = wellness || {};
  checkin = checkin || null;

  // factor 1 — vorm-trend
  const form = fs.form != null ? fs.form : null;
  let vtSub = rdyLerp_(form, -30, 10);
  let vtText = "–";
  if (vtSub != null && reeks && reeks.length >= 2) {
    const vs = reeks.filter((r: any) => r.vorm != null);
    if (vs.length >= 2) {
      const span = Math.min(7, vs.length - 1);
      const delta = vs[vs.length - 1].vorm - vs[vs.length - 1 - span].vorm;
      vtSub = rdyClamp_(vtSub + Math.max(-10, Math.min(10, delta)));
      vtText = delta > 2 ? "stijgend" : delta < -2 ? "dalend" : "stabiel";
    }
  }
  if (vtSub != null && vtText === "–") vtText = form >= 0 ? "fris" : "belast";

  // factor 2 — belasting
  const ctl = fs.ctl != null ? fs.ctl : null,
    atl = fs.atl != null ? fs.atl : null;
  const ramp = fs.ramp != null ? fs.ramp : null;
  let blSub: any = null,
    blText = "–";
  if (ctl != null && atl != null && ctl > 0) {
    const ratio = atl / ctl;
    const ratioSub = rdyClamp_(100 - ((ratio - 0.8) / (1.5 - 0.8)) * 100);
    const rampSub =
      ramp != null
        ? rdyClamp_(100 - (Math.max(0, Math.min(10, ramp)) / 10) * 100)
        : ratioSub;
    blSub = Math.round(0.6 * ratioSub + 0.4 * rampSub);
    blText =
      ratio > 1.15
        ? "ATL-piek"
        : ramp != null && ramp >= 6
          ? "ramp steil"
          : "in balans";
  }

  // factor 3 — HRV
  const def = wellness.hrvDeficit != null ? wellness.hrvDeficit : null;
  const hrvSub = rdyLerp_(def, -15, 5);
  const hrvText =
    def == null
      ? "–"
      : def >= 2
        ? "boven baseline"
        : def <= -2
          ? "onder baseline"
          : "op baseline";

  // factor 4 — slaap
  const slp =
    wellness.sleepAvg3 != null
      ? wellness.sleepAvg3
      : wellness.sleepLastNight != null
        ? wellness.sleepLastNight
        : null;
  const slpSub = rdyLerp_(slp, 5, 8);
  const slpText = slp == null ? "–" : rdyUren_(slp);

  const raw = [
    {
      key: "vormTrend",
      label: "Vorm-trend",
      sub: vtSub,
      weight: W.vormTrend,
      valueText: vtText,
    },
    {
      key: "belasting",
      label: "Belasting",
      sub: blSub,
      weight: W.belasting,
      valueText: blText,
    },
    {
      key: "hrv",
      label: "HRV",
      sub: hrvSub,
      weight: W.hrv,
      valueText: hrvText,
    },
    {
      key: "slaap",
      label: "Slaap",
      sub: slpSub,
      weight: W.slaap,
      valueText: slpText,
    },
  ];

  const present = raw.filter((f) => f.sub != null);
  const totW = present.reduce((a, f) => a + f.weight, 0);
  let score: any = null;
  if (totW > 0) {
    score = Math.round(
      present.reduce((a, f) => a + f.sub * f.weight, 0) / totW,
    );
  }
  const cDelta = checkin ? checkinDelta_(checkin) : 0;
  if (score != null && checkin) score = rdyClamp_(score + cDelta);
  const band =
    score == null
      ? null
      : score >= 62
        ? "ready"
        : score >= 48
          ? "caution"
          : "rest";

  const factors = raw.map((f) => {
    const dot =
      f.sub == null
        ? "muted"
        : f.sub >= 67
          ? "good"
          : f.sub >= 34
            ? "warn"
            : "muted";
    return {
      key: f.key,
      label: f.label,
      sub: f.sub == null ? null : Math.round(f.sub),
      dot: dot,
      valueText: f.valueText,
    };
  });

  const chips: any[] = [];
  if (form != null) {
    const fv = Math.round(form);
    chips.push({
      label: `Vorm ${fv > 0 ? "+" : ""}${fv}`,
      tone: fv > 0 ? "fresh" : "muted",
    });
  }
  if (wellness.hrvRecent != null)
    chips.push({
      label: `HRV ${Math.round(wellness.hrvRecent)}`,
      tone: "muted",
    });

  return {
    score: score,
    band: band,
    factors: factors,
    chips: chips,
    checkinDone: !!checkin,
    checkinDelta: cDelta,
    checkinSummary: checkin ? checkinSummary_(checkin) : "",
    checkin: checkin || null,
  };
}

// ════════════════════════════════════════════════════════════════════
// Readiness-INPUT-derivatie (Fase 1a) — voedt getReadinessScore_.
// Port van Algorithm.gs getWellnessSignal (:1251) + getFormScore_ (:1337).
// INPUT = de 12-koloms WELL_HEADERS-rijen (zoals dashVormReeks_ leest):
//   idx0 Datum(Date) · idx2 HRV · idx3 Slaap(u) · idx8 CTL · idx9 ATL · idx11 Ramp.
// ⚠ Cadans-conventie = OUDSTE-EERST (readWellness/​/api/wellness/dashVormReeks_).
// De GAS-bron was NIEUWSTE-EERST met slice(0,N); op oudste-eerst wordt dat slice(-N).
// Beide functies PUUR; geen IO. Wijzig getReadinessScore_ hierboven NIET.
// ════════════════════════════════════════════════════════════════════

export type WellnessSignalState = "recovery" | "demote" | "warning" | "normal";
export interface WellnessSignalResult {
  hrvBaseline: number | null;
  hrvRecent: number | null;
  hrvDeficit: number | null;
  sleepLastNight: number | null;
  sleepAvg3: number | null;
  signal: WellnessSignalState;
  reason: string;
}

function rdyWellnessFallback_(reason: string): WellnessSignalResult {
  return {
    hrvBaseline: null,
    hrvRecent: null,
    hrvDeficit: null,
    sleepLastNight: null,
    sleepAvg3: null,
    signal: "normal",
    reason: reason,
  };
}

/** Number-of-null: 0/NaN/"" → null (GAS: `isNaN(v) || v===0 ? null : v`). */
function rdyNumOrNull_(v: any): number | null {
  const n = Number(v);
  return Number.isNaN(n) || n === 0 ? null : n;
}
function rdyAvgNonNull_(arr: (number | null)[]): number | null {
  let sum = 0,
    n = 0;
  arr.forEach((v) => {
    if (v != null) {
      sum += v;
      n++;
    }
  });
  return n > 0 ? sum / n : null;
}

/**
 * wellnessSignal_ — HRV/slaap-signaal + de afgeleide velden die getReadinessScore_
 * consumeert. OUDSTE-EERST-reeks; recent = de LAATSTE rijen (slice(-3)), baseline =
 * de laatste 28 (slice(-28)), sleepLastNight = de LAATSTE rij. Logica/drempels
 * exact als Algorithm.gs:1251. HARDE null-guards: ontbrekende slaap/HRV triggeren
 * GEEN tak (elke tak checkt `!= null`); hrvBaseline null/0 → hrvDeficit null (geen
 * deling door 0). Geen bruikbare data → signal "normal".
 */
export function wellnessSignal_(wellRows: any): WellnessSignalResult {
  if (!wellRows || !wellRows.length) {
    return rdyWellnessFallback_("geen wellness-data");
  }
  const hrvSeries: (number | null)[] = wellRows.map((r: any) =>
    rdyNumOrNull_(r[2]),
  );
  const sleepSeries: (number | null)[] = wellRows.map((r: any) =>
    rdyNumOrNull_(r[3]),
  );

  const hrvBaseline = rdyAvgNonNull_(hrvSeries.slice(-28));
  const hrvRecent = rdyAvgNonNull_(hrvSeries.slice(-3));
  const sleepLastNight: number | null = sleepSeries.length
    ? (sleepSeries[sleepSeries.length - 1] ?? null)
    : null;
  const sleepAvg3 = rdyAvgNonNull_(sleepSeries.slice(-3));

  const hrvDeficit =
    hrvBaseline != null && hrvBaseline !== 0 && hrvRecent != null
      ? Math.round(((hrvRecent - hrvBaseline) / hrvBaseline) * 100)
      : null;

  let signal: WellnessSignalState;
  let reason: string;
  if (
    (sleepLastNight != null && sleepLastNight < 5) ||
    (sleepAvg3 != null && sleepAvg3 < 5)
  ) {
    signal = "recovery";
    reason = `slaap kritiek laag (${sleepLastNight != null ? sleepLastNight : sleepAvg3}u)`;
  } else if (
    hrvDeficit != null &&
    hrvDeficit < -10 &&
    sleepAvg3 != null &&
    sleepAvg3 < 6
  ) {
    signal = "recovery";
    reason = `HRV én slaap onder baseline (HRV ${hrvDeficit}%, slaap ${sleepAvg3}u)`;
  } else if (
    (hrvDeficit != null && hrvDeficit < -10) ||
    (sleepLastNight != null && sleepLastNight < 6)
  ) {
    signal = "demote";
    reason =
      hrvDeficit != null && hrvDeficit < -10
        ? `HRV ${hrvDeficit}% onder baseline`
        : `slaap ${sleepLastNight}u onder ondergrens`;
  } else if (
    (hrvDeficit != null && hrvDeficit < -5) ||
    (sleepLastNight != null && sleepLastNight < 7)
  ) {
    signal = "warning";
    reason = "lichte afwijking";
  } else {
    signal = "normal";
    reason = "binnen baseline";
  }

  return {
    hrvBaseline: hrvBaseline != null ? Math.round(hrvBaseline * 10) / 10 : null,
    hrvRecent: hrvRecent != null ? Math.round(hrvRecent * 10) / 10 : null,
    hrvDeficit: hrvDeficit,
    sleepLastNight: sleepLastNight,
    sleepAvg3: sleepAvg3 != null ? Math.round(sleepAvg3 * 10) / 10 : null,
    signal: signal,
    reason: reason,
  };
}

export interface FormState {
  ctl: number;
  atl: number;
  form: number;
  ramp: number | null;
}

/**
 * formStateFromWellness_ — de `fs`-input voor getReadinessScore_. Port van
 * getFormScore_ (sheet-pad): pak de rij met de MAX datum (idx0 Date) die ZOWEL CTL
 * (idx8) als ATL (idx9) heeft — NIET blind de laatste array-rij. form = ctl − atl,
 * ramp = idx11. Geen geldige rij / lege reeks → null. PUUR.
 */
export function formStateFromWellness_(wellRows: any): FormState | null {
  if (!wellRows || !wellRows.length) return null;
  let best: {
    t: number;
    ctl: number;
    atl: number;
    ramp: number | null;
  } | null = null;
  for (let j = 0; j < wellRows.length; j++) {
    const w = wellRows[j];
    if (!(w[0] instanceof Date)) continue;
    const wc = w[8] !== "" && w[8] != null ? Number(w[8]) : null;
    const wa = w[9] !== "" && w[9] != null ? Number(w[9]) : null;
    if (wc == null || wa == null) continue;
    const wt = w[0].getTime();
    if (!best || wt > best.t) {
      best = {
        t: wt,
        ctl: wc,
        atl: wa,
        ramp: w[11] !== "" && w[11] != null ? Number(w[11]) : null,
      };
    }
  }
  if (!best) return null;
  return {
    ctl: best.ctl,
    atl: best.atl,
    form: best.ctl - best.atl,
    ramp: best.ramp,
  };
}
