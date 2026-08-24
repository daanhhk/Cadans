# Cadans — TZ-RECON

**De meethelft van ROADMAP punt 65.** Wat doet de UTC-klok van een gedeployde Worker met een engine
die op `TZ=Europe/Amsterdam` is gebouwd? Dit document is de GROND waarop de reparatie-ronde straks
ontworpen wordt, dus het is geschreven voor iemand die de code niet voor zich heeft.

**DE SCHULD IS DE PREMISSE, NIET DE CONCLUSIE.** `docs/ARCHITECTUUR.md` draagt haar al: de engine
formatteert met LOKALE getters en de correctheid leunt op de Amsterdam-pin, terwijl een gedeployde
Worker UTC draait. Wat NIET vaststond is of dat op prod ook werkelijk verkeerde data heeft
opgeleverd. Dat is hier gemeten en niet afgeleid.

**UITKOMST IN ÉÉN ZIN:** de afwijking is echt en scherp begrensd — een venster van één tot twee uur
dat eindigt op middernacht UTC, 24 van 384 gemeten instants — maar zij kan op dit schema **geen
enkele verkeerde datum opslaan**, omdat er precies één door de Worker geproduceerde datumkolom
bestaat en die een cache-bucket is.

---

## M-A — welke schrijfpaden zijn datum-gevoelig?

**DE VRAAG IS WIE EEN DATUM PRODUCEERT, niet wie er een doorgeeft.** Vastgesteld met een uitputtende
grep over `workers/api/src` op elke klok-aanraking (`new Date(`, `Date.now(`, `toISOString(`,
`getFullYear(`, `getMonth(`, `getDate(`, `getHours(`), niet door de kandidaten uit de opdracht over
te nemen. Noemer: **16 treffers in 5 bestanden**.

### De vijf producenten

| vindplaats | wat het produceert | landt in |
| --- | --- | --- |
| `intervals.ts` `syncActivities` | `oldest` / `newest` van het sync-venster | een query-URL, niet in D1 |
| `wellness.ts` `syncWellness` | `oldest` / `newest` van het sync-venster | een query-URL, niet in D1 |
| `powercurve.ts` `syncPowerCurve` | `fetchedOn` (dag-bucket) | **`power_curve_cache.fetched_on`** |
| `powercurve.ts` `readPowerCurve` | `today` (cache-sleutel) | niets, alleen vergelijking |
| `repo.ts` `writeCheckin` | `ts: new Date().toISOString()` | `checkins.ts`, **absoluut → TZ-invariant** |

De regels waaraan de claim hangt, verbatim:

```
  const now = opts.now ?? new Date();
  const oldest = toD1Date(new Date(now.getTime() - daysBack * 86400000));
  const newest = toD1Date(now);
```

```
  const fetchedOn = toD1Date(opts.now ?? new Date()); // dag-bucket
```

### Wat GEEN producent is, en dat corrigeert twee aannames

**`weekplanFreeze.ts` is GEEN datum-producent.** De opdracht noemde hem als bekende kandidaat; hij
is het niet. Hij ontvangt `todayISO` uit de CLIENT-body en zijn eigen docstring zegt waarom,
verbatim:

```
 * De freeze hoort in de WORKER: de client kent zijn lokale dag (todayISO in de body), maar
```

De route valideert die waarde met `isIsoDate` en geeft hem door; de grens `datum < todayISO` is dus
de LOKALE dag van de browser, niet de klok van de Worker. Aan die kant komt UTC er niet bij.

**De ROUND-TRIPS zijn TZ-invariant — MET ÉÉN UITZONDERING die de weerleggingspas vond.** `fromD1`
bouwt met `new Date(y, m-1, d)` en `toD1Date` formatteert met dezelfde lokale getters, dus
`toD1Date(fromD1(x)) === x` ongeacht de tijdzone. Dat geldt voor `repo.ts` regel 203-206 (het
acht-weken-venster) en regel 352 (`sundayISO`), die allebei kalenderrekenwerk doen op een
MEEGEGEVEN maandag. De sortering in `intervals.ts` regel 104 parseert `start_date_local` zonder `Z`
aan beide kanten gelijk en is daarmee orde-invariant.

> **DE UITZONDERING: het DST-GAT, en daar is UTC de JUISTE kant.** De datetime-tak van de
> round-trip — `fromD1` op een `start_date_local` zonder `Z`, terug via `toD1DateTime` in
> `repo.ts` regel 242 — is alleen invariant zolang de lokale wandkloktijd BESTAAT. In het gat van
> de voorjaarsomschakeling bestaat hij niet. HERMETEN op 1152 wandklok-strings over vier dagen:
>
> ```
> UTC               round-trip toD1DateTime(fromD1(x)) !== x :  0 van 1152
> Europe/Amsterdam  round-trip toD1DateTime(fromD1(x)) !== x : 12 van 1152
>     2026-03-29T02:00:00  ->  2026-03-29T03:00:00
> ```
>
> Alle twaalf liggen op 2026-03-29 tussen 02:00 en 02:55 lokaal — het uur dat in Amsterdam niet
> bestaat. **De gedeployde UTC-worker is hier exact en de Amsterdam-pin verspringt een uur.**
> Praktisch bereik: een rit die start tussen 02:00 en 03:00 op de laatste zondag van maart. Dit is
> een KWALIFICATIE van de invariantie-claim, geen weerlegging van de hoofdclaim — en het is een
> argument dat op dit ene pad TEGEN het pinnen op Amsterdam pleit.

---

## M-B — voor welke invoer levert UTC een andere uitkomst dan Amsterdam?

**DEZELFDE INVOER LANGS TWEE KLOKKEN.** Het meetscript (`scratchpad/tz-meet.mjs`) draait zichzelf
twee keer als kindproces, één keer met `TZ=UTC` en één keer met `TZ=Europe/Amsterdam`, met een
IDENTIEKE lijst instants. De instants gaan door de ECHTE `syncActivities`, `syncWellness` en
`toD1Date` van `workers/api`, met een `fetchImpl` die de URL vangt en dan afbreekt — geen netwerk,
geen D1.

**GEEN VAST TIJDSTIP.** De klok wordt over het hele etmaal geveegd, elk kwartier, op vier dagen: een
zomerdag, een winterdag en de twee DST-overgangen van 2026. Een gestipuleerd tijdstip zou precies de
beginconditie zijn die de canon verbiedt.

**EERSTE NOEMER: 384 instants** (4 dagen × 96 kwartieren). **Die was te klein, en de
weerleggingspas heeft dat terecht omvergeworpen** — vier dagen kunnen per constructie geen venster
bevatten dat een DST-omschakeling OVERSPANT, en juist daar zit het interessante gedrag. De
hermeting hieronder staat op **210.240 vergelijkingen**. De uitslag van de eerste meting blijft
staan omdat zij het mechanisme correct toont; de GETALLEN eronder zijn vervangen.

### De uitslag van de eerste (te kleine) meting

```
RIJEN MET EEN VERSCHIL: 24 van 384 = 6,3%

toD1Date        24 / 384      2026-07-15T22:00:00Z  UTC=2026-07-15  AMS=2026-07-16
act_oldest      24 / 384      2026-07-15T22:00:00Z  UTC=2026-06-17  AMS=2026-06-18
act_newest      24 / 384      2026-07-15T22:00:00Z  UTC=2026-07-15  AMS=2026-07-16
wel_oldest      24 / 384      2026-07-15T22:00:00Z  UTC=2026-05-16  AMS=2026-05-17
wel_newest      24 / 384      2026-07-15T22:00:00Z  UTC=2026-07-15  AMS=2026-07-16
pc_fetchedOn    24 / 384      2026-07-15T22:00:00Z  UTC=2026-07-15  AMS=2026-07-16
```

### Het venster, per veld per dag

```
veld            2026-07-15   2026-01-15   2026-03-29   2026-10-25
toD1Date       22:00-23:45  23:00-23:45  22:00-23:45  23:00-23:45
act_oldest     22:00-23:45  23:00-23:45  23:00-23:45  22:00-23:45
act_newest     22:00-23:45  23:00-23:45  22:00-23:45  23:00-23:45
wel_oldest     22:00-23:45  23:00-23:45  23:00-23:45  22:00-23:45
wel_newest     22:00-23:45  23:00-23:45  22:00-23:45  23:00-23:45
```

### DE HERMETING — een heel jaar, zes daysBack-waarden

`scratchpad/tz-jaar.mjs`: elk kwartier van 2026 (**35.040 instants**) × de zes `daysBack`-waarden
die in de code bereikbaar zijn = **210.240 twee-klok-vergelijkingen**, met de verbatim regels uit
`intervals.ts:90-91` en de ECHTE `toD1Date`.

```
daysBack   1 | verschil  2304 = 6.58% | UTC-uren met verschil: 22, 23
             newest UTC EERDER 2300 · LATER 0 | span onder Amsterdam: 0d x4  1d x35032  2d x4
daysBack   7 | verschil  2328 = 6.64% | UTC-uren met verschil: 22, 23
daysBack  28 | verschil  2412 = 6.88% | UTC-uren met verschil: 22, 23   ← activities-default
             newest UTC EERDER 2300 · LATER 0 | span: 27d x112  28d x34816  29d x112
daysBack  60 | verschil  2540 = 7.25% | UTC-uren met verschil: 22, 23   ← wellness-default
             newest UTC EERDER 2300 · LATER 0 | span: 59d x240  60d x34560  61d x240
daysBack  90 | verschil  2664 = 7.60% | UTC-uren met verschil: 22, 23
daysBack 365 | verschil  2304 = 6.58% | UTC-uren met verschil: 22, 23
```

**DE BESLISSENDE TELLING VOOR T1: verschillen buiten de UTC-uren 22 en 23, over alle zes waarden en
alle 210.240 vergelijkingen — NUL.**

Die telling was nodig omdat **twee lenzen elkaar tegenspraken**: de ene meldde verschillen op
21:00–22:00 UTC, de andere "geen enkel uur buiten 22 en 23". Mijn eigen meting geeft de tweede
gelijk. De eerste verwarde het Amsterdam-LOKALE uur 23 met een UTC-uur: om 23:00 lokaal in de zomer
(21:00 UTC) is de Amsterdam-dag nog niet omgeslagen, dus daar is per constructie geen verschil.

### Drie correcties op mijn eigen eerste formulering

**(i) "2,00 uur in zomertijd, 1,00 uur in wintertijd" is te grof.** Het verschil leeft ALTIJD binnen
de UTC-uren 22 en 23, maar WELK van die twee uren een verschil draagt hangt af van het DST-regime
**bij elke rand apart**. Ligt `oldest` nog aan de andere kant van een omschakeling, dan kantelt die
rand op 22:00 UTC terwijl `newest` pas op 23:00 kantelt, en dan is de unie 2 uur — óók midden in de
winter. Het venster is dus begrensd, maar niet zo netjes als de vierdaagse steekproef suggereerde.

**(ii) 6,3 procent is geen constante.** Het loopt van **6,58 procent** (`daysBack` 1 en 365) tot
**7,60 procent** (90). De waarden die prod werkelijk gebruikt zijn de defaults: **6,88 procent** voor
activiteiten en **7,25 procent** voor wellness. De client zet `?days=` nooit.

**(iii) HET VENSTER SCHUIFT NIET ALLEEN, HET KRIMPT EN GROEIT.** `oldest` wordt met een
MILLISECONDEN-aftrek berekend (`now.getTime() - daysBack * 86400000`) en niet met kalenderrekenwerk,
dus over een omschakeling klopt de span niet meer. GEMETEN bij `daysBack` 60: onder UTC is de span
altijd exact 60 dagen (35.040 van 35.040); onder Amsterdam 59 dagen op 240 instants en 61 dagen op
240. Bij `daysBack` 1 op de najaarsomschakeling wordt het Amsterdam-venster zelfs NUL dagen breed.
**Op dit punt is de gedeployde UTC-worker dus stabieler dan de Amsterdam-bedoeling.**

### De RICHTING van de afwijking, en waarom die de faalwijze bepaalt

`newest` onder UTC is **NOOIT later** dan de Amsterdam-waarde — 0 van 35.040 bij élke
`daysBack` — en **2300 keer precies één dag eerder**. Draait een sync in het venster, dan vraagt hij
intervals.icu dus een bereik dat eindigt op de VORIGE lokale dag.

**De faalwijze is een TIJDELIJK ONTBREKENDE rij, niet een scheve rij.** Bij een rollend venster van
28 of 60 dagen haalt de volgende sync die dag alsnog op. Dat is aantoonbaar wat er gebeurt:
`wellness` is gatloos tot en met vandaag.

**EN DE BLOOTSTELLING IS KLEINER DAN 6,88 PROCENT.** Er is GEEN cron op de Worker — geen `crons` in
`wrangler.jsonc`, geen `scheduled`-handler in `index.ts`. De enige aanroeper van de syncs is de
client bij het openen van het schema-scherm. De werkelijke kans is dus niet een uniforme 6,88
procent maar de kans dat Daan de app tussen 00:00 en 02:00 lokaal opent. Stond er wél een cron in de
band, dan was de trefkans 100 procent geweest.

**DE TWEE RANDEN SLAAN OP VERSCHILLENDE UREN OM, en dat is subtiel genoeg om apart te noemen.**
`oldest` ligt 28 dagen (activiteiten) of 90 dagen (wellness) vóór `newest`, dus zodra het venster een
DST-omschakeling overspant, leven de twee randen in een ANDER regime. GEMETEN op
`2026-10-25T22:00:00Z`: `newest` is aan beide kanten `2026-10-25` (gelijk, want CET), maar `oldest`
rekent terug naar `2026-09-27T22:00Z` en dáár gold nog CEST — UTC geeft `2026-09-27`, Amsterdam
`2026-09-28`. Op `2026-03-29` staat het spiegelbeeld. Het venster SCHUIFT dus niet als geheel; het
kan aan één rand verspringen.

**WAT DAT PRAKTISCH DOET.** Onder UTC ligt de kalenderdag in dat venster één dag EERDER dan in
Amsterdam. Het sync-venster wordt daardoor één dag naar achteren geschoven: `newest` is "gisteren"
waar Amsterdam "vandaag" zegt. Het gevolg is dat een sync die precies in dat venster draait de
LOPENDE dag niet meeneemt — hij mist niets blijvends, want een volgende sync haalt hem alsnog op.

---

## M-C — staat er op prod werkelijk scheve data?

**READ-ONLY gemeten op remote D1.** Geen enkele mutatie in deze helft.

### De sleutelvraag: welke kolom draagt een door de WORKER geproduceerde datum?

**Er is er precies één: `power_curve_cache.fetched_on`.** De andere datumkolommen komen van elders:

- `wellness.datum` komt uit de API-respons — `datum: String(w.id ?? w.date ?? "")`;
- `activities.datum` komt uit `start_date_local` van intervals.icu;
- `checkins.datum` is een pad-parameter van de route, en `checkins.ts` is een absolute ISO-stempel;
- `planner_days`, `weekplans`, `events`, `day_state`, `rpe`, `settings.doelStart` en de
  `sync_state`-blokdatums komen alle uit de client of uit een round-trip.

### Wat `fetched_on` kan misgaan, en wat niet

Het is een **TTL-dag-bucket**, geen inhoudelijke datum. `readPowerCurve` doet:

```
  if (cache && cache.fetchedOn === today && hasCurveData(cache.raw)) {
```

Staat de bucket een dag te vroeg, dan mist de vergelijking en volgt een **overbodige re-fetch**. Dat
kost een API-aanroep en levert VERSE data. **De faalwijze is verspilling, niet bederf.**

### De telling op prod

```
power_curve_cache : 2 rijen — id 1 window "1y"  fetched_on 2026-08-23
                             id 2 window "90d" fetched_on 2026-07-22
wellness sinds 2026-08-10 : 15 rijen, 15 unieke datums, 2026-08-10 t/m 2026-08-24
                            kalenderdagen in dat bereik: 15  →  GATLOOS
activities sinds 2026-08-10 : 0 rijen
```

**SCHEVE RIJEN AANGEWEZEN: 0 van 0 mogelijke.** En dat is een NUL, geen afwezigheid van bewijs: er
bestaat op dit schema geen kolom waarin een verkeerde dag blijvend kan landen.

**WAT NIET MEETBAAR IS, en dat hoort erbij.** `activities` draagt 0 rijen sinds de deploy omdat Daan
niet fietst (`ctl` daalt monotoon van 42,8 op 04-08 naar 27,2 op 23-08). Een gemiste dag zou daar dus
niet zichtbaar zijn — **niet gemeten**, en nooit "gemeten als afwezig". Voor `wellness`, dat wél
elke dag een rij krijgt, is de reeks aantoonbaar gatloos.

---

## De twee verwachtingen

### T1 — HOUDT, op de hermeting en niet op de eerste

De valconditie is: "VALT als er een schrijfpad blijkt dat de HELE DAG DOOR verschilt". Dat is er
niet. **Over 210.240 vergelijkingen liggen ALLE verschillen binnen de UTC-uren 22 en 23; buiten dat
venster: 0.** Vindplaats van de begrenzing: `workers/api/src/db/dates.ts`, `toD1Date`, die via
`formatDate` uitsluitend lokale kalendergetters gebruikt — het verschil kan per constructie niet
groter zijn dan het TZ-offset.

De FIJNMAZIGE formulering van de eerste meting hield niet ("2 uur zomer, 1 uur winter", "6,3
procent"); zie de drie correcties hierboven. De KERN van T1 — begrensd, rond middernacht, niet de
hele dag door — is nu op een 547 keer grotere noemer bevestigd dan waarop zij eerst rustte.

### T2 — HOUDT

Het aantal scheve rijen is **0** en dus triviaal te overzien. Sterker: het is niet klein-maar-eindig
maar structureel nul, omdat de enige door de Worker geproduceerde datumkolom een cache-bucket is.

---

## Wat dit betekent voor de reparatie

**DE SCHULD IS ECHT MAAR GOEDKOOP, en dat is nieuw — tot nu toe droeg punt 65 geen maat.** De
reparatie is niet urgent en niet groot:

1. De kern is één plek: `toD1Date`/`toD1DateTime` in `workers/api/src/db/dates.ts` gebruiken lokale
   getters. Wie de Worker op Amsterdam pint of de formattering expliciet maakt, dekt alle vijf de
   producenten in één keer.
2. Het gedrag dat vandaag afwijkt is een sync-venster dat in een venster van 1–2 uur per etmaal een
   dag te vroeg staat, en een cache-bucket die dan een overbodige refetch veroorzaakt.
3. Er is GEEN datamigratie nodig: er staat niets scheefs dat rechtgezet moet worden.

**WAT DE REPARATIE-RONDE MOET METEN VOORDAT ZIJ BOUWT:** of het pinnen van de Worker-TZ
(`compatibility_flags` of een expliciete formatteerlaag) de engine-selftest en de bestaande
D1-round-trips ongemoeid laat. Die keuze is niet in deze ronde gemaakt en hoort een eigen besluit te
zijn.

**EN ZIJ MOET DE RICHTING HEROVERWEGEN.** Twee metingen wijzen op dit moment TEGEN een simpele
Amsterdam-pin: de span van het sync-venster is onder UTC altijd exact `daysBack` en onder Amsterdam
59/60/61 dagen, en de datetime-round-trip is onder UTC exact en onder Amsterdam een uur scheef in
het DST-gat. Pinnen op Amsterdam repareert het middernachtvenster maar INTRODUCEERT die twee. De
waarschijnlijk betere vorm is de ms-aftrek vervangen door KALENDERrekenwerk en de formattering
expliciet maken, in plaats van de proceszone te verzetten — maar dat is een ontwerpbesluit dat op
een eigen meting hoort te rusten, niet op deze alinea.

---

## De weerleggingspas

Vier lenzen gestart, **twee voltooid en twee afgebroken op een server-fout** (`API Error: 529
Overloaded` en `Server error mid-response`). Dat is een gat in deze pas en het hoort genoemd: de
lenzen op de INVENTARIS (M-A) en op de PROD-DATA (M-C) zijn NIET gedraaid. Wat daar niet is
aangevallen, rust dus op mijn eigen meting alleen.

**DE HOOFDCLAIM IS NIET WEERLEGD.** Geen van beide voltooide lenzen vond een scheve rij op prod, en
de faalwijze die zij wél blootlegden — een tijdelijk ontbrekende rij — herstelt zichzelf bij de
volgende sync.

**WAT WEL KANTELDE, en alles hieronder is door mij hermeten voordat ik het overnam:** de te kleine
noemer van M-B (384 → 210.240), de onjuiste karakterisering "2 uur zomer, 1 uur winter", het
niet-constante percentage, de krimpende en groeiende span, de richting van de afwijking, en de
uitzondering op de round-trip-invariantie in het DST-gat. Alle zes staan hierboven verwerkt op de
plek waar de oorspronkelijke bewering stond.

**ÉÉN TEGENSPRAAK TUSSEN DE LENZEN, door mij beslecht.** De ene meldde verschillen op 21:00–22:00
UTC, de andere geen enkel verschil buiten 22 en 23. Eigen telling over 210.240 vergelijkingen: 0
buiten het venster. De eerste lens had ongelijk.

**EEN BEVINDING DIE IK OVERNEEM ZONDER HAAR TE KUNNEN WEERLEGGEN, en die de gate raakt:** geen
enkele test kijkt ooit naar een datum die de ambient klok PRODUCEERT. De sync-integratietests
wildcarden de now-query — het commentaar in `routes.sync.test.ts` zegt letterlijk *"Interceptor:
pint het pad-segment, WILDCARD de ambient-now-query"* — en `workerd-tz-probe.test.ts` erft de
TZ-pin van het vitest-proces, zodat de api-integratietests nooit onder UTC hebben gedraaid. **Een
regressie in het sync-venster komt dus groen door de gate.** Dat is geen bevinding over de
hoofdclaim maar over het VANGNET, en het hoort bij de reparatie-ronde.

<!-- EINDE docs/TZ-RECON.md -->
