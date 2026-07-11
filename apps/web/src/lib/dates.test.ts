import { describe, expect, it } from "vitest";
import { isoWeekNumber } from "./dates";

describe("isoWeekNumber (ISO-8601 kalenderweek)", () => {
  it("midden in het jaar: 2026-07-11 → week 28", () => {
    expect(isoWeekNumber(new Date(2026, 6, 11))).toBe(28);
  });
  it("jaargrens: 2025-12-29 (ma) → week 1 van 2026", () => {
    expect(isoWeekNumber(new Date(2025, 11, 29))).toBe(1);
  });
  it("jaargrens: 2027-01-01 (vr) → week 53 van 2026", () => {
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53);
  });
});
