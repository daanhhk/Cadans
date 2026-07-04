/**
 * checkin — HTTP-contract voor de ochtend-check-in (readiness-seam):
 * GET /api/checkin/:date-respons + PUT /api/checkin/:date-body. Alle drie velden
 * verplicht (string); de datum zit in de URL, niet in de body → geen datumveld.
 *
 * Heet bewust `CheckinInput` (niet `Checkin`) om NIET te botsen met de Drizzle-row
 * `Checkin` (`typeof checkins.$inferSelect`) in workers/api/src/db/schema.ts, die
 * ook `userId`/`datum`/`ts` bevat. De DB-row blijft ongemoeid.
 */
export interface CheckinInput {
  slaap: string;
  benen: string;
  stress: string;
}
