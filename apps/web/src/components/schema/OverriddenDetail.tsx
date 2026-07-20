import type { DayOverride } from "@cadans/shared";
import { useState } from "react";
import { putOverride } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { durLabel, type SchemaSession } from "../../lib/schema";
import { CoachCallout } from "./CoachCallout";
import { WorkoutDetail } from "./WorkoutDetail";

// OverriddenDetail (3b) — spiegelt GAS `overrideKaart_` (Script.html:2043). Toont een handmatig
// gekozen training: een pin "Handmatig gekozen" + de body (vrije/groep-rit óf de library-workout via
// WorkoutDetail) + een "Terug naar voorstel"-knop die de override wist. Bare block (zit in de
// bestaande dag-detail-Card). Tokens-only (UI-KADER). Cadans regenereert al → `session` IS de
// engine-gebouwde buildOverrideWorkout_; geen library-lookup / trnScale_ nodig (zie 3b-recon).

function OverridePin() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: "var(--text-muted)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "var(--text-secondary)",
        }}
      >
        Handmatig gekozen
      </span>
    </div>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "var(--r-pill)",
        border: "1px solid var(--border-strong)",
        background: "var(--bg-sunken)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
        color: "var(--text-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// Vrije/groep-rit — BEWUSTE GAS-parity (freeRideCardHtml_, Script.html:2036): GEEN zone-bar, GEEN
// IF/TSS (de TSS is gesynthetiseerd uit een intensiteit-aanname en telt wél in de WeekLoad).
function FreeRideCard({
  override,
  session,
}: {
  override: Extract<DayOverride, { type: "free" }>;
  session: SchemaSession | null;
}) {
  const naam = override.ritType === "groep" ? "Groepsrit" : "Vrije rit";
  return (
    <div style={{ marginTop: "var(--s-3)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {naam}
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--s-2)",
          marginTop: "var(--s-2)",
          flexWrap: "wrap",
        }}
      >
        <Chip>{durLabel(session?.totaalMin ?? override.durMin)}</Chip>
        <Chip>{override.intensiteit}</Chip>
      </div>
      <div
        style={{
          marginTop: "var(--s-3)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
          lineHeight: "var(--lh-label)",
        }}
      >
        Op gevoel — geen vaste blokstructuur.
      </div>
    </div>
  );
}

export function OverriddenDetail({
  override,
  session,
  date,
  coachRegel = null,
  coachNaam = null,
}: {
  override: DayOverride;
  session: SchemaSession | null;
  date: string;
  /** LAAG 2: coach-resultaatregel bij een geaccepteerd verlicht-voorstel (src:'readiness');
   * null bij een handmatige override — die krijgt geen coach-regel (de pin IS de reden). */
  coachRegel?: string | null;
  coachNaam?: string | null;
}) {
  const [saving, setSaving] = useState(false);

  async function revert() {
    if (saving) return;
    setSaving(true);
    try {
      await putOverride(date, null);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <OverridePin />
      {coachRegel && (
        <CoachCallout
          narrative={coachRegel}
          coachNaam={coachNaam ?? null}
          style={{ marginTop: "var(--s-3)" }}
        />
      )}
      {override.type === "rest" ? (
        // T28 fase 2a-i: bewuste rustdag. Geen workout, geen duur — dezelfde copy als een
        // gewone rustdag, maar mét de pin + "Terug naar voorstel" hieromheen, zodat
        // zichtbaar is dat dit een KEUZE was en hij terug te draaien is.
        <div
          style={{
            marginTop: "var(--s-3)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "var(--s-5) var(--s-2) var(--s-2)",
            lineHeight: "var(--lh-body)",
          }}
        >
          Rustdag — van herstel word je beter.
        </div>
      ) : override.type === "free" ? (
        <FreeRideCard override={override} session={session} />
      ) : session ? (
        <div style={{ marginTop: "var(--s-3)" }}>
          <WorkoutDetail session={session} />
        </div>
      ) : (
        <div
          style={{
            marginTop: "var(--s-3)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-muted)",
          }}
        >
          Gekozen training: {override.workoutType}
        </div>
      )}
      <button
        type="button"
        onClick={revert}
        disabled={saving}
        style={{
          width: "100%",
          marginTop: "var(--s-4)",
          height: "var(--btn-height)",
          padding: "0 16px",
          borderRadius: "var(--r-pill)",
          cursor: saving ? "default" : "pointer",
          background: "var(--bg-sunken)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
        }}
      >
        Terug naar voorstel
      </button>
    </div>
  );
}
