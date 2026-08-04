# Cadans — ROADMAP

Dit document draagt de RICHTING; `HANDOFF.md` draagt de STAND. Een stap wordt HIER gesloten,
niet in een chat: zolang een stap hier open staat is hij open, ongeacht wat een rapport of een
gesprek suggereert. Voorrang bij tegenspraak: `docs/WERKWIJZE.md` (werkwijze) >
`docs/DOELEN-SPEC.md` (invulling per doel) > dit document (richting). Dit document wijzigt geen
code.

## De stip — het seizoen naar AGR

De cutover is geweest; de GAS-app is verlaten en wordt niet meer als poort gevoerd.
`docs/R4-CUTOVER-VERDICT.md` en de R-serie zijn HISTORISCH: bruikbaar als vindplaats,
niet als afvinklijst.

Het einddoel is het seizoen uit `docs/DOELEN-SPEC.md` §5, en de eerste harde datum ligt
vóór het event:

- winter 2026-2027 — doel Onderhoud, weinig uren, mogelijk geen lange rit;
- half februari 2027 — de fase gaat naar Build, het doel wisselt naar korte beklimmingen;
- 17 april 2027 — A-event AGR Toerversie;
- zomer 2027 — Stelvio-week, lange klimmen.

Inhoudelijk komt alles uit op het coach-model in `DOELEN-SPEC.md` §2A: TWEE LUSSEN in
plaats van vijf losse drempels — een weeklus op het blok en een daglus op vandaag.

DE REEKS HIERONDER IS DE AFVINKLIJST. Hij voegt de stappen uit dit document samen met de
bouwvolgorde in `DOELEN-SPEC.md` §6; die paragraaf blijft de inhoudelijke onderbouwing per
doel, deze reeks draagt de volgorde en de stand. De nummering IS de bouwvolgorde. Een punt
wordt HIER gesloten, in dezelfde close-out waarin het af is.

## De reeks

Eén genummerde, afvinkbare volgorde; de nummering is de bouwvolgorde. Elke STATUS is getoetst
tegen de CODE op `4f7736f5`, niet tegen een STAND-blok in `HANDOFF.md`. Legenda: STATUS af /
deels / open · RAAKVLAK ENGINE / DATA / CLIENT. De uitgebreide onderbouwing van de gesloten
punten staat onder *Gesloten — vindplaats*.

1. **De dosis schaalt verkeerd met tijd** — af · ENGINE. Het duur-plafond bleef staan en kreeg
   een fallback erboven. Live sinds Worker `18a2b4f6`.
2. **De lange dag pakt geen kwaliteitsslot** — af · ENGINE. Quotum 3 in Base plus de
   allocator-regel (plaatsbaarheid boven draagkracht). Live sinds Worker `197257cf`.
3. **Er is geen plek waar dosis wordt vastgehouden** — af · ENGINE + DATA + CLIENT. De
   dosis-trede, migratie `0007`. Live sinds Worker `38e185df`.
4. **Het blok-object en de twee vragen** — af · CLIENT. (`DOELEN-SPEC` §6 stap 5.) `blok.ts`
   draagt blok, dosis-norm, uitvoerings-referent en blok-check; `effect.ts` de effect-referent
   op `rolling_ftp`; `testvoorstel.ts` het testaanbod. Live.
5. **Sweet spot telt niet als sleutelsessie** — af · ENGINE. `COACH_KEY_INTENTS_`
   (`coach.ts:72`) draagt nu ook `sweetspot`, en `isKey` (`coach.ts:463`) verankert aanvullend
   op het geplande TYPE, zodat het criterium ook houdt als de zone-afleiding ooit wordt
   aangesloten. Live sinds Worker `8e0f66cc`, geverifieerd op prod: MA 27-07-2026 en DI
   28-07-2026 dragen de sleutelprikkel-copy. DE EERDERE DIAGNOSE HIER WAS ONJUIST en is
   weerlegd in `docs/SWEETSPOT-SLEUTEL-RECON.md`: `plIntent` komt in de app altijd uit het
   type-label, want de client geeft de geplande segmenten niet mee. Wat NIET onder dit punt
   valt en er wél uit voortkwam, staat in punt 5b.
5b. **Het inhaalvoorstel bereikt het scherm niet** — af · CLIENT. GEBOUWD:
   `apps/web/src/lib/sleutelinhaal.ts` (`isSleutelIntent`, `sleutelPrikkelOpen`,
   `openSleutelDagen` — de sleutel-toets leest `COACH_KEY_INTENTS_` en `intentFromType_` uit de
   engine, geen eigen lijst) plus `SleutelInhaalBlok.tsx`, een feitenblok zonder knop. Twee
   call-sites in `SchemaView`: de done-tak na `DoneCompareCard` en de gemist-tak na het
   `SessieBlok`. Het dode clientveld `adapt` is vervangen door `plannedIntent` en `doneIntent`;
   de engine en de selftest-asserties op `adapt` bleven ongemoeid. Live sinds Worker `14629dd4`,
   op prod geverifieerd op MA 27-07-2026 en DI 28-07-2026: beide dragen het blok met `do 30`
   (Sweet Spot 3×8, 60 min) en `za 1` (Drempel lang 3×14, 240 min), en van de acht prod-shots
   dragen er precies twee het blok. HOE HET PUNT BINNENKWAM, en waarom het criterium onderweg is
   bijgesteld: de engine levert `adapt` bij een gemiste sleutelsessie, en de
   client zet het in het view-model (`apps/web/src/lib/schema.ts:626` en `:667`), maar geen
   enkele component leest het veld — buiten die twee schrijvers bestaat alleen de
   type-declaratie op regel 249, met een comment dat het "beschikbaar blijft voor 2c/3b". Dat
   geldt voor ÉLKE sleutelsessie, ook drempel en vo2, en dateert van vóór punt 5. Netto zegt de
   coach dat hij de sessie niet laat vallen en doet hij vervolgens geen zichtbaar voorstel.
   CRITERIUM, HERZIEN na de recon: een gemiste sleutelsessie levert een zichtbare regel die
   GEDEKT is door het actieve plan. NIET een voorstel: `adapt` draagt generieke copy over een
   ingekorte sessie die het plan niet uitvoert, en is bovendien geen sleutel-signaal — drie van
   de vijf takken die het veld vullen horen bij een endurance-ruil. GEMETEN dat het plan al
   herschikt (het quotum telt gereden harde dagen, gemiste niet): in 20 van de 23 gemeten
   cellen draagt het restplan nog minstens één sleutelsessie, in 3 is de week op. De regel toont
   dus waar de prikkel deze week nog staat, of meldt eerlijk dat er geen dag meer over is. De
   ONTWERPVRAAG naar samenvallen met de week-inhaal-kaart is BEANTWOORD: die kaart kon niet
   verschijnen en is in punt 5c OPGERUIMD, dus deze bouw introduceerde geen tweede stem. LET OP,
   GEWIJZIGD DOOR 5c: de week-tekort-vraag zelf is niet vervallen maar bij punt 10 belegd — dit
   dagkaart-blok beantwoordt hem niet. Recon:
   `docs/INHAAL-5B-RECON.md`.
5c. **De week-inhaal-kaart kan niet verschijnen** — af (OPGERUIMD) · CLIENT + WORKER. Het
   mechanisme is verwijderd in plaats van gerepareerd; dat is de tweede tak van het criterium.
   DRIE onafhankelijke doodsoorzaken, alle gemeten: de `catchup_*`-codes zijn onbereikbaar
   zodra de allocator actief is; `debtPreferredType_` kiest de grootste bucket en dat is altijd
   `low` (nul van 88 geplande sessies draagt meer high plus anaeroob dan low), dus de arm
   levert `long_z2` en zijn eigen guard blokkeert hem; en de debt rekent in de door punt 6
   vervangen 3-bucket-munt, waarin een grijze en een scherpe rit een identieke debt geven.
   DOORSLAGGEVEND was niet de doodheid maar de UITKOMST: over 72 cellen levert de wat-als-run
   in 60 MINDER high plus anaerobe intentminuten dan het actieve plan, in 12 meer, in nul
   gelijk. Repareren zou de coach een gemiste intensiteitsprikkel laten inhalen met een
   lichtere week. De ENGINE is niet geraakt en er is geen migratie; de kolom
   `sync_state.debt_opt_in_week` blijft staan. Begrenzingsbewijs: 40 van 40 harness-shots
   byte-identiek. Live sinds Worker `8cde1d3d`. Verdict: `docs/INHAAL-5C-VERDICT.md`.
   DE WEEK-TEKORT-VRAAG ZELF IS NIET VERVALLEN — die is naar punt 10 verhuisd.
6. **De dosis-munt per zone** — KLAAR (fase 1a én fase 2) · CLIENT + DATA. Live op Worker
   `e2069ca1`. Fase 1a en 1b: `weekKwaliteitMinuten` vouwt per zone, `blokDosisNorm` haalt zijn
   vorm uit `bibliotheekSignatuur`, en het oordeel is per zone zonder compensatie tussen zones.
   FASE 2, DE ZONE-SYNC: `syncActivities` leidt de grenzen af uit de nieuwste fiets-rit met een
   bruikbare `icu_power_zones` en schrijft ze naar `sync_state.power_zones_json` (migratie
   `0008_sleepy_gladiator.sql`, remote toegepast); `GET /api/power-zones` → `loadSchemaWeek` →
   één `zone5Grenzen(powerZonesRow)` → `buildBlokReview` én `buildBlokReferent`. Geen tweede
   endpoint, geen extra sync-route, geen vierde schrijfactie per pageload. De twee vooraf-eisen
   zijn gedaan: de fixtures leiden hun vorm nu af via `signatuurSeconden` en asserteren hun eigen
   poort, en de shot-harness seedt `weekUren` plus een blokweek per scenario. GEMETEN dat het bij
   Daan gedragsneutraal is — zijn eerste vier grenzen ZIJN `ZONE5_GRENZEN_DEFAULT`, lokaal 48 van
   48 shots byte-identiek, en op prod noemt de blok-kaart na de deploy dezelfde getallen als
   ervoor. Bouwdoc: `docs/ZONE-SYNC-BOUWDOC.md`. Fase 3 (de week-baan) is daar VOORWAARDELIJK en
   staat niet in deze reeks.
7. **De doel-lijst klopt niet** — af · ENGINE + CLIENT. (`DOELEN-SPEC` §6 stap 3.) SPEC:
   `docs/DOEL-LIJST-RECON.md`. `DOEL_OPTIONS` (`phase.ts`) draagt nu FTP, Conditie, Korte
   beklimmingen, Lange beklimmingen en Onderhoud; `PROFILES.klim` en `PROFILES.vo2max` zijn
   vervangen door `klim_kort` (vo2-geleid, Base-quotum 3) en `klim_lang` (de voortzetting,
   drempel-geleid). VO2max is geen doel meer maar blijft MIDDEL: `vo2Pools_` en de archetypes
   staan er nog, de doel-bibliotheek `workoutForVo2max` is weg. `normalizeDoel_` is de ENIGE
   plek waar een doel-string canoniek wordt — nodig omdat `settings.doel` vrije tekst in D1 is
   en de worker hem niet valideert. `climbTypeWorkout_` is verwijderd: GEMETEN over alle 15
   combinaties levert `goalWorkout_` vanaf 33 minuten een kandidaat, dus de tak kon alleen nog
   vuren bij 32 minuten of korter, en gaf daar het klimTYPE van het event voorrang op het DOEL
   van de gebruiker. Bouw in `b04d73c` en `626bdd5`. HARDE DATUM half februari 2027 gehaald.
8. **De meetlat kent maar twee doelen** — af · ENGINE plus CLIENT. SPEC:
   `docs/DOEL-LIJST-RECON.md` §8 plus het correctieblok van 31-07-2026 daaronder, waar de
   onderbouwing van de 5 procent en de invoer-vondst staan. `GOAL_PROFILES_` draagt nu vijf
   latten in plaats van twee: `girona` is `klim_lang` geworden met ongewijzigde dims,
   `klim_kort` erft die met longRideH 5,0, `conditie` zonder de klim-dim, `ftp` ongemoeid, en
   `onderhoud` draagt één AFGELEIDE behoud-vloer van 95 procent van de rollende FTP vlak vóór
   `settings.doelStart`. Daarvoor kwam een VIERDE meetgrootheid `rollingFtpW`: de vloer komt
   uit de ritten, terwijl `ftpWkg` op de handmatig ingestelde `settings.ftp` staat — dezelfde
   grootheid aan beide kanten, anders staat de kaart de hele periode groen op een ingetypt
   getal. `activeGoalProfile_` gaat door `normalizeDoel_`, `projectieKey` is verwijderd en één
   selftest-invariant houdt de sleutels van `PROFILES` en `GOAL_PROFILES_` gelijk. Bouw in
   `3651fc1`. VISUEEL BEVESTIGD OP PROD op 2 augustus 2026, Worker Version `1f8ec371`: de kaart
   toont "DOEL-GEREEDHEID · FTP" met "opbouw naar FTP-test", niet de girona-lat. Daarmee is de
   check die sinds 31-07-2026 openstond gedaan.
9. **Het doel stuurt de periodisering niet** — af · ENGINE plus CLIENT plus DATA. GEMETEN met AGR op 17-04-2027,
   identiek voor doel FTP, Onderhoud en Beklimmingen: Base t/m 2027-02-15, Build vanaf
   2027-02-22, Peak vanaf 2027-03-22, Taper vanaf 2027-04-12. De fase komt volledig uit de
   event-teller. Wat het doel wél stuurt is het quotum binnen die fase (Base: FTP 3, Onderhoud
   3, Beklimmingen 2). Inclusief EVENT als doel-optie, zodat de overname een keuze is in
   plaats van een aftelling. CRITERIUM: het doel stuurt de fase, en de event-overname is een
   VOORSTEL. Raakt `DOELEN-SPEC`.
   BEVINDING UIT PUNT 7, GEMETEN OP `626bdd5` — HET VO2-GEWICHT VAN `klim_lang` VUURT NOOIT.
   Sweep in fase Build over zeven weekvormen van 3,0 tot 14,0 uur: de anaerobe intentminuten
   zijn zeven keer NUL, terwijl high oploopt van 64 naar 122. De oorzaak zit in het
   FASE-mechanisme, niet in het profiel: buiten Base bestaat er geen volume-ramp
   (`volumeModulatie` geeft dan nul), en 0,15 plus de coverage-boost 0,10 haalt drempel 0,50
   per constructie nooit. De UITKOMST is `DOELEN-SPEC` §3.4-conform — dat doel wil aanhoudende
   blokken, geen intervallen. Wat ontbreekt is een pad waarlangs die term ooit bewijs kan
   dragen; zolang dat er niet is, is `intentGewichten.vo2` op `klim_lang` in de praktijk alleen
   een som-normalisator. NIET repareren in het profiel — het hoort hier, bij het fase-besluit.
   BEVINDING UIT PUNT 7, ZELFDE REEKS — DE ANAEROBE DALING VAN `klim_kort` BOVEN 10 UUR IS
   ONVERKLAARD. Gemeten anaeroob 8 · 8 · 14 · 20 · 20 · 14 · 14 en high 46 · 46 · 51 · 51 · 51
   · 51 · 51. Het high-PLATEAU vanaf 6,0 uur is verwacht: het quotum kapt op drie
   kwaliteitsdagen en de extra uren gaan naar Z2. De DALING van 20 naar 14 boven 10 uur is dat
   niet — meer volume levert dan MINDER scherpte, en dat bij het doel dat op AGR mikt. Nog niet
   herleid tot een mechanisme; eerst meten, niet repareren.
   GEMETEN 31-07-2026 op `8ffbd27`, gebundelde engine, TZ=Europe/Amsterdam, de keten
   `eventFase_` naar `computeMacroPhase` naar `effectiveMacroFase_` over 38 maandagen van
   2026-08-03 tot en met 2027-04-19, voor alle vijf doelen, met en zonder event.
   MET EVENT leveren alle vijf doelen op elke maandag DEZELFDE fase: Base tot en met 2027-02-15,
   Build vanaf 2027-02-22, Peak vanaf 2027-03-22, Taper vanaf 2027-04-12. Dat breidt de eerdere
   meting van drie naar vijf doelen uit.
   ZONDER EVENT IS DE TERUGVAL GEEN CYCLUS MAAR EEN AFLOPENDE TELLER. `computeMacroPhase` staat
   vanaf blokweek 12 — bij `doelStart` 2026-06-29 dus vanaf 2026-09-13 — VOORGOED op "Test", en dat
   geldt voor vier van de vijf doelen. Alleen Onderhoud ontsnapt, doordat `effectiveMacroFase_` dat
   doel naar Base terugzet; dat is vandaag de ENIGE doel-naar-fase-hendel die bestaat.
   DE GEVOLGSCHADE VAN "Test" IS IN DE PLANNER GELEZEN, NIET AANGENOMEN. `kwaliteitPerWeek` draagt
   geen `Test`-sleutel, dus `planner.ts:227` levert quotum 0, en `planner.ts:639` zet de week op
   testweek. Het commentaar op `planner.ts:90` noemt dat zelf als reden voor het `fase !== "Test"`
   -vangnet, en `faseOvergang.ts:96` onderdrukt de aankondiging van die fase als tellerartefact.
   GEVOLG VOOR DE BOUW: het criterium is NIET te leveren door de poort in `effectiveMacroFase_` te
   verbreden. Zolang de terugval na twaalf weken doodloopt, levert verbreden een permanente
   testweek met quotum 0. Het blok moet HERHALEN. De norm staat nu in `DOELEN-SPEC` paragraaf 2B.
   BOUW IN TWEE FASES met een stop ertussen. Fase A, ENGINE: het doel-blok laten herhalen en de
   poort verbreden van "alleen Onderhoud, alleen zonder event" naar "elk doel, tot de
   acht-wekengrens", via `normalizeDoel_`. Fase B, CLIENT plus DATA: de overname-kaart als voorstel
   met een afwijs-tik, persistentie naar het model van `fatigue_shift` en de dosis-trede.
   CORRECTIE 31-07-2026: de vier fase-grensdatums hierboven stonden een dag te vroeg — het waren
   zondagen. Oorzaak lag in het meetscript van de chat, dat lokale middernacht als UTC printte, niet
   in de engine. De maandagen hierboven zijn de gemeten waarden uit de bouwronde.
   GEVONDEN TIJDENS FASE A, en het zat er al: `computeMacroPhase` telde dagen met `Math.floor` over
   het millisecondenverschil van twee lokale middernachten. Kruist dat verschil de zomertijdgrens
   van eind maart, dan is het een uur te kort en verdwijnt een hele dag, waardoor het blok een week
   te laat kantelt. Dat raakt precies het scenario van paragraaf 5: een blok dat in de winter start
   en na eind maart doorloopt. Rechtgezet naar `Math.round`, gelijk aan phase.ts:149, phase.ts:170,
   planner.ts:307 en niveau.ts:844.
   DE DAGTELLER-BUG STOND NIET OP ZICHZELF; EEN RECON VOND VIER PLEKKEN. Naast `computeMacroPhase`
   droegen `weekIndexFromStart_` (planner.ts), zijn client-spiegel `blokWeekVanWeek` (blok.ts) en
   `daysToTaper` aan beide kanten (planner.ts en proposal.ts) hetzelfde patroon: floor over een
   vaste dag- of weekconstante, dus een dag te weinig na de voorjaarssprong.
   DE INVARIANT IS DE WEEKINDEX, NIET DE BLOKWEEK. Alle tellers tellen weken sinds `doelStart`, maar
   mappen die index op verschillende cycli: `computeMacroPhase` op 12, `blokWeekVanWeek` op
   `BLOK_WEKEN` = 4 (de 3:1-mesocyclus). Door alleen `computeMacroPhase` recht te zetten schoof de
   macrofase na de sprong een week op terwijl mesocyclus en variant-rotatie achterbleven — de deload
   landde dan in de verkeerde week ten opzichte van de fase. Daar staat nu een assertie op die de
   ABSOLUTE week uit beide tellers vergelijkt.
   `daysToTaper` IS EEN ANDERE FOUTMODE. Een dag te weinig schuift de grens `<= 7 + venster` op,
   waardoor de kalender-deload wordt onderdrukt in een week waar dat niet hoort. GEMETEN: AGR raakt
   dit NIET — de taperbeslissing gebruikt weekmaandagen vanaf 2027-03-29 en de sprong is 2027-03-28,
   dus er wordt niets gekruist. Bereikbaar is een event begin april met een weekmaandag nominaal 15
   dagen vóór de taperdatum, met de sprong ertussen.
   AANVULLING UIT DE BOUW, GEMETEN: die grens is via `buildWeekProposal` ONBEREIKBAAR. `taperEvent`
   bestaat alleen als het hoofdevent binnen `A_TAPER_DAGEN` = 7 dagen van VANDAAG ligt, en de
   weekmaandag ligt hoogstens 6 dagen vóór vandaag, dus `daysToTaper` komt niet boven 13 terwijl de
   grens op 14 ligt. De client-fix is daarmee een CONSISTENTIE-reparatie — hij houdt de claim
   "EXACT de engine-logica" waar — en is client-zijde niet rood te krijgen. In de engine, waar
   `assignWorkouts` een willekeurige taperCtx accepteert, is de grens wél bereikbaar en staat er wel
   een rood-test op.
   ALLE VIER STAAN NU OP HETZELFDE PATROON: `Math.round` op het DAGverschil, daarna pas delen. Round
   op het WEEKquotiënt is expliciet fout bij een doel-start midden in de week; daar staat een
   assertie op.
   OPEN NA FASE A, hoort bij fase B: de maandag na het hoofdevent levert de doel-cyclus weer Build,
   zonder herstelweek. De vraag om een nieuw doel na het event en het herstel daarna zijn hetzelfde
   gat en worden samen opgelost. Tweede punt voor fase B: de tak `=== "Onderhoud"` in
   `effectiveMacroFase_` vergelijkt op een UI-string; die hoort op de profiel-id te vergelijken,
   zodat `normalizeDoel_` daar draagt in plaats van meeloopt.
   AF PER 01-08-2026, FASE B GEBOUWD IN `0c9f32a` EN LIVE op Worker `be15bb67`. De overname is
   een VOORSTEL geworden: `effectiveMacroFase_` draagt een vijfde `overnameBevestigd` en het
   ingestelde doel blijft sturen tot Daan bevestigt. Spec: `docs/EVENT-OVERNAME-BOUWDOC.md`.
   De vier open punten van fase A zijn hiermee afgehandeld. Het VIERDE — is de 15-dagen-grens in
   `daysToTaper` via de echte aanroepketen bereikbaar? — is GEMETEN en gesloten: over 8556 runs
   van `buildWeekProposal` haalt de engine-tak bereik −1..7 en de client-tak 1..13, tegen een
   grens van 14, dus NUL treffers aan beide kanten. ONBEREIKBAAR; geen bouw nodig, de
   `Math.round`-correctie blijft als consistentie-reparatie staan. Het DERDE — de Onderhoud-tak
   die op een UI-string vergeleek — is gesloten: die takt nu op
   `profileForDoel_(...).id === "onderhoud"`. Het TWEEDE — na het event volgt geen herstel — is
   VERPLAATST naar het nieuwe punt 13 en staat hier dus niet meer open. De gemeten bevindingen
   hierboven blijven staan als vindplaats.
10. **Twee kaarten spreken los over hetzelfde blok** — open (FASE A en FASE B DEEL 1 af) · CLIENT, plus mogelijk
    ENGINE voor fase B. (`DOELEN-SPEC` §6 stap
    7.) De doortrain-kaart en de terugblik lezen hetzelfde ΔCTL-signaal en doen er elk een
    eigen uitspraak over. CRITERIUM: een blok krijgt ÉÉN uitspraak, niet twee. DIT PUNT DRAAGT
    SINDS 5c OOK DE WEEK-TEKORT-VRAAG: wat de coach zegt als een week zijn dosis niet levert.
    Die stem is er nu niet — de losse inhaal-kaart is opgeruimd omdat hij niet kon verschijnen
    en, waar hij wél beet, een lichtere week voorstelde. Voorwaarde voor de nieuwe vorm: het
    tekort wordt PER ZONE geteld, in de munt van punt 6, niet in de 3-bucket-vouwing die
    tempo van drempel niet kan onderscheiden. `DOELEN-SPEC` §2A rekent de inhaal-kaart al tot
    de uitingen van de weeklus, dus dit is geen uitbreiding maar het inlossen daarvan.
    FASE B DEEL 1 IS AF PER 01-08-2026, gebouwd in `130ab6c` met nalevering `cd194d9`, spec
    `docs/PUNT10-FASE-B-BOUWDOC.md`. De WEEK heeft nu een stem, en alleen als er iets weg is: een
    verstreken sleutelprikkel én geen trainingsdag meer om hem op te pakken. Hij meet tegen het
    BEVROREN plan van de verstreken dagen, niet tegen de blok-norm — GEMETEN dat het plan die norm
    zelf in 2 van de 105 cellen haalt en op de echte reeks in 3 van de 46 weken, want norm en
    weekplan gaan door dezelfde vouwing maar over een andere populatie. HET PUNT BLIJFT OPEN VOOR
    DEEL 2: het aanbod "verschuif de minuten naar Drempel" raakt de allocator en is dus ENGINE,
    met eigen autorisatie en eerst een wat-als-meting (de 5c-les).
    FASE A IS AF PER 01-08-2026, gebouwd in `58e12aa`, spec `docs/PUNT10-FASE-A-BOUWDOC.md`. De
    doortrain-kaart doet geen eigen uitspraak meer over het blok: de TERUGBLIK is de enige stem en
    het aanbod hangt eronder als weekvraag. Het aanbod zelf — mesoweek 4 naar 1 — is ongewijzigd.
    DE METINGEN DIE DAT DROEGEN. In blokweek 4 is het anker van beide kaarten IDENTIEK, dus ze
    lazen daar letterlijk hetzelfde getal. Over de reeks uit `docs/DOORTRAIN-KAART-RECON.md` §4:
    17 blokweek-4-maandagen, waarvan 7 door de ΔCTL-poort van het UP-aanbod komen terwijl de
    terugblik rendert. En de tegenspraak is GEMETEN, niet aangenomen: op 2026-07-20 (blokweek 4,
    ΔCTL −4,9) stond "Je trainde dit blok genoeg, maar niet waar het telt: Drempel bleef onder
    norm" naast "het blok heeft je niet belast".
    WAT FASE B NOG DRAAGT: de WEEK-TEKORT-STEM per zone, plus het aanbod "verschuif deze week de
    minuten naar Drempel". Dat tweede raakt de ALLOCATOR en wordt daarmee ENGINE in plaats van
    client, met eigen autorisatie. Nog open, ook uit fase A: in blokweek 1 lopen de twee
    ΔCTL-VENSTERS uiteen — anker weekmaandag tegenover maandag min zeven, op een golvende reeks
    tot 11,2 uit elkaar en van teken verschillend. De DOWN-tak vuurde op de gemeten reeks nul
    keer, dus het is genoteerd en niet gebouwd.
11. **De duurvermogen-meetlat** — deels · DATA + CLIENT. (`DOELEN-SPEC` §6 stap 4.) De helft
    die prikkel-in-de-rit heet is met punt 1 gedicht: een dag boven de bibliotheekband krijgt
    een sjabloon, en `combo_long_with_efforts` vuurt in Build en Peak voor het klimprofiel. De
    MEETLAT bestaat niet: 20-minutenvermogen na 15 kJ/kg als percentage van vers is nergens
    afgeleid; `arbeidKj` bestaat uitsluitend als weergave per rit (`RideDetailSheet.tsx`).
    Draagt óók de effect-meter van het doel korte beklimmingen dat punt 7 aanmaakt:
    `DOELEN-SPEC` §3.3 en §3.5 wijzen daarvoor dezelfde maat aan. Niet te verwarren met punt
    8 — dat gaat over het goal-profiel in de Niveau-tab, niet over deze durability-maat.
12. **Doel-passendheid** — open · CLIENT. (`DOELEN-SPEC` §6 stap 6.) De coach stelt een passend
    doel voor als het ingestelde doel niet binnen de uren past; afwijsbaar, hoogstens één keer
    per blok op een blokgrens. GEMETEN: er bestaat vandaag geen enkel mechanisme. Hangt aan
    punt 4 (af) en aan punt 7 — zonder herziene doel-lijst wijst een voorstel naar de
    verkeerde doelen.

13. **Na het event volgt geen herstel** — open · ENGINE plus CLIENT. De maandag ná de raceweek
    levert de doel-cyclus weer een opbouwfase: de `Recovery`-tak van `eventFase_` kijkt alleen
    binnen de HUIDIGE week, dus zodra de race in de vorige week ligt is er geen herstel meer.
    GEMETEN met AGR op 2027-04-17: op maandag 2027-04-19 geeft de keten "Build". Er staat een
    assertie op die de huidige toestand PINT en expliciet NIET beweert dat hij goed is.
    DRAAGT ÓÓK DE VRAAG OM EEN NIEUW DOEL na het event: een blok dat op een event eindigt laat de
    gebruiker daarna zonder richting achter, en dat is hetzelfde gat — het herstel en de nieuwe
    doelvraag horen in één kaart en worden samen opgelost. Kwam binnen tijdens punt 9 fase B,
    waar de bevestigingspoort aanvankelijk óók over `Recovery` lag. Raakt `DOELEN-SPEC`.
14. **De anaeroob-term van de per-zone-norm** — af · CLIENT. De norm vraagt
    anaerobe minuten die het plan nauwelijks of niet programmeert, dus de blok-terugblik kan
    "niet geleverd" zeggen over een blok dat EXACT volgens plan is gereden. GEMETEN over 21 cellen
    (7 weekvormen x 3 doelen), drie opbouwweken met recency-rotatie: het plan haalt nooit minder
    dan 2 van de 3 zones op norm en 3 van 3 in precies 1 cel; de zakker is ANAEROOB in 15 en tempo
    in 6, en drempel zakt NUL keer. Bij doel Onderhoud programmeert het plan 0 anaerobe minuten
    tegen een blok-norm van 30, in 6 van de 6 cellen. PREDICAAT: gemeten op de leeg-gevoede
    weekvorm-as, niet op de levende D1. DE VRAAG DIE DIT PUNT MOET BESLECHTEN: is de norm-VORM
    fout — hij is afgeleid over de HELE bibliotheek terwijl `GOAL_FASE_MOD_` in Base en het
    onderhoud-profiel vo2 juist onderdrukken — of hoort Onderhoud anaeroob werk te programmeren.
    Eerst meten, dan bouwen; een van beide antwoorden verplaatst werk naar de engine. Kwam binnen
    als M3 bij punt 10 fase B (`docs/PUNT10-FASE-B-BOUWDOC.md` §1 en §6) en is daar bewust buiten
    scope gehouden. GAAT VÓÓR de rest van de reeks: een doelwissel naar Onderhoud kan er binnen
    weken zijn. Raakt `DOELEN-SPEC`.
    FASE 1 IS AF, spec `docs/PUNT14-BOUWDOC.md`. De blok-terugblik oordeelt voortaan alleen op de
    zones waarvan het plan van díé week het nominale label voorschreef; de NORM houdt zijn schaal
    en zijn vorm, `blokDosisNorm` is niet geraakt. GEMETEN dat herwegen niet helpt: vier
    norm-vormen — bibliotheek-breed, doel-gewogen, doel-plus-fase-gewogen, en exact de twee
    geroteerde intents — leveren alle vier 1 van de 35 cellen op norm. Mét de poort leest een
    exact volgens plan gereden week als geleverd in 22 van de 35.
    FASE 2 IS GESLOTEN ZONDER BOUW, verdict `docs/PUNT14-FASE2-VERDICT.md`. De wat-als — de rotatie
    ontwijkt de laatste TWEE intents, zodat de derde soort gegarandeerd aan de beurt komt — maakt de
    week op ELKE gemeten weekvorm zwakker: bij Onderhoud 87 naar 71, 102 naar 80, 102 naar 71, 87
    naar 71, 80 naar 65, 87 naar 71 en 90 naar 80 kwaliteitsminuten, met de kwaliteitsdagen
    onveranderd op 3. En hij KEERT HET OORDEEL OM: het plan gaat een anaeroob-label dragen in 7 van
    de 7, dus anaeroob doet mee aan de poort van fase 1 en haalt zijn norm in 2 van de 7 — een exact
    volgens plan gereden week leest van 7 van 7 geleverd naar 0 van 7. Dat is het defect van fase 1,
    opnieuw binnengehaald langs de plan-kant. TWEE PREMISSEN UIT FASE 1 ZIJN GECORRIGEERD: de
    gewichten SORTEREN en verdelen niet, dus "vo2 0,20 is een prikkel per twee weken" volgt nergens
    uit het mechanisme; en de derde soort is niet per constructie onbereikbaar — bij Onderhoud in
    Peak levert de week drempel, sweetspot en vo2, doordat de coverage-boost van kant wisselt zodra
    high gedekt is. De vo2-declaratie van `PROFILES.onderhoud` blijft staan: in Peak scoort ze 0,35
    en komt ze aantoonbaar aan de beurt. WAT ONGEMETEN BLIJFT is de vorm die TOEVOEGT in plaats van
    ruilt; die staat als punt 16.
15. **De dosis van de twee klim-doelen** — af · ENGINE plus CLIENT plus norm. Ook mét de zone-poort van punt 14 zakken
    ze: Korte beklimmingen levert 39 werkminuten en Lange beklimmingen 46, tegen een norm van 84.
    Dat is een DOSIS-vraag en geen verdelings-vraag — de zones kloppen, er is te weinig van. Kwam
    binnen bij de meting van punt 14 (`docs/PUNT14-BOUWDOC.md` §3) en is daar bewust buiten scope
    gehouden. HARDE DATUM: korte beklimmingen wordt half februari 2027 het actieve doel, dus dit
    moet daarvóór af. Raakt `DOELEN-SPEC`.
    FASE 1 IS AF per 02-08-2026, bouwdoc `docs/PUNT15-FASE1-BOUWDOC.md`, bouw `6a5620d`. NIET
    gedeployed, en dat is een besluit: `spreiding.effortsInLangeRit` staat alleen op `klim_kort` en
    `klim_lang`, dus bij doel FTP is de bouw per constructie inert en zou een deploy niets tonen.
    DE PREMISSE IS GECORRIGEERD: de 39 en 46 zijn weekvorm V1 in fase BUILD (gemeten 38,5 en 46,0),
    de norm voor deze twee doelen is 78 en niet 84 — 3 prikkels maal
    `KWALITEIT_MIN_PER_PRIKKEL_DEFAULT` 26, want 84 is de FTP-norm — en het tekort is FASE-GEBONDEN
    in plaats van doel-breed: in Base leveren de twee doelen gemiddeld 85,0 en 82,4 over de zeven
    weekvormen. DE EERSTE TERM WAS GEEN DOSIS MAAR EEN GAT IN DE MUNT: `genericCombo` gaf voor
    `combo_long_with_efforts` geen `blokken` terug terwijl `planZone5_` juist dat veld leest, dus
    de efforts-minuten waren onzichtbaar voor de zone-munt en het label belandde niet in de poortset
    van punt 14. Uitputtend gemeten over 480 sessies: 28 zonder blokken, alle van dit type, samen
    840 onzichtbare intent-high-minuten. GEMETEN EFFECT: Build Korte beklimmingen 42,4 naar 72,4 en
    Lange beklimmingen 56,5 naar 86,5, Peak Korte 20,0 naar 50,0 en Lange 27,4 naar 57,4, met 78 van
    de 106 gemeten regels ongewijzigd.
    WAT FASE 2 NOG DRAAGT. Het RESTERENDE TEKORT: Build Korte beklimmingen blijft op 68,5 tegen 78,
    en Peak op 46,5 met maar twee kwaliteitsdagen. DE POORT-OMKERING IN PEAK: daar leest Korte
    beklimmingen 7 van de 7 weekvormen als GELEVERD op 16,5 werkminuten, omdat de poortset
    uitsluitend `anaeroob` is en dat de enige zone is die klopt. DE VASTE TSS: deze sessie rekent
    `Math.round(totaalMin * 0.85)` in plaats van `tssFromBlokken_`. EN DE INTENSITEIT VAN DE
    EFFORTS: de band 85-92 heeft haar midden op 88,5 en draagt daarmee het label `tempo`, terwijl
    `DOELEN-SPEC` §3.3 voor dit doel herhaalbare BOVENDREMPEL-inspanningen in de lange rit vraagt.
    FASE 2 IS AF per 02-08-2026, spec `docs/PUNT15-FASE2-BOUWDOC.md`, bouw `a15bcbb` — CLIENT,
    geen engine, niet gedeployed omdat Onderhoud en FTP in geen enkele cel kantelen. DE
    PREMISSE IS OPNIEUW GECORRIGEERD: het tekort is niet klim-specifiek maar DOEL-BREED EN
    FASE-GEBONDEN. In Peak liggen FTP 9 van 9, Conditie 9 van 9, Korte beklimmingen 9 van 9 en
    Lange beklimmingen 7 van 9 cellen onder de norm; in Base Conditie 9 van 9 en Lange
    beklimmingen 5 van 9; Onderhoud 0 van 27 in alle fases. Gemeten over 5 doelen x 3 fases x 9
    weekvormen. TWEE TERMEN. (1) DE NORM KENT HET FASE-QUOTUM: `kwaliteitPerWeek.Peak` is 2 bij
    `ftp`, `conditie`, `klim_kort` en `klim_lang` terwijl `blokDosisNorm` 3 prikkels rekent
    zodra `weekUren` >= 5, dus het plan kan zijn eigen meetlat per constructie niet halen — op V1
    in Peak valt bij zowel FTP als Korte beklimmingen dezelfde derde kwaliteitsdag weg. (2) ER KOMT
    EEN EIS OP HET TOTAAL: in 98 van de 105 cellen ligt de som van de zone-normen BINNEN de poortset
    lager dan de totaalnorm, en 24 van de 135 cellen lezen GELEVERD terwijl de werkminuten onder hun
    eigen totaalnorm liggen — scherpst Korte beklimmingen in Peak, effectieve eis 34 tegen norm 78.
    Dat is geen fout van punt 14: die poort besliste welke zones meedoen, en de norm-massa van de
    zones die eruit vallen verdampt zonder dat iets dat merkt. HERVERDELEN IS GEMETEN EN VERWORPEN
    (92 van de 135 geleverd wordt 46, Onderhoud zakt naar 18 van 27) omdat de poortset NOMINALE
    labels draagt terwijl `planZone5_` proportioneel splitst. De aangenomen vorm laat 13 cellen
    kantelen en 0 de andere kant op; Onderhoud en FTP bewegen niet.
    FASE 3 IS DE DOSIS ZELF · ENGINE, eigen autorisatie. Werkminuten per kwaliteitsdag: `klim_kort`
    27,0 / 23,0 / 21,9 over Base, Build en Peak tegen FTP 32,3 / 32,3 / 25,1 en `klim_lang` 36,0 /
    27,5 / 25,1, bij een norm van 26 per prikkel. Daar horen ook de vaste TSS van
    `combo_long_with_efforts` en de efforts-band 85-92 bij, die nominaal `tempo` heet terwijl
    `DOELEN-SPEC` §3.3 bovendrempel vraagt.
    FASE 1, 2 EN 3a STAAN LIVE per 02-08-2026, Worker Version
    `1f8ec371-c7f4-4078-8bce-7dc764434bf1`, gebouwd van `ec8098c`. Geen migratie: `0009` blijft
    de hoogste.
    FASE 3a IS AF per 02-08-2026, bouwdoc `3736575`, bouw `9066920` — ENGINE, uitsluitend
    `packages/engine/src/planner.ts`. Twee termen: de HENDEL met ruimte-rem (de
    werktijd van de efforts schaalt met `mesoFactor` maal `dosisTredeFactor`, begrensd door de
    Z2-basis) en de TSS uit de blokken. De BAND is NIET aangeraakt, dus karakter-invariant.
    FASE 3b IS DE BAND, EN ER GAAT EEN VRAAG AAN VOORAF. GEMETEN dat elke bovendrempel-band voor
    `klim_kort` bij het huidige Peak-quotum van 2 de poortset in Peak op uitsluitend `anaeroob`
    laat vallen — precies de omkering die punt 14 fase 1 wegnam. Met `vo2_hill_repeats` zakt de
    week van 68,5 naar 52,0 in Build en van 46,5 naar 30,0 in Peak; met `threshold_4x8_seiler`
    blijft het totaal gelijk (69 naar 71, 47 naar 49) maar valt de poortset opnieuw op anaeroob.
    Met Peak-quotum 3 klopt het wél: Korte beklimmingen in Peak gaat van 47 tegen 52 op twee
    kwaliteitsdagen naar 71 tegen 78 op drie, met poortset anaeroob plus drempel. `klim_lang`
    hangt er NIET aan: met `threshold_long` (3x14 @95-102) gaat Build van 76,0 naar 88,0 en Peak
    van 52,0 naar 64,0, en halen alle 18 cellen hun norm.
    HET PEAK-QUOTUM IS AF per 02-08-2026 en LIVE op Worker Version
    `c5b67eb7-8eb3-456f-b21c-4dffa882cd4a`: `kwaliteitPerWeek.Peak` van 2 naar 3 bij `klim_kort`
    en `ftp`, spec `docs/PUNT15-PEAKQUOTUM-BOUWDOC.md`, bouwdoc `438f33d`, bouw `d93774d`.
    `klim_lang` en `conditie` blijven op 2 en `onderhoud` stond al op 3. GEMETEN en BEGRENSD: 18
    van de 135 cellen bewegen, 0 daarvan buiten Peak — 9 bij FTP en 9 bij Korte beklimmingen.
    Korte Peak V1 gaat van 46,5 naar 68,5 werkminuten en de poortset van tempo plus anaeroob naar
    tempo, drempel én anaeroob. DAARMEE IS FASE 3b ONTGRENDELD: de omkering die hem blokkeerde —
    poortset in Peak op uitsluitend `anaeroob` zodra de band omhooggaat — bestaat niet meer.
    EVALUATIEPUNT 2026-09-21, wanneer de blok-terugblik het afgeronde mesoblok 9 t/m 12 draagt:
    levert Daan in twee of drie van de drie Peak-weken maar twee kwaliteitsdagen, dan was 3 te veel
    voor zijn uren. Wat die kaart NIET beslist is of 3 beter is dan 2 — de norm volgt het quotum.
    DE MEETGROND, VAN VÓÓR DE BOUW: `kwaliteitPerWeek.Peak` stond op 2 bij `ftp`, `conditie`,
    `klim_kort` en `klim_lang`, terwijl `DOELEN-SPEC` §3.1 en §3.3 een UREN-regel geven zonder
    fase-clausule en `urenPrikkels` in `blokDosisNorm` die regel al implementeert. GEMETEN effect
    van quotum 3 in Peak over ALLE VIJF de doelen, los: elk doel krijgt een derde kwaliteitsdag —
    FTP V2 44 naar 76 en V4 45 naar 70, Korte V1 47 naar 69, Lange V7 62 naar 102 — en 0 van de 90
    cellen buiten Peak bewegen; de norm stijgt mee (52 naar 78, 56 naar 84), waardoor de cellen
    onder norm van 17 op 45 naar 21 op 45 gaan. Op die meting is de bouw BEPERKT tot `klim_kort` en
    `ftp`: bij `klim_lang` trok quotum 3 een vo2-sessie de Peak-week in die §3.4 niet wil, en dat
    bleek de FASE-MODULATIE te zijn en niet het quotum — in Build levert datzelfde quotum daar 0
    anaerobe minuten in 9 van de 9. DAT BLIJFT OPEN, als eigen ronde, samen met de vraag waarom
    Peak voor `klim_kort` in elke gemeten cel identiek aan Build wordt.
    FASE 3b IS AF per 02-08-2026 en LIVE op Worker Version
    `caccdcc1-385e-4c12-ad01-a6a3a3fa3927`, spec `docs/PUNT15-FASE3B-BOUWDOC.md`, bouw
    `829c47e`. De efforts-arm draagt nu een doel-specifieke band: `klim_kort` 5x6 op 100-108 op
    de AANTAL-as (§3.3 (ii)), `klim_lang` 3x10 op 95-102 op de LENGTE-as (§3.4 (i)); een doel
    zonder `effortsVorm` houdt de oude vorm. DE DRAGENDE UITKOMST: de band verplaatst
    ZONE-MASSA en verandert de DOSIS niet — 18 van de 18 gemeten cellen leveren identieke
    werkminuten, en op V1 in Build gaat tempo van 25,5 naar 4,0, drempel van 29,6 naar 39,8 en
    anaeroob van 13,5 naar 24,8 bij een ongewijzigd totaal van 68,5.
    FASE 3c DRAAGT WAT 3b EXPLICIET HEEFT LATEN LIGGEN, in deze volgorde.
    (i) DE SESSIE SCHAALT NIET MET DE RITDUUR: V1 met zaterdag 120 en V4 met zaterdag 240 leveren
    allebei 68,5 werkminuten, met de efforts-arm aan beide uiteinden op 30,0. `DOELEN-SPEC`
    §3.3 (iii) vraagt juist inspanningen laat in een GROEIENDE lange rit.
    (ii) DE SESSIE OVERSCHRIJDT DE OPGEGEVEN DAG in 4 van de 18 cellen per klim-doel — 105
    minuten terwijl de langste opgegeven dag 60 is, want `totaalMin` is geankerd op
    `fixedNominal`. Dat schendt `DOELEN-SPEC` §2A: de gebruiker levert de TIJD.
    (iii) DE DOSIS-VERHOGING BIJ `klim_lang`: 3x14 op 95-102 tilt 14 van de 18 cellen naar 18 van
    18, maar duwt de overschrijding uit (ii) van 105 naar 117 minuten. Dus pas NA (ii).
    FASE 3c IS GEMETEN EN AFGEBAKEND per 02-08-2026, spec `docs/PUNT15-FASE3C-BOUWDOC.md`. DE
    PREMISSE IS VOOR DE VIERDE KEER GECORRIGEERD: de efforts-rit is in GEEN ENKELE tekort-cel de
    drager van het tekort, maar de enige term met een OVERSCHOT — plus 4 minuten per keer. Over
    Build en Peak liggen bij Korte beklimmingen 10 van de 18 cellen onder norm, samen 106,9
    minuten, en de ontleding per sessie sluit op -107,2.
    (i) DE RITDUUR-SCHALING VERVALT. De arm zit met 30 werkminuten al op het vo2-plafond 31 van de
    bibliotheek, en geen enkele duurband reikt boven 135 minuten — boven die duur bestaat er dus
    geen anker, en een regel die de dosis met de ritduur laat groeien zou met de hand gekozen zijn.
    (iii) DE DOSIS-VERHOGING BIJ `klim_lang` IS GEPARKEERD achter (ii). Ze is wél verankerd — 3x14
    is 42 werkminuten, exact het drempel-plafond van `threshold_long` — maar ze mikt op het doel
    met 13,8 minuten tekort over 18 cellen, bij een event zonder datum.
    (ii) WORDT GEBOUWD. 8 van de 135 cellen zetten een sessie van 105 minuten op een dag van 60, en
    `tooLong` heeft VIER producenten en NUL lezers in de hele repo. WAT-ALS gemeten: precies 8
    cellen bewegen en nul daarbuiten, de kwaliteitsdagen blijven overal 3, en Korte beklimmingen
    gaat op W3 en W4 van 68,5 naar 49,9 tegen een norm van 52. Dat verlies is de waarheid die
    verschijnt: de 68,5 van vandaag bestond uit 45 minuten die de gebruiker niet had opgegeven.
    HET EIGENLIJKE TEKORT IS EEN NORM-VRAAG en staat als punt 17.
    NOTITIE VOOR 3b, UIT FASE 3a: term 1 rekt de LENGTE van de herhalingen — 3x10 naar 3x11,5 op
    mesoWeek 3, naar 3x15 op mesoWeek 3 plus trede 4. Op 85-92 is dat sweetspot-progressie en
    consistent met de bibliotheek. Gaat de band omhoog, dan verandert lengte het KARAKTER en moet
    de progressie naar het AANTAL herhalingen (`DOELEN-SPEC` §3.3 (ii)).
    EN EEN OPEN VRAAG DIE FASE 2 ONTTOETSBAAR MAAKT: door
    de norm het quotum te laten volgen, kan de meetlat niet meer melden dat het plan in Peak zijn
    eigen norm niet haalt. `kwaliteitPerWeek.Peak` is 2 bij `ftp`, `conditie`, `klim_kort` en
    `klim_lang`, terwijl het commentaar boven `klim_kort` zegt dat 3 in Build ÉN Peak alle drie de
    elementen levert, en `DOELEN-SPEC` §3.1 drie sleutelsessies noemt vanaf vijf à zes uur zonder
    fase-clausule. Klopt dat Peak-quotum van 2, of hoort het 3 te zijn? Die tegenspraak stond er
    al; fase 2 haalt alleen de meetlat weg die hem kon melden.
    PUNT 15 IS AF per 03-08-2026 en LIVE op Worker Version
    `cdd32a42-7e9b-4983-bd5a-87c79f62da3c`, bouw `f8f1ebb`. FASE 3c BOUWDE UITSLUITEND TERM (ii),
    de fit-poort: de efforts-arm mag alleen een dag pakken die de sessie draagt, en de ondergrens
    is AFGELEID uit `effortsVorm` van het profiel (`effortsDagMinimum_`) en staat nergens als
    getal — vandaag 105 voor beide klim-profielen. TERM (i), de ritduur-schaling, IS VERVALLEN;
    de grond staat in `docs/PUNT15-FASE3C-BOUWDOC.md` §8: de arm zit met 30 werkminuten al op het
    vo2-plafond 31 en boven 135 minuten bestaat er geen duurband, dus elke regel daar zou met de
    hand gekozen zijn. TERM (iii), de dosis-verhoging bij `klim_lang`, is door (ii) ONTGRENDELD —
    de fit-poort schaalt vanzelf mee naar 117 — maar blijft GEPARKEERD achter punt 17: ze mikt op
    13,8 minuten tekort over 18 cellen bij een event zonder datum, en het eigenlijke tekort is een
    NORM-vraag. Dat maakt punt 15 af en punt 17 de opvolger.
16. **De goedkope bereik-prikkel** — open · ENGINE plus norm. Een prikkel boven de drempel die
    TOEVOEGT in plaats van RUILT: sprints of hard starts aan het eind van een Z2-rit, of een korte
    set achter sweet-spot-werk. Kwam binnen bij punt 14 fase 2, waar de RUIL-vorm meetbaar is
    afgewezen (7 van 7 weekvormen zwakker, blok-oordeel van 7 van 7 naar 0 van 7) en de TOEVOEG-vorm
    expliciet ongemeten bleef. HET SJABLOON BESTAAT AL EN IS ONBEREIKBAAR: `combo_ss_sprints`
    (`planner.ts:2583`) heeft een volledige bouwer, een zonemap en een downgrade-regel, en NUL
    producenten; idem `combo_z2_vo2` en `combo_all_three`. DRIE VRAGEN, in deze volgorde. (i) DE
    ROUTE — niet via de archetype-bibliotheek, want alle 35 archetypes worden op een KWALITEITSSLOT
    getrokken en elke toevoeging daar is een ruil; de duurdag is de plek, en bij Onderhoud is die
    dicht via `langeRitPerWeek: 0`, `effortsInLangeRit: false` en de `macroFase !== "Base"`-eis in de
    weekend-tak. (ii) DE NORM — een anaeroob label opent de poort van punt 14 fase 1 en daarmee een
    norm van 10 minuten, terwijl 6x15s 1,5 minuut levert; zonder aanpassing leest een exact volgens
    plan gereden week weer als niet geleverd. (iii) DE PLAATS — winter-Onderhoud of pas de opmaat
    naar korte beklimmingen, waar dezelfde prikkel hoe dan ook nodig is. GAAT NA PUNT 15: die draagt
    de harde datum en raakt dezelfde dosis-vraag. Raakt `DOELEN-SPEC`.
17. **De norm is voor de klim-doelen onbereikbaar** — open · NORM plus BIBLIOTHEEK. GEMETEN op
    weekvorm V1 in Build, norm én plan op DEZELFDE dosis-trede: FTP levert 95 tegen 84, 108,2 tegen
    96 en 121,4 tegen 108 en is overal GELEVERD; Korte beklimmingen levert 68,5 tegen 78, 79,6
    tegen 90 en 85,5 tegen 102, dus het gat GROEIT van -9,5 naar -16,5; Lange beklimmingen blijft
    rond -2,5 en sluit nooit. De norm stijgt 6 minuten per trede terwijl de efforts-arm op een
    zaterdag van 120 na één stap tegen de ruimte-rem loopt: 30, 36, 36. DE KLIF: 4,75 uur geeft 2
    prikkels en norm 52 en leest GELEVERD, 5,0 uur geeft 3 prikkels en norm 78 en leest ONDER NORM
    — bij hetzelfde plan van 68,5. AAN DE PLAN-KANT: elk vo2-sjabloon dat een dag van 60 raakt
    levert 8 tot 20 werkminuten, elk sjabloon met 22 of meer begint pas op 61 of hoger, en
    `vo2_sandwich` haalt zijn 31 door 8 vo2-minuten in 20 tempo-minuten te verpakken. CRITERIUM: een
    EXACT volgens plan gereden week moet zijn eigen norm kunnen halen. DE VAL: de norm naar het plan
    buigen is zichzelf meten, dezelfde val als het fase-quotum in punt 15 fase 2. Eerst meten wat
    een sessie van 60 minuten per zone EERLIJK kan dragen, dan pas kiezen tussen bibliotheek en
    norm. Raakt `DOELEN-SPEC`.
18. **De afronding op het scherm** — af · CLIENT plus TOOLING. Een sessieduur wordt KAAL gerenderd en toont
    daardoor float-ruis: `WorkoutDetail.tsx:57` zet `session.totaalMin` zonder opmaak op het
    scherm en `expandArchetype_` (`planner.ts:1383`) telt `warm + cool + mainMin` op uit blokken
    die elk al op één decimaal zijn afgerond, dus er staat "59.800000000000004 min" bij
    `Sweet Spot lage cadans 3x7`. GEZIEN OP DAANS EIGEN SCHERM. DE FIX IS ÉÉN FORMATTER AAN DE
    RENDERRAND — maximaal één decimaal, achterliggende nul weg, zodat "60 min", "59,8 min" en
    "60,5 min" alle drie kloppen; die halve minuut is echt en komt uit intervallen van 90
    seconden — en die formatter hoort op ÉLKE plek die een duur toont, niet alleen op
    `WorkoutDetail`. GEEN ENGINE-WIJZIGING: afronden is presentatie, en een ronding in
    `expandArchetype_` zou elke vingerafdruk laten bewegen. ER HOORT EEN MECHANISCH NET BIJ, in de
    shot-harness: een regex op de innerText-`.txt` die afgaat op elk getal met twee of meer
    decimalen, zodat deze hele familie voortaan valt op élk scherm dat de harness fotografeert.
    PUNT 18 IS AF per 03-08-2026, over vier commits: `ec1602d` het net plus de zeven ontbrekende
    routes, `1ce1732` het bereik van het net, `c780ef9` de fix, `0d928ce` de CSS-correctie.
    DE PREMISSE HIERBOVEN WAS ONVOLLEDIG, op twee punten. (1) "Eén formatter aan de renderrand"
    dekte alleen de KALE getallen — de plekken waar een `number` rechtstreeks in de JSX belandt.
    Er bleek een TWEEDE familie: strings die de ENGINE al vervuild aanlevert, met `structuur[i][1]`
    als drager — gemeten 51 gevallen over 660 weken, waaronder een cooldown van
    "9.000000000000004 min" bij Drempel 2x20. Die is client-zijde opgemaakt met `nlBlokDuur` en de
    engine is NIET geraakt: diezelfde cel wordt door `dslBlockFromRow_` geparseerd voor de workout
    naar intervals.icu en Garmin, en een Nederlandse komma in de bron laat die parse stilzwijgend
    terugvallen op één enkele lap. (2) De regel is daarom VERBREED van duur-opmaak naar: GEEN ENKEL
    COMPONENT RENDERT EEN KAAL GETAL. Duur door `nlUpTo1`, watt en TSS door `nlInt`, W/kg door
    `nlDec2`; bestaande afronders blijven staan. De keerzijde staat in `0d928ce`: een CSS-waarde is
    GEEN tekst en houdt `Math.round`.
    HET NET STAAT HARD OP VIER DECIMALEN en faalt de run op een treffer. Vier is gemeten: de ruis
    droeg er veertien, elke legitieme waarde hoogstens drie.
19. **Het dagtype weekend is een kalendernaam, geen eigenschap** — open · ENGINE. `deriveDagtype`
    (`apps/web/src/lib/planner.ts:18`) leidt het type af uit za/zo, terwijl de gebruiker alleen
    pendel, trainen en minuten opgeeft; `assignWorkouts` geeft weekend- en vrije dagen daarna
    verschillende per-dag-takken. Een deload-zaterdag en een deload-vrijdag van dezelfde lengte
    lopen dus door verschillende takken. Bereikbaar op de dagen waar de allocator niet komt:
    verstreken, gereden, taper- en deload-uitgesloten. In strijd met `DOELEN-SPEC` §2A — duur is
    een eigenschap van de dag, de kalendernaam is dat niet. EERST METEN wat het verschil in de
    praktijk oplevert, dan pas bouwen: de takken zijn via `buildWeekProposal` grotendeels
    onbereikbaar, dus het kan zijn dat er niets aan hangt. Raakt `DOELEN-SPEC`.
20. **DE GEPUSHTE WORKOUT IS KORTER DAN HET PLAN** — af · ENGINE.
    SYMPTOOM, LIVE WAARGENOMEN: een sessie van 65 minuten kwam op Garmin binnen als 27.
    DE GROND ZIT OP TWEE PLEKKEN, en allebei zijn ze nagerekend. (1) `dslDurationSec_`
    (`zones.ts:425`) zoekt met `/(\d+)\s*min/i`. Op `"24.7 min"` matcht `24` niet, want er volgt
    een PUNT waar `\s*min` verwacht wordt; de scan schuift door en vindt `7 min`. De cel wordt 7
    minuten. (2) `dslBlockFromRow_` (`zones.ts:354`) eist in zijn herhalings-regex
    `/^\s*(\d+)\s*x\s*(\d+)\s*(min|sec|s)\b/i` twee HELE getallen. `"2x 9.7 min"` matcht daardoor
    niet, valt door naar diezelfde scan, wordt óók 7 minuten EN VERLIEST ZIJN TWEE HERHALINGEN.
    De waargenomen sessie rekent na: 8 plus 7 plus 7 plus 5 is 27.
    `zwoStepFromRow_` (`zones.ts:448`) draagt LETTERLIJK dezelfde herhalings-regex. Ga ervan uit
    dat de ZWO-tak hetzelfde mankeert, en TOETS DAT EXPLICIET — niet aannemen omdat de code er
    hetzelfde uitziet.
    OMVANG, GEMETEN over 2100 sessies en 9038 structuur-cellen: 19,7% van de cellen draagt een
    decimaal, 19,0% wordt fout geparseerd, en 30,0% van de sessies heeft minstens één fout blok.
    WAAROM DE SUITE DIT NIET VING, en dit is de eigenlijke les: `selftest.test.ts` asserteert bij
    `arch <id> push-parse` alleen dat `dslBlockFromRow_` niet `null` teruggeeft — niet dat de duur
    klopt. Een test die "parst" toetst en niet "parst GOED". VERTROUW DIE ASSERTIE NIET ALS
    DEKKING; een nieuwe test legt de GEPARSEERDE duur naast de BEDOELDE duur.
    NIET VEROORZAAKT DOOR PUNT 18. De push-tak leest de ENGINE-strings, en die zijn in die ronde
    bewust onaangeroerd gebleven — juist omdat deze parser ze leest. Punt 18 maakte het defect
    ZICHTBAAR, het maakte het niet waar.
    OPEN BESLUIT, NIET NU NEMEN: repareer je de PARSE, de STRING aan de bron, of allebei — en moet
    de push tijdelijk geblokkeerd worden zolang hij fout is. Dat laatste is een echte vraag: een
    stille 27-minutenrit op de fietscomputer is erger dan geen push.
    AF per 03-08-2026 en LIVE op Worker Version `f623ed2a-99db-4861-962d-096849df310f`. Recon
    `9f43299` (`docs/PUNT20-RECON.md`), fix `514389f`, dekking `a8fe7ba`.
    HET BESLUIT IS GEWORDEN: de PARSE, niet de string. De engine-string blijft onaangeroerd omdat
    `dslBlockFromRow_` hem leest voor de laps; blokkeren van de push was niet nodig omdat de fix
    in dezelfde ronde landde. DRIE EDITS, alle drie in `zones.ts`, samen 64 regels:
    `dslDurationSec_` leest een decimale breuk en mag niet MIDDEN in een getal beginnen (een
    ankergroep op stringbegin of een niet-cijfer-niet-punt, geen lookbehind), en de twee
    herhalings-regexen laten een decimaal werkgetal toe. `dslRestFromNote_` is BYTE-IDENTIEK
    gebleven: nul decimale rustnoten bij 179 bestaande, dus daar zou geen rood-test bij kunnen.
    DE OMVANG IS GECORRIGEERD. Op de echte pipeline via `buildWeekProposal` 37,9% van de cellen
    en 66,0% van de sessies, tegen de 19,7% en 30,0% die hierboven stonden — ruwweg het dubbele.
    HET DEFECT IS BIDIRECTIONEEL: van de 38302 foute cellen over 100327 waren er 17217 te KORT en
    21085 te LANG, met `"6.9999999999999964 min"` als scherpste geval (`Duration` 599999999999997800).
    De titel beschrijft de waargenomen sessie, niet het mechanisme.
    HET BESTOND AL BIJ ELKE mesoWeek BOVEN 1 EN ELKE TREDE BOVEN 0. Gemeten over 5 doelen: bij
    mesoWeek 1 met trede 0 draagt 0 van 7220 cellen een decimaal, bij mesoWeek 3 is het 51,2% en
    bij trede 2 52,9%. In drie van de vier weken van een 3:1-blok stond dit fout; punt 18 maakte
    het zichtbaar, niet waar.
    DE VALSE DEKKING WAS VIJF PLEKKEN: `selftest.test.ts:1981`, `:2081` en `:3549` toetsten alleen
    op niet-`null`; `W_ZWO` (`push.test.ts:24`) draagt uitsluitend hele minuten; en
    `zwoStepFromRow_` werd door GEEN ENKELE test aangeroepen terwijl het het primaire push-pad is.
    BEGRENZINGSBEWIJS: 2511 unieke cellen, waarvan 599 ZONDER decimaal en daarvan 0 bewogen —
    byte-identiek in beide parsers; 1912 met decimaal en alle 1912 nu correct; nul cellen geven
    `null`, voor en na.
21. **De push-beschrijving draagt dezelfde ruis** — open · ENGINE, transport-nabij.
    `buildWorkoutDescription_` (`zones.ts:569`) zet `totaalMin` RAUW in de beschrijving die naar
    intervals.icu gaat, en hergebruikt daarin dezelfde blokstrings die punt 18 client-zijde heeft
    opgemaakt. Wat Daan in de app ziet klopt dus, en wat in zijn agenda en op zijn fietscomputer
    belandt niet. DE FIX IS HIER NIET DEZELFDE: dit is geen renderrand maar TRANSPORT, en dezelfde
    tekst wordt door `dslBlockFromRow_` geparseerd — een Nederlandse komma verminkt de laps. Eigen
    ronde, RECON-FIRST: eerst meten wie die string leest en schrijft, dan pas een vorm kiezen.
    LET OP, GEMETEN BIJ PUNT 20: `buildWorkoutDescription_` is na de `return` op `push.ts:87`
    alleen bereikbaar als ZWO ÉN DSL allebei falen, en `zwoStepFromRow_` gaf over de hele
    populatie 0 keer `null` — vóór én na de fix. Deze tak is dus vermoedelijk DOOD. Meet eerst de
    BEREIKBAARHEID voor er iets gebouwd wordt; een fix in een tak die nooit vuurt is geen fix.
    Engine, dus stop-en-verifieer vóór enige wijziging.
22. **De rit-sheet is voor geen enkele DOM-ingreep bereikbaar** — open · TOOLING.
    `RideDetailLink.tsx:30` rendert de sheet met `{open && ...}`: hij staat pas ná een klik in de
    DOM. De leespas van de harness opent `hidden` en inline `display`, maar wat er niet IS valt
    daar per constructie buiten. Dit is de DERDE manier waarop inhoud buiten het net valt, na die
    twee. Vandaag gedekt door de code-regel (geen kaal getal) en niet door de camera. Wil je hem
    onder het net brengen, dan moet de harness klikken — en dan hoort er ook een assertie bij dat
    de sheet daadwerkelijk open kwam.
23. **Twee shots zijn niet byte-deterministisch** — open · TOOLING. `v7/09-vorm` en
    `v7/10-trainingen` verschillen tussen twee runs van ONGEWIJZIGDE code, met telkens identieke
    `innerText`; het verschil is dus puur pixel. VERMOEDEN: een animatie of overgang die `settle`
    niet uitzit — beide schermen dragen bewegende elementen die de andere zeven niet hebben.
    Zolang dit staat moet elke PNG-vergelijking die twee UITSLUITEN, en dat is een gat in het
    begrenzingsbewijs: juist op die twee schermen kan een regressie ongezien blijven.
24. **De mount-flake, en zes routes zonder vangnet** — open · TOOLING. `settle` geeft op terwijl de
    `innerText` nog "Laden…" is; de shot toont dan een ladende pagina. Treft BEIDE harness-versies,
    dus het is geen gevolg van een bouw. Op `/schema` wordt het opgevangen door de
    zeven-knoppen-assertie op de dagstrip — die faalt hard en de run stopt. De zeven nieuwe routes
    hebben zo'n mount-assertie NIET, dus daar zou een ladende pagina stil als geldige shot
    doorgaan. Elke route hoort een eigen goedkope aanwezigheids-assertie te krijgen.
25. **`12-activiteiten` wordt afgesneden** — open · TOOLING. Die pagina heeft 5898 pixels nodig
    tegen `HEIGHT_CAP` 4000, dus de PNG is afgekapt en een VISUELE controle van dat scherm kan
    vandaag niet. De `innerText` in de `.txt` is wél compleet, dus tekstuele controle en het
    float-net werken er gewoon. Keuze: de cap verhogen, of het scherm in stukken schieten.
26. **De vandaag-gereden dag verliest zijn plan** — af · CLIENT. `plannedForDone` wordt in
    `apps/web/src/lib/proposal.ts` alleen gevuld als de dag STRIKT in het verleden ligt: `:656`
    zet `const isPast = stripTime_(d.datum).getTime() < todayT`, en de toekenning op `:660` hangt
    onder die tak. Een dag die VANDAAG gereden is heeft dus noch `sessions` — de allocator bouwt
    die alleen voor nog te plannen dagen — noch `plannedForDone`. GEVOLG: de VOLTOOID-kaart toont
    geen plan-vergelijking, en de dag valt uit alle drie de weeknoemers (TSS, minuten, dagen).
    TWEE KEER OP DAANS EIGEN SCHERM GEZIEN, 3 augustus 2026 — dat is de reden dat dit voorgaat op
    het numeriek eerdere punt 21, waarvan de drager gemeten vermoedelijk dood is.
    HET ZELFHERSTEL BIJ HET VERSTRIJKEN VAN DE DAG IS NIET GEVERIFIEERD. Dat is de EERSTE meting,
    en die gaat vóór elke bouw: pas als vaststaat of de bevroren entry de dag erna wel gelezen
    wordt, is te kiezen tussen de tak verruimen en de entry eerder schrijven.
    Neemt het parkeerlijst-item "DE GEPLAND-NOEMER ZAKT OP DE DAG ZELF" op, inclusief de meting
    daar: op de v7-pendel-vorm ging de pendeldag van 446 TSS / 530 min / 5 dagen naar 375 / 450 /
    4, en een gewone maandag van 60 minuten naar 391 / 470 / 4. Meting in `docs/PENDEL-RECON.md`
    paragraaf 2.
    AF per 04-08-2026 en LIVE op Worker Version `01dee48d-f756-48bd-bec1-a25f0e5813a9`. Bouwdoc
    `2f363e1` (`docs/PUNT26-BOUWDOC.md`), bouw `b55f5b9`. TWEE TERMEN, allebei CLIENT.
    A, DE LEESTAK: de bevroren-entry-tak in `proposal.ts` gaat van `isPast` naar
    `isPast || d.gedaan`, met `gedaan` de uit de ACTIVITIES afgeleide vlag.
    B, DE SCHRIJFKANT: `withDoneTodayEntries` in `weekplanBlob.ts`, call-site `schema.ts:1263` in
    `persistWeekplan`, vóór zowel de recon-tak als de dedup-tak. Nodig omdat de bewaarde entry
    anders VERNIETIGD wordt: `mergeFrozenWeekplan` bevriest alleen `datum < vandaag` en de verse
    payload noemt de dag niet meer. De entry gaat VERBATIM mee — herbouwen uit `plannedForDone`
    zou `variantId` en `archetypeId` verliezen, en juist die leest de recency-seed.
    GEMETEN: 15 van de 15 op ALLE VIER de momenten (de dag zelf, de eerste en de tweede render
    daarvan, en de dag erna). Term A ALLEEN geeft 15 van 15 op de eerste render maar 0 van 15 op
    de tweede — dan is er niets meer om te lezen. Het RECONSTRUCTIE-GAT gaat van 15 van 15 naar
    0 van 15, en dat telt: die reconstructie leverde in 4 van de 15 cellen een ANDER plan
    (`long_z2` naar `sweet_spot`, TSS 42 naar 53, intent high 0 naar 26), en de blok-terugblik
    leest precies die velden.

## De tijdslijn

De seizoenskalender uit `DOELEN-SPEC.md` §5, naast de reeks gelegd.

- **Nu tot december 2026** — geen harde datum. Dit is de goedkope bouwtijd.
- **December 2026, doel Onderhoud — GEEN BLOKKADE, gemeten.** Met AGR in de agenda staat de
  fase in december op Base, `PROFILES.onderhoud` draagt quotum 3 in élke fase met
  `mesoCyclus: false`, en `effectiveMesoWeek_` pint de mesoweek op 1. Dat is exact wat
  `DOELEN-SPEC` §3.2 voorschrijft. Een eerder STAND-blok noemde december de eerste harde datum
  omdat het ingestelde doel de fase niet stuurt; dat laatste klopt (punt 9), maar het levert in
  december geen defect op — de event-fase staat daar toch al op Base. Wat in de winter nog
  openstaat is punt 9 zelf; punt 8 (Onderhoud mat zich tegen het girona-profiel) is per
  31-07-2026 af.
- **Half februari 2027 — DE EERSTE HARDE DATUM, EN SINDS PUNT 9 EEN VRAAG IN PLAATS VAN EEN
  OMSLAG.** Op 2027-02-22 zet de event-as de fase op Build, en §5 laat het doel dan wisselen naar
  korte beklimmingen. Dat doel EN de bijbehorende meetlat zijn er per 31-07-2026 (punt 7 en punt 8,
  allebei af). Punt 9 is per 01-08-2026 af, en daarmee kantelt het plan hier NIET vanzelf: de
  overname-kaart verschijnt op zaterdag 2027-02-20 — de eerste dag met `wekenTot` = 8 — en het
  ingestelde doel blijft sturen tot Daan bevestigt. Zegt hij nee, dan loopt zijn blok door en komt
  de vraag nog één keer terug op de blokgrens van 2027-03-08.
- **17 april 2027 — AGR Toerversie.** Punt 11 levert de effect-meter voor dat doel; zonder die
  meter traint de app wel, maar kan ze niet zien of het werkt.
- **Zomer 2027 — Stelvio.** Lange klimmen komt mee met de splitsing in punt 7. Een voorlopige
  datum is nodig, want `eventFase_` meet weken tot een event.

## Gesloten — vindplaats

De uitgebreide onderbouwing van de gesloten punten, inclusief de diagnoses die onderweg zijn
weerlegd. Bruikbaar als vindplaats; de stand staat in *De reeks*.

### STAP 1 — de dosis schaalt verkeerd met tijd · AF

Meer uren leverden MINDER kwaliteit op: vanaf 136 beschikbare minuten kwalificeerde geen enkel
sjabloon meer en viel de dag door naar duurwerk zonder kwaliteit.

Opgelost door het duur-plafond te LATEN STAAN — binnen de bibliotheek-band doet het echt werk,
het weert korte sjablonen van middellange dagen — en er een fallback boven te zetten. Levert de
kandidaat-filter nul kandidaten, dan volgt een tweede pass zonder plafond, gesorteerd op langste
band eerst en bij gelijke band het zwaarste sjabloon.

- Spec: `docs/DUUR-SELECTIEREGEL.md`. §3 draagt de WEERLEGDE eerste poging (een doelwerktijd-regel
  zonder plafond) met de meting die hem omver haalde.
- Gemeten op de weekvorm-as: kwaliteitsminuten 69 / 45 / 45 / 45 / 64 werd 69 / 81 / 45 / 81 / 64.
  V1, V3 en V5 tot op de minuut ongewijzigd — de fallback vuurt nergens binnen de band.
- Bouw-commit `ff2baf8`. NIET GEDEPLOYED.

### STAP 1b — de lange dag pakt geen kwaliteitsslot · AF

Twee hendels, in deze volgorde. Eerst het KWALITEITSQUOTUM: `PROFILES.ftp.kwaliteitPerWeek.Base`
stond op 2 terwijl `DOELEN-SPEC` §3.1 vanaf vijf gedeclareerde uren drie sleutelprikkels
voorschrijft. Op 3 gezet (commit `f020c2a`) steeg elke weekvorm en ging V3 van 45 naar 77. Daarna
de ALLOCATOR zelf (bouw-commit `6c4149f`, recon `52f43ca`), waarmee V3 op 113 uitkomt.

DE OORSPRONKELIJK OPGESCHREVEN OORZAAK IS WEERLEGD, en dat blijft hier staan als vindplaats. De
efforts-arm zou alleen in Build of Peak vuren, dus in Base geen kwaliteit op de lange dag kunnen
zetten. Twee metingen halen dat omver. De fase-voorwaarde verruimen naar Base is BYTE-IDENTIEK aan
de baseline — de arm hangt aan twee voorwaarden en `PROFILES.ftp.spreiding.effortsInLangeRit` is
false, alleen `PROFILES.klim` draagt de vlag, dus de ingreep is per constructie inert. Verruimen
ÉN de vlag aanzetten laat ELKE weekvorm dalen, naar 75 / 75 / 75 / 75 / 69 / 75: het sjabloon
`combo_long_with_efforts` levert 30 kwaliteitsminuten ongeacht de dagduur en consumeert bovendien
een slot.

WAT HET WEL WAS: `pickBestSpread_` koos kwaliteitsdagen op AFSTAND tot de reeds geplaatste dagen
en was volledig blind voor draagkracht — in V3 won de zondag van 90 min van de zaterdag van 180,
puur omdat hij verder van de maandag lag. Daaronder lag een tweede vondst: de dosis hing aan de
VOLGORDE van de keuzes. Dezelfde drie dagen (ma70 + za180 + do70) leverden 113 kwaliteitsminuten
in de volgorde ma>za>do en 87 in ma>do>za — 30 procent verschil zonder trainingsreden.

DE OPGELOSTE REGEL: geen weekendpaar vormen, dan PLAATSBAARHEID, dan DRAAGKRACHT, dan afstand,
dan pendel, dan laagste dagIdx. Plaatsbaarheid staat boven draagkracht omdat draagkracht alleen
greedy is: een lange dag kan zijn buren blokkeren en zo een hele sleutelsessie kosten. Geen nieuwe
constante; `gapOK_`, `minGap`, `formsWeekendPair_`, `weekendBlok` en de efforts-arm ongemoeid; de
EERSTE keuze byte-identiek, want beide termen doen alleen mee zodra er ankers zijn.

- Alle zeven weekvormen halen nu de norm van 84 bij vijf gedeclareerde uren.
- `spreiding.midweekMinGap` was NIET de hendel: quotum 3 mét `midweekMinGap` 0 is byte-identiek
  aan quotum 3 met 1.
- DE VO2-GRENS blijft staan. Boven 135 minuten kan de fallback uit stap 1 bij intent `vo2`
  hoogstens 28 nominale werkminuten leveren: de vo2-band houdt op bij 100 minuten en die
  sjablonen zijn kort van ontwerp. Geen fout in de fallback, een grens van de bibliotheek.
- Raakt: ENGINE (`allocateQualityWeek_`). NIET GEDEPLOYED.

### STAP 2 — er is geen plek waar dosis wordt vastgehouden · AF

De blok-check concludeerde blok na blok "het plan was te licht" en niets onthield dat: elk blok
begon op hetzelfde niveau en de conclusie verdampte zodra de kaart weg was. Nu draagt hij een
DOSIS-TREDE, en die tilt de NORM en het PLAN met dezelfde factor op.

Spec: `docs/DOSIS-TREDE-RECON.md`. Gebouwd in drie fases met een stop ertussen — engine
(`e789857`), data (`5b6a5cd`), client (`860a95f`) — en LIVE sinds Worker Version
`38e185df-f28c-4d00-947e-b8d6e8c65906`, met migratie `0007_useful_johnny_storm.sql` remote
toegepast.

- De trede telt in MINUTEN PER SLEUTELSESSIE (FTP 28, stap 2, plafond 4). Stap en plafond staan
  in de code expliciet als BELEID gelabeld: er valt niets te ijken aan "hoeveel mag de dosis per
  blok omhoog", en ijken op de eigen historie reproduceert juist de gewoonte die dit vervangt.
- GEMETEN LADDER via `buildWeekProposal`, kwaliteitsminuten over de zeven weekvormen: trede 0
  geeft 93 / 113 / 113 / 105 / 84 / 93 / 90, trede 1 geeft 101 / 121 / 121 / 113 / 90 / 101 / 98,
  trede 2 geeft 106 / 130 / 129 / 120 / 96 / 106 / 103. Normen 84 / 90 / 96.
- DE REM is geasserteerd, niet alleen beweerd: bij trede 3 blijft de krapste vorm op 100 tegen
  een norm van 102, bij trede 4 op 106 tegen 108. Stijgen mag alleen na "geleverd", dus de ladder
  houdt daar vanzelf stil — op de weekvorm die de gebruiker werkelijk rijdt.
- Trede 0 is byte-identiek, end-to-end: nul herijkingen op de weekvorm-as, de 48 vingerafdrukken
  en `blok.test.ts`.
- Persistentie op `sync_state` (drie kolommen) met `GET`/`PUT /api/dosis-trede`. AFWIJZEN schrijft
  óók de blokstart, zodat het voorstel dit blok niet terugkomt; de volgende blokgrens stelt de
  vraag opnieuw. Een trede van een ander doel leest als 0.
- Raakt: ENGINE, DATA (migratie `0007`), CLIENT. LIVE.

## Waarom deze volgorde

Punt 5 gaat voorop omdat het het enige openstaande punt is dat de app VANDAAG functioneel
slechter maakt: er is een concreet geval waarin de coach een gemiste sleutelsessie niet als
sleutelsessie telt. Punt 6 maakt daarna de munt af waarin élk blok-oordeel rekent; hij is bij
Daan gedragsneutraal, maar half gebouwd, en de fixtures eronder zijn nu al kwetsbaar.

Daarna komt het februari-blok. Punt 7, 8 en 9 horen bij elkaar: de doel-lijst levert de doelen,
de meetlat levert het profiel waartegen ze gemeten worden, en de fase-sturing bepaalt wanneer
de overname gebeurt. Los gebouwd leveren ze drie halve antwoorden.

Punt 10, 11 en 12 zijn niet deadline-gebonden. Punt 12 hangt aan punt 7: een
passendheids-voorstel zonder herziene doel-lijst wijst naar de verkeerde doelen.

De oude verantwoording blijft gelden en staat hierboven onder *Gesloten — vindplaats*: punt 2
en 3 zijn regelkringen bovenop punt 1, en een trede bovenop een te lage basis landt nog steeds
onder de norm. Daarom ging de basis eerst.

## Meetlat

Bij ELKE bouw draait dezelfde weekvorm-as opnieuw, en gaan de cijfers in `HANDOFF.md`. Geen
nieuwe as per ronde — dezelfde as, zodat de reeks over de stappen heen vergelijkbaar blijft.

De as draagt ZEVEN vormen en DRIE rijen: kwaliteitsminuten, week-TSS en het AANTAL
kwaliteitsdagen. Die derde rij is er bij stap 1b bij gekomen en is geen sier: het greedy-defect
kostte een weekvorm een hele kwaliteitsdag terwijl de minuten maar 10 procent zakten. Op minuten
alleen oogt zoiets als ruis.

V6 meet een week IN UITVOERING (gemiste maandag, klok op dinsdag). V7 (di60 vr90 za180 zo120) is
de vorm waarin een LANGE WEEKENDDAG ZIJN BUREN BLOKKEERT — die familie zat in geen van beide
meetsets, en juist daar zat het defect. V6 en V7 staan NIET in de invariant-lijst; die blijft
V1, V3 en V5.

DE AS IS GEEN VOORSPELLING VAN WAT DE APP TOONT. Hij meet op LEGE `activities`, `weekplans` en
`wellness`; de levende D1 draagt historie, en de recency-seed kiest daardoor andere varianten
binnen dezelfde duur-band. Gemeten met de screenshot-harness, app tegenover as: V2 389 tegen
410, V4 347 tegen 362, V7 367 tegen 375 — met overal hetzelfde aantal kwaliteitsdagen, dus geen
dosisverschil maar variant-rotatie. De as blijft geldig als VERGELIJKBARE reeks over bouwen
heen; een verschil tussen as en app is geen regressie en nooit een herijk-aanleiding.

Stand na stap 1b (doel FTP, fase Base, mesoweek 1):
kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90 · week-TSS 268 / 410 / 464 / 362 / 352 /
227 / 375 · kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3.

## Parkeerlijst

Ongewijzigd van strekking en zonder oordeel over urgentie of volgorde. Deze lijst beoordeelt
niet; hij verliest niet. Een punt gaat eruit zodra een STAP het opneemt — niet eerder.

### ENGINE

- REST VAN DE VLAK-TARIEF-FAMILIE (circa 30 builders), niet naïef te behandelen: hun structuur
  draagt reps-notatie ("3x 14 min", "4x 30 sec"), dus de werkminuten zijn niet als platte
  minuten afleesbaar, en hun werkblokken liggen in drempel en anaeroob — juist de twee besmette
  zones. Vraagt per-builder werk.
- `tour_taper_z2`: drie platte regels, maar met een rust-cooldown van 5 min zonder voorafgaand
  hard blok. Besmette categorie, effect circa 1 TSS. Blijft staan.
- `genericRecovery` capt de duur hard op 60 min: een deloaddag met 90 beschikbare minuten wordt
  een rit van 60. Coach-canon, maar de resterende tijd verdwijnt stil uit het plan.
- `combo_long_with_efforts` reist mee met bouwitem 2 stap 2 en 4; `pendel_intervals` is alleen
  in een Test-week bereikbaar.
- De dode `longride`-tak in de redenCode-mapping van `planner.ts`.
- Het commentaar bij de demotie dat in een alloc-actieve week niet meer klopt.
- `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (28-03-2027).
- `kwaliteitPerWeek.Peak` staat voor doel FTP nog op 2 en draagt daarmee hetzelfde norm-gat dat
  in Base is gedicht. Niet geraakt; Base was de gemeten fase.
- DRAAGKRACHT IS EEN PROXY. Beschikbare minuten voorspellen niet wat een dag OPLEVERT: negen
  gemeten cellen — alle in Peak of op een dag boven de bibliotheekband — houden hetzelfde aantal
  kwaliteitsdagen maar leveren minder minuten. De echte grootheid is de opbrengst van het gekozen
  sjabloon. Dat koppelt de allocator aan de archetype-bibliotheek; eigen ronde.
- DE WEEKENDPAAR-PENALTY IS STAP-LOKAAL. Hij beoordeelt de kandidaat van dit moment en kan niet
  zien dat een EERDERE keuze een paar later onvermijdelijk maakt. Gemeten op fixture A: de
  pendeldag wint op draagkracht, waarna de zondag de enige overgebleven dag is. Raakt alleen
  profielen met `weekendBlok` true — vandaag uitsluitend klim, en daar is het paar volgens
  `DOELEN-SPEC` §3.4 juist de bedoelde training. Bijt wel richting AGR.
- `threshold_4x8_seiler` draagt `effectTags: ["drempel"]` en `zone: 4`, maar de core loopt op 103
  tot 108 procent FTP, dus de minuten landen in de ANAEROBE bucket: 32 anaerobe minuten en TSS 124
  op een dag van 70 minuten. Effecttag en zoneboekhouding spreken elkaar tegen.
- Gat-dag-types via meegegeven datum.

### CLIENT


- DE ELSE-TAK IN DE `plannedForDone`-TOEKENNING VAN `proposal.ts` IS DOOD AAN ZIJN INVOER. Hij
  eist `d.voorgesteldType`, en de worker schrijft `planner_days.voorgesteld_type` ALTIJD null
  (`workers/api/src/db/repo.ts:397`) terwijl de route het veld ook van de client weigert. De tak
  kan dus alleen vuren op data die de app nooit produceert. Opruimen is een GEDRAGSWIJZIGING voor
  callers die de kolom wél vullen, dus eigen ronde. Gevonden naast de bouw van punt 26.
- `GET /api/checkin/:datum` GEEFT 404 bij afwezigheid, terwijl de huisregel elders 200 met
  `null` of een lege lijst is (`/api/settings`, `/api/planner/:monday`). Cosmetisch — de client
  vangt het op — maar het is inconsistentie, en het vult de console bij elke `/schema`-load.
  De request-telling uit de harness verklaart de drie aanroepen: StrictMode-dubbelinvoke plus
  één her-derive na de sync. Geen lek.
- UP-fixture in `Preview.tsx` realistischer maken.
- Weken-terug-scrollen in de Schema-tab.
- De weekreeks-fixture staat op drie plekken.
- DE ZONE-POORT IS EEN HALVE MINUUT STRENGER DAN DE NORM. GEMETEN: een week die exact de norm levert
  in exact de bibliotheek-vorm haalt de poort op geen enkel doorgerekend dosisniveau (84, 90, 96,
  102, 108, 66, 56, 50) — hij valt telkens op minstens één zone om, omdat de drie zone-normen elk
  apart afronden (tot +0,5 minuut) terwijl de splitsing exact is. Op echte ritten niet waarneembaar.
- HET LOKALE BEELD IS NIET HET PROD-BEELD. De shot-harness toont blok 29-06 t/m 26-07 als GELEVERD,
  terwijl datzelfde blok op prod 2/3, 1/3 en 2/3 haalde. De lokale D1 draagt andere historie. Geen
  regressie en geen herijk-aanleiding, wel iets om bij elke prod-verificatie te onthouden.

### DATA

- GEMENGDE WEGING, één overgangsweek: bewaarde weekplannen van verstreken dagen houden hun oude
  getal; `workoutFromFrozenEntry` leest opgeslagen TSS verbatim. Precies zoals bij de vorige
  ijking.
- RESIDU UIT DE MEETOPZET: de ijk-query klonterde Z5, Z6 en Z7 al samen in de kruisproducten,
  dus één tarief 3,08 dekt een mix die in een gepland VO2-blok anders ligt (Daans reeks:
  60/27/12). Splitsen vraagt een NIEUWE read-only meting; uit deze data is het niet te halen.
- DE HISTORISCHE GRENZEN. Elke activiteit draagt `icu_power_zones`, maar die wordt niet per rit
  bewaard: alleen de nieuwste wint. Een zone-wijziging midden in een blok is daarmee niet te
  herleiden. Ongewijzigd geparkeerd.

### TOOLING

- DE SHOT-HARNESS LAADT UITSLUITEND `/schema`. Er is geen scenario voor de Niveau-tab en geen voor
  Instellingen, dus wat daar staat is per constructie niet te fotograferen. KOSTEN GEMETEN op
  2026-08-02: het aannames-paneel op de Niveau-tab kon niet dichtklappen — `hidden` naast een
  inline `display` — en dat overleefde 897 tests en 8 prod-shots. `apps/web` heeft bovendien geen
  render-testinfrastructuur, want `@testing-library` ontbreekt, dus er viel voor dat defect ook
  geen rood-test te schrijven. Daans oog was het enige instrument dat erbij kon.

- DE SHOT-HARNESS IS BLIND VOOR DE KLIM-DOELEN. `tools/shots/shot.mjs:267` seedt doel `"FTP"`, en
  `spreiding.effortsInLangeRit` staat uitsluitend op `klim_kort` en `klim_lang`. Er is geen enkel
  scenario voor een van die twee, dus de hele klim-tak — de lange rit met efforts voorop — is
  visueel ONVERIFIEERD; geen shot kan die sessie tonen. KORTE BEKLIMMINGEN WORDT HALF FEBRUARI 2027
  HET ACTIEVE DOEL, dus dit gat sluit zichzelf niet. Kwam binnen bij punt 15 fase 1, waar de
  zonebalk daardoor "niet toetsbaar" bleef.
