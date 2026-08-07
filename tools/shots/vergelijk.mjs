// Byte-vergelijker voor twee shot-bomen.
//
//     node tools/shots/vergelijk.mjs <linksPad> <rechtsPad>
//
// UITSLUITEND .png. De .txt blijft er bewust buiten: die draagt aantoonbaar wisselende tellers
// (synctijdstempel, request-telling) en zou drift melden die er niet is.
//
// SLUIT ZELF NIETS UIT. Er is geen uitsluitingslijst — een instrument dat vooraf besluit wat het
// niet ziet, kan een uitsluiting nooit meer weerleggen. Wie `v7/09-vorm.png` en
// `v7/10-trainingen.png` wil uitsluiten, doet dat in de UITSLAG en met reden en aantal.
//
// EXITCODE ALTIJD 0, ongeacht de uitslag. Dit is een meetinstrument en geen poort.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const [links, rechts] = process.argv.slice(2);
if (!links || !rechts) {
  process.stderr.write(
    "gebruik: node tools/shots/vergelijk.mjs <linksPad> <rechtsPad>\n",
  );
  process.exit(0);
}

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

/** Alle .png onder `wortel`, gesleuteld op het pad RELATIEF aan die wortel. */
function verzamel(wortel) {
  const uit = new Map();
  const ga = (dir) => {
    for (const naam of readdirSync(dir)) {
      const pad = join(dir, naam);
      if (statSync(pad).isDirectory()) ga(pad);
      else if (naam.endsWith(".png"))
        uit.set(relative(wortel, pad).replace(/\\/g, "/"), pad);
    }
  };
  ga(wortel);
  return uit;
}

const L = verzamel(resolve(links));
const R = verzamel(resolve(rechts));

// DE NOEMER IS DE DOORSNEDE. Een bestand dat maar aan één kant staat is geen "verschil" maar een
// ANDERE BOOM, en wordt bij naam genoemd in plaats van stil uit de telling te vallen.
const gedeeld = [...L.keys()].filter((k) => R.has(k)).sort();
const alleenLinks = [...L.keys()].filter((k) => !R.has(k)).sort();
const alleenRechts = [...R.keys()].filter((k) => !L.has(k)).sort();

/**
 * DE CLASSIFICATIE, en zonder haar is een uitslag niet toe te wijzen.
 *
 * Pixelverschil bij GELIJKE innerText is de punt-23-familie: hetzelfde scherm, andere bytes —
 * een animatie of een subpixel-rendering. Een VERSCHILLENDE innerText is de punt-36-familie: het
 * scherm toont iets anders, dus het PLAN bewoog en niet de camera. Twee verschillende defecten
 * met twee verschillende reparaties; een teller die ze op één hoop gooit meet geen van beide.
 *
 * Neemt alles NA de regel die op " innerText ---" eindigt. De kop erboven blijft er bewust
 * buiten: die draagt het synctijdstempel en de request-telling, en die wisselen aantoonbaar.
 */
function innerTextBlok(pngPad) {
  const txt = pngPad.replace(/\.png$/, ".txt");
  if (!existsSync(txt)) return null;
  const regels = readFileSync(txt, "utf8").split(/\r?\n/);
  const start = regels.findIndex((r) => r.endsWith(" innerText ---"));
  return start === -1 ? null : regels.slice(start + 1).join("\n");
}

function classificeer(padL, padR) {
  const a = innerTextBlok(padL);
  const b = innerTextBlok(padR);
  if (a === null || b === null) return "niet te bepalen";
  return a === b ? "gelijk" : "verschilt";
}

let identiek = 0;
for (const sleutel of gedeeld) {
  const padL = L.get(sleutel);
  const padR = R.get(sleutel);
  const a = readFileSync(padL);
  const b = readFileSync(padR);
  if (a.length === b.length && sha(a) === sha(b)) identiek++;
  else
    process.stdout.write(
      `BEWOGEN  ${sleutel}  ${a.length} -> ${b.length} bytes  ` +
        `innerText: ${classificeer(padL, padR)}\n`,
    );
}

for (const sleutel of alleenLinks)
  process.stdout.write(`ALLEEN-LINKS   ${sleutel}\n`);
for (const sleutel of alleenRechts)
  process.stdout.write(`ALLEEN-RECHTS  ${sleutel}\n`);

process.stdout.write(
  `IDENTIEK: ${identiek} van de ${gedeeld.length} vergeleken · ` +
    `alleen-links: ${alleenLinks.length} · alleen-rechts: ${alleenRechts.length}\n`,
);
