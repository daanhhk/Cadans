import { env, fetchMock, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { activities, users } from "../src/db/schema";

// RITDETAILS fase 1 — GET /api/ride/:id. De drie intervals-fetches gemockt op de GEPROBEDE
// vormen: plat /activity, /intervals als {icu_intervals:[…]}-wrapper, /streams als {type,data}-
// array met parallelle 1Hz-arrays. Assert op het samengestelde model (D1-gratis + gefetcht +
// gedownsamplede streams).

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
const ORIGIN = "https://intervals.icu";
const ID = "i999test";

const DETAIL = {
  id: ID,
  name: "Testrit",
  type: "Ride",
  start_date_local: "2026-07-16T12:00:00",
  total_elevation_gain: 60,
  average_cadence: 82.4,
  icu_joules: 755184, // Joule → 755 kJ
  icu_ftp: 275,
  icu_weight: 74.2,
  icu_weighted_avg_watts: 191,
  icu_intensity: 69,
  icu_training_load: 57,
  icu_average_watts: 174,
  average_heartrate: 133,
  max_heartrate: 161,
  distance: 27287.91,
  moving_time: 4284,
};
const IVS = {
  icu_intervals: [
    {
      type: "RECOVERY",
      label: null, // label vaak null → val terug op type
      zone: 2,
      moving_time: 266,
      elapsed_time: 293,
      average_watts: 155,
      intensity: 56, // %FTP
      average_heartrate: 120,
      max_heartrate: 140,
    },
  ],
};
const N = 1000;
const STREAMS = [
  { type: "time", data: Array.from({ length: N }, (_, i) => i) },
  { type: "watts", data: Array.from({ length: N }, (_, i) => 150 + (i % 50)) },
  { type: "heartrate", data: Array.from({ length: N }, () => 130) },
  { type: "cadence", data: Array.from({ length: N }, () => null) }, // gaten → null
];

async function call(path: string): Promise<{ status: number; body: any }> {
  const resp = await SELF.fetch(`https://cadans.test${path}`);
  let body: any = null;
  try {
    body = await resp.json();
  } catch {
    body = null;
  }
  return { status: resp.status, body };
}

describe("GET /api/ride/:id (route, fetch GEMOCKT)", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });
  afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
  });
  beforeEach(async () => {
    await db
      .insert(users)
      .values({ id: U, email: "d@e.nl" })
      .onConflictDoNothing();
    await db.delete(activities).where(eq(activities.userId, U));
    await db.insert(activities).values({
      userId: U,
      datum: "2026-07-16T12:00:00",
      type: "Ride",
      naam: "Testrit",
      duurMin: 71,
      afstandKm: 27.3,
      gemW: 174,
      normW: 191,
      ifPct: 69,
      tss: 57,
      gemHr: 133,
      maxHr: 161,
      ftp: 275,
      gewicht: 74.2,
      zoneTimesJson: '[{"id":"Z1","secs":786}]',
      activityIdExt: ID,
    });
  });

  it("assembleert D1-gratis + gefetchte metrics + gedownsamplede streams", async () => {
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}`, method: "GET" })
      .reply(200, JSON.stringify(DETAIL), {
        headers: { "content-type": "application/json" },
      });
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}/intervals`, method: "GET" })
      .reply(200, JSON.stringify(IVS), {
        headers: { "content-type": "application/json" },
      });
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}/streams`, method: "GET" })
      .reply(200, JSON.stringify(STREAMS), {
        headers: { "content-type": "application/json" },
      });

    const r = await call(`/api/ride/${ID}`);
    expect(r.status).toBe(200);
    // gratis uit D1
    expect(r.body.naam).toBe("Testrit");
    expect(r.body.np).toBe(191);
    expect(r.body.tss).toBe(57);
    expect(r.body.zoneTimesJson).toBe('[{"id":"Z1","secs":786}]');
    expect(r.body.wPerKg).toBeCloseTo(2.35, 2); // 174/74.2
    // gefetcht + kJ-conversie
    expect(r.body.hoogtewinstM).toBe(60);
    expect(r.body.cadans).toBe(82); // afgerond
    expect(r.body.arbeidKj).toBe(755); // icu_joules ÷1000
    // interval-breakdown (label null → type)
    expect(r.body.intervallen).toHaveLength(1);
    expect(r.body.intervallen[0].label).toBe("RECOVERY");
    expect(r.body.intervallen[0].pctFtp).toBe(56);
    expect(r.body.intervallen[0].watts).toBe(155);
    expect(r.body.intervallen[0].durationSec).toBe(266);
    // gedownsamplede streams
    expect(r.body.streams.n).toBeGreaterThan(0);
    expect(r.body.streams.n).toBeLessThanOrEqual(400); // van 1000 punten
    expect(r.body.streams.watts.length).toBe(r.body.streams.n);
    expect(r.body.streams.hr.length).toBe(r.body.streams.n);
    expect(r.body.streams.hr[0]).toBe(130);
  });

  it("id niet in D1 → 404 (geen fetch)", async () => {
    const r = await call(`/api/ride/i-onbekend`);
    expect(r.status).toBe(404);
  });

  it("rit zonder streams (streams 404) → model met streams:null, geen 502", async () => {
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}`, method: "GET" })
      .reply(200, JSON.stringify(DETAIL), {
        headers: { "content-type": "application/json" },
      });
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}/intervals`, method: "GET" })
      .reply(200, JSON.stringify(IVS), {
        headers: { "content-type": "application/json" },
      });
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}/streams`, method: "GET" })
      .reply(404, "no streams");

    const r = await call(`/api/ride/${ID}`);
    expect(r.status).toBe(200);
    expect(r.body.streams).toBeNull();
    expect(r.body.intervallen).toHaveLength(1); // core-fetches intact
  });

  it("/activity upstream 500 → 502", async () => {
    fetchMock
      .get(ORIGIN)
      .intercept({ path: `/api/v1/activity/${ID}`, method: "GET" })
      .reply(500, "boom");

    const r = await call(`/api/ride/${ID}`);
    expect(r.status).toBe(502);
  });
});
