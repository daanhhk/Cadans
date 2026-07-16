// R0 module 2b — risico-matrix + oracle-inventaris + entrypoint-map. Sorteert de naam-matches
// op leesvolgorde voor R1/R2 en trieert de alleen-in-GAS. Geen rechter: "identiek" is geen
// kwaliteitsoordeel, "verschil" geen bug. Sluitingen over-approximeren bewust -> "buiten bereik"
// is een sterk signaal, "binnen bereik" een zwak. Eigen entry, NIET in CI, geen pnpm-script.
//
// Run: node tools/audit/matrix.mjs

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALIASES } from "./alias.mjs";
import { ENTRYPOINTS } from "./entrypoints.mjs";
import { VOCAB_FORBIDDEN } from "./rules.mjs";
import {
  assertGasHead,
  cadansSources,
  compare,
  extractUnits,
  gasSources,
} from "./run.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const HERE = dirname(fileURLToPath(import.meta.url));
const CADANS = join(HERE, "..", "..");
const OUT = join(HERE, "out");
const GAS_SRC = process.env.GAS_SRC || "C:/Users/daan/Projects/training";

const parse = (text, name, kind) =>
  ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, kind);

function walkDir(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else out.push(p);
  }
  return out;
}
function sourcesFrom(roots, pick) {
  const sfs = [];
  for (const r of roots) {
    for (const p of walkDir(join(CADANS, r))) {
      if (!pick(p)) continue;
      const kind = p.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      sfs.push(parse(readFileSync(p, "utf8"), basename(p), kind));
    }
  }
  return sfs;
}
const isTs = (p) => /\.tsx?$/.test(p) && !/\.test\.ts$/.test(p);
const isTest = (p) => /\.test\.ts$/.test(p);

// ── binding-namen (lokaal gebonden in U) ──
function collectBindingNames(name, s) {
  if (!name) return;
  if (ts.isIdentifier(name)) s.add(name.text);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name))
    for (const el of name.elements)
      if (ts.isBindingElement(el)) collectBindingNames(el.name, s);
}
function localBindings(fnNode) {
  const s = new Set();
  for (const p of fnNode.parameters || []) collectBindingNames(p.name, s);
  const walk = (n) => {
    if (ts.isVariableDeclaration(n) || ts.isParameter(n))
      collectBindingNames(n.name, s);
    else if (ts.isFunctionDeclaration(n) && n.name) s.add(n.name.text);
    else if (ts.isCatchClause(n) && n.variableDeclaration)
      collectBindingNames(n.variableDeclaration.name, s);
    ts.forEachChild(n, walk);
  };
  if (fnNode.body) walk(fnNode.body);
  return s;
}

// ── string-handler-edges: on<iets>="V(" in een string/template ──
const HANDLER_RE = /on\w+\s*=\s*["']?\s*([A-Za-z_$][\w$]*)\s*\(/g;
function handlerNames(str) {
  const out = [];
  for (const m of str.matchAll(HANDLER_RE)) out.push(m[1]);
  return out;
}

// ── waarde-referenties in een node (edge-kandidaten), met tellers voor de bewakers ──
function refsInNode(node, local, tel) {
  const out = new Set();
  const walk = (n) => {
    if (!n) return;
    if (ts.isImportDeclaration(n) || ts.isImportEqualsDeclaration(n)) return;
    if (ts.isPropertyAccessExpression(n)) {
      // obj.V is GEEN edge; tel property-calls op een naam apart
      if (tel) tel.propName(n.name.text);
      walk(n.expression);
      return;
    }
    if (ts.isElementAccessExpression(n)) {
      // obj[expr]()-dispatch: alleen in CALL-positie telt als onder-benaderde edge
      if (
        tel &&
        !ts.isStringLiteralLike(n.argumentExpression) &&
        n.parent &&
        ts.isCallExpression(n.parent) &&
        n.parent.expression === n
      )
        tel.dynDispatch();
      walk(n.expression);
      walk(n.argumentExpression);
      return;
    }
    if (ts.isPropertyAssignment(n) && !ts.isComputedPropertyName(n.name)) {
      walk(n.initializer);
      return;
    }
    if (ts.isShorthandPropertyAssignment(n)) {
      out.add(n.name.text);
      return;
    }
    if (ts.isVariableDeclaration(n) || ts.isParameter(n)) {
      if (n.initializer) walk(n.initializer);
      return;
    }
    if (ts.isBindingElement(n)) {
      if (n.initializer) walk(n.initializer);
      return;
    }
    if (ts.isFunctionDeclaration(n)) {
      for (const p of n.parameters) walk(p);
      if (n.body) walk(n.body);
      return;
    }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const t = n.tagName;
      if (t && ts.isIdentifier(t)) out.add(t.text);
      for (const a of n.attributes.properties) walk(a);
      return;
    }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      for (const h of handlerNames(n.text)) {
        out.add(h);
        if (tel) tel.handler(h);
      }
      return;
    }
    if (ts.isTemplateExpression(n)) {
      for (const h of handlerNames(n.head.text)) {
        out.add(h);
        if (tel) tel.handler(h);
      }
      for (const sp of n.templateSpans) {
        for (const h of handlerNames(sp.literal.text)) {
          out.add(h);
          if (tel) tel.handler(h);
        }
        walk(sp.expression);
      }
      return;
    }
    if (ts.isIdentifier(n)) {
      out.add(n.text);
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(node);
  // FILTER: lokale namen worden geen edge (correct). De schaduw-TELLING gebeurt in buildEdges,
  // waar `valid` bekend is: alleen een lokale binding die een UNIT-naam schaduwt telt.
  const res = new Set();
  for (const nm of out) if (!local.has(nm)) res.add(nm);
  return res;
}

// edges van een units-map (name->{node}) beperkt tot geldige target-namen
function buildEdges(units, valid, tel, corpus) {
  const edges = new Map();
  for (const [name, u] of units) {
    const local = localBindings(u.node);
    // schaduw = een lokale binding waarvan de naam ook een UNIT-naam is (in `valid`), niet de unit zelf
    if (tel)
      for (const L of local)
        if (valid.has(L) && L !== name) tel.shadow(corpus, name, L);
    const refs = refsInNode(u.node.body || u.node, local, tel);
    const e = new Set();
    for (const r of refs) if (valid.has(r) && r !== name) e.add(r);
    edges.set(name, e);
  }
  return edges;
}
function reach(startNames, edges) {
  const seen = new Set();
  const stack = [...startNames].filter((n) => edges.has(n) || true);
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    seen.add(n);
    for (const v of edges.get(n) || []) if (!seen.has(v)) stack.push(v);
  }
  return seen;
}

function countCollisions(sources) {
  const seen = new Set();
  const dup = new Set();
  for (const sf of sources)
    for (const st of sf.statements) {
      let nm = null;
      if (ts.isFunctionDeclaration(st) && st.name) nm = st.name.text;
      else if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations)
          if (
            ts.isIdentifier(d.name) &&
            d.initializer &&
            (ts.isArrowFunction(d.initializer) ||
              ts.isFunctionExpression(d.initializer))
          )
            nm = d.name.text;
      if (nm) {
        if (seen.has(nm)) dup.add(nm);
        seen.add(nm);
      }
    }
  return dup;
}

function assertVocab(text) {
  for (const w of VOCAB_FORBIDDEN) {
    let idx = -1;
    if (/^[a-z]+$/i.test(w)) {
      const m = text.match(new RegExp(`\\b${w}\\b`, "i"));
      if (m) idx = m.index;
    } else idx = text.indexOf(w);
    if (idx >= 0) {
      const s = text.lastIndexOf("\n", idx) + 1;
      let e = text.indexOf("\n", idx);
      if (e < 0) e = text.length;
      throw new Error(
        `STOP: verboden vocabulaire "${w}" in de matrix-tekst -> ${text.slice(s, e).trim()}`,
      );
    }
  }
}

// ── it()-blokken uit een testbestand: naam -> aantal assert-call-sites ──
function itBlocks(sf) {
  const map = new Map();
  const countAsserts = (node) => {
    let c = 0;
    const w = (n) => {
      if (
        ts.isCallExpression(n) &&
        ts.isIdentifier(n.expression) &&
        (n.expression.text === "assert_" ||
          n.expression.text === "assertClose_")
      )
        c++;
      ts.forEachChild(n, w);
    };
    w(node);
    return c;
  };
  const walk = (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "it" &&
      n.arguments.length >= 2 &&
      ts.isStringLiteralLike(n.arguments[0])
    ) {
      map.set(n.arguments[0].text, countAsserts(n.arguments[1]));
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return map;
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const gasHead = assertGasHead();

  const gasSF = gasSources();
  const cadVergSF = cadansSources();
  const gasUnits = extractUnits(gasSF);
  const cadUnits = extractUnits(cadVergSF);
  const graafSF = sourcesFrom(
    [
      "apps/web/src",
      "workers/api/src",
      "packages/engine/src",
      "packages/shared/src",
    ],
    isTs,
  );
  const graafUnits = extractUnits(graafSF);
  const testSF = sourcesFrom(["packages", "apps", "workers"], isTest);

  // matched pairs (reproduceert module 1)
  const usedGas = new Set(),
    usedCad = new Set();
  const matched = [];
  for (const [name, c] of cadUnits)
    if (gasUnits.has(name)) {
      matched.push({ g: gasUnits.get(name), c });
      usedGas.add(name);
      usedCad.add(name);
    }
  for (const a of ALIASES)
    if (
      gasUnits.has(a.gas) &&
      cadUnits.has(a.cadans) &&
      !usedGas.has(a.gas) &&
      !usedCad.has(a.cadans)
    ) {
      matched.push({ g: gasUnits.get(a.gas), c: cadUnits.get(a.cadans) });
      usedGas.add(a.gas);
      usedCad.add(a.cadans);
    }
  const onlyGas = [...gasUnits.values()].filter((u) => !usedGas.has(u.name));
  const onlyCad = [...cadUnits.values()].filter((u) => !usedCad.has(u.name));

  // ── bewakers ──
  const tel = {
    prop: new Map(),
    shadows: [],
    dyn: 0,
    handlers: new Set(),
    propName(nm) {
      if (gasUnits.has(nm) || graafUnits.has(nm))
        this.prop.set(nm, (this.prop.get(nm) || 0) + 1);
    },
    shadow(corpus, unit, name) {
      this.shadows.push({ corpus, unit, name });
    },
    dynDispatch() {
      this.dyn++;
    },
    handler(h) {
      this.handlers.add(h);
    },
  };
  const gasNames = new Set(gasUnits.keys());
  const graafNames = new Set(graafUnits.keys());
  const gasEdges = buildEdges(gasUnits, gasNames, tel, "gas");
  const graafEdges = buildEdges(graafUnits, graafNames, tel, "graaf");
  const gasColl = countCollisions(gasSF);
  const graafColl = countCollisions(graafSF);

  // ── sluitingen ──
  const has = (n) => gasUnits.has(n);
  const epNames = ENTRYPOINTS.map((e) => e.gas).filter(has);
  const epMissing = ENTRYPOINTS.filter((e) => !has(e.gas));
  const gasWebStart = [...epNames, "doGet", "onOpen"].filter(has);
  const telegramUnits = [...gasUnits.values()]
    .filter((u) => u.file === "TelegramBot.gs")
    .map((u) => u.name);
  const gasTeleStart = ["doPost", ...telegramUnits].filter(has);
  const codeUnits = [...gasUnits.values()]
    .filter((u) => u.file === "Code.gs")
    .map((u) => u.name);
  const gasOracleStart = ["runSelfTest"].filter(has);

  // gas-web-client: (a) unit-namen in TOP-LEVEL statements die zelf GEEN unit-declaratie zijn
  // (window.X-toewijzingen, de DOMContentLoaded-listener, de IIFE), PLUS (b) inline handler-namen
  // uit Index.html (dat gasSources() NIET leest — apart lezen, alleen de handler-namen eruit).
  const isUnitDecl = (st) =>
    (ts.isFunctionDeclaration(st) && st.name && st.body) ||
    (ts.isVariableStatement(st) &&
      st.declarationList.declarations.every(
        (d) =>
          d.initializer &&
          (ts.isArrowFunction(d.initializer) ||
            ts.isFunctionExpression(d.initializer)),
      ));
  const gasWebClientStart = new Set();
  for (const sf of gasSF)
    for (const st of sf.statements) {
      if (isUnitDecl(st)) continue;
      for (const r of refsInNode(st, new Set(), null))
        if (gasNames.has(r)) gasWebClientStart.add(r);
    }
  const indexHtml = readFileSync(join(GAS_SRC, "src", "Index.html"), "utf8");
  for (const h of handlerNames(indexHtml))
    if (gasNames.has(h)) gasWebClientStart.add(h);

  const reachWebServer = reach(gasWebStart, gasEdges);
  const reachWebClient = reach([...gasWebClientStart], gasEdges);
  const reachWeb = new Set([...reachWebServer, ...reachWebClient]);
  const reachTele = reach(gasTeleStart, gasEdges);
  const reachTrig = reach(codeUnits, gasEdges);
  const reachOracle = reach(gasOracleStart, gasEdges);

  // cadans-app start = refs in main.tsx/App.tsx/index.ts
  const appStart = new Set();
  for (const rel of [
    "apps/web/src/main.tsx",
    "apps/web/src/App.tsx",
    "workers/api/src/index.ts",
  ]) {
    const p = join(CADANS, rel);
    const kind = p.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sf = parse(readFileSync(p, "utf8"), basename(p), kind);
    for (const r of refsInNode(sf, new Set(), null))
      if (graafNames.has(r)) appStart.add(r);
  }
  const reachApp = reach([...appStart], graafEdges);

  // ── oracle-assen (niet transitief) ──
  const selftestUnits = [...gasUnits.values()].filter(
    (u) => u.file === "SelfTest.gs" && /^test/.test(u.name),
  );
  const gasSuiteNoemt = new Set();
  for (const su of selftestUnits)
    for (const r of refsInNode(
      su.node.body || su.node,
      localBindings(su.node),
      null,
    ))
      if (gasNames.has(r)) gasSuiteNoemt.add(r);
  // gas-assert-arg: arg-index 3 van assert_/assertClose_ in SelfTest.gs
  const gasAssertArg = new Set();
  for (const sf of gasSF)
    if (sf.fileName === "SelfTest.gs") {
      const w = (n) => {
        if (
          ts.isCallExpression(n) &&
          ts.isIdentifier(n.expression) &&
          (n.expression.text === "assert_" ||
            n.expression.text === "assertClose_") &&
          n.arguments.length >= 4
        ) {
          const arg = n.arguments[3];
          const wa = (x) => {
            if (ts.isIdentifier(x) && gasNames.has(x.text))
              gasAssertArg.add(x.text);
            ts.forEachChild(x, wa);
          };
          wa(arg);
        }
        ts.forEachChild(n, w);
      };
      w(sf);
    }
  // cadans-test-noemt: waarde-refs in alle *.test.ts, beperkt tot cadans-vergelijkbaar-namen
  const cadNames = new Set(cadUnits.keys());
  const cadTestNoemt = new Set();
  for (const sf of testSF)
    for (const r of refsInNode(sf, new Set(), null))
      if (cadNames.has(r)) cadTestNoemt.add(r);
  const oracleTransitief = reachOracle.size;

  // ── de matrix ──
  let identiek = 0,
    equivalent = 0;
  const verschil = [];
  for (const m of matched) {
    const bin = compare(m.g, m.c).bin;
    if (bin === "identiek") identiek++;
    else if (bin === "equivalent") equivalent++;
    else {
      const arch = m.c.file === "api.ts";
      const gasOracle =
        gasSuiteNoemt.has(m.g.name) || gasAssertArg.has(m.g.name);
      const cadTest = cadTestNoemt.has(m.c.name);
      let grp;
      if (arch) grp = 4;
      else if (gasOracle && cadTest) grp = 3;
      else if (cadTest) grp = 2;
      else if (!gasOracle && !cadTest) grp = 1;
      else grp = 0; // rest: gas-oracle only
      verschil.push({
        gas: m.g.name,
        cad: m.c.name,
        grp,
        arch,
        appReach: reachApp.has(m.c.name),
        webReach: reachWeb.has(m.g.name),
        gasOracle,
        cadTest,
      });
    }
  }
  const G = (k) => verschil.filter((v) => v.grp === k);
  const cellSum = identiek + equivalent + verschil.length;
  if (cellSum !== matched.length)
    throw new Error(
      `STOP: cel-som ${cellSum} != naam-matches ${matched.length}.`,
    );

  // ── 473 doorsnedes ──
  const perFile = new Map();
  for (const u of onlyGas) perFile.set(u.file, (perFile.get(u.file) || 0) + 1);
  const inGroup = (name) => {
    const g = [];
    if (reachWebServer.has(name)) g.push("web-server");
    if (reachWebClient.has(name)) g.push("web-client");
    if (reachTele.has(name)) g.push("telegram");
    if (reachTrig.has(name)) g.push("trigger");
    if (reachOracle.has(name)) g.push("oracle");
    return g;
  };
  const groupTally = {
    "web-server": 0,
    "web-client": 0,
    telegram: 0,
    trigger: 0,
    oracle: 0,
    geen: 0,
  };
  for (const u of onlyGas) {
    const g = inGroup(u.name);
    if (!g.length) groupTally.geen++;
    for (const x of g) groupTally[x]++;
  }
  // gap-regel: onlyGas V aangeroepen door een matched-GAS-unit
  const matchedGasNames = new Set(matched.map((m) => m.g.name));
  const onlyGasSet = new Set(onlyGas.map((u) => u.name));
  const gapHits = new Set();
  for (const [name, e] of gasEdges)
    if (matchedGasNames.has(name))
      for (const v of e) if (onlyGasSet.has(v)) gapHits.add(v);

  // ── oracle-inventaris ──
  const runSelf = gasUnits.get("runSelfTest");
  const suiteOrder = [];
  if (runSelf) {
    const w = (n) => {
      if (
        ts.isCallExpression(n) &&
        ts.isIdentifier(n.expression) &&
        /^test/.test(n.expression.text) &&
        gasUnits.has(n.expression.text)
      )
        suiteOrder.push(n.expression.text);
      ts.forEachChild(n, w);
    };
    w(runSelf.node.body || runSelf.node);
  }
  const gasAssertCount = (u) => {
    let c = 0;
    const w = (n) => {
      if (
        ts.isCallExpression(n) &&
        ts.isIdentifier(n.expression) &&
        (n.expression.text === "assert_" ||
          n.expression.text === "assertClose_")
      )
        c++;
      ts.forEachChild(n, w);
    };
    w(u.node.body || u.node);
    return c;
  };
  const stTestSF = testSF.find((sf) => sf.fileName === "selftest.test.ts");
  const its = stTestSF ? itBlocks(stTestSF) : new Map();
  const suiteRows = [];
  let gasAssertTotal = 0,
    cadAssertTotal = 0;
  const deltas = [];
  for (const s of suiteOrder) {
    const itName = s.replace(/_+$/, "");
    const gAsserts = gasAssertCount(gasUnits.get(s));
    const cAsserts = its.has(itName) ? its.get(itName) : null;
    gasAssertTotal += gAsserts;
    if (cAsserts != null) cadAssertTotal += cAsserts;
    const delta = cAsserts == null ? null : cAsserts - gAsserts;
    suiteRows.push({ suite: s, itName, g: gAsserts, c: cAsserts, delta });
    if (delta != null && delta !== 0)
      deltas.push({ itName, g: gAsserts, c: cAsserts, delta });
  }
  const mirroredNames = new Set(suiteOrder.map((s) => s.replace(/_+$/, "")));
  const cadOwnSuites = [...its.keys()].filter((n) => !mirroredNames.has(n));

  // ── uitvoer ──
  const L = [];
  L.push(
    "R0 module 2b — risico-matrix + oracle-inventaris. Sorteermachine, geen rechter.",
  );
  L.push(`GAS-HEAD: ${gasHead}`);
  L.push(
    `naam-matches: ${matched.length}  |  alleen-in-GAS: ${onlyGas.length}  |  alleen-in-Cadans: ${onlyCad.length}`,
  );
  L.push("");
  L.push("=== bewakers (tellers, breken de run NIET af) ===");
  L.push(
    `  naamcollisies: GAS ${gasColl.size} (${[...gasColl].join(", ") || "geen"}) | Cadans-graaf ${graafColl.size} (${[...graafColl].join(", ") || "geen"})`,
  );
  const gasShadows = tel.shadows.filter((s) => s.corpus === "gas");
  const gasShadowNames = new Set(gasShadows.map((s) => s.name));
  const graafShadowN = tel.shadows.filter((s) => s.corpus === "graaf").length;
  L.push(
    `  lokale bindings die een unit-naam schaduwen (GAS-corpus): totaal ${gasShadows.length}, unieke namen ${gasShadowNames.size} -> ${gasShadows.map((s) => `${s.unit}/${s.name}`).join(", ") || "geen"}`,
  );
  L.push(
    `    scope-check is unit-breed (een lokale binding onderdrukt de naam in de HELE unit) -> impact hooguit ${gasShadows.length} edges; Cadans-graaf: ${graafShadowN}`,
  );
  const propTop = [...tel.prop.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const propSum = [...tel.prop.values()].reduce((a, b) => a + b, 0);
  L.push(
    `  property-calls op een unit-naam (NIET als edge geteld): ${propSum}; zes grootste bronnen: ${propTop.map(([k, v]) => `${k}(${v})`).join(", ")}`,
  );
  L.push(
    `  obj[expr]()-dispatch: ${tel.dyn}${tel.dyn > 0 ? " -> de graaf onder-approximeert hier" : ""}`,
  );
  L.push(
    `  string-handler-edges: ${tel.handlers.size} namen (${[...tel.handlers].sort().join(", ")})`,
  );
  L.push("");
  L.push(
    "=== sluitingen (over-approximeren; 'buiten bereik' is sterk, 'binnen bereik' zwak) ===",
  );
  L.push(
    `  gas-web-server: start ${gasWebStart.length} -> bereik ${reachWebServer.size}`,
  );
  L.push(
    `  gas-web-client: start ${gasWebClientStart.size} -> bereik ${reachWebClient.size} (onState bereikbaar: ${reachWebClient.has("onState") || reachWebServer.has("onState") ? "ja" : "nee"})`,
  );
  L.push(
    `  gas-telegram: start ${gasTeleStart.length} -> bereik ${reachTele.size}`,
  );
  L.push(
    `  gas-trigger : start ${codeUnits.length} -> bereik ${reachTrig.size}`,
  );
  L.push(
    `  gas-oracle  : start ${gasOracleStart.length} -> bereik ${reachOracle.size} (transitief; bewijst een naamketen, NIET dat de oracle iets vastlegde — in geen enkele cel gebruikt)`,
  );
  L.push(`  cadans-app  : start ${appStart.size} -> bereik ${reachApp.size}`);
  L.push("");
  L.push("=== matrix-cellen (som == naam-matches) ===");
  L.push(
    `  verschil groep 1 (geen archgrens, geen enkele test)      : ${G(1).length}`,
  );
  L.push(
    `  verschil groep 2 (alleen een cadans-test)                : ${G(2).length}`,
  );
  L.push(
    `  verschil groep 3 (door beide oracles geraakt)            : ${G(3).length}`,
  );
  L.push(
    `  verschil groep 4 (architectuurgrens)                     : ${G(4).length}`,
  );
  if (G(0).length)
    L.push(
      `  verschil REST (gas-oracle only, geen cadans-test)        : ${G(0).length}`,
    );
  L.push(
    `  equivalent onder regels                                  : ${equivalent}`,
  );
  L.push(
    `  identiek (alleen canonicalisatie)                        : ${identiek}`,
  );
  L.push(`  som: ${cellSum} == ${matched.length}`);
  L.push("");
  for (const [k, lbl] of [
    [1, "groep 1 — geen archgrens, geen enkele test"],
    [2, "groep 2 — alleen een cadans-test"],
    [3, "groep 3 — door beide oracles geraakt"],
    [4, "groep 4 — architectuurgrens"],
    [0, "REST — gas-oracle only, geen cadans-test"],
  ]) {
    const rows = G(k);
    if (!rows.length) continue;
    L.push(`=== leesstapel ${lbl} (${rows.length}) ===`);
    for (const v of rows)
      L.push(
        `  ${v.gas}${v.gas !== v.cad ? ` -> ${v.cad}` : ""}  [app-bereik ${v.appReach ? "ja" : "nee"}, web-ui-bereik ${v.webReach ? "ja" : "nee"}]`,
      );
    L.push("");
  }
  L.push("=== alleen-in-GAS (473) — doorsnede per bronbestand ===");
  for (const [f, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1]))
    L.push(`  ${f}: ${n}`);
  L.push("");
  L.push(
    "=== alleen-in-GAS — doorsnede per entrypoint-groep (een fn kan in meerdere vallen) ===",
  );
  L.push(
    `  web-server ${groupTally["web-server"]} | web-client ${groupTally["web-client"]} | telegram ${groupTally.telegram} | trigger ${groupTally.trigger} | oracle ${groupTally.oracle} | in geen groep ${groupTally.geen}`,
  );
  L.push("");
  L.push(
    `=== alleen-in-GAS — gap-regel (blad-gat-kandidaten: aangeroepen door een geporte fn): ${gapHits.size} ===`,
  );
  L.push(`  ${[...gapHits].sort().join(", ")}`);
  L.push(
    "  NB: de gap-regel vindt GEEN hele ontbrekende features als de aanroepers zelf ook niet geport zijn — daarvoor is entrypoints.mjs.",
  );
  L.push("");
  L.push("=== entrypoint-map (16; verificatie tegen de GAS-bron) ===");
  for (const e of ENTRYPOINTS)
    L.push(
      `  ${e.gas} [${e.soort}] -> ${e.cadans}${has(e.gas) ? "" : "  (WEGGELATEN: GAS-naam niet gevonden)"}`,
    );
  L.push(
    `  entrypoint-regels die de verificatie niet haalden: ${epMissing.length}${epMissing.length ? ` -> ${epMissing.map((e) => e.gas).join(", ")}` : ""}`,
  );
  L.push("");
  L.push("=== oracle-inventaris ===");
  L.push(
    `  GAS-suites (runSelfTest): ${suiteOrder.length}  |  gespiegelde it()-blokken: ${its.size}  |  Cadans-eigen suites: ${cadOwnSuites.length} (${cadOwnSuites.join(", ")})`,
  );
  L.push(
    `  statische assert-call-sites: GAS ${gasAssertTotal}  |  Cadans (gespiegeld) ${cadAssertTotal}`,
  );
  L.push(
    `  paren met delta != 0: ${deltas.length}${deltas.length ? " -> " + deltas.map((d) => `${d.itName} (GAS ${d.g}, Cadans ${d.c}, delta ${d.delta > 0 ? "+" : ""}${d.delta})`).join("; ") : ""}`,
  );
  L.push(
    "  NB: statische call-sites zijn NIET de runtime-assert-teller (lussen); de assert-count-vloer bewaakt de runtime-telling, niet de dekking. Deze statische pariteit is een tweede bewaking naast de vloer.",
  );
  L.push("");
  L.push(
    `gas-oracle-transitief (los getal, in geen cel gebruikt): ${oracleTransitief}`,
  );

  const text = L.join("\n") + "\n";
  assertVocab(text);
  writeFileSync(join(OUT, "matrix.txt"), text);
  process.stdout.write(text);
}

main();
