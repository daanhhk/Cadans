import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import { activities, users } from "../src/db/schema";
import { MAX_PER_RONDE, vulRitPieken } from "../src/integrations/ritpiek";

const db = makeDb(env.DB);
const U = CURRENT_USER_ID;
const NU = new Date("2026-08-25T09:00:00Z");

// Een omgeving met een sleutel-NAAM; de waarde is een testverzinsel en raakt niets buiten dit
// bestand. Zonder sleutel doet `vulRitPieken` per ontwerp niets — dat is de laatste toets hieronder.
const ENV = { INTERVALS_API_KEY: "test-key" } as never;

const kromme = (w: number) => ({
  secs: [60, 300, 1200, 3600],
  values: [500, 400, w, 210],
});

/** Een nep-fetch die per activiteit-id een antwoord teruggeeft, en telt wat er gevraagd is. */
function nepFetch(
  perId: Record<string, { status?: number; body?: unknown; gooi?: boolean }>,
) {
  const gevraagd: string[] = [];
  const f = (async (url: string) => {
    const m = /\/activity\/([^/]+)\/power-curve/.exec(String(url));
    const id = m?.[1] ?? "?";
    gevraagd.push(id);
    const a = perId[id] ?? { status: 200, body: kromme(300) };
    if (a.gooi) throw new TypeError("network down");
    const status = a.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (a.body === undefined)
          throw new SyntaxError("Unexpected end of JSON");
        return a.body;
      },
    } as Response;
  }) as never;
  return { f, gevraagd };
}

async function zetRit(id: string, datum: string, type = "Ride") {
  await db.insert(activities).values({
    userId: U,
    datum,
    type,
    naam: `rit ${id}`,
    duurMin: 90,
    activityIdExt: id,
  });
}

const lees = async (id: string) => {
  const r = await db
    .select({
      piek: activities.piek1200W,
      op: activities.piekGehaaldOp,
    })
    .from(activities)
    .where(eq(activities.activityIdExt, id));
  return r[0];
};

beforeEach(async () => {
  await db.delete(activities).where(eq(activities.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
});

describe("vulRitPieken — de wachtrij", () => {
  it("vult de waarde en stempelt de datum", async () => {
    await zetRit("a", "2026-08-24T10:00:00");
    const { f } = nepFetch({ a: { body: kromme(310) } });
    const r = await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(r).toEqual({ opgehaald: 1, gevuld: 1 });
    expect(await lees("a")).toEqual({ piek: 310, op: "2026-08-25" });
  });

  it("neemt NIEUWSTE EERST en houdt zich aan de bovengrens", async () => {
    for (let i = 0; i < MAX_PER_RONDE + 3; i++) {
      await zetRit(
        `r${i}`,
        `2026-08-${String(10 + i).padStart(2, "0")}T10:00:00`,
      );
    }
    const { f, gevraagd } = nepFetch({});
    await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(gevraagd).toHaveLength(MAX_PER_RONDE);
    // r7 is de nieuwste van de acht; r0 t/m r2 blijven liggen voor een volgende ronde
    expect(gevraagd[0]).toBe("r7");
    expect(gevraagd).not.toContain("r0");
  });

  it("slaat alles over dat geen fiets-rit is", async () => {
    await zetRit("loop", "2026-08-24T10:00:00", "Run");
    const { f, gevraagd } = nepFetch({});
    await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(gevraagd).toHaveLength(0);
  });

  it("haalt een rit die al gestempeld is niet nog eens op", async () => {
    await zetRit("a", "2026-08-24T10:00:00");
    const { f } = nepFetch({});
    await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    const tweede = nepFetch({});
    await vulRitPieken(db, ENV, U, { fetchImpl: tweede.f, now: NU });
    expect(tweede.gevraagd).toHaveLength(0);
  });

  it("doet niets zonder sleutel", async () => {
    await zetRit("a", "2026-08-24T10:00:00");
    const { f, gevraagd } = nepFetch({});
    const r = await vulRitPieken(db, {} as never, U, {
      fetchImpl: f,
      now: NU,
    });
    expect(r).toEqual({ opgehaald: 0, gevuld: 0 });
    expect(gevraagd).toHaveLength(0);
  });
});

// ── DE DRIE FAALPADEN ────────────────────────────────────────────────────────────────────────
// Alle drie zijn bevindingen van de weerleggingspas die op nameting standhielden. De eerste versie
// kende alleen "gelukt" en "mislukt", en dat is te grof: bij een 429 moet de rit terugkomen, bij een
// rit die op intervals verwijderd is juist NIET — anders blijft die het venster van vijf bezetten en
// wordt er nooit meer een piek gevuld.
describe("vulRitPieken — de faalpaden", () => {
  it("een 404 is DEFINITIEF: geen waarde, wel een stempel, en hij komt niet terug", async () => {
    await zetRit("weg", "2026-08-24T10:00:00");
    const { f } = nepFetch({ weg: { status: 404 } });
    const r = await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(r).toEqual({ opgehaald: 0, gevuld: 0 });
    expect(await lees("weg")).toEqual({ piek: null, op: "2026-08-25" });

    const tweede = nepFetch({ weg: { status: 404 } });
    await vulRitPieken(db, ENV, U, { fetchImpl: tweede.f, now: NU });
    expect(tweede.gevraagd).toHaveLength(0); // uit de wachtrij
  });

  it("een 429 is TIJDELIJK: geen stempel, en hij komt wél terug", async () => {
    await zetRit("druk", "2026-08-24T10:00:00");
    const { f } = nepFetch({ druk: { status: 429 } });
    await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(await lees("druk")).toEqual({ piek: null, op: null });

    const tweede = nepFetch({ druk: { body: kromme(280) } });
    await vulRitPieken(db, ENV, U, { fetchImpl: tweede.f, now: NU });
    expect(tweede.gevraagd).toEqual(["druk"]);
    expect(await lees("druk")).toEqual({ piek: 280, op: "2026-08-25" });
  });

  it("een netwerkfout is TIJDELIJK en laat de ronde NIET klappen", async () => {
    await zetRit("stuk", "2026-08-24T10:00:00");
    const { f } = nepFetch({ stuk: { gooi: true } });
    await expect(
      vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU }),
    ).resolves.toEqual({ opgehaald: 0, gevuld: 0 });
    expect(await lees("stuk")).toEqual({ piek: null, op: null });
  });

  // DE BEVINDING IN HAAR SCHERPSTE VORM: één kapotte body mocht niet de HELE ronde meesleuren.
  it("een 2xx met een onleesbare body sloopt de ronde niet en blokkeert de rij niet", async () => {
    await zetRit("kapot", "2026-08-24T12:00:00");
    await zetRit("goed", "2026-08-24T10:00:00"); // ouder, dus NA 'kapot' aan de beurt
    const { f } = nepFetch({
      kapot: { body: undefined }, // json() verwerpt
      goed: { body: kromme(300) },
    });
    const r = await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    // de tweede rit is gewoon afgehandeld
    expect(r.gevuld).toBe(1);
    expect(await lees("goed")).toEqual({ piek: 300, op: "2026-08-25" });
    // en de kapotte is gestempeld zonder waarde, dus weg uit de wachtrij
    expect(await lees("kapot")).toEqual({ piek: null, op: "2026-08-25" });
  });

  // Een kromme ZONDER het duurpunt 1200 is een geldig antwoord: hij levert geen waarde op, maar de
  // rit is wél afgehandeld en hoort niet elke ronde opnieuw bevraagd te worden.
  it("een kromme zonder het duurpunt levert geen waarde maar wel een stempel", async () => {
    await zetRit("kort", "2026-08-24T10:00:00");
    const { f } = nepFetch({
      kort: { body: { secs: [60, 300, 600], values: [500, 400, 330] } },
    });
    const r = await vulRitPieken(db, ENV, U, { fetchImpl: f, now: NU });
    expect(r).toEqual({ opgehaald: 1, gevuld: 0 });
    expect(await lees("kort")).toEqual({ piek: null, op: "2026-08-25" });
  });
});
