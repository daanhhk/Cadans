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
  coachNaam: text("coach_naam"), // presentatie: header-wordmark (geen engine-input)
  coachPersona: text("coach_persona"), // presentatie: coach-narrative-stijl (geen engine-input)
  naam: text("naam"), // presentatie: user-naam → avatar-initialen (geen engine-input)
  /** T28 fase 1 — globaal beschikbare weekuren (gedeclareerde capaciteit). Voedt in fase 1
   * de FTP-projectie-baseline; GEEN engine-input. */
  weekUren: integer("week_uren"),
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
  /** FASE 3a — per-week goedkeuring van het inhaal-voorstel: de MAANDAG (yyyy-MM-dd) van
   * de week waarvoor de gebruiker akkoord gaf; null = geen goedkeuring. Één waarde per
   * user: de goedkeuring geldt alleen voor die kalenderweek en vervalt vanzelf zodra de
   * getoonde week een andere maandag heeft (M68 — omkeerbaar, en niet stilzwijgend
   * doorlopend). */
  debtOptInWeek: text("debt_opt_in_week"),
  /** 3d stap 4 — per-week goedkeuring van de FATIGUE-shift (mesoWeek-substitutie): de MAANDAG
   * (yyyy-MM-dd) van de goedgekeurde week + de RICHTING. Beide null = geen shift. Spiegelt
   * `debtOptInWeek` (per kalenderweek, vervalt vanzelf, omkeerbaar). */
  fatigueShiftWeek: text("fatigue_shift_week"),
  /** 'up' (deload→normale week, doortrainen) | 'down' (opbouwweek→reduced-load-deload) | null. */
  fatigueShiftDir: text("fatigue_shift_dir"),
  /** ROADMAP stap 2 — de DOSIS-TREDE: het niveau waarop de dosis per sleutelsessie staat.
   * Ontbreekt of null betekent 0, en 0 is byte-identiek aan geen trede (factor 1). Hoort hier
   * en niet in `settings`: `settings` is config die de gebruiker zet, de trede is runtime-state
   * die de blok-check opbouwt. Zie docs/DOSIS-TREDE-RECON.md §7. */
  dosisTrede: integer("dosis_trede"),
  /** De blokstart-MAANDAG (yyyy-MM-dd) waarvoor de trede-vraag beantwoord is. Zowel bevestigen
   * ALS afwijzen schrijft hem, anders komt hetzelfde voorstel elke week terug; de volgende
   * blokgrens stelt de vraag vanzelf opnieuw. Spiegelt `debtOptInWeek`/`fatigueShiftWeek`. */
  dosisTredeBlok: text("dosis_trede_blok"),
  /** Het DOEL waarop de trede is opgebouwd. De minuten per prikkel zijn doel-eigen (FTP 28,
   * Onderhoud 22), dus bij een doel-wissel vervalt de trede in plaats van mee te reizen. */
  dosisTredeDoel: text("dosis_trede_doel"),
  /** ROADMAP punt 9 fase B — het antwoord op de EVENT-OVERNAME: gaat het plan vanaf de
   * acht-wekengrens op het hoofdevent mikken, of maakt het staande doel-blok zich eerst af?
   * De DATUM van het event waarvoor geantwoord is (yyyy-MM-dd).
   *
   * DE EVENT-DATUM IS DE IDENTITEIT, en dat is geen gemakzucht: `EventItem` (het wire-DTO) draagt
   * geen id en `PUT /api/events` is FULL-REPLACE, dus de rij-id's zijn niet stabiel. Verzet Daan
   * het event, dan is dat een NIEUW besluit en hoort de vraag terug te komen — precies wat een
   * datum-sleutel oplevert. Zie docs/EVENT-OVERNAME-BOUWDOC.md §5. */
  eventOvernameEvent: text("event_overname_event"),
  /** De blokstart-MAANDAG (yyyy-MM-dd) waarop het antwoord viel. Draagt de asymmetrie tussen de
   * twee antwoorden: 'ja' geldt tot het event voorbij is en de vraag komt niet terug, 'nee' geldt
   * alleen voor DIT blok en op de volgende blokgrens wordt hij opnieuw gesteld zolang het event
   * binnen acht weken ligt. Spiegelt `dosisTredeBlok`. */
  eventOvernameBlok: text("event_overname_blok"),
  /** 'ja' | 'nee' | null. Exact die twee waarden; de route valideert strikt en normaliseert niet. */
  eventOvernameAntwoord: text("event_overname_antwoord"),
  /** ROADMAP punt 12 — de blokstart-MAANDAG (yyyy-MM-dd) waarvoor de doel-passendheid-vraag
   * beantwoord is. ALLEEN "nee" hoeft bewaard: na "ja" past het doel bij de uren en kan de kaart
   * per constructie niet meer vuren. Spiegelt `dosisTredeBlok`. Zie docs/PUNT12-BOUWDOC.md §5. */
  doelPassendBlok: text("doel_passend_blok"),
  /** Het GENORMALISEERDE doel waarvoor dat antwoord geldt. Het doel staat er expliciet bij zodat
   * een wissel BINNEN hetzelfde blok naar een ander niet-passend doel als NIEUW besluit telt en
   * de vraag terugkomt — anders zou één "nee" het hele blok dichtzetten. Spiegelt
   * `dosisTredeDoel`. */
  doelPassendDoel: text("doel_passend_doel"),
  /** ROADMAP punt 59 — het ANTWOORD op het IJKAANBOD, per doelblok-OPENING. De openingsmaandag
   * (yyyy-MM-dd) waarvoor geantwoord is. Spiegelt `dosisTredeBlok` en `doelPassendBlok`.
   *
   * WAAROM DIT PERSISTENT MOET, en dat is gemeten: tot 23-08-2026 leefde de afwijzing in een
   * module-lokale `Set` in `apps/web/src/components/schema/TestVoorstelCard.tsx`. Die overleeft een
   * remount na sync, maar geen app-herstart — dus na een herstart stond dezelfde vraag er weer,
   * terwijl M92 zegt dat er per opening HOOGSTENS ÉÉN aanbod is.
   *
   * ER ONTBREEKT EEN DOEL-KOLOM, EN DAT IS EEN GEMETEN GAT — geen ontwerpkeuze. De eerste versie
   * van deze docstring stond hier op 23-08-2026 en luidde verbatim: "DE OPENINGSMAANDAG IS DE
   * IDENTITEIT en niet het doel: bij een doelwissel schrijft `blokStartBijDoel` een verse
   * `doelStart`, dus de VOLGENDE opening is per constructie een andere maandag en de vraag komt
   * vanzelf terug. Een doel-kolom zou daar niets toevoegen." De weerleggingspas van diezelfde dag
   * haalde dat onderuit en de hermeting op de echte `blokStartBijDoel` bevestigt het: met een
   * beantwoorde opening op ma 2026-09-21 geeft een doelwissel op ma 21-09, di 22-09 óf wo 23-09
   * opnieuw `doelStart` 2026-09-21 — DRIE van de zeven wisseldagen, want `WISSEL_LAATSTE_DAG = 3`
   * klemt naar de maandag van DEZE week. Het antwoord van het OUDE doel zet dan poort (2b) dicht
   * voor het NIEUWE doel, en er is per besluit van 23-08-2026 geen retry: twaalf weken zonder
   * ijkaanbod. `dosisTredeDoel` en `doelPassendDoel` dragen precies daarvoor een tweede kolom.
   *
   * GEREPAREERD OP 24-08-2026 (ROADMAP punt 64) met de kolom hieronder. Het antwoord telt sindsdien
   * alleen als blok ÉN doel matchen; deze kolom alleen is dus niet meer de identiteit. */
  ijkingBlok: text("ijking_blok"),
  /** ROADMAP punt 64 — het GENORMALISEERDE doel waarvoor het ijkantwoord gegeven is. Spiegelt
   * `doelPassendDoel` en `dosisTredeDoel`, en om precies dezelfde reden.
   *
   * BESLUIT VAN 24-08-2026: een bevestiging geldt voor het DOEL waarvoor zij gegeven is. Wisselt het
   * doel binnen de beantwoorde week, dan vervalt het antwoord en komt de vraag opnieuw. Het is dan
   * een nieuw blok met een nieuwe doelstelling, en één extra tik is goedkoper dan twaalf weken
   * doseren op een waarde die voor dát doel niemand heeft bevestigd.
   *
   * ALLEEN EFFECT-DOELEN LANDEN HIER. De enige schrijver is `TestVoorstelCard`, en die stuurt
   * `voorstel.doel` — dus een waarde die `buildTestVoorstel` heeft teruggegeven. Poort (2) laat
   * `Onderhoud` niet door (`blokCheckEnabled` is false, DOELEN-SPEC §3.2), dus `"Onderhoud"` kan
   * hier per constructie NOOIT in staan. Gemeten in de weerleggingspas van 24-08-2026; het maakt
   * de vier effect-doelen de enige bereikbare waarden.
   *
   * ÉÉN PAAR EN GEEN VERZAMELING, en dat heeft een prijs. Een beantwoord aanbod voor een nieuw doel
   * overschrijft het antwoord van het vorige, dus heen-en-weer wisselen binnen dezelfde
   * openingsweek laat de vraag opnieuw komen op dezelfde openingsmaandag. Zie poort (2b) in
   * `apps/web/src/lib/testvoorstel.ts` voor de meting en ROADMAP punt 64 voor het nakijkpunt.
   *
   * GENORMALISEERD, want de poort vergelijkt genormaliseerd met genormaliseerd. `settings.doel` is
   * vrije tekst in D1 en kan een legacy-waarde dragen ("Beklimmingen", "VO2max"); `normalizeDoel_`
   * vouwt die op een `DOEL_OPTIONS`-waarde. De route valideert daarom STRIKT op `DOEL_OPTIONS` —
   * een legacy-string hoort al genormaliseerd te zijn vóór hij hier aankomt. Zelfde regel als
   * `PUT /api/doel-passend`.
   *
   * NULL IS EEN GELDIGE WAARDE en betekent "er is niets beantwoord" (samen met een lege
   * `ijking_blok`). Een null-doel matcht nooit een gezet doel, dus een oude rij uit de tijd vóór
   * deze kolom onderdrukt niets — dat is de gewenste kant om op te falen. */
  ijkingDoel: text("ijking_doel"),
  /** 'bevestigd' | 'niet_nu' | null. Exact die twee waarden; de route valideert strikt en
   * normaliseert niet. Spiegelt `eventOvernameAntwoord`.
   *
   * DRIE UITGANGEN, TWEE WAARDEN. Inplannen schrijft hier NIETS: dat pad loopt via de bestaande
   * override-keten (`PUT /api/override/:date`), en een geplande test is zichtbaar voor poort (3).
   * Alleen de twee antwoorden die GEEN override opleveren hebben een eigen geheugen nodig.
   *
   * BEVESTIGEN dekt het blok: de app zwijgt de rest van dat doelblok en behandelt de staande
   * drempelwaarde als representatief. NIET-NU laat hem ONGEIJKT (M91) en de app zegt dat. Beide
   * onderdrukken het aanbod voor DIT blok; het verschil zit in wat de app erover vertelt. */
  ijkingAntwoord: text("ijking_antwoord"),
  /** ROADMAP punt 6 fase 2 — de RAUWE `icu_power_zones`-array als JSON-string, afgeleid uit de
   * NIEUWSTE fiets-rit die de activiteiten-sync ophaalt (de bovengrenzen in %FTP, bijvoorbeeld
   * `[55,75,90,105,120,150,999]`). Null = nog nooit een bruikbare rit gezien; de client valt dan
   * terug op `ZONE5_GRENZEN_DEFAULT`.
   *
   * HOORT OP `sync_state`, NIET OP `settings`: `PUT /api/settings` is FULL-REPLACE (`writeSettings`
   * schrijft `?? null` voor élk veld), dus een gesynchroniseerde kolom daar zou bij elke opslag
   * vanuit de Instellingen-pagina leeggemaakt worden. Zie docs/ZONE-SYNC-BOUWDOC.md §3. */
  powerZonesJson: text("power_zones_json"),
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
