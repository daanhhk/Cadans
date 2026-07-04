import { Outlet } from "react-router-dom";
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
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
