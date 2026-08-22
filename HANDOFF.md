# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
