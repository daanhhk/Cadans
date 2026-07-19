import type { PlannerDay, SettingsInput } from "@cadans/shared";
import { describe, expect, it } from "vitest";
import type { ActValuesRow } from "./activities";
import { buildWeekProposal, type ProposalWeek } from "./proposal";
import { buildInhaalVoorstel } from "./schema";

// Week in het VERLEDEN-deel van deze week: ma..do verstreken, vandaag = vrijdag.
// (De allocator plaatst alleen vanaf allocToday; de forward-dagen zijn vr/za/zo.)
const S: SettingsInput = {
  ftp: 280,
  lthr: 170,
  gewicht: 75,
  doel: "FTP",
  doelStart: null,
  hrMax: 190,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: 80,
  pendelAantal: 2,
};
const MON = (() => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
})();
const iso = (n: number) => {
  const d = new Date(MON.getFullYear(), MON.getMonth(), MON.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const TODAY = iso(4);

const dagen: PlannerDay[] = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  datum: iso(n),
  train: true,
  dag: null,
  minuten: n === 5 ? 120 : 90,
  dagtype: n === 5 ? "weekend" : "vrij",
  toelichting: null,
  voorgesteldType: null,
  gedaan: false,
}));

function act(
  datum: string,
  min: number,
  iff: number,
  zoneJson: string,
): ActValuesRow {
  const [y, m, d] = datum.split("-").map(Number);
  const r: ActValuesRow = new Array(17).fill("");
  r[0] = new Date(y, m - 1, d, 9, 0);
  r[1] = "Ride";
  r[3] = min;
  r[7] = iff;
  r[15] = zoneJson;
  return r;
}

// Blob met de intent van de verstreken dagen; zo ontstaat er debt zodra de deciders aan gaan.
function blob(
  entries: Array<{
    datum: string;
    intent: Record<string, number>;
    zones: string[];
  }>,
) {
  return entries.map((e) => ({
    datum: e.datum,
    workoutType: "threshold",
    naam: "Drempel",
    zones: e.zones,
    intent: e.intent,
    tss: 80,
    minuten: 90,
    sessies: [],
  }));
}

function runs(weekplans: unknown[], activities: ActValuesRow[]) {
  const base = {
    settings: S,
    plannerDays: dagen,
    events: [],
    activities,
    weekplans,
    wellness: [],
    rpe: [],
    todayISO: TODAY,
  };
  const origineel = buildWeekProposal(base);
  const voorgesteld = buildWeekProposal({ ...base, planAdaptation: true });
  return { origineel, voorgesteld };
}

describe("buildInhaalVoorstel", () => {
  // Groot HIGH-tekort op de verstreken dagen → catchup_high in de voorgestelde run.
  const hoogTekort = blob([
    {
      datum: iso(0),
      intent: { low: 0, high: 60, anaerobic: 0 },
      zones: ["high"],
    },
    {
      datum: iso(1),
      intent: { low: 0, high: 60, anaerobic: 0 },
      zones: ["high"],
    },
  ]);

  it("band 'caution' → null (M66: herstel wint van inhalen)", () => {
    const { origineel, voorgesteld } = runs(hoogTekort, []);
    expect(
      buildInhaalVoorstel(origineel, voorgesteld, "caution", TODAY),
    ).toBeNull();
  });

  it("band 'rest' → null (M66)", () => {
    const { origineel, voorgesteld } = runs(hoogTekort, []);
    expect(
      buildInhaalVoorstel(origineel, voorgesteld, "rest", TODAY),
    ).toBeNull();
  });

  it("geen tekort (lege blob) → null", () => {
    const { origineel, voorgesteld } = runs([], []);
    expect(
      buildInhaalVoorstel(origineel, voorgesteld, "ready", TODAY),
    ).toBeNull();
  });

  it("geen tweede run meegegeven → null", () => {
    const { origineel } = runs(hoogTekort, []);
    expect(buildInhaalVoorstel(origineel, null, "ready", TODAY)).toBeNull();
  });

  it("alleen duurvolume-tekort → null (M64/M65: kwaliteit vóór volume)", () => {
    // Een diff die uitsluitend catchup_low bevat mag geen voorstel opleveren. We voeden
    // dat rechtstreeks als voorgestelde week, zodat de poort geïsoleerd getest wordt.
    const { origineel } = runs([], []);
    const alleenLow: ProposalWeek = {
      ...origineel,
      days: origineel.days.map((d) =>
        d.datum === TODAY ? { ...d, redenCode: "catchup_low" } : d,
      ),
    };
    expect(
      buildInhaalVoorstel(origineel, alleenLow, "ready", TODAY),
    ).toBeNull();
  });

  it("catchup_high in de diff → voorstel met gewijzigde dagen + aanbod-copy", () => {
    const { origineel } = runs([], []);
    const dagDatum = TODAY;
    const metHigh: ProposalWeek = {
      ...origineel,
      days: origineel.days.map((d) =>
        d.datum === dagDatum
          ? { ...d, redenCode: "catchup_high", voorgesteldType: "threshold" }
          : d,
      ),
    };
    const v = buildInhaalVoorstel(origineel, metHigh, "ready", TODAY);
    expect(v).not.toBeNull();
    expect(v?.bucket).toBe("high");
    expect(v?.dagen).toHaveLength(1);
    expect(v?.dagen[0].datum).toBe(dagDatum);
    expect(v?.dagen[0].toNaam).toBe("Drempel");
    expect(v?.dagen[0].redenCode).toBe("catchup_high");
    // Aanbod-copy: biedt aan, claimt de daad NIET.
    expect(v?.regel).toContain(
      "Voorstel: ik kan je gemiste intensiteit-prikkel",
    );
    expect(v?.regel).not.toContain("Ik heb");
    // M62: expliciet binnen het bestaande budget.
    expect(v?.regel).toContain("binnen je bestaande uren");
  });

  it("verstreken dagen tellen niet mee in de diff (alleen ≥ vandaag)", () => {
    const { origineel } = runs([], []);
    const verleden: ProposalWeek = {
      ...origineel,
      days: origineel.days.map((d) =>
        d.datum === iso(1) ? { ...d, redenCode: "catchup_high" } : d,
      ),
    };
    expect(buildInhaalVoorstel(origineel, verleden, "ready", TODAY)).toBeNull();
  });

  it("een catchup die al in het origineel stond → geen wijziging, dus null", () => {
    const { origineel } = runs([], []);
    const zelfde: ProposalWeek = {
      ...origineel,
      days: origineel.days.map((d) =>
        d.datum === TODAY ? { ...d, redenCode: "catchup_high" } : d,
      ),
    };
    // origineel ÉN voorgesteld dragen dezelfde code op die dag.
    expect(buildInhaalVoorstel(zelfde, zelfde, "ready", TODAY)).toBeNull();
  });

  it("het ACTIEVE plan verandert niet door de tweede run", () => {
    const activities = [
      act(iso(1), 40, 0.6, JSON.stringify([{ id: "Z2", secs: 2400 }])),
    ];
    const base = {
      settings: S,
      plannerDays: dagen,
      events: [],
      activities,
      weekplans: hoogTekort,
      wellness: [],
      rpe: [],
      todayISO: TODAY,
    };
    const voor = buildWeekProposal(base);
    const sig = JSON.stringify(voor.days);
    // de tweede run draaien (zoals de loader doet) …
    buildWeekProposal({ ...base, planAdaptation: true });
    // … en opnieuw het origineel: byte-identiek, de tweede run heeft niets gemuteerd.
    const na = buildWeekProposal(base);
    expect(JSON.stringify(na.days)).toBe(sig);
  });
});
