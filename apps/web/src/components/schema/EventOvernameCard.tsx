import { useState } from "react";
import { putEventOvername } from "../../lib/api";
import type { EventOvernameVoorstel } from "../../lib/eventOvername";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { CoachCallout } from "./CoachCallout";

// ROADMAP punt 9 fase B — DE EVENT-OVERNAME als VOORSTEL. Spec: docs/EVENT-OVERNAME-BOUWDOC.md
// §8.4 en §8.7. Staat direct ONDER de fase-overgangskaart: het gaat over de periodisering, dus
// het hoort bij de balk bovenaan.
//
// BEIDE KNOPPEN SCHRIJVEN, net als bij DosisTredeCard en anders dan bij VerlengCard/FatigueCard:
// er is geen sessie-lokale afwijzing. 'nee' is een bewaard antwoord voor DIT blok — zonder die
// schrijfactie komt de vraag elke pageload terug, en op de volgende blokgrens hoort hij juist
// wél opnieuw gesteld te worden zolang het event binnen de grens ligt.
//
// Alle poorten (event aanwezig, binnen de acht-wekengrens, geen taper-overlay, nog niet
// beantwoord) zitten in `eventOvernameVoorstel` in lib/eventOvername.ts. Deze component rendert.

export function EventOvernameCard({
  voorstel,
  coachNaam,
}: {
  voorstel: EventOvernameVoorstel;
  coachNaam: string | null;
}) {
  const [saving, setSaving] = useState(false);

  async function schrijf(antwoord: "ja" | "nee") {
    if (saving) return;
    setSaving(true);
    try {
      await putEventOvername(voorstel.eventDatum, voorstel.blokStart, antwoord);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  const doelTekst = voorstel.doel ?? "huidige";
  const regel1 =
    `${voorstel.eventNaam} is over ${voorstel.wekenTot} weken. Vanaf nu kan het plan daarop ` +
    `mikken in plaats van je ${doelTekst}-blok af te maken.`;
  const regel2 =
    `Zeg ik ja, dan staat deze week op ${voorstel.faseJa} en loopt de opbouw naar het event ` +
    `toe. Zeg je nee, dan blijft je blok leiden — deze week ${voorstel.faseNee} — en komt de ` +
    `taperweek er in de laatste week vóór ${voorstel.eventNaam} hoe dan ook.`;

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
      <CoachCallout narrative={`${regel1} ${regel2}`} coachNaam={coachNaam} />
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
          onClick={() => schrijf("ja")}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {`Ja, richt op ${voorstel.eventNaam}`}
        </button>
        <button
          type="button"
          onClick={() => schrijf("nee")}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          Nee, maak mijn blok af
        </button>
      </div>
    </div>
  );
}
