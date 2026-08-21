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
  computeMacroPhase,
  DOSIS_TREDE_MAX,
  DOSIS_TREDE_STAP_MIN,
  KWALITEIT_MIN_PER_PRIKKEL,
  KWALITEIT_MIN_PER_PRIKKEL_DEFAULT,
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
  planZone5_,
  ZONE5_GRENZEN_DEFAULT,
  type Zone5Key,
} from "./zonemunt";

/** De drie WERKzones waarop geoordeeld wordt, in vaste volgorde. Rust en Duur dragen geen norm:
 * zij zijn vulling om de sleutelsessies heen (DOELEN-SPEC §2A, residu). */
export const WERKZONES: readonly Zone5Key[] = ["tempo", "drempel", "anaeroob"];

/**
 * ROADMAP PUNT 16 — DE MATERIALITEITSVLOER, in plan-minuten per week en per zone.
 *
 * Een werkzone telt pas mee in de poortset als het PLAN er minstens zoveel minuten van
 * voorschrijft. HERKOMST: GEIJKT op een plateau, niet gekozen — zie het N-ijkingsblok in het
 * CC-rapport van punt 16 en `tools/punt16/meet.mjs`, dat de as 0 tot 10 minuten doorrekent over
 * 105 blok-cellen en per stap telt hoeveel cellen als geleverd lezen bij uitvoeringsschaal 1,00
 * en 0,95.
 */
export const MATERIALITEIT_MIN_MINUTEN = 4;

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

/** ROADMAP punt 28 — de MAANDAG van de week waarin deze datum valt.
 *
 * `doelStart` hoeft geen maandag te zijn: het is een vrij datumveld in Instellingen, en oudere
 * waarden staan er nog op een willekeurige dag. De poort in `blokReviewVenster` vergelijkt
 * blok-starts (altijd maandagen) met deze datum, dus zonder uitlijning zou een `doelStart` op
 * woensdag een blok dat op de maandag ervoor begon ten onrechte laten passeren.
 *
 * Lokaal gerekend, net als `todayIso` in `dates.ts` — nooit `toISOString`, dat schuift 's avonds
 * in NL naar de volgende dag. Zondag (0) telt als dag 7, dus −6; anders 1 − dow. */
function weekMondayVan_(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dag = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  const dow = dag.getDay();
  const mon = new Date(
    dag.getFullYear(),
    dag.getMonth(),
    dag.getDate() + (dow === 0 ? -6 : 1 - dow),
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
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
  // ROADMAP punt 15 fase 2 — DE MACROFASE van de week waarover geoordeeld wordt. OPTIONEEL, en
  // met opzet: deze functie heeft aanroepers die byte-identiek moeten blijven, en zonder fase
  // valt hij terug op precies het oude gedrag. De aanroepers die de fase WEL kennen geven hem
  // door. Zie docs/PUNT15-FASE2-BOUWDOC.md §4.
  fase?: string | null,
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
  //
  // ROADMAP punt 15 fase 2 — HET FASE-QUOTUM BEGRENST DE NORM. `kwaliteitPerWeek.Peak` is 2 bij
  // `ftp`, `conditie`, `klim_kort` en `klim_lang`, terwijl deze norm 3 prikkels rekende zodra
  // `weekUren` >= PRIKKEL_UREN_DREMPEL. Het plan kon zijn eigen meetlat daar per constructie niet
  // halen: op weekvorm V1 in Peak valt bij zowel FTP als Korte beklimmingen dezelfde derde
  // kwaliteitsdag weg, en FTP zakt van 94,9 werkminuten in Build naar 70,0 in Peak. GEMETEN over
  // 5 doelen x 3 fases x 9 weekvormen: in Peak lagen FTP 9 van 9, Conditie 9 van 9, Korte
  // beklimmingen 9 van 9 en Lange beklimmingen 7 van 9 cellen onder de norm.
  //
  // HERKOMST: PLAN. Het quotum staat in `PROFILES` en komt uit DOELEN-SPEC, niet uit een reeks —
  // hier valt dus niets te ijken.
  //
  // DE TERUGVAL IS DRAGEND. `kwaliteitPerWeek` kent Base, Build en Peak en GEEN Test, terwijl
  // `computeMacroPhase` in week 12 "Test" teruggeeft en de referent ook voor blokweek 4 een
  // `gevraagd` uitrekent. Zonder terugval levert `Math.min(undefined, 3)` NaN op de kaart. Deze
  // val heeft bij punt 9 fase A al een keer toegeslagen — daar viel de blokteller dood op "Test".
  const urenPrikkels = weekUren >= PRIKKEL_UREN_DREMPEL ? 3 : 2;
  const quotumRuw = fase
    ? (
        profileForDoel_(d)?.kwaliteitPerWeek as
          | Record<string, number>
          | undefined
      )?.[fase]
    : undefined;
  const quotum =
    typeof quotumRuw === "number" && Number.isFinite(quotumRuw)
      ? quotumRuw
      : urenPrikkels;
  const prikkels = d === "Onderhoud" ? 3 : Math.min(quotum, urenPrikkels);
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

/** Eén zone-regel van één blokweek. `norm` null = niet in de effectieve poort, dus niet
 * beoordeeld: de kaart toont dan een streepje en NEUTRALE kleur, nooit waarschuwkleur. */
export interface BlokZoneRegel {
  zone: Zone5Key;
  geleverd: number;
  norm: number | null;
}

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
  /** ROADMAP punt 17 — de ONAFGERONDE plan-zoneminuten van DEZE week, uit de eigen bewaarde
   * entries. Dit zijn de waarden waarop het oordeel valt; `gevraagdTempo` c.s. hierboven zijn
   * dezelfde grootheden, één keer afgerond voor het scherm. Ze staan er als DATA zodat een
   * volgende ronde kan zien waartegen er gemeten is zonder het plan opnieuw te vouwen. */
  planTempo: number;
  planDrempel: number;
  planAnaeroob: number;
  planWerk: number;
  /** Rust en Duur dragen geen norm, maar wél de vraag "waar zaten die minuten dan wel". */
  geleverdRust: number;
  geleverdZ2: number;
  /** Hoeveel van de drie werkzones hun eigen norm halen (0..3). */
  zonesOpNorm: number;
  /** ROADMAP punt 14 — de WERKZONES waarop deze week beoordeeld wordt. GEMETEN dat het plan
   * nergens alle drie de werkzones programmeert (0 van de 35 cellen), dus een oordeel over alle
   * drie beoordeelt zones die die week nooit gevraagd zijn. Zie docs/PUNT14-BOUWDOC.md §1. */
  zonesVoorgeschreven: Zone5Key[];
  /** ROADMAP punt 15 fase 2 — HAALT DE SOM VAN DE WERKMINUTEN DE TOTAALNORM? `null` zodra `telt`
   * false is, net als `geleverdOk`: geen oordeel is geen misser. GEMETEN waarom dit ERBIJ moet en
   * niet IN de poort: in 98 van de 105 cellen ligt de som van de zone-normen BINNEN de poortset
   * lager dan de totaalnorm, en 24 van de 135 cellen lazen GELEVERD terwijl de werkminuten onder
   * hun eigen totaalnorm lagen — scherpst Korte beklimmingen in Peak, effectieve eis 34 tegen een
   * norm van 78. De norm-massa van de zones die buiten de poort vallen verdampte zonder dat iets
   * dat merkte. Zie docs/PUNT15-FASE2-BOUWDOC.md §1 M3. */
  totaalOpNorm: boolean | null;
  /** FASE 1c — DE PER-ZONE REGELS VAN DEZE WEEK, als DATA. De kaart leidt hier niets meer af:
   * `norm` null betekent "deze zone is niet beoordeeld" en dat is het enige signaal dat de
   * render nodig heeft. Reden dat dit uit de lib komt en niet uit de kaart: `weekZones_` gaf
   * alle drie de zones onvoorwaardelijk terug, dus een niet-beoordeelde zone stond in
   * waarschuwkleur naast een noemer die haar niet meetelde — twee uitspraken over dezelfde week
   * op één scherm. Zelfde vorm als het blok-totaal in die kaart al draagt. */
  zoneRegels: BlokZoneRegel[];
  /** FASE 1b — WAAROP die poort rust. "week" = deze week draagt een eigen bewaard plan; "blok" =
   * hij valt terug op de vereniging over het blok; "geen" = nergens in het blok staat een plan.
   * Machineleesbaar en geen copy: een volgende ronde moet kunnen zien waarop een oordeel rustte. */
  poortHerkomst: "week" | "blok" | "geen";
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
  grenzen: readonly number[],
  materialiteitMin: number,
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
  // ROADMAP PUNT 16 — DE MATERIALITEITSVLOER. Een werkzone komt pas in de poortset als het PLAN
  // er minstens `materialiteitMin` minuten van voorschrijft. Zonder die vloer opent één enkele
  // minuut in een zone een volwaardige norm-eis, en dan laat een prikkel van drie minuten de
  // gebruiker zakken op een zone die het plan nauwelijks vraagt.
  //
  // DE VLOER STAAT HIER EN NIET BIJ EEN AANROEPER, en dat is dragend: deze functie heeft er TWEE
  // — de blokpoort op `:550` en de eigen weekpoort op `:592`. Een vloer op één van beide bijt
  // maar half, en dan hangt het oordeel ervan af welke poort die week toevallig wint.
  const plan = planZonesVoorWeek_(weekplans, weekMonday, grenzen);
  return WERKZONES.filter((z) => gezien.has(z) && plan[z] >= materialiteitMin);
}

/** ROADMAP punt 17 — HET OORDEEL VALT OP DE GETOONDE HELE MINUUT. Er is dus geen tolerantie
 * meer: `Math.round` van de geleverde minuten tegen `gevraagd*`, en dat laatste draagt al de ENE
 * afronding van zijn eigen onafgeronde plan-waarde.
 *
 * DE GROND IS DE KAART, niet de rekenkunde. De terugblik toont hele minuten. Een meetlat die
 * fijner onderscheidt dan de kaart kan tonen produceert een zichtbare tegenspraak: GEMETEN op het
 * doel-passend-scherm stond er `VO2max 8/8` naast een teller `0/2`, en `VO2max 16/16` naast `1/2`.
 * Twee getallen die gelijk zijn en een teller die zegt van niet — op één regel, op één scherm.
 * Ronden beide kanten op dezelfde korrel af, dan kan dat per constructie niet meer.
 *
 * DAT KOST GEEN GEVOELIGHEID, en dat is gemeten en niet aangenomen. De kwantisering van de bron
 * ligt chat-zijde op ten hoogste 0,600 seconde per zone en 0,400 seconde op het totaal, over 3645
 * zone-cellen — ruim binnen één minuut afronding. En over het HELE bereik van 0,6 tot 60 seconde
 * tolerantie bewoog geen enkele cel: de vraag welke tolerantie je kiest was leeg, de vraag op
 * welke KORREL je oordeelt niet. Wat de toetsen aantonen zakt met tientallen minuten, niet met
 * seconden.
 *
 * HET TOTAAL RONDT ÉÉN KEER AF, op de som: `werkTotaal` blijft de ONAFGERONDE optelling van de
 * drie zones en gaat pas daarna door `Math.round`. Nooit een som van afgeronde delen
 * (WERKWIJZE, rond één keer af) — anders loopt het totaal tot anderhalve minuut uit de pas met
 * zijn eigen zones.
 *
 * SINDS ROADMAP PUNT 33 IS DIT DE ENIGE PLEK WAAR DEZE VERGELIJKING VALT. Zowel het oordeel in
 * dit bestand — de drie zones, het totaal en `zoneOpNorm_` — als de KLEUR op `BlokReviewCard`
 * leest `haaltNorm`. Daarvóór stond dezelfde regel op zeven plekken in twee bestanden, en de
 * kaart had geen vangnet: een van die zeven kon stil uit de pas lopen en dan beweerde de kleur
 * iets anders dan het cijfer ernaast. */
export function haaltNorm(geleverd: number, norm: number): boolean {
  return Math.round(geleverd) >= norm;
}

/** ROADMAP punt 17 — de PLAN-ZONEMINUTEN van één week, ONAFGEROND. Zelfde venster en zelfde bron
 * als `poortsetVoorWeek_` hierboven: de BEWAARDE entries van maandag t/m zondag. Geen tweede
 * leesroute, want twee routes naar hetzelfde plan lopen uit elkaar zodra er één verandert.
 *
 * Afronden gebeurt bij de AANROEPER en precies één keer per grootheid — `planZone5_` draagt die
 * regel al in zijn eigen doc. Het OORDEEL leest de onafgeronde waarden; de afgeronde zijn voor
 * het scherm. */
function planZonesVoorWeek_(
  weekplans: unknown[] | null | undefined,
  weekMonday: string,
  grenzen: readonly number[],
): { tempo: number; drempel: number; anaeroob: number; werk: number } {
  const leeg = { tempo: 0, drempel: 0, anaeroob: 0, werk: 0 };
  if (!Array.isArray(weekplans)) return leeg;
  const zondag = shiftIso_(weekMonday, 6);
  const rauw: unknown[] = [];
  for (const e of weekplans) {
    const o = e as { datum?: unknown; blokken?: unknown };
    if (typeof o?.datum !== "string") continue;
    if (o.datum < weekMonday || o.datum > zondag) continue;
    if (Array.isArray(o.blokken)) rauw.push(...o.blokken);
  }
  const zm = planZone5_(rauw, grenzen);
  return {
    tempo: zm.tempo,
    drempel: zm.drempel,
    anaeroob: zm.anaeroob,
    werk: zm.tempo + zm.drempel + zm.anaeroob,
  };
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
  /** ROADMAP punt 16 — de MATERIALITEITSVLOER in plan-minuten per zone per week. Weggelaten →
   * `MATERIALITEIT_MIN_MINUTEN`. Zelfde idioom als `grenzen` en `dosisTrede`: een expliciete,
   * optionele term, zodat de N-ijking hem kan variëren zonder de constante aan te raken. */
  materialiteitMin?: number;
  /** ROADMAP punt 14 fase 1 — de BEWAARDE weekplan-entries. Hieruit komt per week de poortset:
   * welke werkzone-labels het plan van die week voorschreef. Weggelaten → lege poortset → `telt`
   * false, want een week zonder bewaard plan is een DATAGAT en geen misser. */
  weekplans?: unknown[] | null;
  /** ROADMAP punt 15 fase 2 — de doelstart, waaruit de MACROFASE van dit blok volgt. VERPLICHT en
   * niet optioneel, om dezelfde reden als `grenzen` en `weekplans`: een optioneel veld valt bij
   * een aanroeper stil weg, en dan valt de norm stil terug op het oude quotum terwijl de grep naar
   * de aanroep slaagt en de tests groen zijn — het dode-invoer-patroon uit docs/WERKWIJZE.md. */
  doelStart: string | null;
}): BlokReferent | null {
  // ROADMAP punt 15 fase 2 — DE FASE PER OPBOUWWEEK. `computeMacroPhase` neemt DATE-objecten,
  // geen ISO-strings. Het 12-weekse fase-raster en het 4-weekse blokraster tellen allebei vanaf
  // `doelStart`, dus de drie opbouwweken van een blok vallen per constructie in ÉÉN fase (1-3
  // Base, 5-7 Build, 9-11 Peak); alleen blokweek 4 van het derde blok raakt Test. Dat wordt in
  // zonepoort/punt15-tests geasserteerd, niet aangenomen.
  const faseVanWeek = (weekMonday: string): string | null => {
    if (!input.doelStart) return null;
    const s = parseLocalDate(input.doelStart);
    const w = parseLocalDate(weekMonday);
    if (!s || !w) return null;
    return (computeMacroPhase(s, w) as { fase?: string })?.fase ?? null;
  };
  const dosis = blokDosisNorm(
    input.doel,
    input.weekUren,
    input.dosisTrede,
    input.grenzen,
    faseVanWeek(input.startMonday),
  );
  // `dosis` blijft de POORT (norm ontbreekt → geen oordeel) en levert `prikkelsPerWeek`. Sinds
  // punt 17 draagt hij het oordeel niet meer: hij is DOSIS-DOEL en geen rechter. `blokDosisNorm`
  // zelf blijft ongewijzigd, inclusief signatuur — `dosisTredeVoorstel` leest hem.
  if (!dosis) return null;

  // FASE 1b/1d — DE BLOKPOORT: de VERENIGING van de labels over de bewaarde weekplannen van de
  // OPBOUWWEKEN. Nodig omdat de rijen er lang niet altijd staan; zonder terugval zwijgt de
  // terugblik volledig, en dat is precies wat de shots van fase 1 lieten zien. Binnen één blok
  // liggen doel en fase vast, dus een opbouwweek is bewijs uit dezelfde bron.
  //
  // FASE 1d — DE DELOADWEEK LEVERT GEEN BEWIJS. Zijn sessies zijn korter en heten nominaal vaker
  // tempo, dus als ENIGE bron vertekent hij de poort. GEMETEN op prod: het blok 2026-06-29 t/m
  // 2026-07-20 droeg alleen het plan van de deloadweek, poortset {tempo}. De blokpoort werd
  // daarmee {tempo}, en met tempo 58, 68 en 67 tegen norm 24 las elke week als geleverd — terwijl
  // drempel op 37, 21 en 35 tegen 47 stond. De poort poortte dus precies de zone met het
  // OVERSCHOT en dempte de zone met het TEKORT, en het blok zou een dosisverhoging hebben
  // uitgelokt. Een poort kan een oordeel OMKEREN, niet alleen afzwakken.
  //
  // FASE 1d — TE DUN BEWIJS IS ZWIJGEN. Dragen minder dan BLOK_MIN_BEOORDEELBARE_WEKEN
  // opbouwweken een bewaard plan, dan blijft de blokpoort LEEG. Dat is dezelfde minimum-bewijslast
  // die het oordeel zelf al draagt (zie `beoordeeldeWeken` hieronder), nu ook op de poort: poort
  // en oordeel krijgen zo dezelfde span. Geen nieuwe constante.
  const blokPoort = (() => {
    const gezien = new Set<Zone5Key>();
    let metPlan = 0;
    for (let i = 0; i < BLOK_OPBOUWWEKEN; i++) {
      const m = shiftIso_(input.startMonday, i * 7);
      const poort = poortsetVoorWeek_(
        input.weekplans,
        m,
        input.grenzen ?? ZONE5_GRENZEN_DEFAULT,
        input.materialiteitMin ?? MATERIALITEIT_MIN_MINUTEN,
      );
      if (poort.length === 0) continue;
      metPlan++;
      for (const z of poort) gezien.add(z);
    }
    if (metPlan < BLOK_MIN_BEOORDEELBARE_WEKEN) return [];
    return WERKZONES.filter((z) => gezien.has(z));
  })();

  const weeks: BlokWeek[] = [];
  for (let i = 0; i < BLOK_WEKEN; i++) {
    const weekMonday = shiftIso_(input.startMonday, i * 7);
    const blokWeek = i + 1;
    // ROADMAP punt 17 — DE REFERENT IS PLAN-RELATIEF. Wat gevraagd werd is wat het plan van DEZE
    // week voorschreef, niet een doel-breed getal. GEMETEN waarom (docs/PUNT17-BOUWDOC.md §3): de
    // doel-brede norm liet een blok waarin 25 procent van drempel plus anaeroob naar tempo was
    // verschoven in 286 van de 405 cellen als GELEVERD lezen, en 50 procent nog in 88 — omdat
    // `normTempo` een bibliotheek-gemiddelde is (dosis × 0,2821) terwijl het plan van V1 in Build
    // bij Korte beklimmingen 4,0 tempo voorschrijft tegen een normTempo van 22. Die speling IS de
    // ruimte waarin grijs rijden zich verstopt. Met het plan als referent leest grijs 25, 50 en
    // 100 procent 0 van 405 en exact-volgens-plan 405 van 405.
    //
    // DE DELOAD-SCHAAL VERVALT HIER. Die bestond om een doel-brede norm naar blokweek 4 te buigen;
    // het plan van blokweek 4 draagt zijn EIGEN mesoFactor al, dus schalen zou twee keer rekenen.
    const plan = planZonesVoorWeek_(
      input.weekplans,
      weekMonday,
      input.grenzen ?? ZONE5_GRENZEN_DEFAULT,
    );
    // Vier keer ÉÉN ronding, elk op zijn eigen onafgeronde plan-waarde — nooit een som van
    // afgeronde delen (WERKWIJZE, rond één keer af). Deze vier zijn PRESENTATIE; het oordeel
    // hieronder leest de onafgeronde waarden.
    const gevraagd = Math.round(plan.werk);
    const gevraagdTempo = Math.round(plan.tempo);
    const gevraagdDrempel = Math.round(plan.drempel);
    const gevraagdAnaeroob = Math.round(plan.anaeroob);

    // DE POORTSET van deze week: de nominale werkzone-labels uit de BEWAARDE entries van die
    // zeven dagen. Bewaard en niet herberekend — de entry draagt wat er destijds is gerenderd.
    //
    // FASE 1b — een EIGEN bewaard plan wint altijd: dat is specifieker dan de blokpoort. Pas als
    // die er niet is valt de week terug op het blok.
    const eigenPoort = poortsetVoorWeek_(
      input.weekplans,
      weekMonday,
      input.grenzen ?? ZONE5_GRENZEN_DEFAULT,
      input.materialiteitMin ?? MATERIALITEIT_MIN_MINUTEN,
    );
    const zonesVoorgeschreven = eigenPoort.length > 0 ? eigenPoort : blokPoort;
    const poortHerkomst: "week" | "blok" | "geen" =
      eigenPoort.length > 0 ? "week" : blokPoort.length > 0 ? "blok" : "geen";

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
      // ROADMAP punt 17 — DEZE WEEK MOET EEN EIGEN BEWAARD PLAN DRAGEN. Sinds de referent
      // plan-relatief is, is de blokpoort-terugval hier niet meer genoeg: een week zonder eigen
      // plan heeft een plan-werktotaal van 0 en zou dus TRIVIAAL geleverd lezen — gemeten 405 van
      // de 405 zulke weken (docs/PUNT17-BOUWDOC.md §5). Zonder plan geen bewering (M5).
      //
      // Deze eis is STERKER dan de punt-14-clausule `zonesVoorgeschreven.length > 0` die hier
      // stond: die liet de blokpoort-terugval toe, en herkomst "week" impliceert per constructie
      // een niet-lege poortset. Twee clausules laten staan zou de zwakste dood laten lijken.
      //
      // GEMETEN KOSTEN: nul. Met alleen de eerste twee opbouwweken bewaard blijven alle 405 cellen
      // beoordeelbaar — precies `BLOK_MIN_BEOORDEELBARE_WEKEN`, dezelfde minimum-bewijslast die de
      // blokpoort sinds punt 14 fase 1d al draagt. `blokPoort` en `zonesVoorgeschreven` blijven
      // ONGEMOEID: die dragen de LABELS, en die terugval blijft geldig.
      poortHerkomst === "week" &&
      plan.werk > 0 &&
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
    //
    // ROADMAP punt 17 — op de GETOONDE HELE MINUUT. `gevraagdTempo` c.s. is exact het getal dat de
    // kaart naast de geleverde minuten zet, dus kleur, teller en oordeel kunnen niet uiteenlopen.
    const opNormPerZone = {
      tempo: haaltNorm(k.tempo, gevraagdTempo),
      drempel: haaltNorm(k.drempel, gevraagdDrempel),
      anaeroob: haaltNorm(k.anaeroob, gevraagdAnaeroob),
    };
    const zonesOpNorm = zonesVoorgeschreven.filter(
      (z) => opNormPerZone[z as "tempo" | "drempel" | "anaeroob"],
    ).length;
    // ROADMAP punt 15 fase 2 — DE TWEEDE, ONAFHANKELIJKE EIS. De per-zone-poort blijft hierboven
    // byte voor byte zoals punt 14 hem maakte; deze eis telt ALLE DRIE de werkzones, ook die
    // BUITEN de poortset, en legt geen norm bij een LABEL maar telt minuten. Dat is precies waarom
    // hij niet lijdt aan de bandoverloop die de herverdeel-wat-als om zeep hielp: die zakte van 92
    // naar 46 geleverde cellen en trok Onderhoud van 27 van 27 naar 18 van 27 — het defect dat
    // punt 14 fase 1 net had weggenomen.
    //
    // ROADMAP punt 17 — TEGEN DE PLAN-WERKTOTAAL van deze week, op dezelfde korrel. `werkTotaal`
    // blijft ONAFGEROND optellen en rondt pas op de SOM af; `gevraagd` draagt de ene afronding van
    // de plan-werktotaal. GEMETEN dat deze eis DRAGEND blijft naast de per-zone-eis: in een scenario waarin
    // de voorgeschreven zones exact geleverd worden maar de bandoverloop-tempo niet, valt 615 van
    // de 1215 weken op het TOTAAL ALLEEN (§4). Geen van beide eisen is redundant.
    // De drie werkzone-waarden zijn EXACT dezelfde die het per-zone-oordeel hierboven leest — geen
    // tweede vouwing.
    const werkTotaal = k.tempo + k.drempel + k.anaeroob;
    const totaalOpNorm = telt ? haaltNorm(werkTotaal, gevraagd) : null;
    const geleverdOk = telt
      ? zonesOpNorm === zonesVoorgeschreven.length && totaalOpNorm === true
      : null;

    // FASE 1c — de regels volgen de EFFECTIEVE poort van DEZE week (`poortHerkomst` "week" → de
    // eigen poortset, "blok" → de blokpoort); `zonesVoorgeschreven` draagt die al. Een zone
    // buiten de poort blijft STAAN met zijn geleverde minuten en krijgt norm null: weglaten zou
    // verbergen wat er wél gereden is, en dempen zou het als een misser laten lezen.
    const gevraagdPerZone: Record<string, number> = {
      tempo: gevraagdTempo,
      drempel: gevraagdDrempel,
      anaeroob: gevraagdAnaeroob,
    };
    const geleverdPerZone: Record<string, number> = {
      tempo: k.tempo,
      drempel: k.drempel,
      anaeroob: k.anaeroob,
    };
    const zoneRegels: BlokZoneRegel[] = WERKZONES.map((z) => ({
      zone: z,
      geleverd: geleverdPerZone[z] ?? 0,
      norm: zonesVoorgeschreven.includes(z) ? (gevraagdPerZone[z] ?? 0) : null,
    }));

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
      planTempo: plan.tempo,
      planDrempel: plan.drempel,
      planAnaeroob: plan.anaeroob,
      planWerk: plan.werk,
      geleverdRust: k.rust,
      geleverdZ2: k.z2,
      zonesOpNorm,
      zonesVoorgeschreven,
      poortHerkomst,
      totaalOpNorm,
      zoneRegels,
      ritMinuten: k.ritMinuten,
      zoneDekking,
      status,
      telt,
      geleverdOk,
    });
  }

  // ROADMAP punt 17 — HET BLOKNIVEAU VOLGT DE WEKEN. De vier norm-velden zijn het GEMIDDELDE over
  // de MEEGETELDE weken van de per-week plan-waarden, elk ÉÉN keer afgerond. Dat moet, want de
  // coach noemt deze getallen in `blokReviewRegel` (coachNarrative.ts) en het getal dat hij noemt
  // hoort het getal te zijn waarop het oordeel viel — met een doel-brede norm hier en een
  // plan-referent per week zouden die twee uit elkaar lopen.
  //
  // Geen meegetelde week → 0. Dat is geen bewering maar een lege plek: bij minder dan
  // BLOK_MIN_BEOORDEELBARE_WEKEN geeft `blokUitvoering` `geleverd` null, geeft `buildBlokReview`
  // null terug en is `blokReviewRegel` per constructie onbereikbaar.
  const geteld = weeks.filter((w) => w.telt);
  const gemiddeld = (f: (w: BlokWeek) => number) =>
    geteld.length === 0
      ? 0
      : Math.round(geteld.reduce((a, w) => a + f(w), 0) / geteld.length);

  return {
    startMonday: input.startMonday,
    weken: BLOK_WEKEN,
    doel: input.doel,
    weekUren: input.weekUren,
    prikkelsPerWeek: dosis.prikkels,
    norm: gemiddeld((w) => w.planWerk),
    normTempo: gemiddeld((w) => w.planTempo),
    normDrempel: gemiddeld((w) => w.planDrempel),
    normAnaeroob: gemiddeld((w) => w.planAnaeroob),
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

/** Haalt deze week de norm van deze zone? Eén plek, zodat oordeel en diagnose niet uiteenlopen.
 *
 * ROADMAP punt 17 — LEEST DE GETOONDE NORM en rondt de geleverde kant één keer af, exact zoals
 * het oordeel in `buildBlokReferent`. Dat moet: zolang deze functie en het oordeel op
 * VERSCHILLENDE grootheden stonden liepen ze uiteen — zonepoort-toets (E) meldde `tempo` als
 * tekortzone in een week die het oordeel als geleverd had gelezen. De doc-regel hierboven stond
 * er al; hij was alleen niet waar. Nu draagt één grootheid oordeel, diagnose én kaart. */
function zoneOpNorm_(w: BlokWeek, z: Zone5Key): boolean {
  return haaltNorm(zoneGeleverd_(w, z), zoneGevraagd_(w, z));
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
    const vorige = vorigBlokStart(huidigeStart);
    // ROADMAP punt 28 — GEEN TERUGBLIK OP EEN BLOK VAN VÓÓR HET DOEL.
    //
    // Begint het beoordeelde blok VÓÓR de weekmaandag van `doelStart`, dan hoort het bij een
    // VORIGE doel-periode. Dat is niet vrijblijvend: `dosisTredeVoorstel` hangt aan dit oordeel,
    // dus zonder deze poort zet de vorige configuratie de dosis van de nieuwe.
    //
    // HIJ VUURT OOK ZONDER DOELWISSEL, en dat is gemeten: bij `doelStart` 2026-06-29 gaf deze
    // tak op weekmaandag 2026-06-29 een afgerond-venster vanaf 2026-06-01 — drie weken voordat
    // het doel bestond. De poort is dus te betrappen zonder dat er ooit gewisseld is.
    //
    // ISO-STRINGVERGELIJKING volstaat: `yyyy-MM-dd` is lexicografisch chronologisch, en beide
    // kanten komen uit dezelfde vorm. `doelStartISO` null → GEEN poort: zonder doelstart is er
    // niets om vóór te liggen, en het gedrag blijft dan byte-identiek aan voorheen.
    //
    // De LOPEND-tak hierboven blijft ONGEMOEID: die beoordeelt het blok waarin we NU zitten, en
    // dat kan per constructie niet vóór `doelStart` liggen.
    if (doelStartISO && vorige < weekMondayVan_(doelStartISO)) return null;
    return {
      startMonday: vorige,
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

  // ROADMAP punt 15 fase 2 — DEZELFDE fase aan BEIDE aanroepen. `blokStart` staat hierboven al,
  // dus dit is geen tweede afleiding. En het moet ÉÉN waarde zijn: gaven `nu` en `straks` een
  // andere fase mee, dan zou het getoonde verschil mede een FASEWISSEL meten in plaats van alleen
  // de trede — en dat is precies wat deze kaart beweert te tonen.
  const sDoelStart = input.doelStart ? parseLocalDate(input.doelStart) : null;
  const sBlokStart = parseLocalDate(blokStart);
  const blokFase =
    sDoelStart && sBlokStart
      ? ((computeMacroPhase(sDoelStart, sBlokStart) as { fase?: string })
          ?.fase ?? null)
      : null;

  const nu = blokDosisNorm(
    input.doel,
    input.weekUren,
    huidig,
    undefined,
    blokFase,
  );
  const straks = blokDosisNorm(
    input.doel,
    input.weekUren,
    huidig + 1,
    undefined,
    blokFase,
  );
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
    doelStart: input.doelStart,
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
