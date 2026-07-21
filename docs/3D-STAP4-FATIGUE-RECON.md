# RECON — 3d stap 4: fatigue-aware dosering (READ-ONLY)

**Status:** recon-doc, geen bouw. Het enige gewijzigde/aangemaakte bestand is dit doc. GAS-bron
alleen gelezen @ `3e8090a`, nooit geschreven. `packages/engine` ONgemoeid.

## Beslist (niet heropenen)

- BEIDE richtingen: fris → "doortrainen" op een kalender-deload; diep/aanhoudend oververmoeid →
  "vervroegde deload" in een opbouwweek.
- HEEL-WEEK-granulariteit via **mesoWeek-substitutie** in een tweede (wat-als) `buildWeekProposal`-run.
  Client-only; geen continue dosis-damper.

## Kern-uitkomst

Het hele mechanisme is **client-only**: `proposal.ts` (één optionele param) + `schema.ts` (loader-wiring
+ TSB-trend) + een nieuwe coachkaart + coachNarrative-copy + één worker-route + migratie 0006. De
engine (`planner.ts`, `archetypes.ts`) blijft **byte-identiek** — hij krijgt simpelweg een
gesubstitueerde `mesoWeek` door. Geen onvermijdelijke engine-touch gevonden → geen STOP.

---

## STAP 1 — TSB-bron (client)

**`currentCtl` in Niveau (niet bruikbaar als per-dag-TSB).** `apps/web/src/pages/Niveau.tsx:117`:
`currentCtl = ctlMap[lastMonth]` uit `ctlReeksMaandelijks_(rows)` (`:100`) — een MAAND-CTL-serie
afgeleid uit de ACTIVITEITEN (`parseActivityRows`), **CTL-only, geen ATL, geen TSB**. Ongeschikt voor
een dag-verse vermoeidheidstrend.

**De echte TSB-bron = de wellness-rijen.** `WellnessInput` (`packages/shared/src/wellness.ts:7-21`)
draagt per rij rechtstreeks `ctl` (`:17`), `atl` (`:18`), `vorm` (`:19` = form = TSB = CTL−ATL) en
`ramp` (`:20`). TSB is dus per dag beschikbaar als `vorm` (of `ctl − atl`); geen herberekening nodig.
Zone-labels: `apps/web/src/lib/tsb.ts:11` `tsbZone(tsb)` — `> 5` Fris · `−10..5` Productief · `< −10`
Oververmoeid (gauge-grenzen uit `design/src/conditie.jsx`; de engine kent GEEN 3-zone-TSB).

**Beschikbaar in de schema-view-laag.** `loadSchemaWeek` (`apps/web/src/lib/schema.ts:1207`) haalt
`wellness` al op (`getWellness()`, `:1242`; variabele `wellness`, `:1230`) en gebruikt 'm zowel voor de
proposal-input (`:1269`) als voor `deriveReadiness` (`:1253`). De Inhaal-wat-als leeft in exact deze
functie (`:1295-1322`). De TSB-TREND is dus client-side af te leiden uit `wellness[].vorm` op precies de
plek waar de wat-als-run al draait — geen extra fetch, geen prop-threading.

**Signaal UIT de load, NIET de readiness-band.** `deriveReadiness` (`apps/web/src/lib/readiness.ts:68`)
leest dezelfde wellness-rijen (+ check-in) maar levert de **holistische** ochtend-band
(HRV/slaap/check-in via `getReadinessScore_`; rij-mapping `:51-55`). De STAP-4-poort leest de LOAD
(CTL/ATL → `vorm`) als eigen N-daagse trend — een aparte afleiding, niet de band. Bevestigd: het
signaal komt uit de load, niet uit de readiness-band/ochtend-check-in.

---

## STAP 2 — mesoWeek-injectie (client, `proposal.ts`)

**Huidige berekening.** `apps/web/src/lib/proposal.ts:299`:
`const mesoWeek = mesoCycleWeek_(weekIndexFromStart_(settingsE));`.

**Ontwerp.** Voeg aan `BuildProposalInput` (`proposal.ts:97-121`, naast `planAdaptation?` op `:121`) een
optionele `mesoWeekOverride?: number` toe. Op `:299`:
`const mesoWeek = input.mesoWeekOverride != null ? input.mesoWeekOverride : mesoCycleWeek_(weekIndexFromStart_(settingsE));`.
Raakt UITSLUITEND `proposal.ts` (client). De engine leest de doorgegeven `mesoWeek` ongewijzigd.

**Beide takken.** De gesubstitueerde `mesoWeek` stroomt naar:
- **dosis** — `mesoFactor(mesoWeek)` in `renderVariant_` (`planner.ts:1045`), de long_z2-cap
  (`planner.ts:1667`) en de `expandArchetype_`-ctx (STAP 2, via `buildWorkout`);
- **deload-flag** — `isMesoRecovery = mesoWeek === 4` (`planner.ts:510`) → de STAP-3 reduced-load-tak.

**Variant-rotatie NIET geraakt.** `selectVariant_` (`planner.ts:1594`) roteert op
`weekIndexFromStart_(settings)` — de MONOTONE index, niet `mesoWeek`. Substitueren wisselt dus geen
archetypes/karakter; alleen dosis + deload-flag bewegen.

**Substitutie-semantiek** (redenering; geen commit-check gedaan, puur uit de code):
- `4 → 1`: `mesoFactor(1) = 1.00` (nominale dosis), `isMesoRecovery = false` → **normale volle week**,
  %FTP nominaal.
- `{1,2,3} → 4`: `mesoFactor(4) = 0.60` (dosis omlaag) + `isMesoRecovery = true` → de **STAP-3
  reduced-load-deload** (één lichte prikkel op een weekdag, weekend `long_z2` ×0.60, rest recovery) —
  géén kale easy-week, want STAP 3 draait al.

---

## STAP 3 — trigger-poort (wat-als, per week, ALTIJD voorstel)

- **UP:** kalender-`mesoWeek === 4` ÉN TSB-trend duidelijk fris → bied `4 → 1` aan.
- **DOWN:** kalender-`mesoWeek ∈ {1,2,3}` ÉN TSB-trend diep/aanhoudend oververmoeid → bied `→ 4` aan.
- **Onderdrukkingen:** geen voorstel als `nearTaper` de deload al onderdrukt
  (`planner.ts:514-521`, `isRecovery = isMesoRecovery && !nearTaper` op `:523`) — client-side af te
  leiden uit het aanstaande event (`proposalWeek.wekenTotEvent`/taper-venster); en niet in
  `macroFase === "Test"` of `"Recovery"` (event-recovery).

**Robuustheid (kern van de zorg) — VOORSTEL, Daan stelt de getallen vast.**
- **Meting = TSB-TREND, geen single-day.** Voorstel: het **7-daags gemiddelde van `vorm`** over de
  laatste 7 wellness-rijen (glad, dempt één slechte/goede nacht), ÉN een band-persistentie-eis
  ("de trend-band gehouden op ≥ K van de laatste M dagen", bv. K=5/M=7). Motivatie: een enkele
  uitschieter mag nooit een heel-week-shift triggeren; de trend + persistentie borgt "aanhoudend".
- **Actie-drempels MET buffer, ruimer dan de `tsb.ts`-banden.**
  - UP: `TSB-trend > +8` (voorstel), duidelijk voorbij de `+5`-Fris-grens → alleen bij écht getaperd.
  - DOWN: `TSB-trend < −20` (voorstel), veel strikter dan de `−10`-Oververmoeid-grens, want in een
    opbouwweek is negatieve TSB NORMAAL/PRODUCTIEF; alleen een DIEPE, aanhoudende put rechtvaardigt een
    vervroegde deload.
- **MIN-DATA-poort:** geen voorstel tot de CTL/ATL rijp zijn — voorstel: ≥ 21 wellness-rijen met
  niet-null `vorm` in de laatste ~42 dagen (CTL-tijdconstante). Onvoldoende data → geen poort.
- **Alle getallen zijn VOORSTEL** dat Daan bij de review vaststelt.

**Frequentie van nature begrensd:** heel-week-scope + per-week-lock (STAP 4) → **max 1×/week**, alleen
op mismatch-weken (kalender-fase ≠ vermoeidheid).

---

## STAP 4 — per-week-lock + persistentie (spiegelt de Inhaal-opt-in)

**Te spiegelen keten (inhaal):** `sync_state.debtOptInWeek` (`workers/api/src/db/schema.ts:238`) +
`getDebtOptIn`/`putDebtOptIn` (`apps/web/src/lib/api.ts:169/175`) + de route `GET/PUT /api/debt-optin`
(`workers/api/src/routes/api.ts:502/508`, met `readDebtOptIn`/`writeDebtOptIn` in de repo) +
loader-wiring `optedIn = debtOptInWeek === monday` (`schema.ts:1259`).

**Migratie 0006 (forward-only Drizzle; `0005` is de laatste — NIET bouwen, alleen specificeren).**
Pattern = `0004_lush_carmella_unuscione.sql` (`ALTER TABLE sync_state ADD debt_opt_in_week text`). Voeg
op `sync_state` twee nullable kolommen toe:
- `fatigue_shift_week text` — de goedgekeurde MAANDAG (yyyy-MM-dd), of null;
- `fatigue_shift_dir text` — de RICHTING (`'up'` | `'down'`), of null.
(Twee kolommen i.p.v. één samengestelde string houdt de validatie simpel en spiegelt de bestaande
`text`-nullable-conventie.) Drizzle-schema `sync_state` krijgt spiegelend `fatigueShiftWeek` +
`fatigueShiftDir`.

**Endpoint (mirror `/api/debt-optin`).** `GET /api/fatigue-shift` → `{ monday: string|null, dir:
'up'|'down'|null }`. `PUT /api/fatigue-shift` body `{ monday, dir }`: `monday` null of ISO
(`isIsoDate`), `dir` null of `'up'|'down'`; zet of wist beide samen. `CURRENT_USER_ID`.

**Loader-wiring (`loadSchemaWeek`).** `fatigueShift = await getFatigueShift()`;
`fatigueOptIn = fatigueShift.monday === monday` (vervalt vanzelf de maandag erna — M68). Bij opt-in:
de ACTIEVE `buildWeekProposal` krijgt `mesoWeekOverride = fatigueShift.dir === 'up' ? 1 : 4` (de
verschoven week IS het plan). De wat-als-run (voor de kaart) draait met dezelfde override om te tonen
wat verandert. Omkeerbaar; per KALENDERWEEK. Exact het `optedIn`/`planAdaptation`-patroon (`:1259-1274`).

---

## STAP 5 — coachkaart (spiegelt VerlichtCard / VerlengCard / InhaalCard)

Nieuwe **`FatigueCard.tsx`** (mirror `InhaalCard.tsx`): toont de TSB-trend + de zone (`tsbZone`) + het
voorstel + knoppen. UP: `[Doortrainen]` / `[Volg de deload]`. DOWN: `[Vervroegde deload]` /
`[Hou de opbouw]`. Accept → `putFatigueShift(monday, dir)` → `bumpPlannerVersion()` (zelfde
schrijf-dan-verversen als InhaalCard/`putDebtOptIn`); terugdraaien → `putFatigueShift(null, null)`.

**Copy (M55-safe, `coachNarrative.ts`).** VOORWAARDELIJK, claimt GEEN gebeurde daad: "Ik kan deze week
doortrainen…" / "Ik kan een vervroegde deload inplannen…", nooit "Ik heb…". Nieuwe functies:
`fatigueUpAanbodRegel` / `fatigueDownAanbodRegel` / `fatigueActieLabel` / `fatigueResultaatRegel`.

**Touch-points:** `apps/web/src/components/schema/FatigueCard.tsx` (nieuw),
`apps/web/src/lib/coachNarrative.ts` (fatigue-copy), `apps/web/src/lib/schema.ts` (een
`fatigue`-voorstel-veld op de `loadSchemaWeek`-return + de trend-afleiding), `apps/web/src/lib/api.ts`
(`getFatigueShift`/`putFatigueShift`), `SchemaView.tsx` (render + prop).

---

## STAP 6 — grenzen + fork-log + engine-audit

**De drie grenzen — afgevinkt.**
- **Objectief:** het signaal komt uit de LOAD (wellness `ctl/atl → vorm` = TSB-trend), niet uit de
  subjectieve ochtend-check-in/readiness-band.
- **Karakter-invariant:** "doortrainen" = een normale `mesoFactor`-week (%FTP nominaal); "deload" = de
  STAP-3 reduced-load-week (M74-M78, %FTP nominaal, alleen dosis omlaag). Geen enkele tak raakt %FTP.
- **Voorstel-en-bevestig:** ALTIJD een kaart met opt-in; nooit een stille demote (laag 2 verwijderde de
  stille week-demote — die grens blijft gerespecteerd).

**Bewuste GAS-fork (fork-log).** STAP 4 port `loadCarryFactor_` (`Algorithm.gs:2038`) NIET: dat is een
SUBJECTIEVE (vorige-week-RPE-mismatch, `rpeLastWeekMismatch_` → ×0.93/×0.88) en STILLE damper (schrijft
een `loadCarry`-DocProp die `mesoFactor()` leest, `Algorithm.gs:47/88`). Cadans vervangt 'm door een
OBJECTIEVE (TSB uit de load) + GESURFACETE (opt-in-kaart), heel-week-substitutie. Bewuste divergentie.

**Engine-touch-audit.** Het HELE mechanisme is client-only: `proposal.ts` (`mesoWeekOverride`) +
`schema.ts` (loader + TSB-trend) + `FatigueCard.tsx` + `coachNarrative.ts` + `api.ts` + de worker-route
`/api/fatigue-shift` + migratie 0006 (`sync_state`-kolommen). `packages/engine` blijft **byte-identiek**
— de engine leest de gesubstitueerde `mesoWeek` zonder één regel wijziging (dosis + deload-flag +
variant-rotatie zijn allemaal bestaande paden). **Geen onvermijdelijke engine-touch → geen FLAG.**

## Open vragen voor Daan

1. **Drempels:** UP `TSB-trend > +8`? DOWN `TSB-trend < −20`? (voorstellen — te ijken op zijn data).
2. **Trend-venster:** 7-daags gemiddelde van `vorm` + persistentie K/M (bv. 5/7)? Of een andere M/K?
3. **MIN-DATA:** ≥ 21 `vorm`-rijen in ~42 dagen — streng genoeg / te streng?
4. **Richting:** beide richtingen (beslist), of wil hij toch UP-only starten en DOWN later toevoegen?
5. **Migratie-vorm:** twee kolommen (`fatigue_shift_week` + `fatigue_shift_dir`) akkoord, of één
   samengestelde `text`?

---

*3d stap 4 recon. Geen bouw; `packages/engine` ongemoeid, `training` alleen gelezen @ `3e8090a`.*
