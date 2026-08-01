import type { ProposalDay, ProposalWeek } from "./proposal";
import type { DoneEntry, SchemaDay } from "./schema";
import { openSleutelDagen, sleutelPrikkelOpen } from "./sleutelinhaal";
import { planZone5_, type Zone5Key } from "./zonemunt";

// ROADMAP punt 10 fase B — DE WEEK-TEKORT-STEM. Pure laag, DOM-loos.
// Spec: docs/PUNT10-FASE-B-BOUWDOC.md.
//
// Fase A gaf het BLOK één stem. Deze laag geeft de WEEK er een, en alleen daar waar er iets WEG
// is — niet waar er anders getraind is. Die arbeidsverdeling komt uit `DOELEN-SPEC` §2A:
// niet-gedaan is een WEEK-vraag, niet-gewerkt is een BLOK-vraag. Grijs rijden blijft dus de
// blok-terugblik.
//
// GEMETEN WAAROM DIT NIET TEGEN DE BLOK-NORM MEET (bouwdoc §1). Over 105 cellen haalt het
// GERENDERDE PLAN zelf alle drie de zone-normen in 2 van de 105, en op de echte reeks in 3 van
// de 46 weken. Het mechanisme zit in de POPULATIE, niet in de vouwing: de norm-vorm komt uit
// `bibliotheekSignatuur` over alle 35 archetypes, terwijl een week er een handvol trekt. Een
// weekstem tegen die norm zou dus in 43 van de 46 weken een tekort melden in zones die het plan
// die week nooit vroeg. Referent is daarom het BEVROREN plan van de VERSTREKEN dagen.

/** De drie WERKzones. `rust` en `z2` dragen geen prikkel en doen hier niet mee. */
export const WERKZONES: readonly Zone5Key[] = ["tempo", "drempel", "anaeroob"];

export interface ZoneTerm {
  zone: Zone5Key;
  /** Wat het plan op de verstreken dagen vroeg. ONAFGEROND — afronden is presentatie. */
  gevraagd: number;
  /** Wat er op diezelfde dagen gereden is. ONAFGEROND. */
  geleverd: number;
}

export interface WeekTekort {
  /** Alle drie de werkzones, gevraagd en geleverd APART. Geen saldo en geen totaal. */
  termen: ZoneTerm[];
  /** De zones waar geleverd onder gevraagd ligt. */
  tekortZones: Zone5Key[];
  /** De weekmaandag — stabiele sleutel voor de copy-seed. */
  weekMonday: string;
}

export interface WeekTekortInput {
  /** Het view-model: draagt state, coach en de done-kant. */
  days: SchemaDay[] | null | undefined;
  /** Het plan-object: draagt als ENIGE de RAUWE blokken (met pctLo/pctHi). */
  proposalWeek: ProposalWeek | null | undefined;
  doneByDate: Record<string, DoneEntry> | null | undefined;
  todayISO: string;
  weekMonday: string;
  /** VERPLICHT, niet optioneel. Precedent `buildBlokReview`: een optioneel veld valt bij een
   * aanroeper stil terug op de default, en dan ziet de app de gesynchroniseerde zones nooit. */
  grenzen: readonly number[];
}

/**
 * DE RAUWE BLOKKEN VAN ÉÉN DAG — tweede vindplaats van de `planSessions`-regel uit
 * `schema.ts:1096`: de sessies als die er zijn, anders de bevroren `plannedForDone` mits
 * `totaalMin > 0`.
 *
 * WAAROM DIE REGEL HIER OPNIEUW STAAT EN NIET UIT `SchemaDay` KOMT. `SchemaDay.planSessions`
 * draagt `SchemaSession`, en `SchemaSession.blokken` is de RENDER-vorm (`minuten`, `hoogtePct`,
 * `color`) — daar zijn `pctLo` en `pctHi` al weggevouwen. `planZone5_` heeft juist die percentages
 * nodig. De rauwe blokken bestaan alleen op `ProposalWeek`. Vandaar dezelfde regel op een andere
 * bron; loopt die ooit uiteen, dan gaan week- en dagbeeld uit elkaar lopen.
 */
function rauweBlokkenVan_(d: ProposalDay): unknown[] {
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

/**
 * De weekstem, of null als de app hoort te zwijgen.
 *
 * DRIE POORTEN, alle drie hier zodat de kaart alleen hoeft te renderen. Geen enkele numerieke
 * drempel: de poort is STRUCTUREEL en hangt aan de sleutel-machinerie van punt 5b, die al
 * gemeten is. Er valt hier dus niets te ijken.
 */
export function bouwWeekTekort(input: WeekTekortInput): WeekTekort | null {
  const { days, proposalWeek, doneByDate, todayISO, weekMonday, grenzen } =
    input;
  const lijst = days ?? [];

  // VENSTER: de dagen van deze week die VOORBIJ zijn. Op maandag is dat leeg, dus zwijgt de stem
  // daar zonder eigen guard.
  const verstreken = lijst.filter((d) => d && d.datum < todayISO);
  if (verstreken.length === 0) return null;

  // POORT 1 — staat er op een verstreken dag nog een sleutelprikkel open? `sleutelPrikkelOpen`
  // komt ONGEWIJZIGD uit punt 5b; een tweede sleutel-lijst client-zijde zou uit de pas lopen met
  // wat de coach zelf sleutel noemt.
  if (!verstreken.some((d) => sleutelPrikkelOpen(d))) return null;

  // POORT 2 — is er deze week nog een trainingsdag die de prikkel KAN dragen? Zo ja, dan zegt
  // het dagblok van punt 5b waar hij staat en heeft de weekstem niets toe te voegen. De stem
  // spreekt alleen als de prikkel WEG is.
  if (openSleutelDagen(lijst, todayISO).length > 0) return null;

  // POORT 3 — DEKKING. Draagt een verstreken dag wel een rit maar geen zonedata, dan is er niets
  // te beoordelen en zwijgen we, in plaats van een tekort te melden dat we niet kunnen zien.
  const done = doneByDate ?? {};
  for (const d of verstreken) {
    const de = done[d.datum];
    if (de && !de.zoneMin5) return null;
  }

  const pDagen = new Map<string, ProposalDay>();
  for (const pd of proposalWeek?.days ?? []) pDagen.set(pd.datum, pd);

  const gevraagd: Record<string, number> = {};
  const geleverd: Record<string, number> = {};
  for (const z of WERKZONES) {
    gevraagd[z] = 0;
    geleverd[z] = 0;
  }

  // DE NOMINALE ZONE-LABELS die het plan deze week op de verstreken dagen VOORSCHREEF. Elk
  // engine-blok draagt `zone`, gezet door `pctZoneBucket_` op het MIDDEN van zijn band
  // (archetypes.ts:154, planner.ts:1316) — dat is wat het plan bedoelde, los van hoe de minuten
  // over de zone-grenzen vallen.
  const voorgeschreven = new Set<string>();

  for (const d of verstreken) {
    const pd = pDagen.get(d.datum);
    if (pd) {
      const blokken = rauweBlokkenVan_(pd);
      for (const b of blokken) {
        const z = (b as { zone?: unknown })?.zone;
        if (typeof z === "string") voorgeschreven.add(z);
      }
      const plan = planZone5_(blokken, grenzen);
      for (const z of WERKZONES) gevraagd[z] = (gevraagd[z] ?? 0) + plan[z];
    }
    const zm = done[d.datum]?.zoneMin5;
    if (zm) for (const z of WERKZONES) geleverd[z] = (geleverd[z] ?? 0) + zm[z];
  }

  const termen: ZoneTerm[] = WERKZONES.map((z) => ({
    zone: z,
    gevraagd: gevraagd[z] ?? 0,
    geleverd: geleverd[z] ?? 0,
  }));
  // DE ZONE-LABEL-POORT. `planZone5_` splitst een blok PROPORTIONEEL over de zone-grenzen, dus
  // een drempelblok waarvan de band onder de Z3/Z4-grens uitsteekt laat daar een paar minuten
  // vallen. Die minuten zijn geen voorgeschreven TEMPO-prikkel maar bandoverloop, en de stem hoort
  // er niet over te spreken.
  //
  // DIT WEERT BANDOVERLOOP, GEEN KLEIN TEKORT. Een zone die het plan wél voorschreef blijft
  // meetellen hoe klein het tekort ook is — er staat hier geen minuten-drempel, en die hoort er
  // ook niet te komen: dat zou een geijkt getal vragen dat niet bestaat. De poort is een
  // LABEL-toets, en de minuten blijven aan beide kanten van de munt op dezelfde proportionele
  // indeling liggen.
  const tekortZones = termen
    .filter((t) => t.geleverd < t.gevraagd && voorgeschreven.has(t.zone))
    .map((t) => t.zone);

  // Geen tekort in welke werkzone dan ook → niets te melden. Dit is geen drempel maar de
  // afwezigheid van een verschil.
  if (tekortZones.length === 0) return null;

  return { termen, tekortZones, weekMonday };
}
