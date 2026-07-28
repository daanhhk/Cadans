/**
 * utils.ts — pure low-level helpers, ported from training/src/Utils.gs
 * (+ stripTime_ and mesoFactor, relocated here from Algorithm.gs).
 *
 * formatDate is reimplemented faithfully: under the TZ pin
 * (TZ=Europe/Amsterdam, set by the test runner) the process-local getters
 * equal Utilities.formatDate(date, 'Europe/Amsterdam', pattern) on V8/GAS.
 * Logger.log → console.debug (no-op-ish). No GAS globals, no external state.
 */

export const TZ = "Europe/Amsterdam";

// b2 meso-ramp (week-op-week). The production loadCarry DocProp modulation
// (Algorithm.gs mesoFactor) defaults to 1 and is never set in the SelfTest,
// so it is lifted out here — behaviour-identical for the suite. Re-introducing
// loadCarry as a parameter is a later (data-in) phase.
export const MESO_MOD: Record<number, number> = {
  1: 1.0,
  2: 1.08,
  3: 1.15,
  4: 0.6,
};

export function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n;
}

export function formatDate(date: Date, format: string): string {
  const y = String(date.getFullYear());
  const mo = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return format
    .replace(/yyyy/g, y)
    .replace(/MM/g, mo)
    .replace(/dd/g, d)
    .replace(/HH/g, h)
    .replace(/mm/g, mi)
    .replace(/ss/g, s);
}

export function stripTime_(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function mesoFactor(week: number): number {
  return MESO_MOD[week] || 1.0;
}

/** Kwaliteitsminuten (high + anaerobic) per sleutelprikkel, per doel. FTP draagt de zwaarste
 * drempel-dosis; Onderhoud is een FREQUENTIE-opgave bij minder uren (DOELEN-SPEC §3.2), dus een
 * kortere prikkel per keer.
 *
 * WOONT IN DE ENGINE, niet in de client. De dosis-trede-factor is
 * (basis + stap × trede) / basis, en de NORM (client) en het PLAN (engine) moeten met
 * DEZELFDE factor omhoog — anders zakt het plan onder zijn eigen meetlat
 * (docs/DOSIS-TREDE-RECON.md §3). Staat de basis aan de ene kant en de factor aan de andere,
 * dan leeft die invariant nergens en drijven de twee uit elkaar; precies het dubbel-patroon
 * dat §4 beschrijft. apps/web/src/lib/blok.ts re-exporteert 'm onder dezelfde naam. */
export const KWALITEIT_MIN_PER_PRIKKEL: Record<string, number> = {
  FTP: 28,
  Onderhoud: 22,
};
/** Conditie, Beklimmingen en VO2max: hun dosis-doel draagt óók lange-rit-minuten en week-kJ, en die
 * as wordt in 5a BEWUST niet gebouwd. Deze waarde dekt alleen de kwaliteitskant. */
export const KWALITEIT_MIN_PER_PRIKKEL_DEFAULT = 26;

/** BELEID, GEEN GEIJKTE DREMPEL. Er bestaat geen reeks waarop "hoeveel mag de dosis per blok
 * omhoog" te meten valt, en ijken op de eigen historie reproduceert juist de gewoonte die dit
 * mechanisme vervangt (docs/WERKWIJZE.md). Vastgesteld met Daan; herzien gebeurt door
 * docs/DOSIS-TREDE-RECON.md §6 te wijzigen, niet door er data voor te zoeken. */
export const DOSIS_TREDE_STAP_MIN = 2;
/** BELEID, GEEN GEIJKTE DREMPEL. Plafond op trede 4 — ruim binnen het gemeten lineaire gebied
 * van de work-scale (docs/DOSIS-TREDE-RECON.md §5, lineair tot ongeveer factor 1,5). */
export const DOSIS_TREDE_MAX = 4;

/**
 * Trede → work-scale-factor, in de stijl van mesoFactor: puur, en 1 als er niets te doen is.
 *
 * (basis + stap × trede) / basis, met basis = de kwaliteitsminuten per prikkel van dit doel.
 * Trede 0 geeft EXACT 1 en is daarmee byte-identiek aan het gedrag zonder trede. null,
 * undefined en niet-eindige waarden tellen als 0; buiten 0..DOSIS_TREDE_MAX wordt geklemd.
 * Een onbekend doel valt op KWALITEIT_MIN_PER_PRIKKEL_DEFAULT terug.
 */
export function dosisTredeFactor(doel: any, trede: any): number {
  const t = Number(trede);
  const n = Number.isFinite(t) ? Math.min(DOSIS_TREDE_MAX, Math.max(0, t)) : 0;
  if (n === 0) return 1;
  const basis =
    KWALITEIT_MIN_PER_PRIKKEL[String(doel ?? "")] ??
    KWALITEIT_MIN_PER_PRIKKEL_DEFAULT;
  return (basis + DOSIS_TREDE_STAP_MIN * n) / basis;
}

// Mapt een 0-gebaseerde weekindex (weken sinds doelStart, monotoon) naar de
// cyclische 1..4-mesoweek die MESO_MOD en isMesoRecovery verwachten (GAS getMesoWeek-
// pariteit: clamp/cyclus 1..4, advanceMeso wrapt >4 → 1). 3:1-mesocyclus = 3 opbouw-
// weken (1,2,3) + 1 deload (4); elke 4e blokweek is deload en herstelt daarna (→1),
// i.p.v. de bug waarbij isMesoRecovery eenmalig op w0===4 vuurde en daarna nooit meer.
// Pure int→int (bewust GEEN (settings)-signatuur): deterministisch testbaar; de
// datum-afleiding blijft in weekIndexFromStart_, dat als monotone variant-rotatie-index
// (selectVariant_) ONgemoeid blijft. Defensief tegen negatieve index.
export function mesoCycleWeek_(weekIndex: number): number {
  return (((weekIndex % 4) + 4) % 4) + 1;
}

export function weekStartDate(today?: Date): Date {
  today = today || new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function range(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i < end; i++) arr.push(i);
  return arr;
}

export function nlNumber(n: number | string): string {
  return String(n).replace(".", ",");
}

export function watts(ftp: number, pct: number): number {
  return Math.round((ftp * pct) / 100);
}

export function wattsRange(ftp: number, low: number, high: number): string {
  return `${watts(ftp, low)}-${watts(ftp, high)}W`;
}

export function bpmRange(lthr: number, low: number, high: number): string {
  return `${Math.round((lthr * low) / 100)}-${Math.round((lthr * high) / 100)} bpm`;
}

export function bpmBelow(lthr: number, pct: number): string {
  return `<${Math.round((lthr * pct) / 100)} bpm`;
}
