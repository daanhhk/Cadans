import { genericCombo } from "@cadans/engine";
import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal } from "./proposal";
import { rauweBlokkenVan_, werkzoneLabelsVan_ } from "./zonelabels";
import { planZone5_, ZONE5_GRENZEN_DEFAULT } from "./zonemunt";

// ROADMAP punt 15 fase 1 — DE LANGE RIT MET EFFORTS DECLAREERT ZIJN ZONES.
// Spec: docs/PUNT15-FASE1-BOUWDOC.md.
//
// `combo_long_with_efforts` was de ENIGE kwaliteitsdragende sessie in de app zonder `blokken`.
// `planZone5_` leest juist dat veld, dus de 30 efforts-minuten waren onzichtbaar voor de zone-munt
// en het `tempo`-label belandde niet eens in de poortset van punt 14. GEMETEN over 480 sessies:
// 28 zonder blokken, alle van dit type, alle bij de twee klim-doelen in Build en Peak.

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

/** 28 dagen terug → blokweek 5 → fase Build (computeMacroPhase). */
const DOELSTART = iso(-28);

/** V1 uit weekvormAs.test.ts: ma60 di60 do60 za120. */
const V1: Record<number, number> = { 0: 60, 1: 60, 3: 60, 5: 120 };

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "Korte beklimmingen",
  doelStart: DOELSTART,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

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

type Blok = { minuten: number; zone: string; pctLo: number; pctHi: number };

/** De sessie zoals de weekplanner haar bouwt: 120 minuten beschikbaar, Build, klim-doel. */
function sessie() {
  return genericCombo(
    "combo_long_with_efforts",
    120,
    { ftp: 280, lthr: 170 },
    1,
    "Korte beklimmingen",
  ) as {
    blokken: Blok[];
    totaalMin: number;
    intent: { low: number; high: number; anaerobic: number };
    tss: number;
    naam: string;
    zones: string[];
    structuur: unknown[];
  };
}

describe("punt 15 fase 1 — de bouwer", () => {
  it("de blokken dragen exact 30,0 werkminuten", () => {
    const wo = sessie();
    const zm = planZone5_(wo.blokken, ZONE5_GRENZEN_DEFAULT);
    // De efforts-band 85-92 loopt over de Z3/Z4-grens, dus `planZone5_` splitst hem
    // proportioneel; de SOM over de werkzones is wat de sessie voorschrijft.
    expect(zm.tempo + zm.drempel + zm.anaeroob).toBeCloseTo(30, 1);
  });

  it("de blokken dekken de HELE sessie — som van vijf zones is totaalMin", () => {
    const wo = sessie();
    const zm = planZone5_(wo.blokken, ZONE5_GRENZEN_DEFAULT);
    const som = zm.rust + zm.z2 + zm.tempo + zm.drempel + zm.anaeroob;
    expect(som).toBeCloseTo(wo.totaalMin, 1);
    // En de minuten zelf sommeren óók: 15 + baseMin + 3x10 + 3x5 + 15.
    expect(wo.blokken.reduce((a, b) => a + b.minuten, 0)).toBe(wo.totaalMin);
  });

  it("de drie intra-rust-blokken dragen het label rust", () => {
    const wo = sessie();
    // Volgorde volgt de `structuur`: warmup, Z2-base, dan 3x (effort, rust), dan uitrijden.
    expect(wo.blokken).toHaveLength(9);
    expect([3, 5, 7].map((i) => wo.blokken[i]?.zone)).toEqual([
      "rust",
      "rust",
      "rust",
    ]);
    // De efforts zelf dragen het nominale label `tempo` (band 85-92, midden 88,5 → 89).
    expect([2, 4, 6].map((i) => wo.blokken[i]?.zone)).toEqual([
      "tempo",
      "tempo",
      "tempo",
    ]);
  });

  it("intent en tss zijn ONGEWIJZIGD — fase 1 raakt de inhoud van het plan niet", () => {
    const wo = sessie();
    expect(wo.intent).toEqual({
      low: 15 + 45 + 10 + 15,
      high: 30,
      anaerobic: 0,
    });
    expect(wo.tss).toBe(Math.round(wo.totaalMin * 0.85));
    expect(wo.zones).toEqual(["low", "high"]);
  });
});

describe("punt 15 fase 1 — de keten, met de producent in de lus", () => {
  /** De hele week zoals de app hem bouwt; geen nagebouwd object. */
  function week() {
    vi.setSystemTime(MAANDAG);
    return buildWeekProposal({
      settings: SETTINGS,
      plannerDays: plannerDays(V1),
      events: [],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: iso(0),
    } as never) as { days: { datum: string }[] };
  }

  it("de week levert 68,5 werkminuten en tempo zit in de poortset", () => {
    const r = week();
    const blokken = r.days.flatMap((d) =>
      rauweBlokkenVan_(d as never),
    ) as unknown[];
    const zm = planZone5_(blokken, ZONE5_GRENZEN_DEFAULT);
    expect(zm.tempo + zm.drempel + zm.anaeroob).toBeCloseTo(68.5, 1);
    expect(werkzoneLabelsVan_(blokken)).toContain("tempo");
  });
});
