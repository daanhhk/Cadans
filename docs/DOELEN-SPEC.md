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

## 2A. Het coach-model — VASTGESTELD

DE DIAGNOSE. Elk mechanisme — mesoweek-teller, dosis-ramp, deload-inhoud, vermoeidheidskaart,
inhaal-kaart — is LOS gebouwd, met een eigen signaal en een eigen drempel. Er is geen gedeeld
model van wat de coach weet en waarop hij besluit. De wortel is één ontbrekend object: er is geen
BLOK. Een trainer houdt één ding vast — een periode met een bedoeling, een dosis-doel, een
sleutelsessie en een check aan het eind — en alles wat hij week op week doet is de vraag of dat
blok op koers ligt. Cadans heeft drie klokken (event-aftelling, 4-weeks mesoteller vanaf
`doelStart`, weekquotum per fase) en geen van de drie draagt een bedoeling of een check.

GEMETEN, wat die drie klokken vandaag doen (gelezen op HEAD `a09d9b3`):
- `eventFase_` zet Base bij 9 of meer weken tot het hoofdevent. AGR ligt 38 weken weg, dus de fase
  staat tot circa 13-02-2027 op één ononderbroken Base van 29 weken. Zonder event valt
  `computeMacroPhase` terug op een 12-weeks kalender die na week 12 voorgoed op "Test" blijft staan.
- Vier van de vijf planner-profielen dragen in Base hetzelfde quotum (2), dezelfde tussenruimte (1)
  en dezelfde lange rit (1); alleen de intent-gewichten verschillen. Dat reproduceert paragraaf 1:
  het doel is inert in precies de weken die nu tellen.
- `mesoCycleWeek_` telt cyclisch 1..4 vanaf `doelStart`, los van de fase en los van enige
  blok-inhoud; `mesoFactor` past 1,00 / 1,08 / 1,15 / 0,60 puur op de kalender toe.

DRIE NIVEAUS, elk met één vraag.
- SEIZOEN — waar moet ik uitkomen, en wanneer. Levert het event als er een hoofdevent staat,
  anders het doel.
- BLOK — drie opbouwweken plus een herstelweek, met één bedoeling, één dosis-doel, één
  sleutelsessietype en een check aan het eind.
- WEEK — wat vraagt dit blok deze week binnen de tijd die er echt is; en daarna: wat is er gebeurd.

HET BLOK-OBJECT. Vier velden: BEDOELING (wat traint dit blok), DOSIS-DOEL (hoeveel, per week),
SLEUTELSESSIE (welk type draagt de bedoeling), CHECK (waaraan zie je aan het eind of het gelukt is).
VASTE LENGTE. De check bepaalt de dosis van het VOLGENDE blok, nooit de lengte van het huidige: een
blok dat zichzelf verlengt is niet uit te leggen en maakt het plan onvoorspelbaar.

TWEE VRAGEN, IN DEZE VOLGORDE. Eerst UITVOERING: is de dosis geleverd. Dan pas EFFECT: heeft het
gedaan wat het moest doen. Zonder de eerste is de tweede betekenisloos, en bij een niet-geleverde
week zwijgt de app over effect (M5). Dit scheidt "niet gedaan" van "niet gewerkt": niet-gedaan is
een WEEK-vraag, niet-gewerkt is een BLOK-vraag.

DE SCHAARSTE-REGEL. Elk doel draagt een BESCHERMD deel en een RESIDU. Zakken de beschikbare uren,
dan sneuvelt het residu en blijft het beschermde deel staan; is zelfs dat niet meer te leveren, dan
past het doel niet bij de uren en hoort de coach dat te zeggen (M40). Dit is de reden dat een
gedeclareerd urenbudget bestaat: niet als plafond om vol te maken, maar als de grond waarop wordt
besloten wat wegvalt. GEMETEN: `weekUren` staat in `settings` en in de Instellingen-UI, maar de
engine leest het veld NERGENS; de planner leidt zijn weekvolume af uit de som van de
weekplanner-dagminuten (`weekV`, `planner.ts`). BESLUIT: de gedeclareerde uren blijven een
MEETLAT-invoer (past het doel bij de uren) en worden GEEN planner-invoer. Dat houdt de eerste bouw
client-only en laat M27 ongemoeid.

DE DAG-INVULLING — VASTGESTELD (Daan-besluit). De coach vult de beschikbaar gestelde tijd zo
optimaal mogelijk in, zodat de belasting past bij de week. DUUR IS EEN EIGENSCHAP VAN DE DAG, GEEN
VOORSCHRIFT VOOR DE INHOUD: een lange dag mag intensiteit dragen, en een dag van drie uur is geen
reden om er duurwerk van te maken. Het ENIGE vaste element is de heenrit van de pendel, die rustig
blijft; al het andere deelt de coach in op grond van de opgegeven tijd. ER BESTAAT DUS GEEN
BESCHERMDE LANGE RIT — de langste dag van de week is geen gereserveerde `long_z2`. Dat raakt de
schaarste-regel hierboven aan de residu-kant: extra uren horen als Z2 óm de sleutelsessies heen te
landen, nooit ten koste ervan. GEMETEN als directe oorzaak van twee anomalieën, zie
`docs/STAP7-BOUW12-RECON.md` §1 (de norm), §2 (de lange-rit-pre-claim als eerste van drie hekken)
en §3 (`langeRitPerWeek` 1 tegen 0 verklaart waarom Onderhoud harder traint dan FTP).

DE DOSIS-DOEL-EENHEID. Een dosis-doel is TIJD-IN-ZONE per week in de dragende buckets (high en
anaerobic), plus lange-rit-minuten en week-kJ bij de duur-doelen. NIET TSS: TSS mengt duur en
intensiteit en verbergt daarmee precies het onderscheid waarop de doelen uiteenlopen. NIET %FTP:
het karakter is invariant onder meso- en fase-modulatie (M74-M78), alleen de dosis beweegt.

DE BLOK-CHECK, drie uitkomsten. Geleverd EN gestegen -> volgende opbouwtrede. Geleverd maar NIET
gestegen -> dosis omhoog, want het plan was te licht voor deze uren. NIET geleverd -> dosis NIET
omhoog, want het plan was niet het probleem; daar hoort de uitvoering aangepakt te worden.

WAT DE MACHINERIE AL DRAAGT. Twee stukken staan er al, met de goede korrel, en worden te smal
gebruikt.
- `computeBlockCtlDelta` (`apps/web/src/lib/fatigue.ts`) meet de CTL-verandering over de voorgaande
  drie weken. Dat IS de blok-voortgangsvraag. Vandaag is de enige consument het besluit of de
  kalender-deload vervalt, en de UP-tak landt op mesoweek 1 — de LAAGSTE opbouwtrede.
- `zoneDebt_` (`packages/engine/src/weekprep.ts`) doet intent min werkelijk per zone-bucket op
  minuutniveau. Dat IS de uitvoeringsvraag. Vandaag is het venster `[maandag .. vandaag)` en de
  enige consument de inhaal-kaart.
Er is dus GEEN nieuw signaal nodig. Wat verandert is het VENSTER (blok in plaats van week) en het
GEBRUIK (de dosis van het volgende blok in plaats van alleen "deload overslaan").

DOEL-PASSENDHEID — VASTGESTELD (Daan-besluit). De coach mag een ander doel VOORSTELLEN als het
ingestelde doel niet binnen het urenbudget past, en Daan moet dat kunnen AFWIJZEN. Vorm volgt
M10/M11: het ingestelde doel blijft staan tot hij bevestigt, het voorstel ligt ernaast, de coach
zegt waarom, afwijzen is één tik. Frequentie-grens: hoogstens ÉÉN KEER PER BLOK, op een blokgrens.
Plaatsing in de UI is een bouwbeslissing, geen norm.

DE VIJF GATEN, WAAR ZE DICHTGAAN.
1. Geen tussenstappen per doel -> het blok-object, plus de KETEN-regel per doel in paragraaf 3.
2. Tijd als invoer in plaats van schaarste -> de schaarste-regel plus doel-passendheid.
3. Geen bijstelling binnen de week -> twee lussen; de daglus draait binnen de week.
4. Opbouw week 1-3 aangenomen -> de blok-check, gevoed door de uitvoeringsmaat die al bestaat.
5. "Niet gedaan" tegen "niet gewerkt" -> de twee vragen in volgorde: week tegen blok.

TWEE LUSSEN, NIET VIJF DREMPELS. Een WEEKLUS op het blok (is de dosis geleverd, en heeft het blok
belast -> één voorstel) en een DAGLUS op vandaag (kun je deze sessie dragen). De doortrain-kaart,
de kalender-deload, de dosis-ramp en de inhaal-kaart zijn UITINGEN van de weeklus, geen zelfstandige
mechanismen met een eigen drempel. De per-dag Verlicht-kaart is de daglus.

WAT DIT DOCUMENT NIET DOET. Het legt GEEN drempelwaarden vast. Elke drempel wordt op de ECHTE reeks
geijkt en moet op een plateau liggen — zie `docs/WERKWIJZE.md`, paragraaf *Recon en bewijslast*. Een
norm die hier een getal noemt, bemonstert ruis.

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
KETEN (paragraaf 2A). BESTEMMING: hoger drempelvermogen op een testdatum; vandaag FTP 280.
TUSSENSTAPPEN: blokken met een oplopend dosis-doel in tijd-in-zone — sweet-spot-basis, dan
drempel-intervallen, dan langere drempelblokken; de tussenstap is een DOSIS, geen percentage.
PER WEEK: twee sleutelsessies tot circa vier uur, drie vanaf vijf a zes uur. BESCHERMD: de
sleutelsessies. RESIDU: de vulling en de lange rit. METER: uitvoering = sleutelsessies geleverd op
de voorgeschreven tijd-in-zone; proces = de belasting stijgt over het blok; effect = eFTP of het
20-minutenvermogen — traag (zes tot twaalf weken) en daarom NOOIT de weekreferent.

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
BESLUIT — DE HERSTELROUTE BLIJFT OP DAGNIVEAU (VASTGESTELD). Bij Onderhoud vuurt de WEEK-BREDE
vermoeidheidskaart niet; de bestaande PER-DAG Verlicht-kaart blijft en dekt "vandaag kapot". Er komt
GEEN week-breed deload-mechanisme voor Onderhoud.
GROND, GEMETEN (volledige pijplijn, niet de proxy uit de vorige chat). Haal je alleen de twee
deload-klemmen in `allocateQualityWeek_` weg (quotum-naar-1 en de weekdag-only-eligibility), dan wordt
de week 3% lichter: TSS 184 naar 179 bij ONGEWIJZIGD volume. Dat is een kaart die verlichting belooft
en nagenoeg niets levert. Een week-brede duurverkorting toevoegen zou het `durCapMin`-mechanisme
bouwen (in T28 fase 2 bewust ongebouwd, geen consument) voor een knop die de gebruiker naar eigen
zeggen bijna altijd negeert — en dat is precies goed: in de winter hoort hoge intensiteit erbij.
Herstel hoort dus op DAGniveau, niet op weekniveau. Het `durCapMin`-mechanisme blijft ongebouwd, nu
met een reden in plaats van een open vraag.
De precedentie-test in `ea567e5` blijft staan en blokkeert dit niet: die legt alleen vast DAT de
override de week verandert, niet WELKE week eruit komt.
KETEN (paragraaf 2A). BESTEMMING: een datum plus een VLOER — bij de overgang naar Build nog
minstens circa 95 procent van de FTP waarmee de winter begon. TUSSENSTAPPEN: bewust geen progressie
maar een TELLER; frequentie is de tussenstap (twaalf weken maal drie kwaliteitsdagen is 36
prikkels). PER WEEK: drie kwaliteitsdagen, ook bij drie uur. BESCHERMD: de frequentie. RESIDU:
volume; de lange rit is al vrijgegeven (`langeRitPerWeek: 0`). METER: uitvoering = drie van de drie
kwaliteitsdagen geleverd, met de tijd-in-zone erbij; effect = het beste 20-minutenvermogen over zes
weken zakt niet meer dan enkele procenten. NIET CTL — die hoort te dalen; dat is het doel, geen
signaal.

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
KETEN (paragraaf 2A). BESTEMMING: 17-04-2027, herhaalbare bovendrempel-inspanningen NA 200 km —
twee componenten tegelijk, herhaalbaarheid en vermoeidheidsbestendigheid. TUSSENSTAPPEN: (i) winter
drempelbasis en frequentie; (ii) februari-maart een herhaalbaarheidsblok waarin de dosis stijgt in
het AANTAL HERHALINGEN, niet in intensiteit; (iii) maart-april een specificiteitsblok waarin
diezelfde inspanningen LAAT in een lange rit komen en de lange rit naar vier a vijf uur groeit;
(iv) taper. Elke tussenstap is toetsbaar: eerst de intervalset vers, dan dezelfde set na drie uur.
PER WEEK vanaf circa zes uur: een korte-intervalsessie, een drempelsessie, een groeiende lange rit.
BESCHERMD: de intervalsessie EN de lange rit — die twee kunnen niet allebei sneuvelen. RESIDU: de
tweede drempelsessie en de vulling. Onder circa vijf uur in het voorjaar past het doel niet en hoort
de coach dat te zeggen (M40). METER: proces = lange-rit-duur en week-kJ stijgen, herhalingen in de
intervalsessie stijgen; effect = het vermogen in de late inspanningen ten opzichte van vers —
dezelfde durability-maat als paragraaf 3.5.

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
KETEN (paragraaf 2A). BESTEMMING: een week lange klimmen waarin dag vijf zwaarder telt dan dag een
— een PLATEAU, geen piek. TUSSENSTAPPEN: (i) aanhoudende drempelblokken van acht tot dertig
minuten, opgebouwd in tijd-in-zone; (ii) lange-rit-volume met hoogtemeters; (iii) back-to-back,
eerst een weekendpaar, later drie dagen. Geen echte taper. PER WEEK: volume-hongerig; onder circa
zes a acht uur niet fatsoenlijk te bedienen. BESCHERMD: het weekendpaar. RESIDU: de midweekse
kwaliteit. METER: proces = uren, hoogtemeters en het langste aanhoudende drempelblok; effect = het
vermogen op dag twee van een back-to-back ten opzichte van dag een — een directe toets op precies
het doel.

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
KETEN (paragraaf 2A). BESTEMMING: X watt na N uur — een durability-getal, geen FTP. TUSSENSTAPPEN:
(i) ritduur omhoog naar een plafond; (ii) week-kJ omhoog; (iii) inspanningen laat in de rit.
PER WEEK: de lange rit IS het doel. BESCHERMD: de lange rit. RESIDU: de midweekse kwaliteit. Onder
circa vier uur is het doel niet te bedienen en is Onderhoud of FTP het eerlijke voorstel (zie
doel-passendheid, paragraaf 2A). METER: het 20-minutenvermogen na 15 kJ per kilo als percentage van
vers; secundair decoupling en de Power/HR-Z2-trend. Staat de maat leeg — in de winter meestal — dan
zwijgt de app erover (M5).

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
1b. Onderhoud-herstelroute op DAGniveau (§3.2 VASTGESTELD): bij een doel zonder mesocyclus vuurt de WEEK-BREDE vermoeidheidskaart niet; de bestaande PER-DAG Verlicht-kaart blijft en dekt "vandaag kapot". Het eerder ontworpen mechanisme — de twee deload-klemmen in `allocateQualityWeek_` overslaan plus een week-brede duurcap — is GESCHRAPT: gemeten levert het weghalen van de klemmen TSS 184 naar 179 bij ongewijzigd volume, een kaart die verlichting belooft en niets levert. **AF** — client-side gate op de profiel-vlag `mesoCyclus === false` in `apps/web/src/lib/fatigue.ts` + `schema.ts`, GEEN engine-wijziging.
2. Archetypes 33-68 erbij. Zonder deze stap wordt stap 1 monotoon. **AF** — commit `0bb79ee`, bibliotheek 23 naar 35.
3. Doel-lijst herzien: VO2max eruit, Beklimmingen splitsen in kort en lang.
4. Duurvermogen-meetlat, samen met prikkel-in-de-rit fase 2. Onafhankelijk van stap 5; de nummering is geen volgorde tussen deze twee.
5. Blok-object en de twee vragen (de weeklus). Uitvoerings-referent EERST: het venster van de
   uitvoeringsmaat van week naar blok. Daarna pas de effect-referent per doel. Dit KEERT de
   volgorde van `docs/DOEL-REFERENT-RECON.md` paragraaf 8 om, die de meetlat als fase 1 zet: effect
   zonder uitvoering is betekenisloos, wat die recon in paragraaf 7 zelf vaststelt. Client-only
   verwacht; drempels op de echte reeks ijken, nooit hier.
6. Doel-passendheid. De coach stelt een passend doel voor, afwijsbaar, hoogstens een keer per blok
   op een blokgrens. Hangt aan stap 5 (zonder referent weet het voorstel niet waartegen het meet).
7. Consolidatie. Doortrain-kaart, kalender-deload, dosis-ramp en inhaal-kaart onder de weeklus
   brengen, zodat er twee lussen overblijven in plaats van vijf drempels. ENGINE waarschijnlijk;
   aparte autorisatie, selftest-vloer stijgt mee.

Elke stap eigen bouw, stop-en-verifieer ertussen, gate en CI groen, vloeren niet regresseren.

## 7. Te autoriseren engine-plekken (nog NIET gegeven)

- ~~`PROFILES.onderhoud` in `packages/engine/src/archetypes.ts` — quotum en tussenruimte.~~ **GEBRUIKT** (commit `09e6a07`).
- ~~De meso-uitzondering voor Onderhoud.~~ **GEBRUIKT** — landde NIET bij de `mesoFactor`-consumenten maar als aparte pure helper `effectiveMesoWeek_` aan de bron (`planner.ts`, zet de mesoweek op 1), zodat GEEN dosis-site is geraakt.
- ~~De twee deload-klemmen in `allocateQualityWeek_` (`planner.ts`) — quotum-naar-1 en weekdag-only-eligibility, over te slaan voor Onderhoud.~~ **VERVALLEN** — het mechanisme is geschrapt (§3.2 VASTGESTELD); stap 1b is client-side gebouwd. Voor Onderhoud-herstel is GEEN engine-autorisatie meer nodig.
- ~~`ARCHETYPES` in `packages/engine/src/archetypes.ts` — de nieuwe sjablonen.~~ **GEBRUIKT** (commit `0bb79ee`; twaalf nieuwe kwaliteits-archetypes, bibliotheek 23 naar 35).
- `DOEL_OPTIONS` en `profileForDoel_` — doel-lijst.
- `climbTypeWorkout_` en de dode tak in `planner.ts` — klim-splitsing.
- `packages/engine/src/selftest.test.ts` — asserties bewegen mee, vloer stijgt.
