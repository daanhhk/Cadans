# Punt 15 fase 3c — de lange rit is het tekort niet; de meetlat die het plan niet kan halen wel

Spec en verdict voor fase 3c. De ROADMAP zette drie punten in volgorde: (i) de sessie schaalt
niet met de ritduur, (ii) de sessie overschrijdt de opgegeven dag, (iii) een dosis-verhoging bij
`klim_lang`. De meting hieronder keert die volgorde om: (i) en (iii) mikken op de enige sessie
die in elke tekort-cel BOVEN zijn deel zit, (ii) is het enige echte defect binnen 3c, en het
eigenlijke tekort blijkt een NORM-vraag te zijn.

## 1. Meetopstelling

Chat-zijde gedraaid. Engine plus client-lib (`buildWeekProposal`, `planZone5_`, `blokDosisNorm`)
gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd op de
fixture-maandag 2026-07-27, A-race 2027-04-17. Fase gestuurd via `doelStart`: 2026-07-27 Base,
2026-06-29 Build, 2026-06-01 Peak. MEETRUIMTE 5 doelen x 3 fases x 9 weekvormen = 135 cellen —
de zeven uit `weekvormAs.test.ts` plus W3 3,0u (ma60 wo60 vr60) en W4 4,0u (ma60 wo60 vr60 za60),
identiek aan fase 3b. Werkminuten = tempo plus drempel plus anaeroob uit `planZone5_` over de
`blokken` van elke sessie, dus dezelfde grootheid die `buildBlokReferent` leest. Bij een
trede-sweep wordt `blokDosisNorm` op DEZELFDE trede aangeroepen als het plan; norm en plan in
dezelfde eenheid, anders is de vergelijking scheef.

M0 — INSTRUMENT VOORAF GEVALIDEERD. Korte beklimmingen V1 in Build geeft 68,5 werkminuten met
tempo 4,0, drempel 39,8 en anaeroob 24,8 — exact de uitkomst van fase 3b. Over Build en Peak:
Korte beklimmingen gemiddeld 71,6 met 8 van de 18 cellen op de totaalnorm, Lange beklimmingen
70,8 met 14 van de 18. De 3b-close-out noteerde 71,5 en 70,7; dat is afronding op het gemiddelde,
de celtellingen zijn gelijk.

## 2. M1 — HET TEKORT ONTLEED, EN DE EFFORTS-RIT ZIT ERBOVEN

Over Build en Peak, 18 cellen per doel, tekort = totaalnorm min geleverde werkminuten:

- Korte beklimmingen: 10 van de 18 cellen onder norm, samen 106,9 minuten.
- Lange beklimmingen: 4 van de 18 cellen onder norm, samen 13,8 minuten.

Die cellen ontleed per sessie tegen de norm van 26 minuten per prikkel. Korte beklimmingen:

- `VO2 Hill Repeats 9x90s` — n=10, som −95, gemiddeld −9,5
- `Drempel ladder 5-7-9` — n=6, som −24, gemiddeld −4
- `Drempel 2x8 kort` — n=2, som −18,2, gemiddeld −9,1
- `Drempel over-under 3 sets` — n=2, som −10, gemiddeld −5
- `Lange rit + Korte beklimmingen efforts` — n=10, som +40, gemiddeld +4

De som is −107,2 tegen een gemeten tekort van 106,9; de ontleding sluit. Lange beklimmingen:
`Drempel ladder 5-7-9` −16 over 4, `Sweet Spot 3x6 kort` −8 over 1, `Sweet Spot 3x8` −6 over 3,
en de efforts-rit opnieuw +16 over 4.

DE EFFORTS-RIT IS IN GEEN ENKELE TEKORT-CEL DE DRAGER VAN HET TEKORT. Hij is de enige term met
een overschot.

## 3. M2 — DE NORM EN HET PLAN LOPEN UIT ELKAAR, EN DAT IS DE EIGENLIJKE VONDST

De dosis-trede bestaat om norm en plan SAMEN op te tillen; `blokDosisNorm` zegt dat met zoveel
woorden. GEMETEN op weekvorm V1 in Build, norm en plan op dezelfde trede:

- FTP: 95 tegen 84 · 108,2 tegen 96 · 121,4 tegen 108 — GELEVERD op trede 0, 2 en 4.
- Lange beklimmingen: 76 tegen 78 · 87,4 tegen 90 · 99,3 tegen 102 — het gat blijft ongeveer
  −2,5 en sluit nooit.
- Korte beklimmingen: 68,5 tegen 78 · 79,6 tegen 90 · 85,5 tegen 102 — het gat GROEIT van −9,5
  naar −16,5.

De norm stijgt 6 minuten per trede (3 prikkels maal `DOSIS_TREDE_STAP_MIN` 2), terwijl de
efforts-arm op een zaterdag van 120 na één stap tegen de ruimte-rem loopt: 30 werkminuten op
trede 0, 36 op trede 2, en 36 op trede 4 — de Z2-basis staat dan op `minBase`. De hendel is op en
de meetlat loopt door.

DE KLIF ERNAAST. Beschikbaarheid ma45 di60 do60 za120 is 4,75 uur: `urenPrikkels` 2, norm 52,
plan 68,5 — GELEVERD bij alle drie de doelen. Weekvorm V1, ma60 di60 do60 za120, is exact 5,0
uur: `urenPrikkels` 3, norm 78, plan 68,5 — ONDER NORM. Vijftien minuten meer beschikbaarheid
verzet de norm met 26 minuten en het plan met nul.

CRITERIUM DAT HIERUIT VOLGT: een week die EXACT volgens plan gereden wordt moet zijn eigen norm
kunnen halen. Kan dat op geen enkele trede, dan is óf de meetlat fout óf het plan te licht — maar
het is geen uitvoeringsprobleem, en de blok-check behandelt het vandaag wel als zodanig.

## 4. M3 — HET MECHANISME AAN DE PLAN-KANT: DE VO2-BAND HOUDT OP BIJ 61 MINUTEN

Gemeten met `expandArchetype_` zelf, op een gevraagde dag van 60 minuten. Elk vo2-archetype
waarvan de duurband die dag raakt: `vo2_microburst` 8 · `vo2_40_20` 11,4 · `vo2_pyramid` 12 ·
`vo2_hill_repeats` 16,5 · `vo2_4x4` 18 · `vo2_60_30` 20 werkminuten.

Elk vo2-archetype met 22 of meer werkminuten begint PAS op 61 minuten of hoger:
`vo2_30_15_sets` 22,5 vanaf 62 · `vo2_4x5` 23 vanaf 61 · `vo2_long` 23 vanaf 65 ·
`vo2_sandwich` 31 vanaf 61.

De andere twee takken hebben op precies 60 wél sterke opties: `threshold_4x8_seiler` 34,4 ·
`sweetspot_lage_cadans_lang` 36 · `sweetspot_2x15` 30 · `threshold_2x12` 24,9.

EN LET OP HOE DAT ENE VO2-SJABLOON AAN ZIJN 31 KOMT. `vo2_sandwich` is 10 minuten tempo op 90
procent, dan 4x2 minuten op 110-114, dan opnieuw 10 minuten tempo: van die 31 werkminuten zijn er
8 werkelijk vo2. De enige route waarlangs de bibliotheek een vo2-sessie boven de 26 tilt is hem
in ZACHTER werk verpakken. Nieuwe sjablonen in de band 55-60 lossen daarmee de teller op en niet
de training — tenzij de norm-vraag uit M2 eerst beslecht is.

## 5. M4 — HET PLAFOND VAN DE BIBLIOTHEEK

Maximale nominale werkminuten per intent over alle 35 archetypes, gemeten met `expandArchetype_`:
vo2 31 (`vo2_sandwich` op 61) · drempel 42 (`threshold_long` op 82) · sweetspot 60
(`sweetspot_long` op 103). GEEN ENKELE duurband reikt boven 135 minuten.

Twee gevolgen. De efforts-arm van `klim_kort` levert 30 werkminuten en zit daarmee al op het
vo2-plafond van 31. En boven 135 minuten heeft de bibliotheek geen enkel anker voor hoeveel werk
een dag draagt, dus een regel die de dosis met de RITDUUR laat groeien zou op een zaterdag van
240 minuten met de hand gekozen zijn — precies wat `DOELEN-SPEC` §2A verbiedt.

## 6. M5 — DE OVERSCHRIJDING, EN `tooLong` IS DOOD AAN ZIJN UITVOER

In 8 van de 135 cellen wordt de sessie 105 minuten op een dag van 60: W3 en W4 in Build en Peak,
bij beide klim-doelen. `totaalMin` is geankerd op `fixedNominal` (15 warmup plus 30 werk plus 15
intra-rust plus 15 uitrijden) plus `minBase` 30, dus zodra de gevraagde tijd daaronder ligt loopt
de sessie eroverheen. Een week van 3 uur wordt zo 3u45 en wordt daarna afgemeten tegen een norm
die op de opgegeven 3 uur is berekend — het plan én de meetlat lopen scheef.

`tooLong` heeft VIER producenten (`archetypes.ts:254` en `:304`, `planner.ts:1388/1405`,
`:1911/2008`, `:2498/2639`) en NUL lezers in de hele repo — niet in `apps/web`, niet in
`workers`, niet in een test. Dezelfde vorm als "een pad kan dood zijn aan zijn UITVOER".

BEREIK. De efforts-sessie komt in 36 van de 135 cellen voor, alle bij de twee klim-doelen, alle
uit de efforts-arm. De weekend-tak in `buildWorkout` levert dit type in deze meetruimte NUL keer;
die tak is hier dus niet toetsbaar, en dat is een grens op de acceptatie-eis en niet op de bouw.

## 7. M6 — DE WAT-ALS: DE ARM PAKT ALLEEN EEN DAG DIE DE SESSIE DRAAGT

Gedraaid met een geparametriseerde kopie: de arm slaat een dag over die korter is dan
`fixedNominal` plus `minBase`.

- Precies 8 van de 135 cellen bewegen, NUL daarbuiten.
- Alle overschrijdingen weg: 8 cellen met een overschrijding worden 0.
- Kwaliteitsdagen overal onveranderd 3.
- Korte beklimmingen W3 en W4 in Build en Peak: 68,5 naar 49,9 tegen norm 52.
- Lange beklimmingen W3 en W4: Build 76 naar 71, Peak 57 naar 35 tegen norm 52.
- De vrijgekomen dag valt terug op `VO2max 40/20` (11,4) bij `klim_kort` en op
  `Anaerobe capaciteit 10x30/30` (8,0) bij `klim_lang` in Peak — opnieuw M3.

DAT VERLIES IS DE WAARHEID DIE VERSCHIJNT, GEEN REGRESSIE. De 68,5 van vandaag bestaat uit 45
minuten die de gebruiker niet heeft opgegeven. `DOELEN-SPEC` §3.3 zegt zelf dat het doel onder
circa vijf uur niet past en dat de coach dat hoort te zeggen (M40); §3.4 zegt hetzelfde vanaf zes
tot acht uur. Een week die te kort is hoort onder norm te lezen.

## 8. Het besluit

FASE 3c BOUWT PUNT (ii) EN NIETS ANDERS.

- (i) DE RITDUUR-SCHALING VERVALT. Gemeten grond: de efforts-arm van `klim_kort` zit met 30 al op
  het vo2-plafond 31 van de bibliotheek, hij draagt in elke tekort-cel een OVERSCHOT van 4
  minuten, en boven 135 minuten bestaat er geen bibliotheek-anker. `DOELEN-SPEC` §3.3 (iii) vraagt
  bovendien "dezelfde inspanningen laat in een lange rit" — de groei zit in de RIT, en die groeit
  al: `totaalMin` volgt de opgegeven dag.
- (iii) DE DOSIS-VERHOGING BIJ `klim_lang` WORDT GEPARKEERD. Ze is wél verankerd (3x14 is 42
  werkminuten, exact het drempel-plafond `threshold_long`), maar ze mikt op het doel met 13,8
  minuten tekort over 18 cellen en op een event zonder datum. Na (ii) is ze veilig te bouwen: de
  fit-poort schaalt dan mee naar `fixedNominal` 87 plus 30 is 117.
- (ii) WORDT GEBOUWD. De efforts-sessie mag alleen op een dag die haar draagt. De ondergrens wordt
  AFGELEID uit `effortsVorm` van het profiel (15 plus reps maal onMin plus reps maal rest plus 15,
  plus `minBase` 30) en nooit als literal geschreven — anders loopt hij weg zodra (iii) alsnog
  komt. Vandaag is dat 105 voor beide klim-profielen.
- HET EIGENLIJKE TEKORT KRIJGT EEN EIGEN PUNT: 17. De vraag is NIET "meer dosis" maar of de norm
  van 26 minuten per prikkel bereikbaar is voor een doel dat per `DOELEN-SPEC` §3.3 juist korte,
  harde sessies voorschrijft. LET OP: de norm naar het plan buigen is zichzelf meten — dezelfde
  val als het fase-quotum in fase 2. Eerst meten wat een sessie van 60 minuten in elke zone
  EERLIJK kan dragen, dan pas kiezen tussen bibliotheek en norm.

## 9. Acceptatie voor de bouw

- DE POORT IS AFGELEID, NIET GETYPT. Een grep op de literal 105 in `packages/engine/src` hoort
  niets nieuws op te leveren.
- ROOD PER TERM, vooraf gegrept op de eigen markering: met de poort eruit valt de
  overschrijdings-assertie op 105 tegen 60.
- BEGRENZING: precies 8 cellen bewegen en nul daarbuiten; kwaliteitsdagen blijven 3 in alle 135.
- DE WEEKEND-TAK KRIJGT DEZELFDE POORT, en die is via `buildWeekProposal` NIET rood te krijgen —
  hij levert dit type in 0 van de 135 cellen. Daar hoort een directe test op de tak zelf, met de
  reden erbij.
- GEEN SHOT: het geval zit in W3 en W4 en geen enkel harness-scenario draagt een klim-doel of
  fase Peak. Dat staat al in `HANDOFF.md` en is een grens op de eis, niet op de bouw.
