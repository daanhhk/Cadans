import { describe, expect, it } from "vitest";
import { collectPushDays, pushGuard, type SchemaDay } from "./schema";

// FASE-C C3 — de PUSH-dag-selectie + de FTP-guard (pure logica; de React-component gebruikt ze).

const sess = (naam: string): any => ({
  naam,
  focus: null,
  zones: ["low"],
  totaalMin: 60,
  tss: 70,
  structuur: [],
  blokken: [],
  eindopmerking: null,
});

// PENDEL-FIX (docs/PENDEL-RECON.md §5 en §7 punt 3) — DEZE TESTS ENCODEERDEN DE OUDE REGEL en zijn
// bewust HERIJKT, niet verzwakt. Vóór de fix filterde `collectPushDays` op
// `(today || planned) && sessions.length > 0`, waardoor een DONE dag altijd afviel. Op een
// pendeldag met één gereden rit is dat fout: de dag is done én draagt nog een open terugrit.
// De nieuwe regel filtert op `openSessions`, en "done" staat er nu bij. Wat NIET verandert: een
// done dag ZONDER open sessies valt nog steeds af, en een gemiste dag blijft afvallen — die
// state-lijst staat er expliciet zodat "Niet gedaan?" niet alsnog gaat pushen.
const day = (
  datum: string,
  state: SchemaDay["state"],
  sessions: any[] = [],
  openSessions: any[] = sessions,
): SchemaDay =>
  ({
    datum,
    dagIdx: 0,
    weekday: "ma",
    dayNum: 1,
    state,
    isToday: false,
    voorgesteldType: null,
    reden: null,
    redenCode: null,
    sessions,
    planSessions: sessions,
    openSessions,
    doneTss: 0,
    done: null,
    doneCompare: null,
    dispositie: null,
    coach: null,
    override: null,
  }) as SchemaDay;

describe("collectPushDays — vooruit + niet-gedaan (incl. vandaag)", () => {
  const TODAY = "2026-07-20";
  const days: SchemaDay[] = [
    day("2026-07-18", "done", []), // verleden, gereden → skip
    day("2026-07-19", "rest", []), // rustdag → skip
    day("2026-07-20", "today", [sess("Vandaag-sessie")]), // vandaag met sessie → push
    day("2026-07-21", "planned", [sess("Morgen-sessie")]), // toekomst planned → push
    day("2026-07-22", "gemist", [sess("Gemist")]), // gemist → skip
    day("2026-07-23", "rest", []), // toekomst rustdag (geen sessies) → skip
  ];

  it("selecteert alleen vandaag + toekomstige planned, met hun sessies", () => {
    const out = collectPushDays(days, TODAY);
    expect(out.map((d) => d.dateISO)).toEqual(["2026-07-20", "2026-07-21"]);
    expect(out.every((d) => d.type === "Ride")).toBe(true);
    expect(out[0]?.sessions[0]?.naam).toBe("Vandaag-sessie");
    expect(out[1]?.sessions[0]?.naam).toBe("Morgen-sessie");
  });

  it("rest/gemist vallen af, en een planned zonder sessies telt niet mee", () => {
    const out = collectPushDays(
      [
        day("2026-07-20", "planned", []), // planned zonder sessies → skip
        day("2026-07-21", "gemist", [sess("gedisponeerd")]), // gemist → skip
        day("2026-07-22", "rest", []), // rustdag → skip
      ],
      TODAY,
    );
    expect(out).toEqual([]);
  });

  // HERIJKT: dit was "done met sessies telt niet mee". Dat is precies het gedrag dat verandert.
  it("een DONE dag zonder open sessies valt af — ongewijzigd", () => {
    const out = collectPushDays(
      [day("2026-07-21", "done", [sess("heen"), sess("terug")], [])],
      TODAY,
    );
    expect(out).toEqual([]);
  });

  it("een DONE pendeldag met een OPEN sessie gaat nu WEL mee, en alleen die sessie", () => {
    const out = collectPushDays(
      [
        day(
          "2026-07-21",
          "done",
          [sess("Pendel heen"), sess("Pendel terug")],
          [sess("Pendel terug")],
        ),
      ],
      TODAY,
    );
    expect(out.map((d) => d.dateISO)).toEqual(["2026-07-21"]);
    expect(out[0]?.sessions.map((s) => s.naam)).toEqual(["Pendel terug"]);
  });

  it("een VERSTREKEN done dag met open sessies gaat niet mee — de datumpoort blijft", () => {
    const out = collectPushDays(
      [
        day(
          "2026-07-19",
          "done",
          [sess("heen"), sess("terug")],
          [sess("terug")],
        ),
      ],
      TODAY,
    );
    expect(out).toEqual([]);
  });
});

describe("pushGuard — FTP-poort + geen-dagen", () => {
  it("ftp null → geen push (no-ftp)", () => {
    expect(pushGuard(null, 3)).toEqual({ ok: false, reason: "no-ftp" });
    expect(pushGuard(undefined, 3)).toEqual({ ok: false, reason: "no-ftp" });
  });
  it("ftp gezet maar geen push-dagen → no-days", () => {
    expect(pushGuard(280, 0)).toEqual({ ok: false, reason: "no-days" });
  });
  it("ftp gezet + push-dagen → ok", () => {
    expect(pushGuard(280, 2)).toEqual({ ok: true });
  });
});
