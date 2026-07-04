/**
 * routes/api.ts — Hono API onder /api. Fase 4a = pure D1-READ-routes; Fase 4b
 * voegt intervals-SYNC-routes (POST) + de power-curve-READ toe. Alle datum-OUTPUT
 * loopt via dates.ts (toD1Date/toD1DateTime) zodat een Date NOOIT als UTC-"…Z"-
 * string uit c.json() lekt (anti-drift). De sync-routes geven GEEN fetchImpl/now
 * door → productie gebruikt de ambient/global fetch + now (debt (d) blijft
 * pre-deploy). athleteId komt uit c.env.INTERVALS_ATHLETE_ID (niet geëxposed).
 * User = CURRENT_USER_ID (vervalt in de auth-fase).
 */
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { CURRENT_USER_ID, makeDb } from "../db/client";
import { fromD1, toD1Date, toD1DateTime } from "../db/dates";
import {
  type EngineSettings,
  readActivities,
  readCheckin,
  readRecentWeekplans,
  readSettings,
  readWeekplan,
  readWellness,
  type WellnessRecord,
} from "../db/repo";
import { type IntervalsEnv, syncActivities } from "../integrations/intervals";
import {
  readNormalizedPowerCurve,
  syncPowerCurve,
} from "../integrations/powercurve";
import { syncWellness } from "../integrations/wellness";

export const api = new Hono<{ Bindings: IntervalsEnv }>();

// Format + lichte kalender-check (maand 1..12, dag 1..31). Strenger dan een pure
// /^\d{4}-\d{2}-\d{2}$/ zodat "2026-13-99" een 400 geeft i.p.v. door te vallen.
const isIsoDate = (s: string): boolean => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
};

// ?days= voor de sync-routes: positieve integer 1..365 (400 bij onzin).
const parseDays = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  if (!/^\d+$/.test(raw)) {
    throw new HTTPException(400, {
      message: "query 'days' must be a positive integer",
    });
  }
  const n = Number(raw);
  if (n < 1 || n > 365) {
    throw new HTTPException(400, {
      message: "query 'days' out of range (1..365)",
    });
  }
  return n;
};

// ?window= voor power-curve: whitelisted (normalizeWindow accepteert 90d|1y).
const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);
const parseWindow = (raw: string | undefined): string | undefined => {
  if (raw === undefined) return undefined;
  if (!ALLOWED_WINDOWS.has(raw)) {
    throw new HTTPException(400, { message: "query 'window' invalid" });
  }
  return raw;
};

// Gerichte serializers (STAP-0): settings.doelStart = Date; wellness.datum = Date;
// activities idx0 = Date (timestamp) → toD1DateTime. weekplans/weekplan (JSON-
// round-trip) + checkin ({slaap,benen,stress}) bevatten GEEN live Date → as-is.
const serializeSettings = (s: EngineSettings) => ({
  ...s,
  doelStart: s.doelStart ? toD1Date(s.doelStart) : s.doelStart,
});
const serializeWellness = (rows: WellnessRecord[]) =>
  rows.map((r) => ({ ...r, datum: toD1Date(r.datum) }));
const serializeActivities = (rows: unknown[][]) =>
  rows.map((r) =>
    r.map((v, i) => (i === 0 && v instanceof Date ? toD1DateTime(v) : v)),
  );

api.get("/health", (c) => c.json({ ok: true, service: "cadans-api" }));

api.get("/settings", async (c) => {
  const db = makeDb(c.env.DB);
  const s = await readSettings(db, CURRENT_USER_ID);
  return c.json(s ? serializeSettings(s) : null);
});

api.get("/wellness", async (c) => {
  const db = makeDb(c.env.DB);
  const rows = await readWellness(db, CURRENT_USER_ID);
  return c.json(serializeWellness(rows));
});

api.get("/activities", async (c) => {
  const db = makeDb(c.env.DB);
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (from !== undefined && !isIsoDate(from)) {
    throw new HTTPException(400, {
      message: "invalid from/to, expected yyyy-MM-dd",
    });
  }
  if (to !== undefined && !isIsoDate(to)) {
    throw new HTTPException(400, {
      message: "invalid from/to, expected yyyy-MM-dd",
    });
  }
  // range.from/to zijn STRINGS (STAP-0) → as-is doorgeven (geen fromD1).
  const range =
    from !== undefined || to !== undefined ? { from, to } : undefined;
  const rows = await readActivities(db, CURRENT_USER_ID, range);
  return c.json(serializeActivities(rows));
});

api.get("/weekplans/recent", async (c) => {
  const db = makeDb(c.env.DB);
  const monday = c.req.query("monday");
  if (!monday || !isIsoDate(monday)) {
    throw new HTTPException(400, {
      message: "query 'monday' (yyyy-MM-dd) required",
    });
  }
  let weeks = 8;
  const weeksRaw = c.req.query("weeks");
  if (weeksRaw !== undefined) {
    weeks = Number.parseInt(weeksRaw, 10);
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
      throw new HTTPException(400, {
        message: "query 'weeks' must be an integer 1..52",
      });
    }
  }
  // entries = JSON-round-trip (geen live Date) → as-is.
  const rows = await readRecentWeekplans(
    db,
    CURRENT_USER_ID,
    fromD1(monday),
    weeks,
  );
  return c.json(rows);
});

api.get("/weekplan/:monday", async (c) => {
  const db = makeDb(c.env.DB);
  const monday = c.req.param("monday");
  if (!isIsoDate(monday)) {
    throw new HTTPException(400, {
      message: "invalid monday, expected yyyy-MM-dd",
    });
  }
  const res = await readWeekplan(db, CURRENT_USER_ID, monday);
  if (res == null) throw new HTTPException(404, { message: "not found" });
  return c.json(res); // JSON-round-trip entries → as-is
});

api.get("/checkin/:date", async (c) => {
  const db = makeDb(c.env.DB);
  const date = c.req.param("date");
  if (!isIsoDate(date)) {
    throw new HTTPException(400, {
      message: "invalid date, expected yyyy-MM-dd",
    });
  }
  const res = await readCheckin(db, CURRENT_USER_ID, date);
  if (res == null) throw new HTTPException(404, { message: "not found" });
  return c.json(res); // {slaap,benen,stress} strings → as-is
});

// ── Fase 4b — intervals-SYNC (POST) + power-curve-READ (GET) ──────────
// Ambient global fetch (geen fetchImpl); athleteId uit c.env. Een niet-2xx
// upstream → de fetch-wrapper GOOIT → hier vertaald naar 502. Bad params
// (parseDays/parseWindow) gooien BUITEN de try → 400 (vóór enige fetch).

api.post("/sync/activities", async (c) => {
  const days = parseDays(c.req.query("days"));
  try {
    const r = await syncActivities(
      c.env,
      CURRENT_USER_ID,
      days === undefined ? {} : { daysBack: days },
    );
    return c.json(r);
  } catch (e) {
    console.error("sync activities failed", e);
    throw new HTTPException(502, { message: "intervals sync failed" });
  }
});

api.post("/sync/wellness", async (c) => {
  const days = parseDays(c.req.query("days"));
  try {
    const r = await syncWellness(
      c.env,
      CURRENT_USER_ID,
      days === undefined ? {} : { daysBack: days },
    );
    return c.json(r);
  } catch (e) {
    console.error("sync wellness failed", e);
    throw new HTTPException(502, { message: "intervals sync failed" });
  }
});

api.post("/sync/power-curve", async (c) => {
  const window = parseWindow(c.req.query("window"));
  try {
    const r = await syncPowerCurve(
      c.env,
      CURRENT_USER_ID,
      window === undefined ? {} : { window },
    );
    return c.json(r);
  } catch (e) {
    console.error("sync power-curve failed", e);
    throw new HTTPException(502, { message: "intervals sync failed" });
  }
});

api.get("/power-curve", async (c) => {
  const window = parseWindow(c.req.query("window"));
  try {
    // pcNormalize_-output = enkel strings/numbers/null (STAP-0) → as-is.
    const r = await readNormalizedPowerCurve(
      c.env,
      CURRENT_USER_ID,
      window,
      {},
    );
    return c.json(r);
  } catch (e) {
    console.error("power-curve read failed", e);
    throw new HTTPException(502, { message: "intervals request failed" });
  }
});
