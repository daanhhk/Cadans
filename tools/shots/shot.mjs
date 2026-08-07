// Headless screenshot harness. Seeds two week shapes into the LOCAL D1 and captures all
// seven day cards per shape, so a visual check needs no deploy.
// Client tooling only: no engine, no migration, no deploy, NEVER --remote.
//
// Run: node tools/shots/shot.mjs   (both dev servers must be up; see README.md)
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
// OUTSIDE out/: that directory is rotated every run, so the pre-seed state would be lost.
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

// ROADMAP punt 31 — EIGEN UITVOERPAD PER MODUS, EN ROTATIE IN PLAATS VAN WISSEN.
//
// DEZE DECLARATIE STAAT HIER EN NIET BOVENAAN, en dat is dwingend: `PROD` wordt hierboven pas
// gezet, dus een const van bovenaf zou een ReferenceError geven.
//
// TWEE DINGEN TEGELIJK. (1) Prod en lokaal schrijven niet langer in hetzelfde pad — een prod-run
// overschreef tot nu toe de lokale uitvoer en andersom, wat precies één keer een prod-nulmeting
// heeft gekost. (2) Een geslaagde run WIST zijn voorganger niet meer maar schuift hem op naar
// `-vorige`, zodat er altijd een nulmeting ligt zonder dat een prompt eraan hoeft te denken.
//
// GROND VOOR (2): een VOOR/NA-vergelijking vroeg tot nu toe dat het PROMPT de nulmeting bewaarde,
// en dat is DRIE keer misgegaan — punt 26, punt 27 en punt 13 fase A, waar de vergelijking al
// onmogelijk was op het moment dat erom werd gevraagd.
//
// ALLEEN EEN COMPLETE RUN SCHUIFT OP, herkenbaar aan `MARKER`. Dat is geen theoretisch geval:
// deze reeks viel twee keer midden in een sweep om (vite stierf stil), en een half gevulde map
// mag een goede nulmeting niet verdringen.
const OUT = join(HERE, PROD ? "out-prod" : "out");
const VORIGE = `${OUT}-vorige`;
const MARKER = "RUN-COMPLEET.json";

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
/**
 * ROADMAP punt 25 — DE CAP IS EEN GRENS, GEEN DOEL.
 *
 * Stond op 4000 en kapte `v7/12-activiteiten` stil af. GEMETEN in de sessie van 07-08-2026: de
 * hoogste `needed` over alle 95 shots is 5882 (dat scherm), de op één na hoogste 2317. Op 8000
 * valt het enige scherm dat in de buurt komt er dus ruim onder, terwijl een pagina die op hol
 * slaat nog steeds tegen een grens loopt. HERKOMST BELEID — er is geen reeks om op te ijken.
 *
 * Sinds punt 25 is overschrijding bovendien een HARDE STOP en geen stille afkapping; zie
 * `capture()`.
 */
const HEIGHT_CAP = 8000;
/** Uit `newContext` getild, zodat de IHDR-controle in `capture()` tegen DEZELFDE schaal toetst
 * als waarmee geschoten wordt. Twee losse 2'en zouden stil uiteen kunnen lopen. */
const DEVICE_SCALE = 2;
/** ROADMAP punt 23 — bovengrens voor de animatie-wacht in `capture()`; grond staat daar. */
const ANIM_TIMEOUT_MS = 5000;

/** BLOK_MIN_BEOORDEELBARE_WEKEN uit apps/web/src/lib/blok.ts — het minimum aantal opbouwweken
 * met een bewaard plan waarop de blok-terugblik nog een uitspraak doet. Hier bewust een LOSSE
 * kopie: de harness is een los script zonder bundler, en de waarde hoort mee te bewegen als de
 * lib hem verhoogt. Loopt hij uiteen, dan zwijgt de kaart op de shots en zie je dat meteen. */
const BEWIJSWEKEN = 2;

/** ROADMAP punt 36 — HET LEESVENSTER DAT EEN SCENARIO TERUGKIJKT, in weken.
 *
 * TWEE BRONNEN, allebei 8, en allebei moeten ze gedekt worden:
 *  - `RECENCY_HORIZON_WEEKS` in `packages/engine/src/planner.ts` — de recency-seed;
 *  - de default `window = 8` van `readRecentWeekplans` in `workers/api/src/db/repo.ts`.
 * Beide lezen `[maandag - 49 dagen .. maandag]`, dus één getal dekt ze allebei.
 *
 * Zelfde grond als bij `BEWIJSWEKEN` hierboven: bewust een LOSSE kopie. De harness is een los
 * script zonder bundler en kan die constanten niet importeren; loopt de waarde uiteen met een van
 * de twee bronnen, dan wist deze harness te weinig en valt de guard hieronder om. */
const LEESVENSTER_WEKEN = 8;

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
  // DOEL-PASSEND (ROADMAP punt 12): doel "Korte beklimmingen" met een vloer van 5 uur, maar
  // slechts 4 GEDECLAREERDE weekuren — strikt eronder, dus de kaart hoort te staan. Blokweek 1,
  // want de vraag valt alleen op een blokgrens.
  //
  // TWEE NEGATIEVE CONTROLES STAAN ER AL: `klim-kort` en `klim-weekstem` dragen hetzelfde doel
  // met weekUren 5 en vallen allebei op blokweek 1. Vloer 5 tegen 5 uur betekent dat de kaart
  // daar NIET hoort te verschijnen — bewegen die shots wel, dan staat de vloer verkeerd om.
  {
    name: "doel-passend",
    doel: "Korte beklimmingen",
    blokWeek: 1,
    weekUren: 4,
    spec: {
      1: { minuten: 60, dagtype: "vrij" },
      3: { minuten: 60, dagtype: "vrij" },
      5: { minuten: 120, dagtype: "weekend" },
    },
  },
  // KLIM-WEEKSTEM (ROADMAP punt 27): het enige scenario dat een KLIM-doel combineert met een
  // dagOffset. Nodig omdat `combo_long_with_efforts` alleen bij een klim-doel vuurt én alleen in
  // Build en Peak — blokweek 1 is Base en kan de sessie dus niet tonen. Vrijdag als "vandaag":
  // ma/di/do zijn verstreken en ONGEREDEN (de harness zaait geen activities), en de zaterdag ligt
  // nog vooruit. Dat is precies de toestand waarin de weekstem sprak terwijl er nog een zaterdag
  // met drempel-minuten stond.
  {
    name: "klim-weekstem",
    doel: "Korte beklimmingen",
    blokWeek: 5,
    dagOffset: 4,
    spec: {
      0: { minuten: 60, dagtype: "vrij" },
      1: { minuten: 60, dagtype: "vrij" },
      3: { minuten: 60, dagtype: "vrij" },
      5: { minuten: 120, dagtype: "weekend" },
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

/**
 * ROADMAP punt 24 — EEN LADENDE PAGINA MAG GEEN GELDIGE SHOT WORDEN.
 *
 * De wacht hieronder bestond al, maar de time-out werd GESLIKT: liep hij af, dan schoot de
 * harness gewoon door en leverde een foto van een half geladen scherm als bewijsmateriaal. Sinds
 * deze wijziging valt het oordeel op de TOESTAND na de bezinktijd, niet op de time-out. De `catch`
 * blijft dus staan en blijft slikken — een pagina die tijdens die 800 ms alsnog opklaart hoort
 * niet om te vallen — maar staat de laadtekst er dan NOG, dan stopt de run.
 *
 * WAAROM ÉÉN STRING VOOR ALLE ROUTES MAG. Alle acht route-componenten renderen byte-identiek
 * dezelfde laadtekst: `Schema.tsx:132`, `Vorm.tsx:93`, `Trainingen.tsx:123`, `Niveau.tsx:164`,
 * `Activiteiten.tsx:58`, `Instellingen.tsx:535`, `Weekplanner.tsx:377` en `Events.tsx:542`. Er is
 * dus een eigenschap die ÉLKE route draagt, en een per-route handlijst van selectors is niet
 * nodig. Sterker: zo'n lijst DRIJFT AF — een nieuwe route wordt vergeten en valt stil buiten de
 * controle, precies het patroon dat `EXTRA_ROUTES` vandaag al heeft (geen mount-assertie).
 *
 * DEZE CONTROLE STOPT GEEN ENKELE GOEDE RUN. GEMETEN op 05-08-2026 over drie volledige sweeps:
 * nul van de 288 `.txt` bevatten de laadtekst (`docs/PUNT31-24-RECON.md` §5). Hij kost dus niets
 * en vangt alleen het geval dat er nu stil doorheen glipt.
 *
 * `.first()` is DRAGEND en geen netheid: zonder dat breekt playwright's strict mode zodra de
 * sub-loader op de Niveau-tab (`components/niveau/Rijdersprofiel.tsx:331`) meematcht.
 */
async function settle(page, label) {
  await page.waitForSelector("#root > *", { state: "visible", timeout: 60000 });
  const loader = page.getByText("Laden…").first();
  try {
    await loader.waitFor({ state: "hidden", timeout: 15000 });
  } catch {
    // No loader, or it never cleared — not fatal, the shot still tells us why.
  }
  await page.waitForTimeout(800);
  if (await loader.isVisible()) {
    throw new Error(
      `${label}: still loading after settle — the page never finished; a shot here would be a photo of a spinner`,
    );
  }
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

/**
 * ROADMAP punt 23 — WACHT DE ANIMATIES UIT, VLAK VOOR DE SLUITER.
 *
 * Geeft het aantal animaties terug dat op dat moment LIEP, en wacht tot er nul over zijn.
 *
 * HIER EN NIET IN settle(): een viewport-wijziging kan zelf een transitie opnieuw aanzetten, dus
 * een wacht die daarvóór valt meet de verkeerde toestand. En dit is het smalste punt waar ELKE
 * shot onderdoor gaat — de zeven dagshots roepen `settle` niet aan.
 *
 * DE BOVENGRENS IS BELEID EN GEEN GEIJKTE DREMPEL: er valt niets te bemonsteren. De app draagt 0
 * `@keyframes` en 0 `infinite`, en de langst bekende transitie is 1,1 s met 250 ms aanloop
 * (`ProgressRing.tsx`), dus 5000 ms laat die er ruim onder vallen.
 *
 * LOOPT DE GRENS AF, DAN GOOIT HIJ. Een wacht die stil doorloopt levert precies het artefact dat
 * dit punt moest wegnemen: een shot die er goed uitziet en toch per run verschilt.
 */
async function waitForAnimations(page, label) {
  const lopend = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running" || a.playState === "pending")
          .length,
    );

  const gemeten = await lopend();
  if (gemeten === 0) return 0;

  const deadline = Date.now() + ANIM_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await lopend()) === 0) return gemeten;
    await page.waitForTimeout(50);
  }

  const rest = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running" || a.playState === "pending")
      .map((a) => a.transitionProperty ?? a.animationName ?? "(onbekend)"),
  );
  throw new Error(
    `${label}: ${rest.length} animatie(s) lopen na ${ANIM_TIMEOUT_MS} ms nog — ` +
      `getroffen eigenschap(pen): ${rest.join(", ")}. Een shot hier verschilt per run.`,
  );
}

/**
 * ROADMAP punt 25 — LEES DE IHDR VAN DE GESCHREVEN PNG TERUG.
 *
 * Een PNG opent met 8 handtekening-bytes, dan de chunk-lengte en het type `IHDR` (byte 8 tot en
 * met 15), en dán pas de afmetingen: breedte op 16 tot en met 19, hoogte op 20 tot en met 23,
 * big-endian. Zo komt een afkapping door de BROWSER er ook niet doorheen — de harness-kant
 * bewaakt `HEIGHT_CAP` al, maar niets bewaakte tot nu toe wat er werkelijk op schijf kwam.
 */
function assertPngSize(png, label, verwachtB, verwachtH) {
  const kop = readFileSync(png).subarray(0, 24);
  const breedte = kop.readUInt32BE(16);
  const hoogte = kop.readUInt32BE(20);
  if (breedte !== verwachtB || hoogte !== verwachtH) {
    throw new Error(
      `${label}: de geschreven PNG meet ${breedte}x${hoogte} terwijl ` +
        `${verwachtB}x${verwachtH} verwacht was. De shot liegt over het scherm.`,
    );
  }
}

async function capture(page, dir, name, url, probe) {
  let height = VIEWPORT_H;
  const needed = await contentHeight(page);
  // ROADMAP punt 25 — EEN GEKAPTE SHOT IS EEN HARDE STOP. Stil afkappen was het eigenlijke
  // defect: de PNG liegt dan over het scherm en leest bij een vergelijking als "ongewijzigd".
  if (needed > HEIGHT_CAP) {
    throw new Error(
      `${name}: de pagina vraagt ${needed} px en HEIGHT_CAP staat op ${HEIGHT_CAP} px. ` +
        "Een gekapte shot toont niet het scherm; verhoog de cap of splits het scherm.",
    );
  }
  if (needed > VIEWPORT_H) {
    // Geen `Math.min` meer: de poort hierboven garandeert al dat `needed` onder de cap ligt.
    height = needed;
    await page.setViewportSize({ width: VIEWPORT_W, height });
    await page.waitForTimeout(200);
  }

  const anim = await waitForAnimations(page, name);

  const png = join(dir, `${name}.png`);
  await page.screenshot({ path: png });
  assertPngSize(png, name, VIEWPORT_W * DEVICE_SCALE, height * DEVICE_SCALE);

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
      `viewport: ${VIEWPORT_W}x${height} (needed ${needed})`,
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
    anim,
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
      // DE WEEKUREN PER SCENARIO (ROADMAP punt 12). Zelfde mechaniek als `doel` hierboven:
      // weggelaten → de gezaaide waarde (5) blijft staan, dus de bestaande scenario's zijn
      // byte-identiek. Nodig omdat de doel-passendheid-kaart op de GEDECLAREERDE uren poort.
      const weekUren = scenario.weekUren ?? seededSettings.weekUren;
      await apiPut("/api/settings", {
        ...seededSettings,
        doelStart,
        doel,
        weekUren,
      });
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

    // ── ROADMAP punt 36 — ELK SCENARIO WIST EERST ZIJN EIGEN LEESVENSTER ─────────────────────
    //
    // HET DEFECT. De elf scenario's doen samen 33 weekplan-schrijfacties op 7 UNIEKE
    // week-sleutels; week 2026-07-13 wordt door 10 van de 11 geschreven, elk met een ander doel,
    // andere plannerdagen of een andere blokweek. `weekplans` heeft `(user_id, week_monday)` als
    // sleutel, dus elke schrijver overschrijft zijn voorganger — en het volgende scenario leest
    // via de recency-seed en de blokpoort terug wat een ander achterliet. De shots hingen daarmee
    // aan de VOLGORDE van de scenario-lus.
    //
    // WAAROM DE OUDE TOETS NIET MEER DISCRIMINEERT. De gedeelde toestand CONVERGEERT naar een
    // vast punt: na genoeg sweeps schrijft elk scenario precies terug wat er al stond, en dan is
    // het defect onzichtbaar. GEMETEN: de weekplan-tabel stond op n=9 en 40061 tekens en bewoog
    // over vier sweeps geen byte, waarna de drie-cycli-toets uit ROADMAP punt 36 groen gaf op
    // ONGEWIJZIGDE code. De VOLGORDE-toets neemt zijn plaats in en is wél scherp: alleen de
    // lus-volgorde omdraaien liet 16 van de 93 vergeleken shots bewegen — heel `v2` en heel `v4`.
    //
    // WAAROM WISSEN EN NIET EIGEN WEEK-SLEUTELS. Acht weken leesvenster maal elf scenario's is
    // tachtig weken spreiding. Die botst VOORUIT op de acht-wekengrens van het A-event — dan
    // neemt de event-as de periodisering over en meet het scenario iets anders — en ACHTERUIT op
    // Daans echte ritdata, terwijl de verstreken-dag-scenario's die weken juist ONGEREDEN nodig
    // hebben. Wissen houdt elk scenario op zijn eigen maandag staan en kost die spreiding niet.
    //
    // DE PLANNER-TABEL WORDT BEWUST NIET GEWIST: die wordt alleen voor de BEKEKEN week gelezen,
    // niet over een venster, dus daar bestaat de koppeling niet.
    for (
      let m = plusDays(blokStart, -7 * (LEESVENSTER_WEKEN - 1));
      m <= wkMonday;
      m = plusDays(m, 7)
    ) {
      // Kale full-replace: een LEGE entries-array draagt geen enkele entry, en is daarmee voor de
      // recency-seed én voor de blokpoort gelijk aan een ONTBREKENDE rij. Geen `todayISO`, want
      // dit is geen bevriezing maar een wis.
      await apiPut(`/api/weekplan/${m}`, { entries: [] });
    }

    // DE GUARD. Zonder deze twee is de wis-lus een aanname: hij zou stil te weinig weken kunnen
    // dekken zodra `LEESVENSTER_WEKEN` uit de pas loopt met een van zijn twee bronnen. Beide
    // uiteinden van het venster worden getoetst, want het leest vanaf `blokStart` én vanaf
    // `wkMonday`.
    for (const anker of [wkMonday, blokStart]) {
      const rest = await apiGet(`/api/weekplans/recent?monday=${anker}`);
      const n = Array.isArray(rest) ? rest.length : -1;
      if (n !== 0) {
        throw new Error(
          `${label}: leesvenster niet leeg na wissen — maandag ${anker} draagt ${n} entries`,
        );
      }
    }

    for (let i = 0; i < BEWIJSWEKEN; i++) {
      const m = plusDays(blokStart, i * 7);
      await apiPut(`/api/planner/${m}`, {
        days: plannerDays(m, scenario.spec),
      });
      await page.clock.setFixedTime(new Date(`${m}T08:00:00`));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page, `${label} bewijsweek ${m}`);
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
      await settle(page, `${label} warmloop dagOffset ${offset}`);
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
  await settle(page, `${label} weekscherm`);
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
      await settle(page, `${label} route ${route}`);
      const name = `${String(i + 9).padStart(2, "0")}-${route.slice(1)}`;
      results.push({
        scenario: label,
        ...(await capture(page, dir, name, u, probe)),
      });
    }

    // ROADMAP punt 22 — DE RIT-SHEET WAS VOOR GEEN ENKELE DOM-INGREEP BEREIKBAAR.
    //
    // Hij opent alleen na een KLIK op een activiteitenrij, dus geen enkele shot toonde hem ooit.
    // Staat NA de EXTRA_ROUTES-lus en nooit ervoor: alle bestaande shots moeten geschoten zijn
    // voordat er weg genavigeerd wordt, anders is de byte-vergelijking tegen een vorige run
    // waardeloos.
    await page.setViewportSize({ width: VIEWPORT_W, height: VIEWPORT_H });
    probe.reset();
    const ritUrl = `${WEB}/activiteiten`;
    await page.goto(ritUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page, `${label} ritdetail (voor de klik)`);

    // VOORAF: de sheet mag er nog NIET staan, anders bewijst de klik erna niets.
    const sluitenVoor = await page.locator('[aria-label="Sluiten"]').count();
    if (sluitenVoor !== 0) {
      throw new Error(
        `${label} ritdetail: vóór de klik staan er al ${sluitenVoor} element(en) met ` +
          'aria-label "Sluiten" — de sheet is dan niet door DEZE klik geopend.',
      );
    }

    // DE SELECTOR. Elke tikbare rij is een `<button>` met de inline `cardStyle` uit
    // `Activiteiten.tsx:179`, en `flex-direction: column` staat daar wél en op "Meer laden"
    // (`RETRY_BTN`) en op de app-navigatie niet. GEMETEN op 07-08-2026: 50 treffers tegenover
    // 51 buttons in het document — precies "Meer laden" valt af.
    const rijen = page.locator('main button[style*="flex-direction: column"]');
    const nRijen = await rijen.count();
    if (nRijen < 2) {
      throw new Error(
        `${label} ritdetail: ${nRijen} tikbare rij(en) gevonden op ${ritUrl}; ` +
          "er horen er tientallen te staan, dus de selector of de zaai klopt niet.",
      );
    }
    await rijen.first().click();
    // De sheet toont eerst "Ritdetails laden…", en die tekst matcht de laad-poort van punt 24 —
    // `settle` wacht hem dus uit.
    await settle(page, `${label} ritdetail (na de klik)`);

    // NA, DEEL a: de sheet staat op het scherm. Het EXACTE aantal is bewust GEEN eis — dat is
    // decoratie. `RideDetailSheet` draagt er vandaag twee (de scrim op regel 104 en de sluitknop
    // op 143) en dat mag veranderen zonder dat deze shot iets anders bewijst. Het label is uniek
    // op PAGINA-niveau en niet op element-niveau: `WorkoutPickerSheet` en `CheckinSheet` dragen
    // het ook, maar staan niet op /activiteiten.
    const sluitenNa = await page.locator('[aria-label="Sluiten"]').count();
    if (sluitenNa === 0) {
      throw new Error(
        `${label} ritdetail: na de klik staat er GEEN element met aria-label "Sluiten" — ` +
          "de klik heeft de sheet niet geopend.",
      );
    }

    // NA, DEEL b: hij staat op de READY-tak en niet op laden of fout. `fase.s` kent precies drie
    // uitputtende en elkaar uitsluitende takken — loading op `RideDetailSheet.tsx:163`, error op
    // `:177`, ready op `:194`. Staat de sheet aantoonbaar op het scherm via deel a, en zijn deze
    // twee teksten weg, dan is hij per constructie ready. ZONDER DEZE HELFT haalt een sheet die
    // opent maar waarvan de fetch faalt de assertie even goed, en fotografeer je een FOUTKAART
    // als bewijs.
    const zichtbaar = await page.evaluate(() => document.body.innerText);
    for (const verboden of [
      "Ritdetails laden…",
      "Ritdetails konden niet geladen worden.",
    ]) {
      if (zichtbaar.includes(verboden)) {
        throw new Error(
          `${label} ritdetail: de sheet toont "${verboden}" — dat is de laad- of de fouttak, ` +
            `niet de ready-tak. Aangetroffen ${sluitenNa} sluitknop(pen).`,
        );
      }
    }

    results.push({
      scenario: label,
      ...(await capture(page, dir, "16-ritdetail", ritUrl, probe)),
    });
    // De sheet blijft open; het volgende scenario begint met een verse `goto`.
  }
  probe.off();
}

/**
 * ROADMAP punt 29 — DE ROUTES DIE DE REPO VERWACHT.
 *
 * Getrokken uit `workers/api/src/routes/api.ts` zelf, niet uit een handlijst: een lijst die je
 * bijhoudt loopt uit de pas met de routes die er staan, en dan bewaakt de controle iets anders dan
 * ze belooft. Paden met een DUBBELE PUNT vallen af — die dragen een parameter, en een probe zou er
 * een willekeurige waarde voor moeten verzinnen.
 *
 * LEEG IS EEN FOUT, GEEN UITKOMST: dan is het bestand verplaatst of hernoemd en meet de controle
 * stil niets meer. Dat is precies het faalpatroon dat dit punt afdekt, dus hij gooit.
 */
function expectedApiRoutes() {
  const bron = join(
    HERE,
    "..",
    "..",
    "workers",
    "api",
    "src",
    "routes",
    "api.ts",
  );
  const tekst = readFileSync(bron, "utf8");
  const uit = new Set();
  for (const m of tekst.matchAll(/api\.get\("(\/[^"]*)"/g)) {
    const pad = m[1];
    if (pad.indexOf(":") >= 0) continue; // parameter-route, niet te probben
    uit.add(pad);
  }
  if (uit.size === 0) {
    throw new Error(
      `expectedApiRoutes: geen enkele route gevonden in ${bron} — is het bestand verplaatst? ` +
        "Een lege lijst zou de controle stil uitzetten.",
    );
  }
  return [...uit].sort();
}

/**
 * Probeert elk pad met één GET en classificeert in drie bakken.
 *
 * ALLEEN 404 TELT ALS MISSING, en dat is de kern. Hono antwoordt 404 op een niet-geregistreerd
 * `/api/`-pad (`workers/api/src/index.ts:61`), terwijl een BESTAANDE route die over een ontbrekende
 * query klaagt 400 geeft (`/weekplans/recent`) en een integratiefout 502. Elke andere status is dus
 * bewijs dat de route BESTAAT.
 *
 * EEN TIMEOUT TELT NIET ALS MISSING maar als `unknown`. Een vals STOP blokkeert legitiem werk; een
 * gemiste detectie laat ons waar we vandaag al staan. De asymmetrie is opzet.
 */
async function probeRoutes(paths) {
  const present = [];
  const missing = [];
  const unknown = [];
  for (const pad of paths) {
    try {
      const r = await fetch(`${API}/api${pad}`, {
        headers: AUTH_HEADERS,
        signal: AbortSignal.timeout(5000),
      });
      (r.status === 404 ? missing : present).push(pad);
    } catch {
      unknown.push(pad);
    }
  }
  return { present, missing, unknown };
}

/**
 * ROADMAP punt 37 — LEEFT DIT ORIGIN NOG?
 *
 * EEN fetch, geen lus: dit is geen preflight die op iets wacht, maar een POSTMORTEM op een
 * origin dat al zou moeten draaien. `waitFor` hierboven pollt juist wél, en dat is precies het
 * verschil — hier is wachten misleidend, want een server die pas na tien seconden antwoordt was
 * op het moment van de fout dood.
 *
 * ELK antwoord telt als LEVEND, ook 401, 404 en 500: dan staat er een proces dat praat. Alleen
 * een gegooide of afgelopen fetch is "geen antwoord". Zelfde asymmetrie als in `waitFor`, waar
 * een 401 op een gated origin geen uitval is.
 *
 * Gooit zelf nooit — een diagnose die zelf omvalt maakt de oorspronkelijke fout onleesbaar.
 */
async function originAnswers(url, headers) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000), headers });
    return `HTTP ${r.status}`;
  } catch {
    return null;
  }
}

/**
 * ROADMAP punt 37 — HET ETIKET, NIET DE GRONDOORZAAK.
 *
 * Geeft een Error TERUG en gooit niet: de aanroeper doet de throw, zodat de stack op de plek van
 * het defect blijft staan.
 *
 * Antwoorden BEIDE origins, dan is de fout inhoudelijk en gaat `err` ONGEWIJZIGD terug — dezelfde
 * Error, dezelfde message. Een diagnose die ook bij een echte app-fout een eigen tekst plakt zou
 * hetzelfde defect maken dat dit punt repareert, alleen andersom.
 */
async function classifyFailure(err) {
  const webUrl = WEB;
  const apiUrl = `${API}/api/settings`;
  const [web, api] = await Promise.all([
    originAnswers(webUrl, AUTH_HEADERS),
    originAnswers(apiUrl, AUTH_HEADERS),
  ]);
  if (web && api) return err;

  const oorspronkelijk = err?.message ? err.message : String(err);
  const slot = PROD
    ? `De tot hier geschoten shots bewijzen NIETS over de bouw. Toets eerst of ${TARGET} antwoordt en herhaal daarna de hele run; er is hier geen dev-server om te herstarten.`
    : "De tot hier geschoten shots bewijzen NIETS over de bouw. Herstart de dev-servers en herhaal de hele run.";

  return new Error(
    "INFRASTRUCTUUR-UITVAL — de harness is gestopt omdat een origin niet meer antwoordt, " +
      "niet omdat de app iets fout doet. Dit is GEEN app-defect.\n" +
      `  web ${webUrl}: ${web ?? "geen antwoord"}\n` +
      `  api ${apiUrl}: ${api ?? "geen antwoord"}\n` +
      `oorspronkelijke melding: ${oorspronkelijk}\n` +
      slot,
  );
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

  // ROADMAP punt 29 — HOORT DE DRAAIENDE WORKER BIJ DEZE REPO?
  // STAAT BEWUST VÓÓR DE rmSync HIERONDER: stopt hij, dan blijft de uitvoer van de VORIGE run
  // staan. De harness heeft één uitvoerpad voor lokaal en prod en leegt dat bij elke run, dus
  // een STOP ná de wipe zou de vorige meting alsnog vernietigen.
  const verwacht = expectedApiRoutes();
  const probe = await probeRoutes(verwacht);
  process.stdout.write(
    `routes: ${verwacht.length} expected, ${probe.present.length} present, ` +
      `${probe.missing.length} missing, ${probe.unknown.length} unknown` +
      (probe.missing.length ? ` — missing: ${probe.missing.join(", ")}` : "") +
      (probe.unknown.length ? ` — unknown: ${probe.unknown.join(", ")}` : "") +
      "\n",
  );
  // PROD GOOIT NOOIT. Een VOOR-meting tegen prod van vóór een deploy is legitiem — dan HÓÓRT de
  // repo routes te dragen die prod nog niet kent.
  if (!PROD && probe.missing.length) {
    throw new Error(
      `de draaiende wrangler dev op ${API} is OUDER dan de repo: ` +
        `${probe.missing.join(", ")} ${probe.missing.length === 1 ? "bestaat" : "bestaan"} ` +
        "daar niet. Herstart hem voor je schiet — anders fotografeer je een app die op een " +
        "404 valt, en leest dat als een defect van je bouw.",
    );
  }

  // Never let a stale shot pass for a fresh one — maar WISSEN is niet meer de manier.
  //
  // ROADMAP punt 31 — ROTATIE. Droeg de vorige run de MARKER, dan was hij COMPLEET en schuift hij
  // op naar `-vorige`; droeg hij hem niet, dan was hij afgebroken en gaat hij weg. Zo ligt er na
  // elke geslaagde run vanzelf een nulmeting klaar, zonder dat een prompt eraan hoeft te denken,
  // en verdringt een half gevulde map nooit een goede.
  if (existsSync(join(OUT, MARKER))) {
    rmSync(VORIGE, { recursive: true, force: true });
    renameSync(OUT, VORIGE);
  } else {
    rmSync(OUT, { recursive: true, force: true });
  }
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
      deviceScaleFactor: DEVICE_SCALE,
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
    // ROADMAP punt 37 — DE POORT. Het defect is het ETIKET, niet de uitval zelf: sterft de vite
    // dev-server halverwege een sweep, dan valt de eerstvolgende `goto` om op een timeout of komt
    // `settle` nooit voorbij `Laden…`, en de harness meldt dat als een INHOUDELIJK defect. Vijf
    // keer gebeurd, en één keer op een shot-label — dan leest een infrastructuur-uitval als een
    // regressie in de bouw. De grondoorzaak blijft open; het liegen niet.
    //
    // HIER EN NIET IN settle(): dit is het smalste punt waar ALLE vijf de netwerk-rakende stappen
    // van een sweep onderdoor gaan — de `goto`, de `settle`, de dagstrip-telling, de
    // leesvenster-guard en de eigen `apiPut`-aanroepen. Een poort in `settle` zou de andere vier
    // missen, en vijf poorten zouden vijf plekken zijn om te vergeten.
    //
    // DE ZAAI IN main() BLIJFT ERBUITEN, en dat is geen slordigheid: die praat uitsluitend met
    // 8787 en raakt vite nooit, dus voor dit defect is hij per constructie onbereikbaar. Valt de
    // worker daar weg, dan meldt `apiPut` dat al met status en pad.
  } catch (e) {
    throw await classifyFailure(e);
  } finally {
    await browser.close();
  }

  const lines = [
    // ROADMAP punt 31 — de paden bij NAAM, als eerste regel. Een vergelijking hoeft dan nooit te
    // raden waar de vorige run staat, en het verschil tussen de lokale en de prod-map is meteen
    // zichtbaar in plaats van af te leiden uit het argument.
    `uitvoer: ${OUT}${existsSync(VORIGE) ? `  vorige COMPLETE run: ${VORIGE}` : "  vorige: (nog geen complete run)"}`,
    PROD
      ? `target: ${WEB}  READ-ONLY, clock ${PINNED}, basic-auth as "${AUTH_USER}" (password supplied, not shown)`
      : `monday: ${monday}  clock: ${PINNED}  events: ${eventsState}`,
  ];
  for (const r of results) {
    const bytes = statSync(r.png).size;
    lines.push(
      `${r.scenario}/${r.name}.png  used=${r.height} needed=${r.needed} anim=${r.anim}  ${bytes} bytes  errors=${r.errors} noise=${r.noise} hidden=${r.hiddenN} inline=${r.inlineN}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);

  // ROADMAP punt 31 — DE MARKER, als LAATSTE handeling van een geslaagde run.
  //
  // Hij staat VÓÓR de float-net-controle hieronder, en dat is een besluit: een run die op het net
  // ROOD valt is wél COMPLEET — elke shot is geschoten en elke .txt staat er — dus hij mag als
  // nulmeting opschuiven. Wat NIET mag opschuiven is een run die halverwege omviel, en die
  // bereikt deze regel per constructie niet.
  writeFileSync(
    join(OUT, MARKER),
    `${JSON.stringify(
      {
        modus: PROD ? "prod" : "lokaal",
        doel: WEB,
        klok: PINNED,
        shots: results.length,
        tijdstempel: new Date().toISOString(),
      },
      null,
      1,
    )}\n`,
  );

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
