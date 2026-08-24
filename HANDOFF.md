# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 (VIERDE BLOK VAN DEZE DAG) — HET FTP-VOORSTEL IS ONDERZOCHT EN **WACHT OP ÉÉN
BESLUIT VAN DAAN**. Punt 69. Bouwronde geworden tot onderzoeksronde: **er is geen regel code
geschreven**, want verwachting Q2 viel om en de prompt had precies dat geval voor-geautoriseerd. Het
volledige stuk staat in `docs/PUNT69-BOUW.md`; **het besluitblok is §10 en dat is wat Daan moet
lezen.**
- **DE VRAAG AAN DAAN, in één zin: met welk getal zet de app twintig minuten om in een
  drempelwaarde?** Weg A is 95 procent van de beste twintig minuten uit de rit — wat beide apps al
  TONEN. Weg B is 95 procent van het gemiddelde over het voorgeschreven blok `20-MIN ALL-OUT`, dichter
  bij de letter van het protocol maar een tweede verzoek per rit. Weg C is een ander percentage. **Zonder
  dat getal kan het voorstel niet gebouwd worden**, en dat is geen bouwdetail: het bepaalt elke zone en
  elke dosis van de twaalf weken erna.
- **Q1 HOUDT, gemeten.** De 20-minutenwaarde staat DIRECT afleesbaar op het exacte roosterpunt
  `secs = 1200` van de per-rit-kromme: `secs.indexOf(1200) = 109`, `values[109] = 195 W`, 5353 bytes,
  één verzoek. Geen stream (**363535** bytes, ongeveer 68 keer zo groot) en geen engine-wijziging —
  een index-lookup in de worker volstaat. **Lees op 1200 en neem geen lopend maximum**, zie het blok
  hieronder.
- **Q2 VALT, op TWEE onafhankelijke gronden, en dat stopte de ronde.** (1) De canon zwijgt: geen
  omrekenregel in `TRAININGSMODEL` of `DOELEN-SPEC`. Pas op met de twee 95-en die er wél staan —
  `TRAININGSMODEL:505/509` is een ZONEGRENS en `DOELEN-SPEC:252` een BEHOUD-VLOER die FTP met FTP
  vergelijkt. (2) **Het is niet ÉÉN regel: de test is DOEL-AFHANKELIJK.** `planner.ts:2071` kiest vier
  protocollen over vijf doelen en alleen FTP draagt een omrekening; Conditie meet HR-drift,
  Beklimmingen is een manuele PR-vergelijking, en `vo2max.ts` kent helemaal geen test. Een voorstel dat
  na ELKE test vuurt, leidt onder de andere doelen een drempel af uit een rit die daar niet voor is.
- **DE UITWEGEN ZIJN ALLEBEI DICHT, en dat is gemeten.** `powerModels` en `ranks` op de
  intervals-respons zijn **null**, dus de bron levert zelf geen schatting. En intervals' eigen
  schatting mág niet: `TRAININGSMODEL:630` zegt dat `rolling_ftp` *"een proxy in precies de zin die
  M91 verbiedt"* is. De bevroren GAS-app deed precies dát — `src/Sync.gs:696` `setFtp(newFtp)` uit
  `s.mmp_model.ftp` — en dat pad is voor Cadans bewust niet geport.
- **HERKOMST IS GEEN GEZAG, en dat staat in de werkwijze.** De 95 procent staat twee keer in de
  bevroren bron (`src/Workouts/Ftp.gs:123`, `src/Doel.gs:22`), maar `docs/WERKWIJZE.md:57`:
  *"GAS is een PORT-referentie, geen normbron."* Wat wél waar is en wat ik eerst verkeerd had: de
  regel is niet lezerloos — hij RENDERT (`WorkoutDetail.tsx:167`), dus **Daan ziet die zin elk
  testblok op zijn scherm.**
- **NIEUW EN LIVE: ROADMAP PUNT 73 — `PUT /api/settings` kan geen enkel veld wijzigen zonder de rest
  te wissen, en de doel-wissel loopt daar VANDAAG stil op stuk.** `writeSettings` is full-replace, dus
  een partiële body nult vijftien velden; een volledige body klapt op `numField`/`strField`
  (`api.ts:124-135`) zodra een veld null is. GEMETEN op de lokale D1: **`fase` is null**.
  `DoelPassendCard.wissel()` stuurt het volledige object terug, krijgt een 400, en de
  `catch { setSaving(false) }` slikt hem — **de knop doet niets en zegt niets.** Niet gemeten: of de
  PROD-rij ook een null-veld draagt. Punt 69 heeft dit pad nodig om een goedgekeurde FTP weg te
  schrijven.
- **ROADMAP PUNT 74:** zes van de 21 kolommen op `sync_state` zijn dood, waaronder `ftp_last_sync` —
  de port-schaduw van `setFtpLastSync` in GAS. Die naam nodigt uit tot hergebruik door precies de
  ronde die het FTP-voorstel bouwt.
- **DE WEERLEGGINGSPAS: 4 VAN 4 LENZEN VOLTOOID, nul gestorven, en hij draaide VOOROP.** Drie van de
  vier haalden hun claim onderuit — en het waren mijn eigen zinnen. Zwaarste correctie: *"`testResultaat`
  doet die match al"* is FOUT. Die functie leest uitsluitend de OVERRIDE en raakt geen enkele
  activiteit; de koppeling plan→rit is niet meer dan dezelfde kalenderdag plus 15 fietsminuten, en bij
  twee ritten houdt `done.idExt` de LANGSTE. Er is dus **geen bestaande poort** die zegt dat de test
  ook echt gereden is.
- **DE BACKFILL IS NIET GEDRAAID en er is niets voor gebouwd**, met grond: §7 van de prompt zette de
  volgorde vast op bouwen-dan-droogdraaien-dan-akkoord, en de bouw vond niet plaats. De
  randvoorwaarden staan genoteerd (gedoseerd, teller, harde bovengrens die GOOIT, HERSTARTBAAR, alleen
  lezen) voor de ronde die hem wél bouwt: ongeveer **255 ritten**, ongeveer **1,4 MB**, één verzoek per rit.
- **NIEUW IN DE WERKWIJZE: CC-MODUS.** Auto mag voor recon en client-only bouw; hij gaat UIT zodra
  prod, remote D1 of een deploy in beeld komt, en voor elke handeling die naar buiten schrijft of in
  bulk leest — een backfill hoort daarbij. En auto is nooit toestemming om door een omgevallen
  verwachting heen te lopen.
- **TWEE GET-VERZOEKEN aan intervals.icu**, allebei op `/activity/i172391866/power-curve`, achter een
  bovengrens die GOOIT. Geen mutatie, nergens. De sleutel heet `INTERVALS_API_KEY` en zijn waarde staat
  nergens.
- **`docs/RITDATA-RECON.md` §2 IS ALSNOG RECHTGEZET.** Die meetsectie droeg de premisse die punt 70
  introk nog steeds als feit; §8 stond al goed maar §2 was blijven staan. Nu doorgehaald met de
  correctie erbij.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 ·
  69 (wacht op het besluit) · 71 · 72 · 73 · 74.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 — de DOELCHECK aan het eind van het doelblok, de tweede helft
van M89, samen met punt 54 (welke maat per doel).** Punt 69 ligt stil tot Daan de factor kiest; zodra
dat besluit er is, is de bouw één ronde — §6 van `docs/PUNT69-BOUW.md` beschrijft hem volledig, en punt
73 hoort daar dan bij omdat de goedkeuring anders niets kan wegschrijven. **BEGIN BIJ DE GRONDSTOF, en
die is deze week gemeten:** `DOELEN-SPEC` §3.2 vraagt het beste 20-minutenvermogen over ZES WEKEN,
en dat venster BESTAAT — `curves=42d` werkt, `curves=6w` wordt geweigerd met 422, en `curves=42d,90d`
geeft beide vensters in ÉÉN verzoek. Let op twee dingen die in `docs/RITDATA-RECON.md` staan:
`curves=42d` is feitelijk **43 dagen** (`days` 43, `end_date_local` een dag ná vandaag), en §3.2 draagt
TWEE criteria op TWEE grootheden terwijl een 42d-piek er maar één levert. De whitelist die verbreed
moet worden is `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);` naast
`export type PowerCurveWindow = "90d" | "1y";`.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-24 (DERDE BLOK VAN DEZE DAG) — DE RONDE TROK ZICHZELF IN. Punt 70 bestond om een
leesfout in de power-curve te repareren. **Die leesfout bestaat niet.** De reparatie is geschreven,
groen getest, en daarna volledig teruggedraaid. **Er is deze ronde GEEN REGEL CODE gewijzigd**, en dat
is de opbrengst en geen mislukking.
- **DE PREMISSE WAS FOUT, en zij stond in twee documenten en in een HANDOFF-blok.** Verbatim: *"Een
  mean-max-kromme hoort niet te STIJGEN met de duur: wie X watt over 23 minuten volhield, hield per
  definitie ook ergens 20 minuten ≥X watt vol."* De tweede helft is geen stelling. Tegenvoorbeeld met
  de hand, het signaal `[10, 0, 10]`: beste 2s-gemiddelde **5,00 W**, beste 3s-gemiddelde **6,67 W**.
  Een langer venster mag het ZWAKKE MIDDEN meetellen zolang beide STERKE RANDEN erin passen; een
  korter venster moet één rand opgeven.
- **EN HET GEBEURT ECHT, op Daans eigen data.** Herberekend uit de rauwe 1 Hz-`watts`-stream van rit
  `i171448183` (4407 samples), uitputtend: beste 140s = **357,643 W** over 4268 vensters, beste 165s =
  **366,927 W** over 4243. Beslissend: het beste 140s-blok van de hele rit LIGT IN dat 165s-venster en
  haalt daar 357,643 W. De "reparatie" zou 140s op **366,9 W** zetten — een gemiddelde dat in geen van
  die 4268 vensters bestaat. **Zij verving een JUIST getal door een ONHAALBAAR getal.**
- **`pcMarkerAt_` LAS AL GOED.** Op het 42d-venster is 261 W op 1200 s het beste twintigminutenblok en
  264 W op 1380 s het beste drieëntwintigminutenblok. Twee vragen, twee antwoorden, allebei juist. De
  bestaande niveaukaart is in orde en de doelcheck erft geen leesfout.
- **DE WEERLEGGINGSPAS: 3 VAN 3 LENZEN VOLTOOID — en hij verdiende zichzelf dezelfde ronde terug.**
  Vooropgedraaid, zoals sinds deze ronde de regel is. Was hij als sluitstuk gedraaid, dan was
  `monotoniseerKromme` groen, gecommit en gedeployd geweest. **De volgorde van de pas is geen
  procesdetail; zij was hier het verschil.** Vastgelegd in `docs/WERKWIJZE.md`.
- **DE DIEPERE LES, en die is groter dan deze ronde.** Alle drie de verwachtingen waren toetsbaar en
  twee werden bevestigd door echte metingen op echte data. Toch was de conclusie fout: geen van die
  metingen raakte de AANNAME eronder. P2 mat "is het lopende maximum ooit lager" — 0 keer op 566
  punten over drie vensters — en een lopend maximum KÁN niet lager zijn. Dat is zijn definitie, geen
  bevinding. **Een verwachting die niet kan falen, toetst niets en leest achteraf als bewijs.** Nieuw:
  `docs/CC-CHECKS.md` **CHECK 40** — zoek het kleinste tegenvoorbeeld met de hand vóór je een
  definitorische aanname laat dragen.
- **TWEE BIJVANGSTEN, allebei zelf nagemeten en allebei een nieuw punt.** (71) De `curve`-array in de
  power-curve-DTO heeft **GEEN enkele lezer**: de grafiek komt uit `markers`
  (`Rijdersprofiel.tsx:45` is `function CurveChart({ markers }: { markers: PowerCurveMarker[] })`).
  (72) `scripts/powercurve-smoke.mjs:61` is een **DERDE ingang** naar `pcNormalize_`, buiten
  `workers/api/src/integrations/powercurve.ts` om — in de teruggedraaide code stond een commentaarregel
  dat die grens "de enige ingang" was, en dat was aangenomen en niet getoetst.
- **NUMMERING, en meld dit terug aan de chat.** De prompt heette "punt 68", maar 68 was in
  `docs/ROADMAP.md` al bezet door *"De per-blok-antwoorden dragen TWEE doel-kolommen"* en 69 door
  *"HET FTP-VOORSTEL NA EEN GEREDEN TEST"*. Deze ronde staat daarom als **punt 70**, de bijvangsten
  als 71 en 72.
- **HET BLOK HIERONDER IS OP TWEE PLEKKEN DOORGEHAALD**, want het droeg de fout: de bullet over
  "direct afleesbaar" en de FOCUS-regel die het lopende maximum in ELKE weg voorschreef.
  `docs/RITDATA-RECON.md` §8 is herschreven van reparatie naar intrekking.
- **DRIE GET-VERZOEKEN aan intervals.icu**, alle met een harde bovengrens die GOOIT. Geen mutatie,
  nergens — geen migratie, geen deploy, geen remote-D1-schrijfactie. De sleutel heet
  `INTERVALS_API_KEY` en zijn waarde staat nergens.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72.

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 — HET FTP-VOORSTEL NA EEN GEREDEN TEST.** Rijdt Daan een
aangeboden ijkinspanning, dan berekent de app een nieuwe drempelwaarde en STELT DIE VOOR met de oude
ernaast; vandaag vraagt de app om een meting en doet niets met de uitslag. De grondstof is gemeten en
bestaat: `GET /activity/{id}/power-curve` geeft de 20-minutenpiek van ÉÉN rit direct, 5353 bytes, één
verzoek — en de athlete-curve kan dat NIET vervangen, want die wijst de BESTE rit in het venster aan
en niet de laatste. **WAT EERST EEN DAAN-BESLUIT VRAAGT: de omrekenregel.** Van 20 minuten naar een
drempelwaarde hoort een factor (klassiek circa 95 procent) en die staat NERGENS in de repo of in
`DOELEN-SPEC` — behalve als UI-tekst in `ftp.ts` met nul lezers in code, en die gaat over het
TESTBLOK en niet over de beste 20 minuten van de rit. Dat zijn twee verschillende getallen en er moet
één gekozen worden. **EN NEEM GEEN LOPEND MAXIMUM:** lees de waarde OP 1200 seconden, zie het
bovenstaande blok. De keuze uit `docs/RITDATA-RECON.md` §7 blijft open voor de doelcheck (punt 61) en
het onderweg-signaal (punt 63).

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
