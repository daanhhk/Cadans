import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, describe, expect, it, vi } from "vitest";
import { type ActValuesRow, derivePlannerGedaan } from "./activities";
import { buildWeekProposal } from "./proposal";
import {
  collectPushDays,
  type DoneEntry,
  deriveSchemaView,
  mergeDone,
} from "./schema";
import { buildWeekplanEntries } from "./weekplanBlob";

// PENDEL-FIX (docs/PENDEL-RECON.md §5 en §7) — de vier termen end-to-end op de ijk-fixture uit §6.
// Weekmaandag 2026-07-27, klok op WOENSDAG 2026-07-29 (de pendeldag).
//
// DE BLOB WORDT NIET LEEG GEVOED, en dat is dragend: hij komt uit een SCHONE run op de weekmaandag
// via `buildWeekplanEntries` en wordt teruggevoerd. Leeg gevoed meet iets anders — 320 TSS / 390 min
// / 3 dagen in plaats van 375 / 450 / 4 — precies de val uit WERKWIJZE.md ("een fixture die leeg
// gevoed wordt, voorspelt de app niet").

const MAANDAG = "2026-07-27";
const WOENSDAG = "2026-07-29";

// DE KLOK WORDT OP MODULE-NIVEAU GEPIND, NIET IN `beforeAll`, en dat is dragend. `const BLOB`
// hieronder roept `buildWeekProposal` aan tijdens de MODULE-EVALUATIE, en die gaat vooraf aan elke
// `beforeAll`. Met de pin in `beforeAll` zag die ene aanroep dus de ECHTE systeemklok terwijl alle
// aanroepen in de tests op 2026-07-29 stonden, en de variant-keuze in de seed hangt daaraan.
// GEMETEN 20-08-2026: de test was groen zolang de wandklok dicht bij 29 juli lag en werd rood toen
// hij ruim drie weken verder stond — 509 in plaats van 530 op `v.minuten.gepland`, stabiel over vijf
// runs, zonder dat er een letter aan de repo veranderd was. Een test die de wandklok binnenlaat
// heeft een houdbaarheidsdatum; deze pin haalt die eruit.
vi.useFakeTimers();
vi.setSystemTime(new Date(2026, 6, 29, 8, 0, 0));
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 6, 27 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const SETTINGS: SettingsInput = {
  ftp: 280,
  lthr: null,
  gewicht: 75,
  doel: "FTP",
  doelStart: "2026-06-29",
  hrMax: null,
  hrRest: null,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 40,
  pendelAantal: 2,
};

/** ma 60 vrij, WO 40 PENDEL, vr 90 vrij, za 180 weekend, zo 120 weekend. */
const MIN: Record<number, number> = { 0: 60, 2: 40, 4: 90, 5: 180, 6: 120 };
const PENDEL_DAGEN = [2];

const PLANNER: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  datum: iso(n),
  train: MIN[n] != null,
  dag: null,
  minuten: MIN[n] ?? 0,
  dagtype:
    MIN[n] == null
      ? null
      : PENDEL_DAGEN.indexOf(n) >= 0
        ? "pendel"
        : n === 5 || n === 6
          ? "weekend"
          : "vrij",
  toelichting: null,
  voorgesteldType: null,
  gedaan: false,
}));

/** Eén rit: idx0 Date, idx1 type, idx3 duur, idx7 IF, idx8 TSS, idx15 zonetijden, idx16 id. */
function rit(datumISO: string, uur: number, minuten: number, tss: number) {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row = new Array(17).fill(null) as ActValuesRow;
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, uur, 30, 0);
  row[1] = "Ride";
  row[3] = minuten;
  row[7] = 0.7;
  row[8] = tss;
  row[15] = JSON.stringify([
    { id: "Z1", secs: Math.round(minuten * 60 * 0.35) },
    { id: "Z2", secs: Math.round(minuten * 60 * 0.65) },
  ]);
  row[16] = `${datumISO}-${uur}`;
  return row;
}

const HEENRIT = rit(WOENSDAG, 7, 40, 29);
const TERUGRIT = rit(WOENSDAG, 17, 40, 29);

function week(activities: ActValuesRow[], weekplans: unknown[]) {
  return buildWeekProposal({
    settings: SETTINGS,
    plannerDays: PLANNER,
    events: [],
    activities,
    weekplans,
    wellness: [],
    rpe: [],
    todayISO: WOENSDAG,
  } as never);
}

/** De blob uit een SCHONE run op de weekmaandag — expliciet niet leeg. */
const BLOB = (() => {
  const schoon = buildWeekProposal({
    settings: SETTINGS,
    plannerDays: PLANNER,
    events: [],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: MAANDAG,
  } as never);
  // `weekplans` is een PLATTE entry-array met een `datum`-veld (zie frozenEntryByDate in
  // proposal.ts), geen {weekMonday, entries}-wrapper.
  return buildWeekplanEntries(schoon as never, "FTP");
})();

function doneVan(tss: number, minuten: number): DoneEntry {
  return {
    tss,
    minuten,
    type: "Ride",
    naam: "Pendel",
    zoneMinutes: { low: minuten, high: 0, anaerobic: 0 },
    zoneMin5: {
      rust: minuten * 0.35,
      z2: minuten * 0.65,
      tempo: 0,
      drempel: 0,
      anaeroob: 0,
    },
    ifReal: 0.7,
    idExt: "",
    ritten: 1,
  };
}

/** Zelfde weg als de app: per dag opgeteld met `mergeDone`, dus `ritten` telt mee. */
function viewMet(activities: ActValuesRow[]) {
  const w = week(activities, BLOB);
  const doneByDate: Record<string, DoneEntry> = {};
  for (const a of activities) {
    const d = a[0] as Date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const de = doneVan(Number(a[8]) || 0, Number(a[3]) || 0);
    const prev = doneByDate[key];
    doneByDate[key] = prev ? mergeDone(prev, de) : de;
  }
  return { w, v: deriveSchemaView(w as never, doneByDate, WOENSDAG, {}) };
}

const woensdagVan = (v: ReturnType<typeof viewMet>["v"]) =>
  v.days.find((d) => d.datum === WOENSDAG);

describe("PENDEL term 1 — de producent TELT de ritten", () => {
  it("één rit op een pendeldag van 2x40 maakt de dag NIET gedaan", () => {
    expect(derivePlannerGedaan(PLANNER, [HEENRIT], 2).has(WOENSDAG)).toBe(
      false,
    );
  });

  it("twee ritten maken hem wél gedaan", () => {
    expect(
      derivePlannerGedaan(PLANNER, [HEENRIT, TERUGRIT], 2).has(WOENSDAG),
    ).toBe(true);
  });

  it("pendelSessies weggelaten → byte-identiek aan de oude regel, eerste match wint", () => {
    expect(derivePlannerGedaan(PLANNER, [HEENRIT]).has(WOENSDAG)).toBe(true);
  });

  it("een NIET-pendeldag blijft op één rit gedaan, ook met pendelSessies 2", () => {
    const maandagrit = rit(iso(0), 8, 60, 45);
    expect(derivePlannerGedaan(PLANNER, [maandagrit], 2).has(iso(0))).toBe(
      true,
    );
  });

  it("ROOD ZONDER TERM 1: de pendeldag houdt zijn TWEE geplande sessies", () => {
    // Zonder de telling valt de dag uit tePlannen en bouwt assignWorkouts er NUL sessies voor.
    const { v } = viewMet([HEENRIT]);
    expect(woensdagVan(v)?.sessions).toHaveLength(2);
  });
});

describe("PENDEL term 2 en 3 — openSessions en de push", () => {
  it("één rit gereden: één open sessie, en de push stuurt precies die", () => {
    const { v } = viewMet([HEENRIT]);
    const wo = woensdagVan(v);
    expect(wo?.sessions).toHaveLength(2);
    expect(wo?.openSessions).toHaveLength(1);
    expect(wo?.state).toBe("done");
    const push = collectPushDays(v.days, WOENSDAG).filter(
      (p) => p.dateISO === WOENSDAG,
    );
    expect(push).toHaveLength(1);
    expect(push[0]?.sessions).toHaveLength(1);
    expect(push[0]?.sessions[0]?.naam).toBe(wo?.openSessions[0]?.naam);
    // De open sessie is de TWEEDE van de dag — heen is gereden, terug staat open.
    expect(wo?.openSessions[0]?.naam).toBe(wo?.sessions[1]?.naam);
  });

  it("beide ritten gereden: geen open sessie meer, push slaat de dag over", () => {
    const { v } = viewMet([HEENRIT, TERUGRIT]);
    expect(woensdagVan(v)?.openSessions).toHaveLength(0);
    expect(
      collectPushDays(v.days, WOENSDAG).filter((p) => p.dateISO === WOENSDAG),
    ).toEqual([]);
  });

  it("geen rit: beide sessies staan open en gaan beide mee in de push", () => {
    const { v } = viewMet([]);
    expect(woensdagVan(v)?.openSessions).toHaveLength(2);
    expect(
      collectPushDays(v.days, WOENSDAG).filter((p) => p.dateISO === WOENSDAG)[0]
        ?.sessions,
    ).toHaveLength(2);
  });
});

describe("PENDEL term 4 — de counterpart op VOLGORDE", () => {
  it("één rit vergelijkt tegen de EERSTE sessie, niet tegen de terugrit", () => {
    const { v } = viewMet([HEENRIT]);
    const wo = woensdagVan(v);
    const c = wo?.doneCompare;
    expect(c).not.toBeNull();
    // GEMETEN, beide toestanden op deze fixture. Tegen de HEENrit: TSS 29/29, chip "Op plan",
    // score 96. Tegen de TERUGrit (term 4 eruit): TSS 38/29, chip "Licht afgeweken", score 70.
    // Dat is de onware bewering die dit uitsluit — de rit was precies op plan.
    //
    // NIET op `deviate` toetsen: die is in BEIDE toestanden false (hij vraagt state ===
    // "different", en "Licht afgeweken" is een andere state). Een assertie die de fout niet kan
    // onderscheiden bewijst niets, en leest wél als bewijs. De CHIP is wat Daan ziet en beweegt.
    const tssRij = c?.rows.find((r) => r.k === "TSS");
    expect(tssRij?.p).toBe("29");
    expect(tssRij?.d).toBe("29");
    expect(c?.chipLabel).toBe("Op plan");
    expect(c?.scorePct).toBe(96);
  });
});

describe("PENDEL — de weekkaart-noemer", () => {
  // GEMETEN op deze fixture: 442 TSS / 530 min / 5 dagen gepland. De recon (§7) noteerde
  // 446 / 530 / 5; het verschil van 4 TSS zit VOLLEDIG in de tweede pendelsessie, waar de
  // recency-seed hier "Drempel 2x8 kort" (38 TSS) kiest en chat-zijde een FTP-intervallen-variant
  // (42 TSS). Minuten, dagen en de hele structuur komen exact overeen. Daarom asserteren we de
  // VARIANT-ONAFHANKELIJKE waarden en niet de TSS-som — dat is dezelfde grens als in de recon:
  // de gekozen sjabloonnamen zijn geen prod-claim, de structurele uitkomsten wel.
  it("één rit gereden houdt de hele pendeldag in de GEPLANDE noemer", () => {
    const { v } = viewMet([HEENRIT]);
    expect(v.dagen.gepland).toBe(5);
    expect(v.minuten.gepland).toBe(530);
    expect(v.tss.gedaan).toBe(29);
    expect(v.minuten.gedaan).toBe(40);
    expect(v.dagen.gedaan).toBe(1);
    // De pendeldag draagt BEIDE geplande sessies in de noemer, samen 80 minuten.
    const wo = woensdagVan(v);
    expect(wo?.planSessions.reduce((a, s) => a + s.totaalMin, 0)).toBe(80);
  });
});
