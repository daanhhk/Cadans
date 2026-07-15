import { DUR_MAX, DUR_MIN, DUR_STEP } from "../../lib/library";
import { durLabel } from "../../lib/schema";

// Gedeelde duur-slider — GAS pkSliderHtml_ (Script.html:2117) én trnSliderHtml_ (:1932) zijn identiek.
// Label "Duur · structuur schaalt mee" links, de waarde rechts via durLabel; native range met de
// library.ts-constanten; accentColor --slider-fill; min/max-hints eronder. aria-label verplicht.
export function DurationSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
          }}
        >
          Duur · structuur schaalt mee
        </span>
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          {durLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={DUR_MIN}
        max={DUR_MAX}
        step={DUR_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Duur van de training"
        style={{
          width: "100%",
          marginTop: "var(--s-2)",
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
        <span>{durLabel(DUR_MIN)}</span>
        <span>{durLabel(DUR_MAX)}</span>
      </div>
    </div>
  );
}
