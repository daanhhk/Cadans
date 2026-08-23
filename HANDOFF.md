# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-23 (ZESDE BLOK VAN DEZE DAG) — DE IJKING STAAT NU AAN HET BEGIN VAN EEN DOELBLOK IN
PLAATS VAN AAN HET EIND, EN DAARMEE IS DE BOUW VAN PUNT 47 AF. Code plus docs plus norm. Geen
engine, geen migratie, geen deploy, geen D1. NIET GEDEPLOYD — prod en D1 staan waar het blok
hieronder ze noemt.
- **DE NORM EERST: M92 in `docs/TRAININGSMODEL.md` §13.** De ijkinspanning valt op de OPENING van
  een doelblok, niet op het einde. GROND: de drempelwaarde doet zijn werk VOORUIT — elke zonegrens
  en elke dosis van de komende twaalf weken hangt eraan. Bij een doorrollend blok vallen opening en
  einde samen en verandert er niets; bij een DOELWISSEL meet de eind-plaatsing het aflopende doel af
  terwijl het nieuwe blok twaalf weken op een onbevestigde waarde doseert. M92 vervangt M90a op het
  punt van de PLAATSING; M3 gerespecteerd — niets hernummerd, M90 staat er nog met een notitie
  erbij, en M90b, M90c en M91 gelden ongewijzigd.
- **WAT ER GEBOUWD IS, als één wijziging in `apps/web/src/lib/testvoorstel.ts`.** Poort (1) toetst
  `computeMacroPhase(...).week === DOELBLOK_OPENINGSWEEK` (1) in plaats van `isTestWeek` (week 12),
  en `TEST_INTERVAL_DAGEN` is AFGELEID als `DOEL_BLOK_WEKEN * 7 - AANBODVENSTER_DAGEN` = **77**.
  Geen regel in `packages/engine`.
- **DE VLOER IS AFGELEID EN NIET GEKOZEN, en de afleiding staat in de docstring.**
  Openingsmaandagen liggen exact 84 dagen uit elkaar (gemeten: 22 openingen over 260 weekmaandagen,
  afstand telkens `{84}`), maar poort (6) kiest een dag BINNEN de openingsweek, dus de afstand
  tussen twee gekozen testdagen is `84 + (k − j)` — gemeten minimum **78**, maximum 90, gemiddeld
  84,0 over 840 gaten. Een vloer boven 78 onderdrukt natuurlijke openingen: 79 geeft 426 van de 440,
  80 geeft 415, 84 geeft 293. **77 = 84 − 7** ligt daar met één STRUCTURELE dag onder, ontleend aan
  de vensterbreedte (poort (5) kandideert zeven dagen) in plaats van aan het extremum van de
  verschuiving. Die dag kost niets: 77 en 78 bedienen allebei 440 van de 440.
- **Y1, Y2 EN Y3 HIELDEN alle drie.** Y1: de beginconditie is als DIMENSIE afgelopen over 0 t/m 400
  dagen; gemiddelde wachttijd tussen twee ijkingen **84,0 dagen bij BEIDE weekvormen**, tegen 129,1
  onder de vorige poort en 111,5 van vóór de hele ingreep. Y2: 462 aanbiedingen, **alle in een
  openingsweek en 0 daarbuiten**; een doelwissel op `2026-08-05` geeft `doelStart` `2026-08-03` en
  een aanbod op `2026-08-08` — onder de OUDE poort gaf een wisselweek er per constructie NOOIT een.
  Y3: 22 aanbiedingen, 22 unieke afwijs-sleutels, en poort (3) onderdrukt nog steeds een reeds
  ingeplande test in hetzelfde vierweekse blok.
- **DE MAAT IS GECORRIGEERD, en die correctie is van de promptschrijver.** "Aandeel met AANBOD" telt
  aanbiedingen, geen ijkingen: een blok waarvan de drempel al door een gereden A/B-wedstrijd is
  vastgesteld is BEDIEND, niet gemist. GECORRIGEERD, met een versheids-venster dat VAST op 84 dagen
  staat en niet meebeweegt met de gesweepte vloer: **440 van de 440 (100,0%)** tegen 277 van de 420
  (66,0%) daarvoor. Bij Daans gemeten sprongtempo staat de OUDE maat op 61,6% en de gecorrigeerde op
  100,0% — die 38 procentpunt zijn blokken waar de app terecht NIETS aanbiedt.
- **TAKKEN-VERKLARING HOORT VOORTAAN BIJ ELK DEKKINGSGETAL.** CHECK 23 ging twee rondes op rij mis.
  `laatsteGelegenheid` heeft drie bronnen met elk hun eigen veld: `race` via een A/B-event PLUS een
  rit die dag; `test` via een library-override PLUS een rit; `inspanning` via `sprongDagen`, dat
  KOLOM 14 (`rolling_ftp`) leest. Zonder idx14 is die derde per constructie dood. Elk getal in
  `docs/PUNT47-BOUW.md` §23 draagt nu die verklaring.
- **HET M91-VERDICT, vastgesteld en NIET opgelost.** M91 verbiedt een proxy het aanbod te
  onderdrukken; `sprongDagen` leest `rolling_ftp` — intervals' eigen schatting — en onderdrukt het
  via `laatsteGelegenheid` wél. **HET SCHEIDENDE GETAL: bij Daans gemeten sprongtempo (één per ~182
  dagen) worden 162 van de 440 openingen (36,8%) onderdrukt door een sprong ALLEEN**, zonder gereden
  race of test in dezelfde periode; bij één sprong per 91 dagen 320 van de 440. MIJN LEZING: het
  detector-argument redt de helft — een sprong toont dat er hard gereden is, niet dat het een
  20-minuten-maximum was, en al helemaal niet wélke waarde het blok moet doseren. Erger is dat de
  onderdrukking de app STIL maakt: geen aanbod, geen afwijzing, geen teller. Dat is ROADMAP punt 60.
- **DRIE BESLUITEN VAN DAAN, alle drie in M92 vastgelegd.** (1) De ijking hangt aan de OPENING.
  (2) Het aanbod krijgt DRIE uitgangen — inplannen, afwijzen, of BEVESTIGEN dat de staande waarde
  nog representatief is; een bevestiging dekt het blok maar is geen meting, en opeenvolgende
  bevestigingen worden geteld en zichtbaar gemaakt. NIET GEBOUWD deze ronde: dat raakt de worker en
  een migratie. (3) Er komt GEEN herkansing voor een gemist aanbod — de gebruiker kan een test zelf
  inplannen. Die vraag bij punt 55 is daarmee gesloten.
- **TWEE COPY-STRINGS MOESTEN MEE, want zij waren onwaar geworden.** Verbatim vóór:
  `Dit blok loopt af. ` en `Dan weet het volgende blok waarop het doseert.` Verbatim na:
  `Er begint een nieuw blok. ` en `Dan weet dit blok waarop het doseert.` En
  `die waarde ijkt je volgende blok.` werd `die waarde ijkt dit blok.` `"Niet dit blok"` en
  `"FTP-test gepland"` bleven ONGEWIJZIGD.
- **DE AGENT EN DE RULES-PROBES BLIJVEN NIET GEMETEN**, en er is deze ronde niet naar gezocht: het
  transcript van deze sessie is van `2026-07-14 09:20:16` en `.claude/agents/recon.md` van
  `2026-08-23 07:48:15`, dus de sessie is ouder en de vraag is per constructie onbeantwoordbaar.
  Agent-discovery lukte wél in een remote container op `2.1.241` en op deze machine op `2.1.208`
  nog NOOIT; dat verschil is onverklaard. De twee weggooi-regels liggen klaar:
  `.claude/rules/_wegwerp-altijd-probe.md` met merkstring `RULESALTIJD-MERKSTRING-Q4XM7D` (ZONDER
  `paths`) en `.claude/rules/_wegwerp-paths-probe.md` met merkstring `RULESPATHS-MERKSTRING-V9HB2K`
  (gescoopt op `packages/engine/src/zones.ts`). **Verschijnt de eerste aan het begin van je eerste
  antwoord, dan laadt een regel zonder `paths` altijd; verschijnt de tweede zodra je
  `packages/engine/src/zones.ts` leest, dan vuurt een path-scoped regel op file-read. Verschijnt er
  niets, dan is dat GEEN bewijs van het tegendeel** — niet-geladen en geladen-maar-genegeerd zijn
  niet te scheiden. Meld het als vondst, ruim beide regels op, en meet in dezelfde beweging of
  `recon` in je agent-types staat. Beide regels zijn gitignored en staan NIET in de commit.
- **DE WEERLEGGINGSPAS VING VIJF DINGEN, en drie ervan waren echt.** (1) `computeMacroPhase` KLEMT
  zijn weekteller — `if (absWeek < 1) absWeek = 1;` — dus élke weekmaandag op of vóór `doelStart`
  leest week 1, precies de waarde waar de nieuwe poort op staat. De oude poort stond daar dicht.
  GEMETEN vóór de reparatie: 29 aanbiedingen over weekindex −26 t/m 26, waarvan **26 buiten een
  echte opening**, en een doelwissel op do t/m zo gaf TWEE aanbiedingen met verschillende
  afwijs-sleutels. GEREPAREERD met poort (1b), en één van mijn eigen tests uit ronde 3 ving daarna
  een fout in die reparatie: hij vergeleek STRINGS, en `"2026/06/29"` leest lexicografisch groter
  dan elke `yyyy-MM-dd`. Vergelijkt nu de geparseerde datums. (2) Mijn Y2-meting was een TAUTOLOGIE:
  het harnas telde "buiten een opening" met hetzelfde predicaat als de poort. Hermeten met een
  onafhankelijk orakel. (3) De twee percentages stonden op VERSCHILLENDE noemers; hermeten op één.
- **EEN M55-SCHENDING DIE DE VERHUIZING MEEBRACHT.** Twee levende coach-strings beloofden een test
  `in een rustweek`. Dat klopte bij blokweek 4 (de deload, `MESO_MOD[4]` is 0,6) maar de
  openingsweek is blokweek 1 met factor **1,0** — een volle opbouwweek. Beide zinnen zeggen nu
  `bij de start van een nieuw blok`, met de twee assertie-tests mee.
- **EEN REGRESSIE DIE IK NIET MOCHT REPAREREN — ROADMAP PUNT 62, en die hoort eerst.** Poort (3)'s
  venster is `[blokStart, blokStart + 28)` en `blokStart` is nu de openingsmaandag, dus het kijkt
  VOORUIT waar het eerst drie weken terugkeek. GEMETEN: een test die 5 of 10 dagen VÓÓR de opening
  is ingepland en nog NIET gereden is, wordt door geen enkele poort gezien — poort (3) niet want hij
  ligt vóór het venster, poort (7) niet want die telt alleen wat GEREDEN is — en de app biedt een
  TWEEDE test aan. Sectie 4(d) van de prompt liet poort (3) onaangeroerd, dus dit staat open. De
  ingreep is één regel: anker het venster op `[blokStart − 21, blokStart + 7)`.
- **VLOEREN: lees ze zelf uit de suite.** De suite is deze ronde opnieuw gegroeid; neem geen getal
  over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 59 · 60 · 61 · 62.

FOCUS VOLGENDE CHAT: **ROADMAP punt 62 eerst — één regel, één autorisatie — en dan punt 59 plus
punt 60 in ÉÉN ronde.** 62 is een gemeten REGRESSIE die ronde 4 zelf veroorzaakte en daar niet
gerepareerd mocht worden: het venster van poort (3) ankeren op `[blokStart − 21, blokStart + 7)` in
plaats van op `[blokStart, blokStart + 28)`. Klein, en het staat nu een tweede testaanbod toe.
Daarna 59 en 60: de BEVESTIG-uitgang met de duurzame ONGEIJKT-staat, plus het M91-verdict. Ze horen
samen omdat de ingreep die 60 vraagt — een sprong mag het aanbod niet onderdrukken maar wel de TEKST
informeren — de bevestig-uitgang tot drager maakt. **DAT IS DE EERSTE RONDE VAN DEZE REEKS DIE DE
WORKER EN EEN MIGRATIE RAAKT**: `sync_state` of `day_state` plus een route, een andere
autorisatieklasse dan alles wat punt 47 tot nu toe kostte. Reken op een aparte autorisatie voor de
migratie en een aparte stap voor de deploy. De norm ligt er al (M92 en M91); wat ontbreekt is de
drager. Neem de optie-inventaris uit `docs/PUNT47-RECON.md` vraag 4 mee, en het gegeven dat de
huidige afwijzing een module-lokale `Set` in `TestVoorstelCard.tsx` is die geen herstart overleeft.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang. Er
stond met opzet geen vaste `cd`-regel in de prompt en er is niet ge-`cd`'d.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
