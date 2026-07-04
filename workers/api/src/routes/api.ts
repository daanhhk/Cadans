/**
 * routes/api.ts — pure D1-READ-routes (Fase 4a). Alle datum-OUTPUT loopt via
 * dates.ts (toD1Date/toD1DateTime) zodat een Date NOOIT als UTC-"…Z"-string uit
 * c.json() lekt (anti-drift). Geen writes/syncs/power-curve in 4a. User =
 * CURRENT_USER_ID (vervalt in de auth-fase).
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
import type { IntervalsEnv } from "../integrations/intervals";

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
