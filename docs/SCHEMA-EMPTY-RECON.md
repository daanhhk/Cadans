# RECON — Schema-tab leeg ondanks sync

Symptoom: 15 activiteiten gesynct naar remote D1, maar "Deze week · gepland vs gedaan" toont **0/0**
(gepland én gedaan), en de dag-strip + trainingskaart + workout-stappen ontbreken volledig.

**Kern-diagnose (één oorzaak):** de Schema-week is PLANNER-gedreven, niet activiteiten-gedreven. De
remote `planner_days`-tabel is **LEEG** (0 rijen) → `buildWeekProposal` bouwt `days` uit
`plannerDays` → lege week → alles leeg. De 15 activiteiten kunnen niet als "gedaan" tonen omdat er
geen week-dagen zijn om ze tegen te matchen. GEEN data-mismatch, GEEN (primair) TZ-probleem.

## DEEL A — Rendering
- **Boom:** `pages/Schema.tsx` → `SchemaView.tsx` → `PeriodTimeline` · `WeekLoad` · `DayStrip` ·
  dag-detail-`Card` (met `WorkoutDetail`/`ZoneBar`/`BlockList`).
- **Render-condities (alle hangen op `view.days`, uit `deriveSchemaView`):**
  - `SchemaView.tsx:46` `const day = view.days.find(...) ?? view.days[0]` → bij lege `days` =
    `undefined` → de dag-detail-`Card` (`{day && (...)}`, `:79`) rendert NIET → geen kaart, geen
    workout-stappen.
  - `DayStrip.tsx:75` `days.map(...)` → lege `days` = lege strip (geen chips).
  - `WeekLoad` toont `view.tss/minuten/dagen` — die worden in `deriveSchemaView` alleen opgehoogd in
    de `proposalWeek.days.map`-loop (`schema.ts:210-233`); geen dagen → blijven `{gepland:0, gedaan:0}`.
- **Welke conditie is nu false:** `proposalWeek.days` is een LEGE array → elke `.map`/`.find` erover
  levert niets.

## DEEL B — Week-proposal + gepland/gedaan
- **B1 `buildWeekProposal`:** `apps/web/src/lib/proposal.ts:121`. Input = `BuildProposalInput`
  ({settings, plannerDays, events, activities, weekplans, wellness, rpe, todayISO}). Aangeroepen op
  de Schema-tab via `loadSchemaWeek` (`schema.ts:314`). Output = `ProposalWeek {weekMonday, macroFase,
  eventNaam, wekenTotEvent, planModus, days}`.
- **B2 leeg/onvolledig:** de `days` komen 1-op-1 uit het `grid`, en `grid =
  (plannerDays || []).map(...)` (`proposal.ts:183`) → **`plannerDays` leeg ⇒ `grid` leeg ⇒ `days`
  leeg**. Met de huidige staat (settings gezet, 15 activiteiten, maar `planner_days`=0) breekt het
  hier af: er is geen dag-grid om workouts aan toe te wijzen. `assignWorkouts` krijgt een leeg
  `tePlannen` → geen sessies.
- **B3 WeekLoad-getallen:**
  - GEPLAND: `schema.ts:226-230` — som van `s.tss`/`s.totaalMin` over de sessies per dag + `dagen.gepland`
    per dag-met-sessies. Geen dagen → 0/0/0.
  - GEDAAN: `doneByDate` (`schema.ts:325-336`) = per-datum-som van activiteiten-TSS (idx8) + duur
    (idx3), MAAR **alleen voor datums in `weekDates = proposalWeek.days.map(d => d.datum)`**
    (`:325`). Lege `days` → lege `weekDates` → `if (!weekDates.has(key)) continue` (`:331`) slaat ALLE
    15 activiteiten over → gedaan 0. Zo zijn beide 0 ondanks 15 activiteiten.

## DEEL C — Activities-formaat
- **C1 gelezen velden:** de done-loop leest idx0 (datum, `instanceof Date`), idx8 (TSS), idx3 (duur-min)
  (`schema.ts:328-334`). Coverage in de engine leest daarnaast zone-minuten (idx15 `zone_times_json`,
  watts). Type = `ActValuesRow` (17-koloms, `activities.ts:9`).
- **C2 write vs read:** `upsertActivity` (`repo.ts:240`) schrijft o.a. `datum`/`tss`/`duur_min`;
  `readActivities`→`rowFromAct` (`repo.ts:256`) mapt terug `r[0]=fromD1(datum)`, `r[8]=tss`,
  `r[3]=duurMin`. **GEEN mismatch** — de D1-inspectie bevestigt `tss` gevuld (15/15).
- **C3 datum/TZ:** `datum` staat als naïeve datetime-string, bv. `2026-07-06T19:23:15` (geen `Z`).
  Client `parseActivityRows`→`parseLocalDate` (lokaal). Done-match bucket = `formatDate(stripTime_(d),
  "yyyy-MM-dd")`. Debt (d) (TZ-UTC op de sync-routes) is een LATENTE ±1-dag-rand near-midnight, maar
  NIET de oorzaak hier — de week is leeg om een andere reden (planner).
- **C4 remote-D1-inspectie (read-only):** activiteiten user_id=1 = **15**; datum-range **2026-06-12T07:01:05
  → 2026-07-06T19:23:15**; in de huidige week (2026-07-06..07-12) = **1**; TSS gevuld (>0) = **15/15**.
  `planner_days` user_id=1 = **0 totaal**, **0 in de week**.

## DEEL D — Diagnose (feiten, geen fix)
- **Eén oorzaak, alle symptomen:** `planner_days` leeg → `proposalWeek.days` leeg → (a) WeekLoad 0/0
  gepland (geen sessies) én 0/0 gedaan (lege `weekDates` → activiteiten niet gematcht), (b) lege
  dag-strip + geen trainingskaart/workout-stappen (`day` undefined). Geen tweede, losse oorzaak.
- **Geen veld-/regel-mismatch, geen TZ-breuk:** de activiteiten-data is correct (TSS gevuld, datums
  aanwezig); slechts 1 van de 15 valt toevallig in de huidige week (de rest is vóór 07-06).
- **Open beslissing die de fix raakt:** er is GEEN input voor de weekplanner/beschikbaarheid (net als
  de settings/sync-gaps), en geen sync vult `planner_days` (het is user-availability, niet
  intervals.icu-data). Bovendien heeft `buildWeekProposal` GEEN default-grid-fallback bij een lege
  planner. Fix-richtingen (te kiezen): (1) een weekplanner/beschikbaarheid-invoer-UI + persist naar
  `planner_days` (spiegelt de GAS Weekplanner-tab A3:H9), en/of (2) `buildWeekProposal` een default
  7-daags grid laten synthetiseren als `planner_days` leeg is, zodat een verse user tóch een week ziet.
