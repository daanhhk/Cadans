import type { ProposalDay } from "./proposal";
import type { Zone5Key } from "./zonemunt";

// DE NOMINALE ZONE-LABELS van een plan — één plek, twee lezers.
//
// Elk engine-blok draagt `zone`, gezet door `pctZoneBucket_` op het MIDDEN van zijn band
// (`archetypes.ts:154`, `planner.ts:1316`). Dat label is wat het plan BEDOELDE, los van hoe de
// minuten proportioneel over de zone-grenzen vallen.
//
// WAAROM DIT EEN GEDEELDE HELPER IS. `weektekort.ts` (punt 10 fase B) en `blok.ts` (punt 14)
// poorten allebei op datzelfde label, en om dezelfde reden: `planZone5_` splitst een blok
// PROPORTIONEEL, dus een band die over een grens loopt laat aan de andere kant minuten vallen. Die
// minuten zien eruit als een tekort en zijn BANDOVERLOOP. Twee kopieën van deze regel zouden
// onvermijdelijk uit elkaar lopen, en dan poort de weekstem op iets anders dan de blok-terugblik.

/** De drie WERKzones. `rust` en `z2` dragen geen prikkel en doen in geen van beide oordelen mee. */
export const WERKZONE_LABELS: readonly Zone5Key[] = [
  "tempo",
  "drempel",
  "anaeroob",
];

/**
 * De WERKZONE-labels die deze blokken voorschrijven, in de vaste volgorde tempo, drempel,
 * anaeroob. Blokken zonder minuten tellen niet mee: een blok van nul minuten schrijft niets voor.
 */
export function werkzoneLabelsVan_(blokken: unknown): Zone5Key[] {
  if (!Array.isArray(blokken)) return [];
  const gezien = new Set<string>();
  for (const b of blokken) {
    const o = b as { zone?: unknown; minuten?: unknown };
    const min = Number(o?.minuten);
    if (!Number.isFinite(min) || min <= 0) continue;
    if (typeof o?.zone === "string") gezien.add(o.zone);
  }
  return WERKZONE_LABELS.filter((z) => gezien.has(z));
}

/**
 * DE RAUWE BLOKKEN VAN ÉÉN PLANDAG — tweede vindplaats van de `planSessions`-regel uit
 * `schema.ts:1096`: de sessies als die er zijn, anders de bevroren `plannedForDone` mits
 * `totaalMin > 0`.
 *
 * WAAROM DIE REGEL HIER OPNIEUW STAAT EN NIET UIT `SchemaDay` KOMT. `SchemaDay.planSessions`
 * draagt `SchemaSession`, en `SchemaSession.blokken` is de RENDER-vorm (`minuten`, `hoogtePct`,
 * `color`) — daar zijn `pctLo` en `pctHi` al weggevouwen, en het `zone`-label ook. De rauwe blokken
 * bestaan alleen op `ProposalWeek`. Loopt die ooit uiteen, dan gaan week- en dagbeeld uit elkaar.
 */
export function rauweBlokkenVan_(d: ProposalDay): unknown[] {
  const uitSessies = (d.sessions ?? [])
    .map((s) => (s as { blokken?: unknown }).blokken)
    .filter((b): b is unknown[] => Array.isArray(b));
  if (uitSessies.length > 0) return uitSessies.flat();
  const bevroren = d.plannedForDone;
  if (bevroren && (bevroren.totaalMin ?? 0) > 0) {
    const b = (bevroren as { blokken?: unknown }).blokken;
    if (Array.isArray(b)) return b;
  }
  return [];
}
