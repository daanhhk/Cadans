// app.jsx — FTP Coach · hoofdscherm (status-deck + vorm-tab)
const { useState, useEffect, useRef } = React;

/* ───────── kleine bouwstenen ───────── */
function Overline({ children, color = 'var(--text-muted)', style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', fontWeight: 600,
      letterSpacing: 'var(--tracking-overline)', textTransform: 'uppercase',
      color, ...style,
    }}>{children}</div>
  );
}
function Num({ children, size = 'var(--fs-num-md)', weight = 600, color = 'var(--text-primary)', style }) {
  return (
    <span style={{
      fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
      fontSize: size, fontWeight: weight, color, letterSpacing: '-0.01em',
      lineHeight: 1, ...style,
    }}>{children}</span>
  );
}
function Chip({ children, color = 'var(--text-secondary)', bg = 'var(--bg-elevated)', dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color, border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--r-pill)', padding: '4px 9px',
      fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}


/* ───────── check-in persistentie (1× per dag) ───────── */
function todayKey() {
  const d = new Date();
  return 'ftp-checkin-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function loadTodayCheckin() {
  try { const v = localStorage.getItem(todayKey()); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function saveTodayCheckin(data) {
  try { localStorage.setItem(todayKey(), JSON.stringify(data)); } catch (e) {}
}
function PlusIcon({ color = 'currentColor' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v9M2.5 7h9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ───────── Cadans merkteken (drie stijgende schuine balken) ─────────
   Het merk blijft Cadans; de wordmark ernaast is de naam die de gebruiker
   z'n coach geeft (Instellingen → Jouw coach). */
function CadansMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
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

/* ───────── check-in pop-up (bottom sheet) ───────── */
function CheckInModal({ open, initial, onClose, onSave }) {
  const [draft, setDraft] = useState(initial || { slaap: null, benen: null, stress: null });
  useEffect(() => { if (open) setDraft(initial || { slaap: null, benen: null, stress: null }); }, [open, initial]);
  if (!open) return null;
  const ready = draft.slaap && draft.benen && draft.stress;
  return (
    <div onClick={onClose} className="sheet-backdrop" style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(6,8,11,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="sheet-panel" style={{
        width: '100%', background: 'var(--bg-surface)',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -18px 50px rgba(0,0,0,0.5)',
        padding: '10px 18px 26px',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Hoe voel je je vanochtend?</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>Eén keer per dag — dit stemt je gereedheid bij.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <Seg label="Slaap" value={draft.slaap} options={['goed', 'matig', 'slecht']} onChange={(v) => setDraft((d) => ({ ...d, slaap: v }))} />
          <Seg label="Benen" value={draft.benen} options={['fris', 'normaal', 'zwaar']} onChange={(v) => setDraft((d) => ({ ...d, benen: v }))} />
          <Seg label="Stress" value={draft.stress} options={['laag', 'normaal', 'hoog']} onChange={(v) => setDraft((d) => ({ ...d, stress: v }))} />
        </div>
        <button disabled={!ready} onClick={() => onSave(draft)} style={{ marginTop: 20, width: '100%', height: 46, borderRadius: 'var(--r-md)', border: 'none', cursor: ready ? 'pointer' : 'default', background: ready ? 'var(--accent-grad)' : 'var(--bg-elevated)', color: ready ? '#fff' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600 }}>Vastleggen</button>
        <button onClick={onClose} style={{ marginTop: 8, width: '100%', height: 38, borderRadius: 'var(--r-md)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{initial ? 'Annuleren' : 'Later'}</button>
      </div>
    </div>
  );
}

/* ───────── kaart 1: ring + verdict + waarom + check-in ───────── */
function Seg({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 50, flexShrink: 0, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 4, background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', padding: 3 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '6px 0',
            fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize',
            background: value === o ? 'var(--bg-elevated)' : 'transparent',
            color: value === o ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: value === o ? '0 1px 3px rgba(0,0,0,0.4)' : 'none', transition: 'all .12s',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}
function ReadinessCard({ checkin, onEdit }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const adj = checkin
    ? ((checkin.slaap === 'goed' ? 0 : checkin.slaap === 'matig' ? -4 : -10)
      + (checkin.benen === 'fris' ? 3 : checkin.benen === 'normaal' ? 0 : -8)
      + (checkin.stress === 'laag' ? 2 : checkin.stress === 'normaal' ? 0 : -6))
    : 0;
  const val = Math.max(0, Math.min(100, 82 + adj));
  const rc = val >= 62 ? 'var(--good)' : val >= 48 ? 'var(--warn)' : 'var(--bad)';
  const verdict = val >= 78 ? 'Klaar om te trainen' : val >= 62 ? 'Goed — normaal trainen' : val >= 48 ? 'Let op — tandje terug' : 'Herstel aanbevolen';
  const effect = checkin
    ? (checkin.benen === 'zwaar' ? 'Benen zwaar → vandaag een tandje terug.'
      : checkin.slaap === 'slecht' ? 'Slecht geslapen → houd het rustig vandaag.'
      : checkin.stress === 'hoog' ? 'Hoge stress → kies een beheersbare sessie.'
      : (checkin.benen === 'fris' && checkin.slaap === 'goed') ? 'Top hersteld → ruimte voor een stevige sessie.'
      : 'Niks bijzonders → volg gewoon je plan.')
    : null;
  const slaapF = checkin
    ? (checkin.slaap === 'goed' ? { v: 'Goed — uitgerust', s: 'pos' } : checkin.slaap === 'matig' ? { v: 'Matig', s: 'neutral' } : { v: 'Slecht — let op', s: 'warn' })
    : { v: 'Vul je check-in in', s: 'neutral' };
  const factors = [
    { l: 'Vorm-trend', v: '+7 — fris', s: 'pos' },
    { l: 'HRV vs baseline', v: '48 — iets onder baseline', s: 'neutral' },
    { l: 'Recente belasting', v: 'Laag — ruimte voor intensiteit', s: 'pos' },
    { l: 'Slaap', v: slaapF.v, s: slaapF.s },
  ];
  const sdot = (s) => (s === 'pos' ? 'var(--good)' : s === 'warn' ? 'var(--warn)' : 'var(--text-muted)');
  return (
    <div className="deck-card">
      <Overline>Status · vandaag</Overline>
      <div role="button" onClick={() => setWhyOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, cursor: 'pointer' }}>
        <ProgressRing value={val} size={104} stroke={9} color={rc}>
          <Num size="30px" weight={600}>{val}</Num>
          <div style={{ marginTop: 2 }}><Overline color="var(--text-muted)" style={{ fontSize: 8.5 }}>Gereed</Overline></div>
        </ProgressRing>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 17.5, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{verdict}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            <Chip color="var(--fresh)" bg="var(--fresh-soft)" dot="var(--fresh)">Vorm +7</Chip>
            <Chip dot="var(--text-muted)">HRV 48</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 9, fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
            Waarom dit cijfer?
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ transform: whyOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M3 5l4 4 4-4" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </div>

      {whyOpen && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9, background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)', padding: 12 }}>
          {factors.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: sdot(f.s), flexShrink: 0 }} />
              <span style={{ width: 116, flexShrink: 0, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>{f.l}</span>
              <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', textAlign: 'right' }}>{f.v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
        {!checkin ? (
          <button onClick={onEdit} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            height: 38, borderRadius: 'var(--r-md)', cursor: 'pointer',
            background: 'var(--bg-sunken)', border: '1px dashed var(--border-strong)',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)',
          }}>
            <PlusIcon color="var(--text-secondary)" />
            Ochtend-check-in invullen
          </button>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check-in:</span>{' '}
                Slaap {checkin.slaap} · benen {checkin.benen} · stress {checkin.stress}
              </span>
              <button onClick={onEdit} aria-label="Check-in aanpassen" style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 999, cursor: 'pointer',
                background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, marginLeft: 8,
              }}>
                <PlusIcon color="var(--accent)" />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M8 1.5l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13l.8-4.2L2 5.9l4.2-.5L8 1.5z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{effect}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── kaart 2: niveau-blok (W/kg-geleid) ───────── */
function LevelCard() {
  return (
    <div className="deck-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Overline>Niveau</Overline>
        <Chip color="var(--accent)" bg="var(--accent-soft)" dot="var(--accent)">Gevorderd</Chip>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <Num size="52px" weight={600} color="var(--text-primary)">3,8</Num>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>W/kg</span>
        </div>
        <div style={{ paddingBottom: 5 }}>
          <Num size="20px" weight={600} color="var(--text-primary)">275</Num>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>W FTP</span>
        </div>
      </div>

      {/* voortgang binnen tier */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>nog 0,3 tot <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Zeer goed</span></span>
          <Num size="11px" weight={600} color="var(--good)" style={{ fontFamily: 'var(--font-num)' }}>+0,9 ↑ sinds jun '24</Num>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
          <div className="grow-bar" style={{ height: '100%', width: '50%', borderRadius: 999, background: 'var(--accent-grad)' }} />
        </div>
      </div>
    </div>
  );
}

/* ───────── status-deck (swipe + dots) ───────── */
function StatusDeck({ checkin, onEditCheckin }) {
  const scrollRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const onScroll = () => {
    const el = scrollRef.current; if (!el) return;
    const cards = el.querySelectorAll('.deck-card');
    if (cards.length < 2) return;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    setIdx(Math.round(el.scrollLeft / step));
  };
  const go = (i) => {
    const el = scrollRef.current; const cards = el.querySelectorAll('.deck-card');
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    el.scrollTo({ left: step * i, behavior: 'smooth' });
  };
  return (
    <div>
      <div ref={scrollRef} className="deck" onScroll={onScroll}>
        <ReadinessCard checkin={checkin} onEdit={onEditCheckin} />
        <LevelCard />
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
        {[0, 1].map((i) => (
          <button key={i} onClick={() => go(i)} aria-label={`kaart ${i + 1}`} style={{
            width: i === idx ? 18 : 6, height: 6, borderRadius: 999, border: 'none', padding: 0,
            cursor: 'pointer', transition: 'all .25s ease',
            background: i === idx ? 'var(--accent)' : 'var(--border-strong)',
          }} />
        ))}
      </div>
    </div>
  );
}

/* ───────── metric-rij ───────── */
function MetricRow({ empty }) {
  const items = [
    { v: '275', u: 'W', l: 'FTP' },
    { v: '72', u: 'kg', l: 'Gewicht' },
    { v: '480', u: 'TSS', l: 'Week' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      {items.map((m, i) => (
        <div key={m.l} style={{
          padding: '14px 12px', textAlign: 'center',
          borderLeft: i ? '1px solid var(--border-subtle)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <Num size="22px" weight={600} color={empty ? 'var(--text-muted)' : 'var(--text-primary)'}>{empty ? '—' : m.v}</Num>
            {!empty && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>{m.u}</span>}
          </div>
          <Overline style={{ marginTop: 6, fontSize: 10 }}>{m.l}</Overline>
        </div>
      ))}
    </div>
  );
}

/* ───────── vorm-tab ───────── */
function VormTab({ conditie, dataState, setDataState, onOpenSettings, variant, onOpenNiveau }) {
  const ConditieView = conditie === 'pmc' ? ConditiePMC
    : conditie === 'driehoek' ? ConditieDriehoek : ConditieBalans;
  const [range, setRange] = useState('all');
  const ranges = [['1m', '1M'], ['6m', '6M'], ['12m', '12M'], ['all', 'Alles']];
  const series = window.sliceNiveau(range);
  const current = series[series.length - 1].v;
  const delta = current - series[0].v;
  const up = delta >= 0;
  const fmt = (n) => Math.abs(n).toFixed(1).replace('.', ',');
  if (dataState === 'niet verbonden') return <ConnectState onConnect={onOpenSettings} />;
  const first = dataState === 'eerste keer';
  const variantA = variant === 'A';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {dataState === 'sync mislukt' && <SyncBanner onRetry={() => setDataState('normaal')} />}

      {variantA ? (
        /* Variant A — diepe progressie verhuisd naar Niveau; hier alleen een
           compacte samenvatting + affordance. */
        <VormLevelSummary onOpenNiveau={onOpenNiveau} />
      ) : (
      <React.Fragment>
      {/* lijngrafiek-kaart */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-lg)', padding: '16px 14px 10px',
      }}>
        <div style={{ padding: '0 2px' }}>
          <Overline>W/kg over tijd</Overline>
          {first ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 5 }}>
              <Num size="26px" weight={600} color="var(--text-muted)">—</Num>
            </div>
          ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 5 }}>
            <Num size="26px" weight={600}>{fmt(current)}</Num>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>W/kg</span>
            <Num size="12px" weight={600} color={up ? 'var(--good)' : 'var(--bad)'} style={{ fontFamily: 'var(--font-num)' }}>
              {delta === 0 ? '±0,0' : `${up ? '+' : '−'}${fmt(delta)} ${up ? '↑' : '↓'}`}
            </Num>
          </div>
          )}
        </div>
        {!first && (
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', padding: 3, marginTop: 12 }}>
          {ranges.map(([k, lbl]) => (
            <button key={k} onClick={() => setRange(k)} style={{
              flex: 1, border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)',
              padding: '6px 0', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
              background: range === k ? 'var(--bg-elevated)' : 'transparent',
              color: range === k ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: range === k ? '0 1px 3px rgba(0,0,0,0.4)' : 'none', transition: 'all .15s',
            }}>{lbl}</button>
          ))}
        </div>
        )}
        <div style={{ marginTop: 12 }}>{first ? <EmptyChart /> : <NiveauChart range={range} />}</div>
      </div>

      <MetricRow empty={first} />
      </React.Fragment>
      )}

      {/* conditie-balans */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-lg)', padding: '14px 14px 16px',
      }}>
        <Overline>Conditie-balans</Overline>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>vorm = fitheid − vermoeidheid</div>
        {first
          ? <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px', lineHeight: 1.5 }}>Je conditie-balans bouwt op zodra je ritten binnenkomen.</div>
          : <ConditieView />}
      </div>
    </div>
  );
}

/* ───────── vaste onderbalk (tab-navigatie) ───────── */
function NavIcon({ k }) {
  const c = 'currentColor';
  if (k === 'schema') return (<svg width="21" height="21" viewBox="0 0 20 20" fill="none"><rect x="3" y="4.5" width="14" height="13" rx="2" stroke={c} strokeWidth="1.5" /><path d="M3 8h14M7 2.5v4M13 2.5v4" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>);
  if (k === 'vorm') return (<svg width="21" height="21" viewBox="0 0 20 20" fill="none"><path d="M3 13l4-4 3 3 6-7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14.5 5H17.5V8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
  if (k === 'trainingen') return (<svg width="21" height="21" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="4.5" rx="1.4" stroke={c} strokeWidth="1.5" /><rect x="3" y="11.5" width="14" height="4.5" rx="1.4" stroke={c} strokeWidth="1.5" /></svg>);
  return (<svg width="21" height="21" viewBox="0 0 20 20" fill="none"><path d="M5 16V11M10 16V7M15 16V4" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></svg>);
}
function BottomNav({ tab, setTab }) {
  const items = [['schema', 'Schema'], ['vorm', 'Vorm'], ['trainingen', 'Trainingen'], ['niveau', 'Niveau']];
  return (
    <nav style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
      display: 'flex',
      background: 'color-mix(in srgb, var(--bg-app) 88%, transparent)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderTop: '1px solid var(--border-subtle)',
      paddingBottom: 20,
    }}>
      {items.map(([k, lbl]) => {
        const active = tab === k;
        const col = active ? 'var(--accent)' : 'var(--text-muted)';
        return (
          <button key={k} onClick={() => setTab(k)} aria-label={lbl} aria-current={active ? 'page' : undefined} style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            padding: '9px 0 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            position: 'relative',
          }}>
            {active && <span style={{ position: 'absolute', top: 0, width: 22, height: 2.5, borderRadius: 999, background: 'var(--accent)' }} />}
            <span style={{ color: col, display: 'flex' }}><NavIcon k={k} /></span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.01em', color: col }}>{lbl}</span>
          </button>
        );
      })}
    </nav>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('schema');
  const [screen, setScreen] = useState('home');
  const [dataState, setDataState] = useState('normaal');
  const [checkin, setCheckin] = useState(() => loadTodayCheckin());
  const [checkinOpen, setCheckinOpen] = useState(() => !loadTodayCheckin());
  const [coachNaam, setCoachNaam] = useState(() => {
    try { return localStorage.getItem('cadans-coachnaam') || 'Coach'; } catch (e) { return 'Coach'; }
  });
  const updateCoachNaam = (v) => {
    setCoachNaam(v);
    try { localStorage.setItem('cadans-coachnaam', v); } catch (e) {}
  };
  const coachLabel = (coachNaam || '').trim() || 'Coach';
  useEffect(() => { setDataState(t.data || 'normaal'); }, [t.data]);

  // accent-tweak → CSS-variabelen
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent[0]);
    r.style.setProperty('--accent-strong', t.accent[1]);
    r.style.setProperty('--accent-soft', t.accent[0].replace('rgb', 'rgba').length ? hexA(t.accent[0], 0.14) : t.accent[0]);
    r.style.setProperty('--accent-grad', `linear-gradient(135deg, ${t.accent[0]} 0%, ${t.accent[1]} 100%)`);
  }, [t.accent]);

  return (
    <IOSDevice dark width={390} height={844}>
      <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-app)' }}>

        {/* ── HOME ── */}
        <div className="screen" style={{
          transform: screen === 'settings' ? 'translateX(-22%)' : 'translateX(0)',
          filter: screen === 'settings' ? 'brightness(0.5)' : 'none',
          pointerEvents: screen === 'settings' ? 'none' : 'auto',
        }}>
          <div className="app" style={{ background: 'var(--bg-app)', minHeight: '100%', paddingBottom: 96 }}>
            <header style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '52px 18px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <CadansMark size={22} />
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{coachLabel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--text-muted)' }}>Week 23</span>
                <button onClick={() => setScreen('settings')} aria-label="Instellingen" style={{
                  width: 32, height: 32, borderRadius: 999, background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                }}>DK</button>
              </div>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {tab !== 'schema' && tab !== 'niveau' && <StatusDeck checkin={checkin} onEditCheckin={() => setCheckinOpen(true)} />}

              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {tab === 'vorm'
                  ? <VormTab conditie={t.conditie} dataState={dataState} setDataState={setDataState} onOpenSettings={() => setScreen('settings')} variant={t.vormVariant || 'B'} onOpenNiveau={() => setTab('niveau')} />
                  : tab === 'schema'
                    ? <SchemaTab dataState={dataState} setDataState={setDataState} onOpenSettings={() => setScreen('settings')} />
                    : tab === 'trainingen'
                      ? <TrainingenTab />
                      : <NiveauTab dataState={t.niveauData === 'gevuld' ? 'normaal' : (t.niveauData || 'normaal')} />}
              </div>
            </main>
          </div>
        </div>

        {/* ── INSTELLINGEN ── */}
        <div className="screen" style={{
          transform: screen === 'settings' ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: screen === 'settings' ? '-10px 0 34px rgba(0,0,0,0.55)' : 'none',
        }}>
          <SettingsScreen onBack={() => setScreen('home')} coachNaam={coachNaam} setCoachNaam={updateCoachNaam} />
        </div>

        <CheckInModal
          open={checkinOpen}
          initial={checkin}
          onClose={() => setCheckinOpen(false)}
          onSave={(data) => { saveTodayCheckin(data); setCheckin(data); setCheckinOpen(false); }}
        />

        {screen === 'home' && <BottomNav tab={tab} setTab={setTab} />}

      </div>

      <TweaksPanel>
        <TweakSection label="Accent" />
        <TweakColor label="Accentkleur" value={t.accent}
          options={[['#FF5A1F', '#FF3526'], ['#FF8A00', '#FF5400'], ['#FF3D6E', '#E11D48'], ['#27C2A0', '#0E9F8C']]}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Conditie-balans" />
        <TweakRadio label="Visualisatie" value={t.conditie}
          options={['balans', 'driehoek', 'pmc']}
          onChange={(v) => setTweak('conditie', v)} />
        <TweakSection label="Weergave" />
        <TweakRadio label="Sectie" value={tab} options={['schema', 'vorm', 'trainingen', 'niveau']} onChange={setTab} />
        <TweakRadio label="Vorm-variant" value={t.vormVariant || 'B'}
          options={['A', 'B']}
          onChange={(v) => setTweak('vormVariant', v)} />
        <TweakSelect label="Niveau-data" value={t.niveauData || 'gevuld'}
          options={['gevuld', 'laden', 'leeg']}
          onChange={(v) => setTweak('niveauData', v)} />
        <TweakSection label="Data-staat" />
        <TweakSelect label="Scenario" value={t.data || 'normaal'}
          options={['normaal', 'niet verbonden', 'sync mislukt', 'lege week', 'eerste keer']}
          onChange={(v) => setTweak('data', v)} />
      </TweaksPanel>
    </IOSDevice>
  );
}

function hexA(hex, a) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#FF5A1F", "#FF3526"],
  "conditie": "balans",
  "vormVariant": "B",
  "niveauData": "gevuld",
  "data": "normaal"
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
