import type { ReadinessResult } from "../../lib/readiness";
import { Num, Overline } from "../ui";

const BAND_COLOR: Record<string, string> = {
  ready: "var(--good)",
  caution: "var(--warn)",
  rest: "var(--bad)",
};

function verdict(score: number | null): string {
  if (score == null) return "Nog onvoldoende gegevens";
  if (score >= 78) return "Klaar om te trainen";
  if (score >= 62) return "Goed — normaal trainen";
  if (score >= 48) return "Let op — tandje terug";
  return "Herstel aanbevolen";
}

// Compacte gereedheids-banner op de today-dag (uit deriveReadiness). Band drijft de
// randkleur; de volle ring/factoren staan op de Vorm-tab.
export function CoachReadinessBanner({
  readiness,
}: {
  readiness: ReadinessResult;
}) {
  const color = readiness.band
    ? BAND_COLOR[readiness.band]
    : "var(--text-muted)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        background: "var(--bg-elevated)",
        borderRadius: "var(--r-md)",
        borderLeft: `3px solid ${color}`,
        padding: "10px 12px", // banner-interne padding
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 40, // score-kolombreedte (grafisch)
        }}
      >
        {/* TODO off-scale: 22px valt tussen --fs-num-sm (17) en --fs-num-md (26) */}
        <Num size="22px" color={color}>
          {readiness.score ?? "—"}
        </Num>
        {/* TODO off-scale: 8.5px < --fs-caption (11), geen kleiner type-token */}
        <Overline style={{ fontSize: 8.5 }}>Gereed</Overline>
      </div>
      <div style={{ minWidth: 0 }}>
        <Overline>Gereedheid · vandaag</Overline>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginTop: 2, // tight label-gap (sub-4pt)
          }}
        >
          {verdict(readiness.score)}
        </div>
        {readiness.chips.length > 0 && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginTop: 3, // tight chip-gap (sub-4pt)
            }}
          >
            {readiness.chips.map((c) => c.label).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
