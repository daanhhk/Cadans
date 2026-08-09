import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal, herstelSchaal_ } from "./proposal";

// ROADMAP punt 39 + 45 — DE HERSTELWEEK SNIJDT IN DE SESSIEDUUR (M86), AFGEZET TEGEN DE
// OPBOUWWEKEN (M87).
// Spec: docs/PUNT39-PLEK-RECON.md §9. De plek is CLIENT-SIDE op `sessieMin`; de engine-plek vóór
// de allocator is gemeten en verworpen omdat hij de werkband in 31 van de 56 cellen kantelt (M76).
//
// DE HERSTELWEEK WORDT MET `mesoWeekOverride: 4` GEZET en niet met de klok. Reden: de kalender-
// mesoweek hangt aan `doelStart` en zou de test aan een datum binden die met elke ronde verschuift;
// de override is precies de hendel die de fatigue-wat-als ook gebruikt, dus hij is niet
// test-specifiek. Het doel draagt een mesocyclus (FTP) — bij Onderhoud vuurt de tak per
// constructie niet.

const DOELSTART = "2026-06-29";

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: DOELSTART,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};

const MONDAY = "2026-08-03";

const schuif_ = (monday: string, n: number) => {
  const [y, m, d] = monday.split("-").map(Number);
  const dt = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** Zeven planner-dagen uit een {dagIdx: minuten}-vorm. `pendelIdx` maakt die dag een pendeldag. */
function week_(
  monday: string,
  vorm: Record<number, number>,
  pendelIdx?: number,
): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: schuif_(monday, n),
    train: vorm[n] != null,
    dag: null,
    minuten: vorm[n] ?? 0,
    dagtype:
      vorm[n] == null
        ? null
        : n === pendelIdx
          ? "pendel"
          : n === 5 || n === 6
            ? "weekend"
            : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

function bouw_(
  dezeWeek: PlannerDay[],
  historie: PlannerDay[][] | undefined,
  mesoWeek: number,
) {
  return buildWeekProposal({
    settings: SETTINGS,
    plannerDays: dezeWeek,
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: MONDAY,
    mesoWeekOverride: mesoWeek,
    plannerHistorie: historie,
  });
}

/** De sessieduur per datum, over alle sessies van die dag. */
function durenPerDatum_(w: ReturnType<typeof bouw_>): Map<string, number[]> {
  const uit = new Map<string, number[]>();
  for (const d of w.days) {
    const iso = `${d.datum}`.slice(0, 10);
    uit.set(
      iso,
      d.sessions.map((s) => s.totaalMin),
    );
  }
  return uit;
}

describe("punt 39 — de herstelweek snijdt in de sessieduur", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    const [y, m, d] = MONDAY.split("-").map(Number);
    vi.setSystemTime(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 8, 0, 0));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  // 5x60 = 300 minuten. Referentie 300 ⇒ factor 0,75 ⇒ doel 225 ⇒ schaal 0,75.
  const VIJF_UUR: Record<number, number> = {
    0: 60,
    1: 60,
    2: 60,
    3: 60,
    4: 60,
  };

  it("T1 — met drie gelijke historie-weken krimpt de sessieduur van de niet-pendeldagen", () => {
    const deze = week_(MONDAY, VIJF_UUR);
    const historie = [1, 2, 3].map((n) =>
      week_(schuif_(MONDAY, -7 * n), VIJF_UUR),
    );

    const zonder = durenPerDatum_(bouw_(deze, undefined, 1));
    const met = durenPerDatum_(bouw_(deze, historie, 4));

    // De schaal zelf is 0,75 — het mechanisme, los van de bouwers.
    expect(herstelSchaal_(deze, historie)).toBeCloseTo(0.75, 10);

    let gekrompen = 0;
    for (const [iso, durenNa] of met) {
      const durenVoor = zonder.get(iso) ?? [];
      if (durenVoor.length === 0 || durenNa.length === 0) continue;
      const voor = durenVoor.reduce((a, b) => a + b, 0);
      const na = durenNa.reduce((a, b) => a + b, 0);
      if (na < voor) gekrompen++;
    }
    expect(gekrompen).toBeGreaterThan(0);
  });

  it("T2 — een pendeldag in diezelfde week houdt zijn duur exact", () => {
    // Dag 2 is de pendeldag; hij telt niet mee in het volume en krimpt ook niet.
    const deze = week_(MONDAY, VIJF_UUR, 2);
    const historie = [1, 2, 3].map((n) =>
      week_(schuif_(MONDAY, -7 * n), VIJF_UUR, 2),
    );
    const pendelISO = schuif_(MONDAY, 2);

    const zonder = durenPerDatum_(bouw_(deze, undefined, 1));
    const met = durenPerDatum_(bouw_(deze, historie, 4));

    expect(met.get(pendelISO)).toEqual(zonder.get(pendelISO));
  });

  it("T3 — een week die al onder doelVolume ligt krimpt NIET (M87)", () => {
    // Historie 3 weken van 5x60 ⇒ referentie 300, doel 225. Deze week 3x60 = 180 ≤ 225.
    const deze = week_(MONDAY, { 0: 60, 1: 60, 2: 60 });
    const hoog = [1, 2, 3].map((n) => week_(schuif_(MONDAY, -7 * n), VIJF_UUR));
    // Tegenkant: een historie die GELIJK is aan deze week ⇒ referentie 180, doel 135, dus wél
    // korten. Zonder die tweede kant zou groen ook volgen uit een factor die nooit vuurt.
    const laag = [1, 2, 3].map((n) =>
      week_(schuif_(MONDAY, -7 * n), { 0: 60, 1: 60, 2: 60 }),
    );

    expect(herstelSchaal_(deze, hoog)).toBe(1);
    expect(herstelSchaal_(deze, laag)).toBeCloseTo(0.75, 10);

    // BEIDE kanten in de HERSTELWEEK gebouwd: zo isoleert de vergelijking M87 en meet ze niet
    // per ongeluk de meso-dosisfactor mee, die tussen mesoweek 1 en 4 al 0,2 minuut scheelt.
    const metHoog = durenPerDatum_(bouw_(deze, hoog, 4));
    const metLaag = durenPerDatum_(bouw_(deze, laag, 4));

    let korter = 0;
    for (const [iso, durenLaag] of metLaag) {
      const durenHoog = metHoog.get(iso) ?? [];
      if (durenHoog.length === 0 || durenLaag.length === 0) continue;
      const a = durenHoog.reduce((x, y) => x + y, 0);
      const b = durenLaag.reduce((x, y) => x + y, 0);
      expect(b).toBeLessThanOrEqual(a);
      if (b < a) korter++;
    }
    expect(korter).toBeGreaterThan(0);
  });

  it("T4 — dezelfde invoer met mesoWeekOverride 1 levert een onveranderde week", () => {
    const deze = week_(MONDAY, VIJF_UUR);
    const historie = [1, 2, 3].map((n) =>
      week_(schuif_(MONDAY, -7 * n), VIJF_UUR),
    );

    const zonderHistorie = durenPerDatum_(bouw_(deze, undefined, 1));
    const metHistorie = durenPerDatum_(bouw_(deze, historie, 1));

    for (const [iso, durenNa] of metHistorie) {
      expect(durenNa).toEqual(zonderHistorie.get(iso));
    }
  });

  it("T5 — zonder historie valt de factor terug op de week zelf: M86 alleen", () => {
    // 5x60 = 300 ⇒ referentie is de week zelf ⇒ factor 0,75 ⇒ schaal 0,75, gelijk aan T1.
    const deze = week_(MONDAY, VIJF_UUR);
    expect(herstelSchaal_(deze, undefined)).toBeCloseTo(0.75, 10);
    expect(herstelSchaal_(deze, [])).toBeCloseTo(0.75, 10);

    // En de curve van M86 loopt: 10 uur ⇒ 0,55, en dat is de ondergrens.
    const tienUur = week_(MONDAY, { 0: 120, 1: 120, 2: 120, 3: 120, 4: 120 });
    expect(herstelSchaal_(tienUur, undefined)).toBeCloseTo(0.55, 10);
  });
});
