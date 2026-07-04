import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { IntervalsEnv } from "./integrations/intervals";
import { api } from "./routes/api";

const app = new Hono<{ Bindings: IntervalsEnv }>();

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
