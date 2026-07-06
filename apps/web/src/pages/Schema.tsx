import { useEffect, useState } from "react";
import { SchemaView } from "../components/schema/SchemaView";
import type { ProposalWeek } from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import { type DoneEntry, loadSchemaWeek } from "../lib/schema";

interface SchemaData {
  proposalWeek: ProposalWeek;
  doneByDate: Record<string, DoneEntry>;
  readiness: ReadinessResult;
  todayISO: string;
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
      onRegen={() => setNonce((n) => n + 1)}
      regenerating={regenerating}
    />
  );
}
