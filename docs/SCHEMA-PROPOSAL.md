# Cadans — D1 Schema Proposal (Fase 2a recon)

**Status: VOORSTEL ter review — nog GEEN implementatie.** Geen Drizzle, geen
SQL, geen migraties. Dit doc ontwerpt het D1-schema dat de pure engine
(`packages/engine`, 886/0) voedt. Bron voor datashapes = `daanhhk/training`
(Apps Script, read-only). Inferenties/onzekerheden zijn expliciet gemarkeerd
met **[verify]**.

---

## 1. Engine-input-contract — WAT het schema moet voeden

### 1.1 Publieke entry-points (uit `packages/engine`)

| Entry-point | Input-shape (kern) | Output-shape (kern) |
|---|---|---|
| `assignWorkouts(days, settings, mesoWeek, macroFase, dekking, wellness, klimType, recentHardDate, debt, isTripEvent, taperCtx, weekDays)` | `days`=array van dag-objecten `{dagIdx, dag, datum(Date), train, minuten, type, gedaan, voorgesteldType}`; `settings`; `dekking={low,high,anaerobic}` | **void** — muteert `days` in-place (zet `voorgesteldType`, `archetypeId`, `reden`, `sessies`) |
| `allocateQualityWeek_(days, profiel, macroFase, dekking, recency, recentHardDate, debt, settings, today, taperActief, taperCtx, weekDays)` | idem + `recency`-array + `debt={low,high,anaerobic}` | plan-object gekeyd op dagIdx `{role, type, archetypeId}` |
| `buildWorkout(type, mins, settings, mesoWeek, macroFase, eventCtx, slot, archetypeId?)` | `settings={ftp,lthr,doel,…}` | workout `{naam, focus, zones, totaalMin, structuur, intent{low,high,anaerobic}, tss, blokken, eindopmerking, archetypeId?}` |
| `keyIntensity(doel, macroFase, dekking, klimType, isTripEvent, ctx?)` | `ctx={beschikbareTijd, recency, settings, out}` | type-string (+ zet `ctx.out.archetypeId`) |
| `goalWorkout_(profiel, fase, beschikbareTijd, recency, dekking?, V?)` | `V`=weekuren | `{type, archetypeId}` \| null |
| `getReadinessScore_(fs, wellness, reeks, checkin?)` | `fs={form,ctl,atl,ramp}`, `wellness={hrvDeficit,hrvRecent,sleepAvg3,sleepLastNight}`, `reeks=[{vorm}]`, `checkin={slaap,benen,stress}\|null` | `{score, band, factors[], chips[], checkinDone, checkinDelta, checkinSummary, checkin}` |
| `gatherWeekplanEntries_(horizonWeeks, baseMonday, readWeekplan)` | `readWeekplan(key)→array\|null` | geconcateneerde weekplan-entries → `recencyFromWeekplan_` → `[{intent, archetypeId}]` |
| `getTrainingLibrary_(settings)` | `settings={ftp,lthr,doel,doelStart}` | 6 categorieën `[{key,type,variants[]}]` |
| `computeMacroPhase(startDate, today)` | 2×Date | `{week, fase, isTestWeek}` |
| `eventFase_(events, refDate)` | `events=[{datum(Date), prioriteit, type, naam, klimType?}]` | `{fase, macroFase, hoofdEvent, taperEvent, taperVenster, dagenTot, wekenTot}` |
| `computeNiveau_(ftp, gewicht)` · `computeMacroPhase` · dash-calc (`dashStatsFromActivities_`, `dashActualsByDate_`, `dashNiveauReeks_`, `dashBeginAnker_`, `eftpFromActivities_`, `ctlReeksMaandelijks_`, `niveauProgressie_`) · powercurve (`pcNormalize_`, `riderTypeFromCurve_`) · projectie (`goalGap_`, `ctlApproachWeeks_`, `ftpBandFromProjection_`) | `actValues`=array van **17-koloms** activiteit-rijen (zie §2), `settings`, `wellness` | niveau/stats/curve/projectie-objecten |

### 1.2 Injecteerbare seams (Fase 1b — Worker moet deze in Fase 3 vullen)

| Seam | Vorm | Bron in D1 |
|---|---|---|
| **check-in** | `getReadinessScore_(…, checkin)`, `checkin={slaap,benen,stress}\|null` | `checkins`-tabel (per dag) |
| **weekplan-reader** | `gatherWeekplanEntries_(…, readWeekplan)`, `readWeekplan(key)` → **reeds-geparste array** `[{datum, workoutType, archetypeId, …}]` \| null; `key = "weekplan_" + yyyy-MM-dd(maandag)` | `weekplans`-tabel |
| **gewicht** | `niveau.setGewichtProvider(fn)`, `fn()→number` (default 0) — per-maand-fallbackgewicht in `dashNiveauReeks_` | `settings.gewicht` (of laatste `activities.gewicht`) |
| **loadCarry / mesoFactor** | nu geneutraliseerd (×1); toekomstige param op `mesoFactor(week)` | `sync_state.load_carry` (durable runtime) |

### 1.3 Historie-venster

- **Recency (weekplan-snapshot):** `RECENCY_HORIZON_WEEKS = 8` weken. `gatherWeekplanEntries_` stapt per week 7 dagen terug vanaf `baseMonday`; key = `weekplan_<maandag yyyy-MM-dd>`.
- **Activiteiten (niveau/PMC/powercurve/stats):** volledige historie; bron-app leest **730 dagen** (`ACT_HISTORY_DAYS`). PMC-tau = 42d.
- **Wellness/vorm-reeks:** meegereden met de activiteiten-/wellness-historie (dagelijks).

---

## 2. Huidige stores → shapes (uit `training`, read-only)

### 2.1 Sheet-tabbladen

| Tab (const) | Kolommen (header-constant, in volgorde) | Durable? |
|---|---|---|
| **Activiteiten** (`ACT_HEADERS`, 17 kol) | idx0 Datum · 1 Type · 2 Naam · 3 Duur(min) · 4 Afstand(km) · 5 Gem W · 6 Norm W · 7 IF(=%) · 8 TSS · 9 Gem HR · 10 Max HR · 11 PI · 12 FTP · 13 Gewicht · 14 Rolling FTP · **15 Zone-tijden(JSON)** · **16 Activiteit-ID** | durable |
| **Wellness** (`WELL_HEADERS`, 12 kol) | Datum · RHR · HRV · Slaap(u) · Slaap-score · Readiness · Mood · Weight(kg) · CTL · ATL · Vorm · Ramp | durable |
| **Weekplanner** (`PLANNER_HEADERS`, 8 kol; `readPlanner` A3:H9) | Train?(A) · Dag(B) · Datum(C) · Minuten(D) · Dagtype(E) · Toelichting(F) · Voorgesteld type(G) · Gedaan?(H). Dagtype ∈ `pendel/vrij/weekend/recovery` | durable (user-input) |
| **Events** (`EVENT_HEADERS`, 8 kol) | Datum · Naam · Type · Prioriteit · Afstand km · Hoogtemeters · Klim-type · Notitie. Type ∈ `trip/race`, Prio ∈ `A/B/C`, Klim ∈ `lang/kort/gemengd/vlak` | durable |
| **Instellingen** (`SETTINGS_DEFAULTS`, key-value) | ftp · hr_max · hr_rest · lthr · threshold_pace · doel · doel_start · doel_duur · fase · intervals_athlete_id · email_digest · gewicht · profiel_preset · ftp_auto_update · weight_auto_update · ftp_last_sync · weight_last_sync · pendelDuurMin · pendelAantal | durable |
| Zones / Doel / Voorstel / Audit | render/log-tabs (afgeleid; geen aparte engine-input) | display → **niet persisteren** (afgeleid) |

### 2.2 DocumentProperties (durable K/V)

| Key-formaat | Value-shape | Durable? |
|---|---|---|
| `weekplan_<maandag yyyy-MM-dd>` | `JSON.stringify([{datum, workoutType, archetypeId, naam, variantId, zones[], intent{low,high,anaerobic}, blokken[]\|null, structuur[]\|null, tss, minuten, reden, sessies:[{naam,totaalMin,tss,intent,eindopmerking}]}])` | **durable** (niet gewist door `cleanupOldProposals_`) |
| `rpe_<yyyy-MM-dd>` | `String(rpe)` — enkel getal | **durable** (nooit gewist) |
| `checkin_<yyyy-MM-dd>` | `JSON.stringify({slaap, benen, stress, ts(ISO)})` | **durable** |
| `proposal_<yyyy-MM-dd>[_s<n>]` | `JSON.stringify(workout)` (sessie 1 = basiskey; n≥2 = `_s<n>`) | **VOLATILE** — `cleanupOldProposals_` wist ALLE `proposal_*` bij elke `generateProposal`. **NIET persisteren.** |
| `last_sync`, `mesoWeek`, `loadCarry`, `events_json`, `pattern`, `sweet_spot_min/max`, `api_power_zones/hr_zones`, settings-mirror (ftp/lthr/gewicht/doel/…) | scalaire/JSON | durable (runtime-state) |
| `override_<dISO>`, `disposition_<dISO>` | JSON (dag-actie-overrides) | durable (app-niveau) |

**Bevestigd:** `proposal_*` is regeneratie-output (volatile) → nooit in D1; wordt door de engine on-demand herbouwd (evt. Worker-KV-cache).

---

## 3. Voorgesteld D1-schema

**Principes:** `user_id` op ELKE tabel (multi-user-ready; **v1 hardcoded op één
user**, bv. `user_id = 1`). Alleen **durable** stores persisteren
(activiteiten, wellness, planner-input, events, settings, weekplan-snapshot,
rpe, check-in, runtime-state). `proposal_*` NIET (regenerated). Google-Sheet-
render-tabs (Zones/Doel/Voorstel/Audit) NIET (afgeleid).

| Tabel | Kolommen (type) | PK / FK / Index | Map van |
|---|---|---|---|
| **users** | id (INTEGER PK), email (TEXT), intervals_athlete_id (TEXT), created_at (TEXT) | PK id | (nieuw; v1 = 1 rij) |
| **settings** | user_id (INTEGER), ftp, hr_max, hr_rest, lthr (INTEGER); threshold_pace (TEXT); doel (TEXT); doel_start (TEXT/date); doel_duur (INTEGER); fase (TEXT); gewicht (REAL); profiel_preset (TEXT); pendel_duur_min (INTEGER); pendel_aantal (INTEGER); ftp_auto_update, weight_auto_update (INTEGER/bool); email_digest (TEXT) | **PK user_id**, FK→users | Instellingen-tab |
| **activities** | id (INTEGER PK), user_id, datum (TEXT date), type (TEXT), naam (TEXT), duur_min (INTEGER), afstand_km (REAL), gem_w (INTEGER), norm_w (INTEGER), if_pct (REAL), tss (INTEGER), gem_hr (INTEGER), max_hr (INTEGER), pi (REAL), ftp (INTEGER), gewicht (REAL), rolling_ftp (INTEGER), zone_times_json (TEXT), activity_id_ext (TEXT) | PK id; FK→users; **UNIQUE(user_id, activity_id_ext)** (upsert = `mergeById_`); **INDEX(user_id, datum)** | Activiteiten-tab (idx0-16) |
| **wellness** | id (PK), user_id, datum (TEXT), rhr (INTEGER), hrv (REAL), slaap_u (REAL), slaap_score (INTEGER), readiness (INTEGER), mood (TEXT), weight_kg (REAL), ctl (REAL), atl (REAL), vorm (REAL), ramp (REAL) | PK id; FK→users; **UNIQUE(user_id, datum)**; INDEX(user_id, datum) | Wellness-tab |
| **planner_days** | id (PK), user_id, datum (TEXT), train (INTEGER/bool), dag (TEXT), minuten (INTEGER), dagtype (TEXT), toelichting (TEXT), voorgesteld_type (TEXT), gedaan (INTEGER/bool) | PK id; FK→users; **UNIQUE(user_id, datum)**; INDEX(user_id, datum) | Weekplanner-tab |
| **events** | id (PK), user_id, datum (TEXT), naam (TEXT), type (TEXT), prioriteit (TEXT), afstand_km (REAL), hoogtemeters (INTEGER), klim_type (TEXT), notitie (TEXT) | PK id; FK→users; INDEX(user_id, datum) | Events-tab |
| **weekplans** | user_id, week_monday (TEXT date), entries_json (TEXT) | **PK(user_id, week_monday)**; FK→users | DocProp `weekplan_<monday>` (matcht `readWeekplan(key)→array` 1-op-1) |
| **rpe** | user_id, datum (TEXT), rpe (INTEGER) | **PK(user_id, datum)**; FK→users | DocProp `rpe_<date>` |
| **checkins** | user_id, datum (TEXT), slaap (TEXT), benen (TEXT), stress (TEXT), ts (TEXT) | **PK(user_id, datum)**; FK→users | DocProp `checkin_<date>` (readiness-seam) |
| **day_state** | user_id, datum (TEXT), override_json (TEXT), disposition (TEXT) | **PK(user_id, datum)**; FK→users | DocProp `override_<dISO>` / `disposition_<dISO>` |
| **sync_state** | user_id (PK), last_sync (TEXT), meso_week (INTEGER), load_carry (REAL), ftp_last_sync (TEXT), weight_last_sync (TEXT) | PK user_id; FK→users | DocProps `last_sync`/`mesoWeek`/`loadCarry`/… |

**Belangrijkste ontwerpkeuze:** `weekplans.entries_json` als JSON-blob per week
i.p.v. genormaliseerde `weekplan_day`-rijen — het matcht de
`readWeekplan(key)→array`-seam exact (geen re-assembly), en het weekplan-entry
is een geneste snapshot (`sessies`/`blokken`/`structuur`). **Alternatief
[verify met Daan]:** normaliseren naar `weekplan_days(user_id, week_monday,
datum, workout_type, archetype_id, tss, minuten, …)` als de UI per-dag-queries
wil; dan blijft `entries_json` optioneel voor de geneste velden. Zelfde
JSON-blob-afweging geldt voor `activities.zone_times_json` (bewust een blob:
alleen de engine leest 'm via `zoneTimesFromCell_`).

**NIET gepersisteerd:** `proposal_*` (volatile/regenerated), Zones/Doel/
Voorstel/Audit (render/log), secrets (→ Worker-env, niet D1).

---

## 4. Verify-tegen-live-Sheet

Shape-details die alleen 100% zeker zijn uit de LIVE Sheet (code geeft de naam/
index, niet per se de cel-realiteit):

1. **Weekplanner kolomvolgorde B/C/G** — `readPlanner` leest expliciet A(0)/D(3)/
   E(4)/F(5)/H(7); Dag(B)/Datum(C)/Voorgesteld type(G) zijn uit `PLANNER_HEADERS`
   afgeleid, niet uit een index-read. **[verify]** exacte kolom-order.
2. **Instellingen tab-layout** — de *keys* staan in `SETTINGS_DEFAULTS`, maar de
   key→rij/cel-mapping (welke rij welke setting) leeft in de Sheet. **[verify]**
   bij de eerste data-migratie.
3. **Activiteiten cel-types** — `idx0 Datum` is een Date-object en `idx7 IF` is
   een **percentage** (77, niet 0.77) blijkens `activityToRow_`; bevestig dat de
   live tab geen stringified datums/decimalen bevat. **[verify]**
4. **Weekplan-entry geneste velden** (`sessies`/`blokken`/`structuur`) — vorm uit
   de `generateProposal`-schrijver; een live DocProp-dump bevestigt of alle
   velden altijd aanwezig zijn (sommige zijn `null`-baar). **[verify]**
5. **Zones-tab** (power/HR-zonegrenzen) — niet direct engine-input, maar voedt
   `settings`-afgeleiden; schema-impact pas relevant als de Worker zones opslaat.
   **[verify / defer]**

> De data-migratie Sheet→D1 is een aparte, mens-geverifieerde stap (HANDOFF) en
> blokkeert de schema-bouw (Fase 2) niet.
