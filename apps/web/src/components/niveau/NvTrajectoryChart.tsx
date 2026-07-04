import { useRef, useState } from "react";
import { Num } from "../ui";

export type MetricPoint = { maand: string; v: number };

// Trajectorie-grafiek — natgetrokken uit design/src/niveau.jsx NvTrajectoryChart.
// 1 serie lijn+area (actieve metric) + optionele CTL-dashed-overlay op een eigen
// (lagere) band + scrub-tooltip. Hand-rolled SVG (geen charting-lib), zelfde
// aanpak als ConditiePmc. viewBox-schaal → responsive; scrub mapt clientX via de
// gerenderde breedte naar de dichtstbijzijnde index.
export function NvTrajectoryChart({
  pts,
  ctlPts,
  fmt,
  metricLabel,
}: {
  pts: MetricPoint[];
  ctlPts: number[] | null;
  fmt: (v: number) => string;
  metricLabel: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const W = 320;
  const H = 168;
  const padT = 16;
  const padB = 24;
  const padL = 6;
  const padR = 8;
  const pw = W - padL - padR;
  const ph = H - padT - padB;
  const n = pts.length;

  const vals = pts.map((p) => p.v);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const padv = (hi - lo) * 0.18 || 1;
  lo -= padv;
  hi += padv;
  const span = hi - lo || 1;

  const x = (i: number) => padL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
  const y = (v: number) => padT + (1 - (v - lo) / span) * ph;
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${(padT + ph).toFixed(1)} L${x(0).toFixed(1)} ${(padT + ph).toFixed(1)} Z`;

  let ctlPath = "";
  if (ctlPts && ctlPts.length >= 2) {
    const cl = Math.min(...ctlPts);
    const ch = Math.max(...ctlPts);
    const cpad = (ch - cl) * 0.4 || 4;
    const clo = cl - cpad;
    const cspan = ch + cpad - clo || 1;
    const cn = ctlPts.length;
    const cx = (i: number) => padL + (cn === 1 ? pw / 2 : (i / (cn - 1)) * pw);
    // eigen genormaliseerde band (onderste ~60%) zodat CTL context is, geen concurrerende schaal
    const cy = (v: number) =>
      padT + ph * 0.35 + (1 - (v - clo) / cspan) * ph * 0.6;
    ctlPath = ctlPts
      .map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`)
      .join(" ");
  }

  const onMove = (clientX: number) => {
    const el = svgRef.current;
    if (!el || n < 2) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    setActive(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
  };

  const ap = active != null ? pts[active] : null;
  const apX = active != null ? (n === 1 ? 50 : (active / (n - 1)) * 100) : 0;

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        userSelect: "none",
        touchAction: "pan-y",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label={`${metricLabel} over tijd`}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setActive(null)}
        onTouchStart={(e) => onMove(e.touches[0]?.clientX ?? 0)}
        onTouchMove={(e) => onMove(e.touches[0]?.clientX ?? 0)}
        onTouchEnd={() => setActive(null)}
      >
        <defs>
          <linearGradient id="nvArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={padL}
          x2={W - padR}
          y1={y(lo + span * 0.5)}
          y2={y(lo + span * 0.5)}
          stroke="var(--chart-grid)"
          strokeWidth="1"
        />

        {ctlPath && (
          <path
            d={ctlPath}
            fill="none"
            stroke="var(--traj-ctl-line)"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            opacity="0.7"
            strokeLinejoin="round"
          />
        )}

        <path d={area} fill="url(#nvArea)" />
        <path
          d={line}
          fill="none"
          stroke="var(--traj-line)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {ap == null && n > 0 && (
          <circle
            cx={x(n - 1)}
            cy={y(pts[n - 1]?.v ?? 0)}
            r="4"
            fill="var(--accent)"
            stroke="var(--bg-surface)"
            strokeWidth="2.5"
          />
        )}
        {ap && active != null && (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={padT - 4}
              y2={padT + ph}
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
            <circle
              cx={x(active)}
              cy={y(ap.v)}
              r="5"
              fill="var(--traj-point)"
              stroke="var(--accent)"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>

      {ap && (
        <div
          style={{
            position: "absolute",
            top: -2,
            left: `${apX}%`,
            transform: `translateX(${apX > 70 ? "-100%" : apX < 30 ? "0" : "-50%"})`,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r-sm)",
            padding: "5px 8px",
            pointerEvents: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <Num size="18px" weight={600}>
            {fmt(ap.v)}
          </Num>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {metricLabel.toLowerCase()} · {ap.maand}
          </div>
        </div>
      )}
    </div>
  );
}
