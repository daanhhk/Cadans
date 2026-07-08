import { describe, expect, it, vi } from "vitest";
import {
  bumpPlannerVersion,
  getPlannerVersion,
  subscribePlannerVersion,
} from "./plannerSignal";

describe("plannerSignal", () => {
  it("getPlannerVersion stijgt na bumpPlannerVersion", () => {
    const before = getPlannerVersion();
    bumpPlannerVersion();
    expect(getPlannerVersion()).toBe(before + 1);
  });

  it("een subscriber-callback vuurt bij bump", () => {
    const cb = vi.fn();
    const unsub = subscribePlannerVersion(cb);
    bumpPlannerVersion();
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("na unsubscribe vuurt de callback niet meer", () => {
    const cb = vi.fn();
    const unsub = subscribePlannerVersion(cb);
    unsub();
    bumpPlannerVersion();
    expect(cb).not.toHaveBeenCalled();
  });
});
