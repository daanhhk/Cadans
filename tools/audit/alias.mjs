// Hand-maintained rename couplings for ported functions whose name changed.
// A coupling is itself a CLAIM, so it is printed in the rule-list and verified
// against the GAS source before it is honoured (a GAS name that does not exist
// as a function is dropped and reported). GAS-name -> Cadans-name.
export const ALIASES = [
  { gas: "trnPlannable_", cadans: "isDayPlannable" },
  { gas: "trnDurLabel_", cadans: "durLabel" },
  { gas: "coachActualZoneMin_", cadans: "actualZone5_" },
  { gas: "isoWeek_", cadans: "isoWeekNumber" },
  // R0 module 2a — port-paren die de naam-koppeling van module 1 liet lekken.
  { gas: "rollingZoneCoverage", cadans: "rollingZoneCoverage_" }, // alleen trailing underscore
  { gas: "weekPlannedTypes_", cadans: "weekPlannedTypes" }, // alleen trailing underscore
  { gas: "wellnessFallback_", cadans: "rdyWellnessFallback_" }, // canon onder nul regels identiek
  { gas: "getWellnessSignal", cadans: "wellnessSignal_" }, // Algorithm.gs:1251, roept wellnessFallback_ aan
  { gas: "computeZoneDebt_", cadans: "zoneDebt_" }, // Algorithm.gs:492, Model-2-keten
  { gas: "recentHardDayDate_", cadans: "recentHardDate_" }, // Algorithm.gs:336, Model-2-keten
  { gas: "trnNextPlannableDate_", cadans: "nextPlannableDate" }, // Script.html:2005, familie trnPlannable_
  { gas: "evTodayISO_", cadans: "todayIso" }, // Script.html:92
  { gas: "nlMaandLabel_", cadans: "maandLabel" }, // Script.html:1415
];
