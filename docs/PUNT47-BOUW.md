# Punt 47 — twee bouwrondes die geen van beide gebouwd hebben

Het bouwspoor van ROADMAP punt 47: de ijking aan het eind van een blok. Twee rondes, allebei
opgezet als de proef van ROADMAP punt 52 — recon en bouw in één ronde, met de verwachtingen als
VOOR-AUTORISATIE. **Beide keren viel er een verwachting om en is er niets gebouwd.** Dat is de
opbrengst van de vorm en geen mislukking: twee ontwerpen zijn tegengehouden vóór de eerste regel
code, en het tweede is door de meting zelfs OMGEKEERD.

## Leeswijzer

Eén document, twee rondes, doorlopende nummering.

- **§0 t/m §6 — RONDE 1 (23-08-2026, ochtend): de OMHANGING naar de doelblok-klok.** Verwachting V1
  viel: de vierweekse klok bindt het aanbod op drie samenhangende plekken. §6 draagt het
  punt-52-oordeel van die ronde; het is niet ingetrokken, maar §12 vervangt het door een scherper.
- **§7 t/m §12 — RONDE 2 (23-08-2026, middag): de DAG-VLOER als uitdrukking van M90b.** Verwachting
  W2 viel: de afgeleide vloer van 84 dagen ruilt een voorspelbare trefkans van ongeveer één op drie
  in voor een LOTERIJ die door een historisch toeval wordt beslist. §12 draagt het punt-52-oordeel
  dat telt.

**LEES §9 W2 IN ZIJN GEHEEL, want daar staat een CORRECTIE op mijn eigen eerste uitslag.** Die
uitslag luidde dat vloer 84 de doelblokgrens NOOIT raakt. Dat was te absoluut en is adversarieel
weerlegd vóór er iets gecommit was; de fout, hoe hij is gevonden en de herstelmeting staan er alle
drie bij. Neem het cijfer 0-van-154 uit dit document nergens over.

**DE STAND VAN PUNT 47 NA BEIDE RONDES — en die is NIET dat beide routes op zijn.** Er zijn twee
routes voorgesteld om de ijking op de doelblokgrens te laten landen: de klok omhangen (ronde 1) en
de dag-vloer afleiden (ronde 2). Elk apart werkt niet — de vloer alleen laat de dekking op 25,0%
staan waar zij al stond. **SAMEN werken ze wél, en dat is gemeten** (§9 W2-d): poort (1) op de
doelblok-testweek plus de vloer op 84 tilt het aandeel doelblokgrenzen dat werkelijk een ijking
krijgt van **25,0% naar 66,9%** bij een realistische planner, en van 25,0% naar 99,9% bij een vaste
weekvorm. De grond waarop ronde 1 de omhanging liet vervallen — een versmalling van dertien
openingen naar vier — telde OPENINGEN waar het om GELEVERDE IJKINGEN gaat, en is daarmee weerlegd.

## 0. Omgevingsverklaring

Gerapporteerd vóór enige `cd`, en na een `cd` opnieuw — beide gaven hetzelfde.

- **Werkpad:** `/c/Users/daan/Projects/cadans`, zowel vóór als ná `cd`. Die regel is hier een no-op.
- **Worktree:** NEE. `git rev-parse --git-dir` en `--git-common-dir` geven allebei `.git`; gelijk is
  hoofdcheckout.
- **Branch:** `main`. Remote `https://github.com/daanhhk/Cadans.git`, dus een checkout van
  `daanhhk/Cadans`.
- **Achterstand:** geen. `git rev-list --left-right --count origin/main...HEAD` geeft `0` achter en
  `0` vooruit, na een verse `git fetch origin main`.
- **Versie:** `2.1.208 (Claude Code)`.

Geen STOP-conditie geraakt.

## 1. De drie harnas-aflezingen

**ALLE DRIE ZIJN OPNIEUW NIET-METINGEN, en de oorzaak is nu structureel vast te stellen.** Deze
sessie is niet vers: haar transcript is aangemaakt op **2026-07-14 09:20:16**, terwijl het
agent-bestand en de probes uit commit `e7c3e910` van **2026-08-23** komen. Een sessie kan de
laadmachinerie die bij háár start draaide niet achteraf meten.

**(a) DE RULES-SEMANTIEK — geen van drie, want de vraag is hier niet stelbaar.** Mijn eerste antwoord
in deze sessie begon niet met `RULESALTIJD-MERKSTRING-R5N9YB`, en `RULESPATHS-MERKSTRING-K8T3WQ`
verscheen niet. Dat is de DERDE optie uit de vraagstelling: **niet-geladen en geladen-maar-genegeerd
zijn niet te scheiden** — en er is een derde verklaring die minstens zo waarschijnlijk is, namelijk
dat de map bij sessiestart niet bestond en dus nooit gescand is. Het verdict uit
`docs/PUNT51-RULES-VERDICT.md` blijft dus staan zoals het stond: de documentatie zegt JA, de empirie
is niet gedaan.

**(b) `.worktreeinclude` IS NIET GETOETST.** Beide probes bestonden in dit werkpad — maar dat bewijst
niets, want dit IS de hoofdcheckout waarin ze zijn aangemaakt. `.worktreeinclude` kopieert naar een
NIEUWE worktree, en er is er geen gemaakt. De meting die de vorige ronde bedoelde vraagt een sessie
die daadwerkelijk een worktree krijgt. **Niet gemeten**, niet gemeten-als-afwezig.

**(c) AGENT-DISCOVERY: NEE. TOOLS-BINDING: NIET GEMETEN.** De aanroep gaf verbatim:

```
Agent type 'recon' not found. Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup
```

Daarmee kon de recon-agent ook niet worden ingezet voor de meethelft van stap 3, zoals de opdracht
voorzag. Die helft is met de hand gemeten, met een wegwerp-opstelling buiten de repo-tree.

**(d)** Beide weggooi-regels zijn verwijderd; `.claude/rules/` bestaat niet meer.

**DE PATROONWAARNEMING DIE HIERBIJ HOORT.** Dit is de derde ronde op rij waarin een aflezing niet
lukt, en de oorzaken verschilden: eerst de sessiegrens, toen de authenticatie van `claude -p`, nu
opnieuw de sessiegrens. De opstelling verwacht een verse sessie die er niet komt. Zolang deze
sessie loopt is elke volgende poging dezelfde niet-meting; de aflezing hoort in een sessie die
aantoonbaar ná `e7c3e910` opent, en dat is een voorwaarde waar deze kant geen invloed op heeft.

## 2. De feiten, hertoetst tegen HEAD

De opdracht droeg feiten op hash `ad10bf7`; HEAD stond bij aanvang op `0a3f500`. Alle vier
hertoetst tegen de huidige bron en **ongewijzigd**:

- `apps/web/src/lib/blok.ts`, `BLOK_WEKEN`: `export const BLOK_WEKEN = 4;`
- `packages/engine/src/phase.ts`, `DOEL_BLOK_WEKEN`: `export const DOEL_BLOK_WEKEN = 12;`
- `apps/web/src/lib/testvoorstel.ts`: `export const TEST_INTERVAL_DAGEN = 90;` en
  `export const WEDSTRIJD_HORIZON_DAGEN = 28;`

## 3. De vier verwachtingen

### V1 — VALT

**De vierweekse klok bindt het ijkaanbod NIET op één plek.** Twee gronden, elk zelfstandig
voldoende.

**GROND A — een tweede plek in hetzelfde bestand rijdt dezelfde klok, en hij is dragend.** In
`apps/web/src/lib/testvoorstel.ts`, `buildTestVoorstel`, direct ná poort (1) en (2):

```
  const blokStart = blokStartVoorWeek(input.doelStart, input.weekMondayISO);
  const blokEind = shiftIso_(blokStart, BLOK_WEKEN * 7);
```

Dat venster voedt poort (3), die het aanbod onderdrukt als er al een test in staat:

```
    if (ov.datum < blokStart || ov.datum >= blokEind) continue;
```

`blokStartVoorWeek` is de vierweekse klok — hij roept `blokWeekVanWeek` aan — en `blokEind` is
`BLOK_WEKEN * 7`. Hang je poort (1) om naar de twaalfweekse grens en laat je dit staan, dan
onderdrukt een test uit een vierweeks venster een aanbod dat over een twaalfweeks blok gaat.

**GROND B — een consument BUITEN `testvoorstel.ts` hangt aan diezelfde blokstart.** Hij gaat mee in
de teruggegeven `TestVoorstel`:

```
  return {
    blokStart,
```

en wordt buiten het bestand gelezen als de AFWIJS-SLEUTEL, op twee plekken:

```
apps/web/src/components/schema/SchemaView.tsx:  !isTestVoorstelAfgewezen(testVoorstel.blokStart) &&
apps/web/src/components/schema/TestVoorstelCard.tsx:  afgewezen.add(voorstel.blokStart);
```

"Niet dit blok" betekent dus vandaag "niet dit VIERWEEKSE blok". Verzet je alleen poort (1), dan gaat
de afwijzing over een ander blok dan het aanbod, en kan een afgewezen aanbod binnen hetzelfde
doelblok terugkomen — of juist te lang wegblijven.

**WAT DIT BETEKENT.** De omhanging is niet één conditie maar een SAMENHANGENDE wijziging van drie
dingen: de poort, het onderdrukkings-venster, en de identiteit van het aanbod. Dat is precies de
soort ingreep waarvoor de voor-autorisatie bedoeld was om hem NIET blind te doen.

### V2 — HOUDT

**De twaalfweekse doelblok-teller leeft, en wordt niet overschaduwd.** Gemeten over 52
weekmaandagen vanaf de live `doelStart` `2026-06-29`, met hoofdevent AGR op `2027-04-17` aanwezig,
via de echte `computeMacroPhase`, `eventFase_` en `effectiveMacroFase_`:

```
  2026-09-14  doelblokweek=12 blokNr=1 isTestWeek=true doelfase=Test eventfase=Base  EFFECTIEF=Test
  2026-12-07  doelblokweek=12 blokNr=2 isTestWeek=true doelfase=Test eventfase=Base  EFFECTIEF=Test
  2027-03-01  doelblokweek=12 blokNr=3 isTestWeek=true doelfase=Test eventfase=Build EFFECTIEF=Test
  2027-05-24  doelblokweek=12 blokNr=4 isTestWeek=true doelfase=Test eventfase=geen  EFFECTIEF=Test
```

Vier testweken, en **0 van de 4 overschaduwd** door de event-fase: `effectiveMacroFase_` geeft in
alle vier `Test` terug. De teller is geen dode code.

**BEREIKBAARHEID ZONDER ENGINE-WIJZIGING: JA.** `computeMacroPhase` wordt in `apps/web/src/lib` al
geïmporteerd door `blok.ts`, `faseOvergang.ts`, `proposal.ts` en `schema.ts`. `buildTestVoorstel`
draagt `input.doelStart` en `input.weekMondayISO` al, en dat is precies de invoer die de functie
vraagt. Een import erbij, geen regel in `packages/engine`.

**EEN STRUCTUREEL FEIT DAT DE OPDRACHT NIET NOEMDE en dat de ingreep goedkoper maakt dan gedacht:**
in alle vier de gevallen is de vierweekse blokweek óók 4. Twaalf is een veelvoud van vier, dus **de
twaalfweekse grens is een DEELVERZAMELING van de momenten waarop poort (1) vandaag al opengaat.** De
omhanging is dus een VERSMALLING — van dertien openingen per jaar naar vier — en niet een
verschuiving naar andere weken. Geen enkel nieuw moment komt erbij.

### V3 — HOUDT

**Een doelwissel onderdrukt het aanbod, en de omhanging zou dat gat verbreden.** Gemeten met de
echte `blokStartBijDoel` en `blokWeekVanWeek`, voor vijf wisseldagen rond een weekgrens:

```
  wissel op 2026-09-07 (weekdag 1) -> nieuwe doelStart 2026-09-07; blokweek daar = 1; poort(1) vuurt pas over 3 weken (vierweeks), 11 weken (twaalfweeks)
  wissel op 2026-09-10 (weekdag 4) -> nieuwe doelStart 2026-09-14; blokweek daar = 1; poort(1) vuurt pas over 3 weken (vierweeks), 11 weken (twaalfweeks)
```

Alle vijf gevallen geven blokweek 1 op de nieuwe `doelStart`. Het gat is dus REËEL: vandaag drie
weken, na een naïeve omhanging **elf**. Dat bevestigt de opdracht en maakt onderdeel 4(a) — de
wissel zelf als grens behandelen — noodzakelijk in plaats van optioneel. Het is ook het scherpste
argument waarom V1's val de bouw moet stoppen: de reparatie van V3 zit in dezelfde ingreep als de
drie plekken uit V1, en half doorvoeren maakt het erger dan vandaag.

### V4 — HOUDT

**De dag-vloer onderdrukt de doelblokgrens systematisch met zes dagen.**

```
  doelbloklengte in dagen: 12 x 7 = 84
  TEST_INTERVAL_DAGEN: 90
  verschil: 6 dagen
  concreet: ijking op 2026-09-21, volgende grens 2026-12-14 = 84 dagen later
  poort (7) eist >= 90; 84 < 90 -> onderdrukt
  eerste datum die de vloer haalt: 2026-12-20 — dat is 6 dagen NA de grens
```

Viel de vorige ijking op de vorige blokgrens, dan haalt de volgende grens de vloer niet en landt het
aanbod structureel in week 1 van het volgende blok. De voorgestelde reparatie — de vloer AFLEIDEN
van de doelbloklengte in plaats van hem als los beleidsgetal te laten staan — is daarmee gegrond.
Zij is deze ronde **niet gebouwd**, omdat zij zonder de omhanging van poort (1) geen betekenis heeft:
een vloer afstemmen op een grens die de poort niet gebruikt, verandert niets.

## 4. Wat er gebouwd is

**Niets.** V1 viel, en de voor-autorisatie was expliciet: bouw niet door op een omgevallen
verwachting. Er is geen regel code gewijzigd; `git status --porcelain` op `packages`, `apps` en
`workers` is leeg.

## 5. Wat benoemd is en niet gebouwd

Als ROADMAP-punten vastgelegd, want wat niet opgeschreven wordt is weg: de duurzame ONGEIJKT-staat
van M91 met de optie-inventaris; de doelcheck-maat per doel; het één-week-brede aanbodvenster dat
stil kan missen; en de twee constanten zonder herkomst-etiket. Zie `docs/ROADMAP.md`.

Niet gebouwd en niet aangeraakt: enige engine-wijziging, enige D1-migratie, enige deploy, enige
remote-D1-mutatie, en `WEDSTRIJD_HORIZON_DAGEN`.

## 6. Het punt-52-oordeel van RONDE 1 — draagt dit ENE document de bewijskracht van twee rondes?

> Dit is het oordeel zoals het na ronde 1 stond. Het is NIET ingetrokken — wat er staat is nog
> steeds waar — maar §12 vervangt het door een scherper oordeel dat op twee rondes rust.


**Ja voor de meting, en dat is toeval: de bouw viel weg.** Het criterium is niet "werkte het", dus
laat ik het per eigenschap langslopen.

**WAT NIET VERDUND IS.** Herkomst per getal staat er (`RECON`, `GEPIND`, gemeten deze ronde), en ik
heb de vier opgedragen feiten hertoetst tegen HEAD in plaats van de hash uit de opdracht over te
nemen. Noemers dragen hun uitsluitingen (4 van de 4 testweken, 0 overschaduwd; 5 van de 5
wisseldagen). Letterlijke strings staan er waar een claim eraan hangt — de drie regels uit
`buildTestVoorstel`, de twee consumenten-regels, de agent-foutmelding. "Niet gemeten" is drie keer
expliciet gescheiden gehouden van "gemeten als afwezig".

**WAAR HET WÉL DUN WERD, en dat hoort hier.** Bij V1 merkte ik de val op tijdens het meten, en mijn
eerste neiging was door te lezen naar V2 om te zien of de bouw alsnog kon. Dat is precies de druk
die de proef blootlegt: in een gesplitste ronde had V1 een RAPPORT opgeleverd en was de bouwprompt
opnieuw geschreven met poort (3) en de afwijs-sleutel erin. Nu moest ik mezelf tegenhouden. Ik heb
V2 tot V4 alsnog gemeten omdat MÉTEN geen bouwen is en de volgende ronde ze nodig heeft — maar dat
is een oordeel dat ik zelf velde, in dezelfde beweging waarin ik de stop-conditie moest handhaven.
**Dat is de zwakke plek van de vorm: de uitvoerder is ook de scheidsrechter over zijn eigen stop.**

**DE TWEEDE VERDUNNING ZIT IN DE OMVANG.** Dit document draagt de recon-helft goed. Wat het NIET
draagt, omdat er niet gebouwd is, is de tweede helft van de bewijslast: geen VOOR-en-NA-meting,
geen gewijzigde tests bij naam, geen verbatim gewijzigde strings. Of één rapport ook die tweede
helft kan dragen zonder te verdunnen, **is met deze ronde niet beantwoord** — de proef is halverwege
gestopt en dat is precies waar zijn eigen vraag begon.

**AANBEVELING.** Punt 52 niet afvinken en niet verwerpen. De proef is één keer gedraaid en heeft
zijn eigen vraag niet bereikt. Draai hem opnieuw op de eerstvolgende ronde waarin de verwachtingen
houden, en beoordeel dan pas — met dít document als nulmeting voor hoe de recon-helft eruitziet als
zij niet verdund is.

---

# RONDE 2 — 23-08-2026, middag: de dag-vloer als uitdrukking van M90b

## 7. Omgevingsverklaring en de agent

Gerapporteerd vóór enige `cd`. Er stond deze ronde met opzet geen vaste `cd`-regel in de prompt, en
er is dan ook niet ge-`cd`'d: er is één pad.

- **Werkpad:** `/c/Users/daan/Projects/cadans`.
- **Worktree:** NEE. `git rev-parse --git-dir` en `--git-common-dir` geven allebei `.git`.
- **Branch:** `main`, remote `https://github.com/daanhhk/Cadans.git` — een checkout van
  `daanhhk/Cadans`, dus de STOP-conditie is niet geraakt.
- **Achterstand:** geen. Na `git fetch origin main` geeft
  `git rev-list --left-right --count origin/main...HEAD` `0` en `0`.
- **Versie:** `2.1.208 (Claude Code)`.

**(a) DE RECON-AGENT: NIET GEMETEN, en deze keer is dat een AFGELEID en geen aangetroffen
resultaat.** De sessie is OUDER dan het agent-bestand — transcript aangemaakt **2026-07-14
09:20:16**, `.claude/agents/recon.md` aangemaakt **2026-08-23 07:48:15**. De prompt schrijft voor dat
je in dat geval niet alsnog probeert, en dat is ook niet gedaan: een aanroep zou opnieuw
`Agent type 'recon' not found` geven en dat is geen meting van de agent maar van de sessiegrens.
Het verschil met de geslaagde discovery in de remote container op `2.1.241` blijft dus ONVERKLAARD,
en die verklaring vraagt een sessie op deze machine die ná het bestand opent. De meethelft van §9
is met de hand gedaan.

**(b) DE VERWEESDE BRANCH BESTAAT NIET.** `git ls-remote --heads origin` geeft één regel:
`refs/heads/main`. `claude/cadans-aflezing-51-y73y9t` staat er NIET; er is niets te verwijderen en
niets dat een achterstand-lezing vervuilt.

## 8. De vraag van ronde 2 — en waarom de omhanging vervallen is

Ronde 1 stelde voor poort (1) om te hangen naar de twaalfweekse doelblok-klok. **Dat ontwerp is
VERVALLEN**, op een grond uit ronde 1 zelf: twaalf is een veelvoud van vier, dus de doelblokgrens is
per constructie al een opening van de vierweekse klok (gemeten: `blokweek4=4` bij alle vier de
testweken, §3 V2). De omhanging zou dertien openingen per jaar tot vier versmallen zonder iets te
winnen. Ronde 2 bouwt die omhanging dus niet, ook niet in afgeslankte vorm.

Wat ronde 2 wél voorstelde: `TEST_INTERVAL_DAGEN` — vandaag 90, een los beleidsgetal — AFLEIDEN van
de doelbloklengte, als de dag-uitdrukking van M90b (één ijkinspanning per doelblok). Een doelblok is
84 dagen. De redenering die het voorstel droeg: viel de vorige ijking op de vorige doelblokgrens,
dan zijn er op de volgende grens 84 dagen verstreken, blokkeert een vloer van 90 die grens met zes
dagen, en schuift het aanbod door naar de eerstvolgende vierweekse opening — vier weken ná de grens
waar M90a hem legt.

**Die redenering klopt op het geval waarop zij is opgeschreven, en is onwaar over het systeem.** Dat
is wat §9 meet.

## 9. De vier verwachtingen W1 t/m W4

Alle metingen draaien de ECHTE functies: `blokWeekVanWeek`, `blokStartVoorWeek`,
`buildTestVoorstel`, `laatsteGelegenheid` en `computeMacroPhase`, gebundeld met esbuild naar een
tijdelijk pad BUITEN de repo-tree, met `TZ=Europe/Amsterdam` gepind. Er is geen poort en geen
dagraster nagebouwd. De contrafeitelijke vloer komt uit één chirurgische substitutie van de literal
`export const TEST_INTERVAL_DAGEN = 90;` tijdens het bundelen, met een assertie in het script dat
die substitutie precies ÉÉN keer landt en dat de gebundelde constante daarna de bedoelde waarde
draagt; anders stopt het script met exitcode 2.

**IJKPUNT VOORAF.** De bestaande ijk-casus uit `apps/web/src/lib/testvoorstel.test.ts` reproduceert
op de onveranderde bron: wedstrijd 2026-05-21 geeft aanbod op `2026-08-22`, `blokStart`
`2026-07-27`, `dagenSinds` 93 — **1 van de 1**. Dat getal staat hier vóór elke andere uitslag.

### W1 — HOUDT

**Beide klokken ankeren op dezelfde grootheid, en dat is een eigenschap van de rekenkunde en niet
van één kalenderreeks.** `blokWeekVanWeek` in `apps/web/src/lib/blok.ts`:

```
  const dagen = Math.round((ws.getTime() - s0.getTime()) / MS_PER_DAY);
  const diff = Math.floor(dagen / 7);
```

`computeMacroPhase` in `packages/engine/src/phase.ts`:

```
  var diffDays = Math.round(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  var absWeek = Math.floor(diffDays / 7) + 1;
```

Dezelfde `Math.round` op het DAGverschil, daarna dezelfde `Math.floor` door zeven. De één beeldt die
index af op een cyclus van 4, de ander op 12. De docstring van `blokWeekVanWeek` zegt het zelf:

```
 * DIT IS DE 3:1-MESOTELLER, NIET HET DOEL-BLOK. `BLOK_WEKEN` is 4; `computeMacroPhase` draait een
 * cyclus van 12. Beide tellen weken sinds `doelStart` en delen dus dezelfde INDEX — alleen de
 * cyclus waarop ze die index afbeelden verschilt.
```

**GEMETEN, niet aangenomen:** over 260 weekmaandagen vanaf `doelStart` `2026-06-29` lezen beide
klokken dezelfde absolute weekindex in **260 van de 260** gevallen, uitsluitingen geen. Die reeks
kruist vijf zomer- en vijf wintertijdgrenzen; expliciet nagelopen op `2026-10-19`, `2026-10-26`,
`2027-03-22` en `2027-03-29`, alle vier in de pas. Er staat bovendien een assertie op in de engine
— `testTellersInDePas` in `packages/engine/src/selftest.test.ts`, met de regel
`assert_("tellers gelijk NA de sprong", na.viaMacro, na.viaPlanner);`.

**ÉÉN NUANCE, en die hoort erbij omdat zij in het DEGENERATE geval uiteenloopt.** Zonder `doelStart`
vallen de twee NIET op elkaar terug: `blok.ts` draagt `  if (!doelStartISO) return 1;` — een vaste
waarde — terwijl `phase.ts` `  if (!startDate) startDate = new Date();` draagt, en dus de AMBIENT
KLOK binnenhaalt. Gemeten: bij `doelStart` null geeft de vierklok blokweek 1 en de twaalfklok week 1
fase `Base`, wat hier toevallig samenvalt maar dat niet hoeft te doen. Dit raakt de bouw van deze
ronde niet en is geen val van W1 — het is een aantekening voor wie ooit aan een van beide klokken
komt.

### W2 — VALT

W2 draagt twee valcondities: *"VALT als 84 de grens niet raakt of als 90 hem toch raakt."* **Beide
vuren.** Maar de eerste uitslag van deze ronde formuleerde die val TE ABSOLUUT, en dat is
adversarieel weerlegd voordat er iets gecommit was. Hieronder staan eerst de fout en dan de
herstelmeting, in die volgorde, want een gecorrigeerde uitkomst zonder de correctie erbij leest als
een uitkomst die altijd zo luidde.

#### W2-a. De opstelling die de verwachting bevestigt — en waarom zij niets bewijst

De prompt schrijft de meting voor "met de vorige maximale inspanning op de vorige grens". Onder die
STIPULATIE klopt de verwachting: over alle 49 paren van weekdag-offsets (vorige test op offset j,
volgende testweek met de enige geschikte dag op offset k, tussen de grensweken `2026-09-14` en
`2026-12-07`, exact 84 dagen uit elkaar) valt het aanbod in de doelblok-testweek zelf bij **28 van
de 49** paren op vloer 84, tegen **1 van de 49** op vloer 90.

Die stipulatie is echter geen eigenschap van de app maar een AANNAME, en zij is precies de aanname
die getoetst moest worden. Zij is niet zelf-instandhoudend: accepteert de gebruiker één aanbod dat
niet op een grens ligt, dan geldt zij nooit meer.

#### W2-b. Mijn eerste uitslag was fout, en zo is dat vastgesteld

De vrijlopende keten — accepteer elk aanbod, laat de geaccepteerde test de volgende
`laatsteGelegenheid` worden — gaf op Daans ECHTE laatste meting (`2026-05-21`) vloer 84 met **0 van
de 22** aanbiedingen op de grens tegen vloer 90 met **5 van de 16**, en over zeven weekvormen 0 van
de 154 tegen 37 van de 112. Daaruit heb ik geconcludeerd dat vloer 84 de grens **NOOIT** raakt.

**Die conclusie is onhoudbaar, en vier onafhankelijke tegenmetingen hebben haar omvergeworpen.**
Drie concrete fouten in mijn opstelling:

1. **DE NOEMER 154 DROEG GEEN BREEDTE.** Alle zeven weekvormen deelden ÉÉN seed. Bij een
   fase-behoudende vloer bepaalt juist de seed de uitkomst volledig, dus het waren zeven kopieën
   van hetzelfde toeval: N=1 op de beslissende dimensie, gerapporteerd als N=154.
2. **EEN OR-TERM STOND PER CONSTRUCTIE DOOD** — een schending van `docs/CC-CHECKS.md` CHECK 23,
   die ik deze ronde zei te draaien. `laatsteGelegenheid` weegt drie bronnen; de derde,
   `sprongDagen`, leest `rolling_ftp` uit kolom 14, en mijn `actRij` zette die kolom nooit. In 260
   weken viel er dus geen enkele sprong, terwijl juist een sprong NIET op het vierweekse rooster
   ligt en de fase kan breken.
3. **HONDERD PROCENT ACCEPTATIE WAS DE KNOP, niet een vereenvoudiging.** Elk aanbod accepteren
   houdt de keten precies op het rooster. Eén overgeslagen aanbod herschikt de fase.

#### W2-c. De herstelmeting

Dezelfde echte functies, met de seed gevarieerd, de derde OR-term levend, en acceptatie als
variabele. **SEED-SWEEP over 120 opeenvolgende seed-datums** (`2026-03-02` t/m `2026-06-29`), elk
een volle keten van 260 weken:

```
  vloer 90: 628 van de 1976 aanbiedingen op de doelblokgrens = 31,8%
            elke seed bezoekt {4,8,12}: 120 van de 120
            seeds met ALLE aanbiedingen raak: 0   ·   seeds met GEEN enkel aanbod raak: 0
  vloer 84: 588 van de 2610 aanbiedingen op de doelblokgrens = 22,5%
            de keten klikt vast op ÉÉN doelblokweek: {4} bij 64 seeds, {8} bij 28, {12} bij 28
            seeds met ALLE aanbiedingen raak: 28  ·   seeds met GEEN enkel aanbod raak: 92
```

**DE DERDE OR-TERM, nu levend** (`sprongDagen` vindt de ingelegde sprong op `2027-01-27`, 1 van de
1): vloer 84 gaat van `0/22` zonder `rolling_ftp` naar `0/21` met één sprong en `4/19` met vier
sprongen; vloer 90 blijft rond `5/16`, `6/16`, `5/15`.

**ÉÉN OVERGESLAGEN AANBOD:** vloer 84 springt van `0/22` naar `21/22` als het EERSTE aanbod niet
geaccepteerd wordt, en naar `19/22` als het derde dat niet wordt. Vloer 90 beweegt nauwelijks:
`5/16` naar `6/17`.

**HET MECHANISME — en ook mijn eerste verklaring dáárvan was fout.** Ik schreef dat de lock ontstaat
doordat 84 dagen exact twaalf weken IS. Dat klopt als rekensom (nagemeten over vensters die zomer-
en wintertijdgrenzen kruisen: `Math.round` op het DAGverschil vangt de sprong), maar het is niet de
OORZAAK. De oorzaak is de VIERWEEKSE OPENINGSPERIODE. Poort (1) laat alleen blokweek 4 door, dus
openingen liggen 28 dagen uit elkaar en de afstand tussen twee aanbiedingen is
`ceil(vloer / 28) × 28` dagen. Die afstand behoudt de doelblokweek precies wanneer die factor een
drievoud is. Gemeten, vloer 50 t/m 120, dezelfde keten:

```
   50 t/m  56 : 11 van de 33 op de grens · doelblokweken {4,8,12} · cyclus
   57 t/m  65 :  0 van de 22             · doelblokweken {4}      · LOCK
   66 t/m  84 :  0 van de 22             · doelblokweken {8}      · LOCK
   85 t/m  93 :  5 van de 16             · doelblokweken {4,8,12} · cyclus
   94 t/m 112 :  6 van de 16             · doelblokweken {4,8,12} · cyclus
  113 t/m 120 :  5 van de 13             · doelblokweken {4,8,12} · cyclus
```

**Vloer 84 is niet te onderscheiden van elke vloer van 66 t/m 84 — negentien waarden, identiek
gedrag.** De gelijkheid 84 = 12 × 7 doet niets dat 71 niet ook doet. Daarmee is de AFLEIDING zelf
leeg: "de dag-uitdrukking van M90b" levert een getal op dat rekenkundig samenvalt met een hele band
willekeurige waarden, en het doelblok speelt er geen rol in.

**EN DE LOCK OVERLEEFT GEEN ECHTE PLANNER.** De lock bestaat alleen bij een BEVROREN weekvorm, want
alleen dan ligt de gekozen dag elke keer op dezelfde weekdag. Met een planner die per week een
andere ruimste dag oplevert — 60 deterministische ketens per vloer, zaden 1 t/m 60, geen
`Math.random` — verdwijnt hij volledig: **0 van de 60** ketens houdt een vaste doelblokweek, bij
BEIDE vloeren, en de twee vloeren worden ononderscheidbaar: vloer 90 raakt 321 van de 973 (33,0%),
vloer 84 raakt 352 van de 1116 (31,5%).

**W2 VALT, op beide condities.** "90 raakt hem toch": 31,8% over 120 seeds bij vaste weekvorm en
33,0% bij wisselende, bij ELKE seed. "84 raakt de grens niet": 0% bij 92 van de 120 seeds. En de
scherpste uitslag staat in W2-d hieronder: **op de grootheid die ertoe doet verandert het voorstel
niets.**

#### W2-d. Wat de bouw zou hebben opgeleverd, en wat er WEL werkt

De laatste meting legt de vier varianten naast elkaar op de enige grootheid die M90a uitdrukt —
hoeveel DOELBLOKGRENZEN krijgen werkelijk een ijking — over 40 ketens van 260 weken, elk met een
eigen seed, dus 840 grenzen per variant. Uitsluitingen: geen.

```
  VASTE weekvorm (grote dag altijd zaterdag)
    huidig      : vierweekse poort + vloer 90 : 210 van de 840 = 25,0% · 3,29 aanbiedingen/jaar
    voorstel 3a : vierweekse poort + vloer 84 : 210 van de 840 = 25,0% · 4,35 aanbiedingen/jaar
    rooster     : doelblok-poort   + vloer 90 : 437 van de 840 = 52,0% · 2,19 aanbiedingen/jaar
    rooster+84  : doelblok-poort   + vloer 84 : 839 van de 840 = 99,9% · 4,20 aanbiedingen/jaar

  WISSELENDE weekvorm (per week een andere ruimste dag — het realistische geval)
    huidig      : vierweekse poort + vloer 90 : 210 van de 840 = 25,0% · 3,31 aanbiedingen/jaar
    voorstel 3a : vierweekse poort + vloer 84 : 227 van de 840 = 27,0% · 3,74 aanbiedingen/jaar
    rooster     : doelblok-poort   + vloer 90 : 437 van de 840 = 52,0% · 2,19 aanbiedingen/jaar
    rooster+84  : doelblok-poort   + vloer 84 : 562 van de 840 = 66,9% · 2,81 aanbiedingen/jaar
```

**DE UITSLAG OVER HET VOORSTEL VAN DEZE RONDE, in één regel: 25,0% wordt 25,0%, of 27,0% bij een
wisselende weekvorm.** De bouw zou een constante en een docstring hebben veranderd en aan de vraag
waarvoor zij bedoeld was — landt de ijking op de doelblokgrens — vrijwel niets. Wat zij wél zou
hebben gedaan is vaker aanbieden (3,29 naar 4,35 per jaar) in weken die géén grens zijn. Dat is een
verslechtering: meer testverzoeken, evenveel ijkingen op het moment dat M90a bedoelt.

**WAT WEL WERKT — en het is de ROOSTERCONDITIE, dus precies wat ronde 1 liet vervallen.** Poort (1)
op de doelblok-testweek verdubbelt de dekking op eigen kracht (25,0% naar 52,0%) en samen met de
afgeleide vloer haalt zij 99,9% bij een vaste weekvorm en **66,9% bij een wisselende**. Die tweede
is het eerlijke getal, en het gat van een derde is geen ruis maar een benoembare oorzaak: schuift de
ruimste dag naar vroeger in de week dan hij vorige keer lag, dan haalt hij de vloer van 84 net niet
en valt de grens weg. **Dat is exact punt 55** — een venster dat één week breed is en niet openblijft
tot de ijking gedaan of geweigerd is.

**DE TWEE ONDERDELEN WERKEN ALLEEN SAMEN.** De vloer alleen doet niets (25,0% blijft 25,0%). Het
rooster alleen, met de huidige vloer van 90, haalt de helft — 84 dagen tussen twee grenzen haalt een
vloer van 90 nooit, dus elke tweede grens valt per constructie weg. Rooster ÉN vloer op 84 leveren
samen wat M90a en M90b samen vragen, met punt 55 als resterende lek.

**EN DAARMEE IS DE GROND WAAROP RONDE 1 DE OMHANGING LIET VERVALLEN WEERLEGD.** Die grond luidde: de
omhanging versmalt dertien OPENINGEN per jaar tot vier. Dat telde de verkeerde grootheid. Gemeten in
GELEVERDE IJKINGEN OP DE GRENS gaat de dekking van 25,0% naar 66,9% bij een realistische planner, en
de cadans van 3,31 naar 2,81 aanbiedingen per jaar — dus minder verzoeken die wél raak zijn, in
plaats van meer die dat niet zijn. Wat er versmalt is het RETRY-venster, en dat is een echte
kostenpost die punt 55 draagt, maar het is niet wat er in ronde 1 geteld leek te zijn. **De
omhanging is ten onrechte vervallen verklaard en hoort terug op tafel, ditmaal SAMEN met de vloer en
met punt 55 erbij.**

### W3 — HOUDT

**Eerst WAT poort (3) onderdrukt, want dat lag nergens vast.** Het venster komt uit twee regels in
`buildTestVoorstel` (`apps/web/src/lib/testvoorstel.ts`):

```
  const blokStart = blokStartVoorWeek(input.doelStart, input.weekMondayISO);
  const blokEind = shiftIso_(blokStart, BLOK_WEKEN * 7);
```

en de poort zelf onderdrukt op één ding:

```
    if (ov.datum < blokStart || ov.datum >= blokEind) continue;
    const o = ov.override as { type?: unknown; workoutType?: unknown } | null;
    if (o?.type === "library" && String(o.workoutType ?? "") === "test") {
```

Dus: **staat er in dit VIERWEEKSE blok al een test-override, dan biedt de app er geen tweede aan.**
Gemeten venster: `[2026-07-27 .. 2026-08-24)`, 28 dagen. De randen zijn gemeten en niet aangenomen —
een override OP `blokStart` onderdrukt, een override OP `blokEind` onderdrukt NIET, en een override
één dag vóór `blokStart` onderdrukt evenmin.

**POORT (3) IS NIET REDUNDANT NAAST POORT (7), en dat is de reden dat hij bestaat.** Gemeten: een
test die GEPLAND staat maar nog niet gereden is onderdrukt het aanbod via poort (3), terwijl
`laatsteGelegenheid` hem NIET ziet — die gaf op datzelfde geval `{"bron":"race","datum":"2026-05-21"}`
en niet de geplande test. De oorzaak staat in `apps/web/src/lib/effect.ts`, in `laatsteGelegenheid`:

```
    if (bron !== "inspanning" && !isGereden_(input.activities, datum)) return;
```

Poort (7) telt dus alleen wat werkelijk GEREDEN is; poort (3) bewaakt wat INGEPLAND staat. Twee
verschillende vragen op twee verschillende bronnen.

**BEWEEGT HET VENSTER MEE MET DE VLOER? NEE.** Geen van beide regels noemt `TEST_INTERVAL_DAGEN`, en
gemeten geven vloer 90 en vloer 84 op alle vier de venstergevallen (geen override, override in het
venster, override op `blokStart`, override op `blokEind`) exact dezelfde uitslag. De betekenis
verschuift evenmin: poort (3) blijft "één test per vierweeks blok" ongeacht wat de vloer doet.

### W4 — HOUDT, met één consequentie die de bouw duur maakt

**Geen consument buiten het bestand.** `TEST_INTERVAL_DAGEN` komt in de hele bron op precies twee
plekken voor, beide in `apps/web/src/lib/testvoorstel.ts`: de definitie op regel 27 en de poort
`  if (dagenSinds != null && dagenSinds < TEST_INTERVAL_DAGEN) return null;`. Daarbuiten alleen
`apps/web/src/lib/testvoorstel.test.ts` — het eigen testbestand — en documentatie. Geteld over de
hele bron zonder `head`-afkapping, dus geen onware afwezigheid (CHECK 15).

**Gemeten dat de vloer niets buiten het aanbodmoment raakt:** met dezelfde invoer geven vloer 90 en
vloer 84 een identiek `TestVoorstel` — **0 van de 5** velden verschilt (`blokStart`, `datum`,
`durMin`, `beschikbaarMin`, `dagenSinds`). `WEDSTRIJD_HORIZON_DAGEN` blijft 28, `TEST_DUUR_MIN` 60,
`TEST_MIN_BESCHIKBAAR_MIN` 60.

**DE CONSEQUENTIE DIE ERBIJ HOORT, en die had de bouw duur gemaakt.** Eén bestaande test verliest
zijn bewijskracht onder een vloer van 84, en niet alleen zijn assertie. Het gaat om
`"toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 88 dagen"` in
`apps/web/src/lib/testvoorstel.test.ts`, met deze twee regels:

```
    expect(dagen).toBe(88);
    expect(dagen).toBeLessThan(TEST_INTERVAL_DAGEN);
```

Die test toont aan WAAROM poort (7) tot de gekozen testdatum meet en niet tot de weekmaandag: van
`2026-05-21` is de weekmaandag `2026-08-17` 88 dagen weg en de testdag `2026-08-22` 93. Bij vloer 90
ligt 88 ONDER en 93 BOVEN de vloer, dus het contrast bestaat. Bij vloer 84 liggen ze ALLEBEI boven
de vloer en **verdwijnt het contrast** — de fixture toont dan niets meer. De assertie zou rood
worden, en haar simpelweg bijstellen zou een verstopte regressie zijn geweest; er had een NIEUWE
fixture onder gemoeten. Verder pint één testNAAM de oude waarde:
`"een sprongdag binnen 90 dagen vóór de testdatum ONDERDRUKT het aanbod"`. Het getal 90 komt in dat
bestand ook voor als `minuten: 90`, maar dat is een andere grootheid (beschikbare minuten) en geen
consument van de vloer.

## 10. Wat er in ronde 2 gebouwd is

**Niets.** W2 viel, en de voor-autorisatie is expliciet: valt er een verwachting om, dan stop je
daar. `git status --porcelain` over `packages`, `apps` en `workers` is leeg; er is geen regel code
gewijzigd, geen test aangepast, geen docstring geschreven. De onderdelen (a) tot en met (e) van
sectie 3 van de prompt zijn alle vijf NIET gebouwd, en (a) is bovendien WEERLEGD in plaats van
alleen uitgesteld.

Ook onaangeroerd, zoals sectie 4 van de prompt voorschreef: de omhanging, de duurzame
ONGEIJKT-staat van M91, de doelcheck-maat per doel, `WEDSTRIJD_HORIZON_DAGEN`, poort (3), de
afwijs-sleutel, en elke engine-wijziging, migratie of deploy.

## 11. Wat benoemd is en niet gebouwd

Als ROADMAP-punt vastgelegd, want wat niet opgeschreven wordt is weg. Het wisselgat, M91's
ONGEIJKT-staat, de doelcheck-maat per doel en de twee constanten zonder herkomst-etiket staan als
punt 53 tot en met 56. Nieuw uit deze ronde: **punt 57** — het aanbodmoment hangt aan een INTERVAL
terwijl M90a een ROOSTER vraagt, met de gemeten bandstructuur als bewijs dat een vloerwaarde alleen
dat gat niet dicht, en met de gemeten combinatie rooster-plus-vloer als de route die het wél doet.
**De vervallenverklaring van de omhanging bij punt 47 is INGETROKKEN**, met de meting erbij die haar
grond weerlegt.

**NIET GEBOUWD OMDAT ER GEEN AUTORISATIE VOOR IS, en dat is geen aarzeling maar de grens van deze
ronde.** De combinatie die werkt raakt poort (1), en dat is precies de omhanging die deze prompt in
sectie 1 verbood — met een grond die deze ronde weerlegd heeft. Een verbod dat op een weerlegde
grond rust is geen verbod meer, maar het intrekken ervan is niet aan de uitvoerder. Ronde 3
autoriseert het of niet.

## 12. Het punt-52-oordeel dat telt — en het is scherper dan dat van ronde 1

De prompt stelde vast dat deze ronde wél een bouw-helft zou hebben en dat punt 52 daarom zijn
oordeel kon krijgen. **Die aanname is door de ronde zelf weerlegd: er is opnieuw niet gebouwd.**
Twee keer op rij is een ronde die als recon-plus-bouw was opgezet bij de recon gestopt. Toch is er
nu wél een oordeel te geven, en het is een ander dan "nog niet te zeggen".

**HET VERDICT: DE VORM VERDUNT OP TWEE PLEKKEN, EN IK KAN ZE ALLEBEI AANWIJZEN OMDAT ZE DEZE RONDE
ALLEBEI HEBBEN TOEGESLAGEN.**

**DE EERSTE VERDUNNING ZIT IN DE VOOR-AUTORISATIE ZELF.** De prompt schreef de meting voor "met de
vorige maximale inspanning op de vorige grens". Dat is geen neutrale meetinstructie maar een
STIPULATIE die de te toetsen aanname al bevat. Had ik precies gemeten wat er stond, dan had W2
GEHOUDEN — 28 van de 49 tegen 1 van de 49, een overtuigende marge — en dan was er een vloer gebouwd
die op de grootheid die telt niets verandert (25,0% blijft 25,0%). De val kwam pas boven water in de
vrijlopende keten, en die was niet voorgeschreven; ik heb hem gedraaid omdat "over een kalenderreeks
van meerdere blokken" zich er niet toe leende de stipulatie voor lief te nemen. In een GESPLITSTE
ronde levert de recon een rapport en schrijft de architect de bouwprompt daarna, met de gemeten
uitkomst voor zich in plaats van met zijn eigen model erin. De gecombineerde vorm laat die
gelegenheid weg. Wat de val ving was INITIATIEF van de uitvoerder, en initiatief is geen controle:
niet af te dwingen, niet af te lezen, en het faalt zonder spoor.

**DE TWEEDE VERDUNNING IS ERNSTIGER, want zij trof mijn eigen meting en ik had haar zelf niet
gezien.** Mijn eerste uitslag luidde dat vloer 84 de doelblokgrens NOOIT raakt — 0 van de 154. Die
uitspraak was fout, en de drie fouten eronder waren van precies het soort dat dit project al jaren
op papier verbiedt: een noemer van 154 die in werkelijkheid N=1 was op de beslissende dimensie; een
OR-term van `laatsteGelegenheid` die per constructie dood stond, in strijd met CHECK 23 die ik
diezelfde ronde zei te draaien; en een verklaring die de lock aan `84 = 12 × 7` toeschreef terwijl
elke vloer van 66 t/m 84 hetzelfde doet. Ik had die uitslag al in dit document en in `ROADMAP.md`
geschreven voordat de weerlegging binnenkwam.

**WAT HAAR VING WAS EEN ADVERSARIËLE CONTROLE DIE NIET IN DE PROMPT STOND.** Vier onafhankelijke
lenzen — rekenkundig, fixture, code-lezing en alternatief — kregen de opdracht de claim te
WEERLEGGEN, met eigen meetscripts buiten de repo. Alle vier weerlegden hem, met hoge zekerheid, en
alle vier op dezelfde kern. Daarna heb ik hun bevindingen NIET overgenomen maar zelf nagemeten, en
de correcties in §9 rusten op mijn eigen harnas. **De uitkomst van W2 — VALT — is overeind gebleven;
alles eronder is vervangen.**

**DAAR ZIT DE LES OVER PUNT 52, en hij is oncomfortabel.** De gecombineerde vorm brengt meten en
concluderen in één beweging, en een conclusie die eenmaal opgeschreven is, is meteen de conclusie
van het document — er zit geen rapport-en-antwoord meer tussen waarin iemand anders "noemer 154,
waarvan hoeveel onafhankelijk?" vraagt. Dat is precies de vraag die de splitsing gratis stelt. Ik
heb hem deze ronde alleen gekregen doordat ik zelf een weerleggingsronde heb opgetuigd; had ik dat
niet gedaan, dan had er een verkeerd mechanisme in `ROADMAP.md` gestaan, met getallen erbij, en had
het er overtuigend uitgezien.

**WAT IK ERVAN VIND, als aanbeveling.** Niet terug naar twee prompts voor alles — dat gooit een
gemeten besparing weg. Twee rondes hebben elk een fout ontwerp tegengehouden tegen recon-prijs, en
dat is precies wat punt 52 als beste geval voorspelde. Maar de vorm draait niet zonder TWEE regels
die hij nu mist, en beide zijn deze ronde afgedwongen door schade:

1. **Een voor-autorisatie mag geen initiële conditie STIPULEREN die de te toetsen aanname bevat.**
   Waar zij dat toch doet, meet de uitvoerder ook de vrijlopende variant en rapporteert beide.
2. **Een gecombineerde ronde sluit af met een adversariële weerleggingspas op haar eigen hoofdclaim,
   uitgevoerd door instanties die de claim niet hebben opgesteld, vóór de commit.** Dat is de
   vervanger van de tweede prompt: niet een tweede ronde werk, maar een tweede paar ogen op de
   conclusie. Zonder die pas is de gecombineerde vorm goedkoper dan de splitsing én minder
   betrouwbaar, en dat is de slechtste ruil die er is.

**WAT NOG STEEDS NIET GETOETST IS, en dat mag niet als geregeld lezen.** Of één document de
BOUW-helft even goed draagt als een eigen rapport — de oorspronkelijke vraag van punt 52 — is na
twee rondes nog altijd onbeantwoord, om de eenvoudige reden dat er twee keer geen bouw was. Punt 52
kan dus niet worden afgevinkt. Wat het wél verdient is de nieuwe regel hierboven, en een derde
poging op de eerstvolgende ronde waarin de verwachtingen houden.

<!-- EINDE docs/PUNT47-BOUW.md -->
