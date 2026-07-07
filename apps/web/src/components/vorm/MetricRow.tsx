import type { SettingsInput } from "@cadans/shared";
import { nlInt, nlUpTo1 } from "../../lib/format";
import { Num, Overline } from "../ui";

// Metric-rij (prototype app.jsx:297): 3 kolommen FTP · Gewicht · Week-TSS. Week-TSS =
// kalenderweek-som (lib/niveau.ts `weekTss`, GAS `actualTssByDate_`-parity, Monday-based).
export function MetricRow({
  settings,
  weekTss,
}: {
  settings: SettingsInput | null;
  weekTss: number | null;
}) {
  const cells: { value: string; unit: string | null; label: string }[] = [
    {
      value: settings?.ftp != null ? nlInt(settings.ftp) : "—",
      unit: settings?.ftp != null ? "W" : null,
      label: "FTP",
    },
    {
      value: settings?.gewicht != null ? nlUpTo1(settings.gewicht) : "—",
      unit: settings?.gewicht != null ? "kg" : null,
      label: "Gewicht",
    },
    {
      value: weekTss != null ? nlInt(weekTss) : "—",
      unit: weekTss != null ? "TSS" : null,
      label: "Week",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
      }}
    >
      {cells.map((m, i) => (
        <div
          key={m.label}
          style={{
            padding: "var(--s-3) var(--s-3)",
            textAlign: "center",
            borderLeft: i ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 3,
            }}
          >
            {/* off-scale: 22px, tussen --fs-num-sm/-md */}
            <Num
              size="22px"
              weight={600}
              color={m.unit ? "var(--text-primary)" : "var(--text-muted)"}
            >
              {m.value}
            </Num>
            {m.unit && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                }}
              >
                {m.unit}
              </span>
            )}
          </div>
          {/* off-scale: 10px < --fs-caption (11) */}
          <Overline style={{ marginTop: "var(--s-2)", fontSize: 10 }}>
            {m.label}
          </Overline>
        </div>
      ))}
    </div>
  );
}
