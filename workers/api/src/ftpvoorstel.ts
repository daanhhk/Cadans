/**
 * ftpvoorstel.ts — ROADMAP punt 69: bouwt het FTP-VOORSTEL uit een gereden rit.
 *
 * DE NORM. M93 draagt de omrekening: de nieuwe drempelwaarde is 95 procent van het beste
 * twintigminutenvermogen uit de rit, afgelezen op het duurpunt `secs = 1200`. M94 draagt de richting:
 * een ONGEPLANDE inspanning stelt alleen OMHOOG bij. M10 draagt de rest: de app STELT VOOR en de
 * renner BEVESTIGT.
 *
 * ER IS BEWUST GEEN PLAUSIBILITEITSGRENS. M93 randvoorwaarde (2) vraagt er een, en die is in de ronde
 * van 25-08-2026 gemeten NIET TE LEGGEN: de reeks draagt maar één klasse (er staat geen enkele
 * maximale inspanning in — 0 van 73 ritten op IF >= 90 in twee kwartalen), en de grens uit intervals'
 * eigen modellen heeft geen eigen werkgebied én laat op verse data een LEGE band over. Besluit van de
 * eigenaar: bouw zonder grens, want de renner is zelf de plausibiliteitstoets. Daarom draagt het
 * voorstel zijn HERKOMST mee — rit, duur, vermogen en factor — zodat hij in één blik kan zien of het
 * ergens op slaat. Die herkomst is hier geen sier maar de vervanging van de rem.
 *
 * PUUR: geen klok, geen I/O, geen database. Alles komt binnen als argument, zodat de regressietoets
 * over de echte reeks DEZE functie kan draaien en geen nagebouwde variant.
 */

/**
 * De omrekenfactor van M93, als percentage.
 *
 * HERKOMST-ETIKET: **NORM** — `docs/TRAININGSMODEL.md` M93, Daan-besluit van 24-08-2026. Geen geijkte
 * drempel maar een vastgelegde regel; wie hem wil wijzigen, wijzigt M93.
 */
export const M93_FACTOR_PCT = 95;

/** Het duurpunt waarop M93 leest. Twintig minuten in seconden. */
export const M93_DUURPUNT_SEC = 1200;

export type VoorstelKandidaat = {
  activityIdExt: string;
  /** yyyy-MM-dd of een volledige tijdstempel; alleen de ordening gebruikt hem. */
  datum: string;
  naam: string | null;
  duurMin: number | null;
  piek1200W: number | null;
};

export type FtpVoorstel = {
  activityIdExt: string;
  datum: string;
  naam: string | null;
  duurMin: number | null;
  /** Het afgelezen twintigminutenvermogen in watt. */
  piek1200W: number;
  /** De voorgestelde nieuwe drempelwaarde in watt: M93 toegepast op de piek. */
  voorstelFtp: number;
  /** De waarde die er nu staat, waar het voorstel naast komt. */
  staandeFtp: number;
  /** De toegepaste factor, zodat de kaart hem kan noemen zonder hem zelf te kennen. */
  factorPct: number;
};

/** M93 op één piek. Afgerond op hele watt, want een drempelwaarde in decimalen bestaat niet. */
export function m93Drempel(piek1200W: number): number {
  return Math.round((piek1200W * M93_FACTOR_PCT) / 100);
}

/**
 * Kiest het voorstel uit de kandidaten, of geeft null.
 *
 * DE POORTEN, in deze volgorde:
 *   (1) HET DOEL IS FTP. Onder de andere doelen biedt de app een ander testprotocol aan en levert dat
 *       geen drempelwaarde; een FTP-voorstel hoort daar niet te verschijnen.
 *   (2) ER IS EEN STAANDE WAARDE OM MEE TE VERGELIJKEN. `settings.ftp` is nullable — gemeten: het is
 *       de enige kolom naast `user_id` zónder NOT NULL, en hij raakt leeg zodra de gebruiker het veld
 *       op Instellingen leegmaakt en opslaat. ZONDER staande waarde is er GEEN voorstel. Dit staat
 *       hier expliciet omdat de vergelijking anders stil de verkeerde kant op faalt: in JavaScript is
 *       `190 > null` WAAR (null wordt 0) en `190 > undefined` ONWAAR. Dezelfde afwezigheid, de
 *       omgekeerde poort. Die val is gemeten en wordt hier dichtgezet.
 *   (3) DE RIT DRAAGT EEN WAARDE OP HET DUURPUNT. Ontbreekt hij, dan geen voorstel — niet
 *       interpoleren en geen naburig punt lenen (ROADMAP punt 70).
 *   (4) M94: het voorstel ligt BOVEN de staande waarde. Gelijk is geen voorstel.
 *
 * DE KEUZE BIJ MEER DAN ÉÉN KANDIDAAT: de HOOGSTE piek wint, en bij gelijke piek de NIEUWSTE rit.
 * Dat is geen detail. Op 44 dagen in de reeks dragen twee fietsritten allebei een waarde, met een
 * mediaan verschil van 43 watt en een uitschieter van 156. Het huisidioom `mergeDone` kiest daar de
 * LANGSTE rit, en dat is gemeten stelselmatig de rit met de LAGERE piek — op de enige dag die in de
 * hele reeks een voorstel oplevert zou dat 154 watt zijn in plaats van 310. De langste rit is de
 * woon-werkrit; de hoogste piek is de inspanning.
 *
 * Het filteren op "nog niet beantwoord" gebeurt in de query, niet hier: deze functie krijgt alleen
 * kandidaten die nog openstaan.
 */
export function kiesFtpVoorstel(input: {
  doel: string | null;
  staandeFtp: number | null;
  kandidaten: VoorstelKandidaat[];
}): FtpVoorstel | null {
  if (input.doel !== "FTP") return null; // poort (1)

  const staand = input.staandeFtp;
  if (typeof staand !== "number" || !Number.isFinite(staand) || staand <= 0) {
    return null; // poort (2)
  }

  let beste: FtpVoorstel | null = null;
  for (const k of input.kandidaten) {
    const piek = k.piek1200W;
    if (typeof piek !== "number" || !Number.isFinite(piek) || piek <= 0) {
      continue; // poort (3)
    }
    const voorstel = m93Drempel(piek);
    if (voorstel <= staand) continue; // poort (4)

    if (
      beste == null ||
      piek > beste.piek1200W ||
      (piek === beste.piek1200W && k.datum > beste.datum)
    ) {
      beste = {
        activityIdExt: k.activityIdExt,
        datum: k.datum,
        naam: k.naam,
        duurMin: k.duurMin,
        piek1200W: piek,
        voorstelFtp: voorstel,
        staandeFtp: staand,
        factorPct: M93_FACTOR_PCT,
      };
    }
  }
  return beste;
}
