import { buildOverrideWorkout_, getTrainingLibrary_ } from "@cadans/engine";
import type {
  DayOverride,
  FreeOverride,
  LibraryOverride,
  OverrideIntensiteit,
  OverrideRitType,
  OverrideWorkoutType,
  SettingsInput,
} from "@cadans/shared";
import type { ProposalWorkout } from "./proposal";
import { type SchemaDay, type SchemaSession, toSession } from "./schema";

// Getypeerde trainings-bibliotheek-laag (puur, DOM-loos). Vangt de engine-`any`-output van
// getTrainingLibrary_ + buildOverrideWorkout_ af achter één gedeelde, getypeerde grens (mitigeert
// debt (l) op dit pad) en voedt zowel de B3-picker als later de B2 Trainingen-tab.

/** Één bibliotheek-variant — enkel de index-velden die de picker toont. */
export interface LibraryVariant {
  variantId: string;
  naam: string;
  tip: string;
}
/** Categorie-metadata + haar variant-index. `type` = het shared OverrideWorkoutType → de
 * override-DTO die de picker bouwt is type-safe. */
export interface LibraryCategory {
  key: string;
  label: string;
  zoneVar: string;
  omschrijving: string;
  defaultDur: number;
  type: OverrideWorkoutType;
  variants: LibraryVariant[];
}

// Duur-slider-constanten uit GAS pkSliderHtml_/pkGo (Script.html:2117 / :2140).
export const DUR_MIN = 45;
export const DUR_MAX = 240;
export const DUR_STEP = 15;
export const FREE_DEFAULT_DUR = 90;

// Geldige zone-var-tokens (styles/tokens.css --zone-1..--zone-6). De engine-cat.zoneVar wordt in CSS
// geïnterpoleerd → harden tegen een onverwachte string; onbekend → --zone-2 (GAS ZONE_VAR-fallback).
const ZONE_VARS = new Set([
  "--zone-1",
  "--zone-2",
  "--zone-3",
  "--zone-4",
  "--zone-5",
  "--zone-6",
]);
export function normalizeZoneVar(zoneVar: string): string {
  return ZONE_VARS.has(zoneVar) ? zoneVar : "--zone-2";
}

// Rauwe engine-shape (getTrainingLibrary_) — enkel wat we lezen; de rest is bewust genegeerd.
interface RawVariant {
  variantId: string;
  naam: string;
  tip?: string;
}
interface RawCategory {
  key: string;
  label: string;
  zoneVar: string;
  omschrijving: string;
  defaultDur: number;
  type: string;
  variants?: RawVariant[];
}

/**
 * Trainings-bibliotheek → getypeerde categorie-index. Bewust ALLEEN de index-velden overgenomen
 * (categorie-metadata + variantId/naam/tip). De engine rendert elke variant op mesoWeek 1 + cat.fase
 * en levert daar durMin/segmenten/tss bij — die getallen gebruiken wij NIET: de override-PREVIEW
 * rendert op de ECHTE week-context (previewOverrideSession), zodat preview == dagkaart (WYSIWYG).
 */
export function trainingCategories(settings: SettingsInput): LibraryCategory[] {
  const raw = getTrainingLibrary_(settings) as RawCategory[];
  return raw.map((c) => ({
    key: c.key,
    label: c.label,
    zoneVar: normalizeZoneVar(c.zoneVar),
    omschrijving: c.omschrijving,
    defaultDur: c.defaultDur,
    // De 6 cat-types zijn exact het OverrideWorkoutType-domein (TRAINING_CATS_, planner.ts).
    type: c.type as OverrideWorkoutType,
    variants: (c.variants ?? []).map((v) => ({
      variantId: v.variantId,
      naam: v.naam,
      tip: v.tip ?? "",
    })),
  }));
}

/** GAS trnCat_ (Script.html:1885) — categorie op key, of null. */
export function findCategory(
  cats: LibraryCategory[],
  key: string,
): LibraryCategory | null {
  return cats.find((c) => c.key === key) ?? null;
}

/** GAS trnVar_ (Script.html:1886) — variant op variantId, of null. */
export function findVariant(
  cat: LibraryCategory,
  variantId: string,
): LibraryVariant | null {
  return cat.variants.find((v) => v.variantId === variantId) ?? null;
}

/**
 * Bibliotheek-override-DTO (GAS pkPickLibrary, Script.html:2158). KRITIEK: `variantId` is ALTIJD
 * gezet. Zonder variantId valt buildOverrideWorkout_ (planner.ts) terug op buildWorkout(type, dur) en
 * NEGEERT de duur-slider voor niet-schaalbare types (template-duur). Met variantId → renderVariant_
 * schaalt naar de gevraagde duur. Zie de spec-eis-regressie in library.test.ts.
 */
export function libraryOverride(
  cat: LibraryCategory,
  variant: LibraryVariant,
  durMin: number,
): LibraryOverride {
  return {
    type: "library",
    workoutType: cat.type,
    variantId: variant.variantId,
    durMin,
  };
}

/** Vrije/groep-rit-override-DTO (GAS pkPickFree, Script.html:2160). */
export function freeOverride(
  ritType: OverrideRitType,
  intensiteit: OverrideIntensiteit,
  durMin: number,
): FreeOverride {
  return { type: "free", ritType, intensiteit, durMin };
}

/** Week-context voor de override-preview — spiegelt de D2-tak-argumenten in buildWeekProposal. */
export interface OverrideRenderCtx {
  settings: SettingsInput;
  mesoWeek: number;
  macroFase: string;
  dagIdx: number;
}

/**
 * Preview: bouw de gekozen override tot de SESSIE die de dagkaart óók zou tonen. EXACT dezelfde
 * aanroep als de D2-tak in buildWeekProposal — buildOverrideWorkout_(ov, settings, mesoWeek,
 * macroFase, undefined, dagIdx) — plus dezelfde toSession-map → preview == dagkaart (WYSIWYG).
 * Engine levert niets → null.
 */
export function previewOverrideSession(
  ov: DayOverride,
  ctx: OverrideRenderCtx,
): SchemaSession | null {
  const wo = buildOverrideWorkout_(
    ov,
    ctx.settings,
    ctx.mesoWeek,
    ctx.macroFase,
    undefined,
    ctx.dagIdx,
  ) as ProposalWorkout | null;
  return wo ? toSession(wo) : null;
}

// ── Week-predicaten (voor de B3-picker + de B2 Trainingen-tab) ──────────────────────────────────

/**
 * GAS trnPlannable_ (Script.html:1998-2004): dag ≥ vandaag én niet voltooid/gemist. De TWEE
 * GAS-takken die hier wegvallen zijn bewust: 'preview' bestaat niet in Cadans' 1-week-venster, en
 * 'vandaag mét een rit' is door de same-day-flip al state 'done' → de done-uitsluiting dekt 'm.
 */
export function isDayPlannable(day: SchemaDay, todayISO: string): boolean {
  return (
    day.datum >= todayISO && day.state !== "done" && day.state !== "gemist"
  );
}

/**
 * GAS trnNextPlannableDate_ (Script.html:2005-2007): de VROEGSTE plannbare dag (oplopende datum), of
 * — als er geen kandidaat is — todayISO (GAS valt terug op state.vandaag.dateISO). BYTE-GETROUW: die
 * fallback kan op een gesloten dag mikken; dat is het GAS-gedrag, bewust behouden.
 */
export function nextPlannableDate(
  days: SchemaDay[],
  todayISO: string,
): string | null {
  const cand = days
    .filter((d) => isDayPlannable(d, todayISO))
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const first = cand[0];
  return first ? first.datum : todayISO;
}

/**
 * "In je blok"-badge-bron: de unieke geplande types over de week. GAS merget weekPlannedTypes_ + een
 * aparte override-merge (WebApp.gs:1389-1397). In Cadans is die merge OVERBODIG: de laag-3b-port zet
 * ProposalDay.voorgesteldType op de override-waarde ("free" | workoutType), dus de unieke niet-lege
 * voorgesteldType over de dagen dekt beide takken BY CONSTRUCTION (geverifieerd in proposal.ts).
 */
export function weekPlannedTypes(days: SchemaDay[]): Set<string> {
  const out = new Set<string>();
  for (const d of days) {
    if (d.voorgesteldType) out.add(d.voorgesteldType);
  }
  return out;
}
