import {
  ctlReeksMaandelijks_,
  dashNiveauReeks_,
  niveauProgressie_,
  setGewichtProvider,
} from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
import { TIERS, tierIndex } from "../components/niveau/tiers";
import type { ActValuesRow } from "./activities";
import { parseLocalDate } from "./dates";

// Gedeelde Niveau-afleidingen — ÉÉN bron (dezelfde engine-fns die Niveau.tsx gebruikt),
// zodat de Vorm-LevelCard identiek is aan de Niveau-tab. Pure tier-/delta-/week-math
// staat hier los (getest); `deriveNiveauSerie` is de engine-fn-keten (side-effect:
// setGewichtProvider, net als Niveau).

const MND = [
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
/** "yyyy-MM" → "mmm 'yy" (NL). */
export function maandLabel(ym: string): string {
  const p = ym.split("-");
  if (p.length < 2) return ym;
  const mi = Number(p[1]) - 1;
  return `${MND[mi] ?? ""} '${p[0]?.slice(2) ?? ""}`;
}

export type NiveauSeriePoint = {
  maand: string;
  niveau: number | null;
  wkg: number | null;
  ctl: number | null;
};

/**
 * Niveau-progressie-serie (maand) via DEZELFDE engine-fn-keten als `Niveau.tsx`
 * (`dashNiveauReeks_` → `ctlReeksMaandelijks_` → `niveauProgressie_`). Geen tweede
 * berekening: identieke pure fns + inputs → identieke serie.
 */
export function deriveNiveauSerie(
  settings: SettingsInput | null,
  rows: ActValuesRow[],
): { serie: NiveauSeriePoint[]; ctlByMonth: Record<string, number> } {
  setGewichtProvider(() => settings?.gewicht ?? 0);
  const niveauReeks = dashNiveauReeks_(settings, rows);
  const ctlByMonth = ctlReeksMaandelijks_(rows) as Record<string, number>;
  const serie = niveauProgressie_(
    niveauReeks,
    ctlByMonth,
  ) as NiveauSeriePoint[];
  return { serie, ctlByMonth };
}

export type TierProgress = {
  tierLabel: string;
  nextLabel: string | null;
  remaining: number | null;
  pct: number;
};

/** Huidige tier + voortgang naar de volgende (via de Niveau-`TIERS`/`tierIndex`). */
export function tierProgress(wkg: number | null): TierProgress | null {
  if (wkg == null) return null;
  const i = tierIndex(wkg);
  const cur = TIERS[i];
  if (!cur) return null;
  const prevMax = i > 0 ? (TIERS[i - 1]?.max ?? 0) : 0;
  const next = i < TIERS.length - 1 ? (TIERS[i + 1] ?? null) : null;
  const remaining = next ? Math.round((cur.max - wkg) * 100) / 100 : null;
  const pct =
    cur.max > prevMax
      ? Math.max(0, Math.min(1, (wkg - prevMax) / (cur.max - prevMax)))
      : 1;
  return {
    tierLabel: cur.label,
    nextLabel: next?.label ?? null,
    remaining,
    pct,
  };
}

/** W/kg-delta sinds de eerste serie-maand (matcht de Niveau-ProgressieCard "Alles"-delta). */
export function wkgSince(
  serie: NiveauSeriePoint[],
): { delta: number; sinceMonth: string } | null {
  const pts = serie.filter((p) => p.wkg != null);
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length < 2 || first?.wkg == null || last?.wkg == null) return null;
  return {
    delta: Math.round((last.wkg - first.wkg) * 100) / 100,
    sinceMonth: maandLabel(first.maand),
  };
}

/**
 * Week-TSS = Σ activities-TSS (idx8) in de KALENDERWEEK [maandag, maandag+7) —
 * repliceert GAS `actualTssByDate_` (Algorithm.gs:662, Monday-based, geen trailing-7).
 */
export function weekTss(
  rows: ActValuesRow[],
  mondayISO: string,
): number | null {
  const monday = parseLocalDate(mondayISO);
  const end = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 7,
  );
  let sum = 0;
  let seen = false;
  for (const r of rows) {
    const d = r[0];
    if (!(d instanceof Date)) continue;
    if (d.getTime() < monday.getTime() || d.getTime() >= end.getTime())
      continue;
    const tss = Number(r[8]);
    if (!Number.isNaN(tss) && tss > 0) {
      sum += tss;
      seen = true;
    }
  }
  return seen ? Math.round(sum) : null;
}

/**
 * Richting van de fitheid-projectie tussen nu en de testdag (voor de mensentaal-readout in
 * test-modus). PUUR. `null` als een van beide CTL-waarden ontbreekt. Drempel = 1 CTL: onder 1
 * verschil = "flat" (vasthouden), ≥ +1 = "up" (opbouw), ≤ −1 = "down" (zakken).
 */
export function projectionDirection(
  currentCtl: number | null,
  ctlAtTest: number | null,
): "up" | "flat" | "down" | null {
  if (currentCtl == null || ctlAtTest == null) return null;
  const delta = ctlAtTest - currentCtl;
  if (Math.abs(delta) < 1) return "flat";
  return delta >= 1 ? "up" : "down";
}
