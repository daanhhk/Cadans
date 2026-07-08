import type { SessionBlok } from "../../lib/schema";

// Horizontale per-zone bars (GAS-conventie: ALTIJD Z1-Z5), design-geankerd op de
// ZoneCompareRow-structuur uit design/src/coach-feedback.jsx (single-value variant:
// één massieve balk per zone i.p.v. de gepland/gedaan-overlay = 2b-2). Aggregeert de
// per-interval SessionBlok[] op zone-kleur (--zone-1..5) → één rij per zone. Vervangt de
// verticale ZoneBar + de losse pill-ZoneLegend (label leeft nu per rij). Tokens: kleuren
// (--zone-*), track (--zcompare-track), radii (--r-xs/--r-pill), type (--fs-caption). De
// bar-/dot-geometrie (hoogte 8 / dot 7 / radius 2) volgt de design-literals (grafisch).
const ZONE_ROWS: { z: number; color: string; label: string }[] = [
  { z: 1, color: "var(--zone-1)", label: "Herstel" },
  { z: 2, color: "var(--zone-2)", label: "Duur" },
  { z: 3, color: "var(--zone-3)", label: "Tempo" },
  { z: 4, color: "var(--zone-4)", label: "Drempel" },
  { z: 5, color: "var(--zone-5)", label: "VO2max" },
];

export function ZoneBars({ blokken }: { blokken: SessionBlok[] }) {
  if (blokken.length === 0) return null;
  const minByColor: Record<string, number> = {};
  for (const b of blokken) {
    minByColor[b.color] = (minByColor[b.color] ?? 0) + b.minuten;
  }
  const rows = ZONE_ROWS.map((z) => ({
    ...z,
    minuten: minByColor[z.color] ?? 0,
  }));
  const scale = Math.max(1, ...rows.map((r) => r.minuten));
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
    >
      {rows.map((r) => {
        const pct = (r.minuten / scale) * 100;
        return (
          <div
            key={r.z}
            style={{
              display: "grid",
              gridTemplateColumns: "76px 1fr 36px",
              columnGap: "var(--s-2)",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: r.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 600,
                  color: "var(--zcompare-label)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.label}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: "var(--r-xs)",
                background: "var(--zcompare-track)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  minWidth: r.minuten > 0 ? 3 : 0,
                  background: r.color,
                  borderRadius: "var(--r-pill)",
                }}
              />
            </div>
            <span
              style={{
                textAlign: "right",
                fontFamily: "var(--font-num)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                color:
                  r.minuten > 0 ? "var(--text-secondary)" : "var(--text-muted)",
              }}
            >
              {Math.round(r.minuten)}′
            </span>
          </div>
        );
      })}
    </div>
  );
}
