import { useState } from "react";
import { pushWorkouts } from "../../lib/api";
import { collectPushDays, pushGuard, type SchemaDay } from "../../lib/schema";

// FASE-C C3 — tab-niveau "Push naar Garmin" (GAS Index.html:37: één keer onderaan de Schema-tab,
// NIET per dag). Verzamelt de VOORUIT geplande, niet-gedane sessies (collectPushDays) en POST ze
// naar /api/push (C2 → intervals.icu → Garmin via de bestaande koppeling). FTP-guard dekt de
// stille-0-watt-hoek: zonder FTP geen push. Idempotentie is server-side (external_id).

type Tone = "success" | "error" | "info";

export function GarminPushButton({
  days,
  todayISO,
  ftp,
}: {
  days: SchemaDay[];
  todayISO: string;
  ftp: number | null;
}) {
  const [pushing, setPushing] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  async function onPush() {
    if (pushing) return;
    const pushDays = collectPushDays(days, todayISO);
    const guard = pushGuard(ftp, pushDays.length);
    if (!guard.ok) {
      // no-ftp: de app produceert zonder FTP stille "0-0W"-watts → niet pushen.
      setMsg(
        guard.reason === "no-ftp"
          ? {
              tone: "error",
              text: "Stel eerst je FTP in bij Instellingen voordat je workouts pusht.",
            }
          : { tone: "info", text: "Geen komende workouts om te pushen." },
      );
      return;
    }

    setPushing(true);
    setMsg(null);
    try {
      const r = await pushWorkouts(pushDays);
      if (r.errors.length > 0) {
        setMsg({ tone: "error", text: r.errors.join(" · ") });
      } else {
        const skip =
          r.skipped.length > 0
            ? " Overgeslagen: " +
              r.skipped.map((s) => `${s.dateISO} (${s.message})`).join("; ") +
              "."
            : "";
        setMsg({
          tone: "success",
          text: `${r.pushedCount} workout(s) naar intervals.icu gestuurd. Synct binnen 1-2 minuten naar je Garmin.${skip} Opnieuw drukken werkt de bestaande workouts bij.`,
        });
      }
    } catch (e) {
      setMsg({
        tone: "error",
        text: e instanceof Error ? e.message : "Push mislukt.",
      });
    } finally {
      setPushing(false);
    }
  }

  const toneColor: Record<Tone, string> = {
    success: "var(--good)",
    error: "var(--bad)",
    info: "var(--text-secondary)",
  };

  return (
    <div>
      <button
        type="button"
        onClick={onPush}
        disabled={pushing}
        style={{
          width: "100%",
          height: "var(--btn-height)",
          borderRadius: "var(--btn-radius)",
          border: "1px solid var(--btn-secondary-border)",
          background: "var(--btn-secondary-bg)",
          color: "var(--btn-secondary-text)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          cursor: pushing ? "default" : "pointer",
        }}
      >
        {pushing ? "Pushen…" : "Push naar Garmin"}
      </button>
      {msg && (
        <div
          style={{
            marginTop: "var(--s-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: toneColor[msg.tone],
            lineHeight: "var(--lh-body)",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
