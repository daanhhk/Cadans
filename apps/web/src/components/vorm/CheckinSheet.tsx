import type { CheckinInput } from "@cadans/shared";
import { useEffect, useState } from "react";
import { putCheckin } from "../../lib/api";

type Draft = {
  slaap: string | null;
  benen: string | null;
  stress: string | null;
};

function Seg({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 50,
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 4,
          background: "var(--bg-sunken)",
          borderRadius: "var(--r-pill)",
          padding: 3,
        }}
      >
        {options.map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => onChange(o)}
            style={{
              flex: 1,
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--r-pill)",
              padding: "6px 0",
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "capitalize",
              background: value === o ? "var(--bg-elevated)" : "transparent",
              color: value === o ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: value === o ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// Ochtend-check-in bottom sheet — natgetrokken uit design/src/app.jsx CheckInModal.
// Contract: PUT eist alle drie verplicht → de knop is disabled tot alle drie
// gekozen zijn (we lokken nooit een 400 uit). Prefill uit getCheckin (via `initial`).
export function CheckinSheet({
  open,
  date,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  date: string;
  initial: CheckinInput | null;
  onClose: () => void;
  onSaved: (c: CheckinInput) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    slaap: null,
    benen: null,
    stress: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial ?? { slaap: null, benen: null, stress: null });
      setError(null);
      setSaving(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const ready = !!(draft.slaap && draft.benen && draft.stress);

  async function submit() {
    if (!ready || saving) return;
    const body: CheckinInput = {
      slaap: draft.slaap as string,
      benen: draft.benen as string,
      stress: draft.stress as string,
    };
    setSaving(true);
    setError(null);
    try {
      await putCheckin(date, body);
      onSaved(body);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {/* backdrop = echte button (a11y: klik/toets sluit; geen onClick op een div) */}
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "default",
        }}
      />
      {/* panel ligt boven de backdrop-button → klikken erop sluiten niet */}
      <div
        style={{
          position: "relative",
          width: "100%",
          background: "var(--sheet-bg)",
          borderTopLeftRadius: "var(--sheet-radius)",
          borderTopRightRadius: "var(--sheet-radius)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "var(--sheet-shadow)",
          padding: "10px 18px calc(env(safe-area-inset-bottom, 0px) + 26px)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "var(--sheet-handle)",
            margin: "0 auto 16px",
          }}
        />
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Hoe voel je je vanochtend?
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          Eén keer per dag — dit stemt je gereedheid bij.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 18,
          }}
        >
          <Seg
            label="Slaap"
            value={draft.slaap}
            options={["goed", "matig", "slecht"]}
            onChange={(v) => setDraft((d) => ({ ...d, slaap: v }))}
          />
          <Seg
            label="Benen"
            value={draft.benen}
            options={["fris", "normaal", "zwaar"]}
            onChange={(v) => setDraft((d) => ({ ...d, benen: v }))}
          />
          <Seg
            label="Stress"
            value={draft.stress}
            options={["laag", "normaal", "hoog"]}
            onChange={(v) => setDraft((d) => ({ ...d, stress: v }))}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              borderRadius: "var(--r-md)",
              padding: "8px 12px",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={!ready || saving}
          onClick={submit}
          style={{
            marginTop: 20,
            width: "100%",
            height: 46,
            borderRadius: "var(--r-md)",
            border: "none",
            cursor: ready && !saving ? "pointer" : "default",
            background: ready ? "var(--accent-grad)" : "var(--bg-elevated)",
            color: ready ? "var(--text-on-accent)" : "var(--text-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: 14.5,
            fontWeight: 600,
          }}
        >
          {saving ? "Bezig…" : "Vastleggen"}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 8,
            width: "100%",
            height: 38,
            borderRadius: "var(--r-md)",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          {initial ? "Annuleren" : "Later"}
        </button>
      </div>
    </div>
  );
}
