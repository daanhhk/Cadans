# Punt 47 — recon: ijking en doelcheck

Read-only gemeten op `ad10bf7`, werkboom schoon. Zes vragen, elk met vindplaats (bestand plus
symboolnaam) en de verbatim bronregels waarop het antwoord rust. Er is niets nagebouwd en niets
geïnterpreteerd waar de bron zelf spreekt.

De verwachting die bij de opdracht hoorde stond op vier punten. **Twee ervan zijn GEVALLEN**, en die
staan daarom hier bovenaan.

## 0a. GEVALLEN — er BESTAAT wél een twaalfweekse blokgrens, en hij levert zelfs een DATUM

De verwachting was dat de code alleen de vierweekse blokklok en de twaalf-cyclus van de macrofase
kent. Dat is onjuist. `doelTestWeken_` in `packages/engine/src/niveau.ts` rekent de MAANDAG van de
testweek van het lopende twaalfweekse blok uit en geeft het aantal weken daarnaartoe terug. Dat is
precies een grootheid die de doelblokgrens draagt. Zie vraag 1 voor de bronregels.

## 0b. GEVALLEN — `doelStart` WORDT herschreven bij een doelwissel

De verwachting was dat `doelStart` blijft staan. Dat is onjuist voor een WISSEL: `blokStartBijDoel`
in `apps/web/src/lib/settings.ts` geeft de geladen blokstart alléén ongewijzigd terug wanneer oud en
nieuw doel na normalisatie GELIJK zijn; bij een echte wissel levert hij een verse maandag. Wat wél
klopt is iets anders: `doelStart` schuift niet automatisch op wanneer een blok afloopt. Die twee
uitspraken zijn allebei waar en worden makkelijk verward. Zie vraag 3.

De twee overige verwachtingen HIELDEN: de grondstof voor een beste 20-minutenvermogen over een vrij
venster ontbreekt (vraag 5), en de grond onder het sprong-verschil is de circulariteit en raakt
alleen de doelcheck (vraag 6).

## 0c. DE CANON-TEGENSPRAAK UIT HANDOFF BESTAAT NIET

Het STAND-blok van 22-08-2026 noemt een tegenspraak tussen punt 47 en `DOELEN-SPEC` §3.2: punt 47
zou zeggen dat ijking en doelcheck bij Onderhoud SAMENVALLEN in de 20-minutentest, terwijl §3.2 daar
het beste 20-minutenvermogen over zes weken vastlegt. Die claim rust op de EERSTE HELFT van punt 47.
Het punt weerlegt zijn eigen samenvallen-formulering twee alinea's verder, in de alinea die begint
met "BIJ ONDERHOUD LOPEN DE TWEE HELFTEN UIT ELKAAR": daar staat verbatim dat "samenvallen" *"waar
[is] over de meter en onwaar over de VRAAG"*. Er is dus geen canon-conflict tussen twee documenten,
maar een formulering die binnen één punt eerst grof en daarna precies is. **Wat wél openstaat is de
MAAT**: §3.2 wijst een grootheid aan die niet in code bestaat (vraag 5). Dat is een bouwvraag, geen
tegenspraak. Het bestaande STAND-blok is hier niet gewijzigd — zie de werkwijze-regel dat een
STAND-blok een momentopname is.

## 1. Draagt iets de grens van een TWAALFWEEKS doelblok?

**JA.** Er zijn drie dragers, oplopend in concreetheid.

De constante en de cyclus, `packages/engine/src/phase.ts`, `DOEL_BLOK_WEKEN` en
`computeMacroPhase`:

```
export const DOEL_BLOK_WEKEN = 12;
```

```
  // Cyclisch 1..DOEL_BLOK_WEKEN. De oude cap `if (week > 12) week = 12` is hiermee overbodig: de
  // blokweek kan per constructie niet meer boven de blok-lengte komen.
  var week = ((absWeek - 1) % DOEL_BLOK_WEKEN) + 1;
  var blokNr = Math.floor((absWeek - 1) / DOEL_BLOK_WEKEN) + 1;

  var fase,
    isTestWeek = false;
  if (week <= 4) fase = "Base";
  else if (week <= 8) fase = "Build";
  else if (week <= 11) fase = "Peak";
  else {
    fase = "Test";
    isTestWeek = true;
  }
  return { week: week, fase: fase, isTestWeek: isTestWeek, blokNr: blokNr };
```

`blokNr` telt het hoeveelste twaalfweekse blok sinds `doelStart`; `week === 12` is de laatste week
van dat blok en zet `isTestWeek`. De docstring erboven zegt het expliciet:

```
 * De blokweek is nu cyclisch 1..12; `blokNr` telt het hoeveelste blok sinds `doelStart`. Loopt
 * een blok af zonder dat er een nieuw doel is gekozen, dan begint gewoon een volgend blok met
 * hetzelfde doel.
```

De DATUM-drager, `packages/engine/src/niveau.ts`, `doelTestWeken_`:

```
  // Het blok waarin `today` valt, 0-gebaseerd; de testweek is er de laatste week van.
  var blokIdx = Math.floor((absWeek - 1) / DOEL_BLOK_WEKEN);
  var testWeekAbs = blokIdx * DOEL_BLOK_WEKEN + DOEL_BLOK_WEKEN;
  // De maandag van die testweek, in kalenderdagen vanaf `doelStart` — DST-veilig.
  var testMaandag = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + (testWeekAbs - 1) * 7,
  );
  var days = Math.round((testMaandag.getTime() - today.getTime()) / 86400000);
  return Math.max(0, Math.ceil(days / 7));
```

Dit is de grootheid die punt 47 nodig heeft: hij ankert op het LOPENDE blok, herhaalt met elk blok,
en levert een concrete maandag. De enige consument vandaag is `apps/web/src/pages/Niveau.tsx` — de
niveaukaart, niet de blok-terugblik en niet het testaanbod.

**WAT ER MINIMAAL BIJ ZOU MOETEN.** Niets nieuws om de grens te KENNEN; wel om hem te GEBRUIKEN.
`buildTestVoorstel` (`apps/web/src/lib/testvoorstel.ts`) hangt vandaag aan de VIERWEEKSE klok —
poort (1) toetst `blokWeekVanWeek(...) !== BLOK_WEKEN`, en `BLOK_WEKEN` is 4. Een ijking die op de
doelblokgrens hoort te vallen (M90a) moet dus op `doelTestWeken_` of op `computeMacroPhase().week`
gaan hangen in plaats van op `blokWeekVanWeek`. Dat is een omhanging, geen nieuwe grootheid.

Let op de valkuil die `packages/engine/src/phase.ts` zelf benoemt: twee klokken die uiteen kunnen
lopen —

```
 * blok-lengte uiteen kunnen lopen — `computeMacroPhase` hier en `doelTestWeken_` in `niveau.ts`
```

## 2. `TEST_INTERVAL_DAGEN` en `WEDSTRIJD_HORIZON_DAGEN`

**90 en 28 dagen, en hun herkomst staat er verbatim bij: BELEID.**
`apps/web/src/lib/testvoorstel.ts`:

```
/** Hoogstens ~vier metingen per jaar: pas na zoveel dagen sinds de laatste maximale inspanning
 * biedt de coach een test aan. BELEID, geen gemeten drempel. */
export const TEST_INTERVAL_DAGEN = 90;
/** Komt er binnen dit venster een A/B-wedstrijd aan, dan IS die de meting en biedt de coach geen
 * test aan. BELEID. */
export const WEDSTRIJD_HORIZON_DAGEN = 28;
```

Twee naburige constanten in hetzelfde bestand dragen hun herkomst NIET: `TEST_MIN_BESCHIKBAAR_MIN`
(60) en `TEST_DUUR_MIN` (60) hebben een functionele toelichting maar geen herkomst-etiket.

Buiten de code staat de herkomst één keer opgeschreven, in `docs/HANDOFF-ARCHIEF.md`: *"DE DREMPELS
ZIJN BELEID, GEEN GEIJKTE SIGNALEN."*, met de vier waarden erbij en de grond dat een test een zware
dag kost en vier weken te kort is om winst te zien. Dat blok is gearchiveerd en wordt door de opener
niet meer opgehaald.

**RAAKVLAK MET M90b.** `TEST_INTERVAL_DAGEN` = 90 is een DAGEN-interval; M90b spreekt van één
ijkinspanning per DOELBLOK. Twaalf weken is 84 dagen, dus de twee vallen dicht bij elkaar maar niet
samen: bij een blokgrens op dag 84 onderdrukt de 90-dagenpoort het aanbod nog zes dagen. Wie M90b
bouwt, kiest expliciet welke van de twee bindt.

## 3. Wordt `doelStart` herschreven bij een doelWISSEL?

**JA bij een wissel; NEE bij het aflopen van een blok.** `apps/web/src/lib/settings.ts`,
`blokStartBijDoel`:

```
export function blokStartBijDoel(
  geladenDoel: string | null | undefined,
  geladenBlokStart: string,
  nieuwDoel: string | null | undefined,
  vandaagISO: string,
): string {
  if (normalizeDoel_(geladenDoel ?? "") === normalizeDoel_(nieuwDoel ?? "")) {
    return geladenBlokStart;
  }
```

Gelijk doel na normalisatie → de geladen blokstart ongewijzigd terug. Ongelijk → de functie rekent
door naar een maandag: die van DEZE week als de wisseldag maandag tot en met woensdag is
(`WISSEL_LAATSTE_DAG`), anders de eerstvolgende. De aanroeper is `apps/web/src/pages/Instellingen.tsx`,
waar het opslaan van de instellingen `doelStart: blokStartBijDoel(...)` zet.

De tegenhanger, `packages/engine/src/niveau.ts` in het commentaar bij `doelTestWeken_`:

```
// sinds punt 9 cyclisch 1..DOEL_BLOK_WEKEN telt. `doelStart` wordt bovendien nergens automatisch
// opgeschoven, dus die vaste datum veroudert per constructie.
```

Beide uitspraken zijn waar en gaan over verschillende gebeurtenissen. Voor punt 47 is dat dragend:
een ijking die op de doelblokgrens hangt, hangt aan een anker dat bij een doelwissel VERSPRINGT en
bij een blok-rollover blijft staan.

## 4. Waar zou een AFWIJZING van een ijkaanbod kunnen landen?

**Er bestaat al een tabel voor een gebruikersbeslissing PER DATUM**, en daarnaast een patroon voor
een beslissing PER BLOK. Beide staan in `workers/api/src/db/schema.ts`.

Per datum, `dayState`:

```
export const dayState = sqliteTable(
  "day_state",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    datum: text("datum").notNull(),
    overrideJson: text("override_json"),
    disposition: text("disposition"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.datum] })],
);
```

Vier kolommen: `user_id`, `datum`, `override_json`, `disposition`. Het GEACCEPTEERDE testaanbod
landt hier vandaag al, als `override_json` met `type: "library"` en `workoutType: "test"` — zie
`isTestOverride_` in `apps/web/src/lib/effect.ts`. Een AFWIJZING landt er NIET: die leeft
sessie-scoped in een module-`Set` in `apps/web/src/components/schema/TestVoorstelCard.tsx`
(`isTestVoorstelAfgewezen`), op BLOKSTART, en overleeft geen app-herstart.

Per blok, `syncState` — het bestaande patroon voor "deze vraag is voor dit blok beantwoord", drie
keer toegepast: `dosis_trede_blok` plus `dosis_trede_doel`, `event_overname_blok` plus
`event_overname_antwoord`, en `doel_passend_blok` plus `doel_passend_doel`. Dat is de vorm die M91
vraagt — de app moet de ONGEIJKT-staat kunnen dragen en tellen ("drie afwijzingen op rij"), en dat
kan een sessie-`Set` per constructie niet.

**MINIMALE VORM VOOR M91**, in het bestaande idioom: een kolommenpaar op `sync_state` naar het
model van `dosis_trede_blok`/`dosis_trede_doel`, waar de blokstart en het antwoord samen landen.
Wil je "drie op rij" tellen, dan is één rij niet genoeg en is `day_state` met een eigen
`disposition`-waarde per aangeboden datum de goedkopere drager, want die is al per datum gesleuteld.
Dit is een OPTIE-inventaris en geen ontwerpbesluit.

## 5. Grondstof voor een BESTE 20-MINUTENVERMOGEN over een vrij venster?

**NEE — die ontbreekt vandaag.** De activiteiten-rij draagt zeventien velden en geen daarvan is een
duur-specifiek piekvermogen. `packages/engine/src/sync.ts`, `ACT_HEADERS`:

```
export const ACT_HEADERS = [
  "Datum",
  "Type",
  "Naam",
  "Duur (min)",
  "Afstand (km)",
  "Gem W",
  "Norm W",
  "IF",
  "TSS",
  "Gem HR",
  "Max HR",
  "PI",
  "FTP",
  "Gewicht",
  "Rolling FTP",
  "Zone-tijden",
  "Activiteit-ID",
];
```

"Gem W" en "Norm W" zijn rit-gemiddelden, "Rolling FTP" is een door intervals aangeleverde
schatting, en "Zone-tijden" zijn totalen per zone zonder tijdas — daaruit volgt geen twintig
aaneengesloten minuten. `activityToRow_` in datzelfde bestand leest geen enkel best-effort- of
curve-veld uit de intervals-respons.

De power-curve-cache draagt de curve wél, maar alleen per gewhitelist venster.
`workers/api/src/db/schema.ts`:

```
    window: text("window").notNull(), // '90d' | '1y'
    fetchedOn: text("fetched_on").notNull(), // yyyy-MM-dd dag-bucket
    rawJson: text("raw_json").notNull(), // JSON.stringify({ list, activities })
```

en `workers/api/src/integrations/powercurve.ts`:

```
export type PowerCurveWindow = "90d" | "1y";
```

Eén rij per gebruiker per venster (`power_curve_cache_user_window_unq`), dus een vrij venster is
niet uit de cache te halen — en `syncPowerCurve` overschrijft de rij per venster, dus er is ook geen
historie van curves om achteraf op te snijden.

**WAT ER MINIMAAL BIJ ZOU MOETEN.** Eén van drie, en ze verschillen sterk in prijs. (a) Het venster
verbreden: `normalizeWindow` accepteert een derde waarde en de cache krijgt een rij per venster —
klein, maar intervals moet dat venster ondersteunen en dat is NIET geverifieerd in deze ronde.
(b) Per rit een 20-minutenpiek meenemen in `activityToRow_` — vraagt een kolom, een migratie en een
veldnaam die deze recon niet heeft vastgesteld. (c) Afleiden uit `GET /activity/{id}/intervals`,
het pad dat ROADMAP punt 49 al beschrijft; dat levert blokken met duur en watts, waaruit een
20-minutenwaarde alleen volgt als er ook werkelijk een blok van die lengte in zit. Geen van de drie
is vandaag gebouwd.

## 6. De grond onder het verschil tussen `laatsteGelegenheid` en `blokGelegenheid`

**De grond is CIRCULARITEIT, en hij adresseert uitsluitend de DOELCHECK-vraag.** Verbatim uit de
docstring van `sprongDagen`, `apps/web/src/lib/effect.ts`:

```
 * GRENS, DRAGEND: dit voedt UITSLUITEND `laatsteGelegenheid` (de meetinterval-poort van het
 * testvoorstel). `blokGelegenheid` en `buildEffectReferent` blijven ONGEWIJZIGD, en dat is geen
 * nalatigheid maar de kern: een sprong als bewijs van gelegenheid gebruiken is CIRCULAIR. De
 * effect-vraag luidt "was er een gelegenheid en steeg de meter"; zou een sprong zelf de gelegenheid
 * zijn, dan is "geen sprong" per definitie "geen gelegenheid" en kan de uitkomst `niet_gestegen`
 * nooit meer vuren. Vandaar: sprongen tellen voor WANNEER er voor het laatst gemeten is, nooit voor
 * de vraag of dit blok een meting bevatte.
```

De tekst benoemt zijn eigen reikwijdte: de redenering gaat over "de effect-vraag" en over de uitkomst
`niet_gestegen`, en dat is de DOELCHECK. Over de IJKING zegt hij niets — en die is ook niet
circulair: de vraag "hoe lang is het geleden dat de drempelwaarde bevestigd is" wordt niet
ongeldig doordat een sprong als bewijs meetelt; hij wordt er juist door beantwoord. Dat de bron die
sprong wél voor het MEETINTERVAL laat tellen is daarmee consistent, want het meetinterval is de
ijkings-kant.

Ter completering, de twee bronnen die `blokGelegenheid` wél voedt — `isMaximaalEvent_` en
`isTestOverride_`, beide in `apps/web/src/lib/effect.ts`:

```
  if (String(ev.type ?? "") !== "race") return false;
  return GELEGENHEID_PRIORITEITEN.indexOf(String(ev.prioriteit ?? "")) >= 0;
```

```
  if (!o || o.type !== "library") return false;
  return String(o.workoutType ?? "") === "test";
```

Beide moeten daarnaast door de gereden-toets `isGereden_`, die minstens
`GELEGENHEID_MIN_MINUTEN` fietsminuten op die dag eist.

<!-- EINDE docs/PUNT47-RECON.md -->
