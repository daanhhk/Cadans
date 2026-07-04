import type { CSSProperties, ReactNode } from "react";

// Kleine presentatie-primitives — natgetrokken uit design/src/app.jsx
// (Overline, Num) + de --card-*-tokens.
export function Overline({
  children,
  color = "var(--text-muted)",
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
        letterSpacing: "var(--tracking-overline)",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Num({
  children,
  size = "var(--fs-num-md)",
  weight = 600,
  color = "var(--text-primary)",
  style,
}: {
  children: ReactNode;
  size?: string;
  weight?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-num)",
        fontVariantNumeric: "tabular-nums",
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--card-radius)",
        boxShadow: "var(--card-shadow)",
        padding: "var(--card-pad)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
