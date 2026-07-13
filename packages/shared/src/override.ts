/**
 * override — HTTP-contract voor een dag-override ("kies een andere training"). WIRE-vorm:
 * `datum` = RAUWE ISO-datumstring "yyyy-MM-dd". De veldnamen zijn BYTE-GETROUW aan wat de engine
 * LEEST (`buildOverrideWorkout_`/`buildFreeRideWorkout_`, planner.ts): library → workoutType +
 * optionele variantId + durMin; free → ritType + intensiteit + durMin. GET /api/overrides geeft
 * ALLEEN dagen mét een override (oudste-eerst). De rij leeft op (user_id, datum) = PK, gedeeld
 * met `disposition` (non-clobber). GAS `saveDayOverride` (WebApp.gs:1663). durMin-grenzen 20-360.
 */
export type OverrideWorkoutType =
  | "recovery"
  | "long_z2"
  | "tempo"
  | "sweet_spot"
  | "threshold"
  | "vo2max";
export type OverrideRitType = "vrij" | "groep";
export type OverrideIntensiteit = "rustig" | "tempo" | "stevig";

export interface LibraryOverride {
  type: "library";
  workoutType: OverrideWorkoutType;
  variantId?: string | null;
  durMin: number;
}
export interface FreeOverride {
  type: "free";
  ritType: OverrideRitType;
  intensiteit: OverrideIntensiteit;
  durMin: number;
}
export type DayOverride = LibraryOverride | FreeOverride;

export interface OverrideEntry {
  /** ISO-datum "yyyy-MM-dd" (rauw). */
  datum: string;
  override: DayOverride;
}
