import { env, fetchMock, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { settings, users } from "../src/db/schema";
import type { FetchImpl, IntervalsEnv } from "../src/integrations/intervals";
import {
  buildEventPayload,
  pushEvents_,
  pushWorkouts,
} from "../src/integrations/push";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
const ORIGIN = "https://intervals.icu";

const testEnv: IntervalsEnv = {
  DB: env.DB,
  INTERVALS_API_KEY: "test-key",
  INTERVALS_ATHLETE_ID: "i12345",
};

// ZWO-valide workout (warmup-ramp + interval + cooldown-ramp).
const W_ZWO: any = {
  naam: "Drempel 3×10",
  focus: "threshold",
  totaalMin: 60,
  tss: 80,
  eindopmerking: "Pacen als een col.",
  structuur: [
    ["Warmup", "12 min", "138-186W", "<153", "Inrijden, opbouwend"],
    ["Drempel", "3x 10 min", "245-270W", "165-172", "5 min rust @ 55%"],
    ["Cooldown", "8 min", "124-152W", "—", "Easy uit"],
  ],
};
// ZWO/DSL falen (lege watt-range) → description-fallback.
const W_FALLBACK: any = {
  naam: "Los blok",
  totaalMin: 40,
  tss: 50,
  structuur: [["Blok", "10 min", "", "", ""]],
};

function mockReply(status: number, body: unknown): FetchImpl {
  return (async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as FetchImpl;
}

describe("buildEventPayload (byte-faithful IntervalsApi.gs)", () => {
  it("ZWO-primary: filename + file_contents_base64, GEEN description; external_id coach_<datum>_ride", () => {
    const p = buildEventPayload(W_ZWO, "2026-07-20", "Ride", 1, 1, 250);
    expect(p.category).toBe("WORKOUT");
    expect(p.external_id).toBe("coach_2026-07-20_ride");
    expect(p.name).toBe("🚴 Coach: Drempel 3×10");
    expect(p.start_date_local).toBe("2026-07-20T07:00:00");
    expect(p.filename).toBe("Drempel_3_10.zwo");
    expect(typeof p.file_contents_base64).toBe("string");
    expect(p.file_contents_base64.length).toBeGreaterThan(0);
    expect(p.description).toBeUndefined();
  });

  it("sessie 2/2: _s2-suffix, uur 17, (sessie 2/2) in de naam", () => {
    const p = buildEventPayload(W_ZWO, "2026-07-20", "Ride", 2, 2, 250);
    expect(p.external_id).toBe("coach_2026-07-20_ride_s2");
    expect(p.start_date_local).toBe("2026-07-20T17:00:00");
    expect(p.name).toBe("🚴 Coach: Drempel 3×10 (sessie 2/2)");
  });

  it("fallback: geen ZWO → description + moving_time + target POWER, geen file_contents_base64", () => {
    const p = buildEventPayload(W_FALLBACK, "2026-07-20", "Ride", 1, 1, 250);
    expect(p.file_contents_base64).toBeUndefined();
    expect(typeof p.description).toBe("string");
    expect(p.description).toContain("Los blok");
    expect(p.moving_time).toBe(40 * 60);
    expect(p.target).toBe("POWER");
  });

  it("validatie: geen naam / ongeldige datum → throw", () => {
    expect(() =>
      buildEventPayload({}, "2026-07-20", "Ride", 1, 1, 250),
    ).toThrow();
    expect(() =>
      buildEventPayload(W_ZWO, "20-07-2026", "Ride", 1, 1, 250),
    ).toThrow();
  });
});

describe("pushEvents_ (bulk + error-vertaling, gemockte fetch)", () => {
  it("200 + events-array → returnt de array", async () => {
    const r = await pushEvents_(
      [{ external_id: "x" }],
      testEnv,
      "i12345",
      mockReply(200, [{ id: 1 }, { id: 2 }]),
    );
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(2);
  });
  it("401 → de exacte GAS-401-message", async () => {
    await expect(
      pushEvents_([{ x: 1 }], testEnv, "i12345", mockReply(401, "")),
    ).rejects.toThrow(
      "intervals.icu API error 401 — API key fout of geen toegang tot deze athlete.",
    );
  });
  it("429 → de rate-limit-message", async () => {
    await expect(
      pushEvents_([{ x: 1 }], testEnv, "i12345", mockReply(429, "")),
    ).rejects.toThrow(
      "intervals.icu rate limit (429) — probeer over een paar minuten opnieuw.",
    );
  });
  it("lege events-array → throw", async () => {
    await expect(pushEvents_([], testEnv, "i12345")).rejects.toThrow(
      "pushEvents_: lege of ongeldige events array.",
    );
  });
});

describe("pushWorkouts (orchestratie, gemockte fetch)", () => {
  it("twee dagen, één met 2 sessies → 3 events in ÉÉN bulk-call", async () => {
    let captured: any = null;
    const cap: FetchImpl = (async (_url, init) => {
      captured = JSON.parse(String(init?.body ?? "[]"));
      return new Response(
        JSON.stringify(captured.map((_: any, i: number) => ({ id: i }))),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as FetchImpl;

    const r = await pushWorkouts(
      testEnv,
      [
        { dateISO: "2026-07-20", sessions: [W_ZWO, W_ZWO] },
        { dateISO: "2026-07-21", sessions: [W_ZWO] },
      ],
      250,
      { fetchImpl: cap },
    );
    expect(captured.length).toBe(3);
    expect(r.pushedCount).toBe(3);
    expect(r.skipped).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it("sessie zonder naam → in skipped, niet in de bulk", async () => {
    let captured: any = null;
    const cap: FetchImpl = (async (_url, init) => {
      captured = JSON.parse(String(init?.body ?? "[]"));
      return new Response(JSON.stringify([{ id: 0 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as FetchImpl;

    const r = await pushWorkouts(
      testEnv,
      [{ dateISO: "2026-07-20", sessions: [W_ZWO, { totaalMin: 30 }] }],
      250,
      { fetchImpl: cap },
    );
    expect(captured.length).toBe(1);
    expect(r.pushedCount).toBe(1);
    expect(r.skipped.length).toBe(1);
    expect(r.skipped[0].sessionIndex).toBe(2);
  });

  it("ontbrekende athlete-id → throw (config)", async () => {
    await expect(
      pushWorkouts(
        { DB: env.DB, INTERVALS_API_KEY: "k" } as IntervalsEnv,
        [{ dateISO: "2026-07-20", sessions: [W_ZWO] }],
        250,
      ),
    ).rejects.toThrow(/athlete-id ontbreekt/);
  });
});

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

describe("POST /api/push (route, fetch GEMOCKT)", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });
  afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
  });
  beforeEach(async () => {
    await db.delete(settings).where(eq(settings.userId, U));
    await db
      .insert(users)
      .values({ id: U, email: "daan@example.com" })
      .onConflictDoNothing();
    await db
      .insert(settings)
      .values({ userId: U, ftp: 250 })
      .onConflictDoUpdate({ target: settings.userId, set: { ftp: 250 } });
  });

  it("happy path: één sessie → bulk-POST onderschept → 200 {pushedCount:1}", async () => {
    fetchMock
      .get(ORIGIN)
      .intercept({ path: /\/athlete\/.*\/events\/bulk/, method: "POST" })
      .reply(200, JSON.stringify([{ id: "ev1" }]), {
        headers: { "content-type": "application/json" },
      });
    const r = await call("/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        days: [{ dateISO: "2026-07-20", sessions: [W_ZWO] }],
      }),
    });
    expect(r.status).toBe(200);
    expect(r.body.pushedCount).toBe(1);
    expect(r.body.skipped).toEqual([]);
    expect(r.body.errors).toEqual([]);
  });

  it("days geen array → 400", async () => {
    const r = await call("/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ days: "nope" }),
    });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });
});
