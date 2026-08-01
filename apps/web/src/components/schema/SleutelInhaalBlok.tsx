import type { OpenSleutelDag } from "../../lib/sleutelinhaal";

// ROADMAP punt 5b — FEITENBLOK onder de dagkaart van een gemiste of te licht gereden
// sleutelsessie: waar de prikkel deze week nog staat. Caption-label plus een regel per dag, op de
// bestaande tokens. Geen Card-wrapper (dit zit ín de dag-detail-Card), geen knop, geen eigen
// kleuren.
//
// COPY-NORM: dit blok noemt wat er STAAT. Geen "ik heb verplaatst", geen "ik heb ingehaald" — de
// app verandert hier niets, hij vertelt het plan dat er al ligt (docs/INHAAL-5B-RECON.md §4).

// LEGE LIJST RENDERT NIETS — gewijzigd bij ROADMAP punt 10 fase B. Hier stond een tak met "Deze
// week staat er geen trainingsdag meer om 'm op te pakken." Die boodschap is verhuisd naar de
// WEEKSTEM (`WeekTekortBlok`), en daar staat hij mét de twee termen erbij. Zo blijft het bij één
// stem per onderwerp: dit dagblok zegt WAAR de prikkel nog staat, de weekstem zegt dat hij WEG is.

export function SleutelInhaalBlok({ dagen }: { dagen: OpenSleutelDag[] }) {
  if (dagen.length === 0) return null;
  return (
    <div
      style={{
        marginTop: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Waar de prikkel nu staat
      </div>
      {dagen.map((d) => (
        <div
          key={d.datum}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--s-2)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-label)",
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              minWidth: 44,
              color: "var(--text-primary)",
              fontWeight: 600,
            }}
          >
            {d.weekday} {d.dayNum}
          </span>
          <span>
            {d.naam} · {d.minuten} min
          </span>
        </div>
      ))}
    </div>
  );
}
