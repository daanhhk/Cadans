import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { toD1Date } from "../src/db/dates";
import * as repo from "../src/db/repo";
import { users } from "../src/db/schema";
import {
  type FetchImpl,
  type IntervalsEnv,
  syncActivities,
} from "../src/integrations/intervals";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

// Representatieve intervals.icu-activity (shape uit IntervalsApi.gs / testActivityToRow_).
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

function mockFetchReturning(activities: unknown[]): FetchImpl {
  return (async () =>
    new Response(JSON.stringify(activities), {
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

describe("intervals activiteiten-sync (gemockt, lokale D1)", () => {
  it("fetch-mock → normaliseer → upsert: rijen + start_date_local via dates.ts", async () => {
    const fixtures = [
      act("iv_a", "2026-06-09T10:00:00", "Ride A", 80),
      act("iv_x", "2026-06-10T07:00:00", "Ochtend", 85),
      act("iv_y", "2026-06-10T18:00:00", "Avond", 45),
    ];
    const res = await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning(fixtures),
    });
    expect(res.fetched).toBe(3);
    expect(res.upserted).toBe(3);

    const rows = await repo.readActivities(db, U);
    const mine = rows.filter((r) => String(r[16]).startsWith("iv_"));
    expect(mine.length).toBe(3);

    // 2 activiteiten op 2026-06-10 = 2 rijen (multi-sessie), 1 op 06-09.
    expect(mine.filter((r) => toD1Date(r[0]) === "2026-06-10").length).toBe(2);
    expect(mine.filter((r) => toD1Date(r[0]) === "2026-06-09").length).toBe(1);

    // start_date_local landt correct via dates.ts (idx0 = Date).
    const x = mine.find((r) => r[16] === "iv_x");
    expect(x?.[0] instanceof Date).toBe(true);
    expect(toD1Date(x?.[0])).toBe("2026-06-10");
    expect(x?.[2]).toBe("Ochtend");
    expect(x?.[8]).toBe(85); // TSS
  });

  it("idempotentie: dubbele id (2× sync) → 1 rij; verschillende id/dag → aparte rijen", async () => {
    const fixtures = [
      act("iv_x", "2026-06-10T07:00:00", "Ochtend", 85),
      act("iv_y", "2026-06-10T18:00:00", "Avond", 45),
    ];
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning(fixtures),
    });
    // Tweede sync met identieke id's (laatste-wint) → geen dubbele rijen.
    const updated = [act("iv_x", "2026-06-10T07:00:00", "Ochtend-2", 90)];
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning(updated),
    });

    const rows = await repo.readActivities(db, U);
    const mine = rows.filter((r) => String(r[16]).startsWith("iv_"));
    expect(mine.length).toBe(2); // iv_x geüpdatet (niet gedupliceerd) + iv_y blijft

    const x = mine.find((r) => r[16] === "iv_x");
    expect(x?.[2]).toBe("Ochtend-2"); // laatste wint
    expect(x?.[8]).toBe(90);
  });
});
