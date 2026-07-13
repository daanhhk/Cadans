import { env, SELF } from "cloudflare:test";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { dayState, users } from "../src/db/schema";

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

async function put(
  path: string,
  body: unknown,
): Promise<{ status: number; body: any }> {
  const resp = await SELF.fetch(BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let b: any = null;
  try {
    b = await resp.json();
  } catch {
    b = null;
  }
  return { status: resp.status, body: b };
}

// Directe day_state-rij (voor de non-clobber-assert): (U, datum) uit de gedeelde PK.
async function rowFor(datum: string) {
  const rows = await db
    .select()
    .from(dayState)
    .where(and(eq(dayState.userId, U), eq(dayState.datum, datum)));
  return rows[0] ?? null;
}

// Schone lei per test; users 1 én 2 (FK user_id → users.id voor de U2-rij).
beforeEach(async () => {
  await db.delete(dayState).where(eq(dayState.userId, U));
  await db.delete(dayState).where(eq(dayState.userId, U2));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
  await db
    .insert(users)
    .values({ id: U2, email: "other@example.com" })
    .onConflictDoNothing();
});

describe("Fase B — override D1 (PUT /api/override/:date, GET /api/overrides)", () => {
  it("a. PUT LibraryOverride → 200 {ok:true}; GET geeft de geparste override terug", async () => {
    const ov = {
      type: "library",
      workoutType: "sweet_spot",
      variantId: "ss_2x20",
      durMin: 90,
    };
    const r = await put("/api/override/2026-03-10", { override: ov });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
    const g = await get("/api/overrides");
    expect(g.status).toBe(200);
    expect(g.body).toHaveLength(1);
    expect(g.body[0]).toEqual({ datum: "2026-03-10", override: ov });
  });

  it("b. PUT FreeOverride → round-trip", async () => {
    const ov = {
      type: "free",
      ritType: "groep",
      intensiteit: "stevig",
      durMin: 120,
    };
    await put("/api/override/2026-03-11", { override: ov });
    const g = await get("/api/overrides");
    expect(g.body).toHaveLength(1);
    expect(g.body[0]).toEqual({ datum: "2026-03-11", override: ov });
  });

  it("c. PUT {override:null} → rij weg uit GET /overrides", async () => {
    await put("/api/override/2026-03-12", {
      override: { type: "library", workoutType: "tempo", durMin: 60 },
    });
    expect((await get("/api/overrides")).body).toHaveLength(1);
    await put("/api/override/2026-03-12", { override: null });
    const g = await get("/api/overrides");
    expect(g.body.some((r: any) => r.datum === "2026-03-12")).toBe(false);
  });

  it("d. NON-CLOBBER: disposition én override op dezelfde (user,datum) → onafhankelijk", async () => {
    const ov = { type: "library", workoutType: "threshold", durMin: 75 };
    await put("/api/override/2026-03-13", { override: ov });
    await put("/api/disposition/2026-03-13", { reason: "geen_tijd" });
    const go = await get("/api/overrides");
    expect(go.body).toHaveLength(1);
    expect(go.body[0]).toEqual({ datum: "2026-03-13", override: ov });
    const gd = await get("/api/dispositions");
    expect(gd.body).toHaveLength(1);
    expect(gd.body[0]).toEqual({ datum: "2026-03-13", reason: "geen_tijd" });
    // Op rij-niveau: beide kolommen gezet, geen van beide overschreven.
    const row = await rowFor("2026-03-13");
    expect(row?.disposition).toBe("geen_tijd");
    expect(row?.overrideJson).toBe(JSON.stringify(ov));
  });

  it("e. invalid body (durMin=10 / onbekende workoutType) → 400, geen write", async () => {
    expect(
      (
        await put("/api/override/2026-03-14", {
          override: { type: "library", workoutType: "sweet_spot", durMin: 10 },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await put("/api/override/2026-03-14", {
          override: { type: "library", workoutType: "banana", durMin: 60 },
        })
      ).status,
    ).toBe(400);
    expect(await rowFor("2026-03-14")).toBeNull();
  });
});
