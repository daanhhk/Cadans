import { useState } from "react";
import { putFatigueShift } from "../../lib/api";
import {
  fatigueActieLabel,
  fatigueAlternatiefLabel,
  fatigueAppliedRegel,
  fatigueDownAanbodRegel,
  fatigueUpAanbodRegel,
} from "../../lib/coachNarrative";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import type { ProposalWeek } from "../../lib/proposal";
import { type FatigueVoorstel, weekPlannedMinuten } from "../../lib/schema";
import { tsbZone } from "../../lib/tsb";
import { Card, Overline } from "../ui";
import { CoachCallout } from "./CoachCallout";

// 3d stap 4 laag-2 — het FATIGUE-VOORSTEL op weekniveau. Twee toestanden (spiegelt InhaalCard):
//  1. OFFER — de trigger vuurde (kalender-fase ≠ vermoeidheid): TSB-zone + aanbod-copy + accept/dismiss.
//  2. APPLIED — de gebruiker gaf akkoord: feitelijke bevestiging + een "Terug naar de kalender"-knop.
// Voorstel-en-bevestig, per KALENDERWEEK, omkeerbaar (vervalt vanzelf de week erna). Schrijf-patroon =
// InhaalCard/putDebtOptIn: schrijven, dan de weekdata verversen (bumpPlannerVersion); een mislukte
// schrijf laat het scherm intact. Dismiss (secundair in offer) is sessie-scoped, geen D1 (mirror
// VerlichtCard's afgewezen-Set).

/** Sessie-scoped "niet meer aanbieden"-set (per maandag+richting). MODULE-level (overleeft remount
 * na sync, niet een app-herstart) — exact de VerlichtCard-semantiek. */
const afgewezen = new Set<string>();
const key_ = (monday: string, dir: "up" | "down") => `${monday}:${dir}`;

export function isFatigueAfgewezen(
  monday: string,
  dir: "up" | "down",
): boolean {
  return afgewezen.has(key_(monday, dir));
}

export function FatigueCard({
  fatigue,
  baseline,
  coachNaam,
  weekMonday,
  onDismiss,
}: {
  fatigue: FatigueVoorstel;
  /** Het ACTIEVE plan (= de kalenderweek in de offer-state) — de baseline voor de minuten-delta. */
  baseline: ProposalWeek;
  coachNaam: string | null;
  /** De week-maandag = de sleutel van de goedkeuring. */
  weekMonday: string;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function schrijf(monday: string | null, dir: "up" | "down" | null) {
    if (saving) return;
    setSaving(true);
    try {
      await putFatigueShift(monday, dir);
      bumpPlannerVersion();
    } catch {
      setSaving(false); // schrijf mislukt → knop weer bruikbaar, scherm intact
    }
  }

  function dismiss() {
    afgewezen.add(key_(weekMonday, fatigue.dir));
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

  // ── toestand 2: toegepast ──────────────────────────────────────────────
  if (fatigue.state === "applied") {
    return (
      <Card>
        <Overline>Vorm · aangepast</Overline>
        <div
          style={{
            marginTop: "var(--s-3)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
            lineHeight: "var(--lh-body)",
          }}
        >
          {fatigueAppliedRegel(fatigue.dir)}
        </div>
        <button
          type="button"
          onClick={() => schrijf(null, null)}
          disabled={saving}
          style={{
            ...knop,
            marginTop: "var(--s-4)",
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          Terug naar de kalender
        </button>
      </Card>
    );
  }

  // ── toestand 1: voorstel ───────────────────────────────────────────────
  const deltaMin = fatigue.preview
    ? weekPlannedMinuten(fatigue.preview) - weekPlannedMinuten(baseline)
    : 0;
  const zone = tsbZone(fatigue.tsbTrend ?? 0);
  const regel =
    fatigue.dir === "up"
      ? fatigueUpAanbodRegel(fatigue.tsbTrend, deltaMin)
      : fatigueDownAanbodRegel(fatigue.tsbTrend, deltaMin);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-2)",
        }}
      >
        <Overline>Voorstel · vorm</Overline>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "var(--r-pill)",
            background: zone.soft,
            color: zone.color,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {zone.label}
        </span>
      </div>
      <CoachCallout
        narrative={regel}
        coachNaam={coachNaam}
        style={{ marginTop: "var(--s-3)" }}
      />
      <button
        type="button"
        onClick={() => schrijf(weekMonday, fatigue.dir)}
        disabled={saving}
        style={{
          ...knop,
          marginTop: "var(--s-4)",
          background: "var(--btn-primary-bg)",
          border: "1px solid transparent",
          color: "var(--btn-primary-text)",
        }}
      >
        {fatigueActieLabel(fatigue.dir)}
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
        {fatigueAlternatiefLabel(fatigue.dir)}
      </button>
    </Card>
  );
}
