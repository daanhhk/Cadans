import { useState } from "react";
import { putRpe } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";

// RPE-rating (1-10) op de voltooide-rit-kaart — port van GAS rpeRatingHtml_ (Script.html:419).
// Schrijft via PUT /api/rpe/:date; na een write bumpPlannerVersion() zodat de readiness/plan
// (die de engine uit de rpe-rijen berekent) meebeweegt. Optimistische highlight + rollback bij fout.
export function RpeRating({
  date,
  initial,
}: {
  date: string;
  initial: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const [saving, setSaving] = useState(false);

  async function pick(n: number) {
    if (saving) return;
    const prev = value;
    setSaving(true);
    setValue(n);
    try {
      await putRpe(date, n);
      bumpPlannerVersion();
    } catch {
      setValue(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "var(--s-2)",
        }}
      >
        RPE — hoe zwaar voelde het?
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              aria-pressed={on}
              disabled={saving}
              style={{
                flex: 1,
                height: 34,
                minWidth: 0,
                padding: 0,
                borderRadius: "var(--r-xs)",
                cursor: saving ? "default" : "pointer",
                background: on ? "var(--accent-soft)" : "var(--bg-sunken)",
                border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
                color: on ? "var(--accent)" : "var(--text-secondary)",
                fontFamily: "var(--font-num)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
