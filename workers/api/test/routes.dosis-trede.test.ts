import { env, SELF } from "cloudflare:test";
import { DOSIS_TREDE_MAX } from "@cadans/engine";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { syncState, users } from "../src/db/schema";

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

beforeEach(async () => {
  await db.delete(syncState).where(eq(syncState.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("GET/PUT /api/dosis-trede", () => {
  it("verse staat → drie nullen", async () => {
    const r = await call("/api/dosis-trede");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ trede: null, blok: null, doel: null });
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: null,
      blok: null,
      doel: null,
    });
  });

  it("PUT zet de drie; GET leest ze terug", async () => {
    const w = await put("/api/dosis-trede", {
      trede: 1,
      blok: "2026-07-27",
      doel: "FTP",
    });
    expect(w.status).toBe(200);
    expect(w.body).toEqual({ ok: true });
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: 1,
      blok: "2026-07-27",
      doel: "FTP",
    });
    expect((await call("/api/dosis-trede")).body).toEqual({
      trede: 1,
      blok: "2026-07-27",
      doel: "FTP",
    });
  });

  it("een tweede PUT overschrijft", async () => {
    await put("/api/dosis-trede", {
      trede: 1,
      blok: "2026-07-27",
      doel: "FTP",
    });
    await put("/api/dosis-trede", {
      trede: 2,
      blok: "2026-08-24",
      doel: "Onderhoud",
    });
    expect((await call("/api/dosis-trede")).body).toEqual({
      trede: 2,
      blok: "2026-08-24",
      doel: "Onderhoud",
    });
  });

  it("trede 0 en drie nullen zijn geldige waarden", async () => {
    await put("/api/dosis-trede", {
      trede: 0,
      blok: "2026-07-27",
      doel: "FTP",
    });
    expect((await call("/api/dosis-trede")).body.trede).toBe(0);
    const r = await put("/api/dosis-trede", {
      trede: null,
      blok: null,
      doel: null,
    });
    expect(r.status).toBe(200);
    expect((await call("/api/dosis-trede")).body).toEqual({
      trede: null,
      blok: null,
      doel: null,
    });
  });

  it("het plafond komt uit de engine, niet uit een eigen getal", async () => {
    const ok = await put("/api/dosis-trede", {
      trede: DOSIS_TREDE_MAX,
      blok: null,
      doel: null,
    });
    expect(ok.status).toBe(200);
    const over = await put("/api/dosis-trede", {
      trede: DOSIS_TREDE_MAX + 1,
      blok: null,
      doel: null,
    });
    expect(over.status).toBe(400);
  });

  it("ongeldige trede → 400, en NIET geklemd", async () => {
    for (const bad of [-1, DOSIS_TREDE_MAX + 1, 1.5, "2", true]) {
      const r = await put("/api/dosis-trede", {
        trede: bad,
        blok: null,
        doel: null,
      });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
    // een 400 mag niets hebben weggeschreven
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: null,
      blok: null,
      doel: null,
    });
  });

  it("ongeldig blok → 400", async () => {
    for (const bad of ["27-07-2026", "2026-13-01", 42, ""]) {
      const r = await put("/api/dosis-trede", {
        trede: 1,
        blok: bad,
        doel: "FTP",
      });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
  });

  it("ongeldig doel → 400", async () => {
    for (const bad of ["", "   ", 7]) {
      const r = await put("/api/dosis-trede", {
        trede: 1,
        blok: "2026-07-27",
        doel: bad,
      });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
  });

  // DE DRAGENDE TEST. "Raakt alleen deze drie kolommen" is pas bewezen als er iets NAAST staat
  // dat aantoonbaar blijft staan — een upsert die de hele rij vervangt zou hier omvallen.
  it("de dosis-trede-write laat de andere sync_state-velden intact", async () => {
    await db
      .insert(syncState)
      .values({
        userId: U,
        lastSync: "2026-07-19T10:00:00Z",
        mesoWeek: 3,
        debtOptInWeek: "2026-07-13",
        fatigueShiftWeek: "2026-07-20",
        fatigueShiftDir: "down",
      })
      .onConflictDoUpdate({
        target: syncState.userId,
        set: {
          lastSync: "2026-07-19T10:00:00Z",
          mesoWeek: 3,
          debtOptInWeek: "2026-07-13",
          fatigueShiftWeek: "2026-07-20",
          fatigueShiftDir: "down",
        },
      });
    await put("/api/dosis-trede", {
      trede: 2,
      blok: "2026-07-27",
      doel: "FTP",
    });
    const rows = await db
      .select()
      .from(syncState)
      .where(eq(syncState.userId, U));
    expect(rows[0]?.dosisTrede).toBe(2);
    expect(rows[0]?.dosisTredeBlok).toBe("2026-07-27");
    expect(rows[0]?.dosisTredeDoel).toBe("FTP");
    // en dit is waar het om gaat: de buren staan er nog
    expect(rows[0]?.fatigueShiftWeek).toBe("2026-07-20");
    expect(rows[0]?.fatigueShiftDir).toBe("down");
    expect(rows[0]?.debtOptInWeek).toBe("2026-07-13");
    expect(rows[0]?.lastSync).toBe("2026-07-19T10:00:00Z");
    expect(rows[0]?.mesoWeek).toBe(3);
  });

  // ...en omgekeerd: een fatigue-write mag de trede niet wissen.
  it("een fatigue-shift-write laat de dosis-trede intact", async () => {
    await put("/api/dosis-trede", {
      trede: 3,
      blok: "2026-07-27",
      doel: "FTP",
    });
    await put("/api/fatigue-shift", { monday: "2026-07-27", dir: "up" });
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: 3,
      blok: "2026-07-27",
      doel: "FTP",
    });
  });
});
