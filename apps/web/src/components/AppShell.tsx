import { Link, Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CadansMark } from "./CadansMark";

// Mobiel-only app-frame (dark, geen content-frame/max-width — README-constraint):
// een full-height kolom met een slanke merk-header, scrollbare content (Outlet) en
// de vaste bottom-nav. Het prototype rendert dit in een IOSDevice-bezel (390×844);
// de echte PWA is full-viewport mobiel (geen fake device-frame) — zie rapport.
export function AppShell() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexShrink: 0,
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 18px 12px",
        }}
      >
        <CadansMark size={22} />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
          }}
        >
          Cadans
        </span>
        <Link
          to="/instellingen"
          aria-label="Instellingen"
          style={{
            marginLeft: "auto",
            width: 36,
            height: 36,
            borderRadius: "var(--r-pill)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 2.4v2.1M10 15.5v2.1M2.4 10h2.1M15.5 10h2.1M4.6 4.6l1.5 1.5M13.9 13.9l1.5 1.5M15.4 4.6l-1.5 1.5M6.1 13.9l-1.5 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
