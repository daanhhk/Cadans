# Vorm-tab — recon: UI-only of engine-port? (read-only findings)

Feiten, geen bouwbeslissingen. GAS-referentie `daanhhk/training` HEAD `3e8090a`.

## 1. Huidige Vorm-tab (apps/web)
- Route: `apps/web/src/App.tsx:19` `<Route path="/vorm" element={<Vorm />} />`. Component: `apps/web/src/pages/Vorm.tsx`.
- Secties — **ALLE LIVE, geen placeholders** (Vorm-lite, Fase 5.1b): **ReadinessCard**, **LevelCard**, **MetricRow**,
  **ConditiePmc** (12-wk PMC), + **CheckinSheet** (ochtend-check-in bottom-sheet). Componenten in
  `apps/web/src/components/vorm/`.
- Fetcht (`Vorm.tsx:34`): `getSettings()` + `getWellness()` + `getCheckin(date)`. Géén andere routes.
- Engine-fns: via **`deriveReadiness(wellness, checkin)`** (`apps/web/src/lib/readiness.ts:73`) →
  `formStateFromWellness_` + `wellnessSignal_` + `getReadinessScore_` (client-side). **ConditiePmc gebruikt GEEN
  engine-fn** — het leest `p.ctl/p.atl/p.vorm` direct van de wellness-DTO-rijen.
- Rendert al **CTL/ATL/TSB + vorm-reeks**: JA. ConditiePmc toont de ~84-daags CTL(solid)/ATL(dashed)-PMC +
  TSB-headline + zone + vorm-kloof + legenda (CTL/ATL/Vorm). Plus ReadinessCard (score + factoren) + LevelCard
  (FTP/W-kg/tier) + MetricRow.

## 2. Vorm-compute: engine of port?
- Reeks-fn BESTAAT: **`dashVormReeks_(wellValues)`** (`packages/engine/src/niveau.ts:190`) → `[{ dateISO, ctl,
  atl, vorm }]` (oudste→nieuwste), uit de 12-kol wellness-rijen (idx8 ctl · idx9 atl · idx10 vorm), lege-rij-skip
  + sort. **VOLLEDIGE reeks** (datums + ctl + atl + vorm), niet enkel een snapshot.
- **MAAR: apps/web gebruikt `dashVormReeks_` NIET** (grep: 0 refs). ConditiePmc leest de reeks direct uit de
  `WellnessInput`-DTO (die draagt `ctl/atl/vorm/ramp`, `packages/shared/src/wellness.ts:17-20`). Dus de reeks is
  client-side beschikbaar ZONDER `dashVormReeks_` → **`dashVormReeks_` is in Cadans REDUNDANT**.
- `fs.{form,ctl,atl,ramp}` komt uit **`formStateFromWellness_(rows)`** = **SNAPSHOT** (de max-datum-rij die CTL+ATL
  draagt), niet de reeks. Getest (selftest.test.ts:3309-3354, in `toBe(957)`). De PMC-**reeks** komt los uit de
  DTO-velden. Dus fs = snapshot (readiness-score); reeks = DTO-velden (PMC-chart). Beide client-side.
- TSB-zone (Fris/Productief/Oververmoeid, grenzen −10/+5): de engine kent GEEN 3-zone-fn (alleen binair `form≥0`
  in readiness.ts). De 3-zone-logica leeft UI-side in **`apps/web/src/lib/tsb.ts`** (design-autoriteit,
  in-file gedocumenteerd). `dashVormReeks_` heeft geen dedicated selftest-assert (redundant → moot).

## 3. Databeschikbaarheid
- Cadans leest wellness al client-side: **JA** — `GET /api/wellness` (oudste-eerst), `Vorm.tsx:34`. De volledige
  CTL/ATL/vorm-reeks zit in de DTO (`WellnessInput`: datum/rhr/hrv/slaapU/slaapScore/readiness/mood/weightKg/**ctl/
  atl/vorm/ramp**).
- Benodigde D1-kolommen: `wellness` idx8 ctl · idx9 atl · idx10 vorm (`dashVormReeks_`-mapping); de repo-laag mapt ze
  naar de DTO-velden. **Lokaal geseed: 366 wellness-rijen** (HANDOFF; `POST /api/sync/wellness`).
- Reeks-route: **bestaat al** (`GET /api/wellness` geeft de volledige reeks). GEEN nieuwe wire/DTO nodig.

## 4. GAS Vorm-referentie (training, read-only, HEAD 3e8090a)
- GAS toont een **swipeable STATUS-DECK (carrousel met dot-indicator)** op het dashboard/Vorm: `Script.html:1195`
  ("Dot-indicator synct met de swipe-positie van de status-deck"), `RC_DOTVAR` (:1235), `renderBalans_` (:1374 =
  conditie-balans-kaart). Leverende data: `dashVormReeks_` (reeks) + `renderBalans_` (balans-kaart).
- Cadans: de status-deck/carrousel is **BEWUST vervangen door de ReadinessCard** (Fase 1b; CLAUDE.md-invariant:
  "status-deck SUPERSEDED door de ReadinessCard, `statusGraphicHtml` niet meer gerenderd"). Cadans' conditie-
  historie (ConditiePmc, ~84 dagen CTL/ATL uit de wellness-reeks) is **rijker** dan de GAS-snapshot-kaart.

## 5. Ontwerp-autoriteit
- Bestand: **`design/src/conditie.jsx`** (166 r) + de render-target **`design/src/FTP Coach - Vorm-varianten.html`**.
  (Géén aparte `vorm.jsx`; de Vorm-tab-LAYOUT — ReadinessCard · LevelCard · MetricRow · Conditie-balans — komt uit
  het app-prototype, zie de `Vorm.tsx:18`-comment "Volgorde uit het prototype".)
- `conditie.jsx` specificeert **3 VARIANTEN van de conditie-balans (CTL·ATL·TSB)**: **A `ConditieDriehoek`** (:26 —
  driehoek-nodes CTL/ATL/TSB), **B `ConditieBalans`** (:56 — TSB-gauge −30..25 + CTL/ATL-bars), **C `ConditiePMC`**
  (:116 — 12-wk CTL/ATL-lijn + vorm-kloof + legenda). Cadans implementeerde **C** (`ConditiePmc.tsx`). A + B zijn
  niet-gekozen alternatieven.

## 6. Scope-conclusie
**UI-ONLY — geen engine-port.** En de Vorm-tab is bovendien AL grotendeels gebouwd (Vorm-lite, alle secties live).
- De compute is volledig client-side beschikbaar: readiness via `deriveReadiness` (engine-fns client-side); de
  CTL/ATL/vorm/TSB-reeks via de `WellnessInput`-DTO (ConditiePmc leest de velden direct). De engine-`dashVormReeks_`
  bestaat maar is redundant (DTO draagt de velden). Geen nieuwe route/DTO/engine-fn nodig.
- Zou een port toch overwogen worden: de enige "reeks-fn" is `dashVormReeks_` (niveau.ts:190) — maar die is al
  geport én redundant. Er landt dus NIETS nieuws in de engine.

**Openstaande beslispunten voor het plan (allemaal UI-only):**
1. **Conditie-variant**: alleen PMC (huidig) houden, of ook A `ConditieDriehoek` / B `ConditieBalans` bouwen
   (carrousel/toggle)? Het ontwerp biedt 3; de GAS-carrousel is bewust vervangen door de ReadinessCard.
2. **Styling-tokenize-pass** (zoals Schema): hebben de vorm-componenten nog rauwe px-literals? (aparte quick-check).
3. **`dashVormReeks_` wiren** (redundant) of de DTO-velden houden (huidig, cleaner)?
4. **Visuele reconciliatie** tegen `conditie.jsx` / de Vorm-varianten-render-target: ontbrekende metrics/refinements?

Onzekerheid: of het ontwerp een expliciete Vorm-tab-carrousel vereist (buiten conditie.jsx) is niet los
gedocumenteerd; de GAS-carrousel = de (vervangen) status-deck. → beslispunt (1).
