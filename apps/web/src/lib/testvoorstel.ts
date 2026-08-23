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
//
// MET ÉÉN UITZONDERING SINDS 23-08-2026: `TEST_INTERVAL_DAGEN` is geen vrije beleidswaarde meer
// maar de DAG-UITDRUKKING van M90b, en hij is bovendien een TRAPFUNCTIE van de vierweekse
// openingsperiode. Wie hem wil herzien leest eerst zijn eigen docstring: verschuiven binnen de
// trede 66-84 verandert niets, en één stap eroverheen slaat elke tweede doelblokgrens over.
import { computeMacroPhase } from "@cadans/engine";
import type { EventItem, OverrideEntry, PlannerDay } from "@cadans/shared";
import type { ActValuesRow } from "./activities";
import {
  BLOK_WEKEN,
  blokCheckEnabled,
  blokStartVoorWeek,
  shiftIso_,
} from "./blok";
import { parseLocalDate } from "./dates";
import { laatsteGelegenheid, type MetingBron } from "./effect";

/**
 * De DAG-VLOER onder het ijkaanbod: pas na zoveel dagen sinds de laatste maximale inspanning biedt
 * de coach een test aan. Gemeten tot de GEKOZEN TESTDATUM, niet tot de weekmaandag — zie poort (7).
 *
 * DE BEDOELING (GEPIND `docs/TRAININGSMODEL.md` §13, M90b): één ijkinspanning per DOELBLOK. Een
 * doelblok is `DOEL_BLOK_WEKEN` van twaalf weken, dus 84 dagen, en dat is de waarde hier.
 *
 * WAT ER WERKELIJK BINDT, en dit is de plek waar twee bouwrondes zich op vergist hebben. Sinds
 * poort (1) versmald is liggen de OPENINGEN 84 dagen uit elkaar — één per doelblok — en niet 28.
 * De afstand tussen twee AANBIEDINGEN is daarom `84 + (k − j)` dagen, waarbij j en k de weekdag
 * zijn van de vorige en de volgende gekozen testdag. Poort (6) kiest de ruimste dag van de week,
 * dus die weekdag WOBBELT: `k − j` ligt tussen −6 en +6, en de kortste afstand is 78 dagen.
 *
 * DAARUIT VOLGT DAT 84 TE HOOG IS, en dat is GEMETEN op de gebouwde bron. Elke vloer van 60 t/m 79
 * bedient 21 van de 21 doelblokgrenzen bij zowel een vaste als een wisselende weekvorm; 80 geeft
 * 20 van de 21, 82 geeft 15, en 84 geeft 14 van de 21. De waarde die de bedoeling van M90b
 * uitdrukt ZONDER de grens te blokkeren die zij moet toelaten is `DOEL_BLOK_WEKEN × 7 − 6` = 78:
 * één doelblok minus de breedte van het aanbodvenster.
 *
 * WAAROM ER DAN TOCH 84 STAAT: de bouwronde van 23-08-2026 was op 84 geautoriseerd, en de
 * meetfrequentie is een BELEIDSVRAAG die met Daan wordt herzien en niet door de uitvoerder.
 * De waarde is dus bewust blijven staan, met deze meting ernaast. ROADMAP punt 58 draagt het
 * voorstel om naar 78 te gaan; tot dat besluit kost 84 ongeveer een derde van de doelblokgrenzen
 * bij een wisselende weekvorm.
 *
 * DE GELIJKHEID 84 = 12 × 7 IS EEN SAMENVAL EN GEEN MECHANISME. Schrijf hem niet als reden op — de
 * bindende grootheid is de afstand tussen twee GEKOZEN testdagen, niet die tussen twee grenzen.
 *
 * WAAROM IN ELK GEVAL NIET 90, de vorige waarde: tussen twee doelblokgrenzen liggen 84 dagen, dus
 * een vloer van 90 haalt de volgende grens per constructie NOOIT en slaat elke tweede over.
 * GEMETEN op de gebouwde bron: vloer 90 bedient 11 van de 21 grenzen, vloer 84 bedient er 21 bij
 * een vaste weekvorm en 14 bij een wisselende.
 *
 * BELEID, geen uit data geijkte signaal-drempel — zie de kop van dit bestand.
 */
export const TEST_INTERVAL_DAGEN = 84;
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
  laatsteMeting: { bron: MetingBron; datum: string } | null;
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
  // (1) Alleen in de DOELBLOK-TESTWEEK — week 12 van het twaalfweekse doelblok, de grens waaraan
  //     M90a de ijking hangt (GEPIND `docs/TRAININGSMODEL.md` §13). De engine levert die grootheid
  //     al: `computeMacroPhase(...).isTestWeek`. Geen eigen raster nabouwen, en geen wijziging in
  //     `packages/engine` nodig.
  //
  //     TOT 23-08-2026 STOND HIER DE VIERWEEKSE BLOKWEEK, en die versmalling is de hele ingreep.
  //     GEMETEN waarom (docs/PUNT47-BOUW.md §14 en §16): met de vierweekse poort kreeg 24,1 procent
  //     van de doelblokgrenzen werkelijk een ijking; met deze poort plus de vloer op 84 is dat
  //     100,0 procent bij een vaste weekvorm en 66,7 procent bij een wisselende, over 8421 grenzen
  //     per variant. Over 120 zaden van de wisselende weekvorm: gemiddeld 66,9 procent, minimum
  //     57,1 procent, maximum 76,2 procent.
  //
  //     DE TWEE HELFTEN WERKEN ALLEEN SAMEN, en de tegenproef gaat BEIDE kanten op. Deze poort
  //     alleen, met de oude vloer van 90, haalt ongeveer de helft van de grenzen. En de VLOER
  //     alleen, met de oude vierweekse poort, is niet onschadelijk maar SCHADELIJK: gemeten zakt de
  //     dekking dan van 23,8 procent naar **0 van de 21 grenzen** bij een vaste weekvorm. Wie ooit
  //     deze poort terugdraait en de vloer laat staan, laat de app dus slechter achter dan hij hem
  //     vond.
  //
  //     DE DOELBLOK-TESTWEEK IS PER CONSTRUCTIE OOK EEN VIERWEEKSE OPENING, en dat is bewezen en
  //     niet aangenomen: beide klokken beelden dezelfde absolute weekindex sinds `doelStart` af, de
  //     een modulo 12 en de ander modulo 4, en 11 mod 4 is 3 — blokweek 4. Omdat 4 een deler is van
  //     12 kan dat niet toevallig misgaan. GEMETEN: 86 van de 86 over 1040 weekmaandagen, en 600
  //     van de 600 over zestig verschillende `doelStart`-waarden. Daarom mogen poort (3) en de
  //     afwijs-sleutel hieronder op de VIERWEEKSE klok blijven staan.
  //
  //     ZONDER GELDIGE `doelStart` GEEN AANBOD, en die vroege uitgang is DRAGEND — hij dekt TWEE
  //     gaten die `computeMacroPhase` open laat.
  //     (i) Een ONTBREKENDE startdatum: daar valt die functie terug op `new Date()` — de AMBIENT
  //         KLOK — terwijl dit bestand belooft er geen te hebben (zie de kop).
  //     (ii) Een ONGELDIGE startdatum, en dat is de gevaarlijke. `settings.doel` en `doelStart`
  //         zijn VRIJE TEKST in D1 (zie `normalizeDoel_` in `packages/engine/src/phase.ts`), dus
  //         een bedorven rij komt hier gewoon binnen. `parseLocalDate` geeft dan een `Invalid
  //         Date`, en die is TRUTHY — de vangregel `if (!startDate)` in `computeMacroPhase` vuurt
  //         dus niet. Het dagverschil wordt `NaN`, de blokweek wordt `NaN`, en `NaN <= 4`,
  //         `NaN <= 8` en `NaN <= 11` zijn alle drie onwaar, dus de keten valt door naar de
  //         `else`-tak en levert **`fase: "Test"`, `isTestWeek: true`** — élke week opnieuw.
  //         GEMETEN op `"kapot"`, `""`, `"29-06-2026"` en `"2026/06/29"`: alle vier `isTestWeek`
  //         true. De OUDE poort had dit gat niet: `blokWeekVanWeek` draagt zijn eigen
  //         `Number.isNaN(...)`-vang en geeft dan 1, wat nooit gelijk is aan `BLOK_WEKEN`.
  //         Zonder deze regel zou de app bij één bedorven rij ELKE week de ijkkaart tonen met de
  //         copy "Dit blok loopt af." terwijl er geen blok afloopt — een M55-schending die de
  //         oude poort per constructie niet kon produceren.
  if (!input.doelStart) return null;
  const doelStartDatum = parseLocalDate(input.doelStart);
  if (Number.isNaN(doelStartDatum.getTime())) return null;
  const weekMaandag = parseLocalDate(input.weekMondayISO);
  if (Number.isNaN(weekMaandag.getTime())) return null;
  const macro = computeMacroPhase(doelStartDatum, weekMaandag) as {
    isTestWeek?: boolean;
    week?: number;
  };
  if (macro?.isTestWeek !== true) return null;
  // (2) Onderhoud heeft geen effect-meter (DOELEN-SPEC §3.2) → daar valt niets te testen.
  if (!blokCheckEnabled(input.doel)) return null;

  // DE VIERWEEKSE KLOK BLIJFT STAAN, EN DIT IS WAARVOOR — het stond nergens opgeschreven en twee
  // bouwrondes zijn er bijna op stukgelopen (docs/PUNT47-BOUW.md §9 V1).
  //
  // Hij draagt na de versmalling van poort (1) nog TWEE dingen, allebei over IDENTITEIT en niet
  // over timing. (i) Het onderdrukkings-venster van poort (3) hieronder: staat er in dit vierweekse
  // blok al een test ingepland, dan biedt de app er geen tweede aan. (ii) `blokStart` reist als
  // AFWIJS-SLEUTEL het bestand uit — hij staat in de teruggegeven `TestVoorstel` en wordt gelezen
  // door `SchemaView.tsx` (`isTestVoorstelAfgewezen`) en `TestVoorstelCard.tsx` (`afgewezen.add`).
  // "Niet dit blok" betekent daarmee "niet dit VIERWEEKSE blok".
  //
  // DAT BLIJFT KLOPPEN OMDAT DE SLEUTEL UNIEK IS PER AANBOD. Elke doelblok-testweek valt in zijn
  // eigen vierweekse blok, want twaalf weken zijn precies drie van die blokken. GEMETEN over 260
  // weekmaandagen: 21 doelblok-testweken, 21 UNIEKE afwijs-sleutels, 0 van de 20 opeenvolgende
  // paren deelt er een. Eén afwijzing kan dus nooit twee aanbiedingen onderdrukken.
  //
  // WAT HIJ NIET MEER DRAAGT — en dat is de eerlijke helft. Vóór 23-08-2026 was hij ook de
  // RETRY-klok: miste een aanbod zijn week, dan kwam de volgende opening vier weken later. Na de
  // versmalling is er geen retry meer; een gemiste doelblokgrens wacht twaalf weken. Dat is een
  // BEWUSTE kostenpost en hij staat als ROADMAP punt 55 open, met de gemeten oorzaak van het
  // missen bij punt 58.
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
