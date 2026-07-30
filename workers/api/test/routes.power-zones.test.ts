import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { syncState, users } from "../src/db/schema";
import {
  type FetchImpl,
  type IntervalsEnv,
  syncActivities,
} from "../src/integrations/intervals";

// ROADMAP punt 6 fase 2, DATAKANT. De zone-grenzen komen uit de NIEUWSTE fiets-rit die de
// activiteiten-sync toch al ophaalt; er is geen tweede endpoint en geen extra route.
// Spec: docs/ZONE-SYNC-BOUWDOC.md §3 t/m §5.

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

const ZONES_OUD = [50, 70, 88, 100, 118, 145, 999];
const ZONES_NIEUW = [55, 75, 90, 105, 120, 150, 999];

/** Minimale activiteit; `zones` weggelaten → geen `icu_power_zones`-veld. */
function act(
  id: string,
  startLocal: string,
  o: { type?: string; zones?: number[] | null } = {},
) {
  const a: Record<string, unknown> = {
    id,
    start_date_local: startLocal,
    type: o.type ?? "Ride",
    name: id,
    moving_time: 3600,
    icu_training_load: 60,
  };
  if (o.zones !== undefined) a.icu_power_zones = o.zones;
  return a;
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

beforeEach(async () => {
  await db.delete(syncState).where(eq(syncState.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("de afleiding uit de activiteiten-sync", () => {
  it("(a) kiest de NIEUWSTE fiets-rit met een bruikbare array", async () => {
    // Bewust NIET op datum-volgorde aangeleverd: de sync sorteert zelf oudste-eerst.
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning([
        act("iv_b", "2026-06-11T10:00:00", { zones: ZONES_NIEUW }),
        act("iv_a", "2026-06-09T10:00:00", { zones: ZONES_OUD }),
      ]),
    });
    expect(await repo.readPowerZones(db, U)).toEqual(ZONES_NIEUW);
  });

  it("(a) slaat NIET-fiets-types over, ook als die nieuwer zijn", async () => {
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning([
        act("iv_rit", "2026-06-09T10:00:00", { zones: ZONES_OUD }),
        act("iv_loop", "2026-06-12T10:00:00", {
          type: "Run",
          zones: ZONES_NIEUW,
        }),
      ]),
    });
    expect(await repo.readPowerZones(db, U)).toEqual(ZONES_OUD);
  });

  it("(a) slaat ritten ZONDER het veld en met een lege array over", async () => {
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning([
        act("iv_goed", "2026-06-09T10:00:00", { zones: ZONES_OUD }),
        act("iv_leeg", "2026-06-11T10:00:00", { zones: [] }),
        act("iv_geen", "2026-06-12T10:00:00"),
      ]),
    });
    expect(await repo.readPowerZones(db, U)).toEqual(ZONES_OUD);
  });

  it("(b) geen enkele kandidaat → er wordt NIETS geschreven, de vorige waarde overleeft", async () => {
    await repo.writePowerZones(db, U, ZONES_OUD);
    const res = await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning([
        act("iv_loop", "2026-06-12T10:00:00", { type: "Run", zones: null }),
        act("iv_geen", "2026-06-13T10:00:00"),
      ]),
    });
    // De sync zelf draaide gewoon; alleen de zone-afleiding vond niets.
    expect(res.upserted).toBe(2);
    expect(await repo.readPowerZones(db, U)).toEqual(ZONES_OUD);
  });
});

describe("GET /api/power-zones", () => {
  it("(c) round-trip: sync schrijft → de route geeft exact die array terug", async () => {
    await syncActivities(testEnv, U, {
      fetchImpl: mockFetchReturning([
        act("iv_a", "2026-06-09T10:00:00", { zones: ZONES_NIEUW }),
      ]),
    });
    const r = await call("/api/power-zones");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ powerZones: ZONES_NIEUW });
  });

  it("(d) nog nooit gesynct → powerZones null, geen 404", async () => {
    const r = await call("/api/power-zones");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ powerZones: null });
  });
});

describe("writePowerZones raakt ALLEEN zijn eigen kolom", () => {
  it("(e) fatigue-shift en dosis-trede blijven ongewijzigd — getoetst op het EFFECT", async () => {
    await repo.writeFatigueShift(db, U, "2026-06-08", "down");
    await repo.writeDosisTrede(db, U, 2, "2026-06-01", "FTP");

    await repo.writePowerZones(db, U, ZONES_NIEUW);

    expect(await repo.readPowerZones(db, U)).toEqual(ZONES_NIEUW);
    expect(await repo.readFatigueShift(db, U)).toEqual({
      monday: "2026-06-08",
      dir: "down",
    });
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: 2,
      blok: "2026-06-01",
      doel: "FTP",
    });
  });
});
