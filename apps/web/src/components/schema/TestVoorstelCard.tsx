import type { DayOverride } from "@cadans/shared";
import { useState } from "react";
import { putOverride } from "../../lib/api";
import {
  testAanbodRegel,
  testActieLabel,
  testAfwijsLabel,
  testBadgeLabel,
} from "../../lib/coachNarrative";
import { weekdagNaam } from "../../lib/dates";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import type { TestVoorstel } from "../../lib/testvoorstel";
import { CoachCallout } from "./CoachCallout";

// 5b-ii — het TESTVOORSTEL in de rustweek. Spiegelt VerlengCard: CoachCallout met de aanbod-copy,
// een accept-knop die via de BESTAANDE override-keten schrijft (putOverride → PUT
// /api/override/:date → ProposalDay.override → OverriddenDetail + "Terug naar voorstel"), dus
// omkeerbaar en zonder parallelle weergave-weg. Afwijzen is sessie-scoped, géén D1.

/** Sessie-scoped afwijzing op BLOKSTART, niet op datum: "niet dit blok" moet ook gelden als er nog
 * een andere kandidaat-dag in dezelfde week overblijft. MODULE-level (overleeft remount na sync,
 * niet een app-herstart) — zelfde semantiek als isVerlengAfgewezen. */
const afgewezen = new Set<string>();

export function isTestVoorstelAfgewezen(blokStart: string): boolean {
  return afgewezen.has(blokStart);
}

export function TestVoorstelCard({
  voorstel,
  coachNaam,
  onDismiss,
}: {
  voorstel: TestVoorstel;
  coachNaam: string | null;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const weekdag = weekdagNaam(voorstel.datum);

  async function plan() {
    if (saving) return;
    setSaving(true);
    try {
      const ov: DayOverride = {
        type: "library",
        workoutType: "test",
        durMin: voorstel.durMin,
        // `label` markeert de override als HET testvoorstel (testResultaat leest 'm voor de
        // resultaat-copy). BEWUST GEEN src:'readiness' — dat is de Verlicht-marker.
        label: testBadgeLabel(),
      };
      await putOverride(voorstel.datum, ov);
      bumpPlannerVersion();
    } catch {
      setSaving(false); // schrijf mislukt → knop weer bruikbaar, scherm intact
    }
  }

  function dismiss() {
    afgewezen.add(voorstel.blokStart);
    onDismiss();
  }

  const knop: React.CSSProperties = {
    width: "100%",
    marginTop: "var(--s-3)",
    height: "var(--btn-height)",
    padding: "0 16px",
    borderRadius: "var(--r-pill)",
    cursor: saving ? "default" : "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-label)",
    fontWeight: 600,
  };

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <CoachCallout
        narrative={testAanbodRegel({
          weekdag,
          beschikbaarMin: voorstel.beschikbaarMin,
          laatsteMeting: voorstel.laatsteMeting,
          dagenSinds: voorstel.dagenSinds,
        })}
        coachNaam={coachNaam}
      />
      <button
        type="button"
        onClick={plan}
        disabled={saving}
        style={{
          ...knop,
          background: "var(--btn-primary-bg)",
          border: "1px solid transparent",
          color: "var(--btn-primary-text)",
        }}
      >
        {testActieLabel(weekdag)}
      </button>
      <button
        type="button"
        onClick={dismiss}
        disabled={saving}
        style={{
          ...knop,
          background: "var(--btn-secondary-bg)",
          border: "1px solid var(--btn-secondary-border)",
          color: "var(--btn-secondary-text)",
        }}
      >
        {testAfwijsLabel()}
      </button>
    </div>
  );
}
