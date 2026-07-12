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

describe("Fase A2 — disposition D1 (PUT /api/disposition/:date, GET /api/dispositions)", () => {
  it("a. PUT geldige reason → 200 {ok:true}; GET bevat {datum, reason}", async () => {
    const r = await put("/api/disposition/2026-03-10", {
      reason: "bewust_gerust",
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
    const g = await get("/api/dispositions");
    expect(g.status).toBe(200);
    expect(g.body).toHaveLength(1);
    expect(g.body[0]).toEqual({ datum: "2026-03-10", reason: "bewust_gerust" });
  });

  it("b. NON-CLOBBER: disposition-write laat override_json intact; null-wis idem", async () => {
    // Bestaande rij met override_json gevuld + disposition null.
    const override = JSON.stringify({ type: "sweet_spot", locked: true });
    await db.insert(dayState).values({
      userId: U,
      datum: "2026-03-11",
      overrideJson: override,
      disposition: null,
    });

    // PUT disposition → disposition gezet, override_json ONGEWIJZIGD.
    await put("/api/disposition/2026-03-11", { reason: "geen_tijd" });
    let row = await rowFor("2026-03-11");
    expect(row?.disposition).toBe("geen_tijd");
    expect(row?.overrideJson).toBe(override);

    // PUT {reason:null} → disposition gewist, override_json NOG STEEDS intact.
    await put("/api/disposition/2026-03-11", { reason: null });
    row = await rowFor("2026-03-11");
    expect(row?.disposition).toBeNull();
    expect(row?.overrideJson).toBe(override);
  });

  it("c. PUT {reason:null} op een los-gedisponeerde dag → GET bevat die datum niet meer", async () => {
    await put("/api/disposition/2026-03-12", { reason: "iets_anders" });
    expect((await get("/api/dispositions")).body).toHaveLength(1);
    await put("/api/disposition/2026-03-12", { reason: null });
    const g = await get("/api/dispositions");
    expect(g.body.some((r: any) => r.datum === "2026-03-12")).toBe(false);
  });

  it("d. PUT ongeldige reason ('banana') → 400, geen write", async () => {
    const r = await put("/api/disposition/2026-03-13", { reason: "banana" });
    expect(r.status).toBe(400);
    expect(await rowFor("2026-03-13")).toBeNull();
  });

  it("e. GET geeft ALLEEN dagen mét disposition (enkel-override_json valt weg)", async () => {
    // Alleen override_json (geen disposition) → mag NIET in de GET verschijnen.
    await db.insert(dayState).values({
      userId: U,
      datum: "2026-03-14",
      overrideJson: JSON.stringify({ x: 1 }),
      disposition: null,
    });
    await put("/api/disposition/2026-03-15", { reason: "geen_tijd" });
    const g = await get("/api/dispositions");
    expect(g.body).toHaveLength(1);
    expect(g.body[0].datum).toBe("2026-03-15");
    expect(g.body.some((r: any) => r.datum === "2026-03-14")).toBe(false);
  });
});
