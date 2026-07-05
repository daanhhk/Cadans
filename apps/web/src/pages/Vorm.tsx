import type {
  CheckinInput,
  SettingsInput,
  WellnessInput,
} from "@cadans/shared";
import { useEffect, useMemo, useState } from "react";
import { CheckinSheet } from "../components/vorm/CheckinSheet";
import { ConditiePmc } from "../components/vorm/ConditiePmc";
import { LevelCard } from "../components/vorm/LevelCard";
import { MetricRow } from "../components/vorm/MetricRow";
import { ReadinessCard } from "../components/vorm/ReadinessCard";
import { getCheckin, getSettings, getWellness } from "../lib/api";
import { todayIso } from "../lib/dates";
import { deriveReadiness } from "../lib/readiness";

// Vorm-tab (Vorm-lite, Fase 5.1b) — vervangt de 5.1a-health-steiger. Data uit drie
// schone routes: GET /api/settings, GET /api/wellness, GET+PUT /api/checkin/:date.
// Volgorde uit het prototype: ReadinessCard · LevelCard · MetricRow · Conditie-balans.
export function Vorm() {
  const [settings, setSettings] = useState<SettingsInput | null>(null);
  const [wellness, setWellness] = useState<WellnessInput[]>([]);
  const [checkin, setCheckin] = useState<CheckinInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const date = todayIso();

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is een bewuste reload-trigger (de "Opnieuw"-knop) — geen echte data-afhankelijkheid.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([getSettings(), getWellness(), getCheckin(date)])
      .then(([s, w, c]) => {
        if (!alive) return;
        setSettings(s);
        setWellness(w);
        setCheckin(c);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [date, nonce]);

  // Readiness client-side afgeleid uit de al-gefetchte reeks + check-in (hook vóór de
  // early returns; lege reeks → score null, geen crash).
  const readiness = useMemo(
    () => deriveReadiness(wellness, checkin),
    [wellness, checkin],
  );

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
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
          {error}
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Opnieuw
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingTop: 8,
      }}
    >
      <ReadinessCard
        readiness={readiness}
        onOpenCheckin={() => setSheetOpen(true)}
      />
      <LevelCard settings={settings} />
      <MetricRow settings={settings} />
      <ConditiePmc rows={wellness} />

      <CheckinSheet
        open={sheetOpen}
        date={date}
        initial={checkin}
        onClose={() => setSheetOpen(false)}
        onSaved={(c) => {
          setCheckin(c);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}
