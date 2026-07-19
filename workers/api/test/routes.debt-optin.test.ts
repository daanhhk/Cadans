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

describe("GET/PUT /api/debt-optin", () => {
  it("leeg → null", async () => {
    const r = await call("/api/debt-optin");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ monday: null });
    expect(await repo.readDebtOptIn(db, U)).toBeNull();
  });

  it("PUT zet de week-maandag; GET leest 'm terug", async () => {
    const w = await put("/api/debt-optin", { monday: "2026-07-20" });
    expect(w.status).toBe(200);
    expect(w.body).toEqual({ ok: true });
    expect(await repo.readDebtOptIn(db, U)).toBe("2026-07-20");
    expect((await call("/api/debt-optin")).body).toEqual({
      monday: "2026-07-20",
    });
  });

  it("PUT null wist de goedkeuring (terugdraaien)", async () => {
    await put("/api/debt-optin", { monday: "2026-07-20" });
    const r = await put("/api/debt-optin", { monday: null });
    expect(r.status).toBe(200);
    expect(await repo.readDebtOptIn(db, U)).toBeNull();
  });

  it("overschrijven met een andere week vervangt de waarde", async () => {
    await put("/api/debt-optin", { monday: "2026-07-13" });
    await put("/api/debt-optin", { monday: "2026-07-20" });
    expect(await repo.readDebtOptIn(db, U)).toBe("2026-07-20");
  });

  it("ongeldige monday → 400", async () => {
    for (const bad of ["20-07-2026", "2026-13-01", 42, "", true]) {
      const r = await put("/api/debt-optin", { monday: bad });
      expect(r.status).toBe(400);
      expect(r.body.error).toBeDefined();
    }
  });

  it("de opt-in-write laat de andere sync_state-velden intact", async () => {
    await db
      .insert(syncState)
      .values({ userId: U, lastSync: "2026-07-19T10:00:00Z", mesoWeek: 3 })
      .onConflictDoUpdate({
        target: syncState.userId,
        set: { lastSync: "2026-07-19T10:00:00Z", mesoWeek: 3 },
      });
    await put("/api/debt-optin", { monday: "2026-07-20" });
    const rows = await db
      .select()
      .from(syncState)
      .where(eq(syncState.userId, U));
    expect(rows[0]?.debtOptInWeek).toBe("2026-07-20");
    expect(rows[0]?.lastSync).toBe("2026-07-19T10:00:00Z");
    expect(rows[0]?.mesoWeek).toBe(3);
  });
});
