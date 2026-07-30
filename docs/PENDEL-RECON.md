# Cadans — PENDEL-RECON

**Status:** recon, geen bouw. Gemeten door de chat op de gecommitte staat `2360ff4b`;
`packages/engine` niet geraakt.

## 0. Meetopstelling

Read-only kloon van `daanhhk/Cadans` @ `2360ff4b`. De clientlaag (`proposal.ts`, `schema.ts`,
`activities.ts`, `weekplanBlob.ts`) gebundeld met esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`,
klok gepind in de meetweek. Weekvorm = de `v7-pendel`-vorm uit de shot-harness: ma 60 vrij, WO 40
pendel, vr 90 vrij, za 180 weekend, zo 120 weekend; `pendelDuurMin` 40, `pendelAantal` 2, doel FTP,
`weekUren` 5, `doelStart` 2026-06-29, weekmaandag 2026-07-27.

DE BLOB IS NIET LEEG GEVOED, en dat is dragend. De weekplan-blob is op de weekmaandag met
`buildWeekplanEntries` uit een schone run gebouwd en teruggevoerd. Leeg gevoed geeft andere
getallen — op de dag zelf 320 TSS / 390 min / 3 dagen in plaats van 375 / 450 / 4 — precies de val
uit `WERKWIJZE.md` ("een fixture die leeg gevoed wordt, voorspelt de app niet").

## 1. De wortel — één per-dag-vlag op TWEE lagen, allebei dood

De pendeldag is de enige dag met meer dan één geplande sessie, en hij loopt tegen twee
onafhankelijke per-dag-vlagen aan.

PRODUCENT — `derivePlannerGedaan` (`apps/web/src/lib/activities.ts:54`) zet de dag op gedaan zodra
ÉÉN kwalificerende rit binnenkomt ("eerste match wint, daarna stoppen"). Via `d.gedaan` valt de dag
uit `tePlannen` (`proposal.ts:500`), waarna `assignWorkouts` er NUL sessies voor bouwt. Het plan van
de dag houdt daarmee op te bestaan.

CONSUMENT — `isDone = doneTss > 0` (`schema.ts:1066`) zet `state` op `done`. De dagkaart-dispatch
(`SchemaView.tsx:363`) rendert dan de done-kaart IN PLAATS VAN de sessielijst, en `collectPushDays`
(`schema.ts:1013`) filtert op `state === "today" || "planned"`, dus de dag valt volledig uit de push.

GEMETEN DAT BEIDE UITEINDEN DOOD ZIJN. Met UITSLUITEND de producent gepatcht (drempel op het
dagtotaal in plaats van per rit) beweegt er niets: `sessions` blijft 0, de dagkaart toont 0 sessies,
de push stuurt 0 en de weekkaart blijft op 375 / 450 / 4. Repareren aan één kant kan per constructie
niets opleveren — dit is `WERKWIJZE.md`, "een pad kan dood zijn aan zijn INVOER of aan zijn UITVOER".

## 2. De drie symptomen, gemeten

Klok op woensdag (de pendeldag), blob gevoed. Per toestand: `gedaan`-vlag, `sessions`, wat de
dagkaart toont, wat de push stuurt, en de geplande weekkaart-stats.

- GEEN RIT: false, 2 sessies, state `today` met beide sessies, push WO x 2, week 446 TSS / 530 min /
  5 dagen.
- ALLEEN DE HEENRIT: true, 0 sessies, done-kaart zonder sessies, push WO x 0, week 375 / 450 / 4.
- BEIDE RITTEN: true, 0 sessies, done-kaart zonder sessies, push WO x 0, week 375 / 450 / 4.
- ALLEEN DE HEENRIT, DAG VERSTREKEN: 1 SAMENGEVOEGDE sessie "Pendel Z2 + FTP intervallen" 80 min /
  71 TSS, push WO x 0 (terecht, de dag is voorbij), week 446 / 530 / 5.

DAARUIT VOLGEN TWEE CORRECTIES OP DE ROADMAP-POST.

(a) De Garmin-push slaat de terugrit OOK over. Gemeten door Daan op de echte week 31: alleen zaterdag
ging mee. `collectPushDays` leest dezelfde per-dag-state als de dagkaart; de post vermoedde nog dat
de push uit het plan zou lezen en dus goed zou gaan.

(b) "Het plan zelf is intact, de weekkaart telt beide ritten nog" geldt ALLEEN voor een VERSTREKEN
pendeldag. Op de dag zelf zakt de hele dag uit de geplande noemer: 446 / 530 / 5 wordt 375 / 450 / 4,
oftewel -71 TSS, -80 minuten en -1 dag. Zodra de dag verstrijkt leest `plannedForDone` de bevroren
entry en staat de noemer weer goed.

DIE NOEMER-VAL IS NIET PENDEL-SPECIFIEK, en gaat daarom NIET mee in deze fix. Gemeten op een gewone
maandag van 60 minuten, gereden op maandag: 446 / 530 / 5 wordt 391 / 470 / 4. Elke gedane dag
verliest op de dag zelf zijn geplande bijdrage, want `plannedForDone` wordt daar alleen gevuld als
`d.voorgesteldType` gezet is en die kolom staat in Cadans structureel op null (`repo.ts:397` schrijft
'm bij elke PUT leeg). Dit is het bestaande parkeerlijst-item "de gepland-noemer verschuift terwijl
de week vordert", nu met een getal erbij. Eigen ronde.

## 3. De drempel is geen hendel — een pendelbeen is exact 50 procent

`derivePlannerGedaan` regel 3 eist duur >= 50 procent van `plannerDays[].minuten`. Op een pendeldag
is dat veld de duur PER RIT (40), terwijl de dag `pendelAantal x 40` = 80 minuten plant. Gemeten
kantelpunt vandaag: een rit van 19 minuten telt niet, 20 minuten wel. Een kwart van de dag volstaat
dus. Ter vergelijking kantelt de vrijdag van 90 minuten pas bij 45.

DE VOOR DE HAND LIGGENDE REPARATIE WERKT NIET. Met de drempel op het dagtotaal (80) gemeten: 39
minuten telt niet meer, 40 minuten nog steeds wel. Een pendelbeen IS per constructie precies de helft
van de round trip, dus elke duurdrempel valt daar samen met het geval dat hij zou moeten uitsluiten.
De vlag moet een TELLING worden, geen drempel.

## 4. Wat de fix ruimte geeft — de data is er al

- `activities.datum` staat in D1 als volledige `yyyy-MM-ddTHH:mm:ss` (`actValsFromRow` roept
  `toD1DateTime`); de tijdstempel wordt pas weggegooid bij het keyen van `doneByDate`
  (`schema.ts:1500`, `stripTime_`).
- De bewaarde weekplan-blob draagt `sessies` als array (`entryFromDay`, `weekplanBlob.ts:170`).
  `workoutFromFrozenEntry` (`proposal.ts:216`) leest daar uitsluitend de DAGTOTALEN uit en negeert
  die array — vandaar de ene samengevoegde sessie van 80 minuten op een verstreken pendeldag.
- De pushkant kan multi-sessie al aan: `pushWorkouts` bouwt per sessie een payload met een eigen
  startuur en een `_s2`-suffix op `external_id` (`integrations/push.ts:79`).

Een per-rit-koppeling is dus geen DATA-vraag maar een AFLEIDINGS-vraag. Dat corrigeert de scope-schatting
in `docs/T28-FASE3B-PENDEL-RECON.md` paragraaf 5, die de koppelregel (tijdstip, volgorde of duur) als
open ontwerpvraag neerzette.

## 5. BESLUIT — koppel op VOLGORDE, en tel in plaats van te drempelen

Er is geen matchingprobleem op te lossen. Op een pendeldag rijd je heen vóór terug, dus k ritten
dekken de EERSTE k geplande sessies en de rest staat open. Tijdstip en duur voegen niets toe aan de
correctheid van dat geval en introduceren wel een nieuw faalgeval.

PLEK 1, PRODUCENT — `derivePlannerGedaan` telt de kwalificerende ritten in plaats van te stoppen bij
de eerste, en vergelijkt die telling met het aantal geplande sessies van de dag. Nieuwe optionele
derde parameter `pendelSessies: number` met default 1; de dag heeft `nodig = dagtype === "pendel" ?
pendelSessies : 1`. De 50-procent-duurdrempel blijft PER RIT (dus tegen `minuten`, de duur per rit) en
wordt niet aangeraakt. Bij `nodig === 1` is de uitkomst byte-identiek aan vandaag, dus elke bestaande
aanroep en elke bestaande test blijft ongewijzigd geldig. `GedaanPlannerDay` krijgt er
`dagtype?: string | null` bij. De aanroeper (`proposal.ts:368`) geeft
`Math.max(1, Math.round(settings.pendelAantal ?? 1) || 1)` mee.

DIT IS EEN EXPLICIET MODEL-BESLUIT, zoals het commentaar boven de functie eist: de GAS-mirror is
byte-getrouw en mag niet stilzwijgend "verbeterd" worden. De fork zit uitsluitend in regel 4 (eerste
match wint wordt tel de matches) en raakt regel 1 tot en met 3 niet. De bevroren GAS-bron is hier niet
geraadpleegd en hoeft dat niet te zijn: hij beantwoordt of we destijds getrouw geport hebben, nooit of
dit de juiste waarde is (`WERKWIJZE.md`, GAS is een PORT-referentie).

PLEK 2, CONSUMENT — één afgeleide erbij, in dezelfde vorm als `planSessions` uit de dagkaart-fix.
`DoneEntry` krijgt `ritten: number` (`buildDoneEntry` zet 1, `mergeDone` telt op). `deriveSchemaView`
leidt per dag `openSessions` af als `sessions.slice(Math.min(ritten, sessions.length))` — de geplande
sessies die nog geen rit tegenover zich hebben. `state` verandert NIET; er komt geen half-gedaan-state
bij, want meer dan één state kan die toestand dragen.

- `collectPushDays` filtert op `(state === "today" || "planned" || "done") && openSessions.length > 0
  && datum >= todayISO` en stuurt `openSessions` mee. De state-lijst blijft er expliciet staan: hem
  laten vallen zou een op vandaag gedisponeerde dag (state `gemist`, sessies wél gevuld) alsnog gaan
  pushen, en dat is precies wat "Niet gedaan?" moet voorkomen.
- De dagkaart rendert in de done-tak ná `DoneCompareCard` / `DoneDetail` het bestaande `SessieBlok`
  op `openSessions`, met dezelfde vorm als de gemist-tak die dat al doet.

WAT DE FIX OPLEVERT, GEMETEN met beide plekken gepatcht, alleen de heenrit gereden: `sessions` 2,
`openSessions` = "Pendel + FTP intervallen (40 min)", push WO x 1 met precies die sessie, weekkaart
gepland terug op 446 / 530 / 5 met gedaan 29 / 40 / 1. Beide ritten gereden: `openSessions` leeg, push
0 — ongewijzigd. Gewone maandag gereden: ongewijzigd.

## 6. Wat NIET meegaat, expliciet

- DE GEPLAND-NOEMER OP DE DAG ZELF (paragraaf 2). Niet pendel-specifiek; blijft parkeerlijst.
- DE VERGELIJKING OP DE DONE-KAART. `plannedForCompare` (`schema.ts:1129`) pakt de LAATSTE geplande
  sessie. Gemeten neveneffect van de fix: op de half-gereden pendeldag gaat de kaart van gereduceerd
  (`DoneDetail`) naar de VOLLE `DoneCompareCard`, en die vergelijkt de heenrit dan tegen de TERUGrit.
  Dat is een nieuwe onware bewering en mag zo niet live. BESLUIT: `plannedForCompare` krijgt dezelfde
  volgorde-koppeling — de counterpart is `sessions[ritten - 1]`, afgetopt op de laatste index, en
  `plannedForDone` houdt voorrang zodat een volledig gereden of verstreken dag byte-identiek blijft.
  Bij `pendelAantal` 3 met twee ritten gereden blijft de vergelijking een benadering (de samengevoegde
  dag-entry tegen sessie 2); dat wordt in de test vastgelegd in plaats van verzwegen.
- DE PER-SESSIE `sessies`-ARRAY UIT DE BLOB. Een verstreken pendeldag blijft één samengevoegde sessie
  van 80 minuten tonen. Dat is de weergavekant van dezelfde knoop en heeft geen haast: de dag is
  voorbij, er valt niets meer te rijden of te pushen.
- DE HEEN/TERUG-SPLITSING BINNEN één sessie (`genericPendelZ2` / `genericPendelIntervals`,
  `docs/T28-FASE3B-PENDEL-RECON.md` paragraaf 3). ENGINE, aparte autorisatie, geen relatie met dit
  defect.

## 7. Wat de bouw moet aantonen — rood per plek

De fix landt op twee plekken, dus de rood-test moet PER PLEK rood zijn; een gedeelde meetas kan
volledig via één tak lopen.

1. Producent alleen: met uitsluitend de telling teruggedraaid moet de pendeldag weer 0 `sessions`
   dragen. GEMETEN dat die tak alléén niets oplevert, dus de assertie hoort op `sessions`, niet op de
   push.
2. Consument alleen: met uitsluitend `openSessions` teruggedraaid moet de push de pendeldag weer
   overslaan terwijl `sessions` 2 is.
3. `push.test.ts` ENCODEERT DE OUDE REGEL. De assertie "done met sessies telt niet mee" is precies het
   gedrag dat verandert en moet herschreven worden: done met `openSessions` leeg valt nog steeds af,
   done met open sessies gaat nu wél mee. De handgebouwde `SchemaDay`-fixtures daar dragen geen
   `openSessions` en moeten aangevuld worden. Bewuste herijking, met reden, te melden in het rapport.
4. Byte-identiek op alles wat geen pendeldag is: de shot-harness vóór en ná op dezelfde machine
   zonder werk ertussen, bytecount én sha256.

*Recon, geen bouw. `packages/engine` ongemoeid; de bevroren GAS-bron niet geraadpleegd en niet nodig.*
