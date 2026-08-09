# Punt 39 — plek-meting: waar de volumefactor landt

Chat-zijdige meetronde, 9 augustus 2026. Read-only kloon op
`b879ce1075b516004f95699df23c8641c1c8e8ee`, `buildWeekProposal` uit een esbuild-bundel,
`TZ=Europe/Amsterdam`, de klok als Proxy op de echte `Date`. Elke uitspraak hieronder is
GEDRAAID, niet gelezen. CC deed alleen de commit. Er is geen regel code aangeraakt.

## 1. IJking en meetruimte

Weekvorm-as opnieuw gedraaid: **21 van de 21** gepinde waarden gereproduceerd.

De (fase,meso)-as is AFGELEZEN en niet aangenomen: over zestien `doelStart`-offsets levert de
pijplijn **twaalf gekoppelde paren met periode 12**, deload is meso4. Meetruimte: volume-as
W1..W7 maal 4 doelen met mesocyclus maal 3 deload-paren (Base, Build, Test) — **84 cellen**.

Vergelijker in TWEE richtingen geijkt op de VINGERAFDRUK (archetype, sessieduur, TSS, zone,
band en blokminuten per sessie): A/A patch-nul **84 van de 84 identiek** aan beide kanten,
tegenrichting **0 van de 84**.

EEN GAT IN HET EIGEN INSTRUMENT, GEVONDEN EN GEREPAREERD VOOR ER IETS OP GEBOUWD WAS. De
eerste vingerafdruk las het blokveld als `min` en het sessieveld als `type`; beide bestaan
niet — het zijn `minuten` en `focus`. Elke blokduur stond daardoor als `undefined` in elke
reeks, consistent aan beide kanten, dus de vergelijking bleef formeel geldig maar was BLIND
voor precies de dosis. Alle uitslagen hieronder zijn NA de correctie opnieuw gedraaid en
hielden stand.

## 2. De VOOR-staat reproduceert M80

Deload tegenover de opbouwweek ervoor, volume: **100 / 100 / 100 / 95 / 97 / 92 / 88** over
W1..W7 (alle drie de paren), en 100 / 100 / 100 / 96 / 98 / 94 / 89 op Base+Build.

EEN CEL-FAMILIE DIE HET PUNT NIET NOEMDE: het Test-paar levert **28 van de 84** cellen met
NUL kwaliteitsdagen. `kwaliteitPerWeek` draagt alleen Base, Build en Peak, dus bij macrofase
Test is het quotum 0 en keert `allocateQualityWeek_` meteen terug. De acceptatie-eis
"kwaliteitsdagen ongewijzigd op 1" is daar per constructie onhaalbaar; op Base+Build (56
cellen) staat hij wel exact op 1.

## 3. Er zijn geen twee plekken maar drie

De bouwspec noemde twee kandidaten. De KEUZE valt echter op TWEE plaatsen: `goalWorkout_` via
`draagkracht_` binnen `allocateQualityWeek_`, en `keyIntensity` in de dag-loop. "Engine, voor
de bouwers" is daardoor ambigu, en het verschil is dragend.

- **PLEK A** — client-side op `sessieMin` (`apps/web/src/lib/proposal.ts:619`).
- **PLEK B** — engine, NA de allocator en voor de dag-loop.
- **PLEK C** — engine, VOOR de allocator.

GEMETEN: A tegen B is **84 van de 84 identiek**. Plek B raakt de keuze dus net zo min als de
client-patch, want de allocator heeft dan al gekozen. Alleen plek C beweegt de keuze.

## 4. Plek C haalt de curve en schendt M76

Reeks: A en B **76 / 75 / 72 / 63 / 56 / 56 / 56**, C **75 / 75 / 71 / 63 / 55 / 55 / 55**.

A tegen C: **43 van de 84 identiek, 41 afwijkend — alle 41 op de ARCHETYPE-KEUZE en NUL op
alleen duur.**

HET KARAKTER-OORDEEL STAAT OP DE BAND (M81), niet op het type-label. Werkband van de
kwaliteitsdag over de 56 Base+Build-cellen, tegenover de referentie: **plek A 56 van de 56
identiek, plek C 25 van de 56**. Bij C kantelt de werkband in **31** cellen, waarvan **7** over
een zone-klasse-grens: `threshold_ladder_kort` (100-100) wordt `threshold_2x8` (98-105), en op
W1 gaat 120-125 naar 98-105. Dat is de herstelweek die het karakter verandert, en dat is exact
wat M76 verbiedt.

HET weekV-NEVENEFFECT IS GEISOLEERD EN NIET DRAGEND. Plek D — C met `weekV` vastgezet op de
originele uren — geeft dezelfde reeks en dezelfde kwaliteitsminuten. Het duurband doet het
werk, niet de volume-adaptieve intent-weging.

## 5. Waar de krimp bij plek A landt

Over de 56 Base+Build-cellen krimpt ELKE sessie in duur: de kwaliteitsdag in 56 sessies
(**-1298** minuten) en de overige in 208 sessies (**-8072** minuten). **86 procent van de
volumekrimp komt uit de niet-kwaliteitsdagen**, terwijl de werkband en de werkMINUTEN van de
prikkel exact gelijk blijven aan vandaag. Dat is M79, M86 en M76 tegelijk.

## 6. De drie genoemde vloeren bijten geen van drieen

Over 264 sessies onder plek A: **0** Recovery-sessies op de 60-cap, **0** op de 30-vloer, **0**
`genericLongZ2` op de 60-vloer. De warm/cool-trim bij `mins <= 75` wordt in **192 van de 264**
sessies actief, maar dat is een herverdeling BINNEN de sessie en geen rem op het volume.

DE 1 PROCENTPUNT KOMT ERGENS ANDERS VANDAAN. Gevraagd (dagminuten maal factor) **16728**
minuten tegen geleverd **16877** — **+0,9 procent**, systematisch, doordat de gebouwde
sessieduur iets boven de opgegeven duur uitkomt. Daarmee is de acceptatie-eis uit
`docs/PUNT39-DELOAD-RECON.md` §7 niet haalbaar zoals hij staat: die reeks hoort bij plek C.

## 7. Begrenzing

Op twee assen. De weekvorm-as (mesoweek 1) geeft onder plek A EN onder plek C **21 van de 21**
gepinde waarden. De opbouwweken op de volume-as staan bij ALLE patches op **84 van de 84**
identiek aan de referentie.

## 8. Het defect dat deze ronde blootlegde: de factor kent zijn referentie niet

GEMETEN op vijf dagen van een uur, doel FTP. Vandaag levert de herstelweek 5 ritten van 60
minuten — **300 van de 300** beschikbare minuten, met de prikkel gehalveerd van 24,2 naar 12,6
werkminuten. Met plek A wordt dat 5 ritten van 45, **225** minuten, prikkel onveranderd op
12,6.

MAAR DE FACTOR LANDT OP DE INGEVULDE WEEK, EN DAAR STAPELT HIJ. Gemeten, alle drie in dezelfde
herstelweek: 5x60 ingevuld geeft 5 ritten van 45 (225 min); 5x45 ingevuld geeft 5 ritten van
**34** (170 min) met de kwaliteitsminuten van 13 naar **10**; 3x60 ingevuld geeft 3 ritten van
45 (135 min). Wie in zijn herstelweek toevallig drie uur heeft in plaats van zijn gebruikelijke
vijf, krijgt dus **2 uur 15** terwijl die drie uur al 60 procent van zijn normaal is — precies
de band die M79 vraagt, dus er hoefde niets meer af.

DE BRON VOOR EEN REFERENTIE BESTAAT, MAAR DE APP HEEFT HEM NIET IN HANDEN. `planner_days`
(`workers/api/src/db/schema.ts:128`) draagt `minuten` per (user_id, datum) en houdt de
ingevulde beschikbaarheid van eerdere weken vast. De client haalt echter EEN week op:
`GET /api/planner/:monday` (`apps/web/src/lib/api.ts:79`). De weekplan-blob draagt wel
meerdere weken, maar zijn `minuten` is `Math.round(sumMin)` over `s.totaalMin`
(`apps/web/src/lib/weekplanBlob.ts:118` en `:168`) — de GEBOUWDE sessieduur, dus het vorige
voorstel van de app en niet de invoer van de gebruiker; dagen zonder sessies vallen bovendien
weg. De blob is ongegate leesbaar: `recencySeedEntries` (`apps/web/src/lib/proposal.ts:523`)
doet het al, en `PLAN_ADAPTATION_ENABLED = false` (`apps/web/src/lib/planFlags.ts:28`) gate't
uitsluitend `intentByDateFrom`.

## 9. Bouwspec, herzien

DE PLEK IS PLEK A — client-side op `sessieMin`. Geen engine-wijziging, dus geen
engine-autorisatie. De grond is M76 en die staat boven een acceptatie-getal uit een recon-doc.

PENDELDAGEN KRIMPEN NIET MEE. Grond: `DOELEN-SPEC` §2A — de pendel is een VERPLAATSING en geen
trainingskeuze. UITDRUKKELIJK ONGEMETEN: de volume-as draagt geen pendeldagen. Dit gaat als
expliciete regel de bouw in, niet als bevinding.

DE ACCEPTATIE-EIS IS HERIJKT en luidt: reeks **76 / 75 / 72 / 63 / 56 / 56 / 56**;
kwaliteitsdagen ongewijzigd — 1 op Base en Build, 0 op Test; werkband van de kwaliteitsdag
identiek aan de referentie in 56 van de 56; opbouwweken 84 van de 84 identiek; weekvorm-as 21
van de 21.

DE REFERENTIE-TERM IS PUNT 45 EN HOORT IN DEZELFDE BOUW. Zonder haar doet de regel in een
alledaags geval — drukke week valt samen met de herstelweek — aantoonbaar het verkeerde. De
bouwronde MEET EERST welke bron bruikbaar is, en de twee kandidaten sluiten elkaar niet uit:
het ophaalpad verbreden zodat `planner_days` meerdere weken levert, of de weekplan-blob lezen
zoals de recency-seed dat al doet. De eerste is zuiver (invoer van de gebruiker, M28), de
tweede goedkoop (de app meet zich aan zijn eigen vorige voorstel).

<!-- EINDE docs/PUNT39-PLEK-RECON.md -->
