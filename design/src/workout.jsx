// workout.jsx — gedeelde workout-primitieven, varianten-engine, bibliotheek + picker
// Exports to window: ZNAME, FTP, watt, fmtDur, ZoneBar, ZoneLegend, MiniZoneBar,
//   BlockList, WorkoutDetail, CategoryCard, VariantRow, DurationSlider,
//   WORKOUT_CATS, buildWorkout, WorkoutPicker
(function () {
  const { useState } = React;

  /* ── basis ── */
  const ZNAME = { 1: 'Herstel', 2: 'Duur', 3: 'Tempo', 4: 'Drempel', 5: 'VO2max', 6: 'Anaeroob' };
  const FTP = 275; // referentie voor doel-vermogen (uit Instellingen)
  const watt = (pct) => Math.round((pct / 100) * FTP / 5) * 5;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmtDur = (m) => {
    m = Math.round(m);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h}u ${r}` : `${h}u`;
  };
  const fmtBlk = (m) => (m < 1 ? `${Math.round(m * 60)} s` : `${Math.round(m)} min`);

  const Num = ({ children, size = 22, weight = 600, color = 'var(--text-primary)', style }) => (
    <span style={{ fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', fontSize: size, fontWeight: weight, color, lineHeight: 1, letterSpacing: '-0.01em', ...style }}>{children}</span>
  );
  const Over = ({ children, color = 'var(--text-muted)', style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style }}>{children}</div>
  );
  const Chevron = ({ dir = 'right', color = 'var(--text-muted)', size = 13 }) => {
    const d = { right: 'M5 2l5 5-5 5', left: 'M9 2L4 7l5 5', down: 'M3 5l4 4 4-4' }[dir];
    return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  };

  /* ── structuur-helpers + expand ── */
  const warm = (m, lo = 55, hi = 65, z = 2) => ({ type: 'block', label: 'Warming-up', z, m, lo, hi });
  const cool = (m, lo = 50, hi = 50, z = 1) => ({ type: 'block', label: 'Cooling-down', z, m, lo, hi });
  const steady = (label, z, m, lo, hi) => ({ type: 'block', label, z, m, lo, hi });
  const setp = (label, reps, z, m, lo, hi, offM, tailOff = true) => ({ type: 'set', label, reps, z, m, lo, hi, offM, tailOff });

  function expand(structure) {
    const segs = [], blocks = [];
    for (const p of structure) {
      if (p.type === 'set') {
        const onP = (p.lo + p.hi) / 2;
        for (let i = 0; i < p.reps; i++) {
          segs.push({ z: p.z, m: p.m, p: onP });
          if (i < p.reps - 1 || p.tailOff) segs.push({ z: 1, m: p.offM, p: 50 });
        }
        const recCount = p.tailOff ? p.reps : p.reps - 1;
        blocks.push({ label: p.label, reps: p.reps, dur: p.m, z: p.z, lo: p.lo, hi: p.hi });
        if (recCount > 0) blocks.push({ label: 'Herstel', reps: recCount, dur: p.offM, z: 1, lo: 50, hi: 50 });
      } else {
        segs.push({ z: p.z, m: p.m, p: (p.lo + p.hi) / 2 });
        blocks.push({ label: p.label, dur: p.m, z: p.z, lo: p.lo, hi: p.hi });
      }
    }
    return { segs, blocks, min: segs.reduce((a, s) => a + s.m, 0) };
  }

  // IF ≈ NP/FTP; piek-intensiteit gecapt op 150% om 30s-smoothing van korte pieken na te bootsen
  function computeIF(segs) {
    let num = 0, tot = 0;
    for (const s of segs) { const p = Math.min(1.5, s.p / 100); num += s.m * Math.pow(p, 4); tot += s.m; }
    return tot ? Math.pow(num / tot, 0.25) : 0;
  }
  function phasesMin(phases) {
    let m = 0;
    for (const p of phases) m += (p.type === 'set') ? p.reps * p.m + (p.tailOff ? p.reps : p.reps - 1) * p.offM : p.m;
    return m;
  }
  const z2 = (m) => steady('Endurance', 2, m, 65, 75);

  /* ── varianten → schaalbare workout ── */
  // begrensde key-set (vaste dosis); de duur-slider voegt Z2 toe RONDOM de kern, niet meer harde reps
  function buildStructure(v, D) {
    if (v.kind === 'steady') {
      const wM = 12, cM = 12, accent = v.accent ? 12 : 0;
      const main = Math.max(20, D - wM - cM - accent);
      const st = [warm(wM, 50, 60, 1), steady(v.label || 'Duurblok', v.z, main, v.lo, v.hi)];
      if (v.accent) st.push(steady('Tempo-accent', 3, 12, 80, 85));
      st.push(cool(cM));
      return st;
    }
    const wM = 15, cM = 10;
    let key = [];
    if (v.kind === 'intervals') key = [setp('Interval', v.reps, v.z, v.len, v.lo, v.hi, v.off, true)];
    else if (v.kind === 'sprint') key = [setp('Sprint', v.reps, v.z, v.onSec / 60, v.lo, v.hi, v.recMin, true)];
    else if (v.kind === 'micro') {
      for (let s = 0; s < v.sets; s++) {
        key.push(setp(`${v.onSec}/${v.offSec}s`, v.perSet, v.z, v.onSec / 60, v.lo, v.hi, v.offSec / 60, true));
        if (s < v.sets - 1) key.push(steady('Setpauze', 1, v.between, 45, 50));
      }
    }
    const keyMin = phasesMin(key);
    const pad = Math.max(0, Math.round((D - wM - cM - keyMin) / 5) * 5);
    const padA = Math.round(pad / 2 / 5) * 5, padB = pad - padA;
    const st = [warm(wM)];
    if (padA > 0) st.push(z2(padA));
    st.push(...key);
    if (padB > 0) st.push(z2(padB));
    st.push(cool(cM));
    return st;
  }
  function buildWorkout(v, D) {
    const { segs, blocks, min } = expand(buildStructure(v, D));
    const iffNum = computeIF(segs);
    const iff = iffNum.toFixed(2).replace('.', ',');
    const tss = Math.round(iffNum * iffNum * (min / 60) * 100);
    let naam;
    if (v.kind === 'steady') naam = v.label;
    else if (v.kind === 'micro') naam = `${v.sets}×${v.perSet} ${v.onSec}/${v.offSec}s`;
    else if (v.kind === 'sprint') naam = `${v.reps}× ${v.onSec}s sprint`;
    else naam = `${v.reps}×${v.len}min @${v.pct}%`;
    return { id: v.id, naam, zone: v.z, catZone: v.z, iff, tss, segs, blocks, min, inPlan: v.inPlan, micro: v.kind === 'micro' };
  }

  /* ── bibliotheek: categorieën met varianten ── */
  const WORKOUT_CATS = [
    { key: 'herstel', naam: 'Herstel', zone: 1, desc: 'Actief herstel, heel rustig', def: 60, variants: [
      { id: 'h-rust', kind: 'steady', z: 1, lo: 50, hi: 60, inPlan: true, label: 'Hersteltrit' },
      { id: 'h-koffie', kind: 'steady', z: 1, lo: 52, hi: 62, inPlan: false, label: 'Koffierit' },
    ] },
    { key: 'duur', naam: 'Duurvermogen', zone: 2, desc: 'Aerobe basis · lange rustige ritten', def: 120, variants: [
      { id: 'd-vlak', kind: 'steady', z: 2, lo: 65, hi: 75, inPlan: true, label: 'Z2 duurrit' },
      { id: 'd-tempo', kind: 'steady', accent: true, z: 2, lo: 65, hi: 75, inPlan: true, label: 'Z2 + tempo-finale' },
      { id: 'd-rit', kind: 'steady', z: 2, lo: 68, hi: 76, inPlan: false, label: 'Vaste-ritme rit' },
    ] },
    { key: 'tempo', naam: 'Tempo', zone: 3, desc: 'Stevig aeroob · comfortabel-hard', def: 90, variants: [
      { id: 't-20', kind: 'intervals', reps: 2, len: 20, pct: 83, lo: 80, hi: 85, off: 5, z: 3, inPlan: true },
      { id: 't-15', kind: 'intervals', reps: 3, len: 15, pct: 84, lo: 81, hi: 86, off: 4, z: 3, inPlan: false },
    ] },
    { key: 'sweetspot', naam: 'Sweet Spot', zone: 4, desc: 'Veel prikkel · beheersbare vermoeidheid', def: 90, variants: [
      { id: 's-15', kind: 'intervals', reps: 3, len: 15, pct: 90, lo: 88, hi: 93, off: 5, z: 4, inPlan: true },
      { id: 's-12', kind: 'intervals', reps: 4, len: 12, pct: 91, lo: 88, hi: 94, off: 4, z: 4, inPlan: true },
    ] },
    { key: 'drempel', naam: 'FTP / Drempel', zone: 4, desc: 'Rond je 1-uurs vermogen', def: 80, variants: [
      { id: 'f-20', kind: 'intervals', reps: 2, len: 20, pct: 98, lo: 95, hi: 100, off: 6, z: 4, inPlan: true },
      { id: 'f-12', kind: 'intervals', reps: 3, len: 12, pct: 100, lo: 98, hi: 103, off: 5, z: 4, inPlan: true },
    ] },
    { key: 'vo2', naam: 'VO2max', zone: 5, desc: 'Korte, felle intervallen', def: 75, variants: [
      { id: 'v-54', kind: 'intervals', reps: 5, len: 4, pct: 110, lo: 108, hi: 112, off: 4, z: 5, inPlan: true },
      { id: 'v-45', kind: 'intervals', reps: 4, len: 5, pct: 108, lo: 106, hi: 110, off: 5, z: 5, inPlan: true },
      { id: 'v-63', kind: 'intervals', reps: 6, len: 3, pct: 112, lo: 110, hi: 115, off: 3, z: 5, inPlan: true },
      { id: 'v-3030', kind: 'micro', sets: 3, perSet: 10, onSec: 30, offSec: 30, lo: 115, hi: 122, between: 5, z: 6, inPlan: false },
      { id: 'v-4020', kind: 'micro', sets: 3, perSet: 10, onSec: 40, offSec: 20, lo: 118, hi: 125, between: 5, z: 6, inPlan: false },
      { id: 'v-spr', kind: 'sprint', reps: 8, onSec: 12, recMin: 2.5, lo: 175, hi: 205, z: 6, inPlan: false },
    ] },
  ];

  /* ── zone-balk + legenda ── */
  function ZoneBar({ segments, height = 124 }) {
    const base = 10;
    const lvl = (z) => base + (z / 6) * (height - base);
    return (
      <div style={{ position: 'relative', height, marginTop: 8 }}>
        {[1, 2, 3, 4, 5, 6].map((z) => (
          <div key={z} style={{ position: 'absolute', left: 0, right: 0, bottom: lvl(z), height: 1, background: 'var(--chart-grid)' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
          {segments.map((s, i) => (
            <div key={i} title={`Z${s.z} ${ZNAME[s.z]} · ${fmtBlk(s.m)}`} style={{ flex: s.m, height: lvl(s.z), minWidth: 1.5, background: `var(--zone-${s.z})`, borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      </div>
    );
  }
  function MiniZoneBar({ segments, height = 30 }) {
    const base = 5;
    const lvl = (z) => base + (z / 6) * (height - base);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, marginTop: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ flex: s.m, height: lvl(s.z), minWidth: 1, background: `var(--zone-${s.z})`, borderRadius: '1.5px 1.5px 0 0' }} />
        ))}
      </div>
    );
  }
  function ZoneLegend({ segments }) {
    const zones = [...new Set(segments.map((s) => s.z))].sort();
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {zones.map((z) => (
          <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: `var(--zone-${z})` }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-secondary)' }}>{ZNAME[z]}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── blok-voor-blok lijst ── */
  function BlockList({ blocks }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {blocks.map((b, i) => {
          const single = b.lo === b.hi;
          const pct = single ? `${b.lo}% FTP` : `${b.lo}–${b.hi}% FTP`;
          const watts = single ? `≈${watt(b.lo)} W` : `≈${watt(b.lo)}–${watt(b.hi)} W`;
          return (
            <div key={i} style={{ display: 'flex', gap: 11, background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
              <span style={{ width: 4, borderRadius: 2, background: `var(--zone-${b.z})`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{b.reps ? `${b.reps}× ` : ''}{b.label}</span>
                  <Num size={12.5} color="var(--text-secondary)">{fmtBlk(b.dur)}</Num>
                </div>
                <div style={{ marginTop: 3, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span style={{ color: `var(--zone-${b.z})`, fontWeight: 600 }}>{ZNAME[b.z]}</span> · {pct} · <span style={{ fontFamily: 'var(--font-num)' }}>{watts}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const PlanBadge = ({ inPlan }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 8px', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
      background: inPlan ? 'var(--accent-soft)' : 'var(--bg-elevated)',
      color: inPlan ? 'var(--accent)' : 'var(--text-muted)',
      border: `1px solid ${inPlan ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border-strong)'}` }}>
      {inPlan ? 'In je blok' : 'Buiten plan'}
    </span>
  );
  const ZoneBadge = ({ z }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
      background: `color-mix(in srgb, var(--zone-${z}) 16%, transparent)`, color: `var(--zone-${z})`, border: `1px solid color-mix(in srgb, var(--zone-${z}) 45%, transparent)` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(--zone-${z})` }} />{ZNAME[z]}
    </span>
  );

  /* ── kaarten / rijen ── */
  function CategoryCard({ cat, onClick }) {
    const c = `var(--zone-${cat.zone})`;
    return (
      <button onClick={onClick} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderRadius: 'var(--r-lg)',
        background: `color-mix(in srgb, ${c} 11%, var(--bg-surface))`, border: `1px solid color-mix(in srgb, ${c} 32%, var(--border-subtle))` }}>
        <span style={{ width: 11, height: 11, borderRadius: 3, background: c, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15.5, fontWeight: 600, color: c }}>{cat.naam}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{cat.desc}</div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11.5, flexShrink: 0 }}>
          {cat.variants.length}<Chevron />
        </span>
      </button>
    );
  }
  function VariantRow({ wo, onClick }) {
    return (
      <button onClick={onClick} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '13px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{wo.naam}</span>
          <PlanBadge inPlan={wo.inPlan} />
        </div>
        <MiniZoneBar segments={wo.segs} />
        <div style={{ marginTop: 9, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>
          <Num size={12.5} weight={600}>{fmtDur(wo.min)}</Num><span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span><span style={{ color: 'var(--text-muted)' }}>IF</span> <Num size={12.5} weight={600}>{wo.iff}</Num><span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span><span style={{ color: 'var(--text-muted)' }}>TSS</span> <Num size={12.5} weight={600}>{wo.tss}</Num>
        </div>
      </button>
    );
  }

  function DurationSlider({ value, onChange, min = 45, max = 240 }) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Over>Duur-budget · vult aan met Z2, niet meer reps</Over>
          <Num size={14} weight={600} color="var(--accent)">{fmtDur(value)}</Num>
        </div>
        <input type="range" min={min} max={max} step={15} value={value} onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>45 min</span><span>4 u</span>
        </div>
      </div>
    );
  }

  function WorkoutDetail({ wo, overline, onAction, actionLabel = 'Inplannen', onRevert }) {
    const [done, setDone] = useState(false);
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          {typeof overline === 'string' ? <Over>{overline}</Over> : overline}
          <ZoneBadge z={wo.catZone} />
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 8 }}>{wo.naam}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          <Num size={14} weight={600}>{fmtDur(wo.min)}</Num><span style={{ color: 'var(--text-muted)', margin: '0 7px' }}>·</span><span style={{ color: 'var(--text-muted)' }}>IF</span> <Num size={14} weight={600}>{wo.iff}</Num><span style={{ color: 'var(--text-muted)', margin: '0 7px' }}>·</span><span style={{ color: 'var(--text-muted)' }}>TSS</span> <Num size={14} weight={600}>{wo.tss}</Num>
        </div>
        <ZoneBar segments={wo.segs} />
        <ZoneLegend segments={wo.segs} />
        <div style={{ marginTop: 14 }}><BlockList blocks={wo.blocks} /></div>
        {onAction && (
          <button onClick={() => { setDone(true); onAction(wo); }} disabled={done} style={{ marginTop: 16, width: '100%', height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', border: 'none', cursor: done ? 'default' : 'pointer',
            background: done ? 'var(--good-soft)' : 'var(--accent-grad)', color: done ? 'var(--good)' : '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600 }}>
            {done ? '✓ Ingepland' : actionLabel}
          </button>
        )}
        {onRevert && (
          <button onClick={onRevert} style={{ marginTop: 10, width: '100%', height: 38, borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
            Terug naar voorstel
          </button>
        )}
      </div>
    );
  }

  /* ── picker (voor "Doe iets anders") ── */
  function WorkoutPicker({ onPick, onClose }) {
    const [route, setRoute] = useState('home');
    const [cat, setCat] = useState(null);
    const [target, setTarget] = useState(75);
    const [freeKind, setFreeKind] = useState('vrij');
    const [freeMin, setFreeMin] = useState(90);
    const [freeInt, setFreeInt] = useState('tempo');
    const back = () => { if (route === 'vars') setRoute('cats'); else if (route === 'cats' || route === 'free') setRoute('home'); else onClose(); };
    const Seg = ({ value, options, onChange }) => (
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', padding: 3 }}>
        {options.map(([k, l]) => (
          <button key={k} onClick={() => onChange(k)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '7px 0', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600,
            background: value === k ? 'var(--bg-elevated)' : 'transparent', color: value === k ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: value === k ? '0 1px 3px rgba(0,0,0,0.4)' : 'none' }}>{l}</button>
        ))}
      </div>
    );
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={back} aria-label="Terug" style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Chevron dir="left" color="var(--text-secondary)" /></button>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {route === 'home' ? 'Kies iets anders' : route === 'free' ? 'Vrije / groepsrit' : cat ? cat.naam : 'Uit bibliotheek'}
          </div>
        </div>

        {route === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['cats', 'Uit bibliotheek', 'Kies een categorie en variant'], ['free', 'Vrije / groepsrit', 'Alleen duur + intensiteit, geen structuur']].map(([r, t, s]) => (
              <button key={r} onClick={() => setRoute(r)} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s}</div></div>
                <Chevron />
              </button>
            ))}
          </div>
        )}
        {route === 'cats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WORKOUT_CATS.map((c) => <CategoryCard key={c.key} cat={c} onClick={() => { setCat(c); setTarget(c.def); setRoute('vars'); }} />)}
          </div>
        )}
        {route === 'vars' && cat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DurationSlider value={target} onChange={setTarget} />
            {cat.variants.map((v) => { const w = buildWorkout(v, target); return <VariantRow key={v.id} wo={w} onClick={() => onPick({ type: 'library', wo: w })} />; })}
          </div>
        )}
        {route === 'free' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Seg value={freeKind} options={[['vrij', 'Vrije rit'], ['groep', 'Groepsrit']]} onChange={setFreeKind} />
            <DurationSlider value={freeMin} onChange={setFreeMin} />
            <div><Over style={{ marginBottom: 8 }}>Globale intensiteit</Over><Seg value={freeInt} options={[['rustig', 'Rustig'], ['tempo', 'Tempo'], ['stevig', 'Stevig']]} onChange={setFreeInt} /></div>
            <button onClick={() => onPick({ type: 'free', kind: freeKind, min: freeMin, intensity: freeInt })} style={{ width: '100%', height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', border: 'none', cursor: 'pointer', background: 'var(--accent-grad)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600 }}>Kies deze rit</button>
          </div>
        )}
      </div>
    );
  }

  /* ── rand- / lege staten ── */
  function ConnectState({ onConnect }) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 999, background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9.5 14.5l5-5" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" /><path d="M8 11l-1.8 1.8a2.8 2.8 0 004 4L12 15" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" /><path d="M16 13l1.8-1.8a2.8 2.8 0 00-4-4L12 9" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 4l16 16" stroke="var(--bad)" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 14 }}>Verbind intervals.icu</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>Vorm en schema gebruiken je trainingsdata. Koppel je account om te beginnen.</div>
        <button onClick={onConnect} style={{ marginTop: 18, height: 'var(--btn-height)', padding: '0 20px', borderRadius: 'var(--btn-radius)', border: 'none', background: 'var(--accent-grad)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600 }}>Verbinden in Instellingen</button>
      </div>
    );
  }
  function SyncBanner({ onRetry }) {
    const [busy, setBusy] = useState(false);
    const go = () => { setBusy(true); setTimeout(() => { setBusy(false); onRetry && onRetry(); }, 1200); };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bad-soft)', border: '1px solid color-mix(in srgb, var(--bad) 40%, transparent)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6.3" stroke="var(--bad)" strokeWidth="1.4" /><path d="M8 4.6v4M8 10.8v.05" stroke="var(--bad)" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--bad)' }}>Synchroniseren met intervals.icu mislukt</span>
        <button onClick={go} disabled={busy} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 'var(--r-pill)', border: '1px solid color-mix(in srgb, var(--bad) 45%, transparent)', background: 'transparent', cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--bad)', display: 'flex', alignItems: 'center', gap: 6 }}>{busy && <span className="gm-spin" style={{ borderColor: 'var(--bad)', borderTopColor: 'transparent' }} />}{busy ? 'Bezig…' : 'Opnieuw proberen'}</button>
      </div>
    );
  }
  function EmptyState({ title, text, actionLabel, onAction }) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', padding: '26px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>{text}</div>
        {actionLabel && <button onClick={onAction} style={{ marginTop: 16, height: 40, padding: '0 18px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{actionLabel}</button>}
      </div>
    );
  }
  function EmptyChart() {
    return (
      <div style={{ position: 'relative', height: 150, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px dashed var(--border-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none"><path d="M2 30 Q30 28 60 22 T118 12" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>Nog geen data — verschijnt na je eerste ritten</span>
      </div>
    );
  }

  Object.assign(window, { ZNAME, FTP, watt, fmtDur, fmtBlk, ZoneBar, MiniZoneBar, ZoneLegend, BlockList, WorkoutDetail, CategoryCard, VariantRow, DurationSlider, WORKOUT_CATS, buildWorkout, WorkoutPicker, ZoneBadge, PlanBadge, ConnectState, SyncBanner, EmptyState, EmptyChart });
})();
