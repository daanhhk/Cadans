/**
 * settings — HTTP-contract voor GET /api/settings (volledige respons; `null`
 * voor een verse user) én de PUT /api/settings-body (als `Partial<SettingsInput>`;
 * FULL-REPLACE — weggelaten velden → null, expliciete null → 400).
 *
 * Dit is de WIRE-vorm: `doelStart` is een ISO-datumstring "yyyy-MM-dd". De
 * Worker-interne repo-vorm (`EngineSettings`) houdt `doelStart` als Date en wordt
 * hiervan afgeleid — zie workers/api/src/db/repo.ts.
 */
export interface SettingsInput {
  ftp: number | null;
  lthr: number | null;
  gewicht: number | null;
  doel: string | null;
  /** ISO-datum "yyyy-MM-dd" (via dates.ts). */
  doelStart: string | null;
  hrMax: number | null;
  hrRest: number | null;
  doelDuur: number | null;
  fase: string | null;
  profielPreset: string | null;
  /** Presentatie-only (header-wordmark), GEEN engine-input. Optioneel → laat engine +
   * bestaande fixtures ongemoeid. */
  coachNaam?: string | null;
  /** Presentatie-only (coach-narrative-stijl: "warm"|"disciplined"|"statistical"), GEEN
   * engine-input. Optioneel. */
  coachPersona?: string | null;
  /** Presentatie-only (user-naam → avatar-initialen), GEEN engine-input. Optioneel. */
  naam?: string | null;
  /** T28 fase 1 — globaal beschikbare weekuren (gedeclareerde capaciteit). Voedt de
   * FTP-projectie-baseline; GEEN engine-input. Optioneel → engine + bestaande fixtures
   * ongemoeid. */
  weekUren?: number | null;
  pendelDuurMin: number | null;
  pendelAantal: number | null;
}
