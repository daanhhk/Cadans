/**
 * rpe — HTTP-contract voor een RPE-registratie (GET /api/rpe geeft een array,
 * oudste-eerst). WIRE-vorm: `datum` = RAUWE ISO-datumstring "yyyy-MM-dd" (as-is uit
 * D1, GEEN fromD1; de client parset in 5.3d-ii). `rpe` is NULLABLE (de D1-kolom
 * `rpe integer` heeft geen NOT NULL); de rij bestaat op (user_id, datum) = PK.
 */
export interface RpeEntry {
  /** ISO-datum "yyyy-MM-dd" (rauw). */
  datum: string;
  rpe: number | null;
}
