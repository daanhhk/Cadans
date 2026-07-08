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
          gap: 3, // tight waarde↔/gepland-gap (sub-4pt)
        }}
      >
        {/* TODO off-scale: 20px valt tussen --fs-num-sm (17) en --fs-num-md (26) */}
        <Num size="20px">{fmt(gedaan)}</Num>
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontSize: 11, // TODO off-scale: num-suffix, geen --fs-num-stap op 11
            color: "var(--text-muted)",
          }}
        >
          /{fmt(gepland)}
        </span>
      </div>
      {/* TODO off-scale: 9.5px < --fs-caption (11), geen kleiner type-token */}
      <Overline style={{ marginTop: 5, fontSize: 9.5 }}>{label}</Overline>
    </div>
  );
}

// "Deze week · gepland vs gedaan": TSS/Uren/Dagen (gedaan/gepland) + voortgangsbalk +
// regenereer-knop. GEPLAND uit het voorstel, GEDAAN uit doneTssByDate.
export function WeekLoad({
  tss,
  minuten,
  dagen,
  onRegen,
  regenerating = false,
  syncNote = null,
}: {
  tss: LoadStat;
  minuten: LoadStat;
  dagen: LoadStat;
  onRegen: () => void;
  regenerating?: boolean;
  syncNote?: { text: string; error: boolean } | null;
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
            width: 32, // vaste icoonknop (grafisch)
            height: 32,
            padding: 0,
            borderRadius: "var(--r-pill)",
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
      {syncNote && (
        <div
          style={{
            marginTop: "var(--s-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: syncNote.error ? "var(--danger)" : "var(--text-secondary)",
          }}
        >
          {syncNote.text}
        </div>
      )}
      <div style={{ display: "flex", marginTop: "var(--s-3)" }}>
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
      <div style={{ marginTop: "var(--s-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "var(--s-2)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-secondary)",
            }}
          >
            Voortgang
          </span>
          {/* TODO off-scale: 11px num-figuur, geen --fs-num-stap op 11 */}
          <Num size="11px" color="var(--text-secondary)">
            {`${pct}% van plan`}
          </Num>
        </div>
        <div
          style={{
            height: 6, // voortgangsbalk-dikte (grafische maat)
            borderRadius: "var(--r-pill)",
            background: "var(--bg-sunken)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: "var(--r-pill)",
              background: "var(--accent-grad)", // conform schema.jsx WeekLoad
            }}
          />
        </div>
      </div>
    </Card>
  );
}
