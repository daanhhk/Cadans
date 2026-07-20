import type { SettingsInput } from "@cadans/shared";

// Settings-form-laag: pre-fill (GET → form-state) + serialisatie (form-state →
// PUT-body). Het PUT-contract is FULL-REPLACE: een weggelaten sleutel cleart het
// veld naar null; een expliciete null of "" geeft 400. Dus de serializer stuurt
// NOOIT null/""/NaN — een leeg veld wordt WEGGELATEN.

/** Form-state = elk EngineSettings-veld als string (input-value). */
export type SettingsForm = Record<keyof SettingsInput, string>;

// Numerieke velden (number-inputs) vs vrije/enum-strings vs de datum.
const NUM_KEYS = [
  "ftp",
  "lthr",
  "gewicht",
  "hrMax",
  "hrRest",
  "doelDuur",
  "weekUren",
  "pendelDuurMin",
  "pendelAantal",
] as const satisfies readonly (keyof SettingsInput)[];

const STR_KEYS = [
  "doel",
  "fase",
  "profielPreset",
  "coachNaam",
  "coachPersona",
  "naam",
] as const satisfies readonly (keyof SettingsInput)[];

export const EMPTY_FORM: SettingsForm = {
  ftp: "",
  lthr: "",
  gewicht: "",
  doel: "",
  doelStart: "",
  hrMax: "",
  hrRest: "",
  doelDuur: "",
  weekUren: "",
  fase: "",
  profielPreset: "",
  coachNaam: "",
  coachPersona: "", // leeg = default warm (de kiezer highlight + de render-guard vullen 'm in)
  naam: "",
  pendelDuurMin: "",
  pendelAantal: "",
};

/** GET-respons (of null bij een verse user) → blanco-tolerante form-state. */
export function settingsToForm(s: SettingsInput | null): SettingsForm {
  const v = (x: number | string | null | undefined): string =>
    x == null ? "" : String(x);
  return {
    ftp: v(s?.ftp),
    lthr: v(s?.lthr),
    gewicht: v(s?.gewicht),
    doel: v(s?.doel),
    doelStart: v(s?.doelStart),
    hrMax: v(s?.hrMax),
    hrRest: v(s?.hrRest),
    doelDuur: v(s?.doelDuur),
    weekUren: v(s?.weekUren),
    fase: v(s?.fase),
    profielPreset: v(s?.profielPreset),
    coachNaam: v(s?.coachNaam),
    // Leeg-tolerant (zoals coachNaam): null → "" → FULL-REPLACE laat 'm weg. Het "warm"-default
    // leeft in de kiezer-highlight (CoachPersonaChips) + de render-guard (normalizeCoachPersona).
    coachPersona: v(s?.coachPersona),
    naam: v(s?.naam),
    pendelDuurMin: v(s?.pendelDuurMin),
    pendelAantal: v(s?.pendelAantal),
  };
}

/**
 * PURE form-state → PUT-body. FULL-REPLACE-veilig: een leeg/NaN-veld wordt
 * WEGGELATEN (→ de handler cleart het naar null). Nooit een sleutel met null/""/NaN
 * (dat zou een 400 triggeren). number-velden komen als number (niet string).
 */
export function settingsFormToBody(f: SettingsForm): Partial<SettingsInput> {
  const b: Partial<SettingsInput> = {};
  for (const k of NUM_KEYS) {
    const t = f[k].trim();
    if (!t) continue;
    const n = Number(t);
    if (!Number.isNaN(n)) b[k] = n;
  }
  for (const k of STR_KEYS) {
    const t = f[k].trim();
    if (t) b[k] = t;
  }
  const ds = f.doelStart.trim();
  if (ds) b.doelStart = ds;
  return b;
}

// ── Vaste keuze-sets (bron: engine + design) ──────────────────────────────
// doel: exact de engine-literals uit DOEL_OPTIONS (phase.ts) — profileForDoel_
// (archetypes.ts) matcht precies deze strings. NL-labels als display.
export const DOEL_OPTIONS: { value: string; label: string }[] = [
  { value: "FTP", label: "FTP / drempel" },
  { value: "Conditie", label: "Duurvermogen" },
  { value: "Beklimmingen", label: "Klimmen" },
  { value: "VO2max", label: "VO2max" },
  { value: "Onderhoud", label: "Onderhoud" },
];

// profielPreset: NIET door de engine gelezen (geen match gevonden) → de waarden
// volgen het design (settings.jsx VOLUMES-keys).
export const PROFIEL_PRESET_OPTIONS: {
  value: string;
  label: string;
  sub: string;
}[] = [
  { value: "amateur", label: "Amateur", sub: "~3u/wk" },
  { value: "gemiddeld", label: "Gemiddeld", sub: "~5u/wk" },
  { value: "gevorderd", label: "Gevorderd", sub: "~7u/wk" },
  { value: "professional", label: "Professional", sub: "10u+/wk" },
];

/**
 * profielPreset (opgeslagen value-key) → compacte uren-weergave voor de §2 Volume-stat.
 * ENIGE bron = PROFIEL_PRESET_OPTIONS (`sub`, bv. "~5u/wk"); pakt het bestaande "Nu"/"Nu+"-
 * token eruit → "3u"/"5u"/"7u"/"10u+". null (→ lege staat) voor: geen preset, een onbekende
 * key, of een preset zonder uren-bron (bv. een custom-profiel). Verzint geen getal/format.
 */
export function presetHoursLabel(profielPreset: string | null): string | null {
  if (!profielPreset) return null;
  const opt = PROFIEL_PRESET_OPTIONS.find((p) => p.value === profielPreset);
  const m = opt?.sub.match(/\d+u\+?/);
  return m ? m[0] : null;
}

// coachPersona: presentatie-only (coach-narrative-stijl). Alleen "warm" is nu selecteerbaar;
// gedisciplineerd/statistisch zijn zichtbaar maar disabled ("binnenkort") — de warm-pool is de
// enige gevulde pool (coachNarrative valt sowieso terug op warm). value = de opgeslagen persona-key.
export const COACH_PERSONA_OPTIONS: {
  value: string;
  label: string;
  sub: string;
  disabled: boolean;
}[] = [
  {
    value: "warm",
    label: "Warm",
    sub: "Positief en ondersteunend",
    disabled: false,
  },
  {
    value: "disciplined",
    label: "Gedisciplineerd",
    sub: "Strak en direct",
    disabled: true,
  },
  {
    value: "statistical",
    label: "Statistisch",
    sub: "Cijfergericht en neutraal",
    disabled: true,
  },
];

// fase: de engine leest alléén "maintain" (planModeLabel_, phase.ts) → een
// override; leeg = automatisch (weggelaten uit de body → null).
export const FASE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Automatisch" },
  { value: "maintain", label: "Onderhoud (maintain)" },
];

// `pendelDuurMin` is de duur PER RIT — niet de round-trip. De engine leest 'm ONGEHALVEERD
// en vermenigvuldigt met `pendelAantal` (proposal.ts: sessieCount × sessieMin; byte-identiek
// aan GAS Algorithm.gs:189/193 en :943). Zo staat het ook in de GAS-instellingen:
// `PENDEL_DUUR` heet daar letterlijk "Pendel duur per rit" (Settings.gs:39), default 80 bij
// pendelAantal 2.
//
// Er BESTAAT wel een heen/terug-splitsing, maar uitsluitend als STRUCTUUR-WEERGAVE binnen
// ÉÉN sessie: `genericPendelZ2`/`genericPendelIntervals` (planner.ts:1982/:2024, 1-op-1 uit
// Algorithm.gs:2801/:2822) tonen "Heen" = floor(mins/2) en "Terug" = de rest. `totaalMin` en
// `tss` blijven op de VOLLE mins staan → de belasting wordt níét gehalveerd. Dat is een
// geërfde GAS-eigenaardigheid (R1-C1), geen halvering van de opgeslagen waarde.
//
// Een eerdere UI-laag verdubbelde de invoer vóór opslag (legToRoundTrip); dat was de enige
// echte bug en is verwijderd — de invoer gaat nu rechtstreeks als duur-per-rit naar D1.
