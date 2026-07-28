import { useState } from "react";
import { putDosisTrede } from "../../lib/api";
import type { DosisTredeVoorstel } from "../../lib/blok";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { CoachCallout } from "./CoachCallout";

// ROADMAP stap 2 — de DOSIS-TREDE-kaart. Staat in blokweek 1 direct ONDER de terugblik: die
// vertelt wat er gebeurd is, deze vraagt wat er verandert. Naar het model van VerlengCard
// (CoachCallout + twee knoppen), met één belangrijk verschil: AFWIJZEN IS PERSISTENT. Waar
// VerlengCard en FatigueCard een sessie-lokale afwijs-set gebruiken, schrijft deze kaart bij
// beide knoppen blok+doel naar D1 — bevestigen verhoogt de trede, afwijzen laat hem staan.
// Zonder die schrijfactie komt hetzelfde voorstel elke week van het blok terug; de volgende
// blokgrens stelt de vraag vanzelf opnieuw.
//
// Alle poorten (blokweek 1, fase afgerond, check geleverd, onder het plafond, nog niet
// beantwoord) zitten in `dosisTredeVoorstel` in blok.ts. Deze component rendert alleen.

/** Wat er gemeten is — de reden dat de vraag nu gesteld wordt. Per tak andere copy. */
function metingRegel(v: DosisTredeVoorstel): string {
  return v.uitkomst === "geleverd_gestegen"
    ? `Je hebt vorig blok de gevraagde ${v.normNu} kwaliteitsminuten per week geleverd, en je vorm ging omhoog. Dat is het moment om een trede bij te zetten.`
    : `Je hebt vorig blok de gevraagde ${v.normNu} kwaliteitsminuten per week geleverd, maar je vorm bewoog niet. Aan de uitvoering lag het dus niet — het plan was te licht.`;
}

/** Wat er verandert, en wat er NIET verandert. Dat tweede is de helft van de geruststelling. */
function veranderingRegel(v: DosisTredeVoorstel): string {
  return (
    `Ik zet de dosis van ${v.minNu} naar ${v.minStraks} minuten per sleutelsessie — ` +
    `over ${v.prikkels} sessies is dat ${v.normNu} naar ${v.normStraks} minuten per week, ` +
    `binnen dezelfde beschikbare tijd. Zelfde zones, zelfde dagen, zelfde uren: ` +
    `de sleutelsessies worden inhoudelijk zwaarder, je agenda niet.`
  );
}

export function DosisTredeCard({
  voorstel,
  coachNaam,
}: {
  voorstel: DosisTredeVoorstel;
  coachNaam: string | null;
}) {
  const [saving, setSaving] = useState(false);

  async function schrijf(trede: number) {
    if (saving) return;
    setSaving(true);
    try {
      await putDosisTrede(trede, voorstel.blokStart, voorstel.doel);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
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
        narrative={`${metingRegel(voorstel)} ${veranderingRegel(voorstel)}`}
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
          onClick={() => schrijf(voorstel.volgend)}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {`Ja, naar ${voorstel.minStraks} min`}
        </button>
        <button
          type="button"
          // AFWIJZEN schrijft dezelfde blokstart bij de ONGEWIJZIGDE trede: het voorstel is
          // beantwoord, dus het komt dit blok niet terug.
          onClick={() => schrijf(voorstel.huidig)}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          {`Nee, hou ${voorstel.minNu} min`}
        </button>
      </div>
    </div>
  );
}
