// 3d stap 4 — FATIGUE-AWARE dosering (laag-1 logica). Pure functies, spiegelt de vorm van
// tsb.ts/readiness.ts. Het signaal komt UIT de LOAD (wellness `vorm` = CTL−ATL = TSB), NIET uit de
// readiness-band/ochtend-check-in. Heel-week-granulariteit via mesoWeek-substitutie (proposal.ts).
//
// Drempels/venster BESLIST (Daan-akkoord). TSB is al een gladde EWMA-differentie → een N-daags
// gemiddelde + bufferdrempel levert de "aanhoudend"-eigenschap; geen extra K/M-persistentiefilter.
import { profileForDoel_ } from "@cadans/engine";
import type { WellnessInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// ── BLOK-SIGNAAL (docs/DOORTRAIN-KAART-RECON.md) ──────────────────────────────
// De oude drempels UP_TSB_THRESHOLD/DOWN_TSB_THRESHOLD zijn VERVALLEN: een drempel op het 7-daags
// TSB-gemiddelde bemonstert ruis (ATL-EWMA verschuift tien punten op één weekendrit). De beslisser is
// nu de ΔCTL over het afgelopen blok — "heeft dit blok belasting opgebouwd?". TSB blijft informant
// voor de DOWN-Form-put, geen beslisser meer.

/** Het blok = [weekMaandag-22 .. weekMaandag-1]. Bevat deze week NIET: het oordeel staat op maandag
 * vast en schuift niet mee. De ΔCTL-ankers liggen 21 dagen uit elkaar. */
export const BLOCK_WINDOW_DAYS = 21;
/** ΔCTL ≤ dit over 21 dagen (~0,33 CTL/week) telt als GEEN opbouw → de deload heeft geen functie.
 * Grensgeval expliciet: exact +1,0 valt er binnen. Ligt op een plateau (recon §4), niet op een helling. */
export const NO_BUILD_CTL_DELTA = 1.0;
/** DOWN-Form-put schaalt met de load: de drempel is −0,25 × CTL_nu … */
export const DEEP_FATIGUE_CTL_FRACTION = 0.25;
/** … met een vloer op −10, die aansluit op de bestaande Oververmoeid-grens in tsb.ts (kaart = gauge). */
export const DEEP_FATIGUE_FLOOR = -10;
/** Ankertolerantie: de dichtstbijzijnde ctl-rij binnen ± dit aantal dagen van een ankerpunt telt. */
export const CTL_ANCHOR_TOLERANCE_DAYS = 3;
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
 * ΔCTL over het blok vóór `weekMondayISO`. Twee ankerpunten: blok-eind = weekMaandag − 1 dag,
 * blok-begin = weekMaandag − (BLOCK_WINDOW_DAYS + 1) dagen. Per anker de rij met numerieke `ctl`
 * waarvan de datum het DICHTST bij het ankerpunt ligt, binnen CTL_ANCHOR_TOLERANCE_DAYS; bij gelijke
 * afstand wint de OUDERE rij (deterministisch). Beide gevonden → { delta, fromCtl, toCtl } met
 * delta = toCtl − fromCtl, afgerond op 1 decimaal. Anker ontbreekt → null. Datums via parseLocalDate.
 */
export function computeBlockCtlDelta(
  wellness: WellnessInput[],
  weekMondayISO: string,
): { delta: number; fromCtl: number; toCtl: number } | null {
  const mondayMs = parseLocalDate(weekMondayISO).getTime();
  const endMs = mondayMs - 1 * MS_PER_DAY;
  const startMs = mondayMs - (BLOCK_WINDOW_DAYS + 1) * MS_PER_DAY;
  const tolMs = CTL_ANCHOR_TOLERANCE_DAYS * MS_PER_DAY;

  const ctlAt = (anchorMs: number): number | null => {
    let bestCtl: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestMs = Number.POSITIVE_INFINITY;
    for (const w of wellness || []) {
      if (!w || typeof w.datum !== "string") continue;
      if (typeof w.ctl !== "number" || !Number.isFinite(w.ctl)) continue;
      const t = parseLocalDate(w.datum).getTime();
      const dist = Math.abs(t - anchorMs);
      if (dist > tolMs) continue;
      // dichterbij wint; bij gelijke afstand wint de OUDERE rij (kleinere t).
      if (dist < bestDist || (dist === bestDist && t < bestMs)) {
        bestCtl = w.ctl;
        bestDist = dist;
        bestMs = t;
      }
    }
    return bestCtl;
  };

  const fromCtl = ctlAt(startMs);
  const toCtl = ctlAt(endMs);
  if (fromCtl == null || toCtl == null) return null;
  return { delta: Math.round((toCtl - fromCtl) * 10) / 10, fromCtl, toCtl };
}

/** De meest recente numerieke `ctl` met datum ≤ todayISO, of null. */
export function latestCtl(
  wellness: WellnessInput[],
  todayISO: string,
): number | null {
  let bestCtl: number | null = null;
  let bestDatum = "";
  for (const w of wellness || []) {
    if (!w || typeof w.datum !== "string" || w.datum > todayISO) continue;
    if (typeof w.ctl !== "number" || !Number.isFinite(w.ctl)) continue;
    if (w.datum >= bestDatum) {
      bestDatum = w.datum;
      bestCtl = w.ctl;
    }
  }
  return bestCtl;
}

/** De DOWN-Form-put-drempel, schaal-relatief: min(−10, −0,25 × CTL_nu). CTL 45 → −11,25; CTL 30 → −10. */
export function deepFatigueThreshold(ctlNow: number): number {
  return Math.min(DEEP_FATIGUE_FLOOR, -DEEP_FATIGUE_CTL_FRACTION * ctlNow);
}

/**
 * De trigger-poort (ALTIJD voorstel, nooit opgelegd). null → geen voorstel. De beslisser is het
 * BLOK-signaal (ΔCTL), niet meer de TSB-drempel.
 * UP: kalender-deload (mesoWeek 4) EN geen opbouw in het blok → doortrainen (→1). Leest tsbTrend NIET.
 * DOWN: opbouwweek (1..3) EN geen opbouw EN een diepe Form-put → vervroegde deload (→4).
 * Onderdrukt bij Test/Recovery, nearTaper, onvoldoende data, of een ontbrekend blok-anker.
 */
export function fatigueTrigger(a: {
  calendarMesoWeek: number;
  macroFase: string;
  nearTaper: boolean;
  tsbTrend: number | null;
  minDataOk: boolean;
  ctlDelta: number | null;
  ctlNow: number | null;
}): "up" | "down" | null {
  if (!a.minDataOk) return null;
  if (a.macroFase === "Test" || a.macroFase === "Recovery") return null;
  if (a.nearTaper) return null;
  if (a.ctlDelta == null) return null;
  // UP — kalender-deload + geen opbouw. Het blok heeft niet belast → de deload heeft geen functie.
  if (a.calendarMesoWeek === 4 && a.ctlDelta <= NO_BUILD_CTL_DELTA) return "up";
  // DOWN — opbouwweek + geen opbouw + diepe, schaal-relatieve Form-put. Last zonder winst.
  if (
    a.calendarMesoWeek >= 1 &&
    a.calendarMesoWeek <= 3 &&
    a.ctlDelta <= NO_BUILD_CTL_DELTA &&
    typeof a.tsbTrend === "number" &&
    Number.isFinite(a.tsbTrend) &&
    typeof a.ctlNow === "number" &&
    Number.isFinite(a.ctlNow) &&
    a.tsbTrend < deepFatigueThreshold(a.ctlNow)
  )
    return "down";
  return null;
}

/**
 * Stap 1b (DOELEN-SPEC 3.2 VASTGESTELD) — mag de WEEK-BREDE vermoeidheidskaart voor dit doel vuren?
 * Gate op de PROFIEL-vlag, NIET op de doelnaam: een doel zonder mesocyclus (`mesoCyclus === false`,
 * vandaag alleen Onderhoud) draait geen kalender-deload, dus een week-brede up/down-substitutie hoort
 * er niet; herstel loopt daar via de PER-DAG Verlicht-kaart. Door op de vlag te gaten klopt dit meteen
 * voor elk toekomstig doel zonder mesocyclus, zonder hier een naam bij te schrijven. Een leeg/onbekend
 * doel valt door de klim-fallback van `profileForDoel_`, heeft het veld niet → true (fail-open, dezelfde
 * lijn als effectiveMesoWeek_). De PER-DAG Verlicht-kaart blijft in alle gevallen ongemoeid.
 */
export function weekFatigueEnabled(doel: string | null | undefined): boolean {
  const prof = profileForDoel_(doel ?? "");
  return prof?.mesoCyclus !== false;
}
