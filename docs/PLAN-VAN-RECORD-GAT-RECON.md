# Cadans — RECON: het plan-van-record-gat (weekkaart-noemer + compare)

## Aanleiding
De weekkaart "Deze week · gepland vs gedaan" toont de gepland-noemer te laag (week 30: 3/2 dagen, 124%). Gemeten oorzaak: een geplande dag die gereden is vóórdat de app die dag als vooruit-dag zag, krijgt geen plan-van-record en valt uit de noemer én uit de gepland-vs-gedaan-vergelijking.

## De bug (gemeten)
- Het plan-van-record wordt per render alleen weggeschreven voor VOORUIT-dagen: `buildWeekplanEntries` (`apps/web/src/lib/weekplanBlob.ts`) bouwt entries uitsluitend voor dagen mét sessies, en `assignWorkouts` bouwt sessies alleen voor `tePlannen` = `train && !gedaan && datum >= vandaag`. Een verstreken of al-gereden dag heeft geen sessies -> geen entry in de payload.
- De worker-freeze (`workers/api/src/weekplanFreeze.ts`, `mergeFrozenWeekplan`) behoudt een verleden-dag alleen als die AL in de opgeslagen blob zat. Een dag die nooit als vooruit-dag-met-sessie werd weggeschreven, komt dus nooit in de blob.
- Voor een verstreken dag leest `proposal.ts` het geplande plan UITSLUITEND uit de bevroren blob-entry (`plannedForDone`, geen reconstructie -- bewust, V24). Ontbreekt de entry -> `plannedForDone = null` -> 0 in de noemer en een gereduceerde detail-kaart zonder gepland-kolom.

Bewijs (screenshots week 30): MA 20 toont de volledige gepland-vs-gedaan-vergelijking (entry aanwezig), DO 23 toont alleen de gereden rit zonder gepland-kolom (entry ontbreekt). Gemeten reproductie tegen de gecommitte code: een week met 3 geplande dagen zakt naar 1 dag / 45 min in de noemer als de kopieen van 2 gereden dagen ontbreken.

## Reconstrueerbaar
De ontbrekende dag was een coach-recovery (bevestigd), geen eigen override. Het coach-plan is dus reconstrueerbaar: een `buildWeekProposal` met `todayISO = weekmaandag` en LEGE activities (geen dag gemarkeerd als gedaan) legt de hele week vooruit -> de coach vult elke dag. Gemeten: voor week 30 (FTP, mesoWeek 4) geeft die reconstructie voor donderdag `recovery`, 45 min, TSS 16 -- precies het ontbrekende plan.

## De fix (A -- aan de bron)
Vul het gat aan de opslag-kant, zodat de blob compleet wordt en de kaart + noemer zich herstellen.

1. Reconstructie-run. Naast de normale weekgeneratie draait `persistWeekplan` (`apps/web/src/lib/schema.ts`) een tweede `buildWeekProposal` met dezelfde inputs, maar `todayISO = proposalWeek.weekMonday` en `activities = []` (geen dag gedaan). Resultaat = het schone volledige-week-plan.
2. Merge de payload op datum. De weg te schrijven entries = de VOORUIT-entries uit de normale `proposalWeek` (datum >= vandaag, het live-plan) PLUS de VERLEDEN-entries uit de reconstructie (datum < vandaag). Zo houdt vandaag/toekomst het live-plan en krijgt het verleden het schone plan.
3. Worker-freeze blijft ONGEWIJZIGD. `mergeFrozenWeekplan` doet al het juiste: een verleden-dag die in de opgeslagen blob zit -> bevroren (het echte, live weggeschreven plan blijft); een verleden-dag die ontbreekt -> de payload-versie (de reconstructie vult het gat). Vooruit-dagen -> de payload (live-plan). Geen worker-wijziging, geen migratie.
4. Dedup uitbreiden. `sameForwardEntries` (`weekplanBlob.ts`) vergelijkt nu alleen vooruit-dagen -> een write wordt overgeslagen zodra de vooruit-dagen gelijk zijn, ook als een verleden-gap nog niet is weggeschreven. Uitbreiden: forceer een write ook wanneer de payload een verleden-dag bevat die ONTBREEKT in de opgeslagen blob. Alleen "ontbreekt" (niet "verschilt"): de worker houdt een bestaande verleden-entry toch vast, dus een gap wordt eenmalig gevuld en daarna niet meer herschreven (geen churn).

## Scope & bestanden
Client-only. `apps/web/src/lib/schema.ts` (`persistWeekplan`: tweede weekgen + merge) en `apps/web/src/lib/weekplanBlob.ts` (dedup-conditie). Worker, D1-schema en `packages/engine` ONGEMOEID (`git diff --stat packages/engine` leeg). Geen migratie (`0006` blijft de laatste remote).

## V24-veiligheid
De reconstructie draait binnen DEZELFDE week -> zelfde mesoweek/fase -> de dosis (minuten/tijd-in-zone/TSS) klopt. De watt-targets van een gereconstrueerde verleden-dag gebruiken de FTP-van-nu; binnen een week is FTP-verandering minimaal, en de weekkaart-noemer leunt op minuten/TSS (per workout-type FTP-stabiel), niet op absolute watts. Alleen de compare-kaart toont watt-targets -> kleine, begrensde V24-spanning, geaccepteerd. Dit is expliciet ANDERS dan verstreken WEKEN reconstrueren (V24 verbiedt dat: andere mesoweek/FTP).

## Beperking
De gap-fill is het schone weekmaandag-plan. Schoof het live-plan mid-week adaptief (andere kwaliteitsdag-keuze door done-aftrek), dan kan een gap-fill afwijken van wat er live stond. Begrensd (raakt alleen NIET-bevroren dagen), en beter dan een gat. Correct-bevroren dagen blijven onaangeroerd -- de fix corrigeert geen historie, hij vult alleen gaten.

## Retroactief herstel
De huidige-week-DO herstelt bij de volgende app-open: de reconstructie schrijft het ontbrekende recovery-plan alsnog weg (eenmalig, dan bevroren), waarna de compare-kaart een gepland-kolom toont en de noemer donderdag meetelt.

## Test
Leg vast (client-test, `apps/web/src/lib/`): (a) een verstreken done-dag zonder opgeslagen entry krijgt via de reconstructie een gepland-type en telt in de noemer; (b) een correct-bevroren verleden-dag wordt NIET overschreven door de reconstructie; (c) de dedup schrijft wanneer een verleden-gap in de payload zit en niet in stored, en slaat over wanneer alles gedekt is. Klok gepind (fixture-variabele). Engine onaangeroerd -> engine-selftest-vloer ongewijzigd; vitest-totaal stijgt met de nieuwe test (lees uit de suite, niet hardcoden).

## Gate
`pnpm lint+typecheck+test+build` groen (`--frozen-lockfile`) + CI groen. Vloeren uit de suite; niet hardcoden.
