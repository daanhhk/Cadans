import { buildWorkout } from "@cadans/engine";
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

// Engine-gedreven geplande workout (§5b) — DEZELFDE prod-keten als productie: buildWorkout(...)
// levert de ProposalWorkout, deriveSchemaView→toSession mapt 'm bij render. sweet_spot + Base +
// slot 0 → variant ss_2x20 → per-rep blokken (twee tempo-pieken), GAS-conform. Naam/min/TSS/
// blokken/structuur komen ALLE uit de engine — niet meer met de hand. doelStart:null → weekIndex 0.
const PREVIEW_FTP = 250;
const PREVIEW_PLANNED_SESSION = buildWorkout(
  "sweet_spot",
  90, // beschikbare minuten (Base sweet-spot dag)
  { ftp: PREVIEW_FTP, lthr: 160, doel: "ftp", doelStart: null },
  0, // mesoWeek = weekIndex 0 → mesoFactor 1.0
  "Base", // = FULL_WEEK.macroFase (periodisering-balk toont Basis)
  undefined,
  0, // slot (dagIdx) → rotatie-index 0 = ss_2x20
  null,
) as ProposalWorkout;

// ── "Volle week" — vandaag = wo 2026-07-08 (voltooid-volle), elke dagkaart-state gedekt ──
const FULL_WEEK: ProposalWeek = {
  weekMonday: "2026-07-06",
  macroFase: "Base",
  fase: "Base", // geen taper → balk-actieve-fase = macroFase (Basis licht op)
  eventNaam: "Amstel Gold Race",
  wekenTotEvent: 40,
  planModus: "Doel-gericht",
  profielPreset: "gemiddeld", // → §2 Volume-stat toont "5u"
  coachNaam: "Coach Stelvio", // → §6 coach-box-kop "COACH STELVIO · IMPACT"
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
    // Do — GEPLAND (toekomst, sessie aanwezig, niet gedaan) → WorkoutDetail. Engine-gedreven
    // (PREVIEW_PLANNED_SESSION) → silhouet toont de echte per-rep vorm (twee tempo-pieken).
    day("2026-07-09", 3, {
      voorgesteldType: "sweet_spot",
      sessions: [PREVIEW_PLANNED_SESSION],
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
  fase: "Base",
  eventNaam: null,
  wekenTotEvent: null,
  planModus: "Opbouw", // geen event + geen maintain → planModeLabel_-tak "Opbouw"
  profielPreset: null, // → Volume-stat lege staat (stat weggelaten, zoals event/ModeChip)
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

// ── "Taper-week" — fase="Taper" (engine-overlay) terwijl de onderliggende macro "Peak" is → het 4e
// balk-segment (Taper) licht op (FASE 2 Brok 1). Zelfde dagen/ritten als de volle week.
const TAPER_WEEK: ProposalWeek = {
  weekMonday: "2026-07-06",
  macroFase: "Peak",
  fase: "Taper",
  eventNaam: "Amstel Gold Race",
  wekenTotEvent: 1,
  planModus: "Doel-gericht",
  profielPreset: "gevorderd", // → §2 Volume-stat toont "7u"
  coachNaam: "Coach Stelvio",
  days: FULL_WEEK.days,
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
  {
    key: "taper",
    label: "Taper-week",
    proposalWeek: TAPER_WEEK,
    doneByDate: FULL_DONE,
    readiness: FULL_READY,
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
