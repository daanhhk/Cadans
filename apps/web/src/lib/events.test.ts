import type { EventItem } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import { eventsSummary } from "./events";

const ev = (o: Partial<EventItem>): EventItem => ({
  datum: "2026-01-01",
  naam: null,
  type: null,
  prioriteit: null,
  afstandKm: null,
  hoogtemeters: null,
  klimType: null,
  notitie: null,
  ...o,
});

describe("eventsSummary", () => {
  it("lege lijst → 'Nog geen events'", () => {
    expect(eventsSummary([])).toBe("Nog geen events");
  });
  it("1 event zonder A → '1 event'", () => {
    expect(eventsSummary([ev({ prioriteit: "B" })])).toBe("1 event");
  });
  it("3 events zonder A → '3 events'", () => {
    expect(
      eventsSummary([
        ev({ prioriteit: "B" }),
        ev({ prioriteit: "C" }),
        ev({ prioriteit: "B" }),
      ]),
    ).toBe("3 events");
  });
  it("meerdere events, 2 A-events → vroegste-datum A-doel", () => {
    const s = eventsSummary([
      ev({ prioriteit: "B", datum: "2026-05-01", naam: "Tune-up" }),
      ev({ prioriteit: "A", datum: "2027-04-18", naam: "Amstel Gold Race" }),
      ev({ prioriteit: "A", datum: "2026-09-06", naam: "Vroeger A" }),
    ]);
    expect(s).toBe("3 events · A-doel: Vroeger A (2026-09-06)");
  });
  it("A-event zonder naam → '(naamloos)'", () => {
    expect(eventsSummary([ev({ prioriteit: "A", datum: "2026-09-06" })])).toBe(
      "1 event · A-doel: (naamloos) (2026-09-06)",
    );
  });
});
