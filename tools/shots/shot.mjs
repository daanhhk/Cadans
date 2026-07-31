// Headless screenshot harness. Seeds two week shapes into the LOCAL D1 and captures all
// seven day cards per shape, so a visual check needs no deploy.
// Client tooling only: no engine, no migration, no deploy, NEVER --remote.
//
// Run: node tools/shots/shot.mjs   (both dev servers must be up; see README.md)
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
// OUTSIDE out/: that directory is wiped every run, so the pre-seed state would be lost.
const SEED_BACKUP = join(HERE, "seed-backup.json");

// Default: hard on loopback, and remote is NEVER touched.
//
// PROD MODE: pass a target URL as the single argument and the harness switches to READ-ONLY —
// it seeds nothing, writes no backup, makes no non-GET call of its own, runs no scenarios, and
// does not pin the clock (on a live deployment the real date IS the point). Everything else is
// unchanged. Without an argument the behaviour is byte-identical to before.
const TARGET = (process.argv[2] || "").replace(/\/+$/, "");
const PROD = !!TARGET;
const WEB = PROD ? TARGET : "http://127.0.0.1:5173";
// One origin on a deployment: the Worker serves the assets AND /api.
const API = PROD ? TARGET : "http://127.0.0.1:8787";

// Prod sits behind a whole-origin Basic-auth gate (workers/api/src/index.ts). Local does not:
// BASIC_AUTH_PASSWORD is a deploy-only secret and the gate is a no-op without it.
const AUTH_FILE = join(HERE, ".prod-auth");
const AUTH_USER = process.env.CADANS_BASIC_AUTH_USER || "daan";

/** Password from the env var, else the first non-blank line of .prod-auth. Never logged. */
function readAuthPassword() {
  const fromEnv = (process.env.CADANS_BASIC_AUTH_PASSWORD || "").trim();
  if (fromEnv) return fromEnv;
  if (!existsSync(AUTH_FILE)) return "";
  // Missing, empty or whitespace-only all count as ABSENT.
  return (readFileSync(AUTH_FILE, "utf8").split("\n")[0] || "").trim();
}

const AUTH_PASSWORD = PROD ? readAuthPassword() : "";
// Header for the preflight fetches; the browser context gets httpCredentials instead.
const AUTH_HEADERS =
  PROD && AUTH_PASSWORD
    ? {
        Authorization: `Basic ${Buffer.from(`${AUTH_USER}:${AUTH_PASSWORD}`).toString("base64")}`,
      }
    : undefined;

const VIEWPORT_W = 390;
const VIEWPORT_H = 1800;
const HEIGHT_CAP = 4000;

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_RE = /^(ma|di|wo|do|vr|za|zo)\s*\d{1,2}$/i;

// The pinned browser clock, filled in main() once the Monday is known. The weekvorm axis
// measures a week that lies entirely AHEAD; on the real clock today is mid-week and the app
// and the yardstick would not be measuring the same thing. See docs/WERKWIJZE.md — the clock
// is a fixture variable.
let PINNED = "";

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
  // V2 and V4 carry a long Saturday ABOVE the library band (210 and 240 min), which is where
  // the duration-selection rule is supposed to show — v7's 180 stayed plain endurance.
  {
    name: "v2",
    spec: {
      0: { minuten: 90, dagtype: "vrij" },
      1: { minuten: 90, dagtype: "vrij" },
      3: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 210, dagtype: "weekend" },
    },
  },
  {
    name: "v4",
    spec: {
      0: { minuten: 60, dagtype: "vrij" },
      1: { minuten: 60, dagtype: "vrij" },
      3: { minuten: 60, dagtype: "vrij" },
      5: { minuten: 240, dagtype: "weekend" },
    },
  },
  // MIDWEEK: de klok staat op WOENSDAG, dus maandag en dinsdag zijn VERSTREKEN trainingsdagen.
  // Dat is de enige manier om het rustdag-defect te fotograferen — assignWorkouts bouwt sessions
  // alleen voor tePlannen (train && !gedaan && datum >= vandaag), dus een verstreken dag heeft er
  // nul, en de dagkaart valt daarop terug op de rustdag-copy.
  {
    name: "v7-midweek",
    dagOffset: 2,
    spec: {
      0: { minuten: 60, dagtype: "vrij" },
      1: { minuten: 60, dagtype: "vrij" },
      3: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
      6: { minuten: 120, dagtype: "weekend" },
    },
  },
  // BLOKWEEK 4: dezelfde spec als v7, maar de deloadweek. blokReviewVenster geeft in blokweek 4
  // fase "lopend" en in blokweek 1 fase "afgerond" — met dit scenario staan BEIDE takken van de
  // blok-terugblik op beeld in plaats van alleen de afgeronde.
  {
    name: "v7-blokweek4",
    blokWeek: 4,
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      4: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
      6: { minuten: 120, dagtype: "weekend" },
    },
  },
  // OVERNAME: de acht-wekengrens vóór het A-event van 2027-04-17. Eigen absolute weekmaandag,
  // want de overname-kaart bestaat alleen binnen EVENT_OVERNAME_WEKEN van het hoofdevent en dat
  // ligt ver buiten de echte week. ROADMAP punt 9 fase B.
  {
    name: "overname",
    monday: "2027-02-22",
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      4: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
      6: { minuten: 120, dagtype: "weekend" },
    },
  },
];

/** Poll a URL until it answers 200, or give up after `seconds`. */
async function waitFor(url, seconds, headers) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers,
      });
      // Without credentials a gated origin answers 401 and r.ok stays false, so the
      // preflight would report "not answering" while the deployment is perfectly up.
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
  // Only on first run: after that the "current" state is already a seeded one, and writing
  // it again would overwrite the real pre-seed backup with a seeded copy.
  if (existsSync(SEED_BACKUP)) {
    log.push("--- seed-backup.json: already existed, left alone");
  } else {
    writeFileSync(SEED_BACKUP, `${JSON.stringify(current, null, 2)}\n`, "utf8");
    log.push("--- seed-backup.json: created");
  }
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
  // Vervangen PER SCENARIO in sweep(): de blokweek bepaalt of de blok-kaart bestaat.
  doelStart: "2026-06-29",
  pendelDuurMin: 40,
  pendelAantal: 2,
  // Zonder GEDECLAREERDE weekuren geeft blokDosisNorm null en kan de blok-terugblik in geen
  // enkel scenario bestaan — de harness was daar dus blind voor. De ENGINE leest weekUren
  // NERGENS (hij is meetlat-invoer, geen planner-invoer: DOELEN-SPEC 2A), dus deze seed kan
  // geen weekplan verschuiven. Hij laat alleen kaarten verschijnen.
  weekUren: 5,
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
      `clock pinned to: ${PINNED}`,
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

/** `scenario` null = prod mode: no planner seed, just look at whatever is there. */
async function sweep(page, scenario, monday, results, seededSettings) {
  const label = scenario ? scenario.name : "prod";
  const dir = join(OUT, label);
  mkdirSync(dir, { recursive: true });
  const url = `${WEB}/schema`;
  if (scenario) {
    // DE BLOKWEEK PER SCENARIO. `doelStart` stond vast op 2026-06-29 terwijl de weekmaandag uit de
    // ECHTE klok komt, dus de blokweek dreef per kalenderweek — en daarmee zowel de meso-factor als
    // het BESTAAN van de blok-terugblik (blokReviewVenster geeft alleen in blokweek 1 en 4 een
    // venster). Nu leidt de harness doelStart af uit de bedoelde blokweek. PUT /api/settings is
    // FULL-REPLACE, dus de VOLLEDIGE gezaaide body gaat mee met alleen doelStart eroverheen.
    // DE WEEKMAANDAG PER SCENARIO. Normaal is dat de maandag van de ECHTE week; een scenario dat
    // een moment ver vooruit moet fotograferen (bijvoorbeeld de acht-wekengrens vóór een A-event
    // in 2027) zet zijn eigen absolute maandag. Alles hieronder — settings, planner en de
    // browserklok — hangt dan aan diezelfde datum, anders seed je een andere week dan je schiet.
    const wkMonday = scenario.monday ?? monday;
    const blokWeek = scenario.blokWeek ?? 1;
    const doelStart = plusDays(wkMonday, -(blokWeek - 1) * 7);
    if (seededSettings) {
      await apiPut("/api/settings", { ...seededSettings, doelStart });
    }
    await apiPut(`/api/planner/${wkMonday}`, {
      days: plannerDays(wkMonday, scenario.spec),
    });

    // DE KLOK PER SCENARIO. Stond dit één keer in main() vóór de lus, dan lag ELK scenario
    // volledig vooruit en was een VERSTREKEN dag per constructie onbereikbaar. Offset 0 (of
    // weggelaten) pint op de maandag en is byte-identiek aan voorheen. setFixedTime, niet
    // install: Date bevriezen en timers laten lopen.
    const offset = scenario.dagOffset ?? 0;
    if (offset > 0) {
      // WARM-UP, niet geschoten. De app schrijft de week pas als plan-van-record weg zolang de
      // dagen nog VOORUIT liggen; zonder deze load bestaat de bevroren entry niet en meet je een
      // ander defect dan je denkt. Dus eerst laden met de klok op de maandag, dán verzetten.
      await page.clock.setFixedTime(new Date(`${wkMonday}T08:00:00`));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);
    }
    await page.clock.setFixedTime(
      new Date(`${plusDays(wkMonday, offset)}T08:00:00`),
    );
    PINNED = `${plusDays(wkMonday, offset)} 08:00 (Europe/Amsterdam)`;
  }

  const probe = attach(page);
  await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
  probe.reset();
  // NOT networkidle: vite keeps an HMR websocket open, so it never settles.
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle(page);
  results.push({
    scenario: label,
    ...(await capture(page, dir, "01-week", url, probe)),
  });

  // The day strip must be exactly seven buttons. Fewer or more means the selector drifted,
  // and a harness that quietly shoots the wrong thing is worse than one that stops.
  const strip = () => page.locator("button").filter({ hasText: DAY_RE });
  const count = await strip().count();
  if (count !== 7) {
    throw new Error(`${label}: expected 7 day-strip buttons, found ${count}`);
  }

  for (let i = 0; i < 7; i++) {
    await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
    probe.reset();
    // Re-locate every time: selecting a day re-renders the strip, so a handle grabbed up
    // front detaches and the click fails with "Element is not attached to the DOM".
    await strip().nth(i).click();
    await page.waitForTimeout(600);
    const name = `0${i + 2}-${DAGEN[i]}`;
    results.push({
      scenario: label,
      ...(await capture(page, dir, name, `${url} [${DAGEN[i]}]`, probe)),
    });
  }
  probe.off();
}

async function main() {
  // Fail before touching the network, and name the two places to look — never a value.
  if (PROD && !AUTH_PASSWORD) {
    throw new Error(
      `prod mode needs a Basic-auth password: set CADANS_BASIC_AUTH_PASSWORD, or put it on the first line of ${AUTH_FILE}`,
    );
  }
  if (!(await waitFor(WEB, 60, AUTH_HEADERS))) {
    throw new Error(
      PROD
        ? `${WEB} not answering`
        : `vite dev server not answering on ${WEB} — start it before running this`,
    );
  }
  // A GET only — even the preflight stays read-only in prod mode.
  const apiUp = await waitFor(`${API}/api/settings`, 20, AUTH_HEADERS);
  if (!apiUp && !PROD) {
    throw new Error(`worker not answering on ${API} — seeding needs it`);
  }

  // Never let a stale shot pass for a fresh one.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const monday = mondayISO();
  let eventsState = "n/a (prod, read-only)";
  let seededSettings = null;
  if (PROD) {
    // On a live deployment the REAL date is the point, so no clock pin.
    PINNED = "not pinned (prod, real clock)";
  } else {
    PINNED = `${monday} 08:00 (Europe/Amsterdam)`;
    const log = [
      `monday (from local clock): ${monday}`,
      // De klok wordt PER SCENARIO gepind (sweep); de gepinde dag staat in elke .txt.
      `clock pinned per scenario: ${SCENARIOS.map((x) => `${x.name}=${plusDays(monday, x.dagOffset ?? 0)}`).join(", ")}`,
      // De BEDOELDE blokweek en de daaruit berekende doelStart. Het blokweek-raster wordt hier
      // NIET nagebouwd om het te controleren — een toets die zijn eigen raster nabouwt meet iets
      // anders dan de app. De kaart noemt zelf de blokdatums; die lees je terug uit de shot.
      `blokweek per scenario: ${SCENARIOS.map((x) => `${x.name}=bw${x.blokWeek ?? 1} (doelStart ${plusDays(monday, -((x.blokWeek ?? 1) - 1) * 7)})`).join(", ")}`,
    ];
    seededSettings = await seedSettings(log);
    eventsState = await seedEvents(log);
    writeFileSync(join(OUT, "00-seed.txt"), `${log.join("\n")}\n`, "utf8");
  }

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
      // Prod is behind a whole-origin Basic-auth gate; without this every navigation 401s.
      ...(PROD
        ? { httpCredentials: { username: AUTH_USER, password: AUTH_PASSWORD } }
        : {}),
    });
    const page = await ctx.newPage();
    if (PROD) {
      // One situation only: whatever the live data happens to be.
      await sweep(page, null, monday, results, null);
    } else {
      // De klok-pin staat PER SCENARIO in sweep(): elk scenario mag zijn eigen dag pinnen.
      for (const scenario of SCENARIOS) {
        await sweep(page, scenario, monday, results, seededSettings);
      }
    }
  } finally {
    await browser.close();
  }

  const lines = [
    PROD
      ? `target: ${WEB}  READ-ONLY, clock ${PINNED}, basic-auth as "${AUTH_USER}" (password supplied, not shown)`
      : `monday: ${monday}  clock: ${PINNED}  events: ${eventsState}`,
  ];
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
