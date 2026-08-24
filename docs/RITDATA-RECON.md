# Cadans — RITDATA-RECON

**Welke ritdata haalt Cadans vandaag binnen, wat biedt intervals.icu daarnaast, en welke weg bedient
welke behoefte tegen welke prijs?** Dit is een KEUZEDOCUMENT, geen aanbeveling: het eindigt met vijf
wegen in gewone taal en Daan kiest.

Geschreven voor iemand die de code niet voor zich heeft.

---

## Waarom deze ronde bestaat: drie behoeften

| # | behoefte | wat het vraagt | waarvoor |
| --- | --- | --- | --- |
| 1 | **een piek uit ÉÉN rit** | het beste 20-minutenvermogen van die ene rit | het FTP-VOORSTEL na een gereden ijkinspanning |
| 2 | **een piek over ZES WEKEN** | het beste 20-minutenvermogen over een venster van zes weken | de DOELCHECK, tweede helft van M89 |
| 3 | **de TIJDLIJN binnen een rit** | vermogen én hartslag over tijd | het ONDERWEG-SIGNAAL |

Behoefte 2 is gepind in `docs/DOELEN-SPEC.md` §3.2. Behoefte 1 is een Daan-besluit van deze week:
rijdt hij een aangeboden ijkinspanning, dan berekent de app een nieuwe drempelwaarde en STELT DIE
VOOR; nu moet hij zijn waarde met de hand invullen, waardoor de ijking half af blijft — **de app
vraagt om een meting en doet niets met de uitslag.**

**Ze lijken op elkaar en zijn het niet**, en dat is een uitkomst van deze ronde en geen uitgangspunt.

---

## 1. Wat haalt Cadans vandaag binnen?

### De vijf endpoints die de code aanraakt

| endpoint | waar | wat ermee gebeurt |
| --- | --- | --- |
| `GET /athlete/{id}/activities?oldest&newest` | `intervals.ts` `syncActivities` | **opgeslagen** in `activities` |
| `GET /athlete/{id}/wellness?oldest&newest` | `wellness.ts` `syncWellness` | **opgeslagen** in `wellness` |
| `GET /athlete/{id}/power-curves?type=Ride&curves=<venster>` | `powercurve.ts` `fetchPowerCurve` | **opgeslagen** in `power_curve_cache` |
| `GET /activity/{id}` + `/intervals` + `/streams` | `ride.ts` `intervalsGet_` | **niets opgeslagen** — on demand |
| `POST /athlete/{id}/events/bulk?upsert=true` | `push.ts` | schrijfpad, valt buiten deze ronde |

### Wat er per rit LANDT

`activities` draagt negentien kolommen: `datum · type · naam · duur_min · afstand_km · gem_w ·
norm_w · if_pct · tss · gem_hr · max_hr · pi · ftp · gewicht · rolling_ftp · zone_times_json ·
activity_id_ext` plus `id`/`user_id`.

**GEEN ENKELE PIEK.** Wel een gemiddelde, een genormaliseerd vermogen en een zone-verdeling — maar
nergens "het beste 20-minutenvermogen van deze rit".

`activity_id_ext` is de sleutel die de rest mogelijk maakt. Gemeten op remote D1: **255 ritten, alle
255 met een id**, van `2025-07-17` tot `2026-08-04`.

### Bewaartermijn

**Er is geen verwijderpad** — geen enkele `delete` op `activities` of `wellness` in
`workers/api/src`. De sync-VENSTERS rollen (28 dagen voor activiteiten, 60 voor wellness), maar de
RIJEN stapelen: dertien maanden historie staat er nu. `power_curve_cache` is de uitzondering: één rij
per venster, overschreven bij elke verse fetch, met een dag-bucket als TTL.

### Wat ontbreekt, per behoefte

- **Behoefte 1 — ONTBREEKT VOLLEDIG.** Niets per rit draagt een piek, en `ride.ts` haalt de details
  wel op maar bewaart ze niet (verbatim uit zijn kop: *"Geen cache (stateless), geen schema-touch"*).
- **Behoefte 2 — ONTBREEKT als venster.** De power-curve wordt alleen over `90d` en `1y` opgehaald:
  `export type PowerCurveWindow = "90d" | "1y";` met de route-whitelist
  `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`.
- **Behoefte 3 — BEREIKBAAR MAAR VLUCHTIG.** `ride.ts` haalt `/streams` al op, stateless en per
  scherm-bezoek; meerdere weken vergelijken kan niet.

---

## 2. Wat biedt intervals.icu? — GEMETEN, niet uit documentatie overgenomen

De documentatie op `https://intervals.icu/api-docs.html` is een lege SPA-schil, en de forum-cookbook
op `https://forum.intervals.icu/t/intervals-icu-api-integration-cookbook/80090` documenteert de
power-curve, de streams en de per-rit-endpoints niet. **Daarom is er gemeten** — negentien
GET-verzoeken, zie §5.

### Kandidaat A — het ATHLETE-venster: `power-curves` met een ander `curves`

```
curves=42d   ->  200
curves=6w    ->  422   {"error":"Invalid curve: [6w]"}
curves=400d  ->  200
```

**Het venster is een `<n>d`-vorm en `n` is vrij.** Zes weken heet dus `42d`; `6w` bestaat niet.

**MAAR HET IS GEEN VENSTER VAN ZES WEKEN.** Gemeten: `list[0].label` is `"42 days"` terwijl
`list[0].days` **43** is, met `start_date_local 2026-07-14` en `end_date_local 2026-08-25` — een dag
NA vandaag. Wie letterlijk zes weken wil, stuurt `oldest`/`newest` mee in plaats van op het label te
vertrouwen.

**EN DE 20-MINUTENWAARDE IS NIET AF TE LEZEN — hij moet GEREKEND worden.** Dit is de scherpste
correctie van deze ronde en zij kwam uit de weerleggingspas. De `values`-reeks is NIET monotoon
dalend; gemeten op de 42d-curve: **11 schendingen**. Rond de maat zelf, alle punten uit DEZELFDE rit
`i166073333`:

```
1140s = 265 W   1200s = 261 W   1260s = 263 W   1320s = 263 W   1380s = 264 W   1440s = 261 W
```

De reeks STIJGT tussen 1200 en 1380 seconden. Een echte mean-max-kromme kan dat niet: wie 264 W over
23 minuten volhield, hield per definitie ook ergens 20 minuten ≥264 W vol. **Aflezen op `secs 1200`
geeft 261 W; het lopende maximum over alle `secs ≥ 1200` geeft 264 W — 1,1 procent hoger.** Dezelfde
vorm op de per-rit-curve: 195 W afgelezen tegen 197 W gerekend, 1,0 procent.

*(De OORZAAK van de niet-monotonie is niet gemeten — het kan binning of afronding aan de
intervals.icu-kant zijn. Het GEVOLG is wel gemeten en dat is wat telt.)*

**WAAROM DAT ERTOE DOET:** §3.2 meet of de piek "niet meer dan enkele procenten" zakt. Een
systematische onderschatting van ongeveer één procent zit in dezelfde orde als het criterium zelf.

**EN DE ENGINE LEEST HEM VANDAAG OOK ZO.** `pcMarkerAt_` in `packages/engine/src/niveau.ts` neemt de
EERSTE index waar `secs[i] >= targetSec` en geeft die waarde terug — dus 261, niet 264. Dat is
bestaand gedrag en raakt de bestaande niveaukaart, niet alleen een toekomstige doelcheck.

### Kandidaat B — de PER-RIT curve: `/activity/{id}/power-curve`

```
GET /activity/i172391866/power-curve  ->  200, 5353 bytes
secs: array[153] van 1 tot 4500       values: array[153]
   300s =  211 W      1200s =  195 W      3600s =  191 W
```

Bestaat, en geeft de 20-minutenwaarde van ÉÉN rit — met dezelfde reken-in-plaats-van-aflezen-nuance
(13 schendingen; 195 afgelezen tegen 197 gerekend). Naast `secs`/`values` draagt de respons
`watts_per_kg`, `submax_values`, `powerModels`, `ranks` en `vo2max_5m`.

### Kandidaat C — de TIJDLIJN: `/activity/{id}/streams`

```
GET /activity/i172391866/streams  ->  200, 363535 bytes, array[13]
time · watts · cadence · heartrate · distance · altitude · latlng
velocity_smooth · temp · torque · left_right_balance · hrv · respiration
```

Elk 4510 samples voor een rit van 75 minuten. `watts` en `heartrate` zijn beide volledig gevuld en
delen de index met `time` — precies wat het onderweg-signaal vraagt.

**MAAR HET IS GEEN ZUIVERE 1 Hz.** Gemeten: `time` loopt van 0 tot 4544 met vier sprongen groter dan
één seconde (bij t=161 een gat van 13 s, t=1669 5 s, t=4180 13 s, t=4416 8 s) — **35 seconden
ontbreken**. Wie de index gelijkstelt aan seconden loopt op deze ene rit al ruim een halve minuut
scheef. Rekenen moet over `time`, niet over de index.

### Kandidaat D — de INTERVALLEN: `/activity/{id}/intervals`

```
GET /activity/i172391866/intervals  ->  200, 2010 bytes, icu_intervals: array[1]
```

Per interval `average_watts`, `max_watts`, `weighted_average_watts`, `intensity`, `training_load`,
`decoupling`. **Maar het aantal intervallen hangt af van hoe de rit gestructureerd is** — deze vrije
rit leverde er ÉÉN over de hele duur. Voor een test met een expliciet 20-minutenblok staat dat blok
erin; voor een vrije rit niet. Onbetrouwbaar als enige bron.

### Kandidaat E — DE ACTIVITEITENLIJST DIE CADANS AL OPHAALT

**Dit is de vondst van de weerleggingspas en hij stond op geen enkele eerdere lijst.** De
activiteiten-respons draagt per rit al een vermogen-tegenover-hartslag-maat. Gemeten over
`oldest=2026-07-14&newest=2026-08-24`, 13 activiteiten waarvan 12 ritten, **61.412 bytes in ÉÉN
verzoek dat Cadans toch al doet**:

```
decoupling             gevuld op 12/12 ritten, van  -6,17 tot 16,44
icu_power_hr_z2        gevuld op 11/12 ritten, van   1,13 tot  1,47
icu_power_hr_z2_mins   gevuld op 11/12 ritten, van   3    tot 34 minuten
icu_efficiency_factor  gevuld op 12/12 ritten, van   1,18 tot  1,59
```

**HOU DIT SCHERP: dit zijn AGGREGATEN per rit, geen tijdlijn.** Ze zeggen niets over WELK blok op
welke hartslag lag. Maar de behoefte zoals zij is geformuleerd — *"loopt de verhouding tussen
voorgeschreven vermogen en geleverde hartslag over MEERDERE WEKEN structureel scheef"* — is een
TREND-vraag, en een trend over per-rit-aggregaten kan die beantwoorden. De lijst draagt **GEEN**
20-minutenpiek per rit; gecontroleerd.

### Wat een rit ZELF niet draagt

`GET /activity/{id}` geeft 183 velden. Gegrept op alles wat op een piek lijkt
(`best|peak|curve|power_\d|p\d+|max_watt|20|1200`): **één treffer, `p30s_exponent`** — een
modelparameter, geen piek.

**DAANS VERMOEDEN — "het is af te leiden" — KLOPT, en scherper dan gedacht.** Het hoeft niet uit een
tijdreeks afgeleid te worden: zowel het venster als de per-rit-curve levert een kant-en-klare
kromme. Maar er moet wél GEREKEND worden — een lopend maximum over de kromme — en dat is precies het
stukje dat "direct afleesbaar" leek en het niet is.

---

## 3. De historie-vraag — de vraag die februari maakt of breekt

**ER IS GEEN BACKFILL NODIG VOOR DE DOELCHECK.** `oldest` en `newest` begrenzen het
power-curve-venster ECHT. Gemeten op drie bereiken:

```
oldest=2026-01-01 newest=2026-02-15  ->  254 W, rit i120159182, datum 2026-01-24
oldest=2025-09-01 newest=2025-10-15  ->  265 W, rit i100414467, datum 2025-10-05
oldest=2026-03-01 newest=2026-04-15  ->  231 W, rit i135387352, datum 2026-03-28
```

**Alle drie de pieken vallen binnen hun eigen bereik, en de WATTS verschillen per bereik.** Dat
tweede is het bewijs dat het venster werkelijk begrenst en niet alleen de bijgeleverde
activities-map filtert: waren de watts gelijk gebleven, dan bewoog alleen het etiket mee.

**Gevolg:** de doelcheck hoeft niet vanaf nu op te bouwen. In februari kan zij met terugwerkende
kracht elk gewenst venster opvragen — de curve over `400d` leverde een piek uit `2025-07-26`, dus
intervals.icu bewaart ruim genoeg.

**Voor de andere twee ligt het anders.** Per-rit-curves zijn met terugwerkende kracht op te halen:
255 ritten × ~5,4 kB ≈ **1,4 MB** en 255 verzoeken. Streams-backfill zou 255 × ~364 kB ≈ **93 MB**
zijn — een andere orde.

---

## 4. De twee verwachtingen

### U1 — VALT

*"Er bestaat één weg die zowel de piek-per-rit als de piek-over-zes-weken bedient."*

**Nee, het worden twee wegen.** De twee pieken komen uit twee endpoint-klassen:
`/athlete/{id}/power-curves` tegenover `/activity/{id}/power-curve`.

**Waarom de athlete-curve de rit-piek niet kan vervangen, gemeten:** het `42d`-venster wees rit
`i166073333` aan en het `90d`-venster rit `i158575314` — verschillende ritten. De marker geeft de
BESTE rit in het venster, niet de LAATSTE.

Er is wél één weg die beide bedient — per-rit-curves ophalen en zelf over zes weken aggregeren —
maar die kost één verzoek per rit in plaats van nul. Dat is weg 4 in het keuzeblok.

### U2 — HOUDT, en met een vondst die de volgorde raakt

*"De tijdlijn binnen een rit is duurder dan de twee piek-behoeften."*

```
per-rit power-curve :   5 353 bytes      1 verzoek per rit
per-rit streams     : 363 535 bytes      1 verzoek per rit   -> ongeveer 68x zo groot
zesweeks venster    :       0 extra bytes en 0 extra verzoeken
```

De tijdlijn is dus even duur in VERZOEKEN als de per-rit-piek en ongeveer 68 keer zo duur in OMVANG.

**MAAR — en dit verschuift het onderweg-signaal naar voren — de tijdlijn is misschien niet nodig.**
Kandidaat E levert `decoupling`, `icu_power_hr_z2` en `icu_efficiency_factor` per rit voor NUL extra
verzoeken, in een lijst die Cadans al ophaalt. Voor een TREND over meerdere weken kan dat volstaan.
Blijkt dat zo, dan is het onderweg-signaal de GOEDKOOPSTE van de drie behoeften in plaats van de
duurste. Dat is een ontwerpvraag die deze recon niet beslecht.

---

## 5. Verzoeken aan intervals.icu

**Negentien GET-verzoeken**, alle naar `https://intervals.icu/api/v1`, geen enkele mutatie:

```
 6  vensters en vormen : curves=42d · 6w · 90d · activity · /intervals · /streams
 3  per-rit en combi   : /power-curve · /curves (404) · curves=42d,90d
 1  20-minutenwaarde uit de per-rit-curve
 3  historie-vormen    : oldest/newest · datumbereik · 400d
 2  twee niet-overlappende historische vensters ter bevestiging
 2  hermeting na de pas: monotonie op beide krommen
 2  hermeting na de pas: activity_id rond 20 min · de activiteitenlijst-velden
```

**Waarom dat aantal verantwoord is:** een normale dagsync doet er drie — activiteiten, wellness en de
power-curve. Negentien is dus ongeveer zes dagsyncs, verspreid over enkele minuten, en elk verzoek
beantwoordde een vraag die niet uit de documentatie te halen was.

**De vangrail stond aan.** Elk script telde zijn verzoeken tegen een HARDE bovengrens die GOOIT in
plaats van door te gaan — de les van de vorige ronde, waar een harnas-fout circa 1536 ongewilde
verzoeken opleverde. De sleutel heet `INTERVALS_API_KEY`, komt uit `.dev.vars`, en zijn waarde is
nergens afgedrukt; het athlete-id is in alle uitvoer gemaskeerd.

---

## 6. De weerleggingspas

**EINDSTAND: 1 van de 4 lenzen voltooid, over TWEE pogingen.**

De pas is bewust vroeg gestart, precies om te kunnen herstarten. Dat bleek nodig en het hielp niet:

- **Poging 1** — vier lenzen. Eén voltooide (de behoefte-koppeling, 6 verzoeken). De andere drie
  (inventaris, prijs, historie) stopten met schrijven en leverden **geen enkel resultaat**, ook geen
  foutrapport; hun transcripten bleven 25 minuten onaangeraakt.
- **Poging 2** — de run gestopt en herstart met `resumeFromRunId`. Vier agents kwamen op gang en
  schreven ongeveer een minuut, en stopten toen op dezelfde manier. Na dertien minuten zonder
  beweging is ook die run gestopt.

**Dat is een omgevingsprobleem en geen uitslag.** Vorige ronde stierven er twee van de vier op een
expliciete server-fout (`529 Overloaded`, `Server error mid-response`); deze keer stopten ze zonder
melding. Beide keren raakte het juist de lenzen die het meeste werk deden.

**WAT DIT BETEKENT VOOR DE WAARDE VAN DIT DOCUMENT.** Drie claim-gebieden zijn NIET aangevallen:

| gebied | aangevallen? | rust dus op |
| --- | --- | --- |
| de koppeling weg → behoefte (U1, U2, §3.2, de omrekenregel) | **JA** | lens plus eigen hermeting |
| de INVENTARIS van §1 — is de lijst van vijf endpoints compleet? | **NEE** | mijn eigen grep alleen |
| de PRIJS per weg — verzoeken, opslag, migraties | **deels**, via de voltooide lens | mijn eigen meting plus één lens-bevinding |
| de HISTORIE-claim | **NEE** | mijn eigen drie-vensters-meting alleen |

**Een lens die niet is voltooid is geen geslaagde lens.** De historie-claim is de gevoeligste van de
drie ongetoetste: zij beslist of de doelcheck in februari data heeft. Ik heb haar zelf op drie
niet-overlappende vensters gemeten en op het onderscheid dat ertoe doet (de WATTS bewegen mee, niet
alleen de datum), maar niemand heeft geprobeerd haar te breken. **Wie op dit document verder bouwt,
doet er goed aan die pas alsnog te draaien.**

De voltooide lens haalde de hoofdclaim op vier plekken onderuit. **Alles hieronder is door mij
hermeten voordat ik het overnam.**

De voltooide lens haalde de hoofdclaim op vier plekken onderuit. **Alles hieronder is door mij
hermeten voordat ik het overnam.**

1. **"DIRECT afleesbaar" is onjuist** — de kromme is niet monotoon, aflezen onderschat met ongeveer
   één procent, en de engine leest hem vandaag net zo. Verwerkt in §2 kandidaat A en B.
2. **`curves=42d` is 43 dagen** en loopt tot morgen. Verwerkt in §2.
3. **Meeliften kost nul verzoeken maar niet nul werk** — zie hieronder, dit is de scherpste van de
   vier.
4. **§3.2 draagt TWEE criteria op TWEE grootheden** — zie hieronder.
5. **De omrekenregel bestaat wél** — zie hieronder.
6. **Kandidaat E** — de gratis vierde weg voor behoefte 3, hierboven opgenomen.
7. **Streams zijn geen zuivere 1 Hz** — verwerkt in §2 kandidaat C.

### De prijs van "meeliften" is niet nul

`curves=42d,90d` geeft beide vensters in één verzoek, dus op de VERZOEKENTELLER klopt "gratis". Maar
de bestaande lezer breekt: `readNormalizedPowerCurve` leest `raw?.list?.[0]` DIRECT, en bij
`curves=42d,90d` staat de 42d-curve VOORAAN. Het hele rijdersprofiel — de markers 5s/1m/5m/20m/60m
en het rijderstype — zou stilzwijgend van 90d naar 42d verspringen. Daar komt bij dat
`normalizeWindow` alleen `90d` en `1y` doorlaat en dat `power_curve_cache` een unieke sleutel per
venster draagt. **Meeliften vraagt dus: kiezen op label in plaats van op index, de whitelist
verruimen, en een cache-sleutel toevoegen.** Nog steeds klein, maar geen nulwerk.

### §3.2 vraagt twee dingen, en het venster levert er één

Verbatim uit `docs/DOELEN-SPEC.md` §3.2: BESTEMMING is *"een datum plus een VLOER — bij de overgang
naar Build nog minstens circa 95 procent van de FTP waarmee de winter begon"*; METER is *"het beste
20-minutenvermogen over zes weken zakt niet meer dan enkele procenten"*.

Dat zijn TWEE criteria op TWEE grootheden. Een 42d-piek levert de METER-helft. De BESTEMMING-vloer
vraagt **een FTP op een ankerdatum** — "de FTP waarmee de winter begon" — en die komt niet uit een
piek. In de repo is alleen die vloer gebouwd, en op een derde grootheid (`rolling_ftp` via
`instapNiveau`). Bovendien is de METER een DELTA — "zakt niet meer dan" — dus hij heeft een
BASISLIJN nodig. Die is ophaalbaar met `oldest`/`newest`, maar dat is een tweede verzoek zonder
cache-sleutel.

### De omrekenregel bestaat, en op een andere invoer

`packages/engine/src/workouts/ftp.ts` draagt verbatim: *"Nieuwe FTP = 95% van gemiddeld vermogen over
de 20 min. Vul in op Instellingen."* Dat is 95 procent van het gemiddelde over het TESTBLOK — het
blok heet `20-MIN ALL-OUT` in dezelfde structuur — en NIET 95 procent van de beste 20 minuten van de
hele rit die de kromme teruggeeft. Die twee lopen uiteen zodra het beste venster het testblok niet
exact dekt. Het is bovendien UI-tekst met nul lezers in code.

**ROADMAP punt 69 stelde dat de regel nergens staat; dat is als vindplaats-uitspraak onjuist en is
rechtgezet.** Wat ontbreekt is een regel die op de KROMME-waarde slaat.

### De poort vóór behoefte 1 — en die bestaat wél

De lens wees erop dat de per-rit-kromme een getal geeft voor ELKE rit: de 195 W waarop kandidaat B
rust komt van `i172391866`, en dat is blijkens de activiteitenlijst *"🚴 Coach: Z2 progressief"* — een
Z2-rit. 0,95 × 195 = 185 W tegenover een gezette FTP van 280 zou een verlaging van 34 procent
voorstellen.

**Maar Cadans WEET welke rit een test was, en dat corrigeert de lens.** De testdag draagt een
override met `workoutType: "test"` en `label: testBadgeLabel()`, en `testResultaat` in
`apps/web/src/lib/schema.ts` herkent precies die combinatie al. De poort bestaat dus; zij is alleen
niet met de piek verbonden. Dat maakt weg 2 in het keuzeblok goedkoper dan de lens suggereert — maar
het bevestigt wel dat het endpoint ALLEEN niet genoeg is.

---

## 7. HET KEUZEBLOK — vijf wegen

**Lees dit blok en kies. De drie behoeften hoeven niet dezelfde weg te nemen, en waarschijnlijk
moeten ze dat ook niet.**

### Weg 1 — Alleen de doelcheck, en die is bijna gratis

Je laat de app naast "de laatste 90 dagen" en "het laatste jaar" ook een venster van zes weken
opvragen. Dat past in een verzoek dat de app toch al doet, dus het kost geen extra netwerkverkeer en
vrijwel geen opslag. Je krijgt het beste 20-minutenvermogen over zes weken, met de datum en de rit
erbij, en je kunt het ook met terugwerkende kracht over elk verleden venster opvragen — februari is
dus geen probleem. Je betaalt drie kleine code-ingrepen die niet gratis zijn maar wel klein: de app
moet de juiste kromme op naam kiezen in plaats van op volgorde, het nieuwe venster toelaten, en het
apart bewaren. Je geeft op: de andere twee behoeften. En let op dat dit maar de HELFT van de
doelcheck is — het tweede criterium vraagt de FTP waarmee de winter begon, en dat is een ander getal
dat je apart moet vastleggen.

### Weg 2 — De doelcheck plus het FTP-voorstel

Je doet weg 1, en daar bovenop haalt de app na een gereden testrit de vermogenskromme van díe ene rit
op. De app weet al welke dag een test was, dus zij kan dat gericht doen en niet na elke rit. Je
krijgt: de ijking wordt eindelijk rond — de app vraagt om een meting en doet er ook iets mee. Je
betaalt één extra verzoek per testrit, een kleine vijf kilobyte, en één plek in de database. Je moet
wel eerst kiezen HOE je van twintig minuten naar een drempelwaarde rekent: de app toont vandaag een
regel aan Daan die op het testblok slaat, en de kromme geeft het beste venster van de hele rit. Dat
zijn twee verschillende getallen en je moet er één kiezen.

### Weg 3 — Het onderweg-signaal er gratis bij

Je doet weg 1 of 2, en voor het onderweg-signaal gebruik je wat er al binnenkomt: de
activiteitenlijst draagt per rit al een verhouding tussen vermogen en hartslag en een maat voor hoe
ver die tijdens de rit wegliep. Dat kost nul extra verzoeken en nul extra opslag, want die lijst
wordt al opgehaald — er wordt vandaag alleen niets mee gedaan. Je krijgt een trend over weken, wat
precies de vraag is die het signaal stelt. Je geeft op: je kunt niet zien wélk blok binnen een rit
scheef liep, alleen dat de rit als geheel scheefliep. Voor een signaal dat zegt "kijk hier eens naar"
is dat waarschijnlijk genoeg; voor een diagnose niet.

### Weg 4 — De volledige tijdlijn bewaren

Je bewaart per rit vermogen en hartslag seconde voor seconde. Je krijgt alles wat er te weten valt,
inclusief welk blok scheef liep, en je kunt er later vragen op stellen die je nu nog niet kent. Je
betaalt fors: ongeveer 68 keer zoveel data per rit als de kromme, wat voor een jaar rijden in de
tientallen megabytes loopt, plus een plek om tijdreeksen op te slaan. Let op dat de tijdas gaten
heeft — je moet rekenen met de meegeleverde tijdstempels en niet met de positie in de rij, anders
loopt je meting per rit al een halve minuut scheef. Dit is de enige weg waarbij opslag een echt
onderwerp wordt in plaats van een detail.

### Weg 5 — Eén bron voor alles, langs de ritten

In plaats van twee soorten opvragingen haal je voor élke rit de vermogenskromme op en reken je zelf
uit wat het beste twintig minuten over zes weken was. Je krijgt één manier van werken voor beide
piek-behoeften en een eigen archief dat niet afhangt van hoe intervals.icu zijn vensters afbakent —
wat iets waard is, want dat venster bleek 43 dagen te zijn in plaats van 42 en tot morgen te lopen.
Je betaalt één verzoek per rit in plaats van nul, en om de historie te vullen eenmalig 255 verzoeken
van samen ongeveer anderhalve megabyte. Je geeft op: de gratis route van weg 1.

### Wat er in ELKE weg moet gebeuren

Eén ding is geen keuze. Waar de app een 20-minutenwaarde uit een kromme haalt, moet zij het hoogste
punt vanaf twintig minuten NEMEN en niet de waarde op precies twintig minuten AFLEZEN. Dat scheelt
ongeveer één procent, en de doelcheck oordeelt op "een paar procent" — dus die ene procent is geen
afronding maar een deel van het antwoord. **Dit raakt ook de bestaande niveaukaart**, die vandaag op
dezelfde manier afleest.

<!-- EINDE docs/RITDATA-RECON.md -->
