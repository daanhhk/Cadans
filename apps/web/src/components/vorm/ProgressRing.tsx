import type { ReactNode } from "react";
import { useEffect, useState } from "react";

// Voortgangs-/readiness-ring — port van design/src/chart.jsx ProgressRing. Puur
// presentatie: `value` (0..100) drijft de boog; `color` komt van de CALLER (die mapt
// band → kleur, niet hier). value === null → alleen de muted track (geen boog).
export function ProgressRing({
  value,
  size = 104,
  stroke = 9,
  color = "var(--good)",
  track = "var(--readiness-ring-track)",
  delay = 250,
  children,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  delay?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - pct / 100)), delay);
    return () => clearTimeout(t);
  }, [pct, circ, delay]);

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        {value != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{
              strokeDasharray: circ,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)",
            }}
          />
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
