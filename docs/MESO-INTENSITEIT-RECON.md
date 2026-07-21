# RECON — meso-/fase-modulatie op %FTP versus duur

**Status:** recon. Geen code gewijzigd; aan het eind is `git diff --stat packages/engine` leeg.
GAS-bron van schijf gelezen (`C:\Users\daan\Projects\training` @ `3e8090a`), nooit via fetch.
Alle mechaniek hieronder staat in PERCENTAGES — geen persoonlijke FTP of watts (publieke repo).

## Kern-uitkomst vooraf

De motor moduleert intensiteit op TWEE manieren die het KARAKTER van een blok verschuiven:

1. `mesoFactor(mesoWeek)` — een week-op-week %FTP-multiplier (`MESO_MOD` = wk1 1.0 · wk2 1.08 ·
   wk3 1.15 · wk4 0.6).
2. `VARIANT_FASE_OFFSET[macroFase]` — een additieve %FTP-offset (Base −2 · Build 0 · Peak +2 ·
   Taper/Recovery/Test 0).

Beide grijpen aan op het %FTP PER BLOK. Dat tilt blokken uit de zone die hun nominale type
voorschrijft: in de piek-mesoweek (wk3, f = 1.15) schuift een endurance-blok (nominaal 70%) naar
`round(70·1.15) + off` = **79% in Base** (81% in Build, 83% in Peak) — boven de Z2-grens van 75%
(`pctZoneBucket_`: z2 ≤ 75%, tempo 76–90%). Een sweet-spot-blok (nominaal 88–93%) wordt in wk3
`round(88·1.15)` = **101%** tot `round(93·1.15)` = **107%** → van sweet-spot (high) naar drempel
(91–105%) en zelfs anaeroob (> 105%). Dat is de te verwijderen hendel.

De DUUR-schaling (langere rit in een zwaardere week) en de SELECTIE-schaling (welke type/mix bij
welke fase) zijn dosis- respectievelijk mix-gedreven en blijven staan.

### Ontwarring van de vermeende dubbelrol van `VARIANT_FASE_OFFSET`

Bevinding: er is GEEN dubbelrol. `VARIANT_FASE_OFFSET` wordt op precies twee plekken gelezen —
`renderVariant_` (planner.ts:994) en de `expandArchetype_`-ctx (planner.ts:1485) — en op BEIDE als
additieve %FTP-term (PCT-HENDEL). Het raakt `selectVariant_` NIET: die roteert de variant-VORM op
`(weekIndex + slot) % pool.length` (planner.ts:969), volstrekt los van fase of meso. De echte
fase-SELECTIE-hendel is `GOAL_FASE_MOD_` (archetypes.ts:1133), die via `goalEffWeights_`
(archetypes.ts:1229) de intent-GEWICHTEN per fase verschuift (Base → meer sweetspot/minder vo2;
Peak → meer vo2/minder sweetspot) — dat bepaalt WELK type wordt gekozen, niet het %FTP van de
blokken. Die blijft. Conclusie: `VARIANT_FASE_OFFSET` is zuiver een PCT-HENDEL en verdwijnt in zijn
geheel; de macro-fase-progressie leeft in `GOAL_FASE_MOD_` en blijft ongemoeid.

---

## Call-site-inventaris

Classificatie: **PCT-HENDEL** (verandert karakter/zone — te verwijderen als intensiteits-hendel) ·
**DUUR-HENDEL** (dosis, correct — blijft) · **SELECTIE-HENDEL** (kiest type/variant/mix, correct —
blijft).

### PCT-HENDELS — te verwijderen (elk blok krijgt zijn nominale pct terug)

**1. `renderVariant_` — planner.ts:993-995, toegepast :1021.**
Nu: `const f = mesoFactor(mesoWeek)` (:993), `const off = VARIANT_FASE_OFFSET[macroFase] || 0`
(:994), `const adj = (p) => Math.round(p * f) + off` (:995). `adj` wordt doorgegeven aan
`variant.blocks(adj)` (:1021), zodat ELK blok-pct van elke variant-pool (`genericPools_` :1343 —
long_z2/tempo — plus `ftpPools_`/`vo2Pools_`/`conditiePools_`/`climbPools_` via `getPool_`) door
`round(p·f)+off` gaat. Dit is de hoofd-PCT-HENDEL voor de variant-engine.
Classificatie: **PCT-HENDEL**.
Fix: `adj` wordt de identiteit — `const adj = (p) => p`. `f` en `off` verdwijnen uit
`renderVariant_`. De `mins`-gedreven `scaleBlocksToFit_` (duur-inpassing) blijft ongemoeid.

**2. `expandArchetype_` — archetypes.ts:49-54, toegepast :90-91/:105/:124-133/:166-167/:173.**
Nu: `const mf = ctx.mesoFactor ?? 1.0` (:49), `const fo = ctx.faseOffset || 0` (:50),
`function adj(p){ return Math.round(p*mf)+fo }` (:52-54). `adj` raakt warmup-pct (:90-91), core
steady-pct (:105), core interval on/off-pct (:124-133), fill-pct (:173) en cooldown-pct (:166-167).
De ctx wordt gezet in `buildWorkout` (:1484-1485: `mesoFactor: mesoFactor(mesoWeek)`,
`faseOffset: VARIANT_FASE_OFFSET[macroFase] || 0`). Dit is de PCT-HENDEL voor het archetype-pad
(de kwaliteitsdagen die via `goalWorkout_`/`archetypeId` lopen).
Classificatie: **PCT-HENDEL**.
Fix: `adj(p) = p` (mf/fo vervallen). De `doelMin`-gedreven fill/duur blijft.

**3. `genericVo2HillRepeats` — planner.ts:1844, toegepast :1862.**
Nu: `const f = mesoFactor(mesoWeek)` (:1844); werk-blok `wattsRange(ftp, round(112·f), round(118·f))`
(:1862). Classificatie: **PCT-HENDEL** (legacy-pad — nog callable, niet meer geselecteerd; zie
buildWorkout :1512). Fix: nominale pct 112–118, `f` weg.

**4. `genericAnaerobicCapacity` — planner.ts:1881, toegepast :1899.**
Nu: `f = mesoFactor` (:1881); werk-blok `round(120·f)..round(130·f)` (:1899).
Classificatie: **PCT-HENDEL** (legacy). Fix: nominale pct 120–130.

**5. `genericThresholdLong` — planner.ts:1918, toegepast :1936.**
Nu: `f = mesoFactor` (:1918); werk-blok `round(95·f)..round(102·f)` (:1936).
Classificatie: **PCT-HENDEL** (legacy). Fix: nominale pct 95–102.

**6. `genericSweetSpotLong` — planner.ts:1955, toegepast :1973.**
Nu: `f = mesoFactor` (:1955); werk-blok `round(88·f)..round(93·f)` (:1973).
Classificatie: **PCT-HENDEL** (legacy). Fix: nominale pct 88–93.

**7. `genericPendelIntervals` — planner.ts:2038, toegepast :2047/:2055/:2063/:2071/:2079.**
Nu: `f = mesoFactor` (:2038); het doel-specifieke werk-blok krijgt `round(pct·f)`: trip sweet-spot
`round(86·f)..round(92·f)` (:2047), FTP `round(88·f)..round(94·f)` (:2055), VO2max
`round(108·f)..round(115·f)` (:2063), Conditie `round(76·f)..round(85·f)` (:2071), Beklimmingen
`round(85·f)..round(92·f)` (:2079). De warming-up (60–72%) en cooldown (45–55%) zijn hard.
Classificatie: **PCT-HENDEL** (werk-blok). Fix: nominale pct per tak. De duur `heen = floor(mins/2)`
(:2037) is DUUR en blijft.

**8. `genericCombo` — planner.ts:2141, toegepast :2178/:2218/:2254/:2283/:2326/:2333.**
Nu: `f = mesoFactor` (:2141); efforts/tempo/vo2/sweet-spot-werkblokken via `round(pct·f)`:
combo_long_with_efforts :2178 (`85·f..92·f`), combo_z2_tempo :2218 (`76·f..85·f`), combo_z2_vo2 :2254
(`108·f..115·f`), combo_ss_sprints :2283 (`88·f..93·f`), combo_all_three :2326 (`88·f..92·f`) +
:2333 (`110·f..115·f`). De Z2-base/warmup/uitrij-blokken zijn hard. Classificatie: **PCT-HENDEL**
(werk-blokken). Fix: nominale pct per blok. De `requested`-duur (:2145, `max(60, mins||120)`) is
duur en blijft.

**9. `workoutForFtp` — ftp.ts:201, toegepast :238/:282.**
Nu: `f = mesoFactor` (:201); sweet_spot `round(pctLow·f)..round(pctHigh·f)` (:238), threshold
`round((pct−2)·f)..round((pct+2)·f)` (:282). Classificatie: **PCT-HENDEL**. Fix: `f` weg → nominale
pct. LET OP — de per-fase-tabellen die `pctLow/pctHigh/reps/len` zetten (Base/Build/Peak,
:205-220 / :252-264) zijn een APARTE, karakter-behoudende dosis-keuze (sweet-spot blijft 86–94%,
binnen high) en blijven; alleen de `·f`-multiplier verdwijnt.

**10. `workoutForVo2max` — vo2max.ts:150, toegepast :170/:200/:229.**
Nu: `f = mesoFactor` (:150); werk-blokken `round(106·f)..round(110·f)` (:170),
`round(108·f)..round(112·f)` (:200), `round(110·f)..round(115·f)` (:229). Classificatie:
**PCT-HENDEL**. Fix: nominale pct.

**11. `workoutForConditie` — conditie.ts:94, toegepast :161/:198.**
Nu: `f = mesoFactor` (:94); werk-blokken `round(pctLow·f)..round(pctHigh·f)` (:161),
`round(78·f)..round(85·f)` (:198). Classificatie: **PCT-HENDEL**. Fix: nominale pct.
(De duur-hendel op :101 staat los — zie DUUR-HENDELS.)

**12. `workoutForBeklimmingen` — beklimmingen.ts:88, toegepast :122/:177/:214/:247.**
Nu: `f = mesoFactor` (:88); werk-blokken `round(pctLow·f)..round(pctHigh·f)` (:122/:177/:247),
`round(88·f)..round(92·f)` (:214). Classificatie: **PCT-HENDEL**. Fix: nominale pct.

### DUUR-HENDELS — dosis, correct, blijven

**D1. `genericLongZ2` — planner.ts:1575-1578.**
`requested = Math.max(60, Math.round((mins || 90) · mesoFactor(mesoWeek)))`. `mesoFactor` schaalt
alleen de DUUR van de lange rit (mag krimpen in de recovery-week); de pct in de structuur zijn hard
(65–75% Z2, klim-sim 88–95%). Correct — de op te bouwen grootheid is tijd-in-zone. Classificatie:
**DUUR-HENDEL**. Blijft.

**D2. `workoutForConditie` long_z2 — conditie.ts:101.**
`target = Math.round(target · mesoFactor(mesoWeek))` waar `target` de sessieduur is (Base 105 /
Build 135 / Peak 165 min). Pure duur-schaling; de Z2-pct (68–75%) is hard. Classificatie:
**DUUR-HENDEL**. Blijft.

### SELECTIE-HENDELS — kiezen type/variant/mix, correct, blijven

**S1. `selectVariant_` — planner.ts:965-971.** Roteert de variant-VORM op `(weekIndex + slot)`,
los van meso/fase. Bepaalt WELKE variant, niet het %FTP. Blijft.

**S2. `GOAL_FASE_MOD_` via `goalEffWeights_` — archetypes.ts:1133 / :1229-1241.** Verschuift de
intent-GEWICHTEN (mix: aandeel drempel/sweetspot/vo2) per macro-fase. Dit IS de legitieme
fase-progressie op MACRO-niveau (base→build→peak). Blijft ongemoeid. (Ook `volumeModulatie`
:1243 — mix-verschuiving op volume, blijft.)

### GEEN meso/fase-pct-hendel (ter volledigheid)

`genericPendelZ2` (planner.ts:1985) — harde `wattsRange(ftp, 60, 72)` (:2012), geen `f` op pct;
alleen `mins` (duur) en een naam-/copy-tak op `isRecoveryWeek`. Bevestigd: GEEN PCT-HENDEL.

---

## Gedrag-delta na de fix (percentages)

Wat NU een zone omhoog schuift en na de fix zijn nominale zone houdt:

- **Endurance (nominaal 70%, z2 ≤ 75%).** wk3 (f = 1.15): `round(70·1.15) + off` = 79% (Base) /
  81% (Build) / 83% (Peak) → **tempo** (76–90%). Al bij wk2 (f = 1.08) Build: `round(70·1.08)` =
  76% → tempo. Fase-offset alleen (f = 1): Peak `+2` tilt een 74%-blok naar 76% → tempo.
- **Sweet-spot (nominaal 88–93%, high).** wk3: `round(88·1.15)` = 101% → **drempel** (91–105%);
  `round(93·1.15)` = 107% → **anaeroob** (> 105%). Sweet-spot wordt drempel/over-drempel.
- **Drempel (nominaal 95–102%).** wk3: `round(95·1.15)` = 109% → **anaeroob**. Drempel wordt supra.
- **Recovery-week wk4 (f = 0.6) — de OMGEKEERDE schending.** `round(70·0.6)` = 42% → een
  endurance-blok valt naar **rust** (< 56%); een drempelblok `round(98·0.6)` = 59% → **rust/z2**.
  De recovery-week verlaagt nu dus óók het KARAKTER (niet enkel de dosis) — precies wat een
  recovery-week NIET hoort te doen.

Na de fix: elk blok houdt zijn nominale pct in élke mesoweek en fase; de zwaarte van de week komt
uit meer/langere blokken (dosis) en uit de mix-verschuiving, niet uit een opgerekt %FTP.

---

## Open bouw-vraag (koppelt aan fase 3d)

Fase-gedreven intensiteit hoort via TYPE-SELECTIE en MIX op macro-niveau (base→build→peak), niet via
een pct-multiplier per blok. Die mix-progressie bestaat al en blijft: `GOAL_FASE_MOD_` /
`goalEffWeights_` (S2). Wat na het verwijderen van de pct-hendels de week-op-week zwaarte moet
dragen, is de DOSIS — de tijd-in-zone en daarmee de weekbelasting (TSS). Die dosis-/budget-hendel
leeft straks in **fase 3d** (effectief weekdoel + weekTSS-budget): de meso-ramp wordt een
duur-/volume-ramp op een invariant blok-karakter, en de recovery-week verlaagt het budget in plaats
van de intensiteit.

De **mesoFactor-teller-bug** (off-by-one + vlak-na-wk4-gedrag, R2-V2 — `MESO_MOD` heeft geen entry
> 4, dus `mesoFactor` valt terug op 1.0 zodra de teller doorloopt, en de teller-afleiding zelf is
niet zuiver) is bewust NIET in scope van deze ronde en wordt **geparkeerd naar fase 3d**, waar de
weekteller/-fasering opnieuw wordt bekeken.

---

*Recon, geen bouw. `packages/engine` ongemoeid; `training` alleen gelezen @ `3e8090a`.*
