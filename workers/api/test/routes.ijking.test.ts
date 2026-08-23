import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { syncState, users } from "../src/db/schema";

// ROADMAP punt 59 — de PERSISTENTIE van het ijkantwoord (M92, M91).
// Spec: docs/PUNT47-BOUW.md §26 t/m §29.
//
// WAAROM DIT BESTAAT. Tot 23-08-2026 leefde de afwijzing in een module-lokale `Set` in
// `apps/web/src/components/schema/TestVoorstelCard.tsx`. Die overleeft een remount na sync maar
// GEEN app-herstart, dus na een herstart stond dezelfde vraag er weer — terwijl M92 zegt dat er per
// doelblok-opening HOOGSTENS ÉÉN aanbod is. Deze tests toetsen de ronde-trip die dat vervangt.
//
// ELKE 400 WORDT AAN DE SCHRIJFKANT GETOETST, niet alleen op de statuscode. Een route die netjes
// 400 antwoordt en tóch wegschrijft komt anders groen door. Zelfde vorm als
// routes.doel-passend.test.ts.

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

async function call(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: any }> {
  const resp = await SELF.fetch(`https://cadans.test${path}`, init);
  let body: any = null;
  try {
    body = await resp.json();
  } catch {
    body = null;
  }
  return { status: resp.status, body };
}
const put = (path: string, body: unknown) =>
  call(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

// DRIE VELDEN SINDS 23-08-2026 (ROADMAP punt 64). Deze drie constanten pinden tot die dag een
// tweeledige sleutel; het DOEL is de derde helft geworden omdat een bevestiging geldt voor het doel
// waarvoor zij gegeven is. Elke test hieronder ging daarin mee.
const LEEG = { blok: null, doel: null, antwoord: null };
const BEVESTIGD = { blok: "2026-09-21", doel: "FTP", antwoord: "bevestigd" };
const NIET_NU = { blok: "2026-09-21", doel: "FTP", antwoord: "niet_nu" };

beforeEach(async () => {
  await db.delete(syncState).where(eq(syncState.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("GET/PUT /api/ijking", () => {
  it("GET op een lege rij geeft drie nullen", async () => {
    const r = await call("/api/ijking");
    expect(r.status).toBe(200);
    expect(r.body).toEqual(LEEG);
  });

  // DIT IS DE TEST DIE DE HELE RONDE DRAAGT: overleeft de keuze een HERSTART? De vluchtige
  // module-Set deed dat niet. Een nieuwe SELF.fetch is een nieuwe request tegen dezelfde D1, en dat
  // is precies wat een app-herstart met de server doet — de client-module is dan weg.
  it("een BEVESTIGING overleeft een nieuwe request", async () => {
    const w = await put("/api/ijking", BEVESTIGD);
    expect(w.status).toBe(200);
    const r = await call("/api/ijking");
    expect(r.body).toEqual(BEVESTIGD);
  });

  it("een NIET-NU overleeft een nieuwe request", async () => {
    expect((await put("/api/ijking", NIET_NU)).status).toBe(200);
    expect((await call("/api/ijking")).body).toEqual(NIET_NU);
  });

  it("een tweede antwoord op DEZELFDE opening overschrijft het eerste", async () => {
    await put("/api/ijking", NIET_NU);
    await put("/api/ijking", BEVESTIGD);
    expect((await call("/api/ijking")).body).toEqual(BEVESTIGD);
  });

  it("een ANDER DOEL op dezelfde opening is een ANDER antwoord (punt 64)", async () => {
    // De ronde-trip die het gat van punt 64 dicht: dezelfde openingsmaandag, ander doel, en de
    // opgeslagen rij draagt dat doel mee. Zonder deze kolom was dit dezelfde rij.
    await put("/api/ijking", BEVESTIGD);
    const ander = {
      blok: "2026-09-21",
      doel: "Korte beklimmingen",
      antwoord: "niet_nu",
    };
    expect((await put("/api/ijking", ander)).status).toBe(200);
    expect((await call("/api/ijking")).body).toEqual(ander);
  });

  it("PUT met alle drie null WIST", async () => {
    await put("/api/ijking", BEVESTIGD);
    const w = await put("/api/ijking", LEEG);
    expect(w.status).toBe(200);
    expect((await call("/api/ijking")).body).toEqual(LEEG);
  });

  it("400 op een blok dat geen yyyy-MM-dd is, en er is NIETS weggeschreven", async () => {
    const w = await put("/api/ijking", {
      blok: "21-09-2026",
      doel: "FTP",
      antwoord: "bevestigd",
    });
    expect(w.status).toBe(400);
    expect(await repo.readIjking(db, U)).toEqual(LEEG);
  });

  it("400 op een doel buiten DOEL_OPTIONS, en er is NIETS weggeschreven", async () => {
    // STRIKT, net als PUT /api/doel-passend: hier hoort het GENORMALISEERDE doel te landen, want
    // poort (2b) vergelijkt genormaliseerd met genormaliseerd. Een legacy-string hoort al door
    // `normalizeDoel_` te zijn gegaan vóór hij hier aankomt — "VO2max" is dus terecht een 400.
    for (const doel of ["VO2max", "ftp", "", "Beklimmingen", 3, undefined]) {
      const w = await put("/api/ijking", {
        blok: "2026-09-21",
        doel,
        antwoord: "bevestigd",
      });
      expect(w.status).toBe(400);
      expect(await repo.readIjking(db, U)).toEqual(LEEG);
    }
  });

  it("400 op een antwoord buiten de twee waarden, en er is NIETS weggeschreven", async () => {
    for (const antwoord of ["ja", "afgewezen", "", "BEVESTIGD"]) {
      const w = await put("/api/ijking", {
        blok: "2026-09-21",
        doel: "FTP",
        antwoord,
      });
      expect(w.status).toBe(400);
      expect(await repo.readIjking(db, U)).toEqual(LEEG);
    }
  });

  it("400 op een HALVE rij, en er is NIETS weggeschreven", async () => {
    // ALLE DRIE OF GEEN. De gevaarlijkste vorm is {blok, doel, antwoord: null}: poort (2b) leest
    // `ijkingAntwoord` niet, dus die rij onderdrukt het aanbod twaalf weken terwijl `ijkStatus`
    // zowel `bevestigd` als `ongeijkt` op false zet en de staat-regel niets zegt — onderdrukking
    // zonder uitleg, wat M91 verbiedt. Gevonden in de weerleggingspas van 23-08-2026; tot die dag
    // gaf de route hier 200.
    const halve = [
      { blok: "2026-09-21", doel: "FTP", antwoord: null },
      { blok: "2026-09-21", doel: null, antwoord: "bevestigd" },
      { blok: null, doel: "FTP", antwoord: "bevestigd" },
      { blok: "2026-09-21", doel: null, antwoord: null },
      { blok: null, doel: null, antwoord: "bevestigd" },
      { blok: null, doel: "FTP", antwoord: null },
    ];
    for (const body of halve) {
      const w = await put("/api/ijking", body);
      expect(w.status).toBe(400);
      expect(await repo.readIjking(db, U)).toEqual(LEEG);
    }
    // En de twee VOLLEDIGE vormen blijven gewoon door.
    expect((await put("/api/ijking", BEVESTIGD)).status).toBe(200);
    expect((await put("/api/ijking", LEEG)).status).toBe(200);
  });

  it("400 op een antwoord dat geen string is, en er is NIETS weggeschreven", async () => {
    const w = await put("/api/ijking", {
      blok: "2026-09-21",
      doel: "FTP",
      antwoord: 3,
    });
    expect(w.status).toBe(400);
    expect(await repo.readIjking(db, U)).toEqual(LEEG);
  });

  // DE UPSERT MAG GEEN BUURMAN LEGEN. `sync_state` is een GEDEELDE rij en `writeSettings` is
  // FULL-REPLACE; die vorm zit dicht genoeg bij deze om per ongeluk gekopieerd te worden.
  it("de PUT raakt geen ander veld van sync_state", async () => {
    await repo.writeDosisTrede(db, U, 2, "2026-09-21", "FTP");
    await repo.writePowerZones(db, U, [55, 75, 90, 105, 120, 150, 999]);
    await repo.writeDoelPassend(db, U, "2026-09-21", "FTP");

    const w = await put("/api/ijking", BEVESTIGD);
    expect(w.status).toBe(200);

    const trede = await repo.readDosisTrede(db, U);
    expect(trede.trede).toBe(2);
    expect(await repo.readPowerZones(db, U)).toEqual([
      55, 75, 90, 105, 120, 150, 999,
    ]);
    expect(await repo.readDoelPassend(db, U)).toEqual({
      blok: "2026-09-21",
      doel: "FTP",
    });
    expect(await repo.readIjking(db, U)).toEqual(BEVESTIGD);
  });

  // TEGENKANT: schrijft een BUURMAN deze twee kolommen leeg? Zonder deze assertie zou een
  // full-replace elders het ijkantwoord kunnen wissen zonder dat iets rood wordt.
  it("een schrijfactie op een BUURMAN laat het ijkantwoord staan", async () => {
    await put("/api/ijking", BEVESTIGD);
    await repo.writeDoelPassend(db, U, "2026-12-14", "Conditie");
    await repo.writeDosisTrede(db, U, 1, "2026-12-14", "Conditie");
    expect(await repo.readIjking(db, U)).toEqual(BEVESTIGD);
  });
});
