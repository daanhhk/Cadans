import { formatDate } from "@cadans/engine";
import type { PlannerDay, PlannerDayInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// Weekplanner-form-laag: pure helpers (week-datums, pre-fill uit de GET, serialisatie
// naar de PUT-body). Losse per-week editor: lege week = alle dagen uit (geen default-seed).
// De user kiest GEEN dagtype meer — enkel Pendel? (naast Train? + minuten); dagtype wordt
// afgeleid (deriveDagtype, spiegelt GAS Script.html:1035). `recovery` komt NOOIT uit
// availability (het wellness-signal dekt de recovery-behoefte, engine-kant).

/** De 4 engine-dagtypes (`d.type`). De availability-afleiding levert alleen de eerste 3. */
export type DagType = "pendel" | "weekend" | "vrij" | "recovery";

/**
 * Client-side dagtype-afleiding — pendel wint van weekend (pendel EERST gecheckt, exact
 * GAS Script.html:1035): `pendel ? 'pendel' : (weekend ? 'weekend' : 'vrij')`.
 */
export function deriveDagtype(pendel: boolean, isWeekend: boolean): DagType {
  return pendel ? "pendel" : isWeekend ? "weekend" : "vrij";
}

const NL_DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const NL_MONTHS = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

/** ISO-datum + n dagen → ISO (lokale kalender, DST-veilig). */
export function isoAddDays(iso: string, n: number): string {
  const d = parseLocalDate(iso);
  return formatDate(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n),
    "yyyy-MM-dd",
  );
}

/** De 7 datums (ma-zo) vanaf een maandag-ISO. */
export function weekDatesFromMonday(mondayISO: string): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => isoAddDays(mondayISO, i));
}

/** Weekdag-label (ma-zo) voor een ISO-datum. */
export function weekdayLabel(iso: string): string {
  const d = parseLocalDate(iso).getDay(); // 0=zo..6=za
  return NL_DAYS[(d + 6) % 7] ?? "";
}

/** Za/Zo? TZ-veilig via parseLocalDate (yyyy-MM-dd → lokale (y,m-1,d)-constructor). */
export function isWeekend(iso: string): boolean {
  const dow = parseLocalDate(iso).getDay(); // 0=zo..6=za
  return dow === 0 || dow === 6;
}

/** Dag-nummer voor een ISO-datum. */
export function dayNum(iso: string): number {
  return parseLocalDate(iso).getDate();
}

/** "6 – 12 jul 2026"-achtige range-aanduiding voor de weekkop. */
export function weekRangeLabel(mondayISO: string): string {
  const mon = parseLocalDate(mondayISO);
  const sun = parseLocalDate(isoAddDays(mondayISO, 6));
  const m1 = NL_MONTHS[mon.getMonth()] ?? "";
  const m2 = NL_MONTHS[sun.getMonth()] ?? "";
  const left = m1 === m2 ? `${mon.getDate()}` : `${mon.getDate()} ${m1}`;
  return `${left} – ${sun.getDate()} ${m2} ${sun.getFullYear()}`;
}

/** Form-state voor één dag (input-strings). */
export interface DayForm {
  datum: string;
  train: boolean;
  minuten: string;
  /** Pendel?-toggle (onafhankelijk van Train?, net als GAS). */
  pendel: boolean;
  toelichting: string;
}

/**
 * Bouw de 7-daagse form uit de maandag + de bestaande GET-rijen (kan < 7 of leeg
 * zijn). Ontbrekende/uit-dag → geen train (lege week = alle dagen uit). Merge op datum.
 */
export function buildWeekForm(
  mondayISO: string,
  existing: PlannerDay[],
): DayForm[] {
  const byDate = new Map(existing.map((d) => [d.datum, d]));
  return weekDatesFromMonday(mondayISO).map((datum) => {
    const e = byDate.get(datum);
    return {
      datum,
      train: e?.train ?? false,
      minuten: e?.minuten != null ? String(e.minuten) : "",
      pendel: e?.dagtype === "pendel",
      toelichting: e?.toelichting ?? "",
    };
  });
}

/** Form → PUT-body: niet-train-dag = nulls; train-dag = getypeerde invoer. */
export function formToInputs(days: DayForm[]): PlannerDayInput[] {
  return days.map((d) => {
    if (!d.train) {
      return {
        datum: d.datum,
        train: false,
        minuten: null,
        dagtype: null,
        toelichting: null,
      };
    }
    const min = d.minuten.trim();
    const n = min ? Number(min) : Number.NaN;
    const tl = d.toelichting.trim();
    return {
      datum: d.datum,
      train: true,
      minuten: min && !Number.isNaN(n) ? n : null,
      // dagtype AFGELEID (nooit door de user gekozen): pendel > weekend > vrij.
      dagtype: deriveDagtype(d.pendel, isWeekend(d.datum)),
      toelichting: tl ? tl : null,
    };
  });
}
