/**
 * phase.ts — pure macro-/event-fase-helpers, ported from
 * training/src/Settings.gs (computeMacroPhase, DOEL_OPTIONS) en
 * training/src/Doel.gs (eventFase_, planModeLabel_, taper-consts +
 * de pure pickMainEvent_ die eventFase_ intern gebruikt).
 *
 * bepaalFaseVoorDatum_ / getAllEvents_ (Sheet/Settings-gekoppeld) blijven
 * in GAS — hier alleen de deterministische kern. Byte-identieke logica.
 */
import { stripTime_ } from "./utils";

export const DOEL_OPTIONS = [
  "FTP",
  "Conditie",
  "Korte beklimmingen",
  "Lange beklimmingen",
  "Onderhoud",
];

/**
 * De ENIGE plek waar een doel-string canoniek wordt gemaakt (ROADMAP punt 7,
 * `docs/DOEL-LIJST-RECON.md` §6).
 *
 * WAAROM DIT MOET BESTAAN. `settings.doel` is VRIJE TEKST in D1: de worker valideert hem niet
 * tegen een lijst, dus elke waarde die ooit is opgeslagen komt de engine gewoon binnen —
 * `Beklimmingen` en `VO2max` staan vandaag in Daans database en de UI biedt ze nog aan tot
 * fase B2. De twee consumenten lezen die string bovendien op VERSCHILLENDE hoogte:
 * `buildWorkout` kiest zijn bibliotheek op de RAUWE string, terwijl `profileForDoel_` op het
 * PROFIEL werkt. Zonder één gedeelde normalisatie lopen die twee uiteen — het profiel zou dan
 * wél kloppen terwijl de bibliotheek-dispatch geen tak meer raakt en de dag stil doorvalt naar
 * `genericRecovery`. Geen fout, geen rood, gewoon een herstelrit waar een sleutelsessie hoort.
 *
 * PUUR: geen side-effects, geen klok, geen I/O.
 */
export function normalizeDoel_(doel: any): string {
  if (typeof doel === "string" && DOEL_OPTIONS.indexOf(doel) >= 0) return doel;
  if (doel === "Beklimmingen") return "Korte beklimmingen"; // A-doel, DOELEN-SPEC §3.3
  if (doel === "VO2max") return "FTP"; // vervalt als DOEL, blijft MIDDEL (§3.6)
  return "FTP"; // onbekend, null, "" → de referentie (§3.1)
}

// Taper-venster (dagen tot het event, gemeten VANAF VANDAAG — zie eventFase_):
//   A-event/trip ≤ 7 d → volle taper-week (macro = Taper).
//   B-event      ≤ 3 d → mini-taper (alleen die laatste dagen; macro blijft A/trip).
//   C-event             → nooit taperen.
export const A_TAPER_DAGEN = 7;
export const B_TAPER_DAGEN = 3;
// ROADMAP punt 13 fase A — HET AANTAL DAGEN NA EEN A-RACE WAARIN DE FASE OP RECOVERY STAAT.
//
// HERKOMST: BELEID, geen geijkte drempel. Er staat GEEN A-race in de Cadans-historie, dus er
// bestaat geen reeks om dit op te bemonsteren en er hoort ook GEEN plateau-toets bij: een
// tolerantie of drempel die je niet kunt bemonsteren, ijk je niet — je verantwoordt hem.
//
// Vier gronden staan in `docs/PUNT13-RECON.md` §10; de DRAGENDE is dat een DAGEN-venster de
// herstelduur losmaakt van de WEEKDAG van de race. De oude weekregel gaf een zaterdagrace twee
// dagen herstel en een zondagrace NUL. Een weekregel ("de week erna") verplaatst die willekeur
// alleen: een maandagrace zou dan dertien dagen krijgen. Zeven dagen is één volle
// trainingscyclus, dus elke weekdag komt precies één keer voorbij.
//
// DE CANON IS HIER OPEN: `docs/TRAININGSMODEL.md` kent geen regel over herstel NÁ een event.
// M66 en M72 gaan over inhalen dat wijkt voor herstel, M51 over transities als voorstel, M52
// over wanneer een event het plan overneemt. Dit besluit hoort een nieuwe M-regel te worden.
export const A_HERSTEL_DAGEN = 7;

/**
 * Macrocyclus schema: blokweek 1-4 Base, 5-8 Build, 9-11 Peak, 12 Test.
 *
 * HET BLOK HERHALT — ROADMAP punt 9, norm in `DOELEN-SPEC` §2B. Tot 31 juli 2026 liep de teller
 * DOOD: voorbij week 12 bleef hij voorgoed op "Test" staan. Dat is geen periodisering maar een
 * aflopende teller, en de gevolgschade zat in de planner: `kwaliteitPerWeek` draagt geen
 * `Test`-sleutel, dus quotum 0 en elke week een testweek. Alleen doel Onderhoud ontsnapte, via
 * een apart vangnet in `effectiveMacroFase_`.
 *
 * De blokweek is nu cyclisch 1..12; `blokNr` telt het hoeveelste blok sinds `doelStart`. Loopt
 * een blok af zonder dat er een nieuw doel is gekozen, dan begint gewoon een volgend blok met
 * hetzelfde doel. Een aflopend blok geeft het jaar dus NIET aan het event — de enige
 * overnamegrens is de acht weken uit §2B, en die zit in `effectiveMacroFase_`, niet hier.
 *
 * `week` en `isTestWeek` behouden hun betekenis: de week BINNEN het blok, en of dat de testweek
 * is. Alleen het gedrag voorbij week 12 verandert.
 */
/**
 * DE LENGTE VAN HET DOEL-BLOK, in weken. HERKOMST: PLAN — `DOELEN-SPEC` §2B stelt vast dat het
 * doel-blok TWAALF weken is en HERHAALT.
 *
 * DIT IS GEEN KNOP. De constante bestaat om te voorkomen dat twee functies over dezelfde
 * blok-lengte uiteen kunnen lopen — `computeMacroPhase` hier en `doelTestWeken_` in `niveau.ts`,
 * die vóór de niveaukaart-ronde nog op `settings.doelDuur` rekende en dus kon afwijken. Er is geen
 * tweede waarde en er komt er geen.
 *
 * DE FASE-LADDER (4 / 8 / 11) BLIJFT LITERAL. Die op deze constante betrekken zou een afleiding
 * suggereren die nergens varieert — dode bedrading met een nettere naam.
 */
export const DOEL_BLOK_WEKEN = 12;

export function computeMacroPhase(startDate: any, today: any): any {
  if (!startDate) startDate = new Date();
  if (!today) today = new Date();
  var start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  var now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // ROUND, NIET FLOOR — en dat is geen afrondsmaak maar een DST-correctie. Beide datums zijn
  // LOKALE middernacht, dus hun verschil is altijd n dagen plus of min een uur: precies een uur
  // korter wanneer het venster de zomertijdgrens van eind maart kruist, een uur langer bij de
  // wintertijdgrens van eind oktober. `Math.round` levert dan n; `Math.floor` gooide bij die
  // eerste een hele dag weg, waarna het blok een week te laat kantelde. Dat raakt precies het
  // scenario uit `DOELEN-SPEC` §5: een blok dat in de winter start en na eind maart doorloopt.
  // Dezelfde telling als `phase.ts:149`, `phase.ts:170`, `planner.ts:307` en `niveau.ts:844`.
  var diffDays = Math.round(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  var absWeek = Math.floor(diffDays / 7) + 1;
  if (absWeek < 1) absWeek = 1;
  // Cyclisch 1..DOEL_BLOK_WEKEN. De oude cap `if (week > 12) week = 12` is hiermee overbodig: de
  // blokweek kan per constructie niet meer boven de blok-lengte komen.
  var week = ((absWeek - 1) % DOEL_BLOK_WEKEN) + 1;
  var blokNr = Math.floor((absWeek - 1) / DOEL_BLOK_WEKEN) + 1;

  var fase,
    isTestWeek = false;
  if (week <= 4) fase = "Base";
  else if (week <= 8) fase = "Build";
  else if (week <= 11) fase = "Peak";
  else {
    fase = "Test";
    isTestWeek = true;
  }
  return { week: week, fase: fase, isTestWeek: isTestWeek, blokNr: blokNr };
}

/**
 * Kiest het hoofd-event uit een (gesorteerde) events-lijst: het
 * eerstvolgende event dat prioriteit A heeft OF van type 'trip' is.
 */
export function pickMainEvent_(events: any, fromDate: any): any {
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    var ed = new Date(
      e.datum.getFullYear(),
      e.datum.getMonth(),
      e.datum.getDate(),
    );
    if (ed < fromDate) continue;
    if (e.prioriteit === "A" || e.type === "trip") return e;
  }
  return null;
}

/**
 * Pure event-driven fase-helper — ÉÉN bron van waarheid voor de fase-mapping.
 * Meet ALLES vanaf refDate (= vandaag voor de huidige week; zie
 * bepaalFaseVoorDatum_ voor de ref-keuze), NIET vanaf de week-maandag.
 *
 * macroFase = de periodisering van het A/trip-hoofdevent (Base/Build/Peak),
 * LOS van een taper. taperEvent/taperVenster = de per-dag-taper-overlay:
 *   Recovery: A-RACE die 0..A_HERSTEL_DAGEN (7) DAGEN geleden plaatsvond — een DAGEN-venster,
 *             NIET de kalenderweek (ROADMAP punt 13 fase A).
 *   Taper:    A/trip ≤ A_TAPER_DAGEN (7) d  → taperEvent = hoofd, venster 7;
 *             anders dichtstbijzijnde B met 0..B_TAPER_DAGEN (3) d → venster 3;
 *             C telt nooit. Een near-B drijft de taper maar NIET de macro.
 *   macroFase op wekenTot:  >= 9 Base / >= 5 Build / else Peak.
 *   fase = Recovery > Taper (taperEvent≠null) > macroFase.
 *
 * @param events  array uit getAllEvents_() (Date-datum, prioriteit, type, naam)
 * @param refDate Date — referentie-datum (meestal vandaag)
 * @return { fase, macroFase, hoofdEvent, taperEvent, taperVenster, dagenTot,
 *           wekenTot } of null (geen A/trip-hoofdevent)
 */
export function eventFase_(events: any, refDate: any): any {
  var ref = stripTime_(refDate);

  // ROADMAP punt 13 fase A — RECOVERY IS EEN DAGEN-VENSTER, GEEN KALENDERWEEK.
  //
  // Hiervoor stond hier `ed >= weekStartDate(ref)`, en die ondergrens maakte de herstelduur een
  // functie van de WEEKDAG van de race: GEMETEN gaf een zaterdagrace twee dagen herstel en een
  // zondagrace NUL — op 2027-04-19, twee dagen na 240 km met 2960 hoogtemeters, stond er een
  // volle Peak-week met TSS 262 en VO2 Hill Repeats 9x90s. Zie `docs/PUNT13-RECON.md` §2 en §4.
  //
  // `Math.round` en NIET `Math.floor` op het dagverschil. Dat is geen afrondsmaak maar de
  // DST-CORRECTIE die `computeMacroPhase` en drie andere plekken in deze repo al dragen: beide
  // datums zijn LOKALE MIDDERNACHT, dus hun verschil is n dagen plus of min een uur zodra het
  // venster een zomer- of wintertijdgrens kruist. Met floor zou 6 dagen en 23 uur als 6 lezen.
  //
  // TYPE EN PRIORITEIT BINDEN ONVERANDERD. Een trip krijgt bewust GEEN herstel: een event draagt
  // precies één datum, dus N dagen na een meerdaagse meet vanaf de STARTdag en het venster
  // verloopt vóór de trip afgelopen is. Dat is ROADMAP punt 35.
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    var ed = stripTime_(e.datum);
    var dagenSinds = Math.round((ref.getTime() - ed.getTime()) / 86400000);
    if (
      e.prioriteit === "A" &&
      e.type === "race" &&
      dagenSinds >= 0 &&
      dagenSinds <= A_HERSTEL_DAGEN
    ) {
      return {
        fase: "Recovery",
        macroFase: "Recovery",
        hoofdEvent: e,
        taperEvent: null,
        taperVenster: 0,
        dagenTot: 0,
        wekenTot: 0,
      };
    }
  }

  // Hoofd-event = eerstvolgende A-event of trip → drijft de macro.
  var hoofd = pickMainEvent_(events, ref);
  if (!hoofd) return null;

  var hed = stripTime_(hoofd.datum);
  var dagenTot = Math.round((hed.getTime() - ref.getTime()) / 86400000);
  var wekenTot = Math.ceil(dagenTot / 7);

  var macroFase;
  if (wekenTot >= 9) macroFase = "Base";
  else if (wekenTot >= 5) macroFase = "Build";
  else macroFase = "Peak";

  // Taper-overlay: A/trip-venster (7) gaat vóór een near-B-venster (3); C nooit.
  var taperEvent = null,
    taperVenster = 0;
  if (dagenTot <= A_TAPER_DAGEN) {
    taperEvent = hoofd;
    taperVenster = A_TAPER_DAGEN;
  } else {
    var besteB = null,
      besteBd = null;
    for (var j = 0; j < events.length; j++) {
      var b = events[j];
      if (b.prioriteit !== "B") continue;
      var bd = Math.round(
        (stripTime_(b.datum).getTime() - ref.getTime()) / 86400000,
      );
      if (
        bd >= 0 &&
        bd <= B_TAPER_DAGEN &&
        (besteBd === null || bd < besteBd)
      ) {
        besteB = b;
        besteBd = bd;
      }
    }
    if (besteB) {
      taperEvent = besteB;
      taperVenster = B_TAPER_DAGEN;
    }
  }

  var fase = taperEvent ? "Taper" : macroFase;

  return {
    fase: fase,
    macroFase: macroFase,
    hoofdEvent: hoofd,
    taperEvent: taperEvent,
    taperVenster: taperVenster,
    dagenTot: dagenTot,
    wekenTot: wekenTot,
  };
}

// Plan-card mode-label. Onderhoud-DOEL wint (hoogste prioriteit); anders de bestaande
// event/maintain-logica ongewijzigd (4 doelen byte-identiek). PUUR — display-only.
export function planModeLabel_(settings: any, macro: any): any {
  if (settings && settings.doel === "Onderhoud") return "Onderhoud";
  return macro.eventDriven
    ? "Doel-gericht"
    : settings.fase === "maintain"
      ? "Onderhoud"
      : "Opbouw";
}
