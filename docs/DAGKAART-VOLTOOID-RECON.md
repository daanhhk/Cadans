# RECON — dagkaart-VOLTOOID: Cadans-staat vs SECTIE-A (+ weekdoel-diagnose)

## 0. Scope + bronnen
Doel: de Cadans-implementatiestaat mappen tegen de GAS-done-contract-spec (**SECTIE A** van
`docs/DAGKAART-PENDEL-RECON.md`, gepind op `32d7ed7`:
https://raw.githubusercontent.com/daanhhk/Cadans/32d7ed7a23ef6bbe3ef005f878c90f933c2bef72/docs/DAGKAART-PENDEL-RECON.md).
SECTIE A wordt NIET geduplicceerd. GAS = read-only referentie (`daanhhk/training` @ `3e8090a`, bevestigd).

**Kern-bevinding:** de GAS-**coach-engine is AL GEPORT** naar `packages/engine/src/coach.ts` (`index.ts:7
export * from "./coach"`), plus `actualZoneMinutes_` (`zones.ts:16`) en `segmentsFromIntent_`
(`niveau.ts:67`); en de **reële time-in-zone wordt gesynct** (`zone_times_json`, idx15). ISSUE 2 is dus
grotendeels **client-orchestratie + render**, geen nieuwe engine-port.

## 1. Cadans huidige VOLTOOID-flow
- **`DoneEntry`** (`lib/schema.ts:143-147`) = `{ tss: number; minuten: number }` — meer niet.
- **Vul-fn:** `loadSchemaWeek` (`lib/schema.ts:325-336`): loopt de activities, matcht op datum
  (`formatDate(stripTime_(row[0]), "yyyy-MM-dd")` ∈ `weekDates` = `proposalWeek.days`-datums), somt
  `row[8]` (TSS) + `row[3]` (duur-min). GEEN rit-type/naam/zones.
- **Status-dispatch:** `SchemaView.tsx:82-117` — dag-detailkaart = overline (`STATE_LABEL[day.state]`) +
  today→`CoachReadinessBanner` + `day.reden` + `day.sessions.length === 0 ? "Rustdag"-tekst :
  sessions.map(WorkoutDetail)`. **GEEN VOLTOOID-tak** → een voltooide (0-geplande-sessie) dag toont de
  Rustdag-tekst; de rit is onzichtbaar. `state` = `deriveSchemaView` (`:210-224`, today/done/planned/rest).
- **done↔dag-matching:** puur op kale datum (`weekDates.has(key)`), `parseActivityRows`
  (`lib/activities.ts:11`) zet idx0 ISO→lokale Date, behoudt idx1+.

## 2. Gap-tabel per SECTIE-A-veld
Activity-idx (`repo.ts rowFromAct :256-275`): idx1 type · idx2 naam · idx3 duur_min · idx8 tss · idx15
zone_times_json. Alle gesynct (`sync.ts:100-102` icu_zone_times→JSON; `repo.ts:236`) + in D1
(`schema.ts:65-95`: `type/naam/duur_min/tss/zone_times_json`).

| SECTIE-A-veld | GAS-bron | Cadans-status | nieuw nodig |
|---|---|---|---|
| done.typeLabel | `coachBadge_`/`intentFromType_` | activity idx1 + engine `intentFromType_` (`coach.ts:38`) | deels (extract+label) |
| done.naam | activity | idx2 (in de array, niet in DoneEntry) | deels (extract) |
| done.duurMin | activity | idx3 (nu in DoneEntry als `minuten`) | nee (bestaat) |
| done zone-min (zonesReal) | `rideTimeInZone_` (Script:801) — IF-benadering | **REËEL** via `actualZoneMinutes_` (`zones.ts:16`, uit idx15) | deels (wiren; Cadans beter dan GAS) |
| planned zone-min (segmenten) | `segmentsFromIntent_` (Web:678) | engine `segmentsFromIntent_` (`niveau.ts:67`) + `SchemaSession.blokken/zones` | deels (extract uit voorstel) |
| planned naam/typeLabel/badgeZone | voorstel | `SchemaSession.naam/zones` + `focusLabel` (`schema.ts`) | nee/deels |
| planned ifv/tss | voorstel | `SchemaSession.tss`; IF niet expliciet (proxy tss/min) | deels (ifv afleiden) |
| alignment state/score | `coachFeedback_` (Web:1152) | engine **`coachFeedback_`** (`coach.ts:440`) → `state`/`score` (`:516-517`) | nee (bestaat) |
| chipLabel | `alignChip_` | UI-mapping op `state` | ja (klein, UI) |
| callout (coach-impact) | `coachFeedback_` | engine `coachFeedback_` (NL-narratief) | nee (bestaat) |
| adaptatie | `coachAdaptatie_` (Web:1185) | `coach.ts` levert `adapt`-suggestie (`:523`); make-up-dag-SCHEDULING (library + toekomst-target) = GAS-orchestratie | deels (scheduling = nieuw) |

## 3. GAS-coach-engine port-omvang (per fn)
- **AL puur+geport (engine):** `coachFeedback_` (`coach.ts:440`), `coachActualIntent_` (`:181`),
  alignment-state/score (`:217-235`), `intentFromIF_`/`intentFromType_`, `coachZmFromSegs_`/
  `coachIntentFromZones_`, `segmentsFromIntent_` (`niveau.ts:67`), `actualZoneMinutes_` (`zones.ts:16`).
- **Client-kandidaat (orchestratie/UI):** `zcSumByZone_` (zone-som per bucket — trivialrekenwerk),
  `alignChip_`/`coachBadge_`/`coachTitle_`/`coachPctHtml_`/`coachZonesHtml_` (pure render), de per-dag
  coach-assembly (GAS `WebApp.gs:1130-1163` — server-orchestratie; Cadans-equivalent = client, zoals
  `readiness.ts`/`niveau.ts`).
- **Grootste rest-orchestratie:** `coachAdaptatie_` (make-up-dag zoeken + payload; library-afhankelijk,
  `WebApp.gs:1171-1186`) → 2c.

## 4. Ontwerp-keuze
Gevestigd Cadans-pattern = **afgeleide lagen CLIENT-SIDE uit pure engine-fns** (`lib/readiness.ts`
`deriveReadiness`, `lib/niveau.ts` `deriveNiveauSerie`). `coach.ts` is al puur + geëxporteerd. →
**AANBEVELING: client-orchestratie** (een `lib/coach.ts`-achtige `deriveDayCoach(voorstel, activity,
ctx)` die `coachFeedback_` + `actualZoneMinutes_` samenstelt), GEEN engine-edit, GEEN sign-off. Enkel als
een echte coach-gap in `coach.ts` opduikt is een engine-change (met sign-off) nodig.

## 5. Gefaseerd bouwplan
- **2a — rit-weergave.** Nieuw: per-dag done-object (`{type, naam, duurMin, zoneMinutes}` via idx1/2/3 +
  `actualZoneMinutes_`) in `loadSchemaWeek`; `SchemaView` VOLTOOID-tak (rit-naam/type/duur + zone-balk,
  hergebruik `ZoneBar`/`ZoneLegend`). Shared-DTO: geen (client-derived). D1/sync: geen (idx15 al gesynct).
  Test: de pure done-object-builder. Engine-sign-off: NEE.
- **2b — alignment + zone-vergelijking.** Nieuw: `deriveDayCoach` roept `coachFeedback_(plannedSession,
  actualActivity, ctx)` → `state`/`score`; render gepland-vs-gedaan zone-vergelijking (planned
  `segmentsFromIntent_`/`blokken` vs done `zoneMinutes`) + %-balk + chip. Test: `deriveDayCoach`-wiring
  (state/score op fixtures). Engine-sign-off: NEE (`coachFeedback_` bestaat).
- **2c — coach-impact + adapt/Garmin.** Render `coachFeedback_`-callout; adapt-knop → make-up-scheduling
  (mogelijk nieuwe client-orchestratie bovenop `coach.ts`-`adapt`); Garmin-push = apart traject. Test:
  callout/adapt-payload. Engine-sign-off: NEE tenzij `coach.ts` een gat blijkt te hebben.

## 6. Open beslispunten
- ifv-bron voor de planned-rij: proxy `tss/totaalMin` of een expliciet IF-veld op `SchemaSession`?
- `chipLabel`-teksten (align-chip) — exact GAS-copy overnemen of Cadans-NL?
- Week-navigatie op de Schema-dag-strip (nu current-week-only) — meenemen in 2a of los?
- `coachActualIntent_` gebruikt de IF-benadering; nu we REËLE zones hebben (idx15): de done-intent uit
  `actualZoneMinutes_` afleiden i.p.v. IF? (nauwkeuriger dan GAS — kleine ontwerpkeuze.)

## 7. WEEKDOEL-DIAGNOSE (los van ISSUE 2, GEEN fix)
- **Waar:** WeekLoad "gepland" = `deriveSchemaView` (`lib/schema.ts:206-233`): somt `s.tss`/`s.totaalMin`
  over de sessies per dag; `dagen.gepland += 1` alleen bij een dag MÉT sessies. Leunt NIET op de
  geselecteerde dag/UI-state — puur op `proposalWeek.days`.
- **Oorzaak-hypothese:** `buildWeekProposal` plant ALLEEN `tePlannen` = train-dagen `!gedaan` én
  `datum ≥ vandaag` (`proposal.ts:264-270`). VERLEDEN train-dagen (bv. Ma 07-06) krijgen 0 sessies → tellen
  NIET mee in "gepland". GAS toont het VOLLE-week-plan (alle 4 train-dagen). → verklaart Cadans **3 dagen /
  lager TSS+uren** vs GAS **254 TSS / 5:45 / 4 dagen**: het ontbrekende 4e (verleden) dag + pendel-dagen
  die lichter zijn (`pendel_z2`). Secundair: de pendel-dag gebruikt `pendelDuurMin` (retour) i.p.v. de
  slider, en `pendel_z2` is Z2-licht. **Hypothese, geen mutatie:** "gepland" = restant-van-de-week
  (toekomst) in Cadans vs volle-week-target in GAS → het gat is grotendeels het/de uitgesloten verleden
  train-dag(en), niet een per-dag-TSS-fout. Verifieer post-fix door de week vanaf de maandag te bekijken
  (dan zijn alle 4 dagen toekomst).
