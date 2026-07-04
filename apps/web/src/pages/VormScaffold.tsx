import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

// TODO 5.1b: vervang deze steiger door de ECHTE Vorm-tab (ReadinessCard,
// LevelCard, W/kg-lijn, MetricRow, conditie-balans, ochtend-check-in — zie
// design/docs/FTP-Coach-export.md §2). Dit is puur 5.1a-ketenbewijs:
// vite → (proxy/assets) → Hono-Worker, via GET /api/health.

type Health = { ok: boolean; service: string };

export function VormScaffold() {
  const [status, setStatus] = useState("verbinden…");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<Health>("/api/health")
      .then((h) => {
        if (!alive) return;
        setOk(true);
        setStatus(`API verbonden · ${h.service}`);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setOk(false);
        setStatus(
          `API onbereikbaar · ${e instanceof Error ? e.message : "fout"}`,
        );
      });
    return () => {
      alive = false;
    };
  }, []);

  const dot =
    ok === null ? "var(--text-muted)" : ok ? "var(--success)" : "var(--danger)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        paddingTop: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-h1)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        Vorm
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
        }}
      >
        Steiger (5.1a) — de echte Vorm-tab volgt in 5.1b.
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          alignSelf: "flex-start",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--r-md)",
          padding: "8px 12px",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dot,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
