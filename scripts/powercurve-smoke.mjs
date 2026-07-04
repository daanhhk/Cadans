/**
 * powercurve-smoke.mjs — LOKAAL-ONLY smoke (NIET in de gate/CI), analoog aan
 * wellness-smoke.mjs. Doet ÉÉN echte power-curves-call en print de RAW-curve-
 * lengte + de pcNormalize_-output (engine, puur) erover, ter visuele check
 * tegen intervals.icu.
 *
 * Draaien:
 *   1) pnpm --filter @cadans/engine build
 *   2) node scripts/powercurve-smoke.mjs [window]   window = 90d | 1y (default 1y)
 * Vereist workers/api/.dev.vars met INTERVALS_API_KEY + INTERVALS_ATHLETE_ID.
 * (De fetch/normalisatie spiegelt src/integrations/powercurve.ts — die is de
 * canonieke, geteste versie; pcNormalize_ komt uit de engine-dist.)
 */
import { readFileSync } from "node:fs";
import { pcNormalize_ } from "../packages/engine/dist/index.js";

function readDevVars() {
  const path = new URL("../workers/api/.dev.vars", import.meta.url);
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = readDevVars();
if (!env.INTERVALS_API_KEY || !env.INTERVALS_ATHLETE_ID) {
  console.error(
    "INTERVALS_API_KEY en/of INTERVALS_ATHLETE_ID ontbreken in workers/api/.dev.vars",
  );
  process.exit(1);
}

const window = process.argv[2] === "90d" ? "90d" : "1y";
const url =
  `https://intervals.icu/api/v1/athlete/${encodeURIComponent(env.INTERVALS_ATHLETE_ID)}/power-curves` +
  `?type=Ride&curves=${window}`;
const auth = `Basic ${Buffer.from(`API_KEY:${env.INTERVALS_API_KEY}`).toString("base64")}`;

const resp = await fetch(url, {
  headers: { Authorization: auth, Accept: "application/json" },
});
if (!resp.ok) {
  console.error(`intervals.icu HTTP ${resp.status}: ${await resp.text()}`);
  process.exit(1);
}
const raw = await resp.json();
const c = raw?.list?.[0] ?? null;
if (!c?.secs?.length) {
  console.error("Lege power-curve-respons (geen list[0].secs).");
  process.exit(1);
}

console.log(
  `RAW power-curve (${window}): label=${c.label} days=${c.days} weight=${c.weight} secs=${c.secs.length}`,
);

// ftp is in de Worker een settings-read; hier optioneel via .dev.vars (FTP=...).
const ftp = env.FTP ? Number(env.FTP) : undefined;
const norm = pcNormalize_(c, raw.activities || {}, ftp);
console.log(
  `pcNormalize_ (ftp=${ftp ?? "—"}): curve=${norm.curve?.length} markers=${norm.markers?.length} riderType=${norm.riderType}`,
);
console.log("window:", JSON.stringify(norm.window));
console.log("markers:", JSON.stringify(norm.markers, null, 2));
