import type { SettingsInput } from "@cadans/shared";
import { nlDec1, nlInt, nlUpTo1 } from "../../lib/format";
import { Card, Num, Overline } from "../ui";
import { TIERS, tierIndex } from "./tiers";

// Vermogen-snapshot [v1] — natgetrokken uit design/src/niveau.jsx VermogenSnapshot.
// FTP = kopgetal; W/kg = BENADRUKT (klimvermogen); tier uit de W/kg-TIERS (NIET
// engine niveauTier_). Bij ftp/W/kg null → nette leeg-staat.
export function VermogenSnapshot({
  settings,
  wkg,
  eftp,
}: {
  settings: SettingsInput | null;
  wkg: number | null;
  eftp: number | null;
}) {
  const ftp = settings?.ftp ?? null;
  const gewicht = settings?.gewicht ?? null;

  if (ftp == null || wkg == null) {
    return (
      <Card>
        <Overline>Vermogen</Overline>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "20px 8px 12px",
            textAlign: "center",
          }}
        >
          <Num size="40px" color="var(--text-muted)">
            —
          </Num>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              maxWidth: 230,
            }}
          >
            Verbind je account — dan verschijnt hier je FTP, W/kg en
            niveau-tier.
          </div>
        </div>
      </Card>
    );
  }

  const ti = tierIndex(wkg);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Overline>Vermogen</Overline>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--tier-step-border-active)",
            borderRadius: "var(--r-pill)",
            padding: "3px 10px",
            fontFamily: "var(--font-sans)",
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          {TIERS[ti]?.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <Num size="48px" weight={600}>
              {nlInt(ftp)}
            </Num>
            <Num size="17px" weight={500} color="var(--text-muted)">
              W
            </Num>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 7,
            }}
          >
            <Overline style={{ letterSpacing: "0.1em" }}>FTP</Overline>
            {eftp != null && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                · eFTP {nlInt(eftp)} W
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            background: "var(--wkg-emphasis-bg)",
            border: "1px solid var(--tier-step-border-active)",
            borderRadius: "var(--r-md)",
            padding: "9px 13px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              justifyContent: "flex-end",
            }}
          >
            <Num size="30px" weight={600} color="var(--wkg-emphasis)">
              {nlDec1(wkg)}
            </Num>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--wkg-emphasis)",
              }}
            >
              W/kg
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--accent)",
              marginTop: 4,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Klimvermogen
          </div>
          {gewicht != null && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10.5,
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {nlUpTo1(gewicht)} kg
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {TIERS.map((t, i) => (
            <div
              key={t.label}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: i <= ti ? "var(--accent)" : "var(--tier-step)",
                opacity: i < ti ? 0.4 : 1,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 7,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 9.5,
              color: "var(--tier-label)",
            }}
          >
            Beginner
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 9.5,
              color: "var(--tier-label)",
            }}
          >
            Elite
          </span>
        </div>
      </div>
    </Card>
  );
}
