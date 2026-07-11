import type { EventInput, EventItem } from "@cadans/shared";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, putEvents } from "../lib/api";
import { bumpPlannerVersion } from "../lib/plannerSignal";

// Events-editor: races & trips met profiel → PUT /api/events (FULL-REPLACE). Full-screen met
// eigen terug-knop naar /instellingen. Layout spiegelt de GAS-editor (Script.html
// eventsSectionHtml_): primaire rij (naam/✕ · prio-cycle-badge · datum) + inklapbare Details
// (Type · Klim-type · Afstand · Hoogtemeters · Notitie).

const KLIM_TYPES = ["lang", "kort", "gemengd", "vlak"];
const KLIM_LABELS: Record<string, string> = {
  lang: "Lang",
  kort: "Kort",
  gemengd: "Gemengd",
  vlak: "Vlak",
};
const PRIO_NEXT = { A: "B", B: "C", C: "A" } as const;
const PRIO_STYLE: Record<string, { bg: string; fg: string; bd: string }> = {
  A: { bg: "var(--accent-soft)", fg: "var(--accent)", bd: "var(--accent)" },
  B: {
    bg: "var(--bg-elevated)",
    fg: "var(--text-secondary)",
    bd: "var(--border-strong)",
  },
  C: {
    bg: "var(--bg-sunken)",
    fg: "var(--text-muted)",
    bd: "var(--border-subtle)",
  },
};

// Stabiele React-keys via een module-teller (NIET de secure-context-only Web-Crypto
// randomUUID-API, die op een insecure origin — de http-LAN-dev-server voor mobiele test —
// undefined is en de render deed crashen). Een teller werkt overal.
let _rowSeq = 0;
const nextRowKey = () => `ev-${++_rowSeq}`;

function todayIsoLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

interface EventRow {
  _key: string; // stabiele React-key (UI-only; niet in EventInput)
  detailsOpen: boolean;
  datum: string;
  naam: string;
  type: string;
  prioriteit: string;
  afstandKm: string;
  hoogtemeters: string;
  klimType: string;
  notitie: string;
}

type StringKey =
  | "datum"
  | "naam"
  | "type"
  | "prioriteit"
  | "afstandKm"
  | "hoogtemeters"
  | "klimType"
  | "notitie";

function rowFromItem(e: EventItem): EventRow {
  return {
    _key: nextRowKey(),
    detailsOpen: false,
    datum: e.datum,
    naam: e.naam ?? "",
    type: e.type === "trip" ? "trip" : "race",
    prioriteit:
      e.prioriteit === "A" || e.prioriteit === "B" || e.prioriteit === "C"
        ? e.prioriteit
        : "C",
    afstandKm: e.afstandKm == null ? "" : String(e.afstandKm),
    hoogtemeters: e.hoogtemeters == null ? "" : String(e.hoogtemeters),
    klimType:
      e.klimType != null && KLIM_TYPES.includes(e.klimType)
        ? e.klimType
        : "vlak",
    notitie: e.notitie ?? "",
  };
}

function blankRow(): EventRow {
  return {
    _key: nextRowKey(),
    detailsOpen: false,
    datum: todayIsoLocal(),
    naam: "",
    type: "race",
    prioriteit: "C",
    klimType: "vlak",
    afstandKm: "",
    hoogtemeters: "",
    notitie: "",
  };
}

// EventRow → EventInput met client-validatie (mirror de RUN 1 server-regels). Klim-type is
// altijd 1 van de 4 (de editor kent geen lege optie). Gooit een Error met event-index + veld.
function toInput(r: EventRow, i: number): EventInput {
  const n = i + 1;
  const datum = r.datum;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || Number.isNaN(Date.parse(datum))) {
    throw new Error(`Event ${n}: datum moet yyyy-MM-dd zijn`);
  }
  const naam = r.naam.trim();
  if (naam.length < 1 || naam.length > 60) {
    throw new Error(`Event ${n}: naam verplicht (1–60 tekens)`);
  }
  if (r.type !== "trip" && r.type !== "race") {
    throw new Error(`Event ${n}: type ongeldig`);
  }
  if (r.prioriteit !== "A" && r.prioriteit !== "B" && r.prioriteit !== "C") {
    throw new Error(`Event ${n}: prioriteit ongeldig`);
  }
  if (!KLIM_TYPES.includes(r.klimType)) {
    throw new Error(`Event ${n}: klim-type ongeldig`);
  }
  let afstandKm: number | null = null;
  if (r.afstandKm !== "") {
    const v = Number(r.afstandKm);
    if (!Number.isFinite(v) || v < 0) {
      throw new Error(`Event ${n}: afstand moet ≥ 0 zijn`);
    }
    afstandKm = v;
  }
  let hoogtemeters: number | null = null;
  if (r.hoogtemeters !== "") {
    const v = Number.parseInt(r.hoogtemeters, 10);
    if (!Number.isInteger(v) || v < 0) {
      throw new Error(
        `Event ${n}: hoogtemeters moet een geheel getal ≥ 0 zijn`,
      );
    }
    hoogtemeters = v;
  }
  const notitie = r.notitie.trim() === "" ? null : r.notitie.trim();
  if (notitie != null && notitie.length > 200) {
    throw new Error(`Event ${n}: notitie te lang (max 200)`);
  }
  return {
    datum,
    naam,
    type: r.type as "trip" | "race",
    prioriteit: r.prioriteit as "A" | "B" | "C",
    afstandKm,
    hoogtemeters,
    klimType: r.klimType as EventInput["klimType"],
    notitie,
  };
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--s-3)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function EventCard({
  row,
  onChange,
  onRemove,
}: {
  row: EventRow;
  onChange: (patch: Partial<EventRow>) => void;
  onRemove: () => void;
}) {
  const set = (k: StringKey) => (e: { target: { value: string } }) =>
    onChange({ [k]: e.target.value });
  const prio = PRIO_STYLE[row.prioriteit] ?? PRIO_STYLE.C;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3) var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      {/* primaire rij 1: naam + verwijder-✕ */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <input
          type="text"
          value={row.naam}
          maxLength={60}
          onChange={set("naam")}
          placeholder="Event-naam…"
          style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-sans)" }}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Verwijder event"
          style={{
            flexShrink: 0,
            width: 36,
            height: "var(--field-height)",
            borderRadius: "var(--r-pill)",
            cursor: "pointer",
            background: "var(--bg-sunken)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-muted)",
            fontSize: "var(--fs-label)",
          }}
        >
          ✕
        </button>
      </div>

      {/* primaire rij 2: prioriteit-cycle-badge + datum */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <button
          type="button"
          onClick={() =>
            onChange({
              prioriteit: PRIO_NEXT[row.prioriteit as "A" | "B" | "C"],
            })
          }
          aria-label={`Prioriteit ${row.prioriteit} — tik om te wisselen`}
          style={{
            flexShrink: 0,
            width: 40,
            height: "var(--field-height)",
            borderRadius: "var(--r-pill)",
            cursor: "pointer",
            background: prio.bg,
            color: prio.fg,
            border: `1px solid ${prio.bd}`,
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-label)",
            fontWeight: 700,
          }}
        >
          {row.prioriteit}
        </button>
        <input
          type="date"
          value={row.datum}
          onChange={set("datum")}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {/* primaire rij 3: Details-toggle */}
      <button
        type="button"
        onClick={() => onChange({ detailsOpen: !row.detailsOpen })}
        aria-expanded={row.detailsOpen}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
        }}
      >
        Details
        <span
          style={{
            display: "inline-block",
            transform: row.detailsOpen ? "rotate(180deg)" : "none",
            transition: "transform .2s",
          }}
        >
          ⌄
        </span>
      </button>

      {row.detailsOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-3)",
            paddingTop: "var(--s-1)",
          }}
        >
          <DetailRow label="Type">
            <div style={{ display: "flex", gap: 4 }}>
              {(["trip", "race"] as const).map((t) => {
                const on = row.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ type: t })}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "var(--r-pill)",
                      cursor: "pointer",
                      background: on
                        ? "var(--accent-soft)"
                        : "var(--bg-sunken)",
                      border: `1px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
                      color: on ? "var(--accent)" : "var(--text-secondary)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-label)",
                      fontWeight: 600,
                    }}
                  >
                    {t === "trip" ? "Trip" : "Race"}
                  </button>
                );
              })}
            </div>
          </DetailRow>
          <DetailRow label="Klim-type">
            <select
              value={row.klimType}
              onChange={set("klimType")}
              style={{ ...inputStyle, width: 132 }}
            >
              {KLIM_TYPES.map((k) => (
                <option key={k} value={k}>
                  {KLIM_LABELS[k]}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Afstand">
            <span style={ctlWithUnit}>
              <input
                type="number"
                inputMode="decimal"
                value={row.afstandKm}
                onChange={set("afstandKm")}
                style={{ ...inputStyle, width: 90, textAlign: "right" }}
              />
              <span style={unitStyle}>km</span>
            </span>
          </DetailRow>
          <DetailRow label="Hoogtemeters">
            <span style={ctlWithUnit}>
              <input
                type="number"
                inputMode="numeric"
                value={row.hoogtemeters}
                onChange={set("hoogtemeters")}
                style={{ ...inputStyle, width: 90, textAlign: "right" }}
              />
              <span style={unitStyle}>hm</span>
            </span>
          </DetailRow>
          <DetailRow label="Notitie">
            <input
              type="text"
              value={row.notitie}
              maxLength={200}
              onChange={set("notitie")}
              placeholder="Optioneel"
              style={{
                ...inputStyle,
                width: 180,
                fontFamily: "var(--font-sans)",
              }}
            />
          </DetailRow>
        </div>
      )}
    </div>
  );
}

export function Events() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    getEvents()
      .then((items) => {
        if (!alive) return;
        setRows(items.map(rowFromItem));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : "Laden mislukt");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const patchRow = (i: number) => (patch: Partial<EventRow>) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setNote(null);
  };
  const removeRow = (i: number) => {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
    setNote(null);
  };
  const addRow = () => {
    setRows((rs) => [...rs, blankRow()]);
    setNote(null);
  };

  async function save() {
    if (saving) return;
    let inputs: EventInput[];
    try {
      inputs = rows.map(toInput);
    } catch (e) {
      setNote({
        text: e instanceof Error ? e.message : "Ongeldige invoer",
        error: true,
      });
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      const fresh = await putEvents(inputs);
      bumpPlannerVersion();
      setRows(fresh.map(rowFromItem));
      setNote({ text: "Opgeslagen", error: false });
    } catch (e) {
      setNote({
        text: `Opslaan mislukt: ${e instanceof Error ? e.message : ""}`,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-app)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--bg-app)",
          borderBottom: "1px solid var(--border-subtle)",
          padding:
            "calc(env(safe-area-inset-top, 0px) + 14px) var(--s-3) var(--s-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-1)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/instellingen")}
          aria-label="Terug"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-pill)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
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
        <h1
          style={{
            margin: "0 0 0 var(--s-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-h1)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Events
        </h1>
      </div>

      <div style={{ padding: "var(--s-4) var(--s-4) 48px" }}>
        {loading ? (
          <div style={loadingStyle}>Laden…</div>
        ) : loadError ? (
          <div style={{ ...loadingStyle, color: "var(--danger)" }}>
            {loadError}
          </div>
        ) : (
          <>
            {rows.length === 0 && (
              <div style={{ ...loadingStyle, paddingBottom: "var(--s-3)" }}>
                Nog geen events
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-3)",
              }}
            >
              {rows.map((row, i) => (
                <EventCard
                  key={row._key}
                  row={row}
                  onChange={patchRow(i)}
                  onRemove={() => removeRow(i)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              style={{
                marginTop: "var(--s-3)",
                width: "100%",
                padding: "var(--s-3)",
                borderRadius: "var(--r-md)",
                cursor: "pointer",
                background: "var(--bg-elevated)",
                border: "1px dashed var(--border-strong)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                fontWeight: 600,
              }}
            >
              + Event toevoegen
            </button>

            {note && (
              <div
                style={{
                  marginTop: "var(--s-4)",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: note.error
                    ? "var(--danger-soft)"
                    : "var(--good-soft)",
                  border: `1px solid ${note.error ? "var(--danger)" : "var(--good)"}`,
                  color: note.error ? "var(--danger)" : "var(--good)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-label)",
                  fontWeight: 600,
                }}
              >
                {note.text}
              </div>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                marginTop: "var(--s-4)",
                width: "100%",
                height: "var(--btn-height)",
                borderRadius: "var(--btn-radius)",
                border: "none",
                cursor: saving ? "default" : "pointer",
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-h3)",
                fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Opslaan…" : "Events opslaan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  height: "var(--field-height)",
  width: "100%",
  background: "var(--field-bg)",
  border: "1px solid var(--field-border)",
  borderRadius: "var(--field-radius)",
  color: "var(--field-text)",
  padding: "0 var(--field-pad-x)",
  fontFamily: "var(--font-num)",
  fontSize: "var(--fs-body)",
  boxSizing: "border-box",
};

const ctlWithUnit: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--s-1)",
};

const unitStyle: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-caption)",
  color: "var(--text-muted)",
  width: 18,
};

const loadingStyle: CSSProperties = {
  padding: "40px 8px",
  textAlign: "center",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-label)",
  color: "var(--text-muted)",
};
