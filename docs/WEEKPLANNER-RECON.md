# RECON — Weekplanner-invoer om planner_days te vullen

De lege `planner_days`-tabel is de root-cause van de lege Schema-week (zie
`docs/SCHEMA-EMPTY-RECON.md`). Deze recon vertaalt de GAS-Weekplanner (spec) naar wat Cadans mist om
beschikbaarheid in te voeren. GAS = leidend; niets nieuws ontworpen. training @ 3e8090a (read-only).

## Kern
`planner_days` is **INPUT** (beschikbaarheid per dag die de generator invult), niet output. Het
patroon is **per-week datum-gebonden**, geseed uit een **terugkerend persistent standaardpatroon**.
De weekgeneratie **bestaat al** (client-side `buildWeekProposal` + `assignWorkouts`) — alleen de
**invoer ontbreekt volledig**: geen schrijf-route, geen client-helper, geen UI (de leesroute bestaat
en komt leeg terug).

## DEEL A — GAS Weekplanner (bron van waarheid, `training/src/Planner.gs`)
- **A1:** tab `'Weekplanner'` (+ `'Weekplanner +1'` voor volgende week vooraf invullen). Range
  **A3:H9** = `getRange(3, 1, 7, 8)` (7 dagen ma-zo). `readPlanner(ss)` (`Planner.gs:396`) leest 'm;
  `materializeWeek_`/`ensureCurrentWeek` beheren rollover.
- **A2 kolommen** (`PLANNER_HEADERS`): A `Train?` (checkbox bool) · B `Dag` (label ma-zo, display) ·
  C `Datum` (Date) · D `Minuten` (getal, beschikbare min) · E `Dagtype` (dropdown
  `DAGTYPE_OPTIONS = ['pendel','vrij','weekend','recovery']`) · F `Toelichting` (vrije tekst) ·
  G `Voorgesteld type` (**door generator gevuld**, `writeVoorgesteldType`) · H `Gedaan?` (checkbox
  bool). `readPlanner` → `{dagIdx, dag, train, datum, minuten, type, notitie, voorgesteldType, gedaan}`.
  **User-invoer = train + minuten + dagtype + toelichting**; G = output, H = tracking.
- **A3 (beslissend): BEIDE.** Per-week datum-gebonden rijen (`materializeWeek_` schrijft per
  kalenderweek de datums + patroon), geseed uit een **terugkerend patroon** (DocProp `'pattern'`,
  `Utils.gs:113 getPattern`). Rollover op maandag (`ensureCurrentWeek`): losse week-afwijkingen
  rollen weg; `savePatternFromTab` promoveert de huidige week tot standaardpatroon; `'Weekplanner +1'`
  laat de week erna vooraf invullen.
- **A4 default-beschikbaarheid** (`defaultPattern_` `Utils.gs:96` ← `PLANNER_DEFAULTS`
  `Planner.gs:30`): **Dinsdag** train 150 min `pendel` ("Heen Z2 + terug intervallen") · **Donderdag**
  train 90 min `vrij` ("Vrije sessie") · **Zaterdag** train 120 min `weekend` ("Lange rit"). Overige
  4 dagen: geen train. `getPattern` = opgeslagen patroon óf deze default.
- **A5:** `readPlanner(ss)` voedt de schema-generatie (`generateProposal`, Algorithm.gs). Input-shape =
  de rij-objecten hierboven (dag-array).

## DEEL B — Cadans planner_days-datamodel (`workers/api/src/db/schema.ts:122`)
- **B1:** `plannerDays = sqliteTable("planner_days", { id (PK autoinc), userId (int, NOT NULL, FK →
  users.id), datum (text, NOT NULL), train (int 0/1), dag (text), minuten (int), dagtype (text),
  toelichting (text), voorgesteldType (text), gedaan (int 0/1) })`, uniqueIndex `(userId, datum)`.
  Alleen `id`/`userId`/`datum` NOT NULL; geen defaults.
- **B2 datum:** RAUWE ISO-datumstring `"yyyy-MM-dd"` (text, bare date — GEEN datetime). `readPlannerDays`
  (`repo.ts:300`) filtert met `mondayISO`/`sundayISO` als strings. **TZ-invariant** (anders dan
  activities.datum die datetime is) → geen debt-(d)-risico op de planner-datum.

## DEEL C — buildWeekProposal-input (consument, `apps/web/src/lib/proposal.ts`)
- **C1 (`:183`):** `grid = (plannerDays || []).map((pd, i) => ({ dagIdx:i, dag:pd.dag,
  datum:parseLocalDate(pd.datum), train:pd.train, gedaan:pd.gedaan, minuten:pd.minuten, type:pd.dagtype,
  voorgesteldType:pd.voorgesteldType, reden:null, archetypeId:null }))` → `GridDay[]`. Leest dus
  dag/datum/train/gedaan/minuten/dagtype/voorgesteldType.
- **C2:** ja — de generatie bestaat: `assignWorkouts(tePlannen, settingsE, mesoWeek, macroFase,
  dekking, {signal}, klimType, recentHard, debt, isTripEvent, taperCtx, grid)` (`proposal.ts:271`),
  gevolgd door `buildWorkout` per dag (`:305`). **Alleen de INPUT (planner_days) ontbreekt.**
- **C3 mismatch:** GEEN. De D1-kolommen (B1) = het `PlannerDay`-DTO (`packages/shared/src/weekgen.ts:11`)
  = wat `proposal.ts` leest. `toelichting` wordt gelezen in het DTO maar niet door `proposal.ts`
  gebruikt (onschuldig).

## DEEL D — Bestaande routes/client
- **D1:** alleen **`GET /api/planner/:monday`** (`routes/api.ts:210` → `readPlannerDays`, lege week →
  `[]` + 200). De Schema-tab leest 'm al via `getPlanner(monday)` (`apps/web/src/lib/api.ts`) in
  `loadSchemaWeek` → komt nu leeg terug.
- **D2:** de **SCHRIJF-kant ontbreekt volledig** — geen `POST`/`PUT /api/planner`, geen
  `writePlannerDays` in `repo.ts`, geen `insert(plannerDays)`, geen client-helper. Geen stub.

## DEEL E — Observaties + gap (feiten, geen implementatie)
- **Semantiek:** planner_days = INPUT-beschikbaarheid; de generator schrijft `voorgesteldType` terug
  (output), `gedaan` = tracking.
- **Patroon → UI-vorm:** per-week (datum-gebonden) invoer, geseed uit een terugkerend standaardpatroon
  → een 7-daagse week-editor (deze week + datums), plus eventueel "opslaan als standaardweek" +
  rollover/+1 (GAS-features).
- **Wat ontbreekt:** UI **én** een schrijf-route (upsert 7 `planner_days`-rijen per week) + client-helper.
  De generatie zelf niet — die draait al zodra het grid gevuld is. Optioneel: een default-materialize
  (7 rijen persisteren) óf een default-grid-fallback in `buildWeekProposal` bij lege planner.
- **Default (lege toestand):** Di 150/pendel, Do 90/vrij, Za 120/weekend; overige dagen geen train.
- **Open beslispunten:** (1) volledig patroon/rollover/+1 porten of eerst een simpele per-week editor +
  default-seed? (2) een gematerialiseerde default persisteren of `buildWeekProposal` een default-grid
  laten synthetiseren (geen persist)? (3) `gedaan` — in Cadans komt "voltooid" op de Schema-tab uit de
  activities (`doneByDate`), terwijl `buildWeekProposal` `pd.gedaan` gebruikt voor de tePlannen-filter:
  hoe/of wordt `planner_days.gedaan` gezet? (4) schrijft de route enkel de 4 invoervelden (+ datum) en
  laat het `voorgesteldType`/`gedaan` met rust (client leidt `voorgesteldType` live af)?
