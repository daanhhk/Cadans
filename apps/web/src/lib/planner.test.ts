import type { PlannerDay } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import {
  buildWeekForm,
  type DayForm,
  formToInputs,
  isoAddDays,
  weekDatesFromMonday,
  weekdayLabel,
} from "./planner";

const MON = "2026-07-06";

describe("week-datum-helpers", () => {
  it("weekDatesFromMonday → 7 datums ma-zo", () => {
    expect(weekDatesFromMonday(MON)).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });
  it("isoAddDays over een maandgrens", () => {
    expect(isoAddDays("2026-07-30", 3)).toBe("2026-08-02");
  });
  it("weekdayLabel maandag/zondag", () => {
    expect(weekdayLabel("2026-07-06")).toBe("ma");
    expect(weekdayLabel("2026-07-12")).toBe("zo");
  });
});

describe("buildWeekForm (pre-fill)", () => {
  const pd = (datum: string, o: Partial<PlannerDay> = {}): PlannerDay => ({
    datum,
    train: false,
    dag: null,
    minuten: null,
    dagtype: null,
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
    ...o,
  });

  it("lege GET → 7 dagen, alle uit", () => {
    const f = buildWeekForm(MON, []);
    expect(f.length).toBe(7);
    expect(f.every((d) => d.train === false)).toBe(true);
    expect(f.every((d) => d.minuten === "")).toBe(true);
  });

  it("merge op datum: bestaande train-dag vult in, rest uit", () => {
    const f = buildWeekForm(MON, [
      pd("2026-07-07", {
        train: true,
        minuten: 150,
        dagtype: "pendel",
        toelichting: "heen/terug",
      }),
    ]);
    const di = f.find((d) => d.datum === "2026-07-07");
    expect(di?.train).toBe(true);
    expect(di?.minuten).toBe("150");
    expect(di?.dagtype).toBe("pendel");
    expect(di?.toelichting).toBe("heen/terug");
    expect(f.find((d) => d.datum === MON)?.train).toBe(false);
  });
});

describe("formToInputs (serialisatie)", () => {
  const day = (o: Partial<DayForm>): DayForm => ({
    datum: "2026-07-07",
    train: false,
    minuten: "",
    dagtype: "",
    toelichting: "",
    ...o,
  });

  it("niet-train-dag → alle velden null", () => {
    const [d] = formToInputs([day({ datum: MON, train: false })]);
    expect(d).toEqual({
      datum: MON,
      train: false,
      minuten: null,
      dagtype: null,
      toelichting: null,
    });
  });

  it("train-dag → getypeerde invoer (minuten als number)", () => {
    const [d] = formToInputs([
      day({ train: true, minuten: "150", dagtype: "pendel", toelichting: "x" }),
    ]);
    expect(d.train).toBe(true);
    expect(d.minuten).toBe(150);
    expect(typeof d.minuten).toBe("number");
    expect(d.dagtype).toBe("pendel");
    expect(d.toelichting).toBe("x");
  });

  it("train-dag zonder minuten → null (geen NaN)", () => {
    const [d] = formToInputs([day({ train: true, minuten: "  " })]);
    expect(d.minuten).toBeNull();
  });
});
