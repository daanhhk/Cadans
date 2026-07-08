# Data-provenance audit — Schema-tab + gedeelde doel/settings-laag

READ-ONLY audit. Doel: vaststellen waar de Schema-tab (en de gedeelde doel/settings-laag)
zijn getoonde content vandaan haalt, en welke waarden **placeholder/prototype-data** zijn
die als echt worden gepresenteerd. Aanleiding: Schema toont "Ardennen-trip" als event/doel,
Niveau toont "Girona" — beide nooit door de gebruiker ingevoerd.

## 0. Scope + bronnen

- **Cadans-code** @ commit `a184859` (audit-HEAD). Paden: `apps/web`, `packages/engine`,
  `packages/shared`, `workers/api`.
- **GAS-referentie** (READ-ONLY) @ `3e8090a` (`C:\Users\daan\Projects\training`).
- Geen implementatie/mutatie behalve dit doc.

**Kernconclusie vooraf:** er zijn twee losse placeholder-bronnen, geen enkele is een echte
gebruikersinvoer:
1. **"Ardennen-trip"** = handmatig in de **productie-D1 geseede rijen** (`events`-tabel +
   `settings.doel`). Staat NIET in de code — het is data. Enige vindplaats in de repo:
   `HANDOFF.md:174-175` (het seed-SQL).
2. **"Girona"** = **hardcoded engine-constant** `GOAL_PROFILES_.girona.label` (`niveau.ts:573`),
   1-op-1 geport uit GAS (`WebApp.gs`). Lekt voor élk niet-FTP-doel via de Niveau-DoelProjectie.

---

## 1. String-jacht-resultaten

Grep (case-insensitive) op "Ardennen" / "Girona" over `apps/web` + `packages/*` + `workers`.

### "Ardennen" — GEEN code-constant/default
| Bestand:regel | Aard |
|---|---|
| `HANDOFF.md:174` | Doc: seed-SQL `UPDATE settings SET doel='Ardennen-trip'…` |
| `HANDOFF.md:175` | Doc: seed-SQL `INSERT INTO events (…naam…) VALUES (…, 'Ardennen-trip', 'trip', 'A', …)` |
| `HANDOFF.md:80,345` | Doc: beschrijft de geseede waarde als "echte naam" |
| `packages/engine/src/planner.ts:1824` | Workout-NOTE-tekst "(Amstel/Ardennen)" — cosmetische copy in een archetype-omschrijving |

→ "Ardennen-trip" bestaat NERGENS als constant/default/fallback in de code. Het is **D1-data**
(handmatig geseed via `wrangler d1 execute`, gedocumenteerd in HANDOFF). Er is GEEN `.sql`-seed
of migratie-bestand (glob `**/migrations/**` + `**/*.sql` = leeg; schema = drizzle in
`workers/api/src/db/schema.ts`).

### "Girona" — hardcoded engine-constant + design-mockups + testfixtures
| Bestand:regel | Aard |
|---|---|
| `packages/engine/src/niveau.ts:570-602` | **`GOAL_PROFILES_.girona`**: `key/label:"Girona"` (573), `sub:"~90 km · 1200 hm/dag · lange klimmen"` (574), gap-targets `4.0 W/kg` (581) / `CTL 65` (589) / `4.0u` (597). Hardcoded. |
| `packages/engine/src/niveau.ts:632` | `activeGoalProfile_` fallback `return GOAL_PROFILES_.girona` (elk niet-FTP-doel) |
| `packages/engine/src/archetypes.ts:1154` | `projectieKey: "girona"` (klim-profiel) |
| `packages/engine/src/planner.ts:1898` | Workout-NOTE-tekst "(Girona/Alpen)" — cosmetische copy |
| `packages/engine/src/selftest.test.ts` | testfixtures (`GOAL_PROFILES_.girona`, coach-event `naam:"Girona"`) |
| `workers/api/test/routes.weekgen.test.ts:161` | testfixture `naam:"Girona trip"` |
| `apps/web/src/styles/tokens.css:459,481,486,502` | comment-tekst (cosmetisch) |
| `design/**` (niveau.jsx, schema.jsx, settings.jsx, docs, README) | **design-mockup-fixtures** — NIET de app; design-autoriteit-referentie |

→ In de VERZONDEN app (`apps/web` runtime) komt "Girona" UITSLUITEND uit
`GOAL_PROFILES_.girona.label` via de engine. Geen "Girona"-literal in `apps/web/src` behalve
token-comments. De design/src-`.jsx` zijn mockups (niet gebundeld).

### Overige verdachte demo-getallen
- Hardcoded doel-targets `GOAL_PROFILES_.girona.dims`: `4.0`/`65`/`4.0` (`niveau.ts:581/589/597`)
  + `GOAL_PROFILES_.ftp` CTL-target `65` (`niveau.ts:617`). Prototype-targets, geen user-bron.
- `GOAL_PROFILES_.girona.sub` "~90 km · 1200 hm/dag" (`niveau.ts:574`) — prototype-copy.

---

## 2. Doel/event-herkomstketen in Cadans

### 2a. Schema fase-kaart "· nog N wkn tot <EVENT>" + "Doel-gericht"-chip

Volledige keten (component → prop → bron):

```
PeriodTimeline (apps/web/src/components/schema/PeriodTimeline.tsx)
  :116  `${faseLabel} · nog ${wekenTotEvent} wkn tot ${eventNaam}`
  :165  Stat label={`Tot ${eventNaam}`} val={`${wekenTotEvent} wkn`}
  :167  {planModus && <ModeChip label={planModus} />}
      ▲ props: eventNaam, wekenTotEvent, planModus
SchemaView (components/schema/SchemaView.tsx:60-66)
  <PeriodTimeline eventNaam={view.eventNaam} wekenTotEvent={view.wekenTotEvent} planModus={view.planModus} />
      ▲ view = deriveSchemaView(proposalWeek, …) → view.eventNaam = proposalWeek.eventNaam
buildWeekProposal (lib/proposal.ts)
  :175-176  eventNaam    = macro?.hoofdEvent?.naam ?? null
  :177-178  wekenTotEvent= macro?.wekenTot ?? null
  :179      planModus    = macro ? "Doel-gericht" : null          ◄── HARDCODED literal
  :151      macro = eventFase_(eventsD, today)   [engine, PUUR]
      ▲ eventsD ← events (getEvents)
getEvents (lib/api.ts:99) → GET /api/events
  → api.get("/events") (workers/api/src/routes/api.ts:225)
  → readEvents(db, CURRENT_USER_ID) (db/repo.ts:368) → SELECT … FROM events (db/schema.ts:142)
```

- **`eventNaam` = D1 `events`-tabel** (`hoofdEvent.naam`, geselecteerd door `eventFase_` =
  eerste A-prio of trip). De getoonde "Ardennen-trip" = de geseede rij. **Klassificatie (b)**.
- **`planModus` = hardcoded `"Doel-gericht"`** zodra er een event is (`macro` truthy),
  `proposal.ts:179`. Het implementeert NIET de GAS-mode-logica (Onderhoud/Doel-gericht/Opbouw).
  **Klassificatie (b/c)**.
- **`wekenTotEvent`/`faseLabel`** = engine-afgeleid uit event-datum + `doelStart`. Echte
  derivatie, maar gevoed door **placeholder-event + placeholder-doeldatum** → periodisering
  hangt aan seed-data (zie §5).

**Default-waarde + wanneer ze lekt:** `EMPTY_SETTINGS` (`lib/schema.ts`) heeft `doel:null`,
`doelStart:null` — SCHOON, lekt niets. De lek komt NIET uit een code-default maar uit de
**echte D1-rijen** (settings-row `doel='Ardennen-trip'` + events-row). `PeriodTimeline` gate't
correct: `hasEvent = eventNaam != null && wekenTotEvent != null` (`:88`) en `planModus &&`
(`:167`) — dus zónder event/seed toont de kaart alléén de fase, geen event/chip. De lek is dus
puur de geseede D1-data, niet de UI.

### 2b. Waar wordt het DOEL (goal) gedefinieerd + waar leidt de seed heen

- `settings.doel` ← GET `/api/settings` (`getSettings`, `api.ts:42`) → D1 settings-row.
  Geldig bereik = `DOEL_OPTIONS` (`packages/engine/src/phase.ts:12-18`):
  `["FTP","Conditie","Beklimmingen","VO2max","Onderhoud"]`.
- **De seed `doel='Ardennen-trip'` is GEEN geldige `DOEL_OPTIONS`-waarde** (het is een
  event-naam in het goal-veld). Gevolg — twee silent fallbacks:
  - `profileForDoel_(doel)` (`archetypes.ts:1220-1226`): onbekend → **`PROFILES.klim`** (`:1226`).
    Stuurt intent-weging/archetype-selectie (Schema + Trainingen).
  - `activeGoalProfile_(settings)` (`niveau.ts:629-632`): `doel==="FTP"?ftp:girona` → niet-FTP →
    **`GOAL_PROFILES_.girona`** → label "Girona" in Niveau.
- `settings.doel` wordt NERGENS als tekst-label getoond op Schema; wel als select-waarde in
  `Instellingen.tsx:472` (`value={form.doel}`) — daar toont de dropdown een ongeldige/lege keuze.

### 2c. Niveau "Doel-gereedheid · Girona"-keten

```
DoelProjectie (apps/web/src/components/niveau/DoelProjectie.tsx)
  :365  <Overline>Doel-gereedheid · {label}</Overline>     ◄── "Girona"
  :366-377 {sub && …}                                      ◄── "~90 km · 1200 hm/dag…"
  :379  <SoonTag>Visie</SoonTag>                            (Fase-2-stub, maar wél gerenderd)
  :391-393 dims.map(GapRow)                                 ◄── targets 4.0/65/4.0
      ▲ props label/sub/dims
Niveau.tsx
  :117  prof = activeGoalProfile_(settings)
  :138  label: prof.label   :139 sub: prof.sub   :128-136 dims uit prof.dims
activeGoalProfile_ (engine niveau.ts:629-632) → niet-FTP → GOAL_PROFILES_.girona (:632)
GOAL_PROFILES_.girona.label = "Girona" (niveau.ts:573)
```

- **`label`/`sub`/gap-targets = hardcoded `GOAL_PROFILES_.girona`** (`niveau.ts:570-602`).
  Overline rendert ONVOORWAARDELIJK (ook in de "Visie"-lege-staat). **Klassificatie (b)**.
- Ported uit GAS `WebApp.gs` (identieke constant) — de comment `niveau.ts:569` erkent het als
  "swap-able doel-seam: generaliseert voorbij Girona".

---

## 3. GAS: waar het ECHTE doel/event vandaan komt (@ 3e8090a)

- **Event**: `Events.gs` — sheet `'Events'` (A3:H = Datum/Naam/Type/Prioriteit/Afstand/Hoogte/
  Klim-type/Notitie), `getAllEvents_()` (~L171) → DocProp `events_json`. `eventFase_`
  (`Doel.gs` ~L225) kiest eerste A-prio/trip → `hoofdEvent.naam` uit de **door de user gevulde
  Events-sheet**. Daarom toont GAS de ECHTE events van Daan, geen "Ardennen-trip".
- **Doel + doeldatum**: `Settings.gs` — sheet `'Instellingen'` B11=`doel`, B12=`doel_start`,
  B13=`doel_duur`; `readSettings()` (~L263). `DOEL_OPTIONS`=`FTP/Conditie/Beklimmingen/VO2max/
  Onderhoud`. Default `doel='FTP'`, `doel_duur=12`.
- **Mode**: `Doel.gs planModeLabel_` (~L294): `doel==='Onderhoud'`→"Onderhoud"; elif
  `macro.eventDriven`→"Doel-gericht"; elif `fase==='maintain'`→"Onderhoud"; else "Opbouw".
  → GAS heeft ECHTE mode-logica; Cadans hardcodet enkel de event-tak ("Doel-gericht").
- **"Girona" IS óók hardcoded in GAS**: `WebApp.gs` `GOAL_PROFILES_.girona` + `activeGoalProfile_`
  (girona-fallback), `Archetypes.gs projectieKey:'girona'`. "Ardennen" enkel in workout-notitie-
  tekst (`Algorithm.gs`), geen constant. → De "Girona"-lek is een 1-op-1 GAS-port; de reden dat
  de LIVE GAS-app 'm minder opvalt is dat de doel-projectie-Visie daar niet zo prominent is —
  de constant is identiek aanwezig.

---

## 4. Herkomst-tabel Schema-tab

Klassificatie: **(a)** echte bron · **(b)** hardcoded placeholder/prototype-restant · **(c)**
lekkende fallback-default.

| Waarde (Schema) | Component:regel | Bron | Klasse | Zou moeten zijn |
|---|---|---|---|---|
| Fase-label Basis/Build/Peak | PeriodTimeline:115,163 | engine `macroFase` (computeMacroPhase(doelStart)/eventFase_) | (a)* | ok — maar hangt aan seed-doeldatum/-event |
| "· nog N wkn tot **Ardennen-trip**" | PeriodTimeline:116 | D1 `events`-tabel (seed-rij) | **(b)** | echte events uit D1 (via editor/intervals) of lege staat |
| "Tot **Ardennen-trip** · N wkn" | PeriodTimeline:165 | idem | **(b)** | idem |
| Mode-chip "**Doel-gericht**" | PeriodTimeline:167 | `proposal.ts:179` hardcoded | **(b/c)** | GAS `planModeLabel_` (Onderhoud/Doel-gericht/Opbouw) o.b.v. `doel`+`eventDriven` |
| WeekLoad gepland tss/min/dagen | WeekLoad ← deriveSchemaView | engine-sessies | (a) | ok |
| WeekLoad gedaan tss/min/dagen | WeekLoad ← deriveSchemaView | activities (D1/intervals) | (a) | ok |
| Dag-strip (weekdag/nr/indicator) | DayStrip | engine-proposal + activities | (a) | ok |
| Dagkaart geplande workout | WorkoutDetail | engine `buildWorkout` | (a)** | ok (**note-copy noemt Amstel/Ardennen/Girona — cosmetisch, planner.ts:1824/1898) |
| Dagkaart voltooid/vergelijking | DoneCompareCard | activities + `coachFeedback_` | (a) | ok |
| Readiness (vandaag) | CoachReadinessBanner | wellness/checkin | (a) | ok |

*Fase-derivatie is echt maar wordt gevoed door placeholder-`doelStart`/-event → periodisering
verschuift op seed-data. **Workout-notities bevatten illustratieve plaatsnamen (cosmetisch).

**Gedeelde doel-laag (Niveau, óók zichtbaar):**

| Waarde (Niveau) | Component:regel | Bron | Klasse | Zou moeten zijn |
|---|---|---|---|---|
| "Doel-gereedheid · **Girona**" | DoelProjectie:365 | `GOAL_PROFILES_.girona.label` (niveau.ts:573) via activeGoalProfile_ | **(b)** | echt doel-label uit `settings.doel`/event |
| sub "~90 km · 1200 hm/dag…" | DoelProjectie:366 | `niveau.ts:574` | **(b)** | echte doel-definitie |
| Gap-targets 4.0 W/kg / CTL 65 / 4.0u | DoelProjectie GapRow | `niveau.ts:581/589/597` | **(b)** | echte doel-targets |

---

## 5. Opschoon-plan per placeholder

### Quick removals (geen bron-koppeling nodig)
1. **D1-seed verwijderen** (productie-D1, user_id=1):
   `DELETE FROM events WHERE user_id=1 AND naam='Ardennen-trip';`
   `UPDATE settings SET doel=NULL WHERE user_id=1;` (of een echte `DOEL_OPTIONS`-waarde).
   Effect: `hasEvent=false` → PeriodTimeline toont alléén de fase; `planModus` wordt `null`
   (hangt aan `macro`/event-presence) → ModeChip verdwijnt. **Let op:** dit lost "Girona" NIET
   op — die is hardcoded fallback (doel=null blijft niet-FTP → girona).
2. **`settings.doel` corrigeren**: de seed zette een EVENT-naam in het GOAL-veld (ongeldig →
   `profileForDoel_`→klim + `activeGoalProfile_`→girona). Zet doel op een geldige
   `DOEL_OPTIONS`-waarde of `null`.

### Bron-koppeling vereist (echte bron / expliciete lege staat)
3. **Events zonder schrijfpad**: Cadans heeft ALLEEN `GET /api/events` — GEEN
   `PUT/POST /events`, geen events-editor-UI. "Ardennen-trip" kan dus NIET via de app
   verwijderd/bewerkt worden. Nodig: (a) een events-schrijfroute + editor-UI, of (b)
   intervals-event-sync, zodat de user echte events invoert. Tot dan = lege staat (geen event).
4. **`planModus` hardcoded** (`proposal.ts:179`): port de GAS `planModeLabel_`-logica
   (`Doel.gs:294`) — `Onderhoud`/`Doel-gericht`/`Opbouw` o.b.v. `settings.doel` + event-presence.
   Vergt lib/engine-logica (niet puur removal).
5. **"Girona"-generalisatie** (`GOAL_PROFILES_`): de DoelProjectie-`label`/`sub`/targets moeten
   uit de ECHTE doel-definitie komen (per `DOEL_OPTIONS` een profiel, of user-instelbare
   targets). Comment `niveau.ts:569` erkent de seam al. Quick mitigation zolang het "Visie" is:
   label generaliseren (bv. naar `settings.doel`/event-naam) of de DoelProjectie-overline-naam
   ontkoppelen van de hardcoded girona-key. Anders lekt "Girona" bij élk niet-FTP-doel.

### Instabiel weekdoel ↔ placeholder-periodisering
Het week-VOORSTEL (intent-weging + macroFase + taper) hangt aan `eventFase_(events,…)` +
`computeMacroPhase(doelStart,…)`. Met een geseed event ("Ardennen-trip" @ 2026-08-23,
HANDOFF:175) + geseede `doel`/`doelStart` wordt de fase (en dus de kwaliteits-weging + taper)
op **nep-data** bepaald. Ja: het instabiele weekdoel KAN aan de placeholder-periodisering
hangen — de seed-event-datum stuurt macroFase/taper, en `doel='Ardennen-trip'`→klim-profiel
stuurt de intent-weging. Verwijderen/corrigeren van de seed → fase valt terug op de echte
`doelStart`-mesocyclus (of default), wat het weekdoel stabiliseert.

---

## 6. Gedeelde constant/default — doorwerking op andere tabs

| Bron | Ook gebruikt door | Effect |
|---|---|---|
| `GOAL_PROFILES_` / `activeGoalProfile_` (niveau.ts) | **Niveau** (DoelProjectie) | "Girona"-label + sub + gap-targets |
| `settings.doel` → `profileForDoel_` (archetypes.ts:1220) | **Schema** (week-generatie) + **Trainingen** (archetype-selectie via `PROFILES`) | seed `'Ardennen-trip'`→klim-fallback stuurt intent-weging in beide |
| `settings.doel` → `workoutZones(type, doel)` (proposal.ts:235) | **Schema** (zone-pinning) | doel-afhankelijke zone-keuze op ongeldige seed-waarde |
| D1 `events` + `eventFase_` | **Schema** (periodisering/taper) | idem seed-event stuurt fase |
| `settings.doelStart`/`doelDuur` → `computeMacroPhase`/`doelTestWeken_` | **Schema** (fase) + **Niveau** (test-projectie DoelProjectie:147) | seed-doeldatum stuurt fase + projectie |

→ Eén opschoon aan de **D1-seed** (`events` + `settings.doel/doelStart`) + de **`GOAL_PROFILES_`
-generalisatie** werkt door op Schema, Niveau én Trainingen tegelijk. `Vorm` (wellness/readiness)
raakt de doel-laag niet.

---

## Bevestiging
- GAS-repo `C:\Users\daan\Projects\training` HEAD **onveranderd** `3e8090a` (READ-ONLY;
  geverifieerd).
- Geen code-mutatie in deze audit behalve dit doc.
