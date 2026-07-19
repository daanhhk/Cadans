/**
 * weekplanFreeze — het verleden bevriezen bij het schrijven van het plan-van-record.
 *
 * Port van de GAS-beslissing `snapshotDayAction_` (bevroren bron: definitie Algorithm.gs:57,
 * aanroep :185, waarheidstabel SelfTest.gs:748-758). GAS bepaalt per dag VÓÓR de train/type-
 * guard wat er met de weekplan-entry gebeurt:
 *
 *   verleden + bestaande entry            → freeze  (behoud de OUDE entry, ook zonder type)
 *   verleden zonder bestaande entry       → de payload-entry (als die er is), anders niets
 *   vandaag / toekomst                    → altijd vers uit de payload (nooit bevriezen)
 *
 * Waarom dit dragend is en niet netjes-zijn tegenover de historie: `rpeLastWeekMismatch_`
 * (Algorithm.gs:2005) vergelijkt het ervaren RPE van VORIGE week met het plan van tóén
 * (`plannedTypeForDate_(dISO, lastMondayISO)`, :2015). Herbouwen met de settings-van-nu maakt
 * die vergelijking betekenisloos. Zie docs/PLAN-VAN-RECORD-RECON.md §3b + §4.4.
 *
 * De freeze hoort in de WORKER: de client kent zijn lokale dag (todayISO in de body), maar
 * mag niet bepalen of het verleden overschreven mag worden.
 */

/** Datum-drager; de rest van de entry is opaak (door de engine geproduceerd, as-is bewaard). */
interface DatedEntry {
  datum?: unknown;
}

function datumOf(e: unknown): string | null {
  const d = (e as DatedEntry | null)?.datum;
  return typeof d === "string" ? d : null;
}

/**
 * Merge de payload met de opgeslagen week volgens snapshotDayAction_-semantiek.
 * ISO-datums (yyyy-MM-dd) zijn lexicografisch vergelijkbaar → `datum < todayISO` = verleden.
 *
 * @param stored   de al opgeslagen entries (readWeekplan), of null als er niets ligt
 * @param payload  de verse entries van de client
 * @param todayISO de lokale dag van de client (yyyy-MM-dd)
 */
export function mergeFrozenWeekplan(
  stored: unknown[] | null,
  payload: unknown[],
  todayISO: string,
): unknown[] {
  const storedByDate = new Map<string, unknown>();
  for (const e of stored || []) {
    const d = datumOf(e);
    if (d) storedByDate.set(d, e);
  }

  const out: unknown[] = [];
  const seen = new Set<string>();
  for (const e of payload || []) {
    const d = datumOf(e);
    if (!d) {
      // Datumloze entry: niets om op te bevriezen → laat 'm door (as-is-contract).
      out.push(e);
      continue;
    }
    seen.add(d);
    const frozen = d < todayISO ? storedByDate.get(d) : undefined;
    // verleden + bestaande entry → freeze; anders de verse payload-entry.
    out.push(frozen !== undefined ? frozen : e);
  }

  // Bevroren dagen die de payload NIET meer noemt (de client stuurt alleen dagen mét
  // sessies) mogen niet verdwijnen — GAS pusht ze ook terug op de weekplan-array.
  for (const [d, e] of storedByDate) {
    if (d < todayISO && !seen.has(d)) out.push(e);
  }

  // Chronologisch, zodat de blob een stabiele volgorde houdt (de dedup-vergelijking en
  // de latere blob→grid-uitlijning leunen op datum, niet op positie — V14).
  out.sort((a, b) => {
    const da = datumOf(a) ?? "";
    const db = datumOf(b) ?? "";
    return da < db ? -1 : da > db ? 1 : 0;
  });
  return out;
}
