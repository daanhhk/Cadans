/**
 * activities — HTTP-contract voor GET /api/activities. De respons is de
 * 17-koloms engine-actValues-MATRIX (geen kolom-DTO, engine-native): idx0 =
 * ISO-datetime "yyyy-MM-ddTHH:mm:ss" (string), idx1..16 = strings/numbers/"".
 * Bewust los getypeerd — de engine leest op kolom-INDEX, niet op veldnaam.
 */
export type ActivityCell = string | number | null;
export type ActivityRow = ActivityCell[];
export type ActivitiesResponse = ActivityRow[];
