// TSB (vorm = CTL − ATL) → zone-label + kleur-token.
//
// BRON: design/src/conditie.jsx (ConditieBalans-gauge) — de engine kent GEEN
// 3-zone TSB-drempelfunctie (alleen een form≥0 ? "fris" : "belast"-binair in
// readiness.ts), dus het ontwerp is hier de autoriteit. Gauge-grenzen: −10 en +5.
//   TSB > 5   → Fris        (--fresh · getaperd/uitgerust)
//   −10..5    → Productief  (--good  · opbouwzone)
//   TSB < −10 → Oververmoeid(--bad   · overreached)
export type TsbZone = { label: string; color: string; soft: string };

export function tsbZone(tsb: number): TsbZone {
  if (tsb > 5) {
    return { label: "Fris", color: "var(--fresh)", soft: "var(--fresh-soft)" };
  }
  if (tsb >= -10) {
    return {
      label: "Productief",
      color: "var(--good)",
      soft: "var(--good-soft)",
    };
  }
  return {
    label: "Oververmoeid",
    color: "var(--bad)",
    soft: "var(--bad-soft)",
  };
}
