import type { SessionBlok } from "../../lib/schema";

// Proportionele workout-staafbar — geport uit de GAS `zoneBar` (Script.html): inline-SVG,
// viewBox 0 0 100 100, preserveAspectRatio=none; één <rect> per blok, breedte ∝ minuten,
// hoogte ∝ hoogtePct (staven groeien van onderaf: y = 100 − hoogte), smalle gap tussen
// staven, rx 0.8. Kleur per blok = de --zone-*-tokens (via SessionBlok.color) → lijnt met
// de ZoneLegend-chips. De tekstuele intervallen staan in BlockList (a11y-bron) → bar
// decoratief. SVG-maten zijn bewuste grafische dimensies (geen spacing/type-tokens).
export function ZoneBar({ blokken }: { blokken: SessionBlok[] }) {
  if (blokken.length === 0) return null;
  const W = 100;
  const MINW = 1.4; // min. staafbreedte zodat korte blokken zichtbaar blijven
  const GAP = 0.6; // smalle gap tussen staven
  const totMin = blokken.reduce((a, b) => a + b.minuten, 0) || 1;
  const weights = blokken.map((b) => Math.max(MINW, (b.minuten / totMin) * W));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let x = 0;
  const segs = blokken.map((b, i) => {
    const w = ((weights[i] ?? 0) / sum) * W; // renormaliseer naar exact 100
    const seg = {
      x,
      bw: Math.max(0.8, w - GAP),
      y: 100 - b.hoogtePct,
      h: b.hoogtePct,
      color: b.color,
    };
    x += w;
    return seg;
  });
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: 110 }}
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
