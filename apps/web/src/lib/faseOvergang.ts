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

export type FaseOvergangSoort = "event_overname" | "fase_wissel";

export interface FaseOvergang {
  soort: FaseOvergangSoort;
  van: string; // toonbare fase vorige week
  naar: string; // toonbare fase deze week
  eventNaam: string | null;
  wekenTotEvent: number | null;
}

interface FaseBundel {
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

/**
 * Detecteert of DEZE week een fase-overgang is t.o.v. vorige week (today − 7). Geen verschil in de
 * toonbare fase → null. Anders: soort = "event_overname" als vorige week GÉÉN event-gedreven fase
 * was en nu wél (het plan werkt vanaf nu naar het event toe — het grotere nieuws), anders
 * "fase_wissel". Gelden beide, dan wint event_overname.
 */
export function detectFaseOvergang(
  settings: SettingsInput,
  events: EventItem[],
  todayISO: string,
): FaseOvergang | null {
  const settingsE = {
    ...settings,
    doelStart: settings.doelStart ? parseLocalDate(settings.doelStart) : null,
  };
  const eventsD = (events || []).map((e) => ({
    ...e,
    datum: parseLocalDate(e.datum),
  }));
  const today = stripTime_(parseLocalDate(todayISO));
  const vorigeDatum = new Date(today);
  vorigeDatum.setDate(today.getDate() - 7);
  const vorige = stripTime_(vorigeDatum);

  const nu = faseVoor_(settingsE, eventsD, today);
  const prev = faseVoor_(settingsE, eventsD, vorige);

  if (nu.fase === prev.fase) return null;

  const soort: FaseOvergangSoort =
    nu.eventDriven && !prev.eventDriven ? "event_overname" : "fase_wissel";
  return {
    soort,
    van: prev.fase,
    naar: nu.fase,
    eventNaam: nu.eventNaam,
    wekenTotEvent: nu.wekenTotEvent,
  };
}
