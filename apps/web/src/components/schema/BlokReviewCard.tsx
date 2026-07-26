import type { BlokReview, BlokWeek } from "../../lib/blok";
import { blokReviewNarrative } from "../../lib/coachNarrative";
import { parseLocalDate } from "../../lib/dates";
import { Card, Overline } from "../ui";
import { CoachCallout } from "./CoachCallout";

// 5a-ii — de BLOK-REVIEW. Terugblik op het meest recente blok waarvan de drie opbouwweken compleet
// zijn: per week geleverd tegenover gevraagd, plus de coachregel die zegt wat dat over het PLAN
// betekent. DOM component — geen state, geen knop, geen dismiss: de kaart is ZELFBEGRENZEND
// (blokReviewVenster geeft alleen in blokweek 4 en blokweek 1 een venster), precies zoals
// FaseOvergangCard. Het oordeel zit volledig in de pure laag (blok.ts); hier alleen opmaak.

const MAAND_KORT = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

/** "29 jun" — korte NL-datum uit een yyyy-MM-dd (lokaal, geen UTC-round-trip). */
function kort_(iso: string): string {
  const d = parseLocalDate(iso);
  return `${d.getDate()} ${MAAND_KORT[d.getMonth()]}`;
}

/** De zondag van de week die op `iso` begint. */
function zondag_(iso: string): string {
  const d = parseLocalDate(iso);
  const z = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6);
  const mm = String(z.getMonth() + 1).padStart(2, "0");
  const dd = String(z.getDate()).padStart(2, "0");
  return `${z.getFullYear()}-${mm}-${dd}`;
}

function Regel({ week }: { week: BlokWeek }) {
  const nietGereden = week.ritMinuten === 0;
  const opNorm = week.geleverd >= week.gevraagd;
  const gedempt = !week.telt;
  // Alleen bestaande tokens: op/boven norm --good, eronder --warn, deload/niet-beoordeeld gedempt.
  const kleur = gedempt
    ? "var(--text-muted)"
    : opNorm
      ? "var(--good)"
      : "var(--warn)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "var(--s-3)",
        padding: "var(--s-2) 0",
        borderTop:
          week.blokWeek === 1 ? "none" : "1px solid var(--border-subtle)",
        opacity: gedempt ? 0.6 : 1,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-label)",
          color: "var(--text-secondary)",
        }}
      >
        {kort_(week.weekMonday)}
        {gedempt && (
          <span
            style={{
              marginLeft: "var(--s-2)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-muted)",
            }}
          >
            deload · telt niet mee
          </span>
        )}
      </div>
      <div
        style={{
          flexShrink: 0,
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-label)",
          color: kleur,
          fontWeight: 600,
        }}
      >
        {nietGereden ? (
          <span style={{ fontFamily: "var(--font-sans)" }}>niet gereden</span>
        ) : (
          <>
            {Math.round(week.geleverd)}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              /{week.gevraagd}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function BlokReviewCard({
  review,
  coachNaam,
}: {
  review: BlokReview;
  coachNaam: string | null;
}) {
  const van = kort_(review.startMonday);
  const tot = kort_(zondag_(review.eindMonday));
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-2)",
        }}
      >
        <Overline>Blok · terugblik</Overline>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {van} — {tot}
        </span>
      </div>
      <div style={{ marginTop: "var(--s-3)" }}>
        {review.weeks.map((w) => (
          <Regel key={w.weekMonday} week={w} />
        ))}
      </div>
      {review.effect && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--s-3)",
            padding: "var(--s-2) 0",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-label)",
              color: "var(--text-secondary)",
            }}
          >
            rolling FTP
            {review.effect.gelegenheid.bron && (
              <span
                style={{
                  marginLeft: "var(--s-2)",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-muted)",
                }}
              >
                {review.effect.gelegenheid.bron === "test"
                  ? "test"
                  : "wedstrijd"}
                {review.effect.gelegenheid.datum
                  ? ` · ${kort_(review.effect.gelegenheid.datum)}`
                  : ""}
              </span>
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-label)",
              fontWeight: 600,
              color:
                review.effect.uitkomst === "gestegen"
                  ? "var(--good)"
                  : "var(--text-muted)",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              {review.effect.instap} →{" "}
            </span>
            {review.effect.maximum}
          </div>
        </div>
      )}
      <CoachCallout
        narrative={blokReviewNarrative(review)}
        coachNaam={coachNaam}
        style={{ marginTop: "var(--s-4)" }}
      />
    </Card>
  );
}
