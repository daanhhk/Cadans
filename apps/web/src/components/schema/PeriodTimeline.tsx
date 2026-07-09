import { Overline } from "../ui";

// Vaste macro-fase-volgorde voor de periodisering-balk (spec §2): Basis · Build · Peak · Taper.
// LET OP — Taper licht (nog) NIET op: de balk-actieve-fase leest `macroFase` (= proposalWeek.macroFase
// = de engine-macroFase Base/Build/Peak/Recovery/Test, NOOIT "Taper"; effectiveMacroFase_ planner.ts:88).
// De engine berekent Taper WEL, maar als OVERLAY in het `fase`-veld (phase.ts:165), niet in macroFase →
// het 4e segment wordt getoond maar activeert pas als die overlay wordt doorgekoppeld (open FASE-2-mapping).
const FASE_SEQ = [
  { key: "Base", label: "Basis" },
  { key: "Build", label: "Build" },
  { key: "Peak", label: "Peak" },
  { key: "Taper", label: "Taper" },
];

function Stat({
  label,
  val,
  accent,
}: {
  label: string;
  val: string;
  accent?: boolean;
}) {
  return (
    <div>
      <Overline>{label}</Overline>
      <div
        style={{
          marginTop: "var(--s-1)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          color: accent ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {val}
      </div>
    </div>
  );
}

function ModeChip({ label }: { label: string }) {
  return (
    <span
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 5, // tight dot↔label (sub-4pt)
        background: "var(--mode-chip-bg)",
        color: "var(--mode-chip-text)",
        border: "1px solid var(--mode-chip-border)",
        borderRadius: "var(--r-pill)",
        padding: "3px 9px", // chip-interne padding
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-caption)",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6, // status-dot (grafische maat)
          height: 6,
          borderRadius: "var(--r-pill)",
          background: "var(--mode-chip-text)",
        }}
      />
      {label}
    </span>
  );
}

// Periodisering-kaart bovenaan de Schema-tab (tegen schema.jsx PeriodTimeline; zónder de
// uitklap-/chevron-interactie en zónder proportionele fase-breedtes — de per-fase-weekduur,
// event-tag-posities en volume-target zitten niet in de engine-output). Gelijke-breedte
// sequentie-staven met de huidige fase gemarkeerd; echte eventNaam + wekenTot.
export function PeriodTimeline({
  faseLabel,
  macroFase,
  eventNaam,
  wekenTotEvent,
  planModus,
}: {
  faseLabel: string;
  macroFase: string;
  eventNaam: string | null;
  wekenTotEvent: number | null;
  planModus: string | null;
}) {
  const curIdx = FASE_SEQ.findIndex((p) => p.key === macroFase);
  const hasEvent = eventNaam != null && wekenTotEvent != null;
  const segBg = (i: number): string =>
    i < curIdx
      ? "color-mix(in srgb, var(--accent) 28%, var(--bg-sunken))"
      : i === curIdx
        ? "var(--accent)"
        : "var(--bg-elevated)";
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--s-4)",
      }}
    >
      <Overline>Plan · periodisering</Overline>
      <div
        style={{
          marginTop: "var(--s-1)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {faseLabel}
        {hasEvent && ` · nog ${wekenTotEvent} wkn tot ${eventNaam}`}
      </div>

      <div
        style={{ display: "flex", gap: "var(--s-1)", marginTop: "var(--s-3)" }}
      >
        {FASE_SEQ.map((p, i) => (
          <div
            key={p.key}
            style={{
              flex: 1,
              height: 10, // sequentie-staafhoogte (grafische maat)
              borderRadius: "var(--r-xs)",
              background: segBg(i),
              border: i > curIdx ? "1px solid var(--border-subtle)" : "none",
            }}
          />
        ))}
      </div>
      <div
        style={{ display: "flex", gap: "var(--s-1)", marginTop: "var(--s-2)" }}
      >
        {FASE_SEQ.map((p, i) => (
          <div
            key={p.key}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              color: i === curIdx ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {p.label}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-4)",
          marginTop: "var(--s-4)",
        }}
      >
        <Stat label="Fase" val={faseLabel} accent />
        {hasEvent && (
          <Stat label={`Tot ${eventNaam}`} val={`${wekenTotEvent} wkn`} />
        )}
        {planModus && <ModeChip label={planModus} />}
      </div>
    </div>
  );
}
