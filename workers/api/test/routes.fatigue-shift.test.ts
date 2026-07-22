import { env, SELF } from "cloudflare:test";
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

describe("GET/PUT /api/fatigue-shift", () => {
  it("leeg → {null,null}", async () => {
    const r = await call("/api/fatigue-shift");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ monday: null, dir: null });
    expect(await repo.readFatigueShift(db, U)).toEqual({
      monday: null,
      dir: null,
    });
  });

  it("PUT zet maandag + richting; GET leest ze terug", async () => {
    const w = await put("/api/fatigue-shift", {
      monday: "2026-07-20",
      dir: "up",
    });
    expect(w.status).toBe(200);
    expect(w.body).toEqual({ ok: true });
    expect(await repo.readFatigueShift(db, U)).toEqual({
      monday: "2026-07-20",
      dir: "up",
    });
    expect((await call("/api/fatigue-shift")).body).toEqual({
      monday: "2026-07-20",
      dir: "up",
    });
  });

  it("PUT down werkt ook", async () => {
    await put("/api/fatigue-shift", { monday: "2026-07-20", dir: "down" });
    expect((await call("/api/fatigue-shift")).body).toEqual({
      monday: "2026-07-20",
      dir: "down",
    });
  });

  it("PUT null,null wist de shift (terugdraaien)", async () => {
    await put("/api/fatigue-shift", { monday: "2026-07-20", dir: "up" });
    const r = await put("/api/fatigue-shift", { monday: null, dir: null });
    expect(r.status).toBe(200);
    expect(await repo.readFatigueShift(db, U)).toEqual({
      monday: null,
      dir: null,
    });
  });

  it("ongeldige monday → 400", async () => {
    for (const bad of ["20-07-2026", "2026-13-01", 42, ""]) {
      const r = await put("/api/fatigue-shift", { monday: bad, dir: "up" });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
  });

  it("ongeldige dir → 400", async () => {
    for (const bad of ["sideways", 1, "UP", ""]) {
      const r = await put("/api/fatigue-shift", {
        monday: "2026-07-20",
        dir: bad,
      });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
  });

  it("de fatigue-write laat de andere sync_state-velden intact (incl. debt-opt-in)", async () => {
    await db
      .insert(syncState)
      .values({
        userId: U,
        lastSync: "2026-07-19T10:00:00Z",
        mesoWeek: 3,
        debtOptInWeek: "2026-07-13",
      })
      .onConflictDoUpdate({
        target: syncState.userId,
        set: {
          lastSync: "2026-07-19T10:00:00Z",
          mesoWeek: 3,
          debtOptInWeek: "2026-07-13",
        },
      });
    await put("/api/fatigue-shift", { monday: "2026-07-20", dir: "down" });
    const rows = await db
      .select()
      .from(syncState)
      .where(eq(syncState.userId, U));
    expect(rows[0]?.fatigueShiftWeek).toBe("2026-07-20");
    expect(rows[0]?.fatigueShiftDir).toBe("down");
    expect(rows[0]?.lastSync).toBe("2026-07-19T10:00:00Z");
    expect(rows[0]?.mesoWeek).toBe(3);
    expect(rows[0]?.debtOptInWeek).toBe("2026-07-13");
  });
});
