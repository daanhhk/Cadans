// Headless screenshot harness. Seeds two week shapes into the LOCAL D1 and captures all
// seven day cards per shape, so a visual check needs no deploy.
// Client tooling only: no engine, no migration, no deploy, NEVER --remote.
//
// Run: node tools/shots/shot.mjs   (both dev servers must be up; see README.md)
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");

// Hard on loopback. Remote is NEVER touched — no --remote, no deployed origin.
const WEB = "http://127.0.0.1:5173";
const API = "http://127.0.0.1:8787";

const VIEWPORT_W = 390;
const VIEWPORT_H = 1800;
const HEIGHT_CAP = 4000;

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_RE = /^(ma|di|wo|do|vr|za|zo)\s*\d{1,2}$/i;

/** Monday of the current local week, yyyy-MM-dd. Never hardcoded. */
function mondayISO() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function plusDays(iso, n) {
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, dd + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Seven planner days; `spec` maps day offset -> {minuten, dagtype}. */
function plannerDays(monday, spec) {
  return DAGEN.map((_, n) => {
    const s = spec[n];
    return {
      datum: plusDays(monday, n),
      train: !!s,
      minuten: s ? s.minuten : null,
      dagtype: s ? s.dagtype : null,
      toelichting: null,
    };
  });
}

const SCENARIOS = [
  {
    name: "v7",
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      4: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
      6: { minuten: 120, dagtype: "weekend" },
    },
  },
  {
    name: "v7-pendel",
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      // pendel duration comes from settings.pendelDuurMin; 40 here is for readability.
      2: { minuten: 40, dagtype: "pendel" },
      4: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
      6: { minuten: 120, dagtype: "weekend" },
    },
  },
];

/** Poll a URL until it answers 200, or give up after `seconds`. */
async function waitFor(url, seconds) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function apiGet(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return await r.json();
}

async function apiPut(path, body) {
  const r = await fetch(API + path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PUT ${path} -> ${r.status} ${await r.text()}`);
  return await r.json();
}

/**
 * PUT /api/settings is effectively FULL-REPLACE: writeSettings writes `?? null` for every
 * field the patch lacks, and an explicit null is a 400. So carry every field that currently
 * HAS a value, drop the ones that are already null, and apply the overrides on top.
 */
async function seedSettings(log) {
  const current = await apiGet("/api/settings");
  log.push("--- GET /api/settings (raw, before) ---", JSON.stringify(current));
  const merged = { ...current, ...OVERRIDES };
  const body = {};
  for (const [k, v] of Object.entries(merged)) {
    if (v !== null && v !== undefined) body[k] = v;
  }
  await apiPut("/api/settings", body);
  log.push("--- PUT /api/settings (sent) ---", JSON.stringify(body));
  return body;
}

const OVERRIDES = {
  ftp: 280,
  gewicht: 75,
  doel: "FTP",
  doelStart: "2026-06-29",
  pendelDuurMin: 40,
  pendelAantal: 2,
};

const EVENT_DATE = "2027-04-17";

async function seedEvents(log) {
  const current = await apiGet("/api/events");
  const list = Array.isArray(current) ? current : (current.events ?? []);
  const found = list.some(
    (e) => e.datum === EVENT_DATE && String(e.prioriteit).toUpperCase() === "A",
  );
  if (found) {
    log.push(`--- events: A-race on ${EVENT_DATE} already present, left alone`);
    return "already present";
  }
  const events = [
    ...list,
    {
      datum: EVENT_DATE,
      naam: "Amstel Gold Race",
      type: "race",
      prioriteit: "A",
    },
  ];
  await apiPut("/api/events", { events });
  log.push(`--- events: appended A-race on ${EVENT_DATE}`);
  return "appended";
}

/**
 * The app is height:100dvh with its own scrolling <main>, so a fullPage shot clips.
 * Measure what the content really needs and grow the viewport to match instead.
 */
async function contentHeight(page) {
  return await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return 0;
    const chrome = window.innerHeight - main.clientHeight;
    return Math.ceil(main.scrollHeight + chrome);
  });
}

/** Collects console/page errors and a per-path tally of /api requests. */
function attach(page) {
  const errors = [];
  const api = new Map();
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  };
  const onPageError = (e) => errors.push(`pageerror: ${e.message}`);
  // A bare "Failed to load resource: 404" says nothing; record WHICH url failed.
  const onResponse = (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  };
  const onRequest = (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith("/api/")) api.set(p, (api.get(p) ?? 0) + 1);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  page.on("request", onRequest);
  return {
    errors,
    api,
    reset() {
      errors.length = 0;
      api.clear();
    },
    off() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
      page.off("request", onRequest);
    },
  };
}

async function settle(page) {
  await page.waitForSelector("#root > *", { state: "visible", timeout: 60000 });
  try {
    await page
      .getByText("Laden…")
      .first()
      .waitFor({ state: "hidden", timeout: 15000 });
  } catch {
    // No loader, or it never cleared — not fatal, the shot still tells us why.
  }
  await page.waitForTimeout(800);
}

async function capture(page, dir, name, url, probe) {
  let height = VIEWPORT_H;
  const needed = await contentHeight(page);
  const capped = needed > HEIGHT_CAP;
  if (needed > VIEWPORT_H) {
    height = Math.min(needed, HEIGHT_CAP);
    await page.setViewportSize({ width: VIEWPORT_W, height });
    await page.waitForTimeout(200);
  }

  const png = join(dir, `${name}.png`);
  await page.screenshot({ path: png });

  const text = await page.evaluate(
    () => document.querySelector("main")?.innerText ?? "(no <main>)",
  );
  const tally = [...probe.api.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  writeFileSync(
    join(dir, `${name}.txt`),
    [
      `url: ${url}`,
      `viewport: ${VIEWPORT_W}x${height} (needed ${needed}${capped ? ", CAPPED" : ""})`,
      `errors: ${probe.errors.length ? "" : "none"}`,
      ...probe.errors.map((e) => `  ${e}`),
      `api requests: ${tally.length ? "" : "none"}`,
      ...tally.map(([p, n]) => `  ${n}x ${p}`),
      "",
      "--- main innerText ---",
      text,
      "",
    ].join("\n"),
    "utf8",
  );
  return { name, height, needed, capped, errors: probe.errors.length, png };
}

async function sweep(page, scenario, monday, results) {
  const dir = join(OUT, scenario.name);
  mkdirSync(dir, { recursive: true });
  await apiPut(`/api/planner/${monday}`, {
    days: plannerDays(monday, scenario.spec),
  });

  const probe = attach(page);
  const url = `${WEB}/schema`;
  await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
  probe.reset();
  // NOT networkidle: vite keeps an HMR websocket open, so it never settles.
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle(page);
  results.push({
    scenario: scenario.name,
    ...(await capture(page, dir, "01-week", url, probe)),
  });

  // The day strip must be exactly seven buttons. Fewer or more means the selector drifted,
  // and a harness that quietly shoots the wrong thing is worse than one that stops.
  const strip = await page
    .locator("button")
    .filter({ hasText: DAY_RE })
    .elementHandles();
  if (strip.length !== 7) {
    throw new Error(
      `${scenario.name}: expected 7 day-strip buttons, found ${strip.length}`,
    );
  }

  for (let i = 0; i < 7; i++) {
    await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
    probe.reset();
    await strip[i].click();
    await page.waitForTimeout(600);
    const name = `0${i + 2}-${DAGEN[i]}`;
    results.push({
      scenario: scenario.name,
      ...(await capture(page, dir, name, `${url} [${DAGEN[i]}]`, probe)),
    });
  }
  probe.off();
}

async function main() {
  if (!(await waitFor(WEB, 60))) {
    throw new Error(
      `vite dev server not answering on ${WEB} — start it before running this`,
    );
  }
  // Seeding needs the Worker; without it there is nothing to seed into.
  const apiUp = await waitFor(`${API}/api/settings`, 20);
  if (!apiUp) {
    throw new Error(`worker not answering on ${API} — seeding needs it`);
  }

  // Never let a stale shot pass for a fresh one.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const monday = mondayISO();
  const log = [`monday (from local clock): ${monday}`];
  await seedSettings(log);
  const eventsState = await seedEvents(log);
  writeFileSync(join(OUT, "00-seed.txt"), `${log.join("\n")}\n`, "utf8");

  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const ctx = await browser.newContext({
      locale: "nl-NL",
      timezoneId: "Europe/Amsterdam", // the engine leans on ambient Amsterdam
      colorScheme: "dark",
      reducedMotion: "reduce",
      deviceScaleFactor: 2,
      viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
    });
    const page = await ctx.newPage();
    for (const scenario of SCENARIOS) {
      await sweep(page, scenario, monday, results);
    }
  } finally {
    await browser.close();
  }

  const lines = [`monday: ${monday}  events: ${eventsState}`];
  for (const r of results) {
    const bytes = statSync(r.png).size;
    lines.push(
      `${r.scenario}/${r.name}.png  used=${r.height} needed=${r.needed}${r.capped ? " CAPPED" : ""}  ${bytes} bytes  errors=${r.errors}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

main().catch((e) => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
