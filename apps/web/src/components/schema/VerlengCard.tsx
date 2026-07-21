import type { DayOverride } from "@cadans/shared";
import { useState } from "react";
import { putOverride } from "../../lib/api";
import {
  verlengAanbodRegel,
  verlengActieLabel,
  verlengBadgeLabel,
} from "../../lib/coachNarrative";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { CoachCallout } from "./CoachCallout";

// 3d stap 2b — het per-dag VERLENG-aanbod op een opbouwweek-duurrit. De motor capt de lange rit
// op de ingestelde dag-minuten (3d stap 2); deze kaart biedt aan die te verlengen als er meer
// tijd is. Spiegelt VerlichtCard: dezelfde CoachCallout voor de aanbod-copy + accept-knop, en
// schrijft via de BESTAANDE override-keten (putOverride → PUT /api/override/:date →
// ProposalDay.override → OverriddenDetail + "Terug naar voorstel"), dus omkeerbaar en zonder
// parallelle weergave-weg. [Nee, hou X] klapt het aanbod in voor deze sessie — géén D1-persistentie.

/** Sessie-scoped "niet meer aanbieden"-set (per datum). MODULE-level (overleeft remount na sync,
 * NIET een app-herstart) — exact dezelfde semantiek als VerlichtCard. */
const afgewezen = new Set<string>();

export function isVerlengAfgewezen(datum: string): boolean {
  return afgewezen.has(datum);
}

export function VerlengCard({
  datum,
  vanMin,
  naarMin,
  coachNaam,
  onDismiss,
}: {
  datum: string;
  vanMin: number;
  naarMin: number;
  coachNaam: string | null;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function verleng() {
    if (saving) return;
    setSaving(true);
    try {
      const ov: DayOverride = {
        type: "library",
        workoutType: "long_z2",
        durMin: naarMin,
        // `label` markeert de override als een verleng (verlengResultaat leest 'm voor de
        // resultaat-copy). BEWUST GEEN src:'readiness' — dat is de Verlicht-marker en zou
        // verlichtResultaat de verleng laten kapen.
        label: verlengBadgeLabel(naarMin),
      };
      await putOverride(datum, ov);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  function houIngesteld() {
    afgewezen.add(datum);
    onDismiss();
  }

  const knop: React.CSSProperties = {
    flex: 1,
    height: "var(--btn-height)",
    padding: "0 14px",
    borderRadius: "var(--r-pill)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-label)",
    fontWeight: 600,
    cursor: saving ? "default" : "pointer",
  };

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <CoachCallout
        narrative={verlengAanbodRegel(vanMin, naarMin)}
        coachNaam={coachNaam}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--s-3)",
          marginTop: "var(--s-3)",
        }}
      >
        <button
          type="button"
          onClick={verleng}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {verlengActieLabel(naarMin)}
        </button>
        <button
          type="button"
          onClick={houIngesteld}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          {`Nee, hou ${vanMin}`}
        </button>
      </div>
    </div>
  );
}
