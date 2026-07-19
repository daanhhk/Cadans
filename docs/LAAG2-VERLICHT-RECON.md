# LAAG 2 — VERLICHT-VOORSTEL: RECON

**Status:** read-only recon. Geen code-, engine- of schema-wijziging. Enige schrijfactie is dit doc.
GAS bevroren gelezen van schijf (`C:\Users\daan\Projects\training`, HEAD `3e8090a`), nooit via WebFetch.

**Kernvondst vooraf:** de aangenomen architectuur klopt grotendeels, maar op één punt niet — en dat punt
is precies het scharnier. **De verlicht-flow bestaat al volledig in GAS** (`WebApp.gs:1198-1226`), per-dag,
op vandaag, als VOORSTEL, met een `src:'readiness'`-override als akkoord. Cadans heeft de bouwstenen
geport maar de flow niet bedraad, én heeft de holistische readiness-band in plaats daarvan in de
**week-brede** demote gestoken. Laag 2 is dus minder "nieuw bouwen" en meer "de GAS-flow alsnog bedraden
en de band terugzetten waar hij hoort".

---

## A — FLAG & HUIDIGE DEMOTE

### A1. `PLAN_ADAPTATION_ENABLED`

Gedefinieerd in `apps/web/src/lib/planFlags.ts:25` (`export const PLAN_ADAPTATION_ENABLED = false`).
Eén lees-plek: `apps/web/src/lib/proposal.ts:302`
(`const planAdaptation = input.planAdaptation ?? PLAN_ADAPTATION_ENABLED`).

Hij gate't **exact twee** deciders, allebei blob-gevoed:

| Decider | Plek | Gevolg met vlag uit |
|---|---|---|
| `intentByDate` | `proposal.ts:143-148` (`if (!planAdaptation) return out`) | `rollingZoneCoverage_`, `zoneDebt_`, `recentHardDate_` en de `catchup_*`-takken blijven leeg-gevoed |
| `plannedTypeByDate` | `proposal.ts:383-387` | `rpeSignal_` filtert alles weg (`expectedRpe_ == null`) → altijd `normal`, geen RPE-demote |

**Niet** gegate: de cross-week recency-seed (`proposal.ts:456-462`, bewust — benign) en de V24-leesbaan
(`proposal.ts:179`).

**Bevestigt de chat-aanname** dat de vlag straks de *voorstellen* aanzet en niet de mutatie — met de
kanttekening dat de vlag vandaag níéts met verlichten te maken heeft: de RPE-demote zit erachter, de
readiness-demote niet (A2).

### A2. De band-gedreven demote — ONAFHANKELIJK van de vlag, en WEEK-BREED

**Dit is het scharnier, en het antwoord is ongunstiger dan de aanname.**

De keten:

1. `apps/web/src/lib/proposal.ts:399-406` — de band wordt naar een signaal vertaald (A3).
2. `proposal.ts:409-413` — dat signaal **overschrijft** de botte `wellnessSignal_`-vlag:
   `baseWSig = bandSignal != null ? { ...wSig, signal: bandSignal } : wSig`, daarna
   `combineSignals_(baseWSig, rSig)`.
3. Het resultaat gaat als `{ signal }` mee in de `assignWorkouts`-aanroep (`proposal.ts:442`).
4. `packages/engine/src/planner.ts:759-782` — de wellness-demotie-pass:

```ts
  if (wellness && (wellness.signal === "demote" || wellness.signal === "recovery")) {
    days.forEach((d: any) => {                        // ← planner.ts:764: ÁLLE dagen
      if (!d.voorgesteldType) return;
      if (wellness.signal === "recovery") {
        d.voorgesteldType = "recovery";
        d.reden = "Herstel — wellness laag";
        d.redenCode = "demote_wellness_rest";
      } else {
        const gedemoot = d.type === "pendel" ? "pendel_z2" : demoteType_(d.voorgesteldType);
        if (gedemoot !== d.voorgesteldType) { … d.redenCode = "demote_wellness_light"; }
      }
    });
  }
```

**Feitelijk:** `days` is hier `tePlannen` (`proposal.ts:436-441`: train, niet-gedaan, vandaag/toekomst).
De pass loopt over **alle resterende dagen van de week**, niet alleen vandaag. Eén matige ochtend-score
verlicht dus de hele rest van de week in één keer, zonder voorstel en zonder omkeerknop.

- **ACHTER DE VLAG? NEE.** Er staat geen `planAdaptation`-check in dit pad. De demote draait vandaag live.
- **PER-DAG? NEE. WEEK-BREED.**

**GAS-vergelijking (parity, van schijf).** GAS heeft dezelfde week-brede pass, byte-identiek
(`src/Algorithm.gs:1154-1171`). Het verschil zit in de **VOEDING**:

| | Voeding van de week-brede demote |
|---|---|
| GAS | `getWellnessSignal(ss)` — de BOTTE HRV/slaap-vlag (`Algorithm.gs:91`, doorgegeven op `:137`) |
| Cadans | de HOLISTISCHE readiness-band (`proposal.ts:399-413`, commit `ae00730`) — inclusief de ochtend-check-in |

Cadans heeft dus een **gevoeliger** signaal op een **grover** aangrijpingspunt gezet dan GAS. Dat is de
R4-vondst (T22) in één regel, en het is precies wat laag 2 moet ontwarren.

### A3. Mapping band → signal, en telt RPE nog mee?

`apps/web/src/lib/proposal.ts:399-406`:

```ts
  const bandSignal =
    input.readinessBand === "ready"    ? "normal"
    : input.readinessBand === "caution" ? "demote"
    : input.readinessBand === "rest"    ? "recovery"
    : null;                              // band null (te weinig data) → val terug op wSig
```

De band zelf komt uit `getReadinessScore_` (`packages/engine/src/readiness.ts:182-189`):
`score >= 62 → ready`, `>= 48 → caution`, anders `rest` (score `null` → band `null`).
De check-in verschuift de score vóór de banding (`readiness.ts:180-181`, `checkinDelta_`).

**Telt `rpeSignal_` nog mee?** Ja, structureel: `combineSignals_(baseWSig, rSig)` (`proposal.ts:413`),
en `combineSignals_` (`packages/engine/src/readiness.ts:560-574`) neemt de ZWAARSTE van beide
(`SIGNAL_RANK_`). **Maar praktisch levert RPE nu niets**: zijn input `plannedTypeByDate` is leeg zolang de
vlag uit staat (A1) → `rpeSignal_` geeft `normal` → `combineSignals_` returnt de band ongewijzigd.
Dat bevestigt de aanname "geen RPE-demote, blijft uit" — via de vlag, niet via een aparte schakelaar.

**GAS-anker:** `combineSignals_` = `src/Algorithm.gs:1229`; `getReadinessScore_` = `Algorithm.gs:1466`.
NB: GAS' signatuur is `getReadinessScore_(fs, wellness, reeks)` — **drie** params; Cadans heeft er
**vier** (`readiness.ts:71-76`, met `checkin`). De check-in-hendel is een Cadans-toevoeging.

---

## B — DE VERLICHT-TRANSFORMATIE (per-dag)

### B1. Wat de drie functies produceren

Alle drie in `packages/engine/src/coach.ts`, en **byte-identiek geport** uit `src/Coach.gs`
(geverifieerd tegen de bevroren bron):

| Functie | Cadans | GAS |
|---|---|---|
| `readinessAdjust_` | `coach.ts:595` | `Coach.gs:306` |
| `readinessEaseNaam_` | `coach.ts:624` | `Coach.gs:323` |
| `readinessRegel_` | `coach.ts:637` | `Coach.gs:328` |
| `readinessRegelDone_` | `coach.ts:664` | `Coach.gs:336` |

`readinessAdjust_(planned, band, macroFase)` — de beslissing, puur, geen IO:

- `band === "ready"` → `{action:"keep"}`
- `macroFase` is `Taper` of `Recovery` → `keep` (nooit verlichten in een taper/herstelweek)
- `!planned.isHard` → `keep` (de CALLER bepaalt `isHard` via `workoutZones`)
- `band === "caution"` → `demote` naar `demoteType_(planned.type)`; is het type **niet** in `DEMOTE_MAP`
  dan `keep` ("niets te verlichten"). `intensiteit = toType === "tempo" ? "tempo" : "rustig"`,
  `reden = "caution_key"`
- `band === "rest"` → `demote` naar **`"recovery"`**, `intensiteit "rustig"`, `reden = "rest_key"`

**Bevestigt de aanname** (caution → `demoteType_`, rest → `recovery`) exact.

`DEMOTE_MAP` (`packages/engine/src/planner.ts:791`, GAS `Algorithm.gs:1180`); `demoteType_`
(`planner.ts:824`) is een kale lookup met passthrough (`DEMOTE_MAP[type] || type`):

```
sweet_spot→tempo · threshold→tempo · vo2max→tempo · vo2_short/medium/long→tempo
vo2_3015→long_z2 · microbursts→long_z2 · big_gear/bergsim/ss_lang/low_cad→tempo
fatox→long_z2 · combo_long_with_efforts→long_z2 · combo_z2_vo2→long_z2
combo_ss_sprints→tempo · combo_all_three→combo_long_with_efforts
pendel_{ftp,vo2,conditie,climb,trip}_intervals→pendel_z2 · test→recovery
```

**Doel-set van de demote:** `tempo`, `long_z2`, `recovery`, `combo_long_with_efforts`, `pendel_z2`.
Onthoud die laatste twee — ze botsen met de override-whitelist (C1).

`readinessEaseNaam_`: `tempo → "Tempo-rit"`, `recovery → "Herstelrit"`, `long_z2 → "Rustige duurrit"`,
anders `"Rustige rit"`. **Let op:** `combo_long_with_efforts` en `pendel_z2` vallen in de fallback
`"Rustige rit"` — begrijpelijk maar onnauwkeurig voor een pendeldag.

**COPY-WAARSCHUWING (M55/T24).** `readinessRegel_` claimt de daad in de verleden tijd, vóór akkoord:
*"Ik heb je … verlicht naar …"* (`coach.ts:648-653`). Voor een VOORSTEL-flow is die copy fout — ze moet
voorwaardelijk worden ("ik stel voor …"). `readinessRegelDone_` is de bevestigde variant en klopt wél ná
akkoord. GAS gebruikt precies die splitsing (C3).

### B2. Zijn ze inert? — ja, en méér dan aangenomen

Grep over `apps/web/src`, `packages/*/src`, `workers/api/src` (dist uitgesloten):

- `readinessAdjust_` → **alleen** `packages/engine/src/selftest.test.ts:89` (import) en `:610` (aanroep).
- `readinessRegel_`, `readinessEaseNaam_`, `readinessRegelDone_` → **NUL call-sites**, ook niet in de
  selftest. Ze zijn wel publiek via de barrel (`export * from "./coach"`), maar niemand roept ze aan.

**AFWIJKING VAN DE AANNAME:** de aanname was "alléén in de selftest bedraad". Dat geldt voor
`readinessAdjust_`; de drie copy-/naam-helpers zijn zelfs dáár niet bedraad. Volledig dood gewicht,
klaar om aangesloten te worden.

**En in GAS?** Daar zijn ze **wél live** — `src/WebApp.gs:1209/1216/1218/1222`. Zie C3: dat is het
complete referentie-ontwerp voor laag 2.

### B3. De kleinste aangrijping voor "verlicht VANDAAG"

De verlichting hoeft **de engine niet te raken en `assignWorkouts` niet aan te passen**. De goedkoopste
route is een read-side overlay, net als GAS:

1. **Bepaal** — in `apps/web/src/lib/schema.ts` (waar `deriveReadiness` en `buildWeekProposal` al samen-
   komen, `loadSchemaWeek`): neem de dag van vandaag uit `proposalWeek.days`, leid `isHard` af met
   `workoutZones(d.voorgesteldType, settings.doel)`, en roep `readinessAdjust_(…, band, proposalWeek.fase)`
   aan. Let op: **`fase`, niet `macroFase`** — `readinessAdjust_` wil de fase INCL. Taper/Recovery, en
   `ProposalWeek` draagt beide (`proposal.ts:93` `fase` vs `:75` `macroFase`).
2. **Toon** — een chip/kaart op de dagkaart van vandaag met `readinessRegel_` (na copy-herziening, B1).
3. **Akkoord** — schrijf een dag-override met `src:'readiness'` (C).
4. **Terug** — de bestaande "Terug naar voorstel" wist de override (C3).

**Wat daarnaast MOET gebeuren, anders vecht de overlay tegen de bestaande demote:** de week-brede pass
(A2) verlicht vandaag al automatisch, dus een voorstel "zal ik vandaag verlichten?" zou gaan over een dag
die al verlicht ís. Zie de open vraag O1.

---

## C — OVERRIDE-AANSLUITING

### C1. Past "verlicht naar X" in `DayOverride`?

`packages/shared/src/override.ts`. De union is `LibraryOverride | FreeOverride`, en — beslissend — het
contract **anticipeert deze flow al expliciet**:

```ts
interface OverrideMeta {
  from?: string | null;                 // make-up-brondag (idempotentie)
  src?: "readiness" | null;             // ← 'readiness' = via de Verlicht-vandaag-flow gezet
  label?: string | null;                // display-label
}
```

De comment op `:22-24` zegt het letterlijk: *"src='readiness' = Verlicht"*.

**Er is dus GEEN derde variant nodig.** Twee bruikbare vormen:

- **`FreeOverride`** — `{type:"free", ritType:"vrij", intensiteit, durMin, src:"readiness", label}`.
  Dit is wat **GAS doet** (C3). `readinessAdjust_` levert `intensiteit` ("tempo"|"rustig") kant-en-klaar.
- **`LibraryOverride`** — `{type:"library", workoutType: adj.toType, durMin, src:"readiness"}`. Rijker
  (een echte gestructureerde workout), **maar loopt op een whitelist-gat**:

`OverrideWorkoutType` (`override.ts:9-15`) en de worker-validatie `OVERRIDE_WORKOUT_TYPES`
(`workers/api/src/routes/api.ts:419-426`) staan allebei alleen toe:
`recovery · long_z2 · tempo · sweet_spot · threshold · vo2max`.

**Gat:** van de vijf `DEMOTE_MAP`-doelen ontbreken **`combo_long_with_efforts`** (uit `combo_all_three`)
en **`pendel_z2`** (uit elke pendel-dag). Een library-override voor die twee wordt door de route met
400 geweigerd. De free-variant heeft dat probleem niet — nog een reden waarom GAS die koos.

De validatie accepteert `src` al: `if (ov.src != null && ov.src !== "readiness") return false;`
(`api.ts:440`). De wire is dus klaar; er is **geen API- of schema-wijziging nodig**.

**Status van `src:'readiness'` in Cadans vandaag:** gedeclareerd en gevalideerd, maar **NUL producenten
en NUL consumenten** — grep over `apps/web/src` op `'readiness'` als override-`src` en op "Verlicht"
levert niets. Het veld wacht op laag 2.

### C2. Kan `buildOverrideWorkout_` een gedemoot type bouwen?

`packages/engine/src/planner.ts:1307-1335`. Ja:

```ts
  if (ov.type === "free") return buildFreeRideWorkout_(ov, settings);
  const dur = Math.max(20, Math.round(ov.durMin || 60));
  if (ov.variantId) { … renderVariant_(…) }                 // optioneel
  return buildWorkout(ov.workoutType, dur, settings, mesoWeek, macroFase, eventCtx, dagIdx);
```

De `variantId`-tak is optioneel; zonder variant valt hij door naar `buildWorkout`, die elk type kent dat
de engine kent — inclusief `tempo`, `long_z2`, `recovery`. **Engine-technisch is een gedemoot type dus
gewoon bouwbaar**; de enige rem is de wire-whitelist uit C1, niet de engine.

### C3. De keten — bevestigd, end-to-end

| Stap | Plek |
|---|---|
| Schrijf | `putOverride(date, ov)` — `apps/web/src/lib/api.ts:233` |
| Route | `PUT /api/override/:date` — `workers/api/src/routes/api.ts:472`, validatie `isValidOverride` `:432` |
| Persist | `writeOverride` — `workers/api/src/db/repo.ts:526` (non-clobber t.o.v. `disposition`) |
| Lees | `readOverrides` `repo.ts:500` → `GET /api/overrides` `api.ts:464` → `getOverrides` |
| Engine-in | `buildWeekProposal` → `overridesByDate` (`proposal.ts:183-185`) → D2-tak `:378-390` |
| Dag-uit | `ProposalDay.override` (`proposal.ts:59`), alleen gezet als de swap echt plaatsvond |
| UI | `SchemaView.tsx:203` dispatcht naar `OverriddenDetail` |
| Omkeren | `OverriddenDetail.tsx:126` `putOverride(date, null)`, knop `:173` "Terug naar voorstel" |

**Bestaande producenten** van overrides: `WorkoutPickerSheet.tsx:199` en `Trainingen.tsx:288`. Het
verlicht-akkoord wordt een **derde producent op dezelfde keten** — geen parallelle weg.

**Het GAS-referentie-ontwerp** (`src/WebApp.gs:1198-1226`) — dit is precies de flow die laag 2 moet
spiegelen, en hij is per-dag en voorstel-gebaseerd:

```js
  var readinessState = getReadinessScore_(fs, wellness, reeks);
  var rdyCoach = (function () {
    if (actuals[todayISO]) return null;                                   // al gereden → niets
    var wp = wpByDate[todayISO];
    if (!wp || !wp.workoutType || wp.workoutType === 'free') return null; // geen engine-sessie
    if (!readinessState || !readinessState.band) return null;
    var ovToday = overrides[todayISO];
    if (ovToday) {
      if (ovToday.src === 'readiness')                                    // AL akkoord → committed-banner
        return { kind:'readiness', committed:true, …, regel: readinessRegelDone_(fromNaam) };
      return null;                                                        // handmatige override → geen coach
    }
    if (wp.sessies && wp.sessies.length > 1) return null;                 // multi-sessie (pendel) overslaan
    var zs = workoutZones(wp.workoutType, settings.doel);
    var isHard = zs.indexOf('high') >= 0 || zs.indexOf('anaerobic') >= 0;
    var adj = readinessAdjust_({ type: wp.workoutType, isHard: isHard }, readinessState.band, macro.fase);
    if (adj.action !== 'demote') return null;
    return { kind:'readiness', …, regel: readinessRegel_(…),
             adaptatie: { dISO: todayISO, type:'free', ritType:'vrij', intensiteit: adj.intensiteit,
                          durMin: Math.round(wp.minuten || 0), src:'readiness',
                          label: 'Verlicht naar ' + toNaam } };
  })();
```

Vijf dingen om over te nemen: (1) alleen **vandaag**; (2) **suggestie**, de mutatie gebeurt pas bij
akkoord; (3) `src:'readiness'` is tegelijk het **idempotentie-merk** — is hij er al, dan toont GAS de
bevestigde regel in plaats van opnieuw voor te stellen; (4) een **handmatige** override onderdrukt het
voorstel volledig; (5) **multi-sessie (pendel) wordt overgeslagen** — wat meteen het `pendel_z2`-gat
uit C1 omzeilt.

---

## D — INHALEN: REDUNDANTIE + UITLEG

### D1. Draait de debt-aware allocator op de forward-dagen? — ja, maar hij krijgt NUL debt

De machinerie staat en is bedraad:

- `zoneDebt_` wordt aangeroepen (`proposal.ts:366-375`) met `intentByDate`, de planner-vlaggen en de
  activities.
- `allocateQualityWeek_` krijgt `debt` mee (`proposal.ts` → `planner.ts:553`) en doet een **debt-pre-claim**
  (`planner.ts:377-395`): één quality-slot wordt geclaimd door `debtPreferredType_`.
- De `catchup_*`-takken zitten in de dag-loop (`planner.ts:666-694`).

**Maar de invoer is leeg, om twee onafhankelijke redenen:**

1. `intentByDate` is `{}` zolang `PLAN_ADAPTATION_ENABLED` uit staat (A1) → in `zoneDebt_`
   (`packages/engine/src/weekprep.ts:121`) is `intent` altijd de nul-vector.
2. `zoneDebt_` telt alleen dagen met `train && gedaan` (`weekprep.ts:107`), en `planner_days.gedaan`
   wordt **altijd als 0 weggeschreven** (`workers/api/src/db/repo.ts:367`) → de lus draait nul keer.

Gevolg, met de drempels erbij: `debtPreferredType_` (`planner.ts:95-111`) eist `debt[b] > 4` → returnt
`null` → **de pre-claim vuurt nooit**. De `catchup_*`-takken eisen `debtWerk.high > 30`
(`DEBT_FORCE_HIGH_MIN`, `planner.ts:50`) of `debtWerk.anaerobic > 20` → **nooit waar**.

> **AFWIJKING VAN DE CHAT-AANNAME — de belangrijkste van deze recon.**
> De aanname was: *"Inhalen vervalt als apart voorstel omdat Model-2 het zone-tekort al in de basis
> corrigeert."* **Vandaag corrigeert de basis NIETS**: het hele debt-pad is dood, in beide richtingen
> afgesneden. De conclusie "apart inhaal-voorstel overbodig" is dus **voorwaardelijk, niet feitelijk** —
> ze geldt pas als (a) `PLAN_ADAPTATION_ENABLED` aan gaat én (b) `gedaan` echt afgeleid wordt (dat laatste
> is expliciet naar laag 2 doorgeschoven bij de 1a-bouw). Laat je inhalen weg zonder (a)+(b), dan blijft
> het zone-tekort **volledig oningevuld**.

### D2. Wat is `catchup_*`, en voegt het iets toe?

Twee lagen, niet één:

- **De pre-claim** in `allocateQualityWeek_` (`planner.ts:377-395`) — plant preventief een quality-dag van
  het tekort-type. Dat is "Model-2 corrigeert in de basis".
- **De `catchup_*`-takken** in de dag-loop (`planner.ts:666-694`) — reactief, mét een eigen reden:
  - `:666` weekend + `high`-debt > 30 → `combo_long_with_efforts`, `redenCode "catchup_high"`
  - `:672` weekend + `anaerobic`-debt > 20 → idem, `"catchup_anaerobic"`
  - `:694` vrije dag → `debtPreferredType_`, `redenCode "catchup_" + bucket`
  - alle drie zetten `debtForced = true`, wat de dag **vrijstelt van de avoid-consecutive-hard-guard**
    (`planner.ts:722`).

**Voegt het iets toe? Ja, twee dingen** die de pre-claim niet levert: de weekend-forcering bij een grote
achterstand, en de `debtForced`-vrijstelling. Plus de reden-string die de gebruiker te zien krijgt.

> **AFWIJKING:** "laat catchup liggen, dat laat geen gat achter" is **niet** wat de code zegt. Het gat is
> klein en alleen bereikbaar bij een groot tekort (>30 min high), maar het bestaat. Belangrijker: zolang
> D1 geldt is de vraag academisch — er ís geen debt om op te reageren.

**GAS-parity:** identiek aanwezig, `src/Algorithm.gs:1091` / `:1096` / `:1114`
(`'Inhaalsessie — ' + redenZoneLabel_(…) + ' tekort'`), `computeZoneDebt_` op `Algorithm.gs:492`,
`debtPreferredType_` op `:567`. Cadans voegde alleen `redenCode` toe (GAS heeft enkel de reden-string).

### D3. Is de uitleg-copy er al? — ja, volledig

`apps/web/src/lib/coachNarrative.ts:44-63` draagt al drie warme varianten per bucket, precies in de
gevraagde toon:

- `catchup_high` — *"Er bleef deze week wat intensiteit liggen — deze sessie haalt dat mooi in. Zo houd je
  je week in balans."*
- `catchup_anaerobic` — *"Je anaerobe prikkel bleef nog liggen — deze sessie haalt 'm in. Kort en pittig,
  precies wat er miste."*
- `catchup_low` — *"Er ontbrak nog wat duurvolume deze week — deze rustige rit vult dat aan. De basis waar
  alles op rust."*

De aanhaking is er dus al: `redenCode` reist mee op `ProposalDay.redenCode` (`proposal.ts:55`), de
narrative-laag mapt die code naar copy, en `redenCode.test.ts:148-181` dekt de `catchup_*`-mapping al.
**Er hoeft voor de uitleg niets gebouwd te worden** — alleen de invoer moet gaan bestaan (D1).

Kanttekening voor de copy-review: twee van de drie varianten claimen een daad in de verleden tijd
("Ik heb je schema bijgesteld"), net als `readinessRegel_` (B1). Voor voorstel-en-bevestig hoort dat
voorwaardelijk te worden.

---

## OPEN BOUW-VRAGEN

**O1 — Moet de week-brede demote per-dag worden? (de kernvraag)**
Vandaag verlicht de band week-breed, buiten de vlag om (A2). Een per-dag verlicht-VOORSTEL bovenop een
al-week-breed-verlaagd plan is tegenstrijdig: het voorstel gaat dan over een dag die al gedemoot is.
Drie opties:

- **(a) GAS-parity herstellen** — voed `assignWorkouts` weer met de **botte** `wellnessSignal_`
  (`wSig`, `proposal.ts:391`; laat de `bandSignal`-override op `:399-413` vervallen) en zet de
  **holistische band** op het per-dag-voorstel. Dat is exact GAS' verdeling, herstelt de parity die
  `ae00730` losliet, en geeft Daan wat hij vraagt. **Mijn voorkeur.**
- **(b) Week-brede pass helemaal uitzetten** en alles via het voorstel doen. Zuiverder qua agency, maar
  divergeert van GAS en laat de meerdaagse-uitputting-case (aanhoudend lage HRV) onbehandeld.
- **(c) Laten staan en het voorstel alleen op niet-gedemote dagen tonen.** Goedkoop, maar behoudt precies
  de stille week-brede mutatie waar T22 over ging.

Dit is een model-beslissing (M10/M30), geen implementatiedetail — hoort vóór de bouw beslist.

**O2 — `free` of `library` als akkoord-vorm?** GAS kiest `free` (C3), wat het whitelist-gat (C1) en de
pendel-case omzeilt maar een minder rijke workout geeft (geen structuur/blokken). `library` geeft een
echte workout maar vereist óf de multi-sessie-skip van GAS, óf uitbreiding van `OVERRIDE_WORKOUT_TYPES`
met `pendel_z2` en `combo_long_with_efforts` (= API-wijziging).

**O3 — Copy-herziening.** `readinessRegel_` en twee `catchup_*`-varianten claimen de daad vóór akkoord
(M55/T24). Voor voorstel-en-bevestig moeten ze voorwaardelijk; `readinessRegelDone_` blijft de
na-akkoord-vorm. Raakt de engine (`coach.ts`) → **AUTHORISATIE-VEREIST**, of de copy wordt web-side
overschreven.

**O4 — Is `gedaan` een voorwaarde voor laag 2?** Voor het verlicht-voorstel: nee. Voor de claim "inhalen
is overbodig omdat de basis het corrigeert": **ja** (D1). Als laag 2 puur het verlicht-voorstel wordt,
blijft het zone-tekort dus oningevuld — dat moet expliciet geaccepteerd of apart ingepland.

**O5 — Multi-sessie/pendel.** GAS slaat pendeldagen over (`wp.sessies.length > 1`). Cadans' pendeldagen
demoten naar `pendel_z2`, dat niet in `readinessEaseNaam_` staat ("Rustige rit") en niet in de
override-whitelist. Overnemen van GAS' skip is de goedkoopste weg.

---

*Recon, geen bouw. Geen code-, engine- of schema-wijziging. GAS gelezen van schijf @ `3e8090a`.*
