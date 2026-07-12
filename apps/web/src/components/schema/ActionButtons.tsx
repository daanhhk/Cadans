import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

// Gedeeld knoppen-blok (§5e) onder ELKE dagkaart-state. GAS (Script.html:1103-1106) zet de knoppen
// na de dag-detail onder elke plannbare dag — niet alleen rustdag/voltooid. Vaste UI-labels (chrome,
// geen data). "Andere training kiezen" toont alleen op een plannbare dag (GAS trnPlannable_: dag >=
// vandaag en niet voltooid); "Beschikbaarheid aanpassen" staat er altijd (-> /weekplanner, actief).
// "Push naar Garmin" is GEEN per-dag-knop meer -> tab-niveau (GarminPushButton, GAS Index.html:37).
// De §5c-"Bekijk ritdetails ›" leeft in DoneCompareCard, niet hier.

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

// "Binnenkort"-knop (disabled, geen dode flow). Ook de §5c-"Bekijk ritdetails ›" hergebruikt deze stijl.
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

// Per-dag knoppen-blok. `plannable` (GAS trnPlannable_) bepaalt of "Andere training kiezen" toont.
export function ActionButtons({ plannable }: { plannable: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        marginTop: "var(--s-4)",
      }}
    >
      {plannable && <SoonButton label="Andere training kiezen" />}
      <Link to="/weekplanner" style={{ ...baseBtn, cursor: "pointer" }}>
        Beschikbaarheid aanpassen
      </Link>
    </div>
  );
}

// Tab-niveau "Push naar Garmin" — GAS zet deze knop EEN keer onderaan de hele Schema-tab
// (Index.html:37, act-row), NIET per-dag. Blijft "binnenkort" tot de Garmin-integratie er is.
export function GarminPushButton() {
  return <SoonButton label="Push naar Garmin" />;
}
