# DEPLOY-RECON — Eerste Cloudflare-deploy (Cadans v1)

Status: read-only recon afgerond; dit is het te reviewen deploy-blueprint. Muterende stappen (§5) vereisen expliciete goedkeuring per stap. training @ 3e8090a onaangeroerd.

## 1. Doel
Eerste deploy van Worker + assets + remote D1 -> een publieke, basic-auth-afgeschermde PWA-URL, zodat de app overal op de telefoon werkt i.p.v. alleen op home-LAN via de dev-server.

## 2. Recon-bevindingen (uitgevoerd, read-only)
- wrangler.jsonc: `cadans-api`, main `src/index.ts`, compat_date `2026-07-03`, `nodejs_compat`. D1-binding `DB` -> db `cadans` (id `aa302c17-915b-44cb-8823-89c416974f50`), `migrations_dir` `drizzle`. Assets `../../apps/web/dist`, SPA-fallback, `run_worker_first` `/api/*`. Geen vars-blok.
- Migraties: `0000_redundant_maginty` (11 tabellen, incl. `users`) + `0001_magical_lady_mastermind` (`power_curve_cache`). Lokaal beide toegepast (journal v7).
- Remote D1 `cadans`: `num_tables=0` -> LEEG; beide migraties pending. Geen drift, maar een schone eerste apply.
- `users` = {`id` PK autoinc, `email`, `intervals_athlete_id`, `created_at`}. 11 tabellen FK -> `users.id`. `CURRENT_USER_ID = 1` (`db/client.ts:9`). Geen route insert ooit `users`.
- Secrets: `INTERVALS_API_KEY` + `INTERVALS_ATHLETE_ID`, alleen gelezen in de sync/powercurve-integraties (niet bij boot). `.dev.vars` lokaal aanwezig.
- Auth: geen middleware. 17 routes: 11 GET, 3 POST (`sync/activities|wellness|power-curve`), 3 PUT (`settings|checkin|weekplan`).
- Build: apps/web `tsc -b && vite build` -> `dist` (= assets-pad). Client API-base relatief `/api/*`. PWA `base` `/`.
- TZ (debt d): ambient `new Date()` op `wellness.ts:98`, `intervals.ts:89`, `powercurve.ts:94`+`124`.
- Omgeving: node `v24.15.0`, pnpm `11.9.0`, wrangler `4.106.0`. Account `dtkorteweg@gmail.com`.

## 3. Besluiten (chat-akkoord)
- (A) Users-bootstrap -> `ensure-user` in code: idempotente `INSERT OR IGNORE INTO users (id) VALUES (1)` in de muterende handlers. Self-healing, reproduceerbaar, athlete_id blijft uit de repo. Sluit debt (m).
- (B) Auth -> basic-auth over de hele origin, alleen actief als het secret aanwezig is (lokaal/test/CI = no-op). Native browser-prompt, geen login-UI. Dekt de no-auth-exposure.
- (C) TZ (debt d) -> geaccepteerd voor v1; fix in aparte vervolgchat. Near-midnight-NL sync-misbucket is bekend en niet-blokkerend.

## 4. Pre-deploy code-changes (normale CC-loop; gegate + gecommit voor deploy)
Change 1 - ensure-user
- Een `ensureUser(db, userId)`-helper (idempotent `INSERT OR IGNORE INTO users (id) VALUES (1)`), aangeroepen aan het begin van de muterende routes (3 PUT + 3 POST) - of als middleware op niet-GET.
- Vooraf de NOT NULL-constraints van `users` bevestigen (`email`/`intervals_athlete_id` nullable?) en de insert daarop afstemmen; nooit de echte athlete_id in de repo.
- Test: PUT /api/settings tegen een lege D1 -> `users(id=1)` + settings-rij bestaan (nu: FK-violatie).

Change 2 - basic-auth (hele origin)
- `workers/api/src/index.ts`: Hono `basicAuth`-middleware bovenaan, alleen gemount als `env.BASIC_AUTH_PASSWORD` bestaat; username vast in code (bv. `daan`), wachtwoord uit het secret.
- Origin-gating: `run_worker_first` verbreden zodat de Worker ook de document/asset-requests ziet; non-`/api` -> serveren via `env.ASSETS.fetch(request)` (SPA-fallback blijft). Zo geeft de top-level navigatie 401 + `WWW-Authenticate` -> native prompt die de telefoon onthoudt.
- Exacte `run_worker_first`-vorm + asset-serving-pattern worden bij implementatie tegen de wrangler-4.106-docs gepind.
- Test: zonder secret -> alles open (bestaande tests groen); met secret in test-env -> `/api` zonder Authorization = 401, met juiste creds = 200.
- `.dev.vars`: `BASIC_AUTH_PASSWORD` NIET zetten (lokaal blijft auth-vrij).

## 5. Muterende deploy-stappen (elk VRAAGT goedkeuring - bewust niet in allow-list)
1. Remote migreren: `wrangler d1 migrations apply cadans --remote` -> past 0000 + 0001 toe op de lege remote. Verifieer read-only: `wrangler d1 migrations list cadans --remote` (niets pending) + `wrangler d1 execute cadans --remote --command "SELECT name FROM sqlite_master WHERE type='table'"` (11 tabellen).
2. Secrets zetten (waarden interactief op de laptop, nooit in de chat): `wrangler secret put INTERVALS_API_KEY`, `wrangler secret put INTERVALS_ATHLETE_ID`, `wrangler secret put BASIC_AUTH_PASSWORD`.
3. Build: `pnpm --filter web build` -> `apps/web/dist`.
4. Deploy: `wrangler deploy` (vanuit `workers/api`) -> Worker + assets live.
5. Post-deploy: URL op de telefoon -> native basic-auth-prompt -> creds -> PWA laadt; `GET /api/health` = ok (met auth); lees-tab toont data (leeg tot sync); sync testen (vereist de INTERVALS_*-secrets).
Ensure-user in code betekent GEEN aparte seed-stap: de eerste muterende call self-seed't `users(id=1)`.

## 6. Debts na deze deploy
- (g) remote-D1-drift -> INGELOST (remote gemigreerd).
- (m) users-bootstrap -> INGELOST (ensure-user).
- (d) TZ-UTC op sync -> OPEN (v1-geaccepteerd; vervolgchat).
- Overige bekende debts (bv. Model A assets-binding) -> ongewijzigd.

## 7. Veiligheid / rollback
- Remote D1 was leeg -> geen dataverlies-risico bij de migratie.
- `wrangler deploy` is terug te draaien via `wrangler rollback`.
- training @ 3e8090a onaangeroerd; geen writes daarheen.
