import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { HTTPException } from "hono/http-exception";
import { CURRENT_USER_ID, ensureUser, makeDb } from "./db/client";
import type { IntervalsEnv } from "./integrations/intervals";
import { api } from "./routes/api";

// BASIC_AUTH_PASSWORD is an optional deploy-only secret (never in .dev.vars); when
// absent (local/test/CI) the auth gate below is a no-op and the origin stays open.
type AppEnv = IntervalsEnv & { BASIC_AUTH_PASSWORD?: string };

const app = new Hono<{ Bindings: AppEnv }>();

// Whole-origin auth gate (FIRST middleware): only active when the secret is set;
// then every path — including top-level navigation — needs Basic creds, so the
// browser shows its native prompt (401 + WWW-Authenticate) and remembers them.
app.use("*", async (c, next) => {
  const password = c.env.BASIC_AUTH_PASSWORD;
  if (!password) return next();
  try {
    return await basicAuth({ username: "daan", password })(c, next);
  } catch (err) {
    // basicAuth throws an HTTPException whose response carries the WWW-Authenticate
    // challenge; return it directly so the header survives (app.onError would
    // rebuild a plain JSON 401 and drop it → no native browser prompt).
    if (err instanceof HTTPException) return err.getResponse();
    throw err;
  }
});

// Bootstrap the v1 user row before any mutating write. GET is read-only and never
// inserts, so the bootstrap is scoped to non-GET methods; ensureUser is idempotent
// (INSERT OR IGNORE), so any current or future mutating route is covered for free.
app.use("*", async (c, next) => {
  if (c.req.method !== "GET") {
    await ensureUser(makeDb(c.env.DB), CURRENT_USER_ID);
  }
  return next();
});

app.route("/api", api);

// Asset/SPA-fallback: non-/api paths → the static build via the ASSETS binding
// (not_found_handling: single-page-application). Unmatched /api/* stays a JSON-404
// (app.notFound) rather than serving index.html; ASSETS is only bound in the
// deployed Worker, so the /api-only tests never reach the asset branch.
app.all("*", (c) => {
  const assets = c.env.ASSETS;
  if (c.req.path.startsWith("/api/") || !assets) return c.notFound();
  return assets.fetch(c.req.raw);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "internal error" }, 500);
});

app.notFound((c) => c.json({ error: "not found" }, 404));

export default app;
