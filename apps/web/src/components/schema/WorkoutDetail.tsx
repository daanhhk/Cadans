import type { SchemaSession } from "../../lib/schema";
import { Num, Overline } from "../ui";
import { BlockList } from "./BlockList";
import { ZoneBar } from "./ZoneBar";
import { ZoneLegend } from "./ZoneLegend";

// Eén sessie: naam/focus + duur/TSS + zone-pills + blok-lijst + eindopmerking.
// session.focus is in het view-model al NL-gemapt + gededupliceerd t.o.v. de zone-pill
// (lib/schema.ts toSession) → hier rauw renderen, geen dubbel zone-woord.
export function WorkoutDetail({
  session,
  overline,
}: {
  session: SchemaSession;
  overline?: string;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
    >
      {overline && <Overline>{overline}</Overline>}
      <div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h2)",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: "var(--lh-h2)",
          }}
        >
          {session.naam}
        </div>
        {session.focus && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
              marginTop: 2, // tight label-gap (sub-4pt)
            }}
          >
            {session.focus}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "var(--s-4)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <Num size="var(--fs-num-sm)">{session.totaalMin}</Num>
          <span
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            min
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <Num size="var(--fs-num-sm)">{session.tss}</Num>
          <span
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            TSS
          </span>
        </div>
      </div>
      <ZoneBar blokken={session.blokken} />
      <ZoneLegend zones={session.zones} />
      <BlockList structuur={session.structuur} />
      {session.eindopmerking && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
            fontStyle: "italic",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 10, // divider-ademruimte (tussen --s-2/--s-3)
          }}
        >
          {session.eindopmerking}
        </div>
      )}
    </div>
  );
}
