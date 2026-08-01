import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import { blokUitvoering, buildBlokReferent } from "./blok";
import { buildWeekProposal } from "./proposal";
import { buildWeekplanEntries } from "./weekplanBlob";
import { werkzoneLabelsVan_ } from "./zonelabels";
import { planZone5_, ZONE5_GRENZEN_DEFAULT } from "./zonemunt";

// ROADMAP punt 14 fase 1 — DE ZONE-POORT MET DE PRODUCENT IN DE LUS.
// Spec: docs/PUNT14-BOUWDOC.md §5.
//
// DE INVARIANT die deze bouw moet leveren: een week die EXACT volgens plan is gereden leest als
// GELEVERD. De vorige waarde wordt daarom nergens met de hand in een nagebouwd object gezet — de
// test roept `buildWeekProposal` aan, vouwt de uitkomst met `planZone5_` (dezelfde functie waarmee
// de norm zijn vorm krijgt) en bouwt daaruit de activiteit. Zonder die keten zou groen alleen
// bewijzen dat de CONSUMENT werkt, nooit dat de producent die waarde ooit levert.

const MAANDAG = new Date(2026, 5, 29, 8, 0, 0); // ma 2026-06-29
const START = "2026-06-29";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 5, 29 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/** V1 uit weekvormAs.test.ts: ma60 di60 do60 za120. */
const V1: Record<number, number> = { 0: 60, 1: 60, 3: 60, 5: 120 };

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "Onderhoud",
  doelStart: START,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
  weekUren: 5,
} as unknown as SettingsInput;

const PLANNER: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  datum: iso(n),
  train: V1[n] != null,
  dag: null,
  minuten: V1[n] ?? 0,
  dagtype: V1[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
  toelichting: null,
  voorgesteldType: null,
  gedaan: false,
}));

/** De ECHTE weekplan-entries van een schone run op de weekmaandag. */
function planVoorWeek(weekMonday: string) {
  vi.setSystemTime(MAANDAG);
  const w = buildWeekProposal({
    settings: { ...SETTINGS, doelStart: START },
    plannerDays: PLANNER.map((d, n) => ({
      ...d,
      datum: verschuif_(weekMonday, n),
    })),
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: weekMonday,
  } as never);
  return buildWeekplanEntries(w as never, "Onderhoud") as unknown[];
}

function verschuif_(monday: string, n: number) {
  const [y, m, d] = monday.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Alle rauwe blokken van een entry-lijst. */
const blokkenVan = (entries: unknown[]) =>
  entries.flatMap((e) => {
    const b = (e as { blokken?: unknown }).blokken;
    return Array.isArray(b) ? b : [];
  });

/**
 * Eén activiteit die EXACT de gevouwen zone-minuten van een plandag draagt. idx0 Date, idx1 type,
 * idx3 duur, idx15 zonetijden in SECONDEN.
 */
function ritMet(datumISO: string, z: Record<string, number>): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row = new Array(17).fill(null) as ActValuesRow;
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 9, 0, 0);
  row[1] = "Ride";
  const tot = Object.values(z).reduce((a, b) => a + b, 0);
  row[3] = tot;
  row[15] = JSON.stringify([
    { id: "Z1", secs: Math.round((z.rust ?? 0) * 60) },
    { id: "Z2", secs: Math.round((z.z2 ?? 0) * 60) },
    { id: "Z3", secs: Math.round((z.tempo ?? 0) * 60) },
    { id: "Z4", secs: Math.round((z.drempel ?? 0) * 60) },
    { id: "Z5", secs: Math.round((z.anaeroob ?? 0) * 60) },
  ]);
  return row;
}

/** Het hele blok: vier weken plan, en per week één rit die het plan exact uitvoert. */
function blokMetPlan(extra: Partial<Record<string, number>> = {}) {
  const weekplans: unknown[] = [];
  const activities: ActValuesRow[] = [];
  for (let i = 0; i < 4; i++) {
    const monday = verschuif_(START, i * 7);
    const entries = planVoorWeek(monday);
    weekplans.push(...entries);
    const zm = planZone5_(blokkenVan(entries), ZONE5_GRENZEN_DEFAULT);
    activities.push(
      ritMet(verschuif_(monday, 1), {
        rust: zm.rust,
        z2: zm.z2,
        tempo: zm.tempo + (extra.tempo ?? 0),
        drempel: zm.drempel + (extra.drempel ?? 0),
        anaeroob: zm.anaeroob + (extra.anaeroob ?? 0),
      }),
    );
  }
  return { weekplans, activities };
}

const referent = (o: { weekplans: unknown[]; activities: ActValuesRow[] }) =>
  buildBlokReferent({
    activities: o.activities,
    doel: "Onderhoud",
    weekUren: 5,
    startMonday: START,
    todayISO: "2026-07-27",
    grenzen: ZONE5_GRENZEN_DEFAULT,
    weekplans: o.weekplans,
  });

describe("punt 14 — de zone-poort, met de producent in de lus", () => {
  it("(A) een week die EXACT volgens plan is gereden leest als geleverd", () => {
    const r = referent(blokMetPlan());
    expect(r).not.toBeNull();
    const beoordeeld = (r?.weeks ?? []).filter((w) => w.telt);
    expect(beoordeeld.length).toBeGreaterThan(0);
    for (const w of beoordeeld) expect(w.geleverdOk).toBe(true);
  });

  it("(B) de poortset van die week is exact tempo en drempel — anaeroob NIET", () => {
    // Expliciet, zodat deze test niet stil doodgaat als de vouwing ooit verschuift: dan valt
    // (A) niet om maar deze wel, en dan weet je meteen waar het aan ligt.
    const { weekplans } = blokMetPlan();
    const labels = werkzoneLabelsVan_(blokkenVan(weekplans));
    expect(labels).toEqual(["tempo", "drempel"]);
    expect(labels).not.toContain("anaeroob");
    const r = referent(blokMetPlan());
    for (const w of (r?.weeks ?? []).filter((x) => x.telt)) {
      expect(w.zonesVoorgeschreven).toEqual(["tempo", "drempel"]);
    }
  });

  it("(C) TEGENPROEF: één minuut ONDER de norm in een VOORGESCHREVEN zone laat de week vallen", () => {
    // De poort weert BANDOVERLOOP, geen klein tekort. Drempel staat op het plan, dus één minuut
    // onder de NORM moet de week laten vallen — hoe klein dat tekort ook is.
    //
    // "Exact volgens plan" ligt BOVEN de norm (dat is waarom (A) groen is), dus simpelweg één
    // minuut van het plan aftrekken zakt er niet doorheen. De norm komt daarom uit de referent
    // zelf, en de rit levert precies één minuut minder dan dat.
    const basis = blokMetPlan();
    const norm = referent(basis)?.weeks[0]?.gevraagdDrempel;
    expect(typeof norm).toBe("number");

    const activities: ActValuesRow[] = [];
    for (let i = 0; i < 4; i++) {
      const monday = verschuif_(START, i * 7);
      const entries = planVoorWeek(monday);
      const zm = planZone5_(blokkenVan(entries), ZONE5_GRENZEN_DEFAULT);
      activities.push(
        ritMet(verschuif_(monday, 1), {
          rust: zm.rust,
          z2: zm.z2,
          tempo: zm.tempo,
          drempel: (norm as number) - 1,
          anaeroob: zm.anaeroob,
        }),
      );
    }
    const r = referent({ weekplans: basis.weekplans, activities });
    const beoordeeld = (r?.weeks ?? []).filter((w) => w.telt);
    expect(beoordeeld.length).toBeGreaterThan(0);
    for (const w of beoordeeld) {
      expect(w.geleverdDrempel).toBeLessThan(w.gevraagdDrempel);
      expect(w.geleverdOk).toBe(false);
    }
  });

  it("(E) de DIAGNOSE noemt alleen voorgeschreven zones", () => {
    // Een gemiste week heeft ook anaeroob onder norm — de norm vraagt ze, het plan programmeert ze
    // niet. Zonder de poort op `tekortPerZone` zou de coach "VO2max kwam het vaakst tekort"
    // melden over een zone die die week nooit gevraagd is.
    const basis = blokMetPlan();
    const norm = referent(basis)?.weeks[0]?.gevraagdDrempel;
    const activities: ActValuesRow[] = [];
    for (let i = 0; i < 4; i++) {
      const monday = verschuif_(START, i * 7);
      const entries = planVoorWeek(monday);
      const zm = planZone5_(blokkenVan(entries), ZONE5_GRENZEN_DEFAULT);
      activities.push(
        ritMet(verschuif_(monday, 1), {
          rust: zm.rust,
          z2: zm.z2,
          tempo: zm.tempo,
          drempel: (norm as number) - 1,
          anaeroob: zm.anaeroob,
        }),
      );
    }
    const r = referent({ weekplans: basis.weekplans, activities });
    if (!r) throw new Error("referent onverwacht null");
    const u = blokUitvoering(r);
    expect(u.tekortZones).toEqual(["drempel"]);
    expect(u.tekortZones).not.toContain("anaeroob");
  });

  it("(D/G) een blok ZONDER ENIG bewaard weekplan zwijgt — telt false, niet 'niet geleverd'", () => {
    const { activities } = blokMetPlan();
    const r = referent({ weekplans: [], activities });
    expect(r).not.toBeNull();
    for (const w of r?.weeks ?? []) {
      expect(w.poortHerkomst).toBe("geen");
      expect(w.telt).toBe(false);
      // En NIET geleverdOk false: een datagat is geen misser.
      expect(w.geleverdOk).toBeNull();
    }
  });
});

// ── FASE 1b — DE POORT IS EEN BLOK-EIGENSCHAP ────────────────────────────────
// De bewaarde weekplannen zijn er meestal NIET: op prod 2 van de laatste 12 maandagen, lokaal 1
// van de 4 opbouwweken. Met een poort per week zwijgt de terugblik dan volledig — precies wat de
// shots van fase 1 lieten zien. De blokpoort is de vereniging over het blok; binnen één blok
// liggen doel en fase vast, dus dat is bewijs uit dezelfde bron.
describe("punt 14 fase 1b — de blokpoort", () => {
  it("(F) ÉÉN bewaarde week draagt het hele blok, en de op-plan-week leest als geleverd", () => {
    const basis = blokMetPlan();
    // Alleen de entries van de TWEEDE opbouwweek bewaren.
    const tweede = verschuif_(START, 7);
    const zondag = verschuif_(tweede, 6);
    const alleenTweede = basis.weekplans.filter((e) => {
      const d = (e as { datum?: unknown }).datum;
      return typeof d === "string" && d >= tweede && d <= zondag;
    });
    expect(alleenTweede.length).toBeGreaterThan(0);

    const r = referent({
      weekplans: alleenTweede,
      activities: basis.activities,
    });
    if (!r) throw new Error("referent onverwacht null");
    const opbouw = r.weeks.filter((w) => w.blokWeek <= 3);
    for (const w of opbouw) expect(w.telt).toBe(true);
    expect(opbouw[0]?.poortHerkomst).toBe("blok");
    expect(opbouw[1]?.poortHerkomst).toBe("week");
    expect(opbouw[2]?.poortHerkomst).toBe("blok");
    // En het oordeel staat: exact volgens plan gereden is geleverd.
    for (const w of opbouw) expect(w.geleverdOk).toBe(true);
  });

  it("(H) de EIGEN weekpoort wint van de blokpoort", () => {
    const basis = blokMetPlan();
    // Week 1 krijgt een eigen plan dat ALLEEN drempel voorschrijft; de rest van het blok draagt
    // de echte entries, waarvan de blokpoort ook tempo bevat.
    const eerste = verschuif_(START, 0);
    const zondagEerste = verschuif_(eerste, 6);
    const rest = basis.weekplans.filter((e) => {
      const d = (e as { datum?: unknown }).datum;
      return typeof d === "string" && (d < eerste || d > zondagEerste);
    });
    const eigen = {
      datum: verschuif_(eerste, 1),
      blokken: [{ minuten: 45, zone: "drempel", pctLo: 92, pctHi: 100 }],
    };
    const r = referent({
      weekplans: [eigen, ...rest],
      activities: basis.activities,
    });
    if (!r) throw new Error("referent onverwacht null");
    const w1 = r.weeks[0];
    expect(w1?.poortHerkomst).toBe("week");
    expect(w1?.zonesVoorgeschreven).toEqual(["drempel"]);
    // De blokpoort draagt WEL tempo — die week wordt er dus niet op beoordeeld.
    const blokPoortBreder = r.weeks.some((w) =>
      w.zonesVoorgeschreven.includes("tempo"),
    );
    expect(blokPoortBreder).toBe(true);
    expect(w1?.zonesVoorgeschreven).not.toContain("tempo");
  });
});
