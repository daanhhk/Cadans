# RECENCY — LAAG 1b RECON + EFFECT-METING

**Status:** recon. Read-only. Geen engine-wijziging, geen build, niets gedeployd.
`packages/engine` ongemoeid; `C:\Users\daan\Projects\training` alleen gelezen (HEAD `3e8090a`).

**Vraag:** is de reader-param op de recency-seed inert, of verandert hij het plan? En reist
`archetypeId` in de praktijk mee?

**Antwoord vooraf:** de reader-param is **NIET inert** — in **15 van de 15** (doel × fase)-combinaties
kiest `goalWorkout_` een ander intent én een ander type zodra de seed gevuld is. Op weekniveau
verschuift de hele kwaliteitsallocatie. En `archetypeId` is **LIVE**, niet dormant — dat corrigeert een
claim uit mijn eigen laag-1a-rapport (§5).

---

## §1 — HUIDIGE STAAT (quotes, geverifieerde regelnummers)

### 1a. De seed met de hardcoded null-reader — `planner.ts:522-534`

```ts
  // 2b.2: recency voor goalWorkout_ — zaai (best-effort) uit de opgeslagen weekplan-snapshot,
  // vul in-loop aan met elke toegewezen kwaliteitsdag (ma→zo). Deterministisch (geen Math.random).
  let qualityRecency: any[] = [];
  try {
    // Cross-week seed: voeg de laatste RECENCY_HORIZON_WEEKS weekplan-snapshots samen (niet enkel
    // deze week) zodat de archetype-rotatie ook over weekgrenzen heen mijdt. Een lege huidige week
    // mag de seed niet blokkeren → geen wpRaw0-guard meer (die las alleen deze week).
    // DATA-IN: het weekplan-lees-pad is untested in de port → null-accessor (geen seed).
    qualityRecency = recencyFromWeekplan_(
      gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, null, null),   // planner.ts:531
      null,
    );
  } catch (e0) {}
```

De `try/catch` slikt alles (`catch (e0) {}`) — een falende reader kan het plan dus nooit breken, hij
levert stil een lege seed. Dat maakt de threading laag-risico. `RECENCY_HORIZON_WEEKS = 8`
(`planner.ts:447`).

### 1b. `assignWorkouts`-signatuur — `planner.ts:475-488`

```ts
export function assignWorkouts(
  days: any,
  settings: any,
  mesoWeek: any,
  macroFase: any,
  dekking: any,
  wellness: any,
  klimType: any,
  recentHardDate: any,
  debt: any,
  isTripEvent: any,
  taperCtx: any,
  weekDays: any,
): void {
```

**Twaalf** parameters. **Geen reader-param, geen recency-param.** Bevestigd. Identiek aan de bevroren
GAS (`Algorithm.gs:985`, zelfde twaalf in dezelfde volgorde).

### 1c. De consument-keten

**`allocateQualityWeek_` → `goalWorkout_`** — `planner.ts:414-422`:

```ts
    const gw = goalWorkout_(profiel, macroFase, bt, rec, cov, weekV);   // planner.ts:414
    if (gw) {
      plan[sel.dagIdx] = {
        role: "quality",
        type: gw.type,
        archetypeId: gw.archetypeId,
      };
      rec.push({
        intent: intentFromType_(gw.type),
        archetypeId: gw.archetypeId,
      });
```

`rec` is de doorgegeven `qualityRecency` (`planner.ts:544`, het vijfde argument van
`allocateQualityWeek_`). De allocator **breidt 'm binnen de week zelf uit** (`rec.push`, `:420`) — dat is
de within-week-rotatie op de quality-dagen.

**`goalWorkout_` → `goalPickIntent_(vermijdIntent)`** — `archetypes.ts:1313-1335`:

```ts
export function goalWorkout_(
  profiel: any,
  fase: string,
  beschikbareTijd: number,
  recency?: any,
  dekking?: any,
  V?: any,
): any {
  if (!profiel) return null;
  recency = recency || [];
  const last = recency.length ? recency[recency.length - 1] : null;
  const lastIntent = last ? last.intent : null;

  const intent = goalPickIntent_(
    profiel,
    fase,
    lastIntent,          // ← vermijdIntent
    beschikbareTijd,
    dekking,
    V,
  );
```

**De mijd-lus** — `archetypes.ts:1307-1310`:

```ts
  for (let k = 0; k < intents.length; k++) {
    if (intents[k] !== vermijdIntent) return intents[k];
  }
  return intents[0];
```

Dus: `recency[last].intent` wordt overgeslagen in de gesorteerde intent-lijst; er is een fallback naar
`intents[0]` als álles vermeden zou worden. Náást het intent stuurt de recency ook de
**archetype-keuze** binnen dat intent, via `staleness()` en `gebruikt{}` (`archetypes.ts:1346-1360`) —
een al gebruikt archetype valt uit de pool.

### 1d. `gatherWeekplanEntries_` + `recencyFromWeekplan_`

`planner.ts:454-472`:

```ts
export function gatherWeekplanEntries_(
  horizonWeeks: any,
  baseMonday: any,
  readWeekplan: any,
): any {
  const monday = baseMonday || weekStartDate(new Date());
  let out: any[] = [];
  for (let k = 0; k < horizonWeeks; k++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7 * k);
    const key = "weekplan_" + formatDate(d, "yyyy-MM-dd");
    const raw = readWeekplan ? readWeekplan(key) : null;    // ← null-reader ⇒ altijd null
    if (!raw) continue;
    if (Array.isArray(raw)) out = out.concat(raw);
  }
  return out;
}
```

`archetypes.ts:1378-1397`:

```ts
export function recencyFromWeekplan_(weekplan: any, refISO?: any): any {
  if (!weekplan || !weekplan.length) return [];
  const rows = weekplan
    .filter((e: any) => e && e.datum && e.workoutType && (!refISO || e.datum < refISO))
    .slice()
    .sort((a: any, b: any) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
  const out: any[] = [];
  rows.forEach((e: any) => {
    const intent = intentFromType_(e.workoutType);
    if (GOAL_KWALITEIT_INTENTS_.indexOf(intent) >= 0) {
      out.push({ intent: intent, archetypeId: e.archetypeId || null });
    }
  });
  return out;
}
```

Bevestigd: het intent komt uit **`intentFromType_(e.workoutType)`** — dus uit het `workoutType`-veld dat
laag 1a al naar de blob schrijft. `archetypeId` reist mee als **`e.archetypeId || null`**. Alleen entries
met een kwaliteits-intent (`GOAL_KWALITEIT_INTENTS_ = ["drempel","sweetspot","vo2"]`,
`archetypes.ts:1138`) tellen mee; `long_z2`/rustdagen vallen weg.

Gemeten end-to-end:

```
blob = [ {2026-03-02, sweet_spot, ss_2x20}, {2026-03-05, threshold, null}, {2026-03-07, long_z2, null} ]
recencyFromWeekplan_ → [{"intent":"sweetspot","archetypeId":"ss_2x20"},{"intent":"drempel","archetypeId":null}]
```

`long_z2` is er correct uit gefilterd; de volgorde is chronologisch, dus `last` = de meest recente
kwaliteitsdag.

---

## §2 — DE METING

Throwaway-test `packages/engine/src/_recon_recency.test.ts`, gedraaid via de root-runner
(`pnpm test _recon_recency`, `TZ=Europe/Amsterdam`), daarna **verwijderd**.

**Parameters gespiegeld op de echte aanroep** (`keyIntensity`, `planner.ts:849-856`:
`goalWorkout_(profileForDoel_(ctx.settings.doel), macroFase, ctx.beschikbareTijd, ctx.recency, dekking)`
— vijf argumenten, `V` wordt daar NIET meegegeven). Dus: `beschikbareTijd = 75`, `dekking =
{low:true, high:true, anaerobic:true}` (neutraal), `V = undefined`. Alleen de recency varieert.

- **A** — lege recency `[]` (de huidige staat) → `P0`/`T0`
- **B** — recency geseed zodat `lastIntent === P0` → verwacht `P1 ≠ P0`
- **C** — recency geseed met een ander geldig intent `Q ≠ P0` → verwacht `P0` ongewijzigd

```
doel          | fase   | A: P0/T0              | B: P1/T1              | flip    | C        | elig | archetypeId (A)
--------------+--------+-----------------------+-----------------------+---------+----------+------+------------------------
FTP           | Base   | drempel  /threshold   | sweetspot/sweet_spot  | flip=JA | C==P0=ja | 3    | threshold_overunder
FTP           | Build  | drempel  /threshold   | sweetspot/sweet_spot  | flip=JA | C==P0=ja | 3    | threshold_overunder
FTP           | Peak   | drempel  /threshold   | vo2      /vo2max      | flip=JA | C==P0=ja | 3    | threshold_overunder
Beklimmingen  | Base   | drempel  /threshold   | sweetspot/sweet_spot  | flip=JA | C==P0=ja | 3    | threshold_overunder
Beklimmingen  | Build  | drempel  /threshold   | vo2      /vo2max      | flip=JA | C==P0=ja | 3    | threshold_overunder
Beklimmingen  | Peak   | vo2      /vo2max      | drempel  /threshold   | flip=JA | C==P0=ja | 3    | vo2_hill_repeats
VO2max        | Base   | drempel  /threshold   | sweetspot/sweet_spot  | flip=JA | C==P0=ja | 3    | threshold_overunder
VO2max        | Build  | vo2      /vo2max      | drempel  /threshold   | flip=JA | C==P0=ja | 3    | vo2_40_20
VO2max        | Peak   | vo2      /vo2max      | drempel  /threshold   | flip=JA | C==P0=ja | 3    | vo2_40_20
Conditie      | Base   | sweetspot/sweet_spot  | drempel  /threshold   | flip=JA | C==P0=ja | 3    | sweetspot_short
Conditie      | Build  | sweetspot/sweet_spot  | drempel  /threshold   | flip=JA | C==P0=ja | 3    | sweetspot_short
Conditie      | Peak   | sweetspot/sweet_spot  | vo2      /vo2max      | flip=JA | C==P0=ja | 3    | sweetspot_short
Onderhoud     | Base   | sweetspot/sweet_spot  | drempel  /threshold   | flip=JA | C==P0=ja | 3    | sweetspot_short
Onderhoud     | Build  | drempel  /threshold   | sweetspot/sweet_spot  | flip=JA | C==P0=ja | 3    | threshold_overunder
Onderhoud     | Peak   | drempel  /threshold   | vo2      /vo2max      | flip=JA | C==P0=ja | 3    | threshold_overunder
--------------+--------+-----------------------+-----------------------+---------+----------+------+------------------------
M_total = 15   M_multi = 15   flips onder B = 15/15   C ongewijzigd = 15/15
degenererende combinaties (1 eligible intent): GEEN
```

Alle 15 combinaties hebben 3 eligible intents bij `beschikbareTijd = 75` — er zijn dus **geen
degenererende gevallen**; de mijd-lus heeft overal iets om naar door te schuiven.

### Week-magnitude

Bovenstaande meet één dag. Op weekniveau: dezelfde `allocateQualityWeek_`-aanroep (FTP/Build,
7 dagen), alleen de seed verschilt — exact wat de threading zou opleveren.

```
lege seed  → 0:threshold/threshold_overunder  3:threshold/threshold_overunder_long  6:sweet_spot/sweetspot_short
geseed     → 0:sweet_spot/sweetspot_short     3:sweet_spot/sweetspot_overunder      6:threshold/threshold_overunder
IDENTIEK?  NEE
```

(De `long_z2`-dagen 1, 2, 4, 5 zijn in beide identiek — de seed raakt alleen de kwaliteitsdagen.)

**Alle drie de kwaliteitsdagen wisselen van type én archetype.** De magnitude is dus niet marginaal:
de seed bepaalt welke sleutelsessie op welke dag valt.

### VERDICT

**De reader-param is NIET inert.** 15/15 (doel × fase) flippen onder B; C laat het resultaat in 15/15
ongemoeid (geen ruis — de seed werkt alleen waar hij hoort te werken). Op weekniveau verandert de
volledige kwaliteitsallocatie. Het huidige gedrag — altijd `intents[0]` van de gesorteerde lijst — is
niet "de rotatie staat toevallig goed", het is **geen rotatie**: zonder seed kiest elke week opnieuw
hetzelfde hoogst-scorende intent, en de enige variatie over weekgrenzen komt van verschuivende
dekking/volume-invoer.

---

## §3 — archetypeId: LIVE (niet dormant)

De comment op `buildWorkout`'s archetypeId-param — `planner.ts:1454-1455`:

```ts
  // FASE 1 deel 2b.2 — een gekozen archetype expandeert direct (overrulet de type-dispatch).
  // INERT tot keyIntensity een archetypeId zet (commit 2). Onbekend id → val door naar de dispatch.
```

**Die comment is STALE.** `keyIntensity` zet 'm inmiddels wél — `planner.ts:859`:

```ts
      if (ctx && ctx.out) ctx.out.archetypeId = gw.archetypeId;
```

opgepikt in de dag-loop op `planner.ts:703` (`archetypeId = kiOut.archetypeId || null`). En de tweede
route, de allocator, zet 'm via `quotaPlan` — `planner.ts:626` (`archetypeId = qp.archetypeId || null`).

**Gemeten op een volle 7-daagse week** (FTP, alle dagen `train`, week begint MORGEN):

```
[week-run FTP/Base ] threshold:threshold_overunder  long_z2:null ×5  sweet_spot:sweetspot_short   → 2/7
[week-run FTP/Build] threshold:threshold_overunder  threshold:threshold_overunder_long
                     sweet_spot:sweetspot_short     long_z2:null ×4                              → 3/7
[week-run FTP/Peak ] threshold:threshold_overunder  long_z2:null ×5  vo2max:vo2_microburst        → 2/7
```

**VERDICT: LIVE.** In alle drie de fasen krijgen de kwaliteitsdagen een echte `archetypeId`; alleen
`long_z2`/duurdagen houden null (correct — die lopen niet via `goalWorkout_`).

### Meet-valkuil die dit bijna verborg (en die mijn 1a-claim omver haalt)

`assignWorkouts` berekent `allocToday = stripTime_(new Date())` — de **echte dag van nu**
(`planner.ts:537`). Een testweek met datums in het VERLEDEN laat de allocator niets plaatsen:
`quotaPlan` blijft leeg, alles valt terug op de `keyIntensity`-dispatch, en in Base geeft die de
statische `sweet_spot` **zonder** archetype. Met een week in het verleden meet je dus 0/7 en concludeer
je "dormant"; met een week in de toekomst 2/7.

**Correctie op mijn laag-1a-rapport.** Daar meldde ik "`archetypeId` is in de huidige engine
STRUCTUREEL null — `keyIntensity` zet 'm nog niet". Dat was fout, en de fout zat in de meting: mijn
1a-probe gebruikte een fixture met datums in maart 2026, ruim vóór de echte systeemdatum. De comment in
`apps/web/src/lib/weekplanBlob.ts` die dit herhaalt, is daarmee ook onjuist en hoort bij de 1b-build
gecorrigeerd te worden. **De blob draagt dus wél bruikbare `archetypeId`-waarden**, en laag 1b kan
op archetype-niveau roteren — niet alleen op intent.

### Parity met GAS

De bevroren GAS draagt dezelfde comment `recency-bron (null tot commit 2)` op `Algorithm.gs:240`
(niet geverifieerd, per opdracht als context aangenomen). Als die comment daar net zo stale is als hier,
is de situatie parity-neutraal: beide kanten zetten het veld inmiddels. Wat wél zeker parity-neutraal is:
Cadans' `archetypeId`-keten is een 1:1-port van dezelfde functies, dus een verschil kan alleen uit de
DATA komen (lege seed), niet uit de logica.

---

## §4 — NUANCE: within-week rotatie

De opdracht noteert dat de within-week push (`planner.ts:740-744`) dormant is en de seed dus "alleen
vorige-week's-laatste-intent mijdt, niet binnen de week roteert". **De meting spreekt dat tegen** — hier
wint de bron:

```ts
    if (archetypeId)
      qualityRecency.push({           // planner.ts:740-744
        intent: intentFromType_(type),
        archetypeId: archetypeId,
      });
```

Omdat `archetypeId` LIVE is (§3), **vuurt deze push wel degelijk**. Maar hij is niet de belangrijkste
rotatie-motor, en dat is de echte nuance:

- **Quality-dagen die via `quotaPlan` lopen** krijgen hun type al vóór de dag-loop, in
  `allocateQualityWeek_`. Die functie roteert **intern**, met haar eigen `rec.push`
  (`planner.ts:420-423`) op de doorgegeven seed. Zichtbaar in de Build-week: `threshold` (dag 0) →
  `threshold_overunder_long` (dag 3, ander archetype, zelfde intent) → `sweet_spot` (dag 6, ander
  intent). Dat is within-week rotatie, en die is **actief**.
- De push op `:740` voegt daar bovenop de dagen toe die buiten `quotaPlan` vallen (de
  `keyIntensity`-route). Hij is dus aanvullend, niet de bron van de within-week variatie.
- `selectVariant_` roteert daarnaast de VORM binnen een gekozen archetype — een derde, onafhankelijke
  laag.

**Wat de seed toevoegt is dus specifiek de CROSS-WEEK-arm:** binnen de week roteert het al; wat ontbreekt
is dat maandag van deze week weet wat zondag van vorige week was. Nu begint elke week met een schone
`rec` en dus met hetzelfde hoogst-scorende intent.

---

## §5 — THREADING-SPEC (voor de bouw; NIET geïmplementeerd)

1. **13e, optionele parameter op `assignWorkouts`** — `weekplanReader?: ((key: string) => unknown[] | null) | null`,
   default `null`. Met `null` is het gedrag byte-identiek aan nu (de huidige `gatherWeekplanEntries_`-aanroep
   krijgt dan dezelfde `null`). De twaalf bestaande params blijven in volgorde ongemoeid, zodat de
   GAS-signatuur-vergelijking (`Algorithm.gs:985`) leesbaar blijft. **AUTHORISATIE-VEREIST** (engine).
2. Idem een `baseMonday` mee (of afleiden uit `weekDays[0].datum`) zodat de aanroep
   `gatherWeekplanEntries_(RECENCY_HORIZON_WEEKS, monday, reader)` wordt in plaats van `(…, null, null)`.
   Zonder een expliciete maandag valt `gatherWeekplanEntries_` terug op
   `weekStartDate(new Date())` — de ambient-datum, wat in tests en rond middernacht afwijkt.
3. **De client bouwt een SYNCHRONE reader.** `loadSchemaWeek` (`apps/web/src/lib/schema.ts`) haalt het
   8-weken-venster al op via `getWeekplans(monday)`. Die entries zijn per datum; de reader moet ze
   groeperen per week-maandag en de engine-sleutelvorm `"weekplan_" + yyyy-MM-dd` bedienen:
   `(key) => entriesByWeekKey.get(key) ?? null`. Geen extra fetch, geen async in de engine — precies
   het patroon dat `readRecentWeekplans` (`workers/api/src/db/repo.ts:193-222`) aan de worker-kant al
   gebruikt.
4. **NIET gegate op `PLAN_ADAPTATION_ENABLED`.** Recency is BENIGN: hij kiest tussen even geldige
   sleutelsessies en verzwaart/verlicht het plan niet. Hij is geen beslisser over belasting, dus hij
   valt buiten de reden waarom laag 1a de deciders uit zette (een stille demote, R3-T30/T22). Wel
   documenteren dát dit bewust ongegate is.
5. **Databron is `workoutType`** — dat schrijft laag 1a al naar de blob (`weekplanBlob.ts`, veld
   `workoutType` per entry), en `recencyFromWeekplan_` leest exact dat veld. `archetypeId` staat er
   inmiddels ook echt in (§3). Er is dus **geen schema- of schrijf-wijziging** nodig.
6. **Gevolgen voor de vloeren:** de engine-selftest-assert-count STIJGT bij deze bouw (nieuwe asserts
   voor de reader-tak). Niet hardcoden in prompts; lees 'm uit `HANDOFF.md` §STAND en werk die bij.
   Idem het vitest-totaal.
7. **Let op bij het testen:** gebruik weken in de TOEKOMST, anders meet je door `allocToday`
   (`planner.ts:537`) de keyIntensity-fallback in plaats van de allocator (§3).

---

*Recon, geen bouw. De meet-test is verwijderd; `git diff --stat packages/engine` is leeg.*
