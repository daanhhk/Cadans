import type { SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import {
  type ActValuesRow,
  derivePlannerGedaan,
  type GedaanPlannerDay,
} from "./activities";
import { buildWeekProposal, type ProposalWeek } from "./proposal";

// 17-koloms actValues-rij: idx0 Datum (Date), idx1 type, idx3 duurMin, idx7 IF, idx15 zones.
function act(
  dt: Date,
  type: string,
  min: number,
  o: { iff?: number; zones?: string } = {},
): ActValuesRow {
  const r: ActValuesRow = new Array(17).fill("");
  r[0] = dt;
  r[1] = type;
  r[3] = min;
  r[7] = o.iff ?? 0.7;
  r[15] = o.zones ?? "";
  return r;
}
const dag = (
  datum: string,
  minuten: number | null,
  train = true,
): GedaanPlannerDay => ({ datum, train, minuten });

describe("derivePlannerGedaan — GAS-mirror (Sync.gs:567-608)", () => {
  it("match binnen de dag → gedaan", () => {
    const acts = [act(new Date(2026, 2, 11, 9, 0), "Ride", 60)];
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], acts)).toEqual(
      new Set(["2026-03-11"]),
    );
  });

  it("dagvenster-rand: 00:00 telt mee, 24:00 (= volgende dag) niet", () => {
    const binnen = [act(new Date(2026, 2, 11, 0, 0, 0), "Ride", 60)];
    const buitenNa = [act(new Date(2026, 2, 12, 0, 0, 0), "Ride", 60)];
    const buitenVoor = [act(new Date(2026, 2, 10, 23, 59, 59), "Ride", 60)];
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], binnen).size).toBe(1);
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], buitenNa).size).toBe(0);
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], buitenVoor).size).toBe(
      0,
    );
  });

  it("type-filter: ride/run tellen (case-insensitief), andere sporten niet", () => {
    const d = new Date(2026, 2, 11, 9, 0);
    for (const t of ["Ride", "VirtualRide", "run", "TrailRun"]) {
      expect(
        derivePlannerGedaan([dag("2026-03-11", 90)], [act(d, t, 60)]).size,
      ).toBe(1);
    }
    for (const t of ["Swim", "WeightTraining", "Walk", ""]) {
      expect(
        derivePlannerGedaan([dag("2026-03-11", 90)], [act(d, t, 60)]).size,
      ).toBe(0);
    }
  });

  it("50%-duur-drempel: net onder valt af, precies op telt mee", () => {
    const d = new Date(2026, 2, 11, 9, 0);
    // gepland 90 → drempel 45
    expect(
      derivePlannerGedaan([dag("2026-03-11", 90)], [act(d, "Ride", 44)]).size,
    ).toBe(0);
    expect(
      derivePlannerGedaan([dag("2026-03-11", 90)], [act(d, "Ride", 45)]).size,
    ).toBe(1);
    expect(
      derivePlannerGedaan([dag("2026-03-11", 90)], [act(d, "Ride", 46)]).size,
    ).toBe(1);
  });

  it("geplande minuten 0/null → duur-eis vervalt", () => {
    const d = new Date(2026, 2, 11, 9, 0);
    expect(
      derivePlannerGedaan([dag("2026-03-11", 0)], [act(d, "Ride", 5)]).size,
    ).toBe(1);
    expect(
      derivePlannerGedaan([dag("2026-03-11", null)], [act(d, "Ride", 5)]).size,
    ).toBe(1);
  });

  it("eerste match wint: een latere, langere rit verandert niets aan de uitkomst", () => {
    const acts = [
      act(new Date(2026, 2, 11, 7, 0), "Ride", 50),
      act(new Date(2026, 2, 11, 18, 0), "Ride", 120),
    ];
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], acts)).toEqual(
      new Set(["2026-03-11"]),
    );
  });

  it("niet-train-dag, lege invoer en niet-Date-rijen → nooit gedaan", () => {
    const d = new Date(2026, 2, 11, 9, 0);
    expect(
      derivePlannerGedaan([dag("2026-03-11", 90, false)], [act(d, "Ride", 90)])
        .size,
    ).toBe(0);
    expect(derivePlannerGedaan([], [act(d, "Ride", 90)]).size).toBe(0);
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], []).size).toBe(0);
    const kapot: ActValuesRow = new Array(17).fill("");
    kapot[0] = "2026-03-11" as unknown as string; // geen Date
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], [kapot]).size).toBe(0);
  });

  it("bewuste divergentie van isDone: <50% is done voor de kaart, niet-gedaan hier", () => {
    // 30 min op een geplande 90 → doneTss > 0 (kaart: voltooid), maar geen plan-afwerking.
    const acts = [act(new Date(2026, 2, 11, 9, 0), "Ride", 30)];
    expect(derivePlannerGedaan([dag("2026-03-11", 90)], acts).size).toBe(0);
  });
});

describe("FASE 1 — vooruit-plan blijft byte-identiek (gate UIT)", () => {
  // Regressie-borging: de afleiding mag met PLAN_ADAPTATION_ENABLED=false NIETS aan het
  // vooruit-plan veranderen. Het mechanisme dat dat zou kunnen breken is de
  // dekking-verfijning (die hangt aan `gedaan`); die staat daarom achter dezelfde gate.
  const S: SettingsInput = {
    ftp: 280,
    lthr: 170,
    gewicht: 75,
    doel: "FTP",
    doelStart: null,
    hrMax: 190,
    hrRest: 45,
    doelDuur: null,
    fase: null,
    profielPreset: null,
    pendelDuurMin: 80,
    pendelAantal: 2,
  };
  // ABSOLUTE fixture-week (2026-03-09 = maandag) met een GEPINDE "vandaag". Bewust niet
  // relatief aan de echte klok: `assignWorkouts` leest voor de week-allocator de ambient
  // `new Date()`, dus een week die met de kalender meeschuift geeft op de ene weekdag een
  // andere uitkomst dan op de andere. Met een vaste week ver in het verleden plaatst de
  // allocator niets en loopt alles deterministisch via de keyIntensity-dispatch.
  const MON = new Date(2026, 2, 9);
  const iso = (n: number) => {
    const d = new Date(MON.getFullYear(), MON.getMonth(), MON.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const TODAY = iso(3); // do 2026-03-12
  const dagen = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: true,
    dag: null,
    minuten: n === 5 ? 120 : 90,
    dagtype: n === 5 ? "weekend" : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
  const vooruit = (r: ProposalWeek) =>
    JSON.stringify(
      r.days
        .filter((d) => d.datum >= TODAY)
        .map((d) => ({
          datum: d.datum,
          type: d.voorgesteldType,
          redenCode: d.redenCode,
          namen: d.sessions.map((s) => s.naam),
          tss: d.sessions.map((s) => s.tss),
        })),
    );

  it("een gereden multi-zone dag (VERSTREKEN) verandert het vooruit-plan niet", () => {
    // di 03-10 ligt vóór de gepinde vandaag (do 03-12) → een past-dated rit. Dat is de
    // situatie waarvoor de fase-1-byte-identiteit geldt.
    const [y, m, d] = iso(1).split("-").map(Number);
    const gereden = act(new Date(y, m - 1, d, 9, 0), "Ride", 90, {
      iff: 0.88,
      zones: JSON.stringify([
        { id: "Z2", secs: 3000 },
        { id: "Z4", secs: 2400 },
      ]),
    });
    const base = {
      settings: S,
      plannerDays: dagen,
      events: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    };
    const zonderRit = buildWeekProposal({ ...base, activities: [] });
    const metRit = buildWeekProposal({ ...base, activities: [gereden] });
    // De rit maakt di 'gedaan' (90 >= 50% van 90) → grid/tePlannen/dekking zien dat.
    expect(derivePlannerGedaan(dagen, [gereden]).has(iso(1))).toBe(true);
    // en tóch is het vooruit-plan ongewijzigd.
    expect(vooruit(metRit)).toBe(vooruit(zonderRit));
  });

  it("de gedane dag valt uit tePlannen (geen sessies meer op die dag)", () => {
    const [y, m, d] = iso(2).split("-").map(Number); // woensdag, ook verstreken
    const gereden = act(new Date(y, m - 1, d, 9, 0), "Ride", 90);
    const r = buildWeekProposal({
      settings: S,
      plannerDays: dagen,
      events: [],
      activities: [gereden],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    });
    const wo = r.days.find((x) => x.datum === iso(2));
    expect(wo?.sessions).toHaveLength(0);
  });
});
