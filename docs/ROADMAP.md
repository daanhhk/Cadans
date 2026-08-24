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
doel, deze reeks draagt de stand. DE NUMMERING IS DE VONDSTVOLGORDE; de bouwvolgorde staat
onder *De volgorde*. Een punt wordt HIER gesloten, in dezelfde close-out waarin het af is.

## De reeks

Eén genummerde, afvinkbare lijst; de nummering is de volgorde waarin de punten zijn GEVONDEN,
niet de volgorde waarin ze worden gebouwd — die staat onder *De volgorde*. Elke STATUS is getoetst
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
10. **Twee kaarten spreken los over hetzelfde blok** — af · CLIENT. (`DOELEN-SPEC` §6 stap
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
    weekplan gaan door dezelfde vouwing maar over een andere populatie.
    DEEL 2 IS GESLOTEN ZONDER BOUW per 04-08-2026, verdict
    `docs/PUNT10-FASE-B-DEEL2-VERDICT.md`. Het aanbod "verschuif deze week de minuten naar
    Drempel" komt er NIET. GEMETEN over 630 cellen — 7 weekvormen maal 5 doelen maal 3
    fase-ankers maal 6 dagoffsets: de weekstem vuurt in 119 cellen, en die splitsen zonder rest.
    In 75 is er geen trainingsdag meer over, dus er valt per constructie niets te verschuiven.
    In de andere 44 is de restdag ELKE KEER `combo_long_with_efforts`, en die schrijft de
    gemelde tekortzone AL voor — nominaal label `drempel`, 30,0 tot 32,4 kwaliteitsminuten. Het
    aanbod zou dus drempelwerk vervangen door drempelwerk: NUL van de 119 cellen waarin het
    iets toevoegt. Zelfde vorm als punt 5c, en met dezelfde grond — niet "de tak is
    onbereikbaar" maar "de uitkomst is geen verbetering".
    DE ENGINE IS NIET GERAAKT en de autorisatie is niet gebruikt.
    DE WAT-ALS HAALDE EEN LIVE DEFECT BOVEN: in precies die 44 cellen toont de app vandaag een
    ONWARE zin. Dat staat als punt 27.
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
11. **De duurvermogen-meetlat** — geparkeerd met datum · DATA + CLIENT. (`DOELEN-SPEC` §6
    stap 4.) De helft die prikkel-in-de-rit heet is met punt 1 gedicht: een dag boven de
    bibliotheekband krijgt een sjabloon, en `combo_long_with_efforts` vuurt in Build en Peak
    voor het klimprofiel. De MEETLAT bestaat niet: 20-minutenvermogen na 15 kJ/kg als
    percentage van vers is nergens afgeleid; `arbeidKj` bestaat uitsluitend als weergave per
    rit (`RideDetailSheet.tsx`). Draagt óók de effect-meter van het doel korte beklimmingen dat
    punt 7 aanmaakt: `DOELEN-SPEC` §3.3 en §3.5 wijzen daarvoor dezelfde maat aan. Niet te
    verwarren met punt 8 — dat gaat over het goal-profiel in de Niveau-tab, niet over deze
    durability-maat.
    GEMETEN per 05-08-2026, ruwe uitvoer in `docs/PUNT11-MEETDATA.md` op commit `76f6747`.
    Over 183 fietsritten vanaf 2025-09-01 halen er 25 beide kandidaatdrempels (duur vanaf 90
    minuten én arbeid vanaf 15 kJ/kg) en dragen er 14 een 20-minutenvenster NÁ de drempel.
    DE DREMPEL IS EEN KLOK, GEEN GEBEURTENIS. Over alle 25 kandidaten ligt `t_ster` tussen 90
    en 125 minuten met mediaan 99. De resterende rijtijd is daarmee niets anders dan ritduur
    min ongeveer honderd, en de maat bestaat pas vanaf een rit van circa twee uur. Een
    trigger die telkens op dezelfde plek valt draagt geen informatie.
    DE MAAT IS NIET TE ONDERSCHEIDEN VAN HET RITPROFIEL. `p20_na` gedeeld door `p20_voor`
    correleert **+0,70** met `rest_min`; de mediaan van die verhouding is 0,830 bij een
    resttijd onder 60 minuten tegen 1,095 bij 60 of meer; en het beste 20-minutenblok van de
    HELE rit valt ná de drempel in 4 van de 7 lange ritten en in 0 van de 7 kortere. Die
    richting is OMGEKEERD aan wat duurvermogen betekent: hoe langer er nog te rijden is, hoe
    beter het late blok wordt — dat is de ritkeuze, niet de vermoeidheid.
    BEWIJSKRACHT, eerlijk: 14 ritten, één renner, observationeel. Genoeg om NIET te bouwen,
    niet genoeg om de maat af te schrijven.
    DE GELEGENHEID ONTBREEKT, NIET DE MAAT. `DOELEN-SPEC` §3.5 bindt de meting al aan een
    GEPLANDE maximale inspanning laat in de rit, en dat is `combo_long_with_efforts`. Die
    vuurt alleen bij `klim_kort` en `klim_lang` in Build en Peak, dus zolang het actieve doel
    daar niet staat is er niets te meten — en meet je de vakantierit in plaats van het plan.
    HEROPEN-VOORWAARDE, expliciet: dit punt gaat weer OPEN zodra het actieve doel een
    klim-doel is ÉN de lange rit structureel boven de twee uur ligt. Per `DOELEN-SPEC` §3.3
    tussenstap (iii) is dat het specificiteitsblok van maart–april 2027, met **2027-02-22**
    als vroegste moment.
    GEEN VOORUIT-BEDRADING. Er komt NU geen `arbeid`-kolom in `activities` en geen afgeleide
    zonder lezer. De regel van deze ROADMAP dat vooruit-bedrading dode code met een nettere
    naam is, geldt hier onverkort: een kolom die pas over een half jaar een lezer krijgt, is
    een half jaar lang een migratie die niets doet en toch onderhouden moet worden.
    M39 blijft OPEN — nu met een REDEN en een DATUM in plaats van een open vraag.
12. **Doel-passendheid** — af · CLIENT + DATA. (`DOELEN-SPEC` §6 stap 6.) De coach stelt een
    passend doel voor als het ingestelde doel niet binnen de uren past; afwijsbaar, hoogstens
    één keer per blok op een blokgrens. GEMETEN: er bestaat vandaag geen enkel mechanisme.
    Hangt aan punt 4 (af) en aan punt 7 — zonder herziene doel-lijst wijst een voorstel naar de
    verkeerde doelen.
    SPEC: `docs/PUNT12-BOUWDOC.md`, met de urenvloeren per doel, de vier trigger-voorwaarden,
    de zeven rood-plekken en de acceptatie.
    RAAKVLAK DATA erbij: het ANTWOORD op de kaart wordt bewaard op `sync_state`, dus er komt
    een migratie `0010` bij met `doel_passend_blok` en `doel_passend_doel` — spiegel van
    `dosisTredeBlok` en `dosisTredeDoel`. Alleen "nee" hoeft bewaard: na "ja" past het doel en
    kan de kaart per constructie niet meer vuren.
    AF per 04-08-2026 en LIVE op Worker Version `96c5a356-7d90-481a-b77a-c0fe91c8ac19`. Drie
    commits: `ed86ef9` het bouwdoc (`docs/PUNT12-BOUWDOC.md`, de spec), `6356221` data plus
    worker, `293aa60` client plus harness. Migratie `0010_uneven_scarlet_spider.sql` lokaal én
    remote toegepast — precies twee ALTER TABLE-statements op `sync_state`.
    DE PURE MODULE IS `apps/web/src/lib/doelpassend.ts`: daar staan de vloeren (Korte
    beklimmingen 5, Lange beklimmingen 6, Conditie 4; FTP en Onderhoud geen), de vijf losse
    poorten, de FULL-REPLACE-veilige settings-patch en de kaart-precedentie. Die laatste twee
    landen daar en niet in JSX, want `apps/web` heeft geen render-testinfrastructuur.
    GEMETEN: zes rood-patches, elk precies één assertie; instrument geijkt op 93 van 93; VOOR
    tegen NA 85 identiek en 8 verschillend, alle acht in het nieuwe scenario `doel-passend`.

13. **Na het event volgt geen herstel** — fase A af · fase B geparkeerd · ENGINE plus CLIENT. De maandag ná de raceweek
    levert de doel-cyclus weer een opbouwfase: de `Recovery`-tak van `eventFase_` kijkt alleen
    binnen de HUIDIGE week, dus zodra de race in de vorige week ligt is er geen herstel meer.
    GEMETEN met AGR op 2027-04-17: op maandag 2027-04-19 geeft de keten "Build". Er staat een
    assertie op die de huidige toestand PINT en expliciet NIET beweert dat hij goed is.
    DRAAGT ÓÓK DE VRAAG OM EEN NIEUW DOEL na het event: een blok dat op een event eindigt laat de
    gebruiker daarna zonder richting achter, en dat is hetzelfde gat — het herstel en de nieuwe
    doelvraag horen in één kaart en worden samen opgelost. Kwam binnen tijdens punt 9 fase B,
    waar de bevestigingspoort aanvankelijk óók over `Recovery` lag. Raakt `DOELEN-SPEC`.
    GEMETEN 05-08-2026, chat-zijde, spec `docs/PUNT13-RECON.md`. Op Daans eigen weekvorm
    (ma45 di60 do60 za120) met AGR op 2027-04-17: 17-04 Recovery TSS 21, 18-04 Recovery TSS 0,
    en 19-04 een VOLLE Peak-week met TSS 262, high 51 en anaeroob 14 — VO2 Hill Repeats 9x90s
    op dinsdag en een efforts-rit van 120 minuten op zaterdag, twee dagen na 240 km met 2960
    hoogtemeters. BIJ EEN ZONDAGRACE IS HET HERSTEL EXACT NUL HELE DAGEN. Drie tegenwerpingen
    zijn gemeten en vallen weg: de mesocyclus vangt het niet op (mesoWeek 4 op die maandag in
    3 van de 12 doelStart-datums), het geldt bij alle vijf doelen (Onderhoud levert er met
    high 84 de meeste), en een herstelweek alleen is niet genoeg — daarna volgen 26-04 Peak
    265, 03-05 Peak 272 en 10-05 een Test-week voor een doel waarvan het event geweest is.
    HET PUNT SPLITST IN TWEE FASES, EN DAT IS EEN NORM-KWESTIE. Herstel is een CONSTATERING
    over een rit die al gereden is, dezelfde categorie als de taper-overlay, en hangt daarom
    NIET aan een bevestiging — dezelfde fout lag bij punt 9 fase B al een keer over `Recovery`.
    Het nieuwe doel is wel een KEUZE en valt onder M10, M11 en M51. Ze horen op een SCHERM,
    nooit aan een KNOP. FASE A (ENGINE): het herstelvenster wordt ZEVEN DAGEN na de A-race,
    herkomst BELEID — er staat geen A-race in de historie, dus er is geen reeks te
    bemonsteren. Een DAGEN-venster maakt de duur onafhankelijk van de weekdag van de race; een
    weekregel verplaatst die willekeur alleen. FASE B (CLIENT plus DATA): de doelvraag na het
    event, op het patroon van `eventOvername.ts` en `doelpassend.ts` met een migratie `0011`;
    ONTWORPEN EN GEPARKEERD in `docs/PUNT13-RECON.md` §12 t/m §14, want zonder herstelvenster
    is er geen moment om de vraag aan op te hangen. Fase B raakt punt 28.
    FASE A AF op `c6fc4f629dedb20d410eabeb8a1b2c762be7f066`, live op Worker Version
    `03a3bc9e-7bad-4c1f-9576-729e9aad2f63`. `A_HERSTEL_DAGEN` staat op 7 in
    `packages/engine/src/phase.ts`; de Recovery-tak meet nu een DAGEN-afstand met `Math.round`
    in plaats van de weekgrens. GEMETEN EFFECT: de week van 2027-04-19 gaat van TSS 262 met
    high 51 en anaeroob 14 naar TSS 79 met high 0 en anaeroob 0, en 2027-04-26 hervat normaal
    op 265.
    ER GING EEN POORT MEE DIE NIET IN DE OORSPRONKELIJKE DIAGNOSE ZAT: de overname-kaart
    vuurde AL binnen het herstelvenster en vroeg "gaat je doel mee naar AGR" op de dag dat AGR
    gereden was — `eventOvername.ts` poort (3b), conditie `eventMacroFase === "Recovery"`.
    Zonder die poort had fase A dat defect VERBREED van 1 naar 3 van de 4 gemeten peildagen.
    FASE B (de doelvraag na het event) is ONTWORPEN EN GEPARKEERD in `docs/PUNT13-RECON.md`
    §12 t/m §14 en staat NIET meer in de reeks; hij raakt punt 28.
    VALKUIL VOOR EEN VOLGENDE PREMISSE-GREP: een grep op `weekStartDate` in `phase.ts` geeft
    nog ÉÉN treffer, maar dat is COMMENTAAR dat documenteert wat er stond — geen aanroep. De
    import is vervallen. Toets dus op een aanroep en niet op het woord.
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
16. **De goedkope bereik-prikkel** — GEBOUWD 21-08-2026, BEREIK 15 VAN 420 · ENGINE plus norm. Een prikkel boven de drempel die
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
    GEMETEN EN GECORRIGEERD per 07-08-2026, chat-zijde, docs-only. De volledige meting staat in
    `docs/PUNT16-RECON.md`; alles hieronder is gedraaid, niet gelezen.
    DRIE PREMISSEN HIERBOVEN ZIJN WEERLEGD. De bouwer van `combo_ss_sprints` is NIET volledig: van
    de drie wees-combo's dragen er 0 van de 3 `blokken`, 0 van de 3 `intent`, en alle drie zetten
    hun TSS als `mins` maal een factor in plaats van uit de blokken — exact de drie defecten die
    punt 15 elders heeft gerepareerd. Het regelnummer is `planner.ts:2777`, niet 2583. En de
    norm-vraag onder (ii) is ACHTERHAALD door punt 17: er bestaat geen doel-brede norm meer, de
    referent is plan-relatief. NUL producenten klopt wel.
    DE ROUTE IS DE VULDAG, NIET DE DUURDAG. De duurdag is bij Onderhoud niet alleen 's winters
    dicht maar per constructie: `effectiveMacroFase_` geeft voor profiel-id `onderhoud` ALTIJD
    "Base", gemeten 120 van 120 cellen. De tussenruimte-regel maakt zelf een Z2-dag zonder
    `archetypeId` en zonder werkzone-label: 70 van 120 Onderhoud-cellen dragen er minstens één,
    duur 45 / 59 / 60 (min / mediaan / max). Dat is de aanhechtingsplek — en tegelijk de dag die
    `DOELEN-SPEC` §3.2 als herstel beschermt.
    HET BLOKKERENDE GETAL. Een sprintblok van 6x15s is 1,5 anaerobe werkminuut; `Math.round`
    maakt daar een eis van 2 van, dus de meetlat vraagt 33 procent MEER dan het plan voorschrijft.
    Een tekort van 4,5 seconde kantelt het blok van 3 van 3 geleverd naar 0 van 3, en dan geeft
    `dosisTredeVoorstel` null en kan de trede niet stijgen.
    DE PLATEAU-TOETS FAALT. Getolereerd uitvoeringstekort naar prikkelomvang: 60 procent bij 1,25
    minuut, 0 procent bij 1,5 én bij 2,5, monotoon en nooit nul vanaf 3. Alles onder circa 3
    minuten bemonstert afrondingsruis.
    DE BOUW DRAAGT TWEE TERMEN IN ÉÉN RONDE. (i) Een materialiteitsvloer op de poortset — een
    werkzone telt pas mee vanaf N plan-minuten — met anker M64 (NORM), uitgebreid naar de
    blok-laag zoals punt 17 dat voor M63 en M64 al verantwoordde. (ii) De prikkel zelf, in de
    generieke vuldag-bouwer, MET `blokken`, MET `intent` en met TSS uit `tssFromBlokken_`; de
    wees-combo's worden niet gereanimeerd. De vloer ALLEEN is vandaag inert — 0 van 1095
    beoordeelde zone-cellen draagt een plan onder 3 minuten — en dus vooruit-bedrading; de prikkel
    alleen zet het blok-oordeel op een muntworp. N wordt in de bouwronde geijkt op de as "hoeveel
    blok-cellen kantelen bij welke N", en NOOIT hier gekozen.
    **GEBOUWD per 21-08-2026 in `5f8a63c3050511bd786720432008cd621647ff77`, en het bereik hoort in
    dezelfde adem.** De prikkel is 6 herhalingen van 30 seconden op 150 procent FTP — 3,0 anaerobe
    werkminuten — op ÉÉN vuldag per week, en hij landt in **15 van de 420 gemeten weken**. Zonder
    de ruimte-ondergrens zouden dat er 294 zijn; de set kost 25,5 minuten inclusief herstel en die
    passen niet in de endurance-fill van een typische vuldag. Dit punt leest dus als AF terwijl het
    in circa 4 procent van de weken vuurt — correct begrensd, nauwelijks werkzaam.
    DE VLOER staat als `MATERIALITEIT_MIN_MINUTEN` op `apps/web/src/lib/blok.ts:46`, toegepast in
    `poortsetVoorWeek_` (`:415`) zodat BEIDE aanroepers gedekt zijn, met N gepind op **4**. GEIJKT
    over de as 0 tot 10: geen enkele N verandert het geleverd-oordeel (105 van de 105 bij
    uitvoeringsschaal 1,00 en 78 bij 0,95, over de HELE as). Wat N wél doet is de anaerobe poort
    dichthouden op weken waar alleen de prikkel anaerobe minuten levert — 9 weken en 9 zone-cellen
    tussen N 3 en 3,5. De vloer is dus een POORT-effect en geen oordeel-effect. De voorspelling
    hierboven dat de vloer inert zou zijn, is daarmee bevestigd voor het OORDEEL en weerlegd voor
    de POORT.
    **TWEE OPEN VERVOLGVRAGEN, coach-canon en niet door een chat te beslissen:** (1) moet de set
    korter, of moet de ruimte anders gevonden worden, gegeven een bereik van 15 van de 420;
    (2) blijft de vloer staan nu vaststaat dat hij geen oordeel raakt.
17. **De norm is voor de klim-doelen onbereikbaar** — af · NORM plus BIBLIOTHEEK. GEMETEN op
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
    GEMETEN EN AFGEBAKEND per 04-08-2026, chat-zijde, docs-only.
    DE PREMISSE IS GECORRIGEERD, en dat is de VIJFDE correctie in de punt-15/17-lijn: de norm is
    NIET onbereikbaar in MINUTEN. De ENVELOPPE — de beste sjablonen die de bibliotheek op die
    dagduren kan leveren, gemeten met de kandidaat-regel uit `goalWorkout_` zelf — geeft op Daans
    eigen vorm ma45 di60 do60 za120 een 96 tegen een norm van 52, en op V1 (ma60 di60 do60 za120)
    een 132 tegen 78, 90 en 102. Beperkt tot de LEIDENDE intent van het doel is het 40 en 60, en
    DAAR is het onder norm op elke trede, in Build ÉN Peak.
    WAT WEL ONBEREIKBAAR IS: de norm in het KARAKTER dat het doel voorschrijft. De meetlat telt
    MINUTEN en is blind voor karakter, terwijl kort en hard werk per definitie weinig minuten
    kost. Op een dag van 60 heeft de vo2-pool 6 kandidaten met maximum 20 en gemiddelde 14,3
    werkminuten, tegen een eis van 26 per prikkel; drempel geeft daar 34,4 en sweetspot 36.
    Nominale medianen over de bibliotheek: vo2 20, drempel 32, sweetspot 36. Plafonds: vo2 31,
    drempel 42, sweetspot 60.
    DE BIBLIOTHEEK-ROUTE IS GEMETEN EN AFGEWEZEN. Het enige vo2-sjabloon dat 31 haalt is
    `vo2_sandwich`, en dat doet het met 8 WERKELIJKE vo2-minuten verpakt in 20 tempo-minuten
    (gepind in `HANDOFF.md`). Vo2-sjablonen bijbouwen die 26 of meer dragen kan dus alleen door
    de prikkel te VERDUNNEN, en dat gaat regelrecht tegen `DOELEN-SPEC` §3.3 in. Het antwoord op
    de vraag die dit punt openzette is daarmee: de NORM, niet de bibliotheek.
    DE ASYMMETRIE IN DE CODE. `bibliotheekSignatuur` leidt de VORM van de norm af uit de
    bibliotheek (gemeten tempo 0,2821 · drempel 0,5625 · anaeroob 0,1554), terwijl de SCHAAL —
    `KWALITEIT_MIN_PER_PRIKKEL` in `packages/engine/src/utils.ts`, FTP 28, Onderhoud 22, de rest
    26 — geen afleiding én geen herkomst-label draagt. Dat schendt de eigen regel dat elk getal
    PLAN, SIGNAAL of BELEID draagt.
    WELK MECHANISME BIJT. NIET de per-zone-poort van punt 14 — die laat een vo2-week juist door.
    Het is de TOTAAL-eis van punt 15 fase 2 (`werkTotaal >= gevraagd`,
    `apps/web/src/lib/blok.ts:550`), die tempo, drempel en anaeroob OPTELT en tegen een
    doel-breed getal legt. Punt 17 zit exact op die naad.
    DE SCHADE, MET DATUM. `dosisTredeVoorstel` geeft `null` tenzij de check
    `geleverd_gestegen` of `geleverd_niet_gestegen` leest. Vanaf 2027-02-22, wanneer Korte
    beklimmingen het actieve doel wordt, leest het A-doel dus ELK BLOK "niet geleverd" terwijl
    het plan exact is uitgevoerd — en de dosis-trede kan per constructie nooit stijgen.
    HET ANKER IN DE COACH-CANON. M63 (NORM) in `docs/TRAININGSMODEL.md` stelt dat het tekort het
    VERSCHIL is tussen wat bedoeld was en wat geleverd is, naar rato bij een half uitgevoerde
    sessie; M64 (NORM) stelt dat alleen een gemiste SLEUTELSESSIE een ingreep rechtvaardigt. De
    referent is daarmee canoniek PLAN-relatief. LET OP DE GRENS: beide regels zijn geschreven
    voor de WEEK-laag; ze op de BLOK-check toepassen is een UITBREIDING en geen citaat, en hoort
    als zodanig verantwoord te worden.
    WAT DE VOLGENDE RONDE MEET, en pas daarna wordt er iets gespecificeerd: de wat-als waarin de
    totaal-eis tegen het PLAN van die week meet in plaats van tegen het doel-getal. Twee vragen
    erbij, want zonder die twee is de reparatie te ruim. (1) Haalt de per-zone-poort een GRIJS
    gereden week dan nog om? (2) Loopt de dosis-trede daarmee in vier blokken naar het plafond,
    en is dat de bedoelde uitkomst? PRECEDENT dat dezelfde kant op wees en al gemeten is: punt 10
    fase B deel 1 meet de weekstem bewust tegen het BEVROREN plan, omdat het plan de blok-norm in
    2 van de 105 cellen haalt en op de echte reeks in 3 van de 46 weken.
    DE WAT-ALS IS GEDRAAID per 04-08-2026, chat-zijde, over 405 blok-cellen en 1215 beoordeelde
    weken; spec in `docs/PUNT17-BOUWDOC.md`. DE PREMISSE HIERBOVEN IS WEERLEGD: niet de
    totaal-eis bijt maar de per-zone-poort. Bij Korte beklimmingen valt in Build 37 van de 81
    weken op BEIDE eisen en 15 op de ZONES ALLEEN, nul op het totaal alleen; de SMALLE wat-als
    tilt het geheel van 261 naar 275 van 405 en laat dit doel op 36 van 81 staan, NUL
    kantelingen. DE EIGENLIJKE VONDST STAAT LIVE EN WIJST DE ANDERE KANT OP: de huidige regel
    leest een blok waarin 25 procent van drempel plus anaeroob naar tempo verschoven is in 286
    van 405 cellen als GELEVERD, bij 50 procent nog in 88, en een blok dat op 0,7 maal het plan
    gereden is in 96. Oorzaak is de SCHAAL van de zone-norm: `normTempo` is dosis maal 0,2821,
    een bibliotheek-gemiddelde, terwijl V1 in Build bij dit doel 4,0 plan-tempo draagt tegen een
    normTempo van 22. ANTWOORD OP VRAAG (1): met de BREDE regel — zones EN totaal tegen het plan
    van die week — leest grijs 25, 50 en 100 procent 0 van 405, 0,7 maal 0 van 405, en exact
    volgens plan 405 van 405. ANTWOORD OP VRAAG (2): het plan groeit in 45 van 45 gemeten cellen
    mee met de trede, plus 10,7 tot plus 37,6 werkminuten van trede 0 naar 4, dus de hendel is
    niet leeg; het plafond in vier blokken is zestien weken met vier aparte bevestigingen, zoals
    `DOELEN-SPEC` paragraaf 2A vastlegt. HET GAT DAT MEE MOET: een week zonder eigen bewaard
    plan heeft plan-totaal 0 en leest triviaal geleverd, 405 van 405; `telt` eist voortaan ook
    het eigen plan, en dat kost gemeten nul beoordeelbare cellen. ANKER: M63 (NORM), met de
    grens dat toepassing op de BLOK-laag een uitbreiding is van een WEEK-regel.
    AFGEROND per 05-08-2026 en LIVE. Het oordeel is PLAN-RELATIEF op BEIDE eisen: de per-zone-eis
    legt de geleverde minuten van elke voorgeschreven zone langs de PLAN-minuten van die zone in
    die week, en de totaal-eis legt de werktotaal langs de PLAN-werktotaal van die week. Het
    doel-brede richtgetal is geen rechter meer; `blokDosisNorm` bestaat ongewijzigd voort als
    DOSIS-DOEL voor het plan en de trede-kaart.
    HET OORDEEL VALT OP DE GETOONDE HELE MINUTEN. De tolerantie-constanten — `MEETKORREL_MIN`,
    `PLAN_TOLERANTIE_ZONE_MIN` en `PLAN_TOLERANTIE_TOTAAL_MIN` — zijn VERVALLEN. Grond: het scherm
    toont hele minuten, dus een meetlat die fijner onderscheidt spreekt de kaart tegen. GEMETEN op
    het doel-passend-scherm stond er `VO2max 8/8` naast een teller `0/2` en `VO2max 16/16` naast
    `1/2`; na de wijziging lezen die 1/2 en 2/2 terwijl de getoonde cijfers geen haar bewogen. Het
    totaal rondt ÉÉN keer af, op de SOM, nooit op de delen.
    DE POORT OP `telt` DRAAGT TWEE EISEN: `poortHerkomst` gelijk aan "week" ÉN `plan.werk > 0`.
    Allebei aantoonbaar LEVEND: draai er één weg en T5 in `punt17.test.ts` valt. Die tweede eis is
    er op meting bijgekomen — de poortset komt uit de LABELS en het plan uit de BANDEN, dus een
    entry met labels zonder banden gaf herkomst "week" bij een plan van nul en las TRIVIAAL
    geleverd.
    Commits `18cc242` (het plan als referent) en `1fd047f` (de getoonde minuut); bouwdoc
    `docs/PUNT17-BOUWDOC.md` op `6a4d3ef`.
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
19. **Het dagtype weekend is een kalendernaam, geen eigenschap** — af, GESLOTEN ZONDER APARTE BOUW · ENGINE. `deriveDagtype`
    (`apps/web/src/lib/planner.ts:18`) leidt het type af uit za/zo, terwijl de gebruiker alleen
    pendel, trainen en minuten opgeeft; `assignWorkouts` geeft weekend- en vrije dagen daarna
    verschillende per-dag-takken. Een deload-zaterdag en een deload-vrijdag van dezelfde lengte
    lopen dus door verschillende takken. Bereikbaar op de dagen waar de allocator niet komt:
    verstreken, gereden, taper- en deload-uitgesloten. In strijd met `DOELEN-SPEC` §2A — duur is
    een eigenschap van de dag, de kalendernaam is dat niet. EERST METEN wat het verschil in de
    praktijk oplevert, dan pas bouwen: de takken zijn via `buildWeekProposal` grotendeels
    onbereikbaar, dus het kan zijn dat er niets aan hangt. Raakt `DOELEN-SPEC`.
    VERDICT 08-08-2026: GESLOTEN ZONDER APARTE BOUW, want de meting maakte dit punt een SYMPTOOM.
    Volledige uitwerking in `docs/PUNT19-DELOAD-RECON.md`.
    GEMETEN over 2100 weken en 8700 dag-cellen, met een A/A-ijking van 0 afwijkende cellen: de
    label-flip weekend naar vrij raakt **369 cellen over 291 weken**, en die splitsen zonder rest
    in twee families. **324 cellen** zitten in de DELOAD-tak — 49680 tegen 19440 minuten, TSS 35640
    tegen 6804. De overige **45** zijn het allocator-weekendpaar, uitsluitend op V7 bij korte (33)
    en lange (12) beklimmingen, dus precies de twee profielen met `weekendBlok` true; die rust op
    `DOELEN-SPEC` §3.4 VASTGESTELD en is BUITEN SCOPE.
    TWEE PREMISSEN VAN DIT PUNT ZIJN WEERLEGD. Verstreken en gereden dagen bereiken de takken
    nooit — `apps/web/src/lib/proposal.ts:528` geeft `assignWorkouts` uitsluitend `tePlannen` mee —
    en de taper-tak behandelt vrij en weekend in ÉÉN conditie (`packages/engine/src/planner.ts:817`),
    gemeten op 0 verschillen over 420 Recovery-weken. Van de vier genoemde routes leeft alleen de
    deload-tak.
    WAT ER VANDAAG ECHT VERDWIJNT: op weekenddagen 0 minuten, op doordeweekse dagen 1482 minuten
    over 76 dagen, en op Daans eigen weekvorm NUL. De kalendernaam werkt vandaag dus eerder MEE dan
    tegen — hij houdt de lange rit overeind die anders óók zou sneuvelen.
    GAAT OP IN PUNT 39. De echte fout ligt niet in het label maar in WAAR de dosisverlaging landt;
    de kalendernaam-splitsing is daar één van de twee hendels.
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
21. **De push-beschrijving draagt dezelfde ruis** — af, GESLOTEN ZONDER BOUW · ENGINE, transport-nabij.
    `buildWorkoutDescription_` (`zones.ts:613`) zet `totaalMin` RAUW in de beschrijving die naar
    intervals.icu gaat, en hergebruikt daarin dezelfde blokstrings die punt 18 client-zijde heeft
    opgemaakt. Wat Daan in de app ziet klopt dus, en wat in zijn agenda en op zijn fietscomputer
    belandt niet. DE FIX IS HIER NIET DEZELFDE: dit is geen renderrand maar TRANSPORT, en dezelfde
    tekst wordt door `dslBlockFromRow_` geparseerd — een Nederlandse komma verminkt de laps. Eigen
    ronde, RECON-FIRST: eerst meten wie die string leest en schrijft, dan pas een vorm kiezen.
    LET OP, GEMETEN BIJ PUNT 20: `buildWorkoutDescription_` is na de `return` op `push.ts:87`
    alleen bereikbaar als ZWO ÉN DSL allebei falen, en `zwoStepFromRow_` gaf over de hele
    populatie 0 keer `null` — vóór én na de fix. Deze tak is dus vermoedelijk DOOD. Meet eerst de
    BEREIKBAARHEID voor er iets gebouwd wordt; een fix in een tak die nooit vuurt is geen fix.
    VERDICT 07-08-2026: GESLOTEN ZONDER BOUW. Gemeten over 5 doelen maal 11 weekvormen maal 13
    doelStart-offsets maal 5 dosis-treden — 3575 weken, 15275 sessies, 64951 structuur-rijen,
    dekking Base 1815 / Build 880 / Peak 660 / Test 220 en mesoweek 1 t/m 4 alle vier bezet.
    ZWO gelukt 15275 van de 15275; DSL-terugval 0; description-tak 0; lege `structuur` 0. Op
    rij-niveau `zwoStepFromRow_` null 0 van 64951 en `dslBlockFromRow_` null 0 van 64951, en met
    `buildEventPayload` zelf gedraaid over de JSON-grens die de client passeert: description-
    fallback in 0 van de 15275 payloads. DE PREMISSE VAN DIT PUNT WAS TE SMAL: punt 20 mat de
    RIJ-poort, terwijl beide bouwers óók uitvallen op een LEGE `structuur` zonder ooit een
    rij-parser aan te roepen — die tweede poort was nooit gemeten en geeft eveneens nul.
    EN DE NOEMER IS NIET 15275 MAAR ZEVEN: de parser krijgt 7 distincte duur-vormen binnen
    (`N min`, `N.N min`, `Nx N.N min`, `Nx N min`, `Nx N sec`, `Nx Nmin`, `Nx N.Nmin`) en 1
    vermogensvorm (`N-NW`, 64951 van de 64951), en `planner.ts` kan er per constructie geen
    achtste maken — de duurcel loopt via `+ " min"`, `+ " sec"`, `+ "min"` en het
    herhalings-voorvoegsel, de vermogenscel heeft één producent (`wattsRange`). Een andere
    variant levert dezelfde zeven vormen met andere getallen, dus de lege-`activities`-beperking
    van de as kan dit niet omgooien. DE TAK BLIJFT STAAN: hij is aangeroepen (`push.ts:92`) en
    getest, hij vuurt alleen nooit — opruimen zou de laatste terugval weghalen bij een
    parser-wijziging die hem juist nodig kan maken.
22. **De rit-sheet is voor geen enkele DOM-ingreep bereikbaar** — af · TOOLING.
    `RideDetailLink.tsx:30` rendert de sheet met `{open && ...}`: hij staat pas ná een klik in de
    DOM. De leespas van de harness opent `hidden` en inline `display`, maar wat er niet IS valt
    daar per constructie buiten. Dit is de DERDE manier waarop inhoud buiten het net valt, na die
    twee. Vandaag gedekt door de code-regel (geen kaal getal) en niet door de camera. Wil je hem
    onder het net brengen, dan moet de harness klikken — en dan hoort er ook een assertie bij dat
    de sheet daadwerkelijk open kwam.
    AF op `6798f16`. De harness klikt nu. Shot `16-ritdetail` in `tools/shots/shot.mjs`, in
    `sweep()` NA de `EXTRA_ROUTES`-lus zodat alle bestaande shots geschoten zijn voordat er weg
    genavigeerd wordt — hij draait op `v7` en in prod-modus.
    DE SELECTOR IS GEMETEN EN NIET GERADEN: `main button[style*="flex-direction: column"]` geeft
    **50 treffers tegenover 51 buttons** in het document; alleen "Meer laden" valt af, want die
    draagt `RETRY_BTN` en niet de `cardStyle` van `Activiteiten.tsx:179`.
    DE ASSERTIE BEWIJST DE TOESTANDSOVERGANG EN TELT GEEN INCIDENTEEL AANTAL: **nul** elementen
    met `aria-label="Sluiten"` vóór de klik, **twee** erna, en beide andere takken uitgesloten
    doordat "Ritdetails laden…" en "Ritdetails konden niet geladen worden." afwezig zijn. Omdat
    `fase.s` precies drie uitputtende, elkaar uitsluitende takken kent — `loading` op
    `RideDetailSheet.tsx:163`, `error` op `:177`, `ready` op `:194` — staat de sheet daarmee per
    constructie op READY. Het label is uniek op PAGINA-niveau en niet op element-niveau: de sheet
    draagt er zelf twee (`:104` de scrim, `:143` de sluitknop).
    OP PROD EVENEENS DE READY-TAK, met echte inhoud: `INTERVALLEN`, `FTP 280 W`, `Z2`,
    `75:06 · 146 bpm · 66% FTP`, plus de vermogen- en HR-grafiek.
23. **Twee shots zijn niet byte-deterministisch** — af · TOOLING. `v7/09-vorm` en
    `v7/10-trainingen` verschillen tussen twee runs van ONGEWIJZIGDE code, met telkens identieke
    `innerText`; het verschil is dus puur pixel. VERMOEDEN: een animatie of overgang die `settle`
    niet uitzit — beide schermen dragen bewegende elementen die de andere zeven niet hebben.
    Zolang dit staat moet elke PNG-vergelijking die twee UITSLUITEN, en dat is een gat in het
    begrenzingsbewijs: juist op die twee schermen kan een regressie ongezien blijven.
    AF op `6798f16`. DE OORZAAK IS GEMETEN EN HET WAS NIET WAT DIT PUNT VERMOEDDE.
    `reducedMotion: "reduce"` stond al op `shot.mjs:1084` en is per constructie INERT: de app
    draagt 0 `prefers-reduced-motion`-regels en 0 `@keyframes` in heel `apps/web/src`, dus er is
    niets voor die vlag om uit te zetten. De drager is `ProgressRing.tsx:63` — een
    `stroke-dashoffset`-transitie van 1,1 s met 250 ms aanloop (`:13`), samen 1350 ms tegen de
    800 ms die `settle` afwacht. Hij hangt via `ReadinessCard` aan precies `/vorm` en
    `/trainingen`, en verandert geen letter `innerText`. Dat verklaart alle drie de eigenschappen
    van het verschijnsel: welke twee schermen, waarom puur pixel, en waarom `settle` het miste.
    GEREPAREERD met een wacht op `document.getAnimations()` (`running` of `pending`) vlak vóór
    `page.screenshot`, met een bovengrens van 5000 ms die GOOIT in plaats van stil doorloopt. De
    plaatsing is `capture()` en niet `settle()`: een viewport-wijziging kan zelf een transitie
    opnieuw aanzetten, en de zeven dagshots roepen `settle` helemaal niet aan.
    ROOD-TOETS: `anim=1` op precies `v7/09-vorm` en `v7/10-trainingen`, `anim=0` op de andere 94
    — 2 van de 96. De wacht is dus niet inert, en de twee schermen die dit punt aanwees zijn
    exact de twee die een lopende animatie dragen.
    UITSLAG: het ijkpaar MÉT de fix gaf **96 van de 96 identiek, nul uitsluitingen**. DE
    UITSLUITING VAN `v7/09-vorm` EN `v7/10-trainingen` VERVALT en de noemer is voortaan compleet.
24. **De mount-flake, en zes routes zonder vangnet** — af · TOOLING. `settle` geeft op terwijl de
    `innerText` nog "Laden…" is; de shot toont dan een ladende pagina. Treft BEIDE harness-versies,
    dus het is geen gevolg van een bouw. Op `/schema` wordt het opgevangen door de
    zeven-knoppen-assertie op de dagstrip — die faalt hard en de run stopt. De zeven nieuwe routes
    hebben zo'n mount-assertie NIET, dus daar zou een ladende pagina stil als geldige shot
    doorgaan. Elke route hoort een eigen goedkope aanwezigheids-assertie te krijgen.
    AF op `6e62a650b365028e20303f1017aa8ef9e12b4396`. `settle` gooit sindsdien op een pagina die
    NA afloop nog de laadtekst toont, en elke aanroeper geeft een LABEL mee zodat de fout de plek
    noemt — de bewijsweek, de warmloop van een dagOffset, het weekscherm of de route uit
    `EXTRA_ROUTES`. Het oordeel valt op de TOESTAND na `settle` en niet op de time-out: de
    bestaande `catch` blijft slikken, zodat een pagina die tijdens de laatste 800 ms alsnog
    opklaart niet omvalt.
    AFWIJKING VAN WAT DIT PUNT ZELF VOORSCHREEF, met de grond. Er komt GEEN
    aanwezigheids-assertie PER ROUTE. Dat zou een handlijst zijn, en handlijsten drijven af — een
    nieuwe route wordt vergeten en valt stil buiten de controle, precies het patroon dat
    `EXTRA_ROUTES` al had. Alle acht route-componenten renderen BYTE-IDENTIEK dezelfde laadtekst
    (`Schema.tsx:132`, `Vorm.tsx:93`, `Trainingen.tsx:123`, `Niveau.tsx:164`,
    `Activiteiten.tsx:58`, `Instellingen.tsx:535`, `Weekplanner.tsx:377`, `Events.tsx:542`), dus
    er bestaat één eigenschap die ÉLKE kandidaat draagt. Eén poort volstaat.
    ROOD PER KANT, beide meldingen letterlijk. Met de controle ACTIEF stopt de run op
    `ROOD24 /vorm: still loading after settle — the page never finished; a shot here would be a
    photo of a spinner`. Met uitsluitend die throw UIT loopt `settle` gewoon door en meldt de
    tegenmeting `ROOD24-ZONDER-FIX: settle keerde terug op een ladende pagina; laadtekst
    aanwezig=true`. Dat `aanwezig=true` is de bewijskant.
    INERT OP EEN GOEDE RUN: 0 van de 288 `.txt` in de recon en 0 van de 192 in de bouwronde
    dragen de laadtekst. Deze poort kost dus niets en vangt alleen wat er nu stil doorheen glipt.
25. **`12-activiteiten` wordt afgesneden** — af · TOOLING. Die pagina heeft 5898 pixels nodig
    tegen `HEIGHT_CAP` 4000, dus de PNG is afgekapt en een VISUELE controle van dat scherm kan
    vandaag niet. De `innerText` in de `.txt` is wél compleet, dus tekstuele controle en het
    float-net werken er gewoon. Keuze: de cap verhogen, of het scherm in stukken schieten.
    AF op `6798f16`. De cap gaat van 4000 naar **8000**, HERKOMST BELEID met de gemeten grond
    erbij: de hoogste `needed` over alle 95 shots is 5882 (dat scherm) en de op één na hoogste
    2317, dus het enige scherm dat in de buurt komt valt er ruim onder terwijl een pagina die op
    hol slaat nog steeds tegen een grens loopt. Het is een GRENS, geen doel.
    STIL AFKAPPEN WAS HET EIGENLIJKE DEFECT, niet de hoogte: een gekapte PNG liegt over het
    scherm en leest bij een byte-vergelijking als "ongewijzigd". Overschrijding is daarom nu een
    HARDE STOP met het shot-label, `needed` en de cap. Rood getoetst op een tijdelijke cap van
    1000: `01-week: de pagina vraagt 1800 px en HEIGHT_CAP staat op 1000 px. Een gekapte shot
    toont niet het scherm; verhoog de cap of splits het scherm.`, exitcode 1.
    EN DE BROWSER-KANT IS OOK GEDICHT: `assertPngSize` leest ná `page.screenshot` de eerste 24
    bytes van de geschreven PNG terug en toetst de IHDR — breedte op 16 tot en met 19, hoogte op
    20 tot en met 23, big-endian — tegen viewport maal `DEVICE_SCALE`. Die constante is uit
    `newContext` getild zodat er niet twee losse 2'en uiteen kunnen lopen.
    `v7/12-activiteiten` staat sindsdien op `used=5882 needed=5882`.
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
27. **De lange rit met efforts telt niet als sleutelsessie** — af · CLIENT.
    `combo_long_with_efforts` staat niet in `COACH_TYPE_INTENT_` (`packages/engine/src/coach.ts:28`),
    dus `intentFromType_` valt door naar de terugval-scan, herkent daar "long" en levert "duur" —
    en "duur" staat niet in `COACH_KEY_INTENTS_` (`:75`). Poort 1 en poort 2 van de
    sleutel-machinerie zien de dag daardoor niet.
    GEVOLG, GEMETEN. In 44 van de 119 vuur-cellen zegt de weekstem dat er geen trainingsdag meer
    staat om de prikkel op te pakken, terwijl er een zaterdag staat met 30,0 tot 32,4
    drempel-minuten. En het snijdt beide kanten op: een GEMISTE efforts-rit komt in 28 cellen
    voor en telt in 0 van die 28 als open sleutelprikkel, want `plannedIntent` komt uit dezelfde
    classificatie.
    VINDPATROON, één treffer: van de zes types die de planner over de meetruimte produceert is
    dit de ENIGE die een werkzone draagt en geen sleutelsessie heet. `combo_all_three` is een
    latent tweede geval maar heeft nul producenten (punt 14 fase 2).
    DE FIX IS EEN OPTELLENDE TERM op het nominale werkzone-label — een dag draagt een
    sleutelprikkel als zijn TYPE dat zegt ÓF als zijn plan `drempel` of `anaeroob` minuten
    voorschrijft. Strikt additief, dus sleutelstatus kan alleen bijkomen. `COACH_TYPE_INTENT_`
    wordt NIET aangeraakt: de rit duurt 120 tot 240 minuten waarvan 30,0 tot 32,4 werkminuten, en
    hem "Drempel" noemen zou zijn karakter op de dagkaart verkeerd weergeven. Spec in
    `docs/PUNT10-FASE-B-DEEL2-VERDICT.md` §5 tot en met §8, inclusief de vier rood-getallen.
    HARDE DATUM: half februari 2027 wordt Korte beklimmingen het actieve doel, en dan is dit de
    dag waar de weekstem elke week overheen praat.
    AF per 04-08-2026, bouw `b57d464`, LIVE op Worker Version
    `76c80e90-cbf6-4587-804e-a97c5c8e6196`.
    DRIE TERMEN, alle drie CLIENT. De optellende toets `planDraagtSleutelzone_` op `drempel` en
    `anaeroob`, toegepast op poort 2 (`openSleutelDagen`) én op BEIDE takken van poort 1 — de
    gemist-tak en de different-tak. De DONE-kant is ongemoeid gebleven: `doneIntent` is wat er
    GEREDEN is en mag een openstaande prikkel niet dichtzetten.
    De nieuwe `ProposalWeek`-parameter is VERPLICHT — een optioneel veld zou bij een aanroeper
    stil terugvallen op niets en de term dood maken zonder dat er iets rood wordt. De lookup zit
    in `blokkenVoor_`. Aanroepplekken: `weektekort.ts:79` en `:84`, `SchemaView.tsx:220` en `:222`.
    `COACH_TYPE_INTENT_` IS NIET AANGERAAKT en de engine-diff is leeg: de rit duurt 120 tot 240
    minuten waarvan 30 werkminuten, en hem "Drempel" noemen zou zijn karakter verkeerd weergeven.
    ROOD PER TERM ÉN PER TAK. R1 laat `T1` en `T2` vallen; R2 laat `T3` vallen terwijl `T4` groen
    blijft; R3 laat `T4` vallen terwijl `T3` groen blijft; R4 (tempo erbij) laat beide
    tegenproeven vallen. R2 en R3 zijn ELKAARS TEGENPROEF, dus de twee takken maskeren elkaar niet.
    DE DIFFERENT-TAK IS APART GEMETEN: 28 cellen met een te licht gereden efforts-rit, poort 1 zag
    er 0 van 28 en met de term 28 van 28. Op de WEEKSTEM is die tak inert (24 blijft 24), op het
    DAGBLOK niet (8 cellen). Dat is GEMETEN en geen gat — zoek er geen rood-test bij die niet
    bestaat.
28. **Een doelwissel herstart de cyclus niet** — af · CLIENT. GELEZEN: `doel` en `doelStart`
    zijn twee LOSSE velden in Instellingen (`apps/web/src/pages/Instellingen.tsx:713`), en
    `doelStart` heeft precies één schrijver — `apps/web/src/lib/settings.ts:95`. Er is nergens
    code die de een aan de ander koppelt.
    GEVOLG: kies je een nieuw doel, dan blijft de blok-start op de datum van de VORIGE periode
    staan, en lopen de 4-weekse mesocyclus en de 12-weekse blokcyclus daar gewoon op door. Een
    verse doelkeuze landt dus midden in een blok dat bij een ander doel hoorde.
    `DOELEN-SPEC` §3.2 KENT DIT AL, als handmatige gebruiksvoorwaarde: bij een doelwissel naar
    Onderhoud moet `doelStart` mee, anders meet de behoud-vloer tegen de instapwaarde van de
    vorige periode. Dat is precies de reden dat het hier een eigen punt wordt en geen voetnoot.
    DE VALKUIL DIE DIT APART HOUDT VAN PUNT 12: `normalizeDoel_` mapt legacy-strings —
    "Beklimmingen" wordt "Korte beklimmingen". Een naïeve koppeling ("doel gewijzigd, dus
    doelStart verzetten") zou bij een onschuldige HER-OPSLAG van dezelfde instellingen het blok
    stil terugzetten naar Base. Vraagt dus een eigen rood-test op precies dat geval.
    PUNT 12 LOST DIT VOOR ZIJN EIGEN JA-TIK AL OP en wacht hier niet op; dit punt dekt de
    HANDMATIGE doelwissel in Instellingen.
    AF op `6197d4bc7b45da0bb109038deb9afbfeb44b301c`, met het bouwdoc op `91e6597`
    (`docs/PUNT28-BOUWDOC.md`), en LIVE. Twee termen, allebei CLIENT.
    TERM 1 — DE KOPPELING. `blokStartBijDoel` in `apps/web/src/lib/settings.ts` is puur en zonder
    ambient klok: bij een wissel op maandag, dinsdag of woensdag wordt de blok-start de maandag
    van DIE week, anders de eerstvolgende maandag. Beide doelen gaan eerst door `normalizeDoel_`,
    zodat een legacy-waarde die op hetzelfde canonieke doel normaliseert GEEN wissel is. Gelijk
    doel geeft de geladen datum onveranderd terug, dus terugwisselen herstelt de oude datum. De
    weekdag-grens draagt HERKOMST BELEID en geen geijkte drempel: er staat geen doelwissel in de
    historie, dus er is geen reeks om op te bemonsteren.
    TERM 2 — DE POORT. `blokReviewVenster` geeft in de afgerond-tak `null` zodra het beoordeelde
    blok begint vóór de weekmaandag van `doelStart`. Zonder die poort zet de vorige configuratie
    via `dosisTredeVoorstel` de dosis van de nieuwe. De lopend-tak is ONGEMOEID.
    DE LETTERLIJKE OPREKKING IS GEMETEN EN AFGEWEZEN. Met `doelStart` op de wisseldag zelf lezen
    twee opeenvolgende weekmaandagen allebei blokweek 1 — de gewenste oprekking — maar kantelt
    `computeMacroPhase` MIDDEN in de week voor elke aanroeper die de DAG meegeeft, en draagt één
    blokweek dan twee verschillende blok-starts; die datum is de sleutel waaronder de
    blokgrens-kaarten hun antwoord wegschrijven. Maandag-uitgelijnd geeft dezelfde oprekking via
    de bestaande ondergrens-klem, zonder die twee gebreken.
    DE PREMISSE IS ONDERWEG GECORRIGEERD: het uitvoerings-oordeel was NIET doel-breed besmet.
    Sinds punt 17 wordt een opbouwweek tegen het BEWAARDE PLAN van die week beoordeeld, dus een
    hybride wisselweek wordt tegen zijn eigen hybride plan gelegd. Wat een wissel wél kapotmaakte
    is de FASE en de mesoweek, en daar zit M49 op.
    ROOD PER TERM: de vergelijking op de RAUWE string laat precies de twee legacy-asserties
    vallen; de poort weghalen laat precies de venster-assertie vallen.
    GEMETEN MET DE CAMERA: alle negen blokweek-1-scenario's bewegen en verliezen hun
    blok-terugblik (8 naar 0 per scenario), terwijl `v7-blokweek4` byte-identiek blijft met de
    terugblik op 8 — en `klim-weekstem`, dat dezelfde afgerond-tak draait maar waar het blok
    precies OP `doelStart` begint, houdt hem eveneens op 8. Die laatste is de negatieve controle
    die aantoont dat de poort niet alles wegsnijdt.
29. **De shot-harness controleert de draaiende dev-worker niet** — af · TOOLING. De sweep
    schiet blind: hij toetst nergens of de `wrangler dev` die op 8787 luistert bij de HUIDIGE
    repo hoort.
    GEMETEN bij punt 12 fase B: VIER NA-runs achter elkaar vielen om op
    `expected 7 day-strip buttons, found 0`. Dat was GEEN flake — de draaiende worker dateerde
    van vóór de worker-commit en gaf 404 op `/api/doel-passend`, waardoor het weekscherm
    `not found` toonde. Na een herstart gaf dezelfde route 200 en liep de sweep schoon.
    DE KOST IS NIET DE VIER RUNS MAAR DE MEETLAT: het instrument veranderde tussen VOOR en NA,
    dus BEIDE metingen moesten opnieuw. Een gemengde reeks is geen vergelijking.
    RICHTING: vóór de sweep een route- of versiesignaal van de draaiende worker lezen en
    STOPPEN bij mismatch, in plaats van te schieten en de uitslag te moeten wantrouwen.
    AF per 04-08-2026, bouw `b3a3686`. `expectedApiRoutes` leest de parameterloze GET-paden uit
    `workers/api/src/routes/api.ts` ZELF — een handlijst zou uit de pas lopen — en GOOIT bij een
    lege lijst, want dat zou de controle stil uitzetten. `probeRoutes` telt alleen een 404 als
    missing (Hono geeft 404 op een onbekend pad, een bestaande route met een ontbrekende query
    geeft 400) en een time-out als `unknown`: een vals STOP blokkeert legitiem werk. De controle
    staat VÓÓR de `rmSync`, dus bij een STOP blijft de vorige meting staan. Prod gooit nooit.
    GROEN 15 van 15; ROOD aangetoond met `/rood-toets-29`, waarna de 95 PNG's van de groene run
    er nog stonden.
30. **Eén uitvallende sub-request maakt het HELE weekscherm zwart** — af · CLIENT. Valt één
    van de rijen weg die het view-model voedt, dan verdwijnt niet die één kaart maar de hele
    week; er staat dan `not found` met een Opnieuw-knop.
    GEMETEN, TWEE KEER en langs twee verschillende wegen: bij de verouderde dev-worker
    hierboven, en in het PROPAGATIEVENSTER na de deploy — `GET /api/doel-passend` gaf eerst 404
    met body `{"error":"not found"}` en circa twintig seconden later 200.
    OORZAAK: de view-model-bouw haalt de rijen met één `Promise.all` op (rond
    `apps/web/src/lib/schema.ts:1347`), dus één afwijzing laat de hele opbouw vallen.
    WAAROM HET TELT: elke nieuwe route die aan die bouw wordt toegevoegd vergroot het oppervlak
    waarop een deploy of een storing het weekscherm onbruikbaar maakt. Het defect groeit dus
    mee met de app, en het venster waarin het zichtbaar is loopt over een deploy heen.
    AF per 04-08-2026, bouwdoc `c852217` (`docs/PUNT30-BOUWDOC.md`), bouw `5502238`.
    HET VERDICT IS VERSCHOVEN, en dat is de kern van dit punt: NIET per-kaart-degradatie maar
    HERHALEN-EN-BENOEMEN. Grond: twaalf van de vijftien rijen voeden `buildWeekProposal`, en de
    getoonde week gaat via `persistWeekplan` (`schema.ts:1613`) als plan-van-record de opslag in.
    Stil degraderen levert dus geen ontbrekende kaart maar een ANDER plan-van-record — zelfde
    vorm als punt 26. En er blijft maar één rij over die je veilig kunt laten vallen
    (`dispositions`); `powerZones` voedt een oordeel en `doelPassend` onderdrukt een kaart.
    WAT ER WEL KWAM: `retryLoad` herhaalt de HELE bouw (3 pogingen, 600 en 1800 ms — BELEID, geen
    ijking), en `laadGelabeld` noemt de gevallen rij bij NAAM. De sterkste grond staat niet in de
    beschrijving hierboven: dit is een PWA met vijftien parallelle verzoeken, en één time-out op
    een slechte verbinding kost het hele weekscherm. Het propagatievenster na een deploy wordt
    BEWUST niet gedekt — zie het bouwdoc §5.
31. **De harness besmet zijn eigen nulmeting** — af · TOOLING. Twee sweeps op ONGEWIJZIGDE
    code leverden 8 verschillende shots op, allemaal `v7-midweek`. GEMETEN bij punt 30: run 1
    tegen run 2 gaf die acht, run 1 tegen run 3 gaf 93 van 93 identiek. De wisseling is dus
    INTERMITTEREND, en dat is een ander karakter dan punt 23 — daar gaat het om pixel-verschil
    bij IDENTIEKE `innerText`, hier mogelijk om verschoven TOESTAND.
    KANDIDAAT-MECHANISME, NIET VASTGESTELD: `persistWeekplan` (`apps/web/src/lib/schema.ts:1613`)
    schrijft bij ELKE pageload naar D1, dus run 1 kan de nulmeting van run 2 besmetten.
    `v7-midweek` is het scenario dat daar het gevoeligst voor is: het draagt `dagOffset` 2, dus
    maandag en dinsdag zijn verstreken en de bevroren weekplan-entry doet er mee.
    DE UITSLUITENDE TOETS: twee opeenvolgende sweeps met de weekplan-tabel ervoor én erna
    gelezen. Beweegt die tabel tussen de runs, dan is het mechanisme bevestigd; beweegt hij niet,
    dan valt deze kandidaat af en is het hetzelfde pixel-verschijnsel als punt 23.
    LOSGEKOPPELD VAN DE PUNT 30-BOUW, en dat is gemeten: de ijk-runs stonden op de VÓÓR-staat
    (`retryLoad` afwezig), en de `errors`-teller stond op zeven van de acht shots op `none` — de
    achtste droeg alleen de bekende `/api/checkin`-404, die door de fouttolerante `getCheckin`
    op `null` valt en niet gooit. `retryLoad` heeft dus nooit gevuurd.
    DE BESMETTING IS NIET SCENARIO-GEBONDEN, en dat is per 05-08-2026 gemeten. De ronde van 04-08
    wees `klim-weekstem` en `v7-blokweek4` aan: die twee verschilden tussen twee sweeps op
    ONGEWIJZIGDE code. De ronde van 05-08 wees `v7-weekstem` aan, met 61 gewijzigde regels in het
    WEEKPLAN zelf — TSS, sessietelling en uren — terwijl de wijziging van die ronde alleen het
    blok-oordeel en één kleurconditie raakte en zulke getallen per constructie niet kan bewegen.
    De toestand ZWERFT dus tussen scenario's. Een vaste uitsluitingslijst is daarmee GEEN
    oplossing: hij dekt de vorige ronde en niet de volgende. Tot de uitsluitende toets gedraaid
    is hoort elke sweep zijn EIGEN ijkrun te dragen in plaats van een geërfde lijst.
    AF op `6e62a650b365028e20303f1017aa8ef9e12b4396`, in twee helften.
    GEBOUWD: een EIGEN uitvoerpad per modus — lokaal `out/`, prod `out-prod/` — en ROTATIE in
    plaats van wissen, op een MARKER (`RUN-COMPLEET.json`) die als LAATSTE handeling van een
    geslaagde run wordt geschreven. Alleen een COMPLETE run verdringt de vorige. Dat is geen
    detail: vite viel deze reeks TWEE keer stil om midden in een sweep, en de rood-toets-runs van
    punt 24 leegden `out/` daarna nog twee keer. Een slot dat bij ELKE run opschuift verliest zijn
    laatste goede meting aan de eerstvolgende mislukking. De marker staat bewust VÓÓR de
    float-net-controle: een run die op het net rood valt is wél compleet — elke shot is
    geschoten — en mag dus opschuiven.
    GEVERIFIEERD, beide takken. NEGATIEF: na sweep A bestond `out-vorige` NIET, want de bestaande
    map droeg geen marker; die map was het restant van twee omgevallen runs, precies het geval
    dat niet mag opschuiven. POSITIEF: na sweep B bestond hij wél, met een bestandslijst IDENTIEK
    aan die van sweep A — 192 bestanden en 95 PNG's aan beide kanten. PROD: `out-prod` met marker
    en 15 PNG's, `out-prod-vorige` afwezig (eerste prod-run), en `out/` én `out-vorige`
    ONAANGERAAKT. Een prod-run eet de lokale meting dus niet meer op.
    HET KANDIDAAT-MECHANISME IS WEERLEGD, en dat is de eigenlijke uitkomst van dit punt.
    `persistWeekplan` is het NIET: de weekplan-tabel bleef rond run 1 en rond run 2
    BYTE-IDENTIEK op 31 rijen, terwijl diezelfde twee runs op 16 shots uiteenliepen. Bewegen deed
    de tabel alleen rond de AFGEBROKEN run — 11 van de 34 verenigde sleutels. De variantie die dit
    punt aanwees bestaat dus nog steeds en heeft een andere bron; die staat als punt 36.
32. **De rit-beoordeling is geen pijler** — open · CLIENT plus norm. Een coach oordeelt over een
    gereden sessie op twee dingen die de app NIET gebruikt: of het voorgeschreven werk HIELD
    binnen de sessie, en wat de renner er zelf over zei.
    DE CANON KENT DIT AL EN NOEMT HET ONAF. M30 (NORM) geeft subjectieve terugkoppeling de
    status "informeert". M31 (OPEN) noemt TWEE gebouwde en niet-aangesloten sensoren: de reden
    waarom een training niet doorging (agenda of benen) en het verschil tussen verwachte en
    gerapporteerde RPE. M19 (OPEN) noemt de betere uitkomstmaat bij naam: vermogen bij gelijke
    RPE, of afgemaakt-versus-voorgeschreven vermogen.
    HOE HET BINNENKWAM: die drie regels stonden BUITEN de reeks en kwamen daardoor nooit aan de
    beurt. Het punt is aangemaakt zodat de volgorde ze wél draagt.
    GAAT NA PUNT 17 — zonder een eerlijk uitvoerings-oordeel heeft een rijkere rit-beoordeling
    niets om op te landen.

33. **De norm-vergelijking staat op drie plekken en de derde heeft geen vangnet** — af ·
    CLIENT plus TOOLING. Sinds punt 17 leest één en dezelfde regel — rond de geleverde minuten
    af en leg ze langs de getoonde norm — op DRIE plekken: `opNormPerZone` en `zoneOpNorm_` in
    `apps/web/src/lib/blok.ts`, plus TWEE inline kleurcondities in
    `apps/web/src/components/schema/BlokReviewCard.tsx`.
    DE EERSTE TWEE ZIJN GEDEKT en aantoonbaar rood te krijgen (R-D en R-E op T6 van
    `punt17.test.ts`). DE DERDE NIET, en dat is GEMETEN: draai de kaart-vergelijking terug op de
    onafgeronde waarde en de HELE suite van 958 blijft groen. `apps/web/vitest.config.ts` draait
    op `environment: "node"`, er is geen enkel `.test.tsx`-bestand en geen jsdom of
    testing-library, dus er is niets dat een render-uitspraak kan doen.
    DAT IS PRECIES DE PLEK WAAR HET DEFECT ZAT dat punt 17 fase B moest repareren: de kaart die
    zichzelf tegenspreekt. Hij is nu goed, en hij is het enige stuk van die reparatie dat
    ongedaan gemaakt kan worden zonder dat er iets rood wordt.
    TWEE TERMEN. (i) Trek de vergelijking naar ÉÉN gedeelde functie die zowel `blok.ts` als de
    kaart aanroept, zodat er nog maar één plek is om fout te hebben. (ii) Zet render-dekking op
    voor de client — een tweede vitest-project met jsdom — zodat kleurlogica überhaupt te
    asserteren is. Term (ii) is breder dan dit punt en betaalt zich terug bij elke volgende
    kaart-wijziging.
    AF op `e55637a` (de render-testlaag) en `8288d2b` (de gedeelde functie), live op Worker
    Version `b8c6b7fa-e2ab-441f-b4bf-3d1d17a1eec7`.
    DE VOLGORDE VAN DIT PUNT IS OMGEKEERD, en dat is de dragende keuze: eerst term (ii), dan
    term (i). Een vangnet dat pas NA de consolidatie gebouwd wordt is per constructie niet meer
    PER PLEK rood te meten — er is dan nog maar één plek. Met de omgekeerde volgorde kon dat wél:
    R1 op `BlokReviewCard.tsx:179` liet A1 vallen met A2, A3 en A4 overeind, R2 op `:276` liet A3
    vallen met de rest overeind. Andersom was dat bewijs onbereikbaar geweest.
    TERM (i): `haaltNorm(geleverd, norm)` in `apps/web/src/lib/blok.ts` is de ENIGE plek waar de
    vergelijking valt — vijf aanroepen daar (de drie zones van `opNormPerZone`, `totaalOpNorm` en
    `zoneOpNorm_`) en twee in `apps/web/src/components/schema/BlokReviewCard.tsx`. GREPS: `Math.round`
    gevolgd door `>=` in `blok.ts` van 5 naar 1, `Math.round` in de kaart van 4 naar 2 — en die twee
    zijn WEERGAVE en horen te blijven. De punt-17-onderbouwing hing aan géén enkele functie en
    hangt nu aan deze.
    TERM (ii): project `web-render` in `apps/web/vitest.render.config.ts`, environment jsdom,
    include `src/**/*.test.tsx`, met de dekking in
    `apps/web/src/components/schema/BlokReviewCard.test.tsx`. Enige nieuwe dependency: `jsdom`.
    GEEN `@testing-library` en GEEN `@vitejs/plugin-react` — `createRoot` plus `act` uit react
    volstaan en de JSX-transform had geen plugin nodig. De node-suite pakt het `.tsx` niet op: het
    totaal steeg met precies 4 en niet met 8.
    ROOD NA DE CONSOLIDATIE, twee mutaties op `haaltNorm`: `>=` naar `>` liet 17 tests over 5
    bestanden vallen, de ronding weghalen 13 over 4 — en BEIDE keren viel zowel de pure laag
    (`blok`, `punt15`, `punt17`, `zonepoort`) als de render-laag (A1 en A3). De kaart leest
    aantoonbaar dezelfde functie als het oordeel.
    BEGRENZING: `git diff --stat HEAD~1 HEAD` toont exact twee bestanden, 20 bij en 11 weg, en
    GEEN enkel testbestand — een refactor die zijn tests moet bijstellen is geen refactor. Op
    prod voor en na: 9 van de 16 identiek, 16 vergeleken, 0 uitgesloten, en de zeven bewegende
    shots verschillen uitsluitend op `Laatst gesynct`.

34. **De effect-referent kent het doel niet** — AF 22-08-2026 MET ÉÉN UITZONDERING: (d) blijft
    open, en zijn eigen voorwaarde is weerlegd · CLIENT plus norm. HERSCHREVEN 21-08-2026
    na vier meetrondes; de oude tekst stelde de diagnose te smal en op één punt te sterk.
    DE REFERENT IS DOEL-BLIND. `apps/web/src/lib/effect.ts` noemt het woord `doel` nul keer, en
    de call-site in `apps/web/src/lib/blok.ts` geeft `buildEffectReferent` geen doel mee. De
    meter is `rolling_ftp` voor alle vijf doelen. Gemeten over vijf doelen maal drie scenario's:
    uitkomst, dosis-term en de coach-zin zijn 5 van de 5 identiek per scenario, en de seed van
    de copy noemt het doel niet eens.
    NIET DRIE MAAR VIER DOELEN, EN DE VIERDE DRAAGT HET TEKEN OMGEKEERD. `DOELEN-SPEC` §3.5
    (Conditie), §3.3 (Korte beklimmingen) en §3.4 (Lange beklimmingen) wijzen alle drie een maat
    aan die de app niet kan uitrekenen — durability, respectievelijk dag twee tegen dag een.
    Maar bij **Onderhoud** is de opdracht NIET-ZAKKEN (§3.2), dus een gelijkblijvende rolling FTP
    IS daar het doel bereikt — terwijl de app "niet gestegen" leest en tijd-in-zone aanbiedt. Dat
    is geen ontbrekende meter maar een omgekeerd teken.
    DE TAK `niet_gestegen` HEEFT NOG NOOIT GEVUURD EN KAN DAT NIET. Gemeten op de echte database:
    0 races in het hele verleden (de twee events staan in 2027), 0 test-overrides, en 0 van de 49
    vierweekse blokken draagt een gelegenheid. `blokGelegenheid` geeft overal null, dus de tak die
    "ik kan de tijd-in-zone verhogen" draagt is live in de code en onbereikbaar in de praktijk.
    Een eerdere formulering hier noemde dit "een M55-schending die vandaag draait"; die stond op
    een FIXTURE mét wedstrijd en was daarmee te sterk gesteld.
    HET ECHTE GAT ZIT IN DE VOLGORDE VAN DE POORT. `isStijging` wordt getoetst VÓÓR de
    gelegenheid-poort (`apps/web/src/lib/effect.ts:370`), dus een stijging telt zonder dat er een
    meetmoment was. Gemeten: **8 van de 49 blokken lezen `gestegen` zonder enige gelegenheid** —
    precies de blokken waarvan het venster een van de twee sprongdagen bevat (2026-01-13, +10 W
    in één dag; 2026-05-21). Over een jaar waarin de meter van 291 naar 260 watt zakte staan er
    dus 8 winst-uitspraken en 0 verlies-uitspraken. Die sprong is de SCHATTER die bijtrekt na
    maanden decay, niet winst uit dát blok.
    SYMMETRIE IS GEEN OPLOSSING — VERWORPEN, met de meting erbij. De gelegenheid-eis ook voor
    `gestegen` laten gelden maakt 49 van de 49 blokken `niet_meetbaar`; de app zwijgt dan over
    haar hele historie. `apps/web/src/lib/effect.test.ts:258` pint bovendien het tegendeel
    ("stijging zonder bekende gelegenheid telt WEL — bewijs mag niet onderdrukt") en
    `docs/EFFECT-REFERENT-5B-ONTWERP.md` §4 motiveert het: gestegen is aantoonbaar, gedaald niet.
    DE OPLOSSING IS COPY, GEEN LOGICA. Op de tak `gestegen` splitst de TEKST op de vraag of het
    blok een gelegenheid droeg. Was er geen test en geen wedstrijd, dan noemt de coach de
    stijging wel maar schrijft hij hem niet aan dit blok toe. Dat geldt bij ALLE doelen, ook FTP.
    BOUWLIJST — (a) de gelegenheid-splitsing in de `gestegen`-copy, inclusief de getalsrij op
    `apps/web/src/components/schema/BlokReviewCard.tsx:343`, die vandaag `instap → maximum` toont
    zodra er een referent is; (b) drie takken op het doel — stijging voor FTP, behoud voor
    Onderhoud, meter_ontbreekt voor Conditie en beide klimdoelen — met `normalizeDoel_` VÓÓR de
    tak-keuze, want `buildBlokReview` krijgt `settings?.doel` RAUW mee
    (`apps/web/src/lib/schema.ts:1549`) en `"Beklimmingen"`, `"VO2max"`, leeg en onzin vallen
    anders buiten elke tak; (c) een eigen `gestegen`-variant voor Onderhoud, want "de winst die
    dit blok moest opleveren" is onwaar bij een behoud-opdracht; (d) de Onderhoud-poort
    `blokCheckEnabled`, en UITSLUITEND als een recon aantoont dat er niets anders aan hangt;
    (e) de kleine letter aan het zinsbegin in `apps/web/src/lib/coachNarrative.ts:603` en `:609`,
    waar de gelegenheid-naam aan het begin van de zin wordt geïnterpoleerd.
    DE BEHOUD-TAK ERFT `ROLLING_FTP_STIJGING_W` = 3 W, SYMMETRISCH TOEGEPAST — geen tweede getal.
    Maar noteer erbij wat dat leent: het plateau +1 tot en met +8 is alleen OMHOOG geijkt, en de
    min-richting is ONGEIJKT. Gemeten kantelt een verschil van −6 van `gezakt` naar `behouden`
    zodra de drempel op 7 staat. Wie de behoud-tak bouwt, ijkt die richting apart of verantwoordt
    waarom niet.
    **AF per 22-08-2026 — (a), (b), (c) en (e) gebouwd in `8a95f52`; (d) NIET.** Wat er landde:
    de doel-tak als een EIGEN veld `doelTak` op `EffectReferent`, met de uitkomst-union
    ONGEMOEID — `gestegen`, `niet_gestegen` en `niet_meetbaar` staan er nog precies zo, want punt
    34 wijzigde de copy en de kaart en niet het oordeel. `doelTakVan_` normaliseert de rauwe
    doel-string en vergelijkt tegen `DOEL_OPTIONS` zelf, nooit tegen uitgetypte literals; leeg,
    null en onbekend vallen op `meter_ontbreekt`, de ZWIJGENDE tak, omdat `normalizeDoel_`
    fail-opent naar FTP en een fail-open naar een uitspraak hier verkeerd is. Verder: de
    gelegenheid-splitsing in de `gestegen`-copy, een eigen behoud-variant voor Onderhoud, de
    hoofdletter aan het zinsbegin, en in de kaart staan nu de pijl, de instap ÉN de kleur achter
    een gelegenheid-toets — groen is zelf een winst-claim.
    **DE WAT-ALS HIELD OP ALLE DRIE DE PUNTEN, en dat is de opbrengst van de vorm.** De uitkomst
    kantelde niet; de twee betwiste asserties — "stijging zonder bekende gelegenheid telt WEL" en
    "gelegenheid zonder stijging → niet_gestegen" — werden groen ZONDER één letter wijziging; en
    `niet_gestegen` bleek per constructie onbereikbaar zonder gelegenheid, want die uitkomst is de
    middelste arm van een ternary die alleen bij een niet-lege bron wordt bereikt. De vrees dat de
    twee `${gelegenheid}`-varianten vandaag stuk zouden staan was dus ongegrond.
    **(d) BLIJFT DICHT, EN ZIJN EIGEN VOORWAARDE IS WEERLEGD.** De bouwlijst zei "uitsluitend als
    een recon aantoont dat er niets anders aan hangt". Er hangt wél iets aan: de DOSIS-RAMP gaat
    mee. De hele schrijfweg naar `sync_state.dosis_trede` ligt achter de poort —
    `blokCheckEnabled` → `blokCheck` geeft null → `BlokReview.check` null → `dosisTredeVoorstel`
    valt op `!r.check` → geen `DosisTredeCard` → `putDosisTrede` en `writeDosisTrede` draaien
    nooit. `mesoFactor` en de kalender-deload gaan NIET mee: die lopen via `weekFatigueEnabled` en
    `effectiveMesoWeek_`, die dezelfde profielvlag lezen met hun EIGEN `profileForDoel_`-aanroep.
    Broers, geen afstammelingen.
    **TWEE LEZINGEN VAN (d), MET VERSCHILLENDE STRAAL — die stonden nergens en horen hier.**
    (i) De FUNCTIE `blokCheckEnabled` of haar aanroepplekken verzetten raakt precies TWEE
    leesplekken (`blokCheck` in `blok.ts` en poort (2) in `testvoorstel.ts`) en beweegt alleen de
    dosis-ramp. (ii) `mesoCyclus: false` omzetten op `PROFILES.onderhoud` in
    `packages/engine/src/archetypes.ts` beweegt VIER consumenten tegelijk, slaat alle drie de
    buren om naar JA, en is een ENGINE-wijziging met een eigen autorisatie. Wie (d) ooit opent,
    zegt eerst WELKE van de twee hij bedoelt.
    **TWEEDE GROND, EN DIE IS INHOUDELIJK.** Ook als de straal acceptabel was, blijft (d) fout:
    de blok-check levert `geleverd_niet_gestegen` → "het plan was te licht, de dosis mag omhoog",
    en dat is bij een BEHOUD-opdracht precies het verkeerde voorstel. De poort openzetten zou de
    dosis-ramp aan een doel hangen dat geen progressie vraagt (`DOELEN-SPEC` §3.2). (d) is dus
    geen wachtende bouw maar een ontwerpvraag die eerst een antwoord nodig heeft op punt 47.

35. **Een event draagt geen duur** — open · DATA plus ENGINE. De interface `EventItem`
    (`packages/shared/src/weekgen.ts`) en de D1-tabel `events` (de export `events` in
    `workers/api/src/db/schema.ts`) dragen precies EEN `datum`, geen einddatum en geen
    duur. Voor de TAPER is dat juist — die meet naar de startdag toe. Voor HERSTEL is het
    blokkerend: een venster van N dagen na het event meet bij een meerdaagse vanaf de
    STARTdag, dus het verloopt voor de trip afgelopen is. GEVOLG: de herstelregel van punt 13
    fase A geldt bewust alleen voor `type` race, en de Stelvio-week van zomer 2027
    (`DOELEN-SPEC` §3.4) krijgt na afloop geen herstel. Vraagt een migratie, een DTO-veld, een
    invoerveld in Events en een tweede grens in `eventFase_`. Kwam binnen bij de recon van
    punt 13.
36. **Het weekplan van een scenario verschuift tussen twee runs** — af, BEGRENSD UITGESLOTEN ·
    TOOLING. Het verdict is TOOLING en niet CLIENT: de harness laat elf scenario's met
    verschillende settings naar DEZELFDE weekplan-sleutels schrijven, en elk scenario leest via de
    recency-seed en de blok-terugblik terug wat het vorige achterliet.
    AFGELEID uit de gecommitte bron: de elf scenario's doen samen 33 weekplan-schrijfacties op 7
    unieke week-sleutels. Week 2026-07-13 wordt door 10 van de 11 geschreven, elk met een ander
    doel, andere plannerdagen of een andere blokweek. `weekplans` heeft (user_id, week_monday) als
    sleutel, dus elke schrijver overschrijft zijn voorganger.
    DE METING DIE DE AS ISOLEERT. Vier sweeps van hetzelfde scenario RUG AAN RUG: 72 van de 72
    byte-identiek. Dezelfde scenario's met de tien andere ertussen, drie volledige cycli in één
    proces: c2 tegen c1 24 afwijkend, c3 tegen c2 16, c3 tegen c1 24 — telkens 93 vergeleken van de
    95 met `v7/09-vorm.png` en `v7/10-trainingen.png` uitgesloten wegens punt 23. Zelfde code,
    zelfde sessie, zelfde machine.
    WAT BEWEEGT IS HET PLAN, NIET WELLNESS. Vier scenario's bewegen, telkens alle acht shots samen:
    `klim-weekstem`, `v7-blokweek4`, `v7-midweek` en `v7-weekstem`; de andere zeven staan alle drie
    de cycli stil. Scherpst is `v7-blokweek4`: `Tempo 24/51 · Drempel 2/85 · VO2max 1/—` wordt
    `Tempo 24/0 · Drempel 2/0 · VO2max 1/0` met een teller van `0/2` naar `3/3` — sinds punt 17 IS
    die rechterkant het bewaarde plan. Verder `/207` naar `/269` (gepland TSS, uren `/3:59` naar
    `/4:59`), `/429` naar `/375`, en `/95` naar `/41`.
    ER IS GEEN VAST PUNT NA DRIE CYCLI. Verzadiging geldt voor `klim-weekstem` en `v7-blokweek4`
    (c1 ≠ c2 = c3), maar `v7-weekstem` is c1 = c2 ≠ c3 en `v7-midweek` OSCILLEERT (c1 = c3 ≠ c2).
    De weekplan-rijen groeiden over de run met 1239 tekens bij een onveranderd rijaantal van 9. Een
    nulmeting erven blijft dus waardeloos, ook binnen één sessie.
    DE APP-KANT IS EEN ANDER PUNT. Het plan-van-record is INVOER van de volgende bouw
    (recency-seed, gepland-noemer, plan-referent) en wordt 2 of 3 keer per pageload geschreven.
    Eén configuratie raakt dat niet — Daans week stond de hele meetdag stil — maar een wissel van
    doel, doelStart of plannerdagen wél. Dat raakt punt 28 en hoort daar, niet hier.
    DE FIX, NIET GEBOUWD: geef elk scenario zijn EIGEN week-sleutels, zoals `overname` al doet met
    `monday: "2027-02-22"`. KOSTEN: elke shot krijgt andere datums, dus de nulmeting verschuift
    ÉÉN keer. DE UITSLUITENDE TOETS: herhaal daarna de drie-cycli-meting; blijven alle 93 dan over
    alle drie de paren identiek, dan was de sleutel-botsing de hele oorzaak. Blijft er iets
    bewegen, dan is er een tweede bron en is het punt niet af.
    GEBOUWD op `1911a188dcdb738577df935c3ad3f61f4581a408`. Elk scenario WIST zijn hele leesvenster
    voordat het zaait — acht weken weekplan-rijen, geteld terug vanaf de blokstart, leeggezet met
    een kale full-replace — en TOETST daarna dat het leeg is, op zowel de weekmaandag als de
    blokstart. De PLANNER-tabel wordt bewust NIET gewist: die wordt alleen voor de bekeken week
    gelezen, niet over een venster, dus daar bestaat de koppeling niet.
    WISSEN EN NIET EIGEN WEEK-SLEUTELS, met de grond. Het leesvenster is acht weken —
    `RECENCY_HORIZON_WEEKS` in `packages/engine/src/planner.ts` én de default `window = 8` van
    `readRecentWeekplans` in `workers/api/src/db/repo.ts`, allebei `[maandag - 49 dagen ..
    maandag]`. Eigen sleutels vragen dus acht weken tussenruimte per scenario, en dat is voor elf
    scenario's TACHTIG WEKEN spreiding. Die botst VOORUIT op de acht-wekengrens van het A-event —
    dan neemt de event-as de periodisering over en meet het scenario iets anders — en ACHTERUIT op
    de echte ritdata, terwijl de verstreken-dag-scenario's die weken juist ONGEREDEN nodig hebben.
    DE TOETS UIT DIT PUNT IS VERVANGEN, en dat is zelf een bevinding. De drie-cycli-toets
    hierboven gaf op ONGEWIJZIGDE code 93 van de 95 identiek en NUL afwijkende shots: de gedeelde
    toestand was naar een VAST PUNT geconvergeerd — `weekplans` op n=9 en
    `sum(length(entries_json))` 40061, onbewogen over vier sweeps — terwijl diezelfde tabel een dag
    eerder nog met 1239 tekens groeide en de cycli 24, 16 en 24 afwijkingen gaven. Een toets die
    groen staat zónder ingreep beslist niets. In de plaats komt de VOLGORDE-TOETS: draai de
    scenario-lus om en er mag geen enkele shot bewegen. Zonder fix gaf die 77 van de 95 identiek
    met 16 bewegende shots — heel `v2` en heel `v4` — dus de koppeling is aangetoond.
    DE GUARD IS AANTOONBAAR ROOD: met alleen de wis-lus uit valt hij op het eerste scenario, en
    letterlijk met `v7: leesvenster niet leeg na wissen — maandag 2026-08-03 draagt 19 entries`.
    WAT ONTBREEKT, EN DAAROM STAAT DIT PUNT NIET OP AF. Met de fix erin haalde GEEN van de vier
    runs het einde, telkens afgebroken op de punt-24-poort in de ZAAI-fase en nooit op een shot:
    `v7-blokweek4 bewijsweek 2026-07-20`, `v2 bewijsweek 2026-07-13`, `v7-midweek warmloop
    dagOffset 2` en `v7 bewijsweek 2026-07-06`. Beide poorten gaven na elke uitval 200, dus vite
    was niet dood. DE VOOR DE HAND LIGGENDE VERKLARING IS GEMETEN EN WEERLEGD: over 43 laadbeurten
    is de mediaan 1558 ms en de hoogste 8139 ms, met NUL boven 15000 ms en NUL die de loader binnen
    120000 ms niet kwijtraakte; de wandkloktijd was 246 s tegen 294 s en 320 s, dus de machine is
    ook uitgesloten. De uitval is daarmee INTERMITTENT en ONVERKLAARD. Het settle-budget verhogen
    is expliciet AFGEWEZEN: een grens die nooit gehaald wordt, verhoog je niet.
    DE OPENSTAANDE VRAAG IS ÉÉN REGEL: haalt de harness met deze fix erin een run af? Dat antwoord
    komt GRATIS in de eerstvolgende bouwronde die de harness draait. Blijkt hij structureel om te
    vallen, dan is de commit één revert.
    ANTWOORD PER 07-08-2026, uit de punt-28-ronde. DE HARNESS HAALT WÉL VOLLEDIGE RUNS AF: vier
    sweeps met exit 0, in twee paren achter elkaar (148 s en 147 s, later 131 s en 131 s). De
    onverklaarde uitval uit dit punt is dus NIET structureel, en de commit hoeft niet terug.
    MAAR DE VARIANTIE IS ER NIET MEE WEG, en dat is de reden dat dit punt open blijft: het
    ijkpaar van twee opeenvolgende sweeps op ONGEWIJZIGDE code gaf 85 van de 95 identiek, met
    ACHT afwijkende shots — alle acht in `klim-weekstem`. De fix-richting van dit punt is daarmee
    NIET bevestigd als afdoende: het wissen van het leesvenster nam de kruisbesmetting weg die we
    konden aanwijzen, maar er beweegt nog iets anders.
    WAT DE PUNT-25/22/23-RONDE ERAAN TOEVOEGT, 07-08-2026. BLIJFT OPEN.
    EEN DERDE SCENARIO: het ijkpaar van die ronde gaf ACHT bewegende shots in `v7-midweek` —
    `01-week` tot en met `08-zo`, dus alle acht — met bij alle acht een VERSCHILLENDE
    `innerText`. Nagelegd in de `.txt`: week-TSS 417 tegen 322, 8:29 tegen 6:30 uur, 5 tegen 3
    kwaliteitsdagen, en hele trainingen ("Sweet Spot 2×20", "Z2 + hoge cadans") die in de ene run
    staan en in de andere niet. Het PLAN beweegt dus, niet de camera. Daarmee staan er nu DRIE
    uitkomsten op dezelfde opzet: `klim-weekstem`, `v7-midweek`, en één sessie zonder enige
    beweging.
    DE WARMLOOP-KANDIDAAT IS WEERLEGD. Het punt-37-STAND-blok noemde de weggegooide warmloop als
    het enige verschil in de opzet toen een ijkpaar nul bewegende shots gaf. Deze ronde draaide
    EXACT dezelfde opzet — warmloop weggegooid, daarna twee sweeps — en gaf er acht. Dezelfde
    opzet, twee uitkomsten: de warmloop verklaart het verschil niet.
    HET INSTRUMENT IS ER WÉL, en dat is de winst. `tools/shots/vergelijk.mjs` classificeert sinds
    `6798f16` elke bewegende shot op het `innerText`-blok, en splitste de elf bewegende shots van
    deze ronde zonder rest: ACHT met verschillende `innerText` (dit punt) en DRIE met gelijke
    `innerText` (punt 23 en de opgeheven cap). Het verdict van dit punt is daarmee leesbaar
    zonder oordeel per shot met de hand.
    VERDICT PER 07-08-2026, RONDE 3. BEGRENSD UITGESLOTEN, met de getallen erbij.
    HET IJKPAAR VAN DEZE SESSIE IS SCHOON: 96 van de 96 identiek, 96 vergeleken, NUL
    uitgesloten, nul bewegende shots. De vergelijker is eerst in twee richtingen geijkt —
    `out` tegen zichzelf 96 van de 96, `out/v2` tegen `out-vorige/v4` 0 van de 8 met alle
    acht op verschillende innerText. Opzet: warmloop weggegooid, daarna twee sweeps, alle
    drie exit 0.
    DE RACE-HYPOTHESE IS GEMETEN EN WEERLEGD. Het vermoeden was dat `persistWeekplan`
    fire-and-forget schrijft (`apps/web/src/lib/schema.ts:1283` en `:1289`) terwijl `settle`
    na 800 ms wegnavigeert, zodat een schrijfactie die de volgende zaai-load moet lezen door
    de navigatie sneuvelt. Een passief instrument telde per settle-marker elke
    `/api/`-request die NA de terugkeer en VOOR de eerstvolgende navigatie startte. UITKOMST
    over 25 zaai-loads maal twee runs: NUL. Nul na-settle-requests, nul `PUT
    /api/weekplan/`, nul afgebroken. De identiteit sluit aan beide kanten — run A 1906
    requests, 1906 finished, 0 failed, 0 openstaand; run B 1903, 1903, 0, 0 — en beide runs
    dragen 45 settle-markers, exact de verwachting van 25 zaai plus 11 weekscherm plus 9 in
    `v7`. Het venster is dus per constructie leeg, en de ingrediënten van een race zijn niet
    hetzelfde als een race.
    WAT NIET IS UITGESLOTEN, EN HET GETAL LAG VOOR HET OPRAPEN: de twee runs verschillen in
    TOTAAL aantal `/api/`-requests, 1906 tegen 1903, terwijl élke shot byte-identiek is. De
    app doet drie requests meer in de ene run dan in de andere zonder dat het beeld beweegt.
    WELKE drie, in welke load, en of er een `PUT /api/weekplan/` bij zit is NIET gemeten —
    het instrument telde alleen het na-settle-venster, en dat is een gat in het ontwerp van
    de meting. Kandidaat, niet vastgesteld: de post-sync herbouw op `Schema.tsx:116`, die
    `setNonce` zet zodra een sync upserts meldt; of die herbouw BINNEN de settle-tijd
    afrondt is timing.
    DE VLOER IS EEN SESSIE-EIGENSCHAP, NU OVER VIER SESSIES MET DEZELFDE OPZET: acht
    bewegende shots in `klim-weekstem`, nul, acht in `v7-midweek`, nul. Twee van de vier
    vuren. Vuurt het, dan is het telkens EEN scenario, alle acht shots samen, en met
    VERSCHILLENDE innerText — het plan beweegt, niet de camera. Een schoon ijkpaar bewijst
    het verschijnsel dus niet weg; deze ronde vuurde het simpelweg niet.
    DE WERKREGEL WAARMEE DE HARNESS BRUIKBAAR BLIJFT, en er valt niets bij te bouwen: elke
    ronde meet zijn EIGEN ijkpaar, erft er nooit een, en sluit een bewegend scenario uit met
    reden en aantal terwijl de noemer het TOTAAL blijft. `tools/shots/vergelijk.mjs` maakt
    die toewijzing mechanisch via de innerText-kolom. Staat al in `tools/shots/README.md`.
    GEEN DERDE POGING. Dit punt gaat van de lijst af.
37. **De vite-dev-server sterft stil tijdens een sweep** — af · TOOLING. GEMETEN: VIJF keer in
    deze reeks valt de harness om terwijl poort 5173 daarna DOWN is en 8787 gewoon 200 geeft. Het
    logboek eindigt op de startbanner zonder foutregel; de exitcode is 127 of 1.
    DE HARNESS LEEST DAT ALS EEN INHOUDELIJKE UITVAL, EN DAT IS HET NIET. De punt-24-poort meldt
    `still loading after settle`, wat klopt — de pagina laadt inderdaad niet meer — maar de
    OORZAAK staat buiten de app. Elke ronde kost dat een herstart en een herhaalde sweep, en het
    vervuilt de diagnose van punt 36: vier van de vijf uitvallen zaten in de ZAAI-fase, wat lang
    op een trage zaai-load leek tot de settle-meting dat weerlegde (43 laadbeurten, mediaan
    1558 ms, hoogste 8139 ms, nul boven 15000 ms).
    DEZE RONDE VOOR HET EERST OP EEN SHOT-LABEL: `v4 weekscherm` in plaats van een bewijsweek.
    Vijf keer is een patroon en geen incident.
    RICHTING, niet vastgelegd: de harness kan vóór elke sweep — en eventueel per scenario — de
    vite-poort proberen en met een EIGEN melding stoppen, zodat een dode dev-server niet als een
    ladende pagina leest. De oorzaak van het sterven zelf is daarmee niet weggenomen.
    GEBOUWD per 07-08-2026 op commit `526ce4ea5e4fe3fd0863c57e2e145b363fe767d9`, TOOLING-only.
    DE BOUW IS ÉÉN POORT OP ÉÉN PLEK: de bestaande `try … finally` om de scenario-lus in `main()`
    krijgt een `catch` die `classifyFailure` aanroept. Die meet met één fetch per origin of
    `http://127.0.0.1:5173` en `http://127.0.0.1:8787/api/settings` nog antwoorden; antwoorden ze
    allebei, dan gaat de oorspronkelijke fout ONGEWIJZIGD door, en anders stopt de run met
    `INFRASTRUCTUUR-UITVAL`, beide gemeten statussen en de oorspronkelijke melding.
    DE GRONDOORZAAK IS BEWUST NIET WEGGENOMEN. Het te repareren defect was het ETIKET, niet het
    sterven: de harness liegt niet meer, en waaróm vite omvalt blijft open.
    DE PREMISSE HIERBOVEN WAS TE SMAL, en dat is de dragende uitkomst. Dit punt noemde ÉÉN
    foutvorm — `still loading after settle`. Gereproduceerd gaf dezelfde conditie er TWEE ANDERE:
    `page.goto: net::ERR_CONNECTION_REFUSED` en `page.waitForSelector: Timeout 60000ms exceeded`
    op `#root > *`. Geen van beide is de punt-24-melding. Eén conditie draagt dus minstens DRIE
    foutvormen, en een poort BINNEN `settle()` — de voor de hand liggende plek — had er twee van
    de drie gemist. LET OP BIJ HET CITEREN: die reproductie gebruikte een NETTE stop, dus ze
    reproduceert de CONDITIE en niet de OORZAAK.
38. **De opener-fetch kapt af, en hij meldt het niet** — af · TOOLING plus norm.
    GEMETEN, twee keer en op twee bestanden: de RAW-fetch van de opener stopt rond **121200
    bytes**. Op 07-08-2026 haalde een chat `HANDOFF.md` binnen tot **121196 van de 610760
    bytes** — **19,8 procent**; 2599 van de 2954 regels kwamen niet aan en het document eindigde
    mid-zin, zonder enig signaal. Dezelfde cap gaf de vorige ronde circa 121000 op
    `docs/WERKWIJZE.md`.
    DE URGENTIE ZIT OP `WERKWIJZE.md`, NIET OP `HANDOFF.md`. Dat tweede is grotendeels ontworpen
    weg: het nieuwste STAND-blok staat bovenaan en de opener wijst daarnaar, en er passen 24 van
    de 143 blokken onder de cap. `WERKWIJZE.md` niet — die staat na de punt-21-ronde op **118399
    bytes**, dus circa **2,8 kB** onder de cap, terwijl die ronde alleen al 1561 bytes toevoegde.
    Wat als EERSTE afvalt is de STAART: *Vorm van een CC-prompt* met de vijf promptcontroles,
    *Gate*, *Prod en veiligheid*, *Close-out van een chat* en het *Opener-sjabloon*. Dat is exact
    het scenario dat het STAND-blok van de log-verhuizing al benoemde; die ronde repareerde het
    log en niet de lessen.
    DE INGREEP, byte-voor-byte verliesloos: verhuis *Recon en bewijslast* VERBATIM naar
    `docs/WERKWIJZE-LESSEN.md` en zet die als VIJFDE URL in het opener-sjabloon. Gemeten op
    `e08763c8`: die sectie is 88553 bytes van 116838 — **75,8 procent**, 121 bullets van
    gemiddeld 731 bytes — dus de norm zakt naar ongeveer 28 kB en beide helften krijgen ruime
    marge. HERMEET DIE GETALLEN BIJ DE BOUW; het zijn uitspraken over toen, niet over dan.
    Zelfde operatie als de log-verhuizing, dus bewezen.
    ROTEER DAARNAAST `HANDOFF.md` op circa TWAALF STAND-blokken — cumulatief 54050 bytes, ruim
    onder de halve cap — naar `docs/HANDOFF-ARCHIEF.md`, dat de opener bewust niet ophaalt. Er
    verdwijnt niets; git houdt alles.
    HET EIGENLIJKE VANGNET IS GOEDKOPER DAN BEIDE: elke close-out rapporteert de bytes van de
    bestanden die de opener ophaalt. De fout is niet de omvang maar dat een afgekapte fetch
    zichzelf niet meldt.
    NIET DOEN: de aanleidingen uit de lessen strippen. Dat scheelt 43009 bytes — 48,6 procent van
    de sectie — maar het zijn 89 losse knipbeslissingen, en de aanleiding draagt vaak juist het
    getal waarop de regel rust. Dat is wél iets inleveren.
    AF per 08-08-2026, docs-only: geen code, geen engine, geen migratie, geen deploy en geen enkel
    `wrangler`-commando.
    DE CAP IS HERMETEN, en het getal week af van gisteren: de chat kreeg `HANDOFF.md` binnen voor
    **121124 van de 616512 bytes** — 358 van de 2970 regels — en `docs/WERKWIJZE.md` kwam op 118399
    bytes nog wél volledig binnen. Tegen 121196 op 07-08 betekent dat de grens NIET exact in bytes
    ligt maar vermoedelijk in TOKENS; elke byte-marge is dus een schatting en geen drempel.
    *Recon en bewijslast* bleek **90136 van de 118399 bytes, 76,1 procent, 122 bullets**, en is
    VERBATIM verhuisd naar `docs/WERKWIJZE-LESSEN.md` — de norm zakt daarmee naar circa 31 kB.
    `HANDOFF.md` is geroteerd op TWAALF STAND-blokken: circa 55 kB blijft staan, circa 562 kB gaat
    naar `docs/HANDOFF-ARCHIEF.md`, dat de opener niet ophaalt.
    HET VANGNET IS TWEEDELIG, en dat is de eigenlijke reparatie. TERUGKIJKEND: elk bestand dat de
    opener ophaalt eindigt op een regel `<!-- EINDE <pad> -->`, en het opener-sjabloon draagt de
    toets erop — een afgekapte fetch meldt zichzelf niet, een ontbrekende marker wel. VOORUITKIJKEND:
    elke close-out rapporteert de bytes van die vijf bestanden met de marge tot circa 121000.
    DE MARKER IS AANTOONBAAR ROOD ZONDER DE INGREEP — de HANDOFF-fetch van deze chat miste hem — maar
    dat rood komt uit de CHAT-fetch en is door CC niet reproduceerbaar; hij leest van schijf.
    NIET GEDAAN, met reden. De aanleidingen uit de lessen strippen: 89 losse knipbeslissingen en de
    aanleiding draagt vaak het getal waarop de regel rust. En `DOELEN-SPEC` §150 aanpassen: die
    verwijst naar *Recon en bewijslast*, en die KOP blijft in de norm staan, dus de verwijzing klopt.
39. **De herstelweek snijdt in de frequentie in plaats van in het volume** — AF en LIVE (09-08-2026) · CLIENT.
    DRAAGT M79 (HEURISTIEK) EN M80 (BEVINDING). M79: de dosisverlaging die M76 vraagt komt uit het
    DUURvolume — de lange rit voorop — terwijl één tot twee korte prikkels op hun eigen relatieve
    intensiteit blijven staan; richtwaarde 40 tot 60 procent minder volume, coachconventie en geen
    wetenschap. M80: de app doet precies het omgekeerde.
    GEMETEN over 2100 weken, volledige uitwerking in `docs/PUNT19-DELOAD-RECON.md`. Op de
    testcase-weekvorm ma45 di60 do60 za120 bij FTP in Base: het volume gaat van **286 naar 285
    minuten** terwijl de drempelminuten van **98 naar 10** gaan. Belasting 63 procent van de
    opbouwweek, volledig uit de intensiteitskant; kwaliteitsdagen van **3 naar 1**. Drie andere
    weekvormen geven hetzelfde beeld: V2 479 naar 420 minuten bij 130 naar 13 kwaliteitsminuten,
    V3 479 naar 460 bij 130 naar 13, V7 450 naar 420 bij 103 naar 13. Bij Onderhoud 0 cellen, want
    dat doel draagt geen mesocyclus.
    WAT AL GOED GAAT, en dat hoort erbij: de overgebleven kwaliteitsdag HOUDT zijn karakter —
    drempelblokken op 98 tot 105 procent FTP — en halveert alleen zijn blokduur van 18 naar 10
    minuten. Dat is M76 correct geïmplementeerd. Wat niet klopt is de verdeling eromheen: de lange
    rit blijft op VOLLE duur staan (120 minuten Z2, TSS 86) en is juist de post die als eerste
    hoort te vervallen. Plek: `planner.ts:839-841`, eligibility op `:304`.
    TWEE VARIANTEN ZIJN GEMETEN EN AFGEWEZEN. Alles als weekend geeft TSS 201 en **NUL**
    kwaliteitsminuten — 77 procent van de opbouwweek, dus een week zonder prikkel. Alles als vrij
    geeft TSS 100 en 225 minuten, maar snijdt BLIND in de opgegeven tijd. Geen van beide is de fix.
    GEMETEN 09-08-2026, volledige uitwerking in `docs/PUNT39-DELOAD-RECON.md`: de volume-as W1..W7
    maal 5 doelen maal 5 (fase,meso)-paren — **175 cellen, 825 sessies**, instrument geijkt op
    **21 van de 21** gepinde waarden. PUNT 19 GAAT HIERIN OP.
    BEIDE HENDELS UIT DIT PUNT ZIJN WEERLEGD, en geen van beide raakt het volume. De
    **kalendernaam-splitsing is INERT** bij het huidige quotum: `!(isDeload && d.type !== "vrij")`
    (`planner.ts:304`) op `true` geeft **0 van de 105** bewegende cellen. Dat is inertie en geen
    no-op — de term is GEMASKEERD door het quotum zelf, want bij quotum 2 bewegen er **56 van de
    105**. Het **quotum verhogen werkt de verkeerde kant op**: `quota = 1` naar `2`
    (`planner.ts:282`) geeft wél de frequentie (1 naar 2 kwaliteitsdagen in 28 van de 28) maar
    maakt de week LANGER — **+10 tot +30 minuten** op W4 tot W7, want een quality-dag ontsnapt aan
    de 60-minutencap. Bij alle drie de patches beweegt de opbouwweek 0 van de 35 cellen.
    HET DEFECT IS VOLUME-AFHANKELIJK, en dat corrigeert de scherpte van de kop hierboven. Het
    aandeel weekbelasting uit duurdagen gaat van **9 procent bij 3,0 uur naar 46 bij 14,0**:
    onderin valt er aan de volumekant vrijwel niets weg te halen en doet de app ongeveer het
    juiste. De enige bestaande volumekrimp is de cap `Math.max(30, Math.min(60, mins || 45))` in
    `genericRecovery` (`planner.ts:2042`), die alleen weekdagen boven een uur raakt — vandaar nul
    krimp op W1 tot W3 en −10,6 procent op W7. Van de drie termen van M79 faalt er dus één: alleen
    het volume.
    DE INGREEP IS ER ÉÉN, niet twee: een **volumefactor op de SESSIEDUUR**, 0,75 tot en met vijf
    uur aflopend naar 0,55 vanaf tien uur, lineair ertussen. Quotum en eligibility blijven zoals ze
    zijn. Staat als **M86 (NORM)** in `docs/TRAININGSMODEL.md`, HERKOMST BELEID — Daan-besluit van
    09-08-2026, want er bestaat geen reeks waarop dit te ijken valt. De twee kandidaat-plekken
    (`proposal.ts:619-621` client-side, of de dagduur vóór de bouwers in `assignWorkouts`) en de te
    meten archetype-keuze op `planner.ts:943` staan in het recon-doc §7.
    DE ACCEPTATIE-EIS VOOR DE BOUWRONDE is de CURVE en geen percentage per cel:
    **75 / 75 / 71 / 63 / 55 / 55 / 55** procent volume tegenover de opbouwweek, met de
    kwaliteitsdagen ongewijzigd op 1 en de opbouwweek byte-identiek.
    PUNT 40 IS AF, dus de blokkade uit dit punt is vervallen: de meting draait op de band.
    GEBOUWD EN LIVE op `d7b8feb`, Worker Version `ef9152dc-5c86-4606-ab97-55df97449877`. DE
    INGREEP IS CLIENT-ONLY: `herstelSchaal_` in `apps/web/src/lib/proposal.ts` draagt M86 en M87
    samen, en de toepassing landt op `sessieMin` in de dag-loop — geen engine, geen worker, geen
    nieuwe route. De classificatie ENGINE in de kop hierboven is met de plek-meting vervallen.
    DE REFERENT ZIJN DE PLANNER-DAGEN VAN DE DRIE VOORGAANDE WEKEN, opgehaald met drie extra
    aanroepen van de BESTAANDE `GET /api/planner/:monday`. De weekplan-blob is AFGEWEZEN, en dat
    is op de echte D1 gemeten: hij dekt **3 van de 5** weken en wijkt waar hij bestaat **0 tot
    31,9 procent** af van de invoer (300/300, 375/300, 356/270). `planner_days` dekt 5 van de 5,
    alle vijf compleet. Dat is ook M28 — de weekplanner is de INVOER, de blob het vorige VOORSTEL.
    ACCEPTATIE GEHAALD, met de VOOR-staat als ijking: **100 / 100 / 100 / 95 / 97 / 92 / 88**
    gereproduceerd (7 van de 7), NA **76 / 75 / 72 / 63 / 56 / 56 / 56** over 84 cellen; werkband
    van de deloadweek 56 van de 56 op Base+Build en 84 van de 84 over alle paren; opbouwweken 84
    van de 84 identiek.
40. **Het drempel-label loopt dwars door de LT2-grens** — AF, gesloten zonder bouw (08-08-2026) · norm.
    DE DIAGNOSE IS BEVESTIGD. Het nominale label `drempel` draagt beide soorten werk: **6402
    minuten over 16 banden, waarvan 1824 sweet-spot (onder 95 procent FTP) en 4578 drempelwerk**.
    28 tegen 72 procent, dus geen randgeval.
    DE KNIP LIGT OP 95 EN NIET OP 100, en dat weerlegt de LT2-formulering in de kop als KNIP-plek.
    Op **95** loopt NUL band dwars — 1824 onder, 4578 boven. Op **100** worden **2742 van de 6402**
    minuten doorgesneden, **43 procent**, midden door `95-102` (2646 min) en `100-108` (630 min).
    Als DIAGNOSE blijft de formulering staan: het label loopt inderdaad over de grens heen.
    HET PLAN LAAT DRIE SCHONE NADEN: **81-88, 94-95, 109-112**. Het zone-raster knipt op
    55/75/90/105 en van die vier vallen **90 en 105 er allebei buiten** — 90 snijdt door `88-92`,
    `88-93`, `89-92` en `89-93`; 105 door `100-108` en `103-108`. De misalignment is dus een
    eigenschap van het paar raster-en-bibliotheek, niet van één sjabloon.
    TWEE LEKKEN DIE DIT PUNT NIET NOEMDE. Sweet-spot lekt óók naar `tempo` — de korte sjablonen
    dragen band `88-92`, midden 90 — en de splitsing is DUUR-gecorreleerd, dus juist bij weinig
    uren valt de prikkel buiten `drempel`. En er bestaat GEEN tempo-intent: **2172 van de 2280**
    nominale tempo-minuten komen uit `88-92` en de rest uit `86-86`, beide uitsluitend uit
    sweet-spot-archetypes. `GOAL_KWALITEIT_INTENTS_` kent drempel, sweetspot en vo2 — geen tempo.
    VERDICT: GEEN BOUW. Het meetgat gaat dicht als NORM-regel — **M81 (NORM)** en **M82
    (BEVINDING)** in `docs/TRAININGSMODEL.md`. M81: een karakter-uitspraak rust op de BAND en niet
    op het zone-label. De karakter-as zelf heeft vandaag geen consument die zonder haar stuk is,
    dus haar nu bouwen zou vooruit-bedrading zijn; punt 39 bouwt haar samen met zijn eerste
    consument. Er is bovendien GEEN engine-autorisatie nodig — de banden staan al op elk blok en de
    poort woont in `apps/web/src/lib` — dus de classificatie ENGINE is met deze meting vervallen.
    Volledige meting in `docs/PUNT40-RECON.md`; meetruimte 140 cellen, 640 sessies, 38 distincte
    banden, 39190 blokminuten, instrument geijkt op 21 van de 21 gepinde waarden.
    DEBLOKKEERT PUNT 39, 41 EN 42. De regel dat dit punt ze BLOKKEERT vervalt: die drie meten
    voortaan op de band, en M82 geeft ze de drie naden.
    EEN GECORRIGEERDE PREMISSE, en die hoort hier zodat een volgende ronde hem niet opnieuw maakt.
    De sleutel-inhaal is NIET geraakt. `planDraagtSleutelzone_` los gemeten valt om op 108 van de
    360 kwaliteitsdagen, maar hij is één van TWEE OR-termen: op de DISJUNCTIE is het **360 van de
    360** — zone-term 252, intent-term 312, nul dagen zonder sleutelstatus. Die 108 was een
    meetfout, geen gat. Zie `docs/PUNT40-RECON.md` §9.
41. **De weekmix polariseert niet bij hoger volume** — AF, gesloten zonder bouw (09-08-2026) · norm.
    GEMETEN over de volle ruimte, volledige uitwerking in `docs/PUNT41-42-RECON.md`: 7 volumevormen
    maal 5 doelen maal 12 (fase,meso)-paren — **420 cellen, 1980 sessies, 14978 blokken, 192674
    blokminuten**, instrument geijkt op 21 van de 21 gepinde waarden.
    HET PLAN POLARISEERT NIET; HET VERDUNT. Seiler-3-zone op de BAND (M81), opbouwweken, gepoold
    over doelen en macrofasen: 3,0u **69/20/10** · 4,5u 73/20/8 · 6,0u 78/17/6 · 8,0u 82/12/6 ·
    10,0u 85/11/5 · 12,0u 87/9/4 · 14,0u **89/8/3**. Piramidaal op elk volume, en sterker naarmate
    de uren stijgen — van een kanteling naar polarized is geen spoor.
    DE METHODEKEUZE IS NIET DRAGEND, en dat is zelf gemeten: midpunt, proportioneel en meerderheid
    vallen binnen 2 procentpunt samen, want op grens 80 wordt NUL minuut doorgesneden en op grens
    100 slechts **7921 van de 192674 (4,1 procent)**.
    DE ROTATIE-HYPOTHESE IS WEERLEGD — dat was de openstaande vraag van dit punt. Spanwijdte van
    het Z3-aandeel: doel **8,7** procentpunt, volume **6,9**, macrofase 3,8, mesoweek 2,8. Bij
    VASTE weekvorm, doel én fase beweegt Z3 over de mesoweken gemiddeld **0,9** procentpunt
    (maximum 3,3) over 91 groepen. De variatie is systematisch en zit in doel en volume.
    NIEUW EN NIET IN DIT PUNT VOORZIEN: de ABSOLUTE kwaliteitsdosis plafonneert. Z2+Z3 gaat van 55
    naar 92 minuten en staat vanaf 8 uur stil, terwijl het weekvolume met factor 4,67 groeit. Dat
    krijgt een eigen punt — zie punt 44.
    DRAAGT **M84** en **M85** in `docs/TRAININGSMODEL.md`. Raakt M43, M44 en M45.
42. **M78 reproduceert niet** — AF, gesloten zonder bouw (09-08-2026) · norm.
    GEMETEN over de volle ruimte, en in BEIDE termen weerlegd. Opzet: vergelijken BINNEN hetzelfde
    archetype, want een vergelijking over archetypes heen meet variant-rotatie in plaats van
    modulatie.
    MESO-TERM: over 200 groepen (weekvorm maal doel maal fase maal archetype) met minstens twee
    mesoweken is de WERKBAND — het zwaarste blok van de sessie — identiek in **200 van de 200**,
    terwijl de werkMINUTEN in 200 van de 200 bewegen. FASE-TERM: over 197 groepen met minstens twee
    macrofasen is de werkband identiek in **197 van de 197**.
    DE FACTOR IS AFGELEZEN EN NIET AANGENOMEN: 1,00 / 1,08 / 1,15 / 0,60, met de spreiding verklaard
    door afronding op één decimaal bij korte blokken.
    EEN EERSTE SIGNATUUR GAF 8 AFWIJKINGEN EN DIE WAREN GEEN PERCENTAGE-SCHALING: het aan- of
    afwezig zijn van een 65-65 vulblok bij `sweetspot_long_climb`, `vo2_hill_repeats` en
    `threshold_2x20`, terwijl de werkbanden 89-93, 112-118 en 95-100 alle drie stilstonden.
    UITKOMST: **M78 staat op INGETROKKEN** in `docs/TRAININGSMODEL.md`; **M83** draagt de bevinding.
    `mesoFactor` schaalt de DOSIS en niet het percentage, en dat is precies wat M75 en M76
    voorschrijven. Volledige uitwerking in `docs/PUNT41-42-RECON.md` §7.
43. **De normpoort staat op een midpunt-label dat identiek werk splitst** — GESLOTEN EN LIVE
    10-08-2026 · ENGINE plus CLIENT plus norm. Recon-doc `16320fd`, bouw `95751a1`, prod Version ID
    `e994c768-3d73-4aec-876b-b614b7fe1302`. UITSLAG: sweetspot **266 van de 266** cellen consistent,
    **0 weken en 0 dagen smaller**, verdamping **2866,8 → 509,1** van 30201,6 werkminuten.
    Een blok draagt nu `coreWork: true` waar het een werkprikkel is; `werkzoneLabelsVan_` opent voor
    zo'n blok de HELE band op de indeling van `pctZoneBucket_` en houdt het midpunt-label er
    onvoorwaardelijk in, dus de poort kan per constructie nooit smaller worden. Een bewaarde rij
    zonder het veld valt vanzelf terug op het oude gedrag — geen aparte tak. De uitwerking van de
    meetrondes staat hieronder; ze blijft staan omdat de bouwspec eruit volgt.
    `werkzoneLabelsVan_` (`apps/web/src/lib/zonelabels.ts:27`) poort op het MIDPUNT-label van de
    band, en twee consumenten hangen eraan die tegen GELEVERD vergelijken: de weekstem
    (`apps/web/src/lib/weektekort.ts:114`) en de blok-terugblik (`apps/web/src/lib/blok.ts:413`).
    GEMETEN, punt-40-ronde: van de **90 cellen met sweet-spot-werk** labelen er **48 het uitsluitend
    `tempo`, 33 uitsluitend `drempel` en 9 beide**. Band `88-92` en band `88-93` zijn hetzelfde
    sjabloontype met één procentpunt verschil op de bovengrens, en ze openen TEGENGESTELDE
    normpoorten. Dezelfde intent, drie uitkomsten, bepaald door welk sjabloon de rotatie koos.
    DE SLEUTEL-INHAAL VALT HIER BUITEN. Die draagt een INTENT-term naast de zone-term en meet op de
    disjunctie 360 van de 360 — daar is niets te repareren. Zie `docs/PUNT40-RECON.md` §9.
    NIET NORM-NEUTRAAL, en dat is de dragende beperking: een poort die bepaalt WAAROP geoordeeld
    wordt kan een oordeel OMKEREN. De ronde meet dus eerst PER PLEK en in BEIDE richtingen met
    aantallen, en toetst of `dosisTredeVoorstel` meebeweegt — blijft dat nul, dan is dat het
    begrenzingsbewijs.
    DE ZONE-MUNT BLIJFT ONGEMOEID. De geleverde kant komt uit intervals `power_zones` en kent geen
    grens op 95; een poort op een raster dat de geleverde kant niet heeft zou beide kanten in
    verschillende eenheden meten.
    GEMETEN 10-08-2026, ronde 1 — volledige uitwerking in `docs/PUNT43-POORT-RECON.md`. Over 420
    cellen, 1920 sessies en 13372 blokken labelt de poort van de **278 cellen met sweetspot-werk**
    er **146 uitsluitend tempo, 117 uitsluitend drempel en 15 beide**; de premisse houdt dus stand
    op een as die de fase NIET vastzet. DE PRIJS IS GEKWANTIFICEERD: **3578 van de 31474
    voorgeschreven werkminuten (11,4 procent) vallen BUITEN de poort**.
    DE AANDEEL-KANDIDAAT IS UITGEMETEN EN LOOPT VAST. Een poort op het minuten-aandeel in plaats
    van op het midpunt maakt **nul cellen en nul dagen smaller** over de hele as t 0 tot 50 — hij
    kan dus geen tekort verbergen — en draagt een PLATEAU op **t 21 tot en met 33** waar alle 278
    sweetspot-cellen consistent zijn. Maar band **`73-77`** draagt aandeel 50/50 over z2 en tempo,
    exact gelijk aan sweetspot-band `88-92`, en komt uit een naamloos `Z2 progressief`-vulblok:
    een blok op 75 procent FTP krijgt op `packages/engine/src/planner.ts:1377` de band
    `pct ± 2` en ligt daarmee per constructie op de Z2/tempo-grens. Over het HELE plateau krijgen
    daardoor **105 van de 1496 dagen** een werkzone uitsluitend uit vulling-overloop. Op aandeel
    zijn die twee niet te scheiden.
    RONDE 2 IS GEDAAN EN DE HERKOMST-KANDIDAAT IS WEERLEGD — volledige uitwerking in
    `docs/PUNT43-HERKOMST-RECON.md`. Een blok draagt over alle **14** producenten exact VIER
    velden (`minuten`, `zone`, `pctLo`, `pctHi`); de bedoeling staat op het archetype
    (`effectTags`) en reist niet mee. Op SESSIE-niveau gepoort scheidt hij de twee gevallen NIET:
    van de 122 cellen met een werkzone uitsluitend uit een niet-werkblok blijven er **121** staan,
    want de vulling zit ook BINNEN werksessies (`55-78`, `55-80`). En hij faalt op het
    begrenzingsbewijs — 0 cellen maar **84 dagen** SMALLER, doordat **2701** werkzone-minuten uit
    sessies zonder `archetypeId` komen (`95-102`, `100-108`, echt drempelwerk).
    DE KANDIDAAT DIE OVERBLIJFT IS DE MONOTONE SYNTHESE: de raak-poort voor CORE-werkblokken,
    het bestaande midpunt-label voor al het overige. GEMETEN over 420 cellen: sweetspot **266 van
    de 266** consistent, **0 cellen en 0 dagen smaller**, verdamping van **2870 van de 30201
    (9,5 procent)** naar **509 (1,7 procent)**, en het niet-werkblok-lek onder de voor-staat
    (87 tegen 108 cellen).
    DE SCOPE VERSCHUIFT DAARMEE NAAR ENGINE: het blok moet zijn bedoeling gaan dragen, plus
    doorvoer naar de bewaarde weekplan-rijen. Rijen zonder dat veld vallen terug op het huidige
    gedrag; die terugval hoort in de bouwspec en in een rood-meting.
    NOG STEEDS NIET GEDAAN: `dosisTredeVoorstel` op meebewegen, en de hertoets van
    `sleutelinhaal.ts:44`. Beide meten het EFFECT op een oordeel en vragen de GELEVERDE kant, die
    in een lege opstelling per constructie niet bestaat — ze horen op de echte D1 en in dezelfde
    ronde als de bouw.
    DE GRENZEN ZIJN AAN DE BRON GETOETST EN STAAN GOED: intervals `power_zones` geeft bij de
    testcase 55 / 75 / 90 / 105, identiek aan `ZONE5_GRENZEN_DEFAULT`. De Sweet Spot-band van
    84 tot 97 procent die intervals toont is een OVERLAY en geen zone, en loopt zelf dwars over
    de Z3/Z4-grens.
44. **De kwaliteitsdosis plafonneert vanaf acht uur** — AF 20-08-2026 · norm, COACH-CANON.
    GEMETEN in de punt-41-ronde over 420 cellen en 1980 sessies, volledige uitwerking in
    `docs/PUNT41-42-RECON.md` §6. Absolute minuten per week, opbouwweken, gemiddeld over doel en
    fase: Z2+Z3 gaat van **55** minuten bij 3,0u naar **74 · 80 · 88 · 92 · 94 · 92** bij 4,5 tot
    14,0 uur. Vanaf **8 uur staat die reeks stil**, terwijl het weekvolume van 180 naar 840 minuten
    groeit (factor **4,67**) en Z1 van 125 naar 748 (factor **6,0**). Zes extra uren leveren dus
    NUL extra kwaliteitsminuten.
    HET PLAFOND ZIT IN HET QUOTUM, NIET IN DE DOSIS PER DAG. Trainbare dagen gaan van 3 naar 6,
    maar dagen MET werk boven 100 procent FTP blijven op **1,6 à 1,75** — 1,75 / 1,63 / 0,94 /
    1,75 / 1,56 / 1,75 / 1,75 — bij 10,4 tot 18,3 zulke minuten per dag.
    DE VRAAG IS NIET OP DEZE REEKS TE IJKEN, en dat is de reden dat dit punt COACH-CANON heet en
    geen meetopdracht. "Hoeveel kwaliteit hoort bij veertien uur" is een BESLUIT van Daan —
    HERKOMST BELEID — en er bestaat geen meting die het antwoord kan dragen: de reeks laat zien wat
    de app DOET, niet wat ze zou moeten doen. Een bouw bestaat pas ná dat besluit; zonder besluit
    is er niets om tegen te bouwen.
    M45 WORDT NIET GESCHONDEN: die noemt acht à tien uur als ONDERGRENS waaronder polarized zinloos
    is en zwijgt over wat daarboven hoort. DRAAGT **M85**. Raakt M7, M43, M44 en M45.
    **HET BESLUIT IS ER per 11-08-2026 en staat als M88 (NORM).** De frequentie plafonneert
    (herkomst literatuur), de dosis per kwaliteitsdag mag niet met het volume dalen (herkomst
    BELEID). Er is GEEN getal als eis vastgelegd.
    **HET PLAFOND IS EEN CONSTANTE, GEEN ONTSTAAND GEDRAG**, en dat hoort hier zodat een volgende
    ronde het niet opnieuw zoekt. Het aantal kwaliteitsdagen komt uit één veld per doelprofiel met
    een waarde per macrofase: drie profielen staan op 3/3/3, twee op 2/3/2, de Test-fase kent geen
    sleutel en geeft 0, en een deloadweek klemt naar 1. Dat veld kent het weekvolume NIET. Bij W1
    begrenzen de beschikbare dagen het quotum, vanaf W4 begrenst het quotum de dagen — het
    "plafond vanaf acht uur" is dus een getal dat er altijd al stond.
    **DE 1,75 IS NIET DAT QUOTUM, en dat verschuift de aangewezen ingreep.** Het predicaat van de
    meting is dagen met werk boven 100 procent FTP; sweet-spot op 89-93 procent valt daar buiten
    en dat staat expliciet in `docs/PUNT41-42-RECON.md` §6. Tussen "quotum 2 of 3" en "1,75 dagen
    boven de drempel" zit een SAMENSTELLINGSSTAP die nog nooit geteld is. De ingreep is daarmee
    niet "meer kwaliteitsdagen" maar "de dagen die er staan dragen de drempel", en dat raakt M74
    en M81.
    **RUIMTE IS ER, EN DE REM ZIT NIET IN DE DAG.** W7 is ma90 di90 wo90 do90 za270 zo210: zes
    trainbare dagen waarvan vier midweekse van negentig minuten.
    **DE VOLGENDE RONDE IS EEN DECOMPOSITIE-METING, GEEN BOUW.** Ze telt per volumepunt W1..W7 de
    keten quotum → toegewezen kwaliteitsdagen → dagen met werk boven 100 procent FTP, en zoekt uit
    waarom de dosis per kwaliteitsdag bovenin DAALT (18,3 bij tien uur naar 14,9 bij twaalf en
    15,2 bij veertien). GEEN BOUW IS EEN GELDIGE UITKOMST: op wat er nu ligt kan dit punt net zo
    goed sluiten zoals 40, 41 en 42 — norm vast, verder niets. ENGINE-terrein, dus recon-first met
    een stop-en-verifieer; engine-autorisatie is nog NIET gegeven en is voor een read-only meting
    ook niet nodig.
    **PUNT 44 IS AF — GESLOTEN ZONDER BOUW (20 augustus 2026), net als 40, 41 en 42.**
    DE MEETLAT WAS HET DEFECT, NIET DE APP. De meting van M85 telde als kwaliteit uitsluitend werk
    BOVEN 100 procent FTP. De engine zelf zet de drempelzone op **91 tot 105 procent** — GEMETEN
    20-08-2026 in `packages/engine/src/zones.ts`, de 5-bucket-regel. Het predicaat sneed dus de
    onderste helft van de eigen drempelzone weg. Met de zonegrens van de engine verdwijnt het
    grootste deel van het verschijnsel dat dit punt beschreef.
    WAT BLIJFT STAAN: M88 als norm — de frequentie plafonneert (literatuur), de dosis per
    kwaliteitsdag daalt niet met het volume (beleid). Er is GEEN getal als eis en er is niets
    gebouwd. Wie dit punt heropent, meet eerst op BEIDE predicaten en noemt bij elk getal welk
    predicaat het draagt.
45. **De herstelweek kent zijn eigen referentie niet** — AF en LIVE (09-08-2026) · CLIENT plus norm.
    De volumefactor uit M86 landt op de beschikbaarheid van de HERSTELWEEK ZELF, dus stapelt hij
    op een krimp die de gebruiker al droeg. **M87 (NORM)** legt vast waartegen hij hoort te
    korten: de OPBOUWWEKEN van hetzelfde blok. Ligt de beschikbaarheid daar al onder, dan is de
    reductie geheel of gedeeltelijk al geleverd en korten we niet nog eens.
    GEMETEN, doel FTP in dezelfde herstelweek: **5x60 ingevuld geeft 225 minuten**; **3x60 geeft
    135** terwijl 180 het juiste antwoord is, want die drie uur is al 60 procent van de normale
    vijf en ligt dus al in de band die M79 vraagt; **5x45 geeft 5x34** met de kwaliteitsminuten
    van 13 naar **10**. Volledige uitwerking in `docs/PUNT39-PLEK-RECON.md` §8.
    TWEE KANDIDAAT-BRONNEN, beide gegrept en beide met hun eigen beperking. `planner_days`
    (`workers/api/src/db/schema.ts:128`) draagt `minuten` per (user_id, datum) en houdt dus de
    INGEVULDE beschikbaarheid van eerdere weken vast — zuiver (M28), maar de client haalt EEN
    week op (`apps/web/src/lib/api.ts:79`), dus het ophaalpad moet verbreed. De weekplan-blob
    draagt wél meerdere weken, maar zijn `minuten` is `Math.round(sumMin)` over `s.totaalMin`
    (`apps/web/src/lib/weekplanBlob.ts:118` en `:168`) — de GEBOUWDE sessieduur, dus het vorige
    voorstel van de app en niet de invoer, en dagen zonder sessies vallen weg. Die blob is wél
    ongegate leesbaar: `recencySeedEntries` (`apps/web/src/lib/proposal.ts:523`) doet het al, en
    `PLAN_ADAPTATION_ENABLED` (`apps/web/src/lib/planFlags.ts:28`) gate't uitsluitend
    `intentByDateFrom`. De twee sluiten elkaar niet uit.
    HOORT IN DEZELFDE BOUW ALS PUNT 39, item 6c: zonder referent doet M86 in een alledaags geval
    aantoonbaar het verkeerde. De bouwronde meet EERST welke bron bruikbaar is; blijkt geen van
    beide het, dan is dat een verdict met een getal en gaat de factor alleen.
    GEBOUWD EN LIVE op `d7b8feb`, samen met punt 39. HET VERDICT OP DE BRON IS OP DE ECHTE D1
    GEMETEN: `planner_days` dekt **5 van de 5** weken en alle vijf compleet met zeven rijen; de
    weekplan-blob dekt er **3** en heeft voor 2026-07-06 en 2026-07-13 niets. Waar beide bestaan
    wijkt de blob **0, +25,0 en +31,9 procent** af — geen systematische offset, en een orde groter
    dan de +0,9 procent van de gebouwde duur. De referent is dus `planner_days`, opgehaald met drie
    extra aanroepen van de bestaande route; het ophaalpad hoefde niet verbreed.
    M87 BIJT IN BEIDE RICHTINGEN, en die tweede is een EIGENSCHAP en geen defect: herstelweek W1
    met historie W3 gaat van 135,6 naar **179,6** minuten (het defect is weg), maar W3 met historie
    W1 gaat van 257,2 naar **157,2** — wie in zijn herstelweek MEER invult dan gewend, wordt dieper
    gekort. Dat volgt uit de norm, en het betekent dat de app beschikbare tijd laat liggen.
46. **`docs/WERKWIJZE-LESSEN.md` loopt naar de opener-cap** — AF 10-08-2026 · TOOLING.
    **ACHTERHAALD PER 21-08-2026, en dat hoort bovenaan zodat de cijfers hieronder niet meer als
    runway gelezen worden.** De opener haalt `docs/WERKWIJZE-LESSEN.md` en
    `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` niet meer op: beide staan sinds de werkwijze-omkering aan
    CC's kant. De cap-vraag voor die twee bestaat daarmee niet meer. De opener draagt nu vier
    bestanden — `HANDOFF.md`, `docs/ARCHITECTUUR.md`, `docs/TRAININGSMODEL.md` en
    `docs/DOELEN-SPEC.md` — en het krapste daarvan is `HANDOFF.md`, dat zichzelf begrenst met de
    rotatie op TWEE STAND-blokken. De meting hieronder blijft staan als vindplaats van de methode,
    niet als geldende marge.
    HERMETEN 10-08-2026, bij de close-out van punt 43. VÓÓR die close-out: **107224 bytes**, marge
    **13776** tot circa 121000. ERNA, en dit is het getal dat telt: **110213 bytes**, marge
    **10787** — die ene close-out kostte **2989 bytes**, want hij droeg zeven lessen. Het bestand is
    daarmee veruit het KRAPSTE van de vijf die de opener ophaalt; de vier andere staan op 63229,
    37588, 32544 en 31808. De groei is over de laatste zeven close-outs gemeten op **ruwweg 2200
    bytes per ronde**, dus de runway is nog **ongeveer vijf rondes**. De eerdere schatting stond op
    102123 bytes, marge 18877 en zeven rondes; die is hiermee vervangen. Let op de richting: de
    marge daalt sneller dan het rondetempo suggereert, want een close-out die afwijkingen draagt
    levert meer dan één les — 2989 tegen de verwachte 2200 is daar meteen een geval van.
    DE INGREEP VAN PUNT 38 IS HIER NIET ZOMAAR TE HERHALEN, en dat is de hele reden dat dit een
    eigen punt is. Het wijzigingslog kon weg omdat het uitsluitend ACHTERAF verantwoordt en de
    opener het bewust niet ophaalt; de lessen zijn WERKENDE DISCIPLINE die elke chat bij zijn start
    MOET lezen. Verplaatsen naar een niet-opgehaald bestand zou ze stilzwijgend uitzetten — precies
    het gat dat de log-verhuizing zelf blootlegde toen de eis over de logregel als imitatie leefde.
    DE KNIP IS EEN ONTWERPVRAAG en geen mechanische verhuizing: splitsen in twee lessen-bestanden
    met een ZESDE opener-URL, of een andere ordening waarin de lessen korter kunnen zonder hun
    aanleiding te verliezen. Die aanleiding draagt vaak juist het getal waarop de regel rust — punt
    38 mat dat op 89 losse knipbeslissingen en wees het af.
    **AF per 10-08-2026:** gesplitst in twee bestanden die de opener ALLEBEI ophaalt, bouw
    `5de6c3f`. `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` draagt de **57** lessen waarvan de grond aan
    een tool, bestand, commando of harness in deze repo hangt en die dus verouderen;
    `docs/WERKWIJZE-LESSEN.md` houdt de **87** over de VORM van bewijs. VERLIESLOOS BEWEZEN:
    multiset-gelijkheid over de twee nieuwe rompen gaf **0 verschillen op 985 distincte regels**,
    986 rompregels aan beide kanten — een "precies één keer"-toets zou per constructie zijn
    gevallen over de ene regel die er twee keer in staat. De krapste opener-marge ging van **10787
    naar 56166**, en het knelpunt verschoof naar `HANDOFF.md`, dat zichzelf begrenst met de rotatie
    op twaalf STAND-blokken. Het sjabloon telt sindsdien **zes** URL's. De as die dit punt zelf
    voorstelde is gemeten en afgevallen: "nog dragend voor een openstaand punt" snijdt niet — 89
    van de 144 lessen noemen geen puntnummer, 50 van de 55 die er wél een noemen doen dat binnen de
    aanleiding, en inkorten levert 2,1 procent.
47. **De check valt in twee: IJKING en DOELCHECK** — open · norm plus CLIENT. Daan-besluit
    21-08-2026. **HET NORM-BESLUIT IS GENOMEN op 22-08-2026 en WOONT IN `docs/TRAININGSMODEL.md`
    §13 — M89, M90 en M91.** M89 legt de twee vragen vast, M90 hangt de ijking aan de doelblokgrens
    en maakt haar een VOORSTEL (met de één-per-doelblok-cadans als HEURISTIEK), en M91 zegt dat een
    afwijzing geen meting is en dat de ONGEIJKT-staat gedragen en gezegd moet worden. De canon
    hieronder blijft staan als de aanleiding; de norm zelf leest men voortaan in het model.
    DE RECON DIE ERBIJ HOORT staat in `docs/PUNT47-RECON.md` (22-08-2026, read-only op `ad10bf7`).
    Twee verwachtingen VIELEN daar: er BESTAAT een twaalfweekse blokgrens die zelfs een datum
    levert (`doelTestWeken_` in `packages/engine/src/niveau.ts`), en `doelStart` WORDT bij een
    doelwissel herschreven (`blokStartBijDoel` in `apps/web/src/lib/settings.ts`) — hij schuift
    alleen niet automatisch op als een blok afloopt. Ook vastgesteld: de canon-tegenspraak die het
    STAND-blok van 22-08 noemde BESTAAT NIET; dit punt weerlegt zijn eigen samenvallen-formulering
    twee alinea's verder. Wat wél openstaat is de MAAT uit `DOELEN-SPEC` §3.2, en dat is een
    bouwvraag.
    De app kent vandaag één vraag aan het eind van een blok, en dat zijn er twee.
    **IJKING** — klopt mijn FTP nog, zodat de zones kloppen — geldt bij ELK doel zonder
    uitzondering, want élk plan doseert op %FTP en een verlopen FTP verschuift stilzwijgend elke
    zonegrens en daarmee elke norm. **DOELCHECK** — is dit doel vooruitgegaan — verschilt per
    doel. Bij FTP en bij Onderhoud vallen die twee samen: daar IS het 20-minutenvermogen de maat,
    bij het eerste omhoog en bij het tweede niet-omlaag. Bij Conditie en bij beide klimdoelen
    vallen ze uit elkaar, want `DOELEN-SPEC` §3.3 t/m §3.5 wijzen daar een durability- of
    dag-twee-maat aan die met een 20-minutentest niet te meten is. GEVOLG voor de code: de poort
    `blokCheckEnabled` in `apps/web/src/lib/blok.ts` sluit Onderhoud vandaag uit van het
    testaanbod met als reden "geen effect-meter", en dat is precies het doel waar ijking en
    doelcheck wél samenvallen. Dit punt legt de splitsing vast; punt 34 bouwlijst (d) beslist of
    die poort ook opengaat.
    **BIJ ONDERHOUD LOPEN DE TWEE HELFTEN UIT ELKAAR, en juist dat maakt het het ontwerpgeval.**
    Herkomst: BESLUIT. De IJKING is er WÉL nodig — sterker nog, daar is ze het hardst nodig: een
    onderhoudsblok loopt een hele winter, élk plan doseert op %FTP, en een FTP die ondertussen
    verloopt verschuift stilzwijgend elke zonegrens en daarmee elke norm waarop de app oordeelt.
    De DOELCHECK is er tegelijk iets ANDERS: een VLOER, geen stijging (`DOELEN-SPEC` §3.2 — niet
    meer dan enkele procenten zakken). Hierboven staat dat ijking en doelcheck bij Onderhoud
    "samenvallen" omdat ze dezelfde METER delen; dat is waar over de meter en onwaar over de
    VRAAG. Dezelfde 20 minuten beantwoorden twee verschillende vragen — klopt mijn schaal nog, en
    heb ik vastgehouden — en alleen de tweede is doel-specifiek. Elk ander doel laat die twee
    ofwel volledig samenvallen (FTP) ofwel volledig uiteenlopen (Conditie en beide klimdoelen);
    Onderhoud is het enige geval waar ze dezelfde meting delen met een verschillend criterium, en
    daarom is het het geval waarop deze splitsing zich laat ontwerpen in plaats van beredeneren.
    **ZES BEVINDINGEN UIT DE RECON VAN 22-08-2026, die dit punt moet meewegen.** Herkomst voor alle
    zes: RECON `ffc6d9ab682f689c92b374b66fdf7681b5d2441f`.
    (i) DE POORT BEROEPT ZICH OP EEN PARAGRAAF DIE HET TEGENDEEL ZEGT. `blokCheckEnabled` is poort
    (2) van `buildTestVoorstel` in `apps/web/src/lib/testvoorstel.ts`, en zijn commentaar luidt
    "Onderhoud heeft geen effect-meter (DOELEN-SPEC §3.2)" — terwijl §3.2 daar juist wél een
    effect-maat vastlegt, en punt 34 er inmiddels een `behoud`-tak op gebouwd heeft. Onder het
    besluit van dít punt — de IJKING geldt bij ELK doel — blokkeert die poort niet alleen een
    doelcheck maar ook de ijking, en dat is de helft die bij Onderhoud juist nodig is.
    (ii) DE BEHOUD-VLOER BESTAAT AL EN IS NIET AANGESLOTEN. `ONDERHOUD_VLOER_PCT` (0,95) en
    `onderhoudVloerW` staan in `apps/web/src/lib/niveau.ts` en rekenen `instapNiveau() * 0,95` in
    watt — dus op `rolling_ftp`. De enige aanroeper is `apps/web/src/pages/Niveau.tsx`; de
    blok-terugblik gebruikt hem NIET. Er ligt dus al een vloer-mechanisme dat een doelcheck bij
    Onderhoud zou kunnen dragen, op een andere plek en op een andere meter dan §3.2 noemt.
    (iii) DE MAAT UIT §3.2 BESTAAT NIET IN CODE. Het beste 20-minutenvermogen over zes weken wordt
    nergens berekend en nergens tegen een procentuele vloer gelegd. De power-curve kent een
    20-minuten-marker (`PC_MARKERS_` in `packages/engine/src/niveau.ts`) maar alleen de vensters
    `90d` en `1y` (`PowerCurveWindow` in `workers/api/src/integrations/powercurve.ts`), en hij
    voedt uitsluitend het rijdersprofiel via `pcNormalize_`. Wie §3.2 letterlijk wil bouwen, bouwt
    een nieuwe afgeleide; wie hem via (ii) benadert, gebruikt een andere grootheid en zegt dat.
    (iv) ER STAAN TWEE DEFINITIES VAN "METING" NAAST ELKAAR. `blokGelegenheid` telt uitsluitend een
    A/B-race-event of een door de app ingeplande test mee en sluit de intensiteits-heuristiek
    expliciet uit; `laatsteGelegenheid` leest een SPRONG in de reeks wél als recente meting, en
    voedt daarmee poort (7). Dezelfde rit is dus voor het ene mechanisme geen meetmoment en voor
    het andere wel. Dat is vandaag verdedigd (een sprong als gelegenheid zou circulair zijn), maar
    het is wel de tweede plek waar "meting" iets anders betekent.
    (v) HET SPIEGELBEELD VAN PUNT 50, EN HET IS DEZE CONFLATIE ZELF. Bij Conditie, Korte en Lange
    beklimmingen zegt de effect-copy dat rolling FTP niet de maat is voor dit doel, terwijl
    `buildTestVoorstel` op diezelfde invoer een 20-minuten-FTP-test AANBIEDT — gemeten, niet
    beredeneerd. Punt 50 haalt de tegenspraak weg aan de kant waar de app iets belooft; deze kant
    belooft niets maar biedt wél iets aan, en precies daar zit het verschil tussen ijking en
    doelcheck: die test is als IJKING volkomen zinnig en als DOELCHECK zinloos.
    (vi) DE BELOFTE EN HET AANBOD RENDEREN NOOIT IN DEZELFDE WEEK. De terugblik staat in blokweek 1
    en het testaanbod in blokweek 4, achter poort (1). Wie de twee helften ontwerpt, ontwerpt dus
    ook WANNEER elke helft zich meldt — en kan niet aannemen dat de gebruiker ze naast elkaar ziet.
    **OPEN VRAAG VOOR DE BOUW-RECON — ONDERDRUKT EEN DOELWISSEL HET IJKAANBOD?** Twee helften met
    verschillende herkomst, en dat verschil is dragend. GEMETEN (RECON
    `ffc6d9ab682f689c92b374b66fdf7681b5d2441f` en `18b749c`): `blokStartBijDoel` in
    `apps/web/src/lib/settings.ts` HERSCHRIJFT `doelStart` bij een doelwissel naar een verse
    maandag, en poort (1) van `buildTestVoorstel` eist `blokWeekVanWeek(...) === BLOK_WEKEN`, dus
    blokweek 4. VERMOEDEN, herkomst CHAT en NIET gemeten: staat `doelStart` na een wissel op de
    maandag van die week, dan leest `blokWeekVanWeek` daar 1, en duurt het drie weken voordat poort
    (1) weer opengaat. Klopt dat, dan onderdrukt een doelwissel het ijkaanbod precies op het moment
    dat M90a het vraagt — de grens van een doelblok is bij een wissel juist NU, en dat is het
    moment waarop de zones voor het nieuwe doel gezet moeten worden. TE METEN, niet aan te nemen:
    draai `blokWeekVanWeek` en `buildTestVoorstel` over een wissel heen en lees af wat er gebeurt.
    Let er bij het meten op dat de twee klokken uiteenlopen: poort (1) hangt aan de VIERWEEKSE
    `BLOK_WEKEN`, terwijl M90a over de TWAALFWEEKSE doelblokgrens spreekt (`doelTestWeken_` in
    `packages/engine/src/niveau.ts`). Welke van de twee de ijking hoort te dragen is zelf een
    bouwbeslissing.
    **DE BOUWRONDE VAN 23-08-2026 IS GESTOPT VÓÓR DE EERSTE REGEL CODE, en dat is de opbrengst.**
    Volledige verantwoording in `docs/PUNT47-BOUW.md`. De ronde draaide als de proef van punt 52,
    met vier verwachtingen als VOOR-AUTORISATIE. **V1 VIEL:** de vierweekse klok bindt het
    ijkaanbod NIET op één plek, maar op DRIE, en die drie hangen aan elkaar. (a) Poort (1) zelf.
    (b) Een tweede gebruik van dezelfde klok in hetzelfde bestand — `blokStartVoorWeek` plus
    `BLOK_WEKEN * 7` bouwen het venster waarmee poort (3) een reeds ingeplande test onderdrukt.
    (c) `blokStart` REIST HET BESTAND UIT als veld op de teruggegeven `TestVoorstel` en wordt buiten
    `testvoorstel.ts` gelezen als de AFWIJS-SLEUTEL, in `SchemaView.tsx` (`isTestVoorstelAfgewezen`)
    en in `TestVoorstelCard.tsx` (`afgewezen.add`). "Niet dit blok" betekent vandaag dus "niet dit
    VIERWEEKSE blok". Alleen poort (1) omhangen laat de afwijzing over een ander blok gaan dan het
    aanbod. DE OMHANGING IS DAARMEE GEEN CONDITIE MAAR EEN SAMENHANGENDE WIJZIGING VAN DRIE DINGEN:
    de poort, het onderdrukkings-venster en de identiteit van het aanbod. Dat hoort in de
    bouwprompt te staan vóórdat er iemand aan begint.
    **V2, V3 EN V4 HIELDEN, alle drie gemeten met de echte functies.** V2: de twaalfweekse teller
    leeft — 4 doelblok-testweken over 52 weekmaandagen vanaf `doelStart` `2026-06-29`
    (2026-09-14, 2026-12-07, 2027-03-01, 2027-05-24), en **0 van de 4** wordt door de event-fase
    overschaduwd; `effectiveMacroFase_` geeft in alle vier `Test`. `computeMacroPhase` is in
    `apps/web/src/lib` al geïmporteerd door `blok.ts`, `faseOvergang.ts`, `proposal.ts` en
    `schema.ts`, dus de omhanging vraagt GEEN engine-wijziging. V3: een doelwissel zet de nieuwe
    `doelStart` op blokweek 1 (5 van de 5 gemeten wisseldagen), dus het gat is reëel — vandaag drie
    weken, na een naïeve omhanging ELF. V4: `DOEL_BLOK_WEKEN * 7` is 84 dagen tegen
    `TEST_INTERVAL_DAGEN` 90, dus de dag-vloer onderdrukt elke doelblokgrens die op de vorige ijking
    volgt met precies 6 dagen.
    **HET STRUCTURELE FEIT DAT DE PRIJS VERANDERT, en dat geen van beide kanten had opgeschreven:**
    twaalf is een veelvoud van vier, dus elke twaalfweekse grens IS al een vierweekse blokweek 4
    (gemeten: `blokweek4=4` bij alle vier de testweken). De omhanging is een VERSMALLING van dertien
    openingen per jaar naar vier, niet een verschuiving naar andere weken. Er komt geen enkel nieuw
    aanbodmoment bij.
    **DIE GROND IS OP 23-08-2026 WEERLEGD EN DE VERVALLENVERKLARING IS INGETROKKEN — zie (ζ)
    hieronder.** Hij telde OPENINGEN van de poort waar het om GELEVERDE IJKINGEN OP DE GRENS gaat,
    en op die grootheid doet de omhanging precies het omgekeerde van wat hij beweerde.
    **DE TWEEDE BOUWRONDE, 23-08-2026 middag, IS OOK GESTOPT VÓÓR DE EERSTE REGEL CODE.**
    Verantwoording in `docs/PUNT47-BOUW.md` §7 t/m §12. Het voorstel was `TEST_INTERVAL_DAGEN` (nu
    90) AFLEIDEN van de doelbloklengte, als de dag-uitdrukking van M90b: 12 maal 7 is 84. **W2 VIEL,
    op allebei zijn eigen valcondities.** W1, W3 en W4 hielden.
    LET OP BIJ HET LEZEN: de eerste uitslag van die ronde luidde dat vloer 84 de grens NOOIT raakt
    (0 van de 154). **Die uitslag was FOUT en is adversarieel weerlegd vóór de commit**; wat
    hieronder staat is de herstelmeting. Neem het cijfer 0-van-154 nergens over.
    (α) ONDER DE GESTIPULEERDE BEGINCONDITIE — de vorige maximale inspanning ligt op de vorige
    doelblokgrens — klopt het voorstel: over alle 49 paren van weekdag-offsets landt het aanbod in
    de doelblok-testweek zelf bij 28 van de 49 op vloer 84, tegen 1 van de 49 op vloer 90. Die
    stipulatie is echter niet zelf-instandhoudend en dus geen eigenschap van de app.
    (β) DE BESLISSENDE MAAT IS HOEVEEL DOELBLOKGRENZEN WERKELIJK EEN IJKING KRIJGEN. Gemeten over 40
    ketens van 260 weken, elk met een eigen seed, dus 840 grenzen per variant, uitsluitingen geen.
    Bij een VASTE weekvorm: huidig (vierweekse poort, vloer 90) 210 van de 840 = 25,0% bij 3,29
    aanbiedingen per jaar; het VOORSTEL (vierweekse poort, vloer 84) 210 van de 840 = **25,0%** bij
    4,35 per jaar. Bij een WISSELENDE weekvorm — het realistische geval: huidig 210 van de 840 =
    25,0% bij 3,31 per jaar; het voorstel 227 van de 840 = **27,0%** bij 3,74 per jaar.
    **HET VOORSTEL VERANDERT DUS NIETS AAN DE GROOTHEID WAARVOOR HET BEDOELD WAS**, en biedt
    ondertussen vaker aan in weken die géén grens zijn.
    (γ) HET MECHANISME, en het ligt NIET bij de gelijkheid 84 = 12 maal 7. Poort (1) laat alleen
    blokweek 4 door, dus openingen liggen 28 dagen uit elkaar en de afstand tussen twee aanbiedingen
    is `ceil(vloer / 28)` maal 28 dagen. Die afstand behoudt de doelblokweek zodra die factor een
    drievoud is. Gemeten over vloer 50 t/m 120 op één keten: 50-56 cyclus {4,8,12}; **57-65 LOCK op
    {4}; 66-84 LOCK op {8}**; 85-93, 94-112 en 113-120 weer cyclus. **Vloer 84 is niet te
    onderscheiden van elke vloer van 66 t/m 84 — negentien waarden, identiek gedrag.** De afleiding
    uit de doelbloklengte levert dus een getal op dat rekenkundig samenvalt met een hele band
    willekeurige waarden.
    (δ) DE LOCK OVERLEEFT GEEN ECHTE PLANNER. Met een weekvorm die per week een andere ruimste dag
    oplevert — 60 deterministische ketens per vloer, zaden 1 t/m 60 — houdt **0 van de 60** ketens
    een vaste doelblokweek, bij BEIDE vloeren, en worden de vloeren ononderscheidbaar: 90 raakt 321
    van de 973 (33,0%), 84 raakt 352 van de 1116 (31,5%). Bij een VASTE weekvorm is 84 juist
    alles-of-niets: over 120 seeds klikt de keten vast op {4} bij 64 seeds, {8} bij 28 en {12} bij
    28 — 28 seeds waarin elk aanbod raak is, 92 waarin er geen enkele raak is.
    (ε) WAT ER OOK NOG AAN VASTZAT: de bestaande test `"toetsen op de WEEKMAANDAG zou het aanbod
    ONDERDRUKKEN — 88 dagen"` verliest onder vloer 84 niet alleen zijn assertie maar zijn hele
    bewijskracht — 88 en 93 liggen dan allebei boven de vloer en het contrast verdwijnt. Die fixture
    had vervangen moeten worden, niet bijgesteld.
    (ζ) **WAT WEL WERKT, GEMETEN, en het is de OMHANGING — samen met de vloer.** Poort (1) op de
    doelblok-testweek in plaats van blokweek 4 (equivalent gemeten: elke doelblok-testweek IS al
    blokweek 4, dus alleen daar aanroepen). Bij een VASTE weekvorm: rooster met vloer 90 geeft 437
    van de 840 = 52,0% bij 2,19 per jaar; rooster met vloer 84 geeft 839 van de 840 = **99,9%** bij
    4,20 per jaar. Bij een WISSELENDE weekvorm: rooster met 90 geeft 52,0% bij 2,19 per jaar;
    rooster met 84 geeft 562 van de 840 = **66,9%** bij 2,81 per jaar. **De twee onderdelen werken
    alleen samen**: de vloer alleen laat 25,0% op 25,0% staan, het rooster alleen haalt de helft
    omdat 84 dagen tussen twee grenzen een vloer van 90 nooit haalt. Het resterende derde deel bij
    een wisselende weekvorm heeft een benoemde oorzaak — schuift de ruimste dag naar vroeger in de
    week dan hij vorige keer lag, dan haalt hij de vloer net niet — en dat is **punt 55**.
    GEEN AUTORISATIE IN RONDE 2: de combinatie raakt poort (1), en dat verbood die prompt op de nu
    weerlegde grond.
    **GEBOUWD IN RONDE 3, 23-08-2026 avond — DIT DEEL VAN PUNT 47 IS AF.** De versmalling van poort
    (1) naar de doelblok-testweek en `TEST_INTERVAL_DAGEN` op 84 zijn SAMEN doorgevoerd als één
    wijziging, in `apps/web/src/lib/testvoorstel.ts`; geen regel in `packages/engine`. Poort (1)
    leest nu `computeMacroPhase(...).isTestWeek`, met een vroege uitgang op een ontbrekende
    `doelStart` omdat die functie anders op `new Date()` terugvalt en deze laag geen ambient klok
    mag hebben. NAGEMETEN op de gebouwde bron, zonder substitutie: de poort vuurt 21 van de 21 keer
    in een doelblok-testweek en 0 keer daarbuiten, en de dekking reproduceert de voormeting teken
    voor teken — **8419 van de 8421 (100,0%)** bij een vaste weekvorm en **5613 van de 8421
    (66,7%)** bij een wisselende, tegen een baseline van 2033 van de 8421 (24,1%). Rood-meting per
    plek: de vloer terug op 90 laat drie benoemde tests vallen, poort (1) geneutraliseerd drie
    andere. Suite van 1010 naar 1016 over 78 bestanden.
    WAT VAN 47 OPEN BLIJFT: de MAAT uit `DOELEN-SPEC` §3.2 (punt 54), de duurzame ONGEIJKT-staat
    van M91 (punt 53), het verdwenen retry-venster (punt 55) en de dagkeuze van poort (6) die de
    vloer niet kent (punt 58).
    **RONDE 4, 23-08-2026 — DE PLAATSING IS OMGEKEERD EN DAARMEE IS DE BOUW VAN 47 AF.** Norm:
    **M92** in `docs/TRAININGSMODEL.md` §13, die M90a op het punt van de PLAATSING vervangt (M3:
    niets hernummerd, M90 blijft staan met een notitie erbij; M90b, M90c en M91 gelden ongewijzigd).
    De ijking valt niet meer op het EINDE van een doelblok maar op zijn OPENING, want de
    drempelwaarde doet zijn werk VOORUIT — en bij een doelwissel meet de eind-plaatsing het
    aflopende doel af terwijl het nieuwe blok twaalf weken op een onbevestigde waarde doseert.
    GEBOUWD: poort (1) toetst `computeMacroPhase(...).week === DOELBLOK_OPENINGSWEEK` (1), en
    `TEST_INTERVAL_DAGEN` is AFGELEID als `DOEL_BLOK_WEKEN * 7 - AANBODVENSTER_DAGEN` = **77**. Geen
    engine geraakt. GEMETEN op de gebouwde bron: **440 van de 440** openingen gedekt tegen 277 van
    de 420 daarvoor, 462 aanbiedingen waarvan **0** buiten een opening, en de wachttijd tussen twee
    ijkingen van gemiddeld **129,1 naar 84,0 dagen** — onder de 111,5 van vóór de hele ingreep, bij
    BEIDE weekvormen. Een doelwissel levert nu een aanbod in de wisselweek zelf; onder de oude poort
    leverde hij er per constructie nooit een.
    TWEE COPY-STRINGS MOESTEN MEE, want zij waren door de verhuizing onwaar: `Dit blok loopt af. `
    werd `Er begint een nieuw blok. `, en `die waarde ijkt je volgende blok.` werd `die waarde ijkt
    dit blok.`
    GEVOLG VOOR M89, en dat is de kern van dit punt: de twee vragen scheiden nu ook in de TIJD. De
    IJKING staat vooraan en kijkt vooruit, de DOELCHECK staat achteraan en kijkt terug. Die tweede
    helft is nog niet gebouwd — punt 61.
48. **Geen testaanbod rond een A- of B-event** — open · CLIENT. Daan-besluit 21-08-2026. Een
    event is een event: daar geef je alles, en het event is zelf de betere meting. Een
    20-minuten-all-out kost twee tot drie dagen herstel, en in een taper vernietigt hij precies
    wat die taper opbouwt. De app kent A en B al — `isMaximaalEvent_` in
    `apps/web/src/lib/effect.ts` toetst `type` race en prioriteit A of B — dus dit is een
    CONDITIE ERBIJ in `buildTestVoorstel` (`apps/web/src/lib/testvoorstel.ts`), geen nieuw
    begrip en geen nieuw getal. Er staat vandaag al een horizon-poort van
    `WEDSTRIJD_HORIZON_DAGEN` dagen vóór een A/B-wedstrijd; wat dit punt toevoegt is dat het
    besluit expliciet vastligt en niet als bijvangst van die ene constante blijft leven. GEEN
    prioriteitsvertakking (C telt niet mee, zoals nu) en GEEN taper-uitzondering.
49. **De doelcheck aflezen uit een sleutelsessie** — open · DATA plus CLIENT. Bij de drie doelen
    zonder FTP-check (punt 47) is de check geen aparte test maar een SLEUTELSESSIE waarvan je de
    uitkomst afleest: staat herhaling 5 en 6 nog op niveau, hoe lang was het langste aanhoudende
    drempelblok, wat deed dag twee tegen dag een. GEMETEN 21-08-2026 wat dat vraagt.
    UIT D1 NIET AF TE LEZEN: `zone_times_json` draagt over alle **209** ritten met een waarde
    precies **8** totalen per zone (`Z1` t/m `Z7` plus `SS`, sleutels alleen `id` en `secs`),
    zonder tijdas en zonder volgorde. 810 seconden in Z5 kan één blok van dertien minuten zijn of
    zes van tweeënhalf, en de rij zegt niet welke. Geen enkele van de 19 kolommen van `activities`
    draagt per-blok-data.
    UIT DE LIVE FETCH WEL: `GET /activity/{id}/intervals` is AANGESLOTEN en levert per blok label,
    zone, duur, %FTP en watts in volgorde — `buildRideDetailModel_` in
    `workers/api/src/integrations/ride.ts` mapt het naar `RideInterval`
    (`packages/shared/src/ride.ts`), en de client toont het al via `GET /api/ride/:id`.
    DIT IS DUS EEN PERSISTENTIE-VRAAG, geen ontsluitingsvraag. `ride.ts` is expliciet stateless —
    "geen cache, geen schema-touch" — en een doelcheck over twaalf weken vraagt opslag én
    aggregatie. Dat raakt het D1-schema en hoort daarom een eigen bouw met een eigen migratie.
    EERSTE STAP VAN DIT PUNT, en nog NIET gedaan: meten of `icu_intervals` voor Daans ritten
    werkelijk gevuld is. Dat vraagt een HTTP-call naar intervals.icu, en die is in de meetronde
    van 21-08 bewust niet gedaan.
    PARITY: de bevroren GAS-app draaide dit al werkend — `rideIntervals_` in `src/WebApp.gs`
    classificeerde blokken als werk op tempo, drempel en anaeroob. Die classificatie is bij de
    port niet meegekomen; `RideInterval` draagt wel `pctFtp` en `watts`, dus ze is afleidbaar.
    KLEIN EN APART, gemeten in dezelfde ronde — **de dode plek als een test wordt gepland maar
    niet gereden.** De override blijft in `day_state` staan, poort (3) van `buildTestVoorstel`
    ziet hem en geeft null, en `blokGelegenheid` geeft óók null omdat de gereden-toets faalt. Het
    blok krijgt dan geen tweede aanbod én geen gelegenheid. Hoort bij dit punt omdat het dezelfde
    wortel heeft: de app leest de UITVOERING van een geplande sessie niet terug.
50. **De coach belooft bij Onderhoud een test die hij daar nooit voorstelt** — AF 22-08-2026 EN
    LIVE · CLIENT plus norm. GEMETEN op commit `8a95f52`, met een wegwerp-opstelling buiten de
    repo-tree.
    DE ZIN EN DE POORT SPREKEN ELKAAR TEGEN. Doel Onderhoud, geen stijging en geen gelegenheid
    levert `doelTak` `behoud` met `uitkomst` `niet_meetbaar`, en die valt op de bestaande
    `niet_meetbaar`-pool in `apps/web/src/lib/coachNarrative.ts`. Die pool eindigt op "Loopt dat
    richting drie maanden, dan stel ik in een rustweek een test voor" — terwijl
    `buildTestVoorstel` in `apps/web/src/lib/testvoorstel.ts` voor Onderhoud op poort (2)
    (`blokCheckEnabled`) null geeft en er dus in geen enkele rustweek een testvoorstel komt.
    DIT IS DE STANDAARD VOOR ONDERHOUD, GEEN RANDGEVAL. In de levende database staan 0 races en 0
    test-overrides, dus `blokGelegenheid` geeft over de hele historie null. Zodra het doel op
    Onderhoud staat is `niet_meetbaar` daarmee de normale uitkomst en is de onware belofte de
    normale zin — niet een tak die zelden vuurt.
    SCHENDING VAN M55 (`docs/TRAININGSMODEL.md`): de coach claimt een HANDELING die niet bestaat.
    Dat is hetzelfde patroon als de al gesloten "zullen we een test inplannen?" zonder knop en als
    de dosis-belofte zonder mechanisme — een aanbod dat geen mechanisme heeft.
    RICHTING NIET VASTGELEGD, en dat hoort bij het punt zelf: de zin doel-afhankelijk maken is de
    goedkope kant, de poort openzetten de dure (zie punt 34 (d), dat om een andere reden dicht
    bleef). RAAKT punt 47 en 48 inhoudelijk — 47 beslist wat een check bij Onderhoud überhaupt
    moet aantonen — maar WACHT ER NIET OP: dit is een onware zin die vandaag draait, en die kan
    zonder dat besluit al waar gemaakt worden.
    **SCOPE-GRENS, EN DIE IS DRAGEND.** Dit punt haalt UITSLUITEND de niet-inbare belofte weg. De
    vraag wát een Onderhoud-blok dan afsluit — welke check daar hoort, en of er überhaupt een
    meetmoment nodig is — valt onder punt 47 en wordt hier NIET beantwoord. Zonder deze grens
    groeit 50 vanzelf uit tot de ijking-vraag: wie de zin gaat herschrijven moet iets in de plaats
    zetten, en het eerste wat zich aandient is een uitspraak over wat er wél gemeten wordt. Dat is
    precies het besluit dat 47 draagt. De toets op dit punt is dus smal en negatief: de app belooft
    niets meer wat ze niet doet. Meer is winst voor een volgend punt, niet voor dit.
    **AF per 22-08-2026, gebouwd in `3a9d5458`.** De `niet_meetbaar`-pool in `blokEffectRegel`
    (`apps/web/src/lib/coachNarrative.ts`) splitst op `doelTak`; de `behoud`-tak draagt dezelfde
    twee varianten met UITSLUITEND de belofte-zin eraf. `key` blijft aan beide kanten
    `niet_meetbaar`, zodat `seedIndex` in beide pools dezelfde index kiest — daarmee is het
    aantoonbaar dezelfde zin met de belofte eraf en niet stilzwijgend de andere variant. Geen
    oordeelswijziging, geen poort geraakt, geen engine: `apps/web/src/lib/testvoorstel.ts` en
    `blokCheckEnabled` hebben een lege diff.
    DE WAT-ALS HIELD OP ALLE DRIE DE VERWACHTINGEN. Precies ÉÉN cel bewoog — `Onderhoud` x
    `niet_meetbaar` x gelegenheid=nee — en de teller ging van 1 van de 14 naar **0 van de 14**. De
    dertien andere bereikte cellen zijn byte-identiek. Nul asserties braken, waar er twee verwacht
    werden; de vier treffers op de verwijderde zin bleken alle vier COMMENTAAR. Die misrekening is
    als les vastgelegd: een assertie-telling per BESTAND is geen blast-radius-maat voor één string.
    DE NOEMER HOORT ER IN TWEEVOUD BIJ. 1 van de 30 matrix-cellen klinkt klein, maar het is 100
    procent van de ECHTE Onderhoud-blokken: er staan 0 races en 0 test-overrides in de database,
    dus `blokGelegenheid` geeft over de hele historie null en `niet_meetbaar` is daar de normale
    uitkomst. `noemtTest` blijft op die cel `true` — "geen test of wedstrijd" is een constatering
    en geen belofte, en dat is precies het onderscheid dat dit punt maakt.
    WAT NIET IS OPGELOST EN BIJ 47 LIGT: de poort blijft dicht, de vraag wat een Onderhoud-blok
    dan afsluit is niet beantwoord, en het SPIEGELBEELD draait vandaag nog — bij Conditie, Korte en
    Lange zegt de copy dat rolling FTP niet de maat is terwijl de poort op diezelfde invoer een
    20-minuten-FTP-test aanbiedt.
51. **Het CC-harnas als vangnet** — open · TOOLING plus norm. GEMETEN 23-08-2026, zie
    `docs/GEREEDSCHAP-RECON.md`. GROND: *De volgorde*, rangorde-principe (2) — eerst het
    ontbrekende vangnet, zodat elke ronde daarna goedkoper is. Dat principe kostte eerder al de
    render-testlaag van punt 33, en die betaalde zich terug bij elke kaart-ronde erna.
    WAT ER VANDAAG STAAT, gemeten. `.claude/` draagt drie bestanden en GEEN ENKELE map: geen
    `rules`, geen `skills`, geen `agents`, geen `commands`, geen `hooks`. Er draait geen enkele
    hook — niet in `settings.json`, niet in `settings.local.json`, niet op gebruikersniveau, en
    ook geen git-hook (`.husky` bestaat niet, `.git/hooks/` draagt alleen `.sample`-bestanden). De
    deny-lijst in `.claude/settings.json` dwingt precies TWEE dingen machinaal af: de
    training-grens en `git push --force`. Al het andere — de engine-grens, de gate vóór de commit,
    de rapportvorm, de append-only nummering — hangt aan proza.
    **WAARAAN DIT PUNT AF IS — GEHERFORMULEERD 23-08-2026, en de eerste formulering was te zwak.**
    De opbrengst van de agent is NIET contextbesparing. Het knelpunt is het AANTAL HAND-OFFS PER
    RONDE, niet de omvang van het contextvenster: een recon en een bouw kosten vandaag twee prompts,
    twee wachtmomenten en twee keer opnieuw inlezen. De maat waaraan punt 51 af is, is dus of TWEE
    RONDES TOT EEN INKLAPPEN. Levert het harnas een schoner venster op een even trage lus, dan is
    het punt niet af maar duur. Zie het nieuwe proefpunt hieronder, dat precies dat toetst.
    VIER BOUWSTAPPEN, IN DEZE VOLGORDE. De volgorde is niet de prijs maar het RISICO: eerst wat
    zelfstandig toetsbaar is en niets kan breken, dan wat eerst gemeten moet worden.
    **(1) DE RECON-SUBAGENT in `.claude/agents/`.** EERST, om drie redenen. Hij is zelfstandig
    toetsbaar aan een MEETBARE uitkomst — krimpt het rapport — hij raakt geen bestaande discipline,
    en hij is de enige stap die vandaag al werkt zonder dat er iets geverifieerd hoeft te worden:
    `claude --help` draagt `--agents`, het settings-schema draagt `agent`, en de Agent-tool
    beschrijft zelf dat definities uit `.claude/agents/*.md`-frontmatter komen. DE DRAGENDE
    EIGENSCHAP is tegelijk zijn eis: een subagent draait in een EIGEN contextvenster en alleen zijn
    slotbericht keert terug. Verbatim dat niet naar een document gaat, gaat dus verloren — precies
    wat *de deliverable is een document, niet terminaluitvoer* in `docs/WERKWIJZE.md` al eist. Die
    regel is de voorwaarde voor deze stap en niet een gevolg ervan.
    **(1) IS GEDAAN per 23-08-2026, commit `e7c3e910` — MAAR HET IS NOG GEEN VANGNET.**
    `.claude/agents/recon.md` staat er, met `model: inherit` en `tools: Read, Glob, Grep, Bash,
    WebFetch`; `Edit` en `Write` zijn er bewust uit. De frontmatter is AFGELEID uit 24 echte
    agent-definities in de geïnstalleerde plugins — `model: inherit` komt er zeven keer in voor, de
    read-only tools-vorm bij drie recon-achtige agents — en dus niet gegokt. TWEE DINGEN BLIJVEN
    STAAN. **Discovery vraagt een HERSTART:** de aanroep in dezelfde sessie gaf verbatim `Agent type
    'recon' not found. Available agents: claude, claude-code-guide, Explore, general-purpose, Plan,
    statusline-setup`. En **de tools-binding is NIET GEMETEN** — niet gemeten als afwezig, maar
    onmeetbaar vanuit een sessie waarvan de registry ouder is dan het bestand. Of `Edit` en `Write`
    werkelijk ONBESCHIKBAAR zijn of slechts ontraden, en of `Bash` het benoemde restgat werkelijk
    openlaat, staat dus nog open. Beide worden afgelezen bij de opening van de volgende sessie.
    **(2) DE EMPIRISCHE RULES-TOETS.** Of `.claude/rules/` met een `paths`-frontmatter op versie
    `2.1.208` werkt is NIET vastgesteld, en de recon van 23-08-2026 kon dat ook niet vaststellen.
    LET OP DE REDENERING: het settings-schema kent geen `rules`-sleutel, maar rules zijn
    BESTAND-gebaseerd en niet settings-gebaseerd, dus die afwezigheid is de VERWACHTE staat en
    bewijst niets — in geen van beide richtingen. Toets daarom EMPIRISCH: leg een weggooi-regel
    neer met een `paths`-scope op een pad, raak daarna een bestand op dat pad aan, en lees af of de
    regel meekomt. Greppen naar het woord `rules` beantwoordt de vraag niet. Werkt het niet, dan is
    de TERUGVAL een subdirectory-`CLAUDE.md`: het schema draagt `claudeMdExcludes` met de
    beschrijving dat het glob-patronen zijn voor CLAUDE.md-bestanden die je in een monorepo wilt
    OVERSLAAN, en dat impliceert dat meerdere CLAUDE.md-bestanden per pad geladen worden. Doelen
    voor de scope: `packages/engine` (autorisatie vereist) en de append-only nummering van
    `docs/TRAININGSMODEL.md`.
    **(2) IS NU OOK EMPIRISCH BEANTWOORD — AF (23-08-2026), en beide vormen VUREN.** De
    documentatie zei al ja (`https://code.claude.com/docs/en/memory`, eigen sectie over
    `.claude/rules/` met `paths`-frontmatter), maar de meting ontbrak omdat de hoofdsessie ouder was
    dan de map en een uitblijvende merkstring niet-geladen niet scheidt van geladen-maar-genegeerd.
    HET INSTRUMENT BLEEK EEN VERSE AGENT-SESSIE, niet `claude -p` (dat is vervallen op een
    OAuth-fout). Agents starten vers en zijn dus JONGER dan de regelbestanden.
    **DE REGEL ZONDER `paths` LAADT BIJ SESSIESTART.** Gemeten in de weerleggingspas van punt 64:
    5 van de 6 agents gaven `RULESALTIJD-MERKSTRING-Q4XM7D` verbatim terug, terwijl die string 0
    keer in hun opdracht stond (geteld in het workflow-script). Twee ervan meldden expliciet dat de
    regel al bij de start in hun context stond.
    **DE PAD-GESCOOPTE REGEL VUURT OP DE FILE-READ, en niet eerder.** Gemeten 23-08-2026 met één
    agent die opdracht kreeg `packages/engine/src/zones.ts` te lezen en te rapporteren wát hij aan
    instructies aantrof — de merkstring is hem NIET genoemd. Hij rapporteerde beide, met het
    onderscheid erbij: de `paths`-loze regel stond er vanaf de start, en
    `RULESPATHS-MERKSTRING-V9HB2K` verscheen **pas ná** het Read-resultaat, als system-reminder
    daarachteraan. Vóór die read stond dat bestand nergens in zijn context.
    GEVOLG VOOR (1): een geneste `CLAUDE.md` is niet nodig, en `paths`-scoping is een werkend
    instrument om `packages/engine` en de append-only nummering van `docs/TRAININGSMODEL.md` te
    bewaken. WAT OPEN BLIJFT: of een regel zonder `paths` ook in de HOOFDsessie laadt. Die vraag is
    per constructie onbeantwoordbaar in een sessie die ouder is dan het bestand; een verse chat
    beantwoordt hem gratis in haar openingszin. De twee weggooi-regels zijn gitignored en blijven
    liggen tot iemand dat afleest.
    **(3) DE SNOEI VAN DE WERKWIJZE-CANON — GEEN HERVERDELING.** HERGEFORMULEERD 23-08-2026; de
    eerste versie ("procedures naar skills") beschreef een VERHUIZING, en dat is het niet.
    DE DIAGNOSE, RECON `aca1cfc5`. De vier procesdocumenten zijn samen **173156 bytes** en laden
    GEEN VAN VIER automatisch. In de praktijk wordt er feitelijk ÉÉN elke ronde gelezen —
    `docs/CC-CHECKS.md`, 17389 bytes — omdat elk prompt erom vraagt; de andere drie worden zelden
    of nooit geopend. Wat wél automatisch laadt is `CLAUDE.md`, 5801 bytes. **Een regel die niemand
    leest, werkt niet**, en een canon die alleen kan groeien produceert die regels vanzelf: de
    lessen zijn append-only en er is nooit een intrekkings-pas geweest. Dat is de groeimotor, geen
    incident.
    DE MAAT OM OP TE STUREN: de werkwijze die feitelijk IN FORCE is, past in wat een sessie ook
    echt laadt. Niet "korter", maar: wat blijft staan wordt ook gelezen.
    HET INTREKKINGS-CRITERIUM, want zonder pas is er geen snoei. Een regel gaat naar het archief
    als (i) zij MECHANISCH is afgedwongen — een deny-regel, een hook, een test — en de proza-versie
    dus niets meer toevoegt; of (ii) zij is OPGESLOKT door `docs/CC-CHECKS.md`, waar zij als
    draaibare check staat; of (iii) zij in de laatste rondes NERGENS is aangeroepen. Archiveren, niet
    schrappen: de aanleiding draagt het getal waarop de regel rust en dat gaat nooit weg.
    DE VRAAG DIE DE PARTITIE BESLIST EN VANDAAG ONBEANTWOORD IS: **laadt een regel ZONDER `paths`
    altijd?** De documentatie zegt van wel — "Rules without `paths` frontmatter are loaded at launch
    with the same priority as `.claude/CLAUDE.md`" — maar dat is niet empirisch bevestigd. Klopt
    het, dan is `.claude/rules/` vooral ORGANISATIE en is `paths` de zuinigheid; klopt het niet,
    dan is `paths` de enige manier om iets in context te krijgen en verandert de hele partitie. Die
    aflezing hoort bij de opening van de volgende sessie.
    BLIJFT STAAN uit de eerste versie: `CLAUDE.md` draagt 5801 bytes over negen secties, ruwweg 2600
    FEIT tegen 3200 PROCEDURE, en VIJF VAN DE NEGEN dragen allebei — dus een sectie knippen is een
    oordeel per zin. EIS: een voor-en-na-controle dat er geen discipline stilzwijgend wegvalt.
    **(4) HOOKS, EN PAS NA EEN RUNTIME-METING VAN DE VOLLE GATE.** Stel de diagnose scherp: de gate
    ONTBREEKT NIET — hij draait in `.github/workflows/ci.yml`, alle vier de stappen. Wat ontbreekt
    is BLOKKERING: CI draait ná de push en kan een rode commit alleen melden. De winst van een
    `PreToolUse`-gate-hook vóór de commit is dus PROMPTZUINIGHEID — de gate hoeft niet meer in elk
    prompt te staan — en niet veiligheid in de zin van "anders glipt er iets door", want CI vangt
    het alsnog. Bij 1010 tests over 78 bestanden kan de looptijd die winst opeten: een hook die
    elke commit minuten kost, wordt uitgezet of omzeild. METEN VÓÓR BOUWEN: klok de volle gate en
    leg dat getal naast wat een prompt-regel kost. De engine-deny-hook staat hier los van en is wél
    veiligheid: die maakt van de autorisatie-regel een `PreToolUse`-deny in plaats van een belofte,
    en kost per constructie geen looptijd.
    **(4) IS AFGEWAARDEERD per 23-08-2026, op de eigen meting.** RECON `e7c3e910`: de volle gate
    kost **49 seconden** — install 0s, lint 2s, typecheck 9s, test 25s, build 13s. Vijftig seconden
    blokkeren bij ELKE commit, terwijl CI hetzelfde al vangt en Daan de gate-uitvoer sowieso in het
    rapport leest, is de zwakste van de vier stappen: hij koopt promptzuinigheid met wachttijd bij
    elke commit, inclusief die van een docs-only ronde waar niets te breken valt. ADVIES —
    HERKOMST CHAT, NIET GEMETEN: de gate-hook NIET bouwen, of hoogstens CONDITIONEEL op een
    niet-lege bron-diff over `packages`, `apps` en `workers`. Die conditie is geen bedenksel: ze
    draaide deze ronde al als handmatige controle en gaf leeg. DE ENGINE-DENY-HOOK BLIJFT WEL
    STAAN en is niet afgewaardeerd — die kost geen looptijd en is echte veiligheid.
    **DRIE VONDSTEN OVER DE OPSTELLING ZELF, 23-08-2026 — en de eerste ligt onder de andere twee.**
    (i) **DESKTOP-SESSIES DRAAIEN IN EEN PER-SESSIE WORKTREE, OP EEN EIGEN BRANCH.** Verbatim uit
    `https://code.claude.com/docs/en/worktrees`: *"In the desktop app, every new session gets its own
    worktree automatically."* De worktree komt onder `.claude/worktrees/<naam>/` in de repo-root, op
    een branch `worktree-<naam>`. DIT IS EEN STRUCTUREEL FEIT OVER DE HELE OPSTELLING EN HET LAG
    NERGENS VAST — niet in `CLAUDE.md`, niet in `docs/ARCHITECTUUR.md`, niet in `WERKWIJZE.md`.
    GEVOLG dat deze ronde raakte: een worktree is een VERSE checkout, dus gitignorede bestanden zijn
    er per constructie niet, en de twee weggooi-regels van de rules-aflezing reisden niet mee.
    Gerepareerd met `.worktreeinclude` in de projectroot, dat volgens diezelfde pagina
    gitignore-syntaxis draagt en geldt voor *"parallel sessions in the desktop app"*.
    PRECIES ZIJN OVER DE OORZAAK, want hier is al eens te snel geconcludeerd: dit verklaart de
    desktop-kant. Van ÉÉN gestrande aflezing is een ANDERE oorzaak GEMETEN — die sessie was zelf
    ouder dan de bestanden (transcript aangemaakt 2026-07-14, commit `e7c3e910` van 2026-08-23), en
    dat is geen worktree-probleem maar een sessiegrens. Twee oorzaken, niet één.
    (ii) **`cd C:\Users\daan\Projects\cadans` ALS VASTE EERSTE PROMPTREGEL IS VERDACHT.** Draait een
    sessie in haar eigen worktree, dan tilt die regel CC uit zijn werkmap naar de HOOFDCHECKOUT —
    en dan meet, bouwt en commit hij op een andere branch dan waar de sessie hoort. HERKOMST CHAT,
    **NIET GEMETEN**. Het staat hier als TE METEN en niet als vastgesteld. De meting is goedkoop:
    laat een sessie haar eigen pad rapporteren vóór en ná die regel.
    (iii) **ELK CC-RAPPORT DRAAGT VOORTAAN ZIJN OMGEVING** — pad, worktree ja of nee, branch en
    versie. Aanleiding: een container-sessie gaf deze week bijna een vals verdict omdat nergens
    stond waar zij draaide. De regel zelf woont bij de rapportvorm in `docs/WERKWIJZE.md`; hij staat
    hier alleen als vondst genoteerd.
    **`--print` BESTAAT NIET IN DE DESKTOP-APP**, dus `claude -p` is daar geen instrument. Dat sluit
    de route die deze ronde al op authenticatie strandde ook aan de andere kant af: een geneste
    sessie is geen aflees-instrument, en de aflezing hoort bij de OPENING van een echte sessie.
    WAT DIT PUNT NIET IS. Het is geen opruiming van de procesdocumenten — dat is stap (3) hierboven
    en die heeft zijn eigen maat en zijn eigen intrekkings-criterium. Zie punt 46 voor hoe een
    eerdere ronde op ditzelfde materiaal liep.
52. **Recon en bouw in ÉÉN ronde — een PROEF, eenmalig** — open · TOOLING plus norm. Daan-besluit
    23-08-2026. DE VRAAG: kan een ronde die vandaag TWEE prompts kost er ÉÉN worden? De opstelling:
    de recon-agent uit punt 51 (1) als read-only meetinstrument, en de WAT-ALS niet als voorspelling
    maar als **VOOR-AUTORISATIE**. CC meet, leest zijn eigen bevindingen, en bouwt in dezelfde
    sessie door zolang de verwachting HOUDT; valt zij om, dan stopt hij en rapporteert.
    STATUS: PROEF, EENMALIG, OP PUNT 47. Niet als nieuwe werkwijze, niet uitgerold, en na afloop
    beoordeeld. VOORWAARDE: de aflezing bij de opening van de volgende sessie moet EERST laten zien
    dat de agent ontdekt wordt ÉN dat zijn tools binden. Lukt dat niet, dan draait 47 gewoon
    gesplitst en verschuift de proef naar de eerstvolgende ronde die er geschikt voor is.
    WAAROM DE PROEF NIETS KOST. Bij een strenge stop-conditie is het SLECHTSTE geval dat CC na de
    recon stopt en rapporteert — en dat is precies de uitkomst van een gesplitste ronde. Er is dus
    geen scenario waarin de proef duurder uitvalt dan wat er vandaag al gebeurt; er is alleen een
    scenario waarin hij niets oplevert.
    **HET BEOORDELINGSCRITERIUM, en het is NIET "werkte het".** Dat het lukt zegt niets: een ronde
    die doorloopt kan een ronde zijn die zijn bewijslast heeft laten vallen. De vraag is of het ENE
    rapport nog DEZELFDE BEWIJSKRACHT draagt nu het twee rondes werk moet dragen: herkomst per
    getal, noemers mét hun uitsluitingen, letterlijke strings waar een claim eraan hangt, en "niet
    gemeten" nog steeds gescheiden van "gemeten als afwezig". VERDUNT het rapport, dan splitsen we
    terug — ook als de bouw geslaagd is. Dit criterium staat hier opgeschreven omdat het de ENIGE
    manier is waarop deze proef kan mislukken zonder dat het opvalt: een dunner rapport leest als
    een vlottere ronde.
    RAAKVLAK MET PUNT 51: dit is de toets op de maat die punt 51 zichzelf stelt — twee rondes tot
    één inklappen. Slaagt de proef, dan is die maat gehaald; slaagt zij niet, dan levert punt 51 een
    schoner venster op een even trage lus en is dat een bevinding en geen mislukking.
    **UITSLAG 23-08-2026: DE PROEF IS GEDRAAID EN HEEFT ZIJN EIGEN VRAAG NIET BEREIKT — GEEN
    OORDEEL, WÉL EEN OPBRENGST.** Verantwoording in `docs/PUNT47-BOUW.md`. Wat er gebeurde: V1 viel
    tijdens de meting, de stop-conditie greep, en er is geen regel code geschreven. Daarmee draaide
    de proef feitelijk als een RECON-ronde en is de vraag "draagt één rapport ook de BOUW-helft"
    niet beantwoord — er was geen bouw-helft. WAT WÉL VASTGESTELD IS, in twee delen.
    (a) DE RECON-HELFT VERDUNDE NIET: herkomst per getal, de vier opgedragen feiten hertoetst tegen
    HEAD in plaats van overgenomen uit de prompt-hash, noemers mét uitsluitingen (4 van 4, 0
    overschaduwd; 5 van 5 wisseldagen), letterlijke strings waar een claim eraan hing, en drie keer
    "niet gemeten" expliciet gescheiden van "gemeten als afwezig".
    (b) DE ZWAKKE PLEK ZIT IN DE ROL, NIET IN DE LENGTE. In deze vorm is de uitvoerder óók de
    scheidsrechter over zijn eigen stop: bij de val van V1 was de eerste neiging doorlezen om te
    zien of de bouw alsnog kon. In een gesplitste ronde had V1 een RAPPORT opgeleverd en was de
    bouwprompt HERSCHREVEN met poort (3) en de afwijs-sleutel erin. Dat is precies de
    kwaliteitswinst die de splitsing koopt, en zij is hier alleen behouden gebleven doordat de
    stop-conditie streng en expliciet was.
    BESLUIT NA RONDE 1: punt 52 NIET afvinken en NIET verwerpen. Draai de proef opnieuw op de
    eerstvolgende ronde waarin de verwachtingen HOUDEN, en beoordeel dán — met
    `docs/PUNT47-BOUW.md` als nulmeting voor hoe de recon-helft eruitziet als zij niet verdund is.
    Voorwaarde die BLIJFT staan en drie rondes achtereen NIET gehaald is: de aflezing bij de
    sessie-opening. De recon-agent is opnieuw niet ontdekt, verbatim `Agent type 'recon' not found.
    Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup`,
    dus de proef draaide ZONDER het meetinstrument waarvoor punt 51 (1) gebouwd is — met de hand
    gemeten in een wegwerp-opstelling buiten de repo-tree.
    **VERDICT NA RONDE 2 (23-08-2026): DE VORM VERDUNT, EN DE PLEK IS AANGEWEZEN — MET ÉÉN NIEUWE
    REGEL IS HIJ BRUIKBAAR.** Verantwoording in `docs/PUNT47-BOUW.md` §12. Ook ronde 2 stopte bij de
    recon (W2 viel), dus de OORSPRONKELIJKE vraag — draagt één document ook de BOUW-helft — is na
    twee pogingen nog steeds onbeantwoord en punt 52 kan niet worden afgevinkt. Wat er WÉL is
    vastgesteld is scherper dan "nog niet te zeggen".
    **DE VERDUNNING ZIT IN DE VOOR-AUTORISATIE, NIET IN DE METING.** Ronde 2 schreef de meting voor
    "met de vorige maximale inspanning op de vorige grens". Dat is geen neutrale meetinstructie maar
    een STIPULATIE die de te toetsen aanname al bevat. Precies meten wat er stond had W2 laten
    HOUDEN — 28 van de 49 tegen 1 van de 49, een overtuigende marge — en dan was er een vloer
    gebouwd die de doelblokgrens NOOIT raakt. De val kwam alleen boven water in de vrijlopende
    keten, en die was niet voorgeschreven.
    **WAAROM DAT EEN VORM-PROBLEEM IS EN GEEN INCIDENT.** In een gesplitste ronde levert de recon
    een rapport en schrijft de architect de bouwprompt DAARNA, met de gemeten uitkomst voor zich in
    plaats van met zijn eigen model erin. De gecombineerde vorm laat die gelegenheid weg. Wat de val
    ving was initiatief van de uitvoerder, en initiatief is geen controle: niet af te dwingen, niet
    af te lezen, en het faalt zonder spoor. Ronde 1 wees al aan dat de uitvoerder ook de
    scheidsrechter over zijn eigen stop is; ronde 2 laat zien dat het niet bij de STOP begint maar
    al bij de VRAAGSTELLING.
    **DE TWEEDE VERDUNNING IS ERNSTIGER, want zij trof de METING zelf en de uitvoerder zag haar
    niet.** De eerste W2-uitslag van ronde 2 — vloer 84 raakt de grens NOOIT, 0 van de 154 — was
    FOUT, en stond al in dit bestand en in `docs/PUNT47-BOUW.md` voordat zij werd weerlegd. Drie
    fouten eronder, alle drie van het soort dat de canon al verbiedt: een noemer van 154 die in
    werkelijkheid N=1 was op de beslissende dimensie (zeven weekvormen, één seed); een OR-term van
    `laatsteGelegenheid` die per constructie dood stond (`sprongDagen` leest `rolling_ftp`, en de
    fixture zette die kolom nooit) — een schending van CHECK 23 die diezelfde ronde als gedraaid
    was gemeld; en een mechanisme-verklaring die de lock aan `84 = 12 maal 7` toeschreef terwijl
    elke vloer van 66 t/m 84 hetzelfde doet.
    **WAT HAAR VING STOND NIET IN DE PROMPT:** een adversariële weerleggingspas met vier
    onafhankelijke lenzen (rekenkundig, fixture, code-lezing, alternatief), elk met de opdracht de
    claim te WEERLEGGEN en met eigen meetscripts buiten de repo. Alle vier weerlegden hem, met hoge
    zekerheid, op dezelfde kern. Hun bevindingen zijn daarna NIET overgenomen maar zelf nagemeten.
    De uitkomst van W2 — VALT — bleef staan; alles eronder is vervangen.
    **DE TWEE REGELS DIE DE VORM MIST, en zonder welke hij niet gedraaid hoort te worden.** (1) Een
    voor-autorisatie mag geen initiële conditie STIPULEREN die de te toetsen aanname bevat; waar zij
    dat toch doet meet de uitvoerder ook de VRIJLOPENDE variant en rapporteert beide. (2) Een
    gecombineerde ronde sluit af met een ADVERSARIËLE WEERLEGGINGSPAS op haar eigen hoofdclaim,
    uitgevoerd door instanties die de claim niet hebben opgesteld, VÓÓR de commit. Die tweede is de
    vervanger van de tweede prompt: geen tweede ronde werk, maar een tweede paar ogen op de
    conclusie. Beide horen in `docs/WERKWIJZE.md` zodra de vorm een derde keer gedraaid wordt.
    **DE PRIJS IS INTUSSEN GEMETEN EN VALT MEE.** Twee rondes hebben elk een fout ontwerp
    tegengehouden tegen recon-prijs — precies het beste geval dat dit punt voorspelde. Niet
    terugvallen op twee prompts voor alles; wel de twee regels hierboven toevoegen. Zonder regel (2)
    is de gecombineerde vorm goedkoper dan de splitsing én minder betrouwbaar, en dat is de
    slechtste ruil die er is.
    **AF — VERDICT NA RONDE 3 (23-08-2026): JA, ONDER VOORWAARDE.** Verantwoording in
    `docs/PUNT47-BOUW.md` §18. Ronde 3 draaide de samengevoegde vorm MÉT beide regels en had als
    eerste een echte bouw-helft, dus de vraag is nu op het juiste materiaal beantwoord.
    REGEL (i) WERKTE MEETBAAR: de beginconditie is als dimensie afgelopen over 401 waarden, en dat
    leverde een ander SOORT uitspraak — niet "de winst is 100 procent" maar "het minimum van de
    gebouwde variant ligt over het hele bereik boven het maximum van de baseline".
    REGEL (ii) REDDE DE RONDE, en dat is geen overdrijving. De weerleggingspas ving vier dingen die
    alle vier al in de bron of in de documenten stonden: een docstring die het mechanisme van de
    OUDE poort beschreef; een geautoriseerde constante die meetbaar de slechtste waarde in haar
    eigen beweerde klasse is (punt 58); een residu dat twee keer achtereen aan de verkeerde poort
    was toegeschreven; en **een echte regressie in nieuw geschreven code** — een bedorven
    `doelStart` liet `isTestWeek` op `true` vallen, waardoor de ijkkaart ELKE week zou verschijnen.
    Zonder die pas was dat alle vier gecommit.
    HET VERDICT: de samengevoegde vorm is BRUIKBAAR voor rondes die een mechanisme raken, MITS regel
    (i) en (ii) allebei draaien. Zonder (ii) is hij aantoonbaar slechter dan de splitsing; met (ii)
    beter, want de pas toetst niet de volgende STAP maar de conclusie die er al ligt. De prijs is
    reëel: vier lenzen plus een tweede meetronde bovenop de eerste.
    **EEN DERDE REGEL IS ERBIJ GEKOMEN, en zij komt uit het falen van deze ronde zelf:** een
    diagnose door interventie verandert per probe precies één ding. Staat in
    `docs/WERKWIJZE-LESSEN.md`; twee van de vier vondsten gingen terug op één en dezelfde meetfout.
    WAT NIET IS AANGETOOND: of de pas ook werkt wanneer de uitvoerder hem zelf opstelt zonder dat
    een prompt hem voorschrijft, en of het feit dat vier van de vier lenzen raak schoten aan de
    METHODE ligt of aan deze ene claim. Eén keer gedraaid is geen reeks.
53. **De ONGEIJKT-staat van M91 heeft geen drager** — open · CLIENT plus DATA. Volgt uit de
    bouwronde van 23-08-2026 (`docs/PUNT47-BOUW.md`). M91 zegt dat een afwijzing geen meting is en
    dat de app de ONGEIJKT-staat moet DRAGEN en ZEGGEN. Vandaag draagt de app alleen een
    AFWIJZING, en die is per vierweeks blok gesleuteld op `blokStart` — zie punt 47, grond (c).
    Zodra de ijking aan de doelblok-klok hangt, moet die staat ergens leven die een doelblok
    overleeft. DE OPTIE-INVENTARIS, en geen daarvan is gekozen: (a) de bestaande afwijs-sleutel
    omhangen naar de doelblokstart — goedkoopst, maar hij is client-lokaal en overleeft geen
    apparaatwissel; (b) een veld op de bestaande settings-rij — geen migratie van een nieuwe tabel,
    wel een schema-wijziging; (c) een eigen tabel met één rij per doelblok — draagt ook de HISTORIE
    van geweigerde ijkingen, en dat is wat M91's "zeggen" op termijn vraagt. NIEUWE PERSISTENTE
    STAAT VRAAGT EEN EIGEN AUTORISATIE en die is bij 47 uitdrukkelijk NIET gegeven; dit punt bestaat
    om die beslissing niet in een bouwronde te laten wegzakken.
54. **De doelcheck-maat per doel is nog niet gekozen** — open · norm plus CLIENT. Dit is de
    bouwvraag die punt 47 open laat: M89 splitst de vraag, maar WELKE maat de doelcheck per doel
    afleest staat nergens vast. Bij FTP is het 20-minutenvermogen. Bij Onderhoud noemt
    `DOELEN-SPEC` §3.2 een maat die in code NIET BESTAAT (punt 47, recon-bevinding iii), terwijl er
    een andere vloer wél ligt en niet is aangesloten (`ONDERHOUD_VLOER_PCT`, bevinding ii). Bij
    Conditie en beide klimdoelen wijst §3.3 t/m §3.5 een durability- of dag-twee-maat aan die punt
    11 en punt 49 nog moeten leveren. Dit punt is een ONTWERPRONDE en hoort achteraan; het staat
    hier opgeschreven zodat de bouw van 47 niet stilzwijgend een maat kiest.
55. **Het aanbodvenster is ÉÉN week breed en kan stil missen** — open · CLIENT. Volgt uit de
    bouwronde van 23-08-2026. Poort (1) van `buildTestVoorstel` eist dat de weekmaandag EXACT de
    laatste blokweek is; is de app die week niet geopend, of valt er een event of een lege
    beschikbaarheid overheen, dan is het aanbod weg tot de volgende grens. Vandaag is dat elke vier
    weken en dus goedkoop. Hangt de ijking om naar de twaalfweekse klok, dan kost één gemist venster
    een KWARTAAL — en dat is de kostenverandering die punt 47 impliceert zonder ze te noemen. TE
    BESLISSEN: blijft het venster één week, of wordt het een venster dat OPENBLIJFT tot de ijking
    plaatsvond of expliciet geweigerd is. Die tweede lezing raakt punt 53, want een openblijvend
    venster vraagt precies de staat die daar besproken wordt.
    **DIT PUNT IS PER 23-08-2026 GEEN VOORUITZICHT MEER MAAR LIVE.** De versmalling van poort (1) is
    gebouwd, dus de RETRY is weg: waar een gemist aanbod vier weken later terugkwam, wacht een
    gemiste doelblokgrens nu twaalf. Dat staat als zodanig in de docstring bij `blokStart` in
    `apps/web/src/lib/testvoorstel.ts`. GEMETEN kosten: bij een wisselende weekvorm mist 33,3
    procent van de doelblokgrenzen (5613 van de 8421 bedeeld), en punt 58 wijst de oorzaak aan —
    het is niet beschikbaarheid en niet de vloer, maar de dagkeuze. 55 en 58 horen daarom in
    dezelfde ronde.
    DE VRAAG DIE ERBIJ HOORT EN NOG NIET BESLIST IS: hoort een gemiste grens te HERKANSEN? Een
    aanbod dat vier weken te laat komt is iets anders dan geen aanbod, en welk van die twee beter is
    hangt aan de norm en niet aan de code — een ijking buiten de blokgrens meet de zones voor het
    volgende blok pas als dat blok al loopt. Herkomst: OPEN, expliciet niet beslist tot de oorzaak
    gemeten was; die is er nu (punt 58), dus deze vraag kan beslist worden.
    **TWEEDE KOSTENPOST, gevonden in de weerleggingspas van 23-08-2026:** het EERSTE aanbod na een
    verse `doelStart` schoof van 27 naar 83 dagen. GEMETEN over vier `doelStart`-waarden met een
    ruime week en zonder meethistorie: oud telkens 27 dagen, na ronde 3 telkens 83.
    **DIE KOSTENPOST IS DOOR RONDE 4 VERVALLEN.** Met poort (1) op de OPENING is een verse
    `doelStart` per constructie zelf een opening, dus het aanbod komt in die week: gemeten geeft een
    wissel op `2026-08-05` een nieuwe `doelStart` van `2026-08-03` en een aanbod op `2026-08-08` —
    vijf dagen in plaats van drieëntachtig.
    **DE HERKANSINGS-VRAAG IS BEANTWOORD MET NEE (Daan-besluit 23-08-2026) en dit deel is GESLOTEN.**
    Er komt geen herkansings- of inhaalmechanisme voor een gemist aanbod. GROND: de gebruiker kan
    een testinspanning altijd zelf inplannen, en een aanbod dat weken te laat komt ijkt een blok dat
    al loopt — dat is een andere handeling dan waar M92 om vraagt. Vastgelegd in M92.
    **WAT VAN 55 OPENBLIJFT** is uitsluitend de tegenhanger: is er niet geijkt, dan hoort de app dat
    te ZEGGEN (M91). Dat is punt 59 en niet dit punt. Als kostenpost is 55 daarmee klein geworden:
    de dekking staat op 440 van de 440 en het venster mist alleen nog als de hele week geen dag van
    `TEST_MIN_BESCHIKBAAR_MIN` draagt.
56. **`TEST_MIN_BESCHIKBAAR_MIN` en `TEST_DUUR_MIN` dragen geen herkomst-etiket** — open · norm.
    Beide staan in `apps/web/src/lib/testvoorstel.ts` en beide staan op 60. Anders dan
    `TEST_INTERVAL_DAGEN` en `WEDSTRIJD_HORIZON_DAGEN` is nergens vastgelegd of ze uit de
    GAS-bron komen, uit een Daan-besluit, of uit een keuze van een bouwronde. NIET RATEN wat die
    herkomst is: dit punt vraagt om hem OP TE ZOEKEN — in de bevroren GAS-bron op schijf en in de
    commit-historie van het bestand — en daarna te etiketteren zoals de canon eist. Blijkt hij
    onvindbaar, dan is "herkomst onbekend, gekozen op <datum>" het eerlijke etiket en geen
    verzonnen grond.
57. **Het aanbodmoment hangt aan een INTERVAL terwijl M90a een ROOSTER vraagt** — open · norm plus
    CLIENT. GEMETEN 23-08-2026, zie `docs/PUNT47-BOUW.md` §9 W2. Dit punt bestaat om te voorkomen
    dat er een DERDE keer aan de vloerwaarde alleen gesleuteld wordt.
    DE STELLING, doorgerekend en niet beredeneerd: het aanbodmoment hangt aan een interval sinds de
    laatste maximale inspanning (`TEST_INTERVAL_DAGEN`, poort (7)) en aan een vierweekse
    OPENINGSPERIODE (poort (1)), en samen sturen die nergens naartoe. De afstand tussen twee
    aanbiedingen is `ceil(vloer / 28)` maal 28 dagen; is die factor een drievoud, dan bevriest de
    fase, anders drijft zij. Elke vloer van 66 t/m 84 gedraagt zich IDENTIEK — 84 is dus in geen
    enkel opzicht bijzonder, en "afleiden van de doelbloklengte" levert een getal op dat rekenkundig
    samenvalt met een band van negentien waarden. Op de maat die telt — welk aandeel van de
    doelblokgrenzen krijgt een ijking — blijft het 25,0% tegen 25,0% (vaste weekvorm) of 27,0%
    (wisselende), over 840 grenzen per variant.
    WAT DAARUIT VOLGT, en dit is GEMETEN en geen hypothese meer: de ROOSTERCONDITIE is nodig. Poort
    (1) op de doelblok-testweek tilt de dekking naar 52,0% met de huidige vloer, en samen met de
    vloer op 84 naar 99,9% (vaste weekvorm) of **66,9%** (wisselende). Dat is precies de omhanging
    die bij punt 47 op kosten was vervallen; die vervallenverklaring is INGETROKKEN.
    HET RESTERENDE LEK bij een wisselende weekvorm — ongeveer een derde van de grenzen — heeft een
    benoemde oorzaak en is niet met een ander getal te repareren: schuift de ruimste dag van de week
    naar vroeger dan hij vorige keer lag, dan haalt hij de vloer net niet en valt die grens weg. Dat
    is **punt 55** (een venster van één week dat niet openblijft), en 55 en 57 horen daarom in
    dezelfde ronde beslist te worden. Raakt ook punt 53: een venster dat openblijft moet ergens
    onthouden dat de ijking nog niet gedaan is.
    **AF PER 23-08-2026, in ronde 3 van punt 47.** De roostercondititie is gebouwd: poort (1) leest
    `computeMacroPhase(...).isTestWeek`, en `TEST_INTERVAL_DAGEN` staat op 84 met een docstring die
    de trapfunctie `ceil(vloer / 28) × 28` benoemt en expliciet zegt dat `84 = 12 × 7` een samenval
    is en geen mechanisme. Nagemeten op de gebouwde bron: 100,0 procent dekking bij een vaste
    weekvorm, 66,7 procent bij een wisselende. WAT ER OPEN BLIJFT is niet de vloer maar de DAGKEUZE
    — zie punt 58 — en het verdwenen retry-venster, punt 55.
58. **`TEST_INTERVAL_DAGEN` staat zes dagen te hoog voor het venster dat hij moet toelaten** —
    open · norm plus CLIENT. Daan-besluit nodig. GEMETEN 23-08-2026 in de weerleggingspas, zie
    `docs/PUNT47-BOUW.md` §16. Dit is de ENIGE oorzaak van het residu dat na de bouw van punt 47
    overblijft.
    HET MECHANISME, en het is pas na de versmalling van poort (1) zichtbaar. De OPENINGEN liggen nu
    84 dagen uit elkaar — één per doelblok — dus de afstand tussen twee AANBIEDINGEN is
    `84 + (k − j)` dagen, met j en k de weekdag van de vorige en de volgende gekozen testdag. Poort
    (6) kiest de ruimste dag, dus die weekdag wobbelt en `k − j` ligt tussen −6 en +6: de kortste
    afstand is **78** dagen. Een vloer van 84 blokkeert dus precies de grenzen waarbij de ruimste
    dag naar voren schuift.
    GEMETEN OP DE GEBOUWDE BRON, vloer-sweep over één keten: 60, 66, 70, 74, 77, 78 en 79 geven
    allemaal **21 van de 21** doelblokgrenzen bij zowel een vaste als een wisselende weekvorm; 80
    geeft 20 van de 21, 82 geeft 15, **84 geeft 14**, 85 geeft 11 en 90 geeft 11. De waarde die
    M90b uitdrukt zonder de grens te blokkeren die zij moet toelaten is `DOEL_BLOK_WEKEN × 7 − 6`
    = **78**: één doelblok minus de breedte van het aanbodvenster.
    DE WACHTTIJD MAAKT HET SCHERPER, en op dit getal is 84 een REGRESSIE. Gemiddelde afstand tussen
    twee opeenvolgende aanbiedingen, over 30 zaden: oud (vierweeks, vloer 90) 111,5 dagen met een
    grootste gat van 118; nieuw met vloer 84 **126,3 dagen** met een grootste gat van **173**; met
    vloer 78 **84,0 dagen** met een grootste gat van 90. Bij een wisselende weekvorm wacht de
    renner met 84 dus LANGER dan vóór de hele ingreep.
    HET VERHOOGT DE TESTFREQUENTIE NIET, en dat is de reden dat het geen norm-verruiming is: poort
    (1) laat per constructie hoogstens één aanbod per doelblok door, dus 78 zorgt er alleen voor dat
    die ene niet wordt overgeslagen.
    NIET GEBOUWD IN RONDE 3, met reden: sectie 2 van die prompt autoriseerde `TEST_INTERVAL_DAGEN`
    op **84** en de meetfrequentie is een BELEIDSVRAAG die met Daan wordt herzien, niet door de
    uitvoerder. De waarde staat dus op 84 met deze meting in de docstring ernaast. **DIT PUNT IS EEN
    BESLUIT VAN ÉÉN GETAL.**
    LET OP BIJ HET METEN — dit residu is TWEE KEER verkeerd gediagnosticeerd. De eerste diagnose
    schreef alle 176 op de BESCHIKBAARHEIDSPOORT: de poorten waren in een cascade getoetst en de
    eerste stap verruimde de week, wat ook de dagkeuze verandert. De tweede schreef ze op de
    DAGKEUZE van poort (6): de probe gaf de onderzochte dag 90 minuten en bouwde daarmee een week
    die niet bestond. GEMETEN met onafhankelijke probes: de werkelijke week draagt in **176 van de
    176** gemiste grenzen precies ÉÉN kandidaat — poort (6) heeft daar niets te kiezen — en **176
    van de 176** vuren alsnog zodra de vloer op 0 staat. De null valt op poort (7). Toets poorten
    ONAFHANKELIJK en verander per probe precies één ding.
    **AF PER 23-08-2026, ronde 4 van punt 47.** De vloer is HERAFGELEID voor de nieuwe meetkunde:
    `DOEL_BLOK_WEKEN * 7 - AANBODVENSTER_DAGEN` = 77. Openingsmaandagen liggen 84 dagen uit elkaar,
    de gekozen testdag wobbelt binnen de week, dus de kortste afstand is 78 en alles t/m 78 bedient
    440 van de 440. 77 ligt daar met één structurele dag onder, ontleend aan de vensterbreedte in
    plaats van aan het extremum van de verschuiving. Het residu is daarmee weg: dekking 100,0
    procent bij beide weekvormen.
59. **De BEVESTIG-uitgang, de duurzame ONGEIJKT-staat en de bevestigings-teller** — **AF
    (23-08-2026, ronde 6).** (a) en (b) zijn op 23-08-2026 gebouwd; (c), de teller van opeenvolgende
    bevestigingen, is op 23-08-2026 **VERVALLEN met grond** en niet uitgesteld. Daan-besluit: de
    zichtbaarheid van een niet-gemeten drempel is de LEEFTIJD IN WEKEN, niet een teller van
    bevestigingen — weken zijn wat de renner nodig heeft om te oordelen, "drie blokken" is een
    teleenheid van de app en een teller van bevestigingen telt een handeling in plaats van een
    ouderdom. `ijkStaatRegel` leest sinds die dag `wekenOud`, en die leeftijd hangt aan de laatste
    GEREDEN maximale inspanning; een bevestiging kan hem per constructie niet verzetten (gemeten,
    `docs/PUNT47-BOUW.md` §32f). Er komt dus geen kolom bij voor (c).
    plus DATA plus norm. ÉÉN punt en één ronde, want alle drie delen dezelfde drager. Norm ligt er
    al: M92 (drie uitgangen bij een opening) en M91 (een afwijzing is geen meting; de app draagt de
    ONGEIJKT-staat en zegt haar).
    WAT ER MOET KOMEN. (a) Een derde uitgang naast inplannen en afwijzen: BEVESTIGEN dat de staande
    drempelwaarde nog representatief is. Een bevestiging DEKT het blok maar is GEEN meting. (b) Een
    staat die een doelblok overleeft, want de huidige afwijzing is een module-lokale `Set` in
    `TestVoorstelCard.tsx` en overleeft geen herstart. (c) Een TELLER van opeenvolgende
    bevestigingen en afwijzingen, zichtbaar gemaakt: drie op rij is een drempel die drie blokken oud
    is. Neem de optie-inventaris uit `docs/PUNT47-RECON.md` vraag 4 erin op.
    **DIT IS DE EERSTE RONDE VAN DEZE REEKS DIE DE WORKER EN EEN MIGRATIE RAAKT** — `sync_state` of
    `day_state` plus een route — en dat is een andere autorisatieklasse dan alles wat 47 tot nu toe
    kostte. Reken op een aparte autorisatie voor de migratie.
    **AF (23-08-2026, ronde 5), op één onderdeel na.** GEBOUWD: twee kolommen op `sync_state` in het
    bestaande per-blok-idiom — `ijking_blok` (de openingsmaandag) en `ijking_antwoord`
    (`'bevestigd'` of `'niet_nu'`) — met `GET`/`PUT /api/ijking`, migratie
    `0011_handy_the_hunter.sql` (twee `ALTER TABLE ... ADD`, geen nieuwe tabel), en de POORT in de
    PURE laag als poort (2b) van `buildTestVoorstel`. De vluchtige module-`Set` in
    `TestVoorstelCard.tsx` en `isTestVoorstelAfgewezen` zijn VERDWENEN; `SchemaView.tsx` leest ze
    niet meer. De derde uitgang staat op de kaart (`"Mijn waarde klopt nog"`) en `ijkStatus` plus
    `ijkStaatRegel` dragen de zichtbaarheid.
    **WAT ER NIET IS: een letterlijke teller van opeenvolgende bevestigingen.** Verantwoord als
    afwijking in `docs/PUNT47-BOUW.md` §27d: besluit vier vraagt te tellen én zichtbaar te maken dat
    de drempel meerdere blokken oud is, en dat tweede is het doel. De LEEFTIJD volgt uit
    `laatsteGelegenheid` met `negeerSprong` — dagen sinds de laatste ECHTE meting gedeeld door de
    doelbloklengte — en die maat telt óók de blokken waarin niets is geantwoord. Wil Daan de
    letterlijke teller, dan is dat één kolom erbij en een vervolgronde.
63. **Het ONDERWEG-SIGNAAL: loopt vermogen tegenover hartslag structureel scheef?** — open · norm
    plus CLIENT plus DATA. Daan-besluit 23-08-2026 over de STREKKING; de bouw wacht op punt 49.
    DE STREKKING. Loopt de verhouding tussen VOORGESCHREVEN vermogen en GELEVERDE hartslag over
    meerdere weken structureel scheef — een Z2-blok dat stelselmatig op Z3-hartslag ligt, een
    drempelblok op Z5-hartslag — dan wekt de app HETZELFDE ijkaanbod op, met dezelfde drie
    uitgangen. **Geen tweede mechanisme en geen tweede kaart: één aanbod, twee aanleidingen.**
    RANDVOORWAARDEN DIE NU AL VASTSTAAN. (i) Het signaal mag hoogstens ÉÉN keer per doelblok tikken
    en een wegklik geldt voor dat hele blok — dezelfde drager als punt 59 dus. (ii) De app zegt WAT
    hij ziet en niet wat het BETEKENT: dezelfde afwijking komt van hitte, slaap, ziekte en
    vermoeidheid (M53, M54). (iii) De drempel wordt op de ECHTE reeks geijkt en nooit in een gesprek
    gekozen.
    **VOORWAARDE: de app moet per rit in de TIJDLIJN kunnen kijken.** Zoneminuten-totalen dragen dit
    niet — je moet weten welk BLOK op welke hartslag lag, niet hoeveel minuten er in totaal in een
    zone zaten. Dat is dezelfde afhankelijkheid die punt 49 beschrijft, en `ride.ts` haalt de
    per-rit-intervallen vandaag ON DEMAND op zonder ze te bewaren.
60. **M91 tegenover `sprongDagen`: onderdrukt een proxy het ijkaanbod?** — open · norm plus CLIENT.
    VASTGESTELD 23-08-2026, NIET opgelost; volledige verantwoording in `docs/PUNT47-BOUW.md` §24 met
    beide teksten verbatim.
    DE TEGENSPRAAK. M91 zegt: *"Een proxy vervangt de ijking niet ... Zij is informant (M17, M30) en
    mag het aanbod niet onderdrukken."* Hij noemt de hartslag-vermogenkoppeling als VOORBEELD, niet
    als enige geval. `sprongDagen` in `apps/web/src/lib/effect.ts` leest `rolling_ftp` — intervals'
    eigen SCHATTING van de drempel — en voedt `laatsteGelegenheid`, die poort (7) voedt, die het
    aanbod onderdrukt. De docstring noemt dat expliciet consistent en trekt de grens elders, maar
    die docstring is OUDER dan M91.
    HET TEGENARGUMENT, en het weegt: een sprong kan alleen ontstaan als er werkelijk een betere
    inspanning in het venster kwam, dus het signaal DETECTEERT een inspanning en is geen schatting
    die als drempel wordt gebruikt.
    **HET SCHEIDENDE GETAL, gemeten:** doelblok-openingen die worden onderdrukt door een
    `laatsteGelegenheid` met bron `inspanning` zonder gereden race of test in dezelfde periode —
    bij Daans gemeten sprongtempo (één per ~182 dagen) **162 van de 440 = 36,8 procent**; bij één
    per 91 dagen 320 van de 440; bij één per 56 dagen 420 van de 440.
    DE LEZING DIE ERBIJ HOORT: het detector-argument redt de helft van de zaak. Wat een sprong
    aantoont is dat er hard gereden is; wat hij niet aantoont is dat die rit een 20-minuten-maximum
    was, noch wélke waarde het blok moet doseren. Door het aanbod te onderdrukken laat de app het
    blok doseren op `rolling_ftp` zelf — de proxy-stap die M91 verbiedt. En het maakt de app STIL:
    geen aanbod, geen afwijzing, geen teller, precies de toestand die M91 wil uitsluiten.
    DE INGREEP DIE HIERUIT VOLGT en die NIET gebouwd is: een sprong mag het aanbod niet onderdrukken
    maar wel de TEKST informeren ("intervals ziet een sprong op X — klopt dat?"). Dat maakt de
    bevestig-uitgang van punt 59 tot drager, dus 59 en 60 horen in dezelfde ronde.
    **AF (23-08-2026, ronde 5) — Daan-besluit: de sprong verdwijnt uit de IJK-POORT.** Poort (7)
    roept `laatsteGelegenheid` aan met `negeerSprong: true`. Een VLAG en geen verwijdering, want
    `laatsteGelegenheid` heeft TWEE consumenten: de ijk-poort én `buildBlokReferent` in `blok.ts`,
    dat de terugblik-copy ermee voedt. Die tweede leest zonder vlag en verandert niet, dus de sprong
    blijft INFORMANT (M17, M30) en `sprongDagen` komt niet dood te staan. GEMETEN wat het vrijgeeft:
    bij Daans sprongtempo (één per ~182 dagen) **169 van de 440 openingen**; bij één per 13 weken
    338; bij één per 8 weken 420. En het tilt de frequentie NIET: met de sprong eruit geeft de bron
    bij alle drie de tempo's precies **440 van de 440 openingen één aanbod**, maximum 1 — poort (1)
    en de vloer bewaken M90b, niet de sprong.
66. **De PLAN-uitgang verzet de LEEFTIJD van de drempelwaarde, en 15 minuten is geen ijking** —
    open · CLIENT. **GEEF DIT GEWICHT: het raakt de betrouwbaarheid van de leeftijdsweergave die
    ronde 6 net gebouwd heeft.** GEMETEN 23-08-2026 in de weerleggingspas van punt 64.
    HET MECHANISME. `laatsteGelegenheid` telt een test-override als meetgelegenheid zodra er op die
    dag minstens `GELEGENHEID_MIN_MINUTEN` (**15**) is gefietst. Vijftien minuten is geen maximale
    inspanning en dus geen ijking. GEMETEN: met een laatste echte meting 123 dagen terug staat
    `wekenOud` op 17 en zegt de app "Je drempel is 17 weken oud."; legt de gebruiker een
    test-override op vandaag en rijdt hij er **20 minuten** op, dan valt `wekenOud` naar **0** en
    zwijgt de regel. Met **14** minuten gebeurt er niets.
    WAAROM DAT ERG IS. Naast de BEVESTIG-knop, die de teller bewust NIET mag verzetten (besluit twee
    van punt 64, en dat is gemeten en getest), staat een knop die hem wél verzet — zonder dat er iets
    gemeten is. De app zegt dan "gemeten" waar niets gemeten is, en dat is M5.
    WAT DE INGREEP NIET MAG ZIJN: de vloer simpelweg optrekken. 15 minuten is een BELEIDSWAARDE met
    een eigen herkomst; wie hem verhoogt raakt ook de race- en sprong-takken die er nu aan hangen.
    Begin met METEN wat een echte testinspanning in Daans reeks aan duur en vermogen draagt, en
    beslis pas daarna of de grens per BRON moet verschillen — een geplande test verdient een andere
    drempel dan een gereden A-wedstrijd.

67. **`d.gedaan !== true` in poort (5) is dode machinerie** — open · CLIENT, klein. GEMETEN
    23-08-2026. Het filter kan per constructie nooit vals worden: `planner_days.gedaan` heeft één
    schrijver in de worker en die zet hem altijd op 0, de PUT-route weigert het veld in de invoer,
    en `buildTestVoorstel` krijgt de RAUWE rijen uit `schema.ts` zonder `derivePlannerDays` ertussen.
    Een conditie die als levende beveiliging leest maar geen tak kan kiezen — CC-CHECKS CHECK 27.
    Weghalen of aansluiten is een besluit; beide zijn goed te verdedigen, stilzwijgend laten staan
    niet.

68. **De per-blok-antwoorden dragen TWEE doel-kolommen, niet drie** — open · norm, administratief.
    Een correctie op een premisse die in de prompt van punt 64 stond en die daar is rechtgezet:
    `dosis_trede_doel` en `doel_passend_doel` bestaan, maar `event_overname` draagt een EVENT-kolom
    (`event_overname_event`) in plaats van een doel-kolom. Dat is consistent — die vraag gaat over
    een specifieke wedstrijd en niet over het doel — maar of die event-sleutel dezelfde blootstelling
    heeft als `ijking_*` had vóór punt 64, is **NIET gemeten**. Eén meting volstaat: wisselt de
    gebruiker van doel terwijl er een beantwoorde event-overname staat, telt dat antwoord dan nog?

65. **DE TZ-SCHULD: de engine rekent lokaal, een gedeployde Worker draait UTC** — **GEMETEN
    24-08-2026, reparatie open · ENGINE plus WORKER.** De volledige meting staat in
    `docs/TZ-RECON.md`; dit is de eerste keer dat dit punt een MAAT draagt.
    **DE UITKOMST IN ÉÉN ZIN: de afwijking is echt en scherp begrensd, maar zij kan op dit schema
    geen enkele verkeerde datum opslaan.**
    GEMETEN. (M-A) Er zijn precies VIJF plekken in `workers/api` die een datum PRODUCEREN uit de
    ambient klok — het sync-venster van `syncActivities` en van `syncWellness`, de dag-bucket
    `fetchedOn` en de cache-sleutel `today` in `powercurve.ts`, en het absolute
    `new Date().toISOString()` in `writeCheckin` (TZ-invariant). Alle andere datumpaden zijn
    ROUND-TRIPS en die zijn TZ-invariant. `weekplanFreeze.ts` is GEEN producent: hij krijgt
    `todayISO` uit de client-body — dat corrigeert een aanname die er twee rondes stond.
    (M-B) Dezelfde instants langs twee klokken, noemer **384** (4 dagen × 96 kwartieren):
    **24 van 384 = 6,3 procent** verschilt, uitsluitend in een venster dat EINDIGT op 00:00 UTC —
    2,00 uur in zomertijd, 1,00 uur in wintertijd. De randen `oldest` en `newest` slaan op
    VERSCHILLENDE uren om zodra het venster een DST-omschakeling overspant.
    (M-C) **0 scheve rijen op prod, en dat is structureel nul**: de enige door de Worker
    geproduceerde datumkolom in het hele schema is `power_curve_cache.fetched_on`, en die is een
    TTL-dag-bucket waarvan de faalwijze een OVERBODIGE re-fetch is en geen bederf. `wellness.datum`
    komt uit de API-respons, `activities.datum` uit `start_date_local`. `wellness` is gatloos sinds
    de deploy: 15 rijen op 15 kalenderdagen. `activities` draagt 0 rijen in die periode omdat Daan
    niet fietst, dus daar is niets meetbaar — niet gemeten, nooit "gemeten als afwezig".
    **DE REPARATIE IS DAARMEE NIET URGENT EN NIET GROOT.** Eén plek dekt alle vijf de producenten:
    `toD1Date`/`toD1DateTime` in `workers/api/src/db/dates.ts`. Er is GEEN datamigratie nodig — er
    staat niets scheefs. WAT DE REPARATIE-RONDE EERST MOET METEN: of het pinnen van de Worker-TZ de
    engine-selftest en de bestaande D1-round-trips ongemoeid laat. Dat is een eigen besluit.
    **DE DEPLOY-BLOKKADE IS HIERMEE OPGEHEVEN.** Zij stond er omdat de omvang onbekend was; nu is
    zij gemeten en blijkt zij een randgeval van 1 tot 2 uur per etmaal zonder blijvend gevolg.
    De oorspronkelijke diagnose staat hieronder.
    **DIT PUNT GING VOORAF AAN ELKE WORKER-DEPLOY.** Zo vastgesteld op 23-08-2026 bij de
    prod-migratieronde, en dat is de reden dat die ronde de migraties wél en de deploy NIET deed.
    `docs/ARCHITECTUUR.md` draagt de schuld al verbatim: *"leunt op `TZ=Europe/Amsterdam`. Het
    root-testscript zet die pin via `cross-env`. Een gedeployde Worker draait UTC; dat verschil
    staat als openstaande schuld en niet als opgelost."* De engine formatteert met LOKALE getters,
    en `workers/api/src/db/dates.ts` is de enige conversielaag en spiegelt diezelfde aanname.
    WAT ER MOET GEBEUREN, in deze volgorde. (1) MEET het verschil in plaats van het te beredeneren:
    draai de datumlaag onder `TZ=UTC` en leg naast de uitkomst onder `TZ=Europe/Amsterdam`. Doe dat
    op de randen die er toe doen — een maandag-berekening rond middernacht, de DST-overgangen van
    het lopende jaar, en `toD1Date` heen en terug. (2) Pas dan beslissen of de engine expliciet moet
    worden gemaakt of de Worker gepind. NIET bouwen vóór (1) er ligt: welke van de twee routes goed
    is, hangt af van hoe groot en waar het verschil werkelijk is.
    HET IS GEEN ACUUT DEFECT: de live Worker draait sinds 10-08-2026 en niemand heeft een verkeerde
    datum gemeld. Het is een gok die tot nu toe goed is uitgepakt, en dat is iets anders dan veilig.

64. **Het ijk-antwoord heeft geen DOEL-kolom, en de openingsmaandag alleen volstaat niet** — **AF
    (23-08-2026, ronde 6).** `sync_state.ijking_doel` erbij via
    `workers/api/drizzle/0012_acoustic_living_mummy.sql` (één `ALTER TABLE ... ADD`, forward-only,
    0011 onaangeroerd). Poort (2b) en `ijkStatus` vergelijken sindsdien BLOK ÉN DOEL, genormaliseerd
    aan beide kanten, precies zoals `doelPassendVoorstel` stap 5 dat al deed.
    GEMETEN met de echte `blokStartBijDoel` en de echte `buildTestVoorstel`, beantwoorde opening
    2026-09-21: een doelwissel gaf **op 4 van de 7 dagen** van die week een aanbod en geeft er nu
    **7 van 7**. De klem is niet veranderd — `blokStartBijDoel` levert nog steeds op 3 van 7 dagen
    dezelfde maandag — de SLEUTEL wel.
    **HET SCENARIO IS RECHTGEZET NA DE WEERLEGGINGSPAS.** Dit punt schreef eerst dat het om Daans
    februari-scenario ging, Onderhoud naar Korte beklimmingen. Dat geeft juist DELTA NUL:
    `blokCheckEnabled("Onderhoud")` is false, dus daar komt nooit een aanbod en kan er voor die
    opening ook nooit een rij worden weggeschreven — zonder rij onderdrukte de oude poort al niets
    (7/7 vóór én ná). De winst hoort bij een wissel tussen twee EFFECT-doelen, bijvoorbeeld FTP naar
    Korte beklimmingen. `Onderhoud` is per constructie onbereikbaar als opgeslagen doel.
    TEGENKANT gemeten: een doorrollend blok ZONDER wissel geeft **0 van 7** tweede aanbiedingen,
    zowel vóór als ná, dus de ingreep schiet niet door. De getallen van ronde 5 zijn onaangeroerd:
    440/440 aanbiedingen per opening, MAX 1, gat 84,0 dagen op dezelfde noemer.
    **DRIE NAKIJKPUNTEN DIE OPEN BLIJVEN.**
    (a) M92's "hoogstens één aanbod per opening" geldt sinds deze ronde per (opening, DOEL).
    `sync_state` draagt één paar en geen verzameling, dus een beantwoord aanbod voor een nieuw doel
    OVERSCHRIJFT dat van het vorige. GEMETEN: FTP beantwoord met niet_nu op maandag, dinsdag naar
    Korte beklimmingen, woensdag terug naar FTP geeft **2 aanbiedingen op dezelfde openingsmaandag**
    waar het er vóór de ingreep 0 waren. Dichtzetten vraagt een VERZAMELING beantwoorde doelen per
    opening — een andere kolomvorm dan `doel_passend` en `dosis_trede` gebruiken.
    (b) Migratie 0012 heeft geen BACKFILL. Een rij die 0011 achterliet draagt `ijking_doel` NULL;
    dan komt niet alleen het aanbod terug (de bewuste veilige kant) maar verdwijnt ook de
    M91-regel "Je drempel is dit blok niet geijkt." tot de gebruiker opnieuw antwoordt.
    Zelfherstellend, en er staat vandaag geen zo'n rij in prod omdat 0011 niet gedeployd is.
    (c) Of `dosis_trede_*` en `event_overname_*` dezelfde blootstelling hebben. `dosis_trede_doel`
    bestaat, dus daar is de sleutel compleet; `event_overname` draagt een EVENT-kolom
    (`event_overname_event`) in plaats van een doel-kolom, en of dát volstaat is NIET gemeten. Merk
    op dat het idiom dus twee-van-drie is en niet drie-van-drie.
    De oorspronkelijke diagnose staat hieronder.
    MIGRATIE plus client. GEMETEN 23-08-2026 op de echte `blokStartBijDoel`, weerleggingspas ronde 5
    (`docs/PUNT47-BOUW.md` §31b punt 3). Met `WISSEL_LAATSTE_DAG = 3` klemt een doelwissel op
    maandag, dinsdag of woensdag naar de maandag van DEZE week. Valt zo'n wissel in de week waarin
    het ijkaanbod al beantwoord is, dan is de nieuwe `doelStart` DEZELFDE maandag, zet poort (2b)
    het aanbod voor het NIEUWE doel dicht, en meldt `ijkStatus` het antwoord van het OUDE doel als
    staat van het nieuwe blok. **3 van de 7 wisseldagen**, en er is per besluit van 23-08-2026 geen
    retry — dus twaalf weken op een onbevestigde drempelwaarde zonder aanbod.
    DE REPARATIE STAAT AL IN HET IDIOM: een derde kolom `ijking_doel`, precies zoals
    `doel_passend_doel` naast `doel_passend_blok` staat en om dezelfde reden, plus de
    doel-vergelijking in poort (2b) die `doelPassend` al doet. Dat is een tweede migratie; ronde 5
    stond er één toe met één kolommenpaar, dus dit is gemeld en niet gebouwd. De docstring op
    `ijking_blok` citeert zijn eigen weerlegde rechtvaardiging.
    NAKIJKEN IN DEZELFDE BEWEGING of `dosis_trede_*` en `event_overname_*` dezelfde blootstelling
    hebben; `dosis_trede_doel` bestaat, `event_overname_doel` niet.

62. **Het venster van poort (3) kijkt sinds M92 VOORUIT en laat een pre-opening test door** — **AF
    (23-08-2026, ronde 5).** Het venster is VERBREED naar `[blokStart − 21, blokStart + 28)`: het
    oude venster PLUS de aanloop van drie weken, dus strikt additief. GEMETEN op de gebouwde bron:
    met een niet-gereden test 10 dagen vóór elke opening geeft de app **0 aanbiedingen op 440
    openingen**, waar dat er vóór de ingreep 271 waren.
    **EERST FOUT GEBOUWD, en de weerleggingspas ving het vóór de commit.** Mijn eerste versie zette
    het venster op `[blokStart − 21, blokStart + 7)` — "dezelfde span, alleen de richting klopt
    weer". Dat is een ROTATIE en geen correctie: een niet-gereden test 14 of 21 dagen NA de opening
    werd door het OUDE venster onderdrukt (0 van 440) en door het geroteerde niet meer (440 van
    440). Een blinde vlek ingeruild voor een andere. Niet het hele doelblok als venster: dan zou een
    geaccepteerde en gereden test van de vorige opening de volgende dichtzetten. De diagnose die
    eronder ligt staat hieronder.
    HET MECHANISME. Poort (3) onderdrukt het aanbod als er in het venster `[blokStart, blokStart +
    BLOK_WEKEN * 7)` al een test-override staat. `blokStart` is `blokStartVoorWeek` van de
    aanbodweek, en sinds de verhuizing IS de aanbodweek vierweekse blokweek 1 — dus `blokStart` is
    de openingsmaandag zelf en het venster dekt de vier weken NA de opening. Tot M92 lag het aanbod
    in blokweek 4 en dekte het venster de drie weken ERVOOR.
    HET GEVOLG, gemeten op de gebouwde bron: een test die 5 of 10 dagen VÓÓR de opening is ingepland
    en nog NIET gereden is, wordt door geen enkele poort gezien — poort (3) niet want hij ligt vóór
    het venster, en poort (7) niet want `laatsteGelegenheid` telt alleen wat GEREDEN is. De app
    biedt dan een TWEEDE test aan. Dezelfde test wél gereden wordt correct onderdrukt, en een test
    ná de opening ook.
    DE INGREEP IS KLEIN: verbreed het venster met de aanloop, dus `[blokStart − 21, blokStart +
    28)`. Additief, zodat niets dat eerder werd onderdrukt dat nu niet meer wordt, en zonder de
    vierweekse klok te verlaten. Vraagt autorisatie omdat het poort (3) raakt.
61. **De DOELCHECK aan het eind van het blok — de tweede helft van M89** — open · norm plus CLIENT.
    **DIT IS DE EERSTVOLGENDE RONDE** (Daan-besluit 23-08-2026). GROND VOOR DIE PLEK: in februari
    sluit het onderhoudsblok, en dan is de vraag of de FTP het gehouden heeft — vóór de
    Amstel-Gold-voorbereiding begint.
    M92 heeft de twee vragen van M89 ook in de TIJD gescheiden: de IJKING staat nu vooraan en kijkt
    vooruit, de DOELCHECK hoort achteraan en kijkt terug. Die tweede helft bestaat nog niet als
    eigen moment; vandaag draagt de blok-terugblik hem impliciet.
    **DE GRONDSTOF ONTBREEKT NOG STEEDS, hertoetst op HEAD 23-08-2026** (`docs/PUNT47-BOUW.md` §30).
    `DOELEN-SPEC` §3.2 vraagt het beste 20-minutenvermogen over ZES WEKEN. Dat getal bestaat als
    marker — `PC_MARKERS_` draagt `{ sec: 1200, label: "20m", key: true }` — maar alleen over de
    twee vensters die de power-curve kent: `export type PowerCurveWindow = "90d" | "1y";`, met een
    route-whitelist `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`.
    **DE DICHTSTBIJZIJNDE ROUTE IS HET VENSTER VERBREDEN.** Wat er precies voor nodig is: een derde
    waarde in die union plus de whitelist, en — het onbekende — VERIFICATIE dat intervals.icu die
    `curves`-waarde accepteert op `GET /athlete/{id}/power-curves?type=Ride&curves=<window>`. De
    tweede route (per rit een 20-minutenpiek) vraagt een nieuwe kolom op `activities`, die vandaag
    geen enkele piekwaarde draagt, plus werk in de sync. De derde (uit de per-rit-intervallen)
    vraagt opslag die er niet is — `ride.ts` haalt ze on demand op en bewaart niets — en dat is
    punt 49.
    HANGT VERDER AAN PUNT 54 (welke maat per doel). Bouw hem niet vóór 54 beslist is, anders kiest
    de bouw stilzwijgend een maat.

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

## De volgorde

De bouwvolgorde staat HIER en niet in de nummering. De FOCUS-regel van een close-out wijst
naar het eerstvolgende open punt uit deze lijst en noemt het bij naam; wijkt een chat ervan
af, dan staat de reden in hetzelfde STAND-blok.

VASTGELEGD 07-08-2026, op Daans instructie. De aanleiding is een patroon: punt 11, punt 13
fase B en punt 16 zijn elk geparkeerd met als grond dat ze bij het HUIDIGE doel inert zijn.
Die grond vervalt. `WERKWIJZE` draagt hem al voor de deploy — "de gebruiker merkt er niets
van is expliciet geen grond om te wachten" — en de canon maakt het model doel-onafhankelijk:
M9 (geen aparte modus), M21 en M22 (de doelgroep is de amateurfietser), M33 (een doel bestaat
alleen als het model het kan meten en bedienen). Inert bij het ingestelde doel is een grens op
het BEWIJS, nooit op de bouw.

HET PRINCIPE, in rangorde. (1) Eerst het meetgereedschap: elk begrenzingsbewijs leunt erop.
(2) Dan het ontbrekende vangnet, zodat elke ronde daarna goedkoper is. (3) Dan de goedkope
metingen die een punt kunnen SLUITEN zonder bouw. (4) Dan wat de app onwaars laat zeggen of
doen, ongeacht het ingestelde doel. (5) Dan de afhankelijkheidsketens. (6) Als laatste wat
een ontwerpronde is in plaats van een bouwronde.

EEN RONDE PER PUNT. Sluit een punt niet binnen zijn ronde, dan volgt een VERDICT met een
getal — gerepareerd, of begrensd uitgesloten met reden en aantal — en geen tweede poging.
Zo kan geen enkel punt een sleepronde worden. Dezelfde vorm als punt 11 en punt 10 fase B.

1. **37** — af · de vite-dev-server sterft stil. Het te repareren defect is het ETIKET: de
   harness leest een infrastructuur-uitval als een inhoudelijke. De grondoorzaak mag onopgelost
   blijven zolang hij niet meer liegt. Gebouwd 07-08-2026 op `526ce4ea`; de grondoorzaak is
   bewust blijven staan.
2. **25 + 22 + 23** — af · de drie blinde vlekken van de camera, in EEN ronde. Lukt 23 niet met
   uitgezette animaties, dan blijven die twee shots uitgesloten met reden en aantal. Gebouwd
   07-08-2026 op `6798f16`; alle drie gerepareerd, en 23 zonder uitsluiting — het ijkpaar mét de
   fix gaf 96 van de 96. De uitgezette animaties waren overigens een dood spoor: `reducedMotion`
   stond al aan en is per constructie inert.
3. **36** — af · verdict. De ijkparen komen gratis uit ronde 1 en 2. Gerepareerd, of het
   scenario begrensd uitgesloten. Dit punt staat ACHTERAAN in het tooling-blok omdat het als
   enige al een bouw achter zich heeft die het verschijnsel niet wegnam. BEGRENSD UITGESLOTEN
   per 07-08-2026: het ijkpaar van die ronde was schoon (96 van de 96, nul uitgesloten), de
   post-settle race is uitgesloten op 0 na-settle-requests over 50 zaai-loads, en de
   restvariantie vuurt in twee van vier sessies — telkens één scenario, alle acht shots, met
   verschillende innerText. Geen derde poging.
4. **33** — af · de norm-vergelijking naar EEN gedeelde functie, plus een render-testlaag. Die
   laag BESTAAT NIET: `apps/web/vitest.config.ts` draait op `environment: "node"`, er is geen
   `.test.tsx` en geen jsdom. Dit is toevoegen, niet consolideren. Betaalt zich terug bij elke
   kaart-ronde hierna. Gebouwd 07-08-2026 op `e55637a` en `8288d2b`, in OMGEKEERDE volgorde —
   eerst het vangnet, dan de consolidatie, want per plek rood meten kan daarna niet meer.
5. **21** — af, GESLOTEN ZONDER BOUW · de bereikbaarheid is gemeten en de tak vuurt nooit:
   0 van de 15275 sessies bereikt `buildWorkoutDescription_`, en de invoerruimte van de
   parsers telt 7 duur-vormen en 1 vermogensvorm die alle acht parsen. Verdict 07-08-2026.
5b. **38** — af · de opener-fetch kapt af en meldt het niet. NAAR VOREN, met reden: de marge op
    `docs/WERKWIJZE.md` is circa 2,8 kB en één ronde kostte er 1561, dus binnen één à twee
    rondes verliest de opener stilzwijgend de vijf promptcontroles, de gate en het
    opener-sjabloon. De ingreep is een verbatim verhuizing zonder verlies, plus een
    byte-rapportage in elke close-out. Gebouwd 08-08-2026: lessen naar
    `docs/WERKWIJZE-LESSEN.md` (vijfde opener-URL), `HANDOFF.md` geroteerd op twaalf blokken naar
    `docs/HANDOFF-ARCHIEF.md`, en een `<!-- EINDE <pad> -->`-marker op alle vijf de
    opener-bestanden die het sjabloon zelf toetst.
6. **40** — het drempel-label loopt dwars door de LT2-grens. IN DE PLAATS VAN PUNT 19, met reden:
   de meting van 08-08-2026 maakte punt 19 tot SYMPTOOM — 369 cellen, waarvan 45 buiten scope en
   de rest in de deload-tak, en op Daans eigen weekvorm nul — terwijl het label-meetgat punt 39 én
   punt 41 allebei BLOKKEERT. Zolang `drempel` zowel 89-92 als 98-105 procent FTP dekt, is er geen
   toets die een uitkomst over karakter of methodiek kan dragen. Norm-neutraal: er verandert geen
   training, alleen de zichtbaarheid.
   **AF, GESLOTEN ZONDER BOUW op 08-08-2026.** Het meetgat is als NORM-regel gesloten — M81 en M82
   in `docs/TRAININGSMODEL.md` — en niet als code: een karakter-uitspraak rust voortaan op de BAND
   en niet op het zone-label. De karakter-as zelf had geen consument die zonder haar stuk is, dus
   bouwen zou vooruit-bedrading zijn geweest. Punt 39, 41 en 42 zijn daarmee gedeblokkeerd. Wat
   overbleef is het poort-defect en dat staat nu als punt 43, hieronder als item 6d.
6b. **41 + 42** — de weekmix en M78, samen ÉÉN meetronde. Beide zijn op één as gemeten en beide
   vragen dezelfde uitbreiding: over doelen en macrofasen heen. 41 vraagt of het plan bij hoger
   volume hoort te polariseren en of de Z3-reeks variant-rotatie is; 42 of `mesoFactor` %FTP
   werkelijk schaalt. Geen bouw vóór het verdict.
   **AF, GESLOTEN ZONDER BOUW op 09-08-2026.** Beide vragen zijn over de volle ruimte beantwoord —
   420 cellen, 1980 sessies, 14978 blokken. Het plan polariseert NIET maar verdunt (Z3 van 10 naar
   3 procent), de rotatie-hypothese is weerlegd (0,9 procentpunt over de mesoweken tegen 8,7 over
   de doelen), en `mesoFactor` schaalt de dosis en niet het percentage — werkband identiek in 200
   van de 200 en 197 van de 197. M78 is INGETROKKEN; M83, M84 en M85 dragen de bevindingen. Er
   volgde geen bouw, wél een nieuw punt: 44, hieronder als item 6e.
6c. **39 + 45** — de herstelweek: de volumefactor EN de referentie waartegen hij korten moet.
   Draagt M79, M80, M86 en M87. Punt 19 gaat hierin op. Kan pas na punt 40.
   **PLEK GEMETEN op 09-08-2026, nog niet gebouwd.** Zie `docs/PUNT39-PLEK-RECON.md`; §7 van
   `docs/PUNT39-DELOAD-RECON.md` is daarmee vervangen. De ingreep landt CLIENT-SIDE op
   `sessieMin` (`apps/web/src/lib/proposal.ts:619`), niet in de engine: de engine-plek voor de
   allocator haalt de curve exact maar kantelt de werkband in 31 van de 56 cellen, zeven keer
   over een zone-klasse-grens, en schendt M76. Acceptatie: reeks 76 / 75 / 72 / 63 / 56 / 56 /
   56, werkband 56 van de 56 identiek, kwaliteitsdagen 1 op Base en Build en 0 op Test,
   opbouwweken 84 van de 84, weekvorm-as 21 van de 21. Punt 45 hoort in DEZELFDE bouw.
   **AF EN LIVE per 09-08-2026**, op `d7b8feb` en Worker Version
   `ef9152dc-5c86-4606-ab97-55df97449877`. De reeks is gereproduceerd op **76 / 75 / 72 / 63 / 56 /
   56 / 56**, met de VOOR-staat eerst geijkt op **100 / 100 / 100 / 95 / 97 / 92 / 88** (7 van de
   7) zodat het verschil aan de bouw toe te schrijven is. Beide punten in één bouw, client-only.
6d. **43** — de normpoort staat op een midpunt-label dat identiek werk splitst. NÁ punt 39, met
   reden: punt 39 bouwt de karakter-as samen met zijn eerste consument, en pas daarna is de
   poort-reparatie goedkoop te meten — de as ligt er dan al en de rood-meting per plek gaat over
   het verplaatsen van de poort, niet over het bouwen van een nieuwe grootheid. Andersom zou de
   as tweemaal ontworpen worden. NIET norm-neutraal: eerst per plek meten, in beide richtingen.
   **DE VOORWAARDE IS INGELOST per 09-08-2026:** punt 39 is gebouwd en staat live, dus de
   karakter-as ligt er samen met zijn eerste consument. De meting van dit item gaat daarmee over
   het VERPLAATSEN van de poort en niet meer over het bouwen van een nieuwe grootheid.
   **AFGEVINKT per 10-08-2026:** gebouwd in `95751a1` en live op Version ID
   `e994c768-3d73-4aec-876b-b614b7fe1302`. Drie meetrondes; de derde droeg de bouw.
   **NA 6d VOLGDE 6f, EN DAARNA 6e** — zie de omkering onder 6f.
6e. **44** — AF (20-08-2026) — de kwaliteitsdosis plafonneert vanaf acht uur. NÁ 6f — zie de
   omkering daar — en met
   een eigen soort stop: dit is COACH-CANON en geen meetopdracht. De ronde begint met een BESLUIT
   van Daan over hoeveel kwaliteit bij veertien uur hoort — herkomst BELEID — want er bestaat geen
   meting die dat antwoord kan dragen. Zonder dat besluit is er niets om tegen te bouwen, dus deze
   plek in de rij is een agendapunt en geen bouwronde. Draagt M85.
   **HET BESLUIT IS ER per 11-08-2026 — M88 (NORM).** Daarmee is 6e geen agendapunt meer maar een
   meetronde: de decompositie van de 1,75, read-only, met "geen bouw" als geldige uitkomst. Zie
   punt 44 hierboven.
   **6e IS AF (20-08-2026), gesloten zonder bouw.** De meetlat bleek het defect: kwaliteit werd
   op boven-100-procent geteld terwijl de engine de drempelzone op 91 tot 105 procent zet. Zie
   punt 44.
6f. **46** — `docs/WERKWIJZE-LESSEN.md` loopt naar de opener-cap. **NAAR VOREN, VOOR 6e —
   Daan-besluit van 10-08-2026, en de reden staat in de cijfers.** Het bestand staat na de
   close-out van punt 43 op **110213 bytes**, marge **10787** tot circa 121000. Die ene
   close-out kostte er **2989**, want hij droeg zeven lessen; over de laatste zeven close-outs
   is de groei **2289 bytes per ronde**. Dat is nog **vier à vijf rondes**, en op het tempo van
   de zwaarste ronde **3,6**. Punt 44 kost er naar verwachting twee tot drie, dus 6f zou daarna
   met minder dan twee rondes marge moeten draaien — onder tijdsdruk, en dat is precies wat dit
   punt hoort te voorkomen. DE EERDERE FORMULERING HIER IS VERVANGEN: die zei "NÁ punt 44, want
   het is geen noodgeval: 13776 bytes marge is bij het gemeten tempo nog ruwweg zes rondes" en
   mat de staat VÓÓR de close-out van punt 43. *De reeks* punt 46 droeg het gecorrigeerde getal
   toen al, dus de twee plekken in dit document liepen uiteen — dezelfde vorm als de regel dat
   een STAND-blok zijn eigen commit per constructie te laag meet.
   Het blijft wel een ONTWERPronde en geen verhuizing — de lessen zijn werkende discipline die
   elke chat moet lezen, dus wegzetten in een niet-opgehaald bestand is precies de fout die punt
   38 blootlegde. De ronde kiest tussen splitsen met een zesde opener-URL en een andere ordening.
   **AFGEVINKT per 10-08-2026:** de ronde koos het SPLITSEN, en de zesde opener-URL staat er.
   Gebouwd in `5de6c3f`: 57 lessen gereedschap tegen 87 bewijslast, multiset-gelijkheid met 0
   verschillen op 985 distincte regels, en de krapste opener-marge van 10787 naar 56166. Het
   knelpunt ligt sindsdien bij `HANDOFF.md`, dat zichzelf begrenst op twaalf STAND-blokken.
   **DE VOLGENDE IS 6e.**
7. **16** — AF (21-08-2026) — de materialiteitsvloer en de prikkel, in EEN bouw. Zie
   `docs/PUNT16-RECON.md` §5. **AFGEVINKT:** gebouwd in `5f8a63c`, drie blokken (harness, plek-recon,
   bouw). Bereik 15 van de 420 weken, vloer N = 4 en aantoonbaar zonder oordeel-effect; de twee
   vervolgvragen staan bij punt 16 in *De reeks*. **DE VOLGENDE IS 8 — punt 34.**
8. **34** — AF (22-08-2026) MET ÉÉN UITZONDERING — de effect-referent kent het doel niet.
   **AFGEVINKT:** (a), (b), (c) en (e) gebouwd in `8a95f52`; de doel-tak staat als `doelTak` op
   `EffectReferent` en de uitkomst-union bleef ongemoeid. De WAT-ALS hield op alle drie de punten.
   **(d) BLIJFT OPEN en zijn eigen voorwaarde is weerlegd:** er hangt wél iets aan de poort — de
   dosis-ramp gaat mee, `mesoFactor` en de kalender-deload niet. Bovendien is de dosis-verhoging
   die de blok-check voorstelt bij een behoud-opdracht inhoudelijk fout. Zie het punt zelf voor de
   twee lezingen van (d) met hun verschillende straal.
9. **50** — AF (22-08-2026) EN LIVE — de coach belooft bij Onderhoud een test die hij daar nooit
   voorstelt. Stond VÓÓR 47 en 48 met reden: die twee zijn ONTWERPVRAGEN, en dit was een ONWARE ZIN
   die draaide — bij doel Onderhoud zelfs als normale uitkomst. **AFGEVINKT:** gebouwd in
   `3a9d5458`, één cel bewoog, nul asserties braken, geen poort geraakt.
   **DE VOLGENDE IS 10 — punt 51.**
10. **51** — het CC-harnas als vangnet. VÓÓR de bouw van 47, op rangorde-principe (2): eerst het
    ontbrekende vangnet, zodat elke ronde daarna goedkoper is. Het norm-besluit van 47 is al
    genomen (M89 t/m M91), dus 47 wacht op een BOUW en niet op een beslissing — en die bouw raakt
    een poort, een klok en de copy tegelijk. Precies de ronde waarin een engine-deny-hook en een
    blokkerende gate hun geld opleveren. Gemeten in `docs/GEREEDSCHAP-RECON.md`. VIER BOUWSTAPPEN
    bij het punt zelf. **(1) EN (2) ZIJN AF per 23-08-2026, commit `e7c3e910`** — met twee
    aflezingen open: agent-discovery plus tools-binding, en de rules-empirie. **(4) IS AFGEWAARDEERD**
    op de eigen runtime-meting (49s). Wat rest is (3), de SNOEI van de canon, en die heeft nu een
    maat en een intrekkings-criterium.
10b. **52** — AF (23-08-2026) — recon en bouw in ÉÉN ronde. DRIE KEER gedraaid: de eerste twee
    stopten bij de recon (V1 en W2 vielen), de derde bouwde. VERDICT: **JA, onder voorwaarde** — de
    vorm is bruikbaar voor rondes die een mechanisme raken, mits de twee regels uit het
    ronde-2-verdict allebei draaien. Zonder de adversariële weerleggingspas is hij aantoonbaar
    slechter dan de splitsing; die pas ving in ronde 3 vier fouten die al in de bron stonden,
    waaronder een echte regressie. Er is een DERDE regel bijgekomen uit het falen van ronde 3 zelf
    (één ding per probe). Zie het punt zelf.
11. **47** — GROTENDEELS AF (23-08-2026) — de check valt in twee: ijking bij elk doel, doelcheck
    per doel. **HET NORM-BESLUIT IS GENOMEN (22-08-2026): M89 t/m M91 in `docs/TRAININGSMODEL.md`
    §13.** De BOUW kostte DRIE rondes, alle drie verantwoord in `docs/PUNT47-BOUW.md`. Ronde 1 en 2
    stopten vóór de eerste regel code, elk met opbrengst: ronde 1 vond dat de vierweekse klok het
    aanbod op DRIE samenhangende plekken bindt, ronde 2 weerlegde dat de vloer alleen iets doet én
    mat de route die wél werkt. **RONDE 3 HEEFT GEBOUWD:** poort (1) versmald tot de
    doelblok-testweek en `TEST_INTERVAL_DAGEN` op 84, SAMEN als één wijziging, geen engine geraakt.
    Dekking van 24,1% naar 100,0% (vaste weekvorm) en 66,7% (wisselende), nagemeten op de gebouwde
    bron. **WAT VAN 47 OPENSTAAT:** de MAAT uit `DOELEN-SPEC` §3.2 (punt 54), M91's ONGEIJKT-staat
    (punt 53), het verdwenen retry-venster (punt 55) en de dagkeuze (punt 58).
11b. **57** — AF (23-08-2026) — de roostercondititie plus de afgeleide vloer, als één wijziging.
    Gebouwd in ronde 3 van punt 47; dekking van 24,1% naar 100,0% (vaste weekvorm) en 66,7%
    (wisselende), nagemeten op de gebouwde bron. **DE VOLGENDE IS 11c.**
11c. **58 + 55** — AF (23-08-2026, ronde 4 van punt 47). 58 is opgelost door de vloer te
    HERAFLEIDEN voor de nieuwe meetkunde (77 in plaats van 84); het residu is weg, dekking 100,0
    procent bij beide weekvormen. Van 55 is de herkansings-vraag met NEE beantwoord en gesloten, en
    de kostenpost van het eerste aanbod na een verse `doelStart` is vervallen — die week IS nu zelf
    een opening. Wat van 55 openblijft is de tegenhanger (M91: zeg het als er niet geijkt is) en dat
    is punt 59. **DE VOLGENDE IS 11d.**
11d. **62 + 59 + 60** — AF (23-08-2026, ronde 5), alle drie in één ronde. 62: het venster van poort
    (3) is uitgelijnd op de opening. 60: de sprong is uit de ijk-poort, met een vlag zodat de
    terugblik hem als informant houdt. 59: de bevestig-uitgang staat op `sync_state.ijking_*` met
    één migratie, en de vluchtige module-`Set` is weg. Eerste ronde van deze reeks die de worker en
    een migratie raakte. Wat van 59 openbleef is de letterlijke bevestigings-teller; die is in 11d-2
    VERVALLEN.
11d-2. **64 + 59(c)** — AF (23-08-2026, ronde 6), kleine ronde en de TWEEDE en LAATSTE keer dat deze
    reeks D1 raakt. 64: `sync_state.ijking_doel` erbij met migratie 0012, zodat een bevestiging geldt
    voor het DOEL waarvoor zij gegeven is — gemeten van **4 van 7 naar 7 van 7** wisseldagen met een
    aanbod, terwijl een doorrollend blok op **0 van 7** blijft. 59(c): de bevestigings-teller is
    VERVALLEN met grond en vervangen door de LEEFTIJD IN WEKEN; punt 59 is daarmee helemaal af.
11d-3. **PROD-MIGRATIE** — AF (23-08-2026). Migraties `0011` en `0012` toegepast op REMOTE D1 via
    `wrangler d1 migrations apply cadans --remote`; W1, W2 en W3 hielden alle drie, zuiver additief,
    0 gewijzigde waarden op de bestaande kolommen. GEEN worker-deploy, met grond: punt 65.
    Sindsdien is het STAAND BELEID dat een migratie wordt toegepast in de ronde die hem toevoegt —
    zie `docs/WERKWIJZE.md`, *Migraties en deploys*. De prod-stand staat vanaf nu in
    `docs/PROD-STAND.md`, en daar bleek meteen iets uit dat nergens genoteerd stond: **de live
    Worker draait sinds 10-08-2026** en mist dus het hele punt-47-blok.
11d-4. **65 (meethelft) + DEPLOY** — AF (24-08-2026). De TZ-schuld is voor het eerst GEMETEN in
    plaats van beredeneerd: `docs/TZ-RECON.md`. Uitkomst — 24 van 384 instants verschillen (6,3
    procent), uitsluitend in een venster van 1 tot 2 uur dat eindigt op 00:00 UTC, en **0 scheve
    rijen op prod**, structureel nul omdat de enige door de Worker geproduceerde datumkolom een
    cache-bucket is. T1 en T2 hielden allebei, dus de deploy-blokkade van punt 65 is opgeheven en de
    twee weken oude codesprong is uitgerold. De REPARATIE van de TZ-schuld staat nog open, nu mét
    een maat. Ook nieuw: `docs/CC-CHECKS.md` CHECK 39 (de persistente lokale D1 tegen de repo) en de
    staande regel dat elke prod-mutatie vooraf haar weg terug draagt, allebei uit gaten die deze
    reeks zelf opleverde.
    **DE VOLGENDE IS 11e.**
11e. **61 (+ 54)** — de DOELCHECK aan het eind van het doelblok, de tweede helft van M89.
    **DIT IS DE EERSTVOLGENDE RONDE**, bevestigd 23-08-2026. Het is het enige deel van punt 47 dat
    nooit is aangeraakt.
    **NAAR VOREN GEHAALD op Daan-besluit van 23-08-2026, met een DATUM als grond:** in februari
    sluit het onderhoudsblok en dan is de vraag of de FTP het gehouden heeft, vóór de
    Amstel-Gold-voorbereiding begint. Dat is een harde kalendergrond en geen voorkeur, en hij zet 61
    vóór 48, 49, 35 en 32. 54 (welke maat per doel) hangt eraan vast en wordt in dezelfde beweging
    beslist.
    **DE LEESVRAAG IS BEANTWOORD (ronde 5, `docs/PUNT47-BOUW.md` §30) en de uitkomst is: de
    grondstof ontbreekt op HEAD.** `DOELEN-SPEC` §3.2 vraagt het beste 20-minutenvermogen over ZES
    WEKEN. Dat getal bestaat als marker — `PC_MARKERS_` draagt `{ sec: 1200, label: "20m", key: true }`
    — maar alleen over de twee vensters die de power-curve kent:
    `export type PowerCurveWindow = "90d" | "1y";` met route-whitelist
    `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);`. De dichtstbijzijnde route is dus een
    DERDE waarde in die union plus de whitelist, én — het onbekende — VERIFICATIE dat intervals.icu
    die `curves`-waarde accepteert op `GET /athlete/{id}/power-curves?type=Ride&curves=<window>`.
    Dat laatste vraagt een echte API-aanroep en is niet vanaf schijf te beantwoorden.
11f. **63** — het ONDERWEG-SIGNAAL: één aanbod, twee aanleidingen. DAARNA, en niet eerder, want het
    WACHT op punt 49: de app moet per rit in de TIJDLIJN kunnen kijken en zoneminuten-totalen dragen
    dat niet.
12. **48** — geen testaanbod rond een A- of B-event. Klein, één conditie in `buildTestVoorstel`,
    en het staat hier zo vroeg omdat het goedkoop is en een echte schade voorkomt.
13. **49** — de doelcheck aflezen uit een sleutelsessie. Vraagt opslag en aggregatie van de
    interval-structuur, dus een migratie. Begint met één meting: is `icu_intervals` gevuld.
14. **35** — een event draagt geen duur. Deblokkeert punt 13 fase B.
15. **13 fase B** — de doelvraag na het event.
16. **32** — de rit-beoordeling. M31 noemt het bedrading en geen nieuwe bouw.
16b. **56** — de twee constanten zonder herkomst-etiket. Klein, en het is een OPZOEKRONDE en geen
    bouw: de GAS-bron op schijf plus de commit-historie van `apps/web/src/lib/testvoorstel.ts`.
    Raden is hier expliciet verboden.
17. **11** — de duurvermogen-maat OPNIEUW ontwerpen. Achteraan met de juiste reden: de
    gemeten maat mat de RITKEUZE en niet het duurvermogen, dus dit is een afgekeurd ontwerp
    en geen wachtende bouw. Tot dan blijft Conditie ongedekt (M33, M39). Punt 49 levert
    hier het gereedschap voor: zonder per-blok-data uit de rit is deze maat niet te bouwen.

De oude verantwoording van de gesloten punten 1 t/m 12 staat onder *Gesloten — vindplaats*.

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

DE VOLUME-AS W1 TOT EN MET W7, vastgelegd 09-08-2026. Dit is een TWEEDE as, naast de weekvorm-as
hierboven: die varieert de VORM bij ongeveer gelijk volume, deze varieert het VOLUME van 3 tot 14
uur. Elke ronde die iets over volume beweert draait deze vormen, en geen andere.

- **W1** 3,0u — ma45 wo45 za90
- **W2** 4,5u — ma50 wo50 vr50 za120
- **W3** 6,0u — ma60 wo60 vr60 za180
- **W4** 8,0u — ma70 wo70 vr70 za180 zo90
- **W5** 10,0u — ma75 di60 do75 za210 zo180
- **W6** 12,0u — ma90 di75 wo60 do90 za240 zo165
- **W7** 14,0u — ma90 di90 wo90 do90 za270 zo210

DE REDEN DAT DIT HIER STAAT is een gemeten kosten-post: punt 41 droeg een TID-reeks over 3,0 tot
15,0 uur waarvan de weekvormen NERGENS waren vastgelegd, en die reeks bleek daardoor niet
reproduceerbaar — de punt-41-ronde moest een eigen as verzinnen en kon de oude getallen niet
weerleggen of bevestigen. Een as die niet in de repo staat, bestaat niet.

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
  KRUISVERWIJZING NAAR PUNT 39 per 08-08-2026: die cap KLOPT en wordt onder M79 juist bevestigd —
  een herstelweek hoort in het duurvolume te snijden. Het probleem is dat de WEEKEND-tak hem
  omzeilt: de lange rit blijft op volle duur staan omdat die dag weekend heet, dus de enige post
  die wél gecapt zou moeten worden ontsnapt eraan. De kwalificatie "Coach-canon" blijft dus staan;
  wat verandert is dat punt 39 de omzeiling adresseert en niet de cap zelf.
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

- `KWALITEIT_MIN_PER_PRIKKEL` (`packages/engine/src/utils.ts`, FTP 28 · Onderhoud 22 · de rest
  26) draagt GEEN herkomst-label en geen afleiding, terwijl `bibliotheekSignatuur` de VORM van
  de norm wél uit de bibliotheek afleidt (tempo 0,2821 · drempel 0,5625 · anaeroob 0,1554). Die
  asymmetrie stond in punt 17 en is daar NIET opgelost: het oordeel leest die constante sinds
  05-08-2026 niet meer, maar het PLAN en de dosis-trede nog wél. Elk getal hoort PLAN, SIGNAAL
  of BELEID te dragen.
- OP DOSIS-TREDE 4 staat bij Korte beklimmingen op weekvorm V3 in 3 van de 960 gemeten
  dagcellen MEER gepland dan de gebruiker opgaf, maximaal 3,8 minuten. Gemeten chat-zijde bij
  punt 17; klein, maar het plan hoort de opgegeven ruimte nooit te overschrijden.
- DE M3-VERDAMPINGSCLAIM IN `apps/web/src/lib/punt15.test.ts` RUST NOG OP DRIE BLOKKEN. Dat geval
  isoleert term 2 van de conjunctie — zones slagen, totaal zakt — en dat kan alleen op een blok
  waar norm-massa BUITEN de poort valt. Punt 43 verbreedde de poort en haalde FTP/Build als drager
  weg (95 van de 95 nu binnen de poort); het geval staat sinds 10-08-2026 op Korte
  beklimmingen/Build met marge 4. Wat overblijft: Korte beklimmingen/Peak met marge 4 en Lange
  beklimmingen/Peak met **marge 1**. Verbreedt een volgend punt de poort verder, dan moet dit geval
  opnieuw VERPLAATST worden naar een blok dat de claim nog draagt — nooit verzwakt, want dan meet
  het de conjunctie niet meer.


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
- DE PUNT-17-MEETLAT VERDRAAGT HOOGSTENS EEN HALVE MINUUT TEKORT PER ZONE, en in 101 van de 1095
  beoordeelde zone-cellen (9,2 procent) minder dan 0,05 minuut. Op Daans eigen weekvorm ma45 di60
  do60 za120 bij doel FTP staat Base week 2 op een marge van 0,07 — drempel plan 74,57 tegen een
  eis van 75. Dit is een eigenschap van het BEWUSTE nul-tolerantiebesluit van punt 17, niet iets
  dat punt 16 introduceert: waarneming met getal, GEEN heropening. Bron: `docs/PUNT16-RECON.md` §7.

- DE COACH-COPY-RONDE. De toon van de coach-teksten is nooit als geheel doorgelopen; losse
  rondes hebben hem per kaart bijgesteld. STAAT HIER EN NIET IN DE REEKS, met reden: het is
  een VOORNEMEN zonder diagnose en zonder vindplaats — er is geen gemeten defect en geen
  bestand aangewezen. Hij reisde sinds 02-08-2026 mee in de OPENSTAAND-regels van de
  STAND-blokken zonder ergens een bron te hebben; deze bullet IS die bron. Wordt hij een
  punt in de reeks, dan pas nadat er een concrete klacht of meting onder ligt.

### DATA

- DE DOSIS-TREDE VERGELIJKT OP DE RAUWE DOEL-STRING. `apps/web/src/lib/schema.ts:1411` toetst
  `dosisTredeRow.doel === (settings?.doel ?? null)` zonder `normalizeDoel_` ertussen. Een
  bewaarde `"Beklimmingen"` naast een ingestelde `"Lange beklimmingen"` leest daar dus als een
  ANDER doel, waarna de trede stil op 0 valt — precies de valkuil die punt 28 in `settings.ts`
  wél afvangt. Vindplaats uit de punt-28-ronde, bewust niet meegebouwd: het is een tweede defect
  met een eigen rood-meting.
- GEMENGDE WEGING, één overgangsweek: bewaarde weekplannen van verstreken dagen houden hun oude
  getal; `workoutFromFrozenEntry` leest opgeslagen TSS verbatim. Precies zoals bij de vorige
  ijking.
- RESIDU UIT DE MEETOPZET: de ijk-query klonterde Z5, Z6 en Z7 al samen in de kruisproducten,
  dus één tarief 3,08 dekt een mix die in een gepland VO2-blok anders ligt (Daans reeks:
  60/27/12). Splitsen vraagt een NIEUWE read-only meting; uit deze data is het niet te halen.
- DE HISTORISCHE GRENZEN. Elke activiteit draagt `icu_power_zones`, maar die wordt niet per rit
  bewaard: alleen de nieuwste wint. Een zone-wijziging midden in een blok is daarmee niet te
  herleiden. Ongewijzigd geparkeerd.

- AFGEVOERD 05-08-2026 — `indoor_ftp` 260 TEGEN `ftp` 280. Intervals scoort een indoor-rit
  tegen 260 terwijl het plan op 280 rekent (`docs/DOSIS-MUNT-RECON.md`,
  `docs/ZONE-SYNC-BOUWDOC.md`, `docs/ZONE-MUNT-ONTWERP.md`). GEEN BOUW: Daan trekt de twee
  waarden zelf gelijk in intervals.icu, dus het verschil verdwijnt bij de bron en er is niets
  te compenseren. Dit item reisde sinds 29-07-2026 mee in de OPENSTAAND-regels zonder ooit een
  plek in de reeks te hebben; het staat hier zodat een volgende chat het niet opnieuw opvist.

### TOOLING

- `/api/health` DRAAGT GEEN VERSIEVELD, waardoor een deploy niet op de endpoint zelf te verifiëren
  is. Hij geeft `{"ok":true,"service":"cadans-api"}` — dat bewijst dat de Worker leeft, niet welke
  bundel eronder zit. Bij de deploy van punt 43 (10-08-2026) is daarom uitgeweken naar
  BUNDEL-IDENTITEIT: het asset waar de live `index.html` naar wijst, byte-vergeleken met de lokale
  build. Dat werkt, maar het is een omweg van twee ophalingen waar één veld zou volstaan. Een
  `version`-veld met de commit-hash of de Worker Version ID maakt de verificatie één regel.
- DE SHOT `16-ritdetail` ASSERTEERT ZIJN TWEE GETALLEN MAAR PRINT ZE NIET. Het trefferaantal van
  de rij-selector en het aantal `aria-label="Sluiten"`-elementen na de klik staan nergens in de
  `.txt`, dus op een PROD-run zijn ze niet te noemen — daar is alleen "hij gooide niet" af te
  lezen. De eis staat bovendien op MINSTENS TWEE rijen terwijl er vandaag vijftig zijn: dat
  aantal kan stil naar twee eroderen zonder dat er iets rood wordt. Fix: beide getallen in de
  `.txt` van die shot schrijven, zodat de assertie een AFLEESBAAR getal achterlaat in plaats van
  alleen een stilte. Gevonden bij de prod-rookproef van 07-08-2026.

- KANDIDAAT, NIET VASTGESTELD: VIER SCHERMEN WAREN BYTE-IDENTIEK tussen de lokale run en de
  prod-run van 07-08-2026 — `09-vorm`, `10-trainingen`, `12-activiteiten` en `16-ritdetail` —
  ondanks verschillende klokken (lokaal gepind op 2026-08-03, prod op de echte 2026-08-07) en
  verschillende `.txt` (prod draagt vier 404's op `/api/checkin/2026-08-07`, lokaal niet).
  Nagegaan met sha256 én met het `innerText`-blok, dat voor `09-vorm` en `16-ritdetail`
  letterlijk gelijk is. GROND: die vier hangen aan GESYNCHRONISEERDE Intervals-data en niet aan
  de gezaaide plan-kant, en beide runs trokken binnen minuten van hetzelfde account. Dit is een
  AFBAKENING van het CLIENT-item "het lokale beeld is niet het prod-beeld" en geen weerlegging
  ervan: dat item gaat over de blok-terugblik, die wél aan de gezaaide historie hangt.
  FALSIFIER: rijd tussen twee runs, of draai op een dag waarop de wellness verschilt.

- DE HARNESS BELOOFT IN PROD-MODUS "geen enkele schrijf-aanroep" (`CLAUDE.md`), maar deed er per
  05-08-2026 twee: `POST /api/sync/activities` en `POST /api/sync/wellness`. Het zijn de
  sync-calls die de app bij ELKE pageload doet, dus dezelfde schrijfactie die het openen van de
  app uitlokt — maar de belofte klopt zo niet. Of de prod-modus onderdrukt die twee, of de
  belofte wordt bijgesteld naar wat hij werkelijk waarmaakt.

- AFGEHANDELD 05-08-2026 — DE HARNESS EET ZIJN EIGEN VORIGE METING OP. Er was ÉÉN uitvoerpad voor
  een lokale én een prod-run, en dat pad werd bij elke run geleegd; draaide je lokaal na een
  prod-run, dan was de prod-uitvoer weg. GEVOLG, DRIE KEER GEZIEN: bij punt 26, punt 27 en punt 13
  fase A bestond er geen prod-uitvoer van vóór de deploy, dus kon de sterkste bewijsvorm — een
  byte-vergelijking voor en na op prod — geen van die keren gedraaid worden.
  GELAND IN PUNT 31, en ruimer dan hier stond: niet alleen een eigen pad per modus (`out/` en
  `out-prod/`), maar ook ROTATIE op een marker, zodat de vorige COMPLETE run bewaard blijft
  zonder dat een prompt eraan hoeft te denken. Zie punt 31 voor de verificatie.

- DE SHOT-HARNESS LAADT UITSLUITEND `/schema`. Er is geen scenario voor de Niveau-tab en geen voor
  Instellingen, dus wat daar staat is per constructie niet te fotograferen. KOSTEN GEMETEN op
  2026-08-02: het aannames-paneel op de Niveau-tab kon niet dichtklappen — `hidden` naast een
  inline `display` — en dat overleefde 897 tests en 8 prod-shots. `apps/web` heeft bovendien geen
  render-testinfrastructuur, want `@testing-library` ontbreekt, dus er viel voor dat defect ook
  geen rood-test te schrijven. Daans oog was het enige instrument dat erbij kon.

- DE SHOT-HARNESS IS BLIND VOOR FASE PEAK. De klim-doelen zijn dat NIET meer: `klim-kort` bestaat
  sinds `a15bcbb` en `klim-weekstem` sinds `b57d464`, en die laatste is het EERSTE scenario dat een
  klim-doel met een `dagOffset` combineert. Wat wel blind blijft is fase PEAK: geen enkel scenario
  draagt een blokweek die daarop valt, dus alles wat in Peak anders loopt — het quotum, de
  poortset, de taper-overlay — is visueel onverifieerd.
  LET OP HOE DIT ITEM DREEF, want dat is de eigenlijke les. Er stond hier tot 04-08-2026:
  "`tools/shots/shot.mjs:267` seedt doel `FTP`, en er is geen enkel scenario voor een klim-doel".
  Die zin werd ONWAAR bij `a15bcbb` en is daarna nog twee dagen meegekopieerd in de
  OPENSTAAND-lijsten van drie STAND-blokken, omdat een parkeerlijst-item bij het overzetten
  wordt overgenomen en niet opnieuw getoetst. Een regel die je kopieert, hoort te worden gegrept.
