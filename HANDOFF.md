# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 (TWEEDE BLOK VAN DEZE DAG) — DE RITDATA IS IN KAART GEBRACHT EN ER LIGT EEN KEUZE
VOOR DAAN. RECON-ronde: geen bouw, geen migratie, geen deploy, read-only op de repo en LEZEND op
intervals.icu. **De deliverable is `docs/RITDATA-RECON.md` en die eindigt met VIJF WEGEN in gewone
taal — Daan leest dat blok en kiest.**
- **DRIE BEHOEFTEN WACHTTEN OP DEZELFDE ONTBREKENDE GRONDSTOF, en ze blijken drie VERSCHILLENDE
  dingen te vragen.** (1) Een piek uit ÉÉN rit, voor het FTP-VOORSTEL na een gereden ijkinspanning
  (nieuw Daan-besluit, ROADMAP punt 69). (2) Een piek over ZES WEKEN, voor de doelcheck. (3) De
  TIJDLIJN binnen een rit, voor het onderweg-signaal.
- **DE ZESWEEKSE GRONDSTOF BESTAAT WÉL, en dat was de open vraag.** `curves=42d` geeft 200;
  `curves=6w` geeft 422 `"Invalid curve: [6w]"`. Het venster is een `<n>d`-vorm en `n` is vrij. **En
  `curves=42d,90d` geeft BEIDE vensters in ÉÉN verzoek**, dus het lift mee op een aanroep die Cadans
  al doet.
- **MAAR "DIRECT AFLEESBAAR" WAS ONJUIST, en dat is de scherpste vondst van de weerleggingspas.** De
  `values`-reeks is NIET monotoon dalend — 11 schendingen op de 42d-curve. Rond de maat, alle punten
  uit DEZELFDE rit `i166073333`: 1200s = **261 W** maar 1380s = **264 W**. Een echte mean-max-kromme
  kan niet stijgen met de duur. **Aflezen op `secs 1200` onderschat met 1,1 procent; je moet het
  lopende MAXIMUM over alle `secs >= 1200` nemen.** Op de per-rit-curve dezelfde vorm: 195 tegen 197.
  **EN DE ENGINE LEEST HEM VANDAAG NET ZO** — `pcMarkerAt_` neemt de eerste index waar
  `secs[i] >= targetSec`, dus de bestaande niveaukaart draagt diezelfde onderschatting. Dat raakt
  een criterium dat over "enkele procenten" gaat.
- **`curves=42d` IS 43 DAGEN.** Gemeten: `label` `"42 days"`, maar `days` **43**, met
  `end_date_local` een dag NA vandaag. Wie letterlijk zes weken wil, stuurt `oldest`/`newest` mee.
- **DE HISTORIE-VRAAG IS BEANTWOORD EN FEBRUARI IS GEEN PROBLEEM.** `oldest`/`newest` begrenzen het
  venster ECHT — gemeten op drie historische bereiken, waarbij niet alleen de DATUM maar ook de
  WATTS per bereik verschilden (254 W in januari, 265 W in het najaar, 231 W in het voorjaar). De
  doelcheck hoeft dus NIET vanaf nu op te bouwen; zij kan met terugwerkende kracht elk venster
  opvragen. Per-rit-krommen zijn ook te backfillen: 255 ritten, ~1,4 MB. Streams zouden ~93 MB zijn.
- **U1 VALT, U2 HOUDT.** U1: de piek-per-rit en de piek-over-zes-weken komen uit TWEE
  endpoint-klassen. Bewijs dat ze niet inwisselbaar zijn: het 42d-venster wees rit `i166073333` aan
  en het 90d-venster `i158575314` — de marker geeft de BESTE rit, niet de LAATSTE. U2: streams zijn
  363535 bytes tegen 5353 voor de per-rit-kromme, ongeveer 68 keer, bij hetzelfde aantal verzoeken.
- **EEN VIERDE WEG DIE OP GEEN ENKELE LIJST STOND, en hij is GRATIS.** De activiteitenlijst die
  Cadans al ophaalt draagt per rit `decoupling` (12/12 ritten), `icu_power_hr_z2` (11/12),
  `icu_power_hr_z2_mins` en `icu_efficiency_factor` (12/12) — 61.412 bytes voor 42 dagen in ÉÉN
  verzoek dat er toch al is. Dat zijn AGGREGATEN per rit en geen tijdlijn, maar het onderweg-signaal
  vraagt een TREND over weken. **Blijkt dat genoeg, dan is het onderweg-signaal de GOEDKOOPSTE van
  de drie behoeften in plaats van de duurste** — en dat verschuift de volgorde.
- **TWEE DINGEN DIE DE WEG NIET DICHT.** (i) §3.2 draagt TWEE criteria op TWEE grootheden: een
  VLOER op "de FTP waarmee de winter begon" (een FTP op een ankerdatum, niet een piek) en een
  DELTA-METER die een basislijn nodig heeft. Een 42d-piek levert alleen de meter-helft. (ii) De
  omrekenregel van 20 minuten naar een drempelwaarde BESTAAT in de repo — `ftp.ts`, verbatim
  *"Nieuwe FTP = 95% van gemiddeld vermogen over de 20 min"* — maar als UI-tekst met nul lezers in
  code, en op het TESTBLOK en niet op de beste 20 minuten van de hele rit. Dat zijn twee getallen en
  er moet één gekozen worden. ROADMAP punt 69 stelde dat de regel nergens staat; rechtgezet.
- **DE POORT VOOR BEHOEFTE 1 BESTAAT AL.** De lens wees erop dat de kromme een getal geeft voor
  ELKE rit — de 195 W kwam van een Z2-rit, en 0,95 × 195 = 185 tegen een gezette FTP van 280. Maar
  Cadans WEET welke dag een test was: de override draagt `workoutType: "test"` plus
  `testBadgeLabel()`, en `testResultaat` herkent die combinatie al. De poort is er; zij is alleen
  niet met de piek verbonden.
- **STREAMS ZIJN GEEN ZUIVERE 1 Hz.** `time` loopt van 0 tot 4544 over 4510 samples: vier gaten,
  35 seconden. Rekenen moet over `time`, niet over de index.
- **NEGENTIEN GET-VERZOEKEN aan intervals.icu**, alle met een harde bovengrens die GOOIT in plaats
  van door te gaan — de les van de vorige ronde. Een dagsync doet er drie, dus dit is ongeveer zes
  dagsyncs. Geen enkele mutatie. De sleutel heet `INTERVALS_API_KEY` en zijn waarde staat nergens.
- **DE WEERLEGGINGSPAS: 1 VAN DE 4 LENZEN VOLTOOID, over TWEE pogingen.** De pas is vroeg gestart om
  te kunnen herstarten; dat was nodig en het hielp niet. Poging 1: één lens klaar, drie stopten met
  schrijven en leverden geen enkel resultaat, ook geen foutrapport. Poging 2 (`resumeFromRunId`):
  vier agents kwamen op gang, schreven ongeveer een minuut en stopten op dezelfde manier. Vorige
  ronde stierven er twee op een expliciete `529 Overloaded`; nu zonder melding. **Dat is een
  omgevingsprobleem en geen uitslag.** Wat NIET is aangevallen: de INVENTARIS van de vijf endpoints
  en de HISTORIE-claim — die rusten op mijn eigen meting alleen. **De historie-claim is de
  gevoeligste, want zij beslist of de doelcheck in februari data heeft; wie hierop verder bouwt doet
  er goed aan die pas alsnog te draaien.** Eindstand in `docs/RITDATA-RECON.md` §6.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · **69 (nieuw — het
  FTP-voorstel na een test)**.

FOCUS VOLGENDE CHAT: **DAAN KIEST EERST.** `docs/RITDATA-RECON.md` eindigt met vijf wegen; zonder die
keuze is er niets te bouwen, want de drie behoeften delen hun bron NIET vanzelf. Ligt de keuze er, dan
is de eerstvolgende bouw wat die keuze aanwijst — waarschijnlijk **ROADMAP punt 69 (het FTP-voorstel
na een test)** of **punt 61 (de doelcheck)**, en die twee delen alleen de reken-ingreep hieronder.
**EEN DING IS GEEN KEUZE en hoort in ELKE weg:** waar de app een 20-minutenwaarde uit een kromme
haalt, moet zij het lopende MAXIMUM vanaf 1200 seconden nemen en niet de waarde OP 1200 aflezen. Dat
scheelt ongeveer één procent op een criterium dat over enkele procenten oordeelt, en het raakt ook de
BESTAANDE niveaukaart via `pcMarkerAt_`.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie begon `2026-07-14T07:20:14.850Z` en
`.claude/agents/recon.md` dateert van `2026-08-23 07:48`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-24 (EERSTE BLOK VAN DEZE DAG) — DE TIJDZONE-SCHULD IS GEMETEN EN PROD DRAAIT WEER OP
MAIN. Geen code, alleen meting plus docs — en de eerste WORKER-DEPLOY sinds 10-08-2026.
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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
