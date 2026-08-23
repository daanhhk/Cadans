import type { DayOverride } from "@cadans/shared";
import { useState } from "react";
import { type IjkAntwoord, putIjking, putOverride } from "../../lib/api";
import {
  testAanbodRegel,
  testActieLabel,
  testAfwijsLabel,
  testBadgeLabel,
  testBevestigLabel,
  testBevestigUitleg,
} from "../../lib/coachNarrative";
import { weekdagNaam } from "../../lib/dates";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import type { TestVoorstel } from "../../lib/testvoorstel";
import { CoachCallout } from "./CoachCallout";

// 5b-ii — het TESTVOORSTEL in de doelblok-opening. Spiegelt VerlengCard: CoachCallout met de aanbod-copy,
// een accept-knop die via de BESTAANDE override-keten schrijft (putOverride → PUT
// /api/override/:date → ProposalDay.override → OverriddenDetail + "Terug naar voorstel"), dus
// omkeerbaar en zonder parallelle weergave-weg. De twee andere uitgangen schrijven sinds
// 23-08-2026 wél D1 — `sync_state.ijking_blok` plus `ijking_antwoord`, zie hieronder.

// DE VLUCHTIGE MODULE-SET IS OP 23-08-2026 VERDWENEN (ROADMAP punt 59). Zij hield de afwijzing in
// een `Set<string>` op blokstart, overleefde een remount na sync maar GEEN app-herstart — dus na een
// herstart stond dezelfde vraag er weer, terwijl M92 zegt dat er per doelblok-opening hoogstens ÉÉN
// aanbod is. Het antwoord staat nu op `sync_state.ijking_blok` plus `sync_state.ijking_antwoord`, en
// de POORT staat in de pure laag (`buildTestVoorstel`, poort (2b)) en niet meer in deze component.
// Twee antwoorden op één vraag horen niet op twee plekken te wonen.

export function TestVoorstelCard({
  voorstel,
  coachNaam,
}: {
  voorstel: TestVoorstel;
  coachNaam: string | null;
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

  /** De twee uitgangen die GEEN override opleveren. Beide schrijven hetzelfde kolommenpaar; het
   * verschil zit in wat de app er daarna over vertelt (`ijkStaatRegel`). Faalt de schrijfactie, dan
   * blijft de kaart staan — een weggeklikt aanbod dat niet bewaard is, is erger dan een kaart die
   * nog even blijft.
   *
   * DE KAART VERDWIJNT VIA DE HERLAADRONDE, niet via een lokale vlag. `bumpPlannerVersion` laat
   * `loadSchemaWeek` opnieuw lopen, die leest `ijking_blok` en poort (2b) levert dan null. Dat is
   * dezelfde weg als de plan-knop. Tot 23-08-2026 riep deze functie ook een `onDismiss` aan; die
   * bumpte een teller in `SchemaView` die de render-guard `!isTestVoorstelAfgewezen(...)` liet
   * her-evalueren. Die guard is met de vluchtige module-`Set` verdwenen, dus de teller forceerde
   * nog een render die niets veranderde — `testVoorstel` komt uit een prop. Weg ermee. */
  async function antwoord(a: IjkAntwoord) {
    if (saving) return;
    setSaving(true);
    try {
      await putIjking(voorstel.blokStart, voorstel.doel, a);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
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
        onClick={() => antwoord("bevestigd")}
        disabled={saving}
        style={{
          ...knop,
          background: "var(--btn-secondary-bg)",
          border: "1px solid var(--btn-secondary-border)",
          color: "var(--btn-secondary-text)",
        }}
      >
        {testBevestigLabel()}
      </button>
      <div
        style={{
          marginTop: "var(--s-2)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
        }}
      >
        {testBevestigUitleg()}
      </div>
      <button
        type="button"
        onClick={() => antwoord("niet_nu")}
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
