import { Card, Overline } from "../ui";

// Soon-tag — natgetrokken uit design/src/niveau.jsx SoonTag (--soon-tag-*).
function SoonTag({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--soon-tag-bg)",
        border: "1px solid var(--soon-tag-border)",
        color: "var(--soon-tag-text)",
        borderRadius: "var(--r-pill)",
        padding: "3px 9px",
        fontFamily: "var(--font-sans)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: "var(--text-muted)",
        }}
      />
      {children}
    </span>
  );
}

// Stub-kaart voor de twee Fase-2-elementen (Rijdersprofiel, Doel-projectie): visueel
// compleet met soon-tag + "binnenkort"-lichaam, GEEN data/logica (nog niet gebouwd).
export function NiveauSoonCard({
  title,
  subtitle,
  tag,
  body,
}: {
  title: string;
  subtitle: string;
  tag: string;
  body: string;
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Overline>{title}</Overline>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 3,
            }}
          >
            {subtitle}
          </div>
        </div>
        <SoonTag>{tag}</SoonTag>
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "26px 12px 14px",
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
    </Card>
  );
}
