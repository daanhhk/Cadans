import type { DoneCompareZone } from "../../lib/schema";

// Per-zone gepland-vs-gedaan overlay-bars, design-geankerd op ZoneCompare/ZoneCompareRow
// (design/src/coach-feedback.jsx). Eén rij per zone: faded geplande-omvang-balk +
// massieve gedaan-balk eroverheen, plus gedaan-minuten + status-annotatie ("gepland N'" /
// "niet gereden" / "niet gepland"). Strikt de --zcompare-*/--zone-*/--reading-* tokens; de
// micro-geometrie (dot 7, legend-swatch 13×7/13×5) volgt de design-literals (grafisch).
const ZNAME: Record<number, string> = {
  1: "Herstel",
  2: "Duur",
  3: "Tempo",
  4: "Drempel",
  5: "VO2max",
};

function CompareRow({ r, scale }: { r: DoneCompareZone; scale: number }) {
  const zc = `var(--zone-${r.z})`;
  const planPct = (r.plan / scale) * 100;
  const donePct = (r.done / scale) * 100;
  const unplanned = r.plan === 0 && r.done > 0;
  const skipped = r.plan > 0 && r.done === 0;
  const empty = r.plan === 0 && r.done === 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "84px 1fr 58px",
        columnGap: "var(--s-2)",
        alignItems: "center",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 2,
            background: zc,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
            color: "var(--zcompare-label)",
            flexShrink: 0,
          }}
        >
          Z{r.z}
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {ZNAME[r.z]}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: "var(--zcompare-track-h)",
          borderRadius: "var(--r-xs)",
          background: "var(--zcompare-track)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${planPct}%`,
            background: `color-mix(in srgb, ${zc} var(--zcompare-plan-strength), transparent)`,
            borderRadius: "var(--r-xs)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "var(--zcompare-done-h)",
            width: `${donePct}%`,
            minWidth: r.done > 0 ? 3 : 0,
            background: zc,
            borderRadius: "var(--r-pill)",
          }}
        />
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-num)",
              fontVariantNumeric: "tabular-nums",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              color: empty
                ? "var(--text-muted)"
                : skipped
                  ? "var(--zcompare-tag-skipped)"
                  : zc,
            }}
          >
            {r.done}
          </span>
          <span
            style={{
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            ′
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
            marginTop: 1,
            lineHeight: 1.2,
            color: empty
              ? "var(--text-muted)"
              : unplanned
                ? "var(--zcompare-tag-unplanned)"
                : skipped
                  ? "var(--zcompare-tag-skipped)"
                  : "var(--reading-planned)",
          }}
        >
          {empty
            ? "—"
            : unplanned
              ? "niet gepland"
              : skipped
                ? "niet gereden"
                : `gepland ${r.plan}′`}
        </div>
      </div>
    </div>
  );
}

export function ZoneCompare({ zones }: { zones: DoneCompareZone[] }) {
  // Altijd alle 5 zones (Z1-Z5) tonen — bewuste afwijking van GAS (dat lege zones weglaat, zie
  // coachZonesHtml_), zodat in een oogopslag zichtbaar is welke zones onaangeroerd bleven (0').
  const rows = zones;
  if (rows.length === 0) return null;
  const scale = Math.max(1, ...rows.map((r) => Math.max(r.plan, r.done)));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "var(--s-3)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--reading-col-label)",
          }}
        >
          Zone-vergelijking · min
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                width: 13,
                height: 7,
                borderRadius: 2,
                background:
                  "color-mix(in srgb, var(--text-secondary) var(--zcompare-plan-strength), transparent)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--reading-planned)",
              }}
            >
              gepland
            </span>
          </span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                width: 13,
                height: 5,
                borderRadius: "var(--r-pill)",
                background: "var(--text-secondary)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--reading-done)",
              }}
            >
              gedaan
            </span>
          </span>
        </div>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
      >
        {rows.map((r) => (
          <CompareRow key={r.z} r={r} scale={scale} />
        ))}
      </div>
    </div>
  );
}
