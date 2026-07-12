# FASE B — Override + Picker + Adaptatie — RECON

Bron: bevroren GAS `daanhhk/training@3e8090a` (paden onder `src/`). Deze recon in
de chat gelezen via raw GitHub (BRONHIERARCHIE). Meetlat, geen vervanging.

## Scope
- **B3** WorkoutPicker-overlay (kies een andere training vanaf de dagkaart).
- **B2** Trainingen-tab (browse de bibliotheek → detail-slider → inplannen).
- **B4** Coach-adaptatie: (1) make-up na afgeweken/gemist, (2) "Verlicht vandaag".

## KERN-CONCLUSIE
De engine-KERN is al geport + geëxporteerd in `packages/engine/src/planner.ts` +
`coach.ts`; wat ontbreekt is de web-app-ORKESTRATIE (client, apps/web) + de UI.
De override-write-backend is de GEDEELDE fundering: B3 (handmatig), B4-make-up en
B4-Verlicht schrijven alle drie via `saveDayOverride`. `day_state.override_json`
bestaat al → GEEN migratie. `packages/engine` hoeft NIET te wijzigen (mogelijk één
klein `readinessAdjust_`-haakje, te bepalen bij de bouw).

## CAVEAT (belangrijk)
Deze recon stelde vast dat de engine-fns AANWEZIG + GEËXPORTEERD zijn en welke rol
ze spelen. Hun 1-op-1-CORRECTHEID tegen de GAS-bron is NIET geverifieerd. Vóór de
bouw: gericht spot-checken van de fns die de bouw aanroept
(`getTrainingLibrary_`, `buildOverrideWorkout_`, `buildFreeRideWorkout_`,
`renderVariant_`, `coachAdaptatie_`, `coachFeedback_`.adapt/state/planned,
`demoteType_`) tegen `src/Algorithm.gs`/`src/WebApp.gs`. Dit is een feature-scoped
subset van de EIND-AUDIT (die als geheel het cutover-sluitstuk blijft).

## B3/B2 — machinerie
- Override-DTO (`override_<date>`): `{type:'library', workoutType, variantId?, durMin}`
  of `{type:'free', ritType:vrij|groep, intensiteit:rustig|tempo|stevig, durMin}`.
  Grenzen 20-360. GAS write/clear = `saveDayOverride`/`clearDayOverride`
  (`WebApp.gs:1663`), read = `dashOverridesByDate_` (`:210`). GEEN generateProposal.
- Catalogus: `getTrainingLibrary_(settings)` (engine, planner.ts:1196) = 6 categorieën
  (herstel/duur/tempo/sweetspot/ftp/vo2max) × ≤5 varianten, uit de bestaande builders.
- Engine-seam (GAS `Algorithm.gs:171-178`): de assign-loop bouwt bij een override
  (niet-gedaan) `buildOverrideWorkout_` i.p.v. het coach-voorstel → de override telt
  mee in de week-load. In Cadans zit de orkestratie (`buildWeekProposal`) CLIENT-SIDE
  (proposal.ts:151) en leest overrides NOG NIET ("geen day-overrides", comment).
  Wiring-punt = de per-dag-bouw op proposal.ts ~324-374.
- Render (GAS `Script.html:1078`, `overrideKaart_`): bij `ov && plannable` vervangt
  "Handmatig gekozen" + workout (of vrije-rit-kaart) + "Terug naar voorstel" de
  voorstel-kaart. Schrijf-UI's: B3 picker-overlay (`Script.html:2065-2161`), B2
  Trainingen-tab (`:1880-2032`, inplannen op de eerstvolgende plannbare dag).

## B4 — machinerie
- Make-up: post-pass (`WebApp.gs:1165-1186`) koppelt een dag met `coach.adapt` +
  state `different`/`missed` aan de eerstvolgende plannbare toekomstige dag +
  `coachAdaptatie_` (engine, coach.ts:548 — ingekort ×0.7, 15-min-stap, 45≤dur≤orig).
  Idempotent via de `from`-tag + `claimedTarget`.
- Verlicht: today-overlay (`WebApp.gs:1196-1225`, `rdyCoach`) — bij een geplande harde
  sessie + lage readiness-band → demote naar lichter type (`readinessAdjust_` +
  `demoteType_`, engine planner.ts:786) → payload met `src:'readiness'`.
- Beide → een `adaptatie`-object op de dag-coach → UI-knop `coachAdaptBtn_`
  (`Script.html`) → `planAdaptatie_` → `saveDayOverride` (met `from`/`src`).
- Al geport (engine): `coachAdaptatie_`, `coachFeedback_`(state/adapt/planned),
  `demoteType_`, readiness-`demote` + `deriveReadiness`, `getTrainingLibrary_`.
- Ontbreekt (client): de post-pass (target-zoek + idempotentie) + de today-Verlicht-
  overlay (evt. `readinessAdjust_` porten). Ontbreekt (UI): de "Plan deze aanpassing"/
  "Verlicht"-knoppen + "✓ ingepland"-staat + **frame-10** (rijke gemist-kaart).

## Ontwerp-keuzes (Daan akkoord)
- D1 catalogus: CLIENT-DIRECT `getTrainingLibrary_(settings)` (geen route; consistent
  met de client-side-engine-lijn).
- D2 override in WeekLoad: VOLLEDIGE parity — `buildWeekProposal` leest overrides +
  swapt de dag-workout via `buildOverrideWorkout_` → WeekLoad weerspiegelt de override.

## Aanbevolen fasering (bouw — LATER, na de A2/A4-check + FASE-A-deploy)
- **Laag-1 (gedeeld B3/B4):** override-backend — `writeOverride`/`readOverrides`/clear
  op `day_state.override_json` + `PUT/GET /api/overrides` (mirror A2) + round-trip-tests;
  + `buildWeekProposal`-wiring (overrides → `buildOverrideWorkout_`, D2).
- **Laag-2 (B4-orkestratie, client):** de adaptatie-post-pass (make-up-target-koppeling
  + idempotentie via `coachAdaptatie_`) + de today-Verlicht-overlay.
- **Laag-3 (UI):** de "Plan deze aanpassing"/"Verlicht"-knoppen + "✓ ingepland" +
  **frame-10** (rijke gemist-kaart). B3-picker-overlay + B2-Trainingen-tab volgen
  (delen dezelfde catalogus + write).
