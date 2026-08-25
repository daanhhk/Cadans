/**
 * ritpiek.ts — ROADMAP punt 69: vult `activities.piek_1200_w` voor ritten die er nog geen dragen.
 *
 * WAAROM DIT BESTAAT, en het is de reden dat het voorstel überhaupt kan werken. De kolom werd tot nu
 * toe UITSLUITEND gevuld door `tools/backfill/piek1200.mjs`, een met de hand te starten script dat
 * `--local` hardcodeert. Er was GEEN enkele runtime-schrijver. Zonder deze module zou een rit die na
 * de migratie binnenkomt de kolom leeg houden, zou poort (2) van het FTP-voorstel per constructie
 * nooit opengaan, en zou de functie permanent nul voorstellen doen — op remote zelfs vanaf dag één,
 * want daar heeft de backfill nooit gedraaid. Gevonden door de weerleggingspas.
 *
 * DE WAARDE WORDT AFGELEZEN OP HET EXACTE DUURPUNT `secs = 1200`. Nooit interpoleren en nooit een
 * naburig duurpunt lenen: een mean-max-kromme MAG plaatselijk stijgen — dat is een echte eigenschap
 * en geen fout — en het lopende maximum levert een getal op dat de renner niet gereden heeft
 * (ROADMAP punt 70).
 *
 * GEDOSEERD, en dat is hier geen franje. Elke rit kost één verzoek van ongeveer 5353 bytes. De sync
 * draait bij elke pageload van het schema-scherm, dus zonder bovengrens zou één trage dag een reeks
 * verzoeken opleveren. `MAX_PER_RONDE` begrenst dat; wat overblijft komt de volgende ronde. Dat is
 * veilig omdat `piek_gehaald_op` de voortgang draagt: opgehaald is opgehaald, ook als er geen
 * bruikbare waarde uit kwam.
 */
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { toD1Date } from "../db/dates";
import { activities } from "../db/schema";
import {
  type FetchImpl,
  type IntervalsEnv,
  intervalsBasicAuth,
} from "./intervals";

const BASE_URL = "https://intervals.icu/api/v1";

/** Hoeveel ritten er per sync-ronde worden opgehaald. Zie de docstring hierboven. */
export const MAX_PER_RONDE = 5;

/** Het duurpunt waarop M93 de waarde afleest. Twintig minuten, in seconden. */
export const DUURPUNT_SEC = 1200;

/**
 * Leest de twintigminutenwaarde uit een per-rit-power-curve.
 *
 * PUUR, en apart getest: dit is de enige plek waar `secs`/`values` van een per-rit-kromme gelezen
 * wordt. `indexOf` en niet "de eerste index vanaf" — ontbreekt het punt, dan is er geen waarde en
 * geen voorstel, en dat is de gewenste kant om op te falen.
 */
export function leesPiek1200(kromme: unknown): number | null {
  const c = kromme as { secs?: unknown; values?: unknown } | null;
  const secs = c?.secs;
  const values = c?.values;
  if (!Array.isArray(secs) || !Array.isArray(values)) return null;
  const i = secs.indexOf(DUURPUNT_SEC);
  if (i < 0) return null;
  const v = values[i];
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return Math.round(v);
}

/**
 * DRIE UITKOMSTEN, en het onderscheid tussen de laatste twee is dragend.
 *
 * `kromme`      — gelukt, met een body.
 * `definitief`  — de rit levert hier NOOIT iets op: 404 (op intervals verwijderd), 403, 410. Ook een
 *                 2xx met een onleesbare body valt hieronder: opnieuw vragen geeft hetzelfde.
 * `tijdelijk`   — 429, 5xx, netwerkfout. Later opnieuw proberen is zinvol.
 *
 * WAAROM DIT ONDERSCHEID BESTAAT — bevinding van de weerleggingspas, en zij hield stand op mijn
 * eigen nameting. De eerste versie kende alleen "gelukt" en "mislukt" en schreef bij mislukt NIETS,
 * zodat de rit de volgende ronde terugkwam. Dat is juist bij een 429, maar bij een rit die op
 * intervals is verwijderd is het een val: de wachtrij loopt op ritdatum AFLOPEND met een venster van
 * MAX_PER_RONDE, dus vijf zulke ritten aan de nieuwe kant zetten de vuller permanent vast en dan
 * wordt er nooit meer één piek gevuld. De functie doet dan niets meer, zonder één zichtbaar teken.
 */
type KrommeUitkomst =
  | { soort: "kromme"; body: unknown }
  | { soort: "definitief" }
  | { soort: "tijdelijk" };

const DEFINITIEF_WEG = new Set([403, 404, 410]);

async function haalRitKromme(opts: {
  apiKey: string;
  activityId: string;
  fetchImpl?: FetchImpl;
}): Promise<KrommeUitkomst> {
  const f = opts.fetchImpl ?? fetch;
  let resp: Response;
  try {
    resp = await f(
      `${BASE_URL}/activity/${encodeURIComponent(opts.activityId)}/power-curve`,
      {
        method: "GET",
        headers: {
          Authorization: intervalsBasicAuth(opts.apiKey),
          Accept: "application/json",
        },
      },
    );
  } catch {
    return { soort: "tijdelijk" }; // netwerk
  }
  if (!resp.ok) {
    return DEFINITIEF_WEG.has(resp.status)
      ? { soort: "definitief" }
      : { soort: "tijdelijk" };
  }
  // BEWAAKT, en dat was het niet: een 2xx met een lege of niet-JSON body liet `resp.json()`
  // verwerpen, en omdat er geen vangnet om de lus stond viel de HELE vulronde eruit — niet alleen
  // deze rit. Elke volgende ronde liep op dezelfde rit stuk.
  try {
    return { soort: "kromme", body: await resp.json() };
  } catch {
    return { soort: "definitief" };
  }
}

/**
 * Vult `piek_1200_w` voor maximaal `MAX_PER_RONDE` fiets-ritten die nog geen `piek_gehaald_op`
 * dragen, nieuwste eerst.
 *
 * NIEUWSTE EERST, en dat is opzet: het voorstel gaat over wat er NET gereden is. Blijft er een
 * achterstand liggen, dan is dat de oudste kant, en die levert toch geen voorstel meer omdat de
 * seed hem als beantwoord heeft gemarkeerd.
 *
 * SCHRIJFT `piek_gehaald_op` zodra er een DEFINITIEF antwoord is — ook als dat antwoord "hier komt
 * nooit een waarde uit" luidt. Anders probeert elke volgende ronde dezelfde kansloze rit opnieuw en
 * loopt het venster vol. Alleen bij een TIJDELIJKE storing (429, 5xx, netwerk) blijft de rij open en
 * komt de rit een volgende keer terug. Zie `haalRitKromme` voor waarom dat onderscheid er is.
 */
export async function vulRitPieken(
  db: Db,
  env: IntervalsEnv,
  userId: number,
  opts: { fetchImpl?: FetchImpl; now?: Date; max?: number } = {},
): Promise<{ opgehaald: number; gevuld: number }> {
  const apiKey = env.INTERVALS_API_KEY;
  if (!apiKey) return { opgehaald: 0, gevuld: 0 };

  const max = opts.max ?? MAX_PER_RONDE;
  const rijen = await db
    .select({ id: activities.activityIdExt })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        isNull(activities.piekGehaaldOp),
        inArray(activities.type, ["Ride", "VirtualRide"]),
        sql`${activities.activityIdExt} IS NOT NULL AND ${activities.activityIdExt} <> ''`,
      ),
    )
    .orderBy(sql`${activities.datum} DESC`)
    .limit(max);

  const vandaag = toD1Date(opts.now ?? new Date());
  let opgehaald = 0;
  let gevuld = 0;
  for (const r of rijen) {
    if (!r.id) continue;
    const uit = await haalRitKromme({
      apiKey,
      activityId: r.id,
      fetchImpl: opts.fetchImpl,
    });
    // TIJDELIJK → niets schrijven, de rij blijft open en de rit komt terug.
    if (uit.soort === "tijdelijk") continue;
    if (uit.soort === "kromme") opgehaald++;
    // DEFINITIEF → er komt hier nooit een waarde uit, dus `piek_1200_w` blijft leeg maar de datum
    // wordt wél gezet. Zo verdwijnt de rit uit de wachtrij in plaats van haar te blokkeren.
    const piek = uit.soort === "kromme" ? leesPiek1200(uit.body) : null;
    if (piek != null) gevuld++;
    await db
      .update(activities)
      .set({ piek1200W: piek, piekGehaaldOp: vandaag })
      .where(
        and(eq(activities.userId, userId), eq(activities.activityIdExt, r.id)),
      );
  }
  return { opgehaald, gevuld };
}
