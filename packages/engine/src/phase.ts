/**
 * phase.ts — pure macro-/event-fase-helpers, ported from
 * training/src/Settings.gs (computeMacroPhase, DOEL_OPTIONS) en
 * training/src/Doel.gs (eventFase_, planModeLabel_, taper-consts +
 * de pure pickMainEvent_ die eventFase_ intern gebruikt).
 *
 * bepaalFaseVoorDatum_ / getAllEvents_ (Sheet/Settings-gekoppeld) blijven
 * in GAS — hier alleen de deterministische kern. Byte-identieke logica.
 */
import { stripTime_, weekStartDate } from "./utils";

export const DOEL_OPTIONS = [
  "FTP",
  "Conditie",
  "Beklimmingen",
  "VO2max",
  "Onderhoud",
];

// Taper-venster (dagen tot het event, gemeten VANAF VANDAAG — zie eventFase_):
//   A-event/trip ≤ 7 d → volle taper-week (macro = Taper).
//   B-event      ≤ 3 d → mini-taper (alleen die laatste dagen; macro blijft A/trip).
//   C-event             → nooit taperen.
export const A_TAPER_DAGEN = 7;
export const B_TAPER_DAGEN = 3;

/**
 * Macrocyclus schema: weken 1-4 Base, 5-8 Build, 9-11 Peak, 12 Test.
 * Voorbij week 12 → blijft op Test.
 */
export function computeMacroPhase(startDate: any, today: any): any {
  if (!startDate) startDate = new Date();
  if (!today) today = new Date();
  var start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  var now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  var week = Math.floor(diffDays / 7) + 1;
  if (week < 1) week = 1;

  var fase,
    isTestWeek = false;
  if (week <= 4) fase = "Base";
  else if (week <= 8) fase = "Build";
  else if (week <= 11) fase = "Peak";
  else {
    fase = "Test";
    isTestWeek = true;
  }
  if (week > 12) week = 12;
  return { week: week, fase: fase, isTestWeek: isTestWeek };
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
 *   Recovery: A-RACE die deze week (maandag..refDate) al plaatsvond.
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

  // Recovery: A-race die deze week (maandag..ref) al geweest is.
  var wkMon = weekStartDate(ref);
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    var ed = stripTime_(e.datum);
    if (
      e.prioriteit === "A" &&
      e.type === "race" &&
      ed.getTime() >= wkMon.getTime() &&
      ed.getTime() <= ref.getTime()
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
