import type { CSSProperties } from "react";
import type { AlignKind, DoneCompare } from "../../lib/schema";
import { ZoneCompare } from "./ZoneCompare";
import { ZonePill } from "./ZonePill";

// VOLLE VOLTOOID-kaart (2b-2): geplande sessie bestaat → plan-vs-gedaan. Design-geankerd op
// design/src/coach-feedback.jsx (DayHead-badge/AlignChip/AlignBar/Reading/ZoneCompare). De
// dag-overline ("Di 4 · Voltooid") staat al boven de kaart (SchemaView) → hier badge + titel
// + chip + %-balk + gepland|gedaan-tabel + zone-compare. GEEN coach-callout/knoppen (= 2c).
// Strikt de --align-*/--reading-*/--zcompare-* tokens; micro-geometrie volgt de design-literals.

const ALIGN: Record<AlignKind, { c: string; s: string }> = {
  "op-plan": { c: "var(--align-on-plan)", s: "var(--align-on-plan-soft)" },
  afgeweken: { c: "var(--align-deviated)", s: "var(--align-deviated-soft)" },
  anders: { c: "var(--align-different)", s: "var(--align-different-soft)" },
  gemist: { c: "var(--align-missed)", s: "var(--align-missed-soft)" },
};

function AlignChip({ kind, label }: { kind: AlignKind; label: string }) {
  const a = ALIGN[kind] ?? ALIGN.anders;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--r-pill)",
        padding: "3px 9px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
        background: a.s,
        color: a.c,
        border: `1px solid color-mix(in srgb, ${a.c} 40%, transparent)`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: a.c,
        }}
      />
      {label}
    </span>
  );
}

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

export function DoneCompareCard({ card }: { card: DoneCompare }) {
  return (
    <div style={{ marginTop: "var(--s-3)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--s-2)",
        }}
      >
        <ZonePill zone={card.badgeZone} name={card.badgeName} />
        <AlignChip kind={card.chipKind} label={card.chipLabel} />
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
      {card.scorePct != null && <AlignBar pct={card.scorePct} />}
      <Reading card={card} />
    </div>
  );
}
