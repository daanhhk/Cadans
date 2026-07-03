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
