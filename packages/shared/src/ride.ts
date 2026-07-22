/**
 * ride — HTTP-contract voor de ritdetail-endpoint GET /api/ride/:id (RITDETAILS fase 1/2).
 * De worker (workers/api/src/integrations/ride.ts) assembleert dit model; de client
 * (apps/web) rendert het in de ritdetail-popup. PUUR types (geen runtime).
 *
 * Velden 1-op-1 overgenomen uit de oorspronkelijke worker-definitie: D1-"gratis" velden
 * (kop/zonebalk/hero/metrics) + gefetchte metrics/breakdown + een gedownsamplede watts/HR-
 * tijdreeks (`streams`, null = rit zonder tijdreeks).
 */

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
