import {
  activeGoalProfile_,
  computeNiveau_,
  ctlReeksMaandelijks_,
  dashNiveauReeks_,
  doelTestWeken_,
  eftpFromActivities_,
  niveauProgressie_,
  setGewichtProvider,
  tssPerHourRecent_,
  weeklyHoursRecent_,
} from "@cadans/engine";
import type {
  ActivitiesResponse,
  PowerCurveResponse,
  SettingsInput,
} from "@cadans/shared";
import { useEffect, useMemo, useState } from "react";
import {
  DoelProjectie,
  type DoelProjectieProps,
  type GapDim,
} from "../components/niveau/DoelProjectie";
import {
  type NiveauPoint,
  ProgressieCard,
} from "../components/niveau/ProgressieCard";
import { Rijdersprofiel } from "../components/niveau/Rijdersprofiel";
import { VermogenSnapshot } from "../components/niveau/VermogenSnapshot";
import { parseActivityRows } from "../lib/activities";
import { getActivities, getPowerCurve, getSettings } from "../lib/api";
import { todayIso } from "../lib/dates";
import { buildGoalDims, buildGoalInputs, onderhoudVloerW } from "../lib/niveau";

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
  const [pcWindow, setPcWindow] = useState<"90d" | "1y">("1y");
  const [pc, setPc] = useState<PowerCurveResponse | null>(null);
  const [pcLoading, setPcLoading] = useState(true);

  // Power-curve apart: eigen laadstaat + window-toggle → refetch los van settings/activities.
  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce = bewuste reload-trigger.
  useEffect(() => {
    let alive = true;
    setPcLoading(true);
    getPowerCurve(pcWindow)
      .then((r) => {
        if (!alive) return;
        setPc(r);
        setPcLoading(false);
      })
      .catch(() => {
        // cache leeg / geen intervals-auth lokaal → degradeer naar de lege staat.
        if (!alive) return;
        setPc({ empty: true });
        setPcLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pcWindow, nonce]);

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

    // DoelProjectie-inputs. De samenstelling zelf staat in `lib/niveau.ts` — één plek voor de
    // vier meetgrootheden en één voor de dims, zodat de Niveau-tab en elke andere lezer niet
    // uiteen kunnen lopen. `buildGoalProfile_` is een GAS-assembler die NIET in de engine zit;
    // hier gecomponeerd uit activeGoalProfile_ + goalGap_. Vensters uit GAS: longRideH 90d,
    // tssPerHour 42d.
    const prof = activeGoalProfile_(settings) as {
      label: string;
      sub: string | null;
      projectieMode: string;
      dims: Omit<GapDim, "current" | "gap" | "onTrack" | "pct">[];
    };
    const goalInputs = buildGoalInputs(settings, rows);
    // De behoud-vloer is de ENIGE afgeleide target; hij ankert op settings.doelStart.
    const vloerW = onderhoudVloerW(rows, settings?.doelStart);
    const dims: GapDim[] = buildGoalDims(prof, goalInputs, vloerW);
    // Uit DEZELFDE inputs als de gap-rijen, zodat de kaart en de rij niet uiteen kunnen lopen.
    const currentCtl = goalInputs.ctl ?? null;
    const projectie: DoelProjectieProps = {
      label: prof.label,
      sub: prof.sub,
      projectieMode: prof.projectieMode,
      dims,
      currentCtl,
      targetCtl: prof.dims.find((d) => d.metric === "ctl")?.target ?? null,
      tssPerHour: tssPerHourRecent_(rows, 42) as number | null,
      // GAS WebApp.gs:1268 gebruikt uitsluitend de INGESTELDE FTP als band-basis (geen eFTP);
      // eftp blijft de fallback als settings.ftp ontbreekt. VermogenSnapshot toont eftp apart.
      currentFtp: settings?.ftp ?? eftp ?? null,
      gewicht: settings?.gewicht ?? null,
      // NIVEAUKAART-RONDE: `doelTestWeken_` ankert op het LOPENDE blok en leest `doelDuur` niet
      // meer; de blok-lengte komt uit `DOEL_BLOK_WEKEN`.
      doel: settings?.doel ?? null,
      testWeken: doelTestWeken_(settings?.doelStart ?? null, todayIso()) as
        | number
        | null,
      // T28: de INGESTELDE weekuren (settings.weekUren) zijn de projectie-baseline indien
      // opgegeven; anders val terug op recent gereden weekvolume (42d), anders → component → 8.
      weeklyHoursDefault:
        settings?.weekUren ?? (weeklyHoursRecent_(rows, 42) as number | null),
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
      <Rijdersprofiel
        data={pc}
        window={pcWindow}
        onWindow={setPcWindow}
        loading={pcLoading}
      />
      <DoelProjectie {...derived.projectie} />
    </div>
  );
}
