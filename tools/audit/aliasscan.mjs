// R0 module 2a — kandidaat-detector. Leunt op de exports van run.mjs. KOPPELT NIETS: het
// rapporteert paren uit alleen-in-GAS gekruist met alleen-in-Cadans die op naam/vorm op een port
// lijken, zodat een mens (Daan) beslist of er een alias bij moet. Eigen entry, geen pnpm-script.
//
// Run: node tools/audit/aliasscan.mjs   (GAS_SRC env als in run.mjs)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALIASES } from "./alias.mjs";
import {
  assertGasHead,
  cadansSources,
  canonOf,
  extractUnits,
  gasSources,
} from "./run.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");

const norm = (n) => n.replace(/_+$/, "").toLowerCase();
const isTest = (n) => /^test/i.test(n);
function editDistance(a, b) {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [
    i,
    ...new Array(n).fill(0),
  ]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const gasHead = assertGasHead();
  const gasUnits = extractUnits(gasSources());
  const cadUnits = extractUnits(cadansSources());

  // matched = directe naam-overlap + geverifieerde aliassen (na STAP 4) — identiek aan run.mjs
  const usedGas = new Set(),
    usedCad = new Set();
  for (const [name] of cadUnits)
    if (gasUnits.has(name)) {
      usedGas.add(name);
      usedCad.add(name);
    }
  for (const a of ALIASES) {
    if (
      gasUnits.has(a.gas) &&
      cadUnits.has(a.cadans) &&
      !usedGas.has(a.gas) &&
      !usedCad.has(a.cadans)
    ) {
      usedGas.add(a.gas);
      usedCad.add(a.cadans);
    }
  }
  const onlyGas = [...gasUnits.values()].filter((u) => !usedGas.has(u.name));
  const onlyCad = [...cadUnits.values()].filter((u) => !usedCad.has(u.name));

  // canon onder NUL regels, per unit één keer (grond B via string-join)
  const emptyRules = new Set();
  const emptyRen = new Map();
  const gasCanon = new Map(
    onlyGas.map((u) => [u.name, canonOf(u, emptyRules, emptyRen)]),
  );
  const cadCanon = new Map(
    onlyCad.map((u) => [u.name, canonOf(u, emptyRules, emptyRen)]),
  );

  const cand = []; // {gas, cad, gasFile, cadFile, grond, extra}
  const key = (g, c) => `${g}|${c}`;
  const seenAC = new Set();

  // A — naam-normalisatie: strip trailing underscores + lowercase -> exacte match
  for (const g of onlyGas) {
    for (const c of onlyCad) {
      if (norm(g.name) === norm(c.name)) {
        cand.push({
          gas: g.name,
          cad: c.name,
          gasFile: g.file,
          cadFile: c.file,
          grond: "A",
          extra: "",
        });
        seenAC.add(key(g.name, c.name));
      }
    }
  }
  // B — canon onder NUL regels identiek (AST-identiek op de naam na)
  const byCanon = new Map();
  for (const c of onlyCad) {
    const cc = cadCanon.get(c.name);
    if (!byCanon.has(cc)) byCanon.set(cc, []);
    byCanon.get(cc).push(c);
  }
  for (const g of onlyGas) {
    const gc = gasCanon.get(g.name);
    const hits = byCanon.get(gc);
    if (hits)
      for (const c of hits)
        cand.push({
          gas: g.name,
          cad: c.name,
          gasFile: g.file,
          cadFile: c.file,
          grond: "B",
          extra: `canon-len ${gc.length}`,
        });
  }
  // C — genormaliseerde substring, beide namen >= 7 tekens, ^test uitgesloten
  for (const g of onlyGas) {
    if (g.name.length < 7 || isTest(g.name)) continue;
    for (const c of onlyCad) {
      if (c.name.length < 7 || isTest(c.name)) continue;
      const ng = norm(g.name),
        nc = norm(c.name);
      if (ng === nc) continue; // dat is A
      if (ng.includes(nc) || nc.includes(ng)) {
        cand.push({
          gas: g.name,
          cad: c.name,
          gasFile: g.file,
          cadFile: c.file,
          grond: "C",
          extra: "",
        });
        seenAC.add(key(g.name, c.name));
      }
    }
  }
  // D — edit-distance <= 25% van de langste naam, beide >= 8, ^test uit, en niet al door A/C gevonden
  for (const g of onlyGas) {
    if (g.name.length < 8 || isTest(g.name)) continue;
    for (const c of onlyCad) {
      if (c.name.length < 8 || isTest(c.name)) continue;
      if (seenAC.has(key(g.name, c.name))) continue;
      const d = editDistance(g.name, c.name);
      const thr = Math.max(g.name.length, c.name.length) * 0.25;
      if (d > 0 && d <= thr)
        cand.push({
          gas: g.name,
          cad: c.name,
          gasFile: g.file,
          cadFile: c.file,
          grond: "D",
          extra: `afstand ${d} / drempel ${thr.toFixed(1)}`,
        });
    }
  }

  // 1-op-veel: een naam die in meer dan één kandidaat-paar voorkomt (de alias-machinerie is 1-op-1)
  const gasCount = new Map(),
    cadCount = new Map();
  for (const x of cand) {
    gasCount.set(x.gas, (gasCount.get(x.gas) || 0) + 1);
    cadCount.set(x.cad, (cadCount.get(x.cad) || 0) + 1);
  }
  for (const x of cand)
    x.oneToMany = gasCount.get(x.gas) > 1 || cadCount.get(x.cad) > 1;

  const perGround = { A: 0, B: 0, C: 0, D: 0 };
  for (const x of cand) perGround[x.grond]++;

  const L = [];
  L.push(
    "R0 module 2a — kandidaat-detector. KOPPELT NIETS; het rapporteert paren om te reviewen.",
  );
  L.push(`GAS-HEAD: ${gasHead}`);
  L.push(
    `alleen-in-GAS: ${onlyGas.length}  |  alleen-in-Cadans: ${onlyCad.length}`,
  );
  L.push(
    `kandidaten per grond: A=${perGround.A} B=${perGround.B} C=${perGround.C} D=${perGround.D}  (totaal ${cand.length})`,
  );
  L.push("");
  for (const grond of ["A", "B", "C", "D"]) {
    L.push(`=== grond ${grond} ===`);
    const rows = cand.filter((x) => x.grond === grond);
    if (!rows.length) L.push("  (geen)");
    for (const x of rows) {
      const flag = x.oneToMany ? "  [1-op-veel]" : "";
      const extra = x.extra ? `  (${x.extra})` : "";
      L.push(
        `  ${x.gas} [${x.gasFile}]  <->  ${x.cad} [${x.cadFile}]${extra}${flag}`,
      );
    }
    L.push("");
  }
  const text = L.join("\n") + "\n";
  writeFileSync(join(OUT, "aliasscan.txt"), text);
  process.stdout.write(text);
}

main();
