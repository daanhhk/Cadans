import type { SchemaSession } from "../../lib/schema";
import { ZoneBar } from "../schema/ZoneBar";

// Gedeelde variant-rij — GAS pkRowsHtml_ (Script.html:2131) / trnVarRowHtml_ (:1940). Verschil is enkel
// de badge ("In je blok") → `badge` optioneel; weglaten = pk-gedrag. Mini-ZoneBar via de height-prop.
export function VariantRow({
  naam,
  session,
  badge,
  onOpen,
}: {
  naam: string;
  session: SchemaSession | null;
  badge?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: "left",
        cursor: "pointer",
        background: "var(--bg-sunken)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--r-md)",
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "var(--s-2)",
        }}
      >
        <span
          style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {naam}
          </span>
          {badge && (
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                color: "var(--accent)",
                background: "var(--accent-soft)",
                borderRadius: "var(--r-pill)",
                padding: "1px 7px",
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </span>
          )}
        </span>
        {session && (
          <span
            style={{
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {session.totaalMin} min · TSS {session.tss}
          </span>
        )}
      </div>
      {session && (
        <div style={{ marginTop: "var(--s-2)" }}>
          <ZoneBar blokken={session.blokken} height={40} />
        </div>
      )}
    </button>
  );
}
