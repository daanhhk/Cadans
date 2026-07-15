import type { SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import {
  findCategory,
  findVariant,
  freeOverride,
  libraryOverride,
  type OverrideRenderCtx,
  previewOverrideSession,
  trainingCategories,
} from "./library";

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: null,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};
const CTX: OverrideRenderCtx = {
  settings: SETTINGS,
  mesoWeek: 1,
  macroFase: "Build",
  dagIdx: 0,
};

describe("trainingCategories (index)", () => {
  it("geeft de zes GAS-categorieën met exact key/type/defaultDur uit TRAINING_CATS_", () => {
    const cats = trainingCategories(SETTINGS);
    // Exacte spiegel van packages/engine planner.ts TRAINING_CATS_ (afgelezen, niet verzonnen).
    expect(cats.map((c) => `${c.key}:${c.type}:${c.defaultDur}`)).toEqual([
      "herstel:recovery:45",
      "duur:long_z2:120",
      "tempo:tempo:75",
      "sweetspot:sweet_spot:75",
      "ftp:threshold:75",
      "vo2max:vo2max:75",
    ]);
  });

  it("elke categorie heeft 1..5 varianten met een niet-lege variantId", () => {
    for (const c of trainingCategories(SETTINGS)) {
      expect(c.variants.length).toBeGreaterThanOrEqual(1);
      expect(c.variants.length).toBeLessThanOrEqual(5);
      for (const v of c.variants) expect(v.variantId.length).toBeGreaterThan(0);
    }
  });

  it("findCategory / findVariant vinden op key/id, anders null", () => {
    const cats = trainingCategories(SETTINGS);
    const cat = findCategory(cats, "herstel");
    expect(cat?.type).toBe("recovery");
    expect(findCategory(cats, "bestaat-niet")).toBeNull();
    const v = cat && findVariant(cat, cat.variants[0]?.variantId ?? "");
    expect(v?.variantId).toBe(cat?.variants[0]?.variantId);
    expect(cat && findVariant(cat, "geen-variant")).toBeNull();
  });
});

describe("SPEC-EIS: de picker MOET variantId meesturen (anders negeert de engine de duur-slider)", () => {
  // BEWIJS voor RUN 2. buildOverrideWorkout_ (planner.ts) valt ZONDER variantId terug op
  // buildWorkout(type, dur) — dat een VAST template rendert voor een niet-schaalbaar type en de
  // gevraagde duur negeert. MET variantId → renderVariant_ schaalt de gekozen variant naar de duur.
  //
  // NB (spec-vs-code): de prompt noemde `threshold` als voorbeeld, maar in DEZE engine-port schaalt
  // buildWorkout(threshold, dur) wél mee (via scaleBlocksToFit_) → geen divergentie. Het type dat
  // in Cadans echt divergeert is `recovery`: buildWorkout(recovery, …) is een vast 60-min-template.
  // We pinnen dus `recovery`; het bewijs (variantId honoreert de duur, zonder niet) is identiek.
  it("recovery: MET variantId honoreert de gevraagde duur, ZONDER variantId niet (template-duur)", () => {
    const cats = trainingCategories(SETTINGS);
    const cat = findCategory(cats, "herstel");
    const variant = cat?.variants[0];
    if (!cat || !variant) throw new Error("herstel/variant ontbreekt");
    // 120 wijkt af van zowel de cat.defaultDur (45) als de template-duur (60).
    const withVariant = previewOverrideSession(
      libraryOverride(cat, variant, 120),
      CTX,
    );
    const withoutVariant = previewOverrideSession(
      { type: "library", workoutType: "recovery", durMin: 120 },
      CTX,
    );
    expect(withVariant?.totaalMin).toBe(120); // gevraagde duur gehonoreerd
    expect(withoutVariant?.totaalMin).toBe(60); // vast template — duur genegeerd
  });
});

describe("previewOverrideSession + DTO-builders", () => {
  it("free-override → sessie met de gevraagde duur (buildFreeRideWorkout_)", () => {
    const s = previewOverrideSession(freeOverride("groep", "tempo", 105), CTX);
    expect(s?.totaalMin).toBe(105);
  });

  it("libraryOverride zet variantId ALTIJD + workoutType = cat.type", () => {
    const cat = findCategory(trainingCategories(SETTINGS), "ftp");
    const variant = cat?.variants[0];
    if (!cat || !variant) throw new Error("ftp/variant ontbreekt");
    const ov = libraryOverride(cat, variant, 75);
    expect(ov).toEqual({
      type: "library",
      workoutType: "threshold",
      variantId: variant.variantId,
      durMin: 75,
    });
  });

  it("freeOverride heeft de juiste shape", () => {
    expect(freeOverride("vrij", "rustig", 90)).toEqual({
      type: "free",
      ritType: "vrij",
      intensiteit: "rustig",
      durMin: 90,
    });
  });
});
