import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import type { ProposalDay, ProposalWeek, ProposalWorkout } from "./proposal";
import {
  alignKindFromState,
  blokFromEngine,
  buildDoneCompare,
  buildDoneEntry,
  type DoneEntry,
  deriveSchemaView,
  doneBadge,
  doneLabel,
  focusLabel,
  formatDuurU,
  formatIf,
  MACRO_FASE_NL,
  macroFaseLabel,
  stripFaseSuffix,
  ZONE_META,
  zoneCompareRows,
  zoneNumFromToken,
} from "./schema";

describe("focusLabel", () => {
  it("mapt bucket-focus naar het NL ZONE_META-label", () => {
    expect(focusLabel("low")).toBe(ZONE_META.low.label);
    expect(focusLabel("high")).toBe(ZONE_META.high.label);
    expect(focusLabel("anaerobic")).toBe(ZONE_META.anaerobic.label);
  });
  it("laat proza-focus ongewijzigd door", () => {
    expect(focusLabel("lactate clearance")).toBe("lactate clearance");
    expect(focusLabel("volume + key zone")).toBe("volume + key zone");
  });
});

describe("macroFaseLabel", () => {
  it("mapt de engine-fase naar het NL-label", () => {
    expect(macroFaseLabel("Base")).toBe("Basis");
    expect(macroFaseLabel("Recovery")).toBe("Herstel");
    expect(macroFaseLabel("Build")).toBe("Build");
    expect(macroFaseLabel("Peak")).toBe("Peak");
    expect(macroFaseLabel("Test")).toBe("Test");
  });
  it("laat een onbekende fase ongewijzigd door", () => {
    expect(macroFaseLabel("Taper")).toBe("Taper");
    expect(macroFaseLabel("")).toBe("");
  });
});

describe("stripFaseSuffix", () => {
  it("verwijdert het fase-token maar behoudt 'ingekort'", () => {
    expect(stripFaseSuffix("Z2 progressief (Build, ingekort)")).toBe(
      "Z2 progressief (ingekort)",
    );
    expect(stripFaseSuffix("Z2 progressief (Base)")).toBe("Z2 progressief");
    expect(stripFaseSuffix("Sweet Spot lang 3×20 (Peak)")).toBe(
      "Sweet Spot lang 3×20",
    );
  });
  it("laat een naam zonder fase-suffix ongemoeid (geen false positive)", () => {
    expect(stripFaseSuffix("Drempel lang 3×14")).toBe("Drempel lang 3×14");
    expect(stripFaseSuffix("Sweet Spot 2×10 kort")).toBe(
      "Sweet Spot 2×10 kort",
    );
    // niet-fase tussen haakjes blijft staan (alleen bekende tokens strippen)
    expect(stripFaseSuffix("Ochtendrit (warmup)")).toBe("Ochtendrit (warmup)");
  });
  it("dekt alle MACRO_FASE_NL-tokens (gedeelde bron)", () => {
    for (const fase of Object.keys(MACRO_FASE_NL)) {
      expect(stripFaseSuffix(`Naam (${fase})`)).toBe("Naam");
    }
  });
});

describe("blokFromEngine", () => {
  it("mapt engine-buckets naar de GAS-hoogtePct-stappen (25/45/65/85/100)", () => {
    expect(blokFromEngine({ minuten: 10, zone: "rust" })?.hoogtePct).toBe(25);
    expect(blokFromEngine({ minuten: 10, zone: "z2" })?.hoogtePct).toBe(45);
    expect(blokFromEngine({ minuten: 10, zone: "tempo" })?.hoogtePct).toBe(65);
    expect(blokFromEngine({ minuten: 10, zone: "drempel" })?.hoogtePct).toBe(
      85,
    );
    expect(blokFromEngine({ minuten: 10, zone: "anaeroob" })?.hoogtePct).toBe(
      100,
    );
  });
  it("kleurt via de --zone-*-tokens (lijnt met de legend)", () => {
    expect(blokFromEngine({ minuten: 5, zone: "z2" })?.color).toBe(
      "var(--zone-2)",
    );
    expect(blokFromEngine({ minuten: 5, zone: "drempel" })?.color).toBe(
      "var(--zone-4)",
    );
    expect(blokFromEngine({ minuten: 5, zone: "anaeroob" })?.color).toBe(
      "var(--zone-5)",
    );
  });
  it("onbekende bucket → z2-default (zoals GAS)", () => {
    const b = blokFromEngine({ minuten: 5, zone: "onzin" });
    expect(b?.hoogtePct).toBe(45);
    expect(b?.color).toBe("var(--zone-2)");
  });
  it("negeert lege/ongeldige blokken (minuten ≤ 0 of geen object)", () => {
    expect(blokFromEngine({ minuten: 0, zone: "z2" })).toBeNull();
    expect(blokFromEngine(null)).toBeNull();
    expect(blokFromEngine("x")).toBeNull();
  });
  it("behoudt de minuten", () => {
    expect(blokFromEngine({ minuten: 12.5, zone: "z2" })?.minuten).toBe(12.5);
  });
});

describe("buildDoneEntry (fase 2a done-object)", () => {
  const doneRow = (o: {
    type?: string;
    naam?: string;
    duur?: number;
    tss?: number;
    zt?: string;
    iff?: number;
  }): ActValuesRow => {
    const r: ActValuesRow = new Array(17).fill("");
    r[0] = new Date(2026, 6, 6);
    r[1] = o.type ?? "";
    r[2] = o.naam ?? "";
    r[3] = o.duur ?? 0;
    if (o.iff != null) r[7] = o.iff;
    r[8] = o.tss ?? 0;
    r[15] = o.zt ?? "";
    return r;
  };

  it("extraheert type/naam/duur/IF(idx7)/tss + reële zones (idx15)", () => {
    const d = buildDoneEntry(
      doneRow({
        type: "Ride",
        naam: "Ochtendrit",
        duur: 90,
        tss: 75,
        iff: 0.88,
        zt: JSON.stringify([
          { id: "Z2", secs: 3600 },
          { id: "Z4", secs: 600 },
        ]),
      }),
    );
    expect(d.type).toBe("Ride");
    expect(d.naam).toBe("Ochtendrit");
    expect(d.minuten).toBe(90);
    expect(d.tss).toBe(75);
    expect(d.ifReal).toBe(0.88);
    expect(d.zoneMinutes).toEqual({ low: 60, high: 10, anaerobic: 0 });
  });

  it("ontbrekende zone-data + lege IF → zoneMinutes/ifReal null (naam/duur blijven)", () => {
    const d = buildDoneEntry(doneRow({ naam: "Rit", duur: 60, tss: 40 }));
    expect(d.zoneMinutes).toBeNull();
    expect(d.ifReal).toBeNull();
    expect(d.minuten).toBe(60);
    expect(d.naam).toBe("Rit");
  });
});

describe("doneLabel + formatDuurU", () => {
  it("doneLabel = dominante reële zone", () => {
    expect(
      doneLabel({
        tss: 0,
        minuten: 0,
        type: "Ride",
        naam: "",
        zoneMinutes: { low: 20, high: 40, anaerobic: 0 },
        ifReal: null,
      }),
    ).toBe(ZONE_META.high.label); // Drempel
  });
  it("doneLabel zonder zones → rauwe type of 'Rit'", () => {
    const base = {
      tss: 0,
      minuten: 0,
      naam: "",
      zoneMinutes: null,
      ifReal: null,
    };
    expect(doneLabel({ ...base, type: "Ride" })).toBe("Ride");
    expect(doneLabel({ ...base, type: "" })).toBe("Rit");
  });
  it("formatDuurU: 61→1u01, 90→1u30, 60→1u", () => {
    expect(formatDuurU(61)).toBe("1u01");
    expect(formatDuurU(90)).toBe("1u30");
    expect(formatDuurU(60)).toBe("1u");
  });
});

// ── Fase 2b-2: plan-vs-gedaan (compare-mapping + coachFeedback_-brug + dispatch-flip) ──

// Geplande workouts als RAUWE engine-blokken (toSession mapt ze via blokFromEngine).
const plannedSS: ProposalWorkout = {
  naam: "Sweet Spot 3×12",
  zones: ["low", "high"],
  totaalMin: 60,
  tss: 78,
  structuur: [],
  blokken: [
    { minuten: 6, zone: "rust" },
    { minuten: 12, zone: "z2" },
    { minuten: 38, zone: "drempel" },
    { minuten: 4, zone: "anaeroob" },
  ],
};
const doneSS: DoneEntry = {
  tss: 81,
  minuten: 62,
  type: "Ride",
  naam: "Ochtendrit",
  zoneMinutes: { low: 18, high: 43, anaerobic: 0 },
  ifReal: 0.89,
};

describe("formatIf", () => {
  it("2 decimalen NL-komma; null/NaN → –", () => {
    expect(formatIf(0.88)).toBe("0,88");
    expect(formatIf(0.9)).toBe("0,90");
    expect(formatIf(null)).toBe("–");
    expect(formatIf(Number.NaN)).toBe("–");
  });
});

describe("zoneNumFromToken", () => {
  it("--zone-N → N; onbekend → 2 (default)", () => {
    expect(zoneNumFromToken("--zone-4")).toBe(4);
    expect(zoneNumFromToken("--zone-1")).toBe(1);
    expect(zoneNumFromToken("rubbish")).toBe(2);
  });
});

describe("alignKindFromState", () => {
  it("engine-state → design AlignChip-kind", () => {
    expect(alignKindFromState("on-plan")).toBe("op-plan");
    expect(alignKindFromState("deviated")).toBe("afgeweken");
    expect(alignKindFromState("different")).toBe("anders");
    expect(alignKindFromState("missed")).toBe("gemist");
    expect(alignKindFromState("onzin")).toBe("anders");
  });
});

describe("zoneCompareRows", () => {
  it("gepland aggregeert blok-kleuren; gedaan mapt 3-bucket → Z2/Z4/Z5; altijd Z1..Z5", () => {
    const blokken = [
      { minuten: 6, hoogtePct: 25, color: "var(--zone-1)" },
      { minuten: 12, hoogtePct: 45, color: "var(--zone-2)" },
      { minuten: 38, hoogtePct: 85, color: "var(--zone-4)" },
      { minuten: 4, hoogtePct: 100, color: "var(--zone-5)" },
    ];
    const rows = zoneCompareRows(blokken, { low: 18, high: 43, anaerobic: 0 });
    expect(rows.map((r) => r.z)).toEqual([1, 2, 3, 4, 5]);
    expect(rows[0]).toEqual({ z: 1, plan: 6, done: 0 });
    expect(rows[1]).toEqual({ z: 2, plan: 12, done: 18 }); // low→Z2
    expect(rows[2]).toEqual({ z: 3, plan: 0, done: 0 });
    expect(rows[3]).toEqual({ z: 4, plan: 38, done: 43 }); // high→Z4
    expect(rows[4]).toEqual({ z: 5, plan: 4, done: 0 });
  });
  it("geen done-zones → alle done 0", () => {
    const rows = zoneCompareRows(
      [{ minuten: 10, hoogtePct: 45, color: "var(--zone-2)" }],
      null,
    );
    expect(rows.every((r) => r.done === 0)).toBe(true);
  });
});

describe("doneBadge", () => {
  it("dominante reële zone → {zoneNum,label}; geen zones → null", () => {
    expect(doneBadge(doneSS)).toEqual({ zoneNum: 4, label: "Drempel" }); // high dominant
    expect(doneBadge({ ...doneSS, zoneMinutes: null })).toBeNull();
  });
});

describe("buildDoneCompare (coachFeedback_-brug)", () => {
  it("op-plan: trouw uitgevoerde sweet_spot → chip op-plan, gepland/gedaan Sweet Spot, compare-zones", () => {
    const c = buildDoneCompare(doneSS, plannedSS, "sweet_spot", "Build");
    expect(c).not.toBeNull();
    if (!c) return;
    expect(c.chipKind).toBe("op-plan");
    expect(c.planType).toBe("Sweet Spot");
    expect(c.doneType).toBe("Sweet Spot");
    expect(c.deviate).toBe(false);
    expect(c.titel).toBe("Sweet Spot 3×12"); // P2: on-plan → planned.naam (niet type-rit)
    expect(c.badgeZone).toBe(4);
    expect(typeof c.scorePct).toBe("number");
    const ifRow = c.rows.find((r) => r.k === "IF");
    expect(ifRow).toEqual({ k: "IF", p: "0,88", d: "0,89" });
    const z4 = c.zones.find((z) => z.z === 4);
    expect(z4).toEqual({ z: 4, plan: 38, done: 43 });
  });
  it("different: duur gereden i.p.v. geplande vo2max → chip anders, deviate, doneType Duur", () => {
    const doneDuur: DoneEntry = {
      tss: 50,
      minuten: 75,
      type: "Ride",
      naam: "Lange rit",
      zoneMinutes: { low: 70, high: 5, anaerobic: 0 },
      ifReal: 0.68,
    };
    const plannedVo2: ProposalWorkout = {
      naam: "VO2max 5×4",
      zones: ["anaerobic"],
      totaalMin: 60,
      tss: 95,
      structuur: [],
      blokken: [
        { minuten: 15, zone: "rust" },
        { minuten: 20, zone: "z2" },
        { minuten: 25, zone: "anaeroob" },
      ],
    };
    const c = buildDoneCompare(doneDuur, plannedVo2, "vo2max", "Build");
    expect(c?.chipKind).toBe("anders");
    expect(c?.deviate).toBe(true);
    expect(c?.planType).toBe("VO2max");
    expect(c?.doneType).toBe("Duur");
    expect(c?.titel).toBe("Duur-rit · 1u15"); // P2: different → <doneType>-rit · <duur>
  });
  it("geen geplande workout → null (reduced kaart)", () => {
    expect(buildDoneCompare(doneSS, null, "sweet_spot", "Build")).toBeNull();
    expect(buildDoneCompare(doneSS, plannedSS, null, "Build")).toBeNull();
  });
});

describe("deriveSchemaView dispatch (flip + doneCompare)", () => {
  const TODAY = "2026-03-11";
  const pday = (datum: string, o: Partial<ProposalDay> = {}): ProposalDay => ({
    datum,
    dagIdx: 0,
    voorgesteldType: null,
    reden: null,
    archetypeId: null,
    sessions: [],
    plannedForDone: null,
    ...o,
  });
  const pweek = (days: ProposalDay[]): ProposalWeek => ({
    weekMonday: "2026-03-09",
    macroFase: "Build",
    eventNaam: null,
    wekenTotEvent: null,
    planModus: null,
    days,
  });
  const de = (o: Partial<DoneEntry> = {}): DoneEntry => ({
    tss: 60,
    minuten: 60,
    type: "Ride",
    naam: "Rit",
    zoneMinutes: null,
    ifReal: null,
    ...o,
  });

  it("same-day-flip: voltooide vandaag → state 'done' (isToday blijft true)", () => {
    const v = deriveSchemaView(
      pweek([pday(TODAY)]),
      { [TODAY]: de({ tss: 70 }) },
      TODAY,
    );
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].isToday).toBe(true);
  });
  it("vandaag zonder rit → state 'today'", () => {
    const v = deriveSchemaView(pweek([pday(TODAY)]), {}, TODAY);
    expect(v.days[0].state).toBe("today");
    expect(v.days[0].isToday).toBe(true);
  });
  it("verleden dag met rit → state 'done', isToday false", () => {
    const v = deriveSchemaView(
      pweek([pday("2026-03-09")]),
      { "2026-03-09": de({ tss: 70 }) },
      TODAY,
    );
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].isToday).toBe(false);
  });
  it("done zónder plannedForDone → doneCompare null; mét → gevuld", () => {
    const zonder = deriveSchemaView(
      pweek([pday("2026-03-09")]),
      { "2026-03-09": de({ tss: 70 }) },
      TODAY,
    );
    expect(zonder.days[0].doneCompare).toBeNull();

    const met = deriveSchemaView(
      pweek([
        pday("2026-03-09", {
          voorgesteldType: "sweet_spot",
          plannedForDone: plannedSS,
        }),
      ]),
      { "2026-03-09": doneSS },
      TODAY,
    );
    expect(met.days[0].doneCompare).not.toBeNull();
    expect(met.days[0].doneCompare?.planType).toBe("Sweet Spot");
  });
  it("render-bug regressie (P1): done-vandaag met sessions maar zónder plannedForDone → volle compare", () => {
    // WO-8-scenario: activity aanwezig (isDone) maar planner gedaan=0 → dag zit nog in tePlannen
    // → plannedForDone=null, de geplande workout leeft in d.sessions[laatste]. Vóór de P1-fix gaf
    // dit doneCompare=null (gereduceerde kaart); nu moet de volle compare gevuld zijn.
    const day = pday(TODAY, {
      voorgesteldType: "sweet_spot",
      sessions: [plannedSS],
      plannedForDone: null,
    });
    const v = deriveSchemaView(pweek([day]), { [TODAY]: doneSS }, TODAY);
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].doneCompare).not.toBeNull();
    expect(v.days[0].doneCompare?.planType).toBe("Sweet Spot");
  });
});
