import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { rpe, users } from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID; // 1
const U2 = 2;
const BASE = "https://cadans.test";

async function get(path: string): Promise<{ status: number; body: any }> {
  const resp = await SELF.fetch(BASE + path);
  let body: any = null;
  try {
    body = await resp.json();
  } catch {
    body = null;
  }
  return { status: resp.status, body };
}

// Schone lei per test; users 1 én 2 (FK user_id → users.id voor de U2-rij).
beforeEach(async () => {
  await db.delete(rpe).where(eq(rpe.userId, U));
  await db.delete(rpe).where(eq(rpe.userId, U2));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
  await db
    .insert(users)
    .values({ id: U2, email: "other@example.com" })
    .onConflictDoNothing();
});

describe("Fase 5.3d-i — rpe D1-read", () => {
  it("/api/rpe → alleen user_id=1, oudste-eerst, datum-string + rpe-number", async () => {
    // Out-of-order geseed → moet als asc(datum) terugkomen (spiegelt readWellness).
    await db.insert(rpe).values({ userId: U, datum: "2026-03-10", rpe: 6 });
    await db.insert(rpe).values({ userId: U, datum: "2026-03-08", rpe: 4 });
    await db.insert(rpe).values({ userId: U, datum: "2026-03-09", rpe: 7 });
    await db.insert(rpe).values({ userId: U2, datum: "2026-03-09", rpe: 9 });

    const { status, body } = await get("/api/rpe");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3); // alleen user_id=1
    // Oudste-eerst (asc datum).
    expect(body.map((r: any) => r.datum)).toEqual([
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
    // Rauwe yyyy-MM-dd-string + rpe-number.
    expect(typeof body[0].datum).toBe("string");
    expect(body[0].rpe).toBe(4);
    expect(typeof body[0].rpe).toBe("number");
    // user_id=2 uitgesloten.
    expect(body.some((r: any) => r.rpe === 9)).toBe(false);
  });

  it("/api/rpe → lege set → []", async () => {
    const { status, body } = await get("/api/rpe");
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});
