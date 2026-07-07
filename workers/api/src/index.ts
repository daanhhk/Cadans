import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { CURRENT_USER_ID, ensureUser, makeDb } from "./db/client";
import type { IntervalsEnv } from "./integrations/intervals";
import { api } from "./routes/api";

const app = new Hono<{ Bindings: IntervalsEnv }>();

// NB: the first-middleware slot is reserved for basic-auth (change 2 of the
// pre-deploy work); ensureUser registers below it.

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

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "internal error" }, 500);
});

app.notFound((c) => c.json({ error: "not found" }, 404));

export default app;
