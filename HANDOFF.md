# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**Fase 5 — DE PWA (`apps/web`) — IN UITVOERING (shell + Vorm-lite KLAAR).**
Faithful 1-op-1 port van de bestaande tabs tegen de bestaande `/api`-routes;
`react-router-dom` **7.18.1** (`BrowserRouter`), bottom-nav **Schema · Vorm ·
Trainingen · Niveau**. Schema/Trainingen/Niveau = "binnenkort"-placeholder; **Vorm
= gevuld**. Vitest ongewijzigd **94** (apps/web heeft nog geen tests → typecheck +
build dekken de PWA); engine **886/0**. CI groen op elke sub-fase.

- **5.0 design-import** (commit `5359198`): het cadans-handoff-pakket staat nu in
  **`cadans/design/`** (geïmporteerd uit training's untracked
  `design_handoff_cadans/` — de visuele autoriteit: `src/tokens.css`,
  JSX-prototypes, `docs/`, screenshots, merk-assets). Biome sluit `design/` uit
  (`biome.json` `files.includes` → `"!**/design"`); buiten elke tsconfig + vite-build.
- **5.1.0 @cadans/shared** (commit `40e7fc3`): nieuw **types-only** workspace-package
  (source-resolved via `exports`, geen build/runtime-output, GEEN Drizzle, geen
  deps) = bron van waarheid voor de HTTP-wire-DTO's: `SettingsInput`,
  `WellnessInput`, `CheckinInput`, `ActivityCell`/`ActivityRow`/`ActivitiesResponse`,
  `WeekplanEntries`/`WeekplanPutBody`, `ApiError`/`ApiOk`. Datumvelden = ISO
  `"yyyy-MM-dd"`. `workers/api` consumeert ze; `EngineSettings`/`WellnessRecord`
  houden intern **Date** (afgeleid via `Omit<…> & {…: Date}`). NB:
  `ActivitiesResponse`/weekplan-types zijn gedefinieerd maar nog NIET
  server-afgedwongen (de activities-route retourneert nog `any[][]`).
- **5.1a app-shell** (commit `64d5f0f`, CI-fix `773a036`): getypeerde app + mobiel-only
  full-viewport frame (dark, geen device-bezel) + bottom-nav; de Vite-template-CSS
  eruit, `tokens.css` in **`apps/web/src/styles/tokens.css`**, globaal geïmporteerd.
  **Same-origin mount (Model A)** in `workers/api/wrangler.jsonc`: `assets` =
  `{ directory: "../../apps/web/dist", binding: "ASSETS", not_found_handling:
  "single-page-application", run_worker_first: ["/api/*"] }` → Cloudflare doet de
  SPA-fallback, `/api/*` gaat naar de Hono-Worker; `app.onError`/`notFound`
  ONAANGEROERD (JSON-404 voor `/api`-mismatch). `ASSETS?: Fetcher` (optioneel) op
  `IntervalsEnv`. **Dev:** `apps/web` vite (`host:true`, poort **5173**,
  `server.proxy` `/api` → `127.0.0.1:8787`) + `workers/api` `"dev": "wrangler dev
  --port 8787"`. **Gate-nuance:** root `"test"` draait `scripts/ensure-web-dist.mjs`
  (stub `apps/web/dist/index.html`, door `pnpm build` overschreven) omdat
  vitest-pool-workers `assets.directory` eager valideert en de gate-order test→build is.
- **5.1b Vorm-lite** (commit `597fce2`): de Vorm-tab gevuld — `ReadinessCard` ·
  `LevelCard` · `MetricRow` · `ConditiePmc` + ochtend-check-in-sheet. **LIVE 1:1 uit
  `/api`:** Vorm/HRV-chips, W/kg (`ftp/gewicht`), FTP, Gewicht, TSB/CTL/ATL + 12-wk
  PMC-lijn (handmatige SVG), check-in (GET+PUT `/api/checkin/:date`). Client-datum via
  **`apps/web/src/lib/dates.ts` `todayIso()`** (lokale datum, GEEN UTC). TSB-zones
  **−10/+5** (Oververmoeid/Productief/Fris) uit `design/src/conditie.jsx` (de engine
  heeft geen TSB-zonefunctie). **Placeholder/deferred:** ReadinessCard-score +
  waarom-factoren (debt (h)), tier-chip + "sinds"-delta, Week-TSS, W/kg-over-tijd-grafiek.

**Volgende (Fase 5.2) — de volgende tab.** Advieskader: **Vorm/Niveau vóór Schema**
— Schema leunt op de nog-niet-geporte **weekgeneratie** (debt (a)/(d):
`assignWorkouts`/`generateProposal`) + **readiness** (debt (h)); **Trainingen** vergt
eerst duidelijkheid of er een workouts-route/-bron is. **Niveau** is grotendeels
buildbaar (snapshot/progressie uit settings + wellness/activities); charting-lib-keuze
+ engine-client-side (bv. `niveauTier_`) = te beslissen bij Niveau.

**Fase 4 — WORKER-ROUTES (Hono) — KLAAR.** Getypeerde Hono-app
(`new Hono<{ Bindings: IntervalsEnv }>()`) met `app.onError` + `app.notFound`
(consistente JSON-errors), alle routes onder `/api`, `userId = CURRENT_USER_ID`
(=1). Vitest **70 → 94**; engine-selftest ONVERANDERD **886/0**. Drie sub-fases,
CI groen op elk:

- **Reads** (D1, TZ-veilig; Date-output via `toD1Date`/`toD1DateTime`) — commit
  `56e64cc`, `test/routes.reads.test.ts` (8): `GET /api/health` → `{ok,service}`;
  `GET /api/settings`; `GET /api/wellness`; `GET /api/activities` (opt
  `?from=&to=` yyyy-MM-dd); `GET /api/weekplans/recent` (`?monday=` verplicht,
  `?weeks=` default 8); `GET /api/weekplan/:monday`; `GET /api/checkin/:date`.
- **Syncs** (POST; intervals in CI gemockt via `fetchMock` uit `cloudflare:test`;
  leunen op ambient-now → debt (d)) — commit `9ac6c36`,
  `test/routes.sync.test.ts` (6): `POST /api/sync/activities` (`?days=` default
  28); `POST /api/sync/wellness` (`?days=` default 60); `POST /api/sync/power-curve`
  (`?window=90d|1y` default 1y); `GET /api/power-curve` (`?window=`;
  normalize-on-read; cache-hit binnen dezelfde now-dagbucket = geen refetch).
- **Writes** (PUT, D1; body = gevalideerde client-input) — commit `21d5bb9`,
  `test/routes.writes.test.ts` (10): `PUT /api/settings`; `PUT /api/checkin/:date`;
  `PUT /api/weekplan/:monday`.

**⚠️ KOP-OP voor Fase 5 (client-contract):**
- `PUT /api/settings` is **FULL-REPLACE**, geen partial-merge: weggelaten velden
  → `null`. De PWA MOET altijd het VOLLEDIGE `EngineSettings`-object sturen (alle
  12 velden), nooit een delta. Een veld clearen = het weglaten; een expliciete
  `null` in de body geeft 400.
- `PUT /api/checkin/:date` verwacht `{slaap,benen,stress}` — alle drie verplicht
  (string).
- `PUT /api/weekplan/:monday` verwacht `{ entries: [...] }`, as-is als JSON-blob
  opgeslagen (geen shape-eisen op de entries).

**Fase 3c — WELLNESS- + POWER-CURVE-SYNC COMPLEET (lokaal).** Beide auth-paden
hergebruiken `intervalsBasicAuth` + FetchImpl-injectie uit `intervals.ts`;
gemockt in CI, smokes lokaal-only apart (niet in de gate). Vitest **64 → 70**;
engine-selftest ONVERANDERD **886/0**. D1-schema nu **12 tabellen** (was 11 —
`power_curve_cache` erbij).

_3c-1 wellness-sync_ (commit `17d378fc`): `GET
/athlete/{id}/wellness?oldest&newest` → D1-tabel `wellness`. Nieuw:
`workers/api/src/integrations/wellness.ts` (`fetchWellness`, `mapWellness`,
`syncWellness`). `repo.ts` uitgebreid: `upsertWellness` (ON CONFLICT
user_id,datum), `readWellness` (oudste-eerst, datum via `fromD1`),
`wellnessRowsToWellValues_` (12-koloms glue-array voor `dashVormReeks_`;
idx0=Date, idx8/9/10=CTL/ATL/Vorm). Mapping: slaap sec→u =
`round(sleepSecs/360)/10`, vorm = ctl−atl, afronding conform training's
`syncWellness` (ctl/atl/vorm 1 dec, ramp 2 dec). Idempotent op
UNIQUE(user_id, datum); oracle-test bewijst de round-trip via `dashVormReeks_`.
Tests `workers/api/test/wellness.test.ts` (mapping/idempotentie/oracle); smoke
`scripts/wellness-smoke.mjs`.

_3c-2 power-curve RAW-cache_ (commit `094e574`): nieuwe D1-tabel
`power_curve_cache` (`user_id`, `window`, `fetched_on`, `raw_json`,
UNIQUE(user_id, window)); `fetched_on` = dag-bucket via `dates.ts` (= impliciete
24h-TTL). Migratie `0001_magical_lady_mastermind.sql` LOKAAL geapplied; **remote
D1 NIET geapplied**. Nieuw: `workers/api/src/integrations/powercurve.ts`
(`fetchPowerCurve`, `syncPowerCurve`, `readNormalizedPowerCurve`). ARCHITECTUUR:
de Worker cachet de RAUWE `{list, activities}`; `pcNormalize_` draait op ELKE
read; genormaliseerde output wordt NOOIT gecachet. Endpoint
`/athlete/{id}/power-curves?type=Ride&curves=<window>`, window `90d|1y` (default
`1y`), start/end genegeerd. c-input = `raw.list[0]` direct; ftp uit
`readSettings().ftp` (settings HEEFT ftp → gewired, geen risico meer), weight uit
`c.weight`. `repo.ts`: `upsertPowerCurveCache`, `readPowerCurveCache`. Tests
`workers/api/test/powercurve.test.ts` (cache-round-trip/dag-bucket-TTL/
`pcNormalize_`-oracle); smoke `scripts/powercurve-smoke.mjs`.

**Fase 3b — INTERVALS.ICU ACTIVITEITEN-SYNC GEPORT (lokaal).**
`workers/api/src/integrations/intervals.ts`: `fetchActivities` +
`syncActivities(env, userId, opts)` — HTTP Basic auth
`base64("API_KEY:"+key)`, `GET /athlete/{id}/activities?oldest&newest`, sorteert
oudste-eerst, normaliseert via de engine's `activityToRow_` (ONGEWIJZIGD), en
`upsertActivity` (idempotent op UNIQUE(user_id, activity_id_ext)). Alle datums
via `dates.ts`. Key UITSLUITEND uit `env.INTERVALS_API_KEY` (niets gehardcode).
CI-tests zijn GEMOCKT (fetch-mock → D1, geen echte key); een lokale-only smoke
(`scripts/intervals-smoke.mjs`, NIET in de gate) doet één echte call. Remote D1
`database_id` = `aa302c17-915b-44cb-8823-89c416974f50` ingevuld in
`wrangler.jsonc`. Test-count: **64 passed** (6 files) — engine 886/0 ongewijzigd.

**WORKERD-TZ-PROBE (deploy-blocker-diagnose):** de LOKALE/CI miniflare-workerd
HONOREERT `Europe/Amsterdam` (erft de `TZ`-env van de cross-env-pin: janOffset
−60, julOffset −120) → de integratietests draaien TZ-correct. **MAAR** een
GEDEPLOYDE Cloudflare Worker draait **UTC-only** (geen TZ-env-controle) →
datum-gevoelige engine-entrypoints (weekgeneratie) diveregeren daar. **Conclusie:
de TZ-expliciete engine-refactor (debt (d)) is een BEVESTIGDE deploy-blocker** —
niet nu opgelost.

**Fase 3a — DATA-ACCESS-LAAG (D1 ↔ pure engine) COMPLEET (lokaal).** In
`workers/api/src/db`: een repo-laag (`repo.ts`) die Drizzle-queries EXACT naar/uit
de engine-input-shapes mapt, met een centrale TZ-conversielaag (`dates.ts`:
`fromD1`/`toD1Date`/`toD1DateTime`, spiegelt de engine's `new Date(y,m,d)` +
`formatDate` onder de Amsterdam-pin). User-scoped via `CURRENT_USER_ID = 1`
(vervalt in de auth-fase). Geïmplementeerde seams: `readSettings`/`writeSettings`,
`readCheckin`/`writeCheckin` (readiness-seam), `readWeekplan`/`writeWeekplan`,
`readRecentWeekplans` (8-weken-venster via de engine's `gatherWeekplanEntries_` +
een PRE-FETCHED sync map-reader — lost de sync/async-mismatch op),
`upsertActivity` (idempotent op UNIQUE(user_id, activity_id_ext) = mergeById_-
equivalent), `readActivities` (→ 17-koloms actValues). De engine (packages/engine)
is ONAANGEROERD — de repo-laag verandert de shapes niet.

**Test-infra:** `@cloudflare/vitest-pool-workers@0.8.71` (vitest-3.2-compatibel;
0.16+/0.18 vereist vitest 4) draait Worker-integratietests tegen een echte lokale
D1 (miniflare); de drizzle-migratie wordt per test-worker toegepast
(`applyD1Migrations`). Root `pnpm test` draait nu 3 vitest-projecten: **engine**
(node, 886/0 ongewijzigd), **api-unit** (node, TZ-conversie-DST-tests), en
**api-integration** (workers-pool, D1). Nieuwe test-count: **61 passed** = engine
886/0 (51 blokken) + 3 TZ-unit + 6 repo-integratie + 1 D1-smoke.
**Engine-als-oracle bewezen:** de D1-round-trip (check-in → `getReadinessScore_`;
`readRecentWeekplans` → `gatherWeekplanEntries_`/`recencyFromWeekplan_`) geeft
identieke engine-output als de directe fixture. Lokale gate groen.

Nog open voor **Fase 3b:** intervals.icu-port (activiteiten/wellness-sync) +
remote D1 aanmaken (Daan: `wrangler d1 create cadans` + `database_id`).

**Fase 2 — D1-SCHEMA + EERSTE MIGRATIE COMPLEET (lokaal).** Drizzle
sqlite-core-schema (`workers/api/src/db/schema.ts`) met de **11 tabellen** uit
`docs/SCHEMA-PROPOSAL.md`: `users`, `settings`, `activities`, `wellness`,
`planner_days`, `events`, `weekplans`, `rpe`, `checkins`, `day_state`,
`sync_state`. `user_id` op elk (FK→users; v1 hardcoded op één user); `weekplans`
= JSON-blob per week; `proposal_*` NIET gepersisteerd (volatile); zone-/
sweet-spot-grenzen bewust weggelaten (engine leidt ze af uit ftp/lthr —
Fase-2b-recon). Migratie `drizzle/0000_redundant_maginty.sql` LOKAAL geapplied
(miniflare D1, `pnpm --filter @cadans/api db:migrate:local`) — alle 11 tabellen
bevestigd via `db:verify:local`, geen proposal-tabel. **Remote D1 nog NIET
aangemaakt:** Daan draait `wrangler d1 create cadans` en vult `database_id` in
`workers/api/wrangler.jsonc` in (apart moment; de placeholder blokkeert de
lokale flow niet). Baseline vitest ongewijzigd **886/0**.

**Fase 1 — PURE ENGINE GEPORT + SelfTest → vitest COMPLEET.** De pure
trainings-engine is uit `daanhhk/training` (Apps Script) gekamd naar
`packages/engine` als TypeScript met ES-exports, en `SelfTest.gs` is 1-op-1
naar vitest geport. **Nieuwe baseline vitest = 886/0**, met de assert-telling
HARD afgedwongen op exact 886 (`it("exactly 886 assertions")`). Lokale gate
groen (lint + typecheck + test + build).

Engine-layout (`packages/engine/src`): `utils` · `zones` · `archetypes` ·
`coach` · `readiness` · `phase` · `sync` · `niveau` · `planner` ·
`workouts/{ftp,vo2max,conditie,beklimmingen}` + barrel `index.ts`. Alleen de
PURE functies (geen GAS-global, geen externe state) zijn geport; de coupled
orchestratie (`generateProposal`, `getDashboardState`, IntervalsApi, Sync-IO,
Telegram, Sheet-tab-builders) blijft in `training` tot latere fases.

**TZ-pin (node-vs-V8-fidelity):** de engine gebruikt ambient TZ
(`new Date(y,m,d)` local-midnight, `formatDate`); daarom draait de suite onder
`cross-env TZ=Europe/Amsterdam vitest run` (lokaal Windows + CI Linux), en is
`formatDate` getrouw herbouwd (local getters onder de TZ-pin, gelijk aan
`Utilities.formatDate(x, 'Europe/Amsterdam', fmt)`). `Logger.log` → weggelaten.

**Storage-port ("data-in") van de 2 externe-state-testblokken:**
`getReadinessScore_` krijgt de check-in als 4e param (i.p.v. `getTodayCheckin_`
DocProp-read); `gatherWeekplanEntries_` krijgt een `readWeekplan(key)`-reader
(i.p.v. `PropertiesService`). Beide test-neutraal (SelfTest gaf al 3/geen
data mee). `mesoFactor`'s `loadCarry`-DocProp is naar neutraal (×1) gelift.

**Geflagd vervolg (latere fase):** de datum-functies TZ-EXPLICIET maken
(param i.p.v. ambient); `niveau.getGewicht()` is nu een injecteerbare seam
(`setGewichtProvider`, default 0 — alleen per-maand-fallback, suite-neutraal);
de engine-`any`-typing aanscherpen (biome relaxeert var/any-port-regels enkel
voor `packages/engine/**`).

_Fase 0 (scaffold) blijft groen. NB: pnpm 11.9 vereist Node ≥ 22.13 → CI +
lokaal draaien Node 24._

## Stack

- pnpm workspaces, TypeScript strict, vitest, Biome (lint+format),
  GitHub Actions CI. Node >= 22 (CI + lokaal = Node 24; pnpm 11.9 vloer).
- **packages/engine** — pure TS (geen DB/env/fetch).
- **packages/shared** — types-only HTTP-wire-DTO's (geen runtime, geen Drizzle).
- **apps/web** — Vite + React + `react-router-dom` + vite-plugin-pwa
  (PWA-shell + Vorm-lite).
- **workers/api** — Hono + Drizzle op D1 (schema + repo-laag + `/api`-routes +
  same-origin assets-binding).

## Léán scope (v1)

- **Geen auth** deze fase.
- Schema wordt **multi-user-ready** (`user_id` op elke tabel); in v1
  hardcoded op één user.

## Roadmap

| Fase | Inhoud | Status |
|---|---|---|
| 0 | monorepo-scaffold | ✓ |
| 1 | engine-transplant + 886 SelfTest → vitest | ✓ |
| 2 | D1-schema / Drizzle | ✓ |
| 3a | data-access-laag (D1 ↔ engine) + TZ-conversie + Worker-integratietests | ✓ |
| 3b | intervals.icu activiteiten-sync + remote D1 (`database_id`) | ✓ |
| 3c | wellness- + power-curve-sync (engine heeft beide nodig) | ✓ |
| 4 | Worker-API (Hono routes: reads/syncs/writes) | ✓ |
| 5 | React-PWA — shell + Vorm-lite ✓; Schema/Trainingen/Niveau volgen | ◐ |
| 6 | telegram-webhook | |

## Discipline

- **Gate** = `pnpm lint + typecheck + test + build` groen ÉN CI groen.
- PR-based review.
- Forward-only migraties.
- Secrets extern (Worker-env / `wrangler secret`), NOOIT in de repo.
- HANDOFF-fetch = pinned RAW url op commit-hash.

## Data-migratie

Sheet → D1 + cutover = aparte, mens-geverifieerde stap. Blokkeert de bouw
NIET.

## Deferred debts

Open schulden die bewust naar een latere fase zijn geschoven:

- **(a) Engine type-hardening.** De engine is een getrouwe 1-op-1 port (`var`/
  `any` behouden); Biome relaxeert de port-regels (noExplicitAny, noVar-achtige,
  isFinite, ongebruikte params) enkel voor `packages/engine/**`. Een aparte pass
  scherpt de typing aan (echte interfaces i.p.v. `any`) en her-enabled de regels.
- **(b) Engine-input-seams die de Worker (Fase 3) moet vullen.** De pure engine
  krijgt zijn IO via injecteerbare seams: **check-in** (`getReadinessScore_(…,
  checkin)`), **weekplan-reader** (`gatherWeekplanEntries_(…, readWeekplan)`),
  **gewicht** (`setGewichtProvider`), en **loadCarry/mesoFactor** (nu
  geneutraliseerd op ×1). Fase 3a WIRET de **check-in**- en **weekplan**-seams
  via de repo-laag (D1). RESTEREND: **gewicht** (Worker moet `setGewichtProvider`
  aanroepen met de D1-waarde) en **loadCarry** (nog ×1) — te vullen in Fase 3b/4.
  Zie `docs/SCHEMA-PROPOSAL.md` §1.2.
- **(c) Puurheid-boundary-check in CI.** Nog toe te voegen: een mechanische
  check die faalt zodra `packages/engine` een GAS/IO-global of externe-state-
  read binnensluipt (bv. grep/lint-regel op `SpreadsheetApp`/`PropertiesService`/
  `fetch`/`process.env` in de engine). Borgt de puurheid die de vitest-gate nu
  impliciet aanneemt.
- **(d) Datum-functies TZ-expliciet — BEVESTIGDE DEPLOY-BLOCKER (Fase 3b-probe).**
  De engine leunt op ambient TZ. De workerd-TZ-probe
  (`test/workerd-tz-probe.test.ts`) toont: LOKAAL/CI honoreert workerd de
  `Europe/Amsterdam`-pin (erft de TZ-env), MAAR een gedeployde Cloudflare Worker
  draait UTC-only. Vóór het deployen van datum-gevoelige entrypoints
  (weekgeneratie): geef de engine-datum-logica een expliciete TZ-parameter i.p.v.
  ambient. Datumvrije paden (readiness) + string-round-trips zijn TZ-veilig en
  kunnen eerder deployen. **BLIJFT open (Fase 3c):** de power-curve-**dag-bucket**
  is nu TZ-expliciet via `dates.ts` (goed), maar de datum-gevoelige
  **weekgeneratie** leunt nog op ambient `Europe/Amsterdam` → moet TZ-expliciet
  vóór deploy. **VERFIJND (Fase 4):** de sync-routes + `GET /api/power-curve`
  leunen op ambient-now; de routes geven BEWUST geen `now`/`fetchImpl` door
  (productie = global fetch) → onder een gedeployde UTC-Worker schuiven de
  dag-buckets/vensters. De pure-D1-**reads én writes** zijn TZ-veilig
  (caller-supplied datums via `dates.ts`). De **weekgeneratie**
  (`assignWorkouts`/`generateProposal`) is nog NIET geport → de zwaarste
  ambient-afhankelijkheid, latere fase. Vóór prod-deploy: runtime-TZ pinnen of
  `now` expliciet doorgeven.
- **(e) D1-TEXT-datum → Date-mapping — GEDEELTELIJK OPGELOST (Fase 3a).** De
  conversielaag `workers/api/src/db/dates.ts` (`fromD1`/`toD1Date`/`toD1DateTime`)
  is geïmplementeerd + getest (incl. DST-grenzen) en wordt door de repo-laag
  gebruikt. RESTEREND: wanneer de **Worker** in Fase 4 een DATUM-gevoelig
  engine-entrypoint (weekgeneratie) in workerd aanroept, moet de workerd-runtime
  onder `Europe/Amsterdam` draaien (of de engine TZ-expliciet worden — debt (d)),
  want de engine's EIGEN datum-logica leunt nog op ambient TZ. De Fase-3a-oracle
  vermijdt dit bewust via de datumvrije readiness-seam + TZ-invariante
  string-round-trips.
- **(f) Remote D1 — OPGELOST (Fase 3b).** `database_id`
  `aa302c17-915b-44cb-8823-89c416974f50` staat in `workers/api/wrangler.jsonc`.
  Nog niet gemigreerd/geseed op remote (dat is een deploy-stap, Fase 4+); de
  lokale --local/miniflare-flow gebruikt de binding-naam, niet dit id.
- **(g) Remote-D1-migratie-drift — NIEUW (Fase 3c).** `power_curve_cache`
  (migratie `0001_magical_lady_mastermind.sql`) is LOKAAL geapplied, remote NIET.
  Pre-deploy vereist een expliciete remote migratie-apply
  (`wrangler d1 migrations apply --remote`). Bewuste drift, geen fout.
- **(h) Wellness→readiness-afleiding — NIEUW (deferred).** `getReadinessScore_`
  (engine, `readiness.ts`) verwacht AFGELEIDE input: `fs.{form,ctl,atl,ramp}` +
  `wellness.{hrvDeficit,hrvRecent,sleepAvg3,sleepLastNight}`. Die afleiding
  (HRV-deficit vs baseline, slaap-gemiddelden, form-state) zit nog in de coupled
  orchestratie in `training` en is niet geport. De D1-`wellness`-tabel is de bron;
  de afleiding is een aparte port (richting Fase 4+). De check-in
  (`{slaap,benen,stress}`) is de LOSSE 4e param en staat los van wellness. **In de
  PWA (Fase 5.1b)** zijn de ReadinessCard-**score** + waarom-factoren daarom
  placeholder; de Vorm/HRV-chips + de conditie-balans tonen wél live wellness-data.
- **(i) NULL→""-conventie bij de readiness-port — NIEUW (notitie).**
  `wellnessRowsToWellValues_` dekt de ""-conventie correct voor idx0/8/9/10 (wat
  `dashVormReeks_` leest). Bij de readiness-port bevestigen dat NULL→"" óók klopt
  voor idx5/6 (readiness, mood), die vaker leeg zijn.
- **(j) Assets-binding + mount — OPGELOST IN CONFIG (Fase 5.1a).** De
  same-origin-keuze is gemaakt: `workers/api/wrangler.jsonc` heeft nu een
  `assets`-binding (Model A: `directory ../../apps/web/dist`, `binding ASSETS`,
  `not_found_handling "single-page-application"`, `run_worker_first ["/api/*"]`) →
  PWA + Worker op één origin, geen CORS nodig. RESTEREND: de echte **prod-deploy**
  is nog niet gedaan (blijft gegated door debt (d)/(g)).
- **(k) Vorm-lite deferred-onderdelen + apps/web-teststrategie — NIEUW (Fase 5.1b).**
  In de PWA-Vorm-tab zijn nog deferred: de ReadinessCard-**score** + waarom-factoren
  (debt (h)), de `LevelCard`-**tier-chip** + "sinds"-delta, de `MetricRow`-**Week-TSS**
  (de activities-route is nog niet getypeerd — `any[][]`), en de **W/kg-over-tijd**-
  grafiek. Verder heeft **`apps/web` nog GEEN tests** (typecheck + build dekken de
  PWA; vitest-totaal blijft **94**) — de teststrategie voor de PWA (component/e2e) is
  een open beslispunt.
