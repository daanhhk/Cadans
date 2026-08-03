import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { nlBlokDuur } from "./format";
import { buildWeekProposal } from "./proposal";

// ROADMAP punt 18 — DE DUURCEL VAN EEN ENGINE-BLOK MAG GEEN FLOAT-RUIS TONEN.
//
// PRODUCENT-GEDREVEN, GEEN HANDGESCHREVEN FIXTURES. De cellen komen uit `buildWeekProposal`
// zelf, over een brede doorsnede van weekvormen, doelen en blokweken. Een met de hand
// geschreven voorbeeld zou een vorm kunnen dragen die de engine nooit levert — dan toetst de
// test zijn eigen aanname in plaats van de app. Zelfde grond als de shot-harness: meet bij de
// producent.
//
// TWEE EISEN PER CEL:
//   1. na opmaak staat er geen getal met twee of meer decimalen in;
//   2. het NIET-numerieke deel van de string is onveranderd — het aantal, het maal-teken, de
//      spatiëring en de eenheid blijven staan. Zonder die tweede eis zou "alles weggooien"
//      ook groen zijn.

const MAANDAG = new Date(2026, 6, 27, 8, 0, 0); // 2026-07-27, ma
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 6, 27 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

function settings(doel: string, doelStart: string): SettingsInput {
  return {
    ftp: 280,
    lthr: 160,
    gewicht: 75,
    doel,
    doelStart,
    hrMax: null,
    hrRest: null,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 40,
    pendelAantal: 2,
  } as SettingsInput;
}

function plannerDays(min: Record<number, number>): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: min[n] != null,
    dag: null,
    minuten: min[n] ?? 0,
    dagtype: min[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  })) as PlannerDay[];
}

/** Elke duurcel die de engine voor deze week produceert. */
function duurCellen(
  doel: string,
  doelStart: string,
  min: Record<number, number>,
): string[] {
  const r = buildWeekProposal({
    settings: settings(doel, doelStart),
    plannerDays: plannerDays(min),
    events: [
      {
        id: 1,
        datum: "2027-04-17",
        naam: "A-race",
        type: "race",
        prioriteit: "A",
      },
    ],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: iso(0),
  } as never);
  const uit: string[] = [];
  for (const d of (r as { days: unknown[] }).days) {
    for (const s of ((d as { sessions?: unknown[] }).sessions ?? []) as {
      structuur?: string[][];
    }[]) {
      for (const row of s.structuur ?? []) {
        const cel = row[1];
        if (typeof cel === "string" && cel !== "") uit.push(cel);
      }
    }
  }
  return uit;
}

// Vijf weekvormen die de bibliotheek breed aanspreken: korte dagen, lange dagen en een
// zaterdag boven de band.
const VORMEN: Record<number, number>[] = [
  { 0: 60, 1: 60, 3: 60, 5: 120 },
  { 1: 60, 4: 90, 5: 180, 6: 120 },
  { 0: 90, 1: 90, 3: 90, 5: 210 },
  { 0: 60, 1: 60, 3: 60, 5: 240 },
  { 0: 45, 2: 60, 4: 60, 5: 90, 6: 60 },
];
const DOELEN = [
  "FTP",
  "Conditie",
  "Korte beklimmingen",
  "Lange beklimmingen",
  "Onderhoud",
];
// Blokweek 1 t/m 4 via doelStart: elke week terug schuift de blokweek één op.
const BLOKSTARTS = [iso(0), iso(-7), iso(-14), iso(-21)];

/** Het niet-numerieke skelet: elk GETAL wordt één "#", de rest blijft staan.
 * Per CIJFER vervangen zou niet werken — dan verschilt "9.000000000000004" per constructie van
 * "9" en toetst de assertie de opmaak in plaats van het skelet eromheen. */
const skelet = (s: string) => s.replace(/\d+(?:[.,]\d+)?/g, "#");

describe("nlBlokDuur op cellen uit de engine zelf", () => {
  const cellen = new Set<string>();
  for (const doel of DOELEN) {
    for (const start of BLOKSTARTS) {
      for (const vorm of VORMEN) {
        for (const c of duurCellen(doel, start, vorm)) cellen.add(c);
      }
    }
  }

  it("de doorsnede levert een substantiële set duurcellen", () => {
    // Zonder deze ondergrens kan de lus stil leeg draaien en leest een lege set als groen.
    expect(cellen.size).toBeGreaterThan(10);
  });

  it("geen enkele opgemaakte cel draagt twee of meer decimalen", () => {
    const vuil = [...cellen]
      .map((c) => [c, nlBlokDuur(c)] as const)
      .filter(([, out]) => /\d+[.,]\d{2,}/.test(out));
    expect(vuil).toEqual([]);
  });

  it("het niet-numerieke deel blijft onveranderd", () => {
    const verminkt = [...cellen]
      .map((c) => [c, nlBlokDuur(c)] as const)
      .filter(([raw, out]) => skelet(raw) !== skelet(out));
    expect(verminkt).toEqual([]);
  });

  it("een onbekende vorm komt ONGEWIJZIGD terug", () => {
    // Niet gokken: een vorm die de engine (nog) niet levert hoort zichtbaar onopgemaakt te
    // blijven in plaats van stil verminkt te worden.
    for (const raar of ["", "—", "tot uitputting", "3 ronden", "10 km"]) {
      expect(nlBlokDuur(raar)).toBe(raar);
    }
  });
});
