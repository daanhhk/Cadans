# Punt 15 fase 2 — de meetlat kent het fase-quotum niet, en niets telt het totaal

Spec waartegen fase 2 gebouwd wordt. Fase 1 sloot het gat in de munt: de lange rit met efforts
declareert sinds `6a5620d` haar zones. Wat daarna zichtbaar werd is dat de MEETLAT zelf twee
gebreken heeft, en dat het tekort niet klim-specifiek is maar doel-breed en fase-gebonden. Deze
fase repareert de meetlat en raakt het plan niet.

## 1. Wat er gemeten is

Chat-zijde gedraaid: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27, A-race 2027-04-17. De fase
is gestuurd via `doelStart`: 2026-07-27 geeft Base, 2026-06-29 Build en 2026-06-01 Peak. MEETRUIMTE
5 doelen x 3 fases x 9 weekvormen = 135 cellen — de zeven vormen uit `weekvormAs.test.ts` plus W3
3,0u (ma60 wo60 vr60) en W4 4,0u (ma60 wo60 vr60 za60), die de uren-drempel LOS toetsen van de fase.

M0 — INSTRUMENT VOORAF GEVALIDEERD. De keten reproduceert de fase-1-uitkomsten exact: Build Korte
beklimmingen 72,4 en Lange 86,5, Peak Korte 50,0 en Lange 57,4, Base Korte 85,0 en Lange 82,4,
gemiddeld over de zeven weekvormen. NUL sessies zonder blokken over de hele meetruimte, tegen 28
voor fase 1.

M1 — HET TEKORT IS NIET KLIM-SPECIFIEK. Cellen onder de norm in fase PEAK: FTP 9 van 9, Conditie 9
van 9, Korte beklimmingen 9 van 9, Lange beklimmingen 7 van 9. In BASE: Conditie 9 van 9 en Lange
beklimmingen 5 van 9. Onderhoud 0 van 27 in alle fases. De premisse van punt 15 — "de twee
klim-doelen zakken" — is daarmee te smal: het is een FASE-verschijnsel dat vier van de vijf doelen
raakt.

M2 — DE WORTEL IS EEN QUOTUM DAT DE NORM NIET KENT. `kwaliteitPerWeek.Peak` is 2 bij `ftp`,
`conditie`, `klim_kort` en `klim_lang`; `blokDosisNorm` rekent 3 prikkels zodra `weekUren` >= 5. Op
weekvorm V1 in Peak valt bij ZOWEL FTP als Korte beklimmingen dezelfde derde kwaliteitsdag weg:
donderdag wordt "Z2 nuchter (Peak, ingekort)". FTP V1 gaat daarmee van 94,9 werkminuten in Build
naar 70,0 in Peak, Korte beklimmingen van 68,5 naar 46,5. De norm vraagt drie prikkels waar het
profiel er twee toestaat, dus het plan kan zijn eigen meetlat per constructie niet halen.

M3 — DE POORT VAN PUNT 14 VERLAAGT DE LAT EN NIETS TELT HET TOTAAL. In 98 van de 105 cellen van de
zeven-vormen-set is de som van de zone-normen BINNEN de poortset lager dan de totaalnorm. 24 van de
135 cellen lezen GELEVERD terwijl de werkminuten onder hun eigen totaalnorm liggen. Scherpste
geval: Korte beklimmingen in Peak, poortset tempo plus anaeroob, effectieve eis 34 tegen een norm
van 78 — 44 procent — en 9 van de 9 cellen GELEVERD op 46,5 tot 61,0 werkminuten.

DIT IS GEEN FOUT VAN PUNT 14. Die poort besliste WELKE zones meedoen, en dat besluit staat. Wat
niemand toen zag: de norm-massa van de zones die eruit vallen VERDAMPT, zonder dat iets dat merkt.

M4 — DE WAT-ALS DIE IS VERWORPEN. Norm-massa naar rato HERVERDELEN over de poortset: 92 van de 135
cellen geleverd wordt 46. Onderhoud zakt van 27 van 27 naar 18 van 27 en FTP Base van 7 van 9 naar
2 van 9 — precies het defect dat punt 14 fase 1 wegnam. OORZAAK: de poortset draagt NOMINALE labels
terwijl `planZone5_` PROPORTIONEEL splitst, dus de hele norm bij een label leggen eist minuten in
een zone waar het plan ze door bandoverloop niet legt.

M5 — DE WAT-ALS DIE IS AANGENOMEN. Poort ONGEWIJZIGD plus een TWEEDE, onafhankelijke eis op het
TOTAAL van de werkminuten, met een norm die het fase-quotum kent: 92 wordt 79 geleverd.

ROOD PER TERM, GEMETEN. De totaal-eis alleen laat 24 cellen kantelen; de quotum-correctie brengt er
11 terecht terug; netto kantelen er 13 naar niet-geleverd en 0 de andere kant op. Onderhoud blijft
27 van 27 en FTP kantelt in NUL cellen. Korte beklimmingen in Peak gaat van 9 van 9 geleverd naar 2
van 9.

DE 13 DIE KANTELEN: Conditie Base W3 en W4 (51,0 tegen 52) · Korte Base V2 (76,0 tegen 78) en V4
(70,0 tegen 78) · Korte Peak V1, V2, V4, V5 en V6 (46,5 tegen 52) en W3 en W4 (51,5 tegen 52) ·
Lange Base W3 en W4 (51,0 tegen 52).

DE 11 DIE DE QUOTUM-CORRECTIE TERECHT LAAT STAAN: FTP Peak V1 70,0 en V6 70,0 en V5 64,9, norm 84
naar 56 · Conditie Base V7 76,0 en Peak V3 55,5 en V7 57,0, norm 78 naar 52 · Korte Peak V3 61,0 en
V7 56,5 · Lange Base V1 72,0, V5 66,9 en V6 72,0.

M6 — WAT ER KLIM-SPECIFIEK OVERBLIJFT, EN DUS FASE 3 IS. Werkminuten PER KWALITEITSDAG: `klim_kort`
27,0 in Base, 23,0 in Build en 21,9 in Peak, tegen FTP 32,3 / 32,3 / 25,1 en `klim_lang` 36,0 /
27,5 / 25,1, bij een norm van 26 per prikkel. Op V1 in Build levert de zaterdag "Lange rit + Korte
beklimmingen efforts (120 min)" 30,0 werkminuten waar FTP op dezelfde 120 minuten 48,0 legt met
"Sweet spot 4x12", en levert "VO2 Hill Repeats 9x90s" van 60,5 minuten 16,5 waar "Drempel ladder
5-7-9" en "Drempel 2x12" van 60 minuten 22,0 en 24,9 leveren.

## 2. Het besluit

FASE 2 REPAREERT DE MEETLAT EN RAAKT HET PLAN NIET. Twee termen, allebei CLIENT: geen
engine-wijziging, geen migratie, geen nieuwe constante.

TERM 1 — DE NORM KENT HET FASE-QUOTUM. Het aantal prikkels wordt

    Onderhoud ? 3 : min(profiel.kwaliteitPerWeek[fase], weekUren >= PRIKKEL_UREN_DREMPEL ? 3 : 2)

De bestaande Onderhoud-tak blijft ONGEWIJZIGD staan en wordt daarmee een SPECIAAL GEVAL van
dezelfde regel: `DOELEN-SPEC` §3.2 zegt dat de FREQUENTIE het beschermde deel is — drie
kwaliteitsdagen, ook bij drie uur.

HERKOMST: PLAN. Het quotum staat in `PROFILES` en komt uit `DOELEN-SPEC`, niet uit een reeks. Er
wordt hier dus niets geijkt en er hoort geen meetreeks bij gezocht te worden.

DE FASE WORDT PER OPBOUWWEEK AFGELEID met `computeMacroPhase` op `doelStart` en de maandag van díé
week. P5 zegt dat die drie binnen een blok altijd gelijk zijn — het 12-weekse raster van
`computeMacroPhase` en het 4-weekse blokraster tellen allebei vanaf `doelStart`, dus de
opbouwweken vallen op 1-3 (Base), 5-7 (Build) of 9-11 (Peak) en alleen blokweek 4 van het derde
blok raakt Test. Dat wordt in de acceptatie GEASSERTEERD in plaats van aangenomen.

TERM 2 — ER KOMT EEN EIS OP HET TOTAAL. Naast het bestaande per-zone-oordeel op de poortset moet de
SOM van de werkminuten van die week de totaalnorm halen. De per-zone-poort blijft BYTE VOOR BYTE
zoals punt 14 hem maakte. De totaal-eis telt ALLE DRIE de werkzones, ook die buiten de poortset, en
lijdt daarom niet aan de bandoverloop die de wat-als van M4 om zeep hielp: hij legt geen norm bij
een LABEL, hij telt minuten.

## 3. Wat er in de weg zit — de invoer

`blokDosisNorm` heeft DRIE aanroepers, alle drie in `apps/web/src/lib/blok.ts`.

`buildBlokReferent` (`blok.ts:366`) draagt in zijn input-object wél `startMonday` maar GEEN
`doelStart`, dus de blok-fase is daar niet af te leiden uit wat de aanroeper al heeft. Zijn ENIGE
productie-aanroeper is `buildBlokReview` (`blok.ts:875`), en die draagt `doelStart` (`blok.ts:851`)
plus de `startMonday` uit `blokReviewVenster`. Eén niveau hoger staat het dus wel. De twee
aanroepers van `buildBlokReview` — `schema.ts:1473` en `Preview.tsx:576` — geven beide
`settings.doelStart` mee. `buildBlokReferent` krijgt daarom `doelStart` erbij, met dezelfde
motivering als `grenzen` en `weekplans`: VERPLICHT, niet optioneel, want een optioneel veld valt
bij een aanroeper stil weg en dan is het pad dood aan zijn INVOER.

`dosisTredeVoorstel` (`blok.ts:795` en `:796`) draagt `doelStart` (`blok.ts:764`) en
`weekMondayISO` (`:765`) al, en berekent op `blok.ts:792` zelfs al `blokStart` met
`blokStartVoorWeek`. De fase is daar dus af te leiden ZONDER een tweede afleiding te introduceren:
`computeMacroPhase` op diezelfde twee waarden. Aangeroepen vanuit `schema.ts:1524`.

`computeMacroPhase` is vandaag NIET geïmporteerd in `blok.ts` — het woord staat er alleen in een
toelichting op `blok.ts:86`. `profileForDoel_` is dat wel (`blok.ts:20`), dus het quotum is zonder
nieuwe koppeling bereikbaar.

## 4. Wat er gebouwd wordt

4.1 `blokDosisNorm` krijgt de MACROFASE als parameter en berekent `prikkels` met de regel uit §2.
    De Onderhoud-tak blijft letterlijk staan. `minPerPrikkel`, de bibliotheek-signatuur en de
    dosis-trede blijven ONGEWIJZIGD.

4.2 `buildBlokReferent` krijgt `doelStart` VERPLICHT in zijn input, leidt per opbouwweek de fase af
    met `computeMacroPhase(doelStart, weekMonday)` en voedt die aan `blokDosisNorm`.
    `buildBlokReview` geeft zijn eigen `doelStart` door; `schema.ts:1473` en `Preview.tsx:576`
    hoeven niet te wijzigen.

4.3 `dosisTredeVoorstel` leidt de fase af uit `doelStart` en de `blokStart` die hij op `blok.ts:792`
    al berekent, en geeft die aan beide `blokDosisNorm`-aanroepen. Geen tweede afleiding.

4.4 `BlokWeek` krijgt de TOTAAL-EIS. Naast `zonesOpNorm` en `zonesVoorgeschreven` komt er een
    expliciet veld dat zegt of de som van de werkminuten de totaalnorm haalt, en `geleverdOk`
    wordt de CONJUNCTIE van het bestaande per-zone-oordeel en die nieuwe eis. De regel op
    `blok.ts:479` luidt vandaag `telt ? zonesOpNorm === zonesVoorgeschreven.length : null` en draagt
    geen enkele eis op het totaal; dat is precies wat M3 blootlegt.

4.5 DE KAART toont waarop het oordeel viel. Een week die op de zones slaagt maar op het totaal
    zakt, moet dat kunnen laten zien — anders leest de gebruiker "2/2 zones op norm" naast een
    niet-geleverd-oordeel en spreekt de kaart zichzelf tegen, dezelfde fout die punt 14 fase 1c
    dichtte.

4.6 DE HARNESS KRIJGT EEN KLIM-SCENARIO. `tools/shots/shot.mjs` zet `OVERRIDES.doel` op `"FTP"` en
    geen enkel scenario overschrijft dat, dus geen enkele shot kan een klim-doel tonen — terwijl
    fase 2 het OORDEEL juist op die doelen omkeert en korte beklimmingen half februari 2027 het
    actieve doel wordt. Er komt een scenario `klim-kort` met doel "Korte beklimmingen" en blokweek
    1, zodat de blok-terugblik met de nieuwe eis in beeld komt.

## 5. Wat hier NIET in zit

- DE DOSIS ZELF (M6): de korte vo2-prikkel en de efforts-zaterdag leveren per kwaliteitsdag
  structureel minder dan de andere doelen. ENGINE, eigen ronde, eigen autorisatie. Dat is fase 3.
- DE VASTE TSS van `combo_long_with_efforts` — `Math.round(totaalMin * 0.85)` in plaats van
  `tssFromBlokken_` — en de efforts-band 85-92, die met haar midden op 88,5 nominaal `tempo` heet
  terwijl `DOELEN-SPEC` §3.3 voor dit doel BOVENDREMPEL vraagt. Beide horen bij fase 3.
- DE EVENT-OVERNAME, als BEKENDE GRENS en niet als omissie. `effectiveMacroFase_` kan de fase van
  het PLAN verzetten vanaf acht weken voor het hoofdevent; de norm volgt in fase 2 de DOEL-fase uit
  `computeMacroPhase`. Voor AGR 2027-04-17 valt die grens op 2027-02-22. Vanaf dat moment kunnen
  plan-fase en norm-fase uiteenlopen; dat is een eigen vraag met een eigen meting.

## 6. Acceptatie

- ROOD PER TERM EN PER PLEK. Draai term 1 en term 2 elk APART terug, draai de suite, noteer per
  term welke tests vallen. Grep na elke rood-patch op de eigen markering: een patch die niets
  RAAKT leest als een niet-gedekte term.
- ONDERHOUD KANTELT NERGENS. Assertie over de Onderhoud-cellen: het oordeel is identiek voor en na.
  Dat is de directe tegenproef op de wat-als van M4, die Onderhoud van 27 van 27 naar 18 van 27
  liet zakken.
- FTP KANTELT NERGENS. Zelfde vorm, en de scherpste toets op term 1: FTP Peak zakt op het totaal
  (70,0 tegen 84) en moet door de quotum-correctie terecht blijven staan (norm 84 naar 56).
- DE DRIE OPBOUWWEKEN VAN EEN BLOK DRAGEN DEZELFDE MACROFASE. Assertie over de blokken op
  `doelStart`-offsets die Base, Build en Peak raken, plus het geval waarin blokweek 4 op Test valt.
  P5 wordt daarmee getoetst, niet aangenomen.
- DE KETEN, MET DE PRODUCENT IN DE LUS. Bouw de week met `buildWeekProposal`, vouw met
  `planZone5_`, en voed dat aan `buildBlokReferent`. Nooit een handgezette `ProposalWeek`.
- EEN WEEK DIE OP DE ZONES SLAAGT MAAR OP HET TOTAAL ZAKT LEEST ALS NIET GELEVERD, en de kaart
  toont waarop het viel (4.5).

## 7. Stop-condities

7.1 KANTELT ONDERHOUD OF FTP ERGENS: niet bouwen, melden. Dat zijn de twee doelen waarvan gemeten
    is dat ze niet mogen bewegen — Onderhoud 27 van 27 en FTP 0 kantelingen — en een beweging daar
    betekent dat de ingreep iets anders doet dan de meting zegt.

7.2 BLIJKT EEN TERM NERGENS ROOD TE KRIJGEN: eerst vaststellen of een TWEEDE voorwaarde het geval
    al afvangt, en die los zetten, vóór je concludeert dat de term niet gedekt is. Term 1 en term 2
    kunnen elkaar hier maskeren: een cel die op het totaal zakt kan ook door het quotum al terecht
    zijn gekomen.
