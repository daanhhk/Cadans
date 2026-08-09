# Punt 41 + 42 — recon en meting: de weekmix over volume, en mesoFactor

Chat-zijdige leesronde, 9 augustus 2026. Read-only kloon op
`da9563bdbf99d7ebb91b22613c4ea5df6900d5da`, `buildWeekProposal` uit een esbuild-bundel,
`TZ=Europe/Amsterdam`, de klok als Proxy op de echte `Date`. Elke uitspraak hieronder is GEDRAAID,
niet gelezen. CC deed alleen de commit.

## 1. IJking en meetruimte

De weekvorm-as uit `apps/web/src/lib/weekvormAs.test.ts` opnieuw gedraaid: kwaliteitsminuten
93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375,
kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. **21 van de 21 gepinde waarden gereproduceerd.**

DE VOLUME-AS W1 TOT EN MET W7, hier expliciet vastgelegd omdat de reeks uit punt 41 NIET
reproduceerbaar was: die vormen staan nergens in de repo.

- **W1** 3,0u — ma45 wo45 za90
- **W2** 4,5u — ma50 wo50 vr50 za120
- **W3** 6,0u — ma60 wo60 vr60 za180
- **W4** 8,0u — ma70 wo70 vr70 za180 zo90
- **W5** 10,0u — ma75 di60 do75 za210 zo180
- **W6** 12,0u — ma90 di75 wo60 do90 za240 zo165
- **W7** 14,0u — ma90 di90 wo90 do90 za270 zo210

Meetruimte: 7 volumevormen maal 5 doelen maal 12 (fase,meso)-paren — **420 cellen, 1980 sessies,
14978 blokken, 42 distincte banden, 192674 blokminuten.**

## 2. De fase-as is de doelstart-as, niet de event-as — en dat corrigeert een aanname

GEMETEN: `macroFase` reageert NIET op de eventdatum. Over tien eventdata van 1 tot 38 weken bleef
`macroFase` op `"Build"`; alleen `fase` — de event-as — kantelde naar Taper op 1 week.

De grond staat in `effectiveMacroFase_` (`packages/engine/src/planner.ts:120`): de event-as wint
alleen bij Recovery, of binnen `EVENT_OVERNAME_WEKEN` **én** met `overnameBevestigd === true`.
Zonder bevestiging stuurt `computeMacroPhase` vanaf `doelStart`.

De bereikbare ruimte is daarmee precies TWAALF (fase,meso)-paren, cyclisch met periode 12:
Base/meso1-4, Build/meso1-4, Peak/meso1-3, Test/meso4. Base en Build dragen alle vier de
mesoweken; dat maakt punt 42 zuiver toetsbaar.

## 3. Instrumentcontrole — 208 blokloze sessies, en het is GEEN instrumentgat

208 van de 1980 sessies dragen geen blokken. Alle 208 heten Recovery (45, 50 of 60 minuten),
`archetypeId` null, `intent` null — samen 11960 minuten, **5,8 procent** van de sessieduur.

Ze zitten UITSLUITEND in mesoweek 4 (Base/meso4 60, Build/meso4 60, Test/meso4 88) en NOOIT bij
Onderhoud — dat doel draagt geen mesocyclus.

Hun intensiteit is AFGELEID uit de TSS in plaats van aangenomen: 45 min tss 16 geeft IF 0,462;
50 min tss 18 geeft 0,465; 60 min tss 21 geeft 0,458 — dus 46 procent FTP, ondubbelzinnig Z1. Ze
tellen mee als Z1 over hun volle duur.

Meegeteld of niet verandert de reeks met hoogstens 3 procentpunt; het verdict hangt er niet aan.
Beide varianten staan in §4.

Restpost: 28 sessies waar de som van de blokminuten 0,088 minuut van `totaalMin` afwijkt.
Afrondingsruis op de renderrand, geen gevolg.

## 4. Punt 41 — het plan polariseert niet, en het tegendeel gebeurt

TID per volume, opbouwweken (meso 1 tot 3), gepoold over 5 doelen en 3 fasen, Seiler-3-zone —
Z1 onder 80 procent FTP, Z2 80 tot 100, Z3 boven 100 — PROPORTIONEEL over de band:

3,0u **69/20/10** · 4,5u **73/20/8** · 6,0u **78/17/6** · 8,0u **82/12/6** · 10,0u **85/11/5** ·
12,0u **87/9/4** · 14,0u **89/8/3**.

DE METHODEKEUZE IS NIET DRAGEND, en dat is zelf gemeten. Midpunt, proportioneel en meerderheid
geven dezelfde reeks op hoogstens 2 procentpunt. Grond: van de 192674 blokminuten wordt op grens
80 **NUL** minuut doorgesneden en op grens 100 slechts **7921 (4,1 procent)**. M81 eist de band;
op DEZE grenzen valt de bandkeuze samen met het midpunt, anders dan bij het zone-raster van M82
(90 en 105).

Recovery meegeteld tegen niet, alle weken: 3,0u 75/17/8 tegen 73/18/9 · 8,0u 85/10/5 tegen
84/11/6 · 14,0u 91/7/3 tegen 90/7/3.

## 5. Geen variant-rotatie — de openstaande vraag van punt 41, beantwoord

Spanwijdte van het Z3-aandeel over de groepsgemiddelden: **DOEL 8,7 procentpunt (2,9-11,6),
VOLUME 6,9 (3,2-10,1), MACROFASE 3,8 (4,3-8,1), MESOWEEK 2,8 (4,6-7,4).**

Bij VASTE weekvorm, doel én fase beweegt Z3 over de mesoweken gemiddeld **0,9 procentpunt**,
maximum 3,3, over 91 groepen. De rotatie draagt de reeks dus NIET; de variatie is systematisch en
zit in doel en volume.

## 6. De eigenlijke vondst — de kwaliteitsdosis plafonneert

Absolute minuten per week, opbouwweken, gemiddeld over doel en fase:

- 3,0u — weekmin 180, Z1 125, Z2 37, Z3 18, **Z2+Z3 55**
- 4,5u — 270 / 196 / 54 / 21 / **74**
- 6,0u — 360 / 279 / 61 / 20 / **80**
- 8,0u — 480 / 392 / 58 / 30 / **88**
- 10,0u — 600 / 508 / 63 / 29 / **92**
- 12,0u — 720 / 627 / 68 / 26 / **94**
- 14,0u — 840 / 748 / 66 / 27 / **92**

Het weekvolume groeit met factor **4,67**, Z1 met factor **6,0**, Z2+Z3 met factor **1,67** — en
vanaf 8 uur staat Z2+Z3 stil. **Zes extra uren leveren nul extra kwaliteitsminuten.**

HET MECHANISME ZIT IN DE DAGEN, NIET IN DE DOSIS PER DAG. Trainbare dagen gaan van 3 naar 6; dagen
MET bovendrempelwerk blijven op 1,75 / 1,63 / 0,94 / 1,75 / 1,56 / 1,75 / 1,75. Z3-minuten per
zo'n dag: 10,4 / 12,6 / 16,7 / 17,4 / 18,3 / 14,9 / 15,2.

PREDICAAT, en het verschilt van de meetlat: "kwaliteitsdag" betekent hier een dag met minuten
BOVEN 100 procent FTP. De meetlat-as telt `intent.high` plus anaerobic en komt daarom op 3;
sweet-spot-werk op 89-93 valt in Z2 en telt hier niet mee. Twee predicaten, allebei correct, niet
uitwisselbaar.

## 7. Punt 42 — M78 reproduceert niet, in beide termen

Opzet: vergelijken BINNEN hetzelfde archetype, want een vergelijking over archetypes heen meet
variant-rotatie in plaats van modulatie.

**MESO-TERM:** over 200 groepen (weekvorm maal doel maal fase maal archetype) met minstens twee
mesoweken is de WERKBAND — het zwaarste blok van de sessie — identiek in **200 van de 200**. De
werkMINUTEN bewegen in **200 van de 200**.

**FASE-TERM:** over 197 groepen met minstens twee macrofasen is de werkband identiek in **197 van
de 197**.

DE FACTOR IS AFGELEZEN UIT DE WERKMINUTEN, niet aangenomen: meso2/meso1 ligt op 1,067 tot 1,083
(43x 1,067, 41x 1,080, 33x 1,083, 28x 1,075), meso3/meso1 op 1,150 in 115 van de 200 (57 procent),
meso4/meso1 op 0,600 in 54 van de 56 (96 procent). Dat is exact de gedocumenteerde
1,00 / 1,08 / 1,15 / 0,60; de spreiding is afronding op één decimaal bij korte blokken.

EEN EERSTE SIGNATUUR GAF 8 AFWIJKINGEN EN DIE WAREN GEEN PERCENTAGE-SCHALING. Ze betroffen het aan-
of afwezig zijn van een 65-65 vulblok bij `sweetspot_long_climb`, `vo2_hill_repeats` en
`threshold_2x20`; de werkbanden 89-93, 112-118 en 95-100 stonden in alle drie stil. Op de werkband
gemeten is het 200 van de 200.

## 8. Verdict

- **Punt 41:** het plan polariseert NIET bij hoger volume; Z3 daalt van 10 naar 3 procent. De
  rotatie-hypothese is weerlegd. Nieuw en niet in het punt voorzien: de absolute kwaliteitsdosis
  plafonneert vanaf 8 uur, en het plafond zit in het aantal kwaliteitsdagen. Dat wordt ROADMAP
  punt 44 en is COACH-CANON, geen meetuitkomst — "hoeveel kwaliteit hoort bij veertien uur" valt
  niet te ijken op deze reeks.
- **Punt 42:** M78 gaat op INGETROKKEN. Beide termen zijn weerlegd over de volle ruimte.
- **GEEN BOUW, GEEN ENGINE.** Er is geen letter code veranderd.
- **GRENS OP HET BEWIJS:** lege `activities`, `weekplans` en wellness; de levende D1 kiest via de
  recency-seed andere varianten binnen dezelfde duur-band. Dat verschuift welk sjabloon valt, niet
  de werkband — en de werkband draagt dit verdict.
