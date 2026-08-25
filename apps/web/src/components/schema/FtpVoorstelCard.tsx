import { useState } from "react";
import { type FtpVoorstelDto, putFtpVoorstel } from "../../lib/api";
import {
  ftpVoorstelAfwijzenLabel,
  ftpVoorstelOvernemenLabel,
  ftpVoorstelRegel,
  ftpVoorstelUitleg,
  schrijfMisluktRegel,
} from "../../lib/coachNarrative";
import { bumpPlannerVersion } from "../../lib/plannerSignal";
import { CoachCallout } from "./CoachCallout";

// ROADMAP punt 69 — HET FTP-VOORSTEL NA EEN GEREDEN RIT.
//
// DE KAART TOONT DE HERKOMST, en dat is de kern van het ontwerp. Er is bewust GEEN
// plausibiliteitsgrens: die bleek niet te ijken zolang de reeks geen maximale inspanning bevat, en de
// grens uit intervals' eigen modellen liet op verse data een LEGE band over. Besluit van Daan: de
// renner is zelf de plausibiliteitstoets (M10 — de app stelt voor, hij bevestigt). Dat kan hij alleen
// als hij ziet waaruit de waarde volgt; vandaar dat rit, duur, vermogen en factor in de zin staan.
//
// DE WAARDE GAAT NIET MEE IN DE PUT. De worker leidt hem opnieuw af uit M93, zodat deze kaart geen
// willekeurige drempelwaarde kan wegschrijven en de regel op één plek staat.
export function FtpVoorstelCard({
  voorstel,
  coachNaam,
}: {
  voorstel: FtpVoorstelDto;
  coachNaam: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  // De mislukking is NIET stil (ROADMAP punt 75): tot punt 73 slikte elk `catch` in deze kaarten de
  // fout op, waarna het scherm identiek was aan vóór de tik.
  async function antwoord(a: "goedgekeurd" | "afgewezen") {
    if (saving) return;
    setSaving(true);
    setFout(null);
    try {
      await putFtpVoorstel(voorstel.activityIdExt, a);
      bumpPlannerVersion();
    } catch {
      setFout(
        schrijfMisluktRegel(
          a === "goedgekeurd"
            ? "je drempelwaarde is niet gewijzigd"
            : "je antwoord is niet bewaard",
        ),
      );
      setSaving(false);
    }
  }

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
        Drempelwaarde · een voorstel uit je rit
      </div>
      <CoachCallout
        narrative={ftpVoorstelRegel({
          naam: voorstel.naam,
          datum: voorstel.datum,
          duurMin: voorstel.duurMin,
          piek1200W: voorstel.piek1200W,
          voorstelFtp: voorstel.voorstelFtp,
          staandeFtp: voorstel.staandeFtp,
          factorPct: voorstel.factorPct,
        })}
        coachNaam={coachNaam}
      />
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
          onClick={() => antwoord("goedgekeurd")}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-primary-bg)",
            border: "1px solid transparent",
            color: "var(--btn-primary-text)",
          }}
        >
          {ftpVoorstelOvernemenLabel(voorstel.voorstelFtp)}
        </button>
        <button
          type="button"
          onClick={() => antwoord("afgewezen")}
          disabled={saving}
          style={{
            ...knop,
            background: "var(--btn-secondary-bg)",
            border: "1px solid var(--btn-secondary-border)",
            color: "var(--btn-secondary-text)",
          }}
        >
          {ftpVoorstelAfwijzenLabel()}
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
        {ftpVoorstelUitleg()}
      </div>
      {fout && (
        <div
          role="alert"
          style={{
            marginTop: "var(--s-3)",
            padding: "var(--s-3)",
            borderRadius: "var(--r-md)",
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
          }}
        >
          {fout}
        </div>
      )}
    </div>
  );
}
