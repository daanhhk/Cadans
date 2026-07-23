import { describe, expect, it } from "vitest";
import { coachNarrative, faseOvergangRegel } from "./coachNarrative";

// De 3 warm-varianten van key_session (uit de pool) — voor de fallback-assert.
const KEY_WARM = [
  "Dit is je sleutelsessie deze week — de training die je echt vooruit helpt. Ga er met focus in.",
  "Vandaag de belangrijkste prikkel van je blok. Geef 'm de aandacht die-ie verdient, hier zit je progressie.",
  "Je sleutelsessie staat op het menu. Dit is waar je fitheid groeit — maak 'm af.",
];

describe("coachNarrative", () => {
  it("seed-determinisme: zelfde datum+code+persona → zelfde zin", () => {
    const a = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "warm",
    );
    const b = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "warm",
    );
    expect(a).toBe(b);
    expect(KEY_WARM).toContain(a);
  });

  it("seed varieert over datums (niet één vaste zin)", () => {
    const picks = new Set(
      [
        "2026-03-09",
        "2026-03-10",
        "2026-03-11",
        "2026-03-12",
        "2026-03-13",
      ].map((dt) => coachNarrative("demote_recent_hard", "x", dt, "warm")),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("fallback: ontbrekende persona (disciplined) → warm-tekst", () => {
    const r = coachNarrative(
      "key_session",
      "Sleutelsessie · FTP",
      "2026-03-11",
      "disciplined",
    );
    expect(KEY_WARM).toContain(r); // warm-pool gebruikt (disciplined leeg)
  });

  it("null code → droge reden terug; null reden → null", () => {
    expect(coachNarrative(null, "Rustige dag", "2026-03-11", "warm")).toBe(
      "Rustige dag",
    );
    expect(coachNarrative(null, null, "2026-03-11", "warm")).toBeNull();
  });

  it("onbekende code → droge reden terug (vangnet)", () => {
    expect(
      coachNarrative("does_not_exist", "Kale reden", "2026-03-11", "warm"),
    ).toBe("Kale reden");
  });

  it("default persona = warm", () => {
    const withDefault = coachNarrative("commute", "Pendelrit", "2026-03-11");
    const explicit = coachNarrative(
      "commute",
      "Pendelrit",
      "2026-03-11",
      "warm",
    );
    expect(withDefault).toBe(explicit);
    expect(withDefault).not.toBe("Pendelrit"); // warme zin, niet de droge reden
  });
});

describe("faseOvergangRegel", () => {
  it("naar taper: noemt taper + fris aan de start; M55-veilig", () => {
    const r = faseOvergangRegel({
      naar: "Taper",
      eventNaam: "Marmotte",
      wekenTotEvent: 1,
    });
    expect(r).toContain("taper");
    expect(r).toContain("fris aan de start");
    expect(r).toContain("Marmotte");
    expect(r).toContain("1 week"); // enkelvoud
    expect(r.startsWith("Vanaf deze week")).toBe(true);
    expect(r).not.toMatch(/Ik heb/i);
  });

  it("zonder event: de regel loopt en laat het event-deel weg", () => {
    const r = faseOvergangRegel({
      naar: "Build",
      eventNaam: null,
      wekenTotEvent: null,
    });
    expect(r).toContain("opbouw");
    expect(r).not.toContain("richting");
    expect(r.startsWith("Vanaf deze week")).toBe(true);
  });

  it("naar herstel: noemt het event bij naam, ZONDER countdown ('nog 0 weken')", () => {
    const r = faseOvergangRegel({
      naar: "Recovery",
      eventNaam: "Doelrace",
      wekenTotEvent: 0,
    });
    expect(r).toContain("Doelrace zit erop");
    expect(r).toContain("herstel");
    expect(r).not.toContain("weken");
    expect(r).not.toContain("(nog");
    expect(r).not.toMatch(/Ik heb/i);
  });
});
