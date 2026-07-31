import { EVENT_OVERNAME_WEKEN, effectiveMacroFase_ } from "@cadans/engine";
import { blokStartVoorWeek } from "./blok";

// ROADMAP punt 9 fase B — DE POORT VAN DE OVERNAME-KAART.
// Spec: docs/EVENT-OVERNAME-BOUWDOC.md §8.1.
//
// LOS VAN `blok.ts`: die hangt aan de blok-terugblik, deze aan het EVENT. Ze delen alleen de
// blok-verankering, en die wordt hier binnengehaald in plaats van nagerekend — `blokStartVoorWeek`
// is de ene plek waar een weekmaandag op een blokstart wordt afgebeeld.
//
// DE TWEE FASES KOMEN UIT `effectiveMacroFase_` ZELF, met `true` en met `false`. Niets wordt hier
// nagebouwd: de kaart belooft precies wat de app daarna doet, want het is dezelfde functie.

export interface EventOvernameInput {
  eventNaam: string | null;
  eventDatum: string | null;
  wekenTot: number | null;
  /** De per-dag taper/herstel-overlay is actief (`taperEvent` != null). */
  taperActief: boolean;
  doel: string | null;
  doelFase: string | null;
  eventMacroFase: string | null;
  settings: unknown;
  doelStart: string | null;
  weekMondayISO: string;
  /** De opgeslagen rij: voor welk event, welk blok, en met welk antwoord. */
  beantwoordEvent: string | null;
  beantwoordBlok: string | null;
  antwoord: string | null;
}

export interface EventOvernameVoorstel {
  eventNaam: string;
  eventDatum: string;
  wekenTot: number;
  blokStart: string;
  doel: string | null;
  faseJa: string;
  faseNee: string;
}

/**
 * Null = geen kaart. Elke conditie hieronder staat los, zodat er per conditie een eigen
 * rood-test bestaat.
 */
export function eventOvernameVoorstel(
  input: EventOvernameInput,
): EventOvernameVoorstel | null {
  const {
    eventNaam,
    eventDatum,
    wekenTot,
    taperActief,
    doel,
    doelFase,
    eventMacroFase,
    settings,
    doelStart,
    weekMondayISO,
    beantwoordEvent,
    beantwoordBlok,
    antwoord,
  } = input;

  // (1) Er moet een hoofdevent zijn met een datum en een geldige afstand ernaartoe.
  if (!eventNaam || !eventDatum) return null;
  if (typeof wekenTot !== "number" || !Number.isFinite(wekenTot)) return null;

  // (2) Buiten de overnamegrens is er niets te vragen: het doel leidt daar sowieso. De grens
  //     komt UIT DE ENGINE — een eigen 8 hier zou dezelfde beleidswaarde op twee plekken zetten.
  if (wekenTot > EVENT_OVERNAME_WEKEN) return null;

  // (3) Staat de taper- of herstel-overlay aan, dan stuurt het event het plan al per dag en is
  //     de vraag zinloos. Mechanisch afgeleid uit `taperEvent`, geen eigen drempel.
  if (taperActief) return null;

  const blokStart = blokStartVoorWeek(doelStart, weekMondayISO);

  // (4) 'ja' geldt tot het event voorbij is: eenmaal bevestigd komt de vraag niet terug.
  if (antwoord === "ja" && beantwoordEvent === eventDatum) return null;

  // (5) 'nee' geldt alleen voor DIT blok. Op de volgende blokgrens wordt hij opnieuw gesteld,
  //     zolang het event binnen de grens ligt — dat is "hoogstens één keer per blok" uit §2B.
  if (
    antwoord === "nee" &&
    beantwoordEvent === eventDatum &&
    beantwoordBlok === blokStart
  )
    return null;

  const faseJa = effectiveMacroFase_(
    eventMacroFase,
    doelFase,
    settings,
    wekenTot,
    true,
  ) as string;
  const faseNee = effectiveMacroFase_(
    eventMacroFase,
    doelFase,
    settings,
    wekenTot,
    false,
  ) as string;

  return {
    eventNaam,
    eventDatum,
    wekenTot,
    blokStart,
    doel,
    faseJa,
    faseNee,
  };
}
