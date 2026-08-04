import { describe, expect, it } from "vitest";
import {
  LAAD_PAUZES_MS,
  LAAD_POGINGEN,
  laadGelabeld,
  retryLoad,
} from "./schemaLoad";

// ROADMAP punt 30 — de weeklaadbeurt valt niet meer om op één rij.
// Spec: docs/PUNT30-BOUWDOC.md.
//
// De sleep wordt GEINJECTEERD, niet gefaket met timers: zo meet de test het GEDRAG (hoe vaak
// wordt er geprobeerd, met welke pauzes) zonder aan de klok te hangen.

/** Telt de aanroepen en registreert de gevraagde pauzes. */
function spionSleep() {
  const pauzes: number[] = [];
  return {
    pauzes,
    sleep: async (ms: number) => {
      pauzes.push(ms);
    },
  };
}

describe("retryLoad — begrensde herhaling van de HELE bouw", () => {
  it("T1 twee keer falen, dan slagen: de uitkomst komt door en run is 3x aangeroepen", async () => {
    let n = 0;
    const s = spionSleep();
    const uit = await retryLoad(
      async () => {
        n++;
        if (n < 3) throw new Error(`poging ${n} faalt`);
        return "geladen";
      },
      { attempts: LAAD_POGINGEN, delaysMs: LAAD_PAUZES_MS, sleep: s.sleep },
    );
    expect(uit).toBe("geladen");
    expect(n).toBe(3);
    expect(s.pauzes).toEqual([600, 1800]);
  });

  it("T2 direct succes: run is EXACT 1x aangeroepen", async () => {
    // Dit bewaakt een herhaling die stil DUBBEL laadt. Vijftien verzoeken twee keer doen is niet
    // zichtbaar op het scherm, alleen op de verbinding.
    let n = 0;
    const s = spionSleep();
    const uit = await retryLoad(
      async () => {
        n++;
        return "meteen goed";
      },
      { sleep: s.sleep },
    );
    expect(uit).toBe("meteen goed");
    expect(n).toBe(1);
    expect(s.pauzes).toEqual([]);
  });

  it("T3 alles faalt: de LAATSTE fout komt door, niet een eigen generieke", async () => {
    let n = 0;
    const s = spionSleep();
    await expect(
      retryLoad(
        async () => {
          n++;
          throw new Error(`fout nummer ${n}`);
        },
        { attempts: 3, delaysMs: [1, 2], sleep: s.sleep },
      ),
    ).rejects.toThrow("fout nummer 3");
    expect(n).toBe(3);
  });

  it("attempts 1 betekent geen herhaling", async () => {
    let n = 0;
    await expect(
      retryLoad(
        async () => {
          n++;
          throw new Error("eenmalig");
        },
        { attempts: 1, sleep: async () => {} },
      ),
    ).rejects.toThrow("eenmalig");
    expect(n).toBe(1);
  });
});

describe("laadGelabeld — de gevallen rij bij NAAM", () => {
  const ok = (v: unknown) => ({ label: "ok", laad: async () => v });

  it("alles goed: de waarden komen in dezelfde VOLGORDE terug", async () => {
    const uit = await laadGelabeld([
      { label: "instellingen", laad: async () => 1 },
      { label: "weekplanner", laad: async () => 2 },
      { label: "events", laad: async () => 3 },
    ]);
    expect(uit).toEqual([1, 2, 3]);
  });

  it("T4 een gevallen rij: de melding noemt de NAAM van die rij", async () => {
    await expect(
      laadGelabeld([
        ok(1),
        {
          label: "power-zones",
          laad: async () => {
            throw new Error("http 500");
          },
        },
        ok(3),
      ]),
    ).rejects.toThrow(/power-zones/);
  });

  it("T4 op een TWEEDE rij, zodat de assertie niet op één toevallige naam hangt", async () => {
    await expect(
      laadGelabeld([
        ok(1),
        {
          label: "doel-passendheid",
          laad: async () => {
            throw new Error("http 404: not found");
          },
        },
      ]),
    ).rejects.toThrow(/doel-passendheid/);
  });

  it("de REDEN staat er ook bij, niet alleen de naam", async () => {
    await expect(
      laadGelabeld([
        {
          label: "events",
          laad: async () => {
            throw new Error("http 502");
          },
        },
      ]),
    ).rejects.toThrow(/http 502/);
  });

  it("TWEE gevallen rijen worden ALLEBEI genoemd", async () => {
    // `allSettled` en niet `all`: anders blijft de tweede uitvaller onzichtbaar achter de eerste.
    const p = laadGelabeld([
      {
        label: "wellness",
        laad: async () => {
          throw new Error("a");
        },
      },
      ok(2),
      {
        label: "rpe",
        laad: async () => {
          throw new Error("b");
        },
      },
    ]);
    await expect(p).rejects.toThrow(/wellness/);
    await expect(
      laadGelabeld([
        {
          label: "wellness",
          laad: async () => {
            throw new Error("a");
          },
        },
        {
          label: "rpe",
          laad: async () => {
            throw new Error("b");
          },
        },
      ]),
    ).rejects.toThrow(/rpe/);
  });

  it("er wordt NIETS gedegradeerd: bij een uitvaller komt er geen deel-resultaat terug", async () => {
    let uitkomst: unknown = "niet gezet";
    try {
      uitkomst = await laadGelabeld([
        ok(1),
        {
          label: "overrides",
          laad: async () => {
            throw new Error("stuk");
          },
        },
      ]);
    } catch {
      // verwacht
    }
    expect(uitkomst).toBe("niet gezet");
  });
});
