import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import type { ProposalDay, ProposalWeek, ProposalWorkout } from "./proposal";
import {
  actualZone5_,
  alignKindFromState,
  blokFromEngine,
  buildDoneCompare,
  buildDoneEntry,
  type DoneEntry,
  deriveSchemaView,
  doneBadge,
  doneLabel,
  durLabel,
  focusLabel,
  formatDuurU,
  formatIf,
  MACRO_FASE_NL,
  macroFaseLabel,
  silhouetSegments,
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

describe("silhouetSegments (§5b proportioneel per-interval silhouet)", () => {
  const blok = (
    minuten: number,
    hoogtePct: number,
    color = "var(--zone-2)",
  ) => ({
    minuten,
    hoogtePct,
    color,
  });

  it("geeft één segment per blok, in ARRAY-volgorde (x monotoon stijgend)", () => {
    const segs = silhouetSegments([
      blok(15, 25, "var(--zone-1)"),
      blok(30, 85, "var(--zone-4)"),
      blok(15, 45, "var(--zone-2)"),
    ]);
    expect(segs).toHaveLength(3);
    expect(segs[0]?.x).toBe(0);
    expect(segs[1]?.x).toBeGreaterThan(segs[0]?.x ?? 0);
    expect(segs[2]?.x).toBeGreaterThan(segs[1]?.x ?? 0);
  });

  it("breedte ∝ minuten: het dubbel-zo-lange blok is ~2× zo breed", () => {
    const segs = silhouetSegments([blok(20, 45), blok(40, 45)]);
    const w0 = segs[0]?.bw ?? 0;
    const w1 = segs[1]?.bw ?? 0;
    // gelijke hoogtePct, dus alleen de minuten sturen de breedte (± de GAP-correctie).
    expect(w1 / w0).toBeGreaterThan(1.8);
    expect(w1 / w0).toBeLessThan(2.2);
  });

  it("hoogte = hoogtePct en bottom-aligned (y = 100 − hoogte)", () => {
    const segs = silhouetSegments([blok(10, 25), blok(10, 100)]);
    expect(segs[0]?.h).toBe(25);
    expect(segs[0]?.y).toBe(75);
    expect(segs[1]?.h).toBe(100);
    expect(segs[1]?.y).toBe(0);
  });

  it("draagt de blok-kleur (zone-token) door", () => {
    const segs = silhouetSegments([blok(10, 85, "var(--zone-4)")]);
    expect(segs[0]?.color).toBe("var(--zone-4)");
  });

  it("leeg in → leeg uit (geen segmenten)", () => {
    expect(silhouetSegments([])).toEqual([]);
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
    // 5-bucket (brok 5): Z2→z2, Z4→drempel; rust/tempo/anaeroob = 0.
    expect(d.zoneMin5).toEqual({
      rust: 0,
      z2: 60,
      tempo: 0,
      drempel: 10,
      anaeroob: 0,
    });
  });

  it("ontbrekende zone-data + lege IF → zoneMinutes/ifReal null (naam/duur blijven)", () => {
    const d = buildDoneEntry(doneRow({ naam: "Rit", duur: 60, tss: 40 }));
    expect(d.zoneMinutes).toBeNull();
    expect(d.zoneMin5).toBeNull();
    expect(d.ifReal).toBeNull();
    expect(d.minuten).toBe(60);
    expect(d.naam).toBe("Rit");
  });
});

describe("doneLabel + formatDuurU", () => {
  it("doneLabel = dominante reële zone (5-bucket: tempo → 'Tempo')", () => {
    expect(
      doneLabel({
        tss: 0,
        minuten: 0,
        type: "Ride",
        naam: "",
        zoneMinutes: null,
        zoneMin5: { rust: 0, z2: 20, tempo: 40, drempel: 5, anaeroob: 0 },
        ifReal: null,
      }),
    ).toBe("Tempo"); // het 3-bucket-model lumpte dit als "Drempel"
  });
  it("doneLabel zonder zones → rauwe type of 'Rit'", () => {
    const base = {
      tss: 0,
      minuten: 0,
      naam: "",
      zoneMinutes: null,
      zoneMin5: null,
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
  zoneMin5: { rust: 0, z2: 18, tempo: 0, drempel: 43, anaeroob: 0 },
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
  it("gepland aggregeert blok-kleuren; gedaan 5-bucket → eigen zone (Z1+Z3 nu gevuld); altijd Z1..Z5", () => {
    const blokken = [
      { minuten: 6, hoogtePct: 25, color: "var(--zone-1)" },
      { minuten: 12, hoogtePct: 45, color: "var(--zone-2)" },
      { minuten: 38, hoogtePct: 85, color: "var(--zone-4)" },
      { minuten: 4, hoogtePct: 100, color: "var(--zone-5)" },
    ];
    const rows = zoneCompareRows(blokken, {
      rust: 5,
      z2: 13,
      tempo: 7,
      drempel: 36,
      anaeroob: 0,
    });
    expect(rows.map((r) => r.z)).toEqual([1, 2, 3, 4, 5]);
    expect(rows[0]).toEqual({ z: 1, plan: 6, done: 5 }); // rust→Z1 (was structureel 0)
    expect(rows[1]).toEqual({ z: 2, plan: 12, done: 13 });
    expect(rows[2]).toEqual({ z: 3, plan: 0, done: 7 }); // tempo→Z3 (was structureel 0)
    expect(rows[3]).toEqual({ z: 4, plan: 38, done: 36 });
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
    expect(doneBadge(doneSS)).toEqual({ zoneNum: 4, label: "Drempel" }); // drempel dominant
    expect(doneBadge({ ...doneSS, zoneMin5: null })).toBeNull();
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
      zoneMin5: { rust: 0, z2: 70, tempo: 0, drempel: 5, anaeroob: 0 },
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
    expect(typeof c?.narrative).toBe("string"); // §6: coach-proza doorgegeven, niet weggegooid
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
    redenCode: null,
    archetypeId: null,
    override: null,
    sessions: [],
    plannedForDone: null,
    ...o,
  });
  const pweek = (days: ProposalDay[]): ProposalWeek => ({
    weekMonday: "2026-03-09",
    macroFase: "Build",
    fase: "Build",
    eventNaam: null,
    wekenTotEvent: null,
    planModus: null,
    profielPreset: null,
    days,
  });
  const de = (o: Partial<DoneEntry> = {}): DoneEntry => ({
    tss: 60,
    minuten: 60,
    type: "Ride",
    naam: "Rit",
    zoneMinutes: null,
    zoneMin5: null,
    ifReal: null,
    ...o,
  });

  it("same-day-flip: voltooide vandaag → state 'done' (isToday blijft true)", () => {
    const v = deriveSchemaView(
      pweek([pday(TODAY)]),
      { [TODAY]: de({ tss: 70 }) },
      TODAY,
      {},
    );
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].isToday).toBe(true);
  });
  it("vandaag zonder rit → state 'today'", () => {
    const v = deriveSchemaView(pweek([pday(TODAY)]), {}, TODAY, {});
    expect(v.days[0].state).toBe("today");
    expect(v.days[0].isToday).toBe(true);
  });
  it("verleden dag met rit → state 'done', isToday false", () => {
    const v = deriveSchemaView(
      pweek([pday("2026-03-09")]),
      { "2026-03-09": de({ tss: 70 }) },
      TODAY,
      {},
    );
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].isToday).toBe(false);
  });
  it("done zónder plannedForDone → doneCompare null; mét → gevuld", () => {
    const zonder = deriveSchemaView(
      pweek([pday("2026-03-09")]),
      { "2026-03-09": de({ tss: 70 }) },
      TODAY,
      {},
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
      {},
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
    const v = deriveSchemaView(pweek([day]), { [TODAY]: doneSS }, TODAY, {});
    expect(v.days[0].state).toBe("done");
    expect(v.days[0].doneCompare).not.toBeNull();
    expect(v.days[0].doneCompare?.planType).toBe("Sweet Spot");
  });
  it("gemist-precedentie (a): sessions + disposition + niet-done → state 'gemist' + dispositie gezet", () => {
    const day = pday("2026-03-09", {
      voorgesteldType: "sweet_spot",
      sessions: [plannedSS],
    });
    const v = deriveSchemaView(pweek([day]), {}, TODAY, {
      "2026-03-09": "geen_tijd",
    });
    expect(v.days[0].state).toBe("gemist");
    expect(v.days[0].dispositie).toBe("geen_tijd");
  });
  it("gemist-precedentie (b): done + disposition → state 'done' (isDone wint van gemist)", () => {
    const day = pday("2026-03-09", {
      voorgesteldType: "sweet_spot",
      sessions: [plannedSS],
    });
    const v = deriveSchemaView(
      pweek([day]),
      { "2026-03-09": de({ tss: 70 }) },
      TODAY,
      { "2026-03-09": "bewust_gerust" },
    );
    expect(v.days[0].state).toBe("done");
  });
  it("override reist 1-op-1 door van ProposalDay naar SchemaDay (geen eigen conditie)", () => {
    const ov = {
      type: "free" as const,
      ritType: "groep" as const,
      intensiteit: "stevig" as const,
      durMin: 75,
    };
    const v = deriveSchemaView(
      pweek([pday(TODAY, { override: ov, voorgesteldType: "free" })]),
      {},
      TODAY,
      {},
    );
    expect(v.days[0].override).toBe(ov);
  });
});

describe("durLabel (GAS trnDurLabel_-port)", () => {
  it("mapt minuten → het GAS-duur-format", () => {
    expect(durLabel(45)).toBe("45 min");
    expect(durLabel(60)).toBe("1u");
    expect(durLabel(65)).toBe("1u 05");
    expect(durLabel(90)).toBe("1u 30");
    expect(durLabel(240)).toBe("4u");
  });
});

// GAS-parity: spiegelt coachActualZoneMin_ (WebApp.gs:728). Z1→rust · Z2→z2 · Z3→tempo ·
// Z4→drempel · Z5-7→anaeroob; SS/overlay-ids overgeslagen; minuten = secs/60 (rauwe float,
// GEEN per-bucket-afronding); leeg/niet-array/enkel-overlay → null.
describe("actualZone5_", () => {
  it("mapt Z1..Z7 → 5 buckets (secs→min); Z5+Z6+Z7 → anaeroob", () => {
    const zm = actualZone5_([
      { id: "Z1", secs: 300 }, // 5 min → rust
      { id: "Z2", secs: 3600 }, // 60 min → z2
      { id: "Z3", secs: 600 }, // 10 min → tempo
      { id: "Z4", secs: 1200 }, // 20 min → drempel
      { id: "Z5", secs: 120 }, // 2 min ┐
      { id: "Z6", secs: 60 }, //  1 min ├→ anaeroob = 4
      { id: "Z7", secs: 60 }, //  1 min ┘
    ]);
    expect(zm).toEqual({
      rust: 5,
      z2: 60,
      tempo: 10,
      drempel: 20,
      anaeroob: 4,
    });
  });
  it("slaat niet-Z1..Z7 (SweetSpot-overlay / onbekend) over", () => {
    const zm = actualZone5_([
      { id: "Z2", secs: 1800 }, // 30 min → z2
      { id: "SS", secs: 999 }, // sweet-spot overlay → genegeerd
      { id: "Z8", secs: 999 }, // onbekend → genegeerd
    ]);
    expect(zm).toEqual({ rust: 0, z2: 30, tempo: 0, drempel: 0, anaeroob: 0 });
  });
  it("lege / niet-array / enkel-overlay → null", () => {
    expect(actualZone5_([])).toBeNull();
    expect(actualZone5_(null)).toBeNull();
    expect(actualZone5_(undefined)).toBeNull();
    expect(actualZone5_("rubbish")).toBeNull();
    expect(actualZone5_([{ id: "SS", secs: 999 }])).toBeNull(); // enkel overlay → geen valide bucket
  });
});
