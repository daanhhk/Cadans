/**
 * sync.ts — pure activity-mapper + upsert-merge helpers, ported from
 * training/src/Sync.gs (the SpreadsheetApp/UrlFetchApp/DocProps-coupled
 * orchestration — syncActivities/syncAll/reconcile etc. — stays in GAS).
 *
 * Byte-identical logic to the source: activityToRow_ (17-element row map),
 * mergeById_ (id-primary upsert + minute-fallback), sortActivityRowsNewestFirst_
 * (pure newest-first copy), plus the small pure helpers they lean on
 * (_rowId_, rowMinuteKey_, powerAvg_, powerNorm_).
 *
 * ACT_HEADERS / ACT_ZONE_TIMES_IDX / ACT_ID_IDX are lifted verbatim from
 * training/src/Activiteiten.gs.
 */

// ── Activiteiten-tab schema (verbatim uit Activiteiten.gs) ───────────

export const ACT_HEADERS = [
  "Datum",
  "Type",
  "Naam",
  "Duur (min)",
  "Afstand (km)",
  "Gem W",
  "Norm W",
  "IF",
  "TSS",
  "Gem HR",
  "Max HR",
  "PI",
  "FTP",
  "Gewicht",
  "Rolling FTP",
  "Zone-tijden",
  "Activiteit-ID",
];

// idx15 — icu_zone_times als compacte JSON-string (leeg = geen power-zonedata).
// APPEND-only kolom: blijft op 15 ook als er later kolommen achteraan komen.
// Leesbron voor de 0-API zone-debt (zoneTimesFromCell_ → tryPowerZoneTimes_).
export const ACT_ZONE_TIMES_IDX = 15;

// idx16 — intervals.icu activity-`id` als string (leeg voor pre-migratie rijen).
// APPEND-only. Upsert-sleutel voor de incrementele sync (mergeById_).
export const ACT_ID_IDX = 16;

// ── Activity field fallback helpers ──────────────────────────────

/**
 * Gemiddeld vermogen — probeert meerdere veldnaam-varianten.
 * intervals.icu gebruikt soms icu_average_watts (eigen berekening),
 * soms average_watts (Strava-pulled), soms avg_power (legacy).
 */
export function powerAvg_(act: any): any {
  return act.icu_average_watts ?? act.average_watts ?? act.avg_power ?? null;
}

/**
 * Normalized Power — idem, meerdere mogelijke veldnamen.
 */
export function powerNorm_(act: any): any {
  return (
    act.icu_weighted_avg_watts ??
    act.weighted_average_watts ??
    act.normalized_power ??
    act.icu_normalized_power ??
    null
  );
}

/**
 * Pure mapper: één intervals.icu activity → 17-element Activiteiten-rij (idx0..16).
 * idx0-15 byte-identiek aan de oude inline-map (IF=percentage idx7, zone-tijden
 * JSON idx15); idx16 = activity-`id` als string (upsert-sleutel, leeg zonder id).
 */
export function activityToRow_(a: any): any[] {
  var avg = powerAvg_(a);
  var norm = powerNorm_(a);
  var ifv = a.icu_intensity ?? a.intensity ?? null;
  var tss = a.icu_training_load ?? a.training_load ?? a.tss ?? null;
  var pi = a.polarization_index ?? a.icu_polarization_index ?? null;
  var ahr = a.average_heartrate ?? a.avg_hr ?? null;
  var mhr = a.max_heartrate ?? a.max_hr ?? null;

  return [
    a.start_date_local ? new Date(a.start_date_local) : "",
    a.type || "",
    a.name || "",
    a.moving_time != null ? Math.round(a.moving_time / 60) : "",
    a.distance != null ? Math.round(a.distance / 100) / 10 : "",
    avg != null ? avg : "",
    norm != null ? norm : "",
    ifv != null ? Math.round(ifv * 100) / 100 : "",
    tss != null ? Math.round(tss) : "",
    ahr != null ? ahr : "",
    mhr != null ? mhr : "",
    pi != null ? Math.round(pi * 100) / 100 : "",
    a.icu_ftp != null ? a.icu_ftp : "", // gezette FTP @ rit
    a.icu_weight != null ? a.icu_weight : "", // gewicht @ rit
    a.icu_rolling_ftp != null ? a.icu_rolling_ftp : "", // rolling/eFTP (2c)
    // idx15 — icu_zone_times als JSON (0-API zone-debt); leeg zonder power-zonedata.
    a.icu_zone_times && a.icu_zone_times.length
      ? JSON.stringify(a.icu_zone_times)
      : "",
    // idx16 — activity-id (upsert-sleutel); leeg indien de respons geen id draagt.
    a.id != null ? String(a.id) : "",
  ];
}

/**
 * Sorteert Activiteiten-rij-arrays nieuwste-eerst op idx0 (datum). Stabiel + pure (kopie).
 * COSMETISCH: de correctheid zit in de timestamp-reads (dashActualsByDate_ / eftpFrom-
 * Activities_ / actAnchorDate_), niet in deze volgorde — append-only-writes mogen dit
 * later laten vallen. Gedeeld door syncActivities + syncActivitiesIncremental_.
 */
export function sortActivityRowsNewestFirst_(rows: any[]): any[] {
  return rows.slice().sort((a, b) => {
    var ta = a[0] instanceof Date ? a[0].getTime() : 0;
    var tb = b[0] instanceof Date ? b[0].getTime() : 0;
    return tb - ta;
  });
}

/** Activity-id van een tab-rij (idx16) → string of '' (leeg = pre-migratie rij). */
export function _rowId_(r: any): string {
  var v = r[ACT_ID_IDX];
  return v != null && v !== "" ? String(v) : "";
}

/** Minuut-afgeronde timestamp-sleutel van een rij-datum (idx0) → number of null. */
export function rowMinuteKey_(d: any): number | null {
  if (!(d instanceof Date)) return null;
  var t = d.getTime();
  if (isNaN(t)) return null;
  return Math.floor(t / 60000);
}

/**
 * Pure upsert-merge: bestaande tab-rijen + verse activities → {rows, added, updated}.
 * Match PRIMAIR op idx16 (activity-id). FALLBACK (alleen existing-rijen met lege id)
 * op minuut-afgeronde idx0-timestamp → migreert pre-migratie rijen + zet de id erin.
 * Match → vervang in-plaats (array-positie behouden, updated++); geen match → append
 * (added++). Existing-rijen buiten de verse set blijven ongemoeid (NOOIT verwijderen).
 * Volledig deterministisch (sleutels uit de data, geen now/today).
 */
export function mergeById_(existingRows: any[], freshActivities: any[]): any {
  var rows = (existingRows || []).map((r) => r.slice());
  var added = 0,
    updated = 0;
  var byId: any = {},
    byMin: any = {};

  for (var i = 0; i < rows.length; i++) {
    var rid = _rowId_(rows[i]);
    if (rid) {
      if (!(rid in byId)) byId[rid] = i;
    } else {
      var mk = rowMinuteKey_(rows[i][0]); // alleen lege-id rijen doen mee aan de fallback
      if (mk != null && !(mk in byMin)) byMin[mk] = i;
    }
  }

  (freshActivities || []).forEach((a) => {
    var newRow = activityToRow_(a);
    var id = _rowId_(newRow);
    if (id && id in byId) {
      rows[byId[id]] = newRow;
      updated++;
      return;
    }
    var nmk = rowMinuteKey_(newRow[0]);
    if (nmk != null && nmk in byMin) {
      var pos = byMin[nmk];
      rows[pos] = newRow;
      updated++; // pre-migratie rij → nu mét id
      if (id) byId[id] = pos;
      delete byMin[nmk];
      return;
    }
    rows.push(newRow);
    added++;
    if (id) byId[id] = rows.length - 1;
  });

  return { rows: rows, added: added, updated: updated };
}
