# Cadans — DOSIS-TREDE-RECON (ROADMAP stap 2)

Recon-doc voor ROADMAP stap 2, "er is geen plek waar dosis wordt vastgehouden". Leesronde plus
meting, GEEN code. Voorrang: `docs/WERKWIJZE.md` > `docs/DOELEN-SPEC.md` > `docs/ROADMAP.md` >
dit document. Dit document wijzigt geen code.

## 1. Wat de stap moet leveren

Criterium uit `docs/ROADMAP.md`: een blok-check verhoogt aantoonbaar de norm van het volgende blok,
als VOORSTEL met bevestiging, niet stilzwijgend. Raakt ENGINE, DATA en CLIENT.

De blok-check draait al (`blokCheck`, `apps/web/src/lib/blok.ts`) en levert drie uitkomsten. De
kaart zegt vandaag "het plan was te licht, er mag meer dosis in" en er is niets dat dat onthoudt:
de conclusie verdampt zodra de kaart weg is.

## 2. Meetopstelling

Engine plus de client-glue gebundeld met esbuild BUITEN de repo-tree, `TZ=Europe/Amsterdam`, `Date`
gestubd op de fixture-maandag. Meetpunt is `buildWeekProposal` — dezelfde ingang als
`apps/web/src/lib/weekvormAs.test.ts`, met dezelfde zeven weekvormen, dezelfde settings (FTP 280,
doel FTP, doelStart 2026-06-29) en hetzelfde A-event.

DE PROBE IS EERST GEVALIDEERD. Op de ONGEWIJZIGDE engine levert hij kwaliteitsminuten
93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375 en
kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3 — regel voor regel de as uit `docs/ROADMAP.md`.

TWEEDE VALIDATIE, LANGS EEN ANDERE ROUTE. De sweep hieronder verzet `MESO_MOD[1]`; dezelfde factor
is ook bereikbaar via de PUBLIEKE seam `mesoWeekOverride`. Bij 1,15 geven beide routes
107 / 130 / 130 / 121 / 96 / 107 / 103 — identiek. De patch meet dus wat hij beweert te meten.

## 3. Vondst 1 — de trede moet de norm EN het plan bewegen

De norm is client-zijde: `blokDosisNorm` = prikkels x minuten-per-prikkel (FTP: 3 x 28 = 84). De
engine plant daar volledig los van; `weekUren` is MEETLAT-invoer en blijft GEEN planner-invoer
(`DOELEN-SPEC` §2A).

Na stap 1b haalt elke weekvorm die norm, maar de krapste (V5) haalt hem op de minuut: 84 tegen 84.
Verhoog je alleen de NORM, dan zakt het plan binnen een trede onder zijn eigen meetlat en schrijft
de coach een week voor die zijn eigen dosis-doel niet haalt. Verhoog je alleen het PLAN, dan
beweegt de norm niet en is er geen "aantoonbaar" in het criterium. Een getal moet dus beide kanten
met dezelfde factor optillen. Dat verklaart waarom ROADMAP alle drie de lagen noemt.

## 4. Vondst 2 — het mechanisme bestaat al, en het staat er DUBBEL

3d stap 2 zette een KWALITEITS-RAMP neer: in een opbouwweek rekt de core-WERKtijd met
`mesoFactor(mesoWeek)`, en de vrijgekomen ruimte komt eerst uit de endurance-fill, dan uit de
cooldown (tot 5 min), dan uit de warmup (tot 8 min). Het totaal blijft onder de beschikbare
dagminuten en de %FTP per blok blijft nominaal — karakter-invariant (M74-M78), alleen dosis.

Die logica staat op TWEE plekken, met eigen code:
- `expandArchetype_` (`packages/engine/src/archetypes.ts`) — de archetype-tak.
- de work-scale in `renderVariant_` (`packages/engine/src/planner.ts`) — de variant-tak.

Een trede die op maar een van beide landt is de halve fix uit `WERKWIJZE.md`: intern consistent, en
de helft van de sessies beweegt niet mee. Beide of geen.

## 5. De meting — hoeveel ruimte zit erin

Factor op de work-scale bij mesoweek 1, dus zuiver de trede. Kwaliteitsminuten V1..V7 en week-TSS:

  factor  kwaliteitsminuten                 week-TSS
  1,00     93 113 113 105  84  93  90       268 410 464 362 352 227 375
  1,05     97 119 119 110  88  97  94       272 412 470 367 354 230 378
  1,10    102 124 124 115  93 102  99       274 418 477 369 356 232 380
  1,15    107 130 130 121  96 107 103       277 419 483 372 360 235 383
  1,20    112 135 135 126 100 112 108       280 423 489 376 360 238 386
  1,25    116 141 141 131 103 116 112       284 427 495 380 362 242 390
  1,30    120 147 147 136 106 120 116       287 430 501 383 365 245 392
  1,40    130 158 158 147 112 130 125       292 437 514 389 369 250 397
  1,50    140 170 170 158 118 140 136       298 444 527 396 371 256 403
  1,75    163 198 191 184 130 163 158       312 461 543 412 379 270 415
  2,00    175 218 210 200 141 175 174       320 473 554 421 387 278 427

TWEE DINGEN. De hendel loopt LINEAIR tot ongeveer 1,5 en verzadigt daarboven — van 1,50 naar 2,00
levert V1 nog 35 minuten waar lineair 70 hoort, want de fill is dan op en warmup en cooldown staan
op hun minimum. En de TSS beweegt nauwelijks mee: op V1 kost +51% kwaliteitsminuten +11% TSS. Dat
is herverdeling binnen de gedeclareerde capaciteit, M47-conform, precies wat `DOELEN-SPEC` §2A
vraagt van extra dosis binnen dezelfde uren.

## 6. Het ontwerp

DE EENHEID. De trede telt in MINUTEN PER SLEUTELSESSIE — de dosis-doel-eenheid die `DOELEN-SPEC`
§2A aanwijst (tijd-in-zone), niet een percentage. FTP staat op 28; trede t geeft 28 + 2t.

DE STAP IS BELEID, GEEN GEIJKTE DREMPEL. Er bestaat geen reeks waarop "hoeveel mag de dosis per
blok omhoog" te meten valt, en ijken op de eigen historie reproduceert de gewoonte die dit
mechanisme juist vervangt (`WERKWIJZE.md`). Vastgesteld met Daan: 2 minuten per trede. Wordt in de
code expliciet als beleid gelabeld, zodat een volgende chat er geen data voor gaat zoeken.

DE LADDER, GEMETEN. Norm = 3 prikkels x (28 + 2t); factor = (28 + 2t) / 28; plan gemeten op alle
zeven vormen, met de krapste (V5) apart:

  trede  min/prikkel  norm  factor   plan V5   plan V1..V7
  0      28            84   1,0000    84       93 113 113 105  84  93  90
  1      30            90   1,0714    90      101 121 121 113  90 101  98
  2      32            96   1,1429    96      106 130 129 120  96 106 103
  3      34           102   1,2143   100      113 137 138 128 100 113 110
  4      36           108   1,2857   106      120 146 145 135 106 120 116

Tot en met trede 2 haalt elke weekvorm zijn eigen norm exact. Bij trede 3 en 4 blijft de krapste
vorm 2 minuten onder de norm — de pendel-heenrit is beschermd, dus daar is minder ruimte.

DAT IS GEEN LEK MAAR DE REM. "Geleverd" is de voorwaarde om te stijgen, en wie het plan volgt haalt
de norm dan niet meer; de check zegt "niet geleverd" en de ladder houdt stil. Het mechanisme
begrenst zichzelf op de weekvorm die de gebruiker werkelijk rijdt. Plafond niettemin op trede 4,
ruim binnen het gemeten lineaire gebied.

WANNEER HIJ STIJGT. Op beide GELEVERD-takken, want `DOELEN-SPEC` §2A schrijft ze allebei omhoog
voor: geleverd en gestegen geeft de volgende opbouwtrede, geleverd maar niet gestegen geeft dosis
omhoog omdat het plan te licht was. Een ladder, een stap, andere copy per tak. Bij NIET geleverd
houdt hij stil.

OMLAAG GAAT HIJ NIET VANZELF. `DOELEN-SPEC` definieert geen daling en die wordt hier niet
uitgevonden. Wel is een bevestigde trede omkeerbaar met een tik (M10/M11), en hij vervalt bij een
doel-wissel: het aantal minuten per prikkel is doel-eigen (FTP 28, Onderhoud 22).

## 7. DATA — de kolommen

Spiegelt `fatigue_shift` een op een (`sync_state` is runtime, `settings` is config). Drie kolommen
op `sync_state`, migratie `0007`:
- `dosis_trede` (integer) — het niveau; ontbreekt of null betekent 0.
- `dosis_trede_blok` (text) — de blokstart-maandag waarvoor de vraag beantwoord is. Bevestigen EN
  afwijzen schrijven hem, zodat het voorstel niet elke week terugkomt; de volgende blokgrens stelt
  de vraag opnieuw.
- `dosis_trede_doel` (text) — het doel waarop de trede is opgebouwd.

Route `GET`/`PUT /api/dosis-trede` naar het model van `/api/fatigue-shift`: GET geeft de drie
waarden of nullen, PUT zet ze samen, de repo-upsert raakt ALLEEN deze drie kolommen.

## 8. CLIENT

`blokDosisNorm` krijgt de trede erbij en telt hem op bij de minuten per prikkel; alles eronder
(gevraagd per week, `geleverdOk`, de terugblik-copy) volgt vanzelf. De blast radius is klein:
`blokDosisNorm` wordt alleen binnen `blok.ts` gebruikt, en `buildBlokReview` heeft twee aanroepers
(`schema.ts` en `Preview.tsx`).

De kaart staat in blokweek 1 (fase "afgerond") naast de terugblik, in de vorm van `VerlengCard`:
de coach zegt wat hij gemeten heeft, wat er verandert (van X naar Y minuten per sleutelsessie, dus
van A naar B per week, binnen dezelfde beschikbare tijd) en wat er NIET verandert (dezelfde zones,
dezelfde dagen, dezelfde uren). Een tik bevestigt.

## 9. ENGINE — de plekken die autorisatie vragen

- `packages/engine/src/utils.ts` — een pure helper die de trede-factor levert, plus de
  beleidsconstanten (stap en plafond).
- `packages/engine/src/archetypes.ts` — `expandArchetype_`, de work-scale-factor.
- `packages/engine/src/planner.ts` — de work-scale in `renderVariant_` plus de doorgifte van de
  trede naar `expandArchetype_` in `buildWorkout`.
- `packages/engine/src/selftest.test.ts` — asserties bewegen mee, de vloer stijgt.

Weggelaten trede of trede 0 geeft factor 1 en is byte-identiek aan vandaag. Dezelfde lijn als
`f = 1` in de bestaande ramp.

## 10. Wat deze stap NIET doet

Geen tweede stapgrootte voor de "te licht"-tak. Geen automatische daling. Geen wijziging aan
`kwaliteitPerWeek` — het AANTAL prikkels volgt de gedeclareerde uren (`DOELEN-SPEC` §3.1) — en geen
wijziging aan de allocator. De weekvorm-as wordt bij trede 0 niet herijkt; daar is de uitkomst per
constructie byte-identiek.

## 11. Openstaand

- De claim "twee blokken achtereen te licht" is niet vanuit de chat te verifieren (remote D1). Het
  mechanisme hangt er ook niet aan: een blok-check is genoeg om te onthouden.
- De trede reist mee met het DOEL maar niet met de gedeclareerde UREN. Zakken de uren, dan zakt het
  aantal prikkels en blijft de dosis per prikkel staan — dat is `DOELEN-SPEC` §3.2 (frequentie
  beschermd), maar het is nooit gemeten op een urenwissel.
- `kwaliteitPerWeek.Peak` staat voor FTP nog op 2. Een trede tilt de dosis per prikkel op, niet het
  aantal, dus het Peak-gat uit de parkeerlijst blijft open.
