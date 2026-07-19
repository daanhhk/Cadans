import type { ActivitiesResponse } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// De engine-niveau-functies verwachten de 17-koloms actValues-MATRIX met idx0 =
// een echt Date-object (ze skippen niet-Date-rijen en `formatDate`-bucketen erop).
// De /api/activities-wire-vorm heeft idx0 = ISO-datetime-STRING → hier terug naar
// Date (lokale parse, spiegelt de Worker-`fromD1`). Invalid Date → rij WEG (anders
// passeert 'ie de instanceof-Date-check en breekt de maand-bucketing).
export type ActValuesRow = (string | number | Date | null)[];

export function parseActivityRows(payload: ActivitiesResponse): ActValuesRow[] {
  const out: ActValuesRow[] = [];
  for (const row of payload) {
    const iso = row[0];
    if (typeof iso !== "string") continue;
    const d = parseLocalDate(iso);
    if (Number.isNaN(d.getTime())) continue;
    out.push([d, ...row.slice(1)]);
  }
  return out;
}

// ── gedaan-koppeling (fase 1) — byte-getrouwe mirror van de GAS-regel ──────────────
// Bron: src/Sync.gs `reconcilePlannerWithActivities` (bevroren @3e8090a). FRAGIELE MIRROR:
// de vier regels hieronder zijn 1-op-1 overgenomen en mogen niet "verbeterd" worden zonder
// een expliciet model-besluit.
//
//   1. dagvenster [lokale middernacht, +24u)  — nooit een UTC-round-trip
//   2. type-string bevat 'ride' OF 'run'
//   3. duur >= 50% van de GEPLANDE minuten (geplande minuten 0/afwezig → eis vervalt)
//   4. eerste match wint, daarna stoppen
//
// GAS zet een boolean vinkje; wij leiden dezelfde boolean af bij het lezen (recon-optie A,
// docs/INHAAL-DEBT-RECON.md §2.2) i.p.v. een D1-kolom te vullen — één bron (de activities),
// die niet kan verouderen.
//
// BEWUSTE DIVERGENTIE van `isDone = doneTss > 0` (schema.ts): die is ruim (élke rit met TSS
// telt → kaart-state "voltooid"), deze is nauw (is de GEPLANDE sessie afgewerkt?). Een rit
// van 30 min op een geplande 90 min is dus done voor de KAART maar niet-gedaan voor
// debt/herplanning — precies het verschil dat een tekort zichtbaar maakt (M63/M64). Niet
// samenvoegen tot één vlag.

/** Minimale plannerdag-vorm die de match nodig heeft. */
export interface GedaanPlannerDay {
  datum: string; // yyyy-MM-dd
  train: boolean;
  minuten: number | null;
}

/**
 * De datums (yyyy-MM-dd) waarvan de GEPLANDE sessie als afgewerkt geldt.
 * Niet-train-dagen en dagen zonder match ontbreken in de set.
 */
export function derivePlannerGedaan(
  plannerDays: readonly GedaanPlannerDay[] | null | undefined,
  activities: readonly ActValuesRow[] | null | undefined,
): Set<string> {
  const out = new Set<string>();
  if (!plannerDays?.length || !activities?.length) return out;
  for (const d of plannerDays) {
    if (!d?.train || typeof d.datum !== "string") continue;
    const dayStart = parseLocalDate(d.datum);
    if (Number.isNaN(dayStart.getTime())) continue;
    const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;
    const gepland = Number(d.minuten) || 0;
    for (const a of activities) {
      const ad = a[0];
      if (!(ad instanceof Date)) continue;
      const t = ad.getTime();
      if (t < dayStart.getTime() || t >= dayEnd) continue; // [start, +24u)
      const type = String(a[1] ?? "").toLowerCase();
      if (type.indexOf("ride") < 0 && type.indexOf("run") < 0) continue;
      const actMin = Number(a[3]) || 0;
      if (gepland > 0 && actMin < gepland * 0.5) continue; // 50%-duur-drempel
      out.add(d.datum);
      break; // eerste match wint
    }
  }
  return out;
}
