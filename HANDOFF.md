# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-23 (VIJFDE BLOK VAN DEZE DAG) — PUNT 47 IS GEBOUWD, PUNT 52 IS GESLOTEN MET EEN JA
ONDER VOORWAARDE, EN DE WEERLEGGINGSPAS HEEFT EEN REGRESSIE IN MIJN EIGEN NIEUWE CODE GEVANGEN.
Code plus docs. Geen engine, geen migratie, geen deploy, geen D1. NIET GEDEPLOYD — prod en D1 staan
waar het blok hieronder ze noemt.
- **WAT ER GEBOUWD IS, als ÉÉN wijziging in `apps/web/src/lib/testvoorstel.ts`.** Poort (1) toetst
  niet langer de vierweekse blokweek maar `computeMacroPhase(...).isTestWeek` — de doelblok-testweek
  — en `TEST_INTERVAL_DAGEN` ging van 90 naar 84. Geen regel in `packages/engine`; de grootheid
  stond er al. Het aandeel doelblokgrenzen dat werkelijk een ijkaanbod krijgt gaat van **2033 van
  de 8421 (24,1%)** naar **8419 van de 8421 (100,0%)** bij een vaste weekvorm en **5613 van de 8421
  (66,7%)** bij een wisselende. Nagemeten op de gebouwde bron, zonder substitutie: dezelfde
  getallen als de simulatie, en de poort vuurt 21 van de 21 keer in een doelblok-testweek en 0 keer
  daarbuiten.
- **X1 EN X2 HIELDEN, X3 VIEL.** X1: de beginconditie is als DIMENSIE afgelopen over 401 waarden
  plus "nog nooit gemeten"; het minimum van de gebouwde variant (95,2% vast, 57,1% wisselend over
  120 zaden) ligt overal boven het maximum van de baseline (28,6%). X2: elke doelblok-testweek is
  PER CONSTRUCTIE ook een vierweekse opening — 86 van de 86 over 1040 weekmaandagen, 600 van de 600
  over zestig `doelStart`-waarden, want 4 deelt 12 — dus poort (3) en de afwijs-sleutel konden op de
  vierweekse klok blijven staan; 21 grenzen gaven 21 unieke sleutels. X3 viel, en zijn val staat
  hieronder.
- **DE WEERLEGGINGSPAS IS VERPLICHT GEWEEST EN HEEFT DE RONDE GERED.** Vier onafhankelijke lenzen,
  alle vier weerlegden de hoofdclaim, alles zelf nagemeten. Wat zij vingen, en het stond alle vier
  al in de bron of in de documenten: (1) mijn docstring beschreef het mechanisme van de OUDE poort —
  na de versmalling liggen de openingen 84 dagen uit elkaar, niet 28; (2) daardoor is 84 meetbaar de
  SLECHTSTE waarde in zijn eigen beweerde klasse; (3) het residu was twee keer aan de verkeerde
  poort toegeschreven; (4) **een echte regressie in code die ik zelf schreef.**
- **DE REGRESSIE, en zij is gerepareerd.** Mijn eerste poort (1) droeg alleen
  `if (!input.doelStart) return null;`. `doelStart` is VRIJE TEKST in D1, en bij een bedorven waarde
  geeft `parseLocalDate` een `Invalid Date` — die is TRUTHY, dus de vangregel in `computeMacroPhase`
  vuurt niet, het dagverschil wordt `NaN`, en `NaN <= 4`, `NaN <= 8` en `NaN <= 11` zijn alle drie
  onwaar. De keten valt door naar de else-tak en geeft **`isTestWeek: true`, élke week**. De app zou
  bij één bedorven rij ELKE week de ijkkaart tonen met "Dit blok loopt af." — een M55-schending die
  de OUDE poort per constructie niet had. Gerepareerd met een expliciete `Number.isNaN`-toets op
  beide datums, met twee tests erop, inclusief de tegenproef dat `"2026/06/29"` (geldig, afwijkend
  geschreven) gewoon moet blijven vuren.
- **DE VLOER STAAT OP 84 EN DAT IS MEETBAAR ZES DAGEN TE HOOG — DIT IS EEN BESLUIT VAN ÉÉN GETAL,
  PUNT 58.** Na de versmalling is de afstand tussen twee aanbiedingen `84 + (k − j)` met j en k de
  weekdag van de vorige en volgende testdag; die wobbelt tussen −6 en +6, dus de kortste afstand is
  **78**. GEMETEN vloer-sweep: 60, 66, 70, 74, 77, 78 en 79 geven alle **21 van de 21** grenzen bij
  BEIDE weekvormen; 80 geeft 20, 82 geeft 15, **84 geeft 14**, 90 geeft 11. En de WACHTTIJD maakt
  het scherper: gemiddeld gat tussen twee aanbiedingen is oud 111,5 dagen, met vloer 84 **126,3**
  (grootste gat 173), met vloer 78 **84,0** (grootste gat 90). **Bij een wisselende weekvorm wacht
  de renner met 84 dus LANGER dan vóór de hele ingreep.** 78 verruimt de norm niet, want poort (1)
  laat per constructie hoogstens één aanbod per doelblok door. NIET GEBOUWD omdat de prompt 84
  autoriseerde en meetfrequentie een beleidsvraag is die met Daan wordt herzien.
- **PUNT 52 IS AF: JA, ONDER VOORWAARDE.** De samengevoegde recon-en-bouwvorm is bruikbaar voor
  rondes die een mechanisme raken, MITS beide regels draaien — geen gestipuleerde beginconditie, en
  een adversariële weerleggingspas vóór de commit. Zonder de pas is de vorm aantoonbaar slechter dan
  de splitsing. Er is een DERDE regel bijgekomen uit het falen van deze ronde zelf: **een diagnose
  door interventie verandert per probe precies één ding.** Twee van de vier vondsten gingen terug op
  die ene meetfout, en de tweede maakte ik terwijl ik de eerste aan het uitleggen was.
- **DRIE CANON-REGELS ERBIJ.** Twee in `docs/WERKWIJZE.md` (*Recon en bewijslast*): geen
  gestipuleerde beginconditie in een wat-als, en de verplichte weerleggingspas. Eén in
  `docs/WERKWIJZE-LESSEN.md`: één ding per probe, poorten onafhankelijk toetsen. Alle drie met
  vindplaats en aanleiding; alle drie in `docs/WERKWIJZE-LOG.md`.
- **TWEE DIMENSIES STONDEN IN DE VOORMETING PER CONSTRUCTIE LEEG — CHECK 23, alweer.** Geen enkele
  fixture-rij zette `rolling_ftp`, dus de `sprongDagen`-bron van `laatsteGelegenheid` kon niet
  vuren; en er zaten geen A- of B-wedstrijden in de reeks. GEMETEN met die takken levend: een sprong
  elke 20 weken geeft 9 van de 21, elke 8 weken 0 van de 21; een A-race elke 180 dagen geeft 9 van
  de 21. Een wedstrijd of sprong IS een meting, dus dat is geen misser — maar **het getal 100,0%
  geldt alleen in een wereld zonder wedstrijden en zonder sprongen** en hoort nooit zonder die
  clausule geciteerd te worden.
- **DE AGENT EN DE RULES-PROBES BLIJVEN NIET GEMETEN**, en er is deze ronde niet naar gezocht: de
  sessie is ouder dan `.claude/agents/recon.md` en ouder dan de probes, dus beide vragen zijn hier
  per constructie onbeantwoordbaar. Agent-discovery lukte wél in een remote container op `2.1.241`
  en hier op `2.1.208` nog NOOIT; dat verschil is onverklaard. De twee weggooi-regels liggen klaar:
  `.claude/rules/_wegwerp-altijd-probe.md` met merkstring `RULESALTIJD-MERKSTRING-Q4XM7D` (ZONDER
  `paths`) en `.claude/rules/_wegwerp-paths-probe.md` met merkstring `RULESPATHS-MERKSTRING-V9HB2K`
  (gescoopt op `packages/engine/src/zones.ts`). **Verschijnt de eerste aan het begin van je eerste
  antwoord, dan laadt een regel zonder `paths` altijd; verschijnt de tweede zodra je
  `packages/engine/src/zones.ts` leest, dan vuurt een path-scoped regel op file-read. Verschijnt er
  niets, dan is dat GEEN bewijs van het tegendeel** — niet-geladen en geladen-maar-genegeerd zijn
  niet te scheiden. Meld het als vondst, ruim beide regels op, en meet in dezelfde beweging of
  `recon` nu in je agent-types staat. Beide regels zijn gitignored en staan NIET in de commit.
- **VLOEREN: lees ze zelf uit de suite.** De suite is deze ronde GEGROEID; neem geen getal over uit
  een blok maar toets tegen de suite-uitvoer.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  (alleen 53/54/55/58) · 48 · 49 · 51 (alleen (3)) · 53 · 54 · 55 · 56 · 58.

FOCUS VOLGENDE CHAT: **ROADMAP punt 58 plus punt 55, in ÉÉN ronde — en 58 is een besluit van één
getal.** 58: gaat `TEST_INTERVAL_DAGEN` van 84 naar 78? De meting ligt er compleet (vloer-sweep,
wachttijd, en het feit dat het de testfrequentie niet verruimt); wat ontbreekt is Daans akkoord,
want meetfrequentie is beleid. 55 hoort er direct achteraan omdat 58 het residu grotendeels wegneemt
en 55 pas daarna op zijn echte omvang te beoordelen is: het retry-venster is door deze bouw
verdwenen (een gemiste grens wacht nu twaalf weken in plaats van vier) en het eerste aanbod na een
verse `doelStart` schuift van 27 naar 83 dagen. De canon-vraag die daaronder ligt is of een gemiste
grens hoort te HERKANSEN — een aanbod vier weken te laat tegenover geen aanbod — en die kan nu
beslist worden omdat de oorzaak gemeten is. Raakt punt 53 zodra het venster openblijft; dat vraagt
persistente staat en dus een eigen autorisatie die er nog niet is.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang. Er
stond met opzet geen vaste `cd`-regel in de prompt en er is niet ge-`cd`'d; dat is de rustigste vorm
en hij hoort zo te blijven.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
