// 3d stap 4 — FATIGUE-AWARE dosering (laag-1 logica). Pure functies, spiegelt de vorm van
// tsb.ts/readiness.ts. Het signaal komt UIT de LOAD (wellness `vorm` = CTL−ATL = TSB), NIET uit de
// readiness-band/ochtend-check-in. Heel-week-granulariteit via mesoWeek-substitutie (proposal.ts).
//
// Drempels/venster BESLIST (Daan-akkoord). TSB is al een gladde EWMA-differentie → een N-daags
// gemiddelde + bufferdrempel levert de "aanhoudend"-eigenschap; geen extra K/M-persistentiefilter.
import type { WellnessInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

/** Fris-buffer, ruim voorbij de tsb.ts-Fris-grens (+5): alleen bij écht getaperd → doortrainen. */
export const UP_TSB_THRESHOLD = 8;
/** Oververmoeid-buffer, veel strikter dan de tsb.ts-grens (−10): in een opbouwweek is negatieve TSB
 * NORMAAL/PRODUCTIEF; alleen een DIEPE, aanhoudende put rechtvaardigt een vervroegde deload. */
export const DOWN_TSB_THRESHOLD = -25;
/** Trend = gemiddelde over de meest recente N wellness-rijen met numerieke `vorm`. */
export const FATIGUE_TREND_WINDOW_DAYS = 7;
/** Min-data-poort: aantal rijen met niet-null `vorm` ... */
export const FATIGUE_MIN_ROWS = 21;
/** ... binnen dit venster (dagen) van todayISO — CTL-rijpheid. */
export const FATIGUE_MIN_WINDOW_DAYS = 42;

const MS_PER_DAY = 86400000;

/**
 * Gemiddelde van `vorm` (=CTL−ATL=TSB) over de meest recente `window` wellness-rijen met een
 * numerieke vorm en datum ≤ todayISO. Datums zijn yyyy-MM-dd → string-vergelijking (geen
 * Date-round-trip). Geen bruikbare data → { trend: null, n: 0 }.
 */
export function computeTsbTrend(
  wellness: WellnessInput[],
  todayISO: string,
  window: number = FATIGUE_TREND_WINDOW_DAYS,
): { trend: number | null; n: number } {
  const usable = (wellness || [])
    .filter(
      (w) =>
        w &&
        typeof w.datum === "string" &&
        w.datum <= todayISO &&
        typeof w.vorm === "number" &&
        Number.isFinite(w.vorm),
    )
    .sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
  const recent = usable.slice(-window);
  if (recent.length === 0) return { trend: null, n: 0 };
  const sum = recent.reduce((acc, w) => acc + (w.vorm as number), 0);
  return { trend: sum / recent.length, n: recent.length };
}

/**
 * Min-data-poort: ≥ FATIGUE_MIN_ROWS rijen met niet-null `vorm` binnen FATIGUE_MIN_WINDOW_DAYS dagen
 * van todayISO. Mirror van het last-N-days-patroon (weeklyHoursRecent_): lokale ms-floor via
 * parseLocalDate (midnight-local, geen UTC-shift), telt de rijen ≥ floor.
 */
export function fatigueMinDataOk(
  wellness: WellnessInput[],
  todayISO: string,
): boolean {
  if (!wellness || !wellness.length) return false;
  const floor =
    parseLocalDate(todayISO).getTime() - FATIGUE_MIN_WINDOW_DAYS * MS_PER_DAY;
  let n = 0;
  for (const w of wellness) {
    if (!w || typeof w.datum !== "string") continue;
    if (typeof w.vorm !== "number" || !Number.isFinite(w.vorm)) continue;
    if (parseLocalDate(w.datum).getTime() < floor) continue;
    n++;
  }
  return n >= FATIGUE_MIN_ROWS;
}

/**
 * De trigger-poort (ALTIJD voorstel, nooit opgelegd). null → geen voorstel.
 * UP: kalender-deload (mesoWeek 4) + fris → doortrainen (→1). DOWN: opbouwweek (1..3) +
 * diep/aanhoudend oververmoeid → vervroegde deload (→4). Onderdrukt bij Test/Recovery,
 * nearTaper, of onvoldoende data.
 */
export function fatigueTrigger(a: {
  calendarMesoWeek: number;
  macroFase: string;
  nearTaper: boolean;
  tsbTrend: number | null;
  minDataOk: boolean;
}): "up" | "down" | null {
  if (!a.minDataOk || a.tsbTrend == null) return null;
  if (a.macroFase === "Test" || a.macroFase === "Recovery") return null;
  if (a.nearTaper) return null;
  if (a.calendarMesoWeek === 4 && a.tsbTrend > UP_TSB_THRESHOLD) return "up";
  if (
    a.calendarMesoWeek >= 1 &&
    a.calendarMesoWeek <= 3 &&
    a.tsbTrend < DOWN_TSB_THRESHOLD
  )
    return "down";
  return null;
}
