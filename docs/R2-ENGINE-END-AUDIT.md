# R2 — ENGINE END-AUDIT (findings, GEEN verdicts)

Vervolg op `docs/R1-PORT-CORRECTHEID.md`. **Findings, geen verdicts** — verdicts zijn R4, en het
verdict-criterium is het MODEL (`docs/TRAININGSMODEL.md`), niet GAS. Elke bevinding hieronder is
mechanisch geverifieerd: locatie-ankers met een inhouds-assertie (bestand + regel + verwachte
substring), en waar gedrag geclaimd wordt is de engine GEDRAAID onder `TZ=Europe/Amsterdam` op input
die uit de keten zelf komt.

Batch a1 (deze chat): G1 + V1 + V2 + V3.

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

## Nog open in R2-a (volgende chat)

Uit de 95: de coach-inputs (`coachEventFromMacro_`, `coachPatternCount_`, `dashDayCard_`,
`dashWeekplanByDate_`, `sumTssVanafDatum_`, `getWeekLoad_`), de zone-resolutie (`syncAthleteZones`,
`resolveZones_`, `normalizeZones_`, `sweetSpotFromActivity_` — infra, dus parity is norm), het
doel-profiel (`buildGoalProfile_`), de RPE-mismatch-laag (`rpeWeekData_`, `rpeMismatchFlag_`,
`plannedTypeForDate_`), de snapshot-laag (`writeDaySessions_`, `cleanupOldProposals_`,
`writeVoorgesteldType`), de reconciliatie (`reconcilePlannerWithActivities` — de wortel van R1-B0-ii,
mét een ongeporte matching-regel: ride/run én duur ≥ 50% van de geplande minuten), de sync-paden
(`syncActivitiesIncremental_`), `eventContextFrom_`, `bepaalFaseVoorDatum_`, `garminHeuristic`.

Daarna R2-b (14 fns, incl. `buildWorkout`) en R2-c (115, gefilterd).
