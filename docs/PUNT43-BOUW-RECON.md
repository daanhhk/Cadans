# Punt 43 ronde 3 — de bouwspec, met een eigen instrument en eigen getallen

Meetronde van 10 augustus 2026. GEEN bouw in deze commit. Dit document legt vast WELKE blokken de
bedoeling gaan dragen, en het corrigeert de kandidaat uit `docs/PUNT43-HERKOMST-RECON.md` §5 op één
dragend punt: de daar gemeten `PH_core` bestond als PROXY op de archetype-core-banden, en de
engine-implementatie die diezelfde naam draagt is een ANDERE poort.

## 1. Instrument, en waarom het opnieuw gebouwd is

`docs/PUNT43-HERKOMST-RECON.md` beschrijft zijn meetopstelling volledig, maar het SCRIPT staat niet
in de repo — precies de werkregel die die ronde zelf opschreef. Het instrument is daarom opnieuw
gebouwd en opnieuw geijkt; geen enkel getal uit ronde 1 of 2 is als EIS gebruikt.

Engine plus `apps/web/src/lib` gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`,
`Date` gestubd als Proxy op de ECHTE constructor. IJKING VOORAF op de weekvorm-as uit
`apps/web/src/lib/weekvormAs.test.ts`: kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90,
week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375, kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3 —
**21 van de 21**.

MEETRUIMTE: weekvorm-as V1..V7 maal 5 doelen maal 12 (fase,meso)-paren — **420 cellen, 1920
sessies, 12965 blokken, 41 distincte banden, 150514,2 blokminuten**. De twaalf paren zijn AFGELEZEN
over zestien `doelStart`-offsets en niet aangenomen: periode 12, Build/meso1-4 op k=0..3,
Peak/meso1-3 op k=4..6, Test/meso4 op k=7, Base/meso1-4 op k=8..11.

DE INSTRUMENTATIE. Een werkkopie van de repo geeft elk blok een `__bron`-veld dat producent én ROL
noemt. Die instrumentatie is gedragsneutraal — de as gaf ná het patchen opnieuw 21 van de 21.
Daarmee is elke core-definitie post-hoc te evalueren zonder opnieuw te bundelen.

## 2. Er zijn VIER blok-producenten met een werk-rol, niet één

Ronde 2 stelde vast dat een blok exact vier velden draagt en dat de bedoeling op het ARCHETYPE
staat. Waar wat dat betekent voor de BOUW niet gemeten is: `expandArchetype_` is niet de enige
bouwer. Gemeten verdeling over de 12965 blokken:

| rol | blokken | minuten | zone-verdeling |
|---|---|---|---|
| `arch:intOn` (interval-werk) | 2534 | 21088,3 | drempel 12907 · tempo 6261 · anaeroob 1920 |
| `arch:work` (core steady) | 1670 | 6785,1 | drempel 4897 · rust 1614 · tempo 274 |
| `rv:steady:low` (variant-core, zone low) | 609 | 25804,6 | z2 25805 |
| `combo:effortOn` | 350 | 2700,6 | drempel 2701 |
| `arch:warmup` | 896 | 10162,8 | z2 10163 |
| overige (fill, cooldown, interval-rust, Z2-basis) | — | — | uitsluitend rust/z2 |

288 blokken dragen GEEN band (`pctLo`/`pctHi` ontbreekt bij de bouwers op `planner.ts:1588`,
`:2109` en `:2343`). Die vallen per constructie op het midpunt-label terug.

## 3. Negen blok-families verbreden de poort — en drie ervan zijn een LEK

Gemeten: de banden waar de raak-poort een WERKZONE toevoegt die het midpunt niet gaf.

GEWENST — echt werk over een zone-grens:
- `arch:intOn` **88-92** tempo → +drempel — 719 blokken, 6260,6 min *(het hoofddefect)*
- `arch:intOn` **89-92** drempel → +tempo — 180 blokken, 2328 min
- `arch:intOn` **88-93** drempel → +tempo — 90 blokken, 1938 min
- `arch:intOn` **89-93** drempel → +tempo — 30 blokken, 807 min
- `arch:intOn` **103-108** anaeroob → +drempel — 48 blokken, 412,8 min
- `combo:effortOn` **100-108** drempel → +anaeroob — 224 blokken, 1344 min

LEK — geen werk:
- `arch:warmup` **55-80** z2 → +tempo — 106 blokken, 1554 min
- `arch:warmup` **55-78** z2 → +tempo — 184 blokken, 1421 min
- `rv:steady:low` **73-77** z2 → +tempo — 105 blokken, 1490 min

DIE LAATSTE IS DE CORRECTIE OP RONDE 2. `73-77` komt uit `z2_progressief`, blok "Bovenkant Z2" op
75 procent, en dat is een CORE-blok van `renderVariant_`. De recon mat `PH_core` als "blokken die
een CORE-band van hun ARCHETYPE dragen"; `renderVariant_`-sessies hebben geen archetype, dus die
proxy kon dit blok per constructie niet zien. Een engine-vlag op alle core-blokken van beide
bouwers haalt het lek terug: **105 cellen en 105 dagen**, exact de band waarop de aandeel-kandidaat
van ronde 1 al vastliep.

## 4. Vier poorten, op de korrel van hun eigen consument

`poortsetVoorWeek_` (`blok.ts:402`) en de `voorgeschreven`-set in `weektekort.ts:108` verzamelen
over de HELE week; `planDraagtSleutelzone_` (`sleutelinhaal.ts:44`) oordeelt per DAG. De metingen
staan daarom op twee korrels. EEN EERSTE OPZET STOND VOLLEDIG OP DAGKORREL en gaf een verdamping
van 22,5 procent waar de consument 9,5 procent ziet; die uitslag is ingetrokken.

WEEKKORREL (blok.ts, weektekort.ts):

| poort | weken breder | weken smaller | verdampte werkminuten |
|---|---|---|---|
| P0 (huidig) | — | — | **2866,8 van 30201,6 (9,5%)** |
| PU_arch | 116 | **0** | 509,1 (1,7%) |
| PU_werk | 116 | **0** | 509,1 (1,7%) |
| PU_naief | 144 | 0 | 219,4 (0,7%) — maar 105 lek-cellen |

DAGKORREL (sleutelinhaal.ts):

| poort | dagen breder | dagen smaller | dagen met sleutelzone |
|---|---|---|---|
| P0 | — | — | 714 van 1592 |
| PU_arch | 368 | **0** | 980 van 1592 |
| PU_werk | 410 | **0** | 980 van 1592 |

SWEETSPOT-CONSISTENTIE, de eis van het punt: van de **266 cellen met sweetspot-werk** labelt P0 er
**161 uitsluitend tempo, 90 uitsluitend drempel, 15 beide**. Onder elke PU-variant is het **266 van
de 266 op drempel+tempo**. Het defect is weg.

## 5. Het begrenzingsbewijs is structureel, niet statistisch

`PU = P0 ∪ raak(coreWork)` bevat P0 per constructie volledig, dus de poortset kan alleen GROEIEN. Dat
is in beide korrels bevestigd: **0 weken en 0 dagen smaller**. Wat dat betekent voor het oordeel is
uit de consumptie af te lezen en hoeft niet bemonsterd te worden:

- `blok.ts:651` en `:671` — `zonesOpNorm === zonesVoorgeschreven.length`. De NORM per zone komt uit
  `planZonesVoorWeek_` en is poort-ONAFHANKELIJK; de poort bepaalt alleen WIE moet slagen. Norm-massa
  wordt dus niet herverdeeld — precies de reparatie die punt 15 fase 2 al had afgekeurd.
- Gevolg: `geleverdOk` kan alleen van true naar false kantelen, `check.uitkomst` alleen van
  `geleverd_*` naar `niet_geleverd`, en `dosisTredeVoorstel` (`blok.ts:1022`) alleen van een
  voorstel naar **null**. DE REPARATIE KAN GEEN DOSISVERHOGING UITLOKKEN DIE ER NIET WAS. Dat is het
  begrenzingsbewijs dat punt 43 vraagt.

DE NIEUWE EIS IS NERGENS DUN, en dat is de tegenkant die een bredere poort moet doorstaan. Over de
**116** toegevoegde (week,zone)-paren vraagt de nieuwe zone minimaal **7** minuten, mediaan **20**,
maximaal **37** — **0 van de 116** onder de 7 minuten. Er ontstaat dus geen faalmodus waarin een
week valt op een zone die het plan nauwelijks voorschrijft. Alle 116 komen uit `arch:intOn`.

## 6. `combo:effortOn` is in deze ruimte INERT, en gaat toch mee

Op weekkorrel zijn PU_arch en PU_werk identiek (116 / 116, 509,1 / 509,1); op dagkorrel schelen ze
42 dagen, en die 42 raken `planDraagtSleutelzone_` niet (980 tegen 980) omdat ze al drempel dragen.
`rv:steady:high` en `rv:intOn:high` leveren in deze meetruimte GEEN band waar midpunt en raak
verschillen.

DE KEUZE IS PLAN, GEEN SIGNAAL. `combo_long_with_efforts` is de sessie die `DOELEN-SPEC` §3.3 voor
korte beklimmingen dragend maakt ("een deel daarvan LAAT in een lange rit") en die §3.5 als
duurvermogen-meting aanwijst. Zijn band `100-108` loopt over de 105-grens en laat 504 voorgeschreven
anaerobe minuten aan de midpunt-kant liggen — dezelfde vorm als het sweetspot-defect. Een uitzondering
maken zou zelf ongemeten zijn. `p2019:klimwerk` gaat NIET mee: die bouwer geeft blokken zonder band,
dus een vlag daar kan de uitvoer per constructie niet raken — dat is vooruit-bedrading.

## 7. De terugval voor bewaarde rijen, in beide richtingen gemeten

Een bewaarde weekplan-rij zonder het nieuwe veld draagt op geen enkel blok `coreWork === true`, dus de
raak-tak vuurt niet en de poort IS P0. Gemeten tegen de VOOR-staat: **420 van de 420** weken en
**1592 van de 1592** dagen identiek. TEGENRICHTING, zodat de vergelijker aantoonbaar een verschil
kán melden: mét het veld **116 van de 420** weken en **410 van de 1592** dagen afwijkend.

DE DOORVOER VRAAGT GEEN SERIALISATIE-WERK. `weekplanBlob.ts:128` doet `aggBlok.push(b)` — de blokken
gaan VERBATIM de blob in, dus het veld reist mee zonder wijziging aan `entryFromDay`.

## 8. Wat deze ronde NIET gemeten heeft

- HET EFFECT OP EEN OORDEEL is niet bemonsterd. `activities` is leeg gevoed, dus `geleverd` is nul
  en `geleverdOk` is in elke cel hetzelfde. Wat §5 geeft is een MONOTONICITEITS-argument uit de
  consumptie, geen meting op echte ritten.
- DE DISJUNCTIE IN `sleutelinhaal.ts` IS HIER NIET TE METEN. `voorgesteldType` is in deze opstelling
  op ALLE 1920 sessies `null`, dus `intentFromType_` levert nooit een sleutel-intent en de intent-term
  is **0 van de 1592**. De gemeten disjunctie is dus louter de zone-term en NIET vergelijkbaar met de
  360 van de 360 uit `docs/PUNT40-RECON.md` §9. Wat wél staat: de zone-term gaat van 714 naar 980
  dagen, en van de 266 dagen die er uitsluitend door bijkomen dragen er 227 een `sweetspot_*`-archetype
  — sweetspot is een sleutel-intent (`COACH_KEY_INTENTS_`, `coach.ts:75`), dus die dagen horen die
  status te hebben.
- De volume-as W1..W7 is niet gedraaid.

## 9. De bouwspec

VELDNAAM `coreWork`, en UITSLUITEND `coreWork: true` waar het waar is — nooit `coreWork: false`.
Dat houdt de blob klein en maakt de terugval een eigenschap van de VORM in plaats van een tak:
`b.coreWork !== true` is waar voor elke oude rij.

NIET `core`, en dat is gemeten en geen smaak: `rec.core` is in `archetypes.ts` al de naam van de
recept-array (41 treffers op `rec.core` of `core:`), en het interval-OFF-blok komt dáár ook uit
terwijl het de vlag juist NIET krijgt. Een blok-veld `core` zou dus precies het onderscheid
verdoezelen dat deze bouw maakt.

DE PLEKKEN, alle vier gegrept in deze ronde:
1. `packages/engine/src/archetypes.ts:152` — de `emit`-helper. `coreWork: kind === "work"`. De vier
   aanroepers geven `"warmup"` (:178), `"work"` (:193, de core steady), `"steady"` (:264, de
   endurance-FILL) en `"cooldown"` (:274); alleen de tweede is werk.
2. `packages/engine/src/archetypes.ts:227` — het interval-ON-blok. `coreWork: true`.
   Het OFF-blok op `:236` krijgt NIETS.
3. `packages/engine/src/planner.ts:1347` (interval-ON) en `:1374` (steady) in `renderVariant_`.
   `coreWork: variant.zone !== "low"` respectievelijk `coreWork: z !== "low"` — `z` staat al op `:1363`.
   Warmup (`:1320`), fill (`:1395`), cooldown (`:1408`) en het interval-OFF-blok (`:1354`) krijgen
   NIETS.
4. `packages/engine/src/planner.ts:2642` — de `blok_`-helper krijgt een parameter; alleen de
   aanroep `blok_(onMin, vorm.pctLo, vorm.pctHi)` zet hem waar.

DE POORT in `apps/web/src/lib/zonelabels.ts:27`. Naast het bestaande midpunt-label komt een
raak-tak voor blokken met `coreWork === true` en een eindige band. De bucket-indeling is DIE VAN
`pctZoneBucket_` (`packages/engine/src/zones.ts:202`, rust <56 / z2 56-75 / tempo 76-90 / drempel
91-105 / anaeroob >105) en NIET de renner-grenzen: het blok-label komt daar ook vandaan, en de
zone-munt blijft ongemoeid. De scan loopt over gehele procentpunten van `Math.floor(pctLo)` tot en
met `Math.ceil(pctHi)` — dat is exact de vorm waarop hier gemeten is.

ACCEPTATIE, alles uit DEZE ronde:
- sweetspot-cellen **266 van de 266** consistent op drempel+tempo (was 161 / 90 / 15).
- **0 weken en 0 dagen SMALLER**, op beide korrels.
- verdamping **2866,8 → 509,1** van 30201,6 werkminuten.
- terugval zonder veld: **420 van de 420** weken en **1592 van de 1592** dagen gelijk aan de
  VOOR-staat; tegenrichting **116** en **410** afwijkend.
- weekvorm-as **21 van de 21** ongewijzigd: het PLAN verandert niet, alleen wat het oordeel leest.
- lek `rv:steady:low` **0 cellen** — de naïeve variant geeft er 105, en dat is de rood-toets.

ROOD-METINGEN die aantoonbaar moeten vallen:
- R1 — `coreWork` weglaten bij `arch:intOn` → de sweetspot-consistentie valt terug naar 161 / 90 / 15.
- R2 — `coreWork` ook op `rv:steady:low` zetten → het `73-77`-lek verschijnt (105 cellen).
- R3 — een bewaarde rij zonder `coreWork` moet P0-gedrag geven; met veld moet hij verschillen.

<!-- EINDE docs/PUNT43-BOUW-RECON.md -->
