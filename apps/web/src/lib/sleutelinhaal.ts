// ROADMAP punt 5b — WAAR STAAT DE SLEUTELPRIKKEL NOG. Pure laag, DOM-loos.
//
// De coach zei al "ik laat 'm niet vallen" bij een gemiste sleutelsessie, maar deed vervolgens
// niets zichtbaars: het `adapt`-veld had nul lezers. Renderen wás de verkeerde fix — dat veld
// draagt generieke copy over een ingekorte sessie die het plan niet uitvoert
// (`docs/INHAAL-5B-RECON.md` §1).
//
// GEMETEN dat het PLAN al herschikt: `allocateQualityWeek_` rekent het quotum als quotum MIN de
// reeds VOLTOOIDE harde dagen, dus een gemiste sleutelsessie verbruikt niets en de resterende
// dagen krijgen de kwaliteit vanzelf. In 20 van de 23 gemeten cellen draagt het restplan nog
// minstens één sleutelsessie (§3). Deze laag LEEST dat plan en verzint niets: geen tweede
// planner-run, geen override, geen daad-claim.
//
// De sleutel-lijst komt uit de ENGINE (`COACH_KEY_INTENTS_`, `intentFromType_`). Een eigen lijst
// client-zijde zou onvermijdelijk uit de pas lopen met wat de coach zelf sleutel noemt.
import { COACH_KEY_INTENTS_, intentFromType_ } from "@cadans/engine";
import type { SchemaDay } from "./schema";

/** Telt deze intent als sleutelprikkel? Één bron: de engine-lijst. */
export function isSleutelIntent(intent: string | null | undefined): boolean {
  return !!intent && !!COACH_KEY_INTENTS_[intent];
}

/**
 * Staat de sleutelprikkel van DEZE dag nog open? Waar in precies twee gevallen:
 *  (a) de dag is GEMIST en het plan was een sleutelsessie;
 *  (b) de dag is wél gereden maar ANDERS (`different`): het plan was een sleutelsessie en de
 *      geleverde intent is er geen — dus lichter of iets anders gedaan.
 * Alle andere gevallen zijn niet open: on-plan, deviated binnen dezelfde intent, of een
 * niet-sleutel-plan.
 */
export function sleutelPrikkelOpen(day: SchemaDay | null | undefined): boolean {
  const c = day?.coach;
  if (!c) return false;
  if (day?.state === "gemist") return isSleutelIntent(c.plannedIntent);
  return (
    c.state === "different" &&
    isSleutelIntent(c.plannedIntent) &&
    !isSleutelIntent(c.doneIntent)
  );
}

export interface OpenSleutelDag {
  datum: string;
  weekday: string;
  dayNum: number;
  naam: string;
  minuten: number;
}

/**
 * De dagen die de prikkel deze week nog KUNNEN dragen: vanaf vandaag, nog niet gereden, met een
 * geplande sessie en een sleutel-type.
 *
 * LET OP DE ASYMMETRIE, en die is opzet. De GEMISTE dag leest zijn intent uit `coach`
 * (`plannedIntent`), want een verstreken dag draagt zijn plan in de BEVROREN entry en
 * `voorgesteldType` is daar niet te vertrouwen. De KANDIDAAT-dagen hieronder lezen juist
 * `voorgesteldType`: die zijn `tePlannen` en dragen dat veld wél, terwijl ze geen coach-object
 * hebben (dat bestaat alleen voor done en gemist). Elke kant leest de bron die daar gevuld is.
 */
export function openSleutelDagen(
  days: SchemaDay[] | null | undefined,
  todayISO: string,
): OpenSleutelDag[] {
  const uit: OpenSleutelDag[] = [];
  for (const d of days ?? []) {
    if (!d || d.datum < todayISO) continue;
    if (d.done) continue;
    const s = d.planSessions?.[0];
    if (!s) continue;
    if (!isSleutelIntent(intentFromType_(d.voorgesteldType))) continue;
    uit.push({
      datum: d.datum,
      weekday: d.weekday,
      dayNum: d.dayNum,
      naam: s.naam,
      minuten: s.totaalMin,
    });
  }
  return uit.sort((a, b) =>
    a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0,
  );
}
