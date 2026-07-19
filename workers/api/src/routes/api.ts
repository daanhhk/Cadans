/**
 * routes/api.ts — Hono API onder /api. Fase 4a = pure D1-READ-routes; Fase 4b
 * voegt intervals-SYNC-routes (POST) + de power-curve-READ toe. Alle datum-OUTPUT
 * loopt via dates.ts (toD1Date/toD1DateTime) zodat een Date NOOIT als UTC-"…Z"-
 * string uit c.json() lekt (anti-drift). De sync-routes geven GEEN fetchImpl/now
 * door → productie gebruikt de ambient/global fetch + now (debt (d) blijft
 * pre-deploy). athleteId komt uit c.env.INTERVALS_ATHLETE_ID (niet geëxposed).
 * User = CURRENT_USER_ID (vervalt in de auth-fase).
 */
import type {
  DayOverride,
  DispositionReason,
  EventInput,
  PlannerDayInput,
} from "@cadans/shared";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { CURRENT_USER_ID, makeDb } from "../db/client";
import { fromD1, toD1Date, toD1DateTime } from "../db/dates";
import {
  type CheckinInput,
  type EngineSettings,
  readActivities,
  readCheckin,
  readDispositions,
  readEvents,
  readOverrides,
  readPlannerDays,
  readRecentWeekplans,
  readRpe,
  readSettings,
  readWeekplan,
  readWellness,
  type WellnessRecord,
  writeCheckin,
  writeDisposition,
  writeEvents,
  writeOverride,
  writePlannerDays,
  writeRpe,
  writeSettings,
  writeWeekplan,
} from "../db/repo";
import { type IntervalsEnv, syncActivities } from "../integrations/intervals";
import {
  readNormalizedPowerCurve,
  syncPowerCurve,
} from "../integrations/powercurve";
import { syncWellness } from "../integrations/wellness";
import { mergeFrozenWeekplan } from "../weekplanFreeze";

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

// ── write-body-helpers (PUT-routes) ──────────────────────────────────
// JSON-body → plat object (geen array/null/scalar). Kapotte JSON = 400.
const readJsonObject = async (c: Context): Promise<Record<string, unknown>> => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new HTTPException(400, { message: "invalid JSON body" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HTTPException(400, { message: "body must be a JSON object" });
  }
  return body as Record<string, unknown>;
};

// Per-veld typeof-guards (expliciet, geen dynamische index-access/any-cast).
const numField = (v: unknown, name: string): number => {
  if (typeof v !== "number") {
    throw new HTTPException(400, { message: `field '${name}' has wrong type` });
  }
  return v;
};
const strField = (v: unknown, name: string): string => {
  if (typeof v !== "string") {
    throw new HTTPException(400, { message: `field '${name}' has wrong type` });
  }
  return v;
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

// ── Fase 5.3b — weekgen D1-reads (planner_days + events) ──────────────
api.get("/planner/:monday", async (c) => {
  const db = makeDb(c.env.DB);
  const monday = c.req.param("monday");
  if (!isIsoDate(monday)) {
    throw new HTTPException(400, {
      message: "invalid monday, expected yyyy-MM-dd",
    });
  }
  // Rauwe datum-tekst (geen fromD1); lege week → [] + 200 (GEEN 404).
  const rows = await readPlannerDays(db, CURRENT_USER_ID, monday);
  return c.json(rows);
});

api.get("/events", async (c) => {
  const db = makeDb(c.env.DB);
  const rows = await readEvents(db, CURRENT_USER_ID);
  return c.json(rows);
});

// PUT /events — FULL-REPLACE de events-lijst van de user. body = { events: EventInput[] }.
// Atomisch: valideer ÁLLE rijen (throw op de eerste ongeldige → geen write), dan vervang.
// Response = de verse events (bare EventItem[], symmetrisch met GET). Lege lijst = wist alles.
const KLIM_TYPES = new Set(["lang", "kort", "gemengd", "vlak"]);
api.put("/events", async (c) => {
  const db = makeDb(c.env.DB);
  const body = await readJsonObject(c);
  const raw = body.events;
  if (!Array.isArray(raw)) {
    throw new HTTPException(400, { message: "body.events must be an array" });
  }
  const rows: EventInput[] = raw.map((item, i) => {
    const o = (item ?? {}) as Record<string, unknown>;
    if (
      typeof o.datum !== "string" ||
      !isIsoDate(o.datum) ||
      Number.isNaN(Date.parse(o.datum))
    ) {
      throw new HTTPException(400, {
        message: `event ${i}: datum must be yyyy-MM-dd`,
      });
    }
    if (
      typeof o.naam !== "string" ||
      o.naam.trim().length < 1 ||
      o.naam.trim().length > 60
    ) {
      throw new HTTPException(400, {
        message: `event ${i}: naam required (1..60 chars)`,
      });
    }
    if (o.type !== "trip" && o.type !== "race") {
      throw new HTTPException(400, {
        message: `event ${i}: type must be trip|race`,
      });
    }
    if (o.prioriteit !== "A" && o.prioriteit !== "B" && o.prioriteit !== "C") {
      throw new HTTPException(400, {
        message: `event ${i}: prioriteit must be A|B|C`,
      });
    }
    let afstandKm: number | null = null;
    if (o.afstandKm != null) {
      if (
        typeof o.afstandKm !== "number" ||
        !Number.isFinite(o.afstandKm) ||
        o.afstandKm < 0
      ) {
        throw new HTTPException(400, {
          message: `event ${i}: afstandKm must be a number >= 0`,
        });
      }
      afstandKm = o.afstandKm;
    }
    let hoogtemeters: number | null = null;
    if (o.hoogtemeters != null) {
      if (
        typeof o.hoogtemeters !== "number" ||
        !Number.isInteger(o.hoogtemeters) ||
        o.hoogtemeters < 0
      ) {
        throw new HTTPException(400, {
          message: `event ${i}: hoogtemeters must be an integer >= 0`,
        });
      }
      hoogtemeters = o.hoogtemeters;
    }
    let klimType: EventInput["klimType"] = null;
    if (o.klimType != null) {
      if (typeof o.klimType !== "string" || !KLIM_TYPES.has(o.klimType)) {
        throw new HTTPException(400, {
          message: `event ${i}: klimType must be lang|kort|gemengd|vlak`,
        });
      }
      klimType = o.klimType as EventInput["klimType"];
    }
    let notitie: string | null = null;
    if (o.notitie != null) {
      if (typeof o.notitie !== "string" || o.notitie.length > 200) {
        throw new HTTPException(400, {
          message: `event ${i}: notitie must be a string <= 200 chars`,
        });
      }
      notitie = o.notitie;
    }
    return {
      datum: o.datum,
      naam: o.naam.trim(),
      type: o.type as "trip" | "race",
      prioriteit: o.prioriteit as "A" | "B" | "C",
      afstandKm,
      hoogtemeters,
      klimType,
      notitie,
    };
  });
  await writeEvents(db, CURRENT_USER_ID, rows);
  const fresh = await readEvents(db, CURRENT_USER_ID);
  return c.json(fresh);
});

api.get("/rpe", async (c) => {
  const db = makeDb(c.env.DB);
  const rows = await readRpe(db, CURRENT_USER_ID);
  return c.json(rows);
});

// PUT /api/rpe/:date — RPE 1-10 voor een dag (spiegelt PUT /checkin/:date). De engine leest de
// rpe-rijen al (readiness.ts rpeSignal_); deze route persisteert ze, GEEN proposal-herberekening.
api.put("/rpe/:date", async (c) => {
  const db = makeDb(c.env.DB);
  const date = c.req.param("date");
  if (!isIsoDate(date)) {
    throw new HTTPException(400, {
      message: "invalid date, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  const value = body.rpe;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10
  ) {
    throw new HTTPException(400, {
      message: "invalid rpe, expected integer 1-10",
    });
  }
  await writeRpe(db, CURRENT_USER_ID, date, value);
  return c.json({ ok: true });
});

const DISPOSITION_REASONS = [
  "geen_tijd",
  "bewust_gerust",
  "iets_anders",
] as const;

api.get("/dispositions", async (c) => {
  const db = makeDb(c.env.DB);
  const rows = await readDispositions(db, CURRENT_USER_ID);
  return c.json(rows);
});

// PUT /api/disposition/:date — reason ∈ set OF null (=wis). GEEN proposal-herberekening
// (de engine leest disposition niet; GAS saveDisposition doet ook geen generateProposal).
// Non-clobber: writeDisposition raakt override_json niet aan. Spiegelt PUT /rpe/:date.
api.put("/disposition/:date", async (c) => {
  const db = makeDb(c.env.DB);
  const date = c.req.param("date");
  if (!isIsoDate(date)) {
    throw new HTTPException(400, {
      message: "invalid date, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  const reason = body.reason;
  if (
    reason !== null &&
    !(DISPOSITION_REASONS as readonly string[]).includes(reason as string)
  ) {
    throw new HTTPException(400, {
      message:
        "invalid reason, expected geen_tijd|bewust_gerust|iets_anders or null",
    });
  }
  await writeDisposition(
    db,
    CURRENT_USER_ID,
    date,
    reason as DispositionReason | null,
  );
  return c.json({ ok: true });
});

const OVERRIDE_WORKOUT_TYPES = [
  "recovery",
  "long_z2",
  "tempo",
  "sweet_spot",
  "threshold",
  "vo2max",
] as const;
const OVERRIDE_RIT_TYPES = ["vrij", "groep"] as const;
const OVERRIDE_INTENSITEITEN = ["rustig", "tempo", "stevig"] as const;

// Valideer de DayOverride-union (byte-getrouw aan @cadans/shared): library {type,workoutType,
// variantId?,durMin} | free {type,ritType,intensiteit,durMin}; durMin ∈ [20,360].
function isValidOverride(o: unknown): o is DayOverride {
  if (typeof o !== "object" || o === null) return false;
  const ov = o as Record<string, unknown>;
  const dur = ov.durMin;
  if (typeof dur !== "number" || !Number.isFinite(dur) || dur < 20 || dur > 360)
    return false;
  // Idempotentie/display-metadata (from/src/label) — accepteer los; de engine leest ze niet.
  if (ov.from != null && typeof ov.from !== "string") return false;
  if (ov.src != null && ov.src !== "readiness") return false;
  if (ov.label != null && typeof ov.label !== "string") return false;
  if (ov.type === "library") {
    if (
      !(OVERRIDE_WORKOUT_TYPES as readonly string[]).includes(
        ov.workoutType as string,
      )
    )
      return false;
    return ov.variantId == null || typeof ov.variantId === "string";
  }
  if (ov.type === "free") {
    return (
      (OVERRIDE_RIT_TYPES as readonly string[]).includes(
        ov.ritType as string,
      ) &&
      (OVERRIDE_INTENSITEITEN as readonly string[]).includes(
        ov.intensiteit as string,
      )
    );
  }
  return false;
}

api.get("/overrides", async (c) => {
  const db = makeDb(c.env.DB);
  const rows = await readOverrides(db, CURRENT_USER_ID);
  return c.json(rows);
});

// PUT /api/override/:date — override ∈ union OF null (=wis). Non-clobber: writeOverride raakt
// disposition niet aan. De engine LEEST de override (D2, buildOverrideWorkout_). Spiegelt PUT /disposition/:date.
api.put("/override/:date", async (c) => {
  const db = makeDb(c.env.DB);
  const date = c.req.param("date");
  if (!isIsoDate(date)) {
    throw new HTTPException(400, {
      message: "invalid date, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  const override = body.override;
  if (override !== null && !isValidOverride(override)) {
    throw new HTTPException(400, {
      message:
        "invalid override, expected {type:library,workoutType,durMin} | {type:free,ritType,intensiteit,durMin} | null (durMin 20-360)",
    });
  }
  await writeOverride(
    db,
    CURRENT_USER_ID,
    date,
    override as DayOverride | null,
  );
  return c.json({ ok: true });
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

// ── Fase 4c — D1-WRITE-routes (PUT) ──────────────────────────────────
// Onbekende body-velden worden GENEGEERD (whitelist-passthrough, tolerant t.o.v.
// PWA-versie-drift). NB: writeSettings VERVANGT de rij volledig (weggelaten velden
// → null; PUT-semantiek), geen partial-merge. Maandag-weekdag wordt NIET
// gevalideerd (consistent met de 4a-GET; de PWA levert maandagen — aanname).

api.put("/settings", async (c) => {
  const db = makeDb(c.env.DB);
  const body = await readJsonObject(c);
  const patch: Partial<EngineSettings> = {};
  if ("ftp" in body) patch.ftp = numField(body.ftp, "ftp");
  if ("lthr" in body) patch.lthr = numField(body.lthr, "lthr");
  if ("gewicht" in body) patch.gewicht = numField(body.gewicht, "gewicht");
  if ("hrMax" in body) patch.hrMax = numField(body.hrMax, "hrMax");
  if ("hrRest" in body) patch.hrRest = numField(body.hrRest, "hrRest");
  if ("doelDuur" in body) patch.doelDuur = numField(body.doelDuur, "doelDuur");
  if ("pendelDuurMin" in body) {
    patch.pendelDuurMin = numField(body.pendelDuurMin, "pendelDuurMin");
  }
  if ("pendelAantal" in body) {
    patch.pendelAantal = numField(body.pendelAantal, "pendelAantal");
  }
  if ("doel" in body) patch.doel = strField(body.doel, "doel");
  if ("fase" in body) patch.fase = strField(body.fase, "fase");
  if ("profielPreset" in body) {
    patch.profielPreset = strField(body.profielPreset, "profielPreset");
  }
  // Presentatie-velden (geen engine-input): cap op 24 tekens (GAS-parity, WebApp.gs:1529).
  if ("coachNaam" in body) {
    patch.coachNaam = strField(body.coachNaam, "coachNaam").slice(0, 24);
  }
  if ("coachPersona" in body) {
    patch.coachPersona = strField(body.coachPersona, "coachPersona").slice(
      0,
      24,
    );
  }
  if ("naam" in body) {
    patch.naam = strField(body.naam, "naam").slice(0, 24);
  }
  if ("doelStart" in body) {
    if (typeof body.doelStart !== "string" || !isIsoDate(body.doelStart)) {
      throw new HTTPException(400, { message: "doelStart must be yyyy-MM-dd" });
    }
    patch.doelStart = fromD1(body.doelStart);
  }
  await writeSettings(db, CURRENT_USER_ID, patch);
  return c.json({ ok: true });
});

api.put("/checkin/:date", async (c) => {
  const db = makeDb(c.env.DB);
  const date = c.req.param("date");
  if (!isIsoDate(date)) {
    throw new HTTPException(400, {
      message: "invalid date, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  if (
    typeof body.slaap !== "string" ||
    typeof body.benen !== "string" ||
    typeof body.stress !== "string"
  ) {
    throw new HTTPException(400, { message: "invalid checkin payload" });
  }
  const checkin: CheckinInput = {
    slaap: body.slaap,
    benen: body.benen,
    stress: body.stress,
  };
  await writeCheckin(db, CURRENT_USER_ID, date, checkin);
  return c.json({ ok: true });
});

api.put("/weekplan/:monday", async (c) => {
  const db = makeDb(c.env.DB);
  const monday = c.req.param("monday");
  if (!isIsoDate(monday)) {
    throw new HTTPException(400, {
      message: "invalid monday, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  const entries = body.entries;
  if (!Array.isArray(entries)) {
    throw new HTTPException(400, { message: "body.entries must be an array" });
  }
  // todayISO is OPTIONEEL: zonder freeze-datum blijft dit de kale full-replace (bestaand
  // gedrag, o.a. voor herstel/migratie-schrijvers). Meegestuurd → freeze-merge.
  const todayISO = body.todayISO;
  if (
    todayISO != null &&
    (typeof todayISO !== "string" || !isIsoDate(todayISO))
  ) {
    throw new HTTPException(400, {
      message: "invalid todayISO, expected yyyy-MM-dd",
    });
  }
  const merged =
    typeof todayISO === "string"
      ? mergeFrozenWeekplan(
          await readWeekplan(db, CURRENT_USER_ID, monday),
          entries,
          todayISO,
        )
      : entries;
  await writeWeekplan(db, CURRENT_USER_ID, monday, merged);
  return c.json({ ok: true });
});

// FULL-REPLACE de weekplanner-beschikbaarheid van :monday. Body = { days: [...] } met
// de 7 dagen (ma-zo) als PlannerDayInput. Upsert op (user_id, datum) → idempotent.
// voorgesteldType/gedaan worden NIET geaccepteerd (de repo zet ze op null/0).
api.put("/planner/:monday", async (c) => {
  const db = makeDb(c.env.DB);
  const monday = c.req.param("monday");
  if (!isIsoDate(monday)) {
    throw new HTTPException(400, {
      message: "invalid monday, expected yyyy-MM-dd",
    });
  }
  const body = await readJsonObject(c);
  const rawDays = body.days;
  if (!Array.isArray(rawDays)) {
    throw new HTTPException(400, { message: "body.days must be an array" });
  }
  const days: PlannerDayInput[] = rawDays.map((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    if (typeof o.datum !== "string" || !isIsoDate(o.datum)) {
      throw new HTTPException(400, {
        message: `day ${i}: datum must be yyyy-MM-dd`,
      });
    }
    const minuten =
      o.minuten == null ? null : numField(o.minuten, `day ${i} minuten`);
    const dagtype =
      o.dagtype == null ? null : strField(o.dagtype, `day ${i} dagtype`);
    const toelichting =
      o.toelichting == null
        ? null
        : strField(o.toelichting, `day ${i} toelichting`);
    return {
      datum: o.datum,
      train: o.train === true,
      minuten,
      dagtype,
      toelichting,
    };
  });
  await writePlannerDays(db, CURRENT_USER_ID, days);
  return c.json({ ok: true });
});
