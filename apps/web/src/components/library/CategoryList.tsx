import type { LibraryCategory } from "../../lib/library";

// Gedeelde categorie-lijst — GAS pkCatsHtml_ (Script.html:2107) + trnCatsHtml_ (:1912) zijn identiek
// op de trn-overline na; die overline hoort bij de PÁGINA, niet bij de lijst → buiten dit component.
// Kleur uit cat.zoneVar (al genormaliseerd naar --zone-1..--zone-6 in library.ts).
export function CategoryList({
  cats,
  onOpen,
}: {
  cats: LibraryCategory[];
  onOpen: (key: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      {cats.map((c) => (
        <button
          type="button"
          key={c.key}
          onClick={() => onOpen(c.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--s-3)",
            textAlign: "left",
            cursor: "pointer",
            background: "var(--bg-sunken)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r-md)",
            padding: "12px 14px",
          }}
        >
          <span
            style={{
              width: 4,
              alignSelf: "stretch",
              borderRadius: "var(--r-pill)",
              background: `var(${c.zoneVar})`,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                color: `var(${c.zoneVar})`,
              }}
            >
              {c.label}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
                marginTop: 1,
              }}
            >
              {c.omschrijving} · {c.variants.length}{" "}
              {c.variants.length === 1 ? "variant" : "varianten"}
            </span>
          </span>
          <svg
            width="10"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1l5 6-5 6"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
