// Stap 5a (docs/DOELEN-SPEC.md §6 stap 5; spec in docs/UITVOERINGS-REFERENT-RECON.md §3 + §5) —
// het BLOK-OBJECT, de DOSIS-NORM en de UITVOERINGS-REFERENT. Pure laag, DOM-loos, geen ambient klok:
// elke datum komt als parameter binnen zodat de uitkomst reproduceerbaar is.
//
// De referent beantwoordt de EERSTE van de twee vragen uit §2A: is de dosis geleverd. Niet de tweede
// (heeft het gewerkt) — die hangt aan de blok-check hieronder en zwijgt zonder uitvoering (M5).
//
// DRAGEND (recon §2.2/§2.3): de referent levert GEVRAAGD en GELEVERD apart, nooit hun saldo, en meet
// beide in dezelfde eenheid (GEMETEN zoneminuten). `zoneDebt_` doet precies dat niet — die trekt
// voorgeschreven intent af van gemeten zonetijd en verbergt zijn termen — en blijft ONGEMOEID: hij
// draagt de WEEK-vraag ("niet gedaan") met zijn eigen venster en M63-fork. Week uit de blob, blok uit
// de norm. De engine wordt hier niet aangeraakt (client-only, geen autorisatie gegeven).
import {
  actualZoneMinutes_,
  CYCLING_TYPES,
  mesoFactor,
  profileForDoel_,
  zoneTimesFromCell_,
} from "@cadans/engine";
import type { EventItem, OverrideEntry } from "@cadans/shared";
import type { ActValuesRow } from "./activities";
import { parseLocalDate } from "./dates";
import {
  buildEffectReferent,
  type EffectReferent,
  laatsteGelegenheid,
  type MetingBron,
} from "./effect";
import { NO_BUILD_CTL_DELTA } from "./fatigue";

/** Vaste bloklengte: drie opbouwweken plus een deload. VAST — een blok dat zichzelf verlengt is niet
 * uit te leggen en maakt het plan onvoorspelbaar (DOELEN-SPEC §2A). */
export const BLOK_WEKEN = 4;
/** Alleen de opbouwweken worden beoordeeld; de deload draagt bewust een lagere dosis. */
export const BLOK_OPBOUWWEKEN = 3;
/** Kwaliteitsminuten (high + anaerobic) per sleutelprikkel, per doel. FTP draagt de zwaarste
 * drempel-dosis; Onderhoud is een FREQUENTIE-opgave bij minder uren (DOELEN-SPEC §3.2), dus een
 * kortere prikkel per keer. */
export const KWALITEIT_MIN_PER_PRIKKEL: Record<string, number> = {
  FTP: 28,
  Onderhoud: 22,
};
/** Conditie, Beklimmingen en VO2max: hun dosis-doel draagt óók lange-rit-minuten en week-kJ, en die
 * as wordt in 5a BEWUST niet gebouwd. Deze waarde dekt alleen de kwaliteitskant. */
export const KWALITEIT_MIN_PER_PRIKKEL_DEFAULT = 26;
/** Vanaf dit aantal GEDECLAREERDE weekuren een derde sleutelprikkel (DOELEN-SPEC §3.1). */
export const PRIKKEL_UREN_DREMPEL = 5;
/** Zoveel van de drie opbouwweken op norm telt als "geleverd". */
export const BLOK_GELEVERD_MIN_WEKEN = 2;
/** Minder beoordeelbare weken dan dit → geen oordeel; de app zwijgt liever dan te gokken (M5). */
export const BLOK_MIN_BEOORDEELBARE_WEKEN = 2;
/** Een week waarin wél gereden is maar minder dan deze fractie van de ritminuten zonedata draagt, is
 * niet te beoordelen: de geleverde kant zou stelselmatig te laag uitvallen. */
export const ZONEDATA_DEKKING_MIN = 0.5;

const MS_PER_DAY = 86400000;

/** Lokale datum → yyyy-MM-dd (geen toISOString: dat schuift over de UTC-grens). */
export function isoFrom_(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Lokale middernacht van een yyyy-MM-dd, plus n dagen. */
export function shiftIso_(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  return isoFrom_(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/**
 * De blokweek (1..BLOK_WEKEN) van een gegeven weekmaandag. Spiegel van `weekIndexFromStart_`
 * (packages/engine/src/planner.ts) met de AMBIENT KLOK vervangen door de meegegeven weekmaandag,
 * gevolgd door dezelfde cyclus als `mesoCycleWeek_`.
 *
 * BEWUST de KALENDER-variant, niet `effectiveMesoWeek_`: die pint een doel zonder mesocyclus
 * (Onderhoud) op 1, en dan zou het blok nooit omslaan en bestond er geen blokgrens meer.
 *
 * DST — GECORRIGEERD, de sprong schuift de quotiënt WÉL over een weekgrens. De deling gaat over een
 * vaste 7×24u-constante, dus een 23-uursdag maakt de teller net te klein. GEMETEN onder
 * Europe/Amsterdam met doelStart 2026-03-02: de maandagen 09-03, 16-03 en 23-03 geven quotiënt
 * 1,0000 / 2,0000 / 3,0000, maar de maandag ná de voorjaarssprong (30-03-2026) geeft 3,9940 →
 * `Math.floor` levert 3 in plaats van 4. Die achterstand van één week blijft staan tot de
 * najaarsswitch het uur teruggeeft (26-10-2026 meet weer een ronde 34,0000).
 *
 * Dat gedrag wordt hier BEWUST GEËRFD van `weekIndexFromStart_`: blok-teller en mesoteller moeten in
 * de pas blijven, en de teller zelf woont in de engine (read-only, geen autorisatie). Repareren we
 * het alleen hier, dan wijst het blok naar een andere week dan de dosis-ramp — erger dan de scheefte.
 * De eerstvolgende voorjaarssprong is 28-03-2027, drie weken vóór het A-event; wie de teller dan
 * gelijk wil hebben, repareert `weekIndexFromStart_` in de engine en deze spiegel tegelijk.
 */
export function blokWeekVanWeek(
  doelStartISO: string | null,
  weekMondayISO: string,
): number {
  if (!doelStartISO) return 1;
  const s0 = parseLocalDate(doelStartISO);
  const ws = parseLocalDate(weekMondayISO);
  if (Number.isNaN(s0.getTime()) || Number.isNaN(ws.getTime())) return 1;
  const diff = Math.floor((ws.getTime() - s0.getTime()) / (7 * MS_PER_DAY));
  const index = diff < 0 ? 0 : diff;
  return (((index % BLOK_WEKEN) + BLOK_WEKEN) % BLOK_WEKEN) + 1;
}

/** De maandag van blokweek 1 voor het blok waarin `weekMondayISO` valt. */
export function blokStartVoorWeek(
  doelStartISO: string | null,
  weekMondayISO: string,
): string {
  const bw = blokWeekVanWeek(doelStartISO, weekMondayISO);
  return shiftIso_(weekMondayISO, -(bw - 1) * 7);
}

/** De blokstart van het BLOK ERVOOR (de check kijkt terug op een afgerond blok). */
export function vorigBlokStart(startMonday: string): string {
  return shiftIso_(startMonday, -BLOK_WEKEN * 7);
}

export interface BlokDosisNorm {
  prikkels: number;
  minPerPrikkel: number;
  norm: number;
}

/**
 * De DOSIS-NORM van een blok: een veld van het blok-object, afgeleid uit doel plus GEDECLAREERDE
 * weekuren — niet uit de som van bewaarde weekplannen (recon §2.5: de blob is geen weekdosis).
 * Zonder gedeclareerde uren geen norm en dus straks geen oordeel; de uren zijn MEETLAT-invoer en
 * blijven expliciet GEEN planner-invoer (DOELEN-SPEC §2A).
 */
export function blokDosisNorm(
  doel: string | null,
  weekUren: number | null,
): BlokDosisNorm | null {
  if (weekUren == null || !Number.isFinite(weekUren) || weekUren <= 0) {
    return null;
  }
  const d = doel ?? "";
  const minPerPrikkel =
    KWALITEIT_MIN_PER_PRIKKEL[d] ?? KWALITEIT_MIN_PER_PRIKKEL_DEFAULT;
  // Onderhoud: de FREQUENTIE is het beschermde deel — drie kwaliteitsdagen, ook bij drie uur
  // (DOELEN-SPEC §3.2). Bij de overige doelen schaalt het aantal prikkels met de uren.
  const prikkels =
    d === "Onderhoud" ? 3 : weekUren >= PRIKKEL_UREN_DREMPEL ? 3 : 2;
  return {
    prikkels,
    minPerPrikkel,
    norm: Math.round(prikkels * minPerPrikkel),
  };
}

export interface WeekKwaliteit {
  high: number;
  anaerobic: number;
  kwaliteit: number;
  ritMinuten: number;
  zoneMinuten: number;
}

/**
 * GELEVERDE zoneminuten van één kalenderweek, uit de activiteiten. Venster
 * [maandag 00:00 .. maandag+7d 00:00) lokaal; alleen fiets-types (CYCLING_TYPES).
 * De route idx15 → `zoneTimesFromCell_` → `actualZoneMinutes_` is EXACT die van `buildDoneEntry`
 * (schema.ts), zodat de referent dezelfde grootheid leest als de rest van de app.
 * Een rit zonder zonedata telt wel in `ritMinuten` maar niet in `zoneMinuten` — dat verschil voedt
 * de dekkings-poort in `buildBlokReferent`.
 */
export function weekKwaliteitMinuten(
  activities: ActValuesRow[],
  weekMondayISO: string,
): WeekKwaliteit {
  const start = parseLocalDate(weekMondayISO).getTime();
  const eind = start + 7 * MS_PER_DAY;
  let high = 0;
  let anaerobic = 0;
  let low = 0;
  let ritMinuten = 0;
  for (const row of activities || []) {
    const d = row?.[0];
    if (!(d instanceof Date)) continue;
    const t = d.getTime();
    if (t < start || t >= eind) continue;
    if (CYCLING_TYPES.indexOf(String(row[1] ?? "")) < 0) continue;
    ritMinuten += Number(row[3]) || 0;
    const iczt = zoneTimesFromCell_(row[15]);
    const zm = actualZoneMinutes_({ icu_zone_times: iczt }, null) as {
      low: number;
      high: number;
      anaerobic: number;
    } | null;
    if (!zm) continue;
    low += zm.low;
    high += zm.high;
    anaerobic += zm.anaerobic;
  }
  return {
    high,
    anaerobic,
    kwaliteit: high + anaerobic,
    ritMinuten,
    zoneMinuten: low + high + anaerobic,
  };
}

export type BlokWeekStatus = "compleet" | "lopend" | "toekomst";

export interface BlokWeek {
  weekMonday: string;
  blokWeek: number;
  gevraagd: number;
  geleverd: number;
  geleverdHigh: number;
  geleverdAnaerobic: number;
  ritMinuten: number;
  zoneDekking: number | null;
  status: BlokWeekStatus;
  telt: boolean;
  geleverdOk: boolean | null;
}

export interface BlokReferent {
  startMonday: string;
  weken: number;
  doel: string | null;
  weekUren: number | null;
  prikkelsPerWeek: number;
  norm: number;
  weeks: BlokWeek[];
}

/**
 * De UITVOERINGS-REFERENT over één blok: per week GEVRAAGD en GELEVERD APART (recon §3 punt 3).
 * Norm ontbreekt → null (geen oordeel).
 */
export function buildBlokReferent(input: {
  activities: ActValuesRow[];
  doel: string | null;
  weekUren: number | null;
  startMonday: string;
  todayISO: string;
}): BlokReferent | null {
  const dosis = blokDosisNorm(input.doel, input.weekUren);
  if (!dosis) return null;
  // Doel zonder mesocyclus → geen kalender-deload, dus ook blokweek 4 draagt de volle norm.
  const heeftDeload = profileForDoel_(input.doel ?? "")?.mesoCyclus !== false;

  const weeks: BlokWeek[] = [];
  for (let i = 0; i < BLOK_WEKEN; i++) {
    const weekMonday = shiftIso_(input.startMonday, i * 7);
    const blokWeek = i + 1;
    // De opbouwweken krijgen een VLAKKE norm: de meso-ramp (1,08/1,15) beweegt zeven minuten over
    // drie weken terwijl de uitvoering week op week 27 minuten varieert (recon §2.6) — meebewegen
    // zou ruis bemonsteren. Blokweek 4 krijgt norm × mesoFactor(4): een INFORMATIEVE waarde uit
    // dezelfde bron als de engine-ramp, die niet in het oordeel meetelt (telt = false).
    const gevraagd =
      blokWeek > BLOK_OPBOUWWEKEN && heeftDeload
        ? Math.round(dosis.norm * mesoFactor(BLOK_WEKEN))
        : dosis.norm;

    const k = weekKwaliteitMinuten(input.activities, weekMonday);
    const zondag = shiftIso_(weekMonday, 6);
    // Datums zijn yyyy-MM-dd → lexicografische vergelijking is chronologisch.
    const status: BlokWeekStatus =
      zondag < input.todayISO
        ? "compleet"
        : weekMonday <= input.todayISO
          ? "lopend"
          : "toekomst";
    const zoneDekking = k.ritMinuten > 0 ? k.zoneMinuten / k.ritMinuten : null;
    // Een week met ritMinuten 0 telt WEL mee: niet gereden is een echte misser, geen datagat.
    // Een week mét ritten maar te weinig zonedata telt NIET: die is niet te beoordelen.
    const telt =
      status === "compleet" &&
      blokWeek <= BLOK_OPBOUWWEKEN &&
      (k.ritMinuten === 0 ||
        (zoneDekking != null && zoneDekking >= ZONEDATA_DEKKING_MIN));
    // GEEN tolerantiemarge: de ijk-reeks ligt bij vijf uur op 71 tot 121 kwaliteitsminuten met
    // mediaan circa 97 (recon §2.7), dus een marge zou precies in het dichtste deel van de
    // verdeling snijden en het oordeel op ruis laten kantelen.
    const geleverdOk = telt ? k.kwaliteit >= gevraagd : null;

    weeks.push({
      weekMonday,
      blokWeek,
      gevraagd,
      geleverd: k.kwaliteit,
      geleverdHigh: k.high,
      geleverdAnaerobic: k.anaerobic,
      ritMinuten: k.ritMinuten,
      zoneDekking,
      status,
      telt,
      geleverdOk,
    });
  }

  return {
    startMonday: input.startMonday,
    weken: BLOK_WEKEN,
    doel: input.doel,
    weekUren: input.weekUren,
    prikkelsPerWeek: dosis.prikkels,
    norm: dosis.norm,
    weeks,
  };
}

export interface BlokUitvoering {
  geleverd: boolean | null;
  geleverdeWeken: number;
  beoordeeldeWeken: number;
}

/** De UITVOERINGS-uitkomst van een blok. Te weinig beoordeelbare weken → null (zwijgen, M5). */
export function blokUitvoering(ref: BlokReferent): BlokUitvoering {
  const beoordeeld = ref.weeks.filter((w) => w.telt);
  const geleverdeWeken = beoordeeld.filter((w) => w.geleverdOk === true).length;
  const beoordeeldeWeken = beoordeeld.length;
  const geleverd =
    beoordeeldeWeken < BLOK_MIN_BEOORDEELBARE_WEKEN
      ? null
      : geleverdeWeken >= BLOK_GELEVERD_MIN_WEKEN;
  return { geleverd, geleverdeWeken, beoordeeldeWeken };
}

/**
 * Mag de EFFECT-kant van de blok-check voor dit doel vuren? Gate op de PROFIEL-vlag, niet op de
 * doelnaam (zelfde lijn als `weekFatigueEnabled`). Bij Onderhoud is de proces-meter NIET de CTL:
 * die HOORT te dalen bij minder uren — dat is het doel, geen signaal (DOELEN-SPEC §3.2). Daar
 * levert de referent dus alleen de uitvoerings-uitkomst. Onbekend doel valt fail-open naar true.
 */
export function blokCheckEnabled(doel: string | null | undefined): boolean {
  return profileForDoel_(doel ?? "")?.mesoCyclus !== false;
}

export type BlokUitkomst =
  | "niet_geleverd"
  | "geleverd_gestegen"
  | "geleverd_niet_gestegen";

export interface BlokCheck {
  uitkomst: BlokUitkomst;
  geleverdeWeken: number;
  beoordeeldeWeken: number;
  ctlDelta: number;
  gestegen: boolean;
}

/**
 * De BLOK-CHECK met drie uitkomsten (DOELEN-SPEC §2A). Uitvoering EERST: zonder een uitvoerings-
 * oordeel is de effect-vraag betekenisloos en zwijgt de app.
 *
 * VERWACHT GEDRAG (recon §6): de tak "niet_geleverd" vuurt bij deze gebruiker vrijwel nooit — de
 * uitvoering ligt structureel BOVEN het plan (blok-som 416 geleverd tegen 159 gepland) terwijl de
 * CTL daalt. De LEVENDE tak is "geleverd_niet_gestegen": geleverd, maar niet gestegen, dus het plan
 * was te licht. Dat stuurt straks de copy — die moet de levende tak dragen, niet het vangnet.
 */
export function blokCheck(
  ref: BlokReferent,
  ctlDelta: number | null,
  doel: string | null,
): BlokCheck | null {
  if (!blokCheckEnabled(doel)) return null;
  const u = blokUitvoering(ref);
  if (u.geleverd == null) return null;
  if (ctlDelta == null || !Number.isFinite(ctlDelta)) return null;
  // BEWUST dezelfde drempel als de doortrain-kaart: één signaal, één getal. Stap 7 consolideert
  // beide onder de weeklus; tot die tijd zou een eigen drempel hier stilzwijgend uiteenlopen.
  const gestegen = ctlDelta > NO_BUILD_CTL_DELTA;
  const uitkomst: BlokUitkomst = !u.geleverd
    ? "niet_geleverd"
    : gestegen
      ? "geleverd_gestegen"
      : "geleverd_niet_gestegen";
  return {
    uitkomst,
    geleverdeWeken: u.geleverdeWeken,
    beoordeeldeWeken: u.beoordeeldeWeken,
    ctlDelta,
    gestegen,
  };
}

// ── 5a-ii — de BLOK-REVIEW-kaart ─────────────────────────────────────────────

export type BlokReviewFase = "lopend" | "afgerond";

export interface BlokReviewVenster {
  startMonday: string;
  ctlAnker: string;
  fase: BlokReviewFase;
}

/**
 * WELK blok wordt beoordeeld, en mag de kaart nu verschijnen? Alleen het meest recente blok waarvan
 * alle DRIE de opbouwweken compleet zijn, en alleen op twee momenten:
 *  - blokweek 4 (de deload loopt): het blok waarin we zitten → fase "lopend".
 *  - blokweek 1 (het nieuwe blok begint): het blok ervóór → fase "afgerond".
 * Elke andere blokweek → null: dan zijn de opbouwweken nog niet af en zou de kaart een halve week
 * beoordelen.
 *
 * `ctlAnker` is ALTIJD de maandag van blokweek 4 van het BEOORDEELDE blok. `computeBlockCtlDelta`
 * meet [anker−22 .. anker−1], dus precies de drie opbouwweken. Zou je de HUIDIGE maandag als anker
 * nemen, dan meet je in blokweek 1 opbouwweek 2, opbouwweek 3 en de deload — de verkeerde drie
 * weken, en de deload drukt de ΔCTL stelselmatig omlaag.
 */
export function blokReviewVenster(
  doelStartISO: string | null,
  weekMondayISO: string,
): BlokReviewVenster | null {
  const bw = blokWeekVanWeek(doelStartISO, weekMondayISO);
  const huidigeStart = blokStartVoorWeek(doelStartISO, weekMondayISO);
  if (bw === BLOK_WEKEN) {
    return {
      startMonday: huidigeStart,
      ctlAnker: weekMondayISO,
      fase: "lopend",
    };
  }
  if (bw === 1) {
    return {
      startMonday: vorigBlokStart(huidigeStart),
      ctlAnker: shiftIso_(weekMondayISO, -7),
      fase: "afgerond",
    };
  }
  return null;
}

export interface BlokReview {
  startMonday: string;
  /** Maandag van blokweek 4 van het beoordeelde blok — tevens het CTL-anker. */
  eindMonday: string;
  fase: BlokReviewFase;
  doel: string | null;
  norm: number;
  weekUren: number | null;
  weeks: BlokWeek[];
  uitvoering: BlokUitvoering;
  /** null bij een niet-opbouwdoel (Onderhoud): daar is de CTL geen proces-meter. */
  check: BlokCheck | null;
  ctlDelta: number | null;
  /** 5b-i — de EFFECT-referent op `rolling_ftp`. null als de vraag niet geldig of niet te
   * beantwoorden is: fase "lopend", uitvoering niet geleverd, of te weinig dekking. */
  effect: EffectReferent | null;
  /** 5b-ii — de LAATSTE maximale inspanning over de hele historie t/m vandaag, of null. ALTIJD
   * gevuld, ook als `effect` null is: de copy noemt 'm ook wanneer er geen effect-uitspraak is. */
  laatsteMeting?: { bron: MetingBron; datum: string } | null;
}

/**
 * De BLOK-REVIEW: het venster, de referent, de uitvoering en (bij een opbouwdoel) de check in één
 * object voor laag 2. Zwijgt (null) als er geen venster is, geen norm, of te weinig beoordeelbare
 * weken — dan heeft de app niets te zeggen (M5).
 *
 * `ctlDelta` komt van de CALLER, die 'm ophaalt met `computeBlockCtlDelta(wellness, venster.ctlAnker)`.
 * Daarom is `blokReviewVenster` apart geëxporteerd: het anker is nodig vóór de review bestaat. Deze
 * functie parseert zelf geen wellness — dat houdt de laag puur en de eenheid ondubbelzinnig.
 */
export function buildBlokReview(input: {
  activities: ActValuesRow[];
  doel: string | null;
  weekUren: number | null;
  doelStart: string | null;
  weekMondayISO: string;
  todayISO: string;
  ctlDelta: number | null;
  /** 5b-i — voeden de gelegenheid-detectie. Optioneel: bestaande aanroepen blijven compileren. */
  events?: EventItem[];
  overrides?: OverrideEntry[];
}): BlokReview | null {
  const venster = blokReviewVenster(input.doelStart, input.weekMondayISO);
  if (!venster) return null;

  const ref = buildBlokReferent({
    activities: input.activities,
    doel: input.doel,
    weekUren: input.weekUren,
    startMonday: venster.startMonday,
    todayISO: input.todayISO,
  });
  if (!ref) return null;

  const uitvoering = blokUitvoering(ref);
  if (uitvoering.geleverd == null) return null;

  // 5b-i — de EFFECT-referent achter TWEE harde poorten.
  // (1) Alleen fase "afgerond" (blokweek 1): in fase "lopend" is het vier-weeks venster nog niet
  //     compleet en staat de test nog in blokweek 4, dus een maximum kan er nog bij komen.
  // (2) Alleen bij een GELEVERDE uitvoering: effect zonder uitvoering is betekenisloos
  //     (ontwerp §6, M5 — de app zwijgt liever dan te gokken).
  const effect =
    venster.fase === "afgerond" && uitvoering.geleverd === true
      ? buildEffectReferent({
          activities: input.activities,
          events: input.events ?? [],
          overrides: input.overrides ?? [],
          startMonday: venster.startMonday,
          // Dezelfde ctlDelta die de caller al meegaf voedt de dosis-term: geen tweede signaal.
          ctlDelta: input.ctlDelta,
        })
      : null;

  return {
    startMonday: venster.startMonday,
    eindMonday: venster.ctlAnker,
    fase: venster.fase,
    doel: input.doel,
    norm: ref.norm,
    weekUren: input.weekUren,
    weeks: ref.weeks,
    uitvoering,
    check: blokCheck(ref, input.ctlDelta, input.doel),
    ctlDelta: input.ctlDelta,
    effect,
    laatsteMeting: laatsteGelegenheid({
      activities: input.activities,
      events: input.events ?? [],
      overrides: input.overrides ?? [],
      totISO: input.todayISO,
    }),
  };
}
