import { ARCHETYPES, expandArchetype_ } from "@cadans/engine";
import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal } from "./proposal";
import { werkzoneLabelsVan_ } from "./zonelabels";

// ROADMAP punt 43 — HET CORE-WERKBLOK OPENT ZIJN HELE BAND.
// Spec: docs/PUNT43-BOUW-RECON.md §9.
//
// Het defect: `sweetspot_3x8` schrijft 88-92 voor (midpunt 90 → `tempo`) en `sweetspot_4x12`
// schrijft 89-92 voor (midpunt 90,5 → `drempel`). Eén procentpunt op de ondergrens, dezelfde
// bedoeling, tegengestelde normpoort. De reparatie laat een blok mét `coreWork` zijn hele band
// openen; het midpunt-label blijft er onvoorwaardelijk in, dus de poort kan alleen GROEIEN.
//
// GEEN handgezette poortset: T2 tot en met T5 roepen de ECHTE producent aan
// (`buildWeekProposal`, `expandArchetype_`) en lezen `blokken` zoals die eruit komen. Alleen T1
// bouwt één blok met de hand, en dat is bewust — die toets gaat over de POORT zelf en niet over
// de pijplijn erachter.

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

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: START,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

function week_(vorm: Record<number, number>): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: vorm[n] != null,
    dag: null,
    minuten: vorm[n] ?? 0,
    dagtype: vorm[n] == null ? null : n === 5 || n === 6 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

function bouw_(vorm: Record<number, number>, doel = "FTP") {
  return buildWeekProposal({
    settings: { ...SETTINGS, doel },
    plannerDays: week_(vorm),
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: START,
  });
}

/** Alle rauwe engine-blokken van een gebouwde week, per dag. */
function blokkenPerDag_(w: ReturnType<typeof bouw_>): unknown[][] {
  return w.days.map((d) =>
    (d.sessions ?? [])
      .map((s) => (s as { blokken?: unknown }).blokken)
      .filter((b): b is unknown[] => Array.isArray(b))
      .flat(),
  );
}

/** Dezelfde blokken, maar per SESSIE — een dag kan er meer dan één dragen. */
function blokkenPerSessie_(w: ReturnType<typeof bouw_>): unknown[][] {
  return w.days
    .flatMap((d) => d.sessions ?? [])
    .map((s) => (s as { blokken?: unknown }).blokken)
    .filter((b): b is unknown[] => Array.isArray(b) && b.length > 0);
}

const isLaag_ = (b: unknown) => {
  const z = (b as { zone?: unknown }).zone;
  return z === "rust" || z === "z2";
};

/** Dezelfde blokken, maar met `coreWork` eraf — de staat van vóór deze bouw. */
function zonderCoreWork_(blokken: unknown[]): unknown[] {
  return blokken.map((b) => {
    const { coreWork: _weg, ...rest } = b as Record<string, unknown>;
    return rest;
  });
}

describe("punt 43 — een core-werkblok opent zijn hele band", () => {
  it("T1 — hetzelfde blok mét en zonder coreWork geeft een andere poortset", () => {
    const band = { minuten: 10, zone: "tempo", pctLo: 88, pctHi: 92 };

    // MET de vlag: 88 valt in tempo, 91 en 92 in drempel — de band raakt allebei.
    expect(werkzoneLabelsVan_([{ ...band, coreWork: true }])).toEqual([
      "tempo",
      "drempel",
    ]);
    // ZONDER: alleen het midpunt-label, precies het gedrag van vóór deze bouw.
    expect(werkzoneLabelsVan_([band])).toEqual(["tempo"]);
  });

  it("T2 — de poort is over een hele week nooit SMALLER dan vóór de bouw", () => {
    // Drie doelen, zodat de lus niet op één archetype-rotatie leunt.
    let dagenGeteld = 0;
    let dagenBreder = 0;
    for (const doel of ["FTP", "Korte beklimmingen", "Lange beklimmingen"]) {
      for (const dag of blokkenPerDag_(
        bouw_({ 0: 60, 1: 60, 3: 60, 5: 120 }, doel),
      )) {
        if (dag.length === 0) continue;
        dagenGeteld++;
        const na = werkzoneLabelsVan_(dag);
        const voor = werkzoneLabelsVan_(zonderCoreWork_(dag));
        // Monotonie: elke zone die de OUDE poort gaf, geeft de nieuwe ook.
        for (const z of voor) expect(na).toContain(z);
        if (na.length > voor.length) dagenBreder++;
      }
    }
    expect(dagenGeteld).toBeGreaterThan(0);
    // En de poort doet aantoonbaar iets: zonder deze regel zou groen ook volgen
    // uit een tak die nooit vuurt.
    expect(dagenBreder).toBeGreaterThan(0);
  });

  it("T3 — de producent zet coreWork op de core en NERGENS anders", () => {
    const sweet = (ARCHETYPES as { id: string }[]).filter((a) =>
      a.id.startsWith("sweetspot"),
    );
    expect(sweet.length).toBeGreaterThan(0);

    let metVlag = 0;
    let zonderVlag = 0;
    for (const rec of sweet) {
      const uit = expandArchetype_(rec, { ftp: 280, lthr: 170 }) as {
        blokken: { zone: string; coreWork?: boolean }[];
        structuur: unknown[];
      };
      for (const b of uit.blokken) {
        if (b.coreWork === true) {
          metVlag++;
          // Een core-werkblok van een sweetspot-archetype ligt nooit in rust of z2.
          expect(["tempo", "drempel", "anaeroob"]).toContain(b.zone);
        } else {
          zonderVlag++;
        }
      }
      // Elk sweetspot-archetype levert minstens één core-werkblok...
      expect(uit.blokken.some((b) => b.coreWork === true)).toBe(true);
      // ...en warmup plus cooldown dragen de vlag NIET, dus er blijft altijd iets over.
      expect(uit.blokken.some((b) => b.coreWork !== true)).toBe(true);
    }
    expect(metVlag).toBeGreaterThan(0);
    expect(zonderVlag).toBeGreaterThan(0);
  });

  it("T4 — duurwerk draagt nergens coreWork, ook niet uit de variant-bouwer", () => {
    // LET OP DE PRODUCENT. De meeste dagen komen uit `expandArchetype_`; hun rust- en z2-blokken
    // zijn warmup, fill en cooldown, en die dragen de vlag sowieso niet. De tak die hier bewaakt
    // moet worden is `renderVariant_`: een variant met zone "low" (de `long_z2`-pool, steady op
    // 68-75%) levert een sessie die van kop tot staart duurwerk is. Dat is de `73-77`-band waarop
    // de aandeel-kandidaat van ronde 1 vastliep — de band kan over de z2/tempo-grens lopen.
    const sessies = blokkenPerSessie_(bouw_({ 0: 60, 1: 60, 3: 60, 5: 120 }));

    // (a) de week BEVAT zo'n sessie — zonder deze eis bewijst de rest niets.
    const duurSessies = sessies.filter((s) => s.every(isLaag_));
    expect(duurSessies.length).toBeGreaterThan(0);
    for (const s of duurSessies) {
      for (const b of s)
        expect((b as { coreWork?: unknown }).coreWork).not.toBe(true);
      // En de poort opent op zo'n sessie geen enkele werkzone uit bandoverloop.
      expect(werkzoneLabelsVan_(s)).toEqual([]);
    }

    // (b) breder: NERGENS in de week draagt een rust- of z2-blok de vlag, ongeacht producent.
    let laagGeteld = 0;
    for (const s of sessies)
      for (const b of s.filter(isLaag_)) {
        laagGeteld++;
        expect((b as { coreWork?: unknown }).coreWork).not.toBe(true);
      }
    expect(laagGeteld).toBeGreaterThan(0);
  });

  it("T5 — een bewaarde rij zonder coreWork valt terug op het midpunt-label", () => {
    let geteld = 0;
    for (const dag of blokkenPerDag_(bouw_({ 0: 60, 1: 60, 3: 60, 5: 120 }))) {
      if (dag.length === 0) continue;
      geteld++;
      const gestript = zonderCoreWork_(dag);
      // De terugval is het OUDE gedrag: uitsluitend de `zone`-labels van de blokken.
      const alleenMidpunt = ["tempo", "drempel", "anaeroob"].filter((z) =>
        gestript.some((b) => {
          const o = b as { zone?: unknown; minuten?: unknown };
          return o.zone === z && Number(o.minuten) > 0;
        }),
      );
      expect(werkzoneLabelsVan_(gestript)).toEqual(alleenMidpunt);
    }
    expect(geteld).toBeGreaterThan(0);
  });
});
