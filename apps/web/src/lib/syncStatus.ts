// In-memory sync-status (sessie-scope). Houdt het laatste geslaagde intervals-sync-tijdstip
// bij als een module-variabele: overleeft een component-re-mount binnen de sessie, maar is leeg
// na een echte page-reload. PUUR t.o.v. D1/routes — enkel een ms-tijdstip + afgeleide
// predicaten/formatters (spiegelt het bump/subscribe-patroon van plannerSignal.ts qua vorm).

// Binnen dit venster geldt de laatste sync als "vers" → de auto-sync slaat over (dekt de
// StrictMode-dev-dubbelinvoke via een tijdstip zodra gezet, plus een snelle re-mount).
export const STALE_MS = 120000; // 2 min

let lastSyncTs: number | null = null;

/** Laatste geslaagde-sync-tijdstip in ms, of null als er in deze sessie nog niet is gesynct. */
export function getLastSyncTs(): number | null {
  return lastSyncTs;
}

/** Zet het laatste-sync-tijdstip (ms). */
export function setLastSyncTs(ms: number): void {
  lastSyncTs = ms;
}

// In-flight-vlag: synchroon gezet bij het starten van een auto-sync, gewist bij settle. Vangt de
// StrictMode-dev-dubbelinvoke (twee mount-passes in dezelfde tick) + gelijktijdige mounts af — de
// staleness-guard alléén kan dat niet, want het tijdstip wordt pas ná de await gezet.
let syncInFlight = false;

/** Draait er nu een auto-sync? */
export function isSyncInFlight(): boolean {
  return syncInFlight;
}

/** Markeer het begin/einde van een auto-sync (synchroon). */
export function setSyncInFlight(v: boolean): void {
  syncInFlight = v;
}

/**
 * Puur staleness-predicaat: is een sync op `last` nog vers t.o.v. `now`
 * (minder dan STALE_MS geleden)? `last == null` (nooit gesynct) → niet vers.
 */
export function isSyncFresh(last: number | null, now: number): boolean {
  if (last == null) return false;
  return now - last < STALE_MS;
}

/**
 * Puur: ms-tijdstip → "HH:mm" in lokale (ambient Amsterdam) tijd. Gebruikt de lokale
 * Date-getters (getHours/getMinutes) — GEEN toISOString/UTC-round-trip.
 */
export function formatSyncTime(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
