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
import { type SchemaSession, toSession } from "./schema";

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
    zoneVar: c.zoneVar,
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
