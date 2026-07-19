import { useState } from "react";
import { putDebtOptIn } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import type { InhaalVoorstel } from "../../lib/schema";
import { Card, Overline } from "../ui";
import { CoachCallout } from "./CoachCallout";

// FASE 2b/3a — het INHAAL-VOORSTEL op weekniveau, met de goedkeur-flow.
//
// Twee toestanden (M68 — advies, goedkeuring, omkeerbaar):
//  1. NIET goedgekeurd → het voorstel met aanbod-copy + een GOEDKEUR-knop. Het actieve plan
//     is nog het origineel; dit blok toont alleen wat er ZOU veranderen.
//  2. GOEDGEKEURD → een compacte indicator + TERUGDRAAI-knop. Het herverdeelde plan IS dan
//     het plan van deze week; de dagkaarten dragen de catchup_*-redenCodes en tonen dus
//     vanzelf de bestaande daad-copy uit coachNarrative.ts.
//
// De goedkeuring is per KALENDERWEEK (de maandag) en vervalt vanzelf de week erna.
// Schrijf-patroon = dat van de override-accept: schrijven, dan de weekdata verversen
// (bumpPlannerVersion); een mislukte schrijf laat het scherm intact.
//
// Visueel spiegelt dit de VerlichtCard: dezelfde CoachCallout voor de aanbod-copy, dezelfde
// design-tokens, geen eigen kleuren. De dag-regels tonen NL-namen (typeNaam), nooit de
// ruwe engine-type-keys.

/** "2026-07-22" → "wo 22" (lokale parse; geen UTC-round-trip). */
function dagLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const wd = ["zo", "ma", "di", "wo", "do", "vr", "za"][dt.getDay()] ?? "";
  return `${wd} ${dt.getDate()}`;
}

export function InhaalCard({
  voorstel,
  coachNaam,
  weekMonday,
  optedIn = false,
}: {
  /** Het voorstel; in de goedgekeurde toestand mag dit null zijn (er valt niets meer voor
   * te stellen — de aanpassing is toegepast). */
  voorstel: InhaalVoorstel | null;
  coachNaam: string | null;
  /** De maandag van de getoonde week = de sleutel van de goedkeuring. */
  weekMonday: string;
  /** Is het inhaal-plan voor deze week goedgekeurd? */
  optedIn?: boolean;
}) {
  const [saving, setSaving] = useState(false);

  async function zet(monday: string | null) {
    if (saving) return;
    setSaving(true);
    try {
      await putDebtOptIn(monday);
      bumpPlannerVersion();
    } catch {
      setSaving(false); // schrijf mislukt → knop weer bruikbaar, scherm intact
    }
  }

  const knop: React.CSSProperties = {
    width: "100%",
    marginTop: "var(--s-4)",
    height: "var(--btn-height)",
    padding: "0 16px",
    borderRadius: "var(--r-pill)",
    cursor: saving ? "default" : "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-label)",
    fontWeight: 600,
  };

  // ── toestand 2: goedgekeurd ────────────────────────────────────────────
  if (optedIn) {
    return (
      <Card>
        <Overline>Inhalen · actief</Overline>
        <div
          style={{
            marginTop: "var(--s-3)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
            lineHeight: "var(--lh-body)",
          }}
        >
          Deze week haal je je gemiste prikkel in. Je plan hieronder is daarop
          aangepast — binnen dezelfde uren.
        </div>
        <button
          type="button"
          onClick={() => zet(null)}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          Terug naar het originele plan
        </button>
      </Card>
    );
  }

  // ── toestand 1: voorstel ───────────────────────────────────────────────
  if (!voorstel) return null;
  return (
    <Card>
      <Overline>Voorstel · inhalen</Overline>
      <CoachCallout
        narrative={voorstel.regel}
        coachNaam={coachNaam}
        style={{ marginTop: "var(--s-3)" }}
      />
      <div
        style={{
          marginTop: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Wat er zou veranderen
        </div>
        {voorstel.dagen.map((d) => (
          <div
            key={d.datum}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "var(--s-2)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                minWidth: 44,
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {dagLabel(d.datum)}
            </span>
            <span>
              {d.fromNaam} <span aria-hidden="true">→</span>{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {d.toNaam}
              </span>
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => zet(weekMonday)}
        disabled={saving}
        style={{
          ...knop,
          background: "var(--btn-primary-bg)",
          border: "1px solid transparent",
          color: "var(--btn-primary-text)",
        }}
      >
        Ja, haal dit in
      </button>
      <div
        style={{
          marginTop: "var(--s-3)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          lineHeight: "var(--lh-body)",
        }}
      >
        Je plan is nog niet aangepast — dit is alleen een voorstel. Je kunt het
        later terugdraaien.
      </div>
    </Card>
  );
}
