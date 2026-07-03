import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, service: "cadans-api" }));

export default app;
