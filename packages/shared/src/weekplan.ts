/**
 * weekplan — HTTP-contract voor de weekplan-endpoints. Entries zijn een opaque
 * JSON-blob (geen shape-eisen; door de engine geproduceerd, as-is opgeslagen):
 *   - GET /api/weekplan/:monday        → WeekplanEntries (of 404)
 *   - GET /api/weekplans/recent?monday= → WeekplanEntries (samengevoegd venster)
 *   - PUT /api/weekplan/:monday         → body = WeekplanPutBody
 */
export type WeekplanEntries = unknown[];

export interface WeekplanPutBody {
  entries: unknown[];
}
