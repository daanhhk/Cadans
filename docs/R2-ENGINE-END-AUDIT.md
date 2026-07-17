# R2 — ENGINE END-AUDIT (findings, GEEN verdicts)

Vervolg op `docs/R1-PORT-CORRECTHEID.md`. **Findings, geen verdicts** — verdicts zijn R4, en het
verdict-criterium is het MODEL (`docs/TRAININGSMODEL.md`), niet GAS. Elke bevinding hieronder is
mechanisch geverifieerd: locatie-ankers met een inhouds-assertie (bestand + regel + verwachte
substring), en waar gedrag geclaimd wordt is de engine GEDRAAID onder `TZ=Europe/Amsterdam` op input
die uit de keten zelf komt.

Batch a1: G1 + V1 + V2 + V3. Batch a2: V4 + V5 + V6 + V7. Batch a3: V8 + V9 + V10 + V11 +
V12 + V13 + de sluiting van R2-a. Batch b: V14 + V15 + V16 + V17 + V18 + V19 + V20 + de sluiting van R2-b.

## Scope R2 — vastgesteld en door Daan geaccordeerd (17-07-2026)

R1's kernles was: *body-gelijkheid is nodig, niet genoeg; geen enkele van de 21 vondsten zat in een
fn-body.* De matrix sorteert exact op body-diff. R2 keert de as om en sorteert op **bereikbaarheid +
invulling**; de matrix levert alleen de inventaris. Drie brokken, in volgorde:

- **a — Wat GAS doet en Cadans niet.** De alleen-in-GAS-bak, gefilterd op web-server-bereik.
- **b — De rest van de leesstapel.** De 14 verschil-fns die R1 liet liggen (matrix-groep 3 + 4),
  inclusief `buildWorkout` — de laatste van de twee "zwaarste onbekenden".
- **c — Wat Cadans zelf verzon.** De 115 alleen-in-Cadans-units, gefilterd op "neemt een beslissing".

Buiten R2, bewust: het MODEL-risico (matrix-gat 1) → R3. De 140 body-gelijke fns integraal → alleen
als a/b hun invulling raakt.

## R2-a — sortering van de alleen-in-GAS-bak

Matrix gereproduceerd (derde onafhankelijke run, eigen kloon, `GAS_SRC` op `3e8090a`): 175 matches ·
64 identiek / 76 equivalent / 35 verschil · 473 alleen-in-GAS · 115 alleen-in-Cadans. Alle cijfers
exact gelijk aan `tools/audit/out/report.txt`.

Filter: `alleen-in-GAS ∩ web-server-bereik ∩ niet in {SelfTest.gs, TelegramBot.gs, Secrets.gs,
Script.html}` = **109 units**. Dat is de klasse "de GAS-web-app roept dit aan en Cadans heeft het
niet". Telegram (fase 6), de Sheets-menu's, de oracle en de client-render vallen er per constructie
buiten. Van die 109:

- **14** worden rechtstreeks door een GEPORTE fn aangeroepen (de gap-regel uit module 2b). Deze zijn
  grotendeels al door R1 geraakt: `intentZonesForDate_` (B3/B5, de dode intent-tak), `getFormScore_`
  + `getTodayCheckin_` (de `getReadinessScore_`-seam), `rpeRecentMismatch_` (B2), `readSettings` +
  `loadSettingValue` (C0, A1), `getDocProp` (A2).
- **95** hebben alléén niet-geporte aanroepers = een hele laag ontbreekt. Deze bak komt de matrix per
  constructie niet tegen — dit is matrix-gat 6, en dit is waar R2-a zijn bestaansrecht heeft.

Verklaard-en-geen-gat binnen die 95: de 16 entrypoints zelf (entrypoint-map dekt ze), de Sheet-IO
(D1 vervangt de tabs), de push-keten (`buildEventPayload`/`pushEvents_`/`buildWorkoutZwo_` — FASE C,
gedocumenteerd), de ride-detail-keten (`rideDetailModel_`/`rideTimeInZone_`/`rideIntervals_` — 2d,
gedocumenteerd).

**Bevestigd patroon:** bijna elke R1-vondst heeft zijn wortel in deze bak. R1 vond het symptoom (een
geporte fn die inert is of op nul draait); de oorzaak is steeds dat de fn die hem zou VOEDEN niet is
meegekomen. `mesoFactor` ×1 (R1-A2) ← `loadCarryFactor_`/`carryFactorForAvg_`. `rpeSignal_` kan
nooit vuren (R1-B2) ← `rpeWeekData_`/`rpeMismatchFlag_`. De intent-tak is dood (R1-B3/B5) ←
`intentZonesForDate_`. Workouts niet event-getailord (debt (n)-1) ← `eventContextFrom_`.

## G1 · Gereedschap — de app-bereik-kolom is asymmetrisch (geen code-bevinding)

`tools/audit/out/matrix.txt` labelt per unit "app-bereik ja/nee" en stelt: *sluitingen
over-approximeren; "buiten bereik" is sterk, "binnen bereik" zwak.* **Aan de Cadans-kant geldt dat
niet.**

- De GAS-kant kreeg een top-level-statement-start (`gasWebClientStart`) zodat `Script.html`'s
  losse statements de graaf voeden.
- De Cadans-kant start uitsluitend bij refs in `main.tsx` / `App.tsx` / `workers/api/src/index.ts`.
  De Hono-routes zijn **top-level statements**, geen unit-declaraties (`workers/api/src/routes/api.ts`
  registreert met `api.get(...)`, en `export const api = new Hono(...)` heeft geen
  arrow/function-expression als initializer → geen unit → geen edge). De hele Worker-route-boom hangt
  daarmee los van de sluiting.

Gevolg: "app-bereik nee" betekent in de praktijk "niet bereikbaar vanaf de web-PWA" en zegt niets
over de server. Van de 46 geporte fns met dat label heeft minstens vijf aantoonbaar wél een
consument: `pcNormalize_` draait server-side op elke power-curve-read
(`workers/api/src/integrations/powercurve.ts:157`).

**Consequentie voor R2/R4:** de kolom is een hint, geen bewijs. R1 gebruikte 'm alleen als label, dus
de R1-leesvolgorde is niet aangetast. Repareren kan (tweede start = top-level statements aan de
Cadans-kant), maar is geen doel op zich.

## V1 · `getVolumeTargets` (Algorithm.gs:31) niet geport — twee zichtbare gevolgen

- **locaties** — GAS `src/Algorithm.gs:31` (tabel `:35`) · Cadans: bestaat niet
- **aanroepers in GAS** — `Doel.gs:331` (`buildPlanModel_`), `WebApp.gs:1302`
  (`getDashboardState`-keten), `Proposal.gs:470`, `TelegramBot.gs:405`
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout. Geen model-vraag.

De tabel geeft een uren-**band** per profiel × macro-fase. Voor `'Gevorderd 7u'` (`Algorithm.gs:35`):
`Base [4,7] · Build [6,9] · Peak [6,9] · Taper [3,5] · Recovery [2,4]`.

### (a) De Volume-stat op de plan-kaart

GAS: `Doel.gs:331` `var band = getVolumeTargets()[cur] || null;` → `Doel.gs:342`
`volume: band ? { label: 'Volume', value: band[0] + '–' + band[1] + ' u' } : null` → gerenderd als
pc-stat op `Script.html:804-805`. De waarde verandert dus mét de fase.

Cadans: `apps/web/src/lib/settings.ts:127` `presetHoursLabel(profielPreset)` leidt een getal af uit
de preset-**naam** ("Gevorderd 7u" → "7u") → `apps/web/src/lib/schema.ts:829` `volumeUren` →
`apps/web/src/components/schema/PeriodTimeline.tsx:173` `<Stat label="Volume" val={volumeUren} />`.
Constant, fase-onafhankelijk.

In Base/Build/Peak valt "7" nog binnen de band; in Taper (`[3,5]`) en Recovery (`[2,4]`) ligt het
er buiten — juist de fasen waarin minder rijden het punt is.

### (b) De beslissing eronder stond op de verkeerde meetlat

Brok 4b §2 motiveerde de single-target met **"GAS bouwt GÉÉN range"** en heeft op grond daarvan de
VORMGEVING-SPEC §2 "gecorrigeerd": het bestaande `Volume 4-7u` is als stale weggestreept ten gunste
van `7u`. `4-7` was exact de Base-band uit `getVolumeTargets`. **De spec had gelijk; de correctie is
de fout.** Dit is precies de meetlat-val die de BRONHIERARCHIE-regel beschrijft: `PROFIEL_PRESET_OPTIONS`
(een presentatie-lijst) is als bron genomen in plaats van de tabel die het doel zet.

### (c) De adherence-regel bestaat in Cadans niet

`WebApp.gs:1302` `var vt = getVolumeTargets();` → per voltooide week sinds `doelStart` een verwacht
TSS uit `WebApp.gs:1316` `var band = vt[wkFase] || vt.Build || [4, 7];` × `tssPerUur` → `:1325`
`voortgangPct` → `Script.html:1177` `'% van plan'` / `:1178` `'blok net gestart'`, direct onder het
W/kg-niveau.

In Cadans komt `voortgangPct` (of enig equivalent) nergens voor. `WeekLoad.tsx:180` toont óók
"% van plan" maar dat is een andere metriek (deze week gepland-vs-gedaan; GAS-tegenhanger is
`w.progressPct`, `Script.html:849`).

## V2 · `getMesoWeek` (Utils.gs:48) niet geport — de meso-ramp draait op een andere teller

- **locaties** — GAS `src/Utils.gs:48` (clamp `:50`), `advanceMeso` `:59-64`, menu `Code.gs:56`,
  `MESO_MOD` `Algorithm.gs:11`, invulling `Algorithm.gs:87` · Cadans `apps/web/src/lib/proposal.ts:233`
- **norm** — invulling = infra (parity), karakter-drift = model (R3). Zie hieronder.
- **R1-overlap** — R1-A2 dekte de TWEEDE factor (`× loadCarry`, verdwenen). De `week`-parameter zelf
  is nooit onderzocht; R1-A2 noteerde letterlijk dat dat R2 was. Deze bevinding is NIEUW.

GAS: `getMesoWeek()` leest DocProp `mesoWeek`, default `'1'`, **clamp 1..4** (`Utils.gs:50`).
`advanceMeso` (`:59-64`) loopt cyclisch 1→2→3→4→1 en hangt **uitsluitend** aan het Sheets-menu-item
`'Volgende mesocyclus-week ▶'` (`Code.gs:56`). Geen trigger, geen automatiek.
`generateProposal` leest 'm op `Algorithm.gs:87` (`var mesoWeek = getMesoWeek();`) en voedt hem aan
`assignWorkouts`/`buildWorkout`.

Cadans: `proposal.ts:233` `const mesoWeek = weekIndexFromStart_(settingsE);` — het aantal weken sinds
`doelStart`, **ongeclampt** (`packages/engine/src/planner.ts:917`). In GAS is diezelfde fn de
VARIANT-ROTATIE-index (`Algorithm.gs:2524`; Cadans `packages/engine/src/planner.ts:1492`) — die rol heeft hij in Cadans
óók nog. **Eén teller, twee banen.**

### Wat het doet (GEDRAAID, `TZ=Europe/Amsterdam`, engine-bundel buiten de repo-tree)

`packages/engine/src/utils.ts:49` `return MESO_MOD[week] || 1.0;` — geen clamp. Per blokweek:

| blokweek | index | factor |
|---|---|---|
| 1 | 0 | 1,00 |
| 2 | 1 | 1,00 |
| 3 | 2 | 1,08 |
| 4 | 3 | 1,15 |
| 5 | 4 | 0,60 |
| 6+ | 5+ | **1,00 permanent** |

Twee afwijkingen tegelijk:

1. **Off-by-one.** `weekIndexFromStart_` is 0-gebaseerd (`packages/engine/src/planner.ts:917`, `return diff < 0 ? 0 :
   diff`); GAS' teller is 1-gebaseerd. De ramp loopt een week achter en de deload valt in blokweek 5
   i.p.v. 4.
2. **Na blokweek 5 is de modulatie voorgoed uit.** `MESO_MOD` kent alleen 1..4; alles daarboven valt
   op de `|| 1.0`-tak. Bij een blok van 12 weken: 7 vlakke weken, geen tweede deload.

**Koppeling.** Omdat dezelfde teller `selectVariant_` stuurt, zijn variant en meso-factor nu
vastgeklonken: variant N komt altijd met factor N. In GAS waren ze onafhankelijk (variant = weken
sinds start; factor = de handmatige teller).

### Karakter-drift (GEËRFD — GAS-identiek, R3-materiaal)

`packages/engine/src/planner.ts:986` `const f = mesoFactor(mesoWeek);` → `:988` `const adj = (p: number): number =>
Math.round(p * f) + off;`. De factor schaalt **vermogens-percentages**, niet duur of TSS. Gedraaid op
een sweet-spot-verzoek van 90 min: bij factor 1,08 wordt het blok `2 min @ 103% / 3 min @ 95% FTP`
(= threshold/VO2, geen sweet spot); bij 0,60 wordt het `57% / 53% FTP` (= Z2) — met de naam
"Sweet Spot over/under" erboven en een **niet meegeschaalde** bpm-range, die elkaar dan tegenspreken.
Duur en TSS blijven identiek. Dit staat 1-op-1 zo in GAS (`renderVariant_`) → geen port-fout, wel een
vraag voor R3 tegen het model.

### Regressie?

Alleen als de gebruiker het menu-item bijhield. Daan bevestigde in de review-chat (17-07-2026) dat
hij het niet bewust bijhield — hij verwarde het met `'📋 Rol Weekplanner +1 naar huidig'`
(`Code.gs:61`), twee items lager in hetzelfde menu. Dan stond de DocProp op default `1` → factor
permanent 1,00 → **de GAS-ramp was in de praktijk óók vlak**, en Cadans' blokweek 3-5 is eerder een
toevoeging dan een verlies. Verdict-richting: geen cutover-blokker; de vraag "wat hóórt de meso-week
te zijn" is R3.

**Migratie:** DocProp `mesoWeek` moet bewust mee of bewust niet. Toevoegen aan de migratie-scope.

## V3 · Het weekplanner-vangnet niet geport — lege week = nul dagen

- **locaties** — GAS `Planner.gs:31-33` (`PLANNER_DEFAULTS`), `materializeWeek_`/`getPattern`/
  `defaultPattern_`, `ensureCurrentWeek` aangeroepen op `Algorithm.gs:79`, menu `Code.gs:60-61` ·
  Cadans `apps/web/src/lib/planner.ts:93` (`buildWeekForm`, `:102`)
- **norm** — front-end/gedrag → GAS is norm → **regressie**. Maar zie het besluit hieronder.

GAS: `generateProposal` roept ALTIJD `ensureCurrentWeek(ss)` (`Algorithm.gs:79`). Staat de tab nog op
een oude week, dan (1) `_pullPlus1IntoCurrent_` — de "+1"-invoer wordt de huidige week — en anders
(2) `materializeWeek_` = vul de week uit `getPattern()`: DocProp `pattern` (gezet via het menu-item
`'Sla huidige week op als standaardpatroon'`, `Code.gs:60`), met fallback `defaultPattern_()` →
`PLANNER_DEFAULTS` (`Planner.gs:31-33`): di 150 min pendel · do 90 min vrij · za 120 min weekend.
**De huidige week kán in GAS niet leeg zijn.**

Cadans: geen pattern, geen defaults, geen materialize. `buildWeekForm` (`apps/web/src/lib/planner.ts:93`) geeft een
ontbrekende dag terug als `train: false` / `minuten: ""` (`:102`). GEDRAAID: `buildWeekProposal` met
`plannerDays: []` levert `days.length === 0` — **niet zeven lege dagen maar nul**. De Schema-tab
rendert dan niets (strip, kaart en weekbalans hangen allemaal op `view.days`).

Het symptoom staat al in `docs/SCHEMA-EMPTY-RECON.md`, maar dat diagnosticeerde het als een
DATA-toestand ("`planner_days` is leeg → vul het in"). De invoer-UI is er inmiddels en werkt. De
oorzaak is een andere: **GAS vult die tabel zelf, elke week, uit het patroon.** In Cadans is "leeg"
een bereikbare, permanente toestand.

De ROL zelf is architecturaal correct vervangen: D1 sleutelt op datum, dus een "+1"-invoer staat er
vanzelf als die week aanbreekt (B1-editor scope-tab "Volgende week" → `PUT /api/planner/:monday`).
Daar is geen gat.

### BESLUIT DAAN (17-07-2026) — bewuste fork, GAS niet herstellen

`PLANNER_DEFAULTS` bestond alleen omdat een Sheet-tab gevuld moest worden — een platform-artefact,
geen trainings-intentie. Gewenst gedrag in Cadans is **carry-forward**: de laatst door Daan
aangepaste week is de basis voor de volgende. Past hij niets aan → die week rolt door. Past hij wel
aan → die wordt de nieuwe basis voor de week erop.

Open voor bouw/R4 (nu niet beslissen):

- Wint een expliciete "volgende week"-invoer van de carry-forward? (GAS-analoog: ja — `_pullPlus1IntoCurrent_`
  ging vóór `materializeWeek_`.)
- Welke velden rollen mee? (GAS: train/minuten/dagtype/toelichting; `voorgesteld` en `gedaan`
  expliciet leeg.)
- Bron = de laatst AANGERAAKTE week of de vorige kalenderweek? (Bij drie weken stilte: rolt week 4
  door vanuit week 1?)
- Leeft de carry-forward bij lezen (afleiden) of bij schrijven (rijen materialiseren)?

Verdict-richting: de regressie staat, maar de fix is de fork, niet de port.

## V4 · `reconcilePlannerWithActivities` (Sync.gs:567) niet geport — de vuller onder `gedaan`

- **locaties** — GAS `src/Sync.gs:567`; aanroepers `src/Sync.gs:31` (`syncAll`) en
  `src/Algorithm.gs:702` (`ensureDataAndReconcile_`, zelf aangeroepen op `src/Algorithm.gs:83`) ·
  Cadans: bestaat niet
- **norm** — infra (afleiding uit sync-data) → parity is norm; de match-regel zelf is beleid → R3/R4
- **R1-overlap** — R1-B0-ii vond het SYMPTOOM (`planner_days.gedaan` hardcoded `0`,
  `workers/api/src/db/repo.ts:367`); B8-(b)/(c)/(d) vonden de gevolgen. Deze bevinding is de WORTEL en
  is nieuw: niet "een veld dat niemand vult", maar **een afleiding die niet meekwam**.

### Wat GAS doet

`reconcilePlannerWithActivities` loopt over de planner-rijen met `train && !gedaan && datum`
(`Sync.gs:582`), zoekt per dag een matchende activity, tikt bij match het Gedaan-vinkje aan
(`Sync.gs:599`) en telt één op. Hij hangt op **twee** plekken:

1. `syncAll` (`Sync.gs:31`) — de 08:00-trigger (`Sync.gs:619`, opt-in via het menu-item op
   `Code.gs:52`) en het menu-item `'Sync nu (intervals.icu)'` (`Code.gs:47`).
2. `ensureDataAndReconcile_` (`Algorithm.gs:691`, aangeroepen op `Algorithm.gs:83`) — bij **elke**
   `generateProposal`. De noot op `Algorithm.gs:82` noemt het "volgorde-onafhankelijke
   gemist-detectie".

Gevolg: op het moment dat de GAS-engine `gedaan` LEEST is het veld per constructie vers. Dat is de
eigenschap die Cadans mist — niet de kolom.

### De match-regel is beleid, geen plumbing

Vier onderdelen (`Sync.gs:582-603`), alle vier afwezig in Cadans:

| # | GAS-regel | anker |
|---|---|---|
| 1 | datum-venster `[middernacht, +24u)` op de activity-datum | `Sync.gs:584-590` |
| 2 | type bevat `'ride'` OF `'run'` (lowercase substring) | `Sync.gs:593` |
| 3 | duur ≥ 50% van de geplande minuten — **alleen als `d.minuten > 0`** | `Sync.gs:596` |
| 4 | **eerste match wint, per ACTIVITEIT — nooit gesommeerd** (`break`) | `Sync.gs:603` |

Cadans heeft geen reconcile én geen handmatig pad: `PUT /api/planner/:monday` weigert het veld
expliciet (`workers/api/src/routes/api.ts:657`). Zijn de-facto regel leeft in de UI:
`apps/web/src/lib/schema.ts:744` `const isDone = doneTss > 0;` — geen type-filter, geen duur-filter,
en de dag wordt **gesommeerd** (`mergeDone`, `apps/web/src/lib/schema.ts:324`).

**Twee gedaan-begrippen, en Cadans heeft alleen het zwakke.** GAS heeft ze ook allebei: `gedaan`
(engine — de split op `Algorithm.gs:96/98/101`) naast `actualsByDate` (dagkaart — `WebApp.gs:1137`
`else if (actuals[dISO])`, gevuld door `dashActivityScan_` op `WebApp.gs:106`, zónder type- of
duurfilter). In GAS voedt het zwakke begrip alléén de kaart. In Cadans is het het enige dat er is,
en de engine krijgt niets.

Regel 4 is de scherpste: hij vergelijkt één activiteit met het DAG-totaal. Een pendeldag van 150
geplande minuten met twee ritten van 40 min wordt in GAS **nooit** auto-aangevinkt (40 < 75, en er
wordt niet gesommeerd). GAS-gedrag om te kennen; geen norm om te kopiëren.

### Scope: `gedaan` is in GAS een WEEK-KLADJE, geen historie

`readPlanner` (`Planner.gs:396`) leest exact zeven rijen (`Planner.gs:399`) = de huidige week. De
rollover wist het veld: `_pullPlus1IntoCurrent_` (`Planner.gs:298`) zet kolom H terug op `false`
(`Planner.gs:319`). `gedaan` bestaat in GAS dus precies één week: afgeleid uit de activiteiten,
gebruikt door het voorstel van die week, daarna weggegooid.

In Cadans is `planner_days` op datum gesleuteld en wordt niets gewist. Een 1-op-1 port zou het veld
stilzwijgend opwaarderen tot een historie die GAS nooit had. Zelfde vorm als V3: de kolom is een
Sheet-artefact, de afleiding is de intentie.

### Wat je ervan merkt (GEDRAAID, `TZ=Europe/Amsterdam`, engine-bundel buiten de repo-tree)

Fixture: woensdag = vandaag, 60 min gepland; 's ochtends 65 min gereden (Ride). GAS' regels 1-4
matchen (65 ≥ 60 × 0,5) → vinkje aan → de dag valt uit `tePlannen` (`Algorithm.gs:100-102`).

- **Cadans as-is** (`gedaan` = 0): woensdag houdt zijn voorstel — Sweet Spot 62 min / 52 TSS —
  bovenop de 65 min die er al op zitten. Weekbelasting 257 min / 189 TSS.
- **Met de tik**: woensdag verdwijnt uit het plan en de kwaliteitssessie verhuist naar donderdag.
  Weekbelasting 210 min / 157 TSS.

Dit is de gedraaide vorm van R1-B8-(d). Nieuw is dat de kwaliteitssessie in GAS **doorschuift** in
plaats van te verdampen. Voor VERSTREKEN dagen verandert de tik niets aan de weekbelasting
(`tePlannen` filtert die al op datum weg) — daar zitten de gevolgen in B8-(b)/(c) en
`plannedForDone`.

### Afbakening

Cadans' `POST /api/sync/activities` (`workers/api/src/routes/api.ts:501`) is de tegenhanger van
`syncActivities`, niet van `syncAll`: er hangt geen reconcile-stap aan. Zie V5 voor de tweede
ontbrekende arm.

## V5 · `syncAthleteZones` (Sync.gs:57) niet geport — één echte gap, vier schijn-gaps

- **locaties** — GAS `src/Sync.gs:57`, aangeroepen op `src/Sync.gs:20` (`syncAll`);
  `resolvePowerZones_` `src/Sync.gs:412` · `resolveHrZones_` `src/Sync.gs:416` · `resolveZones_`
  `src/Sync.gs:420` · `normalizeZones_` `src/Sync.gs:395` · `sweetSpotFromActivity_` `src/Sync.gs:373`
  · Cadans: bestaat niet
- **norm** — infra → parity is norm. Maar zie hieronder: vier van de vijf units landen op een
  display-tab die `REBUILD-SCOPE.md:70` al in de kolom *display (sterft)* zet.

`syncAll` (`Sync.gs:16`) heeft vier armen: `syncAthleteZones` (`:20`), `syncActivities` (`:23`),
`syncWellness` (`:26`), `reconcilePlannerWithActivities` (`:31`). Cadans heeft er twee:
`POST /api/sync/activities` en `POST /api/sync/wellness` (`workers/api/src/routes/api.ts:501` en
`:516`). **De athlete-arm en de reconcile-arm ontbreken allebei.**

### De zone-resolutie is DISPLAY — geen engine-gap

`syncAthleteZones` schrijft `api_power_zones` / `api_hr_zones` (`Sync.gs:71-72`) en
`sweet_spot_min` / `sweet_spot_max` (`Sync.gs:98-99`). De ENIGE lezers in de hele GAS-bron zijn
`buildZones` (`Zones.gs:122-123` en `Zones.gs:167-168`) — de bouwer van de **Zones-tab**, een
referentietabel in de Sheet.

De engine leest de grenzen niet: `actualZoneMinutes_` (`Algorithm.gs:364`) heeft een
`zoneBoundaries`-parameter die in de body nooit wordt aangeraakt, en zijn enige aanroeper geeft
`null` mee (`Algorithm.gs:526`). De port nam dat correct over — daar heet de parameter
`_zoneBoundaries` (`packages/engine/src/zones.ts:16`). De zone-indeling komt per activiteit
kant-en-klaar uit `icu_zone_times`.

⇒ `resolveZones_`, `resolvePowerZones_`, `resolveHrZones_` en `normalizeZones_` zijn **geen
engine-gap**, en `sweetSpotFromActivity_` evenmin. Ze staan op de lijst omdat hun namen infra
suggereren. Dat sluit vijf units uit de 95 af met bewijs in plaats van een vermoeden. (Wat een
Cadans-Zones-scherm zou tonen is een vormgevings-vraag, geen port-vraag; er is er nu geen.)

### De echte gap — FTP/LTHR/HR komen in Cadans nooit uit intervals.icu

Arm (a) van `syncAthleteZones` schrijft `ftp`, `lthr`, `hr_max` en `hr_rest` naar DocProps én naar
de Instellingen-tab (`Sync.gs:62-65` en `:105-108`), **onvoorwaardelijk**, bij elke sync. Dat zijn
directe engine-inputs.

In Cadans komen die vier uitsluitend uit de handmatige `PUT /api/settings`
(`workers/api/src/routes/api.ts:569`). Er is geen athlete-endpoint, geen trigger, geen autocast.

**GAS spreekt zichzelf hier tegen, en dat hoort bij de vraag.** Er zijn twee FTP-schrijvers:
`syncAthleteZones` negeert het auto-update-vinkje (`Sync.gs:62`), terwijl `syncAthleteFromIcu`
(`Sync.gs:658`, menu `Code.gs:54`, eigen trigger) er wél op gate't (`Sync.gs:672`
`if (getFtpAutoUpdate())`). Welke van de twee de bedoeling was, is niet uit de code af te leiden.
Zie V6: de vinkjes-kolommen staan in Cadans al in D1.

## V6 · Acht D1-kolommen die niemand vult — het `vals`-whitelist-patroon

- **locaties** — `workers/api/src/db/schema.ts:50/62/63/64` (settings) en `:221-229` (`sync_state`) ·
  DDL `workers/api/drizzle/0000_redundant_maginty.sql:84-113` · spec `REBUILD-SCOPE.md:74-97`
- **norm** — geen gedrag, dus geen norm-vraag. Inventaris voor R4 + migratie-scope.

Mechanisch vastgesteld (grep over `workers/api/src`, `apps/web/src`, `packages`): deze kolommen
bestaan in prod-D1 (migratie `0000`, dus ze staan er) en worden door **nul** regels code gelezen of
geschreven.

| kolom | GAS-herkomst | anker |
|---|---|---|
| `settings.threshold_pace` | Instellingen rij 7 (`LOOP_PACE`, `Settings.gs:19`) | `workers/api/src/db/schema.ts:50` |
| `settings.ftp_auto_update` | rij 47 → `getFtpAutoUpdate` (`Settings.gs:317`) | `workers/api/src/db/schema.ts:62` |
| `settings.weight_auto_update` | rij 48 (`WEIGHT_AUTO`) | `workers/api/src/db/schema.ts:63` |
| `settings.email_digest` | rij 33 (`EMAIL`) | `workers/api/src/db/schema.ts:64` |
| `sync_state.last_sync` | DocProp `last_sync` (`Sync.gs:38`) | `workers/api/src/db/schema.ts:225` |
| `sync_state.meso_week` | DocProp `mesoWeek` (`Utils.gs:48`) | `workers/api/src/db/schema.ts:226` |
| `sync_state.load_carry` | DocProp `loadCarry` (`Algorithm.gs:89`) | `workers/api/src/db/schema.ts:227` |
| `sync_state.ftp_last_sync` + `weight_last_sync` | rij 49/50 | `workers/api/src/db/schema.ts:228-229` |

De **hele tabel `sync_state`** wordt nergens bevraagd: buiten `workers/api/src/db/schema.ts` komt de identifier
`syncState` in geen enkel bestand voor. (`apps/web/src/lib/syncStatus.ts:10` klinkt als de lezer maar is
een in-memory sessie-variabele.)

Dat sluit twee losse einden:

- **V2's migratie-punt** ("DocProp `mesoWeek` bewust mee of bewust niet") — de kolom staat er al.
  Cadans rekent `mesoWeek` uit `doelStart` (`apps/web/src/lib/proposal.ts:233`) en raakt de kolom niet.
- **R1-A2's verdwenen `× loadCarry`** — idem: `sync_state.load_carry` bestaat, `loadCarryFactor_` niet.

### Het mechanisme — waarom deze kolommen niet per ongeluk tot leven komen

`writeSettings` (`workers/api/src/db/repo.ts:54`) en `writePlannerDays`
(`workers/api/src/db/repo.ts:352`) zijn allebei full-replace-upserts waarin het `vals`-object de
de-facto kolom-whitelist IS: `onConflictDoUpdate({ set: vals })` zet elke kolom búiten `vals` bij
elke schrijf terug op null. `writeSettings`' `vals` noemt de vier settings-kolommen hierboven niet.

Dat is dezelfde vorm als R1-B0-i/ii (`voorgesteldType: null` / `gedaan: 0`, `workers/api/src/db/repo.ts:366-367`) —
daar staan de velden wél in `vals`, met een constante. **Eén patroon, twee uitkomsten: in `vals` met
een constante = actief gewist; buiten `vals` = passief gewist.** Beide vragen een wijziging aan de
schrijver; geen van beide is met een route-wijziging alleen te dichten.

`REBUILD-SCOPE.md:102` specificeerde de `sync_state`-tabel voluit (`last_sync`, `load_carry`,
`avail_dirty`, `meso_week`) én `settings(… sweet_spot_min, sweet_spot_max, power_zones_json,
hr_zones_json)` (`REBUILD-SCOPE.md:95-97`). Het schema volgde de spec deels; de code die de kolommen vult volgde niet
mee. Dit is inventaris, geen verwijt: het zegt dat de intentie gedocumenteerd was, en dat maakt de
R4-vraag "bewust of vergeten" beslisbaar.

## V7 · De snapshot-laag niet geport — GAS' voorstel is een SCHRIJF, Cadans' een LEES

- **locaties** — GAS `writeVoorgesteldType` `Planner.gs:418` (aangeroepen `Algorithm.gs:148`) ·
  `writeDaySessions_` `Algorithm.gs:745` (`:213`) · `setDocProp('weekplan_<maandag>')`
  `Algorithm.gs:257` · `cleanupOldProposals_` `Algorithm.gs:723` (`:76`) · `plannedTypeForDate_`
  `Algorithm.gs:1931` · Cadans `apps/web/src/lib/proposal.ts:171` (`buildWeekProposal`)
- **norm** — architectuur-fork, bewust en gedocumenteerd (HANDOFF: "`proposal_*` wordt NIET
  gepersisteerd"). De vraag is niet of de fork mag, maar wat hij meesleept.
- **R1-overlap** — dit is de gemeenschappelijke wortel onder B0-i/ii/iii, A2, B2 en
  B8-(a)/(b)/(c)/(d). R1 vond die los; R2-a stelt vast dat het één oorzaak is.

### Wat GAS per run wegschrijft

`generateProposal` begint met `cleanupOldProposals_()` (`Algorithm.gs:76`) — die naam liegt: hij
verwijdert **alle** `proposal_*`-keys (`Algorithm.gs:726`), niet alleen oude. Daarna schrijft de run
vier artefacten:

1. `writeVoorgesteldType(ss, days)` (`Algorithm.gs:148`) → Weekplanner kolom G — de dag-mirror.
2. `writeDaySessions_(dISO, sessions)` (`Algorithm.gs:213`) → `proposal_<dISO>[_s<n>]` per sessie.
3. `setDocProp('weekplan_<maandag>', …)` (`Algorithm.gs:257`) → de week-snapshot mét `intent`,
   `tss`, `minuten`, `reden` en `sessies[]`.
4. `renderProposal` → de Voorstel-tab (display).

De levensduur is asymmetrisch. Kolom G en `proposal_*` leven één week (kolom G wordt bovendien door
de rollover gewist, `Planner.gs:319`; `proposal_*` door `cleanupOldProposals_` bij de volgende run).
`weekplan_<maandag>` wordt **nooit** gewist. **Er is dus precies één durabel plan-van-record in GAS,
en dat is de week-snapshot.** Dat is wat `dashWeekplanByDate_` (`WebApp.gs:179`, "Volledige
historie") uitleest — het punt dat R1 al als migratie-scope vlagde.

### Waarom dat vijf R1-vondsten tegelijk verklaart

De engine leest zijn eigen vorige output terug. GAS heeft daar drie ingangen voor, Cadans nul:

| GAS-mirror | leest wie | Cadans-tegenhanger | staat |
|---|---|---|---|
| Weekplanner kolom G | `readPlanner` `Planner.gs:411` → `assignWorkouts` | `planner_days.voorgesteld_type` | altijd null (B0-i) |
| `weekplan_<maandag>` | `plannedTypeForDate_` `Algorithm.gs:1933`, `intentZonesForDate_` | `weekplans.entries_json` | nooit geschreven (B0-iii) |
| `proposal_<dISO>` | `plannedTypeForDate_` `Algorithm.gs:1940` (2e trap) | — | bewust weggelaten |

`plannedTypeForDate_` heeft een **twee-traps-fallback** (week-snapshot → dag-proposal) om het
geplande type te vinden. Cadans' equivalent leest één bron —
`apps/web/src/lib/proposal.ts:314` `if (pd.voorgesteldType) plannedTypeByDate[pd.datum] = …` — en dat
is de derde mirror, die GAS uit de live-berekening vult. Alle drie zijn in Cadans leeg.

Daarmee is de RPE-mismatch-laag geen aparte vondst maar een gevolg. `plannedTypeForDate_` voedt
**twee** ketens:

- `rpeWeekData_` (`Algorithm.gs:1946`, aanroep op `:1955`) → `rpeRecentMismatch_`
  (`Algorithm.gs:1969`) → `rpeSignal_` (`Algorithm.gs:1990`, = **R1-B2**) én `rpeMismatchFlag_`
  (`Algorithm.gs:1978`, display).
- `rpeLastWeekMismatch_` (`Algorithm.gs:2005`, aanroep op `:2015`) → `carryFactorForAvg_`
  (`Algorithm.gs:2029`) → `loadCarryFactor_` (`Algorithm.gs:2038`) → de `loadCarry`-DocProp
  (`Algorithm.gs:89`) → `mesoFactor` (= **R1-A2**).

Zonder plan-van-record is `expected` altijd null, filtert `rpeRecentMismatch_` alles weg en is er
niets om tegen af te zetten. De porten van `rpeSignal_` en `mesoFactor` zijn getrouw; hun bron
ontbreekt — dezelfde bron.

`rpeLastWeekMismatch_` maakt bovendien scherp dat de week-snapshot **dragend** is en niet alleen
historie: hij vraagt het geplande type van VORIGE week op (`plannedTypeForDate_(dISO,
lastMondayISO)`). Kolom G is dan al door de rollover gewist en `proposal_*` door
`cleanupOldProposals_` — `weekplan_<vorige-maandag>` is de enige bron die het nog kan leveren.

### Wat de fork meesleept

`REBUILD-SCOPE.md:98` specificeerde `proposals(id PK, user_id, date, session_idx, workout_json)` als
vervanger van `proposal_<dISO>[_s<n>]`. Die tabel bestaat niet; de `weekplans`-tabel bestaat wél maar
krijgt geen schrijver vanuit de client (B0-iii). De fork "regenereer i.p.v. persisteren" is voor de
DAG-sessies verdedigbaar (Cadans herberekent bij elke render; GAS kon dat niet). Voor het
plan-van-record is hij dat niet automatisch:

- de engine-inputs die een vorige plan-generatie nodig hebben (`doneHard`, de dekking-verrijking,
  `plannedTypeByDate`, `intentByDate`, de archetype-recency, `loadCarry`) hebben geen andere bron;
- de historie die GAS in `weekplan_<maandag>` bewaart groeit niet meer zolang GAS niet draait
  (R1's klok op de migratie-scope);
- de regeneratie is niet reproduceerbaar: `buildWeekProposal` draait op de settings van NU, dus een
  week uit het verleden wordt herbouwd met de FTP van vandaag.

Dat laatste is de scherpste consequentie: een snapshot is niet alleen een cache van iets dat je kunt
herberekenen — hij is het enige wat vastlegt wat de coach TOEN zei.

**Open voor R4/bouw (nu niet beslissen):** waar leeft het plan-van-record — `weekplans` (één rij per
week, GAS-vorm) of `planner_days.voorgesteld_type` (dag-vorm, D1-natuurlijker)? Wie schrijft het, en
op welk moment, nu er geen "Genereer voorstel"-knop meer is? En: is `gedaan` (V4) een afgeleide bij
het lezen of een kolom bij het schrijven — dezelfde vraag als V3's vierde open punt.

## V8 · `eventContextFrom_` (Algorithm.gs:711) niet geport — het event raakt de workout NIET

- **locaties** — GAS `src/Algorithm.gs:711`; aanroepers `src/Algorithm.gs:151` (`generateProposal`) en
  `src/Proposal.gs:331`; consumenten `src/Algorithm.gs:2517` (`tour_taper_z2`) en `src/Algorithm.gs:2520`
  (`long_z2`) · Cadans: bestaat niet; de drie `buildWorkout`-aanroepen geven `undefined`
  (`apps/web/src/lib/proposal.ts:409`, `:433`) plus `buildOverrideWorkout_` (`apps/web/src/lib/proposal.ts:384`)
- **norm** — trainings-laag (welke prikkel krijgt de rijder) → coaching-deugdelijkheid is norm → R3/R4.
  De port-vraag ("is dit bewust?") is wél infra: het staat als bewuste vereenvoudiging gemeld
  (`apps/web/src/lib/proposal.ts:167`), dus dit is een INVULLING van die melding, geen nieuwe ontdekking
  dát hij ontbreekt.
- **HANDOFF-overlap** — debt (n)-1 "workouts niet event-getailord". Die formulering is te zwak; zie
  hieronder.

### De functie is triviaal — de tak eronder niet

`eventContextFrom_` is zes regels: geen `macro.hoofdEvent` → `null`, anders
`{naam, afstandKm, hm, klimType, weken}` (`src/Algorithm.gs:715-720`). Alle vijf velden zijn in Cadans
aanwezig: `eventFase_` levert `hoofdEvent` (`packages/engine/src/phase.ts:170`) en
`apps/web/src/lib/proposal.ts:213` leest er al `klimType` uit. De port is een adapter van zes regels.

Wat hij aanstuurt is groter. `buildWorkout` heeft een tak die het HELE variant-pool overslaat:

    src/Algorithm.gs:2520   if (type === 'long_z2' && eventCtx) return genericLongZ2(mins, settings, mesoWeek, eventCtx);

Zonder `eventCtx` valt `long_z2` door naar `getPool_` → `selectVariant_` → `renderVariant_`. **Met een
hoofd-event gebruikt GAS het long_z2-variant-pool dus NOOIT.** Cadans gebruikt niets anders. De port is
byte-getrouw (`packages/engine/src/planner.ts:1487`, `genericLongZ2` op
`packages/engine/src/planner.ts:1549`) — alleen de arg is `undefined`.

### Wat je ervan merkt (GEDRAAID, `TZ=Europe/Amsterdam`, engine-bundel buiten de repo-tree)

Fixture: A-race over 40 weken, 150 km / 2000 hm; blokweek 2; `long_z2` 150 min.

| | naam | duur | TSS | blokken |
|---|---|---|---|---|
| Cadans (`eventCtx` undefined) | Z2 nuchter (Base) | 150′ | 105 | Warmup/Z2 nuchter/Z2 endurance/Cooldown |
| GAS (`eventCtx` gevuld) | Lange Z2 (162 min) | 162′ | 119 | Warmup/Z2 base/**Klim-sim**/Cooldown |

Het is dus niet "dezelfde workout zonder event-schaling" — het is een **andere workout**. GAS' eindregel
wordt `Bouw richting Amstel Gold Race — 150km/2000hm. Bergachtig profiel → klim-simulatie blokken erin.`;
Cadans' wordt `Ochtend nuchter, strak Z2 — vetverbranding.`

Op weekniveau (zelfde fixture, 5 gevulde dagen): **precies de 2 `long_z2`-dagen wijken af**; sweet_spot
en threshold zijn identiek. Week: Cadans 472′ / 358 TSS · GAS 490′ / 382 TSS. Controle: dezelfde
her-aanroep mét `eventCtx=undefined` reproduceert de Cadans-dagkaart 5/5 exact — het verschil is de arg,
niet de harness.

`tour_taper_z2` (`src/Algorithm.gs:2517`) gebruikt `eventCtx` alleen voor één zin
(`src/Algorithm.gs:2704`); duur/TSS/structuur ongewijzigd. Klein.

### De port heeft een landmijn: `hm` bestaat in Cadans niet

GAS' event-object heet `hm` (`src/Events.gs:189`) en `eventContextFrom_` geeft dat 1-op-1 door
(`src/Algorithm.gs:717`). `genericLongZ2` beslist zijn hele klim-simulatie erop
(`src/Algorithm.gs:2571`; port `packages/engine/src/planner.ts:1567`). In Cadans heet het veld overal
`hoogtemeters` (`packages/shared/src/weekgen.ts:46`, `workers/api/src/db/schema.ts:157`); de identifier
`hm` komt in de hele Cadans-bron alleen voor in `packages/engine/src/planner.ts` — bij de LEZER, nergens
bij een schrijver. GEDRAAID met een adapter die `hoogtemeters` doorgeeft i.p.v. `hm`: "Lange Z2 (162 min)",
162′ / **113** TSS, **geen Klim-sim**, eindregel `Bouw richting Amstel Gold Race — 150km/?hm.` Een
naïeve port werkt dus half en zwijgt daarover. Noteren voor de bouw-chat.

### Nevenvondst (R3, geërfd)

`genericLongZ2` schaalt de DUUR met de meso-factor (`src/Algorithm.gs:2569`, port
`packages/engine/src/planner.ts:1562`): 150 gevraagd × 1,08 → 162 geleverd. Dat is een ANDERE
meso-consument dan V2's `renderVariant_` (die vermogens-PERCENTAGES schaalt) — geen tegenspraak met V2,
een tweede baan. De GAS-comment erboven zegt expliciet dat de meso-factor alleen mag KRIMPEN
("EventCtx geeft alleen het hilly-profiel, NIET een duur-override (eerder werd 120 → 163 gepusht, fout)")
terwijl `MESO_MOD[2] = 1,08` hem laat GROEIEN — de beschikbaarheid wordt met 12 min overschreden. GAS-identiek.

## V9 · De coach-ctx is in Cadans teruggebracht tot één veld

- **locaties** — GAS `coachEventFromMacro_` `src/WebApp.gs:700` · `coachPatternCount_` `src/WebApp.gs:708`
  · de ctx-assemblage `src/WebApp.gs:1114` en `src/WebApp.gs:762` · de aanroepen
  `src/WebApp.gs:1152-1153` · Cadans `apps/web/src/lib/schema.ts:549` (done) en
  `apps/web/src/lib/schema.ts:621` (gemist), beide `{ fase: macroFase }`
- **norm** — trainings-laag (coach-duiding) → coaching-deugdelijkheid is norm → R3/R4
- **R1-overlap** — geen. R1 raakt `coachFeedback_` nergens; de HANDOFF noemt de done-narrative "de rijkste
  coaching-output van de app" (§Geparkeerde debts, "Warme persona op done") — dat is precies de fn waarvan
  hier twee van de drie ctx-velden leeg blijken.

### Wat GAS meegeeft en Cadans niet

GAS bouwt per render `coachCtx = { fase: macro.macroFase, event: coachEventFromMacro_(macro),
patternCount: coachPatternCount_(actuals, wpByDate, today) }` (`src/WebApp.gs:1114`) en geeft dat aan ELKE
`coachFeedback_`-aanroep, zowel voltooid als gemist (`src/WebApp.gs:1152-1153`).

- `coachEventFromMacro_` → `{ naam, type, isEndurance: (type === 'trip') }`.
- `coachPatternCount_` telt over 14 dagen hoe vaak een geplande duur/herstel-dag intensiever werd gereden
  (`src/WebApp.gs:714-724`) — de patroon-teller.

De engine leest ze allebei: `packages/engine/src/coach.ts:452` (`patternCount: ctx.patternCount || 0`) en
`packages/engine/src/coach.ts:263` (`const endur = !!(ev && ev.isEndurance)`); ontbreekt het event, dan
wordt de naam letterlijk `"je doel"` (`packages/engine/src/coach.ts:262`).

### Wat het kost (GEDRAAID — 24 combinaties: 4 plan-types × 6 uitkomsten incl. gemist)

Diff van de volledige coach-output (state + narrative + adapt) tegen de Cadans-ctx `{fase}`:

| ctx | wijkt af van Cadans |
|---|---|
| event = A-RACE, patternCount 0 | **6 / 24** |
| event = A-RACE, patternCount 3 | 6 / 24 |
| event = TRIP, patternCount 0 | **15 / 24** |
| event = TRIP, patternCount 3 | 15 / 24 |

Tweede as, `patternCount` 0 → 3 mét event: **race 0/24 · trip 4/24**. `coachPatternCount_` wordt dus
UITSLUITEND gelezen achter `isEndurance` — bij een race doet hij niets, ook niet als je hem port.

**Dat is de belangrijkste nuance en hij de-escaleert.** Daans echte A-event (Amstel Gold Race) is
`type: 'race'` → `isEndurance` false. Voor hém kost de hele ontbrekende ctx exact één ding: de naam. Zes van
de 24 teksten zeggen `richting je doel` waar GAS `richting Amstel Gold Race` zegt. Voorbeeld (gemist, geen
sleutelprikkel): *"Geen punt — een aanvullende sessie gemist; je week ligt ruim op koers richting je doel."*
tegenover *"…richting Amstel Gold Race."*

Bij een TRIP-event verdwijnt een hele coachingslaag. Gedraaid, plan `long_z2` 150′, gereden drempel 75′:

- Cadans: *"Je trainde Drempel i.p.v. de geplande Duur — intensiever dan bedoeld. Geen sleutelprikkel, dus
  kleine impact."* · adapt: geen
- GAS met trip + patternCount 3: *"Je koos nu 3× intensiteit (Drempel) i.p.v. de geplande duur. Voor
  Girona-trip — lange dagen — is juist de duur/drempel-basis bepalend; herhaalde losse intensiteit ondermijnt
  die opbouw."* · adapt: *"Voorstel: houd de komende ritten bewust Z2/drempel en parkeer de losse intensiteit
  tot na Girona-trip."*

### Bereikbaarheid — waar dit überhaupt zichtbaar is

Alleen op een dag die VANDAAG of later is. Een verstreken dag heeft geen `voorgesteldType` en geen sessies
(V7/B0), dus `plannedForCompare` is null en `coachFeedback_` keert direct terug op `if (!planned) return null`
(`packages/engine/src/coach.ts:446`). GEDRAAID en bevestigd. De ctx-armoede is daarmee een probleem van de
done-VANDAAG-kaart en de gemist-kaart, niet van de historie — die is er niet.

## V10 · `getWeekLoad_` (WebApp.gs:994) niet geport — de noemer krimpt door de week heen

- **locaties** — GAS `src/WebApp.gs:994`, aangeroepen `src/WebApp.gs:1401`; noemer via
  `weekPlanSummary_` `src/WebApp.gs:973` over de `weekplan_<maandag>`-snapshot (`src/WebApp.gs:1012`);
  clamp `src/WebApp.gs:1024` · Cadans `apps/web/src/lib/schema.ts:733` (aggregatie), `:762`
  (`tss.gepland += s.tss`), `apps/web/src/components/schema/WeekLoad.tsx:71-72` (`pct`)
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout
- **R2-overlap** — dit is V7 (geen plan-van-record) met een meetbaar, dagelijks zichtbaar gevolg. NIET
  hetzelfde punt: V7 gaat over wat de ENGINE terugleest, dit over wat de KAART toont.

GAS' `geplandTss` is de som over de BEVROREN week-snapshot; `progressPct = gedaan / geplandTss`, geklemd op
0..100 (`src/WebApp.gs:1024`). Cadans telt `tss.gepland` op uit `d.sessions` — en sessies bestaan alleen voor
dagen ≥ vandaag (`apps/web/src/lib/proposal.ts:342`, `tePlannen`). Verstreken dagen leveren een lege
`sessions`-array, dus ze verdwijnen uit de noemer. `apps/web/src/components/schema/WeekLoad.tsx:72` klemt niet.

### GEDRAAID (`TZ=Europe/Amsterdam`) — één week, oplopende "vandaag"

Fixture: 5 trainingsdagen (di 80′ · wo 75′ · do 75′ · za 150′ · zo 75′), ritten gaandeweg toegevoegd.

| vandaag | gepland TSS | gedaan TSS | dagen gepland | de kaart toont |
|---|---|---|---|---|
| ma 13-07 | 358 | 0 | 5 | 0% van plan |
| wo 15-07 | 275 | 62 | 4 | 23% van plan |
| vr 17-07 | 164 | 204 | 2 | **124% van plan** |
| zo 19-07 | 53 | 319 | 1 | **602% van plan** |

De kop van de kaart is "Deze week · gepland vs gedaan"
(`apps/web/src/components/schema/WeekLoad.tsx:85`). Op vrijdag zegt hij dus letterlijk: 204 TSS gedaan van
164 gepland. GAS zou 319 / 358 = 89% tonen op zondag. Álle drie de stats driften (TSS, uren, dagen); de
voortgangsbalk zelf wordt door `overflow: hidden` (`apps/web/src/components/schema/WeekLoad.tsx:188`)
geklemd, het PERCENTAGE-label niet.

### `snapshotDayAction_` — geport, getest, en nooit aangeroepen

GAS heeft dit probleem gehad en expliciet gerepareerd. `src/Algorithm.gs:158` noemt het "Knip-fix (a):
bevries VOORBIJE dagen (date-compare, niet tePlannenSet) — behoud hun vorige weekplan-entry i.p.v.
retroactief herbouwen/verdwijnen." De beslissing is een pure fn: `snapshotDayAction_`
(`src/Algorithm.gs:57`, aangeroepen `src/Algorithm.gs:185`) → `freeze` / `rebuild` / `skip`.

Die fn IS geport (`packages/engine/src/planner.ts:67`) en IS getest
(`packages/engine/src/selftest.test.ts:1441` e.v., telt mee in de 957-vloer). Buiten de zelftest heeft hij in
de hele Cadans-bron **nul aanroepers** — mechanisch vastgesteld. Hij is via de barrel geëxporteerd
(`packages/engine/src/index.ts:10` `export * from "./planner"`), dus "niet bereikbaar" is de verkeerde
diagnose: hij is bereikbaar en wordt niet gebruikt, omdat de laag waar hij in hoort (de snapshot, V7) niet is
meegekomen.

**Nieuwe klasse t.o.v. R1.** R1's patroon was: geporte fn, inert omdat zijn INPUT nul is. Dit is: geporte fn,
nul call-sites — en zijn functie is exact het gedrag dat we hierboven hebben gemeten. Voor G1 is dit de
tegenhanger die de kolom nodig heeft: hier zou "app-bereik nee" toevallig kloppen, maar om de verkeerde reden.

### Nevenvondst — het `dagen`-begrip verschilt ook los van de drift

GAS telt de GEDANE dagen alleen voor fiets-activiteiten (`src/WebApp.gs:1003`, `CYCLING_TYPES`) en de
GEPLANDE dagen als "entry met minuten > 0" (`src/WebApp.gs:980`). Cadans telt een dag als gedaan zodra
`doneTss > 0` (`apps/web/src/lib/schema.ts:744`) — zonder type-filter, en het dag-totaal is gesommeerd
(`apps/web/src/lib/schema.ts:324`, `mergeDone`). Dat is exact de de-facto regel die V4 al vaststelde; hier
raakt hij een tweede consument. Geen aparte vondst — wel de bevestiging dat V4's regel breder doorwerkt dan
alleen `gedaan`.

## V11 · `dashDayCard_` (WebApp.gs:655) — GAS zwijgt over het plan zodra je gereden hebt

- **locaties** — GAS `src/WebApp.gs:655`, de onderdrukking `src/WebApp.gs:669`
  (`reden: actual ? '' : (wpEntry.reden || '')`); de status-dispatch `src/WebApp.gs:1136-1143` ·
  Cadans `apps/web/src/components/schema/SchemaView.tsx:105-106` (de gate), de dag-state
  `apps/web/src/lib/schema.ts:751-759`
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout
- **R1-overlap** — erft B0-ii (`planner_days.gedaan` hardcoded `0`,
  `workers/api/src/db/repo.ts:367`). B0-ii vond het veld; dit is een gevolg dat R1 niet noemt.

GAS bouwt elke dagkaart via `dashDayCard_` en blankt daar de plan-rationale zodra er een activiteit is
(`src/WebApp.gs:669`). Rationale = vooruitkijkend ("hier plan ik X want…"); zodra je gereden hebt neemt de
coach-feedback het over. Eén coach-stem per kaart.

Cadans' gate is `day?.reden && !day.override` (`apps/web/src/components/schema/SchemaView.tsx:106`), met de
comment ernaast: *"done/gemist-dagen hebben geen redenCode → geen dubbel coach-blok"*
(`apps/web/src/components/schema/SchemaView.tsx:101`). Die aanname is onwaar. Omdat `planner_days.gedaan`
altijd `0` is (B0-ii) blijft VANDAAG in `tePlannen`, dus `assignWorkouts` zet er wél een `reden` op — terwijl
`state` op `done` staat, want dat leest de activity (`apps/web/src/lib/schema.ts:744`).

### GEDRAAID — done-VANDAAG-kaart, `TZ=Europe/Amsterdam`

Woensdag = vandaag, sweet-spot gepland, 's ochtends 70′ drempel gereden:

    state           : done
    day.reden       : "Sleutelsessie · FTP — fase Base"
    day.redenCode   : "key_session"
    coach.narrative : "Je trainde Drempel i.p.v. de geplande Sweet Spot — intensiever dan bedoeld. …"
    gate (day.reden && !day.override) = true  →  CoachCallout rendert BOVEN de DoneCompareCard

De kaart draagt dus **twee coach-blokken met dezelfde coachnaam**: bovenaan de warme plan-rationale ("ik plan
hier een sleutelsessie"), daaronder de done-box die zegt dat je iets anders reed. GAS toont er één.

Dit is de kaart die de HANDOFF markeert als "STATUS done-vandaag-kaart: nog NIET visueel geverifieerd" — er
was tijdens de bouw geen voltooide dag-van-vandaag. De verificatie kan nu gericht: kijk of er twee coach-boxen
staan.

### Nevenvondst — een verstreken gemiste dag heet in Cadans "Rustdag"

Zelfde run: dinsdag stond op train, 80 min, geen rit. Cadans → `state: "rest"` → "Rustdag · Geen training
gepland vandaag. Herstel is training." GAS: `else if (card.voorstel) { status = 'gepland'; }`
(`src/WebApp.gs:1138`) — de bevroren snapshot-entry maakt de dag 'gepland', en pas een expliciete dispositie
maakt hem 'gemist' (`src/WebApp.gs:1143`). Cadans beweert met terugwerkende kracht dat er niets gepland stond.
Dit is dezelfde wortel als V10 (geen plan-van-record) en de scherpste gebruikers-vorm ervan; de A2/A4-noot in
de HANDOFF ("'Niet gedaan?' toont ALLEEN op vandaag/toekomst") beschrijft het symptoom als een
architectuurkeuze, niet als een claim die de app doet.

## V12 · De "Waarom deze training?"-onthulling ontbreekt — `garminHeuristic` is er één regel van

- **locaties** — GAS `garminHeuristic` `src/Proposal.gs:541`, aangeroepen `src/WebApp.gs:1046`; de
  waarom-lijst `src/WebApp.gs:1072-1086`; de render `src/Script.html:257` (`wkWhy_`), aangeroepen
  `src/Script.html:410` en `src/Script.html:415` · Cadans: bestaat niet
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout

GAS' plan-kaart heeft onder de workout een inklapbare `<details>` met de kop "Waarom deze training?"
(`src/Script.html:260`). De inhoud is een lijst van maximaal zes regels (`src/WebApp.gs:1072-1086`):

1. `Macro-fase: <fase> (<N> wk tot event)`
2. `Taper — fris worden voor het event.` (alleen bij taper)
3. `Bijsturing: <reason>` (alleen als het wellness/RPE-signaal niet 'normal' is)
4. `Garmin-verwachting: <verdict>` — de uitkomst van `garminHeuristic(weekTss, mesoWeek, macro.fase, fs)`
5. `Zone-debt <bucket>: +<N> min tekort.` per bucket ≥ 5 min
6. `Mesocyclus week <N>/4 · load <factor>×`

In Cadans komt geen van deze zes voor. Grep over `apps/web/src` op `waarom` / `garmin` / `Garmin-verwachting`
levert nul treffers; de enige "Waarom…"-affordance is `Waarom dit cijfer?` op de ReadinessCard
(`apps/web/src/components/vorm/ReadinessCard.tsx:213`, de port van GAS' `rc-why`,
`src/Script.html:1251`). Het patroon is dus geport voor readiness en niet voor het plan.

### Waarom dit meer is dan een ontbrekend kaartje

Regel 5 en 6 zijn de ENIGE plek in de hele GAS-UI waar de zone-debt en de meso-ramp aan de gebruiker worden
getoond. Daarmee sluit dit twee eerdere vondsten:

- **R1-B4** (`zoneDebt_` geeft altijd nul): in Cadans zou zelfs een gevulde debt onzichtbaar blijven — er is
  geen oppervlak dat hem toont.
- **V2** (de meso-ramp draait op een andere teller, na blokweek 5 permanent vlak): in GAS staat de factor
  letterlijk op het scherm, in Cadans nergens. Een gebruiker kan het verschil niet zien, en dat is precies
  waarom V2's regressie-vraag ("hield Daan het menu-item bij?") in Cadans niet eens gesteld kan worden.

`garminHeuristic` zelf is een drempel-tabel op week-TSS × mesoWeek × macroFase met een ramp-gate
(`src/Proposal.gs:541-564`). Het is een SCHATTING van wat een extern apparaat zou zeggen, geen coaching-regel.
Hij landt ook in de payload als `vandaag.garminStatus` (`src/WebApp.gs:1091`) — die tak is in `Script.html`
nergens gerenderd. Voor R4 zijn dat twee losse vragen: (a) willen we de waarom-lijst terug, en (b) willen we
de Garmin-schatting daarin — want dat is de enige regel van de zes die niet over Cadans' eigen model gaat.

## V13 · `buildGoalProfile_` (WebApp.gs:643) — de assembler is nagebouwd, de CTL-input niet

- **locaties** — GAS `src/WebApp.gs:643`, aangeroepen `src/WebApp.gs:1263`; de CTL-bron
  `src/WebApp.gs:1253` (`ctlNow = vorm.huidig.ctl`) uit `getFormScore_` (`src/Algorithm.gs:1337`); de
  afronding `src/WebApp.gs:1266` · Cadans `apps/web/src/pages/Niveau.tsx:118` (de assembler),
  `apps/web/src/pages/Niveau.tsx:117` (`currentCtl`)
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout
- **HANDOFF-overlap** — §Geparkeerde debts noemt dit twee keer: "Client-side goal-assembler … Eind-audit:
  1-op-1 mirror van de GAS-assembler verifiëren" en "DoelProjectie start-CTL op maand-granulariteit …
  eind-audit". Dít is die audit.

**De assembler zelf is een getrouwe mirror.** GAS mapt `prof.dims` naar
`{key,label,metric,unit,dir,target,current,gap,onTrack,pct}` via `goalGap_`; `apps/web/src/pages/Niveau.tsx:129-138`
doet hetzelfde met dezelfde engine-primitieven. Enige structuurverschil: GAS geeft ook `key: prof.key` terug
(`src/WebApp.gs:651`), Cadans niet — geen consument, geen gevolg. Deze debt kan dicht.

**De INPUT is een andere.** GAS voedt de assembler met `ctl: ctlNow`, en `ctlNow` is de meest recente
WELLNESS-rij (`src/Algorithm.gs:1339-1354`: idx0 datum / idx8 CTL / idx9 ATL), afgerond op een heel getal
(`src/WebApp.gs:1241`). Cadans voedt hem met `currentCtl = ctlMap[lastMonth]` — de laatste MAANDBUCKET uit
`ctlReeksMaandelijks_`, en die rekent CTL uit de ACTIVITEITEN-TSS (`packages/engine/src/niveau.ts:363-375`,
idx8 = TSS), ongerond.

Dat zijn drie verschillen tegelijk, niet één: **andere bron** (wellness-CTL uit intervals.icu tegenover een
eigen EWMA over rit-TSS), **andere korrel** (dag tegenover maand) en **andere afronding**. De HANDOFF-debt
noemt alleen de korrel.

De wellness-CTL is in Cadans wél beschikbaar — `formStateFromWellness_`
(`packages/engine/src/readiness.ts:376`) is de port van `getFormScore_` en levert exact `{form, ctl, atl,
ramp}`. Hij is op deze pagina alleen niet in bereik: `Niveau.tsx` haalt settings, activities en power-curve
(`apps/web/src/pages/Niveau.tsx:33`) en geen wellness. Dit is dus een architectuur-gevolg, geen vergissing —
en dat maakt de R4-vraag scherp: is de goal-gap een wellness- of een activiteiten-metriek?

**Blast-radius.** `currentCtl` voedt niet alleen de CTL-gap-rij maar ook `projectie.currentCtl` → de
CTL-ramp → de FTP-band. Het is dezelfde `Niveau 49 vs Vorm 50`-afwijking die debt (l) tak (1) heeft
AFGEVINKT als "granulariteits-artefact, GEEN engine-unificatie nodig". Die conclusie was op de VISUELE
vraag correct (twee getallen op twee tabs) maar dekt de invulling niet: hetzelfde getal is hier een
engine-INPUT. Zelfde vorm als V1-(b) — een claim afgesloten tegen de verkeerde meetlat.

## Afgesloten in a3, met bewijs — geen gat

- **`bepaalFaseVoorDatum_` (`src/Doel.gs:346`)** — de wrapper om `eventFase_` is niet geport; Cadans bouwt
  de velden inline in `apps/web/src/lib/proposal.ts:206-229`. Nagelopen, veld voor veld: `macroFase`/`fase`
  identiek (`eventFase_` is 1-op-1, `packages/engine/src/phase.ts:96`); `wekenTotEvent` ← `macro.wekenTot`
  (`apps/web/src/lib/proposal.ts:229`, zelfde mapping als `src/Doel.gs:354`); `eventName` ←
  `macro.hoofdEvent.naam` (`apps/web/src/lib/proposal.ts:227`, zelfde hoist als `src/Doel.gs:400`); de
  `vasteMeso`-fallback ← `computeMacroPhase` (`apps/web/src/lib/proposal.ts:211`), en die fn is 1-op-1
  (`src/Settings.gs:295` ↔ `packages/engine/src/phase.ts:31`). De ref-keuze
  (`src/Doel.gs:371`: vandaag als de te plannen week de huidige is, anders de maandag) is voor Cadans
  irrelevant: `buildWeekProposal` bouwt uitsluitend de week rond `todayISO`
  (`apps/web/src/lib/proposal.ts:192`), dus de tak is altijd "vandaag". De HANDOFF-debt "eventDriven-synthese-naad"
  (`eventDriven = (macro != null)`) is EQUIVALENT en kan dicht: `eventFase_` geeft null precies dan als GAS
  `eventDriven: false` zet, en `planModusLabel` (`apps/web/src/lib/proposal.ts:158`) voedt de geporte
  `planModeLabel_` met exact dat. De gedropte velden (`week`, `isTestWeek`, `dagenTotEvent`, `taperIsTrip`
  los) hebben in GAS alleen Sheet-tab-lezers (`src/Doel.gs:94`, `src/Proposal.gs:19`, `src/Settings.gs:215`,
  `src/Proposal.gs:124`) — de kolom "display (sterft)".
- **`dashWeekplanByDate_` (`src/WebApp.gs:179`)** — de lezer van het durabele plan-van-record. Volledig
  gedekt door V7; de migratie-scope-klok staat er al. Niet gedupliceerd. Eén toevoeging: hij leest ALLE
  `weekplan_*`-keys ineens (`src/WebApp.gs:181-192`), dus de migratie-export is één DocProps-dump — geen
  per-week-loop. Relevant zodra de migratie-chat begint.
- **`sumTssVanafDatum_` (`src/WebApp.gs:280`)** — een som over Activiteiten-kolom I vanaf een datum. Enige
  aanroeper is `src/WebApp.gs:1324`, binnen het `voortgangPct`-blok. Dat blok is V1-(c) en bestaat in Cadans
  niet; de helper is een implementatie-detail daarvan, geen eigen gat.
- **`syncActivitiesIncremental_` (`src/Sync.gs:263`)** — dít is juist de arm die Cadans WÉL heeft
  (`refreshActivities` → `src/WebApp.gs:1598` ↔ `POST /api/sync/activities`,
  `workers/api/src/routes/api.ts:501`). Het ontbrekende pad is `syncAll`, en dat is drie dingen die alle drie
  al vastliggen: de reconcile-arm (V4), de athlete-arm (V5) en het volledige-sync-venster + `last_sync`-stempel
  (HANDOFF §Geparkeerde debts, "VOLLEDIG-SYNC-PAD ONTBREEKT"). Eén noot erbij, klein: GAS stempelt `last_sync`
  BEWUST niet bij de top-up (`src/WebApp.gs:1595-1596`) zodat "Laatst gesynct" de laatste VOLLEDIGE sync
  betekent. Cadans' "Laatst gesynct" leest een in-memory sessie-variabele
  (`apps/web/src/lib/syncStatus.ts:13`) die na een page-reload leeg is. Zelfde label, ander begrip; de
  D1-kolom die het echte begrip zou dragen is de dode `sync_state.last_sync` uit V6.

## R2-a — samenvatting (a1 + a2 + a3)

**De 109 zijn verklaard.** De 14 met een geporte aanroeper waren grotendeels R1-werk. Van de 95 zonder
geporte aanroeper is nu elke laag geraakt: de fase/volume-inputs (V1, V2), het planner-vangnet (V3), de
sync-armen (V4, V5), de dode D1-kolommen (V6), de snapshot-laag (V7), de event-tailoring (V8), de coach-ctx
(V9), de week-load (V10), de dagkaart-bouwer (V11), de waarom-onthulling (V12) en het doel-profiel (V13).
Verklaard-en-geen-gat blijven: de 16 entrypoints, de Sheet-IO, de push-keten (FASE C), de ride-detail-keten
(2d), de vier zone-resolutie-units uit V5 en de vier hierboven.

**Eén wortel draagt zes vondsten.** V7's ontbrekende plan-van-record verklaart R1-B0-i/ii/iii, R1-A2, R1-B2,
R1-B8, plus — nieuw in a3 — V10 (de krimpende noemer), V11 (de dubbele coach-stem én de "Rustdag" op een
gemiste dag) en de onbereikbaarheid van V9's coach-ctx op verstreken dagen. Wie die laag bouwt, dicht ze
allemaal tegelijk; wie hem niet bouwt, dicht er geen.

**Het patroon uit R1 houdt, met één uitbreiding.** R1: geporte fn, inert omdat zijn voedende fn niet meekwam.
a3 voegt de scherpere variant toe (V10): geporte fn, GETEST, en met nul aanroepers — `snapshotDayAction_` is
de reparatie die GAS voor exact dit probleem bouwde, en hij ligt ongebruikt in de engine. De matrix ziet hem
als naam-match in de rustigste cel.

**Wat vraagt welk R4-verdict** (richting, geen verdict):

| bevinding | vraag voor R4 | toets aan |
|---|---|---|
| V8 event-tailoring | krijgt de rijder de doel-specifieke prikkel? | MODEL |
| V9 coach-ctx | mag de coach het doel bij naam noemen; is de patroon-waarschuwing gewenst? | MODEL |
| V10 week-load | de kaart liegt over de noemer — vormgeving-drift | GAS is norm |
| V11 dubbele coach-stem + "Rustdag" | idem — de kaart claimt iets onwaars | GAS is norm |
| V12 waarom-onthulling | terug ja/nee; en of de Garmin-schatting daarin hoort | GAS is norm, m.u.v. Garmin |
| V13 goal-CTL | is de goal-gap een wellness- of activiteiten-metriek? | MODEL |

V10 en V11 zijn de enige twee uit a3 die zonder de snapshot-laag te bouwen zijn NIET te dichten — ze zijn
gevolg, geen keuze. V12 is een losse UI-klus. V8, V9 en V13 zijn elk een adapter van minder dan tien regels,
mits R4 ze wil.

**Vijf open bouw-vragen staan nu naast elkaar** (niet beslissen in R2): V3's vier carry-forward-vragen, V7's
plaats-en-schrijver van het plan-van-record, plus a3 legt er geen nieuwe naast — V10/V11 hangen aan V7's
vraag, V8/V9/V13 zijn adapters zonder architectuurkeuze.

## V14 · `buildWorkout` (Algorithm.gs:2499) — de body is niets; `slot` is het risico

- **locaties** — GAS `src/Algorithm.gs:2499`, dode vars `src/Algorithm.gs:2512`, `selectVariant_`-aanroep
  `src/Algorithm.gs:2524`, `selectVariant_` zelf `src/Algorithm.gs:2108` · Cadans
  `packages/engine/src/planner.ts:1444`, `selectVariant_`-aanroep `packages/engine/src/planner.ts:1492`,
  `selectVariant_` zelf `packages/engine/src/planner.ts:958`
- **norm** — infra (de dispatch is mechaniek) → parity is norm; wat de variant-keuze *hoort* te zijn is R3
- **matrix** — groep 3; R0 noemde `buildWorkout` één van de twee "zwaarste onbekenden"

### De body-diff is exact twee dode var-declaraties

GAS `src/Algorithm.gs:2512` `var ftp = settings.ftp, lthr = settings.lthr;` — beide worden in de rest van de
body **nergens** gelezen (mechanisch gecontroleerd: geen kale `ftp`/`lthr` na de declaratie; alle sub-calls
krijgen `settings` zelf). De port liet ze weg. Schrap je die ene regel uit de GAS-bron, dan is de canonieke
vorm van beide bodies **identiek** — geen regel nodig, geen rename. Mechanisch bewezen met de R0-machinerie
(`tools/audit/run.mjs`' `canonOf`, alle zes regels aan).

**Daarmee is R0's tweede "zwaarste onbekende" leeg.** De acht parameters zijn waar het zit — en zes van de
acht zijn in Cadans identiek gevuld (`sessieType`, `sessieMin`, `settings`, `macroFase`, `slot`,
`archetypeId`, vergelijk GAS `src/Algorithm.gs:202` met `apps/web/src/lib/proposal.ts:403`). De twee die
afwijken zijn al gedekt: `eventCtx` = V8, `mesoWeek` = V2.

### De ongelezen achtste: `slot`

`selectVariant_(type, weekIndex, slot)` (`src/Algorithm.gs:2108`) kiest
`idx = (weekIndex + (slot||0)) % pool.length`. `slot` is aan beide kanten `d.dagIdx`. Maar `dagIdx` betekent
niet hetzelfde:

| | herkomst | wat het IS |
|---|---|---|
| GAS | `src/Planner.gs:404` `dagIdx: i`, binnen `for (var i = 0; i < 7; i++)` (`src/Planner.gs:401`) in `readPlanner` (`src/Planner.gs:396`) | de **weekdag** — de Sheet-rij ís ma..zo, per constructie |
| Cadans | `apps/web/src/lib/proposal.ts:240` `dagIdx: i`, binnen `(plannerDays \|\| []).map((pd, i) => …)` (`apps/web/src/lib/proposal.ts:239`) | de **array-positie** van wat D1 teruggeeft |

`readPlannerDays` (`workers/api/src/db/repo.ts:313`) geeft terug wat er staat — geen 7-rijen-garantie — en
`PUT /api/planner/:monday` (`workers/api/src/routes/api.ts:658`) accepteert elke array-lengte: de enige
vorm-check is `Array.isArray(rawDays)`. De comment erboven zegt "de 7 dagen (ma-zo)"; de code dwingt niets af.

### Wat het kost (GEDRAAID, `TZ=Europe/Amsterdam`, engine-bundel buiten de repo-tree)

Fixture: één week, 5 trainingsdagen (di 80′ · wo 75′ · do 75′ · za 150′ · zo 75′), blokweek 2, Base.

| datum | 7 rijen (idx / workout) | alleen de 5 train-rijen (idx / workout) |
|---|---|---|
| di 14-07 | 1 · Sweet Spot pyramide 10-15-20-15-10 | 0 · **Sweet Spot 2×30** |
| wo 15-07 | 2 · Lange Z2 steady | 1 · **Z2 nuchter** |
| do 16-07 | 3 · Sweet Spot 2×20 | 2 · **Sweet Spot over/under 4×(2-3)** |
| za 18-07 | 5 · Z2 nuchter | 3 · **Z2 + hoge cadans** |
| zo 19-07 | 6 · Drempel over-under 3 sets | 4 · Drempel over-under 3 sets |

**4 van de 5 dagen wijken af.** Week: 472′ / 358 TSS tegenover 456′ / 343 TSS. De *types* blijven gelijk (de
allocator rekent gaps op `datum`, niet op `dagIdx`) — alleen de VARIANT verschuift. Zelf-controle: dezelfde
vijf rijen **aangevuld tot zeven** met `train:false`-dagen reproduceert de 7-rijen-uitkomst exact → het aantal
rijen is de enige oorzaak. Geïsoleerd op `buildWorkout('sweet_spot', 80, …, slot)`: slot 0 → 81′/68 TSS ·
slot 1 → 97′/78 · slot 2 → 80′/61 · slot 3 → 80′/66 · slot 4 → 80′/64 (pool van 5, daarna cyclisch).

### Bereikbaarheid — vandaag nee, straks precies bij V3

De B1-editor stuurt altijd zeven: `buildWeekForm` (`apps/web/src/lib/planner.ts:93`) bouwt uit
`weekDatesFromMonday` en `formToInputs` mapt alle zeven. Een week met 1..6 rijen is dus alleen bereikbaar via
een niet-editor-schrijver (seed/console) — óf via **V3's carry-forward**, als die alleen de train-dagen
materialiseert. Dat is exact V3's vierde open vraag ("welke velden rollen mee / bij lezen of bij schrijven").
Noteren voor die bouw-chat: **de carry-forward moet zeven rijen leveren, niet alleen de train-dagen.** Zelfde
vorm als V8's `hm`-landmijn: het werkt half en zwijgt erover.

### Nevenvondst — `mesoWeek === 4` is V2's DERDE baan

V2 stelde vast dat één teller twee banen draagt (variant-rotatie + `mesoFactor`). Er is een derde:
`packages/engine/src/planner.ts:494` `const isMesoRecovery = mesoWeek === 4;` (GAS `src/Algorithm.gs:991`) —
de **recovery-week-vlag van de hele allocator**. En een vierde, klein:
`packages/engine/src/planner.ts:1981` (GAS `src/Algorithm.gs:2802`) in `genericPendelZ2` (alleen naam +
eindopmerking). V2's off-by-one verschuift de recovery-week dus van blokweek 4 naar 5 en zet hem daarna
**voorgoed uit** — een zwaarder gevolg dan V2's vermogens-schaling. Geen nieuwe vondst; V2's invulling, breder
dan V2 hem opschreef.

## V15 · `gatherWeekplanEntries_` (Algorithm.gs:971) — twee banen, en de GAS-baan is dood

- **locaties** — GAS `src/Algorithm.gs:971`, enige productie-aanroeper `src/Algorithm.gs:1015` · Cadans
  `packages/engine/src/planner.ts:454`; aanroepers `packages/engine/src/planner.ts:531` (null-reader) en
  `workers/api/src/db/repo.ts:222` (echte reader, via `readRecentWeekplans` `workers/api/src/db/repo.ts:193`
  ← route `workers/api/src/routes/api.ts:187`)
- **norm** — infra → parity is norm
- **R2-overlap** — V7 noemt "de archetype-recency" als één van de inputs zonder bron. Dit is de meting én een
  correctie op de verwachting dát V7's bouw hem dicht.

Body-diff = de DocProp-seam: GAS `getDocProp('weekplan_' + …)` + `JSON.parse` in een `try/catch` → Cadans
`readWeekplan(key)` die een reeds-geparste array levert. De parse + de foutafhandeling zijn naar de
seam-vuller verhuisd.

**In GAS heeft de fn precies één baan:** de cross-week archetype-recency-seed
(`src/Algorithm.gs:1015` `qualityRecency = recencyFromWeekplan_(gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS), null);`).

**In Cadans heeft hij er twee, en ze zijn tegengesteld ingevuld:**

1. `packages/engine/src/planner.ts:531` — dezelfde baan als GAS, maar de derde arg is **letterlijk `null`**.
   De comment ernaast geeft het toe: *"DATA-IN: het weekplan-lees-pad is untested in de port → null-accessor
   (geen seed)."* GEDRAAID: `gatherWeekplanEntries_(8, null, null)` → `[]`. Altijd.
2. `workers/api/src/db/repo.ts:222` — een baan die GAS **niet** heeft: mét een echte D1-reader, via
   `GET /api/weekplans/recent` naar de client, waar hij `intentByDate` voedt
   (`apps/web/src/lib/proposal.ts:236`). GAS vult die lookup met een andere fn: `intentZonesForDate_`
   (`src/Algorithm.gs:278`, niet geport — hij staat in R2-a's 109).

**Dat is het scherpe punt.** Wie V7's snapshot-laag bouwt, vult `weekplans` → baan 2 komt vanzelf tot leven
(de reader staat er al). Baan 1 **niet**: die seam is hardcoded op `null` binnen `assignWorkouts`, en
`assignWorkouts`' twaalf parameters bevatten geen reader. Hem vullen is een **engine-signatuur-wijziging**.
V7 dicht dus niet alles wat hij belooft.

### Wat de dode seed kost (GEDRAAID)

`allocateQualityWeek_` met dezelfde week, dezelfde dekking, alleen de recency verschillend. Seed = de
weekplan-entries van vorige week (drempel `threshold_overunder` + sweet spot `ss_2x20`):

| dag | zonder seed (Cadans) | met seed (GAS) |
|---|---|---|
| di | quality / threshold / **`threshold_overunder`** | quality / threshold / **`threshold_overunder_long`** |
| wo, do, za, zo | identiek | identiek |

Eén dag, en precies de bedoelde eigenschap: de archetype-rotatie herhaalt over de weekgrens wat GAS zou
mijden. Binnen één week roteert Cadans wél — `qualityRecency` wordt in-loop aangevuld
(`packages/engine/src/planner.ts:741`). Vandaag is het effect nul, want `weekplans` is leeg (B0-iii); het
wordt zichtbaar zodra V7 gebouwd is en de rotatie dan nóg niet werkt.

### Nevenvondst — de seam-vuller mist GAS' parse-vangnet

GAS `src/Algorithm.gs:971`-body: `try { arr = JSON.parse(raw); } catch (e) { continue; }` — één corrupte week
wordt overgeslagen, de rest komt door. Cadans `workers/api/src/db/repo.ts:218`
`const parsed = r.entriesJson ? JSON.parse(r.entriesJson) : null;` staat **niet** in een try/catch → één
corrupte rij laat de hele read (en dus de route) falen. Latent zolang niemand schrijft; hoort in dezelfde
bouw-chat.

## V16 · `formatDate` (Utils.gs:71) — de platform-shim faalt STIL op twee patronen

- **locaties** — GAS `src/Utils.gs:71` (`Utilities.formatDate(date, TZ, format)`) · Cadans
  `packages/engine/src/utils.ts:28`
- **norm** — infra → parity is norm

De port is geen port maar een herimplementatie: `format.replace(/yyyy/g,…).replace(/MM/g,…)` etc. voor zes
tokens (`yyyy` `MM` `dd` `HH` `mm` `ss`). GAS delegeert aan `Utilities.formatDate`, die het volledige
Java-`SimpleDateFormat`-vocabulaire kent. GEDRAAID op alle acht patronen die in beide bronnen voorkomen
(fixture vr 17-07-2026 09:05:03):

| patroon | Cadans-shim | correct? | waar in GAS |
|---|---|---|---|
| `yyyy-MM-dd` (60×) | `2026-07-17` | ✓ | overal |
| `yyyy-MM` (4×) | `2026-07` | ✓ | `dashNiveauReeks_` e.a. |
| `dd-MM` (2×) | `17-07` | ✓ | `src/Sync.gs:600`, TelegramBot |
| `yyyyMMdd` (1×) | `20260717` | ✓ | `src/WebApp.gs:908` (`getPowerCurve`-cachekey) |
| `dd-MM-yyyy HH:mm` (1×) | `17-07-2026 09:05` | ✓ | `src/Sync.gs:38` (`last_sync`) |
| `yyyy-MM-ddTHH:mm:ss` | `2026-07-17T09:05:03` | ✓ | Cadans-eigen (`workers/api/src/db/dates.ts:34`) |
| **`EEE dd-MM`** (4×) | **`EEE 17-07`** | **✗** | `src/Proposal.gs:82/318/366`, `src/TelegramBot.gs:489` |
| **`d/M`** (1×) | **`d/M`** | **✗** | `src/Algorithm.gs:2058` (`rpeStatusLines_`) |

**Geen gat vandaag, met bewijs.** De twee onondersteunde patronen leven uitsluitend in lagen die Cadans per
ontwerp niet heeft: de Voorstel-tab (`Proposal.gs` = display, `REBUILD-SCOPE.md:70` "sterft") en de
Telegram-bot (fase 6; `rpeStatusLines_`' enige aanroeper is `src/TelegramBot.gs:456`). Cadans' eigen drie
patronen zijn alle drie gedekt.

**Wél een landmijn, en het is dezelfde als V8's `hm`.** De shim gooit niet; hij geeft het patroon letterlijk
terug. Wie in fase 6 de bot port of ooit een `EEE`-datum wil, krijgt `EEE 17-07` op het scherm zonder één
foutmelding. Noteren voor fase 6.

## V17 · Vier geporte fns met NUL aanroepers — V10's klasse, nu vier keer

Mechanisch vastgesteld (grep over `packages/engine/src`, `apps/web/src`, `workers/api/src`, tests
uitgezonderd): deze vier zijn geport, staan in de 957-selftest, en worden door **geen enkele regel
productiecode** aangeroepen.

| fn | GAS-consument | wat er in Cadans mee gebeurde |
|---|---|---|
| `dashActualsByDate_` (`packages/engine/src/niveau.ts:184`) | `src/WebApp.gs:1049` (dagkaarten) + `src/WebApp.gs:755` (`getDayCoachZones`) | **vervangen**: `buildDoneEntry` (`apps/web/src/lib/schema.ts:301`) + `mergeDone` (`apps/web/src/lib/schema.ts:324`) |
| `dashStatsFromActivities_` (`packages/engine/src/niveau.ts:247`) | `src/WebApp.gs:1190` → `tssPerUur` → `voortgangPct` | **consument bestaat niet** — dat is V1-(c) |
| `dashBeginAnker_` (`packages/engine/src/niveau.ts:298`) | `src/WebApp.gs:1283` → `beginLabel`/`beginNiveau`/`niveauDelta` | **nagebouwd**: `wkgSince` — zie V18 |
| `dslBlockFromRow_` (`packages/engine/src/zones.ts:274`) | `src/Algorithm.gs:1598` (`buildWorkoutDsl_`) | **wacht op FASE C** — de assembler is niet geport |

Drie verschillende redenen, drie verschillende verdicten:

- `dashStatsFromActivities_` en `dslBlockFromRow_` zijn **verklaard, geen gat**. De eerste hangt onder V1-(c)
  (als R4 `voortgangPct` terugwil, staat de fn klaar); de tweede is een bewust vooruit-geporte bouwsteen van
  de push-keten, precies zoals `zwoStepFromRow_` (R1-C2 stelde dáárvan mechanisch vast dat hij 1-op-1 is).
- `dashActualsByDate_` is vervangen door een fn met **andere regels** — de dag wordt gesommeerd waar GAS de
  nieuwste rit per datum pakt (`src/WebApp.gs:126`, hoogste idx0-timestamp wint). Dat is V4's de-facto
  regel; hier raakt hij een derde consument. Geen aparte vondst.
- `dashBeginAnker_` is nagebouwd en de nabouw wijkt af → V18.

`dashActivityScan_` (`packages/engine/src/niveau.ts:93`) verdient een voetnoot: de hele READ-ONCE-THREAD-
optimalisatie — in GAS gebouwd om vier Sheet-passes tot één te collapsen — draait in Cadans nog voor precies
één consument (`dashNiveauReeks_`), en de reden waarom hij bestaat (Sheet-IO is duur) is met D1 verdwenen.

## V18 · `dashBeginAnker_` → `wkgSince` — de app claimt progressie waar GAS zwijgt

- **locaties** — GAS `src/WebApp.gs:297` (`dashBeginAnker_`), aanroep `src/WebApp.gs:1283`, `beginLabel`
  `src/WebApp.gs:1290`, de render `src/Script.html:1341` (`dWkg`) + `src/Script.html:1342` (`deltaLine`) ·
  Cadans `apps/web/src/lib/niveau.ts:94` (`wkgSince`), aanroep
  `apps/web/src/components/vorm/LevelCard.tsx:25`
- **norm** — front-end/vormgeving → **GAS is norm** → drift = fout

GAS' LevelCard-regel heeft twee ingrediënten uit twee bronnen:

- **het getal** `dWkg` = `prog[laatste].wkg − prog[0].wkg` over `state.niveauProgressie` — Cadans' `wkgSince`
  doet exact hetzelfde over dezelfde serie. Getrouw.
- **het label** `sinds <beginLabel>` = de maand van de **oudste Activiteiten-rij**, via `dashBeginAnker_`
  (`src/WebApp.gs:1290` `DASH_MND_[bd.getMonth()] + " '" + …`). Cadans neemt in plaats daarvan de maand van
  het **eerste serie-punt met een W/kg-waarde** (`apps/web/src/lib/niveau.ts:94`, `serie.filter(p => p.wkg != null)`).

Die twee zijn gelijk zolang de oudste rit een `icu_ftp` én `icu_weight` draagt. Zo niet, dan lopen ze op twee
manieren uiteen — en GAS' regel is ge-gate op `beginLabel` (`src/Script.html:1342`
`(dWkg != null && dWkg !== 0 && s.beginLabel)`), Cadans' regel niet.

### GEDRAAID (`TZ=Europe/Amsterdam`), twee fixtures van drie activiteiten

| fixture | GAS | Cadans |
|---|---|---|
| oudste rit HÉÉFT ftp+gewicht | `sinds okt '25` | `+0,37 W/kg sinds okt '25` — **identiek** |
| oudste rit ZONDER ftp/gewicht | `beginLabel = null` → **de hele regel wordt onderdrukt** | `+0,20 W/kg ↑ sinds jan '26` |

De eerste rij is de zelf-controle: dezelfde harness, dezelfde serie, en dan geen verschil — het verschil in
rij twee komt dus niet uit de probe.

In het tweede geval doet Cadans **twee** claims die GAS niet doet: dát er progressie is, en dat die **sinds
jan '26** loopt terwijl de data in okt '25 begint. Bereikbaar: `icu_ftp` op de oudste rit ontbreekt zodra
intervals.icu toen nog geen eFTP had — realistisch na de prod-backfill van 365 dagen.

Waarom GAS zwijgt is trouwens verdedigbaar: zonder anker weet je niet of het eerste serie-punt de start ván
de historie is of het eerste punt mét data. Dat is een model-vraag onder een vormgeving-drift.

## V19 · `getReadinessScore_` (Algorithm.gs:1466) — vier inputs, alle vier verklaard

- **locaties** — GAS `src/Algorithm.gs:1466`, de drie `=== undefined`-seams `src/Algorithm.gs:1467-1469`, de checkin-seam
  `src/Algorithm.gs:1526`, aanroep `src/WebApp.gs:1198` · Cadans `packages/engine/src/readiness.ts:71`,
  aanroep `apps/web/src/lib/readiness.ts:75`
- **norm** — infra → parity is norm

Body-diff = drie lazy seams die vervielen (`fs === undefined → getFormScore_()`, `wellness === undefined →
getWellnessSignal(…)`, `reeks === undefined → dashVormReeks_()`) plus `checkin` van een body-read
(`getTodayCheckin_()`) naar een vierde parameter. Dat is de klasse "seams uit debt (b)". De vier invullingen:

| param | GAS geeft | Cadans geeft | oordeel |
|---|---|---|---|
| `fs` | `getFormScore_(wellValues)` (`src/Algorithm.gs:1337`, Sheet-pad) | `formStateFromWellness_(rows)` (`packages/engine/src/readiness.ts:376`) | port van precies dat Sheet-pad; het live-pad (`getWellness(7)`, `src/Algorithm.gs:1360`) is een API-fallback die D1 overbodig maakt |
| `wellness` | `combineSignals_(getWellnessSignal(ss, wellValues), rpeSignal_())` | `wellnessSignal_(rows)` — **ongecombineerd** | **GEDRAAID: byte-identiek** voor alle vier rpe-signalen. `combineSignals_` (`src/Algorithm.gs`) raakt uitsluitend `.signal`/`.reason`; `getReadinessScore_` leest alleen `hrvDeficit`/`sleepAvg3`/`sleepLastNight`/`hrvRecent`. Geen gat. |
| `reeks` | `dashVormReeks_(wellValues)` | de RAUWE `WellnessInput[]` | R1-C3, al gemeten: equivalent (93 = 93), mét het gelogde volgorde-restrisico |
| `checkin` | `getTodayCheckin_()` in de body | param 4, gevuld met `getCheckin(todayISO)` (`apps/web/src/lib/schema.ts:878`) | seam gevuld |

**Verklaard, geen gat.** Eén van de weinige groep-3-fns waar de invulling volledig staat.

## V20 · Groep 4 — geen architectuurgrens maar drie ongelijksoortige gevallen

De matrix zet deze vier bij elkaar onder "architectuurgrens (de `lib/api.ts`-fetchwrappers, geen port)". Dat
label klopt voor twee van de vier, en voor `getEvents` klopt de premisse zelfs niet.

### `getEvents` — DODE code in GAS; de naam-match is toeval

`src/Events.gs:201` `getEvents()` heeft in de **hele GAS-bron nul aanroepers** (mechanisch geverifieerd). De
fn die het werk doet is `getAllEvents_` (`src/Events.gs:171`, 6 aanroepers, o.a. `src/WebApp.gs:1041`
`var eventsData = getAllEvents_();`) en die filtert **niet**. Cadans' `getEvents`
(`apps/web/src/lib/api.ts:104` → `readEvents` `workers/api/src/db/repo.ts:380`) geeft alle events terug en is
dus de tegenhanger van `getAllEvents_`, niet van `getEvents`.

Sterker: GAS' dode fn filtert `e.datum >= today`, en dát filter zou `eventFase_`'s Recovery-tak **breken** —
die zoekt juist een A-race die deze week al gewéést is (`src/Doel.gs:225-236`; port
`packages/engine/src/phase.ts:96`). Cadans' ongefilterde keuze is niet alleen niet-fout, hij is nódig. Sluit
af met bewijs.

### `getPowerCurve` — geen fetchwrapper maar een RPC-entrypoint, en hij is geport

`src/WebApp.gs:906` is een `google.script.run`-entrypoint (`src/Script.html:1736`), geen API-client:
venster-whitelist → DocProp-dagcache (`powercurve_raw_<window>_<yyyyMMdd>`) → fetch → `pcNormalize_`. De
entrypoint-map noemt hem al correct: `getPowerCurve [hernoemd] → GET /api/power-curve`. De cache-laag is de
enige echte vraag hier, en die is geen gat maar een architectuurkeuze (D1 `power_curve_cache` + read-through).
Sluit af.

### `getActivities` — de echte tegenhanger is de Worker, en die is getrouw

GAS `src/IntervalsApi.gs:116`, 11 aanroepers: `syncActivities` plus **vier live-fallbacks**
(`getActivities(14)` op `src/Algorithm.gs:446/599/639/666`). De Cadans-tegenhanger is
`workers/api/src/integrations/intervals.ts`, niet `apps/web/src/lib/api.ts:75`. Parity:

- venster-default 28 (`workers/api/src/integrations/intervals.ts:88` `opts.daysBack ?? 28`) = GAS' `daysBack || 28` ✓
- de sort is expliciet gespiegeld (`workers/api/src/integrations/intervals.ts:103`, comment: "Spiegelt de
  IntervalsApi.gs-sort-comparator: oudste eerst") ✓

De vier live-fallbacks vallen onder R2-a (`computeWeekVolumeMin_`, `cyclingActivitiesByDate_`,
`actualTssByDate_` staan in de 109; `computeZoneDebt_`'s fallback is R1-B4's "live-refetch-tak → seam").
Geen nieuw gat.

### `getWellness` — één echte drift: het venster verdubbelde

GAS `src/IntervalsApi.gs:142`, `daysBack || 30`; de sync-arm vraagt `getWellness(30)` (`src/Sync.gs:290`).
Cadans: `workers/api/src/integrations/wellness.ts:97` `opts.daysBack ?? 60`. **30 → 60.** Het staat als feit
in de HANDOFF (onder de VOLLEDIG-SYNC-PAD-debt) maar niet als parity-punt. Richting: méér historie, dus geen
verlies — `wellnessSignal_`'s HRV-baseline is 28 dagen en `formStateFromWellness_` pakt de nieuwste rij. Voor
R4 is de vraag alleen of dit bewust was; als infra-parity de norm is, is een stilzwijgende verdubbeling er
strikt genomen een drift van. Klein.

## Afgesloten in b, met bewijs — cosmetische body-diffs

Voor deze zes is het body-verschil mechanisch teruggebracht tot **precies één benoemde transformatie**: pas
die toe op de GAS-bron en de canonieke vormen zijn identiek (`tools/audit/run.mjs`' `canonOf`, alle zes
regels + de rule-2-rename). Dat is sterker dan een leesronde: het sluit uit dat er nóg iets in zit.

| fn | de enige transformatie | klasse |
|---|---|---|
| `zoneTimesFromCell_` (`packages/engine/src/zones.ts:88`) | `catch (e)` → `catch` (ES2019 optional catch binding) | **gereedschaps-artefact** |
| `dslBlockFromRow_` (`packages/engine/src/zones.ts:274`) | lokale var `range` → `rng` | **gereedschaps-artefact** |
| `dashActualsByDate_` (`packages/engine/src/niveau.ts:184`) | `actValues \|\| readActiviteitenValues_()` → `actValues \|\| []` | Sheet-IO-seam |
| `dashStatsFromActivities_` (`packages/engine/src/niveau.ts:247`) | idem | Sheet-IO-seam |
| `dashBeginAnker_` (`packages/engine/src/niveau.ts:298`) | idem + `ss` → `_ss` | Sheet-IO-seam |
| `dashNiveauReeks_` (`packages/engine/src/niveau.ts:310`) | idem + `ss` → `_ss` | Sheet-IO-seam |

De eerste twee zijn geen port-feit maar een **gereedschaps-feit**: de sorteermachine heeft geen regel voor de
optional catch binding, en geen voor een lokale-var-rename. Beide zijn bekend terrein — de bewaker-teller
noemt `dslBlockFromRow_/range` al letterlijk als naam-schaduwing. Ze zijn dus als "verschil" gesorteerd om een
reden die niets met de port te maken heeft. **Regel-kandidaten 7 en 8**, als R4 de matrix ooit scherper wil;
niet nodig voor de review, want de fns zijn hiermee afgesloten.

`dashNiveauReeks_`' gewicht-seam is compleet: `getGewicht()` (`packages/engine/src/niveau.ts:26`) hangt aan
`setGewichtProvider`, en die wordt door beide consumenten gevuld (`apps/web/src/lib/niveau.ts:55` en
`apps/web/src/pages/Niveau.tsx:98`, beide `() => settings?.gewicht ?? 0`). Debt (b)'s "RESTEREND: gewicht" is
daarmee INGELOST voor de niveau-keten. NB de fallback verschilt: GAS `getGewicht` (`src/Settings.gs:315`) valt
terug op `SETTINGS_DEFAULTS.gewicht`, Cadans op `0` — dat is R1-C0's `SETTINGS_DEFAULTS`-vondst, niet nieuw.

## BOUW-LANDMIJN (nieuw) — `zones` tegenover `intent`: één snapshot, twee velden

Dit hoort bij geen enkele van de veertien alleen; het komt boven bij V15 en het is een waarschuwing voor de
V7-bouw-chat. GAS' weekplan-snapshot draagt **beide** velden (`src/Algorithm.gs:243` `zones: Object.keys(zoneSet)`
en `src/Algorithm.gs:244` `intent: aggIntent`) en heeft **twee lezers die elk een ander veld pakken**:

- `computeZoneDebt_` leest `p.intent` — het minuten-object. Correct: debt = intent − actual.
- `rollingZoneCoverage` leest `.zones` via `intentZonesForDate_` (`src/Algorithm.gs:278`) — de string-array —
  en telt `intentZones.forEach(z => cov[z]++)` (`src/Algorithm.gs:320`).

Cadans levert beide lezers **hetzelfde** object: `intentByDateFrom` (`apps/web/src/lib/proposal.ts:136`
`const it = e.intent`) → `intentByDate`. Voor `zoneDebt_` klopt dat. Voor `rollingZoneCoverage_` niet, en de
port is dáárop herschreven: `packages/engine/src/weekprep.ts:76` `if (iz.low > 0) cov.low++;` in plaats van
een zones-lidmaatschapstest.

Waarom dat uiteenloopt: `ensureIntent_` verdeelt de totale duur óók over `low` (warmup/rust), terwijl `zones`
alleen de WERK-zone noemt. GEDRAAID op echte engine-workouts:

| type | `zones` (GAS leest dit) | `intent` (Cadans leest dit) |
|---|---|---|
| `sweet_spot` 80′ | `["high"]` | `{low: 35, high: 46}` |
| `threshold` 75′ | `["high"]` | `{low: 37, high: 40}` |
| `vo2max` 80′ | `["anaerobic"]` | `{low: 62, anaerobic: 18}` |
| `long_z2` 80′ | `["low"]` | `{low: 80}` |

Gemeten, week met uitsluitend kwaliteitsdagen (sweet spot 80′ + drempel 75′, geen Z2-rit):

- GAS: rolling `{low: 0, high: 2, anaerobic: 0}` → **`dekking.low = false`**
- Cadans: rolling `{low: 2, high: 2, anaerobic: 0}` → **`dekking.low = true`**

De allocator zou dus denken dat de duur-basis gedekt is zonder dat er één Z2-rit gereden is. Zelf-controle:
met een **lege** `intentByDate` vallen beide op de IF-fallback en zijn ze identiek — dat is de stand van
vandaag (R1-B3 stelde vast dat de intent-tak dood is), dus **vandaag onbereikbaar**. Het vuurt op de dag dat
V7 gebouwd wordt. Zelfde vorm als V8's `hm`.

Voetnoot bij V6: er is een **negende** dode D1-kolom. `planner_days.dag` (`workers/api/src/db/schema.ts:134`)
wordt door `writePlannerDays` op een constante gezet (`workers/api/src/db/repo.ts:362` `dag: null`) — V6's
"in `vals` met een constante = actief gewist". Hij reist door tot `apps/web/src/lib/proposal.ts:241`
`dag: pd.dag` en wordt daarna nergens gelezen. In GAS voedt `d.dag` alleen display en diagnostiek
(`src/Proposal.gs`, `src/Algorithm.gs:209`'s Logger-regel, `src/WebApp.gs:1350` `dagLabel`); Cadans' UI leidt
de weekdag zelf af. Inventaris, geen gedrag.

## R2-b — samenvatting

**De veertien zijn verklaard.** Zes hadden een body-diff die exact één cosmetische transformatie of seam was
(mechanisch bewezen, niet gelezen); `buildWorkout` — R0's tweede "zwaarste onbekende" — had er twee dode
var-declaraties; `formatDate` is een herimplementatie die zijn eigen patronen dekt; `getReadinessScore_` heeft
vier inputs die alle vier staan; groep 4 was geen architectuurgrens maar drie ongelijksoortige gevallen,
waarvan één (`getEvents`) een naam-toeval op dode GAS-code.

**R1's kernles houdt, vier keer.** Geen van de vondsten zit in een body. Ze zitten in: een parameter die iets
anders betekent (V14 `slot`), een seam die op `null` staat terwijl de vuller ernaast ligt (V15), een shim die
zwijgend faalt (V16), een fn die is nagebouwd met een andere bron (V18).

**Nieuw t.o.v. V10's klasse.** V10 vond één geporte fn met nul aanroepers. Er zijn er vier
(V17) — maar met drie verschillende redenen, en alleen bij één (`dashBeginAnker_`) leidt het tot drift. "Nul
aanroepers" is dus een vraag, geen verdict. En V15 voegt een scherpere variant toe: de fn wórdt aangeroepen,
maar de aanroeper geeft `null` waar de vuller in een andere laag klaarligt.

**Drie bouw-landmijnen liggen nu naast V8's `hm`:** V14 (carry-forward moet zeven rijen leveren), V16
(`EEE`/`d/M` falen stil in fase 6), en `zones`-vs-`intent` (V7's bouw activeert een verkeerde dekking-telling).
Alle drie: het werkt half en zwijgt erover.

**Wat vraagt welk R4-verdict** (richting, geen verdict):

| bevinding | vraag voor R4 | toets aan |
|---|---|---|
| V14 `slot` = array-positie | latente drift; hoort bij V3's carry-forward-bouw | GAS is norm (infra-parity) |
| V14-neven `mesoWeek === 4` | V2's off-by-one zet de recovery-week na blokweek 5 voorgoed uit | MODEL |
| V15 recency-seed op `null` | wil de rotatie over weekgrenzen mijden? zo ja: engine-signatuur | MODEL (of V7 hem waard is) |
| V16 `EEE`/`d/M` | geen actie nu; blokkeert fase 6 stil | GAS is norm |
| V17 vier nul-aanroepers | `dashStatsFromActivities_` hangt aan V1-(c); de andere drie zijn verklaard | n.v.t. |
| V18 `wkgSince`-label | de kaart claimt progressie waar GAS zwijgt — vormgeving-drift | GAS is norm |
| V19 `getReadinessScore_` | geen | n.v.t. |
| V20 `getWellness` 30 → 60 | bewust of gegroeid? | GAS is norm (infra-parity), klein |
| `zones` vs `intent` | onbereikbaar tot V7; dan een echte dekking-fout | GAS is norm |

**Geen nieuwe open bouw-vraag.** V14 valt binnen V3's vierde open punt (carry-forward: welke velden, bij lezen
of bij schrijven), V15 en `zones`-vs-`intent` binnen V7's plaats-en-schrijver-vraag. De vijf die na a3 open
stonden staan er nog steeds — b legt er geen zesde naast, maar maakt twee ervan **duurder**: wie V7 bouwt moet
óók de reader-seam in `assignWorkouts` en het `zones`/`intent`-onderscheid meenemen, anders bouwt hij de laag
en blijft de helft dood.

## Nog open in R2 (volgende chats)

R2-a en R2-b zijn KLAAR. Resteert:

- **R2-c** — de 115 alleen-in-Cadans-units, gefilterd op "neemt een beslissing".

Daarna R3 (trainings-review tegen `docs/TRAININGSMODEL.md`) en R4 (verdict-doc per item;
verdict-criterium = het MODEL, niet GAS).
