# PUNT 20 — RECON: de gepushte workout is korter dan het plan

Read-only meetronde op `83a28ee2e7247dcb998b61374b653690b8077c7d`. GEEN code gewijzigd, geen
voorstel, geen ontwerp — alleen wat gemeten is. De engine is met `esbuild` BUITEN de repo-tree
gebundeld en onder `TZ=Europe/Amsterdam` gedraaid; de repo bleef schoon.

## §1 — De vier vindplaatsen, geverifieerd op schijf

Alle vier staan er, en alle drie de regexen zijn BYTE-IDENTIEK aan wat het ROADMAP-punt noemt.

- (a) `dslBlockFromRow_` herhalings-regex — `packages/engine/src/zones.ts:360`,
  `/^\s*(\d+)\s*x\s*(\d+)\s*(min|sec|s)\b/i`. De functie zelf begint op `:354`.
- (b) `dslDurationSec_` min-regex — `zones.ts:427`, `/(\d+)\s*min/i`. De functie begint op `:425`.
- (c) `zwoStepFromRow_` herhalings-regex — `zones.ts:454`, LETTERLIJK dezelfde regex als (a).
  De functie begint op `:448`.
- (d) `dslRestFromNote_` — `zones.ts:436`,
  `/(\d+)\s*(min|sec|s)\s+(rust|pauze|recovery)/i`. De functie begint op `:434`. Ook deze eist
  een HEEL getal.

`dslDurationSec_` heeft precies TWEE aanroepers, allebei in `zones.ts`: `:380` binnen
`dslBlockFromRow_` en `:469` binnen `zwoStepFromRow_`. NUL daarbuiten, in de hele repo.

## §2 — De push-volgorde, aan beide uiteinden bevestigd

ZWO gaat EERST en keert bij succes meteen terug; DSL en de plain-text-description komen pas
daarna. In `workers/api/src/integrations/push.ts`, functie `buildEventPayload` (`:47`):

- `:83` `const zwo = buildWorkoutZwo_(workout, f);`
- `:84`–`:87` bij succes worden `filename` en `file_contents_base64` gezet en volgt `return base;`
- `:91` pas daarna `buildWorkoutDsl_`, en `:92` de description als laatste fallback.

DAT IS DRAGEND: `zwoStepFromRow_` is het PRIMAIRE pad naar Garmin, niet `dslBlockFromRow_`.

De keten naar de knop, elk met zijn werkelijke regelnummer:

- `apps/web/src/components/schema/GarminPushButton.tsx:44` roept `pushWorkouts(pushDays)` aan
- `apps/web/src/lib/api.ts:290` `export async function pushWorkouts`, POST naar `/api/push` op `:291`
- `workers/api/src/routes/api.ts:717` `api.post("/push", ...)`, en `:731` `pushWorkouts(c.env, days, ftp)`
- `workers/api/src/integrations/push.ts:169` `pushWorkouts`, en `:195` `buildEventPayload(...)`

## §3 — De rood-meting per cel: bibliotheek plus planner-tak

Populatie: `expandArchetype_` over alle `ARCHETYPES` maal hun `duurRange` in stappen van 5, maal
mesoWeek 1..4, maal dosisTrede 0/2/4, maal de vijf doelen — 13680 sessies. PLUS `buildWorkout`
over negen gangbare types maal 30..240 minuten in stappen van 5 maal Base/Build/Peak maal de vijf
doelen — 5805 sessies. Samen 100327 duur-cellen.

- cellen met een decimaal in de duur-cel: **38302 — 38,2%**
- cellen FOUT gepusht: **38302 — 38,2%**
- waarvan te KORT **17217**, te LANG **21085**
- cellen die hun HERHALINGEN verliezen: **6069**

De samenval is PERFECT en dat is expliciet getoetst, beide kanten op: nul cellen fout zonder
decimaal, en nul cellen met decimaal die tóch goed gepusht worden.

AFWIJKING VAN DE OPGEGEVEN SWEEP, gemeld en niet gladgestreken: de chat-zijde mat 46495 van 115741
cellen fout (40,2%). Hier is het 38302 van 100327 (38,2%). De SAMENVAL reproduceert exact; het
verschil zit in de POPULATIE-omvang, niet in het mechanisme. De verhouding fout-op-totaal ligt
2 procentpunt lager omdat deze sweep negen planner-types draait en een andere stapgrootte over de
duurbanden. Er is niets aangepast om het te laten kloppen.

### Het scherpste geval, en het is NIET het geval uit het ROADMAP-punt

Cel `"6.9999999999999964 min"` (label `Cooldown`, noot `Easy uit`) levert:

    <Cooldown Duration="599999999999997800" PowerLow="0.45" PowerHigh="0.55"/>

Dat is 599999999999997800 seconden, ruim 19 miljard jaar. De grond: `/(\d+)\s*min/i` faalt op de
`6` omdat er een punt volgt, schuift door, en vindt `9999999999999964` mét een spatie en `min`
erachter. DE FOUT IS DUS TWEEZIJDIG. Het ROADMAP-punt beschrijft alleen de te-KORTE kant
(65 → 27); te LANG komt vaker voor (21085 tegen 17217) en kan absurde waarden aannemen.

Ter controle nagerekend, en beide reproduceren het ROADMAP-punt exact:

- `"24.7 min"` → `dslDurationSec_` geeft 420 seconden, dus 7 minuten.
- `"2x 9.7 min"` → `<SteadyState Duration="420" Power="0.72"/>` — 7 minuten, en de twee
  herhalingen zijn wég, want de cel valt uit de `IntervalsT`-tak.

## §4 — De echte populatie: wat de app werkelijk plant

Via `buildWeekProposal` (`apps/web/src/lib/proposal.ts`), over zeven weekvormen maal de vijf
doelen maal Base/Build/Peak.

- sessies: **435**, duur-cellen: **1926**
- cellen met een decimaal: **729 — 37,9%**
- cellen FOUT gepusht: **729 — 37,9%**
- sessies met minstens ÉÉN fout blok: **287 — 66,0%**

REPRODUCEERT NIET, en dat is de belangrijkste bevinding van deze ronde. ROADMAP punt 20 claimt
19,7% cellen met decimaal, 19,0% fout en 30,0% van de sessies. Gemeten is 37,9%, 37,9% en 66,0% —
ongeveer het DUBBELE op alle drie. De ROADMAP is deze ronde bewust NIET herschreven. Welke
populatie de 2100 sessies en 9038 cellen van het punt precies dekte is hier niet te
reconstrueren; deze meting staat op 435 sessies en 1926 cellen over de weekvorm-as.

## §5 — De nul-referentie waar de bouw onder moet blijven

Over exact dezelfde 100327 cellen uit §3:

- `zwoStepFromRow_` geeft `null` voor **0** cellen
- `dslBlockFromRow_` geeft `null` of leeg voor **0** cellen

VANDAAG PARSEERT ELKE CEL. Dat is de vloer: na de fix mag geen enkele cel die vandaag parseert
nog `null` teruggeven. De fout zit niet in wat er faalt, maar in wat er STIL slaagt.

## §6 — Takken die we NIET moeten bouwen

- duur-cellen met een KOMMA als decimaalteken: **0**, in beide populaties. De engine bouwt zijn
  strings met de JS-puntnotatie; een komma ontstaat pas op de renderrand (punt 18) en die string
  gaat nooit terug de push in.
- rustnoten met een decimale waarde: **0**.

DE TWEEDE NUL IS EXPLICIET GETOETST OP ECHTE AFWEZIGHEID en niet op een ongebruikt pad: in de
echte populatie staan **179** rustnoten, dus de tak wordt wel degelijk bereikt — geen daarvan
draagt een decimaal. Een komma-tak of een decimale-rust-tak zou vandaag dode code zijn.

## §7 — De valse dekking, alle vier bevestigd

Alle vier toetsen DAT er geparseerd wordt, niet WAT eruit komt.

- `packages/engine/src/selftest.test.ts:1981` — `assert_("arch " + rec.id + " push-parse", true, pushOk)`.
  De lus erboven op `:1975`–`:1980` zet `pushOk = false` uitsluitend als
  `dslBlockFromRow_(row, 275) == null`.
- `packages/engine/src/selftest.test.ts:2081` — `lib <id> push-parse`, dezelfde constructie.
- `packages/engine/src/selftest.test.ts:3549` — `sim buildWO push-parse`, opnieuw alleen een
  null-toets.
- `workers/api/test/push.test.ts:24` — fixture `W_ZWO`. De drie duur-cellen zijn `"12 min"`,
  `"3x 10 min"` en `"8 min"`: allemaal HELE minuten. De fixture kan het defect per constructie
  niet raken.

EN ER IS EEN VIJFDE GAT, dat nergens genoemd stond: alle drie de selftest-asserties draaien op
`dslBlockFromRow_`. `zwoStepFromRow_` — het PRIMAIRE push-pad uit §2 — wordt in de hele repo
nergens door een test aangeroepen. Grep over alle `.ts`: twee treffers, allebei in `zones.ts`
zelf (`:448` de definitie, `:526` de aanroep in `buildWorkoutZwo_`).
