import { describe, expect, it } from "vitest";
import { fatigueAanbodRegel } from "./fatigueStem";
import type { FatigueVoorstel } from "./schema";

// ROADMAP punt 10 fase A — ÉÉN UITSPRAAK PER BLOK. Spec: docs/PUNT10-FASE-A-BOUWDOC.md §6.4.
//
// De asserties toetsen niet de COPY maar de KEUZE: valt de blok-uitspraak weg zodra de terugblik
// op hetzelfde scherm staat, en blijft het aanbod eronder woordelijk hetzelfde? Die tweede helft
// is de belangrijkste — zonder haar zou "de zin is korter" ook slagen als het aanbod meeveranderde.

const BLOK = { fromCtl: 47.4, toCtl: 44.3, delta: -3.1 };

function voorstel(dir: "up" | "down"): FatigueVoorstel {
  return {
    state: "offer",
    dir,
    tsbTrend: -22,
    blok: BLOK,
    preview: null,
  } as unknown as FatigueVoorstel;
}

/** Het AANBOD zelf, per richting: de zin die na de ΔCTL-clausule komt. Als anker, want de
 * clausule staat niet in beide richtingen op dezelfde plek — bij UP gaat hij VOORAF, bij DOWN
 * staat hij MIDDEN in de zin ("Je vorm zit diep (TSB x) <clausule>. Ik kan ..."). Een simpele
 * endsWith zou dus alleen voor UP kloppen en voor DOWN een onware gelijkheid beweren. */
const ANKER = {
  up: "De kalender plant deze week een deload",
  down: "Ik kan een vervroegde deload inplannen",
} as const;
const aanbodDeel = (regel: string, dir: "up" | "down") =>
  regel.slice(regel.indexOf(ANKER[dir]));

describe("fatigueAanbodRegel — de blok-uitspraak valt weg naast de terugblik", () => {
  it("(a) UP mét terugblik: geen CTL-zin en geen belasting-oordeel", () => {
    const r = fatigueAanbodRegel(voorstel("up"), 30, true);
    expect(r).not.toContain("CTL");
    expect(r).not.toContain("belast");
  });

  it("(b) UP zónder terugblik: de CTL-zin staat er wél", () => {
    const r = fatigueAanbodRegel(voorstel("up"), 30, false);
    expect(r).toContain("Je CTL ging");
  });

  it("(c) DOWN: hetzelfde paar", () => {
    const met = fatigueAanbodRegel(voorstel("down"), 30, true);
    expect(met).not.toContain("CTL");
    expect(met).not.toContain("belast");
    const zonder = fatigueAanbodRegel(voorstel("down"), 30, false);
    expect(zonder).toContain("CTL");
  });

  it("(d) het AANBOD zelf is in beide gevallen identiek", () => {
    // Alleen de blok-uitspraak valt weg; wat de kaart AANBIEDT verandert niet. Zonder deze
    // assertie zou "de zin is korter geworden" ook slagen als het aanbod meeveranderde.
    for (const dir of ["up", "down"] as const) {
      const metTerugblik = fatigueAanbodRegel(voorstel(dir), 30, true);
      const zonderTerugblik = fatigueAanbodRegel(voorstel(dir), 30, false);
      expect(metTerugblik).toContain(ANKER[dir]);
      expect(zonderTerugblik).toContain(ANKER[dir]);
      expect(aanbodDeel(metTerugblik, dir)).toBe(
        aanbodDeel(zonderTerugblik, dir),
      );
      // En de twee regels zijn wél VERSCHILLEND — anders toetst (d) niets.
      expect(metTerugblik).not.toBe(zonderTerugblik);
    }
  });
});
