// NL-getalformattering (komma-decimaal) — geen kale punt-decimalen in de UI.
const int = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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
/** Tot 1 decimaal, NL (bv. 72 of 72,5). */
export const nlUpTo1 = (n: number): string => upTo1.format(n);
/** Met vast teken, tot 1 decimaal, NL (bv. +7 / -3,2) — voor TSB. */
export const nlSigned1 = (n: number): string => signed1.format(n);
