# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**Fase 5.3c-ii NAZORG — focus-prettify + demo-seed — KLAAR (code `c63d217`, CI groen).**
Laatste code-commit `c63d217`: de Schema-tab focus-ondertitel toont nu NL-labels via de helper `focusLabel`
(`apps/web/src/lib/schema.ts` → low="Duur", high="Drempel", anaerobic="VO2max"), bekabeld in
`apps/web/src/components/schema/WorkoutDetail.tsx`; proza-focus (bv. "lactate clearance", "volume + key zone")
gaat onveranderd door. Het fase-token ("Build") blijft nog Engels → **debt (p)**. De lokale miniflare-D1 kreeg
een DEMO-SEED (NIET in repo, NIET remote): `settings.doel='Ardennen-trip'`, `lthr=178`, `doel_start='2026-06-01'`
+ 1 event op `2026-08-23` → macro-fase **Build**. Daarmee + de prettify zijn de drie Schema-leaks ("· null",
"0-0 bpm", rauwe focus-bucket) weg — telefoon-geverifieerd (**debt (o)** opgelost). Engine ONAANGEROERD
(**957/0**, expliciet ongewijzigd); vitest **127 → 129**; CI success run 28842265930.

**Fase 5.3c-ii — SCHEMA-TAB LIVE + macro-fase-fix — KLAAR (Schema live `d8492b7`, fix `34d10fe`, CI groen).**
De Schema-tab draait nu op live `/api`-data (`loadSchemaWeek` → `buildWeekProposal` + `deriveReadiness`,
client-side, TZ-veilig). **Telefoon-check #2 geslaagd:** de Schema-readiness-banner is identiek aan de
Vorm-tab (cross-check `deriveReadiness` OK); DayStrip/rustdag/WeekLoad correct; gedaan=0 (actuals liggen in
verleden-weken). **Fix:** `computeMacroPhase` (engine, `phase.ts`) returnt een OBJECT `{week,fase,isTestWeek}`;
de fallback in `proposal.ts` pakte dat object RAUW i.p.v. de fase-STRING → bij lege events bakte de engine
"[object Object]" in de workout-naam (`renderVariant_`) + de context-regel (`reden`). Nu `.fase`;
regressie-getest (`events:[]` → geen "[object Object]" in naam/reden — het pad dat de bestaande EV_FAR-tests
misten). **Correctie:** dit was GEEN engine-residu (de stap-3-commit `d8492b7` vlagde 't als "debt n /
naamlek") — het was een apps/web-pipeline-bug, nu gefixt + testgedekt. Resterende live-cosmetica = LOKALE-
seed-gaten (geen code-bug): "· null" (`doel`=NULL) + "0-0 bpm" (`lthr`=NULL), plus de rauwe focus-bucket
(engine-emit) → **debt (o)**. Engine ONAANGEROERD (**957/0**); vitest **126 → 127**.

**Fase 5.3 — WEEKGENERATIE-ORKESTRATIE GEPORT (kern + pendel + RPE) — KLAAR (t/m `471dfe6`, CI groen).**
De coupled `generateProposal`-orkestratie (debt weekgeneratie) is geport: pure prep-fns in de
engine + een client-side `buildWeekProposal`. Engine-selftest harde vloer nu **957/0**; vitest **126**.
- **5.3a** (`8cdbf91`): pure weekgen-prep in **`packages/engine/src/weekprep.ts`** —
  `rollingZoneCoverage_` / `zoneDebt_` / `recentHardDate_` (plan-gekoppeld: `intentByDate` +
  `plannerDays` + `actValues`; getrouw aan GAS `Algorithm.gs:300`/`:492`/`:336`). Selftest 922→938.
- **5.3b** (`ca26a53`): D1-read-laag — repo `readPlannerDays`/`readEvents`; routes
  `GET /api/planner/:monday` + `GET /api/events`; shared DTO's `PlannerDay`/`EventItem` (rauwe
  `yyyy-mm-dd`-datum, client parset).
- **5.3c-i** (`2bcd5f6`): client-orkestratie **`apps/web/src/lib/proposal.ts`** —
  `buildWeekProposal(input): ProposalWeek`. Client-side (ambient Amsterdam → omzeilt UTC-debt (d)).
- **5.3c-i.b** (`7c4878c`): pendel-multisession — `ProposalDay.workout` → `sessions:
  ProposalWorkout[]` (rustdag `[]`, normaal 1, pendel N; asymmetrisch: vroege ritten `pendel_z2`
  steady, de laatste rit draagt de dag-intent).
- **5.3d-i** (`2bcf05f`): RPE-D1-read — repo `readRpe`; route `GET /api/rpe`; shared `RpeEntry`
  (`{datum, rpe: number|null}`; composite PK, geen `id`, `rpe` NULLABLE).
- **5.3d-ii** (`bac5947`): pure RPE-signaal in de engine (`readiness.ts`) — `rpeSignal_` /
  `combineSignals_` + pure maps (`RPE_EXPECTED_ {low:3.5,high:7,anaerobic:9}`, `rpeBucket_`/
  `RPE_*_TYPES_`, `SIGNAL_RANK_`). RPE éénrichting (alleen demote-cap); `combineSignals_`
  niet-muterend. Selftest 938→957.
- **5.3d-iii** (`471dfe6`): RPE-combine wiring in `buildWeekProposal` — de assignWorkouts-input =
  `combineSignals_(wellnessSignal_(w), rpeSignal_(rpe, plannedTypeByDate, todayISO)).signal`;
  `plannedTypeByDate` uit `PlannerDay.voorgesteldType`.

**Weekgeneratie-orkestratie = GEPORT** (kern + pendel + RPE). Wat rest onder Schema = de UI
(5.3c-ii) + een `planner_days`-seed, GÉÉN reken-logica meer. Open port-residuen + bewuste
parity-divergenties → debt (n). NB: HANDOFF-debt **(a)** = *engine type-hardening* (nog open),
NIET de weekgeneratie — die stond onder debt (d) + de "Volgende"-sectie.

**Fase 1b — ReadinessCard-wiring (`apps/web`) — KLAAR (commit `04adc7e`, CI groen).**
De Status-vandaag-RING is nu LIVE: de "Binnenkort"-stub is weg, vervangen door een echte
client-side gereedheids-score (zoals Niveau/Vorm de engine client-side draaien, TZ-veilig).
**Visueel goedgekeurd op de telefoon** (score 84 → verdict "Klaar om te trainen"; verdict/
factors/HRV-chip kloppen; check-in-delta zichtbaar; getallen consistent met Niveau/Vorm). Keten:
`deriveReadiness(wellness, checkin)` (`apps/web/src/lib/readiness.ts`) → converteert
`WellnessInput[]` naar de 12-koloms rijen (LOKALE datum via `parseLocalDate`) →
`formStateFromWellness_` + `wellnessSignal_` → `getReadinessScore_(fs, wsig, reeks=rauwe
wellness, checkin)`. Artefacten (apps/web ONLY; engine ONGEWIJZIGD **922/0**):
`lib/readiness.ts` (converter + `deriveReadiness` + lokaal type `ReadinessResult`/factors/chips,
engine-`any` gecast, keys 1-op-1 uit `readiness.ts`); `components/vorm/ProgressRing.tsx` (geport
uit `design/src/chart.jsx`; band → kleur, `value null` → muted track); `ReadinessCard.tsx` (stub
weg; ring + 4-bands-verdict `≥78/≥62/≥48/else` + "Waarom dit cijfer?"-factorpaneel + check-in-regel
met engine-`checkinDelta` ±2); `pages/Vorm.tsx` (`useMemo(deriveReadiness)` → card);
`lib/readiness.test.ts` (+4 cases); `lib/dates.ts` (`parseLocalDate`, verhuisd uit `activities.ts`
inline `parseIso` — `activities.test.ts` blijft groen). Vitest **104 → 108**; CI success run
28753414142.

**Fase 1a — readiness-DERIVATIE → `@cadans/engine` — KLAAR (commit `530885a`, CI groen).**
Twee pure fns bijgeport in `packages/engine/src/readiness.ts` (extend-only; `getReadinessScore_`
ONGEWIJZIGD): **`wellnessSignal_(wellRows)`** (HRV/slaap-signaal + de velden die
`getReadinessScore_` consumeert) en **`formStateFromWellness_(wellRows)`** (`{ctl,atl,form,ramp}`
uit de max-datum-rij die ZOWEL CTL als ATL draagt — niet blind de laatste). Input = de
12-koloms WELL_HEADERS-rij (idx2 HRV · idx3 Slaap · idx8 CTL · idx9 ATL · idx11 Ramp),
**OUDSTE-EERST** (`/api/wellness`/`dashVormReeks_`-conventie) → recent = `slice(-3)`, baseline =
`slice(-28)`, sleepLastNight = laatste rij (de GAS-bron `Algorithm.gs:1251`/`:1337` was
nieuwste-eerst met `slice(0,N)`; port-plan §3.2 klopte 1-op-1). Expliciete `!= null`-guards per
cascade-tak (geen coercion), hrvBaseline null/0 → deficit null, lege reeks → signal "normal".
Engine-selftest **886 → 922** (+36 asserts, hard afgedwongen op 922), vitest **98 → 104** (+6
cases). GEEN route/D1/UI deze fase — die wiring is geleverd in **Fase 1b** (zie boven).

**Fase 5 — DE PWA (`apps/web`) — IN UITVOERING (shell + Vorm-lite + Niveau-v1 KLAAR).**
Faithful 1-op-1 port van de bestaande tabs tegen de bestaande `/api`-routes;
`react-router-dom` **7.18.1** (`BrowserRouter`), bottom-nav **Schema · Vorm ·
Trainingen · Niveau**. Schema/Trainingen = "binnenkort"-placeholder; **Vorm én
Niveau = gevuld**. Vitest **94 → 98** (apps/web heeft nu tests, zie 5.2); engine
**886/0** (→ **957/0** na Fase 5.3d-ii). CI groen op elke sub-fase.

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
- **5.2 Niveau-tab v1** (commit `1fe47be`): `VermogenSnapshot` + `ProgressieCard`
  **LIVE** uit `/api/settings` + `/api/activities`; de engine draait **CLIENT-SIDE**
  (`@cadans/engine` named imports). `Rijdersprofiel` + `DoelProjectie` = soon-tag-
  **stubs** (Fase 2; vergen de power-curve-route + goal-fns, bestaan nog niet).
  Kernpunten: `parseActivityRows` (`apps/web/src/lib/activities.ts`) zet idx0
  ISO-string → **lokale Date** en FILTERT Invalid Date (anders skippen
  `ctlReeksMaandelijks_`/`dashNiveauReeks_` stil rijen via hun `instanceof Date`-
  check); `setGewichtProvider(() => settings.gewicht)` synchroon in de `useMemo`-
  pipeline vlak vóór de derivaties; de tier komt uit de **design-W/kg-`TIERS`**
  (`niveau.jsx`), NIET engine `niveauTier_` (design = autoriteit). NB: Niveau leest
  `/api/settings` + `/api/activities`, **NIET** `/api/wellness` — de CTL hier is
  `ctlReeksMaandelijks_(activities)` (maandbuckets, idx8=TSS), een andere bron/
  granulariteit dan Vorm's wellness-CTL (zie wrinkle 1). Bundle **270,82 kB**
  (gzip 84,48) vs 239,41 (gzip 76,62) in 5.1b — engine-import bleef smal
  (tree-shaking: alleen de gebruikte niveau-subgraaf, niet de hele engine).
- **5.2 apps/web test-infra** (commit `a1e67d3`): de **eerste apps/web-tests**. De
  root-`vitest.config.ts` `projects`-array kreeg één entry
  `./apps/web/vitest.config.ts` (`environment "node"`, `include src/**/*.test.ts`;
  geen jsdom/pool-workers). `vitest ^3.0.0` (→ 3.2.6) + `cross-env ^7.0.3` aan
  apps/web-devDeps. Vitest **94 → 98** (+4, `src/lib/activities.test.ts`, project
  "web"); engine-selftest **886/0** ongewijzigd. Het `parseActivityRows`-parse-
  contract is vergrendeld met TZ-robuuste asserts (lokale kalendervelden +
  kolom-integriteit, geen epoch-aanname).

**Lokale D1 GEVULD (operationeel — GEEN remote/deploy; code-stand ongewijzigd op
`a1e67d3`).** Op de lokale miniflare-D1 (`.wrangler/state`, GEEN remote): `settings`
via `PUT /api/settings` (full-replace) = **ftp 280, gewicht 75** (rest `null`; W/kg =
280/75 ≈ **3,73**); **244** activities + **366** wellness via
`POST /api/sync/{activities,wellness}` uit intervals.icu. De sync-route capt op
**`days=365`** (`parseDays` 1..365) → ~1 jaar historie: ruim genoeg voor de 12-maands
Niveau-reeks + 12-weeks Vorm-PMC; meerjarige historie (evt. Niveau-Fase-2) vergt een
cap-verhoging (geparkeerd). Power-curve NIET gesynct (voedt alleen de Fase-2-stub).
Niveau + Vorm tonen nu **live data lokaal**. NB: de `users`-tabel was leeg → PUT/sync
schenden de FK tot een `users(1)`-rij bestaat; lokaal handmatig geseed (zie debt (m)).

**Lokale demo-seed-recipe (miniflare `--local`; NIET remote, NIET in repo).** Voor een leak-vrije
Schema-demo, alles via `wrangler d1 execute cadans --local`:
- `UPDATE settings SET doel='Ardennen-trip', lthr=178, doel_start='2026-06-01' WHERE user_id=1;`
- `INSERT INTO events (user_id, datum, naam, type, prioriteit, afstand_km, hoogtemeters, klim_type, notitie) VALUES (1, '2026-08-23', 'Ardennen-trip', 'trip', 'A', 140, 2000, 'heuvel', NULL);`
- `planner_days` is geseed voor de week 2026-07-06..2026-07-12; een later weergegeven week opnieuw seeden.

**Twee geparkeerde fundament-keuzes — BESLOTEN (v1):** (1) **GEEN charting-lib** —
hand-rolled SVG (zoals de Vorm-PMC); de Fase-2-grafieken (log-x power-curve,
CTL-ramp) mogen deze keuze heropenen. (2) **Pure engine CLIENT-SIDE** — TZ-veilig
want de browser = Amsterdam → omzeilt debt (d) (die alleen de UTC-worker treft); een
server-route zou (d) juist ráken.

**✅ KLAAR — visuele verificatie Niveau v1 + Vorm (Daan, op de telefoon).** Beide tabs
visueel goedgekeurd met live data. Uitkomst van de **CTL-divergentie**-check (tak 1 van
wrinkle (l)): **Niveau 49 vs Vorm 50 = granulariteits-artefact** (maandbuckets vs
wellness-CTL), GEEN engine-unificatie nodig → afgevinkt. De andere tak van (l) (engine-fns
retourneren `any` → `apps/web` cast) blijft open. Geen prod-deploy / remote-D1-mutatie gedaan.

**Volgende — Daan kiest bij chat-start.** De Schema-demo is leak-vrij (seed + prettify) en telefoon-geverifieerd.
Twee hoofdopties:
- (i) **fase-prettify** ("Build" → NL) via engine-copy óf een discreet `macroFase`-veld — gelokaliseerd op
  `planner.ts:623` (reden) + `:1079` (workout-naam); NIET UI-only (zie **debt (p)**).
- (ii) **EIND-AUDIT** starten: read-only kritische review van alle geporte engine-functies → findings-doc dat
  Daan reviewt vóór cutover. De parallel-run "produceert Cadans dezelfde week als GAS?" is de leidende
  validatie — elke bewuste divergentie = **debt (n)**.
- **Trainingen** vergt eerst duidelijkheid of er een workouts-route/-bron is.
- Screen-free: `eventCtx` (debt (n)). Met-UI: day-overrides/freeze (debt (n)).

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
| 1 | engine-transplant + SelfTest → vitest (assert-vloer in Stand, groeit mee) | ✓ |
| 2 | D1-schema / Drizzle | ✓ |
| 3a | data-access-laag (D1 ↔ engine) + TZ-conversie + Worker-integratietests | ✓ |
| 3b | intervals.icu activiteiten-sync + remote D1 (`database_id`) | ✓ |
| 3c | wellness- + power-curve-sync (engine heeft beide nodig) | ✓ |
| 4 | Worker-API (Hono routes: reads/syncs/writes) | ✓ |
| 5 | React-PWA — shell + Vorm-lite + Niveau-v1 ✓; weekgen-orkestratie geport (5.3) ✓; Schema-UI (5.3c-ii) ✓; Trainingen volgt | ◐ |
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
  (caller-supplied datums via `dates.ts`). De **weekgeneratie** is nu **CLIENT-SIDE geport**
  (Fase 5.3, `buildWeekProposal`) → TZ-veilig in de browser (Amsterdam); `mesoWeek`/`macroFase`
  lezen echter nog ambient `new Date()` (i.p.v. de geïnjecteerde `todayISO` — debt (n)). Vóór een
  SERVER-side weekgen-deploy: runtime-TZ pinnen of `now` expliciet doorgeven. **Client-side (Fase 1b):** `parseLocalDate`
  (`apps/web/src/lib/dates.ts`) is nu de ENE bron voor ISO→lokale-Date, gedeeld door
  `parseActivityRows` + de readiness-converter (nooit UTC) → een stukje client-UTC-risico
  gedicht; de server-side sync-routes blijven de openstaande UTC-blocker.
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
- **(h) Wellness→readiness-afleiding — AFGEROND (Fase 1a port + Fase 1b wiring).**
  `getReadinessScore_` (engine, `readiness.ts`) verwacht AFGELEIDE input:
  `fs.{form,ctl,atl,ramp}` + `wellness.{hrvDeficit,hrvRecent,sleepAvg3,sleepLastNight}`.
  Die afleiding (HRV-deficit vs baseline, slaap-gemiddelden, form-state) is nu geport —
  `wellnessSignal_` + `formStateFromWellness_` (Fase 1a) — en client-side gewired via
  `deriveReadiness` → `getReadinessScore_` (Fase 1b). De ReadinessCard-**score** +
  waarom-factoren zijn LIVE. De check-in (`{slaap,benen,stress}`) blijft de LOSSE 4e
  param (engine-`checkinDelta` ±2, niet de design-demo-adj).
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
- **(k) Vorm-lite deferred-onderdelen + apps/web-teststrategie — DEELS INGELOST (Fase 5.2).**
  Nog deferred in de PWA: de `LevelCard`-**tier-chip** + "sinds"-delta, de
  `MetricRow`-**Week-TSS**, en de **W/kg-over-tijd**-grafiek. (De ReadinessCard-**score**
  + waarom-factoren zijn INGELOST in **Fase 1b** — zie debt (h).) **INGELOST (5.2):** `apps/web` heeft nu test-infra (vitest
  node-project) + het `parseActivityRows`-parse-contract is vergrendeld (vitest
  **94 → 98**). RESTEREND: de bredere PWA-teststrategie (component/e2e) is nog een open
  beslispunt, en de `/api/activities`-route blijft server-side **`unknown[][]`** (nog
  niet getypeerd naar `ActivitiesResponse` — de client parset idx0 zelf).
- **(l) Twee Niveau-wrinkles — tak (1) AFGEVINKT (visuele check), tak (2) OPEN.**
  (1) ~~De Niveau-CTL uit `ctlReeksMaandelijks_(activities)` (maandbuckets, idx8=TSS) kan
  AFWIJKEN van Vorm's wellness-CTL~~ → **opgelost door de visuele check: Niveau 49 vs Vorm 50
  = granulariteits-artefact (maandbuckets vs wellness-CTL), GEEN engine-unificatie nodig.**
  (2) De engine-fns retourneren `any`
  → `apps/web` cast de resultaten (`as NiveauPoint[]` / `number|null` / `{wkg}`; en sinds
  Fase 1b `deriveReadiness` → lokaal `ReadinessResult`); een engine-shape-drift wordt
  daardoor NIET door TS in apps/web gevangen. Echte fix = de engine-returns typeren (staat
  al onder debt (a) "future typing"; raakt meerdere consumers). BLIJFT OPEN.
- **(m) PUT /api/settings + sync vereisen een bestaande `users`-rij — NIEUW (data-load).**
  `settings.user_id` / `activities.user_id` / `wellness.user_id` → FK naar `users.id`,
  maar GEEN route seedt `users` (alleen de vitest-`beforeEach`). Lokaal nu handmatig
  geseed (`users(1,'daan@example.com')` via `wrangler d1 execute cadans --local`) →
  zónder die rij geeft de eerste PUT/sync een **500** (FK-schending). Een echte
  remote-deploy heeft **user-bootstrap** nodig (migratie-seed of een ensure-user in de
  settings-handler). Blokkeert v1 NIET (`CURRENT_USER_ID = 1` hardcoded), wél de eerste deploy.
- **(n) Weekgen-port: open residuen + bewuste parity-divergenties — NIEUW (Fase 5.3).**
  NIEUW open: (1) `eventCtx=undefined` in `buildWeekProposal` (`eventContextFrom_` niet geport)
  → workouts niet event-getailord; screen-free porteerbaar. (2) day-overrides/freeze niet geport
  (handmatige plan-locks; edit/write-pad → hoort bij de UI-fase). (3) `mesoWeek` + `macroFase`
  lezen ambient `new Date()` (niet de geïnjecteerde `todayISO`) — correct voor "genereer deze
  week", latente inconsistentie als `todayISO != vandaag`; verzwakt de deterministische test (die
  zette `doelStart=null`). (4) de weekplans-intent wordt geparsed uit een `unknown[]`-blob in de
  client-pipeline (verwant aan (k)/(l)). (5) debt (l) breidt uit: ook `buildWeekProposal` cast
  engine-returns naar lokale apps/web-types (TS vangt engine-shape-drift daar niet).
  **BEWUSTE parity-divergenties** (impactloos, gelogd voor de parallel-run-validatie):
  `combineSignals_` niet-muterend (GAS muteert de wellness-arg — output-equivalent, caller
  gebruikt `.signal`); `plannedTypeByDate` uit `PlannerDay.voorgesteldType` i.p.v. GAS
  `weekplan_<monday>.workoutType` (Cadans persisteert de huidige week niet mid-week; day-mirror =
  dezelfde waarde); `rollingZoneCoverage_`-venster = 8 dagen `[today-7..today]` uit "days=7"
  (GAS-misnomer, behouden); `rollingZoneCoverage_`/`zoneDebt_` missing-zone-data → `actual=0` (GAS
  sloeg over + live-refetch, niet porteerbaar); `zoneDebt_` zonder clamp (mag negatief, GAS-getrouw).
  **Gecorrigeerd (5.3c-ii):** de in `d8492b7` als "debt n / naamlek" gevlagde "[object Object]" was
  GÉÉN engine-residu — het was de apps/web `computeMacroPhase`-object-fallback in `proposal.ts` (moest
  `.fase`), gefixt in `34d10fe` + regressie-getest. Geen engine-debt.
- **(o) 5.3c-ii live-Schema-cosmetica — OPGELOST (seed + focus-prettify).** De drie leaks op de live
  /dev-Schema zijn weg: (1) ~~"· null"~~ → `settings.doel='Ardennen-trip'` geseed; (2) ~~"0-0 bpm"~~ →
  `settings.lthr=178` geseed (watts klopten al, FTP 280); (3) ~~rauwe focus-bucket "low"/"high"/"anaerobic"~~
  → geprettify't via `focusLabel` (`apps/web/src/lib/schema.ts`, commit `c63d217`) naar Duur/Drempel/VO2max,
  proza-focus onveranderd. Telefoon-geverifieerd. Seed = LOKAAL (miniflare, zie seed-recipe), NIET in
  repo/remote. De `EMPTY_SETTINGS`-fallback in `loadSchemaWeek` verzacht een verse user maar raakt de
  users-bootstrap-debt (kruisverwijzing **(m)**).
- **(p) Fase-token nog Engels ("Build") — engine-copy, NIEUW (5.3c-ii nazorg).** De macro-fase wordt
  INGEBAKKEN in engine-strings: `packages/engine/src/planner.ts:623` (reden, "… — fase <macroFase>") én
  `:1079` (workout-naam, bv. "Z2 progressief (Build, ingekort)"). Er is GEEN discreet `macroFase`-veld op
  `ProposalDay`/`ProposalWeek`/`SchemaDay`. NL-prettify van de fase kan dus NIET UI-only (anders dan de
  focus, debt (o)): vereist een engine-copy-wijziging óf een discreet fase-veld dat de UI apart labelt.
- **(q) Engine-bpm-quirk in over-under-sets (low prio) — NIEUW (5.3c-ii nazorg).** De
  "Herstel · Easy tussen de sets"-blokken erven de set-drempel-HR (bv. 157-178 bij `lthr`=178) i.p.v. een
  lage herstel-HR. Visueel bevestigd op de telefoon. Engine-emit (geen UI-fix); parkeren tot de eind-audit.
