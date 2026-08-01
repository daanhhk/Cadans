import type { BlokReview, BlokWeek } from "../../lib/blok";
import { blokReviewNarrative } from "../../lib/coachNarrative";
import { parseLocalDate } from "../../lib/dates";
import type { Zone5Key } from "../../lib/zonemunt";
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

/** De UI-namen uit ZoneBars, op de zone-sleutels van de munt. */
const ZONE_NAAM: Record<string, string> = {
  tempo: "Tempo",
  drempel: "Drempel",
  anaeroob: "VO2max",
};

/** ROADMAP punt 14 fase 1c — de drie werkzones van één week, ONGEWIJZIGD overgenomen uit
 * `week.zoneRegels`. Deze functie leidt niets meer af: welke zone beoordeeld is staat in `norm`
 * (null = niet beoordeeld). Vóór 1c gaf hij alle drie de zones met een norm terug, waardoor een
 * niet-beoordeelde zone in waarschuwkleur naast een noemer stond die haar niet meetelde. */
function weekZones_(week: BlokWeek) {
  return week.zoneRegels.map((r) => ({
    naam: ZONE_NAAM[r.zone] ?? r.zone,
    geleverd: r.geleverd,
    norm: r.norm,
  }));
}

function Regel({ week }: { week: BlokWeek }) {
  const nietGereden = week.ritMinuten === 0;
  const gedempt = !week.telt;
  // ZONE-MUNT fase 1b — de rechterkolom toont waar het oordeel op valt: hoeveel werkzones hun
  // EIGEN norm halen. Alleen bestaande tokens: alle --good, eronder --warn, deload/niet-beoordeeld
  // gedempt.
  //
  // ROADMAP punt 14 fase 1 — DE NOEMER IS HET AANTAL VOORGESCHREVEN ZONES, niet vast 3. Het plan
  // programmeert nergens alle drie de werkzones (0 van de 35 gemeten cellen), dus "1/3" beloofde
  // een derde zone die die week nooit gevraagd is.
  const noemer = week.zonesVoorgeschreven.length;
  const opNorm = noemer > 0 && week.zonesOpNorm === noemer;
  const kleur = gedempt
    ? "var(--text-muted)"
    : opNorm
      ? "var(--good)"
      : "var(--warn)";
  return (
    <div
      style={{
        padding: "var(--s-2) 0",
        borderTop:
          week.blokWeek === 1 ? "none" : "1px solid var(--border-subtle)",
        opacity: gedempt ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--s-3)",
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
              {week.zonesOpNorm}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                /{noemer}
              </span>
            </>
          )}
        </div>
      </div>
      {!nietGereden && (
        <div
          style={{
            marginTop: "var(--s-1)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-muted)",
          }}
        >
          {weekZones_(week).map((z, i) => (
            <span key={z.naam}>
              {i > 0 && " · "}
              <span
                style={{
                  // Norm null = niet beoordeeld: streepje en NEUTRALE kleur. Exact de vorm die
                  // BlokTotaal hieronder al draagt — één regel, twee lezers.
                  color:
                    !gedempt && z.norm != null && z.geleverd < z.norm
                      ? "var(--warn)"
                      : undefined,
                }}
              >
                {z.naam} {Math.round(z.geleverd)}/
                {z.norm == null ? "—" : z.norm}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Blok-totaal over de MEEGETELDE weken: alle vijf zones, met een norm bij de drie werkzones.
 * Herstel en Duur dragen in dit doel geen norm — zij zijn vulling om de sleutelsessies heen
 * (DOELEN-SPEC §2A, residu) — en tonen daarom een streepje op de norm-plek. */
function BlokTotaal({ weeks }: { weeks: BlokWeek[] }) {
  const geteld = weeks.filter((w) => w.telt);
  if (geteld.length === 0) return null;
  const som = (f: (w: BlokWeek) => number) =>
    geteld.reduce((a, w) => a + f(w), 0);
  // ROADMAP punt 14 fase 1 — een zone die door GEEN enkele meegetelde week is voorgeschreven
  // krijgt norm null en toont dus een streepje, precies zoals Herstel en Duur dat al doen. Een
  // norm tonen waar het plan niets vroeg is een belofte die het plan niet doet.
  const voorgeschreven = (z: Zone5Key) =>
    geteld.some((w) => w.zonesVoorgeschreven.includes(z));
  const normVan = (z: Zone5Key, f: (w: BlokWeek) => number) =>
    voorgeschreven(z) ? som(f) : null;
  const rijen: { naam: string; geleverd: number; norm: number | null }[] = [
    { naam: "Herstel", geleverd: som((w) => w.geleverdRust), norm: null },
    { naam: "Duur", geleverd: som((w) => w.geleverdZ2), norm: null },
    {
      naam: "Tempo",
      geleverd: som((w) => w.geleverdTempo),
      norm: normVan("tempo", (w) => w.gevraagdTempo),
    },
    {
      naam: "Drempel",
      geleverd: som((w) => w.geleverdDrempel),
      norm: normVan("drempel", (w) => w.gevraagdDrempel),
    },
    {
      naam: "VO2max",
      geleverd: som((w) => w.geleverdAnaeroob),
      norm: normVan("anaeroob", (w) => w.gevraagdAnaeroob),
    },
  ];
  return (
    <div
      style={{
        marginTop: "var(--s-2)",
        paddingTop: "var(--s-2)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          marginBottom: "var(--s-1)",
        }}
      >
        blok totaal · {geteld.length} meegetelde weken
      </div>
      {rijen.map((rij) => (
        <div
          key={rij.naam}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--s-3)",
            padding: "1px 0",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-secondary)",
            }}
          >
            {rij.naam}
          </div>
          <div
            style={{
              flexShrink: 0,
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              color:
                rij.norm != null && rij.geleverd < rij.norm
                  ? "var(--warn)"
                  : "var(--text-secondary)",
            }}
          >
            {Math.round(rij.geleverd)}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              /{rij.norm == null ? "—" : rij.norm}
            </span>
          </div>
        </div>
      ))}
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
      <div
        style={{
          marginTop: "var(--s-3)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--s-3)",
        }}
      >
        <span>per week</span>
        <span>zones op norm</span>
      </div>
      <div>
        {review.weeks.map((w) => (
          <Regel key={w.weekMonday} week={w} />
        ))}
      </div>
      <BlokTotaal weeks={review.weeks} />
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
