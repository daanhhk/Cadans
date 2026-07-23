# ONDERHOUD-SOFT — recon (T9 fase-pin + T8 duur-cap)

R4-item E, deel 1. Status: VOORSTEL — Daan reviewt dit doc VOOR de bouw.
Engine-wijziging: ja, twee ingrepen. Vereist expliciete engine-autorisatie.

## 0. Meetmethode

Engine gebundeld met esbuild buiten de repo-tree, Node, `TZ=Europe/Amsterdam`.
`Date` is op bundel-niveau gestubd op de fixture-maandag: `allocateQualityWeek_`
dateert zich op de AMBIENT klok (`packages/engine/src/planner.ts:570`,
`const allocToday = stripTime_(new Date())`) terwijl de rest van de pijplijn op
`input.todayISO` loopt (R3-a3-waarschuwing).

`assignWorkouts` krijgt UITSLUITEND de te-plannen dagen mee (zoals
`apps/web/src/lib/proposal.ts` en GAS `src/Algorithm.gs:137` `tePlannen`), de volle
week als `weekDays`. Eerste meetronde gaf alle 7 dagen mee; dan pakt een niet-train-dag
de keyIntensity-tak, zet `lastHardDate`, en avoid-consecutive-hard demote't de
maandagse kwaliteitsdag weg — je meet dan 1 i.p.v. 2 kwaliteitsdagen. Gecorrigeerd.

Fixture: week ma 13-07-2026, dagen `vrij/vrij/vrij/vrij/vrij/weekend/weekend`,
ftp 280, lthr 165, mesoWeek 1, geen debt, geen wellness.

## 1. T9 — de fase-pin

**Mechanisme.** `packages/engine/src/planner.ts:87` `effectiveMacroFase_(fase, settings)`
geeft `"Base"` terug zodra `settings.doel === "Onderhoud"`, ongeacht de meegegeven fase.
Aangeroepen op `apps/web/src/lib/proposal.ts:285`, op de uitkomst van `eventFase_`
(`macro.macroFase`) of anders `computeMacroPhase`. GAS-identiek (`src/Algorithm.gs:71`,
aanroep `:137`); de docstring noemt de reden zelf: allocActive TRUE + geen missing key.

**Wat er WEL en NIET onder valt — gemeten, corrigeert de review.**

- De TAPER overleeft de pin. `eventFase_` levert de taper als aparte overlay
  (`taperEvent`/`taperVenster`, `packages/engine/src/phase.ts:164`); `assignWorkouts`
  leest die via `taperCtx`, niet via `macroFase`. Gemeten op de taperweek voor AGR
  (ma 12-04-2027): met pin nog steeds `taper_openers` + 4x `taper_z2_kort`.
  De formulering "de pin overschrijft de race-piek EN taper" is dus half waar.
- De EVENT-HERSTELWEEK overleeft de pin NIET. `eventFase_` geeft `macroFase:"Recovery"`
  voor een A-race die deze week al plaatsvond; de pin maakt daar `"Base"` van, waardoor
  `isEventRecovery` (`planner.ts:509`) en daarmee `allocActive` (`:544`) nooit uitgaan.
  Gemeten, zondag 18-04-2027, dag NA AGR, 120 beschikbare minuten:
    met pin    -> `sweet_spot` / Sweet Spot 2x10 kort, HIGH 20', TSS 89
    zonder pin -> `recovery`   / Recovery 60 min,      HIGH  0', TSS 21
  Dit is de scherpste schade van T9.
- De OPBOUW naar het event wordt vlakgeslagen. `eventFase_` mapt `wekenTot >= 9 -> Base`,
  `>= 5 -> Build`, anders `Peak` (`phase.ts:130-133`). Gemeten tegen AGR 17-04-2027:
    23-07-2026  wekenTot 39  Base   -> pin: Base   (geen verschil)
    15-02-2027  wekenTot  9  Base   -> pin: Base   (geen verschil)
    15-03-2027  wekenTot  5  Build  -> pin: Base   (VERSCHIL)
    22-03-2027  wekenTot  4  Peak   -> pin: Base   (VERSCHIL)
  De pin doet vandaag dus niets; hij bijt vanaf ongeveer 22-02-2027.
- DISPLAY vs PLAN lopen uiteen. De payload draagt de GEPINDE `macroFase`
  (`proposal.ts:647`) maar de fase-pill leest de RAUWE event-fase
  (`proposal.ts:654`, `macro?.fase`). Met AGR actief en doel Onderhoud toont de app
  dus "Peak"/"Taper" terwijl het plan Base draait. Na de fix vallen ze weer samen.

**Wat de pin legitiem afvangt.** `computeMacroPhase` (`phase.ts:52`) blijft na blokweek 12
voorgoed op `"Test"` (T12). Zonder event zou Onderhoud daardoor elke week een FTP-test
plannen en de hele week-allocatie verliezen. Dat deel van de pin blijft nodig.

## 2. T8 — de 45-minuten-cap

**Mechanisme.** `packages/engine/src/planner.ts:423` klemt de beschikbare tijd:
`bt = Math.min(dagminuten, profiel.maxDuurMin || Infinity)`. `bt` gaat UITSLUITEND naar
`goalWorkout_` (`packages/engine/src/archetypes.ts:1367`) = de archetype-KEUZE; de sessie
wordt daarna op de VOLLE dagminuten gebouwd (`proposal.ts` -> `buildWorkout` ->
`expandArchetype_`, `doelMin = mins`). Alleen `PROFILES.onderhoud` zet het veld
(`archetypes.ts:1269`, `maxDuurMin: 45`). GAS-identiek (`src/Algorithm.gs:943`,
`src/Archetypes.gs:552`).

**De schade is niet "de sessie wordt kort", maar "het archetype past niet bij de dag".**
`goalWorkout_` filtert op `duurRange`. Bij `bt = 45` is de pool voor de twee intents die
Onderhoud kiest exact EEN archetype groot:
  drempel   -> `threshold_2x8`  (`duurRange` 33-45, 2x8 = 16' werk)
  sweetspot -> `sweetspot_2x10` (`duurRange` 35-45, 2x10 = 20' werk)
Beide dragen `restrictTo: ["onderhoud"]` en bestaan alleen omdat de cap ze afdwingt.

Gemeten gevolgen, fase Base, mesoWeek 1:
  weekbudget   nu (cap 45)                          cap weg
   3 u         HIGH 36'  sweetspot_2x10@45'         HIGH 41'
   6 u         HIGH 36'  sweetspot_2x10@60'         HIGH 45'  sweetspot_short@60'
   9 u         HIGH 36'  sweetspot_2x10@90'         HIGH 45'  sweetspot_short@90'
  12 u         HIGH 36'  threshold_2x8@90'          HIGH 45'  threshold_overunder@90'
  15 u         HIGH 36'  threshold_2x8@165'         HIGH 56'  threshold_overunder_long@105'
De laatste regel is de kern: een rit van 165 minuten wordt nu gepland als
"Drempel 2x8 kort" — 16 minuten werk plus 2u20 Z2-vulling. Met de cap weg verhuist de
prikkel naar een dag waar hij past en blijft de lange rit een duurrit.

**Variatie.** Poolgrootte voor het onderhoud-profiel: bt 45 -> 5 archetypes (waarvan 1 per
gekozen intent), bt 60 -> 6, bt 90 -> 16, bt 120 -> 5. Onder de cap krijgt Daan dus de hele
winter exact dezelfde twee workouts; de recency-rotatie heeft niets om uit te kiezen.
Geverifieerd: quotum 3 met gap 1 levert TWEE KEER `sweetspot_2x10`.

**Het quotum is niet de rem.** `spreiding.midweekMinGap: 2` (alleen Onderhoud) laat in de
9u-week maar 2 kwaliteitsdagen toe; `kwaliteitPerWeek` op `{Base:2,Build:3,Peak:3}` zetten
verandert er niets aan. Quotum ophogen is dus geen fix en zit niet in deze bouw.

## 3. Wat er verandert — byte-precies

**Ingreep 1 — `effectiveMacroFase_` (`packages/engine/src/planner.ts:87`).**
Derde, OPTIONELE parameter `eventDriven`. Weggelaten/falsy -> byte-identiek aan nu.

    export function effectiveMacroFase_(
      fase: any,
      settings: any,
      eventDriven?: any,
    ): any {
      if (!settings || settings.doel !== "Onderhoud") return fase;
      if (eventDriven && fase !== "Test") return fase;
      return "Base";
    }

De `fase !== "Test"`-guard is defensief: `eventFase_` levert nooit "Test", maar zo blijft
"Onderhoud test nooit" waar langs elk pad.

**Ingreep 2 — de aanroeper (`apps/web/src/lib/proposal.ts:285`).**

    const macroFase = effectiveMacroFase_(macroFaseBase, settingsE, macro != null);

`macro` is de uitkomst van `eventFase_` (`proposal.ts:279`); `macro != null` betekent
precies "er is een A-event of trip, en de fase komt daarvandaan".

**Ingreep 3 — `PROFILES.onderhoud` (`packages/engine/src/archetypes.ts:1269`).**
De regel `maxDuurMin: 45,` VERVALT. De rest van het profiel blijft ongemoeid
(`kwaliteitPerWeek {Base:2,Build:2,Peak:2}`, `langeRitPerWeek: 0`, `debtEnabled: false`,
`midweekMinGap: 2`, `volumeResponse {0,0}`). De LEZER op `planner.ts:423` blijft staan —
de seam blijft bruikbaar; alleen zet geen profiel het veld meer. De comment op
`planner.ts:424` die "Onderhoud 45" noemt wordt bijgewerkt.

Geen andere lezers: `maxDuurMin` komt repobreed alleen voor op `archetypes.ts:1269`,
`planner.ts:423-424` en in de selftest.

## 4. Bewuste GAS-fork

Beide ingrepen zijn een AFWIJKING van de bevroren GAS-bron (`daanhhk/training` @ `3e8090a`),
die ongemoeid blijft. GAS draagt dezelfde pin (`src/Algorithm.gs:71`) en dezelfde cap
(`src/Algorithm.gs:943`).

Nuance die de fork licht maakt: GAS noemt het onderhoud-profiel in zijn EIGEN commentaar
onaf. `src/Archetypes.gs:544-546`: "Fase 1 (scaffolding) ... Gedrag (fase-pin/quota-lock/
debt-off/duur-cap) = Fase 2; projectie = Fase 3 (valt nu op girona via
activeGoalProfile_-rest-tak)". Fase 3 is nooit gebouwd. Dit is dus geen breuk met een
doordacht GAS-ontwerp maar het afmaken van een gedeclareerd onaf profiel.

## 5. Toets aan het model

- M49 (de fase volgt het doel) / M50 (onderhouden is geen basisfase): de pin was
  letterlijk het loodgieters-voorbeeld uit M49. Na de fix volgt de fase het event; zonder
  event blijft er bewust geen macrocyclus (Onderhoud bouwt niet op naar niets).
- M38 (onderhouden = de intensiteit die FTP draagt blijft staan terwijl het volume zakt;
  een onderhoudsweek is geen zachte week): de cap was de enige reden dat Onderhoud zacht
  was. Na de fix is de prikkel per sessie een echte FTP-dragende dosis; het verschil met
  doel FTP zit waar het hoort — geen lange-rit-slot, geen Build-ramp in het quotum, geen
  inhaal-forcering, ruimere spreiding, geen volume-gedreven vo2.
- M46 (elke sessie heeft een bedoeling; de duur van een prikkel volgt uit wat de prikkel
  moet doen): een 165-minutenrit die "Drempel 2x8 kort" heet viel hier doorheen.
- M74-M78 (karakter-invariantie): ONGEMOEID. Er verandert niets aan %FTP per blok; de
  dosis-ramp (`mesoFactor`) en de deload blijven zoals ze zijn.
- M72 (herstel is beschermd): de event-herstelweek komt terug.
- M7/M9/M47: de prikkel groeit na de fix nog steeds niet met het urenbudget (45' bij 6 t/m
  12 u). Dat is GEEN Onderhoud-defect — doel FTP doet exact hetzelfde, en op weekniveau is
  het M47-conform (totale belasting is de hendel, TSS loopt 262 -> 646). T10/T19 gaan
  hiermee dicht als "gemeten, model-conform", zonder aparte ingreep.

## 6. Gemeten gevolgen van de fix

Realistische winterweek Daan (di+do pendel 2x75, wo 90, za 180, zo 120), fase Base:
  nu      HIGH 36'   sweetspot_2x10 + threshold_2x8
  na fix  HIGH 66'   sweetspot_short + threshold_overunder
9u-week per fase, na de fix: Base 45' / Build 45' / Peak 21' HIGH + 8' ANA
(`threshold_overunder` + `vo2_40_20`). Piek is dus scherper, niet langer — zelfde vorm
als doel FTP, dat gaat van 45' naar 21'+8'.

## 7. Risico dat Daan moet zien: het lange-dagen-gat

`goalWorkout_` levert `null` zodra geen archetype de dag omvat; de langste `duurRange` is
135 minuten. Een week waarin ELKE trainbare dag langer is dan 135 minuten krijgt daardoor
NUL kwaliteit. Gemeten (week 150/150/240/180): doel FTP HIGH 0' — dit gat bestaat vandaag
al voor alle doelen. Voor Onderhoud maskeerde de cap het (HIGH 36'); na de fix erft
Onderhoud hetzelfde gat.

Bereikbaarheid voor Daan: NIET. Een pendeldag rekent op `settings.pendelDuurMin` (75), dus
zolang er een pendeldag in de week staat is er altijd een dag waar een archetype past.

Voorstel: NIET in deze bouw oplossen. Het is de spiegel van T17 (korte-dag-val, 35-51')
en hoort in dezelfde aparte fix: de prikkel op een lange dag hoort een blok BINNEN de rit
te zijn (`combo_long_with_efforts`), geen archetype dat de dag moet omvatten.

## 8. Buiten deze bouw

- De fase-overgang AANKONDIGEN ("AGR komt eraan, we bereiden ons daarop voor") — M51/M10,
  de open kant van T14. Client-only, eigen stapje direct hierna.
- T2 (meetlat): `activeGoalProfile_` (`packages/engine/src/niveau.ts:629`) meet Onderhoud
  tegen het girona-profiel (klim 4,0 W/kg, CTL 65, lange rit 4,0 u) terwijl het
  planner-profiel `langeRitPerWeek: 0` zet. Andere laag (Niveau/projectie), aparte bouw.
  Let op: de GAS-selftest asserteert Onderhoud hier NIET expliciet
  (`src/SelfTest.gs:407-413` dekt FTP/Beklimmingen/VO2max/Conditie/onbekend/missing/null),
  dus er is geen oracle die de wijziging tegenhoudt.
- T17 (korte-dag-val) plus het lange-dagen-gat uit paragraaf 7: samen, eigen fix.

## 9. Tests en vloeren

Te WIJZIGEN in `packages/engine/src/selftest.test.ts`, `testOnderhoudWeekSim`:
- de assert "onderhoud alle quality <=45 (korte arch)" vervalt en wordt vervangen door
  "het gekozen archetype past bij de dag": `duurRange[0] <= dagminuten <= duurRange[1]`.
Te BEHOUDEN: exact 2 quality, geen lange rit, geen debt-slot, de drie bestaande
`effectiveMacroFase_`-asserts (2-arg -> ongewijzigd gedrag).
Toe te VOEGEN:
- `effectiveMacroFase_("Build"|"Peak"|"Recovery", {doel:"Onderhoud"}, true)` -> passthrough
- `effectiveMacroFase_("Test", {doel:"Onderhoud"}, true)` -> "Base" (guard)
- `effectiveMacroFase_("Peak", {doel:"Onderhoud"})` -> "Base" (zonder event ongewijzigd)
- week-sim: Onderhoud met `macroFase "Recovery"` levert NUL quality (allocActive uit)
Client-kant (`apps/web`): een test dat met doel Onderhoud plus een A-event op 3 weken de
payload-`macroFase` "Peak" is en niet "Base".

Vloeren: het vitest-totaal en de engine-selftest-assert-count staan in HANDOFF (STAND) en
mogen niet regresseren; beide gaan door deze bouw omhoog. Uit de suite lezen, niet
hardcoden.
