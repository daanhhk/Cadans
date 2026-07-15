import { type SessionBlok, silhouetSegments } from "../../lib/schema";

// Proportionele workout-staafbar — geport uit de GAS `zoneBar` (Script.html): inline-SVG,
// viewBox 0 0 100 100, preserveAspectRatio=none; één <rect> per blok, breedte ∝ minuten,
// hoogte ∝ hoogtePct (staven groeien van onderaf: y = 100 − hoogte), smalle gap tussen
// staven, rx 0.8. Kleur per blok = de --zone-*-tokens (via SessionBlok.color) → lijnt met
// de blok-lijst. De tekstuele intervallen staan in BlockList (a11y-bron) → bar decoratief.
// De geometrie leeft in lib/schema.ts `silhouetSegments` (pure, DOM-loos testbaar); hier
// puur renderen. SVG-maten zijn bewuste grafische dimensies (geen spacing/type-tokens).
export function ZoneBar({
  blokken,
  height = 110,
}: {
  blokken: SessionBlok[];
  // optioneel: de picker-variantrijen gebruiken de GAS-minibar-hoogte (Styles.html:61, .wk-minibar 40px).
  height?: number;
}) {
  const segs = silhouetSegments(blokken);
  if (segs.length === 0) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height }}
    >
      {segs.map((s) => (
        <rect
          key={s.x}
          x={s.x.toFixed(2)}
          y={s.y}
          width={s.bw.toFixed(2)}
          height={s.h}
          rx={0.8}
          fill={s.color}
        />
      ))}
    </svg>
  );
}
