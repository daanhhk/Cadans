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
  CYCLING_TYPES,
  DOSIS_TREDE_MAX,
  DOSIS_TREDE_STAP_MIN,
  KWALITEIT_MIN_PER_PRIKKEL,
  KWALITEIT_MIN_PER_PRIKKEL_DEFAULT,
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
import { werkzoneLabelsVan_ } from "./zonelabels";
import {
  actualZone5_,
  bibliotheekSignatuur,
  ZONE5_GRENZEN_DEFAULT,
  type Zone5Key,
} from "./zonemunt";

/** De drie WERKzones waarop geoordeeld wordt, in vaste volgorde. Rust en Duur dragen geen norm:
 * zij zijn vulling om de sleutelsessies heen (DOELEN-SPEC §2A, residu). */
export const WERKZONES: readonly Zone5Key[] = ["tempo", "drempel", "anaeroob"];

/** Vaste bloklengte: drie opbouwweken plus een deload. VAST — een blok dat zichzelf verlengt is niet
 * uit te leggen en maakt het plan onvoorspelbaar (DOELEN-SPEC §2A). */
export const BLOK_WEKEN = 4;
/** Alleen de opbouwweken worden beoordeeld; de deload draagt bewust een lagere dosis. */
export const BLOK_OPBOUWWEKEN = 3;
// De twee kwaliteitsminuten-constanten WONEN NU IN DE ENGINE (packages/engine/src/utils.ts) en
// worden hier alleen doorgegeven, zodat geen enkele bestaande import breekt. Reden voor de
// verhuizing: de dosis-trede-factor is (basis + stap × trede) / basis, en de NORM hier en het
// PLAN in de engine moeten met DEZELFDE factor omhoog (docs/DOSIS-TREDE-RECON.md §3). Staat de
// basis hier en de factor daar, dan leeft die invariant nergens.
export { KWALITEIT_MIN_PER_PRIKKEL, KWALITEIT_MIN_PER_PRIKKEL_DEFAULT };
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
 * DIT IS DE 3:1-MESOTELLER, NIET HET DOEL-BLOK. `BLOK_WEKEN` is 4; `computeMacroPhase` draait een
 * cyclus van 12. Beide tellen weken sinds `doelStart` en delen dus dezelfde INDEX — alleen de
 * cyclus waarop ze die index afbeelden verschilt. Vergelijk de twee dus nooit op blokweek maar op
 * die absolute weekindex; daar staat een assertie op in de selftest.
 *
 * BEWUST de KALENDER-variant, niet `effectiveMesoWeek_`: die pint een doel zonder mesocyclus
 * (Onderhoud) op 1, en dan zou het blok nooit omslaan en bestond er geen blokgrens meer.
 *
 * DST — GEMETEN EN RECHTGEZET. Onder Europe/Amsterdam met doelStart 2026-03-02 geven de maandagen
 * 09-03, 16-03 en 23-03 quotiënt 1,0000 / 2,0000 / 3,0000, maar de maandag ná de voorjaarssprong
 * (30-03-2026) gaf 3,9940 → `Math.floor` leverde 3 in plaats van 4. OORZAAK: de deling ging over
 * een vaste 7×24u-constante terwijl twee lokale middernachten over die sprong een uur korter uit
 * elkaar liggen. RECHTGEZET door eerst het DAGverschil af te ronden en pas daarna door zeven te
 * delen — en TEGELIJK in `weekIndexFromStart_`, want blok-teller en dosis-ramp moeten in de pas
 * blijven: alleen deze spiegel repareren zou het blok naar een andere week laten wijzen dan de
 * ramp. Round op het WEEKquotiënt is géén alternatief; dat springt bij een doel-start midden in
 * de week een halve week te vroeg om.
 */
export function blokWeekVanWeek(
  doelStartISO: string | null,
  weekMondayISO: string,
): number {
  if (!doelStartISO) return 1;
  const s0 = parseLocalDate(doelStartISO);
  const ws = parseLocalDate(weekMondayISO);
  if (Number.isNaN(s0.getTime()) || Number.isNaN(ws.getTime())) return 1;
  const dagen = Math.round((ws.getTime() - s0.getTime()) / MS_PER_DAY);
  const diff = Math.floor(dagen / 7);
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
  /** ZONE-MUNT fase 1b — de norm krijgt een VORM. De schaal blijft `norm`; de drie normen
   * hieronder verdelen diezelfde dosis over de werkzones met de bibliotheek-signatuur. Elk is
   * ÉÉN keer afgerond uit de ONAFGERONDE dosis; hun som is daarom niet noodzakelijk `norm` en
   * die som is ook geen gerapporteerde grootheid — vergelijk hem nergens mee. */
  normTempo: number;
  normDrempel: number;
  normAnaeroob: number;
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
  // ROADMAP stap 2 — de DOSIS-TREDE tilt de minuten per prikkel op met stap × trede. De ENGINE
  // tilt het plan met dezelfde factor op (dosisTredeFactor); norm en plan moeten samen bewegen,
  // anders zakt het plan onder zijn eigen meetlat (docs/DOSIS-TREDE-RECON.md §3). Constanten
  // komen uit de engine, niet uit eigen getallen hier. Weggelaten of 0 → ongewijzigd.
  dosisTrede?: number | null,
  // ROADMAP punt 6 fase 2 — de ZONE-GRENZEN waarop de vorm van de norm wordt afgeleid. OPTIONEEL
  // met de default, want deze functie heeft veel aanroepers die byte-identiek moeten blijven;
  // de aanroepers die de gesynchroniseerde waarde WEL moeten doorgeven krijgen hem verplicht
  // (zie `buildBlokReview`). Zie docs/ZONE-SYNC-BOUWDOC.md §5.
  grenzen: readonly number[] = ZONE5_GRENZEN_DEFAULT,
): BlokDosisNorm | null {
  if (weekUren == null || !Number.isFinite(weekUren) || weekUren <= 0) {
    return null;
  }
  const d = doel ?? "";
  const t = Number(dosisTrede);
  const trede = Number.isFinite(t)
    ? Math.min(DOSIS_TREDE_MAX, Math.max(0, Math.trunc(t)))
    : 0;
  const minPerPrikkel =
    (KWALITEIT_MIN_PER_PRIKKEL[d] ?? KWALITEIT_MIN_PER_PRIKKEL_DEFAULT) +
    DOSIS_TREDE_STAP_MIN * trede;
  // Onderhoud: de FREQUENTIE is het beschermde deel — drie kwaliteitsdagen, ook bij drie uur
  // (DOELEN-SPEC §3.2). Bij de overige doelen schaalt het aantal prikkels met de uren.
  const prikkels =
    d === "Onderhoud" ? 3 : weekUren >= PRIKKEL_UREN_DREMPEL ? 3 : 2;
  // ZONE-MUNT fase 1b — de VORM komt uit de BIBLIOTHEEK-signatuur, niet uit de gerenderde week:
  // `threshold_2x20` vraagt 0 tempo en `sweetspot_2x15` 0 drempel, dus een norm die de week
  // uitleest zwaait mee met de variant-rotatie van de recency-seed (ZONE-MUNT-ONTWERP §3.2). De
  // fracties worden AFGELEID, nooit ingetypt: eigen zones geven vanzelf een eigen vorm.
  const dosis = prikkels * minPerPrikkel;
  const sig = bibliotheekSignatuur(grenzen);
  return {
    prikkels,
    minPerPrikkel,
    norm: Math.round(dosis),
    normTempo: Math.round(dosis * sig.tempo),
    normDrempel: Math.round(dosis * sig.drempel),
    normAnaeroob: Math.round(dosis * sig.anaeroob),
  };
}

export interface WeekKwaliteit {
  rust: number;
  z2: number;
  tempo: number;
  drempel: number;
  anaeroob: number;
  kwaliteit: number;
  ritMinuten: number;
  zoneMinuten: number;
}

/**
 * GELEVERDE zoneminuten van één kalenderweek, uit de activiteiten. Venster
 * [maandag 00:00 .. maandag+7d 00:00) lokaal; alleen fiets-types (CYCLING_TYPES).
 * De route idx15 → `zoneTimesFromCell_` → `actualZone5_` is EXACT die van `buildDoneEntry`
 * (schema.ts), zodat de referent dezelfde grootheid leest als de rest van de app.
 * Een rit zonder zonedata telt wel in `ritMinuten` maar niet in `zoneMinuten` — dat verschil voedt
 * de dekkings-poort in `buildBlokReferent`.
 *
 * ZONE-MUNT fase 1b — VIJF buckets in plaats van drie. HET TOTAAL BEWEEGT GEEN MINUUT: het oude
 * `actualZoneMinutes_` vouwde Z1+Z2 naar `low`, Z3+Z4 naar `high` en Z5..Z7 naar `anaerobic`, en
 * `actualZone5_` vouwt exact dezelfde ids met dezelfde skip van SS en overlays — alleen fijner.
 * `kwaliteit` (tempo + drempel + anaeroob) is daarmee per constructie gelijk aan het oude
 * `high + anaerobic`, en `zoneMinuten` aan het oude `low + high + anaerobic`. De HR-fallback in
 * `actualZoneMinutes_` was hier per constructie DOOD: er ging alleen `icu_zone_times` in en
 * `tryHrZoneTimes_` leest `icu_hr_zone_times`. Nieuw zijn dus uitsluitend de SPLITSING en het
 * OORDEEL dat erop volgt.
 */
export function weekKwaliteitMinuten(
  activities: ActValuesRow[],
  weekMondayISO: string,
): WeekKwaliteit {
  const start = parseLocalDate(weekMondayISO).getTime();
  const eind = start + 7 * MS_PER_DAY;
  let rust = 0;
  let z2 = 0;
  let tempo = 0;
  let drempel = 0;
  let anaeroob = 0;
  let ritMinuten = 0;
  for (const row of activities || []) {
    const d = row?.[0];
    if (!(d instanceof Date)) continue;
    const t = d.getTime();
    if (t < start || t >= eind) continue;
    if (CYCLING_TYPES.indexOf(String(row[1] ?? "")) < 0) continue;
    ritMinuten += Number(row[3]) || 0;
    const zm = actualZone5_(zoneTimesFromCell_(row[15]));
    if (!zm) continue;
    rust += zm.rust;
    z2 += zm.z2;
    tempo += zm.tempo;
    drempel += zm.drempel;
    anaeroob += zm.anaeroob;
  }
  return {
    rust,
    z2,
    tempo,
    drempel,
    anaeroob,
    kwaliteit: tempo + drempel + anaeroob,
    ritMinuten,
    zoneMinuten: rust + z2 + tempo + drempel + anaeroob,
  };
}

export type BlokWeekStatus = "compleet" | "lopend" | "toekomst";

export interface BlokWeek {
  weekMonday: string;
  blokWeek: number;
  /** Het TOTAAL, informatief; het oordeel valt per zone hieronder. */
  gevraagd: number;
  geleverd: number;
  gevraagdTempo: number;
  gevraagdDrempel: number;
  gevraagdAnaeroob: number;
  geleverdTempo: number;
  geleverdDrempel: number;
  geleverdAnaeroob: number;
  /** Rust en Duur dragen geen norm, maar wél de vraag "waar zaten die minuten dan wel". */
  geleverdRust: number;
  geleverdZ2: number;
  /** Hoeveel van de drie werkzones hun eigen norm halen (0..3). */
  zonesOpNorm: number;
  /** ROADMAP punt 14 fase 1 — de WERKZONES waarvan het bewaarde weekplan van DEZE week het
   * nominale label voorschreef. Alleen deze doen aan het oordeel mee. GEMETEN dat het plan
   * nergens alle drie de werkzones programmeert (0 van de 35 cellen), dus een oordeel over alle
   * drie beoordeelt zones die die week nooit gevraagd zijn. Zie docs/PUNT14-BOUWDOC.md §1. */
  zonesVoorgeschreven: Zone5Key[];
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
  /** De drie zone-normen van een OPBOUWweek — de getallen waarop het oordeel valt. De deload
   * schaalt ze per week (zie `BlokWeek.gevraagdTempo` c.s.). */
  normTempo: number;
  normDrempel: number;
  normAnaeroob: number;
  weeks: BlokWeek[];
}

/**
 * De POORTSET van één week: de werkzone-labels die de bewaarde entries van maandag t/m zondag
 * voorschreven. Leeg = geen bewaard plan, en dus geen oordeel (zie `telt`).
 */
function poortsetVoorWeek_(
  weekplans: unknown[] | null | undefined,
  weekMonday: string,
): Zone5Key[] {
  if (!Array.isArray(weekplans)) return [];
  const zondag = shiftIso_(weekMonday, 6);
  const gezien = new Set<Zone5Key>();
  for (const e of weekplans) {
    const o = e as { datum?: unknown; blokken?: unknown };
    if (typeof o?.datum !== "string") continue;
    if (o.datum < weekMonday || o.datum > zondag) continue;
    for (const z of werkzoneLabelsVan_(o.blokken)) gezien.add(z);
  }
  return WERKZONES.filter((z) => gezien.has(z));
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
  /** ROADMAP stap 2 — tilt de norm mee met het plan. Weggelaten of 0 → ongewijzigd. */
  dosisTrede?: number | null;
  /** ROADMAP punt 6 fase 2 — de zone-grenzen; weggelaten → ZONE5_GRENZEN_DEFAULT. */
  grenzen?: readonly number[];
  /** ROADMAP punt 14 fase 1 — de BEWAARDE weekplan-entries. Hieruit komt per week de poortset:
   * welke werkzone-labels het plan van die week voorschreef. Weggelaten → lege poortset → `telt`
   * false, want een week zonder bewaard plan is een DATAGAT en geen misser. */
  weekplans?: unknown[] | null;
}): BlokReferent | null {
  const dosis = blokDosisNorm(
    input.doel,
    input.weekUren,
    input.dosisTrede,
    input.grenzen,
  );
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
    const deload = blokWeek > BLOK_OPBOUWWEKEN && heeftDeload;
    // Elk van de vier gevraagd-waarden schaalt APART en rondt ÉÉN keer af — nooit de afgeronde
    // deelnormen optellen en die som schalen (WERKWIJZE, rond één keer af).
    const schaal = (n: number) =>
      deload ? Math.round(n * mesoFactor(BLOK_WEKEN)) : n;
    const gevraagd = schaal(dosis.norm);
    const gevraagdTempo = schaal(dosis.normTempo);
    const gevraagdDrempel = schaal(dosis.normDrempel);
    const gevraagdAnaeroob = schaal(dosis.normAnaeroob);

    // DE POORTSET van deze week: de nominale werkzone-labels uit de BEWAARDE entries van die
    // zeven dagen. Bewaard en niet herberekend — de entry draagt wat er destijds is gerenderd.
    const zonesVoorgeschreven = poortsetVoorWeek_(input.weekplans, weekMonday);

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
      // ROADMAP punt 14: zonder bewaard weekplan is er geen poortset en dus geen oordeel. Dat is
      // dezelfde lijn als de zonedekking-regel hierboven — een DATAGAT — en uitdrukkelijk NIET
      // dezelfde als "ritMinuten 0 telt WEL mee": niet gereden is een echte misser.
      zonesVoorgeschreven.length > 0 &&
      (k.ritMinuten === 0 ||
        (zoneDekking != null && zoneDekking >= ZONEDATA_DEKKING_MIN));
    // GEEN tolerantiemarge: de ijk-reeks ligt bij vijf uur op 71 tot 121 kwaliteitsminuten met
    // mediaan circa 97 (recon §2.7), dus een marge zou precies in het dichtste deel van de
    // verdeling snijden en het oordeel op ruis laten kantelen.
    //
    // ZONE-MUNT fase 1b — GEEN COMPENSATIE TUSSEN ZONES. Elke werkzone haalt zijn EIGEN norm, of
    // de week valt. Een overschot in tempo dicht nooit een tekort in drempel: dat is precies de
    // grijs-rijden-signatuur die de oude munt (één pot vanaf 76% FTP) als "geleverd" boekte
    // (ZONE-MUNT-ONTWERP §4).
    //
    // ROADMAP punt 14 fase 1 — ALLEEN VOORGESCHREVEN ZONES DOEN MEE. De norm houdt zijn schaal en
    // zijn vorm; wat verandert is wie eraan meedoet. GEMETEN dat herwegen niet helpt: vier
    // norm-vormen leveren alle vier 1 van de 35 cellen op norm, terwijl de poort er 22 van de 35
    // maakt. De poort weert BANDOVERLOOP, geen klein tekort — een voorgeschreven zone telt mee hoe
    // klein het tekort ook is.
    const opNormPerZone = {
      tempo: k.tempo >= gevraagdTempo,
      drempel: k.drempel >= gevraagdDrempel,
      anaeroob: k.anaeroob >= gevraagdAnaeroob,
    };
    const zonesOpNorm = zonesVoorgeschreven.filter(
      (z) => opNormPerZone[z as "tempo" | "drempel" | "anaeroob"],
    ).length;
    const geleverdOk = telt ? zonesOpNorm === zonesVoorgeschreven.length : null;

    weeks.push({
      weekMonday,
      blokWeek,
      gevraagd,
      geleverd: k.kwaliteit,
      gevraagdTempo,
      gevraagdDrempel,
      gevraagdAnaeroob,
      geleverdTempo: k.tempo,
      geleverdDrempel: k.drempel,
      geleverdAnaeroob: k.anaeroob,
      geleverdRust: k.rust,
      geleverdZ2: k.z2,
      zonesOpNorm,
      zonesVoorgeschreven,
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
    normTempo: dosis.normTempo,
    normDrempel: dosis.normDrempel,
    normAnaeroob: dosis.normAnaeroob,
    weeks,
  };
}

export interface BlokUitvoering {
  geleverd: boolean | null;
  geleverdeWeken: number;
  beoordeeldeWeken: number;
  /** ZONE-MUNT fase 1b — de DIAGNOSE, over de MEEGETELDE weken die niet geleverd zijn. De
   * werkzone(s) die daar het vaakst tekortkwamen; bij gelijkstand in de vaste volgorde tempo,
   * drempel, anaeroob. Leeg als er geen zulke weken zijn. */
  tekortZones: Zone5Key[];
  /** De VERKEERDE-INTENSITEIT-signatuur: in minstens de helft van die weken zit een werkzone
   * BOVEN norm terwijl een andere eronder zit — er is genoeg getraind, maar verkeerd verdeeld. */
  verschuiving: boolean;
}

/** Haalt deze week de norm van deze zone? Eén plek, zodat oordeel en diagnose niet uiteenlopen. */
function zoneOpNorm_(w: BlokWeek, z: Zone5Key): boolean {
  return zoneGeleverd_(w, z) >= zoneGevraagd_(w, z);
}

function zoneGeleverd_(w: BlokWeek, z: Zone5Key): number {
  return z === "tempo"
    ? w.geleverdTempo
    : z === "drempel"
      ? w.geleverdDrempel
      : w.geleverdAnaeroob;
}

function zoneGevraagd_(w: BlokWeek, z: Zone5Key): number {
  return z === "tempo"
    ? w.gevraagdTempo
    : z === "drempel"
      ? w.gevraagdDrempel
      : w.gevraagdAnaeroob;
}

/**
 * BELEID, GEEN GEIJKTE DREMPEL. "Minstens de helft" is een COPY-SELECTIEREGEL: hij kiest welke
 * van twee coach-boodschappen past, en beweegt geen enkel oordeel — `geleverdOk` is er niet van
 * afhankelijk. Er valt hier dus NIETS te ijken en er hoort geen reeks bij gezocht te worden
 * (WERKWIJZE: een drempel die de uitkomst stuurt hoort geijkt, een die de woordkeuze stuurt niet).
 */
const VERSCHUIVING_MIN_FRACTIE = 0.5;

/** De UITVOERINGS-uitkomst van een blok. Te weinig beoordeelbare weken → null (zwijgen, M5). */
export function blokUitvoering(ref: BlokReferent): BlokUitvoering {
  const beoordeeld = ref.weeks.filter((w) => w.telt);
  const geleverdeWeken = beoordeeld.filter((w) => w.geleverdOk === true).length;
  const beoordeeldeWeken = beoordeeld.length;
  const geleverd =
    beoordeeldeWeken < BLOK_MIN_BEOORDEELBARE_WEKEN
      ? null
      : geleverdeWeken >= BLOK_GELEVERD_MIN_WEKEN;

  const gemist = beoordeeld.filter((w) => w.geleverdOk === false);
  // ROADMAP punt 14 fase 1 — per week tellen alleen de zones die DIE week voorgeschreven waren.
  // Zonder die beperking zou de diagnose "anaeroob kwam het vaakst tekort" melden in weken waarin
  // het plan geen anaerobe prikkel vroeg.
  const tekortPerZone = WERKZONES.map(
    (z) =>
      gemist.filter(
        (w) => w.zonesVoorgeschreven.includes(z) && !zoneOpNorm_(w, z),
      ).length,
  );
  const maxTekort = Math.max(0, ...tekortPerZone);
  const tekortZones =
    maxTekort > 0
      ? WERKZONES.filter((_, i) => tekortPerZone[i] === maxTekort)
      : [];

  // ROADMAP punt 14 fase 1 — ook hier alleen de zones die die week voorgeschreven waren. Een
  // "overschot" in een zone die het plan niet vroeg is geen verschuiving maar bandoverloop.
  const metVerschuiving = gemist.filter((w) => {
    const zones = w.zonesVoorgeschreven;
    return (
      zones.some((z) => zoneGeleverd_(w, z) > zoneGevraagd_(w, z)) &&
      zones.some((z) => zoneGeleverd_(w, z) < zoneGevraagd_(w, z))
    );
  }).length;
  const verschuiving =
    gemist.length > 0 &&
    metVerschuiving >= gemist.length * VERSCHUIVING_MIN_FRACTIE;

  return {
    geleverd,
    geleverdeWeken,
    beoordeeldeWeken,
    tekortZones: [...tekortZones],
    verschuiving,
  };
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

/** ROADMAP stap 2 — het DOSIS-TREDE-voorstel. Puur: alle poorten zitten in de bouwer, de kaart
 * rendert alleen. `null` betekent GEEN kaart. */
export interface DosisTredeVoorstel {
  /** De trede waarop we nu staan, en waarnaar we zouden gaan. */
  huidig: number;
  volgend: number;
  /** Minuten per sleutelsessie nu en straks, plus de weeknorm die daaruit volgt. */
  minNu: number;
  minStraks: number;
  normNu: number;
  normStraks: number;
  prikkels: number;
  /** Welke tak: gestegen → volgende opbouwtrede; niet gestegen → het plan was te licht. */
  uitkomst: "geleverd_gestegen" | "geleverd_niet_gestegen";
  /** De blokstart van het NU LOPENDE blok — de sleutel die bevestigen én afwijzen wegschrijft. */
  blokStart: string;
  doel: string | null;
}

/**
 * Bouwt het dosis-trede-voorstel, of null. ALLE poorten zitten hier:
 * blokweek 1 én venster-fase "afgerond", een blok-check die er is en "geleverd" zegt, een trede
 * onder het plafond, en nog geen antwoord voor de blokstart van het lopende blok.
 *
 * Afwijzen is een PERSISTENTE actie (blok+doel bij de ongewijzigde trede), niet de lokale
 * afwijs-vlag van FatigueCard/TestVoorstelCard: het voorstel hoort dit blok niet terug te komen,
 * en de volgende blokgrens stelt de vraag vanzelf opnieuw.
 */
export function dosisTredeVoorstel(input: {
  review: BlokReview | null;
  doelStart: string | null;
  weekMondayISO: string;
  doel: string | null;
  weekUren: number | null;
  /** De huidige trede, al gefilterd op doel door de caller. */
  trede: number;
  /** De blokstart waarvoor al een antwoord is weggeschreven, of null. */
  beantwoordBlok: string | null;
}): DosisTredeVoorstel | null {
  // ROADMAP punt 6 fase 2 — GEEN `grenzen`-parameter, en dat is gemeten en niet aangenomen. Dit
  // voorstel toont alleen de SCHAAL (minNu/minStraks en de weeknorm-totalen); een zone-splitsing
  // staat er niet in, dus de grenzen kunnen zijn uitkomst per constructie niet veranderen. Een
  // VERPLICHTE parameter die niets kan doen is een belofte die de functie niet waarmaakt. De
  // grenzen bereiken dit voorstel via de REVIEW: strakkere grenzen laten het blok vallen, de
  // check leest niet-geleverd en het voorstel vervalt. Zie de test in blok.test.ts.
  const r = input.review;
  if (!r || r.fase !== "afgerond") return null;
  if (blokWeekVanWeek(input.doelStart, input.weekMondayISO) !== 1) return null;
  if (!r.check) return null;
  const uitkomst = r.check.uitkomst;
  if (
    uitkomst !== "geleverd_gestegen" &&
    uitkomst !== "geleverd_niet_gestegen"
  ) {
    return null;
  }
  const huidig = Math.max(0, Math.trunc(Number(input.trede) || 0));
  if (huidig >= DOSIS_TREDE_MAX) return null;
  const blokStart = blokStartVoorWeek(input.doelStart, input.weekMondayISO);
  if (input.beantwoordBlok === blokStart) return null;

  const nu = blokDosisNorm(input.doel, input.weekUren, huidig);
  const straks = blokDosisNorm(input.doel, input.weekUren, huidig + 1);
  if (!nu || !straks) return null;

  return {
    huidig,
    volgend: huidig + 1,
    minNu: nu.minPerPrikkel,
    minStraks: straks.minPerPrikkel,
    normNu: nu.norm,
    normStraks: straks.norm,
    prikkels: nu.prikkels,
    uitkomst,
    blokStart,
    doel: input.doel,
  };
}

export interface BlokReview {
  startMonday: string;
  /** Maandag van blokweek 4 van het beoordeelde blok — tevens het CTL-anker. */
  eindMonday: string;
  fase: BlokReviewFase;
  doel: string | null;
  norm: number;
  /** De drie zone-normen van een opbouwweek — waarop het oordeel viel, en wat de copy noemt. */
  normTempo: number;
  normDrempel: number;
  normAnaeroob: number;
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
  /** ROADMAP stap 2 — de dosis-trede tilt de NORM op waartegen dit blok beoordeeld wordt. */
  dosisTrede?: number | null;
  /** ROADMAP punt 14 fase 1 — de BEWAARDE weekplan-entries, VERPLICHT en niet optioneel, om
   * dezelfde reden als `grenzen` hieronder: een optioneel veld valt bij een aanroeper stil weg en
   * dan is het pad dood aan zijn INVOER — de poortset blijft leeg en elke week valt uit het
   * oordeel. */
  weekplans: unknown[] | null;
  /** ROADMAP punt 6 fase 2 — de ZONE-GRENZEN, VERPLICHT en niet optioneel. Een optioneel veld
   * kan bij een aanroeper wegvallen en valt dan STIL terug op de default: precies het
   * dode-invoer-patroon uit docs/WERKWIJZE.md, waarbij de grep naar de aanroep slaagt, de tests
   * groen zijn en de app de gesynchroniseerde waarde toch nooit ziet. Verplicht maakt vergeten
   * een compileerfout. */
  grenzen: readonly number[];
}): BlokReview | null {
  const venster = blokReviewVenster(input.doelStart, input.weekMondayISO);
  if (!venster) return null;

  const ref = buildBlokReferent({
    activities: input.activities,
    doel: input.doel,
    weekUren: input.weekUren,
    startMonday: venster.startMonday,
    todayISO: input.todayISO,
    dosisTrede: input.dosisTrede,
    grenzen: input.grenzen,
    weekplans: input.weekplans,
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
    normTempo: ref.normTempo,
    normDrempel: ref.normDrempel,
    normAnaeroob: ref.normAnaeroob,
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
