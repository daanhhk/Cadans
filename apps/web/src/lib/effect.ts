// Stap 5b-i (spec: docs/EFFECT-REFERENT-5B-ONTWERP.md) — de EFFECT-REFERENT.
// Pure laag, DOM-loos, geen ambient klok: elke datum komt als parameter binnen.
//
// Beantwoordt de TWEEDE vraag uit DOELEN-SPEC §2A: heeft het blok gedaan wat het moest doen. De
// EERSTE vraag (is de dosis geleverd) zit in blok.ts en is de GELDIGHEIDSVOORWAARDE — zonder
// geleverde uitvoering zwijgt de app hier (M5). Die poort staat in `buildBlokReview`, niet hier.
//
// DE METER is `rolling_ftp` (activities idx14), absolute watts: als enige grootheid in de stapel
// immuun voor een wijziging van de INGESTELDE FTP (docs/FTP-REFERENT-RECON.md §6). Het is ÉÉN reeks
// door alle sport-types heen — gemeten draagt de indoor-rit van 22-01-2026 dezelfde `rolling_ftp`
// als de buitenritten van die week terwijl zijn `icu_ftp` 15W lager is. Dus GEEN type-filter en
// GEEN splitsing per sport (ontwerp §1).
//
// ALLEEN STIJGINGEN DRAGEN INFORMATIE (ontwerp §4). Een rollend maximum zakt óók zonder verlies,
// namelijk zodra de oude topinspanning het venster uit valt. Een niet-stijging betekent dus
// UITSLUITEND dat de beste inspanning van het vorige venster niet is overtroffen — vandaar de derde
// uitkomst `niet_meetbaar`.
import { CYCLING_TYPES, DOEL_OPTIONS, normalizeDoel_ } from "@cadans/engine";
import type { EventItem, OverrideEntry } from "@cadans/shared";
import type { ActValuesRow } from "./activities";
import { BLOK_WEKEN, isoFrom_, shiftIso_ } from "./blok";
import { NO_BUILD_CTL_DELTA } from "./fatigue";

/** Stijging vanaf dit aantal watt boven het instapniveau. GEIJKT: over 13 blokken wijst elke
 * drempel van +1 t/m +8 exact dezelfde twee blokken aan — een plateau van acht opeenvolgende
 * gehele waarden. De week-op-week stappen springen van +1 naar +9 zonder iets ertussen. */
export const ROLLING_FTP_STIJGING_W = 3;
/** Dekkingspoort: zoveel van de vier blokweken moeten een geldige `rolling_ftp` dragen. */
export const EFFECT_MIN_GEVULDE_WEKEN = 3;
/** Een gelegenheid telt pas als die dag ook ECHT gereden is: minstens zoveel fiets-minuten. */
export const GELEGENHEID_MIN_MINUTEN = 15;
/** Alleen deze event-prioriteiten gelden als maximale inspanning; C telt niet mee. */
export const GELEGENHEID_PRIORITEITEN = ["A", "B"];

/** idx14 = rolling_ftp. Geldig = eindig en groter dan nul. */
function rollingFtp_(row: ActValuesRow): number | null {
  const v = row?.[14];
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** De lokale kalenderdatum van een activiteiten-rij (idx0 is een Date na parseActivityRows). */
function datumVan_(row: ActValuesRow): string | null {
  const d = row?.[0];
  return d instanceof Date ? isoFrom_(d) : null;
}

/**
 * Is `verschil` een stijging? De drempel is een OPTIONELE parameter zodat de plateau-toets 'm kan
 * doorlopen zonder de named export te wijzigen.
 */
export function isStijging(
  verschil: number,
  drempel: number = ROLLING_FTP_STIJGING_W,
): boolean {
  return verschil >= drempel;
}

/**
 * Het INSTAPNIVEAU: de laatste geldige `rolling_ftp` met datum VÓÓR `startMonday`. Null als er geen
 * is — dan valt er niets te vergelijken en zwijgt de referent.
 */
export function instapNiveau(
  activities: ActValuesRow[],
  startMonday: string,
): number | null {
  let besteDatum = "";
  let beste: number | null = null;
  for (const row of activities || []) {
    const datum = datumVan_(row);
    if (datum == null || datum >= startMonday) continue;
    const v = rollingFtp_(row);
    if (v == null) continue;
    if (datum >= besteDatum) {
      besteDatum = datum;
      beste = v;
    }
  }
  return beste;
}

/**
 * Het MAXIMUM van `rolling_ftp` binnen het blok-venster [startMonday .. +28 dagen), plus het aantal
 * van de vier kalenderweken met minstens één geldige waarde (de dekkingspoort).
 *
 * MAXIMUM-BINNEN-BLOK, niet max-tegen-max van twee blokken: `rolling_ftp` kijkt zelf al circa zes
 * weken terug, langer dan het blok van vier, dus dezelfde inspanning zou in béide blokken het
 * maximum kunnen zijn. Dat corrigeert conclusie 3 van EFFECT-REFERENT-RECON.md §5 (ontwerp §2).
 */
export function blokMaximum(
  activities: ActValuesRow[],
  startMonday: string,
): { maximum: number | null; gevuldeWeken: number } {
  const eind = shiftIso_(startMonday, BLOK_WEKEN * 7);
  const weekGrenzen: string[] = [];
  for (let i = 0; i <= BLOK_WEKEN; i++) {
    weekGrenzen.push(shiftIso_(startMonday, i * 7));
  }
  let maximum: number | null = null;
  const gevuld = new Set<number>();
  for (const row of activities || []) {
    const datum = datumVan_(row);
    if (datum == null || datum < startMonday || datum >= eind) continue;
    const v = rollingFtp_(row);
    if (v == null) continue;
    if (maximum == null || v > maximum) maximum = v;
    for (let w = 0; w < BLOK_WEKEN; w++) {
      const van = weekGrenzen[w];
      const tot = weekGrenzen[w + 1];
      if (van != null && tot != null && datum >= van && datum < tot) {
        gevuld.add(w);
        break;
      }
    }
  }
  return { maximum, gevuldeWeken: gevuld.size };
}

export type GelegenheidBron = "test" | "race";

export interface BlokGelegenheid {
  bron: GelegenheidBron | null;
  datum: string | null;
}

/** Fiets-minuten op één kalenderdag — de "is die dag echt gereden"-toets. */
function fietsMinutenOpDag_(
  activities: ActValuesRow[],
  datumISO: string,
): number {
  let min = 0;
  for (const row of activities || []) {
    if (datumVan_(row) !== datumISO) continue;
    if (CYCLING_TYPES.indexOf(String(row[1] ?? "")) < 0) continue;
    min += Number(row[3]) || 0;
  }
  return min;
}

/** Is die dag echt gereden? Een gelegenheid die niet gereden is, is geen gelegenheid. */
function isGereden_(activities: ActValuesRow[], datumISO: string): boolean {
  return fietsMinutenOpDag_(activities, datumISO) >= GELEGENHEID_MIN_MINUTEN;
}

/** Telt dit event als maximale inspanning? Type "race" en prioriteit A of B; C telt niet mee. */
function isMaximaalEvent_(ev: EventItem | null | undefined): ev is EventItem {
  if (!ev || typeof ev.datum !== "string") return false;
  if (String(ev.type ?? "") !== "race") return false;
  return GELEGENHEID_PRIORITEITEN.indexOf(String(ev.prioriteit ?? "")) >= 0;
}

/** Is deze override de door de app INGEPLANDE test? 5b-ii heeft `test` aan
 * `OVERRIDE_WORKOUT_TYPES` toegevoegd, dus deze tak is LEVEND — hij matcht op de override die
 * `TestVoorstelCard` schrijft. `workoutType` blijft defensief als string gelezen: de wire-vorm is
 * opaak en een oudere blob hoeft het veld niet te dragen. */
function isTestOverride_(
  ov: OverrideEntry | null | undefined,
): ov is OverrideEntry {
  if (!ov || typeof ov.datum !== "string") return false;
  const o = ov.override as { type?: unknown; workoutType?: unknown } | null;
  if (!o || o.type !== "library") return false;
  return String(o.workoutType ?? "") === "test";
}

/**
 * Bevatte het blok een GELEGENHEID om een maximum te zetten? Alleen een inspanning die de app KENT
 * telt: een testdag die hij zelf inplande (5b-ii) of een wedstrijd uit de events-agenda — en die
 * dag moet ook echt gereden zijn (ontwerp §9a, beslecht).
 *
 * NIET afgeleid uit `if_pct`: van de 28 ritten boven 88% en 15 minuten vielen er slechts TWEE samen
 * met een stijging, en de intensiteit ordent ze niet (97,04 gaf niets, 88,36 wél). Een heuristiek
 * daarop is fitten op twee gevallen (ontwerp §5).
 *
 * TEST WINT VAN RACE als beide gelden: een ingeplande test is een gerichte maximale inspanning, een
 * wedstrijd een gelegenheid die toevallig zo uitpakte.
 */
export function blokGelegenheid(input: {
  activities: ActValuesRow[];
  events: EventItem[];
  overrides: OverrideEntry[];
  startMonday: string;
}): BlokGelegenheid {
  const eind = shiftIso_(input.startMonday, BLOK_WEKEN * 7);
  // `datum` is in beide bronnen een RAUWE yyyy-MM-dd-string → lexicografisch = chronologisch.
  const inVenster = (d: string) => d >= input.startMonday && d < eind;

  let race: string | null = null;
  for (const ev of input.events || []) {
    if (!isMaximaalEvent_(ev)) continue;
    if (!inVenster(ev.datum)) continue;
    if (!isGereden_(input.activities, ev.datum)) continue;
    if (race == null || ev.datum < race) race = ev.datum;
  }

  let test: string | null = null;
  for (const ov of input.overrides || []) {
    if (!isTestOverride_(ov)) continue;
    if (!inVenster(ov.datum)) continue;
    if (!isGereden_(input.activities, ov.datum)) continue;
    if (test == null || ov.datum < test) test = ov.datum;
  }

  if (test != null) return { bron: "test", datum: test };
  if (race != null) return { bron: "race", datum: race };
  return { bron: null, datum: null };
}

/** De bronnen die als MEETMOMENT tellen. `test` en `race` zijn GELEGENHEDEN (de app kende ze
 * vooraf); `inspanning` is een sprong in de reeks zelf — achteraf zichtbaar bewijs dat er een
 * maximum gezet is, zonder dat de app weet wat voor rit het was. */
export type MetingBron = GelegenheidBron | "inspanning";

/**
 * De dagen waarop `rolling_ftp` SPRONG, oplopend. Een sprong is achteraf bewijs dat er een maximum
 * gezet is: de meter kan alleen omhoog als er een betere inspanning in het venster kwam.
 *
 * GRENS, DRAGEND: dit voedt UITSLUITEND `laatsteGelegenheid` (de meetinterval-poort van het
 * testvoorstel). `blokGelegenheid` en `buildEffectReferent` blijven ONGEWIJZIGD, en dat is geen
 * nalatigheid maar de kern: een sprong als bewijs van gelegenheid gebruiken is CIRCULAIR. De
 * effect-vraag luidt "was er een gelegenheid en steeg de meter"; zou een sprong zelf de gelegenheid
 * zijn, dan is "geen sprong" per definitie "geen gelegenheid" en kan de uitkomst `niet_gestegen`
 * nooit meer vuren. Vandaar: sprongen tellen voor WANNEER er voor het laatst gemeten is, nooit voor
 * de vraag of dit blok een meting bevatte.
 *
 * Vergelijking met de VORIGE dag-met-waarde, niet met het all-time maximum: de reeks daalt over het
 * jaar, dus een all-time-max zou de sprong van 21-05-2026 (261 → 272) onzichtbaar maken achter de
 * eerdere piek van 13-01 (276). Twee ritten op één dag tellen als ÉÉN dag — op 21-05 stond 07:23 op
 * 261 en 16:23 op 272 — dus per datum het maximum.
 */
export function sprongDagen(
  activities: ActValuesRow[],
  totISO: string,
): string[] {
  const perDag = new Map<string, number>();
  for (const row of activities || []) {
    const datum = datumVan_(row);
    if (datum == null || datum > totISO) continue;
    const v = rollingFtp_(row);
    if (v == null) continue;
    const huidig = perDag.get(datum);
    if (huidig == null || v > huidig) perDag.set(datum, v);
  }
  const datums = [...perDag.keys()].sort();
  const uit: string[] = [];
  let vorig: number | null = null;
  for (const d of datums) {
    const v = perDag.get(d) as number;
    // De eerste dag met een waarde is nooit een sprong: er is geen niveau om mee te vergelijken.
    if (vorig != null && v - vorig >= ROLLING_FTP_STIJGING_W) uit.push(d);
    vorig = v;
  }
  return uit;
}

/**
 * De LAATSTE gelegenheid over de HELE historie t/m `totISO` (inclusief), of null. Voedt de
 * meetinterval-poort van het testvoorstel: hoe lang is het geleden dat er werkelijk een maximum
 * gezet is. Zelfde definitie en zelfde voorrang als `blokGelegenheid` — bij een gelijke datum wint
 * de test — maar zonder blok-venster.
 */
export function laatsteGelegenheid(input: {
  activities: ActValuesRow[];
  events: EventItem[];
  overrides: OverrideEntry[];
  totISO: string;
  /**
   * SLUIT DE SPRONG-BRON UIT. Weggelaten of false → het gedrag van vóór 23-08-2026, met alle drie
   * de bronnen. True → alleen `test` en `race`, dus alleen wat de app als GEDANE maximale
   * inspanning kent.
   *
   * WAAROM DEZE VLAG BESTAAT (M91, GEPIND `docs/TRAININGSMODEL.md` §13): *"Een proxy vervangt de
   * ijking niet ... Zij is informant (M17, M30) en mag het aanbod niet onderdrukken."* `rolling_ftp`
   * is intervals' eigen SCHATTING van de drempel, dus een proxy in precies die zin. Een sprong
   * toont dát er hard gereden is; hij toont niet WELKE waarde het blok moet doseren, en juist die
   * waarde is het onderwerp van de ijking. GEMETEN vóór de ingreep: bij Daans sprongtempo werd 162
   * van de 440 doelblok-openingen (36,8 procent) onderdrukt door een sprong alleen, zonder gereden
   * race of test in dezelfde periode.
   *
   * DE VLAG EN NIET EEN VERWIJDERING, en dat is opzet: de sprong blijft INFORMANT. De blok-terugblik
   * (`buildBlokReview` in `blok.ts`) leest `laatsteGelegenheid` ZONDER deze vlag en zegt "je ging
   * voor het laatst vol op X; je rolling FTP sprong daar omhoog". Dat is informeren en geen
   * onderdrukken, en dat mag van M91.
   *
   * DRIE AANROEPERS, NIET TWEE, en de functienaam hierboven is op 23-08-2026 rechtgezet. De eerste
   * versie van dit blok schreef "`buildBlokReferent`" — die functie bestaat niet — en telde twee
   * consumenten. Het zijn er drie: `buildTestVoorstel` poort (7) en `ijkStatus`, allebei MET de
   * vlag, en `buildBlokReview` in `blok.ts` zonder. Alleen de derde ziet de sprong nog.
   *
   * DAT LEVERT TWEE DATUMS OP HETZELFDE SCHERM, en dat is bekend en geaccepteerd. Met een sprong op
   * 02-09 en een gereden A-wedstrijd op 21-05 zegt de terugblik "voor het laatst vol op 2 september"
   * en de ijk-staat "voor het laatst GEMETEN op 21 mei". Twee verschillende grootheden, met twee
   * verschillende woorden — precies het onderscheid dat M91 maakt. De staat-regel rendert bovendien
   * niet naast het aanbod, dus de twee zinnen staan nooit direct onder elkaar.
   */
  negeerSprong?: boolean;
}): { bron: MetingBron; datum: string } | null {
  // Specifieker feit wint bij een gelijke datum: een INGEPLANDE test slaat een wedstrijd, en beide
  // slaan een kale sprong (waarvan de app niet weet wat voor rit het was).
  const rang: Record<MetingBron, number> = { test: 3, race: 2, inspanning: 1 };
  let beste: { bron: MetingBron; datum: string } | null = null;
  const overweeg = (bron: MetingBron, datum: string) => {
    if (datum > input.totISO) return;
    // De gereden-poort geldt NIET voor een sprong: die impliceert per constructie een rit.
    if (bron !== "inspanning" && !isGereden_(input.activities, datum)) return;
    if (
      beste == null ||
      datum > beste.datum ||
      (datum === beste.datum && rang[bron] > rang[beste.bron])
    ) {
      beste = { bron, datum };
    }
  };
  for (const ev of input.events || []) {
    if (isMaximaalEvent_(ev)) overweeg("race", ev.datum);
  }
  for (const ov of input.overrides || []) {
    if (isTestOverride_(ov)) overweeg("test", ov.datum);
  }
  if (!input.negeerSprong) {
    for (const d of sprongDagen(input.activities, input.totISO)) {
      overweeg("inspanning", d);
    }
  }
  return beste;
}

export type EffectUitkomst = "gestegen" | "niet_gestegen" | "niet_meetbaar";
export type EffectDosisTerm = "tijd_in_zone" | "volume";

/**
 * ROADMAP punt 34 — WELKE VRAAG STELT DE EFFECT-REFERENT VOOR DIT DOEL.
 *
 * `stijging` — `rolling_ftp` IS de maat en hij moet OMHOOG (DOELEN-SPEC §3.1).
 * `behoud`   — `rolling_ftp` is de maat maar de opdracht is NIET-ZAKKEN (§3.2). Zelfde meter,
 *              omgekeerd teken. De verdict-logica hiervoor komt in een later blok; deze ronde
 *              draagt de tak alleen.
 * `meter_ontbreekt` — het doel wijst een maat aan die de app niet kan uitrekenen: durability
 *              (§3.5 en §3.3) of dag twee tegen dag een (§3.4). Dan zwijgt de app (M5).
 */
export type DoelTak = "stijging" | "behoud" | "meter_ontbreekt";

// DE VIJF CANONIEKE DOELEN KOMEN UIT DE ENGINE-CONSTANTE, nooit met de hand overgetypt: een
// hernoeming daar moet hier een stille val naar `meter_ontbreekt` geven en niet een tak die op
// een verouderde letterlijke string blijft matchen.
//
// DE AFHANKELIJKHEID IS DE VOLGORDE, en die is niet gratis: `DOEL_OPTIONS` is een platte array,
// dus index 0 t/m 4 dragen de betekenis. Index 0 wordt daarom GECONTROLEERD tegen een tweede
// engine-feit: `normalizeDoel_` valt volgens `packages/engine/src/phase.ts` bij een onbekende of
// lege waarde terug op de REFERENTIE, en dat is de FTP-optie. Klopt die kruiscontrole niet, dan is
// de lijst herschikt en valt ALLES naar `meter_ontbreekt` — een verkeerd toegewezen tak is erger
// dan geen uitspraak. De overige vier indexen blijven een aanname en horen door een test gepind.
const FTP_OPTIE_ = DOEL_OPTIONS[0];
const CONDITIE_OPTIE_ = DOEL_OPTIONS[1];
const KLIM_KORT_OPTIE_ = DOEL_OPTIONS[2];
const KLIM_LANG_OPTIE_ = DOEL_OPTIONS[3];
const ONDERHOUD_OPTIE_ = DOEL_OPTIONS[4];
const DOEL_LIJST_INTACT_ =
  DOEL_OPTIONS.length === 5 && FTP_OPTIE_ === normalizeDoel_("");

/**
 * De doel-tak uit de RAUWE doel-string. `buildBlokReview` krijgt `settings.doel` ongenormaliseerd
 * mee (vrije tekst in D1), dus de normalisatie hoort hier en niet bij de aanroeper.
 *
 * WAAROM ER NAAST `normalizeDoel_` NOG EEN HERKENNINGS-TOETS STAAT. `normalizeDoel_` FAIL-OPENT:
 * leeg, null en onzin leveren alle drie de FTP-optie op, want voor het PLAN is een doel kiezen
 * beter dan stilvallen. Voor een UITSPRAAK is dat precies verkeerd — dan zou een lege instelling
 * een winst-of-verlies-oordeel over `rolling_ftp` opleveren. Daarom telt een genormaliseerde
 * waarde alleen als de rauwe string zichzelf al was, óf als de normalisatie hem op een ANDERE
 * optie dan de fallback bracht (zo wordt een opgeslagen `"Beklimmingen"` wél herkend).
 *
 * PRIJS, EXPLICIET: een opgeslagen `"VO2max"` normaliseert naar de fallback en is daarmee niet te
 * onderscheiden van onzin, dus die valt op `meter_ontbreekt` in plaats van op `stijging`. Dat is
 * de conservatieve kant — VO2max is als DOEL vervallen (§3.6) en de app zwijgt dan liever.
 */
export function doelTakVan_(doel: string | null | undefined): DoelTak {
  if (!DOEL_LIJST_INTACT_) return "meter_ontbreekt";
  const rauw = typeof doel === "string" ? doel : "";
  const genormaliseerd = normalizeDoel_(rauw);
  const herkend = rauw === genormaliseerd || genormaliseerd !== FTP_OPTIE_;
  if (!herkend) return "meter_ontbreekt";
  if (genormaliseerd === FTP_OPTIE_) return "stijging";
  if (genormaliseerd === ONDERHOUD_OPTIE_) return "behoud";
  if (
    genormaliseerd === CONDITIE_OPTIE_ ||
    genormaliseerd === KLIM_KORT_OPTIE_ ||
    genormaliseerd === KLIM_LANG_OPTIE_
  ) {
    return "meter_ontbreekt";
  }
  return "meter_ontbreekt";
}

/**
 * Welke dosis-term mag omhoog bij een niet-stijging? DE DOSIS-TERM VOLGT DE PROCESMETER
 * (ontwerp §9b, beslecht): steeg de CTL over het blok, dan bouwde de belasting wél op en was de
 * KWALITEITSdosis te licht → `tijd_in_zone`. Steeg de CTL niet, dan bouwde het blok geen belasting
 * op en is méér drempeltijd het verkeerde antwoord → `volume`.
 *
 * Drempel = `NO_BUILD_CTL_DELTA` uit fatigue.ts: één signaal, één getal — geen eigen drempel die
 * stilzwijgend uiteen kan lopen met de doortrain-kaart en de blok-check.
 */
export function dosisTerm(
  uitkomst: EffectUitkomst,
  ctlDelta: number | null,
): EffectDosisTerm | null {
  if (uitkomst !== "niet_gestegen") return null;
  if (ctlDelta == null || !Number.isFinite(ctlDelta)) return null;
  return ctlDelta > NO_BUILD_CTL_DELTA ? "tijd_in_zone" : "volume";
}

export interface EffectReferent {
  instap: number;
  maximum: number;
  verschil: number;
  gevuldeWeken: number;
  gelegenheid: BlokGelegenheid;
  uitkomst: EffectUitkomst;
  dosisTerm: EffectDosisTerm | null;
  /** ROADMAP punt 34 — welke vraag dit doel stelt. Zie `DoelTak`. */
  doelTak: DoelTak;
}

/**
 * De EFFECT-REFERENT over één blok. Null zodra er geen instapniveau is of de dekkingspoort niet
 * gehaald wordt — dan valt er niets te zeggen en zwijgt de app (M5).
 *
 * Geeft de TERMEN APART terug, nooit alleen het saldo (WERKWIJZE.md, *Recon en bewijslast*):
 * instap, maximum én verschil, plus waarop het oordeel steunt.
 *
 * Een STIJGING telt ALTIJD, ook zonder bekende gelegenheid: de detector mag bewijs nooit
 * onderdrukken (ontwerp §9a).
 */
export function buildEffectReferent(input: {
  activities: ActValuesRow[];
  events: EventItem[];
  overrides: OverrideEntry[];
  startMonday: string;
  ctlDelta: number | null;
  /** ROADMAP punt 34 — de RAUWE doel-string uit settings; `doelTakVan_` normaliseert zelf. */
  doel: string | null;
}): EffectReferent | null {
  // VOOR ELKE ANDERE BESLISSING: welke vraag stelt dit doel. Staat de meter er niet, dan mag de
  // rolling-FTP-verdict-logica hieronder niet eens gedraaid worden.
  const doelTak = doelTakVan_(input.doel);

  const instap = instapNiveau(input.activities, input.startMonday);
  if (instap == null) return null;

  const { maximum, gevuldeWeken } = blokMaximum(
    input.activities,
    input.startMonday,
  );
  if (maximum == null || gevuldeWeken < EFFECT_MIN_GEVULDE_WEKEN) return null;

  const verschil = maximum - instap;
  const gelegenheid = blokGelegenheid({
    activities: input.activities,
    events: input.events,
    overrides: input.overrides,
    startMonday: input.startMonday,
  });

  // ROADMAP punt 34 — de doel-tak staat VOOR de verdict-logica. Bij `meter_ontbreekt` wordt
  // `isStijging` niet eens aangeroepen: `rolling_ftp` beantwoordt de vraag van dit doel niet, dus
  // er valt niets te wegen. `instap`, `maximum` en `gelegenheid` blijven gevuld — het zijn TERMEN,
  // geen oordeel, en laag 2 verbergt ze.
  const uitkomst: EffectUitkomst =
    doelTak === "meter_ontbreekt"
      ? "niet_meetbaar"
      : isStijging(verschil)
        ? "gestegen"
        : gelegenheid.bron != null
          ? "niet_gestegen"
          : "niet_meetbaar";

  return {
    instap,
    maximum,
    verschil,
    gevuldeWeken,
    gelegenheid,
    uitkomst,
    dosisTerm: dosisTerm(uitkomst, input.ctlDelta),
    doelTak,
  };
}
