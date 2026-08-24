# Cadans — PROD-STAND

**Wat staat er op REMOTE?** Dit is het lopende logboek van de productie-omgeving: welke migraties
remote D1 draagt, of de Worker gedeployd is en op welke versie, en wat elke ronde daaraan verandert.

**WAAROM DIT EEN EIGEN DOCUMENT IS en geen bijlage bij een bouwdoc.** "Wat staat er op prod" is
precies het soort feit dat verdampt. Tot 23-08-2026 stond het nergens: de bouwdocumenten beschrijven
wat er GEBOUWD is, de HANDOFF beschrijft waar het WERK staat, en geen van beide zegt wat de
gebruiker vandaag draait. Dat verschil is deze ronde voor het eerst opgeschreven — en het bleek
groter dan verwacht (zie de datum van de live Worker hieronder).

**TWEE GOEDKEURINGEN, NIET ÉÉN.** Een REMOTE MIGRATIE en een WORKER-DEPLOY zijn aparte handelingen
met een ander risico en ze horen apart te worden goedgekeurd. Een additieve migratie (`ALTER TABLE
… ADD`) is het veiligste geval dat er is — oude code ziet de kolom niet — terwijl een deploy de
volledige draaiende applicatie vervangt. Zie `docs/WERKWIJZE.md`, *Migraties en deploys*.

---

## De stand van vandaag

| wat | waarde |
| --- | --- |
| D1-database | `cadans` |
| migraties toegepast | **0000 t/m 0012**, dertien stuks, geen gaten |
| laatste migratie | `0012_acoustic_living_mummy.sql`, toegepast `2026-08-23 17:17:43` (D1-klok, UTC) |
| openstaande migraties | **geen** |
| Worker gedeployd | **JA** |
| live versie | `e994c768-3d73-4aec-876b-b614b7fe1302` |
| live sinds | `2026-08-10T13:19:32.453Z` |
| live COMMIT | **niet gemeten** — afgeleid als `95751a10f1fddeacce7ab77a6b0bb295cc875352`, zie hieronder |
| deployments totaal | **minimaal 10, totaal niet gemeten** — zie hieronder |
| Worker loopt achter op main | **JA, en fors** — zie hieronder |

> Bovenstaande tabel is de enige plek in de repo waar deze feiten staan. Werk hem bij in DEZELFDE
> ronde waarin je er iets aan verandert; een stand die een ronde later wordt bijgewerkt is een stand
> waarop niemand kan bouwen.

**TWEE GETALLEN IN DIE TABEL ZIJN GEEN METING, en dat is in de verificatiepas boven water gekomen
nadat ik ze eerst wél als meting had opgeschreven.**

- **"deployments totaal" is een PAGINEERGRENS.** `npx wrangler deployments list --help` zegt op
  wrangler 4.106.0 verbatim: *"Displays the 10 most recent deployments of your Worker"*, en er is
  geen limit- of page-vlag. Precies tien regels terugkrijgen betekent dus "ten minste tien", niet
  "tien". `wrangler versions list` kapt op dezelfde tien af. Wie het echte aantal wil, moet de API
  aanspreken; dat is niet gedaan.
- **De live COMMIT is AFGELEID, niet afgelezen.** Wrangler geeft een versie-id en een tijdstip,
  geen commit. `95751a1` is de laatste commit vóór `2026-08-10T13:19:32.453Z`; de twee commits
  daarna (15:37 en 15:52 lokaal) vielen erbuiten. Een deploy vanuit een vuile werkboom is hiermee
  niet uit te sluiten. **Dat elke deploy zijn commit noteert, staat niet voor niets onderaan dit
  document in de bijwerk-lijst — deze eerste regel voldoet er zelf niet aan, en dat is de reden dat
  de eis er staat.**

**DE WORKER LOOPT VER ACHTER, en dat is een GEMETEN vondst van deze ronde.** De live versie dateert
van 10-08-2026. Alles wat sinds die datum is gebouwd — het hele punt-47-blok, de ijking, de drie
uitgangen, de doel-kolom — draait NIET op prod. Dat is geen defect maar het was ook nergens
opgeschreven, en het verandert hoe je de tabel hierboven leest: het SCHEMA is bij, de CODE niet.

**DAT IS OOK PRECIES WAAROM DE MIGRATIE VEILIG WAS, en dat is gemeten en niet aangenomen.** De
commit die op `main` stond ten tijde van de deploy is `95751a10f1fddeacce7ab77a6b0bb295cc875352`
(10-08-2026 11:55). Op die bron gemeten:

- **0** verwijzingen naar `ijking_` — let op het LIGGEND STREEPJE. Mijn eerste versie schreef hier
  "0 verwijzingen naar `ijking`", en dat is als meting ONJUIST: `git grep -ni "ijking" 95751a1 --
  workers/api` geeft **3** treffers, alle drie substrings binnen de Nederlandse woorden
  *afwijking* en *vergelijking*. Wie de meting herhaalt zoals zij eerst was opgeschreven,
  concludeert het tegendeel. Met het patroon `ijking_` is het 0 — en het STERKERE feit eronder:
  `git log -S"ijking_"` laat zien dat die string pas op **2026-08-23** in de repo verschijnt, dus
  GEEN ENKELE commit van vóór 11-08-2026 kan hem dragen, welke commit er ook live staat;
- **0** voorkomens van `SELECT *` in `workers/api/src/db/repo.ts`;
- **0** rauwe `INSERT INTO`-statements, dus geen positionele writes;
- alle vijf de `sync_state`-leesacties gebruiken `.select({ … })` **mét** een expliciete
  kolomlijst.

Dat laatste is de sterkste vorm van veilig: de live code kan geen enkele kolom zien die zij niet
zelf bij naam noemt, of die kolom nu `ijking_doel` heet of iets anders. Een `ADD COLUMN` is voor
haar per constructie onzichtbaar — niet omdat zij deze drie kolommen toevallig niet kent, maar
omdat haar querystijl geen ongenoemde kolommen kán raken.

**EEN BEPERKING DIE ERBIJ HOORT:** dit is gemeten op de commit die op `main` stond op het moment
van de deploy, niet op de bundel die daadwerkelijk is geüpload. Die twee horen gelijk te zijn en er
is geen aanwijzing dat ze dat niet zijn, maar het is een AFLEIDING en geen aflezing van de live
Worker zelf.

---

## Logboek

### 23-08-2026 — migraties 0011 en 0012 toegepast op remote D1

**BESLUIT (Daan):** de twee opgespaarde migraties gaan nu naar remote D1, en dat wordt staand
beleid — elke ronde die een migratie toevoegt, past hem in diezelfde ronde toe. GROND: migraties
opsparen maakt de uiteindelijke toepassing riskanter en niet veiliger, en additieve kolommen zijn
het veiligste geval.

**GEEN WORKER-DEPLOY.** Bewust niet, en de grond staat in `docs/ARCHITECTUUR.md`: de engine
formatteert met lokale getters en leunt op `TZ=Europe/Amsterdam`, terwijl een gedeployde Worker UTC
draait; `workers/api/src/db/dates.ts` is de enige conversielaag en spiegelt die aanname. Die schuld
is niet opgelost, en deployen zonder haar te adresseren is een gok op de datumlaag. Vastgelegd als
ROADMAP-punt dat VOORAF gaat aan elke worker-deploy.

#### De gemeten VÓÓR-staat

Alles hieronder is gelezen van REMOTE (`--remote`) en vastgelegd VÓÓRDAT er iets is toegepast; de
rij-inhoud staat in de scratchpad als `prod-syncstate-VOOR.json`.

```
d1_migrations : 11 rijen, 0000 t/m 0010, aaneengesloten
  1  0000_redundant_maginty.sql          2026-07-07 20:06:05
  …
 11  0010_uneven_scarlet_spider.sql      2026-08-04 11:00:44
openstaand    : 0011_handy_the_hunter.sql, 0012_acoustic_living_mummy.sql
lokale bestanden in workers/api/drizzle : 13
sync_state    : 18 kolommen, GEEN ijking_*
sync_state    : 1 rij (user_id 1)
                niet-null: dosis_trede 0 · dosis_trede_blok "2026-07-27" ·
                           dosis_trede_doel "FTP" ·
                           power_zones_json "[55,75,90,105,120,150,999]"
                null: last_sync, meso_week, load_carry, ftp_last_sync, weight_last_sync,
                      debt_opt_in_week, fatigue_shift_week, fatigue_shift_dir,
                      event_overname_event, event_overname_blok, event_overname_antwoord,
                      doel_passend_blok, doel_passend_doel
Worker        : gedeployd, versie e994c768-3d73-4aec-876b-b614b7fe1302,
                sinds 2026-08-10T13:19:32.453Z, 10 deployments
```

#### De drie verwachtingen

**W1 — HOUDT.** Remote D1 loopt exact twee migraties achter. `d1_migrations` draagt 11 rijen,
`0000` t/m `0010`, aaneengesloten en zonder gaten; `wrangler d1 migrations list --remote` noemt
precies `0011` en `0012` als openstaand; en `workers/api/drizzle` bevat 13 `.sql`-bestanden.
11 + 2 = 13, dus geen drift in welke richting dan ook.

**W2 — HOUDT.** Er staat geen rij met `ijking_blok` gevuld, en dat kán ook niet: de kolom BESTOND
niet vóór 0011. De ontbrekende backfill van 0012 kost daarom niets, en de backfill-schuld die ronde
6 noteerde is leeg gebleken.

> **DE GROND DIE IK ER EERST ONDER ZETTE WAS FOUT, en de verificatiepas ving hem.** Ik schreef dat
> 0011 en 0012 in ÉÉN handeling zijn toegepast, "dus er heeft nooit een venster bestaan waarin een
> rij onder 0011-alleen geschreven kon worden". Mijn eigen uitvoer weerspreekt dat: `Executed 3
> commands` gevolgd door `Executed 2 commands` zijn TWEE aparte D1-batches — 0011 als twee `ALTER`s
> plus zijn boekhoudregel, 0012 als één `ALTER` plus de zijne. Daartussen droeg de database wél
> degelijk `ijking_blok` en `ijking_antwoord` zónder `ijking_doel`. Het venster was subseconde, maar
> het bestond.
> **EN DE GELIJKE TIJDSTEMPEL BEWIJST NIETS**, want `applied_at` heeft SECONDE-granulariteit. Dat
> 0011 en 0012 allebei `17:17:43` dragen zegt niets over atomiciteit: in dezelfde tabel delen
> `0000_redundant_maginty.sql` en `0001_magical_lady_mastermind.sql` óók één seconde
> (`2026-07-07 20:06:05`), en dat waren aantoonbaar twee losse migraties.
> **DE CONCLUSIE BLIJFT, om een BETERE reden:** in dat venster kon niets schrijven, want geen
> gedeployde code kent de kolommen (zie hierboven). En zou er ooit tóch zo'n rij ontstaan, dan is
> die apart afgedekt in code — `apps/web/src/lib/testvoorstel.test.ts`, "een LEGACY-rij zonder doel
> onderdrukt niets": een rij met `ijking_blok` en zonder `ijking_doel` onderdrukt geen aanbod en
> valt naar de veilige kant.

**W3 — HOUDT.** Zuiver additief, gemeten door de vóór-snapshot tegen een verse remote-lezing te
leggen:

```
rij-aantal          VOOR 1   NA 1        gelijk
bestaande kolommen met een gewijzigde waarde : 0
kolommen erbij      : ijking_blok, ijking_antwoord, ijking_doel  (exact de drie verwachte)
waarde van die drie : alle drie NULL
```

#### Wat er is toegepast, en met welk commando

Vanuit `workers/api`, uitsluitend via de migratie-route — **nooit met de hand SQL op prod-D1**:

```
npx wrangler d1 migrations apply cadans --remote
```

Uitvoer: `Executed 3 commands` gevolgd door `Executed 2 commands`, beide migraties op ✅. De drie
statements samen:

```
ALTER TABLE `sync_state` ADD `ijking_blok` text;
ALTER TABLE `sync_state` ADD `ijking_antwoord` text;
ALTER TABLE `sync_state` ADD `ijking_doel` text;
```

**DE BEVESTIGINGSVRAAG IS NIET OMZEILD.** Wrangler stelde hem — *"About to apply 2 migration(s) …
continue?"* — en beantwoordde hem zelf met `Using fallback value in non-interactive context: yes`,
omdat deze shell geen TTY is. Dat is wrangler's eigen gedrag en geen vlag die ik heb meegegeven.
Wie dit strakker wil, moet het aan de wrangler-kant afdwingen; er is hier geen `--yes` gebruikt.

#### De NA-verificatie

```
wrangler d1 migrations list --remote : "No migrations to apply!"
d1_migrations                        : 13 rijen
  12  0011_handy_the_hunter.sql       2026-08-23 17:17:43
  13  0012_acoustic_living_mummy.sql  2026-08-23 17:17:43
sync_state                           : 21 kolommen, eindigend op
                                       ijking_blok, ijking_antwoord, ijking_doel
```

Het schema van `sync_state` op remote is daarmee gelijk aan wat `workers/api/src/db/schema.ts`
beschrijft.

> **DAT HET OOK GELIJK WAS AAN DE LOKALE MINIFLARE-DATABASE STOND HIER EERST, EN DAT WAS ONWAAR.**
> Zie de verificatiepas hieronder: de lokale D1 had 0011 en 0012 NOOIT toegepast gekregen. Dit
> toepassen op remote liet remote en lokaal juist UITEENLOPEN. Rechtgezet in dezelfde ronde — zie
> "De lokale reparatie" hieronder.

#### PROD WAS NIET STIL, en dat is niet afgewogen

Gemeten ná afloop, en het hoort hier te staan omdat het VOORAF had moeten worden gewogen: de live
Worker schreef op DEZELFDE kalenderdag als de migratie naar remote D1.

```
wellness            MAX(datum)       = 2026-08-23
power_curve_cache   MAX(fetched_on)  = 2026-08-23
migratie toegepast                   = 2026-08-23 17:17:43 UTC
activities          MAX(datum)       = 2026-08-04T15:15:22   (Daan fietst niet, geen defect)
```

`fetched_on` en `datum` dragen alleen een DAG, dus of die schrijfacties vóór of ná 17:17:43 vielen
is **niet vast te stellen** — niet gemeten, en achteraf ook niet meer meetbaar.

**WAT DIT WEL EN NIET BETEKENT.** `ALTER TABLE … ADD COLUMN` is in SQLite metadata-only en herschrijft
de tabel niet, dus het risico was verwaarloosbaar en er is aantoonbaar niets misgegaan. Maar er is
geen onderhoudsvenster gekozen, geen leespauze genomen, en geen herstelpunt vastgelegd — en dat is
niet afgewogen, het is er simpelweg niet bij stilgestaan. **Voor een minder additieve migratie is
dat wél het verschil**, en de volgende ronde die iets zwaarders doet dan `ADD COLUMN` hoort eerst
een herstelpunt te noteren (D1 Time Travel) en het moment te kiezen.

---

## De lokale reparatie — het echte defect dat de verificatiepas vond

**DE LOKALE DEV-DATABASE LIEP TWEE MIGRATIES ACHTER, en dat was al zo vóór deze ronde.** Gemeten:
`wrangler d1 migrations list cadans --local` noemde `0011` en `0012` als openstaand, en
`SELECT ijking_blok FROM sync_state --local` gaf verbatim
`no such column: ijking_blok at offset 7: SQLITE_ERROR`.

**WAT DAT BETEKENDE.** `wrangler dev --port 8787` en `tools/shots/shot.mjs` praten met díe
persistente lokale D1. `GET`/`PUT /api/ijking` faalde daar dus, en dat is de hele drager van punt 59
en punt 64 — twee rondes lang gebouwd tegen een dev-omgeving waarin de routes niet konden werken.

**WAAROM DE POORT DIT NOOIT ROOD MAAKTE.** `workers/api/vitest.config.ts` draait
`readD1Migrations` over `./drizzle` en past ALLE dertien migraties toe op een VERSE D1 per run. De
suite ziet dus altijd het volledige schema, ongeacht wat de persistente lokale database draagt. De
gate kan groen staan terwijl de dev-omgeving stuk is, en dat is precies wat er gebeurde.

**GEREPAREERD** met `pnpm db:migrate:local` vanuit `workers/api`. Na afloop: lokaal 0 openstaand,
remote 0 openstaand, en `sync_state` draagt aan BEIDE kanten **21 kolommen**. De ijking-query slaagt
lokaal en geeft `{"ijking_blok":null,"ijking_doel":null,"ijking_antwoord":null}`.

**LES VOOR HET STAANDE BELEID:** een migratie toepassen is niet één handeling maar TWEE —
`--local` én `--remote`. De lokale kant heeft geen goedkeuring nodig en hoort in dezelfde beweging.

---

## De verificatiepas — één hoofdclaim, aangevallen

**HOOFDCLAIM:** *"remote D1 draagt nu hetzelfde schema als lokaal en er is niets verloren gegaan."*

**UITSLAG: de eerste helft is WEERLEGD, de tweede helft houdt.** Drie lenzen, twee met
`weerlegd: true`. Geen van de bevindingen raakte de remote database — daar is alles goed gegaan —
maar de claim waarmee ik dat opschreef was op twee punten onjuist en op een derde punt leeg. Alles
hieronder is door mij hermeten voordat ik het overnam.

**(a) Is de vóór-staat werkelijk VÓÓR vastgelegd, of achteraf gereconstrueerd?** Vóór, en dat is
niet alleen mijn volgorde-verhaal maar een GEMETEN feit met twee onafhankelijke klokken:

```
prod-syncstate-VOOR.json  geschreven : 2026-08-23T17:16:35.785Z   (bestandssysteem)
0011_handy_the_hunter.sql toegepast  : 2026-08-23 17:17:43        (D1-klok, UTC)
0012_acoustic_living_mummy.sql       : 2026-08-23 17:17:43        (D1-klok, UTC)
                                       verschil: 68 seconden
```

De snapshot is 68 seconden vóór het toepassen weggeschreven en daarna niet meer aangeraakt; de
NA-vergelijking leest hem terug van schijf. De volgorde in het transcript is dezelfde:
`migrations list --remote` → `d1_migrations` → `sqlite_master` → `SELECT * FROM sync_state`
wegschrijven → **pas daarna** `migrations apply`.

Een reconstructie was bovendien niet mogelijk geweest. Ná het toepassen bestaan de drie kolommen,
dus de waarneming "ze bestonden niet" is dan niet meer te doen — je kunt hooguit uit
`d1_migrations` AFLEIDEN dat ze er niet waren, en dat is een gevolgtrekking en geen meting.

**MAAR HET BESTAND ZELF IS CEREMONIE EN GEEN BEWIJS, en die correctie is scherp.** Omdat
`ADD COLUMN` per definitie geen bestaande waarde kán wijzigen, is "de na-staat minus de drie nieuwe
sleutels" NOODZAKELIJK gelijk aan de echte vóór-staat. Een lens reproduceerde het bestand daarmee
byte-voor-byte (521 bytes tegen 522, één afsluitende newline verschil). De INHOUD kan dus per
constructie niet falen en draagt geen informatie; alleen de mtime draagt nog iets, en dat is één
muteerbaar filesystem-attribuut zonder log of bewaarde wrangler-uitvoer ernaast. Het bestand mist
bovendien de `--json`-wrapper met `"served_by": "v3-prod"` — juist het enige veld dat zou aantonen
dat het ooit remote heeft gelezen.

**WAT "NIETS VERLOREN" DAN WÉL DRAAGT: de DDL en `d1_migrations`, niet de snapshot.** De drie
statements zijn `ALTER TABLE sync_state ADD … text`, en `ADD COLUMN` kan geen rij wissen, geen
bestaande waarde wijzigen en geen andere tabel raken. Dat de kolommen er tevoren niet waren volgt
ONAFHANKELIJK uit `d1_migrations`: SQLite laat `ADD COLUMN` falen op een bestaande naam, dus een
geregistreerde geslaagde toepassing bewíjst de afwezigheid. Verwijder `prod-syncstate-VOOR.json` en
het bewijs wordt geen haar zwakker. **Voor een migratie die niet puur additief is, geldt dat niet —
dáár is een echte vóór-snapshot wél bewijs, en dan hoort de ruwe wrangler-uitvoer mee bewaard.**

**(b) Leest de verificatie de REMOTE database, of de lokale?** Remote. Elke lees- en
schrijfaanroep in deze ronde draagt `--remote`, en de uitvoer bevestigt dat per keer met
`Executing on remote database cadans (aa302c17-…)` plus de regel dat je de vlag moet WEGHALEN om
lokaal te werken.

> **DE GROND DIE IK ER EERST BIJ ZETTE WAS OMGEKEERD.** Ik schreef: "een lokale lezing zou een ander
> antwoord hebben gegeven: lokaal stonden 0011 en 0012 al toegepast vóór deze ronde". Precies
> andersom — lokaal stonden ze NIET toegepast. Op de VÓÓR-staat was er zelfs helemaal geen
> schema-onderscheid: beide kanten droegen dezelfde 18 kolommen en dezelfde 11 migratienamen. Wat
> de vóór-snapshot als remote herkenbaar maakt zijn drie DATAwaarden (`dosis_trede` 0,
> `dosis_trede_blok` `"2026-07-27"`, `dosis_trede_doel` `"FTP"`, alle drie lokaal NULL) — niet het
> schema.

**(c) Klopt "hetzelfde schema als lokaal" letterlijk?** **NEE — dat is de weerlegde helft.** Een
lens heeft de hele database kolom-voor-kolom vergeleken, wat hier eerst als "niet gemeten" stond:
`activities` 19/19, `checkins` 6/6, `d1_migrations` 3/3, `day_state` 4/4, `events` 10/10,
`planner_days` 10/10, `power_curve_cache` 5/5, `rpe` 3/3, `settings` 21/21, `sqlite_sequence` 2/2,
`users` 4/4, `weekplans` 3/3, `wellness` 14/14 — **veertien van de vijftien identiek, en alléén
`sync_state` week af**: remote 21 kolommen tegen lokaal 18. De claim was dus niet TE BREED maar te
SPECIFIEK onwaar: hij faalde uitsluitend op de ene tabel waar deze ronde over ging. Ná de lokale
reparatie hierboven klopt hij wel, en dat is nu gemeten in plaats van aangenomen.

> Één platform-artefact om te onthouden voor wie deze vergelijking ooit automatiseert: remote draagt
> een interne tabel `_cf_KV`, lokaal draagt `_cf_METADATA`. Beide kanten tellen 15 tabellen in
> `sqlite_master` en dezelfde 12 gebruikerstabellen. Sluit `_cf_%` uit, anders geeft de check een
> vals alarm.

**(d) Is er werkelijk niets verloren?** **JA, en dit is de helft die HOUDT — breder gemeten dan ik
zelf had gedaan.** Op `sync_state`: 1 rij vóór en ná, 0 gewijzigde waarden op de 18 bestaande
kolommen, tweemaal onafhankelijk nagemeten. En een lens heeft alle twaalf gebruikerstabellen op
remote geteld:

```
activities 255 · wellness 405 · planner_days 35 · rpe 8 · checkins 4 · day_state 4
weekplans 3 · events 2 · power_curve_cache 2 · settings 1 · sync_state 1 · users 1
d1_migrations 13
```

Niets leeg, geen wezen. `wellness` is een GATLOZE reeks van 405 rijen op 405 unieke datums over
2025-07-15 t/m 2026-08-23. De schijnbare stilte op `activities` (laatste rij 2026-08-04) is geen
kapotte sync maar Daan die niet fietst: `ctl` daalt monotoon van 42,8 op 04-08 naar 27,2 op 23-08 en
`atl` naar 2,6 — precies wat werkelijk niet trainen oplevert.

**EEN ZIJVONDST DIE HIER HOORT:** `last_sync`, `meso_week`, `load_carry`, `ftp_last_sync` en
`weight_last_sync` staan alle vijf NULL op remote, en de live `repo.ts` bevat 0 verwijzingen naar
`lastSync`, `mesoWeek`, `loadCarry`, `ftpLastSync` of `weightLastSync`. Dat zijn DODE KOLOMMEN, geen
verloren data.

---

### 24-08-2026 — de WEG TERUG gemeten, en de deploy

**AANLEIDING:** de vorige regel in dit logboek is zonder herstelpunt uitgevoerd. Bij een additieve
migratie kwam dat er niet op aan; bij een deploy wel, want **Daan gebruikt deze app**. Dat laatste
stond tot deze ronde nergens vastgelegd en het verandert de risicoweging van elke prod-handeling:
prod is geen proefopstelling.

#### De weg terug — GEMETEN tegen deze omgeving, niet aangenomen

**WORKER — er IS een rollback.** `npx wrangler rollback [version-id]` bestaat op wrangler 4.106.0 en
neemt een versie-id. Het terugvaldoel is geverifieerd aanwezig:

```
npx wrangler versions list --json  →  10 versies
DOELVERSIE e994c768-3d73-4aec-876b-b614b7fe1302 aanwezig: JA
  gemaakt 2026-08-10T13:19:30.57281Z · door dtkorteweg@gmail.com · bron wrangler
```

Het commando om terug te vallen, vanuit `workers/api`:

```
npx wrangler rollback e994c768-3d73-4aec-876b-b614b7fe1302
```

> LET OP: die versielijst kapt af op de tien nieuwste. Zolang het terugvaldoel daarin staat is er
> een weg terug; zakt het eruit, dan niet meer.

**D1 — Time Travel, en het bereik is aan beide randen getoetst.**

```
huidige bookmark              : 0000011f-00000000-000050d1-9aad022c788316175394fbbd69adf9c8
bookmark vlak vóór de migratie: 00000118-0000007e-000050d0-e30be9f907d2a4f5c6de6d94e8fe3c18
                                (timestamp 2026-08-23T17:00:00Z)
25 dagen terug (2026-07-30)   : bookmark geleverd
40 dagen terug (2026-07-15)   : GEWEIGERD — "Please provide a timestamp within the last 30 days"
```

Het bereik is dus **30 dagen**, gemeten en niet uit documentatie overgenomen. Merk op dat een
worker-deploy D1 niet aanraakt: voor de deploy is de rollback de weg terug, niet Time Travel.

#### De meethelft van punt 65

Volledig in `docs/TZ-RECON.md`. Samengevat: de UTC-klok wijkt af in **24 van 384 gemeten instants
(6,3 procent)**, uitsluitend in een venster van 1 tot 2 uur dat eindigt op 00:00 UTC, en er staan
**0 scheve rijen** op prod — structureel nul, omdat de enige door de Worker geproduceerde datumkolom
`power_curve_cache.fetched_on` is en die een cache-bucket is. T1 en T2 hielden allebei, dus de
deploy-blokkade van punt 65 verviel.

#### De deploy

Zie hieronder — deze paragraaf wordt in dezelfde ronde afgemaakt.

## Wat een volgende ronde hier moet bijwerken

- Elke toegepaste migratie: naam, `applied_at`, en of er backfill nodig was.
- Elke worker-deploy: versie-id, tijdstip, en welke commit erin zit.
- Elke keer dat de afstand tussen de live Worker en `main` verandert.
- Loopt er iets vast, dan hoort de FOUTSTAND hier ook — een logboek dat alleen successen draagt
  vertelt niet wat er kan misgaan.

<!-- EINDE docs/PROD-STAND.md -->
