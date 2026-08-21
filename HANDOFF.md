# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-21 — DE WERKWIJZE IS OMGEKEERD: DE PROCESCANON STAAT NU AAN CC'S KANT EN DE
OPENER DRAAGT ROL EN ARCHITECTUUR IN PLAATS VAN REGELS. Vier commits: `9912d23` (doorloop),
`9047381` (checks), `15f88af` (architectuurkaart), `499f20b` (verhuizing plus nieuwe opener).
Docs-only, geen code, geen engine, geen migratie, geen deploy. Prod en D1 staan waar het blok
hieronder ze noemt.
- **DE DIAGNOSE, GEMETEN.** 144 logregels in één maand over 21 actieve dagen. De vorige poort
  — de vijf promptcontroles van 03-08 — dempte de groei niet: 6,40 logregels per actieve dag
  ervoor, 7,27 erna. 13 van de 149 lessen dragen een tweede of derde aanleiding, en 54 van de
  149 openen met "zelfde familie als" een bestaande les. De canon herkende zijn patronen wel
  en voorkwam ze niet.
- **DE WORTEL: DE CANON KON ALLEEN GROEIEN.** 149 lessen, NUL ooit ingetrokken, 99 toevoegingen
  tegen 4 intrekkingen. `TRAININGSMODEL.md` trekt wél in (M60, M61, M78); de werkwijze-kant
  nooit. Elke ronde had een toevoegknop en geen wegknop.
- **DE DOORLOOP.** Alle 149 lessen geclassificeerd in `docs/LESSEN-DOORLOOP.md` op VORM
  (mechanisch 81 · oordeel 62 · onbeslist 6) en DRAGER (chat 77 · CC 46 · beide 24 · onbeslist
  2). De kruistabel weerlegde de eerste opzet: "lessen horen bij CC" is onjuist — 101 van de
  149 bijten bij chat.
- **DE OMZETTING.** De 53 mechanische CC-lessen staan als 38 checks in `docs/CC-CHECKS.md`,
  met conditie, toets, uitkomst en herkomst. 53 van de 53 gedekt, 1 niet omzetbaar met reden
  in plaats van een verzonnen check eromheen. Verdeling: ALTIJD 3 · METING 12 · HARNESS 5 ·
  DEPLOY 1 · COMMIT 2 · ENGINE 14.
- **DE KAART.** `docs/ARCHITECTUUR.md` is nieuw en is het oriëntatiedocument voor de chat-kant:
  lagen, grenzen, de keten van een weekvoorstel, wat de app kan zien en meten, wat het
  meetgereedschap wel en niet bewijst, en waar welk soort besluit valt. Bestands- en
  functienamen mogen, regelnummers niet. GROND: 75 van de 149 lessen noemden een concreet
  bestand of functie — dat was architectuurkennis, vermomd als bewijslast.
- **TWEE REGELS INGETROKKEN, NIET GESCHRAPT.** "De chat leest zelf" in
  `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` en de kloon-instructie in *Bronhiërarchie voor parity*
  staan er nog, met status en reden. GROND: de chat kan de levende staat per constructie niet
  zien, dus elke zelfmeting produceert aannames die CC daarna corrigeert.
- **DE NIEUWE OPENER DRAAGT VIER URL'S**: `HANDOFF.md`, `docs/ARCHITECTUUR.md`,
  `docs/TRAININGSMODEL.md`, `docs/DOELEN-SPEC.md` — plus tien genummerde rolregels in de opener
  zelf. `WERKWIJZE.md` en beide lessenbestanden zijn eruit; CC draagt ze en citeert ze verbatim
  op verzoek.
- **TWEE EISEN ERBIJ OP ELK CC-PROMPT.** Elk getal draagt zijn herkomst — RECON <hash>, GEPIND
  <document>, of BESLUIT. En CC leidt zijn eigen conditie af en draait de bijbehorende checks;
  de chat schrijft die conditie niet voor. Het rapport meldt welke condities golden en welke
  checks gedraaid zijn — daaruit ontstaat vanzelf welke checks dood zijn en eruit kunnen.
- **DE CHAT MAAKTE DEZE SESSIE TWEE KEER DEZELFDE FOUT, EN DAT HOORT HIER.** Hij haalde de
  cutover en FASE-C uit een gepind STAND-blok als openstaand werk, terwijl de overstap al lang
  gemaakt is en de Garmin-push via intervals gewoon werkt. Beide keren was het een aanname uit
  een document in plaats van een meting, en beide keren ving Daan het. Dat is precies wat de
  recon-eerst-regel moet wegnemen.
- **WAT DAAN MERKT: NIETS AAN DE APP.** Wat verandert is de opener: vier URL's in plaats van
  zes, een rolinstructie, en een chat die niet meer zelf meet.
- **VLOEREN NU: vitest-totaal 986 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen:
  docs-only. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 · 35.

FOCUS VOLGENDE CHAT: ROADMAP punt 34 — de effect-referent die het doel niet kent. Eerstvolgend
open item in *De volgorde*, dus GEEN afwijking van de reeks. DIT IS DE EERSTE RONDE ONDER DE
NIEUWE OPENER, en de rol wordt daar getoetst en niet beweerd: de chat MEET NIET ZELF. Begin met
een RECON-prompt, read-only, die het punt uit `docs/ROADMAP.md` haalt en de staat eromheen meet
— welke effect-maat er vandaag staat, waar hij woont, en waar het doel wel of niet in meeweegt.
LEVER DE RECON EN STOP: een meting en een voorstel komen niet in dezelfde beurt. Raakt de ronde
daarna een MECHANISME, dan komt er een WAT-ALS vóór de bouw met de verwachting er expliciet in.
Verse chat.

STAND 2026-08-21 — PUNT 16 IS GEBOUWD EN STAAT IN MAIN, MAAR VUURT IN 4 PROCENT VAN DE WEKEN
(item 7). Commit `5f8a63c3050511bd786720432008cd621647ff77`, CI success, run
https://github.com/daanhhk/Cadans/actions/runs/32455214216. NIET GEDEPLOYD — prod en D1 staan waar
het blok hieronder ze noemt.
- **DE PRIKKEL.** 6 herhalingen van 30 seconden op 150 procent FTP, samen **3,0 anaerobe
  werkminuten**, met 4,5 minuut herstel ertussen. Hij landt op ÉÉN vuldag per week, gekozen op de
  grootste afstand in trainingsdagen tot het zwaarste anker; gelijkspel valt op de laagste
  `dagIdx`, deterministisch. ANKERS ZIJN `quality` ÉN `longride_efforts` — die tweede draagt sinds
  punt 15 zijn eigen efforts, en hem als vuldag behandelen zou de sprints naast bestaand werk
  leggen. Doel **Onderhoud krijgt er nooit een**: daar ligt de vuldag in alle 108 gemeten gevallen
  op afstand 1 van een werkzone-dag.
- **HET GEMETEN BEREIK IS 15 VAN DE 420 WEKEN, en dat is geen schuld die stil blijft.** Zonder de
  ruimte-ondergrens zouden het er **294** zijn: de set kost 25,5 minuten inclusief herstel en die
  passen niet in de endurance-fill van een typische vuldag. De reservering komt uit de bestaande
  bronnen in de volgorde van de kwaliteits-ramp — eerst de fill, dan de cooldown tot 5, dan de
  warmup tot 8 — zodat de sessieduur exact `mins` blijft. Zonder die reservering kwam het plan
  gemeten **25,5 minuten boven de opgegeven ruimte** uit (555,5 tegen 530 weekminuten). De ingreep
  is dus correct begrensd en nauwelijks werkzaam.
- **DE VLOER.** `MATERIALITEIT_MIN_MINUTEN` op `apps/web/src/lib/blok.ts:46`, toegepast IN
  `poortsetVoorWeek_` (`:415`) zodat beide aanroepers gedekt zijn — een vloer bij één aanroeper
  bijt maar half. **N gepind op 4.** Over de hele as 0 tot 10 verandert GEEN ENKELE N het
  geleverd-oordeel: 105 van de 105 bij uitvoeringsschaal 1,00 en 78 bij 0,95, overal. Wat N wél
  doet is de anaerobe poort dichthouden waar alleen de prikkel anaerobe minuten levert: 9 weken en
  9 zone-cellen tussen N 3 en 3,5. Een POORT-effect, geen oordeel-effect.
- **ARCHITECTUURFEIT DAT DE ENGINE ALLEEN NIET TOONT.** De prikkel-vlag reist van `assignWorkouts`
  via `apps/web/src/lib/proposal.ts` (`:719` en `:771`) naar `buildWorkout` en `renderVariant_`. De
  engine produceert niet zelfstandig een prikkel — `assignWorkouts` maakt geen blokken, hij zet
  types; de CLIENT geeft door. Wie de keten alleen in `packages/engine` zoekt, vindt hem niet.
- **`prikkelUit` op `BuildProposalInput` IS EEN MEET-SCHAKELAAR, GEEN FEATURE-VLAG.** Hij bestaat
  omdat een BASISLIJN-fixture de prikkelloze uitvoer moet kunnen meten. Vier gebruikers:
  `weekvormAs.test.ts`, `dosisTrede.test.ts` (twee gevallen) en de ijking in
  `tools/punt16/meet.mjs`. Hun verwachtingen zijn ONGEWIJZIGD gebleven.
- **HET INSTRUMENT STAAT IN DE REPO.** `tools/punt16/meet.mjs` — blok 1 `a94edd8`, uitgebreid in
  blok 2 `3cdd785`. Geijkt op de weekvorm-as, **21 van de 21**, met een zelfcontrole die stopt
  zodra die reeks in `weekvormAs.test.ts` herijkt wordt en het script niet. Het parkeerlijst-item
  dat elke ronde zijn eigen esbuild-instrument opnieuw bouwde, is daarmee VERVALLEN en verwijderd.
- **VLOEREN NU: vitest-totaal 986 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Lees ze zelf uit de
  suite; neem ze niet over uit dit blok.
- **TWEE OPEN VERVOLGVRAGEN OP PUNT 16, coach-canon en niet door een chat te beslissen:** (1) moet
  de set korter of moet de ruimte anders gevonden worden, gegeven een bereik van 15 van de 420;
  (2) blijft de vloer staan nu vaststaat dat hij geen oordeel raakt.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 32 · 34 · 35. Punt 16 hoort er
  niet meer bij. Het eerstvolgende open item in *De volgorde* is **item 8 — punt 34**, de
  effect-referent die het doel niet kent.

FOCUS VOLGENDE CHAT: DE WERKWIJZE ZELF, en dat is een BEWUSTE AFWIJKING van de volgorde — het
eerstvolgende open item is punt 34 en dat blijft wachten. DE REDEN STAAT IN DEZE SESSIE. Ze leverde
in de PLAN-laag — de stap tussen punt kiezen en prompt schrijven, waar geen enkele poort staat —
vijf fouten: drie verzonnen faseringen ("fase 1" en "blok 2/3" bestonden niet in de ROADMAP), een
bouwspec op `assignWorkouts` terwijl die functie geen blokken produceert, een setvorm die de
beschikbare ruimte met 25,5 minuten overschreed, en een vloer gebouwd op een defect dat de gekozen
setvorm zelf al wegnam. Alle vijf zijn gevangen door CC of door Daan; GEEN ENKELE door een
bestaande regel. De engine-autorisatie-regel vuurde daarentegen voor het eerst en werkte wél — hij
stopte een bouw op de verkeerde functie vóór er een letter geschreven was. MATERIAAL VOOR DIE
RONDE, en bewust nog NIET tot regel gemaakt: hoort de plan-laag poorten te krijgen naar het model
van de vijf promptcontroles, of moet er juist iets WEG — die tweede richting is nooit onderzocht.
Overweeg te TELLEN wat de close-outs al noemen: overtredingen per ronde plus de laag waarin ze
vielen, zodat er na vijf rondes een getal ligt in plaats van een gevoel. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
