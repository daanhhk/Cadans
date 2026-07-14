import type { DispositionReason } from "@cadans/shared";
import { useState } from "react";
import { putDisposition } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { DISPOSITION_LABELS } from "../../lib/schema";
import { CoachCallout } from "./CoachCallout";

// GemistCard (A4) — byte-exact GAS gemistKaart_ (Script.html:458): "Gemist[ · <reden>]" +
// een "Terug"-knop die de disposition wist (PUT null) + bumpPlannerVersion() → de dag valt
// terug naar zijn onderliggende plan-state. NA de rij toont de kaart nu ook de gemist-coach-
// narrative (missedCoach_) in het gedeelde CoachCallout-formaat (geruststellende toon, impact=false).
// Bare block (zit in de dag-detail-Card).
export function GemistCard({
  reason,
  date,
  narrative,
  coachNaam,
}: {
  reason: DispositionReason | null;
  date: string;
  narrative: string | null;
  coachNaam: string | null;
}) {
  const [saving, setSaving] = useState(false);

  async function undo() {
    if (saving) return;
    setSaving(true);
    try {
      await putDisposition(date, null);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        style={{
          marginTop: "var(--s-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-3)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Gemist{reason ? ` · ${DISPOSITION_LABELS[reason]}` : ""}
        </div>
        <button
          type="button"
          onClick={undo}
          disabled={saving}
          style={{
            flexShrink: 0,
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
          Terug
        </button>
      </div>
      {narrative && (
        <CoachCallout
          narrative={narrative}
          coachNaam={coachNaam}
          impact={false}
          style={{ marginTop: "var(--s-4)", marginBottom: "var(--s-6)" }}
        />
      )}
    </>
  );
}
