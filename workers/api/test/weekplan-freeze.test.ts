import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { users, weekplans } from "../src/db/schema";
import { mergeFrozenWeekplan } from "../src/weekplanFreeze";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

async function put(
  path: string,
  body: unknown,
): Promise<{ status: number; body: any }> {
  const resp = await SELF.fetch(`https://cadans.test${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let parsed: any = null;
  try {
    parsed = await resp.json();
  } catch {
    parsed = null;
  }
  return { status: resp.status, body: parsed };
}

beforeEach(async () => {
  await db.delete(weekplans).where(eq(weekplans.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

// ── de pure beslissing (snapshotDayAction_-semantiek, GAS SelfTest.gs:748-758) ──
describe("mergeFrozenWeekplan", () => {
  const TODAY = "2026-01-14"; // woensdag

  it("verleden + bestaande entry → FREEZE (de oude entry blijft)", () => {
    const stored = [{ datum: "2026-01-12", naam: "OUD" }];
    const payload = [{ datum: "2026-01-12", naam: "HERBOUWD" }];
    expect(mergeFrozenWeekplan(stored, payload, TODAY)).toEqual([
      { datum: "2026-01-12", naam: "OUD" },
    ]);
  });

  it("verleden ZONDER bestaande entry → de payload-entry (GAS 'rebuild')", () => {
    const payload = [{ datum: "2026-01-12", naam: "NIEUW" }];
    expect(mergeFrozenWeekplan(null, payload, TODAY)).toEqual(payload);
  });

  it("vandaag → altijd vers (nooit bevriezen)", () => {
    const stored = [{ datum: TODAY, naam: "OUD" }];
    const payload = [{ datum: TODAY, naam: "VERS" }];
    expect(mergeFrozenWeekplan(stored, payload, TODAY)).toEqual([
      { datum: TODAY, naam: "VERS" },
    ]);
  });

  it("toekomst → altijd vers", () => {
    const stored = [{ datum: "2026-01-16", naam: "OUD" }];
    const payload = [{ datum: "2026-01-16", naam: "VERS" }];
    expect(mergeFrozenWeekplan(stored, payload, TODAY)).toEqual([
      { datum: "2026-01-16", naam: "VERS" },
    ]);
  });

  it("bevroren dag die de payload NIET noemt blijft behouden", () => {
    // De client stuurt alleen dagen mét sessies; voorbije dagen hebben er geen meer.
    const stored = [{ datum: "2026-01-12", naam: "MAANDAG" }];
    const payload = [{ datum: "2026-01-16", naam: "VRIJDAG" }];
    expect(mergeFrozenWeekplan(stored, payload, TODAY)).toEqual([
      { datum: "2026-01-12", naam: "MAANDAG" },
      { datum: "2026-01-16", naam: "VRIJDAG" },
    ]);
  });

  it("gemengde week: verleden bevroren, vandaag/toekomst vers, chronologisch", () => {
    const stored = [
      { datum: "2026-01-12", naam: "ma-OUD" },
      { datum: "2026-01-13", naam: "di-OUD" },
      { datum: TODAY, naam: "wo-OUD" },
      { datum: "2026-01-15", naam: "do-OUD" },
    ];
    const payload = [
      { datum: "2026-01-13", naam: "di-NIEUW" },
      { datum: TODAY, naam: "wo-NIEUW" },
      { datum: "2026-01-15", naam: "do-NIEUW" },
    ];
    expect(mergeFrozenWeekplan(stored, payload, TODAY)).toEqual([
      { datum: "2026-01-12", naam: "ma-OUD" }, // niet genoemd, verleden → behouden
      { datum: "2026-01-13", naam: "di-OUD" }, // verleden → bevroren
      { datum: TODAY, naam: "wo-NIEUW" }, // vandaag → vers
      { datum: "2026-01-15", naam: "do-NIEUW" }, // toekomst → vers
    ]);
  });

  it("datumloze entry valt niet weg (as-is-contract)", () => {
    const payload = [{ naam: "geen datum" }];
    expect(mergeFrozenWeekplan([], payload, TODAY)).toEqual(payload);
  });
});

// ── de route-integratie ──
describe("PUT /api/weekplan/:monday — freeze-merge", () => {
  const MONDAY = "2026-01-12";
  const TODAY = "2026-01-14";

  it("todayISO meegestuurd → verleden bevroren, vandaag/toekomst overschreven", async () => {
    const eerste = [
      { datum: "2026-01-12", naam: "ma-v1", tss: 60 },
      { datum: "2026-01-14", naam: "wo-v1", tss: 70 },
    ];
    expect(
      (await put(`/api/weekplan/${MONDAY}`, { entries: eerste })).status,
    ).toBe(200);

    // Tweede schrijf: dezelfde dagen, andere inhoud (de reconstructie-van-nu).
    const tweede = [
      { datum: "2026-01-12", naam: "ma-v2", tss: 999 },
      { datum: "2026-01-14", naam: "wo-v2", tss: 80 },
    ];
    const r = await put(`/api/weekplan/${MONDAY}`, {
      entries: tweede,
      todayISO: TODAY,
    });
    expect(r.status).toBe(200);

    const back = await repo.readWeekplan(db, U, MONDAY);
    expect(back).toEqual([
      { datum: "2026-01-12", naam: "ma-v1", tss: 60 }, // BEVROREN
      { datum: "2026-01-14", naam: "wo-v2", tss: 80 }, // vers
    ]);
  });

  it("zonder todayISO → onveranderde full-replace (bestaand gedrag)", async () => {
    await put(`/api/weekplan/${MONDAY}`, {
      entries: [{ datum: "2026-01-12", naam: "ma-v1" }],
    });
    await put(`/api/weekplan/${MONDAY}`, {
      entries: [{ datum: "2026-01-12", naam: "ma-v2" }],
    });
    expect(await repo.readWeekplan(db, U, MONDAY)).toEqual([
      { datum: "2026-01-12", naam: "ma-v2" },
    ]);
  });

  it("ongeldige todayISO → 400", async () => {
    const r = await put(`/api/weekplan/${MONDAY}`, {
      entries: [],
      todayISO: "14-01-2026",
    });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  it("verleden dat de nieuwe payload niet noemt, overleeft de schrijf", async () => {
    await put(`/api/weekplan/${MONDAY}`, {
      entries: [{ datum: "2026-01-12", naam: "ma-gereden" }],
    });
    await put(`/api/weekplan/${MONDAY}`, {
      entries: [{ datum: "2026-01-16", naam: "vr-gepland" }],
      todayISO: TODAY,
    });
    const back = (await repo.readWeekplan(db, U, MONDAY)) as any[];
    expect(back.map((e) => e.datum)).toEqual(["2026-01-12", "2026-01-16"]);
  });
});

// ── de leesguard (repo.ts: per-key try/catch, GAS Algorithm.gs:979) ──
describe("readRecentWeekplans — corrupte rij", () => {
  it("één onparseerbare rij laat de rest van het venster intact", async () => {
    await db.insert(weekplans).values({
      userId: U,
      weekMonday: "2026-01-12",
      entriesJson: "{dit is geen json",
    });
    await db.insert(weekplans).values({
      userId: U,
      weekMonday: "2026-01-05",
      entriesJson: JSON.stringify([{ datum: "2026-01-05", naam: "goed" }]),
    });
    const res = await repo.readRecentWeekplans(db, U, new Date(2026, 0, 12), 8);
    // Vóór de guard gooide JSON.parse en faalde de HELE call.
    expect(res).toEqual([{ datum: "2026-01-05", naam: "goed" }]);
  });
});
