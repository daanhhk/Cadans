import type { SchemaSession } from "../../lib/schema";
import { Num, Overline } from "../ui";
import { BlockList } from "./BlockList";
import { ZoneBar } from "./ZoneBar";

// Eén sessie: naam/focus + duur/TSS + zone-pills + blok-lijst + eindopmerking.
export function WorkoutDetail({
  session,
  overline,
}: {
  session: SchemaSession;
  overline?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {overline && <Overline>{overline}</Overline>}
      <div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.25,
          }}
        >
          {session.naam}
        </div>
        {session.focus && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {session.focus}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <Num size="18px">{session.totaalMin}</Num>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            min
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <Num size="18px">{session.tss}</Num>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            TSS
          </span>
        </div>
      </div>
      <ZoneBar zones={session.zones} />
      <BlockList structuur={session.structuur} />
      {session.eindopmerking && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            fontStyle: "italic",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 10,
          }}
        >
          {session.eindopmerking}
        </div>
      )}
    </div>
  );
}
