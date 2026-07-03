# Cadans

Greenfield Cloudflare-herbouw van de FTP-Coach, als pnpm-monorepo.

## Architectuur (léán v1)

- **packages/engine** — pure TypeScript trainings-engine. Geen DB, geen env,
  geen fetch → volledig unit-testbaar met vitest. Dit is de lokale gate die de
  stervende remote clasp-gate van de oude GAS-app vervangt.
- **apps/web** — Vite + React + TypeScript PWA (`vite-plugin-pwa`, dashboard).
- **workers/api** — Cloudflare Worker (Hono) + Drizzle/D1-skelet (schema volgt
  in Fase 2).

v1 heeft **geen auth**; het datamodel wordt multi-user-ready ontworpen
(`user_id` op elke tabel), in v1 hardcoded op één user.

## Setup

```
pnpm install
pnpm test        # vitest (engine)
pnpm build       # engine + web
```

App draaien: `pnpm --filter @cadans/web dev`.

## Gate

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` moet groen zijn.
GitHub Actions CI draait exact deze stappen op elke push/PR naar `main`.
