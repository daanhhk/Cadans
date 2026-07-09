import { useState } from "react";
import { SchemaView } from "../components/schema/SchemaView";
import type {
  ProposalDay,
  ProposalWeek,
  ProposalWorkout,
} from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import type { DoneEntry } from "../lib/schema";

// DEV-ONLY preview-loop: voedt de ECHTE SchemaView (PeriodTimeline/WeekLoad/DayStrip + de
// dagkaart-dispatch) met FIXTURE-data in de exacte ProposalWeek/ProposalDay/DoneEntry-shape,
// zodat elke dagkaart-state + de lege staat zónder deploy/live-trigger te bekijken zijn. GEEN
// prod-content: dit zijn dev-test-fixtures. Uniek merk voor de bundel-grep: PREVIEWONLYFIXTURE.
// De route is import.meta.env.DEV-gated in App.tsx (dynamic import → niet in de prod-bundel).

// ── fixture-builders (raw engine-shapes; SchemaView.deriveSchemaView mapt ze) ──
const wo = (
  naam: string,
  zones: string[],
  totaalMin: number,
  tss: number,
  blokken: { minuten: number; zone: string }[],
  structuur: string[][] = [],
): ProposalWorkout => ({
  naam,
  zones,
  totaalMin,
  tss,
  blokken,
  structuur,
  focus: null,
  eindopmerking: null,
});

const day = (
  datum: string,
  dagIdx: number,
  o: Partial<ProposalDay> = {},
): ProposalDay => ({
  datum,
  dagIdx,
  voorgesteldType: null,
  reden: null,
  archetypeId: null,
  sessions: [],
  plannedForDone: null,
  ...o,
});

const done = (o: Partial<DoneEntry>): DoneEntry => ({
  tss: 0,
  minuten: 0,
  type: "Ride",
  naam: "Rit",
  zoneMinutes: null,
  ifReal: null,
  ...o,
});

// ── "Volle week" — vandaag = wo 2026-07-08 (voltooid-volle), elke dagkaart-state gedekt ──
const FULL_WEEK: ProposalWeek = {
  weekMonday: "2026-07-06",
  macroFase: "Base",
  eventNaam: "Amstel Gold Race",
  wekenTotEvent: 40,
  planModus: "Doel-gericht",
  days: [
    // Ma — VOLTOOID-VERLEDEN: gedaan, GEEN plan-bron → kale DoneDetail
    day("2026-07-06", 0),
    // Di — RUSTDAG (geen training, niet gedaan)
    day("2026-07-07", 1),
    // Wo (vandaag) — VOLTOOID-VANDAAG-VOLLE: plan-bron aanwezig → DoneCompareCard (afwijking)
    day("2026-07-08", 2, {
      voorgesteldType: "threshold",
      plannedForDone: wo("Drempel 3×10", ["low", "high"], 60, 82, [
        { minuten: 12, zone: "rust" },
        { minuten: 8, zone: "z2" },
        { minuten: 34, zone: "drempel" },
        { minuten: 6, zone: "rust" },
      ]),
    }),
    // Do — GEPLAND (toekomst, sessie aanwezig, niet gedaan) → WorkoutDetail
    day("2026-07-09", 3, {
      voorgesteldType: "sweet_spot",
      sessions: [
        wo(
          "Sweet Spot 2×15",
          ["low", "high"],
          75,
          78,
          [
            { minuten: 15, zone: "rust" },
            { minuten: 15, zone: "z2" },
            { minuten: 30, zone: "drempel" },
            { minuten: 10, zone: "z2" },
            { minuten: 5, zone: "rust" },
          ],
          [
            ["Warmup", "15:00", "150-180 W", "-", "rustig opbouwen"],
            [
              "Sweet Spot 2×15",
              "30:00",
              "238-250 W",
              "-",
              "2 blokken, 5′ rust",
            ],
            ["Uitrijden", "10:00", "130 W", "-", ""],
          ],
        ),
      ],
    }),
    // Vr — RUSTDAG
    day("2026-07-10", 4),
    // Za — GEPLAND (lange duurrit)
    day("2026-07-11", 5, {
      voorgesteldType: "long_z2",
      sessions: [
        wo("Lange duurrit", ["low"], 150, 95, [{ minuten: 150, zone: "z2" }]),
      ],
    }),
    // Zo — RUSTDAG
    day("2026-07-12", 6),
  ],
};

const FULL_DONE: Record<string, DoneEntry> = {
  // verleden: dominante Z2 → "Duur" in de kale kaart
  "2026-07-06": done({
    tss: 68,
    minuten: 78,
    naam: "🚴 Ochtendrit",
    zoneMinutes: { low: 52, high: 20, anaerobic: 3 },
    ifReal: 0.74,
  }),
  // vandaag: rustige duur gereden i.p.v. de geplande drempel → "Anders getraind"
  "2026-07-08": done({
    tss: 60,
    minuten: 80,
    naam: "🚴 Rustige duurrit",
    zoneMinutes: { low: 68, high: 6, anaerobic: 1 },
    ifReal: 0.68,
  }),
};

const FULL_READY: ReadinessResult = {
  score: 84,
  band: "ready",
  factors: [
    { key: "hrv", label: "HRV", sub: null, dot: "good", valueText: "balans" },
    { key: "slaap", label: "Slaap", sub: null, dot: "good", valueText: "7:40" },
    {
      key: "vorm",
      label: "Vorm (TSB)",
      sub: null,
      dot: "warn",
      valueText: "-8",
    },
  ],
  chips: [{ label: "Fris", tone: "fresh" }],
  checkinDone: false,
  checkinDelta: 0,
  checkinSummary: "Geen check-in vandaag",
  checkin: null,
};

// ── "Lege week" — geen sessies, geen ritten, geen event → expliciete lege staten ──
const EMPTY_WEEK: ProposalWeek = {
  weekMonday: "2026-07-06",
  macroFase: "Base",
  eventNaam: null,
  wekenTotEvent: null,
  planModus: null,
  days: [
    day("2026-07-06", 0),
    day("2026-07-07", 1),
    day("2026-07-08", 2),
    day("2026-07-09", 3),
    day("2026-07-10", 4),
    day("2026-07-11", 5),
    day("2026-07-12", 6),
  ],
};

const EMPTY_READY: ReadinessResult = {
  score: null,
  band: null,
  factors: [],
  chips: [],
  checkinDone: false,
  checkinDelta: 0,
  checkinSummary: "Nog geen wellness-data",
  checkin: null,
};

interface Fixture {
  key: string;
  label: string;
  proposalWeek: ProposalWeek;
  doneByDate: Record<string, DoneEntry>;
  readiness: ReadinessResult;
  todayISO: string;
}

const FIXTURES: Fixture[] = [
  {
    key: "vol",
    label: "Volle week",
    proposalWeek: FULL_WEEK,
    doneByDate: FULL_DONE,
    readiness: FULL_READY,
    todayISO: "2026-07-08",
  },
  {
    key: "leeg",
    label: "Lege week",
    proposalWeek: EMPTY_WEEK,
    doneByDate: {},
    readiness: EMPTY_READY,
    todayISO: "2026-07-08",
  },
];

export function Preview() {
  const [idx, setIdx] = useState(0);
  const f = FIXTURES[idx] ?? FIXTURES[0];
  return (
    <div>
      <div
        style={{
          margin: "var(--s-2) 0 var(--s-3)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          border: "1px dashed var(--border-strong)",
          background: "var(--bg-elevated)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Preview · dev-fixtures · PREVIEWONLYFIXTURE
        </div>
        <div style={{ display: "flex", gap: "var(--s-2)" }}>
          {FIXTURES.map((fx, i) => {
            const on = i === idx;
            return (
              <button
                key={fx.key}
                type="button"
                onClick={() => setIdx(i)}
                style={{
                  flex: 1,
                  padding: "var(--s-2)",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  background: on ? "var(--accent-soft)" : "var(--bg-sunken)",
                  border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
                  color: on ? "var(--accent)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  fontWeight: 600,
                }}
              >
                {fx.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
          }}
        >
          Tik een dag in de strip om de kaart-staat te wisselen
          (voltooid-vandaag · voltooid-verleden · gepland · rustdag).
        </div>
      </div>

      <SchemaView
        key={f.key}
        proposalWeek={f.proposalWeek}
        readiness={f.readiness}
        doneByDate={f.doneByDate}
        todayISO={f.todayISO}
        onRegen={() => {}}
        regenerating={false}
        syncNote={null}
      />
    </div>
  );
}
