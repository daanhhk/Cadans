/**
 * weekprep.ts — plan-gekoppelde weekgen-prep (getrouwe port van Algorithm.gs:
 * rollingZoneCoverage :300 · computeZoneDebt_ :492 · recentHardDayDate_ :336).
 *
 * De GAS-originelen lezen de gepersisteerde per-datum-intent (DocProp `weekplan_`,
 * via intentZonesForDate_/p.intent) + de planner-vlaggen (readPlanner). Hier komen
 * die als EXPLICIETE params binnen (intentByDate / plannerDays) → puur, geen IO,
 * geen ambient `new Date()`. Idx15-zone-minuten via de bestaande zones.ts-helpers
 * (zoneActsByDateFromTab_ + actualZoneMinutes_), nooit opnieuw geparsed.
 *
 * DRIE bewuste port-afwijkingen (getrouw aan het model, gemeld in Fase 5.3a):
 *  1. Het GAS-weekplan draagt ZOWEL `zones` (bucket-SET, via intentZonesForDate_)
 *     ALS `intent` (bucket-MINUTEN, via p.intent). Hier is de input één minuten-shape
 *     (ZoneBuckets); "bucket in de set" ⇔ `intent[bucket] > 0`. Klopt zolang het
 *     weekplan `zones = Object.keys(zoneSet)` bevat (buckets met minuten) — standaard.
 *  2. `zoneDebt_` behandelt een geplande+gedane dag ZONDER zone-data als actual=0
 *     (→ debt = intent). De GAS `computeZoneDebt_` SLAAT zo'n dag over (`if(!actual)
 *     return`, "plan gehaald") en doet bij een tab-dekkingsgat een live-API-refetch —
 *     niet porteerbaar naar een pure engine. Bewust afwijkend, per 5.3a-contract.
 *  3. `days = 7` levert een 8-daags venster [today-7 .. today] (GAS `>= today-7d`,
 *     inclusief). Bekende misnomer, getrouw overgenomen.
 */
import { formatDate, stripTime_ } from "./utils";
import {
  actualZoneMinutes_,
  CYCLING_TYPES,
  zoneActsByDateFromTab_,
} from "./zones";

export interface ZoneBuckets {
  low: number;
  high: number;
  anaerobic: number;
}
/** Per-datum ('yyyy-MM-dd') → beoogde minuten per bucket (uit het gepersisteerde weekplan). */
export type IntentByDate = Record<string, ZoneBuckets>;
/** Planner-dag-vlaggen (readPlanner-equivalent) voor de debt-gating. */
export interface PlannerDayFlag {
  datum: string; // 'yyyy-MM-dd'
  train: boolean;
  gedaan: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 'yyyy-MM-dd' → Date op LOKALE middernacht (geen UTC). Ongeldig → Invalid Date. */
function isoToLocal_(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return new Date(Number.NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * rollingZoneCoverage_ — COUNTS van recente fiets-activiteiten per load-bucket over
 * het venster t/m todayISO. Per activiteit: als er intent voor die datum is → tel in
 * ELKE bucket die de intent dekt (multi-bucket), anders IF-fallback (idx7, één bucket).
 */
export function rollingZoneCoverage_(
  actValues: any,
  intentByDate: IntentByDate,
  todayISO: string,
  days = 7,
): ZoneBuckets {
  const cov: ZoneBuckets = { low: 0, high: 0, anaerobic: 0 };
  if (!actValues || !actValues.length) return cov;
  // [today-days .. today] (inclusief → 8 dagen bij days=7; zie header-afwijking 3).
  const cutoff = isoToLocal_(todayISO).getTime() - days * MS_PER_DAY;
  actValues.forEach((r: any) => {
    const d = r[0];
    if (!(d instanceof Date)) return; // idx0 = Datum
    if (stripTime_(d).getTime() < cutoff) return;
    if (CYCLING_TYPES.indexOf(String(r[1] || "")) < 0) return; // idx1 = Type, alleen fiets
    const key = formatDate(stripTime_(d), "yyyy-MM-dd");
    const iz = intentByDate[key];
    if (iz && (iz.low > 0 || iz.high > 0 || iz.anaerobic > 0)) {
      if (iz.low > 0) cov.low++;
      if (iz.high > 0) cov.high++;
      if (iz.anaerobic > 0) cov.anaerobic++;
      return;
    }
    const iff = Number(r[7]) || 0; // idx7 = IF
    if (iff >= 0.95) cov.anaerobic++;
    else if (iff >= 0.85) cov.high++;
    else if (iff >= 0.8) cov.high++;
    else if (iff > 0) cov.low++;
  });
  return cov;
}

/**
 * zoneDebt_ — MINUTEN-tekort per bucket over de huidige week. Voor elke planner-dag
 * met train && gedaan in [weekMonday .. weekMonday+7): debt += intent − actual (idx15-
 * zone-minuten). GEEN clamp (mag negatief). Geen zone-data → actual 0 (zie afwijking 2).
 */
export function zoneDebt_(
  intentByDate: IntentByDate,
  plannerDays: PlannerDayFlag[],
  actValues: any,
  weekMondayISO: string,
): ZoneBuckets {
  const debt: ZoneBuckets = { low: 0, high: 0, anaerobic: 0 };
  if (!plannerDays || !plannerDays.length) return debt;
  const wsT = isoToLocal_(weekMondayISO).getTime();
  const weT = wsT + 7 * MS_PER_DAY;
  const actsByDate = zoneActsByDateFromTab_(actValues);
  plannerDays.forEach((pd) => {
    if (!pd || !pd.train || !pd.gedaan || !pd.datum) return;
    const dtDate = isoToLocal_(pd.datum);
    const dt = dtDate.getTime();
    if (dt < wsT || dt >= weT) return; // [maandag .. maandag+7)
    const key = formatDate(dtDate, "yyyy-MM-dd");
    const actual: ZoneBuckets = { low: 0, high: 0, anaerobic: 0 };
    (actsByDate[key] || []).forEach((a: any) => {
      const az = actualZoneMinutes_(a, null);
      if (az) {
        actual.low += az.low;
        actual.high += az.high;
        actual.anaerobic += az.anaerobic;
      }
    });
    const intent = intentByDate[key] || { low: 0, high: 0, anaerobic: 0 };
    debt.low += (intent.low || 0) - actual.low;
    debt.high += (intent.high || 0) - actual.high;
    debt.anaerobic += (intent.anaerobic || 0) - actual.anaerobic;
  });
  return debt;
}

/**
 * recentHardDate_ — datum (lokale middernacht) van de meest recente "harde" activiteit,
 * of null. hard = idx7 ≥ 0,85 OF de intent voor die datum draagt high/anaerobic. GEEN
 * CYCLING_TYPES-filter (getrouw aan de GAS recentHardDayDate_); geen `doel`-param.
 */
export function recentHardDate_(
  actValues: any,
  intentByDate: IntentByDate,
): Date | null {
  if (!actValues || !actValues.length) return null;
  let best: Date | null = null;
  actValues.forEach((r: any) => {
    const d = r[0];
    if (!(d instanceof Date)) return;
    const key = formatDate(stripTime_(d), "yyyy-MM-dd");
    let hard = (Number(r[7]) || 0) >= 0.85; // idx7 = IF
    const iz = intentByDate[key];
    if (iz && (iz.high > 0 || iz.anaerobic > 0)) hard = true;
    if (hard) {
      const dd = stripTime_(d);
      if (!best || dd.getTime() > best.getTime()) best = dd;
    }
  });
  return best;
}
