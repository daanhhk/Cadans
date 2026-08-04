# Punt 10 fase B deel 2 — verdict: NIET bouwen

Deel 1 gaf de WEEK een stem. Deel 2 zou daar een AANBOD aan hangen: "verschuif deze week de
minuten naar Drempel". Dat aanbod raakt de allocator en is dus ENGINE. Dit document legt vast
waarom het er niet komt, en welk defect de wat-als eronder vandaan haalde.

## 1. Meetopstelling

Chat-zijde gedraaid tegen `64e3c7e`. Engine plus client-lib gebundeld met esbuild buiten de
repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd met een PROXY op de echte constructor (geen
subclass — die breekt `instanceof`). De keten is die van de app zelf: `buildWeekProposal` naar
`deriveSchemaView` naar `bouwWeekTekort`; geen nagebouwd raster.

MEETRUIMTE 630 cellen: 7 weekvormen (V1, V2, V3, V4, V5, V7 uit `weekvormAs.test.ts` plus Daans
eigen ma45 di60 do60 za120) maal 5 doelen maal 3 fase-ankers maal 6 dagoffsets. Het plan-van-record
komt uit de maandag-run en gaat als weekplan-entries terug de volgende run in — precies wat
`persistWeekplan` wegschrijft.

PREDICAAT. Gemeten op de weekvorm-as met LEGE activities, dus elke verstreken trainingsdag is
GEMIST en de `different`-tak van `sleutelPrikkelOpen` komt er per constructie niet in voor. Dit is
niet de levende D1.

## 2. Het verdict — er is nergens iets te verschuiven

De weekstem vuurt in 119 van de 630 cellen, uitsluitend op dagoffset 4, 5 en 6 (20, 20 en 79).
Die 119 splitsen zonder rest in twee groepen.

- 75 CELLEN ZONDER ENIGE RESTDAG. Er is niet alleen geen dag met een plan, er is geen
  trainingsdag meer over: 75 van 75. De week is op, dus er valt per constructie niets te
  verschuiven.
- 44 CELLEN MET EEN RESTDAG, EN DAT IS ELKE KEER DEZELFDE SESSIE. In 44 van 44 is de resterende
  dag `combo_long_with_efforts`, de lange rit met efforts van de twee klim-doelen. Die dag
  schrijft in 44 van 44 minuten voor in minstens één van de gemelde tekortzones, en zijn nominale
  werkzone-label is in 44 van 44 `drempel`: 18,8 drempel plus 11,3 anaeroob bij Korte
  beklimmingen, 30,0 respectievelijk 32,4 drempel bij Lange beklimmingen, met 30,0 tot 32,4
  kwaliteitsminuten. Nul van de 44 restdagen draagt nul kwaliteitsminuten.

HET AANBOD ZOU DUS DREMPELWERK VERVANGEN DOOR DREMPELWERK. Nul van de 119 cellen waarin het iets
toevoegt. Zelfde vorm als punt 5c, en met dezelfde grond: niet "de tak is onbereikbaar" maar "de
uitkomst is geen verbetering".

GRENS VAN DEZE MEETRUIMTE. Gemeten is het aanbod in de toestand waarin de WEEKSTEM spreekt — daar
is het in `docs/PUNT10-FASE-B-BOUWDOC.md` paragraaf 2 en 6 aan opgehangen. Een aanbod dat MIDDEN in
de week zou vuren, vóór de prikkel weg is, is een ander mechanisme; dat is het dagblok van punt 5b,
en dat bestaat al.

## 3. Wat de wat-als eronder vandaan haalde

Die 44 cellen zijn precies de cellen waarin de app NU, live, een onware zin toont. De weekstem
meldt dat er geen trainingsdag meer staat om de prikkel op te pakken, terwijl er een zaterdag
staat met 30,0 tot 32,4 drempel-minuten erin.

DE WORTEL IS EEN STRING-TOETS. `combo_long_with_efforts` staat niet in `COACH_TYPE_INTENT_`, dus
`intentFromType_` valt door naar de terugval-scan en herkent daar "long" — uitkomst "duur", en
"duur" staat niet in `COACH_KEY_INTENTS_`. Daardoor ziet `openSleutelDagen` de dag niet en laat
poort 2 van de weekstem hem door.

HET SNIJDT BEIDE KANTEN OP. Een GEMISTE efforts-rit komt in 28 cellen voor; poort 1 telt hem in 0
van die 28 als open sleutelprikkel, want `plannedIntent` komt uit dezelfde classificatie.

DE TEGENPROEF. Toetst poort 2 op het nominale WERKZONE-label in plaats van op de typenaam, dan
zwijgt de stem in exact die 44 en gaan alle vijf de doelen naar 15 vuur-cellen — nu Conditie 15,
FTP 15, Onderhoud 15, maar Korte beklimmingen 37 en Lange beklimmingen 37. De 22 extra per
klim-doel zijn dus volledig artefact.

## 4. Het vindpatroon — één treffer, niet meer

Over de volle meetruimte levert de planner zes workout-types op. Per type de classificatie, de
werkzone-labels van zijn blokken en de hoogste kwaliteitsminuten:

- `combo_long_with_efforts` — duur, GEEN sleutel, label drempel, 32,4 min, 172 voorkomens.
- `long_z2` — duur, geen sleutel, geen werkzone-label, 0 min, 288 voorkomens.
- `pendel_z2` — duur, geen sleutel, geen werkzone-label, 0 min, 57 voorkomens.
- `sweet_spot` — sweetspot, sleutel, labels drempel plus tempo, 65 min, 459 voorkomens.
- `threshold` — drempel, sleutel, labels anaeroob plus drempel, 45 min, 536 voorkomens.
- `vo2max` — vo2, sleutel, label anaeroob, 22 min, 108 voorkomens.

`combo_long_with_efforts` is de ENIGE die een werkzone draagt en geen sleutelsessie heet. Latent
tweede geval: `combo_all_three` classificeert als "onbekend", maar punt 14 fase 2 mat dat dat
sjabloon nul producenten heeft, dus het kan niet voorkomen.

## 5. De fix — ROADMAP punt 27, CLIENT

EEN OPTELLENDE TERM OP DE SLEUTEL-TOETS, geen nieuwe classificatie. Een dag draagt een
sleutelprikkel als zijn TYPE dat zegt (bestaand) OF als zijn plan `drempel` of `anaeroob` minuten
voorschrijft. Strikt ADDITIEF: dit kan sleutelstatus alleen TOEVOEGEN, nooit wegnemen. Precedent
staat er al — `isKey` in `coach.ts` draagt sinds punt 5 dezelfde vorm, met dezelfde motivering.

TEMPO DOET NIET MEE. `COACH_KEY_INTENTS_` kent tempo niet, dus een tempo-label maakt een dag geen
sleuteldag.

`COACH_TYPE_INTENT_` WORDT NIET AANGERAAKT, en dat is een besluit. De rit duurt 120 tot 240
minuten waarvan 30,0 tot 32,4 werkminuten; hem hernoemen naar "Drempel" zou zijn karakter op de
dagkaart en in de gedaan-vergelijking verkeerd weergeven. De ENGINE blijft leeg in de diff.

DE BRON VAN DE LABELS IS `rauweBlokkenVan_` uit `zonelabels.ts`. Die leest de sessies en valt
terug op de bevroren `plannedForDone`, dus hij dekt de RESTERENDE dag én de GEMISTE dag met één
regel. `SchemaDay.planSessions` kan dit NIET leveren: `SchemaSession.blokken` is de render-vorm,
daar zijn `pctLo`, `pctHi` en het `zone`-label al weggevouwen. De rauwe blokken bestaan alleen op
`ProposalWeek`, en die is op beide aanroepplekken aanwezig — `weektekort.ts` heeft hem al als
input, `SchemaView.tsx` als prop.

TWEE PLEKKEN, want een guard die op één plek wordt toegevoegd ontbreekt op de andere. Poort 1 en
poort 2 van de weekstem (`weektekort.ts`) EN het dagblok van punt 5b (`SchemaView.tsx` naar
`SleutelInhaalBlok`) lezen dezelfde twee functies.

## 6. Rood per plek — de vier getallen die de bouw moet reproduceren

- TERM A WEG, weekstem: 119 vuur-cellen in plaats van 75.
- TERM A WEG, dagblok: rendert in 626 van de 4410 dag-cellen in plaats van 700.
- TERM B WEG, dagblok: rendert in 8 dag-cellen minder.
- TERM B OP DE WEEKSTEM IS INERT: 0 cellen waarin poort 1 nieuw opengaat, want daar stond al een
  andere gemiste sleuteldag. Dat is GEMETEN en geen gat; leg het vast, anders zoekt een volgende
  chat er een rood-test bij die niet bestaat.

## 7. Wat hier NIET in zit

- Het aanbod zelf. Gesloten, zie paragraaf 2.
- Elke wijziging in `packages/engine`. De classificatie blijft zoals ze is.
- De copy. Die gaat mee in de gezamenlijke coach-copy-ronde, ongewijzigd Daan-besluit.

## 8. Acceptatie voor de bouw

- Rood per plek en per term, elk apart teruggedraaid en GEMETEN, met de vier getallen uit
  paragraaf 6 als richtpunt. Grep na elke rood-patch op de eigen markering vóór je de uitslag
  leest.
- Het rapport noemt beide call-sites met bestand en regel, en de LEZER van de nieuwe waarde.
- CLIENT-ONLY: `git diff --stat HEAD~1 -- packages/engine` leeg. Geen migratie.
- Shot-harness: het scenario `klim-kort` staat op dagOffset 0 en kan de weekstem dus niet tonen.
  Een scenario met een klim-doel EN een verstreken gemiste dag EN de zaterdag nog vooruit kan dat
  wel — de GELEVERDE kant is hier nul, dus de bak-beperking van punt 15 geldt niet. Eerst een
  weggegooide warmloop, dan voor en na op dezelfde machine zonder werk ertussen; `v7/09-vorm` en
  `v7/10-trainingen` uitsluiten.
