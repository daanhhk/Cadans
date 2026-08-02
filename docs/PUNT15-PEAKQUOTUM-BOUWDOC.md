# Punt 15 — het Peak-quotum: 3 voor klim_kort en ftp

Spec waartegen deze bouw plaatsvindt. `ROADMAP` punt 15 liet open of `kwaliteitPerWeek.Peak` 2
hoort te zijn of 3, en fase 3b hangt eraan. Deze ronde beslecht die vraag, en uitsluitend die.

## 1. De vraag

FASE 3b HANGT AAN HET QUOTUM. Bij quotum 2 valt de poortset voor `klim_kort` in Peak terug op
uitsluitend `anaeroob` zodra de efforts-band omhooggaat — precies de omkering die punt 14 wegnam:
het enige wat dan nog beoordeeld wordt is de zone die toch al klopt. Zolang die vraag open staat,
is elke bovendrempel-band voor dit doel onbeslisbaar.

## 2. Herkomst van het getal: PLAN, niet SIGNAAL

DE NORM VOLGT HET QUOTUM EEN-OP-EEN via `min(quotum, urenPrikkels)` in `blokDosisNorm`. Daaruit
volgt iets dat de hele bewijsvoering bepaalt: de geleverd/niet-geleverd-telling kan het quotum PER
CONSTRUCTIE niet beoordelen. Zet je het quotum hoger, dan stijgt de norm mee, en de telling meet
dan zichzelf. Dat zou een cirkel zijn.

DE BRON IS DUS `DOELEN-SPEC`, niet een reeks. Er valt hier niets te ijken, en er hoort geen
meetreeks bij gezocht te worden. Wat de metingen hieronder wél doen is het EFFECT begrenzen: laten
zien wat er beweegt en wat niet.

## 3. Grond per doel

`klim_kort` — §3.3 noemt DRIE ELEMENTEN per week: een korte-intervalsessie, een drempelsessie en
een groeiende lange rit. Zonder fase-clausule, en de intervalsessie én de lange rit zijn beschermd.
Base en Build dragen al 3; Peak 2 is de uitzondering zonder spec-grond.

`ftp` — §3.1 geeft een UREN-regel, ook zonder fase-clausule: twee sleutelsessies tot circa vier
uur, drie vanaf vijf à zes uur. Ook hier dragen Base en Build al 3 en is Peak 2 de uitzondering.

`klim_lang` (§3.4) en `conditie` (§3.5) BLIJVEN OP 2. Die maken de midweekse kwaliteit juist
RESIDU en noemen geen aantal, dus er is geen grond om ze te verhogen. `onderhoud` staat al op 3 en
wordt niet aangeraakt.

## 4. Gemeten — wat het extra slot levert

BIJ `klim_kort` IS DE SESSIE DIE ERBIJ KOMT IN 9 VAN DE 9 WEEKVORMEN EEN DREMPELSESSIE, met nul
anaeroob. Dat is precies het element dat §3.3 vraagt en dat bij quotum 2 wegviel.

BIJ `klim_lang` zou het extra slot in 8 van de 9 weekvormen ANAEROOB werk dragen, wat §3.4 niet
wil. MAAR DAT IS NIET HET QUOTUM: in Build levert quotum 3 bij datzelfde doel 0 anaerobe minuten in
9 van de 9. De oorzaak is `GOAL_FASE_MOD_.Peak` (vo2 +0,15, sweetspot -0,10), die de rangorde
omgooit. Aparte vraag, aparte ronde — en een tweede reden om `klim_lang` hier niet aan te raken.

## 5. Gemeten — het effect van de gebouwde variant

MEETOPSTELLING. Engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op 2026-07-27, meetruimte 5 doelen x 3 fases x 9 weekvormen =
135 cellen, gedraaid via `buildWeekProposal`. INSTRUMENT VOORAF GEVALIDEERD: Korte Peak V1 46,5
tegen 52, Korte Build 68,5 tegen 78, FTP Peak V1 70,0 — exact de fase-2-getallen.

BEGRENZING. 18 van de 135 cellen bewegen en 0 daarvan liggen buiten Peak: 9 bij FTP en 9 bij Korte
beklimmingen. `klim_lang`, `conditie` en `onderhoud` bewegen geen cel.

- Korte beklimmingen Peak V1: van 46,5 naar 68,5 werkminuten, van 2 naar 3 kwaliteitsdagen, en de
  poortset van tempo plus anaeroob naar tempo, drempel én anaeroob.
- FTP Peak V1: van 70 naar 78 werkminuten en van 2 naar 3 kwaliteitsdagen.

## 6. Wat Daan merkt, met een datum

ZIJN PEAK BEGINT 2026-08-24 — blokweken 9, 10 en 11. Op zijn eigen weekvorm ma45 di60 do60 za240
gaat FTP Peak van 39,9 werkminuten tegen een norm van 56 naar 62 tegen een norm van 84. ONDER NORM
AAN BEIDE KANTEN, dus de blok-uitkomst kantelt niet. Wat wél verandert is dat er een DERDE
kwaliteitsdag in de week staat.

## 7. Evaluatiepunt, met falsifier

TE TOETSEN OP 2026-09-21, wanneer de blok-terugblik het afgeronde mesoblok 9 t/m 12 draagt; lopend
al zichtbaar op 2026-09-14.

WAT DE KAART BESLIST: hoeveel van de drie voorgeschreven kwaliteitsdagen er in de drie Peak-weken
werkelijk gereden zijn. Levert hij er in twee of drie van de drie maar twee, dan was 3 te veel voor
zijn uren, en hoort het quotum terug of hoort doel-passendheid te spreken.

WAT DE KAART NIET BESLIST: of 3 beter is dan 2. De norm volgt het quotum, en dezelfde Peak wordt
nooit met 2 doorlopen, dus dat tegenvoorbeeld bestaat per constructie niet. Wie die vraag wél wil
beantwoorden heeft een andere opzet nodig dan deze kaart.

## 8. Wat er gebouwd wordt

8.1 `PROFILES.klim_kort.kwaliteitPerWeek.Peak` van 2 naar 3, met de grond (§3.3) in het commentaar
    en met de expliciete notitie dat dit PLAN is en niet op een reeks te ijken.

8.2 `PROFILES.ftp.kwaliteitPerWeek.Peak` van 2 naar 3, idem met §3.1.

8.3 GEEN ANDER PROFIEL WORDT GERAAKT. `klim_lang`, `conditie` en `onderhoud` blijven zoals ze zijn.

## 9. Acceptatie

- ENGINE-ZIJDIGE ASSERTIES in `selftest.test.ts` op ALLE VIJF de profielen — ook op de twee die
  NIET bewegen, anders kan de wijziging later stil uitwaaieren zonder dat iets rood wordt. Dit is
  een engine-wijziging, dus de dekking hoort daar te staan en de selftest-vloer stijgt mee.
- DE CLIENT-ZIJDIGE DRAGER BLIJFT. De test die vastlegt dat `blokDosisNorm` het FASE-QUOTUM leest
  en niet alleen de uren-drempel wordt HERIJKT op `Lange beklimmingen` — dat draagt na deze bouw
  als enige nog Base 2 / Build 3 / Peak 2, dus Build 3 tegen Peak 2 blijft daar meetbaar.
- DE UREN-DREMPEL BLIJFT DE BOVENGRENS, ONAANGERAAKT: Conditie bij 4 uur in Build blijft 2.
- EEN PLAN-ASSERTIE MET DE PRODUCENT IN DE LUS, via `buildWeekProposal` en nooit een handgezet
  object: drie dagen met kwaliteitsminuten, en `werkzoneLabelsVan_` over alle blokken van de week
  bevat `drempel`.
- ROOD PER TERM EN PER PLEK: `klim_kort` en `ftp` elk APART terug naar 2, met een grep op de eigen
  markering vóór het aflezen. Valt bij een term niets, dan is die term ongedekt of gemaskeerd:
  stoppen en melden.
