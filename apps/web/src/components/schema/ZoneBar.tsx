import { ZONE_META, type ZoneKey } from "../../lib/schema";

// Zone-PILLS uit de engine-`zones[]` (3-bucket-model low/high/anaerobic). Bewust GEEN
// proportionele 7-zone-bar: de engine emit bucket-namen, geen z:1-7-segmenten met duur
// (blokken/intent zijn archetype-only) → geen proporties verzinnen, geen watt→zone-mapping.
export function ZoneBar({ zones }: { zones: ZoneKey[] }) {
  if (zones.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {zones.map((z) => {
        const m = ZONE_META[z];
        return (
          <span
            key={z}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--r-pill)",
              padding: "4px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: m.color,
              }}
            />
            {m.label}
          </span>
        );
      })}
    </div>
  );
}
