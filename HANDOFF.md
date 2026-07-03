# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**Fase 0 — monorepo-scaffold COMPLEET.** Lokale gate groen
(lint + typecheck + test + build). Baseline vitest = **1/0**.
CI groen op GitHub Actions. NB: pnpm 11.9 vereist Node ≥ 22.13 → CI en lokaal
draaien **Node 24**. De allereerste CI-run (Node 20) faalde in `setup-node`
omdat pnpm 11.9 onder Node 20 `node:sqlite` mist; opgelost door de Node-bump.

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
| 1 | engine-transplant + 886 SelfTest → vitest | |
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
