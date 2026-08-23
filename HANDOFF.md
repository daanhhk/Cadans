# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
