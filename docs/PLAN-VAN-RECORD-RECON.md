# PLAN-VAN-RECORD — RECON (read-only, vóór de bouw)

**Status:** recon. Geen verdicts, geen model-regels, geen code-/engine-/schema-wijziging. Dit doc brengt in
kaart wat er NU staat, wie het leest, en welke drie landmijnen de bouw blokkeren.

**Methode.** Alle regelnummers uit eerdere reviews zijn opnieuw gegrept op de FUNCTIENAAM en geverifieerd;
correcties staan hieronder expliciet (§6). De bevroren GAS is van SCHIJF gelezen
(`C:\Users\daan\Projects\training`, HEAD `3e8090a`) — nooit via WebFetch. Waar de bron een review-claim
tegenspreekt: de BRON wint, en de tegenspraak staat genoteerd (§6).

---

## §1 — HUIDIG PLAN-VAN-RECORD-OPPERVLAK

### 1.1 `weekplans` — een WEEK-BLOB, geen per-dag-rijen

`workers/api/src/db/schema.ts:165`. Drie kolommen, PK = (`user_id`, `week_monday`):

```
userId       integer  → users.id
weekMonday   text     'yyyy-MM-dd' (maandag)
entriesJson  text     JSON-array van weekplan-entries (incl. sessies[])
```

De hele week is één opake JSON-blob. Er is geen per-dag-rij, geen per-sessie-rij, geen index op datum. Het
schema-commentaar (`schema.ts:16`) legt de bedoelde taakverdeling al vast: *"Per-sessie PLAN leeft in
weekplans.entries_json ('sessies'-array)."* Dat is exact de GAS-vorm (`weekplan_<maandag>`, §4).

**Schrijver.** `writeWeekplan` — `repo.ts:151` (review-anker BEVESTIGD). Full-replace upsert:

```ts
const vals = { userId, weekMonday, entriesJson: JSON.stringify(entries) };
await db.insert(weekplans).values(vals)
  .onConflictDoUpdate({ target: [weekplans.userId, weekplans.weekMonday], set: { entriesJson: vals.entriesJson } });
```

Er is geen merge, geen per-dag-patch: wie schrijft, schrijft de hele week. Dat is een ontwerp-eigenschap die
de freeze-vraag (§3b) scherp maakt — een gedeeltelijke herschrijving bestaat niet op dit oppervlak.

**Lezers.** `readWeekplan` (`repo.ts:171`, één week, parsed array of null) en `readRecentWeekplans`
(`repo.ts:193`, 8-weeks-venster, §1.3).

### 1.2 `PUT /api/weekplan/:monday` — de schrijf-route bestaat en heeft GEEN client-aanroeper

Route: `workers/api/src/routes/api.ts:638`. Valideert dat `body.entries` een array is en roept `writeWeekplan`.

**Geverifieerd met een repo-brede grep op `api/weekplan`:** buiten het route-bestand zelf zijn de enige
treffers `apps/web/src/lib/api.ts:140-142` (dat is de **GET** `weekplans/recent`, niet de PUT) en de
worker-tests `workers/api/test/routes.reads.test.ts:130-155` + `routes.writes.test.ts:150-174`.

**Conclusie: geen enkele client-code roept de PUT aan.** De client-API-laag (`apps/web/src/lib/api.ts`) heeft
alleen een lees-wrapper:

```ts
/** GET /api/weekplans/recent?monday= — recente weekplan-entries (opaque JSON-blob). */
export function getWeekplans(mondayISO: string): Promise<WeekplanEntries> {   // api.ts:141
  return apiGet<WeekplanEntries>(`/api/weekplans/recent?monday=${mondayISO}`);
}
```

Het plan-van-record-oppervlak is dus **compleet aan de schrijf-kant en volledig onbenut**. De bouw hoeft de
route niet te maken; hij moet 'm gaan aanroepen — en beslissen wanneer (§5.2).

### 1.3 `GET /api/weekplans/recent` + de intent-lezer

Route `api.ts:168` (query `monday` verplicht, optioneel `weeks` 1..52) → `readRecentWeekplans`
(`repo.ts:193`). Die haalt het venster in één query op en geeft de engine een **synchrone map-reader**, omdat
de engine-seam `gatherWeekplanEntries_` synchroon is en D1 async:

```ts
const map = new Map<string, any[] | null>();
for (const r of rows) {
  const parsed = r.entriesJson ? JSON.parse(r.entriesJson) : null;   // repo.ts:218 — GEEN try/catch
  map.set(`weekplan_${r.weekMonday}`, Array.isArray(parsed) ? parsed : null);
}
const reader = (key: string) => map.get(key) ?? null;
return gatherWeekplanEntries_(window, baseMonday, reader);           // repo.ts:222
```

**Consument:** `apps/web/src/lib/proposal.ts` — het resultaat is de `weekplans`-parameter waaruit
`intentByDateFrom` (`proposal.ts:131`) de `intentByDate`-map bouwt. Dat is de énige plek waar het
plan-van-record vandaag daadwerkelijk het plan beïnvloedt (§2).

**Neven-bevinding BEVESTIGD:** `repo.ts:218` doet `JSON.parse` zonder `try/catch`. Eén corrupte rij in het
8-weeks-venster laat de hele lees-call falen — niet alleen die week. GAS is hier robuuster: zowel
`gatherWeekplanEntries_` (`Algorithm.gs:979`, `catch → continue`) als `intentZonesForDate_`
(`Algorithm.gs:283`) en `plannedTypeForDate_` (`Algorithm.gs:1937`) vangen per-key af. Dit is een
port-afwijking, geen geërfd gedrag.

### 1.4 `planner_days.voorgesteld_type` en `.dag` — structureel null

Tabel `schema.ts:125`. Het schema-commentaar noemt de bedoelde relatie al: `voorgesteldType` = *"day-level
mirror (per-sessie plan → weekplans)"*, `gedaan` = *"day-level coarse flag; per-sessie actuals → activities"*.

Schrijver `writePlannerDays` (`repo.ts:352`). Alle drie review-ankers exact BEVESTIGD:

```ts
const vals = {
  userId, datum: d.datum,
  train: d.train ? 1 : 0,
  dag: null,                               // repo.ts:362
  minuten: d.train ? d.minuten : null,
  dagtype: d.train ? d.dagtype : null,
  toelichting: d.train ? d.toelichting : null,
  voorgesteldType: null,                   // repo.ts:366
  gedaan: 0,                               // repo.ts:367
};
```

Twee dingen die verder gaan dan "wordt niet gevuld":

1. De upsert doet `set: vals` — een bestaande waarde wordt bij elke planner-write **overschreven** naar
   null/0. Een schrijver die `voorgesteldType` vult, verliest 'm zodra de gebruiker het weekplan aanpast,
   tenzij de bouw dit adresseert.
2. De route weet het en zegt het: `api.ts:657` (boven `PUT /planner/:monday`, `api.ts:658`) —
   *"voorgesteldType/gedaan worden NIET geaccepteerd (de repo zet ze op null/0)."* De API weigert de velden
   dus bewust; dit is geen vergeten kolom maar een niet-afgemaakte baan.

**Consumenten van `voorgesteldType`:** `proposal.ts:314` (`plannedTypeByDate`, voedt `rpeSignal_`) en
`proposal.ts:426` (`plannedForDone`, de VOLTOOID-kaart). Beide krijgen vandaag niets (§2).
**Consument van `gedaan`:** `proposal.ts:244`/`:269`/`:301`/`:345` (grid, dekking-loop, `zoneDebt_`,
tePlannen-filter). Ook die krijgt vandaag een constante 0 (§2).
**`dag`** wordt door de web-app niet gelezen als bron van waarheid — de dagnaam volgt uit `datum`; deze null
is de onschuldigste van de drie.

### 1.5 `day_state.override_json`

`schema.ts:207`, kolom `overrideJson` (`:214`). Dit is het énige stukje plan-gerelateerde staat dat WEL
volledig rondgaat: `repo.ts:498-506` leest alle niet-lege overrides (`JSON.parse` naar `DayOverride`) en
`repo.ts:523-529` schrijft ze per datum. Consument: de proposal-laag past de override toe op plannbare dagen
(`proposal.ts:370-374`: *"een override op een plannbare dag (niet-gedaan, ≥ vandaag)"*).

Relevant voor de bouw: `day_state` is het bewijs dat het patroon "per-datum-staat, door de client geschreven,
door de proposal gelezen" hier al werkt. Het is het dichtstbijzijnde model voor de plan-van-record-schrijver.
Let op de koppeling: de plannbaarheid-test gebruikt `!d.gedaan` — zodra `gedaan` echt gevuld wordt, verandert
het gedrag van de override-laag mee.

---

## §2 — CONSUMENTEN-KAART

Per consument: welk VELD hij leest, op welke exacte plek, wat hij NU krijgt, en wat hij krijgt zodra het
plan-van-record gevuld is.

### 2.1 `intentByDateFrom` — de poort waar alles doorheen gaat

`proposal.ts:131`, gevoed door `getWeekplans` (§1.3). Leest per entry precies twee velden:

```ts
const e = raw as { datum?: unknown; intent?: unknown };
if (typeof e?.datum !== "string") continue;
const it = e.intent as Partial<ZoneBuckets> | undefined;   // proposal.ts:136 (anker BEVESTIGD)
if (!it) continue;
out[e.datum] = { low: Number(it.low) || 0, high: Number(it.high) || 0, anaerobic: Number(it.anaerobic) || 0 };
```

Het leest `intent` (MINUTEN per bucket) en **negeert `zones`** (de bucket-SET). Dat is landmijn 3a.

**NU:** `weekplans` wordt nooit geschreven → de tabel is leeg → `intentByDate = {}` voor elke datum.
**STRAKS:** een per-datum minuten-map, mits de schrijver `intent` meeschrijft in de GAS-vorm.

### 2.2 `rollingZoneCoverage_` — dekking-booleans

`packages/engine/src/weekprep.ts:58` (review noemde `:76`; de functie begint op **`:58`**, de
intent-tak zit rond `:76` — correctie in §6). Leest `intentByDate[key]` en test **`> 0` per bucket**:

```ts
const iz = intentByDate[key];
if (iz && (iz.low > 0 || iz.high > 0 || iz.anaerobic > 0)) {
  if (iz.low > 0) cov.low++;
  if (iz.high > 0) cov.high++;
  if (iz.anaerobic > 0) cov.anaerobic++;
  return;
}
const iff = Number(r[7]) || 0;   // IF-fallback (idx7), één bucket
```

**NU:** lege map → de intent-tak vuurt nooit → **elke** activiteit valt op de IF-fallback terug (één bucket
per rit, uit de IF-drempels 0,80/0,85/0,95). Dat is de botte modus.
**STRAKS:** multi-bucket telling per geplande rit — met de misteling uit 3a.
Doorwerking: `dekking` (`proposal.ts:262`) → `assignWorkouts` → type-keuze.

### 2.3 `zoneDebt_` / `computeZoneDebt_` — minuten-tekort

`weekprep.ts:95` (def), aangeroepen op `proposal.ts:296`. Krijgt drie dingen: `intentByDate`, de
planner-vlaggen (`{datum, train, gedaan}`, `proposal.ts:298-302`) en de activiteiten. Kern (`weekprep.ts:121-125`):

```ts
const intent = intentByDate[key] || { low: 0, high: 0, anaerobic: 0 };
debt.low += (intent.low || 0) - actual.low;
...
```

**NU dubbel dood.** (a) `intentByDate` is leeg → intent = 0 → debt kan alleen negatief worden. (b) De gating
vereist `train && gedaan`, en `gedaan` komt uit `planner_days.gedaan` = altijd 0 (`repo.ts:367`) → de lus
draait nul keer. Gevolg: `debtActief` (`planner.ts:503`) is nooit waar.
**STRAKS:** echte minuten-tekorten per bucket. Dit is de motor achter de inhaal-sessies (2.6).

### 2.4 `recentHardDate_` — avoid-consecutive-hard

`weekprep.ts:134`, aangeroepen `proposal.ts:306`. Leest `intentByDate[key]` en test alleen
`iz.high > 0 || iz.anaerobic > 0` (`weekprep.ts:146`); anders IF ≥ 0,85.

**NU:** valt volledig terug op de IF-heuristiek. **STRAKS:** een geplande harde dag telt ook als hard zonder
dat de IF hoog uitviel. Let op: deze consument leest **niet** `low`, en is daarmee immuun voor de
low-misteling uit 3a — de enige van de drie.

### 2.5 `rpeSignal_` / `plannedTypeByDate` — het RPE-pad

`proposal.ts:312-317`:

```ts
const plannedTypeByDate: Record<string, string> = {};
for (const pd of plannerDays || []) {
  if (pd.voorgesteldType) plannedTypeByDate[pd.datum] = pd.voorgesteldType;   // proposal.ts:314 (anker BEVESTIGD)
}
const rSig = rpeSignal_(rpe || [], plannedTypeByDate, todayLocalISO);
```

**NU:** `voorgesteldType` is altijd null (`repo.ts:366`) → de map is leeg → `rpeSignal_` filtert alles weg
(`expectedRpe_ == null`) → altijd `normal`. De sensor is bedraad maar uitgehongerd (R3-T30).
**STRAKS:** `rpeSignal_` gaat vuren, `combineSignals_` (`proposal.ts:338`) neemt de zwaarste van band en RPE,
en dat signaal stuurt de demote in `assignWorkouts`. **Dit is geen neutrale vulling:** het plan-van-record
vullen zet een stille beslisser aan (R3-T30/T22, M30/M15/M18). Zie §5.2 — dit hoort een expliciete
bouw-beslissing te zijn, geen bijwerking.

### 2.6 `catchup_*` — de inhaal-redenen

`planner.ts:664` (`catchup_high`), `:670` (`catchup_anaerobic`), `:694` (`catchup_` + bucket voor vrije
dagen). Review noemde `:659-694`; het blok loopt feitelijk van `:657` (weekend-tak) t/m `:694` — de drie
`redenCode`-toewijzingen staan exact op 664/670/694 (correctie in §6). Alle drie hangen aan `debtActief` +
`debtWerk`, dus aan 2.3.

**NU:** onbereikbaar. Geen enkele inhaal-sessie kan ooit voorgesteld worden.
**STRAKS:** het weekend-blok forceert `combo_long_with_efforts` bij een high/anaerobic-tekort, en vrije dagen
krijgen `debtPreferredType_`. Dit is precies de "inhalen"-helft van de twee-richtingen-coach — die bestaat
dus al in de engine en wacht alleen op data.

### 2.7 `plannedForDone` — de VOLTOOID-kaart

`proposal.ts:419-435` (review noemde `:426`; `:426` is de toewijzing `plannedForDone = buildWorkout(...)`,
het blok begint op `:419` — correctie in §6). Voorwaarde: `!tePlannenSet.has(d.dagIdx) && d.train &&
d.voorgesteldType && d.minuten`.

**NU:** `d.voorgesteldType` is null → de kaart valt altijd terug op de gereduceerde vorm; er is geen
plan-vs-gedaan-vergelijking.
**STRAKS:** de geplande workout wordt **opnieuw berekend** uit `voorgesteldType` + minuten + de
settings-van-NU. Dat is landmijn 3b.

### 2.8 De recency-seed

`planner.ts:526-533`. Zie 3c — dit is de enige consument met twee gescheiden banen.

---

## §3 — DE DRIE LANDMIJNEN

### 3a — ZONES vs INTENT: GAS draagt TWEE velden, Cadans leest er één

**Wat GAS schrijft.** In de weekplan-entry staan twee onafhankelijke velden, met verschillende types:

```
Algorithm.gs:243    zones:  Object.keys(zoneSet),   // bucket-SET, string[]
Algorithm.gs:244    intent: aggIntent,              // bucket-MINUTEN, {low,high,anaerobic}
```

Beide review-ankers exact BEVESTIGD.

**Wat GAS met welk veld doet.** De scheiding is functioneel, niet cosmetisch:

- `intentZonesForDate_` (`Algorithm.gs:278`) leest **`plan[i].zones`** — de SET. Consumenten:
  `rollingZoneCoverage` (`Algorithm.gs:318`: `intentZones.forEach(z => cov[z]++)`) en `recentHardDayDate_`
  (`Algorithm.gs:347`: `iz.indexOf('high') >= 0`).
- `intent` (de MINUTEN) voedt de debt-kant, en wordt bij het schrijven per sessie samengesteld via
  `ensureIntent_` (`Algorithm.gs:768`, aangeroepen op `:223` en `:253`).

**Is `intentZonesForDate_` geport?** Nee — bevestigd. De enige treffers in `packages/engine/src` zijn twee
commentaar-regels (`weekprep.ts:6` en `:12`) die de functie noemen als GAS-origineel. Er is geen
implementatie en geen aanroeper.

**Wat Cadans in plaats daarvan doet.** De engine-header (`weekprep.ts:12-16`) declareert de afwijking
expliciet, mét zijn geldigheidsvoorwaarde:

> *"Het GAS-weekplan draagt ZOWEL `zones` (bucket-SET, via intentZonesForDate_) ALS `intent` (bucket-MINUTEN,
> via p.intent). Hier is de input één minuten-shape (ZoneBuckets); "bucket in de set" ⇔ `intent[bucket] > 0`.
> Klopt zolang het weekplan `zones = Object.keys(zoneSet)` bevat (buckets met minuten) — standaard."*

**Die geldigheidsvoorwaarde is gemeten en klopt NIET.** `ensureIntent_` (`planner.ts:119`, byte-getrouw aan
`Algorithm.gs:768`) fabriceert low-minuten voor élke workout die geen eigen `intent` meelevert:

```ts
const per = Math.round((total * 0.45) / workZones.length);
workZones.forEach((z) => { if (intent[z] != null) intent[z] += per; });
intent.low = Math.max(0, total - per * workZones.length);   // → 55% van total, ALTIJD > 0
```

En zulke workouts bestaan: templates met `zones: ["high"]` (`planner.ts:1908`, `:1945`),
`zones: ["anaerobic"]` (`:1723`, `:1834`, `:1871`) en `zones: ["high","anaerobic"]` (`:2252`) leveren geen
eigen `intent` mee. Voor `zones: ["high"]` met 80 minuten geeft `ensureIntent_`: `high = 36`, `low = 44`.

**Gevolg, concreet.** Een pure threshold-rit telt in GAS als `cov.high++`. In Cadans telt hij als
`cov.high++` **én** `cov.low++`, want `iz.low = 44 > 0`. Cadans overschat de low-dekking systematisch. De fout
is eenzijdig (alleen richting `low`, want alleen `low` wordt gefabriceerd) en raakt `rollingZoneCoverage_`
wél en `recentHardDate_` niet (die leest alleen high/anaerobic). Via `dekking.low` gaat de fout door naar de
type-keuze: `!dekking.low` is de trigger voor `long_z2` in het weekend-blok (`planner.ts:671`) — een
ten-onrechte-gedekte low betekent dus een gemiste lange duurrit.

**Belangrijk:** dit is nu latent. Met een lege `weekplans`-tabel vuurt de intent-tak nooit. **Het
plan-van-record vullen activeert deze fout.** Dat maakt 3a een bouw-blokkade, niet een losse bug.

**Beslissing die voorligt.** Twee opties:

- **(A) Client-side pariteit.** `intentByDateFrom` (`proposal.ts:131`) leest óók `e.zones` en levert de
  engine een expliciete bucket-set naast de minuten. Vereist een tweede map + een tweede param op
  `rollingZoneCoverage_`/`recentHardDate_` → **dat is een engine-signatuur-wijziging**, dus niet echt
  "client-side".
- **(B) Schrijf-vorm-pariteit zonder engine-wijziging.** De schrijver zet de entry-`intent` op nul voor
  buckets die niet in `zones` zitten. Dan geldt `intent[b] > 0 ⇔ b ∈ zones` weer, precies zoals de
  engine-header aanneemt, en de engine hoeft niet aangeraakt. Kosten: de `intent`-minuten in de blob wijken af
  van GAS' `ensureIntent_`-uitkomst — de blob is dan niet meer byte-vergelijkbaar met een GAS-export, wat de
  migratie-vergelijking (R4) bemoeilijkt.

**Aanbeveling: (B), met de afwijking gedocumenteerd in de schrijver.** Grond: het houdt de engine
read-only, het herstelt exact de aanname die de engine-header al declareert, en het raakt één plek in plaats
van drie. De prijs (blob wijkt af van GAS) is beheersbaar omdat de migratie-import (R4) sowieso een
transformatie-stap heeft. Kanttekening: als de migratie de GAS-blobs *ongewijzigd* importeert, komt de fout
via die weg alsnog binnen — dan is (A) alsnog nodig. **Deze afhankelijkheid moet vóór de bouw beslist.**

### 3b — VERLEDEN-RECONSTRUCTIE (V24): waar ligt de freeze-grens?

**Wat Cadans doet.** `proposal.ts:419-435`: voor een verstreken trainingsdag wordt de geplande workout
**opnieuw gebouwd** met `buildWorkout(d.voorgesteldType, d.minuten, settingsE, mesoWeek, macroFase, ...)` —
dus met de settings, FTP, mesoWeek en macrofase van **NU**. De opmerking erboven zegt het zelf:
*"reconstrueer de geplande workout (deterministisch uit voorgesteldType + planner-minuten)"*. Deterministisch
in de invoer, ja — maar de invoer schuift mee met de tijd. Verhoogt Daan zijn FTP, dan veranderen met
terugwerkende kracht de watt-targets van de rit die hij vorige maand reed.

**Wat GAS doet.** GAS reconstrueert niet; het bevriest. `snapshotDayAction_` (definitie **`Algorithm.gs:57`**;
aangeroepen op **`Algorithm.gs:185`** — de review noemde `:186`, correctie in §6) beslist per dag vóór de
train/type-guard:

```js
var action = snapshotDayAction_(dISO, todayISO, !!prevByDate[dISO], d.train, d.voorgesteldType);
if (action === 'freeze') { weekplan.push(prevByDate[dISO]); return; }   // Algorithm.gs:186
if (action === 'skip') return;                                          // Algorithm.gs:187
```

De begeleidende opmerking (`Algorithm.gs:182-184`) noemt het "freeze-first" en geeft de reden: een VOORBIJE
dag moet zijn vorige entry behouden *"i.p.v. te verdwijnen"*. De GAS-zelftest legt de volledige
waarheidstabel vast (`SelfTest.gs:748-758`): verleden + vorige entry → `freeze`, óók als het type leeg is en
óók als de beschikbaarheid uit staat; verleden zonder vorige entry mét type → `rebuild`; vandaag/toekomst →
altijd `rebuild`, nooit bevriezen.

**De freeze-grens ligt dus in GAS bij: `datum < vandaag` ÉN er is een vorige entry.** Alles vanaf vandaag
volgt het nieuwe plan. Precies die grens ontbreekt in Cadans, omdat Cadans geen snapshot heeft om naar terug
te vallen — de reconstructie ís de fallback.

**Wat dit voor de bouw betekent.** Zodra `weekplans` echt geschreven wordt, is er wél een snapshot, en dan
moet de schrijver `snapshotDayAction_`-semantiek krijgen: verleden bevriezen, heden/toekomst herbouwen. Doet
hij dat niet, dan overschrijft elke render het verleden met de reconstructie-van-nu en is de historie
permanent weg — precies het gat dat R4 als migratie-voorwaarde markeerde. `snapshotDayAction_` is **niet
geport** (geen treffer in `packages/engine/src`); hij is puur en klein, dus een port is goedkoop — maar het
is wél een engine-toevoeging (§5.4).

**Open, niet hier te beslissen:** of `plannedForDone` (de VOLTOOID-kaart) na de bouw uit de bevroren blob
moet lezen in plaats van te reconstrueren. Dat is de logische eindtoestand en het maakt V24 vanzelf dood,
maar het verandert een bestaande, werkende UI-baan.

### 3c — RECENCY-SEED (V15): twee banen, één hardcoded

**Baan 1 — in de engine, doodgelegd.** `planner.ts:526-533`:

```ts
qualityRecency = recencyFromWeekplan_(
  gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, null, null),   // planner.ts:531 (anker BEVESTIGD)
  null,
);
```

De derde `null` is de `readWeekplan`-accessor. In `gatherWeekplanEntries_` (`planner.ts:454`) betekent dat
`const raw = readWeekplan ? readWeekplan(key) : null` → altijd null → `out` blijft leeg → **de seed is altijd
leeg**. De opmerking erboven benoemt het: *"DATA-IN: het weekplan-lees-pad is untested in de port →
null-accessor (geen seed)."* `RECENCY_HORIZON_WEEKS = 8` (`planner.ts:447`).

**GAS-vergelijking.** `Algorithm.gs:1015`: `recencyFromWeekplan_(gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS), null)`
— review-anker BEVESTIGD. GAS' `gatherWeekplanEntries_` (`Algorithm.gs:971`) heeft **twee** parameters
(`horizonWeeks, baseMonday`) en leest de DocProps rechtstreeks binnenin (`getDocProp('weekplan_' + ...)`,
`:976`). De derde parameter in Cadans is puur een port-artefact: de IO is naar buiten geduwd om de engine
puur te houden. GAS heeft dus een gevulde seed; Cadans niet.

**Gevolg:** de archetype-rotatie mijdt niets over weekgrenzen heen. Dezelfde intervalvorm kan weken achtereen
terugkomen zonder dat de engine dat merkt.

**Baan 2 — in de repo, wél gevoed.** `readRecentWeekplans` (`repo.ts:193`) bouwt de map-reader en roept
`gatherWeekplanEntries_(window, baseMonday, reader)` (`repo.ts:222`). Deze baan werkt zodra de tabel gevuld
is — maar hij voedt de **proposal-intent** (§2.1), niet de recency-seed binnen `assignWorkouts`.

**De kern van de landmijn.** Baan 1 zit *binnen* `assignWorkouts`, en `assignWorkouts` (`planner.ts:475`)
heeft **twaalf** parameters:

```
days · settings · mesoWeek · macroFase · dekking · wellness · klimType ·
recentHardDate · debt · isTripEvent · taperCtx · weekDays
```

Geen daarvan is een reader of een entry-lijst. Baan 1 kan dus niet gevoed worden zonder óf een dertiende
parameter, óf een gevulde `qualityRecency` als parameter in plaats van een intern-berekende. Beide zijn een
wijziging aan de publieke signatuur van de meest centrale engine-functie.

> **AUTHORISATIE-VEREIST — ENGINE-SIGNATUUR-WIJZIGING.** `assignWorkouts` uitbreiden met een
> weekplan-reader (of een voorgekookte `qualityRecency`). De signatuur is 1:1 met GAS
> (`Algorithm.gs:985`, identieke twaalf params in dezelfde volgorde); elke uitbreiding breekt die
> pariteit bewust. Aanbevolen variant: een **dertiende, optionele** param die default-null is, zodat
> bestaande aanroepers en de engine-zelftest ongewijzigd blijven en de GAS-vergelijking leesbaar blijft.
> Niet uitvoeren zonder expliciet akkoord van Daan.

**Neven-bevinding (raakt beide banen):** de ongeguarde `JSON.parse` op `repo.ts:218` (§1.3). Fix dit
tegelijk — GAS vangt hier per key af (`Algorithm.gs:979`).

---

## §4 — DE GAS-SCHRIJF-VORM (pariteit, van schijf)

Alle ankers hieronder zijn opnieuw gegrept en exact BEVESTIGD op `3e8090a`.

### 4.1 Drie spiegels, één schrijf-ronde

`generateProposal` schrijft het plan naar drie plekken:

| # | Plek | Anker | Wat er per dag in gaat | Levensduur |
|---|---|---|---|---|
| 1 | Sheet-kolom G | `Algorithm.gs:148` `writeVoorgesteldType(ss, days)` | alleen `voorgesteldType` (leeg bij gemist) | tot de volgende rollover |
| 2 | DocProp `proposal_<dISO>` | `Algorithm.gs:213` `writeDaySessions_(dISO, sessions)` | de volledige workout, sessie 1 = basiskey, sessie n≥2 = `_s<n>` | tot de volgende `cleanupOldProposals_` |
| 3 | DocProp `weekplan_<maandag>` | `Algorithm.gs:257` `setDocProp('weekplan_' + ..., JSON.stringify(weekplan))` | de per-dag-aggregaat-entry (zie 4.2) | **durabel** |

De opbouw van spiegel 1 (`Algorithm.gs:140-147`) laat zien dat kolom G een afgeleide is: `tePlannen` en
`voltooid` leveren hun `voorgesteldType`, `missed` levert leeg, en dagen zonder entry worden expliciet op
leeg gezet.

### 4.2 Wat `weekplan_<maandag>` per dag draagt

`Algorithm.gs:238-256`. Per dag één entry:

```
datum · workoutType · archetypeId · naam · variantId ·
zones (Object.keys(zoneSet))       ← :243, de bucket-SET
intent (aggIntent)                 ← :244, de bucket-MINUTEN
blokken · structuur · tss · minuten · reden ·
sessies[] : { naam, totaalMin, tss, intent (per sessie, via ensureIntent_), eindopmerking }
```

De aggregatie (`Algorithm.gs:217-229`) sommeert minuten, TSS en intent over de sessies en voegt zones,
blokken en structuur samen. `ensureIntent_` wordt twee keer aangeroepen: per sessie voor het aggregaat
(`:223`) en nog eens voor de `sessies[]`-array (`:253`).

Dit is precies de vorm die `weekplans.entries_json` in D1 moet dragen — het schema-commentaar
(`schema.ts:16`, *"per-sessie PLAN leeft in weekplans.entries_json ('sessies'-array)"*) verwijst hiernaar.

### 4.3 Alleen spiegel 3 is durabel

`cleanupOldProposals_` (`Algorithm.gs:723`, anker BEVESTIGD) verwijdert **alle** proposal-keys:

```js
props.getKeys().forEach(function (k) {
  if (k.indexOf('proposal_') === 0) props.deleteProperty(k);  // dekt ook _s<n> (prefix-match)
});
```

Aangeroepen aan het begin van elke `generateProposal` (`Algorithm.gs:76`). Spiegel 2 is dus per definitie
kortstondig. Spiegel 1 wordt door de rollover gewist. **`weekplan_<maandag>` is het enige durabele
plan-van-record** — en dat is geen toevalligheid maar een gedocumenteerd ontwerp: de commentaar bij
`rpeLastWeekMismatch_` (`Algorithm.gs:2002-2003`) zegt letterlijk dat `weekplan_<vorige-maandag>` *"per
maandag, niet gewist door cleanupOldProposals_"* is.

### 4.4 De lezers bewijzen dat het een snapshot is, geen historie

`plannedTypeForDate_` (`Algorithm.gs:1931`, anker BEVESTIGD) leest in strikte volgorde: eerst
`weekplan_<mondayISO>` (`:1933-1936`), en pas als fallback `proposal_<dISO>` (`:1939-1941`). De durabele
spiegel wint dus van de vluchtige.

`rpeLastWeekMismatch_` (`Algorithm.gs:2005`) is het beslissende bewijs. Hij loopt de **vorige** week af en
haalt per dag het verwachte RPE op uit het plan van tóén:

```js
var exp = expectedRpe_(plannedTypeForDate_(dISO, lastMondayISO));   // Algorithm.gs:2015
```

Als `weekplan_<vorige-maandag>` met de settings-van-nu herbouwd zou worden, is deze vergelijking betekenisloos
— je vergelijkt het ervaren RPE dan met een plan dat nooit gereden is. **De snapshot is dus dragend voor een
lopende beslissing, niet een archief.** Dat is de sterkste grond onder de freeze-eis uit 3b: bevriezen is niet
netjes-zijn tegenover de historie, het is een voorwaarde voor de correctheid van de RPE-terugkoppeling.

---

## §5 — AANPAK-VOORSTEL + OPEN BESLISSINGEN

### 5.1 HOME-keuze: waar leest het beginscherm het plan?

Twee kandidaten: de `weekplans`-week-blob, of `planner_days.voorgesteld_type` (de dag-spiegel).

**Aanbeveling: de `weekplans`-week-blob als bron van waarheid, met `planner_days.voorgesteld_type` als
afgeleide dag-spiegel die in dezelfde transactie meegeschreven wordt.**

Gronden:

1. **De blob is de enige vorm die volledig is.** `voorgesteld_type` draagt één string per dag; de blob draagt
   naam, zones, intent, blokken, structuur, TSS, minuten, reden én de `sessies[]`-array. `plannedForDone`
   (§2.7) en de VOLTOOID-vergelijking hebben die rijkdom nodig; de dag-spiegel kan ze niet leveren zonder de
   reconstructie die 3b juist wil afschaffen.
2. **GAS doet het zo, en de lezers hangen eraan.** `plannedTypeForDate_` leest de blob eerst (§4.4); kolom G
   (de GAS-tegenhanger van `voorgesteld_type`) is een afgeleide die de rollover wist. De spiegel navolgen in
   plaats van de bron zou de enige durabele plek wegkiezen.
3. **De lees-baan bestaat al en werkt.** `GET /weekplans/recent` → `readRecentWeekplans` →
   `intentByDateFrom` is compleet bedraad (§1.3, §2.1); alleen de schrijver ontbreekt. De dag-spiegel-baan
   zou vanaf nul bedraad moeten worden én zou de API-weigering op `api.ts:657` moeten opheffen.
4. **De dag-spiegel blijft wél nodig** — maar als afgeleide, niet als bron. `plannedTypeByDate` (§2.5) leest
   `voorgesteldType` per planner-dag, en dat pad omschrijven naar de blob is extra werk zonder winst. Schrijf
   'm mee, lees 'm waar hij nu al gelezen wordt.

Uit (4) volgt een concreet aandachtspunt: `writePlannerDays` overschrijft `voorgesteldType` naar null bij elke
planner-write (`repo.ts:366` + `set: vals`, §1.4). Als de dag-spiegel meegeschreven wordt, moet die upsert
selectief worden, anders wist een weekplan-aanpassing de spiegel.

### 5.2 Wanneer schrijft de schrijver, en wat bevriest hij?

**Het probleem: er is geen "Genereer voorstel"-knop.** In GAS is `generateProposal` een expliciete,
gebruiker-getriggerde actie — dat is precies het moment waarop de drie spiegels geschreven worden en het
verleden bevroren wordt. In Cadans wordt het voorstel **live bij elke render opnieuw opgebouwd**
(`buildWeekProposal` in `proposal.ts`). Er is dus geen natuurlijk schrijf-moment.

Dat maakt dit de zwaarste open beslissing van de bouw. Drie richtingen, in volgorde van mijn voorkeur:

- **(i) Schrijf-op-eerste-render-per-dag, met freeze-semantiek.** Bij het renderen van de week: als er voor
  een dag nog geen entry is en de dag is vandaag/toekomst → schrijf. Is de dag verleden en er ís een entry →
  laat staan (`snapshotDayAction_`-semantiek, §3b). Voordeel: geen UI-wijziging, en het verleden komt
  automatisch vast te staan. Nadeel: een render is dan een schrijf-actie — idempotent, maar wel een
  neveneffect op een leespad.
- **(ii) Expliciete bevestig-actie.** Sluit aan bij de twee-richtingen-coach ("voorstel-en-bevestig") uit het
  R4-pakket: de gebruiker bevestigt de week, en dán pas wordt geschreven. Zuiverder, maar het laat het plan
  ongeschreven zolang er niets bevestigd is — en dan blijven alle consumenten uit §2 leeg.
- **(iii) Schrijven bij de planner-write.** Koppelen aan `PUT /planner/:monday`. Eenvoudig qua trigger, maar
  fout van moment: op dat punt is het weekplan bekend, het *voorstel* nog niet.

**Wat hier eerst beslist moet worden, vóór de code:** het aanzetten van het plan-van-record activeert
`rpeSignal_` als stille beslisser (§2.5) — een demote achteraf, zonder voorstel. R3-T30/T22 markeerden dat als
een modelschending (M30/M15/M18). Als de schrijver landt zonder dat dit geadresseerd is, komt die schending
er als bijwerking bij. Twee uitwegen: het RPE-pad tijdelijk ontkoppelen tot de twee-richtingen-coach staat,
óf de demote als voorstel presenteren in plaats van 'm stil door te voeren. Dit is een model-beslissing,
niet een implementatie-detail.

### 5.3 `gedaan`: afgeleid-bij-lezen of kolom-bij-schrijven?

`gedaan` is nu een dode kolom (`repo.ts:367`), en vier consumenten hangen eraan (§2.3, §1.4).

**Aanbeveling: afgeleid-bij-lezen.** De waarheid over "is deze dag gereden" staat al in `activities` — dat is
de tabel die de sync vult en die de zone-minuten levert waar `zoneDebt_` toch al doorheen loopt
(`zoneActsByDateFromTab_`, `proposal.ts:267`). Een `gedaan`-kolom zou een tweede waarheid introduceren die kan
divergeren, en die bij elke `writePlannerDays` opnieuw op 0 gezet wordt. Afleiden bij het samenstellen van de
`PlannerDay`-DTO's houdt één bron.

Kanttekening die de bouw moet meenemen: de dispositie-laag (`day_state`) kan een dag op "gemist" zetten
zónder activiteit. `gedaan` afleiden betekent dus: *er is een activiteit* OF *de dag is expliciet
afgehandeld*. Die tweede helft moet expliciet, anders blijft een bewust overgeslagen dag eeuwig "te doen".
Let ook op de terugkoppeling naar de override-laag (§1.5): `!d.gedaan` is daar de plannbaarheid-test.

### 5.4 Alle engine-wijzigingen op één plek

> **AUTHORISATIE-VEREIST (1) — `assignWorkouts`-signatuur.** Een dertiende (optionele, default-null)
> parameter voor de weekplan-reader of de voorgekookte `qualityRecency`, om baan 1 van de recency-seed te
> voeden (§3c). Breekt bewust de 1:1-signatuur-pariteit met `Algorithm.gs:985`.

> **AUTHORISATIE-VEREIST (2) — `snapshotDayAction_` porteren.** Puur, klein, en volledig gespecificeerd door
> de GAS-zelftest (`SelfTest.gs:748-758`), maar het is een nieuwe engine-functie (§3b). Alternatief: de
> freeze-beslissing in de worker-laag implementeren en de engine ongemoeid laten — dan wijkt de logica af van
> de plek waar GAS 'm heeft, maar blijft de engine dicht. **Mijn voorkeur: in de worker**, omdat de beslissing
> over *wanneer* geschreven wordt (§5.2) daar toch al thuishoort.

> **AUTHORISATIE-VEREIST (3), voorwaardelijk — zones-naast-intent.** Alleen nodig als voor optie (A) uit §3a
> gekozen wordt: een extra bucket-set-param op `rollingZoneCoverage_` en `recentHardDate_`. Met de aanbevolen
> optie (B) is deze niet nodig en blijft de engine read-only.

**Niet-engine, wel deze bouw:** de `try/catch` om `repo.ts:218` (§1.3) en de selectieve upsert in
`writePlannerDays` (§5.1).

**Antwoord op "zijn engine-wijzigingen nodig?": ja, één onvermijdelijk (1), één vermijdbaar (2, kan in de
worker), één voorwaardelijk (3, vervalt bij de aanbevolen 3a-route).**

### 5.5 Raakvlak met carry-forward (V14)

V14: de slot-toewijzing gebruikt de **array-positie** als dag-index (`dagIdx` in de grid-opbouw,
`proposal.ts:239`: `(plannerDays || []).map((pd, i) => ({ dagIdx: i, ... }))`). De index is dus positioneel,
niet datum-gebaseerd.

Gevolg voor de bouw: **een carry-forward moet altijd zeven rijen leveren**, ook voor dagen zonder training.
Levert hij er minder, dan schuiven alle volgende dagen een positie op en wijst het plan naar de verkeerde
dagen — een stille, moeilijk te zien fout. Dit raakt de plan-van-record-schrijver direct, omdat die per week
schrijft en de blob-entries per datum zijn: bij het terugvertalen blob → grid moet de zeven-rijen-invariant
expliciet afgedwongen worden, niet aangenomen.

---

## §6 — CORRECTIES EN TEGENSPRAKEN

### 6.1 Gecorrigeerde regel-ankers

| Claim uit de review | Werkelijk | Aard |
|---|---|---|
| `repo.ts:222` = de intentByDate-lezer | De **functie** `readRecentWeekplans` begint op **`repo.ts:193`**; `:222` is de `gatherWeekplanEntries_`-aanroep erbinnen | verfijning — `:222` was niet fout, maar wees de functie niet aan |
| `weekprep.ts:76` = `rollingZoneCoverage_` | De functie begint op **`weekprep.ts:58`**; `:76` valt binnen de intent-tak | gedrift |
| `proposal.ts:426` = `plannedForDone` | Het blok begint op **`proposal.ts:419`**; `:426` is de toewijzing `plannedForDone = buildWorkout(...)` | verfijning |
| `planner.ts:659-694` = `catchup_*` | Het blok loopt van **`:657`** t/m `:694`; de drie `redenCode`-toewijzingen staan op **`:664`**, **`:670`**, **`:694`** | verfijning |
| `Algorithm.gs:186` = `snapshotDayAction_` | **Definitie op `Algorithm.gs:57`**; de aanroep op **`:185`**; `:186` is de freeze-tak (`weekplan.push(prevByDate[dISO])`) | gedrift + definitie-vs-aanroep |

**Ongewijzigd bevestigd:** `repo.ts:151` · `repo.ts:362` · `repo.ts:366` · `repo.ts:367` · `proposal.ts:136` ·
`proposal.ts:314` · `planner.ts:531` · `Algorithm.gs:148` · `:213` · `:243` · `:244` · `:257` · `:723` ·
`:1015` · `:1931`.

### 6.2 Tegenspraken tussen bron en review (bron wint)

1. **`intentZonesForDate_` "niet geport" — bevestigd, maar de review beschreef het gevolg te mild.** De
   functie ontbreekt inderdaad (alleen twee commentaar-vermeldingen, `weekprep.ts:6` en `:12`). De bron laat
   echter zien dat het niet om één ontbrekende helper gaat maar om een **type-verschil**: GAS' `zones` is een
   `string[]`, Cadans' vervanging is een minuten-object. De engine-header declareert de aanname
   `intent[b] > 0 ⇔ b ∈ zones`, en `ensureIntent_` (`planner.ts:119` / `Algorithm.gs:768`) breekt die aanname
   structureel door voor elke zonder-eigen-intent-workout 55% low-minuten te fabriceren (§3a, gemeten op de
   templates `planner.ts:1908`, `:1945`, `:1723`, `:1834`, `:1871`, `:2252`). De misteling is dus geen
   randgeval maar het normale geval, en hij is eenzijdig (alleen `low`).

2. **`assignWorkouts`-parameters.** De opdracht vroeg het aantal te tellen: **twaalf**
   (`planner.ts:475-488`), identiek in naam en volgorde aan GAS (`Algorithm.gs:985`). Geen van de twaalf is
   een reader — de review-claim dat een reader-param nodig is, is daarmee BEVESTIGD.

3. **`gatherWeekplanEntries_`-ariteit.** GAS heeft **twee** params (`Algorithm.gs:971`: `horizonWeeks,
   baseMonday`) en doet de IO binnenin; Cadans heeft er **drie** (`planner.ts:454`, derde = `readWeekplan`).
   De derde is een port-artefact van de purity-eis, geen GAS-feature. Relevant omdat het laat zien dat de
   reader-injectie in deze codebase al een geaccepteerd patroon is — het precedent voor
   AUTHORISATIE-VEREIST (1) bestaat dus binnen dezelfde functie-familie.

4. **De review noemde `repo.ts:218` als "neven-bevinding".** De bron maakt het scherper: GAS vangt op alle
   drie de weekplan-leespaden per key af (`Algorithm.gs:979`, `:283`, `:1937`). De ongeguarde parse is dus een
   port-afwijking van een expliciet GAS-patroon, niet een over het hoofd gezien detail.

---

*Recon, geen bouw. Geen code-, engine- of schema-wijziging in dit doc. `packages/engine` ongemoeid;
`C:\Users\daan\Projects\training` alleen gelezen (HEAD `3e8090a`).*
