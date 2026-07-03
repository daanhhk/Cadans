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
