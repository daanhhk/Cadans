/**
 * Wire-DTO voor GET /api/power-curve — mirrort de engine `pcNormalize_`-output
 * (packages/engine/src/niveau.ts). De worker draait pcNormalize_ server-side; deze
 * types typen zowel de route-respons als de client-fetch (weg met de `any`-shape).
 */

export interface PowerCurvePoint {
  secs: number;
  watts: number;
}

export interface PowerCurveMarker {
  secs: number;
  /** duur-label: "5s" | "1m" | "5m" | "20m" | "60m". */
  label: string;
  /** key-duur (5m/20m/60m) → visueel benadrukt. */
  key: boolean;
  watts: number;
  wkg: number | null;
  activityId: string | number | null;
  /** ISO-datum van de rit waar de marker vandaan komt, of null. */
  date: string | null;
}

export interface PowerCurveProfile {
  window: {
    label: string | null;
    days: number | null;
    start: string | null;
    end: string | null;
  };
  weight: number | null;
  curve: PowerCurvePoint[];
  markers: PowerCurveMarker[];
  /** pos 0..1 (0 = Diesel·klimmer … 1 = Sprinter) + label; null bij ontbrekende ankers. */
  riderType: { pos: number; label: string } | null;
}

/** Cache nog niet gevuld / geen curve-data. */
export interface PowerCurveEmpty {
  empty: true;
}

export type PowerCurveResponse = PowerCurveProfile | PowerCurveEmpty;
