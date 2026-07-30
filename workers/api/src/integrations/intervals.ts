/**
 * intervals.ts — intervals.icu activiteiten-sync (port van IntervalsApi.gs /
 * Sync.gs sync-pad). Auth = HTTP Basic met username "API_KEY" + de key als
 * wachtwoord: base64("API_KEY:" + key). Endpoint: GET
 * /athlete/{id}/activities?oldest&newest. De normalisatie hergebruikt de
 * engine's `activityToRow_` (ONGEWIJZIGD); alle datums lopen via dates.ts.
 *
 * De key komt UITSLUITEND uit env (workerd: env.INTERVALS_API_KEY; lokaal via
 * .dev.vars). Niets gehardcode.
 */
import { activityToRow_, CYCLING_TYPES } from "@cadans/engine";
import { CURRENT_USER_ID, makeDb } from "../db/client";
import { toD1Date } from "../db/dates";
import { upsertActivity, writePowerZones } from "../db/repo";

export const BASE_URL = "https://intervals.icu/api/v1";

export function intervalsBasicAuth(apiKey: string): string {
  return `Basic ${btoa(`API_KEY:${apiKey}`)}`;
}

export type FetchImpl = typeof fetch;

export type IntervalsEnv = {
  DB: D1Database;
  INTERVALS_API_KEY: string;
  INTERVALS_ATHLETE_ID?: string;
  // Same-origin assets-binding (Fase 5.1a, wrangler.jsonc). Optioneel: Model A
  // laat Cloudflare de SPA-fallback doen, dus de Worker-code raakt env.ASSETS niet
  // (en de test-env-literals hoeven het niet te leveren).
  ASSETS?: Fetcher;
};

export type SyncOpts = {
  daysBack?: number;
  athleteId?: string;
  fetchImpl?: FetchImpl;
  now?: Date;
};

/** Fetch de activiteiten (volledige objecten, geen `fields`-param — zoals de GAS-sync). */
export async function fetchActivities(opts: {
  apiKey: string;
  athleteId: string;
  oldest: string;
  newest: string;
  fetchImpl?: FetchImpl;
}): Promise<any[]> {
  const f = opts.fetchImpl ?? fetch;
  const url =
    `${BASE_URL}/athlete/${encodeURIComponent(opts.athleteId)}/activities` +
    `?oldest=${encodeURIComponent(opts.oldest)}&newest=${encodeURIComponent(opts.newest)}`;
  const resp = await f(url, {
    method: "GET",
    headers: {
      Authorization: intervalsBasicAuth(opts.apiKey),
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`intervals.icu activities HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Sync: fetch → sort (oudste eerst) → normaliseer (activityToRow_) → upsert per
 * activiteit (idempotent op UNIQUE(user_id, activity_id_ext)). Meerdere
 * activiteiten per dag blijven aparte rijen. User-scoped (v1 = CURRENT_USER_ID;
 * vervalt in de auth-fase).
 */
export async function syncActivities(
  env: IntervalsEnv,
  userId: number = CURRENT_USER_ID,
  opts: SyncOpts = {},
): Promise<{ fetched: number; upserted: number }> {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey)
    throw new Error("syncActivities: env.INTERVALS_API_KEY ontbreekt.");
  const athleteId = opts.athleteId ?? env.INTERVALS_ATHLETE_ID;
  if (!athleteId) {
    throw new Error(
      "syncActivities: athlete-id ontbreekt (env.INTERVALS_ATHLETE_ID of opts.athleteId).",
    );
  }

  const daysBack = opts.daysBack ?? 28;
  const now = opts.now ?? new Date();
  const oldest = toD1Date(new Date(now.getTime() - daysBack * 86400000));
  const newest = toD1Date(now);

  const activities = await fetchActivities({
    apiKey,
    athleteId,
    oldest,
    newest,
    fetchImpl: opts.fetchImpl,
  });

  // Spiegelt de IntervalsApi.gs-sort-comparator: oudste eerst, start_date_local
  // zonder Z → lokale parse.
  activities.sort(
    (a, b) => +new Date(a.start_date_local) - +new Date(b.start_date_local),
  );

  const db = makeDb(env.DB);
  let upserted = 0;
  for (const a of activities) {
    const row = activityToRow_(a); // engine-normalisatie, ongewijzigd
    await upsertActivity(db, userId, row);
    upserted++;
  }

  // ROADMAP punt 6 fase 2 — DE ZONE-GRENZEN KOMEN GRATIS MEE. Elk activiteit-object draagt
  // `icu_power_zones` (de bovengrenzen in %FTP), gemeten identiek aan `power_zones` uit de
  // sport-settings; ze werden tot nu toe alleen weggegooid. Geen tweede endpoint, geen extra
  // route, geen vierde schrijfactie per pageload — één upsert binnen een sync die toch al
  // schrijft. Zie docs/ZONE-SYNC-BOUWDOC.md §4.
  //
  // `activities` staat OUDSTE-EERST (de sort hierboven), dus vanaf het nieuwste eind terug
  // scannen geeft de NIEUWSTE bruikbare fiets-rit. Geen tweede sortering.
  //
  // SERVER-ZIJDE ALLEEN "is het een niet-lege array". De volledige toets — vier eerste waarden
  // eindig én oplopend — zit in `zone5Grenzen` client-zijde, met terugval op de default. Die
  // regel op twee plekken zetten geeft twee waarheden.
  for (let i = activities.length - 1; i >= 0; i--) {
    const a = activities[i];
    if (CYCLING_TYPES.indexOf(String(a?.type ?? "")) < 0) continue;
    const zones = a?.icu_power_zones;
    if (!Array.isArray(zones) || zones.length === 0) continue;
    await writePowerZones(db, userId, zones);
    break;
  }
  // Geen kandidaat → NIETS schrijven. Een null-write zou een eerder gevonden indeling wissen
  // op een sync die toevallig geen fiets-rit ophaalde.

  return { fetched: activities.length, upserted };
}
