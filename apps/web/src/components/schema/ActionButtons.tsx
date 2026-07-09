import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

// Gedeeld knoppen-blok (§5e) onder de rustdag- (§5a) ÉN voltooid-volle-kaart (§5c). Vaste UI-labels
// (UI-chrome, geen data). "Beschikbaarheid aanpassen" → de bestaande /weekplanner-route (actief).
// De overige acties hebben nog geen scherm/backend → expliciete "binnenkort"-staat (disabled),
// GEEN dode knop / nep-flow. §5d (verleden, geparkeerd) krijgt dit blok NIET. De §5c-"Bekijk
// ritdetails ›" leeft in DoneCompareCard (boven de coach-impact-box), niet hier.

const baseBtn: CSSProperties = {
  height: "var(--btn-height)",
  borderRadius: "var(--btn-radius)",
  border: "1px solid var(--btn-secondary-border)",
  background: "var(--btn-secondary-bg)",
  color: "var(--btn-secondary-text)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-label)",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--s-2)",
  textDecoration: "none",
};

// "Binnenkort"-knop (disabled, geen dode flow). Gedeeld: ook de §5c-"Bekijk ritdetails ›" (in
// DoneCompareCard, boven de coach-impact-box) hergebruikt deze stijl.
export function SoonButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      style={{ ...baseBtn, cursor: "default", opacity: 0.55 }}
    >
      {label}
      <span
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        binnenkort
      </span>
    </button>
  );
}

export function ActionButtons() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        marginTop: "var(--s-4)",
      }}
    >
      <SoonButton label="Andere training kiezen" />
      <Link to="/weekplanner" style={{ ...baseBtn, cursor: "pointer" }}>
        Beschikbaarheid aanpassen
      </Link>
      <SoonButton label="Push naar Garmin" />
    </div>
  );
}
