import type { RideStreams } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import {
  intervalZoneName,
  nearestSampleIndex,
  rideBadgeFromIf,
  rideChartGeometry,
} from "./rideDetail";

const OPTS = {
  width: 320,
  height: 150,
  padTop: 12,
  padBottom: 22,
  padLeft: 34,
  padRight: 34,
};

describe("rideBadgeFromIf (byte-exact GAS intentFromIF_ + cfNormIf_)", () => {
  it("grenzen: null/duur/tempo/sweetspot/drempel/vo2", () => {
    expect(rideBadgeFromIf(null)).toEqual({ zoneNum: 2, label: "Training" });
    expect(rideBadgeFromIf(0.69)).toEqual({ zoneNum: 2, label: "Duur" });
    expect(rideBadgeFromIf(0.7)).toEqual({ zoneNum: 3, label: "Tempo" });
    expect(rideBadgeFromIf(0.79)).toEqual({ zoneNum: 3, label: "Tempo" });
    expect(rideBadgeFromIf(0.87)).toEqual({ zoneNum: 4, label: "Sweet Spot" });
    expect(rideBadgeFromIf(0.94)).toEqual({ zoneNum: 4, label: "Drempel" });
    expect(rideBadgeFromIf(0.95)).toEqual({ zoneNum: 5, label: "VO2max" });
  });
  it("percentage-vorm normaliseert (>3 → /100): 77 → 0,77 → Tempo, 85 → 0,85 → Sweet Spot", () => {
    // NB: 77% = IF 0,77 < 0,80 → Tempo (de prompt-notitie '77 → Sweet Spot' klopt niet met
    // de GAS-drempels; 0,77 valt in de tempo-band). 85% = 0,85 < 0,88 → Sweet Spot.
    expect(rideBadgeFromIf(77)).toEqual({ zoneNum: 3, label: "Tempo" });
    expect(rideBadgeFromIf(85)).toEqual({ zoneNum: 4, label: "Sweet Spot" });
  });
});

describe("rideChartGeometry", () => {
  it("null streams of lege serie → geen segments", () => {
    const g0 = rideChartGeometry(null, OPTS);
    expect(g0.wattsSegments).toEqual([]);
    expect(g0.hrSegments).toEqual([]);
    const empty: RideStreams = { t: [], watts: [], hr: [], n: 0 };
    const g1 = rideChartGeometry(empty, OPTS);
    expect(g1.wattsSegments).toEqual([]);
    expect(g1.hrSegments).toEqual([]);
  });

  it("volledig-null serie → geen segments", () => {
    const s: RideStreams = {
      t: [0, 1, 2],
      watts: [null, null, null],
      hr: [null, null, null],
      n: 3,
    };
    const g = rideChartGeometry(s, OPTS);
    expect(g.wattsSegments).toEqual([]);
    expect(g.hrSegments).toEqual([]);
  });

  it("null-gat in het midden → de lijn breekt op in 2 segments (niet interpoleren)", () => {
    const s: RideStreams = {
      t: [0, 1, 2, 3, 4],
      watts: [100, 110, null, 120, 130],
      hr: [130, 132, 134, 136, 138],
      n: 5,
    };
    const g = rideChartGeometry(s, OPTS);
    expect(g.wattsSegments).toHaveLength(2);
    expect(g.hrSegments).toHaveLength(1); // HR heeft geen gat → één segment
  });

  it("y-schaal: de maxWatts-waarde mapt naar de bovenrand (padTop)", () => {
    const s: RideStreams = {
      t: [0, 1, 2],
      watts: [200, 100, 50],
      hr: [140, 130, 120],
      n: 3,
    };
    const g = rideChartGeometry(s, OPTS);
    expect(g.maxWatts).toBe(200); // ceil(200/50)*50
    // eerste punt: t=0 → x=padLeft=34, watts=200=maxWatts → y=padTop=12
    expect(g.wattsSegments[0]?.startsWith("34,12")).toBe(true);
  });

  it("plot-scalars: gevuld op een serie, 0 op een lege serie", () => {
    const s: RideStreams = {
      t: [0, 30, 60, 90],
      watts: [100, 120, 140, 110],
      hr: [130, 135, 140, 132],
      n: 4,
    };
    const g = rideChartGeometry(s, OPTS);
    expect(g.plotLeft).toBe(OPTS.padLeft); // 34
    expect(g.plotWidth).toBe(OPTS.width - OPTS.padLeft - OPTS.padRight); // 252
    expect(g.plotTop).toBe(OPTS.padTop); // 12
    expect(g.plotHeight).toBe(OPTS.height - OPTS.padTop - OPTS.padBottom); // 116
    expect(g.t0).toBe(0);
    expect(g.span).toBe(90); // laatste t − eerste t

    const g0 = rideChartGeometry(null, OPTS);
    expect([
      g0.plotLeft,
      g0.plotWidth,
      g0.plotTop,
      g0.plotHeight,
      g0.t0,
      g0.span,
    ]).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("nearestSampleIndex", () => {
  it("lege array → -1", () => {
    expect(nearestSampleIndex([], 42)).toBe(-1);
  });
  it("exacte sample → die index", () => {
    expect(nearestSampleIndex([0, 10, 20, 30], 20)).toBe(2);
  });
  it("tussen twee samples → de dichtstbijzijnde", () => {
    expect(nearestSampleIndex([0, 10, 20, 30], 12)).toBe(1); // dichter bij 10
    expect(nearestSampleIndex([0, 10, 20, 30], 17)).toBe(2); // dichter bij 20
  });
});

describe("intervalZoneName", () => {
  it("1..5 → de vijf namen; 6/7 → VO2max; null/out-of-range → —", () => {
    expect(intervalZoneName(1)).toBe("Herstel");
    expect(intervalZoneName(2)).toBe("Duur");
    expect(intervalZoneName(3)).toBe("Tempo");
    expect(intervalZoneName(4)).toBe("Drempel");
    expect(intervalZoneName(5)).toBe("VO2max");
    expect(intervalZoneName(6)).toBe("VO2max");
    expect(intervalZoneName(7)).toBe("VO2max");
    expect(intervalZoneName(null)).toBe("—");
    expect(intervalZoneName(0)).toBe("—");
    expect(intervalZoneName(9)).toBe("—");
  });
});
