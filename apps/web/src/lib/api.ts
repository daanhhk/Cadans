/**
 * Typed fetch-wrapper — relatieve /api/…-calls op dezelfde origin (dev: via de
 * vite-proxy → wrangler dev; prod: via de assets-binding op één Worker-origin).
 * Fout-afhandeling leest de gedeelde ApiError-envelope uit @cadans/shared.
 * Wire-types komen UITSLUITEND uit @cadans/shared (geen eigen duplicaten).
 */
import type { ApiError } from "@cadans/shared";

export async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetch(path, { headers: { Accept: "application/json" } });
  const text = await resp.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!resp.ok) {
    const message = (body as ApiError | null)?.error ?? `HTTP ${resp.status}`;
    throw new Error(message);
  }
  return body as T;
}
