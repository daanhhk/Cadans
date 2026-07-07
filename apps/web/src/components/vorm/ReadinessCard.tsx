import type { ReactNode } from "react";
import { useState } from "react";
import type {
  ReadinessBand,
  ReadinessDot,
  ReadinessResult,
} from "../../lib/readiness";
import { Card, Num, Overline } from "../ui";
import { ProgressRing } from "./ProgressRing";

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
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "var(--r-pill)",
            background: dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// band → ringkleur (band drijft de kleur, NIET de score-drempels opnieuw afgeleid).
function bandColor(band: ReadinessBand | null): string {
  return band === "ready"
    ? "var(--good)"
    : band === "caution"
      ? "var(--warn)"
      : band === "rest"
        ? "var(--bad)"
        : "var(--text-muted)";
}

// Verdict = presentatie-mapping op de SCORE (fijner dan de 3-weg band: >=78 apart).
function verdictText(score: number | null): string {
  if (score == null) return "Nog onvoldoende gegevens voor een score";
  if (score >= 78) return "Klaar om te trainen";
  if (score >= 62) return "Goed — normaal trainen";
  if (score >= 48) return "Let op — tandje terug";
  return "Herstel aanbevolen";
}

function dotColor(dot: ReadinessDot): string {
  return dot === "good"
    ? "var(--good)"
    : dot === "warn"
      ? "var(--warn)"
      : "var(--text-muted)";
}

function chipStyle(tone: string): { color: string; bg: string; dot: string } {
  if (tone === "fresh") {
    return {
      color: "var(--fresh)",
      bg: "var(--fresh-soft)",
      dot: "var(--fresh)",
    };
  }
  return {
    color: "var(--text-secondary)",
    bg: "var(--bg-elevated)",
    dot: "var(--text-muted)",
  };
}

// Effect van de check-in op de score, uit de ENGINE-delta (checkinDelta_, ±2/veld,
// clamp ±6) — NIET de demo-adj uit het design-prototype.
function effectText(delta: number): string {
  if (delta > 0) return `Check-in: +${delta} op je score`;
  if (delta < 0) return `Check-in: ${delta} op je score`;
  return "Check-in: geen effect op je score";
}

// Statuskaart van Vorm. De gereedheids-SCORE + "waarom dit cijfer"-factoren komen nu
// LIVE uit de geporte engine-readiness-afleiding (client-side, `deriveReadiness`).
export function ReadinessCard({
  readiness,
  onOpenCheckin,
}: {
  readiness: ReadinessResult | null;
  onOpenCheckin: () => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);

  const score = readiness?.score ?? null;
  const band = readiness?.band ?? null;
  const factors = readiness?.factors ?? [];
  const chips = readiness?.chips ?? [];
  const checkinDone = readiness?.checkinDone ?? false;
  const checkinSummary = readiness?.checkinSummary ?? "";
  const checkinDelta = readiness?.checkinDelta ?? 0;

  return (
    <Card>
      <Overline>Status · vandaag</Overline>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-4)",
          marginTop: "var(--s-3)",
        }}
      >
        <ProgressRing
          value={score}
          size={104}
          stroke={9}
          color={bandColor(band)}
        >
          {score != null ? (
            <Num size="30px" weight={600}>
              {score}
            </Num>
          ) : (
            <Num size="var(--fs-num-md)" weight={600} color="var(--text-muted)">
              —
            </Num>
          )}
          <div style={{ marginTop: 2 }}>
            <Overline color="var(--text-muted)" style={{ fontSize: 8.5 }}>
              Gereed
            </Overline>
          </div>
        </ProgressRing>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17.5,
              fontWeight: 600,
              lineHeight: "var(--lh-h1)",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {verdictText(score)}
          </div>

          {chips.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: "var(--s-2)",
                flexWrap: "wrap",
              }}
            >
              {chips.map((c) => {
                const cs = chipStyle(c.tone);
                return (
                  <Chip key={c.label} color={cs.color} bg={cs.bg} dot={cs.dot}>
                    {c.label}
                  </Chip>
                );
              })}
            </div>
          )}

          {score != null && (
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              aria-expanded={whyOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: "var(--s-2)",
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              Waarom dit cijfer?
              <svg
                width="11"
                height="11"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                style={{
                  transform: whyOpen ? "rotate(180deg)" : "none",
                  transition: "transform .2s",
                }}
              >
                <path
                  d="M3 5l4 4 4-4"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {whyOpen && score != null && (
        <div
          style={{
            marginTop: "var(--s-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
            background: "var(--bg-sunken)",
            borderRadius: "var(--r-md)",
            padding: "var(--s-3)",
          }}
        >
          {factors.map((f) => (
            <div
              key={f.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-2)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "var(--r-pill)",
                  background: dotColor(f.dot),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  width: 116,
                  flexShrink: 0,
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  color: "var(--text-secondary)",
                }}
              >
                {f.label}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  color: "var(--text-primary)",
                  textAlign: "right",
                }}
              >
                {f.valueText}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "var(--s-3)",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "var(--s-3)",
        }}
      >
        {checkinDone ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--s-2)",
            }}
          >
            <span
              style={{
                minWidth: 0,
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                {checkinSummary}
              </span>
              <span style={{ display: "block", marginTop: 2 }}>
                {effectText(checkinDelta)}
              </span>
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
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
              }}
            >
              Aanpassen
            </button>
          </div>
        ) : score != null ? (
          <button
            type="button"
            onClick={onOpenCheckin}
            style={{
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Nog geen check-in vandaag —{" "}
            <span style={{ color: "var(--accent)" }}>
              vul 'm in voor een preciezere score
            </span>
          </button>
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
              fontSize: "var(--fs-label)",
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
