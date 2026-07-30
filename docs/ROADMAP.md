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
7. **De doel-lijst klopt niet** — open · ENGINE. (`DOELEN-SPEC` §6 stap 3.) `DOEL_OPTIONS`
   (`phase.ts:12`) draagt nog VO2max en één `Beklimmingen`. GEMETEN: `climbTypeWorkout_`
   (`planner.ts:1051`) is sinds punt 1 in de praktijk onbereikbaar — hij staat in
   `keyIntensity` (`planner.ts:995`) achter `goalWorkout_`, en die levert sinds de fallback
   altijd een kandidaat. CRITERIUM: VO2max eruit, Beklimmingen gesplitst in kort en lang, twee
   profielen, dode tak opgeruimd. HARDE DATUM: half februari 2027.
8. **De meetlat kent maar twee doelen** — open · ENGINE. `activeGoalProfile_`
   (`niveau.ts:629`) geeft FTP het ftp-profiel en élk ander doel het girona-EVENT-profiel; dat
   label staat letterlijk in de Niveau-tab. Bijt bij de winterwissel naar Onderhoud en opnieuw
   bij korte beklimmingen. Reist met punt 7.
9. **Het doel stuurt de periodisering niet** — open · ENGINE. GEMETEN met AGR op 17-04-2027,
   identiek voor doel FTP, Onderhoud en Beklimmingen: Base t/m 2027-02-15, Build vanaf
   2027-02-22, Peak vanaf 2027-03-22, Taper vanaf 2027-04-12. De fase komt volledig uit de
   event-teller. Wat het doel wél stuurt is het quotum binnen die fase (Base: FTP 3, Onderhoud
   3, Beklimmingen 2). Inclusief EVENT als doel-optie, zodat de overname een keuze is in
   plaats van een aftelling. CRITERIUM: het doel stuurt de fase, en de event-overname is een
   VOORSTEL. Raakt `DOELEN-SPEC`.
10. **Twee kaarten spreken los over hetzelfde blok** — open · CLIENT. (`DOELEN-SPEC` §6 stap
    7.) De doortrain-kaart en de terugblik lezen hetzelfde ΔCTL-signaal en doen er elk een
    eigen uitspraak over. CRITERIUM: een blok krijgt ÉÉN uitspraak, niet twee. DIT PUNT DRAAGT
    SINDS 5c OOK DE WEEK-TEKORT-VRAAG: wat de coach zegt als een week zijn dosis niet levert.
    Die stem is er nu niet — de losse inhaal-kaart is opgeruimd omdat hij niet kon verschijnen
    en, waar hij wél beet, een lichtere week voorstelde. Voorwaarde voor de nieuwe vorm: het
    tekort wordt PER ZONE geteld, in de munt van punt 6, niet in de 3-bucket-vouwing die
    tempo van drempel niet kan onderscheiden. `DOELEN-SPEC` §2A rekent de inhaal-kaart al tot
    de uitingen van de weeklus, dus dit is geen uitbreiding maar het inlossen daarvan.
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

## De tijdslijn

De seizoenskalender uit `DOELEN-SPEC.md` §5, naast de reeks gelegd.

- **Nu tot december 2026** — geen harde datum. Dit is de goedkope bouwtijd.
- **December 2026, doel Onderhoud — GEEN BLOKKADE, gemeten.** Met AGR in de agenda staat de
  fase in december op Base, `PROFILES.onderhoud` draagt quotum 3 in élke fase met
  `mesoCyclus: false`, en `effectiveMesoWeek_` pint de mesoweek op 1. Dat is exact wat
  `DOELEN-SPEC` §3.2 voorschrijft. Een eerder STAND-blok noemde december de eerste harde datum
  omdat het ingestelde doel de fase niet stuurt; dat laatste klopt (punt 9), maar het levert in
  december geen defect op — de event-fase staat daar toch al op Base. Wat in de winter wél
  bijt is punt 8: doel Onderhoud meet zich tegen het girona-profiel.
- **Half februari 2027 — DE EERSTE HARDE DATUM.** Op 2027-02-22 zet de event-as de fase op
  Build, en §5 laat het doel dan wisselen naar korte beklimmingen. Dat doel bestaat niet (punt
  7) en de bijbehorende meetlat evenmin (punt 8). Die twee moeten vóór die datum af, samen met
  punt 9 dat bepaalt hoe de overname gebeurt.
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

- `GET /api/checkin/:datum` GEEFT 404 bij afwezigheid, terwijl de huisregel elders 200 met
  `null` of een lege lijst is (`/api/settings`, `/api/planner/:monday`). Cosmetisch — de client
  vangt het op — maar het is inconsistentie, en het vult de console bij elke `/schema`-load.
  De request-telling uit de harness verklaart de drie aanroepen: StrictMode-dubbelinvoke plus
  één her-derive na de sync. Geen lek.
- UP-fixture in `Preview.tsx` realistischer maken.
- Weken-terug-scrollen in de Schema-tab.
- De weekreeks-fixture staat op drie plekken.
- PENDEL-BUG — de tweede rit verdwijnt uit de dagdetail. GEZIEN op 30 juli op prod. De dagdetail
  schakelt op één `done`-vlag PER DAG: zodra er één activiteit binnenkomt rendert de hele dag als
  voltooid en wordt de resterende geplande sessie niet meer getekend. De pendeldag is de enige dag
  met twee ritten en dus de enige plek waar het zichtbaar wordt. Het plan zelf is intact — de
  weekkaart telt beide ritten nog. GEEN regressie van de zone-sync: `SchemaView.tsx` is voor het
  laatst geraakt in `330f522`, ruim vóór die reeks. Te verifiëren bij de recon: stuurt "Push naar
  Garmin" de terugrit wél mee (die leest uit het plan, niet uit deze weergave)?
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
