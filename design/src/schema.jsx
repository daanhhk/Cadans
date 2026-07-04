// schema.jsx — Schema-tab: dag-strip + dag-detail (voorstel / voltooid / rustdag)
// Export to window: SchemaTab
(function () {
  const { useState, useRef, useEffect, useMemo } = React;
  const { ZNAME, ZoneBar, ZoneLegend, BlockList, WorkoutDetail, WorkoutPicker, ZoneBadge, MiniZoneBar, fmtDur, ConnectState, SyncBanner, EmptyState } = window;

  /* ── helpers ── */
  const Over = ({ children, color = 'var(--text-muted)', style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style }}>{children}</div>
  );
  const Num = ({ children, size = 22, weight = 600, color = 'var(--text-primary)', style }) => (
    <span style={{ fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', fontSize: size, fontWeight: weight, color, lineHeight: 1, letterSpacing: '-0.01em', ...style }}>{children}</span>
  );
  const WD = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  /* ── segment-sets (zone, minuten) ── */
  const rep = (n, arr) => Array.from({ length: n }, () => arr).flat();
  const SEG_VO2 = [
    { z: 1, m: 8 }, { z: 2, m: 12 },
    { z: 5, m: 4 }, { z: 1, m: 5 }, { z: 5, m: 4 }, { z: 1, m: 5 }, { z: 5, m: 4 }, { z: 1, m: 5 }, { z: 5, m: 4 }, { z: 1, m: 5 }, { z: 5, m: 4 },
    { z: 2, m: 8 }, { z: 1, m: 7 },
  ];
  const SEG_THRESH = [{ z: 1, m: 8 }, { z: 2, m: 10 }, { z: 4, m: 20 }, { z: 1, m: 6 }, { z: 4, m: 20 }, { z: 2, m: 8 }, { z: 1, m: 8 }];
  const SEG_ENDUR = [{ z: 1, m: 12 }, { z: 2, m: 110 }, { z: 3, m: 12 }, { z: 2, m: 34 }, { z: 1, m: 12 }];
  const SEG_SS = [{ z: 1, m: 8 }, { z: 2, m: 9 }, { z: 4, m: 15 }, { z: 1, m: 5 }, { z: 4, m: 15 }, { z: 1, m: 5 }, { z: 4, m: 15 }, { z: 2, m: 7 }, { z: 1, m: 11 }];
  const SEG_VO2B = [{ z: 1, m: 6 }, { z: 2, m: 12 }, ...rep(7, [{ z: 5, m: 2 }, { z: 1, m: 2 }]), { z: 5, m: 2 }, { z: 2, m: 6 }, { z: 1, m: 6 }];

  /* ── blok-structuur (label, reps, duur, zone, %FTP-bereik) ── */
  const BLK_VO2 = [
    { label: 'Warming-up', dur: 15, z: 2, lo: 55, hi: 65 },
    { label: 'Interval', reps: 5, dur: 4, z: 5, lo: 110, hi: 115 },
    { label: 'Herstel', reps: 5, dur: 4, z: 1, lo: 50, hi: 50 },
    { label: 'Cooling-down', dur: 10, z: 1, lo: 50, hi: 50 },
  ];
  const BLK_THRESH = [
    { label: 'Warming-up', dur: 18, z: 2, lo: 55, hi: 65 },
    { label: 'Interval', reps: 2, dur: 20, z: 4, lo: 95, hi: 100 },
    { label: 'Herstel', reps: 1, dur: 6, z: 1, lo: 50, hi: 50 },
    { label: 'Cooling-down', dur: 8, z: 1, lo: 50, hi: 50 },
  ];
  const BLK_ENDUR = [
    { label: 'Warming-up', dur: 12, z: 1, lo: 50, hi: 55 },
    { label: 'Duurblok', dur: 144, z: 2, lo: 65, hi: 75 },
    { label: 'Tempo-accent', dur: 12, z: 3, lo: 80, hi: 85 },
    { label: 'Uitrijden', dur: 12, z: 1, lo: 50, hi: 50 },
  ];
  const BLK_SS = [
    { label: 'Warming-up', dur: 17, z: 2, lo: 55, hi: 65 },
    { label: 'Sweet Spot', reps: 3, dur: 15, z: 4, lo: 88, hi: 93 },
    { label: 'Herstel', reps: 2, dur: 5, z: 1, lo: 50, hi: 50 },
    { label: 'Cooling-down', dur: 11, z: 1, lo: 50, hi: 50 },
  ];
  const BLK_VO2B = [
    { label: 'Warming-up', dur: 18, z: 2, lo: 55, hi: 65 },
    { label: 'Interval', reps: 8, dur: 2, z: 5, lo: 115, hi: 120 },
    { label: 'Herstel', reps: 7, dur: 2, z: 1, lo: 50, hi: 50 },
    { label: 'Cooling-down', dur: 12, z: 1, lo: 50, hi: 50 },
  ];

  /* ── schema rond 'vandaag' (wo 3 jun 2026) ── */
  const TODAY = new Date(2026, 5, 3);
  const PLAN = [
    { st: 'done', d: { kind: 'done', naam: 'Duurrit Veluwe', min: 120, tss: 78, rpe: 4, iff: '0,68' }, zone: 2 },
    { st: 'rest' },
    { st: 'done', d: { kind: 'done', naam: 'VO2max 6×3min', min: 68, tss: 82, rpe: 8, iff: '0,93' }, zone: 5 },
    { st: 'done', d: { kind: 'done', naam: 'Tempo 2×20min', min: 80, tss: 75, rpe: null, iff: '0,88' }, zone: 3 },
    { st: 'rest' },
    { st: 'done', d: { kind: 'done', naam: 'Haarlem Wegwielrennen', min: 149, tss: 95, rpe: 6, iff: '0,85' }, zone: 6 },
    { st: 'rest' },
    { st: 'rest' },
    { st: 'today', d: { kind: 'proposal', naam: 'Rustige duurrit Z2', min: 75, iff: '0,67', tss: 56, segs: [{ z: 1, m: 10 }, { z: 2, m: 58 }, { z: 1, m: 7 }], blocks: [{ label: 'Inrijden', dur: 10, z: 1, lo: 50, hi: 55 }, { label: 'Duurblok', dur: 58, z: 2, lo: 62, hi: 72 }, { label: 'Uitrijden', dur: 7, z: 1, lo: 50, hi: 50 }], why: 'Je gereedheid is vanochtend laag (54) na de wedstrijd van zondag. Een zware VO2max nu zou alleen meer vermoeidheid stapelen zonder de juiste prikkel. Vandaag rustig Z2 houdt je herstel op gang; de kwaliteit komt donderdag fris terug.' }, zone: 2,
      coach: { gereedheid: 54, status: 'caution', verschovenNaam: 'VO2max 5×4min', verschovenNaar: 'donderdag', regel: 'Je gereedheid is laag (54). Ik heb je VO2max naar donderdag verschoven en vandaag een rustige Z2 neergezet — fris train je de intervallen beter.' } },
    { st: 'planned', d: { kind: 'proposal', naam: 'Drempel 2×20min', min: 80, iff: '0,95', tss: 92, segs: SEG_THRESH, blocks: BLK_THRESH, why: 'Consolideer je FTP met stevige drempelblokken richting de piek voor Girona.' }, zone: 4 },
    { st: 'rest' },
    { st: 'planned', zone: 2, sessions: [
      { label: 'Ochtend', naam: 'Lange duurrit Z2', min: 150, iff: '0,68', tss: 116, zone: 2, segs: [{ z: 1, m: 12 }, { z: 2, m: 126 }, { z: 1, m: 12 }] },
      { label: 'Middag', naam: 'Openingssprints 6×12s', min: 50, iff: '0,80', tss: 48, zone: 6, segs: [{ z: 1, m: 8 }, { z: 2, m: 10 }, { z: 6, m: 0.2 }, { z: 1, m: 4 }, { z: 6, m: 0.2 }, { z: 1, m: 4 }, { z: 6, m: 0.2 }, { z: 1, m: 4 }, { z: 6, m: 0.2 }, { z: 1, m: 4 }, { z: 6, m: 0.2 }, { z: 1, m: 4 }, { z: 6, m: 0.2 }, { z: 1, m: 6 }] },
    ] },
    { st: 'planned', d: { kind: 'proposal', naam: 'Sweet Spot 3×15min', min: 90, iff: '0,88', tss: 95, segs: SEG_SS, blocks: BLK_SS, why: 'Veel kwaliteit met beheersbare vermoeidheid: ideaal in de Build-fase.' }, zone: 4 },
    { st: 'rest' },
    { st: 'planned', d: { kind: 'proposal', naam: 'VO2max 8×2min', min: 62, iff: '0,90', tss: 78, segs: SEG_VO2B, blocks: BLK_VO2B, why: 'Korte, scherpe prikkels om de scherpte vast te houden.' }, zone: 5 },
  ];
  const DAYS = PLAN.map((p, i) => {
    const dt = new Date(TODAY); dt.setDate(TODAY.getDate() + (i - 8));
    return { ...p, idx: i, coachRest: p.st === 'rest', date: dt, wd: WD[dt.getDay()], dnum: dt.getDate(), mon: MND[dt.getMonth()] };
  });
  const TODAY_IDX = 8;

  const Dot = ({ between }) => <span style={{ color: 'var(--text-muted)', margin: '0 7px' }}>·</span>;

  /* ── RPE-beoordeling ── */
  function rpeFeedback(iffStr, rpe) {
    const iff = parseFloat(String(iffStr).replace(',', '.'));
    const pWord = iff >= 0.95 ? 'zeer zwaar' : iff >= 0.88 ? 'zwaar' : iff >= 0.80 ? 'stevig' : iff >= 0.70 ? 'gemiddeld' : 'rustig';
    const pLvl = iff >= 0.95 ? 5 : iff >= 0.88 ? 4 : iff >= 0.80 ? 3 : iff >= 0.70 ? 2 : 1;
    const fWord = rpe >= 9 ? 'maximaal' : rpe >= 7 ? 'zwaar' : rpe >= 5 ? 'stevig' : rpe >= 3 ? 'licht' : 'heel licht';
    const fLvl = rpe >= 9 ? 5 : rpe >= 7 ? 4 : rpe >= 5 ? 3 : rpe >= 3 ? 2 : 1;
    const diff = fLvl - pLvl;
    const note = diff === 0 ? 'goed afgestemd' : diff < 0 ? 'lichter dan gepland — goed hersteld' : 'zwaarder dan gepland';
    return { line: `Gepland ${pWord} (IF ${iffStr}) · jij gaf ${rpe} → voelde ${fWord}.`, note, diff };
  }

  function RpeRating({ seed, iff }) {
    const [val, setVal] = useState(seed != null ? seed : null);
    const [confirmed, setConfirmed] = useState(seed != null);
    const fb = (confirmed && val != null && iff) ? rpeFeedback(iff, val) : null;
    return (
      <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Over>RPE · ervaren inspanning</Over>
          {val != null && <Num size={13} color={confirmed ? 'var(--accent)' : 'var(--text-secondary)'}>{val}/10</Num>}
        </div>
        {!confirmed && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Hoe zwaar voelde deze rit?</div>
        )}
        <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const filled = val != null && n <= val;
            const isSel = n === val;
            return (
              <button key={n} onClick={() => { setVal(n); setConfirmed(false); }} style={{
                flex: 1, height: 34, borderRadius: 'var(--r-sm)', cursor: 'pointer', padding: 0,
                border: `1px solid ${isSel ? 'var(--accent)' : filled ? 'transparent' : 'var(--border-strong)'}`,
                background: filled ? 'var(--accent)' : 'var(--bg-sunken)',
                color: filled ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-num)', fontSize: 12, fontWeight: 600, transition: 'all .12s',
                boxShadow: isSel ? '0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
              }}>{n}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>1 · heel licht</span><span>10 · maximaal</span>
        </div>
        {val != null && !confirmed && (
          <button onClick={() => setConfirmed(true)} style={{ marginTop: 12, width: '100%', height: 40, borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', background: 'var(--accent-grad)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600 }}>Vastleggen</button>
        )}
        {fb && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M8 1.5l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13l.8-4.2L2 5.9l4.2-.5L8 1.5z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{fb.line}</span>
          </div>
        )}
      </div>
    );
  }

  /* ── detail-staten ── */
  const PinOverline = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />Handmatig gekozen
    </span>
  );
  function FreeRideCard({ override, onRevert }) {
    const intZone = override.intensity === 'rustig' ? 2 : override.intensity === 'stevig' ? 4 : 3;
    const intLabel = { rustig: 'Rustig', tempo: 'Tempo', stevig: 'Stevig' }[override.intensity];
    const iff = override.intensity === 'rustig' ? '0,65' : override.intensity === 'stevig' ? '0,88' : '0,80';
    const naam = override.kind === 'groep' ? 'Groepsrit' : 'Vrije rit';
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <PinOverline />
          <ZoneBadge z={intZone} />
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{naam}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          <Num size={14} weight={600}>{fmtDur(override.min)}</Num><Dot /><span style={{ color: 'var(--text-muted)' }}>{intLabel}</span><Dot /><span style={{ color: 'var(--text-muted)' }}>≈IF {iff}</span>
        </div>
        <div style={{ height: 22, borderRadius: 6, background: `color-mix(in srgb, var(--zone-${intZone}) 55%, var(--bg-sunken))`, border: `1px solid color-mix(in srgb, var(--zone-${intZone}) 50%, transparent)`, marginTop: 14 }} />
        <div style={{ marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>Vrije rit — geen vaste blokstructuur. Rij op gevoel binnen {intLabel.toLowerCase()}.</div>
        <button onClick={onRevert} style={{ marginTop: 14, width: '100%', height: 38, borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Terug naar voorstel</button>
      </div>
    );
  }
  function OverriddenDetail({ day, override, onRevert }) {
    if (override.type === 'free') return <FreeRideCard override={override} onRevert={onRevert} />;
    return <WorkoutDetail wo={override.wo} overline={<PinOverline />} onRevert={onRevert} />;
  }

  /* ── coach-readiness-banner: de brug Vorm → Schema ──
     Toont op 'vandaag' hoe de ochtend-gereedheid (Vorm) het voorstel heeft
     gestuurd. Eén coach-stem; zelfde callout-taal als de dag-feedback. */
  function CoachReadinessBanner({ coach }) {
    const tone = coach.status === 'rest' ? 'rest' : coach.status === 'caution' ? 'caution' : 'ready';
    const dotColor = tone === 'rest' ? 'var(--readiness-rest)' : tone === 'caution' ? 'var(--readiness-caution)' : 'var(--readiness-ready)';
    const woord = tone === 'rest' ? 'laag' : tone === 'caution' ? 'matig' : 'goed';
    return (
      <div style={{ background: 'var(--coach-bg)', border: '1px solid var(--coach-border)', borderRadius: 'var(--r-md)', padding: '12px 13px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 19, height: 19, borderRadius: 999, background: 'var(--coach-mark-bg)', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.7 3.8 11.4l.6-3.6L1.8 5.3l3.6-.5z" stroke="var(--coach-mark)" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--coach-label)' }}>Coach</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor }} />
            Gereedheid {coach.gereedheid} · {woord}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--coach-text)', marginTop: 9 }}>{coach.regel}</div>
        {coach.verschovenNaam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--coach-divider)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M3 8h8m0 0L8 5m3 3l-3 3" stroke="var(--coach-adapt-icon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="var(--coach-adapt-icon)" strokeWidth="1.2" opacity="0.4" /></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--coach-adapt-label)' }}>Verschoven</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>{coach.verschovenNaam} → {coach.verschovenNaar}</span>
          </div>
        )}
      </div>
    );
  }

  function ProposalDetail({ day, override, setOverride }) {
    const { d } = day;
    const [openWhy, setOpenWhy] = useState(false);
    const [openBlocks, setOpenBlocks] = useState(false);
    const [picking, setPicking] = useState(false);
    const isToday = day.st === 'today';
    if (override) return <OverriddenDetail day={day} override={override} onRevert={() => setOverride(null)} />;
    if (picking) return <WorkoutPicker onClose={() => setPicking(false)} onPick={(o) => { setOverride(o); setPicking(false); }} />;
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
        {isToday && day.coach && <CoachReadinessBanner coach={day.coach} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Over color={isToday ? 'var(--accent)' : 'var(--text-muted)'}>{isToday ? 'Vandaag' : 'Voorstel'} · {day.wd} {day.dnum} {day.mon}</Over>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `color-mix(in srgb, var(--zone-${day.zone}) 16%, transparent)`, color: `var(--zone-${day.zone})`, border: `1px solid color-mix(in srgb, var(--zone-${day.zone}) 45%, transparent)`, borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(--zone-${day.zone})` }} />{ZNAME[day.zone]}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 23, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 8 }}>{d.naam}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          <Num size={14} weight={600}>{d.min}</Num> min<Dot /><span style={{ color: 'var(--text-muted)' }}>IF</span> <Num size={14} weight={600}>{d.iff}</Num><Dot /><span style={{ color: 'var(--text-muted)' }}>TSS</span> <Num size={14} weight={600}>{d.tss}</Num>
        </div>

        {/* zone-balk — tik om de blokstructuur uit te klappen */}
        <div onClick={() => setOpenBlocks((v) => !v)} role="button" aria-expanded={openBlocks} style={{ cursor: 'pointer' }}>
          <ZoneBar segments={d.segs} />
          <ZoneLegend segments={d.segs} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 11 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Blokstructuur</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11 }}>
              {d.blocks.length} blokken
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ transform: openBlocks ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M3 5l4 4 4-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        </div>
        {openBlocks && (
          <div style={{ marginTop: 10 }}><BlockList blocks={d.blocks} /></div>
        )}

        {/* uitklap: waarom deze training */}
        <button onClick={() => setOpenWhy((v) => !v)} style={{
          width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)',
          padding: '11px 13px', cursor: 'pointer', color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
        }}>
          Waarom deze training?
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ transform: openWhy ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <path d="M3 5l4 4 4-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {openWhy && (
          <div style={{ marginTop: 8, padding: '0 2px', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{d.why}</div>
        )}

        <button onClick={() => setPicking(true)} style={{ marginTop: 12, width: '100%', height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', border: '1px solid var(--btn-secondary-border)', background: 'var(--btn-secondary-bg)', cursor: 'pointer', color: 'var(--btn-secondary-text)', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600 }}>Doe iets anders</button>
      </div>
    );
  }

  function DoneDetail({ day }) {
    const { d } = day;
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, opacity: 0.92 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Over>Voltooid · {day.wd} {day.dnum} {day.mon}</Over>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--good)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3.2 3.5L12 3.5" stroke="var(--good)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Gedaan
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginTop: 7 }}>{d.naam}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>
          <Num size={13.5} weight={600}>{d.min}</Num> min<Dot /><span style={{ color: 'var(--text-muted)' }}>TSS</span> <Num size={13.5} weight={600}>{d.tss}</Num>
        </div>
        <RpeRating key={day.idx} seed={d.rpe} iff={d.iff} />
      </div>
    );
  }

  function RecoveryCard({ day, onToch }) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '22px 16px', textAlign: 'center' }}>
        <Over style={{ color: 'var(--text-muted)' }}>Rustdag · {day.wd} {day.dnum} {day.mon}</Over>
        <div style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-sunken)', margin: '14px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14.5 10.2A6 6 0 016.8 3.5a6 6 0 107.7 6.7z" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>Van herstel word je beter — vandaag geen rit.</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>Je coach adviseert herstel.</div>
        <button onClick={onToch} style={{ marginTop: 16, height: 38, padding: '0 18px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Toch trainen</button>
      </div>
    );
  }
  function UnavailableCard({ day, onToch }) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '22px 16px', textAlign: 'center' }}>
        <Over style={{ color: 'var(--text-muted)' }}>Niet beschikbaar · {day.wd} {day.dnum} {day.mon}</Over>
        <div style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-sunken)', margin: '14px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="var(--text-secondary)" strokeWidth="1.4" /><path d="M2.5 7h13M6 2v3M12 2v3" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>Je hebt aangegeven vandaag niet te trainen.</div>
        <button onClick={onToch} style={{ marginTop: 16, height: 38, padding: '0 18px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--accent-grad)', cursor: 'pointer', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Toch trainen</button>
      </div>
    );
  }

  /* ── dag-strip ── */
  function DayStrip({ sel, setSel }) {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current; if (!c) return;
      const center = () => {
        const chip = c.querySelector(`[data-idx="${TODAY_IDX}"]`);
        if (chip) c.scrollLeft = chip.offsetLeft - c.clientWidth / 2 + chip.offsetWidth / 2;
      };
      requestAnimationFrame(() => requestAnimationFrame(center));
    }, []);
    return (
      <div ref={ref} className="daystrip" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 16px 6px', scrollSnapType: 'x proximity' }}>
        {DAYS.map((day) => {
          const isSel = day.idx === sel;
          const isToday = day.st === 'today';
          const accentEdge = isSel || isToday;
          return (
            <button key={day.idx} data-idx={day.idx} onClick={() => setSel(day.idx)} style={{
              flex: '0 0 auto', scrollSnapAlign: 'center', width: 50, padding: '9px 0 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
              borderRadius: 'var(--r-md)',
              background: isSel ? 'var(--accent-soft)' : 'var(--bg-surface)',
              border: `1.5px solid ${isSel ? 'var(--accent)' : isToday ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'var(--border-subtle)'}`,
              transition: 'all .15s',
            }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: accentEdge ? 'var(--accent)' : 'var(--text-muted)' }}>{day.wd}</span>
              <Num size={17} weight={600} color={isSel ? 'var(--accent)' : 'var(--text-primary)'}>{day.dnum}</Num>
              <span style={{ height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {day.st === 'done' && (
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3.2 3.5L12 3.5" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
                {(day.st === 'planned' || day.st === 'today') && (
                  day.sessions
                    ? <span style={{ display: 'flex', gap: 2 }}>{day.sessions.map((s, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: `var(--zone-${s.zone})` }} />)}</span>
                    : <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(--zone-${day.zone})` }} />
                )}
                {day.st === 'rest' && (
                  <span style={{ width: 8, height: 2, borderRadius: 2, background: 'var(--border-strong)' }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Garmin-sync (per dag · alle sessies) ── */
  function nowTime() { return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }); }
  function computeSig(day, override) {
    if (day.sessions) return 'm:' + day.sessions.map((s) => s.naam).join('+');
    if (override) return override.type === 'free' ? `f:${override.kind}:${override.min}:${override.intensity}` : `l:${override.wo.naam}:${override.wo.min}`;
    return 'e:' + (day.d ? day.d.naam : '');
  }
  function GarminSync({ state, at, sessions, onSend }) {
    const multi = sessions > 1;
    const label = multi ? `Stuur ${sessions} sessies naar Garmin` : 'Stuur naar Garmin';
    const baseBtn = { width: '100%', height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
    const Up = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 10.5V2.5M5 5.5l3-3 3 3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.7 9v3.3a1 1 0 001 1h8.6a1 1 0 001-1V9" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" /></svg>;
    if (state === 'busy') return (<button disabled style={{ ...baseBtn, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'default' }}><span className="gm-spin" /> Versturen…</button>);
    if (state === 'sent') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--good-soft)', border: '1px solid color-mix(in srgb, var(--good) 35%, transparent)', borderRadius: 'var(--btn-radius)', padding: '11px 14px', opacity: 0.9 }}>
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3.2 3.5L12 3.5" stroke="var(--good)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--good)' }}>{multi ? `${sessions} sessies verstuurd` : 'Verstuurd naar Garmin'}</span>
        <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--text-muted)' }}>{at}</span>
      </div>
    );
    if (state === 'stale') return (
      <div style={{ background: 'var(--warn-soft)', border: '1px solid color-mix(in srgb, var(--warn) 40%, transparent)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.7l6.4 11.3H1.6L8 1.7z" stroke="var(--warn)" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 6.4v3.1M8 11.3v.05" stroke="var(--warn)" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--warn)' }}>Garmin heeft nog de oude training</span>
        </div>
        <button onClick={onSend} style={{ ...baseBtn, marginTop: 10, border: 'none', background: 'var(--accent-grad)', color: '#fff' }}>Bijgewerkte training versturen</button>
      </div>
    );
    if (state === 'error') return (
      <div style={{ background: 'var(--bad-soft)', border: '1px solid color-mix(in srgb, var(--bad) 40%, transparent)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="var(--bad)" strokeWidth="1.4" /><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="var(--bad)" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--bad)' }}>Versturen naar Garmin mislukt</span>
        </div>
        <button onClick={onSend} style={{ ...baseBtn, marginTop: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>Opnieuw proberen</button>
      </div>
    );
    return (<button onClick={onSend} style={{ ...baseBtn, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}><Up /> {label}</button>);
  }

  function MultiSessionDetail({ day }) {
    const isToday = day.st === 'today';
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Over color={isToday ? 'var(--accent)' : 'var(--text-muted)'}>{isToday ? 'Vandaag' : 'Voorstel'} · {day.wd} {day.dnum} {day.mon}</Over>
          <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{day.sessions.length} sessies</span>
        </div>
        {day.sessions.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', padding: '12px 12px', marginTop: i ? 10 : 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</span>
              <ZoneBadge z={s.zone} />
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 7 }}>{s.naam}</div>
            <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <Num size={13} weight={600}>{fmtDur(s.min)}</Num><Dot /><span style={{ color: 'var(--text-muted)' }}>IF</span> <Num size={13} weight={600}>{s.iff}</Num><Dot /><span style={{ color: 'var(--text-muted)' }}>TSS</span> <Num size={13} weight={600}>{s.tss}</Num>
            </div>
            <MiniZoneBar segments={s.segs} />
          </div>
        ))}
      </div>
    );
  }

  /* ── beschikbaarheid ── */
  const isWeekend = (day) => [0, 6].includes(day.date.getDay());
  const defaultAvail = (day) => ({ train: day.st !== 'rest', minutes: day.sessions ? day.sessions.reduce((a, s) => a + s.min, 0) : (day.d ? day.d.min : 60), pendel: false });
  function synthDay(day, minutes) {
    const dv = window.WORKOUT_CATS.find((c) => c.key === 'duur').variants[0];
    const w = window.buildWorkout(dv, minutes);
    return { ...day, st: day.st === 'today' ? 'today' : 'planned', zone: w.zone, d: { kind: 'proposal', naam: w.naam, min: w.min, iff: w.iff, tss: w.tss, segs: w.segs, blocks: w.blocks, why: 'Voorstel op basis van je beschikbaarheid — een rustige duurrit. Kies eventueel zelf iets anders.' } };
  }
  const Toggle = ({ on, onChange, sm }) => (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ width: sm ? 38 : 44, height: sm ? 22 : 26, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative', background: on ? 'var(--accent)' : '#2A323D', transition: 'background .2s' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? `calc(100% - ${sm ? 19 : 23}px)` : 3, width: sm ? 16 : 20, height: sm ? 16 : 20, borderRadius: 999, background: '#EDF1F5', boxShadow: '0 1px 3px rgba(0,0,0,0.5)', transition: 'left .2s' }} />
    </button>
  );
  const ERow = ({ label, sub, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
  function DayControls({ val, onChange }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ERow label="Train vandaag?" right={<Toggle on={val.train} onChange={(v) => onChange({ ...val, train: v })} />} />
        {val.train && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>Minuten</span>
              <Num size={15} color="var(--accent)">{val.minutes}</Num>
            </div>
            <input type="range" min={30} max={240} step={15} value={val.minutes} onChange={(e) => onChange({ ...val, minutes: Number(e.target.value) })} style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent)', cursor: 'pointer' }} />
          </div>
        )}
        <ERow label="Pendel?" sub="woon-werk meegeteld" right={<Toggle on={val.pendel} onChange={(v) => onChange({ ...val, pendel: v })} />} />
      </div>
    );
  }
  function AvailabilityEditor({ sel, weekIdxs, getAvail, forceTrain, onSave, onClose }) {
    const [scope, setScope] = useState(forceTrain ? 'day' : 'choose');
    const init = getAvail(sel);
    const [d, setD] = useState(forceTrain ? { ...init, train: true, minutes: init.minutes || 60 } : init);
    const [wk, setWk] = useState(() => weekIdxs.map((i) => getAvail(i)));
    const dayLabel = `${DAYS[sel].wd} ${DAYS[sel].dnum} ${DAYS[sel].mon}`;
    const card = { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 16, boxShadow: 'var(--shadow-card)' };
    const back = (scope === 'choose' || forceTrain) ? onClose : () => setScope('choose');
    const Head = ({ title }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={back} aria-label="Terug" style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      </div>
    );
    const saveBtn = (onClick) => (<button onClick={onClick} style={{ marginTop: 16, width: '100%', height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', border: 'none', cursor: 'pointer', background: 'var(--accent-grad)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600 }}>Opslaan</button>);
    if (scope === 'choose') return (
      <div style={card}>
        <Head title="Beschikbaarheid" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['day', 'Alleen deze dag', dayLabel], ['week', 'Hele week', 'ma–zo in één keer']].map(([k, t, s]) => (
            <button key={k} onClick={() => setScope(k)} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s}</div></div>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
      </div>
    );
    if (scope === 'day') return (
      <div style={card}>
        <Head title={forceTrain ? 'Toch trainen' : 'Deze dag'} />
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{dayLabel}{isWeekend(DAYS[sel]) ? ' · weekend' : ''}</div>
        <DayControls val={d} onChange={setD} />
        {saveBtn(() => onSave({ updates: { [sel]: d } }))}
      </div>
    );
    return (
      <div style={card}>
        <Head title="Hele week" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingRight: 2 }}><span>Train</span><span>Pendel</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {weekIdxs.map((idx, i) => {
            const v = wk[i]; const set = (nv) => setWk((w) => w.map((x, j) => (j === i ? nv : x)));
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', padding: '8px 12px' }}>
                <span style={{ width: 42, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{DAYS[idx].wd} {DAYS[idx].dnum}</span>
                {v.train
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}><input type="range" min={30} max={240} step={15} value={v.minutes} onChange={(e) => set({ ...v, minutes: Number(e.target.value) })} style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} /><Num size={12} color="var(--text-secondary)" style={{ width: 34, textAlign: 'right' }}>{v.minutes}</Num></div>
                  : <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>rustdag</span>}
                <Toggle sm on={v.train} onChange={(t) => set({ ...v, train: t })} />
                <Toggle sm on={v.pendel} onChange={(p) => set({ ...v, pendel: p })} />
              </div>
            );
          })}
        </div>
        {saveBtn(() => onSave({ updates: Object.fromEntries(weekIdxs.map((idx, i) => [idx, wk[i]])) }))}
      </div>
    );
  }

  function PeriodTimeline() {
    const [open, setOpen] = useState(false);
    const ev = new Date(2026, 8, 12);
    const wks = Math.max(0, Math.round((ev - TODAY) / (7 * 86400000)));
    const phases = [{ k: 'Basis', wk: 5 }, { k: 'Build', wk: 9, cur: true }, { k: 'Peak', wk: 4 }, { k: 'Taper', wk: 1 }];
    const total = phases.reduce((a, p) => a + p.wk, 0);
    const curIdx = phases.findIndex((p) => p.cur);
    const elapsed = phases.slice(0, curIdx).reduce((a, p) => a + p.wk, 0) + 1.5;
    const markerPct = (elapsed / total) * 100;
    const events = [{ pct: 73, tag: 'B', label: 'Tune-up' }, { pct: 100, tag: 'A', label: 'Girona' }];
    const segBg = (i) => (i < curIdx ? 'color-mix(in srgb, var(--accent) 28%, var(--bg-sunken))' : i === curIdx ? 'var(--accent)' : 'var(--bg-elevated)');
    const ModeChip = () => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 38%, transparent)', borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />Doel-gericht
      </span>
    );
    const Stat = ({ label, val, accent, first }) => (
      <div style={{ flex: 1, borderLeft: first ? 'none' : '1px solid var(--border-subtle)', paddingLeft: first ? 0 : 12 }}>
        <Over style={{ fontSize: 9.5 }}>{label}</Over>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-primary)', marginTop: 4 }}>{val}</div>
      </div>
    );
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 14, boxShadow: 'var(--shadow-card)' }}>
        <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <Over>Plan · periodisering</Over>
            <div style={{ marginTop: 5, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Build · nog {wks} wkn tot Girona</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {!open && <ModeChip />}
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M3 5l4 4 4-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </button>
        {open && (
          <div style={{ marginTop: 16 }}>
            <div style={{ position: 'relative' }}>
              {events.map((e, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, left: e.pct >= 100 ? undefined : `${e.pct}%`, right: e.pct >= 100 ? 0 : undefined, transform: e.pct >= 100 ? 'none' : 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: e.pct >= 100 ? 'flex-end' : 'center' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: e.tag === 'A' ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: e.tag === 'A' ? 'var(--accent)' : 'var(--text-secondary)', border: `1px solid ${e.tag === 'A' ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border-strong)'}`, whiteSpace: 'nowrap' }}>{e.label} · {e.tag}</span>
                  <span style={{ width: 1, height: 6, background: e.tag === 'A' ? 'var(--accent)' : 'var(--border-strong)' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 3, marginTop: 26 }}>
                {phases.map((p, i) => (
                  <div key={p.k} style={{ flex: p.wk, height: 12, borderRadius: 3, background: segBg(i), border: i > curIdx ? '1px solid var(--border-subtle)' : 'none' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', top: 23, left: `${markerPct}%`, transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: 999, background: '#EDF1F5', border: '2px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }} />
              <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                {phases.map((p, i) => (
                  <div key={p.k} style={{ flex: p.wk, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 600, color: i === curIdx ? 'var(--accent)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.k}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: 18 }}>
              <Stat first label="Fase" val="Build" accent />
              <Stat label="Tot Girona" val={`${wks} wkn`} />
              <Stat label="Volume" val="~8 u/wk" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <ModeChip />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)' }}>→ Evenement-gericht ~3 wkn vóór Girona</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  function WeekLoad({ stale, regen, regenAt, onRegen }) {
    const pct = 67;
    const Stat = ({ val, sub, label, first }) => (
      <div style={{ flex: 1, textAlign: 'center', borderLeft: first ? 'none' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
          <Num size={20} weight={600}>{val}</Num>
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--text-muted)' }}>/{sub}</span>
        </div>
        <Over style={{ marginTop: 5, fontSize: 9.5 }}>{label}</Over>
      </div>
    );
    let action;
    if (regen === 'busy') action = (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}><span className="gm-spin" /> Bijwerken…</span>);
    else if (!stale && regen === 'done') action = (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--good)' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3.2 3.5L12 3.5" stroke="var(--good)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Bijgewerkt{regenAt ? ` · ${regenAt}` : ''}</span>);
    else action = (<button onClick={onRegen} aria-label="Werk week bij" title="Werk week bij" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-primary)' }}><svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M12 7a5 5 0 11-1.5-3.6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 1.5V4.2H9.3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>);
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: 14, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Over>Deze week · gepland vs gedaan</Over>
          {action}
        </div>
        <div style={{ display: 'flex', marginTop: 12 }}>
          <Stat first val="320" sub="480" label="TSS" />
          <Stat val="3:10" sub="5:00" label="Uren" />
          <Stat val="3" sub="5" label="Dagen" />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-secondary)' }}>Voortgang</span>
            <Num size={11} weight={600} color="var(--text-secondary)">{pct}% van plan</Num>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'var(--accent-grad)' }} />
          </div>
        </div>
        {stale && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, background: 'var(--warn-soft)', border: '1px solid color-mix(in srgb, var(--warn) 40%, transparent)', borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M8 1.7l6.4 11.3H1.6L8 1.7z" stroke="var(--warn)" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 6.4v3.1M8 11.3v.05" stroke="var(--warn)" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--warn)' }}>Je plan is verouderd t.o.v. je beschikbaarheid — werk bij.</span>
          </div>
        )}
      </div>
    );
  }

  function SchemaTab({ dataState, setDataState, onOpenSettings }) {
    const [sel, setSel] = useState(TODAY_IDX);
    const [overrides, setOverrides] = useState({});
    const [garmin, setGarmin] = useState({});
    const [avail, setAvail] = useState({});
    const [editing, setEditing] = useState(null);
    const [availDirty, setAvailDirty] = useState(false);
    const [regen, setRegen] = useState('idle');
    const [regenAt, setRegenAt] = useState(null);
    const regenWeek = () => { setRegen('busy'); setTimeout(() => { setRegen('done'); setRegenAt(nowTime()); setAvailDirty(false); if (dataState === 'lege week' || dataState === 'eerste keer') setDataState && setDataState('normaal'); }, 1200); };
    const day = DAYS[sel];
    const selectDay = (i) => { setSel(i); setEditing(null); };
    const override = overrides[sel] || null;
    const setOverride = (o) => setOverrides((m) => ({ ...m, [sel]: o }));
    const getAvail = (i) => avail[i] || defaultAvail(DAYS[i]);
    const a = getAvail(sel);
    const gd = DAYS[TODAY_IDX].date.getDay();
    const monIdx = TODAY_IDX - (gd === 0 ? 6 : gd - 1);
    const weekIdxs = [0, 1, 2, 3, 4, 5, 6].map((i) => monIdx + i).filter((i) => i >= 0 && i < DAYS.length);
    const saveAvail = ({ updates }) => { setAvail((m) => ({ ...m, ...updates })); setEditing(null); setAvailDirty(true); };

    const sessions = day.sessions ? day.sessions.length : 1;
    const sig = computeSig(day, override);
    const stored = garmin[sel];
    const effState = !stored ? 'idle' : (stored.state === 'sent' && stored.sig !== sig ? 'stale' : stored.state);
    const send = () => {
      setGarmin((m) => ({ ...m, [sel]: { state: 'busy', sig } }));
      setTimeout(() => {
        setGarmin((m) => {
          const fail = Math.random() < 0.18;
          return { ...m, [sel]: fail ? { state: 'error', sig } : { state: 'sent', sig, at: nowTime() } };
        });
      }, 1300);
    };

    if (dataState === 'niet verbonden') return <div style={{ padding: '0 16px' }}><ConnectState onConnect={onOpenSettings} /></div>;
    if (dataState === 'lege week' || dataState === 'eerste keer') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 -16px' }}>
          <div style={{ padding: '0 16px' }}><WeekLoad stale={false} regen={regen} regenAt={regenAt} onRegen={regenWeek} /></div>
          <div style={{ padding: '0 16px' }}>
            <EmptyState title="Nog geen voorstellen deze week" text="Werk je week bij om sessies te genereren op basis van je doel en beschikbaarheid." actionLabel="Werk week bij" onAction={regenWeek} />
          </div>
        </div>
      );
    }

    if (editing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 -16px' }}>
          <DayStrip sel={sel} setSel={selectDay} />
          <div style={{ padding: '0 16px' }}>
            <AvailabilityEditor sel={sel} weekIdxs={weekIdxs} getAvail={getAvail} forceTrain={editing.forceTrain} onSave={saveAvail} onClose={() => setEditing(null)} />
          </div>
        </div>
      );
    }

    let detail; let sendable = false;
    if (day.st === 'done') detail = <DoneDetail day={day} />;
    else if (!a.train) detail = day.coachRest
      ? <RecoveryCard day={day} onToch={() => setEditing({ forceTrain: true })} />
      : <UnavailableCard day={day} onToch={() => setEditing({ forceTrain: true })} />;
    else {
      sendable = true;
      if (override) detail = <OverriddenDetail day={day} override={override} onRevert={() => setOverride(null)} />;
      else if (day.sessions) detail = <MultiSessionDetail day={day} />;
      else if (day.d && day.d.kind === 'proposal') detail = <ProposalDetail day={day} override={override} setOverride={setOverride} />;
      else detail = <ProposalDetail day={synthDay(day, a.minutes)} override={override} setOverride={setOverride} />;
    }
    const showRecoveryNote = day.coachRest && a.train;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '0 -16px' }}>
        {dataState === 'sync mislukt' && <div style={{ padding: '0 16px' }}><SyncBanner onRetry={() => setDataState('normaal')} /></div>}
        <div style={{ padding: '0 16px' }}><PeriodTimeline /></div>
        <div style={{ padding: '0 16px' }}><WeekLoad stale={availDirty} regen={regen} regenAt={regenAt} onRegen={regenWeek} /></div>
        <DayStrip sel={sel} setSel={selectDay} />
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showRecoveryNote && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warn)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-secondary)' }}>Herstel was aanbevolen — luister naar je lichaam.</span>
            </div>
          )}
          <div key={sel}>{detail}</div>
          {sendable && <GarminSync state={effState} at={stored && stored.at} sessions={sessions} onSend={send} />}
          <button onClick={() => setEditing({ forceTrain: false })} style={{ width: '100%', height: 42, borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--text-muted)' }}><rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M2.5 7h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            Beschikbaarheid
          </button>
        </div>
      </div>
    );
  }

  Object.assign(window, { SchemaTab });
})();
