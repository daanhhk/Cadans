import type { ActivitiesResponse } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { parseActivityRows } from "./activities";

// Legt het ECHTE contract van parseActivityRows vast: idx0 ISO-datetime-string →
// lokale Date; Invalid Date eruit (die IS een Date-instance en zou anders de
// engine-`instanceof Date`-skip passeren en de maand-bucketing breken); overige 16
// kolommen positioneel ongewijzigd. Assertions op de LOKALE kalendervelden
// (getFullYear/Month/Date) zijn TZ-robuust: de string wordt als wall-clock geparsed.
describe("parseActivityRows", () => {
  it("valide rij: idx0 → geldige Date, 16 overige kolommen positioneel identiek", () => {
    const row = [
      "2026-06-10T07:00:00",
      "Ride",
      "Ochtend",
      60,
      30,
      200,
      210,
      77,
      80,
      140,
      175,
      1.8,
      270,
      72,
      268,
      "",
      "act_1",
    ];
    const out = parseActivityRows([row] as ActivitiesResponse);

    expect(out).toHaveLength(1);
    const parsed = out[0];
    expect(parsed).toBeDefined();
    if (!parsed) return;
    expect(parsed).toHaveLength(17);

    const d = parsed[0];
    expect(d).toBeInstanceOf(Date);
    const date = d as Date;
    expect(Number.isNaN(date.getTime())).toBe(false);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // juni (0-indexed)
    expect(date.getDate()).toBe(10);

    // idx1..16 exact, op index, ongewijzigd
    expect(parsed.slice(1)).toEqual(row.slice(1));
  });

  it("onparsebare idx0 → rij gefilterd (Invalid Date glipt er niet doorheen)", () => {
    expect(
      parseActivityRows([["geen-datum", "Ride", 5]] as ActivitiesResponse),
    ).toEqual([]);
    // idx0 geen string → ook weg
    expect(
      parseActivityRows([[42, "x"]] as unknown as ActivitiesResponse),
    ).toEqual([]);
  });

  it("lege input → lege output", () => {
    expect(parseActivityRows([])).toEqual([]);
  });

  it("mix valide + invalide: alleen valide behouden, volgorde intact", () => {
    const input = [
      ["2026-06-09T10:00:00", "Ride", "A"],
      ["kapot", "Ride", "X"],
      ["2026-06-11T08:00:00", "Ride", "B"],
    ] as ActivitiesResponse;
    const out = parseActivityRows(input);

    expect(out).toHaveLength(2);
    expect((out[0]?.[0] as Date).getDate()).toBe(9);
    expect(out[0]?.[2]).toBe("A");
    expect((out[1]?.[0] as Date).getDate()).toBe(11);
    expect(out[1]?.[2]).toBe("B");
  });
});
