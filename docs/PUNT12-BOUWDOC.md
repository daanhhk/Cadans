# Cadans — PUNT 12: doel-passendheid (BOUWDOC)

Spec waartegen gebouwd wordt. Norm: `docs/DOELEN-SPEC.md` §2A (DOEL-PASSENDHEID) en §6 stap 6.
Alle "gelezen"- en "gemeten"-uitspraken hieronder staan op Cadans `d8f06f6`.

## 1. Wat er is en wat er niet is

GELEZEN: er bestaat geen enkel doel-passendheid-mechanisme. De schaarste-regel uit §2A leeft
alleen als commentaar (`blok.ts:43`, `blok.ts:182`, `archetypes.ts:1614`, `archetypes.ts:1661`).

De uren waarop geoordeeld wordt zijn de GEDECLAREERDE weekuren uit Instellingen
(`settings.weekUren`), niet de som van de weekplanner-dagminuten. Dat is VASTGESTELD in §2A:
de gedeclareerde uren zijn MEETLAT-invoer en blijven expliciet GEEN planner-invoer. Dezelfde
bron voedt vandaag al `blokDosisNorm` (`apps/web/src/lib/blok.ts:152`).

## 2. De norm — de urenvloeren

HERKOMST: PLAN. Coach-canon uit `docs/DOELEN-SPEC.md`, geen geijkte drempel; er valt hier niets
te bemonsteren en er hoort dus geen plateau-toets bij.

- Korte beklimmingen: 5 uur. §3.3 — "Onder circa vijf uur in het voorjaar past het doel niet en
  hoort de coach dat te zeggen (M40)."
- Lange beklimmingen: 6 uur. §3.4 — "onder circa zes a acht uur niet fatsoenlijk te bedienen".
  De ONDERKANT van dat bereik is gekozen: een kaart die vuurt is een ingreep, dus liever te
  weinig dan te veel.
- Conditie: 4 uur. §3.5 — "Onder circa vier uur is het doel niet te bedienen".
- FTP en Onderhoud: GEEN vloer. §3.1 noemt FTP bij weinig uren de ruggengraat; §3.2 geeft
  Onderhoud drie kwaliteitsdagen ook bij drie uur.

Strikt onder: bij precies 5 uur past Korte beklimmingen. De doel-strings zijn die van
`DOEL_OPTIONS` (`packages/engine/src/phase.ts:12`); de vergelijking loopt over
`normalizeDoel_`, zodat een legacy-string uit D1 op hetzelfde profiel valt.

## 3. De meting die de kaart draagt

GEMETEN op `d8f06f6`: `buildWeekProposal` en `blokDosisNorm` gebundeld met esbuild buiten de
repo-tree, `TZ=Europe/Amsterdam`, de klok gepind met een Proxy op de ECHTE `Date`-constructor
(geen subclass — die breekt `instanceof`). Kwaliteitsminuten = som van `intent.high` plus
`intent.anaerobic` over alle sessies, dezelfde metriek als `weekvormAs.test.ts`.

Bij weinig uren levert een klim-doel MINDER kwaliteit dan FTP:
- weekvorm 2,75u (ma45 di60 do60), Base: Korte beklimmingen 30, FTP 40. Build: 29 tegen 40.
- weekvorm 3,75u (+ za60), Build: Korte beklimmingen 43, FTP 61.
- weekvorm 4,75u (+ za120), Build: Korte beklimmingen 65, Lange beklimmingen 75, FTP 85.

De norm onder vijf gedeclareerde uren valt bij ELK doel op 2 prikkels: FTP 2x28=56, Conditie /
Korte / Lange 2x26=52, Onderhoud 3x22=66. Bij vijf uur in Build: FTP 84, de drie andere 78,
Onderhoud 66.

EEN TEGENRICHTING, EN DIE HOORT ERBIJ. In Peak keert het om: bij 2,75u levert Korte
beklimmingen 29 en FTP 21. De kaart claimt dus PASSENDHEID, niet "meer minuten". Elke copy die
belooft dat wisselen meer kwaliteit oplevert is niet gedekt door deze meting.

## 4. Het besluit

TRIGGER, vier voorwaarden, elk apart zodat er per voorwaarde een rood-test bestaat:
1. `blokWeekVanWeek(doelStart, weekMonday) === 1` — de blokgrens uit §2A.
2. `weekUren` is een eindig getal groter dan 0. Geen uren, geen oordeel (M5).
3. Het genormaliseerde doel draagt een vloer en `weekUren < vloer`.
4. Er is voor deze blokstart nog geen antwoord voor DIT doel.

HET VOORSTEL IS ALTIJD FTP. Grond: de kaart vuurt per constructie alleen wanneer er een
OPBOUWEND doel staat met te weinig uren, en het eerlijke alternatief is dan het opbouwende doel
dat bij weinig uren werkt (§3.1). Onderhoud is een bewuste seizoenskeuze (§5) en draagt zelf
geen vloer, dus zodra dat doel staat kan de kaart niet vuren.

DE JA-TIK VERZET OOK `doelStart`, naar de maandag van de blokgrens — dat is de maandag van de
lopende week, want voorwaarde 1 eist blokweek 1. Een nieuw doel begint daarmee een eigen
12-weeks blok op Base, en de 4-weekse cyclus staat daar toch al op 1. GELEZEN dat dit vandaag
NIET gebeurt: `doel` en `doelStart` zijn twee losse formuliervelden en `doelStart` heeft precies
een schrijver (`apps/web/src/lib/settings.ts:95`). Dat dit buiten deze kaart ook hoort te
gebeuren is een BREDER gat en staat als apart punt in `docs/ROADMAP.md`.

DE SCHRIJFKANT IS EEN VALKUIL EN WORDT AAN BEIDE UITEINDEN GEDEKT. `PUT /api/settings`
(`workers/api/src/routes/api.ts:766`) is FULL-REPLACE: `writeSettings` (`repo.ts:56`) zet elk
weggelaten veld op `null`. De ja-tik stuurt daarom het VOLLEDIGE huidige settings-object mee
met alleen `doel` en `doelStart` vervangen. Een partiele write zou ftp, gewicht, weekUren en
doelStart legen.

## 5. De bouw

DATA. Migratie `0010`, gegenereerd met drizzle-kit (niet met de hand geschreven), twee kolommen
op `sync_state`, spiegel van `dosisTredeBlok` / `dosisTredeDoel`:
- `doel_passend_blok` (text) — de blokstart-maandag waarvoor geantwoord is.
- `doel_passend_doel` (text) — het doel waarvoor geantwoord is. Wisselt de gebruiker binnen het
  blok naar een ander niet-passend doel, dan is dat een NIEUW besluit en hoort de vraag terug.
Alleen "nee" hoeft bewaard: na "ja" past het doel en kan de kaart per constructie niet vuren.
Lokaal toepassen; REMOTE toepassen hoort bij de deploy-ronde en is approval-gated.

WORKER. `GET`/`PUT /api/doel-passend`, exact de vorm van `/api/event-overname`
(`api.ts:621` en `:630`), met `readDoelPassend` / `writeDoelPassend` naast `readEventOvername`
(`repo.ts:658`) en `writeEventOvername` (`repo.ts:685`). Strikte validatie: `blok` is `null` of
`yyyy-MM-dd`, `doel` is `null` of een string uit `DOEL_OPTIONS`. Elke afwijzing VOOR de
schrijfactie, zodat een 400 ook echt betekent dat er niets is weggeschreven.

CLIENT. Nieuwe pure module `apps/web/src/lib/doelpassend.ts` met `doelPassendVoorstel(input)`,
naar het model van `eventOvername.ts`: null is geen kaart, elke voorwaarde apart. De vloeren
staan als een `Record<string, number>` met een commentaarregel die per doel de paragraaf uit
`DOELEN-SPEC` noemt. Nieuwe component `DoelPassendCard.tsx` naast `EventOvernameCard.tsx`, twee
knoppen; beide knoppen schrijven, "ja" schrijft daarnaast de settings.

PRECEDENTIE, EN DIE LANDT IN `schema.ts` EN NIET IN JSX — daar is ze toetsbaar, en `apps/web`
heeft geen render-testinfrastructuur. Waar het view-model wordt samengesteld:
`doelPassendKaart` wordt null zodra de event-overname-kaart er staat, en `dosisTredeKaart` wordt
null zodra `doelPassendKaart` er staat. Grond voor die tweede: de dosis van een doel ophogen dat
niet bij de uren past is incoherent. De BESTAANDE guard op de dosis-trede-kaart in
`SchemaView.tsx` blijft ongewijzigd.

## 6. Rood per term

Elke patch vooraf greppen op zijn eigen markering, en de uitslag PER ASSERTIE lezen — `assert_`
en `expect` breken af bij de eerste val, dus een tweede term in dezelfde test lijkt anders
ongedekt.
- R1 blokweek-poort eruit: de kaart verschijnt in blokweek 2.
- R2 vloer-vergelijking omgekeerd: bij 5 uur en Korte beklimmingen verschijnt de kaart.
- R3 de vloerloze doelen eruit: bij FTP met 1 uur verschijnt de kaart.
- R4 de doel-term uit de antwoord-poort: na "nee" op Korte beklimmingen blijft de kaart weg bij
  een wissel naar Lange beklimmingen binnen hetzelfde blok.
- R5 de settings-ja-tak stuurt alleen `{doel}`: de assertie dat elke sleutel van het
  settings-DTO in de body zit valt om.
- R6 de precedentie-nulling in `schema.ts` eruit: de test die eist dat de dosis-trede-kaart
  zwijgt zodra de doel-passendheid-kaart staat, valt om.
- R7 route-400: NIET de validatie uitzetten — dan schaduwt de status-assertie de terugleescheck.
  Muteer de VOLGORDE (schrijven voor valideren); dan blijft de 400 staan en vallen alleen de
  terugleesasserties.

## 7. Acceptatie en de grenzen ervan

WEL TE FOTOGRAFEREN, anders dan de laatste rondes: deze kaart hangt volledig aan de PLAN-kant en
vraagt niets van de geleverde kant. Nieuw scenario in `tools/shots/shot.mjs`: `doel-passend`,
`doel` "Korte beklimmingen", `blokWeek` 1, `weekUren` 4. De harness zaait vandaag `weekUren: 5`
als vaste override (`shot.mjs:369`) en overschrijft per scenario alleen `doel` (`:625`, `:626`);
er komt dus een `weekUren`-override per scenario bij, in dezelfde vorm.

TWEE NEGATIEVE CONTROLES DIE ER AL STAAN: `klim-kort` en `klim-weekstem` dragen allebei doel
"Korte beklimmingen" en `weekUren` 5, en vallen allebei op meso-blokweek 1. Vloer 5 tegen 5 uur
betekent dat de kaart daar NIET hoort te verschijnen. Bewegen die shots wel, dan is de vloer
verkeerd om geimplementeerd.

NIET TE EISEN: dat Daan het op zijn eigen scherm ziet. Bij `weekUren` 5 en doel FTP is de bouw
per constructie inert; hij wordt pas zichtbaar als er 4 of minder gedeclareerd staat bij een
doel met een vloer.
