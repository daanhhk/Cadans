import { buildWorkout } from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { useState } from "react";
import { InhaalCard } from "../components/schema/InhaalCard";
import { SchemaView } from "../components/schema/SchemaView";
import { VerlichtCard } from "../components/schema/VerlichtCard";
import {
  inhaalAanbodRegel,
  verlichtAanbodRegel,
  verlichtActieLabel,
  verlichtBadgeLabel,
} from "../lib/coachNarrative";
import type {
  ProposalDay,
  ProposalWeek,
  ProposalWorkout,
} from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import type {
  DoneEntry,
  InhaalVoorstel,
  VerlichtVoorstel,
} from "../lib/schema";

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
  redenCode: null,
  archetypeId: null,
  override: null,
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
  zoneMin5: null,
  ifReal: null,
  ...o,
});

// Engine-gedreven geplande workout (§5b) — DEZELFDE prod-keten als productie: buildWorkout(...)
// levert de ProposalWorkout, deriveSchemaView→toSession mapt 'm bij render. sweet_spot + Base +
// slot 0 → variant ss_2x20 → per-rep blokken (twee tempo-pieken), GAS-conform. Naam/min/TSS/
// blokken/structuur komen ALLE uit de engine — niet meer met de hand. doelStart:null → weekIndex 0.
const PREVIEW_FTP = 250;
// Volledige SettingsInput voor de SchemaView-settings-prop (presentatie-only in de view).
const PREVIEW_SETTINGS: SettingsInput = {
  ftp: PREVIEW_FTP,
  lthr: 160,
  gewicht: 72,
  doel: null,
  doelStart: null,
  hrMax: 185,
  hrRest: 45,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin: null,
  pendelAantal: null,
};
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
  mesoWeek: 0,
  fase: "Base", // geen taper → balk-actieve-fase = macroFase (Basis licht op)
  eventNaam: "Amstel Gold Race",
  wekenTotEvent: 40,
  planModus: "Doel-gericht",
  profielPreset: "gemiddeld", // → §2 Volume-stat toont "5u"
  coachNaam: "Coach Stelvio", // → §6 coach-box-kop "COACH STELVIO · IMPACT"
  nearTaper: false,
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
  // verleden: dominante Z2 → "Duur" in de kale kaart. 5-bucket: rust + tempo nu zichtbaar.
  "2026-07-06": done({
    tss: 68,
    minuten: 78,
    naam: "🚴 Ochtendrit",
    zoneMinutes: { low: 52, high: 20, anaerobic: 3 },
    zoneMin5: { rust: 8, z2: 42, tempo: 12, drempel: 12, anaeroob: 4 },
    ifReal: 0.74,
  }),
  // vandaag: rustige duur gereden i.p.v. de geplande drempel → "Anders getraind"
  "2026-07-08": done({
    tss: 60,
    minuten: 80,
    naam: "🚴 Rustige duurrit",
    zoneMinutes: { low: 68, high: 6, anaerobic: 1 },
    zoneMin5: { rust: 10, z2: 56, tempo: 8, drempel: 5, anaeroob: 1 },
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
  mesoWeek: 0,
  fase: "Base",
  eventNaam: null,
  wekenTotEvent: null,
  planModus: "Opbouw", // geen event + geen maintain → planModeLabel_-tak "Opbouw"
  profielPreset: null, // → Volume-stat lege staat (stat weggelaten, zoals event/ModeChip)
  nearTaper: false,
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
  mesoWeek: 0,
  fase: "Taper",
  eventNaam: "Amstel Gold Race",
  wekenTotEvent: 1,
  planModus: "Doel-gericht",
  profielPreset: "gevorderd", // → §2 Volume-stat toont "7u"
  coachNaam: "Coach Stelvio",
  nearTaper: false,
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

// ── PREVIEWONLYFIXTURE — voorstel-kaarten (fase 2b / laag 2) ──────────────────────────
// InhaalCard en VerlichtCard renderen alleen bij een echt kwalificerend tekort resp. een lage
// gereedheid op een harde dag; die combinatie doet zich zelden voor. Deze fixtures maken de
// POSITIEVE weergave beoordeelbaar (layout, copy, van→naar) zonder op zo'n dag te wachten.
// DEV-only, net als de rest van deze pagina.

const inhaalFixtures: { label: string; v: InhaalVoorstel }[] = [
  {
    label: "Inhaal · intensiteit, 1 dag",
    v: {
      bucket: "high",
      dagen: [
        {
          datum: "2026-07-24",
          fromType: "long_z2",
          toType: "sweet_spot",
          fromNaam: "Duur",
          toNaam: "Sweet Spot",
          redenCode: "catchup_high",
        },
      ],
      regel: inhaalAanbodRegel("high", 1),
    },
  },
  {
    label: "Inhaal · anaeroob, 1 dag",
    v: {
      bucket: "anaerobic",
      dagen: [
        {
          datum: "2026-07-25",
          fromType: "long_z2",
          toType: "vo2max",
          fromNaam: "Duur",
          toNaam: "VO2max",
          redenCode: "catchup_anaerobic",
        },
      ],
      regel: inhaalAanbodRegel("anaerobic", 1),
    },
  },
  {
    label: "Inhaal · intensiteit, 2 dagen",
    v: {
      bucket: "high",
      dagen: [
        {
          datum: "2026-07-24",
          fromType: "long_z2",
          toType: "threshold",
          fromNaam: "Duur",
          toNaam: "Drempel",
          redenCode: "catchup_high",
        },
        // NB: een inhaal eet nooit een hersteldag op (M72) — de "van"-kant is dus een
        // duur-/endurance-dag, precies wat de motor herverdeelt.
        {
          datum: "2026-07-26",
          fromType: "long_z2",
          toType: "sweet_spot",
          fromNaam: "Duur",
          toNaam: "Sweet Spot",
          redenCode: "catchup_high",
        },
      ],
      regel: inhaalAanbodRegel("high", 2),
    },
  },
];

const verlichtFixtures: { label: string; v: VerlichtVoorstel }[] = [
  {
    label: "Verlicht · caution → Tempo-rit",
    v: {
      datum: "2026-07-22",
      band: "caution",
      score: 55,
      fromType: "threshold",
      toType: "tempo",
      fromNaam: "Drempel 3×10",
      toNaam: "Tempo-rit",
      intensiteit: "tempo",
      regel: verlichtAanbodRegel("caution", 55, "Drempel 3×10", "Tempo-rit"),
      actieLabel: verlichtActieLabel("caution", "Tempo-rit"),
      override: {
        type: "library",
        workoutType: "tempo",
        durMin: 75,
        src: "readiness",
        label: verlichtBadgeLabel("caution", "Tempo-rit"),
      },
    },
  },
  {
    label: "Verlicht · rest → Herstelrit",
    v: {
      datum: "2026-07-22",
      band: "rest",
      score: 41,
      fromType: "vo2max",
      toType: "recovery",
      fromNaam: "VO2 8×2min",
      toNaam: "Herstelrit",
      intensiteit: "rustig",
      regel: verlichtAanbodRegel("rest", 41, "VO2 8×2min", "Herstelrit"),
      actieLabel: verlichtActieLabel("rest", "Herstelrit"),
      override: {
        type: "library",
        workoutType: "recovery",
        durMin: 60,
        src: "readiness",
        label: verlichtBadgeLabel("rest", "Herstelrit"),
      },
    },
  },
];

const fixtureLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-caption)",
  color: "var(--text-muted)",
  marginBottom: "var(--s-2)",
};

function VoorstelPreview() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
        marginTop: "var(--s-6)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Voorstel-kaarten (fixtures)
      </div>
      {inhaalFixtures.map((f) => (
        <div key={f.label}>
          <div style={fixtureLabel}>{f.label}</div>
          {/* knoppen uit: de goedkeur-knop schrijft een ECHTE per-week opt-in. */}
          <div style={{ pointerEvents: "none" }}>
            <InhaalCard
              voorstel={f.v}
              coachNaam="Coach"
              weekMonday="2026-07-20"
            />
          </div>
        </div>
      ))}
      <div key="inhaal-actief">
        <div style={fixtureLabel}>
          Inhaal · GOEDGEKEURD (actieve toestand) — knoppen uitgeschakeld
        </div>
        <div style={{ pointerEvents: "none" }}>
          <InhaalCard
            voorstel={null}
            coachNaam="Coach"
            weekMonday="2026-07-20"
            optedIn
          />
        </div>
      </div>
      {verlichtFixtures.map((f) => (
        <div key={f.label}>
          <div style={fixtureLabel}>
            {f.label} — knoppen uitgeschakeld in de preview
          </div>
          {/* pointer-events uit: de accept-knop van VerlichtCard schrijft een ECHTE
              dag-override (putOverride). In een fixture-preview mag een tik nooit een
              D1-rij aanmaken; het is hier om de weergave te beoordelen. */}
          <div style={{ pointerEvents: "none" }}>
            <VerlichtCard
              voorstel={f.v}
              coachNaam="Coach"
              onDismiss={() => undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
        rpeByDate={{ "2026-07-08": 7 }}
        dispositionByDate={{}}
        settings={PREVIEW_SETTINGS}
      />

      <VoorstelPreview />
    </div>
  );
}
