import { normalizeDoel_ } from "@cadans/engine";
import { blokStartVoorWeek, blokWeekVanWeek } from "./blok";

// ROADMAP punt 12 — DOEL-PASSENDHEID.
// Spec: docs/PUNT12-BOUWDOC.md §4 en §5. Norm: docs/DOELEN-SPEC.md §2A en §6 stap 6.
//
// Naar het model van `eventOvername.ts`: null is geen kaart, en elke voorwaarde staat LOS zodat
// er per voorwaarde een eigen rood-test bestaat. De blok-verankering komt uit `blok.ts` en wordt
// hier niet nagerekend — `blokWeekVanWeek` en `blokStartVoorWeek` zijn de ene plek waar een
// weekmaandag op een blok wordt afgebeeld.

/**
 * De urenvloer per doel, in GEDECLAREERDE weekuren (`settings.weekUren`) — niet de som van de
 * weekplanner-dagminuten. Dat onderscheid is vastgesteld in `DOELEN-SPEC` §2A: de gedeclareerde
 * uren zijn MEETLAT-invoer en expliciet geen planner-invoer.
 *
 * HERKOMST: PLAN. Coach-canon uit `docs/DOELEN-SPEC.md`, geen geijkte drempel — er valt hier
 * niets te bemonsteren, dus er hoort geen plateau-toets bij.
 *
 * FTP EN ONDERHOUD STAAN HIER BEWUST NIET IN en dragen dus geen vloer: §3.1 noemt FTP bij weinig
 * uren juist de ruggengraat, en §3.2 geeft Onderhoud drie kwaliteitsdagen ook bij drie uur.
 */
export const DOEL_UREN_VLOER: Record<string, number> = {
  "Korte beklimmingen": 5, // §3.3 — onder circa vijf uur past het doel niet (M40)
  "Lange beklimmingen": 6, // §3.4 — "zes a acht uur"; de ONDERKANT, want een kaart die vuurt is een ingreep
  Conditie: 4, // §3.5 — onder circa vier uur is het doel niet te bedienen
};

/**
 * Het voorgestelde doel is ALTIJD FTP. Grond: de kaart vuurt per constructie alleen wanneer er
 * een OPBOUWEND doel staat met te weinig uren, en §3.1 noemt FTP daar de ruggengraat. Onderhoud
 * is een bewuste seizoenskeuze (§5) en draagt zelf geen vloer, dus zodra dat doel staat kan de
 * kaart niet vuren.
 */
export const VOORSTEL_DOEL = "FTP";

export interface DoelPassendInput {
  doel: string | null;
  weekUren: number | null;
  doelStart: string | null;
  weekMondayISO: string;
  /** De opgeslagen rij: voor welk blok en welk doel is de vraag al beantwoord. */
  beantwoordBlok: string | null;
  beantwoordDoel: string | null;
}

export interface DoelPassendVoorstel {
  huidigDoel: string;
  vloerUren: number;
  weekUren: number;
  voorstelDoel: string;
  blokStart: string;
}

/** Null = geen kaart. Elke conditie staat los. */
export function doelPassendVoorstel(
  input: DoelPassendInput,
): DoelPassendVoorstel | null {
  const { doel, weekUren, doelStart, weekMondayISO } = input;

  // 1. Geen uren, geen oordeel (M5). Een 0 of een NaN is geen "weinig uren" maar "onbekend".
  if (
    typeof weekUren !== "number" ||
    !Number.isFinite(weekUren) ||
    weekUren <= 0
  ) {
    return null;
  }

  // 2. Draagt dit doel een vloer? Genormaliseerd, zodat een legacy-string uit D1 op hetzelfde
  //    profiel valt als de huidige `DOEL_OPTIONS`-waarde.
  const huidigDoel = normalizeDoel_(doel);
  const vloerUren = DOEL_UREN_VLOER[huidigDoel];
  if (vloerUren === undefined) return null;

  // 3. STRIKT kleiner: bij precies 5 uur PAST Korte beklimmingen — dat is de norm uit §3.3.
  if (!(weekUren < vloerUren)) return null;

  // 4. De blokgrens uit §2A: de vraag valt alleen in blokweek 1.
  if (blokWeekVanWeek(doelStart, weekMondayISO) !== 1) return null;

  // 5. Is er voor DIT blok al geantwoord voor DIT doel? Het doel hoort erbij: een wissel binnen
  //    hetzelfde blok naar een ander niet-passend doel is een NIEUW besluit en de vraag hoort
  //    dan terug te komen.
  const blokStart = blokStartVoorWeek(doelStart, weekMondayISO);
  if (
    input.beantwoordBlok === blokStart &&
    input.beantwoordDoel === huidigDoel
  ) {
    return null;
  }

  return {
    huidigDoel,
    vloerUren,
    weekUren,
    voorstelDoel: VOORSTEL_DOEL,
    blokStart,
  };
}

/**
 * De body voor `PUT /api/settings` bij een JA-tik: het VOLLEDIGE settings-object met alleen
 * `doel` en `doelStart` vervangen.
 *
 * DE SCHRIJFKANT IS EEN VALKUIL. `PUT /api/settings` is FULL-REPLACE — `writeSettings` zet elk
 * WEGGELATEN veld op `null` — dus een partiele body zou `ftp`, `gewicht`, `weekUren` en
 * `doelStart` legen. `doelStart` schuift mee naar de blokgrens, zodat het nieuwe doel met een
 * eigen blok op Base begint.
 *
 * DEZE FUNCTIE BESTAAT OMDAT DE ASSERTIE NERGENS ANDERS KAN LANDEN: `apps/web` heeft geen
 * render-testinfrastructuur, dus in de component is de verstuurde body niet toetsbaar.
 */
export function doelPassendSettingsPatch<T extends Record<string, unknown>>(
  settings: T,
  voorstel: DoelPassendVoorstel,
): T {
  return {
    ...settings,
    doel: voorstel.voorstelDoel,
    doelStart: voorstel.blokStart,
  };
}

/**
 * EEN VRAAG TEGELIJK OP HET WEEKSCHERM. De event-overname gaat voor de doel-passendheid, en die
 * gaat voor de dosis-trede.
 *
 * GROND VOOR DIE TWEEDE: de dosis ophogen van een doel dat niet bij de uren past is incoherent —
 * dan vraagt de app om MEER van iets waarvan hij net gezegd heeft dat het niet past.
 *
 * DIT LANDT HIER EN NIET IN JSX, want hier is het toetsbaar.
 */
export function kaartPrecedentie<E, D, T>(
  eventOvername: E | null,
  doelPassend: D | null,
  dosisTrede: T | null,
): { eventOvername: E | null; doelPassend: D | null; dosisTrede: T | null } {
  const dp = eventOvername ? null : doelPassend;
  const dt = dp ? null : dosisTrede;
  return { eventOvername, doelPassend: dp, dosisTrede: dt };
}
