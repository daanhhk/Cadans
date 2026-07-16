// R0 module 2b — GAS server-entrypoints, hand-onderhouden DATA (naar het model van alias.mjs:
// data apart van machinerie, elke regel een claim die bij inlezen geverifieerd wordt tegen de
// GAS-bron; een GAS-naam die niet als top-level unit bestaat wordt WEGGELATEN en gemeld).
// Afgeleid uit de google.script.run-call-sites in Script.html. `soort` is een claim over de
// Cadans-tegenhanger, geen verdict.
export const ENTRYPOINTS = [
  {
    gas: "getDashboardState",
    cadans:
      "client-side loadSchemaWeek (GET /api/settings + /api/activities + /api/wellness + /api/planner/:monday, dan buildWeekProposal)",
    soort: "hersteld",
  },
  {
    gas: "refreshActivities",
    cadans: "POST /api/sync/activities (auto bij mount, lib/syncStatus.ts)",
    soort: "hersteld",
  },
  {
    gas: "regenerateWeb",
    cadans: "geen route; Cadans regenereert elke render (bumpPlannerVersion)",
    soort: "hersteld",
  },
  { gas: "saveSettings", cadans: "PUT /api/settings", soort: "hernoemd" },
  { gas: "saveEvents", cadans: "PUT /api/events", soort: "hernoemd" },
  { gas: "saveRpe", cadans: "PUT /api/rpe/:date", soort: "hernoemd" },
  {
    gas: "saveDisposition",
    cadans: "PUT /api/disposition/:date",
    soort: "hernoemd",
  },
  {
    gas: "saveDayOverride",
    cadans: "PUT /api/override/:date",
    soort: "hernoemd",
  },
  {
    gas: "clearDayOverride",
    cadans: "PUT /api/override/:date met null",
    soort: "hernoemd",
  },
  {
    gas: "saveAvailability",
    cadans: "PUT /api/planner/:monday",
    soort: "hernoemd",
  },
  {
    gas: "saveAvailabilityPlus1",
    cadans: "PUT /api/planner/:monday (volgende maandag)",
    soort: "hernoemd",
  },
  { gas: "saveCheckin", cadans: "PUT /api/checkin/:date", soort: "hernoemd" },
  { gas: "getPowerCurve", cadans: "GET /api/power-curve", soort: "hernoemd" },
  {
    gas: "getDayCoachZones",
    cadans:
      "geen route; client-side actualZone5_ + buildDoneCompare -> coachFeedback_ (lib/schema.ts)",
    soort: "hersteld",
  },
  {
    gas: "getRideDetail",
    cadans: "AFWEZIG (2d ritdetails; knop is nog een SoonButton)",
    soort: "gat",
  },
  {
    gas: "pushWeb",
    cadans: "AFWEZIG (Garmin-push; cutover-blokkerend, zie HANDOFF)",
    soort: "gat",
  },
];
