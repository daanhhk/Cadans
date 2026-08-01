// Coach-narrative-laag (client, presentatie-only). Zet de machineleesbare engine-`redenCode` (2a) om
// naar een warme, gevarieerde coach-zin. Deterministisch geseed op datum+code+persona zodat dezelfde
// dag altijd dezelfde zin toont (geen Math.random / crypto — verboden op de http-LAN-dev).
//
// Persona-structuur staat er al; alleen de warm-pool is gevuld. disciplined/statistical vallen terug
// op warm (en warm valt terug op de droge reden-string). De settings-kiezer komt in een aparte brok →
// render geeft nu persona "warm" hardcoded.

import type { BlokReview } from "./blok";
import type { MetingBron } from "./effect";
import type { Zone5Key } from "./zonemunt";

export type CoachPersona = "warm" | "disciplined" | "statistical";

/** Guard: een willekeurige (settings-)waarde → een geldige CoachPersona; onbekend → "warm". */
export function normalizeCoachPersona(
  v: string | null | undefined,
): CoachPersona {
  return v === "disciplined" || v === "statistical" || v === "warm"
    ? v
    : "warm";
}

type Pools = Record<string, Partial<Record<CoachPersona, string[]>>>;

const POOLS: Pools = {
  demote_recent_hard: {
    warm: [
      "Je ging gisteren stevig aan de bak — knap gedaan. Vandaag houden we het rustig, want daar landt de winst.",
      "Na een zware dag pak je vandaag een rustige duurrit. Zo verwerkt je lijf de prikkel van gisteren en word je sterker.",
      "Gisteren gaf je alles, dus vandaag mag het zacht. Twee harde dagen op rij zou je herstel opeten — dit is de slimme keuze.",
    ],
  },
  demote_wellness_light: {
    warm: [
      "Je herstel is nog niet helemaal terug, en dat is oké. We houden deze sessie een tandje lichter zodat je opbouwt zonder in te leveren.",
      "Je lijf vraagt nog even om rust. Daarom vandaag wat luchtiger — luisteren naar je herstel is ook trainen.",
      "De signalen wijzen op onvolledig herstel. Geen zorgen: lichter vandaag betekent sterker straks.",
    ],
  },
  demote_wellness_rest: {
    warm: [
      "Vandaag staat rust voorop. Je herstel heeft het even nodig, en een rustdag op het juiste moment maakt je uiteindelijk sneller.",
      "Je lijf geeft aan dat het toe is aan herstel. We schakelen terug naar een rustige dag — geen stap terug, maar een investering.",
      "Rust is vandaag de beste training. Geef je lichaam de ruimte, dan sta je er straks weer fris tegenaan.",
    ],
  },
  catchup_high: {
    warm: [
      "Er bleef deze week wat intensiteit liggen — deze sessie haalt dat mooi in. Zo houd je je week in balans.",
      "Ik heb je schema bijgesteld zodat de intensiteitsprikkel er alsnog in komt. Precies wat je nodig hebt om door te bouwen.",
      "Deze sessie vult de intensiteit aan die nog ontbrak. Even een tandje bijzetten, dan zit je week weer op koers.",
    ],
  },
  catchup_anaerobic: {
    warm: [
      "Je anaerobe prikkel bleef nog liggen — deze sessie haalt 'm in. Kort en pittig, precies wat er miste.",
      "Ik heb je week aangepast zodat de scherpe, anaerobe prikkel er alsnog bij komt. Even diep gaan, dan is je week compleet.",
      "Deze sessie vult het anaerobe tekort aan. Het voelt kort en intens, maar het maakt je week af.",
    ],
  },
  catchup_low: {
    warm: [
      "Er ontbrak nog wat duurvolume deze week — deze rustige rit vult dat aan. De basis waar alles op rust.",
      "Ik heb je schema bijgesteld zodat je duurbasis er alsnog in komt. Rustig tempo, groot effect op de lange termijn.",
      "Deze sessie haalt het duurtekort in. Ontspannen kilometers maken, precies wat je conditie nodig heeft.",
    ],
  },
  key_session: {
    warm: [
      "Dit is je sleutelsessie deze week — de training die je echt vooruit helpt. Ga er met focus in.",
      "Vandaag de belangrijkste prikkel van je blok. Geef 'm de aandacht die-ie verdient, hier zit je progressie.",
      "Je sleutelsessie staat op het menu. Dit is waar je fitheid groeit — maak 'm af.",
    ],
  },
  long_weekend: {
    warm: [
      "Tijd voor je lange rit. Rustig tempo, mooie kilometers — dit is de motor onder je conditie.",
      "Weekend, dus ruimte voor een lange duurrit. Geniet van de kilometers; je bouwt hier je basis.",
      "Je lange rit van de week. Ontspannen aan, lekker doorrijden — de duurbasis waar alles op leunt.",
    ],
  },
  long_with_efforts: {
    warm: [
      "Een lange rit met wat blokken erin. De basis van de duur, met net genoeg pit om scherp te blijven.",
      "Vandaag combineer je duur met een paar inspanningen. Het beste van twee werelden in één rit.",
      "Lange rit met blokken: je pakt je volume én houdt de intensiteit erin. Slim gecombineerd.",
    ],
  },
  long_ride: {
    warm: [
      "Je lange duurrit van de week. Rustig tempo, veel kilometers — dit is de basis waarop al je vorm rust.",
      "Vandaag pak je de lange rit. Ontspannen doorrijden; deze uren bouwen je aerobe motor.",
      "Tijd voor volume. Een lange, rustige rit die je uithoudingsvermogen echt vooruit helpt.",
    ],
  },
  endurance: {
    warm: [
      "Een rustige duurrit vandaag — de aerobe basis waar alles op voortbouwt. Lekker doorrollen op tempo.",
      "Vandaag draait het om duurvolume. Rustig aan, gewoon kilometers maken; dit is de motor onder je conditie.",
      "Duurrit op het programma. Ontspannen tempo, grote winst op de lange termijn — de basis van je fitheid.",
    ],
  },
  easy_no_key: {
    warm: [
      "Een rustige dag zonder zware prikkel — precies goed. Niet elke rit hoeft te knallen.",
      "Vandaag mag het ontspannen. Geen sleutelsessie nodig; rustig rollen houdt je fris.",
      "Kalme dag op het programma. Geniet van de rit zonder druk — herstel en basis in één.",
    ],
  },
  recovery_scheduled: {
    warm: [
      "Ingeplande hersteldag. Rustig aan vandaag, want herstel is waar je vooruitgang wordt vastgelegd.",
      "Vandaag staat herstel gepland. Een makkelijke dag op het juiste moment maakt je sterker.",
      "Hersteldag op het programma. Rustig rollen of even niks — beide zijn prima.",
    ],
  },
  commute: {
    warm: [
      "Je vaste pendelrit. Mooie manier om ongemerkt kilometers te pakken op weg naar je werk.",
      "Woon-werk op de fiets. Rustig aan, gewoon lekker rijden — elke kilometer telt mee.",
      "Je pendelrit staat gepland. Gratis trainingstijd, benut 'm ontspannen.",
    ],
  },
  recovery_post_race: {
    warm: [
      "Herstelweek na je race — je hebt het verdiend. Alles rustig nu, zodat je fris aan het volgende blok begint.",
      "Na een race heeft je lijf herstel nodig. Deze week houden we het licht; je bouwt de vermoeidheid netjes af.",
      "Je komt net uit een race. Rustige week, volledig herstel — dan sta je straks weer met verse benen.",
    ],
  },
  recovery_week: {
    warm: [
      "Herstelweek op het programma. Even gas terug zodat je lichaam de opbouw van de afgelopen weken verwerkt.",
      "Deze week draait om herstel. Lichte sessies, veel rust — hier wordt je vorm vastgelegd.",
      "Tijd om bij te tanken. Een rustige week is geen luxe maar noodzaak; je komt er sterker uit.",
    ],
  },
  test: {
    warm: [
      "Vandaag testen we je FTP. Even alles geven om te zien waar je staat — een mooie graadmeter van je vooruitgang.",
      "Testdag. Warm goed in en ga er vol voor; deze cijfers sturen je komende trainingen.",
      "Tijd om je conditie te meten. Geef je beste inspanning, dan weten we precies waar je staat.",
    ],
  },
  taper_openers: {
    warm: [
      "Openers vandaag — kort en scherp. Je benen wakker maken voor de wedstrijd zonder ze te vermoeien.",
      "Even de scherpte erin met een korte openers-sessie. Fris en snappy richting je race.",
      "Openers op het menu: kort, knackig, dan ben je klaar om te knallen.",
    ],
  },
  taper_race_short: {
    warm: [
      "Korte taper-rit — vers worden voor je race. Minder is nu meer; je laadt op voor het echte werk.",
      "Rustig en kort vandaag. De taper doet z'n werk: je benen worden fris richting de wedstrijd.",
      "Even kort de benen losdraaien. Sparen voor de race — dit is precies goed.",
    ],
  },
  taper_trip_short: {
    warm: [
      "Korte rit om vers te worden voor je trip. Nog even sparen, dan sta je er straks helemaal.",
      "Kort en soepel vandaag richting je reis. Je houdt de scherpte zonder moe te worden.",
      "Even losdraaien voor de trip. Fris aan de start is het halve werk.",
    ],
  },
  taper_trip_endurance: {
    warm: [
      "Taper-duurrit: je houdt je duurvermogen vast voor de meerdaagse. Rustig tempo, wel de kilometers erin.",
      "Richting je trip houd je de duur erin, maar dan ontspannen. Durability zonder de vermoeidheid.",
      "Een rustige lange rit om je basis vast te houden voor de reis. Vers én uithoudend aan de start.",
    ],
  },
};

/** Deterministische pool-index uit de seed (som van charCodes % pool-lengte). Geen RNG. */
function seedIndex(seed: string, len: number): number {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return sum % len;
}

/**
 * coachNarrative — kies een warme coach-zin voor een dag-reden.
 * - `redenCode` null/onbekend → de droge `reden` als vangnet (null → null).
 * - persona-pool leeg/afwezig → fallback naar de warm-pool; ook leeg → droge `reden`.
 * - keuze is deterministisch geseed op `${datum}|${redenCode}|${persona}`.
 */
export function coachNarrative(
  redenCode: string | null,
  reden: string | null,
  datum: string,
  persona: CoachPersona = "warm",
): string | null {
  if (!redenCode) return reden;
  const byPersona = POOLS[redenCode];
  if (!byPersona) return reden;
  const personaPool = byPersona[persona];
  const pool = personaPool?.length ? personaPool : byPersona.warm;
  if (!pool?.length) return reden;
  const idx = seedIndex(`${datum}|${redenCode}|${persona}`, pool.length);
  return pool[idx] ?? reden;
}

// ── LAAG 2 — verlicht-voorstel (per-dag, vandaag) ────────────────────────────
// VOORWAARDELIJKE copy: het aanbod claimt de daad NIET (M55/R3-T24). De engine-varianten
// readinessRegel_/readinessRegelDone_ (coach.ts:637/:664, 1:1 uit Coach.gs) zeggen "Ik heb je …
// verlicht" — verleden tijd, vóór akkoord — en zijn daarom hier BEWUST niet hergebruikt.
// De naam-mapping (readinessEaseNaam_) is wél hergebruikt: dat is een weergavenaam, geen claim.

export type VerlichtBand = "caution" | "rest";

/** Aanbod-regel, vóór akkoord. Biedt aan ("ik kan"), stelt niet vast. */
export function verlichtAanbodRegel(
  band: VerlichtBand,
  score: number | null,
  fromNaam: string,
  toNaam: string,
): string {
  const s = score == null ? "—" : String(score);
  if (band === "caution") {
    return `Je gereedheid is vanochtend matig (${s}). Ik kan je ${fromNaam} verlichten naar ${toNaam} en iets korter maken — fris train je de kwaliteit beter.`;
  }
  return `Je gereedheid is laag (${s}). Een zware sessie stapelt nu vooral vermoeidheid. Ik kan er een rustige rit van maken, of je slaat 'm helemaal over — allebei prima vandaag.`;
}

/** Resultaat-regel, ná akkoord (coachregel op de override-kaart). */
export function verlichtResultaatRegel(
  band: VerlichtBand,
  toNaam: string,
): string {
  return band === "caution"
    ? `Verlicht naar ${toNaam} — fris voor de kwaliteit later.`
    : "Rustig gehouden vandaag — herstel telt nu zwaarder.";
}

/** Resultaat-regel na akkoord op VOLLEDIGE RUST (geen rit). Bewust andere woorden dan de
 * spin-variant ("Rustig gehouden"), zodat de kaart niet suggereert dat er gereden is. */
export function verlichtRustResultaatRegel(): string {
  return "Rust gehouden vandaag — dit is waar de aanpassing gebeurt.";
}

/** Label van de SECUNDAIRE actieknop: volledige rust naast de aangeboden herstelrit. */
export function verlichtRustActieLabel(): string {
  return "Rust vandaag";
}

/** Badge/label op de override-kaart na een rust-akkoord — zelfde woorden als de knop. */
export function verlichtRustBadgeLabel(): string {
  return "Rust gehouden";
}

/** Label van de primaire actieknop; matcht de resultaat-badge (verlichtBadgeLabel). */
export function verlichtActieLabel(band: VerlichtBand, toNaam: string): string {
  return band === "caution" ? `Verlicht naar ${toNaam}` : "Maak rustig";
}

/** Badge/label op de override-kaart ná akkoord — zelfde woorden als de knop. */
export function verlichtBadgeLabel(band: VerlichtBand, toNaam: string): string {
  return band === "caution" ? `Verlicht naar ${toNaam}` : "Rustig gehouden";
}

// ── 3d STAP 2b — verleng-aanbod (opbouwweek-duurrit, per-dag) ─────────────────
// De motor capt de lange rit op de ingestelde dag-minuten (3d stap 2). In een opbouwweek
// biedt de coach VOORWAARDELIJK aan die rit te verlengen als er meer tijd is — biedt aan
// ("ik kan"), claimt de daad NIET (M10/M55). Accept schrijft een long_z2-override met de
// langere duur via de bestaande override-keten. {vanMin} = huidige/gecapte duur, {naarMin} =
// de voorgestelde langere duur.
export function verlengAanbodRegel(vanMin: number, naarMin: number): string {
  return `Opbouwweek — dit is dé week waarin extra duur het meest oplevert. Heb je dit weekend wat meer tijd? Ik kan je duurrit verlengen van ${vanMin} naar ${naarMin} min. Zo niet, dan blijft-ie op je ingestelde ${vanMin}.`;
}

/** Label van de accept-knop. */
export function verlengActieLabel(naarMin: number): string {
  return `Verleng naar ${naarMin} min`;
}

/** Resultaat-regel, ná akkoord (coachregel op de override-kaart). */
export function verlengResultaatRegel(naarMin: number): string {
  return `Verlengd naar ${naarMin} min — de volle opbouw-prikkel dit weekend.`;
}

/** Badge/label op de override-kaart ná akkoord — markeert tevens een verleng-override. */
export function verlengBadgeLabel(naarMin: number): string {
  return `Verlengd naar ${naarMin} min`;
}

// ── 3d STAP 4 — fatigue-aware deload/dose (week-niveau) ───────────────────────
// VOORWAARDELIJKE aanbod-copy: biedt aan ("ik kan…"), claimt de daad NIET (M10/M55). Het signaal
// komt uit de LOAD (TSB = CTL−ATL), niet uit de ochtend-check-in. De applied-copy is FEITELIJK
// (wat er deze week gebeurt), geen belofte over de uitkomst (M5/M18 — geen "je wordt er sterker van").

/** Getekende TSB als geheel getal (min-teken U+2212, zoals tsb.ts/de gauge). */
function tsbLabel_(tsbTrend: number | null): string {
  if (tsbTrend == null) return "—";
  const r = Math.round(tsbTrend);
  return r > 0 ? `+${r}` : r < 0 ? `−${Math.abs(r)}` : "0";
}
/** "+N min deze week" / "−N min deze week" (hele minuten); leeg bij ~0. */
function deltaMinLabel_(deltaMin: number): string {
  const r = Math.round(deltaMin);
  if (r === 0) return "";
  return r > 0 ? ` (+${r} min deze week)` : ` (−${Math.abs(r)} min deze week)`;
}
/** CTL op 1 decimaal met NL-decimaalkomma (UI-string): 45.7 → "45,7". */
function ctlLabel_(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
}

type FatigueBlok = { fromCtl: number; toCtl: number } | null;

/** UP-aanbod (kalender-deload + geen opbouw in het blok → doortrainen). Voorwaardelijk (M55 — "ik
 * kan", geen daad-claim); noemt het GEMETEN BLOK i.p.v. de TSB, zodat de coach toont waarop hij
 * zijn voorstel baseert. */
export function fatigueUpAanbodRegel(
  blok: FatigueBlok,
  deltaMin: number,
): string {
  const ctlClause = blok
    ? `Je CTL ging deze drie weken van ${ctlLabel_(blok.fromCtl)} naar ${ctlLabel_(blok.toCtl)} — het blok heeft je niet belast. `
    : "";
  return `${ctlClause}De kalender plant deze week een deload, maar ik kan gewoon doortrainen${deltaMinLabel_(deltaMin)}.`;
}
/** DOWN-aanbod (opbouwweek + geen opbouw + diepe Form-put → vervroegde deload). Houdt de Form-put
 * (TSB) en krijgt het blok erbij: last zonder winst. Voorwaardelijk (M55). */
export function fatigueDownAanbodRegel(
  tsbTrend: number | null,
  blok: FatigueBlok,
  deltaMin: number,
): string {
  const ctlClause = blok
    ? ` terwijl je CTL van ${ctlLabel_(blok.fromCtl)} naar ${ctlLabel_(blok.toCtl)} ging — belasting zonder winst`
    : "";
  return `Je vorm zit diep (TSB ${tsbLabel_(tsbTrend)})${ctlClause}. Ik kan een vervroegde deload inplannen om je te laten herstellen${deltaMinLabel_(deltaMin)}.`;
}
/** Primaire actieknop (accept). */
export function fatigueActieLabel(dir: "up" | "down"): string {
  return dir === "up" ? "Doortrainen" : "Vervroegde deload";
}
/** Secundaire knop (de kalender volgen; dismiss). */
export function fatigueAlternatiefLabel(dir: "up" | "down"): string {
  return dir === "up" ? "Volg de deload" : "Hou de opbouw";
}
/** Bevestigingsregel in de applied-state — FEITELIJK, geen uitkomst-belofte. */
export function fatigueAppliedRegel(dir: "up" | "down"): string {
  return dir === "up"
    ? "Je traint deze week door in plaats van de deload."
    : "Deze week is een vervroegde deload.";
}

// ── 5a-ii — de BLOK-REVIEW-regel (blok-niveau, terugkijkend) ─────────────────
// FEITELIJK, geen daad-claim en geen belofte over de uitkomst (M5/M18): de regel meldt wat er
// gemeten is en wat dat over het PLAN zegt, niet wat de renner waard is. Vorm volgt
// faseOvergangRegel — geen pool per persona, wel hetzelfde register en een deterministische keuze
// uit twee formuleringen (geseed op het blok, zodat dezelfde kaart niet per render wisselt).
//
// De LEVENDE tak is `geleverd_niet_gestegen` (recon §6): de uitvoering ligt structureel boven het
// plan terwijl de CTL daalt. `niet_geleverd` is het vangnet en vuurt bij deze gebruiker zelden.

/** Woordpaar per fase: het BEOORDEELDE blok en het blok waar de dosis naartoe gaat.
 * `beoordeeld` is de BIJWOORDELIJKE vorm ("vorig blok", zoals "vorige week"); `beoordeeldNP` is
 * dezelfde verwijzing als naamwoordgroep mét lidwoord, voor zinnen waarin het blok ONDERWERP is —
 * "Dan zegt vorig blok …" is fout Nederlands, "Dan zegt het vorige blok …" niet. */
function blokLabels_(fase: "lopend" | "afgerond"): {
  beoordeeld: string;
  beoordeeldNP: string;
  volgend: string;
} {
  return fase === "afgerond"
    ? {
        beoordeeld: "vorig blok",
        beoordeeldNP: "het vorige blok",
        volgend: "dit blok",
      }
    : {
        beoordeeld: "dit blok",
        beoordeeldNP: "dit blok",
        volgend: "het volgende blok",
      };
}

/** Zonenamen exact zoals de UI ze al voert (ZoneBars): één naam per zone in de hele app. */
const ZONE_NAAM_: Record<Zone5Key, string> = {
  rust: "Herstel",
  z2: "Duur",
  tempo: "Tempo",
  drempel: "Drempel",
  anaeroob: "VO2max",
};

/** "Tempo", "Tempo en Drempel", "Tempo, Drempel en VO2max" — bij gelijkstand noemt de coach ze
 * allemaal; welke zone het meest tekortkwam is dan geen keuze maar een gelijkspel. */
function zoneLijst_(zones: Zone5Key[]): string {
  const namen = zones.map((z) => ZONE_NAAM_[z]);
  if (namen.length <= 1) return namen[0] ?? "";
  return `${namen.slice(0, -1).join(", ")} en ${namen[namen.length - 1]}`;
}

export function blokReviewRegel(r: BlokReview): string {
  const g = r.uitvoering.geleverdeWeken;
  const b = r.uitvoering.beoordeeldeWeken;
  const { beoordeeld, beoordeeldNP, volgend } = blokLabels_(r.fase);
  // ZONE-MUNT fase 1b — het getal dat de coach noemt moet het getal zijn waarop het oordeel viel.
  // Dat is niet langer één totaal maar de zone-normen, dus die staan hier in de zin.
  //
  // ROADMAP punt 14 fase 1 — ALLEEN DE VOORGESCHREVEN ZONES. Het oordeel telt ze ook alleen, dus
  // een zin die alle drie noemt zou een norm noemen waarop niet beoordeeld is. Welke zones dat
  // zijn verschilt per week; de zin noemt de zones die in minstens één MEEGETELDE week zijn
  // voorgeschreven.
  const zonesInOordeel = (
    ["tempo", "drempel", "anaeroob"] as Zone5Key[]
  ).filter((z) =>
    r.weeks.some((w) => w.telt && w.zonesVoorgeschreven.includes(z)),
  );
  const normVan_: Record<string, number> = {
    tempo: r.normTempo,
    drempel: r.normDrempel,
    anaeroob: r.normAnaeroob,
  };
  const zoneDelen = zonesInOordeel.map(
    (z) => `${normVan_[z]} ${ZONE_NAAM_[z]}`,
  );
  const zoneNorm =
    zoneDelen.length <= 1
      ? (zoneDelen[0] ?? "")
      : `${zoneDelen.slice(0, -1).join(", ")} en ${zoneDelen[zoneDelen.length - 1]}`;
  const tekort = zoneLijst_(r.uitvoering.tekortZones);
  // Congruentie: "1 van de 3 opbouwweken HAALDE", "2 van de 3 opbouwweken HAALDEN".
  const haalde = g === 1 ? "haalde" : "haalden";
  const kwam = g === 1 ? "kwam" : "kwamen";
  // Idem voor de zone-lijst: "Drempel KWAM tekort", "Tempo en Drempel KWAMEN tekort".
  const tekortKwam = r.uitvoering.tekortZones.length > 1 ? "kwamen" : "kwam";
  const d = r.ctlDelta ?? 0;
  const x = ctlLabel_(Math.abs(d));
  // Negatief → "zakte met X"; nul of licht positief onder de opbouw-drempel → "bleef vlak".
  const ctlZin = d < 0 ? `zakte je CTL met ${x}` : "bleef je CTL vlak";

  let pool: string[];
  let key: string;
  if (r.check?.uitkomst === "geleverd_niet_gestegen") {
    key = "geleverd_niet_gestegen";
    pool = [
      `Je leverde ${beoordeeld} ${g} van de ${b} opbouwweken op alle drie de zones — ${zoneNorm} minuten — en tóch ${ctlZin}. Dan lag het niet aan de uitvoering: het plan was te licht. De dosis mag ${volgend} omhoog.`,
      `${g} van de ${b} opbouwweken haalden ${beoordeeld} elke zone: ${zoneNorm} minuten. En toch ${ctlZin}. Aan de uitvoering lag het dus niet; het plan was te licht. Er mag ${volgend} meer dosis in.`,
    ];
  } else if (r.check?.uitkomst === "geleverd_gestegen") {
    key = "geleverd_gestegen";
    pool = [
      `${g} van de ${b} opbouwweken op norm in elke zone — ${zoneNorm} minuten — en je CTL steeg met ${x}. Dat is precies wat een blok hoort te doen; ${volgend} mag er een trede bij.`,
      `${g} van de ${b} opbouwweken haalden ${zoneNorm} minuten, en je CTL ging ${x} omhoog. Zo hoort een blok te lopen — ${volgend} kan een trede zwaarder.`,
    ];
  } else if (
    r.check?.uitkomst === "niet_geleverd" &&
    r.uitvoering.verschuiving
  ) {
    // ZONE-MUNT fase 1b — de VERSCHUIVING. Er is genoeg getraind, maar in de verkeerde zone. De
    // bruikbare boodschap is dan "verschuiven", niet "meer": de dosis gaat NIET omhoog.
    key = "niet_geleverd_verschuiving";
    pool = [
      `Je trainde ${beoordeeld} genoeg, maar niet waar het telt: ${tekort} bleef onder norm terwijl je in een andere zone juist overhield. ${g} van de ${b} opbouwweken kwamen zo rond. De dosis gaat niet omhoog — die minuten moeten verschuiven naar ${tekort}.`,
      `${g} van de ${b} opbouwweken haalden alle drie de zones, en dat lag niet aan de hoeveelheid: je zat boven norm in de ene zone en onder norm in ${tekort}. Niet méér trainen dus, maar verschuiven naar ${tekort}.`,
    ];
  } else if (r.check?.uitkomst === "niet_geleverd") {
    key = "niet_geleverd";
    pool = [
      `${g} van de ${b} opbouwweken ${haalde} elke zone; ${tekort} ${tekortKwam} het vaakst tekort. Dan zegt ${beoordeeldNP} nog niets over het plan — de dosis blijft staan tot je een blok een keer helemaal draait.`,
      `${g} van de ${b} opbouwweken ${kwam} aan alle drie de zone-normen, met ${tekort} als grootste gat. Zo laat ${beoordeeldNP} niet zien of het plan klopt — de dosis blijft staan tot een blok een keer rond is.`,
    ];
  } else if (r.uitvoering.geleverd) {
    // Niet-opbouwdoel (Onderhoud): de CTL is hier geen meter — die HOORT te zakken.
    key = "onderhoud_geleverd";
    pool = [
      `${g} van de ${b} kwaliteitsweken geleverd. Bij onderhoud is dat de hele vraag — dat je CTL ondertussen zakt hoort erbij.`,
      `${g} van de ${b} kwaliteitsweken staan. Bij onderhoud is dat precies waar het om gaat; een zakkende CTL is hier geen signaal.`,
    ];
  } else {
    key = "onderhoud_niet_geleverd";
    pool = [
      `${g} van de ${b} kwaliteitsweken geleverd. Bij onderhoud is de frequentie de hele vraag; die mag niet wegzakken.`,
      `${g} van de ${b} kwaliteitsweken geleverd. Onderhoud draait op frequentie — daar mag je niet onder zakken.`,
    ];
  }
  return (
    pool[seedIndex(`${r.startMonday}|${key}`, pool.length)] ?? pool[0] ?? ""
  );
}

// ── ROADMAP punt 10 fase B — DE WEEK-TEKORT-STEM ─────────────────────────────
// Staat hier en niet in een eigen module, zodat `zoneLijst_`, `ZONE_NAAM_` en `seedIndex` PRIVÉ
// blijven; ze exporteren of dupliceren zou een tweede bron voor zone-namen opleveren.
//
// DE ZIN STELT VAST EN CLAIMT GEEN DAAD. De app verandert hier niets: hij meldt dat een prikkel
// weg is en dat er deze week geen dag meer staat om hem op te pakken. Beide TERMEN staan erin —
// gevraagd en gereden — want een saldo verbergt zijn termen (WERKWIJZE, "meet beide kanten in
// dezelfde eenheid, en bewaar de termen").
//
// DE TOON IS FUNCTIONEEL EN NIET DEFINITIEF; hij gaat mee in de gezamenlijke coach-copy-ronde,
// samen met het sleutel-inhaalblok en de overname-kaart.

/** Eén tekort-zone met zijn twee termen. ONAFGEROND binnen; deze functie rondt af. */
export interface WeekTekortZin {
  zone: Zone5Key;
  gevraagd: number;
  geleverd: number;
}

export function weekTekortRegel(
  zones: WeekTekortZin[],
  weekMonday: string,
): string {
  if (zones.length === 0) return "";
  const namen = zoneLijst_(zones.map((z) => z.zone));
  // AFRONDEN GEBEURT HIER, één keer, op de grootheid die de zin noemt — de rekenlaag geeft
  // onafgerond terug. Enkelvoud/meervoud volgt het AFGERONDE getal, anders leest "1 minuten".
  const termen = zones
    .map((z) => {
      const gevraagd = Math.round(z.gevraagd);
      const geleverd = Math.round(z.geleverd);
      const eenheid = gevraagd === 1 ? "minuut" : "minuten";
      return `${gevraagd} ${ZONE_NAAM_[z.zone]}-${eenheid} waarvan je er ${geleverd} reed`;
    })
    .join(", en ");
  const enkel = zones.length === 1;
  const die = enkel ? "die prikkel" : "die prikkels";
  const pool = [
    `Je plan vroeg deze week op de dagen die geweest zijn ${termen}. Er staat geen trainingsdag meer om ${die} op te pakken.`,
    `Op de verstreken dagen van deze week stond ${termen}. ${enkel ? "Die prikkel is" : "Die prikkels zijn"} weg: er komt geen trainingsdag meer om ${enkel ? "hem" : "ze"} in te halen.`,
  ];
  return (
    pool[seedIndex(`${weekMonday}|weektekort|${namen}`, pool.length)] ??
    pool[0] ??
    ""
  );
}

// ── 5b-i — de EFFECT-regel (heeft het blok gewerkt) ──────────────────────────
// VOORWAARDELIJK (M55): de coach biedt aan en stelt niet vast. Bij `niet_meetbaar` doet hij
// EXPLICIET geen uitspraak — dat is het hele punt van de derde toestand: niet concluderen uit
// afwezig bewijs. De getallen komen uit de meting, niet uit een schatting.

/** "Je ging voor het laatst vol …" per bron. Bij een SPRONG noemt de coach GEEN ritsoort — hij
 * weet niet wat voor rit het was, alleen dat de meter omhoogging. Geen wattwaarden hier: die zitten
 * niet in het meegegeven object en worden dus niet verzonnen. */
function metingZin_(
  m: { bron: MetingBron; datum: string },
  maanden: number,
): string {
  const terug = `ongeveer ${maanden} ${maanden === 1 ? "maand" : "maanden"} terug`;
  const wanneer = `${datumKort_(m.datum)}, ${terug}`;
  if (m.bron === "test")
    return `Je ging voor het laatst vol tijdens je test van ${wanneer}.`;
  if (m.bron === "race")
    return `Je ging voor het laatst vol tijdens je wedstrijd van ${wanneer}.`;
  return `Je ging voor het laatst vol op ${wanneer}; je rolling FTP sprong daar omhoog.`;
}

const GELEGENHEID_NAAM_: Record<string, string> = {
  test: "de test",
  race: "de wedstrijd",
};

/** "21 mei" — korte NL-datum uit een yyyy-MM-dd. */
function datumKort_(iso: string): string {
  const maanden = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${maanden[Number(m[2]) - 1] ?? ""}`.trim();
}

/** De effect-regel, of null als er geen effect-referent is (dan zwijgt de coach erover). */
export function blokEffectRegel(r: BlokReview): string | null {
  const e = r.effect;
  if (!e) return null;
  const gelegenheid =
    e.gelegenheid.bron != null
      ? `${GELEGENHEID_NAAM_[e.gelegenheid.bron] ?? "de inspanning"}${
          e.gelegenheid.datum ? ` van ${datumKort_(e.gelegenheid.datum)}` : ""
        }`
      : "";

  let pool: string[];
  let key: string;
  if (e.uitkomst === "gestegen") {
    key = "gestegen";
    pool = [
      `Je rolling FTP ging van ${e.instap} naar ${e.maximum} watt. Dat is precies de winst waar dit blok voor bedoeld was.`,
      `De rolling FTP staat op ${e.maximum} watt, ${e.verschil} boven de ${e.instap} waarmee je het blok inging — de winst die dit blok moest opleveren.`,
    ];
  } else if (e.uitkomst === "niet_gestegen" && e.dosisTerm === "tijd_in_zone") {
    key = "niet_gestegen_tijd_in_zone";
    pool = [
      `Bij ${gelegenheid} bleef je rolling FTP op ${e.maximum} watt staan, tegen ${e.instap} bij de start. Je belasting bouwde wél op, dus de kwaliteitsdosis was te licht — daar mag tijd-in-zone bij.`,
      `${gelegenheid} leverde geen hogere rolling FTP op: ${e.maximum} watt tegen ${e.instap} bij de start. De belasting groeide wel, dus het zat niet in de opbouw maar in de prikkel; ik kan de tijd-in-zone verhogen.`,
    ];
  } else if (e.uitkomst === "niet_gestegen" && e.dosisTerm === "volume") {
    key = "niet_gestegen_volume";
    pool = [
      `Bij ${gelegenheid} bleef je rolling FTP op ${e.maximum} watt staan, tegen ${e.instap} bij de start. Je belasting bouwde ook niet op, dus méér drempeltijd is niet het antwoord — de ruimte zit in het volume, om te beginnen bij de lange rit.`,
      `${gelegenheid} leverde geen hogere rolling FTP op: ${e.maximum} watt tegen ${e.instap}. De belasting stond stil, dus harder trainen lost dit niet op; ik kan beter volume toevoegen, te beginnen bij de lange rit.`,
    ];
  } else {
    key = "niet_meetbaar";
    // GEEN VRAAG meer. De oude variant eindigde op "zullen we een test inplannen?" en die vraag
    // keerde elk blok terug zonder dat er iets veranderde. De coach constateert nu, noemt wanneer
    // hij voor het laatst een maximum zag, en zegt WANNEER hij zelf een test zou voorstellen —
    // zonder een datum te noemen, want die schuift zodra er een wedstrijd bijkomt.
    const laatstZin = r.laatsteMeting
      ? r.laatsteMeting.bron === "inspanning"
        ? ` Je ging voor het laatst vol op ${datumKort_(r.laatsteMeting.datum)}; je rolling FTP sprong daar omhoog.`
        : ` Je ging voor het laatst vol tijdens je ${r.laatsteMeting.bron === "test" ? "test" : "wedstrijd"} van ${datumKort_(r.laatsteMeting.datum)}.`
      : " Ik heb nog geen maximale inspanning van je gezien.";
    pool = [
      `Er stond in dit blok geen test of wedstrijd, dus over je vorm doe ik hier geen uitspraak. Dat is geen slecht nieuws — het is een ontbrekende meting.${laatstZin} Loopt dat richting drie maanden, dan stel ik in een rustweek een test voor.`,
      `Geen test en geen wedstrijd dit blok, dus je rolling FTP zakt vanzelf; daar valt niets uit af te lezen. Geen tegenvaller, wel een gat in de meting.${laatstZin} Zit daar straks zo'n drie maanden tussen, dan kom ik in een rustweek met een testvoorstel.`,
    ];
  }
  return (
    pool[seedIndex(`${r.startMonday}|effect|${key}`, pool.length)] ??
    pool[0] ??
    ""
  );
}

// ── 5b-ii — HET TESTVOORSTEL ─────────────────────────────────────────────────
// VOORWAARDELIJK (M55): "ik kan", nooit een daad-claim. De coach biedt de meting aan, hij legt 'm
// niet op — en hij zegt erbij WAAROM het nut heeft, want een test kost een dag.

/** Aanbod-regel voor de test. `dagenSinds` telt tot de VOORGESTELDE testdatum, niet tot vandaag. */
export function testAanbodRegel(o: {
  weekdag: string;
  beschikbaarMin: number;
  laatsteMeting: { bron: MetingBron; datum: string } | null;
  dagenSinds: number | null;
}): string {
  const maanden = o.dagenSinds != null ? Math.round(o.dagenSinds / 30) : null;
  const sinds =
    o.laatsteMeting && maanden != null
      ? `${metingZin_(o.laatsteMeting, maanden)} `
      : "Ik heb nog geen maximale inspanning van je gezien, dus ik heb geen ijkpunt. ";
  return `Dit blok loopt af. ${sinds}Ik kan er op ${o.weekdag} een 20-minutentest van maken: een uur totaal, rustig inrijden, twintig minuten alles geven, uitrijden. Dan weet het volgende blok waarop het doseert.`;
}

/** Primaire actieknop. */
export function testActieLabel(weekdag: string): string {
  return `Plan de test op ${weekdag}`;
}

/** Secundaire knop — afwijzen geldt voor dit hele blok, niet voor die ene dag. */
export function testAfwijsLabel(): string {
  return "Niet dit blok";
}

/** CONSTANTE marker: gaat als `label` mee op de override én is waarop `testResultaat` matcht
 * (zelfde patroon als `verlengBadgeLabel`). Wijzigt deze string, dan herkent de dagkaart oude
 * overrides niet meer — dus niet zomaar aanpassen. */
export function testBadgeLabel(): string {
  return "FTP-test gepland";
}

/** Resultaat-regel op de override-kaart ná akkoord — FEITELIJK, geen belofte over de uitkomst. */
export function testResultaatRegel(weekdag: string): string {
  return `FTP-test op ${weekdag} — twintig minuten alles geven; die waarde ijkt je volgende blok.`;
}

/** De volledige blok-uitspraak: uitvoering eerst, dan effect. Zonder effect blijft het de
 * bestaande regel — `blokReviewRegel` blijft daarom ONGEWIJZIGD geëxporteerd. */
export function blokReviewNarrative(r: BlokReview): string {
  const uitvoering = blokReviewRegel(r);
  const effect = blokEffectRegel(r);
  return effect ? `${uitvoering} ${effect}` : uitvoering;
}

// ── FASE 2b — inhaal-voorstel (week-niveau, read-only) ───────────────────────
// ── M51/M10 — fase-overgang aankondigen (week-niveau, alleen tekst) ───────────
// Vooruitkijkend, GEEN daad-claim (M55: "vanaf deze week", nooit "Ik heb ..."). De regel noemt
// ALTIJD drie dingen: wat verandert, waarom (het event + het aantal weken, als er een event is),
// en wat de renner gaat merken. Zonder event valt het event-deel weg; de regel loopt dan nog.
// De detectie onderdrukt "Test" al (tellerartefact) → geen testweek-regel meer.

/** Toonbare fase (Base/Build/Peak/Taper) → {verandering, merk}. "Recovery" is een aparte vorm
 * (herstelt, noemt het event bij naam zonder countdown — zie hieronder). */
const FASE_STREKKING_: Record<string, { verandering: string; merk: string }> = {
  Build: {
    verandering: "schakel je van basis naar opbouw",
    merk: "je kwaliteitsblokken worden langer en specifieker",
  },
  Peak: {
    verandering: "ga je de piekfase in",
    merk: "de scherpte gaat omhoog en het volume iets omlaag",
  },
  Taper: {
    verandering: "begin je te taperen",
    merk: "minder volume, de scherpte blijft — zo kom je fris aan de start",
  },
  Base: {
    verandering: "ga je terug naar rustig basiswerk",
    merk: "de opbouw komt later",
  },
};

function wekenLabel_(n: number): string {
  return n === 1 ? "1 week" : `${n} weken`;
}

/** De aankondigingsregel voor een fase-overgang (naar/eventNaam/wekenTotEvent).
 *
 * ÉÉN VORM, gedreven door het fase-VERSCHIL: `detectFaseOvergang` vergelijkt deze week met de
 * vorige en meldt de kanteling. Deze regel kondigt dus aan wat er GEBEURT.
 *
 * BIJGEWERKT BIJ ROADMAP PUNT 9 FASE B. Hier stond "event_overname bestaat niet", en dat klopt
 * niet meer: de overname bestaat sindsdien als expliciet MOMENT, met een eigen kaart en een
 * bewaard antwoord. Die kaart stelt de VRAAG; deze regel doet de aankondiging pas als het
 * antwoord de fase daadwerkelijk heeft laten kantelen. De overname is dus een bevestigde keuze
 * geworden en geen tijdsverloop meer — maar het blijft één vorm, want de aankondiging leest
 * alleen het verschil en niet de reden. */
export function faseOvergangRegel(o: {
  naar: string;
  eventNaam: string | null;
  wekenTotEvent: number | null;
}): string {
  // Herstelweek: noem het event bij naam, GEEN countdown ("nog 0 weken" is ruis — de race is net af).
  if (o.naar === "Recovery") {
    const naam = o.eventNaam ?? "je event";
    return `Vanaf deze week kom je in een herstelweek: ${naam} zit erop, deze week draait om herstel.`;
  }
  const s = FASE_STREKKING_[o.naar] ?? {
    verandering: "verandert je trainingsfase",
    merk: "je plan wordt hierop aangepast",
  };
  const ev = o.eventNaam;
  const wk = o.wekenTotEvent;
  // "waarom": het event + het aantal weken, indien aanwezig.
  const waarom =
    ev != null
      ? ` richting ${ev}${wk != null ? ` (nog ${wekenLabel_(wk)})` : ""}`
      : "";
  return `Vanaf deze week ${s.verandering}${waarom}: ${s.merk}.`;
}
