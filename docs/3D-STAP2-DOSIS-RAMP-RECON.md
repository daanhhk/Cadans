# RECON — 3d stap 2: de dosis-gedreven meso-ramp (kwaliteits-tijd-in-zone + taper-guard)

**Status:** recon-doc. GEEN code gewijzigd; aan het eind toont `git diff --stat` alleen dit doc,
`packages/engine` leeg. GAS-bron alleen gelezen @ `3e8090a`, nooit geschreven. Dit doc schrijft
byte-precies uit wát de bouw-stap gaat veranderen — de bouw is een aparte, geautoriseerde ronde.

## Context & scope

- **3d-proper** = dosis-gedreven meso-ramp + drie uitgestelde items, op het STAP 1-teller-fundament
  (`mesoCycleWeek_`, cyclische 3:1-mesocyclus). **STAP 2 = DEZE stap.** STAP 3 = deload-inhoud.
  STAP 4 = fatigue-aware dosering.
- STAP 2 verbreedt de dosis-ramp van "alleen `long_z2`-duur" naar de **KWALITEITS-tijd-in-zone**, en
  voegt een **taper-guard** op de deload toe. Karakter blijft invariant (M74–M78): %FTP nominaal,
  alleen de dosis (tijd-in-zone / volume) beweegt.
- **Fundering-keuzes (Daan-akkoord):** (Q1) volume + kwaliteits-overload via reps/tijd-in-zone bij
  VASTE %FTP; (Q2) `doelStart`-cadans behouden + taper-guard (GEEN fase-verankering nu).

## De drie stuurvariabelen (coherente mapping)

- **KWALITEIT → tijd-in-zone.** Fill-absorb: schaal de core-werktijd ×f, de bestaande endurance-fill
  absorbeert het verschil → sessie-totaal blijft = `doelMin` (= beschikbare minuten). Meer
  tijd-in-zone, zelfde totaalduur, hogere TSS. Availability-respecterend.
- **ENDURANCE → volume.** `genericLongZ2` groeit de lange rit al ×f (blokweek 2/3 langer, deload
  ×0.60). Al live → GEEN change in STAP 2; dit is de volume-helft, hier gedocumenteerd.
- **weekTSS** = het gevolg van beide.
- **STELLINGNAME (Daan te bevestigen):** `plannerMin` = NOMINAAL (de basis waar de ramp omheen
  beweegt), geen hard plafond. Consistent met hoe `genericLongZ2` nu al voorbij `plannerMin` groeit
  op opbouwweken. Raakt T28 (geen gedeclareerd capaciteit-veld); een echte capaciteit-scheiding is
  een latere fase.

## Byte-precieze mechanica

### KWALITEITS-RAMP (nieuw) — in `expandArchetype_` ÉN `renderVariant_`

- `f = mesoFactor(mesoWeek)`.
- `nominalWork` = som van de core-WERKtijd (int: `reps × onMin` bij high/anaerobic; steady core:
  `durMin`). `nominalRest` (int `offMin` × reps) + warmup + cooldown = de vaste, NIET-geschaalde
  overhead. `fillNominal = doelMin − (warmup + nominalWork + nominalRest + cooldown)` = de huidige
  endurance-fill.
- `addedWork = min( nominalWork × (f − 1) , max(0, fillNominal) )` — converteer fill → werk, cap op
  de beschikbare fill.
- `schaalFactor = nominalWork > 0 ? (nominalWork + addedWork) / nominalWork : 1`.
- Schaal ELK werk-blok (int `onMin`, steady core `durMin`) met `schaalFactor`; `offMin`/warmup/
  cooldown ONgemoeid.
- `fill = fillNominal − addedWork` (≥ 0). Totaal blijft `doelMin` exact. Kan NOOIT overlopen (geen
  `tooLong` uit de ramp).
- **Afronding:** de geschaalde werk-blok-minuten → rond op de bestaande `r1`-stijl (`Math.round(x*10)/10`
  = 0,1 min) in beide paden, zodat de display-strings de geschaalde waarde tonen zonder een nieuwe
  afrond-conventie te introduceren. (De 0,5-min-variant uit de opdracht is bewust NIET gekozen: `r1`
  is al de huisstijl in `expandArchetype_` :56 en de `Math.round(onMin*10)/10` in `renderVariant_`
  :1038 — één conventie, minder drift. Keuze gemeld conform prompt.)
- `f = 1` (blokweek 1) → `addedWork = 0` → byte-identiek aan nu. `f < 1` (deload) → `addedWork`
  negatief; N.V.T. in STAP 2 want de deload heeft geen kwaliteit (`allocActive = false`) → dat is
  STAP 3.
- `expandArchetype_` krijgt `mesoWeek` via `ctx` (nu `{ftp, lthr, doelMin}` — planner.ts:1472-1476,
  ZONDER mesoWeek); `buildWorkout` (planner.ts:1450 heeft `mesoWeek` als param) geeft 'm mee.
  `renderVariant_` gebruikt de bestaande `_mesoWeek`-param (planner.ts:977 — underscore eraf; de
  call op :1499 geeft `mesoWeek` al door).
- **BUITEN SCOPE:** de doel-libraries (`workoutForFtp`/`Vo2max`/`Conditie`/`Beklimmingen`) — "nog
  callable, niet meer geselecteerd"; de live-kwaliteitspaden zijn `expandArchetype_` +
  `renderVariant_`. Een type dat naar een library doorvalt ramp't dus niet (acceptabel; niet
  geselecteerd).

### ENDURANCE-RAMP

`genericLongZ2` ongewijzigd (×f al aanwezig, planner.ts:1567). Pendel (`genericPendelZ2`,
planner.ts:1971) ongewijzigd (vaste woon-werkrit, schaalt fysiek niet).

### TAPER-GUARD (deload block-anchoring) — in `assignWorkouts`

- **Probleem:** een kalender-deload (`mesoWeek === 4`) die IN of vlak VÓÓR de taper valt → dubbel-easy
  → vlak.
- **Regel:** `nearTaper` = `taperCtx?.datum` bestaat EN `dagen(weekMaandag → taperCtx.datum)` in
  `[0 .. 7 + taperCtx.venster]`. Dan `const isRecovery = isMesoRecovery && !nearTaper` (planner.ts:499
  — nu simpelweg `= isMesoRecovery`). Zo wordt de deload onderdrukt in de taper-week ÉN de week
  ervoor → die pre-taper-week is een normale (belaste) opbouwweek; de taper zélf is de deload.
  (Taper-dagen overrulen sowieso al per dag via `taperActief`/`taperCtx`, planner.ts:496 + de per-dag
  overlay :557/:574-591; het onderdrukken her-activeert hooguit `allocActive`, onschadelijk.)
  `weekMaandag` = `days[0].datum` (planner.ts:476, chronologische week-grid).
- **Dormant** voor Daans huidige datums (event ~9 mnd weg); borgt de toekomst.

## Character-invariantie (bewijs + test)

- `adj` blijft de identiteit in beide paden (archetypes.ts:52-54; planner.ts renderVariant_ adj) →
  %FTP per blok nominaal over mesoWeek 1/2/3/4. De ramp raakt uitsluitend werk-DUUR / tijd-in-zone,
  nooit watts.
- **Nieuwe/uitgebreide test:** assert dat de %FTP-ranges per blok IDENTIEK zijn over mesoWeek 1..4
  (alleen duur/reps verschillen), op BEIDE paden — bouwt voort op de bestaande
  `testKarakterInvariantie`. Plus een test dat de kwaliteits-tijd-in-zone (en TSS) van een
  fill-headroom-dag stijgt blokweek 1 < 2 < 3, en dat blokweek 1 byte-identiek is aan de huidige
  output.

## Fill-headroom-observatie (waar de ramp bijt)

De ramp kan alleen kwaliteit toevoegen zolang er endurance-fill is om naar werk te converteren.

- **`expandArchetype_`-pad.** `fixed = warmup + core-werk + rust + cooldown` (planner-equiv.
  archetypes.ts:168) ≈ `duurRange[0]` van het archetype (de ondergrens IS de fill-loze minimumduur —
  geverifieerd: `threshold_2x20` [75,110] = 15 warmup + 2×(20+5) + 10 cooldown = 75). De allocator
  (`goalWorkout_`) kiest UITSLUITEND een archetype waarvan `duurRange` de dagminuten OMVAT
  (`beschikbareTijd ≥ duurRange[0] && ≤ duurRange[1]`), dus altijd `doelMin ≥ duurRange[0]` →
  **headroom = `doelMin − duurRange[0]`**, tussen 0 (dag exact op de ondergrens) en
  (`duurRange[1] − duurRange[0]`). Op de meeste dagen POSITIEF (de ramp bijt); valt de dag exact op
  de archetype-ondergrens, dan headroom 0 → `addedWork` gecapt op 0 → geen verandering
  (availability-respecterend by design). Voorbeelden (fixed = min): `threshold_2x20` [75,110],
  `threshold_4x10` [77,110], `sweetspot_3x15` [82,115], `sweetspot_4x12` [85,120], `vo2_4x5`
  [61,100] — een 90-100 min dag levert 15-25 min fill die de ramp kan omzetten.
- **`renderVariant_`-pad** (variant-pools long_z2/tempo/sweet_spot/threshold/vo2max/klim/conditie).
  `gap = mins − warm − cool − mainMin` (planner.ts:1075) met een VASTE `mainMin` per variant. Ruime
  headroom op `long_z2`/lange dagen (mainMin ≈ 90 maar de dag is langer → grote Z2-fill); KRAP tot
  NUL op korte tempo/threshold-varianten waar `mainMin ≈ mins` (bv. `tempo_45` main 45 op een 60-min
  dag → warm 12 + cool 8 + 45 = 65 > 60 → `scaleBlocksToFit_` trimt, gap 0). Kort samengevat: de
  ramp bijt evenredig met de fill-ruimte van de dag; korte, strakke sessies ramp'en minder dan lange.

## Scope-grenzen (wat NIET verandert in STAP 2)

- De kwaliteits-QUOTA (`kwaliteitPerWeek` per fase) — de meso voegt GEEN harde dagen toe.
- De deload-INHOUD (STAP 3). Fatigue-awareness (STAP 4). De client / `proposal.ts` (`mesoWeek` is al
  correct samengesteld via STAP 1). Pendel-load. `long_z2` (ramp't al).

## Verwachte byte-impact

- Alleen blokweek 2/3-kwaliteitssessies MÉT fill-headroom wijzigen (+ de al-bestaande `long_z2`-groei).
  Blokweek 1 en de deload-week byte-identiek. De taper-guard is alleen zichtbaar via een fixture.
- Engine-selftest-assert-count stijgt bij de bouw (nieuwe asserts); vitest-totaal stijgt. Exacte
  getallen komen uit de BOUW, niet hier hardcoden. Huidige vloeren staan in de HANDOFF-STAND
  (vitest 456 · engine-selftest 1024).

## Touch-points (bevestigd tegen de levende repo @ `298226e`)

- `packages/engine/src/utils.ts` — `MESO_MOD` :17, `mesoFactor` :48, `mesoCycleWeek_` :60
  (HERGEBRUIKT, GEEN change).
- `packages/engine/src/archetypes.ts` — `expandArchetype_` def :45; ctx = `{ftp:47, lthr:48,
  doelMin:49}` ZONDER mesoWeek (→ mesoWeek toevoegen); `adj` identiteit :52-54; core steady `durMin`
  :104-114; core int `onMin`/`reps` :115-160 (rust `offMin` :151-159); `fixed = preMin + cd.durMin`
  :168; fill-endurance `fillMin = Math.round(doelMin − fixed)` :169, emit bij `fillMin ≥ 1` :172-183.
- `packages/engine/src/planner.ts` —
  - `renderVariant_` def :974; `_mesoWeek` param :977 (→ underscore eraf); `variant.blocks(adj)`
    :1013; `mainMin` int :1031 / steady :1062; endurance-fill `gap = mins − warm − cool − mainMin`
    :1075 (emit bij `gap ≥ 5` :1076).
  - `buildWorkout` def :1446; `mesoWeek` param :1450; `expandArchetype_`-ctx-build :1472-1476
    (`{ftp, lthr, doelMin}` → mesoWeek toevoegen); `renderVariant_`-call :1499 (geeft `mesoWeek` al
    positioneel door).
  - `assignWorkouts` def :475; `mesoWeek` :478; `taperCtx` :486; `days` :476; `isMesoRecovery =
    mesoWeek === 4` :498; `isRecovery = isMesoRecovery` :499 (→ `&& !nearTaper`).
  - `genericLongZ2` def :1554; `×mesoFactor(mesoWeek)` op de DUUR :1567 (GEEN change).
  - `genericPendelZ2` def :1971 (GEEN change).

---

*3d stap 2 recon. Geen bouw; `packages/engine` ongemoeid, `training` alleen gelezen @ `3e8090a`.*
