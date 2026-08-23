# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-23 (VIERDE BLOK VAN DEZE DAG) — DE TWEEDE BOUWPOGING OP PUNT 47 IS OOK GESTOPT, MAAR
DEZE RONDE HEEFT HET ONTWERP GEVONDEN DAT WÉL WERKT — EN ZIJ HEEFT EEN FOUT VAN MIJZELF GEVANGEN.
Docs-only: geen code, geen engine, geen migratie, geen deploy, geen D1. Prod en D1 staan waar het
blok hieronder ze noemt.
- **LEES DIT EERST, want het bepaalt hoe je de rest leest. MIJN EERSTE UITSLAG VAN DEZE RONDE WAS
  FOUT.** Ik concludeerde dat een vloer van 84 de doelblokgrens NOOIT raakt, 0 van de 154. Dat is
  adversarieel weerlegd vóór de commit en vervangen door een herstelmeting. **Het cijfer 0-van-154
  is ONGELDIG; neem het nergens over.** Drie fouten eronder: een noemer van 154 die N=1 was op de
  beslissende dimensie (zeven weekvormen, één seed); een OR-term van `laatsteGelegenheid` die per
  constructie dood stond (`sprongDagen` leest `rolling_ftp`, de fixture zette die kolom nooit) —
  CHECK 23, die ik als gedraaid had gemeld; en een mechanisme-verklaring die de lock aan
  `84 = 12 × 7` toeschreef terwijl elke vloer van 66 t/m 84 hetzelfde doet.
- **W2 VIEL, en het voorstel doet op de maat die telt NIETS.** Gemeten over 40 ketens van 260 weken
  met elk een eigen seed, dus 840 doelblokgrenzen per variant, uitsluitingen geen. Het aandeel
  grenzen dat werkelijk een ijking krijgt: huidig (vierweekse poort, vloer 90) **25,0%**; het
  voorstel (vierweekse poort, vloer 84) **25,0%** bij een vaste weekvorm en **27,0%** bij een
  wisselende. De bouw zou een constante en een docstring hebben veranderd en vaker hebben aangeboden
  in weken die géén grens zijn — 3,29 naar 4,35 aanbiedingen per jaar.
- **WAT WÉL WERKT, EN DAT IS DE VONDST: DE OMHANGING, SAMEN MET DE VLOER.** Poort (1) op de
  doelblok-testweek in plaats van blokweek 4 geeft met de huidige vloer 90 al **52,0%**, en met de
  vloer op 84 **99,9%** bij een vaste weekvorm en **66,9%** bij een wisselende. De twee onderdelen
  werken ALLEEN SAMEN: de vloer alleen laat 25,0% op 25,0% staan, het rooster alleen haalt de helft
  omdat 84 dagen tussen twee grenzen een vloer van 90 nooit haalt.
- **DE VERVALLENVERKLARING VAN DE OMHANGING UIT DE VORIGE RONDE IS INGETROKKEN.** Die rustte op
  "dertien openingen per jaar worden er vier", en dat telde OPENINGEN waar het om GELEVERDE IJKINGEN
  gaat. Op die grootheid doet de omhanging het omgekeerde: van 25,0% naar 66,9% dekking, bij minder
  verzoeken (3,31 naar 2,81 per jaar). Wat er wél versmalt is het RETRY-venster, en dat is punt 55.
- **HET RESTERENDE LEK IS BENOEMD EN NIET MET EEN GETAL TE REPAREREN.** Het derde deel dat bij een
  wisselende weekvorm wegvalt: schuift de ruimste dag van de week naar vroeger dan hij vorige keer
  lag, dan haalt hij de vloer net niet en valt die grens weg. Punt 55 en punt 57 horen daarom in
  DEZELFDE ronde.
- **W1, W3 EN W4 HIELDEN.** W1: beide klokken tellen weken sinds `doelStart` met dezelfde
  `Math.round`-dan-`Math.floor`, 260 van de 260 weekmaandagen gelijk, tien DST-grenzen inbegrepen.
  W3: poort (3) onderdrukt een test die INGEPLAND staat in hetzelfde vierweekse blok, en is NIET
  redundant naast poort (7) — `laatsteGelegenheid` ziet alleen wat GEREDEN is. W4: geen consument
  buiten `testvoorstel.ts`, maar de test `"toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN —
  88 dagen"` verliest onder vloer 84 zijn hele bewijskracht en zou een nieuwe fixture nodig hebben.
- **PUNT 52 KRIJGT ZIJN VERDICT: DE VORM VERDUNT OP TWEE PLEKKEN, EN MET TWEE REGELS ERBIJ IS HIJ
  BRUIKBAAR.** (1) Een voor-autorisatie mag geen initiële conditie STIPULEREN die de te toetsen
  aanname bevat — deze ronde deed dat, en precies meten wat er stond had W2 laten HOUDEN en het
  verkeerde ding gebouwd. (2) Een gecombineerde ronde sluit af met een ADVERSARIËLE
  WEERLEGGINGSPAS op haar eigen hoofdclaim, door instanties die de claim niet opstelden, VÓÓR de
  commit. Dat is de vervanger van de tweede prompt. Zonder (2) is de vorm goedkoper dan de
  splitsing én minder betrouwbaar. Beide regels horen in `docs/WERKWIJZE.md` zodra de vorm een
  derde keer draait.
- **DE RECON-AGENT: NIET GEMETEN, en deze keer AFGELEID in plaats van geprobeerd.** De sessie is
  ouder dan het bestand — transcript `2026-07-14 09:20:16`, `.claude/agents/recon.md`
  `2026-08-23 07:48:15` — dus de prompt schreef terecht voor het niet alsnog te proberen. Het
  verschil met de geslaagde discovery in de remote container op `2.1.241` blijft ONVERKLAARD.
- **DE VERWEESDE BRANCH BESTAAT NIET.** `git ls-remote --heads origin` geeft één regel:
  `refs/heads/main`. `claude/cadans-aflezing-51-y73y9t` staat er niet.
- **DE TWEE VERSE WEGGOOI-REGELS LIGGEN KLAAR — hier staan hun literals, want jij leest dit blok en
  niet het rapport.** Regel 1: `.claude/rules/_wegwerp-paths-probe.md`, merkstring
  `RULESPATHS-MERKSTRING-V9HB2K`, gescoopt op `packages/engine/src/zones.ts`. Regel 2:
  `.claude/rules/_wegwerp-altijd-probe.md`, merkstring `RULESALTIJD-MERKSTRING-Q4XM7D`, ZONDER
  `paths`. Verse strings: de oude twee staan inmiddels in gecommitte documenten en zouden een
  aflezing vervuilen. Beide zijn gitignored en staan NIET in de commit.
- **VLOEREN: lees ze zelf uit de suite.** Onbewogen deze ronde — docs-only, geen bronbestand
  geraakt. Neem ze niet over uit een blok maar toets ze tegen de suite-uitvoer.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51 (alleen (3)) · 52 · 53 · 54 · 55 · 56 · 57.

FOCUS VOLGENDE CHAT: **BOUW-ronde — ROADMAP punt 47, nu met een GEMETEN ontwerp: punt 57 plus punt
55, en punt 53 zodra het venster openblijft.** De recon is klaar en staat in `docs/PUNT47-BOUW.md`;
die hoef je niet over te doen. Wat de prompt moet AUTORISEREN — en dat is de kern, want de vorige
prompt VERBOOD het op een inmiddels weerlegde grond: poort (1) mag om naar de doelblok-testweek,
SAMEN met de vloer op 84. Los van elkaar doen ze niets of half werk. De ingreep raakt de drie
plekken uit ronde 1: poort (1), het onderdrukkings-venster van poort (3) en `blokStart` als
afwijs-sleutel met twee lezers buiten het bestand. Beslis in dezelfde beweging punt 55 — blijft het
venster één week breed of blijft het OPEN tot de ijking gedaan of geweigerd is — want dat is het
gemeten lek van een derde, en de tweede lezing vraagt de staat uit punt 53, die een eigen
autorisatie nodig heeft die er nog niet is.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`. Er stond met opzet geen vaste
`cd`-regel in de prompt en er is niet ge-`cd`'d; dat is de rustigste vorm en hij hoort zo te blijven.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

STAND 2026-08-23 (DERDE BLOK VAN DEZE DAG) — DE BOUW VAN PUNT 47 IS BEGONNEN EN GESTOPT VÓÓR DE
EERSTE REGEL CODE, EN DAT IS DE OPBRENGST. Docs-only: geen code, geen engine, geen migratie, geen
deploy, geen D1. Prod en D1 staan waar het blok hieronder ze noemt.
- **V1 VIEL, EN DAAROM STAAT ER GEEN REGEL CODE.** De vierweekse klok bindt het ijkaanbod niet op
  ÉÉN plek maar op DRIE, en die drie hangen aan elkaar. (a) Poort (1) van `buildTestVoorstel` in
  `apps/web/src/lib/testvoorstel.ts`. (b) Een tweede gebruik van dezelfde klok in datzelfde
  bestand: `blokStartVoorWeek` plus `BLOK_WEKEN * 7` bouwen het venster waarmee poort (3) een reeds
  ingeplande test onderdrukt. (c) `blokStart` REIST HET BESTAND UIT als veld op de teruggegeven
  `TestVoorstel` en wordt buiten `testvoorstel.ts` gelezen als de AFWIJS-SLEUTEL — in
  `SchemaView.tsx` via `isTestVoorstelAfgewezen` en in `TestVoorstelCard.tsx` via `afgewezen.add`.
  "Niet dit blok" betekent vandaag dus "niet dit VIERWEEKSE blok". **DE VOLGENDE BOUWPROMPT DRAAGT
  DIE DRIE, NIET ÉÉN.**
- **V2, V3 EN V4 HIELDEN — gemeten met de echte functies, niet beredeneerd.** V2: de twaalfweekse
  teller leeft. Vier doelblok-testweken over 52 weekmaandagen vanaf `doelStart` `2026-06-29` —
  `2026-09-14`, `2026-12-07`, `2027-03-01`, `2027-05-24` — en **0 van de 4** wordt door de
  event-fase overschaduwd; `effectiveMacroFase_` geeft in alle vier `Test`. V3: een doelwissel zet
  de nieuwe `doelStart` op blokweek 1 bij 5 van de 5 gemeten wisseldagen, dus het gat is REËEL:
  vandaag drie weken, na een naïeve omhanging ELF. V4: `DOEL_BLOK_WEKEN * 7` is 84 dagen tegen
  `TEST_INTERVAL_DAGEN` 90, dus de dag-vloer onderdrukt elke doelblokgrens die op een vorige ijking
  volgt met precies 6 dagen.
- **GEEN ENGINE-WIJZIGING NODIG, en dat is gemeten en niet aangenomen.** `computeMacroPhase` wordt
  in `apps/web/src/lib` al geïmporteerd door `blok.ts`, `faseOvergang.ts`, `proposal.ts` en
  `schema.ts`, en `buildTestVoorstel` draagt `input.doelStart` en `input.weekMondayISO` al — dat is
  precies de invoer die de functie vraagt.
- **DE OMHANGING IS EEN VERSMALLING, GEEN VERSCHUIVING — dit stond nergens en verandert de prijs.**
  Twaalf is een veelvoud van vier, dus elke twaalfweekse grens IS al een vierweekse blokweek 4
  (gemeten: `blokweek4=4` bij alle vier de testweken). Van dertien openingen per jaar naar vier. Er
  komt geen enkel nieuw aanbodmoment bij.
- **PUNT 52 — GEEN OORDEEL, EN DAT IS DE EERLIJKE UITSLAG.** De proef draaide, maar V1 viel tijdens
  de meting en dus was er geen bouw-helft. De recon-helft verdunde NIET; de zwakke plek zit in de
  ROL: in deze vorm is de uitvoerder óók de scheidsrechter over zijn eigen stop. In een gesplitste
  ronde was de bouwprompt HERSCHREVEN met poort (3) en de afwijs-sleutel erin — dat is de winst die
  de splitsing koopt. Het punt blijft OPEN en verschuift naar de eerstvolgende ronde waarin de
  verwachtingen houden.
- **DE DERDE GESTRANDE AFLEZING OP RIJ, en de oorzaak is nu structureel.** `recon` is opnieuw niet
  ontdekt, verbatim: `Agent type 'recon' not found. Available agents: claude, claude-code-guide,
  Explore, general-purpose, Plan, statusline-setup`. De sessie is 40 dagen OUDER dan het bestand dat
  zij moet lezen (transcript 2026-07-14, het agent-bestand van 2026-08-23). Een sessie kan de
  laadmachinerie die bij háár start draaide niet achteraf meten. **ZOLANG DEZELFDE SESSIE LOOPT IS
  ELKE VOLGENDE POGING DEZELFDE NIET-METING.** De rules-probes gaven om dezelfde reden geen
  uitslag; zij zijn opgeruimd en `.claude/rules/` bestaat niet meer. `.worktreeinclude` blijft
  ONGETOETST: beide probes stonden er wél, maar alleen omdat dit de hoofdcheckout is waarin ze
  gemaakt zijn.
- **VIER NIEUWE PUNTEN, 53 t/m 56, met hun grond.** 53: de ONGEIJKT-staat van M91 heeft geen
  drager — de optie-inventaris staat bij het punt en NIEUWE PERSISTENTE STAAT VRAAGT EEN EIGEN
  AUTORISATIE. 54: de doelcheck-maat per doel is niet gekozen (de §3.2-vraag, nu een eigen
  ontwerpronde). 55: het aanbodvenster is ÉÉN week breed en kan stil missen — vandaag kost dat vier
  weken, na de omhanging een KWARTAAL. 56: `TEST_MIN_BESCHIKBAAR_MIN` en `TEST_DUUR_MIN` staan
  allebei op 60 zonder herkomst-etiket; dat is een OPZOEKRONDE en raden is er verboden.
- **VLOEREN: lees ze zelf uit de suite.** Onbewogen deze ronde — docs-only, geen bronbestand
  geraakt. Het vorige blok noemt de stand waarop ze stonden; neem ze niet over uit een blok maar
  toets ze tegen de suite.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51 (alleen (3)) · 52 · 53 · 54 · 55 · 56.

FOCUS VOLGENDE CHAT: **BOUW-ronde — ROADMAP punt 47, de omhanging naar de doelblok-klok, nu als
DRIEDELIGE ingreep.** De recon is klaar en staat in `docs/PUNT47-BOUW.md`; die hoef je niet over te
doen. Wat de prompt moet dragen: poort (1), het onderdrukkings-venster van poort (3), en de
identiteit van het aanbod (`blokStart` als afwijs-sleutel, met twee lezers buiten het bestand).
Beslis in dezelfde beweging punt 55 — blijft het venster één week breed of blijft het OPEN tot de
ijking gedaan of geweigerd is — want de tweede lezing vraagt de staat uit punt 53, en die vraagt een
eigen autorisatie die er nog niet is. De doelwissel uit V3 hoort erbij: zonder reparatie wordt het
onderdrukkings-gat elf weken.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE, en zij werkte.** Deze ronde: pad
`/c/Users/daan/Projects/cadans` vóór én ná de `cd`-regel, `git rev-parse --git-dir` en
`--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0 achter en 0 vooruit op
`origin/main`, versie `2.1.208 (Claude Code)`. De `cd`-regel bleek hier een no-op; dat is één geval
en geen vrijbrief.

**DE HARNAS-AFLEZING HOORT NIET MEER IN EEN PROMPT.** Drie rondes lang is zij gevraagd en drie keer
niet gelukt, telkens met een andere oorzaak: de sessiegrens, de authenticatie van `claude -p`, en
opnieuw de sessiegrens. Zij hoort in de OPENINGSZIN van een sessie die aantoonbaar ná het
agent-bestand opent, en daar heeft deze kant geen invloed op. Vraag hem niet nog eens als opdracht;
neem hem mee als waarneming zodra hij zich vanzelf voordoet.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
