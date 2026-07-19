# INHAAL / DEBT — RECON

**Status:** read-only recon. Geen gedrags-wijziging, engine (`packages/engine`) niet aangeraakt,
`PLAN_ADAPTATION_ENABLED` niet geflipt. Metingen zijn met throwaway-harnesses gedaan (TZ=Europe/Amsterdam)
en daarna verwijderd. GAS bevroren van schijf gelezen (`C:\Users\daan\Projects\training` @ `3e8090a`).

**Kernvondst vooraf.** Het beoogde model is *"bij een gemiste of te-lichte training adviseert de coach de
beste inhaal"*. De machinerie levert daar maar de hélft van: **een GEMISTE dag produceert nul debt**. Zowel
GAS (`Algorithm.gs:515`) als de port (`weekprep.ts:107`) slaan dagen met `!gedaan` over. Alleen een dag die
je WÉL deed maar te licht invulde, telt. De "gemist"-helft van het model vereist dus een regel-wijziging in
de engine, niet alleen het openen van de twee sloten (§2, §6).

---

## §1 — BLOB-INTENT VOOR VERSTREKEN DAGEN

**Vraag:** draagt een BEVROREN entry van een reeds-verstreken dag van de huidige week het veld `intent` met
bucket-minuten? Zo niet, dan is de debt-arm dood óók met de gate aan, want `intentByDateFrom`
(`apps/web/src/lib/proposal.ts:151-165`) leest uitsluitend `e.intent`.

**Antwoord: JA.** Gemeten met een throwaway die twee opeenvolgende dagen simuleert:

```
[dag1 2026-07-20] entries: 07-20,07-21,07-22,07-23,07-24,07-25,07-26
  maandag-entry intent = {"low":54,"high":21,"anaerobic":0}  zones=["low","high"]  type=threshold
[dag2 2026-07-21] payload van de client: 07-21,…,07-26   (bevat maandag? false)
  na freeze-merge: 07-20,07-21,…,07-26
  BEVROREN maandag-entry intent = {"low":54,"high":21,"anaerobic":0}   → draagt intent? true
```

**De keten die dat waarmaakt.** `entryFromDay` (`apps/web/src/lib/weekplanBlob.ts:163`) zet
`intent: aggIntent` op elke entry, maar **alleen voor dagen mét sessies**
(`weekplanBlob.ts` — `if (!sessions.length) return null`, 1:1 met GAS `Algorithm.gs:205`). Een verstreken
dag heeft geen sessies meer (`assignWorkouts` bouwt alleen voor `tePlannen`), dus de client-payload van dag 2
bevat maandag niet. De **worker-freeze** vult dat gat: `mergeFrozenWeekplan`
(`workers/api/src/weekplanFreeze.ts`, aangeroepen in `workers/api/src/routes/api.ts` op de
`PUT /weekplan/:monday`) houdt voor `datum < todayISO` de bestaande entry vast en pusht bevroren dagen terug
die de payload niet noemt.

**Voorwaarde die dit wél kwetsbaar maakt.** De intent van maandag bestaat alleen als de app op maandag (of
eerder, toen maandag nog toekomst was) heeft gedraaid en `persistWeekplan` (`apps/web/src/lib/schema.ts`) de
week heeft weggeschreven. Een week waarin de gebruiker de app pas op woensdag opent, heeft **geen** intent
voor maandag/dinsdag → geen debt over die dagen. De debt-arm is dus zo compleet als de app-open-historie.
Dat is een gedrags-eigenschap om te tonen ("ik kan alleen inhalen wat ik gepland zag"), geen bug.

---

## §2 — DE GEDAAN-KOPPELING

### 2.1 De GAS-regel (bevroren, `src/Sync.gs:567-608`)

`reconcilePlannerWithActivities()` — per planner-dag met `train && !gedaan && datum`:

```js
var dayStart = new Date(d.datum.getFullYear(), d.datum.getMonth(), d.datum.getDate());
var dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
for (var i = 0; i < actData.length; i++) {
  var actDate = actData[i][0];
  if (!(actDate instanceof Date)) continue;
  if (actDate < dayStart || actDate >= dayEnd) continue;          // dagvenster [00:00, +24u)
  var actType = String(actData[i][1] || '').toLowerCase();
  if (actType.indexOf('ride') < 0 && actType.indexOf('run') < 0) continue;   // ride/run
  var actMin = Number(actData[i][3]) || 0;
  if (d.minuten > 0 && actMin < d.minuten * 0.5) continue;        // >= 50% van gepland
  pSheet.getRange(3 + d.dagIdx, 8).setValue(true);                // boolean vinkje
  marked++;
  break;                                                          // eerste match wint
}
```

Vier regels: dagvenster, type bevat `ride`/`run`, duur ≥ 50% van gepland, eerste match wint dan `break`.
Het resultaat is een **boolean vinkje in kolom H** — een geschreven, blijvende waarde.

### 2.2 De twee opties

| | **A. Afleiden-bij-lezen** (`proposal.ts`, vóór `zoneDebt_`) | **B. D1-kolom vullen** (reconcile in de worker) |
|---|---|---|
| Waar | `buildWeekProposal` heeft `activities` én `plannerDays` al in de hand | `writePlannerDays`/een nieuwe reconcile-route, `planner_days.gedaan` |
| Kosten | ~20 regels puur, geen migratie, geen route, geen job | Reconcile-trigger nodig (na sync), idempotentie, schrijf-pad |
| Waarheid | **één bron** (activities); kan niet divergeren | tweede bron die kan verouderen t.o.v. de activities |
| Terugdraaien | gratis (pure functie) | vereist een herstel-schrijf |
| GAS-gelijkenis | wijkt af van GAS' geschreven vinkje | spiegelt GAS 1:1 |

**Aanbeveling: A (afleiden-bij-lezen).** Grond: `writePlannerDays` (`workers/api/src/db/repo.ts:376`) zet
`gedaan: 0` bij ELKE planner-write, en de upsert doet `set: vals` — een gevulde kolom wordt dus overschreven
zodra de gebruiker zijn beschikbaarheid aanpast. Optie B vraagt daarom óók een wijziging aan die upsert,
bovenop de reconcile. Optie A omzeilt dat volledig.

**De V4-val (week-kladje → stille historie).** `planner_days` heeft in Cadans **geen rollover**: de rijen
blijven staan zoals ze ooit geschreven zijn. Bij optie B wordt een `gedaan`-kolom daarmee stille historie:
een oude week houdt vinkjes die niemand meer herziet, en die vinkjes voeden dan een debt-berekening over een
week die allang voorbij is. `zoneDebt_` begrenst zichzelf weliswaar op `[weekMonday, +7)`
(`weekprep.ts:104-111`), dus de directe schade is beperkt — maar de rijen zijn dan wél een tweede,
niet-onderhouden waarheid naast de activities. Optie A heeft dat probleem per definitie niet.

### 2.3 Blast-radius van een afgeleide `gedaan` — vijf consumenten

| Consument | Plek | Effect zodra `gedaan` echt gevuld raakt |
|---|---|---|
| `zoneDebt_` | `proposal.ts:368` (input) | de bedoelde werking: debt gaat tellen |
| dekking-loop | `proposal.ts:336` `if (!d.train \|\| !d.gedaan) continue` | gereden dagen leveren nu echte zone-dekking i.p.v. niets |
| grid `gedaan` | `proposal.ts:311` | voedt de twee hieronder |
| **tePlannen-filter** | `proposal.ts:419-423` `d.train && !d.gedaan && datum >= vandaag` | **een reeds-gereden VANDAAG valt uit de herplanning** — bevestigd |
| **`dayPlannable`** | `proposal.ts:459` `!d.gedaan && datum >= vandaag` | een D2-override op een gereden vandaag wordt niet meer toegepast |

De laatste twee zijn de scherpe kant. Een gereden vandaag verliest zijn `sessions` (niet meer in
`tePlannen`) en valt terug op `plannedForDone` uit de bevroren blob (V24-pad, laag 1a) — dat is de
bedoelde weergave, maar het is wél een zichtbare verandering op de dagkaart van vandaag. De vijfde
(`dayPlannable`) staat niet in de opdracht genoemd en is de makkelijkst te missen: hij raakt óók de
verlicht-flow van laag 2, want een verlicht-akkoord is een override op vandaag.

### 2.4 Twee ongekoppelde "done"-begrippen

| | Bron | Gebruikt voor |
|---|---|---|
| `plannerDays[].gedaan` | D1-kolom (nu altijd `0`, `repo.ts:376`), gelezen als `r.gedaan === 1` (`repo.ts:351`) | debt, dekking, herplanning, plannbaarheid |
| `isDone = doneTss > 0` | afgeleid uit de activities (`apps/web/src/lib/schema.ts:886`) | kaart-state (`done`), week-load-stats |

**Mogen ze divergeren? Ja, en dat is functioneel.** `isDone` is bewust ruim: élke rit met TSS telt, ook een
losse rit op een rustdag — je hebt gereden, dus de kaart toont "voltooid". `gedaan` is bewust nauw: hij
beantwoordt "is de GEPLANDE sessie afgewerkt?", met de 50%-duur-eis als drempel. Een rit van 20 min op een
geplande 75 min zet `isDone` wél en `gedaan` niet: de kaart zegt "gereden", de debt-arm zegt "niet af" — en
precies dat verschil ís de inhaal-aanleiding.

**Wat NIET mag:** ze samenvoegen tot één vlag. Dan verdwijnt óf de drempel (elke korte rit telt als plan
gehaald → geen debt meer) óf de ruime weergave (een losse rit toont niet meer als voltooid). Leg dit vast
vóór de bouw; het is de meest waarschijnlijke "opruim"-fout.

---

## §3 — BLAST-RADIUS MET DE GATE AAN

Gemeten (throwaway, TZ=Europe/Amsterdam, week = deze week, vandaag = woensdag; maandag WÉL gereden maar te
licht — 40 min Z1 tegen een `high`-intent — en dinsdag GEMIST). De vlag is **niet** geflipt; de meting
gebruikt de bestaande `planAdaptation`-input-override op `BuildProposalInput`.

```
[blob] ma intent={"low":0,"high":40,"anaerobic":0}   di intent={"low":76,"high":0,"anaerobic":0}
[gedaan afgeleid] 13:J 14:n 15:n 16:n 17:n 18:n 19:n

HUIDIG (gate uit)          : 15:sweet_spot/key_session  16:long_z2/demote_recent_hard  17:sweet_spot/key_session  18:long_z2/long_weekend  19:long_z2/long_ride
  week-TSS = 313
GATE AAN + gedaan afgeleid : 15:sweet_spot/catchup_high 16:long_z2/demote_recent_hard  17:sweet_spot/key_session  18:long_z2/long_weekend  19:long_z2/long_ride
  week-TSS = 313
GATE AAN, gedaan NIET      : 15:sweet_spot/key_session  16:long_z2/demote_recent_hard  17:sweet_spot/key_session  18:long_z2/long_weekend  19:long_z2/long_ride
  week-TSS = 313
```

Tweede fixture, om het dekking-kanaal (`rollingZoneCoverage_`) apart te raken — een zware rit (IF 0,92) op
een dag waarvan de blob-intent `low` zegt:

```
  gate uit : 15:long_z2/demote_recent_hard  16:sweet_spot/key_session  …
  gate aan : 15:long_z2/catchup_low         16:sweet_spot/key_session  …
```

**Drie conclusies.**

1. **BEIDE sloten moeten open.** "Gate aan, `gedaan` niet afgeleid" is **byte-identiek** aan de huidige
   uitkomst. Het openen van alleen de vlag verandert niets — precies zoals verwacht, en het bevestigt dat
   §2 een harde voorwaarde is en geen nice-to-have.
2. **De afwijking is SCHERP, niet diffuus.** Alleen de dag met debt verandert; de overige vooruit-dagen zijn
   identiek. Het diffuse kanaal (intent voedt óók `rollingZoneCoverage_` en `recentHardDate_`) sloeg in
   fixture 1 niet door, en in fixture 2 raakte het dezelfde ene dag.
3. **Maar de AMPLITUDE is laag.** In beide fixtures veranderde alleen de **redenCode**
   (`key_session` → `catchup_high`, `demote_recent_hard` → `catchup_low`); het **type bleef gelijk** en de
   **week-TSS bleef exact 313**. De reden: `debtPreferredType_` (`planner.ts:95-111`) koos hetzelfde type dat
   de allocator toch al had gekozen, en het debt wordt door de eerste geschikte dag **geconsumeerd**
   (`debtWerk[bucket] = 0`, `planner.ts:668`/`:699`) → hooguit één catchup-dag per bucket.

**Wat dat betekent voor het model.** "De coach adviseert een aanpassing" is met de huidige machinerie vaak
**geen ander plan, maar een andere motivering** van dezelfde sessie. Dat is een eerlijk en toonbaar product
("deze sweet-spot vult je intensiteit-tekort van maandag aan"), maar het is níét het "her-dynamiseer de hele
week"-effect dat het model suggereert. Wie dat laatste wil, moet de allocator-parameters raken — een
engine-wijziging, buiten deze fase.

---

## §4 — WEEK-VOORSTEL-OPPERVLAK

### 4.1 De bestaande accept-keten (laag 2, werkt en is omkeerbaar)

`VerlichtCard` → `putOverride(datum, {…, src:'readiness'})` (`apps/web/src/lib/api.ts`) →
`PUT /api/override/:date` (`workers/api/src/routes/api.ts`, validatie `isValidOverride`) →
`writeOverride` (`repo.ts:526`) → `day_state.override_json` → `readOverrides` → `ProposalDay.override`
(`proposal.ts` D2-tak) → `OverriddenDetail` + "Terug naar voorstel" (`putOverride(date, null)`).

Kenmerk: **per DAG**, één rij op `(user_id, datum)`, en het akkoord is tegelijk het idempotentie-merk
(`src === 'readiness'`).

### 4.2 Kan een WEEK-brede inhaal-goedkeuring daarop leunen?

Deels. De keten is per-dag; een week-brede goedkeuring is een ander object. Drie opties:

**Optie 1 — per-dag override op de inhaal-dag (geen migratie).**
De coach stelt één concrete inhaal-sessie voor op één dag; akkoord schrijft een `library`-override met een
nieuwe `src` (bv. `'catchup'`) op die dag. Alles bestaat al: contract, route, weergave, "Terug naar
voorstel".
*Kosten:* laag — geen migratie, geen nieuw persistentie-pad, hergebruikt de laag-2-UI.
*Beperking:* het pint **één dag** vast in plaats van de week te her-dynamiseren; de rest van de week blijft
door de allocator bepaald. Gegeven §3 (de amplitude is toch één dag per bucket) sluit dit verrassend goed
aan bij wat de machinerie feitelijk doet.

**Optie 2 — per-week opt-in-vlag in D1 (migratie).**
Een kolom op `weekplans` (PK is al `(user_id, week_monday)`), bv. `debt_opt_in_at TEXT`. Gezet = de
debt-arm/gate staat **voor die week** aan; de allocator her-dynamiseert de hele week.
*Kosten:* D1-migratie (`workers/api/drizzle/`, nu t/m `0003_…`), route-uitbreiding, en `intentByDateFrom`
moet van een globale vlag naar een per-week-conditie. Plus: het gedrag wordt tijd-afhankelijk (dezelfde week
gedraagt zich anders vóór en ná akkoord) — dat vereist dat het plan-van-record ook ná akkoord stabiel blijft
(de 1b-oscillatie-les).
*Winst:* dit is het enige model dat "goedkeuring her-dynamiseert de HELE week" letterlijk waarmaakt.

**Optie 3 — `sync_state`-achtige key-value (lichtste persistentie).**
`sync_state` (`schema.ts:221`) is een 1-rij-per-user tabel met losse kolommen; een `debt_opt_in_week TEXT`
(de maandag-ISO) zou volstaan voor "de huidige week is goedgekeurd".
*Kosten:* kleine migratie, geen nieuwe tabel, geen per-dag-semantiek.
*Beperking:* één week tegelijk; historisch niet navolgbaar (geen audit van welke weken zijn goedgekeurd).

### 4.3 "Origineel plan" vs "voorgesteld inhaal-plan"

**Twee allocator-runs is het goedkope antwoord, en het is nu al bewezen.** `buildWeekProposal` is puur en
neemt `planAdaptation` als input; de meting in §3 draaide precies dat: dezelfde invoer, twee keer, één keer
met en één keer zonder. Kosten zijn verwaarloosbaar (client-side, geen IO) en het levert een exacte diff
per dag (type + redenCode + TSS) — precies het materiaal voor "dit verandert er, en dit is waarom".

Een aparte "debt-preview" (alleen de debt-getallen tonen zonder her-planning) is goedkoper maar zwakker: hij
kan niet laten zien wát er in het plan verandert, en juist dat is de goedkeuringsvraag.

**Het waarom tonen.** `redenCode` reist al mee op `ProposalDay` en de copy ligt klaar:
`apps/web/src/lib/coachNarrative.ts:44-63` draagt drie warme varianten voor `catchup_high`,
`catchup_anaerobic` en `catchup_low`. Let op: twee van die drie claimen de daad in de verleden tijd
("Ik heb je schema bijgesteld") — voor een voorstel-flow moeten ze voorwaardelijk worden, exact zoals in
laag 2 met `verlichtAanbodRegel` is gedaan (M55/R3-T24).

---

## §5 — MIGRATIE-OVERLAP (blokker b)

**Bevestigd: de weekplans-blob is tegelijk de debt-input en de migratie-scope.**

- Debt-input: `intentByDateFrom` leest `e.intent` uit exact dezelfde entries (§1).
- Migratie-scope: de gepland-vs-gedaan-historie die uit de GAS-DocProps (`weekplan_<maandag>`) moet komen,
  is dezelfde entry-vorm (`docs/PLAN-VAN-RECORD-RECON.md` §4.2).

**Dupliceren of tegenwerken? Geen van beide — ze versterken elkaar, met één aandachtspunt.**

- De `gedaan`-koppeling (§2, optie A) raakt de blob niet: hij leidt af uit de activities en schrijft niets.
  Volledig orthogonaal aan de migratie.
- Gate-aan raakt de blob evenmin: `intentByDateFrom` is een LEZER.
- **Het aandachtspunt is de 3a-vormafwijking.** De schrijver nult per sessie de buckets buiten `zones`
  (`zeroIntentOutsideZones`, `weekplanBlob.ts`) — bewust, om de engine-aanname
  `intent[b] > 0 ⇔ b ∈ zones` te herstellen. Een GAS-import die de originele blobs **ongewijzigd**
  overneemt, brengt GAS' `ensureIntent_`-vorm binnen (55% gefabriceerde low-minuten voor elke workout
  zonder eigen intent). Die entries zouden dan een **andere** debt opleveren dan native-geschreven weken:
  te veel `low`-intent → structureel low-debt. **De migratie-import moet dezelfde transformatie toepassen
  als de schrijver.** Dat is precies de open afhankelijkheid die `docs/PLAN-VAN-RECORD-RECON.md` §3a al
  markeerde; hij wordt hier concreet, want vanaf nu leest de debt-arm die getallen.

---

## §6 — AANBEVOLEN BOUW-FASERING

Elke fase eindigt met een **STOP-en-verifieer**: gate groen + de genoemde meting, en Daan kijkt vóór de
volgende fase.

**Fase 0 — MODEL-BESLISSING (geen code).** Het model zegt "gemiste of te-lichte training". De machinerie
dekt alleen "te-licht" (§0/§2). Beslis: (a) accepteren dat inhaal alleen op onder-geleverde dagen slaat, of
(b) `zoneDebt_` uitbreiden zodat een geplande-maar-niet-gedane dag als volledige debt telt.
(b) is een **ENGINE-wijziging** (`weekprep.ts:107`) én een **GAS-divergentie** (`Algorithm.gs:515` doet het
ook niet) → **AUTHORISATIE-VEREIST**. Zonder deze beslissing bouw je de verkeerde helft.
*STOP: besluit vastgelegd in `docs/TRAININGSMODEL.md`.*

**Fase 1 — `gedaan` afleiden (optie A), gate blijft UIT.** Port de vier GAS-regels (§2.1) als pure functie
in de web-laag; voed `zoneDebt_`, de dekking-loop en het grid ermee. De gate uit betekent dat `intentByDate`
leeg blijft → **debt blijft nul → het vooruit-plan verandert niet**. Wat wél verandert zijn de vier
consumenten uit §2.3 (tePlannen, dayPlannable, dekking, kaart-state van vandaag).
*STOP: bewijs met een test dat het vooruit-plan byte-identiek is, en verifieer in de browser wat er op een
gereden vandaag-dag gebeurt (de tePlannen/dayPlannable-flip is zichtbaar).*

**Fase 2 — de voorstel-laag, gate nog UIT.** Bouw de dubbele-run-diff (§4.3) en de coach-copy
(voorwaardelijk maken, §4.3). Toon "origineel vs voorgesteld" zonder dat er iets muteert; de gate gaat per
week aan via de gekozen optie uit §4.2 — begin met **optie 1** (per-dag override, geen migratie) tenzij
Fase 0 expliciet voor het her-dynamiseren van de hele week kiest.
*STOP: de diff is zichtbaar en uitlegbaar op echte data; nog niets geschreven.*

**Fase 3 — goedkeuring aanzetten.** Pas het akkoord toe via het gekozen persistentie-pad, met dezelfde
omkeerbaarheid als laag 2 ("Terug naar voorstel").
*STOP: round-trip getest (accepteren → tonen → terugdraaien), en de stabiliteits-check uit 1b herhaald (het
plan mag niet gaan oscilleren zodra een goedgekeurde week zichzelf terugleest).*

**Fase 4 — migratie-afstemming.** Pas op de GAS-import dezelfde intent-transformatie toe als de schrijver
(§5), zodat geïmporteerde weken dezelfde debt opleveren als native weken.

**Niet in deze fasering:** de allocator zelf gevoeliger maken voor debt (§3, lage amplitude). Dat is een
engine-vraag en hoort achter een eigen model-beslissing.

---

---

## §7 — ALLOCATOR-VERIFICATIE (fase 0, read-only)

**Vraag.** Doet de allocator al wat de nieuwe norm eist — HERVERDELEN binnen het budget
(M62) — of STAPELT hij belasting boven op het plan? En respecteert een tekort-gedreven
inhaalsessie de afstand tussen harde dagen (M67)?

Gemeten met een throwaway (TZ=Europe/Amsterdam), gate aan via de `planAdaptation`-input en
`gedaan` afgeleid volgens de GAS-match. Fixture: maandag 90 min drempel gepland
(blob-intent `{"low":0,"high":40,"anaerobic":0}`), 60 min Z2 gereden — 60 ≥ 50% van 90, dus
de dag telt als gedaan, maar de intensiteit ontbreekt → high-debt ≈ 40, ruim boven de
forceer-drempel. Controle: dezelfde fixture met maandag op plan gereden.

### 7.1 Herverdelen of stapelen? — HERVERDELEN

```
CONTROLE (ma op plan) : 15:sweet_spot/key_session   16:long_z2/demote_recent_hard  17:sweet_spot/key_session  18:long_z2/long_weekend  19:long_z2/long_ride
  week-TSS = 313   geplande minuten = 421   harde dagen = 2
TEKORT (ma te licht)  : 15:sweet_spot/catchup_high  16:long_z2/demote_recent_hard  17:sweet_spot/key_session  18:long_z2/long_weekend  19:long_z2/long_ride
  week-TSS = 313   geplande minuten = 421   harde dagen = 2

Δ TSS = 0     Δ minuten = 0     Δ harde dagen = 0
```

**Uitkomst: de motor STAPELT NIET.** Weekbelasting, geplande minuten én het aantal harde
dagen zijn identiek; het tekort verandert uitsluitend de MOTIVERING van één dag
(`key_session` → `catchup_high`). Dat voldoet aan M62 zonder enige wijziging — de
herverdeling is structureel, want het weekvolume komt uit de planner-minuten en de
allocator vult die slots, hij voegt er geen toe.

**Keerzijde, en die is belangrijk voor het ontwerp.** Precies omdat er niets aan het plan
verandert, is "de coach adviseert een inhaal" hier feitelijk "de coach legt uit waarom deze
sessie er staat". Dat bevestigt §3 op een tweede fixture. Een goedkeur-knop die niets aan
het plan verandert, is een zwak voorstel — de voorstel-laag moet dus ofwel de uitleg als
product nemen, ofwel wachten tot de allocator gevoeliger is voor debt (eigen fase, buiten
deze scope).

### 7.2 Harde-dagen-afstand — DE INHAAL-TAK IS VRIJGESTELD

De bewaking staat in de dag-loop van `assignWorkouts`:

```ts
if (isHard && !debtForced && d.datum && lastHardDate) {   // planner.ts:730
  // → downgrade naar long_z2 als de vorige kalenderdag hard was
}
```

`debtForced` wordt gezet door de TWEE WEEKEND-takken (`planner.ts:669` en `:675`) — de
`catchup_high`- en `catchup_anaerobic`-forcering. **Die slaan de bewaking over** en kunnen
direct naast een andere harde dag landen.

**Belangrijke afbakening:** de derde inhaal-tak, die op een VRIJE dag via
`debtPreferredType_` een `catchup_<bucket>` zet (`planner.ts:696-701`), zet `debtForced`
NIET. Die tak wordt dus wél netjes gedowngraded naast een harde dag. De schending is dus
beperkt tot de weekend-forcering, niet tot de inhaal-laag als geheel.

Mijn eigen gerichte fixture (vrijdag harde actual, zaterdag weekend met high-debt) trok de
botsing niet: zaterdag kwam uit op `long_z2`/`long_weekend`, omdat het tekort op dat moment
al door een eerdere dag was verbruikt (`debtWerk[bucket] = 0`). Het gedrag is echter
onomstotelijk vastgelegd door een BESTAANDE, slagende test in de suite:
`apps/web/src/lib/proposal.test.ts:1029` — *"B — debt-geforceerde compensatie mag TOCH hard
blijven de dag na een harde dag (exceptie)"* — die expliciet asserteert dat de dag ná een
harde dag een `combo_long_with_efforts` met high-zones krijgt en de downgrade-reden NIET.

**Uitkomst: schending van M67**, vastgelegd als **M70 (BEVINDING)** in
`docs/TRAININGSMODEL.md`. Per M6 is dat een bevinding en geen release-gate: de tak is
vandaag onbereikbaar (de debt-arm staat dubbel op slot, §3), dus de schending is latent. Ze
moet geadresseerd zijn vóórdat de inhaal-laag daadwerkelijk gaat sturen — het is een
engine-wijziging (`packages/engine`) en dus **AUTHORISATIE-VEREIST**.

### 7.3 Gevolg voor de fasering

§6 blijft staan, met één toevoeging: **Fase 0 is hiermee afgesloten** (de model-beslissing
is genomen en gelogd), en de M70-schending hoort in de fase waarin de allocator geraakt
wordt — niet in fase 1 (`gedaan` afleiden), want daar blijft de debt nul en is de tak
onbereikbaar.

*Recon, geen bouw. Throwaway-harnesses verwijderd; `git diff --stat packages/engine` is leeg.*
