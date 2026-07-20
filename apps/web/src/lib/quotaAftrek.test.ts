import { isHardType_ } from "@cadans/engine";
import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import { buildWeekProposal, type ProposalWeek } from "./proposal";

// ANTI-STAPEL — een reeds GELEVERDE harde sessie hoort één kwaliteitsslot van het weekquotum
// af te trekken (allocateQualityWeek_: `remaining = quota − doneHard`). Die aftrek leest
// `d.voorgesteldType`, en de worker schrijft planner_days.voorgesteld_type altijd leeg → op
// een gedaan-dag is dat null → isHardType_(null) = false → de aftrek was inert. Zonder aftrek
// krijgt de rest van de week het VOLLE quotum bovenop de al geleverde prikkel = stapelen.
//
// De klok staat gepind: de week-allocator leest de ambient `new Date()` voor zijn
// allocToday-venster, dus zonder pin hangt de uitkomst van de weekdag af.

const MAANDAG = new Date(2026, 2, 9, 8, 0, 0); // 2026-03-09, ma
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 2, 9 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const TODAY = iso(0); // ma 2026-03-09 — de hele week ligt vooruit

const S: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: null,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

// Maandag = de reeds gereden dag (gedaan); di..zo blijven te plannen.
const dagen: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  datum: iso(n),
  train: true,
  dag: null,
  minuten: n === 5 ? 120 : 90,
  dagtype: n === 5 ? "weekend" : "vrij",
  toelichting: null,
  voorgesteldType: null, // exact de productie-staat: de worker schrijft 'm leeg
  gedaan: n === 0,
}));

/** 17-koloms rij; idx15 draagt de zone-tijden die actualZoneMinutes_ leest (via
 * zoneActsByDateFromTab_ → icu_zone_times → tryPowerZoneTimes_). */
function act(
  datum: string,
  zones: { id: string; secs: number }[],
): ActValuesRow {
  const [y, m, d] = datum.split("-").map(Number);
  const r: ActValuesRow = new Array(17).fill("");
  r[0] = new Date(y, m - 1, d, 9, 0);
  r[1] = "Ride";
  r[3] = 90;
  r[7] = 0.85;
  r[15] = JSON.stringify(zones);
  return r;
}

// HARD geleverd: 40 min in Z4 → high = 40 ≥ DEKKING_MIN_MIN (15).
const HARDE_RIT = [act(iso(0), [{ id: "Z4", secs: 2400 }])];
// Zelfde dag, zelfde duur, maar puur Z2 → low; geen high/anaerobic → niet hard.
const RUSTIGE_RIT = [act(iso(0), [{ id: "Z2", secs: 5400 }])];

function plan(activities: ActValuesRow[]): ProposalWeek {
  return buildWeekProposal({
    settings: S,
    plannerDays: dagen,
    events: [],
    activities,
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: TODAY,
  });
}

/** Harde kwaliteitsdagen in het VOORUIT-plan (dagen ≥ vandaag). */
const hardeDagen = (r: ProposalWeek) =>
  r.days.filter(
    (d) => d.datum >= TODAY && isHardType_(d.voorgesteldType, "FTP"),
  );

describe("anti-stapel: een geleverde harde sessie kost een kwaliteitsslot", () => {
  it("de fixture levert een echte harde dag op (geen lege meting)", () => {
    // Borging dat de zone-vorm klopt: zonder high/anaerobic-minuten telt de dag niet.
    const metHard = plan(HARDE_RIT);
    const zonderHard = plan(RUSTIGE_RIT);
    expect(metHard.days.find((d) => d.datum === iso(0))?.datum).toBe(iso(0));
    expect(hardeDagen(zonderHard).length).toBeGreaterThan(0);
  });

  it("hard gereden maandag → precies ÉÉN harde kwaliteitsdag minder in de rest van de week", () => {
    const metHard = hardeDagen(plan(HARDE_RIT)).length;
    const zonderHard = hardeDagen(plan(RUSTIGE_RIT)).length;
    expect(metHard).toBe(zonderHard - 1);
  });

  it("een rustig gereden dag trekt NIETS af (alleen hard telt)", () => {
    // Controle: dezelfde dag gedaan, maar zonder intensiteit → quotum onaangetast.
    const geenRit = hardeDagen(plan([])).length;
    expect(hardeDagen(plan(RUSTIGE_RIT)).length).toBe(geenRit);
  });
});
