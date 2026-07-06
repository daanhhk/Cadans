import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { events, plannerDays, users } from "../src/db/schema";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID; // 1
const U2 = 2;
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

// Schone lei per test; users 1 én 2 (FK user_id → users.id voor de U2-rijen).
beforeEach(async () => {
  await db.delete(plannerDays).where(eq(plannerDays.userId, U));
  await db.delete(plannerDays).where(eq(plannerDays.userId, U2));
  await db.delete(events).where(eq(events.userId, U));
  await db.delete(events).where(eq(events.userId, U2));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
  await db
    .insert(users)
    .values({ id: U2, email: "other@example.com" })
    .onConflictDoNothing();
});

describe("Fase 5.3b — planner_days + events D1-reads", () => {
  it("/api/planner/:monday → in-week user_id=1, camelCase + boolean-mapping", async () => {
    // Doelweek: maandag 2026-03-09 .. zondag 2026-03-15.
    const week = [
      {
        datum: "2026-03-09",
        train: 1,
        dag: "ma",
        minuten: 60,
        dagtype: "vrij",
        voorgesteldType: "sweet_spot",
        gedaan: 1,
      },
      {
        datum: "2026-03-10",
        train: 0,
        dag: "di",
        minuten: null,
        dagtype: null,
        voorgesteldType: null,
        gedaan: 0,
      },
      {
        datum: "2026-03-11",
        train: 1,
        dag: "wo",
        minuten: 90,
        dagtype: "pendel",
        voorgesteldType: "pendel_z2",
        gedaan: null,
      },
      {
        datum: "2026-03-12",
        train: 1,
        dag: "do",
        minuten: 75,
        dagtype: "vrij",
        voorgesteldType: "vo2max",
        gedaan: 0,
      },
      {
        datum: "2026-03-13",
        train: 1,
        dag: "vr",
        minuten: 60,
        dagtype: "vrij",
        voorgesteldType: "threshold",
        gedaan: 0,
      },
      {
        datum: "2026-03-14",
        train: 1,
        dag: "za",
        minuten: 120,
        dagtype: "weekend",
        voorgesteldType: "long_z2",
        gedaan: 0,
      },
      {
        datum: "2026-03-15",
        train: 0,
        dag: "zo",
        minuten: null,
        dagtype: "recovery",
        voorgesteldType: null,
        gedaan: 0,
      },
    ];
    for (const d of week) {
      await db.insert(plannerDays).values({ userId: U, ...d });
    }
    // Buiten de week (maandag−1) + andere user → uitgesloten.
    await db
      .insert(plannerDays)
      .values({ userId: U, datum: "2026-03-08", train: 1, gedaan: 1 });
    await db
      .insert(plannerDays)
      .values({ userId: U2, datum: "2026-03-10", train: 1, gedaan: 1 });

    const { status, body } = await get("/api/planner/2026-03-09");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(7);
    // datum-asc + rauwe yyyy-MM-dd-string.
    expect(body.map((r: any) => r.datum)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
    // boolean-mapping: 1→true, 0→false, null→false.
    expect(body[0].train).toBe(true);
    expect(body[0].gedaan).toBe(true);
    expect(body[1].train).toBe(false);
    expect(body[2].gedaan).toBe(false);
    // camelCase + NULL-velden behouden.
    expect(body[0].voorgesteldType).toBe("sweet_spot");
    expect(body[1].minuten).toBeNull();
    expect(body[1].voorgesteldType).toBeNull();
    // 2026-03-08 (buiten week) + user_id=2 uitgesloten.
    expect(body.some((r: any) => r.datum === "2026-03-08")).toBe(false);
  });

  it("/api/planner/:monday → lege week → [] + 200 (geen 404)", async () => {
    const { status, body } = await get("/api/planner/2026-06-01");
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("/api/planner/:monday → ongeldige datum → 400 ApiError", async () => {
    const { status, body } = await get("/api/planner/2026-13-99");
    expect(status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("/api/events → alleen user_id=1, camelCase-mapping, nulls behouden", async () => {
    await db.insert(events).values({
      userId: U,
      datum: "2026-05-01",
      naam: "Girona trip",
      type: "trip",
      prioriteit: "A",
      afstandKm: 120.5,
      hoogtemeters: 2400,
      klimType: "lang",
      notitie: "hoofddoel",
    });
    await db.insert(events).values({
      userId: U,
      datum: "2026-04-15",
      naam: null,
      type: null,
      prioriteit: "B",
      afstandKm: null,
      hoogtemeters: null,
      klimType: null,
      notitie: null,
    });
    await db.insert(events).values({
      userId: U2,
      datum: "2026-05-10",
      naam: "andere user",
      type: "race",
      prioriteit: "A",
    });

    const { status, body } = await get("/api/events");
    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    // datum-asc.
    expect(body.map((r: any) => r.datum)).toEqual(["2026-04-15", "2026-05-01"]);
    const girona = body.find((r: any) => r.datum === "2026-05-01");
    expect(girona.klimType).toBe("lang");
    expect(girona.afstandKm).toBe(120.5);
    expect(girona.prioriteit).toBe("A");
    const nulls = body.find((r: any) => r.datum === "2026-04-15");
    expect(nulls.naam).toBeNull();
    expect(nulls.klimType).toBeNull();
    expect(nulls.afstandKm).toBeNull();
  });
});
