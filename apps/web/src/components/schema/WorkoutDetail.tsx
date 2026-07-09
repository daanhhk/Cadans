import { useId, useState } from "react";
import type { SchemaSession } from "../../lib/schema";
import { Num, Overline } from "../ui";
import { BlockList } from "./BlockList";
import { ZoneBar } from "./ZoneBar";

// Eén sessie: naam/focus + duur/TSS + proportioneel per-interval silhouet (ZoneBar) +
// (inklapbare) blok-lijst +
// eindopmerking. session.focus is in het view-model al NL-gemapt + gededupliceerd t.o.v.
// de zone-labels (lib/schema.ts toSession) → hier rauw renderen. De tekstuele stappen
// (BlockList) staan DEFAULT ingeklapt; klik op de bars+samenvatting klapt ze uit
// (conform schema.jsx ProposalDetail). De toggle is een echte <button> met aria-expanded/
// aria-controls.
export function WorkoutDetail({
  session,
  overline,
}: {
  session: SchemaSession;
  overline?: string;
}) {
  const [openBlocks, setOpenBlocks] = useState(false);
  const blocksId = useId();
  const hasBlocks = session.structuur.length > 0;

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

      {hasBlocks ? (
        <>
          <button
            type="button"
            onClick={() => setOpenBlocks((v) => !v)}
            aria-expanded={openBlocks}
            aria-controls={blocksId}
            aria-label={
              openBlocks
                ? "Trainingsstappen verbergen"
                : "Trainingsstappen tonen"
            }
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-3)",
              width: "100%",
              padding: 0,
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <ZoneBar blokken={session.blokken} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "var(--s-2)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Blokstructuur
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-1)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                }}
              >
                {session.structuur.length} blokken
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  style={{
                    transform: openBlocks ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                  }}
                >
                  <path
                    d="M3 5l4 4 4-4"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </button>
          <div id={blocksId} hidden={!openBlocks}>
            <BlockList structuur={session.structuur} />
          </div>
        </>
      ) : (
        <ZoneBar blokken={session.blokken} />
      )}

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
