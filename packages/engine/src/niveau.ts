/**
 * niveau.ts — pure dashboard/niveau helpers, 1:1 port of the PURE functions in
 * training/src/WebApp.gs. No GAS globals, no HtmlService/Sheet/DocProps IO.
 *
 * Utilities.formatDate(x, 'Europe/Amsterdam', fmt) → formatDate(x, fmt).
 * Logger.log → console.debug. stripTime_ from ./utils.
 *
 * NB: dashNiveauReeks_ calls getGewicht() (see the function's own comment) —
 * that reads Settings/DocProps in the source and is NOT ported here. It is
 * declared as an injectable module seam below; the caller must wire it. In the
 * SelfTest path (rows carry weight at idx13) the value is only used as a
 * per-month fallback, so the default returns 0 (behaviour-identical for the
 * suite). See the flag in the port report.
 */
import { formatDate, stripTime_ } from "./utils";

// ── Injectable seam for the untported getGewicht() (Settings.gs:315). ─────────
// Source: `return Number(loadSettingValue('gewicht')) || SETTINGS_DEFAULTS.gewicht;`
// — a DocProps/Sheet read, deliberately NOT ported into this pure module. Only
// consumed by dashNiveauReeks_ as a fallback weight. Wire it from the host if a
// real current weight is needed; default 0 keeps the pure path deterministic.
let _getGewichtImpl: () => number = () => 0;
export function setGewichtProvider(fn: () => number): void {
  _getGewichtImpl = fn;
}
function getGewicht(): number {
  return _getGewichtImpl();
}

// ── Bucket → kleur/hoogte (zone-balk) ────────────────────────────
// Fijne 5-bucket schaal voor blokken (Optie B); de intent-fallback gebruikt
// alleen low/high/anaerobic.
export var DASH_BUCKET_STYLE_: any = {
  rust: { kleur: "#cfd8dc", hoogtePct: 25 },
  z2: { kleur: "#4fc3f7", hoogtePct: 45 },
  tempo: { kleur: "#ffd54f", hoogtePct: 65 },
  drempel: { kleur: "#66bb6a", hoogtePct: 85 },
  anaeroob: { kleur: "#ef6c00", hoogtePct: 100 },
  // intent-fallback buckets
  low: { kleur: "#4fc3f7", hoogtePct: 45 },
  high: { kleur: "#ffd54f", hoogtePct: 65 },
  anaerobic: { kleur: "#ef6c00", hoogtePct: 100 },
};
export var DASH_INTENT_ORDER_: any = ["low", "high", "anaerobic"];

/** Optie B: geordende blokken [{minuten, zone}] → zone-balk segmenten. */
export function segmentsFromBlokken_(blokken: any): any {
  if (!blokken || !blokken.length) return null;
  var segs: any[] = [];
  blokken.forEach((b: any) => {
    var min = Number(b.minuten) || 0;
    if (min <= 0) return;
    var st = DASH_BUCKET_STYLE_[b.zone] || DASH_BUCKET_STYLE_.z2;
    segs.push({
      minuten: min,
      bucket: b.zone,
      kleur: st.kleur,
      hoogtePct: st.hoogtePct,
      pctLo: b.pctLo,
      pctHi: b.pctHi,
    });
  });
  return segs.length ? segs : null;
}

/** Fallback: intent {low,high,anaerobic} → één segment per bucket. */
export function segmentsFromIntent_(intent: any): any {
  if (!intent) return [];
  var segs: any[] = [];
  DASH_INTENT_ORDER_.forEach((b: any) => {
    var min = Math.round(Number(intent[b]) || 0);
    if (min <= 0) return;
    var st = DASH_BUCKET_STYLE_[b];
    segs.push({
      minuten: min,
      bucket: b,
      kleur: st.kleur,
      hoogtePct: st.hoogtePct,
    });
  });
  return segs;
}

// ── Tab-lezers (read-only) ───────────────────────────────────────

/**
 * Single-pass scan over de Activiteiten-tab-array (idx0..15). Vult in ÉÉN
 * iteratie de accumulators voor dashActualsByDate_ / dashStatsFromActivities_ /
 * dashBeginAnker_ / dashNiveauReeks_ (READ-ONCE-THREAD). De vier outputs blijven
 * byte-identiek aan de losse fns; deze collapse't 4 (5 incl. niveau's interne
 * anker-call) full-passes naar 1. `empty` = de truthy-lege-actValues-tak van stats.
 */
export function dashActivityScan_(actValues: any): any {
  var scan: any = {
    actualsByDate: {},
    stats: {
      d7: { tss: 0, tijdMin: 0, ritten: 0 },
      d28: { tss: 0, tijdMin: 0, ritten: 0 },
      jaar: { tss: 0, tijdMin: 0, ritten: 0 },
    },
    maand: {},
    oudsteT: null,
    oudsteRow: null,
    byMonth: {},
    now: stripTime_(new Date()).getTime(),
    empty: !actValues || !actValues.length,
  };
  if (!actValues || !actValues.length) return scan;
  var actTByKey: any = {}; // per datum-key de winnaar-timestamp (idx0 incl. tijd) — volgorde-onafhankelijk
  actValues.forEach((r: any) => {
    if (!(r[0] instanceof Date)) return;
    var d = r[0];
    var key = formatDate(d, "yyyy-MM-dd");
    var mk = formatDate(d, "yyyy-MM");
    var t = stripTime_(d).getTime();

    // (1) actualsByDate — HOOGSTE idx0-timestamp per datum wint (volgorde-onafhankelijk).
    // NB: t is stripTime'd (middernacht) en scheidt same-day-ritten niet → vergelijk op d.getTime().
    var tFull = d.getTime();
    if (!(key in actTByKey) || tFull > actTByKey[key]) {
      actTByKey[key] = tFull;
      scan.actualsByDate[key] = {
        naam: String(r[2] || "Rit"),
        duurMin: Number(r[3]) || 0,
        tss: r[8] !== "" && r[8] != null ? Number(r[8]) : null,
        ifReal: r[7] !== "" && r[7] != null ? Number(r[7]) : null, // IF (idx7) — coach-engine
      };
    }

    // (2) stats: d7/d28/jaar-buckets + maandtotalen + oudste t
    var min = Number(r[3]) || 0;
    var tss = r[8] !== "" && r[8] != null ? Number(r[8]) : 0;
    var ageDays = (scan.now - t) / 86400000;
    if (ageDays >= 0 && ageDays < 7) {
      scan.stats.d7.tss += tss;
      scan.stats.d7.tijdMin += min;
      scan.stats.d7.ritten++;
    }
    if (ageDays >= 0 && ageDays < 28) {
      scan.stats.d28.tss += tss;
      scan.stats.d28.tijdMin += min;
      scan.stats.d28.ritten++;
    }
    if (ageDays >= 0 && ageDays < 365) {
      scan.stats.jaar.tss += tss;
      scan.stats.jaar.tijdMin += min;
      scan.stats.jaar.ritten++;
    }
    if (!scan.maand[mk])
      scan.maand[mk] = { maand: mk, ritten: 0, tijdMin: 0, tss: 0 };
    scan.maand[mk].ritten++;
    scan.maand[mk].tijdMin += min;
    scan.maand[mk].tss += tss;
    if (scan.oudsteT === null || t < scan.oudsteT) scan.oudsteT = t;

    // (3) oudste ROW (niveau-anker) — eerste-min-wint (strikt <, byte-identiek aan dashBeginAnker_)
    if (!scan.oudsteRow || t < stripTime_(scan.oudsteRow[0]).getTime())
      scan.oudsteRow = r;

    // (4) byMonth (niveau) — laatste-op-datum met BEIDE ftp(idx12)+gewicht(idx13) gevuld
    var ftp = r[12] !== "" && r[12] != null ? Number(r[12]) : null;
    var gew = r[13] !== "" && r[13] != null ? Number(r[13]) : null;
    if (ftp != null && gew != null) {
      if (!scan.byMonth[mk] || t > scan.byMonth[mk].t)
        scan.byMonth[mk] = { t: t, ftp: ftp, gewicht: gew };
    }
  });
  return scan;
}

/** Oudste-rij → niveau/anker-object {datum, ftp, gewicht} (idx0/12/13), null bij geen rij. */
export function _ankerFromRow_(row: any): any {
  if (!row) return null;
  return {
    datum: row[0],
    ftp: row[12] !== "" && row[12] != null ? Number(row[12]) : null,
    gewicht: row[13] !== "" && row[13] != null ? Number(row[13]) : null,
  };
}

/** Activiteiten-tab → map dISO → {naam, duurMin, tss, ifReal} (nieuwste wint).
 *  actValues (optioneel) = voor-gelezen readActiviteitenValues_() — anders zelf-lezen.
 *  scan (optioneel) = gedeelde dashActivityScan_ (READ-ONCE-THREAD). */
export function dashActualsByDate_(actValues: any, scan?: any): any {
  if (!scan) scan = dashActivityScan_(actValues || []);
  return scan.actualsByDate;
}

/** Wellness-tab CTL/ATL/Vorm reeks (oudste→nieuwste) + stats-bron. */
export function dashVormReeks_(wellValues: any): any {
  if (!wellValues) wellValues = [];
  var out: any[] = [];
  if (!wellValues || !wellValues.length) return out;
  var data = wellValues;
  data.forEach((r: any) => {
    if (!(r[0] instanceof Date)) return;
    var ctl = r[8],
      atl = r[9],
      vorm = r[10];
    if (ctl === "" && atl === "" && vorm === "") return;
    out.push({
      dateISO: formatDate(r[0], "yyyy-MM-dd"),
      ctl: ctl === "" ? null : Number(ctl),
      atl: atl === "" ? null : Number(atl),
      vorm: vorm === "" ? null : Number(vorm),
    });
  });
  out.sort((a: any, b: any) => (a.dateISO < b.dateISO ? -1 : 1)); // oudste links
  return out;
}

export var DASH_WD_: any = ["zo", "ma", "di", "wo", "do", "vr", "za"];
export var DASH_MAAND_: any = [
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
export function dashKort_(d: any): string {
  return (
    DASH_WD_[d.getDay()] + " " + d.getDate() + " " + DASH_MAAND_[d.getMonth()]
  );
}
export function dashWeekdag_(d: any): string {
  var v: any = [
    "zondag",
    "maandag",
    "dinsdag",
    "woensdag",
    "donderdag",
    "vrijdag",
    "zaterdag",
  ];
  return v[d.getDay()];
}

// ── Stats (d7/d28/jaar + maandtotalen) ───────────────────────────
//  scan (optioneel) = gedeelde dashActivityScan_ (READ-ONCE-THREAD); anders zelf-lezen.
export function dashStatsFromActivities_(actValues: any, scan?: any): any {
  if (!scan) scan = dashActivityScan_(actValues || []);
  var res: any = {
    d7: {
      tss: Math.round(scan.stats.d7.tss),
      tijdMin: scan.stats.d7.tijdMin,
      ritten: scan.stats.d7.ritten,
    },
    d28: {
      tss: Math.round(scan.stats.d28.tss),
      tijdMin: scan.stats.d28.tijdMin,
      ritten: scan.stats.d28.ritten,
    },
    jaar: {
      tss: Math.round(scan.stats.jaar.tss),
      tijdMin: scan.stats.jaar.tijdMin,
      ritten: scan.stats.jaar.ritten,
    },
  };
  if (scan.empty) return { stats: res, maandTotalen: [] };
  var maandArr = Object.keys(scan.maand)
    .sort()
    .reverse()
    .slice(0, 12)
    .map((k: any) => {
      var m = scan.maand[k];
      return {
        maand: m.maand,
        ritten: m.ritten,
        tijdMin: m.tijdMin,
        tss: Math.round(m.tss),
      };
    });
  // Werkelijke historie-span: de Activiteiten-tab wordt door syncActivities
  // met getActivities(28) gevoed → ~28 dagen, dus "jaar" == d28. Geef de span
  // mee zodat de client het jaar-label eerlijk kan degraderen.
  var oudste = scan.oudsteT;
  var spanDagen =
    oudste !== null ? Math.round((scan.now - oudste) / 86400000) : 0;
  return {
    stats: res,
    maandTotalen: maandArr,
    spanDagen: spanDagen,
    eersteDatum:
      oudste !== null ? formatDate(new Date(oudste), "yyyy-MM-dd") : null,
  };
}

/** Oudste Activiteiten-rij (= vroegste datum) → begin-anker voor niveau-historie.
 *  Kolommen: A datum(0), M FTP(12), N Gewicht(13). Null bij ontbreken/pre-backfill.
 *  scan (optioneel) = gedeelde dashActivityScan_ (READ-ONCE-THREAD). */
export function dashBeginAnker_(_ss: any, actValues: any, scan?: any): any {
  if (!scan) scan = dashActivityScan_(actValues || []);
  return _ankerFromRow_(scan.oudsteRow);
}

/**
 * 2c: niveau (0–50 W/kg-metric) per kalendermaand, begin-ankermaand → nu.
 * Onafhankelijk van vorm.reeks (Wellness ~30d). Per maand = ftp+gewicht van
 * de LAATSTE rij (op datum) met beide gevuld; begin-ankermaand = exact
 * beginNiveau. Ontbrekende maand → niveau:null (chart interpoleert).
 * Shape: [{maand:'yyyy-MM', niveau:Number|null, ftp:Number|null, gewicht:Number|null}].
 */
export function dashNiveauReeks_(_ss: any, actValues: any, scan?: any): any {
  if (!scan) scan = dashActivityScan_(actValues || []);

  var anker = _ankerFromRow_(scan.oudsteRow);
  if (!anker || !anker.datum) return [];

  // byMonth uit de gedeelde scan; clone vóór de anker-overwrite zodat scan.byMonth
  // ongemoeid blijft (byte-identiek aan de oude lokale-byMonth-semantiek).
  var byMonth: any = {};
  Object.keys(scan.byMonth).forEach((k: any) => {
    byMonth[k] = scan.byMonth[k];
  });
  // Begin-ankermaand overschrijven zodat punt 1 EXACT beginNiveau is.
  if (anker.ftp) {
    byMonth[formatDate(anker.datum, "yyyy-MM")] = {
      t: stripTime_(anker.datum).getTime(),
      ftp: anker.ftp,
      gewicht: anker.gewicht || null,
    };
  }

  var huidigGewicht = getGewicht();
  var now = new Date();
  var out: any[] = [];
  var cur = new Date(anker.datum.getFullYear(), anker.datum.getMonth(), 1);
  while (
    cur.getFullYear() < now.getFullYear() ||
    (cur.getFullYear() === now.getFullYear() &&
      cur.getMonth() <= now.getMonth())
  ) {
    var mk2 = formatDate(cur, "yyyy-MM");
    var b = byMonth[mk2];
    var niveau = null,
      ftpM = null,
      gewM = null;
    if (b) {
      ftpM = b.ftp;
      gewM = b.gewicht;
      var nv = computeNiveau_(ftpM, gewM || huidigGewicht);
      niveau = nv.niveau != null ? Math.round(nv.niveau * 10) / 10 : null;
    }
    out.push({ maand: mk2, niveau: niveau, ftp: ftpM, gewicht: gewM });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return out;
}

// ── Niveau-tab (Fase 7) — W/kg- + fitheid(CTL)-progressie (PURE; getest) ──
// Maandelijkse CTL uit een daily PMC (exp-gewogen TSS, 42d-tau) over de
// Activiteiten-historie (idx0 datum, idx8 TSS; alle sporten = totale load, net als
// intervals.icu). CTL[d] = CTL[d-1] + (TSS[d] − CTL[d-1])/42; maand-eind wint.
// actValues = readActiviteitenValues_()-array. Returnt {'yyyy-MM': ctl} (1 dec).
export var PMC_TAU_ = 42;
export function ctlReeksMaandelijks_(actValues: any): any {
  if (!actValues || !actValues.length) return {};
  var byDay: any = {},
    minD: any = null,
    maxD: any = null;
  actValues.forEach((r: any) => {
    if (!(r[0] instanceof Date)) return;
    var d = stripTime_(r[0]),
      t = d.getTime();
    var tss = r[8] !== "" && r[8] != null ? Number(r[8]) || 0 : 0;
    byDay[t] = (byDay[t] || 0) + tss;
    if (minD === null || t < minD.getTime()) minD = d;
    if (maxD === null || t > maxD.getTime()) maxD = d;
  });
  if (minD === null) return {};
  var out: any = {},
    ctl = 0;
  var cur = new Date(minD.getFullYear(), minD.getMonth(), minD.getDate());
  var endT = maxD.getTime();
  while (cur.getTime() <= endT) {
    var tss = byDay[cur.getTime()] || 0;
    ctl = ctl + (tss - ctl) / PMC_TAU_;
    out[formatDate(cur, "yyyy-MM")] = Math.round(ctl * 10) / 10; // maand-eind = laatste dag wint
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1); // DST-immuun
  }
  return out;
}

// niveau-reeks (maand) + ctl-map → progressie-series [{maand, niveau, wkg, ctl}].
// W/kg = ftp/gewicht (2 dec) per punt; ctl = maand-CTL of null. PURE.
export function niveauProgressie_(niveauReeks: any, ctlByMonth: any): any {
  if (!Array.isArray(niveauReeks)) return [];
  ctlByMonth = ctlByMonth || {};
  return niveauReeks.map((p: any) => {
    var wkg =
      p.ftp && p.gewicht ? Math.round((p.ftp / p.gewicht) * 100) / 100 : null;
    return {
      maand: p.maand,
      niveau: p.niveau != null ? p.niveau : null,
      wkg: wkg,
      ctl: ctlByMonth[p.maand] != null ? ctlByMonth[p.maand] : null,
    };
  });
}

// ════════════════════════════════════════════════════════════════
// NIVEAU FASE-2 §c — power-curve (mean-max) normalisatie (PUUR; getest).
// ════════════════════════════════════════════════════════════════
export var PC_MARKERS_: any = [
  { sec: 5, label: "5s", key: false },
  { sec: 60, label: "1m", key: false },
  { sec: 300, label: "5m", key: true },
  { sec: 1200, label: "20m", key: true },
  { sec: 3600, label: "60m", key: true },
];
// Coggan-stijl rijderstype: per-duur W/kg → score t.o.v. [recreatief, wereldklasse]; korte vs lange duren.
// Referentieparen + gevoeligheid/banden TUNEBAAR (sluit aan op intervals.icu's 4-anker-profiel).
export var PP_REF_5S_: any = [9.7, 24.0],
  PP_REF_60S_: any = [5.5, 11.5],
  PP_REF_5M_: any = [3.4, 7.6],
  PP_REF_FT_: any = [2.8, 6.4];
export var PP_SENS_ = 2.0,
  PP_BAND_LO_ = 0.42,
  PP_BAND_HI_ = 0.58;

// Marker op de duur >= targetSec dichtstbij (exact of eerstvolgende); null als geen.
export function pcMarkerAt_(
  secs: any,
  values: any,
  wkg: any,
  actIds: any,
  targetSec: any,
): any {
  if (!secs || !secs.length) return null;
  for (var i = 0; i < secs.length; i++) {
    if (secs[i] >= targetSec) {
      var w = values && values[i] != null ? values[i] : null;
      if (w == null) return null;
      return {
        secs: secs[i],
        watts: Math.round(w),
        wkg: wkg && wkg[i] != null ? Math.round(wkg[i] * 100) / 100 : null,
        activityId: actIds && actIds[i] != null ? actIds[i] : null,
      };
    }
  }
  return null;
}

// 4 anker-W/kg (5s/60s/5m/eFTP) → rijderstype-positie 0..1 (0=Diesel·klimmer .. 1=Sprinter) + label.
// Coggan-stijl: korte duren (5s+60s) vs lange (5m+eFTP), elk gescoord t.o.v. recreatief↔wereldklasse.
export function riderTypeFromCurve_(
  wkg5: any,
  wkg60: any,
  wkg300: any,
  ftWkg: any,
): any {
  if (wkg5 == null || wkg60 == null || wkg300 == null || ftWkg == null)
    return null;
  function score(w: any, ref: any) {
    return Math.max(0, Math.min(1, (w - ref[0]) / (ref[1] - ref[0])));
  }
  var shortAvg = (score(wkg5, PP_REF_5S_) + score(wkg60, PP_REF_60S_)) / 2;
  var longAvg = (score(wkg300, PP_REF_5M_) + score(ftWkg, PP_REF_FT_)) / 2;
  var pos = Math.max(0, Math.min(1, 0.5 + (shortAvg - longAvg) * PP_SENS_));
  var label =
    pos < PP_BAND_LO_
      ? "Diesel · klimmer"
      : pos > PP_BAND_HI_
        ? "Sprinter"
        : "All-rounder";
  return { pos: Math.round(pos * 100) / 100, label: label };
}

// power-curves list[0] (+ activities-map) → genormaliseerd profiel (PUUR). curve = punten
// secs<=3600 (60min-cap), null/≤0-watt overgeslagen; markers op PC_MARKERS_; date per marker
// uit activities[activityId] (start_date_local → date → null).
export function pcNormalize_(c: any, activities?: any, ftp?: any): any {
  if (!c || !c.secs || !c.secs.length || !c.values) return { empty: true };
  activities = activities || {};
  var secs = c.secs,
    vals = c.values,
    wkg = c.watts_per_kg || [],
    actIds = c.activity_id || [];
  var curve: any[] = [];
  for (var i = 0; i < secs.length; i++) {
    if (secs[i] > 3600) break; // 60min-cap (secs oplopend)
    var w = vals[i];
    if (w == null || w <= 0) continue; // null/0-watt overslaan
    curve.push({ secs: secs[i], watts: Math.round(w) });
  }
  if (!curve.length) return { empty: true };
  var markers: any[] = [];
  PC_MARKERS_.forEach((M: any) => {
    var mk = pcMarkerAt_(secs, vals, wkg, actIds, M.sec);
    if (!mk || mk.watts == null || mk.watts <= 0) return;
    var date = null;
    if (mk.activityId != null && activities[mk.activityId]) {
      var am = activities[mk.activityId];
      date = am.start_date_local || am.date || null;
    }
    markers.push({
      secs: mk.secs,
      label: M.label,
      key: M.key,
      watts: mk.watts,
      wkg: mk.wkg,
      activityId: mk.activityId,
      date: date,
    });
  });
  // Rijderstype op 4 ankers (W/kg): 5s/60s/5m uit de markers; eFTP-W/kg = ftp/gewicht,
  // null-guard → val terug op de 20min-marker-wkg (≈ FTP-proxy).
  function mwkg_(lbl: any) {
    var f: any = null;
    markers.forEach((m: any) => {
      if (m.label === lbl) f = m;
    });
    return f && f.wkg != null ? f.wkg : null;
  }
  var ftWkg = ftp && c.weight ? ftp / c.weight : null;
  if (ftWkg == null) ftWkg = mwkg_("20m");
  return {
    window: {
      label: c.label || null,
      days: c.days || null,
      start: c.start_date_local || null,
      end: c.end_date_local || null,
    },
    weight: c.weight != null ? c.weight : null,
    curve: curve,
    markers: markers,
    riderType: riderTypeFromCurve_(
      mwkg_("5s"),
      mwkg_("1m"),
      mwkg_("5m"),
      ftWkg,
    ),
  };
}

// eFTP (API-vrij): recentste niet-lege idx14 ("Rolling FTP") uit de Activiteiten-array (newest-first).
export function eftpFromActivities_(actValues: any): any {
  if (!actValues || !actValues.length) return null;
  // Volgorde-onafhankelijk: de geldige Rolling-FTP (idx14) van de rij met de HOOGSTE
  // idx0-timestamp wint (niet de eerste array-positie). Geldigheids-check identiek.
  var bestT = -Infinity,
    bestV: any = null;
  for (var i = 0; i < actValues.length; i++) {
    var v = actValues[i][14];
    if (v === "" || v == null || isNaN(Number(v)) || Number(v) <= 0) continue;
    var d0 = actValues[i][0];
    var t =
      d0 instanceof Date && !isNaN(d0.getTime()) ? d0.getTime() : -Infinity; // ondateerbaar → laagste prio
    if (bestV === null || t > bestT) {
      bestT = t;
      bestV = Number(v);
    }
  }
  return bestV != null ? Math.round(bestV) : null;
}

// ════════════════════════════════════════════════════════════════
// NIVEAU FASE-2 §d — doel-gereedheid + projectie (PUUR; getest).
// Eerlijkheid = ontwerp-eis: SOLIDE volume→CTL-ramp vs SPECULATIEVE FTP-band.
// ════════════════════════════════════════════════════════════════
// Swap-able doel-seam: generaliseert voorbij Girona. Per dim {metric, target, unit, dir}.
export var GOAL_PROFILES_: any = {
  girona: {
    key: "girona",
    label: "Girona",
    sub: "~90 km · 1200 hm/dag · lange klimmen",
    projectieMode: "gap",
    dims: [
      {
        key: "klim",
        label: "Klimvermogen",
        metric: "ftpWkg",
        target: 4.0,
        unit: "W/kg",
        dir: "up",
      },
      {
        key: "duur",
        label: "Duurvermogen",
        metric: "ctl",
        target: 65,
        unit: "CTL",
        dir: "up",
      },
      {
        key: "lang",
        label: "Lange-rit",
        metric: "longRideH",
        target: 4.0,
        unit: "u",
        dir: "up",
      },
    ],
  },
  // FTP-doel: 'test'-projectiemodus — vaste testdatum + gegeven volume → "wat te verwachten op
  // testdag". De duur-dim (CTL 65) blijft voor chain-robuustheid maar is ONGEBRUIKT in test-modus
  // (geen gap-rij/target-lijn); de ftpBandFromProjection_-band (gevoed met ctlAtTest) IS de doel-uitspraak.
  ftp: {
    key: "ftp",
    label: "FTP",
    sub: "opbouw naar FTP-test",
    projectieMode: "test",
    dims: [
      {
        key: "duur",
        label: "Duurvermogen",
        metric: "ctl",
        target: 65,
        unit: "CTL",
        dir: "up",
      },
    ],
  },
};
export var FTP_GAIN_PER_CTL_ = 0.004,
  FTP_GAIN_CAP_ = 0.08; // speculatieve FTP-winst (tunebaar)
export var PROJ_TAU_DAYS_ = 42; // PMC-tijdconstante (CTL-ramp)

// Actief doelprofiel — doel-gedreven (PUUR, geen side-effects). FTP → ftp; Beklimmingen +
// VO2max/Conditie/onbekend/missing → girona (fallback).
export function activeGoalProfile_(settings: any): any {
  var doel = settings && settings.doel;
  if (doel === "FTP") return GOAL_PROFILES_.ftp;
  return GOAL_PROFILES_.girona;
}

// gap t.o.v. target; dir 'up' = hoger is beter. onTrack = doel gehaald; pct = voortgang 0..1.
export function goalGap_(current: any, target: any, dir: any): any {
  if (current == null || target == null)
    return { gap: null, onTrack: false, pct: null };
  var up = dir !== "down";
  var onTrack = up ? current >= target : current <= target;
  var gap = up ? target - current : current - target;
  var pct = null;
  if (target > 0 && current >= 0)
    pct = up ? current / target : target / Math.max(current, 1e-9);
  if (pct != null) pct = Math.max(0, Math.min(1, pct));
  return {
    gap: Math.round(gap * 100) / 100,
    onTrack: onTrack,
    pct: pct != null ? Math.round(pct * 100) / 100 : null,
  };
}

// plateau-CTL bij gegeven weekvolume: uren*tss/uur, verspreid over 7 dagen.
export function ctlPlateauFromVolume_(weeklyHours: any, tssPerHour: any): any {
  if (!weeklyHours || !tssPerHour) return 0;
  return Math.round(((weeklyHours * tssPerHour) / 7) * 10) / 10;
}

// weken tot targetCtl via exp. PMC-benadering (tau 42d). null = onbereikbaar; 0 = al bereikt.
export function ctlApproachWeeks_(
  currentCtl: any,
  plateauCtl: any,
  targetCtl: any,
): any {
  if (currentCtl == null || plateauCtl == null || targetCtl == null)
    return null;
  if (currentCtl >= targetCtl) return 0;
  if (plateauCtl <= targetCtl) return null; // plafond onder doel → onbereikbaar
  var tDays =
    -PROJ_TAU_DAYS_ *
    Math.log((targetCtl - plateauCtl) / (currentCtl - plateauCtl));
  if (!isFinite(tDays) || tDays < 0) return null;
  return Math.round((tDays / 7) * 10) / 10;
}

// SPECULATIEF FTP-bereik (NOOIT één getal). low = currentFtp (eerlijke vloer: winst niet gegarandeerd);
// high = currentFtp*(1 + min(cap, perCtl*max(0, plateau-current))). gewicht (optioneel) → W/kg-bereik.
export function ftpBandFromProjection_(
  currentFtp: any,
  currentCtl: any,
  plateauCtl: any,
  gewicht?: any,
): any {
  if (!currentFtp) return null;
  var dCtl = Math.max(
    0,
    plateauCtl != null && currentCtl != null ? plateauCtl - currentCtl : 0,
  );
  var gain = Math.min(FTP_GAIN_CAP_, FTP_GAIN_PER_CTL_ * dCtl);
  var lowW = Math.round(currentFtp),
    highW = Math.round(currentFtp * (1 + gain));
  return {
    lowW: lowW,
    highW: highW,
    lowWkg: gewicht ? Math.round((lowW / gewicht) * 100) / 100 : null,
    highWkg: gewicht ? Math.round((highW / gewicht) * 100) / 100 : null,
    aannames: [
      "2 sleutelsessies per week, consequent",
      "Regelmaat ≥ 90% — geen lange onderbrekingen",
      "Herstel & voeding op orde",
      "FTP-winst vlakt af richting je plafond",
    ],
  };
}

// CTL op week N via exp. PMC-benadering (tau 42d). week 0 = current; groot N → plateau;
// current>plateau → dalend richting plateau. Finite guards; null bij ontbrekende/negatieve input.
export function ctlAtWeek_(currentCtl: any, plateauCtl: any, weeks: any): any {
  if (currentCtl == null || plateauCtl == null || weeks == null) return null;
  var w = Number(weeks);
  if (!isFinite(w) || w < 0) return null;
  return (
    Math.round(
      (plateauCtl +
        (currentCtl - plateauCtl) * Math.exp((-w * 7) / PROJ_TAU_DAYS_)) *
        10,
    ) / 10
  );
}

// Hele weken (ceil) van vandaag tot doelStart + doelDuur*7 dagen (= testdag). Clamp ≥ 0; null bij
// ontbrekende/ongeldige input. Kalender-datum-rekenkunde (DST-veilig).
export function doelTestWeken_(
  doelStartISO: any,
  doelDuurWeeks: any,
  todayISO: any,
): any {
  function parse(iso: any) {
    if (!iso || typeof iso !== "string") return null;
    var m = iso.split("-");
    if (m.length !== 3) return null;
    var d = new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  var start = parse(doelStartISO),
    today = parse(todayISO),
    dur = Number(doelDuurWeeks);
  if (!start || !today || !isFinite(dur) || dur <= 0) return null;
  var test = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + dur * 7,
  );
  var days = Math.round((test.getTime() - today.getTime()) / 86400000);
  return Math.max(0, Math.ceil(days / 7));
}

// ── Activiteiten-array recent-window helpers (newest-first; idx0=datum, idx3=duur-min, idx8=TSS).
// Anker = nieuwste rit-datum (deterministisch/testbaar); venster = [anker − days, anker].
export function actParseDate_(v: any): any {
  if (v instanceof Date) return stripTime_(v);
  if (v == null || v === "") return null;
  var d = new Date(v);
  return isNaN(d.getTime()) ? null : stripTime_(d);
}
export function actAnchorDate_(actValues: any): any {
  // Volgorde-onafhankelijk: de meest recente (hoogste) parseerbare idx0-datum, niet de
  // eerste array-positie. Onder een newest-first tab byte-identiek aan "eerste rij".
  var best: any = null;
  for (var i = 0; i < actValues.length; i++) {
    var d = actParseDate_(actValues[i][0]);
    if (d && (best === null || d.getTime() > best.getTime())) best = d;
  }
  return best;
}
// max moving-time (uren) over ritten in laatste `days`.
export function maxRecentRideH_(actValues: any, days: any): any {
  if (!actValues || !actValues.length) return null;
  var anchor = actAnchorDate_(actValues);
  if (!anchor) return null;
  var floor = anchor.getTime() - days * 86400000,
    maxMin = 0,
    seen = false;
  for (var i = 0; i < actValues.length; i++) {
    var d = actParseDate_(actValues[i][0]);
    if (!d || d.getTime() < floor) continue;
    var mins = Number(actValues[i][3]);
    if (isNaN(mins) || mins <= 0) continue;
    seen = true;
    if (mins > maxMin) maxMin = mins;
  }
  return seen ? Math.round((maxMin / 60) * 10) / 10 : null;
}
// Σtss / Σuren over laatste `days` (TSS-dichtheid).
export function tssPerHourRecent_(actValues: any, days: any): any {
  if (!actValues || !actValues.length) return null;
  var anchor = actAnchorDate_(actValues);
  if (!anchor) return null;
  var floor = anchor.getTime() - days * 86400000,
    sumTss = 0,
    sumH = 0;
  for (var i = 0; i < actValues.length; i++) {
    var d = actParseDate_(actValues[i][0]);
    if (!d || d.getTime() < floor) continue;
    var mins = Number(actValues[i][3]),
      tss = Number(actValues[i][8]);
    if (isNaN(mins) || mins <= 0) continue;
    sumH += mins / 60;
    if (!isNaN(tss) && tss > 0) sumTss += tss;
  }
  return sumH > 0 ? Math.round((sumTss / sumH) * 10) / 10 : null;
}
// gem. uren/week over laatste `days`.
export function weeklyHoursRecent_(actValues: any, days: any): any {
  if (!actValues || !actValues.length) return null;
  var anchor = actAnchorDate_(actValues);
  if (!anchor) return null;
  var floor = anchor.getTime() - days * 86400000,
    sumH = 0;
  for (var i = 0; i < actValues.length; i++) {
    var d = actParseDate_(actValues[i][0]);
    if (!d || d.getTime() < floor) continue;
    var mins = Number(actValues[i][3]);
    if (isNaN(mins) || mins <= 0) continue;
    sumH += mins / 60;
  }
  return Math.round((sumH / (days / 7)) * 10) / 10;
}

/**
 * W/kg-anker → niveau (0–50). Bewust stabiel: beweegt alleen op FTP/gewicht.
 * De taper-bewuste conditie-modifier komt pas in 2b. Pure helper.
 */
export function computeNiveau_(ftp: any, gewicht: any): any {
  if (!ftp || !gewicht) return { wkg: null, niveau: null };
  var wkg = ftp / gewicht;
  var WKG_LOW = 1.0,
    WKG_HIGH = 6.9,
    LVL_MAX = 50; // ankers: 1,0 W/kg=0 / 6,9 W/kg=50
  var niveau = ((wkg - WKG_LOW) / (WKG_HIGH - WKG_LOW)) * LVL_MAX;
  niveau = Math.max(0, Math.min(LVL_MAX, niveau));
  return { wkg: wkg, niveau: niveau };
}

/**
 * Fase 3 deel 4 — niveau-tier-label (PUUR; getest in runSelfTest). Niveau-gebaseerd
 * (NIET W/kg) zodat de chip nooit de balk (niveau/50) tegenspreekt.
 * 0–14 Beginner · 15–24 Gemiddeld · 25–34 Gevorderd · 35–44 Vergevorderd · 45–50 Elite.
 */
export function niveauTier_(niveau: any): any {
  if (niveau == null) return null;
  if (niveau < 15) return "Beginner";
  if (niveau < 25) return "Gemiddeld";
  if (niveau < 35) return "Gevorderd";
  if (niveau < 45) return "Vergevorderd";
  return "Elite";
}

/**
 * CTL-gedreven conditie-modifier op het W/kg-anker (2b-1). Band-capped op
 * ±BAND niveau-punten; dalen toegestaan (geen taper-freeze). ctlRef = CTL
 * aan het begin van het zichtbare venster. Geen data → 0.
 */
export function computeConditieMod_(ctlNow: any, ctlRef: any): any {
  if (ctlNow == null || ctlRef == null) return 0;
  var CTL_SPAN = 10,
    BAND = 2.0; // ±10 CTL-verandering = ±2,0 niveau-punten; tunable
  var raw = ((ctlNow - ctlRef) / CTL_SPAN) * BAND;
  return Math.max(-BAND, Math.min(BAND, raw));
}

/** Pure: minuten → "H:MM" (190 → "3:10", 0 → "0:00"). */
export function hhmmFromMin_(min: any): string {
  min = Math.max(0, Math.round(Number(min) || 0));
  var h = Math.floor(min / 60),
    m = min % 60;
  return h + ":" + (m < 10 ? "0" + m : "" + m);
}

/** Pure: weekplan-array → {tss, min, dagen}. Eén entry = één dag (multi-sessie
 *  al geaggregeerd); dagen = entries met minuten>0 (rustdag telt niet mee). */
export function weekPlanSummary_(arr: any): any {
  var tss = 0,
    min = 0,
    dagen = 0;
  if (Array.isArray(arr)) {
    arr.forEach((e: any) => {
      tss += Number(e.tss) || 0;
      var m = Number(e.minuten) || 0;
      min += m;
      if (m > 0) dagen++;
    });
  }
  return { tss: Math.round(tss), min: Math.round(min), dagen: dagen };
}

// ════════════════════════════════════════════════════════════════
// RIT-DETAIL (Fase 1ter) — pure afgeleide helpers (getest).
// ════════════════════════════════════════════════════════════════
export function rdPctFtp_(watts: any, ftp: any): any {
  // %FTP uit watt (fallback-bron)
  if (watts == null || !ftp || ftp <= 0) return null;
  return Math.round((Number(watts) / ftp) * 100);
}
export function rdPad2_(n: any): string {
  return (n < 10 ? "0" : "") + n;
}
export function rdDurMs_(secs: any): string {
  // "8:03" (m:ss); ≥1u → "1:08:03"
  secs = Math.max(0, Math.round(Number(secs) || 0));
  var h = Math.floor(secs / 3600),
    m = Math.floor((secs % 3600) / 60),
    s = secs % 60;
  return (h > 0 ? h + ":" + rdPad2_(m) : "" + m) + ":" + rdPad2_(s);
}
export function rdDurHms_(secs: any): string {
  // "0:58:32" (altijd h:mm:ss)
  secs = Math.max(0, Math.round(Number(secs) || 0));
  var h = Math.floor(secs / 3600),
    m = Math.floor((secs % 3600) / 60),
    s = secs % 60;
  return h + ":" + rdPad2_(m) + ":" + rdPad2_(s);
}
export function rdField_(o: any, keys: any): any {
  for (var i = 0; i < keys.length; i++) {
    var v = o ? o[keys[i]] : null;
    if (v != null) return v;
  }
  return null;
}
export function rdNum_(v: any): any {
  return v != null ? Math.round(Number(v)) : null;
}
export function rdFloat_(v: any): any {
  return v != null && v !== "" ? Number(v) : null;
}
export function rdWkg_(avgWatts: any, gewicht: any): any {
  // W/kg op 1 decimaal; null bij ontbrekend gewicht
  if (avgWatts == null || !gewicht || gewicht <= 0) return null;
  return Math.round((Number(avgWatts) / gewicht) * 10) / 10;
}
