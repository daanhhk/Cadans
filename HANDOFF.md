# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 (VIJFDE BLOK VAN DEZE DAG) — **EEN LIVE DEFECT IS WEG EN PUNT 69 IS ONTBLOKT.**
Punt 73, kleine reparatieronde. De doel-wissel-knop deed sinds zijn bouw niets en zei niets; dat is
gerepareerd, getest en uitgerold.
- **HET DEFECT, in één zin.** `PUT /api/settings` weigerde een expliciete `null` met een 400, terwijl
  het wire-type `Partial<SettingsInput>` elk veld als `T | null` typeert — de route ging tegen zijn
  eigen gepubliceerde type in. Onder FULL-REPLACE betekent een WEGGELATEN veld al "wissen"; een
  expliciete null hoort hetzelfde te betekenen. **De reparatie is dat en niet meer:** `numField` en
  `strField` geven nu `null` terug, de `doelStart`-tak accepteert null, en de drie presentatie-velden
  gebruiken `?.slice(0, 24) ?? null`.
- **DE OMVANG WAS GROTER DAN ÉÉN KOLOM.** GEMETEN op de settings-rij: **21 kolommen, VIJF op NULL**
  (`threshold_pace`, `fase`, `ftp_auto_update`, `weight_auto_update`, `email_digest`), en GEEN ENKELE
  datakolom draagt `.notNull()`. Alle zestien velden die de route accepteert konden dus een 400 geven.
  En `fase` was niet de algemene dader: de negen `numField`-poorten staan op positie 1 t/m 9 en `fase`
  pas op 11, dus een leeggelaten `doelDuur` of `lthr` gooit eerder. Dat het hier `fase` was, is een
  eigenschap van díe rij.
- **ROOD GEMETEN, en dat is de kern van het bewijs.** De regressietest faalde vóór de reparatie met
  precies `expected 400 to be 200` op een volledig settings-object met nulls — het live defect,
  gereproduceerd in de harness. Daarna groen.
- **ER IS GEEN ENKELE BESTAANDE TEST GEWIJZIGD**, en dat is de toets dat de semantiek niet verschoven
  is. Full-replace staat, weglaten cleart nog steeds, en de lassing tussen `doel` en `doelStart` is
  intact — een body met alleen `doel` wist `doelStart`, precies zoals punt 28 nodig heeft.
- **DE WEERLEGGINGSPAS VERANDERDE HET ONTWERP, en dat is de belangrijkste opbrengst.** Ik wilde van
  PUT een MERGE maken. Pas 1 (**4 van 4 VOLTOOID**, drie weerlegd) haalde dat onderuit: een merge
  maakt de doel/doelStart-lassing STIL los, geen van de aanroepers heeft haar nodig, en zij kantelt
  negen tests waar de gekozen vorm er nul kantelt. **DRIE AANROEPERS, niet één** — en de derde,
  `tools/shots/shot.mjs`, had het probleem al opgelost: hij filtert nulls eruit en legt de reden
  erbij uit.
- **PAS 2 (3 van 3 VOLTOOID) WEERLEGDE DE REPARATIE NIET**, maar ving wel drie dingen: een OVERCLAIM
  van mij (ik schreef dat de merge in `docs/UI-SYNC-SETTINGS-RECON.md` "afgewezen" was — hij staat
  daar als OPEN BESLISPUNT), drie docstrings die het oude contract bleven verkondigen, en een gat in
  mijn eigen regressietest (dertien van de zestien sleutels; precies de drie herschreven
  presentatie-velden ontbraken). Alle drie rechtgezet.
- **DE LEGE STRING IS IETS DERDES**, en dat is nu vastgepind: `""` passeert `strField` en landt als
  `''` in D1, niet als NULL. Dat was al zo en is niet gewijzigd; de docstrings beweerden er ten
  onrechte "geeft 400" over.
- **NIEUW: ROADMAP PUNT 75** — er zijn **14 stille `catch`-blokken over 12 coach-kaartbestanden**, een
  gekopieerd sjabloon, en er is GEEN gedeelde foutmelding. Deze ronde repareerde er één (de kaart waar
  het defect zat) en liet de rest bewust staan. `coachNarrative.ts` draagt sinds nu één
  mislukking-regel, `schrijfMisluktRegel` — het begin van het idiom, niet het einde.
- **NIEUW: ROADMAP PUNT 76 — PROD-D1 IS NIET TE LEZEN met deze sessie.** `wrangler d1 execute
  --remote` geeft `code 7403`; `wrangler whoami` toont een token met `workers`- en
  `workers_scripts`-scopes maar **zonder `d1`**. Daardoor is verwachting R3 **NIET GEMETEN**: of de
  PROD-rij ook een null-veld draagt, staat niet vast. De AFLEIDING is sterk — het formulier biedt voor
  `fase` alleen "" (Automatisch) en "maintain", dus wie nooit "maintain" koos heeft null — maar een
  afleiding is geen meting en wordt hier ook niet als meting gepresenteerd.
- **M93 DRAAGT NU EEN EIGEN NUMMER.** Het factor-besluit van vorige ronde leefde als blokquote onder
  M92; het is gepromoveerd tot **M93 (NORM)** — M92 gaat over de PLAATSING van de ijking, M93 over de
  REKENREGEL. Tegelijk rechtgezet: die eerste versie schond **M2** (geen bestandsnamen of
  regelnummers in de canon); de vindplaatsen staan nu in het verdict-document.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 76.

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 — HET FTP-VOORSTEL NA EEN GEREDEN TEST BOUWEN.** Alles wat het
blokkeerde is weg: de factor staat als **M93** in de canon (95 procent van het beste
twintigminutenvermogen, afgelezen op `secs = 1200`) en het schrijfpad werkt sinds punt 73, dus een
goedgekeurde FTP kan landen. Het ontwerp ligt volledig in `docs/PUNT69-BOUW.md` §6.
**WAT DIE RONDE NOG MOET OPLOSSEN, en het is allebei GEMETEN:** (1) de koppeling plan→rit is ZWAK —
`testResultaat` leest alleen de override en raakt geen enkele activiteit; de enige koppeling is
dezelfde kalenderdag plus een vloer van 15 fietsminuten, en bij twee ritten houdt `done.idExt` de
LANGSTE. (2) De app kan NIET zien of er vol gereden is: een Z2-rit gaf 195 W, waaruit 185 W zou volgen
tegen een gezette FTP van 280 — een verlaging van **34 procent**. **DE PLAUSIBILITEITSGRENS DIE DAT
MOET VANGEN IS EEN DREMPEL EN WORDT OP DE ECHTE REEKS GEIJKT, nooit in een gesprek gekozen.** De
backfill van ongeveer **255** per-rit-krommes (ongeveer **1,4 MB**, één verzoek per rit) levert
daarvoor de kalibratieset en is daarmee méér dan compleetheid. Randvoorwaarden van Daan: gedoseerd,
teller, HARDE bovengrens die GOOIT, HERSTARTBAAR, alleen lezen.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-24 (VIERDE BLOK VAN DEZE DAG) — HET FTP-VOORSTEL IS ONDERZOCHT, EN **HET BESLUIT IS
NOG IN DEZELFDE SESSIE GEVALLEN**. Punt 69.

**BOVENAAN, want het verandert de stand van dit punt: DAAN KOOS OP 24-08-2026 WEG A.** De nieuwe
drempelwaarde is **95 procent van het beste twintigminutenvermogen uit de testrit**, afgelezen op
`secs = 1200`. Vastgelegd mét herkomst-etiket en drie randvoorwaarden in `docs/TRAININGSMODEL.md`
§13, direct onder M92 — dus in de CANON, en dat was precies het gat dat Q2 deed omvallen. **Q2 is
gesloten en de bouw uit `docs/PUNT69-BOUW.md` §6 is VRIJGEGEVEN.** Hij is niet meer in deze ronde
uitgevoerd: de close-out was al gedaan en migratie 0013 is een prod-handeling met een eigen
goedkeuring. Wat onlosmakelijk bij die bouw hoort: punt 73 (zonder partieel schrijfpad kan de
goedkeuring niets wegschrijven), een poort die vaststelt dat de test ook echt GEREDEN is, en een
plausibiliteitsgrens.

Wat hieronder staat is de stand zoals die was toen de vraag gesteld werd. Bouwronde geworden tot onderzoeksronde: **er is geen regel code
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

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 BOUWEN — het FTP-voorstel, samen met punt 73.**

**DIT WIJKT AF VAN DE PROMPT, die de doelcheck als FOCUS voorschreef, en de reden is dat het besluit
tijdens de ronde viel.** De prompt schreef die FOCUS toen punt 69 nog op een open besluit wachtte;
dat besluit is er nu, dus punt 69 is niet langer geblokkeerd en staat in de volgorde (11d-7) vóór
punt 61. Het is bovendien een half afgemaakte functie in gebruikershanden: de app vraagt vandaag om
een meting en doet niets met de uitslag. De bouw ligt volledig beschreven in `docs/PUNT69-BOUW.md`
§6 en is naar schatting één ronde. Neem punt 73 mee — zonder partieel schrijfpad kan de goedkeuring
niets wegschrijven — en reken op migratie 0013 met een eigen prod-goedkeuring. Wie het toch anders
wil, draait de volgorde om en zet punt 61 voorop; beide zijn verdedigbaar.

**DAARNA punt 61 — de DOELCHECK aan het eind van het doelblok, de tweede helft van M89, samen met
punt 54 (welke maat per doel). BEGIN BIJ DE GRONDSTOF, en
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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
