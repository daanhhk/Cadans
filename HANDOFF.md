# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 — DE BEVESTIGING GELDT NU VOOR HAAR DOEL, EN DE LEEFTIJD STAAT IN WEKEN. Kleine
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

STAND 2026-08-23 (ZEVENDE BLOK VAN DEZE DAG) — DE POORTLAAG IS DICHT, DE BEVESTIG-UITGANG STAAT
ERIN, EN DIT IS DE EERSTE RONDE DIE DE WORKER EN EEN MIGRATIE RAAKTE. Code plus norm plus docs plus
ÉÉN migratie. Geen engine, geen deploy, GEEN remote-D1-mutatie — alles lokaal tegen miniflare. NIET
GEDEPLOYD: prod draait nog zonder deze migratie, dus de kolommen bestaan daar NIET.
- **DRIE INGREPEN, en ze horen bij elkaar.** (a) Het venster van poort (3) is VERBREED naar
  `[blokStart − 21, blokStart + 28)` — het oude venster PLUS de aanloop van drie weken, strikt
  additief. (b) Poort (7) roept `laatsteGelegenheid` aan met `negeerSprong: true`, dus een sprong in
  `rolling_ftp` onderdrukt het ijkaanbod niet meer (M91). (c) Het antwoord op het aanbod staat op
  `sync_state.ijking_blok` plus `sync_state.ijking_antwoord`, met `GET`/`PUT /api/ijking`.
- **DE WEERLEGGINGSPAS HEEFT DEZE RONDE ECHT WERK GEDAAN — lees `docs/PUNT47-BOUW.md` §31b vóór je
  op iets hierboven verder bouwt.** Vijf lenzen, alle vijf `weerlegd: true`, dertien bevindingen die
  ik zelf heb HERMETEN. Zeven daarvan zijn gerepareerd vóór de commit, waaronder één echte
  productiebug: `loadSchemaWeek` voedde `ijkStatus` met de VIERWEEKSE mesoteller
  (`blokStartVoorWeek`) waar de TWAALFWEEKSE opening hoort, waardoor de bevestiging alleen
  doelblokweek 1 t/m 4 gold en in week 5 t/m 8 de staat-regel helemaal wegviel. Nu
  `doelblokOpeningVoorWeek`, met vijf tests. Ook gerepareerd: het venster was GEDRAAID en niet
  rechtgezet (een niet-gereden test 14 of 21 dagen NA de opening werd niet meer onderdrukt); de
  bevestig-uitleg beloofde een berekening die niet bestaat (M55); dezelfde datum stond twee keer op
  het scherm; de staat-regel droeg geen doel-poort en klaagde bij Onderhoud eeuwig door;
  `setTestDismissed` was dood komen te staan.
- **DE WINST WAS VERKEERD TOEGEWEZEN, en dat is de belangrijkste correctie op het vorige blok.**
  Apart gemeten geeft alleen ingreep (a) exact **271/440 = 0,616** — de VOOR-rij — en alleen (b)
  exact **440/440 = 1,000**. Het venster draagt NUL bij aan de dekkingsgetallen; de hele winst komt
  van de sprong. De twee ingrepen repareren VERSCHILLENDE gevallen: op een niet-gereden test 10
  dagen vóór elke opening doet (a) alles (271 spurieuze aanbiedingen → 0) en (b) niets.
- **DE MIGRATIE, en zij bleef binnen de grens.** `workers/api/drizzle/0011_handy_the_hunter.sql`:
  twee `ALTER TABLE ... ADD`, geen nieuwe tabel, geen gewijzigde kolom, forward-only. De schrijfkant
  is een `onConflictDoUpdate` die uitsluitend die twee kolommen zet — `sync_state` is een GEDEELDE
  rij en een volle write zou andermans kolommen wissen. Twee tests toetsen dat van beide kanten.
- **Z1, Z2, Z3 EN Z4 HIELDEN alle vier.** Z1: over 20 ketens van 260 weken, 440 openingen, geeft de
  gebouwde bron **440 aanbiedingen op 440 openingen = 1,000 per opening, MAXIMUM 1**, nul buiten een
  opening, dekking **100,0%**, gemiddeld gat **84,0 dagen**. VOOR de ingrepen: 271 op 440 = 0,616
  per opening, dekking 61,6%, gat 140,5. En het gat dat ronde 4 openliet is dicht: met een
  NIET-GEREDEN test 10 dagen vóór elke opening geeft de bron **0 aanbiedingen op 440 openingen**,
  waar dat er 271 waren. (De rij "5 dagen" is geschrapt: `opening − 5` valt op de woensdag waarop de
  fixture ook de achtergrondritten legt, dus die test was WEL gereden — zie §31b punt 11.)
- **"MAX 1" EN "0 BUITEN EEN OPENING" DRAGEN MINDER DAN ZE LIJKEN, en het vorige blok zei dat niet.**
  Beide staan óók in de VOOR-rijen: ze komen van poort (1), die deze ronde niet is aangeraakt, en de
  meetlus roept per weekmaandag precies één keer aan — ze kunnen per constructie niet anders
  uitvallen. Het orakel is code-onafhankelijk maar predikaat-IDENTIEK aan poort (1)+(1b), dus
  "buiten een opening 0" is daar een tautologie. Het orakel was bovendien FOUT voor een `doelStart`
  die geen maandag is (het ankerde op de maandag ervóór, `computeMacroPhase` op `doelStart` zelf).
  Met een gecorrigeerd orakel gemeten op zowel een maandag- als een woensdag-`doelStart`: identieke
  getallen op alle twintig rijen. De hoogstens-één-eigenschap ná een antwoord is apart gemeten op
  DAGNIVEAU — zeven dagen in dezelfde openingsweek geven zonder antwoord één en dezelfde aangeboden
  datum, mét antwoord **0 van 7**.
- **WAT DE SPRONG-INGREEP VRIJGEEFT: 169 van de 440 openingen** bij Daans gemeten sprongtempo (één
  per ~182 dagen); 338 bij één per 13 weken, 420 bij één per 8 weken. En hij tilt de frequentie
  NIET: met de sprong eruit geeft de bron bij ALLE drie de tempo's precies 440 van de 440 openingen
  één aanbod, maximum 1. **Poort (1) en de vloer bewaken M90b, niet de sprong** — dat is Z2, en het
  knoopt de twee ingrepen aan elkaar.
- **EEN VLAG EN GEEN VERWIJDERING, en de reden is gemeten.** `laatsteGelegenheid` heeft DRIE
  aanroepers: poort (7) en `ijkStatus` MET de vlag, en **`buildBlokReview`** in `blok.ts` zonder,
  dat de terugblik-copy ermee voedt. Die derde verandert niet, dus de sprong blijft INFORMANT (M17,
  M30) en `sprongDagen` komt niet dood te staan. (Het vorige blok schreef "TWEE" en noemde
  `buildBlokReferent` — die functie bestaat niet; rechtgezet na de weerleggingspas.)
- **DE VLUCHTIGE MODULE-SET IS WEG.** `const afgewezen = new Set<string>();` en
  `isTestVoorstelAfgewezen` in `TestVoorstelCard.tsx` bestaan niet meer, en `SchemaView.tsx` leest
  ze niet meer. De poort staat als **poort (2b)** in de PURE laag van `buildTestVoorstel` en is
  daarmee toetsbaar zonder DOM. Twee antwoorden op één vraag wonen nu op één plek.
- **WAT ER NIET IS: een letterlijke teller van opeenvolgende bevestigingen** — en dat is een
  AFWIJKING van de letter van besluit vier, verantwoord in `docs/PUNT47-BOUW.md` §27d. De LEEFTIJD
  volgt uit `laatsteGelegenheid` met `negeerSprong`: dagen sinds de laatste ECHTE meting gedeeld
  door de doelbloklengte. Die maat telt óók de blokken waarin niets is geantwoord, en die zijn net
  zo goed ongemeten. Wil je de letterlijke teller, dan is dat één kolom erbij.
- **EEN GAT DAT IK MELD EN NIET REPAREER, want de reparatie is een tweede migratie.** De docstring
  op `ijking_blok` beweerde dat de openingsmaandag als identiteit volstaat omdat een doelwissel per
  constructie een verse `doelStart` geeft. Dat is ONWAAR voor **3 van de 7 wisseldagen**: met
  `WISSEL_LAATSTE_DAG = 3` klemt `blokStartBijDoel` op ma/di/wo naar de maandag van DEZE week, dus
  een wissel in de beantwoorde openingsweek geeft dezelfde maandag terug en het antwoord van het
  OUDE doel zet poort (2b) dicht voor het NIEUWE — twaalf weken, geen retry. Gemeten op de echte
  bron met opening 2026-09-21. De reparatie is een derde kolom `ijking_doel` in het idiom van
  `doel_passend_doel`; de prompt van deze ronde staat één kolommenpaar toe, dus dit is gemeld en
  niet gebouwd. De docstring citeert nu zijn eigen weerlegde tekst.
- **NIEUWE STRINGS, verbatim, want de vorige ronde bracht twee onware mee die pas in de
  weerleggingspas boven kwamen.** `"Mijn waarde klopt nog"`;
  `"Heb je je drempel zelf al bijgesteld? Dan hoef je niet te testen — ik reken door met de waarde die er staat en vraag het dit blok niet nog eens."`
  (de eerste versie eindigde op `"bevestig 'm en ik reken dit blok daarmee"` en beloofde daarmee een
  berekening die niet bestaat — M55);
  en de vormen van `ijkStaatRegel`: `"Je hebt je drempel bevestigd, niet gemeten."`,
  `"Je drempel is dit blok niet geijkt."`, `"Je drempel is een blok oud."` /
  `"Je drempel is N blokken oud."`, `"Ik heb je drempel nog nooit gemeten."` en het achtervoegsel
  `" Voor het laatst gemeten op <datum>."` GEWIJZIGD: geen enkele.
- **DE LEESVRAAG VOOR DE VOLGENDE RONDE IS BEANTWOORD.** De grondstof voor de §3.2-maat (beste
  20-minutenvermogen over ZES WEKEN) ontbreekt nog steeds op HEAD. De dichtstbijzijnde route is het
  POWER-CURVE-VENSTER VERBREDEN: het 20-minutengetal bestaat al als marker
  (`{ sec: 1200, label: "20m", key: true }`) maar alleen over `export type PowerCurveWindow = "90d" | "1y";`
  met whitelist `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`. Wat er precies mist: een
  derde waarde in die union plus de whitelist, én VERIFICATIE dat intervals.icu die `curves`-waarde
  accepteert — dat laatste vraagt een echte API-aanroep.
- **DE AGENT EN DE RULES-PROBES BLIJVEN NIET GEMETEN**, en er is niet naar gezocht: deze sessie is
  ouder dan `.claude/agents/recon.md` en ouder dan de probes. Agent-discovery lukte wél in een
  remote container op `2.1.241` en op deze machine op `2.1.208` nog NOOIT; dat verschil is
  onverklaard. De twee weggooi-regels liggen klaar:
  `.claude/rules/_wegwerp-altijd-probe.md` met merkstring `RULESALTIJD-MERKSTRING-Q4XM7D` (ZONDER
  `paths`) en `.claude/rules/_wegwerp-paths-probe.md` met merkstring `RULESPATHS-MERKSTRING-V9HB2K`
  (gescoopt op `packages/engine/src/zones.ts`). **Verschijnt de eerste aan het begin van je eerste
  antwoord, dan laadt een regel zonder `paths` altijd; verschijnt de tweede zodra je
  `packages/engine/src/zones.ts` leest, dan vuurt een path-scoped regel op file-read. Verschijnt er
  niets, dan is dat GEEN bewijs van het tegendeel** — niet-geladen en geladen-maar-genegeerd zijn
  niet te scheiden. Meld het als vondst, ruim beide regels op, en meet in dezelfde beweging of
  `recon` in je agent-types staat. Beide regels zijn gitignored en staan NIET in de commit.
- **VLOEREN: lees ze zelf uit de suite.** De suite is deze ronde gegroeid met een nieuw
  testBESTAND; neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 59 (alleen de teller) · 61 · 63 · **64 (nieuw — de
  ontbrekende `ijking_doel`-kolom, zie hierboven)**.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 — de DOELCHECK aan het eind van het doelblok, de tweede helft
van M89, samen met punt 54 (welke maat per doel).** Daan heeft deze ronde de volgorde vastgesteld en
61 NAAR VOREN gehaald vóór 48, 49, 35 en 32, met een datum als grond: **in februari sluit het
onderhoudsblok en dan is de vraag of de FTP het gehouden heeft, vóór de Amstel-Gold-voorbereiding
begint.** M92 heeft de twee vragen van M89 ook in de TIJD gescheiden — de ijking staat nu vooraan en
kijkt vooruit, de doelcheck hoort achteraan en kijkt terug — maar die tweede helft bestaat nog niet
als eigen moment. 54 hangt eraan vast en wordt in dezelfde beweging beslist: wie 61 bouwt zonder 54
kiest stilzwijgend een maat. Begin bij de leesvraag hierboven; de grondstof is er nog niet en de
dichtstbijzijnde route is het power-curve-venster. DAARNA komt punt 63, het onderweg-signaal, en dat
WACHT op punt 49.

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
