// Fase 1a van de zone-munt — IJK op de meting uit docs/ZONE-MUNT-ONTWERP.md §3.1.
// De waarden hieronder zijn MEETUITKOMSTEN, geen doelen: ze horen niet naar de code toe
// bijgesteld te worden. Wijkt er een af, dan is dat een bevinding.
import { ARCHETYPES, expandArchetype_ } from "@cadans/engine";
import { describe, expect, it } from "vitest";
import {
  bibliotheekSignatuur,
  planZone5_,
  ZONE5_GRENZEN_DEFAULT,
  zone5Grenzen,
} from "./zonemunt";

/** Alle archetypes op nominale dosis (ftp 280, lthr 178, geen meso, geen trede). */
function bibliotheekZone5(grenzen: readonly number[] = ZONE5_GRENZEN_DEFAULT) {
  const som = { rust: 0, z2: 0, tempo: 0, drempel: 0, anaeroob: 0 };
  for (const rec of ARCHETYPES) {
    const uit = expandArchetype_(rec, { ftp: 280, lthr: 178 });
    const zm = planZone5_(uit.blokken, grenzen);
    som.rust += zm.rust;
    som.z2 += zm.z2;
    som.tempo += zm.tempo;
    som.drempel += zm.drempel;
    som.anaeroob += zm.anaeroob;
  }
  return som;
}

/** Tolerantie van een tiende minuut — de meting zelf, niet een afgeronde weergave. */
function binnenTiende(gemeten: number, verwacht: number) {
  expect(
    Math.abs(gemeten - verwacht),
    `${gemeten} ≈ ${verwacht}`,
  ).toBeLessThanOrEqual(0.1);
}

/**
 * De ZEVEN zones, afgeleid met de module zelf door de grenzen te verschuiven: de vierde
 * grens naar 120 laat Z6+Z7 in anaeroob over, naar 150 alleen Z7.
 */
function bibliotheekZ7() {
  const vijf = bibliotheekZone5();
  const z6z7 = bibliotheekZone5([55, 75, 105, 120]).anaeroob;
  const z7 = bibliotheekZone5([55, 75, 120, 150]).anaeroob;
  return {
    Z1: vijf.rust,
    Z2: vijf.z2,
    Z3: vijf.tempo,
    Z4: vijf.drempel,
    Z5: vijf.anaeroob - z6z7,
    Z6: z6z7 - z7,
    Z7: z7,
    anaeroob: vijf.anaeroob,
  };
}

function zone5Van(id: string) {
  const rec = ARCHETYPES.find((a: { id: string }) => a.id === id);
  expect(rec, `archetype ${id} bestaat`).toBeTruthy();
  const uit = expandArchetype_(rec, { ftp: 280, lthr: 178 });
  return planZone5_(uit.blokken, ZONE5_GRENZEN_DEFAULT);
}

describe("zone5Grenzen — de vier bovengrenzen uit power_zones", () => {
  it("neemt de eerste vier bovengrenzen uit een volledige intervals-array", () => {
    expect(zone5Grenzen([55, 75, 90, 105, 120, 150, 999])).toEqual([
      55, 75, 90, 105,
    ]);
  });

  it("valt terug op de default bij null, leeg of te kort", () => {
    expect(zone5Grenzen(null)).toEqual(ZONE5_GRENZEN_DEFAULT);
    expect(zone5Grenzen([])).toEqual(ZONE5_GRENZEN_DEFAULT);
    expect(zone5Grenzen([55, 75, 90])).toEqual(ZONE5_GRENZEN_DEFAULT);
  });

  it("valt terug op de default bij niet-numeriek of niet-oplopend", () => {
    expect(zone5Grenzen([55, "x", 90, 105, 120, 150, 999])).toEqual(
      ZONE5_GRENZEN_DEFAULT,
    );
    expect(zone5Grenzen([55, 90, 75, 105, 120, 150, 999])).toEqual(
      ZONE5_GRENZEN_DEFAULT,
    );
  });

  it("de default spiegelt pctZoneBucket_ (rust <56 · z2 t/m 75 · tempo t/m 90 · drempel t/m 105)", () => {
    expect(ZONE5_GRENZEN_DEFAULT).toEqual([55, 75, 90, 105]);
  });
});

describe("planZone5_ — de plan-kant over de hele bibliotheek", () => {
  it("levert de gemeten verdeling over alle zeven zones, onafgerond", () => {
    expect(ARCHETYPES.length).toBe(35);
    const z = bibliotheekZ7();
    binnenTiende(z.Z1, 607.3);
    binnenTiende(z.Z2, 393.7);
    binnenTiende(z.Z3, 284.3);
    binnenTiende(z.Z4, 566.8);
    binnenTiende(z.Z5, 129.3);
    binnenTiende(z.Z6, 27.3);
    binnenTiende(z.Z7, 0.0);
  });

  it("vouwt Z5..Z7 tot anaeroob 156,6", () => {
    const z = bibliotheekZ7();
    binnenTiende(z.anaeroob, 156.6);
    // De vouwing telt de ONAFGERONDE delen op. Zou je eerst per zone afronden, dan gaf
    // 129 + 27 + 0 hier 156 — een minuut die nergens gereden is.
    binnenTiende(z.Z5 + z.Z6 + z.Z7, z.anaeroob);
  });

  // AFGELEIDE waarden: elk ÉÉN keer afgerond uit de onafgeronde som. Ze tellen NIET bij
  // elkaar op tot het afgeronde werktotaal — 284 + 723 is 1007, terwijl het werk zelf
  // 284,3130 + 566,8000 + 156,6000 = 1007,7130 is en dus op 1008 afrondt. Dat is geen
  // fout maar de prijs van afronden: doe het één keer, op de waarde die je toont.
  it("levert werk tempo 284 tegen drempel plus anaeroob 723", () => {
    const som = bibliotheekZone5();
    expect(Math.round(som.tempo)).toBe(284);
    expect(Math.round(som.drempel + som.anaeroob)).toBe(723);
  });

  it("levert de verhouding 28 tegen 72 procent", () => {
    const som = bibliotheekZone5();
    const werk = som.tempo + som.drempel + som.anaeroob;
    expect(Math.round((100 * som.tempo) / werk)).toBe(28);
    expect(Math.round((100 * (som.drempel + som.anaeroob)) / werk)).toBe(72);
  });
});

// ROOD zonder de proportionele splitsing: de midpunt-bucketing van `pctZoneBucket_` legt
// deze drie sweetspot-sjablonen voor 100% in tempo (20/0, 24/0 en 24/0). Per sjabloon
// geasserteerd, zodat elke plek zijn eigen bewijs draagt.
describe("planZone5_ — proportionele splitsing over de Z3/Z4-grens", () => {
  it("sweetspot_2x10 splitst 20 werkminuten in tempo 10 en drempel 10", () => {
    const zm = zone5Van("sweetspot_2x10");
    expect(Math.round(zm.tempo)).toBe(10);
    expect(Math.round(zm.drempel)).toBe(10);
  });

  it("sweetspot_3x8 splitst 24 werkminuten in tempo 12 en drempel 12", () => {
    const zm = zone5Van("sweetspot_3x8");
    expect(Math.round(zm.tempo)).toBe(12);
    expect(Math.round(zm.drempel)).toBe(12);
  });

  it("sweetspot_short splitst 24 werkminuten in tempo 12 en drempel 12", () => {
    const zm = zone5Van("sweetspot_short");
    expect(Math.round(zm.tempo)).toBe(12);
    expect(Math.round(zm.drempel)).toBe(12);
  });
});

describe("planZone5_ — randgevallen", () => {
  it("legt een steady-blok (pctHi <= pctLo) heel in de zone van pctLo", () => {
    expect(planZone5_([{ minuten: 30, pctLo: 65, pctHi: 65 }])).toEqual({
      rust: 0,
      z2: 30,
      tempo: 0,
      drempel: 0,
      anaeroob: 0,
    });
  });

  it("slaat een blok zonder pctLo/pctHi over in plaats van te raden", () => {
    expect(planZone5_([{ minuten: 30 }, { minuten: 10, pctLo: 65 }])).toEqual({
      rust: 0,
      z2: 0,
      tempo: 0,
      drempel: 0,
      anaeroob: 0,
    });
  });

  it("legt alles boven de vierde grens in anaeroob", () => {
    expect(planZone5_([{ minuten: 12, pctLo: 120, pctHi: 160 }])).toEqual({
      rust: 0,
      z2: 0,
      tempo: 0,
      drempel: 0,
      anaeroob: 12,
    });
  });

  it("volgt eigen grenzen: dezelfde band valt anders bij een andere indeling", () => {
    const blok = [{ minuten: 20, pctLo: 88, pctHi: 92 }];
    expect(planZone5_(blok, [55, 75, 90, 105]).tempo).toBe(10);
    expect(planZone5_(blok, [55, 75, 85, 105]).tempo).toBe(0);
    expect(planZone5_(blok, [55, 75, 85, 105]).drempel).toBe(20);
  });

  it("geeft een lege verdeling voor niet-array-invoer", () => {
    expect(planZone5_(null)).toEqual({
      rust: 0,
      z2: 0,
      tempo: 0,
      drempel: 0,
      anaeroob: 0,
    });
  });
});

describe("bibliotheekSignatuur — de vorm van de norm", () => {
  it("leidt 28/72 af uit de bibliotheek, zonder hardcoded fracties", () => {
    const sig = bibliotheekSignatuur();
    expect(sig.rust).toBe(0);
    expect(sig.z2).toBe(0);
    expect(Math.round(100 * sig.tempo)).toBe(28);
    expect(Math.round(100 * (sig.drempel + sig.anaeroob))).toBe(72);
    expect(sig.tempo + sig.drempel + sig.anaeroob).toBeCloseTo(1, 10);
  });

  it("beweegt mee met de grenzen: eigen zones geven een eigen vorm", () => {
    const eigen = bibliotheekSignatuur([55, 75, 85, 105]);
    expect(eigen.tempo).toBeLessThan(bibliotheekSignatuur().tempo);
  });

  it("de norm van 84 minuten valt in 24 tempo en 60 drempel-plus", () => {
    const sig = bibliotheekSignatuur();
    expect(Math.round(84 * sig.tempo)).toBe(24);
    expect(Math.round(84 * (sig.drempel + sig.anaeroob))).toBe(60);
  });
});
