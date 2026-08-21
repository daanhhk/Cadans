# Cadans — ARCHITECTUUR

De kaart van de app zoals hij NU staat. Bedoeld voor wie de code niet voor zich heeft maar er wel
over moet kunnen redeneren: welke laag waarvoor verantwoordelijk is, wat er per constructie niet
kan, en waar een ontwerpvoorstel op stuk loopt als je die grens niet kent.

Bestands- en functienamen staan erin; regelnummers niet — die verschuiven bij de eerstvolgende
commit en dan liegt dit document. Procesregels, bewijslast en lessen staan hier evenmin: die wonen
in `docs/WERKWIJZE.md`, `docs/WERKWIJZE-LESSEN.md`, `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` en
`docs/CC-CHECKS.md`.

## 1. De lagen

**`packages/engine` — de trainingsleer.** Een pure TypeScript-port van de bevroren Apps-Script-app.
Hij kiest per dag een workout-TYPE (`assignWorkouts` in `planner.ts`), verdeelt het week-quotum over
de trainbare dagen (`allocateQualityWeek_`), rekent de periodisering (`computeMacroPhase` en
`eventFase_` in `phase.ts`, `effectiveMacroFase_` in `planner.ts`), rendert sessie-inhoud
(`renderVariant_` in `planner.ts`, `expandArchetype_` in `archetypes.ts`), draagt de zone- en
TSS-boekhouding (`zones.ts`) en levert het coach-oordeel per dag (`coachFeedback_` in `coach.ts`).

Wat hij NIET doet: enige vorm van I/O. Geen fetch, geen D1, geen storage. De hele `src` importeert
buiten zijn eigen modules helemaal niets — zelfs `@cadans/shared` niet. Hij bouwt de weekstructuur
ook niet: welke dagen trainbaar zijn, hoeveel minuten er beschikbaar zijn en welk dagtype een dag
draagt, komt volledig als invoer binnen. En hij weet nooit welke dag het vandaag is: `today`,
`todayISO` en `weekMonday` worden altijd ingegeven.

**`workers/api` — opslag en koerier.** Een Cloudflare Worker met Hono en Drizzle op D1. Hij draagt
de HTTP-API onder `/api` (`routes/api.ts`), de persistentie (`db/schema.ts`, `db/repo.ts`), de
enige datum-conversielaag tussen D1 en de engine (`db/dates.ts`), de intervals.icu-koppeling in
beide richtingen (`integrations/`), de basic-auth-poort en het serveren van de gebouwde PWA via de
ASSETS-binding.

Wat hij NIET doet: plannen. Er staat in `workers/api/src` geen enkele aanroep van `buildWorkout` of
`assignWorkouts`. Uit de engine gebruikt hij alleen losse pure functies — `formatDate`,
`gatherWeekplanEntries_`, `activityToRow_`, `pcNormalize_`, de push-helpers en een paar constanten
voor validatie. Er is ook geen `proposal`-tabel: voorstellen zijn vluchtig en worden bewust niet
bewaard.

**`apps/web` — orkestratie, meetlat en scherm.** Een Vite/React-PWA. Hij bouwt de invoer voor de
engine en roept hem aan (`lib/proposal.ts`), assembleert alle bronnen tot één weekbeeld
(`lib/schema.ts`), draagt de meetlat en het oordeel over uitvoering (`lib/blok.ts`,
`lib/zonemunt.ts`, `lib/zonelabels.ts`, `lib/weektekort.ts`), serialiseert het plan-van-record
(`lib/weekplanBlob.ts`) en doet alle IO (`lib/api.ts`).

Wat hij NIET doet: trainingsleer. Geen archetypes, geen watt-targets, geen TSS-berekening, geen
fase-cyclus. En hij beslist niet wat er met het verleden gebeurt — dat doet de worker.

**`packages/shared`** is een types-barrel voor de grens tussen worker en client, met `noEmit` en
zonder build. Er staat precies één runtime-waarde in. Gedrag kan er dus niet wonen.

## 2. De grenzen

Dit zijn de grenzen die een ontwerpvoorstel ongeldig maken als je ze niet kent.

**De engine importeert niets en wordt door niemand teruggeimporteerd.** `packages/engine/src`
heeft nul externe imports. `apps/web` en `workers/api` importeren niet van elkaar. Er is geen
tooling die dit handhaaft — geen import-restricties in `biome.json`, geen project references — dus
het is conventie plus de harde regel dat de engine bron van waarheid is.

**`@cadans/engine` resolveert naar de BRON, niet naar een dist.** De exports-map in
`packages/engine/package.json` wijst `.` naar `src/index.ts`. Een gebouwde `dist` bestaat wel, maar
consumenten lezen hem niet. Een wijziging in de engine werkt dus onmiddellijk door, zonder build.

**De engine produceert geen blokken.** `assignWorkouts` zet per dag uitsluitend `voorgesteldType`,
`reden`, `redenCode`, `archetypeId` en `prikkelSprints` — hij muteert de dag-array in-place en
retourneert `void`. De blokken ontstaan pas stroomafwaarts, in `renderVariant_`, in
`expandArchetype_` en in de vaste bouwers. Wie een sessie-inhoud wil wijzigen op de plek waar het
TYPE valt, bouwt op een functie die geen blokken kent.

**Gedrag dat de client aan de engine MEEGEEFT, produceert de engine niet zelf.** `buildWorkout` en
`renderVariant_` dragen optionele termen die vanuit `apps/web/src/lib/proposal.ts` worden
doorgegeven: `dosisTrede` en `prikkelSprints`. Op het niveau van `buildWeekProposal` bestaan
daarnaast `mesoWeekOverride` en `prikkelUit`. Weggelaten zijn ze byte-identiek aan hun afwezigheid.
De keten loopt dus engine → client → engine, en wie hem alleen in `packages/engine` zoekt, vindt
hem niet.

**D1 kent geen datum-type.** Alles is TEXT. `workers/api/src/db/dates.ts` is de ENIGE conversielaag
en spiegelt de engine exact: `fromD1` maakt een Date op lokale middernacht, `toD1Date` en
`toD1DateTime` schrijven canonieke tekst via de engine-`formatDate`. Vergelijkingen in D1 zijn
daarmee lexicografisch op string. Activiteiten staan als datetime opgeslagen, alle andere tabellen
als kale dag — een filter dat een kale dag tegen een datetime legt, sluit die dag per constructie
uit.

**De weekallocator dateert zich op de AMBIENT systeemklok, en dat is de enige plek waar de engine
dat doet.** `assignWorkouts` bepaalt zijn peildatum met `stripTime_(new Date())` en geeft die door
aan `allocateQualityWeek_`; die gebruikt hem om te bepalen welke dagen nog te plannen zijn. Ligt de
week in het VERLEDEN, dan is geen enkele dag meer eligible, levert de allocator een leeg plan en
staan alle rollen op null — de hele weekbrede laag is dan stil inert, zonder foutmelding. Een
fixture of meetopstelling met een week in het verleden meet die laag dus niet, en leest nul waar het
mechanisme wél leeft. Wie op de allocator-rollen poort, poort op iets dat in zo'n week leeg is.
Overal elders in de engine komt de datum als parameter binnen.

**Alles hangt aan een gepinde tijdzone.** De engine formatteert met lokale getters; de correctheid
leunt op `TZ=Europe/Amsterdam`. Het root-testscript zet die pin via `cross-env`. Een gedeployde
Worker draait UTC; dat verschil staat als openstaande schuld en niet als opgelost.

**Eén gebruiker, per constructie.** Elke repo-functie neemt een `userId`, maar de routes geven
altijd dezelfde vaste id door. Multi-user is een auth-fase, geen schemawijziging.

**`sync_state` is één rij waarop meerdere onafhankelijke features samenwonen.** Elke schrijffunctie
raakt daarom alleen haar eigen kolommen; een volledige rij-write zou de rest wissen.

**De client kan alleen lezen wat de engine emit.** Wat niet op een blok of workout staat, is niet
te reconstrueren. De render-vorm van een sessie heeft `pctLo`, `pctHi` en `zone` al weggevouwen;
daarom bestaan de rauwe blokken alleen op het voorstel-object en leest `rauweBlokkenVan_` in
`lib/zonelabels.ts` ze daar op.

**Twee zone-rasters naast elkaar, en dat is bewust.** LABELS liggen op het engine-raster van
`pctZoneBucket_` (`zones.ts`): onder 56 procent FTP rust, tot en met 75 z2, tot en met 90 tempo, tot
en met 105 drempel, daarboven anaeroob. MINUTEN liggen op de zonegrenzen van de renner, die
`planZone5_` in `lib/zonemunt.ts` gebruikt en die uit intervals komen — standaard 55, 75, 90 en 105.
Poort en meting delen dus nooit exact dezelfde indeling.

## 3. De keten van een weekvoorstel

`pages/Schema.tsx` roept `loadSchemaWeek` in `lib/schema.ts` aan. Dat is het enige assemblagepunt.

`loadSchemaWeek` haalt via `lib/schemaLoad.ts` alle bronnen parallel op — instellingen,
planner-dagen, events, activiteiten, wellness, rpe, check-ins, de bewaarde weekplannen en de
sync-state — elk met een label, zodat een val te benoemen is. Het weekvenster staat vast op de
maandag van de huidige week; er is geen weekkiezer.

Die bronnen gaan naar `buildWeekProposal` in `lib/proposal.ts`. Die bouwt de datum- en
fase-context, bepaalt de mesoweek, leidt dekking en schuld af, en zet het dag-grid neer: per dag of
hij traint, hoeveel minuten, en welk dagtype. Vervolgens roept hij `assignWorkouts` aan, die dat
grid in-place van een type voorziet, en daarna per dag en per sessie `buildWorkout` — met
`archetypeId`, `dagIdx`, de pendel-richting, `dosisTrede` en `prikkelSprints` erbij.

`buildWorkout` in `planner.ts` is de router: een archetype-id wint, daarna taper-vormen, daarna de
variant-pools via `getPool_` en `selectVariant_`, daarna de legacy-klimvormen, en als vangnet een
herstelrit. Waar een variant wint, rendert `renderVariant_` de sessie: warmup, core-blokken,
endurance-fill, eventueel de sprintset, cooldown. Waar een archetype wint, doet `expandArchetype_`
hetzelfde vanuit een archetype-record. Beide leveren `structuur`, `blokken`, `intent` en `tss`.

Het resultaat is een voorstel-week. `lib/weekplanBlob.ts` serialiseert die met
`buildWeekplanEntries` naar de bewaarde entry-vorm, en `persistWeekplan` in `lib/schema.ts` schrijft
hem fire-and-forget weg via `PUT /api/weekplan/:monday`, met de lokale `todayISO` erbij. De worker
beslist dan met `weekplanFreeze.ts` wat van het verleden bevroren blijft.

Diezelfde bewaarde entries komen er bij de volgende bouw weer IN, en dat is dragend: ze voeden de
cross-week variant-rotatie via `recencyFromWeekplan_`, en ze zijn de bron van de normpoort en de
plan-minuten in `lib/blok.ts`. De huidige week wordt daarbij weggefilterd, anders leest de seed zijn
eigen zojuist weggeschreven uitvoer terug.

Tot slot maakt `deriveSchemaView` in `lib/schema.ts` het view-model: sessies, gedane ritten, de
vergelijking tussen plan en rit, en de Nederlandse labels. Componenten renderen alleen.

## 4. Wat de app kan zien en meten

**De GEPLANDE kant** komt uit het voorstel en uit de bewaarde weekplan-entries. Elke entry draagt
datum, type, archetype- en variant-id, naam, zones, intent, blokken, structuur, TSS en minuten.
Daaruit komen zowel de norm als de poortset: `planZonesVoorWeek_` telt de plan-minuten per zone en
`poortsetVoorWeek_` bepaalt welke werkzones die week beoordeeld worden — beide in `lib/blok.ts`,
met `werkzoneLabelsVan_` uit `lib/zonelabels.ts` als labelbron.

**De GELEVERDE kant** komt uitsluitend van intervals.icu. `POST /api/sync/activities` haalt de
ritten op; per rit komen de zonetijden mee als `icu_zone_times`, plus de zone-grenzen van de renner
als `icu_power_zones`. Wellness en power-curve hebben hun eigen sync-routes. Er is geen andere bron
en geen handmatige invoer van gereden tijd.

**Wat per constructie NIET zichtbaar is.** Er is geen schrijfroute voor activiteiten: gereden tijd
kan alleen via intervals binnenkomen. Er is geen historie-scherm en geen vrije weeknavigatie. Zonder
gedeclareerde weekuren is er geen norm en dus geen oordeel. Zonder eigen bewaard weekplan voor een
week telt die week niet mee. Ritten zonder zonetijden, of met te weinig zonedekking, vallen uit — en
onder twee beoordeelbare weken zwijgt de blok-terugblik helemaal. Dat zwijgen is een ontwerpkeuze:
liever geen uitspraak dan een gegokte.

Verder staat de plan-adaptatie uit. Daardoor zijn de rollende dekking, de zone-schuld en de
inhaal-takken structureel leeg gevoed: de code staat er en beslist niets.

## 5. Wat het meetgereedschap kan en niet kan

**De shot-harness** (`tools/shots/shot.mjs`) zaait de lokale D1 via de API, pint de browserklok en
schiet de schermen weg als PNG met een `.txt` ernaast. Hij bewaakt dat de meting geldig is — pagina
geladen, animaties uit, PNG niet gekapt — maar OORDEELT niet over de inhoud; dat doet de lezer.
Zijn harde grens: hij zaait alleen de VOORUIT-kant. Instellingen, events en planner-beschikbaarheid
gaan erin, weekplan-rijen worden gewist, maar er komt geen enkele activiteit, wellness-rij of rpe
in. Elke verstreken dag in een scenario is daarmee ongereden, en "gereden zoals gepland" is voor de
harness onbereikbaar. Tegen prod draait hij read-only en zaait hij niets.

**De vergelijker** (`tools/shots/vergelijk.mjs`) bewijst byte-identiteit of het ontbreken daarvan,
meer niet. Identieke bytes zijn geen bewijs van correctheid en verschillende bytes geen bewijs van
een regressie. Zijn innerText-kolom scheidt twee families: gelijke tekst met andere bytes tegenover
verschillende tekst. Hij is geen poort en sluit zelf niets uit.

**`tools/punt16/meet.mjs`** bundelt vijf modules uit `apps/web/src/lib` met de engine eronder en
rekent de plan-en-oordeel-keten door over een vaste meetruimte. Hij ijkt zichzelf eerst op de
weekvorm-as en stopt als die reeks in zijn bron is herijkt. Zijn bereik is de CLIENT-laag: geen
Worker, geen D1, geen HTTP, geen React.

**`tools/audit`** vergelijkt de huidige code met de bevroren Apps-Script-bron en vereist die tweede
repo op schijf. Hij is geen rechter — "identiek" is geen kwaliteitsoordeel — en hangt bewust niet
aan CI.

**De testsuite** kent vijf projecten: `engine` en `api-unit` op de node-pool, `api-integration` op
miniflare tegen een lokale D1, `web` op node en `web-render` op jsdom. De scheiding tussen die
laatste twee loopt over de EXTENSIE: `.test.ts` gaat naar node, `.test.tsx` naar jsdom. Alleen de
root draait alle vijf. CI draait lint, typecheck, test en build en verder niets uit `tools`.

**Remote D1** is approval-gated en wordt in een normale ronde niet aangeraakt.

## 6. Waar welk soort besluit valt

**Coach-norm — `docs/TRAININGSMODEL.md`.** Wat trainingskundig hoort te gebeuren: dosis, frequentie,
karakter, herstel. Elke regel draagt zijn herkomst (literatuur, meting of een besluit van Daan). Dit
document gaat vóór `DOELEN-SPEC` bij tegenspraak.

**Doel-invulling — `docs/DOELEN-SPEC.md`.** Welke doelen bestaan, wat een doel betekent en welke
profiel-invulling erbij hoort. Vastgestelde besluiten; ze worden niet heropend.

**Werkwijze — `docs/WERKWIJZE.md`, met de lessen in `docs/WERKWIJZE-LESSEN.md` en
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` en de omgezette controles in `docs/CC-CHECKS.md`.** Hoe er
gewerkt, gemeten en bewezen wordt. De norm wint bij tegenspraak; de lessen dragen de bewijslast
waarop die norm rust.

**Projectstand — `HANDOFF.md`, met de reeks en de volgorde in `docs/ROADMAP.md`.** Wat er af is, wat
er open staat, wat er gemeten is en wat de volgende ronde doet.

**Architectuur — dit document.** Lagen, grenzen en ketens. Wat hier staat is het HEDEN: verandert de
structuur, dan verandert dit document mee. Historie hoort in `HANDOFF.md`, niet hier.

<!-- EINDE docs/ARCHITECTUUR.md -->
