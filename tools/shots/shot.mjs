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

/** BLOK_MIN_BEOORDEELBARE_WEKEN uit apps/web/src/lib/blok.ts — het minimum aantal opbouwweken
 * met een bewaard plan waarop de blok-terugblik nog een uitspraak doet. Hier bewust een LOSSE
 * kopie: de harness is een los script zonder bundler, en de waarde hoort mee te bewegen als de
 * lib hem verhoogt. Loopt hij uiteen, dan zwijgt de kaart op de shots en zie je dat meteen. */
const BEWIJSWEKEN = 2;

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_RE = /^(ma|di|wo|do|vr|za|zo)\s*\d{1,2}$/i;

/** Elk getal met VIER OF MEER decimalen, punt of komma als scheidingsteken.
 *
 * DE DREMPEL IS GEMETEN, NIET GEKOZEN. Fase A en B1 draaiden op twee decimalen om de VERDELING te
 * zien, en die verdeling wijst de grens zelf aan: de float-ruis draagt VEERTIEN decimalen
 * ("90.39999999999999"), terwijl elke legitieme treffer er hoogstens DRIE heeft — `3,77` W/kg en
 * `0,12` sinds seizoenstart hebben er twee, en `1.167` W is de NL-DUIZENDTALPUNT en dus geen
 * decimaal maar wel drie cijfers achter het scheidingsteken. Vier ligt daar precies tussen: geen
 * enkele echte waarde in de app haalt hem, en geen enkele float-ruis ontkomt eraan.
 *
 * VANAF FASE B2 IS HET NET HARD. Een treffer laat de run FALEN; het rapporteert niet meer alleen. */
const FLOAT_RE = /\d+[.,]\d{4,}/g;

/** Unieke treffers van FLOAT_RE, elk mét DRIE contextregels: de regel ervoor, de regel zelf en de
 * regel erna.
 *
 * WAAROM DRIE EN NIET EEN. In fase A stond de echte ruis alleen op zijn eigen regel — "90.4..." met
 * het label "min" op de VOLGENDE regel — dus de context herhaalde de treffer en wees niets aan.
 * innerText knipt per blok-element, en een getal en zijn eenheid staan in de app standaard in twee
 * losse elementen. Eén regel is daarmee per constructie te smal.
 *
 * Dedup blijft op treffer plus de EIGEN regel: de buren zijn context, geen identiteit. */
function floatNoise(text) {
  const seen = new Set();
  const hits = [];
  const lines = text.split("\n");
  const clip = (s) => (s ?? "").trim().slice(0, 120);
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].match(FLOAT_RE) ?? []) {
      const line = clip(lines[i]);
      const key = `${m} :: ${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        hit: m,
        prev: clip(lines[i - 1]),
        line,
        next: clip(lines[i + 1]),
      });
    }
  }
  return hits;
}

/** De schermen buiten /schema. VOLGORDE IS DE NUMMERING: 09- tot en met 15-.
 * /preview zit hier NIET bij: die route bestaat alleen in DEV (App.tsx), dus in een prod-build
 * valt hij op de catch-all terug naar /schema en fotografeer je twee keer hetzelfde scherm. */
const EXTRA_ROUTES = [
  "/vorm",
  "/trainingen",
  "/niveau",
  "/activiteiten",
  "/instellingen",
  "/weekplanner",
  "/events",
];

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
    // DE EXTRA SCHERMEN DRAAIEN OP PRECIES DIT ENE SCENARIO. Ze variëren niet met de weekvorm,
    // dus zeven schermen maal negen scenario's zou 63 shots voor niets zijn. De vlag staat
    // daarom expliciet hier en nergens anders; in prod-modus draaien ze altijd.
    extraRoutes: true,
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
  // WEEKSTEM (ROADMAP punt 10 fase B): de klok staat op VRIJDAG en er zijn alleen trainingsdagen
  // op maandag en dinsdag. Die twee zijn dus VERSTREKEN en ongereden — een gemiste sleutelsessie —
  // en er staat GEEN trainingsdag meer die de prikkel kan dragen. Dat is precies het geval waarin
  // de weekstem spreekt; geen bestaand scenario draagt die combinatie, want die hebben allemaal
  // een weekenddag vooruit.
  {
    name: "v7-weekstem",
    dagOffset: 3,
    spec: {
      0: { minuten: 60, dagtype: "vrij" },
      1: { minuten: 60, dagtype: "vrij" },
    },
  },
  // KLIM-KORT (ROADMAP punt 15): het enige scenario met een ANDER doel. Nodig omdat
  // `combo_long_with_efforts` uitsluitend bij `klim_kort` en `klim_lang` vuurt, en fase 2 het
  // blok-oordeel juist op die doelen omkeert. Lange zaterdag (180) zodat die sessie ook echt
  // gekozen wordt; blokweek 1 zodat de blok-terugblik in beeld staat.
  {
    name: "klim-kort",
    doel: "Korte beklimmingen",
    blokWeek: 1,
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      3: { minuten: 60, dagtype: "vrij" },
      4: { minuten: 90, dagtype: "vrij" },
      5: { minuten: 180, dagtype: "weekend" },
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
    // GEEN <main>: de full-screen routes (/instellingen, /weekplanner, /events) staan BUITEN de
    // AppShell en hebben er geen. Daar scrollt het document zelf — index.css zet html, body en
    // #root op height 100% — dus dat is de scrollhoogte die telt. Zonder deze tak bleef de
    // viewport op VIEWPORT_H staan en sneed de shot af. Voor elk scherm MET <main> verandert er
    // niets, dus de bestaande shots blijven byte-identiek.
    if (!main) return Math.ceil(document.documentElement.scrollHeight);
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
  // DE METHODE HOORT ERBIJ. Op alleen het pad is een PUT niet van een GET te onderscheiden, en
  // dan is "read-only" niet uit de .txt te verifiëren — precies de uitspraak waar de prod-modus
  // op leunt. De sleutel is "METHODE /pad" en de sortering blijft daarmee deterministisch.
  const onRequest = (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith("/api/")) {
      const key = `${r.method()} ${p}`;
      api.set(key, (api.get(key) ?? 0) + 1);
    }
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

/**
 * DE LEESPAS, LOS VAN DE SCHIETPAS. De PNG en het tekstblok in de .txt tonen het scherm ZOALS HET
 * ERBIJ STAAT, met alles dicht — dat is wat Daan ziet en daar mag niets aan veranderen. Het net
 * moet juist ACHTER de dichtgeklapte onderdelen kijken: een blokkenlijst die standaard dicht staat
 * leest anders als "schoon" terwijl hij "blind" is.
 *
 * TWEE MECHANISMEN, ALLEBEI NODIG. `hidden` werkt via de browserregel `[hidden] { display: none }`,
 * en een INLINE `display` verslaat die per specificiteit. De blokkenlijst in `WorkoutDetail.tsx:158`
 * draagt alleen het attribuut; het aannames-paneel in `DoelProjectie.tsx:957` draagt `hidden` PLUS
 * een inline display. Wie alleen het attribuut weghaalt krijgt op dat paneel NUL treffers en leest
 * dat als schoon — precies de fout die deze pas moet uitsluiten.
 *
 * HERSTEL IS VERBATIM, ook als de waarde leeg of afwezig was. Het commentaar bij DoelProjectie
 * waarschuwt expliciet dat die display nooit op een vaste "flex" terug mag; vandaar de opgeslagen
 * waarde MET priority, en `removeProperty` als er niets stond. Alleen INLINE stijl wordt geraakt,
 * nooit een stylesheet-regel.
 *
 * GEEN viewport-wijziging, GEEN screenshot en GEEN klik: de PNG is hier al geschoten en mag per
 * constructie niet meer bewegen. De 79-PNG-vergelijking is daar de toets op.
 */
async function readWithDisclosuresOpen(page) {
  return await page.evaluate(() => {
    const root =
      document.querySelector("main") ?? document.getElementById("root");
    if (!root) {
      return { text: "(no <main> and no #root)", hiddenN: 0, inlineN: 0 };
    }

    const undoHidden = [];
    for (const el of root.querySelectorAll("[hidden]")) {
      undoHidden.push([el, el.getAttribute("hidden")]);
      el.removeAttribute("hidden");
    }
    const undoDisplay = [];
    for (const el of root.querySelectorAll("*")) {
      if (el.style.getPropertyValue("display") !== "none") continue;
      undoDisplay.push([
        el,
        el.style.getPropertyValue("display"),
        el.style.getPropertyPriority("display"),
      ]);
      el.style.removeProperty("display");
    }

    const text = root.innerText;

    for (const [el, value, priority] of undoDisplay) {
      if (value) el.style.setProperty("display", value, priority);
      else el.style.removeProperty("display");
    }
    for (const [el, value] of undoHidden) {
      el.setAttribute("hidden", value ?? "");
    }
    return {
      text,
      hiddenN: undoHidden.length,
      inlineN: undoDisplay.length,
    };
  });
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

  // Dezelfde val-terug als in contentHeight: zonder <main> zou dit "(no <main>)" opleveren en
  // scande het float-net juist op Instellingen — het scherm met de meeste getallen — niets.
  const { text, root } = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (main) return { text: main.innerText, root: "main" };
    const r = document.getElementById("root");
    if (r) return { text: r.innerText, root: "#root" };
    return { text: "(no <main> and no #root)", root: "none" };
  });
  // Pas HIERNA de leespas: het tekstblok hierboven blijft het scherm zoals het erbij staat, het
  // net kijkt achter de dichtgeklapte onderdelen. De tellers scheiden "niets verborgen" van "de
  // selector is verschoven" — zonder die twee getallen zijn die twee gevallen niet te onderscheiden.
  const scan = await readWithDisclosuresOpen(page);
  const noise = floatNoise(scan.text);
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
      `float-net: ${noise.length ? noise.length : "none"} (opened: hidden=${scan.hiddenN} inline-display=${scan.inlineN})`,
      ...noise.flatMap((h) => [
        `  ${h.hit}`,
        `      voor:  ${h.prev}`,
        `      regel: ${h.line}`,
        `      na:    ${h.next}`,
      ]),
      "",
      // Het label noemt de bron die daadwerkelijk gelezen is; een .txt die "main" zegt terwijl er
      // geen <main> staat, liegt op precies het punt waar je hem vertrouwt.
      root === "main" ? "--- main innerText ---" : `--- ${root} innerText ---`,
      text,
      "",
    ].join("\n"),
    "utf8",
  );
  return {
    name,
    height,
    needed,
    capped,
    errors: probe.errors.length,
    noise: noise.length,
    hits: noise,
    hiddenN: scan.hiddenN,
    inlineN: scan.inlineN,
    png,
  };
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
      // HET DOEL PER SCENARIO. `OVERRIDES.doel` staat op "FTP" en geen scenario overschreef dat,
      // dus geen enkele shot kon een klim-doel tonen — terwijl `spreiding.effortsInLangeRit`
      // alleen op `klim_kort` en `klim_lang` staat en punt 15 het oordeel juist daar omkeert.
      // Zelfde mechaniek als `doelStart` hierboven: weggelaten → de gezaaide waarde blijft staan,
      // dus de bestaande scenario's zijn byte-identiek.
      const doel = scenario.doel ?? seededSettings.doel;
      await apiPut("/api/settings", { ...seededSettings, doelStart, doel });
    }
    await apiPut(`/api/planner/${wkMonday}`, {
      days: plannerDays(wkMonday, scenario.spec),
    });

    // ROADMAP punt 14 fase 1d — VOLLEDIGE WEEKPLAN-RIJEN VOOR HET BEOORDEELDE BLOK.
    //
    // De blok-terugblik poort op de nominale zone-labels uit de BEWAARDE weekplan-rijen, en die
    // ontstonden hier alleen als bijproduct: de app schrijft de BEKEKEN week weg, dus een scenario
    // dat één keer op zijn eigen maandag laadt liet precies één rij achter — en dan nog van een
    // week BUITEN het beoordeelde blok. Elke uitspraak over de poortset op deze shots was daarmee
    // artefact. Sinds fase 1d vraagt de poort minstens BLOK_MIN_BEOORDEELBARE_WEKEN OPBOUWWEKEN
    // met een bewaard plan, anders zwijgt de kaart.
    //
    // GEEN GEFABRICEERDE ENTRIES. Deze voorloop zet de planner voor die weken en laadt /schema met
    // de klok op elke maandag, zodat de APP ZELF de rij wegschrijft langs zijn eigen route
    // (persistWeekplan → PUT /api/weekplan/:monday). Een met de hand geschreven rij zou een vorm
    // kunnen dragen die de producent nooit levert — dan meet je je eigen fixture.
    //
    // WELK BLOK. blokReviewVenster geeft in blokweek 1 het VORIGE blok (start -28 dagen) en in
    // blokweek 4 het LOPENDE (start -21). De deloadweek slaan we over: die levert sinds 1d geen
    // bewijs meer.
    const blokStart = plusDays(wkMonday, blokWeek === 4 ? -21 : -28);
    for (let i = 0; i < BEWIJSWEKEN; i++) {
      const m = plusDays(blokStart, i * 7);
      await apiPut(`/api/planner/${m}`, {
        days: plannerDays(m, scenario.spec),
      });
      await page.clock.setFixedTime(new Date(`${m}T08:00:00`));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);
    }

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

  // DE OVERIGE SCHERMEN, ALTIJD ALS LAATSTE. De harness laadde uitsluitend /schema, dus elke
  // wijziging buiten dat scherm was visueel onverifieerbaar. Ze staan hier NA de weekshot en na
  // alle zeven dagshots en nooit ervoor: die shots moeten geproduceerd zijn voordat er weg
  // genavigeerd wordt, anders is de byte-vergelijking tegen een vorige run waardeloos. Daarmee
  // raakt ook de zeven-knoppen-assertie hierboven alleen /schema — die strip bestaat elders niet.
  // De klok is al per scenario gepind op deze page en overleeft een navigatie, dus viewport,
  // klok en settle zijn hier identiek aan de bestaande shots.
  if (PROD || scenario?.extraRoutes) {
    for (let i = 0; i < EXTRA_ROUTES.length; i++) {
      const route = EXTRA_ROUTES[i];
      await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
      probe.reset();
      const u = `${WEB}${route}`;
      await page.goto(u, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);
      const name = `${String(i + 9).padStart(2, "0")}-${route.slice(1)}`;
      results.push({
        scenario: label,
        ...(await capture(page, dir, name, u, probe)),
      });
    }
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
      `${r.scenario}/${r.name}.png  used=${r.height} needed=${r.needed}${r.capped ? " CAPPED" : ""}  ${bytes} bytes  errors=${r.errors} noise=${r.noise} hidden=${r.hiddenN} inline=${r.inlineN}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);

  // HET NET IS HARD. Pas HIER, nadat elke shot geschoten is: de .txt's staan er dan compleet, dus
  // een rode uitslag komt mét het volledige beeld in plaats van halverwege af te breken. De
  // uitslag is niet te missen — een lijst met vindplaats, treffer en de drie contextregels.
  const noisy = results.filter((r) => r.noise > 0);
  if (noisy.length) {
    const out = [
      "",
      `FLOAT-NET ROOD: ${noisy.reduce((n, r) => n + r.noise, 0)} treffer(s) met 4 of meer decimalen, over ${noisy.length} shot(s).`,
    ];
    for (const r of noisy) {
      for (const h of r.hits) {
        out.push(
          `  ${r.scenario}/${r.name}: ${h.hit}`,
          `      voor:  ${h.prev}`,
          `      regel: ${h.line}`,
          `      na:    ${h.next}`,
        );
      }
    }
    throw new Error(out.join("\n"));
  }
}

main().catch((e) => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
