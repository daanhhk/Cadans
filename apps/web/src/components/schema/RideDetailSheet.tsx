import { zoneTimesFromCell_ } from "@cadans/engine";
import type { RideDetailModel, RideInterval } from "@cadans/shared";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import { parseLocalDate } from "../../lib/dates";
import {
  intervalZoneName,
  rideBadgeFromIf,
  secToClock,
} from "../../lib/rideDetail";
import {
  actualZone5_,
  doneZoneBlokken,
  formatDuurU,
  formatIf,
} from "../../lib/schema";
import { RideChart } from "./RideChart";
import { ZoneBars } from "./ZoneBars";
import { ZonePill } from "./ZonePill";

// RITDETAILS fase 2 — de ritdetail-popup (GAS rideSheetHtml_). Chrome gespiegeld op
// WorkoutPickerSheet/CheckinSheet (fixed inset-0, scrim, paneel + handle + safe-area, ×-sluit,
// scrollend paneel). Haalt het model on-demand op (GET /api/ride/:id) en rendert 1:1 op GAS:
// kop (klasse-badge + datum) · headline · zonebalk · hero (NP/IF/TSS) · metrics-grid · intervallen
// · grafiek. Kleine bewuste parity-afwijking: het model draagt geen starttijd → alleen de datum.

const DASH = "–";

type Fase =
  | { s: "loading" }
  | { s: "ready"; model: RideDetailModel }
  | { s: "error"; msg: string };

function dateNl(datum: string): string {
  const iso = (datum || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return datum || "";
  try {
    return new Intl.DateTimeFormat("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parseLocalDate(iso));
  } catch {
    return iso;
  }
}

const nl1 = (v: number): string => v.toFixed(1).replace(".", ",");

/** Stabiele, unieke keys voor de interval-rijen zonder de array-index: het lopende
 * tijd-offset maakt ook identieke opeenvolgende blokken uniek. */
function intervalKeys(
  ivs: RideInterval[],
): { iv: RideInterval; key: string }[] {
  let offset = 0;
  return ivs.map((iv) => {
    const key = `${offset}-${iv.label}-${iv.pctFtp}`;
    offset += iv.durationSec;
    return { iv, key };
  });
}

export function RideDetailSheet({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [fase, setFase] = useState<Fase>({ s: "loading" });

  useEffect(() => {
    let alive = true;
    setFase({ s: "loading" });
    apiGet<RideDetailModel>(`/api/ride/${encodeURIComponent(id)}`)
      .then((model) => {
        if (alive) setFase({ s: "ready", model });
      })
      .catch(() => {
        if (alive)
          setFase({
            s: "error",
            msg: "Ritdetails konden niet geladen worden.",
          });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--sheet-bg)",
          borderTopLeftRadius: "var(--sheet-radius)",
          borderTopRightRadius: "var(--sheet-radius)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "var(--sheet-shadow)",
          padding: "10px 18px calc(env(safe-area-inset-bottom, 0px) + 26px)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: "var(--r-pill)",
            background: "var(--sheet-handle)",
            margin: "0 auto 12px",
          }}
        />
        <button
          type="button"
          aria-label="Sluiten"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "var(--r-pill)",
            border: "none",
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            fontSize: 16,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        {fase.s === "loading" && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
              padding: "var(--s-5) 0",
              textAlign: "center",
            }}
          >
            Ritdetails laden…
          </div>
        )}

        {fase.s === "error" && (
          <div
            style={{
              marginTop: 8,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              borderRadius: "var(--r-md)",
              padding: "var(--s-2) var(--s-3)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
            }}
          >
            {fase.msg}
          </div>
        )}

        {fase.s === "ready" && <RideBody model={fase.model} />}
      </div>
    </div>
  );
}

function RideBody({ model }: { model: RideDetailModel }) {
  const badge = rideBadgeFromIf(model.ifPct);
  const zoneBlokken = doneZoneBlokken(
    actualZone5_(zoneTimesFromCell_(model.zoneTimesJson)),
  );
  const headline =
    model.afstandKm != null
      ? `${nl1(model.afstandKm)} km | ${formatDuurU(model.duurMin ?? 0)}`
      : formatDuurU(model.duurMin ?? 0);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}
    >
      {/* KOP */}
      <div>
        <div style={{ marginBottom: "var(--s-2)" }}>
          <ZonePill zone={badge.zoneNum} name={badge.label} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h3)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {model.naam || "Gereden rit"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
            marginTop: 2,
          }}
        >
          {dateNl(model.datum)}
        </div>
        {/* HEADLINE */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h3)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginTop: "var(--s-2)",
          }}
        >
          {headline}
        </div>
      </div>

      {/* ZONEBALK */}
      {zoneBlokken.length > 0 && <ZoneBars blokken={zoneBlokken} />}

      {/* HERO: NP · IF · TSS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "var(--s-2)",
        }}
      >
        <HeroCell
          label="NP"
          value={model.np != null ? `${model.np}` : DASH}
          unit="W"
        />
        <HeroCell
          label="IF"
          value={model.ifPct != null ? formatIf(model.ifPct / 100) : DASH}
        />
        <HeroCell
          label="TSS"
          value={model.tss != null ? `${model.tss}` : DASH}
          accent
        />
      </div>

      {/* METRICS-GRID (6 tegels) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "var(--s-2)",
        }}
      >
        <Metric label="Gem. vermogen" value={model.gemW} unit="W" />
        <Metric
          label="W/kg"
          value={model.wPerKg != null ? nl1(model.wPerKg) : null}
          unit="W/kg"
        />
        <Metric
          label="Gem. HR"
          value={model.gemHr}
          unit="bpm"
          sub={model.maxHr != null ? `max ${model.maxHr}` : undefined}
        />
        <Metric label="Hoogtewinst" value={model.hoogtewinstM} unit="m" />
        <Metric label="Cadans" value={model.cadans} unit="rpm" />
        <Metric label="Arbeid" value={model.arbeidKj} unit="kJ" />
      </div>

      {/* INTERVALLEN */}
      {model.intervallen.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "var(--s-2)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Intervallen
            </div>
            {model.ftp != null && (
              <div
                style={{
                  fontFamily: "var(--font-num)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                }}
              >
                FTP {model.ftp} W
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-1)",
            }}
          >
            {intervalKeys(model.intervallen).map(({ iv, key }) => (
              <IntervalRow key={key} iv={iv} />
            ))}
          </div>
        </div>
      )}

      {/* GRAFIEK */}
      <RideChart streams={model.streams} />
    </div>
  );
}

function HeroCell({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-sunken)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-md)",
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          color: accent ? "var(--accent)" : "var(--text-primary)",
          marginTop: 2,
        }}
      >
        {value}
        {unit && value !== DASH && (
          <span
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginLeft: 3,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number | string | null;
  unit: string;
  sub?: string;
}) {
  const shown = value == null || value === "" ? DASH : `${value}`;
  return (
    <div
      style={{
        background: "var(--bg-sunken)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-md)",
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: 2,
        }}
      >
        {shown}
        {shown !== DASH && (
          <span
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginLeft: 3,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
            marginTop: 1,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function IntervalRow({ iv }: { iv: RideInterval }) {
  const zn = iv.zone == null ? null : Math.min(6, Math.max(1, iv.zone));
  const zoneColor = zn != null ? `var(--zone-${zn})` : "var(--border-strong)";
  const metaParts: { text: string; color?: string }[] = [
    { text: secToClock(iv.durationSec, false) },
  ];
  if (iv.avgHr != null) metaParts.push({ text: `${iv.avgHr} bpm` });
  if (iv.pctFtp != null)
    metaParts.push({ text: `${iv.pctFtp}% FTP`, color: zoneColor });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--s-2)",
        borderLeft: `3px solid ${zoneColor}`,
        borderRadius: "var(--r-xs)",
        background: "var(--bg-sunken)",
        padding: "6px 10px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {zn != null && (
            <span
              style={{
                fontFamily: "var(--font-num)",
                fontSize: "var(--fs-caption)",
                fontWeight: 700,
                color: zoneColor,
              }}
            >
              Z{iv.zone}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {intervalZoneName(iv.zone)}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-secondary)",
            marginTop: 1,
          }}
        >
          {metaParts.map((p, i) => (
            <span key={p.text} style={{ color: p.color }}>
              {i > 0 ? " · " : ""}
              {p.text}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-label)",
          fontWeight: 700,
          color: "var(--text-primary)",
          flexShrink: 0,
        }}
      >
        {iv.watts != null ? `${iv.watts} W` : DASH}
      </div>
    </div>
  );
}
