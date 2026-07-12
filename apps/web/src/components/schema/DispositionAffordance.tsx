import type { DispositionReason } from "@cadans/shared";
import { useState } from "react";
import { putDisposition } from "../../lib/api";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { DISPOSITION_LABELS } from "../../lib/schema";

// Disposition-affordance (§gemist, A2): "Niet gedaan?" + de 3 redenen (GAS canDispose_,
// Script.html:448). Schrijft via PUT /api/disposition/:date + bumpPlannerVersion() → de dag
// flipt naar 'gemist' (GemistCard) en deze affordance verdwijnt. Spiegelt RpeRating
// (write + refresh + saving-guard + rollback-op-fout). Bare block (zit in de dag-detail-Card).
export function DispositionAffordance({ date }: { date: string }) {
  const [saving, setSaving] = useState(false);

  async function pick(reason: DispositionReason) {
    if (saving) return;
    setSaving(true);
    try {
      await putDisposition(date, reason);
      bumpPlannerVersion();
    } catch {
      setSaving(false); // rollback: geen state gezet → knoppen weer klikbaar
    }
  }

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "var(--s-2)",
        }}
      >
        Niet gedaan?
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {(
          Object.entries(DISPOSITION_LABELS) as [DispositionReason, string][]
        ).map(([reason, label]) => (
          <button
            key={reason}
            type="button"
            onClick={() => pick(reason)}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "8px 6px",
              borderRadius: "var(--r-xs)",
              cursor: saving ? "default" : "pointer",
              background: "var(--bg-sunken)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
