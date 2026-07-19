import type { InhaalVoorstel } from "../../lib/schema";
import { Card, Overline } from "../ui";
import { CoachCallout } from "./CoachCallout";

// FASE 2b — het INHAAL-VOORSTEL op weekniveau. READ-ONLY: dit blok toont wat er ZOU
// veranderen; het actieve plan blijft het origineel en er wordt niets gemuteerd of
// gepersisteerd. De goedkeur-actie komt in fase 3 (M10: voorstellen, niet stil muteren).
//
// Visueel spiegelt dit de VerlichtCard: dezelfde CoachCallout voor de aanbod-copy, dezelfde
// design-tokens, geen eigen kleuren. De dag-regels tonen NL-namen (typeNaam), nooit de
// ruwe engine-type-keys.

/** "2026-07-22" → "wo 22" (lokale parse; geen UTC-round-trip). */
function dagLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const wd = ["zo", "ma", "di", "wo", "do", "vr", "za"][dt.getDay()] ?? "";
  return `${wd} ${dt.getDate()}`;
}

export function InhaalCard({
  voorstel,
  coachNaam,
}: {
  voorstel: InhaalVoorstel;
  coachNaam: string | null;
}) {
  return (
    <Card>
      <Overline>Voorstel · inhalen</Overline>
      <CoachCallout
        narrative={voorstel.regel}
        coachNaam={coachNaam}
        style={{ marginTop: "var(--s-3)" }}
      />
      <div
        style={{
          marginTop: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Wat er zou veranderen
        </div>
        {voorstel.dagen.map((d) => (
          <div
            key={d.datum}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "var(--s-2)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                minWidth: 44,
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {dagLabel(d.datum)}
            </span>
            <span>
              {d.fromNaam} <span aria-hidden="true">→</span>{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {d.toNaam}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: "var(--s-4)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          lineHeight: "var(--lh-body)",
        }}
      >
        Je plan is nog niet aangepast — dit is alleen een voorstel.
      </div>
    </Card>
  );
}
