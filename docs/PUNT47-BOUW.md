# Punt 47 — de bouwronde die niet gebouwd heeft

Ronde van 23-08-2026, opgezet als de eenmalige PROEF van ROADMAP punt 52: recon en bouw in één
ronde, met vier verwachtingen als VOOR-AUTORISATIE. **V1 VIEL, en daarmee is er niets gebouwd.** Dat
is de opbrengst van de vorm en geen mislukking: de omhanging van poort (1) zou op een onvolledig
model van het mechanisme zijn gebouwd.

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

## 6. Mijn oordeel over punt 52 — draagt dit ENE document de bewijskracht van twee rondes?

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

<!-- EINDE docs/PUNT47-BOUW.md -->
