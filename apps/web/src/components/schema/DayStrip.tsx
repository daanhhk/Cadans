import { type SchemaDay, ZONE_META } from "../../lib/schema";
import { Num } from "../ui";

function Indicator({ day }: { day: SchemaDay }) {
  if (day.state === "done") {
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 7.5l3.2 3.5L12 3.5"
          stroke="var(--text-secondary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (day.sessions.length === 0) {
    return (
      <span
        style={{
          width: 8,
          height: 2,
          borderRadius: 2,
          background: "var(--border-strong)",
        }}
      />
    );
  }
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {day.sessions.map((s) => (
        <span
          key={`${s.naam}-${s.tss}`}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: s.zones[0]
              ? ZONE_META[s.zones[0]].color
              : "var(--accent)",
          }}
        />
      ))}
    </span>
  );
}

// 7-daagse selector: weekdag + dag-nummer + status-indicator (done ✓ / rustdag – /
// zone-dots per sessie). Today + geselecteerd = accent-rand.
export function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: SchemaDay[];
  selected: string;
  onSelect: (datum: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "2px 2px 6px",
      }}
    >
      {days.map((day) => {
        const isSel = day.datum === selected;
        const isToday = day.state === "today";
        const accentEdge = isSel || isToday;
        return (
          <button
            key={day.datum}
            type="button"
            onClick={() => onSelect(day.datum)}
            style={{
              flex: "0 0 auto",
              width: 50,
              padding: "9px 0 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              borderRadius: "var(--r-md)",
              background: isSel ? "var(--accent-soft)" : "var(--bg-surface)",
              border: `1.5px solid ${
                isSel
                  ? "var(--accent)"
                  : isToday
                    ? "color-mix(in srgb, var(--accent) 55%, transparent)"
                    : "var(--border-subtle)"
              }`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: accentEdge ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {day.weekday}
            </span>
            <Num
              size="17px"
              color={isSel ? "var(--accent)" : "var(--text-primary)"}
            >
              {day.dayNum}
            </Num>
            <span
              style={{
                height: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Indicator day={day} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
