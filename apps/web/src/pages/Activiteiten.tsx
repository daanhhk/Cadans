import type { ActivitiesResponse } from "@cadans/shared";
import { useEffect, useMemo, useState } from "react";
import { RideDetailSheet } from "../components/schema/RideDetailSheet";
import { ZonePill } from "../components/schema/ZonePill";
import { Num, Overline } from "../components/ui";
import { type ActivityListRow, buildActivityList } from "../lib/activityList";
import { getActivities } from "../lib/api";

// RITDETAILS fase 3 — tabblad Activiteiten: rittenlijst uit GET /api/activities (nieuwste eerst,
// gegroepeerd per maand), tik op een rij → de bestaande RideDetailSheet. Client-only; hergebruikt
// buildActivityList (puur) + RideDetailSheet. Loading/error-chrome 1:1 met Vorm.tsx.

const PAGE = 50;

export function Activiteiten() {
  const [payload, setPayload] = useState<ActivitiesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [zichtbaar, setZichtbaar] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is een bewuste reload-trigger (de "Opnieuw"-knop) — geen echte data-afhankelijkheid.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getActivities()
      .then((a) => {
        if (!alive) return;
        setPayload(a);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const rows = useMemo(() => buildActivityList(payload), [payload]);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px 8px",
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
        }}
      >
        Laden…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "40px 8px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          style={RETRY_BTN}
        >
          Opnieuw
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "40px 8px",
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-muted)",
        }}
      >
        Nog geen activiteiten gesynct.
      </div>
    );
  }

  const visible = rows.slice(0, zichtbaar);
  let lastMaand: string | null = null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 8,
      }}
    >
      {visible.map((row, idx) => {
        const showHeader = row.maand !== lastMaand;
        lastMaand = row.maand;
        return (
          <div
            key={row.idExt !== "" ? row.idExt : `${row.datumIso}-${idx}`}
            style={{ display: "contents" }}
          >
            {showHeader && (
              <Overline style={{ marginTop: idx === 0 ? 0 : 12 }}>
                {row.maand}
              </Overline>
            )}
            <ActivityRowItem row={row} onOpen={() => setOpenId(row.idExt)} />
          </div>
        );
      })}

      {rows.length > zichtbaar && (
        <button
          type="button"
          onClick={() => setZichtbaar((v) => v + PAGE)}
          style={{ ...RETRY_BTN, marginTop: 8, alignSelf: "center" }}
        >
          Meer laden
        </button>
      )}

      {openId !== null && (
        <RideDetailSheet id={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

const RETRY_BTN = {
  height: 38,
  padding: "0 16px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border-strong)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
} as const;

function ActivityRowItem({
  row,
  onOpen,
}: {
  row: ActivityListRow;
  onOpen: () => void;
}) {
  const tikbaar = row.idExt !== "";
  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--card-radius)",
    padding: "var(--card-pad)",
    width: "100%",
    textAlign: "left" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  };

  const inner = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ZonePill zone={row.badgeZone} name={row.badgeLabel} />
        {row.typeLabel !== null && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            {row.typeLabel}
          </span>
        )}
        {row.tss !== null && (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "baseline",
              gap: 3,
            }}
          >
            <Num>{row.tss}</Num>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-muted)",
              }}
            >
              TSS
            </span>
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {row.naam}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-secondary)",
        }}
      >
        {row.dagLabel} · {row.headline}
      </div>
    </>
  );

  if (tikbaar) {
    return (
      <button
        type="button"
        onClick={onOpen}
        style={{ ...cardStyle, cursor: "pointer" }}
      >
        {inner}
      </button>
    );
  }
  return <div style={cardStyle}>{inner}</div>;
}
