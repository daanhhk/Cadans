# RECON — engine `assignWorkouts` dagtype-branches (collapse-veiligheid)

Doel: bepalen of niet-pendel-dagen veilig naar ÉÉN dagtype-waarde platgeslagen kunnen worden zonder
"de beste training" te verliezen. Read-only op `packages/engine` (NIET gewijzigd). Bouwt voort op de
GAS-recons.

## assignWorkouts
- Bestand/regels: `packages/engine/src/planner.ts:475-745`. Dagtype-veld = **`d.type`**. Vier waarden:
  **`pendel` / `vrij` / `weekend` / `recovery`**.
- **Twee lagen.** (1) De week-allocator `allocateQualityWeek_` (`planner.ts:~180-443`, aangeroepen
  `:539`) draait ÉÉN keer vóór de per-dag-loop en is actief in **Base/Build/Peak** (`allocActive`,
  `:513-517`). Hij plaatst quality/longride/endurance globaal en **overruled** de per-dag-takken
  (`:615-631`). (2) De per-dag-takken (`:632-688`) zijn de **fallback** — enkel geraakt in
  Recovery/Test/taper-weken of voor niet-eligible dagen.

## Per-branch (per-dag-fallback + allocator-gedrag)
- **pendel** (`:632-637`): quality → `pendel_<doelKey>_intervals` (of `pendel_trip_intervals` bij trip
  in Build/Peak); endurance/recovery/demote → `pendel_z2`. **Duur = `settings.pendelDuurMin` (vast,
  default 80), NIET de beschikbare minuten** (`:410`, apps/web `proposal.ts:299`). Multi-sessie
  (`pendelAantal`). → hangt NIET van de minuten-invoer af.
- **weekend** (`:638-660`): debt-aware → `combo_long_with_efforts` bij high/anaerobic-tekort, anders
  `long_z2` (of combo als `!dekking.high` buiten Base). Duur = `d.minuten`. → minuten-afhankelijk.
- **vrij** (`:661-681`): debt-preferred type, anders `keyIntensity(doel, macroFase, dekking, klimType,
  isTripEvent, { beschikbareTijd: d.minuten, … })` = de SLEUTELsessie. → sterk minuten-afhankelijk
  (`beschikbareTijd`).
- **recovery** (`:682-684`): altijd `type = "recovery"`. Duur = `d.minuten`. **In de allocator is een
  recovery-dag NIET eligible** (`eligible_` `:203-212` laat alleen vrij/weekend/pendel toe) → krijgt
  nooit quality/longride.

**Pendel-commute-mechanisme (de blijvende branch):** GEEN commute-TSS-aftrek en GEEN vaste commute-load.
De pendel-dag IS zijn eigen workout-familie (`pendel_*`), met **vaste duur `pendelDuurMin`** en
multi-sessie `pendelAantal`. TSS volgt uit die workout (zone-gewogen), niet uit een aftrek. In de
allocator: pendel is eligible + **voorkeur** voor quality (`pickBestSpread_` `:303`), maar NOOIT de lange
rit (`:344 if (d.type === "pendel") return`).

## Difference-matrix (gelijke inputs: zelfde minuten/state/datum)
- **Lange-rit-plaatsing = MINUTEN-gedreven, niet label-gedreven:** de langste eligible niet-pendel dag
  krijgt de lange rit (`:340-351`, tie → hoogste dagIdx). vrij vs weekend maakt hier niets uit; de
  minuten beslissen (weekend-dagen zijn doorgaans langer → krijgen 'm vanzelf).
- **vrij vs weekend — enige echte verschillen:**
  1. **Spreiding** (allocator): het weekend-label voedt `formsWeekendPair_` (`:280-286`), de
     `weekendBlok`-uitzondering in `gapOK_` (`:273-275`) en de weekend-tag op ankers (`:258`). → bepaalt
     WAAR quality-sessies landen rond het weekend (paar-vermijding; back-to-back-blok als
     `profiel.spreiding.weekendBlok`).
  2. **Recovery-week** (mesoWeek 4, `:601-606`): weekend → `long_z2`, vrij → `recovery`.
  Buiten die twee (in gewone Base/Build/Peak-weken) leveren gelijk-minuten vrij en weekend dezelfde
  workout-uitkomst — de allocator beslist globaal.
- **recovery vs vrij/weekend:** recovery is uitgesloten van quality/longride (`eligible_`) → altijd een
  recovery-workout. Dat is het grootste semantische verschil.

## Andere engine-consumenten van het dagtype-veld
**Geen — buiten `planner.ts`.** De literals `pendel/vrij/weekend/recovery` komen ook voor in
`readiness.ts`, `zones.ts`, `coach.ts` en `selftest.test.ts`, maar daar als **workout-TYPE-strings**
(`voorgesteldType`, bv. `t.indexOf("pendel")`, `type === "recovery"`) of label-maps — NIET als het
`d.type`-dagtype-veld. Geen load-target/TSS-budget/weekgeneratie elders vertakt op het dagtype.

## Lees-pad `planner_days.dagtype` → `d.type`
`apps/web/src/lib/proposal.ts:190` (`type: pd.dagtype` in de grid-map). De sessie-build leest `d.type`
opnieuw (`proposal.ts:294` pendel-multi-sessie, `:303-304` pendel→pendel_z2/weekend→long_z2), maar
**her-AFLEIDT het type nooit**. → de **save-tijd-afleiding (in de editor) is de ENIGE hefboom**; niets
downstream herberekent het.

## COLLAPSE-VERDICT
**Niet-pendel → ÉÉN waarde (alles `vrij`) is NIET volledig lossless.** Wat verloren gaat bij
weekend→vrij:
- de **weekend-spreiding** (paar-vermijding + `weekendBlok`-back-to-back) — quality-sessies kunnen
  rond het weekend minder optimaal landen;
- **recovery-week**: het weekend wordt `recovery` i.p.v. `long_z2` (klein).
De lange rit zelf gaat NIET verloren (minuten-gedreven). recovery→vrij is semantisch veilig in het
availability-model (zie onder).

## Aanbeveling
- **NIET platslaan naar één waarde. Leid `weekend` af voor Za/Zo** (spiegelt de GAS-mobiel-handler
  `Script.html:1035`: `pendel ? 'pendel' : (Za/Zo ? 'weekend' : 'vrij')`). Zo blijft de
  weekend-spreiding intact én is het GAS-getrouw. → 3 afgeleide waarden: `pendel` (uit Pendel?-toggle),
  `weekend` (Za=5/Zo=6), anders `vrij`. Kandidaat-default niet-pendel-weekdag = **`vrij`** (correct).
- **`recovery` NOOIT uit availability nodig** (verwacht: nee — bevestigd). De GAS-mobiel-flow zet 't
  nooit; de recovery-BEHOEFTE loopt via het wellness-`signal` (demote/recovery-pass, `planner.ts:723-744`),
  niet via het dagtype. `assignWorkouts`' recovery-branch blijft bestaan voor de spreadsheet-only-waarde,
  maar de mobiele/Cadans-invoer hoeft 'm niet te produceren.
