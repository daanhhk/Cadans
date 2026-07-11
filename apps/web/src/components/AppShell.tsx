import type { SettingsInput } from "@cadans/shared";
import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { getSettings } from "../lib/api";
import { displayCoach, initials } from "../lib/coach";
import { isoWeekNumber } from "../lib/dates";
import { BottomNav } from "./BottomNav";
import { CadansMark } from "./CadansMark";

// Neutrale user-glyph voor de avatar bij lege initialen (geen extra icon-dep: inline SVG).
function UserGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 16.2c0-2.8 2.5-4.7 5.5-4.7s5.5 1.9 5.5 4.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Mobiel-only app-frame (dark, geen content-frame/max-width — README-constraint):
// een full-height kolom met een slanke merk-header, scrollbare content (Outlet) en
// de vaste bottom-nav. §1-header: logo · coachNaam-woordmerk · "Week N" · avatar(naam-initialen).
// Settings via getSettings() (de app kent geen provider — elke pagina haalt zelf); tijdens
// laden vallen woordmerk/avatar terug op de "Coach"-default + user-glyph (geen crash/flikker).
export function AppShell() {
  const [settings, setSettings] = useState<SettingsInput | null>(null);
  useEffect(() => {
    let alive = true;
    getSettings()
      .then((s) => {
        if (alive) setSettings(s);
      })
      .catch(() => {
        /* header valt terug op defaults */
      });
    return () => {
      alive = false;
    };
  }, []);

  const badge = initials(settings?.naam);

  return (
    <div
      style={{
        height: "100dvh",
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
          {displayCoach(settings?.coachNaam)}
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-label)",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Week {isoWeekNumber(new Date())}
          </span>
          <Link
            to="/instellingen"
            aria-label="Instellingen"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-pill)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent)",
              boxShadow: "0 0 0 3px var(--accent-ring)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            {badge || <UserGlyph />}
          </Link>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "0 16px 16px",
        }}
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
