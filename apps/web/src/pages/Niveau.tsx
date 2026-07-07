import {
  activeGoalProfile_,
  computeNiveau_,
  ctlReeksMaandelijks_,
  dashNiveauReeks_,
  doelTestWeken_,
  eftpFromActivities_,
  goalGap_,
  maxRecentRideH_,
  niveauProgressie_,
  setGewichtProvider,
  tssPerHourRecent_,
} from "@cadans/engine";
import type { ActivitiesResponse, SettingsInput } from "@cadans/shared";
import { useEffect, useMemo, useState } from "react";
import {
  DoelProjectie,
  type DoelProjectieProps,
  type GapDim,
} from "../components/niveau/DoelProjectie";
import { NiveauSoonCard } from "../components/niveau/NiveauSoonCard";
import {
  type NiveauPoint,
  ProgressieCard,
} from "../components/niveau/ProgressieCard";
import { VermogenSnapshot } from "../components/niveau/VermogenSnapshot";
import { parseActivityRows } from "../lib/activities";
import { getActivities, getSettings } from "../lib/api";
import { todayIso } from "../lib/dates";

// Niveau-tab v1 — VermogenSnapshot + ProgressieCard (live), Rijdersprofiel +
// DoelProjectie (Fase-2-stubs). De niveau-derivaties draaien CLIENT-SIDE via de
// engine (@cadans/engine): in de browser is ambient `new Date()`/formatDate =
// user-lokale TZ = correct (vermijdt de UTC-deploy-debt (d)).
export function Niveau() {
  const [settings, setSettings] = useState<SettingsInput | null>(null);
  const [activities, setActivities] = useState<ActivitiesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is een bewuste reload-trigger (de "Opnieuw"-knop).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([getSettings(), getActivities()])
      .then(([s, a]) => {
        if (!alive) return;
        setSettings(s);
        setActivities(a);
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

  const derived = useMemo(() => {
    const rows = parseActivityRows(activities);
    // gewicht-seam synchroon vlak vóór de derivaties (module-global; alleen Niveau
    // gebruikt 'm). Zonder gewicht → 0 → niveau-punten zonder eigen gewicht = null.
    setGewichtProvider(() => settings?.gewicht ?? 0);
    const niveauReeks = dashNiveauReeks_(settings, rows);
    const ctlByMonth = ctlReeksMaandelijks_(rows);
    const serie = niveauProgressie_(niveauReeks, ctlByMonth) as NiveauPoint[];
    const eftp = eftpFromActivities_(rows) as number | null;
    const snap = computeNiveau_(
      settings?.ftp ?? null,
      settings?.gewicht ?? null,
    ) as {
      wkg: number | null;
    };

    // DoelProjectie-inputs (UI-only samenstelling met engine-primitieven; `buildGoalProfile_`
    // is een GAS-assembler die NIET in de engine zit → hier gecomponeerd uit
    // activeGoalProfile_ + goalGap_). currentCtl = laatste maand-CTL. Vensters uit GAS:
    // longRideH 90d, tssPerHour 42d.
    const ctlMap = (ctlByMonth ?? {}) as Record<string, number>;
    const months = Object.keys(ctlMap).sort();
    const lastMonth = months.at(-1);
    const currentCtl = lastMonth ? (ctlMap[lastMonth] ?? null) : null;
    const prof = activeGoalProfile_(settings) as {
      label: string;
      sub: string | null;
      projectieMode: string;
      dims: Omit<GapDim, "current" | "gap" | "onTrack" | "pct">[];
    };
    const goalInputs: Record<string, number | null> = {
      ftpWkg: snap.wkg,
      ctl: currentCtl,
      longRideH: maxRecentRideH_(rows, 90) as number | null,
    };
    const dims: GapDim[] = prof.dims.map((d) => {
      const cur = goalInputs[d.metric] ?? null;
      const g = goalGap_(cur, d.target, d.dir) as {
        gap: number | null;
        onTrack: boolean;
        pct: number | null;
      };
      return { ...d, current: cur, gap: g.gap, onTrack: g.onTrack, pct: g.pct };
    });
    const projectie: DoelProjectieProps = {
      label: prof.label,
      sub: prof.sub,
      projectieMode: prof.projectieMode,
      dims,
      currentCtl,
      targetCtl: prof.dims.find((d) => d.metric === "ctl")?.target ?? null,
      tssPerHour: tssPerHourRecent_(rows, 42) as number | null,
      currentFtp: eftp ?? settings?.ftp ?? null,
      gewicht: settings?.gewicht ?? null,
      testWeken: doelTestWeken_(
        settings?.doelStart ?? null,
        settings?.doelDuur ?? null,
        todayIso(),
      ) as number | null,
    };

    return { serie, eftp, wkg: snap.wkg, projectie };
  }, [settings, activities]);

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
          style={{
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
          }}
        >
          Opnieuw
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingTop: 8,
      }}
    >
      <VermogenSnapshot
        settings={settings}
        wkg={derived.wkg}
        eftp={derived.eftp}
      />
      <ProgressieCard serie={derived.serie} />
      <NiveauSoonCard
        title="Rijdersprofiel"
        subtitle="Beste inspanning per duur"
        tag="Fase 2"
        body="De power-duration-curve + rijderstype (sprinter ↔ diesel) verschijnen zodra de power-curve-bron is aangesloten."
      />
      <DoelProjectie {...derived.projectie} />
    </div>
  );
}
