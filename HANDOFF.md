# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

STAND 2026-08-23 (ACHTSTE BLOK VAN DEZE DAG) — DE BEVESTIGING GELDT NU VOOR HAAR DOEL, EN DE
LEEFTIJD STAAT IN WEKEN. Kleine
ronde, code plus docs plus canon plus ÉÉN migratie. Geen engine, geen deploy, GEEN
remote-D1-mutatie — alles lokaal tegen miniflare.
- **LET OP: ER STAAN NU TWEE NIET-GEDEPLOYDE MIGRATIES, 0011 EN 0012.** Dat is de eerste keer dat
  prod en lokaal op het SCHEMA uiteenlopen. Prod draait zonder `ijking_blok`, `ijking_antwoord` én
  `ijking_doel`; die drie kolommen bestaan daar NIET. Wie deployt: migratie eerst, dan
  `pnpm build`, dan `wrangler deploy` vanuit `workers/api` — en beide migraties in volgorde.
- **WAT ER GEBOUWD IS.** (a) `sync_state.ijking_doel` erbij, via
  `workers/api/drizzle/0012_acoustic_living_mummy.sql` — één `ALTER TABLE ... ADD`, forward-only,
  geen nieuwe tabel. Poort (2b) en `ijkStatus` vergelijken sindsdien BLOK ÉN DOEL, genormaliseerd
  aan beide kanten, precies zoals `doelPassendVoorstel` stap 5 dat al deed. (b) De leeftijd van de
  drempelwaarde staat in WEKEN in plaats van blokken: `IjkStatus.blokkenOud` heet nu `wekenOud`.
- **V1, V2 EN V3 HIELDEN alle drie — maar V2 en V3 op een ANDERE opstelling dan waarmee ik begon.
  Lees `docs/PUNT47-BOUW.md` §32k vóór je op een getal hieronder verder bouwt.** V2 is de kern:
  gemeten met de ECHTE `blokStartBijDoel` en de ECHTE `buildTestVoorstel`, beantwoorde opening
  `2026-09-21`, gaf een doelwissel eerst op **4 van de 7** dagen van die week een aanbod en nu op
  **7 van 7**. De KLEM is niet veranderd — `blokStartBijDoel` levert nog steeds op 3 van 7 dagen
  dezelfde maandag — de SLEUTEL wel. V3: 440/440 aanbiedingen per opening, MAX 1, 0 buiten een
  opening, gat 84,0 dagen, zowel VOOR als NA. Niets verslechterd.
- **HET GENOEMDE SCENARIO GEEFT DELTA NUL, en dat is de scherpste vondst van de weerleggingspas.**
  De prompt, mijn eerste commentaar en mijn eerste testfixture verantwoordden de ingreep met Daans
  februari-scenario, Onderhoud naar Korte beklimmingen. Maar `blokCheckEnabled("Onderhoud")` is
  **false**: daar staat poort (2) dicht, dus er komt nooit een aanbod en `TestVoorstelCard` — de
  enige schrijver van `ijking_*` — kan voor die opening ook nooit een rij wegschrijven. Zonder rij
  onderdrukte de OUDE poort al niets. Gemeten: geen rij 7/7 → 7/7 (delta 0); rij van een oudere
  opening 7/7 → 7/7 (delta 0); rij van DEZE opening met een EFFECT-doel 4/7 → 7/7 (**delta 3**).
  De winst hoort dus bij een wissel tussen twee EFFECT-doelen, bijvoorbeeld FTP naar Korte
  beklimmingen. Docstrings, fixture en bouwdoc zijn erop rechtgezet. `Onderhoud` is per constructie
  onbereikbaar als opgeslagen doel; dat staat nu als test.
- **DE TEGENKANT IS APART GEMETEN, want dit is de ingreep die makkelijk doorschiet.** Een
  DOORROLLEND blok ZONDER doelwissel geeft over alle zeven dagen van de openingsweek **0 van 7**
  tweede aanbiedingen, zowel vóór als ná. En over 270 combinaties van (opgeslagen blok × opgeslagen
  doel × huidig doel): 72 gevallen waar VOOR onderdrukt en NA niet — de bedoelde versoepeling — en
  **0** gevallen andersom. Geen rotatie in de poort zelf.
- **HET ORAKEL WAS NIET ONAFHANKELIJK, en de mutatie-controle was zelf de tautologie die zij moest
  uitsluiten. Dit is de derde ronde op rij dat het harnas hier struikelt.** `gepland.has(ma)` en
  `computeMacroPhase(...).week === 1` zijn op de fixture **260 van 260 gelijk**, en
  `DOELBLOK_OPENINGSWEEK` is de énige parameter van dat predicaat — dus de mutatie 1 → 2 is precies
  de klasse die het orakel per constructie moet betrappen. HET DECISIEVE GETAL: **het orakel is
  blind voor de ingreep van deze ronde.** De build zonder de doel-helft geeft in V3 cijfer voor
  cijfer hetzelfde, terwijl zij op V2 4 van 7 geeft in plaats van 7 van 7. V3 is dus een
  regressie-controle en géén bevestiging; alleen V2 kan de ingreep zien. Als canon vastgelegd in
  `docs/WERKWIJZE-LESSEN.md`, met wat een volgende ronde anders moet doen.
- **NOG TWEE METINGEN DIE OMGINGEN.** (i) De takken-noemer was **5200 en is 260**: het meetscript
  draaide twintig BYTE-IDENTIEKE replica's omdat de ketenlus `z` declareert en nergens gebruikt.
  (ii) V3 kon poort (2b) helemaal niet zien — één aanroep per week, dus de poort vuurde **0 van de
  440 keer in beide armen**. Hermeten met zevendaagse bemonstering: **3080 keer bereikt, 2640 keer
  gevuurd**, uitkomsten identiek. De conclusie houdt, de eerste meting droeg haar niet.
- **ÉÉN GEDRAGSREPARATIE UIT DE PAS.** De route accepteerde een HALVE rij met 200. De ergste vorm is
  `{blok, doel, antwoord: null}`: poort (2b) leest `ijkingAntwoord` niet, dus zo'n rij onderdrukt
  het aanbod twaalf weken terwijl de staat-regel niets zegt — onderdrukking zonder uitleg, wat M91
  verbiedt. `PUT /api/ijking` eist nu alle drie of geen, met zes 400-gevallen die elk op de
  SCHRIJFKANT asserteren.
- **EEN RESIDU DAT BLIJFT: "hoogstens één aanbod per opening" (M92) geldt nu per (opening, DOEL).**
  `sync_state` draagt één paar en geen verzameling, dus een beantwoord aanbod voor een nieuw doel
  OVERSCHRIJFT het antwoord van het vorige. GEMETEN: FTP beantwoord met niet_nu op maandag, dinsdag
  naar Korte beklimmingen, woensdag terug naar FTP → **2 aanbiedingen op dezelfde openingsmaandag**,
  waar het er vóór de ingreep 0 waren. Dat is besluit één twee keer toegepast en de prijs ervan;
  dichtzetten vraagt een VERZAMELING beantwoorde doelen per opening, een andere kolomvorm dan
  `doel_passend` en `dosis_trede` gebruiken. Nakijkpunt bij ROADMAP punt 64.
- **DE LEESVRAAG UIT DE PROMPT IS GEMETEN EN HET ANTWOORD WAS "AL GOED".** De leeftijdsweergave
  toonde al die van de laatste METING en niet die van de laatste BEVESTIGING: de bron is
  `laatsteGelegenheid`, die alleen GEREDEN maximale inspanningen kent, en een bevestiging schrijft
  enkel `sync_state.ijking_*`. Gemeten met dezelfde historie en drie antwoorden: `wekenOud` staat
  in alle drie op 17. Er viel dus niets te corrigeren, alleen de eenheid te wisselen.
- **DE ZICHTBAARHEIDSGRENS IS EXACT BEHOUDEN, en dat is opzet.** `blokkenOud <= 0` zweeg onder 84
  dagen, `wekenOud < DOEL_BLOK_WEKEN` zwijgt onder 12 weken — dezelfde grens in een andere eenheid.
  Alleen wat de gebruiker LEEST is veranderd, niet WANNEER. De winst zit op 123 en 167 dagen, waar
  "een blok oud" drie totaal verschillende leeftijden dekte.
- **STRINGS.** GEWIJZIGD, één: `"Je drempel is een blok oud."` en
  `` `Je drempel is ${o.blokkenOud} blokken oud.` `` werden samen
  `` `Je drempel is ${o.wekenOud} weken oud.` ``. GEEN enkelvoudstak, want onder twaalf weken
  zwijgt de regel en "1 week" kan er per constructie niet uit komen (CHECK 27). NIEUW: geen enkele
  UI-string; wel één Engelse routefout, `"invalid doel, expected a DOEL_OPTIONS value or null"`.
- **EEN PREMISSE VAN DE PROMPT IS GECORRIGEERD.** Er stond dat alle DRIE de per-blok-antwoorden in
  `sync_state` een doel-kolom dragen. Het zijn er TWEE: `dosis_trede_doel` en `doel_passend_doel`.
  `event_overname` draagt een EVENT-kolom (`event_overname_event`), en dat is consistent — die
  vraag gaat over een wedstrijd, niet over het doel. Of die event-sleutel dezelfde blootstelling
  heeft als `ijking_*` had, is **NIET gemeten** en staat als nakijkpunt bij ROADMAP punt 64.
- **DE BEVESTIGINGS-TELLER IS VERVALLEN, niet uitgesteld.** Daan-besluit: de leeftijd in weken
  vervangt hem. Punt 59 is daarmee helemaal AF en er komt geen kolom voor.
- **DE ALTIJD-REGEL IS ALSNOG GEMETEN, en het antwoord is JA — maar voor SUBAGENTS, niet voor de
  hoofdsessie.** Er is niet naar gezocht: de vijf lenzen van de weerleggingspas begonnen er
  spontaan mee. **5 van de 6 agents gaven `RULESALTIJD-MERKSTRING-Q4XM7D` verbatim terug**, en de
  merkstring stond NIET in de prompt die ik ze gaf (geteld: 0 treffers in het workflow-script). De
  enige weg waarlangs zij hem kunnen kennen is de regel zelf. **CONCLUSIE: een regel in
  `.claude/rules/` ZONDER `paths`-frontmatter laadt bij het starten van een verse agent-sessie op
  `2.1.208`.** Wat NIET gemeten is: of hij ook in de HOOFDsessie laadt — die is ouder dan het
  bestand en kan haar eigen start niet achteraf waarnemen. Een verse chat beantwoordt dat gratis.
- **DE PATHS-REGEL BLIJFT NIET GEMETEN, en dat is geen bewijs van het tegendeel.** Geen van de zes
  agents heeft `packages/engine/src/zones.ts` gelezen (geteld: 0 treffers per agent), dus de
  aanleiding om te vuren heeft zich nooit voorgedaan. `RULESPATHS-MERKSTRING-V9HB2K` kwam 0 keer
  terug; dat is "niet gemeten", nooit "gemeten als afwezig".
- **AGENT-DISCOVERY blijft onverklaard:** het lukte wél in een remote container op `2.1.241` en op
  deze machine op `2.1.208` nog NOOIT. De twee regels liggen klaar:
  `.claude/rules/_wegwerp-altijd-probe.md` met merkstring `RULESALTIJD-MERKSTRING-Q4XM7D` (ZONDER
  `paths`) en `.claude/rules/_wegwerp-paths-probe.md` met merkstring `RULESPATHS-MERKSTRING-V9HB2K`
  (gescoopt op `packages/engine/src/zones.ts`). **Verschijnt de eerste aan het begin van je eerste
  antwoord, dan laadt een regel zonder `paths` altijd; verschijnt de tweede zodra je
  `packages/engine/src/zones.ts` leest, dan vuurt een path-scoped regel op file-read. Verschijnt er
  niets, dan is dat GEEN bewijs van het tegendeel** — niet-geladen en geladen-maar-genegeerd zijn
  van buitenaf niet te scheiden. Meld het als vondst, ruim beide regels op, en meet in dezelfde
  beweging of `recon` in je agent-types staat. Beide regels zijn gitignored en staan NIET in de
  commit. **Een verse sessie beantwoordt beide vragen gratis in haar openingszin.**
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok; de suite is deze ronde
  opnieuw gegroeid.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 (alleen het nakijkpunt).

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
DAARNA komt punt 63, het onderweg-signaal (één aanbod, twee aanleidingen), en dat WACHT op punt 49.

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
