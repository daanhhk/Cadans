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

const day = (
  datum: string,
  state: SchemaDay["state"],
  sessions: any[] = [],
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

  it("done/rest/gemist vallen af; een planned zonder sessies telt niet mee", () => {
    const out = collectPushDays(
      [
        day("2026-07-20", "planned", []), // planned zonder sessies → skip
        day("2026-07-21", "done", [sess("x")]),
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
