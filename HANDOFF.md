# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

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

**Volgende (Fase 4):** de sync-functies (`syncActivities`/`syncWellness`/
`syncPowerCurve`) + repo-reads (`readWellness`/`readNormalizedPowerCurve`/…) via
Hono HTTP-routes exposen; daarna richting deploy, met debt (d) +
remote-migratie-drift (g) als pre-deploy-blockers.

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
- **apps/web** — Vite + React + TS + vite-plugin-pwa.
- **workers/api** — Hono + Drizzle-skelet (nog geen schema).

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
| 4 | Worker-API | |
| 5 | React-PWA (tabs + tokens 1-op-1 port) | |
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
  vóór deploy.
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
  (`{slaap,benen,stress}`) is de LOSSE 4e param en staat los van wellness.
- **(i) NULL→""-conventie bij de readiness-port — NIEUW (notitie).**
  `wellnessRowsToWellValues_` dekt de ""-conventie correct voor idx0/8/9/10 (wat
  `dashVormReeks_` leest). Bij de readiness-port bevestigen dat NULL→"" óók klopt
  voor idx5/6 (readiness, mood), die vaker leeg zijn.
