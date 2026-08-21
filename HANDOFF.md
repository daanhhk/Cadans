# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-21 — PUNT 34 IS VIER RONDES LANG GEMETEN EN DRIE KEER OMGEKEERD; ER IS GEEN REGEL
GEBOUWD. Docs-only: geen code op één commentaarregel na, geen engine, geen migratie, geen deploy,
geen remote-D1-mutatie. Prod en D1 staan waar het blok hieronder ze noemt.
- **DEZE RONDE WAS VOLLEDIG MEETROND.** Vier CC-rondes, alle vier read-only op de gecommitte boom
  plus read-only SELECTs op remote D1 (elke query `changed_db: false`). Er is geen enkele
  bouwbeslissing uitgevoerd; wat er ligt is een herschreven punt 34 met een bouwlijst, drie nieuwe
  punten, en drie correcties op documenten die achterliepen op de code.
- **DE DIAGNOSE IS DRIE KEER DOOR EEN METING OMGEKEERD, en dat is de kern van dit blok.** (1) De
  aanname dat de effect-uitkomst de DOSIS stuurt is onjuist: `dosisTerm` komt in `apps/web/src`
  in precies drie bestanden voor en geen ervan is `blok.ts`, `proposal.ts` of `schema.ts` — de
  trede komt uit de bewaarde rij `sync_state.dosis_trede` en de kaart hangt aan `check.uitkomst`,
  niet aan `effect`. Over 22 gemeten cellen bewoog GEEN ENKELE trede. (2) De gevreesde `gezakt`-tak
  uit de wat-als vuurt op Daans echte reeks in **0 van de 49** blokken; het meest negatieve
  blokverschil over een jaar is **−2 W** tegen een drempel van 3, omdat `blokMaximum` het maximum
  BINNEN het blok neemt en de trage decay daarmee absorbeert. (3) Symmetrie — de gelegenheid-eis
  ook voor `gestegen` — maakt **49 van de 49** blokken `niet_meetbaar` en is daarmee verworpen.
- **WAT ER WÉL STAAT, is de omgekeerde poortvolgorde.** `isStijging` wordt getoetst vóór de
  gelegenheid-poort, dus **8 van de 49** blokken lezen `gestegen` zonder enige gelegenheid — de
  blokken rond de twee sprongdagen 2026-01-13 en 2026-05-21. In een jaar waarin de meter van 291
  naar 260 watt zakte staan er 8 winst-uitspraken en 0 verlies-uitspraken. De oplossing is COPY,
  niet logica: op de tak `gestegen` splitst de tekst op de vraag of het blok een gelegenheid droeg.
- **DAANS PREMISSE OVER ROLLING FTP KLOPT, GEMETEN OP ZIJN EIGEN REEKS.** 243 activiteiten sinds
  2025-08-01, 203 met een geldige waarde (alleen `Ride` en `VirtualRide` dragen er een). 44 stappen
  omlaag van hoogstens −2 W, en precies TWEE sprongen in twaalf maanden. Drie aaneengesloten
  periodes zonder sprong, alle drie dalend: −20 W in 143 dagen, −16 W in 125 dagen, −12 W in 75
  dagen. Er staan 2 events in de database (beide 2027) en 0 test-overrides, dus `blokGelegenheid`
  geeft over de hele historie null en de tak `niet_gestegen` heeft nooit gevuurd.
- **DE CHECK VALT IN TWEE — nieuw punt 47, Daan-besluit.** IJKING (klopt mijn FTP nog, zodat de
  zones kloppen) geldt bij ELK doel, want elk plan doseert op %FTP. DOELCHECK (is dit doel
  vooruitgegaan) verschilt per doel. Bij FTP en Onderhoud vallen ze samen in de 20-minutentest;
  bij Conditie en beide klimdoelen niet.
- **GEEN TESTAANBOD ROND EEN A- OF B-EVENT — nieuw punt 48, Daan-besluit.** Een event is zelf de
  betere meting, en een 20-minuten-all-out kost twee tot drie dagen herstel — in een taper
  vernietigt dat precies wat de taper opbouwt. Eén conditie erbij in `buildTestVoorstel`; de app
  kent A en B al via `isMaximaalEvent_`. Geen prioriteitsvertakking, geen taper-uitzondering.
- **DE DOELCHECK OP DE RIT-KORREL — nieuw punt 49, en de uitkomst is GESPLITST.** Uit D1 is de
  intervalstructuur NIET af te lezen: `zone_times_json` draagt over alle 209 ritten precies 8
  totalen per zone, zonder tijdas en zonder volgorde. Uit de live fetch WEL: `GET
  /activity/{id}/intervals` is aangesloten en levert per blok label, zone, duur, %FTP en watts in
  volgorde. `ride.ts` is expliciet stateless, dus dit is een PERSISTENTIE-vraag die het D1-schema
  raakt. Eerste stap, nog niet gedaan: meten of `icu_intervals` voor Daans ritten gevuld is.
- **DRIE DOCUMENTEN LIEPEN ACHTER OP DE CODE.** De klim-splitsing en het vervallen van VO2max zijn
  GEBOUWD (punt 7), maar `DOELEN-SPEC` §6 stap 3 zei nog dat het moest gebeuren — gecorrigeerd met
  de meting als grond. Punt 35 citeerde twee regelnummers die bij de eerstvolgende commit kunnen
  liegen — vervangen door bestand plus symboolnaam. En het commentaar in
  `apps/web/src/lib/settings.ts` noemde `"Beklimmingen"` en `"Lange beklimmingen"` hetzelfde doel
  terwijl `normalizeDoel_` op Korte mapt — dat is de ENIGE code-raking van deze ronde en het is
  een commentaarregel.
- **DE CHAT HEEFT ZICHZELF TWEE KEER GECORRIGEERD OP GROND VAN EEN CC-METING, en dat hoort hier.**
  Eerst "een M55-schending die vandaag draait" — dat stond op een fixture MÉT wedstrijd, en op de
  echte data vuurt die tak nooit. Daarna de vrees dat een `gezakt`-tak vals zou vuren in de
  winterweken — 0 van de 17 winterblokken. Beide keren kwam de omkering uit een meting die CC
  leverde en niet uit een aanname. **DE ROLREGEL "DE CHAT MEET NIET ZELF" HEEFT IN DEZE EERSTE
  RONDE ONDER DE NIEUWE OPENER GEHOUDEN.**
- **WAT DAAN MERKT: NIETS AAN DE APP.** Geen enkel gedrag is gewijzigd. Wat er ligt is een
  bouwlijst waarvan de grond gemeten is in plaats van beredeneerd.
- **VLOEREN NU: vitest-totaal 986 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only.
  Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 · 35 · 47 · 48 · 49.

FOCUS VOLGENDE CHAT: PUNT 34 BOUWEN — bouwlijst (a) tot en met (e), die staat voluit bij het punt
in `docs/ROADMAP.md`. BEGIN MET EEN RECON OP `blokCheckEnabled`: wat hangt er aan die poort, en
gaan de dosis-ramp, de `mesoFactor` of een kalender-deload mee open als je hem verzet. Dat antwoord
beslist of (d) meekan. Zonder dat antwoord bouw je (a), (b), (c) en (e), en laat je (d) staan.
CONTEXT DIE NERGENS ANDERS STAAT: Daan is geopereerd en fietst zeker een maand niet; de
beschikbaarheid blijft voorlopig 0. Er komt dus GEEN nieuwe data binnen om op te meten, de
planner-week is leeg vanaf 2026-08-09, en het huidige blok sluit zonder ijkpunt. Dat is geen
defect. En terug op de fiets is een 20-minutentest het slechtste eerste ding — de test-vraag speelt
pas als hij weer rijdt. Verse chat.

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
