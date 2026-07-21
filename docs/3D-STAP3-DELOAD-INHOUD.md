# 3d STAP 3 — deload-INHOUD (reduced-load-week met één prikkel)

**Status:** bouw-doc (geautoriseerde engine-wijziging). GAS-bron alleen gelezen @ `3e8090a`,
nooit geschreven.

## Einddoel

De meso-deload (`isRecovery = isMesoRecovery && !nearTaper`, blokweek 4) is nu een kale easy-week
die ÁLLE kwaliteit stript (`allocActive=false` + de isRecovery-tak plaatst enkel recovery / long_z2 /
pendel_z2). Maak er een **reduced-load-week MÉT één lichte kwaliteitsprikkel** van: volume omlaag,
tijd-in-zone omlaag, **%FTP nominaal** (karakter-invariant, M74-M78). De renner blijft scherp i.p.v.
vlak.

`nearTaper`-onderdrukte weken (STAP 2 taper-guard), `isEventRecovery` (herstelweek na A-race) en
`isTestWeek` blijven ONGEMOEID — het nieuwe gedrag vuurt uitsluitend bij `isRecovery`.

## Bewuste GAS-fork

GAS stript in een recovery-week óók alle kwaliteit — identiek aan de huidige Cadans-port:
`Algorithm.gs:1003` `allocActive = !isEventRecovery && !isRecovery && !isTestWeek && (Base|Build|Peak)`
en de isRecovery-tak `Algorithm.gs:1060-1065` (pendel→pendel_z2 / weekend→long_z2 / else→recovery).
STAP 3 is dus GEEN parity-herstel maar een **bewuste Cadans-fork**, gemotiveerd door M76 ("de
recovery-week verlaagt de DOSIS, niet het karakter") — een structuur-behoudende deload i.p.v. een
volle easy-week.

## De twee ingrepen

### INGREEP 1 — dosis-spiegel voor f < 1 (`archetypes.ts` `expandArchetype_`, `planner.ts` `renderVariant_`)

De STAP-2-ramp is add-only: `if (f > 1 …)` rekt de core-werktijd (`workScale > 1`) en de
endurance-fill/overhead-trim absorberen. De spiegel: bij `f < 1` KRIMPT de core-werktijd
(`workScale = f`); de vrijgekomen tijd wordt door de endurance-fill geabsorbeerd (het bestaande
`fillMin = doelMin − fixed` / `gap = mins − warm − cool − mainMin` groeit vanzelf mee, want het werk
is korter). Warmup/cooldown blijven nominaal (er is ruimte zat — we hoeven niet te trimmen). Totaal
blijft ≤ `doelMin`; %FTP en structuur nominaal. Letterlijke spiegel van STAP 2 (daar
werk-omhoog/fill-omlaag, hier werk-omlaag/fill-omhoog).

**Invarianten:** `f === 1` raakt geen van beide takken → byte-identiek. `f > 1` exact zoals STAP 2.
Geen bovengrens op de fill behalve `doelMin` (geverifieerd: `expandArchetype_` `fillMin =
Math.round(doelMin − fixed)`, geen upper-clamp; `renderVariant_` `gap`, geen upper-clamp).

### INGREEP 2 — allocator laat één slot toe in de deload (`planner.ts`)

Drie chirurgische wijzigingen:

- **(a) `allocActive`** (`:529-533`): `!isRecovery` verdwijnt uit de conditie → de meso-deload krijgt
  `allocActive=true`. `!isEventRecovery`, `!isTestWeek` en de fase-check (Base|Build|Peak) BLIJVEN.
- **(b) `allocateQualityWeek_`** (`:173-192`): nieuwe optionele param `isDeload` (13e; default false →
  bestaande callers byte-identiek). In de deload: quotum → **1** (i.p.v.
  `profiel.kwaliteitPerWeek[macroFase]`), de langerit-stap (1) en debt-pre-claim (2) worden
  OVERGESLAGEN, en de quality-eligibiliteit wordt beperkt tot WEEKDAGEN (`type === "vrij"`), zodat de
  ene prikkel op een weekdag landt en het weekend niet claimt.
- **(c) isRecovery-tak** (`:625`): de gekozen quality-weekdag (`allocActive && quotaPlan[dagIdx].role
  === "quality"`) valt DOOR naar de bestaande quality-plaatsing (`:641`); alle andere deload-dagen
  blijven recovery / long_z2 / pendel_z2 via de isRecovery-tak.

**Weekend:** blijft `long_z2` via de isRecovery-tak; de long_z2-cap (`planner.ts` `genericLongZ2` =
`max(60, min(mins, round(mins × mesoFactor)))`) reduceert 'm symmetrisch ×0.60 in de deload.
**Prikkel-type:** fase-passend via `goalWorkout_` (de normale keuze); de dosis wordt door INGREEP 1
(mesoFactor 0.60) verlaagd op build-tijd.

## Tests (samenvatting)

Behouden: `testKarakterInvariantie` + `testDosisRamp3d` (f=1 byte-identiek, f>1 ongemoeid). Nieuw
`testDeloadInhoud3d`: (1) %FTP nominaal onder f<1 terwijl tijd-in-zone daalt; (2) een deload-week heeft
PRECIES 1 quality-slot op een weekdag; (3) de prikkel = tijd-in-zone ×0.60; (4) weekend = long_z2 ×0.60;
(5) overige weekdagen = recovery; (6) nearTaper / isEventRecovery / test-week ongemoeid.

---

*3d stap 3 bouw-doc. `training` alleen gelezen @ `3e8090a`.*
