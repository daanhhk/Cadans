import { describe, expect, it } from "vitest";
import { eventOvernameVoorstel } from "./eventOvername";

// ROADMAP punt 9 fase B — de POORT van de overname-kaart. Spec: docs/EVENT-OVERNAME-BOUWDOC.md §8.1.
//
// Elke conditie krijgt een eigen geval, zodat er per conditie een rood-test bestaat: zet er één
// uit en de kaart verschijnt waar hij niet hoort. Geen klok nodig — de poort leest uitsluitend
// wat de aanroeper meegeeft.

/** Het BASISGEVAL waarop de kaart hoort te verschijnen: AGR op acht weken, niets beantwoord. */
const BASIS = {
  eventNaam: "AGR Toerversie",
  eventDatum: "2027-04-17",
  wekenTot: 8,
  taperActief: false,
  doel: "FTP",
  doelFase: "Peak",
  eventMacroFase: "Build",
  settings: { doel: "FTP" },
  doelStart: "2026-06-29",
  weekMondayISO: "2027-02-22",
  beantwoordEvent: null,
  beantwoordBlok: null,
  antwoord: null,
};

describe("eventOvernameVoorstel — het basisgeval", () => {
  it("op de acht-wekengrens, niets beantwoord → de kaart verschijnt", () => {
    const v = eventOvernameVoorstel(BASIS);
    expect(v).not.toBeNull();
    expect(v?.eventNaam).toBe("AGR Toerversie");
    expect(v?.eventDatum).toBe("2027-04-17");
    expect(v?.wekenTot).toBe(8);
    expect(v?.doel).toBe("FTP");
  });

  it("de twee fases komen uit effectiveMacroFase_ zelf, niet uit een eigen afleiding", () => {
    const v = eventOvernameVoorstel(BASIS);
    // Bevestigd wint het event (Build), niet-bevestigd leidt het doel (Peak). Dat de twee
    // VERSCHILLEN is de hele reden dat de vraag gesteld wordt.
    expect(v?.faseJa).toBe("Build");
    expect(v?.faseNee).toBe("Peak");
    expect(v?.faseJa).not.toBe(v?.faseNee);
  });

  it("de blokstart wordt binnen de poort bepaald, niet door de aanroeper", () => {
    // doelStart 2026-06-29, weekmaandag 2027-02-22 → blokStartVoorWeek uit blok.ts.
    expect(eventOvernameVoorstel(BASIS)?.blokStart).toBe("2027-02-08");
  });
});

describe("eventOvernameVoorstel — elke gate-conditie apart", () => {
  it("(1a) geen eventnaam → null", () => {
    expect(eventOvernameVoorstel({ ...BASIS, eventNaam: null })).toBeNull();
  });
  it("(1b) geen eventdatum → null", () => {
    expect(eventOvernameVoorstel({ ...BASIS, eventDatum: null })).toBeNull();
  });
  it("(1c) wekenTot is geen getal → null", () => {
    expect(eventOvernameVoorstel({ ...BASIS, wekenTot: null })).toBeNull();
    expect(
      eventOvernameVoorstel({ ...BASIS, wekenTot: Number.NaN }),
    ).toBeNull();
  });

  it("(2) buiten de acht-wekengrens → null, en op de grens zelf juist WEL", () => {
    expect(eventOvernameVoorstel({ ...BASIS, wekenTot: 9 })).toBeNull();
    // De grens is inclusief: 8 hoort erbij, dat is de eerste week waarin de vraag speelt.
    expect(eventOvernameVoorstel({ ...BASIS, wekenTot: 8 })).not.toBeNull();
  });

  it("(3) taper-overlay actief → null; het event stuurt het plan dan al per dag", () => {
    expect(eventOvernameVoorstel({ ...BASIS, taperActief: true })).toBeNull();
  });

  it("(4) 'ja' voor DIT event → null, en de vraag komt ook een blok later niet terug", () => {
    const ja = {
      ...BASIS,
      beantwoordEvent: "2027-04-17",
      beantwoordBlok: "2027-02-08",
      antwoord: "ja",
    };
    expect(eventOvernameVoorstel(ja)).toBeNull();
    // Ander blok, zelfde event: 'ja' geldt tot het event voorbij is.
    expect(
      eventOvernameVoorstel({ ...ja, weekMondayISO: "2027-03-08" }),
    ).toBeNull();
  });

  it("(4b) 'ja' voor een ANDER event → de kaart verschijnt gewoon", () => {
    expect(
      eventOvernameVoorstel({
        ...BASIS,
        beantwoordEvent: "2026-09-05",
        beantwoordBlok: "2027-02-08",
        antwoord: "ja",
      }),
    ).not.toBeNull();
  });

  it("(5) 'nee' voor dit event ÉN dit blok → null", () => {
    expect(
      eventOvernameVoorstel({
        ...BASIS,
        beantwoordEvent: "2027-04-17",
        beantwoordBlok: "2027-02-08",
        antwoord: "nee",
      }),
    ).toBeNull();
  });

  it("(5b) 'nee' op een VORIG blok → de vraag komt terug op de nieuwe blokgrens", () => {
    // Zelfde 'nee', maar we staan nu in het volgende blok. Dit is "hoogstens één keer per blok"
    // uit DOELEN-SPEC §2B: het antwoord vervalt met het blok, niet met het event.
    const v = eventOvernameVoorstel({
      ...BASIS,
      weekMondayISO: "2027-03-08",
      wekenTot: 6,
      beantwoordEvent: "2027-04-17",
      beantwoordBlok: "2027-02-08",
      antwoord: "nee",
    });
    expect(v).not.toBeNull();
    expect(v?.blokStart).not.toBe("2027-02-08");
  });
});
