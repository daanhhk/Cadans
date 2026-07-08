import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  blokFromEngine,
  buildDoneEntry,
  doneLabel,
  focusLabel,
  formatDuurU,
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

describe("blokFromEngine", () => {
  it("mapt engine-buckets naar de GAS-hoogtePct-stappen (25/45/65/85/100)", () => {
    expect(blokFromEngine({ minuten: 10, zone: "rust" })?.hoogtePct).toBe(25);
    expect(blokFromEngine({ minuten: 10, zone: "z2" })?.hoogtePct).toBe(45);
    expect(blokFromEngine({ minuten: 10, zone: "tempo" })?.hoogtePct).toBe(65);
    expect(blokFromEngine({ minuten: 10, zone: "drempel" })?.hoogtePct).toBe(
      85,
    );
    expect(blokFromEngine({ minuten: 10, zone: "anaeroob" })?.hoogtePct).toBe(
      100,
    );
  });
  it("kleurt via de --zone-*-tokens (lijnt met de legend)", () => {
    expect(blokFromEngine({ minuten: 5, zone: "z2" })?.color).toBe(
      "var(--zone-2)",
    );
    expect(blokFromEngine({ minuten: 5, zone: "drempel" })?.color).toBe(
      "var(--zone-4)",
    );
    expect(blokFromEngine({ minuten: 5, zone: "anaeroob" })?.color).toBe(
      "var(--zone-5)",
    );
  });
  it("onbekende bucket → z2-default (zoals GAS)", () => {
    const b = blokFromEngine({ minuten: 5, zone: "onzin" });
    expect(b?.hoogtePct).toBe(45);
    expect(b?.color).toBe("var(--zone-2)");
  });
  it("negeert lege/ongeldige blokken (minuten ≤ 0 of geen object)", () => {
    expect(blokFromEngine({ minuten: 0, zone: "z2" })).toBeNull();
    expect(blokFromEngine(null)).toBeNull();
    expect(blokFromEngine("x")).toBeNull();
  });
  it("behoudt de minuten", () => {
    expect(blokFromEngine({ minuten: 12.5, zone: "z2" })?.minuten).toBe(12.5);
  });
});

describe("buildDoneEntry (fase 2a done-object)", () => {
  const doneRow = (o: {
    type?: string;
    naam?: string;
    duur?: number;
    tss?: number;
    zt?: string;
  }): ActValuesRow => {
    const r: ActValuesRow = new Array(17).fill("");
    r[0] = new Date(2026, 6, 6);
    r[1] = o.type ?? "";
    r[2] = o.naam ?? "";
    r[3] = o.duur ?? 0;
    r[8] = o.tss ?? 0;
    r[15] = o.zt ?? "";
    return r;
  };

  it("extraheert type/naam/duur/tss + reële zones (idx15)", () => {
    const d = buildDoneEntry(
      doneRow({
        type: "Ride",
        naam: "Ochtendrit",
        duur: 90,
        tss: 75,
        zt: JSON.stringify([
          { id: "Z2", secs: 3600 },
          { id: "Z4", secs: 600 },
        ]),
      }),
    );
    expect(d.type).toBe("Ride");
    expect(d.naam).toBe("Ochtendrit");
    expect(d.minuten).toBe(90);
    expect(d.tss).toBe(75);
    expect(d.zoneMinutes).toEqual({ low: 60, high: 10, anaerobic: 0 });
  });

  it("ontbrekende zone-data → zoneMinutes null (naam/duur blijven)", () => {
    const d = buildDoneEntry(doneRow({ naam: "Rit", duur: 60, tss: 40 }));
    expect(d.zoneMinutes).toBeNull();
    expect(d.minuten).toBe(60);
    expect(d.naam).toBe("Rit");
  });
});

describe("doneLabel + formatDuurU", () => {
  it("doneLabel = dominante reële zone", () => {
    expect(
      doneLabel({
        tss: 0,
        minuten: 0,
        type: "Ride",
        naam: "",
        zoneMinutes: { low: 20, high: 40, anaerobic: 0 },
      }),
    ).toBe(ZONE_META.high.label); // Drempel
  });
  it("doneLabel zonder zones → rauwe type of 'Rit'", () => {
    const base = { tss: 0, minuten: 0, naam: "", zoneMinutes: null };
    expect(doneLabel({ ...base, type: "Ride" })).toBe("Ride");
    expect(doneLabel({ ...base, type: "" })).toBe("Rit");
  });
  it("formatDuurU: 61→1u01, 90→1u30, 60→1u", () => {
    expect(formatDuurU(61)).toBe("1u01");
    expect(formatDuurU(90)).toBe("1u30");
    expect(formatDuurU(60)).toBe("1u");
  });
});
