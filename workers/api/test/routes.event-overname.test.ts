import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { syncState, users } from "../src/db/schema";

// ROADMAP punt 9 fase B — de persistentie van het overname-antwoord.
// Spec: docs/EVENT-OVERNAME-BOUWDOC.md §5 en §6.
//
// ELKE 400 WORDT AAN DE SCHRIJFKANT GETOETST, niet alleen op de statuscode. Een route die netjes
// 400 antwoordt en tóch wegschrijft komt anders groen door — dat is precies het gat dat een
// status-only assertie openlaat.

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;

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
const put = (path: string, body: unknown) =>
  call(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const LEEG = { event: null, blok: null, antwoord: null };
const AGR = { event: "2027-04-17", blok: "2027-02-22", antwoord: "ja" };

beforeEach(async () => {
  await db.delete(syncState).where(eq(syncState.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("GET/PUT /api/event-overname", () => {
  it("(a) verse staat → drie nullen", async () => {
    const r = await call("/api/event-overname");
    expect(r.status).toBe(200);
    expect(r.body).toEqual(LEEG);
    expect(await repo.readEventOvername(db, U)).toEqual(LEEG);
  });

  it("(b) PUT schrijft, GET leest exact terug, tweede PUT overschrijft", async () => {
    expect((await put("/api/event-overname", AGR)).status).toBe(200);
    expect((await call("/api/event-overname")).body).toEqual(AGR);

    // "nee" op een volgende blokgrens: zelfde event, andere blokstart, ander antwoord.
    const NEE = {
      event: "2027-04-17",
      blok: "2027-03-08",
      antwoord: "nee",
    };
    expect((await put("/api/event-overname", NEE)).status).toBe(200);
    expect((await call("/api/event-overname")).body).toEqual(NEE);
  });

  it("(c) alle drie null wist de waarden zonder te falen", async () => {
    await put("/api/event-overname", AGR);
    expect((await put("/api/event-overname", LEEG)).status).toBe(200);
    expect((await call("/api/event-overname")).body).toEqual(LEEG);
    expect(await repo.readEventOvername(db, U)).toEqual(LEEG);
  });
});

describe("(d) elke afwijzingsgrond apart — 400 ÉN niets weggeschreven", () => {
  // Startwaarde die overeind moet blijven: als een afgewezen PUT tóch schrijft, is dit de
  // waarde die verandert.
  const START = {
    event: "2027-04-17",
    blok: "2027-02-22",
    antwoord: "nee",
  };

  const AFWIJZINGEN: [string, Record<string, unknown>][] = [
    ["ongeldige event-datum", { ...AGR, event: "17-04-2027" }],
    ["ongeldige blok-datum", { ...AGR, blok: "2027-02-30x" }],
    ["antwoord JA (hoofdletters)", { ...AGR, antwoord: "JA" }],
    ["antwoord misschien", { ...AGR, antwoord: "misschien" }],
    ["antwoord lege string", { ...AGR, antwoord: "" }],
    ["antwoord getal 3", { ...AGR, antwoord: 3 }],
  ];

  for (const [naam, body] of AFWIJZINGEN) {
    it(`${naam} → 400 en de opgeslagen waarde is ONGEWIJZIGD`, async () => {
      await put("/api/event-overname", START);
      const r = await put("/api/event-overname", body);
      expect(r.status).toBe(400);
      // DE DRAGENDE HELFT: terugLEZEN, niet alleen de statuscode.
      expect(await repo.readEventOvername(db, U)).toEqual(START);
      expect((await call("/api/event-overname")).body).toEqual(START);
    });
  }
});

describe("(e) de upsert raakt ALLEEN zijn eigen drie kolommen", () => {
  it("dosis-trede en fatigue-shift overleven een PUT op event-overname", async () => {
    await repo.writeDosisTrede(db, U, 2, "2027-02-22", "FTP");
    await repo.writeFatigueShift(db, U, "2027-02-22", "down");

    expect((await put("/api/event-overname", AGR)).status).toBe(200);

    expect(await repo.readEventOvername(db, U)).toEqual(AGR);
    expect(await repo.readDosisTrede(db, U)).toEqual({
      trede: 2,
      blok: "2027-02-22",
      doel: "FTP",
    });
    expect(await repo.readFatigueShift(db, U)).toEqual({
      monday: "2027-02-22",
      dir: "down",
    });
  });

  it("andersom ook: een dosis-trede-schrijfactie laat het overname-antwoord staan", async () => {
    await put("/api/event-overname", AGR);
    await repo.writeDosisTrede(db, U, 1, "2027-03-08", "FTP");
    expect(await repo.readEventOvername(db, U)).toEqual(AGR);
  });
});
