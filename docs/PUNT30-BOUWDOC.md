# Cadans — PUNT 30: de weeklaadbeurt valt niet meer om op één rij (BOUWDOC)

Spec waartegen gebouwd wordt. Alle "gelezen"- en "gemeten"-uitspraken staan op `b3a3686`.

## 1. Het verdict — GEEN per-kaart-degradatie

ROADMAP punt 30 beschrijft het symptoom: valt één van de rijen weg die het view-model voedt, dan
verdwijnt niet die ene kaart maar het HELE weekscherm, met `not found` en een Opnieuw-knop. De
voor de hand liggende fix is degradatie — laat de rij vallen, laat de bijbehorende kaart weg, toon
de rest. **Die komt er niet, en dat is een besluit met grond.**

TWAALF VAN DE VIJFTIEN RIJEN VOEDEN HET PLAN. `loadSchemaWeek` haalt vijftien rijen op met één
`Promise.all` (`apps/web/src/lib/schema.ts:1341`) en geeft er twaalf door aan
`buildWeekProposal`. En de getoonde week wordt daarna via `persistWeekplan` (`:1613`) weggeschreven
als PLAN-VAN-RECORD voor vandaag en vooruit.

Een stil vervangen rij levert dus geen ontbrekende kaart maar een **ANDER plan-van-record**. Zelfde
vorm als punt 26: daar verdween het plan van een gereden dag omdat de payload hem niet meer noemde,
en het herstel achteraf leverde een ander plan dan er die ochtend stond. Degraderen op de leeskant
en dan schrijven is precies dat patroon, nu op vijftien rijen tegelijk.

## 2. Wat er overblijft als veilig degradeerbaar: één rij

Van de vijftien voeden er drie `buildWeekProposal` niet. Gelezen:

- `dispositions` — alleen weergave, gelezen op `:1623`.
- `powerZonesRow` — voedt `zone5Grenzen` (`:1483`), en die grenzen dragen een OORDEEL: de
  blok-terugblik en de weekstem poorten erop.
- `doelPassendRow` — voedt de antwoord-poort van de doel-passendheid-kaart (`:1550`, `:1551`), en
  die ONDERDRUKT een kaart. Valt die rij weg, dan komt een al beantwoorde vraag terug.

Er blijft dus precies ÉÉN rij over die je veilig kunt laten vallen. **Een degradatiemachine voor
één rij is machinerie voor een gat dat de beslissing niet raakt.** De kosten (een tweede
code-pad door de hele view-model-bouw, dat per definitie zelden loopt en dus zelden getoetst wordt)
staan niet in verhouding.

## 3. De twee termen die er wel komen

**T1 — BEGRENSDE HERHALING VAN DE HELE BOUW.** Faalt de laadbeurt, dan wordt hij opnieuw
geprobeerd, met een korte pauze ertussen. Alles of niets: er wordt niets gedegradeerd en er wordt
niets weggeschreven zolang de bouw niet slaagt.

**T2 — DE GEVALLEN RIJ BIJ NAAM.** De vijftien rijen krijgen een LABEL en worden fouttolerant
verzameld, zodat de melding niet meer "de eerste de beste afwijzing" is maar zegt WELKE rij viel en
waarom. Dat is geen degradatie: valt er een rij, dan faalt de bouw nog steeds — hij is alleen niet
langer anoniem.

## 4. De sterkste grond voor T1 staat niet in ROADMAP punt 30

Punt 30 noemt twee gemeten gevallen: het propagatievenster na een deploy, en de verouderde
dev-worker. **Dat zijn de ZELDZAME gevallen.**

De sterkste grond is alledaags: dit is een PWA op een telefoon die bij elke pageload VIJFTIEN
parallelle verzoeken doet. Eén time-out op een slechte verbinding — in de trein, in een parkeergarage,
op een half bereik — kost vandaag het hele weekscherm. Dat gebeurt niet één keer per deploy maar
zo vaak als Daans verbinding hapert, en het is precies het moment waarop hij zijn plan wil zien.

## 5. De grens, expliciet

**DE HERHALING DEKT HET PROPAGATIEVENSTER NIET.** Gemeten bij de punt-12-deploy: `GET
/api/doel-passend` gaf 404 en pas circa twintig seconden later 200. Een herhaling die daar
doorheen wil komen moet dus twintig seconden wachten — en dan maakt hij van een ECHT dode route
een blanco scherm van twintig seconden.

Dat is de verkeerde ruil. De herhaling mikt op de korte hapering (een enkele time-out, een
TCP-reset), niet op een deploy. Een deploy-venster hoort door punt 29 gevangen te worden, aan de
harness-kant, en niet door de gebruiker uit te zitten.

## 6. Herkomst van de drie herhaal-getallen: BELEID

Drie pogingen, met 600 en 1800 milliseconden ertussen. **HERKOMST: BELEID, geen ijking.**

Er valt hier geen signaal te bemonsteren — een herhaalinterval drukt een afweging uit tussen "nog
even wachten" en "zeg dat het stuk is", en die afweging is een keuze, geen meetbare grens. Er hoort
dus GEEN plateau-toets bij, en een volgende chat moet er ook geen data voor gaan zoeken. Zelfde
categorie als de testfrequentie: label de constante in de code expliciet als beleid, anders gaat
iemand hem op data zoeken die het antwoord niet bevat.

De onderbouwing die er wél is: drie pogingen met die pauzes kosten bij een echt dode backend
hoogstens ongeveer 2,4 seconden extra voordat de melding verschijnt, en dat is korter dan de tijd
die een gebruiker zelf zou nemen om op Opnieuw te tikken.

## 7. Wat hier NIET in zit

- Per-kaart-degradatie. Gesloten, zie §1 en §2.
- De mount-syncs op `Schema.tsx:100`. Die staan BUITEN `loadSchemaWeek`, draaien al via
  `Promise.allSettled` en blijven waar ze staan.
- `getCheckin` (`api.ts:338`) is de enige fouttolerante getter van de vijftien en blijft zoals hij
  is; 404 betekent daar "nog niet ingevuld", geen fout.
- Elke wijziging in `packages/engine` of `workers/api`.

## 8. Acceptatie

- Rood per plek, elk LOS gemeten met alleen die ene term teruggedraaid, en elke rood-patch vooraf
  gegrept op zijn eigen markering.
- Het rapport noemt de CALL-SITE van elke nieuw geëxporteerde functie. Getest is niet aangesloten.
- CLIENT-ONLY: `git diff --stat` over `packages/engine` en `workers/api` leeg.
- CAMERA: op het GROENE pad vuurt er niets, dus er hoort NUL te bewegen — instrument eerst ijken
  op twee gelijke VOOR-runs, dan de NA-run, en vergelijken over 93 shots (`v7/09-vorm` en
  `v7/10-trainingen` vallen af, die zijn niet byte-deterministisch).
- **DE FOUTTAK IS NIET TE FOTOGRAFEREN**, en dat is een grens en geen omissie: de harness kan geen
  route laten uitvallen. Die tak is door tests gedekt, niet door het beeld.
