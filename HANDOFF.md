# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

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
| 3 | data-access + intervals.icu-port | |
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
  geneutraliseerd op ×1). De data-access-laag (D1) moet deze vullen —
  zie `docs/SCHEMA-PROPOSAL.md` §1.2.
- **(c) Puurheid-boundary-check in CI.** Nog toe te voegen: een mechanische
  check die faalt zodra `packages/engine` een GAS/IO-global of externe-state-
  read binnensluipt (bv. grep/lint-regel op `SpreadsheetApp`/`PropertiesService`/
  `fetch`/`process.env` in de engine). Borgt de puurheid die de vitest-gate nu
  impliciet aanneemt.
- **(d) Datum-functies TZ-expliciet.** De engine leunt nu op ambient TZ (pin
  `TZ=Europe/Amsterdam` in de test-env). Latere fase: datum-logica een expliciete
  TZ-parameter geven i.p.v. ambient.
- **(e) D1-TEXT-datum → Date-mapping (Fase 3, Worker).** D1 slaat datums als
  TEXT (ISO) op; de engine verwacht `Date`-objecten op lokale-middernacht. De
  data-access-laag moet elke `datum`-TEXT deterministisch naar
  `Date`-op-Amsterdam-middernacht mappen (spiegelt `stripTime_` + de
  `TZ=Europe/Amsterdam`-pin), zodat de dag-keying identiek blijft aan de
  GAS/V8-oorsprong. Geldt voor activities/wellness/planner_days/events + de
  `weekplans`-entry-datums.
- **(f) Remote D1 + `database_id`.** `workers/api/wrangler.jsonc` heeft een
  `database_id`-placeholder ("local-placeholder") — remote-provisioning
  (`wrangler d1 create cadans`) + de echte UUID zijn een aparte, mens-
  geverifieerde stap; blokkeert de lokale flow niet.
