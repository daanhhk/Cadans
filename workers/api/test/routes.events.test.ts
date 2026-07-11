import { env, SELF } from "cloudflare:test";
import type { EventInput } from "@cadans/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { events, users } from "../src/db/schema";

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

function putEvents(list: unknown): Promise<{ status: number; body: any }> {
  return call("/api/events", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: list }),
  });
}

const A: EventInput = {
  datum: "2027-04-18",
  naam: "Amstel Gold Race",
  type: "race",
  prioriteit: "A",
  afstandKm: 250,
  hoogtemeters: 3500,
  klimType: "lang",
  notitie: "hoofddoel",
};
const B: EventInput = {
  datum: "2026-09-01",
  naam: "Tune-up",
  type: "race",
  prioriteit: "B",
};

beforeEach(async () => {
  await db.delete(events).where(eq(events.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("PUT /api/events (brok 4a write-pad)", () => {
  it("(a) validatie-rejects → 400 + GEEN write (GET ongewijzigd)", async () => {
    await repo.writeEvents(db, U, [A]); // seed 1
    const bad = [
      { ...A, prioriteit: "Z" }, // bad prioriteit
      { ...A, type: "trail" }, // bad type
      { ...A, datum: "2027-13-40" }, // bad datum
      { ...A, naam: "  " }, // lege naam
      { ...A, naam: "x".repeat(61) }, // naam > 60
    ];
    for (const b of bad) {
      const r = await putEvents([b]);
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
    const g = await call("/api/events");
    expect(g.status).toBe(200);
    expect(g.body).toHaveLength(1);
    expect(g.body[0].naam).toBe("Amstel Gold Race");
  });

  it("(b) FULL-REPLACE: seed 2 → PUT lijst van 1 → GET geeft die 1", async () => {
    await repo.writeEvents(db, U, [A, B]);
    const r = await putEvents([B]);
    expect(r.status).toBe(200);
    const g = await call("/api/events");
    expect(g.body).toHaveLength(1);
    expect(g.body[0].naam).toBe("Tune-up");
    expect(g.body[0].prioriteit).toBe("B");
  });

  it("(c) lege lijst → wist alles", async () => {
    await repo.writeEvents(db, U, [A, B]);
    const r = await putEvents([]);
    expect(r.status).toBe(200);
    const g = await call("/api/events");
    expect(g.body).toEqual([]);
  });

  it("(d) round-trip: gevulde + null-optionals rij → GET veld-voor-veld gelijk", async () => {
    const r = await putEvents([A, B]);
    expect(r.status).toBe(200);
    const g = await call("/api/events");
    expect(g.body).toHaveLength(2);
    // readEvents = oudste-eerst: B (2026) vóór A (2027).
    expect(g.body[0]).toEqual({
      datum: "2026-09-01",
      naam: "Tune-up",
      type: "race",
      prioriteit: "B",
      afstandKm: null,
      hoogtemeters: null,
      klimType: null,
      notitie: null,
    });
    expect(g.body[1]).toEqual({
      datum: "2027-04-18",
      naam: "Amstel Gold Race",
      type: "race",
      prioriteit: "A",
      afstandKm: 250,
      hoogtemeters: 3500,
      klimType: "lang",
      notitie: "hoofddoel",
    });
  });
});
