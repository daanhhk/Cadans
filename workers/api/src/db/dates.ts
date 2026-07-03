/**
 * dates.ts — de ENIGE D1 ↔ engine datum-conversielaag.
 *
 * De pure engine leest/schrijft Date-objecten op lokale-middernacht en formatteert
 * met lokale getters, ONDER de TZ=Europe/Amsterdam-pin (spiegelt de GAS/V8-oorsprong:
 * `new Date(y,m,d)` + `Utilities.formatDate(x,'Europe/Amsterdam',fmt)`). D1 slaat
 * datums als TEXT op. Deze module mapt beide kanten op EXACT dezelfde manier als de
 * engine, zodat de dag-keying identiek blijft.
 *
 * - `fromD1`  : kale `YYYY-MM-DD` → `new Date(y, m-1, d)` (lokale middernacht);
 *   datetime `YYYY-MM-DDTHH:mm:ss` (start_date_local-stijl, zonder Z) → lokale parse.
 * - `toD1Date`/`toD1DateTime` : canonieke TEXT via de engine-`formatDate` (identieke
 *   token-semantiek). De round-trip is TZ-invariant; absolute Amsterdam-correctheid
 *   leunt op de ambient-TZ-pin (test-env nu; Worker-runtime-pin = Fase 4-debt).
 */
import { formatDate } from "@cadans/engine";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function fromD1(text: string): Date {
  const m = DATE_ONLY.exec(text);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  // datetime zonder Z → lokale parse (ES2015+ interpreteert dit als local time)
  return new Date(text);
}

export function toD1Date(d: Date): string {
  return formatDate(d, "yyyy-MM-dd");
}

export function toD1DateTime(d: Date): string {
  return formatDate(d, "yyyy-MM-ddTHH:mm:ss");
}
