// Blok-lijst uit de engine-`structuur` (5-tuples [label, dur, watt-range, hr-range, note]).
export function BlockList({ structuur }: { structuur: string[][] }) {
  if (structuur.length === 0) return null;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
    >
      {structuur.map((row) => {
        const label = row[0] ?? "";
        const dur = row[1] ?? "";
        const meta = [row[2], row[3], row[4]]
          .filter((x) => x && x !== "—")
          .join(" · ");
        return (
          <div
            key={row.join("~")}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2, // tight label↔meta-gap (sub-4pt)
              borderLeft: "2px solid var(--border-strong)", // zone-rule (grafische maat)
              paddingLeft: 11, // inspring voorbij de rule (grafisch)
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "var(--s-2)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span>{label}</span>
              <span
                style={{
                  fontFamily: "var(--font-num)",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {dur}
              </span>
            </div>
            {meta && (
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                }}
              >
                {meta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
