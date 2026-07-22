import {
  type DoneEntry,
  doneBadge,
  doneLabel,
  doneZoneBlokken,
  formatDuurU,
} from "../../lib/schema";
import { RideDetailLink } from "./RideDetailLink";
import { ZoneBars } from "./ZoneBars";
import { ZonePill } from "./ZonePill";

// Gereduceerde VOLTOOID-kaart (2b-2 STAP 2): een gereden rit ZONDER geplande sessie (bv.
// wedstrijd) kan niet vergelijken → ritnaam + type-pill + per-zone bars van de reële
// time-in-zone. GEEN chip/tabel/vergelijking/callout (= de volle DoneCompareCard / 2c).
export function DoneDetail({ done }: { done: DoneEntry }) {
  const blokken = doneZoneBlokken(done.zoneMin5);
  const badge = doneBadge(done);
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
        {badge && (
          <div style={{ marginBottom: "var(--s-2)" }}>
            <ZonePill zone={badge.zoneNum} name={badge.label} />
          </div>
        )}
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
          {badge
            ? formatDuurU(done.minuten)
            : `${doneLabel(done)} · ${formatDuurU(done.minuten)}`}
        </div>
      </div>
      {blokken.length > 0 && <ZoneBars blokken={blokken} />}
      {/* RITDETAILS fase 2 — gedeelde affordance (GAS "Bekijk ritdetails ›", Script.html:664). */}
      <RideDetailLink idExt={done.idExt} />
    </div>
  );
}
