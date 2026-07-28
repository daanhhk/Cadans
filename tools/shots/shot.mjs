// Headless screenshot harness — proves the chain works: browser starts, page composites,
// PNG lands on disk. Client tooling only: no engine, no migration, no deploy.
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
const HEIGHT_CAP = 3000;

const PAGES = [
  { name: "01-preview", path: "/preview" },
  { name: "02-schema", path: "/schema" },
  { name: "03-weekplanner", path: "/weekplanner" },
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

async function shoot(page, spec, index) {
  const errors = [];
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  };
  const onPageError = (e) => errors.push(`pageerror: ${e.message}`);
  // A bare "Failed to load resource: 404" says nothing; record WHICH url failed.
  const onResponse = (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  const url = WEB + spec.path;
  // NOT networkidle: vite keeps an HMR websocket open, so it never settles.
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
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

  let height = VIEWPORT_H;
  let capped = false;
  const needed = await contentHeight(page);
  if (needed > VIEWPORT_H) {
    height = Math.min(needed, HEIGHT_CAP);
    capped = needed > HEIGHT_CAP;
    await page.setViewportSize({ width: VIEWPORT_W, height });
    await page.waitForTimeout(200);
  }

  const png = join(OUT, `${spec.name}.png`);
  await page.screenshot({ path: png });

  const text = await page.evaluate(
    () => document.querySelector("main")?.innerText ?? "(no <main>)",
  );
  writeFileSync(
    join(OUT, `${spec.name}.txt`),
    [
      `url: ${url}`,
      `viewport: ${VIEWPORT_W}x${height}${capped ? " (CAPPED)" : ""}`,
      `errors: ${errors.length ? "" : "none"}`,
      ...errors.map((e) => `  ${e}`),
      "",
      "--- main innerText ---",
      text,
      "",
    ].join("\n"),
    "utf8",
  );

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);
  return { index, name: spec.name, height, capped, errors: errors.length, png };
}

async function main() {
  if (!(await waitFor(WEB, 60))) {
    throw new Error(
      `vite dev server not answering on ${WEB} — start it before running this`,
    );
  }
  // The Worker is optional: /preview renders without it. Note it, don't fail on it.
  const apiUp = await waitFor(`${API}/api/settings`, 5);

  // Never let a stale shot pass for a fresh one.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

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
    for (let i = 0; i < PAGES.length; i++) {
      await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
      results.push(await shoot(page, PAGES[i], i + 1));
    }
  } finally {
    await browser.close();
  }

  const lines = [`api reachable: ${apiUp ? "yes" : "no"}`];
  for (const r of results) {
    const bytes = statSync(r.png).size;
    lines.push(
      `${r.index}. ${r.name}.png  h=${r.height}${r.capped ? " CAPPED" : ""}  ${bytes} bytes  errors=${r.errors}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

main().catch((e) => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
