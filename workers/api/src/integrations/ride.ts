/**
 * ride.ts — RITDETAIL on-demand (RITDETAILS fase 1). Haalt /activity/{id} + .../intervals +
 * .../streams uit intervals.icu (hergebruik BASE_URL + intervalsBasicAuth), en assembleert
 * ÉÉN self-contained model: de "gratis" D1-velden (door de route aangeleverd) + de gefetchte
 * metrics/breakdown + een gedownsamplede watts/HR-tijdreeks (de grafiek die GAS nooit bouwde —
 * RITDETAILS-RECON.md §1: de curve-stub). Geen cache (stateless), geen schema-touch, engine
 * onaangeroerd. Error-vertaling spiegelt push.ts' pushEvents_ (401/403/404/429/5xx → leesbaar).
 *
 * GEPROBEDE intervals-vormen (echt id, HTTP 200):
 *  - /activity/{id}        = plat object (total_elevation_gain, average_cadence, icu_joules in
 *                            Joule, icu_ftp, icu_weight, icu_weighted_avg_watts=NP, …).
 *  - /activity/{id}/intervals = object-wrapper met een icu_intervals-array (intensity=%FTP,
 *                            label vaak null → val terug op type, plus zone/duur/watts/HR).
 *  - /activity/{id}/streams   = ARRAY van {type,data}-entries, parallelle 1Hz-arrays met een
 *                            expliciete time-stream; gaten als null.
 */
import type { Activity } from "../db/schema";
import {
  BASE_URL,
  type FetchImpl,
  type IntervalsEnv,
  intervalsBasicAuth,
} from "./intervals";

const num_ = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** GET + Basic auth + GAS-parity error-vertaling (spiegelt push.ts pushEvents_). */
async function intervalsGet_(
  env: IntervalsEnv,
  path: string,
  fetchImpl?: FetchImpl,
): Promise<any> {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey) throw new Error("ride: env.INTERVALS_API_KEY ontbreekt.");
  const f = fetchImpl ?? fetch;
  const resp = await f(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: intervalsBasicAuth(apiKey),
      Accept: "application/json",
    },
  });
  const code = resp.status;
  if (code === 401)
    throw new Error(
      "intervals.icu API error 401 — API key fout of geen toegang.",
    );
  if (code === 403)
    throw new Error(
      "intervals.icu API error 403 — geen permissie voor deze resource.",
    );
  if (code === 404)
    throw new Error(
      `intervals.icu API error 404 — resource niet gevonden (${path}).`,
    );
  if (code === 429)
    throw new Error("intervals.icu rate limit (429) — probeer later opnieuw.");
  if (code >= 500)
    throw new Error(
      `intervals.icu server error ${code} — probeer later opnieuw.`,
    );
  if (code >= 400) throw new Error(`intervals.icu API error ${code}.`);
  return resp.json();
}

/** Pakt de data-array van één stream-type uit de {type,data}-array (leeg als afwezig). */
function streamData_(streams: unknown, type: string): (number | null)[] {
  if (!Array.isArray(streams)) return [];
  const s = streams.find((x) => x && x.type === type);
  return s && Array.isArray(s.data) ? s.data : [];
}

/** Gemiddelde over [from,to) van niet-null-waarden; volledig-null bucket → null (gat behouden). */
function meanOrNull_(
  arr: (number | null)[],
  from: number,
  to: number,
): number | null {
  let sum = 0;
  let cnt = 0;
  for (let i = from; i < to; i++) {
    const v = arr[i];
    if (v != null) {
      sum += v;
      cnt++;
    }
  }
  return cnt ? Math.round(sum / cnt) : null;
}

/** Downsample de parallel-arrays naar ~target punten (bucket-mean; nulls/gaten blijven null). */
function downsampleSeries_(
  time: (number | null)[],
  watts: (number | null)[],
  hr: (number | null)[],
  target = 400,
): RideStreams {
  const n = time.length;
  if (!n) return { t: [], watts: [], hr: [], n: 0 };
  if (n <= target) return { t: time.map((v) => v ?? 0), watts, hr, n };
  const bucket = Math.ceil(n / target);
  const t: number[] = [];
  const w: (number | null)[] = [];
  const h: (number | null)[] = [];
  for (let i = 0; i < n; i += bucket) {
    const end = Math.min(i + bucket, n);
    t.push(time[i] ?? 0);
    w.push(meanOrNull_(watts, i, end));
    h.push(meanOrNull_(hr, i, end));
  }
  return { t, watts: w, hr: h, n: t.length };
}

export interface RideInterval {
  label: string; // label ?? type ?? "Blok"
  zone: number | null;
  durationSec: number; // moving_time ?? elapsed_time
  avgHr: number | null;
  pctFtp: number | null; // intervals.intensity
  watts: number | null; // intervals.average_watts
}
export interface RideStreams {
  t: number[]; // seconden (gedeelde tijd-as)
  watts: (number | null)[]; // primair
  hr: (number | null)[]; // secundair
  n: number; // aantal punten (na downsample)
}
export interface RideDetailModel {
  id: string;
  datum: string;
  naam: string | null;
  type: string | null;
  afstandKm: number | null;
  duurMin: number | null;
  zoneTimesJson: string | null; // zonebalk-bron RAUW (client parset met zoneTimesFromCell_)
  np: number | null;
  ifPct: number | null;
  tss: number | null;
  gemW: number | null;
  wPerKg: number | null;
  gemHr: number | null;
  maxHr: number | null;
  hoogtewinstM: number | null;
  cadans: number | null;
  arbeidKj: number | null;
  ftp: number | null;
  gewicht: number | null;
  intervallen: RideInterval[];
  streams: RideStreams | null; // null = rit zonder streams (geen fout)
}

/** Assembleert het model: D1-"gratis" velden (voorrang) + gefetchte fallback/extra's + streams. */
function buildRideDetailModel_(
  id: string,
  row: Activity,
  detail: any,
  ivs: any,
  streamsRaw: unknown,
): RideDetailModel {
  const ftp = row.ftp ?? num_(detail?.icu_ftp);
  const gewicht = row.gewicht ?? num_(detail?.icu_weight);
  const gemW = row.gemW ?? num_(detail?.icu_average_watts);
  const wPerKg =
    gemW != null && gewicht ? Math.round((gemW / gewicht) * 100) / 100 : null;

  const rawIvs =
    ivs && Array.isArray(ivs.icu_intervals) ? ivs.icu_intervals : [];
  const intervallen: RideInterval[] = rawIvs.map((iv: any) => ({
    label: iv.label ?? iv.type ?? "Blok",
    zone: num_(iv.zone),
    durationSec: num_(iv.moving_time) ?? num_(iv.elapsed_time) ?? 0,
    avgHr: num_(iv.average_heartrate),
    pctFtp: num_(iv.intensity),
    watts: num_(iv.average_watts),
  }));

  const time = streamData_(streamsRaw, "time");
  const watts = streamData_(streamsRaw, "watts");
  const hr = streamData_(streamsRaw, "heartrate");
  const streams =
    time.length && (watts.length || hr.length)
      ? downsampleSeries_(time, watts, hr, 400)
      : null;

  const joules = num_(detail?.icu_joules);
  const distance = num_(detail?.distance);
  const movingTime = num_(detail?.moving_time);
  const cadans = num_(detail?.average_cadence);
  return {
    id,
    datum: row.datum ?? detail?.start_date_local ?? "",
    naam: row.naam ?? detail?.name ?? null,
    type: row.type ?? detail?.type ?? null,
    afstandKm: row.afstandKm ?? (distance != null ? distance / 1000 : null),
    duurMin:
      row.duurMin ?? (movingTime != null ? Math.round(movingTime / 60) : null),
    zoneTimesJson: row.zoneTimesJson ?? null,
    np: row.normW ?? num_(detail?.icu_weighted_avg_watts),
    ifPct: row.ifPct ?? num_(detail?.icu_intensity),
    tss: row.tss ?? num_(detail?.icu_training_load),
    gemW,
    wPerKg,
    gemHr: row.gemHr ?? num_(detail?.average_heartrate),
    maxHr: row.maxHr ?? num_(detail?.max_heartrate),
    hoogtewinstM: num_(detail?.total_elevation_gain),
    cadans: cadans != null ? Math.round(cadans) : null,
    arbeidKj: joules != null ? Math.round(joules / 1000) : null,
    ftp,
    gewicht,
    intervallen,
    streams,
  };
}

/**
 * Orchestreert de ritdetail-fetch. /activity + /activity/{id}/intervals = CORE → hun fouten
 * bubbelen door (route → 502). /activity/{id}/streams tolereert falen → streams:null (rit
 * zonder streams = geen fout; spiegelt dat GAS streams nooit ophaalde). De D1-rij komt van de
 * route (die 404't als de rit onbekend is).
 */
export async function fetchRideDetail(
  env: IntervalsEnv,
  id: string,
  row: Activity,
  opts: { fetchImpl?: FetchImpl } = {},
): Promise<RideDetailModel> {
  const enc = encodeURIComponent(id);
  const detail = await intervalsGet_(env, `/activity/${enc}`, opts.fetchImpl);
  const ivs = await intervalsGet_(
    env,
    `/activity/${enc}/intervals`,
    opts.fetchImpl,
  );
  let streamsRaw: unknown = null;
  try {
    streamsRaw = await intervalsGet_(
      env,
      `/activity/${enc}/streams`,
      opts.fetchImpl,
    );
  } catch {
    streamsRaw = null; // geen streams → lege grafiek, geen 502
  }
  return buildRideDetailModel_(id, row, detail, ivs, streamsRaw);
}
