import { fatigueDownAanbodRegel, fatigueUpAanbodRegel } from "./coachNarrative";
import type { FatigueVoorstel } from "./schema";

// ROADMAP punt 10 fase A — ÉÉN UITSPRAAK PER BLOK.
// Spec: docs/PUNT10-FASE-A-BOUWDOC.md §6.
//
// De doortrain-kaart en de blok-terugblik deden allebei een uitspraak over HETZELFDE blok, uit
// HETZELFDE getal (de CTL-delta over de drie opbouwweken). Op Daans eigen blok spraken die twee
// zinnen elkaar zelfs tegen: de terugblik zei "genoeg getraind, maar niet waar het telt", de
// doortrain-kaart zei "het blok heeft je niet belast".
//
// WAAROM DE KAART HAAR UITSPRAAK VERLIEST EN NIET HAAR AANBOD. ΔCTL is één getal over alle
// belasting samen en kent geen zones; sinds punt 6 bestaat er een fijner oordeel PER ZONE dat
// "genoeg getraind, verkeerde zone" wél kan zien. De grovere meter deed de stelligste uitspraak.
// Het AANBOD zelf — mesoweek-substitutie 4 naar 1 — is een WEEKvraag en blijft ongewijzigd.
//
// GEEN NIEUWE COPY. `fatigueUpAanbodRegel` en `fatigueDownAanbodRegel` dragen allebei al een tak
// die de ΔCTL-zin weglaat zodra het blok-argument null is. Deze functie zet die bestaande tak aan;
// ze bedenkt geen tweede formulering, want dan zouden er twee copy-bronnen naast elkaar leven.

/**
 * De aanbod-regel van de vermoeidheidskaart. Staat de blok-terugblik op hetzelfde scherm, dan
 * valt de blok-uitspraak weg en blijft alleen het aanbod staan.
 */
export function fatigueAanbodRegel(
  fatigue: FatigueVoorstel,
  deltaMin: number,
  terugblikOpScherm: boolean,
): string {
  const blok = terugblikOpScherm ? null : fatigue.blok;
  return fatigue.dir === "up"
    ? fatigueUpAanbodRegel(blok, deltaMin)
    : fatigueDownAanbodRegel(fatigue.tsbTrend, blok, deltaMin);
}
