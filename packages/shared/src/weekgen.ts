/**
 * weekgen — HTTP-contract voor de weekgeneratie-D1-reads:
 *   - PlannerDay: één rij uit `planner_days` (GET /api/planner/:monday geeft een
 *     array voor de doelweek [maandag..zondag], oudste-eerst).
 *   - EventItem:  één rij uit `events` (GET /api/events geeft alle events, oudste-eerst).
 *
 * WIRE-vorm: `datum` is een RAUWE ISO-datumstring "yyyy-MM-dd" (as-is uit D1, GEEN
 * fromD1; de client parset 'm in 5.3c — spiegelt de activities-route). train/gedaan
 * zijn geboolean uit de 0/1-integerkolommen; overige velden 1-op-1 (camelCase).
 */
export interface PlannerDay {
  /** ISO-datum "yyyy-MM-dd" (rauw). */
  datum: string;
  train: boolean;
  dag: string | null;
  minuten: number | null;
  dagtype: string | null;
  toelichting: string | null;
  voorgesteldType: string | null;
  gedaan: boolean;
}

/**
 * PUT /api/planner/:monday-body = de 7 dagen als beschikbaarheids-INVOER. Alleen de
 * invoervelden: `voorgesteldType` (generator-output) + `gedaan` worden NIET meegestuurd
 * (de route zet ze op null/0). Een niet-train-dag → `train:false` + minuten/dagtype/
 * toelichting null.
 */
export interface PlannerDayInput {
  /** ISO-datum "yyyy-MM-dd". */
  datum: string;
  train: boolean;
  minuten: number | null;
  dagtype: string | null;
  toelichting: string | null;
}

export interface EventItem {
  /** ISO-datum "yyyy-MM-dd" (rauw). */
  datum: string;
  naam: string | null;
  type: string | null;
  /** A/B/C (TEXT-kolom). */
  prioriteit: string | null;
  afstandKm: number | null;
  hoogtemeters: number | null;
  klimType: string | null;
  notitie: string | null;
}
