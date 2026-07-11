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
  "pendelDuurMin",
  "pendelAantal",
] as const satisfies readonly (keyof SettingsInput)[];

const STR_KEYS = [
  "doel",
  "fase",
  "profielPreset",
  "coachNaam",
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
  fase: "",
  profielPreset: "",
  coachNaam: "",
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
    fase: v(s?.fase),
    profielPreset: v(s?.profielPreset),
    coachNaam: v(s?.coachNaam),
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

// fase: de engine leest alléén "maintain" (planModeLabel_, phase.ts) → een
// override; leeg = automatisch (weggelaten uit de body → null).
export const FASE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Automatisch" },
  { value: "maintain", label: "Onderhoud (maintain)" },
];

// Pendel duration is STORED as the full round-trip (heen + terug); the settings UI presents it as one leg
// (enkele reis). The engine reads the round-trip value and splits it into two halves.
export function legToRoundTrip(legMin: number): number {
  return legMin * 2;
}
export function roundTripToLeg(roundTripMin: number): number {
  return Math.round(roundTripMin / 2);
}
