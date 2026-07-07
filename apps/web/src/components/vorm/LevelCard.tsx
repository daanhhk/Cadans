import type { SettingsInput } from "@cadans/shared";
import { nlDec1, nlInt, nlSigned1 } from "../../lib/format";
import {
  type NiveauSeriePoint,
  tierProgress,
  wkgSince,
} from "../../lib/niveau";
import { Card, Num, Overline } from "../ui";

// Niveau-kaart (W/kg-geleid, prototype app.jsx:229). FTP + W/kg = live-data; tier-chip +
// tier-voortgangsbalk + "sinds"-delta uit de gedeelde Niveau-bron (lib/niveau.ts →
// dezelfde engine-fns/TIERS als de Niveau-tab). Debt (k) hiermee ingelost.
export function LevelCard({
  settings,
  serie,
}: {
  settings: SettingsInput | null;
  serie: NiveauSeriePoint[];
}) {
  const ftp = settings?.ftp ?? null;
  const gewicht = settings?.gewicht ?? null;
  const wkg =
    ftp != null && gewicht != null && gewicht > 0 ? ftp / gewicht : null;
  const tp = tierProgress(wkg);
  const since = wkgSince(serie);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Overline>Niveau</Overline>
        {tp && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--tier-step-border-active)",
              borderRadius: "var(--r-pill)",
              padding: "3px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
              }}
            />
            {tp.tierLabel}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--s-4)",
          marginTop: "var(--s-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          {/* off-scale: 52px hero, geen --fs-num-stap */}
          <Num size="52px" weight={600}>
            {wkg != null ? nlDec1(wkg) : "—"}
          </Num>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            W/kg
          </span>
        </div>
        <div style={{ paddingBottom: 5 }}>
          {/* off-scale: 20px, tussen --fs-num-sm/-md */}
          <Num size="20px" weight={600}>
            {ftp != null ? nlInt(ftp) : "—"}
          </Num>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-secondary)",
              marginLeft: 4,
            }}
          >
            W FTP
          </span>
        </div>
      </div>

      {tp?.nextLabel && (
        <div style={{ marginTop: "var(--s-4)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--s-2)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--text-secondary)",
              }}
            >
              nog {nlDec1(tp.remaining ?? 0)} tot{" "}
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {tp.nextLabel}
              </strong>
            </span>
            {since && (
              <span
                style={{
                  fontFamily: "var(--font-num)",
                  fontSize: "var(--fs-caption)",
                  fontWeight: 600,
                  color: since.delta >= 0 ? "var(--good)" : "var(--bad)",
                }}
              >
                {nlSigned1(since.delta)} {since.delta >= 0 ? "↑" : "↓"} sinds{" "}
                {since.sinceMonth}
              </span>
            )}
          </div>
          <div
            style={{
              height: 6, // voortgangsbalk-dikte (grafisch)
              borderRadius: "var(--r-pill)",
              background: "var(--bg-sunken)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${tp.pct * 100}%`,
                borderRadius: "var(--r-pill)",
                background: "var(--accent-grad)",
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
