import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, putSettings } from "../lib/api";
import {
  DOEL_OPTIONS,
  EMPTY_FORM,
  FASE_OPTIONS,
  legToRoundTrip,
  PROFIEL_PRESET_OPTIONS,
  roundTripToLeg,
  type SettingsForm,
  settingsFormToBody,
  settingsToForm,
} from "../lib/settings";

// Instellingen-scherm: pre-fill uit GET /api/settings, bewerk alle 12
// EngineSettings-velden, sla op via PUT (FULL-REPLACE). Full-screen met eigen
// terug-knop (geen bottom-nav) — spiegelt design/src/settings.jsx. Minder-
// prominente velden (hartslag/pendel/fase) in een "Geavanceerd"-sectie, maar ze
// worden ALTIJD meegestuurd (anders wist full-replace ze).

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--s-5)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--tracking-overline)",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 var(--s-1) var(--s-2)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  sub,
  children,
  last,
}: {
  label: string;
  sub?: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "var(--s-3) var(--s-4)",
        borderBottom: last ? "none" : "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h3)",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

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

function NumInput({
  value,
  onChange,
  unit,
}: {
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-1)" }}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...fieldStyle,
          width: 84,
          textAlign: "right",
          fontWeight: 600,
        }}
      />
      {unit && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
            width: 20,
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldStyle, width: 168, fontFamily: "var(--font-sans)" }}
    />
  );
}

const COACH_PRESETS = ["Coach", "Daan", "Merckx", "Sven", "Anna"];
function CoachPresetChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
      {COACH_PRESETS.map((p) => {
        const on = value.trim() === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--r-pill)",
              cursor: "pointer",
              background: on ? "var(--accent-soft)" : "var(--bg-sunken)",
              border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
              color: on ? "var(--accent)" : "var(--text-secondary)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
            }}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--s-2)",
        width: "100%",
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              textAlign: "center",
              padding: "var(--s-2) var(--s-3)",
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              background: on ? "var(--accent-soft)" : "var(--bg-sunken)",
              border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
              color: on ? "var(--accent)" : "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; sub?: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...fieldStyle,
        width: "100%",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
          {o.sub ? ` · ${o.sub}` : ""}
        </option>
      ))}
    </select>
  );
}

function BackChevron() {
  return (
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
  );
}

export function Instellingen() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is een bewuste re-fetch-trigger (na opslaan) — geen echte data-afhankelijkheid.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    getSettings()
      .then((s) => {
        if (!alive) return;
        setForm(settingsToForm(s));
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
  }, [nonce]);

  const set = (k: keyof SettingsForm) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
    setSaveError(null);
  };

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await putSettings(settingsFormToBody(form));
      setSaved(true);
      // Invalideer: re-fetch de server-waarheid; andere tabs halen settings
      // opnieuw op bij hun eigen mount (geen gedeelde cache).
      setNonce((n) => n + 1);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  }

  const ftpN = Number(form.ftp);
  const gewN = Number(form.gewicht);
  const wkg =
    form.ftp.trim() && form.gewicht.trim() && !Number.isNaN(ftpN) && gewN > 0
      ? (ftpN / gewN).toFixed(1).replace(".", ",")
      : "—";

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
          <BackChevron />
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
          Instellingen
        </h1>
      </div>

      <div style={{ padding: "var(--s-4) var(--s-4) 48px" }}>
        {loading ? (
          <div
            style={{
              padding: "40px 8px",
              textAlign: "center",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
            }}
          >
            Laden…
          </div>
        ) : loadError ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--s-3)",
              padding: "40px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--danger)",
              }}
            >
              {loadError}
            </div>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              style={{
                height: "var(--btn-height)",
                padding: "0 16px",
                borderRadius: "var(--btn-radius)",
                border: "1px solid var(--btn-secondary-border)",
                background: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Opnieuw
            </button>
          </div>
        ) : (
          <>
            <Section title="Profiel">
              <Row label="Naam" sub="voor je avatar-initialen">
                <TextInput
                  value={form.naam}
                  onChange={set("naam")}
                  maxLength={24}
                  placeholder="Je naam"
                />
              </Row>
              <Row label="FTP" sub="drempelvermogen">
                <NumInput value={form.ftp} onChange={set("ftp")} unit="W" />
              </Row>
              <Row label="Gewicht">
                <NumInput
                  value={form.gewicht}
                  onChange={set("gewicht")}
                  unit="kg"
                />
              </Row>
              <Row label="W/kg" sub="afgeleid" last>
                <span
                  style={{
                    fontFamily: "var(--font-num)",
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {wkg}
                </span>
              </Row>
            </Section>

            <Section title="Trainingsprofiel">
              <Row label="Volume-profiel" sub="wekelijkse belasting" last>
                <div style={{ width: 168 }}>
                  <SelectInput
                    value={form.profielPreset}
                    options={PROFIEL_PRESET_OPTIONS}
                    onChange={set("profielPreset")}
                  />
                </div>
              </Row>
            </Section>

            <Section title="Jouw coach">
              <div style={{ padding: "var(--s-3) var(--s-4)" }}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-label)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "var(--s-2)",
                  }}
                >
                  Coachnaam{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    · header-woordmerk
                  </span>
                </div>
                <TextInput
                  value={form.coachNaam}
                  onChange={set("coachNaam")}
                  maxLength={24}
                  placeholder="Coach"
                />
                <div style={{ marginTop: "var(--s-3)" }}>
                  <CoachPresetChips
                    value={form.coachNaam}
                    onChange={set("coachNaam")}
                  />
                </div>
              </div>
            </Section>

            <Section title="Doel & blok">
              <div
                style={{
                  padding: "var(--s-3) var(--s-4)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-h3)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: "var(--s-2)",
                  }}
                >
                  Trainingsdoel
                </div>
                <Segmented
                  value={form.doel}
                  options={DOEL_OPTIONS}
                  onChange={set("doel")}
                />
              </div>
              <Row label="Blok-start" sub="yyyy-MM-dd">
                <input
                  type="date"
                  value={form.doelStart}
                  onChange={(e) => set("doelStart")(e.target.value)}
                  style={{ ...fieldStyle, width: 160, colorScheme: "dark" }}
                />
              </Row>
              <Row label="Blok-duur" sub="weken" last>
                <NumInput
                  value={form.doelDuur}
                  onChange={set("doelDuur")}
                  unit="wk"
                />
              </Row>
            </Section>

            <Section title="Geavanceerd · hartslag">
              <Row label="Drempel-HR (LTHR)">
                <NumInput value={form.lthr} onChange={set("lthr")} unit="bpm" />
              </Row>
              <Row label="Max-HR">
                <NumInput
                  value={form.hrMax}
                  onChange={set("hrMax")}
                  unit="bpm"
                />
              </Row>
              <Row label="Rust-HR" last>
                <NumInput
                  value={form.hrRest}
                  onChange={set("hrRest")}
                  unit="bpm"
                />
              </Row>
            </Section>

            <Section title="Geavanceerd · pendel & fase">
              <Row label="Pendel (enkele reis)" sub="heen + terug = 2×">
                <NumInput
                  value={
                    form.pendelDuurMin.trim()
                      ? String(roundTripToLeg(Number(form.pendelDuurMin)))
                      : ""
                  }
                  onChange={(v) =>
                    set("pendelDuurMin")(
                      v.trim() ? String(legToRoundTrip(Number(v))) : "",
                    )
                  }
                  unit="min"
                />
              </Row>
              <Row label="Pendel-ritten" sub="per pendeldag">
                <NumInput
                  value={form.pendelAantal}
                  onChange={set("pendelAantal")}
                  unit="×"
                />
              </Row>
              <Row label="Fase-override" sub="normaal automatisch" last>
                <div style={{ width: 168 }}>
                  <SelectInput
                    value={form.fase}
                    options={FASE_OPTIONS}
                    onChange={set("fase")}
                  />
                </div>
              </Row>
            </Section>

            {saveError && (
              <div
                style={{
                  marginBottom: "var(--s-3)",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: "var(--danger-soft)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                }}
              >
                Opslaan mislukt: {saveError}
              </div>
            )}
            {saved && !saveError && (
              <div
                style={{
                  marginBottom: "var(--s-3)",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: "var(--good-soft)",
                  border: "1px solid var(--good)",
                  color: "var(--good)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  fontWeight: 600,
                }}
              >
                Opgeslagen ✓
              </div>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
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
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
