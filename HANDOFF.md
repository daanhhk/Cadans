# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

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
| 2 | D1-schema / Drizzle | |
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
