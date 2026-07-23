# Cadans — DOELEN-SPEC

Norm-document voor de doel-laag. Wat hier VASTGESTELD staat is besloten en wordt niet
opnieuw ter discussie gesteld; wat OPEN staat draagt de vraag die nog open is. Voorrang:
`docs/WERKWIJZE.md` (werkwijze) > `docs/TRAININGSMODEL.md` (norm) > dit document (invulling
per doel) > `HANDOFF.md` (stand). Dit document wijzigt geen code.

## 0. Meetopstelling

Engine gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd op de
fixture-maandag — de klok is een fixture-variabele, want `allocateQualityWeek_` dateert zich op
ambient `new Date()`. Elke "gemeten"-uitspraak hieronder is GEDRAAID tegen Cadans `eee966b`,
niet gelezen. Parity getoetst tegen de bevroren GAS-bron `daanhhk/training` @ `3e8090a`.

## 1. Kern-vondst — het doel doet vandaag bijna niets

Identieke week (di 60 / do 60 / za 150 / zo 90), mesoWeek 1, gemeten per fase:

- Base: alle VIJF doelen krijgen 2 kwaliteitsdagen en 45 minuten hoog-intent, uit dezelfde
  twee sjablonen. Alleen de volgorde verschilt.
- Build: FTP 3d/66' · Conditie 3d/69' · Beklimmingen 3d/65' · VO2max 3d/34' · Onderhoud 2d/45'.
- Peak: FTP 2d/35' · Conditie 2d/38' · Beklimmingen 2d/44' · VO2max 2d/26' · Onderhoud 2d/35'.

Base beslaat de hele winter: de fase is event-gedreven en AGR ligt tot half februari 2027
verder dan negen weken weg. Het gekozen doel is daarmee het grootste deel van het jaar inert.
Doel VO2max levert bovendien structureel de MINSTE prikkel van de vijf.

## 2. Twee assen — een doel is geen piek en geen omstandigheid

De referentie-app (Join Cycling) zet drie categorieën naast elkaar: Opbouwen, Verbeteren,
Pieken. Alleen de eerste twee zijn doelen.

- PIEKEN (eendaagse / meerdaagse) is bij ons geen doel maar de EVENT-AS: `eventFase_` drijft
  Base/Build/Peak/Taper op de weken tot het hoofd-event. Die as werkt en blijft ongemoeid.
  Een meerdaagse is bij ons een `trip`-event.
- CONTEXT-PLANNEN (indoor, routine-mix, "rustig leven hard rijden") zijn bij ons geen doel
  maar INVOER: de weekplanner draagt de beschikbare tijd per dag.

Gevolg: de doel-lijst hoeft alleen het trainingsdoel te dragen, niet de kalender en niet de
omstandigheden. Dat scheelt drie plannen die we niet hoeven bouwen.

## 3. De doelen

### 3.1 FTP verhogen — VASTGESTELD

VERWACHTING. Maximale winst binnen de beschikbare tijd; sessies rond 60 minuten.
MODEL. M38: een herhaalbare, progressieve dosis rond de drempel; bij weinig uren de
ruggengraat, niet de garnering.
TRAINERSPRAKTIJK. Progressieve dosis drempel en sweet-spot, week op week opgebouwd via
tijd-in-zone. De opbouw komt uit dosis, niet uit hogere percentages (M74-M78).
APP VANDAAG. Profiel `ftp`; quotum Base 2 / Build 3 / Peak 2; tussenruimte 1; lange rit 1;
eigen meetlat in `GOAL_PROFILES_.ftp`. Werkt zoals bedoeld.
BOUWLAST. Geen. Dit doel is de referentie waartegen de andere worden gemeten.

### 3.2 Onderhoud — VASTGESTELD (het winterdoel)

VERWACHTING. FTP zo stabiel mogelijk HOUDEN bij minder uren. Elk beschikbaar moment moet
renderen; in de winter kan een lange rit volledig ontbreken. Sessies rond 45 minuten.
MODEL. M37: onderhouden is een antwoord op capaciteit, geen periodiseringsfase — een
intensiteits-opgave, geen rustperiode. M38: de intensiteit die FTP draagt blijft staan
terwijl het volume zakt; een onderhoudsweek is geen zachte week.
TRAINERSPRAKTIJK. Volume mag fors zakken zolang de FREQUENTIE en de intensiteit van de
kwaliteitsprikkel blijven staan; frequentie-verlies is de motor achter detraining. Bevestigd
door de referentie-app, die haar winterplan expliciet MINDER gepolariseerd maakt om het hele
bereik te pakken. Onderbouwing uit de literatuur: bij intensivering met ~33% minder
duurvolume verbeterde de tijdrit in verse toestand wél, de tijdrit na lange voorbelasting
niet (Christensen e.a., Scand J Med Sci Sports 2024). Vers vermogen houd je met intensiteit;
duurvermogen kost volume. Precies de scheidslijn tussen dit doel en Conditie.
WAT HET PLAN MOET LEVEREN. Zoveel kwaliteitsdagen als de week toelaat, met herstel ertussen;
geen gereserveerde duurdag; de dichtheid loopt op naarmate de uren zakken.
APP VANDAAG, GEMETEN. Quotum vast 2 en tussenruimte 2. Gevolg bij schaarste: 2x60 levert
1 kwaliteitsdag (de helft van de week is vulling); 3x60 op rij levert 1; 3x60 gespreid
levert 2 en 45 minuten hoog-intent. Quotum en tussenruimte zijn SAMEN bindend — elk apart
verhogen of verlagen verandert nul.
BESLUIT. Quotum 3 in elke fase, tussenruimte 1. Een vast quotum 3 is bewijsbaar identiek aan
`min(3, aantal beschikbare dagen)` — 0 van 5 weekvormen wijkt af — dus het aantal dagen en de
tussenruimte doen het aftoppen zelf. Geen reserve-regel, geen nieuwe hendel.
GEMETEN EFFECT. 3x60 -> 3 kwaliteitsdagen en 69' (was 45'). 2x60 -> 2 dagen en 45' (was 24').
3x60 op rij -> de tussenruimte zet zelf een Z2-dag in het midden, dus herstel blijft
beschermd. Weekbelasting stijgt nauwelijks: op di45/do45/za90/zo60 gaat TSS van 178 naar 184
(+3%) terwijl hoog-intent van 41' naar 61' gaat (+49%). Dat is herverdeling binnen de
gedeclareerde capaciteit, niet meer belasting — M47-conform.
PIRAMIDE BLIJFT STAAN. Ook een week waarin élke dag kwaliteit is blijft piramidaal: een
60-minutensessie is ~24' hoog en ~36' laag, dus bij 3x60 ligt 62% van de tijd nog laag. De
piramide leeft binnen de sessie, niet tussen de dagen. Daarom hoeft er geen duurdag te worden
vrijgehouden (M43 niet geschonden).
MESO-CYCLUS. De 3:1-ramp bestaat om progressieve overbelasting te verwerken. In een
onderhoudsblok is er geen overbelasting, dus de ramp heeft er geen functie: trainers houden
één consistente, herhaalbare week vast en nemen herstel op afroep. BESLUIT: `mesoFactor` op 1
voor Onderhoud (geen 1,00/1,08/1,15-ramp) en geen kalender-deload; de herstelweek komt uit de
bestaande vermoeidheidskaart (voorstel-en-bevestig). Vuurt die, dan snijdt hij VOLUME en
laat hij de kwaliteitsdagen staan. Vandaag houdt de deload bij Onderhoud één kwaliteitsdag
van 12 minuten over — dat is exact de zachte week die M38 verbiedt.
GAS-PARITY. GAS draagt hetzelfde quotum en dezelfde tussenruimte en noemt het profiel in
eigen commentaar "Fase 1 (scaffolding)" met gedrag dat naar een nooit gebouwde fase 2 werd
doorgeschoven. Dit is dus het afmaken van een gedeclareerd onaf profiel, geen willekeurige fork.
BOUWLAST. Klein: twee waarden in `PROFILES.onderhoud`, plus de meso-uitzondering.
OPEN — DE HERSTELROUTE LEVERT NOG DE ZACHTE WEEK. EIGEN BOUW, VOOR STAP 2. De kalender-deload is
weg, maar de vermoeidheidskaart (DOWN) substitueert mesoweek 4 en dat dwingt de deload-inhoud af.
Voor een opbouwblok klopt die inhoud; voor Onderhoud is het exact de zachte week die M38 verbiedt —
frequentie is juist wat je in de winter beschermt.
MECHANISME, GELEZEN (`allocateQualityWeek_`, `packages/engine/src/planner.ts`). Vier klemmen hangen
aan de deload-vlag. Twee zijn bij Onderhoud AL inert: de lange-rit-klem (`langeRitPerWeek` 0) en de
debt-klem (`debtEnabled` false). Er bijten er dus twee: het quotum wordt naar 1 geklemd, en de
eligibility laat alleen doordeweekse `vrij`-dagen toe. De dosis-verlaging (mesoFactor 0,60) zit
NIET in de allocator maar in de f<1-ramp, en die willen we juist HOUDEN — dat is de verlichting.
RICHTING. Een profiel-vlag die de twee klemmen overslaat, in dezelfde lijn als `debtEnabled !== false`
en `mesoCyclus`. Gesimuleerd op een gepatchte bundel gaat de winterweek daarmee van 1 naar 3
kwaliteitsdagen met de 0,60-dosis erop. Structureel gemeten; de belastingcijfers uit die simulatie
zijn NIET betrouwbaar (proxy-opbouw, niet de volledige pijplijn) en moeten in de bouw-recon opnieuw.
OPEN ONTWERPVRAAG, BESLISSEN VOOR DE BOUW. "Volume snijden" haalt de app maar half: de dagminuten uit
de weekplanner zijn een harde bovengrens en de endurance-fill groeit aan tot `doelMin`, dus een
0,60-dosis verlaagt de tijd-in-zone maar verkort de week nauwelijks. Kiezen tussen (a) accepteren dat
de verlichting alleen in tijd-in-zone zit, of (b) een week-brede duurverkorting toevoegen — dat is het
`durCapMin`-mechanisme dat in T28 fase 2 BEWUST niet is gebouwd omdat er geen consument was. Meten
voor je kiest.
De precedentie-test in `ea567e5` legt bewust alleen vast DAT de override de week verandert, niet
WELKE week eruit komt, zodat die test deze fix niet blokkeert.

### 3.3 Korte beklimmingen — VASTGESTELD, moet gebouwd

VERWACHTING. Beklimmingen van ongeveer 8 minuten of korter. Dit IS het A-doel: de Toerversie
van de Amstel Gold Race, 17 april 2027, 240 km met 2.960 hoogtemeters over ~30 beklimmingen.
Het parcours is kort en steil (Cauberg 0,8 km a 6,6%; Eyserbosweg 1,1 km a 7,6%; Gulperberg
0,5 km a 9,8%) en de beslissende klimmen komen na 200 km.
MODEL. M36: lang en kort klimmen zijn twee doelen, geen één. M38: herhaalbaar vermogen ver
boven de drempel, met herstel ertussen.
TRAINERSPRAKTIJK. Herhaalbaarheid boven de drempel: korte harde intervallen met korte pauzes
(30/15, 40/20) en klimherhalingen van 2-5 minuten. Korte intervallen presteren hier
aantoonbaar beter dan effort-gematchte lange intervallen (Ronnestad e.a., 2020: hoger
piek-aeroob vermogen en hoger vermogen op 4 mmol). MAAR voor een toertocht van 240 km telt
niet het verse piekvermogen maar het vermogen om die inspanning na uren nog te herhalen —
dus korte klimmen EN duurvermogen, niet het een of het ander.
WAT HET PLAN MOET LEVEREN. Herhaalbare bovendrempel-blokken, en in Build/Peak een deel
daarvan LAAT in een lange rit in plaats van vers aan het begin.
APP VANDAAG, GEMETEN. Er is één doel `Beklimmingen`. De vraag "lang of kort?" wordt gesteld
bij het event, gevalideerd, opgeslagen en doorgegeven — en gemeten weggegooid: vlak, lang,
kort en gemengd geven vier byte-identieke weken. De vertaler `climbTypeWorkout_` bestaat en
mapt kort naar vo2max en lang naar drempel, maar zit in een tak die nooit vuurt.
BESLUIT. Splitsen in twee doelen. De logica uit de dode tak wordt de basis van twee profielen;
het `klimType`-veld op het event blijft bestaan maar is niet langer de enige route.
BOUWLAST. Middel. Twee profielen, dode tak opruimen, meetlat mee.

### 3.4 Lange beklimmingen — VASTGESTELD, moet gebouwd

VERWACHTING. Beklimmingen langer dan ongeveer 8 minuten. Concreet doel: zomer 2027, Italië,
Stelvio, een week lang zware beklimmingen. Datum nog onbekend.
MODEL. M38: langdurig vermogen rond en boven de drempel, mét de vermoeidheid die eraan
voorafgaat.
TRAINERSPRAKTIJK. Aanhoudende blokken van 8-30 minuten rond de drempel, opgebouwd in
tijd-in-zone, plus tempo-volume. Voor een MEERDAAGSE is de opgave niet pieken maar herhaalbaar
maken: opeenvolgende lange dagen, want dag vijf telt zwaarder dan dag één. Geen echte taper.
APP VANDAAG. Zie 3.3 — hetzelfde ene profiel, dezelfde dode tak.
BESLUIT. Komt gratis mee met de splitsing van 3.3.
PRAKTISCH. Zonder datum kan de app er niet op periodiseren (`eventFase_` meet weken tot het
event). Voorlopige datum invoeren en later aanscherpen.
BOUWLAST. Gaat mee met 3.3.

### 3.5 Conditie / duurvermogen — VASTGESTELD als doel, meetlat NIEUW

VERWACHTING. Langer kunnen doorrijden. Niet "algemeen fitter".
MODEL. M38 vraagt een progressieve duurprikkel plus een maat die laat zien of het duurvermogen
groeit. M39 verklaarde dat OPEN: die maat bestaat niet, en CTL is hem niet.
DE MAAT BESTAAT WEL — EN STAAT AL IN DE BRON. intervals.icu kan vermogenscurves plotten ná een
bepaalde hoeveelheid verzette arbeid in kJ, om te zien hoe iemand presteert in vermoeide
toestand. In de literatuur heet dit DURABILITY: iemands weerstand tegen achteruitgang van zijn
fysiologische kenmerken tijdens langdurige inspanning. Het is meetbaar: na een arbeidsblok van
15 kJ per kilo zakte in een gecontroleerde studie het piekvermogen in een ramptest van 413 naar
380 watt, terwijl drempel en efficientie ongemoeid bleven. Twee renners met dezelfde FTP kunnen
hier ver uit elkaar liggen, en dat is wat een lange rit beslist.
VOORSTEL VOOR DE MEETLAT. Primair: 20-minutenvermogen ná 15 kJ/kg (bij 75 kg circa 1125 kJ,
dus een rit van 2,5-3 uur), uitgedrukt als percentage van het frisse 20-minutenvermogen.
Secundair, goedkoop maar ruisgevoelig: decoupling en de Power/HR-Z2-metriek die intervals.icu
al per rit berekent — bruikbaar als trend over weken, niet als vergelijking tussen twee ritten,
want hartslag hangt aan hitte, voeding en slaap.
DE SLUITING. Die meting vraagt een maximale inspanning laat in een lange rit. Dat is exact
`combo_long_with_efforts` — prikkel-in-de-rit fase 2. Dezelfde training die duurvermogen
traint, meet het ook. M39 gaat dicht met een mechanisme dat al gespecificeerd is.
EERLIJKE GRENS. In een winterweek van 3x60 haalt niemand 1125 kJ, dus de maat staat leeg
precies wanneer Onderhoud draait. Dat is geen bezwaar: het is een seizoensmaat, geen weekmaat.
Zolang de maat leeg is doet de app er geen uitspraak over (M5).
APP VANDAAG, GEMETEN. Profiel `conditie` bestaat en weegt sweet-spot zwaarst, maar wordt
gemeten tegen het girona-profiel (T2) en levert in Base hetzelfde plan als FTP.
BOUWLAST. Klein voor het profiel; middel voor de meetlat (nieuwe afgeleide uit de
activiteiten-data), en die hangt aan prikkel-in-de-rit fase 2.

### 3.6 VO2max — VERVALT

MODEL. M35: VO2max is een MIDDEL, geen doel. Niemand streeft een fysiologische grootheid na;
hij wil ergens beter in worden. Als middel blijft het volledig in gebruik — de pools blijven.
REFERENTIE-APP. Kent VO2max niet als doel, wel als bestanddeel van plannen.
GEMETEN. Doel VO2max levert de MINSTE prikkel van alle vijf doelen (Build 34' hoog-intent
tegen 66' voor FTP), omdat de vo2-sjablonen kort zijn. Het is een doel dat je zwakker traint.
BESLUIT. Van de lijst af. `DOEL_OPTIONS` gaat van vijf naar vijf: VO2max eruit, korte en lange
beklimmingen erin in plaats van één `Beklimmingen`.
BOUWLAST. Klein, maar raakt oracle-bevroren selftest-asserties.

## 4. De archetype-bibliotheek — het gat zit precies verkeerd

GEMETEN, aantal beschikbare sjablonen per sessieduur:

- t/m 32 minuten: niets.
- 33-34: één drempel-sjabloon, verder niets.
- 35-51: één sweetspot, één drempel, één tot drie vo2.
- 52-53: één sweetspot, GEEN drempel (gat tussen plafond 51 en ondergrens 54).
- 54-68: één sweetspot, één drempel.
- 69-105: twee tot zes per intent — hier is de tabel rijk.
- vanaf 136: niets (het bekende lange-dagen-gat, prikkel-in-de-rit fase 2).

GEVOLG, GEMETEN. Acht opeenvolgende winterweken van 3x60 leveren élke week exact dezelfde twee
trainingen op: twee verschillende sjablonen over zestien kwaliteitssessies. Met quotum 3 wordt
dat dezelfde sessie twee keer in één week. De rotatie heeft niets om naar te roteren.

BESLUIT. Zes tot tien nieuwe archetypes in de BESTAANDE vorm voor de band 33-68, plus het gat
bij 52-53 dichten. Niet overnemen uit een externe database: deze sjablonen zijn geen
workout-teksten maar geparametriseerde archetypes (warming-up, core, fill, cooldown, %FTP,
duurband) die de dosis-ramp en de zone-boekhouding voeden, en een samengestelde database van
een derde partij is bovendien niet vrij overneembaar. Zelf schrijven, in de huisstijl van de tabel.

## 5. Daans seizoen als keten

- Winter 2026-2027: doel Onderhoud. Weinig uren, mogelijk geen lange rit.
- Half februari 2027: de event-as zet de fase op Build; doel wisselt naar korte beklimmingen.
- 17 april 2027: A-event AGR Toerversie (eendaagse, korte klimmen, duurvermogen).
- Zomer 2027: Stelvio-week (meerdaagse, lange klimmen, duurvermogen). Datum nog te bepalen.

Twee A-doelen in één seizoen met verschillende eisen. Duurvermogen loopt door beide heen en is
daarmee geen los doel maar een dragende laag.

## 6. Bouwvolgorde

1. Onderhoud-profiel (quotum 3, tussenruimte 1, meso-uitzondering). Klein, gemeten, winterfix. **AF** — commit `09e6a07`, precedentie-test `ea567e5`.
1b. Onderhoud-herstelweek (§3.2 OPEN): de twee deload-klemmen in `allocateQualityWeek_` overslaan voor Onderhoud, met de dosis-verlaging behouden. Recon-first, de open ontwerpvraag (dagminuten als hard plafond) eerst meten. VOOR stap 2.
2. Archetypes 33-68 erbij. Zonder deze stap wordt stap 1 monotoon.
3. Doel-lijst herzien: VO2max eruit, Beklimmingen splitsen in kort en lang.
4. Duurvermogen-meetlat, samen met prikkel-in-de-rit fase 2.

Elke stap eigen bouw, stop-en-verifieer ertussen, gate en CI groen, vloeren niet regresseren.

## 7. Te autoriseren engine-plekken (nog NIET gegeven)

- ~~`PROFILES.onderhoud` in `packages/engine/src/archetypes.ts` — quotum en tussenruimte.~~ **GEBRUIKT** (commit `09e6a07`).
- ~~De meso-uitzondering voor Onderhoud.~~ **GEBRUIKT** — landde NIET bij de `mesoFactor`-consumenten maar als aparte pure helper `effectiveMesoWeek_` aan de bron (`planner.ts`, zet de mesoweek op 1), zodat GEEN dosis-site is geraakt.
- NOG NIET GEGEVEN: de twee deload-klemmen in `allocateQualityWeek_` (`planner.ts`) — het quotum-naar-1 en de weekdag-only-eligibility, over te slaan voor Onderhoud (§3.2 OPEN, stap 1b).
- `ARCHETYPES` in `packages/engine/src/archetypes.ts` — de nieuwe sjablonen.
- `DOEL_OPTIONS` en `profileForDoel_` — doel-lijst.
- `climbTypeWorkout_` en de dode tak in `planner.ts` — klim-splitsing.
- `packages/engine/src/selftest.test.ts` — asserties bewegen mee, vloer stijgt.
