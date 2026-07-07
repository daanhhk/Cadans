import { describe, expect, it } from "vitest";
import {
  focusLabel,
  MACRO_FASE_NL,
  macroFaseLabel,
  stripFaseSuffix,
  ZONE_META,
} from "./schema";

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

describe("macroFaseLabel", () => {
  it("mapt de engine-fase naar het NL-label", () => {
    expect(macroFaseLabel("Base")).toBe("Basis");
    expect(macroFaseLabel("Recovery")).toBe("Herstel");
    expect(macroFaseLabel("Build")).toBe("Build");
    expect(macroFaseLabel("Peak")).toBe("Peak");
    expect(macroFaseLabel("Test")).toBe("Test");
  });
  it("laat een onbekende fase ongewijzigd door", () => {
    expect(macroFaseLabel("Taper")).toBe("Taper");
    expect(macroFaseLabel("")).toBe("");
  });
});

describe("stripFaseSuffix", () => {
  it("verwijdert het fase-token maar behoudt 'ingekort'", () => {
    expect(stripFaseSuffix("Z2 progressief (Build, ingekort)")).toBe(
      "Z2 progressief (ingekort)",
    );
    expect(stripFaseSuffix("Z2 progressief (Base)")).toBe("Z2 progressief");
    expect(stripFaseSuffix("Sweet Spot lang 3×20 (Peak)")).toBe(
      "Sweet Spot lang 3×20",
    );
  });
  it("laat een naam zonder fase-suffix ongemoeid (geen false positive)", () => {
    expect(stripFaseSuffix("Drempel lang 3×14")).toBe("Drempel lang 3×14");
    expect(stripFaseSuffix("Sweet Spot 2×10 kort")).toBe(
      "Sweet Spot 2×10 kort",
    );
    // niet-fase tussen haakjes blijft staan (alleen bekende tokens strippen)
    expect(stripFaseSuffix("Ochtendrit (warmup)")).toBe("Ochtendrit (warmup)");
  });
  it("dekt alle MACRO_FASE_NL-tokens (gedeelde bron)", () => {
    for (const fase of Object.keys(MACRO_FASE_NL)) {
      expect(stripFaseSuffix(`Naam (${fase})`)).toBe("Naam");
    }
  });
});
