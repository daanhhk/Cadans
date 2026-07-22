/**
 * push.ts — workout-PUSH naar intervals.icu (FASE-C C2). Client-driven: de client stuurt de
 * ACTIEVE sessies (na overrides/fatigue-shift/debt) mee; de worker assembleert de ZWO via de
 * C1-engine-wrappers en pusht in één bulk-call. Byte-faithful port van IntervalsApi.gs
 * (buildEventPayload/pushEvents_/pushAllPending_ @ 3e8090a); alleen naar TS + fetch/btoa i.p.v.
 * UrlFetchApp/Utilities. Auth = de bestaande intervals-credential-infra (env-key + athlete-id).
 */
import {
  buildWorkoutDescription_,
  buildWorkoutDsl_,
  buildWorkoutZwo_,
} from "@cadans/engine";
import {
  BASE_URL,
  type FetchImpl,
  type IntervalsEnv,
  intervalsBasicAuth,
} from "./intervals";

// GAS-constante (IntervalsApi.gs:17), byte-exact.
const COACH_NAME_PREFIX = "🚴 Coach: ";
// v2b-B: distinct start-uur per sessie (GAS IntervalsApi.gs:176) — geen dedup-key, puur zodat
// sessies niet op één tijdstip stapelen.
const SESSIE_UUR = [7, 17, 12, 19, 6];

/** UTF-8-veilige base64 (TextEncoder → binaire string → btoa). Nodig i.p.v. kaal `btoa(zwo)`:
 * de workout-naam in de XML kan emoji/accenten bevatten en kaal btoa faalt op codepoints >U+00FF.
 * Dit is de ENIGE nodige afwijking t.o.v. GAS' `Utilities.base64Encode` (dat UTF-8-bytes base64't). */
function base64Utf8_(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Sanitize voor ZWO-filenames: alleen [a-zA-Z0-9_-], max 100 chars (GAS IntervalsApi.gs:211). */
function sanitizeFilename_(s: any): string {
  return String(s)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 100);
}

/**
 * Bouwt één intervals.icu-event-payload voor een workout (byte-faithful IntervalsApi.gs:165).
 * ftp komt als PARAMETER binnen (GAS las `getDocProp('ftp','275')`); pure dependency-injection.
 */
export function buildEventPayload(
  workout: any,
  dateISO: string,
  type?: string,
  sessionIndex?: number,
  sessionCount?: number,
  ftp?: number,
): any {
  if (!workout || !workout.naam)
    throw new Error("buildEventPayload: geen geldig workout-object.");
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new Error(
      `buildEventPayload: dateISO moet yyyy-MM-dd zijn (kreeg "${dateISO}").`,
    );
  }
  const t = type || "Ride";
  const idx = sessionIndex || 1;
  const count = sessionCount || 1;
  const f = ftp || 275;

  const uur = SESSIE_UUR[idx - 1] != null ? SESSIE_UUR[idx - 1] : 12;
  const hh = `0${uur}`.slice(-2);
  const suffix = idx >= 2 ? `_s${idx}` : "";

  const base: any = {
    category: "WORKOUT",
    start_date_local: `${dateISO}T${hh}:00:00`,
    type: t,
    name:
      COACH_NAME_PREFIX +
      workout.naam +
      (count > 1 ? ` (sessie ${idx}/${count})` : ""),
    external_id: `coach_${dateISO}_${t.toLowerCase()}${suffix}`,
  };

  // Primary: ZWO (structured FIT via intervals.icu → Garmin multi-step).
  const zwo = buildWorkoutZwo_(workout, f);
  if (zwo) {
    base.filename = `${sanitizeFilename_(workout.naam)}.zwo`;
    base.file_contents_base64 = base64Utf8_(zwo);
    return base;
  }

  // Fallback: DSL in de description (intervals.icu-chart werkt; Garmin = single-lap).
  const dsl = buildWorkoutDsl_(workout, f);
  base.description = dsl != null ? dsl : buildWorkoutDescription_(workout);
  base.moving_time = (workout.totaalMin || 0) * 60;
  base.target = "POWER";
  base.workout_doc = {};
  return base;
}

/**
 * Low-level bulk-push (byte-faithful IntervalsApi.gs:231 + intervalsRequest_ error-vertaling
 * :68-73). fetchImpl-param zodat de route-test 'm kan mocken (geen echte netwerk-call).
 */
export async function pushEvents_(
  events: any[],
  env: IntervalsEnv,
  athleteId: string,
  fetchImpl?: FetchImpl,
): Promise<any> {
  if (!Array.isArray(events) || !events.length) {
    throw new Error("pushEvents_: lege of ongeldige events array.");
  }
  const f = fetchImpl ?? fetch;
  const url = `${BASE_URL}/athlete/${encodeURIComponent(athleteId)}/events/bulk?upsert=true`;
  const resp = await f(url, {
    method: "POST",
    headers: {
      Authorization: intervalsBasicAuth(env.INTERVALS_API_KEY),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(events),
  });

  const code = resp.status;
  const body = await resp.text();

  if (code === 401)
    throw new Error(
      "intervals.icu API error 401 — API key fout of geen toegang tot deze athlete.",
    );
  if (code === 403)
    throw new Error(
      "intervals.icu API error 403 — geen permissie voor deze resource.",
    );
  if (code === 404)
    throw new Error(
      `intervals.icu API error 404 — athlete of resource niet gevonden (athlete ID = "${athleteId}").`,
    );
  if (code === 429)
    throw new Error(
      "intervals.icu rate limit (429) — probeer over een paar minuten opnieuw.",
    );
  if (code >= 500)
    throw new Error(
      `intervals.icu server error ${code} — probeer later opnieuw.`,
    );
  if (code >= 400)
    throw new Error(
      `intervals.icu API error ${code}: ${(body || "").substring(0, 200)}`,
    );

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(
      `intervals.icu response is geen geldige JSON: ${body.substring(0, 200)}`,
    );
  }
}

export type PushDay = { dateISO: string; type?: string; sessions: any[] };

/**
 * Orchestreert de push (spiegelt GAS' pushAllPending_): bouwt per dag per sessie een payload
 * (per-sessie throws → `skipped`), pusht ze in ÉÉN bulk-call, en geeft {pushedCount, skipped,
 * errors} terug. Regenereert NIETS — de client levert de actieve sessies.
 */
export async function pushWorkouts(
  env: IntervalsEnv,
  days: PushDay[],
  ftp: number,
  opts: { athleteId?: string; fetchImpl?: FetchImpl } = {},
): Promise<{ pushedCount: number; skipped: any[]; errors: string[] }> {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey)
    throw new Error("pushWorkouts: env.INTERVALS_API_KEY ontbreekt.");
  const athleteId = opts.athleteId ?? env.INTERVALS_ATHLETE_ID;
  if (!athleteId) {
    throw new Error(
      "pushWorkouts: athlete-id ontbreekt (env.INTERVALS_ATHLETE_ID of opts.athleteId).",
    );
  }

  const skipped: any[] = [];
  const errors: string[] = [];
  const events: any[] = [];

  for (const day of days || []) {
    const sessions = Array.isArray(day.sessions) ? day.sessions : [];
    const type = day.type || "Ride";
    for (let s = 0; s < sessions.length; s++) {
      try {
        events.push(
          buildEventPayload(
            sessions[s],
            day.dateISO,
            type,
            s + 1,
            sessions.length,
            ftp,
          ),
        );
      } catch (e: any) {
        skipped.push({
          dateISO: day.dateISO,
          sessionIndex: s + 1,
          message: e?.message ?? String(e),
        });
      }
    }
  }

  if (!events.length) return { pushedCount: 0, skipped, errors };

  try {
    const response = await pushEvents_(events, env, athleteId, opts.fetchImpl);
    const pushedCount = Array.isArray(response)
      ? response.length
      : events.length;
    return { pushedCount, skipped, errors };
  } catch (e: any) {
    errors.push(`Bulk push mislukt: ${e?.message ?? String(e)}`);
    return { pushedCount: 0, skipped, errors };
  }
}
