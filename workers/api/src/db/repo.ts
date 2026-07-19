/**
 * repo.ts — data-access-laag: Drizzle-queries → EXACT de engine-input-shapes.
 *
 * De pure engine (packages/engine) is de bron van waarheid; deze laag verandert
 * de engine-shapes NOOIT. Elke datum loopt via de conversielaag (dates.ts). Elke
 * functie is user-scoped (userId; v1 = CURRENT_USER_ID).
 *
 * Sync/async: de engine-seam `gatherWeekplanEntries_` roept `readWeekplan(key)`
 * SYNCHROON aan. D1-reads zijn async → we PRE-FETCHEN het venster in een map en
 * geven de engine een sync map-reader (readRecentWeekplans).
 */
import { gatherWeekplanEntries_ } from "@cadans/engine";
import type {
  CheckinInput,
  DayOverride,
  DispositionEntry,
  DispositionReason,
  EventInput,
  EventItem,
  OverrideEntry,
  PlannerDay,
  PlannerDayInput,
  RpeEntry,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { and, asc, eq, gte, isNotNull, lte } from "drizzle-orm";
import type { Db } from "./client";
import { fromD1, toD1Date, toD1DateTime } from "./dates";
import {
  activities,
  checkins,
  dayState,
  events,
  plannerDays,
  powerCurveCache,
  rpe,
  settings,
  syncState,
  weekplans,
  wellness,
} from "./schema";

// Re-export de WIRE-DTO's zodat bestaande consumenten ze uit de repo-laag blijven
// betrekken (routes: CheckinInput; integrations/wellness: WellnessInput).
export type { CheckinInput, WellnessInput };

// ── settings ─────────────────────────────────────────────────────────
// Repo-interne vorm = de WIRE-DTO SettingsInput (@cadans/shared) met doelStart
// als Date i.p.v. ISO-string; de 11 andere velden komen 1-op-1 uit shared.
export type EngineSettings = Omit<SettingsInput, "doelStart"> & {
  doelStart: Date | null;
};

export async function writeSettings(
  db: Db,
  userId: number,
  s: Partial<EngineSettings>,
): Promise<void> {
  const vals = {
    userId,
    ftp: s.ftp ?? null,
    lthr: s.lthr ?? null,
    gewicht: s.gewicht ?? null,
    doel: s.doel ?? null,
    doelStart: s.doelStart ? toD1Date(s.doelStart) : null,
    hrMax: s.hrMax ?? null,
    hrRest: s.hrRest ?? null,
    doelDuur: s.doelDuur ?? null,
    fase: s.fase ?? null,
    profielPreset: s.profielPreset ?? null,
    coachNaam: s.coachNaam ?? null,
    coachPersona: s.coachPersona ?? null,
    naam: s.naam ?? null,
    pendelDuurMin: s.pendelDuurMin ?? null,
    pendelAantal: s.pendelAantal ?? null,
  };
  await db
    .insert(settings)
    .values(vals)
    .onConflictDoUpdate({ target: settings.userId, set: vals });
}

export async function readSettings(
  db: Db,
  userId: number,
): Promise<EngineSettings | null> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId));
  const r = rows[0];
  if (!r) return null;
  return {
    ftp: r.ftp,
    lthr: r.lthr,
    gewicht: r.gewicht,
    doel: r.doel,
    doelStart: r.doelStart ? fromD1(r.doelStart) : null,
    hrMax: r.hrMax,
    hrRest: r.hrRest,
    doelDuur: r.doelDuur,
    fase: r.fase,
    profielPreset: r.profielPreset,
    coachNaam: r.coachNaam,
    coachPersona: r.coachPersona,
    naam: r.naam,
    pendelDuurMin: r.pendelDuurMin,
    pendelAantal: r.pendelAantal,
  };
}

// ── check-in (readiness-seam) — DTO = CheckinInput (@cadans/shared) ─────
export async function writeCheckin(
  db: Db,
  userId: number,
  date: string,
  c: CheckinInput,
): Promise<void> {
  const vals = {
    userId,
    datum: date,
    slaap: c.slaap,
    benen: c.benen,
    stress: c.stress,
    ts: new Date().toISOString(),
  };
  await db
    .insert(checkins)
    .values(vals)
    .onConflictDoUpdate({
      target: [checkins.userId, checkins.datum],
      set: { slaap: c.slaap, benen: c.benen, stress: c.stress },
    });
}

export async function readCheckin(
  db: Db,
  userId: number,
  date: string,
): Promise<CheckinInput | null> {
  const rows = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.userId, userId), eq(checkins.datum, date)));
  const r = rows[0];
  if (!r || r.slaap == null || r.benen == null || r.stress == null) return null;
  return { slaap: r.slaap, benen: r.benen, stress: r.stress };
}

// ── weekplans (JSON-blob per week) ─────────────────────────────────────
export async function writeWeekplan(
  db: Db,
  userId: number,
  weekMonday: string,
  entries: unknown[],
): Promise<void> {
  const vals = {
    userId,
    weekMonday,
    entriesJson: JSON.stringify(entries),
  };
  await db
    .insert(weekplans)
    .values(vals)
    .onConflictDoUpdate({
      target: [weekplans.userId, weekplans.weekMonday],
      set: { entriesJson: vals.entriesJson },
    });
}

export async function readWeekplan(
  db: Db,
  userId: number,
  weekMonday: string,
): Promise<any[] | null> {
  const rows = await db
    .select()
    .from(weekplans)
    .where(
      and(eq(weekplans.userId, userId), eq(weekplans.weekMonday, weekMonday)),
    );
  const entriesJson = rows[0]?.entriesJson;
  if (!entriesJson) return null;
  const parsed = JSON.parse(entriesJson);
  return Array.isArray(parsed) ? parsed : null;
}

/**
 * Recency-venster (het 8-weken-venster): pre-fetch de weken in de map en laat de
 * engine's eigen `gatherWeekplanEntries_` de kalender-terugstap + concatenatie doen
 * via een SYNC map-reader (key = "weekplan_" + yyyy-MM-dd, exact de engine-vorm).
 */
export async function readRecentWeekplans(
  db: Db,
  userId: number,
  baseMonday: Date,
  window = 8,
): Promise<any[]> {
  const oldest = new Date(
    baseMonday.getFullYear(),
    baseMonday.getMonth(),
    baseMonday.getDate() - 7 * (window - 1),
  );
  const lower = toD1Date(oldest);
  const upper = toD1Date(baseMonday);
  const rows = await db
    .select()
    .from(weekplans)
    .where(
      and(
        eq(weekplans.userId, userId),
        gte(weekplans.weekMonday, lower),
        lte(weekplans.weekMonday, upper),
      ),
    );
  const map = new Map<string, any[] | null>();
  for (const r of rows) {
    // Per-key afvangen (GAS doet dat ook: Algorithm.gs:979 `catch → continue`, idem
    // :283 en :1937). Eén corrupte rij mag niet het hele 8-weken-venster laten falen.
    let parsed: unknown = null;
    if (r.entriesJson) {
      try {
        parsed = JSON.parse(r.entriesJson);
      } catch {
        parsed = null;
      }
    }
    map.set(`weekplan_${r.weekMonday}`, Array.isArray(parsed) ? parsed : null);
  }
  const reader = (key: string) => map.get(key) ?? null;
  return gatherWeekplanEntries_(window, baseMonday, reader);
}

// ── activities (17-koloms actValues-rijen = engine-native) ─────────────
// upsert-sleutel = (user_id, activity_id_ext) → mergeById_-idempotentie.
function actValsFromRow(userId: number, row: any[]) {
  const datum =
    row[0] instanceof Date ? toD1DateTime(row[0]) : String(row[0] ?? "");
  const idExt = row[16] != null && row[16] !== "" ? String(row[16]) : null;
  return {
    userId,
    datum,
    type: row[1] ?? null,
    naam: row[2] ?? null,
    duurMin: row[3] ?? null,
    afstandKm: row[4] ?? null,
    gemW: row[5] ?? null,
    normW: row[6] ?? null,
    ifPct: row[7] ?? null,
    tss: row[8] ?? null,
    gemHr: row[9] ?? null,
    maxHr: row[10] ?? null,
    pi: row[11] ?? null,
    ftp: row[12] ?? null,
    gewicht: row[13] ?? null,
    rollingFtp: row[14] ?? null,
    zoneTimesJson: row[15] != null && row[15] !== "" ? String(row[15]) : null,
    activityIdExt: idExt,
  };
}

export async function upsertActivity(
  db: Db,
  userId: number,
  row: any[],
): Promise<void> {
  const vals = actValsFromRow(userId, row);
  await db
    .insert(activities)
    .values(vals)
    .onConflictDoUpdate({
      target: [activities.userId, activities.activityIdExt],
      set: vals, // laatste-wint; target-kolommen naar dezelfde waarde = no-op
    });
}

/** Terug naar de 17-koloms engine-actValues-rij (idx0 = Date, idx15 JSON, idx16 id). */
function rowFromAct(a: any): any[] {
  const r: any[] = new Array(17).fill("");
  r[0] = fromD1(a.datum);
  r[1] = a.type;
  r[2] = a.naam;
  r[3] = a.duurMin;
  r[4] = a.afstandKm;
  r[5] = a.gemW;
  r[6] = a.normW;
  r[7] = a.ifPct;
  r[8] = a.tss;
  r[9] = a.gemHr;
  r[10] = a.maxHr;
  r[11] = a.pi;
  r[12] = a.ftp;
  r[13] = a.gewicht;
  r[14] = a.rollingFtp;
  r[15] = a.zoneTimesJson ?? "";
  r[16] = a.activityIdExt ?? "";
  return r;
}

export async function readActivities(
  db: Db,
  userId: number,
  range?: { from?: string; to?: string },
): Promise<any[][]> {
  const conds = [eq(activities.userId, userId)];
  if (range?.from) conds.push(gte(activities.datum, range.from));
  if (range?.to) conds.push(lte(activities.datum, range.to));
  const rows = await db
    .select()
    .from(activities)
    .where(and(...conds))
    .orderBy(asc(activities.datum));
  return rows.map(rowFromAct);
}

// ── planner_days + events (weekgen-read-laag, Fase 5.3b) ─────────────────
// Datum kruist RAUW (text as-is; GEEN fromD1 — de client parset in 5.3c, spiegelt
// readActivities). train/gedaan: 1 → true, 0/null → false. Overige velden 1-op-1
// (Drizzle levert al camelCase: voorgesteldType/afstandKm/klimType).

/** Planner-dagen van de doelweek [maandag..zondag] (incl.), oudste-eerst. */
export async function readPlannerDays(
  db: Db,
  userId: number,
  mondayISO: string,
): Promise<PlannerDay[]> {
  const mon = fromD1(mondayISO);
  // Zondag = maandag + 6 dagen (DST-veilig via de kalender-constructor).
  const sundayISO = toD1Date(
    new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6),
  );
  const rows = await db
    .select()
    .from(plannerDays)
    .where(
      and(
        eq(plannerDays.userId, userId),
        gte(plannerDays.datum, mondayISO),
        lte(plannerDays.datum, sundayISO),
      ),
    )
    .orderBy(asc(plannerDays.datum));
  return rows.map((r) => ({
    datum: r.datum,
    train: r.train === 1,
    dag: r.dag,
    minuten: r.minuten,
    dagtype: r.dagtype,
    toelichting: r.toelichting,
    voorgesteldType: r.voorgesteldType,
    gedaan: r.gedaan === 1,
  }));
}

/**
 * FULL-REPLACE de beschikbaarheid van een week: upsert per dag op (userId, datum)
 * → idempotent, nooit dupliceren (de 7 datums zijn vast per week). Persisteert ALLEEN
 * de invoervelden; `voorgesteldType` blijft null (generator-output, client herberekent
 * live) en `gedaan` = 0. Een niet-train-dag → minuten/dagtype/toelichting null.
 */
export async function writePlannerDays(
  db: Db,
  userId: number,
  days: PlannerDayInput[],
): Promise<void> {
  for (const d of days) {
    const vals = {
      userId,
      datum: d.datum,
      train: d.train ? 1 : 0,
      dag: null,
      minuten: d.train ? d.minuten : null,
      dagtype: d.train ? d.dagtype : null,
      toelichting: d.train ? d.toelichting : null,
      voorgesteldType: null,
      gedaan: 0,
    };
    await db
      .insert(plannerDays)
      .values(vals)
      .onConflictDoUpdate({
        target: [plannerDays.userId, plannerDays.datum],
        set: vals,
      });
  }
}

/** Alle events van de user, oudste-eerst (eventFase_ selecteert later, 5.3c). */
export async function readEvents(db: Db, userId: number): Promise<EventItem[]> {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(asc(events.datum));
  return rows.map((r) => ({
    datum: r.datum,
    naam: r.naam,
    type: r.type,
    prioriteit: r.prioriteit,
    afstandKm: r.afstandKm,
    hoogtemeters: r.hoogtemeters,
    klimType: r.klimType,
    notitie: r.notitie,
  }));
}

/** FULL-REPLACE alle events van de user: delete-voor-user + batch-insert, atomisch via
 * db.batch. Lege lijst → wist alles. Events kennen geen (user,datum)-unique → delete+insert
 * (i.t.t. writePlannerDays' upsert). datum verbatim TEXT (geen dates.ts-conversie). */
export async function writeEvents(
  db: Db,
  userId: number,
  rows: EventInput[],
): Promise<void> {
  const del = db.delete(events).where(eq(events.userId, userId));
  if (rows.length === 0) {
    await del;
    return;
  }
  const inserts = rows.map((r) =>
    db.insert(events).values({
      userId,
      datum: r.datum,
      naam: r.naam,
      type: r.type,
      prioriteit: r.prioriteit,
      afstandKm: r.afstandKm ?? null,
      hoogtemeters: r.hoogtemeters ?? null,
      klimType: r.klimType ?? null,
      notitie: r.notitie ?? null,
    }),
  );
  await db.batch([del, ...inserts]);
}

/** RPE-registraties van de user, oudste-eerst (datum RAUW; spiegelt readWellness). */
export async function readRpe(db: Db, userId: number): Promise<RpeEntry[]> {
  const rows = await db
    .select()
    .from(rpe)
    .where(eq(rpe.userId, userId))
    .orderBy(asc(rpe.datum));
  return rows.map((r) => ({ datum: r.datum, rpe: r.rpe }));
}

/** RPE-write (rpe_<date> = enkel getal) — spiegelt writeCheckin; upsert op (user_id, datum). */
export async function writeRpe(
  db: Db,
  userId: number,
  date: string,
  value: number,
): Promise<void> {
  await db
    .insert(rpe)
    .values({ userId, datum: date, rpe: value })
    .onConflictDoUpdate({
      target: [rpe.userId, rpe.datum],
      set: { rpe: value },
    });
}

// ── disposition (day_state.disposition — "waarom niet gedaan?"; GAS saveDisposition,
// WebApp.gs:1634) — deelt de (user_id, datum)-rij met override_json. De engine leest dit NIET.
/** Dagen mét een disposition, oudste-eerst (dagen met enkel override_json vallen weg). */
export async function readDispositions(
  db: Db,
  userId: number,
): Promise<DispositionEntry[]> {
  const rows = await db
    .select()
    .from(dayState)
    .where(and(eq(dayState.userId, userId), isNotNull(dayState.disposition)))
    .orderBy(asc(dayState.datum));
  return rows.map((r) => ({
    datum: r.datum,
    reason: r.disposition as DispositionReason,
  }));
}

/** Disposition-write (reason ∈ set OF null=wis). Upsert op (user_id, datum); de conflict-branch
 * zet ALLEEN de disposition-kolom → een bestaand override_json blijft INTACT (non-clobber). */
export async function writeDisposition(
  db: Db,
  userId: number,
  date: string,
  reason: DispositionReason | null,
): Promise<void> {
  await db
    .insert(dayState)
    .values({ userId, datum: date, disposition: reason })
    .onConflictDoUpdate({
      target: [dayState.userId, dayState.datum],
      set: { disposition: reason },
    });
}

// ── override (day_state.override_json — "kies een andere training"; GAS saveDayOverride,
// WebApp.gs:1663) — deelt de (user_id, datum)-rij met disposition. De engine LEEST dit (D2).
/** Dagen mét een override, oudste-eerst. Corrupte override_json per rij → overgeslagen (geen throw). */
export async function readOverrides(
  db: Db,
  userId: number,
): Promise<OverrideEntry[]> {
  const rows = await db
    .select()
    .from(dayState)
    .where(and(eq(dayState.userId, userId), isNotNull(dayState.overrideJson)))
    .orderBy(asc(dayState.datum));
  const out: OverrideEntry[] = [];
  for (const r of rows) {
    if (!r.overrideJson) continue;
    try {
      out.push({
        datum: r.datum,
        override: JSON.parse(r.overrideJson) as DayOverride,
      });
    } catch {
      // corrupte override_json → sla de rij over (geen throw).
    }
  }
  return out;
}

/** Override-write (override ∈ union OF null=wis). Upsert op (user_id, datum); de conflict-branch
 * zet ALLEEN de override_json-kolom → een bestaande disposition op dezelfde rij blijft INTACT. */
export async function writeOverride(
  db: Db,
  userId: number,
  date: string,
  override: DayOverride | null,
): Promise<void> {
  const overrideJson = override ? JSON.stringify(override) : null;
  await db
    .insert(dayState)
    .values({ userId, datum: date, overrideJson })
    .onConflictDoUpdate({
      target: [dayState.userId, dayState.datum],
      set: { overrideJson },
    });
}

// ── debt-opt-in (sync_state.debt_opt_in_week) — FASE 3a ────────────────────
// De per-week goedkeuring van het inhaal-voorstel. Eén waarde per user: de MAANDAG van de
// goedgekeurde week. De client vergelijkt 'm met de maandag van de getoonde week, dus de
// goedkeuring vervalt vanzelf zodra er een nieuwe week begint — geen opruim-job nodig.

/** De goedgekeurde week-maandag (yyyy-MM-dd), of null. */
export async function readDebtOptIn(
  db: Db,
  userId: number,
): Promise<string | null> {
  const rows = await db
    .select({ week: syncState.debtOptInWeek })
    .from(syncState)
    .where(eq(syncState.userId, userId))
    .limit(1);
  return rows[0]?.week ?? null;
}

/** Zet (monday) of wist (null) de goedkeuring. Upsert: sync_state heeft één rij per user,
 * en de conflict-branch raakt ALLEEN deze kolom → de sync-velden blijven intact. */
export async function writeDebtOptIn(
  db: Db,
  userId: number,
  monday: string | null,
): Promise<void> {
  await db
    .insert(syncState)
    .values({ userId, debtOptInWeek: monday })
    .onConflictDoUpdate({
      target: syncState.userId,
      set: { debtOptInWeek: monday },
    });
}

// ── wellness (WELL_HEADERS 12-kol) — DTO = WellnessInput (@cadans/shared) ─
// WellnessInput = de WIRE-vorm (datum als ISO-string); de repo-vorm heeft datum
// als Date. vorm = ctl−atl (bij sync).
export type WellnessRecord = Omit<WellnessInput, "datum"> & { datum: Date };

export async function upsertWellness(
  db: Db,
  userId: number,
  row: WellnessInput,
): Promise<void> {
  const vals = {
    userId,
    datum: toD1Date(fromD1(row.datum)), // via dates.ts (normaliseert kale datum)
    rhr: row.rhr,
    hrv: row.hrv,
    slaapU: row.slaapU,
    slaapScore: row.slaapScore,
    readiness: row.readiness,
    mood: row.mood,
    weightKg: row.weightKg,
    ctl: row.ctl,
    atl: row.atl,
    vorm: row.vorm,
    ramp: row.ramp,
  };
  await db
    .insert(wellness)
    .values(vals)
    .onConflictDoUpdate({
      target: [wellness.userId, wellness.datum],
      set: vals, // laatste-wint; target-kolommen naar dezelfde waarde = no-op
    });
}

/** Wellness-rijen oudste-eerst; datum via dates.ts → echte Date. */
export async function readWellness(
  db: Db,
  userId: number,
): Promise<WellnessRecord[]> {
  const rows = await db
    .select()
    .from(wellness)
    .where(eq(wellness.userId, userId))
    .orderBy(asc(wellness.datum));
  return rows.map((r) => ({
    datum: fromD1(r.datum),
    rhr: r.rhr,
    hrv: r.hrv,
    slaapU: r.slaapU,
    slaapScore: r.slaapScore,
    readiness: r.readiness,
    mood: r.mood,
    weightKg: r.weightKg,
    ctl: r.ctl,
    atl: r.atl,
    vorm: r.vorm,
    ramp: r.ramp,
  }));
}

/**
 * Glue (Worker-laag, NIET de engine): WellnessRecord[] → de 12-koloms
 * WELL_HEADERS-array-vorm die `dashVormReeks_` verwacht. idx0 = Date; lege
 * waarden → "" (Sheet-conventie: dashVormReeks_ test op `=== ""`), zodat een
 * latere consumptie-port dit 1-op-1 hergebruikt.
 * idx: 0 Datum · 1 RHR · 2 HRV · 3 Slaap(u) · 4 Slaap-score · 5 Readiness ·
 *      6 Mood · 7 Weight(kg) · 8 CTL · 9 ATL · 10 Vorm · 11 Ramp.
 */
export function wellnessRowsToWellValues_(rows: WellnessRecord[]): any[][] {
  const b = (x: any) => (x == null ? "" : x);
  return rows.map((r) => [
    r.datum,
    b(r.rhr),
    b(r.hrv),
    b(r.slaapU),
    b(r.slaapScore),
    b(r.readiness),
    b(r.mood),
    b(r.weightKg),
    b(r.ctl),
    b(r.atl),
    b(r.vorm),
    b(r.ramp),
  ]);
}

// ── power_curve_cache (RAW respons per window; pcNormalize_ op read) ────
export async function upsertPowerCurveCache(
  db: Db,
  userId: number,
  window: string,
  fetchedOn: string,
  rawJson: string,
): Promise<void> {
  const vals = { userId, window, fetchedOn, rawJson };
  await db
    .insert(powerCurveCache)
    .values(vals)
    .onConflictDoUpdate({
      target: [powerCurveCache.userId, powerCurveCache.window],
      set: { fetchedOn, rawJson },
    });
}

export async function readPowerCurveCache(
  db: Db,
  userId: number,
  window: string,
): Promise<{ fetchedOn: string; raw: any } | null> {
  const rows = await db
    .select()
    .from(powerCurveCache)
    .where(
      and(
        eq(powerCurveCache.userId, userId),
        eq(powerCurveCache.window, window),
      ),
    );
  const r = rows[0];
  if (!r) return null;
  let raw: any = null;
  try {
    raw = JSON.parse(r.rawJson);
  } catch {
    raw = null;
  }
  return { fetchedOn: r.fetchedOn, raw };
}
