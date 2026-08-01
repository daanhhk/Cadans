# Punt 14 fase 2 — de vo2-slotverdeling: gemeten, niet gebouwd

Verdict-doc. Fase 2 stond open als ENGINE-werk met autorisatie-eis. De wat-als-meting die eraan
voorafging wijst naar NIET BOUWEN. Zelfde vorm als punt 5c: het mechanisme is niet beoordeeld op
zijn bereikbaarheid maar op zijn UITKOMST.

## 0. Meetopstelling

`apps/web/src/lib/proposal.ts` gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`,
`Date` gestubd op de fixture-maandag. Gemeten met `buildWeekProposal` — de functie die de app zelf
aanroept — over de zeven weekvormen van `weekvormAs.test.ts`. Plan-minuten gevouwen met
`planZone5_`, de norm uit `blokDosisNorm`, dus beide kanten op dezelfde indeling.

INSTRUMENT VOORAF GEVALIDEERD: de as reproduceert de vingerafdruk exact — kwaliteitsminuten
93 / 113 / 113 / 105 / 84 / 93 / 90, TSS 268 / 410 / 464 / 362 / 352 / 227 / 375, drie
kwaliteitsdagen op alle zeven. De instrumentatie-patch (logging in `goalPickIntent_`) is
gedragsneutraal: identieke vingerafdruk.

## 1. De rotatie is bij Onderhoud niet de bindende factor

GEMETEN, effectieve scores bij Onderhoud in Base: sweetspot 0,600 · drempel 0,550 · vo2 0,100.
De afstand tot plek twee is 0,45; de rotatie beslist daar niets. Drie mechanismen wijzen samen
dezelfde kant op en elk ervan is een besluit:

- `GOAL_FASE_MOD_.Base` zet vo2 op -0,10, dus 0,20 wordt 0,10.
- `vo2GateBase` in `goalPickIntent_` onderdrukt de coverage-boost voor vo2 in Base bij een
  weekvolume tot en met `BASE_POLAR_VOL_U0` = 9 uur.
- `PROFILES.onderhoud.volumeResponse` is `{ vo2Slope: 0, vo2Cap: 0 }`, dus ook boven 9 uur komt er
  geen volume-boost bij.

En de fase ligt vast: `effectiveMacroFase_` retourneert voor profiel-id `onderhoud` hard "Base".
GEMETEN over 14 opeenvolgende weken vanaf `doelStart` 2026-06-29: 14 van de 14 Base, keuzes elke
week sweetspot, drempel, sweetspot.

## 2. De wat-als: de derde soort forceren

INGREEP, de kleinste die M1 zou repareren: `goalWorkout_` geeft de laatste TWEE intents mee in
plaats van de laatste een, en `goalPickIntent_` ontwijkt die lijst. Daarmee komt de derde soort
gegarandeerd aan de beurt.

UITKOMST bij Onderhoud, per weekvorm V1 t/m V7, kwaliteitsminuten NU tegen WAT-ALS:
87 naar 71 · 102 naar 80 · 102 naar 71 · 87 naar 71 · 80 naar 65 · 87 naar 71 · 90 naar 80. ZEVEN
van de zeven omlaag. Kwaliteitsdagen blijven op 3 in alle veertien cellen. Drempel-minuten gaan van
61-72 naar 51-54, tempo van 19-39 naar 12-24, anaeroob van 0 naar 5 (vijf cellen) of 14 (twee).

FTP: 93 naar 74 · 113 naar 95 · 113 naar 86 · 105 naar 86 · 84 naar 69 · 93 naar 74 · 90 naar 83.
Conditie: gelijk aan Onderhoud. Korte en Lange beklimmingen zijn ONGEWIJZIGD — die dragen twee
keuzes per week, dus een vermijd-lijst van twee raakt ze niet.

## 3. Het oordeel keert om, en dat is de doorslag

De poort van fase 1 opent op het NOMINALE zone-label van het plan. GEMETEN: de wat-als introduceert
een anaeroob-label bij Onderhoud in 7 van de 7 weekvormen (nu: tempo+drempel, wat-als:
tempo+drempel+anaeroob) en bij FTP in 6 van de 7. Anaeroob gaat dan meedoen aan het oordeel — en
haalt zijn norm van 10 in twee van de zeven.

LEEST EEN EXACT VOLGENS PLAN GEREDEN WEEK ALS GELEVERD?
- Onderhoud: NU 7 van 7. WAT-ALS 0 van 7 — vijf cellen zakken op tempo en anaeroob, twee op tempo.
- FTP: NU 7 van 7. WAT-ALS 2 van 7 — vijf zakken op anaeroob.
- Conditie: NU 6 van 7. WAT-ALS 0 van 7.

Dat is precies het defect dat fase 1 heeft gerepareerd, opnieuw binnengehaald langs de PLAN-kant in
plaats van de norm-kant. De reparatie zou de coach een blok laten afkeuren dat exact volgens zijn
eigen plan is gereden.

## 4. Twee premissen uit `docs/PUNT14-BOUWDOC.md` paragraaf 3 zijn onjuist

EEN GEWICHT DAT SORTEERT IS GEEN GEWICHT DAT VERDEELT. `goalEffWeights_` normaliseert niet en
`goalPickIntent_` sorteert alleen op score; er bestaat geen mechanisme dat `intentGewichten` als
proportie uitdeelt. De lezing "vo2 0,20 bij drie kwaliteitsdagen is ruwweg een prikkel per twee
weken" volgt dus nergens uit de code.

DE DERDE SOORT IS NIET PER CONSTRUCTIE ONBEREIKBAAR. GEMETEN bij doel Onderhoud met een BEVESTIGDE
event-overname op 2027-03-22 (fase Peak): de week levert drempel, sweetspot EN vo2. Het mechanisme
staat in de log — aanroep 1 op 60 minuten geeft drempel 0,450 gelijk aan vo2 0,450 boven sweetspot
0,400 en de index-tiebreak kiest drempel; aanroep 2 op 120 minuten filtert vo2 als ONHAALBAAR weg;
aanroep 3 op 60 minuten geeft vo2 0,450 tegen drempel 0,350, want high is inmiddels gedekt en
anaerobic niet, dus de coverage-boost is van kant gewisseld. De 10800-combinatie-as van M1 houdt per
cel EEN dagduur en EEN dekking vast en kan het geval waarin de rangorde BINNEN de week verschuift
daarom niet bevatten.

## 5. Besluit

FASE 2 GAAT DICHT ZONDER BOUW. Geen engine-wijziging, geen autorisatie, geen migratie.

DE VO2-DECLARATIE VAN `PROFILES.onderhoud` BLIJFT STAAN. Hij is niet dood: in Peak levert
0,20 plus 0,15 een score van 0,35 en komt hij aantoonbaar aan de beurt. Dat pad is vandaag
bereikbaar via een bevestigde event-overname. Schrappen zou een levende term weghalen op grond van
een meting die alleen Base beslaat.

WAT ONDERHOUD IN BASE GEEN VO2 GEEFT IS DUS GEEN OMISSIE MAAR DE SOM VAN DRIE BESLUITEN, en het is
`DOELEN-SPEC` paragraaf 3.2-conform: beschermd is de FREQUENTIE, en de intensiteit die FTP draagt is
drempel en sweet spot. Een vo2-prikkel koopt daar 5 anaerobe minuten voor 16 tot 31
kwaliteitsminuten.

## 6. Wat hiermee NIET beantwoord is — de goedkope bereik-prikkel

DE INGREEP IS AFGEWEZEN, DE TRAININGSVRAAG NIET. Gemeten is een vorm: vo2 binnenhalen via de
rotatie, waarbij de prikkel een kwaliteitsdag VERVANGT. Niet gemeten is de vorm die TOEVOEGT in
plaats van ruilt: een handvol sprints aan het eind van een Z2-rit, of een korte set achter
sweet-spot-werk.

HET SJABLOON BESTAAT AL EN HEEFT NUL PRODUCENTEN. `combo_ss_sprints` (`planner.ts:2583`) bouwt
2x15 min sweet spot plus 6x15s all-out met volledig herstel, zonemap `["high","anaerobic"]`
(`zones.ts:342`), en staat in de downgrade-tabel (`planner.ts:1030`). GEEN ENKELE plek in de
codebase zet dat type. Hetzelfde voor `combo_z2_vo2` en `combo_all_three`; die laatste komt alleen
voor in `verlicht.test.ts`, waar hij met de hand als `voorgesteldType` wordt geinjecteerd — een test
die de uitkomst van de pijplijn zelf zet en de producent dus niet toetst.

TOEVOEGEN AAN DE ARCHETYPE-BIBLIOTHEEK LOST HET NIET OP. Alle 35 archetypes dragen `drempel`,
`sweetspot` of `vo2`, en `goalWorkout_` trekt er uitsluitend uit op een KWALITEITSSLOT. Een
sprint-archetype landt daar dus op een dag die anders een drempelsessie droeg — dezelfde ruil die
hierboven is afgewezen, alleen met een ander sjabloon. De toevoeg-route loopt over de DUURDAG, en
die wordt niet door de archetype-laag bediend maar door de generieke bouwers in `planner.ts`.

BIJ ONDERHOUD IS DIE ROUTE DRIEDUBBEL DICHT, gelezen in de bron: `PROFILES.onderhoud` draagt
`langeRitPerWeek: 0` en `spreiding.effortsInLangeRit: false`, en de weekend-tak die
`combo_long_with_efforts` zet eist `macroFase !== "Base"` terwijl `effectiveMacroFase_` voor dit
profiel per constructie "Base" teruggeeft. Dat verklaart de gemeten 0 anaerobe minuten in 7 van de 7
weekvormen langs een tweede, onafhankelijke weg.

DE HARDE RANDVOORWAARDE — DE NORM MOET MEE. De poort van fase 1 opent op het NOMINALE zone-label.
Een dag met sprints draagt een anaeroob label, dus de anaeroob-norm van 10 minuten gaat meedoen aan
het blok-oordeel; zes sprints van 15 seconden leveren 1,5 minuut. Zonder aanpassing zegt de kaart
dan opnieuw "niet geleverd" over een week die exact volgens plan is gereden — hetzelfde defect dat
fase 1 dichtte, nu uitgelokt door een prikkel van anderhalve minuut. De norm-vorm is afgeleid over
35 VOLWAARDIGE kwaliteitssjablonen en past per constructie niet op een prikkel van deze orde.

GEVOLG: dit is geen bibliotheek-uitbreiding maar een eigen punt, met drie te beslechten vragen —
langs welke route de prikkel binnenkomt (duurdag, niet kwaliteitsslot), hoe de norm een prikkel van
enkele minuten leest zonder hem als tekort te boeken, en of hij bij Onderhoud hoort of pas in de
opmaat naar korte beklimmingen. Zie `docs/ROADMAP.md` punt 16.
