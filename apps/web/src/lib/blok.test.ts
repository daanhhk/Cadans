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
  dosisTredeVoorstel,
  vorigBlokStart,
  weekKwaliteitMinuten,
} from "./blok";
import {
  signatuurSeconden,
  ZONE5_GRENZEN_DEFAULT,
  zone5Grenzen,
} from "./zonemunt";

// Geen vi.setSystemTime nodig: elke datum is een parameter (blok.ts leest de klok nergens).

const DOEL_START = "2026-06-29";

/** Eén activiteiten-rij: idx0 Date, idx1 type, idx3 duur (min), idx15 zone-tijden als JSON-string.
 * `low` → Z2, `tempo` → Z3, `high` → Z4, `anaer` → Z5. */
function act(
  datumISO: string,
  type: string,
  minuten: number,
  z: { low?: number; tempo?: number; high?: number; anaer?: number } | null,
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
          { id: "Z3", secs: Math.round((z.tempo ?? 0) * 60) },
          { id: "Z4", secs: Math.round((z.high ?? 0) * 60) },
          { id: "Z5", secs: Math.round((z.anaer ?? 0) * 60) },
        ]);
  return row;
}

/**
 * Eén rit per week die exact `kwaliteit` werkminuten draagt, plus ruime low (dekking hoog).
 *
 * ZONE-MUNT fase 1b — de werkminuten worden verdeeld in de VORM die het plan vraagt (de
 * bibliotheek-signatuur, circa 28/56/16). Vóór 1b zette deze fixture álles in Z4, en dat is onder
 * de per-zone-munt geen geleverde week meer: nul tempo en nul anaeroob. Een fixture die maar één
 * zone voedt, voorspelt de app niet (WERKWIJZE) — de recon-weken uit §2.6 blijven zo meten wat ze
 * bedoelden te meten: de week-boekhouding en de drie check-uitkomsten, niet de zone-poort. Die
 * poort krijgt zijn eigen, apart rode gevallen verderop.
 */
function weekRit(datumISO: string, kwaliteit: number): ActValuesRow {
  const low = 120;
  // De vorm wordt AFGELEID uit `bibliotheekSignatuur`, niet uitgetypt: verzet de zone-sync de
  // grenzen, dan schuift deze fixture mee in plaats van stil onder norm te zakken.
  const s = signatuurSeconden(kwaliteit);
  return act(datumISO, "Ride", low + kwaliteit, {
    low,
    tempo: s.tempo / 60,
    high: s.drempel / 60,
    anaer: s.anaeroob / 60,
  });
}

/** Eén week met een VRIJ opgegeven zone-verdeling; ruime low zodat de dekking niet in de weg zit. */
function zoneWeek(
  datumISO: string,
  z: { tempo: number; high: number; anaer: number },
): ActValuesRow {
  const low = 120;
  return act(datumISO, "Ride", low + z.tempo + z.high + z.anaer, { low, ...z });
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

  // ROADMAP punt 9 nazorg 2 — DE ZOMERTIJDSPRONG. Twee lokale middernachten liggen over de
  // voorjaarssprong een uur korter uit elkaar; delen door een vaste 7x24u-constante en dan
  // floor gooide daar een hele week weg. GEMETEN met doelStart 2026-03-02: de maandag ná de
  // sprong (2026-03-30) gaf quotiënt 3,9940 en dus blokweek 3 in plaats van 4.
  // De blokweek loopt 1..BLOK_WEKEN = 1..4 en slaat daarna om: index 3 is blokweek 4, index 4 is
  // blokweek 1 van het VOLGENDE blok. 2026-03-30 ligt 28 dagen na doelStart, dus index 4 → blokweek
  // 1. Met de oude floor werd dat index 3 → blokweek 4: het blok bleef een week te lang hangen.
  it("(a) over de voorjaarssprong slaat het blok op tijd om", () => {
    expect(blokWeekVanWeek("2026-03-02", "2026-03-30")).toBe(1);
  });
  it("(b) tegenhanger zonder grens — was ook vóór de fix al goed", () => {
    expect(blokWeekVanWeek("2026-03-02", "2026-03-23")).toBe(4);
  });
  // (c) DE VAL BIJ EEN 'NETTERE' FIX. Wie dit ooit repareert met Math.round over het WEEKquotiënt
  // haalt de DST-scheefte ook weg, maar laat het blok bij een doel-start MIDDEN in de week een
  // halve week te vroeg omslaan. doelStart woensdag 2026-03-04 → maandag 2026-03-30 is 26 dagen,
  // dus floor(26/7) = 3 volle weken → blokweek 4. Round op het weekquotiënt maakt van 3,71 een 4
  // en levert blokweek 1 van het volgende blok.
  it("(c) doel-start midden in de week slaat niet te vroeg om", () => {
    expect(blokWeekVanWeek("2026-03-04", "2026-03-30")).toBe(4);
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
  it("FTP bij 5 uur → 3 prikkels, norm 84, zones 24/47/13", () => {
    expect(blokDosisNorm("FTP", 5)).toEqual({
      prikkels: 3,
      minPerPrikkel: 28,
      norm: 84,
      normTempo: 24,
      normDrempel: 47,
      normAnaeroob: 13,
    });
  });
  it("FTP bij 4 uur → 2 prikkels, norm 56, zones 16/31/9", () => {
    expect(blokDosisNorm("FTP", 4)).toEqual({
      prikkels: 2,
      minPerPrikkel: 28,
      norm: 56,
      normTempo: 16,
      normDrempel: 31,
      normAnaeroob: 9,
    });
  });
  it("Onderhoud bij 3 uur → 3 prikkels (frequentie is beschermd), norm 66, zones 19/37/10", () => {
    expect(blokDosisNorm("Onderhoud", 3)).toEqual({
      prikkels: 3,
      minPerPrikkel: 22,
      norm: 66,
      normTempo: 19,
      normDrempel: 37,
      normAnaeroob: 10,
    });
  });
  it("de dosis-trede tilt alle drie de zone-normen mee", () => {
    const zones = (t: number) => {
      const n = blokDosisNorm("FTP", 5, t);
      return [n?.normTempo, n?.normDrempel, n?.normAnaeroob];
    };
    expect(zones(1)).toEqual([25, 51, 14]);
    expect(zones(2)).toEqual([27, 54, 15]);
    expect(zones(3)).toEqual([29, 57, 16]);
    expect(zones(4)).toEqual([30, 61, 17]);
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

  // (a) — Z3 en Z4 staan nu APART, en het totaal beweegt geen minuut. Onder de oude vouwing
  // (Z3+Z4 → high) was 18 + 25 één getal van 43; nu zijn het twee, met dezelfde som.
  it("splitst Z3 en Z4 apart, met een kwaliteitstotaal gelijk aan de oude vouwing", () => {
    const rows = [
      act("2026-07-21", "Ride", 108, {
        low: 60,
        tempo: 18,
        high: 25,
        anaer: 5,
      }),
    ];
    const k = weekKwaliteitMinuten(rows, "2026-07-20");
    expect(k.tempo).toBe(18);
    expect(k.drempel).toBe(25);
    expect(k.anaeroob).toBe(5);
    expect(k.z2).toBe(60);
    // 18 + 25 + 5 — exact het oude high (Z3+Z4 = 43) plus anaerobic (5).
    expect(k.kwaliteit).toBe(48);
    expect(k.zoneMinuten).toBe(108);
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

// ROADMAP punt 14 fase 1 — DE POORTSET. Het oordeel telt alleen zones waarvan het bewaarde
// weekplan van die week het nominale label voorschreef. De bestaande tests hieronder toetsen de
// COMPENSATIE TUSSEN ZONES, dus die hebben een poortset nodig die alle drie de werkzones opent;
// anders meten ze het datagat in plaats van het oordeel. Eén blok van vier weken, elke maandag een
// entry met een blok per werkzone.
function wpAlle(startMonday: string, weken = 4): unknown[] {
  const uit: unknown[] = [];
  for (let i = 0; i < weken; i++) {
    const d = new Date(
      Number(startMonday.slice(0, 4)),
      Number(startMonday.slice(5, 7)) - 1,
      Number(startMonday.slice(8, 10)) + i * 7,
    );
    uit.push({
      datum: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      blokken: [
        { minuten: 20, zone: "tempo", pctLo: 80, pctHi: 88 },
        { minuten: 40, zone: "drempel", pctLo: 92, pctHi: 100 },
        { minuten: 10, zone: "anaeroob", pctLo: 110, pctHi: 120 },
      ],
    });
  }
  return uit;
}
const WP_RECON = wpAlle("2026-06-29");

// ── het blok uit de recon (docs/UITVOERINGS-REFERENT-RECON.md §2.6) ──────────
const RECON_ACTS: ActValuesRow[] = [
  weekRit("2026-06-30", 110),
  weekRit("2026-07-07", 97),
  weekRit("2026-07-14", 118),
  weekRit("2026-07-21", 91),
];

function reconRef(todayISO = "2026-07-27") {
  const r = buildBlokReferent({
    doelStart: null,
    activities: RECON_ACTS,
    doel: "FTP",
    weekUren: 5,
    startMonday: "2026-06-29",
    weekplans: WP_RECON,
    todayISO,
  });
  if (!r) throw new Error("referent onverwacht null");
  return r;
}

// ── ROADMAP punt 6 fase 2 — DE GESYNCHRONISEERDE ZONE-GRENZEN DRAGEN DOOR ────
// De Z3/Z4-grens van 90 naar 85 verschuiven maakt de tempo-band smaller en de drempel-band
// breder, dus de bibliotheek-signatuur verschuift minuten van tempo naar drempel. PER PLEK
// geasserteerd: een gedeelde as kan volledig via één tak lopen en de andere verbergen.
const STRAKKER: readonly number[] = [55, 75, 85, 105];

describe("de zone-grenzen dragen door tot in de norm", () => {
  it("(a) blokDosisNorm: een lagere Z3/Z4-grens schuift tempo naar drempel", () => {
    const standaard = blokDosisNorm("FTP", 5);
    const eigen = blokDosisNorm("FTP", 5, 0, STRAKKER);
    if (!standaard || !eigen) throw new Error("norm onverwacht null");
    // De SCHAAL blijft: prikkels en minuten per prikkel hangen niet aan de zones.
    expect(eigen.norm).toBe(standaard.norm);
    expect(eigen.normTempo).toBeLessThan(standaard.normTempo);
    expect(eigen.normDrempel).toBeGreaterThan(standaard.normDrempel);
  });

  it("(b) buildBlokReferent geeft de grenzen door aan de weeknormen", () => {
    const maak = (grenzen?: readonly number[]) =>
      buildBlokReferent({
        doelStart: null,
        activities: RECON_ACTS,
        doel: "FTP",
        weekUren: 5,
        startMonday: "2026-06-29",
        weekplans: WP_RECON,
        todayISO: "2026-07-27",
        grenzen,
      });
    const standaard = maak();
    const eigen = maak(STRAKKER);
    if (!standaard || !eigen) throw new Error("referent onverwacht null");
    expect(eigen.normTempo).toBeLessThan(standaard.normTempo);
    expect(eigen.normDrempel).toBeGreaterThan(standaard.normDrempel);
    // En het komt ook echt op de WEEK terecht, niet alleen op het referent-object.
    expect(eigen.weeks[0]?.gevraagdTempo).toBeLessThan(
      standaard.weeks[0]?.gevraagdTempo ?? 0,
    );
  });

  it("(b) buildBlokReview geeft de grenzen door", () => {
    const maak = (grenzen: readonly number[]) =>
      buildBlokReview({
        activities: RECON_ACTS,
        doel: "FTP",
        weekUren: 5,
        doelStart: DOEL_START,
        weekplans: WP_RECON,
        weekMondayISO: "2026-07-27",
        todayISO: "2026-07-27",
        ctlDelta: -5,
        grenzen,
      });
    const standaard = maak(ZONE5_GRENZEN_DEFAULT);
    const eigen = maak(STRAKKER);
    expect(eigen?.normTempo).toBeLessThan(standaard?.normTempo ?? 0);
    expect(eigen?.normDrempel).toBeGreaterThan(standaard?.normDrempel ?? 0);
  });

  // dosisTredeVoorstel heeft GEEN eigen `grenzen`-parameter: zijn uitvoer draagt alleen de schaal
  // (minNu/minStraks en de weeknorm-totalen), dus de grenzen kunnen daar per constructie niets
  // veranderen. Wat hier te toetsen is: de voorstel-norm komt uit dezelfde `blokDosisNorm`-weg.
  it("(b) dosisTredeVoorstel leest de norm via dezelfde weg", () => {
    const review = buildBlokReview({
      activities: RECON_ACTS,
      doel: "FTP",
      weekUren: 5,
      doelStart: DOEL_START,
      weekplans: WP_RECON,
      weekMondayISO: "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: -5,
      grenzen: ZONE5_GRENZEN_DEFAULT,
    });
    const v = dosisTredeVoorstel({
      review,
      doelStart: DOEL_START,
      weekMondayISO: "2026-07-27",
      doel: "FTP",
      weekUren: 5,
      trede: 0,
      beantwoordBlok: null,
    });
    expect(v).not.toBeNull();
    expect(v?.normNu).toBe(blokDosisNorm("FTP", 5, 0)?.norm);
    expect(v?.normStraks).toBe(blokDosisNorm("FTP", 5, 1)?.norm);
  });

  // DIT IS DE WEG WAARLANGS DE GRENZEN HET VOORSTEL BEREIKEN: niet via een eigen parameter, maar
  // via de REVIEW. Met een strakkere Z3/Z4-grens stijgt de drempel-norm, haalt het recon-blok hem
  // niet meer, leest de check niet-geleverd en vervalt het voorstel. Zonder deze test zou het
  // weghalen van de parameter op `dosisTredeVoorstel` niets aantoonbaar achterlaten.
  it("(b) strakkere grenzen laten het blok vallen en dus het voorstel vervallen", () => {
    const review = buildBlokReview({
      activities: RECON_ACTS,
      doel: "FTP",
      weekUren: 5,
      doelStart: DOEL_START,
      weekplans: WP_RECON,
      weekMondayISO: "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: -5,
      grenzen: STRAKKER,
    });
    expect(review?.check?.uitkomst).toBe("niet_geleverd");
    expect(
      dosisTredeVoorstel({
        review,
        doelStart: DOEL_START,
        weekMondayISO: "2026-07-27",
        doel: "FTP",
        weekUren: 5,
        trede: 0,
        beantwoordBlok: null,
      }),
    ).toBeNull();
  });

  it("(c) zonder gesynchroniseerde zones is het gedrag dat van vandaag, langs de volle weg", () => {
    const viaNull = buildBlokReferent({
      doelStart: null,
      activities: RECON_ACTS,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
      todayISO: "2026-07-27",
      grenzen: zone5Grenzen(null),
    });
    const zonder = buildBlokReferent({
      doelStart: null,
      activities: RECON_ACTS,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
      todayISO: "2026-07-27",
    });
    if (!viaNull || !zonder) throw new Error("referent onverwacht null");
    expect(viaNull.normTempo).toBe(zonder.normTempo);
    expect(viaNull.normDrempel).toBe(zonder.normDrempel);
    expect(viaNull.normAnaeroob).toBe(zonder.normAnaeroob);
    expect(viaNull.weeks.map((w) => w.gevraagdTempo)).toEqual(
      zonder.weeks.map((w) => w.gevraagdTempo),
    );
  });
});

describe("buildBlokReferent — het gemeten blok 29-06 t/m 20-07", () => {
  it("gevraagd is vlak over de opbouwweken en meso-geschaald in de deload", () => {
    expect(reconRef().weeks.map((w) => w.gevraagd)).toEqual([84, 84, 84, 50]);
  });

  it("elke zone-norm schaalt apart mee in de deload: 24/47/13 wordt 14/28/8", () => {
    const w = reconRef().weeks;
    expect(w.map((x) => x.gevraagdTempo)).toEqual([24, 24, 24, 14]);
    expect(w.map((x) => x.gevraagdDrempel)).toEqual([47, 47, 47, 28]);
    expect(w.map((x) => x.gevraagdAnaeroob)).toEqual([13, 13, 13, 8]);
  });

  it("drie beoordeelde weken, alle drie geleverd; de deload telt niet mee", () => {
    const w = reconRef().weeks;
    // `geleverd` is een som van secs/60-termen over vijf buckets: binair niet exact. Toetsen op
    // de waarde met tolerantie, niet op bit-gelijkheid (WERKWIJZE, rond één keer af).
    [110, 97, 118, 91].forEach((verwacht, i) => {
      expect(w[i]?.geleverd).toBeCloseTo(verwacht, 6);
    });
    expect(w.map((x) => x.telt)).toEqual([true, true, true, false]);
    expect(w.map((x) => x.geleverdOk)).toEqual([true, true, true, null]);
    const u = blokUitvoering(reconRef());
    expect(u).toEqual({
      geleverd: true,
      geleverdeWeken: 3,
      beoordeeldeWeken: 3,
      tekortZones: [],
      verschuiving: false,
    });
  });

  it("de deloadweek is compleet maar valt buiten het oordeel (blokweek 4)", () => {
    const vier = reconRef().weeks[3];
    expect(vier?.status).toBe("compleet");
    expect(vier?.blokWeek).toBe(4);
    expect(vier?.telt).toBe(false);
  });
});

// ── ZONE-MUNT fase 1b — de poort per zone ────────────────────────────────────
// De norm bij FTP/5 uur is 24 Tempo · 47 Drempel · 13 VO2max. Elk geval hieronder zet TWEE zones
// ruim boven norm en laat er ÉÉN vallen: een poort die niet apart rood te krijgen is, is geen poort.

function zoneRef(weken: ActValuesRow[]) {
  const r = buildBlokReferent({
    doelStart: null,
    activities: weken,
    doel: "FTP",
    weekUren: 5,
    startMonday: "2026-06-29",
    weekplans: WP_RECON,
    todayISO: "2026-07-27",
  });
  if (!r) throw new Error("referent onverwacht null");
  return r;
}

describe("het oordeel valt per zone — geen compensatie", () => {
  it("(b1) alleen TEMPO tekort laat de week vallen", () => {
    const w = zoneRef([
      zoneWeek("2026-06-30", { tempo: 23, high: 80, anaer: 40 }),
    ]).weeks[0];
    expect(w?.geleverdTempo).toBe(23);
    expect(w?.zonesOpNorm).toBe(2);
    expect(w?.geleverdOk).toBe(false);
  });

  it("(b2) alleen DREMPEL tekort laat de week vallen", () => {
    const w = zoneRef([
      zoneWeek("2026-06-30", { tempo: 60, high: 46, anaer: 40 }),
    ]).weeks[0];
    expect(w?.geleverdDrempel).toBe(46);
    expect(w?.zonesOpNorm).toBe(2);
    expect(w?.geleverdOk).toBe(false);
  });

  it("(b3) alleen ANAEROOB tekort laat de week vallen", () => {
    const w = zoneRef([
      zoneWeek("2026-06-30", { tempo: 60, high: 80, anaer: 12 }),
    ]).weeks[0];
    expect(w?.geleverdAnaeroob).toBe(12);
    expect(w?.zonesOpNorm).toBe(2);
    expect(w?.geleverdOk).toBe(false);
  });

  it("alle drie op norm → geleverd", () => {
    const w = zoneRef([
      zoneWeek("2026-06-30", { tempo: 24, high: 47, anaer: 13 }),
    ]).weeks[0];
    expect(w?.zonesOpNorm).toBe(3);
    expect(w?.geleverdOk).toBe(true);
  });

  // (c) — beide kanten in één test: de nieuwe munt laat de week vallen, de OUDE zou hem hebben
  // goedgekeurd. Dat is precies het grijs-rijden dat de app als "geleverd" boekte.
  it("(c) tempo ver boven norm dicht een drempel-tekort NIET, terwijl de oude munt dat wel deed", () => {
    const week = zoneWeek("2026-06-30", { tempo: 90, high: 20, anaer: 14 });
    const w = zoneRef([week]).weeks[0];
    if (!w) throw new Error("week onverwacht leeg");
    expect(w.geleverdTempo).toBe(90);
    expect(w.geleverdDrempel).toBe(20);
    expect(w.zonesOpNorm).toBe(2);
    expect(w.geleverdOk).toBe(false);
    // De OUDE munt: tempo + drempel + anaeroob tegen één norm van 84 → 124 ≥ 84 → geleverd.
    expect(w.geleverd).toBe(124);
    expect(w.geleverd >= w.gevraagd).toBe(true);
  });
});

describe("de diagnose — tekortZones en verschuiving", () => {
  it("(d) verschuiving is waar als er in elke gemiste week een zone boven én een onder norm zit", () => {
    const u = blokUitvoering(
      zoneRef([
        zoneWeek("2026-06-30", { tempo: 90, high: 20, anaer: 14 }),
        zoneWeek("2026-07-07", { tempo: 85, high: 25, anaer: 15 }),
        zoneWeek("2026-07-14", { tempo: 95, high: 18, anaer: 14 }),
      ]),
    );
    expect(u.geleverd).toBe(false);
    expect(u.verschuiving).toBe(true);
    expect(u.tekortZones).toEqual(["drempel"]);
  });

  it("(d) verschuiving is onwaar als een week overal tekortkomt", () => {
    const u = blokUitvoering(
      zoneRef([
        zoneWeek("2026-06-30", { tempo: 5, high: 8, anaer: 2 }),
        zoneWeek("2026-07-07", { tempo: 4, high: 6, anaer: 1 }),
        zoneWeek("2026-07-14", { tempo: 6, high: 9, anaer: 3 }),
      ]),
    );
    expect(u.geleverd).toBe(false);
    expect(u.verschuiving).toBe(false);
    expect(u.tekortZones).toEqual(["tempo", "drempel", "anaeroob"]);
  });

  it("een geleverd blok draagt geen diagnose", () => {
    const u = blokUitvoering(reconRef());
    expect(u.geleverd).toBe(true);
    expect(u.tekortZones).toEqual([]);
    expect(u.verschuiving).toBe(false);
  });
});

describe("blokCheck — drie uitkomsten", () => {
  // POORT-ASSERTIE (ROADMAP punt 6, eerste eis): deze takken leunen erop dat de recon-weken ALLE
  // DRIE de zone-normen halen. Verschuift de signatuur, dan zakken ze onder norm en meet deze
  // describe de zone-poort in plaats van de check-uitkomst — zonder dat er iets faalt.
  it("de recon-weken halen alle drie de zone-normen (poort vóór de uitkomst)", () => {
    const geteld = reconRef().weeks.filter((w) => w.telt);
    expect(geteld).toHaveLength(3);
    expect(geteld.map((w) => w.zonesOpNorm)).toEqual([3, 3, 3]);
    expect(geteld.map((w) => w.geleverdOk)).toEqual([true, true, true]);
  });

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
      doelStart: null,
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
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
      doelStart: null,
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
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
      doelStart: null,
      activities: acts,
      doel: "FTP",
      weekUren: 5,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
      todayISO: "2026-07-27",
    });
    if (!ref) throw new Error("referent onverwacht null");
    // POORT-ASSERTIE: de twee GEREDEN weken moeten alle drie de zone-normen halen, anders meet
    // dit geval niet de niet-gereden week maar de signatuur.
    expect(ref.weeks[0]?.zonesOpNorm).toBe(3);
    expect(ref.weeks[2]?.zonesOpNorm).toBe(3);
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
      doelStart: null,
      activities: acts,
      doel: "Onderhoud",
      weekUren: 3,
      startMonday: "2026-06-29",
      weekplans: WP_RECON,
      todayISO: "2026-07-27",
    });
    if (!r) throw new Error("referent onverwacht null");
    return r;
  }

  it("blokweek 4 krijgt de VOLLE norm (geen mesocyclus, dus geen deload)", () => {
    expect(ref().weeks.map((w) => w.gevraagd)).toEqual([66, 66, 66, 66]);
  });

  it("blokUitvoering geeft wél een uitkomst, blokCheck is null", () => {
    // POORT-ASSERTIE: de Onderhoud-normen (19/37/10) moeten door alle drie de weken gehaald
    // worden, anders toetst dit geval de zone-poort in plaats van de blokCheck-null.
    expect(
      ref()
        .weeks.filter((w) => w.telt)
        .map((w) => w.zonesOpNorm),
    ).toEqual([3, 3, 3]);
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
      weekplans: WP_RECON,
      weekMondayISO: o.weekMondayISO ?? "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: o.ctlDelta,
      grenzen: ZONE5_GRENZEN_DEFAULT,
    });
  }

  it("het afgeronde blok met ctlDelta −5 → geleverd_niet_gestegen, drie beoordeelde weken", () => {
    const r = review({ ctlDelta: -5 });
    expect(r?.startMonday).toBe("2026-06-29");
    expect(r?.eindMonday).toBe("2026-07-20");
    expect(r?.fase).toBe("afgerond");
    expect(r?.norm).toBe(84);
    expect(r?.uitvoering.beoordeeldeWeken).toBe(3);
    // POORT-ASSERTIE: eerst dat de uitvoering GELEVERD is, dan pas de check-uitkomst.
    expect(r?.uitvoering.geleverd).toBe(true);
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
      weekplans: WP_RECON,
      weekMondayISO: "2026-07-27",
      todayISO: "2026-07-27",
      ctlDelta: -5,
      grenzen: ZONE5_GRENZEN_DEFAULT,
    });
    expect(r?.check).toBeNull();
    expect(r?.uitvoering.geleverd).toBe(true);
    expect(r?.uitvoering.beoordeeldeWeken).toBe(3);
  });
});
