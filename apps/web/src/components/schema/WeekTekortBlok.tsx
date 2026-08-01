import { weekTekortRegel } from "../../lib/coachNarrative";
import type { WeekTekort } from "../../lib/weektekort";
import { Card, Overline } from "../ui";
import { CoachCallout } from "./CoachCallout";

// ROADMAP punt 10 fase B — DE WEEK-TEKORT-STEM. Spec: docs/PUNT10-FASE-B-BOUWDOC.md §5.
//
// FEITENBLOK ZONDER KNOP, net als `SleutelInhaalBlok`: hij VRAAGT niets en verandert niets, hij
// stelt vast dat een prikkel weg is. Daarom staat hij onder de voorstel-kaarten en niet ertussen.
//
// Alle poorten zitten in `bouwWeekTekort`; deze component rendert alleen. Bestaande tokens, geen
// eigen kleuren, geen knop.

export function WeekTekortBlok({
  tekort,
  coachNaam,
}: {
  tekort: WeekTekort;
  coachNaam: string | null;
}) {
  const zones = tekort.termen.filter((t) =>
    tekort.tekortZones.includes(t.zone),
  );
  const regel = weekTekortRegel(zones, tekort.weekMonday);
  if (!regel) return null;

  return (
    <Card>
      <Overline>Deze week · prikkel weg</Overline>
      <div style={{ marginTop: "var(--s-3)" }}>
        <CoachCallout narrative={regel} coachNaam={coachNaam} />
      </div>
    </Card>
  );
}
