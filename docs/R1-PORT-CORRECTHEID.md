# R1 — PORT-CORRECTHEID (findings)

Review-spoor R0 → **R1** → R2 → R3 → R4. Dit doc bevat **findings, geen verdicts**: R4 velt per
item "cutover-blokkerend ja/nee", getoetst aan `docs/TRAININGSMODEL.md` — niet aan GAS. GEEN
engine-wijziging in R1. Append-only, één commit per batch; nooit hernummeren.

Bronnen: GAS `daanhhk/training` @ `3e8090a` (BEVROREN — referentie, geen norm) naast Cadans @
`058a152`. Harness-cijfers zijn onafhankelijk gereproduceerd tegen verse read-only klonen
(`matrix.mjs` + `run.mjs`): 175 naam-matches — identiek 64 / equivalent 76 / verschil 35 —
alleen-in-GAS 473, alleen-in-Cadans 115; groepen 6/15/10/4.

## Leeswijzer per finding

- **locaties** — beide kanten, `bestand:regel`, zodat elke claim naar de bron te herleiden is.
- **matrix-cel** — groep + app-bereik. Reist mee omdat R4 het nodig heeft: `app-bereik nee` = niet
  bereikbaar vanuit de Cadans-app ⇒ per definitie niet cutover-blokkerend.
- **waar het verschil leeft** — `body` / `invulling` (seam-provider) / `aanroep` (argumenten).
  Eenheid van review = body + ÉÉN hop naar de invulling van de inputs. Verder = R2.
- **verklaard** — seam · platform-shim · gelogde divergentie (mét vindplaats) · formattering —
  óf **onverklaard**.
- **richting** — **geërfd** (GAS heeft hetzelfde gebrek) of **geïntroduceerd** (GAS kan dit niet).
  Dit is de as van de cutover-regel: de poort is "geen functionele regressie t.o.v. GAS".

---

## Scope-correctie — het label "FASE-B port-correctheid" dekt de lading niet

De FOCUS-regel noemt R1 "FASE-B port-correctheid" en schrijft matrix-groep 1+2 voor als
leesvolgorde. Dat zijn niet dezelfde verzameling. De FASE-B-engine-kern sorteert als
`equivalent`, niet als `verschil`, en zit dus in GEEN van de vier groepen:

`buildOverrideWorkout_`, `readinessAdjust_`, `coachAdaptatie_`, `coachFeedback_`,
`buildFreeRideWorkout_`, `findVariantById_`, `selectVariant_` = **equivalent [6]** ·
`getTrainingLibrary_`, `renderVariant_`, `getPool_` = **equivalent [5,6]**.

Alleen `assignWorkouts` (groep 2) en `buildWorkout` (groep 3) raken FASE B.

**Dit is geen gat.** `equivalent [6]` betekent dat de bodies AST-identiek zijn op `var`/`let`/`const`
na, mechanisch vastgesteld met een bewaker op var-lus-capture — sterker bewijs dan een handmatige
lees. Maar het moet hier staan, anders leest "R1 KLAAR" als "de FASE-B-fns zijn port-correct
bevonden" terwijl R1 ze niet één keer heeft aangeraakt. Wat WEL open blijft voor die fns is hun
**aanroep**, niet hun body: HANDOFF logt divergentie (3) — `previewOverrideSession` roept
`buildOverrideWorkout_` aan met `eventCtx` undefined. Body-gelijk, aanroep-verschillend.

**Voorstel voor de STAND-tekst:** noem R1 wat het is — port-correctheid van de 21 verschil-fns met
de zwakste oracle-dekking (groep 1+2) — en niet "FASE-B port-correctheid".

---

## Leesvolgorde (wijkt af van de matrix; set en dekking identiek)

De matrix sorteert op oracle-dekking. Gelezen wordt op **afhankelijkheid**, want
`assignWorkouts(days, settings, mesoWeek, macroFase, dekking, wellness, klimType, recentHardDate,
debt, isTripEvent, taperCtx, weekDays)` (`Algorithm.gs:985`) heeft als argumenten precies de uitvoer
van de rest van groep 2 — assembler op `Algorithm.gs:88-130`. Hem eerst lezen = hem twee keer lezen.

- **batch A (2)** — de seams: `getGewicht`, `mesoFactor`.
- **batch B (8)** — de keten: `expectedRpe_` → `rpeSignal_` → `wellnessSignal_` → `combineSignals_`
  → `rollingZoneCoverage_` → `zoneDebt_` → `recentHardDate_` → `assignWorkouts`.
- **batch C (11)** — de losse fns: `genericPendelIntervals`, `zwoStepFromRow_`, `dashVormReeks_`,
  `todayIso`, `isDayPlannable`, `durLabel`, `actualZone5_`, `isoWeekNumber`, `weekPlannedTypes`,
  `nextPlannableDate`, `maandLabel`.

De matrix-groep blijft per finding als risico-label staan.

---

# BATCH A — de twee seams

Beide fns zijn in de port vervangen door een seam. Debt (b) parkeerde ze samen in "Fase 3b/4". Die
fases staan in de roadmap op ✓. **Debt (b) is daarmee stale: de fases die de seams zouden vullen
zijn gesloten, en één van de twee is nooit gevuld.** Onderstaande twee findings zijn dezelfde vorm
met twee verschillende uitkomsten.

---

## A1 · `getGewicht` (GAS) → `getGewicht` (Cadans)

- **locaties** — GAS `src/Settings.gs:315` · Cadans `packages/engine/src/niveau.ts:26`
  (seam-declaratie `:22-28`), invulling `apps/web/src/lib/niveau.ts:55` en
  `apps/web/src/pages/Niveau.tsx:98`
- **matrix-cel** — groep 1 (verschil, geen enkele test in GAS noch Cadans) · app-bereik ja ·
  web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard · **invulling: ONVERKLAARD** · aanroep: zie A1-b

### Wat verschilt

GAS (`Settings.gs:315`, met `SETTINGS_DEFAULTS.gewicht: 75` op `Settings.gs:87`):

```js
function getGewicht() { return Number(loadSettingValue('gewicht')) || SETTINGS_DEFAULTS.gewicht; }
```

Cadans (`packages/engine/src/niveau.ts:22-28`) — de Sheet/DocProps-read is bewust niet geport en
vervangen door een injecteerbare seam:

```ts
let _getGewichtImpl: () => number = () => 0;
export function setGewichtProvider(fn: () => number): void { _getGewichtImpl = fn; }
function getGewicht(): number { return _getGewichtImpl(); }
```

Invulling, identiek op beide call-sites (`lib/niveau.ts:55`, `pages/Niveau.tsx:98`):

```ts
setGewichtProvider(() => settings?.gewicht ?? 0);
```

**De body is verklaard** (seam, debt (b)) — een DocProps-read hoort niet in een pure engine.
**De invulling is dat niet.** GAS gebruikt `||`: dat vangt `0`, `NaN` én leeg → altijd de default
75. Cadans gebruikt `??`: dat vangt alleen `null`/`undefined` → `gewicht: 0`. En 0 is bereikbaar:
`SettingsInput.gewicht` is `number | null` (`packages/shared/src/settings.ts:13`) en
`EMPTY_SETTINGS.gewicht = null` (`apps/web/src/lib/schema.ts:699`). De engine-default zonder wiring
is óók `() => 0`. **GAS kan nooit 0 teruggeven; Cadans wel.**

### Zichtbaar gevolg

Consument is `dashNiveauReeks_` (`niveau.ts:331` → `:348`), byte-gelijk aan `WebApp.gs:325`:

```ts
var nv = computeNiveau_(ftpM, gewM || huidigGewicht);
```

`computeNiveau_` (`niveau.ts:824`, byte-gelijk aan `WebApp.gs:929`) opent met
`if (!ftp || !gewicht) return { wkg: null, niveau: null };` — dus **geen crash, wel een gat**: bij
een lege gewicht-setting valt elk maandpunt zónder eigen gewicht in de rij weg
(`niveau: null`) waar GAS het tegen 75 zou hebben getekend. De Niveau-progressiegrafiek verliest
punten. Op prod is de setting gevuld → geen effect voor de huidige gebruiker; een verse gebruiker
raakt het wel (dat is precies het `EMPTY_SETTINGS`-pad).

Het gevolg staat als comment op de call-site (`pages/Niveau.tsx:97-98`: "Zonder gewicht → 0 →
niveau-punten zonder eigen gewicht = null"). Dat documenteert het **mechanisme**, niet dat GAS hier
iets anders doet, en het staat niet in HANDOFF als gelogde divergentie. Half-verklaard telt hier
als onverklaard.

- **richting — GEÏNTRODUCEERD.** GAS kan deze uitkomst niet produceren.

### A1-b · de bypass op de kop-waarde

GAS heeft drie `getGewicht()`-aanroepers, Cadans routeert er één via de seam:

- `WebApp.gs:325` → geport (`niveau.ts:331`), via de seam. ✔
- `WebApp.gs:1247` — `var gewicht = getGewicht(); var niv = computeNiveau_(settings.ftp, gewicht);`
  = de **huidige** W/kg-kopwaarde op de Niveau-tab. Cadans gaat om de seam heen
  (`pages/Niveau.tsx:103-106`): `computeNiveau_(settings?.ftp ?? null, settings?.gewicht ?? null)`.
  Zelfde netto-effect (geen 75-default), andere route. Los te noemen omdat een fix op de
  seam-invulling deze call-site **niet** raakt.
- `WebApp.gs:892` — `getRideDetail`, gewicht-resolutie detail → hit → `getGewicht()`. Nog niet
  geport (2d ritdetails = `SoonButton`). **Vooruit-noot voor 2d:** neem hier de `|| 75`-semantiek
  mee, niet `?? 0`.

### Debt-correctie

Debt (b) schrijft: "gewicht (Worker moet `setGewichtProvider` aanroepen met de D1-waarde)". De
Worker doet dat niet en hoort dat ook niet meer te doen — de weekgen/Niveau-afleiding is in Fase
5.3 client-side gegaan. De wiring bestaat, alleen op een andere plek dan debt (b) voorspelt. De
debt-tekst is achterhaald, niet de wiring.

---

## A2 · `mesoFactor` (GAS) → `mesoFactor` (Cadans)

- **locaties** — GAS `src/Algorithm.gs:44-48` · Cadans `packages/engine/src/utils.ts:48-50`
  (`MESO_MOD` op `:17-22`)
- **matrix-cel** — groep 1 (verschil, geen enkele test in GAS noch Cadans) · app-bereik ja ·
  web-ui-bereik ja
- **waar het verschil leeft** — **body: ONVERKLAARD** (de verklaring dekt de suite, niet productie)

### Wat verschilt

GAS (`Algorithm.gs:44-48`):

```js
function mesoFactor(week) {
  // b2: week-op-week demping (loadCarry, gezet door generateProposal) bovenop
  // de meso-ramp. Default 1 → geen demping als de prop niet gezet is.
  return (MESO_MOD[week] || 1.00) * (parseFloat(getDocProp('loadCarry', '1')) || 1);
}
```

Cadans (`utils.ts:48-50`):

```ts
export function mesoFactor(week: number): number {
  return MESO_MOD[week] || 1.0;
}
```

`MESO_MOD` is aan beide kanten identiek (`{1:1.00, 2:1.08, 3:1.15, 4:0.60}`). **De `× loadCarry` is
weg.** Er is géén seam: geen `setLoadCarryProvider`, geen parameter — de vermenigvuldiging is
verdwenen, niet uitgesteld.

### Wat loadCarry doet (en dus ontbreekt)

`generateProposal` zet 'm elke run (`Algorithm.gs:88-89`):

```js
var loadCarry = loadCarryFactor_(mesoWeek);   // b2: week-op-week ramp-demping uit vorige-week-RPE
setDocProp('loadCarry', loadCarry.factor);    // mesoFactor() leest dit DocProp
```

`loadCarryFactor_` (`Algorithm.gs:2038`) → `rpeLastWeekMismatch_` (`Algorithm.gs:2005`) →
`carryFactorForAvg_` (`Algorithm.gs:2029`):

- recovery-week (mesoWeek 4) → factor 1 (niet dubbel snijden bovenop `MESO_MOD[4]=0.60`)
- anders: gemiddelde RPE-mismatch (werkelijk − verwacht) over **vorige week ma-zo**, minimaal 2
  ingevulde RPE's; `< 2` → 1 · `≥ 2` → **×0,93** · `≥ 3,5` → **×0,88**

In mensentaal: **voelde vorige week structureel zwaarder dan gepland, dan snijdt GAS deze week 7%
of 12% van het volume.** De ramp blijft staan, de belasting zakt. Cadans doet dit niet.

**Dit is niet gedekt door de RPE-weg die wél geport is.** GAS heeft er twee, op verschillende assen:

| | venster | effect |
|---|---|---|
| `rpeSignal_` → `combineSignals_` → demote (**geport**, groep 2) | laatste 3 sessies (`rpeRecentMismatch_`, `Algorithm.gs:1969`) | wisselt workout-**types** (hard → lichter) |
| `loadCarryFactor_` → `mesoFactor` (**niet geport**) | vorige kalenderweek ma-zo (`rpeLastWeekMismatch_`) | schaalt **minuten/volume** van élke workout |

Intensiteit tegenover volume; laatste-3-sessies tegenover vorige-week. Geen substituut.

### De verklaring in de port dekt de suite, niet de app

De port verantwoordt zichzelf op `utils.ts:13-16`:

> The production loadCarry DocProp modulation (Algorithm.gs mesoFactor) defaults to 1 and is never
> set in the SelfTest, so it is lifted out here — behaviour-identical for the suite. Re-introducing
> loadCarry as a parameter is a later (data-in) phase.

Dat klopt allemaal — **voor de suite**. In productie zet `generateProposal` de prop wél
(`Algorithm.gs:89`). De conclusie ("lifted out") heeft suite-equivalentie stil opgewaardeerd naar
productie-equivalentie. Dit is exact de faalvorm die R0's vondst 1 al benoemde vanaf de andere kant
(AST-identiek én toch defect): de oracle bewijst niet wat hij lijkt te bewijzen. De 957-vloer heeft
dit niet kunnen zien — de suite zet loadCarry nooit.

### Blast-radius

`mesoFactor` wordt aan beide kanten door de hele workout-render-laag gelezen — GAS
`Algorithm.gs:2226` (`renderVariant_`), `:2507` (`expandArchetype_`-ctx), `:2569` (`requested`
minuten), `:2724/2743/2762/2781/2823/2882` (generieke workouts); Cadans dezelfde plekken, gesplitst
over `planner.ts:986/1469/1562/1829/1866/1903/1940/2024/2123` + `workouts/{ftp,vo2max,conditie,
beklimmingen}.ts`. Elke workout van de week schuift mee. Niet zichtbaar áls factor: GAS toont de
gedempte waarde in de waarom-lijst (`WebApp.gs:1086`: "Mesocyclus week N/4 · load 1.08×") en op het
Sheet (`Proposal.gs:92` + de reden-regel `:98-102`) — beide niet geport, dus in Cadans zou het
verschil in de plan-getallen zitten zonder tekst eromheen.

### Haalbaarheid van herstel (input voor R4, geen verdict)

De hele keten ontbreekt: `loadCarryFactor_`, `rpeLastWeekMismatch_`, `carryFactorForAvg_`,
`rpeWeekData_` — geen van vieren in Cadans. Debt (b)'s "te vullen in Fase 3b/4" is dus geen
wiring-klusje maar een port van vier fns + een parameter door de render-laag. **De data is er wel**:
A3 zette RPE-persistentie neer (`PUT /api/rpe/:date`) en `readiness.ts` leest de rpe-rijen al.

- **richting — GEËRFD noch geïntroduceerd: ONTBREKEND.** GAS heeft de veiligheidsklep, Cadans niet
  ⇒ functionele regressie t.o.v. GAS. Dat is de as waar de cutover-regel op scherp staat.

---

## Batch A — samenvatting

| # | fn | body | invulling | richting |
|---|---|---|---|---|
| A1 | `getGewicht` | verklaard (seam) | **onverklaard** (`?? 0` vs `\|\| 75`) | geïntroduceerd |
| A2 | `mesoFactor` | **onverklaard** (`× loadCarry` weg, geen seam) | n.v.t. | ontbrekend (regressie t.o.v. GAS) |

Overkoepelend: **debt (b) is stale.** Hij parkeert beide seams in "Fase 3b/4"; die staan in de
roadmap op ✓. Eén seam is elders gevuld dan de debt voorspelt en met andere fallback-semantiek dan
GAS; de andere is nooit gevuld en de keten die 'm zou voeden is niet geport. Beide zijn onzichtbaar
voor de 957-vloer en voor de vitest-vloer, omdat geen enkele test loadCarry zet of gewicht leeg laat.

---

# BATCH B — deel 1: de keten-inputs

Gelezen: `expectedRpe_`, `rpeSignal_`, `rollingZoneCoverage_`, `zoneDebt_`, `recentHardDate_`.
Nog te lezen (deel 2): `wellnessSignal_`, `combineSignals_`, `assignWorkouts`.

Deel 1 stopt hier omdat de vijf gelezen fns één gedeelde vondst opleveren die het lezen van de
laatste drie stuurt. **De ports zijn getrouw. De inputs zijn leeg.** Dat is een andere faalvorm dan
batch A (daar week de invulling af; hier is er geen invulling).

## B0 · Drie D1-velden die nooit geschreven worden

Batch A vond seams met een verkeerde invulling. Deel 1 vindt seams **zonder** invulling. Alle drie
zijn structureel: geen enkel code-pad schrijft ze. Niet waargenomen op prod-data — waarnemen is
overbodig als de schrijver niet bestaat.

### (i) `planner_days.voorgesteld_type` — schrijver bestaat, zet hardcoded `null`

`writePlannerDays` (`workers/api/src/db/repo.ts:352-377`) bouwt `vals` met `voorgesteldType: null` en
doet `onConflictDoUpdate({ target: [userId, datum], set: vals })` — dus ook een bestaande waarde
wordt op `null` gezet. `PUT /api/planner/:monday` (`workers/api/src/routes/api.ts:658`) accepteert het
veld niet (`api.ts:657`: "voorgesteldType/gedaan worden NIET geaccepteerd"). `packages/shared/src/
weekgen.ts:25` bevestigt: het is geen invoerveld. **Er is geen tweede schrijver in de repo.**
`readPlannerDays` (`repo.ts:341`) geeft het rauw terug ⇒ altijd `null`.

`packages/engine/src/planner.ts:736` zet `d.voorgesteldType = type` — maar dat is op de `grid`-kopie
in `buildWeekProposal` (`apps/web/src/lib/proposal.ts:239-251`), een NIEUW array. Het gaat nooit naar
D1 terug: HANDOFF is expliciet dat `proposal_*` niet gepersisteerd wordt.

### (ii) `planner_days.gedaan` — idem, hardcoded `0`

Zelfde `vals` in `writePlannerDays` (`repo.ts:367`): `gedaan: 0`, en `set: vals` overschrijft.
`readPlannerDays` (`repo.ts:342`): `gedaan: r.gedaan === 1` ⇒ altijd `false`. Geen tweede schrijver.
De client synthetiseert het ook niet: `proposal.ts:244` en `:301` lezen `pd.gedaan` rechtstreeks door.
(De dagkaart weet wél of er gereden is — die leest `activities`, niet dit veld. Het gat zit alleen in
de engine-input.)

### (iii) `weekplans.entries_json` — schrijver bestaat in de Worker, client roept 'm nooit aan

`PUT /api/weekplan/:monday` → `writeWeekplan` bestaat (`api.ts:638-652`, `repo.ts:151-169`). In
`apps/web` bestaat **geen** put-wrapper: `apps/web/src/lib/api.ts` heeft alléén
`getWeekplans` (`:141`, GET `/api/weekplans/recent`). De enige aanroepers van de PUT in de hele repo
zijn Worker-tests (`workers/api/test/routes.writes.test.ts:155`).

`readRecentWeekplans` (`repo.ts:193-223`) leest UITSLUITEND de `weekplans`-tabel en voedt daarmee
`gatherWeekplanEntries_`; er is geen synthese uit `planner_days`. Lege tabel ⇒ `[]` ⇒
`intentByDateFrom` (`proposal.ts:131-145`) ⇒ **`intentByDate = {}`**.

Dit is de tegenhanger van GAS' `weekplan_<monday>` DocProp, die `generateProposal` élke run schrijft
en die `intentZonesForDate_` en `plannedTypeForDate_` teruglezen. De R0-matrix vlagde
`intentZonesForDate_` al als blad-gat ("aangeroepen door een geporte fn, zelf niet geport"); de
vervanging is de `intentByDate`-seam. Het gat zit niet in de seam maar in zijn bron.

### Twee HANDOFF-claims die hierdoor niet kloppen

- debt (n): "`plannedTypeByDate` uit `PlannerDay.voorgesteldType` i.p.v. GAS
  `weekplan_<monday>.workoutType` (**day-mirror = dezelfde waarde**)". De day-mirror is altijd `null`;
  dezelfde waarde is het dus niet.
- `repo.ts:349` + `weekgen.ts:25`: "`voorgesteldType` blijft null (**client herberekent live**)". De
  client herberekent inderdaad — op de `grid`-kopie. Maar `plannedTypeByDate` (`proposal.ts:313-315`)
  leest `plannerDays`, níet de grid. De herberekening bereikt de consument nooit.

---

## B1 · `expectedRpe_`

- **locaties** — GAS `Algorithm.gs:1926-1929` · Cadans `packages/engine/src/readiness.ts:496-499`
- **matrix-cel** — groep 1 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body · **VERKLAARD**

Enige verschil: `RPE_EXPECTED_[b]` → `(RPE_EXPECTED_[b] ?? null)`. `rpeBucket_` (identiek aan beide
kanten, `Algorithm.gs:1912` / `readiness.ts:463`) kan uitsluitend `"anaerobic"`/`"high"`/`"low"`/`null`
teruggeven; alle drie zijn sleutels van `RPE_EXPECTED_` (`{low: 3.5, high: 7, anaerobic: 9}`, byte-gelijk
aan beide kanten, `Algorithm.gs:1910` / `readiness.ts:448-452`). De `?? null` is dus onbereikbaar —
een TS-typing-artefact (`noUncheckedIndexedAccess`), geen gedragsverschil. Ook als hij zou vuren:
alle aanroepers toetsen `!= null`, dat vangt `undefined` en `null` gelijk.

- **richting — n.v.t.** (geen gedragsverschil)

---

## B2 · `rpeSignal_` — getrouwe port, kan nooit vuren

- **locaties** — GAS `Algorithm.gs:1990-1997` (+ de twee fns die Cadans erin heeft geïnlined:
  `rpeRecentMismatch_` `:1969-1976` en `rpeWeekData_` `:1946-1960`) · Cadans
  `packages/engine/src/readiness.ts:521-551`, aanroep `apps/web/src/lib/proposal.ts:317`
- **matrix-cel** — groep 2 (verschil, alleen een Cadans-test) · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (drie GAS-fns geïnlined + seam) ·
  **invulling: ONVERKLAARD**

### De body klopt

De port voegt GAS' `rpeWeekData_` + `rpeRecentMismatch_` + `rpeSignal_` samen tot één pure fn met
geïnjecteerde data — vandaar 8 → 31 regels. Alles wat te toetsen valt, klopt: venster
`[maandag(todayISO) .. todayISO]` (GAS `rpeWeekData_` loopt `while (d <= today)` vanaf
`weekStartDate(today)`), `< 2` gegradeerde sessies → normal, `slice(-3)`, drempel `avg < 2` → normal,
`≥ 2` → demote, en de reason-string is byte-identiek. De volgorde-aanname ("rpeRows oudste-eerst",
`readiness.ts:517`) wordt waargemaakt: `readRpe` (`repo.ts:428-434`) doet `.orderBy(asc(rpe.datum))`
en `writeRpe` upsert op `(userId, datum)` ⇒ uniek per datum, oplopend.

### De invulling niet

```ts
// apps/web/src/lib/proposal.ts:313-317
const plannedTypeByDate: Record<string, string> = {};
for (const pd of plannerDays || []) {
  if (pd.voorgesteldType) plannedTypeByDate[pd.datum] = pd.voorgesteldType;
}
const rSig = rpeSignal_(rpe || [], plannedTypeByDate, todayLocalISO);
```

`pd.voorgesteldType` is altijd `null` — zie B0(i). Dus `plannedTypeByDate = {}` ⇒ voor élke rpe-rij
`expectedRpe_(undefined)` → `rpeBucket_(undefined)` → `!type` → `null` ⇒ `continue` ⇒ `diffs` blijft
leeg ⇒ `diffs.length < 2` ⇒ **`{ signal: "normal", reason: "" }`, altijd**.

`rpeSignal_` kan in de draaiende app nooit `demote` teruggeven. De RPE-bijsturing die het inbouwt
bestaat niet.

### Waarom geen test dit zag

De enige oracle is `testRpeSignal` (`packages/engine/src/selftest.test.ts:3493-3535`). Die bouwt de
map met de hand:

```ts
const T3: any = { "2026-03-09": "sweet_spot", "2026-03-10": "sweet_spot", "2026-03-11": "sweet_spot" };
assert_("rpe avg 2 → demote", "demote",
  rpeSignal_([{ datum: "2026-03-10", rpe: 9 }, { datum: "2026-03-11", rpe: 9 }], T3, "2026-03-11").signal);
```

De fn is correct; de test bewijst dat. Wat geen test aanraakt is de weg van D1 naar `T3`. Dit is
letterlijk de matrix-groep-2-caveat ("gedrag vastgelegd, nooit tegen de herkomst geijkt") — met de
scherpste uitkomst die die caveat kan hebben: het vastgeklikte gedrag is onbereikbaar.

- **richting — GEÏNTRODUCEERD.** GAS' `plannedTypeForDate_` (`Algorithm.gs:1931-1944`) leest
  `weekplan_<monday>` en valt terug op `proposal_<dISO>`; beide worden daar geschreven. GAS' pad vuurt.

---

## B3 · `rollingZoneCoverage_` — intent-tak dood, IF-fallback vangt op

- **locaties** — GAS `Algorithm.gs:300-329` (`rollingZoneCoverage`) · Cadans
  `packages/engine/src/weekprep.ts:58-88`, aanroep `apps/web/src/lib/proposal.ts:256`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (Sheet-read → seam) · invulling: gedegradeerd

Body is een getrouwe spiegel: zelfde venster, zelfde `CYCLING_TYPES`-filter, zelfde IF-drempels
(`≥0.95` anaerobic · `≥0.85` high · `≥0.80` high · `>0` low), zelfde volgorde (intent eerst, dán IF).
De twee gelogde afwijkingen (venster = 8 dagen bij `days=7`; missing zone-data → `actual=0`) staan in
debt (n).

Verschil in de praktijk: GAS' intent-tak leest `intentZonesForDate_` (weekplan-DocProp, wél gevuld) →
multi-bucket per activiteit. Cadans' `intentByDate` is leeg (B0-iii) ⇒ élke activiteit valt door naar
de IF-fallback ⇒ één bucket per rit i.p.v. meerdere. **Niet stuk, wel grover**: een rit die volgens
plan low+high dekte, telt in Cadans alleen in de bucket die zijn IF aanwijst.

- **richting — GEÏNTRODUCEERD** (GAS' intent-tak is daar bereikbaar), **impact klein**: de fallback
  is GAS-eigen code, geen Cadans-vondst, en `dekking` is een boolean-composiet.

---

## B4 · `zoneDebt_` — geeft altijd nul

- **locaties** — GAS `Algorithm.gs:492-561` (`computeZoneDebt_`) · Cadans
  `packages/engine/src/weekprep.ts:95-127`, aanroep `apps/web/src/lib/proposal.ts:296-305`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (Sheet-read + live-refetch-tak → seam; verklaart de
  krimp 70 → 33 regels) · **invulling: ONVERKLAARD, twee inputs tegelijk leeg**

```ts
// packages/engine/src/weekprep.ts:106-124
plannerDays.forEach((pd) => {
  if (!pd || !pd.train || !pd.gedaan || !pd.datum) return;      // ← pd.gedaan is ALTIJD false
  ...
  const intent = intentByDate[key] || { low: 0, high: 0, anaerobic: 0 };   // ← altijd de nul-fallback
  debt.low += (intent.low || 0) - actual.low;
```

`pd.gedaan` komt onbewerkt uit D1 (B0-ii) ⇒ de guard slaat **elke** dag over ⇒
`debt = {low:0, high:0, anaerobic:0}`, altijd. De tweede leegte (`intentByDate`, B0-iii) is daardoor
niet eens zichtbaar — zou `gedaan` ooit `true` worden zonder dat `weekplans` gevuld raakt, dan wordt
`debt = −actual`: **negatief**, want de port heeft bewust geen clamp (gelogd in debt (n),
"`zoneDebt_` zonder clamp (mag negatief, GAS-getrouw)"). De twee gaten moeten dus samen gedicht, of
het middel is erger dan de kwaal.

- **richting — GEÏNTRODUCEERD.** GAS' `computeZoneDebt_` leest de Weekplanner-sheet, waar `gedaan`
  wel bijgehouden wordt.

---

## B5 · `recentHardDate_` — intent-tak dood, IF draagt

- **locaties** — GAS `Algorithm.gs:336-352` (`recentHardDayDate_`) · Cadans
  `packages/engine/src/weekprep.ts:134-153`, aanroep `apps/web/src/lib/proposal.ts:306`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (Sheet-read → seam) · invulling: gedegradeerd, klein

```ts
let hard = (Number(r[7]) || 0) >= 0.85;                       // IF draagt het oordeel
const iz = intentByDate[key];
if (iz && (iz.high > 0 || iz.anaerobic > 0)) hard = true;     // intent kan alleen TOEVOEGEN
```

De intent is hier additief, niet leidend ⇒ met een lege map werkt de fn vrijwel volledig. Enige
verlies: een geplande harde sessie die met lage IF gereden is (afgebroken, verkeerd gemeten) telt in
GAS wél als "hard", in Cadans niet. `avoid-consecutive-hard` blijft dus staan.

- **richting — GEÏNTRODUCEERD, impact gering.**

---

## Deel 1 — wat dit betekent voor Model 2

HANDOFF noemt Model 2 (de auto-herplannende weekgen) PRIMAIR, en FASE 3a heeft het
override-make-up-model gesloopt (`0c954258`) mét die motivering. Model 2 leunt op vier signalen. Twee
kunnen niet vuren:

- `dekking` (`rollingZoneCoverage_`) — **werkt**, grover (IF i.p.v. intent)
- `zoneDebt_` — **altijd nul** (B4)
- `recentHardDate_` — **werkt** (B5)
- `rpeSignal_` → `combineSignals_` → demote — **altijd normal** (B2)

De read-only Model-2-bevestiging (`d74e257`) toonde dat de keten wérkt als de inputs gevuld zijn — de
test vult ze zelf. Dat is geen tegenspraak met deze vondst; het is dezelfde blinde vlek als bij
`testRpeSignal`.

**Geen verdict hier.** Wat R4 moet wegen: één schrijf-pad (voorgesteldType + gedaan + de
weekplan-snapshot) dicht drie gaten tegelijk, en het is dezelfde `weekplan_<monday>`-persistentie die
HANDOFF al drie keer als fundering noemt (verleden-dispositie, DayStrip-venster, past-completed-day
compare, "aanpak-B"). Die is dus niet alleen een feature-fundering maar ook de ontbrekende
engine-input. Losse noot: `zoneDebt_` mag pas aan zodra `weekplans` gevuld is (negatieve debt).

**Nog te lezen in deel 2:** `wellnessSignal_`, `combineSignals_`, `assignWorkouts` — de eerste twee
zijn de andere helft van het signaal-pad, `assignWorkouts` is de consument van alle vier.

# BATCH B — deel 2: het signaal-slot + de consument

Gelezen: `wellnessSignal_`, `combineSignals_`, `assignWorkouts`. Batch B is hiermee klaar (8/8).

## B6 · `wellnessSignal_` — getrouwe port, invulling KLOPT (de eerste in R1)

- **locaties** — GAS `src/Algorithm.gs:1251` (`getWellnessSignal`) · Cadans `packages/engine/src/readiness.ts:293`, invulling `apps/web/src/lib/readiness.ts:48` (`toWellRow`) + `:74` / `:87`, bron `workers/api/src/db/repo.ts:568-576`
- **matrix-cel** — groep 2 (verschil, alleen een Cadans-test) · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (seam + bewuste volgorde-omkering) · **invulling: VERKLAARD ÉN GEVERIFIEERD**

### De volgorde-omkering is correct

GAS' Wellness-tab staat NIEUWSTE-EERST: `syncWellness` (`src/Sync.gs:289`) sorteert expliciet aflopend op datum, en `src/Wellness.gs:1-5` + `:68` bevestigen het ("rij 2 = nieuwste, data staat nieuwste-eerst"). GAS' `hrvSeries.slice(0, 28)` = de NIEUWSTE 28, `slice(0, 3)` = de nieuwste 3, `sleepSeries[0]` = vannacht.

Cadans keert dat om (`slice(-28)` / `slice(-3)` / `sleepSeries[sleepSeries.length - 1]`). Dat is correct dan en slechts dan als de reeks OUDSTE-EERST binnenkomt. Nagerekend over de volle keten:

- `readWellness` (`repo.ts:568-576`) → `.orderBy(asc(wellness.datum))` = oudste-eerst
- `GET /api/wellness` (`workers/api/src/routes/api.ts:141`) → `serializeWellness` (`:126`) = een `map`, volgorde-behoudend
- `getWellness` (`apps/web/src/lib/api.ts:69`) → geen sortering
- `toWellRow` (`apps/web/src/lib/readiness.ts:48`) = een `map`, volgorde-behoudend
- alle drie de consumenten voeden uit `getWellness()`: `pages/Vorm.tsx:44`, `apps/web/src/lib/schema.ts:876`, en `proposal.ts:316` krijgt dezelfde array door

**Dit is de eerste fn in R1 waar de invulling-hop schoon is.** Het patroon van A1/B2-B5 (body goed, invulling leeg of fout) breekt hier — vermeldenswaard, want anders leest het patroon als een wetmatigheid.

### Wat wél verschilt (drie dingen, alle zonder gevolg)

1. De twee GAS-fallbacks (`wellnessFallback_('geen Wellness tab')` bij ontbrekende tab, `'geen wellness data'` bij lege) zijn samengevoegd tot één (`readiness.ts:295`, `rdyWellnessFallback_("geen wellness-data")`). De tab-tak is een Sheet-concept (seam, verklaard); de reason-STRING wijkt af met een streepje. Geen consument toont hem: de fallback geeft `signal: "normal"` ⇒ de demote-pass vuurt niet, en geen UI-component leest `.reason` van dit object.
2. `hrvDeficit`: GAS `(hrvBaseline && hrvRecent)` (truthy) → Cadans `hrvBaseline != null && hrvBaseline !== 0 && hrvRecent != null`; idem in de return (`hrvBaseline ? …` → `!= null ?`). Onbereikbaar: `rdyNumOrNull_` (`readiness.ts:269`) mapt `0` → `null`, dus elk gemiddelde is `null` of `> 0`. Alleen bij een NEGATIEF HRV-gemiddelde (fysiek onmogelijk) zou GAS `null` geven en Cadans `-100%` → demote. Genoteerd, niet gewogen.
3. De reason-strings van alle vijf de takken zijn byte-identiek (mechanisch vergeleken), evenals drempels en tak-volgorde.

### Eén venster-noot (klein, echt)

GAS' array is per constructie ≤ 32 rijen: `readWellnessValues_` (`src/WebApp.gs:91`) klemt op `WELL_STATS_ROW - 2` (`src/Wellness.gs:20` = 35) en `syncWellness` clear't + herschrijft de tab met precies `getWellness(30)`. Cadans' `readWellness` haalt de VOLLE tabel op (geen limit, geen datum-filter); `slice(-28)` pakt de nieuwste 28 RECORDS. Identiek zolang de laatste 28 dagen compleet zijn. Bij gaten in de laatste 30 dagen rekent GAS de baseline over wat er is, Cadans vult aan met records van vóór dag 30. Micro-afwijking in `hrvBaseline`; geen tak-wissel te verwachten.

- **richting — GEEN gedragsverschil op het signaal.**

---

## B7 · `combineSignals_` — getrouwe port, structureel inert

- **locaties** — GAS `src/Algorithm.gs:1229-1243` · Cadans `packages/engine/src/readiness.ts:560-575` (`SIGNAL_RANK_` `:455`, GAS `:1220` — beide `{normal:0, warning:1, demote:2, recovery:3}`), aanroep `apps/web/src/lib/proposal.ts:338`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (gelogde divergentie) · aanroep: verklaard (gelogde divergentie) · **invulling: het RPE-argument is dood (B2)**

### Body

Vier takken, alle vier gelijk: rpe normal/leeg → wellness ongewijzigd · strikt hogere rang → rpe's signal + reason · anders beide reasons → concat met `' + '` · anders ongewijzigd. Enige verschil: GAS muteert `wellness` IN-PLACE, Cadans bouwt een nieuw object (`{...w}`). Beide GAS-call-sites wijzen het resultaat toe aan dezelfde var (`Algorithm.gs:91`, `src/WebApp.gs:1043`) ⇒ de mutatie is onwaarneembaar. HANDOFF logt dit als bewuste, impactloze parity-divergentie ("niet-muterend … output-equivalent, caller gebruikt `.signal`"); **die claim is hier nagerekend en klopt.**

Eén onbereikbare vorm-afwijking: GAS' null-fallback is `{signal:'normal', reason:''}` (twee velden), Cadans' `rdyWellnessFallback_("")` het volle object met `hrvBaseline: null` etc. Beide leveranciers geven altijd een object terug; de tak is dood.

### De aanroep wijkt bewust af (gelogd)

`proposal.ts:320-338`: param 1 is niet `wSig` maar `baseWSig` — de holistische readiness-band vervangt het signal-veld (`ready→normal · caution→demote · rest→recovery`; band `null` → terugval op `wSig`). CLIENT-ONLY. Gelogd in HANDOFF als FASE-B-divergentie (1), commit `ae00730`. Verklaard.

### De vondst: param 2 is altijd 'normal'

`rSig = rpeSignal_(rpe || [], plannedTypeByDate, todayLocalISO)` (`proposal.ts:317`) → B2: `plannedTypeByDate` is altijd `{}` want `pd.voorgesteldType` is altijd `null` (B0-i) ⇒ `rSig.signal === "normal"`, altijd ⇒ `combineSignals_` valt uit op `readiness.ts:565` met `return { ...w }`.

**De fn is in de draaiende app een pure pass-through.** Correct geport, correct aangeroepen, doet nooit iets. Zijn hele bestaansreden — het RPE-signaal in het demote-pad mengen — is dood. Dit is de doorwerking van B2, geen tweede vondst; het staat hier omdat "`combineSignals_` is port-correct" zonder deze zin misleest.

- **richting — GEEN eigen gedragsverschil; erft B2's geïntroduceerde gat volledig.**

---

## B8 · `assignWorkouts` — body 1-op-1, vier gaten in de invulling

- **locaties** — GAS `src/Algorithm.gs:985-1172` · Cadans `packages/engine/src/planner.ts:475-777`, aanroep `apps/web/src/lib/proposal.ts:348`; assembler GAS `src/Algorithm.gs:88-130` ↔ Cadans `apps/web/src/lib/proposal.ts:230-346`
- **matrix-cel** — groep 2 (verschil, alleen een Cadans-test; GAS' `src/SelfTest.gs` noemt hem NUL keer) · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: verklaard (`redenCode` additief) · **invulling: ONVERKLAARD, vier gaten**

### De body is geen vindplaats

Genormaliseerde vergelijking van beide bodies (comments/whitespace weg, `var|let|const` → V, `function(){}` → arrow, TS-annotaties weg): **ratio 0.987**. Na het strippen van de `redenCode`-statements (2a; additief — zet een machineleesbare code náást de reden-string, raakt `type` nooit) blijft ÉÉN materiële afwijking over: de twee extra argumenten in `gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, null, null)` (`planner.ts:531`). De rest is formattering. De 188 → 302 regels zijn opmaak + `redenCode`, geen logica.

Alle vier de vondsten zitten in wat de fn VOEDT.

### (a) De cross-week archetype-recency wordt nooit gezaaid — en het B0-schrijfpad dicht dit NIET

`planner.ts:530-533` roept `gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, null, null)` aan. De derde parameter is de `readWeekplan`-accessor; `gatherWeekplanEntries_` (`planner.ts:454`) doet `const raw = readWeekplan ? readWeekplan(key) : null; if (!raw) continue;` ⇒ met `null` levert de lus ALTIJD `[]` ⇒ `recencyFromWeekplan_([])` → `[]` (`archetypes.ts:1378`) ⇒ **`qualityRecency` is leeg bij elke run.**

GAS zaait wél: `gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS)` (`Algorithm.gs:971`) leest 8 weken `weekplan_<monday>`-DocProps, die `generateProposal` elke run schrijft.

Wat de seed stuurt (`goalWorkout_`, `archetypes.ts:1313-1376`), twee dingen tegelijk:

1. `lastIntent` (`archetypes.ts:1322-1323`) → `goalPickIntent_(profiel, fase, lastIntent, …)` mijdt herhaling van dezelfde intent. Leeg ⇒ `lastIntent = null` ⇒ geen vermijding.
2. `gebruikt`/`staleness` (`archetypes.ts:1346-1355`) → recent gebruikte archetypes vallen uit de pool; de rest sorteert op profielvoorkeur → staleness → duurRange → id. Leeg ⇒ `gebruikt = {}` ⇒ pool = alle kandidaten, alle staleness-waarden gelijk ⇒ **deterministisch dezelfde winnaar, week na week.**

De in-loop-aanvulling (`planner.ts:741`) helpt niet waar het telt: `allocateQualityWeek_` draait ÉÉN keer VÓÓR de per-dag-loop (`planner.ts:538`) en krijgt dus altijd de lege seed. In Base/Build/Peak (`allocActive`, `planner.ts:513`) plaatst juist die allocator de kwaliteitsdagen.

**Zichtbaar gevolg:** elke week dezelfde sleutelsessie-variant in dezelfde volgorde. De archetype-rotatie — de reden dat de archetype-laag bestaat — staat uit.

**Waarom dit APART staat van B0-iii:** de data reist al mee. `readRecentWeekplans` (`workers/api/src/db/repo.ts:193-223`) bouwt een echte reader en roept dezelfde `gatherWeekplanEntries_` aan mét werkende accessor; het resultaat gaat via `GET /api/weekplans/recent` naar de client en komt in `buildWeekProposal` binnen als `weekplans` — waar het ALLEEN naar `intentByDateFrom` gaat (`proposal.ts:236`). `assignWorkouts` heeft geen parameter om het te ontvangen en geeft intern hardcoded `null` door. **Het weekplan-schrijfpad uit B0 vult de tabel, maar de seed bereikt `assignWorkouts` nog steeds niet.** Dit vraagt een tweede ingreep: een seed/reader-parameter door `assignWorkouts` heen (`allocateQualityWeek_` krijgt 'm al als 5e arg).

**Hoe het zichzelf verantwoordt:** `planner.ts:12-14` ("de PropertiesService-read is vervangen door de injecteerbare readWeekplan-accessor … assignWorkouts geeft null door (untested pad)") + `planner.ts:529` ("DATA-IN: het weekplan-lees-pad is untested in de port → null-accessor (geen seed)"). Dat documenteert het MECHANISME, niet dat GAS hier iets doet wat de gebruiker merkt, en het staat NIET in HANDOFF's divergentie-lijst. Zelfde vorm als A2 (`× loadCarry`): een suite-verantwoording stil opgewaardeerd tot productie-equivalentie. Half-verklaard telt als onverklaard.

- **richting — GEÏNTRODUCEERD.**

### (b) `doneHard` telt altijd 0 — het volle quotum bovenop wat al gereden is

`allocateQualityWeek_` (`planner.ts:173`, GAS `Algorithm.gs:818`), regels `planner.ts:215-220` ↔ `Algorithm.gs:837-840` (byte-gelijk): `doneScan.forEach(d => { if (d.gedaan && isHardType_(d.voorgesteldType, doel)) doneHard++; })` en `remaining = Math.max(0, quota - doneHard)`.

`weekDays` = de volle `grid` (`proposal.ts:239`, doorgegeven op `:359`). Twee velden, allebei leeg:

- `d.gedaan` ⇐ `pd.gedaan` ⇐ `readPlannerDays` (`repo.ts:342`) ⇐ `writePlannerDays` (`repo.ts:367`, hardcoded `gedaan: 0`) = ALTIJD false (B0-ii)
- `d.voorgesteldType` ⇐ idem hardcoded `null` (`repo.ts:366`) = ALTIJD null (B0-i); `isHardType_(null, doel)` (`planner.ts:153`) → geen high/anaerobic → false

⇒ `doneHard` = 0, altijd ⇒ `remaining = quota` ⇒ de plaatsingslus (`planner.ts:399`) plaatst het VOLLE quotum over de resterende dagen.

GAS telt wél: `readPlanner` (`src/Planner.gs:396`) leest `voorgesteldType` (kolom G, `:411`) en `gedaan` (kolom H, `:412`) uit de Weekplanner-sheet; `writeVoorgesteldType` (`:418`) schrijft de generator-output elke run terug (`Algorithm.gs:139`). **De dag-mirror is in GAS ECHT gevuld** — dat is de tegenhanger die B0-i/ii mist.

**Beide velden zijn nodig.** Alleen `gedaan` vullen laat `isHardType_(null)` false geven; alleen `voorgesteldType` vullen laat de `d.gedaan`-guard falen. Tweede argument voor B0's "één schrijf-pad", nu vanaf de consument-kant.

**Zichtbaar gevolg** (`kwaliteitPerWeek`, `archetypes.ts:1155/1165/1179/1193/1207`: Base 2 · Build 3 · Peak 2): woensdag in een Build-week met ma+di al hard gereden → GAS plaatst nog `3 − 2 = 1` kwaliteitsdag in wo-zo, Cadans nog 3. De rem op het weektotaal bestaat niet. `avoid-consecutive-hard` blijft wél staan (leunt op `recentHardDate_`, die uit de activiteiten komt — B5): twee harde dagen op rij worden nog vermeden, het weekTOTAAL niet.

**GAS' eigen noot op `Algorithm.gs:836`** ("0. quota − reeds-voltooide harde dagen (NB: bij wiring met tePlannen = 0; zie HANDOFF)") beschrijft precies deze faalmodus voor het geval `weekDays` ontbreekt. Cadans geeft `weekDays` wél door — en valt er alsnog in, via de lege velden. De bewaker is geport, de data eronder niet.

- **richting — GEÏNTRODUCEERD.**

### (c) De dekking-verrijking op voltooide dagen is dood — intensiteit uit een lange rit telt niet mee

Assembler `proposal.ts:266-292` ↔ GAS `Algorithm.gs:111-126`. Drie lagen op elkaar:

1. `rollingZoneCoverage_` over [today-7..today] → `dekking.X = rolling.X > 0` (`proposal.ts:256`) — **werkt** (B3, grover)
2. per voltooide dag van deze week: ≥ `DEKKING_MIN_MIN` (15; `planner.ts:49` = GAS `Algorithm.gs:14`) ECHTE zone-minuten in een bucket → `dekking[b] = true`
3. geen zone-data → terugval op `workoutZones(d.voorgesteldType, doel)`

Lagen 2 en 3 staan achter `if (!d.train || !d.gedaan) continue` (`proposal.ts:269`) ⇒ **beide dood** (B0-ii). Laag 3 zou bovendien op `d.voorgesteldType` leunen (B0-i) — dubbel dood. GAS' equivalent loopt over `voltooid` (`Algorithm.gs:96`) met gereconcileerde vinkjes (`ensureDataAndReconcile_`, `:83`) en leest de actuals uit `feedback.details` (`computeZoneDebt_`, `:105`).

**Laag 2 is NIET redundant met laag 1.** Laag 1 classificeert per ACTIVITEIT op IF (`≥0.95` anaerobic · `≥0.85`/`≥0.80` high · `>0` low); laag 2 telt de ECHTE zone-minuten. Een `combo_long_with_efforts` — lange rit, 20 min sweet-spot, IF ≈ 0,75 — komt in laag 1 in `low` terecht en zet `dekking.high` NIET; laag 2 zou dat wél doen (20 ≥ 15). Precies het meest voorkomende weekend-type.

**Zichtbaar gevolg:** na een lange rit met blokken denkt de planner dat de high-zone nog open staat ⇒ de weekend-tak (`planner.ts:675`) en `cov`/`keyIntensity` forceren extra intensiteit. Zelfde richting als (b).

- **richting — GEÏNTRODUCEERD.**

### (d) `tePlannen` sluit vandaag nooit uit

`proposal.ts:342` ↔ GAS `Algorithm.gs:100-102` (byte-gelijk): `train && !gedaan && (!datum || datum >= vandaag)`. Met `gedaan` altijd false (B0-ii) valt de middelste guard weg. De datum-guard dekt het verleden af ⇒ **alleen VANDAAG is geraakt**: een dag waarop al gereden is blijft plannbaar en telt mee in `eligible_` (`planner.ts:203`, GAS `Algorithm.gs:831`) ⇒ hij kan een quotum-plek krijgen die al op is. Kleinste van de vier, zelfde oorzaak, zelfde richting.

- **richting — GEÏNTRODUCEERD, impact klein.**

### Wat de oracle wél en niet vastlegt

`apps/web/src/lib/redenCode.test.ts` (de enige test die `assignWorkouts` direct drijft) geeft `days` als `weekDays` mee (`:85`) en zet in zijn dag-fixture `gedaan: false` (`:59`) + `voorgesteldType: null` (`:60`) — **exact de productie-leegte**. Hij legt de reden↔redenCode-koppeling per tak vast en is daarin correct; (b), (c) en (d) kan hij per constructie niet zien. `proposal.test.ts:636` drijft `assignWorkouts` indirect via `buildWeekProposal` met dezelfde lege velden. GAS' `src/SelfTest.gs` noemt `assignWorkouts`, `getWellnessSignal` en `combineSignals_` geen enkele keer.

---

## Deel 2 — samenvatting

| # | fn | body | invulling | richting |
|---|---|---|---|---|
| B6 | `wellnessSignal_` | verklaard (seam + volgorde-omkering) | **geverifieerd schoon** | n.v.t. |
| B7 | `combineSignals_` | verklaard (gelogde divergentie) | RPE-arg dood (B2) | erft B2 |
| B8 | `assignWorkouts` | verklaard (`redenCode` additief; ratio 0.987) | **onverklaard, 4 gaten** | geïntroduceerd |

Twee dingen die R4 uit deel 2 moet meenemen:

**1. Het B0-schrijfpad is NODIG maar niet GENOEG.** B0 concludeerde dat één schrijf-pad (`voorgesteldType` + `gedaan` + de weekplan-snapshot) drie gaten tegelijk dicht. Deel 2 voegt toe: het dicht ook B8-(b), (c) en (d) — maar **(a) NIET**. De recency-seed vraagt een tweede ingreep (seed/reader-parameter door `assignWorkouts`), want de data staat al bij de client en er is geen route naar de fn. Volgorde-eis blijft staan (`zoneDebt_` pas aan zodra `weekplans` gevuld is — negatieve debt).

**2. De vier gaten wijzen ALLE VIER dezelfde kant op.** (a) geen variatie · (b) het volle harde quotum bovenop wat al gereden is · (c) intensiteit uit een lange rit telt niet als gedekt → nóg meer intensiteit · (d) vandaag blijft plannbaar. Geen enkel gat wijst de andere kant op (minder belasting). Dat is geen toeval: elk van de vier is een REM die GAS heeft en Cadans niet, en elke rem leunt op dezelfde twee lege velden. Model 2's caveat uit deel 1 (twee van de vier signalen kunnen niet vuren) krijgt hier zijn scherpste vorm — niet alleen de signalen zijn dood, ook de quota-rem en de dekking-rem in de consument zelf.

**Batch B is klaar (8/8). Volgende: batch C (11 losse fns)** — `genericPendelIntervals`, `zwoStepFromRow_`, `dashVormReeks_`, `todayIso`, `isDayPlannable`, `durLabel`, `actualZone5_`, `isoWeekNumber`, `weekPlannedTypes`, `nextPlannableDate`, `maandLabel`.

# BATCH C — de elf losse fns

Geen keten, geen gedeelde inputs — op één na. `C0` is het cross-cutting blok (B0's tegenhanger
aan de settings-kant) en staat daarom vooraan: vier van de tien overige findings erven eruit.

**Methode-noot.** Batch C is niet alleen gelezen maar **gedraaid**: de engine is puur en bundelbaar,
de GAS-tegenhanger is uit de `.gs` te snijden en als module te importeren. Elke `zo gedraaid`-regel
hieronder is een differentiële run van beide kanten naast elkaar op ECHTE input (workout-rijen uit
`buildWorkout` zelf, weken uit `buildWeekProposal` zelf — geen verzonnen fixtures). Waar een leesronde
een vermoeden geeft, geeft een run een feit: twee claims uit de vorige leesronde zijn er door
gecorrigeerd (C7, C1-nuance), en één anker in de HANDOFF-micro-correctie bleek zelf fout.

---

## C0 · De `SETTINGS_DEFAULTS`-laag is niet geport

- **locaties** — GAS `src/Settings.gs:72` (`SETTINGS_DEFAULTS`, map `:72-96`) + `readSettings`
  `src/Settings.gs:263` (tien `|| SETTINGS_DEFAULTS.x`-velden, `:272-287`) + `getGewicht`
  `src/Settings.gs:315` + `getProfielPreset` `src/Settings.gs:316` · Cadans `readSettings`
  `workers/api/src/db/repo.ts:83` (rauw door, `:93-108`), `EMPTY_SETTINGS`
  `apps/web/src/lib/schema.ts:696` (alle velden `null`), D1-DDL
  `workers/api/drizzle/0000_redundant_maginty.sql:84-103` (geen enkele `DEFAULT`; `0001`/`0002`/`0003`
  voegen er ook geen toe)
- **matrix-cel** — geen fn-cel: dit is een LAAG, niet één unit. Raakt groep 1 (`genericPendelIntervals`)
  en groep 3 (`buildWorkout`) via de invulling · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — **invulling: ONVERKLAARD** (de laag is er niet)
- **richting — GEÏNTRODUCEERD.** GAS kán geen lege `settings.ftp` produceren.

### De structuur

GAS heeft drie accessors met een defaults-laag erin: `readSettings` (tien velden), `getGewicht` en
`getProfielPreset`. Een leeg veld is in GAS **onbereikbaar** — `Number(v('FTP')) || SETTINGS_DEFAULTS.ftp`
geeft 280, nooit `null`.

Cadans heeft die laag op GEEN van de drie niveaus: niet in de DDL (kolommen zijn nullable zonder
`DEFAULT`), niet in de repo (`readSettings` mapt 1-op-1 door), en niet in de client. `EMPTY_SETTINGS`
zet in plaats daarvan ALLES op `null` en is **bereikbaar**: `loadSchemaWeek`
(`apps/web/src/lib/schema.ts:846`) doet `settings ?? EMPTY_SETTINGS` op twee plekken — `:886` (naar
`buildWeekProposal`) en `:928` (naar de view-return).

### De breedte (gedraaid — dit was het openstaande deel)

Per veld: Cadans' `null` tegenover de GAS-DEFAULT voor datzelfde veld, over een echte
`buildWeekProposal`-run. **Zes van de twaalf lekken door naar zichtbare output:**

| veld | GAS-default | lekt? | wat je ziet |
|---|---|---|---|
| `ftp` | 280 | **ja** | elk wattage-bereik wordt `"0-0W"` |
| `lthr` | 178 | **ja** | elk hartslag-bereik wordt `"0-0 bpm"` |
| `doel` | `'FTP'` | **ja** | `"Pendel + null intervallen (…)"`; het interval-blok blijft `["—","—","—","—","—"]` |
| `pendelDuurMin` | 80 | **ja** | valt terug op `d.minuten` (dag-beschikbaarheid) i.p.v. 80 |
| `pendelAantal` | 2 | **ja** | `sessieCount` 1 i.p.v. 2 |
| `profielPreset` | `'Gevorderd 7u'` | **ja** | §2 Volume-stat leeg (zie de vocabulaire-noot) |
| `doelStart` | `new Date()` (`Settings.gs:76` + `:253-255`) | nee | Cadans' `null` geeft dezelfde uitkomst als GAS' vandaag-default: `macroFase` Base, `mesoWeek` 0 |
| `fase` | `'build'` | nee | Cadans' `""` (= `FASE_OPTIONS` "Automatisch", `apps/web/src/lib/settings.ts:165-168`) is output-equivalent |
| `doelDuur` | 12 | nee (hier) | geen effect op het voorstel; lekt WEL elders — zie onder |
| `hr_max` / `hr_rest` | 198 / 51 | nee | geen engine-consument aan beide kanten; alleen opslag + Instellingen-scherm |
| `gewicht` | 75 | nee (hier) | de seam van A1; buiten het voorstel |
| `threshold_pace` | `'4:27'` | n.v.t. | **geen Cadans-tegenhanger.** Bestaat alleen als dode D1-kolom (`workers/api/src/db/schema.ts:50`); staat niet in `SettingsInput` (`packages/shared/src/settings.ts:10-32`) en heeft nul consumenten |

Zo gedraaid: `genericPendelIntervals("pendel_intervals", null, EMPTY_SETTINGS, 2, "Build", null)` geeft
naam `"Pendel + null intervallen (150 min)"`, structuur-rij `["Heen Z2","75 min","0-0W","0-0 bpm",…]`,
blok `["—","—","—","—","—"]`. Een verse Cadans-user en een verse GAS-user geven **niet** dezelfde week.

**`doelDuur` lekt buiten het voorstel.** `doelTestWeken_` (`packages/engine/src/niveau.ts:723`) via
`apps/web/src/pages/Niveau.tsx:152`: met 12 → `2` (weken tot testdag), met `null` → `null` ⇒ de
testdag-teller op Niveau valt leeg. Zelfde oorzaak, andere consument.

### Debt (o) is stale — zelfde vorm als debt (b) in batch A

`HANDOFF.md:1094` noteert debt (o) als **OPGELOST**, en noemt exact twee van de leaks hierboven:
~~"· null"~~ (= `doel`) en ~~"0-0 bpm"~~ (= `lthr`). De oplossing die er staat is een **LOKALE D1-seed**
(`settings.doel='Ardennen-trip'`, `settings.lthr=178`) — expliciet "LOKAAL (miniflare…), NIET in
repo/remote". Dat is het symptoom wegnemen op één machine, niet de oorzaak. Debt (o) erkent dat zelf
half ("de `EMPTY_SETTINGS`-fallback in `loadSchemaWeek` verzacht een verse user maar raakt de
users-bootstrap-debt"), maar draagt de kop OPGELOST.

Waarom het niet opvalt: v1 is single-user (`CURRENT_USER_ID=1`) en die ene rij is gevuld. De leak is
**latent**, niet weg. Elke verse user — en het schema heet multi-user-ready — reproduceert 'm.

### Vocabulaire-noot bij `profielPreset` (migratie-relevant, geen R1-finding)

GAS: `PROFIEL_PRESET_OPTIONS = ['Amateur 3u','Gemiddeld 5u','Gevorderd 7u','Pro 10u+','Custom']`
(`src/Settings.gs:100`), default `'Gevorderd 7u'`. Cadans: `["amateur","gemiddeld","gevorderd",
"professional"]` (`apps/web/src/lib/settings.ts:110-119`) — andere sleutels, geen `Custom`, geen default.
Zo gedraaid: `presetHoursLabel("gevorderd")` → `"7u"`; `presetHoursLabel("Gevorderd 7u")` → `null`
(onbekende sleutel) → `view.volumeUren` leeg (`apps/web/src/lib/schema.ts:829`). **Een GAS-waarde die
1-op-1 gemigreerd wordt, geeft een lege Volume-stat.** Hoort op de migratie-mapping.

### Aangrenzende observatie — BUITEN R1-scope, signaal voor R2

Bij het natrekken van `profielPreset`: in GAS is dat veld een **engine-input**. `getVolumeTargets`
(`src/Algorithm.gs:31`, `presets[getProfielPreset()]` op `:38`) levert doel-uren/week per macro-fase en
heeft vier productie-aanroepers: `src/Proposal.gs:470`, `src/WebApp.gs:1302`, `src/Doel.gs:331`,
`src/TelegramBot.gs:405`. **In Cadans bestaat `getVolumeTargets` niet** (nul treffers in
`packages/`, `apps/web/src`, `workers/api/src`); `proposal.ts:84-85` documenteert `profielPreset`
expliciet als "WEB-ONLY: de engine leest profielPreset niet".

Dit is een **alleen-in-GAS**-unit ⇒ geen naam-match ⇒ geen matrix-cel ⇒ geen R1-verdict. Het staat hier
als signaal omdat het bij C0's veld hoort en R2 het anders niet tegenkomt: de matrix sorteert
naam-matches, en dit gat heeft per definitie geen tegenhanger om tegen te sorteren. (`HANDOFF.md:450`
schrijft bij de Volume-stat "GAS bouwt GÉÉN range"; `getVolumeTargets` levert wél ranges — bv.
`Gevorderd 7u` → `Build: [6, 9]`. Niet uitgezocht welke van de twee GAS-paden 4b bedoelde; R2.)

---

## C1 · `genericPendelIntervals` (GAS) → `genericPendelIntervals` (Cadans)

- **locaties** — GAS `src/Algorithm.gs:2819` · Cadans `packages/engine/src/planner.ts:2012`.
  Call-site: GAS `src/Algorithm.gs:2537` ↔ Cadans `packages/engine/src/planner.ts:1511`.
  Invulling: GAS `src/Algorithm.gs:191-193` (in `generateProposal`) ↔ Cadans
  `apps/web/src/lib/proposal.ts:392-397`
- **matrix-cel** — groep 1 (verschil, geen enkele test in GAS noch Cadans) · app-bereik ja ·
  web-ui-bereik ja
- **waar het verschil leeft** — body: **verklaard** · **invulling: ONVERKLAARD**
- **richting — GEÏNTRODUCEERD**, maar zie "geen simpele port-fout" hieronder

### De body is geen vindplaats

Zo gedraaid: 80.640 gevallen (5 types × 8 doelen × 14 minuten-waarden × 6 mesoWeeks × 6 macroFases ×
4 settings, incl. `null`/0/randwaarden) door beide implementaties → **nul verschillen**. `genericPendelZ2`
(GAS `:2798` ↔ Cadans `:1970`) idem: 1.080 gevallen, nul verschillen.

Twee cosmetische afwijkingen, beide zonder gevolg: GAS declareert `var heen = Math.floor(mins / 2),
terug = mins - heen;` (`Algorithm.gs:2822`) waarin **`terug` een dode var is** — nergens gebruikt in
deze fn (wél in `genericPendelZ2`, `:2811`); de port laat 'm weg (`planner.ts:2023` heeft alleen `heen`).
En `macroFase` → `_macroFase`: ongebruikt aan beide kanten.

### De vondst zit in de invulling: het pendel-veld betekent iets anders

`mins` komt uit `settings.pendelDuurMin` via de sessie-expansie. Die expansie is logisch byte-gelijk:

- GAS `Algorithm.gs:191-193`: `isPendel = d.type === 'pendel'` · `sessieCount = Math.max(1,
  Math.round(settings.pendelAantal) || 1)` · `sessieMin = settings.pendelDuurMin || d.minuten`
- Cadans `proposal.ts:392-397`: idem (`?? 0` i.p.v. impliciet — zelfde uitkomst bij `null`)

Maar de OPGESLAGEN waarde verschilt, omdat het veld anders heet en anders wordt weggeschreven:

- GAS: `PENDEL_DUUR = { row: 52, label: 'Pendel duur per rit', unit: 'min' }` (`src/Settings.gs:39`)
  naast `PENDEL_AANTAL = { row: 53, label: 'Pendel ritten per dag' }` (`:40`). Wat de gebruiker typt
  wordt rauw opgeslagen.
- Cadans: `<Row label="Pendel (enkele reis)" sub="heen + terug = 2×">`
  (`apps/web/src/pages/Instellingen.tsx:778`) schrijft `legToRoundTrip(v) = v * 2` weg
  (`apps/web/src/lib/settings.ts:172`). Het aparte veld `pendelAantal` ("Pendel-ritten", sub "per
  pendeldag", `Instellingen.tsx:793`) vermenigvuldigt daar in de expansie **nog eens** overheen.

Zo gedraaid, echte `buildWeekProposal`-run (week ma 13-07 t/m zo 19-07, doel FTP, Peak/mesoWeek 10),
gebruiker typt **40 min** met **2 ritten**:

| | dag-minuten | dag-TSS | sessies |
|---|---|---|---|
| GAS (opgeslagen 40) | **80** | **59** | `Pendel + Z2 (40 min)` + `Pendel + FTP intervallen (40 min)` |
| Cadans (opgeslagen 80) | **160** | **111** | `Pendel + Z2 (80 min)` + `Pendel + FTP intervallen (80 min)` |

Exact 2×. **Tweede-orde-effect in dezelfde run:** de verdubbelde pendel-belasting verschuift de
weekbalans — vrijdag kreeg bij 40 een `vo2max` en bij 80 een `threshold`. De fout blijft niet op de
pendeldag staan.

### Twee nuances die mee moeten

**(1) De fouten heffen elkaar NIET precies op — alleen de minuten.** Als `pendelAantal` leeg is
(Cadans `null` → `sessieCount` 1; GAS kan dit niet, default 2) geldt: dag-minuten 80 = 80 ✓, maar
**TSS 59 (GAS) tegen 63 (Cadans)** en **2 sessies tegen 1**. Bij GAS is de eerste sessie een
geforceerde `pendel_z2` (lichter) en de tweede de intervallen; bij Cadans is het één intervallen-sessie
van 80 min. Dit verklaart wél waarom het nooit opviel — de dagduur klopte.

**(2) GAS is hier zelf intern tegenstrijdig.** Het label zegt `'per rit'` en de aggregaat-naam is
`'Pendel ' + sessions.length + '× ' + sessieMin + 'm'` (`Algorithm.gs:233`) — beide lezen `mins` als
één rit. Maar **beide** pendel-generics splitsen `mins` in heen+terug (`Algorithm.gs:2801` en `:2822`)
— dat leest `mins` als een RETOUR. GAS' eigen default (`pendelDuurMin: 80`, `pendelAantal: 2`) is langs
beide lezingen 160 min/dag, met onderling strijdige structuur.

Commit `faed841` ("pendel duration as per-leg setting (store round-trip; engine splits heen/terug)")
koos bewust de tweede lezing en maakte het LABEL consistent met de engine — maar liet `pendelAantal`
erbovenop staan. De commit-tekst zegt het zelf: "pendelAantal unchanged".

⇒ **Dit is geen simpele port-fout maar een MODEL-vraag voor R4:** welke lezing is deugdelijk — is
`pendelDuurMin` één rit of een retour, en wat betekent `pendelAantal` dán? Zolang dat niet beslist is,
is "Cadans heeft het mis" een half antwoord: GAS heeft geen consistent antwoord om tegen te ijken.

**Anker-correctie.** `HANDOFF.md:650` verwijst voor de heen/terug-split naar `planner.ts:1948-1949`.
Dat anker was JUIST bij `faed841` (daar stond `genericPendelZ2`s split), maar is verschoven: op main
`1eaddfe` valt `:1948` in `genericSweetSpotLong` (`:1933`); de splits staan nu op `:1979-1980`
(`genericPendelZ2`) en `:2023` (`genericPendelIntervals`). Regeldrift, geen fout van toen.

---

## C2 · `zwoStepFromRow_` — functioneel identiek, de onbekende is dood

- **locaties** — GAS `src/Algorithm.gs:1753` · Cadans `packages/engine/src/zones.ts:368`.
  Deps (puur, meegesneden): `dslPowerRange_` GAS `:1656`, `dslDurationSec_` `:1682`,
  `dslRestFromNote_` `:1691`, `zwoPct_` `:1803`
- **matrix-cel** — groep 1 (verschil, geen enkele test) · app-bereik nee (geen productie-aanroeper —
  het push-pad is niet gebouwd) · web-ui-bereik nee
- **waar het verschil leeft** — body: **verklaard (formattering)** · invulling: n.v.t.
- **richting — n.v.t.** (geen gedragsverschil)

Zo gedraaid: **616 unieke ECHTE workout-rijen**, gewonnen uit `buildWorkout` zelf over 34 types × 5
doelen × 9 minuten-waarden × 4 mesoWeeks × 6 macroFases — dus precies de rijen die de app kan
produceren, geen verzonnen fixtures. × 4 FTP-waarden (280/200/350/0) = **2.464 gevallen**. Alle vijf
takken geraakt: `IntervalsT` 1504 · `SteadyState` 788 · `Warmup` 104 · `Cooldown` 60 · `null` 8.
**Nul verschillen.**

Het "verschil"-stempel van de matrix is een opmaak-artefact: string-concat → template literal, `var
range` → `const rng`, `var` → `const`/`let`. Meer niet.

### Dit corrigeert het OPENSTAAND-PUSH-blok

`HANDOFF.md:206` zet als stap (1) van de push-stapel: "`zwoStepFromRow_` van de leesstapel lezen — die
bepaalt letterlijk wat er op het apparaat komt **en wijkt af van GAS zonder dat iemand weet waarom**".
Die onbekende bestaat niet. De fn is functioneel 1-op-1 en dat is nu mechanisch vastgesteld op de volle
rij-ruimte die de app kan genereren. **Stap (1) vervalt**; de push-stapel begint bij (2)
`buildWorkoutZwo_` porten. De zin "hierna kan een fout een verkeerde training op het stuur geven" blijft
staan — maar niet vanwege déze fn.

---

## C3 · `dashVormReeks_` — geen gat, wél dode code

- **locaties** — GAS `src/WebApp.gs:225` · Cadans `packages/engine/src/niveau.ts:190`.
  GAS-aanroepers: `src/Algorithm.gs:1469` (de `reeks === undefined`-default in `getReadinessScore_`,
  fn-def `:1466`) en `src/WebApp.gs:1189`. Cadans-aanroeper: **alleen**
  `workers/api/test/wellness.test.ts:145`
- **matrix-cel** — groep 2 (verschil, alleen een Cadans-test) · app-bereik **nee** · web-ui-bereik nee
- **waar het verschil leeft** — body: **verklaard (seam)** · **aanroep: verklaard (bewuste bypass,
  geverifieerd equivalent)**
- **richting — n.v.t.**

Body byte-identiek op de seam na: GAS `if (!wellValues) wellValues = readWellnessValues_();` → Cadans
`if (!wellValues) wellValues = [];`.

### De bypass is echt en is equivalent

Cadans omzeilt de fn: `deriveReadiness` (`apps/web/src/lib/readiness.ts:68`) geeft op `:75` de RAUWE
`WellnessInput[]` door als `reeks`-argument aan `getReadinessScore_` — niet `dashVormReeks_(rows)`.

Dat werkt omdat de consument alleen `.vorm` leest: `getReadinessScore_`
(`packages/engine/src/readiness.ts:74`) raakt `reeks` uitsluitend op `:86-93` via
`reeks.filter(r => r.vorm != null)`, en `WellnessInput` draagt `vorm` zelf
(`packages/shared/src/wellness.ts:19`).

Zo gedraaid, zes wellness-dagen oudste-eerst: via `dashVormReeks_` → score **93 / ready**; via de bypass
→ score **93 / ready**; volledige result-objecten **byte-identiek**.

> **Hier ging de vorige leesronde bijna de fout in.** De hypothese "de reeks heeft de verkeerde vorm,
> dus de vorm-trend is dood" leek sterk — en was FOUT. Alleen het narekenen ving het. Een afgekapte blik
> op de interface (zonder `.vorm`) had een niet-bestaand gat opgeleverd.

### Het restrisico dat WEL genoemd moet — en het is gemeten

GAS' fn sorteerde ZELF (`out.sort(…)`, `WebApp.gs:241`). De bypass laat die vangnet-sortering vallen.
Zo gedraaid met dezelfde zes dagen in willekeurige volgorde: via `dashVormReeks_` nog steeds **93**
(hij sorteert zelf recht); via de bypass **83** — tien readiness-punten verschil. De
volgorde-garantie hangt nu **volledig** aan `readWellness`' `.orderBy(asc(wellness.datum))`
(`workers/api/src/db/repo.ts:576`). Vandaag houdt die; het vangnet eronder is weg.

---

## C4 · `todayIso`, C6 · `durLabel`, C8 · `isoWeekNumber` — infra, parity staat

Deze drie zijn **infra**: parity is de NORM, drift is een bug. De norm staat, alle drie gedraaid:

| # | GAS | Cadans | matrix | gedraaid | verschillen |
|---|---|---|---|---|---|
| C4 | `evTodayISO_` `src/Script.html:92` | `apps/web/src/lib/dates.ts:4` | groep 1 | 200 aanroepen | **0** |
| C6 | `trnDurLabel_` `src/Script.html:1907` | `apps/web/src/lib/schema.ts:715` | groep 2 | 972 invoerwaarden (−60…900 + fractioneel: 0.4/0.5/59.5/60.5/−1.5/…) | **0** |
| C8 | `isoWeek_` `src/Script.html:84` | `apps/web/src/lib/dates.ts:38` | groep 2 | 4.026 datums (elke dag 2020-2030 + jaargrens-randgevallen 2020-12-31/2021-01-04/2024-12-29/2015-12-28) | **0** |

Alle drie byte-getrouw · body: verklaard (formattering) · richting n.v.t.

---

## C5 · `isDayPlannable` — twee weggevallen takken, verantwoord

- **locaties** — GAS `trnPlannable_` `src/Script.html:1998` · Cadans `apps/web/src/lib/library.ts:176`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: **verklaard (gelogde vereenvoudiging, verantwoording houdt)**
- **richting — n.v.t.**

De twee GAS-takken die wegvallen staan in de code-comment (`library.ts:172-174`) en de verantwoording
houdt bij natrekken:

- `d.status === 'preview'` — bestaat niet in Cadans' 1-week-venster (vgl. de geparkeerde
  DayStrip-venster-feature; komt die er, dan komt deze tak terug)
- `d.status === 'vandaag' && state.vandaag.actual` — de same-day-flip zet zo'n dag al op state `done`
  (`schema.ts`, `isDone` → `state "done"`), dus de done-uitsluiting dekt 'm

GAS' null-guard (`if (!d || !state.vandaag) return false;`) ontbreekt. **Onbereikbaar:** de parameter is
`SchemaDay` (niet-nullable) en alle drie de call-sites voeden uit `deriveSchemaView`'s gemapte array —
`apps/web/src/components/schema/SchemaView.tsx:85` (guardt bovendien zelf `!!day &&`, want zijn eigen
`day` is optioneel), `apps/web/src/lib/library.ts:192` (binnen `nextPlannableDate`), en
`apps/web/src/pages/Trainingen.tsx:277`.

**VERKLAARD.**

---

## C7 · `actualZone5_` — body identiek, twee vondsten in de aanroeper

- **locaties** — GAS `coachActualZoneMin_` `src/WebApp.gs:728` · Cadans
  `apps/web/src/lib/schema.ts:285` (bucket-map `ZT_TO_ZONE5` `:254`). Aanroeper: Cadans
  `apps/web/src/lib/schema.ts:301` (`buildDoneEntry`, `actualZone5_`-call op `:317`) gevoed door de
  `doneByDate`-lus `:900-908` in `loadSchemaWeek`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: **verklaard** · **invulling: ONVERKLAARD (2 vondsten)**
- **richting — GEÏNTRODUCEERD; (b) in Cadans' voordeel — zie onder**

`ZT_TO_ZONE5` is byte-identiek aan GAS' inline map (`WebApp.gs:738`): Z1→rust · Z2→z2 · Z3→tempo ·
Z4→drempel · Z5/Z6/Z7→anaeroob; SS/overlays → skip; minuten = secs/60. De port **splitste de fn**: GAS
zoekt de activiteit zelf op (`getActivities(35)` + match-by-date), Cadans laat dat aan de aanroeper.
Daar leven beide vondsten.

### (a) Het fiets-filter valt weg — maar smaller dan het lijkt

GAS slaat niet-fiets-activiteiten over: `if (!a.start_date_local || CYCLING_TYPES.indexOf(String(a.type
|| '')) < 0) continue;` (`WebApp.gs:734`; `CYCLING_TYPES` op `Algorithm.gs:42`). De Cadans-lus
(`schema.ts:900-908`) filtert **niet**. `CYCLING_TYPES` bestaat wel (`packages/engine/src/zones.ts:9`)
maar wordt alleen gebruikt in `zones.ts:107` en `weekprep.ts:72` — niet hier. Stroomopwaarts filtert
niets: `mergeById_` (Cadans `packages/engine/src/sync.ts:145`, GAS `src/Sync.gs:190`) filtert aan géén
van beide kanten op type, en `readActivities` (`workers/api/src/db/repo.ts:291`) filtert alleen op datum.

Zo gedraaid, `buildDoneEntry` op echte niet-fiets-rijen (zoals `activityToRow_` ze wegschrijft): een
`Run`, `WeightTraining` en `Swim` krijgen alle drie een gevulde `zoneMin5`; end-to-end via
`deriveSchemaView` flipt de dag naar state `done` met naam, TSS en zone-balk.

**MAAR — en dit corrigeert de eerdere leesronde:** GAS' VOLTOOID-kaart komt niet uit
`coachActualZoneMin_` maar uit `dashActivityScan_` (`src/WebApp.gs:106`) → `actualsByDate`
(`:126-134`), en **dáár zit geen type-filter**. Een hardloopje vult de kaart dus **ook in GAS**. Het
geïntroduceerde verschil is beperkt tot de **zone-balk**: GAS toont zo'n dag mét kaart maar zónder
zone-balk (`coachActualZoneMin_` → `null` → `getDayCoachZones` valt terug), Cadans mét. De claim "een
hardloopje kan de VOLTOOID-kaart vullen" is dus GEEN Cadans-vondst.

*Empirische grens:* de zone-balk-leak vereist dat de niet-fiets-activiteit daadwerkelijk
`icu_zone_times` draagt. Of intervals.icu die voor een hardloop-/krachtsessie emit, is buiten de repo
niet vast te stellen — geen bewijs, geen weerlegging.

### (b) Drie verschillende selectie-regels op één dag

- GAS `dashActivityScan_` (`:126`): **hoogste idx0-timestamp per datum wint** — één rit, de rest valt weg
- GAS `coachActualZoneMin_` (`:735`): **eerste matchende fietsrit** (`break`)
- Cadans `doneByDate`-lus (`:907`) + `mergeDone` (`:324`): **merget ALLE activiteiten van de dag** (som
  tss/minuten/zones; naam+type van de langste)

Zo gedraaid, echte pendeldag met twee ritten (heen 07:30, 40 min, 26 TSS · terug 17:30, 40 min, 33 TSS):

| | kaart toont |
|---|---|
| GAS `dashActivityScan_` | `"Woon-werk terug"` — **33 TSS / 40 min** (heen verdwijnt) |
| GAS zone-balk (`coachActualZoneMin_`) | uit `"Woon-werk heen"` — de ANDERE rit dan de kaart |
| Cadans `mergeDone` | **59 TSS / 80 min** (som) |

GAS toont op een pendeldag de helft van de gereden belasting, en haalt kaart en zone-balk uit
verschillende ritten. Cadans' merge is inhoudelijk het betere antwoord — een pendeldag *is* twee ritten.
**Richting geïntroduceerd, maar naar de deugdelijke kant.** R4-vraag: is "som de dag" de norm? Zo ja,
dan is dit geen regressie maar een stille verbetering die als zodanig vastgelegd hoort te worden — nu
staat hij nergens.

---

## C9 · `weekPlannedTypes` — de badge vergeet op vrijdag wat je maandag reed

- **locaties** — GAS `weekPlannedTypes_` `src/Algorithm.gs:2447` · Cadans
  `apps/web/src/lib/library.ts:204`. Aanroepers: GAS `src/WebApp.gs:1391` (+ override-merge `:1392-1398`)
  · Cadans `apps/web/src/pages/Trainingen.tsx:212`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: n.v.t. (**andere handtekening**) · **invulling: ONVERKLAARD**
- **richting — GEÏNTRODUCEERD; oorzaak = B0-i**

De handtekeningen verschillen fundamenteel: GAS leest de `weekplan_<maandag>`-DocProp (= de B0-iii-bron,
in GAS WÉL gevuld) en pakt `e.workoutType || e.voorgesteldType`. Cadans leest `d.voorgesteldType` over
`SchemaDay[]`.

### De keten is in zoverre schoon — de tweede B6-achtige uitzondering

`d.voorgesteldType` is NIET altijd leeg, ondanks B0-i. De grid-seed is dat wel
(`proposal.ts:247` = `pd.voorgesteldType` = altijd `null`), **maar `assignWorkouts` overschrijft op de
grid** (`packages/engine/src/planner.ts:736`) → `ProposalDay.voorgesteldType` (`proposal.ts:443-447`) →
`SchemaDay.voorgesteldType` (`schema.ts:808`). Dus gevuld. Zoals B6: "body goed, invulling leeg" is een
patroon, geen wetmatigheid — blijf het per fn vragen.

### Maar alleen voor de toekomst

`assignWorkouts` krijgt alleen `tePlannen` mee (`proposal.ts:342-347`: `train && !gedaan && datum >=
vandaag`) ⇒ **verstreken dagen houden `null`**.

Zo gedraaid, echte `buildWeekProposal`-run, week ma 13-07 t/m zo 19-07 met vandaag = do 16-07:
ma/di/wo → `voorgesteldType` `null`; badge-set = `{pendel_ftp_intervals, pendel_z2, long_z2}` — alleen
uit do..zo. GAS' badge leest de snapshot ma..zo **inclusief gereden dagen**, plus de override-merge.

**Zichtbaar gevolg:** de "In je blok"-badge op de Trainingen-tab toont op vrijdag niet meer wat je
maandag gepland had. Hoe later in de week, hoe leger de badge.

---

## C10 · `nextPlannableDate` — bevestigde debt

- **locaties** — GAS `trnNextPlannableDate_` `src/Script.html:2005` · Cadans
  `apps/web/src/lib/library.ts:187`. Call-sites: `apps/web/src/pages/Trainingen.tsx:218` en `:278`
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: **verklaard (byte-getrouw, incl. de sort)**
- **richting — GEËRFD**

Byte-getrouw inclusief de sort. De GAS-getrouwe fallback geeft **altijd** `todayISO`: GAS' `state.vandaag
? state.vandaag.dateISO : null` kan de `null`-tak niet halen (`state.vandaag` is gezet zodra
`trnPlannable_` überhaupt draait), Cadans' `todayISO` evenmin ⇒ GAS' "Geen plan-dag beschikbaar."-tak is
**dode code aan beide kanten**.

De echte beslissing leeft op de call-site: `Trainingen.tsx:277` guardt op
`view.days.some(d => isDayPlannable(d, todayISO))` en zet `target` op `null` als er geen echte kandidaat
is (`:278`) — de code-comment op `:273-274` benoemt dat expliciet. Bevestigt de bestaande HANDOFF-debt;
geen nieuwe vondst.

---

## C11 · `maandLabel` — drie implementaties, drie randgevallen

- **locaties** — GAS `nlMaandLabel_` `src/Script.html:1415` (`NL_MND` `:1414`) · Cadans gedeeld
  `apps/web/src/lib/niveau.ts:32` · Cadans **KOPIE**
  `apps/web/src/components/niveau/ProgressieCard.tsx:30`. Call-sites: `ProgressieCard.tsx:57` (de
  grafiek-labels, gebruikt de KOPIE) · `apps/web/src/lib/niveau.ts:103` (`sinceMonth`, de gedeelde)
- **matrix-cel** — groep 2 · app-bereik ja · web-ui-bereik ja
- **waar het verschil leeft** — body: **ONVERKLAARD (duplicatie)** · gedragsverschil: **onbereikbaar**
- **richting — n.v.t.** (geen bereikbaar gedragsverschil); de duplicatie is **alleen-in-Cadans**-risico

De R0-debt is echt: drie implementaties, drie verschillende terugvallen. GAS valt terug op `'?'` +
`slice(-2)`; beide Cadans-versies op `""` + `slice(2)`; de lib-versie (`apps/web/src/lib/niveau.ts`) heeft een extra length-guard
(`p.length < 2` → geeft de input terug), de KOPIE heeft die niet en defaultet `m = "1"` → verzint "jan".

Zo gedraaid, alle drie naast elkaar:

| invoer | GAS | `apps/web/src/lib/niveau.ts:32` | `ProgressieCard.tsx:30` |
|---|---|---|---|
| `"2026-03"` | `"mrt '26"` | `"mrt '26"` | `"mrt '26"` |
| `"2026"` | `"? '26"` | `"2026"` | `"jan '26"` |
| `""` | `"? '"` | `""` | `"jan '"` |
| `"abc"` | `"? 'bc"` | `"abc"` | `"jan 'c"` |
| `"2026-13"` | `"? '26"` | `" '26"` | `" '26"` |
| `"26-03"` | `"mrt '26"` | `"mrt '"` | `"mrt '"` |

Op welgevormde `"jjjj-MM"`: **132 waarden (2020-2030 × 12 maanden), nul divergentie**.

**ONBEREIKBAAR:** `p.maand` = `formatDate(cur, "yyyy-MM")` aan BEIDE kanten (Cadans
`packages/engine/src/niveau.ts:340`, GAS `src/WebApp.gs:331`) ⇒ altijd welgevormd. Alleen de gedeelde
versie is getest (`apps/web/src/lib/niveau.test.ts`); de KOPIE — die de zichtbare grafiek-labels levert —
is dat niet.

⇒ **Echte duplicatie-schuld, geen gedragsverschil, alleen-in-Cadans-risico.** De divergentie is vandaag
onbereikbaar; ze wordt bereikbaar zodra één van beide `maand`-bronnen ooit iets anders levert dan
`formatDate`.

---

## Bonus-vondst · `plannedForDone` is dode code — en het B0-pad wekt hem

Geen matrix-fn (alleen-in-Cadans), wel R4-kritisch.

De guard (`apps/web/src/lib/proposal.ts:420-424`): `!tePlannenSet.has(d.dagIdx) && d.train &&
d.voorgesteldType && d.minuten`. Met `gedaan` altijd `false` (B0-ii) is `tePlannen` = `train && datum >=
vandaag`, dus `!tePlannenSet && d.train` ⇒ `datum < vandaag` ⇒ `d.voorgesteldType` is de grid-seed
(`proposal.ts:247`) = altijd `null` (B0-i) ⇒ **`plannedForDone` is ALTIJD `null`**.

Zo gedraaid, echte week-run: `null` op alle 7 dagen. Ook mét `gedaan: true` op ma+di in de
planner-input (wat D1 nooit levert): nog steeds 0 van 7.

Dit is de mechanische verklaring voor "VERLEDEN voltooide dagen tonen de gereduceerde DoneDetail" —
door Daan zelf vanuit de app bevestigd. HANDOFF schrijft het toe aan een bewuste productbeslissing +
niet-reproduceerbaarheid (aanpak A flipt het plan); die redenering staat overeind, maar de CODE faalt om
een simpelere reden: **het veld is leeg**.

### Waarom dit R4-kritisch is

HANDOFF's **"aanpak B"** (`voorgesteldType` persisteren bij generatie) **ÍS het B0-schrijfpad**.

Zo gedraaid met een gesimuleerd B0-pad (`plannerDays[].voorgesteldType` gevuld voor ma/di/wo):
`plannedForDone` komt op alle drie de verstreken dagen tot leven — `"Threshold 2×20 (Peak)"`,
`"Pendel + Z2 (90 min)"`, `"VO2 5×4min (Peak)"`. **En C9's badge herstelt in dezelfde run mee.**

⇒ Het B0-pad heeft **twee neveneffecten**: het repareert C9 (badge) én het wekt `plannedForDone`. Het
eerste is een bugfix, het tweede een **PRODUCTbeslissing** — verleden voltooide dagen gaan dan vanzelf de
volle plan-vs-gedaan-vergelijking tonen in plaats van de gereduceerde kaart. Dat is niet optioneel bij
dat pad; het gebeurt vanzelf. Zet dit expliciet bij B0's "nodig maar niet genoeg"-herziening: het pad is
niet alleen groter dan gedacht, het is ook niet gedrags-neutraal.

---

## Batch C — samenvatting

| # | fn | body | invulling | richting |
|---|---|---|---|---|
| C0 | *(settings-defaults-laag)* | n.v.t. | **ONVERKLAARD — 6 van 12 velden lekken** | geïntroduceerd |
| C1 | `genericPendelIntervals` | verklaard (80.640 cases, 0 diff) | **ONVERKLAARD — 2× de pendel-belasting** | geïntroduceerd (model-vraag) |
| C2 | `zwoStepFromRow_` | verklaard (2.464 cases, 0 diff) | n.v.t. (geen productie-aanroeper) | n.v.t. |
| C3 | `dashVormReeks_` | verklaard (seam) | **geverifieerd schoon** (dode code + verloren vangnet) | n.v.t. |
| C4 | `todayIso` | verklaard (200 cases, 0 diff) | n.v.t. | n.v.t. |
| C5 | `isDayPlannable` | verklaard (2 takken verantwoord) | n.v.t. | n.v.t. |
| C6 | `durLabel` | verklaard (972 cases, 0 diff) | n.v.t. | n.v.t. |
| C7 | `actualZone5_` | verklaard (map byte-identiek) | **ONVERKLAARD — 2 vondsten** | geïntroduceerd; (b) naar de deugdelijke kant |
| C8 | `isoWeekNumber` | verklaard (4.026 cases, 0 diff) | n.v.t. | n.v.t. |
| C9 | `weekPlannedTypes` | n.v.t. (andere handtekening) | **ONVERKLAARD — badge vergeet het verleden** | geïntroduceerd (erft B0-i) |
| C10 | `nextPlannableDate` | verklaard (byte-getrouw) | n.v.t. | geërfd |
| C11 | `maandLabel` | **ONVERKLAARD (3 implementaties)** | onbereikbaar | n.v.t. |

### Wat batch C toevoegt aan het R1-patroon

**1. Het patroon houdt, met twee uitzonderingen.** Geen enkele batch-C-vondst zit in een fn-body — net
als in A en B. C0, C1, C7 en C9 zitten alle vier in de invulling. C11 is de uitzondering die de regel
bevestigt: dáár zit het verschil wél in de body, en juist dáár is het onbereikbaar.

**2. Draaien is geen luxe.** Batch C is de eerste batch die differentieel gedraaid is, en dat corrigeerde
drie dingen die een leesronde niet zag: C3's "vorm-trend is dood" (fout — de bypass is equivalent), C7's
"de VOLTOOID-kaart vult bij een hardloopje" (te groot — GAS doet dat ook; het echte verschil is de
zone-balk + de selectie-regel), en C1's "de fouten heffen elkaar op" (half — alleen de minuten). Een
leesronde geeft een vermoeden, een differentiële run een feit. **Aanbeveling voor R2:** dezelfde
harness gebruiken, niet opnieuw alleen lezen.

**3. B0 is nu drie keer zo groot als bij zijn eerste formulering.** Batch B deel 2 voegde de drie remmen
in `assignWorkouts` toe. Batch C voegt toe: C9 (badge) én `plannedForDone` (productbeslissing). Het
"één schrijf-pad"-verhaal is geen opruimklus meer maar een ingreep met zichtbare gedragsgevolgen.

**4. Twee vondsten zijn MODEL-vragen, geen port-fouten.** C1 (is `pendelDuurMin` één rit of een retour?
GAS heeft zelf geen consistent antwoord) en C7-(b) (som je de dag of pak je één rit? Cadans' antwoord is
het betere). Bij beide is "Cadans wijkt af van GAS" een waar maar nutteloos verdict. Ze horen in R3/R4
tegen `docs/TRAININGSMODEL.md`, niet tegen de herkomst.

**Batch C is klaar (11/11). R1 is klaar (21/21).** Volgende: R2 — end-audit op de risico-matrix.

---

# Anker-correcties op batch B deel 2 (append-only; de oude tekst is bewust NIET geëdit)

`HANDOFF.md:77-81` noteert drie locatie-ankers uit het deel-2-blok als "wijzen naast de bedoelde
regel" en schrijft de correctie voor. Alle drie zijn hier **mechanisch her-afgeleid tegen de bron**
(niet overgenomen). **Twee kloppen; de derde is zelf fout.**

| doc-regel | oud anker | HANDOFF schrijft voor | **feitelijk correct** | oordeel |
|---|---|---|---|---|
| `docs/R1-PORT-CORRECTHEID.md:551` | `Algorithm.gs:91` | `:92` | **`:92`** | HANDOFF klopt |
| `docs/R1-PORT-CORRECTHEID.md:525` | `pages/Vorm.tsx:44` | `:45` | **`:45`** | HANDOFF klopt |
| `docs/R1-PORT-CORRECTHEID.md:525` | `schema.ts:876` | `:872` | **`:874`** | **HANDOFF is FOUT** |

- **`Algorithm.gs:91` → `:92`** ✓ — `:91` is `var wellness = getWellnessSignal(ss);` (de
  var-declaratie); `:92` is `wellness = combineSignals_(wellness, rpeSignal_());` — de bedoelde
  `combineSignals_`-call-site.
- **`pages/Vorm.tsx:44` → `:45`** ✓ — `:44` is `getSettings()`; `:45` is `getWellness()` — de bedoelde
  regel in de `Promise.all`.
- **`schema.ts:876` → `:872`** ✗ — **de voorgeschreven correctie is óók fout.** In
  `apps/web/src/lib/schema.ts` is de `Promise.all` in `loadSchemaWeek` (`:868-879`): `:872` =
  `getActivities()`, **`:874` = `getWellness()`**, `:876` = `getDispositions()`. Het oude anker
  (`:876`) en het voorgeschreven anker (`:872`) wijzen allebei naast de bedoelde regel. **Het juiste
  anker is `:874`.**

Alle drie zitten in bijzin-materiaal (B6's "alle drie de consumenten voeden uit `getWellness()`"); geen
bevinding wordt geraakt, de dragende bewijsregels van deel 2 zijn hard getoetst en goed. De
**inhoudelijke** claim op `:525` — dat alle drie de consumenten uit `getWellness()` voeden — is hier
opnieuw geverifieerd en staat: `pages/Vorm.tsx:45`, `apps/web/src/lib/schema.ts:874`, en
`proposal.ts:316` krijgt dezelfde array door.

**Werkwijze-noot.** Dat de HANDOFF-correctie zelf fout was, is precies waarvoor de werkwijze-les uit
batch B bedoeld is: *toets locatie-claims door ze MECHANISCH uit de geschreven tekst te extraheren en
allemaal te draaien — nooit via een handgemaakte lijst.* Deze correctie was een handmatig
overgeschreven getal, en is daarmee dezelfde klasse fout als de drie die hij moest repareren. In batch
C is de regel wél toegepast: 105 ankers met een regex uit de eigen tekst geëxtraheerd, 121 dragende
ankers met een inhouds-assertie (bestand + regel + verwachte substring) tegen beide klonen gedraaid.
Dat ving drie foute ankers **in de batch-C-tekst zelf** vóór het committen. Bestaan-en-in-bereik is
niet genoeg: alle drie wezen naar bestaande regels.
