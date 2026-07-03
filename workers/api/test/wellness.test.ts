import { env } from "cloudflare:test";
import { dashVormReeks_ } from "@cadans/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { toD1Date } from "../src/db/dates";
import * as repo from "../src/db/repo";
import { users } from "../src/db/schema";
import type { FetchImpl, IntervalsEnv } from "../src/integrations/intervals";
import { syncWellness } from "../src/integrations/wellness";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

// Representatieve intervals-wellness (id = kale datum, zoals de API).
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

function winput(datum: string, o: any = {}): repo.WellnessInput {
  return {
    datum,
    rhr: null,
    hrv: null,
    slaapU: null,
    slaapScore: null,
    readiness: null,
    mood: null,
    weightKg: null,
    ctl: null,
    atl: null,
    vorm: null,
    ramp: null,
    ...o,
  };
}

function mockFetchReturning(items: unknown[]): FetchImpl {
  return (async () =>
    new Response(JSON.stringify(items), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as FetchImpl;
}

const testEnv: IntervalsEnv = {
  DB: env.DB,
  INTERVALS_API_KEY: "test-key",
  INTERVALS_ATHLETE_ID: "i12345",
};

beforeEach(async () => {
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("wellness-sync (gemockt, lokale D1)", () => {
  it("T1 mapping: velden + vorm=ctl−atl + slaap seconden→uren", async () => {
    const fixtures = [
      well("2026-06-10", {
        rhr: 48,
        hrv: 65,
        sleepSecs: 25200, // 7,0 u
        sleepScore: 82,
        readiness: 90,
        mood: "good",
        weight: 70,
        ctl: 55,
        atl: 40,
        ramp: 3,
      }),
    ];
    const res = await syncWellness(testEnv, U, {
      fetchImpl: mockFetchReturning(fixtures),
    });
    expect(res.fetched).toBe(1);
    expect(res.upserted).toBe(1);

    const recs = await repo.readWellness(db, U);
    expect(recs.length).toBe(1);
    const r = recs[0];
    expect(r?.datum instanceof Date).toBe(true);
    expect(toD1Date(r?.datum as Date)).toBe("2026-06-10"); // via dates.ts
    expect(r?.rhr).toBe(48);
    expect(r?.hrv).toBe(65);
    expect(r?.slaapU).toBe(7); // 25200/360/10 = 7
    expect(r?.slaapScore).toBe(82);
    expect(r?.readiness).toBe(90);
    expect(r?.weightKg).toBe(70);
    expect(r?.ctl).toBe(55);
    expect(r?.atl).toBe(40);
    expect(r?.vorm).toBe(15); // ctl − atl
    expect(r?.ramp).toBe(3);
  });

  it("T2 idempotentie: 2× dezelfde datum → 1 rij, geüpdatet", async () => {
    await syncWellness(testEnv, U, {
      fetchImpl: mockFetchReturning([well("2026-06-10", { ctl: 55, atl: 40 })]),
    });
    await syncWellness(testEnv, U, {
      fetchImpl: mockFetchReturning([well("2026-06-10", { ctl: 60, atl: 42 })]),
    });
    const mine = (await repo.readWellness(db, U)).filter(
      (r) => toD1Date(r.datum) === "2026-06-10",
    );
    expect(mine.length).toBe(1); // één rij per datum
    expect(mine[0]?.ctl).toBe(60); // laatste wint
    expect(mine[0]?.vorm).toBe(18); // 60 − 42
  });

  it("T3 oracle: dashVormReeks_(wellnessRowsToWellValues_(readWellness)) == fixture, oudste-eerst", async () => {
    // Ongesorteerd geseed → dashVormReeks_ sorteert oudste-eerst.
    await repo.upsertWellness(
      db,
      U,
      winput("2026-06-08", { ctl: 50, atl: 45, vorm: 5 }),
    );
    await repo.upsertWellness(
      db,
      U,
      winput("2026-06-10", { ctl: 55, atl: 40, vorm: 15 }),
    );
    await repo.upsertWellness(
      db,
      U,
      winput("2026-06-09", { ctl: 52, atl: 48, vorm: 4 }),
    );

    const wellValues = repo.wellnessRowsToWellValues_(
      await repo.readWellness(db, U),
    );
    const reeks = dashVormReeks_(wellValues);
    expect(reeks).toEqual([
      { dateISO: "2026-06-08", ctl: 50, atl: 45, vorm: 5 },
      { dateISO: "2026-06-09", ctl: 52, atl: 48, vorm: 4 },
      { dateISO: "2026-06-10", ctl: 55, atl: 40, vorm: 15 },
    ]);
  });
});
