import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import {
  activities,
  checkins,
  settings,
  users,
  weekplans,
  wellness,
} from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
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

function wellRow(datum: string): repo.WellnessInput {
  return {
    datum,
    rhr: 48,
    hrv: 65,
    slaapU: 7.5,
    slaapScore: 80,
    readiness: 90,
    mood: "ok",
    weightKg: 70,
    ctl: 50,
    atl: 45,
    vorm: 5,
    ramp: 1.2,
  };
}

// Zelfde hardcoded user + gedeelde lokale D1 → schone lei per test.
beforeEach(async () => {
  await db.delete(settings).where(eq(settings.userId, U));
  await db.delete(wellness).where(eq(wellness.userId, U));
  await db.delete(activities).where(eq(activities.userId, U));
  await db.delete(weekplans).where(eq(weekplans.userId, U));
  await db.delete(checkins).where(eq(checkins.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("Fase 4a — D1-read-routes (SELF.fetch, lokale D1)", () => {
  it("/api/health → 200, body-shape identiek", async () => {
    const { status, body } = await get("/api/health");
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, service: "cadans-api" });
  });

  it("/api/settings → doelStart kale yyyy-MM-dd; verse user → null", async () => {
    let r = await get("/api/settings");
    expect(r.status).toBe(200);
    expect(r.body).toBeNull();

    await repo.writeSettings(db, U, {
      ftp: 275,
      doelStart: new Date(2026, 0, 5),
    });
    r = await get("/api/settings");
    expect(r.status).toBe(200);
    expect(r.body.doelStart).toBe("2026-01-05"); // NIET "…Z"
    expect(String(r.body.doelStart)).not.toContain("Z");
  });

  it("/api/wellness → oudste-eerst + datum kale yyyy-MM-dd (anti-drift)", async () => {
    await repo.upsertWellness(db, U, wellRow("2026-01-16"));
    await repo.upsertWellness(db, U, wellRow("2026-01-15"));
    const { status, body } = await get("/api/wellness");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    expect(body[0].datum).toBe("2026-01-15");
    expect(body[1].datum).toBe("2026-01-16");
  });

  it("/api/activities → niet leeg; ?from&to happy; ongeldig ?from → 400", async () => {
    const row = [
      new Date(2026, 0, 15, 7, 0, 0),
      "Ride",
      "Test",
      60,
      30,
      200,
      210,
      77,
      80,
      140,
      175,
      1.8,
      270,
      70,
      268,
      "",
      "act_seed_1",
    ];
    await repo.upsertActivity(db, U, row);

    let r = await get("/api/activities");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.length).toBeGreaterThan(0);
    expect(String(r.body[0][0])).not.toContain("Z"); // idx0 = kale datetime, geen UTC

    r = await get("/api/activities?from=2026-01-01&to=2026-12-31");
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);

    r = await get("/api/activities?from=xx");
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("/api/weekplans/recent → zonder monday 400; met monday bevat het plan", async () => {
    let r = await get("/api/weekplans/recent");
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();

    const monday = "2026-06-08";
    await repo.writeWeekplan(db, U, monday, [
      { datum: "2026-06-08", type: "sweet_spot", tag: "wk0" },
    ]);
    r = await get(`/api/weekplans/recent?monday=${monday}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(JSON.stringify(r.body)).toContain("wk0");
  });

  it("/api/weekplan/:monday → geseed 200; onbekend 404; ongeldig 400", async () => {
    const monday = "2026-06-08";
    await repo.writeWeekplan(db, U, monday, [{ tag: "wk0" }]);
    let r = await get(`/api/weekplan/${monday}`);
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).toContain("wk0");

    r = await get("/api/weekplan/2026-06-01");
    expect(r.status).toBe(404);

    r = await get("/api/weekplan/2026-13-99");
    expect(r.status).toBe(400);
  });

  it("/api/checkin/:date → geseed 200; onbekend 404; ongeldig 400", async () => {
    const date = "2026-06-10";
    await repo.writeCheckin(db, U, date, {
      slaap: "goed",
      benen: "fris",
      stress: "laag",
    });
    let r = await get(`/api/checkin/${date}`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ slaap: "goed", benen: "fris", stress: "laag" });

    r = await get("/api/checkin/2026-06-11");
    expect(r.status).toBe(404);

    r = await get("/api/checkin/nope");
    expect(r.status).toBe(400);
  });

  it("onbekend pad /api/nope → 404 met JSON error", async () => {
    const { status, body } = await get("/api/nope");
    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });
});
