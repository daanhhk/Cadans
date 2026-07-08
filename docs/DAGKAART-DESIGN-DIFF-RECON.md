# Dagkaart design-diff recon — GAS als bindende meetlat + 2b-2-render-bug

READ-ONLY recon. GAS (`training` @ `3e8090a`) = **bindende meetlat** voor gedrag; `design/` levert
enkel de visuele taal/tokens. Cadans-nu = de gebouwde VOLTOOID-kaart (fase 2a/2b). Geen fix hier.

## Bronnen (@ hashes)
- **GAS** `C:\Users\daan\Projects\training` @ `3e8090a` (read-only). Coach-engine: `src/Coach.gs:218`
  (`coachFeedback_`, 1-op-1 geport naar `packages/engine/src/coach.ts`). Render (CLIENT-side, HtmlService):
  `src/Script.html` `doneDetailHtml_:582` + helpers. Kaart-beslissing: `src/WebApp.gs:1130-1161`.
  → **Er bestaat WÉL een `doneDetailHtml_`** — niet in een `.gs`, maar in `src/Script.html:582`.
- **design/** `design/src/coach-feedback.jsx` (DayHead:191 / Reading:154 / ZoneCompare:55 / ZoneCompareRow:23
  / AlignChip:131 / AlignBar:139 / CoachCallout:94).
- **Cadans** `apps/web/src/components/schema/{SchemaView,DoneCompareCard,ZoneCompare,ZonePill,DoneDetail}.tsx`
  + `apps/web/src/lib/{schema,proposal}.ts`. Cadans @ `f0ab26c` (audit-HEAD).

GAS-render sectie-volgorde (`doneDetailHtml_`, Script.html:582-590): overline "· Voltooid" + align-chip →
badge-pill → **titel** → gepland|gedaan-tabel → zone-vergelijking → %-balk → coach-callout → adapt-knop →
ritdetail-affordance. GAS bouwt `coach` uit **`voorstel && actual`** (WebApp.gs:1152), los van status/gedaan.

---

## SECTIE 1 — Sectie-voor-sectie diff

Verschil-type: **(=)** conform GAS · **(D)** design/ wijkt van GAS · **(C)** Cadans volgde design/ (of geen
van beide) i.p.v. GAS · **(X)** Cadans-data dwingt de afwijking.

| Sectie | GAS-gedrag | design/-gedrag | Cadans-nu | Type + notitie (volgde Cadans GAS of design?) |
|---|---|---|---|---|
| **Type-label / badge-pill** | `coachBadge_(done.typeLabel, done.badgeZone)` zone-gekleurd (Script.html:586) | DayHead-badge, zone-pill (:200) | `ZonePill(badgeZone,badgeName)` (DoneCompareCard) | **(=)** conform — volgt GAS+design. |
| **Titel / ritnaam** | `coachTitle_` (Script.html:581): `different` → "`<doneType>`-rit · `duur`", ANDERS → **`planned.naam`** | idem (match → workout-naam "Sweet Spot 3×12"; deviation → "Tempo-rit · 1u15") | **ALTIJD** "`<doneType>`-rit · `duur`" (schema.ts:423) | **(C)** volgt NOCH GAS NOCH design — mist `planned.naam` bij on-plan/afgeweken. |
| **Align-chip** | `alignChip_(state,chipLabel)` op de **overline-rij** (Script.html:585) | AlignChip als DayHead-`right`, op de overline-rij (:219) | AlignChip **naast de pill** (rij [pill \| chip], DoneCompareCard) | **(C)** plaatsing wijkt (badge-rij i.p.v. overline-rij); label/kleur/kinds conform. |
| **Score / %-balk** ("Uitvoering volgt plan") | `coachPctHtml_` (Script.html:574) — **VERBORGEN bij `different`/`missed`/score==null**; alleen on-plan/afgeweken | AlignBar alléén op DoneMatch (on-plan); NIET op DoneDeviation | **bij ELKE niet-missed staat** (`scorePct!=null`, DoneCompareCard:262) | **(C)** toont 'm op 'anders'/`different` waar GAS+design 'm verbergen. |
| **Gepland\|gedaan-tabel** | `coachReadingHtml_` (Script.html:515): kop GEPLAND/GEDAAN, rijen Type/Duur/IF/TSS; done-Type rood bij `different` | Reading (:154) idem | Reading (DoneCompareCard) Type/Duur/IF/TSS, `deviate`-kleur | **(=)** conform. |
| **Compare-bars (zone-vergelijking)** | `coachZonesHtml_` (Script.html:559): Z1-Z5 (`ZCOMPARE_ZONES_` buckets rust / z2+low / tempo / drempel+high / anaeroob+anaerobic), alleen plan>0\|\|done>0, faded plan + solide done, tags niet gepland/niet gereden/gepland N′ | ZoneCompare/ZoneCompareRow idem | ZoneCompare (`zoneCompareRows` schema.ts:340): done 3-bucket → **alleen Z2/Z4/Z5** | **(X)** data-gedwongen: Cadans done = 3-bucket `{low,high,anaerobic}` → done vult nooit Z1/Z3; plan-kant + structuur/labels conform. |
| **Losse zone-bars (single)** | n.v.t. in de compare-kaart | n.v.t. in coach-feedback | de **GEREDUCEERDE** kaart (DoneDetail, geen plan) toont single `ZoneBars` | **(C)** Cadans-eigen no-plan-fallback (bv. wedstrijd zonder voorstel); GAS heeft die tak niet. |
| **Coach-proza / impact-callout** | `coachCallout_` (Script.html:499): narrative + impact + adapt | CoachCallout (:94) | **niet gebouwd** | **(C)** bewust uitgesteld → 2c. |
| **Knoppen (adapt / ritdetails)** | `coachAdaptBtn_` + `rideAffordanceHtml_` (Script.html:588-589) | geen knoppen in dit canvas | **niet gebouwd** | **(C)** bewust uitgesteld → 2c/2d. |

Samengevat: de DATA-secties (badge, tabel, compare-structuur) volgen GAS getrouw; de afwijkingen zitten in
**titel** (C), **%-balk-zichtbaarheid** (C) en **chip-plaatsing** (C), plus de data-gedwongen **3-bucket
done-zones** (X). Callout/knoppen zijn scope-uitstel (2c/2d), geen afwijking.

---

## SECTIE 2 — 2b-2-render-bug (waarom de volle kaart NIET rendert)

**Symptoom:** WO 8 (= vandaag `2026-07-08`) gepland Duurrit + gereden Drempel → de volle `DoneCompareCard`
verschijnt niet; de dag valt terug op de **gereduceerde** `DoneDetail` (ritnaam + type-pill + single
zone-bars), zonder chip/%-balk/gepland\|gedaan-tabel/compare-bars.

**Geverifieerde data (lokale dev-D1, read-only):**
- `activities` `2026-07-08`: id 260 "🚴 Coach: Drempel over-under lang", if_pct 84, tss 71 → `doneByDate['2026-07-08']` gezet → `isDone=true`.
- `planner_days` `2026-07-08`: `train=1`, **`gedaan=0`**, **`voorgesteld_type=null`**, `minuten=60`.

**Falende conditie-keten:**
1. `tePlannen` (proposal.ts:270-275) = `train && !gedaan && datum>=vandaag`. WO 8: `gedaan=0` + `datum==vandaag`
   → **WO 8 zit IN `tePlannen`** → `tePlannenSet.has(dagIdx)=true`.
2. `plannedForDone` (proposal.ts:326-332) wordt alléén gebouwd als **`!tePlannenSet.has(dagIdx)`** → voor WO 8
   FALSE → `plannedForDone = null` (en `voorgesteld_type` is toch al null in de rij).
3. `deriveSchemaView` (schema.ts:536): `doneCompare = buildDoneCompare(done, d.plannedForDone=null, …)`.
4. `buildDoneCompare` (schema.ts:395): `if (!plannedWo …) return null` → **`doneCompare = null`**.
5. Dispatch `SchemaView.tsx:109-114`: `day.done` (truthy) → `day.doneCompare` (null) → **`DoneDetail`** i.p.v.
   `DoneCompareCard`.

**Oorzaak / de aanname die de false-negative geeft:** de compare-kaart koppelt zijn **plan-bron**
(`plannedForDone`) aan `!tePlannen` — dus aan de planner-vlag **`gedaan`** — terwijl de done-staat die de
kaart aanstuurt **activity-afgeleid** is (`doneByDate` → `isDone`). Die twee lopen uiteen voor VANDAAG (en
elke dag met een activity maar een niet-gereconcilieerde `gedaan=0`): de dag is tegelijk "te plannen"
(vlag zegt niet-gedaan) én "done" (er is een rit). GAS kent deze koppeling niet — `card.voorstel` is er
altijd en `coach` volgt uit `voorstel && actual` (WebApp.gs:1152), los van `gedaan`/status.

**Fix-RICHTING (NIET implementeren):** ontkoppel de plan-bron van de `tePlannen`/`gedaan`-gate — lever de
dag-geplande workout voor de compare óók als de dag nog in `tePlannen` zit (hergebruik de reeds-gebouwde
`sessions[0]` voor een done-vandaag, of `plannedForDone` voor verleden dagen) en route `doneCompare` op de
activity-done-staat, spiegelend aan GAS' `voorstel && actual`.

---

## SECTIE 3 — Aanbeveling (prioriteit)

**Terug naar GAS-getrouwheid (met app-tokens):**
1. **P1 — 2b-2-render-bug** (Sectie 2). Blokkeert de hele volle kaart op de meest voorkomende dag
   (vandaag-met-rit) → eerst. Raakt `proposal.ts` (plan-bron) + `schema.ts`/`SchemaView.tsx` (routing).
2. **P2 — titel**: port `coachTitle_` (Script.html:581) — `planned.naam` bij on-plan/afgeweken, alleen
   "`<type>`-rit · `duur`" bij `different`. Nu altijd het laatste (schema.ts:423).
3. **P3 — %-balk-zichtbaarheid**: verberg de AlignBar bij `different`/`missed` (GAS `coachPctHtml_`-conditie,
   Script.html:575). Nu getoond op elke niet-missed staat (DoneCompareCard:262).
4. **P4 — chip-plaatsing** (cosmetisch): align-chip op de overline-rij i.p.v. naast de pill (GAS/design).

**Data-gedwongen, GEACCEPTEERD (X):** de 3-bucket done-zones (`{low,high,anaerobic}` → Z2/Z4/Z5) — de
compare-bars tonen op de gedaan-kant geen Z1/Z3. Pas te verbeteren zodra done echte 5-bucket time-in-zone
draagt; nu bewust zo (plan-kant + structuur zijn conform).

**Scope-uitstel (geen afwijking):** coach-callout + adapt-knop (2c), ritdetail-drill-down (2d).
