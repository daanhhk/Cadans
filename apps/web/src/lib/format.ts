// NL-getalformattering (komma-decimaal) — geen kale punt-decimalen in de UI.
const int = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dec2 = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const upTo1 = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });
const signed1 = new Intl.NumberFormat("nl-NL", {
  signDisplay: "always",
  maximumFractionDigits: 1,
});

/** Heel getal, NL (bv. 275). */
export const nlInt = (n: number): string => int.format(n);
/** Exact 1 decimaal, NL (bv. 3,8). */
export const nlDec1 = (n: number): string => dec1.format(n);
/** Exact 2 decimalen, NL (bv. 3,82). */
export const nlDec2 = (n: number): string => dec2.format(n);
/** Tot 1 decimaal, NL (bv. 72 of 72,5). */
export const nlUpTo1 = (n: number): string => upTo1.format(n);
/** Met vast teken, tot 1 decimaal, NL (bv. +7 / -3,2) — voor TSB. */
export const nlSigned1 = (n: number): string => signed1.format(n);

/**
 * De DUURCEL van een engine-blok (`structuur[i][1]`), opgemaakt op de RENDERRAND.
 *
 * WAAROM HIER EN NIET IN DE ENGINE. Die string draagt al ruis — gemeten: 51 gevallen over 660
 * weken, waaronder een cooldown van "9.000000000000004 min" bij Drempel 2x20 — maar hij wordt
 * óók door `dslBlockFromRow_` geparseerd voor de workout die naar intervals.icu en Garmin gaat.
 * Een Nederlandse komma in de BRON laat die parse stilzwijgend terugvallen op één enkele lap.
 * De engine blijft daarom onaangeroerd; opmaken gebeurt uitsluitend bij het tonen.
 *
 * VIER VORMEN, gemeten over alle archetypes: "# min", "#x # min", "#x # sec" en "#x #min" —
 * die laatste ZONDER spatie voor de eenheid. Bij de herhalingsvormen is het EERSTE getal het
 * AANTAL en het tweede de DUUR, dus opgemaakt wordt het LAATSTE getal; het aantal, het
 * maal-teken, de spatiëring en de eenheid blijven byte-identiek.
 *
 * Kent de functie de vorm niet, dan komt de string ONGEWIJZIGD terug — niet gokken. Een nieuwe
 * vorm hoort zichtbaar te worden als onopgemaakte cel, niet stil verminkt.
 */
const BLOK_DUUR_RE = /^(\d+\s*x\s*)?(\d+(?:[.,]\d+)?)(\s*)(min|sec)$/;
export function nlBlokDuur(cel: string): string {
  const m = BLOK_DUUR_RE.exec(cel);
  if (!m) return cel;
  const n = Number(m[2].replace(",", "."));
  if (!Number.isFinite(n)) return cel;
  return `${m[1] ?? ""}${nlUpTo1(n)}${m[3]}${m[4]}`;
}
