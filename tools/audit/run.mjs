// R0 module 1 — the AST sorting machine. Compares ported Cadans TS functions with
// their GAS original and sorts them into bins. This is NOT a judge: "identiek" is no
// quality verdict and "verschil" is no bug. Deliberately NOT wired into CI.
//
// Run: node tools/audit/run.mjs   (GAS_SRC env overrides the GAS source root)

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALIASES } from "./alias.mjs";
import { RULES } from "./rules.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let ts;
try {
  ts = require("typescript");
} catch {
  console.error(
    "STOP: typescript is niet resolvebaar vanuit tools/audit. Geen dependency toegevoegd.",
  );
  process.exit(1);
}

const GAS_SRC = process.env.GAS_SRC || "C:/Users/daan/Projects/training";
const CADANS = join(HERE, "..", "..");
const OUT = join(HERE, "out");

// ── zelfcontrole-teller: elk TS-type-fragment dat toch in een canonieke string zou lekken.
let typeLeaks = 0;

// ════════════════════════════════════════════════════════════════════
// Corpora
// ════════════════════════════════════════════════════════════════════
function parse(text, name, ts_kind) {
  return ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
    ts_kind,
  );
}
function gasSources() {
  const dir = join(GAS_SRC, "src");
  const out = [];
  for (const f of readdirSync(dir)
    .filter((f) => f.endsWith(".gs"))
    .sort()) {
    out.push(parse(readFileSync(join(dir, f), "utf8"), f, ts.ScriptKind.JS));
  }
  // inline <script> uit Script.html (eerste blok), als JS
  const html = readFileSync(join(dir, "Script.html"), "utf8");
  const a = html.indexOf("<script>");
  const b = html.indexOf("</script>", a);
  if (a >= 0 && b > a) {
    out.push(
      parse(
        html.slice(a + "<script>".length, b),
        "Script.html",
        ts.ScriptKind.JS,
      ),
    );
  }
  return out;
}
function cadansSources() {
  const out = [];
  const push = (dir) => {
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".ts") || f.endsWith(".test.ts") || f.endsWith(".tsx"))
        continue;
      out.push(parse(readFileSync(join(dir, f), "utf8"), f, ts.ScriptKind.TS));
    }
  };
  push(join(CADANS, "packages", "engine", "src"));
  push(join(CADANS, "apps", "web", "src", "lib"));
  return out;
}

// top-level function-declaraties + `const naam = (…) => {}` / function-expressie
function extractUnits(sources) {
  const map = new Map();
  for (const sf of sources) {
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name && st.body) {
        addUnit(map, st.name.text, st, sf);
      } else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (
            d.name &&
            ts.isIdentifier(d.name) &&
            d.initializer &&
            (ts.isArrowFunction(d.initializer) ||
              ts.isFunctionExpression(d.initializer))
          ) {
            addUnit(map, d.name.text, d.initializer, sf);
          }
        }
      }
    }
  }
  return map;
}
function addUnit(map, name, fnNode, sf) {
  // eerste voorkomen wint; latere gelijknamige (overrides in andere bestanden) worden genegeerd
  if (!map.has(name)) map.set(name, { name, node: fnNode, file: sf.fileName });
}

// ════════════════════════════════════════════════════════════════════
// Hard-fail: TS-constructen MET runtime-effect mogen niet stil geerased worden
// ════════════════════════════════════════════════════════════════════
function assertNoRuntimeTsConstructs(unit) {
  const bad = [];
  const walk = (n) => {
    if (ts.isEnumDeclaration(n)) bad.push("enum");
    else if (ts.isModuleDeclaration(n)) bad.push("namespace/module");
    else if (ts.isClassDeclaration(n) || ts.isClassExpression(n))
      bad.push("class");
    else if (ts.canHaveDecorators?.(n) && ts.getDecorators?.(n)?.length)
      bad.push("decorator");
    else if (
      ts.isParameter(n) &&
      n.modifiers?.some((m) =>
        [
          ts.SyntaxKind.PublicKeyword,
          ts.SyntaxKind.PrivateKeyword,
          ts.SyntaxKind.ProtectedKeyword,
          ts.SyntaxKind.ReadonlyKeyword,
        ].includes(m.kind),
      )
    )
      bad.push("parameter-property");
    ts.forEachChild(n, walk);
  };
  walk(unit.node);
  if (bad.length) {
    throw new Error(
      `STOP: runtime-TS-construct in ${unit.name} (${unit.file}): ${[...new Set(bad)].join(", ")}`,
    );
  }
}

// ════════════════════════════════════════════════════════════════════
// Vrije identifiers (voor rule 2 + de bewaker); property-namen tellen niet als read
// ════════════════════════════════════════════════════════════════════
function usedIdents(node) {
  const s = new Set();
  const walk = (n) => {
    if (ts.isPropertyAccessExpression(n)) {
      walk(n.expression);
      return;
    }
    if (ts.isPropertyAssignment(n) && !ts.isComputedPropertyName(n.name)) {
      walk(n.initializer);
      return;
    }
    if (ts.isIdentifier(n)) s.add(n.text);
    ts.forEachChild(n, walk);
  };
  walk(node);
  return s;
}
function usesThisArgs(fnNode) {
  let hit = false;
  const walk = (n) => {
    if (hit) return;
    if (
      n.kind === ts.SyntaxKind.ThisKeyword ||
      n.kind === ts.SyntaxKind.SuperKeyword
    )
      hit = true;
    else if (ts.isIdentifier(n) && n.text === "arguments") hit = true;
    else if (
      ts.isMetaProperty(n) &&
      n.keywordToken === ts.SyntaxKind.NewKeyword
    )
      hit = true; // new.target
    // ga niet de body van een geneste gewone functie in (die heeft eigen this/arguments)
    if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) return;
    ts.forEachChild(n, walk);
  };
  // begin bij de body zelf (params overslaan is niet nodig)
  ts.forEachChild(fnNode, walk);
  return hit;
}

// ════════════════════════════════════════════════════════════════════
// STAP 5 — de bewaker voor regel 6
// ════════════════════════════════════════════════════════════════════
const ARRAY_CB = new Set([
  "forEach",
  "map",
  "filter",
  "some",
  "every",
  "find",
  "findIndex",
  "sort",
  "reduce",
  "reduceRight",
  "flatMap",
]);
function isWhitelistedCallback(closure) {
  const call = closure.parent;
  if (!call || !ts.isCallExpression(call)) return false;
  if (!call.arguments.includes(closure)) return false;
  const callee = call.expression;
  return (
    ts.isPropertyAccessExpression(callee) && ARRAY_CB.has(callee.name.text)
  );
}
// return {capture: n, escaped: [names]} — vuurt (guard) als escaped.length > 0
function guardScan(fnNode) {
  let capture = 0;
  const escaped = [];
  const isLoop = (n) =>
    ts.isForStatement(n) ||
    ts.isForInStatement(n) ||
    ts.isForOfStatement(n) ||
    ts.isWhileStatement(n) ||
    ts.isDoStatement(n);
  const varNamesIn = (n) => {
    const names = new Set();
    const w = (x) => {
      if (
        ts.isVariableDeclarationList(x) &&
        (x.flags & ts.NodeFlags.Let) === 0 &&
        (x.flags & ts.NodeFlags.Const) === 0
      ) {
        for (const d of x.declarations)
          if (ts.isIdentifier(d.name)) names.add(d.name.text);
      }
      ts.forEachChild(x, w);
    };
    w(n);
    return names;
  };
  const walk = (n) => {
    if (isLoop(n)) {
      const vnames = varNamesIn(n); // var-declaraties in init of body
      if (vnames.size) {
        const closures = [];
        const cw = (x) => {
          if (ts.isFunctionExpression(x) || ts.isArrowFunction(x))
            closures.push(x);
          ts.forEachChild(x, cw);
        };
        // scan alleen de loop-body voor closures
        const body =
          ts.isForStatement(n) ||
          ts.isForInStatement(n) ||
          ts.isForOfStatement(n)
            ? n.statement
            : ts.isWhileStatement(n)
              ? n.statement
              : n.statement;
        if (body) cw(body);
        for (const cl of closures) {
          const reads = usedIdents(cl);
          const capturesVar = [...vnames].some((v) => reads.has(v));
          if (capturesVar) {
            capture++;
            if (!isWhitelistedCallback(cl))
              escaped.push(fnNode.name?.text || "(anon)");
          }
        }
      }
    }
    ts.forEachChild(n, walk);
  };
  walk(fnNode);
  return { capture, escaped };
}

// ════════════════════════════════════════════════════════════════════
// Canonicalisatie + de zes regels (toggle via opt.rules : Set<number>)
// ════════════════════════════════════════════════════════════════════
function litNum(text) {
  return String(Number(text));
}
function stripGetTime(node) {
  if (
    ts.isCallExpression(node) &&
    node.arguments.length === 0 &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "getTime"
  ) {
    return node.expression.expression;
  }
  return node;
}
// rule 4: platte string-partjes (of null als niet bewijsbaar string)
function flattenPlus(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return { parts: [{ s: node.text }], isString: true };
  if (ts.isTemplateExpression(node)) {
    const parts = [{ s: node.head.text }];
    for (const sp of node.templateSpans) {
      parts.push({ e: sp.expression });
      parts.push({ s: sp.literal.text });
    }
    return { parts, isString: true };
  }
  if (ts.isParenthesizedExpression(node)) return flattenPlus(node.expression);
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const L = flattenPlus(node.left),
      R = flattenPlus(node.right);
    if (L.isString || R.isString)
      return { parts: [...L.parts, ...R.parts], isString: true };
  }
  return { parts: [{ e: node }], isString: false };
}
function concatCanon(node, opt) {
  const { parts } = flattenPlus(node);
  const merged = [];
  for (const p of parts) {
    if ("s" in p) {
      if (p.s === "") continue;
      if (merged.length && "s" in merged[merged.length - 1])
        merged[merged.length - 1] = { s: merged[merged.length - 1].s + p.s };
      else merged.push({ s: p.s });
    } else merged.push({ e: p.e });
  }
  return (
    "CONCAT[" +
    merged
      .map((p) => ("s" in p ? "S:" + JSON.stringify(p.s) : ser(p.e, opt)))
      .join("|") +
    "]"
  );
}

// ÉÉN plek waar de declaratiesoort bepaald wordt (FIX A). Onder regel 6 genormaliseerd naar "V",
// anders var/let/const — waar de lijst ook staat (statement, for-init, for-in, for-of).
function declKindTok(dl, opt) {
  if (opt.rules.has(6)) return "V";
  return dl.flags & ts.NodeFlags.Const
    ? "const"
    : dl.flags & ts.NodeFlags.Let
      ? "let"
      : "var";
}
function serDeclarators(dl, opt) {
  return dl.declarations.map((d) => {
    const nm = ser(d.name, opt);
    const init = d.initializer ? "=" + ser(d.initializer, opt) : "";
    return `${nm}${init}`;
  });
}
function serStatement(st, opt) {
  // rule 1 — komma-declaratie splitsen (alleen op statement-niveau); rule 6 — kind-normalisatie
  if (ts.isVariableStatement(st)) {
    const tok = declKindTok(st.declarationList, opt);
    const decls = serDeclarators(st.declarationList, opt);
    if (opt.rules.has(1)) return decls.map((d) => `${tok}(${d})`).join(";");
    return `${tok}(${decls.join(",")})`;
  }
  return ser(st, opt);
}
function serBlockStatements(stmts, opt) {
  return stmts.map((s) => serStatement(s, opt)).join(";");
}
// includeName: naam telt mee bij GENESTE (named) functies, NIET bij de vergeleken top-level
// unit (canonOf roept met includeName=false — matchen gebeurt al op naam/alias).
function serFunc(node, opt, includeName = true) {
  const params = node.parameters
    .map((p) => {
      const nm = ser(p.name, opt);
      const init = p.initializer ? "=" + ser(p.initializer, opt) : "";
      const dots = p.dotDotDotToken ? "..." : "";
      return `${dots}${nm}${init}`;
    })
    .join(",");
  let body;
  if (node.body && ts.isBlock(node.body))
    body = "{" + serBlockStatements(node.body.statements, opt) + "}";
  else if (node.body) {
    // FIX A: een beknopte arrow-body loopt via een ECHTE ReturnStatement door hetzelfde pad
    // als `return x;` — geen handgeschreven label dat het generieke pad naspeelt.
    const ret = ts.factory.createReturnStatement(node.body);
    body = "{" + serBlockStatements([ret], opt) + "}";
  } else body = "{}";
  const tag = opt.rules.has(5)
    ? "FN"
    : ts.isArrowFunction(node)
      ? "ARROW"
      : "FEXPR";
  // FIX B: de naam van een FunctionDeclaration / NAMED FunctionExpression telt mee; anonieme
  // functie-expressies en arrows hebben geen naam en blijven zoals ze zijn.
  const nm =
    includeName &&
    (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
    node.name
      ? ":" + node.name.text
      : "";
  return `${tag}${nm}(${params})${body}`;
}

const SKIP_MODIFIER = new Set([
  ts.SyntaxKind.ExportKeyword,
  ts.SyntaxKind.DeclareKeyword,
  ts.SyntaxKind.ReadonlyKeyword,
  ts.SyntaxKind.PublicKeyword,
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.AbstractKeyword,
  ts.SyntaxKind.OverrideKeyword,
]);

function ser(node, opt) {
  if (!node) return "";
  if (ts.isTypeNode(node)) {
    typeLeaks++;
    return "TYPE_LEAK";
  } // mag NOOIT gebeuren
  // strip: haakjes, as/satisfies, non-null, type-assertie
  if (ts.isParenthesizedExpression(node)) return ser(node.expression, opt);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node))
    return ser(node.expression, opt);
  if (ts.isNonNullExpression(node)) return ser(node.expression, opt);
  if (ts.isTypeAssertionExpression?.(node)) return ser(node.expression, opt);

  switch (node.kind) {
    case ts.SyntaxKind.Identifier: {
      const t = node.text;
      return "id:" + (opt.rename?.get(t) ?? t);
    }
    case ts.SyntaxKind.PrivateIdentifier:
      return "pid:" + node.text;
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return "S:" + JSON.stringify(node.text);
    case ts.SyntaxKind.NumericLiteral:
      return "N:" + litNum(node.text);
    case ts.SyntaxKind.TrueKeyword:
      return "true";
    case ts.SyntaxKind.FalseKeyword:
      return "false";
    case ts.SyntaxKind.NullKeyword:
      return "null";
    case ts.SyntaxKind.ThisKeyword:
      return "this";
    case ts.SyntaxKind.SuperKeyword:
      return "super";
  }
  if (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node)
  ) {
    return serFunc(node, opt);
  }
  if (ts.isPropertyAccessExpression(node)) {
    return (
      "." +
      (node.questionDotToken ? "?" : "") +
      "(" +
      ser(node.expression, opt) +
      "," +
      node.name.text +
      ")"
    );
  }
  if (ts.isElementAccessExpression(node)) {
    return (
      "[](" +
      ser(node.expression, opt) +
      "," +
      ser(node.argumentExpression, opt) +
      ")"
    );
  }
  if (ts.isCallExpression(node)) {
    return (
      "call(" +
      ser(node.expression, opt) +
      "|" +
      node.arguments.map((a) => ser(a, opt)).join(",") +
      ")"
    );
  }
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (
      op === ts.SyntaxKind.PlusToken &&
      opt.rules.has(4) &&
      flattenPlus(node).isString
    )
      return concatCanon(node, opt);
    if (op === ts.SyntaxKind.MinusToken && opt.rules.has(3)) {
      return (
        "bin(-," +
        ser(stripGetTime(node.left), opt) +
        "," +
        ser(stripGetTime(node.right), opt) +
        ")"
      );
    }
    return (
      "bin(" +
      ts.tokenToString(op) +
      "," +
      ser(node.left, opt) +
      "," +
      ser(node.right, opt) +
      ")"
    );
  }
  if (ts.isTemplateExpression(node) && opt.rules.has(4))
    return concatCanon(node, opt);
  if (ts.isVariableStatement(node)) return serStatement(node, opt);
  // FIX A: een kale VariableDeclarationList (for-init / for-in / for-of) draagt óók de soort;
  // zonder deze tak lekte de kop via het generieke pad en was var/let/const daar onzichtbaar.
  if (ts.isVariableDeclarationList(node)) {
    return `${declKindTok(node, opt)}(${serDeclarators(node, opt).join(",")})`;
  }
  if (ts.isBlock(node))
    return "{" + serBlockStatements(node.statements, opt) + "}";
  if (ts.isParameter(node)) {
    const dots = node.dotDotDotToken ? "..." : "";
    return (
      dots +
      ser(node.name, opt) +
      (node.initializer ? "=" + ser(node.initializer, opt) : "")
    );
  }
  // generieke fallback: kind + niet-type, niet-modifier kinderen
  const kids = [];
  ts.forEachChild(node, (c) => {
    if (ts.isTypeNode(c)) return;
    if (c.kind === ts.SyntaxKind.TypeParameter) return;
    if (SKIP_MODIFIER.has(c.kind)) return;
    if (
      c.kind === ts.SyntaxKind.QuestionToken ||
      c.kind === ts.SyntaxKind.ExclamationToken
    )
      return;
    kids.push(ser(c, opt));
  });
  return "K" + node.kind + "(" + kids.join(",") + ")";
}

function canonOf(unit, rules, rename) {
  // top-level unit: naam telt NIET mee (matchen gebeurt op naam/alias; anders breken de aliassen)
  return serFunc(unit.node, { rules, rename }, /*includeName*/ false);
}

// ════════════════════════════════════════════════════════════════════
// Paar-vergelijking + leave-one-out minimale regelset
// ════════════════════════════════════════════════════════════════════
function renameFor(gUnit, cUnit) {
  // rule 2: parameter ongebruikt in BEIDE bodies -> naam neutraliseren
  const rename = new Map();
  const gUsed = gUnit.node.body ? usedIdents(gUnit.node.body) : new Set();
  const cUsed = cUnit.node.body ? usedIdents(cUnit.node.body) : new Set();
  const n = Math.min(
    gUnit.node.parameters.length,
    cUnit.node.parameters.length,
  );
  for (let i = 0; i < n; i++) {
    const gp = gUnit.node.parameters[i].name,
      cp = cUnit.node.parameters[i].name;
    if (!ts.isIdentifier(gp) || !ts.isIdentifier(cp)) continue;
    if (!gUsed.has(gp.text) && !cUsed.has(cp.text)) {
      rename.set(gp.text, "__u" + i);
      rename.set(cp.text, "__u" + i);
    }
  }
  return rename;
}
function equalUnder(gUnit, cUnit, ruleSet) {
  const rename = ruleSet.has(2) ? renameFor(gUnit, cUnit) : new Map();
  return canonOf(gUnit, ruleSet, rename) === canonOf(cUnit, ruleSet, rename);
}
function compare(gUnit, cUnit) {
  if (equalUnder(gUnit, cUnit, new Set()))
    return { bin: "identiek", rules: [] };
  // beschikbare regels voor dit paar
  const avail = new Set([1, 2, 3, 4, 5, 6]);
  if (usesThisArgs(gUnit.node) || usesThisArgs(cUnit.node)) avail.delete(5);
  if (guardScan(gUnit.node).escaped.length > 0) avail.delete(6);
  if (!equalUnder(gUnit, cUnit, avail)) return { bin: "verschil", rules: [] };
  // greedy leave-one-out -> minimale load-bearing set
  const min = new Set(avail);
  for (const r of [...avail]) {
    const test = new Set(min);
    test.delete(r);
    if (equalUnder(gUnit, cUnit, test)) min.delete(r);
  }
  return { bin: "equivalent", rules: [...min].sort((a, b) => a - b) };
}

// ════════════════════════════════════════════════════════════════════
// Zelftests die de run ABREKEN
// ════════════════════════════════════════════════════════════════════
function selfTests() {
  // bewaker-zelftest: het kunstmatige geval MOET ONTSNAPT heten
  const sf = parse(
    "function t(){var f=[];for(var i=0;i<3;i++){f.push(function(){return i;});}return f;}",
    "selftest.js",
    ts.ScriptKind.JS,
  );
  const t = sf.statements.find((s) => ts.isFunctionDeclaration(s));
  const g = guardScan(t);
  if (g.escaped.length === 0)
    throw new Error(
      "STOP: bewaker-zelftest faalde — closure niet als ONTSNAPT betrapt.",
    );

  // ── per-regel-zelftests op kleine hand-snippets (NIET op de echte bron) ──
  // POSITIEF: gelijk MÉT de regel. NEGATIEF: verschil ZÓNDER de regel (anders doet de regel
  // niets, of iets anders normaliseert het al stiekem weg).
  const u = (code, name) => {
    const m = extractUnits([parse(code, "st.js", ts.ScriptKind.JS)]);
    return name ? m.get(name) : [...m.values()][0];
  };
  const eq = (a, b, rules) => equalUnder(a, b, new Set(rules));
  const cases = [
    // regel 1 — komma-declaratie splitsen
    [
      "r1+",
      eq(
        u("function g(){var a=1,b=2;return a+b;}", "g"),
        u("function c(){var a=1;var b=2;return a+b;}", "c"),
        [1],
      ),
      true,
    ],
    [
      "r1-",
      eq(
        u("function g(){var a=1,b=2;return a+b;}", "g"),
        u("function c(){var a=1;var b=2;return a+b;}", "c"),
        [],
      ),
      false,
    ],
    // regel 2 — ongebruikte param (andere naam, in BEIDE ongebruikt)
    [
      "r2+",
      eq(
        u("function g(a,b){return a;}", "g"),
        u("function c(a,zzz){return a;}", "c"),
        [2],
      ),
      true,
    ],
    [
      "r2-",
      eq(
        u("function g(a,b){return a;}", "g"),
        u("function c(a,zzz){return a;}", "c"),
        [],
      ),
      false,
    ],
    // regel 3 — Date-aftrekking
    [
      "r3+",
      eq(
        u("function g(a,b){return a-b;}", "g"),
        u("function c(a,b){return a.getTime()-b.getTime();}", "c"),
        [3],
      ),
      true,
    ],
    [
      "r3-",
      eq(
        u("function g(a,b){return a-b;}", "g"),
        u("function c(a,b){return a.getTime()-b.getTime();}", "c"),
        [],
      ),
      false,
    ],
    // regel 4 — WEL vlak: "a"+b == `a${b}`
    [
      "r4flat+",
      eq(
        u('function g(b){return "a"+b;}', "g"),
        u("function c(b){return `a${b}`;}", "c"),
        [4],
      ),
      true,
    ],
    [
      "r4flat-",
      eq(
        u('function g(b){return "a"+b;}', "g"),
        u("function c(b){return `a${b}`;}", "c"),
        [],
      ),
      false,
    ],
    // regel 4 — NIET vlak: a+b+"c" moet VERSCHILLEN van `${a}${b}c` (a+b kan optellen)
    [
      "r4noflat",
      eq(
        u('function g(a,b){return a+b+"c";}', "g"),
        u("function c(a,b){return `${a}${b}c`;}", "c"),
        [4],
      ),
      false,
    ],
    // regel 5 — funcexpr-block == arrow-concise (dekt ook FIX A via de arrow-kant)
    [
      "r5+",
      eq(
        u("const g = function(x){return x+1;};", "g"),
        u("const c = (x) => x+1;", "c"),
        [5],
      ),
      true,
    ],
    [
      "r5-",
      eq(
        u("const g = function(x){return x+1;};", "g"),
        u("const c = (x) => x+1;", "c"),
        [],
      ),
      false,
    ],
    // regel 6 — var == const
    [
      "r6+",
      eq(
        u("function g(){var a=1;return a;}", "g"),
        u("function c(){const a=1;return a;}", "c"),
        [6],
      ),
      true,
    ],
    [
      "r6-",
      eq(
        u("function g(){var a=1;return a;}", "g"),
        u("function c(){const a=1;return a;}", "c"),
        [],
      ),
      false,
    ],
    // regel 6 — LUS-KOP-vorm (de RISICOPLEK): alleen `for(var i)` vs `for(let i)`, geen closure
    [
      "r6loop+",
      eq(
        u("function g(){var s=0;for(var i=0;i<3;i++){s=s+i;}return s;}", "g"),
        u("function c(){var s=0;for(let i=0;i<3;i++){s=s+i;}return s;}", "c"),
        [6],
      ),
      true,
    ],
    [
      "r6loop-",
      eq(
        u("function g(){var s=0;for(var i=0;i<3;i++){s=s+i;}return s;}", "g"),
        u("function c(){var s=0;for(let i=0;i<3;i++){s=s+i;}return s;}", "c"),
        [],
      ),
      false,
    ],
    // FIX A — beknopte arrow-body == equivalente block-body, ZONDER enige regel
    [
      "fixA",
      eq(
        u("const g = (x) => x+1;", "g"),
        u("const c = (x) => {return x+1;};", "c"),
        [],
      ),
      true,
    ],
    // FIX B — twee GENESTE helpers die alleen in naam verschillen zijn NIET gelijk (alle regels)
    [
      "fixB-nested",
      eq(
        u("function g(){function merge(p){return p;}return 1;}", "g"),
        u("function c(){function anders(p){return p;}return 1;}", "c"),
        [1, 2, 3, 4, 5, 6],
      ),
      false,
    ],
    // FIX B — top-level naam telt NIET mee (anders breken de aliassen)
    [
      "fixB-toplevel",
      eq(
        u("function foo(x){return x;}", "foo"),
        u("function bar(x){return x;}", "bar"),
        [],
      ),
      true,
    ],
  ];
  let n = 0;
  for (const [id, got, want] of cases) {
    n++;
    if (got !== want)
      throw new Error(
        `STOP: regel-zelftest '${id}' faalde (kreeg ${got}, verwacht ${want}).`,
      );
  }

  // FIX B — END-TO-END: het kunstmatige capture-paar MOET via compare() als "verschil" komen
  // (niet identiek, niet equivalent). Dit bewijst dat de bewaker BEREIKBAAR is, niet alleen correct.
  const e2eG = u(
    "function t(){var f=[];for(var i=0;i<3;i++){f.push(function(){return i;});}return f;}",
    "t",
  );
  const e2eC = u(
    "function t(){const f=[];for(let i=0;i<3;i++){f.push(() => i);}return f;}",
    "t",
  );
  const e2e = compare(e2eG, e2eC).bin;
  if (e2e !== "verschil")
    throw new Error(
      `STOP: bewaker end-to-end faalde — compare() gaf '${e2e}', verwacht 'verschil'.`,
    );

  return { guard: "betrapt", rulePairs: n, e2e };
}

// ════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════
function main() {
  mkdirSync(OUT, { recursive: true });
  const st = selfTests();

  const gasUnits = extractUnits(gasSources());
  const cadUnits = extractUnits(cadansSources());

  // alias-verificatie tegen de GAS-bron (een koppeling is zelf een claim)
  const aliasReport = [];
  const aliasPairs = [];
  for (const a of ALIASES) {
    const gOk = gasUnits.has(a.gas),
      cOk = cadUnits.has(a.cadans);
    if (gOk && cOk) {
      aliasPairs.push(a);
      aliasReport.push(`  ${a.gas} -> ${a.cadans} : opgenomen`);
    } else
      aliasReport.push(
        `  ${a.gas} -> ${a.cadans} : WEGGELATEN (${!gOk ? "GAS-naam niet gevonden" : "Cadans-naam niet gevonden"})`,
      );
  }

  // matched pairs: directe naam-overlap + geverifieerde aliassen
  const matched = []; // {gas, cad}
  const usedGas = new Set(),
    usedCad = new Set();
  for (const [name, cUnit] of cadUnits) {
    if (gasUnits.has(name)) {
      matched.push({ g: gasUnits.get(name), c: cUnit });
      usedGas.add(name);
      usedCad.add(name);
    }
  }
  for (const a of aliasPairs) {
    if (usedGas.has(a.gas) || usedCad.has(a.cadans)) continue;
    matched.push({
      g: gasUnits.get(a.gas),
      c: cadUnits.get(a.cadans),
      alias: `${a.gas}->${a.cadans}`,
    });
    usedGas.add(a.gas);
    usedCad.add(a.cadans);
  }

  // hard-fail scan op de matched units (runtime-TS-constructen)
  for (const m of matched) {
    assertNoRuntimeTsConstructs(m.g);
    assertNoRuntimeTsConstructs(m.c);
  }

  // vergelijk + tel regel-dragers
  const bins = { identiek: [], equivalent: [], verschil: [] };
  const ruleCarries = new Map(RULES.map((r) => [r.id, []]));
  let guardCaptureTotal = 0;
  const guardEscaped = [];
  for (const m of matched) {
    const gs = guardScan(m.g.node);
    guardCaptureTotal += gs.capture;
    if (gs.escaped.length) guardEscaped.push(m.g.name);
    const res = compare(m.g, m.c);
    const label = m.alias ? `${m.g.name} (${m.alias})` : m.g.name;
    if (res.bin === "identiek") bins.identiek.push(label);
    else if (res.bin === "verschil") bins.verschil.push(label);
    else {
      bins.equivalent.push(`${label} [${res.rules.join(",")}]`);
      for (const rid of res.rules) ruleCarries.get(rid).push(m.g.name);
    }
  }

  const onlyGas = [...gasUnits.keys()].filter((n) => !usedGas.has(n));
  const onlyCad = [...cadUnits.keys()].filter((n) => !usedCad.has(n));

  if (typeLeaks !== 0)
    throw new Error(
      `STOP: ${typeLeaks} TS-type-fragment(en) lekten in een canonieke string.`,
    );

  // ── uitvoer ──
  const L = [];
  L.push(
    "R0 module 1 — AST-sorteermachine. Geen rechter: 'identiek' is geen kwaliteitsoordeel, 'verschil' geen bug.",
  );
  L.push(`GAS-bron: ${GAS_SRC}  |  Cadans: ${CADANS}`);
  L.push("");
  L.push(`type-lekken: GEEN`);
  L.push(`bewaker-zelftest: ${st.guard}`);
  L.push(`bewaker end-to-end: ${st.e2e}`);
  L.push(`regel-zelftests: ${st.rulePairs} paren, alle geslaagd`);
  L.push("");
  L.push("=== De zes gelijkstellingsregels (VASTGESTELD) ===");
  for (const r of RULES) {
    const fns = ruleCarries.get(r.id);
    L.push(`Regel ${r.id} — ${r.naam}`);
    L.push(`  onderbouwing : ${r.onderbouwing}`);
    L.push(`  voorwaarde   : ${r.voorwaarde}`);
    L.push(`  restrisico   : ${r.restrisico}`);
    L.push(
      `  draagt ${fns.length} verdict(s)` +
        ([1, 2, 3, 6].includes(r.id) && fns.length
          ? `: ${fns.join(", ")}`
          : ""),
    );
  }
  L.push("");
  L.push("=== Alias-map (elke koppeling is een geverifieerde claim) ===");
  L.push(...aliasReport);
  L.push("");
  L.push("=== Bakjes ===");
  L.push(`naam-matches (GAS<->Cadans): ${matched.length}`);
  L.push(`  identiek (alleen canonicalisatie) : ${bins.identiek.length}`);
  L.push(`  equivalent onder regels           : ${bins.equivalent.length}`);
  L.push(`  verschil                          : ${bins.verschil.length}`);
  L.push(`  alleen-in-GAS                     : ${onlyGas.length}`);
  L.push(`  alleen-in-Cadans                  : ${onlyCad.length}`);
  L.push("");
  L.push("=== Bewaker regel 6 ===");
  L.push(`capture-gevallen (var-lusvariabele gevangen): ${guardCaptureTotal}`);
  L.push(
    `daarvan ONTSNAPT (regel 6 vervalt): ${guardEscaped.length}` +
      (guardEscaped.length ? ` -> ${guardEscaped.join(", ")}` : ""),
  );
  L.push("");
  L.push("=== identiek ===");
  L.push(bins.identiek.length ? bins.identiek.join(", ") : "(geen)");
  L.push("");
  L.push("=== equivalent onder [regels] ===");
  L.push(bins.equivalent.length ? bins.equivalent.join("\n") : "(geen)");
  L.push("");
  L.push("=== leesstapel (bakje 'verschil') ===");
  L.push(bins.verschil.length ? bins.verschil.join(", ") : "(geen)");
  L.push("");
  L.push("=== alleen-in-GAS (namen) ===");
  L.push(onlyGas.join(", "));
  L.push("");
  L.push("=== alleen-in-Cadans (namen) ===");
  L.push(onlyCad.join(", "));

  const text = L.join("\n") + "\n";
  writeFileSync(join(OUT, "report.txt"), text);
  writeFileSync(
    join(OUT, "report.json"),
    JSON.stringify(
      {
        typeLeaks,
        guard: st.guard,
        matches: matched.length,
        bins: {
          identiek: bins.identiek.length,
          equivalent: bins.equivalent.length,
          verschil: bins.verschil.length,
          onlyGas: onlyGas.length,
          onlyCad: onlyCad.length,
        },
        ruleCarries: Object.fromEntries(
          [...ruleCarries].map(([k, v]) => [k, v]),
        ),
        guardCaptureTotal,
        guardEscaped,
        verschil: bins.verschil,
        equivalent: bins.equivalent,
      },
      null,
      2,
    ),
  );
  process.stdout.write(text);
}

main();
