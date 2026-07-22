import { useState } from "react";
import {
  type DoneEntry,
  doneBadge,
  doneLabel,
  doneZoneBlokken,
  formatDuurU,
} from "../../lib/schema";
import { RideDetailSheet } from "./RideDetailSheet";
import { ZoneBars } from "./ZoneBars";
import { ZonePill } from "./ZonePill";

// Gereduceerde VOLTOOID-kaart (2b-2 STAP 2): een gereden rit ZONDER geplande sessie (bv.
// wedstrijd) kan niet vergelijken → ritnaam + type-pill + per-zone bars van de reële
// time-in-zone. GEEN chip/tabel/vergelijking/callout (= de volle DoneCompareCard / 2c).
export function DoneDetail({ done }: { done: DoneEntry }) {
  const blokken = doneZoneBlokken(done.zoneMin5);
  const badge = doneBadge(done);
  const [detailOpen, setDetailOpen] = useState(false);
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
      {/* RITDETAILS fase 2 — affordance (GAS "Bekijk ritdetails ›", Script.html:664). Alleen als
          de rit een intervals-id draagt (pre-migratie ritten hebben leeg idExt → geen knop). */}
      {done.idExt !== "" && (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          style={{
            alignSelf: "flex-start",
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          Bekijk ritdetails ›
        </button>
      )}
      {detailOpen && (
        <RideDetailSheet id={done.idExt} onClose={() => setDetailOpen(false)} />
      )}
    </div>
  );
}
