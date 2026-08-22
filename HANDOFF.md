# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

STAND 2026-08-22 — PUNT 34 IS GEBOUWD EN LIVE IN MAIN, MET ÉÉN UITZONDERING: (d) BLIJFT DICHT EN
ZIJN EIGEN VOORWAARDE IS WEERLEGD. Code-commit `8a95f52`, CI success. NIET GEDEPLOYD — prod en D1
staan waar het blok hieronder ze noemt.
- **WAT ER GEBOUWD IS, bouwlijst (a), (b), (c) en (e).** De doel-tak staat als een EIGEN veld
  `doelTak` op `EffectReferent` — `stijging` voor FTP, `behoud` voor Onderhoud,
  `meter_ontbreekt` voor Conditie en beide klimdoelen. De uitkomst-union is ONGEMOEID gebleven:
  `gestegen`, `niet_gestegen` en `niet_meetbaar` staan er nog precies zo. Punt 34 wijzigde de
  COPY en de KAART, niet het oordeel, en dat was de hele inzet.
- **DE TAK-KEUZE LEEST DE ENGINE EN TYPT NIETS OVER.** `doelTakVan_` haalt de rauwe doel-string
  door `normalizeDoel_` en vergelijkt tegen `DOEL_OPTIONS` zelf. Leeg, null en onbekend vallen op
  `meter_ontbreekt` — de ZWIJGENDE tak — want `normalizeDoel_` fail-opent naar FTP, en een
  fail-open naar een UITSPRAAK is verkeerd. Prijs, expliciet: een opgeslagen `"VO2max"`
  normaliseert naar diezelfde fallback en is niet van onzin te onderscheiden, dus die zwijgt ook.
  De engine draagt geen geëxporteerde alias-tabel en geen is-bekend-predicaat; er is er bewust
  ook geen nagebouwd in `apps/web`, want een tweede kopie van engine-kennis rot los van de engine.
- **DE COPY EN DE KAART.** `blokEffectRegel` kiest nu op `doelTak`, dan `uitkomst`, dan
  `gelegenheid`. Nieuw: geen oordeel als de maat ontbreekt, geen winst-claim als er niets gemeten
  is, een VLOER in plaats van winst bij Onderhoud, en geen dosis-advies waar vasthouden de
  opdracht is. In de kaart staan de pijl, de instap ÉN de kleur achter een gelegenheid-toets —
  groen is zelf een winst-claim en sprak het label "schatting" tegen.
- **DE WAT-ALS HIELD OP ALLE DRIE DE PUNTEN, en dat is de opbrengst van de vorm.** De uitkomst
  kantelde niet; de twee betwiste asserties werden groen ZONDER één letter wijziging; en
  `niet_gestegen` bleek per constructie onbereikbaar zonder gelegenheid. De vrees dat twee
  bestaande copy-varianten vandaag stuk stonden was ongegrond.
- **(d) BLIJFT DICHT, OM TWEE GRONDEN.** Ten eerste is zijn eigen voorwaarde weerlegd: er hangt
  wél iets aan `blokCheckEnabled`. De DOSIS-RAMP gaat mee — de hele schrijfweg naar
  `sync_state.dosis_trede` ligt erachter. `mesoFactor` en de kalender-deload gaan NIET mee; die
  lezen dezelfde profielvlag via hun eigen `profileForDoel_`-aanroep en zijn dus broers, geen
  afstammelingen. Ten tweede, en inhoudelijk zwaarder: de blok-check levert "geleverd maar niet
  gestegen → dosis omhoog", en dat is bij een BEHOUD-opdracht het verkeerde voorstel.
- **TWEE LEZINGEN VAN (d), MET VERSCHILLENDE STRAAL — ze stonden nergens en staan nu bij het
  punt.** De FUNCTIE verzetten raakt twee leesplekken en alleen de dosis-ramp; `mesoCyclus: false`
  omzetten op `PROFILES.onderhoud` beweegt vier consumenten, slaat alle drie de buren om naar JA,
  en is een ENGINE-wijziging met eigen autorisatie. Wie (d) opent, zegt eerst welke hij bedoelt.
- **NIEUW PUNT 50 — DE TESTBELOFTE DIE BIJ ONDERHOUD NIET INGELOST KAN WORDEN.** Gemeten buiten
  de repo-tree: doel Onderhoud zonder stijging en zonder gelegenheid geeft `behoud` plus
  `niet_meetbaar`, en die pool belooft "in een rustweek een test" terwijl `buildTestVoorstel` voor
  Onderhoud op poort (2) null geeft. Dat is de STANDAARD voor Onderhoud en geen randgeval — 0
  races en 0 test-overrides in de database. Schending van M55: een geclaimde handeling die niet
  bestaat. Staat in *De volgorde* VÓÓR 47 en 48, want die twee zijn ontwerpvragen en dit is een
  onware zin.
- **WAT DAAN MERKT.** Bij doel FTP zonder test of wedstrijd noemt de coach de stijging nog wel,
  maar schrijft hij hem niet meer aan het blok toe, en het getal is niet meer groen. Verder niets,
  want het doel staat op FTP en de andere takken raken hem vandaag niet.
- **VLOEREN NU: vitest-totaal 1007 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van de bouwronde zelf. Het
  vitest-totaal STEEG van 986 naar 1007 door 21 nieuwe tests in bestaande bestanden — dat is geen
  regressie maar dekking. De selftest-vloer is ONBEWOGEN bij een lege `git diff` op
  `packages/engine`. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 ·
  47 · 48 · 49 · 50.

FOCUS VOLGENDE CHAT: ROADMAP punt 50 — de testbelofte die bij Onderhoud niet ingelost kan worden.
Dat is het eerstvolgende open item in *De volgorde*, dus geen afwijking van de reeks. De goedkope
kant is de ZIN doel-afhankelijk maken; de dure kant is de poort, en die is bij punt 34 (d) om twee
gronden dicht gebleven. CONTEXT DIE JE MOET WETEN: Daan is geopereerd en fietst voorlopig niet, de
beschikbaarheid blijft 0, en de planner-week is leeg vanaf 2026-08-09. **Dat is geen defect.** Er
komt dus GEEN nieuwe ritdata binnen om op te meten — elke meting deze ronde draait op de bestaande
historie of op een fixture, en een ronde die nieuwe data nodig heeft kan niet. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
