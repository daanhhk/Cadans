import { CYCLING_TYPES } from "@cadans/engine";
import type { ActivitiesResponse } from "@cadans/shared";
import { parseLocalDate } from "./dates";
import { rideBadgeFromIf } from "./rideDetail";
import { formatDuurU } from "./schema";

// RITDETAILS fase 3 — PURE, DOM-loze bouwer voor het Activiteiten-tabblad: de 17-koloms
// activities-matrix (GET /api/activities, oudste eerst) → nieuwste-eerst gesorteerde
// rij-view-modellen. Toont ALLE gesyncte activiteiten (ook niet-fiets, Daan-besluit).
// idx0 datum · idx1 type · idx2 naam · idx3 duurMin · idx4 afstandKm · idx7 ifPct · idx8 tss ·
// idx16 activity_id_ext.

export interface ActivityListRow {
  idExt: string; // lege string = geen intervals-id = rij niet tikbaar
  datumIso: string; // yyyy-MM-dd
  maand: string; // groepskop (nl-NL month long + year)
  dagLabel: string; // nl-NL weekday short, day, month short
  naam: string; // idx2 getrimd, leeg → "Rit"
  typeLabel: string | null; // null = fiets (CYCLING_TYPES); anders NL-label
  headline: string; // "62,4 km | 2u10" of alleen "2u10"
  tss: number | null;
  badgeZone: number;
  badgeLabel: string;
}

// Niet-fiets type → NL-label; onbekend → rauwe type; leeg → "Overig".
const TYPE_LABEL: Record<string, string> = {
  Run: "Hardlopen",
  Walk: "Wandelen",
  Swim: "Zwemmen",
  WeightTraining: "Kracht",
  Workout: "Training",
};

const maandFmt = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});
const dagFmt = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function typeLabel_(rawType: string): string | null {
  if (CYCLING_TYPES.indexOf(rawType) >= 0) return null;
  if (rawType === "") return "Overig";
  return TYPE_LABEL[rawType] ?? rawType;
}

function headline_(duurMin: number, afstandRaw: number): string {
  const duur = formatDuurU(duurMin);
  if (Number.isFinite(afstandRaw) && afstandRaw > 0) {
    const km = afstandRaw.toFixed(1).replace(".", ",");
    return `${km} km | ${duur}`;
  }
  return duur;
}

interface Sortable extends ActivityListRow {
  _src: number;
  _raw: string;
}

export function buildActivityList(
  payload: ActivitiesResponse,
): ActivityListRow[] {
  const rows: Sortable[] = [];
  payload.forEach((r, i) => {
    const d0 = r[0];
    if (typeof d0 !== "string") return;
    const datumIso = d0.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datumIso)) return;

    const d = parseLocalDate(datumIso);
    const naam = String(r[2] ?? "").trim() || "Rit";
    const rawIf = Number(r[7]);
    const badge = rideBadgeFromIf(Number.isFinite(rawIf) ? rawIf : null);
    const rawTss = Number(r[8]);
    rows.push({
      idExt: String(r[16] ?? ""),
      datumIso,
      maand: maandFmt.format(d),
      dagLabel: dagFmt.format(d),
      naam,
      typeLabel: typeLabel_(String(r[1] ?? "")),
      headline: headline_(Number(r[3]) || 0, Number(r[4])),
      tss: Number.isFinite(rawTss) ? Math.round(rawTss) : null,
      badgeZone: badge.zoneNum,
      badgeLabel: badge.label,
      _src: i,
      _raw: d0,
    });
  });

  // Nieuwste eerst op de VOLLEDIGE idx0-string (ISO sorteert lexicaal); tie → hoogste bron-index
  // eerst. Expliciet, niet leunend op de wire-volgorde.
  rows.sort((a, b) =>
    a._raw !== b._raw ? (a._raw < b._raw ? 1 : -1) : b._src - a._src,
  );

  return rows.map(({ _src, _raw, ...row }) => row);
}
