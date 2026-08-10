# Punt 43 ronde 2 — de herkomst-kandidaat is weerlegd, de monotone synthese haalt de eisen

Meetronde van 10 augustus 2026. GEEN bouw. Dit document weerlegt de kandidaat uit
`docs/PUNT43-POORT-RECON.md` §7 en legt de kandidaat vast die de eisen van punt 43 wél haalt.

## 1. Instrument en meetruimte

Engine plus `apps/web/src/lib` gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`,
`Date` gestubd als Proxy op de ECHTE constructor. Gebundelde ingangen: `buildWeekProposal`,
`ARCHETYPES` en `pctZoneBucket_`.

IJKING VOORAF: de weekvorm-as uit `apps/web/src/lib/weekvormAs.test.ts` opnieuw gedraaid —
kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 / 352 /
227 / 375, kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. **21 van de 21 gepinde waarden
gereproduceerd.** A/A op de volledige dump: **byte-identiek**.

MEETRUIMTE: weekvorm-as V1..V7 maal 5 doelen maal 12 (fase,meso)-paren — **420 cellen, 1920
sessies, 12965 blokken, 40 distincte banden, 150514,2 blokminuten**. De twaalf paren zijn
AFGELEZEN over zestien `doelStart`-offsets: periode 12, Build/meso1-4 op k=0..3, Peak/meso1-3 op
k=4..6, Test/meso4 op k=7, Base/meso1-4 op k=8..11.

EEN GAT IN DE EIGEN OPSTELLING, GEVONDEN EN GEREPAREERD VOOR ER IETS OP GEBOUWD IS. De cel-sleutel
stond eerst op `(vorm, doel, fase, meso)` en COLLABEERDE: bij Onderhoud is `mesoCyclus` false, dus
`effectiveMesoWeek_` zet de mesoweek op 1 en twaalf offsets vallen op minder paren samen — 343
cellen in plaats van 420. De sleutel staat nu op de OFFSET.

## 2. Deze reeks is niet die van ronde 1, en de fixture-beschrijving verklaart dat niet

Ronde 1 gaf 13372 blokken, 39 banden, 139462 blokminuten, 278 cellen met sweetspot-werk en
146 / 117 / 15. Deze ronde geeft 12965 blokken, 40 banden, 150514,2 blokminuten, **266 cellen** en
**161 / 90 / 15**.

WAT WEL EXACT REPRODUCEERT: alle negen band-aandelen en alle negen band-LABELS uit
`docs/PUNT43-POORT-RECON.md` §3, de band `100-108` op 1344 minuten, en de rest-categorie "beide"
op exact 15. Cellen (420) en sessies (1920) zijn identiek.

WAT NIET REPRODUCEERT: de minuten per band, en daarmee de verdeling tempo-tegen-drempel. Het
verschil is variant-rotatie binnen de sweetspot-familie. Twee ONAFHANKELIJKE definities van
"cel met sweetspot-werk" — op `archetypeId` beginnend met `sweetspot`, en op de sweetspot-BANDEN —
geven allebei exact 266 / 161 / 90 / 15, dus het verschil zit niet in de definitie.

GEVOLG VOOR DEZE RONDE: geen enkel getal uit ronde 1 is als eis gebruikt. De VORM van de premisse
houdt stand — een meerderheid tempo, een substantieel deel drempel, een kleine rest beide.

## 3. De kandidaat uit §7 van ronde 1 is per constructie niet leesbaar

Gemeten over alle **14** blok-producenten in `packages/engine/src`: een blok draagt **exact vier
velden** — `minuten`, `zone`, `pctLo`, `pctHi`. Drie producenten geven er zelfs maar twee
(`minuten`, `zone`). Er is geen herkomst-veld.

DE BEDOELING BESTAAT WEL, MAAR EEN LAAG HOGER. `ARCHETYPES` draagt `effectTags`, en zowel
`sweetspot_3x8` als `sweetspot_4x12` draagt `effectTags: ["sweetspot"]`. Het core-blok draagt
`label: "Sweet Spot"`. Geen van beide reist mee naar `blokken`.

DAARMEE IS HET DEFECT SCHERP: `pctZoneBucket_` (`packages/engine/src/zones.ts:202`) knipt op
rust <56, z2 56-75, tempo 76-90, drempel 91-105, anaeroob >105. `sweetspot_3x8` schrijft 88-92
voor, midpunt 90, label `tempo`; `sweetspot_4x12` schrijft 89-92 voor, midpunt 90,5, label
`drempel`. EEN procentpunt op de ondergrens, dezelfde bedoeling, tegengestelde poort.

## 4. Vier poorten, beide richtingen, op cel- en dagniveau

- **P0** — de huidige poort: het midpunt-label.
- **PA** — elke werkzone die de band RAAKT, op dezelfde discrete indeling als `pctZoneBucket_`.
- **PH_arch** — PA, maar alleen voor blokken uit een sessie MET `archetypeId`.
- **PH_core** — PA, maar alleen voor blokken die een CORE-band van hun archetype dragen.

| poort | sweetspot-cellen | breder cel/dag | smaller cel/dag | zone uitsluitend uit een niet-werkblok cel/dag | cellen die alle werkzones verliezen |
|---|---|---|---|---|---|
| P0 | 161 / 90 / 15 | — | — | 108 / 312 | — |
| PA | 266 consistent | 229 / 793 | 0 / 0 | 122 / 574 | 0 |
| PH_arch | 266 consistent | 226 / 646 | 0 / **84** | **121** / 385 | 0 |
| PH_core | 266 consistent | 116 / 368 | **87 / 312** | 0 / 0 | **51** |

PH_ARCH SCHEIDT DE TWEE GEVALLEN NIET. Van de 122 vuile cellen onder PA blijven er **121** staan;
op dagniveau zakt het lek van 574 naar 385 en verdwijnt het niet. De grond is gemeten: de vulling
zit OOK BINNEN werksessies — `55-78` bij `threshold_ladder_kort`, `55-80` bij de vo2-archetypes —
en die sessies dragen wél een `archetypeId`.

PH_ARCH FAALT BOVENDIEN OP HET BEGRENZINGSBEWIJS DAT PUNT 43 VRAAGT. Hij is 0 cellen smaller maar
**84 dagen** smaller: **2701** werkzone-blokminuten komen uit sessies ZONDER `archetypeId`, en dat
is geen vulling maar echt drempelwerk — `95-102` (1357 minuten) en `100-108` (1344). Op die dagen
kan hij een tekort VERBERGEN.

PH_CORE SLUIT HET LEK VOLLEDIG (0 / 0) EN IS TE SMAL: 87 cellen en 312 dagen worden smaller, en in
**51 cellen** valt élke werkzone weg — die krijgen dan helemaal geen oordeel meer.

## 5. De monotone synthese haalt alle eisen

**PH_union** — de raak-poort voor CORE-werkblokken, het bestaande midpunt-label voor al het
overige. Per constructie nooit smaller dan P0, want P0 zit er volledig in.

- sweetspot-cellen: **266 van de 266** op `drempel+tempo`. Het defect uit punt 43 is weg.
- SMALLER: **0 cellen, 0 dagen**. Kan geen bestaand tekort verbergen — dat is het
  begrenzingsbewijs dat het punt vraagt, nu op de reparatie zelf.
- breder: 116 cellen, 368 dagen.
- zone uitsluitend uit een niet-werkblok: **87 cellen / 312 dagen**, tegen **108 / 312** in de
  VOOR-STAAT. Onder P0, niet erboven.
- verdampte voorgeschreven werkminuten: van **2870 van de 30201 (9,5 procent)** naar **509 (1,7
  procent)**.

## 6. Wat deze ronde NIET gemeten heeft

- `dosisTredeVoorstel` is NIET op meebewegen getoetst, en de derde consument
  `sleutelinhaal.ts:44` is niet hertoetst. Beide meten het EFFECT op een oordeel, en dat vraagt de
  GELEVERDE kant; die is in deze opstelling leeg gevoed. Ze horen op de echte D1 en in dezelfde
  ronde als de bouw.
- De volume-as W1..W7 is niet gedraaid; over volume zegt dit document niets.
- Er is niets gemeten over hoe oude bewaarde weekplan-rijen zich gedragen zonder het nieuwe veld.

## 7. Wat de bouw vraagt, en de scope verschuift

Het blok moet zijn BEDOELING gaan dragen: een veld dat zegt of het een core-werkblok is. Dat is
een ENGINE-wijziging plus doorvoer naar de bewaarde weekplan-rijen — punt 43 stond als CLIENT en
dat is met deze meting onjuist. Bewaarde rijen zonder het veld vallen terug op P0-gedrag, en die
terugval hoort expliciet in de bouwspec en in een rood-meting.

<!-- EINDE docs/PUNT43-HERKOMST-RECON.md -->
