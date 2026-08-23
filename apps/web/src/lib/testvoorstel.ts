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
// MET ÉÉN UITZONDERING SINDS 23-08-2026: `TEST_INTERVAL_DAGEN` is geen vrije beleidswaarde meer.
// Hij is AFGELEID uit de meetkunde van poort (1) en bewaakt sindsdien niet de frequentie — dat doet
// poort (1) — maar alleen de nabijheid van een reeds gedane maximale inspanning. Wie hem wil
// herzien leest eerst zijn eigen docstring: één dag hoger onderdrukt al natuurlijke openingen.
import { computeMacroPhase, DOEL_BLOK_WEKEN } from "@cadans/engine";
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

/** Week 1 van het twaalfweekse doelblok — de OPENING, waar poort (1) op staat (M92). Een constante
 * omdat de literal `1` in een vergelijking met `macro.week` niet leesbaar is. */
const DOELBLOK_OPENINGSWEEK = 1;

/** De breedte van het aanbodvenster in dagen: poort (1) laat één weekmaandag door en poort (5)
 * kandideert de zeven dagen van die week. Voedt de afleiding van `TEST_INTERVAL_DAGEN`. */
const AANBODVENSTER_DAGEN = 7;

/**
 * De DAG-VLOER onder het ijkaanbod: pas na zoveel dagen sinds de laatste maximale inspanning biedt
 * de coach een test aan. Gemeten tot de GEKOZEN TESTDATUM, niet tot de weekmaandag — zie poort (7).
 *
 * WAT DEZE VLOER SINDS 23-08-2026 NOG WÉL EN NIET MEER DOET, en dat onderscheid draagt de waarde.
 * De FREQUENTIE wordt niet meer door hem bewaakt maar door poort (1): die laat per constructie
 * hoogstens één aanbod per doelblok door, en dat IS M90b. Wat de vloer nog draagt is uitsluitend de
 * NABIJHEID van een reeds gedane maximale inspanning — een gereden A/B-wedstrijd, een eerder
 * geplande test, of een sprong in de reeks. Ligt zo'n inspanning kort vóór de opening, dan is de
 * drempel vers en vervalt het aanbod zonder vraag (M92).
 *
 * DE AFLEIDING, en zij rust op de GEMETEN meetkunde van de nieuwe poort en niet op 12 × 7.
 * Openingsmaandagen liggen `DOEL_BLOK_WEKEN * 7` = 84 dagen uit elkaar — gemeten over 260
 * weekmaandagen: 22 openingen, afstand telkens exact 84. **Dat geldt alleen ná `doelStart`, en
 * poort (1b) is wat het waar maakt:** `computeMacroPhase` klemt zijn weekteller, dus vóór
 * `doelStart` liggen de "openingen" zeven dagen uit elkaar. Maar de vloer meet tussen twee GEKOZEN
 * testdagen, en poort (6) kiest de ruimste dag BINNEN de openingsweek. Die weekdag wobbelt, dus de
 * afstand tussen twee aanbiedingen is `84 + (k − j)` met j en k in 0..6. GEMETEN over 840 gaten bij
 * een wisselende weekvorm: minimum 78, maximum 90, gemiddeld 84,0.
 *
 * DE EIS is dat een NATUURLIJKE, doorrollende opening nooit wordt onderdrukt, en daarbinnen zo hoog
 * mogelijk. De harde bovengrens is dus 78. GEMETEN vloer-sweep onder deze poort: 60 t/m 78 bedienen
 * 440 van de 440 openingen bij een wisselende weekvorm; 79 zakt naar 426 (96,8 procent), 80 naar
 * 415, 82 naar 355 en 84 naar 293.
 *
 * DE MARGE IS ÉÉN DAG EN ZIJ IS STRUCTUREEL, geen slag om de arm. De bovengrens 78 komt uit
 * `84 − 6`, en die 6 is het EXTREMUM van de weekdag-verschuiving — de waarde die precies één keer
 * per zeven voorkomt. Deze constante rekent met de VENSTERBREEDTE zelf: `DOEL_BLOK_WEKEN * 7 −
 * AANBODVENSTER_DAGEN` = 84 − 7 = 77. Daarmee hangt de waarde aan een structurele grootheid (het
 * venster is zeven dagen) in plaats van aan een randgeval, en zij blijft geldig als de dagkeuze
 * binnen dat venster ooit verandert. Op de meting kost die ene dag niets: 77 en 78 bedienen allebei
 * 440 van de 440.
 *
 * SCHRIJF `84 = 12 × 7` NIET ALS REDEN OP — dat is een samenval, geen mechanisme; de bindende
 * grootheid is de afstand tussen twee GEKOZEN testdagen. En `ceil(vloer / 28)` gold alleen vóór de
 * versmalling van 23-08-2026, toen openingen nog 28 dagen uit elkaar lagen.
 *
 * BELEID, geen uit data geijkte signaal-drempel — zie de kop van dit bestand.
 */
export const TEST_INTERVAL_DAGEN = DOEL_BLOK_WEKEN * 7 - AANBODVENSTER_DAGEN;
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
 * ROADMAP punt 59 — de OPENINGSMAANDAG van het doelblok waarin deze week valt, of null.
 *
 * WAAROM DIT EEN EIGEN FUNCTIE IS EN GEEN `blokStartVoorWeek`-AANROEP. Dat was mijn eerste versie
 * en zij is in de weerleggingspas van 23-08-2026 onderuit gegaan: `blokStartVoorWeek` rijdt de
 * VIERWEEKSE mesoteller (`blokWeekVanWeek`, modulo `BLOK_WEKEN`), niet het twaalfweekse doelblok.
 * In de OPENINGSWEEK vallen die twee samen — de opening is per constructie ook blokweek 1 — en
 * precies daardoor zag geen enkele test het verschil. GEMETEN: de bevestigde staat gold alleen in
 * doelblokweek 1 t/m 4, viel in week 5 t/m 8 helemaal weg, en kwam daarna terug als een generieke
 * leeftijdsregel zonder de bevestiging erin. Twee derde van het blok zonder de zichtbaarheid die
 * M91 juist vraagt.
 *
 * De grootheid komt uit de engine: `computeMacroPhase(...).week` is 1..12, dus de opening ligt
 * `(week - 1)` weken terug. Zelfde vroege uitgangen als poort (1) en (1b): geen `doelStart`, geen
 * geldige datum, of een week vóór `doelStart` levert null — daar bestaat geen lopend doelblok.
 */
export function doelblokOpeningVoorWeek(
  doelStartISO: string | null,
  weekMondayISO: string,
): string | null {
  if (!doelStartISO) return null;
  const start = parseLocalDate(doelStartISO);
  const week = parseLocalDate(weekMondayISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(week.getTime()))
    return null;
  if (week.getTime() < start.getTime()) return null;
  const macro = computeMacroPhase(start, week) as { week?: number };
  const w = macro?.week;
  if (typeof w !== "number" || !Number.isFinite(w)) return null;
  return shiftIso_(weekMondayISO, -(w - 1) * 7);
}

/** ROADMAP punt 59 — de staat van de DREMPELWAARDE, los van of er een aanbod staat. */
export interface IjkStatus {
  /** Is de staande waarde BEVESTIGD in plaats van gemeten? Alleen waar na een bevestiging. */
  bevestigd: boolean;
  /** Is de waarde ONGEIJKT — geen meting én geen bevestiging voor het lopende doelblok (M91)? */
  ongeijkt: boolean;
  /** De laatste ECHTE maximale inspanning (test of gereden A/B-wedstrijd), of null. */
  laatsteMeting: { bron: MetingBron; datum: string } | null;
  /** Hoeveel VOLLE doelblokken de drempelwaarde oud is, of null als er nooit gemeten is. */
  blokkenOud: number | null;
}

/**
 * ROADMAP punt 59, besluit vier: een bevestiging is GEEN meting, en de app maakt zichtbaar wanneer
 * de drempelwaarde meerdere blokken oud is.
 *
 * DE TELLER VRAAGT GEEN EIGEN OPSLAG, en dat is opzet. Het aantal opeenvolgende bevestigingen is
 * niet de grootheid die iets zegt — de LEEFTIJD van de drempel is dat. Die volgt uit
 * `laatsteGelegenheid` met de sprong uitgesloten: dagen sinds de laatste ECHTE maximale inspanning,
 * gedeeld door de doelbloklengte. Dat telt bovendien óók de blokken waarin de gebruiker niets heeft
 * geantwoord, en die zijn net zo goed ongemeten. Zie `docs/PUNT47-BOUW.md` §29.
 *
 * SPRONGEN TELLEN HIER NIET MEE, om dezelfde reden als in poort (7): `rolling_ftp` is een proxy en
 * een proxy vervangt de ijking niet (M91).
 */
export function ijkStatus(input: {
  activities: ActValuesRow[];
  events: EventItem[];
  overrides: OverrideEntry[];
  todayISO: string;
  /** Het antwoord uit `sync_state.ijking_antwoord`, of null. */
  ijkingAntwoord?: "bevestigd" | "niet_nu" | null;
  /** De openingsmaandag waarvoor dat antwoord geldt, of null. */
  ijkingBeantwoordBlok?: string | null;
  /** De openingsmaandag van het LOPENDE doelblok, of null als die niet te bepalen is. */
  huidigeOpening?: string | null;
}): IjkStatus {
  const laatste = laatsteGelegenheid({
    activities: input.activities,
    events: input.events,
    overrides: input.overrides,
    totISO: input.todayISO,
    negeerSprong: true,
  });
  const dagen = laatste ? dagenTussen_(laatste.datum, input.todayISO) : null;
  const blokkenOud =
    dagen == null ? null : Math.floor(dagen / (DOEL_BLOK_WEKEN * 7));
  // Het antwoord telt alleen voor het blok waarvoor het gegeven is. Staat het op een OUDERE
  // opening, dan zegt het niets over de staande waarde van vandaag.
  const geldt =
    input.ijkingBeantwoordBlok != null &&
    input.huidigeOpening != null &&
    input.ijkingBeantwoordBlok === input.huidigeOpening;
  return {
    bevestigd: geldt && input.ijkingAntwoord === "bevestigd",
    ongeijkt: geldt && input.ijkingAntwoord === "niet_nu",
    laatsteMeting: laatste,
    blokkenOud,
  };
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
  /**
   * ROADMAP punt 59 — de OPENINGSMAANDAG waarvoor het ijkaanbod al beantwoord is (bevestigd of
   * niet-nu), uit `sync_state.ijking_blok`. Weggelaten of null → nog niet beantwoord.
   *
   * DIT VERVING EEN VLUCHTIGE MODULE-SET. Tot 23-08-2026 leefde de afwijzing in een `Set` in
   * `TestVoorstelCard.tsx` die een remount overleefde maar geen app-herstart; na een herstart stond
   * dezelfde vraag er weer, terwijl M92 zegt dat er per opening HOOGSTENS ÉÉN aanbod is. De poort
   * staat nu in deze PURE laag en is daarmee toetsbaar zonder DOM.
   */
  ijkingBeantwoordBlok?: string | null;
}): TestVoorstel | null {
  // (1) Alleen in de DOELBLOK-OPENING — week 1 van het twaalfweekse doelblok. De engine levert die
  //     grootheid al: `computeMacroPhase(...).week`. Geen eigen raster nabouwen, en geen wijziging
  //     in `packages/engine` nodig.
  //
  //     WAAROM DE OPENING EN NIET HET EINDE (GEPIND `docs/TRAININGSMODEL.md` §13, M92 — die
  //     vervangt M90a op het punt van de plaatsing). De drempelwaarde doet zijn werk VOORUIT: elke
  //     zonegrens en elke dosis van de komende twaalf weken hangt eraan. Een ijking aan het EINDE
  //     meet een blok af dat voorbij is, en bij een DOELWISSEL meet zij zelfs het verkeerde doel af
  //     terwijl het nieuwe blok twaalf weken lang op een onbevestigde waarde doseert. Bij een
  //     doorrollend blok vallen opening en einde samen en verandert er niets; het verschil bestaat
  //     precies bij de wissel, en dat is het geval dat telt.
  //
  //     GEMETEN (docs/PUNT47-BOUW.md §19). Een doelwissel zet `doelStart` via `blokStartBijDoel` op
  //     een verse maandag, en dat IS week 1. Onder de oude poort leverde die wisselweek GEEN aanbod
  //     — die eiste week 12 — en onder deze poort wél, mits de vorige maximale inspanning ver
  //     genoeg weg ligt. Op ÉÉN noemer gemeten, de 440 doelblok-openingen: de oude poort dekte er
  //     277 (63,0 procent) bij een gemiddelde wachttijd van 127,5 dagen, deze poort dekt er 440
  //     (100,0 procent) bij 84,0 dagen. Vergelijk niet met de eerder gerapporteerde 66,0 procent:
  //     die telde week-12-maandagen en dus een ANDERE gebeurtenissenverzameling.
  //
  //     DE OPENINGSWEEK IS PER CONSTRUCTIE VIERWEEKSE BLOKWEEK 1, en dat is bewezen en niet
  //     aangenomen: beide klokken beelden dezelfde absolute weekindex sinds `doelStart` af, de een
  //     modulo 12 en de ander modulo 4. Week 1 is index ≡ 0 (mod 12), en 0 mod 4 is 0 — blokweek 1.
  //     Omdat 4 een deler is van 12 kan dat niet toevallig misgaan. Daarom mogen poort (3) en de
  //     afwijs-sleutel hieronder op de VIERWEEKSE klok blijven staan; GEMETEN: 22 aanbiedingen
  //     leverden 22 UNIEKE afwijs-sleutels, alle in blokweek 1.
  //
  //     ZONDER GELDIGE `doelStart` GEEN AANBOD, en die vroege uitgang is DRAGEND — hij dekt TWEE
  //     van de DRIE gaten die `computeMacroPhase` open laat. Het derde, de geklemde weekteller,
  //     staat als poort (1b) hieronder.
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
  // (1b) DE WEEK MAG NIET VÓÓR `doelStart` LIGGEN, en deze regel is het derde gat dat
  //      `computeMacroPhase` openlaat — het gevaarlijkste van de drie, want de VERHUIZING van
  //      poort (1) maakt hem pas schadelijk.
  //
  //      `computeMacroPhase` KLEMT zijn absolute weekteller: `if (absWeek < 1) absWeek = 1;`
  //      (`packages/engine/src/phase.ts`). Elke weekmaandag op of vóór `doelStart` leest daardoor
  //      week 1 — precies de waarde waar deze poort op staat. De OUDE poort stond daar per
  //      constructie dicht: geklemde weken geven `fase: "Base"` en `isTestWeek: false`, en die
  //      eiste week 12.
  //
  //      DE ROUTE ERHEEN IS ONTWORPEN GEDRAG EN GEEN EXOTISCHE RAND. `blokStartBijDoel`
  //      (`apps/web/src/lib/settings.ts`) legt de nieuwe `doelStart` op de VOLGENDE maandag zodra
  //      de doelwissel op donderdag t/m zondag valt — vier van de zeven dagen — en de app rendert
  //      altijd de HUIDIGE week. Zonder deze regel kreeg de gebruiker dan TWEE ijkaanbiedingen,
  //      zeven dagen uit elkaar, met VERSCHILLENDE afwijs-sleutels, zodat een "niet dit blok" op de
  //      eerste de tweede niet onderdrukt. GEMETEN vóór de reparatie, met een ruime week en zonder
  //      meethistorie: over weekindex −26 t/m 26 vuurde de poort 29 keer, waarvan **26 buiten een
  //      echte opening**. Bij een `doelStart` die geen maandag is vuurden drie opeenvolgende
  //      maandagen.
  //
  //      DEZE REGEL MAAKT DE AFLEIDING VAN `TEST_INTERVAL_DAGEN` PAS WAAR. "Openingsmaandagen
  //      liggen 84 dagen uit elkaar" geldt alleen ná `doelStart`; in de geklemde regio liggen ze
  //      zeven dagen uit elkaar en zou geen enkele vloer boven zeven ze doorlaten.
  //
  //      VERGELIJK DE GEPARSEERDE DATUMS EN NIET DE STRINGS. Elders in dit bestand mag dat wél —
  //      poort (3) vergelijkt `ov.datum` lexicografisch — maar daar zijn beide kanten canoniek
  //      `yyyy-MM-dd`. `doelStart` is VRIJE TEKST, en `parseLocalDate` accepteert ook vormen als
  //      `2026/06/29`; die leest lexicografisch GROTER dan elke `yyyy-MM-dd` omdat `/` na `-` komt
  //      in ASCII, waardoor een string-vergelijking elke week zou blokkeren. Er staat een test op.
  if (weekMaandag.getTime() < doelStartDatum.getTime()) return null;
  const macro = computeMacroPhase(doelStartDatum, weekMaandag) as {
    isTestWeek?: boolean;
    week?: number;
  };
  if (macro?.week !== DOELBLOK_OPENINGSWEEK) return null;
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
  // DAT BLIJFT KLOPPEN OMDAT DE SLEUTEL UNIEK IS PER AANBOD. Elke doelblok-OPENING valt in zijn
  // eigen vierweekse blok, want twaalf weken zijn precies drie van die blokken. GEMETEN over 260
  // weekmaandagen: 22 openingen, 22 UNIEKE afwijs-sleutels, geen enkel paar deelt er een. Eén
  // afwijzing kan dus nooit twee aanbiedingen onderdrukken.
  //
  // HET VENSTER VAN POORT (3) IS DOOR DE VERHUIZING VAN RICHTING VERANDERD, EN DAT KOST IETS.
  // De openingsweek is vierweekse blokweek 1, dus het venster loopt VOORUIT: `[opening,
  // opening + 28)`. Vóór 23-08-2026 lag het aanbod in blokweek 4 en keek het venster drie weken
  // TERUG.
  //
  // GEVOLG, en het is een gemeten REGRESSIE: een test die kort VÓÓR de opening is ingepland en nog
  // NIET gereden is, valt buiten het venster en wordt niet meer onderdrukt. Poort (7) ziet hem
  // evenmin, want `laatsteGelegenheid` telt alleen wat GEREDEN is. GEMETEN op de gebouwde bron: een
  // test ingepland 5 of 10 dagen vóór de opening en niet gereden levert een TWEEDE aanbod; dezelfde
  // test wél gereden wordt correct onderdrukt, en een test 2 dagen ná de opening ook.
  //
  // GEREPAREERD 23-08-2026 (ROADMAP punt 62, en het BESLUIT dat eronder ligt: per doelblok-opening
  // bestaat HOOGSTENS ÉÉN aanbod). Het venster is VERBREED naar `[blokStart − 21, blokStart + 28)`.
  // GEMETEN vóór de reparatie: een test die 5 of 10 dagen vóór de opening was ingepland en NIET
  // gereden, ontsnapte aan poort (3) én aan poort (7), en de app bood een TWEEDE test aan.
  //
  // WAAROM VERBREDEN EN NIET VERSCHUIVEN, en dit is een CORRECTIE OP MIJN EIGEN EERSTE VERSIE.
  // Die zette het venster op `[blokStart − 21, blokStart + 7)` — vier weken die eindigen met de
  // aanbodweek, "dezelfde span, alleen de richting klopt weer". De weerleggingspas van 23-08-2026
  // haalde dat onderuit en had gelijk: dat is geen correctie maar een ROTATIE. GEMETEN op de
  // gebouwde bron, 20 ketens × 260 weken: een niet-gereden test 14 dagen ná elke opening werd door
  // het oude venster onderdrukt (0 aanbiedingen op 440 openingen) en door het geroteerde venster
  // NIET meer (440 op 440). Een blinde vlek ingeruild voor een andere. Het BESLUIT zegt dat een
  // geplande-maar-niet-gereden test ROND DEZELFDE OPENING een nieuw aanbod onderdrukt, en weken 2
  // t/m 4 van het doelblok liggen daar net zo goed in als de drie weken ervoor. Het venster is
  // daarom strikt ADDITIEF: de oude `[blokStart, blokStart + 28)` plus de aanloop van 21 dagen.
  // Niets dat vóór 23-08-2026 werd onderdrukt, wordt dat nu niet meer.
  //
  // WAAROM NIET HET HELE DOELBLOK ALS VENSTER, want dat lag voor de hand. Dan zou een GEACCEPTEERDE
  // en gereden test van de vorige opening — die 84 dagen terug ligt — binnen het venster van de
  // volgende vallen en die opening onderdrukken, terwijl poort (7) hem juist correct doorlaat.
  // GEMETEN: met een venster van 84 dagen zakt de dekking terug. Vier weken eindigend met de
  // aanbodweek is het smalste venster dat het gemeten gat dicht.
  //
  // WAT HIJ NIET MEER DRAAGT — en dat is de eerlijke helft. Vóór 23-08-2026 was hij ook de
  // RETRY-klok: miste een aanbod zijn week, dan kwam de volgende opening vier weken later. Sinds de
  // versmalling is er geen retry meer, en per BESLUIT van 23-08-2026 komt die ook niet terug: een
  // gemiste opening wacht tot het volgende doelblok, en de gebruiker kan een testinspanning altijd
  // zelf inplannen. De tegenhanger van dat besluit staat wél open — is er niet geijkt, dan hoort de
  // app dat te ZEGGEN (M91), en dat is ROADMAP punt 59.
  const blokStart = blokStartVoorWeek(input.doelStart, input.weekMondayISO);
  // Het venster van poort (3): de aanloop van drie weken PLUS de vier weken vanaf de opening.
  // `blokStart` blijft ongemoeid als afwijs-sleutel — die twee waren tot 23-08-2026 dezelfde
  // grootheid en dat is precies waarom de aanloop stilzwijgend wegviel toen het aanbod verhuisde.
  const vensterStart = shiftIso_(blokStart, -(BLOK_WEKEN - 1) * 7);
  const vensterEind = shiftIso_(blokStart, BLOK_WEKEN * 7);

  // (2b) IS DEZE OPENING AL BEANTWOORD? Bevestigen en niet-nu onderdrukken allebei het aanbod voor
  //      dit doelblok; het verschil zit in wat de app erover VERTELT (`ijkStatus` hieronder), niet
  //      in of de vraag terugkomt. Per M92 bestaat er hoogstens één aanbod per opening.
  if (
    input.ijkingBeantwoordBlok != null &&
    input.ijkingBeantwoordBlok === blokStart
  ) {
    return null;
  }

  // (3) Staat er rond deze opening al een test? Dan is er niets aan te bieden.
  for (const ov of input.overrides || []) {
    if (!ov || typeof ov.datum !== "string") continue;
    if (ov.datum < vensterStart || ov.datum >= vensterEind) continue;
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
  //
  //     `negeerSprong: true` SINDS 23-08-2026, en dat is M91 (GEPIND `docs/TRAININGSMODEL.md` §13):
  //     een proxy mag het ijkaanbod niet onderdrukken. `rolling_ftp` is intervals' eigen schatting
  //     van de drempel; een sprong daarin toont dát er hard gereden is en niet WELKE waarde dit
  //     blok moet doseren — en juist die waarde is het onderwerp van de ijking. GEMETEN vóór de
  //     ingreep: 162 van de 440 openingen (36,8 procent) werd onderdrukt door een sprong alleen.
  //     De sprong blijft INFORMANT: `buildBlokReferent` in `blok.ts` leest dezelfde functie ZONDER
  //     de vlag en noemt hem in de terugblik-copy.
  const laatste = laatsteGelegenheid({
    activities: input.activities,
    events: input.events,
    overrides: input.overrides,
    totISO: input.todayISO,
    negeerSprong: true,
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
