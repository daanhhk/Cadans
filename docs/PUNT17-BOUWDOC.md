# Punt 17 — de uitvoerings-referent wordt PLAN-relatief

Spec waartegen gebouwd wordt. Chat-zijde gemeten op Cadans `add33bb`; CC bouwt hiertegen.

## 1. Meetopstelling en ijking

Engine plus munt-laag gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date`
gestubd als Proxy op de echte constructor (nooit een subclass). Meetset: 5 doelen maal 3
fase-blokken (Base 2026-06-29, Build 2026-07-27, Peak 2026-08-24, `doelStart` 2026-06-29) maal
9 weekvormen maal 3 dosis-treden (0, 2, 4) = 405 blok-cellen, 1215 beoordeelde opbouwweken, nul
cellen stil. Weken gebouwd met `buildWeekProposal`, entries met `buildWeekplanEntries`, oordeel
met `buildBlokReferent`.

IJKING VOORAF, achttien gepinde waarden exact gereproduceerd: FTP V1 Build plan 95 / 108,2 /
121,4 tegen norm 84 / 96 / 108; Korte beklimmingen 68,5 / 79,6 / 85,5 tegen 78 / 90 / 102; Lange
beklimmingen 76 / 87,4 / 99,3 tegen 78 / 90 / 102; bibliotheek-signatuur tempo 0,2821 drempel
0,5625 anaeroob 0,1554. IDENTITEITS-IJKING: onder "exact volgens plan gereden" is de geleverde
werktotaal gelijk aan de plan-werktotaal in 1080 van 1080 weken, grootste afwijking 2,8e-14.

LET OP BIJ HERGEBRUIK: weekvorm V5 draagt in deze meetset `pendelDuurMin` 80 en niet de 40 uit
`weekvormAs.test.ts`. De vergelijking tussen regels is daardoor onaangetast — alle regels zien
hetzelfde plan — maar de absolute waarden van V5 zijn niet die van de weekvorm-as.

## 2. De premisse van punt 17 is WEERLEGD

`HANDOFF.md` en `ROADMAP.md` punt 17 stellen dat NIET de per-zone-poort bijt maar de totaal-eis.
Gemeten is dat onjuist voor het doel waarvoor het punt bestaat. Bij Korte beklimmingen valt in
Build 37 van de 81 beoordeelde weken op BEIDE eisen en 15 op de ZONES ALLEEN, en nul op het
totaal alleen; in Peak dezelfde 37 en 15. Concreet op V1 in Build, trede 0, poortset
drempel+anaeroob: drempel 39,8 en 41,5 en 46,7 tegen een zone-norm van 44, dus twee van de drie
weken vallen op DREMPEL en niet op het totaal.

GEVOLG: de SMALLE wat-als — alleen de totaal-eis plan-relatief — tilt het geheel van 261 naar
275 van de 405 cellen en laat Korte beklimmingen op 36 van 81 staan, NUL kantelingen. Hij
repareert het doel niet waarvoor hij bedoeld was. Zesde correctie in de punt-15/17-lijn.

## 3. De vondst: de huidige regel laat GRIJS RIJDEN door

Zelfde meetset, blok gereden met een deel van drempel plus anaeroob verschoven naar tempo:

- 25 procent verschoven: de HUIDIGE regel leest 286 van de 405 blokken als GELEVERD.
- 50 procent verschoven: nog altijd 88 van 405.
- 0,7 maal elke werkzone gereden: 96 van 405 GELEVERD.
- 1,1 maal gereden, dus MEER dan voorgeschreven: 328 van 405 — 77 cellen lezen niet-geleverd
  terwijl er meer is gereden dan het plan vroeg.

DE OORZAAK IS DE SCHAAL VAN DE ZONE-NORM. `normTempo` is dosis maal 0,2821, een
bibliotheek-gemiddelde over alle 35 archetypes, terwijl het plan van die week doorgaans veel
minder tempo voorschrijft: V1 in Build bij Korte beklimmingen geeft 4,0 plan-tempo tegen een
normTempo van 22. Die speling is precies de ruimte waarin een echte kwaliteitsverschuiving zich
verstopt. De doel-brede norm is in de meeste cellen een te LAGE vloer en in enkele cellen een
ONBEREIKBAAR plafond, uit één oorzaak: hij is het plan niet.

## 4. De brede regel, gemeten

Regel: de voorgeschreven zones tegen de PLAN-minuten van die week, en het totaal tegen de
PLAN-werktotaal van die week.

- exact volgens plan gereden: 405 van 405 geleverd — het criterium van punt 17 gehaald.
- 1,1 maal gereden: 405 van 405.
- grijs 25 procent: 0 van 405. Grijs 50 procent: 0 van 405. Grijs volledig: 0 van 405.
- 0,7 maal gereden: 0 van 405.
- zwaarste kwaliteitsdag per week weggelaten: 0 van 405, tegen 3 van 405 vandaag.

Strikt strenger dan de huidige regel op ELKE gemeten faalmodus en haalbaar op de goede. DE VAL
UIT DE ROADMAP GELDT HIER NIET: "de norm naar het plan buigen is zichzelf meten" zou opgaan als
de referent beoordeelde of het PLAN goed genoeg is. Dat doet hij niet — dat is de EFFECT-vraag
en doel-passendheid. Een regel die in vier onafhankelijke faalmodi in 405 van 405 cellen omvalt,
meet zichzelf niet.

WELKE EIS WANNEER BINDT, gemeten per week: bij grijs 50 procent valt 1215 van 1215 weken op de
ZONES alleen; bij 0,7 maal op BEIDE; en in een scenario waarin de voorgeschreven zones exact
geleverd worden maar de bandoverloop-tempo niet, valt 615 van 1215 op het TOTAAL alleen. Beide
eisen zijn dus dragend; geen van de twee is redundant.

## 5. Het GAT dat mee moet

Een week zonder EIGEN bewaard plan heeft een plan-werktotaal van 0 en leest onder de nieuwe
regel TRIVIAAL geleverd: 405 van 405 zulke weken. Vandaag valt zo'n week via `poortHerkomst`
"blok" terug op de blokpoort en telt gewoon mee; die terugval bestaat aan de plan-kant niet.
REPARATIE: `telt` eist voortaan ook het eigen bewaarde plan van die week. GEMETEN KOSTEN: met
alleen de eerste twee opbouwweken bewaard blijven alle 405 cellen beoordeelbaar en gaat nul
cellen stil — dat is precies `BLOK_MIN_BEOORDEELBARE_WEKEN` 2, dezelfde minimum-bewijslast die
de blokpoort sinds punt 14 fase 1d al draagt.

## 6. Het ANKER in de coach-canon, met de grens

M63 (NORM) in `docs/TRAININGSMODEL.md`: het tekort is het VERSCHIL tussen wat bedoeld was en wat
geleverd is, naar rato bij een half uitgevoerde sessie. De referent is daarmee canoniek
PLAN-relatief. GRENS: M63 en M64 zijn voor de WEEK-laag geschreven; toepassen op de BLOK-check
is een UITBREIDING en geen citaat. Die uitbreiding is de eigen constructie van `DOELEN-SPEC`
paragraaf 2A, die de uitvoeringsvraag aan het blok toewijst met de woorden dat alleen het VENSTER
verandert en het GEBRUIK, niet het signaal. M5 draagt het gat uit paragraaf 5: zonder plan geen
bewering.

## 7. De bouw — drie termen, alle drie CLIENT

TERM A — DE PLAN-KANT PER WEEK. `buildBlokReferent` (`apps/web/src/lib/blok.ts`) leidt per week
uit de EIGEN bewaarde weekplan-entries van maandag tot en met zondag de plan-zoneminuten af met
`planZone5_` en dezelfde `grenzen` die de referent al meekrijgt. Dat is dezelfde bron waaruit
`poortsetVoorWeek_` de labels haalt; geen tweede vouwing en geen nieuwe leesroute. ONAFGEROND
doorgeven — afronden is presentatie.

TERM B — HET OORDEEL. De per-zone-eis vergelijkt de geleverde minuten van elke zone in
`zonesVoorgeschreven` met de PLAN-minuten van die zone in plaats van met `gevraagdTempo` c.s.;
de totaal-eis op regel 550 vergelijkt `werkTotaal` met de PLAN-werktotaal in plaats van met
`gevraagd`. De vergelijking draagt een tolerantie van 1e-6 minuut, want beide kanten komen uit
verschillende bronnen en een drijvende-komma-haar mag geen oordeel kantelen. De VELDEN
`gevraagdTempo`, `gevraagdDrempel`, `gevraagdAnaeroob`, `gevraagd` en `zoneRegels[].norm` gaan
mee naar de plan-waarden, zodat de kaart en het oordeel uit ÉÉN bron lezen —
`BlokReviewCard.tsx` regel 80 en 81 blijven ongewijzigd en tonen dan vanzelf de goede getallen.
De VELDNAMEN veranderen niet.

TERM C — DE POORT OP `telt`. Naast de bestaande voorwaarden eist `telt` dat deze week een EIGEN
bewaard plan draagt, dus `poortHerkomst` gelijk aan "week". `zonesVoorgeschreven` en de blokpoort
blijven ONGEMOEID: die dragen de LABELS en die terugval blijft geldig.

WAT NIET VERANDERT. `blokDosisNorm` blijft volledig bestaan en behoudt zijn huidige signatuur:
hij voedt `dosisTredeVoorstel` (`normNu`, `normStraks`, `minNu`, `minStraks`) en via
`dosisTredeFactor` het plan zelf. Hij zakt van RECHTER naar DOSIS-DOEL. `packages/engine` wordt
niet aangeraakt. Geen migratie, geen nieuwe constante, geen nieuwe drempel — er valt hier niets
te ijken, want er wordt geen signaal bemonsterd.

## 8. Rood per term, elk LOS te meten

R-A: de plan-kant vast op nul zetten. Verwacht: elke beoordeelde week leest geleverd, ook een
grijs gereden week — een test die grijs 50 procent op niet-geleverd asserteert valt.
R-B1: de per-zone-eis terug op de norm. Verwacht: de assertie dat een exact volgens plan gereden
Korte-beklimmingen-blok in Build GELEVERD leest, valt.
R-B2: de totaal-eis terug op `gevraagd`. Verwacht: dezelfde assertie valt, LOS gemeten met B1
weer op de plan-kant.
R-C: de `telt`-poort terug. Verwacht: de assertie dat een blok waarvan de derde opbouwweek geen
eigen plan draagt die week NIET meetelt, valt.
Elke patch VOORAF greppen op de eigen markering, en na een eventuele biome-run opnieuw meten.

## 9. Acceptatie

1. Een blok dat EXACT volgens plan gereden is, leest GELEVERD bij alle vijf de doelen in Base,
   Build en Peak, op dosis-trede 0, 2 en 4.
2. Een blok waarin de helft van drempel plus anaeroob naar tempo verschoven is, leest NIET
   GELEVERD in dezelfde cellen.
3. Een blok waarin 0,7 maal elke werkzone gereden is, leest NIET GELEVERD in dezelfde cellen.
4. Een week zonder eigen bewaard plan telt niet mee; draagt een blok twee opbouwweken met een
   eigen plan, dan spreekt de terugblik gewoon.
5. `git diff --stat HEAD~1 -- packages/engine` leeg, en `workers/api` eveneens.
6. De vloeren uit `HANDOFF.md` STAND regresseren niet; ze worden uit de suite gelezen.

## 10. Wat dit punt NIET doet

Geen bibliotheek-uitbreiding: die route is in de vorige ronde gemeten en afgewezen — het enige
vo2-sjabloon dat 31 werkminuten haalt is `vo2_sandwich`, met 8 werkelijke vo2-minuten verpakt in
20 tempo-minuten, en verdunnen gaat tegen `DOELEN-SPEC` paragraaf 3.3 in. Geen wijziging aan
`KWALITEIT_MIN_PER_PRIKKEL`; het herkomst-label van die constante blijft een open punt. Geen
copy-wijziging: die gaat mee in de coach-copy-ronde. Geen engine-wijziging.

PARKEREN, gemeten en niet dit punt: op dosis-trede 4 staat er bij Korte beklimmingen op weekvorm
V3 in 3 van de 960 gemeten dagcellen meer gepland dan de gebruiker opgaf, maximaal 3,8 minuten.
