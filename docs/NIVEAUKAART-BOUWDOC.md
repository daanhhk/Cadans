# Cadans — NIVEAUKAART-BOUWDOC

De twee kaart-punten van de Niveau-tab (`docs/ROADMAP.md`, parkeerlijst CLIENT). Beide raken
`packages/engine/src/niveau.ts`; engine-autorisatie gegeven door Daan op 2 augustus 2026 voor
`doelTestWeken_`, `ftpBandFromProjection_` en een gedeelde blok-lengte-constante in `phase.ts`.

## 1. Wat er mis is — GEMETEN, niet gelezen

Chat-zijde gedraaid tegen `8cb0bec`; engine gebundeld met esbuild buiten de repo-tree,
TZ=Europe/Amsterdam.

### 1.1 De testweek-teller loopt DOOD; de off-by-one is de kleinste helft

`doelTestWeken_` rekent EEN vaste datum uit — `doelStart` plus `doelDuur` maal 7 — en herhaalt
nooit, terwijl `computeMacroPhase` sinds punt 9 cyclisch 1..12 telt en `blokNr` meegeeft.
`doelStart` wordt bovendien NERGENS automatisch opgeschoven; de enige schrijver is
`apps/web/src/lib/settings.ts:95`. Die vaste datum veroudert dus per constructie.

GEMETEN over 6570 cellen (6 blok-starts, waarvan twee die een zomertijdgrens kruisen, elke dag drie
jaar vooruit), huidige functie tegenover de echte testweek uit `computeMacroPhase`:
- 504 cellen gelijk
- 504 cellen exact EEN week te hoog — dat is blok 1, de off-by-one uit de parkeerlijst
- 5562 cellen op 0 terwijl er WEL een testweek komt

HARDE DATUM. Daans `doelStart` is 2026-06-29. Vanaf maandag 2026-09-21 geeft de functie voorgoed 0.
`isTest` blijft waar, want 0 is niet null, dus de kaart zegt vanaf dan permanent "FTP-test over ~0
weken" en "~0 wkn tot testdag".

DE PARKEERLIJST-NOTITIE IS OP TWEE PUNTEN GECORRIGEERD. De daar voorgestelde fix — `doelDuur` min 1
— raakt uitsluitend die 504 off-by-one-cellen en laat de doodloop staan. En "zes weken" is de RAUWE
afstand van 43 dagen; de functie rondt naar boven af, dus gecorrigeerd staat er op 2026-08-02 een 7
en geen 6.

NIET DRAGEND: DE BAND. `ctlAtWeek_` op 8, 7 en 6 weken geeft bij `currentFtp` 280, `currentCtl` 45,7
en 56 TSS per uur een verschil van 0 W bij 5 uur en hoogstens 2 W bij 8 uur; bij Daans uren ligt het
gain-plafond op 0. Dit is een TELLER-defect, geen rekendefect.

### 1.2 De aannameregel hangt aan DRIE dingen

`niveau.ts:798` draagt "2 sleutelsessies per week, consequent" als literal in een doel- en
fase-onafhankelijke array. Het getal dat de app zelf hanteert is `prikkels` uit `blokDosisNorm`
(`apps/web/src/lib/blok.ts:212`), en dat hangt aan doel, fase EN weekuren: onder
`PRIKKEL_UREN_DREMPEL` (5) kapt hij af op 2, en Onderhoud is uitgezonderd en staat altijd op 3.

GEMETEN met `blokDosisNorm` zelf, 5 doelen maal 4 fases maal 4..14 uur:
- FTP en Korte beklimmingen: 3 in Base, Build EN Peak vanaf 5 uur; 2 bij 4 uur
- Conditie en Lange beklimmingen: 2 in Base en Peak, 3 in Build vanaf 5 uur; 2 bij 4 uur
- Onderhoud: 3, bij elk aantal uren en in elke fase

De literal klopt dus uitsluitend bij 4 uur, of bij Conditie en Lange beklimmingen buiten Build. Voor
Daan — doel FTP, 5 weekuren — hoort er 3 te staan, in elke fase.

## 2. De besluiten

### 2.1 De blok-lengte wordt EEN gedeelde constante — HERKOMST: PLAN

`DOELEN-SPEC` §2B: het doel-blok is TWAALF weken en HERHAALT. Dat staat VASTGESTELD, dus de 12 wint
en `settings.doelDuur` is de vreemde eend, niet andersom. `computeMacroPhase` en `doelTestWeken_`
gaan beide op `DOEL_BLOK_WEKEN` in `packages/engine/src/phase.ts`.

DIT IS GEEN KNOP. De constante bestaat om te voorkomen dat twee functies over dezelfde blok-lengte
uiteen kunnen lopen; er is geen tweede waarde en er komt er geen. De fase-ladder (4 / 8 / 11) blijft
LITERAL: die op de constante betrekken zou een afleiding suggereren die nergens varieert — dode
bedrading met een nettere naam.

### 2.2 De teller ankert op het LOPENDE blok

Testweek = blokweek 12 van het blok waarin `today` valt, met exact dezelfde telling als
`computeMacroPhase`: `Math.round` op het DAGverschil — de DST-correctie die ook `phase.ts:149`,
`planner.ts:307` en `niveau.ts:844` dragen — daarna `Math.floor(diff / 7) + 1`, daarna `blokNr`.

GEVERIFIEERD, mechanisch en niet beweerd: over dezelfde 6570 cellen draagt de afgeleide maandag in
6570 van de 6570 gevallen `week === 12` EN `isTestWeek === true` volgens `computeMacroPhase` zelf,
met hetzelfde `blokNr` als de peildag, altijd binnen -6 tot +77 dagen, en altijd op dezelfde weekdag
als `doelStart`. Nul afwijkingen op alle vier de assen.

De teller gaat daarmee 2, 1, 0 (de testweek zelf), en springt op de maandag erna naar 11 voor het
volgende blok. Voor Daan: 2026-08-02 geeft 7 (was 8), 2026-09-14 tot en met 2026-09-20 geeft 0,
2026-09-21 geeft 11 (was 0), 2026-12-07 geeft weer 0.

### 2.3 De Blok-duur-RIJ gaat weg; de OPSLAG blijft ongemoeid

Na 2.2 leest geen enkele consument `settings.doelDuur` nog voor een uitkomst. De rij "Blok-duur ·
weken" in Instellingen stuurt dan niets meer aan, en een invoerveld dat niets doet is een belofte die
de app niet waarmaakt. Daan-besluit 2 augustus 2026: de RIJ gaat eruit.

DE FORMULIER-LAAG BLIJFT ONGEMOEID, EN DAT IS DWINGEND. De eerste versie van dit doc schreef het
tegenovergestelde voor — formulierveld, default en mapping eruit — en dat was fout op twee
onafhankelijke gronden, beide nagelezen in de bron:
- TYPE. `SettingsForm` is `Record<keyof SettingsInput, string>` (`apps/web/src/lib/settings.ts:9`),
  een mapped type over de DTO. Zolang `SettingsInput.doelDuur` bestaat
  (`packages/shared/src/settings.ts:19`) KUNNEN `EMPTY_FORM` en `settingsToForm` de sleutel niet
  missen; het compileert niet eens.
- DATAVERLIES. Het PUT-contract is FULL-REPLACE. De kop van `settings.ts` zegt het, `api.ts:762`
  herhaalt het ("weggelaten velden → null; geen partial-merge") en `writeSettings`
  (`workers/api/src/db/repo.ts:56`) voert het uit met `doelDuur: s.doelDuur ?? null` binnen één
  `onConflictDoUpdate` over het hele vals-object. Valt `doelDuur` uit `NUM_KEYS`, dan zit hij niet
  meer in de body en zet de EERSTVOLGENDE opslag vanuit Instellingen `doel_duur` in D1 op NULL —
  precies wat deze paragraaf verbiedt.

De waarde blijft dus rondpompen langs GET, form en PUT: onzichtbaar en onveranderbaar, maar intact.
De D1-kolom `doel_duur`, het DTO-veld en de worker-route blijven ongemoeid; geen migratie,
forward-only. Het veld HELEMAAL opruimen raakt DTO, route en een migratie en is daarmee een eigen
ronde met een eigen afweging. Die is hier bewust NIET genomen: de kolom kost niets om te houden.

CC ving deze tegenspraak vóór de bouw en stopte. Zelfde familie als "een controle wordt getoetst
tegen de payload uit hetzelfde prompt", nu tussen twee paragrafen van HETZELFDE doc: 2.3 beloofde
behoud en 3 schreef de verwijdering voor die dat behoud onmogelijk maakt. En de chat had de
route-guard `if ("doelDuur" in body)` wél gelezen en de SCHRIJFKANT erachter niet — één uiteinde
gecontroleerd, het andere niet.

### 2.4 De aannameregel wordt doel- en uren-bewust, en fase-COMPLEET

De regel loopt de drie fases Base, Build en Peak LANGS in plaats van er een te pinnen, en meldt het
bereik.

DE REDEN IS DWINGEND EN GEEN GEMAK. De Niveau-tab laadt alleen `getSettings` en `getActivities` —
geen events en geen `overnameBevestigd` — dus `effectiveMacroFase_` is daar per constructie niet te
berekenen. Een fase die daar toch gepind wordt is een TWEEDE fase-bron die van het Schema-scherm kan
afwijken zodra de event-overname vuurt; voor AGR is dat vanaf 2027-02-22. Enumereren sluit dat uit.
Het past bovendien op de horizon van de kaart: de projectie loopt tot de testdag en beslaat dus
meerdere fases, en "consequent" slaat op die hele periode. Drie van de vijf doelen vallen daarbij
toch op een enkel getal.

Het aantal uren komt van de SCHUIF in de kaart, niet uit `settings.weekUren`: de schuif is de
grootheid waarop de projectie eronder draait, dus de aanname hoort met de schuif mee te bewegen.

GEEN ENKELVOUDS-TAK. `prikkels` is `min(quotum, urenPrikkels)` met beide termen minstens 2, dus 1 is
per constructie onbereikbaar; een "1 sleutelsessie"-tak zou dode code zijn.

### 2.5 De COMPOSITIE landt client-zijde, de VORM blijft in de engine

`ftpBandFromProjection_` krijgt een vijfde, optionele parameter `sleutelRegel`. Is die een niet-lege
string, dan vervangt hij de EERSTE regel van `aannames`; ontbreekt hij, dan blijft de huidige literal
staan.

DIT IS EEN DWINGENDE GRENS, GEEN PLAATSINGSGEMAK. Het getal komt uit `blokDosisNorm`, en die woont
in `apps/web/src/lib/blok.ts` waar `packages/engine` per constructie niet uit kan importeren —
dezelfde grens die bij punt 15 fase 1 de asserties naar `apps/web` dwong. De hele regel naar de
client verhuizen zou de array over twee lagen splitsen; de parameter houdt de VORM op een plek en
laat de client uitsluitend aanleveren wat hij als enige kan weten.

## 3. Wat er gebouwd wordt

FASE A — de teller.
- `packages/engine/src/phase.ts`: `export const DOEL_BLOK_WEKEN = 12;` met de onderbouwing uit 2.1
  als commentaar. `computeMacroPhase` gebruikt hem op de twee plekken waar nu 12 staat: de modulo en
  de blok-deling. De fase-ladder blijft ongewijzigd.
- `packages/engine/src/niveau.ts`: `doelTestWeken_` gaat van `(doelStartISO, doelDuurWeeks,
  todayISO)` naar `(doelStartISO, todayISO)` en rekent volgens 2.2. Importeert `DOEL_BLOK_WEKEN` uit
  `./phase`; dat bestand wordt daar al uit geimporteerd, dus geen nieuwe module-rand.
- `apps/web/src/pages/Niveau.tsx`: de aanroep verliest het `doelDuur`-argument.
- `apps/web/src/components/niveau/DoelProjectie.tsx`: bij `testWeken === 0` luidt `horizonLabel`
  "testweek · deze week" en de regel eronder "FTP-test is deze week"; verder ongewijzigd. De grafiek
  vraagt geen aanpassing: `Math.max(4, 0)` geeft 4 en de marker op week 0 staat op de linkerrand,
  wat voor "deze week" juist is.
- `apps/web/src/pages/Instellingen.tsx`: uitsluitend de RIJ "Blok-duur · weken" eruit, met de
  `NumInput` die erin staat. `apps/web/src/lib/settings.ts` blijft ONGEMOEID — zie 2.3 — en het
  DTO-veld, de worker-route en de D1-kolom eveneens.

FASE B — de aannameregel.
- `packages/engine/src/niveau.ts`: `ftpBandFromProjection_` krijgt `sleutelRegel` als vijfde,
  optionele parameter, met het gedrag uit 2.5.
- `apps/web/src/lib/niveau.ts`: nieuwe pure functie `sleutelAannameRegel(doel, weekUren)`. Roept
  `blokDosisNorm(doel, weekUren, 0, undefined, fase)` aan voor "Base", "Build" en "Peak", verzamelt
  `prikkels`, en levert bij gelijk minimum en maximum "<n> sleutelsessies per week, consequent" en
  anders "<min> a <max> sleutelsessies per week, consequent" — met het teken a-met-accent-grave.
  Levert `null` zodra een van de drie aanroepen `null` geeft, zodat de engine-literal dan blijft
  staan. GEEN CYCLUS: `blok.ts` importeert `./niveau` niet; geverifieerd chat-zijde.
- `apps/web/src/components/niveau/DoelProjectie.tsx`: `DoelProjectieProps` krijgt `doel: string |
  null`; de component roept `sleutelAannameRegel(doel, hours)` aan met de SCHUIFWAARDE en geeft het
  resultaat als vijfde argument aan `ftpBandFromProjection_`. `hours` staat al in de
  `useMemo`-dependencies; `doel` komt erbij.
- `apps/web/src/pages/Niveau.tsx`: `doel: settings?.doel ?? null` op het `projectie`-object.

## 4. Rood per term — vooraf gespecificeerd

Elke rood-patch wordt VOOR het aflezen van de uitslag gegrept op zijn eigen markering: een patch die
niets raakt leest ten onrechte als een niet-gedekte term.

FASE A, in `packages/engine/src/selftest.test.ts`:
- (a) CYCLUS. `doelTestWeken_("2026-06-29", "2026-10-05")` is 9. Terug naar een vaste datum vanaf
  `doelStart` laat deze vallen op 0.
- (b) OFF-BY-ONE. `doelTestWeken_("2026-06-29", "2026-08-02")` is 7. `DOEL_BLOK_WEKEN - 1` terug naar
  `DOEL_BLOK_WEKEN` laat deze vallen op 8.
- (c) DE TESTWEEK ZELF. `doelTestWeken_("2026-06-29", "2026-09-14")` en `("2026-06-29",
  "2026-09-20")` zijn beide 0; `("2026-06-29", "2026-09-21")` is 11.
- (d) MECHANISCHE KOPPELING, met de functie die de app zelf aanroept. Over `doelStart` 2026-06-29 en
  2027-03-29 (zomertijdgrens), elke week 156 weken vooruit: de maandag waarop de teller 0 wordt
  draagt volgens `computeMacroPhase` `week === 12` en `isTestWeek === true`, met hetzelfde `blokNr`
  als de peildag. GEEN eigen raster nabouwen — `computeMacroPhase` aanroepen.
- De vijf bestaande `doelTestWeken_`-asserties vanaf `selftest.test.ts:1515` worden HERIJKT op de
  nieuwe arity. Dat is geen verzwakking maar de herijking die erbij hoort: ze pinden de regel "de
  testdag is `doelStart` plus `doelDuur` maal 7", en precies die regel wordt hier ingetrokken.

FASE B:
- (e) ENGINE, in `selftest.test.ts`: `ftpBandFromProjection_(275, 50, 60, null, "3 sleutelsessies per
  week, consequent")` geeft die string als `aannames[0]` en laat de overige drie regels ongemoeid;
  dezelfde aanroep ZONDER vijfde argument geeft de bestaande literal. De parameter terugdraaien laat
  beide asserties vallen.
- (f) CLIENT, in `apps/web/src/lib/niveau.test.ts`: `sleutelAannameRegel("FTP", 5)` bevat "3
  sleutelsessies", `("FTP", 4)` bevat "2 sleutelsessies", `("Onderhoud", 3)` bevat "3
  sleutelsessies", en `("Lange beklimmingen", 8)` bevat het bereik met minimum 2 en maximum 3. De
  bereik-tak terugdraaien naar alleen het minimum laat uitsluitend die laatste vallen.
  DEZE TEST KAN NIET ENGINE-ZIJDE. Hij vouwt met `blokDosisNorm` uit `apps/web/src/lib/blok.ts`, en
  `packages/engine` kan daar per constructie niet uit importeren.

NIET GEDEKT, EN DAT WORDT GEMELD IN PLAATS VAN OMZEILD: de COPY-tak bij `testWeken === 0` en het
verdwijnen van de Blok-duur-rij. `apps/web` heeft geen render-testinfrastructuur — `@testing-library`
ontbreekt — en de shot-harness laadt uitsluitend `/schema`, dus de Niveau-tab en de Instellingen-tab
vallen buiten het beeld. Die twee gaan naar Daans oog op prod; zie §5.

## 5. Wat Daan moet openen na de deploy

Op de telefoon.
- NIVEAU-TAB, kaart "Doel-gereedheid · FTP". Rechtsboven hoort "~7 wkn tot testdag" te staan, was
  "~8". Onder de projectie, achter het uitklapje met aannames, hoort de EERSTE regel "3
  sleutelsessies per week, consequent" te zijn, was "2". Schuif de uren-schuif naar 4: die regel
  hoort dan "2 sleutelsessies per week, consequent" te worden, en bij 5 weer terug naar 3.
- INSTELLINGEN-TAB, sectie met Doel en Blok-start: de rij "Blok-duur · weken" hoort weg te zijn.

## 6. Buiten scope

De bredere coach-copy-ronde. De 404 op `/api/checkin/<datum>`. Punt 10 fase B deel 2, punt 15 fase
3c, en de ontbrekende Niveau- en Instellingen-scenario's in de shot-harness.
