import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal } from "./proposal";

// ROADMAP punt 7 — de acceptatie-eisen uit `docs/DOEL-LIJST-RECON.md` §9, gemeten met
// `buildWeekProposal`: de functie die de app zelf aanroept, niet een nagebouwde lus.
//
// Klok gepind BINNEN de test (na `vi.setSystemTime`), want `weekIndexFromStart_` én
// `allocateQualityWeek_` dateren zich op de ambient `new Date()`. De fase komt uit de
// doelStart-offset: 0 dagen → Base, 28 dagen terug → Build (computeMacroPhase, weken 1-4 / 5-8).

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
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const START = {
  Base: isoOf(new Date(2026, 6, 27)),
  Build: isoOf(new Date(2026, 6, 27 - 28)),
};

/** V1 = ma60 di60 do60 za120 · V3 = ma70 di70 do70 za180 zo90 (de vormen uit §9). */
const V1: Record<number, number> = { 0: 60, 1: 60, 3: 60, 5: 120 };
const V3: Record<number, number> = { 0: 70, 1: 70, 3: 70, 5: 180, 6: 90 };

function settings(doel: string, doelStart: string): SettingsInput {
  return {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel,
    doelStart,
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
  };
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
  }));
}

type Sessie = {
  intent?: { high?: number; anaerobic?: number };
  tss?: number;
  naam?: string;
  totaalMin?: number;
};

function week(
  doel: string,
  fase: "Base" | "Build",
  min: Record<number, number>,
) {
  vi.setSystemTime(MAANDAG);
  return buildWeekProposal({
    settings: settings(doel, START[fase]),
    plannerDays: plannerDays(min),
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: iso(0),
  } as never);
}

/** Dagen met kwaliteit, high- en anaerobe intentminuten, week-TSS en de sjabloonnamen. */
function meet(r: unknown) {
  let high = 0;
  let anaeroob = 0;
  let tss = 0;
  const namen: string[] = [];
  const dagen = new Set<string>();
  for (const d of (r as { days: { datum: string; sessions?: Sessie[] }[] })
    .days) {
    for (const s of d.sessions ?? []) {
      const h = Number(s.intent?.high) || 0;
      const a = Number(s.intent?.anaerobic) || 0;
      high += h;
      anaeroob += a;
      tss += Number(s.tss) || 0;
      if (s.naam) namen.push(`${s.naam}|${s.totaalMin}m`);
      if (h + a > 0) dagen.add(d.datum);
    }
  }
  return {
    dagen: dagen.size,
    high: Math.round(high),
    anaeroob: Math.round(anaeroob),
    tss,
    namen,
  };
}

/** Volledige week als string — de byte-identiteits-toets van eis 7c. */
function vinger(r: unknown) {
  return JSON.stringify(
    (r as { days: { datum: string; sessions?: unknown[] }[] }).days.map(
      (d) => ({
        datum: d.datum,
        sessions: d.sessions ?? [],
      }),
    ),
  );
}

describe("punt 7 eis b — de twee klim-doelen leveren NIET dezelfde week", () => {
  for (const [vorm, min] of [
    ["V1", V1],
    ["V3", V3],
  ] as [string, Record<number, number>][]) {
    it(`${vorm} Build: kort is anaerober, lang is high-zwaarder`, () => {
      const kort = meet(week("Korte beklimmingen", "Build", min));
      const lang = meet(week("Lange beklimmingen", "Build", min));

      // 1. Niet dezelfde week. Dit is de kern van de splitsing: vóór punt 7 waren Beklimmingen
      //    en VO2max in Base zelfs BYTE-IDENTIEK (recon §3).
      expect(vinger(week("Korte beklimmingen", "Build", min))).not.toBe(
        vinger(week("Lange beklimmingen", "Build", min)),
      );
      // 2. Kort levert MEER anaerobe intentminuten — vo2 0,45 tegen 0,15.
      expect(kort.anaeroob).toBeGreaterThan(lang.anaeroob);
      // 3. Lang levert MEER high-intentminuten — drempel 0,50 plus sweetspot 0,35.
      expect(lang.high).toBeGreaterThan(kort.high);
    });
  }
});

describe("punt 7 eis c — legacy-waarden landen op hun canonieke doel", () => {
  // DE DRAGENDE TOETS VOOR normalizeDoel_. `settings.doel` is vrije tekst in D1 en de UI biedt
  // de oude strings nog aan tot fase B2, dus deze twee waarden staan vandaag in productie.
  // Byte-identiek over de VOLLEDIGE week dekt elke normalisatie-plek in één meting: het profiel
  // (`profileForDoel_`), de categorie-tak (`keyIntensity`), de bibliotheek-dispatch
  // (`buildWorkout`), de pendel-key (`doelKey`) en de zone-takken.
  for (const fase of ["Base", "Build"] as const) {
    for (const [vorm, min] of [
      ["V1", V1],
      ["V3", V3],
    ] as [string, Record<number, number>][]) {
      it(`${vorm} ${fase}: "Beklimmingen" == "Korte beklimmingen"`, () => {
        expect(vinger(week("Beklimmingen", fase, min))).toBe(
          vinger(week("Korte beklimmingen", fase, min)),
        );
      });
      it(`${vorm} ${fase}: "VO2max" == "FTP"`, () => {
        expect(vinger(week("VO2max", fase, min))).toBe(
          vinger(week("FTP", fase, min)),
        );
      });
    }
  }

  it("een onbekende doel-string valt op FTP, niet op een lege week", () => {
    expect(vinger(week("Klimmen!", "Build", V1))).toBe(
      vinger(week("FTP", "Build", V1)),
    );
  });
});
