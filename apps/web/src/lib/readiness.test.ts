import type { CheckinInput, WellnessInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { deriveReadiness } from "./readiness";

// Legt het end-to-end-contract van deriveReadiness vast: WellnessInput[] (oudste-eerst)
// → 12-koloms rijen → wellnessSignal_/formStateFromWellness_ → getReadinessScore_. De
// verwachte score is deterministisch (dezelfde fixture als de engine-selftest-assembly:
// fs {ctl:60,atl:50,form:10,ramp:3}, deficit 0, slaap 8 → 89). TZ=Europe/Amsterdam (root).

function w(datum: string, o: Partial<WellnessInput>): WellnessInput {
  return {
    datum,
    rhr: null,
    hrv: o.hrv ?? null,
    slaapU: o.slaapU ?? null,
    slaapScore: null,
    readiness: null,
    mood: null,
    weightKg: null,
    ctl: o.ctl ?? null,
    atl: o.atl ?? null,
    vorm: o.vorm ?? null,
    ramp: o.ramp ?? null,
  };
}

// Oudste-eerst; de laatste rij (max datum) draagt de geldige CTL+ATL → form 10.
const WELLNESS: WellnessInput[] = [
  w("2026-01-01", {
    hrv: 50,
    slaapU: 8,
    ctl: 58,
    atl: 49,
    vorm: 10,
    ramp: 2.5,
  }),
  w("2026-01-02", {
    hrv: 50,
    slaapU: 8,
    ctl: 59,
    atl: 49,
    vorm: 10,
    ramp: 2.8,
  }),
  w("2026-01-03", { hrv: 50, slaapU: 8, ctl: 60, atl: 50, vorm: 10, ramp: 3 }),
];

describe("deriveReadiness", () => {
  it("volle fixture zonder check-in → score 89, band ready", () => {
    const r = deriveReadiness(WELLNESS, null);
    expect(r.score).toBe(89);
    expect(r.band).toBe("ready");
    expect(r.checkinDone).toBe(false);
    expect(r.checkinDelta).toBe(0);
    // De HRV-chip komt uit de engine (hrvRecent 50) — bewijst param2 = wsig.
    expect(r.chips.some((c) => c.label === "HRV 50")).toBe(true);
  });

  it("positieve check-in → engine-delta +6 toegepast (89 → 95)", () => {
    const checkin: CheckinInput = {
      slaap: "goed",
      benen: "fris",
      stress: "laag",
    };
    const r = deriveReadiness(WELLNESS, checkin);
    expect(r.checkinDelta).toBe(6);
    expect(r.score).toBe(95);
    expect(r.band).toBe("ready");
    expect(r.checkinDone).toBe(true);
  });

  it("lege reeks → graceful (score/band null, geen crash)", () => {
    const r = deriveReadiness([], null);
    expect(r.score).toBeNull();
    expect(r.band).toBeNull();
    expect(r.factors.length).toBe(4);
  });

  it("geen form-state (geen CTL/ATL) maar wel HRV+slaap → score uit resterende factoren", () => {
    const noForm: WellnessInput[] = [
      w("2026-01-01", { hrv: 50, slaapU: 8 }),
      w("2026-01-02", { hrv: 50, slaapU: 8 }),
    ];
    const r = deriveReadiness(noForm, null);
    // fs === null (geen CTL/ATL) → vormTrend/belasting vallen weg; hrv(75)+slaap(100)
    // dragen de score: round((75*0.25 + 100*0.15) / 0.40) = 84. Geen crash.
    expect(r.score).toBe(84);
    expect(r.band).toBe("ready");
  });
});
