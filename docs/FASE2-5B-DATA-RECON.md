# FASE 2 · §5b DATA-recon — silhouet-profiel "Sweet Spot 2×15"

Read-only. Vraag: waarom toont het gepland-silhouet ÉÉN drempel-piek (rust/z2/drempel/z2/rust) i.p.v. TWEE
voor een sweet-spot-intervaltraining — fixture-artefact of engine-gedrag? Cadans HEAD `16cf462`; GAS-referentie
`C:\Users\daan\Projects\training` HEAD `3e8090a`. GEEN code gewijzigd; geen throwaway-script nodig (statisch
eenduidig).

## KERNCONCLUSIE

- **(a) Gebruikt de fixture de engine? NEE.** De gepland-dag (Do `2026-07-09`, "Sweet Spot 2×15") is een
  HANDMATIG `wo()`-object (`apps/web/src/pages/Preview.tsx:88-99`). De blokken `rust/z2/drempel/z2/rust`
  (`:94-98`) zijn met de hand geschreven — één samengevoegd 30-min drempel-blok. Geen `buildWorkout`/
  `toSession`-aanroep.
- **(b) Wat produceert de engine voor een 2×N? TWEE pieken.** Voor `type:"sweet_spot"` (geen archetypeId)
  loopt `buildWorkout` (`packages/engine/src/planner.ts:1413`) via de variant-pool → `renderVariant_`
  (`:946`), die per rep een werk- én een rust-blok pusht (`:1005-1020`): warmup / SS1 / rust / SS2 / [Z2-fill]
  / cooldown = **twee** drempel-pieken. De `sweet_spot`-pool (`packages/engine/src/workouts/ftp.ts:6-61`) =
  `ss_2x20` (reps 2), `ss_3x15` (reps 3), `ss_2x30` (reps 2) — allen `kind:"int"`. Er is GÉÉN "2×15"-variant;
  de fixturenaam is verzonnen. (De archetype-tak `expandArchetype_`, `archetypes.ts:141-160`, doet identiek
  per-rep.)
- **(c) Bestaat er een fijnere per-interval-expansie? JA — `session.blokken` zélf.** Dat veld is al per-rep
  (`planner.ts:1005-1020` / `archetypes.ts:141-160`) en is precies wat het silhouet consumeert (ZoneBar →
  `silhouetSegments`). `session.structuur` is GROVER: één rij per core-element ("Sweet Spot" · "2x 20 min" ·
  watt · "5 min rust @ 50%", `planner.ts:992-998`). Het silhouet leest dus al de fijne bron; met echte
  engine-data zou het twee pieken tonen.
- **(d) Wat toont het GAS-silhouet? TWEE pieken.** GAS bouwt `blokken` per-rep
  (`training/src/Algorithm.gs:2261-2264`, byte-identiek aan de port) → `segmentsFromBlokken_` mapt 1:1, geen
  merge (`training/src/WebApp.gs:52-62`) → `zoneBar` tekent één rect per segment (`training/src/Script.html:236-252`).
  De twee SS-blokken staan door de rust-vallei niet naast elkaar → blijven distinct.
- **(e) Diagnose: FIXTURE-ARTEFACT.** De engine is CORRECT en GAS-conform (twee pieken). De single-peak is
  puur de hand-geschreven fixture. Fix (render/fixture-only, NIET nu): de fixture de echte engine laten
  aanroepen (`buildWorkout` → `toSession`), óf de fixture-blokken corrigeren naar
  warmup/SS1/rust/SS2/uitrijden. GÉÉN engine-wijziging.

---

## STAP 1 — herkomst fixture-silhouet

`apps/web/src/pages/Preview.tsx:85-99`: de dag wordt gebouwd via `day("2026-07-09", 3, { … sessions:[ wo("Sweet
Spot 2×15", ["low","high"], 75, 78, [blokken], [structuur]) ] })`. Arg 5 (`:93-99`) = de blokken-array,
letterlijk `{minuten:15,zone:"rust"}, {minuten:15,zone:"z2"}, {minuten:30,zone:"drempel"}, {minuten:10,zone:"z2"},
{minuten:5,zone:"rust"}` → via `blokFromEngine` → hoogtePct 25/45/85/45/25 = één piek. De `wo()`-helper
(`Preview.tsx:18-34`) zet enkel een plain object samen; nergens een engine-call. De structuur-uitklap (`:101-110`)
is idem gestileerd (1 "Sweet Spot 2×15"-rij van 30:00).

## STAP 2 — engine-output voor een sweet-spot-interval

- Dispatch: `buildWorkout` (`planner.ts:1413`) → geen archetypeId → `getPool_("sweet_spot")` →
  `selectVariant_` → `renderVariant_` (`planner.ts:1460-1463`).
- `renderVariant_` int-tak (`planner.ts:986-1020`): per rep `blokken.push(werk)` + `blokken.push(rust)`
  (`:1005-1020`). Voor `ss_2x20` (reps 2, onMin 20 @90%, offMin 5 @50%): warmup(rust) / SS(drempel) /
  rust / SS(drempel) / [Z2-fill] / cooldown(rust) = **twee** drempel-pieken.
- Pool-bewijs `workouts/ftp.ts:6-61`: `ss_2x20`/`ss_3x15`/`ss_2x30`, alle `kind:"int"`, reps ≥ 2. Geen
  "2×15". Determinisme onder de engine-selftest (`selftest.test.ts`, assert-count 957) — geen script nodig.

## STAP 3 — databronnen + granulariteit

| bron | granulariteit | herkomst |
|---|---|---|
| `session.blokken` (silhouet) | **per-rep** (warmup/SS1/rust/SS2/fill/cooldown) | `planner.ts:1005-1020` · `archetypes.ts:141-160` |
| `session.structuur` (uitklap) | grover: 1 rij per core-element | `planner.ts:992-998` |

De per-interval-expansie die het silhouet zou moeten voeden = `session.blokken` zelf; die is al fijn genoeg en
wordt al geconsumeerd (`ZoneBar` → `silhouetSegments`, `apps/web/src/lib/schema.ts`).

## STAP 4 — GAS-referentie (HEAD `3e8090a`, read-only)

- Per-rep blokken: `Algorithm.gs:2261-2264` (`for rr<reps` → werk-blok + rust-blok) — identiek aan de port.
- Silhouet-databron: `segmenten: segmentsFromBlokken_(wo.blokken)` (`Algorithm.gs:2361`);
  `segmentsFromBlokken_` (`WebApp.gs:52-62`) pusht één segment per blok, GEEN merge.
- Render: `zoneBar(segmenten)` (`Script.html:236-252`) tekent één `<rect>` per segment. → sweet-spot 2×N =
  twee (of meer) drempel-pieken met rust-vallei. GAS toont dus de echte per-interval-vorm.
