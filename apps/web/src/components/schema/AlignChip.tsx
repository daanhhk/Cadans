import type { AlignKind } from "../../lib/schema";

// Alignment-chip (design/src/coach-feedback.jsx AlignChip): dot + NL-label, gekleurd op de
// --align-*-tokens. Gedeeld — GAS toont 'm op de overline-rij (Script.html:585), dus rendert
// SchemaView 'm naast de dag-overline (P4). Strikt de bestaande --align-*-tokens.
const ALIGN: Record<AlignKind, { c: string; s: string }> = {
  "op-plan": { c: "var(--align-on-plan)", s: "var(--align-on-plan-soft)" },
  afgeweken: { c: "var(--align-deviated)", s: "var(--align-deviated-soft)" },
  anders: { c: "var(--align-different)", s: "var(--align-different-soft)" },
  gemist: { c: "var(--align-missed)", s: "var(--align-missed-soft)" },
};

export function AlignChip({ kind, label }: { kind: AlignKind; label: string }) {
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
