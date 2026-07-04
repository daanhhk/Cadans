import { env, fetchMock, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { activities, powerCurveCache, users, wellness } from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
const ORIGIN = "https://intervals.icu";

// ── fixtures (vorm 1-op-1 uit test/{intervals,wellness,powercurve}.test.ts) ──
function act(id: string, startLocal: string, name: string, tss: number) {
  return {
    id,
    start_date_local: startLocal,
    type: "Ride",
    name,
    moving_time: 3600,
    distance: 30000,
    icu_average_watts: 210,
    icu_weighted_avg_watts: 225,
    icu_intensity: 77,
    icu_training_load: tss,
    polarization_index: 1.83,
    average_heartrate: 142,
    max_heartrate: 176,
    icu_ftp: 270,
    icu_weight: 70,
    icu_rolling_ftp: 268,
    icu_zone_times: [
      { id: "Z1", secs: 600 },
      { id: "Z3", secs: 300 },
    ],
  };
}

function well(date: string, o: any) {
  return {
    id: date,
    restingHR: o.rhr,
    hrv: o.hrv,
    sleepSecs: o.sleepSecs,
    sleepScore: o.sleepScore,
    readiness: o.readiness,
    mood: o.mood,
    weight: o.weight,
    ctl: o.ctl,
    atl: o.atl,
    rampRate: o.ramp,
  };
}

function rawCurve(window: string) {
  return {
    list: [
      {
        label: window,
        days: window === "90d" ? 90 : 365,
        weight: 72,
        secs: [5, 60, 300, 1200, 3600],
        values: [980, 560, 372, 312, 276],
        watts_per_kg: [13.6, 7.8, 5.2, 4.3, 3.8],
        activity_id: ["a", "a", "a3", "a", "a"],
      },
    ],
    activities: { a3: { start_date_local: "2026-03-10" } },
  };
}

// Interceptor: pint het pad-segment, WILDCARD de ambient-now-query.
function intercept(pathRe: RegExp, status: number, body: unknown) {
  fetchMock
    .get(ORIGIN)
    .intercept({ path: pathRe, method: "GET" })
    .reply(status, typeof body === "string" ? body : JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
}

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

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

beforeEach(async () => {
  await db.delete(activities).where(eq(activities.userId, U));
  await db.delete(wellness).where(eq(wellness.userId, U));
  await db.delete(powerCurveCache).where(eq(powerCurveCache.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("Fase 4b — sync-routes (POST) + power-curve-read (GET), fetch GEMOCKT", () => {
  it("POST /api/sync/activities → 200 {fetched,upserted}; rijen in D1", async () => {
    intercept(/\/athlete\/[^/]+\/activities/, 200, [
      act("iv_a", "2026-06-09T10:00:00", "Ride A", 80),
      act("iv_x", "2026-06-10T07:00:00", "Ochtend", 85),
      act("iv_y", "2026-06-10T18:00:00", "Avond", 45),
    ]);
    const r = await call("/api/sync/activities", { method: "POST" });
    expect(r.status).toBe(200);
    expect(r.body.fetched).toBe(3);
    expect(r.body.upserted).toBe(3);

    const rows = await repo.readActivities(db, U);
    expect(rows.length).toBe(3);
  });

  it("POST /api/sync/wellness → 200 {fetched,upserted}; readback niet leeg", async () => {
    intercept(/\/athlete\/[^/]+\/wellness/, 200, [
      well("2026-06-10", { rhr: 48, sleepSecs: 25200, ctl: 55, atl: 40 }),
      well("2026-06-11", { rhr: 50, sleepSecs: 21600, ctl: 56, atl: 41 }),
    ]);
    const r = await call("/api/sync/wellness", { method: "POST" });
    expect(r.status).toBe(200);
    expect(r.body.fetched).toBe(2);
    expect(r.body.upserted).toBe(2);

    const recs = await repo.readWellness(db, U);
    expect(recs.length).toBe(2);
  });

  it("POST /api/sync/power-curve → 200 {window,fetchedOn,cached}", async () => {
    intercept(/\/athlete\/[^/]+\/power-curves/, 200, rawCurve("1y"));
    const r = await call("/api/sync/power-curve", { method: "POST" });
    expect(r.status).toBe(200);
    expect(r.body.window).toBe("1y");
    expect(r.body.cached).toBe(true);
    expect(typeof r.body.fetchedOn).toBe("string");
    expect(r.body.fetchedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("GET /api/power-curve na sync = cache-hit (één interceptor), output niet leeg", async () => {
    intercept(/\/athlete\/[^/]+\/power-curves/, 200, rawCurve("1y"));
    const post = await call("/api/sync/power-curve", { method: "POST" });
    expect(post.status).toBe(200);
    // GEEN nieuwe interceptor: zelfde dag-bucket → cache-hit, geen refetch.
    const get = await call("/api/power-curve");
    expect(get.status).toBe(200);
    expect(get.body.empty).toBeUndefined();
    expect(get.body.window.label).toBe("1y");
    expect(Array.isArray(get.body.curve)).toBe(true);
    expect(get.body.curve.length).toBeGreaterThan(0);
  });

  it("bad param: POST /api/sync/activities?days=abc → 400; GET /api/power-curve?window=nonsense → 400", async () => {
    const a = await call("/api/sync/activities?days=abc", { method: "POST" });
    expect(a.status).toBe(400);
    expect(a.body.error).toBeDefined();

    const b = await call("/api/power-curve?window=nonsense");
    expect(b.status).toBe(400);
    expect(b.body.error).toBeDefined();
  });

  it("upstream 500 → 502 (fetch-wrapper gooit bij non-2xx)", async () => {
    intercept(/\/athlete\/[^/]+\/wellness/, 500, "upstream error");
    const r = await call("/api/sync/wellness", { method: "POST" });
    expect(r.status).toBe(502);
    expect(r.body.error).toBeDefined();
  });
});
