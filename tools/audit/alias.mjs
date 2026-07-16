// Hand-maintained rename couplings for ported functions whose name changed.
// A coupling is itself a CLAIM, so it is printed in the rule-list and verified
// against the GAS source before it is honoured (a GAS name that does not exist
// as a function is dropped and reported). GAS-name -> Cadans-name.
export const ALIASES = [
  { gas: "trnPlannable_", cadans: "isDayPlannable" },
  { gas: "trnDurLabel_", cadans: "durLabel" },
  { gas: "coachActualZoneMin_", cadans: "actualZone5_" },
  { gas: "isoWeek_", cadans: "isoWeekNumber" },
];
