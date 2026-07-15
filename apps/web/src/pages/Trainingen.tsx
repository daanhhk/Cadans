import type { CheckinInput, SettingsInput } from "@cadans/shared";
import { useEffect, useMemo, useState } from "react";
import { BackHeader } from "../components/library/BackHeader";
import { CategoryList } from "../components/library/CategoryList";
import { DurationSlider } from "../components/library/DurationSlider";
import { VariantRow } from "../components/library/VariantRow";
import { WorkoutDetail } from "../components/schema/WorkoutDetail";
import { Overline } from "../components/ui";
import { CheckinSheet } from "../components/vorm/CheckinSheet";
import { ReadinessCard } from "../components/vorm/ReadinessCard";
import { putOverride } from "../lib/api";
import {
  findCategory,
  findVariant,
  isDayPlannable,
  type LibraryVariant,
  libraryOverride,
  nextPlannableDate,
  previewOverrideSession,
  trainingCategories,
  weekPlannedTypes,
} from "../lib/library";
import {
  back,
  effectiveDur,
  goView,
  initialPickerState,
  openCat,
  openWorkout,
  type PickerState,
  setDur,
} from "../lib/pickerState";
import {
  bumpPlannerVersion,
  subscribePlannerVersion,
} from "../lib/plannerSignal";
import type { ProposalWeek } from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import {
  deriveSchemaView,
  loadSchemaWeek,
  type SchemaView,
} from "../lib/schema";

// Live container voor de Trainingen-tab (GAS renderTrainingen, Script.html:1972). EEN loader:
// loadSchemaWeek() — dezelfde bron als Schema. Bewuste GAS-divergentie: bovenaan de ReadinessCard,
// GEEN LevelCard (GAS' 2-slide swipe-deck is een layout-motief; Cadans schrapte die deck op Vorm al
// bewust → één status-kaart is genoeg, en de tab heeft aan loadSchemaWeek genoeg, geen tweede
// activities-fetch). GEEN auto-sync-effect hier (dat is Schema's taak). Spiegelt Schema's
// loading-/error-/nonce-/subscribePlannerVersion-patroon.
interface TrainData {
  proposalWeek: ProposalWeek;
  view: SchemaView;
  readiness: ReadinessResult;
  todayISO: string;
  settings: SettingsInput;
  checkin: CheckinInput | null;
}

export function Trainingen() {
  const [raw, setRaw] = useState<Awaited<
    ReturnType<typeof loadSchemaWeek>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    if (nonce === 0) setLoading(true);
    setError(null);
    loadSchemaWeek()
      .then((d) => {
        if (!alive) return;
        setRaw(d);
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

  // Planner-mutatie-signaal: een eigen Inplannen-write (of een Weekplanner-save elders) bumpt de
  // versie → herlaad de week (nieuwe voorgesteldType → badge/preview kloppen). Geen intervals-sync.
  useEffect(() => subscribePlannerVersion(() => setNonce((n) => n + 1)), []);

  // deriveSchemaView is puur (identiek aan wat SchemaView doet — bewust dezelfde afleiding, geen
  // nieuwe fetch); per load gememoiseerd.
  const data = useMemo<TrainData | null>(() => {
    if (!raw) return null;
    const view = deriveSchemaView(
      raw.proposalWeek,
      raw.doneByDate,
      raw.todayISO,
      raw.dispositionByDate,
    );
    return {
      proposalWeek: raw.proposalWeek,
      view,
      readiness: raw.readiness,
      todayISO: raw.todayISO,
      settings: raw.settings,
      checkin: raw.readiness.checkin,
    };
  }, [raw]);

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

  if (!data) return null;

  return <TrainingenView data={data} onReload={() => setNonce((n) => n + 1)} />;
}

// Pure-ish presentatie + lokale UI-state (picker-view, check-in-sheet, sessie-scoped planned-map).
// Bewust gescheiden van de loader, net als SchemaView los van Schema.
function TrainingenView({
  data,
  onReload,
}: {
  data: TrainData;
  onReload: () => void;
}) {
  const { proposalWeek, view, readiness, todayISO, settings, checkin } = data;

  // Start-view = "cats" (deze tab kent "home"/"free" niet; de reducer is een superset). goView zet de
  // view + dur-reset — cats → dur null.
  const [state, setState] = useState<PickerState>(() =>
    goView(initialPickerState(), "cats"),
  );
  const [checkinOpen, setCheckinOpen] = useState(false);
  // GAS trnPlanned: variantId → targetISO, bewust sessie-scoped (verdwijnt bij remount, net als in
  // GAS). Blijft staan over een onReload heen (deze component unmount niet bij een nonce-bump).
  const [planned, setPlanned] = useState<Record<string, string>>({});
  const [planning, setPlanning] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // Bibliotheek is puur in ftp+lthr (GAS getTrainingLibraryCached_-cache-key).
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust op ftp+lthr, niet het hele object.
  const cats = useMemo(
    () => trainingCategories(settings),
    [settings.ftp, settings.lthr],
  );
  const cat = state.catKey ? findCategory(cats, state.catKey) : null;
  const variant =
    cat && state.variantId ? findVariant(cat, state.variantId) : null;
  const eff = effectiveDur(state, cat);

  // GAS trnIsPlanned_: badge "In je blok" als het type deze week al gepland staat. GAS keek naar
  // v.type; elke variant erft cat.type → cat.type is equivalent (en wat de spec voorschrijft).
  const plannedTypes = useMemo(() => weekPlannedTypes(view.days), [view.days]);
  const planned_ = cat ? plannedTypes.has(cat.type) : false;

  // Preview-ctx: dagIdx = de dag waar Inplannen zou landen (nextPlannableDate → die dag in view.days),
  // geen match → 0. Zo is de preview WYSIWYG de workout die er ECHT komt te staan (zelfde
  // buildOverrideWorkout_-aanroep als de dagkaart).
  const previewTargetISO = nextPlannableDate(view.days, todayISO);
  const dagIdx = useMemo(
    () => view.days.find((d) => d.datum === previewTargetISO)?.dagIdx ?? 0,
    [view.days, previewTargetISO],
  );

  // Preview per view gememoiseerd (zoals WorkoutPickerSheet) zodat een slider-tik niet meer herrekent
  // dan nodig.
  const variantPreviews = useMemo(() => {
    if (!cat) return [];
    return cat.variants.map((v) => ({
      variant: v,
      session: previewOverrideSession(libraryOverride(cat, v, eff), {
        settings,
        mesoWeek: proposalWeek.mesoWeek,
        macroFase: proposalWeek.macroFase,
        dagIdx,
      }),
    }));
  }, [
    cat,
    eff,
    settings,
    proposalWeek.mesoWeek,
    proposalWeek.macroFase,
    dagIdx,
  ]);

  const workoutSession = useMemo(() => {
    if (!cat || !variant) return null;
    return previewOverrideSession(libraryOverride(cat, variant, eff), {
      settings,
      mesoWeek: proposalWeek.mesoWeek,
      macroFase: proposalWeek.macroFase,
      dagIdx,
    });
  }, [
    cat,
    variant,
    eff,
    settings,
    proposalWeek.mesoWeek,
    proposalWeek.macroFase,
    dagIdx,
  ]);

  // GAS trnDayKort_ bouwde weekdag.substring(0,2) + kort; hier uit dezelfde SchemaDay-velden als de
  // dag-detail-overline in SchemaView ({weekday} {dayNum}) zodat het label binnen Cadans consistent
  // is (bewuste afwijking van GAS' 2-teken-afkorting).
  function dayKort(dISO: string): string {
    const d = view.days.find((x) => x.datum === dISO);
    return d ? `${d.weekday} ${d.dayNum}` : "";
  }

  // GAS trnInplannen: schrijf de override op de eerstvolgende plannbare dag. De geporte
  // nextPlannableDate valt terug op todayISO (nooit null), dus guard op het bestaan van een écht
  // plannbare dag → anders zou de write op een niet-plannbare vandaag landen. Blijft op de tab.
  async function inplannen(v: LibraryVariant) {
    if (!cat || planning) return;
    const hasPlannable = view.days.some((d) => isDayPlannable(d, todayISO));
    const target = hasPlannable ? nextPlannableDate(view.days, todayISO) : null;
    if (!target) {
      setPlanError("Geen plan-dag beschikbaar.");
      return;
    }
    setPlanning(v.variantId);
    setPlanError(null);
    try {
      // DTO uitsluitend via libraryOverride (variantId altijd mee — zonder variantId vervangt
      // buildWorkout de keuze door de rotatie-variant en negeert recovery de duur).
      await putOverride(target, libraryOverride(cat, v, eff));
      bumpPlannerVersion();
      setPlanned((p) => ({ ...p, [v.variantId]: target }));
      onReload();
    } catch (e: unknown) {
      setPlanError(e instanceof Error ? e.message : "Inplannen mislukt");
    } finally {
      setPlanning(null);
    }
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
      <ReadinessCard
        readiness={readiness}
        onOpenCheckin={() => setCheckinOpen(true)}
      />

      {/* ── CATS ── */}
      {state.view === "cats" && (
        <div>
          <Overline style={{ marginBottom: "var(--s-3)" }}>
            Bibliotheek · per categorie
          </Overline>
          {cats.length > 0 ? (
            <CategoryList
              cats={cats}
              onOpen={(key) => setState((s) => openCat(s, key))}
            />
          ) : (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--text-muted)",
                padding: "var(--s-3) 0",
              }}
            >
              Bibliotheek nog niet geladen.
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORY ── */}
      {state.view === "category" && cat && (
        <div>
          <BackHeader
            title={cat.label}
            sub={cat.omschrijving}
            onBack={() => setState((s) => back(s))}
          />
          <DurationSlider
            value={eff}
            onChange={(v) => setState((s) => setDur(s, v))}
          />
          <Overline style={{ margin: "var(--s-4) 0 var(--s-2)" }}>
            Varianten
          </Overline>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
            }}
          >
            {variantPreviews.map(({ variant: v, session }) => (
              <VariantRow
                key={v.variantId}
                naam={v.naam}
                session={session}
                badge={planned_ ? "In je blok" : undefined}
                onOpen={() => setState((s) => openWorkout(s, v.variantId))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── WORKOUT ── */}
      {state.view === "workout" && cat && variant && (
        <div>
          <BackHeader
            title={variant.naam}
            sub={cat.label}
            onBack={() => setState((s) => back(s))}
          />
          <DurationSlider
            value={eff}
            onChange={(v) => setState((s) => setDur(s, v))}
          />
          {workoutSession && (
            <div style={{ marginTop: "var(--s-4)" }}>
              <WorkoutDetail
                session={workoutSession}
                overline={planned_ ? "In je blok" : undefined}
              />
            </div>
          )}
          {planError && (
            <div
              style={{
                marginTop: 14,
                background: "var(--danger-soft)",
                color: "var(--danger)",
                borderRadius: "var(--r-md)",
                padding: "var(--s-2) var(--s-3)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
              }}
            >
              {planError}
            </div>
          )}
          <InplanButton
            plannedISO={planned[variant.variantId]}
            busy={planning === variant.variantId}
            dayKort={dayKort}
            onPlan={() => inplannen(variant)}
          />
        </div>
      )}

      {/* TWEEDE CheckinSheet-call-site (naast Vorm) → versterkt de geparkeerde debt "check-in naar een
          gedeelde AppShell-laag". date = vandaag; onSaved → sheet dicht + herlaad (loadSchemaWeek
          herleest de check-in → nieuwe readiness). */}
      <CheckinSheet
        open={checkinOpen}
        date={todayISO}
        initial={checkin}
        onClose={() => setCheckinOpen(false)}
        onSaved={() => {
          setCheckinOpen(false);
          onReload();
        }}
      />
    </div>
  );
}

// GAS trnDetailHtml_-knop: normaal "Inplannen"; tijdens de write disabled + "Bezig…"; na succes
// disabled + "✓ Ingepland · <dagkort>".
function InplanButton({
  plannedISO,
  busy,
  dayKort,
  onPlan,
}: {
  plannedISO: string | undefined;
  busy: boolean;
  dayKort: (dISO: string) => string;
  onPlan: () => void;
}) {
  const done = typeof plannedISO === "string";
  const disabled = done || busy;
  const label = done
    ? `✓ Ingepland${dayKort(plannedISO) ? ` · ${dayKort(plannedISO)}` : ""}`
    : busy
      ? "Bezig…"
      : "Inplannen";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPlan}
      style={{
        marginTop: "var(--s-5)",
        width: "100%",
        height: 46,
        borderRadius: "var(--r-md)",
        border: "none",
        fontFamily: "var(--font-sans)",
        fontSize: 14.5,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "var(--bg-elevated)" : "var(--accent-grad)",
        color: disabled ? "var(--text-muted)" : "var(--text-on-accent)",
      }}
    >
      {label}
    </button>
  );
}
