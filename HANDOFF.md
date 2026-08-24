# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 — DE TIJDZONE-SCHULD IS GEMETEN EN PROD DRAAIT WEER OP MAIN. Geen code, alleen
meting plus docs — en de eerste WORKER-DEPLOY sinds 10-08-2026.
- **DAAN GEBRUIKT DE GEDEPLOYDE APP.** Dat stond tot deze ronde nergens vastgelegd en het is het
  belangrijkste feit voor elke volgende prod-handeling: prod is GEEN proefopstelling. Elke
  prod-mutatie draagt vanaf nu vooraf haar WEG TERUG, gemeten en niet aangenomen — vastgelegd in
  `docs/WERKWIJZE.md`.
- **DE PROD-STAND, en het logboek is `docs/PROD-STAND.md`.** Remote D1 `cadans` draagt 0000 t/m
  0012. De Worker draait nu op **`940414c4-be95-4968-9eef-542a188db563`** sinds
  `2026-08-24T05:35:36.574Z`, gebouwd uit commit `46f2103`. Terugvaldoel is de vorige versie
  `e994c768-3d73-4aec-876b-b614b7fe1302`. Prod loopt daarmee weer GELIJK met main; van 10-08 tot
  24-08 was het schema bij en de code niet.
- **DE WEG TERUG IS GEMETEN, niet uit documentatie overgenomen.** Worker:
  `npx wrangler rollback <version-id>` bestaat en het terugvaldoel stond geverifieerd in
  `wrangler versions list` (die lijst kapt af op de tien nieuwste — zakt je doel eruit, dan is er
  geen weg terug). D1: Time Travel, bereik aan BEIDE randen getoetst — 25 dagen terug levert een
  bookmark, 40 dagen terug wordt geweigerd met *"within the last 30 days"*. Een worker-deploy raakt
  D1 niet, dus voor de deploy is de rollback de weg terug en niet Time Travel.
- **DE METING VAN PUNT 65 — `docs/TZ-RECON.md`, en dit is de eerste keer dat dat punt een MAAT
  draagt.** (M-A) Precies VIJF plekken in `workers/api` produceren een datum uit de ambient klok:
  het sync-venster van `syncActivities` en `syncWellness`, de dag-bucket `fetchedOn` en de
  cache-sleutel `today` in `powercurve.ts`, plus het absolute `toISOString` in `writeCheckin`.
  `weekplanFreeze.ts` is GEEN producent — hij krijgt `todayISO` uit de client-body, wat een aanname
  corrigeert die er twee rondes stond. (M-B) Dezelfde instants langs twee klokken, **210.240
  vergelijkingen** (elk kwartier van 2026 × zes `daysBack`-waarden): **alle verschillen liggen in de
  UTC-uren 22 en 23, daarbuiten NUL.** (M-C) **0 scheve rijen, en structureel nul**: de enige door
  de Worker geproduceerde datumkolom is `power_curve_cache.fetched_on`, een TTL-bucket waarvan de
  faalwijze een overbodige re-fetch is. T1 en T2 hielden allebei.
- **DE WEERLEGGINGSPAS BRAK DRIE VAN MIJN EIGEN GETALLEN, en twee van de vier lenzen stierven op
  een server-fout (529 en mid-response) — de lenzen op M-A en M-C zijn dus NIET gedraaid.** Wat wél
  kantelde en door mij is hermeten: de eerste noemer was 384 (vier dagen) en kon per constructie
  geen DST-OVERSPANNEND venster bevatten; "2 uur zomer, 1 uur winter" is te grof, want welk van de
  uren 22 en 23 verschilt hangt af van het DST-regime bij ELKE RAND apart; en 6,3 procent is geen
  constante maar 6,58 tot 7,60 procent, met 6,88 (activiteiten) en 7,25 (wellness) als de waarden
  die prod werkelijk gebruikt. Eén TEGENSPRAAK tussen twee lenzen is door mijn eigen telling
  beslecht: verschillen buiten de UTC-uren 22 en 23 zijn er niet, 0 op 210.240.
- **DRIE VONDSTEN DIE DE REPARATIE-RICHTING RAKEN, en ze wijzen TEGEN een simpele Amsterdam-pin.**
  (i) Het venster SCHUIFT niet alleen maar KRIMPT en GROEIT: `oldest` gebruikt een
  MILLISECONDEN-aftrek, dus onder Amsterdam is de span 59/60/61 dagen waar hij onder UTC altijd
  exact `daysBack` is. (ii) De datetime-round-trip is onder UTC exact (0 van 1152) en onder
  Amsterdam een uur scheef in het DST-GAT (12 van 1152, allemaal 2026-03-29 tussen 02:00 en 02:55 —
  een uur dat in Amsterdam niet bestaat). (iii) `newest` onder UTC is NOOIT later dan bedoeld, wel
  2300 keer één dag eerder, dus de faalwijze is een TIJDELIJK ONTBREKENDE rij die de volgende sync
  herstelt. De vermoedelijk betere reparatie is de ms-aftrek vervangen door KALENDERrekenwerk, niet
  de proceszone verzetten — maar dat is een eigen besluit op een eigen meting.
- **ER IS GEEN CRON.** De syncs worden alleen aangeroepen als de client het schema-scherm opent, dus
  de blootstelling is niet een uniforme 6,88 procent maar de kans dat Daan de app tussen 00:00 en
  02:00 lokaal opent. Stond er wél een cron in de band, dan was die kans 100 procent geweest.
- **WAT DE NA-VERIFICATIE NIET KON AANTONEN, en dat is geen tekortkoming maar de stand van zaken.**
  (1) **CC-CHECKS 37 is NIET gedraaid**: die wil de LIVE `index.html` byte-voor-byte tegen de lokale
  build leggen, en de hele origin zit achter een basic-auth-gate waarvan het wachtwoord een
  deploy-only secret is. Wat er wél is: de geuploade bundelnaam `/assets/index-BiwPwGBR.js` komt
  overeen met die in de lokale `index.html` — een naam-vergelijking, geen byte-vergelijking.
  (2) **DE IJKING-LAAG IS INERT TOT 2026-09-21.** Met de echte prod-instellingen (`doel` FTP,
  `doel_start` `2026-06-29`) geeft `computeMacroPhase` voor 24-08 week 9 (Peak); poort (1) eist week
  1. Wie vandaag kijkt en geen ijkaanbod ziet, ziet het JUISTE gedrag. Een rooktest kan de nieuwe
  laag dus niet tonen.
- **WAT DAAN KAN CONTROLEREN:** open de app op `https://cadans-api.dtkorteweg.workers.dev/`, log in
  met de basic-auth, en kijk of de weekkaart normaal laadt en het schema-scherm geen 500 geeft. Meer
  valt er vandaag niet aan te zien.
- **NIEUW VANGNET: CC-CHECKS 39.** De persistente lokale D1 moet dezelfde migratiestand dragen als
  de repo. De GATE kan dat per constructie niet zien — vitest migreert een verse database per run —
  en dat gat kostte twee rondes waarin `wrangler dev` de ijking-routes niet kon bedienen.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 (alleen de nakijkpunten) · 65 (alleen de
  REPARATIE, de meting is af) · 66 · 67 · 68.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 — de DOELCHECK aan het eind van het doelblok, de tweede helft
van M89, samen met punt 54 (welke maat per doel).** De TZ-reparatie is NIET de eerstvolgende: zij is
nu gemeten, blijkt een randgeval van 1 tot 2 uur per etmaal zonder blijvend gevolg, en heeft geen
haast. De doelcheck wel — in februari sluit het onderhoudsblok en dan is de vraag of de FTP het
gehouden heeft, vóór de Amstel-Gold-voorbereiding begint. Het is bovendien het enige deel van punt
47 dat nooit is aangeraakt. 54 hangt eraan vast: wie 61 bouwt zonder 54 kiest stilzwijgend een maat.
**BEGIN BIJ DE GRONDSTOF, want die ontbreekt en dat is gemeten.** `DOELEN-SPEC` §3.2 vraagt het beste
20-minutenvermogen over ZES WEKEN. Dat getal bestaat als marker — `{ sec: 1200, label: "20m", key: true }`
— maar alleen over `export type PowerCurveWindow = "90d" | "1y";` met whitelist
`const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`. De dichtstbijzijnde route is een DERDE
waarde in die union plus de whitelist, én VERIFICATIE dat intervals.icu die `curves`-waarde
accepteert — dat laatste vraagt een echte API-aanroep en is niet vanaf schijf te beantwoorden.
DAARNA komt punt 63, het onderweg-signaal, en dat WACHT op punt 49.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.

**DE TWEE WEGGOOI-REGELS ZIJN OPGERUIMD.** `.claude/rules/` is leeg; beide probes zijn beantwoord.
`RULESALTIJD-MERKSTRING-Q4XM7D`: een regel ZONDER `paths` laadt bij sessiestart — gemeten, 5 van 6
verse agents gaven hem verbatim terug terwijl hij 0 keer in hun opdracht stond.
`RULESPATHS-MERKSTRING-V9HB2K`: een PAD-GESCOOPTE regel vuurt op de FILE-READ en niet eerder —
gemeten met één agent die `packages/engine/src/zones.ts` las en de merkstring pas NA het
Read-resultaat zag. ROADMAP punt 51 stap (2) is daarmee AF. Wat NIET gemeten is en niet meetbaar
was: of een regel zonder `paths` ook in de HOOFDsessie laadt — deze sessie is ouder dan het bestand.
Een verse chat beantwoordt dat gratis in haar openingszin.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

STAND 2026-08-23 (NEGENDE BLOK VAN DEZE DAG) — DE TWEE MIGRATIES STAAN OP REMOTE D1. Geen code van
betekenis, geen engine, en met opzet GEEN worker-deploy. Voor het eerst is de prod-stand
opgeschreven, en dat is nu een eigen document: **`docs/PROD-STAND.md`.**
- **DE PROD-STAND IN ÉÉN ADEM.** Remote D1 `cadans` draagt migraties **0000 t/m 0012**, dertien
  stuks, geen gaten, niets openstaand. De Worker **IS gedeployd**: versie
  `e994c768-3d73-4aec-876b-b614b7fe1302`, live sinds `2026-08-10T13:19:32.453Z`, 10 deployments in
  totaal. **HET SCHEMA IS BIJ, DE CODE NIET** — alles van na 10-08-2026 draait niet op prod,
  inclusief het hele punt-47-blok. Dat stond nergens genoteerd en is deze ronde gemeten.
- **W1, W2 EN W3 HIELDEN alle drie, en ze zijn gemeten VÓÓRDAT er iets is toegepast.** W1: remote
  droeg 11 migraties, `0000` t/m `0010` aaneengesloten, met precies `0011` en `0012` openstaand en
  13 `.sql`-bestanden lokaal — 11 + 2 = 13, geen drift. W2: geen rij met `ijking_blok` gevuld, en
  dat kón ook niet want de kolom bestond niet; omdat beide migraties in ÉÉN handeling zijn
  toegepast heeft er nooit een venster bestaan waarin een rij onder 0011-alleen kon ontstaan, dus
  de backfill-schuld die ronde 6 noteerde is per constructie leeg gebleken. W3: **1 rij vóór en ná,
  0 gewijzigde waarden op de 18 bestaande kolommen, exact drie kolommen erbij, alle drie NULL.**
- **TOEGEPAST MET:** `npx wrangler d1 migrations apply cadans --remote` vanuit `workers/api` — de
  migratie-route, nooit met de hand SQL op prod-D1. Drie statements, alle drie `ALTER TABLE
  sync_state ADD`. Wrangler stelde zijn eigen bevestigingsvraag en beantwoordde die met
  `Using fallback value in non-interactive context: yes` omdat deze shell geen TTY is; er is GEEN
  `--yes`-vlag meegegeven. Wie dat strakker wil, moet het aan de wrangler-kant afdwingen.
- **STAAND BELEID VANAF NU (Daan-besluit):** elke ronde die een migratie TOEVOEGT, past hem in
  DIEZELFDE ronde toe op remote. Niet opsparen — opsparen maakt de uiteindelijke toepassing
  riskanter en niet veiliger. Vastgelegd in `docs/WERKWIJZE.md` onder *Migraties en deploys*, met
  de scheiding erbij: **een remote migratie is GEEN worker-deploy en de twee zijn aparte
  goedkeuringen met een ander risico.** En met de les die deze ronde erbij leverde: toepassen is
  TWEE handelingen, `--local` én `--remote`.
- **DE VERIFICATIEPAS VOND EEN ECHT DEFECT, en het zat NIET op remote maar LOKAAL.** De persistente
  miniflare-database had `0011` en `0012` NOOIT toegepast gekregen — gemeten:
  `SELECT ijking_blok FROM sync_state --local` gaf `no such column: ijking_blok`. **Dus
  `wrangler dev` op 8787 en `tools/shots/shot.mjs` konden `GET`/`PUT /api/ijking` helemaal niet
  bedienen**, twee rondes lang. De GATE zag dat nooit: `workers/api/vitest.config.ts` past alle
  dertien migraties toe op een VERSE D1 per run, dus de suite draait altijd op het volle schema.
  **Een groene gate sluit een kapotte dev-omgeving niet uit.** Gerepareerd met
  `pnpm db:migrate:local`; lokaal en remote dragen nu allebei 21 kolommen en 0 openstaand.
- **MIJN EIGEN HOOFDCLAIM IS OP ZIJN EERSTE HELFT WEERLEGD.** "Remote draagt nu hetzelfde schema
  als lokaal" was ONWAAR op het moment dat ik het opschreef: een lens vergeleek alle tabellen
  kolom-voor-kolom en vond 14 van de 15 identiek met **alleen `sync_state`** afwijkend, remote 21
  tegen lokaal 18. Het toepassen op remote liet de twee juist UITEENLOPEN. Ná de lokale reparatie
  klopt de claim, en nu gemeten in plaats van aangenomen. Twee kleinere correcties: "deployments
  totaal 10" is de PAGINEERGRENS van de CLI (verbatim *"Displays the 10 most recent deployments"*)
  en geen telling, en "0 verwijzingen naar `ijking`" was een verkeerd greppatroon — dat geeft 3
  treffers binnen *afwijking* en *vergelijking*; met `ijking_` is het 0, en sterker: die string
  bestaat pas sinds 23-08-2026.
- **DE VÓÓR-SNAPSHOT IS CEREMONIE GEBLEKEN, geen bewijs.** Omdat `ADD COLUMN` per definitie geen
  bestaande waarde kan wijzigen, is "na-staat minus de drie nieuwe sleutels" noodzakelijk gelijk aan
  de vóór-staat — een lens reproduceerde het bestand byte-voor-byte. Wat "niets verloren" wérkelijk
  draagt is de DDL plus `d1_migrations`: SQLite laat `ADD COLUMN` falen op een bestaande naam, dus
  een geregistreerde geslaagde toepassing bewíjst de afwezigheid. **Voor een niet-additieve migratie
  geldt dat niet** — daar is een echte vóór-snapshot wél bewijs, en dan hoort de ruwe
  wrangler-uitvoer mee bewaard.
- **PROD IS GEEN STILLE DATABASE, en dat is niet vooraf afgewogen.** `wellness` draagt een rij van
  `2026-08-23` en `power_curve_cache` een `fetched_on` van diezelfde dag; de migratie liep om
  `17:17:43` UTC. Of die schrijfacties ervóór of erná vielen is NIET vast te stellen — beide velden
  dragen alleen een dag. `ADD COLUMN` is metadata-only en er is aantoonbaar niets misgegaan, maar er
  is geen onderhoudsvenster gekozen en geen herstelpunt vastgelegd. Bij iets zwaarders dan
  `ADD COLUMN` is dat wél het verschil.
- **WAAROM ER NIET GEDEPLOYD IS, en dat is een harde voorwaarde geworden: ROADMAP punt 65.** De
  engine formatteert met LOKALE getters en leunt op `TZ=Europe/Amsterdam`; een gedeployde Worker
  draait UTC, en `workers/api/src/db/dates.ts` is de enige conversielaag en spiegelt diezelfde
  aanname. `docs/ARCHITECTUUR.md` draagt die schuld al als open. **Punt 65 gaat vooraf aan elke
  worker-deploy**, en het begint met MÉTEN in plaats van beredeneren: draai de datumlaag onder
  `TZ=UTC` naast `TZ=Europe/Amsterdam` op de randen die tellen (maandag rond middernacht, de
  DST-overgangen, `toD1Date` heen en terug), en beslis pas dáárna of de engine expliciet moet of de
  Worker gepind.
- **DE RULES-PROBES ZIJN NU BEIDE GEMETEN, en dat sluit ROADMAP punt 51 stap (2).** De
  `paths`-LOZE regel laadt bij SESSIESTART: 5 van de 6 weerleggings-agents van de vorige ronde
  gaven `RULESALTIJD-MERKSTRING-Q4XM7D` verbatim terug terwijl die string 0 keer in hun opdracht
  stond. De PAD-GESCOOPTE regel vuurt op de FILE-READ: één agent kreeg opdracht
  `packages/engine/src/zones.ts` te lezen en te rapporteren wát hij aan instructies aantrof — de
  merkstring is hem NIET genoemd — en hij rapporteerde `RULESPATHS-MERKSTRING-V9HB2K` mét het
  onderscheid dat die **pas ná** het Read-resultaat verscheen, terwijl de eerste er al vanaf de
  start stond. **WAT OPEN BLIJFT:** of een regel zonder `paths` ook in de HOOFDsessie laadt; deze
  sessie is ouder dan het bestand en kan haar eigen start niet waarnemen. Een verse chat
  beantwoordt dat gratis in haar openingszin. Beide regels zijn gitignored en blijven liggen.
- **M92 IS AANGESCHERPT NAAR PER (OPENING, DOEL)** in `docs/TRAININGSMODEL.md` — een preciezere
  formulering van dezelfde regel, geen nieuwe regel, M3 gerespecteerd. Het gedrag blijft: een doel
  waarvoor niemand heeft geantwoord hoort de vraag te krijgen. De prijs staat erbij en wordt
  aanvaard: heen-en-weer wisselen binnen de beantwoorde week geeft twee aanbiedingen op dezelfde
  openingsmaandag.
- **EEN DATUMFOUT VAN DE VORIGE RONDE IS RECHTGEZET.** Ronde 6 is gedateerd op 24-08-2026 terwijl
  zij op **23-08-2026** landde — de commits staan op `2026-08-23 18:53`. 24 provenance-vermeldingen
  in 8 bestanden zijn gecorrigeerd; de 12 vóórkomens van `2026-08-24` als KALENDERDATUM (Daans
  Peak-maandag) zijn met opzet blijven staan. Het blok hieronder heette daardoor eerst
  "STAND 2026-08-24" en is nu het ACHTSTE blok van deze dag.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 53 · 54 · 56 · 61 · 63 · 64 (alleen de drie nakijkpunten) · **65 (nieuw — de TZ-schuld, vóór
  elke deploy)** · **66 (nieuw — de plan-uitgang verzet de leeftijd)** · **67 (nieuw — dode
  machinerie in poort (5))** · **68 (nieuw — twee doel-kolommen, niet drie)**.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 — de DOELCHECK aan het eind van het doelblok, de tweede helft
van M89, samen met punt 54 (welke maat per doel).** Dat is het enige deel van punt 47 dat nooit is
aangeraakt. GROND VOOR DEZE PLEK, en het is een kalendergrond: in februari sluit het onderhoudsblok
en dan is de vraag of de FTP het gehouden heeft, vóór de Amstel-Gold-voorbereiding begint. M92 heeft
de twee vragen van M89 ook in de TIJD gescheiden — de ijking staat nu vooraan en kijkt vooruit, de
doelcheck hoort achteraan en kijkt terug — maar die tweede helft bestaat nog niet als eigen moment.
54 hangt eraan vast: wie 61 bouwt zonder 54 kiest stilzwijgend een maat.
**BEGIN BIJ DE GRONDSTOF, want die ontbreekt en dat is gemeten.** `DOELEN-SPEC` §3.2 vraagt het beste
20-minutenvermogen over ZES WEKEN. Dat getal bestaat als marker — `{ sec: 1200, label: "20m", key: true }`
— maar alleen over `export type PowerCurveWindow = "90d" | "1y";` met whitelist
`const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`. De dichtstbijzijnde route is een DERDE
waarde in die union plus de whitelist, én VERIFICATIE dat intervals.icu die `curves`-waarde
accepteert — dat laatste vraagt een echte API-aanroep en is niet vanaf schijf te beantwoorden.
DAARNA komt punt 63, het onderweg-signaal, en dat WACHT op punt 49.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
