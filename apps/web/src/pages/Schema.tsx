import type { DispositionReason } from "@cadans/shared";
import { useEffect, useState } from "react";
import { SchemaView } from "../components/schema/SchemaView";
import { postSyncActivities, postSyncWellness } from "../lib/api";
import { subscribePlannerVersion } from "../lib/plannerSignal";
import type { ProposalWeek } from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import { type DoneEntry, loadSchemaWeek } from "../lib/schema";

interface SchemaData {
  proposalWeek: ProposalWeek;
  doneByDate: Record<string, DoneEntry>;
  readiness: ReadinessResult;
  todayISO: string;
  rpeByDate: Record<string, number>;
  dispositionByDate: Record<string, DispositionReason>;
}

// Live container voor de Schema-tab: laadt de doelweek (loadSchemaWeek → getPlanner/
// getEvents/getRpe/getWeekplans/getActivities/getWellness + buildWeekProposal +
// deriveReadiness) en rendert de pure SchemaView. Spiegelt Vorm's laad-/loading-/error-/
// nonce-patroon. De regenereer-knop draait loadSchemaWeek opnieuw (deterministisch → ververst).
export function Schema() {
  const [data, setData] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    if (nonce === 0) setLoading(true);
    else setRegenerating(true);
    setError(null);
    loadSchemaWeek()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
        setRegenerating(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
        setRegenerating(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  // Planner-mutatie-signaal: herbouw het voorstel (via nonce) zodra een Weekplanner-save
  // planner_days muteert — puur planner-gedreven, geen intervals-sync.
  useEffect(() => subscribePlannerVersion(() => setNonce((n) => n + 1)), []);

  // "Werk week bij" = echte sync (activities + wellness, parallel) → daarna de week
  // her-berekenen met de verse D1-data. Icoon disabled tijdens de run (geen dubbel-
  // sync); minstens één geslaagde pull → wél her-deriveren.
  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncNote({ text: "Synchroniseren…", error: false });
    const [actR, wellR] = await Promise.allSettled([
      postSyncActivities(),
      postSyncWellness(),
    ]);
    const reason = (r: unknown): string =>
      r instanceof Error ? r.message : String(r);
    const fails: string[] = [];
    if (actR.status === "rejected")
      fails.push(`activiteiten (${reason(actR.reason)})`);
    if (wellR.status === "rejected")
      fails.push(`wellness (${reason(wellR.reason)})`);
    const anyOk = actR.status === "fulfilled" || wellR.status === "fulfilled";
    if (fails.length === 0) {
      const n = actR.status === "fulfilled" ? actR.value.upserted : 0;
      setSyncNote({ text: `Bijgewerkt · ${n} activiteiten`, error: false });
    } else if (anyOk) {
      setSyncNote({
        text: `Deels bijgewerkt — mislukt: ${fails.join(", ")}`,
        error: true,
      });
    } else {
      setSyncNote({
        text: `Synchroniseren mislukt: ${fails.join(", ")}`,
        error: true,
      });
    }
    setSyncing(false);
    // Re-derive ALTIJD (ontkoppeld van de sync-uitkomst): de week herbouwt uit de huidige
    // D1 (planner_days + activities), ook als de intervals-sync faalde.
    setNonce((n) => n + 1);
  }

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
      onRegen={handleSync}
      regenerating={syncing || regenerating}
      syncNote={syncNote}
    />
  );
}
