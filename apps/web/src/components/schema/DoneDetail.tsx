import {
  type DoneEntry,
  doneLabel,
  doneZoneBlokken,
  doneZones,
  formatDuurU,
} from "../../lib/schema";
import { ZoneBar } from "./ZoneBar";
import { ZoneLegend } from "./ZoneLegend";

// Gereden-rit-weergave op een VOLTOOID-dag (fase 2a): naam + NL-type-label (dominante reële zone) +
// duur + één zone-balk van de reële time-in-zone. GEEN alignment/coach/impact (= 2b/2c).
export function DoneDetail({ done }: { done: DoneEntry }) {
  const blokken = doneZoneBlokken(done.zoneMinutes);
  const zones = doneZones(done.zoneMinutes);
  return (
    <div
      style={{
        marginTop: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h3)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {done.naam || "Gereden rit"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
            marginTop: 2,
          }}
        >
          {doneLabel(done)} · {formatDuurU(done.minuten)}
        </div>
      </div>
      {blokken.length > 0 && (
        <>
          <ZoneBar blokken={blokken} />
          <ZoneLegend zones={zones} />
        </>
      )}
    </div>
  );
}
