# Punt 16 — recon en meting

Chat-zijdige leesronde, 7 augustus 2026. Read-only kloon op `54a2e64`, engine plus
`apps/web/src/lib` gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date`
gestubd met een Proxy op de echte constructor. Elke uitspraak hieronder is GEDRAAID, niet
gelezen. CC heeft alleen deze commit gedaan.

## 1. Drie premissen uit ROADMAP punt 16 houden niet stand

**(a) "`combo_ss_sprints` (`planner.ts:2583`) heeft een volledige bouwer" — ONWAAR, en het
regelnummer is gedreven.** De bouwer staat op `planner.ts:2777`. Mechanisch geteld over de
drie wees-combo's: 0 van de 3 dragen `blokken`, 0 van de 3 dragen `intent`, en alle drie
zetten hun TSS als `mins` maal een factor (0,9 · 0,9 · 0,95) in plaats van uit de blokken.
Dat zijn exact de drie dingen die punt 15 fase 1 en fase 3a elders hebben gerepareerd. Ze
nieuw leven inblazen zou drie bekende defecten terugbrengen. `combo_ss_sprints` draagt
bovendien een VASTE structuur van circa 82 minuten terwijl `totaalMin` de gevraagde dag
overneemt — de `tooLong`-familie.

**(b) "NUL producenten" — KLOPT.** Vier verwijzingen per type: de readiness-toets, de zonemap
in `zones.ts`, de downgrade-map in `planner.ts` en de bouwer. Geen enkele plek kent het type
toe.

**(c) "een anaeroob label opent de poort van punt 14 fase 1 en daarmee een norm van 10
minuten" — ACHTERHAALD door punt 17.** Er bestaat geen doel-brede norm meer; de referent is
plan-relatief (`planZonesVoorWeek_`, `blok.ts:447`) en de poortset komt uit de nominale
labels van de bewaarde entries (`poortsetVoorWeek_`, `blok.ts:402`). Het probleem is niet
weg maar VERPLAATST, en scherper — zie §3.

**(d) De duurdag is dicht, en STERKER dan het punt stelt.** `effectiveMacroFase_`
(`planner.ts:155`) geeft voor profiel-id `onderhoud` ALTIJD "Base" terug, dus de
`macroFase !== "Base"`-eis in de weekend-tak is per constructie permanent gesloten, niet
alleen 's winters. GEMETEN: 120 van de 120 Onderhoud-cellen dragen fase Base.

**(e) De route die het punt MIST: de vuldag.** De tussenruimte-regel (`midweekMinGap: 1`)
maakt zelf een Z2-dag zonder `archetypeId` en zonder enig werkzone-label. GEMETEN over 120
Onderhoud-cellen: 70 cellen dragen minstens EEN vuldag, 50 dragen er geen; 90 vuldagen
totaal, duur 45 / 59 / 60 (min / mediaan / max). Op Daans winter-vorm ma45 di60 do60 is dat
de dinsdag: 59 minuten, "Z2 + hoge cadans (Base, ingekort)", labels leeg. Dat is de
additieve aanhechtingsplek — en tegelijk de dag die `DOELEN-SPEC` §3.2 als herstel
beschermt.

## 2. Meetruimte

600 cellen: 5 doelen maal 10 weken maal 12 weekvormen (2 tot 5 trainingsdagen, 45 tot 120
minuten). Anaerobe plan-minuten per week, en of de anaerobe poort open staat:

- Onderhoud, Base: 120 cellen, poort open in 0, mediaan 0,0.
- FTP, Base: 48 cellen, poort open in 0. FTP, Peak: 72 cellen, open in 66, mediaan 5,0.
- Korte beklimmingen, Base: 48 cellen, open in 27, mediaan 8,4. Peak: 72 cellen, open in
  72, mediaan 21,9, maximum 28,8.
- Lange beklimmingen en Conditie, Base: 0 van 48 open. Peak: 54 van 72, mediaan 5,0.

De macrofase kwam in deze opzet op Base en Peak uit; BUILD is NIET bemonsterd. Wie deze
reeks uitbreidt, doet dat eerst.

## 3. De blokkerende meting

Wat-als: een sprintblok van 6x15s, dus 1,5 anaerobe werkminuut, op de vuldag; blok van vier
weken, doel Onderhoud, weekvorm ma45 di60 do60; gereden EXACT volgens plan met een schaal op
de anaerobe minuten. Gemeten met `buildBlokReferent` en `blokUitvoering` zelf.

- ZONDER sprints: poortset tempo, drempel. Geleverd 3 van 3 weken, bij elke schaal.
- MET sprints: poortset tempo, drempel, anaeroob. Gevraagd anaeroob 2 tegen een plan van
  1,5 — de meetlat vraagt 33 procent MEER dan het plan voorschrijft, want `Math.round(1,5)`
  is 2. Schaal 1,00 leest geleverd, 3 van 3. Schaal 0,95 — een tekort van 4,5 seconde —
  leest NIET geleverd, 0 van 3, tekortzone anaeroob.

Niet geleverd betekent: `dosisTredeVoorstel` geeft null en de dosis-trede kan niet stijgen.
Anderhalve minuut zet dus een heel blok stil.

## 4. De plateau-toets faalt

Grootste uitvoeringstekort dat nog GELEVERD leest, per prikkelomvang in werkminuten:

0,5 → 1% · 0,75 → 34% · 1 → 50% · 1,25 → 60% · 1,5 → 0% · 1,75 → 14% · 2 → 25% ·
2,5 → 0% · 3 → 16% · 4 → 12% · 5 → 10% · 6 → 8% · 8 → 6% · 10 → 5% · 12 → 4% · 15 → 3%.

Vijftien seconden verschil in prikkelomvang zet de tolerantie van 60 procent naar nul. De
nullen vallen op de halve minuut: daar rondt de eis OMHOOG en overstijgt hij per
constructie wat het plan voorschrijft. Boven 3 minuten is de reeks monotoon en nooit nul.
Elke omvang onder circa 3 minuten bemonstert dus afrondingsruis — WERKWIJZE, *een drempel
hoort op een plateau te liggen*.

## 5. Wat de bouwronde moet dragen

TWEE TERMEN, in EEN ronde. De vloer alleen is inert (zie §6) en dus vooruit-bedrading; de
prikkel alleen zet het blok-oordeel op een muntworp.

(i) EEN MATERIALITEITSVLOER OP DE POORTSET. Een werkzone komt pas in de poortset als het
plan er minstens N minuten van voorschrijft; daaronder is de zone informatief en niet
beoordeeld. ANKER: M64 (NORM) — alleen een betekenisvol tekort rechtvaardigt een ingreep —
UITGEBREID naar de blok-laag. Die uitbreiding is geen citaat: M64 is voor de week-laag
geschreven, precies zoals punt 17 dat voor M63 en M64 al verantwoordde. N wordt in de
bouwronde op het plateau geijkt, op de as "hoeveel blok-cellen kantelen van oordeel bij
welke N". NIET nu gekozen.

(ii) DE PRIKKEL. Een anaeroob blok in de generieke Z2-vuldag-bouwer, MET `blokken`, MET
`intent`, en met TSS uit `tssFromBlokken_`. De drie wees-combo's worden NIET gereanimeerd
(§1a); of ze worden opgeruimd is een aparte, kleine vraag.

DE CANON IS OPEN op de dragende trainingsvraag: geen enkele M-regel zegt of een
neuromusculaire sprintset met volledig herstel de herstelfunctie van de tussenruimte-dag
aantast. M67 verbiedt twee kwaliteitsprikkels tegen elkaar aan, maar noemt zo'n set niet.
Dat gat hoort in de bouwronde een M-regel te worden, niet in een chat te worden opgelost.

DE BOUW IS BIJ DOEL FTP INERT en dus niet te fotograferen — de shot-harness zaait de
plan-kant en dit hangt aan het doel. Dat is een grens op het BEWIJS, geen grond om te
wachten.

## 6. Waarom de vloer vandaag inert is

Over 1095 beoordeelde zone-cellen (poort open en plan groter dan nul) draagt GEEN ENKELE een
plan onder 3 minuten. Punt 16 zou de eerste maken.

## 7. Observatie, GEEN heropening van punt 17

De meetlat verdraagt hoogstens 0,5 minuut tekort per zone, en in 101 van de 1095 cellen
(9,2 procent) minder dan 0,05 minuut. Verdeling van de absolute marge: onder 0,05 → 101;
0,05 tot 0,10 → 8; 0,10 tot 0,25 → 121; 0,25 tot 0,50 → 154; 0,50 en hoger → 711. Op Daans
eigen weekvorm ma45 di60 do60 za120 bij doel FTP: Base week 1 drempel plan 69,00 eis 69
marge 0,50; week 2 plan 74,57 eis 75 marge 0,07; week 3 plan 79,40 eis 79 marge 0,90.

Dit is een eigenschap van het BEWUSTE nul-tolerantiebesluit van punt 17, niet iets dat punt
16 introduceert. Het staat op de parkeerlijst als waarneming met getal. Punt 17 wordt niet
heropend.
