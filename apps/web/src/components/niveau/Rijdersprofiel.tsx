import type { PowerCurveMarker, PowerCurveResponse } from "@cadans/shared";
import { nlDec1, nlInt } from "../../lib/format";
import { Card, Num, Overline } from "../ui";

// Rijdersprofiel [Fase 2] — natgetrokken uit design/src/niveau.jsx Rijdersprofiel.
// UI-only: data uit GET /api/power-curve (engine pcNormalize_, server-side). De
// SoonTag "Fase 2" is bewust WEGGELATEN — dit is nu een live sectie met echte data
// (geen speculatie, anders dan DoelProjectie's "Visie").

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
function monthLabel(iso: string | null): string {
  if (!iso) return "";
  const p = iso.slice(0, 10).split("-");
  if (p.length < 2) return "";
  const mi = Number(p[1]) - 1;
  return `${MND[mi] ?? ""} '${p[0]?.slice(2) ?? ""}`;
}

// Type-duiding-proza: de engine levert alleen { pos, label } (geen zin). Parity-mirror
// van de GAS `nvTypeDuiding_` (Script.html) — copy-parity-debt tot de engine 'm levert.
function typeDuiding(label: string): string {
  if (label === "Sprinter")
    return "Sterke korte pieken, bescheiden duurvermogen — explosief.";
  if (label === "Diesel · klimmer")
    return "Sterk duurvermogen, minder sprint — een diesel.";
  return "Gebalanceerd over alle duren — geen uitgesproken specialisme.";
}

const W = 320;
const H = 140;

function CurveChart({ markers }: { markers: PowerCurveMarker[] }) {
  const pts = [...markers].sort((a, b) => a.secs - b.secs);
  if (pts.length < 2) return null;
  const padT = 12;
  const padB = 26;
  const padL = 30;
  const padR = 10;
  const xs = pts.map((p) => Math.log(p.secs));
  const xlo = Math.min(...xs);
  const xhi = Math.max(...xs);
  const ws = pts.map((p) => p.watts);
  const wlo = Math.min(...ws) - 30;
  const whi = Math.max(...ws) + 40;
  const X = (s: number) =>
    padL + ((Math.log(s) - xlo) / (xhi - xlo || 1)) * (W - padL - padR);
  const Y = (v: number) =>
    padT + (1 - (v - wlo) / (whi - wlo || 1)) * (H - padT - padB);
  const line = pts
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${X(p.secs).toFixed(1)} ${Y(p.watts).toFixed(1)}`,
    )
    .join(" ");
  const firstS = pts[0]?.secs ?? 0;
  const lastS = pts[pts.length - 1]?.secs ?? 0;
  const area = `${line} L${X(lastS).toFixed(1)} ${(H - padB).toFixed(1)} L${X(firstS).toFixed(1)} ${(H - padB).toFixed(1)} Z`;
  // ~3 watt-gridlijnen op ronde-100 waarden binnen [wlo, whi].
  const grid: number[] = [];
  for (let v = Math.ceil(wlo / 100) * 100; v < whi; v += 100) grid.push(v);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nvCurve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={Y(v)}
            y2={Y(v)}
            stroke="var(--chart-grid)"
            strokeWidth="1"
          />
          <text
            x={4}
            y={Y(v) + 3}
            fill="var(--curve-axis)"
            fontSize="9.5"
            fontFamily="var(--font-num)"
          >
            {v}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#nvCurve)" />
      <path
        d={line}
        fill="none"
        stroke="var(--curve-line)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p) => (
        <g key={p.label}>
          {p.key && (
            <circle
              cx={X(p.secs)}
              cy={Y(p.watts)}
              r="8"
              fill="var(--accent-soft)"
            />
          )}
          <circle
            cx={X(p.secs)}
            cy={Y(p.watts)}
            r="4"
            fill={p.key ? "var(--curve-point-key)" : "var(--curve-point)"}
            stroke="var(--bg-surface)"
            strokeWidth="2"
          />
          <text
            x={X(p.secs)}
            y={H - 12}
            textAnchor="middle"
            fill="var(--curve-axis)"
            fontSize="10"
            fontFamily="var(--font-num)"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatBoxes({ markers }: { markers: PowerCurveMarker[] }) {
  const pts = [...markers].sort((a, b) => a.secs - b.secs);
  return (
    <div style={{ display: "flex", gap: "var(--s-1)", overflowX: "auto" }}>
      {pts.map((m) => (
        <div
          key={m.label}
          style={{
            flex: "1 0 auto",
            minWidth: 58,
            textAlign: "center",
            padding: "8px 4px",
            borderRadius: "var(--r-sm)",
            background: m.key ? "var(--accent-soft)" : "var(--bg-sunken)",
            border: `1px solid ${m.key ? "var(--tier-step-border-active)" : "var(--border-subtle)"}`,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              color: m.key ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              marginTop: 3,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Num size="var(--fs-num-sm)">{nlInt(m.watts)}</Num>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
              }}
            >
              W
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
            {m.wkg != null ? `${nlDec1(m.wkg)}` : "—"}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--text-muted)",
              }}
            >
              {" "}
              W/kg
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {monthLabel(m.date)}
          </div>
        </div>
      ))}
    </div>
  );
}

function WindowToggle({
  window,
  onWindow,
}: {
  window: "90d" | "1y";
  onWindow: (w: "90d" | "1y") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        background: "var(--bg-sunken)",
        borderRadius: "var(--r-pill)",
        padding: 3,
      }}
    >
      {(
        [
          ["90d", "90 dagen"],
          ["1y", "1 jaar"],
        ] as const
      ).map(([w, lbl]) => (
        <button
          key={w}
          type="button"
          onClick={() => onWindow(w)}
          aria-pressed={window === w}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--r-pill)",
            padding: "4px 10px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
            background: window === w ? "var(--bg-elevated)" : "transparent",
            color: window === w ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

export function Rijdersprofiel({
  data,
  window,
  onWindow,
  loading,
}: {
  data: PowerCurveResponse | null;
  window: "90d" | "1y";
  onWindow: (w: "90d" | "1y") => void;
  loading: boolean;
}) {
  const profile = data && !("empty" in data) ? data : null;
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Overline>Rijdersprofiel</Overline>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginTop: 3,
            }}
          >
            Beste inspanning per duur
          </div>
        </div>
        <WindowToggle window={window} onWindow={onWindow} />
      </div>

      {loading ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "var(--s-6) var(--s-2)",
          }}
        >
          Laden…
        </div>
      ) : profile && profile.markers.length > 0 ? (
        <>
          <div style={{ marginTop: "var(--s-3)" }}>
            <CurveChart markers={profile.markers} />
          </div>
          <div style={{ marginTop: "var(--s-3)" }}>
            <StatBoxes markers={profile.markers} />
          </div>

          {profile.riderType && (
            <div
              style={{
                marginTop: "var(--s-4)",
                paddingTop: "var(--s-3)",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                  marginBottom: "var(--s-2)",
                }}
              >
                <span>Sprinter</span>
                <span>All-rounder</span>
                <span>Diesel · klimmer</span>
              </div>
              <div
                style={{
                  position: "relative",
                  height: 6,
                  borderRadius: "var(--r-pill)",
                  background: "var(--curve-type-track)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    // engine-pos: 0=Diesel .. 1=Sprinter; staaf: Sprinter links → (1-pos).
                    left: `${(1 - profile.riderType.pos) * 100}%`,
                    transform: "translate(-50%,-50%)",
                    width: 13,
                    height: 13,
                    borderRadius: "var(--r-pill)",
                    background: "var(--curve-type-marker)",
                    border: "3px solid var(--bg-surface)",
                    boxShadow: "0 0 0 1px var(--accent)",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  color: "var(--text-secondary)",
                  marginTop: "var(--s-3)",
                  lineHeight: "var(--lh-body)",
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>
                  {profile.riderType.label}
                </strong>{" "}
                — {typeDuiding(profile.riderType.label)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "var(--s-6) var(--s-3) var(--s-4)",
            lineHeight: "var(--lh-body)",
          }}
        >
          De power-curve is nog niet gesynct — je rijdersprofiel verschijnt
          zodra je ritten met vermogen zijn opgehaald.
        </div>
      )}
    </Card>
  );
}
