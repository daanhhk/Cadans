import { formatDate } from "@cadans/engine";
import type { PlannerDay, PlannerDayInput } from "@cadans/shared";
import { parseLocalDate } from "./dates";

// Weekplanner-form-laag: dagtype-opties + pure helpers (week-datums, pre-fill uit de
// GET, serialisatie naar de PUT-body). Losse per-week editor: lege week = alle dagen
// uit (geen default-seed).

// Toegestane dagtypes = exact de engine-set (pendel = multi-sessie-tak in proposal.ts;
// vrij/weekend/recovery = normale dag). Bron: engine-selftest dW-helper + GAS
// DAGTYPE_OPTIONS. Values = de ruwe engine-strings, NL-labels als display.
export const DAGTYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "pendel", label: "Pendel" },
  { value: "vrij", label: "Vrij" },
  { value: "weekend", label: "Weekend" },
  { value: "recovery", label: "Herstel" },
];

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
  dagtype: string;
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
      dagtype: e?.dagtype ?? "",
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
      dagtype: d.dagtype ? d.dagtype : null,
      toelichting: tl ? tl : null,
    };
  });
}
