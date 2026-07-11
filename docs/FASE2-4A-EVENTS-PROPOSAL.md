# FASE 2 · Brok 4a — events-editor PROPOSAL

Architect-beslissingen voor het events-WRITE-pad. Bouw NA fetch-review + akkoord.
Basis: recon `docs/FASE2-4A-EVENTS-RECON.md` (`0d16faf`). Cadans HEAD `93c3010`; GAS-parity `3e8090a`.

## Scope & grenzen
- Alleen het **WRITE-pad** (`PUT /events` + editor-UI). Tabel `events`, `EventItem`-read-DTO,
  `GET /api/events` + de PeriodTimeline-lees-keten bestaan al (recon).
- **GEEN D1-migratie** (tabel `events` compleet, `schema.ts:144`).
- **Engine (`packages/engine`) ongemoeid.** Een write verandert enkel D1; de volgende `buildWeekProposal`
  (na refetch) leest de nieuwe lijst.
- **BUITEN scope (apart, engine-rakend, sign-off):** de event-activeringsdrempel (A-event "slaapt" tot
  ~8-12 wkn). 4a slaat het event enkel OP; HOE ver-toekomstige events in de PeriodTimeline verschijnen blijft
  bepaald door het bestaande `eventFase_`. Verificatie 4a = de round-trip (opslaan→GET→persist), niet per se
  een directe PeriodTimeline-wijziging.

## Beslissingen

### 1. Write-vorm = FULL-REPLACE
`PUT /api/events`, body `{ events: EventInput[] }` → delete-all-voor-user + insert-all (mirror
`writePlannerDays`). Consistent met `putPlanner`; korte per-user-lijst; geen `id`-round-trip; `id`-churn
onschadelijk (geen FK's naar `events`, `readEvents` laat `id` al vallen, PeriodTimeline leest op naam/datum
via `eventFase_`). Lege lijst `{events: []}` = geldig (wist alles → onderhoudsmodus).

### 2. Write-DTO = nieuw `EventInput`
Los van het all-nullable read-DTO `EventItem`; maakt de vereiste velden expliciet (spiegelt `SettingsInput`/
`PlannerDayInput`). In `packages/shared/src/weekgen.ts` + export in `index.ts`:

    export interface EventInput {
      datum: string;                                          // yyyy-MM-dd, VERPLICHT
      naam: string;                                           // VERPLICHT, non-empty, <=60
      type: 'trip' | 'race';                                  // VERPLICHT
      prioriteit: 'A' | 'B' | 'C';                            // VERPLICHT
      afstandKm?: number | null;                              // optioneel, >=0
      hoogtemeters?: number | null;                           // optioneel, integer >=0
      klimType?: 'lang' | 'kort' | 'gemengd' | 'vlak' | null; // optioneel
      notitie?: string | null;                                // optioneel, <=200
    }

Veldnamen camelCase, 1-op-1 met `EventItem`. Server mapt camelCase → snake_case (`afstand_km`/`hoogtemeters`/
`klim_type`/`notitie`), zoals `readEvents` snake→camel mapt.

### 3. Editor-route + nav-ingang = standalone `/events`, ingang via `/instellingen`
Nieuwe standalone route `/events` BUITEN het AppShell-blok (spiegelt `/weekplanner`). Ingang = nieuwe sectie
**"Doelen & events"** in `Instellingen.tsx`: korte samenvatting (aantal events / eerstvolgend A-event) + knop
**"Beheren"** → `navigate('/events')`. Back op `/events` → `/instellingen`.
Reden: events = durende config (zoals doel/FTP) → config-hub; `/instellingen` rendert gegarandeerd + is
bereikbaar vanaf een lege staat (nodig voor het EERSTE event = Amstel), zonder afhankelijkheid van de
PeriodTimeline-lege-render. Een lijst-editor past niet in het platte settings-form → aparte route.
**Daan mag dit in de review omdraaien** naar een contextuele ingang op de PeriodTimeline-kaart (tik-op-event
→ bewerken). Enige subjectieve keuze hier.

### 4. Scope = volledige lijst (meerdere A/B/C)
Lijst-editor, geen enkel-event-form; tabel + `eventFase_` steunen meerdere events = GAS-parity (de
"Events"-tab is een lijst). Amstel = lijst van één (A). Een enkel-event-editor = kunstmatige, van-GAS-
afwijkende beperking.

### 5. Refetch = hergebruik `bumpPlannerVersion()`
Events voeden dezelfde `loadSchemaWeek`→`buildWeekProposal`→PeriodTimeline-keten die `plannerSignal` al
ververst. Na geslaagde write: `bumpPlannerVersion()` → Schema herbouwt het voorstel (incl. PeriodTimeline).
Geen apart `eventsSignal`.
*Lichte tech-debt (gelogd):* "planner" dekt dan breder dan planner-dagen; later hernoemen naar generiek
`schemaInputsSignal`. Geen bug (beide invalideren dezelfde pipeline).

### 6. Server-validatie = strak, atomisch (mirror `/settings`-discipline)
Per-veld-whitelist; onbekende velden genegeerd. Body moet `{events: array}` zijn. Per rij:

| veld | regel |
|---|---|
| datum | VERPLICHT; `^\d{4}-\d{2}-\d{2}$` + geldige kalenderdatum |
| naam | VERPLICHT; getrimd 1..60 tekens |
| type | VERPLICHT; in {trip, race} |
| prioriteit | VERPLICHT; in {A, B, C} |
| afstandKm | optioneel; null of eindig getal >= 0 |
| hoogtemeters | optioneel; null of integer >= 0 |
| klimType | optioneel; null of in {lang, kort, gemengd, vlak} |
| notitie | optioneel; null of string <= 200 |

Elke ongeldige rij → **400** (welke rij + veld), GEEN write (atomisch: valideer-alles-dan-vervang). Client
valideert dezelfde regels vooraf; server = backstop.

### 7. `id`-blootstelling = geen
Door FULL-REPLACE is `id` client-side irrelevant. `GET /api/events` blijft ongewijzigd (laat `id` vallen).
`EventInput` heeft geen `id`. `id`-churn blijft server-side.

## Contracten (bouw-naden)
- **Shared** `packages/shared/src/weekgen.ts`: `EventInput` (boven) + export `index.ts`.
- **Repo** `workers/api/src/db/repo.ts`: `writeEvents(db, userId, rows)` naast `readEvents` (`:372`); mirror
  `writePlannerDays` (delete-voor-user + batch-insert, atomisch via `db.batch`).
- **Route** `workers/api/src/routes/api.ts`: `api.put("/events", ...)` naast `api.get("/events")` (`:225`);
  mirror `api.put("/planner/:monday")` (`:393`). Valideer → `writeEvents` → `readEvents` → `c.json(rows)`
  (verse `EventItem[]`, bare array = symmetrisch met GET). `ensureUser`-middleware dekt de FK op non-GET.
- **Web-client** `apps/web/src/lib/api.ts`: `putEvents(events): Promise<EventItem[]>` — mirror `putPlanner`
  (`:83`) exact (zelfde helper/patroon, throw op non-2xx); body `{events}`.
- **Web-UI** nieuwe route-component (mirror `Weekplanner.tsx`): laad via `getEvents()` → form-rijen; per rij 8
  velden (datum date-input, naam text, type select [default race], prioriteit select [default A], afstandKm
  number, hoogtemeters number, klimType select [—/lang/kort/gemengd/vlak, default —=null], notitie text) +
  verwijder-knop; "Event toevoegen"-knop; lege staat "Nog geen events"; opslaan → client-validatie →
  `putEvents` → `bumpPlannerVersion()` + feedback "Opgeslagen". NL UI-strings. Velden = GAS "Events"-kolommen
  (parity); layout spiegelt de bestaande Cadans-editors (tokens, UI-KADER), GEEN GAS-layout-meetlat (GAS heeft
  enkel een sheet-tab).
- **Instellingen** sectie "Doelen & events" + "Beheren"-knop (beslissing 3).

## Testplan (vitest groeit; vloer in HANDOFF STAND, NIET hardcoden)
Worker-integratie: (a) validatie-rejects (bad enum/datum/lege naam/naam>60 → 400, geen write), (b)
FULL-REPLACE vervangt de vorige lijst, (c) lege lijst wist alles, (d) round-trip PUT→GET = zelfde inhoud.
Evt. shared/web-unit voor de camel<->snake-map.

## Deploy & verificatie
Bouw-prompt = samenhangende stappen + volledige gate (`--frozen-lockfile`) + CI + (approval-gated)
`wrangler deploy` in dezelfde prompt (mobiele verificatie zonder LAN). GEEN remote-migratie nodig (tabel
bestaat remote sinds de eerste deploy). Daarna voert **Daan** het echte A-event in via de PROD-editor
in-browser (Basic-Auth): **Amstel Gold Race · 2027-04-18 · type race · prioriteit A** → verifieert de
round-trip (opslaan → herladen → persist). PeriodTimeline-effect volgt het bestaande `eventFase_`
(activeringsdrempel = apart item).

## OPEN voor Daan's review
- Beslissing 3 (nav-ingang): `/instellingen`-sectie (voorstel) vs contextuele PeriodTimeline-kaart-ingang.
- Overige beslissingen: veto welkom.
