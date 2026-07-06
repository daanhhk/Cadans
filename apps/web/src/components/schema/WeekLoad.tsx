import type { LoadStat } from "../../lib/schema";
import { Card, Num, Overline } from "../ui";

function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function Stat({
  gedaan,
  gepland,
  label,
  fmt,
  first,
}: {
  gedaan: number;
  gepland: number;
  label: string;
  fmt: (n: number) => string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        borderLeft: first ? "none" : "1px solid var(--border-subtle)",
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
        <Num size="20px">{fmt(gedaan)}</Num>
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          /{fmt(gepland)}
        </span>
      </div>
      <Overline style={{ marginTop: 5, fontSize: 9.5 }}>{label}</Overline>
    </div>
  );
}

// "Deze week · gepland vs gedaan": TSS/Uren/Dagen (gedaan/gepland) + voortgangsbalk +
// regenereer-knop. GEPLAND uit het voorstel, GEDAAN uit doneTssByDate (uren-gedaan nog 0
// tot een done-minuten-bron bestaat — stap 3). onRegen is in stap 2 een no-op stub.
export function WeekLoad({
  tss,
  minuten,
  dagen,
  onRegen,
  regenerating = false,
}: {
  tss: LoadStat;
  minuten: LoadStat;
  dagen: LoadStat;
  onRegen: () => void;
  regenerating?: boolean;
}) {
  const pct =
    tss.gepland > 0 ? Math.round((tss.gedaan / tss.gepland) * 100) : 0;
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Overline>Deze week · gepland vs gedaan</Overline>
        <button
          type="button"
          onClick={onRegen}
          disabled={regenerating}
          aria-label="Werk week bij"
          title="Werk week bij"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            padding: 0,
            borderRadius: 999,
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
            cursor: regenerating ? "default" : "pointer",
            opacity: regenerating ? 0.5 : 1,
            color: "var(--accent)",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 7a5 5 0 11-1.5-3.6"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 1.5V4.2H9.3"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div style={{ display: "flex", marginTop: 12 }}>
        <Stat
          first
          gedaan={tss.gedaan}
          gepland={tss.gepland}
          label="TSS"
          fmt={(n) => String(Math.round(n))}
        />
        <Stat
          gedaan={minuten.gedaan}
          gepland={minuten.gepland}
          label="Uren"
          fmt={hhmm}
        />
        <Stat
          gedaan={dagen.gedaan}
          gepland={dagen.gepland}
          label="Dagen"
          fmt={(n) => String(n)}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              color: "var(--text-secondary)",
            }}
          >
            Voortgang
          </span>
          <Num size="11px" color="var(--text-secondary)">
            {`${pct}% van plan`}
          </Num>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "var(--bg-sunken)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 999,
              background: "var(--accent)",
            }}
          />
        </div>
      </div>
    </Card>
  );
}
