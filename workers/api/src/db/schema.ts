/**
 * D1 schema (Drizzle / sqlite-core) — implements docs/SCHEMA-PROPOSAL.md.
 *
 * Principes:
 *  - user_id op ELKE niet-users-tabel, FK → users.id (v1 hardcoded op één user;
 *    schema is multi-user-ready).
 *  - Datums/tijden als TEXT (ISO). De Worker (Fase 3) mapt TEXT-datums naar
 *    Date-op-lokale-middernacht (Europe/Amsterdam) voor de engine — zie HANDOFF.
 *  - activities.if_pct is een PERCENTAGE (77, niet 0.77) — engine-contract, niet
 *    omrekenen.
 *  - proposal_* wordt NIET gepersisteerd (volatile/regenerated) → geen tabel.
 *  - Zone-/sweet-spot-grenzen worden door de engine AFGELEID uit ftp/lthr →
 *    geen zones-tabel, geen zone-kolommen (cache/mirror, bewust weggelaten).
 *
 * MULTI-SESSIE: geen enkele tabel dwingt één-sessie-per-dag-status af.
 *  - Per-sessie PLAN leeft in weekplans.entries_json (`sessies`-array).
 *  - Per-sessie ACTUALS leeft in `activities` (meerdere rijen/dag, uniek via
 *    activity_id_ext).
 *  - planner_days / day_state zijn per (user_id, datum) toegestaan omdat ze
 *    day-level user-input/coarse-flags zijn (géén per-sessie-actuals): de
 *    per-sessie-status blijft afleidbaar uit activities + entries_json.sessies.
 */
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ── users ────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email"),
  intervalsAthleteId: text("intervals_athlete_id"),
  createdAt: text("created_at"),
});

// ── settings (1 rij/user) ────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  ftp: integer("ftp"),
  hrMax: integer("hr_max"),
  hrRest: integer("hr_rest"),
  lthr: integer("lthr"),
  thresholdPace: text("threshold_pace"),
  doel: text("doel"),
  doelStart: text("doel_start"),
  doelDuur: integer("doel_duur"),
  fase: text("fase"),
  gewicht: real("gewicht"),
  profielPreset: text("profiel_preset"),
  pendelDuurMin: integer("pendel_duur_min"),
  pendelAantal: integer("pendel_aantal"),
  ftpAutoUpdate: integer("ftp_auto_update"), // bool 0/1
  weightAutoUpdate: integer("weight_auto_update"), // bool 0/1
  emailDigest: text("email_digest"),
});

// ── activities (17-koloms ACT_HEADERS; upsert-sleutel = activity_id_ext) ──
export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    type: text("type"),
    naam: text("naam"),
    duurMin: integer("duur_min"),
    afstandKm: real("afstand_km"),
    gemW: integer("gem_w"),
    normW: integer("norm_w"),
    ifPct: real("if_pct"), // percentage (77, niet 0.77) — engine-contract
    tss: integer("tss"),
    gemHr: integer("gem_hr"),
    maxHr: integer("max_hr"),
    pi: real("pi"),
    ftp: integer("ftp"),
    gewicht: real("gewicht"),
    rollingFtp: integer("rolling_ftp"),
    zoneTimesJson: text("zone_times_json"), // icu_zone_times als JSON-blob
    activityIdExt: text("activity_id_ext"), // intervals.icu id (leeg = pre-migratie)
  },
  (t) => [
    // mergeById_-idempotente upsert-sleutel; meerdere ritten/dag mogen (multi-sessie).
    uniqueIndex("activities_user_actid_unq").on(t.userId, t.activityIdExt),
    index("activities_user_datum_idx").on(t.userId, t.datum),
  ],
);

// ── wellness (WELL_HEADERS) ──────────────────────────────────────────
export const wellness = sqliteTable(
  "wellness",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    rhr: integer("rhr"),
    hrv: real("hrv"),
    slaapU: real("slaap_u"),
    slaapScore: integer("slaap_score"),
    readiness: integer("readiness"),
    mood: text("mood"),
    weightKg: real("weight_kg"),
    ctl: real("ctl"),
    atl: real("atl"),
    vorm: real("vorm"),
    ramp: real("ramp"),
  },
  (t) => [uniqueIndex("wellness_user_datum_unq").on(t.userId, t.datum)],
);

// ── planner_days (Weekplanner user-input) ────────────────────────────
export const plannerDays = sqliteTable(
  "planner_days",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    train: integer("train"), // bool 0/1
    dag: text("dag"),
    minuten: integer("minuten"),
    dagtype: text("dagtype"), // pendel/vrij/weekend/recovery
    toelichting: text("toelichting"),
    voorgesteldType: text("voorgesteld_type"), // day-level mirror (per-sessie plan → weekplans)
    gedaan: integer("gedaan"), // day-level coarse flag; per-sessie actuals → activities
  },
  (t) => [uniqueIndex("planner_days_user_datum_unq").on(t.userId, t.datum)],
);

// ── events (EVENT_HEADERS) ───────────────────────────────────────────
export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    naam: text("naam"),
    type: text("type"), // trip/race
    prioriteit: text("prioriteit"), // A/B/C
    afstandKm: real("afstand_km"),
    hoogtemeters: integer("hoogtemeters"),
    klimType: text("klim_type"), // lang/kort/gemengd/vlak
    notitie: text("notitie"),
  },
  (t) => [index("events_user_datum_idx").on(t.userId, t.datum)],
);

// ── weekplans (durable plan-snapshot; JSON-blob per week, matcht readWeekplan) ──
export const weekplans = sqliteTable(
  "weekplans",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    weekMonday: text("week_monday").notNull(), // 'yyyy-MM-dd' (maandag)
    entriesJson: text("entries_json"), // JSON-array van weekplan-entries (incl. sessies[])
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekMonday] })],
);

// ── rpe (rpe_<date> = enkel getal) ───────────────────────────────────
export const rpe = sqliteTable(
  "rpe",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    rpe: integer("rpe"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.datum] })],
);

// ── checkins (readiness-seam: {slaap,benen,stress,ts}) ───────────────
export const checkins = sqliteTable(
  "checkins",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    slaap: text("slaap"),
    benen: text("benen"),
    stress: text("stress"),
    ts: text("ts"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.datum] })],
);

// ── day_state (override_/disposition_ per dag; day-level, geen sessie-actuals) ──
export const dayState = sqliteTable(
  "day_state",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    overrideJson: text("override_json"),
    disposition: text("disposition"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.datum] })],
);

// ── sync_state (runtime: last_sync / meso_week / load_carry) ─────────
export const syncState = sqliteTable("sync_state", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  lastSync: text("last_sync"),
  mesoWeek: integer("meso_week"),
  loadCarry: real("load_carry"),
  ftpLastSync: text("ftp_last_sync"),
  weightLastSync: text("weight_last_sync"),
});

// ── power_curve_cache — RAW {list,activities}-respons per window. pcNormalize_
// draait op elke READ (nooit genormaliseerd cachen); fetched_on-dag-bucket =
// impliciete 24h-TTL (spiegelt de GAS powercurve_raw_<window>_<yyyyMMdd>-cache).
export const powerCurveCache = sqliteTable(
  "power_curve_cache",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    window: text("window").notNull(), // '90d' | '1y'
    fetchedOn: text("fetched_on").notNull(), // yyyy-MM-dd dag-bucket
    rawJson: text("raw_json").notNull(), // JSON.stringify({ list, activities })
  },
  (t) => [
    uniqueIndex("power_curve_cache_user_window_unq").on(t.userId, t.window),
  ],
);

// ── Inferred types (voor de Worker in Fase 3+) ───────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Wellness = typeof wellness.$inferSelect;
export type NewWellness = typeof wellness.$inferInsert;
export type PlannerDay = typeof plannerDays.$inferSelect;
export type NewPlannerDay = typeof plannerDays.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type Weekplan = typeof weekplans.$inferSelect;
export type NewWeekplan = typeof weekplans.$inferInsert;
export type Rpe = typeof rpe.$inferSelect;
export type NewRpe = typeof rpe.$inferInsert;
export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
export type DayState = typeof dayState.$inferSelect;
export type NewDayState = typeof dayState.$inferInsert;
export type PowerCurveCache = typeof powerCurveCache.$inferSelect;
export type NewPowerCurveCache = typeof powerCurveCache.$inferInsert;
export type SyncState = typeof syncState.$inferSelect;
export type NewSyncState = typeof syncState.$inferInsert;
