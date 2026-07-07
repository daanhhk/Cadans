import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { settings, users } from "../src/db/schema";

// Ensure-user middleware (debt m): geen enkele route insert `users`, dus een verse
// D1 heeft geen user-rij om tegen te FK-en. De non-GET-middleware in index.ts moet
// die rij idempotent bootstrappen vóór de eerste muterende write.

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

function put(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`https://cadans.test${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Simuleer een verse D1: children eerst weg (FK), dan de user — zodat de muterende
// call écht zónder user-rij start.
beforeEach(async () => {
  await db.delete(settings).where(eq(settings.userId, U));
  await db.delete(users).where(eq(users.id, U));
});

describe("ensure-user middleware (debt m)", () => {
  it("muterende PUT tegen lege D1 → users(id=1) + settings-rij bestaan", async () => {
    const before = await db.select().from(users).where(eq(users.id, U));
    expect(before.length).toBe(0);

    const resp = await put("/api/settings", { ftp: 250 });
    expect(resp.status).toBe(200);

    const after = await db.select().from(users).where(eq(users.id, U));
    expect(after.length).toBe(1);
    expect(after[0]?.id).toBe(U);

    const s = await repo.readSettings(db, U);
    expect(s?.ftp).toBe(250);
  });

  it("tweede muterende PUT → user blijft uniek (onConflictDoNothing = no-op)", async () => {
    await put("/api/settings", { ftp: 250 });
    await put("/api/settings", { ftp: 260 });

    const rows = await db.select().from(users).where(eq(users.id, U));
    expect(rows.length).toBe(1);

    const s = await repo.readSettings(db, U);
    expect(s?.ftp).toBe(260);
  });
});
