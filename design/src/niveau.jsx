// niveau.jsx — FTP Coach · Niveau-tab (langetermijn vermogen & ontwikkeling)
// "Vorm = nu · Niveau = hoe sterk + waarheen." Hoofd-event: Girona (duurvermogen).
// Exports to window: NiveauTab, VormLevelSummary
// Elementen: 1 Vermogen-snapshot [v1] · 2 Progressie over tijd [v1] ·
//            3 Rijdersprofiel [fase 2] · 4 Doel-gereedheid + projectie [fase 2 · visie]
(function () {
  const { useState, useEffect, useRef, useMemo } = React;

  /* ───────── lokale primitieven (eigen, unieke namen) ───────── */
  function useNvWidth(initial = 326) {
    const ref = useRef(null);
    const [w, setW] = useState(initial);
    useEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
      ro.observe(ref.current); setW(ref.current.clientWidth);
      return () => ro.disconnect();
    }, []);
    return [ref, w];
  }
  const NvOver = ({ children, color = 'var(--text-muted)', style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style }}>{children}</div>
  );
  const NvNum = ({ children, size = 24, weight = 600, color = 'var(--text-primary)', style }) => (
    <span style={{ fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', fontSize: size, fontWeight: weight, color, lineHeight: 1, letterSpacing: '-0.01em', ...style }}>{children}</span>
  );
  const NvCard = ({ children, style, pad = '16px 16px' }) => (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: pad, boxShadow: 'var(--shadow-card)', ...style }}>{children}</div>
  );
  const SoonTag = ({ children = 'Fase 2' }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--soon-tag-bg)', border: '1px solid var(--soon-tag-border)', color: 'var(--soon-tag-text)', borderRadius: 'var(--r-pill)', padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--text-muted)' }} />{children}
    </span>
  );
  const fmt1 = (n) => Math.abs(n).toFixed(1).replace('.', ',');
  const Skel = ({ w = '100%', h = 12, r = 6, style }) => (
    <div className="nv-skel" style={{ width: w, height: h, borderRadius: r, background: 'var(--skeleton-base)', position: 'relative', overflow: 'hidden', ...style }} />
  );

  /* ───────── data (afleidbaar uit 730d FTP/TSS/gewicht-historie) ───────── */
  const MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  // 25 maandpunten jun '24 → jun '26
  const NIVEAU = [19.0, 19.8, 20.3, 21.0, 20.6, 21.4, 22.1, 21.5, 20.8, 21.9, 23.0, 23.6, 24.1, 23.4, 24.5, 25.2, 26.0, 25.4, 26.3, 27.0, 26.6, 27.4, 27.9, 27.5, 28.0];
  const WKG = [2.92, 3.00, 3.06, 3.12, 3.05, 3.16, 3.22, 3.14, 3.04, 3.20, 3.34, 3.42, 3.48, 3.36, 3.50, 3.58, 3.64, 3.55, 3.62, 3.70, 3.60, 3.72, 3.78, 3.74, 3.82];
  const CTL = [38, 40, 42, 44, 41, 45, 48, 45, 42, 47, 52, 55, 57, 53, 56, 59, 61, 57, 60, 63, 59, 63, 65, 63, 65];
  const WEIGHT = 72;
  function labelAt(i) { let m = 5 + i, y = 2024; y += Math.floor(m / 12); m = m % 12; return `${MND[m]} '${String(y).slice(2)}`; }
  const METRICS = {
    niveau: { key: 'niveau', label: 'Niveau', vals: NIVEAU, unit: '/ 50', dec: 1, fmt: (v) => fmt1(v), color: 'var(--traj-line)' },
    wkg: { key: 'wkg', label: 'W/kg', vals: WKG, unit: 'W/kg', dec: 2, fmt: (v) => v.toFixed(2).replace('.', ','), color: 'var(--traj-line)' },
    ctl: { key: 'ctl', label: 'Fitheid', vals: CTL, unit: 'CTL', dec: 0, fmt: (v) => Math.round(v).toString(), color: 'var(--traj-ctl-line)' },
  };
  function sliceRange(arr, range) {
    if (range === '1m') return arr.slice(-2);
    if (range === '6m') return arr.slice(-7);
    if (range === '12m') return arr.slice(-13);
    return arr;
  }

  /* ═══════════════════ 1 · VERMOGEN-SNAPSHOT [v1] ═══════════════════ */
  // Coggan-achtige tiers, NL. 3,8 W/kg → "Gevorderd".
  const TIERS = [
    { l: 'Beginner', max: 2.5 }, { l: 'Recreatief', max: 3.0 }, { l: 'Getraind', max: 3.5 },
    { l: 'Gevorderd', max: 4.1 }, { l: 'Zeer goed', max: 4.8 }, { l: 'Elite', max: 99 },
  ];
  function tierIndex(wkg) { return TIERS.findIndex((t) => wkg < t.max); }

  function VermogenSnapshot({ state }) {
    const ftp = 275, wkg = 3.82, kg = WEIGHT, eftp = 272;
    const ti = tierIndex(wkg);
    if (state === 'leeg') {
      return (
        <NvCard>
          <NvOver>Vermogen</NvOver>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: '20px 8px 12px', textAlign: 'center' }}>
            <NvNum size={40} color="var(--text-muted)">—</NvNum>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 230 }}>Verbind je account — dan verschijnt hier je FTP, W/kg en niveau-tier.</div>
          </div>
        </NvCard>
      );
    }
    if (state === 'laden') {
      return (
        <NvCard>
          <NvOver>Vermogen</NvOver>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 14 }}>
            <Skel w={120} h={48} r={10} />
            <Skel w={92} h={40} r={10} />
          </div>
          <Skel w="100%" h={30} r={8} style={{ marginTop: 18 }} />
        </NvCard>
      );
    }
    return (
      <NvCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <NvOver>Vermogen</NvOver>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--tier-step-border-active)', borderRadius: 'var(--r-pill)', padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600 }}>{TIERS[ti].l}</span>
        </div>

        {/* FTP hero + W/kg benadrukt */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NvNum size={48} weight={600}>{ftp}</NvNum>
              <NvNum size={17} weight={500} color="var(--text-muted)">W</NvNum>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
              <NvOver style={{ letterSpacing: '0.1em' }}>FTP</NvOver>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>· eFTP {eftp} W</span>
            </div>
          </div>
          {/* W/kg — dé klimmetric, benadrukt */}
          <div style={{ textAlign: 'right', background: 'var(--wkg-emphasis-bg)', border: '1px solid var(--tier-step-border-active)', borderRadius: 'var(--r-md)', padding: '9px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <NvNum size={30} weight={600} color="var(--wkg-emphasis)">{fmt1(wkg)}</NvNum>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--wkg-emphasis)' }}>W/kg</span>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: 'var(--accent)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Klimvermogen</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{kg} kg</div>
          </div>
        </div>

        {/* tier-ladder Beginner → Elite */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {TIERS.map((t, i) => (
              <div key={t.l} style={{ flex: 1, height: 6, borderRadius: 999, background: i <= ti ? 'var(--accent)' : 'var(--tier-step)', opacity: i < ti ? 0.4 : 1 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'var(--tier-label)' }}>Beginner</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'var(--tier-label)' }}>Elite</span>
          </div>
        </div>
      </NvCard>
    );
  }

  /* ═══════════════════ 2 · PROGRESSIE OVER TIJD [v1] ═══════════════════ */
  function NvTrajectoryChart({ metric, range, ctlOverlay }) {
    const [ref, w] = useNvWidth();
    const [active, setActive] = useState(null);
    const H = 168, padT = 16, padB = 24, padL = 4, padR = 6;
    const m = METRICS[metric];
    const data = useMemo(() => sliceRange(m.vals, range).map((v, i, a) => ({ v, i, label: labelAt(NIVEAU.length - a.length + i) })), [metric, range]);
    const ctlData = useMemo(() => ctlOverlay ? sliceRange(CTL, range) : null, [range, ctlOverlay]);

    const geom = useMemo(() => {
      const vals = data.map((d) => d.v);
      let lo = Math.min(...vals), hi = Math.max(...vals);
      const padv = (hi - lo) * 0.18 || (m.dec === 2 ? 0.15 : m.dec === 0 ? 3 : 1.5);
      lo -= padv; hi += padv;
      const pw = w - padL - padR, ph = H - padT - padB;
      const x = (i) => padL + (data.length === 1 ? pw / 2 : (i / (data.length - 1)) * pw);
      const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * ph;
      const pts = data.map((d, i) => ({ x: x(i), y: y(d.v), ...d }));
      const line = pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
      const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${(padT + ph).toFixed(1)} L${pts[0].x.toFixed(1)} ${(padT + ph).toFixed(1)} Z`;
      return { pts, line, area, lo, hi, ph, x, y };
    }, [data, w]);

    const ctlPath = useMemo(() => {
      if (!ctlData) return null;
      const allLo = geom.lo, allHi = geom.hi;
      // CTL plotted on its own normalized band (lower third) so it reads as context, not a competing scale
      const c = ctlData; const cl = Math.min(...c), ch = Math.max(...c);
      const pad = (ch - cl) * 0.4 || 4; const lo = cl - pad, hi = ch + pad;
      const ph = H - padT - padB;
      const x = (i) => padL + (c.length === 1 ? (w - padL - padR) / 2 : (i / (c.length - 1)) * (w - padL - padR));
      const y = (v) => padT + ph * 0.35 + (1 - (v - lo) / (hi - lo)) * ph * 0.6;
      return c.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    }, [ctlData, w, geom]);

    const move = (clientX) => {
      const rect = ref.current.getBoundingClientRect();
      const rel = clientX - rect.left; let best = 0, bd = Infinity;
      geom.pts.forEach((p, i) => { const d = Math.abs(p.x - rel); if (d < bd) { bd = d; best = i; } });
      setActive(best);
    };
    const ap = active != null ? geom.pts[active] : null;
    const gridV = useMemo(() => {
      const out = []; const span = geom.hi - geom.lo;
      const step = m.dec === 2 ? 0.2 : m.dec === 0 ? (span > 25 ? 10 : 5) : (span > 6 ? 5 : 2);
      for (let v = Math.ceil(geom.lo / step) * step; v < geom.hi; v += step) out.push(v);
      return out;
    }, [geom, metric]);
    const xLabels = useMemo(() => {
      const n = data.length; if (n <= 1) return [0];
      const step = Math.max(1, Math.ceil((n - 1) / 4)); const idxs = [];
      for (let i = 0; i < n; i += step) idxs.push(i);
      if (idxs[idxs.length - 1] !== n - 1) { if ((n - 1) - idxs[idxs.length - 1] < step * 0.6) idxs.pop(); idxs.push(n - 1); }
      return idxs;
    }, [data]);

    return (
      <div ref={ref} style={{ width: '100%', position: 'relative', userSelect: 'none', touchAction: 'pan-y' }}>
        <svg width={w} height={H} style={{ display: 'block', overflow: 'visible' }}
          onMouseMove={(e) => move(e.clientX)} onMouseLeave={() => setActive(null)}
          onTouchStart={(e) => move(e.touches[0].clientX)} onTouchMove={(e) => move(e.touches[0].clientX)} onTouchEnd={() => setActive(null)}>
          <defs>
            <linearGradient id="nvArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridV.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={geom.y(v)} y2={geom.y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={padL + 2} y={geom.y(v) - 4} fill="var(--chart-axis)" fontSize="10" fontFamily="var(--font-num)">{m.dec === 2 ? v.toFixed(1).replace('.', ',') : Math.round(v)}</text>
            </g>
          ))}
          {ctlPath && <path d={ctlPath} fill="none" stroke="var(--traj-ctl-line)" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.7" strokeLinejoin="round" />}
          <path d={geom.area} fill="url(#nvArea)" />
          <path d={geom.line} fill="none" stroke="var(--traj-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {!ap && geom.pts.length > 0 && (
            <circle cx={geom.pts[geom.pts.length - 1].x} cy={geom.pts[geom.pts.length - 1].y} r="4" fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth="2.5" />
          )}
          {ap && (
            <g>
              <line x1={ap.x} x2={ap.x} y1={padT - 4} y2={padT + geom.ph} stroke="var(--border-strong)" strokeWidth="1" />
              <circle cx={ap.x} cy={ap.y} r="5" fill="var(--traj-point)" stroke="var(--accent)" strokeWidth="2.5" />
            </g>
          )}
          {xLabels.map((i) => (
            <text key={i} x={Math.max(padL + 8, Math.min(w - padR - 8, geom.pts[i].x))} y={H - 6} fill="var(--text-secondary)" fontSize="10.5" fontFamily="var(--font-num)"
              textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>{data[i].label}</text>
          ))}
        </svg>
        {ap && (
          <div style={{ position: 'absolute', top: -2, left: Math.max(0, Math.min(w - 104, ap.x - 52)), width: 104, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '5px 8px', pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}>
            <NvNum size={18} weight={600}>{m.fmt(ap.v)}</NvNum>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label.toLowerCase()} · {ap.label}</div>
          </div>
        )}
      </div>
    );
  }

  function ProgressieCard({ state }) {
    const [metric, setMetric] = useState('wkg');
    const [range, setRange] = useState('all');
    const [ctlOverlay, setCtlOverlay] = useState(true);
    const m = METRICS[metric];
    const series = sliceRange(m.vals, range);
    const cur = series[series.length - 1], delta = cur - series[0], up = delta >= 0;
    const metrics = [['wkg', 'W/kg'], ['ctl', 'Fitheid']];
    const ranges = [['1m', '1M'], ['6m', '6M'], ['12m', '12M'], ['all', 'Alles']];
    const periodLabel = range === '1m' ? 'deze maand' : range === '6m' ? '6 mnd' : range === '12m' ? '12 mnd' : 'sinds seizoenstart';

    if (state === 'laden') {
      return (
        <NvCard pad="16px 16px 14px">
          <NvOver>Progressie over tijd</NvOver>
          <Skel w={120} h={26} r={7} style={{ marginTop: 10 }} />
          <Skel w="100%" h={168} r={10} style={{ marginTop: 16 }} />
        </NvCard>
      );
    }
    if (state === 'leeg') {
      return (
        <NvCard pad="16px 16px 18px">
          <NvOver>Progressie over tijd</NvOver>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 12px 18px', lineHeight: 1.55 }}>Je trajectorie verschijnt zodra er ~4 weken aan ritten zijn binnengekomen.</div>
        </NvCard>
      );
    }
    return (
      <NvCard pad="16px 16px 12px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <NvOver>Progressie over tijd</NvOver>
          {metric !== 'ctl' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--text-muted)' }}>
              <span style={{ width: 13, height: 0, borderTop: '2px dashed var(--traj-ctl-line)', opacity: ctlOverlay ? 1 : 0.4 }} />
              <button onClick={() => setCtlOverlay((v) => !v)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600, color: ctlOverlay ? 'var(--text-secondary)' : 'var(--text-muted)' }}>Fitheid</button>
            </span>
          )}
        </div>

        {/* huidige waarde + delta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <NvNum size={28} weight={600}>{m.fmt(cur)}</NvNum>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>{m.unit}</span>
          <NvNum size={12} weight={600} color={up ? 'var(--traj-delta-up)' : 'var(--traj-delta-down)'} style={{ marginLeft: 2 }}>
            {delta === 0 ? '±0' : `${up ? '+' : '−'}${m.fmt(Math.abs(delta))} ${up ? '↑' : '↓'}`}
          </NvNum>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginLeft: 1 }}>{periodLabel}</span>
        </div>

        {/* metric-switch */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', padding: 3, marginTop: 12 }}>
          {metrics.map(([k, lbl]) => (
            <button key={k} onClick={() => setMetric(k)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '6px 0', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, background: metric === k ? 'var(--bg-elevated)' : 'transparent', color: metric === k ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: metric === k ? '0 1px 3px rgba(0,0,0,0.45)' : 'none', transition: 'all .15s' }}>{lbl}</button>
          ))}
        </div>
        {/* window-switch */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', padding: 3, marginTop: 8 }}>
          {ranges.map(([k, lbl]) => (
            <button key={k} onClick={() => setRange(k)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '5px 0', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, background: range === k ? 'var(--bg-elevated)' : 'transparent', color: range === k ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: range === k ? '0 1px 3px rgba(0,0,0,0.45)' : 'none', transition: 'all .15s' }}>{lbl}</button>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <NvTrajectoryChart metric={metric} range={range} ctlOverlay={metric !== 'ctl' && ctlOverlay} />
        </div>
      </NvCard>
    );
  }

  Object.assign(window, { METRICS });

  /* ═══════════════════ 3 · RIJDERSPROFIEL [fase 2] ═══════════════════ */
  const CURVE = [
    { s: 5, lbl: '5s', w: 980, key: false },
    { s: 60, lbl: '1m', w: 560, key: false },
    { s: 300, lbl: '5m', w: 372, key: true },
    { s: 1200, lbl: '20m', w: 312, key: true },
    { s: 3600, lbl: '60m', w: 276, key: true },
  ];
  function Rijdersprofiel() {
    const [ref, w] = useNvWidth();
    const H = 150, padT = 14, padB = 26, padL = 30, padR = 10;
    const xs = CURVE.map((d) => Math.log(d.s));
    const xlo = Math.min(...xs), xhi = Math.max(...xs);
    const ws = CURVE.map((d) => d.w); const wlo = Math.min(...ws) - 30, whi = Math.max(...ws) + 40;
    const X = (s) => padL + ((Math.log(s) - xlo) / (xhi - xlo)) * (w - padL - padR);
    const Y = (v) => padT + (1 - (v - wlo) / (whi - wlo)) * (H - padT - padB);
    const line = CURVE.map((d, i) => `${i ? 'L' : 'M'}${X(d.s).toFixed(1)} ${Y(d.w).toFixed(1)}`).join(' ');
    const area = `${line} L${X(CURVE[CURVE.length - 1].s).toFixed(1)} ${(H - padB).toFixed(1)} L${X(CURVE[0].s).toFixed(1)} ${(H - padB).toFixed(1)} Z`;
    // type: 0 = sprinter, 1 = diesel/klimmer. ratio van 5min t.o.v. 5s
    const typePos = 0.74; // dieselig — sterke duur, beperkte sprint

    return (
      <NvCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <NvOver>Rijdersprofiel</NvOver>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>Beste inspanning per duur</div>
          </div>
          <SoonTag>Fase 2</SoonTag>
        </div>

        <div ref={ref} style={{ width: '100%', marginTop: 8, opacity: 0.96 }}>
          <svg width={w} height={H} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="nvCurve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[300, 400, 500].map((v) => v >= wlo && v <= whi && (
              <g key={v}>
                <line x1={padL} x2={w - padR} y1={Y(v)} y2={Y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={4} y={Y(v) + 3} fill="var(--curve-axis)" fontSize="9.5" fontFamily="var(--font-num)">{v}</text>
              </g>
            ))}
            <path d={area} fill="url(#nvCurve)" />
            <path d={line} fill="none" stroke="var(--curve-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {CURVE.map((d) => (
              <g key={d.s}>
                {d.key && <circle cx={X(d.s)} cy={Y(d.w)} r="8" fill="var(--accent-soft)" />}
                <circle cx={X(d.s)} cy={Y(d.w)} r="4" fill={d.key ? 'var(--curve-point-key)' : 'var(--curve-point)'} stroke="var(--bg-surface)" strokeWidth="2" />
                <text x={X(d.s)} y={H - 14} textAnchor="middle" fill="var(--curve-axis)" fontSize="10" fontFamily="var(--font-num)">{d.lbl}</text>
                <text x={X(d.s)} y={H - 2} textAnchor="middle" fill={d.key ? 'var(--accent)' : 'var(--text-muted)'} fontSize="9.5" fontFamily="var(--font-num)" fontWeight="600">{d.w}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* type-duiding */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Sprinter</span><span>Allrounder</span><span>Diesel · klimmer</span>
          </div>
          <div style={{ position: 'relative', height: 6, borderRadius: 999, background: 'var(--curve-type-track)' }}>
            <div style={{ position: 'absolute', top: '50%', left: `${typePos * 100}%`, transform: 'translate(-50%,-50%)', width: 13, height: 13, borderRadius: 999, background: 'var(--curve-type-marker)', border: '3px solid var(--bg-surface)', boxShadow: '0 0 0 1px var(--accent)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
            Sterke <strong style={{ color: 'var(--text-primary)' }}>20 min &amp; duur</strong>, bescheiden sprint — een diesel die past bij Girona's lange klimmen.
          </div>
        </div>
      </NvCard>
    );
  }

  /* ═══════════════════ 4 · DOEL-GEREEDHEID + PROJECTIE [fase 2 · visie] ═══════════════════ */
  // Girona-vraag (definitie): klimvermogen ~3,6 W/kg · duurvermogen CTL ~72 · lange rit ~4u.
  const C0 = 65, TARGET = 72, TAU = 5.5;          // huidige fitheid · duurdoel · ramp-tijdconstante
  const ceilingOf = (h) => 58 + (h - 4) * 4;     // fitheid-plafond ≈ f(uren/week), berekend uit volume
  function weeksToTarget(h) {
    const ceil = ceilingOf(h);
    if (ceil <= TARGET + 0.5) return null;       // plafond onder doel → niet haalbaar
    return TAU * Math.log((ceil - C0) / (ceil - TARGET));
  }
  function ftpBand(h) {                            // SPECULATIEF: geschat FTP-bereik (nooit één getal)
    const mid = (h - 4) * 0.45;                   // % midden
    return { lo: Math.round(275 * (1 + (mid - 1.6) / 100)), hi: Math.round(275 * (1 + (mid + 1.6) / 100)), midPct: mid };
  }

  function ProjectionChart({ hours }) {
    const [ref, w] = useNvWidth();
    const H = 156, padT = 12, padB = 24, padL = 4, padR = 6;
    const WEEKS = 16;
    const ceil = ceilingOf(hours);
    const wk = weeksToTarget(hours);
    const pw = w - padL - padR, ph = H - padT - padB;
    const ylo = 54, yhi = 90;
    const X = (t) => padL + (t / WEEKS) * pw;
    const Y = (v) => { const yy = padT + (1 - (v - ylo) / (yhi - ylo)) * ph; return Math.max(padT, Math.min(padT + ph, yy)); };
    const ramp = []; for (let t = 0; t <= WEEKS; t++) ramp.push({ t, v: ceil - (ceil - C0) * Math.exp(-t / TAU) });
    const rampD = ramp.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
    const rampArea = `${rampD} L${X(WEEKS).toFixed(1)} ${(padT + ph).toFixed(1)} L${X(0).toFixed(1)} ${(padT + ph).toFixed(1)} Z`;
    const readyX = wk != null && wk <= WEEKS ? X(wk) : null;

    return (
      <div ref={ref} style={{ width: '100%', position: 'relative' }}>
        <svg width={w} height={H} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="nvProj" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* doel-lijn */}
          <line x1={padL} x2={w - padR} y1={Y(TARGET)} y2={Y(TARGET)} stroke="var(--goal-target-line)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={w - padR} y={Y(TARGET) - 5} textAnchor="end" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-num)">duurdoel {TARGET}</text>
          {/* plafond-lijn */}
          <line x1={padL} x2={w - padR} y1={Y(ceil)} y2={Y(ceil)} stroke="var(--proj-solid)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
          <text x={padL + 2} y={Y(ceil) - 4} fill="var(--accent)" fontSize="9.5" fontFamily="var(--font-num)">plafond {Math.round(ceil)}</text>
          {/* ramp (SOLIDE, berekend uit volume) */}
          <path d={rampArea} fill="url(#nvProj)" />
          <path d={rampD} fill="none" stroke="var(--proj-solid)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={X(0)} cy={Y(C0)} r="3.5" fill="var(--text-primary)" />
          {/* klaar-marker */}
          {readyX != null && (
            <g>
              <line x1={readyX} x2={readyX} y1={Y(TARGET)} y2={padT + ph} stroke="var(--proj-ready-marker)" strokeWidth="1.5" />
              <circle cx={readyX} cy={Y(TARGET)} r="5" fill="var(--proj-ready-marker)" stroke="var(--bg-surface)" strokeWidth="2" />
            </g>
          )}
          {[0, 4, 8, 12, 16].map((t) => (
            <text key={t} x={Math.max(padL + 6, Math.min(w - padR - 6, X(t)))} y={H - 6} textAnchor={t === 0 ? 'start' : t === 16 ? 'end' : 'middle'} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-num)">{t === 0 ? 'nu' : `+${t}w`}</text>
          ))}
        </svg>
      </div>
    );
  }

  // custom drag-slider (uren/week)
  function HoursSlider({ value, min, max, step, onChange }) {
    const ref = useRef(null);
    const set = (clientX) => {
      const r = ref.current.getBoundingClientRect();
      let p = (clientX - r.left) / r.width; p = Math.max(0, Math.min(1, p));
      const raw = min + p * (max - min);
      onChange(Math.round(raw / step) * step);
    };
    const down = (e) => {
      e.preventDefault();
      const mv = (ev) => set((ev.touches ? ev.touches[0] : ev).clientX);
      mv(e.nativeEvent);
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    };
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div ref={ref} onPointerDown={down} style={{ position: 'relative', height: 26, cursor: 'pointer', touchAction: 'none', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--slider-track)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--slider-fill)', borderRadius: 999 }} />
        </div>
        <div style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: 999, background: 'var(--slider-thumb)', border: '3px solid var(--bg-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }} />
      </div>
    );
  }

  function GapRow({ label, sub, cur, doel, unit, ontrack }) {
    const col = ontrack ? 'var(--goal-ontrack)' : 'var(--goal-gap)';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <NvNum size={15} weight={600} color="var(--text-primary)">{cur}</NvNum>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>/ {doel} {unit}</span>
        </div>
        <span style={{ flexShrink: 0, width: 76, textAlign: 'right', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: col }}>
          {ontrack ? '✓ op koers' : 'nog te gaan'}
        </span>
      </div>
    );
  }

  function DoelProjectie({ state }) {
    const [hours, setHours] = useState(8);
    const [assumOpen, setAssumOpen] = useState(false);
    const wk = weeksToTarget(hours);
    const wkNow = weeksToTarget(8);
    const band = ftpBand(hours);
    const haalbaar = wk != null;
    const sooner = (() => {
      const a = weeksToTarget(hours), b = weeksToTarget(hours + 2);
      if (a == null || b == null) return null;
      return Math.max(0, Math.round(a - b));
    })();

    if (state === 'leeg') {
      return (
        <NvCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <NvOver>Doel-gereedheid · Girona</NvOver><SoonTag>Visie</SoonTag>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 12px 14px', lineHeight: 1.55 }}>Stel je Girona-doel in en verbind je historie — dan projecteren we je gereedheid.</div>
        </NvCard>
      );
    }

    return (
      <NvCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <NvOver>Doel-gereedheid · Girona</NvOver>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>~90 km · 1200 hm/dag · lange klimmen</div>
          </div>
          <SoonTag>Visie</SoonTag>
        </div>

        {/* doel-gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
          <GapRow label="Klimvermogen" sub="W/kg · 20 min" cur="3,8" doel="3,6" unit="" ontrack />
          <GapRow label="Duurvermogen" sub="fitheid · CTL" cur="65" doel="72" unit="" />
          <GapRow label="Lange-rit" sub="langste recente rit" cur="3u10" doel="4u" unit="" />
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--goal-ontrack-soft)', border: '1px solid color-mix(in srgb, var(--good) 30%, transparent)', borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--good)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>Klimvermogen is op koers — <strong style={{ color: 'var(--text-primary)' }}>duurvermogen</strong> is je laatste stap.</span>
        </div>

        {/* what-if: uren → potentieel */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <NvOver color="var(--text-secondary)">Uren → potentieel</NvOver>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <NvNum size={18} weight={600} color="var(--accent)">{hours}</NvNum>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>u/week</span>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <HoursSlider value={hours} min={4} max={14} step={1} onChange={setHours} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-num)', fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1 }}>
              <span>4u</span><span>14u</span>
            </div>
          </div>

          {/* SOLIDE fitheid-projectie (berekend uit volume) */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--proj-solid)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Fitheid-projectie</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>· berekend uit volume</span>
            </div>
            <ProjectionChart hours={hours} />
          </div>

          {/* readout */}
          <div style={{ marginTop: 10, background: haalbaar ? 'var(--bg-sunken)' : 'var(--warn-soft)', border: `1px solid ${haalbaar ? 'var(--border-subtle)' : 'color-mix(in srgb, var(--warn) 35%, transparent)'}`, borderRadius: 'var(--r-md)', padding: '11px 13px' }}>
            {haalbaar ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>Duurdoel bereikt over</span>
                <NvNum size={20} weight={600} color="var(--good)">~{Math.round(wk)}</NvNum>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>weken</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-num)', fontSize: 14, color: 'var(--warn)', lineHeight: 1.3 }}>!</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Bij <strong style={{ color: 'var(--text-primary)' }}>{hours}u/week</strong> blijft je fitheid-plafond onder je duurdoel — Girona-klaar is zo niet haalbaar. Verhoog het volume.</span>
              </div>
            )}
            {haalbaar && sooner > 0 && (
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>+2u/week ≈ <strong style={{ color: 'var(--accent)' }}>{sooner} {sooner === 1 ? 'week' : 'weken'}</strong> eerder klaar.</div>
            )}
          </div>

          {/* SPECULATIEVE FTP/W-kg-band — visueel onderscheiden, gelabeld "schatting" */}
          <div style={{ marginTop: 10, border: '1px solid var(--proj-band-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px 7px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Geschat FTP-effect</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--proj-estimate-text)' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1L1 10.5h10L6 1z" stroke="var(--info)" strokeWidth="1.1" strokeLinejoin="round" /><path d="M6 5v2.4" stroke="var(--info)" strokeWidth="1.1" strokeLinecap="round" /><circle cx="6" cy="8.8" r="0.6" fill="var(--info)" /></svg>
                schatting
              </span>
            </div>
            {/* gestreepte band = onzeker */}
            <div style={{ position: 'relative', height: 34, margin: '0 12px', background: 'var(--proj-band-fill)', borderRadius: 'var(--r-sm)', overflow: 'hidden', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, var(--proj-band-hatch) 5px, var(--proj-band-hatch) 6px)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <NvNum size={17} weight={600} color="var(--info)">{band.lo}</NvNum>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--info)' }}>–</span>
                <NvNum size={17} weight={600} color="var(--info)">{band.hi}</NvNum>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--info)', marginLeft: 2 }}>W over 12 wk</span>
              </div>
            </div>
            <button onClick={() => setAssumOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 9px', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
              Aannames {assumOpen ? 'verbergen' : 'tonen'}
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ transform: assumOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M3 5l4 4 4-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {assumOpen && (
              <div style={{ padding: '0 12px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {['2 sleutelsessies per week, consequent', 'Regelmaat ≥ 90% — geen lange onderbrekingen', 'Herstel & voeding op orde', 'FTP-winst vlakt af naarmate je je plafond nadert'].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--text-muted)', marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </NvCard>
    );
  }

  /* ═══════════════════ NIVEAU-TAB ═══════════════════ */
  function NiveauTab({ dataState = 'normaal' }) {
    const state = dataState === 'eerste keer' || dataState === 'lege week' || dataState === 'leeg' ? 'leeg'
      : dataState === 'laden' ? 'laden' : 'normaal';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <VermogenSnapshot state={state} />
        <ProgressieCard state={state} />
        <Rijdersprofiel />
        <DoelProjectie state={state} />
      </div>
    );
  }

  /* compacte Vorm-samenvatting (Variant A) — vervangt de diepe grafiek op Vorm */
  function VormLevelSummary({ onOpenNiveau }) {
    return (
      <button onClick={onOpenNiveau} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <NvOver>Progressie</NvOver>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 7 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <NvNum size={26} weight={600}>3,8</NvNum>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>W/kg</span>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>· Gevorderd · 275 W</span>
            <NvNum size={11} weight={600} color="var(--good)">+0,2 ↑</NvNum>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
          Progressie
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </button>
    );
  }

  Object.assign(window, { NiveauTab, VormLevelSummary });
})();
