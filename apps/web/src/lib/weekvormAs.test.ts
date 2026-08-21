import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildWeekProposal } from "./proposal";

// DE WEEKVORM-AS — de vaste meetlat van docs/ROADMAP.md. Vijf weekvormen, doel FTP, fase Base,
// mesoweek 1. Per weekvorm: kwaliteitsminuten (Σ intent.high + intent.anaerobic over alle
// sessies) en week-TSS. Elke bouw die de dosis raakt draait deze as opnieuw.
//
// TWEE SOORTEN ASSERTIE, en het verschil is opzettelijk:
//   1. De INVARIANT — V1, V3 en V5 mogen niet ZAKKEN. Die weekvormen liggen binnen de
//      bibliotheek-band; een wijziging die daar kwaliteit kost is een regressie, geen keuze.
//      Deze assertie wordt NIET herijkt. Valt hij om, dan is de wijziging fout.
//   2. De VINGERAFDRUK — de volledige reeks, exact. Die MAG bewust herijkt worden bij een
//      dosis-wijziging, mits de invariant staat en de richting in de commit-body verantwoord
//      is. Hij vangt onbedoelde drift, hij verbiedt geen ontwerpbesluit.
//
// Klok gepind BINNEN de test (na vi.setSystemTime), want weekIndexFromStart_ én
// allocateQualityWeek_ dateren zich op de ambient new Date().

const MAANDAG = new Date(2026, 6, 27, 8, 0, 0); // 2026-07-27, ma
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAANDAG);
});
afterAll(() => {
  vi.useRealTimers();
});

const iso = (n: number) => {
  const d = new Date(2026, 6, 27 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

function settings(pendelDuurMin: number): SettingsInput {
  return {
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
    pendelDuurMin,
    pendelAantal: 2,
  };
}

function plannerDays(
  min: Record<number, number>,
  pendel: number[],
): PlannerDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: iso(n),
    train: min[n] != null,
    dag: null,
    minuten: min[n] ?? 0,
    dagtype:
      min[n] == null
        ? null
        : pendel.indexOf(n) >= 0
          ? "pendel"
          : n === 5 || n === 6
            ? "weekend"
            : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));
}

// dagOffset = welke dag van de week "vandaag" is (0 = maandag). Vormen die volledig vooruit
// liggen houden 0; een week IN UITVOERING zet hem hoger, en de klok schuift mee — anders leest
// de engine een andere dag dan todayISO zegt. De pin blijft BINNEN de test.
function meet(
  min: Record<number, number>,
  pendel: number[],
  pendelDuurMin: number,
  dagOffset = 0,
): { kwal: number; tss: number; dagen: number } {
  vi.setSystemTime(new Date(2026, 6, 27 + dagOffset, 8, 0, 0));
  const r = buildWeekProposal({
    settings: settings(pendelDuurMin),
    plannerDays: plannerDays(min, pendel),
    events: [
      {
        id: 1,
        datum: "2027-04-17",
        naam: "A-race",
        type: "race",
        prioriteit: "A",
      },
    ],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: iso(dagOffset),
    // ROADMAP punt 16 — DEZE AS IS DE PRIKKELLOZE BASISLIJN, en dat is de hele reden dat de
    // schakelaar bestaat. `tools/punt16/meet.mjs` ijkt zich op deze reeks; zou de bereik-prikkel
    // hier meedoen, dan verschuift het ijkpunt mee met een latere wijziging aan die prikkel en
    // meet de as zichzelf niet meer. De reeks hieronder is daarom ONGEWIJZIGD gebleven.
    prikkelUit: true,
  } as never);
  let kwal = 0;
  let tss = 0;
  const kdagen = new Set<string>();
  for (const d of (r as { days: unknown[] }).days) {
    for (const s of ((d as { sessions?: unknown[] }).sessions ?? []) as {
      intent?: { high?: number; anaerobic?: number };
      tss?: number;
    }[]) {
      const q =
        (Number(s.intent?.high) || 0) + (Number(s.intent?.anaerobic) || 0);
      kwal += q;
      tss += Number(s.tss) || 0;
      if (q > 0) kdagen.add((d as { datum: string }).datum);
    }
  }
  return { kwal: Math.round(kwal), tss, dagen: kdagen.size };
}

const VORMEN: {
  naam: string;
  min: Record<number, number>;
  pendel: number[];
  pendelDuurMin: number;
  dagOffset?: number;
}[] = [
  {
    naam: "V1 5,0u ma60 di60 do60 za120",
    min: { 0: 60, 1: 60, 3: 60, 5: 120 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V2 8,0u ma90 di90 do90 za210",
    min: { 0: 90, 1: 90, 3: 90, 5: 210 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V3 8,0u ma70 di70 do70 za180 zo90",
    min: { 0: 70, 1: 70, 3: 70, 5: 180, 6: 90 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V4 7,0u ma60 di60 do60 za240",
    min: { 0: 60, 1: 60, 3: 60, 5: 240 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V5 7,0u ma60 za120 + 3 pendeldagen 80",
    min: { 0: 60, 1: 80, 2: 80, 3: 80, 5: 120 },
    pendel: [1, 2, 3],
    pendelDuurMin: 40,
  },
  // V6 — WEEK IN UITVOERING, en dat is de normale situatie: V1 t/m V5 liggen volledig vooruit.
  // Zelfde dagen als V1, maar "vandaag" is DINSDAG en de maandag is verstreken zonder rit
  // (train true, gedaan false, geen activities). Meet dus wat er nog te plannen valt in een week
  // waar al een dag uit is. Staat NIET in de invariant-lijst — die blijft V1, V3 en V5.
  {
    naam: "V6 in uitvoering, gemiste maandag (di) ma60 di60 do60 za120",
    min: { 0: 60, 1: 60, 3: 60, 5: 120 },
    pendel: [],
    pendelDuurMin: 80,
    dagOffset: 1,
  },
  // V7 — de LANGE WEEKENDDAG DIE ZIJN BUREN BLOKKEERT. Deze familie zat in geen van beide
  // meetsets, en juist daar zat het defect: een greedy keuze voor de zaterdag van 180 min laat
  // vrijdag én zondag door de tussenruimte-eis afvallen, waarna het derde slot onbenut blijft.
  // GEMETEN zonder de bereikbaarheidsterm: 81 kwaliteitsminuten en 2 kwaliteitsdagen in plaats
  // van 90 en 3. Het AANTAL dagen maakt dat zichtbaar; op minuten alleen oogt het als ruis.
  // Staat NIET in de invariant-lijst, net als V6.
  {
    naam: "V7 di60 vr90 za180 zo120",
    min: { 1: 60, 4: 90, 5: 180, 6: 120 },
    pendel: [],
    pendelDuurMin: 80,
  },
];

// De vingerafdruk. Herijkt na de allocator-termen bereikbaarheid en draagkracht (ROADMAP stap
// 1b, docs/STAP1B-ALLOCATOR-RECON.md §4). Alleen V3 beweegt ten opzichte van de nulmeting:
// 77 -> 113 kwaliteitsminuten en 437 -> 464 TSS, doordat de zaterdag van 180 min nu wint van de
// zondag van 90. De andere zes zijn byte-identiek in minuten ÉN in TSS.
//
// `dagen` = het AANTAL dagen met kwaliteitsminuten. Die rij is er bewust bij gekomen: het
// greedy-defect uit de tussenronde kostte V7 een hele kwaliteitsdag terwijl de minuten maar 10
// procent zakten. Op minuten alleen oogt zoiets als ruis; op dagen niet.
const VERWACHT = {
  kwal: [93, 113, 113, 105, 84, 93, 90],
  tss: [268, 410, 464, 362, 352, 227, 375],
  dagen: [3, 3, 3, 3, 3, 3, 3],
};

// De invariant. V1, V3 en V5 liggen binnen de bibliotheek-band; daar hoort geen enkele
// dosis-wijziging kwaliteit te KOSTEN. Herijk deze getallen niet naar beneden.
const VLOER: Record<number, number> = { 0: 69, 2: 45, 4: 64 };

describe("Weekvorm-as: kwaliteitsminuten en week-TSS per weekvorm", () => {
  it("V1, V3 en V5 zakken niet onder hun vloer (INVARIANT — niet herijken)", () => {
    for (const [idx, vloer] of Object.entries(VLOER)) {
      const v = VORMEN[Number(idx)];
      if (!v) throw new Error(`weekvorm ${idx} bestaat niet`);
      const { kwal } = meet(v.min, v.pendel, v.pendelDuurMin, v.dagOffset);
      expect(
        kwal,
        `${v.naam}: ${kwal} kwaliteitsminuten, vloer is ${vloer}`,
      ).toBeGreaterThanOrEqual(vloer);
    }
  });

  it("de volledige reeks (VINGERAFDRUK — mag bewust herijkt worden)", () => {
    const kwal: number[] = [];
    const tss: number[] = [];
    const dagen: number[] = [];
    for (const v of VORMEN) {
      const r = meet(v.min, v.pendel, v.pendelDuurMin, v.dagOffset);
      kwal.push(r.kwal);
      tss.push(r.tss);
      dagen.push(r.dagen);
    }
    expect({ kwal, tss, dagen }).toEqual(VERWACHT);
  });
});
