# Punt 43 — de normpoort op het midpunt-label: meting, plateau en blokkade

Meetronde van 10 augustus 2026. GEEN bouw, geen verdict op de reparatie: dit document legt de
meetopstelling en de uitslagen vast zodat ronde 2 ze kan weerleggen of erop verder kan.

## 1. Instrument en meetruimte

Engine plus `apps/web/src/lib` gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`,
`Date` gestubd als Proxy op de ECHTE constructor (nooit een subclass — dat breekt `instanceof`).
Gebundelde ingangen: `buildWeekProposal` (`apps/web/src/lib/proposal.ts`), `planZone5_` en
`ZONE5_GRENZEN_DEFAULT` (`zonemunt.ts`), `werkzoneLabelsVan_` en `rauweBlokkenVan_`
(`zonelabels.ts`), `planDraagtSleutelzone_` (`sleutelinhaal.ts`).

IJKING VOORAF: de weekvorm-as uit `apps/web/src/lib/weekvormAs.test.ts` opnieuw gedraaid —
kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 / 352 /
227 / 375, kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. **21 van de 21 gepinde waarden
gereproduceerd.**

MEETRUIMTE: de weekvorm-as V1 tot en met V7 maal 5 doelen maal 12 (fase,meso)-paren —
**420 cellen, 1920 sessies, 13372 blokken, 39 distincte banden, 139462 blokminuten.**

De twaalf paren zijn AFGELEZEN en niet aangenomen: `doelStart` verschoven met stappen van zeven
dagen terug vanaf 2026-06-29 geeft over zestien offsets exact twaalf distincte paren met periode
12 — Build/meso1-4 op k=0..3, Peak/meso1-3 op k=4..6, Test/meso4 op k=7, Base/meso1-4 op k=8..11.
Dat reproduceert `docs/PUNT41-42-RECON.md` §2.

WAAROM DEZE AS EN NIET DIE VAN PUNT 40. Die ronde mat 140 cellen als 7 weekvormen maal 5 doelen
maal 4 EVENT-afstanden, en de event-as zet de macrofase niet — dat is in de punt-41/42-ronde
vastgesteld. De fase-as stond daar dus vast; hier staat ze open.

## 2. De premisse van punt 43 houdt stand, met eigen getallen

Van de **278 cellen met sweetspot-werk** labelt de poort er **146 uitsluitend `tempo`, 117
uitsluitend `drempel` en 15 beide**. Punt 43 noemde 48 / 33 / 9 van 90 op de smallere as; de VORM
is dezelfde — een meerderheid tempo, een substantieel deel drempel, een kleine rest beide.

DE PRIJS VAN DE HUIDIGE POORT IS GEMETEN: van de 31474 voorgeschreven WERKminuten vallen er
**3578 (11,4 procent) BUITEN de poort**. Dat is norm-massa die verdampt — het plan schrijft die
minuten voor en een tekort erin telt niet mee. Zelfde vorm als de verdamping die punt 14 fase 1
op de totaal-eis vond, nu op de zone-eis.

## 3. Negen banden raken meer dan één zone

Aandeel per zone, met de minuten over de hele meetruimte:

- `55-78` — z2 87 procent, tempo 13 — 1562 min — `threshold_ladder_kort`, `_2x12`, `_2x8`
- `55-80` — z2 80, tempo 20 — 1977 min — `vo2_microburst`, `vo2_hill_repeats`, `vo2_4x5`
- `50-68` — rust 28, z2 72 — 4411 min — geen werkzone
- `89-92` — tempo 33, drempel 67 — 4190 min — `sweetspot_4x12` — label `drempel`
- `100-108` — drempel 63, anaeroob 38 — 1344 min — label `drempel`
- `88-93` — tempo 40, drempel 60 — 2326 min — `sweetspot_long` — label `drempel`
- `103-108` — drempel 40, anaeroob 60 — 722 min — `threshold_4x8_seiler` — label `anaeroob`
- `73-77` — z2 50, tempo 50 — 1483 min — label `z2`
- `88-92` — tempo 50, drempel 50 — 5893 min — `sweetspot_3x8`, `_lage_cadans`, `_short` — label
  `tempo`

Grens 90 wordt door DRIE banden doorsneden, samen 12409 minuten (8,9 procent); grens 105 door
TWEE, samen 2066 (1,5 procent).

## 4. De aandeel-familie: sweep, richting en plateau

KANDIDAAT: laat een zone meedoen zodra ten minste een aandeel t van de blokminuten erin valt, in
plaats van op het midpunt-label. Bij t naar nul is dat "elke geraakte zone".

t GESWEEPT van 0 tot 50 procent, per procentpunt, over alle 420 cellen en alle 1496 dagen met
blokken. De overgangen:

- t 0 t/m 13 — 247 cellen breder, 0 smaller, sweetspot 278 van 278 consistent, 0 min buiten
- t 14 t/m 20 — 222 breder, 0 smaller, 278 van 278, 26 min buiten
- t 21 t/m 33 — 168 breder, 0 smaller, 278 van 278, 229 min buiten
- t 34 t/m 39 — 107 breder, 0 smaller, **197 van 278**, 1411 min buiten
- t 40 — 95 breder, 185 van 278, 1759 buiten
- t 41 t/m 50 — 87 breder, 161 van 278, 1959 buiten

TWEE UITKOMSTEN, en de eerste is een BEGRENZINGSBEWIJS. **Nul cellen en nul dagen worden
SMALLER, op de hele as.** De aandeel-poort is per constructie een superset van de midpunt-poort,
dus hij kan geen bestaand tekort VERBERGEN — hij kan alleen tekorten zichtbaar maken die nu
verdampen. Dat is precies de richting die punt 43 gemeten wilde zien voordat er iets gebouwd
wordt.

En er is een PLATEAU: **t 21 tot en met 33**, dertien procentpunt breed, waar de uitkomst op alle
vijf gemeten grootheden stilstaat en de sweetspot-splitsing volledig consistent is.

## 5. De blokkade — band `73-77`, en ze is structureel

`73-77` draagt aandeel z2 50 procent en tempo 50 — **exact hetzelfde aandeel als de
sweetspot-band `88-92`**. Herkomst gemeten: alle 1483 minuten komen uit sessies met de naam
`Z2 progressief (Base/Build/Peak, ingekort)`, zonder `archetypeId` en zonder `intentTag`. De band
ontstaat op `packages/engine/src/planner.ts:1377`, waar een structuur-rij met een enkel
percentage `pctLo: b.pct - 2` en `pctHi: b.pct + 2` krijgt: een blok op 75 procent FTP ligt dus
per constructie precies op de Z2/tempo-grens.

GEVOLG, GEMETEN OVER HET HELE PLATEAU: **105 van de 1496 dagen** krijgen een werkzone
UITSLUITEND via vulling-overloop, in **105 van de 420 cellen**, en in alle gevallen via `73-77`.
Het getal beweegt niet over t 21, 25, 30 en 33 — het is een eigenschap van de band, niet van de
drempel.

DAARMEE IS DE AANDEEL-FAMILIE UITGEMETEN EN NIET BRUIKBAAR ZOALS ZE STAAT. Elke drempel die
`88-92` consistent maakt laat een zuiver duurblok de tempo-poort openen; elke drempel die
`73-77` weert breekt `88-92`. De twee zijn op AANDEEL niet te scheiden, want hun aandeel is
identiek. Dat is geen keuze tussen waarden maar een grens op de grootheid.

## 6. Wat deze ronde NIET gemeten heeft

- `dosisTredeVoorstel` is NIET getoetst op meebewegen. Punt 43 vraagt dat expliciet als
  begrenzingsbewijs; het staat open voor ronde 2.
- Het EFFECT op een oordeel is niet gemeten, alleen het POTENTIEEL: de poort bepaalt waarover
  geoordeeld wordt, en de gemeten grootheid is welke voorgeschreven minuten binnen of buiten die
  poort vallen. Een uitspraak over geleverd-tegen-niet-geleverd vraagt de GELEVERDE kant, en die
  is in deze opstelling leeg gevoed.
- De weekvorm-as varieert de VORM bij ongeveer gelijk volume. De volume-as W1 tot en met W7 is
  niet gedraaid; over volume doet dit document dus geen uitspraak.

## 7. Verdict van deze ronde en de kandidaat voor ronde 2

VERDICT: het defect is bevestigd en gekwantificeerd, de voor de hand liggende reparatie is
gemeten en loopt vast op een band die geen aandeel-drempel kan scheiden. Er is deze ronde GEEN
reparatie gekozen en niets gebouwd.

DE KANDIDAAT DIE OVERBLIJFT poort op wat een blok BEDOELT te zijn in plaats van op waar zijn
midpunt valt. De bibliotheek draagt dat onderscheid al: `73-77` komt uit een naamloos
vulblok zonder `archetypeId`, `88-92` uit `sweetspot_*`. Dat scheidt precies de twee gevallen die
op aandeel samenvallen. M81 wijst dezelfde kant op — een karakter-uitspraak rust op wat het blok
voorschrijft, niet op het vakje waarin zijn midden valt.

DE ZONE-MUNT BLIJFT DAARBIJ ONGEMOEID, en dat is nu ook aan de bron getoetst: de zonegrenzen
komen uit intervals `power_zones` en staan bij de testcase op 55 / 75 / 90 / 105 — identiek aan
`ZONE5_GRENZEN_DEFAULT`, dus de app en intervals zijn het per constructie eens. De Sweet
Spot-band die intervals toont (84 tot 97 procent) is een OVERLAY en geen zone; hij loopt zelf
dwars over de Z3/Z4-grens. De grenzen staan dus niet verkeerd — de vraag is te grof, want één
label per blok kan niet uitdrukken dat sweetspot bewust over twee zones ligt.

<!-- EINDE docs/PUNT43-POORT-RECON.md -->
