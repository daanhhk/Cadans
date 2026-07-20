# T28 FASE 3 — RECON (weekdoel + weekfeedback + pendel-opschoning)

**Status:** recon. READ-ONLY, docs-only. Geen code gewijzigd; `git diff --stat packages/engine` is
leeg. Alle regel-refs zijn geverifieerd tegen de repo op de commit waarop dit doc landt. GAS is van
schijf gelezen (`C:\Users\daan\Projects\training`, HEAD `3e8090a`), nooit via WebFetch.

**Norm.** Coaching-deugdelijkheid. GAS is herkomst, geen gezag — behalve waar dit doc GAS aanwijst
als bewijs dat een Cadans-afwijking een *bug* is en geen keuze (§1.3).

---

## §1 — HUIDIGE MECHANIEK

### 1.1 Het weekdoel bestaat, maar niemand luistert

`settings.weekUren` (kolom `week_uren`) is in fase 1 neergezet en loopt volledig door de keten:
`schema.ts:62` → `repo.ts:70`/`:104` → `api.ts:604` → `settings.ts:19/42/65` → `Instellingen.tsx:631`.

**De engine leest het nergens.** Repo-brede grep op `weekUren|week_uren` geeft in `packages/engine`
nul treffers. De enige consument is de projectie-startwaarde:

```ts
// apps/web/src/pages/Niveau.tsx:158
settings?.weekUren ?? (weeklyHoursRecent_(rows, 42) as number | null),
```

Het weekdoel is dus vandaag een **display-getal**. Het stuurt geen enkele plan-beslissing.

### 1.2 Waar de duur vandaan komt — en waar het week-totaal ontstaat

| | Plek | Wat |
|---|---|---|
| Per-dag-duur (niet-pendel) | `proposal.ts:533` | `sessieMin = d.minuten` — exact de beschikbare minuten |
| Per-dag-duur (pendel) | `proposal.ts:530-533` | `sessieCount = pendelAantal`, `sessieMin = settings.pendelDuurMin` |
| Sessie-render | `planner.ts:984` | `renderVariant_(variant, settings, mesoWeek, macroFase, mins)` schaalt naar `mins` |
| Archetype-keuze | `planner.ts:409-412` | `bt = min(pendel ? pendelDuurMin : sel.minuten, profiel.maxDuurMin ?? ∞)` |
| **Week-totaal** | `planner.ts:229-234` | `weekV = Σ Number(d.minuten) / 60` over `weekDays` |

`weekV` heeft precies één consument: de **volume-adaptieve intent-weging**.
`goalEffWeights_(profiel, fase, V)` (`archetypes.ts:1235`) roept `volumeModulatie(V, fase, profiel)`
aan (`:1243`), die alleen in Base werkt en boven `BASE_POLAR_VOL_U0 = 9` uur vo2 laat opkomen
(`:1250`); daarnaast gate't `V ≤ 9` de Base-vo2 in `goalPickIntent_` (`:1288`).

**Conclusie: `weekV` beïnvloedt vandaag WELKE intensiteit gekozen wordt, nooit HOE LANG een sessie
duurt.** Er is geen enkele plek waar een weekbudget een duur verlaagt. Dat is precies de hendel die
fase 3 moet bouwen.

### 1.3 De pendel-dubbeltelling — een CLIENT-bug, geen engine-afwijking

Vier paden, geverifieerd:

1. **Opslag/UI.** `Instellingen.tsx:791-805` toont "Pendel (enkele reis) · heen + terug = 2×" en
   schrijft `legToRoundTrip(v) = v × 2` weg (`settings.ts:175`). Wat in D1 staat is dus de
   **round-trip**. Bij het tonen wordt `roundTripToLeg` teruggerekend.
2. **Sessie-generatie.** `proposal.ts:530-533`: `sessieCount = pendelAantal`, en **elke** sessie
   krijgt `sessieMin = settings.pendelDuurMin`. De vroege sessies zijn geforceerd `pendel_z2`, de
   laatste draagt het coach-type (`proposal.ts:536-537`).
3. **Archetype-keuze.** `planner.ts:410` leest voor een pendeldag óók `settings.pendelDuurMin`.
4. **Week-totaal.** `planner.ts:232` telt `d.minuten` — de beschikbaarheid uit de weekplanner, níét
   `pendelDuurMin × pendelAantal`.

**GAS is hier de doorslaggevende bron.** `src/Settings.gs:39` labelt het veld:

```
PENDEL_DUUR: { row: 52, label: 'Pendel duur per rit', unit: 'min' }
```

**"per rit"** — per losse rit, niet de round-trip. Default `pendelDuurMin: 80` met `pendelAantal: 2`
(`Settings.gs:94-95`) betekent in GAS dus 2 × 80 = 160 min op een pendeldag. En
`Algorithm.gs:192-193` is byte-identiek aan wat Cadans doet:

```js
var sessieCount = isPendel ? Math.max(1, Math.round(settings.pendelAantal) || 1) : 1;
var sessieMin   = isPendel ? (settings.pendelDuurMin || d.minuten) : d.minuten;
```

**Dus: de Cadans-ENGINE wijkt niet af van GAS. De afwijking zit in de Cadans-SETTINGS-UI**, die als
enige `legToRoundTrip` toepast (`Instellingen.tsx:800` is de enige niet-test-consument). Het gevolg is
een factor 2:

> **Concreet.** Daan rijdt 75 min enkele reis, 2 ritten per pendeldag.
> - Hij typt `75`. Opgeslagen: `legToRoundTrip(75) = 150`.
> - De engine maakt `pendelAantal (2) × 150 = **300 min**` aan sessies.
> - Correct is `2 × 75 = **150 min**`.
> - Bij ~0,65 IF-equivalent scheelt dat grofweg **~55 TSS** per pendeldag die niet gereden is;
>   over twee pendeldagen loopt de week ~110 TSS te hoog.
> - Tegelijk telt `weekV` de planner-beschikbaarheid (bv. 150) — de twee paden verschillen dan
>   met exact dezelfde factor 2.

**Extra bevinding: de comment in `settings.ts:173-174` is FEITELIJK ONJUIST.** Er staat *"The engine
reads the round-trip value and splits it into two halves."* Een grep op `packages/engine` naar een
halvering (`/ 2`, `* 0.5`, `roundTrip`) geeft **nul** treffers — noch in Cadans, noch in GAS. Die
comment beschrijft een split die nooit heeft bestaan en is waarschijnlijk de oorsprong van de bug.

**Oordeel: BUG, geen bewuste fork.** De fix hoort in de UI/opslag (één plek, `pendelDuurMin` = duur
per rit, zoals GAS), niet in de engine.

### 1.4 Waar een weekdoel-param zou binnenkomen

`assignWorkouts` heeft **13 parameters** (`planner.ts`), de dertiende optioneel:

```
days · settings · mesoWeek · macroFase · dekking · wellness · klimType ·
recentHardDate · debt · isTripEvent · taperCtx · weekDays · recencyEntries?
```

`settings` komt als `settingsE` uit `proposal.ts` (de client-settings met `doelStart` als Date) en is
**al aanwezig** in `assignWorkouts` én in `allocateQualityWeek_` (die krijgt 'm als 8e argument).
`settings.weekUren` reist dus vandaag al mee tot in de allocator — er is **geen nieuwe parameter
nodig** om het weekdoel te bereiken. Dat is een wezenlijk verschil met 1b, waar de recency-entries
van buiten moesten komen.

`effectiveMacroFase_` wordt in `proposal.ts:275` bepaald en als `macroFase` doorgegeven; hij is
beschikbaar op elk punt van de duur-toewijzing. De ±1u fase-modulatie heeft dus ook geen nieuwe
invoer nodig.

### 1.5 De week-invoer: geen totaal, geen coach-plek

`buildWeekForm` (`apps/web/src/lib/planner.ts:93`) bouwt zeven `DayForm`s met `minuten` als string.
De editor (`apps/web/src/pages/Weekplanner.tsx`, route `/weekplanner` via `App.tsx:50`) toont per dag
een minuten-veld (`:129-130`, default 120) — maar **berekent nergens een week-totaal** (geen
`reduce`/`totaal` in het bestand) en heeft **geen CoachCallout of narrative-plek**. Beide zijn dus
nieuw te bouwen voor de weekfeedback.

---

## §2 — ENGINE-WIJZIGINGEN (AUTORISATIE VEREIST)

**Voorstel, niet toegepast.** Belangrijk kader: dit is de **BELASTING-gedreven** hendel. Hij staat
volledig los van fase 2's fatigue-pad (readiness → per-dag → opt-in → omkeerbaar), dat ongemoeid
blijft. Waar fase 2 vraagt *"hoe voel je je vandaag?"*, vraagt fase 3 *"heeft deze week al genoeg
gehad?"*.

### 2a — Het weekdoel als duur-consument

**Functie:** `allocateQualityWeek_` (`planner.ts`, de plek waar de week als geheel wordt bekeken) plus
de duur-toewijzing in de dag-loop van `assignWorkouts`.

**Signatuur: geen wijziging nodig** (§1.4) — `settings.weekUren` is er al. Dat maakt dit een
kleinere ingreep dan 1b of de M63-fork.

**Nieuwe logica, byte-precies:**

1. **Doelbudget bepalen.** `doelMin = (settings.weekUren ?? null) * 60`. Is `weekUren` null → **geen
   enkele gedragswijziging**; alle bestaande uitkomsten blijven byte-identiek. Dat is meteen de
   veiligheidsklep: de hendel is opt-in via het instellingen-veld.
2. **Effectief doel** = `doelMin` ± de fase-modulatie uit 2b.
3. **Toewijzen tot het budget.** De allocator loopt zijn dagen al in een vaste volgorde. Houd een
   loper `besteed` bij; per dag is de sessieduur
   `min(d.minuten, max(0, effectiefDoel − besteed))`, geclampt op een ondergrens (voorstel: 20 min,
   gelijk aan de override-contractgrens).
4. **Budget op → korter of rust.** Valt de resterende ruimte onder de ondergrens, dan wordt de dag
   **rust** in plaats van een minisessie. Dat is de week-blik-variant van herstel-bescherming.
5. **`weekV` blijft op `d.minuten`.** Net als bij de fase-1-cap-discussie: `weekV` is de
   *beschikbaarheid* en voedt de intent-weging; zou hij de toegewezen duur volgen, dan verschuift
   één ingekorte dag de intensiteitskeuze van de hele week — een verborgen tweede effect.

**Herstel blijft beschermd (M72).** De volgorde waarin dagen worden ingekort mag een `recovery`-dag
niet raken; die staat sowieso buiten `eligible_` (`planner.ts:203-212`).

### 2b — De ±~1u fase-modulatie

**Functie:** dezelfde plek; `macroFase` is beschikbaar (§1.4).

`effectiefDoel = doelMin + faseDelta(macroFase)`, met `faseDelta` een kleine named tabel in de engine
(één plek, tunebaar — zoals `CAUTION_DUR_FACTOR` in fase 2a-ii). De richting per fase is een
**open beslissing** (§4), niet iets wat ik uit de code kan afleiden.

**Uitleg-plicht.** Zodra het effectieve doel afwijkt van het ingestelde getal, moet de coach dat
zeggen — anders is het een stille mutatie (M10). De reden-code hoort mee te reizen zoals `redenCode`
dat nu al doet, zodat de copy-laag hem kan oppakken.

---

## §3 — COACH-COPY (weekfeedback op de week-invoer)

Persona-conform met `coachNarrative.ts`: voorwaardelijk, geen daad-claim, en het "waarom" erbij.
Rendert bij de week-invoer (§1.5 — nieuwe plek).

**Onder het doel** (ingevoerd < effectief doel):

> "Je hebt deze week {X} uur ingepland, iets onder je {Y} uur. Prima — ik optimaliseer voor wat er
> is. Heb je onverwacht ruimte, dan bouw ik 'm graag in."

**Ruim boven het doel** (ingevoerd ≫ effectief doel):

> "Mooi, {X} uur beschikbaar — ruim boven je {Y} uur. Daar kunnen stappen in. Ik houd de opbouw
> geleidelijk; meer is alleen beter als je het herhaalbaar volhoudt."

**Op/rond het doel:** geen regel. Stilte is hier het juiste signaal — een bevestiging bij elke
normale week wordt ruis.

**Bij een afwijkend effectief doel** (fase-modulatie actief), aanvullend:

> "In deze fase mik ik op {Z} uur in plaats van je gebruikelijke {Y} — {reden}."

---

## §4 — OPEN BESLISSINGEN VOOR DAAN

Geen van deze is uit de code of uit GAS af te leiden; het zijn trainingsinhoudelijke keuzes.

1. **Grootte van de fase-modulatie.** Is "±~1u" letterlijk 60 minuten, of een percentage van het
   weekdoel (bv. ±15%)? Een percentage schaalt mee met kleine én grote weken; een vast uur is
   voorspelbaarder.
2. **Welke fasen +uur, welke −uur?** Voor de hand ligt Peak/Build omhoog en Recovery/Taper omlaag —
   maar Base is de fase waar volume juist thuishoort, dus dat is geen automatisme. **Beslissing.**
3. **Drempels voor de copy.** Wanneer is het "onder doel" en wanneer "ruim erboven"? Voorstel als
   startpunt: onder = < 90% van het effectieve doel, ruim erboven = > 120%. Beide getallen zijn
   arbitrair tot Daan ze bevestigt.
4. **Welke dag wordt korter of rust bij budget-overschot?** Kandidaten: de laatste dag in de week,
   de dag met de laagste trainingswaarde (endurance vóór kwaliteit — spiegelt M65), of de dag na een
   harde dag. Dit bepaalt hoe de inkorting *voelt* en is de meest inhoudelijke van de vijf.
5. **Pendel terug-intensiteit.** De heenrit is geforceerd `pendel_z2` (`proposal.ts:536`), de
   terugrit draagt het coach-type. Blijft dat zo, of krijgt de terugrit een eigen default? En hoort
   de pendel-belasting mee te tellen in het weekbudget uit 2a (mijn aanname: ja — het is echte
   belasting)?

---

## §5 — FASERING-VOORSTEL

Elke stap eindigt met **STOP-en-verifieer**: volledige gate + CI groen, vloeren niet geregresseerd,
Daan kijkt vóór de volgende stap.

**3a — PENDEL-OPSCHONING (GEEN ENGINE).** Los van de rest en de enige stap die een echte bug fixt.
`pendelDuurMin` wordt duur **per rit** (GAS-conform): `legToRoundTrip`/`roundTripToLeg` uit de
settings-flow, label en `sub` bijwerken, en de onjuiste comment in `settings.ts:173-174` corrigeren.
**Let op de bestaande data:** opgeslagen waarden zijn round-trips en zijn na de fix een factor 2 te
hoog — er is een eenmalige conversie of een expliciete herbevestiging door Daan nodig. *Raakt de
engine niet; alleen het vitest-totaal stijgt.*
*STOP: bevestig met een test dat een pendeldag `pendelAantal × duur-per-rit` minuten oplevert, en
controleer de bestaande D1-waarde vóór de uitrol.*

**3b — WEEKDOEL ALS DUUR-CONSUMENT (ENGINE).** 2a uit §2. Begint met de open beslissingen 4 en 5.
`weekUren` null → byte-identiek; dat is de regressie-borging.
*STOP: byte-identiek bewijzen bij `weekUren = null`, en het gedrag tonen bij een gezet doel.*
**ENGINE-AUTORISATIE VEREIST**; de selftest-assert-count stijgt — lees de nieuwe waarde uit de suite,
hardcode geen getal.

**3c — FASE-MODULATIE + WEEKFEEDBACK-COPY (ENGINE + web).** 2b uit §2 plus §3. Vereist beslissingen
1, 2 en 3. De copy-plek bij de week-invoer is nieuw (§1.5).
*STOP: de uitleg-regel verschijnt zodra het effectieve doel afwijkt; geen stille mutatie.*

**Volgorde-argument:** 3a eerst omdat het een bug is die de *invoer* van 3b vervuilt — een weekbudget
bouwen op een pendel-telling die een factor 2 verkeerd staat, levert een hendel die meteen scheef
trekt.

---

*Recon, geen bouw. `packages/engine` ongemoeid; `training` alleen gelezen @ `3e8090a`.*
