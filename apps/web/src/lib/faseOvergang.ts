import {
  computeMacroPhase,
  effectiveMacroFase_,
  eventFase_,
  stripTime_,
} from "@cadans/engine";
import type { EventItem, SettingsInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// M51/M10 (open kant van T14) — de fase-overgang AANKONDIGEN op de week dat hij gebeurt. Het plan
// kantelt nu stil van fase naar fase (en van doel-gedreven naar event-gedreven); dit maakt dat ene
// moment expliciet. CLIENT-ONLY, geen persistentie: hetzelfde wat-als-idioom als de inhaal-/fatigue-
// kaart — we draaien de fase-keten die buildWeekProposal al doet een TWEEDE keer op today − 7 dagen
// en vergelijken. We vergelijken op de TOONBARE fase (macro?.fase ?? macroFase), niet op macroFase:
// de taper leeft alléén daar en is juist de belangrijkste overgang.

export interface FaseOvergang {
  van: string; // toonbare fase vorige week
  naar: string; // toonbare fase deze week
  eventNaam: string | null;
  wekenTotEvent: number | null;
}

export interface FaseBundel {
  fase: string; // toonbare fase = macro?.fase ?? effectieve macroFase
  eventDriven: boolean;
  eventNaam: string | null;
  wekenTotEvent: number | null;
}

/** De EXACTE fase-keten uit buildWeekProposal, herbruikbaar op een willekeurige `today`:
 * eventFase_ → macroFase (computeMacroPhase-fallback) → effectiveMacroFase_(eventDriven = macro!=null)
 * → toonbare fase (macro?.fase ?? macroFase). settingsE.doelStart is een Date (of null), eventsD
 * dragen Date-datums — beide al geconverteerd door de caller. */
function faseVoor_(
  settingsE: { doelStart: Date | null; doel: string | null },
  eventsD: Array<{ datum: Date }>,
  today: Date,
): FaseBundel {
  const macro = eventFase_(eventsD, today);
  const macroFaseBase =
    macro?.macroFase ?? computeMacroPhase(settingsE.doelStart, today).fase;
  const macroFase = effectiveMacroFase_(
    macroFaseBase,
    settingsE,
    macro != null,
  );
  return {
    fase: (macro?.fase as string | undefined) ?? macroFase,
    eventDriven: macro != null,
    eventNaam: (macro?.hoofdEvent?.naam as string | undefined) ?? null,
    wekenTotEvent: typeof macro?.wekenTot === "number" ? macro.wekenTot : null,
  };
}

/** Publieke, testbare seam: de fase-bundel voor één `today` (converteert settings/events zelf). */
export function faseBundelVoor_(
  settings: SettingsInput,
  events: EventItem[],
  todayISO: string,
): FaseBundel {
  const settingsE = {
    ...settings,
    doelStart: settings.doelStart ? parseLocalDate(settings.doelStart) : null,
  };
  const eventsD = (events || []).map((e) => ({
    ...e,
    datum: parseLocalDate(e.datum),
  }));
  return faseVoor_(settingsE, eventsD, stripTime_(parseLocalDate(todayISO)));
}

/**
 * Detecteert of DEZE week een fase-overgang is t.o.v. vorige week (today − 7). Geen verschil in de
 * toonbare fase → null. Er is maar ÉÉN soort overgang: "event_overname" (plan wisselt van doel- naar
 * event-gedreven) kan NIET door tijdsverloop ontstaan — pickMainEvent_ slaat events vóór de
 * referentiedatum over, dus de kandidatenlijst van vorige week is altijd een superset van die van
 * deze week; dat moment hoort bij het INVOEREN van een event (Events-pagina), niet bij een weekgrens.
 * Een wissel NAAR "Test" wordt onderdrukt (→ null): die fase is een tellerartefact (computeMacroPhase
 * blijft na blokweek 12 voorgoed op Test), geen geplande meting — aankondigen zou een valse belofte zijn.
 */
export function detectFaseOvergang(
  settings: SettingsInput,
  events: EventItem[],
  todayISO: string,
): FaseOvergang | null {
  const today = stripTime_(parseLocalDate(todayISO));
  const vorigeDatum = new Date(today);
  vorigeDatum.setDate(today.getDate() - 7);
  const vorigeISO = formatVorigeISO_(vorigeDatum);

  const nu = faseBundelVoor_(settings, events, todayISO);
  const prev = faseBundelVoor_(settings, events, vorigeISO);

  if (nu.fase === prev.fase) return null;
  if (nu.fase === "Test") return null;

  return {
    van: prev.fase,
    naar: nu.fase,
    eventNaam: nu.eventNaam,
    wekenTotEvent: nu.wekenTotEvent,
  };
}

/** Date → yyyy-MM-dd (lokaal), zodat de vorige-week-run door dezelfde faseBundelVoor_-seam loopt. */
function formatVorigeISO_(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
