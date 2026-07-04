import type { ActivitiesResponse } from "@cadans/shared";

// De engine-niveau-functies verwachten de 17-koloms actValues-MATRIX met idx0 =
// een echt Date-object (ze skippen niet-Date-rijen en `formatDate`-bucketen erop).
// De /api/activities-wire-vorm heeft idx0 = ISO-datetime-STRING → hier terug naar
// Date (lokale parse, spiegelt de Worker-`fromD1`). Invalid Date → rij WEG (anders
// passeert 'ie de instanceof-Date-check en breekt de maand-bucketing).
export type ActValuesRow = (string | number | Date | null)[];

function parseIso(text: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(text); // datetime zonder Z → lokale parse (ES2015+)
}

export function parseActivityRows(payload: ActivitiesResponse): ActValuesRow[] {
  const out: ActValuesRow[] = [];
  for (const row of payload) {
    const iso = row[0];
    if (typeof iso !== "string") continue;
    const d = parseIso(iso);
    if (Number.isNaN(d.getTime())) continue;
    out.push([d, ...row.slice(1)]);
  }
  return out;
}
