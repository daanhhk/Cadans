import { ZONE_META, type ZoneKey } from "../../lib/schema";

// Zone-LEGEND: chips uit de engine-`zones[]` (3-bucket-model low/high/anaerobic), de
// canonieke plek voor het zone-WOORD (Duur/Drempel/VO2max). De proportionele intensiteit
// leeft in ZoneBar (staafgrafiek); dit zijn de bijbehorende gekleurde legend-chips.
export function ZoneLegend({ zones }: { zones: ZoneKey[] }) {
  if (zones.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
      {zones.map((z) => {
        const m = ZONE_META[z];
        return (
          <span
            key={z}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5, // tight dot↔label-gap (sub-4pt)
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--r-pill)",
              padding: "4px 10px", // pill-interne padding (chip-maat)
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: 8, // kleur-dot (grafische maat)
                height: 8,
                borderRadius: "var(--r-pill)",
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
