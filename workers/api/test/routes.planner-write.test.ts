import { env, SELF } from "cloudflare:test";
import type { PlannerDay } from "@cadans/shared";
import { and, eq, gte, lte } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { plannerDays, users } from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
const MON = "2026-07-06"; // maandag
const SUN = "2026-07-12"; // zondag

function put(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`https://cadans.test${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
function get(path: string): Promise<Response> {
  return SELF.fetch(`https://cadans.test${path}`);
}

// 7 dagen ma-zo; 3 train (di/do/za) zoals de GAS-default, rest uit.
function weekDays() {
  const dates = [
    MON,
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10",
    "2026-07-11",
    SUN,
  ];
  const min = [0, 150, 0, 90, 0, 120, 0];
  const type = ["", "pendel", "", "vrij", "", "weekend", ""];
  return dates.map((datum, i) => {
    const train = i === 1 || i === 3 || i === 5;
    return {
      datum,
      train,
      minuten: train ? min[i] : null,
      dagtype: train ? type[i] : null,
      toelichting: train ? "note" : null,
    };
  });
}

async function weekRows() {
  return db
    .select()
    .from(plannerDays)
    .where(
      and(
        eq(plannerDays.userId, U),
        gte(plannerDays.datum, MON),
        lte(plannerDays.datum, SUN),
      ),
    );
}

beforeEach(async () => {
  await db.delete(plannerDays).where(eq(plannerDays.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("PUT /api/planner/:monday (weekplanner write)", () => {
  it("(a) 7 rijen geschreven voor de week", async () => {
    const r = await put(`/api/planner/${MON}`, { days: weekDays() });
    expect(r.status).toBe(200);
    expect((await weekRows()).length).toBe(7);
  });

  it("(b) idempotent — tweede PUT zelfde monday → nog steeds 7 rijen", async () => {
    await put(`/api/planner/${MON}`, { days: weekDays() });
    await put(`/api/planner/${MON}`, { days: weekDays() });
    expect((await weekRows()).length).toBe(7);
  });

  it("(c) na save: voorgesteldType null + gedaan 0 (nooit output cachen)", async () => {
    await put(`/api/planner/${MON}`, { days: weekDays() });
    for (const row of await weekRows()) {
      expect(row.voorgesteldType).toBeNull();
      expect(row.gedaan).toBe(0);
    }
  });

  it("(d) invoervelden round-trippen via de bestaande GET", async () => {
    await put(`/api/planner/${MON}`, { days: weekDays() });
    const g = await get(`/api/planner/${MON}`);
    expect(g.status).toBe(200);
    const days = (await g.json()) as PlannerDay[];
    expect(days.length).toBe(7);
    const di = days.find((d) => d.datum === "2026-07-07"); // dinsdag: train pendel 150
    expect(di?.train).toBe(true);
    expect(di?.minuten).toBe(150);
    expect(di?.dagtype).toBe("pendel");
    expect(di?.toelichting).toBe("note");
    const ma = days.find((d) => d.datum === MON); // maandag: geen train → nulls
    expect(ma?.train).toBe(false);
    expect(ma?.minuten).toBeNull();
    expect(ma?.dagtype).toBeNull();
  });

  it("ongeldige monday → 400; days geen array → 400", async () => {
    const bad = await put("/api/planner/2026-13-99", { days: weekDays() });
    expect(bad.status).toBe(400);
    const notArr = await put(`/api/planner/${MON}`, { days: "x" });
    expect(notArr.status).toBe(400);
  });
});
