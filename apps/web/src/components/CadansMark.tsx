// Cadans-merkteken: drie stijgende schuine balken (gradient --accent →
// --accent-strong, skewX(-12)). Natgetrokken uit design/src/app.jsx CadansMark.
export function CadansMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="cadans-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-strong)" />
        </linearGradient>
      </defs>
      <g transform="translate(86,0) skewX(-12)" fill="url(#cadans-mark)">
        <rect x="150" y="300" width="56" height="118" rx="14" />
        <rect x="230" y="232" width="56" height="186" rx="14" />
        <rect x="310" y="150" width="56" height="268" rx="14" />
      </g>
    </svg>
  );
}
