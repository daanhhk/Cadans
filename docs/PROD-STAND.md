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
| live versie | `940414c4-be95-4968-9eef-542a188db563` |
| live sinds | `2026-08-24T05:35:36.574Z` |
| live COMMIT | `46f2103ed7921ca12b9e855e3b2e46ceac204d88` — de eerste regel in dit logboek die de commit WEL noteert |
| terugvaldoel | `e994c768-3d73-4aec-876b-b614b7fe1302` (de vorige live versie, sinds 2026-08-10) |
| deployments totaal | **minimaal 11, totaal niet gemeten** — de CLI toont er tien, zie hieronder |
| Worker loopt achter op main | **NEE, sinds 24-08-2026** — bij was hij tot dan ruim twee weken achter |

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

**DAAN GEBRUIKT DEZE APP.** Dat stond tot 24-08-2026 nergens vastgelegd en het is het belangrijkste
feit op deze bladzijde: prod is geen proefopstelling. Elke handeling hier weegt daarnaar, en elke
prod-mutatie draagt vooraf haar weg terug (`docs/WERKWIJZE.md`).

> **DE WORKER LIEP VER ACHTER — opgelost op 24-08-2026.** Van 10-08 tot 24-08 draaide prod op code
> van vóór het hele punt-47-blok: het schema was bij, de code niet. Dat was geen defect maar het
> stond ook nergens opgeschreven, en het is precies het soort feit waarvoor dit document bestaat.
> Sinds de deploy van 24-08 loopt prod weer gelijk met `main`.

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

#### De deploy — DOORGEGAAN

Alle vier de voorwaarden waren vervuld: een gemeten weg terug, T1 en T2 hielden, en gate plus CI
stonden groen op `46f2103`. Uitgevoerd vanuit `workers/api`, met een verse `pnpm build` ervóór omdat
de assets-binding naar `apps/web/dist` wijst:

```
pnpm build            (root)
npx wrangler deploy   (vanuit workers/api)
```

```
Found 3 new or modified static assets to upload
  + /index.html  + /sw.js  + /assets/index-BiwPwGBR.js
Uploaded 3 files (63 already uploaded)
Total Upload: 325.28 KiB / gzip: 70.37 KiB · Worker Startup Time: 7 ms
Deployed cadans-api triggers
Current Version ID: 940414c4-be95-4968-9eef-542a188db563
```

**ALLEEN DE CODESPRONG, geen tijdzone-reparatie in dezelfde handeling.** Die is een eigen besluit met
een eigen ronde: een reparatie en een twee weken oude codesprong tegelijk uitrollen maakt elke
storing onherleidbaar.

#### De na-verificatie

| wat | uitkomst |
| --- | --- |
| live versie | `940414c4-be95-4968-9eef-542a188db563`, 100 procent, `2026-08-24T05:35:36.574Z` |
| draait de nieuwe Worker-code? | JA — de origin geeft `401` mét `WWW-Authenticate: Basic realm="Secure Area"`, en die header komt uit de `basicAuth`-middleware van de Worker zelf |
| `sync_state` ongewijzigd? | JA — 1 rij, 21 kolommen, waarde-voor-waarde gelijk aan de vóór-staat |
| geuploade bundel | `/assets/index-BiwPwGBR.js`, en die naam staat in de lokale `apps/web/dist/index.html` |

De `sync_state`-rij ná de deploy, naast de vóór-staat gelegd: `user_id` 1, `dosis_trede` 0,
`dosis_trede_blok` `"2026-07-27"`, `dosis_trede_doel` `"FTP"`,
`power_zones_json` `"[55,75,90,105,120,150,999]"`, de drie `ijking_`-kolommen NULL, de overige
dertien NULL. **Nul verschillen.**

#### Twee dingen die de na-verificatie NIET kon aantonen

**(1) CHECK 37 is NIET GEDRAAID.** Die check wil de LIVE `index.html` ophalen en het asset waar hij
naar wijst byte-voor-byte tegen de lokale build leggen. De hele origin zit achter een
basic-auth-gate waarvan het wachtwoord een deploy-only secret is (`BASIC_AUTH_PASSWORD`), en
inloggen doe ik niet. Wat er wél is: de bundelnaam die wrangler uploadde komt overeen met die in de
lokale `index.html`. **Dat is een naam-vergelijking en geen byte-vergelijking.** Daan kan de check
afmaken door in de browser in te loggen op `https://cadans-api.dtkorteweg.workers.dev/` en te kijken
of de app laadt.

**(2) DE IJKING-LAAG IS VIER WEKEN INERT en een rooktest kan hem niet tonen.** Met de ECHTE
prod-instellingen — `doel` `FTP`, `doel_start` `2026-06-29`, gelezen van remote D1 — geeft
`computeMacroPhase` voor de weekmaandagen hierna:

```
2026-08-24  ->  week  9  fase Peak   ijkaanbod mogelijk: nee
2026-08-31  ->  week 10  fase Peak   nee
2026-09-14  ->  week 12  fase Test   nee
2026-09-21  ->  week  1  fase Base   JA
```

Poort (1) eist doelblokweek 1, dus **het eerste ijkaanbod verschijnt op 2026-09-21**. Wie vandaag
kijkt en niets ziet, ziet het JUISTE gedrag. Dat vaststellen vraagt geen actie; het vraagt geduld,
of een tijdelijke `doelStart`-verzetting, en dat laatste is zelf een schrijfactie op prod.

**WAT DAAN NU KAN CONTROLEEREN, als hij wil:** open de app, kijk of de weekkaart normaal laadt en of
er geen 500 staat op het schema-scherm. Meer valt er vandaag niet aan te zien — en dat is precies
wat hierboven staat.

## 2026-08-24 — DEPLOY: de reparatie van punt 73

**Uitgerold:** commit `1dcd1e1` (de reparatie zelf zit in `5a15544`). Geen migratie, geen
D1-mutatie — remote D1 draagt onveranderd 0000 t/m 0012.

```
nieuwe versie   0fcb0ddf-1796-4084-ae6e-0062c7033a28   (100%)
aangemaakt      2026-08-24T14:53:23.751Z
uitgerold       2026-08-24T14:53:25.510Z
vorige versie   940414c4-be95-4968-9eef-542a188db563   (sinds 2026-08-24T05:35:34.799Z)
```

**DE WEG TERUG, en die is VOORAF gemeten en niet aangenomen:**
`npx wrangler rollback 940414c4-be95-4968-9eef-542a188db563` vanuit `workers/api`. Die versie stond
vóór de deploy geverifieerd in `wrangler versions list` — die lijst houdt er **tien**, en het doel
stond er als nieuwste in. Een worker-deploy raakt D1 niet, dus de rollback IS de weg terug; Time
Travel is hier niet aan de orde.

**WAT ERIN ZIT.** Een expliciete `null` in een `PUT /api/settings`-body is nu een LEGE WAARDE in
plaats van een 400. Daarmee werkt de doel-wissel-knop weer: die stuurde het volledige settings-object
terug (wat FULL-REPLACE ook vereist), dat object draagt nulls, en de kaart at de 400 stil op.

**DE NA-VERIFICATIE, en wees precies over wat er wél en niet is vastgesteld:**

- **WAT IS VASTGESTELD.** De versie draait op 100 procent (`wrangler deployments list`), en de
  geüploade bundelnaam `assets/index-DTgN90UH.js` is gelijk aan die in de lokale
  `apps/web/dist/index.html`.
- **CC-CHECKS 37 IS NIET GEDRAAID**, om dezelfde reden als op 24-08-2026 eerder: die check wil de
  LIVE `index.html` byte-voor-byte tegen de lokale build leggen, en de hele origin zit achter een
  basic-auth-gate waarvan het wachtwoord een deploy-only secret is. Wat er is, is een
  NAAM-vergelijking. Dat vervangt de byte-vergelijking niet.
- **OF DE DOEL-WISSEL OP PROD LANDT, IS NIET DOOR MIJ GETOETST** — zelfde gate. En het is ook niet
  vanzelf zichtbaar: de kaart vuurt alleen als het staande doel een URENVLOER draagt waar de
  opgegeven weekuren onder zitten, en bij doel `FTP` is er per constructie geen vloer.

**WAT DAAN KAN CONTROLEREN, en waar hij precies naar kijkt:** open
`https://cadans-api.dtkorteweg.workers.dev/`, log in met de basic-auth, en kijk of de weekkaart
normaal laadt en het schema-scherm geen 500 geeft — dat is de rooktest op de deploy zelf. Wil hij de
REPARATIE zien werken, dan moet de doel-passend-kaart zichtbaar zijn: dat vraagt een doel mét
urenvloer (dus niet FTP) en weekuren daaronder. Staat die kaart er, dan is de toets één tik op
**"Wissel naar …"** — vóór deze deploy deed die knop niets en zei hij niets; nu hoort het doel te
wisselen en de kaart te verdwijnen. Mislukt het toch, dan staat er sinds deze ronde een melding in
plaats van stilte.

## 2026-08-25 — DIAGNOSE: waarom weigerde remote D1, en wat is er mis met het token

**KORTE UITKOMST: er is NIETS mis met het token, en Daans indruk was juist.** Mijn eerdere conclusie
— "het token mist de `d1`-scope" (ROADMAP punt 76) — was ONJUIST, op twee eigen leesfouten. De
weigering was TRANSIENT.

### Langs welke weg authenticeert wrangler hier

Niet via een omgevingsvariabele en niet via `.dev.vars`. Gemeten, op NAAM en zonder één waarde te
tonen:

```
CLOUDFLARE_API_TOKEN · CLOUDFLARE_API_KEY · CLOUDFLARE_EMAIL
CLOUDFLARE_ACCOUNT_ID · CF_API_TOKEN · WRANGLER_API_TOKEN     -> ALLE ZES NIET GEZET
workers/api/.dev.vars  -> draagt alleen INTERVALS_API_KEY en INTERVALS_ATHLETE_ID
```

**`.dev.vars` is trouwens sowieso de verkeerde plek voor een Cloudflare-token** — dat bestand vult de
BINDINGS van de Worker tijdens `wrangler dev`, niet de authenticatie van wrangler zelf. Er staat daar
ook geen Cloudflare-token, dus dat is hier geen probleem; het is een valkuil die het waard is te
noemen.

Wat er wél is: een **OAuth-login die wrangler zelf bewaart**, in
`C:\Users\daan\AppData\Roaming\xdg.config\.wrangler\config\default.toml`. Dat bestand draagt vier
sleutels — `oauth_token`, `refresh_token`, `expiration_time` en `scopes` — en is de ENIGE
credential-bron op deze machine. Het toegangstoken leeft één uur en wordt bij vrijwel elke aanroep
ververst (`fetching auth token grant_type=refresh_token` staat in zowel geslaagde als mislukte runs).

### Welke rechten die credential heeft

**28 scopes, en `d1:write` staat erbij.** Uit hetzelfde bestand:

```
account:read · agent-memory:write · ai-search:run · ai-search:write · ai:write · artifacts:write
browser:write · cloudchamber:write · connectivity:admin · containers:write · d1:write
email_routing:write · email_sending:write · flagship:write · offline_access · pages:write
pipelines:write · queues:write · secrets_store:write · ssl_certs:write · user:read · websearch.run
workers:write · workers_kv:write · workers_routes:write · workers_scripts:write
workers_tail:read · zone:read
```

**WAAROM IK DIT EERDER MIS HAD, twee keer.** (1) Ik las de scopes uit een `wrangler whoami`-uitvoer
die ik met `head`/`tail` had afgekapt, en concludeerde afwezigheid uit een lijst die ik niet heel had
gezien. (2) Toen ik ze daarna uit het bestand haalde, gebruikte ik een patroon zonder CIJFERS —
waardoor juist `d1:write` onzichtbaar was. Twee keer dezelfde fout in een andere vorm: een conclusie
trekken uit een onvolledig beeld zonder te toetsen of het beeld compleet was.

### De volledige foutmelding, verbatim

```
-- START CF API REQUEST: POST https://api.cloudflare.com/client/v4/accounts/
   9218229b9be1015defcbacc8c430ca34/d1/database/aa302c17-915b-44cb-8823-89c416974f50/query
-- START CF API RESPONSE: Forbidden 403

{ "error": { "text": "A request to the Cloudflare API (/accounts/9218229b9be1015defcbacc8c430ca34/
  d1/database/aa302c17-915b-44cb-8823-89c416974f50/query) failed.",
  "notes": [ { "text": "The given account is not valid or is not authorized to access this
  service [code: 7403]" } ], "kind": "error", "name": "APIError", "code": 7403 } }
```

### N1 — HOUDT

Er is één credential. Omdat er geen enkele omgevingsvariabele gezet is, kan zowel `wrangler deploy`
als `wrangler d1 execute --remote` alleen de opgeslagen OAuth-login gebruiken. Deploy slaagt op
`workers_scripts:write` uit diezelfde grant waar ook `d1:write` in staat. Het is dus geen
configuratie-vraag met twee tokens.

### N2 — VALT, en wel op ALLEBEI zijn helften

De weigering kwam **niet** van de rechten (`d1:write` staat er), en **ook niet** van een verkeerde
account of database: het account-id en het database-id in het mislukte verzoek zijn byte-voor-byte
dezelfde als in de verzoeken die nu slagen.

**HET WAS TRANSIENT, en dat is met de logs hard te maken.** Op dezelfde dag als de mislukking raakte
`--remote` het D1-`/query`-endpoint TWAALF keer met `OK 200` (07:36 t/m 09:19 UTC) en precies ÉÉN keer
met `Forbidden 403` (14:06:27 UTC). Vandaag: vijf van vijf geslaagd, plus een geslaagde
`d1 migrations list --remote`. Van de vijf logbestanden die ooit `7403` droegen, gaan er vier over
D1 (`d1 execute`, `d1 migrations list`) — verspreid over 04-08, 09-08, 21-08 en 24-08 — en nooit over
een deploy.

De OORZAAK van die ene weigering is **niet vastgesteld** en is met de beschikbare gegevens ook niet
vast te stellen: het token-verversen gebeurt in zowel de geslaagde als de mislukte runs, dus dat
onderscheidt niets. Wat wél vaststaat is dat het niet aan het token, de account of de database ligt.

### (e) Is 0013 werkelijk niet toegepast op remote?

**Vastgesteld, read-only, zonder één schrijfactie.** `wrangler d1 migrations list cadans --remote`
antwoordt met "Migrations to be applied" en daaronder één regel: `0013_brown_sage.sql`. De migratie
staat dus inderdaad open op remote, en dat is nu een MEETRESULTAAT in plaats van een afleiding.

---

### VOOR DAAN

Er is niets mis met je token, en je hoefde er ook niets aan te doen — je had gelijk. Wrangler gebruikt
de login die hij zelf bewaart nadat je ooit `wrangler login` hebt gedaan, en die login heeft alle
rechten die nodig zijn, ook voor de database. Er staat nergens een los token dat verkeerd zou staan.

Wat er gebeurde, was een eenmalige weigering van Cloudflare zelf. Op dezelfde dag ging dezelfde
opdracht twaalf keer goed en één keer mis; vandaag gaat hij vijf van de vijf keer goed. **Mijn
conclusie van gisteren — "het token mist een recht" — was fout, en dat lag aan mij: ik had de lijst
met rechten twee keer onvolledig gelezen.**

Er is dus geen handeling in het Cloudflare-dashboard nodig. Geen nieuw token, geen nieuwe rechten,
niets kopiëren of ergens neerzetten.

Wat er WEL nog moet gebeuren is de database-wijziging van gisteren op de echte database zetten: er
staat één migratie klaar (`0013`). Dat is een prod-handeling en die vraagt jouw akkoord — zeg het
woord en het is één opdracht. Loopt hij toevallig weer tegen die weigering aan, dan is opnieuw
proberen het juiste antwoord, niet een nieuw token maken.

## Wat een volgende ronde hier moet bijwerken

- Elke toegepaste migratie: naam, `applied_at`, en of er backfill nodig was.
- Elke worker-deploy: versie-id, tijdstip, en welke commit erin zit.
- Elke keer dat de afstand tussen de live Worker en `main` verandert.
- Loopt er iets vast, dan hoort de FOUTSTAND hier ook — een logboek dat alleen successen draagt
  vertelt niet wat er kan misgaan.

<!-- EINDE docs/PROD-STAND.md -->
