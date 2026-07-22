import type { RideStreams } from "@cadans/shared";
import { type RideChartOpts, rideChartGeometry } from "../../lib/rideDetail";

// RITDETAILS fase 2 — hand-SVG vermogens/HR-curve (GEEN charting-lib; de grafiek die GAS nooit
// bouwde, Script.html:702-stub). Watts als lijn + zacht gevuld vlak op de linker-as (var(--accent)),
// HR als dunne secundaire lijn op de rechter-as (var(--text-secondary)), x-as tijd-ticks + korte
// as-labels + mini-legenda. Geometrie komt puur uit rideChartGeometry (testbaar, DOM-loos).

const OPTS: RideChartOpts = {
  width: 320,
  height: 150,
  padTop: 12,
  padBottom: 22,
  padLeft: 30,
  padRight: 30,
};

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

export function RideChart({ streams }: { streams: RideStreams | null }) {
  if (!streams) {
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

  const g = rideChartGeometry(streams, OPTS);
  const baselineY = OPTS.height - OPTS.padBottom;
  const hasWatts = g.wattsSegments.length > 0;
  const hasHr = g.hrSegments.length > 0;

  if (!hasWatts && !hasHr) {
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

  return (
    <div>
      <svg
        viewBox={`0 0 ${OPTS.width} ${OPTS.height}`}
        width="100%"
        role="img"
        aria-label="Vermogen en hartslag over tijd"
        style={{ display: "block", maxWidth: "100%" }}
      >
        {/* baseline */}
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
        {/* as-labels */}
        {hasWatts && (
          <text
            x={OPTS.padLeft - 4}
            y={OPTS.padTop + 2}
            textAnchor="end"
            fontSize={8}
            fill="var(--accent)"
            fontFamily="var(--font-sans)"
          >
            W
          </text>
        )}
        {hasHr && (
          <text
            x={OPTS.width - OPTS.padRight + 4}
            y={OPTS.padTop + 2}
            textAnchor="start"
            fontSize={8}
            fill="var(--text-secondary)"
            fontFamily="var(--font-sans)"
          >
            bpm
          </text>
        )}
      </svg>
      {/* mini-legenda */}
      <div
        style={{
          display: "flex",
          gap: "var(--s-3)",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {hasWatts && <LegendItem color="var(--accent)" label="Vermogen" />}
        {hasHr && <LegendItem color="var(--text-secondary)" label="HR" />}
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
