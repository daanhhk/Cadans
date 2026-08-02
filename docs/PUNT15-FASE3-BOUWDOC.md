# Punt 15 fase 3a — de efforts-rit krijgt een hendel, en haar TSS gaat uit de blokken komen

Spec waartegen fase 3a gebouwd wordt. Fase 1 sloot het gat in de munt, fase 2 repareerde de
meetlat. Wat overblijft is de DOSIS zelf, en die valt uiteen in twee stukken: een sessie die per
constructie niet meegroeit met de dosis-trede of de mesocyclus, en een TSS die niet uit haar eigen
blokken komt. Deze fase raakt de ENGINE en verandert geen enkel karakter.

## 1. Meetopstelling

Chat-zijde gedraaid: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27, A-race 2027-04-17. De fase
is gestuurd via `doelStart`: 2026-07-27 geeft Base, 2026-06-29 Build en 2026-06-01 Peak. MEETRUIMTE
5 doelen x 3 fases x 9 weekvormen — de zeven uit `weekvormAs.test.ts` plus W3 3,0u (ma60 wo60 vr60)
en W4 4,0u (ma60 wo60 vr60 za60).

M0 — INSTRUMENT VOORAF GEVALIDEERD. De keten reproduceert fase 1 en fase 2 exact: Build Korte
beklimmingen 72,4 en Lange 86,5, Peak Korte 50,0 en Lange 57,4, Base Korte 85,0 en Lange 82,4; nul
sessies zonder blokken; en alle 13 kantelcellen uit `docs/PUNT15-FASE2-BOUWDOC.md` M5.

DE M6-NOEMER IS GERECONSTRUEERD. De werkminuten per kwaliteitsdag uit fase 2 M6 delen door DAGEN
MET WERKMINUTEN, niet door kwaliteitsdagen, gemeten over de zeven vormen — daarmee kloppen 27,0 /
23,0 / 21,9 en 32,3 / 32,3 / 25,1 op de decimaal. Dat is geen correctie op de conclusie van M6,
alleen op de leesbaarheid ervan.

## 2. M1 — de efforts-arm is een vaste 30

GEMETEN: `genericCombo` levert voor `combo_long_with_efforts` EXACT 30,0 werkminuten bij ritduur
90, 105, 120, 150, 180, 210, 240, 270 en 300 minuten. Alle extra tijd gaat naar de Z2-basis: 30
minuten bij een rit van 105, oplopend tot 225 bij een rit van 300.

Het gevolg staat in de weekvorm-as: V1 (zaterdag 120) en V4 (zaterdag 240) geven bij Korte
beklimmingen in Build IDENTIEK 68,5 werkminuten. Twee uur extra beschikbare tijd levert geen
minuut extra kwaliteit op.

## 3. M2 — er zit geen hendel op

GEMETEN: `mesoWeek` 1 tot en met 4 geven identieke uitvoer, en `genericCombo` krijgt `dosisTrede`
per constructie niet mee — `planner.ts` heeft één aanroep, in `buildWorkout`, en die geeft de trede
niet door.

DOOR DE VOLLEDIGE PIJPLIJN, fase Build, trede 0 tot en met 4:

- FTP V1: 95,0 / 101,9 / 108,2 / 115,1 / 121,4 — elke sessie beweegt mee.
- Korte beklimmingen V1: 68,5 / 71,0 / 73,6 / 76,1 / 79,5 — terwijl de efforts-zaterdag aan BEIDE
  uiteinden exact 30,0 staat. Wat er beweegt zijn de andere dagen.
- Lange beklimmingen: 76,0 tot 90,0, langs dezelfde lijn.

HERKOMST VAN DE EIS: PLAN. `DOELEN-SPEC` §3.3 (ii) zegt dat de dosis stijgt in het aantal
herhalingen. Er valt hier dus niets te ijken; de vraag is alleen langs welke as de groei loopt.

## 4. M3 — de TSS is de enige uitschieter

GEMETEN over de hele meetruimte: `combo_long_with_efforts` is de ENIGE sessie MÉT blokken waarvan
de gemelde `tss` afwijkt van `tssFromBlokken_` over diezelfde blokken. 36 van de 36 voorkomens
wijken af, gemiddeld +7,9, minimum +2 en maximum +18, en de fout GROEIT MET DE DUUR: +2 bij 105
minuten, +8 bij 150, +18 bij 240 en +26 bij 300.

Alle andere sjablonen met blokken staan exact 0 af. `renderVariant_` en `expandArchetype_` gebruiken
`tssFromBlokken_` al. Dit is dus geen ontwerpkeuze maar een overgebleven vast tarief.

## 5. M4 — de band

GEMETEN: 85-92 heeft haar midden op 88,5, afgerond 89, en heet daarmee nominaal `tempo`;
proportioneel gevouwen geeft 30 minuten tempo 21,4 plus drempel 8,6.

De bibliotheek zelf ter vergelijking: sweetspot 86-93 met 18 tot 69 werkminuten, drempel 95-108 met
16 tot 50, vo2 106-130 met 5 tot 28. De huidige band is dus SWEETSPOT, terwijl `DOELEN-SPEC` §3.3
bovendrempel vraagt en §3.4 aanhoudende blokken rond de drempel.

## 6. M5 — waarom klim_kort niet in deze fase meekan, gemeten en niet aangenomen

Wat-als met het eigen top-voorkeur-archetype per doel:

- `klim_lang` naar `threshold_long` (3x14 @95-102, r5, 42 werkminuten): Build 76,0 naar 88,0 tegen
  een norm van 78, en Peak 52,0 naar 64,0 tegen een norm van 52. ALLE 18 CELLEN halen hun norm.
- `klim_kort` naar `vo2_hill_repeats` (9x90s @112-118, r2, 13,5 werkminuten): Build 68,5 naar 52,0
  en Peak 46,5 naar 30,0 — een DALING van 24 procent, en de poortset in Peak zakt naar uitsluitend
  anaeroob.
- `klim_kort` naar `threshold_4x8_seiler` (4x8 @103-108, r2, 32 werkminuten): het totaal verandert
  nauwelijks (69 naar 71 in Build, 47 naar 49 in Peak), maar de poortset in Peak wordt OPNIEUW
  uitsluitend anaeroob — exact de omkering die punt 14 fase 1 wegnam.
- MET Peak-quotum 3 klopt het wél: Korte beklimmingen in Peak gaat van 47 tegen 52 met twee
  kwaliteitsdagen naar 71 tegen 78 met drie, en de poortset wordt anaeroob plus drempel.

CONCLUSIE: elke bovendrempel-band voor `klim_kort` hangt aan het PEAK-QUOTUM. Die vraag gaat dus
VOOR fase 3b. `klim_lang` hangt er niet aan.

## 7. Het besluit — fase 3a, twee termen, ENGINE, geen karakterwijziging

TERM 1 — DE HENDEL. `genericCombo` krijgt `dosisTrede` mee vanuit `buildWorkout`, en de WERKTIJD
van de efforts schaalt met `mesoFactor(mesoWeek)` maal `dosisTredeFactor(doel, dosisTrede)` — exact
het patroon van `expandArchetype_`. De band 85-92 blijft ONGEMOEID: karakter-invariant, alleen de
dosis beweegt (`DOELEN-SPEC` §2A).

MET RUIMTE-REM, EN DIE IS DRAGEND. De groei komt UITSLUITEND uit de Z2-basis en stopt zodra die op
`minBase` (30) staat — zelfde vorm als `addedWork = min(nominalWork x (f-1), room)` in
`expandArchetype_`. ZONDER die rem loopt de sessie bij een gevraagde 105 minuten door naar 120 en
vraagt de app méér tijd dan de gebruiker heeft opgegeven; dat is in strijd met `DOELEN-SPEC` §2A —
de gebruiker levert de TIJD, de app de INHOUD. GEMETEN zonder rem, mesoWeek 3: gevraagd 90 en 105
geven allebei 109,5 op trede 0 en 120,0 op trede 4.

TERM 2 — DE TSS. `tss` wordt `tssFromBlokken_(blokken)` in plaats van
`Math.round(totaalMin * 0.85)`.

NOTITIE VOOR FASE 3b, EXPLICIET. Term 1 rekt de LENGTE van de intervallen — 3x10 wordt 3x11,5 op
mesoWeek 3, en 3x15 op mesoWeek 3 plus trede 4 — en niet het AANTAL. Op de band 85-92 is dat
sweetspot-progressie, en dat is consistent met de hele bibliotheek, die overal lengte schaalt. Gaat
in 3b de band omhoog, dan verandert lengte het KARAKTER en moet de progressie naar het AANTAL
herhalingen; `DOELEN-SPEC` §3.3 (ii) zegt dat ook zo.

## 8. Begrenzing, gemeten

Trede 0 met mesoWeek 1: 0 van de 135 cellen bewegen. Over alle fases en trede 0 én 4: 0 van de 162
cellen BUITEN de twee klim-doelen bewegen.

Op trede 4 komt Korte beklimmingen in Build van 83,5 op 92,8 tegen een norm van 94,4, en in Peak van
55,5 op 64,8 tegen 68,0; Lange beklimmingen in Build van 100,4 op 109,7. Op mesoWeek 3 in Build:
Korte 77,1 naar 81,6, Lange 92,1 naar 96,6.

DE DELOAD-SPIEGEL GAAT MEEDOEN: op mesoWeek 4 zakt `intent.high` van 30 naar 18.

## 9. Wat hier NIET in zit

- DE BAND — dat is fase 3b.
- HET PEAK-QUOTUM, en dat komt VOOR 3b: M5 laat zien dat elke bovendrempel-band voor `klim_kort`
  eraan hangt.
- DE HERVERDELING VAN DE NORM.
- ALLES WAT DE MEETLAT RAAKT: fase 2 is af.

## 10. Acceptatie voor de bouw

- ROOD PER TERM. Draai term 1 en term 2 elk APART terug en noteer welke tests vallen. Grep na elke
  rood-patch op de eigen markering: een patch die niets RAAKT leest als een niet-gedekte term.
- ROOD OP DE RUIMTE-REM APART. Zet de rem uit en toon dat de sessie bij een gevraagde dag van 105
  minuten over die tijd heen loopt; met de rem niet.
- BYTE-IDENTIEK OP TREDE 0 EN MESOWEEK 1: `weekvormAs.test.ts` en `onderhoudInvariance.test.ts`
  onaangeraakt en groen.
- EEN BESTAANDE TEST WORDT HERIJKT, EN DAT IS GEEN VERZWAKKING. In
  `apps/web/src/lib/punt15.test.ts` pint de test "intent en tss zijn ONGEWIJZIGD — fase 1 raakt de
  inhoud van het plan niet" met `expect(wo.tss).toBe(Math.round(wo.totaalMin * 0.85))` precies de
  regel vast die fase 3a expliciet INTREKT. Hij gaat mee; de asserties op de zone-labels en op de
  blokken blijven staan.
