import type { OverrideIntensiteit, OverrideRitType } from "@cadans/shared";
import { FREE_DEFAULT_DUR, type LibraryCategory } from "./library";

// Pure, DOM-loze picker-state — byte-getrouwe port van de GAS-picker (Script.html:2065-2160,
// openPicker/pkGo/pkOpenCat/pkOpenWorkout/pkSliderInput/pkFreeSet/pkHeadHtml_). Wordt straks door B2
// (Trainingen-tab) hergebruikt. Transities zijn puur: state in → nieuwe state uit, nooit muteren.

export type PickerView = "home" | "cats" | "category" | "workout" | "free";

export interface PickerState {
  view: PickerView;
  catKey: string | null;
  variantId: string | null;
  dur: number | null;
  free: { ritType: OverrideRitType; intensiteit: OverrideIntensiteit };
}

/** GAS openPicker (:2068): home, alles leeg, free = vrije rit / rustig. */
export function initialPickerState(): PickerState {
  return {
    view: "home",
    catKey: null,
    variantId: null,
    dur: null,
    free: { ritType: "vrij", intensiteit: "rustig" },
  };
}

/**
 * GAS pkGo (:2140): zet de view + de dur-reset-regel — "free" → 90, "cats"/"home" → null, anders de
 * dur BEHOUDEN. Alle back-navigatie loopt hier doorheen (pkHeadHtml_ routeert via pkGo), dus deze
 * dur-regels gelden ook op de terugweg.
 */
export function goView(s: PickerState, view: PickerView): PickerState {
  const dur =
    view === "free"
      ? FREE_DEFAULT_DUR
      : view === "cats" || view === "home"
        ? null
        : s.dur;
  return { ...s, view, dur };
}

/** GAS pkOpenCat: kies categorie, reset dur, ga naar de category-view. */
export function openCat(s: PickerState, key: string): PickerState {
  return { ...s, catKey: key, dur: null, view: "category" };
}

/** GAS pkOpenWorkout: kies variant, ga naar de workout-view, dur BEHOUDEN (de slider-waarde uit de
 * category-view reist mee — dat is opzet). */
export function openWorkout(s: PickerState, id: string): PickerState {
  return { ...s, variantId: id, view: "workout" };
}

/** GAS pkSliderInput. */
export function setDur(s: PickerState, v: number): PickerState {
  return { ...s, dur: v };
}

/** GAS pkFreeSet. */
export function setFree(
  s: PickerState,
  patch: Partial<{
    ritType: OverrideRitType;
    intensiteit: OverrideIntensiteit;
  }>,
): PickerState {
  return { ...s, free: { ...s.free, ...patch } };
}

// Back-targets uit pkHeadHtml_ (:2074-2077 + :2103). Back gaat VIA goView → de dur-reset-regels
// gelden (workout→category behoudt dur; category→cats reset naar null).
const BACK_TARGET: Record<PickerView, PickerView> = {
  home: "home",
  cats: "home",
  category: "cats",
  workout: "category",
  free: "home",
};

/** GAS pkHeadHtml_ back-knop, bovenop goView (dus met dezelfde dur-reset-regels). */
export function back(s: PickerState): PickerState {
  return goView(s, BACK_TARGET[s.view]);
}

/**
 * GAS pkHtml_/pkRowsHtml_ effectiveDur: in category/workout `s.dur ?? cat.defaultDur`, in free
 * `s.dur ?? FREE_DEFAULT_DUR`. Herbruikt de constanten uit library.ts.
 */
export function effectiveDur(
  s: PickerState,
  cat: LibraryCategory | null,
): number {
  if (s.view === "free") return s.dur ?? FREE_DEFAULT_DUR;
  return s.dur ?? cat?.defaultDur ?? FREE_DEFAULT_DUR;
}
