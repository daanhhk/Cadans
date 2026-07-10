import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM,
  legToRoundTrip,
  presetHoursLabel,
  roundTripToLeg,
  type SettingsForm,
  settingsFormToBody,
  settingsToForm,
} from "./settings";

const form = (o: Partial<SettingsForm> = {}): SettingsForm => ({
  ...EMPTY_FORM,
  ...o,
});

describe("settingsFormToBody (FULL-REPLACE-serialisatie)", () => {
  it("(a) een leeggelaten veld ontbreekt in de body", () => {
    const b = settingsFormToBody(form({ ftp: "275" }));
    expect(b).toEqual({ ftp: 275 });
    expect("gewicht" in b).toBe(false);
    expect("lthr" in b).toBe(false);
    expect("doel" in b).toBe(false);
    expect("doelStart" in b).toBe(false);
  });

  it("(b) een number komt als number, niet als string", () => {
    const b = settingsFormToBody(form({ ftp: "275", gewicht: "72" }));
    expect(b.ftp).toBe(275);
    expect(typeof b.ftp).toBe("number");
    expect(b.gewicht).toBe(72);
    expect(typeof b.gewicht).toBe("number");
  });

  it("(c) geen enkele null of '' in de output", () => {
    const b = settingsFormToBody(
      form({ ftp: "275", doel: "FTP", lthr: "", gewicht: "  " }),
    );
    for (const val of Object.values(b)) {
      expect(val).not.toBeNull();
      expect(val).not.toBe("");
    }
    // whitespace-only telt als leeg → weggelaten
    expect("gewicht" in b).toBe(false);
  });

  it("(d) alle velden gevuld → alle 12 sleutels aanwezig", () => {
    const full = form({
      ftp: "275",
      lthr: "168",
      gewicht: "72",
      doel: "FTP",
      doelStart: "2026-06-01",
      hrMax: "190",
      hrRest: "48",
      doelDuur: "12",
      fase: "maintain",
      profielPreset: "gevorderd",
      pendelDuurMin: "80",
      pendelAantal: "2",
    });
    const b = settingsFormToBody(full);
    expect(Object.keys(b).sort()).toEqual(
      [
        "doel",
        "doelDuur",
        "doelStart",
        "fase",
        "ftp",
        "gewicht",
        "hrMax",
        "hrRest",
        "lthr",
        "pendelAantal",
        "pendelDuurMin",
        "profielPreset",
      ].sort(),
    );
    expect(b.doelStart).toBe("2026-06-01");
    expect(b.doel).toBe("FTP");
  });

  it("NaN-invoer wordt weggelaten (nooit NaN versturen)", () => {
    const b = settingsFormToBody(form({ ftp: "abc", gewicht: "72" }));
    expect("ftp" in b).toBe(false);
    expect(b.gewicht).toBe(72);
  });

  it("leeg formulier → lege body (cleart alles via full-replace)", () => {
    expect(settingsFormToBody(EMPTY_FORM)).toEqual({});
  });
});

describe("settingsToForm (pre-fill)", () => {
  it("null user → alle velden blanco", () => {
    expect(settingsToForm(null)).toEqual(EMPTY_FORM);
  });

  it("waarden → strings; null-velden → ''", () => {
    const f = settingsToForm({
      ftp: 275,
      lthr: null,
      gewicht: 72,
      doel: "FTP",
      doelStart: "2026-06-01",
      hrMax: null,
      hrRest: null,
      doelDuur: 12,
      fase: null,
      profielPreset: "gevorderd",
      pendelDuurMin: null,
      pendelAantal: null,
    });
    expect(f.ftp).toBe("275");
    expect(f.gewicht).toBe("72");
    expect(f.doelStart).toBe("2026-06-01");
    expect(f.lthr).toBe("");
    expect(f.fase).toBe("");
  });

  it("round-trip: form → body → (pre-filled) form is stabiel op gevulde velden", () => {
    const f = settingsToForm({
      ftp: 275,
      lthr: null,
      gewicht: 72,
      doel: "Beklimmingen",
      doelStart: "2026-06-01",
      hrMax: null,
      hrRest: null,
      doelDuur: null,
      fase: null,
      profielPreset: "gevorderd",
      pendelDuurMin: null,
      pendelAantal: null,
    });
    const b = settingsFormToBody(f);
    expect(b).toEqual({
      ftp: 275,
      gewicht: 72,
      doel: "Beklimmingen",
      doelStart: "2026-06-01",
      profielPreset: "gevorderd",
    });
  });
});

describe("pendel duur (enkele reis ↔ retour)", () => {
  it("legToRoundTrip(75) === 150", () => {
    expect(legToRoundTrip(75)).toBe(150);
  });
  it("roundTripToLeg(150) === 75", () => {
    expect(roundTripToLeg(150)).toBe(75);
  });
  it("roundTripToLeg(75) === 38 (oneven legacy rondt)", () => {
    expect(roundTripToLeg(75)).toBe(38);
  });
  it("roundTripToLeg(legToRoundTrip(75)) === 75", () => {
    expect(roundTripToLeg(legToRoundTrip(75))).toBe(75);
  });
});

describe("presetHoursLabel (§2 Volume-stat)", () => {
  it("mapt bekende presets naar het compacte uren-token uit PROFIEL_PRESET_OPTIONS", () => {
    expect(presetHoursLabel("amateur")).toBe("3u");
    expect(presetHoursLabel("gemiddeld")).toBe("5u");
    expect(presetHoursLabel("gevorderd")).toBe("7u");
    expect(presetHoursLabel("professional")).toBe("10u+");
  });
  it("null → null (lege staat)", () => {
    expect(presetHoursLabel(null)).toBeNull();
  });
  it("onbekende key / custom-profiel zonder uren-bron → null (lege staat)", () => {
    expect(presetHoursLabel("custom")).toBeNull();
    expect(presetHoursLabel("onzin")).toBeNull();
    expect(presetHoursLabel("")).toBeNull();
  });
});
