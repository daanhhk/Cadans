import { buildWorkout } from "@cadans/engine";
import type { EventItem, SettingsInput } from "@cadans/shared";
import { useState } from "react";
import { BlokReviewCard } from "../components/schema/BlokReviewCard";
import { FaseOvergangCard } from "../components/schema/FaseOvergangCard";
import { FatigueCard } from "../components/schema/FatigueCard";
import { SchemaView } from "../components/schema/SchemaView";
import { TestVoorstelCard } from "../components/schema/TestVoorstelCard";
import { VerlichtCard } from "../components/schema/VerlichtCard";
import type { ActValuesRow } from "../lib/activities";
import { type BlokReview, buildBlokReview } from "../lib/blok";
import {
  verlichtAanbodRegel,
  verlichtActieLabel,
  verlichtBadgeLabel,
} from "../lib/coachNarrative";
import type { FaseOvergang } from "../lib/faseOvergang";
import type {
  ProposalDay,
  ProposalWeek,
  ProposalWorkout,
} from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import type {
  DoneEntry,
  FatigueVoorstel,
  VerlichtVoorstel,
} from "../lib/schema";
import { buildTestVoorstel, type TestVoorstel } from "../lib/testvoorstel";
import { signatuurSeconden, ZONE5_GRENZEN_DEFAULT } from "../lib/zonemunt";

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
  idExt: "",
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

// ── PREVIEWONLYFIXTURE — voorstel-kaarten (laag 2) ────────────────────────────────────
// VerlichtCard rendert alleen bij een lage gereedheid op een harde dag; dat doet zich zelden
// voor. Deze fixtures maken de POSITIEVE weergave beoordeelbaar (layout, copy) zonder op zo'n
// dag te wachten. DEV-only, net als de rest van deze pagina.

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

// 3d stap 4 — FatigueCard-fixtures (beide states + richtingen). De preview-week is FULL_WEEK ×0.6
// (down, minder minuten → −delta) resp. ×1.4 (up, meer → +delta) t.o.v. de baseline FULL_WEEK.
const scaleWeek = (w: ProposalWeek, factor: number): ProposalWeek => ({
  ...w,
  days: w.days.map((d) => ({
    ...d,
    sessions: d.sessions.map((s) => ({
      ...s,
      totaalMin: Math.round(s.totaalMin * factor),
    })),
  })),
});
const fatigueFixtures: { label: string; v: FatigueVoorstel }[] = [
  {
    label:
      "Vorm · UP-voorstel (geen opbouw op een kalender-deload → doortrainen)",
    v: {
      state: "offer",
      dir: "up",
      tsbTrend: 9,
      blok: { delta: -5.0, fromCtl: 50.7, toCtl: 45.7 },
      preview: scaleWeek(FULL_WEEK, 1.4),
    },
  },
  {
    label:
      "Vorm · DOWN-voorstel (diep vermoeid in een opbouwweek → vervroegde deload)",
    v: {
      state: "offer",
      dir: "down",
      tsbTrend: -13,
      blok: { delta: -0.4, fromCtl: 44.7, toCtl: 44.3 },
      preview: scaleWeek(FULL_WEEK, 0.6),
    },
  },
  {
    label: "Vorm · TOEGEPAST (up) — knop 'Terug naar de kalender'",
    v: {
      state: "applied",
      dir: "up",
      tsbTrend: null,
      blok: null,
      preview: null,
    },
  },
];

// M51/M10 — FaseOvergangCard-fixtures (aankondiging, alleen tekst). Minimaal: event-overname, een
// wissel naar opbouw, en een wissel naar taper.
const faseOvergangFixtures: { label: string; o: FaseOvergang }[] = [
  {
    label:
      "Fase-overgang · WISSEL naar OPBOUW (doel-cyclus, met naderend event)",
    o: {
      van: "Base",
      naar: "Build",
      eventNaam: "Marmotte",
      wekenTotEvent: 6,
    },
  },
  {
    label: "Fase-overgang · WISSEL naar TAPER (fris aan de start)",
    o: {
      van: "Peak",
      naar: "Taper",
      eventNaam: "Marmotte",
      wekenTotEvent: 1,
    },
  },
  {
    label:
      "Fase-overgang · WISSEL naar HERSTEL (event zit erop, geen countdown)",
    o: {
      van: "Taper",
      naar: "Recovery",
      eventNaam: "Marmotte",
      wekenTotEvent: 0,
    },
  },
];

// 5a-ii + 5b-i — BlokReviewCard-fixtures. HARDE EIS: elke fixture wordt BEREKEND door
// buildBlokReview op een fixture-activiteitenmatrix; er wordt hier GEEN BlokReview of
// EffectReferent met de hand in elkaar gezet. De UP-fixture hierboven schaalt een week kunstmatig
// met ×1,4 en overdrijft daarmee wat de motor doet — die schuld staat in HANDOFF en wordt hier
// niet herhaald.
//
// De rolling_ftp-reeks is de ECHTE reeks uit docs/EFFECT-REFERENT-RECON.md §4 (laatste geldige
// waarde per kalenderweek). 2026-02-02 heeft daar geen waarde en krijgt er hier dus ook geen.
const PREVIEW_ROLLING_FTP: [string, number | null][] = [
  ["2025-10-27", 276],
  ["2025-11-03", 276],
  ["2025-11-10", 276],
  ["2025-11-17", 276],
  ["2025-11-24", 273],
  ["2025-12-01", 273],
  ["2025-12-08", 273],
  ["2025-12-15", 273],
  ["2025-12-22", 271],
  ["2025-12-29", 270],
  ["2026-01-05", 267],
  ["2026-01-12", 276],
  ["2026-01-19", 276],
  ["2026-01-26", 276],
  ["2026-02-02", null], // geen rij in de reeks
  ["2026-02-09", 274],
  ["2026-02-16", 272],
  ["2026-02-23", 270],
  ["2026-03-02", 270],
  ["2026-03-09", 268],
  ["2026-03-16", 267],
  ["2026-03-23", 266],
  ["2026-03-30", 266],
  ["2026-04-06", 266],
  ["2026-04-13", 266],
  ["2026-04-20", 266],
  ["2026-04-27", 264],
  ["2026-05-04", 263],
  ["2026-05-11", 262],
  ["2026-05-18", 272],
  ["2026-05-25", 272],
  ["2026-06-01", 271],
  ["2026-06-08", 269],
  ["2026-06-15", 270],
  ["2026-06-22", 269],
  ["2026-06-29", 267],
  ["2026-07-06", 265],
  ["2026-07-13", 264],
  ["2026-07-20", 262],
];

/** De GEMETEN kwaliteitsminuten van het live blok — dezelfde die vandaag op de kaart staan. */
const PREVIEW_KWALITEIT: Record<string, number> = {
  "2026-06-29": 110,
  "2026-07-06": 97,
  "2026-07-13": 117,
  "2026-07-20": 91,
};

/** Eén fiets-rit per kalenderweek: idx3 duur, idx14 rolling_ftp, idx15 zonetijden.
 * De duur is low + high, dus de zonedekking is 1,0 en ligt ruim boven ZONEDATA_DEKKING_MIN.
 *
 * ZONE-MUNT fase 1b — `high` zijn WERKminuten en worden verdeeld in de VORM die het plan vraagt
 * (bibliotheek-signatuur, circa 28/56/16), in hele seconden met de laatste zone als rest. Alles in
 * Z4 zetten zou elke fixture op de zone-poort laten vallen — nul tempo en nul anaeroob — en dan
 * rendert deze pagina iets anders dan haar eigen labels beloven. */
function previewAct(
  datum: string,
  rollingFtp: number | null,
  high: number,
  /** Expliciete zone-verdeling in minuten; weggelaten → de bibliotheek-vorm over `high`. */
  vorm?: { tempo: number; drempel: number; anaeroob: number },
): ActValuesRow {
  const [y, m, d] = datum.split("-").map(Number);
  const row: ActValuesRow = new Array(17).fill(null);
  row[0] = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  row[1] = "Ride";
  row[14] = rollingFtp;
  if (vorm) {
    row[3] = 150 + vorm.tempo + vorm.drempel + vorm.anaeroob;
    row[15] = JSON.stringify([
      { id: "Z2", secs: 150 * 60 },
      { id: "Z3", secs: Math.round(vorm.tempo * 60) },
      { id: "Z4", secs: Math.round(vorm.drempel * 60) },
      { id: "Z5", secs: Math.round(vorm.anaeroob * 60) },
    ]);
    return row;
  }
  row[3] = 150 + high;
  const s = signatuurSeconden(high);
  row[15] = JSON.stringify([
    { id: "Z2", secs: 150 * 60 },
    { id: "Z3", secs: s.tempo },
    { id: "Z4", secs: s.drempel },
    { id: "Z5", secs: s.anaeroob },
  ]);
  return row;
}

function previewActs(
  overrideFtp: Record<string, number> = {},
  /** ZONE-MUNT fase 1b — per blokweek een afwijkende zone-vorm, voor de niet-geleverd-takken. */
  vormen: Record<
    string,
    { tempo: number; drempel: number; anaeroob: number }
  > = {},
): ActValuesRow[] {
  return PREVIEW_ROLLING_FTP.map(([datum, v]) =>
    previewAct(
      datum,
      overrideFtp[datum] ?? v,
      PREVIEW_KWALITEIT[datum] ?? 30, // buiten het blok doet de kwaliteit er niet toe
      vormen[datum],
    ),
  );
}

/** Een week die genoeg trainde maar in de VERKEERDE zone: tempo ver boven norm, drempel eronder. */
const VERSCHOVEN = { tempo: 90, drempel: 20, anaeroob: 14 };
/** Een week die overal tekortkomt — geen verschuiving, gewoon te weinig. */
const TE_WEINIG = { tempo: 6, drempel: 9, anaeroob: 2 };

/** De gereden A-wedstrijd van 21-05-2026 — de laatste maximale inspanning in de echte data. */
const PREVIEW_RACE_MEI: EventItem = {
  datum: "2026-05-21",
  naam: "De Ronde Venen",
  type: "race",
  prioriteit: "A",
  afstandKm: 80,
  hoogtemeters: null,
  klimType: null,
  notitie: null,
};

const PREVIEW_RACE: EventItem = {
  datum: "2026-07-13",
  naam: "Ronde van Iets",
  type: "race",
  prioriteit: "A",
  afstandKm: 120,
  hoogtemeters: null,
  klimType: null,
  notitie: null,
};

function previewReview(o: {
  weekMondayISO: string;
  ctlDelta: number | null;
  events?: EventItem[];
  overrideFtp?: Record<string, number>;
  vormen?: Record<string, { tempo: number; drempel: number; anaeroob: number }>;
}): BlokReview | null {
  return buildBlokReview({
    activities: previewActs(o.overrideFtp, o.vormen),
    doel: "FTP",
    weekUren: 5,
    doelStart: "2026-06-29",
    weekMondayISO: o.weekMondayISO,
    todayISO: o.weekMondayISO,
    ctlDelta: o.ctlDelta,
    events: o.events ?? [],
    overrides: [],
    // Preview-fixture: geen gesynchroniseerde zones, dus expliciet de default.
    grenzen: ZONE5_GRENZEN_DEFAULT,
  });
}

// Labels noemen de VERWACHTE uitkomst, zodat bij het kijken meteen zichtbaar is of de kaart iets
// anders rendert dan bedoeld.
const blokReviewFixtures: { label: string; r: BlokReview | null }[] = [
  {
    label:
      "Blok · LOPEND (blokweek 4, wat vandaag live staat) — geen effect-regel, het blok loopt nog",
    r: previewReview({ weekMondayISO: "2026-07-20", ctlDelta: -2.7 }),
  },
  {
    label:
      "Blok · AFGEROND, NIET MEETBAAR (geen test of wedstrijd) — 269 → 267, verschil −2",
    r: previewReview({ weekMondayISO: "2026-07-27", ctlDelta: -2.7 }),
  },
  {
    label:
      "Blok · AFGEROND, NIET GESTEGEN · term VOLUME (wedstrijd 13-07, CTL bouwde niet op)",
    r: previewReview({
      weekMondayISO: "2026-07-27",
      ctlDelta: -2.7,
      events: [PREVIEW_RACE],
    }),
  },
  {
    label:
      "Blok · AFGEROND, NIET GESTEGEN · term TIJD-IN-ZONE (wedstrijd 13-07, CTL bouwde wél op)",
    r: previewReview({
      weekMondayISO: "2026-07-27",
      ctlDelta: 2,
      events: [PREVIEW_RACE],
    }),
  },
  {
    label: "Blok · AFGEROND, GESTEGEN — 269 → 275, verschil +6",
    r: previewReview({
      weekMondayISO: "2026-07-27",
      ctlDelta: -2.7,
      events: [PREVIEW_RACE],
      // Alleen de REEKSWAARDE gaat omhoog; de drempel blijft ROLLING_FTP_STIJGING_W.
      overrideFtp: { "2026-07-06": 275 },
    }),
  },
  // ZONE-MUNT fase 1b — de twee niet-geleverd-takken. Zonder deze twee is de nieuwe coach-copy
  // nergens te zien vóór prod: alle fixtures hierboven leveren juist wél.
  {
    label:
      "Blok · NIET GELEVERD · VERSCHUIVING (genoeg getraind, verkeerde zone) — 0/3, coach zegt verschuiven naar Drempel",
    r: previewReview({
      weekMondayISO: "2026-07-27",
      ctlDelta: -2.7,
      vormen: {
        "2026-06-29": VERSCHOVEN,
        "2026-07-06": VERSCHOVEN,
        "2026-07-13": VERSCHOVEN,
      },
    }),
  },
  {
    label:
      "Blok · NIET GELEVERD · TE WEINIG (overal tekort, geen verschuiving) — 0/3, de dosis blijft staan",
    r: previewReview({
      weekMondayISO: "2026-07-27",
      ctlDelta: -2.7,
      vormen: {
        "2026-06-29": TE_WEINIG,
        "2026-07-06": TE_WEINIG,
        "2026-07-13": TE_WEINIG,
      },
    }),
  },
];

// 5b-ii — TestVoorstelCard-fixture. Net als de blok-fixtures BEREKEND door de echte
// buildTestVoorstel, niet met de hand gezet. De rustweek van 17-08-2026 is de eerste waarin dit
// live kan vuren; de laatste meting is de gereden A-wedstrijd van 21-05-2026 (93 dagen ervoor).
const previewTestVoorstel: TestVoorstel | null = buildTestVoorstel({
  plannerDays: [
    {
      datum: "2026-08-17",
      train: false,
      dag: "ma",
      minuten: null,
      dagtype: null,
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-18",
      train: true,
      dag: "di",
      minuten: 45,
      dagtype: "vrij",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-19",
      train: false,
      dag: "wo",
      minuten: null,
      dagtype: null,
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-20",
      train: true,
      dag: "do",
      minuten: 60,
      dagtype: "vrij",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-21",
      train: false,
      dag: "vr",
      minuten: null,
      dagtype: null,
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-22",
      train: true,
      dag: "za",
      minuten: 90,
      dagtype: "weekend",
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
    {
      datum: "2026-08-23",
      train: false,
      dag: "zo",
      minuten: null,
      dagtype: null,
      toelichting: null,
      voorgesteldType: null,
      gedaan: false,
    },
  ],
  overrides: [],
  events: [PREVIEW_RACE_MEI],
  activities: [previewAct("2026-05-21", null, 30)],
  doel: "FTP",
  doelStart: "2026-06-29",
  weekMondayISO: "2026-08-17",
  todayISO: "2026-08-17",
});

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
      {fatigueFixtures.map((f) => (
        <div key={f.label}>
          <div style={fixtureLabel}>
            {f.label} — knoppen uitgeschakeld in de preview
          </div>
          {/* pointer-events uit: accept/revert schrijven een ECHTE per-week fatigue-shift. */}
          <div style={{ pointerEvents: "none" }}>
            <FatigueCard
              fatigue={f.v}
              baseline={FULL_WEEK}
              coachNaam="Coach"
              weekMonday="2026-07-20"
              onDismiss={() => undefined}
            />
          </div>
        </div>
      ))}
      {faseOvergangFixtures.map((f) => (
        <div key={f.label}>
          <div style={fixtureLabel}>{f.label}</div>
          <FaseOvergangCard overgang={f.o} coachNaam="Coach" />
        </div>
      ))}
      {previewTestVoorstel && (
        <div>
          <div style={fixtureLabel}>
            Test · VOORSTEL in de rustweek (laatste meting 21-05, 93 dagen
            terug) — knoppen schrijven een ECHTE override, niet aantikken
          </div>
          <div style={{ pointerEvents: "none", opacity: 0.97 }}>
            <TestVoorstelCard
              voorstel={previewTestVoorstel}
              coachNaam="Coach"
              onDismiss={() => undefined}
            />
          </div>
        </div>
      )}
      {blokReviewFixtures.map((f) =>
        f.r ? (
          <div key={f.label}>
            <div style={fixtureLabel}>{f.label}</div>
            <BlokReviewCard review={f.r} coachNaam="Coach" />
          </div>
        ) : null,
      )}
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
