// Fase 1a van de ZONE-MUNT (spec: docs/ZONE-MUNT-ONTWERP.md §4 + §5 stap 1) — de PURE
// munt-laag. Beide kanten van de munt wonen hier: de GEREDEN kant (`actualZone5_`, verhuisd
// uit `schema.ts`) en de GEPLANDE kant (`planZone5_` over de `blokken` van een sessie).
//
// WAAROM ÉÉN MODULE. De vouwing van de gereden kant stond in `schema.ts`, en `schema.ts`
// importeert uit `blok.ts`; `blok.ts` kan haar dus niet terugimporteren zonder cykel. De
// vouwing verhuist daarom naar deze eigen module — een VERPLAATSING, geen kopie: er is maar
// één bron, en `schema.ts` her-exporteert wat hij eerder zelf definieerde.
//
// DEZE LAAG WORDT IN FASE 1a NOG NERGENS AANGESLOTEN. `weekKwaliteitMinuten`,
// `buildBlokReferent`, `blokDosisNorm` en elke kaart blijven ongemoeid; fase 1b sluit aan.
// De engine wordt hier niet aangeraakt: dit is een LEESFUNCTIE over `blokken`, geen wijziging
// aan wat de engine produceert. `blok.zone`, `intent`, `ARCHETYPE_LOAD_FROM_BUCKET_` en de
// TSS-ijking (`ZONE_TSS_RATE_`, geijkt op de MIDPUNT-bucketing) blijven byte-identiek.
import { ARCHETYPES, expandArchetype_ } from "@cadans/engine";

// ── De vijf zones ─────────────────────────────────────────────────────────
// 5-bucket reële zones (brok 5, GAS-parity met WebApp.gs coachActualZoneMin_). De zone-bars +
// coachFeedback_ lezen de VOLLE 5-bucket-verdeling; de engine-3-bucket `actualZoneMinutes_`
// (load/debt, weekprep) blijft ongemoeid. rust=Z1 · z2=Z2 · tempo=Z3 · drempel=Z4 · anaeroob=Z5.
export type Zone5Key = "rust" | "z2" | "tempo" | "drempel" | "anaeroob";
export type Zone5 = Record<Zone5Key, number>;

const ZT_TO_ZONE5: Record<string, Zone5Key> = {
  Z1: "rust",
  Z2: "z2",
  Z3: "tempo",
  Z4: "drempel",
  Z5: "anaeroob",
  Z6: "anaeroob",
  Z7: "anaeroob",
};

/**
 * De VIER bovengrenzen in %FTP die de vijf zones scheiden. Dit spiegelt EXACT wat
 * `pctZoneBucket_` (packages/engine/src/zones.ts:200) vandaag hardcodeert — rust <56,
 * z2 t/m 75, tempo t/m 90, drempel t/m 105, daarboven anaeroob. Zolang de zone-sync er niet
 * is (fase 2) leest elke aanroeper deze default, en is deze laag dus INERT: ze levert
 * dezelfde indeling als de engine al hanteert.
 */
export const ZONE5_GRENZEN_DEFAULT: readonly number[] = [55, 75, 90, 105];

/**
 * intervals `power_zones` (7 oplopende bovengrenzen in %FTP) → de vier grenzen van de
 * vijf-zone-indeling. Z5..Z7 vouwen tot anaeroob, dus alleen de eerste vier tellen.
 * Ontbrekend, te kort, niet-numeriek of niet oplopend → de default. Puur, geen IO.
 */
export function zone5Grenzen(powerZones: unknown): readonly number[] {
  if (!Array.isArray(powerZones) || powerZones.length < 4) {
    return ZONE5_GRENZEN_DEFAULT;
  }
  const vier = powerZones.slice(0, 4).map((n) => Number(n));
  if (!vier.every((n) => Number.isFinite(n))) return ZONE5_GRENZEN_DEFAULT;
  for (let i = 1; i < vier.length; i++) {
    if (vier[i] <= vier[i - 1]) return ZONE5_GRENZEN_DEFAULT;
  }
  return vier;
}

function leegZone5(): Zone5 {
  return { rust: 0, z2: 0, tempo: 0, drempel: 0, anaeroob: 0 };
}

const ZONE5_VOLGORDE: Zone5Key[] = [
  "rust",
  "z2",
  "tempo",
  "drempel",
  "anaeroob",
];

/** Eén %FTP-waarde → zone, op de bovengrens-semantiek van `power_zones` (t/m de grens). */
function zoneVanPct(pct: number, grenzen: readonly number[]): Zone5Key {
  for (let i = 0; i < 4; i++) {
    if (pct <= grenzen[i]) return ZONE5_VOLGORDE[i];
  }
  return "anaeroob";
}

/**
 * De GEPLANDE kant: `blokken` (elk met `minuten`, `pctLo`, `pctHi`) → 5-bucket zone-minuten.
 *
 * Elk blok wordt PROPORTIONEEL en UNIFORM over [pctLo .. pctHi] verdeeld, niet op het
 * afgeronde midden zoals `pctZoneBucket_` doet. Reden (ZONE-MUNT-ONTWERP §3.1): een band die
 * dwars over een grens ligt — de sweetspot-sjablonen liggen over 90 — landt onder midpunt
 * voor 100% in één zone, en één procentpunt op de bovengrens kantelt dan identiek werk.
 * `pctHi <= pctLo` (steady-blok) → het hele blok in de zone van `pctLo`. Alles boven de
 * vierde grens valt in anaeroob. Een blok zonder bruikbare `pctLo`/`pctHi` wordt
 * OVERGESLAGEN, niet geraden.
 *
 * ONAFGERONDE MINUTEN TERUG — afronden is een zaak van de AANROEPER, niet van deze
 * rekenlaag. `tssFromBlokken_` (packages/engine/src/zones.ts) draagt dezelfde regel al: hij
 * telt per blok onafgerond op en rondt één keer aan het eind. Nooit per deel afronden en
 * nooit afgeronde waarden optellen — dat kost een minuut per vouwing. Gemeten geval: Z5
 * 129,2714 + Z6 27,3286 + Z7 0 is 156,6000, wat één keer afgerond 157 is, terwijl de
 * afgeronde delen 129 + 27 + 0 op 156 uitkomen. `bibliotheekSignatuur` volgt dezelfde regel
 * en levert fracties, geen minuten.
 */
export function planZone5_(
  blokken: unknown,
  grenzen: readonly number[] = ZONE5_GRENZEN_DEFAULT,
): Zone5 {
  const zm = leegZone5();
  if (!Array.isArray(blokken)) return zm;
  // Randen van de vijf banden: (-inf, g0] (g0, g1] (g1, g2] (g2, g3] (g3, +inf).
  const randen = [
    -Infinity,
    grenzen[0],
    grenzen[1],
    grenzen[2],
    grenzen[3],
    Infinity,
  ];
  for (const b of blokken) {
    const blok = b as { minuten?: unknown; pctLo?: unknown; pctHi?: unknown };
    const lo = Number(blok?.pctLo);
    const hi = Number(blok?.pctHi);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    const min = Number(blok?.minuten);
    if (!Number.isFinite(min) || min === 0) continue;
    if (hi <= lo) {
      zm[zoneVanPct(lo, grenzen)] += min;
      continue;
    }
    const breedte = hi - lo;
    for (let i = 0; i < 5; i++) {
      const overlap = Math.min(hi, randen[i + 1]) - Math.max(lo, randen[i]);
      if (overlap > 0) zm[ZONE5_VOLGORDE[i]] += (min * overlap) / breedte;
    }
  }
  return zm;
}

/**
 * De GEREDEN kant: ruwe icu_zone_times (Z1..Z7 + SS) → 5-bucket reële zone-minuten. EXACTE
 * spiegel van GAS `coachActualZoneMin_` (WebApp.gs:728): Z1→rust · Z2→z2 · Z3→tempo ·
 * Z4→drempel · Z5-7→anaeroob; SS/overlays → skip; minuten = secs/60. Leeg/geen
 * power-zonedata → null.
 *
 * MET OPZET GEEN GRENZEN-PARAMETER. Intervals heeft de zone-grenzen bij het analyseren van de
 * rit AL toegepast: de blob komt gebucket binnen als Z1..Z7. De grenzen zijn hier dus niet
 * opnieuw toe te passen — ze bepalen alleen de GEPLANDE kant (`planZone5_`), zodat beide
 * kanten van de munt op dezelfde indeling liggen.
 */
export function actualZone5_(iczt: unknown): Zone5 | null {
  if (!Array.isArray(iczt) || iczt.length === 0) return null;
  const zm = leegZone5();
  let saw = false;
  for (const z of iczt) {
    const id = (z as { id?: unknown } | null)?.id;
    if (typeof id !== "string") continue;
    const bk = ZT_TO_ZONE5[id];
    if (!bk) continue;
    zm[bk] += (Number((z as { secs?: unknown }).secs) || 0) / 60;
    saw = true;
  }
  return saw ? zm : null;
}

/** Vaste render-context voor de bibliotheek-signatuur: nominale dosis, geen meso, geen trede. */
const SIGNATUUR_FTP = 280;
const SIGNATUUR_LTHR = 178;

/** Memo op de grenzen-sleutel; zie de kop van `bibliotheekSignatuur`. */
const SIGNATUUR_CACHE = new Map<string, Zone5>();

/**
 * De VORM van de norm: welk deel van de WERKminuten (tempo + drempel + anaeroob) de
 * trainingsbibliotheek per zone voorschrijft. Rust en z2 zijn per definitie 0 — zij zijn de
 * noemer niet.
 *
 * AFGELEID, NIET GEHARDCODEERD. De signatuur wordt hier over ALLE archetypes gevouwen met
 * `planZone5_` op de meegegeven grenzen, zodat een gebruiker met eigen zones vanzelf zijn
 * eigen vorm krijgt (`docs/DOELEN-SPEC.md` §2A). Een ingetypte 28/72 zou de vorm van Daans
 * zones vastleggen voor iedereen.
 *
 * NOG GEEN DOEL-PARAMETER. Doel-splitsing is pas nodig zodra de Z3-term het OORDEEL gaat
 * dragen, en gemeten is dat hij dat nu niet doet: over de hele bibliotheek beweegt de
 * verhouding van 26/74 (midpunt) naar 28/72 (proportioneel) — `docs/ZONE-MUNT-ONTWERP.md`
 * §3.1. Splitsen per doel voegt vandaag dus geen beslissing toe.
 *
 * GEMEMOISEERD op de grenzen: de vouwing gaat door 35 archetypes en wordt vanaf fase 1b per
 * referent-bouw aangeroepen (vier weken per blok, elke render). De functie is puur en de
 * bibliotheek is een constante, dus dezelfde grenzen geven per definitie dezelfde uitkomst. De
 * cache geeft een KOPIE terug, zodat een aanroeper de bewaarde waarde niet kan muteren.
 */
export function bibliotheekSignatuur(
  grenzen: readonly number[] = ZONE5_GRENZEN_DEFAULT,
): Zone5 {
  const sleutel = grenzen.join("|");
  const bewaard = SIGNATUUR_CACHE.get(sleutel);
  if (bewaard) return { ...bewaard };
  const som = leegZone5();
  for (const rec of ARCHETYPES) {
    const uit = expandArchetype_(rec, {
      ftp: SIGNATUUR_FTP,
      lthr: SIGNATUUR_LTHR,
    });
    const zm = planZone5_(uit?.blokken, grenzen);
    for (const k of ZONE5_VOLGORDE) som[k] += zm[k];
  }
  const werk = som.tempo + som.drempel + som.anaeroob;
  const uit = leegZone5();
  if (werk > 0) {
    uit.tempo = som.tempo / werk;
    uit.drempel = som.drempel / werk;
    uit.anaeroob = som.anaeroob / werk;
  }
  SIGNATUUR_CACHE.set(sleutel, { ...uit });
  return uit;
}
