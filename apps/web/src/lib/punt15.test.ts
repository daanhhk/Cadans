import {
  computeMacroPhase,
  genericCombo,
  tssFromBlokken_,
} from "@cadans/engine";
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

  it("intent, zones en tss — de tss komt sinds fase 3a uit de eigen blokken", () => {
    const wo = sessie();
    expect(wo.intent).toEqual({
      low: 15 + 45 + 10 + 15,
      high: 30,
      anaerobic: 0,
    });
    expect(wo.zones).toEqual(["low", "high"]);
    // HERIJKT bij fase 3a, en dat is geen verzwakking: deze assertie pinde met
    // `Math.round(totaalMin * 0.85)` precies de regel vast die fase 3a INTREKT. Beide kanten staan
    // er nu, zodat de test ook faalt als de twee ooit toevallig samenvallen.
    expect(wo.tss).toBe(tssFromBlokken_(wo.blokken));
    expect(wo.tss).not.toBe(Math.round(wo.totaalMin * 0.85));
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
  it("het FASE-quotum stuurt, niet alleen de uren-drempel", () => {
    // HERIJKT bij de Peak-quotum-ronde: `ftp` droeg dit mechanisme, maar draagt sinds die bouw
    // Peak 3 en kan het verschil dus niet meer laten zien. `Lange beklimmingen` draagt als ENIGE
    // nog Base 2 / Build 3 / Peak 2, dus daar blijft Build 3 tegen Peak 2 meetbaar. Dat is
    // herijking en geen verzwakking: het MECHANISME — `blokDosisNorm` leest `kwaliteitPerWeek`
    // en niet alleen `urenPrikkels` — staat er onverkort.
    expect(
      blokDosisNorm("Lange beklimmingen", 5, 0, undefined, "Build")?.prikkels,
    ).toBe(3);
    expect(
      blokDosisNorm("Lange beklimmingen", 5, 0, undefined, "Peak")?.prikkels,
    ).toBe(2);
    expect(
      blokDosisNorm("Lange beklimmingen", 5, 0, undefined, "Base")?.prikkels,
    ).toBe(2);
    // En de twee die naar 3 gingen geven nu in ALLE DRIE de fases 3 bij 5 weekuren.
    for (const f of ["Base", "Build", "Peak"]) {
      expect(blokDosisNorm("FTP", 5, 0, undefined, f)?.prikkels).toBe(3);
      expect(
        blokDosisNorm("Korte beklimmingen", 5, 0, undefined, f)?.prikkels,
      ).toBe(3);
    }
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
  // HERIJKT bij de Peak-quotum-ronde. FTP in PEAK is er UIT en staat als eigen geval hieronder:
  // het quotum ging daar van 2 naar 3, dus de norm van 56 naar 84 terwijl het plan van 70,0 naar
  // 78,0 werkminuten groeit — de norm stijgt harder dan het plan en het oordeel kantelt. Dat is
  // een BEDOELD gevolg van een besluit met herkomst PLAN, en geen bewijs tegen dat besluit: de
  // norm volgt het quotum, dus deze telling kan het quotum per constructie niet beoordelen
  // (docs/PUNT15-PEAKQUOTUM-BOUWDOC.md §2). Onderhoud en FTP in Base en Build bewegen niet.
  for (const doel of ["Onderhoud", "FTP"]) {
    for (const [naam, off] of Object.entries(FASE_OFFSET)) {
      if (naam === "Test") continue;
      if (doel === "FTP" && naam === "Peak") continue;
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

// ── FASE 3a — DE HENDEL EN DE TSS ───────────────────────────────────────────
// Spec: docs/PUNT15-FASE3-BOUWDOC.md §7. Twee termen op de ENGINE: de werktijd van de efforts
// schaalt met mesoFactor x dosisTredeFactor, begrensd door de Z2-basis, en de TSS komt uit de
// eigen blokken. Deze asserties landen HIER en niet in selftest.test.ts, om dezelfde reden als de
// bouwer-assertie van fase 1: (b) en (e) vouwen met `planZone5_`, en die woont in apps/web, waar
// packages/engine per constructie niet uit kan importeren. De rest staat ernaast zodat de hele
// fase op één plek te lezen is.

/** genericCombo op een gevraagde dagduur, met expliciete mesoweek en trede. */
function combo_(mins: number, mesoWeek: number, trede?: number) {
  return genericCombo(
    "combo_long_with_efforts",
    mins,
    { ftp: 280, lthr: 170, doel: "Korte beklimmingen" },
    mesoWeek,
    "Korte beklimmingen",
    trede,
  ) as never as {
    blokken: Blok[];
    totaalMin: number;
    intent: { low: number; high: number; anaerobic: number };
    tss: number;
    structuur: string[][];
  };
}

const effortsBlokken_ = (b: Blok[]) => b.filter((x) => x.pctLo === 85);

describe("punt 15 fase 3a — term 1, de hendel", () => {
  it("(a) f = 1 laat alles staan: 3x10, high 30, en de oude totaalMin", () => {
    for (const wo of [combo_(120, 1), combo_(120, 1, 0), combo_(120, 1)]) {
      expect(effortsBlokken_(wo.blokken).map((b) => b.minuten)).toEqual([
        10, 10, 10,
      ]);
      expect(wo.intent.high).toBe(30);
      expect(wo.totaalMin).toBe(120);
      expect(wo.blokken.reduce((a, b) => a + b.minuten, 0)).toBe(wo.totaalMin);
    }
  });

  it("(b) DE RUIMTE-REM: op een dag van 105 minuten is er geen ruimte, dus niets groeit", () => {
    // baseNominal is daar precies minBase (30), dus room 0 — ook op mesoWeek 3 met trede 4.
    for (const [mw, tr] of [
      [1, 0],
      [3, 0],
      [3, 4],
    ] as [number, number][]) {
      const wo = combo_(105, mw, tr);
      expect(effortsBlokken_(wo.blokken).map((b) => b.minuten)).toEqual([
        10, 10, 10,
      ]);
      expect(wo.totaalMin).toBe(105);
    }
  });

  it("(c) DE GROEI: op 150 minuten geeft mesoWeek 3 3x11,5 en met trede 4 3x15", () => {
    const a = combo_(150, 3, 0);
    expect(effortsBlokken_(a.blokken).map((b) => b.minuten)).toEqual([
      11.5, 11.5, 11.5,
    ]);
    expect(a.totaalMin).toBe(150);
    const b = combo_(150, 3, 4);
    expect(effortsBlokken_(b.blokken).map((b2) => b2.minuten)).toEqual([
      15, 15, 15,
    ]);
    expect(b.totaalMin).toBe(150);
    // De Z2-basis vangt het verschil exact op; totaalMin beweegt niet.
    const basis = (wo: typeof a) =>
      wo.blokken.find((x) => x.pctLo === 65)?.minuten ?? 0;
    expect(basis(a) - basis(b)).toBeCloseTo(3 * 15 - 3 * 11.5, 5);
    for (const wo of [a, b]) {
      expect(wo.blokken.reduce((x, y) => x + y.minuten, 0)).toBeCloseTo(
        wo.totaalMin,
        5,
      );
    }
    // En de structuur meldt wat er staat.
    expect(a.structuur.find((r) => r[0] === "Efforts")?.[1]).toBe("3x 11.5min");
  });

  it("(d) DE DELOAD-SPIEGEL: mesoWeek 4 zakt intent.high van 30 naar 18", () => {
    const vol = combo_(150, 1);
    const deload = combo_(150, 4);
    expect(vol.intent.high).toBe(30);
    expect(deload.intent.high).toBe(18);
    expect(deload.totaalMin).toBe(vol.totaalMin);
  });

  it("de band 85-92 en de intra-rust blijven ONGEMOEID — karakter-invariant", () => {
    const wo = combo_(150, 3, 4);
    for (const b of effortsBlokken_(wo.blokken)) {
      expect([b.pctLo, b.pctHi]).toEqual([85, 92]);
      expect(b.zone).toBe("tempo");
    }
    expect(
      wo.blokken.filter((b) => b.pctLo === 45).map((b) => b.minuten),
    ).toEqual([5, 5, 5]);
  });
});

describe("punt 15 fase 3a — term 2, de TSS", () => {
  it("(e) tss komt uit de blokken en NIET uit het vaste tarief", () => {
    for (const [mins, mw, tr] of [
      [120, 1, 0],
      [150, 3, 0],
      [240, 1, 0],
    ] as [number, number, number][]) {
      const wo = combo_(mins, mw, tr);
      expect(wo.tss).toBe(tssFromBlokken_(wo.blokken));
      expect(wo.tss).not.toBe(Math.round(wo.totaalMin * 0.85));
    }
  });
});

describe("punt 15 fase 3a — (f) de trede bereikt de zaterdag, via de producent", () => {
  /** De week zoals de app hem bouwt, op een gegeven dosis-trede. */
  function weekOpTrede(trede: number) {
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
      dosisTrede: trede,
    } as never) as { days: { datum: string }[] };
  }

  const werk = (r: { days: { datum: string }[] }) => {
    const blokken = r.days.flatMap((d) => rauweBlokkenVan_(d as never));
    const zm = planZone5_(blokken, ZONE5_GRENZEN_DEFAULT);
    return zm.tempo + zm.drempel + zm.anaeroob;
  };

  /** De werkminuten van UITSLUITEND de efforts-zaterdag. */
  const zaterdag = (r: { days: { datum: string }[] }) => {
    const d = r.days.find((x) => x.datum === iso(5));
    const zm = planZone5_(rauweBlokkenVan_(d as never), ZONE5_GRENZEN_DEFAULT);
    return zm.tempo + zm.drempel + zm.anaeroob;
  };

  it("trede 0 reproduceert de nulmeting, en trede 4 tilt de zaterdag mee", () => {
    const t0 = weekOpTrede(0);
    expect(werk(t0)).toBeCloseTo(68.5, 1);
    expect(zaterdag(t0)).toBeCloseTo(30, 1);
    // VOOR deze bouw stond de zaterdag op trede 4 óók nog op 30,0 en kwam de week op 79,5.
    const t4 = weekOpTrede(4);
    expect(zaterdag(t4)).toBeGreaterThan(30);
    expect(werk(t4)).toBeGreaterThan(79.5);
  });
});

// ── HET PEAK-QUOTUM — 3 VOOR klim_kort EN ftp ───────────────────────────────
// Spec: docs/PUNT15-PEAKQUOTUM-BOUWDOC.md. HERKOMST PLAN: de norm volgt het quotum via
// min(quotum, urenPrikkels), dus een geleverd-telling die het quotum beoordeelt meet zichzelf.
// Wat hier getoetst wordt is daarom het MECHANISME en de BEGRENZING, niet of 3 beter is dan 2.
describe("punt 15 — het Peak-quotum", () => {
  it("het extra slot brengt een DREMPEL-dag in de Peak-week, via de producent", () => {
    // Fixture uit de spec: doel Korte beklimmingen, doelStart 2026-06-01 → blokweek 9 = Peak.
    vi.setSystemTime(MAANDAG);
    const doelStart = iso(-56);
    const r = buildWeekProposal({
      settings: {
        ...SETTINGS,
        doel: "Korte beklimmingen",
        doelStart,
        weekUren: 5,
      },
      plannerDays: plannerDays(V1),
      events: [
        { datum: "2027-04-17", naam: "AGR", type: "race", prioriteit: "A" },
      ],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: iso(0),
    } as never) as { days: { datum: string }[] };

    const blokken = r.days.flatMap((d) => rauweBlokkenVan_(d as never));
    // DRIE dagen met kwaliteitsminuten — bij quotum 2 waren dat er twee.
    const kwaliteitsDagen = r.days.filter((d) => {
      const zm = planZone5_(
        rauweBlokkenVan_(d as never),
        ZONE5_GRENZEN_DEFAULT,
      );
      return zm.tempo + zm.drempel + zm.anaeroob > 0;
    }).length;
    expect(kwaliteitsDagen).toBe(3);
    // En de sessie die erbij komt is een DREMPELsessie: het element uit DOELEN-SPEC §3.3 dat bij
    // quotum 2 wegviel. Bij quotum 2 was de poortset tempo plus anaeroob.
    expect(werkzoneLabelsVan_(blokken)).toContain("drempel");
    // HERKOMST van de getallen (spec §5): 46,5 naar 68,5 werkminuten. Eén keer afronden, op de
    // gerapporteerde grootheid — nooit per deel.
    const zm = planZone5_(blokken, ZONE5_GRENZEN_DEFAULT);
    expect(zm.tempo + zm.drempel + zm.anaeroob).toBeCloseTo(68.5, 1);
  });

  it("BEGRENZING: alleen klim_kort en ftp bewegen, en alleen in Peak", () => {
    // De drie die NIET bewegen horen er expliciet bij, anders waaiert de wijziging later stil uit.
    for (const f of ["Base", "Build", "Peak"]) {
      expect(blokDosisNorm("FTP", 5, 0, undefined, f)?.prikkels).toBe(3);
      expect(
        blokDosisNorm("Korte beklimmingen", 5, 0, undefined, f)?.prikkels,
      ).toBe(3);
    }
    expect(
      blokDosisNorm("Lange beklimmingen", 5, 0, undefined, "Peak")?.prikkels,
    ).toBe(2);
    expect(blokDosisNorm("Conditie", 5, 0, undefined, "Peak")?.prikkels).toBe(
      2,
    );
    expect(blokDosisNorm("Onderhoud", 5, 0, undefined, "Peak")?.prikkels).toBe(
      3,
    );
  });

  it("GEVOLG DAT DE SPEC NIET NOEMDE: het oordeel van FTP in Peak kantelt op V1", () => {
    // De norm gaat van 56 naar 84 terwijl het plan van 70,0 naar 78,0 werkminuten groeit — de norm
    // stijgt harder. Een exact volgens plan gereden Peak-week leest daardoor als NIET geleverd.
    // Vastgelegd zodat het geen verrassing wordt, niet omdat het het besluit weerlegt.
    const b = blokOpPlan_("FTP", FASE_OFFSET.Peak);
    const r = buildBlokReferent({
      doelStart: b.doelStart,
      activities: b.activities,
      doel: "FTP",
      weekUren: 5,
      startMonday: b.blokStart,
      todayISO: schuif_(b.blokStart, 28),
      grenzen: ZONE5_GRENZEN_DEFAULT,
      weekplans: b.weekplans,
    });
    if (!r) throw new Error("referent onverwacht null");
    const w = r.weeks[0];
    if (!w) throw new Error("geen weken");
    expect(w.gevraagd).toBe(84);
    expect(
      w.geleverdTempo + w.geleverdDrempel + w.geleverdAnaeroob,
    ).toBeCloseTo(78, 1);
    expect(w.totaalOpNorm).toBe(false);
    expect(w.geleverdOk).toBe(false);
  });
});
