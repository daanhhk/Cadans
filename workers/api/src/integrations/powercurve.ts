/**
 * powercurve.ts — intervals.icu power-curve met RAW-cache in D1 (port van
 * WebApp.gs getPowerCurve). KERN: cache de RAUWE {list, activities}-respons per
 * window; `pcNormalize_` (engine, puur) draait op ELKE read — NOOIT de
 * genormaliseerde output cachen. fetched_on-dag-bucket = impliciete 24h-TTL
 * (spiegelt de GAS powercurve_raw_<window>_<yyyyMMdd>-cache).
 *
 * Endpoint (0a): GET /athlete/{id}/power-curves?type=Ride&curves=<window>,
 * window ∈ '90d'|'1y' (default '1y'); start/end worden GENEGEERD → niet meesturen.
 * c-input voor pcNormalize_ (0b) = raw.list[0] DIRECT (weight/days/label/
 * start_date_local/end_date_local zitten op de list-entry zelf). ftp (0c/0d) uit
 * readSettings().ftp; afwezig → pcNormalize_ zonder ftp (ftp-afhankelijke
 * output-velden zijn dan DEFERRED tot een ftp-seam gevuld is). Alle datum/
 * dag-bucket-logica via dates.ts (nooit toISOString → UTC).
 */
import { pcNormalize_ } from "@cadans/engine";
import { CURRENT_USER_ID, makeDb } from "../db/client";
import { toD1Date } from "../db/dates";
import {
  readPowerCurveCache,
  readSettings,
  upsertPowerCurveCache,
} from "../db/repo";
import {
  type FetchImpl,
  type IntervalsEnv,
  intervalsBasicAuth,
} from "./intervals";

const BASE_URL = "https://intervals.icu/api/v1";

export type PowerCurveWindow = "90d" | "1y";

export function normalizeWindow(w?: string): PowerCurveWindow {
  return w === "90d" ? "90d" : "1y"; // whitelisted; default '1y' (zoals de GAS-app)
}

export type PowerCurveOpts = {
  window?: string;
  athleteId?: string;
  fetchImpl?: FetchImpl;
  now?: Date;
};

function requireAuth(env: IntervalsEnv, opts: PowerCurveOpts, fn: string) {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey) throw new Error(`${fn}: env.INTERVALS_API_KEY ontbreekt.`);
  const athleteId = opts.athleteId ?? env.INTERVALS_ATHLETE_ID;
  if (!athleteId) {
    throw new Error(
      `${fn}: athlete-id ontbreekt (env.INTERVALS_ATHLETE_ID of opts.athleteId).`,
    );
  }
  return { apiKey, athleteId };
}

/** RAW {list, activities}-respons. type=Ride hardcoded; curves = window-string. */
export async function fetchPowerCurve(opts: {
  apiKey: string;
  athleteId: string;
  window: PowerCurveWindow;
  fetchImpl?: FetchImpl;
}): Promise<any> {
  const f = opts.fetchImpl ?? fetch;
  const url =
    `${BASE_URL}/athlete/${encodeURIComponent(opts.athleteId)}/power-curves` +
    `?type=Ride&curves=${encodeURIComponent(opts.window)}`;
  const resp = await f(url, {
    method: "GET",
    headers: {
      Authorization: intervalsBasicAuth(opts.apiKey),
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`intervals.icu power-curves HTTP ${resp.status}`);
  }
  return resp.json();
}

function hasCurveData(raw: any): boolean {
  return !!raw?.list?.[0]?.secs?.length;
}

/** Fetch RAW + cache (alleen na succes-fetch mét data, zoals de GAS-cache). */
export async function syncPowerCurve(
  env: IntervalsEnv,
  userId: number = CURRENT_USER_ID,
  opts: PowerCurveOpts = {},
): Promise<{ window: PowerCurveWindow; fetchedOn: string; cached: boolean }> {
  const { apiKey, athleteId } = requireAuth(env, opts, "syncPowerCurve");
  const window = normalizeWindow(opts.window);
  const fetchedOn = toD1Date(opts.now ?? new Date()); // dag-bucket
  const raw = await fetchPowerCurve({
    apiKey,
    athleteId,
    window,
    fetchImpl: opts.fetchImpl,
  });
  if (!hasCurveData(raw)) return { window, fetchedOn, cached: false };
  const db = makeDb(env.DB);
  await upsertPowerCurveCache(
    db,
    userId,
    window,
    fetchedOn,
    JSON.stringify(raw),
  );
  return { window, fetchedOn, cached: true };
}

/**
 * Read: gebruik de gecachte RAW als fetched_on == vandaag; bij miss OF stale →
 * re-fetch + upsert. Normaliseer altijd VERS met pcNormalize_ (engine, puur).
 */
export async function readNormalizedPowerCurve(
  env: IntervalsEnv,
  userId: number = CURRENT_USER_ID,
  window?: string,
  opts: PowerCurveOpts = {},
): Promise<any> {
  const w = normalizeWindow(window);
  const today = toD1Date(opts.now ?? new Date());
  const db = makeDb(env.DB);

  const cache = await readPowerCurveCache(db, userId, w);
  let raw: any;
  if (cache && cache.fetchedOn === today && hasCurveData(cache.raw)) {
    raw = cache.raw; // verse cache-hit → geen re-fetch
  } else {
    const { apiKey, athleteId } = requireAuth(
      env,
      opts,
      "readNormalizedPowerCurve",
    );
    raw = await fetchPowerCurve({
      apiKey,
      athleteId,
      window: w,
      fetchImpl: opts.fetchImpl,
    });
    if (hasCurveData(raw)) {
      await upsertPowerCurveCache(db, userId, w, today, JSON.stringify(raw));
    }
  }

  const curve = raw?.list?.[0] ?? null;
  if (!curve?.secs?.length) return { empty: true };

  // ftp (0c/0d) uit settings; afwezig → undefined → pcNormalize_ zonder ftp
  // (ftp-afhankelijke velden DEFERRED). weight komt uit curve.weight (RAW-entry).
  const settings = await readSettings(db, userId);
  const ftp = settings?.ftp ?? undefined;
  return pcNormalize_(curve, raw.activities || {}, ftp); // engine, puur; output NOOIT cachen
}
