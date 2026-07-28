import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type BlokReview, blokDosisNorm, dosisTredeVoorstel } from "./blok";
import { buildWeekProposal } from "./proposal";

// ROADMAP stap 2 fase 3 — de trede end-to-end via buildWeekProposal, plus de poorten van de
// kaart. De LADDER kon in fase 1 niet op weekniveau verankerd worden (de seam reikte toen niet
// tot de client); hier wel.

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

function settings(pendelDuurMin: number): SettingsInput {
  return {
    ftp: 280,
    lthr: null,
    gewicht: 75,
    doel: "FTP",
    doelStart: "2026-06-29",
    hrMax: null,
    hrRest: null,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin,
    pendelAantal: 2,
  };
}

function plannerDays(
  min: Record<number, number>,
  pendel: number[],
): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: min[n] != null,
    dag: null,
    minuten: min[n] ?? 0,
    dagtype:
      min[n] == null
        ? null
        : pendel.indexOf(n) >= 0
          ? "pendel"
          : n === 5 || n === 6
            ? "weekend"
            : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

/** Dezelfde zeven weekvormen als de weekvorm-as, zodat de reeksen vergelijkbaar zijn. */
const VORMEN: {
  min: Record<number, number>;
  pendel: number[];
  pendelDuurMin: number;
  dagOffset?: number;
}[] = [
  { min: { 0: 60, 1: 60, 3: 60, 5: 120 }, pendel: [], pendelDuurMin: 80 },
  { min: { 0: 90, 1: 90, 3: 90, 5: 210 }, pendel: [], pendelDuurMin: 80 },
  {
    min: { 0: 70, 1: 70, 3: 70, 5: 180, 6: 90 },
    pendel: [],
    pendelDuurMin: 80,
  },
  { min: { 0: 60, 1: 60, 3: 60, 5: 240 }, pendel: [], pendelDuurMin: 80 },
  {
    min: { 0: 60, 1: 80, 2: 80, 3: 80, 5: 120 },
    pendel: [1, 2, 3],
    pendelDuurMin: 40,
  },
  {
    min: { 0: 60, 1: 60, 3: 60, 5: 120 },
    pendel: [],
    pendelDuurMin: 80,
    dagOffset: 1,
  },
  { min: { 1: 60, 4: 90, 5: 180, 6: 120 }, pendel: [], pendelDuurMin: 80 },
];

function kwalMinuten(trede: number): number[] {
  return VORMEN.map((v) => {
    const off = v.dagOffset ?? 0;
    vi.setSystemTime(new Date(2026, 6, 27 + off, 8, 0, 0));
    const r = buildWeekProposal({
      settings: settings(v.pendelDuurMin),
      plannerDays: plannerDays(v.min, v.pendel),
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
      todayISO: iso(off),
      dosisTrede: trede,
    } as never);
    let k = 0;
    for (const d of (r as { days: unknown[] }).days) {
      for (const s of ((d as { sessions?: unknown[] }).sessions ?? []) as {
        intent?: { high?: number; anaerobic?: number };
      }[]) {
        k += (Number(s.intent?.high) || 0) + (Number(s.intent?.anaerobic) || 0);
      }
    }
    return Math.round(k);
  });
}

describe("dosis-trede: de ladder via buildWeekProposal", () => {
  // (a) trede 0 is byte-identiek aan de gepubliceerde as — de garantie dat niets lekt.
  it("trede 0 reproduceert de weekvorm-as", () => {
    expect(kwalMinuten(0)).toEqual([93, 113, 113, 105, 84, 93, 90]);
  });

  it("trede 1 en trede 2 reproduceren de gemeten ladder", () => {
    expect(kwalMinuten(1)).toEqual([101, 121, 121, 113, 90, 101, 98]);
    expect(kwalMinuten(2)).toEqual([106, 130, 129, 120, 96, 106, 103]);
  });

  it("de norm loopt mee met de trede", () => {
    expect(blokDosisNorm("FTP", 5, 0)?.norm).toBe(84);
    expect(blokDosisNorm("FTP", 5, 1)?.norm).toBe(90);
    expect(blokDosisNorm("FTP", 5, 2)?.norm).toBe(96);
    expect(blokDosisNorm("FTP", 5, 3)?.norm).toBe(102);
    expect(blokDosisNorm("FTP", 5, 4)?.norm).toBe(108);
  });

  // (b) DE REM. Vanaf trede 3 haalt de krapste weekvorm (V5, index 4) zijn eigen norm niet meer.
  // "Geleverd" is de voorwaarde om te stijgen, dus de ladder houdt daar vanzelf stil. Zonder
  // deze assertie is die zelfbegrenzing een claim zonder bewaking.
  it("de rem: vanaf trede 3 ligt het plan van de krapste vorm ONDER de norm", () => {
    const t3 = kwalMinuten(3)[4];
    const t4 = kwalMinuten(4)[4];
    expect(t3).toBe(100);
    expect(blokDosisNorm("FTP", 5, 3)?.norm).toBe(102);
    expect(t3).toBeLessThan(blokDosisNorm("FTP", 5, 3)?.norm ?? 0);
    expect(t4).toBe(106);
    expect(blokDosisNorm("FTP", 5, 4)?.norm).toBe(108);
    expect(t4).toBeLessThan(blokDosisNorm("FTP", 5, 4)?.norm ?? 0);
  });
});

// ── (e) DE POORTEN ───────────────────────────────────────────────────────
const REVIEW: BlokReview = {
  startMonday: "2026-06-29",
  eindMonday: "2026-07-20",
  fase: "afgerond",
  doel: "FTP",
  norm: 84,
  weekUren: 5,
  weeks: [],
  uitvoering: { geleverd: true, geleverdeWeken: 3, beoordeeldeWeken: 3 },
  check: {
    uitkomst: "geleverd_niet_gestegen",
    geleverdeWeken: 3,
    beoordeeldeWeken: 3,
    ctlDelta: -2.7,
    gestegen: false,
  },
  ctlDelta: -2.7,
  effect: null,
} as unknown as BlokReview;

const BASIS = {
  review: REVIEW,
  doelStart: "2026-06-29",
  weekMondayISO: "2026-07-27",
  doel: "FTP",
  weekUren: 5,
  trede: 0,
  beantwoordBlok: null as string | null,
};

describe("dosis-trede: de poorten van de kaart", () => {
  it("alles goed → een voorstel, met de blokstart van het LOPENDE blok", () => {
    const v = dosisTredeVoorstel(BASIS);
    expect(v).not.toBeNull();
    expect(v?.huidig).toBe(0);
    expect(v?.volgend).toBe(1);
    expect(v?.minNu).toBe(28);
    expect(v?.minStraks).toBe(30);
    expect(v?.normNu).toBe(84);
    expect(v?.normStraks).toBe(90);
    expect(v?.blokStart).toBe("2026-07-27");
    expect(v?.uitkomst).toBe("geleverd_niet_gestegen");
  });

  it("geen blokweek 1 → geen kaart", () => {
    expect(
      dosisTredeVoorstel({ ...BASIS, weekMondayISO: "2026-08-03" }),
    ).toBeNull();
  });

  it("uitkomst niet_geleverd → geen kaart", () => {
    const r = {
      ...REVIEW,
      check: { ...REVIEW.check, uitkomst: "niet_geleverd" },
    } as unknown as BlokReview;
    expect(dosisTredeVoorstel({ ...BASIS, review: r })).toBeNull();
  });

  it("blokCheck null → geen kaart", () => {
    const r = { ...REVIEW, check: null } as unknown as BlokReview;
    expect(dosisTredeVoorstel({ ...BASIS, review: r })).toBeNull();
  });

  it("review null of fase lopend → geen kaart", () => {
    expect(dosisTredeVoorstel({ ...BASIS, review: null })).toBeNull();
    const r = { ...REVIEW, fase: "lopend" } as unknown as BlokReview;
    expect(dosisTredeVoorstel({ ...BASIS, review: r })).toBeNull();
  });

  it("trede op het plafond → geen kaart", () => {
    expect(dosisTredeVoorstel({ ...BASIS, trede: 4 })).toBeNull();
    expect(dosisTredeVoorstel({ ...BASIS, trede: 3 })).not.toBeNull();
  });

  it("al beantwoord voor DIT blok → geen kaart; voor een ander blok wél", () => {
    expect(
      dosisTredeVoorstel({ ...BASIS, beantwoordBlok: "2026-07-27" }),
    ).toBeNull();
    expect(
      dosisTredeVoorstel({ ...BASIS, beantwoordBlok: "2026-06-29" }),
    ).not.toBeNull();
  });

  it("geleverd_gestegen krijgt de andere tak", () => {
    const r = {
      ...REVIEW,
      check: { ...REVIEW.check, uitkomst: "geleverd_gestegen", gestegen: true },
    } as unknown as BlokReview;
    expect(dosisTredeVoorstel({ ...BASIS, review: r })?.uitkomst).toBe(
      "geleverd_gestegen",
    );
  });
});

describe("dosis-trede: de leesregel bij een doel-wissel", () => {
  // De trede geldt alleen voor het doel waarop hij is opgebouwd. schema.ts leest hem dan als 0;
  // hier verifiëren we de rekenkundige kant: een andere basis geeft een andere norm, dus een
  // trede die van een ander doel komt zou de norm verkeerd optillen.
  it("de basis is doel-eigen, dus een trede reist niet mee", () => {
    expect(blokDosisNorm("FTP", 5, 0)?.minPerPrikkel).toBe(28);
    expect(blokDosisNorm("Onderhoud", 5, 0)?.minPerPrikkel).toBe(22);
    expect(blokDosisNorm("FTP", 5, 2)?.minPerPrikkel).toBe(32);
    expect(blokDosisNorm("Onderhoud", 5, 2)?.minPerPrikkel).toBe(26);
  });

  it("trede 0, null en undefined geven dezelfde norm", () => {
    const nul = blokDosisNorm("FTP", 5, 0);
    expect(blokDosisNorm("FTP", 5, null)).toEqual(nul);
    expect(blokDosisNorm("FTP", 5)).toEqual(nul);
  });
});
