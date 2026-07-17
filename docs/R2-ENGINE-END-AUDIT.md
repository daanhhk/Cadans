# R2 — ENGINE END-AUDIT (findings, GEEN verdicts)

Vervolg op `docs/R1-PORT-CORRECTHEID.md`. **Findings, geen verdicts** — verdicts zijn R4, en het
verdict-criterium is het MODEL (`docs/TRAININGSMODEL.md`), niet GAS. Elke bevinding hieronder is
mechanisch geverifieerd: locatie-ankers met een inhouds-assertie (bestand + regel + verwachte
substring), en waar gedrag geclaimd wordt is de engine GEDRAAID onder `TZ=Europe/Amsterdam` op input
die uit de keten zelf komt.

Batch a1: G1 + V1 + V2 + V3. Batch a2 (deze chat): V4 + V5 + V6 + V7.

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

## Nog open in R2-a (volgende chat)

Uit de 95, na a1 (G1 · V1 · V2 · V3) en a2 (V4 · V5 · V6 · V7): de coach-inputs
(`coachEventFromMacro_`, `coachPatternCount_`, `dashDayCard_`, `dashWeekplanByDate_`,
`sumTssVanafDatum_`, `getWeekLoad_`), het doel-profiel (`buildGoalProfile_`), `eventContextFrom_`
(`Algorithm.gs:711` — de wortel onder "workouts niet event-getailord"), `bepaalFaseVoorDatum_`,
`garminHeuristic`, en de sync-paden (`syncActivitiesIncremental_`).

Afgesloten door a2, met bewijs, dus NIET meer op de lijst: `reconcilePlannerWithActivities` (V4) ·
`syncAthleteZones` + `resolveZones_` + `normalizeZones_` + `sweetSpotFromActivity_` (V5 — vier
daarvan zijn géén engine-gap) · de snapshot-laag `writeDaySessions_` / `cleanupOldProposals_` /
`writeVoorgesteldType` én de RPE-mismatch-laag `rpeWeekData_` / `rpeMismatchFlag_` /
`plannedTypeForDate_` (V7 — één wortel, twee ketens).

Daarna R2-b (14 fns, incl. `buildWorkout`) en R2-c (115, gefilterd).
