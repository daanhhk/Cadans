# Punt 15 fase 3b — de efforts-band wordt doel-specifiek, en de dosis beweegt niet mee

Spec waartegen fase 3b gebouwd wordt. Fase 1 sloot het gat in de munt, fase 2 repareerde de
meetlat, fase 3a gaf de sessie een hendel. Wat overblijft is de BAND, en de meting hieronder
verplaatst wat die fase kan zijn: een KARAKTER-correctie, geen dosis-correctie. ENGINE.

## 1. Meetopstelling

Chat-zijde gedraaid: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27, A-race 2027-04-17. Fase
gestuurd via `doelStart`: 2026-07-27 Base, 2026-06-29 Build, 2026-06-01 Peak. MEETRUIMTE 5 doelen
x 3 fases x 9 weekvormen — de zeven uit `weekvormAs.test.ts` plus W3 3,0u (ma60 wo60 vr60) en W4
4,0u (ma60 wo60 vr60 za60). De wat-als loopt via een geparametriseerde kopie van de efforts-arm;
met de defaults is die kopie byte-identiek aan HEAD.

M0 — INSTRUMENT VOORAF GEVALIDEERD, op de zeven vormen: Build Korte beklimmingen 72,4 en Lange
86,5, Peak Lange 57,4, Base Korte 85,0. Korte Peak V1 68,5 werkminuten met 3 kwaliteitsdagen en
poortset tempo plus drempel plus anaeroob — de uitkomst van het Peak-quotum.

## 2. M1 — DE BAND RAAKT DE DOSIS NIET

Over Build en Peak, 9 weekvormen, 18 cellen, doel Korte beklimmingen. Gemiddelde werkminuten en
het aantal cellen dat zijn totaalnorm haalt:

- huidig 3x10 @85-92 r5 (30 werkmin): 71,5 · 8 van 18 · poort anaeroob+drempel+tempo
- 5x6 @100-108 r3 (30): 71,5 · 8 van 18 · poort anaeroob+drempel
- 6x5 @100-108 r3 (30): 71,5 · 8 van 18 · poort anaeroob+drempel
- 10x3 @105-115 r1,5 (30): 71,5 · 8 van 18 · poort anaeroob+drempel
- 8x3 @105-115 r2 (24): 65,5 · 6 van 18
- 6x4 @103-112 r2 (24): 65,5 · 6 van 18

ELKE band met dezelfde werk-som geeft IDENTIEKE werkminuten in alle 18 cellen. Wat verschuift is
uitsluitend de zone-verdeling: op V1 in Build gaat tempo van 25,5 naar 4,0, drempel van 29,6 naar
39,8 en anaeroob van 13,5 naar 24,8, bij een ongewijzigd totaal van 68,5. Alles boven Z2 telt als
werk, dus een band verplaatst massa en maakt er niets bij.

GEVOLG VOOR DE FASE-AFBAKENING: 3b kan het resterende tekort van punt 15 per constructie niet
oplossen. De premisse "de band hoort bij de dosis-fase" is hiermee weerlegd; wat blijft staan is
de SPEC-grond, en die is dwingend genoeg — `DOELEN-SPEC` §3.3 vraagt voor `klim_kort`
herhaalbare BOVENDREMPEL-blokken en §3.4 voor `klim_lang` aanhoudende blokken ROND DE DREMPEL,
terwijl beide doelen vandaag dezelfde sweetspot-band 85-92 krijgen.

## 3. M2 — DE SESSIE SCHAALT NIET MET DE RITDUUR

V1 (zaterdag 120) en V4 (zaterdag 240) geven bij Korte beklimmingen in Build IDENTIEK 68,5
werkminuten, met de efforts-arm aan beide uiteinden op exact 30,0. Fase 3a gaf een hendel op de
MESOCYCLUS en de DOSIS-TREDE, niet op de beschikbare tijd. `DOELEN-SPEC` §3.3 (iii) vraagt juist
inspanningen laat in een GROEIENDE lange rit. Dit is fase 3c, niet 3b.

De sessies bij V1 in Build: `VO2 Hill Repeats 9x90s` 60,5 min met 16,5 werkminuten · `Z2 + hoge
cadans` 59 min met 0 · `Drempel ladder 5-7-9` 60 min met 22 · de efforts-rit 120 min met 30.

## 4. M3 — DE SESSIE OVERSCHRIJDT DE OPGEGEVEN DAG, EN DAT BEGRENST DEZE FASE

In 4 van de 18 cellen per klim-doel — W3 en W4 in Build en Peak, weken zonder lange dag — wordt
de sessie 105 minuten terwijl de langste opgegeven dag 60 is. `totaalMin` is geankerd op
`fixedNominal`, dus zodra `fixedNominal + minBase` boven de gevraagde tijd ligt, loopt de sessie
eroverheen. Dat schendt `DOELEN-SPEC` §2A: de gebruiker levert de TIJD.

DIT BESTAAT AL en wordt in deze fase NIET gerepareerd (fase 3c). Het bepaalt wel de bovengrens:
een vorm met `fixedNominal` boven 75 vergroot het. GEMETEN met 8x5 r3 (`fixedNominal` 94): van 4
naar 20 cellen over de hele meetruimte, nu ook V1, V5 en V6 met 124 minuten op een dag van 120.
DAAROM BLIJFT DE NOMINALE WERK-SOM 30 EN DE NOMINALE VASTE TIJD 75.

## 5. M4 — DE RUIMTE-REM BREEKT ZODRA DE PROGRESSIE NAAR HET AANTAL GAAT

`DOELEN-SPEC` §3.3 (ii) vraagt progressie in het AANTAL herhalingen. Naief omgezet — het aantal
schaalt met f, `onMin` vast — zakt de Z2-basis door de vloer, want de rem uit fase 3a rekent
alleen op `nominalWork` en niet op de intra-rust die met het aantal MEEGROEIT.

GEMETEN op een gevraagde dag van 120 met 5x6 r3: mesoWeek 1 en 2 geven 5x6 met basis 45,
mesoWeek 3 geeft 6x6 met basis 36, en mesoWeek 3 plus trede 4 geeft 8x6 met een basis van 18 —
onder `minBase` 30. De huidige lengte-as houdt daar wél: mesoWeek 3 geeft 3x11,5 met basis 40,5
en trede 4 3x15 met basis exact 30.

TWEE UITKOMSTEN DIE JUIST GOED ZIJN. Op een gevraagde dag van 105 groeit er niets (5x6 met basis
30 op elke mesoWeek), want de basis staat al op de vloer — gelijk aan vandaag. En de deload
levert 3x6 is 18 werkminuten, exact wat de huidige vorm daar ook geeft.

## 6. M5 — KLIM_LANG, EN WAAROM DE DOSIS-WINST NIET MEEGAAT

Over Build en Peak, 18 cellen, doel Lange beklimmingen:

- huidig 3x10 @85-92 r5 (30 werkmin): 70,7 · 14 van 18 · poort drempel+tempo
- 3x10 @95-102 r5 (30): 70,7 · 14 van 18 · poort drempel+tempo — IDENTIEK
- 3x14 @95-102 r5 (42, `fixedNominal` 87): 82,7 · 18 van 18
- 2x20 @95-102 r8 (40, `fixedNominal` 86): 80,7 · 18 van 18

De laatste twee zijn een DOSIS-verhoging vermomd als bandkeuze, en ze tillen de overschrijding
uit M3 van 105 naar 117 minuten op een dag van 60. Ze horen bij fase 3c, samen met de
ritduur-schaling, zodat één ronde één grootheid beweegt.

## 7. M6 — BEGRENZING

FTP, Conditie en Onderhoud: 27 van de 27 cellen IDENTIEK bij elke gemeten variant.
`spreiding.effortsInLangeRit` staat alleen op de twee klim-profielen. MAAR de weekend-tak in
`buildWorkout` levert `combo_long_with_efforts` ook zonder die vlag, bij elk doel, zodra
`!dekking.high` en de fase niet Base is. De DEFAULT moet daarom de huidige vorm blijven.

## 8. Het besluit — drie termen, ENGINE, dosis-neutraal

TERM 1 — DE VORM WORDT DOEL-SPECIFIEK. Een OPTIONEEL veld `effortsVorm` op het profiel
(`packages/engine/src/archetypes.ts`), gelezen in `genericCombo` via `profileForDoel_(doel)` —
die normaliseert intern, dezelfde lijn als de `debtEnabled`-gate. ONTBREEKT het veld, dan geldt
de huidige vorm: reps 3, onMin 10, rest 5, band 85-92, as "lengte". Alleen de twee klim-profielen
krijgen het veld; de andere drie worden NIET aangeraakt.

- `klim_kort`: reps 5, onMin 6, rest 3, band 100-108, as "aantal". HERKOMST: PLAN, §3.3 —
  herhaalbare bovendrempel-blokken, dosis stijgt in het aantal. Nominaal werk 30, `fixedNominal`
  75: gelijk aan vandaag.
- `klim_lang`: reps 3, onMin 10, rest 5, band 95-102, as "lengte". HERKOMST: PLAN, §3.4 —
  aanhoudende blokken van acht tot dertig minuten rond de drempel, opgebouwd in tijd-in-zone.
  Nominaal werk 30, `fixedNominal` 75: gelijk aan vandaag.

TERM 2 — DE PROGRESSIE-AS. Bij as "lengte" blijft alles exact als in fase 3a. Bij as "aantal"
staat `onMin` VAST en schaalt het AANTAL herhalingen; de intra-rust groeit mee met het aantal.

TERM 3 — DE REM REKENT OP WERK PLUS RUST. De begrenzing wordt zo gesteld dat de Z2-basis nooit
onder `minBase` zakt, met de meegroeiende intra-rust verrekend. Op een gevraagde dag van 120,
mesoWeek 3 met trede 4, levert dat 6x6 met basis 36 in plaats van 8x6 met basis 18. Elke extra
herhaling kost daar 6 werk plus 3 rust is 9 minuten, en de ruimte is 15.

WAT NIET VERANDERT: `totaalMin`, `tss` (blijft `tssFromBlokken_`), de `blokken`-array-vorm, de
warmup 15 en het uitrijden 15, en de deload-spiegel.

## 9. Acceptatie voor de bouw

- ROOD PER TERM. Elke term APART terugdraaien en noteren welke tests vallen. Grep na elke
  rood-patch op de eigen markering vóór het aflezen: een patch die niets RAAKT leest als een
  niet-gedekte term.
- ROOD OP TERM 3 APART, en meet de Z2-BASIS, niet `totaalMin`. Zonder de herrekening zakt de
  basis op een gevraagde dag van 120 bij mesoWeek 3 plus trede 4 naar 18; mét de herrekening 36
  bij 6x6. `totaalMin` blijft in beide gevallen 120.
- DE DOSIS BEWEEGT NIET, en dat is de kernassertie van deze fase. Korte beklimmingen over Build
  en Peak: gemiddeld 71,5 werkminuten en 8 van de 18 cellen op norm, vóór én ná. Lange
  beklimmingen: 70,7 en 14 van de 18. Op V1 in Build blijft het totaal 68,5.
- DE POORTSET VAN KLIM_KORT VERLIEST `tempo`, en dat is BEDOELD. Assertie erop, met de
  zone-verschuiving op V1 in Build: tempo 25,5 naar 4,0, drempel 29,6 naar 39,8, anaeroob 13,5
  naar 24,8.
- GEEN NIEUWE OVERSCHRIJDING: `tooLong` in exact dezelfde 4 cellen per klim-doel als vandaag.
- BYTE-IDENTIEK VOOR DE ANDERE DRIE DOELEN. `weekvormAs.test.ts` en `onderhoudInvariance.test.ts`
  onaangeraakt en los groen. Een test die WEL wordt aangeraakt is een stopconditie, geen
  herijking: meld het en bouw niet door.
