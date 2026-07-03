/**
 * intervals-smoke.mjs — LOKAAL-ONLY smoke (NIET in de gate/CI).
 *
 * Doet ÉÉN echte intervals.icu-call en print N genormaliseerde activiteiten
 * (17-koloms engine-rijen via `activityToRow_`), zodat Daan lokaal tegen z'n
 * echte data kan verifiëren.
 *
 * Draaien:
 *   1) pnpm --filter @cadans/engine build     (maakt de engine-dist)
 *   2) node scripts/intervals-smoke.mjs [daysBack]
 *
 * Vereist workers/api/.dev.vars met:
 *   INTERVALS_API_KEY=...      (uit intervals.icu Developer Settings)
 *   INTERVALS_ATHLETE_ID=i...  (jouw numerieke athlete-id)
 * .dev.vars staat in .gitignore en wordt NOOIT gecommit.
 */
import { readFileSync } from "node:fs";
import { activityToRow_ } from "../packages/engine/dist/index.js";

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
if (!env.INTERVALS_API_KEY) {
  console.error("INTERVALS_API_KEY ontbreekt in workers/api/.dev.vars");
  process.exit(1);
}
if (!env.INTERVALS_ATHLETE_ID) {
  console.error(
    "INTERVALS_ATHLETE_ID ontbreekt in workers/api/.dev.vars (voeg 'i<jouw-id>' toe voor de smoke)",
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
  `https://intervals.icu/api/v1/athlete/${encodeURIComponent(env.INTERVALS_ATHLETE_ID)}/activities` +
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
arr.sort(
  (a, b) => +new Date(a.start_date_local) - +new Date(b.start_date_local),
);

console.log(
  `Fetched ${arr.length} activiteiten (${oldest}..${newest}). Eerste ${Math.min(5, arr.length)} genormaliseerd (17-kol):`,
);
for (const a of arr.slice(0, 5)) {
  console.log(JSON.stringify(activityToRow_(a)));
}
