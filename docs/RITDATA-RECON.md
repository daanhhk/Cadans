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

~~**EN DE 20-MINUTENWAARDE IS NIET AF TE LEZEN — hij moet GEREKEND worden.**~~

> **INGETROKKEN 24-08-2026 — DEZE HELE PASSAGE WAS FOUT. Zie §8.** De WAARNEMING klopt en blijft
> staan: de `values`-reeks is niet monotoon dalend (11 schendingen op de 42d-curve), en op rit
> `i166073333` staat er `1140s = 265 W · 1200s = 261 W · 1260s = 263 W · 1320s = 263 W ·
> 1380s = 264 W · 1440s = 261 W`. De CONCLUSIE eronder was onjuist. *"Een echte mean-max-kromme kan
> dat niet"* is wiskundig fout — een mean-max-kromme KAN stijgen met de duur, want een langer venster
> mag een zwak midden meenemen zolang beide sterke randen erin passen. Tegenvoorbeeld met de hand:
> het signaal `[10, 0, 10]` heeft een beste 2s-gemiddelde van 5,00 W en een beste 3s-gemiddelde van
> 6,67 W. **Aflezen op `secs 1200` onderschat dus NIETS**: 261 W is het beste twintigminutenblok en
> 264 W het beste drieëntwintigminutenblok — twee grootheden, twee antwoorden, allebei juist.
> `pcMarkerAt_` leest correct, en de bestaande niveaukaart is in orde. **Neem uit deze passage geen
> lopend maximum over.** Dit is in deze ronde alsnog rechtgezet; §8 stond al goed maar deze
> meetsectie was blijven staan.

**WAT ER WÉL UIT VOLGT:** lees een duurwaarde op HAAR EIGEN duurpunt. De 20-minutenwaarde staat op
`secs = 1200` en nergens anders. Gemeten op de per-rit-curve van `i172391866`:
`secs.indexOf(1200) = 109`, `values[109] = 195 W` — een exact roosterpunt, dus zonder interpolatie
en zonder een naburig punt te lenen.

### Kandidaat B — de PER-RIT curve: `/activity/{id}/power-curve`

```
GET /activity/i172391866/power-curve  ->  200, 5353 bytes
secs: array[153] van 1 tot 4500       values: array[153]
   300s =  211 W      1200s =  195 W      3600s =  191 W
```

Bestaat, en geeft de 20-minutenwaarde van ÉÉN rit — DIRECT AFLEESBAAR op het exacte roosterpunt
`secs = 1200` (gemeten: `secs.indexOf(1200) = 109`, `values[109] = 195 W`). Ook deze kromme stijgt
plaatselijk (13 stijgende stappen van de 152), en dat is ECHT en wordt NIET gerepareerd — zie §8.
Naast `secs`/`values` draagt de respons
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
kromme, en de waarde staat DIRECT AFLEESBAAR op haar eigen duurpunt `secs = 1200`. ~~Maar er moet
wél GEREKEND worden — een lopend maximum over de kromme.~~ **INGETROKKEN 24-08-2026, zie §8: er hoeft
niets gerekend te worden.** Het lopende maximum was juist de fout.

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

~~Eén ding is geen keuze. Waar de app een 20-minutenwaarde uit een kromme haalt, moet zij het hoogste
punt vanaf twintig minuten NEMEN en niet de waarde op precies twintig minuten AFLEZEN.~~

**DOORGEHAALD, en zie §8: deze alinea was FOUT.** Zij rustte op de aanname dat een mean-max-kromme
niet kan stijgen met de duur. Dat is wiskundig onjuist. De waarde op precies twintig minuten AFLEZEN
is de JUISTE lezing; het hoogste punt vanaf twintig minuten nemen levert een getal op dat de renner
niet gereden heeft. Er is hier dus géén reparatie nodig — niet in een nieuwe weg, en niet in de
bestaande niveaukaart.

---

## 8. GEEN REPARATIE — de krommelezer had GELIJK (ROADMAP punt 70)

**NUMMERING:** de ronde heette in de prompt "punt 68", maar in `docs/ROADMAP.md` was 68 al bezet door
*"De per-blok-antwoorden dragen TWEE doel-kolommen, niet drie"* en 69 door *"HET FTP-VOORSTEL NA EEN
GEREDEN TEST"* — het punt waar §7 van dit document naar verwijst. Dit item staat daarom als
**punt 70**, met twee bijvangsten als 71 en 72.

**Deze ronde is een INTREKKING.** Punt 68 bestond om een leesfout te repareren. Die leesfout bestaat
niet. De reparatie is geschreven, groen getest, en daarna volledig teruggedraaid. Wat hier staat is
het bewijs, want de verkeerde aanname is aantrekkelijk en zal terugkomen.

### De aanname die het hele punt droeg — en die ONJUIST is

Verbatim zoals zij in de diagnose stond:

> Een mean-max-kromme hoort niet te STIJGEN met de duur: wie X watt over 23 minuten volhield, hield
> per definitie ook ergens 20 minuten ≥X watt vol.

De tweede helft klinkt als een stelling maar is er geen. Tegenvoorbeeld, met de hand na te rekenen —
het vermogenssignaal `[10, 0, 10]`:

```
beste 1s-gemiddelde: 10,00 W
beste 2s-gemiddelde:  5,00 W      <- de twee vensters zijn [10,0] en [0,10]
beste 3s-gemiddelde:  6,67 W      <- HOGER dan het beste 2s-gemiddelde
```

De mean-max-kromme STIJGT hier van 2 naar 3 seconden. De reden is meteen het mechanisme: bij een
langer venster mag het ZWAKKE MIDDEN meegeteld worden zolang beide STERKE RANDEN erin passen. Een
korter venster moet één rand opgeven. **Een mean-max-kromme is niet monotoon, en hoeft dat niet te
zijn.**

### En het gebeurt ECHT, op Daans eigen data

Herberekend uit de rauwe 1 Hz-`watts`-stream van rit `i171448183` (4407 samples), uitputtend over
alle vensters — niet uit de kromme van intervals.icu, maar uit de brondata eronder:

```
beste 130s: 346,700 W   (over 4278 vensters)
beste 140s: 357,643 W   (over 4268 vensters)   STIJGT
beste 150s: 363,973 W   (over 4258 vensters)   STIJGT
beste 160s: 366,606 W   (over 4248 vensters)   STIJGT
beste 165s: 366,927 W   (over 4243 vensters)   STIJGT
beste 170s: 366,388 W   (over 4238 vensters)
beste 180s: 360,894 W   (over 4228 vensters)
```

De beslissende toets, want er is één ontsnappingsroute denkbaar — misschien ligt het beste 140s-blok
gewoon ergens anders in de rit:

```
beste 165s over de hele rit        : 366,927 W
beste 140s over de hele rit        : 357,643 W
beste 140s BINNEN dat 165s-venster : 357,643 W   <- hetzelfde blok, en LAGER
```

Het beste 140s-blok van de hele rit ligt IN het beste 165s-venster, en haalt daar 357,6 W. De
stijging is dus echt en niet een kwestie van twee losse inspanningen.

### Wat de "reparatie" gedaan zou hebben

Zij zette op 140 s het lopende maximum, dus **366,9 W — een gemiddelde dat in geen van de 4268
140-seconden-vensters van die rit voorkomt.** Zij verving een JUIST getal door een ONHAALBAAR getal.

Daarmee valt ook het concrete geval dat de ronde in gang zette. Op het 42d-venster stond 261 W op
1200 s en 264 W op 1380 s. Dat is geen leesfout: 261 W IS het beste twintigminutenblok, en 264 W is
het beste drieëntwintigminutenblok. Twee verschillende vragen, twee verschillende antwoorden, allebei
goed. `pcMarkerAt_` las correct.

### De verwachtingen, en wat er precies omviel

| | uitkomst |
| --- | --- |
| **P1** — de niet-monotonie zit in de BRON | **HOUDT**, maar betekent iets anders |
| **P2** — het lopende maximum is nooit lager | het GETAL houdt, de LEZING valt |
| **P3** — één gedeelde functie, geen engine-wijziging | **VALT** — er is niets te repareren |

**P1 houdt en is nu juist geruststellend.** `power_curve_cache.raw_json` is een verbatim
`JSON.stringify` van de API-respons; de schendingen zitten al in die eigen kopie (1y: 9 op 222
punten; 90d: 7 op 185; 42d: 16 op 159). Cadans veroorzaakt ze niet — maar het zijn ook geen
schendingen. Het is een echte eigenschap van de renner zijn data.

**P2 is de leerzame.** De meting deed precies wat zij beloofde: over 566 punten op drie vensters was
het lopende maximum 0 keer lager. Dat is waar en het is nietszeggend, want een lopend maximum KAN
niet lager zijn — dat is de definitie, geen bevinding. De meting bevestigde het getal en zei niets
over de vraag of dat getal het juiste antwoord is. *Een meting die niet kan falen, toetst niets.*

### Wat er is teruggedraaid

`monotoniseerKromme` en de bedrading in `workers/api/src/integrations/powercurve.ts`, plus de vijf
tests in `workers/api/test/powercurve.test.ts`. Teruggedraaid met een pad-scoped
`git checkout HEAD --` op precies die twee bestanden; `git diff workers/api` is daarna leeg en
`grep -c monotoniseer` geeft 0 in beide. `packages/engine` is nooit aangeraakt.

### Verzoeken aan intervals.icu

**DRIE GET-verzoeken** in deze ronde: twee voor het 42d-venster tijdens de diagnose, één voor de
`watts`-stream van `i171448183` bij de naméting hierboven. Geen mutatie, nergens. De sleutel heet
`INTERVALS_API_KEY` en zijn waarde staat nergens.

### De weerleggingspas — DRIE VAN DRIE VOLTOOID

| lens | uitkomst |
| --- | --- |
| `bron-of-pad` | **VOLTOOID** — weerlegt de premisse; hierboven zelf nagemeten en bevestigd |
| `lezers` | **VOLTOOID** — weerlegt "dit is de enige ingang"; zelf nagemeten en bevestigd |
| `slechter` | **VOLTOOID** — bevestigt het getal van P2, en legt bloot dat het niets toetst |

Twee bevindingen van `lezers` zijn zelf nagemeten en blijven staan als kennis, ook nu de reparatie
weg is:

**Er is een DERDE lezer, buiten de grens die ik "de enige ingang" noemde.**
`scripts/powercurve-smoke.mjs:61` bouwt zijn eigen intervals-URL en roept `pcNormalize_` rechtstreeks
aan uit `packages/engine/dist`. Wie ooit iets aan die grens verandert, moet dit script meenemen — de
transformatie in `powercurve.ts` bereikt het niet.

**De `curve`-array in de DTO heeft GEEN enkele lezer.** De getekende grafiek komt uit `markers`:
`Rijdersprofiel.tsx:45` is `function CurveChart({ markers }: { markers: PowerCurveMarker[] })`, en de
component leest verder alleen `profile.markers` en `profile.riderType`. De curve-lus in
`pcNormalize_` rekent dus een array uit die over de lijn gaat en daarna wordt weggegooid. Dood hout
(CHECK 27) — niet in deze ronde opgeruimd, wel hier vastgelegd.

### Wat blijft er over als open vraag

Eén, en klein. `pcMarkerAt_` neemt de EERSTE index waar `secs[i] >= targetSec`. Heeft een kromme geen
punt op precies 1200 s, dan leest hij het eerste punt DAARBOVEN en zet dat onder het label "20m" —
een langere duur onder een kortere naam. Op de gemeten vensters deed dat geval zich niet voor (er
stond een exact 1200 s-punt). Genoteerd, niet gerepareerd.

## 9. De weerleggingspas draait vanaf nu VOOROP

**Volgorde-besluit van deze ronde, en het is met schade betaald.** Twee rondes op rij is de pas
grotendeels gestorven op serverfouten — bij punt 65 twee van de vier lenzen (`529 Overloaded` en
`Server error mid-response`), bij punt 49 drie van de vier, en daar hielp een herstart ook niet.
Beide keren bleven juist de DRAGENDE claims ongetoetst, omdat de pas als SLUITSTUK draaide en er
geen tijd meer was.

**Vanaf nu draait hij zodra de diagnose staat en VÓÓR de reparatie geschreven wordt.** Dan is er
ruimte om te herstarten, en valt er iets om, dan valt het om vóórdat er code op gebouwd is. Vastgelegd
in `docs/WERKWIJZE.md`.

**EN HIJ VERDIENDE ZICHZELF DEZELFDE RONDE TERUG.** Drie van drie lenzen voltooid, en één van hen
haalde de premisse onderuit waar de hele ronde op stond. Was de pas als sluitstuk gedraaid, dan was
`monotoniseerKromme` groen, getest, gecommit en gedeployd geweest — een functie die correcte watts
vervangt door watts die nooit gereden zijn, precies op de waarde waar de doelcheck straks op
oordeelt. De ronde levert nu geen code op, en dat is de winst.

**DE DIEPERE LES, en die is groter dan deze ronde.** Alle drie de verwachtingen waren toetsbaar
geformuleerd en twee ervan werden bevestigd door echte metingen op echte data. Toch was de conclusie
fout, want geen van die metingen raakte de AANNAME eronder. P2 mat of het lopende maximum ooit lager
uitkomt — en een lopend maximum kán niet lager uitkomen. Dat is geen zwakke toets, dat is geen toets.

Daarom: **een claim die op een wiskundige of definitorische eigenschap rust, toets je met een
tegenvoorbeeld voordat je erop bouwt — niet met een meting die de eigenschap veronderstelt.** Het
tegenvoorbeeld dat deze ronde omdraaide is `[10, 0, 10]` en kost tien seconden met de hand.
Vastgelegd als CHECK 40 in `docs/CC-CHECKS.md`.

<!-- EINDE docs/RITDATA-RECON.md -->
