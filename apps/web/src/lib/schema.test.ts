import { describe, expect, it } from "vitest";
import { focusLabel, ZONE_META } from "./schema";

describe("focusLabel", () => {
  it("mapt bucket-focus naar het NL ZONE_META-label", () => {
    expect(focusLabel("low")).toBe(ZONE_META.low.label);
    expect(focusLabel("high")).toBe(ZONE_META.high.label);
    expect(focusLabel("anaerobic")).toBe(ZONE_META.anaerobic.label);
  });
  it("laat proza-focus ongewijzigd door", () => {
    expect(focusLabel("lactate clearance")).toBe("lactate clearance");
    expect(focusLabel("volume + key zone")).toBe("volume + key zone");
  });
});
