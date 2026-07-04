import type { CheckinInput, WellnessInput } from "@cadans/shared";
import type { ReactNode } from "react";
import { nlInt, nlSigned1 } from "../../lib/format";
import { tsbZone } from "../../lib/tsb";
import { Card, Overline } from "../ui";

function Chip({
  children,
  color = "var(--text-secondary)",
  bg = "var(--bg-elevated)",
  dot,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  dot?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        color,
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-pill)",
        padding: "4px 9px",
        fontFamily: "var(--font-sans)",
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// Statuskaart van Vorm. De readiness-SCORE + "waarom dit cijfer"-factoren zijn
// nog niet geport (readiness-afleiding = deferred debt) → PLACEHOLDER, GEEN
// verzonnen getal. Vorm/HRV-chips + de check-in-regel zijn 1:1 live-data.
export function ReadinessCard({
  latest,
  checkin,
  onOpenCheckin,
}: {
  latest: WellnessInput | null;
  checkin: CheckinInput | null;
  onOpenCheckin: () => void;
}) {
  const vorm = latest?.vorm ?? null;
  const hrv = latest?.hrv ?? null;
  const z = vorm != null ? tsbZone(vorm) : null;

  return (
    <Card>
      <Overline>Status · vandaag</Overline>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 12,
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 999,
            border: "9px solid var(--readiness-ring-track)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Overline style={{ fontSize: 8.5 }}>Gereed</Overline>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginTop: 3,
            }}
          >
            Binnenkort
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13.5,
              color: "var(--text-secondary)",
              lineHeight: 1.35,
            }}
          >
            De gereedheids-score volgt zodra de readiness-afleiding is geport.
          </div>
          <div
            style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}
          >
            {vorm != null && z && (
              <Chip color={z.color} bg={z.soft} dot={z.color}>
                Vorm {nlSigned1(vorm)}
              </Chip>
            )}
            {hrv != null && (
              <Chip dot="var(--text-muted)">HRV {nlInt(hrv)}</Chip>
            )}
            {vorm == null && hrv == null && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Nog geen wellness-data.
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 12,
        }}
      >
        {checkin ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Check-in:</span>{" "}
              Slaap {checkin.slaap} · benen {checkin.benen} · stress{" "}
              {checkin.stress}
            </span>
            <button
              type="button"
              onClick={onOpenCheckin}
              aria-label="Check-in aanpassen"
              style={{
                flexShrink: 0,
                height: 26,
                padding: "0 10px",
                borderRadius: "var(--r-pill)",
                cursor: "pointer",
                background: "var(--accent-soft)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                color: "var(--accent)",
                fontFamily: "var(--font-sans)",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              Aanpassen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCheckin}
            style={{
              width: "100%",
              height: 38,
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              background: "var(--bg-sunken)",
              border: "1px dashed var(--border-strong)",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            + Ochtend-check-in invullen
          </button>
        )}
      </div>
    </Card>
  );
}
