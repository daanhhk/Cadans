import { env } from "cloudflare:test";
import { pcNormalize_ } from "@cadans/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { users } from "../src/db/schema";
import type { FetchImpl, IntervalsEnv } from "../src/integrations/intervals";
import {
  readNormalizedPowerCurve,
  syncPowerCurve,
} from "../src/integrations/powercurve";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

// RAW {list, activities} zoals de intervals power-curves-endpoint (0b): alle extra
// velden op list[0] zelf. Cijfers analoog aan SelfTest testPowerCurve_.
function rawFixture(window: string) {
  return {
    list: [
      {
        label: window,
        days: window === "90d" ? 90 : 365,
        weight: 72,
        secs: [5, 60, 120, 300, 1200, 3600, 7200],
        values: [980, 560, 0, 372, 312, 276, 250],
        watts_per_kg: [16, 9, 0, 5.5, 4.6, 4.1, 3.7],
        activity_id: ["a", "a", "a", "a3", "a", "a", "a"],
      },
    ],
    activities: { a3: { start_date_local: "2026-03-10" } },
  };
}

function mockFetchCounting(raw: any) {
  const state = { calls: 0 };
  const fetchImpl = (async () => {
    state.calls++;
    return new Response(JSON.stringify(raw), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as FetchImpl;
  return { fetchImpl, state };
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

describe("power-curve RAW-cache (D1, gemockt)", () => {
  it("T1 cache round-trip: teruggelezen RAW identiek aan de fixture", async () => {
    const raw = rawFixture("1y");
    const { fetchImpl } = mockFetchCounting(raw);
    const res = await syncPowerCurve(testEnv, U, {
      fetchImpl,
      now: new Date(2026, 6, 1),
    });
    expect(res.cached).toBe(true);
    expect(res.fetchedOn).toBe("2026-07-01");
    const cache = await repo.readPowerCurveCache(db, U, "1y");
    expect(cache?.fetchedOn).toBe("2026-07-01");
    expect(cache?.raw).toEqual(raw); // cache corrumpeert niets
  });

  it("T2 dag-bucket-TTL: cache-hit op dag X (calls 1), re-fetch op dag X+1 (calls 2)", async () => {
    const { fetchImpl, state } = mockFetchCounting(rawFixture("1y"));
    const dayX = new Date(2026, 6, 1);
    const dayX1 = new Date(2026, 6, 2);
    await syncPowerCurve(testEnv, U, { fetchImpl, now: dayX });
    expect(state.calls).toBe(1);
    await readNormalizedPowerCurve(testEnv, U, "1y", { fetchImpl, now: dayX });
    expect(state.calls).toBe(1); // verse cache-hit → geen re-fetch
    await readNormalizedPowerCurve(testEnv, U, "1y", { fetchImpl, now: dayX1 });
    expect(state.calls).toBe(2); // stale (X+1) → re-fetch
  });

  it("T3 oracle: pcNormalize_ via cache == direct op de fixture; deterministisch", async () => {
    await repo.writeSettings(db, U, { ftp: 275 }); // 0d: ftp stroomt door de read
    const raw = rawFixture("1y");
    const { fetchImpl } = mockFetchCounting(raw);
    const viaCache = await readNormalizedPowerCurve(testEnv, U, "1y", {
      fetchImpl,
      now: new Date(2026, 6, 1),
    });
    const direct = pcNormalize_(raw.list[0], raw.activities, 275);
    expect(viaCache).toEqual(direct);
    // Deterministisch (SelfTest testPowerCurve_): 7200 capped (60min), 120s/0-watt
    // geskipt → 5 curve-punten; 5 markers (5s/1m/5m/20m/60m allemaal >0).
    if ("empty" in viaCache)
      throw new Error("verwacht een gevulde power-curve");
    expect(viaCache.curve.length).toBe(5);
    expect(viaCache.window.label).toBe("1y");
    expect(viaCache.riderType).toBeDefined();
    expect(viaCache.markers.length).toBe(5);
  });
});
