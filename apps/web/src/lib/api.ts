/**
 * Typed fetch-wrapper — relatieve /api/…-calls op dezelfde origin (dev: via de
 * vite-proxy → wrangler dev; prod: via de assets-binding op één Worker-origin).
 * Fout-afhandeling leest de gedeelde ApiError-envelope uit @cadans/shared.
 * Wire-types komen UITSLUITEND uit @cadans/shared (geen eigen duplicaten).
 */
import type {
  ActivitiesResponse,
  ApiError,
  CheckinInput,
  EventItem,
  PlannerDay,
  PowerCurveResponse,
  RpeEntry,
  SettingsInput,
  WeekplanEntries,
  WellnessInput,
} from "@cadans/shared";

function errMessage(body: unknown, status: number): string {
  return (body as ApiError | null)?.error ?? `HTTP ${status}`;
}

async function parseBody(resp: Response): Promise<unknown> {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetch(path, { headers: { Accept: "application/json" } });
  const body = await parseBody(resp);
  if (!resp.ok) throw new Error(errMessage(body, resp.status));
  return body as T;
}

/** GET /api/settings — `null` bij een verse user (200, geen fout). */
export function getSettings(): Promise<SettingsInput | null> {
  return apiGet<SettingsInput | null>("/api/settings");
}

/**
 * PUT /api/settings — FULL-REPLACE. `body` bevat ALLEEN de te bewaren velden
 * (weglaten = clearen naar null; nooit null/"" sturen — dat geeft 400). Non-2xx
 * → throw met de server-foutreden (bv. de 400-melding). Zie lib/settings.ts voor
 * de pure form→body-serialisatie.
 */
export async function putSettings(body: Partial<SettingsInput>): Promise<void> {
  const resp = await fetch("/api/settings", {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** GET /api/wellness — oudste-eerst. */
export function getWellness(): Promise<WellnessInput[]> {
  return apiGet<WellnessInput[]>("/api/wellness");
}

/** GET /api/activities — 17-koloms matrix, oudste-eerst; idx0 = ISO-datetime-string. */
export function getActivities(): Promise<ActivitiesResponse> {
  return apiGet<ActivitiesResponse>("/api/activities");
}

/** GET /api/planner/:monday — planner-dagen van de doelweek, oudste-eerst. */
export function getPlanner(mondayISO: string): Promise<PlannerDay[]> {
  return apiGet<PlannerDay[]>(`/api/planner/${mondayISO}`);
}

/** GET /api/events — alle events, oudste-eerst. */
export function getEvents(): Promise<EventItem[]> {
  return apiGet<EventItem[]>("/api/events");
}

/** GET /api/rpe — RPE-registraties, oudste-eerst. */
export function getRpe(): Promise<RpeEntry[]> {
  return apiGet<RpeEntry[]>("/api/rpe");
}

/** GET /api/weekplans/recent?monday= — recente weekplan-entries (opaque JSON-blob). */
export function getWeekplans(mondayISO: string): Promise<WeekplanEntries> {
  return apiGet<WeekplanEntries>(`/api/weekplans/recent?monday=${mondayISO}`);
}

/** GET /api/power-curve?window= — genormaliseerd rijdersprofiel (of `{empty:true}`). */
export function getPowerCurve(
  window: "90d" | "1y",
): Promise<PowerCurveResponse> {
  return apiGet<PowerCurveResponse>(`/api/power-curve?window=${window}`);
}

/** GET /api/checkin/:date — 404 → null (nog niet ingevuld, GEEN fout). */
export async function getCheckin(date: string): Promise<CheckinInput | null> {
  const resp = await fetch(`/api/checkin/${date}`, {
    headers: { Accept: "application/json" },
  });
  if (resp.status === 404) return null;
  const body = await parseBody(resp);
  if (!resp.ok) throw new Error(errMessage(body, resp.status));
  return body as CheckinInput;
}

/** PUT /api/checkin/:date — 2xx = ok; non-2xx → throw. */
export async function putCheckin(
  date: string,
  body: CheckinInput,
): Promise<void> {
  const resp = await fetch(`/api/checkin/${date}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** Sync-respons van de intervals.icu-pull-routes. */
export interface SyncResult {
  fetched: number;
  upserted: number;
}

async function postSync(path: string): Promise<SyncResult> {
  const resp = await fetch(path, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  const body = await parseBody(resp);
  if (!resp.ok) throw new Error(errMessage(body, resp.status));
  return body as SyncResult;
}

/** POST /api/sync/activities — pull recente ritten uit intervals.icu (engine-default venster). */
export function postSyncActivities(): Promise<SyncResult> {
  return postSync("/api/sync/activities");
}

/** POST /api/sync/wellness — pull recente wellness uit intervals.icu (engine-default venster). */
export function postSyncWellness(): Promise<SyncResult> {
  return postSync("/api/sync/wellness");
}
