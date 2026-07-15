import type {
  DayOverride,
  OverrideIntensiteit,
  OverrideRitType,
  SettingsInput,
} from "@cadans/shared";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { putOverride } from "../../lib/api";
import {
  DUR_MAX,
  DUR_MIN,
  DUR_STEP,
  findCategory,
  findVariant,
  freeOverride,
  libraryOverride,
  previewOverrideSession,
  trainingCategories,
} from "../../lib/library";
import {
  back,
  effectiveDur,
  goView,
  initialPickerState,
  openCat,
  openWorkout,
  type PickerState,
  setDur,
  setFree,
} from "../../lib/pickerState";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { durLabel } from "../../lib/schema";
import { WorkoutDetail } from "./WorkoutDetail";
import { ZoneBar } from "./ZoneBar";

// Bottom-sheet workout-picker (GAS pkHtml_, Script.html:2065-2160). Gemodelleerd op CheckinSheet
// (fixed inset-0, scrim-button, panel, handle, safe-area, foutregel). Afwijkend: het paneel scrollt
// (GAS overlay = max-height 90vh + overflow auto, Drawer.html). Preview = ENGINE (previewOverrideSession,
// WYSIWYG met de dagkaart), GEEN trnScale_-port. DTO's uit libraryOverride/freeOverride → variantId altijd.

function DurSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
          }}
        >
          Duur · structuur schaalt mee
        </span>
        <span
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-label)",
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          {durLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={DUR_MIN}
        max={DUR_MAX}
        step={DUR_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Duur van de training"
        style={{
          width: "100%",
          marginTop: "var(--s-2)",
          accentColor: "var(--slider-fill)",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
        }}
      >
        <span>{durLabel(DUR_MIN)}</span>
        <span>{durLabel(DUR_MAX)}</span>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginTop: "var(--s-3)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "var(--s-2)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--s-1)",
          background: "var(--segment-track-bg)",
          borderRadius: "var(--r-pill)",
          padding: 3,
        }}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              style={{
                flex: 1,
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--r-pill)",
                padding: "7px 0",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                background: on ? "var(--segment-active-bg)" : "transparent",
                color: on
                  ? "var(--segment-active-text)"
                  : "var(--segment-text)",
                boxShadow: on ? "var(--segment-active-shadow)" : "none",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const HOME_TILE: CSSProperties = {
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  background: "var(--bg-sunken)",
  border: "1px solid var(--border-strong)",
  borderRadius: "var(--r-md)",
  padding: "14px 16px",
};
const PRIMARY_BTN: CSSProperties = {
  marginTop: "var(--s-5)",
  width: "100%",
  height: 46,
  borderRadius: "var(--r-md)",
  border: "none",
  fontFamily: "var(--font-sans)",
  fontSize: 14.5,
  fontWeight: 600,
};

export function WorkoutPickerSheet({
  open,
  date,
  dagIdx,
  settings,
  mesoWeek,
  macroFase,
  onClose,
}: {
  open: boolean;
  date: string;
  dagIdx: number;
  settings: SettingsInput;
  mesoWeek: number;
  macroFase: string;
  onClose: () => void;
}) {
  const [state, setState] = useState<PickerState>(initialPickerState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GAS openPicker reset ALTIJD (geen prefill vanuit een bestaande override) → reset bij elke open.
  useEffect(() => {
    if (open) {
      setState(initialPickerState());
      setSaving(false);
      setError(null);
    }
  }, [open]);

  // De bibliotheek is puur in ftp+lthr (GAS getTrainingLibraryCached_-cache-key).
  // biome-ignore lint/correctness/useExhaustiveDependencies: bewust op ftp+lthr, niet het hele settings-object.
  const cats = useMemo(
    () => trainingCategories(settings),
    [settings.ftp, settings.lthr],
  );
  const cat = state.catKey ? findCategory(cats, state.catKey) : null;
  const variant =
    cat && state.variantId ? findVariant(cat, state.variantId) : null;
  const eff = effectiveDur(state, cat);

  // Preview per view gememoiseerd zodat een slider-tik niet meer herrekent dan nodig.
  const variantPreviews = useMemo(() => {
    if (!cat) return [];
    return cat.variants.map((v) => ({
      variant: v,
      session: previewOverrideSession(libraryOverride(cat, v, eff), {
        settings,
        mesoWeek,
        macroFase,
        dagIdx,
      }),
    }));
  }, [cat, eff, settings, mesoWeek, macroFase, dagIdx]);

  const workoutSession = useMemo(() => {
    if (!cat || !variant) return null;
    return previewOverrideSession(libraryOverride(cat, variant, eff), {
      settings,
      mesoWeek,
      macroFase,
      dagIdx,
    });
  }, [cat, variant, eff, settings, mesoWeek, macroFase, dagIdx]);

  if (!open) return null;

  async function save(ov: DayOverride) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await putOverride(date, ov);
      bumpPlannerVersion();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
      setSaving(false);
    }
  }

  const title =
    state.view === "home"
      ? "Andere training kiezen"
      : state.view === "cats"
        ? "Kies een categorie"
        : state.view === "category"
          ? (cat?.label ?? "Categorie")
          : state.view === "workout"
            ? (variant?.naam ?? "Workout")
            : "Vrije / groepsrit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--sheet-bg)",
          borderTopLeftRadius: "var(--sheet-radius)",
          borderTopRightRadius: "var(--sheet-radius)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "var(--sheet-shadow)",
          padding: "10px 18px calc(env(safe-area-inset-bottom, 0px) + 26px)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: "var(--r-pill)",
            background: "var(--sheet-handle)",
            margin: "0 auto 16px",
          }}
        />

        {/* kop + back (elke view behalve home) */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}
        >
          {state.view !== "home" && (
            <button
              type="button"
              aria-label="Terug"
              onClick={() => setState((s) => back(s))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                flexShrink: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 13 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 2L4 7l5 5"
                  stroke="var(--text-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
        </div>

        {/* ── HOME ── */}
        {state.view === "home" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-3)",
              marginTop: 18,
            }}
          >
            <button
              type="button"
              style={HOME_TILE}
              onClick={() => setState((s) => goView(s, "cats"))}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-h3)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Uit bibliotheek
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Categorie + variant
              </div>
            </button>
            <button
              type="button"
              style={HOME_TILE}
              onClick={() => setState((s) => goView(s, "free"))}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-h3)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Vrije / groepsrit
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Duur + intensiteit op gevoel
              </div>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "var(--s-2)",
                width: "100%",
                height: 38,
                borderRadius: "var(--r-md)",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              Annuleren
            </button>
          </div>
        )}

        {/* ── CATS ── */}
        {state.view === "cats" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
              marginTop: 18,
            }}
          >
            {cats.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => setState((s) => openCat(s, c.key))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-3)",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 14px",
                }}
              >
                <span
                  style={{
                    width: 4,
                    alignSelf: "stretch",
                    borderRadius: "var(--r-pill)",
                    background: `var(${c.zoneVar})`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-label)",
                      fontWeight: 600,
                      color: `var(${c.zoneVar})`,
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-caption)",
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    {c.omschrijving} · {c.variants.length}{" "}
                    {c.variants.length === 1 ? "variant" : "varianten"}
                  </span>
                </span>
                <svg
                  width="10"
                  height="14"
                  viewBox="0 0 8 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1l5 6-5 6"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* ── CATEGORY ── */}
        {state.view === "category" && cat && (
          <>
            <DurSlider
              value={eff}
              onChange={(v) => setState((s) => setDur(s, v))}
            />
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                margin: "var(--s-4) 0 var(--s-2)",
              }}
            >
              Varianten
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-2)",
              }}
            >
              {variantPreviews.map(({ variant: v, session }) => (
                <button
                  type="button"
                  key={v.variantId}
                  onClick={() => setState((s) => openWorkout(s, v.variantId))}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    background: "var(--bg-sunken)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "var(--s-2)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-label)",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {v.naam}
                    </span>
                    {session && (
                      <span
                        style={{
                          fontFamily: "var(--font-num)",
                          fontSize: "var(--fs-caption)",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.totaalMin} min · TSS {session.tss}
                      </span>
                    )}
                  </div>
                  {session && (
                    <div style={{ marginTop: "var(--s-2)" }}>
                      <ZoneBar blokken={session.blokken} height={40} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── WORKOUT ── */}
        {state.view === "workout" && cat && variant && (
          <>
            <DurSlider
              value={eff}
              onChange={(v) => setState((s) => setDur(s, v))}
            />
            {workoutSession && (
              <div style={{ marginTop: "var(--s-4)" }}>
                <WorkoutDetail session={workoutSession} />
              </div>
            )}
            {error && <ErrorLine text={error} />}
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (cat && variant) save(libraryOverride(cat, variant, eff));
              }}
              style={{
                ...PRIMARY_BTN,
                cursor: saving ? "default" : "pointer",
                background: saving
                  ? "var(--bg-elevated)"
                  : "var(--accent-grad)",
                color: saving ? "var(--text-muted)" : "var(--text-on-accent)",
              }}
            >
              {saving ? "Bezig…" : "Kies deze workout"}
            </button>
          </>
        )}

        {/* ── FREE ── (geen preview-kaart: de free-TSS is een intensiteit-aanname, GAS toont 'm niet) */}
        {state.view === "free" && (
          <>
            <Segmented<OverrideRitType>
              label="Type"
              value={state.free.ritType}
              options={[
                { value: "vrij", label: "Vrije rit" },
                { value: "groep", label: "Groepsrit" },
              ]}
              onChange={(v) => setState((s) => setFree(s, { ritType: v }))}
            />
            <Segmented<OverrideIntensiteit>
              label="Intensiteit"
              value={state.free.intensiteit}
              options={[
                { value: "rustig", label: "Rustig" },
                { value: "tempo", label: "Tempo" },
                { value: "stevig", label: "Stevig" },
              ]}
              onChange={(v) => setState((s) => setFree(s, { intensiteit: v }))}
            />
            <DurSlider
              value={eff}
              onChange={(v) => setState((s) => setDur(s, v))}
            />
            {error && <ErrorLine text={error} />}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                save(
                  freeOverride(state.free.ritType, state.free.intensiteit, eff),
                )
              }
              style={{
                ...PRIMARY_BTN,
                cursor: saving ? "default" : "pointer",
                background: saving
                  ? "var(--bg-elevated)"
                  : "var(--accent-grad)",
                color: saving ? "var(--text-muted)" : "var(--text-on-accent)",
              }}
            >
              {saving ? "Bezig…" : "Kies deze rit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  );
}
