# Prikkel-in-de-rit — recon (T17 korte-dag-val + het lange-dagen-gat)

Read-only recon. GEEN code gewijzigd. Dit document is de bouw-spec; Daan reviewt het
vóór er een regel engine verandert. Engine-autorisatie is nog NIET gegeven.

## 0. Vraag

De app kiest per dag één archetype dat de HELE beschikbare tijd moet omvatten. Twee
gevolgen: een dag van 35-51 minuten forceert elk doel naar VO2max, en een week waarin
élke trainbare dag langer is dan 135 minuten krijgt nul kwaliteit. Wat is de wortel, en
wat is de coach-deugdelijke reparatie?

## 1. Meetopstelling

Engine gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd
op 2026-03-09 (de klok is een fixture-variabele: `allocateQualityWeek_` dateert zich op
`stripTime_(new Date())`). Alle uitspraken hieronder zijn GEDRAAID, niet gelezen.

FIXTURE-CORRECTIE — lees dit vóór je zelf meet. Een niet-trainbare dag heeft in de echte
keten `dagtype: null` (`formToInputs`, `apps/web/src/lib/planner.ts`), NIET `"vrij"`. Met
`"vrij"` krijgt zo'n dag alsnog een hard type in de per-dag-loop, wat `lastHardDate`
vervuilt en de volgende dag ten onrechte naar `long_z2` demoot ("dag na een zware dag").
Die valse meting is in deze recon eerst geproduceerd en daarna gecorrigeerd. Weekenddagen
krijgen `dagtype: "weekend"`, niet `"vrij"`.

## 2. De wortel, één regel

`goalWorkout_` (`packages/engine/src/archetypes.ts`) filtert kandidaten op
`beschikbareTijd >= a.duurRange[0] && beschikbareTijd <= a.duurRange[1]`. Geen kandidaat →
`null` → de allocator zet `planned[dagIdx] = "skip"` (`planner.ts`, stap 3) → de dag valt
in de endurance-fill → `long_z2`. `intentHaalbaar_` gebruikt hetzelfde filter, dus ook de
intent-keuze wordt erdoor bepaald.

## 3. De grens, gemeten (fase Build, per beschikbare minuut)

- t/m 32 min: geen enkel doel krijgt kwaliteit.
- 33-34: alleen Onderhoud (`threshold_2x8`); de vier andere doelen niets.
- 35-45: FTP/Conditie/Beklimmingen/VO2max ALLE VIER `vo2_microburst`; Onderhoud `threshold_2x8`.
- 46-51: alle vijf doelen `vo2_microburst`.
- 52-53: FTP/Conditie/Onderhoud `sweetspot_short`; 54+ komt drempel erbij.
- 126-135: alle doelen `sweetspot_long`.
- vanaf 136: ALLE doelen `null`.

Het plafond 135 is `sweetspot_long.duurRange[1]` — het hoogste plafond in de hele tabel.

## 4. Gemeten schade

Weekfixture, doel FTP, fase Build, quotum 3, maandag 2026-03-09.

- Lange week (di 150 / do 160 / za 240 / zo 180): NUL kwaliteitsdagen, vier duurritten.
- Referentieweek (di 90 / do 100 / za 240 / zo 120): drie kwaliteitsdagen — het quotum wordt gehaald.
- Korte week (di 40 / do 45 / za 240 / zo 50): DRIE VO2max-sessies in één week. Niet alleen
  het verkeerde sjabloon maar een schadelijk plan; avoid-consecutive-hard grijpt niet in
  omdat de dagen niet aaneengesloten zijn.

## 5. De twee gaten zijn NIET dezelfde bug

BOVENGRENS DRAAGT NIET. `expandArchetype_` rendert een 240-minutendag uit `sweetspot_long`
(duurRange 103-135) foutloos: warming-up 15, Sweet Spot 3x20, Z2-endurance 137, cooldown 10,
`totaalMin` exact 240, geen `short`-vlag, `blokken` compleet (9), TSS 183 tegen 168 voor de
kale `long_z2`. `threshold_long` op 240: 3x14 drempel, Z2 158, TSS 179. De renderer heeft de
bovengrens nooit nodig gehad — het is puur een selectie-filter. De dosis-ramp werkt daar ook
gewoon: mesoWeek 1/2/3 geeft 3x20 / 3x21,6 / 3x23 min core.

ONDERGRENS DRAAGT WEL. `threshold_overunder` (duurRange 54-90) met `doelMin: 40` rendert 54
minuten — 14 minuten OVER de beschikbare tijd. De ondergrens beschermt tegen overloop en mag
niet worden opgerekt. Het korte-dagen-gat is dus een INHOUD-gat, geen filter-gat.

## 6. Wat er al bestaat en werkt

COMBO. `combo_long_with_efforts` is bedraad: `allocateQualityWeek_` stap 1 geeft de langste
eligible niet-pendel-dag de rol `longride_efforts` zodra `spreiding.effortsInLangeRit` waar is
EN de fase Build of Peak is. Gerenderd op 240 minuten: warming-up 15, Z2 base 165, DAARNA
Efforts 3x10, uitrijden 15, `totaalMin` 240, TSS 204, `zones` en `intent` correct gevuld
(low 205 / high 30). De prikkel staat dus LAAT in de rit — precies de duurvermogen-vorm.
Alleen `klim` heeft `effortsInLangeRit: true`; ftp/vo2max/conditie/onderhoud staan op false.
SCHULD: `combo_long_with_efforts` levert `blokken: undefined` (R3-M56). `zones`/`intent`/`tss`
zijn wél goed, dus de belasting-keten klopt; het raakt de silhouet-weergave en de
coach-segmenten. Vandaag treft die schuld alleen het doel Beklimmingen; verbreden treft alle doelen.

KORTE SJABLONEN. `sweetspot_2x10` (35-45) en `threshold_2x8` (33-45) bestaan al en zijn
doel-passend, maar dragen `restrictTo: ['onderhoud']`. Hek eraf, gemeten: 33-45 wordt
doel-passend (FTP en Beklimmingen krijgen `threshold_2x8`, Conditie `sweetspot_2x10`, VO2max
houdt `vo2_microburst`). 46-51 blijft VO2-only — het gat tussen hun plafond 45 en
`sweetspot_short`'s ondergrens 52.

## 7. GAS-parity — beide gaten zijn GEËRFD

Geverifieerd tegen de bevroren bron `daanhhk/training` @ `3e8090a`:
- Identieke `duurRange`-tabel en identiek filter (`src/Archetypes.gs`).
- Identieke `restrictTo: ['onderhoud']` op dezelfde twee archetypes, mét het comment
  "Fase 2b: alleen zichtbaar voor het onderhoud-profiel (4 doelen byte-identiek)". Het hek is
  dus POORT-VOORZICHTIGHEID uit een migratiefase, geen trainingsbesluit.
- Identieke `effortsInLangeRit`: alleen bij het klim-profiel true (`src/Archetypes.gs`), zelfde
  Build/Peak-poort (`src/Algorithm.gs`).
Niets hiervan is in Cadans geïntroduceerd. Repareren is dus een bewuste, gemotiveerde fork.

## 8. DE ADDER — plafond wegnemen regresseert bestaande weken

GEDRAAID. Zet je `duurRange[1]` ruim op alle kwaliteitssjablonen, dan verandert ook de
REFERENTIEweek: de zondag van 120 minuten kiest `sweetspot_short` (duurRange 52-90) in plaats
van `sweetspot_4x12`. Oorzaak: de tie-break in `goalWorkout_` sorteert oplopend op
`duurRange[0]`, dus zodra alle plafonds wijken wint het sjabloon met de LAAGSTE ondergrens —
een 52-minuten-core op een rit van twee uur. Het plafond doet vandaag dubbel werk: het
begrenst de fill ÉN het houdt de tie-break eerlijk.

REGEL DIE WEL WERKT. Een sjabloon dat de beschikbare tijd OMVAT wint altijd; bestaat dat niet,
dan wint de GROOTSTE core (hoogste `duurRange[1]`) binnen de gekozen intent. Gedrag onder 136
minuten dan byte-identiek — gemeten: referentieweek en korte week ongewijzigd. Boven 135:
`threshold_long` respectievelijk `sweetspot_long`, de grootste cores.

GEVOLG OM TE ACCEPTEREN OF TE ONTWERPEN. Boven 135 is er per intent precies één grootste
sjabloon, dus de archetype-rotatie valt stil: in de lange testweek kregen dinsdag én donderdag
`threshold_long`. Keuze bij de bouw: accepteren, of de top-N plafonds per intent toelaten.

## 9. Voorstel

DEEL 1 — LANGE DAGEN, twee sporen naast elkaar (periodisering, niet compromis).
(a) De ENE lange rit per week houdt de combo-vorm: prikkel LAAT, na de Z2-basis
    (duurvermogen — specifiek voor een heuvelklassieker waar het vierde uur beslist).
    `effortsInLangeRit` gaat aan voor alle doelen; de bestaande Build/Peak-poort blijft
    ongewijzigd en is de frequentie-rem. `blokken` op `combo_long_with_efforts` wordt in
    dezelfde bouw gevuld — anders verbreedt de weergave-schuld mee.
(b) De OVERIGE lange dagen krijgen de sjabloon-route met de regel uit §8: prikkel vroeg,
    doel-passend, mét archetype-rotatie en dosis-ramp.

DEEL 2 — KORTE DAGEN. `restrictTo: ['onderhoud']` vervalt op `sweetspot_2x10` en
`threshold_2x8`, en hun `duurRange[1]` gaat van 45 naar 51 zodat het gat 46-51 dicht is en
naadloos aansluit op `sweetspot_short` (52). Dat is consistent met de eigen conventie in de
tabel (plafond = ondergrens plus ongeveer 30-40 minuten fill), waar deze twee met +10 juist
krap stonden. Onderhoud verandert hier WEL, en dat is gemeten: in de band 46-51 minuten kreeg Onderhoud tot nu
toe `vo2_microburst` en krijgt het na de wijziging `threshold_2x8`; onder de 46 houdt Onderhoud
dezelfde twee sjablonen als nu. Er is bovendien een tweede, bedoelde verbreding: in de band 33-34
minuten kregen de vier capaciteitsdoelen tot nu toe HELEMAAL geen kwaliteit (null, dus de dag viel
naar de duurrit); na de wijziging krijgen ze `threshold_2x8`. De volledige veranderband is dus
33-51 minuten, niet 35-51. Vanaf 52 minuten is het gedrag voor alle vijf doelen ongewijzigd.

INVARIANTEN DIE DE BOUW MOET BORGEN.
- Karakter-invariantie (M74-M78): alleen de dosis beweegt, nooit het %FTP.
- Onder 136 minuten byte-identiek gedrag voor alle vijf doelen, met een test die dat vastlegt.
- `plannerMin` blijft harde bovengrens: geen sessie loopt over de beschikbare tijd.
- Deload (mesoWeek 4) ongemoeid: quotum 1, weekdag-only.

## 10. Buiten scope

Geen wijziging aan quota, spreiding, avoid-consecutive-hard, readiness, debt of taper. Geen
nieuwe archetypes. Geen schema- of API-wijziging. De verwachting is client-loos: engine plus tests.

## 11. Te autoriseren engine-plekken (nog NIET gegeven)

- `goalWorkout_` en `intentHaalbaar_` in `packages/engine/src/archetypes.ts` — de selectieregel.
- `restrictTo` en `duurRange` op `sweetspot_2x10` en `threshold_2x8`, idem bestand.
- `spreiding.effortsInLangeRit` op de vier niet-klim-profielen, idem bestand.
- De `combo_long_with_efforts`-generic — `blokken` vullen.
- `packages/engine/src/selftest.test.ts` — nieuwe asserties, vloer stijgt mee.
