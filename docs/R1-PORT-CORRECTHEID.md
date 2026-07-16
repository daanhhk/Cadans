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
