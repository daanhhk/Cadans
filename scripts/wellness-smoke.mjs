/**
 * wellness-smoke.mjs — LOKAAL-ONLY smoke (NIET in de gate/CI), analoog aan
 * intervals-smoke.mjs. Doet ÉÉN echte wellness-call en print de gemapte D1-rijen
 * + de dashVormReeks_-output erover, ter visuele check tegen intervals.icu.
 *
 * Draaien:
 *   1) pnpm --filter @cadans/engine build
 *   2) node scripts/wellness-smoke.mjs [daysBack]
 * Vereist workers/api/.dev.vars met INTERVALS_API_KEY + INTERVALS_ATHLETE_ID.
 * (De mapping hieronder spiegelt src/integrations/wellness.ts:mapWellness — die
 * is de canonieke, geteste versie.)
 */
import { readFileSync } from "node:fs";
import { dashVormReeks_ } from "../packages/engine/dist/index.js";

function readDevVars() {
  const path = new URL("../workers/api/.dev.vars", import.meta.url);
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

function mapWellness(w) {
  const slaapU =
    w.sleepSecs != null
      ? Math.round(w.sleepSecs / 360) / 10
      : (w.sleep_hours ?? w.sleep ?? null);
  const ctl = w.ctl != null ? w.ctl : null;
  const atl = w.atl != null ? w.atl : null;
  return {
    datum: String(w.id ?? w.date ?? ""),
    rhr: w.restingHR ?? w.resting_hr ?? null,
    hrv: w.hrv ?? w.hrv_rmssd ?? null,
    slaapU,
    slaapScore: w.sleepScore ?? w.sleep_score ?? null,
    readiness: w.readiness ?? null,
    mood: w.mood ?? null,
    weightKg: w.weight ?? null,
    ctl: ctl != null ? Math.round(ctl * 10) / 10 : null,
    atl: atl != null ? Math.round(atl * 10) / 10 : null,
    vorm: ctl != null && atl != null ? Math.round((ctl - atl) * 10) / 10 : null,
    ramp: w.rampRate != null ? Math.round(w.rampRate * 100) / 100 : null,
  };
}

const env = readDevVars();
if (!env.INTERVALS_API_KEY || !env.INTERVALS_ATHLETE_ID) {
  console.error(
    "INTERVALS_API_KEY en/of INTERVALS_ATHLETE_ID ontbreken in workers/api/.dev.vars",
  );
  process.exit(1);
}

const daysBack = Number(process.argv[2] || 14);
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const oldest = fmt(new Date(now.getTime() - daysBack * 86400000));
const newest = fmt(now);

const url =
  `https://intervals.icu/api/v1/athlete/${encodeURIComponent(env.INTERVALS_ATHLETE_ID)}/wellness` +
  `?oldest=${oldest}&newest=${newest}`;
const auth = `Basic ${Buffer.from(`API_KEY:${env.INTERVALS_API_KEY}`).toString("base64")}`;

const resp = await fetch(url, {
  headers: { Authorization: auth, Accept: "application/json" },
});
if (!resp.ok) {
  console.error(`intervals.icu HTTP ${resp.status}: ${await resp.text()}`);
  process.exit(1);
}
const data = await resp.json();
const arr = Array.isArray(data) ? data : [];
const mapped = arr.map(mapWellness).filter((r) => r.datum);

console.log(
  `Fetched ${arr.length} wellness-records (${oldest}..${newest}). Eerste 5 gemapt:`,
);
for (const r of mapped.slice(0, 5)) console.log(JSON.stringify(r));

// 12-koloms wellValues (idx0 Date, lege → "") → dashVormReeks_.
const b = (x) => (x == null ? "" : x);
const wellValues = mapped.map((r) => [
  new Date(r.datum),
  b(r.rhr),
  b(r.hrv),
  b(r.slaapU),
  b(r.slaapScore),
  b(r.readiness),
  b(r.mood),
  b(r.weightKg),
  b(r.ctl),
  b(r.atl),
  b(r.vorm),
  b(r.ramp),
]);
console.log("\ndashVormReeks_ (oudste→nieuwste):");
console.log(JSON.stringify(dashVormReeks_(wellValues), null, 2));
