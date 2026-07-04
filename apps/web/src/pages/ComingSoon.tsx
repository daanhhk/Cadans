// Nette "binnenkort"-placeholder voor Schema/Trainingen/Niveau (5.1a heeft nog
// geen tab-data). De echte tabs volgen in latere fases.
export function ComingSoon({ tab }: { tab: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60dvh",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--tracking-overline)",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {tab}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-h1)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        Binnenkort
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
          maxWidth: 240,
          lineHeight: 1.5,
        }}
      >
        Deze tab wordt in een volgende fase gebouwd tegen de Cadans-API.
      </div>
    </div>
  );
}
