import { describe, expect, it } from "vitest";
import { SleutelInhaalBlok } from "../components/schema/SleutelInhaalBlok";
import { weekTekortRegel } from "./coachNarrative";
import type { DoneEntry, SchemaDay } from "./schema";
import { openSleutelDagen } from "./sleutelinhaal";
import { bouwWeekTekort } from "./weektekort";
import { ZONE5_GRENZEN_DEFAULT } from "./zonemunt";

// ROADMAP punt 10 fase B — de rekenlaag plus de copy. Spec: docs/PUNT10-FASE-B-BOUWDOC.md.
//
// GEEN AMBIENT KLOK: `todayISO` is een parameter en elke fixture zet hem expliciet. `bouwWeekTekort`
// leest de klok nergens zelf.

const MA = "2026-07-27";
const iso = (n: number) => {
  const d = new Date(2026, 6, 27 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/** Eén blok in de RAUWE engine-vorm: minuten, het %FTP-venster en het NOMINALE zone-label dat
 * de engine er zelf op zet (`pctZoneBucket_` op het midden van de band). */
const zoneVan = (pctLo: number, pctHi: number) => {
  const mid = Math.round((pctLo + pctHi) / 2);
  if (mid < 56) return "rust";
  if (mid <= 75) return "z2";
  if (mid <= 90) return "tempo";
  if (mid <= 105) return "drempel";
  return "anaeroob";
};
const blok = (minuten: number, pctLo: number, pctHi = pctLo) => ({
  minuten,
  pctLo,
  pctHi,
  zone: zoneVan(pctLo, pctHi),
});

/** Een dag in het view-model. `sleutel` maakt hem een GEMISTE sleutelsessie. */
function dag(
  n: number,
  o: {
    sleutel?: boolean;
    kandidaat?: boolean;
    done?: boolean;
  } = {},
): SchemaDay {
  return {
    datum: iso(n),
    weekday: "ma",
    dayNum: 27 + n,
    state: o.sleutel ? "gemist" : o.done ? "done" : "planned",
    done: null,
    planSessions: o.kandidaat
      ? [{ naam: "Drempel 2×20", totaalMin: 60 } as never]
      : [],
    voorgesteldType: o.kandidaat ? "threshold" : null,
    coach: o.sleutel
      ? ({
          state: "missed",
          plannedIntent: "drempel",
          doneIntent: null,
        } as never)
      : null,
  } as unknown as SchemaDay;
}

/** De plan-kant: alleen `datum`, `sessions` en `plannedForDone` doen ertoe. */
function pDag(
  n: number,
  o: { sessies?: unknown[][]; bevroren?: unknown[] } = {},
) {
  return {
    datum: iso(n),
    sessions: (o.sessies ?? []).map((b) => ({ blokken: b })),
    plannedForDone: o.bevroren ? { totaalMin: 60, blokken: o.bevroren } : null,
  };
}

function doneVan(min: {
  tempo?: number;
  drempel?: number;
  anaeroob?: number;
}): DoneEntry {
  return {
    zoneMin5: {
      rust: 0,
      z2: 0,
      tempo: min.tempo ?? 0,
      drempel: min.drempel ?? 0,
      anaeroob: min.anaeroob ?? 0,
    },
  } as unknown as DoneEntry;
}

/** Het BASISGEVAL waarop de stem hoort te spreken: maandag gemiste sleutelsessie, dinsdag is
 * vandaag, geen kandidaat-dag meer, 60 drempelminuten gepland en 0 gereden. */
function basis(over: Record<string, unknown> = {}) {
  return {
    days: [dag(0, { sleutel: true }), dag(1)],
    proposalWeek: {
      days: [pDag(0, { bevroren: [blok(60, 95)] }), pDag(1)],
    } as never,
    doneByDate: {},
    todayISO: iso(1),
    weekMonday: MA,
    grenzen: ZONE5_GRENZEN_DEFAULT,
    ...over,
  } as never;
}

describe("bouwWeekTekort — het basisgeval", () => {
  it("gemiste sleutelsessie, geen dag meer over → de stem spreekt", () => {
    const r = bouwWeekTekort(basis());
    expect(r).not.toBeNull();
    expect(r?.tekortZones).toEqual(["drempel"]);
    const drempel = r?.termen.find((t) => t.zone === "drempel");
    expect(drempel?.gevraagd).toBe(60);
    expect(drempel?.geleverd).toBe(0);
  });

  it("de termen staan APART — geen saldo en geen totaalveld", () => {
    const r = bouwWeekTekort(basis());
    expect(r?.termen).toHaveLength(3);
    expect(Object.keys(r ?? {})).toEqual([
      "termen",
      "tekortZones",
      "weekMonday",
    ]);
  });
});

describe("bouwWeekTekort — de poorten", () => {
  it("MAANDAG zwijgt: geen verstreken dag, dus geen venster", () => {
    expect(bouwWeekTekort(basis({ todayISO: iso(0) }))).toBeNull();
  });

  it("POORT 1 — geen open sleutelprikkel op een verstreken dag → null", () => {
    expect(bouwWeekTekort(basis({ days: [dag(0), dag(1)] }))).toBeNull();
  });

  it("POORT 2 — staat er nog een kandidaat-dag, dan zwijgt de weekstem", () => {
    const r = bouwWeekTekort(
      basis({
        days: [dag(0, { sleutel: true }), dag(1, { kandidaat: true })],
      }),
    );
    expect(r).toBeNull();
  });

  it("POORT 3 — een verstreken rit zonder zonedata → geen oordeel", () => {
    const zonder = { zoneMin5: null } as unknown as DoneEntry;
    expect(
      bouwWeekTekort(basis({ doneByDate: { [iso(0)]: zonder } })),
    ).toBeNull();
  });

  it("geen tekort in enige werkzone → null (afwezigheid van verschil, geen drempel)", () => {
    expect(
      bouwWeekTekort(
        basis({ doneByDate: { [iso(0)]: doneVan({ drempel: 60 }) } }),
      ),
    ).toBeNull();
  });
});

describe("bouwWeekTekort — het rekenwerk", () => {
  it("TWEE tekort-zones in één week", () => {
    const r = bouwWeekTekort(
      basis({
        proposalWeek: {
          days: [pDag(0, { bevroren: [blok(40, 95), blok(20, 115)] }), pDag(1)],
        },
        doneByDate: { [iso(0)]: doneVan({ drempel: 10 }) },
      }),
    );
    expect(r?.tekortZones).toEqual(["drempel", "anaeroob"]);
  });

  it("een dag met TWEE sessies telt beide op", () => {
    const r = bouwWeekTekort(
      basis({
        proposalWeek: {
          days: [
            pDag(0, { sessies: [[blok(30, 95)], [blok(30, 95)]] }),
            pDag(1),
          ],
        },
      }),
    );
    expect(r?.termen.find((t) => t.zone === "drempel")?.gevraagd).toBe(60);
  });

  it("sessies WINNEN van de bevroren entry — dezelfde regel als planSessions", () => {
    const r = bouwWeekTekort(
      basis({
        proposalWeek: {
          days: [
            pDag(0, { sessies: [[blok(20, 95)]], bevroren: [blok(60, 95)] }),
            pDag(1),
          ],
        },
      }),
    );
    expect(r?.termen.find((t) => t.zone === "drempel")?.gevraagd).toBe(20);
  });

  it("een verstreken dag ZONDER bevroren entry telt als nul gevraagd", () => {
    const r = bouwWeekTekort(
      basis({
        days: [dag(0, { sleutel: true }), dag(1, { sleutel: true }), dag(2)],
        proposalWeek: {
          days: [pDag(0, { bevroren: [blok(60, 95)] }), pDag(1), pDag(2)],
        },
        todayISO: iso(2),
      }),
    );
    expect(r?.termen.find((t) => t.zone === "drempel")?.gevraagd).toBe(60);
  });
});

describe("OPRUIM-ROOD: zonder de weekstem toont dit geval NERGENS een boodschap", () => {
  it("SleutelInhaalBlok rendert niets bij een lege lijst, dus dan is er geen tekst", () => {
    const dagen = openSleutelDagen(
      [dag(0, { sleutel: true }), dag(1)],
      iso(1),
      null,
    );
    expect(dagen).toEqual([]);
    expect(SleutelInhaalBlok({ dagen })).toBeNull();
  });
});

describe("de ZONE-LABEL-POORT — bandoverloop telt niet als tekort", () => {
  it("een drempelblok dat onder de Z3/Z4-grens uitsteekt levert GEEN tempo-tekort", () => {
    // Band 88-102, midden 95 → nominaal DREMPEL. planZone5_ splitst proportioneel en laat een
    // paar minuten in tempo vallen (alles onder 90). Die minuten zijn bandoverloop, geen
    // voorgeschreven tempo-prikkel — precies het "1 Tempo-minuut" uit het v7-weekstem-scenario.
    const r = bouwWeekTekort(
      basis({
        proposalWeek: {
          days: [pDag(0, { bevroren: [blok(60, 88, 102)] }), pDag(1)],
        },
      }),
    );
    expect(r).not.toBeNull();
    // De MINUTEN zijn ongewijzigd proportioneel — de poort raakt alleen de tekort-LIJST.
    expect(r?.termen.find((t) => t.zone === "tempo")?.gevraagd).toBeGreaterThan(
      0,
    );
    expect(r?.tekortZones).toEqual(["drempel"]);
  });

  it("een zone die het plan WEL voorschreef telt mee, hoe klein het tekort ook is", () => {
    const r = bouwWeekTekort(
      basis({
        proposalWeek: {
          days: [pDag(0, { bevroren: [blok(30, 85), blok(30, 95)] }), pDag(1)],
        },
        // 29 van de 30 tempo-minuten gereden: één minuut tekort, en tempo staat wél op het plan.
        doneByDate: { [iso(0)]: doneVan({ tempo: 29, drempel: 30 }) },
      }),
    );
    expect(r?.tekortZones).toEqual(["tempo"]);
  });
});

describe("weekTekortRegel — de copy", () => {
  const zin = (n: number) =>
    weekTekortRegel(
      [{ zone: "drempel", gevraagd: 52.4, geleverd: 13.6 }],
      `2026-07-${20 + n}`,
    );

  it("noemt BEIDE termen, afgerond, en claimt geen daad", () => {
    for (let n = 0; n < 6; n++) {
      const r = zin(n);
      expect(r).toContain("52");
      expect(r).toContain("14");
      expect(r).toContain("Drempel");
      expect(r).not.toContain("ik heb");
      expect(r).not.toContain("verplaatst");
    }
  });

  it("zegt dat er geen trainingsdag meer staat", () => {
    for (let n = 0; n < 6; n++) {
      expect(zin(n)).toMatch(
        /geen trainingsdag meer|geen trainingsdag meer om/,
      );
    }
  });

  it("twee zones → zoneLijst_-vorm met 'en'", () => {
    const r = weekTekortRegel(
      [
        { zone: "drempel", gevraagd: 40, geleverd: 0 },
        { zone: "anaeroob", gevraagd: 20, geleverd: 5 },
      ],
      MA,
    );
    expect(r).toContain("Drempel");
    expect(r).toContain("VO2max");
  });

  it("enkelvoud bij 1 minuut, dus nooit een kale meervoudsvorm", () => {
    const r = weekTekortRegel(
      [{ zone: "tempo", gevraagd: 1, geleverd: 0 }],
      MA,
    );
    expect(r).toContain("1 Tempo-minuut ");
    expect(r).not.toContain("1 Tempo-minuten");
  });

  it("lege lijst → lege string, geen zin over niets", () => {
    expect(weekTekortRegel([], MA)).toBe("");
  });
});
