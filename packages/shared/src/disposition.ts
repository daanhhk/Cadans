/**
 * disposition — HTTP-contract voor een dag-dispositie ("waarom niet gedaan?").
 * WIRE-vorm: `datum` = RAUWE ISO-datumstring "yyyy-MM-dd" (as-is uit D1). `reason` ∈
 * de vaste set (GAS `DISPOSITION_REASONS`, WebApp.gs:1633). GET /api/dispositions geeft
 * ALLEEN dagen mét een disposition (oudste-eerst). De rij leeft op (user_id, datum) = PK,
 * gedeeld met `override_json`.
 */
export type DispositionReason = "geen_tijd" | "bewust_gerust" | "iets_anders";

export interface DispositionEntry {
  /** ISO-datum "yyyy-MM-dd" (rauw). */
  datum: string;
  reason: DispositionReason;
}
