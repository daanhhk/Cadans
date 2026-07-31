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
  DayOverride,
  DispositionEntry,
  DispositionReason,
  EventInput,
  EventItem,
  OverrideEntry,
  PlannerDay,
  PlannerDayInput,
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

/**
 * PUT /api/planner/:monday — FULL-REPLACE de beschikbaarheid van die week (7 dagen).
 * Non-2xx → throw met de server-foutreden (bv. de 400-melding).
 */
export async function putPlanner(
  mondayISO: string,
  days: PlannerDayInput[],
): Promise<void> {
  const resp = await fetch(`/api/planner/${mondayISO}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ days }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** GET /api/events — alle events, oudste-eerst. */
export function getEvents(): Promise<EventItem[]> {
  return apiGet<EventItem[]>("/api/events");
}

/**
 * PUT /api/events — FULL-REPLACE de events-lijst. Response = de verse lijst
 * (`EventItem[]`, symmetrisch met GET). Non-2xx → throw met de server-foutreden.
 */
export async function putEvents(events: EventInput[]): Promise<EventItem[]> {
  const resp = await fetch("/api/events", {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
  return (await resp.json()) as EventItem[];
}

/** GET /api/rpe — RPE-registraties, oudste-eerst. */
export function getRpe(): Promise<RpeEntry[]> {
  return apiGet<RpeEntry[]>("/api/rpe");
}

/** GET /api/dispositions — dagen mét een disposition, oudste-eerst. */
export function getDispositions(): Promise<DispositionEntry[]> {
  return apiGet<DispositionEntry[]>("/api/dispositions");
}

/** GET /api/overrides — dagen mét een day-override, oudste-eerst. */
export function getOverrides(): Promise<OverrideEntry[]> {
  return apiGet<OverrideEntry[]>("/api/overrides");
}

/** GET /api/weekplans/recent?monday= — recente weekplan-entries (opaque JSON-blob). */
export function getWeekplans(mondayISO: string): Promise<WeekplanEntries> {
  return apiGet<WeekplanEntries>(`/api/weekplans/recent?monday=${mondayISO}`);
}

/**
 * PUT /api/weekplan/:monday — persisteer het plan-van-record van die week.
 * `todayISO` stuurt de worker-freeze: dagen VÓÓR die datum met een bestaande entry
 * blijven staan (snapshotDayAction_-semantiek); vandaag/toekomst wordt vers overschreven.
 * Non-2xx → throw met de server-foutreden.
 */
export async function putWeekplan(
  mondayISO: string,
  entries: unknown[],
  todayISO: string,
): Promise<void> {
  const resp = await fetch(`/api/weekplan/${mondayISO}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ entries, todayISO }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** 3d stap 4 — GET /api/fatigue-shift — de goedgekeurde maandag + richting (of {null,null}). */
export async function getFatigueShift(): Promise<{
  monday: string | null;
  dir: "up" | "down" | null;
}> {
  const r = await apiGet<{ monday: string | null; dir: "up" | "down" | null }>(
    "/api/fatigue-shift",
  );
  return { monday: r?.monday ?? null, dir: r?.dir ?? null };
}

/** 3d stap 4 — PUT /api/fatigue-shift — zet (monday+dir) of wist (null,null) de shift. */
export async function putFatigueShift(
  monday: string | null,
  dir: "up" | "down" | null,
): Promise<void> {
  const resp = await fetch("/api/fatigue-shift", {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ monday, dir }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** ROADMAP stap 2 — GET /api/dosis-trede: niveau + het blok waarvoor de vraag beantwoord is +
 * het doel waarop hij is opgebouwd (of drie nullen). */
/** GET /api/power-zones — de gesynchroniseerde intervals-zonegrenzen, of null. Null betekent nog
 * geen bruikbare fiets-rit gezien; `zone5Grenzen` valt dan terug op ZONE5_GRENZEN_DEFAULT. */
export async function getPowerZones(): Promise<number[] | null> {
  const r = await apiGet<{ powerZones: number[] | null }>("/api/power-zones");
  return r?.powerZones ?? null;
}

export async function getDosisTrede(): Promise<{
  trede: number | null;
  blok: string | null;
  doel: string | null;
}> {
  const r = await apiGet<{
    trede: number | null;
    blok: string | null;
    doel: string | null;
  }>("/api/dosis-trede");
  return {
    trede: r?.trede ?? null,
    blok: r?.blok ?? null,
    doel: r?.doel ?? null,
  };
}

/** ROADMAP stap 2 — PUT /api/dosis-trede: zet de drie samen. Bevestigen ÉN afwijzen schrijven
 * blok+doel; alleen bevestigen verhoogt de trede. */
export async function putDosisTrede(
  trede: number | null,
  blok: string | null,
  doel: string | null,
): Promise<void> {
  const resp = await fetch("/api/dosis-trede", {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ trede, blok, doel }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

// ROADMAP punt 9 fase B — het antwoord op de event-overname. Zelfde vorm als /dosis-trede.
export async function getEventOvername(): Promise<{
  event: string | null;
  blok: string | null;
  antwoord: string | null;
}> {
  const r = await apiGet<{
    event: string | null;
    blok: string | null;
    antwoord: string | null;
  }>("/api/event-overname");
  return {
    event: r?.event ?? null,
    blok: r?.blok ?? null,
    antwoord: r?.antwoord ?? null,
  };
}

/** PUT /api/event-overname: zet de drie samen. BEIDE knoppen schrijven — 'nee' is geen
 * sessie-lokale afwijzing maar een bewaard antwoord voor dit blok, anders komt de vraag elke
 * pageload terug. De route valideert strikt en normaliseert niet. */
export async function putEventOvername(
  event: string | null,
  blok: string | null,
  antwoord: "ja" | "nee" | null,
): Promise<void> {
  const resp = await fetch("/api/event-overname", {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ event, blok, antwoord }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** Eén te-pushen dag: datum + type + de ACTIEVE sessies (SchemaSession-shape; los getypeerd
 * om een schema↔api-importcyclus te vermijden). */
export interface PushDayInput {
  dateISO: string;
  type?: string;
  sessions: unknown[];
}
export interface PushResult {
  pushedCount: number;
  skipped: { dateISO: string; sessionIndex: number; message: string }[];
  errors: string[];
}

/** FASE-C C3 — POST /api/push: stuur de geplande sessies naar intervals.icu (C2-route). Bij een
 * niet-2xx-respons gooit de server-message (401/429/400/502-tekst) zodat de UI 'm kan tonen. */
export async function pushWorkouts(days: PushDayInput[]): Promise<PushResult> {
  const resp = await fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ days }),
  });
  const parsed = await parseBody(resp);
  if (!resp.ok) throw new Error(errMessage(parsed, resp.status));
  return parsed as PushResult;
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

/** PUT /api/rpe/:date — RPE 1-10; 2xx = ok, non-2xx → throw. Spiegelt putCheckin. */
export async function putRpe(date: string, rpe: number): Promise<void> {
  const resp = await fetch(`/api/rpe/${date}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ rpe }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** PUT /api/disposition/:date — reason ∈ set OF null (=wis). KRITIEK: wissen stuurt JSON
 * null ({ reason: null }), NOOIT "" (laag-1 wist alleen op null; "" → 400). Spiegelt putRpe. */
export async function putDisposition(
  date: string,
  reason: DispositionReason | null,
): Promise<void> {
  const resp = await fetch(`/api/disposition/${date}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!resp.ok) {
    const parsed = await parseBody(resp);
    throw new Error(errMessage(parsed, resp.status));
  }
}

/** PUT /api/override/:date — override ∈ union OF null (=wis). KRITIEK: wissen stuurt JSON null
 * ({ override: null }), NOOIT "". Spiegelt putDisposition. */
export async function putOverride(
  date: string,
  override: DayOverride | null,
): Promise<void> {
  const resp = await fetch(`/api/override/${date}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ override }),
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
