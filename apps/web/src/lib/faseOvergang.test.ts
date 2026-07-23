import type { EventItem, SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { detectFaseOvergang } from "./faseOvergang";

// Vaste datums (geen ambient klok waar het uitmaakt). TODAY-argumenten zijn expliciet.
function S(o: Partial<SettingsInput> = {}): SettingsInput {
  return {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel: "FTP",
    doelStart: null,
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
    ...o,
  };
}
function race(datum: string): EventItem[] {
  return [
    {
      datum,
      naam: "Doelrace",
      type: "race",
      prioriteit: "A",
      afstandKm: 120,
      hoogtemeters: 2000,
      klimType: "lang",
      notitie: null,
    },
  ];
}
const RACE = "2026-06-01";

describe("detectFaseOvergang", () => {
  it("zelfde fase als vorige week → null", () => {
    // ver van de race: beide weken Base → geen overgang.
    expect(detectFaseOvergang(S(), race(RACE), "2026-03-25")).toBeNull();
  });

  it("fase_wissel basis → opbouw bij een naderend A-event", () => {
    const o = detectFaseOvergang(S(), race(RACE), "2026-04-06");
    expect(o?.soort).toBe("fase_wissel");
    expect(o?.van).toBe("Base");
    expect(o?.naar).toBe("Build");
    expect(o?.eventNaam).toBe("Doelrace");
    expect(o?.wekenTotEvent).toBe(8);
  });

  it("wissel naar taper — alleen zichtbaar op de TOONBARE fase (borgt de ontwerpkeuze)", () => {
    // Peak-week → Taper-week: de taper-overlay leeft ALLEEN op de toonbare fase. Op macroFase zijn
    // beide weken "Peak" → op macroFase vergelijken zou deze (belangrijkste) overgang MISSEN.
    const o = detectFaseOvergang(S(), race(RACE), "2026-05-25");
    expect(o?.van).toBe("Peak");
    expect(o?.naar).toBe("Taper");
  });

  it("de week NA een A-race → herstel", () => {
    // race op maandag 2026-06-01, today woensdag 2026-06-03 (zelfde week) → Recovery.
    const o = detectFaseOvergang(S(), race("2026-06-01"), "2026-06-03");
    expect(o?.naar).toBe("Recovery");
  });

  it("doel Onderhoud MET event → dezelfde overgang als de andere doelen (winst van de bouw)", () => {
    const ftp = detectFaseOvergang(
      S({ doel: "FTP" }),
      race(RACE),
      "2026-04-06",
    );
    const ond = detectFaseOvergang(
      S({ doel: "Onderhoud" }),
      race(RACE),
      "2026-04-06",
    );
    expect(ond?.naar).toBe(ftp?.naar);
    expect(ond?.naar).toBe("Build");
  });

  it("doel Onderhoud ZONDER event → null (de pin houdt elke week op Base)", () => {
    expect(
      detectFaseOvergang(S({ doel: "Onderhoud" }), [], "2026-04-06"),
    ).toBeNull();
  });

  it("GEMETEN: event_overname is onbereikbaar via de today−7-vergelijking → een intredend A-event geeft fase_wissel", () => {
    // pickMainEvent_ heeft geen vooruit-horizon: een race die DEZE week event-gedreven maakt, was dat
    // vorige week ook al (die race lag toen óók in de toekomst). Daarom is `nu.eventDriven &&
    // !prev.eventDriven` nooit waar en blijft een intredende race een fase_wissel. De event_overname-
    // branch + copy blijven bestaan (spec + toekomstvast) en zijn getest op copy-niveau
    // (coachNarrative.test) + zichtbaar in /preview.
    const o = detectFaseOvergang(S(), race(RACE), "2026-04-06");
    expect(o?.soort).toBe("fase_wissel");
  });
});
