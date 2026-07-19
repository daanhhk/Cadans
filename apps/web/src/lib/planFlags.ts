/**
 * planFlags — bouw-vlaggen voor het plan-van-record (LAAG 1a).
 *
 * LAAG 1a persisteert het plan (weekplans-blob) en bevriest het verleden, maar zet de
 * BESLISSERS die op die blob leunen NOG NIET aan. Zolang `PLAN_ADAPTATION_ENABLED === false`:
 *
 *  - `intentByDateFrom` (proposal.ts) levert een LEGE map → `rollingZoneCoverage_`,
 *    `zoneDebt_`, `recentHardDate_` en daarmee de `catchup_*`-takken blijven leeg-gevoed,
 *    exact zoals vóór deze bouw (de weekplans-tabel was leeg).
 *  - `plannedTypeByDate` (proposal.ts) blijft LEEG → `rpeSignal_` filtert alles weg
 *    (`expectedRpe_ == null`) en levert 'normal'; geen stille demote.
 *
 * Daarmee is het VOORUIT-plannen byte-identiek aan de staat vóór 1a, óók zodra de blob
 * daadwerkelijk geschreven wordt. Zie de byte-identiek-test in proposal.test.ts.
 *
 * NIET gegate (bewust): de V24-leesbaan (`plannedForDone` leest de BEVROREN entry voor
 * voorbije dagen) — dat is een lees-/weergave-pad over het verleden, geen beslisser over
 * het vooruit-plan. En de readiness-band (`getReadinessScore_`) leest de blob niet en
 * blijft dus ongemoeid live.
 *
 * LAAG 2 zet deze vlag om — samen met de twee-richtingen-coach (voorstel-en-bevestig),
 * zodat het aanzetten van `rpeSignal_` geen STILLE beslisser introduceert (R3-T30/T22,
 * M30/M15/M18) en de 3a-zone-misteling geadresseerd is (zie weekplanBlob.ts).
 */
export const PLAN_ADAPTATION_ENABLED = false;
