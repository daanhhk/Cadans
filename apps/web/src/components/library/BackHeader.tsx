// Gedeelde terug-kop — GAS pkHeadHtml_ (Script.html:2074) + trnBackHtml_ (:1925). De trn-variant heeft
// een SUB-regel, de pk-variant niet → `sub` optioneel; weglaten = pk-gedrag (kop zonder sub, verticaal
// gecentreerd naast de terug-chevron).
export function BackHeader({
  title,
  sub,
  onBack,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: sub ? "flex-start" : "center",
        gap: "var(--s-2)",
      }}
    >
      <button
        type="button"
        aria-label="Terug"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          flexShrink: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 13 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 2L4 7l5 5"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
              marginTop: "var(--s-1)",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
