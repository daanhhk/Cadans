import type { CSSProperties } from "react";
import { displayCoach } from "../../lib/coach";

// Gedeeld coach-blok (chat-bubble-glyph + coachnaam-kop UPPERCASE + proza). Design-geankerd op
// coach-feedback.jsx CoachCallout + de --coach-*-tokens. Geëxtraheerd uit DoneCompareCard zodat
// zowel de voltooid-impact-box als de per-dag-narrative (boven de training) hetzelfde formaat delen.
// NEUTRALE eigen spacing: de root heeft GEEN context-marge — callers zetten die via de `style`-prop
// (bv. de done-box: marginTop s-4 / marginBottom s-6) zodat hun render byte-identiek blijft.

function CoachMark() {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: "var(--r-pill)",
        background: "var(--coach-mark-bg)",
        border: "1px solid var(--coach-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={13}
        height={13}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2.5 6.2a3.3 3.3 0 013.3-3.3h4.4a3.3 3.3 0 013.3 3.3v1.1a3.3 3.3 0 01-3.3 3.3H7l-3 2.3v-2.4a3.3 3.3 0 01-1.5-2.8V6.2z"
          stroke="var(--coach-mark)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="6.3" cy="6.8" r="0.85" fill="var(--coach-mark)" />
        <circle cx="9.7" cy="6.8" r="0.85" fill="var(--coach-mark)" />
      </svg>
    </span>
  );
}

export function CoachCallout({
  narrative,
  coachNaam,
  impact = false,
  style,
}: {
  narrative: string;
  coachNaam: string | null;
  impact?: boolean;
  /** Context-marge/-overrides van de caller (bv. de done-box). Wordt op de root gespreid. */
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--coach-bg)",
        border: `1px solid ${impact ? "var(--coach-border-impact)" : "var(--coach-border)"}`,
        borderRadius: "var(--r-md)",
        padding: "12px 13px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CoachMark />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--coach-label)",
          }}
        >
          {impact
            ? `${displayCoach(coachNaam)} · impact`
            : displayCoach(coachNaam)}
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          lineHeight: 1.5,
          color: "var(--coach-text)",
        }}
      >
        {narrative}
      </div>
    </div>
  );
}
