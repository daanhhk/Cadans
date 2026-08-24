#!/usr/bin/env node
/**
 * piek1200.mjs — ROADMAP punt 69: haalt per rit het beste TWINTIGMINUTENVERMOGEN op en schrijft het
 * naar `activities.piek_1200_w`.
 *
 * WAAROM DIT BESTAAT. Twee redenen, en de tweede is de belangrijkste. (1) Compleet zijn is zelf een
 * waarde: dan hoeft niemand later na te denken over wat er wel en niet in het verleden zit.
 * (2) Het is de KALIBRATIESET — de plausibiliteitsgrens die M93 eist is een DREMPEL, en een drempel
 * wordt op de ECHTE reeks geijkt en nooit in een gesprek gekozen.
 *
 * DE WAARDE WORDT AFGELEZEN OP HET EXACTE DUURPUNT `secs = 1200`, nooit op een naburig punt en nooit
 * als lopend maximum. Een mean-max-kromme MAG stijgen met de duur; het lopende maximum levert een
 * getal op dat de renner niet gereden heeft. Zie ROADMAP punt 70.
 *
 * VIER RANDVOORWAARDEN, door Daan gesteld, en alle vier zitten hieronder:
 *   1. GEDOSEERD      — `PAUZE_MS` tussen twee verzoeken.
 *   2. TELLER + HARDE BOVENGRENS die GOOIT — `verzoeken` telt, `MAX_VERZOEKEN` gooit. Niet
 *      doorgaan-met-waarschuwing: GOOIEN. Aanleiding: een eerdere ronde stuurde door een
 *      harnas-fout ongeveer 1536 ongewilde verzoeken uit.
 *   3. HERSTARTBAAR   — de kandidatenquery is `WHERE piek_gehaald_op IS NULL`. Een afgebroken run
 *      hervat precies waar hij ophield en haalt niets twee keer op. Daarom bestaat die tweede kolom:
 *      zonder haar is "geen bruikbare waarde" niet te onderscheiden van "nog niet opgehaald", en
 *      probeert elke herstart de kansloze ritten opnieuw.
 *   4. ALLEEN LEZEN   — uitsluitend GET naar intervals.icu. Er is een vangnet op `globalThis.fetch`
 *      zodat een verzoek buiten `haal()` om stukloopt in plaats van stilletjes te vertrekken.
 *
 * GEBRUIK:
 *   node tools/backfill/piek1200.mjs --droog 5     # droge run: haalt op, schrijft NIETS weg
 *   node tools/backfill/piek1200.mjs --max 300     # de volle run (alleen ná akkoord van Daan)
 *
 * De sleutel heet INTERVALS_API_KEY en staat in workers/api/.dev.vars. Zijn waarde komt nergens in
 * de uitvoer, niet in een logregel en niet in een foutmelding.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "..", "..");
const API_DIR = resolve(REPO, "workers", "api");

const args = process.argv.slice(2);
const heeft = (v) => args.includes(v);
const waarde = (v, d) => {
  const i = args.indexOf(v);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d;
};
const DROOG = heeft("--droog");
const LIMIET = DROOG ? waarde("--droog", 5) : waarde("--max", 300);
const MAX_VERZOEKEN = LIMIET; // de bovengrens IS de limiet; hij gooit, hij waarschuwt niet
const PAUZE_MS = 250;

// ── sleutel ────────────────────────────────────────────────────────────────
const vars = {};
for (const r of readFileSync(resolve(API_DIR, ".dev.vars"), "utf8").split(
  /\r?\n/,
)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(r);
  if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (!vars.INTERVALS_API_KEY)
  throw new Error("INTERVALS_API_KEY ontbreekt in workers/api/.dev.vars");
const AUTH = `Basic ${Buffer.from(`API_KEY:${vars.INTERVALS_API_KEY}`).toString("base64")}`;

// ── vangnet: alles wat buiten haal() om naar buiten wil, loopt hier stuk ────
const echteFetch = globalThis.fetch;
globalThis.fetch = () => {
  throw new Error("ONGEAUTORISEERDE FETCH — alleen haal() mag naar buiten");
};

let verzoeken = 0;
async function haal(pad) {
  if (verzoeken >= MAX_VERZOEKEN) {
    throw new Error(
      `BOVENGRENS BEREIKT: ${MAX_VERZOEKEN} verzoeken. Gestopt, niets meer opgehaald.`,
    );
  }
  verzoeken++;
  const r = await echteFetch(`https://intervals.icu/api/v1${pad}`, {
    method: "GET",
    headers: { Authorization: AUTH, Accept: "application/json" },
  });
  if (!r.ok) return { fout: r.status };
  return { body: JSON.parse(await r.text()) };
}

// ── lokale D1 ──────────────────────────────────────────────────────────────
// VIA EEN BESTAND EN NIET VIA --command: op Windows sneuvelt een SQL-string met spaties in de
// shell-quoting, en een bestand kent bovendien geen lengtelimiet — dat scheelt ook het opknippen
// van de UPDATE-blokken.
function d1(sql) {
  const tmp = resolve(tmpdir(), `p69-${process.pid}-${d1.n++}.sql`);
  writeFileSync(tmp, sql, "utf8");
  try {
    // `shell: true` kan hier veilig, juist OMDAT de SQL nu in een bestand staat: de argumenten
    // zijn daarmee spatie-vrij en er valt niets meer te mangelen.
    const uit = execFileSync(
      "npx",
      [
        "wrangler",
        "d1",
        "execute",
        "cadans",
        "--local",
        "--json",
        "--file",
        tmp,
      ],
      {
        cwd: API_DIR,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        shell: true,
      },
    );
    const i = uit.indexOf("[");
    return i < 0 ? [] : JSON.parse(uit.slice(i))[0].results;
  } finally {
    rmSync(tmp, { force: true });
  }
}
d1.n = 0;

// ── de kandidaten: HERSTARTBAAR ────────────────────────────────────────────
// FIETSEN IS `Ride` PLUS `VirtualRide`, en dat is geen finesse: een eerdere versie van dit script
// filterde op `type='Ride'` en liet daarmee 14 rijen vallen. Eén ervan is de meest test-achtige rit
// van de hele reeks — 2026-01-13, 20 minuten binnen op IF 100,77, de enige rit met IF >= 100 van de
// 222. Wie op `Ride` filtert, meet de reeks zonder haar scherpste inspanning.
const kandidaten = d1(
  `SELECT activity_id_ext AS id, datum FROM activities
   WHERE type IN ('Ride','VirtualRide') AND activity_id_ext IS NOT NULL AND activity_id_ext <> ''
     AND piek_gehaald_op IS NULL
   ORDER BY datum`,
);
const totaalOpen = kandidaten.length;
const teDoen = kandidaten.slice(0, LIMIET);

console.log(
  `${DROOG ? "DROGE RUN" : "VOLLE RUN"} — piek op secs = 1200 per rit`,
);
console.log(`  nog op te halen : ${totaalOpen} ritten`);
console.log(
  `  deze run        : ${teDoen.length} (bovengrens ${MAX_VERZOEKEN}, GOOIT bij overschrijding)`,
);
console.log(
  `  wegschrijven    : ${DROOG ? "NEE (droge run)" : "JA naar activities.piek_1200_w"}`,
);
console.log("");

const vandaag = new Date().toISOString().slice(0, 10);
const updates = [];
let gevonden = 0;
let leeg = 0;
let mislukt = 0;

for (const [i, k] of teDoen.entries()) {
  const r = await haal(`/activity/${k.id}/power-curve`);
  if (r.fout) {
    mislukt++;
    console.log(
      `  ${String(i + 1).padStart(3)}. ${k.datum.slice(0, 10)} ${k.id}  HTTP ${r.fout}`,
    );
  } else {
    const c = r.body;
    const secs = Array.isArray(c?.secs) ? c.secs : null;
    const idx = secs ? secs.indexOf(1200) : -1;
    const v = idx >= 0 && Array.isArray(c.values) ? c.values[idx] : null;
    const geldig =
      typeof v === "number" && Number.isFinite(v) && v > 0
        ? Math.round(v)
        : null;
    if (geldig != null) gevonden++;
    else leeg++;
    console.log(
      `  ${String(i + 1).padStart(3)}. ${k.datum.slice(0, 10)} ${k.id}  ${
        geldig != null ? `${geldig} W` : "geen 1200-punt"
      }`,
    );
    updates.push(
      `UPDATE activities SET piek_1200_w=${geldig == null ? "NULL" : geldig}, piek_gehaald_op='${vandaag}' WHERE activity_id_ext='${k.id}'`,
    );
  }
  if (i < teDoen.length - 1) await new Promise((s) => setTimeout(s, PAUZE_MS));
}

console.log("");
if (DROOG) {
  console.log(
    "DROGE RUN — er is NIETS weggeschreven. De SQL die de volle run zou draaien:",
  );
  console.log(`  ${updates.length} UPDATE-statements, voorbeeld:`);
  if (updates[0]) console.log(`  ${updates[0]}`);
} else if (updates.length) {
  d1(`${updates.join(";\n")};`);
  console.log(`weggeschreven: ${updates.length} rijen`);
}

console.log("");
console.log(
  `gevonden ${gevonden} · geen 1200-punt ${leeg} · mislukt ${mislukt}`,
);
console.log(
  `verzoeken aan intervals.icu: ${verzoeken} (bovengrens ${MAX_VERZOEKEN})`,
);
console.log(
  `nog open na deze run: ${totaalOpen - (DROOG ? 0 : updates.length)}`,
);
