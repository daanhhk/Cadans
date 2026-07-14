import { describe, expect, it } from "vitest";
import { formatSyncTime, isSyncFresh, STALE_MS } from "./syncStatus";

describe("isSyncFresh (staleness-predicaat)", () => {
  const now = 1_000_000_000;
  it("null (nooit gesynct) → niet vers", () => {
    expect(isSyncFresh(null, now)).toBe(false);
  });
  it("net gesynct → vers", () => {
    expect(isSyncFresh(now - 1000, now)).toBe(true);
  });
  it("binnen het venster → vers", () => {
    expect(isSyncFresh(now - (STALE_MS - 1), now)).toBe(true);
  });
  it("precies op de grens → niet meer vers (strikt <)", () => {
    expect(isSyncFresh(now - STALE_MS, now)).toBe(false);
  });
  it("ouder dan het venster → niet vers", () => {
    expect(isSyncFresh(now - (STALE_MS + 5000), now)).toBe(false);
  });
});

describe("formatSyncTime (HH:mm, lokale tijd)", () => {
  it("formatteert lokale uren/minuten met nul-padding", () => {
    // Lokale Date-delen (TZ=Europe/Amsterdam in de testrun) → "09:05", geen UTC-round-trip.
    const ms = new Date(2026, 6, 14, 9, 5).getTime();
    expect(formatSyncTime(ms)).toBe("09:05");
  });
  it("middag/dubbele cijfers", () => {
    const ms = new Date(2026, 6, 14, 17, 42).getTime();
    expect(formatSyncTime(ms)).toBe("17:42");
  });
  it("middernacht → 00:00", () => {
    const ms = new Date(2026, 0, 1, 0, 0).getTime();
    expect(formatSyncTime(ms)).toBe("00:00");
  });
});
