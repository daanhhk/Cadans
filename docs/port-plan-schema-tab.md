# Porteerplan — weekgeneratie + readiness-derivatie (Schema-tab)

> Read-only recon-deliverable. GEEN implementatie in deze sessie. Bron van waarheid:
> `packages/engine/src/*` (Cadans) + `C:\Users\daan\Projects\training\src\*.gs` (oude GAS-app,
> ALLEEN gelezen). Line-nummers zijn bij lezen geverifieerd; onzekerheden staan expliciet als **[?]**.

## 1. Scope & doel

**Waarom.** De Schema-tab (voorstel/weekplan) is de laatste grote PWA-tab en leunt op twee
subsystemen uit de oude app die nog NIET in Cadans zitten: (A) de **weekgeneratie-orkestratie**
en (B) de **readiness-input-derivatie**. (B) blokkeert óók de Vorm-tab: de `ReadinessCard`-score
+ waarom-factoren zijn nu placeholder (debt (h)) omdat de afgeleide inputs ontbreken.

**Kernbevinding (bepaalt de scope):** de PURE reken-brains zijn AL geport naar `@cadans/engine` —
`assignWorkouts`, `buildWorkout`, `allocateQualityWeek_`, `goalWorkout_`, `keyIntensity`,
`workoutZones`, `expandArchetype_`, `getReadinessScore_`, enz. Wat ontbreekt is de **COUPLED
orkestratie** (in GAS: `generateProposal` + `getWellnessSignal`/`getFormScore_` + de coverage/debt-prep)
die in de oude app uit Google Sheets/DocProps las. In Cadans moet die orkestratie HERBOUWD worden
bovenop D1 (repo-laag) + client-side, niet de engine opnieuw geport.

**WEL porten/bouwen:**
- De readiness-input-derivatie: één pure engine-functie (`getWellnessSignal`-equivalent) + het
  samenstellen van `fs` uit de wellness-reeks. → ontgrendelt de echte readiness-score in Vorm.
- De weekgen-prep als pure engine-functies: coverage (`rollingZoneCoverage`), zone-debt
  (`computeZoneDebt_`), laatste-harde-dag (`recentHardDayDate_`).
- Twee nieuwe D1-repo-reads + routes: `planner_days` (Weekplanner-input) en `events`.
- De `generateProposal`-orkestratie als een Worker-route (of client-pipeline): D1 lezen →
  inputs assembleren → `assignWorkouts` + `buildWorkout` aanroepen → weekplan teruggeven.

**NIET in scope:** de pure engine opnieuw porten (staat er al); de Sheet-tab-renderers
(`renderProposal`), Telegram, ZWO/Garmin-push, e-mail; de per-sessie-DocProp-persistentie 1-op-1
(Cadans persisteert via `weekplans`-tabel). De Fase-2-Niveau-stubs (power-curve/projectie) blijven los.

## 2. Cadans-baseline — bestaande bouwstenen (herbruikbaar, NIET dupliceren)

### 2.1 Al geport in `@cadans/engine` (pure, named exports)
Weekgen-brain (`packages/engine/src/planner.ts` tenzij anders): `assignWorkouts` (:475),
`buildWorkout` (:1413), `allocateQualityWeek_` (:173), `keyIntensity` (:802), `climbTypeWorkout_`
(:858), `snapshotDayAction_` (:67), `effectiveMacroFase_` (:87), `debtPreferredType_` (:95),
`demoteType_` (:786), `doelKey` (:790), `weekIndexFromStart_` (:886), `gatherWeekplanEntries_`
(:454), plus alle generieke workout-builders + variant-pools. Archetypes
(`packages/engine/src/archetypes.ts`): `expandArchetype_` (:45), `profileForDoel_` (:1220),
`goalWorkout_` (:1313), `goalPickIntent_` (:1272), `goalEffWeights_` (:1229), `volumeModulatie`
(:1243), `recencyFromWeekplan_` (:1378). Fase (`phase.ts`): `eventFase_` (:96), `computeMacroPhase`
(:31), `pickMainEvent_` (:63). Zones (`zones.ts`): `workoutZones` (:219), `tssFromZoneMinutes_`
(:210), `zoneActsByDateFromTab_` (:102). Utils: `mesoFactor` (`utils.ts:48`). Coach (`coach.ts`):
`coachFeedback_`, `coachAlignment_`, `readinessAdjust_`, `readinessRegel_`. Readiness
(`readiness.ts`): `getReadinessScore_` (:69), `checkinDelta_` (:51), `checkinSummary_` (:62).
Niveau (`niveau.ts`): `dashVormReeks_` (:190), `dashStatsFromActivities_` (:247),
`computeConditieMod_` (:854).

Provider-seams: `setGewichtProvider` (`niveau.ts:23`) — patroon voor injecteerbare IO. `mesoFactor`
gebruikt intern `loadCarry` (in Cadans geneutraliseerd ×1 — debt (b)).

### 2.2 Client-side aanroeppatroon (bewezen, Fase 5.2)
`apps/web/src/pages/Niveau.tsx` importeert de engine (named imports uit `@cadans/engine`) en draait
de derivaties CLIENT-SIDE in een `useMemo`: `parseActivityRows` (idx0 ISO→lokale Date, filtert
Invalid Date), dan `setGewichtProvider(() => settings.gewicht)`, dan de engine-fns. **In de browser
is ambient `new Date()`/`formatDate` = user-lokale TZ = Amsterdam = correct** → omzeilt de
UTC-deploy-debt (d). Dit is het aanbevolen uitvoeringsmodel (zie §6).

### 2.3 Beschikbare data/routes (`workers/api`)
Repo-reads (`workers/api/src/db/repo.ts`): `readSettings` (:67), `readCheckin` (:117),
`readWeekplan` (:152), `readRecentWeekplans` (:174), `readActivities` (:272), `readWellness` (:323),
`readPowerCurveCache` (:392). Routes (`routes/api.ts`): `GET /api/settings`, `GET /api/wellness`
(oudste-eerst), `GET /api/activities` (17-koloms matrix, idx0 ISO-datetime-string), `GET/PUT
/api/checkin/:date`, `GET /api/weekplans/recent`, `GET /api/weekplan/:monday`, `POST /api/sync/*`.
Wire-types (`packages/shared`): `SettingsInput`, `WellnessInput`, `CheckinInput`,
`ActivitiesResponse`, `WeekplanEntries`/`WeekplanPutBody`, `ApiError`/`ApiOk`.
D1-tabellen aanwezig maar ZONDER read-route/-repo: `planner_days`, `events`, `sync_state`.

## 3. Bron-inventaris oude app (geverifieerd; C:\Users\daan\Projects\training\src)

### 3.1 Weekgeneratie — orkestratie (COUPLED, niet geport)
`generateProposal()` (`Algorithm.gs:75`) — top-level, geen args, side-effects. Stappen:
(1) cleanup oude proposals; (2) `readSettings` + sync/reconcile; (3) `weekStart =
weekStartDate(new Date())`, `macro = bepaalFaseVoorDatum_(weekStart)`, `mesoWeek = getMesoWeek()`;
(4) `loadCarry`-DocProp zetten; (5) `days = readPlanner(ss)` + `wellness =
combineSignals_(getWellnessSignal(ss), rpeSignal_())`; (6) split days in voltooid/missed/tePlannen
op `today = stripTime_(new Date())`; (7) `dekking {low,high,anaerobic}` uit `rollingZoneCoverage(ss,7)`
+ actuals van voltooide dagen (≥`DEKKING_MIN_MIN=15` min), `debt` uit `computeZoneDebt_`; (8)
`taperCtx` uit `macro`; (9) **`assignWorkouts(tePlannen, settings, mesoWeek,
effectiveMacroFase_(macro.macroFase,settings), dekking, wellness, klimType, recentHard, debt,
isTripEvent, taperCtx, days)`**; (10) per dag `buildWorkout(...)` → sessies → persist. Datum/TZ:
ambient `new Date()` ×2 + `formatDate`/`weekStartDate`.

`assignWorkouts(days, settings, mesoWeek, macroFase, dekking, wellness, klimType, recentHardDate,
debt, isTripEvent, taperCtx, weekDays)` — **AL geport** (planner.ts:475). Muteert per toekomstige dag
`voorgesteldType/reden/archetypeId`. `days`-element: `{dagIdx, dag, train, datum(Date), minuten,
type, notitie, voorgesteldType, gedaan}`. `wellness` heeft `.signal` (`'recovery'|'demote'|null`)
nodig; `dekking`/`debt` = `{low,high,anaerobic}`; `taperCtx = {datum,venster,isTrip}|null`.

Prep-functies (COUPLED in GAS — lezen Activiteiten-tab; kern is PUUR over de actValues-matrix):
- `rollingZoneCoverage(ss, 7)` (`Algorithm.gs:300`) → `dekking {low,high,anaerobic}` (bool) uit de
  zone-minuten van de laatste 7 dagen (via `icu_zone_times` idx15).
- `computeZoneDebt_(ss, weekStart)` (`Algorithm.gs:492`) → `debt {low,high,anaerobic}` (minuten) =
  geplande intent (weekplan-DocProp) − actuals deze week.
- `recentHardDayDate_(ss)` (`Algorithm.gs:336`) → laatste harde activiteit-datum.
`readPlanner(ss)` (`Planner.gs:396`) leest `Weekplanner!A3:H9`: A=train(bool), C=datum(Date),
D=minuten, E=type(`pendel/vrij/weekend/recovery`), F=notitie, G=voorgesteldType, H=gedaan(bool).
`bepaalFaseVoorDatum_` (`Doel.gs:346`, COUPLED) → `eventFase_` (PURE-kern, geport) → macroFase/taper.

### 3.2 Readiness-derivatie (COUPLED, niet geport)
`getReadinessScore_(fs, wellness, reeks)` — **AL geport** (Cadans `readiness.ts:69`; check-in in
Cadans als 4e param i.p.v. de GAS-DocProp-read). Verwacht:
- `fs` = `{ ctl, atl, form, ramp }` (form = ctl−atl = TSB). GAS-bron: `getFormScore_`.
- `wellness` = `{ hrvDeficit, hrvRecent, sleepAvg3, sleepLastNight }`. GAS-bron: `getWellnessSignal`.
- `reeks` = `[{ …, vorm }]` (oudste→nieuwste) — enkel voor de vorm-trend-richting. Cadans:
  `dashVormReeks_`.

`getWellnessSignal(ss, wellValues)` (`Algorithm.gs:1251`, **niet geport**) → `{ hrvBaseline,
hrvRecent, hrvDeficit, sleepLastNight, sleepAvg3, signal, reason }`. Leest per rij `r[2]`=HRV,
`r[3]`=Slaap(u). Logica: `hrvBaseline = avg(hrv[0..28])`, `hrvRecent = avg(hrv[0..3])`,
`sleepLastNight = sleep[0]`, `sleepAvg3 = avg(sleep[0..3])`, `hrvDeficit = round((hrvRecent −
hrvBaseline)/hrvBaseline × 100)`. Signal-cascade (eerste hit): sleep<5→`recovery`; hrvDeficit<−10 &
sleepAvg3<6→`recovery`; (hrvDeficit<−10 OR sleepLastNight<6)→`demote`; (hrvDeficit<−5 OR
sleepLastNight<7)→`warning`; else `normal`. **⚠ De slices `[0..3]`/`[0..28]` gaan uit van
NIEUWSTE-EERST.**

`getFormScore_(wellValues)` (`Algorithm.gs:1337`, **niet geport**) → `{ ctl, atl, form, ramp }` uit de
rij met de MAX datum die CTL+ATL heeft (`w[8]`=CTL, `w[9]`=ATL, `w[11]`=Ramp, form = ctl−atl). In
Cadans triviaal te vervangen: de laatste `/api/wellness`-rij heeft al `ctl/atl/vorm/ramp`.

## 4. Gap-analyse (concreet — debts (a) weekgen, (h) readiness)

| Bouwsteen | Status in Cadans |
|---|---|
| `assignWorkouts` + hele workout-brain | ✅ geport (planner/archetypes/zones) |
| `getReadinessScore_` + `checkinDelta_` | ✅ geport (readiness.ts) |
| `eventFase_`/`computeMacroPhase`/`weekIndexFromStart_`/`mesoFactor` | ✅ geport |
| `dashVormReeks_` (→ `reeks`) | ✅ geport (niveau.ts) |
| `zoneActsByDateFromTab_`/`tssFromZoneMinutes_` (zone-minuten uit actValues) | ✅ geport (zones.ts) |
| **`getWellnessSignal`** (hrvDeficit/hrvRecent/sleepAvg3/sleepLastNight/signal) | ❌ MISSING → **debt (h)** |
| **`fs`-assembly** (form/ctl/atl/ramp uit laatste wellness-rij) | ❌ MISSING (triviaal) |
| **`rollingZoneCoverage`** (dekking) | ❌ MISSING → **debt (a)** |
| **`computeZoneDebt_`** (debt) | ❌ MISSING → **debt (a)** |
| **`recentHardDayDate_`** (laatste harde dag) | ❌ MISSING → **debt (a)** |
| **`generateProposal`-orkestratie** (D1→assignWorkouts→buildWorkout→weekplan) | ❌ MISSING → **debt (a)** |
| **repo-read + route: `planner_days`** (Weekplanner-input) | ❌ MISSING |
| **repo-read + route: `events`** | ❌ MISSING |

**Debt (h) — readiness:** enkel `getWellnessSignal` + de `fs`-assembly ontbreken. `fs` + `reeks`
komen uit `/api/wellness` (Cadans-`wellness` heeft ctl/atl/vorm/ramp/hrv/slaapU per dag);
`getReadinessScore_` + `checkinDelta_` staan er al. → KLEIN.
**Debt (a) — weekgen:** de brain staat er, maar de INPUT-assemblage ontbreekt: 3 pure prep-functies +
2 D1-reads/routes + de orkestratie. → MIDDELGROOT (veel bewegende inputs, geen nieuwe reken-logica).

## 5. Beoogde `@cadans/engine`-API (voorstel — pure named exports)

Alle nieuwe engine-fns PUUR (geen DB/fetch/DocProp), client-side aanroepbaar, TZ via ambient
(browser = Amsterdam) of injecteerbare `now`. Signatures (voorstel; namen spiegelen de GAS-bron):

Readiness-derivatie (readiness.ts of een nieuwe `wellsignal.ts`):
```
// wellRows = wellness NIEUWSTE-EERST (of intern reverse); numeriek hrv/slaapU.
export function wellnessSignal_(wellRows: WellRow[]): {
  hrvBaseline: number|null; hrvRecent: number|null; hrvDeficit: number|null;
  sleepLastNight: number|null; sleepAvg3: number|null;
  signal: 'recovery'|'demote'|'warning'|'normal'; reason: string;
}
export function formStateFromWellness_(wellRows: WellRow[]): { ctl,atl,form,ramp } | null
```
Weekgen-prep (planner.ts of een nieuwe `proposal.ts`):
```
export function rollingZoneCoverage_(actValues, todayISO, days=7): { low,high,anaerobic } // bool
export function zoneDebt_(plannedIntent, actValues, weekMondayISO): { low,high,anaerobic } // min
export function recentHardDate_(actValues, doel): Date | null
```
Orkestratie — GEEN engine-functie maar een Worker-route (aanbevolen) of client-pipeline:
```
buildWeekProposal(input): { days:[{dagIdx,datum,voorgesteldType,reden,archetypeId,workout}], weekMonday }
// input geassembleerd uit D1: settings, plannerDays, events, activities, recente weekplans.
// intern: eventFase_ → macroFase/taperCtx/klimType; weekIndexFromStart_ → mesoWeek;
// rollingZoneCoverage_/zoneDebt_/recentHardDate_ → dekking/debt/recentHard;
// wellnessSignal_ → wellness.signal; assignWorkouts(...) ; per dag buildWorkout(...).
```
Nieuwe D1-laag (`workers/api`): `readPlannerDays(db,userId,weekMonday)` (planner_days-tabel),
`readEvents(db,userId)` (events-tabel) + `GET /api/planner?monday=` + `GET /api/events`. Wire-types
in `packages/shared`: `PlannerDay`, `EventItem`, `ProposalDay`/`ProposalWeek`.

**Provider-patroon:** houd `now` injecteerbaar (param, default ambient) i.p.v. een globale seam —
consistenter dan `setGewichtProvider` en TZ-veiliger onder test.

## 6. TZ/Amsterdam-raakvlakken + borging

- De engine leunt op ambient TZ (`new Date(y,m,d)` lokale-middernacht, `formatDate` lokale getters).
  CLIENT-SIDE (browser = Amsterdam) is dit correct → **voer de proposal-derivatie client-side uit**
  (zoals Niveau/Vorm), of pin de Worker-runtime-TZ. Een Worker-route zou debt (d) ráken tenzij de
  runtime-TZ gepind wordt of `now` expliciet wordt doorgegeven.
- **Nieuwste-eerst-ordening (load-bearing):** `getWellnessSignal`'s `slice(0,3)/slice(0,28)` gaan uit
  van nieuwste-eerst; Cadans `readWellness` levert OUDSTE-eerst. Het port MOET de reeks omkeren of
  vanaf het eind slicen — anders inverteren baseline/recent. Dek dit met een test.
- `dates.ts`-grens (`fromD1`/`toD1Date`) alleen als data via de Worker loopt; client-side parse
  spiegelt dit al (`parseActivityRows`).
- Tests draaien onder `TZ=Europe/Amsterdam` (root `pnpm test`), zoals de bestaande suite.

## 7. Testplan

- **Engine-selftests (harde 886-teller ophogen).** De baseline `it("exactly 886 assertions")` is een
  VLOER; nieuwe pure fns voegen asserts toe → nieuw hard totaal (bv. 886 → 886+N). Test in
  `packages/engine/src/selftest.test.ts`-stijl met fixtures.
- `wellnessSignal_`: baseline/recent/deficit-rekenwerk; de 4 signal-drempels (recovery/demote/warning/
  normal); nieuwste-eerst-ordening; nulls (geen HRV/slaap → null-velden, signal `normal`); < 3 rijen.
- `formStateFromWellness_`: laatste-rij-selectie, form = ctl−atl, ramp; lege reeks → null.
- `rollingZoneCoverage_`/`zoneDebt_`/`recentHardDate_`: bekende actValues-fixture (idx15 zone-times) →
  verwachte buckets; lege/niet-fiets-activiteiten; `DEKKING_MIN_MIN`-grens.
- `getReadinessScore_` end-to-end met de nieuwe derivatie-outputs (oracle: identiek aan de directe
  fixture, zoals de bestaande Fase-3a-oracles).
- **apps/web vitest** (project "web"): een `buildWeekProposal`-integratietest met gemockte D1-reads →
  assignWorkouts-uitkomst; parse-edge-cases. Vitest-totaal stijgt bovenop de huidige 98.
- Edge cases: lege planner-week, geen events (fixed-meso via `computeMacroPhase`), taper-venster,
  debt-forcering, avoid-consecutive-hard.

## 8. Omvang, complexiteit & bouwvolgorde

**Kritiek pad + afhankelijkheden.** `wellness.signal` (uit `wellnessSignal_`) is een INPUT van
`assignWorkouts` → readiness ligt óók op het weekgen-pad. Aanbevolen volgorde:

1. **Readiness-derivatie (debt (h)) — KLEIN, hoogste ROI.** `wellnessSignal_` + `formStateFromWellness_`
   in de engine + client-wiring in Vorm's `ReadinessCard` (vervangt de placeholder-score). Ontgrendelt
   Vorm-Fase-2 én levert `wellness.signal` voor weekgen. Laag risico, veel testdekking.
2. **Weekgen-prep (debt (a), deel 1) — pure fns.** `rollingZoneCoverage_`/`zoneDebt_`/`recentHardDate_`
   (consumeren de al-geporte `zoneActsByDateFromTab_`/`tssFromZoneMinutes_`). Los testbaar.
3. **D1-inputlaag.** `readPlannerDays`/`readEvents` + `GET /api/planner`/`GET /api/events` + shared
   wire-types. Voegt ook een schrijf-pad toe voor de Weekplanner-input (buiten scope hier).
4. **Orkestratie `buildWeekProposal` (debt (a), deel 2).** Rijgt 1–3 + de geporte brain aaneen; per-dag
   `buildWorkout`; resultaat naar de `weekplans`-tabel (bestaand). Client-side of TZ-gepinde Worker.
5. **Schema-tab UI (apps/web)** tegen `buildWeekProposal` — design uit `design/src/schema.jsx`.

**Open vragen / risico's.**
- **[?]** `eventFase_`-taper-window-rekenwerk (`Doel.gs:225`, A=7d/B=3d per CLAUDE.md) — geport, maar de
  Events-tabel-kolommen + de `klimType`-afleiding voor Cadans verifiëren.
- **[?]** `readSettings`-shape voor de brain vs de Cadans-`SettingsInput` (doel/doelStart/pendel* zijn er;
  profiel-preset-volumewaarden verifiëren).
- **mesoWeek:** GAS gebruikt de DocProp `mesoWeek` (`getMesoWeek`); Cadans heeft `weekIndexFromStart_`
  (uit doelStart) + `sync_state.meso_week` (ongebruikt). Kies één bron.
- **Recency-seed:** `gatherWeekplanEntries_`/`recencyFromWeekplan_` draaien al op `readRecentWeekplans`
  (Fase 3a) — hergebruik die pre-fetch-map-reader.
- **`loadCarry` = ×1** (debt (b)): `mesoFactor` neutraliseert de load-carry; check of dat voor het
  echte voorstel acceptabel is of dat `sync_state.load_carry` gevuld moet worden.
- **users-FK (debt (m)):** een echte deploy heeft user-bootstrap nodig vóór schrijf-paden werken.
