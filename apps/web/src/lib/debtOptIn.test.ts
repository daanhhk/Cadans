import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { buildWeekProposal, type ProposalWeek } from "./proposal";

// FASE 3a — de per-week goedkeuring stuurt de planAdaptation-input van het ACTIEVE plan.
// De loader berekent `optedIn = debtOptInWeek === weekMonday`; deze tests dekken die regel
// en het effect ervan op het plan, zonder de fetch-laag.

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
// ABSOLUTE fixture-week (2026-03-09 = maandag) met een GEPINDE "vandaag". Niet relatief
// aan de echte klok: de debt-poort is [maandag .. vandaag), dus een meeschuivende week
// heeft op maandag geen verstreken dagen en dus geen tekort — de test zou dan van de
// weekdag afhangen. Met vaste datums liggen ma/di/wo altijd vóór de gepinde vandaag.
const MON = new Date(2026, 2, 9);
const iso = (n: number) => {
  const d = new Date(MON.getFullYear(), MON.getMonth(), MON.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const WEEK_MONDAY = iso(0); // 2026-03-09
const VORIGE_MAANDAG = iso(-7);
const TODAY = iso(4); // vr 2026-03-13 → ma/di/wo/do verstreken

const dagen: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  datum: iso(n),
  train: true,
  dag: null,
  minuten: n === 5 ? 120 : 90,
  dagtype: n === 5 ? "weekend" : "vrij",
  toelichting: null,
  voorgesteldType: null,
  gedaan: false,
}));

// Blob met een fors HIGH-tekort op de verstreken dagen → catchup bij planAdaptation.
const blob = [iso(0), iso(1), iso(2)].map((d) => ({
  datum: d,
  workoutType: "threshold",
  naam: "Drempel",
  zones: ["high"],
  intent: { low: 0, high: 60, anaerobic: 0 },
  tss: 80,
  minuten: 90,
  sessies: [],
}));

const acts: ActValuesRow[] = [];

/** Spiegelt de loader-regel; de loader zelf doet IO en wordt hier niet gedraaid. */
const isOptedIn = (debtOptInWeek: string | null, weekMonday: string) =>
  debtOptInWeek === weekMonday;

function plan(optedIn: boolean): ProposalWeek {
  return buildWeekProposal({
    settings: S,
    plannerDays: dagen,
    events: [],
    activities: acts,
    weekplans: blob,
    wellness: [],
    rpe: [],
    todayISO: TODAY,
    planAdaptation: optedIn,
  });
}
const codes = (r: ProposalWeek) =>
  r.days.filter((d) => d.datum >= TODAY).map((d) => d.redenCode);

describe("FASE 3a — per-week goedkeuring stuurt het actieve plan", () => {
  it("opted-in → het actieve plan draagt de catchup-aanpassing", () => {
    const optedIn = isOptedIn(WEEK_MONDAY, WEEK_MONDAY);
    expect(optedIn).toBe(true);
    const r = plan(optedIn);
    expect(codes(r).some((c) => (c ?? "").startsWith("catchup"))).toBe(true);
  });

  it("niet opted-in → actief plan byte-identiek aan de staat vóór 3a", () => {
    const optedIn = isOptedIn(null, WEEK_MONDAY);
    expect(optedIn).toBe(false);
    // De referentie: buildWeekProposal ZONDER planAdaptation-override (= globale vlag, uit).
    const referentie = buildWeekProposal({
      settings: S,
      plannerDays: dagen,
      events: [],
      activities: acts,
      weekplans: blob,
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    });
    expect(JSON.stringify(plan(optedIn).days)).toBe(
      JSON.stringify(referentie.days),
    );
    expect(
      codes(plan(optedIn)).some((c) => (c ?? "").startsWith("catchup")),
    ).toBe(false);
  });

  it("goedkeuring van een VORIGE week telt niet → normaal plan", () => {
    const optedIn = isOptedIn(VORIGE_MAANDAG, WEEK_MONDAY);
    expect(optedIn).toBe(false);
    const referentie = buildWeekProposal({
      settings: S,
      plannerDays: dagen,
      events: [],
      activities: acts,
      weekplans: blob,
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    });
    expect(JSON.stringify(plan(optedIn).days)).toBe(
      JSON.stringify(referentie.days),
    );
  });

  it("opted-in verschilt aantoonbaar van niet-opted-in (test is niet vacuüm)", () => {
    expect(JSON.stringify(plan(true).days)).not.toBe(
      JSON.stringify(plan(false).days),
    );
  });
});
