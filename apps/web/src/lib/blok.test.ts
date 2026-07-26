import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import {
  blokCheck,
  blokDosisNorm,
  blokReviewVenster,
  blokStartVoorWeek,
  blokUitvoering,
  blokWeekVanWeek,
  buildBlokReferent,
  buildBlokReview,
  vorigBlokStart,
  weekKwaliteitMinuten,
} from "./blok";

// Geen vi.setSystemTime nodig: elke datum is een parameter (blok.ts leest de klok nergens).

const DOEL_START = "2026-06-29";

/** Eén activiteiten-rij: idx0 Date, idx1 type, idx3 duur (min), idx15 zone-tijden als JSON-string. */
function act(
  datumISO: string,
  type: string,
  minuten: number,
  z: { low?: number; high?: number; anaer?: number } | null,
): ActValuesRow {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y, (m ?? 1) - 1, d ?? 1);
  row[1] = type;
  row[3] = minuten;
  row[15] =
    z == null
      ? null
      : JSON.stringify([
          { id: "Z2", secs: Math.round((z.low ?? 0) * 60) },
          { id: "Z4", secs: Math.round((z.high ?? 0) * 60) },
          { id: "Z5", secs: Math.round((z.anaer ?? 0) * 60) },
        ]);
  return row;
}

/** Eén rit per week die exact `kwaliteit` high-minuten draagt, plus ruime low (dekking hoog). */
function weekRit(datumISO: string, kwaliteit: number): ActValuesRow {
  const low = 120;
  return act(datumISO, "Ride", low + kwaliteit, { low, high: kwaliteit });
}

describe("blokWeekVanWeek — kalender-blokweek uit de weekmaandag", () => {
  it("doelStart 2026-06-29 geeft 1/2/3/4 en dan weer 1", () => {
    expect(blokWeekVanWeek(DOEL_START, "2026-06-29")).toBe(1);
    expect(blokWeekVanWeek(DOEL_START, "2026-07-06")).toBe(2);
    expect(blokWeekVanWeek(DOEL_START, "2026-07-13")).toBe(3);
    expect(blokWeekVanWeek(DOEL_START, "2026-07-20")).toBe(4);
    expect(blokWeekVanWeek(DOEL_START, "2026-07-27")).toBe(1);
  });
  it("geen doelStart → 1 (fail-open, geen blokgrens af te leiden)", () => {
    expect(blokWeekVanWeek(null, "2026-07-20")).toBe(1);
  });
  it("weekmaandag vóór doelStart → index 0 → blokweek 1", () => {
    expect(blokWeekVanWeek(DOEL_START, "2026-06-15")).toBe(1);
  });
});

describe("blokStartVoorWeek / vorigBlokStart", () => {
  it("blokstart van de deloadweek 20-07 is 29-06", () => {
    expect(blokStartVoorWeek(DOEL_START, "2026-07-20")).toBe("2026-06-29");
  });
  it("het blok vóór 27-07 begint op 29-06", () => {
    expect(vorigBlokStart("2026-07-27")).toBe("2026-06-29");
  });
});

describe("blokDosisNorm — doel plus gedeclareerde weekuren", () => {
  it("FTP bij 5 uur → 3 prikkels, norm 84", () => {
    expect(blokDosisNorm("FTP", 5)).toEqual({
      prikkels: 3,
      minPerPrikkel: 28,
      norm: 84,
    });
  });
  it("FTP bij 4 uur → 2 prikkels, norm 56", () => {
    expect(blokDosisNorm("FTP", 4)).toEqual({
      prikkels: 2,
      minPerPrikkel: 28,
      norm: 56,
    });
  });
  it("Onderhoud bij 3 uur → 3 prikkels (frequentie is beschermd), norm 66", () => {
    expect(blokDosisNorm("Onderhoud", 3)).toEqual({
      prikkels: 3,
      minPerPrikkel: 22,
      norm: 66,
    });
  });
  it("geen gedeclareerde weekuren → null (geen norm, dus geen oordeel)", () => {
    expect(blokDosisNorm("FTP", null)).toBeNull();
    expect(blokDosisNorm("FTP", 0)).toBeNull();
  });
});

describe("weekKwaliteitMinuten — geleverde zoneminuten per kalenderweek", () => {
  it("telt alleen fiets-types", () => {
    const rows = [
      act("2026-07-21", "Ride", 60, { low: 30, high: 30 }),
      act("2026-07-22", "Run", 60, { low: 10, high: 50 }),
    ];
    const k = weekKwaliteitMinuten(rows, "2026-07-20");
    expect(k.kwaliteit).toBe(30);
    expect(k.ritMinuten).toBe(60);
  });

  it("bucket op de juiste week (venster [ma .. ma+7d))", () => {
    const rows = [
      act("2026-07-19", "Ride", 60, { high: 20 }), // zondag ervóór
      act("2026-07-20", "Ride", 60, { high: 30 }), // maandag zelf → telt
      act("2026-07-26", "Ride", 60, { high: 40 }), // zondag → telt
      act("2026-07-27", "Ride", 60, { high: 50 }), // maandag erna
    ];
    expect(weekKwaliteitMinuten(rows, "2026-07-20").kwaliteit).toBe(70);
  });

  it("high + anaerobic vormen samen de kwaliteit", () => {
    const rows = [
      act("2026-07-21", "Ride", 90, { low: 60, high: 25, anaer: 5 }),
    ];
    const k = weekKwaliteitMinuten(rows, "2026-07-20");
    expect(k.high).toBe(25);
    expect(k.anaerobic).toBe(5);
    expect(k.kwaliteit).toBe(30);
    expect(k.zoneMinuten).toBe(90);
  });

  it("rij zonder zonedata telt in ritMinuten, niet in zoneMinuten", () => {
    const rows = [
      act("2026-07-21", "Ride", 60, { low: 40, high: 20 }),
      act("2026-07-22", "Ride", 90, null),
    ];
    const k = weekKwaliteitMinuten(rows, "2026-07-20");
    expect(k.ritMinuten).toBe(150);
    expect(k.zoneMinuten).toBe(60);
    expect(k.kwaliteit).toBe(20);
  });
});

// ── het blok uit de recon (docs/UITVOERINGS-REFERENT-RECON.md §2.6) ──────────
const RECON_ACTS: ActValuesRow[] = [
  weekRit("2026-06-30", 110),
  weekRit("2026-07-07", 97),
  weekRit("2026-07-14", 118),
  weekRit("2026-07-21", 91),
];

function reconRef(todayISO = "2026-07-27") {
  const r = buildBlokReferent({
    activities: RECON_ACTS,
    doel: "FTP",
    weekUren: 5,
    startMonday: "2026-06-29",
    todayISO,
  });
  if (!r) throw new Error("referent onverwacht null");
  return r;
}

describe("buildBlokReferent — het gemeten blok 29-06 t/m 20-07", () => {
  it("gevraagd is vlak over de opbouwweken en meso-geschaald in de deload", () => {
    expect(reconRef().weeks.map((w) => w.gevraagd)).toEqual([84, 84, 84, 50]);
  });

  it("drie beoordeelde weken, alle drie geleverd; de deload telt niet mee", () => {
    const w = reconRef().weeks;
    expect(w.map((x) => x.geleverd)).toEqual([110, 97, 118, 91]);
    expect(w.map((x) => x.telt)).toEqual([true, true, true, false]);
    expect(w.map((x) => x.geleverdOk)).toEqual([true, true, true, null]);
    const u = blokUitvoering(reconRef());
    expect(u).toEqual({
      geleverd: true,
      geleverdeWeken: 3,
      beoordeeldeWeken: 3,
    });
  });

  it("de deloadweek is compleet maar valt buiten het oordeel (blokweek 4)", () => {
    const vier = reconRef().weeks[3];
    expect(vier?.status).toBe("compleet");
    expect(vier?.blokWeek).toBe(4);
    expect(vier?.telt).toBe(false);
  });
});

describe("blokCheck — drie uitkomsten", () => {
  it("geleverd maar CTL niet gestegen → geleverd_niet_gestegen (het plan was te licht)", () => {
    const c = blokCheck(reconRef(), -5, "FTP");
    expect(c?.uitkomst).toBe("geleverd_niet_gestegen");
    expect(c?.geleverdeWeken).toBe(3);
    expect(c?.gestegen).toBe(false);
  });

  it("geleverd én gestegen → geleverd_gestegen (volgende opbouwtrede)", () => {
    const c = blokCheck(reconRef(), 3, "FTP");
    expect(c?.uitkomst).toBe("geleverd_gestegen");
    expect(c?.gestegen).toBe(true);
  });

  it("maar één van de drie opbouwweken op norm → niet_geleverd", () => {
    const acts = [
      weekRit("2026-06-30", 110),
      weekRit("2026-07-07", 20),
      weekRit("2026-07-14", 25),
    ];
    const ref = buildBlokReferent({
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      todayISO: "2026-07-27",
    });
    if (!ref) throw new Error("referent onverwacht null");
    expect(blokUitvoering(ref).geleverdeWeken).toBe(1);
    expect(blokCheck(ref, -5, "FTP")?.uitkomst).toBe("niet_geleverd");
  });

  it("maar één beoordeelbare week → geen oordeel (null)", () => {
    // todayISO 06-07: week 1 is compleet, week 2 loopt nog.
    const ref = reconRef("2026-07-06");
    expect(blokUitvoering(ref).beoordeeldeWeken).toBe(1);
    expect(blokUitvoering(ref).geleverd).toBeNull();
    expect(blokCheck(ref, -5, "FTP")).toBeNull();
  });

  it("ctlDelta null → geen effect-uitspraak", () => {
    expect(blokCheck(reconRef(), null, "FTP")).toBeNull();
  });
});

describe("dekkings-poort — te weinig zonedata is niet te beoordelen", () => {
  it("week met minder dan de helft zonedata telt niet en verlaagt beoordeeldeWeken", () => {
    const acts = [
      weekRit("2026-06-30", 110),
      // week 2: 200 ritminuten, maar slechts 60 minuten zonedata → dekking 0,3.
      act("2026-07-07", "Ride", 100, { low: 40, high: 20 }),
      act("2026-07-08", "Ride", 100, null),
      weekRit("2026-07-14", 118),
    ];
    const ref = buildBlokReferent({
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      todayISO: "2026-07-27",
    });
    if (!ref) throw new Error("referent onverwacht null");
    const twee = ref.weeks[1];
    expect(twee?.zoneDekking).toBeCloseTo(0.3, 5);
    expect(twee?.telt).toBe(false);
    expect(blokUitvoering(ref).beoordeeldeWeken).toBe(2);
  });

  it("week zonder ritten telt WEL mee (niet gereden is een echte misser)", () => {
    const acts = [weekRit("2026-06-30", 110), weekRit("2026-07-14", 118)];
    const ref = buildBlokReferent({
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      todayISO: "2026-07-27",
    });
    if (!ref) throw new Error("referent onverwacht null");
    const twee = ref.weeks[1];
    expect(twee?.ritMinuten).toBe(0);
    expect(twee?.telt).toBe(true);
    expect(twee?.geleverdOk).toBe(false);
    expect(blokUitvoering(ref).beoordeeldeWeken).toBe(3);
  });
});

describe("Onderhoud — uitvoering wél, effect niet (CTL hoort te dalen)", () => {
  const acts = [
    weekRit("2026-06-30", 70),
    weekRit("2026-07-07", 70),
    weekRit("2026-07-14", 70),
    weekRit("2026-07-21", 70),
  ];
  function ref() {
    const r = buildBlokReferent({
      activities: acts,
      doel: "Onderhoud",
      weekUren: 3,
      startMonday: "2026-06-29",
      todayISO: "2026-07-27",
    });
    if (!r) throw new Error("referent onverwacht null");
    return r;
  }

  it("blokweek 4 krijgt de VOLLE norm (geen mesocyclus, dus geen deload)", () => {
    expect(ref().weeks.map((w) => w.gevraagd)).toEqual([66, 66, 66, 66]);
  });

  it("blokUitvoering geeft wél een uitkomst, blokCheck is null", () => {
    expect(blokUitvoering(ref()).geleverd).toBe(true);
    expect(blokCheck(ref(), -5, "Onderhoud")).toBeNull();
  });
});

// ── 5a-ii — venster en review ────────────────────────────────────────────────

describe("blokReviewVenster — wanneer mag de kaart, en welk blok", () => {
  it("blokweek 2 en 3 → null (de opbouwweken zijn nog niet af)", () => {
    expect(blokReviewVenster(DOEL_START, "2026-07-06")).toBeNull();
    expect(blokReviewVenster(DOEL_START, "2026-07-13")).toBeNull();
  });

  it("blokweek 4 → het LOPENDE blok, anker is de huidige maandag", () => {
    expect(blokReviewVenster(DOEL_START, "2026-07-20")).toEqual({
      startMonday: "2026-06-29",
      ctlAnker: "2026-07-20",
      fase: "lopend",
    });
  });

  it("blokweek 1 → het VORIGE blok, anker precies zeven dagen terug", () => {
    expect(blokReviewVenster(DOEL_START, "2026-07-27")).toEqual({
      startMonday: "2026-06-29",
      ctlAnker: "2026-07-20",
      fase: "afgerond",
    });
  });

  it("het anker is altijd de maandag van blokweek 4 van het beoordeelde blok", () => {
    for (const ma of ["2026-07-20", "2026-07-27"]) {
      const v = blokReviewVenster(DOEL_START, ma);
      expect(v).not.toBeNull();
      if (!v) return;
      // anker = startMonday + 21 dagen → computeBlockCtlDelta meet exact de drie opbouwweken.
      expect(blokStartVoorWeek(DOEL_START, v.ctlAnker)).toBe(v.startMonday);
      expect(blokWeekVanWeek(DOEL_START, v.ctlAnker)).toBe(4);
    }
  });
});

describe("buildBlokReview", () => {
  function review(o: {
    ctlDelta: number | null;
    doel?: string;
    weekUren?: number | null;
    weekMondayISO?: string;
  }) {
    return buildBlokReview({
      activities: RECON_ACTS,
      doel: o.doel ?? "FTP",
      weekUren: o.weekUren === undefined ? 5 : o.weekUren,
      doelStart: DOEL_START,
      weekMondayISO: o.weekMondayISO ?? "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: o.ctlDelta,
    });
  }

  it("het afgeronde blok met ctlDelta −5 → geleverd_niet_gestegen, drie beoordeelde weken", () => {
    const r = review({ ctlDelta: -5 });
    expect(r?.startMonday).toBe("2026-06-29");
    expect(r?.eindMonday).toBe("2026-07-20");
    expect(r?.fase).toBe("afgerond");
    expect(r?.norm).toBe(84);
    expect(r?.uitvoering.beoordeeldeWeken).toBe(3);
    expect(r?.check?.uitkomst).toBe("geleverd_niet_gestegen");
  });

  it("ctlDelta null → check null, maar wél een review met uitvoering", () => {
    const r = review({ ctlDelta: null });
    expect(r).not.toBeNull();
    expect(r?.check).toBeNull();
    expect(r?.uitvoering.geleverd).toBe(true);
    expect(r?.ctlDelta).toBeNull();
  });

  it("geen gedeclareerde weekuren → null (geen norm, dus geen kaart)", () => {
    expect(review({ ctlDelta: -5, weekUren: null })).toBeNull();
  });

  it("buiten blokweek 1 en 4 → null", () => {
    expect(review({ ctlDelta: -5, weekMondayISO: "2026-07-13" })).toBeNull();
  });

  it("Onderhoud → check null, uitvoering gevuld", () => {
    const r = buildBlokReview({
      activities: [
        weekRit("2026-06-30", 70),
        weekRit("2026-07-07", 70),
        weekRit("2026-07-14", 70),
      ],
      doel: "Onderhoud",
      weekUren: 3,
      doelStart: DOEL_START,
      weekMondayISO: "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: -5,
    });
    expect(r?.check).toBeNull();
    expect(r?.uitvoering.geleverd).toBe(true);
    expect(r?.uitvoering.beoordeeldeWeken).toBe(3);
  });
});
