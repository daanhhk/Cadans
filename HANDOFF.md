# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**ISSUE 1 (dagtype-model) + PENDEL-DUUR — DONE + LIVE (deze sessie).**
- **Dagtype-model** — de Weekplanner vraagt geen dagtype meer: per dag Train? + minuten-**slider**
  (30-360, step 15) + **Pendel?-toggle**; dagtype wordt client-side AFGELEID (`deriveDagtype`: pendel >
  weekend (Za/Zo) > vrij; `recovery` NOOIT uit availability — het wellness-signal dekt dat). Commit
  `0782b1a`.
- **Schema auto-refresh** — een in-memory `plannerSignal` (bump/subscribe) laat Schema het voorstel
  herbouwen na een Weekplanner-save (puur planner-gedreven, GEEN intervals-sync); de ververs-knop
  re-derive't nu ONVOORWAARDELIJK (ontkoppeld van de sync-uitkomst). Commit `937c031`.
- **Pendel-duur = "enkele reis"** — het settings-veld toont de enkele reis; opgeslagen als retour
  (2×, `legToRoundTrip`), de engine leest de retour + splitst heen/terug (`planner.ts:1948-1949`).
  Pendel-dag = leg+leg (bv. 75+75=150). GEEN engine/`proposal.ts`/`planner.ts`-wijziging. Commit `faed841`.
- **Live Version ID `9120970c`**; laatste main-commit = `faed841`. CI groen. Recon-docs deze chat
  (achtergrond): `BESCHIKBAARHEID-MOBILE-RECON`, `ENGINE-DAGTYPE-BRANCHES-RECON`, `DAGKAART-PENDEL-RECON`.

**INVOER-UI + SYNC LIVE (vorige sessie).** De drie data-invoer-gaten zijn gedicht + gedeployed;
remote D1 is nu GEVULD.
- **Settings-invoer** — `/instellingen` via het tandwiel in de AppShell-header; FULL-REPLACE
  `PUT /api/settings`-client + form (alle 12 `EngineSettings`-velden, incl. Geavanceerd
  hartslag/pendel/fase). Commit `d6398dd` → deploy Version `b456867a`. Telefoon-geverifieerd.
- **Schema-sync-knop** — "Werk week bij" gekoppeld aan `POST /api/sync/{activities,wellness}` (parallel
  via `Promise.allSettled`, inline-feedback; power-curve bewust NIET — Niveau laadt die via read-through).
  Commit `0abaf34` → deploy Version `6ff09e3f`. Telefoon-geverifieerd (15 activiteiten gesynct).
- **Weekplanner-invoer** — `PUT /api/planner/:monday` FULL-REPLACE (idempotente upsert op
  `(user_id, datum)`; `voorgesteldType` blijft null → client herberekent live; `gedaan`=0). Editor op
  `/weekplanner` via het kalender-icoon in de WeekLoad-kaartkop, vrije week-navigatie. Commit `2fe521a`
  → deploy Version `2a23798c`. Vitest +13.
- **Allowlist verbreed** (commit `32ac2d3`): 7 read-only allow-patronen (`echo` + `wrangler
  whoami`/`d1 list`/`d1 migrations list`, wrangler+npx). Deny-regels + `wrangler deploy`-prompt ONGEMOEID.
- **Remote D1 GEVULD** (was leeg): 15 activiteiten (user_id=1, datum-range 12-06..06-07), settings
  (FTP 280 / gewicht 75 / doel VO2max / blok-start 29-06 / 12 wk), `planner_days` huidige week ingevuld.

**EERSTE CLOUDFLARE-DEPLOY LIVE (post-deploy).** Worker `cadans-api` draait op
**https://cadans-api.dtkorteweg.workers.dev** (Version ID `bde322ec-017b-4ef2-81ba-2c03812cb18a`);
assets-binding + whole-origin basic-auth actief (username `daan` hardcoded in `src/index.ts`; auth
alleen aan als het secret staat). Auth-afdwinging objectief bevestigd: `GET /api/health` én `GET /`
zónder/foute creds → **401 + `WWW-Authenticate: Basic realm="Secure Area"`**. Remote D1 `cadans`
gemigreerd (`0000` + `0001` → **12 tabellen** live, + interne D1-tabellen). Secrets via het
Cloudflare-dashboard gezet: `BASIC_AUTH_PASSWORD`, `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`
(namen only, nooit waarden). Code deze chat (workers/api): ensure-user middleware = commit
`2cc3f23` (idempotente `INSERT OR IGNORE users(id=1)` op non-GET); whole-origin basic-auth = commit
`d96867c` (`run_worker_first` true + conditionele `basicAuth` + `ASSETS.fetch`-fallback +
`/api`-404-guard); plan-doc `docs/DEPLOY-RECON.md` = commit `87df348`. (Remote D1 was toen nog LEEG;
**inmiddels gevuld** — zie het sessie-blok hierboven.)

**SCHEMA + NIVEAU + VORM-TAB AFGEROND (GAS-niveau) — laatste UI-code-commit `f2d2fa3`, CI groen.**
Fase 0-4 klaar. Fase 5 (de PWA, `apps/web`) loopt; **Schema, Niveau én Vorm zijn nu op GAS-
conformiteit afgewerkt** (telefoon-geverifieerd). **Alle hoofd-tabs (Schema/Niveau/Vorm +
Status/Today) staan op niveau.** Alles apps/web — `packages/engine` ONGEWIJZIGD.
Code-commits deze slag (Vorm): `1a8d354` (feat: LevelCard tier-chip + tier-voortgangsbalk +
"sinds"-delta; MetricRow 3e kolom Week-TSS; nieuwe gedeelde `lib/niveau.ts` — `deriveNiveauSerie`/
`tierProgress`/`wkgSince`/`weekTss` + 10 vitest-units; Vorm.tsx fetcht activities) · `ab8ac1a`
(style: tokenize ReadinessCard/CheckinSheet/ConditiePmc) · `f2d2fa3` (fix: conditie-as "12 wk" —
verdwaalde tilde weg; ab8ac1a's perl-replace nam 10-spatie-inspringing aan terwijl de regel er 8
heeft → vervanging sloeg stil over).

**Gate-vloeren (nooit onder; bron van waarheid — NOOIT hardcoden in een prompt):**
engine-selftest `toBe(957)` · vitest-totaal **189** (178 → 182 dagtype `0782b1a` +4 → 185 plannerSignal
`937c031` +3 → 189 pendel-helper `faed841` +4). CI groen.

**Fundament:** IBM Plex Sans (400/500/600) + Mono (500/600), self-hosted via `@fontsource`,
offline-precached (`main.tsx`). Het UI-kader ligt vast in **`apps/web/docs/UI-KADER.md`**:
`design/src/tokens.css` ↔ `apps/web/src/styles/tokens.css` = bron van waarheid; componenten
consumeren UITSLUITEND `--s-*/--fs-*/--lh-*/--r-*` (kleur was al gedisciplineerd).

**Schema-tab — sectie-volgorde: PeriodTimeline → WeekLoad → DayStrip → dag-detail.**
- **PeriodTimeline** (periodisering-kaart): overline + kop "<NL-fase> · nog X wkn tot
  <eventNaam>" (echte naam, bv. "Ardennen-trip"), fase-staven [Basis/Build/Peak] met de huidige
  fase gemarkeerd, Fase-stat + Tot-stat + ModeChip "Doel-gericht". Gethread uit de engine-`macro`
  in `proposal.ts`: `eventNaam`, `wekenTotEvent`, `planModus` (afgeleid).
- **WeekLoad**: 3 stats (TSS/uren/dagen gepland vs gedaan) + voortgangsbalk met `--accent-grad`.
- **Workout-detail**: proportionele SVG-staafgrafiek (`ZoneBar`; breedte ∝ minuten, hoogte via
  bucket-lookup rust 25 / z2 45 / tempo 65 / drempel 85 / anaeroob 100, kleur `--zone-1..5`) →
  `ZoneLegend`-chips → `BlockList` (tekstuele stappen) **DEFAULT INGEKLAPT**, uitklappen via klik op
  de bar/legend (toggle-`button`, `aria-expanded`/`aria-controls`). Blok-extractie in apps/web
  (`blokFromEngine`, `lib/schema.ts`); engine ongewijzigd.
- **macroFase NL** via `MACRO_FASE_NL` (Base→Basis, Recovery→Herstel; Build/Peak/Test blijven Engels
  = byte-identiek aan GAS `Doel.gs:307`). Het fase-token uit het workout-naam-suffix wordt in de UI
  gestript (`stripFaseSuffix`).
- **CoachReadinessBanner** op today (Cadans-toevoeging t.o.v. GAS — behouden).

**Niveau-tab — vier secties, alle LIVE (telefoon-geverifieerd; beide "volgt later"-stubs weg).**
- **VermogenSnapshot** + **ProgressieCard** (v1): FTP / W-kg / tier + trajectorie (W/kg·Fitheid, 1M/6M/12M/Alles).
- **Rijdersprofiel**: power-duration-curve (log-x SVG, markers 5s/1m/5m/20m/60m, key 5m/20m/60m) + stat-boxes
  (W · W/kg · maand) + type-staaf (Sprinter↔Diesel via `riderType.pos`, `(1-pos)` op de Sprinter-links-as) +
  parity-proza. Data uit **`GET /api/power-curve`** (engine `pcNormalize_`, server-side) met **90d|1y-toggle**;
  nieuwe shared-DTO **`PowerCurveResponse`** (`packages/shared`) typeert de worker-route + de client-fetch
  (`any` weg). Lokaal `power_curve_cache` leeg → nette empty-state tot een sync.
- **DoelProjectie**: 3 gap-rows (`activeGoalProfile_`+`goalGap_`, client-side geassembleerd) + uren→potentieel
  (CTL-ramp via `ctlPlateauFromVolume_`/`ctlApproachWeeks_`/`ctlAtWeek_`, SVG) + speculatieve FTP-band
  (`ftpBandFromProjection_`, gestreept, aannames uitklapbaar). Alle compute uit de engine (`niveau.ts`); UI-only.

**Vorm-tab — conformiteit-niveau, telefoon-geverifieerd (conditie-as toont "12 wk").**
- **ReadinessCard** (score + factorpaneel + check-in-regel, engine-`deriveReadiness`) · **LevelCard** (W/kg + FTP
  + **tier-chip** + **tier-voortgangsbalk** + **"+X ↑ sinds <mnd>"-delta**) · **MetricRow** (3 kolommen FTP ·
  Gewicht · **Week-TSS**) · **ConditiePmc** (PMC-variant C: 12-wk CTL/ATL + TSB-headline [variant-B-graft] +
  legenda) · CheckinSheet. StatusDeck-swipe blijft BEWUST gecut (PMC-only, geen switcher).
- LevelCard-tier/-delta + de serie komen uit de **gedeelde Niveau-bron** `lib/niveau.ts` (`deriveNiveauSerie` =
  dezelfde engine-fn-keten die Niveau.tsx gebruikt → identieke waarden).
- **Week-TSS** = kalenderweek `[maandag, maandag+7)` via `weekMondayIso` — **GAS-parity** met `actualTssByDate_`
  (Algorithm.gs:662, Monday-based; NIET trailing-7). Lege week → "—".

### Geparkeerde debts (bewust, niet nu)
- **PeriodTimeline**: proportionele fase-breedtes + you-are-here-marker ontbreken (per-fase-weekduur
  zit niet in de engine-output); event-tags B/A; Volume-stat (geen CTL-/volume-target in de keten).
  Vereisen extra engine-threading.
- **Blok-copy blijft Engels** (Warmup/Over/Under/Cooldown/"lactate clearance") = parity met GAS (zit
  in engine `archetypes.ts`, GEEN GAS-vertaallaag). NL-maken = nieuwe keuze + engine-copy → eind-audit.
- **Over-under "Herstel"-blokken** erven de set-drempel-HR i.p.v. een lage herstel-HR (engine-emit) →
  eind-audit.
- **macroFase-proza** in `planner.ts:620-626`/`:680` blijft Engels (reden-string) → eind-audit.
- **Font-subsets**: `@fontsource` trekt alle subsets mee (28 woff2); versmallen naar latin(+ext) =
  kleine optimalisatie.
- **Client-side goal-assembler**: `buildGoalProfile_` (GAS-assembler) zat NIET in engine-core → client-side
  samengesteld uit `activeGoalProfile_`+`goalGap_` (`Niveau.tsx`). Eind-audit: 1-op-1 mirror van de
  GAS-assembler verifiëren.
- **DoelProjectie start-CTL op maand-granulariteit** (`ctlReeksMaandelijks_` laatste maand) i.p.v. GAS
  dag-`vorm.CTL` → de klaar-marker kan ~1 week schuiven; eind-audit.
- **riderType-proza UI-mapped**: parity-mirror van GAS `nvTypeDuiding_` (3 strings); engine levert enkel
  `{pos,label}` → parity-copy-debt, eind-audit.
- **Geen geautomatiseerde interactie-tests** (Schema-collapse, DoelProjectie uren-slider, Rijdersprofiel
  90d|1y-toggle): vereist jsdom + `@testing-library/react` (nieuwe deps + config) = aparte test-harness-klus.
- **Debt (k) Vorm-lite INGELOST** (`1a8d354`): LevelCard tier-chip/tier-bar/"sinds"-delta + MetricRow Week-TSS
  gebouwd. Resteert onder (k): `/api/activities` server-side typing.
- **Orchestratie-duplicatie (NIEUW):** `lib/niveau.ts` wrapt dezelfde engine-fn-keten die `Niveau.tsx` inline
  draait; waarden IDENTIEK (geen bug), maar één bron is netter → `Niveau.tsx` later op de helper laten leunen.
- **Token-schaal-gaten (NIEUW, cross-cutting — niet Vorm-specifiek):** er is geen `--fs-num-*`-schaal voor
  20/30/52px, en off-scale font-sizes (17.5/19/14.5/8.5), tight gaps (5/6/10) en chip/knop-padding zijn bewust
  off-scale gelaten (geen tokens verzinnen). Vraagt een aparte schaal-uitbreidings-pass die de hele app raakt.
- **Bredere debts** (detail: §Deferred debts): (g) remote-D1-drift + (m) users-bootstrap = GESLOTEN
  (deploy); OPEN: engine-`any`-cast in apps/web (a)/(l), `/api/activities` server-side typing (k),
  (d) TZ-UTC op de sync-routes (v1-geaccepteerd).

### Volgende fase (grootste gap eerst)
- **EERSTE DEPLOY — GEDAAN.** Worker + assets + remote D1 live achter whole-origin basic-auth (zie Stand).
  De twee geparkeerde deploy-debts zijn GESLOTEN: remote-D1-drift (g) + users-bootstrap (m). No-auth-exposure
  afgedekt. RESTEREND deploy-debt: (d) TZ-UTC op de sync-routes = OPEN, v1-geaccepteerd (aparte chat).
- **FOCUS (i) sync-trigger + (ii) settings-invoer + weekplanner-invoer — GEDAAN (deze sessie):** alle
  drie gebouwd + LIVE + telefoon-geverifieerd; remote D1 gevuld (zie sessie-blok bovenaan Stand).
- **ISSUE 1 (dagtype-model) — DONE + LIVE** (zie Stand): Pendel?-toggle + client-side afleiding, slider,
  Schema auto-refresh, pendel-duur enkele-reis. Bron-recons `BESCHIKBAARHEID-MOBILE-RECON` +
  `ENGINE-DAGTYPE-BRANCHES-RECON`.
- **ISSUE 2 (dagkaart-VOLTOOID) — VOLGENDE, grote gefaseerde port.** Bron-spec =
  `docs/DAGKAART-PENDEL-RECON.md` SECTIE A (gepind op commit `32d7ed7`:
  https://raw.githubusercontent.com/daanhhk/Cadans/32d7ed7a23ef6bbe3ef005f878c90f933c2bef72/docs/DAGKAART-PENDEL-RECON.md).
  Een verleden dag met een gereden rit toont nu "Rustdag" — Cadans' `DoneEntry` = enkel `{tss, minuten}`.
  Het datacontract moet UITGEBREID: done rit-type/naam/duur + zone-gedaan-minuten + planned-vs-done-
  **alignment** + coach-impact-laag. **Fasering:** (2a) rit-weergave (naam/type/duur + zone-balk uit de
  activity) → (2b) alignment/zone-vergelijking (state/score) → (2c) coach-impact + adapt-/Garmin-knoppen.
  Overweeg ook week-navigatie op de Schema-dag-strip (nu current-week-only; de Weekplanner heeft die al).
- **CHECKPUNT (los, na pendel):** weekdoel-afwijking GAS **254 TSS / 5:45 / 4 dagen** vs Cadans **134 /
  3:15 / 3 dagen** — waarschijnlijk planning-gerelateerd; verifieer of de pendel-fix + juiste dagtypes het
  dicht; anders een gerichte recon.
- **Op de horizon:** Garmin-workout-push (externe device-integratie, apart traject); en de read-only
  **eind-audit** van alle geporte engine-fns (sluitstuk vóór cutover — adresseert de engine/parity-debts
  hierboven). (Beschikbaarheid/weekplanning-bewerken = GEDAAN deze sessie.)

### Lokaal (miniflare `--local`, GEEN remote/deploy)
`settings` via `PUT /api/settings` = ftp 280 / gewicht 75; **244** activities + **366** wellness via
`POST /api/sync/{activities,wellness}` (cap `days=365`). `users(1)` handmatig geseed (FK; zie debt (m)).
**Demo-seed-recipe** (leak-vrije Schema-demo; NIET in repo/remote), via `wrangler d1 execute cadans --local`:
- `UPDATE settings SET doel='Ardennen-trip', lthr=178, doel_start='2026-06-01' WHERE user_id=1;`
- `INSERT INTO events (user_id, datum, naam, type, prioriteit, afstand_km, hoogtemeters, klim_type, notitie) VALUES (1, '2026-08-23', 'Ardennen-trip', 'trip', 'A', 140, 2000, 'heuvel', NULL);`
- `planner_days` geseed voor de week 2026-07-06..2026-07-12; een later weergegeven week opnieuw seeden.

**Twee geparkeerde fundament-keuzes — BESLOTEN (v1):** (1) GEEN charting-lib (hand-rolled SVG). (2) pure
engine CLIENT-SIDE (TZ-veilig want de browser = Amsterdam; omzeilt de UTC-worker-blocker, debt (d)).

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
  gedicht; de server-side sync-routes blijven de openstaande UTC-blocker. **Post-deploy (v1) BEWUST
  GEACCEPTEERD:** de UTC-sync-buckets (`wellness.ts:98`, `intervals.ts:89`, `powercurve.ts:94`+`124`)
  zijn een bekende near-midnight-NL-misbucket — niet-blokkerend; fix in een aparte vervolgchat.
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
- **(g) Remote-D1-migratie-drift — GESLOTEN (eerste deploy).** `0000` + `0001` zijn nu remote
  toegepast (`wrangler d1 migrations apply cadans --remote`); `migrations list --remote` = niets
  pending; de 12 in de migraties gedefinieerde tabellen zijn remote geverifieerd aanwezig. Geen drift meer.
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
- **(m) users-bootstrap — GESLOTEN (commit `2cc3f23`).** `ensureUser(db, userId)` = idempotente
  `INSERT OR IGNORE users(id=1)` (`src/db/client.ts`), gedraaid door een non-GET Hono-middleware in
  `src/index.ts` → elke muterende write self-heal't de FK-rij (dekt de 3 PUT + 3 POST + toekomstige
  muterende routes). Getest: `test/routes.ensure-user.test.ts` (PUT tegen lege D1 → `users(1)` +
  settings-rij bestaan). Geen losse seed-stap meer nodig; `CURRENT_USER_ID = 1` blijft hardcoded.
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
