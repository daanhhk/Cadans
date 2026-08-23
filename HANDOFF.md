# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-23 — HET NORM-BESLUIT VAN PUNT 47 STAAT; DE BOUW STAAT OPEN; EN PUNT 51 SCHUIFT
ERVOOR. Docs-only, geen code, geen engine, geen migratie, geen deploy. Prod en D1 staan waar het
blok hieronder ze noemt.
- **PUNT 47 — HET NORM-BESLUIT IS GENOMEN EN VASTGELEGD.** M89, M90 en M91 in
  `docs/TRAININGSMODEL.md` §13, commit `18b749c4fbbb5086e0d1047002e8a2afb78ce811`. M89: aan het
  eind van een blok staan TWEE vragen — IJKING (klopt de drempelwaarde nog) bij elk doel, DOELCHECK
  (is dit doel vooruitgegaan) per doel. M90: de ijking hangt aan de doelblokgrens en is een
  VOORSTEL, één per doelblok als heuristiek. M91: een afwijzing is geen meting — de app draagt de
  ONGEIJKT-staat en zegt haar.
- **DE CANON-TEGENSPRAAK UIT HET VORIGE BLOK BESTAAT NIET.** Dat blok stelde dat punt 47 en
  `DOELEN-SPEC` §3.2 elkaar tegenspraken over de Onderhoud-maat. Punt 47 weerlegt zijn eigen
  samenvallen-formulering TWEE ALINEA'S VERDER: daar staat dat "samenvallen" waar is over de METER
  en onwaar over de VRAAG. De claim rustte dus op de EERSTE HELFT van het punt. HERKOMST-LES: die
  zin was GEPIND HANDOFF en nooit GEPIND ROADMAP — een samenvatting die zichzelf als bron ging
  gedragen. Wat wél openstaat is de MAAT uit §3.2, en dat is een bouwvraag. Zie
  `docs/PUNT47-RECON.md` §0c.
- **DE BOUW VAN 47 STAAT NOG OPEN**, met een open vraag die deze ronde is toegevoegd:
  `blokStartBijDoel` herschrijft `doelStart` bij een doelwissel, terwijl poort (1) van
  `buildTestVoorstel` blokweek gelijk aan `BLOK_WEKEN` eist. Vermoeden — herkomst CHAT, NIET
  gemeten — dat een wissel het ijkaanbod drie weken onderdrukt, precies op het moment dat M90a het
  vraagt. TE METEN in de bouw-recon, niet aan te nemen.
- **PUNT 51 AANGEMAAKT EN VÓÓR 47 GEZET, als item 10 in *De volgorde*;** 47 en alles daarna schuift
  één op. GROND: rangorde-principe (2) — eerst het ontbrekende vangnet, zodat elke ronde daarna
  goedkoper is. Het punt draagt vier genummerde bouwstappen: de recon-subagent, de empirische
  rules-toets, de `CLAUDE.md`-herschrijving en de hooks. De volgorde is op RISICO gezet en niet op
  prijs.
- **DE TWEE RECON-DOCUMENTEN, met hun gepinde RAW URL.**
  `docs/PUNT47-RECON.md` op `18b749c4fbbb5086e0d1047002e8a2afb78ce811`:
  https://raw.githubusercontent.com/daanhhk/Cadans/18b749c4fbbb5086e0d1047002e8a2afb78ce811/docs/PUNT47-RECON.md
  `docs/GEREEDSCHAP-RECON.md` op `aca1cfc5f2720861b70101686c9bd1bac9a869c3`:
  https://raw.githubusercontent.com/daanhhk/Cadans/aca1cfc5f2720861b70101686c9bd1bac9a869c3/docs/GEREEDSCHAP-RECON.md
- **ZEVEN WERKWIJZE-REGELS ERBIJ** in `docs/WERKWIJZE.md`: de deliverable is een document en geen
  terminaluitvoer; een claim die aan een letterlijke string hangt draagt die string; een prompt is
  vraag, randvoorwaarde en deliverable en geen stappenlijst; verbatim krijgt een scope; de
  vertakking gaat vooraf mee met de verwachting erop; CC doet zijn eigen boekhouding; en de
  FOCUS-regel noemt het soort ronde. De derde AMENDEERT de bestaande regel dat een prompt een
  "stap-instructie" is — die ging over de VORM (Nederlands proza, geen script) en dat blijft staan.
- **VLOEREN NU: vitest-totaal 1010 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20.** Herkomst RECON `aca1cfc5`. Onbewogen: docs-only. Lees ze zelf uit de
  suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51.

FOCUS VOLGENDE CHAT: **BOUW-ronde — ROADMAP punt 51, stappen (1) en (2) in ÉÉN ronde.** De
recon-subagent in `.claude/agents/`, en de empirische toets of `.claude/rules/` met een
`paths`-frontmatter op versie `2.1.208` werkt. Die tweede is een TOETS en geen aanname: greppen
beantwoordt de vraag niet, want rules zijn bestand-gebaseerd en hun afwezigheid in het
settings-schema is de verwachte staat. Leg een weggooi-regel neer, raak een bestand op dat pad aan,
lees af. Werkt het niet, dan is de terugval een subdirectory-`CLAUDE.md`. Stappen (3) en (4) komen
daarna en elk apart — (4) pas ná een runtime-meting van de volle gate. CONTEXT: Daan is geopereerd
en fietst voorlopig niet, de beschikbaarheid blijft 0, de planner-week is leeg vanaf 2026-08-09 —
**dat is geen defect.** Er komt geen nieuwe ritdata binnen; elke meting draait op de bestaande
historie of op een fixture. Verse chat.

STAND 2026-08-22 (TWEEDE BLOK VAN DEZE DAG) — PUNT 50 IS AF EN LIVE: DE COACH BELOOFT BIJ ONDERHOUD
GEEN TEST MEER DIE ER NOOIT KOMT. Code-commit `3a9d5458`, CI success. NIET GEDEPLOYD — prod en D1
staan waar het blok hieronder ze noemt.
- **WAT ER GEBOUWD IS.** De `niet_meetbaar`-pool in `blokEffectRegel`
  (`apps/web/src/lib/coachNarrative.ts`) splitst op `doelTak`; de `behoud`-tak draagt dezelfde twee
  varianten met UITSLUITEND de belofte-zin eraf. `key` blijft aan beide kanten `niet_meetbaar`
  zodat `seedIndex` in beide pools dezelfde index kiest — daarmee is het aantoonbaar dezelfde zin
  met de belofte eraf en niet stilzwijgend de andere variant. Geen oordeelswijziging, geen poort
  geraakt, geen engine. Drie bestanden, +28/−4 in de bron.
- **ALLE DRIE DE WAT-ALS-VERWACHTINGEN HIELDEN.** Precies één cel bewoog — `Onderhoud` x
  `niet_meetbaar` x gelegenheid=nee, `belooftTest` van true naar false — en de teller ging van 1
  van de 14 naar 0 van de 14. `noemtTest` blijft daar `true`, want "geen test of wedstrijd" is een
  CONSTATERING en geen belofte; dat is precies het onderscheid dat punt 50 maakt.
- **DE NOEMER HOORT ERBIJ, EN HET ZIJN ER TWEE.** 1 van de 30 matrix-cellen, maar 100 procent van
  de ECHTE Onderhoud-blokken: er staan 0 races en 0 test-overrides in de database, dus
  `blokGelegenheid` geeft over de hele historie null. Wie alleen de eerste noemer rapporteert,
  meldt een randgeval; wie alleen de tweede noemt, overdrijft de reikwijdte.
- **NUL ASSERTIES BRAKEN, NIET TWEE — en de misrekening is leerzaam.** De chat verwachtte er twee,
  op grond van een telling van 34 copy-asserties in `coachNarrative.test.ts`. De vier treffers op
  de verwijderde zin bleken alle vier COMMENTAAR. Een assertie-telling per BESTAND is geen
  blast-radius-maat voor één string; die vraag hoort op de ZIN geteld te worden. Staat als les in
  `docs/WERKWIJZE-LESSEN.md`. De verwachting was conservatief en de stop-conditie zat aan de veilige
  kant, dus het kostte niets — maar hij was op het verkeerde predicaat gemeten.
- **DE POORT BLIJFT DICHT EN ZIJN GROND STAAT NU OPGESCHREVEN.** Poort (2) in
  `apps/web/src/lib/testvoorstel.ts` ÍS `blokCheckEnabled` — dezelfde poort als punt 34 (d) — en
  zijn commentaar beroept zich op `DOELEN-SPEC` §3.2 met "Onderhoud heeft geen effect-meter",
  terwijl §3.2 daar juist wél een effect-maat vastlegt. Zes recon-bevindingen staan nu bij punt 47.
- **DE CANON-TEGENSPRAAK DIE PUNT 47 EERST MOET OPLOSSEN, en die nergens stond.** De
  punt-47-formulering zegt dat ijking en doelcheck bij FTP en Onderhoud SAMENVALLEN in de
  20-minutentest. `DOELEN-SPEC` §3.2 legt als Onderhoud-effectmaat het beste 20-minutenvermogen
  over ZES WEKEN vast — afgelezen, niet getest — en die maat bestaat NIET in code. DOELEN-SPEC gaat
  vóór HANDOFF, dus vandaag wint §3.2. Punt 47 is niet te ontwerpen zonder een expliciet
  Daan-besluit: §3.2 BEVESTIGEN en de maat bouwen, of §3.2 AMENDEREN. Stilzwijgend één van beide
  volgen is drift.
- **HET SPIEGELBEELD DRAAIT VANDAAG AL.** Bij Conditie, Korte en Lange beklimmingen zegt de copy
  dat rolling FTP niet de maat is voor dat doel, terwijl de poort op diezelfde invoer een
  20-minuten-FTP-test AANBIEDT. Gemeten, niet beredeneerd. Dat raakt Daan zodra hij naar Korte
  beklimmingen schakelt.
- **WAT DAAN MERKT.** Bij doel Onderhoud zonder test of wedstrijd belooft de coach geen test meer.
  Verder niets — het doel staat op FTP.
- **VLOEREN NU: vitest-totaal 1010 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20**, afgelezen uit de gate van de bouwronde zelf. Het totaal steeg van 1007
  door 3 nieuwe asserties — dekking, geen regressie. De selftest-vloer is ONBEWOGEN bij een lege
  `git diff` op `packages/engine`. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47 ·
  48 · 49.

FOCUS VOLGENDE CHAT: ROADMAP punt 47 — de blok-check valt in twee, ijking tegenover doelcheck.
BEGIN BIJ DE CANON-TEGENSPRAAK hierboven; zonder dat besluit is er niets te ontwerpen, want het punt
en `DOELEN-SPEC` §3.2 zeggen vandaag iets anders over dezelfde maat. Daarna pas de zes bevindingen
die bij het punt staan. CONTEXT: Daan is geopereerd en fietst voorlopig niet, de beschikbaarheid
blijft 0, en de planner-week is leeg vanaf 2026-08-09 — **dat is geen defect.** Er komt GEEN nieuwe
ritdata binnen; elke meting draait op de bestaande historie of op een fixture. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
