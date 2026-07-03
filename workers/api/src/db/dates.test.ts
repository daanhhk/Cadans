import { describe, expect, it } from "vitest";
import { fromD1, toD1Date, toD1DateTime } from "./dates";

// Draait in de NODE-pool onder de TZ=Europe/Amsterdam-pin (root cross-env).
describe("D1 date conversion (Europe/Amsterdam pin)", () => {
  it("kale datum round-trip (incl. DST-grensdagen)", () => {
    const cases = [
      "2026-01-08",
      "2026-06-08",
      "2026-03-29", // spring-forward (02:00→03:00)
      "2026-10-25", // fall-back (03:00→02:00)
      "2025-12-31",
    ];
    for (const s of cases) {
      const d = fromD1(s);
      expect(d.getFullYear()).toBe(Number(s.slice(0, 4)));
      expect(d.getMonth()).toBe(Number(s.slice(5, 7)) - 1);
      expect(d.getDate()).toBe(Number(s.slice(8, 10)));
      expect(d.getHours()).toBe(0); // lokale middernacht (jump zit op 02:00)
      expect(toD1Date(d)).toBe(s);
    }
  });

  it("datetime (start_date_local, zonder Z) round-trip", () => {
    const cases = [
      "2026-06-10T07:30:00",
      "2026-03-29T09:15:00", // na de spring-forward
      "2026-10-25T18:45:00", // na de fall-back
    ];
    for (const s of cases) {
      expect(toD1DateTime(fromD1(s))).toBe(s);
    }
  });

  it("DST-grens: Amsterdam-offset flipt (bewijst dat de TZ-pin actief is)", () => {
    // Jan = CET (UTC+1 → offset -60); Jul = CEST (UTC+2 → offset -120).
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
    expect(new Date(2026, 6, 15).getTimezoneOffset()).toBe(-120);
    // Kalenderdag blijft stabiel over beide DST-grenzen.
    expect(toD1Date(fromD1("2026-03-29"))).toBe("2026-03-29");
    expect(toD1Date(fromD1("2026-10-25"))).toBe("2026-10-25");
  });
});
