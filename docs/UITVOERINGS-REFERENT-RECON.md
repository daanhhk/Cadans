# Uitvoerings-referent met blok-venster — recon (bouwvolgorde stap 5)

Recon-first bij `docs/DOELEN-SPEC.md` paragraaf 6 stap 5. Leeswerk door chat-Claude op de
gecommitte code; metingen via read-only SELECT op remote D1 en via de gebundelde engine met
gepinde klok (TZ Europe/Amsterdam). Geen code gewijzigd.

## 1. De vraag

Draagt de client genoeg historie om een blok van drie tot vier weken te reconstrueren, en wat
levert `zoneDebt_` zodra zijn venster van week naar blok wordt getrokken. De aanname vooraf,
uit `HANDOFF.md`: beide signalen bestaan al met de goede korrel, alleen het VENSTER en het
GEBRUIK moeten veranderen. Die aanname is deels weerlegd.

## 2. Wat gemeten is

### 2.1 Het venster van zoneDebt_ is geen parameter maar een gevolg

`zoneDebt_` (`packages/engine/src/weekprep.ts`) itereert over de `plannerDays`-array die de
aanroeper meegeeft; `weekMondayISO` filtert daarbinnen. De client haalt met `getPlanner(monday)`
uitsluitend de zeven dagen van de huidige week op. Gemeten op identieke invoer: venster op
weekmaandag levert high-tekort 40, venster op blokstart met dezelfde plannerDays levert OOK 40.
Pas met een 28-daagse plannerDays-array wordt het 280. Alleen het argument verzetten doet niets.

### 2.2 Een saldo streept weg

`zoneDebt_` retourneert `intent - actual` per bucket, zonder clamp. Gemeten over een blok met
acht geplande kwaliteitsdagen a 40 minuten high (320 intent): perfect uitgevoerd geeft 0; vier
dagen volledig gemist plus vier dagen dubbel gereden geeft OOK 0, identiek. Een extra rit van
60 minuten high op een niet-geplande dag telt voor niets, het tekort blijft 320. Over een week
is dat draagbaar, want de inhaal-kaart vraagt alleen of er nu een gat zit. Over een blok
vernietigt het precies het onderscheid waarvoor de blok-check bestaat.

### 2.3 De eenheden verschillen

`intent` is voorgeschreven, gestructureerde tijd-in-zone; `actual` is gemeten zonetijd uit
idx15. Bij een volledig gemiste dag valt dat verschil weg (actual = 0) en werkt de M63-fork
zoals bedoeld. Over een blok waarin wel gereden is loopt de aftrek systematisch scheef:
gemeten Z3-tijd stapelt op elke buitenrit, ook zonder voorgeschreven prikkel.

### 2.4 Het datapad — intent ontbreekt, actual is dekkend

Remote D1, read-only. De weekplans-tabel draagt EEN rij: `2026-07-20`. `planner_days` reikt van
`2026-07-06` tot `2026-07-26`. De activiteiten dragen 250 ritten van `2025-07-17` tot
`2026-07-25`; sinds 22-06 hebben 19 van 21 ritten zonedata.

Dat is geen defect maar ouderdom. `persistWeekplan` kwam op main met `fbbc292` (19-07-2026
07:53) en bereikte prod met de deploy vanaf `f47ae2b` (20-07-2026). De schrijver draait precies
een week. Vanaf nu stapelt er een rij per week: drie weken intent compleet rond 10-08-2026,
vier weken rond 17-08-2026. Bijvangst: de cross-week recency-seed (laag 1b) filtert op weken
VOOR deze week en heeft in prod dus nog niets gehad; die komt vanzelf op gang.

### 2.5 Het bewaarde weekplan is geen dosis-verklaring

De enige bewaarde week draagt vier entries, 300 minuten, alles in `low`: 0 high, 0 anaerobic.
Er staan geen dag-overrides op die week (`day_state`, nul rijen). Diezelfde week zijn 89 high-
en 2 anaerobic-minuten GEREDEN.

Doorslaggevend: de engine, opnieuw gedraaid op dezelfde config (doel FTP, `doelStart`
2026-06-29, ftp 280, weekuren 5, planner ma60/di60/do60/za120) met gepinde klok en het echte
A-event, plant voor die week wel een drempeldag van 60 minuten met zones low+high. De blob wijkt
dus af van wat de engine voor die week plant. De blob is niet "wat de coach vroeg" maar "wat de
coach voorstelde voor dagen die op dat rendermoment nog vooruit lagen", dag voor dag bevroren
door de worker. Als referent van een blok is dat onbruikbaar: een week waarin de planner geen
kwaliteit uitgaf scoort een perfecte uitvoering, 0 gevraagd tegen 0 geleverd. Dat is gat 4 uit
paragraaf 2A ("opbouw week 1-3 wordt aangenomen, niet gecontroleerd") langs de achterdeur.

### 2.6 Plan tegenover werkelijkheid over het hele blok

Geplande tijd-in-zone uit de engine (gepinde klok, echt event) naast geleverde zoneminuten uit
D1, kwaliteit = high plus anaerobic, in minuten:

- 2026-06-29, mesoweek 1: gepland 45, geleverd 110
- 2026-07-06, mesoweek 2: gepland 49, geleverd 97
- 2026-07-13, mesoweek 3: gepland 52, geleverd 118
- 2026-07-20, mesoweek 4: gepland 13, geleverd 91

Blok-som: 159 gepland tegen 416 geleverd, factor 2,6. De meso-ramp beweegt 45 naar 52, zeven
minuten over drie opbouwweken, terwijl de uitvoering week op week 27 minuten varieert (91 tot
118). De geplande progressie ligt binnen de ruis van de werkelijke uitvoering. De deload bestaat
alleen in het plan. Anaerobic is in elke Base-week 0 gepland tegen 2 tot 16 geleverd.

### 2.7 De ijk-reeks

26 kalenderweken geleverde zoneminuten, terug tot 2026-01-19. Kwaliteit per week: minimum 24,
mediaan 77,5, maximum 248. Plateau-toets op een absolute norm T, aantal weken dat T haalt:
T=70 geeft 17/26, T=80 geeft 12/26, T=90 geeft 11/26, T=100 geeft 7/26. Tussen 80 en 90
verschuift het oordeel voor een enkele week; daarbuiten stappen van vier of vijf. Dat is een
dun maar echt plateau.

Normaliseren op GEREDEN uren valt af: 24/19/15/12/9/6/5/3/0 over T=10 tot 26 min per uur,
een gelijkmatige helling zonder vlak stuk, en bovendien circulair (geleverd gedeeld door
geleverd). Het huidige 5-uursregime (laatste acht weken, zonder de 10,5-uursweek van 15-06)
ligt op 71 tot 121 kwaliteitsminuten, mediaan ongeveer 97.

## 3. Besluit

1. De DOSIS-NORM van een blok is een veld van het blok-object, afgeleid uit doel plus
   gedeclareerde weekuren. Niet de som van bewaarde weekplannen.
2. De norm wordt uitgedrukt in GEMETEN zoneminuten (high = Z3+Z4, anaerobic = Z5..Z7), dezelfde
   grootheid als de geleverde kant. Gelijke eenheid aan beide zijden; dat lost 2.3 op.
3. De blok-referent levert de TWEE TERMEN apart per week (gevraagd, geleverd), nooit hun saldo.
   Dat lost 2.2 op.
4. De blob houdt de WEEK-vraag ("niet gedaan"), venster en M63-fork ongemoeid. Week uit de blob,
   blok uit de norm: precies de scheiding die de twee vragen bedoelen.
5. `zoneDebt_` wordt NIET aangeraakt. De blok-referent is een nieuwe pure client-side functie.
   Engine blijft read-only; geen autorisatie nodig.
6. Geen extra fetch: activiteiten komen al ongefilterd binnen, weekuren staan in settings.

## 4. Wat dit document NIET vastlegt

Geen enkele drempelwaarde. Paragraaf 2.7 levert de ijkbasis, niet de norm. Een norm die uit de
eigen reeks wordt afgelezen bevestigt slechts het bestaande gedrag, terwijl de blok-check juist
moet kunnen zeggen dat het plan te licht was. De reeks ijkt de SCHAAL van wat haalbaar is bij
vijf uur; de check beweegt daarbinnen.

## 5. Bouwplan

- Stap 5a (client-only). Blok-object met vaste lengte plus de dosis-norm; de pure
  uitvoerings-referent die per week van het blok gevraagd en geleverd apart teruggeeft; de
  blok-check met drie uitkomsten. Drempels als named exports, te herijken zonder logica-wijziging.
- Stap 5b. De effect-referent per doel, pas hierna. Effect zonder uitvoering is betekenisloos.

Dit KEERT `docs/DOEL-REFERENT-RECON.md` paragraaf 8 om, die de meetlat als fase 1 zet.

## 6. Openstaand

- De tak "niet geleverd, dus dosis niet omhoog" gaat bij deze gebruiker vrijwel nooit vuren:
  de uitvoering ligt structureel boven het plan terwijl de CTL daalt. De levende tak is
  "geleverd maar niet gestegen, dus het plan was te licht". Meenemen in de copy.
- De deload plant 13 kwaliteitsminuten tegen 91 geleverd. 3d stap 3 werkt (de deload krijgt
  een drempeldag van 60 minuten), maar de dosis landt op 13 intent-minuten. Of een deload die
  in de praktijk genegeerd wordt moet blijven bestaan is een eigen vraag, geen bug.
- `frozenEntryByDate` (`apps/web/src/lib/proposal.ts`) stelt in commentaar dat het recent-venster
  de weken oplopend aanlevert. Gemeten is het aflopend: `gatherWeekplanEntries_` begint bij k=0
  op de basismaandag. Vandaag onschadelijk want datums zijn week-uniek; het commentaar klopt niet.

## 7. IJking van de gebouwde referent

De in stap 5a gebouwde referent (`apps/web/src/lib/blok.ts`) is na de bouw tegen remote D1 geijkt,
op de echte activiteiten via de app-eigen `parseActivityRows` en de app-eigen aggregatie — geen
eigen parser, geen nagerekende cijfers.

REPRODUCTIE. De referent levert voor het blok 29-06 t/m 20-07 de weekwaarden 110,0 / 97,1 / 117,5 /
91,0 tegenover de in §2.6 gemeten 110 / 97 / 118 / 91. Grootste afwijking 0,5 minuut, volledig
verklaard door afronding. De implementatie meet dus wat de recon mat.

HET FIETS-FILTER KAN DE REFERENT NIET OMLAAG TREKKEN. Dat was de enige route waarlangs de geleverde
kant structureel te laag zou kunnen staan. Gemeten over 121 ritten: buiten `CYCLING_TYPES` valt
2570 minuten (AlpineSki 2129, Run 233, IceSkate 145, Walk 51, WeightTraining 12), en daarvan draagt
NUL minuut zonedata. Er is dus geen kwaliteitsminuut die door het filter verdwijnt.

DE NORM LIGT OP HET PLATEAU. De plateau-toets uit §2.7 is herhaald mét het fiets-filter, over 27
kalenderweken: T=70 geeft 17 weken, T=80 geeft 12, T=84 geeft 12, T=90 geeft 11, T=100 geeft 7. De
gekozen norm van 84 (drie prikkels × 28 minuten bij vijf weekuren) telt EXACT gelijk met 80 en ligt
daarmee aantoonbaar op het vlakke stuk, niet op een helling. Dat is de onderbouwing van die norm en
hij hoort hier vast te liggen, niet in een chat: wie de norm later wil verschuiven, verschuift hem
tegen deze tabel.

DE DEKKINGS-POORT BIJT NIET. Van de 27 weken viel er 0 af op `ZONEDATA_DEKKING_MIN`. Eén week
(02-02-2026) heeft nul ritten; die telt volgens ontwerp WEL mee, want niet gereden is een echte
misser en geen datagat.
