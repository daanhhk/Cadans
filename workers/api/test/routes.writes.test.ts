import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { checkins, settings, users, weekplans } from "../src/db/schema";

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

async function put(
  path: string,
  body: unknown,
): Promise<{ status: number; body: any }> {
  return call(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(async () => {
  await db.delete(settings).where(eq(settings.userId, U));
  await db.delete(checkins).where(eq(checkins.userId, U));
  await db.delete(weekplans).where(eq(weekplans.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("Fase 4c — D1-write-routes (PUT, SELF.fetch)", () => {
  it("PUT /api/settings → 200; readback ftp + doelStart(Date)", async () => {
    const r = await put("/api/settings", { ftp: 275, doelStart: "2026-03-01" });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });

    const s = await repo.readSettings(db, U);
    expect(s?.ftp).toBe(275);
    expect(s?.doelStart instanceof Date).toBe(true);
    expect(s?.doelStart?.getFullYear()).toBe(2026);
    expect(s?.doelStart?.getMonth()).toBe(2); // maart
    expect(s?.doelStart?.getDate()).toBe(1);
  });

  it("ROUND-TRIP write→read: doelStart kale yyyy-MM-dd (anti-UTC-drift)", async () => {
    await put("/api/settings", { ftp: 300, doelStart: "2026-03-01" });
    const g = await call("/api/settings");
    expect(g.status).toBe(200);
    expect(g.body.ftp).toBe(300);
    expect(g.body.doelStart).toBe("2026-03-01");
    expect(String(g.body.doelStart)).not.toContain("Z");
  });

  it("ROUND-TRIP coachNaam + naam (presentatie-velden) → GET geeft beide exact terug", async () => {
    const r = await put("/api/settings", {
      coachNaam: "Coach Stelvio",
      naam: "Daan Kort",
    });
    expect(r.status).toBe(200);
    const g = await call("/api/settings");
    expect(g.status).toBe(200);
    expect(g.body.coachNaam).toBe("Coach Stelvio");
    expect(g.body.naam).toBe("Daan Kort");
  });

  it("PUT coachNaam 25 tekens → GET 24 (server-cap, GAS-parity)", async () => {
    await put("/api/settings", { coachNaam: "A".repeat(25) });
    const g = await call("/api/settings");
    expect(g.body.coachNaam).toHaveLength(24);
    expect(g.body.coachNaam).toBe("A".repeat(24));
  });

  it("ROUND-TRIP coachPersona (presentatie-veld) → GET geeft 'm exact terug", async () => {
    const r = await put("/api/settings", { coachPersona: "warm" });
    expect(r.status).toBe(200);
    const g = await call("/api/settings");
    expect(g.status).toBe(200);
    expect(g.body.coachPersona).toBe("warm");
  });

  it("PUT /api/settings doelStart '2026-13-99' → 400", async () => {
    const r = await put("/api/settings", { doelStart: "2026-13-99" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("PUT /api/settings ftp verkeerd type (string) → 400", async () => {
    const r = await put("/api/settings", { ftp: "abc" });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("PUT /api/settings ongeldige JSON → 400", async () => {
    const r = await put("/api/settings", "{niet json");
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("PUT /api/settings top-level array → 400", async () => {
    const r = await put("/api/settings", [1, 2, 3]);
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("PUT /api/checkin/:date → 200; readback + GET round-trip", async () => {
    const payload = { slaap: "goed", benen: "fris", stress: "laag" };
    const r = await put("/api/checkin/2026-01-15", payload);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });

    const back = await repo.readCheckin(db, U, "2026-01-15");
    expect(back).toEqual(payload);

    const g = await call("/api/checkin/2026-01-15");
    expect(g.status).toBe(200);
    expect(g.body).toEqual(payload);
  });

  it("PUT /api/checkin ongeldige datum → 400; missend veld → 400", async () => {
    const bad = await put("/api/checkin/2026-13-01", {
      slaap: "x",
      benen: "y",
      stress: "z",
    });
    expect(bad.status).toBe(400);

    const missing = await put("/api/checkin/2026-01-15", {
      slaap: "x",
      benen: "y",
    });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toBeDefined();
  });

  it("PUT /api/weekplan/:monday → 200; readback + GET round-trip", async () => {
    const entries = [
      { datum: "2026-01-12", type: "sweet_spot", tag: "e1" },
      { datum: "2026-01-14", type: "vo2", tag: "e2" },
    ];
    const r = await put("/api/weekplan/2026-01-12", { entries });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });

    const back = await repo.readWeekplan(db, U, "2026-01-12");
    expect(back).toEqual(entries);

    const g = await call("/api/weekplan/2026-01-12");
    expect(g.status).toBe(200);
    expect(g.body).toEqual(entries);
  });

  it("PUT /api/weekplan entries geen array → 400; ongeldige maandag → 400", async () => {
    const notArr = await put("/api/weekplan/2026-01-12", {
      entries: "geen array",
    });
    expect(notArr.status).toBe(400);
    expect(notArr.body.error).toBeDefined();

    const badMonday = await put("/api/weekplan/2026-13-01", { entries: [] });
    expect(badMonday.status).toBe(400);
  });
});
