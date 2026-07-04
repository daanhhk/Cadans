import { useState } from "react";
import { nlDec2, nlInt } from "../../lib/format";
import { Card, Num, Overline } from "../ui";
import { type MetricPoint, NvTrajectoryChart } from "./NvTrajectoryChart";

export type NiveauPoint = {
  maand: string;
  niveau: number | null;
  wkg: number | null;
  ctl: number | null;
};

type Metric = "wkg" | "ctl";
type Range = "1m" | "6m" | "12m" | "all";

const MND = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];
function maandLabel(mk: string): string {
  const [y = "", m = "1"] = mk.split("-");
  return `${MND[Number(m) - 1] ?? ""} '${y.slice(2)}`;
}

// venster-definitie EXACT uit design/src/niveau.jsx sliceRange (maandpunten).
function sliceRange<T>(arr: T[], range: Range): T[] {
  if (range === "1m") return arr.slice(-2);
  if (range === "6m") return arr.slice(-7);
  if (range === "12m") return arr.slice(-13);
  return arr;
}

const fmtMetric = (metric: Metric, v: number) =>
  metric === "wkg" ? nlDec2(v) : nlInt(Math.round(v));

// Progressie over tijd [v1] — natgetrokken uit design/src/niveau.jsx ProgressieCard.
// metric-switch W/kg · Fitheid(CTL) + venster 1M/6M/12M/Alles + huidige waarde/delta
// (venster-begin → -eind) + NvTrajectoryChart. Serie uit niveauProgressie_.
export function ProgressieCard({ serie }: { serie: NiveauPoint[] }) {
  const [metric, setMetric] = useState<Metric>("wkg");
  const [range, setRange] = useState<Range>("all");
  const [ctlOverlay, setCtlOverlay] = useState(true);

  const windowed = sliceRange(serie, range);
  const pts: MetricPoint[] = windowed
    .map((p) => ({
      maand: maandLabel(p.maand),
      v: metric === "wkg" ? p.wkg : p.ctl,
    }))
    .filter((p): p is MetricPoint => p.v != null);
  const ctlValues =
    metric === "wkg" && ctlOverlay
      ? windowed.map((p) => p.ctl).filter((v): v is number => v != null)
      : null;

  const cur = pts.at(-1)?.v ?? null;
  const first = pts[0]?.v ?? null;
  const delta = cur != null && first != null ? cur - first : null;
  const up = (delta ?? 0) >= 0;
  const unit = metric === "wkg" ? "W/kg" : "CTL";
  const periodLabel =
    range === "1m"
      ? "deze maand"
      : range === "6m"
        ? "6 mnd"
        : range === "12m"
          ? "12 mnd"
          : "sinds seizoenstart";

  const metrics: [Metric, string][] = [
    ["wkg", "W/kg"],
    ["ctl", "Fitheid"],
  ];
  const ranges: [Range, string][] = [
    ["1m", "1M"],
    ["6m", "6M"],
    ["12m", "12M"],
    ["all", "Alles"],
  ];

  return (
    <Card style={{ padding: "16px 16px 12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Overline>Progressie over tijd</Overline>
        {metric !== "ctl" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-sans)",
              fontSize: 10.5,
              color: "var(--text-muted)",
            }}
          >
            <span
              style={{
                width: 13,
                height: 0,
                borderTop: "2px dashed var(--traj-ctl-line)",
                opacity: ctlOverlay ? 1 : 0.4,
              }}
            />
            <button
              type="button"
              onClick={() => setCtlOverlay((v) => !v)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: 600,
                color: ctlOverlay
                  ? "var(--text-secondary)"
                  : "var(--text-muted)",
              }}
            >
              Fitheid
            </button>
          </span>
        )}
      </div>

      {cur == null || pts.length < 2 ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "28px 12px 18px",
            lineHeight: 1.55,
          }}
        >
          Je trajectorie verschijnt zodra er ~4 weken aan ritten zijn
          binnengekomen.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 6,
            }}
          >
            <Num size="28px" weight={600}>
              {fmtMetric(metric, cur)}
            </Num>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {unit}
            </span>
            {delta != null && (
              <Num
                size="12px"
                weight={600}
                color={up ? "var(--traj-delta-up)" : "var(--traj-delta-down)"}
                style={{ marginLeft: 2 }}
              >
                {delta === 0
                  ? "±0"
                  : `${up ? "+" : "−"}${fmtMetric(metric, Math.abs(delta))} ${up ? "↑" : "↓"}`}
              </Num>
            )}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                color: "var(--text-muted)",
                marginLeft: 1,
              }}
            >
              {periodLabel}
            </span>
          </div>

          <Switch
            options={metrics}
            value={metric}
            onChange={(v) => setMetric(v)}
            style={{ marginTop: 12 }}
          />
          <Switch
            options={ranges}
            value={range}
            onChange={(v) => setRange(v)}
            style={{ marginTop: 8 }}
            small
          />

          <div style={{ marginTop: 14 }}>
            <NvTrajectoryChart
              pts={pts}
              ctlPts={ctlValues}
              fmt={(v) => fmtMetric(metric, v)}
              metricLabel={metric === "wkg" ? "W/kg" : "Fitheid"}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function Switch<T extends string>({
  options,
  value,
  onChange,
  style,
  small,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  style?: React.CSSProperties;
  small?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--bg-sunken)",
        borderRadius: "var(--r-pill)",
        padding: 3,
        ...style,
      }}
    >
      {options.map(([k, lbl]) => (
        <button
          type="button"
          key={k}
          onClick={() => onChange(k)}
          style={{
            flex: 1,
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--r-pill)",
            padding: small ? "5px 0" : "6px 0",
            fontFamily: "var(--font-sans)",
            fontSize: small ? 11.5 : 12,
            fontWeight: 600,
            background: value === k ? "var(--bg-elevated)" : "transparent",
            color: value === k ? "var(--text-primary)" : "var(--text-muted)",
            boxShadow: value === k ? "0 1px 3px rgba(0,0,0,0.45)" : "none",
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}
