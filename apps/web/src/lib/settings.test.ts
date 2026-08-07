import { describe, expect, it } from "vitest";
import {
  blokStartBijDoel,
  EMPTY_FORM,
  presetHoursLabel,
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

describe("pendelDuurMin = duur PER RIT (T28 fase 3a)", () => {
  // De UI verdubbelde de invoer vóór opslag (legToRoundTrip). GAS bewaart 'm per rit
  // ("Pendel duur per rit", Settings.gs:39) en de engine vermenigvuldigt met pendelAantal.
  it("de ingevoerde waarde gaat ONGEWIJZIGD naar de body", () => {
    expect(
      settingsFormToBody(form({ pendelDuurMin: "75" })).pendelDuurMin,
    ).toBe(75);
  });

  it("form ← settings round-tript zonder halvering", () => {
    expect(settingsToForm({ pendelDuurMin: 75 } as never).pendelDuurMin).toBe(
      "75",
    );
  });

  it("leeg pendel-veld wordt weggelaten (FULL-REPLACE cleart)", () => {
    expect(
      "pendelDuurMin" in settingsFormToBody(form({ pendelDuurMin: "" })),
    ).toBe(false);
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

describe("weekUren (T28 gedeclareerde capaciteit)", () => {
  it("settingsToForm neemt weekUren over; null → lege string", () => {
    expect(settingsToForm({ weekUren: 7 } as never).weekUren).toBe("7");
    expect(settingsToForm({ weekUren: null } as never).weekUren).toBe("");
    expect(settingsToForm(null).weekUren).toBe("");
  });

  it("settingsFormToBody serialiseert weekUren als getal", () => {
    expect(settingsFormToBody(form({ weekUren: "7" })).weekUren).toBe(7);
  });

  it("leeg weekUren wordt WEGGELATEN → FULL-REPLACE cleart naar null", () => {
    expect("weekUren" in settingsFormToBody(form({ weekUren: "" }))).toBe(
      false,
    );
  });
});

// ── ROADMAP punt 28 — DE DOELWISSEL VERZET DE BLOKSTART ─────────────────────
// Spec: docs/PUNT28-BOUWDOC.md §3 en §4.
//
// De weekdagen zijn nagerekend en niet aangenomen: 2026-08-03 is een MAANDAG, 2026-08-05
// woensdag, 2026-08-06 donderdag, 2026-08-07 vrijdag en 2026-08-09 zondag. De grens ligt op
// woensdag — t/m woensdag pakt de LOPENDE week, daarna de eerstvolgende maandag.
describe("punt 28 — blokStartBijDoel", () => {
  it("A1 — wissel op vrijdag geeft de EERSTVOLGENDE maandag", () => {
    expect(
      blokStartBijDoel("FTP", "2026-06-29", "Korte beklimmingen", "2026-08-07"),
    ).toBe("2026-08-10");
  });

  it("A2 — wissel op woensdag pakt de LOPENDE week", () => {
    expect(
      blokStartBijDoel("FTP", "2026-06-29", "Onderhoud", "2026-08-05"),
    ).toBe("2026-08-03");
  });

  // A3 en A4 zijn DE VALKUIL van dit punt: een legacy-string die op hetzelfde canonieke doel
  // normaliseert is GEEN wissel en mag het blok dus niet terugzetten. Zonder normalisatie zou
  // het laden van een oude instelling elke keer een vers blok openen.
  it("A3 — legacy 'Beklimmingen' tegen 'Korte beklimmingen' is GEEN wissel", () => {
    expect(
      blokStartBijDoel(
        "Beklimmingen",
        "2026-06-29",
        "Korte beklimmingen",
        "2026-08-07",
      ),
    ).toBe("2026-06-29");
  });

  it("A4 — legacy 'VO2max' tegen 'FTP' is GEEN wissel", () => {
    expect(blokStartBijDoel("VO2max", "2026-06-29", "FTP", "2026-08-07")).toBe(
      "2026-06-29",
    );
  });

  it("A5 — wissel op maandag geeft die maandag zelf", () => {
    expect(
      blokStartBijDoel("FTP", "2026-06-29", "Conditie", "2026-08-03"),
    ).toBe("2026-08-03");
  });

  it("A6 — donderdag valt net buiten het venster", () => {
    expect(
      blokStartBijDoel("FTP", "2026-06-29", "Conditie", "2026-08-06"),
    ).toBe("2026-08-10");
  });

  it("A7 — zondag telt als dag 7, niet als dag 0", () => {
    expect(
      blokStartBijDoel("FTP", "2026-06-29", "Conditie", "2026-08-09"),
    ).toBe("2026-08-10");
  });

  it("A8 — IDEMPOTENT: de uitkomst opnieuw invoeren verandert niets", () => {
    const een = blokStartBijDoel(
      "FTP",
      "2026-06-29",
      "Korte beklimmingen",
      "2026-08-07",
    );
    expect(een).toBe("2026-08-10");
    // Zelfde geladen doel en dezelfde dag, maar nu met de UITKOMST als geladen blokstart. Het
    // doel is nog steeds verschillend, dus de functie rekent opnieuw — en hoort op dezelfde
    // maandag uit te komen. Dat is wat idempotent hier betekent.
    expect(
      blokStartBijDoel("FTP", een, "Korte beklimmingen", "2026-08-07"),
    ).toBe(een);
  });
});
