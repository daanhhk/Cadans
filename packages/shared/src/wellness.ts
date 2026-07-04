/**
 * wellness — HTTP-contract voor een wellness-record (GET /api/wellness geeft een
 * array, oudste-eerst) én de upsert-input in de Worker. WIRE-vorm: `datum` is een
 * ISO-datumstring "yyyy-MM-dd". De repo-vorm `WellnessRecord` (datum als Date)
 * wordt hiervan afgeleid — zie workers/api/src/db/repo.ts.
 */
export interface WellnessInput {
  /** ISO-datum "yyyy-MM-dd" (via dates.ts). */
  datum: string;
  rhr: number | null;
  hrv: number | null;
  slaapU: number | null;
  slaapScore: number | null;
  readiness: number | null;
  mood: string | null;
  weightKg: number | null;
  ctl: number | null;
  atl: number | null;
  vorm: number | null;
  ramp: number | null;
}
