#!/usr/bin/env node
// ROADMAP PUNT 16 — HET MEETINSTRUMENT.
//
// Een HERHAALBAAR instrument voor de plan-en-oordeel-keten, zodat een volgende ronde geen
// wegwerp-opstelling meer bouwt. Dit script draait NIET in de vitest-suite: het bundelt de
// client-laag met esbuild naar een tijdelijk pad BUITEN de repo-tree en draait die bundel.
//
// DRIE UITVOEREN, elk met teller EN noemer:
//   (a) IJKING        — de weekvorm-as opnieuw gedraaid tegen de gepinde reeks. 21 waarden.
//   (b) NULMETING     — 5 doelen x 7 weekvormen x 3 macrofasen = 105 blok-cellen.
//   (c) VULDAG-DEKKING — hoeveel cellen een vuldag dragen, en wat er naast ligt.
//
// TWEE PARAMETERS staan klaar voor de vervolgronde en staan hier op hun NEUTRALE stand:
//   --prikkel=<min>@<pctLo>-<pctHi>   blokken die aan de vuldag worden toegevoegd (default: geen)
//   --anaeroob=<factor>               schaal op UITSLUITEND de anaerobe zoneminuten (default 1)
// De schaal raakt bewust alleen Z5. Alles schalen meet een globaal tekort in plaats van de
// anaerobe poort, en dan meet je de verkeerde grootheid.
//
// Draaien:  node tools/punt16/meet.mjs
// Opties:   --json   machineleesbare dump op stdout in plaats van het leesbare rapport

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const LIB = join(REPO, "apps", "web", "src", "lib");

// ── TZ ───────────────────────────────────────────────────────────────────────────────────────
// Het root-script `pnpm test` pint TZ via cross-env; dit script draait daarbuiten en pint hem
// dus zelf. Zonder pin verschuiven de dagranden en meet je de tijdzone van de machine.
if (process.env.TZ !== "Europe/Amsterdam") {
  process.env.TZ = "Europe/Amsterdam";
  const r = execFileSync(
    process.execPath,
    [fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      env: { ...process.env, TZ: "Europe/Amsterdam" },
      stdio: "inherit",
    },
  );
  void r;
  process.exit(0);
}

// ── ARGUMENTEN ───────────────────────────────────────────────────────────────────────────────
const ARGS = process.argv.slice(2);
const argVal = (naam) => {
  const p = ARGS.find((a) => a.startsWith(`--${naam}=`));
  return p ? p.slice(naam.length + 3) : null;
};
const ALS_JSON = ARGS.includes("--json");

const ANAEROOB_SCHAAL = Number(argVal("anaeroob") ?? "1") || 1;

// ROADMAP punt 16 — de MATERIALITEITSVLOER in plan-minuten. Weggelaten → de constante uit
// `apps/web/src/lib/blok.ts`. `--materialiteit=0` moet expliciet 0 kunnen zetten, dus geen `||`.
const _mat = argVal("materialiteit");
const MATERIALITEIT = _mat == null ? undefined : Number(_mat);
// `--n-ijking` draait de hele as in één run en print alleen de vier getallen per N.
const N_IJKING = ARGS.includes("--n-ijking");
// De ACTIEVE anaerobe schaal. Mutabel omdat de N-ijking hem per doorloop verzet; buiten die modus
// staat hij op de waarde van `--anaeroob` en beweegt hij niet.
let SCHAAL_NU = ANAEROOB_SCHAAL;

/** `--prikkel=8@105-120` → één blok van 8 minuten op 105-120 %FTP. Leeg = geen prikkel. */
function parsePrikkel(spec) {
  if (!spec) return [];
  return spec.split(",").map((deel) => {
    const m = /^(\d+(?:\.\d+)?)@(\d+)-(\d+)$/.exec(deel.trim());
    if (!m)
      throw new Error(
        `prikkel-spec onleesbaar: ${deel} (verwacht <min>@<pctLo>-<pctHi>)`,
      );
    return { minuten: Number(m[1]), pctLo: Number(m[2]), pctHi: Number(m[3]) };
  });
}
const PRIKKEL = parsePrikkel(argVal("prikkel"));

// ── DE KLOK IS EEN PROXY OP DE ECHTE CONSTRUCTOR, NOOIT EEN SUBCLASS ─────────────────────────
// Een subclass breekt `x instanceof Date` voor elk Date-object dat BUITEN de stub is gemaakt, en
// dan meet het instrument stil iets anders: `derivePlannerGedaan` herkent dan geen enkele rit.
// De proxy laat `instanceof` intact.
const RealDate = Date;
let NOW = RealDate.now();
globalThis.Date = new Proxy(RealDate, {
  construct(t, args) {
    return args.length === 0 ? new t(NOW) : new t(...args);
  },
  get(t, p, r) {
    return p === "now" ? () => NOW : Reflect.get(t, p, r);
  },
});
const setNow = (d) => {
  NOW = d instanceof RealDate ? d.getTime() : Number(d);
};

// ── DE BUNDEL ────────────────────────────────────────────────────────────────────────────────
// esbuild draait op de BRON, niet op een dist: `packages/engine` exporteert via zijn
// exports-map naar `src/index.ts`, en dit script gebruikt dezelfde ingang.
const esbuild = await import("esbuild");
const OUT = join(mkdtempSync(join(tmpdir(), "punt16-")), "lib.mjs");

await esbuild.build({
  stdin: {
    // NAMESPACE-re-exports, geen `export *`: de vijf modules dragen overlappende namen en een
    // platte ster zou er stilzwijgend een van weglaten.
    contents: [
      'export * as proposal from "./proposal";',
      'export * as blok from "./blok";',
      'export * as weekplanBlob from "./weekplanBlob";',
      'export * as zonemunt from "./zonemunt";',
      'export * as zonelabels from "./zonelabels";',
    ].join("\n"),
    resolveDir: LIB,
    loader: "ts",
    sourcefile: "punt16-entry.ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile: OUT,
  alias: {
    "@cadans/engine": join(REPO, "packages", "engine", "src", "index.ts"),
    "@cadans/shared": join(REPO, "packages", "shared", "src", "index.ts"),
  },
  logLevel: "warning",
});

const LIBMOD = await import(pathToFileURL(OUT).href);
const { buildWeekProposal } = LIBMOD.proposal;
const { buildBlokReferent, blokUitvoering } = LIBMOD.blok;
const { buildWeekplanEntries } = LIBMOD.weekplanBlob;
const { planZone5_, ZONE5_GRENZEN_DEFAULT } = LIBMOD.zonemunt;
const { werkzoneLabelsVan_ } = LIBMOD.zonelabels;

// ── DE FIXTURE ───────────────────────────────────────────────────────────────────────────────
// OVERGENOMEN UIT `apps/web/src/lib/weekvormAs.test.ts` — de vaste meetlat van docs/ROADMAP.md.
// Niet verzonnen en niet uit een prompt overgeschreven. De zelfcontrole hieronder leest de
// gepinde reeks TERUG uit dat bestand en stopt als hij is verschoven; zo kan deze kopie niet
// stil uit de pas lopen met zijn bron.
const MAANDAG = new RealDate(2026, 6, 27, 8, 0, 0); // 2026-07-27, ma
const iso = (n) => {
  const d = new RealDate(2026, 6, 27 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const schuif_ = (maandag, n) => {
  const [y, m, d] = maandag.split("-").map(Number);
  const dt = new RealDate(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const settings = (pendelDuurMin, doel = "FTP", doelStart = "2026-06-29") => ({
  ftp: 280,
  lthr: null,
  gewicht: 75,
  doel,
  doelStart,
  hrMax: null,
  hrRest: null,
  doelDuur: null,
  fase: null,
  profielPreset: null,
  pendelDuurMin,
  pendelAantal: 2,
});

const plannerDays = (min, pendel, maandag) =>
  [0, 1, 2, 3, 4, 5, 6].map((n) => ({
    datum: schuif_(maandag, n),
    train: min[n] != null,
    dag: null,
    minuten: min[n] ?? 0,
    dagtype:
      min[n] == null
        ? null
        : pendel.indexOf(n) >= 0
          ? "pendel"
          : n === 5 || n === 6
            ? "weekend"
            : "vrij",
    toelichting: null,
    voorgesteldType: null,
    gedaan: false,
  }));

const VORMEN = [
  {
    naam: "V1 5,0u ma60 di60 do60 za120",
    min: { 0: 60, 1: 60, 3: 60, 5: 120 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V2 8,0u ma90 di90 do90 za210",
    min: { 0: 90, 1: 90, 3: 90, 5: 210 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V3 8,0u ma70 di70 do70 za180 zo90",
    min: { 0: 70, 1: 70, 3: 70, 5: 180, 6: 90 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V4 7,0u ma60 di60 do60 za240",
    min: { 0: 60, 1: 60, 3: 60, 5: 240 },
    pendel: [],
    pendelDuurMin: 80,
  },
  {
    naam: "V5 7,0u ma60 za120 + 3 pendeldagen 80",
    min: { 0: 60, 1: 80, 2: 80, 3: 80, 5: 120 },
    pendel: [1, 2, 3],
    pendelDuurMin: 40,
  },
  {
    naam: "V6 in uitvoering, gemiste maandag (di) ma60 di60 do60 za120",
    min: { 0: 60, 1: 60, 3: 60, 5: 120 },
    pendel: [],
    pendelDuurMin: 80,
    dagOffset: 1,
  },
  {
    naam: "V7 di60 vr90 za180 zo120",
    min: { 1: 60, 4: 90, 5: 180, 6: 120 },
    pendel: [],
    pendelDuurMin: 80,
  },
];

const VERWACHT = {
  kwal: [93, 113, 113, 105, 84, 93, 90],
  tss: [268, 410, 464, 362, 352, 227, 375],
  dagen: [3, 3, 3, 3, 3, 3, 3],
};

// ZELFCONTROLE OP DE BRON. Een gepinde reeks in een tweede bestand loopt uit de pas zodra de
// eerste wordt herijkt, en dat merk je pas als het instrument al conclusies heeft gedragen.
(function toetsBron() {
  const bron = readFileSync(join(LIB, "weekvormAs.test.ts"), "utf8");
  for (const sleutel of ["kwal", "tss", "dagen"]) {
    const m = new RegExp(`${sleutel}:\\s*\\[([^\\]]*)\\]`).exec(bron);
    if (!m)
      throw new Error(`weekvormAs.test.ts: reeks \`${sleutel}\` niet gevonden`);
    const uitBron = m[1].split(",").map((s) => Number(s.trim()));
    const hier = VERWACHT[sleutel];
    if (
      uitBron.length !== hier.length ||
      uitBron.some((v, i) => v !== hier[i])
    ) {
      throw new Error(
        `weekvormAs.test.ts is herijkt en dit script niet: \`${sleutel}\` staat daar op [${uitBron}] en hier op [${hier}]. Neem de nieuwe reeks over voordat je meet.`,
      );
    }
  }
})();

// ── DE MEETAS, GESCHEIDEN VAN DE IJKAS ───────────────────────────────────────────────────────
// `VORMEN` hierboven is het IJKPUNT en blijft ONGEWIJZIGD: zijn gepinde reeks hoort bij precies
// die zeven vormen, en de zelfcontrole hierboven bewaakt dat. Meten doe je op een EIGEN as.
//
// V6 valt af: die is qua dagen identiek aan V1 en verschilt alleen in welke dag "vandaag" is.
// Voor een blok dat volledig vooruit ligt voegt dat niets toe.
// WINTER komt erbij, OVERGENOMEN UIT `docs/PUNT16-RECON.md` §1(e): ma45 di60 do60, geen
// pendeldagen. Die vorm ligt als enige ONDER de vijf-uursdrempel die `urenPrikkels` stuurt
// (`PRIKKEL_UREN_DREMPEL = 5`), en juist daar ligt de vuldag ingeklemd tussen twee
// kwaliteitsdagen.
const WINTER = {
  naam: "WINTER 2,75u ma45 di60 do60",
  min: { 0: 45, 1: 60, 3: 60 },
  pendel: [],
  pendelDuurMin: 80,
};
const MEETAS = [
  ...["V1", "V2", "V3", "V4", "V5", "V7"].map((k) => {
    const v = VORMEN.find((x) => x.naam.startsWith(`${k} `));
    if (!v) throw new Error(`weekvorm ${k} niet gevonden in de ijkas`);
    return v;
  }),
  WINTER,
];

// ── DE ACTIVITEIT ────────────────────────────────────────────────────────────────────────────
// Rij van 17 velden, de vorm uit `punt15.test.ts`: idx0 Date, idx1 "Ride", idx3 duur in minuten,
// idx15 de zone-JSON Z1..Z5 in SECONDEN.
function ritMet_(datumISO, z) {
  const [y, m, d] = datumISO.split("-").map(Number);
  const row = new Array(17).fill(null);
  row[0] = new RealDate(y, m - 1, d, 9, 0, 0);
  row[1] = "Ride";
  const anaeroob = (Number(z.anaeroob) || 0) * SCHAAL_NU;
  const delen = {
    rust: Number(z.rust) || 0,
    z2: Number(z.z2) || 0,
    tempo: Number(z.tempo) || 0,
    drempel: Number(z.drempel) || 0,
    anaeroob,
  };
  row[3] = Object.values(delen).reduce((a, b) => a + b, 0);
  row[15] = JSON.stringify([
    { id: "Z1", secs: Math.round(delen.rust * 60) },
    { id: "Z2", secs: Math.round(delen.z2 * 60) },
    { id: "Z3", secs: Math.round(delen.tempo * 60) },
    { id: "Z4", secs: Math.round(delen.drempel * 60) },
    { id: "Z5", secs: Math.round(delen.anaeroob * 60) },
  ]);
  return row;
}

// ── (a) IJKING ───────────────────────────────────────────────────────────────────────────────
function meetVorm(v) {
  const dagOffset = v.dagOffset ?? 0;
  setNow(new RealDate(2026, 6, 27 + dagOffset, 8, 0, 0));
  const r = buildWeekProposal({
    settings: settings(v.pendelDuurMin),
    plannerDays: plannerDays(v.min, v.pendel, iso(0)),
    events: [
      {
        id: 1,
        datum: "2027-04-17",
        naam: "A-race",
        type: "race",
        prioriteit: "A",
      },
    ],
    activities: [],
    weekplans: [],
    wellness: [],
    rpe: [],
    todayISO: iso(dagOffset),
    // ROADMAP punt 16 — de IJKING meet de PRIKKELLOZE basislijn, net als `weekvormAs.test.ts`
    // zelf. Zou de bereik-prikkel hier meedoen, dan verschuift het ijkpunt mee met elke latere
    // wijziging aan die prikkel en ijkt dit instrument zichzelf niet meer.
    prikkelUit: true,
  });
  let kwal = 0;
  let tss = 0;
  const kdagen = new Set();
  for (const d of r.days) {
    for (const s of d.sessions ?? []) {
      const q =
        (Number(s.intent?.high) || 0) + (Number(s.intent?.anaerobic) || 0);
      kwal += q;
      tss += Number(s.tss) || 0;
      if (q > 0) kdagen.add(d.datum);
    }
  }
  return { kwal: Math.round(kwal), tss, dagen: kdagen.size };
}

function ijking() {
  const gemeten = { kwal: [], tss: [], dagen: [] };
  for (const v of VORMEN) {
    const r = meetVorm(v);
    gemeten.kwal.push(r.kwal);
    gemeten.tss.push(r.tss);
    gemeten.dagen.push(r.dagen);
  }
  let ok = 0;
  const afwijkingen = [];
  for (const sleutel of ["kwal", "tss", "dagen"]) {
    for (let i = 0; i < VORMEN.length; i++) {
      if (gemeten[sleutel][i] === VERWACHT[sleutel][i]) ok++;
      else
        afwijkingen.push(
          `${VORMEN[i].naam} ${sleutel}: ${gemeten[sleutel][i]} tegen ${VERWACHT[sleutel][i]}`,
        );
    }
  }
  return { ok, totaal: VORMEN.length * 3, gemeten, afwijkingen };
}

// ── (b) NULMETING en (c) VULDAG-DEKKING ──────────────────────────────────────────────────────
const DOELEN = [
  "FTP",
  "Onderhoud",
  "Korte beklimmingen",
  "Lange beklimmingen",
  "Conditie",
];
// Exact de offsets uit `apps/web/src/lib/punt15.test.ts`. Test (-84) valt buiten deze meting:
// die fase kent geen sleutelsessie en levert per constructie quotum 0.
const FASE_OFFSET = { Base: 0, Build: -28, Peak: -56 };

const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const parseISO = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new RealDate(y, m - 1, d).getTime();
};

const blokkenVan = (entry) =>
  Array.isArray(entry?.blokken) ? entry.blokken : [];
const minutenVan = (entry) =>
  blokkenVan(entry).reduce((a, b) => a + (Number(b?.minuten) || 0), 0);

/** De VULDAG: een entry met minuten maar zonder enige werkzone in de normpoort. */
const isVuldag = (entry) =>
  minutenVan(entry) > 0 && werkzoneLabelsVan_(blokkenVan(entry)).length === 0;
const draagtWerkzone = (entry) =>
  werkzoneLabelsVan_(blokkenVan(entry)).length > 0;

function cel(doel, vorm, offset, matMin = MATERIALITEIT) {
  const doelStart = iso(offset);
  const blokStart = iso(0);
  const weekplans = [];
  const activities = [];
  // `weekUren` stuurt `urenPrikkels` via PRIKKEL_UREN_DREMPEL; hem op een vaste 5 zetten zou de
  // norm van een week van acht uur verkeerd stellen. Afgeleid uit de weekvorm zelf.
  const weekUren = Object.values(vorm.min).reduce((a, b) => a + b, 0) / 60;

  for (let i = 0; i < 4; i++) {
    const monday = schuif_(blokStart, i * 7);
    setNow(MAANDAG);
    const w = buildWeekProposal({
      settings: settings(vorm.pendelDuurMin, doel, doelStart),
      plannerDays: plannerDays(vorm.min, vorm.pendel, monday),
      events: [],
      activities: [],
      weekplans: [],
      wellness: [],
      rpe: [],
      todayISO: monday,
    });
    const entries = buildWeekplanEntries(w, doel);

    // DE PRIKKEL landt op de vuldag, en alleen daar. Neutrale stand: geen prikkel, dus deze lus
    // raakt niets en de nulmeting is de VOOR-staat.
    if (PRIKKEL.length > 0) {
      for (const e of entries) {
        if (!isVuldag(e)) continue;
        e.blokken = [
          ...blokkenVan(e),
          ...PRIKKEL.map((p) => ({ ...p, coreWork: true })),
        ];
      }
    }

    weekplans.push(...entries);
    const rauw = entries.flatMap(blokkenVan);
    const zm = planZone5_(rauw, ZONE5_GRENZEN_DEFAULT);
    activities.push(ritMet_(schuif_(monday, 1), zm));
  }

  const ref = buildBlokReferent({
    doelStart,
    activities,
    doel,
    weekUren,
    startMonday: blokStart,
    todayISO: schuif_(blokStart, 28),
    grenzen: ZONE5_GRENZEN_DEFAULT,
    weekplans,
    // ROADMAP punt 16 — de N-as. Weggelaten op de commandoregel → `MATERIALITEIT_MIN_MINUTEN`.
    materialiteitMin: matMin,
  });
  const uit = ref ? blokUitvoering(ref) : null;

  // (c) en (d) — PER WEEK, niet alleen de eerste: de vier weken van een cel delen hun weekvorm
  // maar niet hun plan, want de mesoweek en de recency-seed bewegen mee.
  const weken = [];
  for (let i = 0; i < 4; i++) {
    const maandag = schuif_(blokStart, i * 7);
    const eind = schuif_(blokStart, (i + 1) * 7);
    const inWeek = weekplans.filter((e) => {
      const dm = e?.datum ?? "";
      return dm >= maandag && dm < eind;
    });
    const dagIndex = (d) =>
      Math.round((parseISO(d) - parseISO(maandag)) / 864e5);
    const werkdagen = inWeek.filter(draagtWerkzone);
    // De dag met de hoogste TSS van die week — de referent voor (f).
    const topTss = inWeek.reduce(
      (best, e) =>
        best === null || (Number(e.tss) || 0) > (Number(best.tss) || 0)
          ? e
          : best,
      null,
    );

    const vuldagen = inWeek.filter(isVuldag).map((v) => {
      // (d) — de afstand tot de DICHTSTBIJZIJNDE dag met een werkzone-label.
      const afstanden = werkdagen.map((w) =>
        Math.abs(dagIndex(w.datum) - dagIndex(v.datum)),
      );
      return {
        datum: v.datum,
        weekdag: WEEKDAGEN[dagIndex(v.datum)] ?? "?",
        minuten: Math.round(minutenVan(v) * 10) / 10,
        variantId: v.variantId ?? null,
        naam: v.naam ?? null,
        afstandWerkzone: afstanden.length > 0 ? Math.min(...afstanden) : null,
        afstandTopTss: topTss
          ? Math.abs(dagIndex(topTss.datum) - dagIndex(v.datum))
          : null,
      };
    });

    // (f) — bij meer dan één vuldag: welke ligt het VERST van de zwaarste dag?
    let kandidaat = null;
    let gelijkspel = null;
    if (vuldagen.length > 1 && topTss) {
      const max = Math.max(...vuldagen.map((v) => v.afstandTopTss));
      const winnaars = vuldagen.filter((v) => v.afstandTopTss === max);
      kandidaat = winnaars[0].datum;
      gelijkspel = winnaars.length > 1;
    }

    // ROADMAP punt 16 — LANDDE DE SPRINTSET? De set is herkenbaar aan zijn eigen band: blokken
    // op precies 150 %FTP komen nergens anders vandaan. Zo is "gevuurd" van buitenaf te tellen,
    // zonder de vlag door de client-laag heen te hoeven exporteren.
    const metSprints = inWeek.some((e) =>
      blokkenVan(e).some((b) => b?.pctLo === 150 && b?.pctHi === 150),
    );

    weken.push({ maandag, vuldagen, kandidaat, gelijkspel, metSprints });
  }

  const alleVuldagen = weken.flatMap((w) => w.vuldagen);

  return {
    doel,
    vorm: vorm.naam,
    fase: Object.keys(FASE_OFFSET).find((k) => FASE_OFFSET[k] === offset),
    geleverd: uit ? uit.geleverd : null,
    beoordeeldeWeken: ref ? ref.weeks.filter((w) => w.telt).length : 0,
    // ROADMAP punt 16 — de twee poort-getallen van de N-as: hoeveel BEOORDEELDE weken dragen
    // anaeroob in hun poortset, en hoeveel zone-cellen staan er in totaal open.
    anaeroobWeken: ref
      ? ref.weeks.filter(
          (w) => w.telt && (w.zonesVoorgeschreven ?? []).includes("anaeroob"),
        ).length
      : 0,
    zoneCellen: ref
      ? ref.weeks
          .filter((w) => w.telt)
          .reduce((a, w) => a + (w.zonesVoorgeschreven ?? []).length, 0)
      : 0,
    weken,
    // (c) uit blok 1 blijft op de EERSTE week staan, zodat die uitslag vergelijkbaar blijft.
    vuldagen: weken[0].vuldagen.length,
    buurDraagt: weken[0].vuldagen.some((v) => v.afstandWerkzone === 1),
    vuldagenTotaal: alleVuldagen.length,
  };
}

function nulmeting(matMin = MATERIALITEIT) {
  const cellen = [];
  for (const doel of DOELEN)
    for (const vorm of MEETAS)
      for (const offset of Object.values(FASE_OFFSET))
        cellen.push(cel(doel, vorm, offset, matMin));
  return cellen;
}

// ── DE N-IJKING ──────────────────────────────────────────────────────────────────────────────
// Per N vier getallen: geleverde cellen bij uitvoeringsschaal 1,00 en bij 0,95 (de schaal
// UITSLUITEND op de anaerobe minuten — alles schalen meet een globaal tekort in plaats van de
// anaerobe poort), plus het aantal weken met anaeroob in de poortset en het totale aantal
// zone-cellen. Het PLATEAU is de breedste aaneengesloten reeks waarover alle vier stilstaan.
if (N_IJKING) {
  const AS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10];
  console.log("N ; geleverd@1,00 ; geleverd@0,95 ; anaeroobWeken ; zoneCellen");
  for (const N of AS) {
    SCHAAL_NU = 1;
    const a = nulmeting(N);
    SCHAAL_NU = 0.95;
    const b = nulmeting(N);
    SCHAAL_NU = ANAEROOB_SCHAAL;
    console.log(
      [
        N,
        a.filter((c) => c.geleverd === true).length,
        b.filter((c) => c.geleverd === true).length,
        a.reduce((s, c) => s + c.anaeroobWeken, 0),
        a.reduce((s, c) => s + c.zoneCellen, 0),
      ].join(" ; "),
    );
  }
  process.exit(0);
}

// ── UITVOER ──────────────────────────────────────────────────────────────────────────────────
const ijk = ijking();
const cellen = nulmeting();

const geleverd = cellen.filter((c) => c.geleverd === true).length;
const nietGeleverd = cellen.filter((c) => c.geleverd === false).length;
const zonderOordeel = cellen.filter((c) => c.geleverd === null).length;
const perDoel = DOELEN.map((d) => {
  const rij = cellen.filter((c) => c.doel === d);
  return {
    doel: d,
    geleverd: rij.filter((c) => c.geleverd === true).length,
    totaal: rij.length,
  };
});

const precies1 = cellen.filter((c) => c.vuldagen === 1).length;
const meer = cellen.filter((c) => c.vuldagen > 1).length;
const geen = cellen.filter((c) => c.vuldagen === 0).length;
const metBuur = cellen.filter((c) => c.vuldagen > 0 && c.buurDraagt).length;

// ── (d) (e) (f) — de PLEK-inventaris, over een selectie cellen ───────────────────────────────
// De low-pool van `genericPools_` (`planner.ts:1661`) draagt VIER varianten. Die lijst staat hier
// als NOEMER, niet als filter: een vuldag met een variantId erbuiten is zelf een bevinding.
const LOW_POOL = ["z2_steady", "z2_cadans", "z2_progressief", "z2_nuchter"];

function inventaris(sel) {
  const weken = sel.flatMap((c) => c.weken);
  const vuldagen = weken.flatMap((w) => w.vuldagen);

  const perWeek = { 0: 0, 1: 0, 2: 0, "3+": 0 };
  for (const w of weken) {
    const n = w.vuldagen.length;
    perWeek[n >= 3 ? "3+" : n]++;
  }

  const afstand = { 1: 0, 2: 0, "3+": 0, geen: 0 };
  for (const v of vuldagen) {
    if (v.afstandWerkzone === null) afstand.geen++;
    else if (v.afstandWerkzone >= 3) afstand["3+"]++;
    else afstand[v.afstandWerkzone]++;
  }

  const perWeekdag = {};
  const duren = [];
  const perVariant = {};
  let zonderVariant = 0;
  for (const v of vuldagen) {
    perWeekdag[v.weekdag] = (perWeekdag[v.weekdag] ?? 0) + 1;
    duren.push(v.minuten);
    if (v.variantId == null) zonderVariant++;
    else perVariant[v.variantId] = (perVariant[v.variantId] ?? 0) + 1;
  }
  duren.sort((a, b) => a - b);
  const mediaan = duren.length ? duren[Math.floor(duren.length / 2)] : null;

  const meerdere = weken.filter((w) => w.vuldagen.length > 1);
  const uniek = meerdere.filter((w) => w.gelijkspel === false).length;
  const gelijk = meerdere.filter((w) => w.gelijkspel === true).length;

  // BEREIKBAARHEID van een ingreep in `renderVariant_`: die functie is de ENIGE producent die
  // `variantId` zet (`planner.ts:1430`), dus alleen een vuldag MET variantId is daar te raken.
  // Een week zonder zo'n vuldag ligt per constructie buiten het bereik.
  const metVariant = weken.filter((w) =>
    w.vuldagen.some((v) => v.variantId != null),
  ).length;
  const metSprints = weken.filter((w) => w.metSprints).length;

  return {
    cellen: sel.length,
    weken: weken.length,
    vuldagen: vuldagen.length,
    metVariant,
    metSprints,
    perWeek,
    afstand,
    perWeekdag,
    duur: duren.length
      ? { min: duren[0], mediaan, max: duren[duren.length - 1] }
      : null,
    perVariant,
    zonderVariant,
    meerdere: meerdere.length,
    uniek,
    gelijk,
  };
}

function drukInventaris(kop, inv) {
  console.log(
    `${kop} — ${inv.cellen} cellen, ${inv.weken} weken, ${inv.vuldagen} vuldagen`,
  );
  console.log(
    `  (d) vuldagen per week: 0 in ${inv.perWeek[0]}, 1 in ${inv.perWeek[1]}, 2 in ${inv.perWeek[2]}, 3 of meer in ${inv.perWeek["3+"]} van de ${inv.weken}`,
  );
  console.log(
    `  (d) afstand tot de dichtstbijzijnde werkzone-dag: 1 dag ${inv.afstand[1]}, 2 dagen ${inv.afstand[2]}, 3 of meer ${inv.afstand["3+"]}, geen werkzone-dag ${inv.afstand.geen} van de ${inv.vuldagen}`,
  );
  console.log(
    `  (d) weekdag: ${
      Object.entries(inv.perWeekdag)
        .map(([k, n]) => `${k} ${n}`)
        .join(", ") || "geen"
    }`,
  );
  if (inv.duur)
    console.log(
      `  (d) duur min/mediaan/max: ${inv.duur.min} / ${inv.duur.mediaan} / ${inv.duur.max}`,
    );
  const varianten = [
    ...LOW_POOL,
    ...Object.keys(inv.perVariant).filter((k) => !LOW_POOL.includes(k)),
  ];
  console.log(
    `  (e) variantId: ${varianten.map((k) => `${k} ${inv.perVariant[k] ?? 0}`).join(", ")} - zonder variantId ${inv.zonderVariant} - noemer ${inv.vuldagen}`,
  );
  console.log(
    `  (f) weken met meer dan een vuldag: ${inv.meerdere} - keuze uniek ${inv.uniek}, gelijkspel ${inv.gelijk}`,
  );
  console.log(
    `  BEREIK renderVariant_: ${inv.metVariant} van de ${inv.weken} weken dragen minstens een vuldag MET variantId`,
  );
  console.log(
    `  PRIKKEL GELAND: ${inv.metSprints} van de ${inv.weken} weken dragen een sprintset (blok op 150 %FTP)`,
  );
}

if (ALS_JSON) {
  console.log(JSON.stringify({ ijking: ijk, cellen }, null, 2));
} else {
  console.log(
    `PARAMETERS: prikkel ${PRIKKEL.length ? JSON.stringify(PRIKKEL) : "GEEN"} - anaeroob-schaal ${ANAEROOB_SCHAAL}`,
  );
  console.log("");
  console.log(`IJKING: ${ijk.ok} van de ${ijk.totaal}`);
  for (const a of ijk.afwijkingen) console.log(`  AFWIJKING ${a}`);
  console.log(`  kwal  ${JSON.stringify(ijk.gemeten.kwal)}`);
  console.log(`  tss   ${JSON.stringify(ijk.gemeten.tss)}`);
  console.log(`  dagen ${JSON.stringify(ijk.gemeten.dagen)}`);
  console.log("");
  console.log(`NULMETING: ${geleverd} van de ${cellen.length} cellen geleverd`);
  console.log(
    `  niet geleverd ${nietGeleverd} - zonder oordeel ${zonderOordeel}`,
  );
  for (const p of perDoel)
    console.log(`  ${p.doel}: ${p.geleverd} van de ${p.totaal}`);
  console.log("");
  console.log(`VULDAG-DEKKING over ${cellen.length} cellen:`);
  console.log(
    `  precies een vuldag ${precies1} - meer dan een ${meer} - geen ${geen}`,
  );
  console.log(
    `  cellen met een vuldag waarvan de buurdag wel een werkzone draagt: ${metBuur}`,
  );
  console.log("");
  drukInventaris("ALLE DOELEN", inventaris(cellen));
  console.log("");
  drukInventaris(
    "(g) ONDERHOUD",
    inventaris(cellen.filter((c) => c.doel === "Onderhoud")),
  );
  console.log("");
  drukInventaris(
    "(g) ONDERHOUD op WINTER",
    inventaris(
      cellen.filter((c) => c.doel === "Onderhoud" && c.vorm === WINTER.naam),
    ),
  );
  const winterCellen = cellen.filter(
    (c) => c.doel === "Onderhoud" && c.vorm === WINTER.naam,
  );
  console.log("  de vuldagen zelf, per week:");
  for (const c of winterCellen)
    for (const w of c.weken)
      for (const v of w.vuldagen)
        console.log(
          `    ${c.fase} ${w.maandag} ${v.weekdag} ${v.minuten} min - variantId ${v.variantId ?? "GEEN"} - "${v.naam}" - afstand werkzone ${v.afstandWerkzone}`,
        );
}
