import type { DayOverride } from "@cadans/shared";
import { useState } from "react";
import { putOverride } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import type { VerlichtVoorstel } from "../../lib/schema";
import { CoachCallout } from "./CoachCallout";

// LAAG 2 — het per-dag verlicht-VOORSTEL op de vandaag-dagkaart.
// Meetlat: GAS WebApp.gs:1198-1226 (readiness-overlay als SUGGESTIE, niet als mutatie).
//
// Het voorstel muteert niets. [Verlicht…] schrijft een dag-override met src:'readiness' via de
// BESTAANDE keten (putOverride → PUT /api/override/:date → ProposalDay.override →
// OverriddenDetail + "Terug naar voorstel"), dus omkeerbaar en zonder parallelle weergave-weg.
// [Hou origineel] klapt het voorstel in voor deze sessie — géén nieuwe D1-persistentie.

/** Sessie-scoped "niet meer aanbieden"-set (per datum). MODULE-level, niet component-state:
 * zo overleeft de keuze een re-render én een remount na een sync/refresh, maar NIET een
 * app-herstart — precies de bedoelde semantiek ("komt terug bij een volgende app-open,
 * zolang de band nog caution/rest is"). Bewust geen localStorage/D1. */
const afgewezen = new Set<string>();

export function isVerlichtAfgewezen(datum: string): boolean {
  return afgewezen.has(datum);
}

export function VerlichtCard({
  voorstel,
  coachNaam,
  onDismiss,
}: {
  voorstel: VerlichtVoorstel;
  coachNaam: string | null;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function schrijf(ov: DayOverride) {
    if (saving) return;
    setSaving(true);
    try {
      await putOverride(voorstel.datum, ov);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  function houOrigineel() {
    afgewezen.add(voorstel.datum);
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
      <CoachCallout narrative={voorstel.regel} coachNaam={coachNaam} />
      {/* T28 fase 2a-ii: bij lage gereedheid staan er DRIE keuzes. `wrap` laat ze op een
          smal scherm netjes stapelen i.p.v. samen te knijpen. */}
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
          onClick={() => schrijf(voorstel.override)}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {voorstel.actieLabel}
        </button>
        {voorstel.restOverride && (
          // Gelijkwaardige tweede keuze: helemaal niet rijden. Secundaire stijl — de coach
          // BEVEELT de herstelrit aan, maar dringt rust niet op en verstopt 'm ook niet.
          <button
            type="button"
            onClick={() => {
              if (voorstel.restOverride) schrijf(voorstel.restOverride);
            }}
            disabled={saving}
            style={{
              ...knop,
              background: "var(--btn-secondary-bg)",
              border: "1px solid var(--btn-secondary-border)",
              color: "var(--btn-secondary-text)",
            }}
          >
            {voorstel.restActieLabel}
          </button>
        )}
        <button
          type="button"
          onClick={houOrigineel}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          Hou origineel
        </button>
      </div>
    </div>
  );
}
