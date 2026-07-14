// Coach-narrative-laag (client, presentatie-only). Zet de machineleesbare engine-`redenCode` (2a) om
// naar een warme, gevarieerde coach-zin. Deterministisch geseed op datum+code+persona zodat dezelfde
// dag altijd dezelfde zin toont (geen Math.random / crypto — verboden op de http-LAN-dev).
//
// Persona-structuur staat er al; alleen de warm-pool is gevuld. disciplined/statistical vallen terug
// op warm (en warm valt terug op de droge reden-string). De settings-kiezer komt in een aparte brok →
// render geeft nu persona "warm" hardcoded.

export type CoachPersona = "warm" | "disciplined" | "statistical";

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
