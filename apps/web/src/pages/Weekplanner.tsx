import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPlanner, putPlanner } from "../lib/api";
import { todayIso, weekMondayIso } from "../lib/dates";
import {
  buildWeekForm,
  type DayForm,
  dayNum,
  formToInputs,
  isoAddDays,
  weekdayLabel,
} from "../lib/planner";
import { bumpPlannerVersion } from "../lib/plannerSignal";

// Weekplanner-editor: losse per-week beschikbaarheid → PUT /api/planner/:monday
// (FULL-REPLACE). Full-screen met eigen terug-knop (geen bottom-nav). Week-navigatie
// vrij vooruit/achteruit; elke week apart geladen via getPlanner (leeg = alles uit).

const fieldStyle: CSSProperties = {
  height: "var(--field-height)",
  background: "var(--field-bg)",
  border: "1px solid var(--field-border)",
  borderRadius: "var(--field-radius)",
  color: "var(--field-text)",
  padding: "0 var(--field-pad-x)",
  fontFamily: "var(--font-num)",
  fontSize: "var(--fs-body)",
  boxSizing: "border-box",
};

const WEEKDAY_FULL: Record<string, string> = {
  ma: "Maandag",
  di: "Dinsdag",
  wo: "Woensdag",
  do: "Donderdag",
  vr: "Vrijdag",
  za: "Zaterdag",
  zo: "Zondag",
};

function DayCard({
  day,
  onChange,
}: {
  day: DayForm;
  onChange: (patch: Partial<DayForm>) => void;
}) {
  const label = WEEKDAY_FULL[weekdayLabel(day.datum)] ?? "";
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3) var(--s-4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-3)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              marginLeft: "var(--s-2)",
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            {dayNum(day.datum)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange({ train: !day.train })}
          aria-pressed={day.train}
          style={{
            flexShrink: 0,
            padding: "5px 12px",
            borderRadius: "var(--r-pill)",
            cursor: "pointer",
            background: day.train ? "var(--accent-soft)" : "var(--bg-sunken)",
            border: `1px solid ${day.train ? "var(--accent)" : "var(--border-strong)"}`,
            color: day.train ? "var(--accent)" : "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
          }}
        >
          {day.train ? "Trainen" : "Rustdag"}
        </button>
      </div>

      {day.train && (
        <div
          style={{
            marginTop: "var(--s-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}
          >
            <input
              type="range"
              min={30}
              max={360}
              step={15}
              value={Number(day.minuten) || 120}
              onChange={(e) => onChange({ minuten: e.target.value })}
              aria-label="Minuten"
              style={{
                flex: 1,
                accentColor: "var(--slider-fill)",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                flexShrink: 0,
                minWidth: 52,
                textAlign: "right",
                fontFamily: "var(--font-num)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {Number(day.minuten) || 120} min
            </span>
            <button
              type="button"
              onClick={() => onChange({ pendel: !day.pendel })}
              aria-pressed={day.pendel}
              style={{
                flexShrink: 0,
                height: "var(--field-height)",
                padding: "0 16px",
                borderRadius: "var(--r-pill)",
                cursor: "pointer",
                background: day.pendel
                  ? "var(--accent-soft)"
                  : "var(--bg-sunken)",
                border: `1px solid ${day.pendel ? "var(--accent)" : "var(--border-strong)"}`,
                color: day.pendel ? "var(--accent)" : "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
              }}
            >
              Pendel
            </button>
          </div>
          <input
            type="text"
            value={day.toelichting}
            onChange={(e) => onChange({ toelichting: e.target.value })}
            placeholder="Toelichting (optioneel)"
            aria-label="Toelichting"
            style={{
              ...fieldStyle,
              width: "100%",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
            }}
          />
        </div>
      )}
    </div>
  );
}

const SCOPES: { key: "dag" | "week" | "volgende"; label: string }[] = [
  { key: "dag", label: "Alleen deze dag" },
  { key: "week", label: "Deze week" },
  { key: "volgende", label: "Volgende week" },
];

export function Weekplanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const thisMonday = weekMondayIso();
  const nextMonday = isoAddDays(thisMonday, 7);
  // Geselecteerde dag uit ?dag=<datum> (vanuit de dagkaart-knop); fallback = vandaag.
  const selectedDatum = searchParams.get("dag") || todayIso();
  // 3 scopes (GAS availScope): "dag" toont alleen de geselecteerde dag; "week"/"volgende" de hele week.
  const [scope, setScope] = useState<"dag" | "week" | "volgende">("dag");
  const monday = scope === "volgende" ? nextMonday : thisMonday;
  const [form, setForm] = useState<DayForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(
    null,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is een bewuste re-fetch-trigger (na opslaan) — geen echte data-afhankelijkheid.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    setNote(null);
    getPlanner(monday)
      .then((rows) => {
        if (!alive) return;
        setForm(buildWeekForm(monday, rows));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [monday, nonce]);

  const patchDay = (i: number) => (patch: Partial<DayForm>) => {
    setForm((f) => f.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setNote(null);
  };

  async function save() {
    if (saving) return;
    setSaving(true);
    setNote(null);
    try {
      await putPlanner(monday, formToInputs(form));
      // Signaleer de Schema-tab (planner-mutatie) → die herbouwt het voorstel automatisch,
      // puur uit planner_days (geen intervals-sync). Lokaal re-fetcht deze editor via nonce.
      bumpPlannerVersion();
      setNote({ text: "Opgeslagen — je schema is bijgewerkt", error: false });
      setNonce((n) => n + 1);
    } catch (e: unknown) {
      setNote({
        text: `Opslaan mislukt: ${e instanceof Error ? e.message : ""}`,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  // Zichtbare dagen (met echte form-index voor patchDay): scope "dag" -> alleen de geselecteerde dag;
  // anders alle 7. In ELK geval slaat save de HELE (afgeleide) week op (GAS: alleen die dag gewijzigd).
  const rows = form.map((day, i) => ({ day, i }));
  const visible =
    scope === "dag"
      ? rows.filter(({ day }) => day.datum === selectedDatum)
      : rows;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-app)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--bg-app)",
          borderBottom: "1px solid var(--border-subtle)",
          padding:
            "calc(env(safe-area-inset-top, 0px) + 14px) var(--s-3) var(--s-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-1)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Terug"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-pill)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 13 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 2L4 7l5 5"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1
          style={{
            margin: "0 0 0 var(--s-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h1)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Weekplanner
        </h1>
      </div>

      <div style={{ padding: "var(--s-4) var(--s-4) 48px" }}>
        {/* scope-tabs (GAS av-seg): alleen deze dag / deze week / volgende week — geen vrije navigatie */}
        <div
          style={{
            display: "flex",
            gap: "var(--s-1)",
            marginBottom: "var(--s-4)",
            background: "var(--bg-sunken)",
            borderRadius: "var(--r-pill)",
            padding: 3,
          }}
        >
          {SCOPES.map((s) => {
            const on = scope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                aria-pressed={on}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  cursor: "pointer",
                  background: on ? "var(--accent-soft)" : "transparent",
                  color: on ? "var(--accent)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={loadingStyle}>Laden…</div>
        ) : loadError ? (
          <div style={{ ...loadingStyle, color: "var(--danger)" }}>
            {loadError}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-2)",
              }}
            >
              {visible.map(({ day, i }) => (
                <DayCard key={day.datum} day={day} onChange={patchDay(i)} />
              ))}
            </div>

            {note && (
              <div
                style={{
                  marginTop: "var(--s-4)",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: note.error
                    ? "var(--danger-soft)"
                    : "var(--good-soft)",
                  border: `1px solid ${note.error ? "var(--danger)" : "var(--good)"}`,
                  color: note.error ? "var(--danger)" : "var(--good)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  fontWeight: 600,
                }}
              >
                {note.text}
              </div>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                marginTop: "var(--s-4)",
                width: "100%",
                height: "var(--btn-height)",
                borderRadius: "var(--btn-radius)",
                border: "none",
                cursor: saving ? "default" : "pointer",
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-h3)",
                fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Opslaan…" : "Beschikbaarheid opslaan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const loadingStyle: CSSProperties = {
  padding: "40px 8px",
  textAlign: "center",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-label)",
  color: "var(--text-muted)",
};
