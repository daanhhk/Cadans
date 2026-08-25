import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID, makeDb } from "../src/db/client";
import * as repo from "../src/db/repo";
import { activities, settings, users } from "../src/db/schema";

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

/** Eén fiets-rit met een twintigminutenwaarde en een OPEN antwoord. */
async function zetRit(o: {
  id: string;
  datum: string;
  piek: number | null;
  antwoord?: string | null;
  duurMin?: number;
  naam?: string;
}) {
  await db.insert(activities).values({
    userId: U,
    datum: o.datum,
    type: "Ride",
    naam: o.naam ?? "Testrit",
    duurMin: o.duurMin ?? 90,
    activityIdExt: o.id,
    piek1200W: o.piek,
    piekGehaaldOp: "2026-08-25",
    ftpVoorstelAntwoord: o.antwoord ?? null,
  });
}

beforeEach(async () => {
  await db.delete(activities).where(eq(activities.userId, U));
  await db.delete(settings).where(eq(settings.userId, U));
  await db
    .insert(users)
    .values({ id: U, email: "daan@example.com" })
    .onConflictDoNothing();
  await repo.writeSettings(db, U, { ftp: 280, doel: "FTP" });
});

describe("GET /api/ftp-voorstel — de poorten op de route", () => {
  it("geeft een voorstel bij een rit BOVEN de staande drempel", async () => {
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    const r = await call("/api/ftp-voorstel");
    expect(r.status).toBe(200);
    expect(r.body.voorstel?.activityIdExt).toBe("i310");
    expect(r.body.voorstel?.voorstelFtp).toBe(295); // 0,95 x 310 = 294,5 -> 295
    expect(r.body.voorstel?.staandeFtp).toBe(280);
  });

  // GEMETEN OP DE LOKALE DATABASE, en de eigen toetsen misten het: `activities.datum` draagt een
  // VOLLE tijdstempel. De kaart voert die datum door naar `datumKort_`, dat op een ANKERD patroon
  // matcht en bij een tijdstempel de rauwe string teruggeeft — de renner las dan
  // "Op 2026-08-24T09:12:00, in ...". De unit-toetsen en de 215-fixture dragen kale datums en
  // konden dit per constructie niet zien; dit geval draagt de tijdstempel wél.
  it("levert een KALE datum, ook al draagt de kolom een tijdstempel", async () => {
    await zetRit({ id: "i310", datum: "2026-08-24T09:12:00", piek: 310 });
    const v = (await call("/api/ftp-voorstel")).body.voorstel;
    expect(v?.datum).toBe("2026-08-24");
  });

  // Het Z2-geval: 195 W geeft 185 W tegen een staande 280. M94 laat alleen OMHOOG toe.
  it("geeft NIETS bij een rit eronder (M94)", async () => {
    await zetRit({ id: "i195", datum: "2026-08-24T10:00:00", piek: 195 });
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  // DE SEED van migratie 0014: alles wat er bij de migratie al stond is beantwoord en komt dus niet
  // meer terug. Dat is het STARTPUNT, en dit is de toets erop.
  it("geeft NIETS voor een rit die al beantwoord is (de seed)", async () => {
    await zetRit({
      id: "i310",
      datum: "2026-08-24T10:00:00",
      piek: 310,
      antwoord: "geseed",
    });
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  it("geeft NIETS zonder waarde op het duurpunt", async () => {
    await zetRit({ id: "ileeg", datum: "2026-08-24T10:00:00", piek: null });
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  it("geeft NIETS onder een ander doel", async () => {
    await repo.writeSettings(db, U, { ftp: 280, doel: "Conditie" });
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  // GEMETEN VAL: `settings.ftp` is nullable en in JavaScript is `295 > null` WAAR. Zonder de
  // expliciete poort zou elke rit een voorstel opleveren zodra het veld leeg is.
  it("geeft NIETS als er geen staande drempelwaarde is", async () => {
    await repo.writeSettings(db, U, { doel: "FTP" }); // ftp -> null
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  it("kiest bij twee ritten op een dag de HOOGSTE piek, niet de langste", async () => {
    await zetRit({
      id: "ilang",
      datum: "2026-08-24T08:00:00",
      piek: 300,
      duurMin: 180,
      naam: "Pendel",
    });
    await zetRit({
      id: "ihard",
      datum: "2026-08-24T17:00:00",
      piek: 310,
      duurMin: 60,
      naam: "Intervallen",
    });
    const v = (await call("/api/ftp-voorstel")).body.voorstel;
    expect(v?.activityIdExt).toBe("ihard");
    expect(v?.naam).toBe("Intervallen");
  });
});

describe("PUT /api/ftp-voorstel — goedkeuren en afwijzen", () => {
  it("GOEDKEUREN schrijft settings.ftp en markeert de rit", async () => {
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    const r = await put("/api/ftp-voorstel", {
      activityIdExt: "i310",
      antwoord: "goedgekeurd",
    });
    expect(r.status).toBe(200);
    expect((await repo.readSettings(db, U))?.ftp).toBe(295);
    // en het voorstel komt niet terug
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  // De buren blijven staan: dit gebruikt NIET `writeSettings` (die is full-replace en zou vijftien
  // velden wissen — ROADMAP punt 73) maar een partieel pad in de vorm van `writeIjking`.
  it("GOEDKEUREN wist geen enkel ander settings-veld", async () => {
    await repo.writeSettings(db, U, {
      ftp: 280,
      doel: "FTP",
      lthr: 178,
      gewicht: 75,
      weekUren: 7,
    });
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    await put("/api/ftp-voorstel", {
      activityIdExt: "i310",
      antwoord: "goedgekeurd",
    });
    const s = await repo.readSettings(db, U);
    expect(s?.ftp).toBe(295);
    expect(s?.lthr).toBe(178);
    expect(s?.gewicht).toBe(75);
    expect(s?.weekUren).toBe(7);
    expect(s?.doel).toBe("FTP");
  });

  it("AFWIJZEN laat de drempelwaarde staan en laat het voorstel niet terugkomen", async () => {
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    const r = await put("/api/ftp-voorstel", {
      activityIdExt: "i310",
      antwoord: "afgewezen",
    });
    expect(r.status).toBe(200);
    expect((await repo.readSettings(db, U))?.ftp).toBe(280); // ongewijzigd
    expect((await call("/api/ftp-voorstel")).body.voorstel).toBeNull();
  });

  // De WAARDE komt niet uit de body: de route leidt hem opnieuw af uit M93. Een client kan dus geen
  // willekeurige drempelwaarde wegschrijven, en goedkeuren van een rit die géén voorstel draagt
  // wordt geweigerd in plaats van stil iets te zetten.
  it("weigert goedkeuren van een rit die geen voorstel draagt (409)", async () => {
    await zetRit({ id: "i195", datum: "2026-08-24T10:00:00", piek: 195 });
    const r = await put("/api/ftp-voorstel", {
      activityIdExt: "i195",
      antwoord: "goedgekeurd",
    });
    expect(r.status).toBe(409);
    expect((await repo.readSettings(db, U))?.ftp).toBe(280); // niets weggeschreven
  });

  it("400 op een onbekend antwoord, en er is NIETS weggeschreven", async () => {
    await zetRit({ id: "i310", datum: "2026-08-24T10:00:00", piek: 310 });
    const r = await put("/api/ftp-voorstel", {
      activityIdExt: "i310",
      antwoord: "misschien",
    });
    expect(r.status).toBe(400);
    expect((await repo.readSettings(db, U))?.ftp).toBe(280);
    expect((await call("/api/ftp-voorstel")).body.voorstel).not.toBeNull();
  });

  it("400 op een lege activityIdExt", async () => {
    const r = await put("/api/ftp-voorstel", {
      activityIdExt: "",
      antwoord: "goedgekeurd",
    });
    expect(r.status).toBe(400);
  });
});
