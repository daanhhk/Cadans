// settings.jsx — Instellingen-scherm (dark, token-gedreven form-componenten)
// Export to window: SettingsScreen
(function () {
  const { useState, useRef } = React;

  /* ── helpers ── */
  const Over = ({ children, style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', fontWeight: 600, letterSpacing: 'var(--tracking-overline)', textTransform: 'uppercase', color: 'var(--text-muted)', ...style }}>{children}</div>
  );
  const Chevron = ({ dir = 'down', size = 14, color = 'var(--text-muted)' }) => {
    const d = { down: 'M3 5l4 4 4-4', left: 'M9 2L4 7l5 5', right: 'M5 2l5 5-5 5' }[dir];
    const vb = dir === 'down' ? '0 0 14 14' : '0 0 13 14';
    return <svg width={size} height={size} viewBox={vb} fill="none"><path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  };
  const Check = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3.2 3.5L12 3.5" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

  /* ── form-componenten ── */
  function Section({ title, children, footer }) {
    return (
      <div style={{ marginBottom: 18 }}>
        {title && <Over style={{ margin: '0 4px 8px' }}>{title}</Over>}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>{children}</div>
        {footer}
      </div>
    );
  }
  function Row({ label, sub, right, children, last }) {
    return (
      <div style={{ padding: '12px 14px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 26 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
            {sub && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
        {children && <div style={{ marginTop: 10 }}>{children}</div>}
      </div>
    );
  }
  const ReadValue = ({ children, mono }) => (
    <span style={{ fontFamily: mono ? 'var(--font-num)' : 'var(--font-sans)', fontSize: 14.5, fontWeight: mono ? 600 : 400, color: 'var(--text-secondary)' }}>{children}</span>
  );

  function NumberField({ value, onChange, unit, width = 76 }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <input type="number" inputMode="decimal" className="field" value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          style={{ width, height: 'var(--field-height)', background: 'var(--field-bg)', border: '1px solid var(--field-border)', borderRadius: 'var(--field-radius)', color: 'var(--field-text)', textAlign: 'right', padding: '0 10px', fontFamily: 'var(--font-num)', fontSize: 15, fontWeight: 600, outline: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }} />
        {unit && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{unit}</span>}
      </div>
    );
  }
  function TextField({ value, onChange, placeholder, full }) {
    return (
      <input className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: full ? '100%' : 150, height: 'var(--field-height)', background: 'var(--field-bg)', border: '1px solid var(--field-border)', borderRadius: 'var(--field-radius)', color: 'var(--field-text)', textAlign: full ? 'left' : 'right', padding: '0 12px', fontFamily: 'var(--font-sans)', fontSize: 14.5, outline: 'none', boxSizing: 'border-box' }} />
    );
  }
  function DateField({ value, onChange }) {
    return (
      <input type="date" className="field" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', height: 'var(--field-height)', background: 'var(--date-bg)', border: '1px solid var(--date-border)', borderRadius: 'var(--field-radius)', color: 'var(--date-text)', padding: '0 10px', fontFamily: 'var(--font-num)', fontSize: 13.5, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
    );
  }
  function Toggle({ on, onChange }) {
    return (
      <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
        style={{ width: 'var(--toggle-w)', height: 'var(--toggle-h)', borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative', background: on ? 'var(--toggle-track-on)' : 'var(--toggle-track-off)', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 'calc(100% - 23px)' : 3, width: 20, height: 20, borderRadius: 999, background: 'var(--toggle-thumb)', boxShadow: 'var(--toggle-thumb-shadow)', transition: 'left .2s cubic-bezier(.4,0,.2,1)' }} />
      </button>
    );
  }
  function Select({ value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const cur = options.find((o) => o.k === value) || options[0];
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, background: 'var(--select-bg)', border: `1px solid ${open ? 'var(--accent)' : 'var(--select-border)'}`, borderRadius: 'var(--field-radius)', padding: '0 12px', cursor: 'pointer', transition: 'border-color .15s' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--select-text)' }}>{cur.t}</span>
            <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--text-muted)' }}>{cur.s}</span>
          </span>
          <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><Chevron dir="down" /></span>
        </button>
        {open && (
          <div style={{ marginTop: 6, background: 'var(--select-menu-bg)', border: '1px solid var(--select-menu-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {options.map((o, i) => (
              <button key={o.k} onClick={() => { onChange(o.k); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', border: 'none', borderTop: i ? '1px solid var(--border-subtle)' : 'none', background: o.k === value ? 'var(--select-option-active)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{o.t}</span>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: 11.5, color: 'var(--text-muted)' }}>{o.s}</span>
                </span>
                {o.k === value && <Check />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  function Button({ variant = 'secondary', children, onClick, full }) {
    const base = { height: 'var(--btn-height)', borderRadius: 'var(--btn-radius)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, padding: '0 18px', width: full ? '100%' : 'auto', transition: 'filter .15s' };
    const v = {
      primary: { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' },
      secondary: { background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)', border: '1px solid var(--btn-secondary-border)' },
      destructive: { background: 'var(--btn-destructive-bg)', color: 'var(--btn-destructive-text)', border: '1px solid rgba(255,82,103,0.25)' },
    }[variant];
    return <button onClick={onClick} style={{ ...base, ...v }}>{children}</button>;
  }
  const Badge = ({ children }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--badge-good-bg)', color: 'var(--badge-good-text)', border: '1px solid rgba(52,209,127,0.4)', borderRadius: 999, padding: '3px 9px', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--good)' }} />{children}
    </span>
  );

  const VOLUMES = [
    { k: 'amateur', t: 'Amateur', s: '~3u/wk' },
    { k: 'gemiddeld', t: 'Gemiddeld', s: '~5u/wk' },
    { k: 'gevorderd', t: 'Gevorderd', s: '~7u/wk' },
    { k: 'professional', t: 'Professional', s: '10u+/wk' },
  ];

  const DOELEN = [
    { k: 'duur', t: 'Duurvermogen', s: 'basis' },
    { k: 'ftp', t: 'FTP / drempel', s: 'drempel' },
    { k: 'vo2', t: 'VO2max', s: 'scherpte' },
    { k: 'onderhoud', t: 'Onderhoud', s: 'behoud' },
  ];
  const PRIO = {
    A: { bg: 'var(--accent-soft)', col: 'var(--accent)', bd: 'var(--accent)', hint: 'hoofddoel' },
    B: { bg: 'var(--warn-soft)', col: 'var(--warn)', bd: 'rgba(245,184,61,0.45)', hint: 'mini-taper' },
    C: { bg: 'var(--bg-elevated)', col: 'var(--text-secondary)', bd: 'var(--border-strong)', hint: 'doortrainen' },
  };

  // keuze-tegels (2 kolommen) — actieve in accent
  function ChoiceGrid({ value, options, onChange }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {options.map((o) => {
          const on = o.k === value;
          return (
            <button key={o.k} onClick={() => onChange(o.k)} style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              background: on ? 'var(--accent-soft)' : 'var(--bg-sunken)',
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`, transition: 'all .15s',
            }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--text-primary)' }}>{o.t}</div>
              {o.s && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{o.s}</div>}
            </button>
          );
        })}
      </div>
    );
  }

  const Trash = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4h11M6 4V2.7h4V4M5 4l.6 9.3h4.8L11 4" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // één event-rij: naam (bewerkbaar) · datum · prioriteit-chip (cyclt) · verwijderen
  function EventRow({ ev, onChange, onDelete, last }) {
    const cyc = { A: 'B', B: 'C', C: 'A' };
    const ps = PRIO[ev.prio];
    return (
      <div style={{ padding: '12px 14px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input className="field-bare" value={ev.naam} placeholder="Event-naam…"
            onChange={(e) => onChange(ev.id, { naam: e.target.value })}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, outline: 'none', padding: 0 }} />
          <button onClick={() => onChange(ev.id, { prio: cyc[ev.prio] })} title={`Prioriteit ${ev.prio} · ${ps.hint}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 24, padding: '0 9px', borderRadius: 999, border: `1px solid ${ps.bd}`, background: ps.bg, color: ps.col, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flexShrink: 0 }}>{ev.prio}</button>
          <button onClick={() => onDelete(ev.id)} aria-label="Verwijder event"
            style={{ width: 28, height: 24, borderRadius: 'var(--r-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Trash /></button>
        </div>
        <div style={{ marginTop: 8, width: 150 }}>
          <DateField value={ev.datum} onChange={(d) => onChange(ev.id, { datum: d })} />
        </div>
      </div>
    );
  }

  /* ── scherm ── */
  function SettingsScreen({ onBack, coachNaam, setCoachNaam }) {
    const [localCoach, setLocalCoach] = useState('Coach');
    const coach = coachNaam !== undefined ? coachNaam : localCoach;
    const setCoach = setCoachNaam || setLocalCoach;
    const COACH_SUGGESTIES = ['Coach', 'Daan', 'Merckx', 'Sven', 'Anna'];
    const [ftp, setFtp] = useState(275);
    const [gewicht, setGewicht] = useState(72);
    const [ftpAuto, setFtpAuto] = useState(false);
    const [volume, setVolume] = useState('gevorderd');
    const [doel, setDoel] = useState('ftp');
    const [blokStart, setBlokStart] = useState('2026-06-01');
    const [blokEind, setBlokEind] = useState('2026-08-31');
    const [events, setEvents] = useState([
      { id: 1, naam: 'Girona', datum: '2026-09-12', prio: 'A' },
      { id: 2, naam: 'Gravel-tocht Veluwe', datum: '2026-05-18', prio: 'B' },
    ]);
    const nextId = useRef(3);
    const updateEvent = (id, patch) => setEvents((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const deleteEvent = (id) => setEvents((es) => es.filter((e) => e.id !== id));
    const addEvent = () => setEvents((es) => [...es, { id: nextId.current++, naam: '', datum: '2026-07-01', prio: 'C' }]);
    const [garminPush, setGarminPush] = useState(true);
    const [zondag, setZondag] = useState(true);

    const wkg = (ftp && gewicht) ? (ftp / gewicht).toFixed(1).replace('.', ',') : '—';

    return (
      <div style={{ minHeight: '100%', background: 'var(--bg-app)', paddingBottom: 48 }}>
        {/* sticky top-bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', padding: '52px 12px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onBack} aria-label="Terug" style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Chevron dir="left" size={16} color="var(--text-secondary)" />
          </button>
          <h1 style={{ margin: '0 0 0 6px', fontFamily: 'var(--font-sans)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Instellingen</h1>
        </div>

        <div style={{ padding: '18px 16px 0' }}>
          {/* 0 · Jouw coach */}
          <Section title="Jouw coach" footer={
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)', margin: '8px 4px 0', lineHeight: 1.5 }}>
              Deze naam staat bovenaan in de app. Cadans blijft de naam van de app zelf.
            </div>
          }>
            <Row label="Naam van je coach" sub="hoe je gegroet wordt">
              <div>
                <TextField value={coach} onChange={setCoach} placeholder="Coach" full />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {COACH_SUGGESTIES.map((s) => {
                    const on = (coach || '').trim().toLowerCase() === s.toLowerCase();
                    return (
                      <button key={s} onClick={() => setCoach(s)} style={{
                        cursor: 'pointer', borderRadius: 999, padding: '5px 12px',
                        fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600,
                        background: on ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                        border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                        color: on ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all .15s',
                      }}>{s}</button>
                    );
                  })}
                </div>
              </div>
            </Row>
          </Section>

          {/* 1 · Profiel */}
          <Section title="Profiel">
            <Row label="Naam" right={<ReadValue>Daan Korteweg</ReadValue>} />
            <Row label="FTP" right={<NumberField value={ftp} onChange={setFtp} unit="W" />} />
            <Row label="Gewicht" right={<NumberField value={gewicht} onChange={setGewicht} unit="kg" />} />
            <Row label="W/kg" sub="afgeleid" right={<ReadValue mono>{wkg}</ReadValue>} />
            <Row label="FTP automatisch bijwerken" sub="uit intervals.icu" last right={<Toggle on={ftpAuto} onChange={setFtpAuto} />} />
          </Section>

          {/* 2 · Trainingsprofiel */}
          <Section title="Trainingsprofiel">
            <Row label="Volume-profiel" sub="bepaalt je wekelijkse belasting" last>
              <Select value={volume} options={VOLUMES} onChange={setVolume} />
            </Row>
          </Section>

          {/* 3 · Doel & blok */}
          <Section title="Doel & blok">
            <Row label="Trainingsdoel" sub="huidig blok · ~3 maanden">
              <ChoiceGrid value={doel} options={DOELEN} onChange={setDoel} />
            </Row>
            <Row label="Blok-periode" sub="start → einde" last>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}><DateField value={blokStart} onChange={setBlokStart} /></div>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>→</span>
                <div style={{ flex: 1 }}><DateField value={blokEind} onChange={setBlokEind} /></div>
              </div>
            </Row>
          </Section>

          {/* Events */}
          <Section title="Events">
            {events.length === 0 && (
              <div style={{ padding: '18px 14px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-muted)' }}>Nog geen events — voeg er één toe.</div>
            )}
            {events.map((e) => (
              <EventRow key={e.id} ev={e} onChange={updateEvent} onDelete={deleteEvent} last={false} />
            ))}
            <div style={{ padding: '12px 14px' }}>
              <button onClick={addEvent} style={{
                width: '100%', height: 40, borderRadius: 'var(--r-md)', cursor: 'pointer',
                background: 'transparent', border: '1px dashed var(--border-strong)',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 17, lineHeight: 1, color: 'var(--accent)' }}>+</span> Event toevoegen
              </button>
            </div>
          </Section>

          {/* 4 · Koppelingen */}
          <Section title="Koppelingen">
            <Row label="intervals.icu" right={<Badge>Gekoppeld</Badge>} />
            <Row label="Athlete-ID" right={<ReadValue mono>i142357</ReadValue>} />
            <Row label="API-key" right={<ReadValue mono>••••••••</ReadValue>} />
            <Row label={null} last>
              <Button variant="secondary" full onClick={() => {}}>Opnieuw koppelen</Button>
            </Row>
          </Section>
          <Section>
            <Row label="Garmin" sub="via intervals.icu" right={<ReadValue>Gesynct · 2 min geleden</ReadValue>} />
            <Row label="Workouts naar Garmin pushen" last right={<Toggle on={garminPush} onChange={setGarminPush} />} />
          </Section>

          {/* 5 · Meldingen */}
          <Section title="Meldingen">
            <Row label="Zondag-herinnering" sub="beschikbaarheid invullen" last right={<Toggle on={zondag} onChange={setZondag} />} />
          </Section>

          {/* 6 · Account */}
          <Section title="Account">
            <Row label="E-mailadres" right={<ReadValue>daan.korteweg@gmail.com</ReadValue>} />
            <Row label={null} last>
              <Button variant="destructive" full onClick={() => {}}>Uitloggen</Button>
            </Row>
          </Section>

          <div style={{ textAlign: 'center', fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Cadans · v1.4.0 (build 238)
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { SettingsScreen });
})();
