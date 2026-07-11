import { describe, expect, it } from "vitest";
import { displayCoach, initials } from "./coach";

describe("displayCoach", () => {
  it("null/undefined/leeg/whitespace → 'COACH' (default, uppercase)", () => {
    expect(displayCoach(null)).toBe("COACH");
    expect(displayCoach(undefined)).toBe("COACH");
    expect(displayCoach("")).toBe("COACH");
    expect(displayCoach("   ")).toBe("COACH");
  });
  it("trimt + uppercase", () => {
    expect(displayCoach("stelvio")).toBe("STELVIO");
    expect(displayCoach("  Coach Stelvio  ")).toBe("COACH STELVIO");
  });
});

describe("initials", () => {
  it("≥2 woorden → eerste letter van de eerste twee woorden", () => {
    expect(initials("Daan Korteweg")).toBe("DK");
    expect(initials("Coach Stelvio")).toBe("CS");
    expect(initials("a b c")).toBe("AB");
  });
  it("1 woord → eerste twee letters", () => {
    expect(initials("Merckx")).toBe("ME");
    expect(initials("x")).toBe("X");
  });
  it("leeg/null → ''", () => {
    expect(initials("")).toBe("");
    expect(initials(null)).toBe("");
    expect(initials("   ")).toBe("");
  });
});
