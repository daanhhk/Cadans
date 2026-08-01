# Punt 10 fase B — de week-tekort-stem

Spec waartegen fase B deel 1 gebouwd wordt. Fase A (`docs/PUNT10-FASE-A-BOUWDOC.md`) gaf het
blok EEN stem; deze fase geeft de WEEK er een, en alleen daar waar er iets weg is.

## 1. Wat er gemeten is

Gedraaid tegen `b1a83d9`: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag. Vier metingen.

M1 — DE PER-ZONE-NORM IS GEEN WEEKMEETLAT. Over 105 cellen (7 weekvormen x 5 doelen x 3
fase-ankers) haalt het GERENDERDE PLAN zelf alle drie de zone-normen in 2 van de 105. Onder
norm: tempo 62, drempel 35, anaeroob 76. Het mechanisme zit in de POPULATIE, niet in de
vouwing: norm en weekplan gaan door DEZELFDE functie (`planZone5_`), maar de norm-vorm komt uit
`bibliotheekSignatuur` over alle 35 archetypes terwijl een week er een handvol trekt.
`threshold_2x20` vraagt 0 tempo en `sweetspot_2x15` 0 drempel; het gemiddelde van de bibliotheek
is dus geen weekverwachting. Een weekstem tegen die norm meldt een tekort in zones die het plan
die week nooit vroeg.

M2 — HETZELFDE OP DE ECHTE REEKS. 46 beoordeelbare weken uit `docs/DOSIS-MUNT-MEETDATA.md` Q4,
gevouwen met `weekKwaliteitMinuten` — de functie die de app zelf aanroept. Op norm (24/47/13):
tempo 34, drempel 4, anaeroob 24; alle drie samen 3 van de 46. Mediaan geleverd 43 / 18 / 14.
Het instrument is VOORAF gevalideerd: de oude munt geeft 24 van de 46, exact het eerder
gemeten getal. Een norm-gebaseerde weekstem zou in 43 van de 46 weken spreken.

M3 — OVER EEN BLOK HOUDT HET PLAN WEL STAND, OP EEN ZONE NA. 21 cellen (7 weekvormen x 3
doelen), drie opbouwweken met recency-rotatie via teruggevoerde weekplan-entries: nooit minder
dan 2 van 3 zones op norm, 3 van 3 in precies 1 cel. De zakker is anaeroob in 15 en tempo in 6
(vrijwel alleen korte beklimmingen); drempel zakt nul keer. Bij Onderhoud programmeert het plan
0 anaerobe minuten tegen een blok-norm van 30, in 6 van de 6 cellen. PREDICAAT: gemeten op de
leeg-gevoede weekvorm-as, niet op de levende D1. Dit is GEEN onderdeel van fase B; het is een
eigen ROADMAP-punt (zie paragraaf 6).

M4 — "GEVRAAGD DEZE WEEK" IS GEEN VAST GETAL. V1 (5,0u ma60 di60 do60 za120), doel FTP,
maandag gemist: het weektotaal gepland drempel loopt 77 (ma) naar 98 (di) naar 74 (wo/do) naar
87 (vr/za). De allocator herverdeelt de kwaliteit over de resterende dagen. Alleen de
VERSTREKEN dagen liggen vast: `mergeFrozenWeekplan` bevriest elke datum kleiner dan vandaag, en
`hasUnrecordedPastTrainingDay` plus `mergeReconEntries` vullen een gat in het verleden al.

## 2. Het besluit

DE WEEKSTEM MEET TEGEN HET PLAN VAN DEZE WEEK, NOOIT TEGEN DE BLOK-NORM. Referent is het
BEVROREN plan van de VERSTREKEN dagen; geleverd zijn de ritten van diezelfde dagen. Beide per
zone, TERMEN APART, geen saldo en geen compensatie tussen zones.

DE ARBEIDSVERDELING TUSSEN WEEK EN BLOK, uit `DOELEN-SPEC` paragraaf 2A: niet-gedaan is een
WEEK-vraag, niet-gewerkt is een BLOK-vraag. De weekstem gaat dus over een prikkel die WEG is;
grijs rijden (wel getraind, verkeerde zone) blijft de blok-terugblik.

GEEN ENKELE NIEUWE CONSTANTE. De poort is structureel, niet numeriek: hij hangt aan de
bestaande sleutel-machinerie van punt 5b, die al gemeten is. Er valt hier dus niets te ijken en
er is geen plateau-toets nodig — dat is opzet, geen omissie.

GEEN AANBOD. Het voorstel "verschuif deze week de minuten naar Drempel" raakt de ALLOCATOR en
is fase B deel 2: engine, eigen autorisatie, en eerst een wat-als-meting. De 5c-les staat: de
opgeruimde inhaal-kaart stelde in 60 van 72 cellen een LICHTERE week voor.

## 3. Wanneer de stem spreekt

Precies dan, en anders zwijgt de app (M5):

1. Er is minstens EEN verstreken dag deze week waarvan de sleutelprikkel nog openstaat —
   `sleutelPrikkelOpen` uit `apps/web/src/lib/sleutelinhaal.ts`, ongewijzigd overgenomen; EN
2. `openSleutelDagen` levert een LEGE lijst: er staat deze week geen trainingsdag meer die de
   prikkel kan dragen; EN
3. de verstreken dagen zijn BEOORDEELBAAR: geen enkele verstreken dag draagt wel een rit maar
   `zoneMin5 === null`. Zonedata ontbreekt, dus geen oordeel.

Op maandag is er per constructie geen verstreken dag, dus zwijgt hij zonder eigen guard.

GEMETEN GRONDSLAG voor de zeldzaamheid: punt 5b mat over 23 cellen dat in 20 het restplan nog
minstens een sleutelsessie draagt. Voorwaarde 2 is dus de minderheid.

## 4. Wat hij zegt

De zin noemt de twee TERMEN per werkzone met een tekort, en claimt geen daad:

"Je plan vroeg deze week 52 Drempel-minuten op de dagen die geweest zijn; je reed er 14. Er
staat geen trainingsdag meer om die prikkel op te pakken."

Twee zones: `zoneLijst_`-vorm, dus "Drempel en VO2max". De zone-namen komen uit `ZONE_NAAM_`,
niet uit een nieuwe lijst. De copy-pool en de seed volgen `blokReviewRegel`.

DE COPY IS FUNCTIONEEL, NIET DEFINITIEF. De toon gaat mee in de gezamenlijke coach-copy-ronde,
samen met het sleutel-inhaalblok en de overname-kaart. Daan-besluit, ongewijzigd.

## 5. Wat er gebouwd wordt

REKENLAAG — nieuwe pure module `apps/web/src/lib/weektekort.ts`, DOM-loos.
- Venster: de dagen van de weekmaandag tot en met gisteren (datum kleiner dan `todayISO`).
- GEVRAAGD per zone: `planZone5_` over de RAUWE blokken van die dag. De bron is dezelfde
  afgeleide als `planSessions` op `SchemaDay`: de sessies als die er zijn, anders de bevroren
  `plannedForDone` mits `totaalMin` groter dan 0. Die rauwe blokken bestaan alleen op
  `ProposalWeek`, want `SchemaSession.blokken` is de render-vorm zonder `pctLo`/`pctHi`.
- `planZone5_` is NIET ongebruikt. Hij draait vandaag al in productie binnen
  `bibliotheekSignatuur` (`zonemunt.ts:199`), die via `blokDosisNorm` (`blok.ts:184`) de VORM van
  de norm aflevert. Wat ontbreekt is een aanroeper die hem over een GERENDERD plan per DAG
  draait. Dat onderscheid is de hele fase: dezelfde vouwing, een andere populatie. Een chat die
  hier "ongebruikt" leest, heeft de aanroeper binnen de module zelf over het hoofd gezien.
- GELEVERD per zone: `zoneMin5` van de `DoneEntry` van die dag.
- Uitvoer: per werkzone (tempo, drempel, anaeroob) gevraagd en geleverd APART, plus de lijst
  zones met een tekort. Geen saldoveld en geen totaal waarop besloten wordt.
- `grenzen` is een VERPLICHTE parameter, niet optioneel — precedent `buildBlokReview`: een
  optioneel veld valt bij een aanroeper stil terug op de default en dan ziet de app de
  gesynchroniseerde zones nooit.
- ROND EEN KEER AF, op de grootheid die de zin noemt. De rekenlaag geeft onafgerond terug.

COPY — `weekTekortRegel` in `apps/web/src/lib/coachNarrative.ts`, naast `blokReviewRegel`,
zodat `zoneLijst_`, `ZONE_NAAM_` en `seedIndex` niet geexporteerd of gedupliceerd hoeven te
worden.

UI — een eigen component in `apps/web/src/components/schema/`, in de rij weekkaarten. Hij
VRAAGT NIETS, dus hij hoort onder de voorstel-kaarten. Staat de blok-terugblik op het scherm,
dan komt hij daaronder — zelfde plaatsingsregel als de vermoeidheidskaart in fase A.

OPRUIMEN — de lege-lijst-tak in `SleutelInhaalBlok.tsx` ("Deze week staat er geen trainingsdag
meer om 'm op te pakken.") vervalt; bij een lege lijst rendert het blok niets. Die boodschap
verhuist naar de weekstem, mét getallen. Dit is de reden dat er geen twee stemmen ontstaan:
het dagblok zegt WAAR de prikkel nog staat, de weekstem zegt dat hij WEG is.

## 6. Wat hier NIET in zit

- Het aanbod "verschuif de minuten naar Drempel" — fase B deel 2, ENGINE.
- De anaeroob-term van de per-zone-norm (M3). Het plan programmeert in Base en Build nauwelijks
  en bij Onderhoud nooit anaerobe minuten, terwijl de norm ze wel vraagt; de terugblik kan dan
  "niet geleverd" zeggen over een blok dat exact volgens plan is gereden. Eigen ROADMAP-punt,
  met eigen meting: is de norm-VORM fout (afgeleid over de hele bibliotheek, terwijl Base en
  Onderhoud vo2 juist onderdrukken) of hoort Onderhoud anaeroob werk te programmeren. Daan-
  besluit: direct NA fase B, want een doelwissel naar Onderhoud kan er binnen weken zijn.
- De verschuivende gepland-noemer binnen de week (M4). De weekstem raakt hem niet, want hij
  leest uitsluitend bevroren dagen. Blijft parkeerlijst.

## 7. Acceptatie

- ROOD PER TERM, elk apart teruggedraaid en gemeten, niet beweerd: de sleutel-poort, de
  lege-restlijst-voorwaarde, de dekkingsvoorwaarde, en de per-zone-rekenterm.
- ROOD VOOR HET OPRUIMEN: met de weekstem-term uit toont een scenario met een gemiste
  sleutelsessie en geen resterende dag NERGENS meer een boodschap.
- `planZone5_` krijgt zijn eerste aanroeper die de plan-kant PER DAG uitrekent, over een
  gerenderd plan in plaats van over de archetype-bibliotheek; het rapport noemt die call-site met
  bestand en regel. Zijn eerste aanroeper buiten de eigen test bestaat al en is
  `bibliotheekSignatuur` — die eis was fout gesteld en is hiermee gecorrigeerd.
- Het rapport noemt de LEZER van de nieuwe waarde in het view-model. Een berekende waarde
  zonder lezer is het `adapt`-defect uit punt 5b.
- Shot-harness: eerst een WEGGEGOOIDE warmloop tegen de dev-server, daarna voor en na op
  dezelfde machine zonder werk ertussen; bytecount en sha256. Alleen het scenario waarin de
  stem vuurt mag bewegen. CC velt zelf een UITSPRAAK over het beeld.
- CLIENT-ONLY: `git diff --stat HEAD~1 -- packages/engine` leeg. Geen migratie, geen deploy.
