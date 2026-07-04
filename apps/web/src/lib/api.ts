/**
 * Typed fetch-wrapper — relatieve /api/…-calls op dezelfde origin (dev: via de
 * vite-proxy → wrangler dev; prod: via de assets-binding op één Worker-origin).
 * Fout-afhandeling leest de gedeelde ApiError-envelope uit @cadans/shared.
 * Wire-types komen UITSLUITEND uit @cadans/shared (geen eigen duplicaten).
 */
import type {
  ApiError,
  CheckinInput,
  SettingsInput,
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

/** GET /api/wellness — oudste-eerst. */
export function getWellness(): Promise<WellnessInput[]> {
  return apiGet<WellnessInput[]>("/api/wellness");
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
