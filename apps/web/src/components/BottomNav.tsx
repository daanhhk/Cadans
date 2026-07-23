import { NavLink } from "react-router-dom";
import { NavIcon, type TabKey } from "./NavIcon";

const TABS: { key: TabKey; path: string; label: string }[] = [
  { key: "schema", path: "/schema", label: "Schema" },
  { key: "vorm", path: "/vorm", label: "Vorm" },
  { key: "trainingen", path: "/trainingen", label: "Trainingen" },
  { key: "niveau", path: "/niveau", label: "Niveau" },
  { key: "activiteiten", path: "/activiteiten", label: "Activiteiten" },
];

// Vaste onderbalk — natgetrokken uit design/src/app.jsx BottomNav: actief =
// --accent (icoon + label + top-indicatorbalk), inactief = --text-muted; blur-bg
// over content, safe-area onderaan. Route-actief via NavLink's isActive.
export function BottomNav() {
  return (
    <nav
      style={{
        display: "flex",
        flexShrink: 0,
        background: "color-mix(in srgb, var(--bg-app) 88%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      {TABS.map((t) => (
        <NavLink
          key={t.key}
          to={t.path}
          aria-label={t.label}
          style={{
            flex: 1,
            textDecoration: "none",
            padding: "9px 0 5px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            position: "relative",
          }}
        >
          {({ isActive }) => {
            const col = isActive ? "var(--accent)" : "var(--text-muted)";
            return (
              <>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      width: 22,
                      height: 2.5,
                      borderRadius: 999,
                      background: "var(--accent)",
                    }}
                  />
                )}
                <span style={{ color: col, display: "flex" }}>
                  <NavIcon k={t.key} />
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    color: col,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
