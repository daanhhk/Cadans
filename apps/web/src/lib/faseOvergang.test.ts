import type { EventItem, SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { detectFaseOvergang, faseBundelVoor_ } from "./faseOvergang";

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

  it("basis → opbouw bij een naderend A-event", () => {
    const o = detectFaseOvergang(S(), race(RACE), "2026-04-06");
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

  it("WAAROM er geen 'event-overname'-tak is: event-gedreven DEZE week ⟹ óók vorige week", () => {
    // pickMainEvent_ slaat events vóór de referentiedatum over → de kandidatenlijst van vorige week
    // is altijd een superset van die van deze week. Een plan dat nu event-gedreven is, was dat vorige
    // week dus ook; "vorige week geen event, nu wel" kan alleen door het INVOEREN van een event
    // ontstaan, niet door tijdsverloop. Daarom bestaat er maar één soort overgang.
    const nu = faseBundelVoor_(S(), race(RACE), "2026-05-25");
    const vorige = faseBundelVoor_(S(), race(RACE), "2026-05-18");
    expect(nu.eventDriven).toBe(true);
    expect(vorige.eventDriven).toBe(true);
  });

  it("wissel NAAR Test → null (tellerartefact, geen geplande meting → geen aankondiging)", () => {
    // doelStart 2026-01-01: today 2026-03-19 = blokweek 12 (Test), today−7 = blokweek 11 (Peak).
    // Zonder de guard zou dit een Peak→Test-kaart geven; met de guard onderdrukt.
    expect(
      detectFaseOvergang(S({ doelStart: "2026-01-01" }), [], "2026-03-19"),
    ).toBeNull();
  });
});
