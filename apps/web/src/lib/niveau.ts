import {
  computeNiveau_,
  ctlReeksMaandelijks_,
  dashNiveauReeks_,
  eftpFromActivities_,
  goalGap_,
  maxRecentRideH_,
  niveauProgressie_,
  setGewichtProvider,
} from "@cadans/engine";
import type { SettingsInput } from "@cadans/shared";
// type-only: anders ontstaat er bij build een runtime-ring lib -> component -> lib.
import type { GapDim } from "../components/niveau/DoelProjectie";
import { TIERS, tierIndex } from "../components/niveau/tiers";
import type { ActValuesRow } from "./activities";
import { blokDosisNorm } from "./blok";
import { parseLocalDate } from "./dates";
import { instapNiveau } from "./effect";

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

// ── ROADMAP punt 8 — de doel-meetlat, client-zijde ────────────────────────
// De engine draagt de VIJF LATTEN (`GOAL_PROFILES_`); wat hier staat is het stuk dat de engine
// niet kan weten: de afgeleide behoud-vloer, en het samenstellen van de meetgrootheden.

/**
 * De behoud-vloer voor doel Onderhoud: 95 procent van de instapwaarde.
 *
 * HERKOMST: BELEID (Daan-besluit) PLUS een INSTRUMENT-grens — GEEN geijkte drempel, en er hoort
 * er ook geen op een reeks gezocht te worden. Fysiologisch is behoud bij minder uren met de
 * kwaliteitsdagen intact gewoon haalbaar, dus dit is geen VERWACHTING maar de resolutie van de
 * meter: `rolling_ftp` beweegt over een jaar meerdere watts zonder trainingsreden, dus strakker
 * dan circa 3 procent bemonstert ruis. Bovengrens-gecheckt op de echte reeks: over elk venster van
 * twaalf weken is de diepste dip 95,7 procent, dus deze vloer vuurt daar geen enkele keer — precies
 * de bedoeling, want behoud hoort de normale uitkomst te zijn.
 */
export const ONDERHOUD_VLOER_PCT = 0.95;

/**
 * De vloer in WATT, of null als er niets te vergelijken valt. ONAFGEROND terug — afronden is
 * presentatie, en een vloer die halverwege wordt afgerond verschuift de uitspraak.
 *
 * De ankerdatum is `settings.doelStart` (UI-label "Blok-start"): het enige bestaande veld dat een
 * periodestart draagt. Wisselt het doel naar Onderhoud, dan hoort die datum mee te verzetten,
 * anders meet de vloer tegen de instapwaarde van een vórige periode.
 */
export function onderhoudVloerW(
  activities: ActValuesRow[],
  doelStartISO: string | null | undefined,
): number | null {
  const start = (doelStartISO ?? "").trim();
  if (!start) return null;
  const instap = instapNiveau(activities, start);
  if (instap == null) return null;
  return instap * ONDERHOUD_VLOER_PCT;
}

/**
 * De vier meetgrootheden achter de gap-rijen, met exact de engine-functies die de Niveau-tab al
 * gebruikte. `rollingFtpW` is NIEUW en dragend: de behoud-vloer komt uit `instapNiveau()` en dat is
 * `rolling_ftp` uit de RITTEN, terwijl `ftpWkg` op de HANDMATIG ingestelde `settings.ftp` staat.
 * Die twee tegen elkaar zetten zou een vloer opleveren die de hele periode groen staat op een met
 * de hand ingevuld getal, ongeacht wat er getraind is — het mechanisme werkt dan wel, de invoer
 * niet. Aan beide kanten dezelfde grootheid, en in WATT: DOELEN-SPEC §3.2 KETEN spreekt van de FTP
 * waarmee de periode begon, en met W/kg zou gewicht een tweede bewegend deel worden in een
 * behoud-vraag — een paar kilo eraf maskeert dan een FTP-daling.
 */
export function buildGoalInputs(
  settings: SettingsInput | null | undefined,
  rows: ActValuesRow[],
): Record<string, number | null> {
  const snap = computeNiveau_(
    settings?.ftp ?? null,
    settings?.gewicht ?? null,
  ) as { wkg: number | null };
  const ctlMap = (ctlReeksMaandelijks_(rows) ?? {}) as Record<string, number>;
  const lastMonth = Object.keys(ctlMap).sort().at(-1);
  return {
    ftpWkg: snap.wkg,
    ctl: lastMonth ? (ctlMap[lastMonth] ?? null) : null,
    longRideH: maxRecentRideH_(rows, 90) as number | null,
    rollingFtpW: eftpFromActivities_(rows) as number | null,
  };
}

/**
 * Latten → gap-rijen. De EFFECTIEVE target gaat mee terug: bij `targetBron: "instapVloer"` is dat
 * de afgeleide vloer, anders de constante uit de lat. Zo leest de kaart nooit een target die
 * afwijkt van waartegen `goalGap_` heeft gerekend.
 */
export function buildGoalDims(
  prof: { dims: Omit<GapDim, "current" | "gap" | "onTrack" | "pct">[] },
  inputs: Record<string, number | null>,
  vloerW: number | null,
): GapDim[] {
  return prof.dims.map((d) => {
    const target = d.targetBron === "instapVloer" ? vloerW : d.target;
    const current = inputs[d.metric] ?? null;
    const g = goalGap_(current, target, d.dir) as {
      gap: number | null;
      onTrack: boolean;
      pct: number | null;
    };
    return {
      ...d,
      target,
      current,
      gap: g.gap,
      onTrack: g.onTrack,
      pct: g.pct,
    };
  });
}

/**
 * NIVEAUKAART-RONDE — DE SLEUTELSESSIE-AANNAME onder de FTP-projectie.
 *
 * `ftpBandFromProjection_` droeg "2 sleutelsessies per week, consequent" als LITERAL in een doel-
 * én fase-onafhankelijke array, terwijl het getal dat de app zelf hanteert `prikkels` uit
 * `blokDosisNorm` is — en dat hangt aan doel, fase ÉN weekuren. GEMETEN over 5 doelen x 4 fases x
 * 4..14 uur: FTP en Korte beklimmingen geven 3 in Base, Build én Peak vanaf 5 uur en 2 bij 4 uur;
 * Conditie en Lange beklimmingen 2 in Base en Peak en 3 in Build vanaf 5 uur; Onderhoud altijd 3.
 * De literal klopt dus alleen bij 4 uur, of bij Conditie en Lange beklimmingen buiten Build.
 *
 * WAAROM DE DRIE FASES WORDEN LANGSGELOPEN in plaats van er één te pinnen: de Niveau-tab laadt
 * alleen `getSettings` en `getActivities` — geen events, geen `overnameBevestigd` — dus
 * `effectiveMacroFase_` is daar per constructie niet te berekenen. Een fase die daar tóch gepind
 * wordt is een TWEEDE fase-bron die van het Schema-scherm kan afwijken zodra de event-overname
 * vuurt. Enumereren sluit dat uit, en het past op de horizon van de kaart: de projectie loopt tot
 * de testdag en beslaat dus meerdere fases. Zie docs/NIVEAUKAART-BOUWDOC.md §2.4.
 *
 * GEEN ENKELVOUDS-TAK: `prikkels` is `min(quotum, urenPrikkels)` met beide termen minstens 2, dus
 * 1 is per constructie onbereikbaar en een "1 sleutelsessie"-tak zou dode code zijn.
 *
 * `null` zodra een van de drie aanroepen `null` geeft — dan blijft de engine-literal staan.
 */
export function sleutelAannameRegel(
  doel: string | null,
  weekUren: number | null,
): string | null {
  const prikkels: number[] = [];
  for (const fase of ["Base", "Build", "Peak"]) {
    const n = blokDosisNorm(doel, weekUren, 0, undefined, fase);
    if (!n) return null;
    prikkels.push(n.prikkels);
  }
  const min = Math.min(...prikkels);
  const max = Math.max(...prikkels);
  const aantal = min === max ? String(min) : `${min} à ${max}`;
  return `${aantal} sleutelsessies per week, consequent`;
}
