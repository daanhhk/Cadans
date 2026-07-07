import type { WellnessInput } from "@cadans/shared";
import { nlInt, nlSigned1 } from "../../lib/format";
import { tsbZone } from "../../lib/tsb";
import { Card, Num, Overline } from "../ui";

// Conditie-balans (PMC-variant, natgetrokken uit design/src/conditie.jsx
// ConditiePMC): 12-wk CTL(solid)/ATL(dashed)-lijn + vorm-kloof aan het einde +
// legenda met de laatste CTL/ATL/Vorm. Headline TSB + zone-label erboven.
// Alle waarden 1:1 uit de wellness-reeks (laatste ~84 dagen met geldige ctl/atl).

function Leg({ c, o, v, s }: { c: string; o: string; v: string; s: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 9, height: 3, borderRadius: 2, background: c }} />
      <Overline color="var(--text-muted)">{o}</Overline>
      <Num size="13px" weight={600} color={s}>
        {v}
      </Num>
    </div>
  );
}

function Pmc({ pts, vorm }: { pts: WellnessInput[]; vorm: number | null }) {
  const CTL = pts.map((p) => p.ctl as number);
  const ATL = pts.map((p) => p.atl as number);
  const W = 320;
  const H = 150;
  const padT = 14;
  const padB = 22;
  const padL = 6;
  const padR = 40;
  const all = CTL.concat(ATL);
  const lo = Math.min(...all) - 3;
  const hi = Math.max(...all) + 3;
  const pw = W - padL - padR;
  const ph = H - padT - padB;
  const n = CTL.length;
  const span = hi - lo || 1;
  const x = (i: number) => padL + (i / (n - 1)) * pw;
  const y = (v: number) => padT + (1 - (v - lo) / span) * ph;
  const path = (arr: number[]) =>
    arr
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(" ");
  const eCx = x(n - 1);
  const eCy = y(CTL[n - 1] ?? 0);
  const eAy = y(ATL[n - 1] ?? 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", overflow: "visible", marginTop: 10 }}
      role="img"
      aria-label="Conditie-balans over tijd"
    >
      <line
        x1={padL}
        x2={W - padR}
        y1={y(lo + span * 0.5)}
        y2={y(lo + span * 0.5)}
        stroke="var(--chart-grid)"
        strokeWidth="1"
      />
      <line
        x1={eCx}
        x2={eCx}
        y1={eCy}
        y2={eAy}
        stroke="var(--fresh)"
        strokeWidth="2"
      />
      <path
        d={path(ATL)}
        fill="none"
        stroke="var(--warn)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray="4 3"
        opacity="0.85"
      />
      <path
        d={path(CTL)}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx={eCx} cy={eAy} r="3.5" fill="var(--warn)" />
      <circle cx={eCx} cy={eCy} r="3.5" fill="var(--text-primary)" />
      {vorm != null && (
        <g transform={`translate(${eCx + 8}, ${(eCy + eAy) / 2})`}>
          <rect
            x="0"
            y="-10"
            width="34"
            height="20"
            rx="5"
            fill="var(--fresh-soft)"
            stroke="color-mix(in srgb, var(--fresh) 50%, transparent)"
          />
          <text
            x="17"
            y="4"
            textAnchor="middle"
            fontFamily="var(--font-num)"
            fontSize="11"
            fontWeight="600"
            fill="var(--fresh)"
          >
            {nlSigned1(vorm)}
          </text>
        </g>
      )}
      <text
        x={padL}
        y={H - 6}
        fill="var(--chart-axis)"
        fontSize="10"
        fontFamily="var(--font-num)"
      >
        12 wk
      </text>
      <text
        x={W - padR}
        y={H - 6}
        textAnchor="end"
        fill="var(--chart-axis)"
        fontSize="10"
        fontFamily="var(--font-num)"
      >
        nu
      </text>
    </svg>
  );
}

export function ConditiePmc({ rows }: { rows: WellnessInput[] }) {
  const pts = rows.filter((r) => r.ctl != null && r.atl != null).slice(-84);
  const last = rows.at(-1) ?? null;
  const vorm =
    last?.vorm ??
    (last?.ctl != null && last?.atl != null ? last.ctl - last.atl : null);
  const ctlLast = last?.ctl ?? null;
  const atlLast = last?.atl ?? null;
  const zone = vorm != null ? tsbZone(vorm) : null;

  return (
    <Card>
      <Overline>Conditie-balans</Overline>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          marginTop: "var(--s-1)",
        }}
      >
        vorm = fitheid − vermoeidheid
      </div>

      {pts.length < 2 ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "var(--s-5) var(--s-2)",
            lineHeight: "var(--lh-body)",
          }}
        >
          Je conditie-balans bouwt op zodra je ritten binnenkomen.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "var(--s-2)",
              marginTop: "var(--s-3)",
            }}
          >
            <Num size="30px" color={zone?.color ?? "var(--text-primary)"}>
              {vorm != null ? nlSigned1(vorm) : "—"}
            </Num>
            {zone && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: zone.soft,
                  color: zone.color,
                  border:
                    "1px solid color-mix(in srgb, currentColor 30%, transparent)",
                  borderRadius: "var(--r-pill)",
                  padding: "3px 9px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "var(--r-pill)",
                    background: zone.color,
                  }}
                />
                {zone.label}
              </span>
            )}
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
              }}
            >
              TSB · vorm-saldo
            </span>
          </div>

          <Pmc pts={pts} vorm={vorm} />

          <div
            style={{
              display: "flex",
              gap: "var(--s-4)",
              marginTop: "var(--s-2)",
              flexWrap: "wrap",
            }}
          >
            <Leg
              c="var(--text-secondary)"
              o="Fitheid"
              s="var(--text-primary)"
              v={ctlLast != null ? nlInt(Math.round(ctlLast)) : "—"}
            />
            <Leg
              c="var(--warn)"
              o="Vermoeidheid"
              s="var(--text-primary)"
              v={atlLast != null ? nlInt(Math.round(atlLast)) : "—"}
            />
            <Leg
              c="var(--fresh)"
              o="Vorm"
              s="var(--fresh)"
              v={vorm != null ? nlSigned1(vorm) : "—"}
            />
          </div>
        </>
      )}
    </Card>
  );
}
