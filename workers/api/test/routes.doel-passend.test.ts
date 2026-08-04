import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { syncState, users } from "../src/db/schema";

// ROADMAP punt 12 fase A — de persistentie van het doel-passendheid-antwoord.
// Spec: docs/PUNT12-BOUWDOC.md §5.
//
// ELKE 400 WORDT AAN DE SCHRIJFKANT GETOETST, niet alleen op de statuscode. Een route die netjes
// 400 antwoordt en tóch wegschrijft komt anders groen door — dat is precies het gat dat een
// status-only assertie openlaat. Zelfde vorm als routes.event-overname.test.ts.

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

const LEEG = { blok: null, doel: null };
const NEE = { blok: "2026-03-09", doel: "Korte beklimmingen" };

beforeEach(async () => {
  await db.delete(syncState).where(eq(syncState.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("GET/PUT /api/doel-passend", () => {
  it("GET op een lege rij geeft twee nullen", async () => {
    const r = await call("/api/doel-passend");
    expect(r.status).toBe(200);
    expect(r.body).toEqual(LEEG);
  });

  it("PUT gevolgd door GET geeft de weggeschreven waarden terug", async () => {
    const w = await put("/api/doel-passend", NEE);
    expect(w.status).toBe(200);
    const r = await call("/api/doel-passend");
    expect(r.body).toEqual(NEE);
  });

  it("PUT met beide null WIST", async () => {
    await put("/api/doel-passend", NEE);
    const w = await put("/api/doel-passend", LEEG);
    expect(w.status).toBe(200);
    expect((await call("/api/doel-passend")).body).toEqual(LEEG);
  });

  it("400 op een blok dat geen yyyy-MM-dd is, en er is NIETS weggeschreven", async () => {
    const w = await put("/api/doel-passend", {
      blok: "09-03-2026",
      doel: "Korte beklimmingen",
    });
    expect(w.status).toBe(400);
    expect(await repo.readDoelPassend(db, U)).toEqual(LEEG);
  });

  it("400 op een doel dat niet in DOEL_OPTIONS staat, en er is NIETS weggeschreven", async () => {
    const w = await put("/api/doel-passend", {
      blok: "2026-03-09",
      doel: "Bergop sprinten",
    });
    expect(w.status).toBe(400);
    expect(await repo.readDoelPassend(db, U)).toEqual(LEEG);
  });

  it("400 op een doel dat geen string is, en er is NIETS weggeschreven", async () => {
    const w = await put("/api/doel-passend", { blok: "2026-03-09", doel: 3 });
    expect(w.status).toBe(400);
    expect(await repo.readDoelPassend(db, U)).toEqual(LEEG);
  });

  // DE UPSERT MAG GEEN BUURMAN LEGEN. `writeSettings` is FULL-REPLACE, en die vorm zit dicht
  // genoeg bij deze om per ongeluk gekopieerd te worden; deze assertie houdt dat tegen.
  it("de PUT raakt geen ander veld van sync_state", async () => {
    await repo.writeDosisTrede(db, U, 2, "2026-03-09", "Korte beklimmingen");
    await repo.writePowerZones(db, U, [55, 75, 90, 105, 120, 150, 999]);

    const w = await put("/api/doel-passend", NEE);
    expect(w.status).toBe(200);

    const trede = await repo.readDosisTrede(db, U);
    expect(trede.trede).toBe(2);
    expect(await repo.readPowerZones(db, U)).toEqual([
      55, 75, 90, 105, 120, 150, 999,
    ]);
    expect(await repo.readDoelPassend(db, U)).toEqual(NEE);
  });
});
