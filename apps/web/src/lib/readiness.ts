import {
  formStateFromWellness_,
  getReadinessScore_,
  wellnessSignal_,
} from "@cadans/engine";
import type { CheckinInput, WellnessInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// Client-side readiness-derivatie — draait de pure @cadans/engine-fns in de browser
// (zoals Niveau/Vorm), dus TZ-veilig (browser = Amsterdam). De engine is los `any`-
// getypeerd; hier casten we het resultaat naar een lokaal contract met de keys 1-op-1
// uit packages/engine/src/readiness.ts (getReadinessScore_-return). Zie debt (l)-tak 2.

export type ReadinessDot = "good" | "warn" | "muted";
export type ReadinessBand = "ready" | "caution" | "rest";

/** Eén "waarom dit cijfer"-factor (getReadinessScore_ → factors[]). */
export interface ReadinessFactor {
  key: string;
  label: string;
  sub: number | null;
  dot: ReadinessDot;
  valueText: string;
}

/** Statuskaart-chip (getReadinessScore_ → chips[]); tone = "fresh" | "muted". */
export interface ReadinessChip {
  label: string;
  tone: string;
}

/** getReadinessScore_-return, 1-op-1. score/band = null bij onvoldoende data. */
export interface ReadinessResult {
  score: number | null;
  band: ReadinessBand | null;
  factors: ReadinessFactor[];
  chips: ReadinessChip[];
  checkinDone: boolean;
  checkinDelta: number;
  checkinSummary: string;
  checkin: CheckinInput | null;
}

// WellnessInput → de 12-koloms WELL_HEADERS-rij die de engine leest. Idx-mapping
// (overige kolommen blijven null): idx0 Datum als LOKALE Date, idx2 HRV, idx3 Slaap(u),
// idx8 CTL, idx9 ATL, idx10 Vorm, idx11 Ramp. De reeks blijft OUDSTE-EERST (map).
function toWellRow(w: WellnessInput): (number | string | Date | null)[] {
  const row: (number | string | Date | null)[] = new Array(12).fill(null);
  row[0] = parseLocalDate(w.datum);
  row[2] = w.hrv;
  row[3] = w.slaapU;
  row[8] = w.ctl;
  row[9] = w.atl;
  row[10] = w.vorm;
  row[11] = w.ramp;
  return row;
}

/**
 * deriveReadiness — WellnessInput[] (oudste-eerst) + de check-in van vandaag → het
 * readiness-resultaat voor de ReadinessCard. Param-mapping van getReadinessScore_
 * (bewust verwarrend): param2 `wellness` is de wellnessSignal_-OUTPUT (wsig), param3
 * `reeks` is de RAUWE wellness-array (leest `.vorm` voor de trend). Een lege of
 * form-loze reeks → formStateFromWellness_ = null; getReadinessScore_ vangt dat af
 * (score null), dus nooit een crash.
 */
export function deriveReadiness(
  wellness: WellnessInput[],
  checkin: CheckinInput | null,
): ReadinessResult {
  const rows = wellness.map(toWellRow);
  const fs = formStateFromWellness_(rows);
  const wsig = wellnessSignal_(rows);
  return getReadinessScore_(fs, wsig, wellness, checkin) as ReadinessResult;
}

/**
 * deriveWellnessSignal — het HRV/slaap-SIGNAAL ('recovery'|'demote'|'warning'|'normal')
 * voor de weekgen-pipeline (assignWorkouts leest `wellness.signal`). Hergebruikt dezelfde
 * WellnessInput→12-koloms-rij-conversie als deriveReadiness (oudste-eerst); deriveReadiness
 * zelf geeft dit signal NIET terug.
 */
export function deriveWellnessSignal(wellness: WellnessInput[]): string {
  return wellnessSignal_(wellness.map(toWellRow)).signal;
}
