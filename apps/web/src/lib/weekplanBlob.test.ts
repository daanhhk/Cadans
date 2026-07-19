import type { PlannerDay, SettingsInput, WellnessInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { buildWeekProposal, type ProposalWeek } from "./proposal";
import {
  buildWeekplanEntries,
  entriesToWeekSlots,
  entryFromDay,
  sameForwardEntries,
  weekDatesFrom,
  zeroIntentOutsideZones,
} from "./weekplanBlob";

const TODAY = "2026-03-11";

function settings(o: Partial<SettingsInput> = {}): SettingsInput {
  return {
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
    ...o,
  };
}

function pday(datum: string, o: Partial<PlannerDay>): PlannerDay {
  return {
    datum,
    train: true,
    dag: null,
    minuten: 60,
    dagtype: "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
    ...o,
  };
}

function wl(datum: string): WellnessInput {
  return {
    datum,
    rhr: 48,
    hrv: 65,
    slaapU: 7.5,
    slaapScore: 80,
    readiness: 90,
    mood: "ok",
    weightKg: 75,
    ctl: 50,
    atl: 45,
    vorm: 5,
    ramp: 1.2,
  };
}

const WEEK: PlannerDay[] = [
  pday("2026-03-09", {
    dag: "ma",
    voorgesteldType: "sweet_spot",
    gedaan: true,
  }),
  pday("2026-03-10", { dag: "di", dagtype: "pendel", minuten: 80 }),
  pday("2026-03-11", { dag: "wo" }),
  pday("2026-03-12", { dag: "do", minuten: 75 }),
  pday("2026-03-13", { dag: "vr" }),
  pday("2026-03-14", { dag: "za", dagtype: "weekend", minuten: 120 }),
  pday("2026-03-15", {
    dag: "zo",
    dagtype: "recovery",
    train: false,
    minuten: null,
  }),
];

function proposal(): ProposalWeek {
  return buildWeekProposal({
    settings: settings(),
    plannerDays: WEEK,
    events: [],
    activities: [],
    weekplans: [],
    wellness: [wl("2026-03-10"), wl("2026-03-11")],
    rpe: [],
    todayISO: TODAY,
  });
}

describe("zeroIntentOutsideZones (3a — intent[b] > 0 ⇔ b ∈ zones)", () => {
  it("nult de buckets die niet in zones zitten", () => {
    // ensureIntent_ fabriceert 55% low voor een zones:["high"]-workout; die low mag
    // NIET als dekking tellen (GAS' intentZonesForDate_ leest de zone-SET).
    const r = zeroIntentOutsideZones({ low: 44, high: 36, anaerobic: 0 }, [
      "high",
    ]);
    expect(r).toEqual({ low: 0, high: 36, anaerobic: 0 });
  });

  it("laat buckets die WEL in zones zitten ongemoeid", () => {
    const r = zeroIntentOutsideZones({ low: 30, high: 36, anaerobic: 5 }, [
      "low",
      "high",
    ]);
    expect(r).toEqual({ low: 30, high: 36, anaerobic: 0 });
  });

  it("na het nullen geldt de engine-aanname: intent[b] > 0 ⇔ b ∈ zones", () => {
    const zones = ["low", "anaerobic"];
    const r = zeroIntentOutsideZones(
      { low: 20, high: 99, anaerobic: 10 },
      zones,
    );
    for (const b of ["low", "high", "anaerobic"] as const) {
      expect(r[b] > 0).toBe(zones.includes(b));
    }
  });
});

describe("buildWeekplanEntries (GAS-blob-vorm, Algorithm.gs:238-256)", () => {
  it("levert een entry per dag MET sessies; rustdagen/voorbije dagen niet", () => {
    const week = proposal();
    const entries = buildWeekplanEntries(week, "FTP");
    const datums = entries.map((e) => e.datum);
    // 03-09 is voorbij (geen sessies meer) en 03-15 is rustdag → geen entry.
    expect(datums).not.toContain("2026-03-09");
    expect(datums).not.toContain("2026-03-15");
    // De te plannen dagen (vandaag/toekomst) hebben er wél een.
    expect(datums).toContain("2026-03-11");
    expect(datums).toContain("2026-03-14");
  });

  it("draagt de velden die de lezers nodig hebben (incl. archetypeId + variantId voor 1b)", () => {
    const entries = buildWeekplanEntries(proposal(), "FTP");
    const e = entries.find((x) => x.datum === "2026-03-11");
    expect(e).toBeDefined();
    if (!e) return;
    for (const k of [
      "datum",
      "workoutType",
      "archetypeId",
      "naam",
      "variantId",
      "zones",
      "intent",
      "blokken",
      "structuur",
      "tss",
      "minuten",
      "reden",
      "sessies",
    ]) {
      expect(Object.hasOwn(e, k)).toBe(true);
    }
    expect(typeof e.workoutType).toBe("string");
    expect(e.minuten).toBeGreaterThan(0);
    expect(e.tss).toBeGreaterThan(0);
    expect(Array.isArray(e.sessies)).toBe(true);
    expect(e.sessies.length).toBeGreaterThan(0);
  });

  it("de entry-intent voldoet aan de 3a-vorm (geen bucket buiten zones)", () => {
    for (const e of buildWeekplanEntries(proposal(), "FTP")) {
      for (const b of ["low", "high", "anaerobic"] as const) {
        if (e.intent[b] > 0) expect(e.zones).toContain(b);
      }
    }
  });

  it("pendel-dag: meerdere sessies → gesommeerde minuten/tss + aggregaat-naam", () => {
    const week = proposal();
    const di = week.days.find((d) => d.datum === "2026-03-10");
    // 03-10 is voorbij t.o.v. TODAY 03-11 → geen sessies; bouw de aggregatie direct.
    const dag = {
      ...(di ?? week.days[2]),
      datum: "2026-03-12",
      voorgesteldType: "pendel_z2",
      sessions: [
        { naam: "Pendel Z2", zones: ["low"], totaalMin: 80, tss: 45 },
        { naam: "Pendel Z2", zones: ["low"], totaalMin: 80, tss: 45 },
      ],
    };
    const e = entryFromDay(dag, "FTP");
    expect(e).not.toBeNull();
    expect(e?.minuten).toBe(160);
    expect(e?.tss).toBe(90);
    expect(e?.naam).toBe("Pendel 2× 80m");
    expect(e?.sessies).toHaveLength(2);
  });

  it("gemengde pendel-sessies → mix-naam (GAS Algorithm.gs:234)", () => {
    const e = entryFromDay(
      {
        datum: "2026-03-12",
        dagIdx: 3,
        voorgesteldType: "threshold",
        reden: null,
        redenCode: null,
        archetypeId: null,
        override: null,
        plannedForDone: null,
        sessions: [
          { naam: "Pendel Z2", zones: ["low"], totaalMin: 80, tss: 45 },
          {
            naam: "Drempel 3×10",
            zones: ["low", "high"],
            totaalMin: 80,
            tss: 70,
          },
        ],
      },
      "FTP",
    );
    expect(e?.naam).toBe("Pendel Z2 + FTP intervallen");
  });

  it("dag zonder sessies → null (GAS: `if (!sessions.length) return;`)", () => {
    const e = entryFromDay(
      {
        datum: "2026-03-15",
        dagIdx: 6,
        voorgesteldType: null,
        reden: null,
        redenCode: null,
        archetypeId: null,
        override: null,
        plannedForDone: null,
        sessions: [],
      },
      "FTP",
    );
    expect(e).toBeNull();
  });
});

describe("entriesToWeekSlots (V14 — 7 posities, positioneel dagIdx)", () => {
  it("levert altijd exact 7 posities, op datum uitgelijnd", () => {
    const slots = entriesToWeekSlots(
      [{ datum: "2026-03-11" }, { datum: "2026-03-14" }],
      "2026-03-09",
    );
    expect(slots).toHaveLength(7);
    // Positie 2 = wo 03-11, positie 5 = za 03-14; de rest expliciet null.
    expect(slots[2]?.datum).toBe("2026-03-11");
    expect(slots[5]?.datum).toBe("2026-03-14");
    expect(slots[0]).toBeNull();
    expect(slots[6]).toBeNull();
  });

  it("negeert entries buiten de week (het recent-venster draagt 8 weken)", () => {
    const slots = entriesToWeekSlots(
      [{ datum: "2026-03-02" }, { datum: "2026-03-11" }],
      "2026-03-09",
    );
    expect(slots.filter(Boolean)).toHaveLength(1);
    expect(slots[2]?.datum).toBe("2026-03-11");
  });

  it("lege blob → 7 nulls (geen positie-verschuiving)", () => {
    expect(entriesToWeekSlots([], "2026-03-09")).toEqual(
      new Array(7).fill(null),
    );
  });

  it("weekDatesFrom loopt over een maandgrens heen", () => {
    expect(weekDatesFrom("2026-03-30")).toEqual([
      "2026-03-30",
      "2026-03-31",
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
      "2026-04-04",
      "2026-04-05",
    ]);
  });
});

describe("sameForwardEntries (dedup — alleen de niet-bevroren dagen)", () => {
  const next = [
    { datum: "2026-03-11", naam: "A" },
    { datum: "2026-03-12", naam: "B" },
  ];

  it("identieke vooruit-dagen → true (PUT overslaan)", () => {
    expect(sameForwardEntries(next as never, [...next], TODAY)).toBe(true);
  });

  it("gewijzigde vooruit-dag → false", () => {
    const stored = [
      { datum: "2026-03-11", naam: "A" },
      { datum: "2026-03-12", naam: "GEWIJZIGD" },
    ];
    expect(sameForwardEntries(next as never, stored, TODAY)).toBe(false);
  });

  it("verschil in het VERLEDEN telt niet mee (dat bevriest de worker toch)", () => {
    const stored = [{ datum: "2026-03-09", naam: "oud" }, ...next];
    expect(sameForwardEntries(next as never, stored, TODAY)).toBe(true);
  });

  it("ontbrekende vooruit-dag → false", () => {
    expect(
      sameForwardEntries(
        next as never,
        [{ datum: "2026-03-11", naam: "A" }],
        TODAY,
      ),
    ).toBe(false);
  });

  it("lege opslag met vooruit-entries → false (eerste schrijf)", () => {
    expect(sameForwardEntries(next as never, [], TODAY)).toBe(false);
  });
});
