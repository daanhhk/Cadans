import { useState } from "react";
import { putDoelPassend, putSettings } from "../../lib/api";
import {
  type DoelPassendVoorstel,
  doelPassendSettingsPatch,
} from "../../lib/doelpassend";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { CoachCallout } from "./CoachCallout";

// ROADMAP punt 12 — DOEL-PASSENDHEID als VOORSTEL. Spec: docs/PUNT12-BOUWDOC.md §4 en §5.
// Staat direct ONDER de event-overname-kaart: allebei voorstellen die een actie vragen, en die
// horen boven een terugblik.
//
// DE TWEE KNOPPEN SCHRIJVEN VERSCHILLEND, en dat is opzet.
//   "Wissel naar FTP" schrijft alleen de SETTINGS. Daarna draagt FTP geen vloer, dus de kaart kan
//   per constructie niet meer vuren en er valt niets te onthouden.
//   "Hou <doel>" schrijft alleen het ANTWOORD, voor dit blok en dit doel — zonder die schrijfactie
//   komt de vraag elke pageload terug.
//
// DE BODY VAN DE JA-TIK KOMT UIT `doelPassendSettingsPatch`, niet uit deze component: `PUT
// /api/settings` is FULL-REPLACE, en in de component is die body niet toetsbaar omdat `apps/web`
// geen render-testinfrastructuur heeft.
//
// Alle poorten (uren bekend, doel draagt een vloer, strikt eronder, blokweek 1, nog niet
// beantwoord) zitten in `doelPassendVoorstel` in lib/doelpassend.ts. Deze component rendert.

export function DoelPassendCard({
  voorstel,
  settings,
  coachNaam,
}: {
  voorstel: DoelPassendVoorstel;
  settings: Record<string, unknown> | null;
  coachNaam: string | null;
}) {
  const [saving, setSaving] = useState(false);

  async function wissel() {
    if (saving || !settings) return;
    setSaving(true);
    try {
      await putSettings(doelPassendSettingsPatch(settings, voorstel) as never);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  async function hou() {
    if (saving) return;
    setSaving(true);
    try {
      await putDoelPassend(voorstel.blokStart, voorstel.huidigDoel);
      bumpPlannerVersion();
    } catch {
      setSaving(false);
    }
  }

  const regel1 =
    `Je traint op ${voorstel.huidigDoel}. Dat doel vraagt minstens ${voorstel.vloerUren} uur ` +
    `per week, en je hebt ${voorstel.weekUren} uur opgegeven.`;
  const regel2 =
    "Bij weinig uren is FTP de eerlijkere keuze: daar is drempelwerk de ruggengraat in plaats " +
    "van de garnering.";

  const knop: React.CSSProperties = {
    flex: 1,
    height: "var(--btn-height)",
    padding: "0 14px",
    borderRadius: "var(--r-pill)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-label)",
    fontWeight: 600,
    cursor: saving ? "default" : "pointer",
  };

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-overline)",
          letterSpacing: "var(--ls-overline)",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "var(--s-2)",
        }}
      >
        Doel · past dit bij je uren?
      </div>
      <CoachCallout narrative={`${regel1} ${regel2}`} coachNaam={coachNaam} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--s-3)",
          marginTop: "var(--s-3)",
        }}
      >
        <button
          type="button"
          onClick={wissel}
          disabled={saving || !settings}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {`Wissel naar ${voorstel.voorstelDoel}`}
        </button>
        <button
          type="button"
          onClick={hou}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          {`Hou ${voorstel.huidigDoel}`}
        </button>
      </div>
      <div
        style={{
          marginTop: "var(--s-2)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
        }}
      >
        {`De blok-start schuift mee naar ${voorstel.blokStart}, zodat het nieuwe doel met een eigen blok begint.`}
      </div>
    </div>
  );
}
