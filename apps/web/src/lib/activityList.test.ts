import type { ActivitiesResponse } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { type ActivityListRow, buildActivityList } from "./activityList";

// 17-koloms rij-helper (idx0 datum · idx1 type · idx2 naam · idx3 duurMin · idx4 afstandKm ·
// idx7 ifPct · idx8 tss · idx16 activity_id_ext).
function row(o: {
  datum?: unknown;
  type?: string;
  naam?: string;
  duurMin?: number;
  afstandKm?: number;
  ifPct?: number | string;
  tss?: number;
  idExt?: string;
}): (string | number | null)[] {
  const r: (string | number | null)[] = new Array(17).fill("");
  r[0] = (o.datum ?? "2026-07-20T10:00:00") as string;
  r[1] = o.type ?? "Ride";
  r[2] = o.naam ?? "";
  r[3] = o.duurMin ?? 0;
  r[4] = o.afstandKm ?? 0;
  if (o.ifPct != null) r[7] = o.ifPct;
  r[8] = o.tss ?? 0;
  r[16] = o.idExt ?? "";
  return r;
}

describe("buildActivityList", () => {
  it("sorteert nieuwste-eerst bij oudste-eerst invoer", () => {
    const out = buildActivityList([
      row({ datum: "2026-07-18T09:00:00", naam: "A" }),
      row({ datum: "2026-07-20T09:00:00", naam: "B" }),
      row({ datum: "2026-07-19T09:00:00", naam: "C" }),
    ] as ActivitiesResponse);
    expect(out.map((r) => r.naam)).toEqual(["B", "C", "A"]);
  });

  it("gelijke datum → hoogste bron-index eerst", () => {
    const out = buildActivityList([
      row({ datum: "2026-07-20T10:00:00", naam: "eerst-in-bron" }),
      row({ datum: "2026-07-20T10:00:00", naam: "laatst-in-bron" }),
    ] as ActivitiesResponse);
    expect(out.map((r) => r.naam)).toEqual(["laatst-in-bron", "eerst-in-bron"]);
  });

  it("rij met ongeldige/ontbrekende datum valt weg", () => {
    const out = buildActivityList([
      row({ datum: "2026-07-20T10:00:00", naam: "geldig" }),
      row({ datum: 12345, naam: "geen-string" }),
      row({ datum: "kapot", naam: "geen-iso" }),
    ] as ActivitiesResponse);
    expect(out.map((r) => r.naam)).toEqual(["geldig"]);
  });

  it("lege idx16 → idExt ''; gezet → doorgegeven", () => {
    const out = buildActivityList([
      row({ idExt: "i123", naam: "met" }),
      row({ idExt: "", naam: "zonder" }),
    ] as ActivitiesResponse);
    const byNaam = (n: string) =>
      out.find((r) => r.naam === n) as ActivityListRow;
    expect(byNaam("met").idExt).toBe("i123");
    expect(byNaam("zonder").idExt).toBe("");
  });

  it("naam leeg → 'Rit'", () => {
    const out = buildActivityList([row({ naam: "" })] as ActivitiesResponse);
    expect(out[0]?.naam).toBe("Rit");
  });

  it("fiets → typeLabel null; niet-fiets → NL-label", () => {
    const out = buildActivityList([
      row({ type: "Ride", naam: "fiets", datum: "2026-07-22T10:00:00" }),
      row({ type: "Run", naam: "loop", datum: "2026-07-21T10:00:00" }),
      row({
        type: "WeightTraining",
        naam: "kracht",
        datum: "2026-07-20T10:00:00",
      }),
    ] as ActivitiesResponse);
    const byNaam = (n: string) =>
      out.find((r) => r.naam === n) as ActivityListRow;
    expect(byNaam("fiets").typeLabel).toBeNull();
    expect(byNaam("loop").typeLabel).toBe("Hardlopen");
    expect(byNaam("kracht").typeLabel).toBe("Kracht");
  });

  it("headline met afstand (komma-decimaal) en zonder afstand", () => {
    const out = buildActivityList([
      row({
        duurMin: 130,
        afstandKm: 62.4,
        naam: "met",
        datum: "2026-07-21T10:00:00",
      }),
      row({
        duurMin: 45,
        afstandKm: 0,
        naam: "zonder",
        datum: "2026-07-20T10:00:00",
      }),
    ] as ActivitiesResponse);
    const byNaam = (n: string) =>
      out.find((r) => r.naam === n) as ActivityListRow;
    expect(byNaam("met").headline).toBe("62,4 km | 2u10");
    expect(byNaam("zonder").headline).toBe("0u45");
  });

  it("badge uit IF: hoge IF geeft een andere zone dan IF null", () => {
    const out = buildActivityList([
      row({ ifPct: 96, naam: "hoog", datum: "2026-07-21T10:00:00" }),
      row({ naam: "geen-if", datum: "2026-07-20T10:00:00" }),
    ] as ActivitiesResponse);
    const byNaam = (n: string) =>
      out.find((r) => r.naam === n) as ActivityListRow;
    expect(byNaam("hoog").badgeZone).not.toBe(byNaam("geen-if").badgeZone);
  });

  it("tss: eindig → afgerond, anders null", () => {
    const out = buildActivityList([row({ tss: 57 })] as ActivitiesResponse);
    expect(out[0]?.tss).toBe(57);
  });

  it("maand: zelfde maand → gelijk; andere maand → verschillend (geen exacte Intl-assert)", () => {
    const out = buildActivityList([
      row({ datum: "2026-07-05T10:00:00", naam: "juli-a" }),
      row({ datum: "2026-07-25T10:00:00", naam: "juli-b" }),
      row({ datum: "2026-08-02T10:00:00", naam: "aug" }),
    ] as ActivitiesResponse);
    const byNaam = (n: string) =>
      out.find((r) => r.naam === n) as ActivityListRow;
    expect(byNaam("juli-a").maand).toBe(byNaam("juli-b").maand);
    expect(byNaam("juli-a").maand).not.toBe(byNaam("aug").maand);
  });
});
