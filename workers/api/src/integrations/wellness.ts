/**
 * wellness.ts — intervals.icu wellness-sync (port van Sync.gs syncWellness +
 * IntervalsApi.gs getWellness). Zelfde patroon als intervals.ts: Basic-auth-
 * helper hergebruikt, FetchImpl-injectie, alle datums via dates.ts.
 *
 * Endpoint: GET /athlete/{id}/wellness?oldest=&newest= (yyyy-MM-dd, zoals de
 * activities-sync). Veld-mapping + slaap-conversie bevestigd tegen Sync.gs:289.
 */
import { CURRENT_USER_ID, makeDb } from "../db/client";
import { toD1Date } from "../db/dates";
import { upsertWellness, type WellnessInput } from "../db/repo";
import {
  type FetchImpl,
  type IntervalsEnv,
  intervalsBasicAuth,
  type SyncOpts,
} from "./intervals";

const BASE_URL = "https://intervals.icu/api/v1";

export async function fetchWellness(opts: {
  apiKey: string;
  athleteId: string;
  oldest: string;
  newest: string;
  fetchImpl?: FetchImpl;
}): Promise<any[]> {
  const f = opts.fetchImpl ?? fetch;
  const url =
    `${BASE_URL}/athlete/${encodeURIComponent(opts.athleteId)}/wellness` +
    `?oldest=${encodeURIComponent(opts.oldest)}&newest=${encodeURIComponent(opts.newest)}`;
  const resp = await f(url, {
    method: "GET",
    headers: {
      Authorization: intervalsBasicAuth(opts.apiKey),
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`intervals.icu wellness HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

/**
 * intervals-wellness-object → D1-rij (bevestigd tegen Sync.gs syncWellness).
 * Slaap: seconden → uren = round(sleepSecs/360)/10 (1 decimaal); anders
 * sleep_hours/sleep. Vorm = ctl−atl. ctl/atl 1 decimaal, ramp 2 decimalen —
 * zoals de GAS-sync.
 */
export function mapWellness(w: any): WellnessInput {
  const slaapU =
    w.sleepSecs != null
      ? Math.round(w.sleepSecs / 360) / 10
      : w.sleep_hours != null
        ? w.sleep_hours
        : w.sleep != null
          ? w.sleep
          : null;
  const ctlRaw = w.ctl != null ? w.ctl : null;
  const atlRaw = w.atl != null ? w.atl : null;
  return {
    datum: String(w.id ?? w.date ?? ""),
    rhr: w.restingHR != null ? w.restingHR : (w.resting_hr ?? null),
    hrv: w.hrv != null ? w.hrv : (w.hrv_rmssd ?? null),
    slaapU,
    slaapScore: w.sleepScore != null ? w.sleepScore : (w.sleep_score ?? null),
    readiness: w.readiness ?? null,
    mood: w.mood ?? null,
    weightKg: w.weight ?? null,
    ctl: ctlRaw != null ? Math.round(ctlRaw * 10) / 10 : null,
    atl: atlRaw != null ? Math.round(atlRaw * 10) / 10 : null,
    vorm:
      ctlRaw != null && atlRaw != null
        ? Math.round((ctlRaw - atlRaw) * 10) / 10
        : null,
    ramp: w.rampRate != null ? Math.round(w.rampRate * 100) / 100 : null,
  };
}

export async function syncWellness(
  env: IntervalsEnv,
  userId: number = CURRENT_USER_ID,
  opts: SyncOpts = {},
): Promise<{ fetched: number; upserted: number }> {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey)
    throw new Error("syncWellness: env.INTERVALS_API_KEY ontbreekt.");
  const athleteId = opts.athleteId ?? env.INTERVALS_ATHLETE_ID;
  if (!athleteId) {
    throw new Error(
      "syncWellness: athlete-id ontbreekt (env.INTERVALS_ATHLETE_ID of opts.athleteId).",
    );
  }

  const daysBack = opts.daysBack ?? 60;
  const now = opts.now ?? new Date();
  const oldest = toD1Date(new Date(now.getTime() - daysBack * 86400000));
  const newest = toD1Date(now);

  const items = await fetchWellness({
    apiKey,
    athleteId,
    oldest,
    newest,
    fetchImpl: opts.fetchImpl,
  });

  const db = makeDb(env.DB);
  let upserted = 0;
  for (const w of items) {
    const row = mapWellness(w);
    if (!row.datum) continue; // zonder datum → skip
    await upsertWellness(db, userId, row);
    upserted++;
  }
  return { fetched: items.length, upserted };
}
