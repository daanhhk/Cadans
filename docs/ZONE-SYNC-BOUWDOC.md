# Cadans — ZONE-SYNC BOUWDOC (punt 6 fase 2)

Bouwdoc, GEEN bouw. Uitwerking van `docs/ZONE-MUNT-ONTWERP.md` §5 stap 2. Bouwen pas na review.

## 1. Instrument

Chat-zijde gelezen op een read-only kloon van de gecommitte repo en gedraaid met esbuild buiten de
repo-tree, `TZ=Europe/Amsterdam`, tegen `353e071`. Elke "gemeten"-uitspraak hieronder is gedraaid of
met grep geteld, niet gelezen.

## 2. De hele live oppervlakte is ÉÉN regel

GETELD. `zone5Grenzen` (`apps/web/src/lib/zonemunt.ts`) heeft NUL aanroepers buiten zijn eigen test —
dood aan zijn invoer. `planZone5_` wordt alleen door `bibliotheekSignatuur` en tests aangeroepen.
`bibliotheekSignatuur` heeft precies één aanroeper in app-code: `blokDosisNorm`
(`apps/web/src/lib/blok.ts`), met `ZONE5_GRENZEN_DEFAULT` hard meegegeven.

Fase 2 is dus geen verbouwing maar het aansluiten van één bestaande, geteste functie op één
bestaande aanroep.

DE GELEVERDE KANT BEWEEGT NIET. `actualZone5_` neemt met opzet geen grenzen: intervals heeft ze bij
het analyseren van de rit al toegepast en levert de blob gebucket als Z1..Z7. De sync verplaatst
uitsluitend de VORM van de norm, nooit wat er geleverd is gemeten.

## 3. Correctie op §5 stap 2 — de kolom komt op `sync_state`, niet op `settings`

`ZONE-MUNT-ONTWERP` §5 stap 2 zegt "een kolom op `settings`". GELEZEN in `workers/api/src/db/repo.ts`:
`writeSettings` bouwt één `vals`-object met `?? null` voor élk veld en gebruikt dat voor zowel de
insert als de `onConflictDoUpdate`-set. `PUT /api/settings` is daarmee FULL-REPLACE. Een
gesynchroniseerde kolom op `settings` zou bij elke opslag vanuit de Instellingen-pagina leeggemaakt
worden, tenzij hij buiten `vals` gehouden wordt — en dan leeft er een uitzondering in een functie die
verder geen uitzonderingen kent.

`sync_state` is bovendien de gedocumenteerde plek: settings = config die de gebruiker zet, sync_state
= runtime-state die de app opbouwt. Het precedent staat er twee keer (`fatigue_shift`, `dosis_trede`),
inclusief een repo-schrijver die ALLEEN zijn eigen kolommen raakt.

BESLUIT: één nieuwe kolom `sync_state.power_zones_json` (TEXT, de rauwe array als JSON-string). Geen
tweede kolom voor een tijdstip: niets zou hem lezen, en een kolom zonder lezer is dode code.

## 4. De bron — de nieuwste fiets-rit, niet een tweede endpoint

GEMETEN, en dit vervangt de eerste opzet. `fetchActivities`
(`workers/api/src/integrations/intervals.ts`) haalt VOLLEDIGE activiteit-objecten op — geen
`fields`-param, "zoals de GAS-sync" — over een venster van 28 dagen, en elk activiteit-object draagt
`icu_power_zones`. Gemeten `[55,75,90,105,120,150,999]`: exact dezelfde bovengrenzen als
`power_zones` in de sport-settings (`docs/DOSIS-MUNT-MEETDATA.md` §B2). De grenzen zijn dus AL
binnen; ze worden vandaag alleen weggegooid.

BESLUIT: de zone-grenzen worden afgeleid binnen de BESTAANDE `syncActivities`, uit de NIEUWSTE
activiteit waarvan `type` in `CYCLING_TYPES` valt (`Ride`, `VirtualRide`, `GravelRide`,
`MountainBikeRide`) én waarvan `icu_power_zones` een bruikbare oplopende array van minstens vier
getallen is. Levert de sync er geen, dan wordt er NIETS weggeschreven en blijft de vorige waarde
staan.

WAT DAT UITSPAART tegenover een `GET /athlete/{id}/sport-settings`: een tweede upstream-endpoint,
een integratie-module, een `POST /api/sync/zones`-route, en een VIERDE schrijfactie per pageload.
Wat overblijft is één extra upsert binnen een sync die toch al schrijft.

WAT HET KOST, eerlijk. Wijzigt een gebruiker zijn zones in intervals en rijdt hij daarna niet, dan
volgt de norm pas bij de eerstvolgende rit. Dat is aanvaardbaar en waarschijnlijk correcter: zonder
rit is er ook geen geleverde kant die verschoven is. Wat GEEN van beide routes oplost is een
zone-wijziging MIDDEN in een blok — daarvoor moeten de grenzen PER RIT bewaard worden, en dat is de
geparkeerde post in §9.

## 5. De weg door de app

1. `syncActivities` leidt de grenzen af zoals in §4 en schrijft ze weg. Geen nieuwe route, geen
   nieuwe fetch, geen nieuwe integratie-module.
2. `writePowerZones` in `workers/api/src/db/repo.ts` — upsert die ALLEEN de nieuwe kolom raakt, naar
   het model van `writeDosisTrede`.
3. `GET /api/power-zones` → `{ powerZones: number[] | null }`, naar het model van
   `GET /api/dosis-trede`.
4. `loadSchemaWeek` haalt hem op in dezelfde `Promise.all`.
5. `deriveSchemaView` maakt er `zone5Grenzen(powerZones)` van en geeft die door aan
   `buildBlokReferent` en aan het dosis-trede-voorstel.
6. `blokDosisNorm` krijgt een OPTIONELE TRAILING PARAMETER `grenzen`, default
   `ZONE5_GRENZEN_DEFAULT` — idioom van `dosisTrede`. Elke bestaande aanroep en elke fixture blijft
   daarmee byte-identiek.

WANNEER HIJ VUURT. Vanzelf, mee met de activiteiten-sync die `apps/web/src/pages/Schema.tsx` al bij
mount doet, achter dezelfde staleness-guard. HET AANTAL SCHRIJFACTIES PER PAGELOAD BLIJFT DRIE: er
komt alleen één rij-update bij binnen een route die toch al schrijft. Het besluit in
`docs/WERKWIJZE.md` over de mount-sync blijft daarmee ongemoeid — er valt niets aan te herzien.

## 6. Inertheid en falen

`zone5Grenzen` valt terug op de default bij ontbrekend, te kort, niet-numeriek of niet-oplopend. Zolang
de sync niet gelopen is, faalt of onbruikbaar antwoordt, is het gedrag EXACT dat van vandaag. Dat is de
veiligheidseigenschap van deze bouw: de migratie kan vóór de deploy landen zonder iets te raken, want
een nullable kolom die niemand leest verandert niets.

BIJ DAAN IS DE SYNC GEDRAAGSNEUTRAAL, PER CONSTRUCTIE. Zijn eerste vier grenzen zijn [55, 75, 90, 105]
— exact `ZONE5_GRENZEN_DEFAULT`. De winst is een tweede gebruiker en een latere zone-wijziging.

## 7. Hoe het bewezen wordt

Gedragsneutraal bij Daan betekent dat een voor/na-vergelijking op zijn data niets kan aantonen. Het
bewijs valt daarom in tweeën.

- DAT HET NIETS VERSCHUIFT: de shot-harness voor en na, zelfde machine, niets ertussen dat de lokale
  D1 raakt, alle shots byte-identiek op bytecount én sha256. Sinds `361bbd7` draagt elk scenario de
  blok-kaart, dus die vergelijking heeft nu beeld om op te vallen.
- DAT HET IETS DOET: met ANDERE grenzen moet de norm meebewegen, PER PLEK rood gemeten.
  `blokDosisNorm` met [55, 75, 85, 105] geeft een andere zone-verdeling dan met de default; en de weg
  van route naar norm wordt APART getoetst, zodat een `deriveSchemaView` die de opgehaalde waarde
  negeert en stil de default blijft gebruiken ROOD wordt. Een pad kan dood zijn aan zijn invoer.

## 8. Fasering

1. DATA — migratie, kolom, repo-schrijver, de afleiding binnen `syncActivities`,
   `GET /api/power-zones`, routetests. Nog geen lezer. STOP.
2. CLIENT — api-client, `loadSchemaWeek`, `deriveSchemaView`, de trailing parameter op
   `blokDosisNorm`, tests inclusief de aangesloten-toets. STOP.
3. PROD — migratie REMOTE eerst, dan `pnpm build`, dan `wrangler deploy` vanuit `workers/api`. Daarna
   de harness tegen prod plus Daans oog.

## 9. Wat open blijft

- DE HISTORISCHE GRENZEN. Elke activiteit draagt `icu_power_zones` mee, maar die wordt niet
  opgeslagen, dus een zone-wijziging is niet met terugwerkende kracht te herleiden. Ongewijzigd
  geparkeerd; de grenzen staan sinds het begin van de reeks stil. Sinds §4 komen de grenzen zélf
  uit een rit, dus dit is het enige dat nog aan de per-rit-kant ontbreekt: de grenzen worden niet
  per activiteit bewaard, alleen de nieuwste wint.
- `indoor_ftp` 260 TEGEN `ftp` 280. Dezelfde respons draagt `indoor_ftp`, dus deze post wordt door
  deze bouw goedkoper — maar hij hoort er niet bij en wordt hier niet aangeraakt.
- DE POORT IS EEN HALVE MINUUT STRENGER DAN DE NORM. GEMETEN: een week die exact de norm levert in
  exact de bibliotheek-vorm haalt de zone-poort op geen enkel doorgerekend dosisniveau (84, 90, 96,
  102, 108, 66, 56, 50) — hij valt telkens op minstens één zone om, omdat de drie zone-normen elk
  apart afronden (tot +0,5 minuut) terwijl de splitsing exact is. Hooguit een halve minuut per zone en
  op echte ritten niet waarneembaar; genoteerd zodat het bij een volgende aanraking geen verrassing is.
- HET LOKALE BEELD IS NIET HET PROD-BEELD. De harness toont blok 29-06 t/m 26-07 als GELEVERD, terwijl
  datzelfde blok op prod 2/3, 1/3 en 2/3 zones haalde en dus niet-geleverd las. De lokale D1 draagt
  andere historie dan prod; dat is geen regressie en geen herijk-aanleiding, maar het hoort bij de
  prod-verificatie tegen het scherm gelegd te worden.
