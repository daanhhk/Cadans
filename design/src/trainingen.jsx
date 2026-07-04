// trainingen.jsx — Trainingen-tab: categorie-overzicht → varianten → workout-detail
// Export to window: TrainingenTab
(function () {
  const { useState } = React;
  const { WORKOUT_CATS, CategoryCard, VariantRow, WorkoutDetail, DurationSlider, buildWorkout } = window;

  const Over = ({ children, style }) => (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', ...style }}>{children}</div>
  );
  const BackBar = ({ title, sub, onBack }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <button onClick={onBack} aria-label="Terug" style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {sub && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );

  function TrainingenTab() {
    const [view, setView] = useState('cats');
    const [cat, setCat] = useState(null);
    const [variant, setVariant] = useState(null);
    const [target, setTarget] = useState(75);

    if (view === 'workout' && variant && cat) {
      const wo = buildWorkout(variant, target);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BackBar title={cat.naam} sub="Workout-detail" onBack={() => setView('category')} />
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '14px 14px' }}>
            <DurationSlider value={target} onChange={setTarget} />
          </div>
          <WorkoutDetail wo={wo} overline="Workout" onAction={() => {}} actionLabel="Inplannen" />
        </div>
      );
    }

    if (view === 'category' && cat) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BackBar title={cat.naam} sub={cat.desc} onBack={() => setView('cats')} />
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)', padding: '14px 14px' }}>
            <DurationSlider value={target} onChange={setTarget} />
          </div>
          <Over>Varianten</Over>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cat.variants.map((v) => (
              <VariantRow key={v.id} wo={buildWorkout(v, target)} onClick={() => { setVariant(v); setView('workout'); }} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Over style={{ marginBottom: 2 }}>Bibliotheek · per categorie</Over>
        {WORKOUT_CATS.map((c) => (
          <CategoryCard key={c.key} cat={c} onClick={() => { setCat(c); setTarget(c.def); setView('category'); }} />
        ))}
      </div>
    );
  }

  Object.assign(window, { TrainingenTab });
})();
