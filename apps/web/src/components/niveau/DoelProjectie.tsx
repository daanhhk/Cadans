import {
  ctlApproachWeeks_,
  ctlAtWeek_,
  ctlPlateauFromVolume_,
  ftpBandFromProjection_,
} from "@cadans/engine";
import { useId, useMemo, useState } from "react";
import { nlDec1, nlInt } from "../../lib/format";
import { projectionDirection } from "../../lib/niveau";
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
  /** Recent weekvolume (uren) → slider-default; null → val terug op 8. GAS-parity. */
  weeklyHoursDefault: number | null;
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
          {/* geen losse unit: de sub-copy draagt 'm al, en fmtMetric embed 'u' voor longRideH */}
          / {fmtMetric(dim.metric, dim.target)}
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
  isTest,
  testWeken,
}: {
  currentCtl: number;
  plateau: number;
  targetCtl: number;
  weeks: number | null;
  isTest: boolean;
  testWeken: number | null;
}) {
  const padT = 12;
  const padB = 24;
  const padL = 4;
  const padR = 6;
  // y-schaal: in test-modus telt het duurdoel NIET mee (GAS Script.html:1568-1596) — de schaal
  // loopt tussen huidig CTL en het plateau, niet naar een (mogelijk onbereikbaar) duurdoel.
  const levels = isTest
    ? [currentCtl, plateau]
    : [currentCtl, plateau, targetCtl];
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
  const readyX = !isTest && weeks != null && weeks <= WEEKS ? X(weeks) : null;
  // test-modus: markeer de testdag (x = testWeken, alleen als ≤ 16 wkn in beeld) op de ramp.
  const testCtl =
    isTest && testWeken != null && testWeken <= WEEKS
      ? (ctlAtWeek_(currentCtl, plateau, testWeken) as number | null)
      : null;
  const testX =
    isTest && testWeken != null && testWeken <= WEEKS ? X(testWeken) : null;
  const testY = testCtl != null ? Y(testCtl) : null;
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
      {/* doel-lijn + label — NIET in test-modus (GAS toont daar geen duurdoel). */}
      {!isTest && (
        <>
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
        </>
      )}
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
      {/* ready-marker (duurdoel bereikt) — NIET in test-modus. */}
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
      {/* testdag-marker — alleen in test-modus (verticale streep + dot op de ramp + label). */}
      {testX != null && testY != null && (
        <g>
          <line
            x1={testX}
            x2={testX}
            y1={padT}
            y2={CH - padB}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx={testX}
            cy={testY}
            r="5"
            fill="var(--accent)"
            stroke="var(--bg-surface)"
            strokeWidth="2"
          />
          <text
            x={Math.min(CW - padR - 2, testX + 6)}
            y={padT + 8}
            textAnchor="start"
            fill="var(--accent)"
            fontSize="9.5"
            fontFamily="var(--font-num)"
          >
            testdag
          </text>
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
  weeklyHoursDefault,
}: DoelProjectieProps) {
  // Slider-default = echt recent weekvolume (afgerond), geclampt op de slider-range 4..14; GAS-parity
  // Script.html:1673-1675. null → val terug op 8.
  const [hours, setHours] = useState(() =>
    Math.min(
      14,
      Math.max(
        4,
        weeklyHoursDefault != null ? Math.round(weeklyHoursDefault) : 8,
      ),
    ),
  );
  const [assumOpen, setAssumOpen] = useState(false);
  const assumId = useId();

  // Test-modus: doel = een FTP-test (projectieMode 'test') mét een bekende testdatum (testWeken).
  // GAS Script.html:1562 + :1617.
  const isTest = projectieMode === "test" && testWeken != null;

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
    // Test-modus: het CTL op de testdag (GAS ctlAtWeek_) + een band die daar op is verankerd
    // (i.p.v. op het plateau). Buiten test-modus is ctlAtTest null en telt de plateau-band.
    const ctlAtTest = isTest
      ? (ctlAtWeek_(currentCtl, plateau, testWeken) as number | null)
      : null;
    const band = ftpBandFromProjection_(
      currentFtp,
      currentCtl,
      isTest ? ctlAtTest : plateau,
      gewicht,
    ) as FtpBand;
    return { plateau, weeks, sooner, band, ctlAtTest };
  }, [
    hours,
    currentCtl,
    targetCtl,
    tssPerHour,
    currentFtp,
    gewicht,
    isTest,
    testWeken,
  ]);

  // Mensentaal-richting (test-modus): bouwt de gebruiker fitheid op / vast / af richting de test?
  const direction = proj
    ? projectionDirection(currentCtl, proj.ctlAtTest)
    : null;

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

      {/* doel-gap — GAS onderdrukt de gap-rijen + callout in test-modus (Script.html:1700-1702):
          een FTP-test is een meetmoment, geen doel-met-tekorten. */}
      {!isTest && (
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
      )}

      {!isTest && dims.length > 0 && (
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
                  isTest={isTest}
                  testWeken={testWeken}
                />
              )}
            </div>

            {/* readout — in test-modus mensentaal (BEWUSTE CLIENT-ONLY DIVERGENTIE t.o.v. GAS, dat
                "Verwachte fitheid op de testdag: ~X CTL" + een warn toont): CTL is jargon en de
                RICHTING (opbouwen/vasthouden/afbouwen) is de kernvraag. Geen CTL-getal in de copy.
                "down" → warn-styling; "up"/"flat" → neutrale styling. */}
            <div
              style={{
                marginTop: "var(--s-3)",
                background: (isTest ? direction === "down" : proj.weeks == null)
                  ? "var(--warn-soft)"
                  : "var(--bg-sunken)",
                border: `1px solid ${
                  (isTest ? direction === "down" : proj.weeks == null)
                    ? "color-mix(in srgb, var(--warn) 35%, transparent)"
                    : "var(--border-subtle)"
                }`,
                borderRadius: "var(--r-md)",
                padding: "11px 13px",
              }}
            >
              {isTest ? (
                <>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-label)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    FTP-test over ~{testWeken}{" "}
                    {testWeken === 1 ? "week" : "weken"}
                  </div>
                  {direction && (
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-label)",
                        color: "var(--text-secondary)",
                        lineHeight: "var(--lh-body)",
                        marginTop: "var(--s-2)",
                      }}
                    >
                      {direction === "up"
                        ? `Bij ${hours}u/week bouw je fitheid op richting de test.`
                        : direction === "flat"
                          ? `Bij ${hours}u/week houd je je fitheid vast — je gaat de test in op je huidige niveau.`
                          : `Bij ${hours}u/week zakt je fitheid richting de test — je gaat de test in onder je huidige niveau.`}
                    </div>
                  )}
                </>
              ) : (
                <>
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
                      Bij {hours}u/week blijft je fitheid-plafond onder je
                      duurdoel — zo niet haalbaar. Verhoog het volume.
                    </span>
                  )}
                  {proj.weeks != null &&
                    proj.sooner != null &&
                    proj.sooner > 0 && (
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
                </>
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
                    {isTest
                      ? "Verwachte FTP op de testdag"
                      : "Geschat FTP-effect"}
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
                    {/* collapse "N–N W" → "N W" bij een puntschatting (low === high). */}
                    {proj.band.lowW !== proj.band.highW && (
                      <>
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
                      </>
                    )}
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
