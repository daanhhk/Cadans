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
import type { ProposalDay, ProposalWeek } from "./proposal";
import type { SchemaDay } from "./schema";
import { rauweBlokkenVan_, werkzoneLabelsVan_ } from "./zonelabels";

/** Telt deze intent als sleutelprikkel? Één bron: de engine-lijst. */
export function isSleutelIntent(intent: string | null | undefined): boolean {
  return !!intent && !!COACH_KEY_INTENTS_[intent];
}

/**
 * ROADMAP punt 27 — DRAAGT DIT PLAN EEN SLEUTELZONE?
 *
 * De TYPE-toets alleen is te smal. `combo_long_with_efforts` staat niet in
 * `COACH_TYPE_INTENT_`, dus `intentFromType_` valt door naar de terugval-scan, herkent daar
 * "long" en levert "duur" — en "duur" is geen sleutel. GEMETEN gevolg: in 44 van de 119
 * vuur-cellen meldt de weekstem dat er geen trainingsdag meer staat, terwijl er een zaterdag
 * staat met 30,0 tot 32,4 drempel-minuten. Zie docs/PUNT10-FASE-B-DEEL2-VERDICT.md §3.
 *
 * DIT IS EEN OPTELLENDE TERM, geen nieuwe classificatie: hij kan sleutelstatus alleen TOEVOEGEN.
 * Precedent is `isKey` in `coach.ts`, dat sinds punt 5 dezelfde vorm draagt.
 *
 * TEMPO DOET NIET MEE. `COACH_KEY_INTENTS_` (`coach.ts:75`) is vo2, drempel en sweetspot; tempo
 * staat daar niet in, dus een tempo-label mag hier geen sleuteldag van maken. Zou het wél
 * meedoen, dan noemt de app een gewone tempo-rit een sleutelsessie.
 */
const SLEUTELZONES = ["drempel", "anaeroob"] as const;
export function planDraagtSleutelzone_(blokken: unknown): boolean {
  const labels = werkzoneLabelsVan_(blokken);
  return SLEUTELZONES.some((z) => labels.indexOf(z) >= 0);
}

/** De rauwe blokken van één datum uit het voorstel; leeg als de dag er niet in zit. */
function blokkenVoor_(
  week: ProposalWeek | null | undefined,
  datum: string,
): unknown[] {
  const pd = (week?.days ?? []).find((d: ProposalDay) => d.datum === datum);
  return pd ? rauweBlokkenVan_(pd) : [];
}

/**
 * Staat de sleutelprikkel van DEZE dag nog open? Waar in precies twee gevallen:
 *  (a) de dag is GEMIST en het plan was een sleutelsessie;
 *  (b) de dag is wél gereden maar ANDERS (`different`): het plan was een sleutelsessie en de
 *      geleverde intent is er geen — dus lichter of iets anders gedaan.
 * Alle andere gevallen zijn niet open: on-plan, deviated binnen dezelfde intent, of een
 * niet-sleutel-plan.
 */
export function sleutelPrikkelOpen(
  day: SchemaDay | null | undefined,
  proposalWeek: ProposalWeek | null | undefined,
): boolean {
  const c = day?.coach;
  if (!c) return false;
  // ROADMAP punt 27 — de term geldt op BEIDE takken, want het is dezelfde eigenschap van het
  // PLAN. Alleen op de gemist-tak zou de app een volledig gemiste efforts-rit wel zien en een te
  // licht gereden niet. De DONE-kant blijft ongemoeid: `doneIntent` is wat er GEREDEN is, en die
  // mag een openstaande prikkel niet stil dichtzetten.
  const planSleutel =
    isSleutelIntent(c.plannedIntent) ||
    planDraagtSleutelzone_(blokkenVoor_(proposalWeek, day?.datum ?? ""));
  if (day?.state === "gemist") return planSleutel;
  return (
    c.state === "different" && planSleutel && !isSleutelIntent(c.doneIntent)
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
  proposalWeek: ProposalWeek | null | undefined,
): OpenSleutelDag[] {
  const uit: OpenSleutelDag[] = [];
  for (const d of days ?? []) {
    if (!d || d.datum < todayISO) continue;
    if (d.done) continue;
    const s = d.planSessions?.[0];
    if (!s) continue;
    // ROADMAP punt 27 — additief naast de type-toets, nooit in plaats daarvan.
    if (
      !isSleutelIntent(intentFromType_(d.voorgesteldType)) &&
      !planDraagtSleutelzone_(blokkenVoor_(proposalWeek, d.datum))
    )
      continue;
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
