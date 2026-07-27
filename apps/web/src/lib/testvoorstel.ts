// Stap 5b-ii — HET TESTVOORSTEL. Pure laag, DOM-loos, geen ambient klok: elke datum komt als
// parameter binnen.
//
// Waarom dit bestaat: de blok-terugblik (5b-i) kan zonder gelegenheid geen effect-uitspraak doen en
// eindigt dan op "niet_meetbaar". Zonder een manier om een test IN TE PLANNEN is dat een dood punt.
// Deze laag biedt er één aan — maar met een MEETINTERVAL ervoor, zodat de coach niet elk blok om
// een test vraagt.
//
// DE DREMPELS HIERONDER ZIJN BELEIDSWAARDEN (Daan-besluit over meetfrequentie), GEEN uit data
// geijkte signaal-drempels. Het plateau-criterium uit `docs/WERKWIJZE.md` (*Recon en bewijslast*)
// is hier NIET van toepassing: er valt niets te ijken aan "hoe vaak wil ik testen". Een volgende
// chat hoeft ze dus niet op een reeks te toetsen — alleen met Daan te herzien.
import type { EventItem, OverrideEntry, PlannerDay } from "@cadans/shared";
import type { ActValuesRow } from "./activities";
import {
  BLOK_WEKEN,
  blokCheckEnabled,
  blokStartVoorWeek,
  blokWeekVanWeek,
  shiftIso_,
} from "./blok";
import { parseLocalDate } from "./dates";
import { type GelegenheidBron, laatsteGelegenheid } from "./effect";

/** Hoogstens ~vier metingen per jaar: pas na zoveel dagen sinds de laatste maximale inspanning
 * biedt de coach een test aan. BELEID, geen gemeten drempel. */
export const TEST_INTERVAL_DAGEN = 90;
/** Komt er binnen dit venster een A/B-wedstrijd aan, dan IS die de meting en biedt de coach geen
 * test aan. BELEID. */
export const WEDSTRIJD_HORIZON_DAGEN = 28;
/** Een testdag moet minstens zoveel beschikbare minuten hebben om de test in te passen. */
export const TEST_MIN_BESCHIKBAAR_MIN = 60;
/** De duur die de override krijgt: inrijden, 20 minuten alles geven, uitrijden. */
export const TEST_DUUR_MIN = 60;

const MS_PER_DAY = 86400000;

/** Hele dagen tussen twee yyyy-MM-dd-datums. Math.ROUND, niet floor: over een DST-sprong levert de
 * dagdeling anders 89,96 en zou de intervalpoort een dag te vroeg of te laat omslaan. */
function dagenTussen_(vanISO: string, totISO: string): number {
  const a = parseLocalDate(vanISO).getTime();
  const b = parseLocalDate(totISO).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

export interface TestVoorstel {
  /** Maandag van blokweek 1 — de sleutel waarop een afwijzing hangt. */
  blokStart: string;
  /** De voorgestelde testdag. */
  datum: string;
  durMin: number;
  /** De beschikbare minuten op die dag (uit de weekplanner). */
  beschikbaarMin: number;
  laatsteMeting: { bron: GelegenheidBron; datum: string } | null;
  /** Dagen tussen de laatste meting en de voorgestelde testdatum; null als er geen meting is. */
  dagenSinds: number | null;
}

/**
 * Het TESTVOORSTEL voor de getoonde week, of null. Elke poort levert null; de volgorde is
 * goedkoop-eerst en, belangrijker, van "mag het überhaupt" naar "past het".
 */
export function buildTestVoorstel(input: {
  plannerDays: PlannerDay[];
  overrides: OverrideEntry[];
  events: EventItem[];
  activities: ActValuesRow[];
  doel: string | null;
  doelStart: string | null;
  weekMondayISO: string;
  todayISO: string;
}): TestVoorstel | null {
  // (1) Alleen in de RUSTWEEK — tevens de laatste week van het blok. Een test daarbuiten valt
  //     buiten het venster dat de effect-referent meet, of kost een opbouwdag.
  if (blokWeekVanWeek(input.doelStart, input.weekMondayISO) !== BLOK_WEKEN) {
    return null;
  }
  // (2) Onderhoud heeft geen effect-meter (DOELEN-SPEC §3.2) → daar valt niets te testen.
  if (!blokCheckEnabled(input.doel)) return null;

  const blokStart = blokStartVoorWeek(input.doelStart, input.weekMondayISO);
  const blokEind = shiftIso_(blokStart, BLOK_WEKEN * 7);

  // (3) Staat er in dit blok al een test? Dan is er niets aan te bieden.
  for (const ov of input.overrides || []) {
    if (!ov || typeof ov.datum !== "string") continue;
    if (ov.datum < blokStart || ov.datum >= blokEind) continue;
    const o = ov.override as { type?: unknown; workoutType?: unknown } | null;
    if (o?.type === "library" && String(o.workoutType ?? "") === "test") {
      return null;
    }
  }

  // (4) Komt er een A/B-wedstrijd aan? Die IS de meting. Hier telt alleen de DATUM — de wedstrijd
  //     ligt in de toekomst, dus of hij gereden is valt nog niet vast te stellen.
  const horizon = shiftIso_(input.todayISO, WEDSTRIJD_HORIZON_DAGEN);
  for (const ev of input.events || []) {
    if (!ev || typeof ev.datum !== "string") continue;
    if (String(ev.type ?? "") !== "race") continue;
    const p = String(ev.prioriteit ?? "");
    if (p !== "A" && p !== "B") continue;
    if (ev.datum >= input.todayISO && ev.datum <= horizon) return null;
  }

  // (5) Kandidaat-dagen: trainingsdagen met genoeg ruimte, nog te gaan, en nog vrij.
  const bezet = new Set(
    (input.overrides || [])
      .filter((o) => o && typeof o.datum === "string")
      .map((o) => o.datum),
  );
  const kandidaten = (input.plannerDays || []).filter(
    (d) =>
      d &&
      d.train === true &&
      d.dagtype !== "pendel" &&
      (d.minuten ?? 0) >= TEST_MIN_BESCHIKBAAR_MIN &&
      typeof d.datum === "string" &&
      d.datum >= input.todayISO &&
      d.gedaan !== true &&
      !bezet.has(d.datum),
  );
  if (!kandidaten.length) return null;

  // (6) De MEESTE minuten wint (de meeste ruimte voor in- en uitrijden); bij gelijkspel de LAATSTE
  //     datum — zo laat mogelijk in de rustweek betekent zo fris mogelijk aan de test.
  let keuze = kandidaten[0] as PlannerDay;
  for (const d of kandidaten) {
    const meer = (d.minuten ?? 0) > (keuze.minuten ?? 0);
    const gelijkMaarLater =
      (d.minuten ?? 0) === (keuze.minuten ?? 0) && d.datum > keuze.datum;
    if (meer || gelijkMaarLater) keuze = d;
  }

  // (7) Het MEETINTERVAL. Bewust gemeten tot de GEKOZEN TESTDATUM en niet tot de weekmaandag: de
  //     vraag is hoe lang het geleden is op het moment dát je test. Nog nooit een maximum gezien
  //     (laatste === null) → wél aanbieden; dan is er juist niets om op terug te vallen.
  const laatste = laatsteGelegenheid({
    activities: input.activities,
    events: input.events,
    overrides: input.overrides,
    totISO: input.todayISO,
  });
  const dagenSinds = laatste ? dagenTussen_(laatste.datum, keuze.datum) : null;
  if (dagenSinds != null && dagenSinds < TEST_INTERVAL_DAGEN) return null;

  return {
    blokStart,
    datum: keuze.datum,
    durMin: TEST_DUUR_MIN,
    beschikbaarMin: keuze.minuten ?? 0,
    laatsteMeting: laatste,
    dagenSinds,
  };
}
