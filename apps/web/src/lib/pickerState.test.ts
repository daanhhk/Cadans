import { describe, expect, it } from "vitest";
import type { LibraryCategory } from "./library";
import {
  back,
  effectiveDur,
  goView,
  initialPickerState,
  openCat,
  openWorkout,
  setDur,
  setFree,
} from "./pickerState";

// Categorie-stub (alleen defaultDur telt voor effectiveDur).
const CAT: LibraryCategory = {
  key: "ftp",
  label: "FTP / Drempel",
  zoneVar: "--zone-4",
  omschrijving: "…",
  defaultDur: 75,
  type: "threshold",
  variants: [{ variantId: "thr_4x10", naam: "4×10", tip: "" }],
};

describe("pickerState", () => {
  it("initialPickerState: home, alles leeg, free = vrij/rustig", () => {
    expect(initialPickerState()).toEqual({
      view: "home",
      catKey: null,
      variantId: null,
      dur: null,
      free: { ritType: "vrij", intensiteit: "rustig" },
    });
  });

  it("home → cats → category: dur null → effectiveDur == cat.defaultDur", () => {
    const s = openCat(goView(initialPickerState(), "cats"), "ftp");
    expect(s.view).toBe("category");
    expect(s.catKey).toBe("ftp");
    expect(s.dur).toBeNull();
    expect(effectiveDur(s, CAT)).toBe(75);
  });

  it("slider zetten in category → openWorkout behoudt de dur", () => {
    let s = openCat(initialPickerState(), "ftp");
    s = setDur(s, 120);
    s = openWorkout(s, "thr_4x10");
    expect(s.view).toBe("workout");
    expect(s.variantId).toBe("thr_4x10");
    expect(s.dur).toBe(120);
    expect(effectiveDur(s, CAT)).toBe(120);
  });

  it("back workout→category behoudt de dur; back category→cats reset naar null", () => {
    let s = openWorkout(setDur(openCat(initialPickerState(), "ftp"), 120), "x");
    s = back(s); // workout → category
    expect(s.view).toBe("category");
    expect(s.dur).toBe(120);
    s = back(s); // category → cats
    expect(s.view).toBe("cats");
    expect(s.dur).toBeNull();
    s = back(s); // cats → home
    expect(s.view).toBe("home");
  });

  it("goView('free') zet dur op 90; effectiveDur in free = s.dur ?? 90", () => {
    const s = goView(initialPickerState(), "free");
    expect(s.view).toBe("free");
    expect(s.dur).toBe(90);
    expect(effectiveDur(s, null)).toBe(90);
    expect(effectiveDur(setDur(s, 150), null)).toBe(150);
  });

  it("setFree muteert de bron-state niet (puur)", () => {
    const s0 = goView(initialPickerState(), "free");
    const s1 = setFree(s0, { ritType: "groep" });
    expect(s1.free).toEqual({ ritType: "groep", intensiteit: "rustig" });
    expect(s0.free).toEqual({ ritType: "vrij", intensiteit: "rustig" }); // bron intact
    expect(s1).not.toBe(s0);
  });
});
