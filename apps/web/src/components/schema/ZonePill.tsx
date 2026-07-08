// Zone-gekleurde type-pill (design/src/coach-feedback.jsx DayHead-badge): dot + label,
// getint op de --zone-N-kleur. Gedeeld door de volle (DoneCompareCard) + gereduceerde
// (DoneDetail) VOLTOOID-kaart. zone = 1..5 (kleur-index), name = NL type-label.
export function ZonePill({ zone, name }: { zone: number; name: string }) {
  const zc = `var(--zone-${zone})`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: "var(--r-pill)",
        background: `color-mix(in srgb, ${zc} 18%, transparent)`,
        border: `1px solid color-mix(in srgb, ${zc} 45%, transparent)`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: zc,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          color: zc,
        }}
      >
        {name}
      </span>
    </span>
  );
}
