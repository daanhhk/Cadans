# Punt 47 — twee rondes die niet bouwden, en een derde die het wel deed

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

- **§13 t/m §18 — RONDE 3 (23-08-2026, avond): de VERSMALLING en de VLOER, samen.** Beide helften
  in één geautoriseerde wijziging. X1 en X2 hielden, X3 viel — en zijn val was de scherpste vondst
  van de ronde. **Er is gebouwd.** §18 sluit punt 52.

**LEES §9 W2 IN ZIJN GEHEEL, want daar staat een CORRECTIE op mijn eigen eerste uitslag.** Die
uitslag luidde dat vloer 84 de doelblokgrens NOOIT raakt. Dat was te absoluut en is adversarieel
weerlegd vóór er iets gecommit was; de fout, hoe hij is gevonden en de herstelmeting staan er alle
drie bij. Neem het cijfer 0-van-154 uit dit document nergens over.

**DE STAND VAN PUNT 47 NA DRIE RONDES.** Er zijn twee routes voorgesteld om de ijking op de
doelblokgrens te laten landen: de klok versmallen (ronde 1) en de dag-vloer afleiden (ronde 2). Elk
apart werkt niet — de vloer alleen laat de dekking staan waar zij al stond. **SAMEN werken ze wél,
en dat is in ronde 2 gemeten en in ronde 3 gebouwd en nagemeten:** het aandeel doelblokgrenzen dat
werkelijk een ijking krijgt gaat van **24,1% naar 100,0%** bij een vaste weekvorm en **66,7%** bij
een wisselende, over 8421 grenzen per variant. De grond waarop ronde 1 de versmalling liet
vervallen — dertien openingen per jaar worden er vier — telde OPENINGEN waar het om GELEVERDE
IJKINGEN gaat, en is weerlegd.

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

---

# RONDE 3 — 23-08-2026, avond: de versmalling en de vloer, samen

## 13. Omgevingsverklaring

Gerapporteerd vóór alles; er stond met opzet geen vaste `cd`-regel in de prompt en er is niet
ge-`cd`'d, dus er is één pad.

- **Werkpad:** `/c/Users/daan/Projects/cadans`.
- **Worktree:** NEE. `git rev-parse --git-dir` en `--git-common-dir` geven allebei `.git`.
- **Branch:** `main`, remote `https://github.com/daanhhk/Cadans.git` — een checkout van
  `daanhhk/Cadans`, dus de STOP-conditie is niet geraakt.
- **Achterstand:** geen. `git rev-list --left-right --count origin/main...HEAD` geeft `0` en `0`.
- **Versie:** `2.1.208 (Claude Code)`. Boom schoon bij aanvang.

**DE AGENT EN DE RULES-PROBES BLIJVEN NIET GEMETEN, en er is deze ronde niet naar gezocht.** Deze
sessie is ouder dan `.claude/agents/recon.md` en ouder dan de probes, dus beide vragen zijn hier per
constructie onbeantwoordbaar. De prompt schreef terecht voor ze niet te proberen. Ze rijden mee
zodra er een verse sessie is.

## 14. De drie verwachtingen X1 t/m X3

Alle metingen draaien de ECHTE functies, met `TZ=Europe/Amsterdam` gepind, gebundeld naar een
tijdelijk pad buiten de repo-tree. Geen poort en geen dagraster nagebouwd.

### X2 eerst — HOUDT, en het is een SAMENVAL en geen kans

X2 draagt de hele meetopstelling van X1, dus hij komt eerst. De versmalde poort is vóór de bouw
gemeten door `buildTestVoorstel` alleen op doelblok-testweken aan te roepen; dat is alleen
equivalent als elke doelblok-testweek óók een vierweekse opening is.

**GEMETEN, niet als waarschijnlijkheid maar als samenval: 86 van de 86** doelblok-testweken over
1040 weekmaandagen is ook blokweek 4, tegenvoorbeelden geen. Over zestig verschillende
`doelStart`-waarden: **600 van de 600**. De grond staat in de code en niet in de reeks: beide
klokken beelden dezelfde absolute weekindex sinds `doelStart` af, de een modulo 12 en de ander
modulo 4. `isTestWeek` is index ≡ 11 (mod 12), en 11 mod 4 is 3 — blokweek 4. Omdat 4 een deler is
van 12 kan dat niet toevallig misgaan.

**DE TWEEDE HELFT VAN X2 — de afwijzing.** De sleutel is `blokStart`, en die komt uit
`blokStartVoorWeek(input.doelStart, input.weekMondayISO)`; de vloer komt er niet in voor. Gemeten
over 260 weekmaandagen: **21 doelblok-testweken, 21 UNIEKE afwijs-sleutels, 0 van de 20**
opeenvolgende paren deelt er een. Eén afwijzing kan dus nooit twee aanbiedingen onderdrukken. Op
hetzelfde geval geven vloer 90 en vloer 84 dezelfde sleutel (`2026-11-16`). **Poort (3) en de
afwijs-sleutel konden daarom op de vierweekse klok blijven staan.**

### X1 — HOUDT, en de winst overleeft de sweep overal

De beginconditie — de tijd sinds de laatste maximale inspanning op t0 — is als DIMENSIE afgelopen
over 0 t/m 400 dagen in stappen van 1, plus het geval "nog nooit gemeten". Per beginwaarde een
volle keten van 260 weken met 21 doelblokgrenzen, dus 8421 grenzen per variant. Uitsluitingen: geen.

```
  VASTE weekvorm (grote dag altijd zaterdag)
    BASELINE  vierweekse poort + vloer 90 : 2033 van de 8421 = 24,1%
              spreiding: min 23,8% · p25 23,8% · mediaan 23,8% · p75 23,8% · max 28,6%
              beginwaarden met NUL grenzen bedeeld: 0 van de 401 · met ALLE: 0 van de 401
    GEBOUWD   doelblok-poort   + vloer 84 : 8419 van de 8421 = 100,0%
              spreiding: min 95,2% · p25 100,0% · mediaan 100,0% · p75 100,0% · max 100,0%
              beginwaarden met NUL grenzen bedeeld: 0 van de 401 · met ALLE: 399 van de 401

  WISSELENDE weekvorm (per week een andere ruimste dag)
    BASELINE  : 2038 van de 8421 = 24,2%   spreiding min 23,8% · mediaan 23,8% · max 28,6%
    GEBOUWD   : 5613 van de 8421 = 66,7%   spreiding min 61,9% · mediaan 66,7% · max 66,7%
```

**DE WINST VERDWIJNT NERGENS EN SLAAT NERGENS OM.** Het MINIMUM van de gebouwde variant (95,2% vast,
61,9% wisselend) ligt over het hele bereik boven het MAXIMUM van de baseline (28,6%). Er is geen
beginwaarde waarbij de baseline wint, en geen beginwaarde waarbij de gebouwde variant nul grenzen
bedient. Het geval "nog nooit een maximum gezien" gaat van 5 van de 21 naar 21 van de 21 (vast) en
14 van de 21 (wisselend).

### X3 — VALT

> **WAARSCHUWING BIJ DEZE PARAGRAAF.** Wat hieronder staat is de diagnose zoals zij vóór de
> weerleggingspas luidde, en zij is FOUT. Het residu komt niet uit de dagkeuze van poort (6) maar
> uit de VLOER, poort (7). De paragraaf blijft staan omdat de weg ernaartoe de les draagt — twee
> opeenvolgende misattributies met dezelfde oorzaak — maar de uitkomst is vervangen in **§16**.
> Neem uit deze paragraaf geen enkele toeschrijving over.

Mijn verwachting was dat het residu bij een wisselende weekvorm uit de BESCHIKBAARHEIDSPOORT komt.
**Dat is onjuist, in 176 van de 176 gevallen** — maar de vervanging die ik ervoor in de plaats zette
was óók onjuist.

**EERST DE FOUT IN MIJN EIGEN EERSTE DIAGNOSE, want die kwam er bijna doorheen.** Ik toetste de
poorten in een CASCADE: eerst een ruime week (elke dag 150 minuten), en vuurde het aanbod dan wel,
dan heette dat de beschikbaarheidspoort. Die cascade is fout van opzet. Een ruimere week verandert
niet alleen de beschikbaarheid maar ook de DAGKEUZE van poort (6) — die kiest de meeste minuten en
bij gelijkspel de laatste datum, dus een ruime week duwt de keuze naar zondag, waardoor
`dagenSinds` groeit en de VLOER alsnog gehaald wordt. De eerste diagnose boekte daarmee een
intervalprobleem op de beschikbaarheid, en gaf 176 van de 176 op de verkeerde poort.
GEMETEN op één keten: **6 van de 6** gemiste grenzen werden door die cascade verkeerd geboekt.

**DE HERMETEN DIAGNOSE toetst de poorten ONAFHANKELIJK,** elk door interventie op de echte functie:
vloer op 0 met dezelfde week (bestond er een kandidaat?), daarna pas een ruime week, en ten slotte
per weekdag een week waarin ALLEEN die dag kandidaat is. Over 25 ketens × 21 grenzen = 525 grenzen,
349 bedeeld, 176 gemist:

```
  poort (5), geen kandidaat                          :   0 van de 176 =   0,0%
  poort (3) of (4)                                   :   0 van de 176 =   0,0%
  de vloer, en GEEN ENKELE dag haalde het            :   0 van de 176 =   0,0%
  de vloer, maar poort (6) koos de VERKEERDE DAG     : 176 van de 176 = 100,0%
```

Drie voorbeelden: bij grens `2026-12-07` koos poort (6) `2026-12-09` met `dagenSinds` 80, terwijl
dag 6 van diezelfde week de vloer wél gehaald zou hebben; bij `2027-11-08` koos hij `2027-11-10`
met 81; bij `2028-07-17` koos hij `2028-07-17` met 79.

**WAT DIT BETEKENT.** Het residu is geen beschikbaarheidsprobleem — er is altijd trainingstijd — en
geen intervalprobleem: een andere vloerwaarde repareert het niet, want de dag die het haalt bestaat
al. Het is een KEUZEprobleem. Poort (6) optimaliseert op beschikbare minuten en weet niet dat de
vloer bestaat:

```
  let keuze = kandidaten[0] as PlannerDay;
  for (const d of kandidaten) {
    const meer = (d.minuten ?? 0) > (keuze.minuten ?? 0);
    const gelijkMaarLater =
      (d.minuten ?? 0) === (keuze.minuten ?? 0) && d.datum > keuze.datum;
    if (meer || gelijkMaarLater) keuze = d;
  }
```

Valt de ruimste dag vroeg in de week, dan is `dagenSinds` 79 tot 81 en sterft het aanbod terwijl
zaterdag in diezelfde week 84 of meer had gegeven.

**EN DAAR ZIT DE FOUT, die pas in §16 boven water kwam: in de gemeten fixture IS zaterdag geen
kandidaat.** De `alleenDag`-probe gaf de onderzochte dag 90 minuten, terwijl diezelfde dag in de
echte week 45 minuten of geen training draagt — onder `TEST_MIN_BESCHIKBAAR_MIN`. De probe bouwde
dus een week die niet bestond en boekte het verschil op de keuze. **Dat is exact dezelfde fout als
de cascade die er twee alinea's hoger wordt rechtgezet: één interventie die meer dan één ding
verandert.** Ik heb hem twee keer achter elkaar gemaakt, de tweede keer terwijl ik de eerste aan het
uitleggen was.

## 15. Wat er gebouwd is

Eén samenhangende wijziging in `apps/web/src/lib/testvoorstel.ts`, plus de tests en de fixtures die
eraan hangen. **Geen regel in `packages/engine`** — `git diff --stat packages/engine` is leeg.

**(a) POORT (1) VERSMALD.** De oude regel was
`if (blokWeekVanWeek(input.doelStart, input.weekMondayISO) !== BLOK_WEKEN) {`. De nieuwe:

```
  if (!input.doelStart) return null;
  const macro = computeMacroPhase(
    parseLocalDate(input.doelStart),
    parseLocalDate(input.weekMondayISO),
  ) as { isTestWeek?: boolean };
  if (macro?.isTestWeek !== true) return null;
```

De grootheid komt uit de engine zoals die er al was; `computeMacroPhase` stond al in de exports en
wordt in `apps/web/src/lib` al door vier andere bestanden gebruikt. **De vroege uitgang op een
ontbrekende `doelStart` is DRAGEND en geen defensieve regel:** `computeMacroPhase` valt bij een
lege startdatum terug op `new Date()`, en dit bestand belooft in zijn kop geen ambient klok te
hebben. De oude poort kwam daar via `blokWeekVanWeek` niet aan toe, want die geeft dan een vaste 1.
`blokWeekVanWeek` is daarmee uit de imports van dit bestand verdwenen; hij blijft in `blok.ts` staan
en wordt daar door anderen gebruikt.

**(b) `TEST_INTERVAL_DAGEN` VAN 90 NAAR 84**, met een docstring die twee dingen apart houdt: de
BEDOELING (de dag-uitdrukking van M90b, GEPIND `docs/TRAININGSMODEL.md` §13) en wat er WERKELIJK
bindt. Dat tweede is `ceil(TEST_INTERVAL_DAGEN / 28) × 28` — een trapfunctie op de vierweekse
openingsperiode — waardoor elke waarde van 66 t/m 84 zich identiek gedraagt en 84 de BOVENKANT van
zijn trede is. De docstring zegt met zoveel woorden dat `84 = 12 × 7` een samenval is en geen
mechanisme, en dat het niet als reden opgeschreven moet worden.

**(c) DE ROL VAN DE VIERWEEKSE KLOK IS VASTGELEGD — en zij is KLEINER dan de prompt aannam.** Hij
draagt na de versmalling nog twee dingen, allebei over IDENTITEIT en niet over timing: het
onderdrukkings-venster van poort (3), en `blokStart` als afwijs-sleutel die het bestand uitreist
naar `SchemaView.tsx` en `TestVoorstelCard.tsx`. **Wat hij NIET meer draagt is de RETRY.** Vóór deze
ronde kwam een gemist aanbod vier weken later terug; nu wacht een gemiste doelblokgrens twaalf
weken. De docstring zegt dat expliciet en verwijst naar punt 55 en punt 58.

**(d) ONAANGEROERD:** `WEDSTRIJD_HORIZON_DAGEN` (28), poort (3), de afwijs-sleutel,
`TEST_MIN_BESCHIKBAAR_MIN` (60), `TEST_DUUR_MIN` (60), poort (6) en de engine.

**(e) COPY — GEEN GEBRUIKERSTEKST GEWIJZIGD, en dat is gecontroleerd en niet aangenomen.** De twee
strings die een moment kunnen claimen staan in `apps/web/src/lib/coachNarrative.ts`. `testAanbodRegel`
opent met `Dit blok loopt af.` — dat blijft waar en wordt zelfs preciezer: het aanbod valt nu in
week 12 van het doelblok, dus het blok dat afloopt is het doelblok. `testAfwijsLabel` geeft
`"Niet dit blok"`, en de sleutel eronder blijft het vierweekse blok; die belofte wordt na de
versmalling ruimer ingelost dan zij luidt (de volgende kans is twaalf weken later, niet vier), dus
zij claimt geen moment dat de poort niet produceert. M55 is daarmee niet geraakt.

**WEL GEWIJZIGD: één ontwikkelaarsgerichte string in `apps/web/src/pages/Preview.tsx`.** Verbatim
vóór: `Test · VOORSTEL in de rustweek (laatste meting 21-05, 93 dagen` / `terug) — knoppen schrijven
een ECHTE override, niet aantikken`. Verbatim na: `Test · VOORSTEL in de doelblok-testweek (laatste
meting 21-05, 121` / `dagen terug) — knoppen schrijven een ECHTE override, niet aantikken`. Reden:
de preview-fixture stond op de vierweekse rustweek van `2026-08-17` (doelblokweek 8) en zou na de
versmalling niets meer renderen; hij is verplaatst naar de doelblok-testweek van `2026-09-14`,
waardoor ook het dagenaantal verandert. Verder zijn vier COMMENTAAR-regels van "rustweek" naar
"doelblok-testweek" gezet in `SchemaView.tsx`, `Schema.tsx` en `TestVoorstelCard.tsx`.

**(f) TESTS.** `apps/web/src/lib/testvoorstel.test.ts` gaat van 21 naar 27 tests; de hele suite van
1010 naar 1016 over 78 bestanden. De fixture verhuisde van `2026-08-17` naar `2026-09-14`, want die
eerste is geen doelblok-testweek meer.

BESTAANDE TESTS DIE HET OUDE MOMENT VASTPINDEN en naar de nieuwe norm zijn gebracht, bij naam:
`"alleen in de RUSTWEEK: blokweek 1, 2 en 3 geven null"` (nu
`"alleen in de DOELBLOK-TESTWEEK: de elf weken ervoor geven null"`, en hij loopt nu elf weken af in
plaats van drie); `"er staat al een test in dit blok → null"`; `"A- of B-wedstrijd binnen de horizon
→ null (die wedstrijd IS de meting)"`; `"C-wedstrijd binnen de horizon → WEL een aanbod"`;
`"A-wedstrijd BUITEN de horizon → wel een aanbod"`; `"interval nog niet vol → null"`; `"een NIET
gereden wedstrijd telt niet als meting → interval blijft open"`; `"een dag in het VERLEDEN valt
af"`; `"een dag met een override valt af"`; `"de MEESTE minuten wint"`; `"gelijkspel → de LAATSTE
datum"`; `"wedstrijd 21-05 → aanbod op 2026-08-22, 93 dagen ertussen"` (nu `"... op 2026-09-19, 121
dagen ertussen"`); `"een sprongdag binnen 90 dagen vóór de testdatum ONDERDRUKT het aanbod"` (nu
`"... binnen TEST_INTERVAL_DAGEN vóór ..."`, want het getal hoorde niet in een testnaam); `"zonder
die sprong blijft het aanbod staan"`; en `"een sprong LANG geleden laat het aanbod staan en wordt
als bron gemeld"`.

**ÉÉN TEST IS NIET BIJGESTELD MAAR VAN FIXTURE VERWISSELD, en dat verschil is dragend:**
`"toetsen op de WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 88 dagen"`, nu
`"... — 81 tegen 86 dagen"`. Hij toont aan WAAROM poort (7) tot de gekozen testdag meet en niet tot
de weekmaandag. Met de oude vloer van 90 droeg de wedstrijd van `2026-05-21` dat contrast (88 dagen
tot de maandag, 93 tot de testdag). Onder de vloer van 84 liggen die twee ALLEBEI boven de vloer en
toont de fixture niets meer — de assertie zou rood worden en haar verzwakken was een verstopte
regressie geweest. Een meting op `2026-06-25` herstelt het contrast op de nieuwe vloer: 81 tot de
maandag, 86 tot de testdag.

NIEUWE DEKKING: `"een vierweekse OPENING die geen doelblok-testweek is geeft null"` (de versmalling
zelf, op `2026-07-20`, `2026-08-17` en `2026-10-12`, elk met een assertie dat het wél blokweek 4
is); `"de doelblok-testweek IS per constructie ook een vierweekse opening"`; `"zonder doelStart geen
aanbod, en GEEN ambient klok"`; `"de dagkeuze kijkt NIET naar de vloer — en dat is een gemeten
kostenpost"` (punt 58); en een eigen blok `"de INTERVALGRENS als dimensie, niet als vaste waarde"`
met `"de omslag ligt EXACT op TEST_INTERVAL_DAGEN vóór de gekozen testdag"` en `"de dimensie
afgelopen: monotoon, precies één omslagpunt, en dat is de vloer"` — die laatste loopt 61
beginwaarden af en asserteert dat er precies één omslag is en dat die op `TEST_INTERVAL_DAGEN - 1`
ligt. Dat laatste blok is er omdat de twee vorige rondes allebei op een gestipuleerde beginconditie
strandden.

**DE ROOD-METING, PER PLEK** (`docs/CC-CHECKS.md` CHECK 17). De vloer terug op 90 laat drie
benoemde tests vallen: `"de omslag ligt EXACT op TEST_INTERVAL_DAGEN vóór de gekozen testdag"`,
`"de dagkeuze kijkt NIET naar de vloer — en dat is een gemeten kostenpost"` en `"toetsen op de
WEEKMAANDAG zou het aanbod ONDERDRUKKEN — 81 tegen 86 dagen"`. Poort (1) geneutraliseerd laat er
drie ANDERE vallen: `"alleen in de DOELBLOK-TESTWEEK: de elf weken ervoor geven null"`, `"een
vierweekse OPENING die geen doelblok-testweek is geeft null"` en `"zonder doelStart geen aanbod, en
GEEN ambient klok"`. Beide plekken zijn dus dragend, en geen van beide is stil een no-op.

**DE NA-METING OP DE GEBOUWDE BRON, zonder enige substitutie.** De poort vuurt in 21 van de 21
gevallen in een doelblok-testweek en **0 keer** daarbuiten. De dekking reproduceert de VOOR-meting
teken voor teken: **8419 van de 8421 (100,0%)** vast en **5613 van de 8421 (66,7%)** wisselend —
exact dezelfde getallen als de simulatie. 21 aanbiedingen gaven 21 unieke afwijs-sleutels. Met
`doelStart` null geeft de functie `null` en raakt de ambient klok niet.

## 16. De weerleggingspas — wat er kantelde

Verplicht per sectie 5 van de prompt, en het is de tweede regel uit het punt-52-verdict van ronde 2.
Vier onafhankelijke lenzen — noemer, dode takken, grens, regressie — kregen de opdracht de
hoofdclaim van deze ronde ONDERUIT te halen, met eigen meetscripts buiten de repo. **Alle vier
weerlegden hem, met hoge zekerheid.** Hun bevindingen zijn NIET overgenomen maar zelf nagemeten; wat
hieronder staat rust op mijn eigen harnas.

**WAT OVEREIND BLEEF.** De getallen van de dekking reproduceren: baseline 2033 van de 8421 (24,1%)
met maximum 28,6%, gebouwd 8419 van de 8421 (100,0%) vast en 5613 van de 8421 (66,7%) wisselend. De
samenval uit X2 is niet te weerleggen — 86 van de 86 en 600 van de 600, en de rekenkundige grond
eronder klopt. De afwijs-sleutels blijven uniek. X1 houdt: de winst verdwijnt nergens.

### 16a. HET MECHANISME IN MIJN DOCSTRING BESCHREEF DE OUDE POORT

Ik schreef dat de afstand tussen twee aanbiedingen `ceil(vloer / 28) × 28` is, en dat elke waarde
van 66 t/m 84 daarom identiek is. **Dat gold vóór de versmalling.** Na de versmalling liggen de
openingen 84 dagen uit elkaar, niet 28. GEMETEN op de gebouwde bron, afstanden tussen opeenvolgende
aanbiedingen: bij een vaste weekvorm `{84}`, bij een wisselende `{84, 85, 87, 89, 163, 164, 166,
168}`. De echte formule is `84 + (k − j)` met j en k de weekdag van de vorige en volgende gekozen
testdag; die wobbelt tussen −6 en +6, dus de kortste afstand is **78**.

### 16b. DAARDOOR IS 84 EEN SLECHTE WAARDE, EN DAT IS DE VONDST VAN DE PAS

De trede 66 t/m 84 bestaat niet op de gebouwde bron. GEMETEN, vloer-sweep over één keten:

```
  vloer  60 : vast 21/21 · wisselend 21/21      vloer  80 : vast 21/21 · wisselend 20/21
  vloer  66 : vast 21/21 · wisselend 21/21      vloer  82 : vast 21/21 · wisselend 15/21
  vloer  70 : vast 21/21 · wisselend 21/21      vloer  84 : vast 21/21 · wisselend 14/21
  vloer  74 : vast 21/21 · wisselend 21/21      vloer  85 : vast 11/21 · wisselend 12/21
  vloer  77 : vast 21/21 · wisselend 21/21      vloer  90 : vast 11/21 · wisselend 11/21
  vloer  78 : vast 21/21 · wisselend 21/21
  vloer  79 : vast 21/21 · wisselend 21/21
```

**84 is niet de bovenkant van een vlakke trede maar de slechtste waarde binnen de trede die ik
beweerde.** Het vlakke bereik is 60 t/m 79. De waarde die M90b uitdrukt zonder de grens te
blokkeren die zij moet toelaten is `DOEL_BLOK_WEKEN × 7 − 6` = **78**.

**DE WACHTTIJD MAAKT HET SCHERPER, en daar is 84 zelfs een REGRESSIE.** Gemiddelde afstand tussen
twee aanbiedingen over 30 zaden: oud (vierweeks, vloer 90) **111,5 dagen**, grootste gat 118; nieuw
met vloer 84 **126,3 dagen**, grootste gat **173**; met vloer 78 **84,0 dagen**, grootste gat 90.
Bij een wisselende weekvorm wacht de renner met de gebouwde waarde dus LANGER dan vóór de ingreep.
En 78 verruimt de norm niet: poort (1) laat per constructie hoogstens één aanbod per doelblok door.

**DE WAARDE STAAT TOCH OP 84, en dat is een bewuste keuze.** Sectie 2 van de prompt autoriseert
`TEST_INTERVAL_DAGEN` op 84, en de meetfrequentie is volgens de kop van het bestand zelf een
beleidsvraag die met Daan wordt herzien. Een uitvoerder die een geautoriseerd getal onderweg
vervangt omdat zijn eigen meting hem gelijk geeft, ondermijnt precies de poort die dit project
overeind houdt. De meting staat in de docstring en het besluit staat als **ROADMAP punt 58** klaar
als één getal.

### 16c. HET RESIDU IS TWEE KEER VERKEERD TOEGESCHREVEN, DOOR MIJ

Eerst aan de beschikbaarheidspoort (cascade-fout), daarna aan de dagkeuze van poort (6)
(`alleenDag`-probe die de week verruimde). **Beide keren veranderde mijn probe meer dan één ding.**
GEMETEN met onafhankelijke probes, over 25 ketens × 21 grenzen:

```
  gemiste grenzen                                                : 176
  daarvan die alsnog vuren met de vloer op 0, ZELFDE week        : 176 van de 176  -> poort (7)
  gemiste grenzen waarvan de ECHTE week MEER dan één kandidaat draagt : 0 van de 176
  verdeling van het aantal kandidaten in de echte week           : {"1": 176}
```

Poort (6) heeft daar niets te kiezen. **De null valt op poort (7), de vloer.** Dat is dezelfde
conclusie als 16b langs een andere weg, en het is de reden dat punt 58 nu over de VLOER gaat en
niet over de dagkeuze. De test die de floor-blindheid van poort (6) vastpint blijft staan — dat
gedrag bestaat — maar zijn commentaar zegt nu expliciet dat hij NIET de oorzaak van het residu is.

### 16d. EEN REGRESSIE DIE IK ZELF HAD GEÏNTRODUCEERD — en die is gerepareerd

Dit is de zwaarste vondst van de pas. Mijn eerste versie van poort (1) droeg alleen
`if (!input.doelStart) return null;`. Dat dekt `null` en `""` en verder niets. `doelStart` is VRIJE
TEKST in D1, en bij een bedorven waarde geeft `parseLocalDate` een `Invalid Date` — **die is
TRUTHY**, dus de vangregel `if (!startDate)` in `computeMacroPhase` vuurt niet. Het dagverschil
wordt `NaN`, de blokweek wordt `NaN`, en `NaN <= 4`, `NaN <= 8` en `NaN <= 11` zijn alle drie
onwaar, waardoor de keten doorvalt naar de `else`-tak:

```
  else {
    fase = "Test";
    isTestWeek = true;
  }
```

GEMETEN op `"kapot"`, `""`, `"29-06-2026"` en `"niet-een-datum"`: alle vier `isTestWeek: true`, met
`week: NaN`. **Bij één bedorven rij zou de app ELKE week de ijkkaart tonen, met de copy `Dit blok
loopt af.` terwijl er geen blok afloopt — een M55-schending die de OUDE poort per constructie niet
kon produceren**, want `blokWeekVanWeek` draagt zijn eigen `Number.isNaN`-vang en geeft dan 1.

GEREPAREERD met een expliciete geldigheidstoets op beide datums, en er staan twee tests op:
`"een ONGELDIGE doelStart geeft null — anders vuurt het aanbod ELKE week"` en de tegenproef
`"een GELDIGE maar afwijkend geschreven doelStart gedraagt zich als voorheen"`, want de vang mag
niet te breed zijn — `"2026/06/29"` parseert wél en hoort gewoon te vuren, precies zoals bij de
oude poort.

### 16e. WAT DE PAS VERDER BLOOTLEGDE, en het staat er zonder verzachting

- **DE NOEMER 8421 IS OP DE BESLISSENDE DIMENSIE OPNIEUW SMAL.** Hij is 401 beginwaarden × 21
  grenzen, maar het LCG-zaad van de wisselende weekvorm stond in beide scripts vast op 7. Het
  gerapporteerde minimum van 61,9% is dus het minimum BIJ ZAAD 7. GEMETEN over 120 zaden:
  gemiddeld **66,9%**, minimum **57,1%** (zaad 50), maximum **76,2%**. Het echte minimum is 57,1%,
  niet 61,9%.
- **DE `sprongDagen`-TAK STOND WÉÉR DOOD.** Geen enkele fixture-rij zette `rolling_ftp`, dus de
  derde bron van `laatsteGelegenheid` kon per constructie niet vuren — dezelfde CHECK 23-schending
  als in ronde 2, in een ronde die die schending in haar eigen §12 als les opschreef. GEMETEN met
  de tak levend: bij een sprong elke 20 weken zakt de dekking naar 9 van de 21, bij een sprong elke
  8 weken naar 0 van de 21.
- **A- EN B-WEDSTRIJDEN ONTBRAKEN OOK.** Met een A-race elke 365 dagen: 16 van de 21; elke 180
  dagen: 9 van de 21; elke 120 dagen: 3 van de 21. Een wedstrijd IS een meting, dus een uitblijvend
  aanbod is daar geen misser — maar **het getal 100,0% geldt alleen in een wereld zonder
  wedstrijden en zonder een enkele rolling_ftp-sprong**, en dat hoort erbij te staan.
- **HET EERSTE AANBOD NA EEN VERSE `doelStart` SCHUIFT VAN 27 NAAR 83 DAGEN.** GEMETEN over vier
  `doelStart`-waarden, met een ruime week en zonder meethistorie: oud telkens 27 dagen, nieuw
  telkens 83. Wie vandaag een doel kiest heeft acht weken langer geen ijkpunt, en dat is precies het
  moment waarop het volgende blok een dosis-anker nodig heeft. Dit telt niet mee in de
  dekkingsmaat, want het gaat over de weken vóór de eerste grens. **Nieuw genoteerd bij punt 55.**
- **MIJN ZIN "de vloer alleen liet 24,1 procent op 24,1 staan" REPRODUCEERT NIET.** GEMETEN: de
  oude vierweekse poort met vloer 84 geeft **0 van de 21** grenzen bij een vaste weekvorm, tegen 5
  van de 21 met vloer 90. De vloer alleen is niet onschadelijk maar schadelijk. De conclusie "de
  twee helften werken alleen samen" blijft staan; het getal eronder is vervangen.
- **TWEE VAN MIJN DRIE MEETSCRIPTS DRAAIEN NIET MEER**, want zij ankeren op de literal
  `export const TEST_INTERVAL_DAGEN = 90;` die na de bouw niet meer bestaat, en stoppen met
  exitcode 2. Dat is gedrag zoals ontworpen — de assertie op de substitutie deed wat zij moet doen —
  maar het betekent dat de baseline-getallen niet met díe scripts na te rekenen zijn. Ze zijn met
  een eigen harnas gereproduceerd dat de poort terugdraait naar de oude vorm, met een assertie op
  beide substituties.

## 17. Wat benoemd is en niet gebouwd

Als ROADMAP-punt vastgelegd: **punt 58** — `TEST_INTERVAL_DAGEN` staat zes dagen te hoog voor het
venster dat hij moet toelaten, met de volle sweep en de wachttijd-meting erbij; het is een besluit
van één getal. **Punt 55** is door deze bouw LIVE geworden: de retry is weg, en er is een nieuwe
kostenpost bij (het eerste aanbod na een verse `doelStart` schuift van 27 naar 83 dagen). Verder
ongewijzigd open: **53** (M91's ONGEIJKT-staat), **54** (de doelcheck-maat per doel), **56** (het
ontbrekende herkomst-etiket op `TEST_MIN_BESCHIKBAAR_MIN` en `TEST_DUUR_MIN`), en de vaststelling
dat agent-discovery wél lukte in de container op `2.1.241` en hier op `2.1.208` nog nooit.

Niet gebouwd en niet aangeraakt: de duurzame ONGEIJKT-staat van M91, de doelcheck-maat, poort (6),
`WEDSTRIJD_HORIZON_DAGEN`, en elke engine-wijziging, migratie of deploy.

## 18. Punt 52 — het verdict, en het is een JA met één toevoeging

De vraag van punt 52 was of één samengevoegde ronde dezelfde bewijskracht draagt als twee losse. Na
ronde 2 luidde het antwoord: de vorm verdunt op twee plekken, en met twee regels erbij is hij
bruikbaar. Ronde 3 heeft die twee regels gedraaid. **Dit is het eerste oordeel dat op een echte
bouw-helft rust.**

**REGEL (i) — geen gestipuleerde beginconditie — HEEFT GEWERKT, en meetbaar.** X1 liep de tijd sinds
de laatste maximale inspanning af over 401 waarden in plaats van er één te kiezen. Dat leverde niet
alleen een robuuster getal maar een ANDER soort uitspraak: niet "de winst is 100%" maar "het
minimum van de gebouwde variant ligt over het hele bereik boven het maximum van de baseline". In
ronde 2 had precies deze regel de val van W2 direct zichtbaar gemaakt in plaats van pas in een niet
voorgeschreven vrijloop-keten.

**REGEL (ii) — de adversariële weerleggingspas — HEEFT DE RONDE GERED, en dat is geen overdrijving.**
Zij ving vier dingen die alle vier al in de bron of in de documenten stonden: een docstring die het
mechanisme van de OUDE poort beschreef, een geautoriseerde constante die meetbaar de slechtste
waarde in haar eigen beweerde klasse is, een residu dat ik twee keer achter elkaar aan de verkeerde
poort toeschreef, en **een echte regressie in code die ik zelf had geschreven** — een bedorven
`doelStart` die de ijkkaart elke week zou tonen. Zonder die pas was dat alle vier gecommit, met
getallen erbij, en had het er overtuigend uitgezien.

**DE TOEVOEGING DIE RONDE 3 AFDWINGT, en zij komt uit mijn eigen falen.** Twee van de vier vondsten
gaan terug op DEZELFDE meetfout: een probe die meer dan één ding tegelijk verandert. De cascade
verruimde de week én verschoof de dagkeuze; de `alleenDag`-probe verving de beschikbaarheid van de
onderzochte dag. Ik maakte de tweede terwijl ik de eerste aan het uitleggen was. Daarom hoort er een
DERDE regel bij, en zij is concreter dan "wees zorgvuldig": **een diagnose door interventie
verandert per probe precies één ding, en de probe die een poort onderzoekt mag de invoer van geen
enkele andere poort raken.** Dat is niet een regel over de samengevoegde vorm maar over meten in
het algemeen; hij hoort bij de bewijslast-lessen.

**HET VERDICT.** De samengevoegde vorm is BRUIKBAAR voor rondes die een mechanisme raken, MITS regel
(i) en regel (ii) allebei draaien. Zonder (ii) is hij aantoonbaar slechter dan de splitsing: deze
ronde zou dan vier fouten hebben opgeleverd waarvan één een regressie in productie. Met (ii) is hij
beter dan de splitsing, want de pas toetst iets wat een tweede prompt niet toetst — niet de
volgende STAP, maar de conclusie die er al ligt. De prijs is gemeten en reëel: vier extra lenzen en
een tweede meetronde bovenop de eerste.

**WAT NIET IS AANGETOOND, en dat mag niet als geregeld lezen.** Of de pas ook werkt wanneer de
uitvoerder hem zelf opstelt ZONDER dat een prompt hem voorschrijft, is niet getoetst — in deze
ronde stond hij als voorschrift. En de pas is één keer gedraaid, op één claim; dat vier van de vier
lenzen raak schoten kan aan de claim liggen en niet aan de methode.

---

# RONDE 4 — 23-08-2026: de ijking verhuist naar de START van het doelblok

## 19. Omgevingsverklaring

Vóór alles gerapporteerd; er stond met opzet geen vaste `cd`-regel in de prompt en er is niet
ge-`cd`'d.

- **Werkpad:** `/c/Users/daan/Projects/cadans`. **Worktree:** NEE — `git rev-parse --git-dir` en
  `--git-common-dir` geven allebei `.git`. **Branch:** `main`, remote
  `https://github.com/daanhhk/Cadans.git`. **Achterstand:** `0` en `0`. **Versie:**
  `2.1.208 (Claude Code)`. Boom schoon bij aanvang. Geen STOP-conditie geraakt.
- **AGENT EN RULES-PROBES: NIET GEMETEN, en er is niet naar gezocht.** Het transcript van deze
  sessie is aangemaakt op `2026-07-14 09:20:16`, `.claude/agents/recon.md` op
  `2026-08-23 07:48:15`. De sessie is ouder, dus beide vragen zijn hier per constructie
  onbeantwoordbaar.

## 20. Wat er gebouwd is

Eén samenhangende wijziging, geen regel in `packages/engine` (`git diff --stat packages/engine`
leeg).

**(a) POORT (1) VERHUIST NAAR DE OPENING.** Was `if (macro?.isTestWeek !== true) return null;`, is
nu:

```
  if (macro?.week !== DOELBLOK_OPENINGSWEEK) return null;
```

met `const DOELBLOK_OPENINGSWEEK = 1;`. De grootheid komt uit de engine zoals die er al was —
`computeMacroPhase` geeft `week` naast `isTestWeek`, en de cast in dit bestand droeg `week?: number`
al. De twee vroege uitgangen op een ontbrekende en op een ONGELDIGE `doelStart` blijven ongewijzigd
staan; die zijn in ronde 3 gebouwd en dekken een gat dat `computeMacroPhase` openlaat.

**(b) DE VLOER IS AFGELEID EN NIET GEKOZEN:**

```
export const TEST_INTERVAL_DAGEN =
  DOEL_BLOK_WEKEN * 7 - AANBODVENSTER_DAGEN;
```

met `const AANBODVENSTER_DAGEN = 7;`. Dat is 84 − 7 = **77**. `DOEL_BLOK_WEKEN` komt uit de engine;
`AANBODVENSTER_DAGEN` staat in dit bestand omdat het een eigenschap van poort (1) plus poort (5) is
en niet van het doelblok. De afleiding staat in §21.

**(c) DE DOCSTRING DRAAGT HET WERKELIJKE MECHANISME.** Hij zegt met zoveel woorden dat `84 = 12 × 7`
een samenval is en geen reden, en dat `ceil(vloer / 28)` alleen gold vóór de versmalling van ronde 3
toen openingen nog 28 dagen uit elkaar lagen. En hij legt de ROLVERDELING vast die deze ronde
verandert: **poort (1) bewaakt sindsdien de FREQUENTIE** (één opening per doelblok, en dat ís M90b),
**de vloer bewaakt alleen nog de NABIJHEID** van een reeds gedane maximale inspanning.

**(d) ONAANGEROERD:** poort (3), de afwijs-sleutel, `WEDSTRIJD_HORIZON_DAGEN` (28), `sprongDagen`,
`TEST_MIN_BESCHIKBAAR_MIN` (60), `TEST_DUUR_MIN` (60), poort (6) en de engine. De bevestig-uitgang
uit besluit twee is NIET gebouwd.

**(e) COPY — TWEE STRINGS GEWIJZIGD, en beide waren door de verhuizing ONWAAR geworden.**
`testAanbodRegel` in `apps/web/src/lib/coachNarrative.ts` opende verbatim met `Dit blok loopt af. `
en sloot met `Dan weet het volgende blok waarop het doseert.` — allebei waar toen het aanbod in week
12 stond, allebei onwaar nu het in week 1 staat. Nieuw: `Er begint een nieuw blok. ` en
`Dan weet dit blok waarop het doseert.` Om dezelfde reden ging `testResultaatRegel` van
`die waarde ijkt je volgende blok.` naar `die waarde ijkt dit blok.` — de test ijkt het blok waarin
hij valt, niet het volgende. `testAfwijsLabel` (`"Niet dit blok"`) en `testBadgeLabel`
(`"FTP-test gepland"`) blijven ONGEWIJZIGD; die claimen geen moment.

**(f) TESTS.** `testvoorstel.test.ts` gaat van 29 naar 32; de volle suite van 1018 naar 1021 over 78
bestanden. De fixture verhuisde van de testweek `2026-09-14` naar de OPENING `2026-09-21`.

BESTAANDE TESTS DIE HET OUDE MOMENT OF DE WAARDE 84 VASTPINDEN, bij naam en alle meeverhuisd:
`"alleen in de DOELBLOK-TESTWEEK: de elf weken ervoor geven null"` (nu
`"alleen in de DOELBLOK-OPENING: de elf weken erna geven null"`); `"een vierweekse OPENING die geen
doelblok-testweek is geeft null"` (nu `"de doelblok-TESTWEEK geeft null — daar stond het aanbod tot
M92"`, met omgekeerd teken); `"de doelblok-testweek IS per constructie ook een vierweekse opening"`
(nu `"de doelblok-opening IS per constructie ook vierweekse blokweek 1"`); `"er staat al een test in
dit blok → null"`; `"A- of B-wedstrijd binnen de horizon → null (die wedstrijd IS de meting)"`;
`"C-wedstrijd binnen de horizon → WEL een aanbod"`; `"A-wedstrijd BUITEN de horizon → wel een
aanbod"`; `"interval nog niet vol → null"`; `"een NIET gereden wedstrijd telt niet als meting →
interval blijft open"`; `"een dag in het VERLEDEN valt af"`; `"een dag met een override valt af"`;
`"de MEESTE minuten wint"`; `"gelijkspel → de LAATSTE datum"`; `"de dagkeuze kijkt NIET naar de
vloer"`; `"wedstrijd 21-05 → aanbod op 2026-09-19, 121 dagen ertussen"` (nu `"... op 2026-09-26, 128
dagen ertussen"`); `"de omslag ligt EXACT op TEST_INTERVAL_DAGEN vóór de gekozen testdag"`; `"de
dimensie afgelopen: monotoon, precies één omslagpunt, en dat is de vloer"`; de drie
sprong-tests; en `"een GELDIGE maar afwijkend geschreven doelStart gedraagt zich als voorheen"`.

**ÉÉN TEST IS VOOR DE DERDE KEER VAN FIXTURE VERWISSELD EN NOOIT VERZWAKT:** `"toetsen op de
WEEKMAANDAG zou het aanbod ONDERDRUKKEN"`, nu met de staart `— 75 tegen 80 dagen`. Hij toont waarom
poort (7) tot de gekozen testdag meet en niet tot de weekmaandag. Bij vloer 90 droeg de wedstrijd
van `2026-05-21` dat contrast (88 tegen 93), bij vloer 84 een meting van `2026-06-25` (81 tegen 86),
en bij vloer 77 met de verhuisde week een meting van `2026-07-08` (75 tegen 80). Elke keer verhuist
de fixture, nooit de eis.

NIEUWE DEKKING, en de eerste twee zijn de gevallen die het besluit dragen: `"een DOELWISSEL levert
een aanbod in de wisselweek zelf — het geval dat M92 draagt"` en `"een doelwissel KORT NA een meting
levert GEEN aanbod — de vloer doet daar zijn werk"`. Plus `"de vloer is AFGELEID uit de meetkunde
van poort (1), geen los getal"`, dat `TEST_INTERVAL_DAGEN === DOEL_BLOK_WEKEN * 7 - 7` asserteert.

**DE ROOD-METING, PER PLEK** (`docs/CC-CHECKS.md` CHECK 17). Poort (1) terug op `isTestWeek` laat
**17** benoemde tests vallen; de vloer terug op 84 laat er **4** vallen — `"de omslag ligt EXACT op
TEST_INTERVAL_DAGEN vóór de gekozen testdag"`, `"de vloer is AFGELEID uit de meetkunde van poort
(1), geen los getal"`, `"de dagkeuze kijkt NIET naar de vloer"` en `"toetsen op de WEEKMAANDAG zou
het aanbod ONDERDRUKKEN — 75 tegen 80 dagen"`. Beide plekken zijn dragend.

## 21. De vloer-afleiding, met de sweep waarop zij rust

**DE MEETKUNDE EERST.** Openingsmaandagen liggen exact `DOEL_BLOK_WEKEN * 7` = 84 dagen uit elkaar —
GEMETEN over 260 weekmaandagen: 22 openingen, de afstand tussen twee opeenvolgende telkens `{84}`,
zonder uitzondering. Maar de vloer meet tussen twee GEKOZEN TESTDAGEN, en poort (6) kiest de ruimste
dag BINNEN de openingsweek. Die weekdag wobbelt, dus de afstand is `84 + (k − j)` met j en k in
0..6. GEMETEN over 840 gaten bij een wisselende weekvorm: **minimum 78, maximum 90, gemiddeld 84,0**.
Bij een vaste weekvorm exact 84, altijd.

**DE SWEEP.** Vloer tegen dekking, onder de verhuisde poort, takken alle drie levend:

```
  vloer  60 : vast 22/22 · wisselend 440/440      vloer  79 : vast 22/22 · wisselend 426/440
  vloer  66 : vast 22/22 · wisselend 440/440      vloer  80 : vast 22/22 · wisselend 415/440
  vloer  70 : vast 22/22 · wisselend 440/440      vloer  82 : vast 22/22 · wisselend 355/440
  vloer  72 : vast 22/22 · wisselend 440/440      vloer  84 : vast 22/22 · wisselend 293/440
  vloer  74 : vast 22/22 · wisselend 440/440      vloer  90 : vast 11/22 · wisselend 225/440
  vloer  76 : vast 22/22 · wisselend 440/440
  vloer  77 : vast 22/22 · wisselend 440/440
  vloer  78 : vast 22/22 · wisselend 440/440
```

De omslag ligt exact tussen 78 en 79, precies waar de meetkunde hem voorspelt. **De harde
bovengrens is dus 78.**

**DE GEKOZEN WAARDE IS 77, EN DE MARGE IS ÉÉN DAG.** De prompt vroeg niet de bovenkant van de klasse
maar een waarde die er met marge onder ligt, mét motivering. Die motivering is STRUCTUREEL en geen
slag om de arm: de bovengrens 78 komt uit `84 − 6`, en die 6 is het EXTREMUM van de
weekdag-verschuiving — de waarde die precies één van de zeven keer voorkomt, dus de rand van de
verdeling. De gebouwde constante rekent in plaats daarvan met de VENSTERBREEDTE zelf,
`AANBODVENSTER_DAGEN` = 7, want poort (5) kandideert de hele openingsweek. Daarmee hangt de waarde
aan een structurele grootheid in plaats van aan een randgeval, en zij blijft geldig als de dagkeuze
binnen dat venster ooit verandert. **Op de meting kost die ene dag niets**: 77 en 78 bedienen
allebei 440 van de 440.

## 22. De drie verwachtingen

### Y1 — HOUDT

De beginconditie is als DIMENSIE afgelopen over 0 t/m 400 dagen (stap 4, 101 waarden), per waarde
een volle keten van 260 weken.

```
  HUIDIG testweek + 84, VASTE  weekvorm : gem.gat  84,0 (min 84, max  84, n=2019)
  HUIDIG testweek + 84, wissel weekvorm : gem.gat 129,1 (min 84, max 168, n=1312)
  NIEUW  opening  + 77, VASTE  weekvorm : gem.gat  84,0 (min 84, max  84, n=2102)
  NIEUW  opening  + 77, wissel weekvorm : gem.gat  83,9 (min 80, max  89, n=2102)
```

**De referentie van vóór de hele ingreep is 111,5 dagen.** De gebouwde variant komt daar bij BEIDE
weekvormen ruim onder, en de spreiding over de dimensie is smal: dekking min 95,5 procent, mediaan
100,0, max 100,0. Er is geen beginwaarde waarbij de winst verdwijnt of omslaat. Y1 houdt.

### Y2 — HOUDT

`buildTestVoorstel` gaf **462 aanbiedingen, alle 462 in een openingsweek en 0 daarbuiten**, over 21
ketens. En de doelwissel, het geval dat het besluit draagt:

```
  wissel op 2026-08-05 -> nieuwe doelStart 2026-08-03 (blokStartBijDoel)
    vorige meting 200 dagen terug : AANBOD 2026-08-08 (dagenSinds 203)
    vorige meting 100 dagen terug : AANBOD 2026-08-08 (dagenSinds 103)
    vorige meting  80 dagen terug : AANBOD 2026-08-08 (dagenSinds  83)
    vorige meting  20 dagen terug : geen aanbod
    vorige meting   5 dagen terug : geen aanbod
  tegenproef op de OUDE poort: bij ALLE VIJF geen aanbod — die eiste week 12, de wisselweek is week 1
```

Die laatste regel is het defect dat besluit één benoemt, gemeten: onder de oude poort kreeg een
doelwissel NOOIT een ijkaanbod in zijn eigen week.

### Y3 — HOUDT, met één gemeten verschuiving die erbij hoort

De afwijs-sleutel is `blokStartVoorWeek(input.doelStart, input.weekMondayISO)` en die leest geen
enkele bron van `laatsteGelegenheid`. GEMETEN: **22 aanbiedingen, 22 UNIEKE sleutels**, alle in
vierweekse blokweek 1 — want week 1 is weekindex ≡ 0 (mod 12) en 0 mod 4 is 0. Eén afwijzing kan dus
nooit twee aanbiedingen onderdrukken. En poort (3) doet nog wat hij deed: een reeds ingeplande test
in hetzelfde vierweekse blok (`2026-10-01`) onderdrukt het aanbod.

**WAT ER WÉL VERSCHUIFT, en dat staat nu in de docstring:** het venster van poort (3) kijkt VOORUIT
in plaats van terug. De openingsweek is blokweek 1, dus het venster is `[opening, opening + 28)`;
onder de oude poort lag het aanbod in blokweek 4 en keek het venster drie weken terug. De WERKING is
gelijk, de dekking van het venster is een andere drie weken. Dat is geen val van Y3 — het gedrag van
een afwijzing is ongewijzigd — maar het is wel een feit dat een volgende ronde moet weten.

## 23. De maat — oud tegen gecorrigeerd, met de takken-verklaring

De prompt corrigeert de maat van de vorige rondes, en die correctie is terecht: "aandeel met
AANBOD" telt aanbiedingen en niet ijkingen. Een blok waarvan de drempel al is vastgesteld door een
gereden A- of B-wedstrijd is BEDIEND, niet gemist.

**GECORRIGEERDE MAAT:** een doelblok telt als GEDEKT wanneer de drempel bij of kort vóór zijn
opening is vastgesteld — door een geaccepteerde ijking, of door een maximale inspanning die op de
opening minder dan 84 dagen oud is. **Dat versheids-venster staat VAST op 84 dagen en beweegt NIET
mee met de gesweepte vloer.** Dat was een fout in mijn eerste opzet: daar gebruikte de maat
`TEST_INTERVAL_DAGEN` zelf, waardoor een hogere vloer automatisch meer blokken "gedekt" liet lijken
— de maat mat dan zijn eigen parameter. Zichtbaar in de sweep: vloer 90 haalde daar 92,0 procent bij
293 aanbiedingen, wat onzin is.

**TAKKEN-VERKLARING per regel.** `laatsteGelegenheid` heeft drie bronnen en elk heeft zijn eigen
veld nodig: `race` via een event met type `race` en prioriteit A of B PLUS een activities-rij die
dag; `test` via een override `{type:"library", workoutType:"test"}` PLUS een rit; `inspanning` via
`sprongDagen`, dat KOLOM 14 (`rolling_ftp`) leest — zonder idx14 is die tak per constructie dood, en
dat ging twee rondes op rij mis.

```
  takken: race+test LEVEND, inspanning DOOD (geen rolling_ftp)
    HUIDIG testweek+84 : OUD 277/420 = 66,0%   GECORRIGEERD 277/420 = 66,0%
    NIEUW  opening +77 : OUD 440/440 = 100,0%  GECORRIGEERD 440/440 = 100,0%

  takken: alle drie LEVEND, rolling_ftp vlak (0 sprongen)
    HUIDIG testweek+84 : OUD 277/420 = 66,0%   GECORRIGEERD 277/420 = 66,0%
    NIEUW  opening +77 : OUD 440/440 = 100,0%  GECORRIGEERD 440/440 = 100,0%

  takken: alle drie LEVEND, sprong elke 26 weken (~182 dagen, Daans gemeten tempo)
    HUIDIG testweek+84 : OUD 214/420 = 51,0%   GECORRIGEERD 410/420 = 97,6%
    NIEUW  opening +77 : OUD 271/440 = 61,6%   GECORRIGEERD 440/440 = 100,0%

  takken: alle drie LEVEND, A-race elke 180 dagen
    HUIDIG testweek+84 : OUD 180/420 = 42,9%   GECORRIGEERD 360/420 = 85,7%
    NIEUW  opening +77 : OUD 193/440 = 43,9%   GECORRIGEERD 360/440 = 81,8%
```

**DE LAATSTE REGEL VRAAGT UITLEG, want zij leest als een verslechtering en is het niet.** De TELLER
is in beide gevallen identiek: 360. De noemers verschillen omdat er in hetzelfde venster van 260
weken **22 openingen** zijn en **21 testweken**. Bij een A-race elke 180 dagen wordt de overgrote
meerderheid van de blokken door de wedstrijd zelf gedekt — precies zoals M90b het wil — en levert de
plaatsing van het aanbod nauwelijks verschil. Het verschil van 3,9 procentpunt is een
noemer-artefact, geen effect.

**WAT DE GECORRIGEERDE MAAT ZICHTBAAR MAAKT en de oude verborg:** bij Daans eigen sprongtempo staat
de OUDE maat op 61,6 procent en de gecorrigeerde op 100,0. Die 38 procentpunt verschil zijn blokken
waar de app terecht NIETS aanbiedt omdat de drempel al vers is. Onder de oude maat telden die als
gemist.

## 24. Het M91-verdict — vaststellen, niet oplossen

**DE TWEE TEKSTEN, VERBATIM.** Uit `docs/TRAININGSMODEL.md` §13, M91 (GEPIND):

```
Een proxy vervangt de ijking niet: de koppeling tussen hartslag en vermogen informeert over grove
afbraak, maar haar ruis ligt boven de enkele procenten waarop een behoud-vloer oordeelt. Zij is
informant (M17, M30) en mag het aanbod niet onderdrukken.
```

Uit `apps/web/src/lib/effect.ts`, de docstring van `sprongDagen`:

```
 * De dagen waarop `rolling_ftp` SPRONG, oplopend. Een sprong is achteraf bewijs dat er een maximum
 * gezet is: de meter kan alleen omhoog als er een betere inspanning in het venster kwam.
 *
 * GRENS, DRAGEND: dit voedt UITSLUITEND `laatsteGelegenheid` (de meetinterval-poort van het
 * testvoorstel).
```

en de typedefinitie erboven:

```
 * vooraf); `inspanning` is een sprong in de reeks zelf — achteraf zichtbaar bewijs dat er een
 * maximum gezet is, zonder dat de app weet wat voor rit het was. */
```

**DE TEGENSPRAAK, precies benoemd.** M91 verbiedt een proxy het aanbod te onderdrukken en noemt de
hartslag-vermogenkoppeling als VOORBEELD, niet als enige geval. `rolling_ftp` is intervals' eigen
SCHATTING van de drempel — een proxy in dezelfde zin. Via `sprongDagen` voedt zij
`laatsteGelegenheid`, en die voedt poort (7), die het aanbod onderdrukt. De `sprongDagen`-docstring
noemt dat expliciet consistent en trekt de grens elders (bij `blokGelegenheid`), maar die docstring
is OUDER dan M91.

**HET TEGENARGUMENT WEEGT ZWAAR, en het staat in de bron zelf.** Een sprong in een eFTP-schatting
kan alleen ontstaan als er werkelijk een betere inspanning in het venster kwam — "de meter kan
alleen omhoog als er een betere inspanning in het venster kwam". Het signaal DETECTEERT dus een
inspanning; het is geen schatting van de drempel die als drempel wordt gebruikt. En de docstring is
eerlijk over wat het niet weet: "zonder dat de app weet wat voor rit het was".

**HET SCHEIDENDE GETAL.** Hoeveel doelblok-openingen worden onderdrukt door een `laatsteGelegenheid`
met bron `inspanning`, terwijl er in dezelfde periode GEEN gereden race of test staat:

```
  sprong elke 26 weken (~182 d, Daans gemeten tempo) : 162 van de 440 = 36,8%
  sprong elke 13 weken (~91 d)                       : 320 van de 440 = 72,7%
  sprong elke  8 weken (~56 d)                       : 420 van de 440 = 95,5%
  sprong elke 26 weken PLUS A-race elke 180 dagen    : 200 van de 440 = 45,5%
```

**MIJN LEZING.** De tegenspraak is REËEL en op Daans eigen sprongtempo niet marginaal: **ruim een
derde van alle ijkmomenten wordt onderdrukt op grond van een intervals-schatting, zonder dat de app
een gereden maximale inspanning kent.** Het detector-argument redt de helft van de zaak en niet meer.
Wat een sprong aantoont is dat er HARD gereden is; wat hij niet aantoont is dat die rit een
20-minuten-maximum was, en al helemaal niet wélke waarde de komende twaalf weken moet doseren. Door
het aanbod te onderdrukken laat de app het blok doseren op `rolling_ftp` zelf, en dat is de
proxy-stap die M91 verbiedt — niet het detecteren, maar het BEHANDELEN van de detectie als een
geslaagde ijking.

Daar komt bij dat M91's eigen strekking hier vóór ligt: hij eist dat de app de ONGEIJKT-staat draagt
en zegt. Een onderdrukking op een sprong laat de app juist ZWIJGEN — er komt geen aanbod, geen
afwijzing, en dus ook geen teller. Dat is precies de stille toestand die M91 wil uitsluiten.

**NIET OPGELOST, en dat is opzet.** De ingreep zou zijn: `sprongDagen` mag het aanbod niet
onderdrukken maar wel de tekst informeren ("intervals ziet een sprong op X — klopt dat?"), wat de
bevestig-uitgang van M92 tot drager maakt. Dat is één ronde met de bevestig-uitgang samen, en die
raakt de worker en een migratie. Vastgelegd als ROADMAP punt 60.

## 24b. De weerleggingspas — vijf vondsten, en drie ervan waren echt

Verplicht per sectie 8 van de prompt. Vier lenzen — noemer, dode takken, grens, één-ding-per-probe —
kregen de opdracht de hoofdclaim ONDERUIT te halen. **Alle vier weerlegden hem.** Alles is zelf
nagemeten; wat hieronder staat rust op mijn eigen harnas.

**24b-1. DE ZWAARSTE: `computeMacroPhase` KLEMT ZIJN WEEKTELLER, en de verhuizing maakt dat pas
schadelijk.** Verbatim uit `packages/engine/src/phase.ts`, `computeMacroPhase`:

```
  var absWeek = Math.floor(diffDays / 7) + 1;
  if (absWeek < 1) absWeek = 1;
```

Elke weekmaandag op of vóór `doelStart` leest daardoor **week 1** — precies de waarde waar de nieuwe
poort op staat. De OUDE poort stond daar per constructie dicht: geklemde weken geven `isTestWeek:
false`. GEMETEN op de gebouwde bron vóór de reparatie, over weekindex −26 t/m 26 met een ruime week
en zonder meethistorie: **29 aanbiedingen, waarvan 26 buiten een echte opening.**

De route erheen is ONTWORPEN GEDRAG. `blokStartBijDoel` legt de nieuwe `doelStart` op de VOLGENDE
maandag zodra de doelwissel op donderdag t/m zondag valt — vier van de zeven dagen — en de app
rendert altijd de huidige week. GEMETEN: bij een wissel op do, vr, za of zo gaf de app TWEE
ijkaanbiedingen, zeven dagen uit elkaar, met VERSCHILLENDE afwijs-sleutels (`2026-08-03` en
`2026-08-10`), zodat een afwijzing op de eerste de tweede niet onderdrukte. En bij een `doelStart`
die geen maandag is vuurden DRIE opeenvolgende maandagen.

**GEREPAREERD** met poort (1b): `if (weekMaandag.getTime() < doelStartDatum.getTime()) return null;`
NA de reparatie: 3 aanbiedingen over dezelfde 53 weken, **0 buiten een echte opening**, en de
doelwissel geeft nog precies één aanbod. Drie tests erop.

**EN ÉÉN VAN MIJN EIGEN TESTS VING EEN FOUT IN DIE REPARATIE.** De eerste versie vergeleek de
STRINGS: `input.weekMondayISO < input.doelStart`. Elders in dit bestand mag dat — poort (3)
vergelijkt `ov.datum` lexicografisch — maar daar zijn beide kanten canoniek `yyyy-MM-dd`.
`doelStart` is vrije tekst, en `"2026/06/29"` leest lexicografisch GROTER dan elke `yyyy-MM-dd`
omdat `/` na `-` komt, waardoor de guard élke week zou blokkeren. De test
`"een GELDIGE maar afwijkend geschreven doelStart gedraagt zich als voorheen"` — geschreven in ronde
3 voor precies deze klasse invoer — viel er direct op om. Vergelijkt nu de geparseerde datums.

**24b-2. MIJN Y2-METING WAS EEN TAUTOLOGIE.** Het harnas telde "buiten een opening" met
`const isOpening = mp.week === 1;` — hetzelfde predicaat als de poort zelf. Die teller kan per
constructie niet oplopen, dus `462 binnen, 0 buiten` was geen meting. De hercontrole gebruikt een
ONAFHANKELIJK orakel: de weekindex sinds de maandag van `doelStart`, uitgerekend uit de kalender.
**DIT IS DEZELFDE FAMILIE FOUT ALS DE TWEE UIT RONDE 3** — een probe die niet onafhankelijk is van
wat hij meet — en hij is deze keer door de pas gevangen in plaats van door mijzelf.

**24b-3. DE TWEE PERCENTAGES STONDEN OP VERSCHILLENDE NOEMERS.** `277 van de 420 (66,0%)` telde
week-12-maandagen (21 per keten) en `440 van de 440 (100,0%)` telde week-1-maandagen (22 per keten):
twee verschillende gebeurtenissenverzamelingen. HERMETEN op ÉÉN noemer, de 440 doelblok-openingen:

```
  OUD   testweek + 84 : 277 van de 440 = 63,0%  · gemiddeld gat 127,5 dagen (n=257)
  NIEUW opening  + 77 : 440 van de 440 = 100,0% · gemiddeld gat  84,0 dagen (n=420)
```

De richting van de winst blijft staan; de getallen in §22 en §23 zijn de oude noemer en die van
hierboven de vergelijkbare. Overal waar dit document of de bron een vergelijking maakt, staat nu de
laatste.

**24b-4. EEN M55-SCHENDING DIE DE VERHUIZING MEEBRACHT, en die de prompt in sectie 4(e) precies
voorzag.** Twee LEVENDE coach-strings beloofden een test "in een rustweek". Dat klopte toen het
aanbod in vierweekse blokweek 4 stond — de deload — maar de openingsweek is blokweek 1. Verbatim uit
`packages/engine/src/utils.ts`:

```
export const MESO_MOD: Record<number, number> = {
  1: 1.0,
  2: 1.08,
  3: 1.15,
  4: 0.6,
};
```

Blokweek 1 draagt factor **1,0** — een volle opbouwweek, niet een rustweek. GEWIJZIGD, verbatim:
`Loopt dat richting drie maanden, dan stel ik in een rustweek een test voor.` werd
`Loopt dat richting drie maanden, dan stel ik bij de start van een nieuw blok een test voor.`, en
`Zit daar straks zo'n drie maanden tussen, dan kom ik in een rustweek met een testvoorstel.` werd
`Zit daar straks zo'n drie maanden tussen, dan kom ik bij de start van een nieuw blok met een
testvoorstel.` De twee assertie-tests in `coachNarrative.test.ts` zijn meeverhuisd en er is een
assertie BIJ gekomen dat het woord `rustweek` er niet meer staat.

**24b-5. EEN REGRESSIE DIE IK NIET MAG REPAREREN, en dat is de eerlijke stand.** Poort (3)'s venster
is `[blokStart, blokStart + 28)` en `blokStart` is nu de openingsmaandag zelf, dus het kijkt VOORUIT
waar het eerst drie weken terugkeek. GEMETEN op de gebouwde bron:

```
  test ingepland 5 dagen VOOR de opening, NIET gereden  -> AANBOD (een TWEEDE test)
  test ingepland 10 dagen VOOR de opening, NIET gereden -> AANBOD (een TWEEDE test)
  dezelfde test WEL gereden                             -> onderdrukt (via poort (7))
  test ingepland 2 dagen NA de opening                  -> onderdrukt (via poort (3))
```

Sectie 4(d) van de prompt schrijft voor dat poort (3) ONAANGEROERD blijft, dus dit is NIET
gerepareerd. De ingreep is klein — het venster ankeren op het eind van de aanbodweek,
`[opening − 21, opening + 7)` — maar zij hoort met autorisatie. **ROADMAP punt 62.**

**EN DE MEETKUNDE HOUDT NA DE REPARATIE VOOR ELKE WEEKDAG VAN `doelStart`.** Eén lens mat een
maximaal gat van 96 dagen bij een niet-maandag `doelStart`; dat was vóór poort (1b). NA de
reparatie, over alle zeven weekdagen × 20 zaden × 300 weken, met de bemonstering 26 weken vóór
`doelStart` beginnend zodat de geklemde regio meedoet:

```
  doelStart ma t/m zo : 460 aanbiedingen, waarvan 0 VOOR doelStart
                        gaten min 78 · max 90 · gemiddeld 84,0 (n=440 per weekdag)
```

Zeven van de zeven weekdagen geven hetzelfde. De afleiding van 77 rust dus op een meetkunde die na
poort (1b) algemeen geldt en niet alleen voor een maandag-`doelStart`.

**WAT DE PAS NIET WEERLEGDE.** De vloer-afleiding en haar sweep reproduceren (77 en 78 op 440, 79 op
426, 80 op 415, 82 op 355, 84 op 293), het minimum-gat van 78 reproduceert inclusief DST-grenzen, de
afwijs-sleutels zijn uniek, geen enkele tak stond dood, en het M91-getal reproduceert bij benadering
(één lens kreeg 160 van de 440 tegen mijn 162 — 36,4 tegen 36,8 procent; het verschil zit in de
sprong-injectie en verandert de lezing niet). Het sprongtempo waarop dat getal rust is bovendien op
Daans ECHTE reeks bevestigd: `sprongDagen` geeft daar 2 sprongen over 367 dagen, dus één per 184.

## 25. Wat benoemd is en niet gebouwd

**Punt 59** — de bevestig-uitgang van M92 plus de duurzame ONGEIJKT-staat plus de
bevestigings-teller, als ÉÉN punt en één ronde, want ze delen dezelfde drager. De eerste ronde van
deze reeks die de worker en een migratie raakt. **Punt 60** — het M91-verdict met zijn scheidende
getal. **Punt 61** — de doelcheck aan het eind van het blok, de tweede helft van M89, die door M92
ook in de TIJD van de ijking gescheiden is. **Punt 56** blijft open (het herkomst-etiket op
`TEST_MIN_BESCHIKBAAR_MIN` en `TEST_DUUR_MIN`), en de vaststelling dat agent-discovery in de
container op `2.1.241` lukte en op deze machine op `2.1.208` nog nooit.

**GESLOTEN:** de herkansings-vraag bij punt 55, beantwoord met NEE. Punt **58** is afgesloten — de
vloer is herafgeleid en staat niet meer zes dagen te hoog.

<!-- EINDE docs/PUNT47-BOUW.md -->
