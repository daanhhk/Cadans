import type { RideStreams } from "@cadans/shared";
import { useRef, useState } from "react";
import {
  nearestSampleIndex,
  type RideChartOpts,
  rideChartGeometry,
  secToClock,
} from "../../lib/rideDetail";

// RITDETAILS fase 2 — hand-SVG vermogens/HR-curve (GEEN charting-lib; de grafiek die GAS nooit
// bouwde, Script.html:702-stub). Watts als lijn + zacht gevuld vlak op de linker-as (var(--accent)),
// HR als dunne secundaire lijn op de rechter-as (var(--text-secondary)), leesbare as-schalen +
// gridlijnen + tijd-ticks, en een sleep/hover-readout (cursor + waarde op het aangeraakte tijdstip).
// Geometrie komt puur uit rideChartGeometry (testbaar, DOM-loos).

const OPTS: RideChartOpts = {
  width: 320,
  height: 150,
  padTop: 12,
  padBottom: 22,
  padLeft: 34,
  padRight: 34,
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Sluit een watts-polyline naar een gevuld vlak: zak op begin/eind naar de baseline. */
function areaPoints(seg: string, baselineY: number): string {
  const pts = seg.split(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return seg;
  const x0 = first.split(",")[0];
  const x1 = last.split(",")[0];
  return `${x0},${baselineY} ${seg} ${x1},${baselineY}`;
}

function EmptyChart() {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-label)",
        color: "var(--text-muted)",
        padding: "var(--s-3) 0",
      }}
    >
      Geen tijdreeks voor deze rit
    </div>
  );
}

export function RideChart({ streams }: { streams: RideStreams | null }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState<number | null>(null);

  if (!streams) return <EmptyChart />;

  const g = rideChartGeometry(streams, OPTS);
  const baselineY = OPTS.height - OPTS.padBottom;
  const topY = g.plotTop;
  const midY = g.plotTop + g.plotHeight / 2;
  const hasWatts = g.wattsSegments.length > 0;
  const hasHr = g.hrSegments.length > 0;

  if (!hasWatts && !hasHr) return <EmptyChart />;

  const hourMode = g.span >= 3600;
  const yWatts = (v: number): number =>
    g.plotTop + g.plotHeight - (v / g.maxWatts) * g.plotHeight;
  const yHr = (v: number): number =>
    g.plotTop +
    g.plotHeight -
    ((v - g.minHr) / (g.maxHr - g.minHr)) * g.plotHeight;

  // Actieve sample (sleep/hover-readout).
  const at = active != null && active >= 0 ? active : null;
  const aT = at != null ? (streams.t[at] ?? g.t0) : null;
  const aWatts = at != null ? (streams.watts[at] ?? null) : null;
  const aHr = at != null ? (streams.hr[at] ?? null) : null;
  const cursorX =
    aT != null && g.span > 0
      ? g.plotLeft + ((aT - g.t0) / g.span) * g.plotWidth
      : g.plotLeft;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || g.plotWidth <= 0) return;
    const rect = svg.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * OPTS.width;
    const frac = clamp01((vbX - g.plotLeft) / g.plotWidth);
    const targetT = g.t0 + frac * g.span;
    setActive(nearestSampleIndex(streams.t, targetT));
  }
  const clear = () => setActive(null);

  return (
    <div>
      {/* readout-regel met VASTE hoogte (geen layout-shift) */}
      <div
        style={{
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-caption)",
          lineHeight: 1.5,
          minHeight: "1.5em",
          textAlign: "center",
          marginBottom: 2,
        }}
      >
        {at != null ? (
          <>
            <span style={{ color: "var(--text-muted)" }}>
              {secToClock((aT ?? g.t0) - g.t0, hourMode)}
            </span>
            <span style={{ color: "var(--text-muted)" }}> · </span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>
              {aWatts ?? "–"} W
            </span>
            <span style={{ color: "var(--text-muted)" }}> · </span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
              {aHr ?? "–"} bpm
            </span>
          </>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>Sleep voor waarden</span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${OPTS.width} ${OPTS.height}`}
        width="100%"
        role="img"
        aria-label="Vermogen en hartslag over tijd"
        style={{ display: "block", maxWidth: "100%", touchAction: "none" }}
        onPointerMove={onMove}
        onPointerLeave={clear}
        onPointerUp={clear}
        onPointerCancel={clear}
      >
        {/* gridlijnen (top + mid) + baseline */}
        <line
          x1={OPTS.padLeft}
          y1={topY}
          x2={OPTS.width - OPTS.padRight}
          y2={topY}
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
        <line
          x1={OPTS.padLeft}
          y1={midY}
          x2={OPTS.width - OPTS.padRight}
          y2={midY}
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
        <line
          x1={OPTS.padLeft}
          y1={baselineY}
          x2={OPTS.width - OPTS.padRight}
          y2={baselineY}
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
        {/* x-ticks */}
        {g.xTicks.map((tick) => (
          <text
            key={`t${tick.x}`}
            x={tick.x}
            y={OPTS.height - 6}
            textAnchor="middle"
            fontSize={8}
            fill="var(--text-muted)"
            fontFamily="var(--font-num)"
          >
            {tick.label}
          </text>
        ))}
        {/* linker-as schaal-labels (watts) */}
        {hasWatts &&
          [
            { y: topY, v: g.maxWatts },
            { y: midY, v: Math.round(g.maxWatts / 2) },
            { y: baselineY, v: 0 },
          ].map((lab) => (
            <text
              key={`wax${lab.y}`}
              x={OPTS.padLeft - 4}
              y={lab.y + 3}
              textAnchor="end"
              fontSize={8}
              fill="var(--accent)"
              fontFamily="var(--font-num)"
            >
              {lab.v}
            </text>
          ))}
        {/* rechter-as schaal-labels (HR) */}
        {hasHr &&
          [
            { y: topY, v: g.maxHr },
            { y: midY, v: Math.round((g.minHr + g.maxHr) / 2) },
            { y: baselineY, v: g.minHr },
          ].map((lab) => (
            <text
              key={`hax${lab.y}`}
              x={OPTS.width - OPTS.padRight + 4}
              y={lab.y + 3}
              textAnchor="start"
              fontSize={8}
              fill="var(--text-secondary)"
              fontFamily="var(--font-num)"
            >
              {lab.v}
            </text>
          ))}
        {/* watts vlak + lijn (linker-as) */}
        {hasWatts &&
          g.wattsSegments.map((seg) => (
            <polygon
              key={`wa-${seg}`}
              points={areaPoints(seg, baselineY)}
              fill="color-mix(in srgb, var(--accent) 14%, transparent)"
              stroke="none"
            />
          ))}
        {hasWatts &&
          g.wattsSegments.map((seg) => (
            <polyline
              key={`wl-${seg}`}
              points={seg}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        {/* HR lijn (rechter-as) */}
        {hasHr &&
          g.hrSegments.map((seg) => (
            <polyline
              key={`hr-${seg}`}
              points={seg}
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth={1}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
        {/* sleep/hover cursor + dots */}
        {at != null && (
          <line
            x1={cursorX}
            y1={topY}
            x2={cursorX}
            y2={baselineY}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
        )}
        {at != null && hasWatts && aWatts != null && (
          <circle
            cx={cursorX}
            cy={yWatts(aWatts)}
            r={2.5}
            fill="var(--accent)"
          />
        )}
        {at != null && hasHr && aHr != null && (
          <circle
            cx={cursorX}
            cy={yHr(aHr)}
            r={2.5}
            fill="var(--text-secondary)"
          />
        )}
      </svg>
      {/* mini-legenda (eenheden hier) */}
      <div
        style={{
          display: "flex",
          gap: "var(--s-3)",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {hasWatts && <LegendItem color="var(--accent)" label="Vermogen (W)" />}
        {hasHr && <LegendItem color="var(--text-secondary)" label="HR (bpm)" />}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: 10,
          height: 2,
          borderRadius: 2,
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
