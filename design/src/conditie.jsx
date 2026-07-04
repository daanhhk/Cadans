// conditie.jsx — drie visualisaties van de conditie-balans (CTL · ATL · TSB)
// Exports to window: ConditieDriehoek, ConditieBalans, ConditiePMC
(function () {
  const { useState, useEffect, useRef, useMemo } = React;

  /* lokale helpers (eigen scope) */
  function useWidth() {
    const ref = useRef(null);
    const [w, setW] = useState(326);
    useEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
      ro.observe(ref.current); setW(ref.current.clientWidth);
      return () => ro.disconnect();
    }, []);
    return [ref, w];
  }
  const Over = ({ children, color = 'var(--text-muted)', style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style }}>{children}</div>
  );
  const N = ({ children, size = 24, weight = 600, color = 'var(--text-primary)', style }) => (
    <span style={{ fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', fontSize: size, fontWeight: weight, color, lineHeight: 1, letterSpacing: '-0.01em', ...style }}>{children}</span>
  );

  /* ───────── A · DRIEHOEK ───────── */
  function ConditieDriehoek() {
    const [ref, w] = useWidth();
    const H = 172;
    const top = { x: w / 2, y: 38 }, bl = { x: 58, y: 140 }, br = { x: w - 58, y: 140 };
    const Node = ({ x, y, value, vColor, label, sub, subColor, hi }) => (
      <div style={{
        position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)',
        width: 104, textAlign: 'center',
        background: hi ? 'var(--fresh-soft)' : 'var(--bg-elevated)',
        border: `1px solid ${hi ? 'rgba(61,165,240,0.45)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--r-md)', padding: '9px 6px',
      }}>
        <N size={24} color={vColor}>{value}</N>
        <Over style={{ marginTop: 5 }}>{label}</Over>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: subColor, marginTop: 3 }}>{sub}</div>
      </div>
    );
    return (
      <div ref={ref} style={{ position: 'relative', width: '100%', height: H, marginTop: 4 }}>
        <svg width={w} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M${top.x} ${top.y} L${bl.x} ${bl.y} L${br.x} ${br.y} Z`} fill="none" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="3 4" />
        </svg>
        <Node {...top} value="+7" vColor="var(--fresh)" label="Vorm · TSB" sub="Fris" subColor="var(--fresh)" hi />
        <Node {...bl} value="65" vColor="var(--text-primary)" label="Fitheid · CTL" sub="opbouwend" subColor="var(--text-muted)" />
        <Node {...br} value="58" vColor="var(--text-primary)" label="Vermoeidheid · ATL" sub="beheersbaar" subColor="var(--text-muted)" />
      </div>
    );
  }

  /* ───────── B · BALANS-METER ───────── */
  function ConditieBalans() {
    const min = -30, max = 25, tsb = 7;
    const pct = (v) => ((v - min) / (max - min)) * 100;
    const redW = pct(-10) - pct(min), amberW = pct(5) - pct(-10), greenW = pct(max) - pct(5);
    const mark = pct(tsb), zero = pct(0);

    const Bar = ({ label, value, max: mx, fill }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 96, flexShrink: 0 }}>
          <Over>{label.o}</Over>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label.s}</div>
        </div>
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(value / mx) * 100}%`, borderRadius: 999, background: fill }} />
        </div>
        <N size={16} weight={600} style={{ width: 26, textAlign: 'right' }}>{value}</N>
      </div>
    );

    return (
      <div style={{ marginTop: 12 }}>
        {/* headline */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <N size={30} color="var(--fresh)">+7</N>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--fresh-soft)', color: 'var(--fresh)', border: '1px solid rgba(61,165,240,0.45)', borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fresh)' }} />Fris
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>TSB · vorm-saldo</span>
        </div>

        {/* gauge */}
        <div style={{ position: 'relative', marginTop: 20, marginBottom: 6 }}>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${redW}%`, background: 'var(--bad-soft)' }} />
            <div style={{ width: `${amberW}%`, background: 'var(--good-soft)' }} />
            <div style={{ width: `${greenW}%`, background: 'var(--fresh-soft)' }} />
          </div>
          {/* nul-tick */}
          <div style={{ position: 'absolute', top: -3, left: `${zero}%`, width: 1, height: 16, background: 'var(--border-strong)' }} />
          {/* marker */}
          <div style={{ position: 'absolute', top: -7, left: `${mark}%`, transform: 'translateX(-50%)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: 'var(--fresh)', border: '3px solid var(--bg-surface)', boxShadow: '0 0 0 1px var(--fresh)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>oververmoeid</span><span>productief</span><span>fris</span>
        </div>

        {/* bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          <Bar label={{ o: 'Fitheid', s: 'CTL' }} value={65} max={80} fill="var(--text-secondary)" />
          <Bar label={{ o: 'Vermoeidheid', s: 'ATL' }} value={58} max={80} fill="var(--warn)" />
        </div>
      </div>
    );
  }

  /* ───────── C · PMC-MINI ───────── */
  const CTL = [56, 57, 58, 59, 60, 61, 62, 63, 63, 64, 65, 65];
  const ATL = [60, 52, 64, 58, 70, 55, 66, 52, 63, 57, 64, 58];
  function ConditiePMC() {
    const [ref, w] = useWidth();
    const H = 150, padT = 14, padB = 22, padL = 4, padR = 40;
    const all = CTL.concat(ATL);
    const lo = Math.min(...all) - 3, hi = Math.max(...all) + 3;
    const pw = w - padL - padR, ph = H - padT - padB;
    const x = (i) => padL + (i / (CTL.length - 1)) * pw;
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * ph;
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const eC = { x: x(CTL.length - 1), y: y(CTL[CTL.length - 1]) };
    const eA = { x: x(ATL.length - 1), y: y(ATL[ATL.length - 1]) };

    const Leg = ({ c, o, s, v }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 9, height: 3, borderRadius: 2, background: c }} />
        <Over color="var(--text-muted)">{o}</Over>
        <N size={13} weight={600} color={s}>{v}</N>
      </div>
    );

    return (
      <div ref={ref} style={{ width: '100%', marginTop: 8 }}>
        <svg width={w} height={H} style={{ display: 'block', overflow: 'visible' }}>
          {[lo + (hi - lo) * 0.5].map((v, i) => (
            <line key={i} x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
          ))}
          {/* vorm-kloof aan het einde */}
          <line x1={eC.x} x2={eC.x} y1={eC.y} y2={eA.y} stroke="var(--fresh)" strokeWidth="2" />
          <path d={path(ATL)} fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 3" opacity="0.85" />
          <path d={path(CTL)} fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx={eA.x} cy={eA.y} r="3.5" fill="var(--warn)" />
          <circle cx={eC.x} cy={eC.y} r="3.5" fill="var(--text-primary)" />
          {/* vorm-badge */}
          <g transform={`translate(${eC.x + 8}, ${(eC.y + eA.y) / 2})`}>
            <rect x="0" y="-10" width="34" height="20" rx="5" fill="var(--fresh-soft)" stroke="rgba(61,165,240,0.5)" />
            <text x="17" y="4" textAnchor="middle" fontFamily="var(--font-num)" fontSize="12" fontWeight="600" fill="var(--fresh)">+7</text>
          </g>
          <text x={padL} y={H - 6} fill="var(--chart-axis)" fontSize="10" fontFamily="var(--font-num)">12 wk</text>
          <text x={w - padR} y={H - 6} textAnchor="end" fill="var(--chart-axis)" fontSize="10" fontFamily="var(--font-num)">nu</text>
        </svg>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
          <Leg c="var(--text-secondary)" o="Fitheid" s="var(--text-primary)" v="65" />
          <Leg c="var(--warn)" o="Vermoeidheid" s="var(--text-primary)" v="58" />
          <Leg c="var(--fresh)" o="Vorm" s="var(--fresh)" v="+7" />
        </div>
      </div>
    );
  }

  Object.assign(window, { ConditieDriehoek, ConditieBalans, ConditiePMC });
})();
