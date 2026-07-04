import type { SettingsInput } from "@cadans/shared";
import { nlInt, nlUpTo1 } from "../../lib/format";
import { Num, Overline } from "../ui";

// Metric-rij (prototype MetricRow). FTP + Gewicht = 1:1 live-data. Week-TSS is
// DEFERRED (vergt de nog niet getypeerde /api/activities-som) → weggelaten; de
// prototype-3-kolom wordt hier een 2-kolom.
export function MetricRow({ settings }: { settings: SettingsInput | null }) {
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
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
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
            padding: "14px 12px",
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
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {m.unit}
              </span>
            )}
          </div>
          <Overline style={{ marginTop: 6, fontSize: 10 }}>{m.label}</Overline>
        </div>
      ))}
    </div>
  );
}
