/**
 * http — gedeelde envelope-vormen die de Hono-app teruggeeft.
 *   - ApiError: elke 4xx/5xx (app.onError / app.notFound) → { error }.
 *   - ApiOk:    de PUT-writes bij succes → { ok: true }.
 */
export interface ApiError {
  error: string;
}

export interface ApiOk {
  ok: true;
}
