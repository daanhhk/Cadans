import type { CSSProperties } from "react";
import type { DoneCompare } from "../../lib/schema";
import { SoonButton } from "./ActionButtons";
import { ZoneCompare } from "./ZoneCompare";
import { ZonePill } from "./ZonePill";

// VOLLE VOLTOOID-kaart (2b-2): geplande sessie bestaat → plan-vs-gedaan. Design-geankerd op
// design/src/coach-feedback.jsx (DayHead-badge/AlignBar/Reading/ZoneCompare). De dag-overline
// ("Di 4 · Voltooid") + de align-chip staan al boven de kaart (SchemaView, P4) → hier badge +
// titel + %-balk + gepland|gedaan-tabel + zone-compare. GEEN coach-callout/knoppen (= 2c).
// Strikt de --align-*/--reading-*/--zcompare-* tokens; micro-geometrie volgt de design-literals.

function AlignBar({ pct }: { pct: number }) {
  return (
    <div style={{ marginTop: "var(--s-3)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
          }}
        >
          Uitvoering volgt plan
        </span>
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontVariantNumeric: "tabular-nums",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--align-on-plan)",
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: "var(--r-pill)",
          background: "var(--reading-track)",
          marginTop: 7,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "var(--r-pill)",
            background: "var(--align-on-plan)",
          }}
        />
      </div>
    </div>
  );
}

const COL = "1fr minmax(56px,auto) minmax(56px,auto)";
const colLabel: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-caption)",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--reading-col-label)",
  textAlign: "right",
};
const rowLabel: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-label)",
  color: "var(--text-secondary)",
};
const numCell: CSSProperties = {
  fontFamily: "var(--font-num)",
  fontVariantNumeric: "tabular-nums",
  fontSize: "var(--fs-h3)",
  textAlign: "right",
  display: "block",
};

function Reading({ card }: { card: DoneCompare }) {
  return (
    <div
      style={{
        marginTop: "var(--s-4)",
        background: "var(--reading-track)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-md)",
        padding: "var(--s-3)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COL,
          columnGap: "var(--s-4)",
          alignItems: "baseline",
        }}
      >
        <span />
        <span style={colLabel}>Gepland</span>
        <span style={colLabel}>Gedaan</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COL,
          columnGap: "var(--s-4)",
          alignItems: "center",
          padding: "9px 0 10px",
          borderBottom: "1px solid var(--reading-divider)",
        }}
      >
        <span style={rowLabel}>Type</span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--reading-planned)",
            textAlign: "right",
          }}
        >
          {card.planType}
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 700,
            color: card.deviate
              ? "var(--align-different)"
              : "var(--reading-done)",
            textAlign: "right",
          }}
        >
          {card.doneType}
        </span>
      </div>
      {card.rows.map((r, i) => (
        <div
          key={r.k}
          style={{
            display: "grid",
            gridTemplateColumns: COL,
            columnGap: "var(--s-4)",
            alignItems: "center",
            padding: "8px 0",
            borderBottom:
              i < card.rows.length - 1
                ? "1px solid var(--reading-divider)"
                : "none",
          }}
        >
          <span style={rowLabel}>{r.k}</span>
          <span
            style={{
              ...numCell,
              fontWeight: 500,
              color: "var(--reading-planned)",
            }}
          >
            {r.p}
          </span>
          <span
            style={{
              ...numCell,
              fontWeight: 600,
              color: "var(--reading-done)",
            }}
          >
            {r.d}
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: "var(--s-3)",
          paddingTop: "var(--s-3)",
          borderTop: "1px solid var(--reading-divider)",
        }}
      >
        <ZoneCompare zones={card.zones} />
      </div>
    </div>
  );
}

// §6/2c coach-impact-box: NA de zone-vergelijking, VÓÓR het knoppen-blok (SchemaView). Proza =
// coachFeedback_ narrative (card.narrative), NOOIT hardcoded — ontbreekt → box weglaten. Design-
// geankerd op coach-feedback.jsx CoachCallout + de --coach-*-tokens. Kop-naam: settings.coachNaam
// bestaat nog NIET → GAS-default "Coach" (bron te wiren zodra het settings-veld er is).
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

function CoachImpact({
  narrative,
  impact,
}: {
  narrative: string;
  impact: boolean;
}) {
  return (
    <div
      style={{
        // STAP 2: extra ruimte ónder de impact-box zodat 'ie losstaat van de knoppen-rij. Door
        // margin-collapse (blok-siblings) telt de max met de knoppen-marge (s-4) → s-6 wint.
        marginTop: "var(--s-4)",
        marginBottom: "var(--s-6)",
        background: "var(--coach-bg)",
        border: `1px solid ${impact ? "var(--coach-border-impact)" : "var(--coach-border)"}`,
        borderRadius: "var(--r-md)",
        padding: "12px 13px",
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
          {impact ? "Coach · impact" : "Coach"}
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

export function DoneCompareCard({ card }: { card: DoneCompare }) {
  return (
    <div style={{ marginTop: "var(--s-3)" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <ZonePill zone={card.badgeZone} name={card.badgeName} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-h2)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
          marginTop: "var(--s-3)",
          lineHeight: "var(--lh-h2)",
        }}
      >
        {card.titel}
      </div>
      {/* P3 (GAS coachPctHtml_, Script.html:575): %-balk verbergen bij 'anders' (different)
          + 'gemist'; alleen tonen bij op-plan/afgeweken. */}
      {card.scorePct != null && card.chipKind !== "anders" && (
        <AlignBar pct={card.scorePct} />
      )}
      <Reading card={card} />
      {/* §5c-volgorde (STAP 1): "Bekijk ritdetails ›" NA de zone-vergelijking, VÓÓR de coach-impact-
          box. Zelfde "binnenkort"-staat als het gedeelde knoppen-blok (leidt straks naar 2d). */}
      <div
        style={{
          marginTop: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SoonButton label="Bekijk ritdetails ›" />
      </div>
      {card.narrative && (
        <CoachImpact
          narrative={card.narrative}
          impact={card.chipKind !== "op-plan"}
        />
      )}
    </div>
  );
}
