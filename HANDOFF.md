# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

**PUNT 26 IS AF EN STAAT LIVE — DE VANDAAG-GEREDEN DAG HOUDT ZIJN PLAN (4 augustus 2026).** Worker Version `01dee48d-f756-48bd-bec1-a25f0e5813a9`, was `f623ed2a-99db-4861-962d-096849df310f`. 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-CnbaR9fT.js`), 63 ongewijzigd. GEEN migratie en geen enkel `wrangler d1`-commando, ook geen read; `0009_amusing_mordo.sql` blijft de hoogste. Commits: bouwdoc `2f363e1` (`docs/PUNT26-BOUWDOC.md`), bouw `b55f5b91c1f3cfb8d738ccc8d91e2e5a50492ef8`, plus deze close-out. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30879446561>.
- **VLOEREN NU: vitest-totaal 914 over 70 bestanden · engine-selftest-assert-count 1648**, afgelezen uit de suite-uitvoer. Van 904 over 69 bestanden; de assert-count is ONBEWOGEN, want dit was CLIENT-only. `git diff --stat` over `packages/engine` én `workers/api` is LEEG. Lees de vloeren uit de suite; hardcode ze nooit.
- **DE GROND, GEMETEN over 15 cellen** — 4 weekvormen maal elke trainingsdag als "vandaag gereden". Op de dag zelf, ná de rit, heeft de gereden dag GEEN sessies en GEEN `plannedForDone`: **15 van de 15**. De allocator bouwt sessies alleen voor nog te plannen dagen, en de bevroren-entry-tak stond op `isPast` — strikt in het verleden. Die dag viel daarmee ook uit alle drie de weeknoemers.
- **NIEUW EN DRAGEND: de BEWAARDE weekplan-entry wordt VERNIETIGD, 15 van de 15.** `mergeFrozenWeekplan` bevriest alleen `datum < vandaag` (`weekplanFreeze.ts:59`, en de na-lus op `:68` draagt dezelfde grens), en de verse payload noemt de dag niet meer omdat `entryFromDay` geen entry maakt voor een dag zonder sessies (`weekplanBlob.ts:108`). DAAROM WERKT "DE LEESTAK VERRUIMEN" ALLEEN NIET: gemeten geeft term A op zichzelf 15 van 15 op de EERSTE render en **0 van 15 op de tweede render van diezelfde dag** — er is dan niets meer om te lezen. Dat middelste geval is precies het soort fix dat lijkt te werken tot je het scherm een tweede keer opent.
- **HET ZELFHERSTEL BESTOND, MAAR HERSTELDE NIET NAAR DEZELFDE WAARDE.** Op de eerste render van de volgende dag is het plan er nog niet (15 van 15); op de tweede staat het er, via `hasUnrecordedPastTrainingDay` (`schema.ts:1555`) plus de reconstructie-run. Die plant de HELE week opnieuw met lege activities en levert in **4 van de 15 cellen een ANDER plan** dan er die ochtend stond — telkens de derde trainingsdag: `long_z2` wordt `sweet_spot`, TSS van 42 naar 53, intent `high` van 0 naar 26. DE BLOK-TERUGBLIK LEEST PRECIES DIE VELDEN. Met term B verdwijnt die reconstructie: gat **0 van 15** en eind-entry gelijk aan het origineel **15 van 15**.
- **DE BOUW, TWEE TERMEN.** A, de LEESTAK: de bevroren-entry-tak in `proposal.ts` dekt voortaan ook een dag die VANDAAG gereden is — `isPast` wordt `isPast || d.gedaan`, met `gedaan` de uit de ACTIVITIES afgeleide vlag (`derivePlannerGedaan`), niet `pd.gedaan`. B, de SCHRIJFKANT: nieuwe helper `withDoneTodayEntries` in `weekplanBlob.ts`, call-site `schema.ts:1263` in `persistWeekplan`, vóór zowel de recon-tak als de dedup-tak. De bewaarde entry gaat VERBATIM mee en wordt NIET herbouwd uit `plannedForDone` — die vorm mist `variantId` en `archetypeId`, en juist die twee leest de recency-seed.
- **ROOD PER TERM.** R1 (term A terug): DRIE tests vallen — T1 op `plannedForDone` null, T3 op `+0` tegen 1, T4 op de blob die `2026-03-11` mist. R2 (alleen de call-site weg): UITSLUITEND T4. Dat T4 óók bij R1 valt is geen gat maar de bedoelde afhankelijkheid: B is zonder A per constructie INERT, en dat stond al in §2 van het bouwdoc. Beide terugdraaiingen zijn vooraf gegrept op hun eigen markering.
- **BEGRENZINGSBEWIJS, TWEE KANTEN.** Chat-zijde over 105 cellen (5 doelen maal 5 weekvormen maal elke trainingsdag): zonder rit van vandaag is de hele `ProposalWeek` byte-identiek **105 van 105**; mét rit van vandaag zijn alle ANDERE dagen byte-identiek **105 van 105**; en de gereden dag zelf beweegt **105 van 105** — de ingreep is dus niet decoratief. Shot-harness lokaal: het instrument is EERST geijkt op twee gelijke runs, **77 van 77**, en daarna VOOR tegen NA **77 van 77 identiek**. `v7/09-vorm` en `v7/10-trainingen` zijn uitgesloten, dus 77 en niet 79.
- **NIET VISUEEL BEVESTIGD, EN DAT IS EEN GRENS EN GEEN OMISSIE.** De harness zaait alleen de PLAN-kant; de geleverde kant komt uit de `activities` in de lokale D1, en de enige schrijfroute daarheen is `POST /sync/activities`, die van Intervals trekt. Op prod kon term A op 4 augustus per constructie niet vuren — Daan had die dag niet gereden: de weekshot zet `DI 4` op `GEKOZEN` met een geplande `Z2 progressief` van 81 min en 57 TSS, en de weekteller op 1 van 4 dagen. **WAT DAAN MOET OPENEN** zodra zijn volgende rit gesynct is: de Schema-tab, de dagkaart van VANDAAG. Daar hoort VOLTOOID te staan met de gepland-naast-gedaan-tabel en de zone-vergelijking, en in `DEZE WEEK · GEPLAND VS GEDAAN` hoort die dag in ALLE DRIE de getallen mee te tellen.
- **GEEN PROD-DIFF DEZE RONDE**, gemeld als afwijking en terecht: er bestond geen prod-run van vóór de deploy, want de vorige prod-uitvoer was door latere lokale runs overschreven. De prod-run ná de deploy is schoon: float-net overal `none`, errors uitsluitend de bekende 404 op `/api/checkin/2026-08-04`, niet-GET alleen de twee mount-syncs van de app zelf.
- **OPENSTAAND, NIEUW.** De else-tak in de `plannedForDone`-toekenning van `proposal.ts` is in productie DOOD. Zijn poort eist `d.voorgesteldType`, en `workers/api/src/db/repo.ts:397` schrijft die kolom altijd `null`; de route weigert het veld ook van de client. Op de parkeerlijst gezet onder CLIENT.
- **OPENSTAAND, ONGEWIJZIGD.** ROADMAP 10 fase B DEEL 2 · 12 · 13 · 16 · 17 · 19 · 21 · 22 · 23 · 24 · 25 · `indoor_ftp` 260 tegen `ftp` 280 · de 404 op `/api/checkin/<datum>` · de coach-copy-ronde · geen harness-scenario voor een klim-doel of voor fase Peak.

FOCUS VOLGENDE CHAT: ROADMAP punt 10 FASE B DEEL 2 — het aanbod "verschuif deze week de minuten naar Drempel". Dat is het eerstvolgende open punt in de volgorde. Raakt de ALLOCATOR, dus ENGINE met eigen autorisatie, en er gaat een wat-als aan vooraf: de 5c-les staat, de opgeruimde inhaal-kaart stelde in 60 van 72 cellen een LICHTERE week voor. Neem mee wat uit fase A openstond: in blokweek 1 lopen de twee ΔCTL-VENSTERS uiteen — anker weekmaandag tegenover maandag min zeven, tot 11,2 uit elkaar en van teken verschillend — terwijl de DOWN-tak op de gemeten reeks nul keer vuurde. Verse chat.

**PUNT 20 IS AF EN STAAT LIVE — DE PUSH DRAAGT WEER DE DUUR DIE HET PLAN ZEGT (3 augustus 2026).** Worker Version `f623ed2a-99db-4861-962d-096849df310f`, was `6cb06e52-9909-4daa-b9c5-4d683ab8e2c3`. **0 assets vervangen, 67 ongewijzigd** — dat is GEEN fout maar het bewijs dat deze bouw uitsluitend server-side landt: de push-parsers zitten niet in de front-end-bundel, dus de client kan er per constructie niet door geraakt zijn. Geen migratie en geen enkel `wrangler d1`-commando; `0009_amusing_mordo.sql` blijft de hoogste. Commits: recon `9f43299`, fix `514389f`, dekking `a8fe7ba`, plus deze close-out.
- **VLOEREN NU: vitest-totaal 904 over 69 bestanden · engine-selftest-assert-count 1648**, afgelezen uit de suite-uitvoer. Van 903/69 en 1643 na de fix, en die 1643 kwam van 1567 vóór deze reeks. Lees ze uit de suite; hardcode ze nooit.
- **DE GROND.** `dslDurationSec_` (`zones.ts:425`) en de twee herhalings-regexen in `dslBlockFromRow_` (`:354`) en `zwoStepFromRow_` (`:448`) accepteerden geen decimaal, en de min-scan kon MIDDEN in een getal beginnen: op `"24.7 min"` faalt `24` omdat er een punt volgt, waarna de scan doorschuift en `7 min` vindt. Drie edits, alle drie in `zones.ts`, samen 64 regels. `dslRestFromNote_` is BYTE-IDENTIEK gebleven — gemeten nul decimale rustnoten bij 179 bestaande, dus een fix daar zou geen rood-test kunnen dragen.
- **GEMETEN PER CEL: 100327 cellen, 38302 fout gepusht**, en dat zijn EXACT de cellen met een decimaal — de samenval is perfect en beide kanten zijn getoetst: nul fout zonder decimaal, nul decimaal zonder fout. 17217 te KORT en 21085 te LANG, en 6069 cellen verloren hun herhalingen. **HET DEFECT IS BIDIRECTIONEEL.** De titel "korter dan het plan" beschrijft de waargenomen sessie, niet het mechanisme; het scherpste geval was `"6.9999999999999964 min"` met een `Duration` van 599999999999997800 seconden.
- **DE OMVANG IN PUNT 20 KLOPTE NIET EN IS GECORRIGEERD.** Op de echte pipeline via `buildWeekProposal`: **37,9% van de cellen en 66,0% van de sessies**, tegen 19,7% en 30,0% zoals het er stond. Ruwweg het dubbele op alle drie de getallen.
- **HET WAS NIET NIEUW, en dat weerlegt de eerste lezing.** GEMETEN over 5 doelen: bij mesoWeek 1 met dosis-trede 0 draagt **0 van 7220** cellen een decimaal; bij mesoWeek 3 is het **51,2%** en bij trede 2 **52,9%**. In DRIE van de vier weken van een 3:1-blok stond dit fout. Punt 18 maakte het ZICHTBAAR door het scherm schoon te maken; het maakte het niet waar.
- **BEGRENZINGSBEWIJS.** 2511 unieke cellen: **599 zonder decimaal en daarvan 0 bewogen** — byte-identiek in BEIDE parsers; **1912 met decimaal en alle 1912 nu correct**; null-tellingen 0 vóór en 0 ná, bij beide parsers. Op de echte pipeline van 37,9% naar **0,0%** van de cellen en van 66,0% naar **0,0%** van de sessies.
- **LIVE GEVERIFIEERD OP DAANS EIGEN DATA, twee kanten.** `Z2 progressief` van 81 min komt binnen als `1h21m` met blokken van `52m30s` en `15m30s`; met de oude parser was dat 23 minuten geweest — 8 plus 5 plus 5 plus 5, want `"52.5 min"` en `"15.5 min"` werden allebei 5. En `Sweet Spot kort 2x12` van 75 min, zonder enige decimaal, is aan beide kanten identiek en houdt zijn `Repeat=2`. Dat tweede is het begrenzingsbewijs OP PROD, nagerekend op de oude parser.
- **NOG NIET LIVE GEZIEN: de decimale HERHALINGSCEL.** Sinds `a8fe7ba` gedekt door de test, niet door het oog. Hij verschijnt zodra een geschaalde sessie op een tiende uitkomt.
- **DE VALSE DEKKING WAS VIJF PLEKKEN, niet één.** `selftest.test.ts:1981`, `:2081` en `:3549` toetsten alleen dat er niet-`null` geparseerd wordt; `W_ZWO` op `push.test.ts:24` draagt uitsluitend hele minuten; en `zwoStepFromRow_` werd door GEEN ENKELE test aangeroepen terwijl het het PRIMAIRE push-pad is.
- **WAAROM EDIT B TOT `a8fe7ba` ONGEDEKT BLEEF, en dit is de dragende les.** Beide bestaande lussen draaien op de NOMINALE vorm. Gemeten: bij `mesoFactor` 1 nul decimale herhalingscellen, bij mesoWeek 3 alleen al 110. De as die ertoe deed ontbrak volledig, dus de tests draaiden per constructie precies de ENE week van de vier waarin het goed gaat. De nieuwe `it` loopt over doelMin in stappen van 5 én mesoWeek 1 t/m 4, vindt **286** decimale herhalingscellen, en asserteert expliciet dat dat aantal groter dan nul is.
- **ROOD PER PLEK, MET DE MASKERING LOS GEMETEN.** R1 valt op de api-fixture (`Duration="1482"`), R2 op `20 dsl herhalings-kop`, R3 op `20 zwo repeat en onduration` plus de api-fixture. `assert_` breekt de `it` af op de kop, dus `20 dsl werkduur` en `20 dsl rustregel behouden` werden gemaskeerd; los gemeten vallen ook die twee, alle drie op ALLE 286 rijen.
- **DE DSL-TAK IS VERMOEDELIJK ONBEREIKBAAR, en dat raakt punt 21.** `zwoStepFromRow_` gaf over de hele populatie **0 keer** `null`, vóór én ná de fix, dus `buildEventPayload` komt na de `return` op `push.ts:87` nooit bij `buildWorkoutDsl_` of `buildWorkoutDescription_`. Eerst die bereikbaarheid meten, dan pas punt 21 bouwen.
- **OPENSTAAND, NIEUW:** ROADMAP punt 26 — de vandaag-gereden dag verliest zijn plan.
- **OPENSTAAND, ONGEWIJZIGD.** ROADMAP 10 fase B DEEL 2 · 12 · 13 · 16 · 17 · 19 · 21 · 22 · 23 · 24 · 25 · `indoor_ftp` 260 tegen `ftp` 280 · de 404 op `/api/checkin/<datum>` · de coach-copy-ronde · geen harness-scenario voor een klim-doel of voor fase Peak.
- **NIEUWE WERKWIJZE-AFSPRAAK, en ze komt uit TWEE CHAT-FOUTEN in deze ronde.** Elk CC-prompt gaat voortaan langs VIJF CONTROLES, mechanisch uit de prompttekst getrokken: elke vindplaats gegrept, elke behoud- of verwijder-instructie geverifieerd, elke aangewezen assertie-plek getoetst op de as die hij VASTZET, elke acceptatie-eis op mechanische raakbaarheid, en elk getal uit een meting of een gepind document. En elk BOUW-prompt opent met een PREMISSEN-BLOK dat CC als eerste stap toetst en waarop hij bij afwijking STOPT. DE DRAGENDE OBSERVATIE: beide fouten waren al door een BESTAANDE les gedekt — het bouw-prompt wees lussen aan die op `mesoFactor` 1 draaien, en het close-out-prompt corrigeerde een zin die nergens stond. Wat ontbrak was niet de dekking maar een MOMENT waarop die lessen wórden gedraaid. Staat in `docs/WERKWIJZE.md` onder *Vorm van een CC-prompt*, met een maximum van vijf: groeit de lijst, dan wordt hij te lang om te draaien.

FOCUS VOLGENDE CHAT: ROADMAP punt 26 — de vandaag-gereden dag verliest zijn plan. AFWIJKING VAN DE VOLGORDE, MET REDEN: punt 21 staat numeriek eerder, maar zijn drager is gemeten vermoedelijk DOOD — 0 terugvallen over de hele populatie — terwijl punt 26 twee keer op Daans eigen scherm is gezien en hem elke rijdag de plan-vergelijking kost. CLIENT. Verse chat.

**DE GEPUSHTE WORKOUT IS KORTER DAN HET PLAN — NIEUW, URGENT, EN HET STAAT LIVE FOUT (3 augustus 2026).** Een sessie van 65 minuten kwam op Garmin binnen als 27. Vastgelegd als ROADMAP punt 20, met de twee vindplaatsen, de meting en het open besluit erbij. Docs-only ronde: GEEN code gewijzigd, geen deploy, geen `wrangler`-commando.
- **DE GROND, NAGEREKEND.** `dslDurationSec_` (`zones.ts:425`) zoekt `/(\d+)\s*min/i`; op `"24.7 min"` faalt de match op `24` omdat er een PUNT volgt, waarna de scan doorschuift en `7 min` vindt. En `dslBlockFromRow_` (`zones.ts:354`) eist met `/^\s*(\d+)\s*x\s*(\d+)\s*(min|sec|s)\b/i` twee HELE getallen, dus `"2x 9.7 min"` matcht niet, valt door naar diezelfde scan, wordt 7 minuten EN verliest zijn twee herhalingen. De sessie rekent na: 8 plus 7 plus 7 plus 5 is 27. `zwoStepFromRow_` (`zones.ts:448`) draagt LETTERLIJK dezelfde regex — aannemen dat de ZWO-tak meelijdt, en dat expliciet toetsen. OMVANG over 2100 sessies en 9038 cellen: 19,7% van de cellen draagt een decimaal, 19,0% wordt fout geparseerd, 30,0% van de sessies heeft minstens één fout blok.
- **NIET VEROORZAAKT DOOR PUNT 18.** De push-tak leest de ENGINE-strings, en die zijn in die ronde bewust onaangeroerd gebleven — juist omdat deze parser ze leest. Punt 18 maakte het zichtbaar, niet waar.
- **DE SUITE GAF VALSE DEKKING, en dat is de dragende les.** `selftest.test.ts` asserteert bij `arch <id> push-parse` alleen dat `dslBlockFromRow_` niet `null` teruggeeft, niet dat de duur klopt. Een test die "parst" toetst en niet "parst GOED". Reken die assertie nergens als dekking.
- **PUNT 18 BLIJFT STAAN ZOALS HET STOND.** Live op Worker Version `6cb06e52-9909-4daa-b9c5-4d683ab8e2c3`, op prod geverifieerd met nul net-treffers over 15 shots, vloeren 902 over 69 bestanden en 1567 assertions. Zie het blok hieronder.
- **HERNUMMERING, LET OP BIJ HET LEZEN VAN OUDERE BLOKKEN.** Het nieuwe punt is 20 geworden; de vijf punten die daar stonden zijn één opgeschoven. De push-beschrijving (`buildWorkoutDescription_`) is 20 → 21, de rit-sheet 21 → 22, de twee niet-deterministische shots 22 → 23, de mount-flake 23 → 24, `12-activiteiten` 24 → 25. Een STAND-blok van vóór vandaag noemt dus de OUDE nummers.

FOCUS VOLGENDE CHAT: de push-tak in `packages/engine/src/zones.ts` — EERST het duur-defect (punt 20), DAARNA `buildWorkoutDescription_` (punt 21). ENGINE, dus RECON-FIRST en een STOP-EN-VERIFIEER vóór welke wijziging dan ook. GEEN ENKELE WIJZIGING ZONDER EERST EEN METING DIE AANTOONBAAR ROOD IS: leg de geparseerde duur naast de bedoelde duur en laat die assertie omvallen vóór je iets repareert. En de waarschuwing die daarbij hoort: de bestaande `push-parse`-assertie in de selftest geeft VALSE dekking — hij toetst alleen op niet-`null`. Een nieuwe test moet de DUUR toetsen, niet het bestaan. Neem het open besluit mee: parse repareren, de string aan de bron, of allebei — en of de push geblokkeerd moet worden zolang hij fout is. Verse chat.

**PUNT 18 STAAT LIVE, EN HET IS OP PROD GEVERIFIEERD TEGEN DAANS EIGEN DATA (3 augustus 2026).** Worker Version `6cb06e52-9909-4daa-b9c5-4d683ab8e2c3` op <https://cadans-api.dtkorteweg.workers.dev>, gebouwd uit code-commit `0d928cec981e285932674a489b0c78a0f93b813d`. 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-C7AJ2xQs.js`), 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. MIGRATIES GEVERIFIEERD, NIET AANGENOMEN: `wrangler d1 migrations list DB --remote` geeft "No migrations to apply!", nul openstaand; `0009_amusing_mordo.sql` blijft de hoogste. Alleen die ene read, geen apply.
- **VLOEREN ZOALS AFGELEZEN: vitest-totaal 902 over 69 bestanden · engine-selftest-assert-count 1567.** Ongewijzigd sinds `c780ef9`. Lees ze uit de suite; hardcode ze nooit.
- **DE BESLISSENDE TOETS: HET NET GAF NUL TREFFERS OP PROD.** De harness draaide read-only tegen de deployment — 15 shots, tegen Daans ECHTE data, met de leespas die `hidden` en inline `display` openklapt. Dat is wezenlijk meer dan de lokale run: daar staan negen gezaaide scenario's, hier staat het plan dat er werkelijk is. Console-errors: 2 op `01-week`, `03-di`, `09-vorm` en `10-trainingen`, alle vier dezelfde bekende 404 op `/api/checkin/2026-08-03`; de overige elf shots nul.
- **TWEE NIET-GET-AANROEPEN, EN DIE HOREN ER.** `1x POST /api/sync/activities` en `1x POST /api/sync/wellness`, allebei op `01-week`. Niet van de harness maar van de APP bij mount — precies het besluit dat in `docs/WERKWIJZE.md` staat: er komt geen read-only-modus die de mount-sync onderdrukt, want een harness die een SPECIALE modus fotografeert kan liegen over de normale. De daar ook genoemde `PUT /api/weekplan/<maandag>` kwam deze run niet voor.
- **DE LETTERLIJK GECONTROLEERDE SESSIE.** Maandag, `Z2 + hoge cadans`, `65` min, `46` TSS, `4 blokken`: `Warmup 8 min`, `Z2 24,7 min`, `Hoge cadans 95+rpm 2x 9,7 min`, `Cooldown 5 min`. Geen float-ruis, hoogstens één decimaal, Nederlandse komma. Waar Daan `65.0170731707317 min` en `8.119999999999997 min` zag, staat nu `65 min` en `8 min`.
- **DE AFWIJKING TEGENOVER DAANS SCREENSHOT IS GEEN DEFECT.** Die screenshot toonde de sessie VÓÓR het verlengen van 60 naar 65 minuten; de vijf extra minuten worden door de WERKBLOKKEN opgenomen — Z2 van 21,6 naar 24,7 en de cadans-blokken van 2x 8,6 naar 2x 9,7, samen plus 5,2. LET OP, ÉÉN CORRECTIE OP DIE GROND: de warmup staat NIET vast. Hij ging van 8,12 naar 8,0 en schaalt dus mee; alleen de cooldown bleef op 5. Wie dat later als "warmup en cooldown zijn vast" leest, rekent verkeerd.
- **DE HARNESS IS GEEN VOLLEDIG BEWIJS, EN DAT BLIJFT GELDEN.** Nul treffers over 15 prod-shots zegt: op de schermen die de camera ziet, met de data van vandaag, staat geen ruis. Het zegt niets over weekvormen die er vandaag niet zijn. Wat de code afdekt is `apps/web/src/lib/blokDuur.test.ts`, die de duurcellen uit `buildWeekProposal` zelf haalt.
- **OPENSTAAND, ONGEWIJZIGD.** ROADMAP 10 fase B DEEL 2 · 16 · 17 · 19 · 20 · 21 · 22 · 23 · 24 · `indoor_ftp` 260 tegen `ftp` 280 · de 404 op `/api/checkin/<datum>`, die al op de parkeerlijst staat onder CLIENT · de coach-copy-ronde · geen harness-scenario voor een klim-doel of voor fase Peak.

FOCUS VOLGENDE CHAT: ROADMAP punt 20 — de push-beschrijving. `buildWorkoutDescription_` (`zones.ts:569`) zet `totaalMin` RAUW in de tekst die naar intervals.icu gaat en hergebruikt daarin dezelfde blokstrings die punt 18 client-zijde heeft opgemaakt. Wat Daan in de app ziet klopt dus, en wat in zijn agenda en op zijn fietscomputer belandt niet. ENGINE, dus RECON-FIRST met een STOP-EN-VERIFIEER vóór welke wijziging dan ook: eerst meten wie die string schrijft én wie hem leest, want `dslBlockFromRow_` parseert dezelfde tekst voor de laps. De client-fix van punt 18 is daar NIET de goede vorm — dit is transport, geen renderrand. Verse chat.

**PUNT 18 IS AF — GEEN ENKEL COMPONENT RENDERT NOG EEN KAAL GETAL, EN DE CAMERA BEWAAKT HET (3 augustus 2026).** Daan zag "59.800000000000004 min" op zijn eigen scherm. Vier commits: `ec1602d` het float-net plus de zeven ontbrekende routes, `1ce1732` het bereik van het net, `c780ef9` de fix, `0d928ce` de CSS-correctie. NIET GEDEPLOYED — dat is een besluit voor de volgende ronde, niet een vergetelheid. CI success op beide code-commits, runs <https://github.com/daanhhk/Cadans/actions/runs/30814005282> en <https://github.com/daanhhk/Cadans/actions/runs/30816916569>.
- **VLOEREN NU: vitest-totaal 902 over 69 bestanden · engine-selftest-assert-count 1567** (van 898/68), afgelezen uit de suite-uitvoer en uit de testnaam op `packages/engine/src/selftest.test.ts:6660`. De stijging is `apps/web/src/lib/blokDuur.test.ts`, 4 tests. ENGINE, API EN SHARED ONAANGERAAKT: `git diff --stat` over alle drie leeg. Lees de vloeren uit de suite; hardcode ze nooit.
- **HET NET STAAT HARD OP VIER DECIMALEN EN IS GROEN** over alle 79 shots. De drempel is GEMETEN, niet gekozen: de float-ruis droeg er VEERTIEN (`90.39999999999999`), en elke legitieme treffer hoogstens DRIE — `3,77` W/kg en `0,12` sinds seizoenstart hebben er twee, en `1.167` W is de NL-duizendtalpunt. Vier ligt daar precies tussen. Een treffer laat de run nu FALEN, met vindplaats en drie contextregels.
- **DE HARNESS DEKT NU ACHT SCHERMEN IN PLAATS VAN EEN.** Naast `/schema` draaien `/vorm`, `/trainingen`, `/niveau`, `/activiteiten`, `/instellingen`, `/weekplanner` en `/events` — lokaal op precies scenario `v7` via een expliciete vlag, want deze pagina's variëren niet met de weekvorm; in prod-modus alle zeven. Ze staan ALTIJD na de weekshot en de zeven dagshots, zodat de byte-vergelijking blijft staan. En er is een LEESPAS los van de schietpas: die opent `hidden` én inline `display: none`, leest, en herstelt verbatim. Beide mechanismen zijn nodig — `WorkoutDetail.tsx:158` draagt alleen het attribuut, `DoelProjectie.tsx:957` draagt allebei en de inline stijl verslaat het attribuut.
- **DE PREMISSE VAN PUNT 18 WAS ONVOLLEDIG, en dat is de eigenlijke vondst.** "Eén formatter aan de renderrand" dekte alleen de KALE getallen. Er bleek een TWEEDE familie: strings die de ENGINE al vervuild aanlevert, met `structuur[i][1]` als drager — 51 gevallen over 660 weken, waaronder een cooldown van `9.000000000000004 min` bij Drempel 2x20. Die is client-zijde opgemaakt met `nlBlokDuur` en de engine is niet geraakt.
- **GEEN TREFFER IS GEEN BEWIJS VAN AFWEZIGHEID.** Precies die blokstructuur-ruis kwam in GEEN ENKELE van de 79 shots voor — hij zat achter een dichtgeklapt onderdeel en in weekvormen die de harness niet draait — terwijl hij aantoonbaar bestaat. Wat de code afdekt is de test bij de PRODUCENT: `blokDuur.test.ts` haalt de cellen uit `buildWeekProposal` zelf over 5 doelen maal 4 blokstarts maal 5 weekvormen. ROOD gemeten zonder de fix: 27 vervuilde cellen.
- **OPMAAK ALLEEN OP TEKST DIE EEN MENS LEEST.** `0d928ce` draait twee CSS-breedtes terug van `nlInt` naar `Math.round`, in `ZoneCompare.tsx` en `LevelCard.tsx`. Een style-attribuut wordt door een CSS-parser gelezen; werd `nlInt` ooit een decimaal-variant, dan stond er `33,3%` en klapte de balk stil naar nul breedte — en het net kan dat per constructie NOOIT zien, want `innerText` leest geen attributen. Zelfde grond waarom de engine-string onaangeroerd blijft: `dslBlockFromRow_` parseert hem.
- **WAT DAAN MERKT.** Op de dagkaart van een sweet-spot-sessie staat `90,4 min` waar `90.39999999999999 min` stond. Verder verandert er niets: van de 77 vergelijkbare prod-shots bewoog er precies ÉÉN, met één regel verschil en gelijk aantal regels.
- **HET BEGRENZINGSBEWIJS GAAT OP DE PNG'S, NOOIT OP DE `.txt`.** Twee dingen in die tekstbestanden wisselen aantoonbaar tussen runs van dezelfde code: de teller `PUT /api/weekplan/<maandag>` (2 of 3) en de gepland-noemer (`/372` tegen `/379`, uit de bewaarde weekplan-rijen). En `v7/09-vorm` en `v7/10-trainingen` zijn niet byte-deterministisch — identieke `innerText`, puur pixel — dus elke vergelijking gaat over 77 en niet over 79.
- **OPENSTAAND, NIEUW EN GENUMMERD.** ROADMAP 20 de push-beschrijving · 21 de rit-sheet die geen DOM-ingreep bereikt · 22 de twee niet-deterministische shots · 23 de mount-flake plus zes routes zonder mount-assertie · 24 `12-activiteiten` afgesneden op `HEIGHT_CAP` 4000 tegen 5898 nodig.
- **OPENSTAAND, ONGEWIJZIGD.** Punt 10 fase B DEEL 2 · punt 16 · punt 17 · punt 19 · `indoor_ftp` 260 tegen `ftp` 280 · 404 op `/api/checkin/<datum>` · de coach-copy-ronde · geen harness-scenario voor een klim-doel of voor fase Peak.

FOCUS VOLGENDE CHAT: ROADMAP punt 20 — de push-beschrijving in `buildWorkoutDescription_` op `zones.ts:569`. RECON-FIRST en ENGINE, dus STOP-EN-VERIFIEER vóór enige wijziging: eerst meten wie die string schrijft én wie hem leest, want `dslBlockFromRow_` parseert dezelfde tekst voor de laps die naar intervals.icu en Garmin gaan. De client-fix van punt 18 is daar NIET de goede vorm — dit is transport, geen renderrand. Verse chat.

**PUNT 15 IS AF — FASE 3c GEEFT DE EFFORTS-RIT EEN FIT-POORT, EN HET STAAT LIVE (3 augustus 2026).** De lange rit met efforts zette 105 minuten op een opgegeven dag van 60; sinds deze bouw mag hij alleen op een dag die hem draagt. Bouwdoc `23648b2` (`docs/PUNT15-FASE3C-BOUWDOC.md`), bouw `f8f1ebb`, plus deze close-out. Prod NU Worker Version `cdd32a42-7e9b-4983-bd5a-87c79f62da3c` (was `957e250f-72da-4abc-be2a-13fb68abb682`): 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-dPDbE8X4.js`), 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. GEEN migratie en geen enkel `wrangler d1`-commando, ook geen read; `0009_amusing_mordo.sql` blijft de hoogste. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30788210642>.
- **VLOEREN NU: vitest-totaal 898 over 68 bestanden · engine-selftest-assert-count 1567** (van 897/68 en 1527), afgelezen uit de testnaam op `packages/engine/src/selftest.test.ts:6660`. ENGINE GERAAKT: `planner.ts` 104 regels en `selftest.test.ts` 256, samen 337 toevoegingen en 23 verwijderingen. Lees de vloeren uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT: NIETS, nu.** Doel FTP draagt `spreiding.effortsInLangeRit` niet, dus poort 1 is per constructie inert, en poort 2 is via de pijplijn nergens bereikbaar. Wat hij gaat merken zodra het doel naar een klim-doel gaat: in een week waarin geen enkele niet-pendel trainingsdag 105 minuten haalt, verdwijnt de efforts-rit en valt die dag terug op een gewone kwaliteitssessie. Zijn beschikbaarheid wisselt per week, dus dat is geen theoretisch geval — en een weekvorm uit de meetset is geen portret van hem.
- **DE POORT IS AFGELEID EN STAAT NERGENS ALS GETAL.** `effortsDagMinimum_(doel)` rekent 15 plus reps maal onMin plus reps maal rest plus 15 plus `EFFORTS_MIN_BASE_` over `effortsVormVoorDoel_`; vandaag 105 voor beide klim-profielen én voor de terugval-vorm. Die helpers plus `effortsRequested_` stonden binnen `genericCombo` en zijn naar module-scope getild, zodat poort en bouwer dezelfde waarden lezen. GREP: 4 treffers op 105 in `planner.ts` — 1 de bestaande `bpmRange`, 3 commentaar, geen nieuwe code-literal.
- **`fixedNominal` STAAT NOG LOS IN `genericCombo`, EN T1 IS DE ENIGE BEWAKER.** Wijzigt iemand daar de warmup of het uitrijden, dan lopen poort en sessie uiteen. T1 leidt `grensMin` af uit de `tooLong` van de BOUWER zelf over een sweep van 60 tot 200 en asserteert gelijkheid met `effortsDagMinimum_` — gemeten 105 voor beide klim-doelen. Die test bestaat precies daarvoor; haal hem niet weg omdat hij triviaal oogt.
- **DE WEEKEND-TAK STAAT IN `assignWorkouts`, NIET IN `buildWorkout`.** De FOCUS van de vorige ronde noemde de verkeerde functie. Hij is via de pijplijn niet te bereiken: stap 4 van de allocator claimt élke eligible dag, dus de per-dag-takken vuren alleen op verstreken, gereden, taper- en deload-uitgesloten dagen. GEMETEN, met het predicaat dat gemeten is: NUL combo's in de acht deload-cellen (beide klim-doelen, Build en Peak, V1 en W3). Dat zegt dat poort 2 via de pijplijn niet rood te krijgen is, NIET dat de tak niet bereikt wordt. Vandaar een directe tak-test op een VERSTREKEN dag.
- **DE DEBT-NEVENEFFECTEN ZIJN NIET DIRECT GETOETST.** `debtWerk` is een kopie (`planner.ts:722`) en van buiten niet waarneembaar, dus T4 asserteert op `redenCode`. Dat bewijst dat de tak niet liep en daarmee INDIRECT dat `debtWerk.high = 0` en `debtForced` niet gezet zijn. Verplaatst iemand die toekenning ooit buiten de tak, dan wordt er niets rood.
- **ROOD PER PLEK, MET EEN MASKERING DIE LOS IS GEMETEN.** R1 laat "3c T2 onder grens plaatst geen efforts" vallen; T3 werd daar gemaskeerd omdat `assert_` de `it` afbreekt bij de eerste val, en is LOS gemeten: zonder poort staat er 105 minuten op een dag van 104. R2 laat "3c T4 onder grens geen combo" vallen, `combo_long_with_efforts` tegen `long_z2`.
- **BEGRENZING, BEIDE KANTEN.** `onderhoudInvariance.test.ts` beweegt precies 8 van de 48 cellen — de Build- en Peak-cellen van beide klim-doelen op `kort-winter-3x60` (langste dag 60) en `winterweek-45` (langste dag 90) — op `vt`, `naam`, `min` en `tss` in alle acht en `zones` in zes, en nul daarbuiten. `weekvormAs.test.ts` is ONAANGERAAKT en los groen: al zijn zeven weekvormen hebben een langste dag van 120 of meer, dus de poort kan er per constructie niet aan komen. LET OP: `onderhoudInvariance` draait FTP, Conditie en de twee klim-doelen — doel Onderhoud zit er NIET in; de naam is historisch.
- **TWEE FIXTURE-CORRECTIES, BEIDE GEHOUDEN.** `redenCode.test.ts` droeg drie weekend-fixtures op een dag van 60 bij doel FTP; die zijn verhoogd naar een AFGELEIDE `DRAAGT_EFFORTS = effortsDagMinimum_("FTP")`, niet naar een literal, dus ze bewegen mee. En de quotum-assertie in T2 was te sterk — `kwaliteitPerWeek` is een PLAFOND dat de allocator alleen vult waar een archetype past — en is vervangen door de invariantie "gelijk aantal kwaliteitsdagen mét en zónder poort", plus een assertie dat de vrijgekomen dag kwaliteit draagt. Beide kwamen binnen als CC-afwijking en zijn strikt beter dan wat het prompt vroeg.
- **HET BEELD BEWOOG NIET.** 8 prod-shots voor en na: 1 byte- én sha256-identiek, en de zeven andere verschillen UITSLUITEND op "Laatst gesynct", twee innerText-regels per shot en nul regels daarbuiten.
- **DE PROPAGATIE-UITVAL IS NU TWEE KEER GEZIEN.** De eerste na-run viel om op `#root > *` niet zichtbaar binnen 60 s; gediagnosticeerd (`/schema` 200, de nieuwe bundel 200 op 576073 bytes, CSS en `/api/settings` 200) en één keer herhaald. Geen defect, wel een vast patroon: reken op één herhaling na een deploy.
- **WAT 3c NIET BOUWDE.** (i) de ritduur-schaling VERVALT, met de grond in het bouwdoc §8. (iii) de dosis-verhoging bij `klim_lang` is nu ONTGRENDELD — de fit-poort schaalt mee naar `fixedNominal` 87 plus 30 is 117 — maar blijft geparkeerd achter punt 17: ze mikt op 13,8 minuten tekort over 18 cellen bij een event zonder datum, en de norm-vraag gaat voor.
- **OPENSTAAND, NIEUW EN GEMETEN OP DAANS SCHERM.** De duur van een sessie wordt kaal gerenderd: `WorkoutDetail.tsx:57` zet `session.totaalMin` zonder opmaak op het scherm, en `expandArchetype_` (`planner.ts:1383`) telt `warm + cool + mainMin` op uit blokken die elk al op één decimaal zijn afgerond. Gevolg: "59.800000000000004 min" bij `Sweet Spot lage cadans 3x7`. Dat is de bestaande regel "rond één keer af, tel nooit afgeronde delen op", nu op de WEERGAVE. Nieuw ROADMAP-punt 18.
- **OPENSTAAND, NIEUW EN GELEZEN IN DE BRON.** Het dagtype `weekend` is puur kalender-afgeleid (`deriveDagtype`, `apps/web/src/lib/planner.ts:18`) — de gebruiker kiest alleen pendel, trainen en minuten — en stuurt tóch een eigen per-dag-tak in `assignWorkouts`. Een deload-zaterdag en een deload-vrijdag van dezelfde lengte lopen daardoor door verschillende takken. In strijd met `DOELEN-SPEC` §2A: duur is een eigenschap van de dag, de kalendernaam is dat niet. Nieuw ROADMAP-punt 19.
- **OPENSTAAND, ONGEWIJZIGD.** Punt 10 fase B DEEL 2 · punt 16 · punt 17 · `indoor_ftp` 260 tegen `ftp` 280 · 404 op `/api/checkin/<datum>`, opnieuw gezien met 4 errors op `/api/checkin/2026-08-03`, een dag zonder check-in · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde · geen harness-scenario voor de Niveau-tab, voor Instellingen, voor een klim-doel of voor fase Peak.

FOCUS VOLGENDE CHAT: ROADMAP punt 18 — de afronding op het scherm. AFWIJKING VAN DE VOLGORDE, MET REDEN: punt 10 fase B deel 2 en punt 17 staan numeriek eerder, maar dit is een zichtbaar defect op Daans eigen scherm, het is CLIENT-only en klein, en het levert meteen een mechanisch net op dat deze hele familie vangt op elk scherm dat de harness fotografeert — een regex op de innerText-txt die afgaat op elk getal met twee of meer decimalen. Twee dingen horen erbij: één formatter aan de renderrand (maximaal één decimaal, achterliggende nul weg, zodat "60 min", "59,8 min" en "60,5 min" allemaal kloppen — die halve minuut is echt, ze komt uit intervallen van 90 seconden), en ÉLKE plek die een duur toont, niet alleen `WorkoutDetail`. GEEN engine-wijziging: afronden is PRESENTATIE, en een ronding in `expandArchetype_` zou elke vingerafdruk laten bewegen. Daarna punt 17. Verse chat.

**PUNT 15 FASE 3c IS GEMETEN EN AFGEBAKEND — DE TWEE KLIM-DOELEN KUNNEN HUN EIGEN NORM OP GEEN ENKELE DOSIS-TREDE HALEN (2 augustus 2026).** Leesronde: de chat mat zelf (read-only kloon plus gebundelde engine), CC deed alleen de docs-commits. Recon-doc `23648b2` (`docs/PUNT15-FASE3C-BOUWDOC.md` nieuw, `docs/ROADMAP.md` aangevuld), plus deze close-out. GEEN code, geen engine, geen migratie en geen enkel `wrangler`-commando, ook geen read. Prod ONVERANDERD op Worker Version `957e250f-72da-4abc-be2a-13fb68abb682`; `0009_amusing_mordo.sql` blijft de hoogste. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30765341753>.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 897 over 68 bestanden · engine-selftest-assert-count 1527**, afgelezen uit de testnaam op `packages/engine/src/selftest.test.ts:6408`. Docs-only; `git diff --stat HEAD~1 -- packages/engine` leeg. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app. Dit blok legt vast WAT fase 3c bouwt en vooral wat het NIET bouwt, zodat het over een half jaar niet opnieuw wordt voorgesteld.
- **DE PREMISSE VAN 3c IS VOOR DE VIERDE KEER GECORRIGEERD.** 3c stond gespecificeerd als een ingreep op de lange rit met efforts. GEMETEN over 5 doelen x 3 fases x 9 weekvormen: Korte beklimmingen ligt in 10 van de 18 Build- en Peak-cellen onder norm, samen 106,9 minuten; Lange beklimmingen in 4 van de 18, samen 13,8. Die cellen ontleed per sessie tegen de 26 minuten per prikkel: `VO2 Hill Repeats 9x90s` −95 over 10, `Drempel ladder 5-7-9` −24 over 6, `Drempel 2x8 kort` −18,2 over 2, `Drempel over-under 3 sets` −10 over 2, en de efforts-rit +40 over 10. De som is −107,2 tegen een gemeten tekort van 106,9, dus de ontleding sluit. DE EFFORTS-RIT IS IN GEEN ENKELE TEKORT-CEL DE DRAGER — hij is de enige term met een OVERSCHOT.
- **DE EIGENLIJKE VONDST: NORM EN PLAN LOPEN UIT ELKAAR.** De dosis-trede bestaat om beide SAMEN op te tillen. GEMETEN op weekvorm V1 in Build, norm en plan op DEZELFDE trede: FTP 95 tegen 84, 108,2 tegen 96, 121,4 tegen 108 — geleverd op trede 0, 2 en 4. Korte beklimmingen 68,5 tegen 78, 79,6 tegen 90, 85,5 tegen 102 — het gat GROEIT van −9,5 naar −16,5. Lange beklimmingen 76 tegen 78, 87,4 tegen 90, 99,3 tegen 102 — het gat blijft rond −2,5 en sluit nooit. De norm stijgt 6 minuten per trede (3 prikkels maal `DOSIS_TREDE_STAP_MIN` 2), terwijl de efforts-arm op een zaterdag van 120 na één stap tegen de ruimte-rem loopt: 30 werkminuten, dan 36, dan 36. De hendel is op en de meetlat loopt door.
- **DE KLIF OP VIJF UUR.** Daans werkelijke beschikbaarheid is ma45 di60 do60 za120 — 4,75 uur, dus `urenPrikkels` 2, norm 52, plan 68,5: GELEVERD bij alle drie de doelen, in Build en Peak. Weekvorm V1 is ma60 di60 do60 za120 — exact 5,0 uur, dus `urenPrikkels` 3, norm 78, plan 68,5: ONDER NORM. Vijftien minuten meer beschikbaarheid op maandag verzet de norm met 26 minuten en het plan met nul.
- **AAN DE PLAN-KANT HOUDT DE VO2-BAND OP BIJ 61 MINUTEN.** Gemeten met `expandArchetype_` zelf op een gevraagde dag van 60: `vo2_microburst` 8, `vo2_40_20` 11,4, `vo2_pyramid` 12, `vo2_hill_repeats` 16,5, `vo2_4x4` 18, `vo2_60_30` 20. Elk vo2-archetype met 22 of meer begint pas op 61 of hoger — `vo2_30_15_sets` 22,5 vanaf 62, `vo2_4x5` 23 vanaf 61, `vo2_long` 23 vanaf 65, `vo2_sandwich` 31 vanaf 61. Drempel en sweet spot hebben op precies 60 wél sterke opties: `threshold_4x8_seiler` 34,4, `sweetspot_lage_cadans_lang` 36, `sweetspot_2x15` 30. EN LET OP HOE DAT ENE SJABLOON AAN ZIJN 31 KOMT: `vo2_sandwich` is 10 minuten tempo, 4x2 op 110-114, weer 10 minuten tempo — 8 van de 31 zijn werkelijk vo2. De enige route waarlangs de bibliotheek een vo2-sessie boven de 26 tilt is hem in ZACHTER werk verpakken.
- **HET PLAFOND VAN DE BIBLIOTHEEK.** Maximale nominale werkminuten per intent over alle 35 archetypes: vo2 31 (`vo2_sandwich` op 61), drempel 42 (`threshold_long` op 82), sweetspot 60 (`sweetspot_long` op 103). GEEN ENKELE duurband reikt boven 135 minuten.
- **DE OVERSCHRIJDING, EN `tooLong` IS DOOD AAN ZIJN UITVOER.** In 8 van de 135 cellen wordt de sessie 105 minuten op een dag van 60 — W3 en W4 in Build en Peak, bij beide klim-doelen. Een week van 3 uur wordt zo 3u45 en wordt daarna afgemeten tegen een norm die op de opgegeven 3 uur is berekend. `tooLong` heeft VIER producenten (`archetypes.ts:254` en `:304`, `planner.ts:1388/1405`, `:1911/2008`, `:2498/2639`) en NUL lezers in de hele repo, ook niet in een test.
- **DE WAT-ALS DIE DE BOUW DRAAGT.** De arm mag alleen een dag pakken die de sessie draagt: precies 8 van de 135 cellen bewegen en NUL daarbuiten, alle overschrijdingen verdwijnen, kwaliteitsdagen blijven overal 3. Korte beklimmingen W3 en W4 gaan van 68,5 naar 49,9 tegen norm 52; Lange beklimmingen Build 76 naar 71 en Peak 57 naar 35. Dat verlies is de WAARHEID die verschijnt: de 68,5 bestond uit 45 minuten die de gebruiker niet had opgegeven.
- **WAT 3c NIET BOUWT, MET DE GROND ERBIJ.** (i) De ritduur-schaling VERVALT: de arm van `klim_kort` zit met 30 al op het vo2-plafond 31, draagt in elke tekort-cel een overschot, en boven 135 minuten bestaat er geen bibliotheek-anker — een regel daar zou met de hand gekozen zijn, wat `DOELEN-SPEC` §2A verbiedt. `DOELEN-SPEC` §3.3 (iii) vraagt bovendien "dezelfde inspanningen laat in een lange rit", en de RIT groeit al: `totaalMin` volgt de opgegeven dag. (iii) De dosis-verhoging bij `klim_lang` is GEPARKEERD achter (ii): 3x14 is verankerd (42 is exact het drempel-plafond) maar mikt op 13,8 minuten tekort over 18 cellen bij een event zonder datum, en na (ii) schaalt de poort vanzelf mee naar 117.
- **NIEUW IN DE REEKS: PUNT 17 — DE NORM IS VOOR DE KLIM-DOELEN ONBEREIKBAAR.** Geen dosis-vraag maar een norm-vraag. CRITERIUM: een week die EXACT volgens plan gereden wordt moet zijn eigen norm kunnen halen; kan dat op geen enkele trede, dan is óf de meetlat fout óf het plan te licht, en de blok-check behandelt het vandaag ten onrechte als uitvoeringsprobleem — dat bevriest de dosis-trede. VAL DIE ERBIJ HOORT: de norm naar het plan buigen is zichzelf meten, dezelfde val als het fase-quotum in fase 2. Eerst meten wat een sessie van 60 minuten per zone EERLIJK kan dragen, dan pas kiezen tussen bibliotheek en norm.
- **OPENSTAAND, NIEUW.** De shot-harness heeft geen scenario voor een klim-doel en geen voor fase Peak, dus de hele 3c-bouw is visueel onverifieerbaar; dat staat al langer en wordt met elke klim-ronde duurder.
- **OPENSTAAND, ONGEWIJZIGD.** Punt 10 fase B DEEL 2 · `indoor_ftp` 260 tegen `ftp` 280 · 404 op `/api/checkin/<datum>` · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde · geen scenario voor de Niveau-tab en geen voor Instellingen.

FOCUS VOLGENDE CHAT: punt 15 FASE 3c BOUWEN uit `docs/ROADMAP.md` — uitsluitend term (ii), de fit-poort, op de spec in `docs/PUNT15-FASE3C-BOUWDOC.md` §8 en §9. De efforts-sessie mag alleen op een dag die haar draagt; de ondergrens wordt AFGELEID uit `effortsVorm` van het profiel (15 plus reps maal onMin plus reps maal rest plus 15, plus `minBase` 30) en nooit als literal geschreven — een grep op 105 in `packages/engine/src` hoort niets nieuws op te leveren. ENGINE, dus eigen autorisatie; de wat-als is gedaan en staat in §7 van dat doc, de 5c-les is daarmee afgehandeld. Dezelfde poort hoort ook op de weekend-tak in `buildWorkout`, en die is via `buildWeekProposal` NIET rood te krijgen — 0 van de 135 cellen — dus daar hoort een directe test op de tak zelf met de reden erbij. Verse chat.

**DE TWEE KAART-PUNTEN VAN DE NIVEAU-TAB ZIJN AF EN STAAN LIVE (2 augustus 2026).** De testweek-teller liep dood en de aanname-regel onder de FTP-projectie stond op een literal die de app zelf niet volgt. Bouwdoc `d80e2dd`, spec-correctie `c7aebf6`, bouw `0f8f24d`, uitklap-fix `d206a00`, plus deze close-out. Spec: `docs/NIVEAUKAART-BOUWDOC.md`.
- **PROD NU Worker Version `957e250f-72da-4abc-be2a-13fb68abb682`**, via `91b88123-5cb0-46d3-a8f8-7f1878cad58b`, was `caccdcc1-385e-4c12-ad01-a6a3a3fa3927`. Twee deploys deze ronde, elk 3 assets vervangen en 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. GEEN migratie en geen enkel `wrangler d1`-commando, ook geen read; `0009_amusing_mordo.sql` blijft de hoogste. CI success, runs <https://github.com/daanhhk/Cadans/actions/runs/30761533470> en <https://github.com/daanhhk/Cadans/actions/runs/30762384148>.
- **VLOEREN NU: vitest-totaal 897 over 68 bestanden** (van 891/68) **· engine-selftest-assert-count 1527** (van 1514), afgelezen uit de testnaam op `selftest.test.ts:6408`. ENGINE GERAAKT: `niveau.ts` 54 regels, `phase.ts` 22 en `selftest.test.ts` 153 — samen 196 toevoegingen en 33 verwijderingen. Lees de vloeren uit de suite; hardcode ze nooit.
- **DE TELLER LIEP DOOD, EN DAT WAS DE GROTE HELFT.** GEMETEN over 6570 cellen — 6 blok-starts waarvan twee met een zomertijdgrens, elke dag drie jaar vooruit: 504 cellen gelijk, 504 exact één week te hoog (blok 1, de off-by-one uit de parkeerlijst) en 5562 op 0 terwijl er wél degelijk een testweek kwam. DE WORTEL: `doelTestWeken_` rekende ÉÉN vaste datum uit vanaf `doelStart` en herhaalde nooit, terwijl `computeMacroPhase` sinds punt 9 cyclisch 1..12 telt — en `doelStart` wordt nergens automatisch opgeschoven, enige schrijver `settings.ts:95`. HARDE DATUM die hiermee weg is: vanaf 2026-09-21 zou de kaart voorgoed "FTP-test over ~0 weken" hebben gezegd.
- **DE PARKEERLIJST-NOTITIE IS OP TWEE PUNTEN GECORRIGEERD.** De daar voorgestelde fix, `doelDuur` min 1, raakt uitsluitend die 504 cellen en laat de doodloop staan. En "zes weken" was de RAUWE afstand van 43 dagen; de functie rondt naar boven af, dus gecorrigeerd staat er op 2026-08-02 een 7 en geen 6.
- **NIET DRAGEND: DE BAND.** `ctlAtWeek_` op 8, 7 en 6 weken geeft bij `currentFtp` 280, `currentCtl` 45,7 en 56 TSS per uur 0 W verschil bij 5 uur en hoogstens 2 W bij 8 uur. Dit was een TELLER-defect, geen rekendefect.
- **EEN GEDEELDE CONSTANTE.** `DOEL_BLOK_WEKEN` staat op `phase.ts:78` en wordt gelezen door `computeMacroPhase` (de modulo én de blok-deling) en door `doelTestWeken_`. De fase-ladder 4, 8 en 11 blijft LITERAL: die op de constante betrekken zou een afleiding suggereren die nergens varieert.
- **MECHANISCH GEKOPPELD, MET EEN LUS-TOTAAL ERBIJ.** De koppel-assertie enumereert met `computeMacroPhase` ZELF over 2 doelStarts maal 156 weken en asserteert 312 als TOTAAL naast 312 als ok. Dat totaal is de bescherming tegen een lus die stil leeg draait.
- **DE AANNAMEREGEL HANGT AAN DRIE DINGEN, NIET TWEE.** GEMETEN met `blokDosisNorm` zelf over 5 doelen maal 4 fases maal 4 tot 14 uur: FTP en Korte beklimmingen 3 in ELKE fase vanaf 5 uur en 2 bij 4 uur; Conditie en Lange beklimmingen 2 in Base en Peak en 3 in Build; Onderhoud 3 overal, ook bij 3 uur. De literal 2 klopte uitsluitend bij 4 uur, of bij die twee doelen buiten Build.
- **FASE-COMPLEET IN PLAATS VAN FASE-GEPIND, EN DAT IS DWINGEND.** De Niveau-tab laadt alleen `getSettings` en `getActivities` — geen events en geen `overnameBevestigd` — dus `effectiveMacroFase_` is daar per constructie niet te berekenen. Een fase die daar tóch gepind wordt is een TWEEDE fase-bron die van het Schema-scherm kan afwijken zodra de event-overname vuurt, voor AGR vanaf 2027-02-22. De regel loopt daarom Base, Build en Peak langs en meldt het bereik; drie van de vijf doelen vallen daarbij toch op een enkel getal.
- **DE COMPOSITIE LANDT CLIENT-ZIJDE OMDAT ZE NIET ANDERS KAN.** `sleutelAannameRegel` staat op `apps/web/src/lib/niveau.ts:275` en vouwt met `blokDosisNorm`; `packages/engine` kan uit `apps/web` per constructie niet importeren. `ftpBandFromProjection_` kreeg daarom een vijfde, OPTIONELE `sleutelRegel` die de eerste regel vervangt; ontbreekt hij, dan blijft de literal staan. Enige call-site `DoelProjectie.tsx:463`, gevoed met `hours` — de SCHUIFWAARDE, zodat de aanname met de uren-schuif meebeweegt.
- **DE SPEC WAS INTERN TEGENSTRIJDIG EN CC STOPTE VÓÓR DE BOUW.** §2.3 beloofde dat de bewaarde `doelDuur` blijft staan; §3 schreef voor hem uit `NUM_KEYS` te halen. Het PUT-contract is FULL-REPLACE — de kop van `settings.ts`, `api.ts:762` en `writeSettings` op `repo.ts:56` met `doelDuur: s.doelDuur ?? null` — dus de eerstvolgende opslag had `doel_duur` op NULL gezet. En `SettingsForm` is `Record<keyof SettingsInput, string>`, dus het had niet eens gecompileerd. BESLUIT: alleen de zichtbare rij uit Instellingen; de formulier-laag, het DTO-veld, de worker-route en de D1-kolom blijven. Correctie-commit `c7aebf6`.
- **ROOD PER TERM, VIER PATCHES, ELK VOORAF GEGREPT OP DE EIGEN MARKERING.** P1 cyclus valt op "doelTestWeken cyclus 2026-10-05", 0 tegen 9. P2 off-by-one valt op de herijkte "doelTestWeken normaal", 11 tegen 10. P3 de vijfde parameter valt op "ftpBand sleutelRegel vervangt regel 0". P4 de bereik-tak valt op precies ÉÉN test, de Lange-beklimmingen-assertie. De vijf bestaande `doelTestWeken_`-asserties zijn HERIJKT op de nieuwe arity; dat is geen verzwakking maar de herijking die hoort bij een regel die expliciet is ingetrokken.
- **DE VLOER DEED ZIJN WERK.** CC overschreef `apps/web/src/lib/niveau.test.ts` per ongeluk met `cat >` en verloor 22 tests; het totaal zakte zichtbaar van 891 naar 875 en DAAR brak het op. Hersteld met `git checkout` en daarna aangevuld in plaats van vervangen; eindstand 897, dat is 891 plus 6.
- **HET AANNAMES-PANEEL KON NIET DICHT, EN ALLEEN DAANS OOG KON DAT VINDEN.** `hidden={!assumOpen}` naast een inline `display: "flex"` — de browserregel `[hidden] { display: none }` verliest van élke expliciete display, dus het paneel stond permanent open terwijl knop, label en pijl wél kantelden. NIET door deze ronde veroorzaakt: de diff van `0f8f24d` tegen `8cb0bec` raakt het element niet. De vindpatroon-toets gaf ÉÉN treffer: `WorkoutDetail.tsx:158` draagt dezelfde constructie zonder inline stijl en is per constructie in orde. 897 tests en 8 prod-shots lieten dit staan.
- **WAT DAAN MERKT, ALLE VIER OP PROD BEVESTIGD.** De kaart zegt "~7 wkn tot testdag" in plaats van "~8"; de eerste aanname is "3 sleutelsessies per week, consequent" in plaats van "2" en beweegt met de uren-schuif mee — bij 4 uur 2, bij 5 weer 3; het aannames-paneel staat dicht tot hij het aantikt; en de rij "Blok-duur · weken" is weg uit Instellingen.
- **BEGRENZINGSBEWIJS, BEIDE DEPLOYS.** Telkens 1 van de 8 prod-shots byte- én sha256-identiek en de zeven andere UITSLUITEND verschillend op het synctijdstempel — 20:46 tegen 20:47 en 21:00 tegen 21:02 — met nul afwijkende regels daarbuiten. Dat is de verwachte uitkomst: beide bouwen zitten op de Niveau-tab en de harness laadt alleen `/schema`.
- **OPENSTAAND, NIEUW.** De shot-harness heeft nog geen scenario voor de Niveau-tab en geen voor Instellingen. Deze ronde leverde het bewijs waarom dat telt: een render-defect op de Niveau-tab overleefde 897 tests en 8 prod-shots en werd door Daans oog gevonden.
- **OPENSTAAND, ONGEWIJZIGD.** Punt 10 fase B DEEL 2 · punt 15 fase 3c · `indoor_ftp` 260 tegen `ftp` 280 · 404 op `/api/checkin/<datum>` · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde · geen enkel harness-scenario draagt fase Peak.

FOCUS VOLGENDE CHAT: punt 15 FASE 3c uit `docs/ROADMAP.md` — het resterende dosis-tekort van de twee klim-doelen. AFWIJKING VAN DE VOLGORDE, MET REDEN: punt 10 fase B deel 2 staat numeriek eerder, maar punt 15 is het enige punt dat MIDDEN in de bouw staat — fase 1, 2, 3a en 3b zijn af — en het STAND-blok van 3b wijst het resterende tekort expliciet aan 3c toe; bovendien draagt punt 15 een harde datum, korte beklimmingen wordt half februari 2027 het actieve doel, en punt 10 fase B deel 2 draagt er geen. ENGINE, dus eigen autorisatie, en er gaat een wat-als aan vooraf; de 5c-les staat. Verse chat.

**PUNT 15 FASE 3b IS AF EN STAAT LIVE — DE EFFORTS-BAND IS DOEL-SPECIFIEK (2 augustus 2026).** De lange rit met efforts gaf beide klim-doelen dezelfde sweetspot-band 85-92; sinds deze bouw draagt `klim_kort` 5x6 op 100-108 en `klim_lang` 3x10 op 95-102. Bouwdoc `592d15f`, bouw `829c47e`, plus deze close-out. Spec: `docs/PUNT15-FASE3B-BOUWDOC.md`. Prod NU Worker Version `caccdcc1-385e-4c12-ad01-a6a3a3fa3927` (was `c5b67eb7-8eb3-456f-b21c-4dffa882cd4a`): 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-kB3VJ9uY.js`), 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. GEEN D1-migratie — deze bouw raakt het schema niet — en `0009_amusing_mordo.sql` blijft de hoogste; één read-only SELECT ná de deploy gaf `rows_written` 0 en `changed_db` false.
- **VLOEREN NU: vitest-totaal 891 over 68 bestanden · engine-selftest-assert-count 1514** (van 1459), afgelezen uit de testnaam op `packages/engine/src/selftest.test.ts:6285`. ENGINE GERAAKT: `archetypes.ts` 40 regels, `planner.ts` 97 en `selftest.test.ts` 196 — samen 309 toevoegingen en 24 verwijderingen. Lees de vloeren uit de suite; hardcode ze nooit.
- **DE BOUW.** Een OPTIONEEL veld `effortsVorm` op `PROFILES.klim_kort` en `PROFILES.klim_lang`, gelezen in `genericCombo` als `{ ...vormDefault_, ...(profileForDoel_(doel)?.effortsVorm ?? {}) }`. ONTBREEKT het veld, dan geldt de oude vorm — en dat is DRAGEND, want de weekend-tak in `buildWorkout` levert dit type ook zonder `spreiding.effortsInLangeRit`, bij elk doel, zodra `!dekking.high` en de fase niet Base is. De rem rekent nu op WERK PLUS RUST: `kMax = floor(room / (onMin + rest))`, want elke extra herhaling sleept een intra-rust mee.
- **DE DRAGENDE UITKOMST: DE BAND RAAKT DE DOSIS NIET.** 18 van de 18 gemeten cellen leveren identieke werkminuten; wat verschuift is uitsluitend de zone-verdeling. Op V1 in Build gaat tempo van 25,5 naar 4,0, drempel van 29,6 naar 39,8 en anaeroob van 13,5 naar 24,8, bij een ongewijzigd totaal van 68,5. Daarmee is 3b een KARAKTER-correctie en geen dosis-correctie; het resterende tekort van punt 15 hoort bij fase 3c.
- **TWEE STILLE KOPPELINGEN DIE EEN VOLGENDE CHAT MOET WETEN.** (1) De TERUGVAL-vorm wordt sinds deze bouw UITSLUITEND via doel FTP getoetst — de fase-1- en 3a-fixtures in `apps/web/src/lib/punt15.test.ts` wijzen daarheen. Zet iemand ooit `effortsVorm` op `PROFILES.ftp`, dan verliezen die fixtures STILZWIJGEND hun betekenis en blijven ze groen terwijl ze niets meer toetsen. (2) 3a-test (c) hangt aan `Lange beklimmingen`, omdat `dosisTredeFactor` DOEL-SPECIFIEK is: dat doel reproduceert 3x11,5 en 3x15 exact, waar FTP op trede 4 3x14,8 geeft. Gaat `klim_lang` ooit naar as "aantal", dan breekt die test om de VERKEERDE reden.
- **DE ROOD-VOORSPELLING VAN TERM 3 KWAM UIT EEN ANDER ONTWERP DAN HET GEBOUWDE.** De spec voorspelde zonder de rem 8x6 met een Z2-basis van 18; dat hoort bij een variant ZONDER ruimte-clamp. Alle drie gemeten op een dag van 120 bij mesoWeek 3 plus trede 4: zonder clamp 8x6 met basis 18, zonder de rust in de ruimte 7x6 met basis 27, en gebouwd 6x6 met basis 36. `totaalMin` blijft in alle drie 120. De rood-toets viel op de middelste variant.
- **DE VINGERAFDRUKKEN, HERIJKT EN BEGRENSD.** 16 van de 48 cellen bewegen, uitsluitend op het veld `tss` en telkens met exact +6, en alleen de Build- en Peak-cellen van de twee klim-doelen. `vt`, `naam`, `min` en `zones` staan alle 48 keer identiek; FTP en Conditie bewegen geen cel. `weekvormAs.test.ts` is onaangeraakt en los groen.
- **WAT DAAN MERKT.** Niets bij doel FTP — daar is de bouw per constructie inert. Bij een klim-doel krijgt de zaterdag een andere INHOUD op dezelfde tijd: kortere, hardere herhalingen bij Korte beklimmingen en drempelblokken bij Lange beklimmingen.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde. De harness laadt nog uitsluitend `/schema`; een scenario voor de Niveau-tab bestaat niet, en geen enkel scenario draagt fase Peak.

FOCUS VOLGENDE CHAT: de twee kaart-punten, ongewijzigd. (1) `packages/engine/src/niveau.ts:798` draagt "2 sleutelsessies per week, consequent" als LITERAL in een doel- én fase-onafhankelijke array, terwijl `PROFILES.ftp` nu 3 draagt in Base, Build ÉN Peak; de functie krijgt geen doel en geen fase mee, dus de kaart onderbouwt zijn schatting met een aanname die de app zelf niet volgt. (2) De kaart zegt "FTP-test over ~8 weken" omdat `doelTestWeken_` rekent met `doelStart` plus `doelDuur` maal 7 (2026-09-21), terwijl de testweek per `computeMacroPhase` blokweek 12 is met maandag 2026-09-14 — zes weken; het juiste anker is `doelStart` plus (`doelDuur` min 1) maal 7, en bijkomend hardcodeert `computeMacroPhase` 12 terwijl `doelTestWeken_` `settings.doelDuur` leest. Beide ENGINE, dus eigen autorisatie. Verse chat.

**PUNT 15 — HET PEAK-QUOTUM IS AF EN STAAT LIVE (2 augustus 2026).** `kwaliteitPerWeek.Peak` gaat van 2 naar 3 bij `klim_kort` en `ftp`; `klim_lang` en `conditie` blijven op 2 en `onderhoud` stond al op 3. Bouwdoc `438f33d`, bouw `d93774d`, plus deze close-out. Spec: `docs/PUNT15-PEAKQUOTUM-BOUWDOC.md`. Prod NU Worker Version `c5b67eb7-8eb3-456f-b21c-4dffa882cd4a`, gebouwd van `d93774d` (was `1f8ec371-c7f4-4078-8bce-7dc764434bf1`): 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-tELhNAI9.js`), 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. GEEN migratie: `0009_amusing_mordo.sql` blijft de hoogste en er is geen enkel `wrangler d1`-commando gedraaid, ook geen read. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30744825634>.
- **VLOEREN NU: vitest-totaal 887 over 68 bestanden · engine-selftest-assert-count 1459** (van 1449) — tien nieuwe asserties, de BEDOELDE stijging. ENGINE GERAAKT: `archetypes.ts` 17 regels en `selftest.test.ts` 60 regels, samen 73 toevoegingen en 4 verwijderingen. Lees de vloeren uit de suite; hardcode ze nooit.
- **DE GROND IS PLAN, GEEN SIGNAAL.** `DOELEN-SPEC` §3.3 noemt voor `klim_kort` drie elementen per week en §3.1 geeft `ftp` een uren-regel, beide ZONDER fase-clausule; Base en Build droegen al 3, dus Peak 2 was de uitzondering. En dit getal is per constructie niet te ijken: `blokDosisNorm` leidt de norm via `min(quotum, urenPrikkels)` een-op-een uit het quotum af, dus een geleverd-telling die het quotum beoordeelt meet zichzelf.
- **GEMETEN, BEGRENSD.** 18 van de 135 cellen bewegen en 0 daarvan liggen buiten Peak: 9 bij FTP en 9 bij Korte beklimmingen. `klim_lang`, `Conditie` en `Onderhoud` bewegen geen cel. Korte Peak V1 gaat van 46,5 naar 68,5 werkminuten, van 2 naar 3 kwaliteitsdagen, en de poortset van tempo plus anaeroob naar tempo, drempel én anaeroob — DAARMEE IS DE OMKERING WEG DIE FASE 3b BLOKKEERDE. FTP Peak V1 gaat van 70,0 naar 78,0.
- **HET QUOTUM OPENT HET SLOT, DE FASE-MODULATIE VULT HET.** Bij `klim_lang` zou quotum 3 in 8 van de 9 weekvormen anaeroob werk binnenhalen dat §3.4 niet wil — maar in BUILD levert datzelfde quotum daar 0 anaerobe minuten in 9 van de 9. De oorzaak is `GOAL_FASE_MOD_.Peak` (vo2 +0,15, sweetspot -0,10), niet het quotum. Aparte vraag, aparte ronde; dát is waarom `klim_lang` en `conditie` op 2 blijven.
- **DE AFWIJKING VAN CC IS GEHOUDEN EN DE METING IS AFGEMAAKT.** Het bouwdoc citeerde bij "wat Daan merkt" alleen zijn eigen weekvorm. VOLLEDIG: FTP in Peak gaat van 3 van 9 geleverd naar 2 van 9 — V1, V5 en V6 kantelen naar niet-geleverd (70/56 naar 78/84, 64,9/56 naar 72,9/84, 70/56 naar 78/84) en V3 en V7 kantelen de ANDERE kant op (52,5/56 naar 86,9/84, 55/56 naar 86,5/84). Korte beklimmingen gaat van 2 van 9 naar 4 van 9, met NUL cellen de verkeerde kant op. Voor Daan zelf verandert het oordeel niet: ma45 di60 do60 za240 las al onder norm, 39,9 tegen 56, en leest nu 62 tegen 84.
- **WAT DAAN MERKT, MET EEN DATUM: niets tot 2026-08-24.** Vanaf die maandag staat er in zijn Peak-weken een DERDE kwaliteitsdag.
- **NIET TE FOTOGRAFEREN, EN DAT IS EEN GRENS.** Alle negen scenario's in `tools/shots/shot.mjs` dragen `blokWeek` 1 of 4, en die vallen op cyclusweek 1 en 4 — beide fase BASE. Geen scenario kan Peak tonen; bewust geen scenario gebouwd. De prod-shots voor en na bevestigen dat: 1 van de 8 byte- en sha256-identiek, en elk verschil zit VOLLEDIG in "Laatst gesynct · 13:09" tegen "13:13".
- **EVALUATIEPUNT MET DATUM EN FALSIFIER.** Zijn Peak is blokweek 9, 10 en 11: 2026-08-24, 2026-08-31 en 2026-09-07. De blok-terugblik draagt dat mesoblok LOPEND op 2026-09-14 en AFGEROND op 2026-09-21. WAT DIE KAART BESLIST: hoeveel van de drie voorgeschreven kwaliteitsdagen er werkelijk gereden zijn. Levert hij er in twee of drie van de drie maar twee, dan was 3 te veel voor zijn uren en hoort het quotum terug of hoort doel-passendheid te spreken. WAT DIE KAART NIET BESLIST: of 3 beter is dan 2 — de norm volgt het quotum en dezelfde Peak wordt nooit met 2 doorlopen, dus dat tegenvoorbeeld bestaat per constructie niet.
- **OPENSTAAND, NIEUW EN CHAT-ZIJDE GEMETEN.** (1) `packages/engine/src/niveau.ts:798` draagt "2 sleutelsessies per week, consequent" als LITERAL in een doel- én fase-onafhankelijke array, terwijl `PROFILES.ftp` nu 3 draagt in Base, Build ÉN Peak; de functie krijgt geen doel en geen fase mee. (2) De kaart zegt "FTP-test over ~8 weken" omdat `doelTestWeken_` rekent met `doelStart` plus `doelDuur` maal 7 = 2026-09-21, terwijl de testweek per `computeMacroPhase` blokweek 12 is met maandag 2026-09-14 — dus 6 weken. De kaart wijst op de dag NÁ de testweek; het juiste anker is `doelStart` plus (`doelDuur` min 1) maal 7. Bijkomend: `computeMacroPhase` hardcodeert 12 terwijl `doelTestWeken_` `settings.doelDuur` leest.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde. De harness laadt nog uitsluitend `/schema`; een scenario voor de Niveau-tab en voor een klim-doel bestaat niet.

FOCUS VOLGENDE CHAT: punt 15 FASE 3b uit `docs/ROADMAP.md` — de efforts-band, nu ONTGRENDELD doordat de poortset in Peak drempel houdt. Bij quotum 2 viel die poortset op uitsluitend `anaeroob` zodra de band omhoogging, precies de omkering die punt 14 wegnam; dat blok is er nu af. ENGINE, dus eigen autorisatie, en er gaat een wat-als aan vooraf; de 5c-les staat. Neem de twee kaart-punten hierboven mee als kleine, losse bouwen. Verse chat.

**PUNT 15 FASE 1, 2 EN 3a STAAN LIVE — EN DRIE OPENSTAANDE PUNTEN ZIJN MET EIGEN OGEN GEZIEN (2 augustus 2026).** Drie rondes die elk apart niet gedeployed waren gingen in één keer mee; daar staat sinds nu een besluit tegenover in `docs/WERKWIJZE.md`.
- **PROD NU Worker Version `1f8ec371-c7f4-4078-8bce-7dc764434bf1`**, gebouwd van `ec8098c` (was `0f74912a-c40b-43ba-a2fe-0ee47f0636ed` van `8ae30c8`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-Bi6YWmrG.js`), 63 van de 67 ongewijzigd, 315,91 KiB / gzip 67,60 KiB. GEEN migratie: `0009_amusing_mordo.sql` blijft de hoogste en er is geen `wrangler d1`-MUTATIE gedraaid. Eén read-only SELECT: doel FTP, `doel_start` 2026-06-29, `rows_written` 0, `changed_db` false.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 885 over 68 bestanden · engine-selftest-assert-count 1449.**
- **VEERTIEN COMMITS MEE, TWEE MEER DAN VERWACHT EN BEIDE ONSCHADELIJK.** `c4b5ff3` en `2a78e0a` horen bij punt 14 fase 2 en zijn docs-only — samen `HANDOFF.md`, `docs/PUNT14-FASE2-VERDICT.md`, `docs/ROADMAP.md` en `docs/WERKWIJZE.md`, NUL regels code, dus ze kunnen de bundel per constructie niet raken. CC ving ze en vroeg toestemming in plaats van door te lopen; dat is de juiste volgorde en staat hier vast zodat het geen aanname blijft.
- **HET BEELD BEWOOG NIET.** 8 prod-shots voor en na: 1 byte- en sha256-identiek, en de zeven andere verschillen UITSLUITEND op "Laatst gesynct · 11:39" tegen "11:44". Buiten de blok-terugblik-kaart beweegt niets. Dat is de verwachte uitkomst: bij doel FTP zijn fase 1 en 3a per constructie inert. Nieuwe regel in `docs/WERKWIJZE.md`.
- **DE BLOK-TERUGBLIK ZWIJGT, EN DAT IS BEDOELD.** 0 van de 8 shots: geen twee opbouwweken van het beoordeelde blok dragen een bewaard plan. Ook "totaal onder norm" komt nergens voor (0 van 8), en een sessie met "Lange rit + " evenmin (0 van 8) — dat laatste kán bij doel FTP niet.
- **PUNT 8 IS VISUEEL BEVESTIGD OP PROD**, op Daans telefoon. De kaart toont "DOEL-GEREEDHEID · FTP" met "opbouw naar FTP-test", niet de girona-lat. Daarmee is de check die sinds 31 juli openstond gedaan.
- **DE VIJF-DOELEN-KEUZE IS VISUEEL BEVESTIGD, MET EEN CORRECTIE.** Het is GEEN `Segmented` op één rij maar een grid van twee kolommen over drie rijen: FTP / drempel · Duurvermogen · Klim kort · Klim lang · Onderhoud. Niets breekt af, niets overlapt. De zorg "passen vijf segmenten naast elkaar" was daarmee niet van toepassing; het punt is dicht.
- **OPENSTAAND, NIEUW EN GEMETEN OP HET BEELD.** De aannames-lijst onder de FTP-projectie zegt "2 sleutelsessies per week, consequent". Die regel staat als LITERAL in een vaste, doel-onafhankelijke array op `packages/engine/src/niveau.ts:798`, terwijl `PROFILES.ftp` quotum 3 draagt in Base en Build en `urenPrikkels` bij 5 uur óók 3 geeft. Daan zit nu in Build, dus de kaart onderbouwt zijn schatting met een aanname die de app zelf niet volgt. De 280 W zelf is WEL correct: bij 5 u/week ligt het CTL-plafond (40) onder de huidige waarde, dus `dCtl` is 0, gain 0 en `lowW` gelijk aan de huidige FTP.
- **OPENSTAAND, NIEUW EN NOG NIET GEMETEN.** De kaart zegt "FTP-test over ~8 weken", terwijl de testweek in deze stand op 2026-09-14 staat — zes weken vanaf 2026-08-02. Acht weken komt eruit als je telt tot het einde van het 12-weeks blok (2026-09-21) vanaf de weekmaandag 2026-07-27. Twee ankers dus; welk van de twee de kaart gebruikt is één meting.
- **OPENSTAAND, NU BESLISBAAR.** De 404 op `/api/checkin/<datum>` staat er nog: 2 errors op `01-week` en 2 op `03-di`, alle vier op `/api/checkin/2026-08-02` — een dag ZONDER ingevulde check-in. De vorige prod-ronde gaf 0 errors op een dag MÉT check-in. Daarmee is het geen waarneming meer maar een reproduceerbaar gedrag: de route geeft 404 waar hij leeg hoort te antwoorden.
- **AFWIJKING BIJ DE DEPLOY, CORRECT AFGEHANDELD.** De eerste na-run viel om op propagatie (`#root > *` niet zichtbaar binnen 60 s). Gediagnosticeerd — `/schema` 200, de nieuwe bundel `index-Bi6YWmrG.js` 200 op 574688 bytes, CSS en `/api/settings` 200 — en daarna één keer herhaald.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · de coach-copy-ronde. De harness laadt nog uitsluitend `/schema`; een scenario voor de Niveau-tab en voor een klim-doel bestaat niet.

FOCUS VOLGENDE CHAT: het PEAK-QUOTUM, binnen punt 15 en VOOR fase 3b. De onderbouwing staat al in `docs/ROADMAP.md` punt 15: elke bovendrempel-band voor `klim_kort` hangt aan dat quotum, want bij 2 valt de poortset in Peak op uitsluitend `anaeroob` — precies de omkering die punt 14 wegnam. ENGINE (`PROFILES.kwaliteitPerWeek`), dus eigen autorisatie, en er gaat een wat-als aan vooraf; de 5c-les staat. Twee dingen eerst meten: bij `klim_lang` trekt quotum 3 een vo2-sessie de Peak-week in die `DOELEN-SPEC` §3.4 niet wil, en Peak wordt voor `klim_kort` in elke gemeten cel identiek aan Build. Neem de twee nieuwe kaart-punten mee als kleine, losse metingen. Verse chat.

**PUNT 15 FASE 3a IS AF — DE LANGE RIT MET EFFORTS HEEFT EEN HENDEL, EN HAAR TSS KOMT UIT HAAR BLOKKEN (2 augustus 2026).** Fase 1 sloot het gat in de munt, fase 2 repareerde de meetlat; 3a is de eerste die aan de DOSIS zelf komt. Bouwdoc `3736575`, bouw `9066920`, plus deze close-out. Spec: `docs/PUNT15-FASE3-BOUWDOC.md`. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30741299409>.
- **VLOEREN NU: vitest-totaal 885 over 68 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 878/68). ENGINE GERAAKT: `git diff --stat HEAD~1 -- packages/engine` toont `packages/engine/src/planner.ts` met 59 toevoegingen en 12 verwijderingen, één bestand. Lees de vloeren uit de suite; hardcode ze nooit.
- **NIET GEDEPLOYED, EN DAT IS EEN BESLUIT.** `spreiding.effortsInLangeRit` staat alleen op `klim_kort` en `klim_lang`, dus bij doel FTP is de bouw per constructie inert. Prod blijft op Worker Version `0f74912a-c40b-43ba-a2fe-0ee47f0636ed`; `0009` blijft de laatste remote migratie; geen enkel `wrangler`-commando gedraaid, ook geen read. LET OP: fase 1, 2 én 3a staan nu ALLE DRIE ongedeployed. De deploy hoort bij 3b, en op dat moment moet eerst nagegaan worden wat er nog méér op de plank ligt.
- **WAT DAAN MERKT: NIETS, nu.** Wat hij gaat merken zodra het doel naar een klim-doel gaat: de zaterdag GROEIT MEE met het blok, in plaats van elke week identiek te zijn.
- **DE WORTEL, GEMETEN.** De efforts-arm leverde 30,0 werkminuten bij ELKE ritduur van 90 tot 300 — alle extra tijd ging naar de Z2-basis, 30 bij een rit van 105 tot 225 bij 300. Inert voor `mesoWeek` 1 t/m 4, en `dosisTrede` bereikte hem per constructie niet. Door de VOLLEDIGE pijplijn in Build, trede 0 tot 4: FTP V1 95,0 / 101,9 / 108,2 / 115,1 / 121,4 met elke sessie in beweging, tegenover Korte beklimmingen V1 68,5 / 71,0 / 73,6 / 76,1 / 79,5 met de zaterdag aan BEIDE uiteinden op exact 30,0. V1 (za 120) en V4 (za 240) gaven identiek 68,5.
- **TERM 1, DE HENDEL MET RUIMTE-REM.** f = `mesoFactor` maal `dosisTredeFactor`, de werktijd per herhaling schaalt, de intra-rust NIET, en `totaalMin` rekent op `fixedNominal` en beweegt per constructie niet mee met f. De band 85-92 blijft ONGEMOEID: karakter-invariant, alleen de dosis beweegt.
- **DE GROND VOOR DE REM STOND FOUT IN HET BOUWDOC EN IS GECORRIGEERD.** §7 en §10 beweerden dat de sessie zonder rem over de opgegeven dag heen loopt, met 109,5 en 120,0 bij 105 gevraagd. Die getallen komen uit de WAT-ALS, waarin `fixed` met f meegroeide. Wat de rem werkelijk voorkomt is dat de Z2-BASIS onder `minBase` zakt — GEMETEN bij 105 gevraagd en mesoWeek 3: mét rem 3x10 met een basis van 30, zonder rem 3x11,5 met basis 25,5, en op trede 4 3x15 met basis 15. CC ving de tegenspraak, volgde het ontwerp en leverde het juiste bewijs. Twee nieuwe regels in `docs/WERKWIJZE.md`.
- **TERM 2, DE TSS.** `tssFromBlokken_` in plaats van `Math.round(totaalMin * 0.85)`. Deze sessie was de ENIGE met blokken in de hele meetruimte waarvan de TSS afweek: 36 van de 36 voorkomens, gemiddeld +7,9, minimum +2 en maximum +18, groeiend met de duur.
- **ROOD PER TERM.** Work-scale terug: (c), (d) en (f) vallen. Ruimte-rem terug: (b) valt, op `[11.5,11.5,11.5]` tegen `[10,10,10]`. TSS terug: (e), de herijkte fase-1-test en de vingerafdruk-suite vallen. Elke patch vooraf gegrept op zijn eigen markering.
- **ONDERHOUDINVARIANCE IS HERIJKT, EN DAT KON NIET ANDERS** — de eis was onaangeraakt ÉN groen, terwijl term 2 juist `tss` verandert en die vingerafdruk `tss` draagt. De herijking is zelf het BEGRENZINGSBEWIJS: 16 van de 48 cellen bewegen, uitsluitend op `tss` — 102 naar 98 (4x), 128 naar 120 (4x), 89 naar 87 (8x), exact de drie vooraf gemeten delta's — en `vt`, `naam`, `min`, `zones`, `macroFase` en `mesoWeek` staan alle 48 keer identiek. Het PLAN bewoog niet, alleen wat het over zijn eigen belasting meldt. `weekvormAs.test.ts` is onaangeraakt en los groen.
- **ALLE ASSERTIES LANDEN IN `apps/web/src/lib/punt15.test.ts`, EN DAT IS MAAR HALF DWINGEND.** (b) en (f) vouwen met `planZone5_`, die in `apps/web` woont waar `packages/engine` per constructie niet uit kan importeren; (a), (c), (d) en (e) lezen het workout-object rechtstreeks en hadden ook engine-zijde gekund. Gevolg: een ENGINE-wijziging zonder engine-zijdige dekking — wél gedekt, alleen niet daar, en daarom staat de selftest-vloer stil bij een engine-commit.
- **GEEN SHOT-HARNESS, EN DAT IS EEN GRENS EN GEEN OMISSIE.** `tools/shots/shot.mjs:282` zet doel "FTP" en `effortsInLangeRit` staat alleen op `klim_kort` (`archetypes.ts:1614`) en `klim_lang` (`:1634`); geen enkel scenario kan deze sessie tonen. De hele klim-tak blijft visueel onverifieerd, en dat doel wordt half februari 2027 actief.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de coach-copy-ronde.

FOCUS VOLGENDE CHAT: het PEAK-QUOTUM, binnen punt 15 en VOOR fase 3b. Reden dat het voorgaat: GEMETEN hangt elke bovendrempel-band voor `klim_kort` aan dat quotum — bij 2 valt de poortset in Peak op uitsluitend `anaeroob`, precies de omkering die punt 14 wegnam. ENGINE (`PROFILES.kwaliteitPerWeek`), dus eigen autorisatie, en er gaat een wat-als aan vooraf; de 5c-les staat. Wat er al ligt staat in `docs/ROADMAP.md` punt 15. Twee dingen eerst meten: bij `klim_lang` trekt quotum 3 een vo2-sessie de Peak-week in die `DOELEN-SPEC` §3.4 niet wil, en Peak wordt voor `klim_kort` in elke gemeten cel identiek aan Build. Verse chat.

**PUNT 15 FASE 2 IS AF — DE MEETLAT KENT NU HET FASE-QUOTUM EN TELT HET TOTAAL (2 augustus 2026).** Fase 1 sloot het gat in de munt; wat daarna zichtbaar werd is dat de MEETLAT zelf twee gebreken had. Recon en spec `ec0cc85`, bouw `a15bcbb`, doc-nalevering `118c798`, plus deze close-out. Spec: `docs/PUNT15-FASE2-BOUWDOC.md`. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30735818115>.
- **VLOEREN NU: vitest-totaal 878 over 68 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 863/68). CLIENT-only: `git diff --stat HEAD~1 -- packages/engine` leeg bij elke commit. Geen migratie, geen `wrangler`-commando, ook geen read. Lees de vloeren uit de suite; hardcode ze nooit.
- **NIET GEDEPLOYED, EN DAT IS EEN BESLUIT.** Onderhoud en FTP kantelen in geen enkele gemeten cel, dus een deploy toont Daan vandaag niets. Prod blijft op Worker Version `0f74912a-c40b-43ba-a2fe-0ee47f0636ed`; `0009` blijft de laatste remote migratie. Punt 15 FASE 1 staat óók nog niet live — die twee gaan samen mee aan het eind van fase 3.
- **WAT DAAN MERKT: NIETS, NU.** Wat hij gaat merken: zijn eigen PEAK begint op 2026-08-24 (`doelStart` 2026-06-29, cyclusweek 9). Daar ging de norm van 84 naar 56 tegen 70,0 werkminuten. ZONDER die correctie zou een EXACT volgens plan gereden Peak-week als NIET-GELEVERD hebben gelezen — en dat bevriest de dosis-trede, want die vraagt een geleverde uitvoering.
- **DE PREMISSE VAN PUNT 15 IS VOOR DE DERDE KEER GECORRIGEERD.** Eerst waren 39 en 46 doel-breed, toen bleken het weekvorm V1 in BUILD en was de norm 78 en niet 84; nu blijkt het tekort niet klim-specifiek maar DOEL-BREED EN FASE-GEBONDEN. Gemeten over 5 doelen x 3 fases x 9 weekvormen = 135 cellen: in Peak liggen FTP 9 van 9, Conditie 9 van 9, Korte beklimmingen 9 van 9 en Lange beklimmingen 7 van 9 onder de norm; in Base Conditie 9 van 9 en Lange beklimmingen 5 van 9; Onderhoud 0 van 27 in alle fases.
- **TERM 1 — DE NORM KENT HET FASE-QUOTUM.** `kwaliteitPerWeek.Peak` is 2 bij `ftp`, `conditie`, `klim_kort` en `klim_lang`, terwijl `blokDosisNorm` 3 prikkels rekende zodra `weekUren` >= `PRIKKEL_UREN_DREMPEL`: het plan kon zijn eigen meetlat per constructie niet halen. Op V1 in Peak valt bij zowel FTP als Korte beklimmingen dezelfde derde kwaliteitsdag weg. De Onderhoud-tak staat er letterlijk nog en is nu een speciaal geval van dezelfde regel. DE TERUGVAL IS DRAGEND: `kwaliteitPerWeek` kent geen Test-sleutel terwijl `computeMacroPhase` in week 12 "Test" teruggeeft — zonder terugval zet `Math.min(undefined, 3)` NaN op de kaart, en die val sloeg bij punt 9 fase A al een keer toe. Er staat een eigen test op.
- **TERM 2 — ER KOMT EEN EIS OP HET TOTAAL.** De poort van punt 14 is NIET aangeraakt; ernaast staat een tweede, ONAFHANKELIJKE eis dat de som van de werkminuten de totaalnorm haalt. Nodig omdat in 98 van de 105 cellen de som van de zone-normen BINNEN de poortset onder de totaalnorm lag en 24 van de 135 cellen GELEVERD lazen terwijl de week onder zijn eigen norm zat — scherpst Korte beklimmingen in Peak, effectieve eis 34 tegen 78. HERVERDELEN IS GEMETEN EN VERWORPEN: 92 geleverde cellen worden er 46 en Onderhoud zakt naar 18 van 27, want de poortset draagt NOMINALE labels terwijl `planZone5_` PROPORTIONEEL splitst. Minuten TELLEN lijdt daar niet aan.
- **ROOD PER TERM, MET EEN VONDST.** Term 1 teruggedraaid laat twee tests vallen: de directe quotum-assertie en "FTP in Peak kantelt niet" — dat tweede bewijst meteen dat FTP Peak zónder de correctie wél zou kantelen. Term 2, het veld zelf, laat de totaal-test vallen. Maar de CONJUNCTIE was eerst NERGENS rood: de fixture zakte óók op de zones, dus het per-zone-oordeel maskeerde de nieuwe eis. Er is een discriminerende test bijgekomen die de gepoorte zone exact haar norm geeft en verder niets, zodat alleen het totaal zakt.
- **DRIE AFWIJKINGEN, ALLE DRIE GEHOUDEN.** De keten-fixture zette `blokStart` gelijk aan `doelStart`, waardoor elk blok blokweek 1 en dus altijd Base was én de weken in het verleden lagen; drie cellen leken te kantelen. Zelf gevonden en gecorrigeerd vóór er een conclusie uit kwam. Test N uit punt 14 fase 1d pinde `geleverdOk` true vast en is herijkt op `zonesOpNorm` — zijn mechanisme is de POORT, en `geleverdOk` is sinds nu de conjunctie. En negen bestaande `buildBlokReferent`-fixtures kregen `doelStart: null`; dat is precies de compileerfout die het verplichte veld hoort af te dwingen.
- **VISUEEL NIET BEVESTIGD, EN NIET NAAR HET ANTWOORD TOE GESCHREVEN.** Het nieuwe kaart-element "totaal onder norm" komt in 0 van de 72 shots voor. Er is een Peak-scenario voor de klim-doelen gebouwd en na meting weer WEGGELATEN: het geval is niet te zaaien, want de GELEVERDE kant komt uit de activiteiten in de lokale D1 en daar bestaat geen API-schrijfroute voor. Daans echte ritten leveren in het beoordeelde blok 118 werkminuten tegen een Peak-norm van circa 53, dus de zones slagen én het totaal ruim. WAT DAAN MOET OPENEN: het Schema-scherm, de kaart BLOK · TERUGBLIK, de regel van een meegetelde week — zodra een week ál zijn voorgeschreven zones haalt maar in totaal onder de norm blijft, staat achter de datum in waarschuwkleur "totaal onder norm", naast de ongewijzigde n/n-teller.
- **OPENSTAAND, NIEUW.** Het PEAK-QUOTUM is door term 1 ONTTOETSBAAR geworden: de meetlat kan niet meer melden dat het plan in Peak zijn eigen norm niet haalt. En er is reden aan dat quotum te twijfelen — het commentaar boven `klim_kort` zegt dat 3 in Build ÉN Peak alle drie de elementen levert, en `DOELEN-SPEC` §3.1 noemt drie sleutelsessies vanaf vijf à zes uur zonder fase-clausule. Die tegenspraak stond er al; fase 2 haalt alleen de meetlat weg die hem kon melden. Hoort bij fase 3.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 15 FASE 3 uit `docs/ROADMAP.md` — de dosis zelf. ENGINE, dus eigen autorisatie, en er gaat een wat-als aan vooraf; de 5c-les staat. Drie brokken plus een vraag. (1) DE WERKMINUTEN PER KWALITEITSDAG: `klim_kort` 27,0 in Base, 23,0 in Build en 21,9 in Peak, tegen FTP 32,3 / 32,3 / 25,1 en `klim_lang` 36,0 / 27,5 / 25,1, bij een norm van 26 per prikkel. (2) DE VASTE TSS van `combo_long_with_efforts`: `Math.round(totaalMin * 0.85)` in plaats van `tssFromBlokken_`. (3) DE EFFORTS-BAND 85-92, die met haar midden op 88,5 nominaal `tempo` heet terwijl `DOELEN-SPEC` §3.3 voor dit doel BOVENDREMPEL vraagt. En de vraag: klopt het Peak-quotum van 2, of hoort het 3 te zijn? Verse chat.

**PUNT 15 FASE 1 IS AF — DE LANGE RIT MET EFFORTS DECLAREERT NU ZIJN ZONES (2 augustus 2026).** De twee klim-doelen zakten in Build en Peak ver onder hun norm, en de reden was niet te weinig dosis maar een sessie die haar dosis niet declareerde. Bouwdoc `2da42be` plus aanvulling `ec08a29`, bouw `6a5620d`, plus deze close-out. NIET GEDEPLOYED en dat is een besluit: bij doel FTP is de bouw per constructie inert, dus een deploy zou niets tonen. Prod ONVERANDERD op Worker Version `0f74912a-c40b-43ba-a2fe-0ee47f0636ed`; `0009` blijft de laatste remote migratie en er is geen enkel `wrangler`-commando gedraaid, ook geen read. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30732414109>.
- **VLOEREN NU: vitest-totaal 863 over 68 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 858/67). `git diff --stat HEAD~1 -- packages/engine` toont uitsluitend `packages/engine/src/planner.ts` met 32 regels, alleen toevoegingen. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN VANDAAG MERKT: NIETS.** `spreiding.effortsInLangeRit` staat alleen op `klim_kort` en `klim_lang`; `ftp`, `conditie` en `onderhoud` dragen false. Bij doel FTP kan de sessie niet voorkomen. Wat hij merkt zodra het doel naar korte beklimmingen gaat: de zaterdagsessie krijgt een zonebalk waar vandaag geen balk staat, en de gepland-kolom van de zone-vergelijking gaat van 0/0/0/0/0 naar 15/75/30/0/0.
- **DE WORTEL, GEMETEN.** `genericCombo` gaf voor `combo_long_with_efforts` geen `blokken` terug. De sessie draagt wel `intent.high` 30 en `zones` low plus high, maar `planZone5_` leest `blokken` — dus die dertig minuten waren onzichtbaar voor de zone-munt, en `werkzoneLabelsVan_` zag ze evenmin, waardoor de zone niet eens in de poortset van punt 14 belandde. UITPUTTEND over 5 doelen x 3 fases x 7 weekvormen, 480 sessies: 28 zonder blokken, ALLE `combo_long_with_efforts`, alle bij de twee klim-doelen, alle in Build en Peak, samen 840 gedeclareerde intent-high-minuten. 37 andere sjabloonnamen dragen hun blokken wel. Dit was de ENIGE kwaliteitsdragende sessie zonder blokken.
- **DE PREMISSE VAN PUNT 15 IS GEREPRODUCEERD EN OP TWEE PUNTEN GECORRIGEERD.** De 39 en 46 uit `docs/PUNT14-BOUWDOC.md` §3 zijn weekvorm V1 in fase BUILD: gemeten 38,5 en 46,0. De norm voor deze twee doelen is 78, niet 84 — 3 prikkels maal `KWALITEIT_MIN_PER_PRIKKEL_DEFAULT` 26; 84 is de FTP-norm. En het tekort is FASE-GEBONDEN, niet doel-breed: gemiddeld over de zeven weekvormen levert Korte beklimmingen in Base 85,0 en Lange beklimmingen 82,4, tegen 42,4 en 56,5 in Build en 20,0 en 27,4 in Peak.
- **NA DE BOUW, GEMETEN.** Build Korte beklimmingen 42,4 naar 72,4 · Lange beklimmingen 56,5 naar 86,5 · Peak Korte 20,0 naar 50,0 · Lange 27,4 naar 57,4. Exact 30,0 werkminuten per week erbij. BEGRENZINGSBEWIJS: van 106 gemeten regels bewegen er 28 en blijven er 78 ongewijzigd, en die 28 zijn precies de vier cellen waarin de arm vuurt. De as-metriek `intent.high` plus `intent.anaerobic` bewoog geen minuut — het PLAN veranderde niet, alleen wat het plan over zichzelf declareert.
- **DE ROOD-KANT REPRODUCEERT DE GEMETEN PREMISSE.** Met het veld `blokken` eruit vallen vier van de vijf tests en zakt de keten terug naar 38,54 — exact M1. Met de efforts-band op 65-75 en de array intact vallen er drie, waaronder de labels `['z2','z2','z2']` tegen `['tempo','tempo','tempo']`. Beide patches zijn op hun eigen markering gecontroleerd vóór het aflezen van de uitslag.
- **DE VERGELIJKINGS-CHIP KANTELT NIET, GEMETEN VOOR EN NA.** Op een perfect uitgevoerde zaterdag: `chipKind` op-plan, label "Op plan", score 100, `deviate` false — identiek aan beide kanten. Dat was de harde stop-conditie; alleen de plan-kolom bewoog. `weekvormAs.test.ts` en `onderhoudInvariance.test.ts` apart gedraaid en byte-identiek groen.
- **TWEE VOUWINGEN NAAST ELKAAR, GEEN DEFECT.** De zone-vergelijking vouwt op het NOMINALE label en geeft tempo 30; `planZone5_` splitst PROPORTIONEEL over de band 85-92 en geeft tempo 21,4 plus drempel 8,6. Beide bestonden al en dit is de eerste sessie waar ze naast elkaar zichtbaar worden. Genoteerd, niet gerepareerd.
- **NIET TOETSBAAR, EN DAT IS EEN GAT DAT BLIJFT STAAN.** De shot-harness seedt doel `"FTP"` (`tools/shots/shot.mjs:267`) en alleen de twee klim-profielen dragen de vlag, dus GEEN ENKEL scenario kan deze sessie tonen. De zonebalk is daarmee visueel onbevestigd. Breder: de hele klim-tak is visueel onverifieerd, en korte beklimmingen wordt half februari 2027 het actieve doel. Er is bewust geen scenario gebouwd in deze ronde.
- **DE WEEKPLAN-RIJ IS FORWARD-ONLY.** `buildWeekplanEntries` schrijft voortaan de array; bestaande rijen houden `blokken: null` en worden NIET gebackfilld. Voor al bewaarde weken blijft het oude beeld en de oude poortset staan. Dezelfde grens die de blok-terugblik al kent; geen migratie.
- **DE POORT VAN PUNT 14 KEERT HET OORDEEL OM IN PEAK, EN FASE 1 REPAREERT DAT NIET.** Korte beklimmingen leest daar 7 van de 7 weekvormen als GELEVERD, op 16,5 tot 31,0 werkminuten tegen een norm van 78: de poortset is uitsluitend `anaeroob`, norm 12 tegen geleverd 13,5, dus het enige wat beoordeeld wordt is precies de zone die klopt. Met de blokken erbij komt `tempo` in de poortset en blijft de uitkomst 7 van 7. Hoort bij fase 2.
- **OPENSTAAND, NIEUW.** De TSS van deze sessie is een vast tarief `Math.round(totaalMin * 0.85)` in plaats van `tssFromBlokken_`; bewust niet aangeraakt, want dat is een gedragswijziging die de wat-als niet meet. En `fixed` rekent drie intra-rusten terwijl `intent.low` er twee telt — 5 minuten verschil, uitsluitend in rust, raakt geen werkzone.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 15 FASE 2 uit `docs/ROADMAP.md` — de dosis van de twee klim-doelen, nu pas eerlijk meetbaar. Ook mét de blokken blijft Build Korte beklimmingen op 68,5 tegen 78 en Peak op 46,5 met maar 2 kwaliteitsdagen, en de poort-omkering in Peak staat nog. ENGINE, dus eigen autorisatie, en er gaat een wat-als aan vooraf — de 5c-les staat. Neem de harness-blindheid voor de klim-doelen mee als vooraf-eis: zonder klim-scenario is elke visuele controle op dit doel onmogelijk, en dat doel is over een half jaar actief. Verse chat.

**PUNT 14 IS AF — FASE 2 IS GEMETEN EN NIET GEBOUWD (1 augustus 2026).** Fase 2 stond open als ENGINE-werk met autorisatie-eis; de wat-als-meting die eraan voorafging wijst naar NIET BOUWEN. Docs-only ronde: geen code, geen engine, geen migratie, geen `wrangler`-commando en ook geen read. Prod ONVERANDERD op Worker Version `0f74912a-c40b-43ba-a2fe-0ee47f0636ed`; `0009` blijft de laatste remote migratie. Verdict: `docs/PUNT14-FASE2-VERDICT.md`.
- **VLOEREN NU: vitest-totaal 858 over 67 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN.** Docs-only, dus alle drie ongewijzigd. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app. Dit is een besluit om NIET te bouwen, en dat besluit hoort vastgelegd te zijn — anders wordt het over een half jaar opnieuw voorgesteld.
- **DE WAT-ALS, GEMETEN.** `goalWorkout_` de laatste TWEE intents laten ontwijken in plaats van de laatste een, zodat de derde soort gegarandeerd aan de beurt komt. Bij Onderhoud gaat de week op 7 van de 7 weekvormen achteruit: 87, 102, 102, 87, 80, 87 en 90 kwaliteitsminuten worden 71, 80, 71, 71, 65, 71 en 80, met de kwaliteitsdagen onveranderd op 3. En het BLOK-OORDEEL keert om: het plan gaat een anaeroob-label dragen, dat label opent de poort van fase 1, en de anaeroob-norm van 10 wordt in 2 van de 7 gehaald — een exact volgens plan gereden week leest van 7 van 7 geleverd naar 0 van 7. Dat is het defect van fase 1, opnieuw binnengehaald langs de PLAN-kant in plaats van de norm-kant.
- **DRIE MECHANISMEN, GEEN OMISSIE.** `GOAL_FASE_MOD_.Base` zet vo2 op -0,10 (0,20 wordt 0,10) · `vo2GateBase` onderdrukt de coverage-boost voor vo2 in Base tot en met `BASE_POLAR_VOL_U0` = 9 uur · `PROFILES.onderhoud.volumeResponse` is `{ vo2Slope: 0, vo2Cap: 0 }`, dus ook daarboven komt er niets bij. Plus `effectiveMacroFase_`, die `onderhoud` hard op "Base" pint: gemeten 14 van de 14 weken vanaf `doelStart` 2026-06-29.
- **TWEE PREMISSEN UIT FASE 1 GECORRIGEERD.** De gewichten SORTEREN en verdelen niet — `goalEffWeights_` normaliseert niet en `goalPickIntent_` sorteert alleen, dus "vo2 0,20 is een prikkel per twee weken" volgt nergens uit het mechanisme. En de derde soort is NIET per constructie onbereikbaar: bij Onderhoud in Peak (via een bevestigde event-overname) levert de week drempel, sweetspot én vo2, doordat het haalbaarheidsfilter vo2 van de lange dag weert en de coverage-boost van kant wisselt zodra high gedekt is.
- **DE VO2-DECLARATIE VAN `PROFILES.onderhoud` BLIJFT STAAN.** Ze is niet dood: in Peak scoort ze 0,20 plus 0,15 is 0,35 en komt ze aantoonbaar aan de beurt. Schrappen zou een levende term weghalen op grond van een meting die alleen Base beslaat.
- **WAT HIERMEE NIET BESLIST IS.** Gemeten is de RUIL-vorm, waarin de vo2-prikkel een kwaliteitsdag vervangt. De vorm die TOEVOEGT — sprints achter een Z2-rit, of een korte set na sweet-spot-werk — is niet gemeten en dus niet weerlegd. Nieuw ROADMAP-punt 16.
- **HET SJABLOON LAG ER AL, MET NUL PRODUCENTEN.** `combo_ss_sprints` heeft een volledige bouwer (2x15 min sweet spot plus 6x15s all-out), zonemap `["high","anaerobic"]` en een downgrade-regel; idem `combo_z2_vo2` en `combo_all_three`. GEVERIFIEERD met een grep op TOEKENNING: nul producenten in `packages/engine/src` en `apps/web/src`; de enige toekenning staat in `verlicht.test.ts:146`, waar `combo_all_three` met de hand als `voorgesteldType` wordt geïnjecteerd. Toevoegen aan de archetype-bibliotheek lost het NIET op: die 35 worden per constructie op een KWALITEITSSLOT getrokken, dus dat is opnieuw een ruil. En de norm moet mee — een anaeroob label opent een norm van 10 minuten tegen een prikkel van 1,5.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 15 uit `docs/ROADMAP.md` — de dosis van de twee klim-doelen. Korte beklimmingen levert 39 werkminuten en Lange beklimmingen 46 tegen een norm van 84; dat is een DOSIS-vraag, geen verdelings-vraag. HARDE DATUM: korte beklimmingen wordt half februari 2027 het actieve doel. ENGINE, dus autorisatie is nodig en er gaat een meting aan vooraf. Verse chat.

**PUNT 14 FASE 1 IS AF — DE BLOK-TERUGBLIK OORDEELT ALLEEN OVER ZONES DIE HET PLAN VROEG (1 augustus 2026).** De norm vroeg zones die het plan niet programmeert, dus een blok dat EXACT volgens plan gereden was kon "niet geleverd" heten. De norm is niet aangeraakt; wat veranderde is WIE eraan meedoet. Vier bouwrondes: fase 1 (doc `a2e1a93`, bouw `0622c21`), 1b (`dc54c25`, `39a99c8`), 1c (`defa301`, `2a86580`), 1d (`1c84c0a`, `ddd7543`), plus deze close-out en de deploy die er direct op volgt. LIVE op prod sinds Worker Version `0f74912a-c40b-43ba-a2fe-0ee47f0636ed`, gebouwd van `8ae30c8`; `0009` blijft de laatste remote migratie, er is er geen bijgekomen en er is geen enkel `wrangler d1`-commando gedraaid. Spec: `docs/PUNT14-BOUWDOC.md`.
- **VLOEREN NU: vitest-totaal 858 over 67 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 844/66 en 1449). Client-only; `git diff --stat HEAD~1 -- packages/engine` leeg bij ELKE bouw-commit. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT.** Het blok 29-06 t/m 20-07 leest niet meer als geleverd. De kaart gaat op `v7` van 1/1, 0/1 en 1/1 met poort VO2max naar 1/2, 0/1 en 2/2 met drempel erin. Drempel 37/47 en 21/47 staan in waarschuwkleur; Tempo 58/— staat neutraal met een streepje, want die zone is niet beoordeeld. De coach zegt nu dat Drempel onder norm bleef terwijl een andere zone juist overhield, en de dosisverhoging-kaart is WEG.
- **DE WORTEL, GEMETEN.** De derde kwaliteitssoort is onbereikbaar: `goalWorkout_` ontwijkt alleen de VORIGE intent, dus de rotatie loopt over de bovenste twee. Uitputtend over 10800 combinaties: 0 keer drie soorten. Het plan programmeert nul anaerobe minuten in 27 van de 35 cellen. Vier norm-vormen doorgerekend — bibliotheek-breed, doel-gewogen, doel-plus-fase-gewogen, en exact de twee geroteerde intents — en alle vier leveren 1 van de 35. Mét de nominale poort: 22 van de 35. Herwegen lost het dus niet op; het zit in welke zones MEEDOEN.
- **EEN POORT KAN HET OORDEEL OMKEREN, NIET ALLEEN AFZWAKKEN.** Gemeten op prod in de 1c-staat: `geleverd=true`, `poort=["tempo"]`, drie van drie weken op norm — terwijl drempel op 37, 21 en 35 stond tegen 47 en tempo op 58, 68 en 67 tegen 24. De DELOADWEEK was als enige bewaarde week de bron van de poort, en die poortte precies de zone met het overschot. Sinds 1d levert hij geen bewijs meer, en onder `BLOK_MIN_BEOORDEELBARE_WEKEN` opbouwweken met een bewaard plan zwijgt de terugblik.
- **OP PROD ZWIJGT DE KAART NU — GEMETEN NA DE DEPLOY, read-only.** `doelStart` 2026-06-29 en weekmaandag 2026-07-27 geven blokweek 1, dus het VENSTER bestaat en het beoordeelde blok is 29-06 t/m 20-07. Maar geen enkele OPBOUWWEEK daarvan draagt een bewaard plan — prod heeft alleen rijen voor 2026-07-20 (de deloadweek) en 2026-07-27 — en sinds 1d levert de deloadweek geen bewijs. Poort leeg, `poortHerkomst` "geen", kaart stil. Dat is de bedoelde uitkomst en beter dan het oude "geleverd", maar het betekent dat Daan de gecorrigeerde kaart nu NIET ziet: de 1/2-, 0/1- en 2/2-regels hierboven komen uit het `v7`-scenario van de harness. Wat hij WEL merkt is dat de dosisverhoging-kaart weg is (0 van de 8 prod-shots). De kaart komt terug zodra twee opbouwweken van een beoordeeld blok een bewaard plan dragen; het blok dat op 2026-07-27 begint is het eerste dat dat kan halen.
- **BEKENDE GRENS, PERMANENT.** Weekplan-rijen bestaan pas sinds `fbbc292` van 2026-07-19 en worden NIET gebackfilld. Over een blok dat volledig vóór die datum ligt zwijgt de terugblik voorgoed. Vanaf het blok dat op 2026-07-27 begint is er genoeg bewijs. Op prod dekt een bewaarde rij wél de hele week: 4 dag-entries tegenover 4 trainbare planner-dagen, tot en met zaterdag.
- **BEKENDE GRENS, HARNESS.** De shots kunnen het ZWIJGEN niet meer tonen — de seed zaait in elk van de acht scenario's genoeg bewijs, dus alle 64 shots dragen de kaart. Dat is gedekt door de tests K en M, niet door het beeld.
- **OPENSTAAND, NIEUW.** Punt 14 FASE 2 (ENGINE, autorisatie NIET gegeven): het Onderhoud-profiel declareert vo2 0,20 bij drie kwaliteitsdagen — ruwweg één prikkel per twee weken — en de rotatie gooit dat weg. Eerst een wat-als-meting; de 5c-les staat. En punt 15: Korte beklimmingen levert 39 werkminuten en Lange beklimmingen 46 tegen een norm van 84 — een DOSIS-vraag, geen verdelings-vraag. Korte beklimmingen heeft een harde datum in februari 2027.
- **OPENSTAAND, ONGEWIJZIGD.** Fase B DEEL 2 van punt 10 · `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 14 FASE 2 uit `docs/ROADMAP.md` — de vo2-slotverdeling. Dat is het eerstvolgende open punt in de volgorde en het is ENGINE, dus autorisatie is nodig en er gaat een wat-als-meting aan vooraf: de 5c-les staat, de opgeruimde inhaal-kaart stelde in 60 van 72 cellen een LICHTERE week voor. De vraag die eerst beslecht moet worden is of de rotatie gerepareerd hoort te worden of dat de vo2-declaratie van het Onderhoud-profiel zelf fout is. Verse chat.

**PUNT 10 FASE B DEEL 1 IS AF — DE WEEK HEEFT NU EEN STEM, EN ALLEEN ALS ER IETS WEG IS (1 augustus 2026).** Fase A gaf het BLOK één stem; deze bouw geeft de WEEK er een. Hij spreekt alleen als een sleutelprikkel verstreken is én er deze week geen trainingsdag meer staat om hem op te pakken. NIET gedeployed: prod draait nog Worker Version `be15bb67-fca6-4272-aeec-cd2b187c752c`, `0009` blijft de laatste remote migratie. Bouwdoc `5a977fd`, bouw `130ab6c`, nalevering `cd194d9`, plus deze close-out.
- **VLOEREN NU: vitest-totaal 844 over 66 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 825/65 en 1449). Client-only; `git diff --stat HEAD~1 -- packages/engine` leeg bij beide bouw-commits. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT.** Is een sleutelprikkel verstreken en staat er deze week geen trainingsdag meer om hem op te pakken, dan zegt de app dat mét twee getallen erbij: wat het plan op de VERSTREKEN dagen vroeg en wat er gereden is, per zone. Anders zwijgt hij — op maandag per constructie, want dan is er geen verstreken dag. Het dagblok van punt 5b zegt nog steeds WAAR de prikkel staat zolang hij er nog staat; de regel "deze week staat er geen trainingsdag meer om 'm op te pakken" is daar WEG en zit nu in de weekstem, met getallen in plaats van zonder.
- **WAAROM DE WEEK TEGEN HET PLAN MEET EN NIET TEGEN DE NORM.** Drie metingen, `docs/PUNT10-FASE-B-BOUWDOC.md` §1. Over 105 cellen haalt het GERENDERDE PLAN zelf alle drie de zone-normen in 2 van de 105. Op de ECHTE reeks: 3 van de 46 beoordeelbare weken. Het mechanisme zit in de POPULATIE, niet in de vouwing — norm en weekplan gaan door DEZELFDE functie (`planZone5_`), maar de norm-vorm komt uit `bibliotheekSignatuur` over alle 35 archetypes terwijl een week er een handvol trekt. Een norm-gebaseerde weekstem zou dus in 43 van de 46 weken een tekort melden in zones die het plan die week nooit vroeg.
- **GEEN ENKELE NIEUWE CONSTANTE.** De drie poorten zijn STRUCTUREEL: ze hangen aan de sleutel-machinerie van punt 5b, die al gemeten is. Er valt hier niets te ijken en er is geen plateau-toets nodig — dat is opzet, geen omissie. Ook de zone-label-poort uit de nalevering is er geen: die weert BANDOVERLOOP uit de proportionele splitsing, niet een klein tekort. Een zone die het plan wél voorschreef telt mee hoe klein het tekort ook is.
- **ROOD PER TERM, GEMETEN.** Sleutel-poort → de POORT 1-test; lege-restlijst → POORT 2; dekking → POORT 3; de per-zone-rekenterm → 6 tests. De zone-label-poort → 1 test, terwijl de tegenproef (een voorgeschreven zone telt mee bij een tekort van één minuut) juist groen blijft. OPRUIM-ROOD: met de weekstem-render eruit levert `openSleutelDagen` een lege lijst, rendert `SleutelInhaalBlok` null, en staat er NERGENS meer een zin over de weggevallen prikkel — alleen de dagkaart "MA 27 · NIET GEREDEN".
- **BEGRENZINGSBEWIJS.** Bij de bouw 56 van de 64 shots byte- ÉN sha256-identiek, bij de nalevering opnieuw 56; de acht die telkens bewogen zijn alle `v7-weekstem`. De zin ging van "1 Tempo-minuut waarvan je er 0 reed, en 21 Drempel-minuten waarvan je er 0 reed" naar "21 Drempel-minuten waarvan je er 0 reed".
- **NIEUW SCENARIO IN DE SHOT-HARNESS: `v7-weekstem`.** Klok op donderdag, trainingsdagen alleen op maandag en dinsdag. Die twee zijn dus verstreken en ongereden — een gemiste sleutelsessie — en er staat geen trainingsdag meer die de prikkel kan dragen. Geen bestaand scenario droeg die combinatie: ze hebben allemaal een weekenddag vooruit.
- **OPENSTAAND, NIEUW.** Fase B DEEL 2: het aanbod "verschuif deze week de minuten naar Drempel" raakt de ALLOCATOR, dus ENGINE met eigen autorisatie en eerst een wat-als-meting — de 5c-les staat, de opgeruimde inhaal-kaart stelde in 60 van 72 cellen een LICHTERE week voor. En punt 10 fase A én B staan allebei nog NIET live.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de copy van het sleutel-inhaalblok, de overname-kaart en nu ook de weekstem wachten op de gezamenlijke coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 14 uit `docs/ROADMAP.md` — de anaeroob-term van de per-zone-norm. Dit gaat VÓÓR de rest van de reeks, en de reden is een datum: een doelwissel naar Onderhoud kan er binnen weken zijn, en dan oordeelt de blok-terugblik "niet geleverd" over een blok dat EXACT volgens plan gereden is. GEMETEN over 21 cellen: bij Onderhoud programmeert het plan 0 anaerobe minuten tegen een blok-norm van 30, in 6 van de 6 cellen. Eerst meten, dan bouwen — de vraag is of de norm-VORM fout is of dat Onderhoud anaeroob werk hoort te programmeren. Verse chat.

**PUNT 10 FASE A IS AF — HET BLOK HEEFT NOG ÉÉN STEM (1 augustus 2026).** De doortrain-kaart en de blok-terugblik deden allebei een uitspraak over hetzelfde blok, uit hetzelfde getal. De kaart doet dat niet meer. NIET gedeployed: prod draait nog Worker Version `be15bb67-fca6-4272-aeec-cd2b187c752c`, `0009` blijft de laatste remote migratie. Bouwdoc `da17b1b`, bouw `58e12aa`, plus deze close-out. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30684494752>.
- **VLOEREN NU: vitest-totaal 825 over 65 bestanden · engine-selftest-assert-count 1449 ONBEWOGEN** (van 821/64). Client-only; `git diff --stat HEAD~1 -- packages/engine` leeg. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT.** In blokweek 4 staat de terugblik nu EERST, met zijn eigen oordeel, en hangt het doortrain-aanbod eronder. Dat aanbod zegt alleen nog wat het DEZE WEEK doet; de zin over de CTL en "het blok heeft je niet belast" zijn weg. Knoppen en werking — mesoweek 4 naar 1 — ongewijzigd.
- **DE TEGENSPRAAK IS GEMETEN, NIET AANGENOMEN.** Op 2026-07-20 — blokweek 4, ΔCTL −4,9, en beide kaarten op een IDENTIEK anker — stonden twee zinnen samen op één scherm die elkaar tegenspreken: de terugblik "Je trainde dit blok genoeg, maar niet waar het telt: Drempel bleef onder norm" tegenover de doortrain-kaart "het blok heeft je niet belast". `buildBlokReferent` op de gecommitte dump `docs/DOSIS-MUNT-MEETDATA.md` Q4 geeft 0 van 3 opbouwweken op norm, tekortzone Drempel, verschuiving waar. Over alle vier de blokfases op de reeks uit `docs/DOORTRAIN-KAART-RECON.md` §4: 17 blokweek-4-maandagen, waarvan er 7 door de ΔCTL-poort komen terwijl de terugblik rendert.
- **WAAROM DE KAART HAAR UITSPRAAK VERLIEST EN HAAR AANBOD HOUDT.** Sinds punt 6 bestaat er een oordeel PER ZONE dat "genoeg getraind, verkeerde zone" kan zien; ΔCTL alleen kan dat per constructie niet — het is één getal over alle belasting samen en kent geen zones. De grovere meter deed dus de stelligste uitspraak. Daan-besluit: een deload weggeven aan een blok dat geen belasting opbouwde is detraining op detraining, dus het AANBOD blijft staan. Wat verdwijnt is de tweede stem.
- **GELEVERD.** Nieuwe pure module `apps/web/src/lib/fatigueStem.ts` met `fatigueAanbodRegel`; `FatigueCard` krijgt `terugblikOpScherm` en bouwt zijn regel daar; `SchemaView` rendert de kaart NA `BlokReviewCard` zodra er een terugblik is. GEEN nieuwe copy-strings — beide narrative-functies droegen die tak al — en `coachNarrative.ts` is ongemoeid. Eén call-site: `FatigueCard.tsx:136`.
- **ROOD PER TERM.** Term teruggedraaid: 3 van de 4 asserties vallen. De vierde blijft groen omdat die juist de tak MÉT de CTL-zin toetst — dat is de controle, geen gat.
- **BEGRENZINGSBEWIJS.** 48 van de 56 shots byte- ÉN sha256-identiek; de acht die bewegen zijn alle `v7-blokweek4`, het enige scenario waar het aanbod vuurt.
- **EEN NULMETING TEGEN EEN KOUDE VITE IS GEEN NULMETING.** De eerste run gaf 40 van de 40 gewijzigd, met byte-sprongen van 142k naar 244k — puur omdat de eerste transform nog liep. Overgedaan met een weggegooide warmloop, en de VOOR-staat gezet met `git checkout da17b1b --` op de twee gewijzigde componenten. CC-vondst; staat nu als les in `docs/WERKWIJZE.md`.
- **OPENSTAAND, NIEUW.** Het aanbod "verschuif deze week de minuten naar Drempel" hoort bij fase B en raakt de allocator. En in blokweek 1 lopen de twee ΔCTL-VENSTERS nog uiteen — anker weekmaandag tegenover maandag min zeven, op een golvende reeks tot 11,2 uit elkaar en van teken verschillend — maar de DOWN-tak vuurde nul keer op de gemeten reeks. Genoteerd, niet gebouwd.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl de week vordert · `404 /api/checkin/<datum>` nog niet afgevoerd · punt 8 nog niet visueel bevestigd op prod · de copy van het sleutel-inhaalblok en van de overname-kaart wachten op de gezamenlijke coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 10 FASE B uit `docs/ROADMAP.md` — de week-tekort-stem: wat de coach zegt als een week zijn dosis niet levert. Voorwaarde die er al ligt: het tekort wordt PER ZONE geteld in de munt van punt 6, niet in de 3-bucket-vouwing. GEMETEN dat de data er al is maar maar in twee van de vier weken wordt berekend: `buildBlokReferent` heeft precies één call-site, binnen `buildBlokReview`, en dat venster bestaat alleen in blokweek 4 en 1; de lopende week draagt bovendien `telt = false`. Let op de 5c-les: de opgeruimde inhaal-kaart stelde in 60 van 72 cellen een LICHTERE week voor. CLIENT. Verse chat.

**PUNT 9 IS AF — DE EVENT-OVERNAME IS EEN VOORSTEL, EN HET STAAT LIVE (1 augustus 2026).** Tot deze
ronde kantelde de fase op de acht-wekengrens automatisch naar het event. Nu VRAAGT de app het, en
het ingestelde doel blijft sturen tot Daan bevestigt. Prod NU Worker Version
`be15bb67-fca6-4272-aeec-cd2b187c752c`, gebouwd vanaf `0c9f32a` (was
`1e29e9de-8533-4931-99e1-2d55613ac691`, drie punten oud). 3 assets vervangen (`/index.html`,
`/sw.js`, `/assets/index-CQQJuUKO.js`), 63 ongewijzigd, 315,91 KiB. Migratie `0009_amusing_mordo.sql`
REMOTE toegepast, strikt vóór de deploy; `0009` is nu de laatste remote. Bouwdoc `2a389b6`, bouw
`852a3ba` (data plus worker) en `fc8fdc4` (engine plus client), nalevering `0c9f32a`, plus deze
close-out.
- **VLOEREN NU: vitest-totaal 821 over 64 bestanden · engine-selftest-assert-count 1449** (van
  793/62 en 1435), beide afgelezen uit de suite. Lees ze uit de suite; hardcode ze nooit.
- **WAT DAAN MERKT.** Op de acht-wekengrens — voor AGR is dat zaterdag 2027-02-20 — verschijnt een
  kaart met twee knoppen. Ja: het plan mikt op het event. Nee: zijn blok loopt door en de vraag komt
  nog één keer terug op de volgende blokgrens (2027-03-08), daarna niet meer. GEMETEN wat "nee"
  betekent: een FTP-testweek op 2027-03-01, vijf weken vóór AGR. De TAPERWEEK van 2027-04-12 komt er
  bij BEIDE antwoorden — die overlay hangt per dag aan een nabij event, niet aan de macro-as.
- **DE OVERNAME VERANDERT ALLEEN DE FASE-AS, NIET HET DOEL.** Geen zesde optie in `DOEL_OPTIONS`,
  geen zesde profiel. Het doel bepaalt wát er gereden wordt, het event de opbouw ernaartoe.
- **GELEVERD.** `effectiveMacroFase_` kreeg een vijfde, optionele `overnameBevestigd` — strikt op
  `=== true`, dus een vergeten argument valt naar de veilige kant. De Onderhoud-tak vergelijkt nu op
  `profileForDoel_(...).id === "onderhoud"` in plaats van op de UI-string (het derde open punt van
  fase A, hiermee gesloten). Drie kolommen op `sync_state`, met de EVENT-DATUM als identiteit omdat
  `EventItem` geen id draagt en `PUT /api/events` full-replace is. Nieuwe poort
  `apps/web/src/lib/eventOvername.ts`, kaart `EventOvernameCard.tsx`, en de vlag door BEIDE ketens:
  `proposal.ts` (het plan) én `faseOvergang.ts` (de aankondiging).
- **HET VIERDE OPEN PUNT VAN FASE A IS GESLOTEN, GEMETEN EN NIET AANGENOMEN.** De 15-dagen-grens in
  `daysToTaper` is via de echte aanroepketen ONBEREIKBAAR, aan beide kanten. 8556 runs van
  `buildWeekProposal` met een geïnstrumenteerde bundel: engine-tak bereik −1..7 over 1840 treffers,
  client-tak 1..13 over 1932, grens 14, NUL treffers ≥ 14. De engine-rood-test bewijst het CONTRACT
  van `assignWorkouts` bij handgezette invoer, niet de bereikbaarheid via de app. Geen bouw nodig;
  de `Math.round`-correctie blijft staan als consistentie-reparatie.
- **HET BEELD VOND WAT 818 TESTS NIET VONDEN.** `proposal.ts` liet de event-overlay ONVOORWAARDELIJK
  winnen voor de toonbare fase, dus de balk toonde "Build" boven een kaart die "deze week Base" zei —
  twee uitspraken over dezelfde week op één scherm. `faseOvergang.ts` droeg die guard al sinds fase A;
  deze plek was toen gemist. Een halve fix, gevonden door de PNG en niet door de suite. Gerepareerd
  met een assertie dat balk en plan gelijk lopen.
- **EEN AFGEWEZEN OVERNAME NAM HERSTEL AF — GEREPAREERD IN `0c9f32a`.** De bevestigingspoort lag ook
  over `Recovery`. GEMETEN met een A-race op 2027-04-15 en peildag 2027-04-16, overname afgewezen:
  `proposal.ts` gaf `Build` aan `assignWorkouts` terwijl de overlay-guard `Recovery` toonde — een
  opbouwweek onder een herstel-kop, twee dagen na de race. `Recovery` staat nu vóór de event-tak en
  hangt niet aan de bevestiging: de poort gaat over de periodiserings-AS, en herstel is een
  constatering over een gereden rit, dezelfde categorie als de taper. De taperdekking bleek al te
  bestaan (die test draait zonder de vlag en is dus per definitie het afgewezen geval); daar is alleen
  een commentaarregel bij gezet.
- **NIEUW IN DE REEKS: PUNT 13, HET HERSTEL NA HET EVENT.** De maandag ná de raceweek levert de
  doel-cyclus weer Build; de `Recovery`-tak van `eventFase_` kijkt alleen binnen de huidige week. Dat
  staat nu in een assertie die expliciet zegt dat hij de huidige toestand PINT en niet beweert dat hij
  goed is. Hoort samen met de vraag om een nieuw doel na het event.
- **WAARNEMING, NOG GEEN CONCLUSIE.** Alle acht prod-shots gaven `errors=0`: de `404 /api/checkin/<datum>`
  die er de vorige rondes stond, is er nu niet. Blijft OPENSTAAND — één schone run onderscheidt
  "opgelost" niet van "die dag stond er een check-in". Toets het op een dag zonder check-in vóór je
  hem afvoert.
- **NIET VISUEEL BEVESTIGD: PUNT 8 OP PROD.** De shot-harness laadt uitsluitend `/schema`, dus de
  Niveau-tab valt buiten het beeld. Daan opent de kaart "Doel-gereedheid": bij doel FTP hoort daar
  "FTP" te staan met "opbouw naar FTP-test", NIET de girona-lat.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · de gepland-noemer verschuift terwijl
  de week vordert · de copy van het sleutel-inhaalblok en van de overname-kaart wachten op de
  gezamenlijke coach-copy-ronde.

FOCUS VOLGENDE CHAT: punt 10 uit `docs/ROADMAP.md` — twee kaarten spreken los over hetzelfde blok, en
dat punt draagt sinds 5c ook de week-tekort-vraag. Voorwaarde die er al ligt: het tekort wordt PER
ZONE geteld in de munt van punt 6, niet in de 3-bucket-vouwing. CLIENT. Verse chat.

**PUNT 9 FASE A IS AF — HET DOEL STUURT DE FASE; PUNT 9 ZELF BLIJFT OPEN (31 juli 2026).** Tot deze ronde nam de event-teller het hele jaar over: met een A-race in de agenda stuurde het ingestelde doel de fase NOOIT. Nu leidt het doel tot acht weken vóór het hoofdevent. Wat er nog NIET is, en waarom het punt open blijft: de overname is een automatische omslag op die grens, geen VOORSTEL met een afwijs-tik. Dat voorstel is fase B en is het eigenlijke criterium. Bouw `c28ee22` (fase A), `b4eca14` en `9a2c63c` (nazorg), spec `10cf3d8`, plus deze close-out. NIET gedeployed: prod draait nog Worker Version `1e29e9de-8533-4931-99e1-2d55613ac691`, `0008` blijft de laatste remote migratie.
- **VLOEREN NU: vitest-totaal 793 over 62 bestanden · engine-selftest-assert-count 1435** (van 788/62 en 1408), beide afgelezen uit de suite; de selftest draagt zijn telling in de testnaam. Lees ze uit de suite; hardcode ze nooit.
- **VASTGELEGD DEZE RONDE: `DOELEN-SPEC` §2B.** Het doel leidt; een event verder weg dan acht weken verandert fase noch doel. De overname begint op acht weken en is een VOORSTEL, geen aftelling. Het doel-blok is twaalf weken en HERHAALT — loopt het af zonder nieuw doel, dan begint een volgend blok met hetzelfde doel; een aflopend blok geeft het jaar dus niet aan het event. Dit besluit was meermaals in chats gegeven en nooit vastgelegd; nu is het een `git diff`.
- **GELEVERD.** De doel-blokteller is cyclisch 1..12 met een nieuw `blokNr`-veld; hij liep voorheen dood op "Test" met quotum 0, want `kwaliteitPerWeek` kent geen Test-sleutel. `effectiveMacroFase_` is verbreed van "alleen Onderhoud, alleen zonder event" naar "elk doel, tot de acht-wekengrens", met `EVENT_OVERNAME_WEKEN` = 8 als BELEID-constante. En vier dag- en weektellers staan op hetzelfde DST-veilige patroon: `Math.round` op het DAGverschil, daarna pas delen — `computeMacroPhase`, `weekIndexFromStart_`, `blokWeekVanWeek` en `daysToTaper` aan beide kanten.
- **WAT DIT VOOR DAAN BETEKENT: DE BLOK-START BLIJFT OP 2026-06-29.** Doel FTP zit daarmee NU in Build; Peak begint 2026-08-24, de testweek valt op 2026-09-14, en daarna start blok 2 weer op Base. Vóór deze ronde stond de fase van augustus tot de overname onafgebroken op Base.

**PUNT 9 FASE B — DE VIER OPEN PUNTEN.**
- **DE OVERNAME-KAART ALS VOORSTEL.** Op de acht-wekengrens hoort de app te VRAGEN of het doel meegaat naar het event-doel, met een afwijs-tik; het ingestelde doel blijft staan tot Daan bevestigt. Het antwoord moet worden bewaard, naar het model van `fatigue_shift` en de dosis-trede. Dit is het criterium van punt 9 en het enige wat het punt nog open houdt.
- **NA HET EVENT VOLGT GEEN HERSTELWEEK.** GEMETEN: de maandag ná het hoofdevent (2027-04-19) levert de doel-cyclus meteen weer Build. Dat hoort bij dezelfde kaart — na het event komt de vraag om een nieuw doel, en het herstel daarna is hetzelfde gat.
- **DE ONDERHOUD-TAK VERGELIJKT OP EEN UI-STRING.** `effectiveMacroFase_` takt op `=== "Onderhoud"`. Dat hoort op de profiel-id te vergelijken, zodat `normalizeDoel_` daar DRAAGT in plaats van meeloopt. GEMETEN in de bouw: haal die normalisatie nu weg en de hele suite blijft groen, want geen enkele legacy-string mapt op Onderhoud. De normalisatie staat er vandaag dus voor consistentie, niet omdat ze iets afvangt.
- **NIET GEMETEN — DE BEREIKBAARHEID VAN DE 15-DAGEN-GRENS AAN DE ENGINE-KANT.** Voor `daysToTaper` is de CLIENT-kant gemeten en ONBEREIKBAAR: `taperEvent` bestaat alleen binnen zeven dagen van vandaag en de weekmaandag ligt hoogstens zes dagen terug, dus de waarde komt niet boven 13 terwijl de grens op 14 ligt. Of de engine-kant die grens via de ECHTE aanroepketen wél haalt is NIET gemeten; de rood-test daar draait op met de hand samengestelde invoer voor `assignWorkouts`. Behandel die assertie dus niet als bewijs van bereikbaarheid tot dat gemeten is.

FOCUS VOLGENDE CHAT: punt 9 FASE B uit `docs/ROADMAP.md` — de overname-kaart als voorstel met een afwijs-tik, plus de persistentie van dat antwoord. CLIENT plus DATA, dus een migratie ligt in de rede; autorisatie is nog NIET gegeven. Verse chat.

**PUNT 8 IS AF — ELK DOEL HEEFT NU ZIJN EIGEN MEETLAT (31 juli 2026).** Tot deze bouw gold de girona-lat voor ÉLK niet-FTP-doel: wie op Onderhoud stond kreeg letterlijk "Girona · ~90 km · 1200 hm/dag · lange klimmen" te zien. `GOAL_PROFILES_` draagt nu vijf latten. Spec-correctie `7c372c0`, bouw `3651fc1`, plus deze close-out. NIET gedeployed: prod draait nog Worker Version `1e29e9de-8533-4931-99e1-2d55613ac691`, `0008` blijft de laatste remote migratie en er is er geen bijgekomen.
- **VLOEREN NU: vitest-totaal 788 over 62 bestanden · engine-selftest-assert-count 1408** (van 781/62 en 1384), beide afgelezen uit de suite; de selftest draagt zijn telling in de testnaam. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30622257017>. Lees ze uit de suite; hardcode ze nooit.
- **DE VIJF LATTEN.** `ftp` ongemoeid, geen letter. `girona` is `klim_lang` geworden met ONGEWIJZIGDE dims — dat profiel WAS de lange-klimmen-lat, het droeg alleen een reis als naam. `klim_kort` erft die dims met één verschil: longRideH 5,0 in plaats van 4,0 (PLAN, `DOELEN-SPEC` §3.3 KETEN (iii) — de lange rit groeit naar vier à vijf uur). `conditie` erft ze ZONDER de klim-dim (PLAN, §3.5: de bestemming van dat doel is een durability-getal, geen FTP).
- **`onderhoud` DRAAGT GEEN CONSTANTE TARGET MAAR ÉÉN AFGELEIDE BEHOUD-VLOER:** 95 procent van de rollende FTP vlak vóór `settings.doelStart`. Aan BEIDE kanten `rolling_ftp` en in WATT — vandaar een VIERDE meetgrootheid `rollingFtpW` naast `ftpWkg`, `ctl` en `longRideH`. Dat is niet cosmetisch: `ftpWkg` staat op `settings.ftp`, een handmatig veld waarvan de auto-update-kolom nul lezers heeft, terwijl de vloer uit de RITTEN komt. Die twee tegen elkaar zetten had een kaart opgeleverd die de hele periode groen staat op een ingetypt getal.
- **GEBRUIKSVOORWAARDE — BIJ EEN DOELWISSEL NAAR ONDERHOUD MOET `doelStart` MEE.** De vloer ankert op dat veld (UI-label "Blok-start"). Blijft het op de datum van een vórige periode staan, dan meet de vloer tegen de instapwaarde van die periode en klopt de uitspraak niet. Geen nieuw veld en geen migratie — wel iets dat je bij het wisselen moet doen.
- **DE TWEE MAPPINGS ZIJN GELIJKGETROKKEN.** `activeGoalProfile_` gaat nu door `normalizeDoel_` — het was de laatste doel-lezer die dat niet deed. `GOAL_PROFILES_` heeft exact de sleutels van `PROFILES`, `projectieKey` is verwijderd (twee schrijvers, nul lezers; aansluiten zou de ring archetypes → coach → niveau sluiten), en één selftest-lus over `DOEL_OPTIONS` plus de legacy-strings `Beklimmingen` en `VO2max` houdt profiel-sleutel en lat-sleutel mechanisch gelijk.
- **DERDE PROJECTIEMODUS `behoud`** verbergt de uren-schuif, de projectie en de lege-staat-copy. Een behoud-doel bouwt niet op, en het draagt per `DOELEN-SPEC` §3.2 geen ctl-dim ("NIET CTL — die hoort te dalen"), dus dat blok viel anders terug op de copy over onvoldoende recente ritten — onwaar, want de ritten zijn er en het doel is bekend.
- **DE ONDERBOUWING VAN DE 5 PROCENT EN DE INVOER-VONDST** staan in `docs/DOEL-LIJST-RECON.md` §8, correctieblok van 31-07-2026. Kort: de vloer is BELEID plus instrument-resolutie, geen geijkte drempel, en bovengrens-gecheckt op de echte reeks — over elk venster van twaalf weken is de diepste dip 95,7 procent, dus hij vuurt daar geen enkele keer. Dat is de bedoeling: behoud hoort de normale uitkomst te zijn.
- **BEKEND GAT — DAT DE BEHOUD-MODUS HET UREN-BLOK ECHT VERBERGT IS DOOR GEEN TEST GEDEKT.** De rood-test van die term is een STRING-assertie op `projectieMode`, dus op de PRODUCENT, niet op het renderen. `apps/web` heeft geen render-testinfrastructuur (`@testing-library` ontbreekt) en die bouwen viel buiten de bouw-prompt. De poort is met de hand geverifieerd door code-lezen — hij omsluit het blok vanaf de uren-sectie tot en met de lege-staat-copy — maar een latere verplaatsing van die grens zou STIL zijn: niets wordt dan rood. Op te pakken zodra `apps/web` voor het eerst render-tests nodig heeft.
- **OPENSTAAND — VISUELE VERIFICATIE IS NIET GEDAAN.** De Niveau-tab zit niet in de shot-harness; die laadt uitsluitend `/schema`. Na de eerstvolgende deploy: open de Niveau-tab en kijk naar de kaart "Doel-gereedheid". Bij doel Onderhoud hoort daar ÉÉN rij te staan, "Behoud-vloer" met subtekst "watt · rollende FTP", een waarde in hele watts tegen een vloer, en daaronder GEEN uren-schuif en GEEN projectiegrafiek. Bij de andere vier doelen hoort die schuif er juist wél te staan, en noemt de kop het doel in plaats van "Girona".
- **OPENSTAAND, ONGEWIJZIGD.** De Instellingen-Segmented met vijf doelen is nog niet visueel gecontroleerd · de visuele check op de echte pendeldag · de gepland-noemer zakt op de dag zelf · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>`.

FOCUS VOLGENDE CHAT: punt 9 uit `docs/ROADMAP.md` — het doel stuurt de periodisering niet. De fase komt volledig uit de event-teller; wat het doel vandaag wél stuurt is alleen het quotum binnen die fase. Raakt de ENGINE, dus expliciete autorisatie vóór de bouw. Verse chat.

**PUNT 7 STAAT LIVE — DE VIJF DOELEN DRAAIEN OP PROD (31 juli 2026).** Prod NU Worker Version `1e29e9de-8533-4931-99e1-2d55613ac691`, gebouwd vanaf `4480e24` (was `a898f7dd-bb93-44a8-a136-f5cdd266f0d6`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-CrIrf_QS.js`), 63 ongewijzigd; totale upload 312,76 KiB / gzip 66,84 KiB. `0008` blijft de laatste remote migratie en er is er GEEN bijgekomen — `settings.doel` is vrije tekst, dus de doel-splitsing vroeg per constructie geen schema-wijziging.
- **DE OPGESLAGEN DOEL-WAARDE IS `FTP`**, gelezen vóór de deploy met een read-only SELECT op remote D1 (`rows_written` 0, `changed_db` false, `rows_read` 1; `doel_start` 2026-06-29). Dat is één van de vijf nieuwe literals, dus de deploy kon door zonder dat `normalizeDoel_` ook maar iets hoefde te vangen. Ná de deploy geeft `GET /api/settings` op prod 200 met doel `FTP`, doelStart `2026-06-29`, ftp 280.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 781 over 62 bestanden · engine-selftest-assert-count 1384**, beide afgelezen uit de suite (de selftest draagt zijn telling in de testnaam, "exactly 1384 assertions", en die test is groen). Lees ze uit de suite; hardcode ze nooit.
- **DE TWEE BEVINDINGEN UIT DE SWEEP STAAN NU ONDER ROADMAP PUNT 9**, waar ze horen: het vo2-gewicht 0,15 van `klim_lang` vuurt bij geen enkel volume (zeven keer nul anaeroob over 3,0 tot 14,0 uur, terwijl high van 64 naar 122 loopt) omdat het FASE-mechanisme buiten Base geen volume-ramp kent — uitkomst `DOELEN-SPEC` §3.4-conform, maar de term kan per constructie geen bewijs dragen. En de anaerobe DALING van `klim_kort` boven 10 uur (20 terug naar 14) is nog niet herleid tot een mechanisme; het high-plateau vanaf 6,0 uur is dat wél, dat is het quotum van drie kwaliteitsdagen. Beide staan als MEETPUNT genoteerd, niet als bouwopdracht.
- **OPENSTAAND — DE INSTELLINGEN-SEGMENTED IS NIET VISUEEL GECONTROLEERD.** Vijf doelen in één Segmented (FTP / drempel · Duurvermogen · Klim kort · Klim lang · Onderhoud), en Daan kijkt op zijn telefoon. De shot-harness kent geen Instellingen-scenario — hij laadt uitsluitend `/schema` — en er is er in deze ronde bewust geen gebouwd. Dit is dus een check die alleen Daan kan doen: open de Instellingen-tab op de telefoon en kijk of de vijf segmenten passen zonder af te breken of te overlappen.
- **OPENSTAAND, ONGEWIJZIGD.** De visuele check op de echte pendeldag (Schema-tab, ná de heenrit en vóór de terugrit) · de gepland-noemer zakt op de dag zelf · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>`.

FOCUS VOLGENDE CHAT: punt 8 uit `docs/ROADMAP.md`, op `docs/DOEL-LIJST-RECON.md` paragraaf 8 — de BEHOUD-vloer van 5 procent voor doel Onderhoud, afgeleid uit `instapNiveau()` in plaats van een constante zoals al het andere in `GOAL_PROFILES_`. Raakt ENGINE (`niveau.ts`) plus client (`Niveau.tsx`, `DoelProjectie`). Autorisatie is nog NIET gegeven. Verse chat.

**PUNT 7 IS AF — DE DOEL-LIJST KLOPT WEER, MAAR STAAT NOG NIET LIVE (31 juli 2026).** Vijf doelen (FTP · Conditie · Korte beklimmingen · Lange beklimmingen · Onderhoud), twee klim-profielen `klim_kort` en `klim_lang`, de dode `climbTypeWorkout_`-tak weg, en VO2max alleen nog als MIDDEL. Bouw `b04d73c` (engine) en `626bdd5` (UI-labels plus de twee wezen), plus deze close-out. Prod ONVERANDERD: Worker Version `a898f7dd-bb93-44a8-a136-f5cdd266f0d6`, `0008` de laatste remote. GEEN migratie, GEEN wrangler-commando, GEEN deploy — `settings.doel` is vrije tekst, dus er is per constructie geen migratie nodig.
- **VLOEREN NU: vitest-totaal 781 over 62 bestanden · engine-selftest-assert-count 1384** (van 770/61 en 1364), beide afgelezen uit de suite: de selftest draagt zijn telling in de testnaam ("exactly 1384 assertions") en die test is groen. Lees ze uit de suite; hardcode ze nooit.
- **CONTAINMENT VAN HET OPRUIMEN, GEMETEN.** De vraag was of het type `vo2max` na het schrappen van `workoutForVo2max` nog uit de library komt of stil naar de generieke pool valt. Fase Build, doel Korte beklimmingen: V1 (ma60 di60 do60 za120) geeft 3 dagen / high 51 / anaeroob 14 / TSS 270 met `VO2 Hill Repeats 9×90s`, V3 (ma70 di70 do70 za180 zo90) geeft 3 / 51 / 20 / 421 met `VO2max 30/15` — exact gelijk aan `b04d73c`. De weekvorm-as en de 48 vingerafdrukken zijn byte-identiek. De vo2-sessies komen dus uit `vo2Pools_`, niet uit de verwijderde bibliotheek.
- **HET VO2-GEWICHT VAN `klim_lang` VUURT NOOIT — GEMETEN, NIET GEREPAREERD.** Sweep in fase Build over zeven weekvormen: W1 3,0u ma45 wo45 za90 · W2 4,5u ma50 wo50 vr50 za120 · W3 6,0u ma60 wo60 vr60 za180 · W4 8,0u ma70 wo70 vr70 za180 zo90 · W5 10,0u ma75 di60 do75 za210 zo180 · W6 12,0u ma90 di75 wo60 do90 za240 zo165 · W7 14,0u ma90 di90 wo90 do90 za270 zo210. `klim_lang` levert anaerobe intentminuten 0 · 0 · 0 · 0 · 0 · 0 · 0 — op GEEN ENKELE vorm komt hij boven nul; zijn high loopt wel op: 64 · 64 · 75 · 75 · 94 · 122 · 122. `klim_kort` op dezelfde reeks: anaeroob 8 · 8 · 14 · 20 · 20 · 14 · 14, high 46 · 46 · 51 · 51 · 51 · 51 · 51. Verklaring: in Build is er geen volume-ramp (`volumeModulatie` geeft buiten Base nul) en 0,15 plus de coverage-boost 0,10 haalt het niet bij drempel 0,50. Dat is GEEN defect — §3.4 wil aanhoudende blokken, geen intervallen — maar het betekent wel dat `intentGewichten.vo2` op `klim_lang` in de praktijk alleen de som normaliseert. Genoteerd voor punt 9 en punt 11; deze ronde bewust niets aan gewijzigd.
- **DE TWEE WEZEN ZIJN OPGERUIMD.** `GOAL_INTENT_WEIGHTS_KLIM_` verloor zijn laatste consument toen beide nieuwe profielen eigen gewichten kregen; `workoutForVo2max` verloor zijn enige dispatch toen VO2max ophield doel te zijn. Beide zijn weg, met de twee planner-commentaren die nog beweerden dat de bibliotheek bereikbaar bleef. De constante staat nog wél in de bevroren GAS-bron (`Archetypes.gs:492`) en dat blijft zo — maar parity is geen reden om Cadans-code te bewaren die niets meer doet: de bevroren bron is de referentie voor GEDRAG, niet voor het bewaren van dode symbolen. `vo2Pools_` blijft, want dat is het MIDDEL.
- **`Instellingen.tsx` HAD NIETS NODIG.** Het scherm rendert `DOEL_OPTIONS` generiek en draagt geen enkele doel-literal van zichzelf; alleen `apps/web/src/lib/settings.ts` bewoog. Labels kort gehouden — het is een Segmented met vijf segmenten: FTP / drempel · Duurvermogen · Klim kort · Klim lang · Onderhoud.
- **OPENSTAAND, ONGEWIJZIGD.** De visuele check op de echte pendeldag (Schema-tab, ná de heenrit en vóór de terugrit) · de gepland-noemer zakt op de dag zelf · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>`.
- **OPENSTAAND, NIEUW.** De Instellingen-Segmented met vijf doelen is NIET visueel gecontroleerd — de shot-harness kent geen Instellingen-scenario en er is er in deze ronde bewust geen gebouwd. En PROD DRAAIT NOG DE OUDE DOEL-LIJST: de deploy staat open, dus tot dan biedt het live scherm nog `Beklimmingen` en `VO2max` aan. Dat is niet stuk — `normalizeDoel_` vangt beide af — maar het is wel de reden dat punt 7 "af maar niet live" is.

FOCUS VOLGENDE CHAT: fase C, punt 8 uit `docs/ROADMAP.md`, op `docs/DOEL-LIJST-RECON.md` paragraaf 8. De meetlat kent maar twee doelen; `Niveau.tsx` draagt precies drie meetgrootheden en de onderhoud-vloer is AFGELEID in plaats van constant, dus het raakt ENGINE plus client. Autorisatie is nog NIET gegeven. Verse chat.

**DE RECON VOOR PUNT 7 EN 8 STAAT — GEEN CODE GEBOUWD (30 juli 2026).** DOCS-ONLY: `docs/DOEL-LIJST-RECON.md` is de SPEC waartegen fase B gebouwd wordt, plus de bijgewerkte posten 7 en 8 in `docs/ROADMAP.md` en dit blok. Prod ONVERANDERD: Worker Version `a898f7dd-bb93-44a8-a136-f5cdd266f0d6`, `0008` blijft de laatste remote. GEEN migratie en geen enkel wrangler-commando, ook geen read. `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 770 over 61 bestanden · engine-selftest-assert-count 1364**, beide afgelezen uit de suite (de selftest draagt de telling in zijn testnaam, "exactly 1364 assertions"). Lees ze uit de suite; hardcode ze nooit.
- **DE DRAGENDE METING: BEKLIMMINGEN EN VO2MAX ZIJN IN BASE BYTE-IDENTIEK.** Zelfde dagen, zelfde sjablonen bij naam, zelfde TSS, op drie weekvormen: V1 5,0 u beide 2 dagen / 69 kwaliteitsminuten / 253 TSS, V3 8,0 u beide 2 / 81 / 389, winter 3x60 beide 2 / 45 / 149. En GEEN van beide levert in Base ook maar één anaerobe minuut — `GOAL_FASE_MOD_.Base` zet vo2 op −0,10, waardoor de vo2-intent bij elk profiel achteraan sorteert. Base loopt met AGR in de agenda tot 2027-02-15, dus dat geldt de hele winter. In Build lopen ze wél uiteen (V1: Beklimmingen 3 / 65 / 270 met 14 anaerobe minuten, VO2max 3 / 55 / 267 met 13).
- **`DOELEN-SPEC` §1 IS VEROUDERD.** §1 stelt dat in Base alle vijf doelen 2 kwaliteitsdagen en 45 minuten hoog-intent leveren; dat is gemeten op `eee966b`, vóór punt 1, 1b en 2. Op HEAD lopen ze wél uiteen — V1 Base: FTP 3 / 93 / 268, Conditie 2 / 66 / 245, Onderhoud 3 / 87 / 254. Een METING gecorrigeerd, geen VASTGESTELD besluit heropend.
- **DE DODE TAK IS EXACT BEGRENSD.** GEMETEN over alle 15 combinaties (5 doelen x 3 fases): `goalWorkout_` levert vanaf 33 minuten een kandidaat, in elke combinatie dezelfde grens, en `eligible_` kent geen minimum-minuten-poort. `climbTypeWorkout_` kan dus uitsluitend vuren op een kwaliteits-eligible dag van 32 minuten of korter, in Build of Peak, met een `klimType`. Smal, niet nul — daarmee is opruimen een gedragswijziging op die grens en toetsbaar.
- **BESLUIT.** `DOEL_OPTIONS` wordt FTP · Conditie · Korte beklimmingen · Lange beklimmingen · Onderhoud. VO2max vervalt als DOEL en blijft volledig als MIDDEL; dat besluit stond al als VASTGESTELD in `DOELEN-SPEC` §3.6, alleen de BOUW is nieuw. Twee profielen `klim_kort` en `klim_lang` vervangen `PROFILES.klim` en `PROFILES.vo2max`, met alias-takken zodat een opgeslagen waarde niet stil van karakter verandert. GEEN migratie nodig: `settings.doel` is vrije tekst en de worker valideert niet tegen een lijst.
- **PUNT 8 WORDT EEN EIGEN FASE.** GEMETEN GRENS: `Niveau.tsx:124-128` kent precies DRIE meetgrootheden — `ftpWkg`, `ctl` en `longRideH`. Doel Onderhoud krijgt daarom geen groei-target maar een BEHOUD-vloer van 5 procent onder de instapwaarde uit `instapNiveau()`; `DOELEN-SPEC` §3.2 sluit een CTL-target expliciet uit ("NIET CTL — die hoort te dalen") en schrijft die vloer al voor. Die target is AFGELEID in plaats van constant zoals alles in `GOAL_PROFILES_` vandaag, en dat raakt de CLIENT — vandaar een eigen fase met een eigen commit.
- **OPENSTAAND, ONGEWIJZIGD.** De visuele check op de echte pendeldag (Schema-tab, ná de heenrit en vóór de terugrit) · de gepland-noemer zakt op de dag zelf · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>`.

FOCUS VOLGENDE CHAT: fase B van punt 7 bouwen op `docs/DOEL-LIJST-RECON.md` paragraaf 6 en 7. ENGINE, autorisatie is gegeven op de plekken uit paragraaf 5; de selftest-vloer kan meestijgen. Verse chat.

**DE TWEEDE PENDELRIT BLIJFT NU STAAN EN GAAT MEE NAAR GARMIN — LIVE, MAAR HET DOELGEVAL IS NOG NIET MET EIGEN OGEN GEZIEN (30 juli 2026).** Prod NU Worker Version `a898f7dd-bb93-44a8-a136-f5cdd266f0d6`, gebouwd vanaf `b440091` (was `e2069ca1`). 3 assets vervangen, 63 ongewijzigd; totale upload 312,76 KiB / gzip 66,84 KiB. Bouw-commit `c5b5f5d`, assertie-reparatie `b440091`, recon-doc `cef40fb` (`docs/PENDEL-RECON.md`), plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30543166691>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read; `0008` blijft de laatste remote. CLIENT-ONLY, `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 770 over 61 bestanden · engine-selftest-assert-count 1364 ONBEWOGEN** (van 757/60). Lees ze uit de suite; hardcode ze nooit.
- **DE WORTEL WAS EEN PER-DAG-VLAG OP TWEE LAGEN, allebei dood.** `derivePlannerGedaan` leegde het plan van de dag, en pas daarna sloot de done-state de dagkaart en de push af. GEMETEN dat alleen de producent repareren NIETS oplevert.
- **EEN DUURDREMPEL KAN DIT NIET OPLOSSEN.** Een pendelbeen is per constructie exact 50 procent van de round trip. Met de drempel op het dagtotaal telt een been van 39 minuten niet en een van 40 wel. Daarom is het een TELLING geworden, met de 50-procent-eis ongewijzigd per rit.
- **WAT ER STAAT, VIER TERMEN.** De telling in `derivePlannerGedaan` (regels 1 t/m 3 van de GAS-mirror byte-identiek, alleen regel 4 forkt — een expliciet model-besluit, in het bestand vastgelegd); `ritten` op `DoneEntry`; de afgeleide `openSessions`; `collectPushDays` op `openSessions` met de state-lijst uitgebreid met `"done"`; en `plannedForCompare` op `sessions[ritten - 1]`.
- **ROOD PER TERM, GEMETEN.** Term 1 eruit geeft 5 rood, term 2 en 3 eruit geven 2 rood, term 4 eruit geeft chip "Licht afgeweken" en score 70 in plaats van "Op plan" en 96.
- **HET CHAT-GETAL EN HET CC-GETAL VERSCHILLEN 4 TSS, MET REDEN.** Weekkaart gepland 442 tegen 446 en plan-TSS 38 tegen 42, volledig in de tweede pendelsessie: de recency-seed kiest daar een andere variant binnen dezelfde duurband. Minuten 530 en dagen 5 zijn exact gelijk. Variant-rotatie, geen regressie en nooit een herijk-aanleiding; de asserties pinnen de variant-onafhankelijke waarden. `docs/PENDEL-RECON.md` paragraaf 5 noemt 446 — dat getal is variant-afhankelijk en mag niet als norm gelezen worden.
- **HET DOELGEVAL IS OP PROD NIET TE ZIEN GEWEEST, en dat is geen nalatigheid.** De week van 27-07 bevat geen pendeldag (woensdag 29 juli is rustdag). De fix staat live en ligt stil.
- **WAT WEL IS VASTGESTELD OP PROD**, Worker `a898f7dd`, acht read-only shots in één run, geen propagatie-uitval. (a) KLOPT: geen enkele sessie verdween. Za 1 draagt `Drempel lang 3x14`, 240 min, 198 TSS met vier blokken; ma 27 en di 28 zijn gemist en dragen hun sessie nog — `Sweet Spot over/under 4x(2-3)` 45 min 43 TSS en `Sweet Spot 3x8` 60 min 52 TSS. (c) KLOPT EXACT: gepland 43+52+198 = 293 TSS en 45+60+240 = 345 minuten = 5:45 over drie dagen, tegen weekkaart 52/293, 1:22/5:45 en 1/3. (b) GESPLITST: dat er geen open sessie onder een voltooide dag hangt klopt (do 30, `Haarlem Wegwielrennen` 1u22, vijf zonebalken, niets eronder), maar do 30 draagt geen plan, dus een volledig gereden dag MET plan is op dit geval NIET TOETSBAAR.
- **OPENSTAAND — DE VISUELE CHECK OP DE ECHTE PENDELDAG.** Te doen op de Schema-tab, ná de heenrit en vóór de terugrit. Drie dingen: onder de voltooid-kaart hoort de terugrit als open sessie te staan; de vergelijking op die kaart hoort tegen de HEENRIT te gaan, dus chip "Op plan" en niet "Licht afgeweken"; en "Push naar Garmin" hoort alleen die terugrit mee te sturen. Loopt de weekkaart die dag voor 80 minuten mee en niet voor 40, dan klopt ook de noemer.
- **OPENSTAAND, NIET GERAAKT.** De gepland-noemer zakt op de dag zelf ook bij een VOLLEDIG gereden dag en bij een gewone dag — niet pendel-specifiek, blijft parkeerlijst. Een verstreken pendeldag toont nog steeds ÉÉN samengevoegde sessie van 80 minuten, want `workoutFromFrozenEntry` leest dagtotalen en negeert de sessies-array die wel in de blob staat. De heen/terug-splitsing binnen een sessie (ENGINE) blijft ongemoeid.
- **KLEINE WAARNEMING UIT DE PROD-VERIFICATIE, geen defect.** De gedaan-TSS op de weekkaart (52) is op geen enkele dagkaart na te rekenen zolang die dag geen plan draagt — de gereduceerde voltooid-kaart toont duur en zoneminuten, geen TSS. De gepland-kant is wel volledig na te rekenen. Genoteerd zodat een volgende consistentie-check daar niet op struikelt.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>`, deze ronde opnieuw gezien op de weekkaart en op maandag, tweemaal `/api/checkin/2026-07-30` omdat er vandaag geen check-in is ingevuld — bestaand gedrag, los van deze fix · de gepland-noemer verschuift terwijl de week vordert.

FOCUS VOLGENDE CHAT: punt 7 uit `docs/ROADMAP.md` — de doel-lijst klopt niet. VO2max eruit, Beklimmingen splitsen in kort en lang, twee profielen, de dode `climbTypeWorkout_`-tak opruimen. De reeks is weer aan zet: de pendel-bug was de bewuste afwijking en is af. HARDE DATUM half februari 2027, en punt 8 (de meetlat kent maar twee doelen) reist ermee mee. ENGINE, dus expliciete autorisatie vóór de bouw; de selftest-vloer kan meestijgen. Verse chat.

STAND (30 juli 2026) — PUNT 6 IS KLAAR EN STAAT LIVE. De zone-munt leest nu de ECHTE zone-grenzen in
plaats van ze aan te nemen. Prod: Worker Version `e2069ca1`, migratie `0008_sleepy_gladiator.sql`
remote toegepast, `sync_state.power_zones_json` gevuld met `[55,75,90,105,120,150,999]`. Suite 757
tests over 60 bestanden; engine-selftest 1364 asserts. Bouwdoc: `docs/ZONE-SYNC-BOUWDOC.md`.

GEMETEN, EN DAAROM TE GELOVEN. De remote SELECT gaf vóór de eerste app-load NULL en daarna de array:
de afleiding heeft aantoonbaar OP PROD gevuurd en bestond daar niet al. De blok-kaart noemt na de
deploy exact dezelfde getallen als ervoor (29 jun Tempo 58/24 · Drempel 37/47 · VO2max 15/13;
blok-totaal 193/72 · 93/141 · 38/39), zoals hij per constructie moet: Daans eerste vier grenzen ZIJN
`ZONE5_GRENZEN_DEFAULT`. Lokaal waren 48 van de 48 shots byte- én sha256-identiek voor en na.

DE WEG. `syncActivities` leidt de grenzen af uit de NIEUWSTE fiets-rit met een bruikbare
`icu_power_zones` — geen tweede endpoint, geen extra route, geen vierde schrijfactie per pageload.
`GET /api/power-zones` → `loadSchemaWeek` → één `zone5Grenzen(powerZonesRow)` → `buildBlokReview` én
`buildBlokReferent`. `blokDosisNorm` en `buildBlokReferent` houden een OPTIONELE `grenzen`;
`buildBlokReview` heeft hem VERPLICHT. Server-zijde wordt alleen "is het een array" getoetst; de
volledige toets zit in `zone5Grenzen`, die overal terugvalt op de default — daarom is de hele bouw
inert voor wie niet gesynct heeft.

FOCUS VOLGENDE CHAT: EERST de PENDEL-BUG, dan punt 7 uit `docs/ROADMAP.md`. Die volgorde wijkt
bewust af van de reeks: punt 7 heeft een deadline in februari 2027, de pendel-bug raakt Daan elke
week op de dag zelf. Recon-first, want de oorzaak ligt vermoedelijk in de koppeling gedaan↔gepland
en dat is dezelfde knoop als de geparkeerde per-rit-koppeling.

**DE WEEK-INHAAL-KAART IS WEG — HIJ KON NIET VERSCHIJNEN, EN WAAR HIJ WÉL BEET MAAKTE HIJ DE WEEK ZWAKKER (juli 2026).** Prod NU Worker Version `8cde1d3d-4798-4f36-80e5-fe6ad862d2ef`, gebouwd vanaf `330f5229` (was `14629dd4-72df-4533-87a6-f1c9c18a9e6b`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-BcidXCXT.js`), 63 ongewijzigd; de bundel KRIMPT van 311,92 naar 310,86 KiB. Verdict-doc `8f567f9` (`docs/INHAAL-5C-VERDICT.md`), opruim-commit `330f522`, plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30514172839>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read; `0007` blijft de laatste remote en de kolom `debt_opt_in_week` staat er nog. CLIENT + WORKER, `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 741 over 59 bestanden · engine-selftest-assert-count 1364 ONBEWOGEN** (van 766/62). De daling van 25 tests is BEWUST: drie testbestanden verwijderd (`inhaal.test.ts`, `debtOptIn.test.ts`, `routes.debt-optin.test.ts`). Geen enkele bestaande assertie verzwakt. Lees ze uit de suite; hardcode ze nooit.
- **DE PREMISSE VAN 5c GOLD ALLEEN VOOR DE BOUW-TAK.** ROADMAP stelde dat 5c de allocator raakt en dus engine-autorisatie vraagt. Dat klopt voor REPAREREN; OPRUIMEN raakt `packages/engine` niet en vraagt geen migratie.
- **DRIE ONAFHANKELIJKE REDENEN WAAROM DE KAART NIET KON VERSCHIJNEN.** (1) De `catchup_*`-codes zijn onbereikbaar: de allocator-tak staat vóór de per-dag-takken en de endurance-fill claimt elke eligible dag. (2) NIEUW deze ronde: `debtPreferredType_` kiest de bucket met de MEESTE minuten, en dat is altijd `low` — over 88 geplande sessies (5 weekvormen × 4 doelen) draagt er NUL meer high plus anaeroob dan low, dus de arm levert `long_z2` en zijn eigen guard blokkeert hem. (3) De debt rekent in de VERVANGEN 3-bucket-munt: een grijze rit (50 minuten Z3) en een scherpe rit (50 minuten Z4) geven op dezelfde week een IDENTIEKE debt, low 17 · high −2.
- **DE DOORSLAG WAS NIET DE DOODHEID MAAR DE UITKOMST.** GEMETEN over 72 cellen (4 weekvormen × 3 doelen × 3 `doelStart`-waarden × 2 keuzes voor "vandaag"), in de enige vorm die de arm laat vuren — verstreken dagen gereden mét volume en ZONDER intensiteit: de wat-als-run levert in 60 cellen MINDER high plus anaerobe intentminuten dan het actieve plan, in 12 MEER, in NUL gelijk. Daans eigen cel: 81 tegen 41, week-TSS 306 tegen 281, minuten in beide 360. Nul catchup-codes en nul voorstellen over alle 72. Repareren zou de coach laten aanbieden een gemiste intensiteitsprikkel in te halen met een LICHTERE week.
- **TWEE GROENE TESTS WAREN GROEN OM DE KLOK.** `debtOptIn.test.ts` draaide de volledige pijplijn en asserteerde een `catchup`-code in het actieve plan. Groen omdat de fixture-week in het VERLEDEN lag en `allocateQualityWeek_` zich op ambient `new Date()` dateert, waardoor er geen eligible dag is. Klok gepind ín die week: nul catchup-codes — terwijl het plan tussen opt-in en niet-opt-in nog wél verschilt.
- **WAT ER WEG IS.** `InhaalCard`, `buildInhaalVoorstel` met `CATCHUP_BUCKET` en zijn types, de TWEEDE `buildWeekProposal`-run per render, de aanbod-copy (`inhaalAanbodRegel`, `inhaalBucketTerm`, `InhaalBucket`) en de hele goedkeur-keten (route, repo-fns, client-fns, `optedIn`). 14 bestanden geraakt, 22 insertions tegen 1154 deletions.
- **WAT BLIJFT, EN WAAROM.** De ENGINE ongemoeid: `zoneDebt_`, `debtPreferredType_` en de `catchup_*`-takken zijn GAS-parity en het materiaal dat punt 10 nodig heeft. De `catchup_*`-copy-pools in `coachNarrative.ts` (dagkaart-reden, bereikbaar in fase Test). De kolom `sync_state.debt_opt_in_week` (forward-only; twee routetests gebruiken hem als isolatie-fixture). `planAdaptation` blijft een bouw-input zodat het engine-pad testbaar blijft; de app geeft hem niet meer mee en valt terug op `PLAN_ADAPTATION_ENABLED`.
- **HET BEGRENZINGSBEWIJS.** Shot-harness vóór en ná, zelfde machine, zelfde dag, niets ertussen dat de lokale D1 raakte: 40 van 40 shots byte-identiek op bytecount én sha256. Een zuivere aftrekking hoort niets te raken, en dat is hier per pixel vastgesteld in plaats van per oog.
- **VIER CC-AFWIJKINGEN, alle gemeld en alle gehouden.** Twee commentaarverwijzingen naar het verwijderde bestand hersteld (`FatigueCard.tsx`, `SleutelInhaalBlok.tsx`); drie symbolen die door de opruiming dood vielen verwijderd (`derivePlannerGedaan` en `GedaanPlannerDay` uit `schema.ts`, plus `fatigueDownActive`); een stale commentaarregel boven het actieve plan herschreven; en een biome-format-ronde. Chat-zijde nagetrokken in de bron op `e46af55`: die drie symbolen hadden UITSLUITEND lezers binnen de inhaal-keten, dus de vermoeidheidskaart is niet geraakt.
- **NALEVERING, CC-VONDST.** Punt 5b in `docs/ROADMAP.md` sloot af met "punt 10 wordt hier niet geraakt". Die claim gold vóór deze ronde en is er nu uit: 5b introduceerde inderdaad geen tweede stem, maar de week-tekort-vraag ligt sinds 5c bij punt 10. Eigen docs-commit ná de close-out.
- **OPENSTAAND, ONGEWIJZIGD.** Zone-munt fase 2 en de twee eisen die eraan voorafgaan · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>` op de prod-shots · de gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: punt 6 uit `docs/ROADMAP.md` — de zone-sync, fase 2 van de dosis-munt.** EERST de twee eisen die eraan voorafgaan: de shot-harness seedt geen `weekUren` en is daardoor blind voor de blok-kaart, en drie fixtures (`weekRit` in `blok.test.ts`, `act` in `effect.test.ts`, `previewAct` in `Preview.tsx`) hardcoden de signatuur-waarden en horen hun eigen poort te asserteren. Daarna de sync zelf op `docs/ZONE-MUNT-ONTWERP.md` §5 stap 2. Bij Daan gedragsneutraal (zijn grenzen zijn exact de default); de winst is een tweede gebruiker en een latere zone-wijziging. Raakt een MIGRATIE, dus strikte volgorde: migratie eerst, dan `wrangler deploy` vanuit `workers/api` met `pnpm build` ervoor. Verse chat.

**DE COACH ZEGT NU WAAR DE GEMISTE PRIKKEL STAAT, LIVE (juli 2026).** Prod NU Worker Version `14629dd4-72df-4533-87a6-f1c9c18a9e6b`, gebouwd vanaf `95d4c00` (was `8e0f66cc-5226-4b40-be29-2f584801374f`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-CtWXT1ou.js`), 63 ongewijzigd. Recon-doc `90cae96` (`docs/INHAAL-5B-RECON.md`), bouw-commit `95d4c00`, plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30485918428>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read. CLIENT-ONLY, `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 766 over 62 bestanden · engine-selftest-assert-count 1364 ONBEWOGEN** (van 753/61; geen engine geraakt). Lees ze uit de suite; hardcode ze nooit.
- **DE PREMISSE VAN 5b IS BIJGESTELD, GEMETEN.** Het criterium stond op "een afwijsbaar VOORSTEL op de dagkaart". Dat kon zo niet: `adapt` draagt generieke copy over een ingekorte sessie die het plan niet uitvoert, en het is bovendien geen sleutel-signaal — DRIE van de vijf takken die het veld vullen horen bij een endurance-ruil. Renderen zou de coach iets laten beloven wat de app niet doet. Het criterium is nu een zichtbare regel die GEDEKT is door het actieve plan.
- **HET PLAN HERSCHIKT AL, HET ZEI HET ALLEEN NIET.** `allocateQualityWeek_` rekent het quotum als quotum MIN de reeds voltooide harde dagen: gereden sleutelsessies verbruiken het quotum, GEMISTE niet, dus de resterende dagen krijgen de kwaliteit vanzelf. GEMETEN over 23 cellen: in 10 verschilt de kwaliteitsverdeling van de gereden-variant, in 20 van de 23 draagt het restplan nog minstens één sleutelsessie, in 3 is de week op. LIVE BEVESTIGD op prod: de `Sweet Spot 3×8` van DI 28 staat nu op DO 30 — het plan had hem werkelijk verschoven.
- **WAT ER STAAT.** `apps/web/src/lib/sleutelinhaal.ts` draagt `isSleutelIntent`, `sleutelPrikkelOpen` en `openSleutelDagen`; de sleutel-toets leest `COACH_KEY_INTENTS_` en `intentFromType_` uit de ENGINE, geen eigen lijst client-zijde. `SleutelInhaalBlok.tsx` is een FEITENBLOK zonder knop — het noemt wat er staat, geen daad-claim. Twee call-sites in `SchemaView`: de done-tak na `DoneCompareCard` en de gemist-tak na het `SessieBlok`. Het dode clientveld `adapt` is vervangen door `plannedIntent` en `doneIntent` (machineleesbaar, geen copy); de engine en de selftest-asserties op `adapt` blijven ongemoeid.
- **ROOD PER TERM, GEMETEN EN NIET BEWEERD.** Sleutel-poort uit: VIJF tests vallen. Datumfilter uit: DRIE. De `doneIntent`-term uit tak (b): exact ÉÉN. Geen term bleef ongedekt.
- **GEMETEN OP PROD, DAANS EIGEN DATA, WEEK 27-07.** MA 27 en DI 28 dragen het blok met `do 30` (Sweet Spot 3×8, 60 min) en `za 1` (Drempel lang 3×14, 240 min); beide dagen kloppen tegen hun eigen dagkaart. Van de acht prod-shots dragen er precies TWEE het blok. De GemistCard-copy en de sessie-weergave staan er onveranderd boven. Op de lokale harness bleef het blok WEG op DI 28 van `v7-midweek`: die dag droeg duurwerk, dus de poort vuurt niet te breed.
- **NIET TOETSBAAR OP DIT GEVAL, bewust niet naar het antwoord toe geschreven.** De lege-lijst-tak ("Deze week staat er geen trainingsdag meer om 'm op te pakken") — er staan deze week twee kandidaten — en de different-poort, want geen scenario draagt een dag die met een afwijkende intent gereden is. Beide zijn in de unit-tests gedekt.
- **NIEUW OP DE PARKEERLIJST — DE COPY VAN HET BLOK IS NOG NIET VERFIJND.** Daan-besluit: de toon van het feitenblok komt aan het eind aan de beurt, samen met de andere coach-copy. Geen bouw nu.
- **OPENSTAAND, ONGEWIJZIGD.** Zone-munt fase 2 en de twee eisen die eraan voorafgaan · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>` op de prod-shots · de gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: punt 5c uit `docs/ROADMAP.md` — de week-inhaal-kaart kan niet verschijnen.** Raakt de allocator, dus ENGINE en expliciete autorisatie vóór de bouw; de selftest-vloer kan meestijgen. Reden dat dit vóór punt 6 gaat: het is het broertje van 5b, in dezelfde ronde gemeten, en zolang het open staat draagt de app een hele goedkeur-keten (route plus kolom) die niet bereikbaar is. Verse chat.

**SWEET SPOT IS EEN SLEUTELSESSIE, LIVE — EN DE HALVE FIX WIJST DE VOLGENDE AAN (juli 2026).** Prod NU Worker Version `8e0f66cc-5226-4b40-be29-2f584801374f`, gebouwd vanaf `7924aba` (was `27355f14-bb64-4ba8-a0eb-2bbdcb65e4fc`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-BXavS1iC.js`), 63 ongewijzigd. Recon-doc `74c3de0` (`docs/SWEETSPOT-SLEUTEL-RECON.md`), bouw-commit `7924aba`, plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30481663339>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read; `0007` blijft de laatste remote.
- **VLOEREN NU: vitest-totaal 753 over 61 bestanden ONVERANDERD · engine-selftest-assert-count 1364** (van 1358; de zes nieuwe asserties zitten binnen de bestaande `testCoachFeedback`, dus het vitest-totaal beweegt niet). Lees ze uit de suite; hardcode ze nooit.
- **DE PREMISSE VAN PUNT 5 IS WEERLEGD, GEMETEN.** ROADMAP punt 5 stelde dat `plIntent` primair uit `coachIntentFromZones_` komt en dat de fix daarom niet één regel was. ONJUIST in de APP: `coachPlannedArg_` (`apps/web/src/lib/schema.ts:554`) zet `segmenten` hard op `null` (regel 564), en dat is de ENIGE constructie van het planned-argument — gebruikt door de VOLTOOID-tak (581) en de GEMIST-tak (659). `plIntent` komt dus ALTIJD uit `intentFromType_`; het zone-pad is dood. BEWIJS uit het geval zelf: `ss_overunder` zet al zijn werk op 91% FTP, dus via het zone-pad zou hij `drempel` heten en al sleutel zijn geweest — hij was het niet.
- **DE GEVRAAGDE METING.** Van de 13 sweet-spot-archetypes vouwen er ZEVEN naar `tempo` en ZES naar `drempel`, geen enkele wisselt binnen zijn duurband; van de vijf pool-varianten vouwen er DRIE naar `tempo`. Het zone-pad aansluiten zou de sleutelstatus dus juist WEGNEMEN bij meer dan de helft van de bibliotheek. Broertje: `vo2_microburst` draagt over zijn hele band 5 anaerobe minuten tegen de significantiedrempel `max(8, 12%)`, en heet via dat pad `duur`. Volledig in `docs/SWEETSPOT-SLEUTEL-RECON.md`.
- **WAT ER GEBOUWD IS (ENGINE, geautoriseerd, uitsluitend `packages/engine/src/coach.ts`).** `COACH_KEY_INTENTS_` krijgt `sweetspot` (HERKOMST: PLAN, uit `DOELEN-SPEC` §3.1 — niet te ijken op een reeks). En `isKey` verankert AANVULLEND op het geplande TYPE: `const plTypeIntent = intentFromType_(planned.type)` boven `plIntent`, die als bestaande fallback hergebruikt wordt, en `isKey` is waar als de zone-afgeleide intent IN de lijst staat OF de type-afgeleide erin staat. Strikt additief — het kan sleutelstatus alleen toevoegen. Vandaag inert, want plIntent is altijd de type-afgeleide; hij bestaat om het criterium te dragen ongeacht waar de minuten vallen. Diff `coach.ts` +21/−7, `selftest.test.ts` +80/−1.
- **ROOD PER TERM, GEMETEN EN NIET BEWEERD.** Elke term apart teruggedraaid en de suite gedraaid: zonder `sweetspot` in de lijst valt uitsluitend "coach sweetspot missed adapt"; zonder de type-verankering valt uitsluitend "coach sweetspot type-verankering". Geen kruisbesmetting. De tweede fixture asserteert EERST dat `planned.intent` `tempo` is, zodat hij niet stil doodgaat als de vouwing verschuift.
- **GEMETEN OP PROD, DAANS EIGEN DATA, WEEK 27-07.** MA 27-07 draagt nu "Wel was dit een Sweet Spot-sleutelprikkel van je Base-blok, dus ik laat 'm niet vallen" bij `Sweet Spot over/under 4×(2-3)` 45 min 43 TSS; DI 28-07 dezelfde zin bij `Sweet Spot 3×8` 60 min 52 TSS. Vóór de bouw stond daar "een aanvullende sessie gemist; je week ligt ruim op koers". De verankering vuurt NIET te breed: WO 29, VR 31 en ZO 2 tonen rustdag-copy, DO 30 de gewone gepland-copy, en ZA 1 draagt bij `Drempel lang 3×14` de copy die hij vóór deze bouw ook al had.
- **DE HALVE FIX — HET VOORSTEL BEREIKT HET SCHERM NIET (CC-vondst, dragend).** De engine produceert `adapt` en de client zet het in het view-model (`apps/web/src/lib/schema.ts:626` en `:667`), maar GEEN ENKELE component leest het veld; buiten die twee schrijvers bestaat alleen de type-declaratie op regel 249. Dat geldt voor ÉLKE sleutelsessie, ook drempel en vo2 — het is dus geen restant van punt 5 maar een defect dat eronder lag. Wat er nu live veranderd is, is uitsluitend de copy-omslag. Nieuw punt 5b in `docs/ROADMAP.md`.
- **OPENSTAAND, UIT HET RECON-DOC §5.** De geplande segmenten komen nooit aan bij de coach, dus ook het type-label, de badge-zone en de gelijke-intent-tak van de different-copy leunen op het grove type. Of dat aangesloten hoort te worden is een eigen vraag; gebeurt het, dan pas NA de type-verankering, anders verliezen zeven sweet-spot-archetypes en `vo2_microburst` stil hun sleutelstatus.
- **OPENSTAAND, ONGEWIJZIGD.** Zone-munt fase 2 en de twee eisen die eraan voorafgaan (shot-harness seedt geen `weekUren`; drie fixtures hardcoden de signatuur) · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>` op twee van de acht prod-shots · de gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: punt 5b uit `docs/ROADMAP.md` — het inhaalvoorstel bereikt het scherm niet.** CLIENT-only, geen engine-autorisatie en geen migratie. Reden dat dit vóór punt 6 gaat: het is een gemeten defect op Daans eigen scherm dat élke gemiste sleutelsessie half stom maakt, terwijl punt 6 fase 2 bij hém gedragsneutraal is (zijn grenzen zijn exact de default). Ontwerpvraag die erbij hoort: hoort het voorstel op de dagkaart, of is het dezelfde stem als de bestaande inhaal-kaart en horen die twee samen — dat raakt punt 10. Verifieer met de shot-harness plus Daans oog. Verse chat.

**ER IS ÉÉN AFVINKBARE VOLGORDE — leesronde, GEEN code (juli 2026).** Docs-only: commit
`bb91d16` (`docs/ROADMAP.md` + `docs/DOELEN-SPEC.md`) plus deze close-out. Prod
ONVERANDERD: Worker Version `27355f14-bb64-4ba8-a0eb-2bbdcb65e4fc`; `0007` blijft de laatste
remote. GEEN migratie en geen enkel wrangler-commando, ook geen read.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 753 over 61 bestanden · engine-selftest-assert-count
  1358.** Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `docs/ROADMAP.md` draagt nu *De reeks*: twaalf genummerde punten waarin de
  nummering de bouwvolgorde IS, elk met STATUS (af / deels / open) en RAAKVLAK (ENGINE / DATA /
  CLIENT), samengevoegd uit de ROADMAP-stappen en `DOELEN-SPEC` §6. Daaronder *De tijdslijn*
  met de seizoenskalender uit §5. De oude stap-teksten staan onder *Gesloten — vindplaats*;
  STAP 3 en STAP 4 zijn opgegaan in punt 9 en punt 10. `DOELEN-SPEC` §6 wijst naar de reeks en
  stap 5 is daar afgevinkt. ELKE STATUS IS TEGEN DE CODE GETOETST op `4f7736f5`, niet tegen een
  STAND-blok.
- **DE DECEMBER-DEADLINE IS WEERLEGD, GEDRAAID OP DE GEBUNDELDE ENGINE** (esbuild buiten de
  repo-tree, TZ=Europe/Amsterdam). Met AGR op 17-04-2027 geeft de fase voor doel FTP, Onderhoud
  én Beklimmingen exact dezelfde grenzen: Base t/m 2027-02-15, Build vanaf 2027-02-22, Peak
  vanaf 2027-03-22, Taper vanaf 2027-04-12. Het doel stuurt de fase dus inderdaad niet (punt
  9), maar in DECEMBER levert dat geen defect op: de event-fase staat daar toch al op Base, en
  `PROFILES.onderhoud` draagt quotum 3 in élke fase met `mesoCyclus: false` en de mesoweek
  gepind op 1. Onderhoud aanzetten in december doet precies wat `DOELEN-SPEC` §3.2
  voorschrijft. DE EERSTE HARDE DATUM IS HALF FEBRUARI 2027: dan wisselt het doel naar korte
  beklimmingen. [BIJGEWERKT 31-07-2026: dat doel bestond toen niet en de meetlat evenmin;
  punt 7 en punt 8 zijn inmiddels af, zie de STAND-blokken bovenaan. Wat in de winter nog
  openstaat is punt 9 — het ingestelde doel stuurt de fase niet.]
- **DE SWEET-SPOT-FIX IS NIET ÉÉN REGEL, gelezen in de bron.** `COACH_KEY_INTENTS_`
  (`coach.ts:72`) mist sweetspot, maar `isKey` (`coach.ts:463`) leest `plIntent`, en die komt
  primair uit `coachIntentFromZones_` (`coach.ts:114`) — vijf mogelijke uitkomsten (vo2,
  drempel, tempo, duur, herstel) en `sweetspot` per constructie NOOIT; het type-label is alleen
  fallback. Sweet-spot-werk onder 90% FTP landt als `tempo` en valt buiten de sleutel-lijst,
  boven 90% als `drempel` en telt al mee. Het onderscheid dat de vorige chat "niet gemeten"
  noemde is dus geen verdeling over twee paden maar een grens binnen één pad. NIET GEMETEN
  blijft: welk deel van de sweet-spot-sjablonen aan welke kant van 90% valt.
- **TWEE PARKEERLIJST-ITEMS ZIJN OPGENOMEN EN VERWIJDERD.** De dosis-munt-post gaat op in punt
  6; de drie-bucket-vouwing `actualZoneMinutes_` leeft nog bij `schema.ts` (VOLTOOID-kaart) en
  `proposal.ts` (dekking- en doneHard-afleiding), maar dat zijn drempel-checks en geen
  dosis-sommen. De dagkaart-post is gemeten in de code gesloten: `planSessions` en
  `canDisposeDay` staan er, live sinds Worker `3ea25f61`.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>` op
  twee van de acht prod-shots · de gepland-noemer verschuift terwijl de week vordert · de
  shot-harness is blind voor de blok-kaart (geen `weekUren`-seed, geen schrijfroute voor
  activiteiten).
- **FOCUS VOLGENDE CHAT: punt 5 uit `docs/ROADMAP.md` — sweet spot telt niet als
  sleutelsessie.** Recon-first op de intent-afleiding: meet welk deel van de
  sweet-spot-archetypes zijn werkminuten boven en onder 90% FTP legt, en bepaal daarop of de
  fix in `coachIntentFromZones_` landt, in het `isKey`-pad, of in beide. ENGINE, dus expliciete
  autorisatie vóór de bouw; selftest-vloer kan meestijgen. Verse chat.

**DE RICHTING IS TERUGGELEGD OP HET SEIZOEN — leesronde, GEEN code (juli 2026).** Deze chat is recon plus besluiten; alleen deze close-out is een commit. Prod ONVERANDERD: Worker Version `27355f14-bb64-4ba8-a0eb-2bbdcb65e4fc`; `0007` blijft de laatste remote. GEEN migratie en geen enkel wrangler-commando, ook geen read. Docs-only.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 753 over 61 bestanden · engine-selftest-assert-count 1358.** Lees ze uit de suite; hardcode ze nooit.
- **DE PREMISSE VAN DE VORIGE FOCUS IS ONJUIST, EN DAT VERPLAATST DE URGENTIE.** De zone-sync "verplaatst de signatuur en dus de normen" — niet bij Daan. `zone5Grenzen` neemt de eerste vier waarden uit `power_zones`, en die zijn [55, 75, 90, 105]: exact `ZONE5_GRENZEN_DEFAULT`. Signatuur en normen komen er identiek uit. Fase 2 is bij hem gedragsneutraal; het risico zit in de migratie en de route. Voor een tweede gebruiker of een zone-wijziging schuift het wél.
- **DE STIP STOND VERKEERD, EN DE CORRECTIE IS VAN DAAN.** Deze chat wees `docs/R4-CUTOVER-VERDICT.md` aan als einddoel. ONJUIST: de cutover is geweest, GAS is verlaten. GEMETEN: `cutover` komt NUL keer voor in `CLAUDE.md`, `ROADMAP.md`, `WERKWIJZE.md` en `DOELEN-SPEC.md`. De R-serie is historisch — vindplaats, geen afvinklijst. De levende stip is `DOELEN-SPEC.md` §5 (winter Onderhoud, half februari Build en korte klimmen, 17-04-2027 AGR, zomer 2027 Stelvio) met §2A als inhoudelijke bestemming. Nieuwe regel in `docs/WERKWIJZE.md`.
- **DE EERSTE HARDE DATUM IS DECEMBER, NIET APRIL.** ROADMAP stap 3 staat open: de fase hangt volledig aan `eventFase_`, dertig weken ononderbroken Base, en het INGESTELDE doel stuurt de fase niet. Onderhoud aanzetten in december doet dan niet wat het moet doen.
- **DE SHOT-HARNESS IS OP DRIE MANIEREN BLIND VOOR DE BLOK-KAART, niet één.** (1) `OVERRIDES` in `seedSettings` zet geen `weekUren`, dus `blokDosisNorm` geeft null. (2) `doelStart` staat vast op 2026-06-29 terwijl de weekmaandag uit de ECHTE klok komt (`mondayISO()`), en de kaart bestaat alleen in blokweek 1 en 4 (`blokReviewVenster`) — twee van de vier weken is de harness sowieso blind. (3) Het GELEVERDE deel komt uit de activiteiten in de lokale D1, en die kan de harness niet seeden: er is geen schrijfroute. Punt 3 blijft open en is bewust geen bouw. GEDRAAID: de engine leest `weekUren` NERGENS, dus die seed-regel kan geen weekplan verschuiven — alleen kaarten laten verschijnen.
- **DE DRIE FIXTURES ZIJN PREVENTIEF, NIET ACUUT.** `weekRit` (`blok.test.ts`), `act` (`effect.test.ts`) en `previewAct` (`Preview.tsx`) hardcoden 0,282137 en 0,562462. Zolang de grenzen niet bewegen kan er niets stil breken; zodra de sync er is wél. Vorm van de fix: de vorm afleiden uit `bibliotheekSignatuur` en per plek de eigen poort asserteren.
- **DE SWEET-SPOT-KLEM, NAGELEZEN IN DE BRON.** `COACH_KEY_INTENTS_` (`packages/engine/src/coach.ts:72`) draagt `{ vo2, drempel }`; `COACH_INTENT_ZONE_` zet sweetspot op `--zone-4`, dezelfde zone als drempel. De coach tekent het als drempelwerk en behandelt het niet als sleutelprikkel. NUANCE die de fix minder triviaal maakt: `plIntent` komt primair uit `coachIntentFromZones_` over de échte zone-minuten en pas als terugval uit het type-label (`coach.ts:456-463`), dus een deel van de sweet-spot-sjablonen komt al als drempel door. Welk deel is NIET gemeten; dat bepaalt of de fix één regel is of meer.
- **OPENSTAAND, ONGEWIJZIGD.** Zone-munt fase 2 (de sync) en fase 3 · `indoor_ftp` 260 tegen `ftp` 280 · `404 /api/checkin/<datum>` op twee van de acht prod-shots · de gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: één afvinkbare volgorde in `docs/ROADMAP.md`.** Voeg de open stappen uit ROADMAP (3 en 4) samen met de open punten uit `DOELEN-SPEC.md` §6 (3, 4, 6, 7) tot één genummerde reeks, elk met een STATUS (af / deels / open) en een RAAKVLAK (ENGINE / DATA / CLIENT). Toets elke status tegen de CODE, niet tegen een STAND-blok, en lees zelf (read-only kloon plus grep, nul CC-prompts voor leeswerk). Zet de seizoenskalender uit `DOELEN-SPEC.md` §5 als tijdslijn ernaast, zodat zichtbaar is wat vóór december af moet. De parkeerlijst blijft ongesorteerd en zonder oordeel — een punt gaat er pas uit als een stap het opneemt. Docs-only, geen bouw. DAARNA bouwen, en dan als eerste de sweet-spot-klem: het enige gemeten punt dat de app vandaag functioneel slechter maakt. Engine, dus expliciete autorisatie. Verse chat.

**FASE 1B LIVE — HET BLOK WORDT PER ZONE BEOORDEELD, EN DE COACH NOEMT DE VERSCHUIVING (juli 2026).** Prod NU Worker Version `27355f14-bb64-4ba8-a0eb-2bbdcb65e4fc`, gebouwd vanaf `dcf0b6d1` (was `3ea25f61-52e2-44a9-8fdd-cc48508797d0`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-BlgISgPx.js`), 63 ongewijzigd. Bouw-commit `dcf0b6d`, plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30470989443>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read; `0007` blijft de laatste remote. CLIENT-ONLY, `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 753 over 61 bestanden · engine-selftest-assert-count 1358** (van 741/61; selftest ONBEWOGEN, geen engine geraakt). Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `weekKwaliteitMinuten` vouwt met `actualZone5_` en levert alle vijf zones; het TOTAAL bewoog geen minuut, want beide vouwingen gooien Z1+Z2 weg en houden Z3 t/m Z7, en de HR-fallback was hier per constructie dood. `blokDosisNorm` draagt naast `norm` ook `normTempo`, `normDrempel` en `normAnaeroob`. `buildBlokReferent` levert per week gevraagd én geleverd PER ZONE, en het oordeel is dat ELKE werkzone zijn EIGEN norm haalt — ZONDER compensatie tussen zones. De kaart toont per week `n/3` plus de drie paren, en eronder een blok-totaal met ALLE VIJF zones; Herstel en Duur dragen een streepje op de norm-plek, want die zijn in dit doel vulling om de sleutelsessies heen (`DOELEN-SPEC` §2A, residu).
- **DE NORM KOMT UIT HET PLAN, NIET UIT DE REEKS.** De schaal blijft prikkels × minuten-per-prikkel × dosis-trede; de VORM komt uit `bibliotheekSignatuur` over de 35 archetypes: tempo 0,282137 · drempel 0,562462 · anaeroob 0,155401. FTP 5 uur trede 0 geeft 24 / 47 / 13; trede 1 t/m 4 geven 25/51/14 · 27/54/15 · 29/57/16 · 30/61/17; FTP 4 uur geeft 16/31/9; Onderhoud geeft 19/37/10; de deloadweek schaalt met 0,60 naar 14/28/8. Chat-zijde vooraf gemeten op de gecommitte bibliotheek en code-zijde exact gereproduceerd, aan beide kanten zonder één bijstelling. HERKOMST: PLAN — deze getallen horen NOOIT op D1 geijkt te worden.
- **GEMETEN OP PROD, DAANS EIGEN DATA, BLOK 29-06 T/M 26-07.** Opbouwweken: 29-06 op 2/3 (Tempo 58/24 · Drempel 37/47 · VO2max 15/13), 06-07 op 1/3 (68/24 · 21/47 · 8/13), 13-07 op 2/3 (67/24 · 35/47 · 16/13); deloadweek 20-07 (53/14 · 36/28 · 2/8). Blok-totaal Herstel 116 · Duur 492 · Tempo 193/72 · Drempel 93/141 · VO2max 38/39. **TEMPO 2,7 KEER GEVRAAGD TERWIJL DREMPEL OP TWEE DERDE BLIJFT** — exact het grijs rijden dat de oude munt van 84 als ruim geleverd boekte. De verschuivings-tak vuurt: de coach zegt dat de dosis NIET omhoog gaat maar dat die minuten naar Drempel moeten.
- **ROOD PER PLEK, GEMETEN EN NIET BEWEERD.** Elke zone-term apart uitgezet en de suite gedraaid: zonder de tempo-term valt uitsluitend het tempo-geval, zonder de drempel-term vallen het drempel-geval plus de niet-compensatie- en de verschuivingstest, zonder de anaeroob-term uitsluitend het anaeroob-geval. Elke poort draagt dus zijn eigen bewijs. Kwam binnen als CC-uitwerking.
- **HET DOSIS-TREDE-VOORSTEL IS VANZELF VERVALLEN, EN DAT IS GEEN DEFECT.** `dosisTredeVoorstel` eist uitkomst `geleverd_gestegen` of `geleverd_niet_gestegen`, en het blok leest nu als niet geleverd. Er is dus NIETS weggeschreven; het besluit "afwijzen" is feitelijk uitgevoerd zonder handeling en de vraag komt op de volgende blokgrens terug, in de nieuwe munt. GEVOLG dat blijft staan: zolang de verschuivings-diagnose vuurt, staat de dosis-trede stil. Dat is `DOELEN-SPEC` §2A zoals bedoeld — niet geleverd betekent dosis NIET omhoog — en geen ontbrekende kaart om te repareren.
- **NORM-CORRECTIE (Daan, dragend).** De chat gebruikte Daans 46 weken om te beslissen wélke zone een week mag laten zakken, en parafraseerde onderweg "nul weken struikelen alléén op Z3" tot "Z3 bindt nooit" tot "decoratie". Allebei fout: dat is ijken op gedrag dat de coach juist vervangt, en Z3 struikelt in 12 van de 46 weken wél, alleen nooit als enige. Drie nieuwe regels in `docs/WERKWIJZE.md`.
- **OPENSTAAND, EERST WERK VAN FASE 2.** De shot-harness is BLIND voor deze kaart: de seed zet geen `weekUren`, dus `blokDosisNorm` geeft null en de kaart rendert in geen enkel scenario — de verificatie liep via `/preview` en via prod. · Drie fixtures (`weekRit` in `blok.test.ts`, `act` in `effect.test.ts`, `previewAct` in `Preview.tsx`) dragen nu de VORM van de norm; verzet de zone-sync de grenzen, dan verschuift de signatuur en kunnen ze stil onder norm zakken, waarna de effect-tests doodgaan zonder rood te worden. Ze horen hun eigen preconditie te asserteren.
- **OPENSTAAND, ONGEWIJZIGD.** `indoor_ftp` 260 tegen `ftp` 280 · elke activiteit draagt `icu_power_zones` mee, dus een latere zone-wijziging is per rit te herleiden · `404 /api/checkin/<datum>` op twee van de acht prod-shots · de gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: fase 2, de zone-sync** (`docs/ZONE-MUNT-ONTWERP.md` §5 stap 2). Read-only GET op de sport-settings van de gebruiker, een kolom op `settings`, de migratie en de sync-route naast de bestaande; daarna leest `zone5Grenzen` de echte grenzen in plaats van de default en brengt een nieuwe gebruiker zijn eigen indeling mee zonder dat er iets per gebruiker met de hand vastligt. EERST de twee openstaande punten hierboven, want de sync verplaatst de signatuur en dus de normen. Raakt een MIGRATIE, dus strikte volgorde: migratie eerst, dan `wrangler deploy` vanuit `workers/api` met `pnpm build` ervoor. Verse chat.

**DE ZONE-MUNT IS ONTWORPEN EN DE PURE LAAG STAAT OP MAIN, NIET GEDEPLOYED (juli 2026).** Ontwerpdoc `08e3df9` (`docs/ZONE-MUNT-ONTWERP.md`, 130 regels), bouw-commit `4edb8ad` (fase 1a), plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30460811666>). Prod ONVERANDERD: Worker Version `3ea25f61-52e2-44a9-8fdd-cc48508797d0`; `0007` blijft de laatste remote. GEEN migratie en geen enkel wrangler-commando. CLIENT-ONLY, `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 741 over 61 bestanden · engine-selftest-assert-count 1358** (van 722/60; selftest ONBEWOGEN, geen engine geraakt). Lees ze uit de suite; hardcode ze nooit.
- **DE BLAST RADIUS KEERT DE PREMISSE VAN DE VORIGE FOCUS OM: fase 1 raakt de ENGINE NIET en vraagt GEEN migratie.** Zes lezers van de 3-bucket-munt, twee banen. BEWEEGT MEE: alleen `weekKwaliteitMinuten` (`apps/web/src/lib/blok.ts:178`) → uitvoerings-referent → blok-check → dosis-trede. BLIJFT STAAN: `zoneDebt_` (`packages/engine/src/weekprep.ts:107`, week-vraag met eigen venster en M63-fork), `rollingZoneCoverage_` (`weekprep.ts:66`, telt DAGEN en valt terug op IF — de munt raakt hem niet), de dekking-verfijning (`apps/web/src/lib/proposal.ts:432`) en de doneHard-afleiding (`proposal.ts:526`), allebei DREMPEL-checks op `DEKKING_MIN_MIN` 15 en geen dosis-sommen, en `LOAD_TSS_RATE_` (`zones.ts:256`) dat via `tssFromZoneMinutes_` nog ÉÉN aanroeper heeft: de pendel-TSS (`planner.ts:2381`).
- **BEIDE KANTEN VAN DE MUNT BESTONDEN AL.** Gereden: `actualZone5_` (getest, GAS-parity op `coachActualZoneMin_`). Plan: elk blok draagt `pctLo`/`pctHi` naast `minuten` en `zone` (`archetypes.ts:153`), en de bewaarde weekplan-blob draagt `blokken` mee. Enige complicatie: `schema.ts` importeert `blok.ts`, dus de vouwing moest naar een eigen module — verplaatsing, geen kopie.
- **DE AFRONDINGSKLIP UIT `DOSIS-MUNT-RECON` §7 IS ECHT MAAR NIET DRAGEND (gemeten).** Midpunt reproduceert §4 exact (Z1 607 · Z2 428 · Z3 251 · Z4 553 · Z5 137 · Z6 33 · Z7 0). Proportioneel over `pctLo`–`pctHi`: 607,3 · 393,7 · 284,3 · 566,8 · 129,3 · 27,3 · 0,0. Z4+ blijft EXACT 723; er verschuift 34 minuten van Z2 naar Z3, en de kopbevinding gaat van 26/74 naar 28/72. Op SJABLOON-niveau kantelt het wél: ZEVEN sjablonen zetten onder midpunt 100% van hun werk in Z3, proportioneel nog één (`sweetspot_2x15`).
- **DE GEVRAAGDE VORM MAG NIET UIT DE GERENDERDE WEEK KOMEN.** `threshold_2x20` vraagt Z3 0,0 en Z4+ 40,0; `sweetspot_2x15` vraagt Z3 30,0 en Z4+ 0,0 — twee even geldige sleutelsessies met tegengestelde vorm. Een norm die de week uitleest zwaait mee met de variant-rotatie van de recency-seed. De vorm komt daarom uit de BIBLIOTHEEK-SIGNATUUR, afgeleid en niet hardcoded; bij vijf uur wordt 84 daarmee 24 Z3 en 60 Z4+.
- **DE REEKS DOORGEREKEND MET DE APP-EIGEN `actualZone5_`** (gecommitte dump, esbuild buiten de repo-tree, TZ=Europe/Amsterdam). Instrument valideert zich drie keer: 173 ritten met geldige blob, 46 weken met ritten, geleverd Z4+ mediaan 31 — alle drie exact `DOSIS-MUNT-RECON` §1 en §6. OUDE munt (Z3+Z4+ ≥ 84): 24 van 46 geleverd. NIEUWE munt (Z3 ≥ 24 én Z4+ ≥ 60): 6 van 46. ACHTTIEN weken kantelen; de recon voorspelde minstens zestien.
- **DE Z3-EIS BINDT NOOIT, EN DAT HOORT ER ZO BIJ TE STAAN.** Nul weken struikelen alleen op Z3, achtentwintig alleen op Z4+. De per-zone-regel valt in de praktijk samen met "Z4+ haalt zijn norm"; de Z3-term is DIAGNOSTISCH, geen poortwachter. De grijs-rijden-signatuur (Z3-overschot mét Z4+-tekort) zit in 28 van de 46 weken, waarvan er 18 onder de oude munt als GELEVERD geboekt stonden.
- **HET PLATEAU-CRITERIUM IS HIER NIET VAN TOEPASSING, EXPLICIET.** De uitkomst beweegt van 22 bij Z4+ ≥ 30 via 14 bij ≥ 50 en 8 bij ≥ 55 naar 6 bij ≥ 60 en 2 bij ≥ 90 — geen plateau. Dat mag, want deze grens wordt NIET op de reeks geijkt: de norm komt uit het plan (prikkels × minuten-per-prikkel × signatuur) en raakt de reeks nergens. Dit is de scheiding beleid-tegenover-geijkte-drempel uit `WERKWIJZE.md`. De reeks dient hier uitsluitend als bovengrens-check.
- **HET PLAN KENT GEEN GRIJZE BAND (tweede weg).** Per sjabloon liggen de minuten boven 84% en boven 76% vrijwel gelijk; grootste verschil in de vo2-sjablonen (`vo2_microburst` 5,0 tegen 7,4). Gemiddeld 27,8 minuten boven 84% per sjabloon, mediaan 24,0 — de "circa 28 per sleutelsessie" uit §6. Banden verschillen sterk: winterband 33-56 min (18 sjablonen) mediaan 20,0 · Z4+ 16,0 · Z3 3,0; lange band vanaf 80 min (6 sjablonen) 50,0 · 36,0 · 18,0.
- **WAT ER GEBOUWD IS (fase 1a, `apps/web/src/lib/zonemunt.ts`).** `ZONE5_GRENZEN_DEFAULT` [55,75,90,105] — exact wat `pctZoneBucket_` (`zones.ts:200`) hardcodeert, dus inert tot de sync er is. `zone5Grenzen` leidt de vier grenzen af uit `power_zones`, met fallback. `actualZone5_` VERPLAATST uit `schema.ts` (gedragsneutraal, bewust ZONDER grenzen-parameter: intervals heeft ze al toegepast). `planZone5_` verdeelt proportioneel over de band. `bibliotheekSignatuur` leidt de vorm af over alle 35 archetypes. NIET AANGESLOTEN, en dat is expliciet: twee call-sites, `schema.ts:91` (her-export) en de eigen test; `weekKwaliteitMinuten`, `buildBlokReferent` en `blokDosisNorm` zijn ongemoeid.
- **CC STOPTE OP EEN FOUTE IJK-WAARDE IN HET PROMPT, EN VING DEZELFDE FOUT IN ZIJN EIGEN TEST.** De spec zette anaeroob op 156 door Z5, Z6 en Z7 eerst per zone af te ronden (129 + 27 + 0); de vouwing geeft 156,6000 en dus 157. CC committe niet en stelde de assertie niet bij. Reparatie zit in de VORM, niet in het getal: de rekenlaag geeft onafgerond terug, de assertie's toetsen onafgerond met een tiende minuut tolerantie, en afgeleide waarden ronden één keer uit de onafgeronde som. Zie de nieuwe regel in `docs/WERKWIJZE.md`.
- **DAAN-BESLUIT 29-07-2026: HET DOSIS-TREDE-VOORSTEL WORDT AFGEWEZEN.** Het rekent in de oude munt. Afwijzen legt de blokstart vast zodat het dit blok niet terugkomt; op de volgende blokgrens komt de vraag terug in de nieuwe munt. Gebruikershandeling.
- **OPENSTAAND.** De drempel voor "geleverd" per zone is niet vastgelegd — die volgt uit de norm, niet uit de reeks. · **NIEUW, GEVONDEN OP DAANS SCHERM 29-07-2026 — SWEET SPOT TELT NIET ALS SLEUTELSESSIE.** `COACH_KEY_INTENTS_` (`packages/engine/src/coach.ts:72`) draagt alleen `vo2` en `drempel`, dus een gemiste sweet-spot-sessie valt naar de tak "een aanvullende sessie gemist; je week ligt ruim op koers" en krijgt GEEN inhaalvoorstel, terwijl de `isKey`-tak dat wel biedt. Gemeten geval: MA 27-07, `Sweet Spot over/under 4×(2-3)`, 45 min en 43 TSS. Dat spreekt `DOELEN-SPEC` §3.1 tegen (drempel ÉN sweet-spot dragen de dosis; de sleutelsessies zijn het beschermde deel) en de blok-referent, die sweet spot wel als kwaliteit telt. ENGINE, dus expliciete autorisatie; eigen ronde. · `indoor_ftp` 260 tegen `ftp` 280, eigen post (14 ritten, 637 minuten). · Elke activiteit draagt `icu_power_zones` mee (gemeten [55,75,90,105,120,150,999]), dus een latere zone-wijziging is per rit te herleiden; nu niet gebouwd, wel genoteerd. · Bekend residu: `404 /api/checkin/<datum>` op twee van de acht prod-shots. · De gepland-noemer verschuift terwijl de week vordert.
- **FOCUS VOLGENDE CHAT: fase 1b, de referent en het oordeel aansluiten.** `weekKwaliteitMinuten` per zone, `blokDosisNorm` krijgt zijn vorm uit `bibliotheekSignatuur`, `buildBlokReferent` levert gevraagd en geleverd PER ZONE en oordeelt zonder compensatie tussen zones, en de blok-review-copy noemt de diagnose in plaats van alleen "niet geleverd" — de bruikbare boodschap is "verkeerde intensiteit", niet "dosis omhoog". Reken erop dat de coach daarna in veruit de meeste weken niet-geleverd meldt; dat is de gecorrigeerde diagnose, geen strengere lat. CLIENT-ONLY, geen engine-autorisatie nodig, geen migratie. Verifieer met de shot-harness plus Daans oog. Daarna fase 2, de zone-sync. Verse chat.

**DE DOSIS-MUNT IS GEMETEN — HET PLAN VRAAGT 26 PROCENT Z3, DE UITVOERING LEVERT 54 (juli 2026).** Twee docs-commits: meetdata `e0d4593`, recon-doc `7a0b789`. GEEN code, geen engine, geen client, geen migratie en geen enkele D1-MUTATIE; wel vier read-only SELECTs (elke response `rows_written` 0 en `changed_db` false) plus drie read-only GET's op intervals.icu. Prod ONVERANDERD: Worker Version `3ea25f61-52e2-44a9-8fdd-cc48508797d0`; `0007` blijft de laatste remote. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30445648587>). `git diff --stat HEAD~1 -- packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 722 over 60 bestanden · engine-selftest-assert-count 1358.** Lees ze uit de suite; hardcode ze nooit.
- **DE BEVINDING STAAT IN ÉÉN VERHOUDING, en volledig in de zones die intervals zelf levert.** Het plan, gebucket op `power_zones [55,75,90,105,120,150,999]`, vraagt over alle 35 archetypes Z3 251 tegen Z4+ 723 — 26 tegen 74 procent. De uitvoering levert Z3 2014 tegen Z4+ 1743 — 54 tegen 46. NUL van de 35 archetypes schrijft werkminuten onder 84% FTP voor; de grijze band bestaat in het plan niet en wordt in de uitvoering volledig als kwaliteit geteld.
- **HET OORDEEL KANTELT, HET IS GEEN NUANCE.** `weekKwaliteitMinuten` telt vandaag alles vanaf 76% FTP (`high` = Z3+Z4, plus `anaerobic`). Over 46 weken met ritten halen er 24 de norm van 84; vanaf 84% FTP geteld zijn dat er hoogstens 8 en minstens 3, en zestien weken kantelen met zekerheid van GELEVERD naar NIET GELEVERD. Van de 3757 geboekte kwaliteitsminuten ligt 1068 tot 1687 onder 84% FTP (28 tot 45 procent). GEVOLG: waar de blok-check "geleverd maar niet gestegen, dus dosis omhoog" concludeerde, luidt het antwoord in de juiste munt meestal "niet geleverd, dus dosis NIET omhoog" (`DOELEN-SPEC` §2A).
- **DE NORM VAN 84 IS NIET TE HOOG — de teller was te gul.** Het plan bevat werkelijk circa 28 minuten boven 84% per sleutelsessie. In Daans zones komt de norm neer op circa 62 minuten Z4+ per week; geleverd is de mediaan 31 en halen 6 van de 46 weken die 62.
- **SS IS EEN OVERLAY EN BLIJFT UIT ELKE SOM.** Op alle 173 rijen met geldige blob geldt SS kleiner dan of gelijk aan Z3+Z4, en Z1..Z7 sommeert tot de ritduur binnen 30 seconden. SS loopt bovendien van 84 tot 97 en dus dwars over de Z3/Z4-grens op 90; intervals levert die splitsing niet, dus SS kan geen zesde band worden. Hoogstens later een diagnostisch label.
- **GEEN ENKELE WIJZIGING AAN INTERVALS NODIG (Daan-correctie, dragend).** Er lagen drie routes op tafel om de Z3-onbeslisbaarheid weg te nemen — custom zones, de zone-grenzen verzetten, ritstreams ophalen. Alle drie overbodig: zodra gevraagd en geleverd PER ZONE naast elkaar staan verschijnt grijs rijden als een Z3-overschot mét een Z4-tekort, en hoeft Z3 niet gesplitst te worden. Zie de nieuwe regel in `docs/WERKWIJZE.md`.
- **HET INSTRUMENT IS VOORAF GEVALIDEERD.** De dump is gevouwen met `weekKwaliteitMinuten` uit `apps/web/src/lib/blok.ts` — de functie die de app zelf aanroept, gebundeld met esbuild buiten de repo-tree onder TZ=Europe/Amsterdam. Op het venster van 26 weken vanaf 19-01-2026 reproduceert hij `UITVOERINGS-REFERENT-RECON` §7: mediaan 76 tegen de daar genoteerde 77,5, maximum 248 exact gelijk.
- **VIER CORRECTIES OP EERDERE CLAIMS IN DIT DOCUMENT.** (1) "Het plan schrijft NUL tempo voor" gold voor één weekvorm; zeven sweetspot-sjablonen zetten 100 procent van hun werkminuten in `tempo`, precies de korte van 34 tot 56 minuten — de Onderhoud-winterband. (2) De oorzaak is een afrondingsgrens, geen trainingskeuze: `expandArchetype_` rondt het midden af vóór `pctZoneBucket_`, dus 88-92 geeft 90 en tempo, 88-93 geeft 90,5 en daarmee 91 en drempel. Datzelfde punt zit in de TSS, want `tssFromBlokken_` weegt tempo 1,14 en drempel 1,35. (3) Het commentaar bij `ZONE_TSS_RATE_` klopt over de GRENZEN — die vallen samen met de gemeten `power_zones`; onwaar is uitsluitend dat `tryPowerZoneTimes_` Z1..Z7 identiek opvouwt, want die vouwt naar DRIE buckets. (4) Sweet spot is 84-97, niet 88-97.
- **NIEUWE POST — `indoor_ftp` 260 TEGEN `ftp` 280.** Intervals scoort een indoor-rit tegen 260 terwijl het plan zijn watts uit 280 rekent, dus dezelfde sessie landt indoor een zone hoger. In deze reeks 14 ritten en 637 minuten. Klein maar systematisch; eigen post.
- **OPENSTAAND, ONGEWIJZIGD.** Het dosis-trede-voorstel staat nog open op Daans blok en rekent in de OUDE munt — niet accepteren vóór deze correctie. · Bekend residu: `404 /api/checkin/<datum>` op twee van de acht prod-shots. · De gepland-noemer verschuift terwijl de week vordert (V24 bevriest een voorbije dag).
- **FOCUS VOLGENDE CHAT: het ontwerp van de zone-munt, op `docs/DOSIS-MUNT-RECON.md` §8.** De zones komen uit de sport-settings van de gebruiker zelf en worden een gesynchroniseerde instelling, net als FTP; het plan wordt op diezelfde grenzen gebucket (een mapping op de bestaande `pctLo`/`pctHi`, geen nieuwe data); gevraagd en geleverd komen per zone naast elkaar, nooit als saldo. Een nieuwe gebruiker brengt zijn eigen zones mee — niets per gebruiker met de hand vast te leggen. EERST de blast radius uit §9: `zoneDebt_` (`packages/engine/src/weekprep.ts`), de dekking- en doneHard-afleidingen in `apps/web/src/lib/proposal.ts`, `LOAD_TSS_RATE_`, en of `actualZone5_` (`apps/web/src/lib/schema.ts`) met de blok-referent samengaat. Raakt `DOELEN-SPEC` §2A en de ENGINE, dus expliciete autorisatie. Verse chat.

**DE DAGKAART-FIX IS LIVE — EEN GEMISTE SLEUTELSESSIE HEET NIET LANGER RUSTDAG (juli 2026).** Prod NU Worker Version `3ea25f61-52e2-44a9-8fdd-cc48508797d0`, gebouwd vanaf `34f135ce` (was `38e185df-f28c-4d00-947e-b8d6e8c65906`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-DhfmNVUO.js`), 63 ongewijzigd. Bouw-commits `fa994f4` (harness, fase 1) en `34f135c` (fix, fase 2), plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30433157115>). GEEN migratie en geen enkel wrangler-d1-commando; **`0007` blijft de laatste remote**. CLIENT-ONLY, `git diff --stat` op `packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 722 over 60 bestanden · engine-selftest-assert-count 1358** (van 715/60; selftest ONGEWIJZIGD, geen engine geraakt). Lees ze uit de suite; hardcode ze nooit.
- **DE WORTEL ZAT OP VIER PLEKKEN, NIET TWEE.** `assignWorkouts` bouwt `sessions` alleen voor `tePlannen`, dus een verstreken dag heeft er nul. Naast de bekende twee — de `gemist`-tak die `hasSessions` eiste (`schema.ts:1166`) en de rustdag-copy (`SchemaView.tsx:397`) — leunden ook het rustdag-streepje op de dagstrip (`DayStrip.tsx:24`) en `canDispose` (`SchemaView.tsx:145`) op diezelfde lengte. Gevolg van die vierde: de "Niet gedaan?"-knop verdween zodra een dag verstreek, dus de reden was per constructie alleen op de dag zelf in te vullen, en een gedisponeerde dag viel de dag erna terug naar "Rustdag". DERDE keer dat deze wortel maar half is gerepareerd; nu alle vier tegelijk.
- **DE FIX IS ÉÉN AFGELEIDE.** `planSessions` op `SchemaDay`, één keer berekend in `deriveSchemaView`: `sessions` als die er zijn, anders de bevroren `plannedForDone` als één sessie, en alleen boven nul minuten — dezelfde nul-conditie die de weekkaart al hanteerde, zodat week en dag per constructie niet uiteen kunnen lopen. De weektelling leunt nu op diezelfde afgeleide; de bestaande WeekLoad-tests bleven groen ZONDER aanpassing. Gemist-conditie werd `heeftPlan && (dispositie || isVerstreken)`. `canDispose` leeft als `canDisposeDay` in de lib. De gemist-tak rendert `GemistCard` plus de gemiste sessie via een uit de render-lus getrokken `SessieBlok`, gedeeld met de planned-tak.
- **DE PROMPT HAD EEN FOUT, CC CORRIGEERDE HEM.** De opdracht schreef de rustdag-copy aan state `rest` te hangen. Dat brak vandaag-zonder-trainingsdag: die draagt state `today`, verloor zijn copy en rendeerde niets. De rustdag-copy is geen STATE maar een AFWEZIGHEID van plan, en die komt in twee states voor. Juiste conditie: `planSessions.length === 0`. Zie de nieuwe regel in `docs/WERKWIJZE.md`.
- **GEMETEN OP PROD, DAANS EIGEN DATA, WO 29-07.** De casus was aanwezig: MA 27 en DI 28 verstreken trainingsdagen zonder rit, nergens een "Voltooid". Weekkaart 345 TSS / 6:45 / 4 dagen tegen de zeven dagkaarten samen 43+52+52+198 = 345 TSS, 45+60+60+240 = 405 min, 4 dagen — EXACT gelijk op alle drie de stats. Vóór de fix stond hier 348 / 6:45 / 4 tegen 305 / 360 min / 3. MA 27 toont "NIET GEREDEN" met `Sweet Spot over/under 4×(2-3)` 45 min 43 TSS en zonebalk; DI 28 met `Sweet Spot 3×8` 60 min 52 TSS. Beide dragen stippen op de strip.
- **DE HARNESS IS DETERMINISTISCH; ZIJN INVOER NIET.** Twee runs back-to-back op dezelfde HEAD gaven 40 van 40 identiek op bytecount én sha256. Een eerdere waarneming van acht afwijkende shots in de vooruit-scenario's reproduceerde onder gecontroleerde meting NIET — die vergelijking liep over runs met werk ertussen dat de lokale D1 raakte. Alle 32 vooruit-shots zijn wél byte-identiek.
- **DE PIXELDIFF IS EEN BEGRENZINGSBEWIJS.** Binnen `v7-midweek` beweegt uitsluitend CSS x 39-105 / y 505-511 (280 pixels, de twee dagstrip-indicatoren; op ZO 140 omdat de strip half weggescrold is) en op ma en di y 505-1132 (755643 en 725596 pixels, de hele dagkaart). Alle 32 andere shots byte-identiek. Dat toont niet alleen DAT de fix werkt maar dat hij niets anders raakt — per pixel in plaats van per oog.
- **NIEUW OP DE PARKEERLIJST — DE GEPLAND-NOEMER VERSCHUIFT TERWIJL DE WEEK VORDERT.** Gereconstrueerd uit de twee prod-metingen (niet apart gemeten): DI 28 telde als live-render 55 TSS en als bevroren entry 52, vandaar 348 → 345. Zelfde fenomeen als de 119 tegen 120 nominale minuten in fase 1. Het is BEDOELD — V24 bevriest een voorbije dag juist zodat zijn watt-targets niet met terugwerkende kracht meeschuiven — maar het gevolg is dat "gepland" binnen één week niet stabiel is. Vandaag 3 op 348; accepteer je een dosis-trede, dan mengt die noemer twee dosis-niveaus en is het geen procent meer.
- **OPENSTAAND, GEEN BOUW.** Het dosis-trede-voorstel staat nog open en onaangeraakt: 28 naar 30 minuten per sleutelsessie, met "Ja, naar 30 min" en "Nee, hou 28 min". Gebruikershandeling. · Bekend residu, ongewijzigd: `404 /api/checkin/<datum>` op twee van de acht prod-shots.
- **DE MUNT-ASYMMETRIE IS BREDER DAN "Z3 EN Z4 GEVOUWEN" (gelezen in de bron, niet gemeten).** Het PLAN rekent in VIJF zones met elk een eigen op eigen ritten geijkt tarief (`pctZoneBucket_` en `ZONE_TSS_RATE_`, `zones.ts`): rust 0,60 · z2 0,73 · tempo 1,14 · drempel 1,35 · anaeroob 3,08 per minuut, grenzen rust <56 / z2 56-75 / tempo 76-90 / drempel 91-105 / anaeroob >105 %FTP. De GEREDEN rit komt binnen in DRIE (`tryPowerZoneTimes_` → `actualZoneMinutes_`): Z1-Z2 naar `low`, Z3-Z4 naar `high`, Z5-Z7 naar `anaerobic`. De blok-referent telt geleverde kwaliteit als `high + anaerobic` (`blok.ts:209`), dus gereden tempo en gereden drempel zijn al één pot vóór de vergelijking met het plan. LET OP: het commentaar bij `ZONE_TSS_RATE_` claimt dat de vijf grenzen samenvallen met wat intervals meet en dat plan en rit "langs dezelfde meetlat gaan" — dat is ONWAAR en moet mee in de fix.
- **INTERVALS LEVERT EEN EIGEN SS-BUCKET EN CADANS GOOIT DIE WEG.** `tryPowerZoneTimes_` skipt elke zone-id buiten Z1-Z7, met de commentaarregel "'SS' en overlays → undefined → skip"; `selftest.test.ts:3506` legt dat vast met een fixture `{ id: "SS", secs: 90 }`. Sweet spot is bij doel FTP geen bijzaak maar ruggengraat (`DOELEN-SPEC` §3.1) en ligt rond 88-97% FTP, dus deels in tempo en deels in drempel — "Z3 eruit" is daarom GEEN oplossing, dat draait de fout alleen om. EERSTE MEETSTAP, vóór enig ontwerp: is `SS` ADDITIEF of een OVERLAY? Ligt sweetspottijd óók al in Z3 en Z4, dan is optellen dubbeltellen. Te beslechten door per rit de som van de zone-secs tegen de ritduur te leggen; de RAUWE blob staat al in D1 (`activities.zone_times_json`, "icu_zone_times als JSON-blob"), dus GEEN nieuwe sync en GEEN backfill nodig — het is een weggegooide vouwing, geen ontbrekende data. Daan-norm, dragend: elke zone moet op zijn eigen manier gevuld worden, zodat gereden en gepland langs dezelfde indeling vergeleken worden.
- **FOCUS VOLGENDE CHAT: de dosis-munt, recon-first.** Waarom dit vóór de andere posten gaat: élk mechanisme dat "geleverd" leest — blok-check, dosis-trede, inhaal-kaart — meet in deze valuta, en de trede vermenigvuldigt hem. Zolang tempo als drempel telt kan de app "geleverd maar niet gestegen" concluderen en dosisverhoging voorschrijven, terwijl de werkelijke diagnose "verkeerde intensiteit" is. GEMETEN CONTEXT die daarbij past: het plan schreef over een blok 159 kwaliteitsminuten voor tegen 416 geleverd (factor 2,6) terwijl de CTL zakte en `rolling_ftp` niet meebewoog. Er staat NU een dosis-trede open op Daans blok, dus dit is het slechtste moment om de munt te laten staan. Volgorde: eerst de SS-meting hierboven, dan pas een ontwerp; raakt `DOELEN-SPEC` §2A (dosis-doel-eenheid) en waarschijnlijk de ENGINE, dus expliciete autorisatie. Verse chat.

**STAP 2 LIVE — DE DOSIS-TREDE HOUDT DE BLOK-CONCLUSIE VAST (juli 2026).** Prod NU Worker Version `38e185df-f28c-4d00-947e-b8d6e8c65906`, gebouwd vanaf `860a95f1` (was `197257cf-1beb-4329-82d3-294370332476`). 3 assets vervangen (`/index.html`, `/sw.js`, `/assets/index-CYMm5gHz.js`), 63 ongewijzigd. Migratie `0007_useful_johnny_storm.sql` is REMOTE toegepast, 4 commando's — **`0007` is nu de laatste remote**, niet meer `0006`. Bouw-commits `9fbd242` (harness), `e789857` (engine), `5b6a5cd` (data), `860a95f` (client), plus deze close-out. CI success op alle vier (laatste run <https://github.com/daanhhk/Cadans/actions/runs/30390665167>).
- **VLOEREN NU: vitest-totaal 715 over 60 bestanden · engine-selftest-assert-count 1358** (van 690/58 en 1337). Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** De trede telt in MINUTEN PER SLEUTELSESSIE (FTP 28, stap 2, plafond 4) en tilt norm en plan met DEZELFDE factor op. `KWALITEIT_MIN_PER_PRIKKEL` is naar de ENGINE verhuisd (`utils.ts`) omdat de factor (basis + stap × trede) / basis is: staat de basis client-zijde en de factor engine-zijde, dan leeft die invariant nergens. Stap en plafond staan expliciet als BELEID gelabeld — er valt niets te ijken aan "hoeveel mag de dosis per blok omhoog".
- **DE SEAM.** Optionele trailing parameter, NIET op `settings` (config uit D1) maar als runtime-state, idioom van `mesoWeekOverride`. Vier voed-plekken: `buildWorkout` → ctx → `expandArchetype_` én → `renderVariant_`; `buildOverrideWorkout_` op BEIDE takken; en de `plannedForDone`-tak die de gedaan-vergelijking bouwt — die vierde vond CC zelf, en zonder hem meet de vergelijking tegen een LAGERE dosis dan het plan voorschreef. De catalogus-aanroepen (trainingsbibliotheek in `planner.ts`, `library.ts`) blijven NOMINAAL: een keuzelijst hoort niet gepersonaliseerd te renderen.
- **DE LADDER, GEMETEN VIA `buildWeekProposal`** (in fase 1 onbereikbaar, daar per plek gemeten). Trede 0 geeft 93 / 113 / 113 / 105 / 84 / 93 / 90, trede 1 geeft 101 / 121 / 121 / 113 / 90 / 101 / 98, trede 2 geeft 106 / 130 / 129 / 120 / 96 / 106 / 103; normen 84 / 90 / 96. DE REM IS GEASSERTEERD als plan-kleiner-dan-norm: trede 3 laat de krapste vorm op 100 tegen 102, trede 4 op 106 tegen 108. Stijgen mag alleen na "geleverd", dus het mechanisme begrenst zichzelf op de weekvorm die de gebruiker werkelijk rijdt.
- **TREDE 0 IS BYTE-IDENTIEK, end-to-end.** Nul herijkingen: `weekvormAs.test.ts`, de 48 vingerafdrukken in `onderhoudInvariance.test.ts` en `blok.test.ts` zijn onaangeraakt en groen.
- **PERSISTENTIE.** Drie kolommen op `sync_state` plus `GET`/`PUT /api/dosis-trede`, naar het model van `fatigue_shift`. AFWIJZEN schrijft óók de blokstart, zodat het voorstel dit blok niet terugkomt; de volgende blokgrens stelt de vraag opnieuw. Een trede van een ANDER doel leest als 0 — leesregel, geen extra schrijfactie. Op het plafond verschijnt de kaart niet: een voorstel doen dat je niet kunt waarmaken is erger dan zwijgen.
- **DE PROD-SHOT WERKT NU.** Prod staat achter een whole-origin Basic-auth-gate; de harness kreeg `httpCredentials` plus een preflight mét Authorization-header. Wachtwoord uit `CADANS_BASIC_AUTH_PASSWORD` of uit `tools/shots/.prod-auth` (git-ignored); nooit in een prompt, rapport of uitvoer. LET OP: vlak ná een deploy kan de eerste run omvallen op propagatie (`#root > *` niet zichtbaar binnen 60 s) — diagnosticeren, niet blind herhalen.
- **EEN PAGELOAD TEGEN PROD SCHRIJFT DRIE DINGEN, en dat is bewust geaccepteerd.** Twee idempotente intervals-syncs plus één `PUT /api/weekplan/<maandag>`; die laatste stuurt `todayISO` mee en loopt dus via `mergeFrozenWeekplan`, waardoor hij GEEN historie kan herschrijven. BESLUIT: geen read-only-schakelaar bouwen — een harness die een speciale modus fotografeert kan liegen over de normale.
- **LIVE GEVERIFIEERD OP DAANS EIGEN DATA.** Blok 29-06 t/m 26-07 afgerond, drie van drie opbouwweken boven 84, CTL −2,7 → tak `geleverd_niet_gestegen`. De kaart staat direct onder de terugblik met 28 → 30 minuten per sleutelsessie en 84 → 90 per week, noemt expliciet wat NIET verandert, en spreekt de terugblik niet tegen. **OPENSTAAND: Daan heeft nog niet bevestigd of afgewezen.** Dat is een gebruikershandeling, geen bouw.
- **NIEUW OP DE PARKEERLIJST, BOVENAAN — DE DAGKAART TOONT EEN GEMISTE SLEUTELSESSIE ALS RUSTDAG.** Gevonden door de eerste prod-shot: de weekkaart telde 348 TSS / 6:45 / 4 dagen waar de zeven dagkaarten samen 305 / 360 min / 3 dagen dragen. MECHANISME, gelezen in de code: `assignWorkouts` bouwt `sessions` alleen voor `tePlannen` (trainbaar én niet gedaan én datum ≥ vandaag), dus een verstreken dag heeft per constructie nul sessies. De weekkaart is daar TWEE keer voor gerepareerd en valt nu voor alle drie de gepland-stats terug op `plannedForDone`; de DAGKAART heeft die terugval nooit gekregen — `SchemaView` kijkt puur naar `day.sessions.length === 0` en zet dan "Rustdag — van herstel word je beter". De `gemist`-toestand kan er evenmin vuren, want die eist `hasSessions`. Netto feliciteert de coach je met rust op een dag waarop je een sleutelsessie liet liggen, en telt hem tegelijk in de noemer. DERDE keer dat deze wortel maar half is gerepareerd. Client-only, eigen ronde.
- **FOCUS VOLGENDE CHAT: de dagkaart-fix hierboven**, daarna de dosis-munt (`tryPowerZoneTimes_` vouwt Z3 én Z4 tot `high`, dus de meetlat telt tempo als kwaliteit terwijl het plan er nul van voorschrijft — raakt `DOELEN-SPEC` §2A, en een dosis-trede vermenigvuldigt die munt). Verse chat.

**STAP 1B LIVE — PROD LOOPT WEER GELIJK MET MAIN, EN HET RECON-DOC VOOR STAP 2 STAAT (juli 2026).** Prod NU Worker Version `197257cf-1beb-4329-82d3-294370332476`, gebouwd vanaf `cab2ff92` (was `165f3a95-67fe-477e-af42-46294231c4e6`). 3 assets vervangen, 63 ongewijzigd. Recon-doc `docs/DOSIS-TREDE-RECON.md` @ `cab2ff92`. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30374370481>). GEEN migratie en geen enkel wrangler-d1-commando, ook geen read; `0006` blijft de laatste remote.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 690 · engine-selftest-assert-count 1337.** Lees ze uit de suite; hardcode ze nooit.
- **WAT ER LIVE GING.** Alleen `6c4149f` (stap 1b, de allocator weegt plaatsbaarheid en draagkracht boven afstand). Stap 1 stond al live sinds Worker `18a2b4f6`; een eerdere claim in de chat dat beide meegingen was fout. Alles daarna op main is docs en tools.
- **DE DOSIS-TREDE IS ONTWORPEN EN GEMETEN, NIET GEBOUWD.** De trede telt in MINUTEN PER SLEUTELSESSIE (FTP 28, stap 2, plafond 4) en tilt de norm én de geplande werktijd met DEZELFDE factor op — alleen de norm verhogen laat het plan onder zijn eigen meetlat zakken. Landt op de bestaande work-scale, die op TWEE plekken staat (`expandArchetype_` en `renderVariant_`). Gemeten ladder: trede 0 t/m 2 haalt élke weekvorm zijn norm exact (84/90/96), trede 3 en 4 laten de krapste vorm 2 minuten achter — en dat is de REM, want stijgen mag alleen na "geleverd". Persistentie spiegelt `fatigue_shift`: drie kolommen op `sync_state`, migratie `0007`.
- **CC BEOORDEELT DE SHOTS NU ZELF, en dat wierp meteen iets af.** Vier uitspraken op de lokale harness: consistentie weekkaart-tegen-dagkaarten klopt (389/347/367/425, exact gelijk), zonebalken kloppen inclusief de twee pendelsessies, en drie kwaliteitsdagen bij vier of meer trainbare dagen klopt overal — geteld op TSS PER MINUUT (kwaliteit 0,81-0,92, kaal Z2 0,70-0,72), niet op labels. De vierde eis was FOUT GESTELD: "een dag van 135 minuten of langer draagt een kwaliteitssjabloon" houdt op v2 en v4 maar niet op v7, waar de zaterdag van 180 min bewust Z2 blijft omdat hem pakken twee buren kost. Dat is 1b zoals ontworpen; de eis toetste iets wat de ingreep niet kán leveren. Bekend residu: de vier week-shots dragen `404 /api/checkin/<datum>`, het parkeerlijst-item.
- **DE PROD-SHOT IS NIET GELUKT.** De beoordeelde PNG's komen van `127.0.0.1:5173` met de geseede lokale D1, niet van prod. Het gedrag is dus bewezen op MAIN, en prod draait diezelfde commit — maar niet op Daans eigen data.
- **DE PROD-MODUS BESTAAT WEL EN IS ONGEBRUIKT.** `tools/shots/shot.mjs` @ `9246c6b` neemt een doel-URL als enig argument en schakelt dan naar READ-ONLY: geen seed, geen seed-backup, geen enkele niet-GET-aanroep van de harness zelf, geen scenario's, en geen klok-pin — op een live deployment is de echte datum het punt. Zonder argument is het gedrag byte-identiek, gedraaid en geverifieerd op gelijke PNG-bytecounts. Hij is NIET tegen prod gedraaid, en de reden zit niet in de harness: het LADEN van `/schema` is zelf niet read-only. `apps/web/src/pages/Schema.tsx:98` vuurt vanuit een mount-`useEffect` `Promise.allSettled([postSyncActivities(), postSyncWellness()])` — zonder gebruikersactie — en die twee POST's trekken uit intervals.icu en UPSERTEN in D1. Eén pageload tegen prod schrijft dus in de remote database. Vrijmaken vraagt een schakelaar of een expliciete gebruikersactie op dat effect; dat is CLIENT-werk en niet gedaan.
- **NIEUW OP DE PARKEERLIJST — DE DOSIS-MUNT NOEMT DE INTENSITEIT NIET.** `tryPowerZoneTimes_` vouwt Z3 én Z4 samen tot `high`, dus de meetlat telt tempo volledig als kwaliteit. GEMETEN op weekvorm V1 schrijft het plan NUL tempo voor: rust 58 · z2 148 · tempo 0 · drempel 93 · anaeroob 0. Plan en meetlat lopen daar dus uiteen, en een dosis-trede vermenigvuldigt de munt. Eigen ronde; raakt `DOELEN-SPEC` §2A.
- **FOCUS VOLGENDE CHAT: eerst de PROD-SHOT werkend krijgen**, daarna ROADMAP stap 2 bouwen op `docs/DOSIS-TREDE-RECON.md` in drie fases (engine, data, client) met een stop ertussen. Engine-autorisatie op de vier plekken uit §9 is nog NIET gegeven. Verse chat.

**SCREENSHOT-HARNESS AF — CC KAN ZIJN EIGEN WERK ZIEN, DRIE VISUELE CHECKS BEANTWOORD (juli 2026).** Bouw-commits `2325c10` (stap A), `1e3b19b` (stap B), `cfcf4e8` (stap C), plus deze close-out. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30370519825>). Prod ONVERANDERD: Worker Version `165f3a95-67fe-477e-af42-46294231c4e6`. GEEN migratie en geen enkel remote-wrangler-commando; `0006` blijft de laatste remote. CLIENT-gereedschap, `git diff --stat packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 690 · engine-selftest-assert-count 1337.** Deze reeks voegde geen tests toe. Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `tools/shots/shot.mjs` (playwright 1.62.0, Chrome Headless Shell 151, chromium-kanaal). Hij pollt 5173 en 8787, seedt de LOKALE D1 via de API, pint de browser-klok met `page.clock.setFixedTime` op de weekmaandag 08:00, en schiet per scenario de weekkaart plus alle zeven dagkaarten op 390 breed met auto-fit tot 4000. Naast elke PNG een `.txt` met url, viewport, console- en page-errors MET falende URL, de `/api`-request-telling per pad, en de innerText van `main`. Vier scenario's: `v2`, `v4`, `v7`, `v7-pendel`. Output in `tools/shots/out/` (git-ignored); pre-seed-instellingen in `tools/shots/seed-backup.json` (git-ignored).
- **DE DRIE CHECKS, BEANTWOORD OP MAIN — dus INCLUSIEF 1b, NIET op prod.** (1) PENDEL-ZONEBALK: woensdag draagt twee sessies `Pendel + Z2 (40 min)` van 40 minuten en 29 TSS, elk met een eigen effen blauwe zonebalk; de dagstrip zet twee stippen. (2) DUUR-SELECTIEREGEL: op 210 en 240 minuten pakt de zaterdag `Drempel lang 3×14` met een MEERKLEURIGE balk (176 en 198 TSS) — de fallback uit stap 1 doet zijn werk. Op V7 (180 min) blijft de zaterdag `Z2 + hoge cadans`, en dat is GEEN falen maar 1b: greedy de zaterdag pakken kost twee buren, dus de allocator kiest di/vr/zo. (3) DERDE KWALITEITSSLOT: drie kwaliteitsdagen in beide V7-scenario's — di `Drempel ladder 5-7-9` 60', vr `Sweet Spot kort 2×12` 90', zo `Drempel lang 3×14` 120'.
- **DE AS-AFWIJKING IS VARIANT-ROTATIE, GEEN DOSISVERSCHIL (gemeten).** Week-TSS in de app tegen de vingerafdruk: V2 389 tegen 410, V4 347 tegen 362, V7 367 tegen 375; het aantal kwaliteitsdagen is overal 3, gelijk aan de as. De gepinde klok sluit de klok als bron UIT (V7 bleef 367). Chat-zijde nagerekend op de gebundelde engine, eerst gevalideerd doordat de fixture 410 / 362 / 375 en 113 / 105 / 90 exact reproduceert: op V7 verschillen precies TWEE dagen, allebei van SJABLOON en niet van dosis — vrijdag `Drempel over-under 3 sets` 76 TSS werd `Sweet Spot kort 2×12` 73, en zondag `Sweet spot 4×12` 115 werd `Drempel lang 3×14` 110. Samen −8, exact het waargenomen verschil. Op V2 en V4 draait de zaterdag van `Sweet Spot lang 3×20` (187 en 209) naar `Drempel lang 3×14` (176 en 198), −11 per stuk; de overige dagen zijn daar niet per dag nagerekend. OORZAAK: de fixture voedt `activities`, `weekplans` en `wellness` LEEG, de lokale D1 draagt historie, en de recency-seed kiest daardoor andere varianten binnen dezelfde duur-band. DE AS BLIJFT GELDIG als vergelijkbare reeks over bouwen heen, maar is GEEN voorspelling van wat de app toont; een verschil tussen die twee is geen regressie.
- **DE HARNESS HEEFT ZICH DRIE KEER TERUGBETAALD.** Een leesscript dat kwaliteitsdagen telde op de aanwezigheid van een type-label liet de zaterdag stil wegvallen — kaal duurwerk draagt geen label — en dat brak op tegen de PNG. De dagstrip-handles raakten los na de klok-pin (`Element is not attached to the DOM`); ze worden nu per klik opnieuw gelokaliseerd, met een harde assertie op ZEVEN knoppen. En `seed-backup.json` ving bij de eerste run een AL GESEEDE momentopname; hersteld naar `doelStart` 2026-07-08, `pendelDuurMin` 150, `pendelAantal` 1.
- **DE LOKALE D1 DRAAGT NU EEN SEED.** `doelStart` 2026-06-29, `pendelDuurMin` 40, `pendelAantal` 2, plannerweek = het laatst gedraaide scenario. De echte beginstand staat in `tools/shots/seed-backup.json`. Remote D1 ONAANGEROERD.
- **OPENSTAAND — `GET /api/checkin/:datum` GEEFT 404 BIJ AFWEZIGHEID.** Elders is de huisregel 200 met `null` of een lege lijst (`/api/settings`, `/api/planner/:monday`). Cosmetisch — de client vangt het op — maar het is inconsistentie. De request-telling verklaart de "drie keer": StrictMode-dubbelinvoke plus één her-derive na de sync; `/api/settings` 5x = AppShell plus die drie loads. Geen lek.
- **DE WEEKVORM-AS, ONGEWIJZIGD** (geen engine-wijziging deze reeks): kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90 · week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375 · kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3.
- **FOCUS VOLGENDE CHAT: ROADMAP stap 2, de dosis-trede persistent maken.** Vraagt een kolom en dus een migratie — strikte volgorde: migratie eerst, dan `wrangler deploy` vanuit `workers/api` met `pnpm build` ervoor. Bij die deploy gaat `6c4149f` (stap 1b) mee; die staat nog niet live. Daans oog gate't die deploy: de harness bewijst het gedrag op MAIN, niet op prod. Verse chat.

**STAP 1b AF, OP MAIN, NIET GEDEPLOYED (juli 2026).** Bouw-commit `6c4149f6c1a16653b61e7f52ad9a7e6c95265b28`, recon-doc `52f43ca2d9c245d4d3051c04319c41b1ee86eec8`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30343505276>), plus deze close-out. Prod ONVERANDERD: Worker Version `165f3a95-67fe-477e-af42-46294231c4e6`. GEEN migratie en geen enkel wrangler-d1-commando; `0006` blijft de laatste remote.
- **VLOEREN NU: vitest-totaal 690 · engine-selftest-assert-count 1337** (van 689/1329). Lees ze uit de suite; hardcode ze nooit.
- **DE PREMISSE VAN STAP 1b IS WEERLEGD.** De efforts-arm zou alleen in Build of Peak vuren en dus in Base geen kwaliteit op de lange dag kunnen zetten. Twee metingen halen dat omver. De fase-voorwaarde verruimen naar Base is BYTE-IDENTIEK aan de baseline: de arm hangt aan twee voorwaarden en `PROFILES.ftp.spreiding.effortsInLangeRit` is false — alleen `PROFILES.klim` draagt de vlag, dus de ingreep is per constructie inert. Verruimen ÉN de vlag aanzetten laat ELKE weekvorm DALEN, naar 75 / 75 / 75 / 75 / 69 / 75: `combo_long_with_efforts` levert 30 kwaliteitsminuten ongeacht de dagduur en consumeert bovendien een slot.
- **WAT HET WEL WAS.** `pickBestSpread_` koos kwaliteitsdagen op AFSTAND tot de reeds geplaatste dagen en was blind voor draagkracht — in V3 won de zondag van 90 min van de zaterdag van 180, puur omdat hij verder van de maandag lag. Daaronder een tweede vondst: de dosis hing aan de VOLGORDE van de keuzes. Dezelfde drie dagen (ma70 + za180 + do70) gaven 113 kwaliteitsminuten in de volgorde ma>za>do en 87 in ma>do>za. Vier van de zes toen gemeten weekvormen zaten al op hun plafond; alleen V3 liet iets liggen, 36 minuten.
- **DE REGEL.** Geen weekendpaar vormen, dan PLAATSBAARHEID, dan DRAAGKRACHT, dan afstand, dan pendel, dan laagste dagIdx. `gapOK_`, `minGap`, `formsWeekendPair_`, `weekendBlok` en de efforts-arm ongemoeid; de EERSTE keuze byte-identiek, want beide termen doen alleen mee zodra er ankers zijn. Geen enkele nieuwe constante. ENGINE, uitsluitend `allocateQualityWeek_`.
- **HET GREEDY-DEFECT EN DE STOP.** De eerste versie woog alleen draagkracht en liet een lange weekenddag zijn buren blokkeren; CC stopte vóór de commit op `"alloc ftp 3 quality"`, die 2 gaf in plaats van 3. Breder gemeten: 23 cellen minder kwaliteitsminuten en 14 cellen minder kwaliteitsdagen, alle buiten beide meetsets. De plaatsbaarheidsterm haalt dat naar NUL over 195 gemeten cellen, en fixture D komt byte-identiek terug op het baseline-plan — dagIdx 1 en 4 threshold, 6 sweet_spot — zonder één herijking.
- **DE AS DRAAGT NU ZEVEN VORMEN EN DRIE RIJEN.** Kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90 · week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375 · kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. Alle zeven halen de norm van 84 bij vijf gedeclareerde uren. V7 (di60 vr90 za180 zo120) is de vorm waarin een lange weekenddag zijn buren blokkeert; die familie zat in geen van beide meetsets en juist daar zat het defect. V6 en V7 staan NIET in de invariant-lijst. Deze reeks hoort bij ELKE bouw opnieuw in dit document.
- **HERIJKT.** 30 van de 48 `onderhoudInvariance`-vingerafdrukken: 22 omhoog in minuten, 0 omlaag in minuten, 0 omlaag in dagen — geteld tegen een ZELF-GEVALIDEERDE nulmeting (de probe gaf 0 verschillen met EXPECTED op de ongewijzigde engine vóór hij als meetinstrument werd gebruikt). De INVARIANT bleef zonder aanpassing groen. In de selftest is `noAdjacent` gelijkgetrokken met `gapOK_` — aaneengesloten mag zodra beide dagen weekend zijn én het profiel `weekendBlok` draagt — en is de weekendpaar-assertie vervangen door drie GEMETEN asserties.
- **OPENSTAAND — DRIE VISUELE CHECKS, ONGEWIJZIGD.** De pendel-zonebalk, de duur-selectieregel op een lange dag, en het derde kwaliteitsslot. Alle drie live, geen enkele gezien.
- **FOCUS VOLGENDE CHAT: de headless screenshot-harness, VÓÓR stap 2.** Er staan drie visuele checks open en stap 2 vraagt een migratie plus een deploy; dat is het verkeerde moment om er nog iets blinds bij te zetten. Daarna stap 2, de dosis-trede. Richting staat in `docs/ROADMAP.md`. Verse chat.

**TWEE DEPLOYS DEZE CHAT, ALLEBEI LIVE (juli 2026).** Prod draait Worker Version `165f3a95-67fe-477e-af42-46294231c4e6`, gebouwd vanaf `f020c2ab` — het derde kwaliteitsslot in Base. Daarvóór `18a2b4f6-b83d-4734-8447-52b6f6d5f8f9` vanaf `b8100bd5`, dat ROADMAP stap 1 live bracht (bouw-commit `ff2baf8`, de duur-selectieregel); en daarvóór `6e8e244e`. GEEN migratie en geen enkel wrangler-d1-commando deze hele chat, ook geen read; `0006` blijft de laatste remote.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 689 · engine-selftest-assert-count 1329.** Lees ze uit de suite; hardcode ze nooit.
- **DE WEEKVORM-AS DRAAGT NU ZES VORMEN.** V6 meet een week IN UITVOERING met een gemiste maandag: beschikbaar ma60 di60 do60 za120, klok op dinsdag, maandag verstreken zonder rit. Reden: V1 t/m V5 liggen allemaal volledig vooruit, dus de normale situatie werd nergens gemeten. V6 op de ongewijzigde engine: 69 kwaliteitsminuten en 212 week-TSS — dezelfde kwaliteit als V1 ondanks een dag minder, want de slots verhuizen; de verloren TSS is het duurwerk van de maandag. Reeks na het quotum: kwaliteitsminuten 93 / 113 / 77 / 105 / 84 / 93, week-TSS 268 / 410 / 437 / 362 / 352 / 227. De INVARIANT (V1, V3, V5 mogen niet zakken) is niet aangeraakt en bleef groen. Commits `7b26d27` (de as) en `f020c2a` (het quotum).
- **HET QUOTUM IS DE HENDEL, EN DAT IS GEMETEN.** `PROFILES.ftp.kwaliteitPerWeek.Base` van 2 naar 3 — dat ene veld is de hele engine-wijziging. `spreiding.midweekMinGap` is bij quotum 3 NIET bindend: meting B (quotum 3 plus `midweekMinGap` 0) was byte-identiek aan meting A (quotum 3 alleen). Verantwoording: `DOELEN-SPEC` §3.1 schrijft vanaf vijf gedeclareerde uren drie sleutelprikkels voor, en de meetlat (`blokDosisNorm`) rekent daar al mee, terwijl de planner er in Base twee plande. Dit repareert dus een inconsistentie TUSSEN twee delen van de app; het is geen met de hand gekozen dosisregel.
- **HET NORM-GAT IS DICHT VOOR VIJF VAN DE ZES.** De norm bij vijf gedeclareerde uren is 84. V3 blijft op 77: ook mét een derde slot pakt de lange dag geen kwaliteitsslot. Dat is precies wat er van stap 1b overblijft. `kwaliteitPerWeek.Peak` staat voor FTP óók nog op 2 en draagt hetzelfde gat; niet geraakt, want Base was de gemeten fase.
- **HERIJKTE ASSERTIES, drie bij naam.** Selftest `"stap7: volle quality-quota geplaatst (Base 2)"` naar `(Base 3)`, waarde 2 naar 3 — de naam pinde het quotum letterlijk. `onderhoudInvariance`: 4 van de 48 vingerafdrukken, precies de vier FTP-Base-rijen (`kort-winter-3x60`, `lange-rit-weekend`, `winterweek-45`, `gemengd`), alle vier met andere zones én andere archetype-keuze; in code bewezen vóór het overschrijven dat geen niet-FTP- of niet-Base-rij bewoog. En de `weekvormAs`-vingerafdruk.
- **FIXTURE-CORRECTIE (CC, dragend).** Twee asserties in `quotaAftrek.test.ts` vielen om die GEEN hardcoded getal dragen — relationele mechanisme-checks, dus herijken was geen optie. Oorzaak: de "rustige" fixture is puur Z2 maar erfde de standaard-IF 0,85 van `act()`, en `recentHardDate_` noemt een rit hard vanaf IF 0,85; die blokkeerde dus de dinsdag via avoid-consecutive-hard. Bij quotum 2 vielen de tellingen toevallig samen en slaagde de test om de VERKEERDE reden. Gemeten met IF 0,65 levert de rustige rit weer 3 vooruit-harde dagen, identiek aan geen rit: het anti-stapel-mechanisme is intact en de fixture was zelftegensprekend. Fixture gecorrigeerd, assertie niet verzwakt.
- **NORM-CORRECTIE (Daan, dragend).** De gedeclareerde uren zijn een GEGEVEN. De app stelt de best mogelijke training voor BINNEN die uren en vraagt niet om meer tijd; wat een extra uur zou opleveren is hoogstens eenmalige informatie, nooit een terugkerende vraag. Dit staat al als VASTGESTELD in `docs/DOELEN-SPEC.md` regel 89 en werd deze chat opnieuw ter discussie gesteld — zie de opener-wijziging in `docs/WERKWIJZE.md`.
- **OPENSTAAND — DRIE VISUELE CHECKS.** De pendel-zonebalk, de duur-selectieregel op een lange dag, en het derde kwaliteitsslot. Alle drie live, alle drie nog niet met eigen ogen gezien. Hard refresh of incognito i.v.m. de SW-cache.
- **FOCUS VOLGENDE CHAT: ROADMAP stap 1b afmaken.** Ook met een derde slot pakt de lange dag geen kwaliteitsslot en blijft V3 op 77, onder de norm van 84. Daarna stap 2. Richting staat in `docs/ROADMAP.md`, niet hier. Verse chat.

**PROD DRAAIT WORKER VERSION `6e8e244e-bbec-4e34-9a88-1f74e086e645`**, gebouwd vanaf `d45bd0dc`. De
geijkte pendel- en taperweging is daarmee LIVE: een pendel van 75 min telt 55 TSS in plaats van 45,
van 150 min 110 in plaats van 90, en `taper_z2_kort` van 45 min 33 in plaats van 27. Pendeldagen
dragen nu ook een zonebalk. Geen migratie, `0006` blijft de laatste remote.

**STAP 1 IS GEBOUWD MAAR NIET GEDEPLOYED.** Bouw-commit `ff2baf8`, docs `23f367f`. Het duur-plafond
in de kandidaat-filter van `goalWorkout_` BLIJFT staan — binnen de bibliotheek-band doet het echt
werk, het weert korte sjablonen van middellange dagen — en krijgt er een fallback boven. Levert de
filter nul kandidaten, dan volgt een tweede pass zonder plafond, langste band eerst en bij gelijke
band het zwaarste sjabloon. Een dag boven de band kiest dus voortaan het sjabloon dat voor de
langste ritten is ontworpen, in plaats van door te vallen naar duurwerk zonder kwaliteit.

- **GEMETEN OP DE WEEKVORM-AS.** Kwaliteitsminuten 69 / 45 / 45 / 45 / 64 werd 69 / 81 / 45 / 81 /
  64; week-TSS 253 / 364 / 362 / 321 / 340 werd 253 / 391 / 362 / 347 / 340. V1, V3 en V5 zijn tot
  op de minuut én tot op de TSS ongewijzigd — de fallback vuurt nergens binnen de band. V2 en V4
  kiezen op de lange dag `sweetspot_long` met 60 nominale werkminuten.
- **NUL VAN DE 48 VINGERAFDRUKKEN VERSCHOVEN.** Geen weekvorm daar komt boven 135 minuten, dus de
  fallback kan ze per constructie niet raken. Twee selftest-assertions zijn wél herijkt — "kiPlug
  goalWO-null trip-fallback" en "sim >135min trip-fallback" — omdat ze het DEFECT pinden: dat een
  dag boven de band doorviel naar `long_z2`. Beide dragen nu de reden in commentaar.
- **VLOEREN NU: vitest-totaal 689 · engine-selftest-assert-count 1329.** Lees ze uit de suite;
  hardcode ze nooit.
- **DE WEEKVORM-AS IS NU EEN TEST** — `apps/web/src/lib/weekvormAs.test.ts`. Twee soorten assertie,
  en het verschil is opzettelijk: een HARDE invariant dat V1, V3 en V5 niet mogen dalen (die wordt
  NIET herijkt; valt hij om, dan is de wijziging fout), en de volledige reeks als vingerafdruk (die
  mag bewust herijkt worden, mits de invariant staat en de richting verantwoord is). Deze reeks
  hoort bij ELKE bouw opnieuw in dit document.
- **DE CTL-SIMULATIE IS OPNIEUW GEDRAAID**, op de geijkte weging inclusief pendel, en vooraf geijkt
  op twee onafhankelijk gemeten eindwaarden. De weging reproduceert de gemeten jaar-TSS binnen 1,0
  procent — model 15195 tegen gemeten 15345 — en Daans eigen 5-uursweken leveren een plateau-CTL
  van 39,2 tot 45,7 tegen een gemeten CTL van 45,7. Uitkomst: het niveau houden tot AGR vraagt
  ongeveer 8 uur per week zonder pendel, en ongeveer 7 uur met drie pendeldagen. De eerdere
  conclusie van negen uur houdt geen stand. Wel blijft er een gat tussen plan en uitvoering: het
  plan levert 44 tot 49 TSS per uur waar de werkelijke uitvoering 57,7 haalt, en bij vijf uur
  letterlijk het plan volgen komt de CTL uit op 33,6 tegen 42,6 nu.
- **HERSTELD — de verantwoording van de blokken-versus-intent-splitsing.** TSS komt uit `blokken`,
  de dosis-valuta blijft `intent`. Dat rust op de meting dat beide DEZELFDE minuten dragen:
  `blokken` teruggevouwen via `ARCHETYPE_LOAD_FROM_BUCKET_` is gelijk aan `intent`, en de
  blokminuten tellen op tot `totaalMin`. Chat-zijde gemeten over 2950 renderingen, CC-zijde over
  1020 op de duurRange-grenzen — nul afwijkingen aan beide kanten, en elke rendering draagt
  blokken. De assert staat als `testBlokkenDekkenIntent` in de suite. Deze meting was bij een
  eerdere close-out uit dit document verdwenen toen het STAND-blok werd vervangen in plaats van
  aangevuld; ze staat hier terug omdat de hele ontwerpkeuze eraan hangt.
- **RICHTING STAAT IN `docs/ROADMAP.md`**, niet meer hier. Dit document draagt de STAND. Alle
  openstaande punten staan in de parkeerlijst daar; stap 1 is AF, stap 1b tot en met 4 staan open.

**STAP 7 — DE D1-IJKING BINNEN + BOUWITEM 2 STAP 1 EN 3 OP MAIN, NIET GEDEPLOYED (juli 2026).** Meting `add0bd4` (`docs/STAP7-IJKING.sql` + `docs/STAP7-IJKING-DATA.md`), engine-commit `e6b3e4a`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30264597144>), plus deze close-out. Prod ONVERANDERD: Worker Version `6bd05cd2-6aea-4b71-95de-81a226e74dd4`. GEEN migratie; `0006` blijft de laatste remote. De meting was een read-only SELECT: elke response meldde `rows_written` 0 en `changed_db` false.
- **VLOEREN NU: vitest-totaal 683 · engine-selftest-assert-count 1260** (van 682/1245; +15 in het nieuwe `testStap7Hekken`). Lees ze uit de suite; hardcode ze nooit.
- **DE TSS-WEGING IS GEIJKT OP EIGEN RITTEN — 204 ritten, 266 uur, R² 0,99.** Kleinste kwadraten door de oorsprong op de kruisproducten uit `docs/STAP7-IJKING-DATA.md`. Tarieven per minuut met standaardfout: rust 0,60 ± 0,05 · z2 0,73 ± 0,02 · tempo 1,14 ± 0,06 · drempel 1,35 ± 0,08 · anaeroob 3,08 ± 0,11. In de huidige drie buckets: low 0,695 ± 0,014 · high 1,208 ± 0,037 · anaerobic 3,045 ± 0,100. **De gedeployde weging 0,70 / 0,95 / 1,05 staat 19,3% te laag over de hele reeks** — per band van −13,8% tot −27,4%, het diepst op harde en op korte ritten. Dat is meer dan de 17,6% die §6 van het bouw-recon schatte.
- **DE DRIE OPEN VRAGEN UIT §6 ZIJN BESLECHT.** (1) De LAGE bucket klopte al: gemeten 0,695 tegen de gedeployde 0,70. (2) De kandidaat-constanten zijn allebei mis, in TEGENGESTELDE richting: 1,35 is precies goed voor DREMPEL maar te hoog voor de gemengde high-bucket (1,21), en 2,20 is voor anaeroob veel te laag (3,05). (3) Het meng-bezwaar is echt maar klein op déze mix: de vijf-zone-fit haalt RMSE 8,26 tegen 8,42 voor drie buckets. De uitweg is niet een compromisgetal maar de SPLITSING — `pctZoneBucket_` berekent de vijf buckets al per blok en de grenzen vallen samen met de zones waarop intervals.icu meet, dus elke bucket kan zijn eigen gemeten tarief krijgen.
- **DE "EXACTE" KWADRATISCHE REFERENTIE IS NIET EXACT.** §6 ijkte tegen minuten × IF² × 1,6667 en noemde dat de waarheid. Tegen de werkelijk gemeten TSS staat die referentie zelf 5 tot 10% te laag (afhankelijk van het aangenomen Z1-midden). Mechanisme: NP middelt over 30 seconden, dus belasting LEKT naar de makkelijke minuten rond een blok. De fit laat dat lek zien — rust en anaeroob komen HOGER uit dan hun steady-waarde, drempel LAGER (1,35 tegen 1,60 steady). De grondwaarheid is de gemeten TSS, niet de formule; een geplande sessie moet gewogen worden met wat hij in de praktijk oplevert.
- **WAT ER GEBOUWD IS (ENGINE, geautoriseerd, `packages/engine/src/planner.ts`).** HEK 1: de kale `long_z2`-pre-claim in `allocateQualityWeek_` stap 1 is VERVALLEN, inclusief het bijbehorende `cov.low`. De EFFORTS-arm blijft en vuurt nu expliciet alleen bij `langeRitPerWeek >= 1` én `spreiding.effortsInLangeRit` én fase Build of Peak — die consumeert een slot (`remaining--`) en is dus een plaatsing, geen hek. HEK 3: `demote_recent_hard` slaat over voor elke dag waarvan het FINALE type uit de allocator-tak komt, bijgehouden met een vlag `uitAllocator` die alléén in die tak wordt gezet — bewust niet op de kale aanwezigheid van een `quotaPlan`-entry, zodat een taper- of testdag niet mee-exempt raakt (CC-afwijking, strikt beter dan de prompt).
- **GEMETEN VOOR EN NA, drie fixtures.** A (FTP, Base, mesoweek 1, ma60/di60/do60/za120): 2 dagen en 45,0 kwaliteitsminuten → 2 dagen en 69,0, exact de voorspelling uit §2 van het bouw-recon. B (Beklimmingen, Build, za150+zo120 plus twee weekdagen): ONVERANDERD 3 dagen en 65,0 — hek 3 is daar INERT, want de allocator had ruimte genoeg en plaatste di en do, dus er ontstond nooit een aaneensluiting. B' (alleen het weekend trainbaar, zodat aaneensluiting wél moet): 1 dag en 30,0 minuten met zondag op `long_z2`/`demote_recent_hard` → 2 dagen en 72,0 met zondag op `threshold`/`key_session`. **B' is de winterweek-casus: hek 3 kostte daar een hele kwaliteitsdag.** CC rapporteerde B ongewijzigd en zette B' ernaast in plaats van de fixture naar het antwoord toe te schrijven.
- **DE ENDURANCE-FILL MAAKT DE TWEE LEZINGEN GELIJK (gevonden bij review, dragend).** `allocateQualityWeek_` heeft een VIERDE sectie die élke resterende eligible dag alsnog claimt met rol `endurance` (`long_z2`, pendel → `pendel_z2`). Gevolg 1: in een Base/Build/Peak-week draagt iedere trainbare dag een allocator-entry, dus de nauwe regel ("niet oordelen over wat de allocator plaatste") valt in de praktijk samen met de letterlijke recon-formulering ("beperk tot cross-week"). Gevolg 2: de CROSS-WEEK bescherming loopt in zo'n week nu via `gapOK_`, dat `recentHardDate` als anker meeneemt met de `midweekMinGap` van het PROFIEL — fijner dan de vaste afstand van één dag die de demotie hanteerde. Buiten alloc-actieve weken (Test, event-recovery) blijft de demotie volledig staan. Gevolg 3: **de lange rit kan niet verdwijnen** — een dag waarvoor `goalWorkout_` niets vindt wordt op `skip` gezet zonder `remaining` te verbruiken en valt daarna in de endurance-fill.
- **HERIJKINGEN, alle drie gemeld.** `selftest.test.ts`: "alloc Base longride role" van `longride` naar `endurance`, 1-op-1. `apps/web/src/lib/redenCode.test.ts`: de assertie op `long_ride` is omgedraaid naar "komt niet meer voor" — die rol bestaat niet meer. `apps/web/src/lib/onderhoudInvariance.test.ts`: 10 van de 48 vingerafdrukken gewijzigd, alle tien MÉT een andere zone-verdeling. Dat is de bedoelde uitwerking (een andere dag draagt de kwaliteit), geen drift — maar LET OP: die test is daarmee opnieuw geijkt tegen de GEWIJZIGDE engine en bewijst voor déze wijziging niets. Het bewijs zijn de drie fixtures hierboven; de test bewaakt vanaf nu weer vooruit.
- **NORM-CORRECTIE (Daan, dragend) — een dosisregel valt niet te ijken op gedrag dat je wilt vervangen.** §9 punt 4 van `docs/STAP7-BOUW12-RECON.md` wees de selectieregel voor een lange dag toe aan de D1-meting. ONJUIST: Daan trainde vóór Cadans op gevoel, dus die ritten zijn een verslag van de oude gewoonte, deels groepsritten en een evenement. Een regel die daarop fit laat de coach die gewoonte reproduceren en noemt dat een norm. Het ontbreekt bovendien aan het tegenvoorbeeld: dezelfde vier uur is nooit met een andere invulling gereden, dus over wat BETER werkt zegt de reeks niets. De selectieregel komt daarom uit de COACH-CANON, dezelfde categorie als de testfrequentie (`WERKWIJZE.md`, beleid tegenover geijkte drempels). Wat de meting wél levert is een BOVENGRENS-check: 45 tot 130 minuten Z3+ in een lange rit is aantoonbaar verteerd, dus een voorstel van 20 minuten op een rit van vier uur is niet voorzichtig maar te weinig.
- **OPENSTAAND — STAP 2 EN 4 REIZEN SAMEN.** Het duur-plafond in de kandidaat-filter van `goalWorkout_` is BEWUST blijven staan. Eraf halen zonder selectieregel laat de tie-break (oplopend op `duurRange[0]`) het KORTSTE sjabloon winnen, dus een dag van vier uur krijgt 24 minuten drempel — een met de hand gekozen dosisregel via de achterdeur, wat §10 verbiedt. Bouw ze als één stap.
- **OPENSTAAND — KLEINE SCHULD UIT DEZE RONDE.** De `longride`-tak in de redenCode-mapping van `planner.ts` is dood maar blijft staan (viel buiten de twee geautoriseerde plekken). En het nieuwe commentaar bij de demotie zegt dat de cross-week bescherming daar blijft gelden; dat is in een alloc-actieve week niet meer waar (die loopt via `gapOK_`) — regel aanscherpen bij de volgende aanraking.
- **OPENSTAAND (geërfd, niet geraakt).** `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (ENGINE; sprong 28-03-2027) · `pendel_z2`, `pendel_intervals` en `recovery` geven `intent: null` en lege blokken maar dragen wél TSS, dus op een pendeldag telt de dosis-valuta nul · de fase staat volledig in het teken van het event (`eventFase_`, STAP7-RECON §6) · UP-fixture in `Preview.tsx` realistischer maken · weken-terug-scrollen in de Schema-tab · gat-dag-types via meegegeven datum (ENGINE) · `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE) · de weekreeks-fixture staat op drie plekken.
- **FOCUS VOLGENDE CHAT: de TSS-weging rechtzetten (bouwvolgorde 1), met `docs/STAP7-IJKING-DATA.md` ernaast.** Recon-first op de blast radius: `tssFromZoneMinutes_` wordt op vijf plekken aangeroepen en `intent` is óók de DOSIS-VALUTA uit DOELEN-SPEC §2A, dus de weging losknippen van de intent-buckets is de eerste ontwerpvraag. Richting: TSS uit de vijf `pctZoneBucket_`-buckets per blok met de gemeten tarieven, intent ongemoeid als drie-bucket dosis-eenheid. ENGINE, expliciete autorisatie, selftest-vloer stijgt mee. Verse chat.

**STAP 7 BOUWITEM 1 EN 2, MEETRONDE AF — GEEN code, de klem is geïsoleerd (juli 2026).** Deze chat = meetronde plus twee docs-besluiten. Recon-doc `docs/STAP7-BOUW12-RECON.md`. Docs-only; prod ONVERANDERD: Worker Version `6bd05cd2-6aea-4b71-95de-81a226e74dd4`. GEEN migratie; `0006` blijft de laatste remote. `git diff --stat packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 682 · engine-selftest-assert-count 1245.** Lees ze uit de suite; hardcode ze nooit.
- **DE VORIGE DIAGNOSE IS WEERLEGD.** `docs/STAP7-RECON.md` §3 wees `goalWorkout_`/`goalPickIntent_` aan als de derde-prikkel-klem. ONJUIST: vier achtereenvolgende aanroepen leveren probleemloos drempel, sweetspot, drempel, sweetspot met steeds een ander sjabloon. De klem bestaat uit DRIE GESTAPELDE HEKKEN. (1) De LANGE-RIT-PRE-CLAIM: `allocateQualityWeek_` stap 1 geeft de langste trainbare niet-pendeldag aan `long_z2` en haalt hem uit de pool zonder `remaining` te verlagen. GEMETEN op dezelfde week (ma60/di60/do60/za120, doel FTP, mesoweek 1): baseline 45 kwaliteitsminuten op 2 dagen · claim weg bij quotum 2 → 69 op 2 dagen · claim weg bij quotum 3 → 93 op 3 dagen · quotum 3 MÉT de claim → 45 op 2, dus inert. (2) `gapOK_` met `midweekMinGap` 1 eist twee dagen tussenruimte. (3) `demote_recent_hard` zet NA de allocator een toegewezen kwaliteitsdag terug naar `long_z2` op een vaste afstand van één dag die het profiel negeert — die gooit de derde prikkel weg die de allocator wél plaatste. Dáárom mat elke hendel bovenstrooms inert.
- **DE OMKERING FTP-TEGEN-ONDERHOUD IS ÉÉN PROFIELVELD.** `PROFILES.onderhoud.langeRitPerWeek` is 0, `PROFILES.ftp.langeRitPerWeek` is 1. Dat verklaart volledig waarom het onderhoudsdoel bijna twee keer zo hard traint als het doel dat de FTP moet verhogen. Geen dosisregel, geen weging.
- **DE ONDERHOUD-VERWATERING IS DE 135-MINUTEN-BLINDEVLEK.** De archetype-bibliotheek loopt van 33 tot 135 minuten; de kandidaat-filter in `goalWorkout_` eist `beschikbareTijd <= duurRange[1]`, dus bij 180 minuten kwalificeren NUL van de 35 sjablonen en valt de dag door naar duurwerk. Gemeten: za 120 geeft 87 kwaliteitsminuten op 3 dagen, za 180 geeft er 45 op 2. Zelfde blindevlek als de geparkeerde T17 fase 2, nu als directe oorzaak gemeten.
- **DE VULLING BESTAAT AL — het is een SELECTIEPOORT, geen ontbrekende functie.** De Z2-FILL WERKT AL: `expandArchetype_` met een `doelMin` ver boven `duurRange[1]` levert een correcte sessie — gemeten op 120, 180 én 240 minuten blijven de kwaliteitsblokken ongewijzigd (high 24 bij `threshold_2x12`, 30 bij `sweetspot_2x15`), groeit alleen de low-vulling mee en landt het totaal exact op `doelMin`, zonder `tooLong`. Zonder plafond kwalificeren 35 van 35. LET OP de bekende regressie: de tie-break sorteert OPLOPEND op `duurRange[0]`, dus met het plafond eraf wint het KORTSTE sjabloon en krijgt een dag van vier uur 24 minuten drempel.
- **NORM VASTGELEGD IN `docs/DOELEN-SPEC.md` §2A (Daan-besluit).** DE GEBRUIKER LEVERT UITSLUITEND BESCHIKBARE TIJD; DE APP BEPAALT DE INHOUD. Duur is een eigenschap van de dag, geen voorschrift voor de inhoud — 120, 180 of 240 minuten mag intensiteit dragen. ER BESTAAT GEEN BESCHERMDE LANGE RIT; het enige vaste element is de HEENRIT VAN DE PENDEL, en die is beschermd omdat het een VERPLAATSING is, geen trainingskeuze. Die norm was meermaals in chats gegeven en nooit vastgelegd; nu is het een `git diff`, geen gevoel.
- **OPEN EN BEWUST NIET INGEVULD.** Twee dingen zijn met opzet NIET gekozen: de SELECTIEREGEL voor een lange dag (welke inhoud hoort bij 120, 180 of 240 minuten) en de TSS-WEGING. Allebei worden ze GEIJKT op de D1-meting en de coach-canon, niet met de hand vastgesteld — ook niet door Daan en ook niet in een chat. Dat staat nu als norm in DOELEN-SPEC §2A en als §10 in het bouw-recon: een met de hand gekozen dosis- of selectieregel hoort niet in de docs en niet in de code.
- **TSS-WEGING: BESLUIT UITGESTELD.** Gemeten over de 35 sjablonen tegen de exacte kwadratische referentie (minuten × IF² × 1,6667): de huidige weging staat 17,6% te laag (spreiding −27% tot −7%), de kandidaat-constanten 0,70/1,35/2,20 staan 3,3% te hoog (−9% tot +16%). Op de weekvorm van 2026-06-29: nu 220, constanten 247, exact 248. Maar de `low`-bucket mengt rust met z2 (factor 1,6) en `high` mengt tempo met drempel, dus ÉÉN tarief per bucket kan niet voor beide kloppen — de juiste waarde hangt af van de mix. Vastleggen pas ná de ijking op eigen ritten; zonder ijkpunt meet een model zijn eigen aannames (`WERKWIJZE.md`).
- **BIJVANGST.** `pendel_z2`, `pendel_intervals` en `recovery` geven `intent: null` en een leeg `blokken`-array maar dragen wél TSS. Op een pendeldag telt de dosis-valuta dus nul, terwijl DOELEN-SPEC tijd-in-zone als dosis-eenheid aanwijst. Raakt de uitvoerings-referent en de blok-norm.
- **FOCUS VOLGENDE CHAT: de D1-IJKING** — read-only SELECT op `activities` (`zone_times_json` tegen de gemeten `tss`, met `duur_min`), de mapping zonetijd→TSS gefit op de echte ritten met de gemeten TSS als grondwaarheid. Daarna bouwitem 2, stap 1 t/m 3 uit `docs/STAP7-BOUW12-RECON.md` §9: pre-claim eruit, duur-plafond eruit, `demote_recent_hard` beperken tot de cross-week bescherming. Stap 4 (de selectieregel) pas ná de ijking. ENGINE, dus expliciete autorisatie; selftest-vloer stijgt mee. Verse chat.

**STAP 7 RECON AF — de diagnose is verschoven, bouw nog niet begonnen (juli 2026).** Deze chat = meetronde, GEEN code. Recon-doc `docs/STAP7-RECON.md` @ `5b46dfa`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30256316970>). Docs-only; prod ONVERANDERD: Worker Version `6bd05cd2-6aea-4b71-95de-81a226e74dd4`. GEEN migratie; `0006` blijft de laatste remote. `git diff --stat packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 682 · engine-selftest-assert-count 1245.** Lees ze uit de suite; hardcode ze nooit.
- **DE HANGENDE BELOFTE IS EEN SYMPTOOM, NIET DE ZIEKTE.** Stap 7 begon als "de terugblik belooft dosis en er is geen mechanisme". Die belofte staat er nog, maar de meetronde legde drie diepere oorzaken bloot; de bouwvolgorde is daarop herzien (recon-doc §9). Volledige cijfers in het doc; hieronder alleen wat dragend is.
- **DE TSS-WEGING ONDERSCHAT KWALITEITSWERK (§4, ENGINE).** `tssFromZoneMinutes_` (`zones.ts`) rekent low×0,70 + high×0,95 + anaerobic×1,05 per minuut. Echte TSS is kwadratisch: low 0,70 KLOPT, high hoort circa 1,35 (30% te laag), anaerobic circa 2,20 (52% te laag). GEVALIDEERD: met de juiste weging reproduceert Daans werkelijke week (circa 6 uur, 110 min in Z3+) circa 324 TSS en dus CTL circa 46 — zijn gemeten CTL is 45,7. Raakt de weekkaart gepland-vs-gedaan, de projectie-laag en élke simulatie.
- **DE DOSIS PER DOEL STAAT OMGEKEERD (§5, ENGINE).** Kwaliteitsminuten op een winterweek: FTP 3u/5u/8u geeft 34/45/45 bij 2 kwaliteitsdagen — alle extra tijd gaat naar Z2. Onderhoud 3u/4u/5u/6u/8u geeft 59/87/87/66/69 bij 3 dagen. Het ONDERHOUDSdoel traint dus bijna twee keer zo hard als het doel dat de FTP moet VERHOGEN (87 tegen 45 bij vijf uur). Dat is de wortel van "Cadans schrijft te licht voor". Tweede anomalie: Onderhoud zakt van 87 naar 66 tussen vijf en zes uur — extra tijd VERWATERT de sleutelsessie in plaats van er Z2 omheen te leggen, het omgekeerde van de schaarste-regel.
- **DE DERDE PRIKKEL KOMT ER NIET UIT (§3).** Het plan geeft 45,0/48,5/51,8/12,6 kwaliteits-intentminuten over de vier blokweken (reproduceert `UITVOERINGS-REFERENT-RECON` §2.6 onafhankelijk), tegen een norm van 84. `PROFILES.ftp.kwaliteitPerWeek.Base` van 2 naar 3 verandert NIETS — ook niet met vijf trainbare dagen, ook niet met `midweekMinGap` 0. De patch komt wél aan (quotum 1 geeft 1 dag, 21,0 min). De klem zit NA quotum en spreiding, in `goalWorkout_`/`goalPickIntent_`. NIET GEISOLEERD.
- **DE FASE STAAT VOLLEDIG IN HET TEKEN VAN HET EVENT (§6).** Twee klokken: de MESOCYCLUS werkt (week-TSS 220/223/223/172, 3:1 cyclisch, los van het event); de MACRO-FASE niet. `eventFase_` telt kaal de weken tot AGR: Base t/m 2027-02-15, Build vanaf 2027-02-22, Peak vanaf 2027-03-22 — dertig weken ononderbroken Base terwijl er acht maanden eigen doelen op de rol staan.
- **TWEE KAARTEN, ÉÉN VENSTER (§1 en §2).** In blokweek 4 is `blokReviewVenster.ctlAnker` GELIJK aan de weekmaandag, dus het fatigue-pad en de terugblik lezen exact dezelfde `computeBlockCtlDelta`. Gemeten op 20-07: `fatigueTrigger` → `up` én `blokCheck` → `geleverd_niet_gestegen`, en `SchemaView` onderdrukt de terugblik niet. Van de zes bereikbare copy-combinaties zijn er TWEE inhoudelijk strijdig; alle zes eindigen op een dosis-instructie zonder knop. Extra: de UP-actie zet `mesoWeek` op 1 = de LAAGSTE opbouwtrede.
- **GAS IS GESLOTEN (§7, Daan-besluit).** GAS schaalt PERCENTAGES met de mesoweek (`adj(p) = round(p × mesoFactor) + faseOffset`, Base −2): een drempelinterval van 95-102% komt in opbouwweek 3 op 107-115% FTP = 300-322 W bij FTP 280. Het GAS `PROFILES.ftp` is voor de rest IDENTIEK aan Cadans; het verschil zit UITSLUITEND in die intensiteitshendel. Cadans' fork is correct (M74-M78). Er wordt niet meer met GAS vergeleken. GEVOLG: de norm van 84 is geijkt op een reeks uit het OUDE regime, deels op GAS-sessies boven 110% — die lat meet niet wat Cadans voorschrijft.
- **DAAN-BESLUITEN (§8).** Hij VOLGT het voorgestelde plan; uitgangspunt voor alle bouw is dat elke gebruiker dat doet. December en januari doel Onderhoud: minder uren, HOGERE kwaliteitsdichtheid — "zwaarder" = meer tijd-in-zone per uur, NOOIT een hoger percentage. Incidentele extra uren worden Z2; sleutelsessies blijven staan. De app MAG voorstellen wanneer de event-aanloop begint, Daan bevestigt. NIEUW: **EVENT als DOEL-optie**, zodat de overname een keuze is in plaats van een aftelling — kan mee in de openstaande doel-lijst-herziening. DAGLUS-EIS: sleutelsessie gepland en Z2 gereden → de coach meldt ná de rit wat dat betekent en herschikt de week om de sessie in te halen.
- **HERZIENE BOUWVOLGORDE (§9).** 1) TSS-weging rechtzetten (ENGINE) — zolang die scheef staat liegt elke meter. 2) Dosis per doel herijken: de derde-prikkel-klem isoleren, FTP zwaarder dan Onderhoud, extra uren als Z2-residu (ENGINE). 3) Fase loskoppelen van het event, EVENT-doel, overname als voorstel (ENGINE, raakt DOELEN-SPEC). 4) Daglus voor de gemiste sleutelsessie. 5) Dosis-trede persistent maken (migratie) — de oorspronkelijke belofte. 6) Eén stem: doortrain-kaart en terugblik samenvoegen.
- **OPENSTAAND (§10).** De derde-prikkel-klem is NIET geisoleerd · de Onderhoud-verwatering tussen 5 en 6 uur is NIET geisoleerd · het besluit uit Onderhoud-soft deel A dat een event-gedreven fase de Onderhoud-pin OVERLEEFT werkt tegen de winterwens in en moet via `DOELEN-SPEC.md` herzien · de uitvoerings-norm moet herankeren op de sleutelsessies (DOELEN-SPEC §3.1 schrijft dat al voor; de weeknorm uit gedeclareerde uren is een afwijking) · de CTL-simulatie in §6 moet opnieuw met de gecorrigeerde weging.
- **OPENSTAAND (geërfd, niet geraakt).** `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (ENGINE; sprong 28-03-2027, drie weken vóór AGR) · UP-fixture in `Preview.tsx` realistischer maken · weken-terug-scrollen in de Schema-tab · gat-dag-types via meegegeven datum (ENGINE) · `DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE) · de weekreeks-fixture staat op drie plekken.
- **FOCUS VOLGENDE CHAT: bouwvolgorde 1 en 2** — de TSS-weging en de dosis-klem. Die twee bepalen alle andere metingen. ENGINE, dus recon-first en expliciete autorisatie; selftest-vloer stijgt mee. Verse chat.

**STAP 5b-ii AF — het TESTVOORSTEL, LIVE (juli 2026).** Bouw-commits `0edf83e` (kaart + pure laag + shared-contract), `b12515b` (resultaat-regel aangesloten), `e16e470` (sprong als derde meetbron); docs `980f214` en deze close-out. Prod NU Worker Version `6bd05cd2-6aea-4b71-95de-81a226e74dd4` (was `6b2a7c7d-e6a7-4c4b-8324-8f7b0c6cfc0f`, daarvóór `d7f2e75b-14ee-4750-9c96-c05b0ed25eac`). GEEN migratie en geen enkel wrangler-d1-commando deze reeks; `0006` blijft de laatste remote. CLIENT-ONLY, `git diff --stat packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 682 · engine-selftest-assert-count 1245** (van 638/1245; engine ONAANGEROERD). Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `"test"` is toegevoegd aan `OVERRIDE_WORKOUT_TYPES` (`packages/shared`); de worker-validatie leest diezelfde lijst, er bleek GEEN tweede plek te bestaan. De trainingskiezer is ONGEMOEID: die leest `TRAINING_CATS_` uit de engine, en die zes categorieën zijn nu een DEELVERZAMELING van het override-domein. `apps/web/src/lib/testvoorstel.ts` draagt zeven poorten in volgorde van "mag het" naar "past het": rustweek (blokweek 4), doel met effect-meter, geen bestaande test in het blokvenster, geen A/B-wedstrijd binnen 28 dagen, kandidaat-dagen, dagkeuze, meetinterval. `TestVoorstelCard` schrijft via de bestaande override-keten; afwijzen hangt op BLOKSTART, niet op datum. De kaart staat ná de inhaal-kaart en vóór de terugblik, onderdrukt zolang een fatigue-voorstel `offer` is.
- **DE DREMPELS ZIJN BELEID, GEEN GEIJKTE SIGNALEN.** `TEST_INTERVAL_DAGEN=90`, `WEDSTRIJD_HORIZON_DAGEN=28`, `TEST_MIN_BESCHIKBAAR_MIN=60`, `TEST_DUUR_MIN=60`. Daan-besluit over meetfrequentie: hoogstens drie à vier metingen per jaar, want een test kost een zware dag en vier weken is te kort om winst te zien. Het plateau-criterium uit `WERKWIJZE.md` is hier NIET van toepassing — er valt niets te ijken aan "hoe vaak wil ik testen". Herzien gebeurt met Daan, niet op een reeks.
- **DE INTERVALPOORT MEET NAAR DE TESTDATUM, niet naar de weekmaandag.** Vastgelegd in een ijk-test op echte getallen: laatste meting 21-05-2026, blokstart 27-07, rustweek 17-08 → aanbod op zaterdag 22-08, 93 dagen. Toetsen op de weekmaandag geeft 88 en zou het aanbod onderdrukken. De vraag is hoe lang het geleden is op het moment dát je test.
- **DERDE MEETBRON: DE SPRONG IN DE REEKS ZELF (Daan-correctie, dragend).** De rit van 21-05 was GEEN wedstrijd maar een rit tijdens een fietsvakantie en staat dus niet in de events-agenda — terwijl hij wel het laatste echte maximum droeg. `sprongDagen` (`effect.ts`) neemt per datum het maximum van `rolling_ftp`, vergelijkt met de VORIGE dag-met-waarde (niet met het all-time maximum: de reeks daalt over het jaar, dus 21-05 op 272 zou onzichtbaar blijven achter 13-01 op 276) en markeert een verschil vanaf `ROLLING_FTP_STIJGING_W`. Twee ritten op één dag tellen als één dag (21-05: 07:23 op 261, 16:23 op 272). `laatsteGelegenheid` telt die mee als bron `inspanning`, rangorde test > race > inspanning bij gelijke datum, zonder de gereden-poort (een sprong impliceert een rit). Op de gepubliceerde weekreeks vindt de detector precies twee dagen.
- **DE GRENS DIE DAARBIJ HOORT.** De sprong voedt UITSLUITEND het meetinterval. `blokGelegenheid` en `buildEffectReferent` zijn ONGEWIJZIGD, en dat is de kern, geen nalatigheid: zou een sprong zelf de gelegenheid zijn, dan is "geen sprong" per definitie "geen gelegenheid" en kan `niet_gestegen` nooit meer vuren. De bestaande blokGelegenheid-tests bleven zonder aanpassing groen.
- **DE COPY STELT GEEN VRAAG MEER.** De `niet_meetbaar`-pool eindigde op "zullen we een test inplannen?" terwijl er geen knop was, en die vraag keerde elk blok terug. Nu: constatering, wanneer er voor het laatst een maximum viel, en dat de coach in een rustweek zelf met een voorstel komt — ZONDER voorspelde datum, want die schuift zodra er een wedstrijd bijkomt. Bij bron `inspanning` noemt de coach GEEN ritsoort: hij weet niet wat voor rit het was, alleen dat de meter omhoogging.
- **LES — GETEST IS NIET AANGESLOTEN.** `testResultaat` is in `0edf83e` geschreven, geëxporteerd en in isolatie getest, maar nergens aangeroepen; er faalde niets en het viel niet op. Gerepareerd in `b12515b`. Zie de nieuwe regel in `docs/WERKWIJZE.md`.
- **OPENSTAAND — VISUELE CHECK: GEDAAN 27-07-2026.** Daans screenshot toont de nieuwe effect-regel met de datum 21 mei, dus de keten van ritdata via `sprongDagen` naar het meetinterval is LIVE BEWEZEN. Het AANBOD zelf is pas te zien in de rustweek van 17-08-2026; `/preview` draagt de fixture (dev-server, niet in de prod-bundel).
- **OPENSTAAND — RESTGAT, bewust.** Ging Daan vol maar zette hij géén nieuw maximum, dan ziet de app dat niet. Onvermijdelijk zonder invoer, en de veilige kant (zwijgen boven verkeerd concluderen). Wie zo'n dag wél wil laten meetellen, zet 'm als wedstrijd of trip in de agenda.
- **GEMETEN OP HET SCHERM (27-07, Daans screenshot) — DE TWEEDE HANGENDE BELOFTE.** Diezelfde kaart legt het volgende gat bloot: de uitvoerings-helft eindigt op "het plan was te licht. Er mag dit blok meer dosis in", en er is geen enkel mechanisme dat die dosis verhoogt — 5a-ii NOEMT de term, toepassen op de norm van het volgende blok vraagt persistentie. Dat is exact hetzelfde patroon als de zojuist gesloten "zullen we een test inplannen?" zonder knop: een belofte zonder afmaking. Stap 7 gaat dus niet alleen over TOON maar over die belofte waarmaken; behandel het als de kern van die stap, niet als bijvangst.
- **OPENSTAAND — STAP 7, CONSOLIDATIE VAN DE COACHSTEM.** Ongewijzigd de volgende grote stap: de doortrain-kaart en de terugblik lezen hetzelfde ΔCTL-signaal en spreken in verschillende toon over hetzelfde blok. Nu de terugblik-copy is herschreven, is dit het laatste stuk coachlogica.
- **OPENSTAAND (geërfd, niet geraakt).** `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (ENGINE, autorisatie nodig; sprong 28-03-2027) · UP-fixture in `Preview.tsx` realistischer maken · weken-terug-scrollen in de Schema-tab · gat-dag-types via meegegeven datum (ENGINE) · `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE) · de weekreeks-fixture staat op drie plekken (`effect.test.ts`, `testvoorstel.test.ts`, `Preview.tsx`).
- **FOCUS VOLGENDE CHAT: stap 7**, de consolidatie van de coachstem. Verse chat.

**STAP 5b-i AF — de EFFECT-REFERENT op `rolling_ftp`, LIVE (juli 2026).** Bouw-commit `6fe2b1c` (pure laag + wiring + kaart), `93f5a51` (plateau-toets op het app-raster), `06b168b` (preview-fixtures); docs `257e8ac` en `e4c4a73`. Prod NU Worker Version `d7f2e75b-14ee-4750-9c96-c05b0ed25eac` (was `a51baec3-88cd-4f76-91f7-32f1044bc0b4`, daarvóór `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd`). De deploy vanaf `93f5a51` bracht **5a + 5a-ii + 5b-i tegelijk** live — die stonden alle drie ongedeployed op main. GEEN migratie en geen enkel wrangler-d1-commando deze reeks; `0006` blijft de laatste remote. CLIENT-ONLY, `git diff --stat packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 638 · engine-selftest-assert-count 1245** (van 612/1245; engine ONAANGEROERD). Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `apps/web/src/lib/effect.ts` draagt de meter (`rolling_ftp`, `idx14`, ÉÉN reeks door alle sporttypes heen), de aggregatie maximum-binnen-blok minus instapniveau, de dekkingspoort (3 van 4 blokweken gevuld), de gelegenheid-detectie en de drie uitkomsten. Twee HARDE POORTEN in `buildBlokReview`: effect wordt alleen gevuld in fase "afgerond" (blokweek 1 — in blokweek 4 is het vier-weeks venster nog niet compleet) én alleen als de uitvoering GELEVERD is (M5: uitvoering eerst). Vier copy-pools plus `blokReviewNarrative` in `coachNarrative.ts`; `blokReviewRegel` bleef ongewijzigd geëxporteerd. De kaart kreeg een rolling-FTP-regel met instap, maximum en de bron plus datum van de gelegenheid.
- **§9a BESLECHT — GELEGENHEID.** Een blok bevatte een gelegenheid tot een maximum als de app die zelf INPLANDE (een geaccepteerd testvoorstel, 5b-ii) óf als er een wedstrijd van prioriteit A of B in de events-agenda stond, én die dag ook echt gereden is (minstens 15 minuten, `CYCLING_TYPES`). Geen aantoonbare gelegenheid → uitkomst "niet_meetbaar": de app ZWIJGT over effect en stelt een test voor. De bewijslast ligt bij de gelegenheid, niet bij de afwezigheid. Een STIJGING telt altijd, ook zonder bekende gelegenheid — de detector mag bewijs nooit onderdrukken.
- **§9b BESLECHT — DE DOSIS-TERM VOLGT DE PROCESMETER.** Bij "niet_gestegen" mét gelegenheid: steeg de CTL over het blok, dan bouwde de belasting wél op en was de kwaliteitsdosis te licht → term **tijd-in-zone** (§3.1 schrijft voor FTP tussenstappen in tijd-in-zone voor). Steeg de CTL niet, dan bouwde het blok geen belasting op en is méér drempeltijd de verkéérde voorschrijving → term **volume** (lange rit, week-kJ). Drempel is `NO_BUILD_CTL_DELTA` uit `fatigue.ts`, geen eigen getal. 5b-i NOEMT de term; hem toepassen op de norm van het volgende blok vraagt persistentie en is een latere stap.
- **DE PLATEAU-CLAIM: HET ONTWERP HAD GELIJK, DE CORRECTIE MAAKTE HET STUK.** Twee foute enumeraties kostten een bouwronde. Een sweep over élke maandag als kandidaat-blokstart meet de gevoeligheid voor de RASTERFASE, niet voor de drempel, en geeft per constructie geen plateau (negen blokken bij +1 tot vier bij +7). Een eigen lus van 28 dagen verankerd op een willekeurig blok gaf een plateau van +1..+6, maar bevatte het ijk-blok `2026-06-29` uit §8 niet eens. DEFINITIEF, geënumereerd via `blokStartVoorWeek` op de rasterfase van `doelStart` 2026-06-29: drempel +1 t/m +8 wijst steeds dezelfde twee blokken aan — `2026-01-12` (instap 267 → 276, +9, de indoor test van 13-01) en `2026-05-04` (264 → 272, +8, de wegwedstrijd van 21-05); bij +9 valt de tweede af. **De drempel van 3 watt lag onder alle drie de lezingen midden op het plateau, dus de gedeployde logica is nooit geraakt.**
- **GEIJKT OP ECHTE DATA.** De referent reproduceert §8 van het ontwerpdoc op de weekreeks uit §4 van `docs/EFFECT-REFERENT-RECON.md`: blok 2026-06-29 instap 269, maximum 267, verschil −2, vier gevulde weken; blok 2026-01-12 +9 op drie gevulde weken; blok 2026-05-04 +8 op vier. De toets draait op de 39 gepubliceerde weken; de vijftien ontbrekende weken kunnen de grenzen niet verschuiven, want de reeks draagt in totaal maar twee stijgingen en beide liggen binnen het venster.
- **WAT DE KAART TOONT.** Op 26-07 (blokweek 4, fase "lopend") geverifieerd op Daans scherm: vier weekregels 110/84, 97/84, 117/84 groen en 20-07 gedempt op 91/50 (norm 84 × mesoFactor 0,60), en GEEN rolling-FTP-regel — de fase-poort werkt. VERWACHT op 27-07 (blokweek 1, fase "afgerond"), zelfde blok 29-06 → 26-07: dezelfde kaart mét de regel 269 → 267 en uitkomst "niet_meetbaar" — er stond geen test of wedstrijd in dit blok, dus de coach doet er geen uitspraak over en stelt een test voor. **Die visuele check staat nog open.**
- **OPENSTAAND — STAP 5b-ii, het TESTVOORSTEL.** Zonder dit is uitkomst 2 in de praktijk onbereikbaar en zegt de kaart vrijwel altijd "geen gelegenheid, plan een test". Vereist: `"test"` toevoegen aan `OVERRIDE_WORKOUT_TYPES` in `packages/shared` plus de worker-validatie, en een kaart naar het model van `VerlengCard` die met één tik een test-override in blokweek 4 zet. GEEN engine-wijziging en GEEN migratie: `buildWorkout("test", …)` bestaat al en levert voor doel FTP de 20-minutentest van 60 minuten totaal; er is geen `test`-variantenpool, dus hij valt door naar de doel-bibliotheek. De `test`-tak van `blokGelegenheid` staat al gebouwd maar SLAPEND; `workoutType` wordt daar defensief als string gelezen.
- **OPENSTAAND — STAP 7, CONSOLIDATIE VAN DE COACHSTEM.** Twee kaarten spreken nu over hetzelfde blok op grond van hetzelfde signaal. De doortrain-kaart en de terugblik lezen allebei ΔCTL over 20-07 min 22 dagen en tonen allebei 2,7; op de preview-fixture met stijgende CTL viert de uitvoerings-helft "dat is precies wat een blok hoort te doen — dit blok mag er een trede bij" terwijl de effect-helft zegt dat de kwaliteitsdosis te licht was. Niet strijdig (proces steeg, uitkomst niet) maar dissonant: lof plus tekortkoming in één kaart, en beide concluderen "dosis omhoog". De 5a-ii-copy is geschreven toen de effect-laag nog niet bestond en vierde de procesmeter als eindoordeel. Een coach zegt dit als één zin. Dit is de "twee lussen in plaats van vijf drempels" uit `DOELEN-SPEC.md` §2A.
- **OPENSTAAND — SCHULD UIT DEZE RONDE.** De weekreeks uit §4 staat nu TWEE keer in de codebase (`effect.test.ts` en `Preview.tsx`); testcode is niet importeerbaar vanuit app-code, dus dat was bewust. En `/preview` is DEV-GATED en zit NIET in de prod-bundel — de tweede deploy meldde "No updated asset files to upload" en was byte-identiek. Preview-fixtures zijn dus alleen via de dev-server te bekijken, niet op prod; dat scheelt een deploy die niets doet.
- **OPENSTAAND (geërfd, niet geraakt).** `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (ENGINE, autorisatie nodig; eerstvolgende sprong 28-03-2027, drie weken vóór het A-event) · UP-fixture in `Preview.tsx` realistischer maken · weken-terug-scrollen in de Schema-tab · gat-dag-types via meegegeven datum (ENGINE) · `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE).
- **FOCUS VOLGENDE CHAT: stap 5b-ii bouwen** (het testvoorstel), na Daans visuele check van de "afgerond"-kaart op 27-07. Daarna stap 7. Verse chat.

**FTP-BEVINDING GESLOTEN + STAP 5B ONTWORPEN — docs-only, prod ONVERANDERD (juli 2026).** Commits `342d704` (FTP-recon + correctie), `682b058` (5b-ontwerp) en deze close-out. Prod ONVERANDERD: Worker Version `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd`. GEEN migratie; `0006` blijft de laatste remote. `git diff --stat packages/engine` leeg. VLOEREN ONGEWIJZIGD, gelezen uit de suite: vitest-totaal 612 · engine-selftest-assert-count 1245.
- **DE FTP-POST IS GESLOTEN — niet opgelost-door-wijziging: er is NIETS aan de FTP veranderd.** Cadans en intervals.icu staan allebei op 280 en liepen nooit uiteen; het gat van −18 zat tussen de INSTELLING en `rolling_ftp`, en dat zijn twee verschillende grootheden (gezette FTP tegen rollende schatting uit de vermogenscurve). Volledig in `docs/FTP-REFERENT-RECON.md`; het correctie-blok onderaan `docs/EFFECT-REFERENT-RECON.md` weerlegt de drie claims van §6 daar.
- **DE INGESTELDE FTP RAAKT TSS, CTL EN ZONEMINUTEN NIET.** Die komen kant-en-klaar uit intervals.icu (`icu_training_load`, `icu_intensity`, `w.ctl`/`w.atl`, `icu_zone_times`). Hij raakt ALLEEN de wattgetallen in de workoutblokken (`wattsRange`) en de W/kg-kant van de Niveau-tab. Ook de Garmin-push niet: de ZWO schrijft PROCENTEN, dus de deling valt weg.
- **`ftpAutoUpdate` is een DODE KOLOM in Cadans**, waarde NULL, nergens gelezen of geschreven. In GAS bestaat het mechanisme wél (`Sync.gs` `syncAthleteFromIcu`, default `false`). NORM bij een eventuele port: voorstel-met-bevestiging, nooit stil (M10/M11).
- **`icu_ftp` splitst per SPORT, `rolling_ftp` NIET.** Indoor draagt 260 náást de buitenlijn 275 — parallel, geen drift; `rolling_ftp` loopt als ÉÉN reeks door alle types heen (de indoor-rit van 22-01 draagt 276, gelijk aan de buitenritten die week). Buitenlijn 270 → 275 (21-12-2025) → 280 (21-07-2026); beide sprongen liggen BUITEN het ijkvenster, dus de norm van 84 uit 5a blijft staan.
- **STAP 5B ONTWORPEN, nog niet gebouwd** — `docs/EFFECT-REFERENT-5B-ONTWERP.md`. Meter `rolling_ftp`; aggregatie MAXIMUM-BINNEN-BLOK minus instapniveau (niet max-tegen-max: de rollende meter kijkt zelf al ~6 weken terug, langer dan het blok); drempel 3 watt, op een PLATEAU van +1 t/m +8 over 13 blokken; DRIE uitkomsten. KERNVONDST: van de 28 bijna-maximale ritten geven er 26 GEEN stijging, en `if_pct` ordent ze niet (97,04 gaf niets, 88,36 wél) — een intensiteits-heuristiek voor "was er een maximale inspanning" is op deze data niet te bouwen. De twee stijgingen kwamen uit een TEST en een WEDSTRIJD, niet uit training.
- **TRAININGSINZICHT VAN DAAN, dragend.** Zijn eFTP springt bij een test en zakt daarna constant, terwijl vermogen en hartslag in Z2 samen binnen zone blijven. Dat is precies waarom de effect-kaart een DERDE toestand nodig heeft en nooit mag concluderen uit afwezig bewijs: zonder die toestand zou de kaart in 11 van 13 blokken "geleverd maar niet gestegen" zeggen en dosis-verhoging voorstellen op grond van niets.
- **OPENSTAAND VOOR DE BOUW** — de drie punten uit §9 van het ontwerpdoc: hoe de app vaststelt dat een blok een GELEGENHEID tot een maximum bevatte (voorkeur: via het PLAN, een ingeroosterde test), op welke dosis-term een verhoging landt bij uitkomst 2, en de doel-dekking (5b geldt voor FTP; Onderhoud heeft geen effect-meter, klim/conditie vragen power-curve-data die niet als reeks in D1 staat).
- **FOCUS VOLGENDE CHAT: stap 5b bouwen** op `docs/EFFECT-REFERENT-5B-ONTWERP.md`, client-only verwacht. Verse chat.

**STAP 5a + 5a-ii AF — uitvoerings-referent en blok-review-kaart, OP MAIN, NIET GEDEPLOYED (juli 2026).** Bouw-commits `813b432` (pure laag), `2e396c9` (kaart + wiring), `ab2d16f` (copy-correctie); recon-docs `ce571a3` en `65e5590`. Prod ONVERANDERD: Worker Version `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd`. GEEN migratie en geen enkele remote-D1-mutatie deze reeks; `0006` blijft de laatste remote. CLIENT-ONLY, `git diff --stat packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 612 · engine-selftest-assert-count 1245** (van 569/1245; +43 nieuwe client-tests, engine ONAANGEROERD). Lees ze uit de suite; hardcode ze nooit.
- **WAT ER STAAT.** `apps/web/src/lib/blok.ts` draagt het BLOK-OBJECT (vaste lengte 4, drie opbouwweken), de DOSIS-NORM uit doel × gedeclareerde weekuren, de uitvoerings-referent die per blokweek GEVRAAGD en GELEVERD APART teruggeeft, de blok-check met drie uitkomsten, en het review-venster. `BlokReviewCard.tsx` rendert de terugblik (dom component, geen state, geen knop, zelfbegrenzend); gemount in `SchemaView` ná de fatigue- en inhaal-kaart en vóór het dag-detail — actievragende voorstellen boven, terugblik eronder. De kaart verschijnt alleen in blokweek 4 (fase "lopend") en blokweek 1 (fase "afgerond").
- **GEIJKT OP ECHTE DATA** (`docs/UITVOERINGS-REFERENT-RECON.md` §7). De referent reproduceert de recon: 110,0 / 97,1 / 117,5 / 91,0 tegen de gemeten 110 / 97 / 118 / 91, grootste afwijking 0,5 minuut. Het fiets-filter kan niets omlaag trekken: van de 2570 minuten buiten `CYCLING_TYPES` draagt NUL minuut zonedata. De norm 84 ligt op het PLATEAU (T=80 en T=84 tellen allebei 12 van 27 weken). De dekkings-poort viel in 0 van 27 weken aan.
- **WAT DE KAART NU TOONT** (doel FTP, `doelStart` 2026-06-29, weekuren 5, weekmaandag 2026-07-20): fase "lopend", blok 29-06 → 20-07, norm 84, drie van drie opbouwweken op norm, ΔCTL −2,7 → tak `geleverd_niet_gestegen`. De LEVENDE tak dus, precies zoals de recon voorspelde.
- **OPENSTAAND — STAP 5b, de effect-referent.** Recon AF (`docs/EFFECT-REFERENT-RECON.md`), ontwerp nog niet. Kernvondst: `eftpFromActivities_` berekent geen eFTP maar pakt de meest recente Rolling FTP uit `idx14`, en die staat als GEDATEERDE REEKS in D1 (`activities.rolling_ftp`). Gemeten: 142 van 174 ritten gevuld, 38 van 39 weken, reeks 262–276, spreiding 14 W, 23 van 37 overgangen bewegen, sprongen +10 / −3. Blokuitslag −7, acht weken −10, twaalf weken −2 — de reeks is NIET monotoon. Drie conclusies: de uitvoerings-referent is de GELDIGHEIDSVOORWAARDE (een rolling maximum zakt óók zonder verlies, namelijk als je geen maximum meer zet); een punt-tot-punt-delta is niet af te lezen want de ruisvloer (+10) is groter dan de blokuitslag (−7); de passende aggregatie is MAXIMUM over een venster tegenover het vorige venster, nog te kalibreren op de weekreeks in §4 van dat doc.
- **~~OPENSTAAND, HOOGSTE PRIORITEIT — DE INGESTELDE FTP KLOPT NIET MEER.~~ GESLOTEN 26-07-2026 — zie het bovenste STAND-blok en `docs/FTP-REFERENT-RECON.md`.** De post berustte op een verwisseling: `rolling_ftp` en de ingestelde `ftp` zijn twee verschillende grootheden, en de ingestelde FTP raakt TSS/CTL/zoneminuten helemaal niet. Er is niets aan de FTP gewijzigd. De oorspronkelijke tekst hieronder blijft staan als vindplaats van de redenering die weerlegd is: "In alle 142 rijen wijkt `rolling_ftp` af van de `ftp`-kolom; nu 262 gemeten tegen 280 ingesteld, grootste afwijking −18 op 25-07. Gevolg: de zonegrenzen staan te hoog, dus TSS en daarmee CTL worden te LAAG berekend."
- **OPENSTAAND (geërfd, ENGINE) — `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong.** De deling gaat over een vaste 7×24u-constante, dus een 23-uursdag maakt de teller te klein: gemeten geeft de maandag ná de sprong quotiënt 3,9940 → `Math.floor` levert 3 in plaats van 4, en die achterstand blijft tot de najaarsswitch. De blok-teller ERFT dit bewust (blok en mesoteller moeten in de pas blijven). Eerstvolgende sprong 28-03-2027, DRIE WEKEN vóór het A-event. Repareren betekent `weekIndexFromStart_` in de engine én de spiegel in `blok.ts` tegelijk — engine, dus autorisatie nodig.
- **OPENSTAAND (geërfd, niet geraakt).** ~~Deploy van 5a/5a-ii plus visuele check~~ **GEDAAN 26-07-2026** — meegegaan in de deploy vanaf `93f5a51` (Worker Version `a51baec3-88cd-4f76-91f7-32f1044bc0b4`), zie het bovenste STAND-blok · UP-fixture in `Preview.tsx` realistischer maken · weken-terug-scrollen in de Schema-tab · gat-dag-types via meegegeven datum (ENGINE) · `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE).
- **FOCUS VOLGENDE CHAT: de FTP-bevinding eerst** (meten wat `ftpAutoUpdate` doet en welke waarde klopt — dat raakt alle andere meters), daarna stap 5b ontwerpen op `docs/EFFECT-REFERENT-RECON.md` §5. Verse chat.

**UITVOERINGS-REFERENT (stap 5) — RECON AF, BOUW NOG NIET GEDAAN (juli 2026).** Deze chat = recon + besluiten, GEEN code. Recon-doc `docs/UITVOERINGS-REFERENT-RECON.md` @ `ce571a3`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30191347740>). Docs-only; prod ONVERANDERD: Worker Version `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd`. GEEN migratie; `0006` blijft de laatste remote. `git diff --stat packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 569 · engine-selftest-assert-count 1245.** Lees ze uit de suite; hardcode ze nooit.
- **DE AANNAME IS DEELS WEERLEGD.** "Beide signalen bestaan al, alleen het VENSTER en het GEBRUIK moeten veranderen" houdt niet voor `zoneDebt_`. GEMETEN: het venster is geen parameter maar een GEVOLG — de functie itereert over de meegegeven `plannerDays` en de client haalt alleen de huidige week op; venster op blokstart met week-plannerDays levert exact hetzelfde getal (40 tegen 40), pas met 28 dagen wordt het 280. En het SALDO STREEPT WEG: acht geplande kwaliteitsdagen à 40' high — perfect uitgevoerd geeft 0, vier gemist plus vier dubbel geeft OOK 0. Een extra rit op een niet-geplande dag telt voor niets.
- **HET DATAPAD, GEMETEN OP REMOTE D1 (read-only SELECT).** De weekplans-tabel draagt ÉÉN rij (`2026-07-20`); `planner_days` reikt tot `2026-07-06`; de activiteiten dragen 250 ritten vanaf `2025-07-17`, sinds 22-06 met 19 van 21 met zonedata. Geen defect maar OUDERDOM: `persistWeekplan` kwam op main met `fbbc292` (19-07) en in prod met de deploy vanaf `f47ae2b` (20-07) — de schrijver draait precies één week. Drie weken intent compleet rond 10-08, vier rond 17-08. Bijvangst: de cross-week recency-seed (1b) heeft in prod nog niets gehad en komt vanzelf op gang.
- **DE BLOB IS GEEN DOSIS-VERKLARING.** De enige bewaarde week draagt 300 minuten volledig in `low` (0 high, 0 anaerobic) zónder dag-overrides, terwijl er die week 89 high + 2 anaerobic zijn GEREDEN; de engine, opnieuw gedraaid op dezelfde config met GEPINDE KLOK en het echte A-event, plant voor die week wél een drempeldag van 60'. De blob is dus wat de coach voorstelde voor dagen die op dát rendermoment nog vooruit lagen, dag voor dag bevroren — geen weekdosis. Als blok-referent zou een week zonder uitgegeven kwaliteit een perfecte uitvoering scoren (0 gevraagd tegen 0 geleverd) = gat 4 uit §2A langs de achterdeur.
- **PLAN TEGENOVER WERKELIJKHEID, HET HELE BLOK** (kwaliteit = high + anaerobic, minuten): 29-06 gepland 45 / geleverd 110 · 06-07 49/97 · 13-07 52/118 · 20-07 (deload) 13/91. Blok-som 159 tegen 416, FACTOR 2,6. De meso-ramp beweegt 45 naar 52 — zeven minuten over drie opbouwweken — terwijl de uitvoering week op week 27 minuten varieert: de geplande progressie ligt BINNEN de ruis van de werkelijke uitvoering. De deload bestaat alleen op papier. Anaerobic is elke Base-week 0 gepland tegen 2 à 16 geleverd.
- **IJK-REEKS BESCHIKBAAR.** 26 kalenderweken geleverde zoneminuten terug tot 19-01-2026: kwaliteit min 24, mediaan 77,5, max 248. Plateau-toets absoluut: T=70 → 17/26, T=80 → 12/26, T=90 → 11/26, T=100 → 7/26 — dun maar echt plateau tussen 80 en 90. Normaliseren op GEREDEN uren valt af (gelijkmatige helling, en circulair: geleverd gedeeld door geleverd). Huidig 5-uursregime: 71 tot 121, mediaan circa 97. GEEN drempel vastgelegd.
- **BESLUIT (recon-doc §3).** De dosis-norm is een veld van het BLOK-OBJECT (doel + weekuren), uitgedrukt in GEMETEN zoneminuten — dezelfde eenheid als de geleverde kant, want `zoneDebt_` trekt vandaag voorgeschreven intent af van gemeten zonetijd. De referent levert de TWEE TERMEN apart per week, nooit hun saldo. De blob houdt de WEEK-vraag ("niet gedaan") met venster en M63-fork ongemoeid: week uit de blob, blok uit de norm. `zoneDebt_` wordt NIET aangeraakt — engine read-only, geen autorisatie nodig. Geen extra fetch.
- **OPENSTAAND.** De tak "niet geleverd → dosis niet omhoog" gaat bij Daan vrijwel nooit vuren (uitvoering structureel bóven plan terwijl de CTL daalt); de levende tak is "geleverd maar niet gestegen → het plan was te licht" — meenemen in de copy. · De deload plant 13 kwaliteitsminuten tegen 91 geleverd; 3d stap 3 wérkt, maar of een deload die in de praktijk genegeerd wordt moet blijven bestaan is een eigen vraag, geen bug. · `frozenEntryByDate` (`apps/web/src/lib/proposal.ts`) beweert in commentaar dat het recent-venster de weken oplopend aanlevert; gemeten is het aflopend (`gatherWeekplanEntries_` begint bij k=0 op de basismaandag) — commentaar-fout, vandaag onschadelijk want datums zijn week-uniek.
- **FOCUS VOLGENDE CHAT: stap 5a bouwen** (client-only verwacht): blok-object met VASTE lengte + dosis-norm, de pure uitvoerings-referent die per blokweek gevraagd en geleverd APART teruggeeft, en de blok-check met drie uitkomsten; drempels als named exports, te herijken zonder logica-wijziging. Daarna 5b (effect-referent per doel), dan stap 6 en 7. Verse chat.

**COACH-MODEL VASTGESTELD IN DE DOELEN-SPEC — het fundament staat, mechanismen volgen eruit (juli 2026).** Commit `81ea82e`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30188907660>). Docs-only; prod ONVERANDERD (Worker Version `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd`). GEEN migratie; `0006` blijft de laatste remote. `docs/DOELEN-SPEC.md` van 240 naar 381 regels, nul verwijderingen. `git diff --stat packages/engine` leeg.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 569 · engine-selftest-assert-count 1245.** Lees ze uit de suite; hardcode ze nooit.
- **DE DIAGNOSE, IN ÉÉN ZIN: er is geen BLOK.** Elk mechanisme was los gebouwd met een eigen signaal en een eigen drempel. Een trainer houdt één object vast — een periode met een bedoeling, een dosis-doel, een sleutelsessie en een check aan het eind. Cadans had drie klokken (event-aftelling, 4-weeks mesoteller vanaf `doelStart`, weekquotum per fase) en geen van de drie droeg een bedoeling of een check. De vijf gaten uit de vorige chat zijn symptomen van die ene afwezigheid.
- **WAT ER NU IN DE SPEC STAAT** (`docs/DOELEN-SPEC.md` §2A, VASTGESTELD). Drie niveaus met elk één vraag (seizoen, blok, week). Het BLOK-OBJECT met vier velden (bedoeling, dosis-doel, sleutelsessie, check) en VASTE lengte — de check stuurt de dosis van het VOLGENDE blok, nooit de lengte van het huidige. TWEE VRAGEN IN VOLGORDE: eerst uitvoering, dan effect; bij een niet-geleverde week zwijgt de app over effect (M5). Dat scheidt "niet gedaan" (weekvraag) van "niet gewerkt" (blokvraag). De SCHAARSTE-REGEL: elk doel draagt een BESCHERMD deel en een RESIDU; zakken de uren, dan sneuvelt het residu. DOSIS-DOEL-EENHEID = tijd-in-zone in high/anaerobic plus lange-rit-minuten en week-kJ — NIET TSS (mengt duur en intensiteit) en NIET %FTP (karakter is invariant, M74-M78). BLOK-CHECK met drie uitkomsten: geleverd én gestegen → volgende trede; geleverd maar niet gestegen → dosis omhoog want het plan was te licht; niet geleverd → dosis NIET omhoog want het plan was niet het probleem.
- **PER DOEL DE KETEN** (§3.1 t/m §3.5, elk een KETEN-alinea): bestemming, tussenstappen, wat het per week vraagt inclusief wat beschermd is en wat residu, en de meter op drie lagen (uitvoering, proces, effect). Kern per doel: FTP → sleutelsessies beschermd, effect via eFTP (traag, nooit de weekreferent). Onderhoud → FREQUENTIE beschermd, meter is uitvoering, NIET CTL (die hoort te dalen). Korte beklimmingen → intervalsessie ÉN lange rit beschermd, effect = vermogen in de late inspanningen t.o.v. vers. Lange beklimmingen → weekendpaar beschermd, effect = dag 2 t.o.v. dag 1 van een back-to-back. Conditie → de lange rit ÍS het doel, effect = 20-min na 15 kJ/kg als percentage van vers.
- **DOEL-PASSENDHEID VASTGESTELD (Daan-besluit).** De coach MAG een passend doel voorstellen als het ingestelde doel niet binnen het urenbudget past, en Daan moet dat kunnen AFWIJZEN. Vorm volgt M10/M11 (ingesteld doel blijft staan tot bevestiging, voorstel ligt ernaast, afwijzen is één tik). Frequentie-grens: hoogstens ÉÉN KEER PER BLOK, op een blokgrens.
- **GEMETEN TIJDENS DE RECON, vier dingen die de diagnose dragen.** (1) `eventFase_` zet Base bij ≥9 weken tot het hoofdevent → met AGR 38 weken weg staat de fase tot circa 13-02-2027 op één ononderbroken Base van 29 weken; zonder event blijft `computeMacroPhase` na week 12 voorgoed op "Test". (2) Vier van de vijf planner-profielen dragen in Base hetzelfde quotum (2), dezelfde tussenruimte (1) en dezelfde lange rit (1) — het doel is inert in precies de weken die nu tellen. (3) `weekUren` staat in `settings` en in de Instellingen-UI maar wordt door de ENGINE NERGENS gelezen; de planner leidt zijn weekvolume af uit de som van de weekplanner-dagminuten (`weekV`, `planner.ts`). BESLUIT: de gedeclareerde uren blijven MEETLAT-invoer en worden GEEN planner-invoer — eerste bouw client-only, M27 ongemoeid. (4) De machinerie voor beide vragen bestaat AL met de goede korrel en wordt te smal gebruikt: `computeBlockCtlDelta` (`apps/web/src/lib/fatigue.ts`) meet de CTL-verandering over de voorgaande drie weken maar voedt alleen het deload-besluit, en de UP-tak landt op mesoweek 1 (de LAAGSTE opbouwtrede); `zoneDebt_` (`packages/engine/src/weekprep.ts`) doet intent min werkelijk per zone-bucket op minuutniveau maar met venster `[maandag .. vandaag)` en alleen voor de inhaal-kaart. Er is dus GEEN nieuw signaal nodig — alleen een ander venster en een ander gebruik.
- **BOUWVOLGORDE UITGEBREID** (§6, stappen 5-7). 5 = blok-object en de twee vragen, met de UITVOERINGS-referent EERST (venster van week naar blok), daarna pas de effect-referent per doel. Dit KEERT `docs/DOEL-REFERENT-RECON.md` §8 om, die de meetlat als fase 1 zet — effect zonder uitvoering is betekenisloos, wat die recon in §7 zelf vaststelt. 6 = doel-passendheid (hangt aan 5). 7 = consolidatie: doortrain-kaart, kalender-deload, dosis-ramp en inhaal-kaart onder de weeklus, zodat er twee lussen overblijven in plaats van vijf drempels (ENGINE waarschijnlijk, aparte autorisatie). Stap 4 (duurvermogen-meetlat) is onafhankelijk van stap 5; de nummering is daar geen volgorde.
- **GEEN ENKELE DREMPELWAARDE VASTGELEGD.** Het document noemt bewust geen getallen: elke drempel wordt op de ECHTE reeks geijkt en moet op een plateau liggen (`docs/WERKWIJZE.md`, *Recon en bewijslast*).
- **FOCUS VOLGENDE CHAT: bouwvolgorde stap 5, de uitvoerings-referent met blok-venster.** Recon-first op het datapad (bewaarde weekplannen via `readRecentWeekplans` + de activiteiten-matrix): draagt de client genoeg historie om een blok van drie tot vier weken te reconstrueren. Client-only verwacht. Daarna stap 6 en 7, en de kleine posten (UP-fixture realistischer, weken-terug-scrollen, de geërfde engine-items). Verse chat.

**DOORTRAIN-KAART GEDEPLOYED + DOEL-REFERENT-RECON BINNEN — coach-model is de volgende grote stap (juli 2026).** De doortrain-kaart (blok-signaal) staat live. Prod Worker Version `5106a4de-5c7f-4b74-ac74-2d41eaa9c7dd` op cadans-api (was `75c07d76-cff1-47b4-a53a-4237469102a9`), gebouwd vanaf `2ed1271`. Drie assets vervangen, 63 ongewijzigd. GEEN migratie gedraaid en geen enkel wrangler-d1-commando; `0006` blijft de laatste remote. Visuele check op `/preview` door Daan: akkoord. DEZE HANDOFF-commit is docs-only.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 569 · engine-selftest-assert-count 1245.** Lees ze uit de suite; hardcode ze nooit.
- **UIT DE VISUELE CHECK, twee noteringen.** (1) De UP-override zet `mesoWeek 1`, dus mesoFactor 1,00 — de LAAGSTE van de drie opbouwtreden (1,00 / 1,08 / 1,15). Doortrainen betekent dus: de deload vervalt, NIET een zwaardere week; het volle kwaliteitsquotum komt wel terug. (2) De UP-fixture in `Preview.tsx` schaalt een standaardweek kunstmatig met ×1,4 puur om een zichtbaar plusje te tonen — dat is GEEN engine-doorrekening en overdrijft t.o.v. de echte diff. Kleine client-only post: die fixture realistischer maken.
- **RECON BINNEN — `docs/DOEL-REFERENT-RECON.md` @ `b8c55ed`, CI success.** Alle ankers geverifieerd tegen de echte bestanden, geen afwijkingen. KERNVONDST: TWEE LAGEN. De planner is wél per doel (`profileForDoel_`, vijf profielen) en werkt. De MEETLAT niet: `activeGoalProfile_` kent twee uitkomsten — FTP krijgt het ftp-profiel, elk ander doel valt terug op het girona-EVENT-profiel (targets 4,0 W/kg · CTL 65 · 4,0 u), en dat label staat letterlijk in de Niveau-tab. Niet acuut (actief doel = FTP); bijt bij de wissel naar Onderhoud in de winter en opnieuw bij Korte beklimmingen, het A-doel richting AGR. De projectie-machinerie bestaat al (plateau-uit-weekvolume, weken-tot-target, tau 42 d) maar leeft alleen in de Niveau-laag en beantwoordt uitsluitend de VOORUIT-vraag.
- **CORRECTIE, expliciet.** Het actieve doel is FTP, NIET Onderhoud — een eerdere aanname in chat was fout. FTP verwacht een stijgende CTL terwijl de CTL vijf weken op rij zakt van 51,8 naar 45,8; dat is de ijk-casus voor de referent.
- **NIEUWE POST, GROOT — COACH-MODEL (Daan, dragend, gaat VÓÓR op de doel-referent-bouw).** Daans oordeel: de app voelt nog niet als een coach en het blijft pingpongen. Diagnose: elk mechanisme (mesoweek-teller, dosis-ramp, deload-inhoud, vermoeidheidskaart) is LOS gebouwd met een eigen signaal en een eigen drempel; er is geen gedeeld model van wat de coach weet en waarop hij besluit. Vijf gaten: geen tussenstappen per doel; tijd als invoer i.p.v. schaarste; geen bijstelling BINNEN de week; opbouw over week 1-3 wordt aangenomen, niet gecontroleerd; "niet gedaan" en "niet gewerkt" worden niet gescheiden. Voorgenomen aanpak: ÉÉN coach-model-document dat per doel de keten uitschrijft (bestemming, tussenstappen, wat het per week vraagt, waaraan je ziet dat het werkt); mechanismen volgen daaruit in plaats van andersom.
- **FOCUS VOLGENDE CHAT: het coach-model-document** (recon-first, raakt `docs/DOELEN-SPEC.md`), daarna de doel-referent-bouw (fase 1 client-only), en de kleine posten (UP-fixture realistischer, weken-terug-scrollen, de geërfde engine-items). Verse chat.

**DOORTRAIN-KAART HERONTWERP AF — blok-signaal vervangt de TSB-drempel, OP MAIN, NIET GEDEPLOYED (juli 2026).** Bouw-commit `f28b19a`, recon-doc `docs/DOORTRAIN-KAART-RECON.md` @ `41e2227`. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30156988061>). Prod ONVERANDERD: Worker Version `75c07d76-cff1-47b4-a53a-4237469102a9`. GEEN migratie en geen enkel wrangler-d1-MUTATIE-commando; `0006` blijft de laatste remote. CLIENT-ONLY (zes bestanden onder `apps/web`), `git diff --stat packages/engine` leeg.
- **VLOEREN NU: vitest-totaal 569 · engine-selftest-assert-count 1245** (van 561/1245; netto +8 — vijf oude drempel-tests vervangen door dertien blok-signaal-tests). Lees ze uit de suite; niet hardcoden.
- **WAT HET DOET.** De week-brede vermoeidheidskaart hangt niet langer aan een drempel op het 7-daags TSB-gemiddelde, maar aan ÉÉN vraag: heeft het afgelopen blok belasting opgebouwd? Signaal = `computeBlockCtlDelta` (`apps/web/src/lib/fatigue.ts`) = ΔCTL over [weekMaandag−22 .. weekMaandag−1], met per anker de dichtstbijzijnde `ctl`-rij binnen 3 dagen (gelijke afstand → de OUDERE rij). UP = mesoWeek 4 EN ΔCTL ≤ `NO_BUILD_CTL_DELTA` (1,0) — leest TSB NIET meer. DOWN = mesoWeek 1..3 EN ΔCTL ≤ 1,0 EN `tsbTrend < deepFatigueThreshold(ctlNow)` = `min(−10, −0,25 × ctlNow)`. `UP_TSB_THRESHOLD`/`DOWN_TSB_THRESHOLD` VERVALLEN. Omdat het venster deze week niet bevat, staat het oordeel op maandag vast en slaat de kaart niet halverwege de week om.
- **GEMETEN OP ECHTE DATA (remote D1, 376 CTL-rijen, read-only SELECT).** Het 7-daags TSB-gemiddelde stond 17-07 op 9,14 en 24-07 op 3,90 — een spreiding van 5,2 punten in acht dagen, groter dan de afstand tot de drempel; de piek viel bovendien in opbouwweek 3, waar de UP-tak per definitie niet vuurt. De drempel bemonsterde dus RUIS, niet een niveau — dát is waarom +8 → +5 niets veranderde. Het blok-signaal is stabiel: over 17 maandagen verschuift de uitkomst tussen grens 0,0 en +2,5 met twee gevallen (PLATEAU). Huidig blok: CTL 50,7 → 45,7 = **−5,0**, dus UP vuurt terecht. April droeg TSB-dagwaarden −16,8 tot −18,7 bij ΔCTL +6,1 tot +12,0 (productieve overload) → de AND-regel houdt DOWN stil; DOWN vuurt over het hele jaar NUL keer, en dat is het gewenste gedrag van een vangnet.
- **COPY.** UP noemt het gemeten blok ("Je CTL ging deze drie weken van 50,7 naar 45,7 — het blok heeft je niet belast…"), DOWN noemt put én blok; beide VOORWAARDELIJK (M55, "ik kan"). UP-pill "Geen opbouw" op de productief-tokens; DOWN houdt de `tsbZone`-pill. `/preview` draagt alle drie de states.
- **OPENSTAAND — DEPLOY + VISUELE CHECK.** Approval-gated, nog niet gedaan: `pnpm build` vanuit repo-root, dan `npx wrangler deploy` vanuit `workers/api`; geen migratie. Daarna Daans oog op `/preview` (hard refresh of incognito i.v.m. SW-cache). LET OP de zichtbaarheid: met `doelStart 2026-06-29` is 27-07 weer blokweek 1 en is de EERSTVOLGENDE kalender-deload de week van **17-08-2026**. Vóór die datum is de kaart in de app niet live te zien — alleen op `/preview`.
- **NIEUWE POST — HET DOEL MOET EEN PROGRESSIE-REFERENT DRAGEN (Daan, dragend).** De app periodiseert UITSLUITEND op het event; het ingestelde doel stuurt profiel-parameters (quotum, tussenruimte, archetype-keuze) maar geen verwachte voortgang. Daardoor bestaat er geen antwoord op "had mijn CTL deze periode moeten stijgen" — precies de referent die §10 van het recon-doc mist. Daans eis: elk doel dat je voor een periode instelt moet zichtbaar bijdragen aan fitter worden, ook als het event 38 weken weg is. Richting: per doel een meetbare verwachting (Onderhoud → CTL vlak; FTP/Conditie → CTL-ramp per week), waartegen de app kan toetsen en iets kan zeggen. Raakt `docs/DOELEN-SPEC.md` en sluit aan op de al openstaande doel-lijst-herziening (§6) en de durability-meetlat. VOORWAARDE voor de afbouw-signalering: zonder referent alarmeert die zonder te weten waartegen — dezelfde val als de TSB-drempel.
- **CONTEXT DIE BLIJFT STAAN.** CTL zakt sinds 22-06 vijf weken op rij (51,8 → 45,8) bij 38 weken tot AGR. Geen alarm, wel een gemiste zomer: chronische belasting is nu goedkoper op te bouwen dan in februari.
- **OPENSTAAND (geërfd, niet geraakt).** Weken-terug-scrollen in de Schema-tab (recon-first, nieuwe feature) · gat-dag-types via meegegeven datum (ENGINE, klein/cosmetisch) · `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien (ENGINE, autorisatie nodig).
- **FOCUS VOLGENDE CHAT: deploy + `/preview`-check**, daarna op prioriteit de doel-progressie-referent (recon-first, raakt DOELEN-SPEC), weken-terug-scrollen, en de engine-items. Verse chat.

**UP-DREMPEL +5 + PLAN-VAN-RECORD-GAT-FIX (A) — BEIDE GEDEPLOYED, geverifieerd werkend (juli 2026).** Prod Worker Version `75c07d76-cff1-47b4-a53a-4237469102a9` = main t/m `b8e740b`. Twee client-only features deze reeks: de UP-drempel van de week-brede vermoeidheidskaart van +8 → +5 (`4034bdb`, tussendeploy Worker `c18d841c`) en de plan-van-record-gat-fix aanpak A (`b8e740b`). GEEN migratie en geen enkel wrangler-d1-commando in deze hele reeks; `0006` blijft de laatste remote. Recon-doc: `docs/PLAN-VAN-RECORD-GAT-RECON.md` @ `8c394d3`. DEZE HANDOFF-commit is docs-only en raakt de gedeployde code NIET.
- **VLOEREN NU: vitest-totaal 561 · engine-selftest-assert-count 1245** (van 554: UP-drempel +0 — één hardcoded assertie vervangen; plan-van-record +7 — 3 gat-detectie, 2 merge-split, 2 persist-recon. Engine over de hele reeks ONAANGEROERD, `git diff --stat packages/engine` leeg). Lees ze uit de suite; niet hardcoden.
- **PLAN-VAN-RECORD-GAT (was de TWEEDE bug) — DICHT.** Een geplande dag die gereden werd vóór de app 'm als vooruit-dag zag, kreeg geen plan-van-record en viel uit de weekkaart-noemer + compare. Fix A (client-only, `apps/web/src/lib`): `hasUnrecordedPastTrainingDay` poort in `loadSchemaWeek` een tweede `buildWeekProposal` (todayISO = weekmaandag, `activities: []` → hele week vooruit, coach vult alles); `mergeReconEntries` neemt vooruit-entries uit het live-plan + verleden-entries uit de reconstructie; `persistWeekplan` schrijft ALTIJD zodra reconWeek gezet is. Worker-freeze ONGEMOEID — houdt correct bewaarde dagen vast, reconstructie vult enkel gaten. Geverifieerd in-app: donderdag toont nu GEPLAND Herstel/1u/TSS21 naast de gereden Duur-rit; noemer nu 168/5:00/4 (was 126/3:00/2), 93% i.p.v. het valse 124%.
- **OPENSTAAND — DOORTRAIN-KAART HERONTWERP (was de UP-drempel-vraag).** De drempel +5 is een tussenstap; gemeten is Daans 7-daags Form **3,24** (ruim onder +5) terwijl zijn CTL tien dagen vlak rond 45 ligt — dus de kaart vuurt terecht niet volgens z'n huidige logica, en dat bevestigt dat de kaart de VERKEERDE vraag stelt ("ben ik nu gemiddeld fris" i.p.v. "hebben de opbouwweken me belast"). RICHTING: CTL-trend over het blok als objectief signaal i.p.v. TSB-drempel; stijgt CTL → opbouw → deload zinvol, vlak/dalend → onderhoud → doortrain-aanbod. Eigen recon-doc VÓÓR de bouw, getoetst tegen Daans echte data én tegen weken waarin een deload wél nodig is (geen vals vuren). Client-only verwacht.
- **OPENSTAAND — WEKEN-TERUG-SCROLLEN in de Schema-tab.** Daan wil de dagenstrip naar links kunnen scrollen door vorige weken om de historische gepland-vs-gedaan te zien; nu alleen de huidige week. Waardevol geworden dóór fix A (de bewaarde weekplannen worden compleet). Nieuwe feature: dagenstrip uitbreiden naar historische weken + de data-laag eronder. Eigen recon-first.
- **OPENSTAAND — GAT-DAG-TYPES via meegegeven datum (engine-verfijning, klein/cosmetisch).** `allocateQualityWeek_` dateert zich op de AMBIENT klok, dus de reconstructie in fix A vult gat-dagen als recovery (met de juiste minuten) i.p.v. hun oorspronkelijke kwaliteitstype — Dagen/Uren-noemer klopt, maar voor een gat-dag die kwaliteit wás toont de compare recovery en is de TSS wat laag. In een deload (Daans geval) grotendeels recovery, dus daar geen zichtbaar verschil. Fix = de allocator een meegegeven datum laten respecteren i.p.v. de ambient klok. ENGINE → autorisatie + recon + selftest-vloer. Laag op de lijst.
- **OPENSTAAND (geërfd, niet geraakt deze chat).** Stap 3 uit `docs/DOELEN-SPEC.md` §6: doel-lijst herzien (VO2max eruit, Beklimmingen splitsen in kort en lang) — ENGINE, expliciete autorisatie nodig, selftest-vloer stijgt mee.
- **FOCUS VOLGENDE CHAT: het doortrain-kaart-herontwerp** (recon-first: CTL-trend-signaal, eigen recon-doc). Daarna op prioriteit: weken-terug-scrollen (recon-first, nieuwe feature), en de geërfde engine-items (DOELEN-SPEC §6 doel-lijst, gat-dag-types) wanneer Daan die wil. Verse chat.

**STAP 1 + 1b + 2 + WEEKKAART-TELLERFIX GEDEPLOYED — alles live (juli 2026).** Prod Worker Version `96d56820-7f18-4098-ace7-62f58cfba882` = main CODE t/m `9eeaec2`. GEEN migratie en GEEN ENKEL wrangler-d1-commando in deze hele reeks; `0006` blijft de laatste remote. 3 assets vervangen, 63 ongewijzigd. DEZE HANDOFF-commit is docs-only en raakt de gedeployde code NIET.
- **VLOEREN NU: vitest-totaal 554 · engine-selftest-assert-count 1245** (van 550/1245; 1b +3, tellerfix +1; engine over de hele reeks ONAANGEROERD, `git diff --stat packages/engine` leeg). Lees ze uit de suite; niet hardcoden.
- **STAP 1b AF — de WEEK-BREDE vermoeidheidskaart uitgegate, commit `6cf9b73`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30089959939>), CLIENT-ONLY.** Nieuwe pure helper `weekFatigueEnabled(doel)` (`apps/web/src/lib/fatigue.ts`) gate't op de PROFIEL-vlag via `profileForDoel_` (`prof?.mesoCyclus !== false`), NIET op de doelnaam — klopt daarmee meteen voor elk toekomstig doel zonder mesocyclus; leeg/onbekend doel valt fail-open naar true (klim-fallback, zelfde lijn als `effectiveMesoWeek_`). De gate staat als `const weekFatigueOn` ÉÉN keer boven `fatigueOptIn` in `loadSchemaWeek` (`schema.ts`); zowel de opt-in-tak als de trigger-tak hangt eraan. Netto bij Onderhoud: `fatigue` null, `fatigueOverride` undefined, `proposalWeek` = het kalenderplan; geen D1-write, een oude `fatigue_shift`-rij vervalt vanzelf de maandag erna (M68). De PER-DAG Verlicht-kaart is ONGEMOEID.
- **SEAM-CORRECTIE, DRAGEND.** `fatigueTrigger`'s parameter heet `calendarMesoWeek` maar krijgt `proposalWeek.mesoWeek` — sinds stap 1 de EFFECTIEVE mesoweek (via `effectiveMesoWeek_`), niet de kalender-mesoweek. Bij Onderhoud is die altijd 1: UP (vereist 4) onbereikbaar, DOWN (1..3) wél. Daarom moest de gate BOVEN `fatigueOptIn` en niet alleen in de trigger-tak: een `fatigue_shift`-rij van vóór een doel-wissel zou anders én een applied-kaart tonen én een `mesoWeekOverride` doorzetten, en die override gaat in `proposal.ts` bewust VÓÓR `effectiveMesoWeek_`.
- **DOELEN-SPEC BIJGEWERKT** (zelfde commit `6cf9b73`). §6 regel 1b beschreef stap 1b nog als "de twee deload-klemmen overslaan" — dat mechanisme is geschrapt, de regel staat nu op **AF** met de meting erbij. §6 regel 2 en de `ARCHETYPES`-bullet in §7 stonden nog als niet-gedaan terwijl stap 2 af is. De §7-bullet "NOG NIET GEGEVEN" voor de deload-klemmen is **VERVALLEN**: voor Onderhoud-herstel is GEEN engine-autorisatie meer nodig. `proposal.ts` en `onderhoudProfiel.test.ts` kregen hun stale comments bijgewerkt; asserties ongemoeid.
- **WEEKKAART-TELLERFIX, commit `9eeaec2`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30091487926>), CLIENT-ONLY.** De gepland-kant van TSS en Uren op de kaart "Deze week · gepland vs gedaan" liep UITSLUITEND over `sessions`, en die zijn per constructie leeg voor een verstreken of gereden dag (`tePlannen` = `train && !gedaan && datum >= vandaag`). Gevolg: de noemer kromp naarmate de week vorderde. GEMETEN IN DE APP (Daans screenshot, zaterdag week 30): 156/84 TSS, 3:05/2:00 uur, 186% van plan — waarbij 84 TSS en 120 min EXACT de zaterdag-sessie waren en elke verstreken dag nul bijdroeg. **HALVE FIX BLOOTGELEGD:** werkstroom 3 vond deze wortel al en repareerde 'm, maar UITSLUITEND voor de Dagen-noemer (de `plannedForDone`-terugval); TSS en Uren bleven staan. Nu symmetrisch: twee dagwaarden (`plannedMinDay` en `plannedTssDay`) met dezelfde terugval, waar alle DRIE de gepland-stats aan hangen; de gedaan-kant ONGEWIJZIGD. Pendel-veilig: `buildWeekplanEntries` sommeert de sessies naar `minuten`/`tss`, dus een verstreken pendeldag telt voor beide ritten mee.
- **TEST EERST ROOD GEZIEN.** De nieuwe test faalde tegen de ONGEWIJZIGDE code met "expected 60 to be 120" (60 min / 78 TSS = alleen de vandaag-sessie); na de fix 120 min / 156 TSS en Dagen 2.
- **OPENSTAAND — in-app check door Daan** (hard refresh of incognito i.v.m. SW-cache), drie dingen. (1) DE WEEKKAART: klopt de Uren-noemer nu met wat het plan die week had staan, dan was "Dagen 3/2" gewoon correct en is er op een rustdag gereden; blijft de noemer te laag, dan ONTBREKEN er bevroren weekplan-entries en is dat een TWEEDE bug — `buildWeekplanEntries` schrijft per render alleen vooruit-dagen weg (`weekplanBlob.ts`: "dagen zonder sessies vallen weg"), dus een week die niet geopend is laat gaten. (2) WINTERWEEK: doel tijdelijk op Onderhoud plus drie dagen van 45 minuten in de weekplanner — drie sleutelsessies, en drie VERSCHILLENDE. Op doel FTP is stap 1b onzichtbaar. (3) Over vier weken nakijken of ook `threshold_2x12`, `threshold_ladder_kort` en `sweetspot_3x8` langskomen; de tie-break sorteert oplopend op `duurRange[0]`, dus de kortst-gebande sjablonen winnen bij gelijke stand.
- **OPEN ONTWERPVRAAG — de UP-drempel stelt de verkeerde vraag.** Daan zat in een kalender-deload met frisse benen en kreeg GEEN doortrain-voorstel. `UP_TSB_THRESHOLD = 8` vraagt "ben je getaperd-fris", terwijl zijn bezwaar is "de afgelopen weken hebben me niet belast, dus waarom een deload". De kaart kijkt alleen naar de huidige TSB-trend, niet naar of de voorgaande opbouwweken werkelijk load droegen. MEETSTAP VÓÓR ELKE BOUW: het 7-daags gemiddelde van de Form-lijn uit intervals.icu. Ligt dat tussen 0 en +8, dan is de drempel aantoonbaar de blokkade en is de fix één named export verlagen zonder de logica te raken. Ligt het onder 0, dan heeft de kaart gelijk en zit het verschil tussen gevoel en load. Empirische drempel-ijking stond al open sinds 3d stap 4.
- **FOCUS VOLGENDE CHAT: eerst Daans drie in-app uitkomsten triageren.** Daarna op prioriteit: de UP-drempel en de vraag die hij stelt (client-only, klein, mits eerst gemeten), de eventueel ontbrekende bevroren weekplan-entries, en stap 3 uit `docs/DOELEN-SPEC.md` §6 (doel-lijst herzien: VO2max eruit, Beklimmingen splitsen in kort en lang — ENGINE, expliciete autorisatie nodig, selftest-vloer stijgt mee). Verse chat.

**STAP 2 AF — ARCHETYPE-BIBLIOTHEEK UITGEBREID, OP MAIN, NIET GEDEPLOYED (juli 2026).** Commit `0bb79ee`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30067905670>). Prod ONVERANDERD: Worker Version `bc3becd7-fcc4-4764-83e9-21f4b7cddffe`. GEEN migratie; `0006` blijft de laatste remote.
- **VLOEREN NU: vitest-totaal 550 · engine-selftest-assert-count 1245** (van 549/1102; +143 doordat de per-archetype-validatielussen elk nieuw record circa 12x asserten). Lees ze uit de suite; niet hardcoden.
- **WAT ER IS.** Twaalf nieuwe kwaliteits-archetypes in `ARCHETYPES` (`packages/engine/src/archetypes.ts`): `threshold_3x6`, `threshold_2x12`, `threshold_ou_kort`, `threshold_ladder_kort`, `sweetspot_3x8`, `sweetspot_3x6_kort`, `sweetspot_2x15`, `sweetspot_lage_cadans`, `threshold_4x8_seiler`, `vo2_4x4`, `vo2_60_30`, `sweetspot_lage_cadans_lang`. Bibliotheek 23 naar 35. Geen enkel nieuw record draagt `restrictTo`. Mechanische controle warmup + som(core) + cooldown == `duurRange[0]` kwam voor alle twaalf uit.
- **HET GAT DAT DICHT GING.** Onder de 52 minuten had drempel PRECIES EEN sjabloon (`threshold_2x8`) en sweet spot PRECIES EEN (`sweetspot_2x10`); vanaf 52 minuten stonden er 20. Een winterweek met drie sleutelsessies putte dus uit twee sjablonen. GEMETEN NA DE BOUW: drie dagen van 45 minuten bij doel Onderhoud leveren drie VERSCHILLENDE archetypeIds (`sweetspot_3x6_kort`, `sweetspot_2x10`, `threshold_2x8`).
- **GAS-PARITY.** De bevroren bron @ `3e8090a` draagt exact dezelfde archetype-ids met dezelfde dunne onderkant — er viel NIETS te porten. Het gat is GEERFD, niet geintroduceerd; dit is nieuwe inhoud, onderbouwd met de coach-canon (Seiler 4x8; Ronnestad-korte-intervallen, waarvan 30/15 en 40/20 al bestonden en dus NIET zijn gedupliceerd).
- **VINGERAFDRUKKEN HERIJKT, MET BEWIJS.** De 48 vingerafdrukken zijn EERST op de ongewijzigde engine vastgelegd, daarna pas gebouwd. 37 van 48 veranderd, UITSLUITEND archetype-keuze (naam/voorgesteld type), NUL zone-veranderingen — de karakter-invariantie hield. Pas daarna EXPECTED opnieuw geijkt. Dat de vier andere doelen meer variatie krijgen is BEWUST, geen regressie.
- **AFWIJKING (CC, gemeld en goedgekeurd).** Twee selftest-asserties pinden een EXACT archetypeId bij 40 minuten (`testPrikkelInRitFase1`-C en `testOnderhoudArchetypeScope`). De grotere pool laat het exacte sjabloon roteren terwijl de INTENT identiek blijft; 1-op-1 herijkt van exact-id naar intent-TYPE. Geen selectie-logica en geen profiel geraakt.
- **TELLING GECORRIGEERD.** Een eerdere chat-telling van "26 archetypes" was fout: de drie `fx_`-records staan buiten `ARCHETYPES` (regel 281-319; de lijst begint op 345). Het waren er 23.
- **STAP 1b HERZIEN — HET MECHANISME IS GESCHRAPT (Daan-besluit).** De klemmen-vlag plus week-brede duurcap uit de vorige chat gaat NIET gebouwd worden. GEMETEN tegen de volledige pijplijn waarom: haal je alleen de twee deload-klemmen weg, dan wordt de week 3% lichter (TSS 184 naar 179) bij ongewijzigd volume — een kaart die verlichting belooft en niets levert. Wat 1b WEL wordt: bij Onderhoud vuurt de WEEK-BREDE vermoeidheidskaart niet; de bestaande PER-DAG Verlicht-kaart blijft en dekt "vandaag kapot". Daan negeert die naar eigen zeggen meestal, en dat is precies goed: in de winter hoort hoge intensiteit erbij.
- **MEETVONDSTEN DIE BLIJVEN STAAN** (bundelroute, TZ Europe/Amsterdam, klok gepind). De deload snijdt NUL volume: de `mesoFactor`-cap in `genericLongZ2` vuurt alleen MET event-context; zonder event loopt `long_z2` door de variant-pool en vult de Z2-fill de gekrompen core meteen aan (za blijft 90 minuten, TSS 63, in mesoweek 1 en 4). De HANDOFF-claim "weekend long_z2 x0,6" uit het 3d-stap-3-blok geldt dus NIET zonder event. Vandaag levert de DOWN-kaart bij Onderhoud 1 kwaliteitsdag en 12 minuten hoog-intent. Voor Onderhoud is de UP-richting structureel onbereikbaar (`calendarMesoWeek` is altijd 1) — correct, er is geen kalender-deload om over te slaan.
- **FOCUS VOLGENDE CHAT: stap 1b bouwen, daarna EEN gezamenlijke deploy van stap 1 + 1b + 2.** Deploy-volgorde ongewijzigd: `pnpm build` vanuit repo-root, dan `npx wrangler deploy` vanuit `workers/api`; geen migratie nodig. Daarna in-app check door Daan (hard refresh of incognito i.v.m. SW-cache): winterweek met drie sleutelsessies, drie verschillende sessies. Over vier weken nakijken of ook `threshold_2x12`, `threshold_ladder_kort` en `sweetspot_3x8` langskomen — de tie-break sorteert oplopend op `duurRange[0]`, dus de kortst-gebande sjablonen winnen bij gelijke stand.

**ONDERHOUD-PROFIEL AF (stap 1 doelen-spec) — OP MAIN, NIET GEDEPLOYED (juli 2026).** Commit `09e6a07`, testcommit `ea567e5`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30035229589>). Prod ONVERANDERD: Worker Version `bc3becd7-fcc4-4764-83e9-21f4b7cddffe`. GEEN migratie; `0006` blijft de laatste remote.
- **VLOEREN NU: vitest-totaal 547 · engine-selftest-assert-count 1102** (van 542/1078; commit 1 verhoogt vitest verder). Lees ze uit de suite; niet hardcoden.
- **WAT ER IS.** Stap 1 uit `docs/DOELEN-SPEC.md` §3.2. `PROFILES.onderhoud` (`packages/engine/src/archetypes.ts`): `kwaliteitPerWeek` Base/Build/Peak van 2 naar 3, `spreiding.midweekMinGap` van 2 naar 1, nieuw veld `mesoCyclus: false`. Nieuwe pure helper `effectiveMesoWeek_` (`packages/engine/src/planner.ts`, naast `effectiveMacroFase_`, gate via `profileForDoel_`): levert 1 als het profiel `mesoCyclus === false` draagt, anders de doorgegeven mesoweek ONGEWIJZIGD — vier andere doelen per constructie passthrough, zelfde lijn als `debtEnabled !== false`. `apps/web/src/lib/proposal.ts:325` laat de KALENDER-mesoweek erdoor lopen; dat is de ENIGE samenstelplek. De `mesoWeekOverride` (fatigue-wat-als) houdt VOORRANG en gaat er NIET doorheen — dat is de herstelroute.
- **GEEN DOSIS-SITE GERAAKT.** De meso-uitzondering landt aan de bron, niet bij de `mesoFactor`-consumenten die §7 aanwees; `mesoFactor(1)` is per definitie 1,00, dus ramp én kalender-deload gaan uit zonder één dosis-regel te wijzigen. Variant-rotatie hangt aan `weekIndexFromStart_` en beweegt niet mee.
- **GEMETEN EFFECT** (di45/do45/za90/zo60, doel Onderhoud): kwaliteitsdagen 2 naar 3, hoog-intent 41' naar 61', week-TSS 178 naar 184. Reproduceert EXACT de meting uit de doelen-spec, onafhankelijk tegen de gebouwde code.
- **VIER ANDERE DOELEN BYTE-IDENTIEK, GEBORGD.** Vingerafdruk-test: 4 doelen × 3 fases × 4 weekvormen = 48 (voorgesteld type, naam, totaalMin, TSS, zones per dag). EXPECTED gegenereerd tegen de ONGEWIJZIGDE engine (wijziging gestasht), pas daarna het profiel om — andersom bewijst het niets. 0 van 48 week af. `doelStart`-offsets: Base 0 dagen (2026-03-09), Build 28 (2026-02-09), Peak 56 (2026-01-12); alle drie mesoweek 1, dus de fase is de enige variabele.
- **PRECEDENTIE-TEST (`ea567e5`), BEWUST SMAL.** Legt vast dat de fatigue-override de week VERANDERT en dat een would-be-deload-blokweek zonder override bij Onderhoud een normale week is. Legt NIET vast welke week de override oplevert — die inhoud is stap 1b.
- **KLOK-VONDST (CC, gemeld).** De eerste opzet bouwde de vingerafdrukken op MODULE-niveau, vóór `vi.setSystemTime` — `weekIndexFromStart_` las de echte klok en de mesoweek was niet reproduceerbaar. Gecorrigeerd: opbouw BINNEN de test, ná de klok-pin. Derde keer dat de klok-als-fixture-variabele bijt.
- **HERIJKT, GEEN REGRESSIE.** `testOnderhoudWeekSim`-assertie "onderhoud exact 2 quality" naar 3 (1-op-1, geen telling-effect): het nieuwe quotum IS het nieuwe gedrag.
- **STAP 1b, DAAN-BESLUIT: DE HERSTELWEEK VOOR ONDERHOUD, EIGEN BOUW, VOOR STAP 2.** Daan wil het doel compleet, niet halverwege. Mechanisme + richting + de open ontwerpvraag (dagminuten als hard plafond, dus "volume snijden" vraagt een keuze) staan uitgeschreven in `docs/DOELEN-SPEC.md` §3.2, OPEN. ENGINE, autorisatie nodig voor de twee deload-klemmen in `allocateQualityWeek_`.
- **ZICHTBAARHEID.** Alleen bij doel Onderhoud; staat het doel op FTP dan is deze bouw in de app onzichtbaar. In-app check vraagt een tijdelijke doel-wissel ná deploy (hard refresh/incognito i.v.m. SW-cache).
- **FOCUS VOLGENDE CHAT: stap 1b, de Onderhoud-herstelweek.** Recon-first: de richting staat, de ontwerpvraag moet eerst GEMETEN worden tegen de volledige pijplijn (de simulatiecijfers in de spec zijn proxy). Daarna stap 2 (archetypes 33-68) en één gezamenlijke deploy van 1 + 1b + 2. Verse chat.

**DOELEN-SPEC NEERGEZET + PRIKKEL-IN-DE-RIT FASE 1 GEDEPLOYED (juli 2026).** Doel-spec `docs/DOELEN-SPEC.md` @ `1f916284eadc029e9c31b948ab3b98eca73c9d0b` (225 regels; CI success, run <https://github.com/daanhhk/Cadans/actions/runs/30011520946>). Prod NU Worker Version `bc3becd7-fcc4-4764-83e9-21f4b7cddffe` = main t/m `1f91628`, inclusief engine-commit `b92eaf79` (fase 1). GEEN migratie en geen enkel wrangler-d1-commando; `0006` blijft de laatste remote. 3 assets vervangen, 63 ongewijzigd.
- **VLOEREN ONGEWIJZIGD: vitest-totaal 542 · engine-selftest-assert-count 1078** (deze chat raakte geen code). Lees ze uit de suite; niet hardcoden.
- **PREMISSE-CORRECTIE, DRAGEND.** De scope-herijking uit de vorige chat mat FTP tegen Onderhoud in fase BUILD. Build begint pas 9 weken vóór AGR (half februari 2027) — de hele winter draait op BASE. GEMETEN in Base op dezelfde week: FTP 2 kwaliteitsdagen/40' tegen Onderhoud 2/41'. Het quotum-verschil Build 2-vs-3 bijt dus NIET in de winter. De oude meting (3d/60' vs 2d/43') is exact gereproduceerd en hoorde bij mesoWeek 2 in Build.
- **WAT ER WÉL MIS IS, GEMETEN.** (a) Het gekozen doel is in Base bijna inert: alle vijf doelen leveren 2 dagen en 45' hoog-intent uit dezelfde twee sjablonen. (b) De onderhoudsprikkel krimpt mee met de uren (8u 66' · 4u 41' · 3u 36') — de omkering van M37/M38. (c) Bij schaarste: 2x60 geeft 1 kwaliteitsdag, 3x60 op rij geeft 1. (d) Quotum en tussenruimte zijn SAMEN bindend; elk apart verhogen of verlagen verandert nul. (e) De archetype-tabel is één laag diep in 33-68 min en rijk in 69-105; acht opeenvolgende 3x60-winterweken leveren 2 verschillende sjablonen over 16 kwaliteitssessies.
- **BESLUITEN (norm; staan uitgeschreven in `docs/DOELEN-SPEC.md`).** Onderhoud: quotum 3 in elke fase plus `midweekMinGap` 1 — een vast quotum 3 is bewijsbaar identiek aan `min(3, aantal dagen)` (0 van 5 weekvormen wijkt af), dus dagen en tussenruimte toppen zelf af; gemeten effect op di45/do45/za90/zo60: hoog-intent 41' naar 61' bij TSS 178 naar 184. Geen meso-ramp en geen kalender-deload voor Onderhoud; herstel komt uit de bestaande vermoeidheidskaart en snijdt volume, niet de kwaliteitsdagen. VO2max van de doel-lijst af (middel, geen doel; levert gemeten de MINSTE prikkel van de vijf). Beklimmingen splitsen in kort (t/m 8 min, = AGR) en lang (= Stelvio). Conditie krijgt durability als meetlat: 20-minutenvermogen ná 15 kJ/kg uit intervals.icu, gekoppeld aan prikkel-in-de-rit fase 2 (dezelfde training traint en meet).
- **SEIZOEN ALS KETEN.** Winter Onderhoud, half februari 2027 Build met korte klimmen, 17-04-2027 AGR Toerversie (240 km, 2.960 hm, circa 30 korte steile klimmen waarvan de beslissende na 200 km), zomer 2027 Stelvio-week (meerdaagse, lange klimmen). DATUM STELVIO NOG ONBEKEND — zonder datum periodiseert `eventFase_` er niet op; voorlopige datum invoeren en later aanscherpen.
- **BOUWVOLGORDE.** 1) Onderhoud-profiel · 2) archetypes 33-68 erbij, zonder deze stap wordt stap 1 monotoon · 3) doel-lijst herzien (VO2max eruit, klim splitsen) · 4) durability-meetlat samen met prikkel-in-de-rit fase 2.
- **OPENSTAAND.** In-app check door Daan (hard refresh of incognito i.v.m. SW-cache): zet een dag van 40-45 minuten in de weekplanner en controleer dat daar een drempel- of sweetspot-sessie staat in plaats van de geforceerde VO2max.
- **FOCUS VOLGENDE CHAT: de Onderhoud-profiel-bouw** uit `docs/DOELEN-SPEC.md` paragraaf 3.2. ENGINE: expliciete autorisatie nodig voor `PROFILES.onderhoud` en de meso-uitzondering; selftest-vloer stijgt mee. Verse chat.

**PRIKKEL-IN-DE-RIT FASE 1 AF, NIET GEDEPLOYED — en de scope is herijkt (juli 2026).** Recon-doc `docs/PRIKKEL-IN-DE-RIT-RECON.md` @ `7029416`; docs-correctie `1424755`; engine-commit `b92eaf791dfff59cb4a08c64954562259e7693b5`. CI success (run <https://github.com/daanhhk/Cadans/actions/runs/30007016966>). Prod ONVERANDERD: Worker Version `1c86b3e7-386b-4c7a-b586-4ca0615ca754`. GEEN migratie; `0006` blijft de laatste remote.
- **VLOEREN NU: vitest-totaal 542 · engine-selftest-assert-count 1078** (van 541/1064; geen daling, alle herijkte asserties 1-op-1 vervangen). Lees ze uit de suite; niet hardcoden.
- **WAT ER LIVE MOET (nog approval-gated).** `sweetspot_2x10` en `threshold_2x8` verloren `restrictTo: ['onderhoud']` en hun `duurRange[1]` ging 45→51. Veranderband GEMETEN 33-51 minuten; vanaf 52 minuten is de uitkomst voor alle vijf doelen regel-voor-regel identiek aan daarvoor (invariant onafhankelijk nagemeten tegen de gebouwde code). Effect: een korte dag krijgt doel-passende drempel/sweetspot i.p.v. geforceerde VO2max; bij 33-34 minuten kregen vier doelen eerst HELEMAAL geen kwaliteit. `archetypeAllowedForProfile_` blijft als seam staan (geen archetype zet `restrictTo` nog).
- **FASE 2 BEWUST GEPARKEERD, NIET GEBOUWD.** De lange-dagen-fix (>135 min) is volledig gespecificeerd in het recon-doc §8/§9 en gemeten, maar niet gebouwd: hij dient de opbouw naar AGR, niet de winter. Gemeten blast radius die de bouw duur maakt: `effortsInLangeRit` aanzetten herverdeelt ÉLKE Build/Peak-week met een lange rit (referentieweek: de langste dag wordt `combo_long_with_efforts` en consumeert een kwaliteitsslot, een midweekse prikkel valt weg), niet alleen weken waarin alles lang is. Twee losse vondsten die bij die bouw horen: de selectie-tie-break sorteert oplopend op `duurRange[0]`, dus het plafond mag NIET simpelweg vervallen (regressie gemeten); en `combo_long_with_efforts` telt zijn intent 5 minuten te laag (van drie rustblokken tellen er twee mee) én levert `blokken: undefined`.
- **SCOPE-HERIJKING (Daan, dragend).** FTP en Onderhoud zijn VERSCHILLENDE doelen: FTP = maximale winst binnen de beschikbare tijd, sessies rond 60 min; Onderhoud = FTP zo stabiel mogelijk HOUDEN bij minder uren in de winter, en dat vraagt MEER kwaliteitsdichtheid, met sessies rond 45 min. De app doet het OMGEKEERD. GEMETEN op identieke week (di 45 / do 45 / za 90 / zo 60, fase Build): doel FTP → 3 kwaliteitsdagen, 60 min hoog-intent; doel Onderhoud → 2 kwaliteitsdagen, 43 min hoog-intent. Oorzaak in `PROFILES.onderhoud`: `kwaliteitPerWeek.Build = 2` (ftp 3) en `spreiding.midweekMinGap = 2` (ftp 1) — de donderdag valt uit de eligibility. Sluit aan op T19/T10 (Onderhoud koopt geen prikkel per extra uur) en op de open T2-meetlat.
- **FOCUS VOLGENDE CHAT: het Onderhoud-profiel als winterfix.** Recon-first, ENGINE, expliciete autorisatie, selftest-vloer. Vragen: quotum en tussenruimte voor Onderhoud, of Onderhoud een eigen archetype-set hoort te hebben i.p.v. een verzwakt FTP-profiel, en of de dosis met het urenbudget hoort mee te bewegen. T17-fase-1 uitrollen kan mee in die chat. Fase 2 (lange dagen) blijft liggen tot de lange ritten er zijn.

**ONDERHOUD-SOFT AF + FASE-OVERGANG-AANKONDIGING — BEIDE LIVE (juli 2026).** Prod Worker Version `1c86b3e7-386b-4c7a-b586-4ca0615ca754` = main t/m `d956b14`. GEEN migratie in deze hele reeks; `0006` blijft de laatste remote (remote-D1 onaangeroerd, geen enkel wrangler-d1-commando). CI success (laatste run <https://github.com/daanhhk/Cadans/actions/runs/29999590654>).
- **VLOEREN NU: vitest-totaal 541 · engine-selftest-assert-count 1064** (vitest op vanaf 528; selftest op vanaf 1058 met +6 in `testOnderhoudWeekSim`). Lees ze uit de suite; niet hardcoden.
- **DEEL A — ONDERHOUD-SOFT (T9 + T8), commit `ef7720f`, ENGINE-autorisatie gebruikt op drie plekken.** `effectiveMacroFase_` (`packages/engine/src/planner.ts`) kreeg een derde, OPTIONELE param `eventDriven`: is de fase event-gedreven, dan overleeft die de Onderhoud-pin — behalve `"Test"`, dat vangnet blijft (`computeMacroPhase` staat na blokweek 12 voorgoed op Test). Weggelaten/falsy → byte-identiek aan de oude pin, dus de vier andere doelen zijn ongemoeid. De aanroeper (`apps/web/src/lib/proposal.ts`) geeft `macro != null` door — hetzelfde idioom als `planModusLabel`. De 45-minuten-cap (`maxDuurMin` op `PROFILES.onderhoud`, `archetypes.ts`) is VERVALLEN; de lezer-seam bij de bt-klem blijft staan maar geen profiel zet het veld nog. **Bewuste GAS-fork** (GAS draagt beide, `src/Algorithm.gs:71` + `:943`); GAS noemt het onderhoud-profiel in eigen commentaar onaf (`src/Archetypes.gs:544-546`), dus dit is het afmaken van een gedeclareerd onaf profiel.
- **DEEL A — GEMETEN EFFECT.** Realistische winterweek: hoog-intent van 36' naar 66'; een 165-minutenrit heet niet langer "Drempel 2x8 kort". De pin bijt pas vanaf ongeveer 22-02-2027 richting AGR; wat hij vandaag al sloopte was de event-herstelweek (dag ná de A-race: TSS 89 i.p.v. 21) — die komt terug. Display en plan vallen weer samen (de payload droeg de gepinde fase, de fase-pill de rauwe event-fase). **T10/T19 zijn hiermee dicht** als "gemeten, model-conform".
- **DEEL B — FASE-OVERGANG AANKONDIGEN (M51/M10, open kant van T14), commits `79d0901` + `c4e3003` + `d956b14`, CLIENT-ONLY.** `detectFaseOvergang` (`apps/web/src/lib/faseOvergang.ts`) draait de fase-keten uit `buildWeekProposal` een TWEEDE keer op `today − 7` en vergelijkt op de TOONBARE fase (`macro?.fase ?? macroFase`) — niet op `macroFase`, want de taper leeft alleen daar. Geen persistentie, geen kolom, geen route. Resultaat hangt als optioneel veld `faseOvergang` aan `ProposalWeek`; `faseOvergangRegel` (`coachNarrative.ts`) levert de copy; `FaseOvergangCard` rendert op tab-niveau tussen `PeriodTimeline` en `WeekLoad`. Alleen tekst, geen knoppen: aankondiging, geen voorstel. Fixtures in `/preview` voor de visuele check.
- **DEEL B — MEETCORRECTIE (CC, weerlegde de spec).** De soort `event_overname` (plan wisselt van doel- naar event-gedreven) is via een tijd-verschoven vergelijking ONBEREIKBAAR: `pickMainEvent_` slaat events vóór de referentiedatum over, dus de kandidatenlijst van vorige week is altijd een superset van die van deze week. Tak, copy en het `soort`-veld zijn daarom VERWIJDERD; er staat één test die vastlegt waarom (event-gedreven deze week ⟹ ook vorige week). **Het echte M51-moment ligt bij het INVOEREN van een event** (Events-pagina), niet op een weekgrens — dat blijft open.
- **DEEL B — BEWUSTE STILTE.** Een wissel naar `"Test"` levert `null` op: die fase is een tellerartefact (T12 — na blokweek 12 elke week, voorgoed), geen geplande meting. Aankondigen zou de M5-claim maken die T27 al vlagde. Liever zwijgen dan een valse belofte.
- **OPENSTAAND.** In-app check door Daan (hard refresh/incognito i.v.m. SW-cache): de copy staat op `/preview`; de kaart zelf verschijnt in de Schema-tab pas op een echte overgangsweek. Kleine schuld: `formatVorigeISO_` is de DERDE inline kopie van het yyyy-MM-dd-padpatroon (naast `todayIso` en `weekMondayIso` in `dates.ts`) — losse opruimcommit.
- **FOCUS VOLGENDE CHAT: de prikkel-in-de-rit-fix (T17 korte-dag-val 35-51' SAMEN met het lange-dagen-gat >135').** De app kiest per dag een archetype dat de HELE dag moet omvatten; daardoor forceert een dag van 40' alle doelen naar vo2max (enig passend sjabloon) en krijgt een week waarin élke dag langer is dan 135' NUL kwaliteit. Een coach zet de prikkel als blok BÍNNEN de beschikbare rit (`combo_long_with_efforts`-vorm). Dit is het grootste resterende verschil met een professionele coach en het raakt direct "optimaal trainen binnen de beschikbare tijd". ENGINE, recon-first, expliciete autorisatie, verse chat. Daarna, elk los: M51-consent bij event-invoer · T2 meetlat (`activeGoalProfile_` meet Onderhoud tegen het girona-profiel) · full-history intervals-backfill.

**ONDERHOUD-SOFT — RECON AF, BOUW NOG NIET GEDAAN (juli 2026).** Deze chat = recon + besluiten, GEEN code; docs-only. Recon-doc `docs/ONDERHOUD-SOFT-RECON.md` @ `53f280ec68b205ad3b3482dfb243ef9046e4344a` (CI success, run <https://github.com/daanhhk/Cadans/actions/runs/29982854878>). Prod ONVERANDERD: Worker Version `30b09a2c-4b41-4eeb-9a50-f5438ace1efa` = main t/m `8657afa`. GEEN migratie; `0006` blijft de laatste remote.
- **VLOEREN ONGEWIJZIGD** (deze chat raakte geen code): lees ze uit de suite of uit het RITDETAILS-fase-3-blok hieronder. Niet hardcoden.
- **WAT ER IS.** Gemeten diagnose van R4-item E in `docs/ONDERHOUD-SOFT-RECON.md`: T9 (de fase-pin in `effectiveMacroFase_`) en T8 (de 45-minuten-cap `maxDuurMin` op `PROFILES.onderhoud`). Daan heeft de aanpak goedgekeurd en **engine-autorisatie gegeven voor drie plekken**: `effectiveMacroFase_` (`packages/engine/src/planner.ts`), de `maxDuurMin`-regel in `PROFILES.onderhoud` (`packages/engine/src/archetypes.ts`) en de trailing comment bij de bt-klem in `planner.ts`. Plus één aanroeper-regel in `apps/web/src/lib/proposal.ts`.
- **NIET GEBEURD.** De bouw-prompt is in de chat geschreven maar **NIET uitgevoerd** en vervalt. Er is geen code gewijzigd, geen test toegevoegd, geen deploy gedaan. Bouw vanaf de recon-doc, niet vanaf die prompt.
- **MEETCORRECTIES t.o.v. R3/R4** (volledig in de doc): de **taper overleeft de pin** (eigen dag-overlay, los van `macroFase`); wat de pin wél sloopt is de **event-herstelweek** (dag na de A-race: TSS 89 i.p.v. 21) en de Build/Peak-opbouw; **pin eraf zónder cap eraf maakt de piekweek lichter**, dus de twee horen in één bouw; het **quotum is niet de rem** — `midweekMinGap: 2` laat maar twee kwaliteitsdagen toe, quotum ophogen doet niets.
- **BESLUIT.** T10/T19 gaan dicht als "gemeten, model-conform": de prikkel groeit ook bij doel FTP niet met het urenbudget, en op weekniveau is dat M47-conform. Geen aparte fix.
- **OPENSTAAND, na de bouw, elk los.** (1) De fase-overgang **aankondigen** ("het event komt eraan") — M51/M10, de open kant van T14, client-only. (2) **T2 meetlat**: `activeGoalProfile_` meet Onderhoud tegen het girona-profiel terwijl het planner-profiel `langeRitPerWeek: 0` zet — Niveau/projectie-laag; GAS asserteert Onderhoud daar niet, dus geen oracle houdt het tegen. (3) **T17 korte-dag-val samen met het lange-dagen-gat**: een week waarin élke trainbare dag langer is dan 135 minuten krijgt nul kwaliteit — geldt vandaag al voor alle doelen; de cap maskeerde het voor Onderhoud.
- **FOCUS VOLGENDE CHAT: de ONDERHOUD-SOFT-bouw (T9 + T8)** uit de gepinde `docs/ONDERHOUD-SOFT-RECON.md`. Recon-first is voldaan; engine-autorisatie staat.

**RITDETAILS fase 3 AFGEHANDELD + GEDEPLOYED — tabblad Activiteiten LIVE (juli 2026).** Prod Worker Version `30b09a2c-4b41-4eeb-9a50-f5438ace1efa` = main t/m `8657afa`. GEEN migratie (client-only; `0006` blijft de laatste remote — remote-D1 onaangeroerd, geen enkel wrangler-d1-commando). CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29979969220>). Deploy = `pnpm --filter @cadans/web build` (repo-root) → `npx wrangler deploy` (vanuit `workers/api`); 3 assets vervangen, 63 ongewijzigd.
- **VLOEREN NU: vitest-totaal 528 · engine-selftest-assert-count 1058** (vitest op vanaf 518: +10 `activityList.test.ts`; engine ONAANGEROERD — `git diff --stat packages/engine` leeg). Lees ze uit de suite; niet hardcoden.
- **WAT LIVE IS.** 5e bottom-nav-tab **Activiteiten** (`/activiteiten`): rittenlijst uit `GET /api/activities`, nieuwste eerst, maand-koppen, 50 rijen per keer + "Meer laden", tik op een rij → dezelfde `RideDetailSheet` als de Schema-tab. Die component is ONGEWIJZIGD (props `{id,onClose}`, haalt zelf `/api/ride/:id`) — fase 3 is puur lijst + open-state.
- **SCOPE-BESLUIT (Daan).** De lijst toont **ALLE gesyncte activiteiten**, ook niet-fiets — bewust GEEN `CYCLING_TYPES`-filter. Niet-fiets-rijen krijgen een klein type-label (Hardlopen/Wandelen/Zwemmen/Kracht/Training; onbekend → het rauwe type), fiets-rijen niet. Een activiteit zonder vermogen opent gewoon: `RideChart` heeft `hasWatts`/`hasHr`-guards → HR-only-curve + streepjes op de lege metrics; géén van beide → "Geen tijdreeks voor deze rit".
- **NIET TIKBAAR ZONDER ID.** Lege `activity_id_ext` → de rij rendert als `<div>` i.p.v. `<button>` (zelfde regel als de lege-`idExt`-guard in `RideDetailLink`).
- **PURE LAAG.** `buildActivityList(payload)` + `ActivityListRow` in `apps/web/src/lib/activityList.ts` (DOM-loos, 10 tests in `activityList.test.ts`): EXPLICIETE aflopende sortering op de volledige idx0-string (leunt NIET op de wire-volgorde), ongeldige/ontbrekende datum → rij weg, headline "x,y km | 1u30" of alleen de duur, TSS afgerond, klasse-badge via `rideBadgeFromIf` (idx7). Maand-/dag-labels via `Intl` nl-NL + `parseLocalDate` (geen UTC-shift); de tests asserten bewust NOOIT op exacte Intl-uitvoer.
- **NAV.** `NavIcon.tsx` (TabKey + klok-icoon), `BottomNav.tsx` (5e entry als laatste + `whiteSpace:nowrap` op de label-span), `App.tsx` (route na `/niveau`). Gemeten @375px: 5 tabs à 75px, label "Activiteiten" 57px → geen knel.
- **RITDETAILS IS KLAAR (fase 1 + 2 + 3).** **Later, los:** de full-history intervals-backfill — de tab werkt nu op het recente sync-venster (sync haalt 28 dagen terug, D1 stapelt op), de backfill maakt de lijst diep.
- **OPENSTAAND.** In-app check door Daan (hard refresh/incognito i.v.m. SW-cache): lijst nieuwste-eerst, maand-koppen, tik → popup.
- **FOCUS VOLGENDE CHAT:** Onderhoud-soft vóór de winter (de belangrijkste trainings-fix: `effectiveMacroFase_` pint Onderhoud op Base en overschrijft daarmee de race-piek/taper richting AGR), of de full-history-backfill, of T17 (korte-dag-val 35-51'). Recon-first waar durable; verse chat.

**RITDETAILS fase 2 AFGEHANDELD + GEDEPLOYED (met fase 1) — de ritdetail-popup LIVE (juli 2026).** Prod Worker Version `2735294d-0680-4ca6-bf1b-38bb8392cc9c` = main t/m `c4fcfec` (fase 1 `eb1b759` + fase 2 `2c81b21` + gap-fix `4799fb2` + grafiek-polish `c4fcfec`). GEEN migratie (fase 1+2 raken het schema niet; `0006` blijft de laatste remote — remote-D1 onaangeroerd). Deploy = `pnpm --filter @cadans/web build` (repo-root) → `npx wrangler deploy` (vanuit `workers/api`).
- **VLOEREN NU: vitest-totaal 518 · engine-selftest-assert-count 1058** (op vanaf 505/1058 bij fase-1-start: fase 2 +8, gap-fix +0, polish +5; engine ONAANGEROERD over de hele reeks). Lees ze uit de suite; niet hardcoden.
- **WAT LIVE IS.** "Bekijk ritdetails ›" onder een voltooide rit in de Schema-tab → popup (GAS-parity `rideSheetHtml_`): kop + klasse-badge, zonebalk, hero (NP/IF/TSS), 6-tegel metrics-grid, interval-breakdown, en de **werkende watts+HR-grafiek** (hand-SVG — de curve die GAS nooit bouwde, `Script.html:702`-stub). Fase 1 = worker `GET /api/ride/:id` (`eb1b759`); fase 2 = client.
- **CONTRACT.** `RideDetailModel`/`RideInterval`/`RideStreams` wonen in `packages/shared/src/ride.ts` (worker + client delen ze; de worker re-exporteert → runtime byte-identiek).
- **KLASSE-BADGE.** Client-side uit `ifPct`, byte-exact GAS `intentFromIF_` (`rideBadgeFromIf`, `apps/web/src/lib/rideDetail.ts`): IF<0,70 Duur(z2) · <0,80 Tempo(z3) · <0,88 Sweet Spot(z4) · <0,95 Drempel(z4) · ≥0,95 VO2max(z5) · geen IF → "Training"(z2). Rendert via `ZonePill`.
- **ZONEBALK.** Bestaande pipeline: `zoneTimesFromCell_(zoneTimesJson)` → `actualZone5_` → `doneZoneBlokken` → `<ZoneBars>`.
- **INTERVAL-LABELS = ONZE ZONE-NAMEN** (`intervalZoneName(iv.zone)`, `rideDetail.ts`): Z1 Herstel · Z2 Duur · Z3 Tempo · Z4 Drempel · Z5-7 VO2max — NIET intervals.icu's rauwe "WORK"/"RECOVERY". De "Z{n}"-badge blijft.
- **GRAFIEK** (`RideChart.tsx` + `rideChartGeometry`/`nearestSampleIndex`). Watts (linker-as, `--accent`, vlak+lijn) + HR (rechter-as, secundair), onderbroken lijn bij null-gaten (geen interpolatie), gedownsamplede stream (~400 punten bucket-mean, in de worker). Numerieke assen (watts links, HR rechts, top/mid/onder) + eenheden in de legenda. **Sleep/hover-readout:** vinger/pointer op de grafiek → verticale cursor + dots + watts/HR-waarde op dat tijdstip (`touchAction:none`). `streams:null` → "Geen tijdreeks voor deze rit". Geen charting-lib.
- **AFFORDANCE OP BEIDE VOLTOOID-KAARTEN.** Gedeeld `RideDetailLink` (leeg `idExt` → geen knop) op `DoneDetail` (gereden zónder plan) én `DoneCompareCard` (geplande dag die gereden is — de gewone casus; de `SoonButton`-"binnenkort"-stub is weg, gap-fix `4799fb2`). Het id komt uit `DoneEntry.idExt` = de activities-matrix `idx16` (`activity_id_ext`); `mergeDone` houdt de langste-rit-id.
- **CLIENT-ONLY** (fase 2 + fixes): engine, D1-schema en shared-runtime onaangeroerd (de shared-type-verplaatsing is type-only → worker-JS byte-identiek; de worker-ROUTE was fase 1).
- **DEV-SEED (lokaal, NIET in de deploy).** De Schema-tab is lokaal leeg zonder weekplanner-invoer (R2-V3: lege `planner_days` → 0 dagen; geen week-navigatie, altijd de huidige week). Voor de test is lokaal één echte rit (`i167777709`) naar vandaag verplaatst + een weekplanner-week gezaaid — local-D1-only, reversibel via `POST /api/sync/activities`. Remote-D1 onaangeroerd.
- **OPENSTAAND: RITDETAILS fase 3** = tabblad **Activiteiten** (5e bottom-nav-tab; rittenlijst uit `/api/activities`, nieuwste eerst → tik → dezelfde popup). Spec = `docs/RITDETAILS-RECON.md` fase 3. **Later, los:** de full-history intervals-backfill.
- **FOCUS VOLGENDE CHAT: RITDETAILS fase 3** (client + AppShell-nav), of een andere prioriteit (bv. Onderhoud-soft vóór de winter, R4-lijst). Recon-first waar durable; verse chat.

**RITDETAILS fase 1 AFGEHANDELD + gereviewd — worker-only, NIET gedeployed (juli 2026).** Commit `eb1b759` = nieuwe route `GET /api/ride/:id` (workers/api). D1-lookup op `activity_id_ext` (404 als afwezig) levert de "gratis" velden; on-demand `/activity/{id}` + `/activity/{id}/intervals` + `/activity/{id}/streams` vult de rest → één self-contained `RideDetailModel` (D1-gratis velden + gefetchte metrics/breakdown + gedownsamplede watts/HR-streams, ~400 punten bucket-mean, null-gaten behouden). Deze HANDOFF-commit is docs-only; de code = `eb1b759`.
- **ERROR-MAPPING.** `404` = onbekend id (niet in D1) · `502` = core-fetch non-2xx (`/activity` of `/activity/{id}/intervals`, mapping spiegelt C2's `pushEvents_` 401/403/404/429/5xx) · streams-fout/ontbrekend → `streams:null` (GEEN 502, spiegelt dat GAS streams nooit ophaalde).
- **BESTANDEN.** `integrations/ride.ts` (nieuw) + `routes/api.ts` + `db/repo.ts` (`readActivityByExtId`) + `test/routes.ride.test.ts` (nieuw). Alleen worker; geen client, geen schema.
- **VLOEREN NU** (uit de suite, zojuist gemeten): **vitest-totaal 505 · engine-selftest-assert-count 1058** (engine ONaangeroerd; geen migratie, `0006` blijft de laatste). Lees ze uit de suite; niet hardcoden.
- **DEPLOY-STAND.** Prod draait NOG de FASE-C-versie (Worker `2525127a`); fase 1 is gecommit op main maar NIET uitgerold (approval-gated, aparte stap).
- **GEPROEBDE INTERVALS-VORMEN** (echt id, HTTP 200 — vastgelegd voor fase 2/3): `/activity/{id}` = plat object (`total_elevation_gain`, `average_cadence`, `icu_joules` in Joule → ÷1000 voor kJ, `icu_ftp`/`icu_weight`, `icu_weighted_avg_watts`=NP); `/activity/{id}/intervals` = `{icu_intervals:[…]}`-wrapper (`intensity`=%FTP, `label` vaak null → val terug op `type`); `/activity/{id}/streams` = ARRAY van `{type,data}` met expliciete 1Hz `time`-stream, gaten = null.
- **OPENSTAAND fase 2** (client, verse chat, STOP-en-verifieer): de ritdetail-popup + Schema-tap met hand-SVG watts+HR-grafiek; klasse-badge (GAS `klasseZone`/`klasseLabel`) nog te porten uit de meegegeven velden. **Fase 3** = tabblad Activiteiten (rittenlijst uit `/api/activities` → dezelfde popup).

**CUTOVER-POORT (b) VERVALLEN + RITDETAILS/ACTIVITEITEN INGEPLAND (juli 2026).** Deze chat = recon→besluiten, GEEN code; docs-only. HEAD `6fc1288`.
- **VLOEREN ONGEWIJZIGD** (deze chat raakte geen code): lees ze uit de suite / het FASE-C-blok hieronder (vitest-totaal 501 · engine-selftest-assert-count 1058); niet hardcoden.
- **POORT (b) GESCHRAPT (Daan-besluit).** De DocProp-weekplan-snapshot-migratie — door R4 cutover-blokkerend genoemd — VERVALT. Grond: die historie = de oude GAS-VOORSTELLEN (gepland-zijde), NIET de ritten; rit-historie komt uit intervals.icu (al gesynct). Recon @ `3e8090a` + `6fc1288`: de gepland-historie heeft in Cadans geen live consument (recency-seed `readRecentWeekplans` 8-wk warmt vanzelf op; coverage/debt `intentByDateFrom` lezen alleen DEZE week; het RPE/loadCarry-pad is dood; er is geen historie-scherm). Gevolg-geaccepteerd: weken vóór de overstap tonen je ritten maar geen oud coach-plan. Daarmee zijn de R4-data-migratie-blokkers dicht: (a) FASE-C-push KLAAR, (b) geschrapt. `PUT /api/weekplan/:monday` + de weekplans-tabel blijven ongemoeid (1a schrijft vooruit weg).
- **NIEUW INGEPLAND: RITDETAILS + tabblad ACTIVITEITEN.** Spec = `docs/RITDETAILS-RECON.md` (deze commit). Eén rit openen → detail-popup vanuit de Schema-tab (klik op de rit, GAS-parity) + een nieuw tabblad **Activiteiten** (rittenlijst → tik → dezelfde popup), MÉT vermogens/HR-grafiek. **Kernvondst:** GAS' grafiek is nooit gebouwd (`Script.html:702` "Vermogenscurve · binnenkort"-stub) → NIEUWBOUW, geen reparatie; de rest van GAS' popup is compleet = parity-sjabloon. Cadans-voordeel: `activity_id_ext` in D1 (directe lookup) + kop/zonebalk/NP/IF/TSS/gemW/W-kg/HR gratis uit D1. GEEN engine-/schema-wijziging; hergebruikt de intervals-secrets; geen charting-lib (hand-SVG).
- **PLAN (3 fasen, elk STOP-en-verifieer, gate + CI groen, vloeren niet regresseren).** Fase 1 = worker `GET /api/ride/:id` (on-demand `/activity/{id}` + `/activity/{id}/intervals` + `/activity/{id}/streams`; model incl. gedownsamplede stream). Fase 2 = ritdetail-popup (client) + Schema-tap, incl. hand-SVG watts+HR-grafiek. Fase 3 = tabblad Activiteiten (rittenlijst uit `/api/activities` → popup). Daan-akkoord: grafiek = watts+HR (geen hoogte); Schema-tap vóór het tabblad; een full-history intervals-backfill is een aparte volgende klus.
- **FOCUS VOLGENDE CHAT: RITDETAILS fase 1** (worker-endpoint) uit de gepinde `docs/RITDETAILS-RECON.md`; recon-first is voldaan. Verse chat.

**FASE-C AFGEHANDELD — Push-naar-Garmin via intervals.icu, LIVE (juli 2026).** HEAD `fc952624e702b7814751c97272c8699663efb078` (C3; C2 `c8c844a`, C1 `d303ea1`, recon `770a4ee`). Prod Worker Version `2525127a-ea70-435c-9ee2-9390adf91224` = main t/m `fc95262`. GEEN migratie (client+worker+engine, geen schema-touch; `0006` blijft de laatste remote).
- **VLOEREN NU: vitest-totaal 501 · engine-selftest-assert-count 1058** (op vanaf 482/1052: C1 +6 selftest +1 vitest, C2 +13 vitest, C3 +5 vitest). Lees ze uit de suite; niet hardcoden in prompts.
- **KANAAL.** intervals.icu REST API (`POST /athlete/{id}/events/bulk?upsert=true`) → intervals zet de ZWO om naar FIT → Garmin via de bestaande intervals↔Garmin-koppeling. GEEN directe Garmin-integratie, GEEN Garmin-OAuth. Recon-doc: `docs/FASE-C-PUSH-RECON.md` (@ `770a4ee`).
- **AUTH.** Hergebruikt de bestaande read-sync-credentials — `env.INTERVALS_API_KEY` (secret) + `env.INTERVALS_ATHLETE_ID` (secret), beide remote gezet. `intervalsBasicAuth` = `Basic btoa("API_KEY:"+key)`, byte-identiek GAS. GEEN nieuw secret.
- **C1 (`d303ea1`, ENGINE-autorisatie).** ZWO/DSL/description-wrappers in `packages/engine/src/zones.ts` naast de al-geporte primitieven — `buildWorkoutZwo_(workout,ftp)` (volledige ZWO-XML of null→DSL-fallback; GAS gebruikt LETTERLIJK `<name>`, niet `<n>`), `buildWorkoutDsl_(workout,ftp)`, `buildWorkoutDescription_(workout)`. Enige bewuste GAS-afwijking: ftp-als-parameter i.p.v. `getDocProp` (dependency-injection). Selftest byte-exact.
- **C2 (`c8c844a`, WORKER).** `workers/api/src/integrations/push.ts` — `buildEventPayload` (byte-faithful IntervalsApi.gs: `external_id=coach_<datum>_<type>[_s<n>]` = idempotent/upsert, `SESSIE_UUR [7,17,12,19,6]`, `COACH_NAME_PREFIX`, ZWO-primary + DSL/description-fallback), `pushEvents_` (bulk POST + gedetailleerde HTTP-error-vertaling 401/403/404/429/5xx), `pushWorkouts` (per-sessie skip → `skipped`, één bulk-call, `{pushedCount,skipped,errors}`). Route `POST /api/push` (`api.ts`): valideert `days` (array→anders 400), leest `settings.ftp` uit D1 (default 275 alleen als leeg), config-throw→400/upstream→502. UTF-8-veilige base64 (naam kan emoji/accent bevatten) = enige nodige afwijking t.o.v. `Utilities.base64Encode`.
- **C3 (`fc95262`, CLIENT-only).** `GarminPushButton.tsx` live, tab-niveau onderaan de Schema-tab (GAS-parity). Pure `collectPushDays(view.days, todayISO)` = state today/planned MÉT sessies en datum≥vandaag (vooruit+niet-gedaan incl. vandaag; done/gemist/rest vallen af; datum yyyy-MM-dd, geen `toISOString`). Pure `pushGuard(ftp,count)`: ftp null → "Stel eerst je FTP in…" (GEEN push → dekt de stille-0-watt-hoek uit de R2-C0/FTP-recon), geen dagen → "Geen komende workouts…". Resultaat/skip/fout inline; server-errors bubbelen leesbaar; copy: "Opnieuw drukken werkt de bestaande workouts bij."
- **GEDRAG (Daan in-browser bevestigd).** Drukken synct de hele resterende week (alle komende geplande dagen) in één keer; re-push na een wijziging overschrijft dezelfde dag (`external_id`), geen duplicaat in intervals of Garmin. Client + `/push` lezen dezelfde D1-ftp (280) → geen mismatch.
- **CUTOVER-STATUS.** Poort (a) FASE-C-push DICHT. RESTEERT vóór cutover: poort (b) DocProp-weekplan-snapshot-migratie (gepland-vs-gedaan-historie, data-only). Urgent-niet-blokkerend: Onderhoud-soft (E, vóór de winter). **FOCUS VOLGENDE CHAT: Daan kiest (b) of Onderhoud-soft.** Recon-first waar durable; verse chat.

**3d STAP 4 AFGEHANDELD — FATIGUE-AWARE deload/dosering, LIVE (juli 2026).** HEAD `e56ec8d89aefc206d14a6c2da2da5b9abcd4c3d7` (laag-2; laag-1 `4035bcbb7d44b4e2386743de4c8baef490330ef5`; recon `c439b98`). CI success (laag-2 run <https://github.com/daanhhk/Cadans/actions/runs/29894732753>). Prod Worker Version `b76413fe-e219-4c94-9516-2720656f9394` = main t/m `e56ec8d`. **Migratie `0006_public_marauders` NU REMOTE toegepast** (twee nullable `sync_state`-kolommen `fatigue_shift_week` + `fatigue_shift_dir`; harde volgorde: remote-migratie EERST, dán deploy — de loader roept `GET /api/fatigue-shift` onvoorwaardelijk aan). Client-only feature + migratie; engine byte-identiek.
- **VLOEREN NU: vitest-totaal 482 · engine-selftest-assert-count 1052** (vitest op vanaf 459: +16 `fatigue.test.ts` + 7 `routes.fatigue-shift.test.ts`; engine ONGEWIJZIGD). Lees ze uit de suite; niet hardcoden in prompts.
- **WAT HET DOET.** De deload/dosis reageerde puur op de kalender (`mesoWeek` uit `doelStart`); STAP 4 maakt 'm fatigue-aware op een OBJECTIEVE maat (TSB), als VOORSTEL-en-bevestig — nooit stil (laag 2 verwijderde de stille week-demote; die grens blijft). Signaal = 7-daags gemiddelde van wellness `vorm` (=CTL−ATL, uit de load, NIET de readiness-band/ochtend-check-in). Twee richtingen: **UP** (kalender-deload + fris, TSB-trend > `+8` → `mesoWeek` 4→1 = doortrainen op een normale volle week) en **DOWN** (opbouwweek + diep/aanhoudend vermoeid, TSB-trend < `−25` → `mesoWeek` →4 = vervroegde STAP-3 reduced-load-deload). Heel-week-granulariteit via een `mesoWeekOverride?` op `buildWeekProposal` (`proposal.ts`) → de gesubstitueerde `mesoWeek` stroomt naar dosis (`mesoFactor`) + deload-flag (`isMesoRecovery`); variant-rotatie (`weekIndexFromStart_`) ongemoeid → geen karakter-/archetype-wissel. **Engine byte-identiek** (client-only).
- **MECHANISME.** Wat-als + per-week opt-in, exact het Inhaal/debt-patroon: een tweede `buildWeekProposal`-run met de override, gediff't tegen het kalenderplan, getoond in `FatigueCard` (offer/applied, up/down); akkoord → `putFatigueShift(monday, dir)` → `sync_state.fatigue_shift_week`/`_dir` → de verschoven week IS het actieve plan, omkeerbaar met één tik, vervalt vanzelf de maandag erna (M68). Route `GET/PUT /api/fatigue-shift` (mirror `/api/debt-optin`). Copy M55-safe (voorwaardelijk "Ik kan…", geen "Ik heb…"). **DOWN onderdrukt de inhaal-kaart** die week (M66/M72 herstel-wint-van-inhalen; laag-1 zet `inhaal=null` + de InhaalCard-guard kreeg `!fatigueVoorstel`). Onderdrukt bij `nearTaper`, `macroFase` Test/Recovery, en onder de min-data-poort.
- **DREMPELS = NAMED EXPORTS** (`apps/web/src/lib/fatigue.ts`): `UP_TSB_THRESHOLD=8`, `DOWN_TSB_THRESHOLD=-25`, `FATIGUE_TREND_WINDOW_DAYS=7`, `FATIGUE_MIN_ROWS=21`, `FATIGUE_MIN_WINDOW_DAYS=42`. Daan-vastgesteld; te herijken op zijn data zonder de logica aan te raken. **DOWN `−25`** is bewust dieper dan de recon-`−20` (in een opbouwweek is TSB −10..−30 productief-normaal → `−20` zou 'n vervroegde deload voorstellen midden in gezonde overload); verdiep naar `−30/−35` als hij zeurt in normale piekweken. GEEN K/M-persistentie: `vorm` is al een gladde EWMA-differentie → 7-daags gemiddelde + buffer-drempel + min-data-poort levert "aanhoudend" al.
- **BEWUSTE GAS-FORK.** GAS' `loadCarryFactor_` (`Algorithm.gs:2038`, SUBJECTIEF: vorige-week-RPE-mismatch ×0,93/×0,88, én STIL: dempt de dosis zonder voorstel) is NIET geport → vervangen door een OBJECTIEVE (TSB) + GESURFACETE (opt-in-kaart) heel-week-substitutie.
- **ZICHTBAARHEID.** De kaart verschijnt ALLEEN op een mismatch-week (kalender-fase ≠ vermoeidheid) → max 1×/week; op eens-gezinde weken niets. `/preview` (VoorstelPreview) toont alle drie de states (up-offer, down-offer, applied) voor de visuele check zonder een live mismatch af te wachten. Live: hard refresh/incognito (SW-cache).
- **OPENSTAAND.** In-app functionele check door Daan (er is mogelijk nu geen live mismatch-week). Drempel-ijking op echte data (empirisch).
- **3d KLAAR (STAP 1–4).** Secundair los, nog niet onderzocht: het Z3/tempo-zone-label op een duur-dag (mogelijk display).
- **VERVOLG / HORIZON = de cutover-lijst** (R4-verdict). Blokker (c) plan-van-record + twee-richtingen-coach DICHT. OPEN, de twee harde poorten: **(a) FASE-C workout-push** (ONTBREKEND — zonder dit kan Cadans geen workouts naar Garmin duwen → GAS blijft daarom live) en **(b) migratie van de DocProp-weekplan-snapshots** (gepland-vs-gedaan-historie, valt buiten "Sheet→D1"). Urgent-niet-blokkerend (geërfd): Onderhoud-soft (E, vóór de winter — de belangrijkste trainings-fix als het doel naar Onderhoud kantelt), T17, C1, T25. **FOCUS VOLGENDE CHAT: Daan kiest (a)/(b)/Onderhoud-soft.** Recon-first waar durable; verse chat.

**3d STAP 3 AFGEHANDELD — deload-INHOUD: reduced-load-week met één lichte prikkel, LIVE (juli 2026).** HEAD `c8c6f34a4bb16eb26372d978d8498969f0ddbfd1`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29857674066>). Prod Worker Version `a678624c-735c-4273-96a2-ad310372d779` = main t/m `c8c6f34`. Engine+client, GEEN migratie (`0005` blijft de laatste; geen schema-touch). DEZE HANDOFF-commit is docs-only; de live code = `c8c6f34`.
- **VLOEREN NU: vitest-totaal 459 · engine-selftest-assert-count 1052** (op vanaf 458/1040). Lees ze uit de suite; niet hardcoden in prompts.
- **WAT HET DOET.** De meso-deload (`isRecovery = isMesoRecovery && !nearTaper`, blokweek 4) was een kale easy-week die ALLE kwaliteit stripte (`allocActive=false`); dat schuurde met M76 ("recovery verlaagt de dosis, niet het karakter"). Nu een reduced-load-week MÉT één lichte kwaliteitsprikkel: volume omlaag, %FTP nominaal, tijd-in-zone omlaag. **Bewuste GAS-fork** (GAS strípt óók alles, `Algorithm.gs:1060-1065`) — sluit aan op M76. nearTaper-onderdrukte weken, `isEventRecovery` en test-weken ONGEMOEID.
- **INGREEP 1 — dosis-spiegel voor `f<1`.** De dosis-ramp was add-only (`if (f > 1 …)`); gespiegeld: `else if (f < 1 && nominalWork > 0) workScale = f` in `expandArchetype_` (`archetypes.ts`) + `renderVariant_` (`planner.ts`) → core-werktijd krimpt ×f, de endurance-fill absorbeert vanzelf tot `doelMin` (plannerMin = harde bovengrens), %FTP nominaal. `f=1` byte-identiek · `f>1` ongemoeid (STAP 2 intact).
- **INGREEP 2 — allocator laat één slot toe in de deload.** `allocActive` dropt `!isRecovery` (`planner.ts:529`) → meso-deload krijgt `allocActive=true`; `allocateQualityWeek_` krijgt optionele `isDeload` (13e param, = `isRecovery` doorgegeven zodat nearTaper is meegewogen) → quotum `1` i.p.v. fase-quotum, weekdag-only eligibility, geen langerit/debt (`:173/:190/:203/:341/:379`); de `isRecovery`-tak (`:640`) laat de gekozen quality-weekdag doorvallen naar de quality-plaatsing. Weekend blijft `long_z2` ×0.6 (cap `planner.ts:1630`, symmetrisch), pendel `pendel_z2`, overige weekdagen `recovery`.
- **ZICHTBAARHEID.** Toont zich op de deload (blokweek 4): één prikkel op een weekdag (tijd-in-zone ×0.6) + rest rustig/korter, i.p.v. de kale easy-week. Deze week (van 20-07, `doelStart 2026-06-29`) IS zelf een deload → live te checken (hard refresh/incognito i.v.m. SW-cache); een handmatige override op deze week maskeert de deload-inhoud (verwijderen om 'm te zien).
- **TESTS.** `testDeloadInhoud3d` borgt de ×0.60-dosis (high 40→24), 1-prikkel-op-weekdag, weekend=`long_z2`, pendel=`pendel_z2`, overige=`recovery`, plus ongemoeid (normale week = volle quota; event-recovery stript alles). `testKarakterInvariantie` uitgebreid naar mesoweek 1..4 (long_z2 90→150 voor fill-headroom) → borgt %FTP-invariantie óók onder de deload (`f<1`). `testTaperGuard3d` deload-assert 0→1 (nieuw gedrag).
- **ONTWERP-DOC.** `docs/3D-STAP3-DELOAD-INHOUD.md` (meegebundeld in `c8c6f34`).
- **VERVOLG / OPEN 3d-items** (op dit fundament):
  1. **STAP 4 — FATIGUE-AWARE dosering.** Dosis + deload-TIMING reageren op werkelijke vermoeidheid, niet enkel de kalender (case: verse benen op een kalender-deload → doortrainen). GRENS: laag 2 verwijderde de stille week-demote → een fatigue-hendel mag NIET stil het weekplan verzwakken; moet objectief (TSB/vorm) + karakter-invariant + surfaced/voorstel zijn. GAS-ref: `loadCarryFactor_` (RPE-mismatch damper ×0.93/×0.88) — in Cadans gedropt (default 1). Grote engine-klus, eigen recon, verse chat.
  - **SECUNDAIR (los).** Het Z3/tempo-zone-label op een duur-dag — mogelijk display; nog niet onderzocht.

**3d STAP 2 + 2b AFGEHANDELD — dosis-gedreven meso-ramp (DOSIS, niet intensiteit) + coach-verleng, LIVE (juli 2026).** HEAD `80b5a115cb576986c735ff8887f5a91b2a1791bf`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29853212841>). Prod Worker Version `e363857a-afc6-4dd9-ba18-2777f057d1e2` = main t/m `80b5a115cb576986c735ff8887f5a91b2a1791bf`. Motor-commit `4d17678402af3fc06f4dc3ebab8acd59efca01a9`; 2b-commit `80b5a115cb576986c735ff8887f5a91b2a1791bf`. Engine+client, GEEN migratie (`0005` blijft de laatste; geen schema-touch).
- **VLOEREN NU: vitest-totaal 458 · engine-selftest-assert-count 1040** (motor: vitest 456→458, selftest 1024→1040; 2b +0). Lees ze uit de suite; niet hardcoden in prompts.
- **PRINCIPE (Daan-akkoord).** `plannerMin` = HARDE BOVENGRENS — niets loopt over de ingestelde per-dag-tijd. De week-op-week opbouw in Base/Build/Peak komt VOLLEDIG uit de kwaliteits-dichtheid (tijd-in-zone), niet uit langere ritten. Karakter-invariant (M74-M78): %FTP nominaal, alleen de dosis beweegt.
- **KWALITEITS-RAMP (motor).** De core-werktijd ×`mesoFactor(mesoWeek)` in `expandArchetype_` (`archetypes.ts`) + `renderVariant_` (`planner.ts`); de endurance-fill + overhead-trim (cooldown→`minCooldown` 5, warmup→`minWarmup` 8) absorberen → sessie-totaal ≤ `doelMin` (nooit overlopen). `addedWork = min(nominalWork×(f−1), room)`; consumptievolgorde fill→cooldown→warmup; `trimbaar` per-component geclampt (archetypes met warmup<8 / cooldown<5 nooit verlengd). f=1 (blokweek 1) byte-identiek. f<1 (deload) N.V.T. — de deload heeft geen kwaliteit (`allocActive=false`) → STAP 3.
- **LONG_Z2-CAP (motor).** `genericLongZ2` = `max(60, min(mins, round(mins×mesoFactor)))` (`planner.ts:1567`). Opbouwweek (f≥1) → `mins` (gecapt; de vroegere ×1.08/1.15-overschrijding vervalt); deload (f<1) → `mins×f`. Pendel ongemoeid.
- **TAPER-GUARD (motor).** `assignWorkouts`: `isRecovery = isMesoRecovery && !nearTaper`; `nearTaper` = taper binnen `[0..7+venster]` dagen van weekMaandag. Onderdrukt de kalender-deload in de taper-week + de week ervoor. Dormant tot ~event.
- **2b VERLENG-FLOW (CLIENT-ONLY).** Op een opbouwweek-2/3 `long_z2`-dag (fase ∈ Base/Build/Peak, plánbaar, `day.override==null`) biedt de coach aan de duurrit te verlengen van `vanMin` naar `round(vanMin×mesoFactor)`; 1 tik → `putOverride(datum, {type:"library", workoutType:"long_z2", durMin:naarMin, label})` → `buildWorkout("long_z2", naarMin)` (de motor-cap respecteert de doorgegeven duur). PER-DATUM consent (het aanbod keert elke opbouwweek terug). Spiegelt de Verlicht-flow; applied-detectie via `label` (bewust GEEN `src:'readiness'` — dat zou de Verlicht-copy kapen). `mesoFactor` client-side uit `@cadans/engine` (single source). Touch: `SchemaView.tsx`, `coachNarrative.ts` (`verleng*`-functies), `schema.ts` (`verlengResultaat`), nieuw `VerlengCard.tsx`. GEEN engine/API/schema-wijziging.
- **ZICHTBAARHEID.** Motor + 2b tonen zich PAS op opbouwweken 2/3; op de deload (week 4) + blokweek 1 byte-identiek aan vroeger. 2b (client-UI, geen automatische test) live te checken op de eerstvolgende opbouwweek — hard refresh/incognito i.v.m. SW-cache.
- **RECON-DOC.** `docs/3D-STAP2-DOSIS-RAMP-RECON.md` (definitieve versie, gepind @`4861fa4d3b57d52e90ce89595073fd352a868cf9`). 2b had geen aparte recon-doc (client-only; ontwerp in de commit + hier).
- **VERVOLG / OPEN 3d-items** (op dit STAP-2-fundament):
  1. **STAP 3 — deload-INHOUD.** Verlaagde belasting mét behouden structuur (één lichte kwaliteitsprikkel + gereduceerd volume) i.p.v. de huidige volle easy-week. De huidige deload strípt de kwaliteit (`allocActive=false`) → schuurt met M76 ("recovery verlaagt dosis, niet karakter"). Daan-lean: reduced-load-with-structure.
  2. **STAP 4 — FATIGUE-AWARE dosering.** Dosis + deload-TIMING reageren op werkelijke vermoeidheid, niet enkel de kalender (concrete case: verse benen op een kalender-deload → doortrainen). GRENS: laag 2 verwijderde de stille week-demote → een fatigue-hendel mag NIET stil het weekplan verzwakken; moet objectief (TSB/vorm) + karakter-invariant + surfaced/voorstel zijn. GAS-ref: `loadCarryFactor_` (RPE-mismatch damper ×0.93/×0.88) — in Cadans gedropt (default 1).
  - **SECUNDAIR (los).** Het Z3/tempo-zone-label op een duur-dag — mogelijk display; nog niet onderzocht.

**3d STAP 1 AFGEHANDELD — mesoWeek-teller-correctie (cyclische 3:1-mesocyclus), LIVE (juli 2026).** HEAD `d1ec86c`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29828795321>). Prod Worker Version `64ccdf19-ed8d-4d29-a08a-629673909dd9` = main t/m `d1ec86c`. Client+engine, GEEN migratie (`0005` blijft de laatste; geen schema-touch).
- **VLOEREN NU: vitest-totaal 456 · engine-selftest-assert-count 1024** (op vanaf 454/1013). Lees ze uit de suite; niet hardcoden in prompts.
- **WAT HET DOET.** `weekIndexFromStart_` (0-gebaseerd, ONgeklampt, weken sinds `doelStart`) werd rechtstreeks als mesoWeek-argument gebruikt, terwijl `MESO_MOD` `{1:1.00,2:1.08,3:1.15,4:0.60}` en `isMesoRecovery` (`=== 4`) een cyclische 1..4-mesoweek verwachten (GAS `getMesoWeek`-pariteit). Gevolg: off-by-one op de dosis-ramp én de recovery-week vuurde eenmalig op blokweek 5 (w0===4) en daarna NOOIT meer → geen deload na wk5, lange-termijn overtraining-risico. **FIX (engine, geautoriseerd):** nieuwe pure helper `mesoCycleWeek_(weekIndex) = (((weekIndex % 4) + 4) % 4) + 1` in `packages/engine/src/utils.ts`, naast `MESO_MOD`/`mesoFactor`; `proposal.ts:299` componeert `const mesoWeek = mesoCycleWeek_(weekIndexFromStart_(settingsE))`. `weekIndexFromStart_` blijft ONgemoeid de monotone variant-rotatie-index (`selectVariant_`, `planner.ts:1497`). Netto: schone 3:1-cyclus (blokweek 1-3 opbouw 1.00/1.08/1.15, blokweek 4 deload 0.60), deload herhaalt correct op blokweek 4/8/12.
- **STRUCTUREEL PUNT** (recon-doc `docs/3D-STAP1-MESO-TELLER-RECON.md`). De mesoWeek is verankerd aan `doelStart` terwijl de fases event-gedreven zijn (Daan: A-doel AGR 2027-04-17, ~39 wk → event-gedreven Base) = TWEE KLOKKEN. Voor een lange base-fase acceptabel; knelt bij blok-overgangen + vlak vóór taper. Prod `doelStart = 2026-06-29` → blokweek 4 → deze week (van 20-07) is NÁ de fix een deload; de eerder in de HANDOFF vermoede "magere week"-oorzaak (deze recovery-gate) klopte NIET op Daans datums — de gate vuurde onder de oude code pas 27-07. Daan-inschatting bij deploy: benen fris, geen zware voorafgaande week → hij traint deze week bewust door (sweetspot) i.p.v. de kalender-deload te volgen; illustreert precies het kalender-vs-fatigue-gat.
- **DEPLOY-STAND.** Client+engine (3 assets), Worker-code + engine = `d1ec86c`. Deploy-procedure ongewijzigd: build vanuit repo-root (`pnpm --filter @cadans/web build`), `npx wrangler deploy` vanuit `workers/api`. Basic-Auth-gate actief (`/api/health` → 401). OPENSTAAND: in-app check door Daan (hard refresh/incognito i.v.m. SW-cache) — de app toont deze week nu als deload.
- **VERVOLG / 3d-PROPER** (bewust uitgesteld, op dit gecorrigeerde teller-fundament):
  1. **BLOK-VERANKERING van de deload** — blok-einde i.p.v. losse 4-weeks-tel vanaf `doelStart` (twee-klokken-probleem); relevant bij blok-overgangen + vlak vóór taper. Onlosmakelijk met de dosis-ramp (blok-bewust).
  2. **DELOAD-INHOUD** — nu een volle easy-week via de isRecovery-tak (`planner.ts:613`, weekdag→recovery/weekend→long_z2/pendel→pendel_z2); trainer-model-vraag: volle rustweek vs verlaagde-belasting-week met behouden structuur.
  3. **FATIGUE-AWARE dosering** — de deload/dosis reageert nu puur op de kalender, niet op werkelijke vermoeidheid; de dosis-ramp maakt 'm fatigue-aware (volume/tijd-in-zone/weekTSS).
  4. **De dosis-ramp zelf** (volume/tijd-in-zone/weekTSS) = de kern van 3d-proper; `mesoFactor` raakt post-werkstroom-2 nog enkel de long_z2-DUUR — de ramp verbreedt dat.
  - **SECUNDAIR** (los, apart te verifiëren): het Z3/tempo-zone-label op een duur-dag — mogelijk een display-label-kwestie; nog niet onderzocht.

**WERKSTROOM 3 AFGEHANDELD — WeekLoad "Dagen"-noemer telt alle geplande trainingsdagen, LIVE (juli 2026).** HEAD `36386866`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29821244484>).
- **VLOEREN NU: vitest-totaal 454 · engine-selftest-assert-count 1013** (vitest op vanaf 453; engine ONGEWIJZIGD). Lees ze uit de suite; niet hardcoden in prompts.
- **WAT HET DOET.** De WeekLoad-kaart-noemer ("Deze week · gepland vs gedaan", de "Dagen"-teller) telde alleen VOORUIT-te-plannen dagen: `sessions` wordt in `deriveSchemaView` (`apps/web/src/lib/schema.ts`) enkel gevuld voor `tePlannen` = `train && !gedaan && datum >= vandaag` (`proposal.ts`), dus elke verstreken/gedane trainingsdag kreeg `sessions=[]` en viel uit de noemer → toonde 1/4 bij 5 trainingsdagen. **FIX (CLIENT-ONLY, `schema.ts:1065`):** tel per dag de GEPLANDE duur > 0, onafhankelijk van de tePlannen-splitsing — vooruit: som `sessions[].totaalMin`; verstreken/gedaan: `plannedForDone?.totaalMin ?? 0`. Kernregel = duur > 0 (NIET `!= null`), zodat een naar-rust-gezette 0-min-dag niet meetelt en een pendel/multi-sessie-dag één keer telt. Gedaan-teller ONGEMOEID (teller ≤ noemer geborgd). Test in `apps/web/src/lib/schema.test.ts` (week ma 2026-03-09..zo, vandaag=wo via todayISO-param): `dagen.gepland === 5` (oud 3), pendel=1, rust=0, gedaan=1 — faalt zonder de fix.
- **PARITY-HERSTEL, GEEN DIVERGENTIE.** Cadans telde afwijkend van GAS (alleen vooruit); nu GAS-conform op `weekPlanSummary_` (`WebApp.gs:973` — geplandDagen = weekplan-entries met minuten>0, multi-sessie=1 dag). Anders dan werkstroom 2 (bewuste fork) is dit een terugkeer NAAR GAS.
- **ENGINE ONGEMOEID.** `git diff --stat packages/engine` leeg → selftest-count 1013 ongewijzigd; geen engine-autorisatie nodig (client-only).
- **DEPLOY-STAND.** Prod Worker Version `8f90247d-61e4-4788-becf-a0ae7693f748` = main CODE t/m `36386866` (de fix). GEEN migratie (`0005` blijft de laatste; remote-D1 "No migrations to apply!"). Client-only uitrol (3 assets geüpload; Worker-code + schema ongewijzigd). DEZE HANDOFF-commit is docs-only en raakt de gedeployde code NIET. Deploy-procedure ongewijzigd: build vanuit repo-root (`pnpm --filter @cadans/web build`), `npx wrangler deploy` vanuit `workers/api`.
- **OPENSTAAND.** In-app functionele check door Daan (hard refresh/incognito i.v.m. SW-cache): de teller toont nu X/5 bij 5 trainingsdagen.
- **VERVOLG / HORIZON.** Van de open werkstromen resteren de twee nieuwbouw-fases: **3c** (per-rit gepland-vs-gedaan-koppeling, §2 van `docs/T28-FASE3B-PENDEL-RECON.md`) en **3d** (dosis-gedreven meso-ramp: volume/tijd-in-zone/weekTSS, MÉT de geparkeerde mesoFactor-teller-bug — off-by-one + vlak na wk4/wk5, R2-V2). **3d = de volgende grote klus**, eigen verse chat, recon-first, engine-autorisatie + selftest-vloer. De teller-/zones-werkstromen (vermogenszones = werkstroom 2, dagteller = werkstroom 3) zijn nu beide dicht.
  - **3d — EERSTE DEELSTAP VASTGELEGD (magere-week-symptoom, in-app juli 2026).** BEVINDING: een week oogde te mager — slechts 1 kwaliteitsprikkel waar het fase-quotum er 2 (Base/Peak) of 3 (Build) verwacht, en de voor vandaag geplande sleutelsessie verviel naar Z2. WAARSCHIJNLIJKE OORZAAK: de mesoWeek off-by-one (R2-V2/V14). Cadans' `weekIndexFromStart_` (`packages/engine`, `planner.ts`) is ONGEKLAMPT → `isMesoRecovery` (`mesoWeek === 4`, `planner.ts` ~:494) vuurt alleen op blokweek 4 en daarna NOOIT meer. In de allocator zet een recovery-week de week-brede kwaliteitsplaatsing uit (GAS-parity: `Algorithm.gs:822` quota / :840 `remaining=quota−doneHard` / :991 `isMesoRecovery` / :1002 "Base/Build/Peak NIET Recovery" → `allocActive=false`). TWEE KANTEN: (1) deze week mogelijk een bedoelde OF scheve recovery-week; (2) na blokweek 4 nooit meer een herstelweek → lange-termijn overtraining-risico. Dit is NIET veroorzaakt door de werkstroom-3 teller-fix (die was display-only). POSITIONERING (Daan-akkoord): teller-correctie = STAP 1 van 3d, recon-first, ENGINE → expliciete autorisatie + selftest-vloer, VÓÓR de dosis-ramp; teller-semantiek + dosis-ramp delen dezelfde grond (R2-V2 koppelt ze), dus samen in 3d, niet als losse clamp. RECON-EERSTE-VRAAG: welke blokweek/fase zit Daan deze week in (weken sinds `doelStart`) — beslecht of deze week echt herstel hoort te zijn of de teller scheef staat; de 3d-recon haalt `doelStart`/fase op. SECUNDAIRE KLEINE CHECK (los van het aantal sleutelsessies): het Z3/tempo-zone-label op een duur-dag — mogelijk een display-label-kwestie, apart te verifiëren.

**WERKSTROOM 2 AFGEHANDELD — meso-/fase-intensiteits-hendel verwijderd, karakter-invariantie LIVE (juli 2026).** HEAD `e2633fc`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29816847832>).
- **VLOEREN NU: vitest-totaal 453 · engine-selftest-assert-count 1013** (op vanaf 452/997). Lees ze uit de suite; niet hardcoden in prompts.
- **WAT HET DOET (was werkstroom 2, MID — "vermogenszones te hoog").** De meso-/fase-%FTP-intensiteits-hendel is uit de motor. Commit `e2633fc`. Elk workout-blok krijgt zijn NOMINALE %FTP; een blok schuift niet meer uit zijn zone in de piek-mesoweek (endurance→tempo, sweetspot→threshold). Verankerd in norm **M74–M78** (karakter-invariantie): karakter invariant onder meso/fase, de meso bouwt op via DOSIS niet intensiteit, recovery-week verlaagt dosis niet karakter, de mix verschuift op MACRO-niveau. **Bewuste GAS-divergentie** — GAS draagt dezelfde schending; Cadans forkt, GAS ongemoeid. Recon: `docs/MESO-INTENSITEIT-RECON.md`.
- **VERWIJDERD/BEHOUDEN.** `VARIANT_FASE_OFFSET` VOLLEDIG weg (dode code na de fix; repobreed geen andere lezer). `adj` → identiteit in `renderVariant_` + `expandArchetype_`. Alle 12 pct-hendel-sites (generics + `workoutFor*`-libraries) op nominale pct; elke `Math.round(pct·f)` → nominale pct. **Ongemoeid:** de DUUR-hendels (`genericLongZ2`, conditie `long_z2` = `target·mesoFactor`) en de SELECTIE-/MIX-hendels (`selectVariant_` weekIndex-rotatie, `GOAL_FASE_MOD_`/`goalEffWeights_`). Nieuwe test `testKarakterInvariantie` borgt pct-invariantie over mesoweek 1–4 én fase Base/Build/Peak op BEIDE paden (renderVariant_ + expandArchetype_); `testArchetype` (7) van meso-richting → invariantie herijkt.
- **BEVESTIGING UIT DE RECON.** Daans Intervals-power-zones zijn identiek aan de app-grenzen (56/75/90/105%) → geen zone-grens-fix nodig; de klacht "zones te hoog" was 100% de pct-multiplier, niet de zone-definitie.
- **DEPLOY-STAND.** Prod Worker Version `21a880e5-72c5-4447-a3bd-a1fdb635cc9c` = main HEAD `e2633fc`. GEEN migratie (schema onaangeroerd, `0005` blijft de laatste, remote-D1 "No migrations to apply!"). Deploy-procedure ongewijzigd: build vanuit repo-root (`pnpm --filter @cadans/web build`), `npx wrangler deploy` vanuit `workers/api`.
- **VERVOLG.** De DOSIS-gedreven meso-ramp (volume/tijd-in-zone/weekTSS) hoort in **fase 3d** — de meso doet nu bewust bijna niets tot 3d de dosis-hendel levert. De **mesoFactor-teller-bug** (off-by-one + vlak na wk4, R2-V2) blijft geparkeerd naar 3d. Nog open: **werkstroom 3** (dagteller 1/4 bij 5 trainingsdagen, LAAG).

**T28 FASE 3 DEELS — pendel-weergave compleet + werkstroom 1 (label + leak) afgehandeld, LIVE (juli 2026).** HEAD `e77ae32`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29808110373>).
- **VLOEREN NU: vitest-totaal 452 · engine-selftest-assert-count 997.** Lees ze uit de suite; niet hardcoden in prompts.
- **3a (`aaab804`) — `pendelDuurMin` = duur PER RIT.** De settings-UI verdubbelde de invoer (`legToRoundTrip`); dat was de enige echte bug (de engine leest de waarde ongehalveerd en × `pendelAantal`, byte-identiek aan GAS). Verwijderd. **LIVE.**
- **3b (`72ce7eb`) — binnen-sessie Heen/Terug-split weg.** `genericPendelZ2` → één blok "Hele rit"; `genericPendelIntervals` → "Warming-up" + het werkblok. Belasting byte-identiek (totaalMin/tss/zones/structuur). **LIVE.**
- **3b-copy (`bc95df1`) — richting-bewuste notes.** Rit 1 = heen (rustig), rit 2 = terug (prikkel). Optionele `leg`-param op `genericPendelZ2` + `buildWorkout` (default "heen" → byte-identiek); de warmup-note "Aanrijden naar werk" → "Rustig op gang" omdat die generic ALTIJD de terugrit is. **LIVE.**
- **WERKSTROOM 1 AFGEHANDELD (was HOOG) — GEEN readiness-demote, GEEN override.** De "ongevraagde dinsdag-inkorting" is het GAS-getrouwe trim-label "(ingekort)": de engine-naam (`planner.ts renderVariant_`) is byte-identiek aan GAS, en het identity-contract in `zones.ts` (`scaleBlocksToFit_`) is intact — het label vuurt ALLEEN bij een échte trim, staat volledig los van readiness. Recon: `docs/T28-INGEKORT-PENDEL-RECON.md`. Fix `e77ae32` (CLIENT-ONLY, display): (a) `stripFaseSuffix` (`schema.ts`) haalt nu óók "(ingekort)" uit de display-naam (engine-naam ongewijzigd); (b) de pendel-navigatie-leak opgelost met een unieke React-key (`SchemaView.tsx` + `DayStrip.tsx`) — de niet-unieke `${s.naam}-${s.tss}`-key liet twee identieke pendel-sessies cross-day meeverhuizen tot een harde reload; nu `key={`${day.datum}-${i}`}`. Beide **LIVE** in `571a6f58`.
- **DEPLOY-STAND.** Prod Worker Version `571a6f58-1b4a-463b-bbcf-8850a728d774` = main HEAD `e77ae32` (= fase 1 + 2a + 3a + 3b + 3b-copy `bc95df1` + de twee T28-fixes `e77ae32`). De vorige deploy-achterstand (3b-copy + fixes) is weggewerkt. Migratie-stand ongewijzigd: `0005` blijft de laatste, remote-D1 meldt "No migrations to apply!" (geen schema-touch in `bc95df1`/`e77ae32`). Pendel-waarde in remote D1 (user 1): **`pendel_duur_min = 75`, `pendel_aantal = 2`** — Daan heeft in de UI herbevestigd, dus de per-rit-semantiek klopt.
- **DEPLOY-PROCEDURE ongewijzigd.** `npx wrangler deploy` MOET vanuit `workers/api` draaien (de gepinde 4.106.0, waar `wrangler.jsonc` staat) — NIET vanuit de repo-root, die pakt een nieuwere wrangler en faalt op "workspace root". De assets-binding wijst statisch naar `../../apps/web/dist` ZONDER build-hook → `pnpm --filter @cadans/web build` vanuit de repo-root vóór de deploy. Migratie-volgorde blijft: remote-D1-migratie EERST (vanuit `workers/api`), DAARNA de deploy.
- **RESTEREND SPOOR uit werkstroom 1 (niet dringend, eigen fase).** De archetype-keuze propt een lange-Z2-template (raw main 80-95 min) in een korte dag (60 min, target 45) → dáárom wordt er geknipt. Of daar een korter Z2-archetype hoort i.p.v. een lange knippen is een engine/library-vraag (R3/R4-hoek). Optionele verificatie: check op prod/dev dat DI schoon toont ("Lange Z2 steady" zonder haakje) en de weekplan-dagminuten kloppen; blijkt iets ná de fix nog ongevraagd kort dat NIET het label is → heropenen op de dagminuten.
- **CORRECTIE op het FASE 2a-blok hieronder:** de bullet "FASE 3 RESTEERT (… + pendel-opschoning …)" is ACHTERHAALD — de pendel-opschoning is met 3a/3b/3b-copy AF. Wat van fase 3 rest is 3c + 3d (zie hieronder).

**OPEN WERKSTROMEN (elk recon-first, eigen fase; prioriteitsvolgorde):**
1. **[MID] Vermogenszones ogen te hoog / bron onduidelijk.** Pendel-Z2 168-202W vs lange-Z2 216-227W — twee verschillende Z2-ranges, de tweede boven de warmup-top (140-190W). Wijst op een zone-bron-mismatch. Recon: waar komen de zones/FTP vandaan (Intervals vs lokaal berekend) en waarom verschilt Z2 per workout-type.
2. **[LAAG] Dagteller toont 1/4 bij 5 trainingsdagen.** De teller "DAGEN" telt een dubbele training niet dubbel, maar 4 ≠ 5 → mogelijk een noemer-bug of config-restje. Check of het na de goede pendel-config nog bestaat.
3. **[NIEUWBOUW] 3c — per-rit gepland-vs-gedaan-koppeling** (§2 van `docs/T28-FASE3B-PENDEL-RECON.md`). GAS koppelt óók per dag → dit is een Cadans-eigen verbetering, geen parity. Open ontwerpvraag: de koppelregel (tijdstip/volgorde/duur) + de half-gereden-status (§5 van dat recon-doc). Nog niet aangeraakt.
4. **[NIEUWBOUW] 3d — effectief weekdoel + weekfeedback.** Het globale urengetal als duur-consument (± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer. Recon: `docs/T28-FASE3-RECON.md`. Nog niet begonnen.
- Ook geparkeerd (losse tune): de warmup-verhouding in `genericPendelIntervals` — warmup = `floor(mins/2)` ≈ 37 min bij 75.
- **FOCUS VOLGENDE CHAT: werkstroom 1 hierboven = de vermogenszones (was #2, nu de hoogste resterende prioriteit).** Recon-first; verse chat.

**T28 FASE 2a KLAAR — readiness biedt korter/rust (juli 2026).** Commits `91b05cb` (2a-i) + `00819a9` (2a-ii), CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29765030319>). Recon-doc: `docs/T28-FASE2-HERSTEL-RECON.md` (commit `18dc915`).
- **VLOEREN NU: vitest-totaal 449 · engine-selftest-assert-count 972.** Lees ze uit de suite; niet hardcoden in prompts.
- **FASERING GECORRIGEERD.** De fase-2-omschrijving in het FASE 1-blok hieronder ("per-dag-minuten als PLAFOND in het weekplan; benut de tijd tenzij het type kort is of het weekbudget gehaald") is **ACHTERHAALD**. Twee redenen uit de recon: (1) *"type van nature kort"* is trainingsinhoudelijk FOUT — efforts laat in een lange rit (durability) zijn juist goede training, geen reden om in te korten; (2) de readiness-band raakt het WEEKPLAN bewust niet meer (R3-T22; `proposal.ts` `signal = "normal"`), dus er is geen fatigue-signaal ín het weekplan om zo'n plafond op te baseren. **Norm die daaruit volgt:** herstel-inkorting is FATIGUE-gedreven → per-dag en opt-in; een BELASTING-gedreven weekbudget → fase 3. Daarom werd fase 2 de readiness-uitbreiding en geen weekplan-plafond.
- **WAT 2a DOET.** Het per-dag Verlicht-voorstel (alleen vandaag, alleen op een harde sessie, band caution/rest, opt-in en omkeerbaar) biedt naast "lichter" nu ook **KORTER** en **RUST**.
  - **2a-i (`91b05cb`) — RestOverride end-to-end.** Nieuwe `RestOverride {type:"rest"}` in de `DayOverride`-union; `buildOverrideWorkout_` → `null` (ENGINE, geautoriseerd, de enige tak); `proposal.ts` zet `appliedOverride = ov` óók bij 0 sessies, zodat de rustdag de pin + "Terug naar voorstel" krijgt; worker `isValidOverride` accepteert rest (meta-checks vóór de type-dispatch, want de `durMin`-controle liep er anders overheen); `OverriddenDetail` rust-tak. "Korter" werkte al via de bestaande override-`durMin` en vroeg geen code.
  - **2a-ii (`00819a9`) — readiness biedt korter/rust.** `readinessAdjust_` (ENGINE, enige functie): caution krijgt `durFactor` uit de nieuwe geëxporteerde const `CAUTION_DUR_FACTOR = 0.8`; rest krijgt `restAllowed: true` en HOUDT de recovery-spin als aanbeveling. `buildVerlichtVoorstel`: caution → `durMin × 0,8` (clamp op de contract-ondergrens 20); rest → de spin-override plus een secundaire `RestOverride`. `VerlichtCard` krijgt bij rest een tweede knop. **Coaching-keuze:** de herstelrit blijft primair, rust staat er gelijkwaardig naast — niet opgedrongen, niet verstopt.
- **FASE 2b GESCHRAPT.** De dag-na-hard-cap (C uit de recon) is vervallen: de caveat woog zwaarder. Een rustige rit ná een harde dag is vaak juist waardevol (durability / back-to-back, relevant voor het klim-event), en de intensiteits-downgrade dekt "nooit stapelen" al. **Er komt dus geen 2b — fase 2 is met 2a compleet.**
- **FASE 3 RESTEERT (ENGINE + copy).** Effectief weekdoel (het globale urengetal ± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer + pendel-opschoning tot één plek. De herstel-bescherming die aan een WEEK-blik hangt (een dag korter of rust omdat de week al genoeg heeft) hoort hier; het per-dag/fatigue-deel is met 2a gedekt. Het `durCapMin`-mechanisme uit de recon is bewust **NIET** gebouwd — C was de enige consument — dus fase 3 bouwt de weekplan-duurhendel zodra het weekdoel de consument levert.
- **LOS EINDJE (niet blokkerend).** De `/preview`-fixtures tonen nog de oude twee-knops-VerlichtCard, dus de rust-knop en de nieuwe copy zijn nergens visueel te beoordelen (zoals eerder bij de InhaalCard). Een kleine fixture-update maakt ze zichtbaar. In de app verschijnt de rust-knop alleen bij band `rest` op een harde dag vandaag; gedekt door 7 nieuwe tests.
- **DEPLOY ONGEWIJZIGD.** 2a voegt GEEN migratie toe. De volgorde blijft: migratie `0005` op REMOTE D1 EERST, DAARNA `npx wrangler deploy`. Prod draait nog zónder `week_uren` en zónder fase 2a.
- **FOCUS VOLGENDE CHAT: T28 fase 3** (effectief weekdoel + weekfeedback + pendel-opschoning; ENGINE + copy) — recon-first, Daan reviewt vóór de bouw, expliciete engine-autorisatie. Of een andere prioriteit, bijvoorbeeld Onderhoud-soft uit R4 (vóór de winter). Verse chat.

**T28 FASE 1 KLAAR — capaciteit-veld + projectie-baseline (juli 2026).** Commit `5c031a8`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29729708477>). Schema + contract + web; **motor ONGEMOEID** (`git diff --stat packages/engine` leeg).
- **VLOEREN NU: vitest-totaal 435 · engine-selftest-assert-count 967 ONGEWIJZIGD** (vitest op vanaf 429; +6 via de weekUren-round-trip + client-serialisatie-tests). Lees ze uit de suite; niet hardcoden.
- **WAT FASE 1 DOET.** Nieuw settings-veld `weekUren` (kolom `week_uren`, migratie `0005_remarkable_centennial.sql` = één ALTER die alleen `week_uren` toevoegt, nullable integer, in `SettingsInput` OPTIONEEL zoals `coachNaam` → fixtures ongemoeid). Hele contract-keten mee: `readSettings` (`r.weekUren` — expliciete kolom-map, NODIG naast `writeSettings`, anders schrijft de PUT wel weg maar zwijgt de GET = round-trip stil kapot; door de round-trip-test gevangen) + `writeSettings` vals + PUT `/api/settings` (`numField`) + `serializeSettings` (spreidt `...s`) + client `settings.ts` (NUM_KEYS/EMPTY_FORM/settingsToForm) + Instellingen-UI (Row "Beschikbare uren per week / globaal richtgetal" onder Volume-profiel, `last` verplaatst). De **FTP-projectie-schuif** (`Niveau.tsx` → `DoelProjectie.tsx`) leest nu `settings.weekUren` als startwaarde; terugval op `weeklyHoursRecent_(rows,42)` (gereden verleden), anders 8. Dev-server geverifieerd, geen console-errors.
- **NIET GEDEPLOYD — uitrol approval-gated, TWEE delen, VOLGORDE als bij 0004.** (a) `0005` op REMOTE D1 EERST (`wrangler d1 migrations apply cadans --remote` vanuit `workers/api`), (b) DAARNA `npx wrangler deploy`. Andersom valt élke GET/PUT `/api/settings` om op de ontbrekende kolom → niet alleen het nieuwe veld maar het HELE Instellingen-scherm + de Niveau-projectie. Prod draait nu nog de code zónder `week_uren`.
- **T28-RICHTING (Daan-akkoord): B (generatief).** De coach wordt volledig leidend in hard/zacht ÉN duur; Daan levert alleen beschikbare tijd per dag + pendel-markering; herstel altijd beschermd. Coaching-NORM (vast): doe wat een gerenommeerde trainer doet — beschikbaarheid bepaalt WANNEER gefietst kan worden, de trainer bepaalt HOE HARD. De globale weekuren uit instellingen zijn de basis; een fase (peak) die meer vraagt regelt de trainer zélf mét uitleg — niet week in week uit om uren bedelen. Doeluren = het globale instellingen-getal; de coach mag er ±~1u omheen bewegen op fase, mits hij uitlegt waarom. GAS heeft hier GEEN meetlat (`getVolumeTargets` = fase-dosering, geen door-user-plafond) → coaching-deugdelijkheid is de norm, geen parity.
- **RECON-ONTDEKKING (dragend voor fase 2).** De motor kiest NU AL zelf: het AANTAL harde dagen (`kwaliteitPerWeek` uit het profiel, fase-afhankelijk: Base 2 / Build 3 / Peak 2) + WELKE dagen (`pickBestSpread_` + avoid-consecutive-hard + debt-anchors) + de endurance-fill. "Coach leidend in dag-KEUZE" bestaat dus al; fase 2 gaat NIET over dag-selectie. Wat de per-dag-minuten NU doen (`planner.ts`): niet-pendel-dag = EXACTE sessieduur (`sel.minuten` → `renderVariant_`) + archetype-keuze (`bt` → `goalWorkout_`); pendel-dag = sessie op `settings.pendelDuurMin` (per-dag-minuten genegeerd) maar telt WEL in `weekV`; week-totaal `weekV` (Σ minuten / 60) voedt de volume-adaptieve intent-weging. Pendel-inconsistentie: `weekV` telt de per-dag-pendel-minuten, de sessie gebruikt `settings.pendelDuurMin` × `pendelAantal` → onderschat de pendel-belasting (verwant aan R1-C1) → opschonen in fase 3.
- **FASE-INDELING (Daan-akkoord), elk een STOP-en-verifieer + eigen bouw, gate + CI groen, vloeren niet regresseren, prod approval-gated:**
  - **Fase 1 (KLAAR).** Capaciteit-veld + projectie-baseline (schema + web, motor ongemoeid).
  - **Fase 2 (VOLGENDE, ENGINE).** De motor leest de per-dag-minuten als PLAFOND i.p.v. vast plan: de coach kiest de WERKELIJKE duur binnen de beschikbare tijd — benut de tijd, TENZIJ het type van nature kort is (scherpe VO2max) of het weekbudget al gehaald is → dan korter of rust (herstel). EERSTE bewuste engine-wijziging → **begint met een recon-doc dat byte-precies uitschrijft wat verandert**; Daan reviewt VÓÓR de bouw + expliciete engine-autorisatie + selftest-vloer. **Verse chat.**
  - **Fase 3 (ENGINE + coach-copy).** Effectief weekdoel (globaal ± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer (onder doel → "ruimte, optioneel meer, maar ik optimaliseer voor nu"; ruim erboven → "mooi, stappen mogelijk") + herstel-bescherming (coach mag een beschikbare dag rustig/rust maken) + pendel-opschoning tot één plek (markeren volstaat; heen Z2, terug coach-bepaald; belasting telt mee in het budget).
- **PROJECTIE-NUANCE (fase 1 context).** De grafiek start bij de werkelijke CTL van NU (verleden = gereden ritten, zit in `currentCtl`); alleen de toekomst-ramp (nu → testdag) gebruikt het uren-getal. Verleden komt dus niet uit een getal. De hele reis incl. gereden weken als lijn tonen = losse latere toevoeging, niet nodig voor T28.
- **FOCUS VOLGENDE CHAT: T28 fase 2 (engine, plafond-duur).** Recon-doc EERST, Daan reviewt vóór de bouw. Verse chat.

**INHAAL/DEBT-LAAG LIVE IN PRODUCTIE + anti-stapel-fix (juli 2026).** Fix-commit `f47ae2b`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29719111308>). Prod Worker Version `feda7a08-6893-4ce5-9db5-dca235066a40`; remote-D1-migratie `0004_lush_carmella_unuscione` (`sync_state.debt_opt_in_week`) toegepast op REMOTE. Volgorde: schema EERST, deploy DAARNA (de veilige volgorde — de loader roept `GET /api/debt-optin` onvoorwaardelijk aan binnen zijn `Promise.all`).
- **VLOEREN NU: vitest-totaal 429 · engine-selftest-assert-count 967 ONGEWIJZIGD.** Lees ze uit de suite; niet hardcoden in prompts.
- **DE OPENSTAANDE BEVINDING IS AFGEHANDELD (deel 1 van 2).** `derivePlannerGedaan` kent geen `datum < vandaag`-guard → een VANDAAG gereden harde sessie markeert vandaag gedaan en valt uit de allocator-eligibility. GEVERIFIEERD (read-only): de week-allocator hoort de geleverde harde prikkel van het kwaliteitsquotum af te trekken (`allocateQualityWeek_`: `remaining = quota − doneHard`), maar `doneHard` leest `d.voorgesteldType` en de worker schrijft `planner_days.voorgesteld_type` ALTIJD null (`repo.ts` writePlannerDays) → `isHardType_(null)` = false → de aftrek was PERMANENT INERT → een hard gereden dag stapelde bovenop het weekquotum (schendt "nooit stapelen"). FIX `f47ae2b` (CLIENT-ONLY, engine byte-identiek): `buildWeekProposal` geeft de allocator een verrijkte `weekDays`-kopie (`weekDaysForAlloc`) waarin een gedaan-dag met ≥`DEKKING_MIN_MIN` (15) high/anaerobic WERKELIJK-gereden zone-minuten een afgeleid hard `voorgesteldType` krijgt — puur voor de `doneHard`-telling. `weekDays` wordt in de engine UITSLUITEND gelezen (`doneScan` :216 + `volBron` :229), dus de UI/done-kaart + de days-map houden het originele grid; `minuten` behouden → weekvolume-som identiek. Test `quotaAftrek.test.ts` (klok gepind op 2026-03-09; FAALT zonder de fix → SLAAGT ermee). Netto: een hard gereden dag kost nu een kwaliteitsslot i.p.v. bovenop het quotum te komen.
- **DEEL 2 GEPARKEERD — post-deploy-check.** De PLAATSINGS-verschuiving (welke resterende dag het kwaliteitsslot krijgt als vandaag wegvalt) is nog NIET empirisch geverifieerd. De spreiding neemt de gereden harde dag als anchor mee via `recentHardDate_`, dat "hard" bepaalt op IF ≥ 0.85 (of intent) — een ANDER criterium dan de aftrek (zone-minuten). Randgeval: een sessie met ≥15 min high maar IF < 0.85 én lege intentByDate telt wél voor de aftrek maar mogelijk NIET als spreiding-anchor → de volgende kwaliteitsdag kan iets te dicht landen. Niet-stapelend (gaat over dag-KEUZE, niet belasting), niet blokkerend; check ná verdere prod-ervaring. Eventuele fix raakt `recentHardDate_` = ENGINE (autorisatie + selftest-vloer).
- **OPENSTAAND — functionele round-trip op prod in-browser door Daan** (hard refresh/incognito i.v.m. SW-cache): laadt de Schema-tab, dan werkt de `/api/debt-optin`-query met de nieuwe kolom.
- **FOCUS VOLGENDE CHAT: T28 — het uren-/capaciteit-model.** Recon-first + een plan dat Daan reviewt VÓÓR de bouw. Er is geen gedeclareerd capaciteit-veld; de weekplan-minuten dragen dubbel (intentie-sensor én de-facto limiet), waardoor M26/M29 geen referent hebben. Raakt vermoedelijk engine + schema + design → durable-review. Verse chat.

**INHAAL/DEBT-LAAG KLAAR — fasen 0 t/m 3b (juli 2026).** HEAD `0185a6c`, CI groen.
- **VLOEREN NU: vitest-totaal 426 · engine-selftest-assert-count 967** (op vanaf 391/961).
  **Dit zijn de ACTUELE vloeren — niet hardcoden in prompts;** lees ze uit de suite zelf.
- **WAT DE LAAG DOET.** Een geplande-maar-niet-geleverde VERSTREKEN dag draagt tekort — de
  M63-fork in `zoneDebt_`: de poort staat op verstreken (`[maandag .. vandaag)`) in plaats van
  op `gedaan`, met `debt = intent − actual`. Volledig gemist → volle intent; te licht →
  deel-debt. Dat is een GEAUTORISEERDE GAS-divergentie (`Algorithm.gs:515` slaat een
  niet-gedane dag over). De coach toont daarop een per-week **INHAAL-VOORSTEL**
  (`buildInhaalVoorstel`, `apps/web/src/lib/schema.ts`) — een tweede "wat-als"-run van
  `buildWeekProposal` met `planAdaptation: true`, gediff't tegen het actieve plan. Vier
  poorten: een betekenisvol high/anaerobic-tekort (M64/M65 — alleen `catchup_low` telt niet),
  voldoende frisheid (band ≠ caution/rest, M66), en geen rust-vragende reden (M73 —
  `bewust_gerust`/`iets_anders` onderdrukken; `geen_tijd` of geen reden laat door). De
  gebruiker keurt **per kalenderweek** goed (`sync_state.debt_opt_in_week` = de maandag);
  daarna is het herverdeelde plan het ACTIEVE plan voor die week, terugdraaibaar met één tik,
  en de goedkeuring vervalt vanzelf de maandag erna. Herstel is beschermd (M72) — structureel,
  want de week-allocator-eligibility laat een `recovery`-dagtype niet toe.
- **MECHANISME-PUNT.** `PLAN_ADAPTATION_ENABLED` (`planFlags.ts`) staat nog **false**, maar de
  inhaal-flow hangt daar NIET meer aan: de loader stuurt `planAdaptation` expliciet — via de
  per-week opt-in voor het actieve plan, en hard `true` voor de wat-als-run. De vlag gate't nu
  alleen nog het pad dat `intentByDate` buiten die twee routes voedt.
- **NORM.** `docs/TRAININGSMODEL.md` draagt de regels **M62 t/m M73** (herverdelen niet
  stapelen · gemist telt · betekenisvol tekort · kwaliteit vóór volume · herstel wint van
  inhalen · geen twee kwaliteitsprikkels naast elkaar · advies-goedkeuring-omkeerbaar ·
  per-week scope · twee bevindingen · herstel beschermd · de reden weegt mee). Recon:
  `docs/INHAAL-DEBT-RECON.md`.
- **[AFGEHANDELD — nu LIVE; zie het bovenste blok.]** **NIET GEDEPLOYED.** De laag staat op main en is lokaal getest, maar draait NIET in
  productie — prod draait tot nader order de versie zónder deze laag. Uitrollen is
  approval-gated en bestaat uit TWEE delen die BEIDE moeten: (a) `npx wrangler deploy`
  (Worker + web-assets) en (b) de forward-only D1-migratie **`0004_lush_carmella_unuscione.sql`**
  (`debt_opt_in_week`) op REMOTE/prod-D1 — `wrangler d1 migrations apply cadans --remote`
  vanuit `workers/api`, **nog niet gedraaid**. Let op de volgorde: de loader roept
  `GET /api/debt-optin` onvoorwaardelijk aan binnen zijn `Promise.all`, dus deployen zónder
  de migratie laat de hele Schema-tab omvallen, niet alleen de inhaal-kaart. Migratie eerst.
- **[AFGEHANDELD — geverifieerd + gefixt in `f47ae2b`; zie het bovenste blok.]** **OPENSTAANDE BEVINDING — te verifiëren VÓÓR deploy.** `derivePlannerGedaan` kent geen
  `datum < vandaag`-guard. Een rit die VANDAAG gelogd is markeert vandaag dus als gedaan →
  vandaag valt uit de allocator-eligibility → de resterende quality-plaatsing van de week kan
  verschuiven. Conceptueel in lijn met adaptief plannen, maar NIET geverifieerd of het
  deugdelijk uitpakt: telt de allocator de al-geleverde sessie mee, of ontstaat er dubbele
  belasting? Blootgelegd doordat een datum-relatieve testfixture omviel toen de kalender
  doorliep (fixtures staan nu op absolute datums). Onderzoeken vóór uitrol; geen regressie
  van deze laag.
- **GEPARKEERD.** M70 — de weekend-inhaaltak is vrijgesteld van avoid-consecutive-hard en kan
  naast een harde dag landen; randgeval dat Daans huidige config niet raakt, hoort bij een
  latere allocator-fase. Per-dag-debt-uitsluiting op dispositie (engine, buiten scope; M73 is
  bewust een grove week-poort). De wat-als-run draait per render voor niet-goedgekeurde weken
  — puur en client-side, maar het is wél twee keer het weekplan doorrekenen.
- **VOLGENDE HORIZON (Daan-doel): het uren-/capaciteit-model (T28).** Er is geen gedeclareerd
  capaciteit-veld; de weekplan-minuten dragen nu dubbel (intentie-sensor én de facto limiet),
  waardoor M26/M29 geen referent hebben. Expliciet "hoeveel uur heb ik" invoeren dient het
  pendel-optimalisatie-doel het meest direct.

**LAAG 2 KLAAR — het per-dag VERLICHT-VOORSTEL + de week-brede stille demote ERUIT (T22 opgelost).** HEAD `6799c7a`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29684618388>).
- **VLOEREN NU: vitest-totaal 391** (op vanaf 371; +20 via `verlicht.test.ts` + `proposal.test.ts`) · **engine-selftest-assert-count 961 ONGEWIJZIGD** (engine niet aangeraakt; `git diff --stat packages/engine` leeg). **Dit zijn de ACTUELE vloeren — niet hardcoden in prompts.**
- **WAT LAAG 2 DOET.** Op een doordeweekse VANDAAG met een HARDE sessie (`isHard` via `workoutZones` high/anaerobic) ÉN band ∈ {caution, rest} ÉN fase NIET Taper/Recovery → een `VerlichtCard` (`apps/web/src/components/schema/VerlichtCard.tsx`) in het CoachCallout-formaat met VOORWAARDELIJKE aanbod-copy ("Ik kan…", geen daad-claim, M55-safe) + `[Verlicht…]` / `[Hou origineel]`. Akkoord → dag-override `src:'readiness'` via de BESTAANDE keten (`putOverride` → `PUT /api/override/:date` → `ProposalDay.override` → `OverriddenDetail` → "Terug naar voorstel", omkeerbaar). Transformatie = `readinessAdjust_` (`coach.ts:595`, geport, ONGEWIJZIGD): caution → `demoteType_(type)`, rest → `recovery`. Override-vorm: `tempo`/`recovery`/`long_z2` → library; `combo_long_with_efforts` + `pendel_z2` → free (staan niet in `OVERRIDE_WORKOUT_TYPES`); pendel-multisessie overgeslagen (`sessions.length !== 1`). "Hou origineel" = sessie-scoped dismissal (module-level Set, GEEN D1-persistentie) → komt terug bij de volgende app-open zolang de band caution/rest is. Copy in `coachNarrative.ts` (`verlichtAanbodRegel`/`verlichtResultaatRegel`/`verlichtActieLabel`/`verlichtBadgeLabel`).
- **STAP 1 — de stille demote eruit.** `proposal.ts:383-404`: de band→signal-vertaling + `combineSignals_` zijn vervangen door `const signal = "normal"`. Geverifieerd (`proposal.test.ts`): band caution én rest leveren `JSON.stringify(days)` BYTE-IDENTIEK aan band ready; `WELL_RECOVERY` + `WELL_SUSTAINED_LOW` laten het plan ongemoeid. Het week-vooruit-plan is weer het onverzwakte beste plan. De readiness-band-BEREKENING + de banner/context-weergave zijn ONGEMOEID — alleen het doorgeven van de band als week-demote-signaal aan `assignWorkouts` is vervallen. **BEWUSTE GAS-DIVERGENTIE:** GAS demote't óók week-breed, maar via het BOTTE signaal (`Algorithm.gs:91`/`:137`); Cadans verzwakt niet meer week-breed, alleen per-dag-op-akkoord.
- **CONSEQUENTIE (T30 structureel dood).** Het week-signaal was de ENIGE consument van het `rpeSignal_`/`plannedTypeByDate`-pad → dat pad is vervallen. `PLAN_ADAPTATION_ENABLED` (`planFlags.ts:25`) gate't daardoor nog uitsluitend `intentByDate` (`proposal.ts:143`). Vlagwaarde NIET aangeraakt; alleen de doc-comment waarheidsgetrouw bijgewerkt. De "stille RPE-beslisser"-zorg (R3-T22/T30) is hiermee niet enkel uit, maar structureel weg.
- **REFACTOR (bijvangst).** `OVERRIDE_WORKOUT_TYPES` verplaatst naar `packages/shared` (de worker importeert 'm nu) → tweede kopie vermeden.
- **OPENSTAAND — VISUELE CHECK.** Alleen de NEGATIEVE paden zijn in-browser bevestigd (band ready 91 + bestaande handmatige override → géén kaart, geen coachregel, geen console-errors); de POSITIEVE paden zijn door de 20 unit-tests gedekt, NIET visueel (screenshot liep op een timeout). De VerlichtCard-weergave + de overgang naar `OverriddenDetail` na akkoord verschijnen vanzelf op een doordeweekse vandaag met een harde sessie + lage gereedheid → dan in-browser checken (hard refresh i.v.m. SW-cache). Niets forceren.
- **CUTOVER-STATUS.** Blokker (c) is nu grotendeels DICHT — plan-van-record (1a+1b) + het per-dag verlicht-voorstel staan. RESTEERT binnen (c): de **INHAAL/DEBT-laag** (bewust een EIGEN FASE), want die vraagt de `gedaan`-koppeling (activiteit↔plan; `planner_days.gedaan` staat nu altijd 0, `repo.ts:367`) + `PLAN_ADAPTATION_ENABLED` aan + de debt-aware basis + de "deze sessie vult je tekort aan"-uitleg-copy (`coachNarrative.ts:44-63`, `catchup_*` ligt al klaar). (a) FASE-C Garmin-push en (b) DocProp-migratie blijven open. Recon-doc: `docs/LAAG2-VERLICHT-RECON.md` (commit `6446fb3`).
- **FOCUS VOLGENDE CHAT: keuze aan Daan** — (1) de INHAAL/DEBT-fase (sluitstuk van blokker c), (2) blokker (a) Garmin-push, of (3) blokker (b) DocProp-migratie. Plus de openstaande visuele check van de VerlichtCard zodra een geschikte dag zich voordoet. Verse chat.

**PLAN-VAN-RECORD + CROSS-WEEK RECENCY KLAAR — laag 1a + 1b (juli 2026). Eerste pre-switch-bouw.** HEAD `9ebfa1b`.
- **VLOEREN NU: vitest-totaal 371 · engine-selftest-assert-count 961** (op vanaf 329/957). **Dit zijn de ACTUELE vloeren** — oudere entries hieronder noemen historische waarden; nieuwe chats nemen deze. Bevestigd tegen HEAD.
- **1a (plan-van-record).** De weekplans-blob wordt weggeschreven (`persistWeekplan`, fire-and-forget, dedup op de vooruit-dagen); de WORKER bevriest het verleden (`mergeFrozenWeekplan` = `snapshotDayAction_`-parity, `Algorithm.gs:57`/`:185`, gestuurd door `todayISO` uit de body). V24: `plannedForDone` leest de BEVROREN entry i.p.v. te reconstrueren met de FTP-van-nu. 3a: `zeroIntentOutsideZones` nult per sessie de buckets buiten `zones` vóór de aggregatie (de blob wijkt daardoor af van een GAS-export → de migratie transformeert). De DECIDERS (intent-dekking + RPE-demote) staan achter `PLAN_ADAPTATION_ENABLED=false` → vooruit-plan byte-identiek. Recon: `docs/PLAN-VAN-RECORD-RECON.md`. Commits `fbbc292` + `5c36490`.
- **1b (cross-week recency).** De `goalWorkout_`-seed wordt cross-week gevoed via een 13e OPTIONELE param op `assignWorkouts` (`recencyEntries`; GEAUTORISEERDE engine-wijziging, byte-identiek als weggelaten). De client voedt de al-gegatherde weekplans-lijst rechtstreeks — `getWeekplans` levert al de output van `gatherWeekplanEntries_`, dus geen reader. ONGEGATE (benign: kiest tussen even geldige sleutelsessies, verzwaart/verlicht niet). Meting: 15/15 doel×fase flippen, C-geval stabiel; `archetypeId` is LIVE (de `:1455`-comment was stale, herschreven — 1a's "archetypeId structureel null" was een fixture-datum-meetfout). Recon: `docs/RECENCY-1B-RECON.md`. Commit `9ebfa1b`.
- **BEWUSTE GAS-DIVERGENTIE (gelogd).** De seed neemt ALLEEN weken vóór deze week (`proposal.ts`, filter `datum < weekMonday`), terwijl GAS de huidige week wél meeneemt (`Algorithm.gs:971`, k=0, `refISO=null`). Reden: Cadans hergenereert+schrijft op ELKE render → ongefilterd leest de seed zijn eigen output terug, overschaduwt de vorige week volledig (gemeten: plan identiek aan een lege blob → cross-week dood) en flip-flopt over renders. De filter levert GAS' BEDÓELING (persistente cross-week-rotatie) robuuster dan GAS zelf; stabiliteit vastgelegd over 4 opeenvolgende renders. Type: fork die een GAS-quirk corrigeert in Cadans' render-model, geen semantische wijziging.
- **CUTOVER-STATUS.** Van de drie blokkers is (c) NU HALF rond — de plan-van-record-basis (1a+1b) staat; de **TWEE-RICHTINGEN-COACH** (verzwakking + inhalen via voorstel-en-bevestig) is het resterende, cutover-kritische deel. (a) FASE-C-push en (b) DocProp-migratie blijven open. Landmijn **V15 (recency) is hiermee OPGELOST** (was niet-blokkerend).
- **FOCUS VOLGENDE CHAT: laag 2 = de TWEE-RICHTINGEN-COACH.** Enige stuk met écht nieuwe UI en GEEN GAS-meetlat → Claude-Design-ontwerpronde vóór de bouw (chat-Claude seint). Verse chat.

**R4 KLAAR — cutover-verdict (juli 2026). REVIEW-KETEN R0→R4 COMPLEET.** Verdict-doc `docs/R4-CUTOVER-VERDICT.md` (223 regels), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/d3830b38c5c6bd0f1aded09d2d57178696a72400/docs/R4-CUTOVER-VERDICT.md> Per vondst uit R1+R2+R3: cutover-blokkerend ja/nee, getoetst aan het MODEL (niet GAS-parity op zich). Docs-only, engine/vloeren ongemoeid (vitest 329, engine-selftest 957), CI groen (run 29673175155), training onaangeroerd (3e8090a).
- **DREMPEL (Daan-akkoord):** drie onafhankelijke assen per vondst — HERKOMST (geërfd/geïntroduceerd/ontbrekend) · BLOKKEREND (ja/nee) · URGENTIE (los van de cutover). Blokkerend ⟺ bereikbaar onder Daans single-user-config (doel FTP→onderhoud, A-event AGR actief, prod gevuld) ÉN echte regressie t.o.v. GAS ÉN schaadt training/levering/claim (M5). Geërfd → niet blokkerend (de modelschending zat al in GAS; de cutover maakt 'm fixbaar, niet slechter). Náást de as: LANDMIJN (blokkeert een latere bouw) + MIGRATIE-VOORWAARDE (dataverlies bij cutover).
- **DRAAI-HET verschoof twee dingen (bevroren GAS geverifieerd):** (1) `effectiveMacroFase_` (`Algorithm.gs:71`+`:137`) pint Onderhoud→Base ÓVER de event-fase heen → met AGR actief + doel FTP is Daan event-gedreven (T11/T12/T13 vuren NIET voor hem); op Onderhoud overschrijft de pin de race-piek/taper. (2) De T22-week-demote is OPGELEGD, byte-identiek geërfd (bereikt op echt lage HRV/slaap); GAS voedt het BOTTE signaal, Cadans routeert door `getReadinessScore_` + ochtend-check-in = geïntroduceerd-gevoeliger. BESLUITEN' "auto-demote (GAS bood aan)" sloeg op de APARTE today-overlay (T24).
- **BLOKKEERT DE OVERSTAP (drie):** (a) FASE-C-push (ONTBREKEND, geen levering M56; de oude app pusht door tot de switch) · (b) migratie van de DocProp-weekplan-snapshots (gepland-vs-gedaan-historie, valt buiten "Sheet→D1", gat groeit zolang GAS uit staat) · (c) het pakket **plan-van-record + twee-richtingen-coach** (Daan-eis: verzwakking ÉN inhalen via voorstel-en-bevestig; bouwt op dezelfde plan-van-record als de migratie → één pakket vóór de switch).
- **URGENT, NIET BLOKKEREND (geërfd):** Onderhoud-soft (E: T8/T9/T10/T19 — 36' hard bij elk urenbudget + de pin overschrijft de race-piek; wég vóór de winter, de belangrijkste trainings-fix) · korte-dag-val (T17: 35-51'→geforceerd vo2max) · coach-copy-overreach (T25: "sterker straks" M5 + geen hedge) · pendel-dubbeltelling (C1: 75/rit × 2-ritten moet 2×75=150 worden, heen Z2/terug best, niet 300).
- **LANDMIJNEN (blokkeren de V7-bouw, niet de cutover):** zones/intent-misteling · verleden-reconstructie met de FTP-van-nu (V24) · recency-seed 2e ingreep + reader-param door `assignWorkouts` (V15) — samen bouwen; carry-forward moet 7 rijen leveren (V14); event-veld `hm` vs `hoogtemeters` (V8); fase 6 `EEE`/`d-M` stil (V16).
- **RAAKT DAAN NIET (multi-user-voorwaarde):** verse-user-lek 0-0W (C0/A1/T29) · test-week + klim-route (T11/T12/T13). Reële defecten voor een tweede gebruiker.
- **BOUW-VOLGORDE (Daan-akkoord, §6 verdict-doc).** VÓÓR de cutover = één pakket: plan-van-record (weekplans-schrijver + `gedaan` + `voorgesteldType`) MÉT de drie landmijnen → twee-richtingen-coach op die basis (verzwakking- én inhaal-voorstel, standaard origineel behouden, coach zegt waarom) → migratie-export (DocProp-snapshots + preset-vocab + mesoWeek/loadCarry) → FASE-C-push. Interim: band-aansturing → botte signaal. NÁ de cutover op urgentie: Onderhoud (E, vóór de winter) → T17 → C1 → T25 → product-richting (vijf doelen, duurvermogen-maat, capaciteit-veld, event-tailoring, RPE-als-informant + dispositie-benen-optie). Elke fix = eigen bouw-chat.
- **FOCUS VOLGENDE CHAT: BOUWEN.** De review is dicht (R0→R4); Daan bouwt nu. Eerste bouw = het pre-switch-pakket (plan-van-record). Elke bouw-chat: recon-first waar durable (engine/D1/design), Daan reviewt vóór de bouw; gate = pnpm lint+typecheck+test+build groen (--frozen-lockfile) + CI groen; de vloeren (vitest/engine-selftest, §STAND) mogen niet regresseren — hardcode ze niet in prompts; engine read-only tenzij expliciet geautoriseerd. Verse chat.

**R3-d KLAAR — invoer / grens (juli 2026). R3 GESLOTEN (a+b+c+d).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T28-T30), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/2e4c4a8450619ce908b3a1f628611aea56c4b32b/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd, vloeren ongewijzigd (vitest 329). **3 vondsten: T28-T30** (§4+§5, M21-M32; M21 geen vondst — de app gate't niet op leeftijd/niveau/volume). Reeks append-only (T6 ongebruikt, T7 ingetrokken). Kern: **§5 heeft geen gedeclareerd capaciteit-veld** (M26) — er is niets om onder te zitten of tegen te spreken.
- **T28 geen gedeclareerd capaciteit-veld — de ruggengraat van d** (M25/M26/M29). De `settings`-tabel (`schema.ts:56`) heeft alleen `profielPreset`, precies wat M26 uitsluit (dosering, geen limiet); erger, de engine leest 'm nergens (`settings.ts:108`, display-only label = R2-V1). Het plan gebruikt de weekplan-minuten als capaciteit (`planner.ts:227/232`) → de weekplanner draagt dubbel: intentie-sensor (M28) én de facto capaciteit (M25). Gevolg: M26/M29 hebben geen referent. De énige data→uren-baan (de projectie-schuif, `weeklyHoursRecent_`, `DoelProjectie.tsx:393`, clamp 4..14) BEPAALT de uren i.p.v. TEGENSPREEKT (M29 omgekeerd; M27-plateau-inbak). Herkomst: GEËRFD (GAS heeft ook geen capaciteit-veld; `getVolumeTargets` = fase-band dosering-target).
- **T29 zichtbaarheidsgrens niet bewaakt — lege huls** (M22/M23/M24), GEDRAAID. ftp=null (verse user → `EMPTY_SETTINGS`, `schema.ts:697`) → identiek plan, watt-targets overal 0-0W, TSS onveranderd (68/61/126/48 vs ftp=280) → M24's lege huls, en M23's model valt NIET weg (geplande TSS is %FTP-relatief). Leeskant: sync neemt `icu_training_load` zonder vermogen-vs-HR-onderscheid (`sync.ts:79`). Herkomst: grens-poort ontbreekt GEËRFD (GAS maskeert met ftp-default 280, `Settings.gs:73`); de zichtbare 0W-lek is Cadans (R2-C0).
- **T30 sensoren: RPE-mismatch bedraad-om-te-sturen (uitgehongerd); dispositie gevangen-niet-bedraad + geen benen-optie** (M30/M31 + M15/M18), GEDRAAID. `rpeSignal_` (`readiness.ts:521`) → `combineSignals_` (`:560`) → demote (T22-pad): bedraad om te STUREN, niet "niet aangesloten" zoals M31 stelt. Inert omdat `plannedTypeByDate` uit `voorgesteldType` komt (`proposal.ts:314`), altijd null geschreven (`repo.ts:366`, R2-V7); gevuld → stille demote (M30/M15/M18, als T22). De dispositie-reden (`disposition.ts:8`) is wél niet-bedraad (engine leest 'm nergens) én mist de benen-kant (`geen_tijd`/`bewust_gerust`/`iets_anders` = agenda/keuze/restpost). Herkomst: dispositie-set + demote GEËRFD (`WebApp.gs:1634`); RPE-band-route = Cadans (`ae00730`). M30-toets op T22: informant/proxy als beslisser.
- **T14-toets (event als invoer):** M30's sensor-taxonomie noemt de event/doel-invoer niet, terwijl dat de meest structurele invoer is (T14: het event neemt het plan over) → klein gat in M30; de agency-kant van T14 blijft a/c. Geparkeerd (M9/M39): T28 legt vast waaróm de uren-schuif-vraag bestaat, lost 'm niet op.
- **FOCUS VOLGENDE CHAT: R4** — verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; criterium = het MODEL. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R3-c KLAAR — agency / bewijslast / coach-stem (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T22-T27), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/ec7d38af1493b77140720f2d3bb88e2eddaa4db4/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd, vloeren ongewijzigd (vitest 329). **6 vondsten: T22-T27** (§2+§3+§9, M10-M19+M53-M56). Reeks append-only (T6 ongebruikt, T7 ingetrokken door T10 — niet hernummerd). Kern: **M10 (voorstellen-en-bevestigen) heeft NUL implementatie** — het plan verandert stil.
- **T22 readiness-band herschrijft de week stil — DE ZWAARSTE, GEDRAAID** (M10/M11/M13/M15/M16/M18 + M12). caution → hard-dagen naar `tempo`, rest → hele week `recovery`; geen voorstel/bevestiging, origineel overschreven. De ochtend-check-in (−6) tikt de band een niveau omlaag → stuurt stil je week (M12-omkering). Herkomst: demote GEËRFD byte-identiek (`Algorithm.gs:1155-1167` ↔ `planner.ts:763-771`); band-bedrading via `getReadinessScore_` = Cadans-DIVERGENTIE (`ae00730`), routeert door de exacte score die M18 afwees. Gemeten op de standaard-fixture.
- **T23 inhalen gebouwd maar niet aangesloten** (M10/M13, koppelt R2-V7). `catchup_*` (`planner.ts:659-694`) hangt aan `zoneDebt_`, maar de client schrijft nooit een weekplan (`PUT /weekplan/:monday` bestaat, `repo.ts:151`, geen aanroeper) → debt=0 → vuurt NOOIT. Aangesloten zou hij stil ingrijpen ("Ik heb je schema bijgesteld"). Herkomst: niet-aansluiting = V7-wortel; stil-ontwerp GEËRFD.
- **T24 geen voorstel-oppervlak; "ik heb verlicht"-copy claimt gebeurde daad** (M10/M16/M55). `readinessAdjust_`/`readinessRegel_` geport+geëxporteerd (`coach.ts:595/637`) maar alleen in selftest → inert. GAS' copy (`Coach.gs:330`) claimt de daad vóór commit → M55, niet hergebruiken.
- **T25 dag-coach hedge't nooit — GEDRAAID** (M53/M54/M55/M5). Grep op wellicht/misschien/mogelijk/raadt over `coachNarrative.ts` = LEEG. Demote-copy belooft "sterker straks" (M18-ongedekt = M5). Contrast: de doel-projectie hedge't WÉL (aannames+bereik+vloer) → vondst beperkt tot de dag-coach. Herkomst: warme copy Cadans-DIVERGENTIE.
- **T26 dag-coach kan niet strategisch sturen op tijd-rendement** (M53, koppelt T17/T19/T20). Alleen per-dag-pools; geen "extra uur levert weinig → 2e kwaliteitssessie". Nuance: de projectie toont wél "+2u → N weken eerder". GEËRFD.
- **T27 test-week-copy verkoopt terugkerende test als betekenisvolle meting** (M5/M53) — coach-kant van T12. De `test`-pool (`coachNarrative.ts:135`) affirmeert een doel dat het fase-teller-artefact (elke week ná wk12, 4/5 doelen) niet heeft. Herkomst: copy Cadans-DIVERGENTIE.
- **SEED-CORRECTIE (M56):** a's zaad "combo niet leverbaar (blokken undefined)" WEERLEGD na draaien — de levering leest `workout.structuur` (niet `blokken`); de combo IS getrouw leverbaar (Efforts-rij → 3-intervallen-ZWO met rust). `blokken: undefined` raakt alleen de silhouet (weergave) + coach-segmenten (V21, toch al null). Geen M56-vondst.
- **NAAR DE MODELVRAAG (geparkeerd, ná R3 — M9/M39, GEEN agency):** (1) moet de FTP-projectie een echte daling tonen bij ondertraining? (de vloer = huidige FTP toont nooit achteruitgang). (2) moet de uren-schuif (nu op recent geréden volume, `weeklyHoursRecent_`) aan de plan-instelling-uren gekoppeld? Getraceerd: de projectie (`DoelProjectie.tsx:431` `ftpBandFromProjection_`) verankert al op de wérkelijke CTL (`Niveau.tsx:117`, draagt gereden weken/tekorten) en is al een bereik met hedge → slaagt op c's toets. Validatie via de intervals.icu-tijdlijn, BUITEN de repo (circulariteit-valkuil: bouwen+toetsen op dezelfde data bewijst niks; n=1).
- **FOCUS VOLGENDE CHAT: R3-d** — invoer/grens (§4 + §5 van het model: M21-M32, 12 regels). **R3 a+b+c KLAAR** (T1-T27; T6 ongebruikt, T7 ingetrokken). d sluit R3; daarna R4 = verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; criterium = het MODEL. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R3-a KLAAR — a1 + a2 + a3 (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md`, gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/424bb68b4adedf0db5c54227dc5f46e56a63ae97/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only,
engine ongemoeid, niets gedeployd, vloeren ongewijzigd. **13 vondsten: T1-T5 (a1) + T7-T9 (a2) +
T10-T14 (a3).** T6 bewust niet uitgegeven; **T7 is INGETROKKEN door T10** en blijft letterlijk staan;
de reeks is append-only en wordt niet hernummerd.
- **R3-SCOPE (Daan akkoord, 17-07-2026) — de INVENTARIS IS HET MODEL, niet de matrix.** 61 M-regels,
  mechanisch geteld, geen gaten. Negen vallen af met reden (M1-M4 = over het document zelf;
  M6/M20/M59 = binden de REVIEW; M60/M61 = INGETROKKEN); M57/M58 vallen buiten de trainings-laag.
  **50 binden de app**; M5 (claimregel) is dwarsdoorsnijdend; **49** in vier brokken: **a** (KLAAR)
  doel→fase→prikkel (§6+§8, M33-M42+M49-M52, 14) · **b** (KLAAR) dosering (§1+§7, M7-M9+M43-M48, 9) · **c**
  agency/bewijslast/coach-stem (§2+§3+§9, M10-M19+M53-M56, 14) · **d** invoer/grens (§4+§5, M21-M32,
  12). Volgorde a→b→c→d: a en b delen één proefopstelling, a's uitkomst is b's invoer.
- **R3 SCHRIJFT GEEN MODEL-REGELS.** Legt een vondst een gat in het MODEL bloot, dan ís dat de vondst.
- **DE MATRIX HELPT IN R3 NIET, en dat is bewezen:** `effectiveMacroFase_` is AST-identiek, bereikbaar
  én door beide oracles geraakt — de rustigste cel — en tegelijk de spil van T9/T12.

**⚠ FIXTURE-CORRECTIE (a3) — LEES DIT VÓÓR JE MEET.** `allocateQualityWeek_` dateert zich op de
AMBIENT klok (`packages/engine/src/planner.ts:537`); de rest van de pijplijn op `input.todayISO`
(`apps/web/src/lib/proposal.ts:341`). **In de app vallen die ALTIJD samen** (`apps/web/src/lib/schema.ts:856`
`const todayISO = todayIso()`). De a1/a2-standaard-fixture (ma 2026-07-13, `todayISO` = die maandag)
liep op een klok van 17/18-07 → di+do vielen buiten de allocator en door naar `keyIntensity`. **Elke
nieuwe meting stubt `Date` op de fixture-datum** (bundel-niveau, geen repo-wijziging) — anders meet je
een pad dat de app niet draait. GAS kent de seam niet (`src/Algorithm.gs:93` + `src/Algorithm.gs:1019`
= twee keer ambient) → dit is een fixture-eigenschap, geen app-vondst.

- **T1 de doel-lijst is niet die van het model** (M34/M35/M36/M42). `packages/engine/src/phase.ts:12`
  `DOEL_OPTIONS = FTP/Conditie/Beklimmingen/VO2max/Onderhoud`. VO2max staat er als DOEL (M35: middel);
  Beklimmingen is één doel waar M36 er twee eist. GEËRFD, 1-op-1.
- **T2 vijf doelen, TWEE meetlatten** (M33). `packages/engine/src/niveau.ts:629` `activeGoalProfile_`:
  FTP → ftp, **al het andere → girona**. Bij Onderhoud intern tegenstrijdig: `langeRitPerWeek: 0` +
  meten tegen een lange-rit-doel van 4 u. GEËRFD én ORACLE-BEVROREN (`src/SelfTest.gs:410`).
- **T3 CTL draagt het label "Duurvermogen"** (M39 + M5): girona-dim `key:"duur"`, `metric:"ctl"`,
  `target:65` — precies de claim die M39 OPEN verklaart.
- **T4 "Duurvermogen" kiezen koopt −3 minuten duur** (M38). `packages/engine/src/archetypes.ts:1138`
  `GOAL_KWALITEIT_INTENTS_ = ["drempel","sweetspot","vo2"]` — DRIE kwaliteits-intents, GEEN
  duur-intent. **Duur is geen hendel die een doel kan bedienen.** GEËRFD. (De tabel is gemeten op de
  scheve klok; het mechanisme — er ís geen duur-intent — staat er los van.)
- **T5 het haalbaarheids-oordeel dat M41 verbiedt, staat er letterlijk** (M40/M41 + M8(a) + M27/M29 +
  M5). `apps/web/src/components/niveau/DoelProjectie.tsx:742` "…zo niet haalbaar. Verhoog het volume.",
  op een default die `apps/web/src/pages/Niveau.tsx:157` uit het GEREDEN volume afleidt.
  **HERKOMST (a3): GEËRFD, byte-identiek** — `src/Script.html:1633` (de zin) + `src/WebApp.gs:1268`
  (de afgeleide default). Cadans' bereikbaarheid wás groter (vuurde ook op FTP); hersteld in `7308d660`.
- **T7 — INGETROKKEN DOOR T10.** Luidde "Onderhoud = zacht trainen is ONJUIST, weerlegd door meting"
  (94' vs FTP 66'). Die tabel is op de scheve klok gemeten. **M50's regel én motivering staan.**
- **T8 de 45-minuten-cap begrenst de PRIKKEL, niet de sessie — DE ZWAARSTE VAN a** (M46 + M37/M38 +
  M5). Enige lezer van `maxDuurMin`: `packages/engine/src/planner.ts:411`; `bt` gaat UITSLUITEND naar
  `goalWorkout_` = de archetype-KEUZE, de sessie wordt op `sel.minuten` gebouwd. GEDRAAID: altijd
  "Sweet Spot 2×10 kort" met 20' werk, van 45' tot 240'. GEËRFD, byte-identiek. **T10 promoveert hem:
  T8's cap is het mechanisme achter de vlakke 36'.**
- **T9 de app plant op een andere fase dan hij toont** (M49/M50). `packages/engine/src/planner.ts:87`
  `effectiveMacroFase_` pint Onderhoud op `"Base"`; de docstring noemt de reden zelf ("→ allocActive
  TRUE + een eerste-klas fase, geen missing-key") = M49's loodgietersfix, bewezen uit de eigen
  documentatie. Payload draagt de gepinde fase (`apps/web/src/lib/proposal.ts:210`). **STAAT — en T12
  maakt hem STERKER: het lek dat de pin dicht is echt, en staat voor de andere vier doelen open.**
- **T10 T7 IS WEERLEGD — Onderhoud is op elk urenbudget MINDER intensief dan FTP, en VLAK** (M37/M38/
  M50 + M7). GEDRAAID, gecontroleerd (alles gelijk, alleen de klok verschilt): hoog-intent per week
  **Onderhoud 36' bij 405', 210' én 180'** vs FTP 77'/45'/45'. Zelf-controle: FTP verschuift bij
  210'/180' NIET (45' in beide klokken) → de verschuiving raakt Onderhoud, niet de fixture. Mechanisme
  = het PROFIEL, niet `keyIntensity`: `kwaliteitPerWeek Build:2` (ftp 3) + `langeRitPerWeek:0` +
  `maxDuurMin:45` (T8) → 2 "kort"-sessies, 20' + 16' = 36', bij 180' **exact dezelfde twee sessies**.
  **Onder M7: een extra uur koopt bij Onderhoud nul extra prikkel.** GEËRFD.
- **T11 `keyIntensity` stuurt het plan niet** (M49 + M5). De endurance-fill van de allocator
  (`packages/engine/src/planner.ts:433`) geeft ÉLKE eligible dag een plaats, en de allocator-tak gaat
  vóór (`packages/engine/src/planner.ts:622`). GEDRAAID, mechanisch: **400 weken** (5 doelen × blokweek
  1-20 × 4 week-vormen) → **180 `keyIntensity`-treffers, alle 180 in fase Test**, nul in Base/Build/
  Peak, nul bij Onderhoud. Dus: de profiel-tak (`packages/engine/src/planner.ts:847`) onbereikbaar,
  `climbTypeWorkout_` onbereikbaar (→ T13), en de Taper-/Recovery-guards
  (`packages/engine/src/planner.ts:841` +
  `packages/engine/src/planner.ts:842`) dood. **BESLUITEN' vondst 1 wijst het verkeerde
  mechanisme aan.** VIERDE "comment claimt een premisse die de bron tegenspreekt" (na V1-(b), V23, T9).
- **T12 na blokweek 12 plant de app ELKE WEEK een FTP-test, voorgoed** (M46/M49/M5).
  `packages/engine/src/phase.ts:52` `fase = "Test"` zonder bovengrens → `allocActive` uit → de hele
  week-allocatie valt weg. GEDRAAID: blokweken mét een `test`-sessie = **12 t/m 20 voor FTP, Conditie,
  Beklimmingen én VO2max; Onderhoud nul** (de pin redt hem). Week 13 (FTP): `test · sweet_spot ·
  long_z2 · long_z2`, elke week opnieuw. **`doelDuur` wordt door `computeMacroPhase` NIET gelezen** —
  4/4/3 staat hard in de functie. GEËRFD, byte-identiek (`src/Settings.gs:295` + `src/Settings.gs:308`).
- **T13 lang vs kort klimmen heeft GEEN route naar het plan** (M36/M38/M33/M5). `klimType` wordt
  gevraagd (`apps/web/src/pages/Events.tsx:350`), gevalideerd (`workers/api/src/routes/api.ts:313`),
  opgeslagen (`workers/api/src/db/schema.ts:158`), gethreaded (`apps/web/src/lib/proposal.ts:213`) — en
  gelezen door precies één functie die niet draait (`packages/engine/src/planner.ts:862`, binnen T11's
  dode tak, dáár nóg fallback ná `goalWorkout_`). GEDRAAID: vlak/lang/kort/gemengd → **vier
  byte-identieke weken** op de volledige vingerafdruk (type + naam + blokken + TSS). Zelf-controle:
  hetzelfde event 3 wkn vooruit (→ Peak) wijzigt de week wél. **Welk van M36's twee doelen je krijgt,
  bepaalt de blokweek:** Base 66'/0' top · Build 51'/14' · Peak 30'/14'. GEËRFD.
- **T14 het event neemt het plan over — meteen, op elke afstand, zonder voorstel** (M51/M52/M10/M5).
  `apps/web/src/lib/proposal.ts:210`: zodra `eventFase_` een hoofdevent vindt, VERVANGT de aftelling de
  doel-gedreven cyclus; hoofdevent = eerstvolgende A **of elke trip**, zonder afstandsgrens
  (`packages/engine/src/phase.ts:72`). GEDRAAID (doel-cyclus zegt Build): **A-race over 52 weken → Base
  → 77' naar 45' hoog-intent, −42%, op het moment van opslaan.** Dag-precies: 57 d → Base, 56 d →
  Build. B/C-event: geen overname (byte-identiek); **C-TRIP: wél** → prioriteit beschermt niet.
  **CORRIGEERT de overdracht van V8:** "er is geen overname" is te sterk — de overname bestaat, ze
  loopt via de macro-fase; V8's punt is dat de WORKOUT niet getailord wordt. Samen: het event kost
  agency en levert geen tailoring. GEËRFD (`src/Doel.gs:201`).
- **b ERFT VAN a:** de vlakke 36' (T10) raakt M9 (schaal-eis) + M47 (totale belasting = primaire
  hendel). **Geparkeerd naar c:** `combo_long_with_efforts` levert `structuur` maar `blokken:
  undefined` → M56 + R2's V21; T13 maakt hem zwaarder (enige plek waar M38's "vermoeidheid die eraan
  voorafgaat" wordt bediend).
- **WERKWIJZE (R3 = 8e bevestiging):** chat leest zelf (read-only kloon + grep), NUL CC-prompts voor het
  lezen; CC doet alleen de close-out-commit. **DRAAI HET** — a3's drie zwaarste uitkomsten (T10, T11,
  T13) zijn alle drie WEERLEGGINGEN van wat lezen (en in T10's geval: van wat een eerdere METING)
  suggereerde. **DE KLOK IS EEN FIXTURE-VARIABELE** — zie de fixture-correctie hierboven; stub `Date`.
  **REKEN JE EIGEN WERK NA:** **1 van 48** locatie-ankers wees naar de verkeerde regel
  (`src/Script.html` 1673→1674), **8** waren shorthand `:NNN` zonder pad (onoplosbaar → de
  dekkings-toets ving ze) en **1** was kaal (geen inhouds-verwachting) — alle mechanisch gevangen vóór
  publicatie; ambiguïteits- en kale-anker-toets schoon.

**R3-b KLAAR — dosering (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T15-T21),
gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/00b376f2d991b62147bbc6670add47647a2f3579/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN
verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd,
vloeren ongewijzigd. **7 vondsten: T15-T21** (§1+§7, M7-M9+M43-M48). Reeks blijft append-only (T6
ongebruikt, T7 ingetrokken door T10 — niet hernummerd). **`a`'s uitkomst is `b`'s invoer**; de
proefopstelling stubt `Date` op de fixture-datum (a3-correctie).
- **T15 piramidaal ja, het harde topje ontbreekt** (M43). vo2/anaeroob-top structureel afwezig voor
  FTP/Conditie op elk urenbudget (ANA=0 bij 3-15 u); vo2-gewicht 0.20 altijd #3, `goalPickIntent_` wisselt
  de top-2 → vo2 nooit bereikt. GEERFD.
- **T16 de ruggengraat bij weinig uren is niet sweet-spot** (M44) maar wat het doelprofiel zwaarst weegt
  (FTP→drempel, Conditie→sweetspot), VAST over alle volumes; geen weinig-uren→sweetspot-mechanisme. GEERFD.
- **T17 de korte-sessie-val — DE ZWAARSTE VAN b** (M46+M44+M47). 35-51' beschikbaar → ALLE doelen
  geforceerd naar vo2max (enig passend archetype), doel-onafhankelijk, op de archetype-minimum-naad. M46's
  exacte anti-patroon. GEERFD + oracle-bevroren.
- **T18 M45's polarisatie-knik bestaat als constante maar polariseert niet** (M45 — HEURISTIEK).
  `BASE_POLAR_VOL_U0=9` is Base-only + gecapt onder de dominante intent ("blijft #2", GAS-ontwerp) → inert
  voor FTP/Conditie; nooit getoond (geen M5-claim) maar ook nooit als heuristiek gepresenteerd (opake
  rationale → c). GEERFD.
- **T19 Onderhoud schaalt niet, koopt geen prikkel per extra uur** (M9+M47+M7) — verlengt T10. Hoog-intent
  36' bij ELK budget 3-15 u, ANA altijd 0; TSS 134→534 (alleen LOW groeit). GEERFD.
- **T20 bij de capaciteitsdoelen schaalt LOAD wél met de uren, intensiteit blijft vast** (M47+M9). LOW+TSS
  groeien, harde quota vast → weinig uren NIET met intensiteit beantwoord (week-niveau M47-conform), werkt
  3-15 u (M9-conform); de "knik" is fase-gedreven, niet volume-gedreven. GEERFD.
- **T21 de dosering weegt de voorgaande weken niet mee — M48 gebeurt vrijwel niet** (M48). (a) `loadCarry`
  gedropt = **Cadans-DIVERGENTIE** (GAS `src/Algorithm.gs:47`, R1-A2 mat ×1). (b) meso-ramp one-shot
  (`MESO_MOD` 4 keys, wk5+ vlak, schaalt power-%, ~+1 TSS). (c) activities = reactieve 7-daagse
  zone-dekking + hard-dag-spacing, deze-week-only; zware vs lichte voorafgaande 7 dagen laat de dosis
  ONGEWIJZIGD (hard 77, TSS ~293), herschikt alleen de intent-volgorde. Dosis = vaste functie van de
  fase-kalender uit `doelStart`, "in het luchtledige".
- **HERKOMST:** alles GEERFD behalve T21's `loadCarry`-drop (bewuste Cadans-DIVERGENTIE, model-neutraal).
  Geen M5-claim-schending in `b`; M8 niet geschonden; M7 geraakt door T19/T20; opake rationale +
  inelasticiteit → `c` (M10/M53-56). Drie meet-zelfcontroles schoon; 49-assertie anker-zelftoets schoon
  vóór publicatie.

**R2 KLAAR — a + b + c (juli 2026).** Findings-doc `docs/R2-ENGINE-END-AUDIT.md` (1707 regels), gepind:
https://raw.githubusercontent.com/daanhhk/Cadans/ecd953003d3f09e5114a79fd9db59f5be5dbd208/docs/R2-ENGINE-END-AUDIT.md **Findings,
GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL, niet GAS). Docs-only, engine ongemoeid,
niets gedeployd, vloeren ongewijzigd.
- **R2-SCOPE (Daan akkoord 17-07-2026) — drie brokken, in volgorde.** R1 bewees: body-gelijkheid is
  nodig, niet genoeg; geen van de 21 vondsten zat in een body. De matrix sorteert exact op body-diff.
  **R2 keert de as om** en sorteert op bereikbaarheid + invulling; de matrix levert de inventaris.
  **a** = wat GAS doet en Cadans niet (alleen-in-GAS ∩ web-server-bereik = **109 units**, na filter
  op SelfTest/TelegramBot/Secrets/Script.html). **b** (KLAAR) = de 14 verschil-fns die R1 liet liggen
  (matrix-groep 3+4, incl. `buildWorkout`). **c** (KLAAR) = de 115 alleen-in-Cadans, gefilterd op "neemt een
  beslissing". Buiten R2: het MODEL-risico (matrix-gat 1) → R3; de 140 body-gelijke fns integraal.
- **Van de 109: 14 hebben een geporte aanroeper** (de gap-regel — grotendeels al door R1 geraakt),
  **95 hebben alléén niet-geporte aanroepers** = hele lagen. Die 95 komt de matrix per constructie
  niet tegen (gat 6) — daar zit R2-a's bestaansrecht.
- **PATROON BEVESTIGD:** bijna elke R1-vondst wortelt in die 95. R1 vond het symptoom (geporte fn
  inert of op nul); de oorzaak is steeds dat de VOEDENDE fn niet meekwam. `mesoFactor` ×1 ←
  `loadCarryFactor_`; `rpeSignal_` vuurt nooit ← `rpeWeekData_`; dode intent-tak ←
  `intentZonesForDate_`; geen event-tailoring ← `eventContextFrom_`.
- **G1 — GEREEDSCHAP: de app-bereik-kolom is asymmetrisch; "buiten bereik" is aan de Cadans-kant NIET
  sterk.** De GAS-kant kreeg een top-level-statement-start; de Cadans-kant start alleen bij refs in
  `main.tsx`/`App.tsx`/`index.ts`. Hono-routes zijn top-level statements, geen units → **de hele
  Worker-route-boom hangt los van de sluiting**. Bewijs: `pcNormalize_` staat als "app-bereik nee"
  maar draait server-side (`workers/api/src/integrations/powercurve.ts:157`); ≥5 van de 46 zijn zo.
  Gebruik de kolom als hint, nooit als bewijs. R1's leesvolgorde is niet aangetast (label, geen bewijs).
- **V1 `getVolumeTargets` (Algorithm.gs:31) niet geport — front-end, dus GAS is norm → drift.**
  Uren-band per profiel × fase (`'Gevorderd 7u'`: Base [4,7] Build [6,9] Peak [6,9] Taper [3,5]
  Recovery [2,4]). (a) De Volume-stat op de plan-kaart is in Cadans een **constant getal uit de
  preset-NAAM** (`presetHoursLabel`, `apps/web/src/lib/settings.ts:127` → `apps/web/src/lib/schema.ts:829` → `PeriodTimeline.tsx:173`);
  GAS toont de fase-band (`Doel.gs:331/342` → `Script.html:804-805`). In Taper/Recovery ligt "7"
  buiten de band. (b) **Brok 4b §2's motivering "GAS bouwt GÉÉN range" is aantoonbaar onwaar**; de
  VORMGEVING-SPEC §2-correctie `4-7u`→`7u` ging de verkeerde kant op — `4-7` wás de Base-band. Klassieke
  meetlat-val (`PROFIEL_PRESET_OPTIONS` i.p.v. `getVolumeTargets`). (c) De adherence-regel
  **`voortgangPct` bestaat in Cadans niet**: GAS `WebApp.gs:1302/1316/1325` → `Script.html:1177`
  `'% van plan'` / `:1178` `'blok net gestart'`, onder het W/kg-niveau. (`WeekLoad.tsx:180` toont óók
  "% van plan" maar dat is `w.progressPct`, een andere metriek.)
- **V2 `getMesoWeek` (Utils.gs:48) niet geport — de meso-ramp draait op een ANDERE teller.** GAS:
  DocProp, clamp 1..4 (`:50`), cyclisch via `advanceMeso` (`:59-64`), **uitsluitend handmatig** via
  het menu (`Code.gs:56`); `generateProposal` leest 'm op `Algorithm.gs:87`. Cadans: `proposal.ts:233`
  `weekIndexFromStart_` = weken sinds `doelStart`, ONGECLAMPT (`packages/engine/src/planner.ts:917`) — in GAS is dat de
  **variant-rotatie**-index (`Algorithm.gs:2524` / `packages/engine/src/planner.ts:1492`), die rol heeft hij óók nog: één
  teller, twee banen (variant N zit nu vast aan factor N). GEDRAAID: blokweek 1→1,00 · 2→1,00 ·
  3→1,08 · 4→1,15 · 5→0,60 · **6+→1,00 permanent** (`utils.ts:49` `MESO_MOD[week] || 1.0`, geen
  clamp). Dus **off-by-one** (0- vs 1-gebaseerd) én **na blokweek 5 modulatie voorgoed uit**.
  KARAKTER-DRIFT (GEËRFD, GAS-identiek → R3): `packages/engine/src/planner.ts:986/988` `adj = p*f + off` schaalt
  vermogens-PERCENTAGES, niet duur/TSS — bij 1,08 wordt een sweet-spot `103%/95% FTP` (threshold), bij
  0,60 `57%/53%` (Z2), met onveranderde naam én niet-meegeschaalde bpm-range. **R1-A2 dekte de tweede
  factor (`× loadCarry`); deze eerste-factor-invulling is NIEUW** — R1-A2 noteerde het als R2-werk.
  REGRESSIE? Daan bevestigde (17-07) dat hij het menu-item niet bewust bijhield (verwarde het met
  `'📋 Rol Weekplanner +1 naar huidig'`, `Code.gs:61`) → DocProp stond op default `1` → de GAS-ramp
  was in de praktijk óók vlak → geen cutover-blokker; "wat hóórt de meso-week te zijn" is R3.
  **MIGRATIE: DocProp `mesoWeek` bewust mee of bewust niet — toevoegen aan de migratie-scope.**
- **V3 het weekplanner-VANGNET niet geport — lege week = NUL dagen.** GAS: `generateProposal` roept
  ALTIJD `ensureCurrentWeek` (`Algorithm.gs:79`) → (1) `_pullPlus1IntoCurrent_`, anders (2)
  `materializeWeek_` uit `getPattern()` (DocProp `pattern` via menu `Code.gs:60`, fallback
  `PLANNER_DEFAULTS` `Planner.gs:31-33`: di 150 pendel / do 90 vrij / za 120 weekend). **De huidige
  week kán in GAS niet leeg zijn.** Cadans: geen pattern/defaults/materialize; `buildWeekForm`
  (`apps/web/src/lib/planner.ts:93/102`) geeft ontbrekende dagen als `train:false`. GEDRAAID: `buildWeekProposal` met
  `plannerDays: []` → `days.length === 0` (niet 7 lege dagen — NUL) → Schema-tab rendert niets.
  `docs/SCHEMA-EMPTY-RECON.md` zag dit symptoom al maar noemde het een DATA-toestand; de oorzaak is
  het ontbrekende vangnet. De ROL zelf is architecturaal correct vervangen (D1 sleutelt op datum;
  "+1"-invoer staat er vanzelf) — daar is GEEN gat.
  **BESLUIT DAAN (17-07-2026) — BEWUSTE FORK, GAS NIET HERSTELLEN.** `PLANNER_DEFAULTS` bestond alleen
  omdat een Sheet-tab gevuld moest worden = platform-artefact, geen trainings-intentie. Gewenst:
  **CARRY-FORWARD** — de laatst door Daan aangepaste week is de basis voor de volgende; past hij niets
  aan dan rolt die door, past hij wel aan dan wordt die de nieuwe basis. Open voor bouw/R4: wint een
  expliciete "volgende week"-invoer van de carry-forward (GAS-analoog: ja)? welke velden rollen mee
  (GAS: train/minuten/dagtype/toelichting; `voorgesteld`+`gedaan` leeg)? bron = laatst-aangeraakte
  week of vorige kalenderweek? carry-forward bij lezen of bij schrijven?
- **R2-a2 KLAAR — V4/V5/V6/V7, alle vier gedraaid of mechanisch bewezen (122 inhouds-asserties
  groen; 18 eigen ankers waren fout en zijn vóór publicatie gecorrigeerd).**
  **V4 `reconcilePlannerWithActivities` (`Sync.gs:567`) niet geport = de VULLER onder `gedaan`.**
  GAS tikt het vinkje aan bij elke `syncAll` (`Sync.gs:31`) én bij elke `generateProposal`
  (`ensureDataAndReconcile_`, `Algorithm.gs:83`) -> bij het LEZEN is het veld per constructie vers.
  Match-regel = BELEID, 4 delen (`Sync.gs:582-603`): dagvenster · type bevat 'ride'/'run' · duur >=
  50% van de geplande minuten · eerste match wint PER ACTIVITEIT (nooit gesommeerd). Cadans heeft
  geen reconcile en geen handmatig pad (`workers/api/src/routes/api.ts:657`); zijn de-facto regel is
  `apps/web/src/lib/schema.ts:744` `isDone = doneTss > 0` (geen type-/duur-filter, dag GESOMMEERD).
  GEDRAAID: vandaag 65' gereden op een 60'-plan -> Cadans plant er 62'/52 TSS bovenop (week 257'/189
  TSS); met de tik verdwijnt vandaag en schuift de kwaliteitssessie naar donderdag (210'/157 TSS).
  SCOPE: `gedaan` is in GAS een WEEK-KLADJE (rollover wist kolom H, `Planner.gs:319`) -> een 1-op-1
  port maakt er stilzwijgend een historie van die GAS nooit had. Zelfde vorm als V3.
  **V5 `syncAthleteZones` (`Sync.gs:57`) niet geport — 1 echte gap, 4 schijn-gaps.** `syncAll` heeft
  4 armen, Cadans 2 (activities + wellness): athlete-arm én reconcile-arm ontbreken. `resolveZones_`/
  `resolvePowerZones_`/`resolveHrZones_`/`normalizeZones_`/`sweetSpotFromActivity_` voeden UITSLUITEND
  `buildZones` (`Zones.gs:122-123`/`:167-168`) = de Zones-TAB (display, `REBUILD-SCOPE.md:70` "sterft").
  De engine leest de grenzen niet (`actualZoneMinutes_`'s param is dood, `Algorithm.gs:526` geeft
  `null`; port heet `_zoneBoundaries`) -> 5 units afgesloten met BEWIJS. ECHTE gap: FTP/LTHR/hr_max/
  hr_rest komen in Cadans alleen uit de handmatige `PUT /api/settings` — GAS overschrijft ze elke sync
  ONVOORWAARDELIJK (`Sync.gs:62-65`). NB GAS spreekt zichzelf tegen: `syncAthleteZones` negeert het
  auto-update-vinkje, `syncAthleteFromIcu` (`Sync.gs:672`) gate't er wél op.
  **V6 acht D1-kolommen die NUL regels code lezen/schrijven** (prod, migratie `0000`):
  `settings.threshold_pace`/`ftp_auto_update`/`weight_auto_update`/`email_digest` + de HELE tabel
  `sync_state` (`last_sync`/`meso_week`/`load_carry`/`ftp_last_sync`/`weight_last_sync`);
  `syncState` komt buiten `workers/api/src/db/schema.ts` in geen enkel bestand voor. `REBUILD-SCOPE.md`
  specificeerde ze (`:95-97`, `:102`). SLUIT V2's migratie-punt (kolom `meso_week` staat er al) én
  R1-A2's `loadCarry` (kolom staat er al). MECHANISME: `writeSettings`/`writePlannerDays` zijn
  full-replace-upserts waarin het `vals`-object de de-facto kolom-whitelist IS -> in `vals` met een
  constante = actief gewist (B0-i/ii); buiten `vals` = passief gewist. Beide vragen de SCHRIJVER.
  **V7 de snapshot-laag = de WORTEL onder B0-i/ii/iii, A2, B2 en B8 tegelijk.** GAS' voorstel is een
  SCHRIJF (3 mirrors: kolom G `Algorithm.gs:148` · `proposal_<dISO>` `:213` · `weekplan_<maandag>`
  `:257`), Cadans' een LEES. `cleanupOldProposals_` (`:723`) wist ALLE `proposal_*` (naam liegt) en de
  rollover wist kolom G -> `weekplan_<maandag>` is het ENIGE durabele plan-van-record. Cadans schrijft
  alle drie niet. `plannedTypeForDate_` (`Algorithm.gs:1931`) voedt TWEE ketens: `rpeWeekData_`->
  `rpeSignal_` (=R1-B2) én `rpeLastWeekMismatch_`->`loadCarryFactor_`->DocProp `loadCarry`
  (`Algorithm.gs:89`)->`mesoFactor` (=R1-A2). Eén wortel, twee vondsten. `rpeLastWeekMismatch_` vraagt
  VORIGE week op -> alleen de week-snapshot kan dat nog leveren = bewijs dat hij DRAGEND is, niet
  historie. Scherpste consequentie (nieuw): regeneratie is niet reproduceerbaar — een verleden week
  wordt herbouwd met de FTP van NU. Open voor R4/bouw: waar leeft het plan-van-record (`weekplans`
  week-vorm of `planner_days.voorgesteld_type` dag-vorm)? wie schrijft het, en wanneer, nu er geen
  "Genereer voorstel"-knop is? is `gedaan` een afgeleide bij lezen of een kolom bij schrijven (= V3's
  vierde open punt)?
- **R2-a3 KLAAR — V8/V9/V10/V11/V12/V13 + de sluiting van R2-a** (117 inhouds-asserties groen,
  100% dekking; 10 eigen ankers waren fout en zijn vóór publicatie gecorrigeerd). **V8**
  `eventContextFrom_` niet geport -> een week MET A-event is byte-identiek aan een week zonder
  events; GAS' `long_z2 && eventCtx`-tak slaat het variant-pool over, dus met een hoofdevent
  gebruikt GAS dat pool NOOIT. Gedraaid: 2 van 5 dagen wijken af (week 472'/358 TSS vs 490'/382).
  Landmijn voor de bouw: GAS' veld heet `hm`, Cadans' `hoogtemeters` -> naïeve adapter = event-naam
  wél, klim-simulatie NIET. **V9** de coach-ctx is `{fase}` i.p.v. `{fase,event,patternCount}`;
  gedraaid over 24 combinaties: race 6/24 afwijkend (alleen de NAAM: "je doel"), trip 15/24;
  `coachPatternCount_` wordt uitsluitend achter `isEndurance` gelezen -> bij een race 0/24.
  **V10** `getWeekLoad_` niet geport -> de noemer krimpt: ma 0% · wo 23% · vr 124% · zo **602% van
  plan** (GAS bevriest de snapshot + klemt op 0..100). `snapshotDayAction_` = GAS' eigen reparatie
  hiervoor, IS geport + getest maar heeft NUL aanroepers = nieuwe klasse naast R1's "inerte fn".
  **V11** `dashDayCard_` blankt de plan-rationale zodra er een rit is; Cadans niet -> done-VANDAAG
  toont TWEE coach-blokken (gedraaid). Verstreken gemiste dag = "Rustdag" i.p.v. GAS' 'gepland'.
  **V12** de "Waarom deze training?"-uitklapper (6 regels) ontbreekt = de enige GAS-plek waar
  meso-factor (V2) en zone-debt (R1-B4) zichtbaar waren. **V13** `buildGoalProfile_`-mirror is
  getrouw (debt kan dicht), maar de CTL-input verschilt op drie assen tegelijk: bron
  (wellness vs activiteiten-TSS), korrel (dag vs maand) en afronding.
- **R2-b KLAAR — de 14 verschil-fns (matrix-groep 3+4).** Alle veertien verklaard; **7 vondsten
  (V14-V20) + 1 bouw-landmijn**. Zes van de tien groep-3-fns hadden een body-diff die **mechanisch**
  tot exact één benoemde transformatie is teruggebracht (canon identiek na toepassing): vier ×
  Sheet-IO-seam, plus `zoneTimesFromCell_` (`catch (e)`→`catch`) en `dslBlockFromRow_` (lokale var
  `range`→`rng`) — die twee zijn een **gereedschaps-feit**, niet de port: regel-kandidaten 7+8 voor de
  sorteermachine. **`buildWorkout` — R0's tweede "zwaarste onbekende" — is in zijn body NIETS**:
  het enige verschil is `src/Algorithm.gs:2512` `var ftp = settings.ftp, lthr = settings.lthr;`, in GAS
  nergens gelezen. Zes van zijn acht args zijn identiek gevuld; de twee die afwijken zijn V8 + V2.
  **R1's kernles houdt: geen van de 7 vondsten zit in een body.**
- **V14 `slot` = array-positie i.p.v. weekdag — LATENT, vuurt op V3's carry-forward.** GAS
  `readPlanner` (`src/Planner.gs:396`) leest ALTIJD 7 rijen (`src/Planner.gs:401`) → `dagIdx` ís ma..zo. Cadans
  `apps/web/src/lib/proposal.ts:239-240` mapt de array uit D1; `readPlannerDays`
  (`workers/api/src/db/repo.ts:313`) garandeert geen 7 en `PUT /api/planner/:monday`
  (`workers/api/src/routes/api.ts:658`) checkt alleen `Array.isArray`. `slot` voedt `selectVariant_`
  (`packages/engine/src/planner.ts:1492`). GEDRAAID, 5 train-rijen i.p.v. 7: **4 van de 5 dagen een
  andere variant** (472'/358 TSS → 456'/343); zelfde types (gaps rekenen op `datum`). Zelf-controle:
  aangevuld tot 7 met `train:false` → exact de 7-rijen-uitkomst. Vandaag onbereikbaar (B1-editor
  stuurt altijd 7 via `buildWeekForm`). **BOUW-REGEL: de carry-forward moet 7 rijen leveren, niet
  alleen de train-dagen.** Neven: `mesoWeek === 4` is V2's DERDE baan (`packages/engine/src/planner.ts:494`
  `isMesoRecovery` = de recovery-vlag van de hele allocator) → V2's off-by-one verschuift de
  recovery-week naar blokweek 5 en zet 'm daarna voorgoed uit.
- **V15 `gatherWeekplanEntries_` — twee banen, en de GAS-baan is DOOD.** In GAS één baan
  (`src/Algorithm.gs:1015`, de cross-week archetype-recency-seed). In Cadans twee, tegengesteld gevuld:
  `packages/engine/src/planner.ts:531` = dezelfde baan maar met reader **hardcoded `null`** (de
  comment geeft het toe) → GEDRAAID `[]`, altijd; `workers/api/src/db/repo.ts:222` = een baan die GAS
  niet heeft (mét echte D1-reader, via `GET /api/weekplans/recent` → `intentByDate`; GAS vult die
  lookup met `intentZonesForDate_`, niet geport). **V7's bouw dicht dus niet alles wat hij belooft:**
  baan 2 komt vanzelf tot leven, baan 1 niet — `assignWorkouts`' 12 params bevatten geen reader →
  **engine-signatuur-wijziging**. Kosten gemeten: 1 dag/week herhaalt het archetype over de weekgrens
  (`threshold_overunder` i.p.v. `_long`). Binnen één week roteert het wél (`packages/engine/src/planner.ts:741`). Neven:
  `workers/api/src/db/repo.ts:218`'s `JSON.parse` mist GAS' `try/catch` → één corrupte rij laat de hele read falen.
- **V16 `formatDate` — de shim faalt STIL op 2 van de 8 patronen.** `packages/engine/src/utils.ts:28`
  is een herimplementatie (6 tokens) waar GAS aan `Utilities.formatDate` delegeert. GEDRAAID:
  `EEE dd-MM` → `"EEE 17-07"` en `d/M` → `"d/M"`, letterlijk, zonder fout. **Geen gat vandaag, met
  bewijs:** beide leven uitsluitend in `Proposal.gs` (display, sterft) + TelegramBot/`rpeStatusLines_`
  (fase 6). Cadans' eigen 3 patronen zijn gedekt. **Landmijn voor fase 6** — V8's `hm`-vorm.
- **V17 vier geporte fns met NUL productie-aanroepers** (V10's klasse ×4, maar drie redenen):
  `dashStatsFromActivities_` (consument = `voortgangPct`, bestaat niet → hangt onder V1-(c)) en
  `dslBlockFromRow_` (bouwsteen van de niet-geporte push-assembler → FASE C) zijn **verklaard, geen
  gat**; `dashActualsByDate_` is vervangen door `buildDoneEntry`/`mergeDone`
  (`apps/web/src/lib/schema.ts:301/324`) met andere regels (dag gesommeerd waar GAS de nieuwste rit
  pakt, `src/WebApp.gs:126`) = V4's de-facto regel, derde consument; `dashBeginAnker_` → V18.
  **"Nul aanroepers" is dus een vraag, geen verdict.**
- **V18 `wkgSince` — de app claimt progressie waar GAS zwijgt. VORMGEVING → GAS is norm → DRIFT.**
  Het getal is getrouw (`src/Script.html:1341` `dWkg` = `apps/web/src/lib/niveau.ts:94`). Het **label**
  niet: GAS neemt de maand van de oudste Activiteiten-rij (`dashBeginAnker_` → `src/WebApp.gs:1290`),
  Cadans het eerste serie-punt mét W/kg. GEDRAAID: oudste rit mét ftp+gewicht → **identiek**
  (zelf-controle); oudste rit **zonder** ftp → GAS `beginLabel = null` → **de hele regel wordt
  onderdrukt** (`src/Script.html:1342`), Cadans toont "+0,20 W/kg ↑ sinds jan '26" terwijl de data in
  okt '25 begint = **twee onware claims**. Bereikbaar na de 365d-backfill (geen `icu_ftp` op oude ritten).
- **V19 `getReadinessScore_` — vier inputs, alle vier verklaard, GEEN gat.** `fs` = port van GAS'
  Sheet-pad; `wellness` = ongecombineerd, maar **GEDRAAID byte-identiek** voor alle 4 rpe-signalen
  (`combineSignals_` raakt enkel `.signal`/`.reason`, die de fn niet leest); `reeks` = R1-C3 (93=93);
  `checkin` = seam gevuld (`apps/web/src/lib/schema.ts:878`).
- **V20 groep 4 was GEEN architectuurgrens** maar drie ongelijksoortige gevallen. **`getEvents` heeft
  in de héle GAS-bron NUL aanroepers = dode code** — de naam-match is toeval; de werkende fn is
  `getAllEvents_` (`src/Events.gs:171`, ongefilterd) en dát is Cadans' tegenhanger. Sterker: GAS'
  dode filter (`e.datum >= today`) zou `eventFase_`'s Recovery-tak **breken** → Cadans' keuze is nódig.
  `getPowerCurve` = RPC-entrypoint, geport als route. `getActivities` = de Worker is getrouw (venster
  28 ✓, sort expliciet gespiegeld). Eén echte drift: **`getWellness` 30 → 60**
  (`workers/api/src/integrations/wellness.ts:97`) — méér historie, dus geen verlies, maar stilzwijgend.
- **BOUW-LANDMIJN `zones` vs `intent` — vuurt op V7's bouw.** GAS' snapshot draagt BEIDE velden
  (`src/Algorithm.gs:243` + `src/Algorithm.gs:244`) en heeft twee lezers die elk een ander veld pakken: `computeZoneDebt_`
  leest `intent` (minuten, correct), `rollingZoneCoverage` leest `.zones` (string-array, via
  `intentZonesForDate_`). Cadans levert beide lezers hetzélfde object (`apps/web/src/lib/proposal.ts:136`
  `const it = e.intent`) en heeft `rollingZoneCoverage_` dáárop herschreven
  (`packages/engine/src/weekprep.ts:76` `if (iz.low > 0) cov.low++`). Omdat `ensureIntent_` de duur
  óók over `low` verdeelt terwijl `zones` alleen de WERK-zone noemt, telt élke kwaliteitsrit in Cadans
  óók als low-dekking. GEDRAAID, week met uitsluitend kwaliteitsdagen: GAS `dekking.low = false`,
  Cadans `true` → de allocator denkt dat de duur-basis gedekt is zonder één Z2-rit. Zelf-controle:
  lege `intentByDate` → beide op de IF-fallback, identiek = **de stand van vandaag** (R1-B3), dus
  onbereikbaar tot V7. Voetnoot V6: `planner_days.dag` is een **negende** dode kolom
  (`workers/api/src/db/repo.ts:362` `dag: null`, nergens gelezen).
- **DRIE LANDMIJNEN liggen nu naast V8's `hm`** — V14 (carry-forward moet 7 rijen leveren), V16
  (`EEE`/`d/M` falen stil in fase 6), `zones`-vs-`intent` (V7 activeert een verkeerde dekking-telling).
  Alle drie dezelfde vorm: **het werkt half en zwijgt erover.** **Geen nieuwe open bouw-vraag** — V14
  valt binnen V3's vierde punt, V15 + `zones`/`intent` binnen V7's plaats-en-schrijver-vraag. Maar b
  maakt er twee **duurder**: wie V7 bouwt moet óók de reader-seam in `assignWorkouts` en het
  `zones`/`intent`-onderscheid meenemen, anders bouwt hij de laag en blijft de helft dood.
- **WERKWIJZE BEVESTIGD (R2 = 5e keer):** chat leest zelf (read-only kloon + grep), NUL CC-prompts
  voor het lezen. **DRAAI HET** — de bundel-route (esbuild, buiten de repo-tree, `TZ=Europe/Amsterdam`)
  corrigeerde in deze batch twee vermoedens: mesoFactor bleek vermogen te schalen i.p.v. duur, en de
  off-by-one was met lezen alleen niet te zien. **REKEN JE EIGEN WERK NA:** a1 4/14 · a2 18/122 · a3 10/118 · b 4/116 locatie-ankers wezen naar de
  verkeerde regel — elke keer mechanisch gevangen vóór publicatie. Idem de CC-rapporten: git fetch +
  byte-diff + de asserties opnieuw tegen de GECOMMITTE bytes — twaalf keer schoon.
- **R2-c KLAAR — de 115 alleen-in-Cadans (G2 + V21-V24).** 4 vondsten. **108 van de 115 liggen in
  `apps/web/src/lib`, 7 in de engine — en die zeven zijn zonder uitzondering seam, shim of geneste
  helper: Cadans verzint NIETS in de engine.** Hij verzint in de laag die GAS in `WebApp.gs` +
  `Script.html` had — precies waar "GAS is norm" geldt. Ruim tachtig vallen af met bewijs: 20 ×
  HTTP-transport (`apps/web/src/lib/api.ts`, nul condities op trainingsdata; de enige conditie is
  `apps/web/src/lib/api.ts:157`'s 404→null = protocol), 5 × Intl-formatter, 9 × geheugenvlag (`plannerSignal` = de
  entrypoint-map's `regenerateWeb`-vervanger; `syncStatus` = a3's begrip-verschil), de units die
  a/b al raakten, en de **hernoemde ports** — `pickerState.ts` (8, GAS `openPicker`/`pk*`,
  `src/Script.html:2065-2160`), `findCategory`/`findVariant`/`libraryOverride` (`trnCat_`/`trnVar_`/
  `pkPickLibrary`), `deriveDagtype` (`src/Script.html:1035`), `silhouetSegments` (`zoneBar`,
  `src/Script.html:236`, `W/H/MINW/GAP` 1-op-1). De matrix ZIET die GAS-kant (de bewaker telt `pkGo`/
  `trnOpenCat` e.a. als string-handler-edges) maar koppelt niet: geen alias ⇒ "alleen-in-Cadans".
- **G2 — GEREEDSCHAP: de 115 is de inventaris van TWEE MAPPEN, niet van Cadans.** `cadansSources()`
  (`tools/audit/run.mjs:115`) scant exact `packages/engine/src` + `apps/web/src/lib`, alleen `.ts`.
  Gemeten: **290 units in het corpus, 177 erbuiten** — `apps/web/src/components` 85 ·
  `workers/api/src` 53 · `apps/web/src/pages` 30 · overig 9 · `packages/shared/src` 0. De hele
  Worker-laag en de hele component-laag vallen er per constructie buiten, inclusief plekken waar R1
  al beslissingen vond (`workers/api/src/db/repo.ts:366-367`). c's tegenhanger van a's gat 6 en G1:
  inventaris, geen sluiting. Verbreden kan, maar verschuift ALLE matrix-cijfers → eigen beslissing.
- **V21 `coachPlannedArg_` — de FIX-4-seam staat op `null`, en de vuller ligt geport in de engine.
  DE ZWAARSTE VAN c.** `coachFeedback_` bepaalt de geplande prikkel in twee trappen
  (`packages/engine/src/coach.ts:456`): `coachZmFromSegs_(planned.segmenten)` →
  `coachIntentFromZones_`, en pas als dat niets geeft `intentFromType_(planned.type)`. GAS vult die
  arg ALTIJD (`dashDayCard_`, `src/WebApp.gs:660` `segmentsFromBlokken_(wpEntry.blokken) ||
  segmentsFromIntent_(wpEntry.intent)` → `src/WebApp.gs:666`). Cadans geeft `segmenten: null`
  (`apps/web/src/lib/schema.ts:524`) ⇒ **FIX 4 permanent uit; de coach draait op het type-ETIKET.**
  Beide vullers zijn geport + geëxporteerd (`packages/engine/src/niveau.ts:47` + `packages/engine/src/niveau.ts:67`) en de blokken
  liggen ter plekke (`toSession(plannedWo).blokken`) — V15's vorm, maar client-side en ZONDER
  engine-signatuur-wijziging. GEDRAAID: **4 van 9 types classificeren anders → 8 van 18 combinaties**
  wijken af in state/narrative/adapt (`sweet_spot` sweetspot→drempel · `threshold` drempel→vo2 ·
  `recovery` herstel→duur · `combo_long_with_efforts` duur→drempel). Zelf-controle: zelfde harness
  mét dezelfde segmenten → 0 verschil. `combo_long_with_efforts` is letterlijk het geval waarvoor
  FIX 4 gebouwd is (`src/WebApp.gs:714-716`). **NUANCE, en hij de-escaleert: aanzetten is NIET
  automatisch beter** — GAS' route noemt een hersteltraining 'duur' en een drempel-sessie 'vo2',
  want de drempel (`packages/engine/src/coach.ts:123` `Math.max(8, total*0.12)`) weegt buckets tegen
  de TOTALE duur incl. warmup/rust. GAS' eigen fix heeft een defect. R4-vraag = **waar hoort de
  planned-prikkel vandaan: etiket of blokken, en welke drempel** → MODEL. Bereikbaar VANDAAG
  (done-vandaag + gemist; op verstreken dagen niet — V9's bereikbaarheids-noot).
- **V22 `weekTss` — de parity-claim klopt op het venster, niet op het filter.** GAS
  `actualTssByDate_` filtert `CYCLING_TYPES` (`src/Algorithm.gs:670`); Cadans' `weekTss`
  (`apps/web/src/lib/niveau.ts:111`) leest per rij alleen idx0+idx8 — idx1 (type) komt in de body
  niet voor, terwijl `apps/web/src/lib/niveau.ts:109` letterlijk "repliceert GAS `actualTssByDate_`" claimt. GEDRAAID: 2×
  Ride (80+60) → beide 140 (zelf-controle); + 1× Run (55) → **Cadans 195, GAS 140.** De Vorm-tab
  (`apps/web/src/components/vorm/MetricRow.tsx`) telt hardlopen dus mee in de week-belasting.
  Bereikbaar: noch de sync-route noch `readActivities` (`workers/api/src/db/repo.ts:291`) filtert op
  type. VIERDE consument van V4's type-filter-loze de-facto regel. GAS is norm → drift.
- **V23 `tsbZone` — nagebouwd op de VERKEERDE MEETLAT, uitkomst byte-identiek.** De comment
  (`apps/web/src/lib/tsb.ts:3-5`) zegt "de engine kent GEEN 3-zone TSB-drempelfunctie … dus het
  ontwerp is hier de autoriteit". **Premisse onwaar:** GAS heeft 'm, in de WEB-APP-laag —
  `src/Script.html:1395` `(tsb < -10) ? 'over' : (tsb <= 5 ? 'prod' : 'fris')` + `BM_BAND`
  (`src/Script.html:1379`, banden `src/Script.html:1380-1382`). Drempels, labels én kleur-tokens: **gelijk** (vermoedelijk omdat
  `design/src/conditie.jsx` beide voedde). **Geen drift — maar het is V1-(b)'s val, letterlijk:**
  "de engine kent het niet" als bewijs dat GAS het niet kent. Was het ontwerp ooit afgeweken, dan
  had niemand het gezien. Comment corrigeren hoort bij de bouw-chat die het bestand toch aanraakt.
- **V24 `plannedForDone` — Cadans' vervanger van de bevroren snapshot-entry.** GAS raakt een
  verstreken dag NIET aan: `snapshotDayAction_` → freeze → de vorige entry schuift onveranderd door
  (`src/Algorithm.gs:186`). Cadans **regenereert** met `buildWorkout` op
  `apps/web/src/lib/proposal.ts:426`, met de settings van NU. Nieuw t.o.v. R1-B0 (dat vond alleen
  dát hij null is) en V7 (dat vond het principe): **dit is de call-site.** Drift op vier assen —
  FTP/gewicht, `mesoWeek` (V2), `slot` (V14), `macroFase`. Type-keuze niet (die komt uit
  `voorgesteldType`). **LANDMIJN: wie V7 bouwt en `voorgesteld_type` vult, wekt ongemerkt de
  verleden-dag-vergelijking** — HANDOFF's "aanpak B", een PRODUCTbeslissing, geen bijvangst. Vierde
  landmijn naast V8's `hm`, V14's 7 rijen en `zones`/`intent`. Zelfde vorm: het werkt half en zwijgt.
- **Afgesloten in c, met bewijs:** de dekking-verrijkings-loop (`apps/web/src/lib/proposal.ts:267-292`)
  is een nabouw met een andere bron — GAS leest `feedback.details` (snapshot-afhankelijk:
  `computeZoneDebt_` keert terug op `src/Algorithm.gs:495-498` zonder `weekplan_<maandag>`), Cadans
  herbouwt uit `zoneActsByDateFromTab_(activities)` ⇒ **robuuster**. Maar `apps/web/src/lib/proposal.ts:269`
  `if (!d.train || !d.gedaan) continue` ⇒ dood (V4), én per constructie grotendeels redundant met
  `rollingZoneCoverage_` (elke voltooide dag van deze week valt binnen `[today-7…today]`). GEDRAAID:
  `gedaan` false vs true → identieke week. DERDE stilgelegde consument van V4. Verder afgesloten:
  de override-datumeis (`apps/web/src/lib/proposal.ts:374` vs GAS `src/Algorithm.gs:174` — GAS heeft géén datum-eis; via de UI
  onbereikbaar), `eventsSummary` (display-only), `coachNarrative.ts` + `coach.ts` (**nul
  GAS-tegenhanger, en dat is hier het ANTWOORD, geen vraag** — nieuwbouw → R3/R4), `tierProgress`.
- **R2-SLUITING (a+b+c) — 24 vondsten, 2 gereedschaps-bevindingen.** a: G1 + V1-V13 (109 units). b:
  V14-V20 + 1 landmijn (14 fns). c: G2 + V21-V24 (115 units). **R1's kernles overleefde alle drie:
  GEEN van de 24 vondsten zit in een fn-body.** Ze zitten in wie de inputs vult (a), wat een
  parameter betekent (b), en wat er in de laag ERBOVEN opnieuw is bedacht (c). De matrix sorteert op
  body-diff en wees exact NUL van de 24 aan — hij leverde de inventaris, en dat was zijn taak.
  **Eén wortel draagt acht vondsten:** V7 verklaart R1-B0-i/ii/iii, R1-A2, R1-B2, R1-B8, V10, V11,
  V9's onbereikbaarheid — plus c's V24 (de call-site) en de derde stilgelegde consument.
  **DRIE KLASSEN, en ze zijn niet hetzelfde:** (1) geporte fn INERT — voedende fn kwam niet mee
  (R1's patroon, a's 95); (2) geporte fn met NUL AANROEPERS — de laag ontbreekt (V10, V17 ×4); "nul
  aanroepers" is een VRAAG, geen verdict (1 van 4 gaf drift); (3) **NAGEBOUWD MET EEN ANDERE BRON** —
  de fn is geport én de nabouw ligt ernaast (V17's `dashActualsByDate_`, V18's `dashBeginAnker_`,
  c's V21/V22/V24). Klasse 3 ziet de matrix het slechtst: geen naam-match, want de nabouw heet anders.
  **Beide gereedschaps-assen liggen nu vast:** G1 (app-bereik-kolom zwak aan de Cadans-kant) + G2
  (corpus = 2 mappen, 177 units erbuiten). Hints, geen bewijs — a/b/c leunden op de bron en op
  DRAAIEN, niet op de kolom.
- **WERKWIJZE (R2 = 6e bevestiging):** chat leest zelf (read-only kloon + grep), NUL CC-prompts voor
  het lezen; CC doet alleen de close-out-commit. Matrix VIJF keer onafhankelijk gereproduceerd,
  cijfers exact gelijk (115 alleen-in-Cadans). **DRAAI HET** — c's twee sterkste vondsten (V21's
  8/18, V22's 195-vs-140) zijn beide gemeten, niet gelezen, elk met een zelf-controle die de fixture
  uitsluit. **REKEN JE EIGEN WERK NA:** a1 4/14 · a2 18/122 · a3 10/118 · b 4/116 · **c 7/103**
  locatie-ankers wezen naar de verkeerde regel — vier verkeerde regelnummers en drie paden zonder
  map, alle mechanisch gevangen vóór publicatie. Idem het CC-rapport: git fetch + byte-diff (0
  verschil) + de 103 asserties opnieuw tegen de GECOMMITTE bytes — **veertien keer schoon**.
  PROMPT-LES: mijn `grep -c "^## V2"`-verificatie was te grof (vangt ook `## V2`/`## V20`); CC meldde
  het en bevestigde de vier koppen apart. Anker verificatie-greps op de VOLLEDIGE kop, niet op een prefix.

**R1 KLAAR — 21 van de 21 (juli 2026).** Findings-doc `docs/R1-PORT-CORRECTHEID.md` (1231 regels), gepind:
https://raw.githubusercontent.com/daanhhk/Cadans/4b6a8774a0f2d0e8e090fb055973ef078e466f25/docs/R1-PORT-CORRECTHEID.md
Commits: batch A `c679f0a`, batch B deel 1 `9599ef8`, batch B deel 2 `df3280b`, batch C `4b6a877` — docs-only,
engine ongemoeid, niets gedeployd, vloeren ongewijzigd. **Findings, GEEN verdicts** (die zijn R4). Lees het doc;
hieronder alleen wat een volgende chat moet weten om niet verkeerd te beginnen.
- **SCOPE-CORRECTIE — "R1 = FASE-B port-correctheid" is een STALE LABEL.** Matrix-groep 1+2 raakt de
  FASE-B-kern nul keer: die fns sorteren als `equivalent [6]`/`[5,6]` (bodies AST-identiek op var/let/const
  na — mechanisch bewijs, sterker dan een handmatige lees), niet als `verschil`. Alleen `assignWorkouts` (g2)
  + `buildWorkout` (g3) raken FASE B. R1 = port-correctheid van de 21 verschil-fns met de zwakste
  oracle-dekking. Wat voor de FASE-B-fns open blijft is hun AANROEP, niet hun body (divergentie (3)).
- **EENHEID VAN REVIEW = body + ÉÉN hop naar de invulling.** Body-gelijkheid is nodig, niet genoeg. Over alle
  21: **geen enkele vondst zit in een fn-body** — op C11 na, en juist daar is het verschil onbereikbaar.
  Begin bij een fn dus NIET bij de body-diff maar bij: wie vult zijn inputs, en met wat. Verder = R2.
- **BATCH C DRAAIDE, EN DAT VERANDERDE DE UITKOMST.** De engine is puur en bundelbaar; de GAS-tegenhanger is
  uit de `.gs` te snijden en als module te importeren; dan diffen op ECHTE input (workout-rijen uit
  `buildWorkout` zelf, weken uit `buildWeekProposal` zelf). Recept staat in het doc (Methode-noot). Dat
  corrigeerde drie leesronde-claims: C3's "vorm-trend is dood" (FOUT — de bypass is equivalent, 93 = 93),
  C7's "een hardloopje vult de VOLTOOID-kaart" (TE GROOT — GAS doet dat óók; het echte verschil is de
  zone-balk + de selectie-regel), C1's "de fouten heffen elkaar op" (HALF — alleen de minuten, niet de TSS).
  **R2-aanbeveling: gebruik dezelfde harness, lees niet opnieuw alleen.**
- **DE VIER BATCH-C-VONDSTEN.** (C0) GAS' `SETTINGS_DEFAULTS`-laag (`Settings.gs:72`, drie accessors) is NIET
  geport — geen DDL-default, geen repo-default, `EMPTY_SETTINGS` = alles null en BEREIKBAAR via
  `loadSchemaWeek:886`/`:928`. Zes van twaalf velden lekken: ftp → "0-0W" · lthr → "0-0 bpm" · doel → "Pendel
  + null intervallen" · pendelDuurMin · pendelAantal · profielPreset → lege Volume-stat. GEÏNTRODUCEERD.
  (C1) Het pendel-veld betekent aan beide kanten iets anders: GAS 'Pendel duur per rit' (rauw opgeslagen)
  tegenover Cadans "Pendel (enkele reis)" (`legToRoundTrip` = ×2) mét `pendelAantal` er nóg eens overheen ⇒
  **exact 2× de pendel-belasting** (40 min + 2 ritten: GAS 80 min/59 TSS, Cadans 160 min/111 TSS) én het
  verschuift de rest van de week. (C7) `actualZone5_`s aanroeper mist het fiets-filter (zone-balk-only) en
  merget de dag waar GAS één rit pakt. (C9) De "In je blok"-badge vergeet het verleden (erft B0-i).
- **TWEE VONDSTEN ZIJN MODEL-VRAGEN, GEEN PORT-FOUTEN — R3/R4, toets aan `docs/TRAININGSMODEL.md`.** C1: is
  `pendelDuurMin` één rit of een retour? **GAS heeft zelf geen consistent antwoord** — het label zegt 'per
  rit' en de aggregaat-naam ook, maar beide pendel-generics splitsen `mins` in heen+terug. `faed841` koos de
  retour-lezing en liet `pendelAantal` staan. C7-(b): som je de dag of pak je één rit? GAS toont op een
  pendeldag de helft (33 TSS i.p.v. 59) en haalt kaart en zone-balk uit verschillende ritten; **Cadans'
  merge is het betere antwoord**. Bij beide is "Cadans wijkt af van GAS" waar maar nutteloos.
- **B0 IS NU DRIE KEER ZO GROOT — EN NIET GEDRAGS-NEUTRAAL.** Het schrijf-pad dicht B0-i/ii/iii + B8's drie
  remmen + C9's badge. **En het wekt `plannedForDone`** (nu ALTIJD null — `proposal.ts:420-424`, mechanisch
  bewezen op 7/7 dagen; dat is de echte verklaring voor de gereduceerde DoneDetail op verleden dagen, niet
  de productbeslissing die HANDOFF noemt). HANDOFF's "aanpak B" ÍS dit pad. Verleden voltooide dagen gaan
  dan **vanzelf** de volle plan-vs-gedaan-vergelijking tonen — dat is een PRODUCTbeslissing, niet optioneel.
  Dicht nog steeds NIET: de recency-seed (B8-a, vraagt een tweede ingreep). Volgorde-eis blijft: `zoneDebt_`
  pas aan zodra `weekplans` gevuld is.
- **MODEL 2 — CAVEAT bij "PRIMAIR".** `zoneDebt_` = altijd `{0,0,0}`, `rpeSignal_` = altijd 'normal' ⇒
  `combineSignals_` is een pure pass-through. FASE 3a sloopte het override-make-up-model (`0c954258`) MÉT de
  motivering "Model 2 is primair"; die staat op losse schroeven tot de inputs gevuld zijn. GEEN actie nu — R4
  weegt. De read-only Model-2-bevestiging (`d74e257`) is geen tegenbewijs: die test vult de inputs zelf.
- **MIGRATIE-SCOPE IS ONDERGESPECIFICEERD — EN ER ZIT EEN KLOK OP.** De §Data-migratie noemt alleen "Sheet →
  D1" en verder niets. Twee dingen die er wél op moeten: (1) **de weekplan-snapshots.** `dashWeekplanByDate_`
  (`WebApp.gs:179`, "Volledige historie") bewaart Daans hele gepland-vs-gedaan-verleden in DocProps — NIET in
  de Sheet, dus "Sheet → D1" vangt het per constructie niet. Het dekt tot de laatste échte
  GAS-proposal-generatie; sindsdien schrijft geen van beide apps het op en dat gat is echt weg. Hoe langer
  GAS niet draait, hoe groter. (2) **de `profielPreset`-vocabulaire.** GAS `'Gevorderd 7u'` ↔ Cadans
  `'gevorderd'`; 1-op-1 migreren geeft een lege Volume-stat.
- **SIGNAAL VOOR R2 (buiten R1-scope, geen matrix-cel).** `getVolumeTargets` (`Algorithm.gs:31`) is in GAS een
  echte engine-input met vier aanroepers (`Proposal.gs:470`, `WebApp.gs:1302`, `Doel.gs:331`,
  `TelegramBot.gs:405`) en bestaat in Cadans NIET; `profielPreset` is daar presentatie-only. Alleen-in-GAS ⇒
  geen naam-match ⇒ de matrix komt het niet tegen. Er zijn er 473 van die klasse.
- **DE MICRO-CORRECTIE IS AF — EN WAS ZELF FOUT.** Verwerkt in `4b6a877` als append-only sectie (de oude
  regels 525/551 staan bewust nog letterlijk). Uitkomst: `Algorithm.gs:91`→`:92` ✓ · `Vorm.tsx:44`→`:45` ✓ ·
  `schema.ts:876`→**`:874`**, NIET `:872` zoals hier stond (`:872` = `getActivities()`, `:874` =
  `getWellness()`, `:876` = `getDispositions()`). Het voorgeschreven anker was een handmatig overgeschreven
  getal en daarmee dezelfde klasse fout als de drie die het moest repareren.
- **WERKWIJZE-LES, NU TWEE KEER BEVESTIGD:** extraheer locatie-ankers MECHANISCH met een regex uit de eigen
  tekst en draai ze ALLEMAAL — nooit via een handgemaakte lijst. In batch B dekte de handlijst 48 van 70 en
  de drie fouten zaten in de 22 erbuiten. In batch C ving de mechanische toets (105 ankers geëxtraheerd, 135
  met een inhouds-assertie bestand+regel+substring gedraaid) **drie foute ankers in de eigen tekst** vóór het
  committen. Bestaan-en-in-bereik is NIET genoeg: alle drie wezen naar bestaande regels.
- **FOCUS VOLGENDE CHAT: R3-b** — dosering (§1 + §7 van het model: M7-M9 + M43-M48). **R3-a is
  KLAAR** (a1 + a2 + a3, 13 vondsten; T7 ingetrokken door T10). Route blijft R3 [b -> c -> d] ->
  R4 = verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; verdict-criterium =
  het MODEL, niet GAS. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R0 KLAAR — module 1 (AST-sorteermachine) + 2a (fundering) + 2b (matrix/oracle/entrypoint-map) + 2c (bewaker-fix)
(juli 2026).** Commits: 2a `8e66ded`, 2b `2093bcd`, 2c `24e7a4f` (+ module 1 `03804eb`/`0fac374`/`f48ed6b`/`7ead6b8`
en de fix-rondes `25ff64a`/`a0139bc`). `tools/audit/` hangt aan GEEN pnpm-script en staat NIET in CI. **Bakjes NA de
13 aliassen (4 bestaand + 9 nieuw; grond per koppeling in `alias.mjs`):** 175 naam-matches — identiek 64, equivalent
76, verschil 35, alleen-in-GAS 473, alleen-in-Cadans 115. (Dit vervangt de module-1-getallen 166/63/76/27 hieronder,
die van vóór de aliassen zijn.)
- **VIER HANDOFF-CLAIMS DIE NIET KLOPTEN (nu gecorrigeerd — zodat een volgende chat niet zoekt naar iets dat er niet
  is):** (a) "harde abort als HEAD ≠ 3e8090a" bestond niet in de code; nu gebouwd in 2a. (b) `VOCAB_FORBIDDEN`
  (rules.mjs) werd nergens geïmporteerd; nu afgedwongen op de rapport-tekst. (c) "de GAS-UI heeft 12
  server-entrypoints" → het zijn er 16; zie `entrypoints.mjs`. (d) de push-keten klopte niet — zie het OPENSTAAND-PUSH-
  blok, gecorrigeerd.
- **DE MATRIX = de leesvolgorde voor R1/R2, vier groepen (namen voluit):** groep 1 verschil zonder enige test (6):
  getGewicht, genericPendelIntervals, expectedRpe_, mesoFactor, zwoStepFromRow_, evTodayISO_→todayIso. Groep 2
  verschil met alleen een Cadans-test (15; gedrag vastgelegd, nooit tegen de herkomst geijkt — o.a. assignWorkouts +
  de Model-2-keten zoneDebt_/rollingZoneCoverage_/recentHardDate_/wellnessSignal_): dashVormReeks_, assignWorkouts,
  rpeSignal_, combineSignals_, trnPlannable_→isDayPlannable, trnDurLabel_→durLabel, coachActualZoneMin_→actualZone5_,
  isoWeek_→isoWeekNumber, rollingZoneCoverage→rollingZoneCoverage_, weekPlannedTypes_→weekPlannedTypes,
  getWellnessSignal→wellnessSignal_, computeZoneDebt_→zoneDebt_, recentHardDayDate_→recentHardDate_,
  trnNextPlannableDate_→nextPlannableDate, nlMaandLabel_→maandLabel. Groep 3 verschil, door beide oracles geraakt (10):
  dashActualsByDate_, dashStatsFromActivities_, dashBeginAnker_, dashNiveauReeks_, gatherWeekplanEntries_, buildWorkout,
  getReadinessScore_, formatDate, zoneTimesFromCell_, dslBlockFromRow_. Groep 4 architectuurgrens (4; de
  lib/api.ts-fetchwrappers, geen port): getWellness, getActivities, getEvents, getPowerCurve.
- **DE ORACLE-AS IS TWEE ASSEN:** "GAS bewees dit ook" (gas-suite-noemt / gas-assert-arg) tegenover "wij hebben dit
  vastgelegd" (cadans-test-noemt). Transitief oracle-bereik (205 units) is BEWUST in geen cel gebruikt: het bewijst
  een naamketen, NIET dat de oracle iets vastlegde (getReadinessScore_ en gatherWeekplanEntries_ zijn transitief
  bereikt en staan in geen assert-argument).
- **WAT DE MATRIX NIET DOET (structureel, niet met een betere graaf op te lossen):** (1) hij sorteert PORT-risico,
  niet MODEL-risico — `effectiveMacroFase_` is identiek, bereikbaar én door beide oracles geraakt (de rustigste cel)
  en tegelijk het zwaarste trainings-defect; R3 komt niet uit deze matrix, en de rustigste cel is niet de veiligste.
  (2) de 115 alleen-in-Cadans hebben geen GAS-tegenhanger, dus geen verdict — ze draaien wél. (3) alleen TOP-LEVEL
  units worden vergeleken, geneste helpers niet. (4) de 9 aliassen zijn een OORDEEL, geen bewijs (8/9 kregen verdict
  "verschil"); de 15 afgewezen kandidaten staan in `tools/audit/out/aliasscan.txt`, afgewezen op laagverschil
  (RPC-client tegenover Sheet-schrijver) of 1-op-veel-consolidatie. (5) de scope-check is unit-breed (2c).
- **BEVINDING (client-only, geen engine) — geparkeerde debt:** `maandLabel` bestaat twee keer — `lib/niveau.ts:32`
  (gedeeld, geëxporteerd) en een eigen kopie in `components/niveau/ProgressieCard.tsx:30` die de gedeelde versie NIET
  importeert. Ze wijken af op edge-cases (input zonder streepje). De alias koppelt aan de lib-versie, dus de matrix
  klopt. Later: de kopie vervangen door een import van de gedeelde `maandLabel`.
- **FOCUS VOLGENDE CHAT:** R1 = FASE-B port-correctheid. Leesvolgorde = matrix-groep 1, dan groep 2. GEEN
  engine-wijziging in de review; findings → verdicts → aparte bouw-chats.

**R0 MODULE 1 — AST-SORTEERMACHINE (historie, juli 2026).** Laatste CODE-commit `a0139bc` (tools/audit, NIET in CI,
engine ongemoeid). Leeft in `tools/audit/` (`alias.mjs`, `rules.mjs`, `run.mjs`). Entry: `node tools/audit/run.mjs`.
GAS-bron via env `GAS_SRC` (default `C:\Users\daan\Projects\training`), read-only; harde abort als HEAD ≠ `3e8090a`.
Uitvoer naar `tools/audit/out/` (gitignored). **NADRUKKELIJK NIET IN CI** — in CI zou hij de engine voor eeuwig aan
GAS vastvriezen. Hangt aan geen pnpm-script; bewaakt zichzelf met asserts die de run ABREKEN, niet met vitest.
- **Wat het IS:** een sorteermachine, GEEN rechter. "identiek" is geen kwaliteitsoordeel en "verschil" is geen bug.
  Verdicts toetsen aan het MODEL (`docs/TRAININGSMODEL.md`), niet aan GAS — zie vondst 1 (AST-identiek `effectiveMacroFase_`
  én toch het zwaarste trainings-defect).
- **De zes gelijkstellingsregels staan VAST en zijn door Daan gereviewd.** De volledige regel-lijst
  (onderbouwing/voorwaarde/restrisico/dragers) wordt bij ELKE run uit de regel-objecten geprint, zodat doc en code
  niet kunnen driften. Een zevende regel gaat eerst langs Daan.
- **Verse run (bron van deze getallen):** 166 naam-matches — identiek 63, equivalent onder regels 76, verschil 27,
  alleen-in-GAS 482, alleen-in-Cadans 124. type-lekken: GEEN. Regel-dragers: regel 1 → 3, regel 2 → 2, regel 3 → 2,
  regel 4 → 6, regel 5 → 29, regel 6 → 58.
- **Leesstapel ("verschil", input voor R1/R2), voluit:** getGewicht, dashActualsByDate_, dashVormReeks_,
  dashStatsFromActivities_, dashBeginAnker_, dashNiveauReeks_, gatherWeekplanEntries_, assignWorkouts, buildWorkout,
  genericPendelIntervals, getReadinessScore_, expectedRpe_, rpeSignal_, combineSignals_, formatDate, mesoFactor,
  zoneTimesFromCell_, dslBlockFromRow_, zwoStepFromRow_, getWellness, getActivities, getEvents, getPowerCurve, plus
  de vier aliassen (trnPlannable_→isDayPlannable, trnDurLabel_→durLabel, coachActualZoneMin_→actualZone5_,
  isoWeek_→isoWeekNumber). Deels al verklaard: seams uit debt (b) + de Sheets-lezers (getWellness/getActivities/
  getEvents/getPowerCurve/zoneTimesFromCell_), platform-shims (formatDate), mesoFactor-neutralisatie (loadCarry x1),
  combineSignals_ (niet-muterend, output-equivalent). **assignWorkouts en buildWorkout zijn de zwaarste onbekenden.**
- **Bewaker regel 6:** over de hele GAS-bron NUL closures die een var-lusvariabele vangen én de ronde overleven.
  Twee capture-gevallen (`allocateQualityWeek_` 'anchors', `scaleBlocksToFit_` 'on'), beide whitelisted
  array-callbacks die binnen de ronde afronden → regel 6 verviel voor geen enkele functie. Whitelist, geen blacklist.
- **Drie bugs gevonden en gedicht tijdens de review, met de les:**
  1. `0f5d258`→`25ff64a`: regel 5 miste elke beknopte arrow-body ("RET(" was een handgeschreven label dat het
     generieke "K254(" moest spiegelen). LES: nooit een label handmatig naspelen dat het generieke pad óók produceert
     — bouw de node en serialiseer hem.
  2. `25ff64a`: `serFunc` liet de functienaam weg, ook voor FunctionDeclaration → geneste helpers die alleen in naam
     verschilden konden vals-identiek worden. Gedicht; in de echte corpus verschoof er niets, maar het mechanisme is
     nu door een zelftest afgedekt.
  3. `25ff64a`→`a0139bc`: de declaratiesoort werd alleen op een VariableStatement getagd, niet in een lus-kop.
     Daardoor was `for (var i)` baseline-gelijk aan `for (let i)` — op precies de risicoplek waarvoor de bewaker van
     regel 6 bestaat, en `compare()` keert al terug op "identiek" vóór de bewaker draait (`findVariantById_` schoof
     hierdoor van identiek naar equivalent [6]). LES: een bewaker-zelftest die de bewaker RECHTSTREEKS aanroept
     bewijst dat hij KLOPT, nooit dat hij BEREIKBAAR is — zelftests lopen sindsdien end-to-end door `compare()`
     ("bewaker end-to-end: verschil"). Tweede les: de negatieve zelftest van regel 6 testte de makkelijke vorm
     (statement-declaratie) i.p.v. de risicovorm (lus-kop). De harness draait nu 18 regel-zelftest-paren, alle geslaagd.
- **Verificatie (waarom module 1 als klaar geldt — niet de gate):** de getallen zijn onafhankelijk gereproduceerd
  door een tweede, los geschreven implementatie (chat-side probe tegen een verse read-only kloon van
  daanhhk/training op `3e8090a`). Elk getal en elke functienaam kwam overeen.
- **CORRECTIE VOOR DE RECORD:** commit `a0139bc` is gemaakt tijdens deze reeks, niet eerder. Het rapport bij die
  commit beweerde dat de fixes al in HEAD stonden en dat de prompt identiek was aan de vorige ronde; dat klopt niet —
  `a0139bc` is een kind van `25ff64a`, met een eigen commit-message, en bij `25ff64a` stond identiek nog op 64 met
  het lus-kop-gat open. Het werk is goed, de narratie eromheen was fout. Genoteerd zodat een volgende chat niet zoekt
  naar een herkomst die er niet is.
- **(module 2 is intussen GEBOUWD — zie het R0-KLAAR-blok bovenaan Stand: matrix + oracle-inventaris +
  entrypoint-map van 16 regels in `entrypoints.mjs`.)**

**TRAININGSMODEL GESCHREVEN (juli 2026) — commit `fc76af2`, docs-only, engine ongemoeid, niets gedeployd.**
`docs/TRAININGSMODEL.md` = de NORM voor de trainings-laag; R1-R4 vellen hun verdicts hiertegen
(verdict-criterium: toets aan het MODEL, niet aan GAS).
- **Mechaniek:** regels M1-M61, append-only, nooit hernummeren; statuslabels
  NORM/HEURISTIEK/BEVINDING/OPEN/INGETROKKEN; claimregel M5 (de app beweert niets dat niet als regel met status in
  het model staat); M6: een schending = bevinding, geen release-gate.
- **Rolverdeling vast:** BESLUITEN (`docs/TRAININGSMODEL-BESLUITEN.md`) = log + bewijs (citeren, niet samenvatten);
  MODEL = de norm. Het model bevat bewust GEEN regelnummers/bestandsnamen (M2) en GEEN persoonlijke trainingsdata
  (testcase §11 = status + functie; de waarden blijven in BESLUITEN).
- **Toetsbaarheid:** vondsten 1/2/3/4/8 zijn beoordeelbaar via M50/M46/M33+M39/M56/M31. Vondsten 5/6/7/9 zijn GEEN
  model-vragen (infra-parity + data) — dat is de norm-omslag in werking.
- **FOCUS VOLGENDE CHAT:** R0 module 1 (AST-sorteermachine) is KLAAR — zie het R0-blok bovenaan Stand. Volgende =
  R0 module 2 (risico-matrix + oracle-inventaris), daarna R1 FASE-B port-correctheid.
- **OPENSTAAND (ongewijzigd):** functionele round-trip op PROD in de browser (hard refresh/incognito i.v.m.
  service-worker-cache); het A-event op prod staat op `2027-04-18` en moet `2027-04-17` zijn (AGR Toerversie =
  zaterdag; remote-D1-fix, approval-gated).
- **OPENSTAAND — PUSH NAAR GARMIN — CUTOVER-BLOKKEREND, geen actie nu.** De GAS-app pusht nog en blijft dat doen tot
  de cutover; dat is de brug. **CORRECTIE (R0 2c): de eerder genoteerde keten klopte niet — `pushWorkout`
  (IntervalsApi.gs:222) wordt in de HELE GAS-bron NERGENS aangeroepen; de enige andere vermelding is een commentaar
  (Sync.gs:475). Wie die volgorde volgt bij FASE C port dode code.** De ECHTE keten (DEFINITIE-locaties; call-sites
  apart genoemd): `pushGarmin` (Index.html:37) → `pushWeb` (def WebApp.gs:1607) → `pushAllPending_` (def Sync.gs:484)
  → `buildEventPayload` (def IntervalsApi.gs:165), aangeroepen per sessie op Sync.gs:508 → `pushEvents_` (def
  IntervalsApi.gs:231), aangeroepen op Sync.gs:518 (/events/bulk?upsert=true). De ZWO-assembler-tak (`buildWorkoutZwo_`
  def Algorithm.gs:1720, met `sanitizeFilename_` def IntervalsApi.gs:211 en `buildWorkoutDescription_` def
  IntervalsApi.gs:253) hangt onder `buildEventPayload`; daarvan bestaan in Cadans alleen `zwoStepFromRow_`/`zwoPct_`
  (`packages/engine/src/zones.ts`), de assemblers niet.
  Verder: `workers/api/src/integrations/intervals.ts` is read-only bij ontwerp, er is geen uitgaande schrijf-call in
  de Worker, en er is geen push/synced-state in D1. Bouwen is een EIGEN FASE, niet tussendoor, en pas na de review.
  Volgorde als hij komt: (1) ~~`zwoStepFromRow_` lezen~~ — **VERVALLEN.** R1-C2 stelde mechanisch vast dat hij
  functioneel 1-op-1 is (2.464 gevallen uit een echt `buildWorkout`-corpus, alle vijf takken, nul verschillen);
  de "wijkt af van GAS zonder dat iemand weet waarom" bestond niet. Begin bij (2) `buildWorkoutZwo_` porten (engine — dat verschuift de
  harness-cijfers, dus daarna module 1 opnieuw draaien); (3) schrijf-pad in de intervals-client + `buildEventPayload`
  + route; (4) D1-migratie voor push-state; (5) knop + status in de PWA; (6) write-scope `INTERVALS_API_KEY` als
  Worker-secret + prod-deploy, approval-gated. Dit is het eerste moment dat Cadans naar buiten schrijft: tot nu toe
  kon een fout een verkeerd scherm geven, hierna een verkeerde training op het stuur.

**REVIEW-CHAT CLOSE-OUT (juli 2026) — NORM-OMSLAG + REVIEW-ROUTE VASTGELEGD.** Bron van waarheid voor de norm =
**`docs/TRAININGSMODEL-BESLUITEN.md`** (besluiten-log; citeren, niet samenvatten — `docs/TRAININGSMODEL.md` wordt
daar in een verse chat uit geschreven). Kernpunten:
- **Norm-omslag (drie normen naast elkaar):** GAS is de REFERENTIE, niet de NORM (altijd de bron lezen, nooit uit
  geheugen). Front-end/vormgeving → GAS is norm. Infra (parsers, sync, datums, row-mapping, zone-extractie) → parity
  is norm; drift = bug. Trainings-laag → coaching-deugdelijkheid is norm; GAS is daar herkomst, geen gezag.
- **Cutover-regel:** poort = GEEN FUNCTIONELE REGRESSIE t.o.v. GAS (bijna alle vondsten zijn GEËRFD, niet
  geïntroduceerd; de cutover maakt niet slechter, hij maakt fixbaar). Modelfixes NÁ cutover, op het platform waar ze
  testbaar zijn. TWEEDE AS: urgentie ≠ blokkerend (bv. Onderhoud→Base moet weg vóór de winterdip, ongeacht de
  cutover-stand).
- **Optie B akkoord; review-route vastgelegd:** R0 harness → R1 FASE-B port-correctheid → R2 end-audit op de
  risico-matrix → R3 trainings-review tegen het model → R4 verdict-doc ("cutover-blokkerend ja/nee" per item). GEEN
  engine-wijziging in de hele review; findings → verdicts → aparte bouw-chats.
- **STAANDE PRIVACY-REGEL:** GEEN persoonlijke trainingsdata in de publieke repo (daanhhk/Cadans is PUBLIEK).
  Bevindingen wel, ruwe data niet; analyse-scripts + ruwe uitvoer BUITEN de repo-tree. Committen is onomkeerbaar
  (git-history/forks/indexering) — bij twijfel niet.
- De vondsten (o.a. `effectiveMacroFase_` Onderhoud→Base, `long_z2` als restpost, de Garmin-push-keten, readiness
  van beslisser → informant) staan UITGESCHREVEN in het besluiten-bestand — hier bewust NIET samengevat.

**FASE 1 + FASE 2 (§5b + 4b + brok 2 + brok 3 + brok 4a + brok 5) — deze reeks chats. FASE 2 = COMPLEET.** Meetlat =
`docs/VORMGEVING-SPEC.md` (BEVROREN); geverifieerd via de dev-`/preview`-loop. Brok 3 = de EERSTE prod-aanraking
(remote-D1 + deploy).

**VLOEREN** (mogen niet regresseren; NIET in prompts hardcoden): engine-selftest-assert-count **957** ·
vitest-totaal **329** (groeipad na 310: B3 RUN 1 bibliotheek-laag +7 → 317; B3 RUN 2 `pickerState` +6 → 323; B2
RUN 1 plannable-predicaten +6 → 329; B2 RUN 2 Trainingen-tab +0). Engine-selftest-assert-count **957 ONGEWIJZIGD**
(engine niet aangeraakt in FASE B B3/B2). **De vloer-eenheid is het monorepo-brede `pnpm test`-totaal** (root
`vitest run`) — NIET een per-package-slice; "web 186 / api 78" zijn slices bínnen die 329, geen vloer.
_(Vorige stand: 304 → 300 in FASE 3a, `schema.test.ts` 45 → 41; GEEN regressie.)_

### BRONHIERARCHIE VOOR PARITY (werkwijze — vast)
Verhuisd naar `docs/WERKWIJZE.md` (canoniek). Bij tegenspraak wint WERKWIJZE.md.

### PROMPT-VORM (werkwijze)
Verhuisd naar `docs/WERKWIJZE.md` (canoniek). Bij tegenspraak wint WERKWIJZE.md.

**FASE A GEDEPLOYD (A1-A4 + B1) — LIVE op prod, Version `171f79fc`** (was `52a51ae9`; de deploy bundelde
A1/B1/A3/A2/A4). A2/A4 laatste: disposition-backend `6929741`, disposition-UI + gemist-kaart `d8c70e4`. Prod =
Basic-Auth-gated (`/api/health` → 401 + `WWW-Authenticate: Basic`); functionele round-trip in-browser door Daan.
- **A2/A4 visuele check — DOORGESCHOVEN naar de live-aankomende-week:** de affordance verschijnt vanzelf op een
  doordeweekse vandaag-zonder-rit (geen LAN-dev-server-checklist meer nodig). **ARCHITECTUUR-NOOT:** "Niet gedaan?"
  toont ALLEEN op vandaag/toekomst — verleden dagen missen een voorstel (`proposal.ts:294` assignt alleen ≥ vandaag;
  GAS bewaart weekplan-snapshots, Cadans niet). Bewezen GAS-conform (`canDispose` spiegelt `Script.html:448`).
  Verleden-dispositie deelt de weekplan-persistentie-fundering (aanpak-B) met de DayStrip-venster-feature.
- **A4 = SIMPELE gemist-kaart (bewust).** De rijke frame-10 (`gemistDetailHtml_`: planregel +
  reden-herkiezer + coach-box) = DOEL, gebouwd IN/NA B4 (deelt B4's coach-adaptatie + de
  plan-only missed-`coachFeedback_`). De A2-plumbing (disposition-map → deriveSchemaView →
  "gemist"-state → SchemaDay.dispositie → affordance) is frame-10-klaar; de upgrade is een
  body-swap.
- **FASE B recon-doc:** `docs/FASE-B-OVERRIDE-ADAPTATIE-RECON.md` — override + picker + B4-
  adaptatie in kaart. KERN: de engine-kern is al geport; ontbreekt = client-orkestratie + UI;
  de override-backend is de gedeelde B3/B4-fundering. Bevat de port-correctheid-caveat.

**PROD ACTUEEL — FASE B B3-picker + B2 Trainingen-tab DONE + GEDEPLOYD.** main HEAD = `7ead6b8`; prod draait
Version `3e7a3189-7061-4ae6-9b0a-1ada0c5bcece` = **main t/m `7ead6b8`** (deze deploy bundelde laag-3b + de
B3-picker + de B2 Trainingen-tab; prod liep tevoren achter op Version `02b6abb9` = main t/m `aeafcc9`). Version-log
deze reeks: `43ab5f03` (coach-narrative-reeks) → `479403a9` (FASE 3a+3b) → `02b6abb9` (Niveau test-modus + FTP-band)
→ `3e7a3189` (FASE B B3+B2). Remote D1 ONGEWIJZIGD t/m `0003_wise_sunset_bain.sql` (`d1 migrations list --remote`
→ "No migrations to apply!"; B3/B2 raakten het schema niet). Basic-Auth-gate actief (`/api/health` → 401 +
`WWW-Authenticate: Basic`); functionele round-trip op prod in-browser (hard refresh / incognito i.v.m. SW-cache)
door Daan — OPENSTAAND.

**FASE B — B3-picker + B2 Trainingen-tab (DONE + GEDEPLOYD in Version `3e7a3189`, prod = main t/m `7ead6b8`; gate +
CI groen, telefoon-geverifieerd op de Vite-dev-server).**
- **Commits:** `03804eb` (bibliotheek-laag + engine-preview), `0fac374` (picker-sheet + `pickerState`), `f48ed6b`
  (gedeelde views + GAS-conform plannable-predicaat), `7ead6b8` (Trainingen-pagina).
- **Architectuur:** `lib/library.ts` (getypeerde bibliotheek-index om de engine-`any` heen + `libraryOverride`/
  `freeOverride` + `previewOverrideSession` + `isDayPlannable`/`nextPlannableDate`/`weekPlannedTypes` + `DUR_*`) ·
  `lib/pickerState.ts` (gedeelde view-reducer, superset: B2 gebruikt `home`/`free` NIET, start-view `cats`) ·
  `components/library/` (`BackHeader`/`DurationSlider`/`CategoryList`/`VariantRow`) · `components/schema/
  WorkoutPickerSheet.tsx` (Schema-picker, componeert de views) · `pages/Trainingen.tsx` (de tab). **`ComingSoon.tsx`
  VERWIJDERD** (dode code; enige consumer was de /trainingen-route). `ProposalWeek.mesoWeek` additief; `toSession`
  geëxporteerd.
- **HARDE SPEC-EIS (blijft):** de picker stuurt ALTIJD `variantId` mee (zie de CORRECTIE hieronder voor het waarom —
  nu twee redenen).
- **CORRECTIE op een eerdere HANDOFF-claim (deze reeks kostte 'm een ronde — daarom zichtbaar gemarkeerd):**
  - _OUD (FOUT):_ "Alleen `long_z2` + `combo_long_with_efforts` schalen echt (`SCALABLE_TYPES`, `Algorithm.gs:156`);
    een 75-min-fixture leverde een 90-min template."
  - _JUIST:_ `SCALABLE_TYPES` wordt UITSLUITEND gebruikt op `Algorithm.gs:207`, voor een LOG-regel — het is een
    diagnostiek-drempel, GEEN schaal-schakelaar. `buildWorkout` (`:2499`) doet voor pool-types (threshold/tempo/
    sweet_spot/vo2max/long_z2) `selectVariant_` → `renderVariant_(…, mins)` en honoreert de duur dus WÉL. Zonder
    `variantId` krijg je daardoor de ROTATIE-variant: juiste duur, VERKEERDE workout — je keuze wordt stil vervangen.
    `recovery` zit NIET in `getPool_` en valt door naar `genericRecovery`, die `mins` clampt op `max(30, min(60,
    mins))` → een 120-min-verzoek wordt 60. Empirisch gepind in `lib/library.test.ts` (`recovery`/`rec_licht`, 120 →
    120 mét `variantId`, 60 zonder). `variantId` blijft dus verplicht om TWEE redenen i.p.v. één.
- **PARITY-HERSTEL (geen divergentie):** `SchemaView`'s `dayPlannable` leunt nu op het gedeelde `isDayPlannable`
  (GAS `trnPlannable_`, `Script.html:1069` = dezelfde fn als de Trainingen-tab). Gevolg: een GEMISTE dag biedt geen
  "Andere training kiezen" meer (de `GemistCard` heeft "Terug" om 'm te heropenen).

**NIEUW GEBOUWD & LIVE deze reeks** (samengevat, niet elke commit; canonieke copy-/persona-bron =
`apps/web/src/lib/coachNarrative.ts`):
- **Auto-sync bij app-open** (`155b655`): fire-and-forget intervals-sync bij mount (spiegelt GAS
  onState → refreshActivities → idempotente her-render), ↻-knop VERWIJDERD, "Laatst gesynct"-regel, in-memory
  staleness-guard (`lib/syncStatus.ts`). Selectie-behoud bij de re-derive = by-construction + in-browser bevestigd.
- **Model-2 bevestiging** (read-only test `d74e257`): de weekgen stuurt de dagen ≥ vandaag al bij op basis van
  gereden actuals (dekking/`zoneDebt_`/`recentHardDate_`) + avoid-consecutive-hard (`planner.ts`) mét
  debt-exceptie. Dit VERVANGT het override-make-up-model als PRIMAIR (zie §Geparkeerde debts).
- **Engine `redenCode`** (`83f3740` + `f498163` allocator-takken): additief veld op ProposalDay/GridDay NAAST de
  byte-identieke reden-strings (957 ongemoeid) → **client coach-narrative-laag** (`lib/coachNarrative.ts`): warme,
  gevarieerde per-dag coach-copy met deterministische seed (`datum|code|persona`), persona-gedimensioneerd.
- **coachPersona-instelling** (`36a0b7b`, migratie 0003): settings-kolom + kiezer-UI (warm actief;
  disciplined/statistical "binnenkort", lege pools → fallback warm).
- **Gedeelde `CoachCallout`** (`c800d47`): de per-dag-narrative staat nu in het coach-blok (glyph + coachnaam) boven
  de training i.p.v. een kale regel; byte-identiek met de voltooid-kaart-coach-box.

**FASE 3 (Brok 3) — client-only opruim + gemist-narrative zichtbaar** (gate + CI groen, telefoon-geverifieerd;
GEDEPLOYD in Version `479403a9`):
- **3a — verlaten override-make-up-MODEL verwijderd** (`0c954258`): uit `apps/web/src/lib/schema.ts` weg:
  `applyMakeupAdaptations`-post-pass + aanroep, `MakeupAdaptatie`-type, `SchemaDay.makeupAdaptatie`-veld,
  client-imports `coachAdaptatie_`/`getTrainingLibrary_` (+ de dode `DayOverride`-import). De ENGINE-fns
  `coachAdaptatie_`/`coachFeedback_` (`packages/engine/src/coach.ts`) ONGEMOEID = bron van waarheid; Model 2
  (auto-herplannende weekgen) is primair. `deriveSchemaView`-signatuur behouden; ongebruikte params → `_overrides`/
  `_settings` (conform `_readiness`). CI: https://github.com/daanhhk/Cadans/actions/runs/29353107022
- **3a — BlockList duplicate-React-key gefixt** (`0c954258`): key → blok-index (`biome-ignore noArrayIndexKey`,
  statische read-only lijst).
- **3b — gemist-dag coach-narrative ZICHTBAAR** (`faab52cb`): `missedCoach_`-narrative rendert nu in `GemistCard` in
  het gedeelde `CoachCallout`-formaat, ONDER de "Gemist · <reden>"-rij. Alleen `coach.narrative` — NIET `coach.adapt`
  (hoort bij het verwijderde make-up-model). `impact=false`. De done-box (`DoneCompareCard`) bewust NIET aangeraakt.
  CI: https://github.com/daanhhk/Cadans/actions/runs/29355111917 · telefoon-check (Vite dev `192.168.1.201:5173`,
  Schema-tab): een gemist-dag toont de narrative in het CoachCallout-blok onder de gemist-rij — correct.

**NIVEAU doel-projectie — test-modus + FTP-band-fix (2 commits, CLIENT-ONLY, engine ongemoeid; GEDEPLOYD in Version
`02b6abb9`):**
- **`7308d660` "honour 'test' projection mode for FTP goal" — PORT-OMISSIE HERSTELD:** `DoelProjectie.tsx` gebruikte
  `projectieMode` alleen voor een kop-label; de gap-machinerie draaide onvoorwaardelijk. GAS onderdrukt bij een
  FTP-doel (`GOAL_PROFILES_.ftp`, projectieMode `test`, `WebApp.gs:499`) de HELE gap-tak: geen gap-rijen, geen
  callout, geen duurdoel-lijn (`Script.html:1700-1702`), en toont de testdag-projectie (`:1616-1634`). Daardoor toonde
  Cadans "zo niet haalbaar. Verhoog het volume." op een FTP-doel — in GAS ONBEREIKBaar (die zin zit in de NIET-test-tak,
  `:1633`). Nu: `isTest = projectieMode === "test" && testWeken != null`; band gevoed met `ctlAtTest` (`ctlAtWeek_`).
  Slider-default: `useState(8)` → `weeklyHoursRecent_(rows,42)` geclampt 4..14 (`WebApp.gs:1268` + `Script.html:1673`);
  de engine-fn was al geport (`niveau.ts:804`) maar niet gewired. **BEWUSTE CLIENT-ONLY DIVERGENTIES:** (a) readout-copy
  = richting in mensentaal via de nieuwe pure helper `projectionDirection` (`apps/web/src/lib/niveau.ts`; drempel
  |delta| < 1 CTL → "flat"), GEEN CTL-getal in de copy — GAS toont "~X CTL" + gebruikt de richting alleen als warn;
  (b) band-figuur klapt in tot ÉÉN getal bij low === high.
- **`aeafcc9f` "use configured FTP as band basis and end projection at test day":** BUG — `Niveau.tsx` gaf
  `currentFtp: eftp ?? settings?.ftp` door → de band startte op eFTP (265) terwijl de kop de ingestelde FTP (280) toont
  = interne tegenspraak (fitheid stijgt, FTP daalt). GAS gebruikt `settings.ftp` ONLY (`WebApp.gs:1268`). Nu:
  `settings?.ftp ?? eftp ?? null`. **BEWUSTE DIVERGENTIE:** het x-domein stopt op de testdag in test-modus
  (`weeksDomain = isTest && testWeken != null ? Math.max(4, testWeken) : 16`). GAS hardcodeert `WEEKS=16` óók in
  test-modus (`Script.html:1567`) → de curve liep 5 wkn voorbij een VASTE testdag en suggereerde "langer doortrainen",
  een handeling die niet bestaat. Ticks: nu/+4w/+8w bij domein 11. Geverifieerd (390×844, LAN dev): band 280–283 W bij
  6u, 280–298 W bij 8u (low vast op 280); kop "FTP-test over ~11 weken" blijft bij slider-beweging; geen "+16w"-tick.

**FASE B laag-3b — OverriddenDetail + "Terug naar voorstel" — DONE** (`7060bfd`, CLIENT-ONLY, engine ongemoeid;
CI https://github.com/daanhhk/Cadans/actions/runs/29391197247, telefoon-geverifieerd incl. omkeerbaarheid; **GEDEPLOYD
in Version `3e7a3189`** — meegebundeld met B3+B2):
- **PORT-OMISSIE HERSTELD:** de D2-swap (`bbb9767`) zette alleen `sessions`; voorgesteldType/reden/redenCode/
  archetypeId bleven van de VERWORPEN coach-workout. De tak spiegelt nu `overrideWeekplanEntry_` (`Algorithm.gs:2427`):
  voorgesteldType = `"free" | workoutType`, reden `"Handmatig gekozen"`, redenCode/archetypeId null, plus het nieuwe
  veld `ProposalDay.override` (gezet ALLEEN als de swap echt gebeurde).
- **NIEUW:** `SchemaDay.override` (1-op-1 doorgelezen, GEEN eigen conditie), pure helper `durLabel` (`trnDurLabel_`-port),
  component `OverriddenDetail` (pin "Handmatig gekozen" + free-blok óf `WorkoutDetail` + full-width "Terug naar
  voorstel" via `putOverride(date,null)` + `bumpPlannerVersion`). Dispatch in SchemaView NÁ done/gemist, VÓÓR
  rustdag/sessions; coachText onderdrukt op override-dagen (de pin IS de reden).
- **ONTDUBBELD (WIJKT AF van het oude HANDOFF-plan "brengt overrides terug in `deriveSchemaView`"):** `_overrides` uit
  `deriveSchemaView`, `overrides` uit de `loadSchemaWeek`-return + de Schema.tsx/SchemaView-props verwijderd. De
  override reist nu UITSLUITEND via `ProposalWeek.days[].override`. Bewust: een tweede herberekening zou `dayPlannable`
  dupliceren (leunt op `d.gedaan`) = het bekende render-bug-patroon.
- **GAS-analyse (vastgelegd zodat B3 't niet overdoet):** `overrideKaart_` bestaat in GAS omdat `saveDayOverride` NIET
  regenereert → `d.voorstel` stale → eigen library-lookup + client-side `trnScale_` + `overrideDotZone_`. Cadans
  regenereert elke render → `day.sessions` IS al de engine-workout. `trnScale_`/`overrideDotZone_` zijn daarom BEWUST
  NIET geport; de DayStrip-dot volgt `sessions` vanzelf.
- **BEWUSTE GAS-parity (asymmetrie, intentioneel):** free-override toont chips + "Op gevoel — geen vaste
  blokstructuur", GEEN bar/IF/TSS (`freeRideCardHtml_`); library-override toont wél bar + IF/TSS (`zoneBlock_` +
  `inlineMetrics_`). De free-TSS is gesynthetiseerd uit een intensiteit-aanname (`buildFreeRideWorkout_`) en telt wél
  mee in de WeekLoad.

**PROD-DATA-BACKFILL (geen code):** remote D1 via de browser-console op prod bijgewerkt — `POST /api/sync/activities?
days=365` + `POST /api/sync/wellness?days=365`. Reden: prod had ~15 activiteiten (seed 12-06..06-07) terwijl de
GAS-Sheet er ~478 heeft (`WebApp.gs:1593` "bewezen 478→478→478"). Idempotente upsert, niets verwijderd. NEVENEFFECT:
het weekdoel schoof 137 → 132 TSS — `zoneDebt_`/dekking lezen nu een jaar i.p.v. 28 dagen (Model 2). De
Niveau-ProgressieCard ("Alles" = `sliceRange` ongefilterd op maandpunten) toont nu de volle historie; er was GÉÉN
code-bug.

**FASE B laag-1 + readiness-koers (onder) blijven live; laag-2a is VERLATEN (zie §Geparkeerde debts).**
- **laag-1 (override-backend + D2) — KLAAR + gedeployd** (`bbb9767`): day-override-backend
  (`writeOverride`/`readOverrides` + GET/PUT `/api/overrides`, spiegelt de A2-disposition-backend; non-clobber = zet
  alleen `override_json`) + override-DTO (`packages/shared/src/override.ts`: `DayOverride =
  LibraryOverride|FreeOverride`, `OverrideEntry`) + D2 `buildWeekProposal`-wiring (plannbare dag mét override →
  `buildOverrideWorkout_` i.p.v. de coach-tak → telt mee in de WeekLoad). `day_state.override_json` bestond al, geen
  migratie.
- **Readiness-koers (band-gedreven week-demote) — KLAAR + gedeployd** (`ae00730`): het week-plan-demote-signaal leunt
  nu op de HOLISTISCHE readiness-band (`getReadinessScore_` — weegt vorm/HRV/slaap/check-in) i.p.v. de botte
  `wellnessSignal_`-vlag. **BEWUSTE GAS-DIVERGENTIE, CLIENT-ONLY** (`buildWeekProposal` + `loadSchemaWeek`); engine
  (`wellnessSignal_`/`getReadinessScore_`/`combineSignals_`/`assignWorkouts`) + de 957-selftest byte-parity. Mapping:
  band ready→normal · caution→demote · rest→recovery; RPE telt nog mee (`combineSignals_`, zwaarste wint); band null
  (te weinig data) → val terug op de botte wSig-vlag. VERVANGT de `b8b7ef9`-patch (single-bad-night
  demote-verzachting, uit de code verwijderd; commit blijft in historie). Reden: banner-band en plan draaiden op
  overlappende data maar verschillende logica; nu stuurt dezelfde readiness beide, en de ochtend-check-in is de hendel.
- **laag-2a (make-up-post-pass + per-dag coach + DTO-idempotentie) — VERLATEN** (`b23bdd7`): draait latent mee
  maar is verlaten t.g.v. het auto-herplannings-model (Model 2); op te ruimen in "Brok 3" (zie §Geparkeerde debts).
  Historische inhoud: make-up-adaptatie-post-pass (`applyMakeupAdaptations`,
  byte-getrouwe spiegel van `WebApp.gs:1165-1185`, idempotent via `override.from`/`madeFrom`/`claimedTarget`; target =
  strikt ná bron+vandaag, geen override/rit, state planned/rest/today, eerste-match) + per-dag coach-feedback voor
  done ÉN gemist (`buildDoneCompare` gesplitst in `buildDoneCompareFull` + wrapper; `missedCoach_` voor gemist via
  `coachFeedback_` actual=null/isMissed=true) + override-DTO-idempotentie-velden (`from?`/`src?`/`label?` —
  engine-genegeerd, round-trippen in `override_json`) + bedrading (`deriveSchemaView` krijgt
  overrides/readiness/settings; `getTrainingLibrary_(settings)` client-direct, ontwerpkeuze D1).
- **laag-2b (today-Verlicht-overlay) — GESCHRAPT:** gesubsumeerd door de band-gedreven week-demote (die verzacht
  vandaag al; `readinessAdjust_` op de al-verzachte dag hit z'n eigen "toType===type → keep"-guard → de overlay vuurt
  nooit). Als later een BEWUSTE today-hendel gewenst is, is dat de uitgestelde blast-radius-herziening (week-demote
  vandaag NIET auto-raken, Verlicht als user-keuze) — zie §Geparkeerde debts.
- **laag-3 (make-up-UI):**
  - **laag-3a — GESCHRAPT** (frame-10 rijke gemist-kaart + make-up-knop): overbodig door Model 2 (de weekgen
    herplant al automatisch); niet meer gebouwd.
  - **laag-3b — DONE** (`7060bfd`; zie het aparte laag-3b-blok bovenaan Stand). Override-dagen tonen nu
    `OverriddenDetail` + "Terug naar voorstel" (omkeerbaar) → de gedeelde fundering voor de B3-picker.

**FASE 1 (schema-flow zuivere vormgeving):** VOLLEDIG AF + visueel geverifieerd in `/preview`.

**FASE 2 (data/bron-laag, spec-gedreven, geverifieerd via `/preview` dev-fixtures):**
- **brok 1 Taper AF** (`c17a205`): `PeriodTimeline` fase-balk keyt op `fase`; Taper-activering werkt.
- **§5b GEPLAND-kaart AF** (`16cf462` + `1410013`): render terug naar proportioneel per-interval silhouet —
  component `ZoneBar` hersteld uit `c328de5^`, geometrie in de pure helper `silhouetSegments` (`schema.ts`),
  consumeert `session.blokken` `hoogtePct`. `ZoneBars` (meervoud = zone-totalen) blijft op §5c/§5d.
  VORMGEVING-SPEC §5b verduidelijkt. Fixture engine-gedreven gemaakt: de geplande dag roept
  `buildWorkout`→`toSession` aan (variant `ss_2x20`, constante `PREVIEW_FTP` 250) i.p.v. een hand-object →
  twee tempo-pieken = de echte, GAS-conforme vorm; week-aggregaten by construction uit de dag-sessions.
- **4b §2 Volume-stat AF** (`a97d869`): single-target (GAS bouwt GÉÉN range), web-only via nieuwe pure helper
  `presetHoursLabel` op `PROFIEL_PRESET_OPTIONS`; gethreaded via `ProposalWeek.profielPreset` → `view.volumeUren`;
  null/onbekend/Custom → stat weggelaten (omit-conventie). VORMGEVING-SPEC §2 gecorrigeerd (web-only
  single-target, geen range).
- **brok 2 Opbouw-pill + taper-kop-fase AF** (`859905b`): plan-mode-pill via HERGEBRUIK van de
  engine-geëxporteerde `planModeLabel_` (`phase.ts:180`) via de web-wrapper `planModusLabel` — drie labels
  "Onderhoud"/"Doel-gericht"/"Opbouw"; vervangt de hardcoded pill (engine ongemoeid). Taper-kop-bug gefixt:
  kop-regel + FASE-stat + fase-balk keyen nu ALLE op `view.fase` (`macroFaseLabel("Taper")`→"Taper"); was
  GAS-non-conform. VORMGEVING-SPEC §2 gecorrigeerd (pill = plan-mode niet macro-fase; effectieve-fase-regel
  toegevoegd; stale "Volume 4-7u"→"7u").
- **brok 3 header coachNaam + naam AF** (`fd397a2`; **EERSTE prod-deploy**): full-stack. D1-migratie `0002`
  (`coach_naam` + `naam`, nullable) + `SettingsInput` (OPTIONELE niet-engine velden, zoals `profielPreset`;
  engine leest ze niet) + GET/PUT `/api/settings` (per-veld-whitelist + 24-char-cap) + web-render. Header:
  woordmerk = `displayCoach(coachNaam)` UPPERCASE, avatar = `initials(naam)` (oranje ring; leeg → inline
  User-glyph, GEEN lucide-dep), "Week N" via `isoWeekNumber` (GAS-`isoWeek_`-port in `lib/dates.ts`).
  Settings-form: Naam-veld + sectie "Jouw coach" (coachNaam + preset-chips Coach·Daan·Merckx·Sven·Anna).
  Coach-box-kop = `displayCoach(coachNaam)` (was hardcoded "Coach"). Nieuwe helpers `lib/coach.ts`
  (`displayCoach`/`initials`). LOKAAL + **REMOTE D1 gemigreerd** (`0002 --remote`) + **GEDEPLOYD**
  (`cadans-api.dtkorteweg.workers.dev`, Version `c9729e45`). Prod-API = Basic-Auth-gated (user "daan" +
  `BASIC_AUTH_PASSWORD`) → live key-verificatie + round-trip alléén in-browser door Daan.
- **brok 4a events-editor AF** (RUN 1 backend `f08e527`; RUN 2 UI `efbb8f9`; crash-fix + GAS-layout `1b89145`;
  laatste deploy Version `8514899d`) — full-stack, gate-groen + visueel geverifieerd op de dev-server.
  - Backend (RUN 1): `EventInput`-write-DTO (`packages/shared`) + `writeEvents` repo (delete-voor-user +
    `db.batch`-insert, atomisch; lege lijst wist alles) + `PUT /api/events` met per-rij-whitelist-validatie
    (datum/naam/type/prioriteit verplicht; optioneel afstandKm/hoogtemeters/klimType/notitie; ongeldige rij →
    400 met event-index+veld, GEEN write) → `writeEvents` → `readEvents` → verse `EventItem[]`. GEEN
    D1-migratie (tabel `events` was al compleet). engine ONGEMOEID.
  - Frontend (RUN 2 + fix): standalone `/events`-route (`apps/web/src/pages/Events.tsx`, BUITEN AppShell) +
    `putEvents`-client (mirror `putPlanner`) + Instellingen-sectie 'Doelen & events' (`eventsSummary` +
    Beheren-knop) + refetch via `bumpPlannerVersion()`. Editor = GAS-getrouw (`Script.html eventsSectionHtml_`
    als meetlat): primaire rij (naam + verwijder + prioriteit-cycle-badge A→B→C + native datum), inklapbare
    Details default dicht (Type Trip/Race-segment, Klim-type Lang/Kort/Gemengd/Vlak, Afstand km, Hoogtemeters
    hm, Notitie). Nieuw-event-defaults GAS-parity: datum=vandaag (lokale delen, NIET toISOString), type=race,
    prioriteit=C, klimType=vlak.
  - Beslissing (proposal `a87f348`): FULL-REPLACE write (mirror `putPlanner`); nav-ingang via
    `/instellingen`-sectie i.p.v. een contextuele PeriodTimeline-ingang (Cadans knipt het monolithische
    GAS-settings-scherm bewust op in focus-schermen). `id` niet blootgesteld (FULL-REPLACE). Datum end-to-end
    als rauwe yyyy-MM-dd-string (geverifieerd: geen UTC-shift). Editor + round-trip geverifieerd met een
    test-event op de LOKALE dev-D1; het echte A-event op PROD nog in te voeren via de prod-editor (Version
    `8514899d`, Basic-Auth) door Daan.
  - LET OP recon-correctie: mijn eerste proposal nam aan dat GAS enkel een sheet-tab had; de GAS WEB-APP heeft
    wel degelijk een volwaardige events-editor (`Script.html :88-149`) — die is de layout-meetlat. Recons:
    `docs/FASE2-4A-EVENTS-RECON.md` (`0d16faf`) + `docs/FASE2-4A-EVENTS-PROPOSAL.md` (`a87f348`).

- **brok 5 done-zones 3→5 AF** (`6028cfd`; deploy Version `52a51ae9`) — **CLIENT-ONLY, GAS-PARITY-HERSTEL** (GEEN
  divergentie; de eerdere "3→5 divergeert zoals 4b"-aanname was FOUT). De zichtbare 5-bar-done-verdeling in GAS
  draait op de WEB-APP-fn `coachActualZoneMin_` (`WebApp.gs:728`, 5-bucket {rust,z2,tempo,drempel,anaeroob}) — NIET
  op de engine. Nieuwe pure helper `actualZone5_` (`apps/web/src/lib/schema.ts`) spiegelt 'm byte-getrouw
  (Z1→rust·Z2→z2·Z3→tempo·Z4→drempel·Z5-7→anaeroob; `secs/60` rauwe float; SS/overlay-skip; leeg→null).
  `DoneEntry.zoneMin5` NAAST de behouden 3-bucket `zoneMinutes`; ZoneBars/ZoneCompare/doneBadge/doneLabel +
  `buildDoneCompare`→`coachFeedback_` lezen nu `zoneMin5` → **Z1 (Herstel) + Z3 (Tempo) niet langer structureel
  leeg**. De engine-3-bucket (`actualZoneMinutes_`/`tryPowerZoneTimes_`) = GAS `Algorithm.gs:364/378` LOAD/DEBT,
  ONGEMOEID (GAS-parity). Recon gecorrigeerd: `docs/FASE2-5-ZONES-RECON.md` (was (b) engine-rakend op de VERKEERDE
  meetlat → nu (a) CLIENT-ONLY). Vitest +3 (`actualZone5_`). Live op prod (Basic-Auth) → done-bars in-browser door
  Daan te verifiëren.

**FASE 2 = COMPLEET** (§5b · 4b · brok 2 · brok 3 · brok 4a · brok 5 alle AF). Resteert los: 2d ritdetails +
close-out-follow-ups. Het echte A-event **Amstel Gold Race** = INGEVOERD op prod (geverifieerd in-browser;
PeriodTimeline leest 'm, ~40 wkn tot AGR).

**FASE A voortgang (deze sessie) — UI/parity-fixes op de Schema-tab + RPE-persistentie.** Alle commits op main +
CI-groen, en **GEDEPLOYD** (prod Version `171f79fc`; zie het FASE A GEDEPLOYD-blok bovenaan Stand).
- **A1 gedeeld knoppen-blok GAS-conform** (`298f3d9`): `ActionButtons` rendert onder ELKE dagkaart-state
  (§5c/§5a/gepland), niet alleen rustdag/voltooid; "Andere training kiezen" alleen op een plannbare dag
  (`dayPlannable` = dag ≥ vandaag én niet voltooid); "Push naar Garmin" van per-dag → tab-niveau
  (`GarminPushButton`, GAS Index.html:37).
- **zone-vergelijking altijd Z1-Z5** (`d1e3d5c`): `ZoneCompare` toont alle 5 zones incl. onaangeroerde (lege zone =
  gedempt "0′ · —") — **BEWUSTE afwijking** van GAS `coachZonesHtml_` (dat lege zones weglaat), zodat in één
  oogopslag zichtbaar is welke zones leeg bleven.
- **dagkaart-knoppen alleen op vandaag/toekomst** (`ae04c77`): het knoppen-blok is `dayFuture`-gated — een verleden
  dag toont GEEN beschikbaarheid-knop (niet meer te plannen); bewuste afwijking.
- **B1 beschikbaarheid-editor GAS-conform** (`8d5f892`): de vrije ‹/›-week-navigatie vervangen door 3 scope-tabs
  (Alleen deze dag / Deze week / Volgende week), afgeleide maandag; scope "dag" toont enkel de via `?dag=<datum>`
  (uit de dagkaart-knop) geselecteerde dag; save bewaart ALTIJD de hele afgeleide week.
- **A3 RPE-persistentie** — laag-1 backend (`1ab970c`): `PUT /api/rpe/:date` (RPE 1-10, `writeRpe` upsert op
  (user,datum), spiegelt checkin) + 4 round-trip-tests. laag-2 UI (`f5b3b29`): nieuwe `RpeRating` (1-10-strip op de
  done-kaart, optimistische highlight + rollback, `bumpPlannerVersion` na write); `rpeByDate` gethreaded via
  `loadSchemaWeek` → Schema → SchemaView → DoneCompareCard. De engine leest de rpe-rijen al (`readiness.ts`
  `rpeSignal_`); ENGINE ONGEMOEID.
- **FASE A RESTEREND — NU AF:** **A2 disposition** (backend `6929741` + UI `d8c70e4`) · **A4 gemist-kaart**
  (`d8c70e4`, SIMPELE versie; de rijke frame-10 `gemistDetailHtml_` volgt in/na B4). Zie het FASE A
  GEDEPLOYD-blok bovenaan Stand.

**CLOSE-OUT-LIJST / kleine follow-ups** (geen zichtbare bug op default-view):
- Twee hand-geschreven fixtures met silhouet-drift-risico: Za "Lange duurrit" (`2026-07-11`) + Wo-8
  `plannedForDone` "Drempel 3x10" (`2026-07-08`); de 3x10 zou 3 pieken tonen. Overweeg engine-gedreven te maken
  zoals de §5b-geplande dag. (Za duurrit is inherent vlak = laag risico; de 3x10 voedt de §5c-vergelijking via
  zone-TOTALEN, niet het silhouet.)
- eventDriven-synthese-naad: de web-wrapper synthetiseert `eventDriven = (macro != null)` omdat de engine
  `eventFase_` het niet emit; lichte tech-debt (drift als de engine event-driven ooit anders zou bepalen).
- coachNaam-threading via `ProposalWeek`→`view`→`SchemaView` (proposal.ts/schema.ts/SchemaView.tsx) puur voor de
  §6 coach-box-kop — lichte tech-debt (settings-string door de week-proposal-laag; spiegelt `profielPreset`).
- header-refetch loopt via AppShell-REMOUNT (`useEffect` deps `[]`, `getSettings`), GÉÉN settings-invalidatie —
  werkt omdat `/instellingen` BUITEN het AppShell-route-blok staat (return → remount → refetch). Lichte tech-debt
  als `/instellingen` ooit BINNEN het AppShell-blok komt (dan stale tot hard reload).
- **Dev-note:** start de dev-server LAN-breed voor mobiele verificatie: `wrangler dev --ip 0.0.0.0 --port 8787`
  (vanuit workers/api) → bereikbaar op `http://<PC-LAN-IP>:8787` vanaf de telefoon (i.p.v. alleen 127.0.0.1).
- plannerSignal-naamgeneralisatie: events-edits hergebruiken `bumpPlannerVersion()`/`plannerSignal` (events
  voeden dezelfde `loadSchemaWeek`→`buildWeekProposal`→PeriodTimeline-pipeline); de naam "planner" dekt nu
  breder dan planner-dagen. Geen bug (beide invalideren dezelfde pipeline); later hernoemen naar een generiek
  `schemaInputsSignal`.
- **Nazorg-noot:** brok 4a RUN 2 introduceerde per abuis `crypto.randomUUID()` als row-key (secure-context-only)
  → crash op de http-LAN-dev-server; gefixt in `1b89145` met een module-teller `nextRowKey()`. Les: geen
  `crypto.randomUUID()` in client-code die ook op een http-origin (LAN-dev) moet renderen.

**RECON-DOCS** (gepind, referentie): `FASE2-BRON-RECON.md` (`398a9e9`) · `FASE2-5B-RECON.md` (`6d2c18e`) ·
`FASE2-5B-DATA-RECON.md` (`2c7b4dc`) · `FASE2-4A-EVENTS-RECON.md` (`0d16faf`) + `-PROPOSAL.md` (`a87f348`) ·
`FASE2-5-ZONES-RECON.md` (`6028cfd`, GECORRIGEERD → (a) CLIENT-ONLY — zie BRONHIERARCHIE). Het 4b- en het
brok-2-recon waren rapport-only (geen doc).

**FOCUS VOLGENDE CHAT:** **B3-picker + B2 Trainingen-tab zijn DONE + GEDEPLOYD** (Version `3e7a3189`, prod = main t/m
`7ead6b8`; zie het FASE B-blok bovenaan Stand). De UI is nu **FUNCTIONEEL COMPLEET** op **2d ritdetails** + het
**DayStrip-venster** na. Volgende ijkpunt (Daan): **de totale review** — engine end-audit + port-correctheid-audit van
de FASE-B-fns. **De coach-stem bij een override komt DAARNA** (ONTWORPEN, niet gebouwd; zie §Geparkeerde debts).
**Data-migratie blijft het cutover-sluitstuk.** Losse dev-DX-optie (geen scope nu): een root `pnpm dev` via
`concurrently` (Vite + `wrangler dev` samen; nu twee losse processen). Het echte A-event **Amstel Gold Race** =
INGEVOERD op prod (geverifieerd in-browser).

### PARITY-FASERING (compact — vervangt een apart audit-doc; de volledige matrix is via de GAS-bron te reconen)
- **FASE B (recon-first, deels engine + sign-off):** **B2 Trainingen-tab = DONE + GEDEPLOYD** (`7ead6b8`,
  `pages/Trainingen.tsx`; bibliotheek categorie→variant→detail-slider→inplannen op de gedeelde override-machinerie) ·
  **B3 "Andere training kiezen"/day-override = DONE + GEDEPLOYD** (picker-sheet `0fac374` + gedeelde views `f48ed6b`
  op de laag-1-override-backend `bbb9767` + laag-3b-fundering) · **B4 coach-adaptatie / make-up** (engine-post-pass +
  per-dag coach = **KLAAR op main** laag-2a `b23bdd7`, VERLATEN t.g.v. Model 2; de "Verlicht vandaag"-today-overlay is
  GESCHRAPT — gesubsumeerd door de band-gedreven week-demote; de coach-stem bij een override is ONTWORPEN maar NIET
  gebouwd, zie §Geparkeerde debts). **Beschikbaarheid-editor = DONE (B1).** Werkende laag-indeling
  (laag-1/readiness/2a/2b/3) + status: zie het FASE B-blok bovenaan Stand.
- **Ritdetails-drill-down (2d):** "Bekijk ritdetails ›" is nog een `SoonButton`; te bouwen = route (intervals
  activiteit-detail: 7-zone-TIZ + metrics + intervallen) + overlay-sheet. GEEN engine.
- **FASE C:** Garmin-push. **CORRECTIE (review-chat + R0 2c):** dit is GEEN "extern device-traject" — GAS POST naar
  intervals.icu via `pushGarmin` → `pushWeb` (def WebApp.gs:1607) → `pushAllPending_` (def Sync.gs:484) →
  `buildEventPayload` (def IntervalsApi.gs:165, aangeroepen per sessie op Sync.gs:508) → `pushEvents_` (def
  IntervalsApi.gs:231, aangeroepen op Sync.gs:518). NB: `pushWorkout` (def IntervalsApi.gs:222) is DODE code (nergens
  aangeroepen, alleen een comment op Sync.gs:475) — niet porten. ZWO base64 → intervals.icu maakt de FIT → Garmin. De bouwstenen zijn GEPORT (`zwoStepFromRow_`/
  `zwoPct_`/`xmlEscape_`/`dsl*` in zones.ts), de ASSEMBLERS niet (`buildWorkoutZwo_`/`buildWorkoutDsl_`/
  `sanitizeFilename_`/`buildWorkoutDescription_`/`buildEventPayload`/`pushWorkout`); knop = `SoonButton`
  (ActionButtons.tsx:93). ZWO-route (primair) is NIET oracle-gedekt. Audit de push-keten vóór bedrading — zie
  `docs/TRAININGSMODEL-BESLUITEN.md` vondst 4.
- **EIND-AUDIT geporte engine-fns:** sluitstuk NA UI-completie (bewust uitgesteld).
- **DayStrip-venster (GAS-parity, recon af, NIET gebouwd):** venster **[-28d..+7d]** i.p.v. de huidige 1-week
  (`WebApp.gs:1103`); volgende week = preview-marker (`previewMin` uit Weekplanner+1, GEEN uitgewerkt voorstel);
  verleden = `DoneDetail` (geen gepland-vs-gedaan tenzij aanpak-B). Raakt data-window + proposal-per-dag-assembler +
  UI-scroll. Deelt de weekplan-persistentie-fundering met verleden-dispositie.
- **Watch-note — Settings-race (eenmalig waargenomen):** gelijktijdig een event aanmaken + settings opslaan liet de
  settings-write missen op prod; ná elkaar = goed. FULL-REPLACE-writes; in de gaten houden, geen fix nu.

### OPEN OBSERVATIE (verse chat)
Daan meldde "dag-wisselen nog niet hetzelfde als GAS" — DEELS geadresseerd via B1 (scope-tabs) + A1 (knoppen onder
elke state); de rest is onbekend → een verse chat moet SPECIFICEREN (welke dag-state / welk aspect) en het tegen de
GAS-bron leggen (`raw.githubusercontent.com/daanhhk/training/3e8090a/...`, zie BRONHIERARCHIE).

**ISSUE 2 (dagkaart-VOLTOOID) Fase 2a+2b + DATA-OPSCHOON Fase 1 — DONE + LIVE (deze reeks chats).**
- **2a rit-weergave** (`44ecb65` → Version `3246abc6`): `DoneEntry` uitgebreid (type/naam/zoneMinutes); een
  verleden/vandaag-dag met een gereden rit toont de VOLTOOID-kaart (naam + NL-type-label uit de dominante
  reële zone + duur + zone-bars) i.p.v. "Rustdag".
- **2b-1 horizontale zone-bars** (`c328de5` → Version `c2beed72`): de verticale `ZoneBar` + pill-`ZoneLegend`
  vervangen door één `ZoneBars` (per zone ALTIJD Z1-Z5, horizontale balk + dot + NL-label + minuten),
  design-geankerd op `coach-feedback.jsx` ZoneCompareRow. Oude componenten verwijderd.
- **2b-2 gepland-vs-gedaan-kaart** (`a184859` → **Version `b3781946`**, laatste deploy): `coachFeedback_`
  (engine, PUUR aangeroepen) → state/score/type-labels; nieuwe `DoneCompareCard`/`ZoneCompare`/`ZonePill`
  (badge-pill + titel + AlignChip + %-balk + gepland|gedaan-tabel + compare-bars). Twee dispatch-fixes:
  same-day-flip (voltooide vandaag → done-kaart; nieuwe `SchemaDay.isToday` houdt de dag-strip-markering) +
  no-plan-fallback (done zonder plan → gereduceerde kaart). Geplande workout voor done-dagen gereconstrueerd
  via `proposal.ts` `plannedForDone`.
- **2b-2-render-fix + GAS-getrouwheid** (`baa0762` → **Version `48eb51b6`**, laatste deploy): done-VANDAAG
  plan-bron-fix (P1) — `deriveSchemaView` (`apps/web/src/lib/schema.ts`) gebruikt `plannedForDone ??
  sessions[laatste]`, gerouteerd op de activity-done-staat → volle `DoneCompareCard`. Plus GAS-getrouwheid:
  P2 titel (`coachTitle_`-port: gedaan-type "<type>-rit · <duur>" ALLEEN bij state `different`/"anders", anders
  `planned.naam`), P3 %-balk verborgen bij "anders", P4 align-chip op de overline-rij (nieuw `AlignChip.tsx`).
  +1 regressietest. **STATUS done-vandaag-kaart: nog NIET visueel geverifieerd** (geen done-vandaag-dag tijdens
  de sessie) → verifieer bij de eerstvolgende voltooide training-VANDAAG op PRODUCTIE (incognito/hard refresh,
  SW-cache).
- **VERLEDEN voltooide dagen — BEWUST GEPARKEERD:** tonen de gereduceerde `DoneDetail` i.p.v. de volle
  vergelijking. Reden: de plan-bron is niet reproduceerbaar — de engine-planner leest ambient `new Date()`
  (`planner.ts:537` + kwaliteitspad-keuze `:209`), dus regeneratie vanuit een latere "vandaag" FLIPT het plan
  (WO 8: `long_z2` → `sweet_spot`), semantisch FOUT (de determinisme-guard bewees dat aanpak A fout was).
  **PRODUCTBESLISSING:** de app kijkt vooruit; geen verleden-reconstructie; een nieuwe gebruiker start zonder
  historie. Indien terugkijken later gewenst: **aanpak B** (voorgesteldType/plan PERSISTEREN bij generatie →
  werkt vooruit, dekt bestaande verleden dagen niet retroactief). NOOIT de engine-asOf-refactor (aanpak C —
  afgeblazen als overkill; C loste een niet-nagestreefd geval op). Recon: `docs/DAGKAART-DESIGN-DIFF-RECON.md`
  (GAS-meetlat, verschil-typen D/C/X/=, bug-diagnose).
- **DATA-OPSCHOON Fase 1 (D1-data, GEEN repo/code):** REMOTE D1 (`cadans`, `aa302c17…`) `settings.doel` user 1
  **VO2max → 'FTP'** (`doel_start`/`doel_duur`/`ftp` onveranderd) — verhelpt de girona-fallback in Niveau.
  LOKALE dev-D1: test-event-rij "Ardennen-trip" (id 1) VERWIJDERD — verhelpt de event-fasekaart in Schema.
  GEEN nieuw event geseed (het echte A-event **Amstel Gold Race 2027-04-18** = INGEVOERD op prod via de
  events-editor; geverifieerd in-browser, PeriodTimeline leest 'm).
- **Correctie op eerdere aanname:** de "Ardennen-trip"-vervuiling zat UITSLUITEND op de LOKALE dev-D1; de
  REMOTE was al leeg. "Girona" is een 1-op-1 uit GAS geporte constant (`niveau.ts:573`,
  `GOAL_PROFILES_.ftp`/`girona`), getriggerd door een niet-FTP-doel — GEEN CC-verzinsel. Provenance-audit:
  `docs/DATA-PROVENANCE-SCHEMA.md`.

**ISSUE 1 (dagtype-model) + PENDEL-DUUR — DONE + LIVE (deze sessie).**
- **Dagtype-model** — de Weekplanner vraagt geen dagtype meer: per dag Train? + minuten-**slider**
  (30-360, step 15) + **Pendel?-toggle**; dagtype wordt client-side AFGELEID (`deriveDagtype`: pendel >
  weekend (Za/Zo) > vrij; `recovery` NOOIT uit availability — het wellness-signal dekt dat). Commit
  `0782b1a`.
- **Schema auto-refresh** — een in-memory `plannerSignal` (bump/subscribe) laat Schema het voorstel
  herbouwen na een Weekplanner-save (puur planner-gedreven, GEEN intervals-sync); de ververs-knop
  re-derive't nu ONVOORWAARDELIJK (ontkoppeld van de sync-uitkomst). Commit `937c031`.
- **Pendel-duur = "enkele reis"** — het settings-veld toont de enkele reis; opgeslagen als retour
  (2×, `legToRoundTrip`), de engine leest de retour + splitst heen/terug (`planner.ts:1979-1980` (was `:1948-1949` bij `faed841` — juist toen, sindsdien regeldrift; `:1948` valt nu in `genericSweetSpotLong`)).
  Pendel-dag = leg+leg (bv. 75+75=150). GEEN engine/`proposal.ts`/`planner.ts`-wijziging. Commit `faed841`.
- **Live Version ID `9120970c`**; laatste main-commit = `faed841`. CI groen. Recon-docs deze chat
  (achtergrond): `BESCHIKBAARHEID-MOBILE-RECON`, `ENGINE-DAGTYPE-BRANCHES-RECON`, `DAGKAART-PENDEL-RECON`.

**INVOER-UI + SYNC LIVE (vorige sessie).** De drie data-invoer-gaten zijn gedicht + gedeployed;
remote D1 is nu GEVULD.
- **Settings-invoer** — `/instellingen` via het tandwiel in de AppShell-header; FULL-REPLACE
  `PUT /api/settings`-client + form (alle 12 `EngineSettings`-velden, incl. Geavanceerd
  hartslag/pendel/fase). Commit `d6398dd` → deploy Version `b456867a`. Telefoon-geverifieerd.
- **Schema-sync-knop** — "Werk week bij" gekoppeld aan `POST /api/sync/{activities,wellness}` (parallel
  via `Promise.allSettled`, inline-feedback; power-curve bewust NIET — Niveau laadt die via read-through).
  Commit `0abaf34` → deploy Version `6ff09e3f`. Telefoon-geverifieerd (15 activiteiten gesynct).
- **Weekplanner-invoer** — `PUT /api/planner/:monday` FULL-REPLACE (idempotente upsert op
  `(user_id, datum)`; `voorgesteldType` blijft null → client herberekent live; `gedaan`=0). Editor op
  `/weekplanner` via het kalender-icoon in de WeekLoad-kaartkop, vrije week-navigatie. Commit `2fe521a`
  → deploy Version `2a23798c`. Vitest +13.
- **Allowlist verbreed** (commit `32ac2d3`): 7 read-only allow-patronen (`echo` + `wrangler
  whoami`/`d1 list`/`d1 migrations list`, wrangler+npx). Deny-regels + `wrangler deploy`-prompt ONGEMOEID.
- **Remote D1 GEVULD** (was leeg): 15 activiteiten (user_id=1, datum-range 12-06..06-07), settings
  (FTP 280 / gewicht 75 / doel VO2max / blok-start 29-06 / 12 wk), `planner_days` huidige week ingevuld.

**EERSTE CLOUDFLARE-DEPLOY LIVE (post-deploy).** Worker `cadans-api` draait op
**https://cadans-api.dtkorteweg.workers.dev** (Version ID `bde322ec-017b-4ef2-81ba-2c03812cb18a`);
assets-binding + whole-origin basic-auth actief (username `daan` hardcoded in `src/index.ts`; auth
alleen aan als het secret staat). Auth-afdwinging objectief bevestigd: `GET /api/health` én `GET /`
zónder/foute creds → **401 + `WWW-Authenticate: Basic realm="Secure Area"`**. Remote D1 `cadans`
gemigreerd (`0000` + `0001` → **12 tabellen** live, + interne D1-tabellen). Secrets via het
Cloudflare-dashboard gezet: `BASIC_AUTH_PASSWORD`, `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`
(namen only, nooit waarden). Code deze chat (workers/api): ensure-user middleware = commit
`2cc3f23` (idempotente `INSERT OR IGNORE users(id=1)` op non-GET); whole-origin basic-auth = commit
`d96867c` (`run_worker_first` true + conditionele `basicAuth` + `ASSETS.fetch`-fallback +
`/api`-404-guard); plan-doc `docs/DEPLOY-RECON.md` = commit `87df348`. (Remote D1 was toen nog LEEG;
**inmiddels gevuld** — zie het sessie-blok hierboven.)

**SCHEMA + NIVEAU + VORM-TAB AFGEROND (GAS-niveau) — laatste UI-code-commit `f2d2fa3`, CI groen.**
Fase 0-4 klaar. Fase 5 (de PWA, `apps/web`) loopt; **Schema, Niveau én Vorm zijn nu op GAS-
conformiteit afgewerkt** (telefoon-geverifieerd). **Alle hoofd-tabs (Schema/Niveau/Vorm +
Status/Today) staan op niveau.** Alles apps/web — `packages/engine` ONGEWIJZIGD.
Code-commits deze slag (Vorm): `1a8d354` (feat: LevelCard tier-chip + tier-voortgangsbalk +
"sinds"-delta; MetricRow 3e kolom Week-TSS; nieuwe gedeelde `lib/niveau.ts` — `deriveNiveauSerie`/
`tierProgress`/`wkgSince`/`weekTss` + 10 vitest-units; Vorm.tsx fetcht activities) · `ab8ac1a`
(style: tokenize ReadinessCard/CheckinSheet/ConditiePmc) · `f2d2fa3` (fix: conditie-as "12 wk" —
verdwaalde tilde weg; ab8ac1a's perl-replace nam 10-spatie-inspringing aan terwijl de regel er 8
heeft → vervanging sloeg stil over).

**Gate-vloeren (nooit onder; bron van waarheid — NOOIT hardcoden in een prompt):**
engine-selftest `toBe(957)` (`packages/engine/src/selftest.test.ts:3668`, ongewijzigd) · vitest-totaal
**329** = het monorepo-brede `pnpm test`-totaal (root `vitest run`), NIET een per-package-slice (gegroeid t/m FASE B
laag-1/readiness/laag-2a → 268; daarna: Model-2 avoid-consecutive-hard-verificatie +2 → 270, syncStatus-units +8 →
278, redenCode-borging + coach-narrative +23 → 301, allocator-redenCode-borging +2 → 303, coachPersona round-trip +1
→ 304; FASE 3a −4 dode make-up-tests → 300; Niveau test-modus +5 → 305; laag-3b override +5 → 310; FASE B B3 RUN 1
bibliotheek +7 → 317, B3 RUN 2 `pickerState` +6 → 323, B2 RUN 1 predicaten +6 → **329**, B2 RUN 2 +0). Engine niet
aangeraakt door de coach-narrative-reeks NOCH FASE 3 NOCH FASE B (957 vast). CI groen. Hard floors — niet regresseren.

**Fundament:** IBM Plex Sans (400/500/600) + Mono (500/600), self-hosted via `@fontsource`,
offline-precached (`main.tsx`). Het UI-kader ligt vast in **`apps/web/docs/UI-KADER.md`**:
`design/src/tokens.css` ↔ `apps/web/src/styles/tokens.css` = bron van waarheid; componenten
consumeren UITSLUITEND `--s-*/--fs-*/--lh-*/--r-*` (kleur was al gedisciplineerd).

**Schema-tab — sectie-volgorde: PeriodTimeline → WeekLoad → DayStrip → dag-detail.**
- **PeriodTimeline** (periodisering-kaart): overline + kop "<NL-fase> · nog X wkn tot
  <eventNaam>" (uit de events-tabel op D1), fase-staven [Basis/Build/Peak] met de huidige
  fase gemarkeerd, Fase-stat + Tot-stat + ModeChip "Doel-gericht". Gethread uit de engine-`macro`
  in `proposal.ts`: `eventNaam`, `wekenTotEvent`, `planModus` (afgeleid).
- **WeekLoad**: 3 stats (TSS/uren/dagen gepland vs gedaan) + voortgangsbalk met `--accent-grad`.
- **Workout-detail**: proportionele SVG-staafgrafiek (`ZoneBar`; breedte ∝ minuten, hoogte via
  bucket-lookup rust 25 / z2 45 / tempo 65 / drempel 85 / anaeroob 100, kleur `--zone-1..5`) →
  `ZoneLegend`-chips → `BlockList` (tekstuele stappen) **DEFAULT INGEKLAPT**, uitklappen via klik op
  de bar/legend (toggle-`button`, `aria-expanded`/`aria-controls`). Blok-extractie in apps/web
  (`blokFromEngine`, `lib/schema.ts`); engine ongewijzigd.
- **macroFase NL** via `MACRO_FASE_NL` (Base→Basis, Recovery→Herstel; Build/Peak/Test blijven Engels
  = byte-identiek aan GAS `Doel.gs:307`). Het fase-token uit het workout-naam-suffix wordt in de UI
  gestript (`stripFaseSuffix`).
- **CoachReadinessBanner** op today (Cadans-toevoeging t.o.v. GAS — behouden).

**Niveau-tab — vier secties, alle LIVE (telefoon-geverifieerd; beide "volgt later"-stubs weg).**
- **VermogenSnapshot** + **ProgressieCard** (v1): FTP / W-kg / tier + trajectorie (W/kg·Fitheid, 1M/6M/12M/Alles).
- **Rijdersprofiel**: power-duration-curve (log-x SVG, markers 5s/1m/5m/20m/60m, key 5m/20m/60m) + stat-boxes
  (W · W/kg · maand) + type-staaf (Sprinter↔Diesel via `riderType.pos`, `(1-pos)` op de Sprinter-links-as) +
  parity-proza. Data uit **`GET /api/power-curve`** (engine `pcNormalize_`, server-side) met **90d|1y-toggle**;
  nieuwe shared-DTO **`PowerCurveResponse`** (`packages/shared`) typeert de worker-route + de client-fetch
  (`any` weg). Lokaal `power_curve_cache` leeg → nette empty-state tot een sync.
- **DoelProjectie**: 3 gap-rows (`activeGoalProfile_`+`goalGap_`, client-side geassembleerd) + uren→potentieel
  (CTL-ramp via `ctlPlateauFromVolume_`/`ctlApproachWeeks_`/`ctlAtWeek_`, SVG) + speculatieve FTP-band
  (`ftpBandFromProjection_`, gestreept, aannames uitklapbaar). Alle compute uit de engine (`niveau.ts`); UI-only.

**Vorm-tab — conformiteit-niveau, telefoon-geverifieerd (conditie-as toont "12 wk").**
- **ReadinessCard** (score + factorpaneel + check-in-regel, engine-`deriveReadiness`) · **LevelCard** (W/kg + FTP
  + **tier-chip** + **tier-voortgangsbalk** + **"+X ↑ sinds <mnd>"-delta**) · **MetricRow** (3 kolommen FTP ·
  Gewicht · **Week-TSS**) · **ConditiePmc** (PMC-variant C: 12-wk CTL/ATL + TSB-headline [variant-B-graft] +
  legenda) · CheckinSheet. StatusDeck-swipe blijft BEWUST gecut (PMC-only, geen switcher).
- LevelCard-tier/-delta + de serie komen uit de **gedeelde Niveau-bron** `lib/niveau.ts` (`deriveNiveauSerie` =
  dezelfde engine-fn-keten die Niveau.tsx gebruikt → identieke waarden).
- **Week-TSS** = kalenderweek `[maandag, maandag+7)` via `weekMondayIso` — **GAS-parity** met `actualTssByDate_`
  (Algorithm.gs:662, Monday-based; NIET trailing-7). Lege week → "—".

### Geparkeerde debts (bewust, niet nu)
- **Override-make-up-model — AFGEROND (FASE 3a, `0c954258`):** de `applyMakeupAdaptations`-post-pass +
  `makeupAdaptatie`-exposure zijn uit de code verwijderd; Model 2 (auto-herplannende weekgen) is primair. De
  laag-3a make-up-UI + make-up-knop VERVALLEN (hingen aan dit verwijderde model). De gemist-narrative is inmiddels
  zichtbaar (3b) → heroverweeg later of een aparte "frame-10 rich missed card" nog nodig is (voorlopig geparkeerd,
  waarschijnlijk niet). Zie het FASE 3-blok bovenaan Stand.
- **BlockList duplicate-React-key — AFGEROND (FASE 3a, `0c954258`):** key → blok-index (`biome-ignore
  noArrayIndexKey`, statische read-only lijst).
- **2c coach-narrative — GEMIST-kant gedaan, DONE-kant bewust NIET:** de GEMIST-narrative is nu zichtbaar (3b,
  `missedCoach_` in `GemistCard`). De DONE-kant is BEWUST NIET "warm vervangen" — de done-box toont de rijke
  engine-`coachFeedback_.narrative`. Zie het geparkeerde item "Warme persona op done = ENGINE-fase" hieronder.
- **Warme persona op done = ENGINE-fase (niet client-only) — GEPARKEERD:** de done-coach-box toont bewust de
  engine-`coachFeedback_.narrative`. Die is rijk + feiten-gedreven: gepland-vs-gereden intensiteitstype, richting
  (lichter/intensiever), sleutelsessie-ja/nee, event-relevantie én patroonherhaling (bv. herhaald
  duur-inruilen-voor-intensiteit → expliciete waarschuwing + voorstel) — de rijkste coaching-output van de app. Een
  client-only "warm vervangen" met een statische pool (zoals de planned-laag op de generieke reden) zou die duiding
  VERARMEN; de compare-tabel toont cijfers, niet de duiding. Zuivere weg = ENGINE-uitbreiding: de engine emit een
  fijnkorrelige done-`redenCode` + losse velden (plType/acType/richting/event/isKey), de client herformuleert warm —
  zoals de planned-laag werkt. Aparte fase, engine-sign-off vereist. De symmetrie "done = planned-aanpak" is
  OPPERVLAKKIG: planned-reden is generiek (vervangen = gratis), done-narrative is rijk (vervangen = verlies).
- **Niveau-tab ↔ Schema-tab doel-gereedheid-consistentie — INGELOST** (`7308d660`): de botsing verdween aan de bron.
  De Niveau-tab claimt niet langer "zo niet haalbaar" op een FTP-doel — dat was de gap-tak die daar (GAS-conform) nooit
  had mogen vuren; test-modus onderdrukt 'm nu. Schema is NIET aangeraakt.
- **FTP-projectiemodel kent geen intensiteit (ENGINE-fase) — GEPARKEERD:** `ftpBandFromProjection_` (`WebApp.gs:544`)
  hangt FTP-winst UITSLUITEND aan de CTL-delta (`gain = FTP_GAIN_PER_CTL_ 0.004 * max(0, plateau − current)`, cap
  0.08). Bij ~6u/week zit Daan al bijna op z'n volume-plafond (~47 vs 49) → +3W over 11 wkn, binnen de meetruis van een
  FTP-test. Twee gerichte sweet-spot-sessies leveren in werkelijkheid meer, maar het model ziet dat niet; de band gaat
  bovendien NOOIT omlaag (`dCtl` geclampt op ≥ 0) → 4u en 6u tonen dezelfde low. BESLISSING: NIET fixen — GAS heeft
  dezelfde beperking (geen cutover-regressie), het is een engine-wijziging met sign-off + 957-risico, en pas empirisch
  te beoordelen na weken data. Evalueren met bewijs, niet nu.
- **Design-schuld Niveau doel-projectie-card — GEPARKEERD:** de card benoemt de testdag DRIE keer ("FTP-test over ~11
  weken" / "Verwachte FTP op de testdag" / "over ~11 wkn tot testdag"). Verzamelen voor een vormgeving-pass; Cadans'
  design-standaard is GAS, dus een herontwerp = bewuste divergentie + een eigen tab-overstijgende fase, NÁ de
  inhoudelijke ronde.
- **Dag-detail-overline op een override-dag = "Gekozen" — INGELOST (FASE B, `7ead6b8`/laag-3b):** de override-dag
  toont nu "Gekozen" i.p.v. "VOORSTEL" via de gedeelde conditie `isOverrideCard` (state-ladder done > gemist > today
  laat een specifieker feit al winnen; een override is zo'n feit). GAS heeft GÉÉN state-label in de dag-kop
  (`Script.html:1050`) — dit blijft een bewuste Cadans-toevoeging. Zie divergentie (6) onderaan.
- **VOLLEDIG-SYNC-PAD ONTBREEKT (oorzaak, niet symptoom) — GEPARKEERD:** GAS heeft TWEE paden: `refreshActivities()` =
  `syncActivitiesIncremental_(7)` (top-up bij app-open, GEEN `last_sync`-stempel, `WebApp.gs:1592`) én `syncAll()` =
  volledige sync + `last_sync`-stempel, achter ↻/`regenerateWeb` (`WebApp.gs:1579-1582`) én in `generateProposal`
  (`Algorithm.gs:699`). Cadans portte alleen de top-up (`155b655`, 28d i.p.v. 7d) en VERWIJDERDE de ↻-knop → het
  syncAll-equivalent is meeverdwenen. Gevolg: `integrations/intervals.ts:88` `daysBack ?? 28` en `wellness.ts:97`
  `daysBack ?? 60` zijn de enige vensters; de client stuurt nooit een `days`-param (→ de prod-backfill hierboven moest
  handmatig via de console). FIX (advies, niet gebouwd): een "Volledige sync"-actie in Instellingen → beide routes met
  `days=365` (`parseDays` cap = 1..365). NIET de default verhogen (fire-and-forget mount).
- **Check-in auto-open NIET geport — GEPARKEERD (recon-first, eigen laagje):** GAS `maybeAutoOpenCheckin()`
  (`Script.html:1302`), aangeroepen in `onState` INITIAL-ONLY (`:56`); guard `checkinAutoOpened`, conditie
  `readiness.checkinDone === false`, `setTimeout(openCheckin, 400)`, dismissbaar. Cadans opent de CheckinSheet alleen
  via de ReadinessCard-knop. De conditie is triviaal (`getCheckin(todayISO) === null`); de klus is dat sheet + state in
  `pages/Vorm.tsx` leven terwijl je op Schema landt → vereist verhuizing naar een gedeelde laag (AppShell). **VERSTERKT
  (FASE B):** de `CheckinSheet` heeft nu een TWEEDE call-site (`pages/Trainingen.tsx` naast `pages/Vorm.tsx`) → een
  gedeelde AppShell-laag zou beide + het niet-geporte `maybeAutoOpenCheckin` dekken.
- **`nextPlannableDate` belooft `| null` maar levert dat nooit — GEPARKEERD (FASE B):** de GAS-getrouwe fallback geeft
  ALTIJD `todayISO` terug (GAS' "Geen plan-dag beschikbaar."-tak is daardoor dode code). De echte beslissing leeft nu
  op de call-site: `pages/Trainingen.tsx` guard't op `view.days.some(isDayPlannable)` vóór de write — anders zou een
  Inplannen-write stil op een afgeronde vandaag landen, waar de D2-tak 'm negeert (`!d.gedaan`). Later: de signatuur en
  de call-site-guard verenigen (fn geeft echt `null` terug → guard verhuist naar de fn).
- **Coach-stem bij een day-override — ONTWORPEN, NIET GEBOUWD (uitgesteld tot NÁ de totale review).** VERVANGT de
  oude open vraag "evalueren NÁ B3" (die is nu beantwoord: stilte is FOUT, want in GAS is verlichten een AANBOD terwijl
  Cadans automatisch demote't). Vastgelegd ontwerp: **CLIENT-ONLY, engine puur aangeroepen.** Verdict-keten =
  `workoutZones(type, doel)` → `isHard`; `readinessAdjust_({type, isHard}, band, macroFase)` → action `keep|demote` +
  code `caution_key`/`rest_key` + `toType`; `readinessEaseNaam_(toType)` → NL-alternatief. Warme copy in
  `lib/coachNarrative.ts` met een EIGEN code-namespace (botsing met plan-`redenCode`s vermijden). Surface = de
  bestaande `CoachCallout` op de dagkaart (de 3b-onderdrukking wordt daar opgeheven via `isOverrideCard`); NIET de
  picker (aparte bericht-vorm; de override is omkeerbaar via "Terug naar voorstel", dus advies achteraf is een gesloten
  lus). **GRENZEN:** alleen als de override-dag VANDAAG is (de band is de gereedheid van vandaag; GAS' `rdyCoach` is om
  dezelfde reden today-only — een toekomstige dag krijgt hooguit een neutrale regel zonder oordeel); alleen bij HARDE
  keuzes (tempo/sweet_spot/threshold/vo2max) op band caution/rest en buiten Taper/Recovery — een lange Z2 op band rest
  blijft stil want `readinessAdjust_` bewaakt intensiteit, geen volume (GAS-identiek); vrije rit stil (GAS slaat 'free'
  expliciet over; "op gevoel" is zelf al de keuze). **VALKUIL:** `readinessRegel_` NIET hergebruiken — die copy claimt
  "Ik heb je X verlicht naar Y", bij een override onwaar. **NOOT:** de override wordt NA `assignWorkouts` geswapt, dus
  de rest van de week past zich er NIET op aan (GAS net zo) — beloof dat niet in copy. Het veld `src?: "readiness"`
  staat al in `packages/shared/src/override.ts`. Hangt samen met de blast-radius-herziening.
- **Persona-pools disciplined/statistical LEEG** (fallback → warm): copy-werk voor later; de toon-ijk-voorbeelden +
  de structuur staan al in `lib/coachNarrative.ts`. De kiezer-UI toont ze als "binnenkort" (disabled).
- **Blast-radius-herziening (FASE B — benoemde kandidaat voor de "komende weken"-evaluatie):** de band-gedreven
  week-demote raakt vandaag automatisch mee; een BEWUSTE today-hendel ("Verlicht vandaag" als user-keuze) vereist dat
  de week-demote vandaag NIET auto-raakt (anders hit `readinessAdjust_` z'n "toType===type → keep"-guard en vuurt de
  overlay nooit). Dit is waar de geschrapte laag-2b heropgevat zou worden. Zie het FASE B-blok bovenaan Stand.
- **PeriodTimeline**: proportionele fase-breedtes + you-are-here-marker ontbreken (per-fase-weekduur
  zit niet in de engine-output); event-tags B/A; Volume-stat (geen CTL-/volume-target in de keten).
  Vereisen extra engine-threading.
- **Blok-copy blijft Engels** (Warmup/Over/Under/Cooldown/"lactate clearance") = parity met GAS (zit
  in engine `archetypes.ts`, GEEN GAS-vertaallaag). NL-maken = nieuwe keuze + engine-copy → eind-audit.
- **Over-under "Herstel"-blokken** erven de set-drempel-HR i.p.v. een lage herstel-HR (engine-emit) →
  eind-audit.
- **macroFase-proza** in `planner.ts:620-626`/`:680` blijft Engels (reden-string) → eind-audit.
- **Font-subsets**: `@fontsource` trekt alle subsets mee (28 woff2); versmallen naar latin(+ext) =
  kleine optimalisatie.
- **Client-side goal-assembler**: `buildGoalProfile_` (GAS-assembler) zat NIET in engine-core → client-side
  samengesteld uit `activeGoalProfile_`+`goalGap_` (`Niveau.tsx`). Eind-audit: 1-op-1 mirror van de
  GAS-assembler verifiëren.
- **DoelProjectie start-CTL op maand-granulariteit** (`ctlReeksMaandelijks_` laatste maand) i.p.v. GAS
  dag-`vorm.CTL` → de klaar-marker kan ~1 week schuiven; eind-audit.
- **riderType-proza UI-mapped**: parity-mirror van GAS `nvTypeDuiding_` (3 strings); engine levert enkel
  `{pos,label}` → parity-copy-debt, eind-audit.
- **Geen geautomatiseerde interactie-tests + geen reproduceerbare visual-check-harness** (Schema-collapse,
  DoelProjectie uren-slider, Rijdersprofiel 90d|1y-toggle): vereist jsdom + `@testing-library/react` (nieuwe deps +
  config) = aparte test-harness-klus. Uitgebreid (Niveau-reeks): de visual-checks liepen ad-hoc via een in-app browser
  (DOM-tekst + inline-screenshots), niet via een script → geen artefacten op schijf, niet herhaalbaar. Overwogen route
  = Playwright buiten de repo.
- **Debt (k) Vorm-lite INGELOST** (`1a8d354`): LevelCard tier-chip/tier-bar/"sinds"-delta + MetricRow Week-TSS
  gebouwd. Resteert onder (k): `/api/activities` server-side typing.
- **Orchestratie-duplicatie (NIEUW):** `lib/niveau.ts` wrapt dezelfde engine-fn-keten die `Niveau.tsx` inline
  draait; waarden IDENTIEK (geen bug), maar één bron is netter → `Niveau.tsx` later op de helper laten leunen.
- **`maandLabel` dubbel (R0 2c-bevinding, client-only):** `lib/niveau.ts:32` (gedeeld, geëxporteerd) én een eigen
  kopie in `components/niveau/ProgressieCard.tsx:30` die de gedeelde versie NIET importeert; ze wijken af op
  edge-cases (input zonder streepje). Later: de kopie vervangen door een import. Geen engine.
- **Token-schaal-gaten (NIEUW, cross-cutting — niet Vorm-specifiek):** er is geen `--fs-num-*`-schaal voor
  20/30/52px, en off-scale font-sizes (17.5/19/14.5/8.5), tight gaps (5/6/10) en chip/knop-padding zijn bewust
  off-scale gelaten (geen tokens verzinnen). Vraagt een aparte schaal-uitbreidings-pass die de hele app raakt.
- **Bredere debts** (detail: §Deferred debts): (g) remote-D1-drift + (m) users-bootstrap = GESLOTEN
  (deploy); OPEN: engine-`any`-cast in apps/web (a)/(l), `/api/activities` server-side typing (k),
  (d) TZ-UTC op de sync-routes (v1-geaccepteerd).

### Volgende fase (grootste gap eerst)
- **EERSTE DEPLOY — GEDAAN.** Worker + assets + remote D1 live achter whole-origin basic-auth (zie Stand).
  De twee geparkeerde deploy-debts zijn GESLOTEN: remote-D1-drift (g) + users-bootstrap (m). No-auth-exposure
  afgedekt. RESTEREND deploy-debt: (d) TZ-UTC op de sync-routes = OPEN, v1-geaccepteerd (aparte chat).
- **FOCUS (i) sync-trigger + (ii) settings-invoer + weekplanner-invoer — GEDAAN (deze sessie):** alle
  drie gebouwd + LIVE + telefoon-geverifieerd; remote D1 gevuld (zie sessie-blok bovenaan Stand).
- **ISSUE 1 (dagtype-model) — DONE + LIVE** (zie Stand): Pendel?-toggle + client-side afleiding, slider,
  Schema auto-refresh, pendel-duur enkele-reis. Bron-recons `BESCHIKBAARHEID-MOBILE-RECON` +
  `ENGINE-DAGTYPE-BRANCHES-RECON`.
- **ISSUE 2 (dagkaart-VOLTOOID) — 2a + 2b-1 + 2b-2 DONE + LIVE** (zie Stand-top). Bron-spec =
  `docs/DAGKAART-PENDEL-RECON.md` SECTIE A + `docs/DATA-PROVENANCE-SCHEMA.md`. RESTEREND: de 2b-2-render-bug,
  2c + 2d — volgorde in de fase-lijst hieronder.

### VORMGEVING-MEETLAT (bevroren)
`docs/VORMGEVING-SPEC.md` = de **BEVROREN Schema-flow vormgeving-standaard** (LIVE GAS = meetlat, app-tokens
= styling, elk veld → zijn bron [engine/settings/D1/intervals], nooit hardcoded; **≠** = data-gedwongen
afwijking). Vastgelegd uit 8 live-GAS-schermen + het instellingen-scherm; bevat een 13-punts
RECON-CHECKLIST + de faseringsvolgorde. Leidend voor de Schema-flow-bouw hieronder.

### Geparkeerde fase-lijst — SPEC-GEDREVEN (grotendeels VOLTOOID → verder in de FASE 2 BOUWPLAN bovenaan Stand)
DONE deze reeks: ~~design-diff-recon + 2b-2-render-bug-diagnose~~ (`docs/DAGKAART-DESIGN-DIFF-RECON.md`) ·
~~2b-2-render-fix (done-vandaag)~~ (`baa0762`) · ~~vormgeving-delta-recon~~ (`9ba0e1a`, `docs/VORMGEVING-DELTA-RECON.md`)
· ~~FASE 1 Schema-flow bouw (dagkaart-states + sticky nav + coach-impact 2c + §5e-knoppen)~~ (zie Stand) ·
~~FASE 2 bron-recon~~ (`398a9e9`) · ~~brok 1 Taper~~ (`c17a205`).
**RESTEREND** — volgorde in de **FASE 2 BOUWPLAN** bovenaan Stand: ~~4b Volume→uren~~ · ~~2 Opbouw-pill~~ ·
~~3 header coachNaam~~ · ~~4a events-editor~~ · ~~5 zones 3→5~~ (alle AF; brok 5 = CLIENT-ONLY parity-herstel via
`coachActualZoneMin_`-port, GEEN divergentie) · **2d ritdetails** (resteert). Losstaand blijven:
**event-activeringsdrempel** (A-event slaapt tot ~8-12 wkn; recon-first, raakt deels de engine → sign-off) ·
**weekdoel-consistentie** (stabiliteit bij dag-selecties; gat naar GAS 254). **Amstel Gold Race** = INGEVOERD op
prod (geverifieerd in-browser).
- **Op de horizon:** Garmin-workout-push (externe device-integratie, apart traject); en de read-only
  **eind-audit** van alle geporte engine-fns (sluitstuk vóór cutover — adresseert de engine/parity-debts
  hierboven). (Beschikbaarheid/weekplanning-bewerken = GEDAAN deze sessie.)

### Lokaal (miniflare `--local`, GEEN remote/deploy)
`settings` via `PUT /api/settings` = ftp 280 / gewicht 75; **244** activities + **366** wellness via
`POST /api/sync/{activities,wellness}` (cap `days=365`). `users(1)` handmatig geseed (FK; zie debt (m)).
**Demo-seed-recipe — HISTORISCH** (de "Ardennen-trip"-event-seed is in **Fase 1 VERWIJDERD**; zie Stand-top).
De seed zat UITSLUITEND op de LOKALE miniflare-D1 (nooit remote). NB: `settings.doel` mag ALLEEN een geldige
`DOEL_OPTIONS`-waarde zijn (FTP/Conditie/Beklimmingen/VO2max/Onderhoud) — een event-naam in `doel` was de oude
fout (→ girona-fallback in Niveau). Een leak-vrije demo vereist GEEN nep-event meer; het echte A-event komt via
de events-editor (fase-lijst #4). Resterend lokaal: `settings` (ftp 280 etc.) + activities/wellness + `planner_days`.

**AANDACHTSPUNT — lokale dev-D1 en remote-D1 liepen uit sync** (lokaal: Ardennen-event + doel=FTP; remote: leeg
+ doel=VO2max). NA Fase 1: **beide doel=FTP, beide geen event.** Bij verificatie ALTIJD weten of je LOKAAL
(`192.168.1.201:5173`) of PRODUCTIE (`cadans-api.dtkorteweg.workers.dev`) bekijkt — ze lezen verschillende D1's.

**Twee geparkeerde fundament-keuzes — BESLOTEN (v1):** (1) GEEN charting-lib (hand-rolled SVG). (2) pure
engine CLIENT-SIDE (TZ-veilig want de browser = Amsterdam; omzeilt de UTC-worker-blocker, debt (d)).

## Stack

- pnpm workspaces, TypeScript strict, vitest, Biome (lint+format),
  GitHub Actions CI. Node >= 22 (CI + lokaal = Node 24; pnpm 11.9 vloer).
- **packages/engine** — pure TS (geen DB/env/fetch).
- **packages/shared** — types-only HTTP-wire-DTO's (geen runtime, geen Drizzle).
- **apps/web** — Vite + React + `react-router-dom` + vite-plugin-pwa
  (PWA-shell + Vorm-lite).
- **workers/api** — Hono + Drizzle op D1 (schema + repo-laag + `/api`-routes +
  same-origin assets-binding).

## Léán scope (v1)

- **Geen auth** deze fase.
- Schema wordt **multi-user-ready** (`user_id` op elke tabel); in v1
  hardcoded op één user.

## Roadmap

| Fase | Inhoud | Status |
|---|---|---|
| 0 | monorepo-scaffold | ✓ |
| 1 | engine-transplant + SelfTest → vitest (assert-vloer in Stand, groeit mee) | ✓ |
| 2 | D1-schema / Drizzle | ✓ |
| 3a | data-access-laag (D1 ↔ engine) + TZ-conversie + Worker-integratietests | ✓ |
| 3b | intervals.icu activiteiten-sync + remote D1 (`database_id`) | ✓ |
| 3c | wellness- + power-curve-sync (engine heeft beide nodig) | ✓ |
| 4 | Worker-API (Hono routes: reads/syncs/writes) | ✓ |
| 5 | React-PWA — shell + Vorm-lite + Niveau-v1 ✓; weekgen-orkestratie geport (5.3) ✓; Schema-UI (5.3c-ii) ✓; Trainingen volgt | ◐ |
| 6 | telegram-webhook | |

## Discipline

Werkwijze-conventies staan in `docs/WERKWIJZE.md` (canoniek); wat hieronder staat is projectspecifiek.

- **Gate** = `pnpm lint + typecheck + test + build` groen ÉN CI groen.
- PR-based review.
- Forward-only migraties.
- Secrets extern (Worker-env / `wrangler secret`), NOOIT in de repo.
- HANDOFF-fetch = pinned RAW url op commit-hash.

## Data-migratie

Sheet → D1 + cutover = aparte, mens-geverifieerde stap. Blokkeert de bouw
NIET.

## Deferred debts

Open schulden die bewust naar een latere fase zijn geschoven:

- **(a) Engine type-hardening.** De engine is een getrouwe 1-op-1 port (`var`/
  `any` behouden); Biome relaxeert de port-regels (noExplicitAny, noVar-achtige,
  isFinite, ongebruikte params) enkel voor `packages/engine/**`. Een aparte pass
  scherpt de typing aan (echte interfaces i.p.v. `any`) en her-enabled de regels.
- **(b) Engine-input-seams die de Worker (Fase 3) moet vullen.** De pure engine
  krijgt zijn IO via injecteerbare seams: **check-in** (`getReadinessScore_(…,
  checkin)`), **weekplan-reader** (`gatherWeekplanEntries_(…, readWeekplan)`),
  **gewicht** (`setGewichtProvider`), en **loadCarry/mesoFactor** (nu
  geneutraliseerd op ×1). Fase 3a WIRET de **check-in**- en **weekplan**-seams
  via de repo-laag (D1). RESTEREND: **gewicht** (Worker moet `setGewichtProvider`
  aanroepen met de D1-waarde) en **loadCarry** (nog ×1) — te vullen in Fase 3b/4.
  Zie `docs/SCHEMA-PROPOSAL.md` §1.2.
- **(c) Puurheid-boundary-check in CI.** Nog toe te voegen: een mechanische
  check die faalt zodra `packages/engine` een GAS/IO-global of externe-state-
  read binnensluipt (bv. grep/lint-regel op `SpreadsheetApp`/`PropertiesService`/
  `fetch`/`process.env` in de engine). Borgt de puurheid die de vitest-gate nu
  impliciet aanneemt.
- **(d) Datum-functies TZ-expliciet — BEVESTIGDE DEPLOY-BLOCKER (Fase 3b-probe).**
  De engine leunt op ambient TZ. De workerd-TZ-probe
  (`test/workerd-tz-probe.test.ts`) toont: LOKAAL/CI honoreert workerd de
  `Europe/Amsterdam`-pin (erft de TZ-env), MAAR een gedeployde Cloudflare Worker
  draait UTC-only. Vóór het deployen van datum-gevoelige entrypoints
  (weekgeneratie): geef de engine-datum-logica een expliciete TZ-parameter i.p.v.
  ambient. Datumvrije paden (readiness) + string-round-trips zijn TZ-veilig en
  kunnen eerder deployen. **BLIJFT open (Fase 3c):** de power-curve-**dag-bucket**
  is nu TZ-expliciet via `dates.ts` (goed), maar de datum-gevoelige
  **weekgeneratie** leunt nog op ambient `Europe/Amsterdam` → moet TZ-expliciet
  vóór deploy. **VERFIJND (Fase 4):** de sync-routes + `GET /api/power-curve`
  leunen op ambient-now; de routes geven BEWUST geen `now`/`fetchImpl` door
  (productie = global fetch) → onder een gedeployde UTC-Worker schuiven de
  dag-buckets/vensters. De pure-D1-**reads én writes** zijn TZ-veilig
  (caller-supplied datums via `dates.ts`). De **weekgeneratie** is nu **CLIENT-SIDE geport**
  (Fase 5.3, `buildWeekProposal`) → TZ-veilig in de browser (Amsterdam); `mesoWeek`/`macroFase`
  lezen echter nog ambient `new Date()` (i.p.v. de geïnjecteerde `todayISO` — debt (n)). Vóór een
  SERVER-side weekgen-deploy: runtime-TZ pinnen of `now` expliciet doorgeven. **Client-side (Fase 1b):** `parseLocalDate`
  (`apps/web/src/lib/dates.ts`) is nu de ENE bron voor ISO→lokale-Date, gedeeld door
  `parseActivityRows` + de readiness-converter (nooit UTC) → een stukje client-UTC-risico
  gedicht; de server-side sync-routes blijven de openstaande UTC-blocker. **Post-deploy (v1) BEWUST
  GEACCEPTEERD:** de UTC-sync-buckets (`wellness.ts:98`, `intervals.ts:89`, `powercurve.ts:94`+`124`)
  zijn een bekende near-midnight-NL-misbucket — niet-blokkerend; fix in een aparte vervolgchat.
- **(e) D1-TEXT-datum → Date-mapping — GEDEELTELIJK OPGELOST (Fase 3a).** De
  conversielaag `workers/api/src/db/dates.ts` (`fromD1`/`toD1Date`/`toD1DateTime`)
  is geïmplementeerd + getest (incl. DST-grenzen) en wordt door de repo-laag
  gebruikt. RESTEREND: wanneer de **Worker** in Fase 4 een DATUM-gevoelig
  engine-entrypoint (weekgeneratie) in workerd aanroept, moet de workerd-runtime
  onder `Europe/Amsterdam` draaien (of de engine TZ-expliciet worden — debt (d)),
  want de engine's EIGEN datum-logica leunt nog op ambient TZ. De Fase-3a-oracle
  vermijdt dit bewust via de datumvrije readiness-seam + TZ-invariante
  string-round-trips.
- **(f) Remote D1 — OPGELOST (Fase 3b).** `database_id`
  `aa302c17-915b-44cb-8823-89c416974f50` staat in `workers/api/wrangler.jsonc`.
  Nog niet gemigreerd/geseed op remote (dat is een deploy-stap, Fase 4+); de
  lokale --local/miniflare-flow gebruikt de binding-naam, niet dit id.
- **(g) Remote-D1-migratie-drift — GESLOTEN (eerste deploy).** `0000` + `0001` zijn nu remote
  toegepast (`wrangler d1 migrations apply cadans --remote`); `migrations list --remote` = niets
  pending; de 12 in de migraties gedefinieerde tabellen zijn remote geverifieerd aanwezig. Geen drift meer.
- **(h) Wellness→readiness-afleiding — AFGEROND (Fase 1a port + Fase 1b wiring).**
  `getReadinessScore_` (engine, `readiness.ts`) verwacht AFGELEIDE input:
  `fs.{form,ctl,atl,ramp}` + `wellness.{hrvDeficit,hrvRecent,sleepAvg3,sleepLastNight}`.
  Die afleiding (HRV-deficit vs baseline, slaap-gemiddelden, form-state) is nu geport —
  `wellnessSignal_` + `formStateFromWellness_` (Fase 1a) — en client-side gewired via
  `deriveReadiness` → `getReadinessScore_` (Fase 1b). De ReadinessCard-**score** +
  waarom-factoren zijn LIVE. De check-in (`{slaap,benen,stress}`) blijft de LOSSE 4e
  param (engine-`checkinDelta` ±2, niet de design-demo-adj).
- **(i) NULL→""-conventie bij de readiness-port — NIEUW (notitie).**
  `wellnessRowsToWellValues_` dekt de ""-conventie correct voor idx0/8/9/10 (wat
  `dashVormReeks_` leest). Bij de readiness-port bevestigen dat NULL→"" óók klopt
  voor idx5/6 (readiness, mood), die vaker leeg zijn.
- **(j) Assets-binding + mount — OPGELOST IN CONFIG (Fase 5.1a).** De
  same-origin-keuze is gemaakt: `workers/api/wrangler.jsonc` heeft nu een
  `assets`-binding (Model A: `directory ../../apps/web/dist`, `binding ASSETS`,
  `not_found_handling "single-page-application"`, `run_worker_first ["/api/*"]`) →
  PWA + Worker op één origin, geen CORS nodig. RESTEREND: de echte **prod-deploy**
  is nog niet gedaan (blijft gegated door debt (d)/(g)).
- **(k) Vorm-lite deferred-onderdelen + apps/web-teststrategie — DEELS INGELOST (Fase 5.2).**
  Nog deferred in de PWA: de `LevelCard`-**tier-chip** + "sinds"-delta, de
  `MetricRow`-**Week-TSS**, en de **W/kg-over-tijd**-grafiek. (De ReadinessCard-**score**
  + waarom-factoren zijn INGELOST in **Fase 1b** — zie debt (h).) **INGELOST (5.2):** `apps/web` heeft nu test-infra (vitest
  node-project) + het `parseActivityRows`-parse-contract is vergrendeld (vitest
  **94 → 98**). RESTEREND: de bredere PWA-teststrategie (component/e2e) is nog een open
  beslispunt, en de `/api/activities`-route blijft server-side **`unknown[][]`** (nog
  niet getypeerd naar `ActivitiesResponse` — de client parset idx0 zelf).
- **(l) Twee Niveau-wrinkles — tak (1) AFGEVINKT (visuele check), tak (2) OPEN.**
  (1) ~~De Niveau-CTL uit `ctlReeksMaandelijks_(activities)` (maandbuckets, idx8=TSS) kan
  AFWIJKEN van Vorm's wellness-CTL~~ → **opgelost door de visuele check: Niveau 49 vs Vorm 50
  = granulariteits-artefact (maandbuckets vs wellness-CTL), GEEN engine-unificatie nodig.**
  (2) De engine-fns retourneren `any`
  → `apps/web` cast de resultaten (`as NiveauPoint[]` / `number|null` / `{wkg}`; en sinds
  Fase 1b `deriveReadiness` → lokaal `ReadinessResult`); een engine-shape-drift wordt
  daardoor NIET door TS in apps/web gevangen. Echte fix = de engine-returns typeren (staat
  al onder debt (a) "future typing"; raakt meerdere consumers). BLIJFT OPEN.
- **(m) users-bootstrap — GESLOTEN (commit `2cc3f23`).** `ensureUser(db, userId)` = idempotente
  `INSERT OR IGNORE users(id=1)` (`src/db/client.ts`), gedraaid door een non-GET Hono-middleware in
  `src/index.ts` → elke muterende write self-heal't de FK-rij (dekt de 3 PUT + 3 POST + toekomstige
  muterende routes). Getest: `test/routes.ensure-user.test.ts` (PUT tegen lege D1 → `users(1)` +
  settings-rij bestaan). Geen losse seed-stap meer nodig; `CURRENT_USER_ID = 1` blijft hardcoded.
- **(n) Weekgen-port: open residuen + bewuste parity-divergenties — NIEUW (Fase 5.3).**
  NIEUW open: (1) `eventCtx=undefined` in `buildWeekProposal` (`eventContextFrom_` niet geport)
  → workouts niet event-getailord; screen-free porteerbaar. (2) day-overrides/freeze niet geport
  (handmatige plan-locks; edit/write-pad → hoort bij de UI-fase). (3) `mesoWeek` + `macroFase`
  lezen ambient `new Date()` (niet de geïnjecteerde `todayISO`) — correct voor "genereer deze
  week", latente inconsistentie als `todayISO != vandaag`; verzwakt de deterministische test (die
  zette `doelStart=null`). (4) de weekplans-intent wordt geparsed uit een `unknown[]`-blob in de
  client-pipeline (verwant aan (k)/(l)). (5) debt (l) breidt uit: ook `buildWeekProposal` cast
  engine-returns naar lokale apps/web-types (TS vangt engine-shape-drift daar niet).
  **BEWUSTE parity-divergenties** (impactloos, gelogd voor de parallel-run-validatie):
  `combineSignals_` niet-muterend (GAS muteert de wellness-arg — output-equivalent, caller
  gebruikt `.signal`); `plannedTypeByDate` uit `PlannerDay.voorgesteldType` i.p.v. GAS
  `weekplan_<monday>.workoutType` (Cadans persisteert de huidige week niet mid-week; day-mirror =
  dezelfde waarde); `rollingZoneCoverage_`-venster = 8 dagen `[today-7..today]` uit "days=7"
  (GAS-misnomer, behouden); `rollingZoneCoverage_`/`zoneDebt_` missing-zone-data → `actual=0` (GAS
  sloeg over + live-refetch, niet porteerbaar); `zoneDebt_` zonder clamp (mag negatief, GAS-getrouw).
  **Gecorrigeerd (5.3c-ii):** de in `d8492b7` als "debt n / naamlek" gevlagde "[object Object]" was
  GÉÉN engine-residu — het was de apps/web `computeMacroPhase`-object-fallback in `proposal.ts` (moest
  `.fase`), gefixt in `34d10fe` + regressie-getest. Geen engine-debt.
  **FASE B — BEWUSTE GAS-DIVERGENTIES (gelogd):** (1) band-gedreven week-plan-demote (`ae00730`) — CLIENT-ONLY, engine
  + 957-selftest ongemoeid (het plan leunt op de holistische readiness-band i.p.v. de botte `wellnessSignal_`-vlag;
  zie het FASE B-blok bovenaan Stand). (2) override-DTO draagt `from`/`src`/`label`-metadata (engine-genegeerd) voor
  make-up-idempotentie + display; round-trippt in `override_json`. (3) **Picker-preview draait op de ENGINE**
  (`previewOverrideSession` → `buildOverrideWorkout_` met de dag-context `mesoWeek`/`macroFase`, `eventCtx`
  undefined) i.p.v. een port van GAS' client-side `trnScale_`. Reden: Cadans regenereert elke render, dus de dagkaart
  toont de echte engine-workout; `trnScale_` zou de preview zichtbaar laten afwijken van de kaart een tik later.
  Gevolg: GAS' bewuste bloklijst-DEGRADATIE (`zoneBlock_` met `fromSegs=true` → `blokLijstSegs_`, zone-naam +
  minuten i.p.v. de echte structuur-rijen) komt NIET mee — Cadans toont de volle structuur via het gedeelde
  `WorkoutDetail`. `trnScale_`/`overrideDotZone_` blijven ONGEPORT. (4) **Trainingen-tab toont de `ReadinessCard`,
  NIET GAS' 2-slide status/level-swipe-deck:** readiness informeert de keuze op die tab, de `LevelCard` niet (die
  stond er om de deck te vullen = layout-motief). Consistent met de al geschrapte Vorm-swipe-deck. Bijvangst: de tab
  heeft aan `loadSchemaWeek` genoeg (geen tweede activities-fetch) en kreeg de check-in gratis. (5) **"Ingepland"-
  bevestiging gebruikt `{weekday} {dayNum}`** i.p.v. GAS' 2-teken-afkorting (`trnDayKort_`) — Cadans-interne
  consistentie met de dag-detail-overline. (6) **Overline op een override-dag = "Gekozen", ook op vandaag** — de
  state-ladder done > gemist > today laat een specifieker feit al winnen van "Vandaag"; een override is zo'n feit.
  Eén gedeelde conditie `isOverrideCard` voedt zowel het label als de `OverriddenDetail`-dispatch. Hiermee is debt
  (a) "dag-detail-overline VOORSTEL boven de override-pin = tegenspraak" INGELOST.
- **(o) 5.3c-ii live-Schema-cosmetica — SYMPTOOM WEG, OORZAAK NIET (R1-C0).** De drie leaks op de live
  /dev-Schema zijn weg: (1) ~~"· null"~~ → `settings.doel='Ardennen-trip'` geseed; (2) ~~"0-0 bpm"~~ →
  `settings.lthr=178` geseed (watts klopten al, FTP 280); (3) ~~rauwe focus-bucket "low"/"high"/"anaerobic"~~
  → geprettify't via `focusLabel` (`apps/web/src/lib/schema.ts`, commit `c63d217`) naar Duur/Drempel/VO2max,
  proza-focus onveranderd. Telefoon-geverifieerd. Seed = LOKAAL (miniflare, zie seed-recipe), NIET in
  repo/remote. De `EMPTY_SETTINGS`-fallback in `loadSchemaWeek` verzacht een verse user maar raakt de
  users-bootstrap-debt (kruisverwijzing **(m)**).
  **R1-C0 herziet dit:** de seed nam het symptoom weg op één machine; de OORZAAK is dat GAS'
  `SETTINGS_DEFAULTS`-laag (`Settings.gs:72`) niet geport is. Zes van de twaalf velden lekken door naar
  zichtbare output (ftp · lthr · doel · pendelDuurMin · pendelAantal · profielPreset). Latent, niet weg: v1
  is single-user (`CURRENT_USER_ID=1`) en die ene rij is gevuld. Elke verse user reproduceert 'm. Zelfde
  stale-vorm als debt (b) in batch A.
- **(p) Fase-token nog Engels ("Build") — engine-copy, NIEUW (5.3c-ii nazorg).** De macro-fase wordt
  INGEBAKKEN in engine-strings: `packages/engine/src/planner.ts:623` (reden, "… — fase <macroFase>") én
  `:1079` (workout-naam, bv. "Z2 progressief (Build, ingekort)"). Er is GEEN discreet `macroFase`-veld op
  `ProposalDay`/`ProposalWeek`/`SchemaDay`. NL-prettify van de fase kan dus NIET UI-only (anders dan de
  focus, debt (o)): vereist een engine-copy-wijziging óf een discreet fase-veld dat de UI apart labelt.
- **(q) Engine-bpm-quirk in over-under-sets (low prio) — NIEUW (5.3c-ii nazorg).** De
  "Herstel · Easy tussen de sets"-blokken erven de set-drempel-HR (bv. 157-178 bij `lthr`=178) i.p.v. een
  lage herstel-HR. Visueel bevestigd op de telefoon. Engine-emit (geen UI-fix); parkeren tot de eind-audit.
