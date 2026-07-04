// chart.jsx — Data-viz primitives voor FTP Coach (Ring + Niveau-lijngrafiek)
// Exports to window: ProgressRing, NiveauChart
const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// ProgressRing — ronde voortgangs-/readiness-ring met centertekst
// ─────────────────────────────────────────────────────────────
function ProgressRing({
  value = 82, size = 124, stroke = 11,
  color = 'var(--good)', track = 'rgba(255,255,255,0.07)',
  children, delay = 250,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - Math.max(0, Math.min(100, value)) / 100)), delay);
    return () => clearTimeout(t);
  }, [value, circ, delay]);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          style={{
            strokeDasharray: circ, strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)',
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NiveauChart — maandelijkse W/kg-lijn met area-fill + scrub-tooltip
// (W/kg = de leidende niveau-maat; de abstracte "x/50"-score is losgelaten)
// ─────────────────────────────────────────────────────────────
const MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

// 25 maandpunten jun '24 → jun '26 (W/kg), oplopend met winterdip
const FULL_VALUES = [
  2.92, 3.00, 3.06, 3.12, 3.05, 3.16, 3.22, 3.14, 3.04, 3.20, 3.34, 3.42,
  3.48, 3.36, 3.50, 3.58, 3.64, 3.55, 3.62, 3.70, 3.60, 3.72, 3.78, 3.74, 3.82,
];
const fmtWkg = (v) => v.toFixed(1).replace('.', ',');
function buildSeries() {
  const out = [];
  let m = 5, y = 2024; // jun '24
  for (let i = 0; i < FULL_VALUES.length; i++) {
    out.push({ v: FULL_VALUES[i], label: `${MND[m]} '${String(y).slice(2)}` });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
const SERIES = buildSeries();

function sliceNiveau(range) {
  if (range === '1m') return SERIES.slice(-2);
  if (range === '6m') return SERIES.slice(-7);
  if (range === '12m') return SERIES.slice(-13);
  return SERIES;
}

function NiveauChart({ range = 'all' }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(326);
  const [active, setActive] = useState(null); // index van gescrubd punt
  const H = 168;
  const padT = 16, padB = 24, padL = 4, padR = 6;

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(wrapRef.current);
    setW(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => sliceNiveau(range), [range]);

  const { pts, areaD, lineD, minV, maxV, plotW, plotH } = useMemo(() => {
    const vals = data.map(d => d.v);
    const lo = Math.floor((Math.min(...vals) - 0.15) * 10) / 10;
    const hi = Math.ceil((Math.max(...vals) + 0.15) * 10) / 10;
    const pw = w - padL - padR;
    const ph = H - padT - padB;
    const x = (i) => padL + (data.length === 1 ? pw / 2 : (i / (data.length - 1)) * pw);
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * ph;
    const p = data.map((d, i) => ({ x: x(i), y: y(d.v), ...d }));
    const line = p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
    const area = `${line} L${p[p.length - 1].x.toFixed(1)} ${(padT + ph).toFixed(1)} L${p[0].x.toFixed(1)} ${(padT + ph).toFixed(1)} Z`;
    return { pts: p, areaD: area, lineD: line, minV: lo, maxV: hi, plotW: pw, plotH: ph };
  }, [data, w]);

  // gridlines op nette W/kg-waarden
  const gridVals = useMemo(() => {
    const out = []; const step = (maxV - minV) <= 1.2 ? 0.2 : 0.5;
    for (let v = Math.ceil(minV / step) * step; v <= maxV + 1e-6; v += step) out.push(Math.round(v * 10) / 10);
    return out;
  }, [minV, maxV]);
  const yOf = (v) => padT + (1 - (v - minV) / (maxV - minV)) * plotH;

  const handleMove = (clientX) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const rel = clientX - rect.left;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - rel); if (d < bd) { bd = d; best = i; } });
    setActive(best);
  };

  const ap = active != null ? pts[active] : null;
  // dun de labels uit tot ≤~4 en voorkom dat ze overlappen aan het einde
  const xLabels = useMemo(() => {
    const n = data.length;
    if (n <= 1) return [0];
    const step = Math.max(1, Math.ceil((n - 1) / 4));
    const idxs = [];
    for (let i = 0; i < n; i += step) idxs.push(i);
    const lastL = idxs[idxs.length - 1];
    if (lastL !== n - 1) {
      if ((n - 1) - lastL < step * 0.6) idxs.pop();
      idxs.push(n - 1);
    }
    return idxs;
  }, [data]);

  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative', userSelect: 'none', touchAction: 'pan-y' }}>
      <svg
        width={w} height={H} style={{ display: 'block', overflow: 'visible' }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setActive(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setActive(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + y-labels */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={padL + 2} y={yOf(v) - 4} fill="var(--chart-axis)"
              fontSize="10" fontFamily="var(--font-num)">{fmtWkg(v)}</text>
          </g>
        ))}

        {/* area + lijn */}
        <path d={areaD} fill="url(#areaFill)" />
        <path d={lineD} fill="none" stroke="var(--chart-line)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* laatste punt = nu */}
        {!ap && pts.length > 0 && (
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4"
            fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth="2.5" />
        )}

        {/* scrubber */}
        {ap && (
          <g>
            <line x1={ap.x} x2={ap.x} y1={padT - 4} y2={padT + plotH} stroke="var(--border-strong)" strokeWidth="1" />
            <circle cx={ap.x} cy={ap.y} r="5" fill="var(--chart-point)" stroke="var(--accent)" strokeWidth="2.5" />
          </g>
        )}

        {/* x-labels */}
        {xLabels.map((i) => (
          <text key={i} x={Math.max(padL + 8, Math.min(w - padR - 8, pts[i].x))}
            y={H - 6} fill="var(--text-secondary)" fontSize="10.5" fontFamily="var(--font-num)"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
            {data[i].label}
          </text>
        ))}
      </svg>

      {/* tooltip-bubble */}
      {ap && (
        <div style={{
          position: 'absolute', top: -2,
          left: Math.max(0, Math.min(w - 96, ap.x - 48)), width: 96,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-sm)', padding: '5px 8px', pointerEvents: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'var(--font-num)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
            {ap.v.toFixed(2).replace('.', ',')}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            W/kg · {ap.label}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ProgressRing, NiveauChart, sliceNiveau });
