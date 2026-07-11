# FASE 2 · Brok 4a — events-editor RECON (feiten-only, read-only)

Read-only feitenverzameling voor een events-WRITE-pad (`PUT /events`) + editor-UI. GEEN bouw, GEEN
ontwerpbeslissingen. Cadans HEAD `93c3010`; GAS-referentie `C:\Users\daan\Projects\training` HEAD `3e8090a`
(alleen gelezen). packages/engine niet aangeraakt.

> **FLAG (tegenspraak met de prompt-aanname):** de prompt verwachtte "GEEN GET /events". Dat klopt NIET —
> **GET /api/events BESTAAT** (`routes/api.ts:225`, client `getEvents` `lib/api.ts:99`, repo `readEvents`
> `repo.ts:372`). Alleen het WRITE-pad (PUT/POST/DELETE) ontbreekt. De events-tabel + read-keten zijn compleet
> en voeden al de PeriodTimeline.

## (1) Cadans D1 events: schema + migratie + repo-read

- **Tabel** `events` (`workers/api/src/db/schema.ts:144-162`): `id` INTEGER PK autoincrement · `user_id`
  INTEGER NOT NULL → FK `users.id` · `datum` TEXT NOT NULL · `naam` TEXT · `type` TEXT (comment `trip/race`) ·
  `prioriteit` TEXT (comment `A/B/C`) · `afstand_km` REAL · `hoogtemeters` INTEGER · `klim_type` TEXT (comment
  `lang/kort/gemengd/vlak`) · `notitie` TEXT. Index `events_user_datum_idx` op (`user_id`,`datum`) — **GEEN
  unique constraint** (meerdere events per user + datum toegestaan).
- **Migratie**: aangemaakt in `workers/api/drizzle/0000_redundant_maginty.sql:46` (`CREATE TABLE events`) +
  index `:60`. GEEN latere events-migratie → **een write vergt GEEN nieuwe migratie** (tabel is compleet).
- **Repo-read** `readEvents(db, userId)` (`repo.ts:372-388`): `select().from(events).where(userId)
  .orderBy(asc(datum))` → mapt naar `EventItem[]`. **Let op: de map LAAT `id` VALLEN** (de DTO draagt geen PK).
- **Write bestaat NIET** in de repo (geen `writeEvents`/`upsertEvents`; grep leeg).

## (2) EventItem + engine-flow + PeriodTimeline lees-pad

- **`EventItem`** (`packages/shared/src/weekgen.ts:38-50`): `datum: string` · `naam/type/prioriteit/klimType/
  notitie: string | null` · `afstandKm/hoogtemeters: number | null`. **GEEN `id`-veld.** `prioriteit` = TEXT
  A/B/C. **`EventInput` bestaat NIET** (geen write-DTO; grep leeg).
- **Engine-flow**: `buildWeekProposal` (proposal.ts) krijgt `events: EventItem[]` (BuildProposalInput `:88`) →
  `eventsD = events.map(datum→Date)` (`proposal.ts:177`) → `macro = eventFase_(eventsD, today)`
  (`proposal.ts:181`, engine `phase.ts`). `eventFase_` selecteert het hoofd/taper-event uit de lijst.
- **PeriodTimeline lees-pad**: uit `macro` → `eventNaam = macro?.hoofdEvent?.naam` (`proposal.ts:201`) +
  `wekenTotEvent = macro?.wekenTot` (`proposal.ts` ~`:184`) → `ProposalWeek.eventNaam/wekenTotEvent`
  (interface `:67`/`:69`) → `deriveSchemaView` → `view` → `PeriodTimeline`. Volledige keten: D1 → `readEvents`
  → GET /events → `getEvents` → `loadSchemaWeek` → `buildWeekProposal` → `eventFase_` → view → PeriodTimeline.
- **Engine-debt (n)**: `buildWorkout(... eventCtx=undefined ...)` (`proposal.ts:320`) — `eventContextFrom_`
  niet geport → `long_z2` zonder event-scaling. Bekend, staat LOS van de editor.

## (3) Shared DTO's + routes: wat bestaat / wat ontbreekt

- **Shared exports** (`packages/shared/src/index.ts:22`): `EventItem` (read-DTO). GEEN `EventInput`/
  `EventResponse`.
- **Routes** (`workers/api/src/index.ts:41` `app.route("/api", api)`; handlers in `routes/api.ts`):
  - BESTAAT: `GET /api/events` (`api.ts:225-229` → `readEvents` → `c.json(rows)`).
  - ONTBREEKT: **GEEN `PUT`/`POST`/`DELETE /events`** (grep leeg). Bestaande PUT's: `/settings` (`:310`,
    per-veld-whitelist), `/checkin/:date` (`:348`), `/weekplan/:monday` (`:373`), `/planner/:monday` (`:393`,
    FULL-REPLACE lijst).
- **Web-API-client** (`apps/web/src/lib/api.ts`): `getEvents` (`:99`, `apiGet<EventItem[]>("/api/events")`).
  Te spiegelen write-patronen: `putSettings` (`:52`, per-veld) + **`putPlanner` (`:83`, FULL-REPLACE lijst:
  `PUT /api/planner/:monday`, body `{days: PlannerDayInput[]}`, throw op non-2xx)** — de dichtste mirror voor
  een lijst-write.

## (4) Web nav + editor-patroon + refetch

- **Routes** (`apps/web/src/App.tsx`): `/schema /vorm /trainingen /niveau /preview` BINNEN het
  `<Route element={<AppShell/>}>`-blok; **`/instellingen` (`:46`) + `/weekplanner` (`:49`) STAAN ERBUITEN**
  (standalone, zonder shell-header). `/instellingen` = via de AppShell-avatar; `/weekplanner` = via
  Schema-links (`WeekLoad.tsx:91` + `ActionButtons.tsx:62` "Beschikbaarheid aanpassen"). **Er is GEEN
  events-route/nav.**
- **Editor-patroon** (`Instellingen.tsx`): `useState<Form>(EMPTY_FORM)` → `useEffect` `getSettings()` →
  `setForm(toForm(s))` (mount + `nonce`) → `save()`: `putSettings(formToBody(form))` → `setSaved` + refetch
  (`Weekplanner.tsx` idem met `putPlanner` + `bumpPlannerVersion`).
- **Refetch-mechanisme** `plannerSignal` (`apps/web/src/lib/plannerSignal.ts`): in-memory `version` +
  `listeners`; `bumpPlannerVersion()` vuurt alle subscribers; `subscribePlannerVersion(cb)`. Schema abonneert
  (`Schema.tsx:57` → `setNonce`) → herbouwt het voorstel; Weekplanner bumpt na een write (`Weekplanner.tsx:240`).
  **Events voeden dezelfde `loadSchemaWeek`→`buildWeekProposal`→PeriodTimeline** → een events-edit KAN via
  `bumpPlannerVersion()` (of een nieuw events-signaal) de PeriodTimeline verversen. (Naam "planner" dekt dan
  breder dan alleen planner-dagen — zie OPEN KEUZES.)

## (5) GAS events-model (read-only, `3e8090a`)

- **Locatie** `Events.gs`: Tab **"Events"** (`EVENTS_SHEET = 'Events'`, `:12`). Kolomkoppen (`:15`):
  **Datum · Naam · Type · Prioriteit · Afstand km · Hoogtemeters · Klim-type · Notitie** — 1-op-1 parity met
  de Cadans-kolommen. Opslag ook als DocProp `events_json` (`:78`,`:90`).
- **Invoerwijze**: handmatig in de sheet-tab (menu `buildEvents` maakt de tab + dropdowns); geen apart
  editor-scherm.
- **Prioriteit-semantiek** (Doel.gs, parity-begrip — NIET porten): **A** = hoofd/A-event (macroFase-periodisering
  + taper-venster `A_TAPER_DAGEN=7`) · **B** = tune-up (taper-venster `B_TAPER_DAGEN=3`) · **C** = telt mee als
  event maar tapert NOOIT. `type` trip/race + `klimType` sturen klim-type-selectie. Legacy-migratie zet een
  enkel event als `{type:trip, prioriteit:A, klimType:lang}` (`Events.gs:84`).

## (6) EXACTE naden waar het WRITE-pad moet landen (bestand + laag)

- **D1**: geen migratie nodig (tabel `events` compleet, `schema.ts:144`).
- **Repo** (`workers/api/src/db/repo.ts`): NIEUWE write-fn naast `readEvents` (`:372`) — mirror
  `writePlannerDays`/`writeSettings` (delete+insert of upsert).
- **Route** (`workers/api/src/routes/api.ts`): NIEUWE `api.put("/events", …)` (of POST/DELETE) naast
  `api.get("/events")` (`:225`) — mirror `api.put("/planner/:monday")` (`:393`) of `/settings` (`:310`).
- **Shared** (`packages/shared/src/weekgen.ts`): NIEUWE `EventInput`-write-DTO (of hergebruik `EventItem`;
  let op: die mist `id`) + export in `index.ts:22`.
- **Web-client** (`apps/web/src/lib/api.ts`): NIEUWE `putEvents(...)` — mirror `putPlanner` (`:83`).
- **Web-UI**: NIEUWE editor-route + form (mirror `Weekplanner.tsx`/`Instellingen.tsx`) + een nav-ingang
  (nog te kiezen) + refetch via `bumpPlannerVersion()` of een nieuw signaal.

## (7) OPEN KEUZES (architect beslist in de chat — NEUTRAAL, geen aanbeveling)

1. **Write-vorm**: FULL-REPLACE van de hele events-lijst (delete-all + insert-all, zoals `putPlanner`) vs
   per-rij CRUD (POST/PUT/DELETE met `id`). Per-rij vergt `id` in de DTO (nu afwezig in `EventItem`).
2. **Write-DTO**: nieuw `EventInput` vs `EventItem` hergebruiken (die mist `id` → relevant bij per-rij).
3. **Editor-route + nav-ingang**: waar landt de route (`/events`? sub-scherm van `/instellingen`?) en hoe
   bereikt (avatar/Instellingen-sectie? PeriodTimeline-klik? Schema-link zoals /weekplanner?).
4. **Scope**: één A-event bewerken vs een volledige lijst (meerdere A/B/C — tabel + `eventFase_` steunen
   meerdere).
5. **Refetch**: `bumpPlannerVersion()` hergebruiken (breder dan planner) vs een nieuw `eventsSignal`.
6. **Server-validatie**: `prioriteit` A/B/C-enum · `type` trip/race · `klimType`-enum · `datum` yyyy-MM-dd —
   strak whitelisten (zoals `/settings`) vs losser; verplicht/optioneel per veld.
7. **`id`-blootstelling**: `readEvents` laat `id` nu vallen (`repo.ts:381`) — bij per-rij-edit moet GET het
   `id` mee gaan geven.
