import { computeMacroPhase, genericCombo } from "@cadans/engine";
import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ActValuesRow } from "./activities";
import { blokDosisNorm, buildBlokReferent } from "./blok";
import { parseLocalDate } from "./dates";
import { buildWeekProposal } from "./proposal";
import { buildWeekplanEntries } from "./weekplanBlob";
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

// ── FASE 2 — DE MEETLAT KENT HET FASE-QUOTUM EN TELT HET TOTAAL ──────────────
// Spec: docs/PUNT15-FASE2-BOUWDOC.md. Twee onafhankelijke termen: de norm volgt het quotum uit
// PROFILES (term 1) en er komt een eis op de SOM van de werkminuten naast de per-zone-poort van
// punt 14 (term 2).

/** doelStart-offsets die elk een eigen macrofase raken; -84 zet blokweek 4 op week 12 = Test. */
const FASE_OFFSET = { Base: 0, Build: -28, Peak: -56, Test: -84 } as const;

describe("punt 15 fase 2 — term 1, de norm kent het fase-quotum", () => {
  it("Peak begrenst FTP op 2 prikkels, Build en Base laten 3 staan", () => {
    // PROFILES.ftp: Base 3, Build 3, Peak 2. Bij 5 weekuren gaf de oude regel altijd 3.
    expect(blokDosisNorm("FTP", 5, 0, undefined, "Base")?.prikkels).toBe(3);
    expect(blokDosisNorm("FTP", 5, 0, undefined, "Build")?.prikkels).toBe(3);
    expect(blokDosisNorm("FTP", 5, 0, undefined, "Peak")?.prikkels).toBe(2);
  });

  it("de uren-drempel blijft de bovengrens — het quotum verhoogt nooit", () => {
    // PROFILES.onderhoud draagt Peak 3, maar bij 4 uur mag het er niet meer dan 2 worden.
    expect(blokDosisNorm("Conditie", 4, 0, undefined, "Build")?.prikkels).toBe(
      2,
    );
  });

  it("ONDERHOUD is een speciaal geval van dezelfde regel — altijd 3", () => {
    for (const f of ["Base", "Build", "Peak", "Test"]) {
      expect(blokDosisNorm("Onderhoud", 3, 0, undefined, f)?.prikkels).toBe(3);
    }
  });

  it("een ONTBREKENDE fase-sleutel levert een EINDIG getal, geen NaN", () => {
    // `kwaliteitPerWeek` kent Base, Build en Peak en GEEN Test, terwijl computeMacroPhase in week
    // 12 "Test" teruggeeft en de referent ook voor blokweek 4 een `gevraagd` uitrekent. Zonder
    // terugval levert Math.min(undefined, 3) NaN op de kaart — die val sloeg bij punt 9 fase A
    // al een keer toe.
    for (const f of ["Test", "Onzin", ""]) {
      const n = blokDosisNorm("FTP", 5, 0, undefined, f);
      expect(Number.isFinite(n?.prikkels)).toBe(true);
      expect(Number.isFinite(n?.norm)).toBe(true);
      expect(Number.isFinite(n?.normTempo)).toBe(true);
    }
    // En zonder fase valt hij terug op precies het oude gedrag.
    expect(blokDosisNorm("FTP", 5)?.prikkels).toBe(3);
    expect(blokDosisNorm("FTP", 4)?.prikkels).toBe(2);
  });
});

describe("punt 15 fase 2 — de drie opbouwweken dragen dezelfde macrofase", () => {
  const fase = (doelStart: string, monday: string) =>
    (
      computeMacroPhase(
        parseLocalDate(doelStart) as Date,
        parseLocalDate(monday) as Date,
      ) as { fase: string; week: number }
    ).fase;

  it("blokweek 1 t/m 3 liggen per constructie in ÉÉN fase, in elk blok", () => {
    for (const [naam, off] of Object.entries(FASE_OFFSET)) {
      const doelStart = iso(off);
      const blokStart = iso(off === 0 ? 0 : 0); // het blok dat op de fixture-maandag begint
      const fases = [0, 7, 14].map((d) => fase(doelStart, iso(off + d)));
      expect(new Set(fases).size, `${naam}: ${fases.join(",")}`).toBe(1);
      void blokStart;
    }
  });

  it("alleen blokweek 4 van het DERDE blok valt op Test", () => {
    const doelStart = iso(FASE_OFFSET.Test);
    // Weken 9, 10 en 11 zijn Peak; week 12 is Test.
    expect(fase(doelStart, iso(FASE_OFFSET.Test + 8 * 7))).toBe("Peak");
    expect(fase(doelStart, iso(FASE_OFFSET.Test + 10 * 7))).toBe("Peak");
    expect(fase(doelStart, iso(FASE_OFFSET.Test + 11 * 7))).toBe("Test");
  });
});

// ── FASE 2 — DE KETEN, MET DE PRODUCENT IN DE LUS ────────────────────────────
// Geen handgezette ProposalWeek: buildWeekProposal bouwt de week, planZone5_ vouwt hem, en de
// activiteit draagt EXACT die zoneminuten. Alleen zo bewijst groen dat de producent de waarde
// ook levert.

/** Eén activiteit die exact deze zoneminuten draagt. idx0 Date, idx1 type, idx3 duur, idx15 sec. */
function ritMet_(datumISO: string, z: Record<string, number>): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row = new Array(17).fill(null) as ActValuesRow;
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 9, 0, 0);
  row[1] = "Ride";
  row[3] = Object.values(z).reduce((a, b) => a + b, 0);
  row[15] = JSON.stringify([
    { id: "Z1", secs: Math.round((z.rust ?? 0) * 60) },
    { id: "Z2", secs: Math.round((z.z2 ?? 0) * 60) },
    { id: "Z3", secs: Math.round((z.tempo ?? 0) * 60) },
    { id: "Z4", secs: Math.round((z.drempel ?? 0) * 60) },
    { id: "Z5", secs: Math.round((z.anaeroob ?? 0) * 60) },
  ]);
  return row;
}

const schuif_ = (monday: string, n: number) => {
  const [y, m, d] = monday.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** Een heel blok van vier weken: het echte plan per week, en per week één rit die het EXACT
 * uitvoert. `offset` bepaalt de macrofase via doelStart. */
function blokOpPlan_(doel: string, offset: number) {
  // Het BLOK begint op de fixture-maandag; `doelStart` schuift naar ACHTEREN zodat
  // computeMacroPhase op die maandag de bedoelde fase geeft. Zette je blokStart gelijk aan
  // doelStart, dan is elk blok blokweek 1 en dus altijd Base — en liggen de weken bovendien in
  // het verleden, waar de allocator zich anders gedraagt.
  const doelStart = iso(offset);
  const blokStart = iso(0);
  const weekplans: unknown[] = [];
  const activities: ActValuesRow[] = [];
  for (let i = 0; i < 4; i++) {
    const monday = schuif_(blokStart, i * 7);
    vi.setSystemTime(MAANDAG);
    const w = buildWeekProposal({
      settings: { ...SETTINGS, doel, doelStart },
      plannerDays: [0, 1, 2, 3, 4, 5, 6].map((n) => ({
        datum: schuif_(monday, n),
        train: V1[n] != null,
        dag: null,
        minuten: V1[n] ?? 0,
        dagtype: V1[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
        toelichting: null,
        voorgesteldType: null,
        gedaan: false,
      })),
      events: [],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: monday,
    } as never);
    const entries = buildWeekplanEntries(w as never, doel) as unknown[];
    weekplans.push(...entries);
    const rauw = entries.flatMap((e) => {
      const b = (e as { blokken?: unknown }).blokken;
      return Array.isArray(b) ? b : [];
    });
    const zm = planZone5_(rauw, ZONE5_GRENZEN_DEFAULT);
    activities.push(ritMet_(schuif_(monday, 1), zm as never));
  }
  return { doelStart, blokStart, weekplans, activities };
}

const referent_ = (doel: string, offset: number) => {
  const b = blokOpPlan_(doel, offset);
  return buildBlokReferent({
    doelStart: b.doelStart,
    activities: b.activities,
    doel,
    weekUren: 5,
    startMonday: b.blokStart,
    todayISO: schuif_(b.blokStart, 28),
    grenzen: ZONE5_GRENZEN_DEFAULT,
    weekplans: b.weekplans,
  });
};

describe("punt 15 fase 2 — de stop-condities: Onderhoud en FTP kantelen nergens", () => {
  for (const doel of ["Onderhoud", "FTP"]) {
    for (const [naam, off] of Object.entries(FASE_OFFSET)) {
      if (naam === "Test") continue;
      it(`${doel} in ${naam}: een EXACT volgens plan gereden week leest als geleverd`, () => {
        const r = referent_(doel, off);
        if (!r) throw new Error("referent onverwacht null");
        const opbouw = r.weeks.filter((w) => w.blokWeek <= 3 && w.telt);
        expect(opbouw.length).toBeGreaterThan(0);
        for (const w of opbouw) {
          expect(w.totaalOpNorm, `${doel} ${naam} ${w.weekMonday}`).toBe(true);
          expect(w.geleverdOk, `${doel} ${naam} ${w.weekMonday}`).toBe(true);
        }
      });
    }
  }
});

describe("punt 15 fase 2 — term 2, de eis op het totaal", () => {
  it("een week die op de ZONES slaagt maar op het TOTAAL zakt, leest als NIET geleverd", () => {
    const b = blokOpPlan_("Korte beklimmingen", FASE_OFFSET.Peak);
    // Zelfde plan, maar de ritten leveren in elke zone 40 procent minder. De poortset blijft
    // gelijk; wat verandert is uitsluitend het TOTAAL.
    const mager = b.activities.map((row) => {
      const zs = JSON.parse(String(row[15])) as { id: string; secs: number }[];
      const kopie = [...row] as ActValuesRow;
      kopie[15] = JSON.stringify(
        zs.map((z) => ({ id: z.id, secs: Math.round(z.secs * 0.6) })),
      );
      return kopie;
    });
    const r = buildBlokReferent({
      doelStart: b.doelStart,
      activities: mager,
      doel: "Korte beklimmingen",
      weekUren: 5,
      startMonday: b.blokStart,
      todayISO: schuif_(b.blokStart, 28),
      grenzen: ZONE5_GRENZEN_DEFAULT,
      weekplans: b.weekplans,
    });
    if (!r) throw new Error("referent onverwacht null");
    const geteld = r.weeks.filter((w) => w.telt);
    expect(geteld.length).toBeGreaterThan(0);
    for (const w of geteld) {
      expect(w.totaalOpNorm).toBe(false);
      expect(w.geleverdOk).toBe(false);
    }
  });

  it("totaalOpNorm is NULL zodra de week niet telt — geen oordeel is geen misser", () => {
    const b = blokOpPlan_("FTP", FASE_OFFSET.Base);
    const r = buildBlokReferent({
      doelStart: b.doelStart,
      activities: b.activities,
      doel: "FTP",
      weekUren: 5,
      startMonday: b.blokStart,
      todayISO: schuif_(b.blokStart, 28),
      grenzen: ZONE5_GRENZEN_DEFAULT,
      weekplans: [],
    });
    if (!r) throw new Error("referent onverwacht null");
    for (const w of r.weeks) {
      expect(w.telt).toBe(false);
      expect(w.totaalOpNorm).toBeNull();
      expect(w.geleverdOk).toBeNull();
    }
  });
});

// De DISCRIMINERENDE tegenproef op de CONJUNCTIE. De test hierboven zakt óók op de zones, dus hij
// kan niet zien of `geleverdOk` de totaal-eis werkelijk meeneemt — term 2 wordt daar gemaskeerd
// door het per-zone-oordeel. Dit geval levert de gepoorte zone EXACT zijn norm en verder niets,
// zodat de zones slagen en alleen het TOTAAL zakt. Dat is precies M3: de norm-massa van de zones
// buiten de poort verdampt.
describe("punt 15 fase 2 — zones geslaagd, totaal gezakt", () => {
  it("de conjunctie laat de week vallen op het TOTAAL alleen", () => {
    const b = blokOpPlan_("FTP", FASE_OFFSET.Build);
    const basis = buildBlokReferent({
      doelStart: b.doelStart,
      activities: b.activities,
      doel: "FTP",
      weekUren: 5,
      startMonday: b.blokStart,
      todayISO: schuif_(b.blokStart, 28),
      grenzen: ZONE5_GRENZEN_DEFAULT,
      weekplans: b.weekplans,
    });
    if (!basis) throw new Error("referent onverwacht null");
    const w0 = basis.weeks[0];
    if (!w0) throw new Error("geen weken");
    // De poortset is hier {drempel}: de enige zone die beoordeeld wordt.
    expect(w0.zonesVoorgeschreven).toEqual(["drempel"]);

    // Rijd EXACT de drempel-norm en verder geen enkele werkminuut.
    const kaal = [0, 7, 14, 21].map((d) =>
      ritMet_(schuif_(b.blokStart, d + 1), {
        rust: 30,
        z2: 120,
        tempo: 0,
        drempel: w0.gevraagdDrempel,
        anaeroob: 0,
      }),
    );
    const r = buildBlokReferent({
      doelStart: b.doelStart,
      activities: kaal,
      doel: "FTP",
      weekUren: 5,
      startMonday: b.blokStart,
      todayISO: schuif_(b.blokStart, 28),
      grenzen: ZONE5_GRENZEN_DEFAULT,
      weekplans: b.weekplans,
    });
    if (!r) throw new Error("referent onverwacht null");
    for (const w of r.weeks.filter((x) => x.telt)) {
      // De ZONES slagen: elke voorgeschreven zone haalt haar eigen norm.
      expect(w.zonesOpNorm).toBe(w.zonesVoorgeschreven.length);
      // Het TOTAAL zakt: de norm-massa buiten de poort ontbreekt.
      expect(
        w.geleverdDrempel + w.geleverdTempo + w.geleverdAnaeroob,
      ).toBeLessThan(w.gevraagd);
      expect(w.totaalOpNorm).toBe(false);
      // En dus valt de week — dat is de CONJUNCTIE, en zonder term 2 zou dit true zijn.
      expect(w.geleverdOk).toBe(false);
    }
  });
});
