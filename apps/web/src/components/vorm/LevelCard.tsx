import type { SettingsInput } from "@cadans/shared";
import { nlDec1, nlInt } from "../../lib/format";
import { Card, Num, Overline } from "../ui";

// Niveau-kaart (W/kg-geleid, prototype LevelCard). FTP + W/kg = 1:1 live-data.
// De tier-chip ("Gevorderd") + de "sinds"-delta + tier-voortgangsbalk vergen de
// niveau/tier-afleiding → DEFERRED, hier weggelaten.
export function LevelCard({ settings }: { settings: SettingsInput | null }) {
  const ftp = settings?.ftp ?? null;
  const gewicht = settings?.gewicht ?? null;
  const wkg =
    ftp != null && gewicht != null && gewicht > 0 ? ftp / gewicht : null;

  return (
    <Card>
      <Overline>Niveau</Overline>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <Num size="52px" weight={600}>
            {wkg != null ? nlDec1(wkg) : "—"}
          </Num>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            W/kg
          </span>
        </div>
        <div style={{ paddingBottom: 5 }}>
          <Num size="20px" weight={600}>
            {ftp != null ? nlInt(ftp) : "—"}
          </Num>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--text-secondary)",
              marginLeft: 4,
            }}
          >
            W FTP
          </span>
        </div>
      </div>
    </Card>
  );
}
