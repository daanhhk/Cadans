import type {
  DispositionReason,
  OverrideEntry,
  SettingsInput,
} from "@cadans/shared";
import { useEffect, useState } from "react";
import { SchemaView } from "../components/schema/SchemaView";
import { postSyncActivities, postSyncWellness } from "../lib/api";
import { subscribePlannerVersion } from "../lib/plannerSignal";
import type { ProposalWeek } from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import { type DoneEntry, loadSchemaWeek } from "../lib/schema";
import {
  getLastSyncTs,
  isSyncFresh,
  isSyncInFlight,
  setLastSyncTs,
  setSyncInFlight,
} from "../lib/syncStatus";

interface SchemaData {
  proposalWeek: ProposalWeek;
  doneByDate: Record<string, DoneEntry>;
  readiness: ReadinessResult;
  todayISO: string;
  rpeByDate: Record<string, number>;
  dispositionByDate: Record<string, DispositionReason>;
  overrides: OverrideEntry[];
  settings: SettingsInput;
}

// Live container voor de Schema-tab: laadt de doelweek (loadSchemaWeek → getPlanner/
// getEvents/getRpe/getWeekplans/getActivities/getWellness + buildWeekProposal +
// deriveReadiness) en rendert de pure SchemaView. Spiegelt Vorm's laad-/loading-/error-/
// nonce-patroon. Een intervals-sync draait automatisch bij mount (fire-and-forget) — de eerste
// render (instant D1-read) wacht daar NIET op.
export function Schema() {
  const [data, setData] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  // Losse re-render-trigger: laat de "Laatst gesynct"-regel bijwerken zonder een re-derive
  // (nodig als een sync 0 upserts opleverde → data onveranderd, tijdstip wél nieuw).
  const [, bumpSyncRender] = useState(0);

  useEffect(() => {
    let alive = true;
    if (nonce === 0) setLoading(true);
    setError(null);
    loadSchemaWeek()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  // Planner-mutatie-signaal: herbouw het voorstel (via nonce) zodra een Weekplanner-save
  // planner_days muteert — puur planner-gedreven, geen intervals-sync.
  useEffect(() => subscribePlannerVersion(() => setNonce((n) => n + 1)), []);

  // Auto-sync bij app-open (MOUNT-ONLY, deps []): spiegelt GAS Script.html onState →
  // fire-and-forget refreshActivities → idempotente her-render. NIET op [nonce] (anders zou de
  // eigen nonce-bump een nieuwe sync triggeren = loop). Fire-and-forget: het render-pad awaitet
  // de sync NIET; de instant D1-read staat er al.
  useEffect(() => {
    // Staleness-guard: recent gesynct in deze sessie → skip. Dekt een snelle re-mount binnen het
    // venster (nieuwe component-instance, maar de module-timestamp blijft). In-flight-guard vangt
    // de StrictMode-dubbelinvoke af (timestamp is pas ná de await gezet).
    if (isSyncFresh(getLastSyncTs(), Date.now())) return;
    if (isSyncInFlight()) return;
    setSyncInFlight(true);

    // GEEN alive-gate op de module-writes: het tijdstip is sessie-globaal en moet gezet worden ook
    // als deze instance intussen unmount (bv. StrictMode's dev-cleanup) — anders blijft de guard
    // stuk. De setState-calls zijn een veilige no-op op een ontkoppelde component (React 18+).
    Promise.allSettled([postSyncActivities(), postSyncWellness()]).then(
      ([actR, wellR]) => {
        setSyncInFlight(false);
        const anyOk =
          actR.status === "fulfilled" || wellR.status === "fulfilled";
        // Alles gefaald → stil: de instant-state blijft staan, geen timestamp, geen re-derive.
        if (!anyOk) return;
        setLastSyncTs(Date.now());
        // Lichte re-render zodat de "Laatst gesynct"-regel de nieuwe tijd toont (los van de
        // re-derive hieronder).
        bumpSyncRender((t) => t + 1);
        const upserted =
          (actR.status === "fulfilled" ? actR.value.upserted : 0) +
          (wellR.status === "fulfilled" ? wellR.value.upserted : 0);
        // Alleen bij nieuwe/gewijzigde data (upserts > 0) her-deriveren; 0 upserts → data
        // ongewijzigd → geen re-derive (idempotent, geen selectie-reset).
        if (upserted > 0) setNonce((n) => n + 1);
      },
    );
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px 8px",
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
        }}
      >
        Laden…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "40px 8px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Opnieuw
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <SchemaView
      proposalWeek={data.proposalWeek}
      readiness={data.readiness}
      doneByDate={data.doneByDate}
      todayISO={data.todayISO}
      rpeByDate={data.rpeByDate}
      dispositionByDate={data.dispositionByDate}
      overrides={data.overrides}
      settings={data.settings}
    />
  );
}
