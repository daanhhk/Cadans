import {
  ctlApproachWeeks_,
  ctlAtWeek_,
  ctlPlateauFromVolume_,
  ftpBandFromProjection_,
} from "@cadans/engine";
import { useId, useMemo, useState } from "react";
import { nlDec1, nlInt } from "../../lib/format";
import { Card, Num, Overline } from "../ui";

// DoelProjectie [Fase 2 · Visie] — natgetrokken uit design/src/niveau.jsx DoelProjectie.
// UI-only: alle compute komt uit de engine-niveau-fns (PUUR, read-only). SOLIDE
// volume→CTL-ramp vs SPECULATIEVE FTP-band (eerlijkheid = ontwerp-eis).

export type GapDim = {
  key: string;
  label: string;
  metric: string;
  target: number;
  unit: string;
  dir: string;
  current: number | null;
  gap: number | null;
  onTrack: boolean;
  pct: number | null;
};

export interface DoelProjectieProps {
  label: string;
  sub: string | null;
  projectieMode: string; // 'gap' | 'test'
  dims: GapDim[];
  currentCtl: number | null;
  targetCtl: number | null;
  tssPerHour: number | null;
  currentFtp: number | null;
  gewicht: number | null;
  testWeken: number | null;
}

type FtpBand = {
  lowW: number;
  highW: number;
  lowWkg: number | null;
  highWkg: number | null;
  aannames: string[];
} | null;

// per-dimensie sub-copy (design) + waarde-formattering, gekeyd op de engine-metric.
const DIM_SUB: Record<string, string> = {
  ftpWkg: "W/kg · 20 min",
  ctl: "fitheid · CTL",
  longRideH: "langste recente rit",
};
function fmtMetric(metric: string, v: number | null): string {
  if (v == null) return "—";
  if (metric === "ftpWkg") return nlDec1(v);
  if (metric === "ctl") return nlInt(v);
  if (metric === "longRideH") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return m > 0 ? `${h}u${String(m).padStart(2, "0")}` : `${h}u`;
  }
  return String(v);
}

function SoonTag({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--soon-tag-bg)",
        border: "1px solid var(--soon-tag-border)",
        color: "var(--soon-tag-text)",
        borderRadius: "var(--r-pill)",
        padding: "3px 9px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "var(--r-pill)",
          background: "var(--text-muted)",
        }}
      />
      {children}
    </span>
  );
}

function GapRow({ dim }: { dim: GapDim }) {
  const col = dim.onTrack ? "var(--goal-ontrack)" : "var(--goal-gap)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {dim.label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
            marginTop: 1,
          }}
        >
          {DIM_SUB[dim.metric] ?? ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <Num size="var(--fs-num-sm)">{fmtMetric(dim.metric, dim.current)}</Num>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
          }}
        >
          / {fmtMetric(dim.metric, dim.target)}
          {dim.unit ? ` ${dim.unit}` : ""}
        </span>
      </div>
      <span
        style={{
          flexShrink: 0,
          width: 76,
          textAlign: "right",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          color: col,
        }}
      >
        {dim.onTrack ? "✓ op koers" : "nog te gaan"}
      </span>
    </div>
  );
}

// Coach-callout uit de gap-samenvatting: eerste op-koers-dim + eerste gap-dim.
function callout(dims: GapDim[], label: string): string {
  const onTrack = dims.filter((d) => d.onTrack);
  const gaps = dims.filter((d) => !d.onTrack);
  if (gaps.length === 0) return `Alles op koers voor ${label} — vasthouden.`;
  if (onTrack.length > 0)
    return `${onTrack[0]?.label} is op koers — ${gaps[0]?.label.toLowerCase()} is je laatste stap.`;
  return `${gaps[0]?.label} is je grootste stap richting ${label}.`;
}

const WEEKS = 16;
const CW = 320;
const CH = 150;

function ProjectionChart({
  currentCtl,
  plateau,
  targetCtl,
  weeks,
}: {
  currentCtl: number;
  plateau: number;
  targetCtl: number;
  weeks: number | null;
}) {
  const padT = 12;
  const padB = 24;
  const padL = 4;
  const padR = 6;
  const levels = [currentCtl, plateau, targetCtl];
  const lo = Math.max(0, Math.min(...levels) - 4);
  const hi = Math.max(...levels) + 4;
  const X = (t: number) => padL + (t / WEEKS) * (CW - padL - padR);
  const Y = (v: number) =>
    padT + (1 - (v - lo) / (hi - lo || 1)) * (CH - padT - padB);
  const ramp: { t: number; v: number }[] = [];
  for (let t = 0; t <= WEEKS; t++) {
    const v = ctlAtWeek_(currentCtl, plateau, t) as number | null;
    if (v != null) ramp.push({ t, v });
  }
  const line = ramp
    .map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`)
    .join(" ");
  const area = ramp.length
    ? `${line} L${X(WEEKS).toFixed(1)} ${(CH - padB).toFixed(1)} L${X(0).toFixed(1)} ${(CH - padB).toFixed(1)} Z`
    : "";
  const readyX = weeks != null && weeks <= WEEKS ? X(weeks) : null;
  return (
    <svg
      viewBox={`0 0 ${CW} ${CH}`}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nvProj" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* doel-lijn */}
      <line
        x1={padL}
        x2={CW - padR}
        y1={Y(targetCtl)}
        y2={Y(targetCtl)}
        stroke="var(--goal-target-line)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text
        x={CW - padR}
        y={Y(targetCtl) - 5}
        textAnchor="end"
        fill="var(--text-secondary)"
        fontSize="10"
        fontFamily="var(--font-num)"
      >
        duurdoel {nlInt(targetCtl)}
      </text>
      {/* plafond (plateau) */}
      <line
        x1={padL}
        x2={CW - padR}
        y1={Y(plateau)}
        y2={Y(plateau)}
        stroke="var(--proj-solid)"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.5"
      />
      <text
        x={padL + 2}
        y={Y(plateau) - 4}
        fill="var(--accent)"
        fontSize="9.5"
        fontFamily="var(--font-num)"
      >
        plafond {nlInt(plateau)}
      </text>
      {/* ramp (SOLIDE, berekend uit volume) */}
      {area && <path d={area} fill="url(#nvProj)" />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="var(--proj-solid)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <circle cx={X(0)} cy={Y(currentCtl)} r="3.5" fill="var(--text-primary)" />
      {readyX != null && (
        <g>
          <line
            x1={readyX}
            x2={readyX}
            y1={Y(targetCtl)}
            y2={CH - padB}
            stroke="var(--proj-ready-marker)"
            strokeWidth="1.5"
          />
          <circle
            cx={readyX}
            cy={Y(targetCtl)}
            r="5"
            fill="var(--proj-ready-marker)"
            stroke="var(--bg-surface)"
            strokeWidth="2"
          />
        </g>
      )}
      {[0, 4, 8, 12, 16].map((t) => (
        <text
          key={t}
          x={Math.max(padL + 6, Math.min(CW - padR - 6, X(t)))}
          y={CH - 6}
          textAnchor={t === 0 ? "start" : t === WEEKS ? "end" : "middle"}
          fill="var(--text-muted)"
          fontSize="10"
          fontFamily="var(--font-num)"
        >
          {t === 0 ? "nu" : `+${t}w`}
        </text>
      ))}
    </svg>
  );
}

export function DoelProjectie({
  label,
  sub,
  projectieMode,
  dims,
  currentCtl,
  targetCtl,
  tssPerHour,
  currentFtp,
  gewicht,
  testWeken,
}: DoelProjectieProps) {
  const [hours, setHours] = useState(8);
  const [assumOpen, setAssumOpen] = useState(false);
  const assumId = useId();

  const proj = useMemo(() => {
    if (currentCtl == null || targetCtl == null || !tssPerHour) return null;
    const plateau = ctlPlateauFromVolume_(hours, tssPerHour) as number;
    const weeks = ctlApproachWeeks_(currentCtl, plateau, targetCtl) as
      | number
      | null;
    const weeksPlus2 = ctlApproachWeeks_(
      currentCtl,
      ctlPlateauFromVolume_(hours + 2, tssPerHour) as number,
      targetCtl,
    ) as number | null;
    const sooner =
      weeks != null && weeksPlus2 != null
        ? Math.max(0, Math.round(weeks - weeksPlus2))
        : null;
    const band = ftpBandFromProjection_(
      currentFtp,
      currentCtl,
      plateau,
      gewicht,
    ) as FtpBand;
    return { plateau, weeks, sooner, band };
  }, [hours, currentCtl, targetCtl, tssPerHour, currentFtp, gewicht]);

  const horizonLabel =
    projectieMode === "test" && testWeken != null
      ? `~${testWeken} wkn tot testdag`
      : "12 wk";

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Overline>Doel-gereedheid · {label}</Overline>
          {sub && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
                marginTop: 3,
              }}
            >
              {sub}
            </div>
          )}
        </div>
        <SoonTag>Visie</SoonTag>
      </div>

      {/* doel-gap */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
          marginTop: "var(--s-4)",
        }}
      >
        {dims.map((d) => (
          <GapRow key={d.key} dim={d} />
        ))}
      </div>

      {dims.length > 0 && (
        <div
          style={{
            marginTop: "var(--s-4)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s-2)",
            background: "var(--goal-ontrack-soft)",
            border:
              "1px solid color-mix(in srgb, var(--good) 30%, transparent)",
            borderRadius: "var(--r-md)",
            padding: "9px 12px",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "var(--r-pill)",
              background: "var(--good)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-secondary)",
              lineHeight: "var(--lh-label)",
            }}
          >
            {callout(dims, label)}
          </span>
        </div>
      )}

      {/* what-if: uren → potentieel */}
      <div
        style={{
          marginTop: "var(--s-5)",
          paddingTop: "var(--s-4)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Overline color="var(--text-secondary)">Uren → potentieel</Overline>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <Num size="var(--fs-num-sm)" color="var(--accent)">
              {hours}
            </Num>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
              }}
            >
              u/week
            </span>
          </div>
        </div>
        <div style={{ marginTop: "var(--s-2)" }}>
          <input
            type="range"
            min={4}
            max={14}
            step={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            aria-label="Trainingsuren per week"
            style={{
              width: "100%",
              accentColor: "var(--slider-fill)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            <span>4u</span>
            <span>14u</span>
          </div>
        </div>

        {proj ? (
          <>
            <div style={{ marginTop: "var(--s-3)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                  marginBottom: "var(--s-2)",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 3,
                    borderRadius: 2,
                    background: "var(--proj-solid)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Fitheid-projectie
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    color: "var(--text-muted)",
                  }}
                >
                  · berekend uit volume
                </span>
              </div>
              {currentCtl != null && targetCtl != null && (
                <ProjectionChart
                  currentCtl={currentCtl}
                  plateau={proj.plateau}
                  targetCtl={targetCtl}
                  weeks={proj.weeks}
                />
              )}
            </div>

            {/* readout */}
            <div
              style={{
                marginTop: "var(--s-3)",
                background:
                  proj.weeks != null ? "var(--bg-sunken)" : "var(--warn-soft)",
                border: `1px solid ${proj.weeks != null ? "var(--border-subtle)" : "color-mix(in srgb, var(--warn) 35%, transparent)"}`,
                borderRadius: "var(--r-md)",
                padding: "11px 13px",
              }}
            >
              {proj.weeks != null ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "var(--s-2)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-label)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Duurdoel bereikt over
                  </span>
                  <Num size="var(--fs-num-sm)" color="var(--good)">
                    ~{Math.round(proj.weeks)}
                  </Num>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-label)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    weken
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-label)",
                    color: "var(--text-secondary)",
                    lineHeight: "var(--lh-body)",
                  }}
                >
                  Bij {hours}u/week blijft je fitheid-plafond onder je duurdoel
                  — zo niet haalbaar. Verhoog het volume.
                </span>
              )}
              {proj.weeks != null && proj.sooner != null && proj.sooner > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    color: "var(--text-muted)",
                    marginTop: "var(--s-2)",
                  }}
                >
                  +2u/week ≈{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {proj.sooner} {proj.sooner === 1 ? "week" : "weken"}
                  </strong>{" "}
                  eerder klaar.
                </div>
              )}
            </div>

            {/* SPECULATIEVE FTP-band */}
            {proj.band && (
              <div
                style={{
                  marginTop: "var(--s-3)",
                  border: "1px solid var(--proj-band-border)",
                  borderRadius: "var(--r-md)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px 7px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-caption)",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Geschat FTP-effect
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-caption)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--proj-estimate-text)",
                    }}
                  >
                    schatting
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 34,
                    margin: "0 12px",
                    background: "var(--proj-band-fill)",
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 5px, var(--proj-band-hatch) 5px, var(--proj-band-hatch) 6px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <Num size="var(--fs-num-sm)" color="var(--info)">
                      {proj.band.lowW}
                    </Num>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-caption)",
                        color: "var(--info)",
                      }}
                    >
                      –
                    </span>
                    <Num size="var(--fs-num-sm)" color="var(--info)">
                      {proj.band.highW}
                    </Num>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-caption)",
                        color: "var(--info)",
                        marginLeft: 2,
                      }}
                    >
                      W over {horizonLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssumOpen((v) => !v)}
                  aria-expanded={assumOpen}
                  aria-controls={assumId}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 0 9px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  }}
                >
                  Aannames {assumOpen ? "verbergen" : "tonen"}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    style={{
                      transform: assumOpen ? "rotate(180deg)" : "none",
                      transition: "transform .2s",
                    }}
                  >
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="var(--text-muted)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  id={assumId}
                  hidden={!assumOpen}
                  style={{
                    padding: "0 12px 11px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-1)",
                  }}
                >
                  {proj.band.aannames.map((a) => (
                    <div
                      key={a}
                      style={{
                        display: "flex",
                        gap: 7,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "var(--r-pill)",
                          background: "var(--text-muted)",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-caption)",
                          color: "var(--text-muted)",
                          lineHeight: "var(--lh-label)",
                        }}
                      >
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              marginTop: "var(--s-3)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "var(--s-5) var(--s-2)",
              lineHeight: "var(--lh-body)",
            }}
          >
            De projectie verschijnt zodra er voldoende recente ritten + je doel
            bekend zijn.
          </div>
        )}
      </div>
    </Card>
  );
}
