import { env } from "cloudflare:test";
import {
  activityToRow_,
  gatherWeekplanEntries_,
  getReadinessScore_,
  recencyFromWeekplan_,
} from "@cadans/engine";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { users } from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

beforeEach(async () => {
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("repo round-trips (D1 ↔ engine-shapes)", () => {
  it("settings write→read, doelStart via TZ-conversielaag", async () => {
    await repo.writeSettings(db, U, {
      ftp: 275,
      lthr: 178,
      gewicht: 72,
      doel: "FTP",
      doelStart: new Date(2026, 0, 5),
      pendelDuurMin: 80,
      pendelAantal: 2,
    });
    const s = await repo.readSettings(db, U);
    expect(s?.ftp).toBe(275);
    expect(s?.lthr).toBe(178);
    expect(s?.doel).toBe("FTP");
    expect(s?.doelStart instanceof Date).toBe(true);
    expect(s?.doelStart?.getFullYear()).toBe(2026);
    expect(s?.doelStart?.getMonth()).toBe(0);
    expect(s?.doelStart?.getDate()).toBe(5);
  });

  it("checkin write→read", async () => {
    await repo.writeCheckin(db, U, "2026-06-10", {
      slaap: "goed",
      benen: "fris",
      stress: "laag",
    });
    expect(await repo.readCheckin(db, U, "2026-06-10")).toEqual({
      slaap: "goed",
      benen: "fris",
      stress: "laag",
    });
    expect(await repo.readCheckin(db, U, "2099-01-01")).toBeNull();
  });

  it("weekplan write→read (JSON-blob per week)", async () => {
    const entries = [
      {
        datum: "2026-06-08",
        workoutType: "threshold",
        archetypeId: "threshold_long",
      },
      { datum: "2026-06-10", workoutType: "vo2max", archetypeId: "vo2_long" },
    ];
    await repo.writeWeekplan(db, U, "2026-06-08", entries);
    expect(await repo.readWeekplan(db, U, "2026-06-08")).toEqual(entries);
    expect(await repo.readWeekplan(db, U, "2000-01-03")).toBeNull();
  });
});

describe("engine als oracle — D1-round-trip verandert engine-semantiek niet", () => {
  it("readiness: check-in via D1 geeft identieke getReadinessScore_-output als de fixture", async () => {
    const fs = { form: 2, ctl: 50, atl: 45, ramp: 3 };
    const wellness = {
      hrvDeficit: 0,
      hrvRecent: 50,
      sleepAvg3: 7,
      sleepLastNight: 7,
    };
    const checkin = { slaap: "goed", benen: "fris", stress: "laag" };
    const direct = getReadinessScore_(fs, wellness, [], checkin);
    await repo.writeCheckin(db, U, "2026-06-11", checkin);
    const viaD1 = getReadinessScore_(
      fs,
      wellness,
      [],
      await repo.readCheckin(db, U, "2026-06-11"),
    );
    expect(viaD1).toEqual(direct);
  });

  it("recency: readRecentWeekplans → gatherWeekplanEntries_/recencyFromWeekplan_ identiek aan in-memory fixture", async () => {
    // Analoog aan SelfTest testGatherWeekplanEntries_: week 0 + week -1, gat ertussen.
    const base = new Date(2026, 5, 8); // ma 8 jun 2026
    const wk0 = [
      { datum: "2026-06-08", workoutType: "vo2max", archetypeId: "vo2_long" },
    ];
    const wk1 = [
      {
        datum: "2026-06-01",
        workoutType: "threshold",
        archetypeId: "threshold_long",
      },
      {
        datum: "2026-06-03",
        workoutType: "sweet_spot",
        archetypeId: "sweetspot_long",
      },
    ];
    await repo.writeWeekplan(db, U, "2026-06-08", wk0);
    await repo.writeWeekplan(db, U, "2026-06-01", wk1);

    const store: Record<string, any[]> = {
      "weekplan_2026-06-08": wk0,
      "weekplan_2026-06-01": wk1,
    };
    const inMem = gatherWeekplanEntries_(
      8,
      base,
      (k: string) => store[k] ?? null,
    );
    const viaD1 = await repo.readRecentWeekplans(db, U, base, 8);

    expect(viaD1).toEqual(inMem);
    expect(recencyFromWeekplan_(viaD1, null)).toEqual(
      recencyFromWeekplan_(inMem, null),
    );
  });
});

describe("upsert-idempotentie (mergeById_-equivalent in D1)", () => {
  it("zelfde activity_id_ext 2× → 1 rij (laatste wint); 2 activiteiten/dag → 2 rijen", async () => {
    const a1 = activityToRow_({
      id: "actX",
      start_date_local: "2026-06-10T07:00:00",
      type: "Ride",
      name: "Ochtend",
      moving_time: 3600,
      icu_training_load: 85,
    });
    const a1b = activityToRow_({
      id: "actX",
      start_date_local: "2026-06-10T07:00:00",
      type: "Ride",
      name: "Ochtend-updated",
      moving_time: 3600,
      icu_training_load: 90,
    });
    await repo.upsertActivity(db, U, a1);
    await repo.upsertActivity(db, U, a1b);

    let all = await repo.readActivities(db, U);
    const xs = all.filter((r) => r[16] === "actX");
    expect(xs.length).toBe(1); // idempotent op activity_id_ext
    expect(xs[0]?.[2]).toBe("Ochtend-updated"); // laatste wint
    expect(xs[0]?.[8]).toBe(90);

    // Tweede, andere activiteit dezelfde dag → naast elkaar (multi-sessie).
    const b = activityToRow_({
      id: "actY",
      start_date_local: "2026-06-10T18:00:00",
      type: "Ride",
      name: "Avond",
      moving_time: 2400,
      icu_training_load: 45,
    });
    await repo.upsertActivity(db, U, b);

    all = await repo.readActivities(db, U);
    const sameDay = all.filter((r) => r[16] === "actX" || r[16] === "actY");
    expect(sameDay.length).toBe(2);
  });
});
