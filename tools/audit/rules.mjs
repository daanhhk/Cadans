// The six equivalence rules — FIXED. Do not add a seventh here to shrink a count.
// Each rule is a reviewable claim: id, onderbouwing, voorwaarde, restrisico.
// Daan reviews THIS list, not the code. The strings are printed at the top of every run.
export const RULES = [
  {
    id: 1,
    naam: "komma-declaratie splitsen",
    onderbouwing:
      "`var a=1, b=2;` is semantisch twee losse declaraties; volgorde en scope blijven exact gelijk.",
    voorwaarde: "Symmetrisch op beide kanten; declaratie-volgorde behouden.",
    restrisico:
      "Geen — het is een zuivere AST-herschrijving zonder evaluatie-verschil.",
  },
  {
    id: 2,
    naam: "ongebruikte parameternaam negeren",
    onderbouwing:
      "Een parameter die in BEIDE bodies nergens gelezen wordt heeft geen betekenis (Biome's _-conventie).",
    voorwaarde:
      "Alleen als de parameter op dezelfde positie in beide bodies ongebruikt is; de naam wordt dan geneutraliseerd.",
    restrisico:
      "Geen — een niet-gelezen bindingsnaam kan het gedrag niet beïnvloeden.",
  },
  {
    id: 3,
    naam: "datum-aftrekking",
    onderbouwing:
      "`a - b` gelijk aan `a.getTime() - b.getTime()`: `-` op een Date doet ToPrimitive->valueOf->getTime.",
    voorwaarde:
      "Alleen binnen een `-`-expressie; `.getTime()` wordt van elke operand gestript.",
    restrisico:
      "Een operand die géén Date is maar wél een `.getTime()` heeft met afwijkende valueOf; in de praktijk Date-only.",
  },
  {
    id: 4,
    naam: "template-literal gelijk aan string-concat",
    onderbouwing:
      "Een template en een string-concatenatie leveren dezelfde string zolang elke `+` een string-kant heeft.",
    voorwaarde:
      "Trek een +-keten alleen vlak zolang elke + bewijsbaar een string-kant heeft; anders is de sub-keten een ondoorzichtige operand. Plak aangrenzende string-literals; laat lege strings weg.",
    restrisico:
      "Verschilt alleen bij een object-operand waarvan valueOf en toString uiteenlopen.",
  },
  {
    id: 5,
    naam: "pijlfunctie gelijk aan functie-expressie",
    onderbouwing:
      "Een arrow en een function-expressie zijn gedrags-equivalent; een beknopte body is Block(Return(expr)).",
    voorwaarde:
      "Geen this/arguments/super/new.target in BEIDE bodies (mechanisch gecontroleerd), anders vervalt de regel.",
    restrisico:
      "Een arrow kan niet met `new` aangeroepen worden; buiten die aanroepvorm gelijk.",
  },
  {
    id: 6,
    naam: "declaratiesoort var/let/const gelijkgesteld",
    onderbouwing:
      "Hoisting/TDZ/redeclaratie/blok-lek zijn compileerfouten in een strict-compilerende port en kunnen dus niet stil verschillen.",
    voorwaarde:
      "Vervalt voor een functie waar de bewaker (STAP 5) een var-lusvariabele ziet die door een OVERLEVENDE closure gevangen wordt.",
    restrisico:
      "Uitsluitend een closure die een var-lusvariabele vangt én de ronde overleeft — precies wat de bewaker afvangt.",
  },
];

export const VOCAB_FORBIDDEN = ["pass", "fail", "✓", "✔", "✗", "×", "dood"];
