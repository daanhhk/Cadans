import { faseOvergangRegel } from "../../lib/coachNarrative";
import type { FaseOvergang } from "../../lib/faseOvergang";
import { CoachCallout } from "./CoachCallout";

// M51/M10 — de fase-overgang-AANKONDIGING op weekniveau. Zelfde CoachCallout-vorm als de andere
// week-kaarten, maar ALLEEN tekst: geen knoppen, geen actie. Dit is een aankondiging (het plan
// kantelt deze week), geen voorstel. Verschijnt alleen op een overgangsweek → zelf-begrenzend,
// geen wegklik nodig.
export function FaseOvergangCard({
  overgang,
  coachNaam,
}: {
  overgang: FaseOvergang;
  coachNaam: string | null;
}) {
  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <CoachCallout
        narrative={faseOvergangRegel(overgang)}
        coachNaam={coachNaam}
      />
    </div>
  );
}
