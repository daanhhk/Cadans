# PUNT 13 — RECON: na het event volgt geen herstel

**GEMETEN 05-08-2026, chat-zijde, VOLLEDIG LEZEND.** Geen code, geen engine, geen migratie,
geen deploy. Dit document draagt de meting én de twee besluiten die eruit volgen; punt 13 in
`docs/ROADMAP.md` verwijst ernaar.

## §1 Meetopstelling

`buildWeekProposal` uit `apps/web` plus de engine, gebundeld met esbuild BUITEN de repo-tree.
`TZ=Europe/Amsterdam`. `Date` gestubd als PROXY op de echte constructor — nooit een subclass,
want dat breekt `x instanceof Date` voor elk Date-object dat buiten de stub gemaakt is.

AGR als A-race op **2027-04-17**, `type` race, `prioriteit` A. Doel **Korte beklimmingen**,
`doelStart` **2027-02-22**, `overnameBevestigd` true. Weekvorm **ma45 di60 do60 za120** — Daans
wérkelijke beschikbaarheid, geen meetset-weekvorm. Lege `activities`, `weekplans` en `wellness`.

## §1b De eerste opzet was besmet en is overgedaan

De week werd op de PEILDAG verankerd in plaats van op de WEEKMAANDAG, dus de per-dag-runs
fotografeerden een verschoven week: op 2027-04-16 gaf dat een VO2-sessie en een efforts-rit van
120 minuten BINNEN de taperweek. Volledig artefact, en het is ingetrokken.

Na de correctie is het instrument geijkt: de run op 2027-04-19 reproduceert exact `weekMonday`
2027-04-19, fase Peak, mesoWeek 1, TSS 262, high 51, anaeroob 14. Zonder die ijking meet de
opstelling haar eigen verankering.

## §2 De fase per dag rond de race, week correct verankerd

- 12-04 ma t/m 16-04 vr — **Taper**, macro Peak. TSS 105, 83, 61, 61 en 28.
- 17-04 za, **racedag** — **Recovery**, TSS 21.
- 18-04 zo — **Recovery**, TSS 0.
- 19-04 ma — **Peak**, TSS **262**, high **51**, anaeroob **14**.
- 20-04 di — Peak, TSS 231.
- 23-04 vr — Peak, TSS 104.

## §3 De sessies van de week 19-04

Lange Z2 steady (Peak, ingekort) 45 min · **VO2 Hill Repeats 9x90s** 60,5 min · Drempel ladder
5-7-9 60 min · **Lange rit + Korte beklimmingen efforts** 120 min.

Twee dagen na 240 km met 2960 hoogtemeters.

## §4 Bij een zondagrace is het herstel exact nul hele dagen

Dezelfde opstelling met de race op **2027-04-18**: 18-04 Recovery TSS 0, 19-04 Peak TSS 262. De
renner rijdt zijn A-race en begint de volgende ochtend aan een volle Peak-week.

## §5 De mesocyclus vangt het niet op

Over 12 `doelStart`-datums (vanaf 2027-02-22, telkens 7 dagen terug) valt mesoWeek 4 op
2027-04-19 in **3 van de 12**; in de andere **9** staat er een opbouwweek. De fase op die maandag
loopt over die 12 datums door **Peak (3), Test (1), Base (4) en Build (4)** — een FTP-TESTWEEK
twee dagen na de race is dus een van de bereikbare uitkomsten.

## §6 Het is doel-onafhankelijk

Op 19-04, als TSS / high / anaeroob:

- FTP **251 / 64 / 5**
- Conditie **232 / 60 / 0**
- Korte beklimmingen **262 / 51 / 14**
- Lange beklimmingen **232 / 51 / 0**
- Onderhoud **242 / 84 / 0**

Onderhoud levert er de MEESTE harde minuten. Het defect zit dus niet in een doelprofiel.

## §7 Een herstelweek alleen is niet genoeg

Dit is de grond dat de doelvraag erbij hoort. Zonder volgend A- of trip-event levert de
doel-cyclus daarna **26-04 Peak 265, 03-05 Peak 272, 10-05 Test 144** en daarna Base — allemaal
voor een doel waarvan het event GEWEEST is. Staat de Stelvio-trip 2027-07-10 wél in de agenda,
dan neemt de event-as pas over vanaf **17-05** op `wekenTot` 8.

## §8 Het mechanisme, één regel

De Recovery-tak in `eventFase_` (`packages/engine/src/phase.ts`) eist `prioriteit` A, `type`
race, én een datum tussen de WEEKMAANDAG (`weekStartDate(ref)`) en `refDate`. Ligt de race in de
VORIGE week, dan is die voorwaarde onwaar en valt de fase terug op de doel-as.

De herstelduur is daarmee een functie van de WEEKDAG van de race: zaterdag geeft twee dagen,
zondag geeft nul.

## §9 Wat al draagt, en daarom is fase A klein

`Recovery` is volledig geconsumeerd:

- `effectiveMacroFase_` (`packages/engine/src/planner.ts:139`) geeft hem BUITEN de
  bevestigingspoort door — de nul-tak `if (eventMacroFase === "Recovery") return "Recovery";`
- `planner.ts:691` zet `isEventRecovery`
- `planner.ts:800` maakt de week easy Z2
- `planner.ts:1097` kiest het recovery-sjabloon

Fase A verruimt alleen het VENSTER. Er komt geen nieuw begrip bij.

## §10 Besluit fase A — het herstelvenster is zeven dagen na de A-race

**HERKOMST: BELEID**, en er valt niets te ijken: er staat GEEN A-race in de Cadans-historie, dus
er bestaat geen reeks om op te bemonsteren. Vier gronden.

1. Daan noemt zelf "een paar dagen", met een week als logische coach-bovengrens, en delegeert de
   keuze.
2. AGR is voor hem een rit van zes tot acht uur tegen een gedeclareerd budget van vijf à zes uur
   per week: die ene dag is meer dan een volle trainingsweek.
3. **MECHANISCH DRAGEND** — een DAGEN-venster maakt de herstelduur onafhankelijk van de weekdag
   van de race, en dat is exact het defect uit §4. Een WEEK-regel verplaatst de willekeur alleen:
   een maandagrace kreeg dan 13 dagen en een zondagrace 7.
4. Zeven dagen is een volle trainingscyclus: elke weekdag komt precies één keer voorbij.

### §10b De fase kantelt al midden in een week

Dat is dus geen nieuwe eigenschap van dit ontwerp. Gemeten loopt de fase binnen weekmaandag
12-04 van **Taper** (ma t/m vr) naar **Recovery** (za, zo). De taper-overlay doet ditzelfde al op
`dagenTot`.

### §10c De canon is hier OPEN

Dat wordt hier expliciet vastgesteld. `docs/TRAININGSMODEL.md` kent GEEN regel over herstel NÁ
een event: M66 en M72 gaan over inhalen dat wijkt voor herstel, M51 over transities als voorstel,
M52 over wanneer een event het plan overneemt. Dit besluit hoort een NIEUWE M-regel te worden;
tot die er is draagt dit document hem.

## §11 Besluit — de trip krijgt dit niet

En niet omdat het coach-inhoudelijk onjuist is. Een event draagt precies ÉÉN datum: `EventItem`
(`packages/shared/src/weekgen.ts:38`) en de D1-tabel `events`
(`workers/api/src/db/schema.ts:147`) dragen geen einddatum en geen duur.

Zeven dagen na het event meet bij een meerdaagse dus vanaf de STARTdag, en het venster verloopt
vóór de trip afgelopen is. De TAPER-kant lijdt daar niet aan: die meet naar de startdag TOE, en
dat is juist.

Staat als nieuw ROADMAP-punt **35**.

## §12 Besluit — fase B wordt ontworpen en geparkeerd, niet gebouwd

Zonder herstelvenster is er geen moment om de doelvraag aan op te hangen.

**DE SPLITSING IS EEN NORM-KWESTIE EN WIJKT AF VAN WAT PUNT 13 ZEGT.** Dat punt zegt dat herstel
en doelvraag "in één kaart" horen. Ze horen op één SCHERM, nooit aan één KNOP: herstel is een
CONSTATERING over een rit die al gereden is, dezelfde categorie als de taper-overlay, en hangt
daarom niet aan een bevestiging. Die fout is bij punt 9 fase B al één keer gemaakt en
gerepareerd — zie de nul-tak in `effectiveMacroFase_` (`packages/engine/src/planner.ts:139`), met
de gemeten aanleiding in het commentaar daarboven: het plan werd op "Build" gebouwd terwijl het
scherm "Recovery" toonde.

Het nieuwe doel is wél een KEUZE en valt onder M10, M11 en M51: voorstellen, bevestigen, en het
staande doel blijft tot Daan kiest.

## §13 Fase B erft een patroon dat er twee keer ligt

`apps/web/src/lib/eventOvername.ts` en `apps/web/src/lib/doelpassend.ts`. Null is geen kaart,
elke voorwaarde staat LOS zodat er per voorwaarde een rood-test bestaat, precedentie via
`kaartPrecedentie` (`doelpassend.ts:134`, enige call-site `schema.ts:1601`), en het antwoord
bewaard op `sync_state` zoals migraties `0009` en `0010` dat doen.

Fase B vraagt dus een migratie **`0011`** in diezelfde vorm.

## §14 Fase B raakt punt 28

De ja-tik moet `doelStart` verzetten naar de blokgrens, precies zoals
`doelPassendSettingsPatch` dat al doet. Punt 28 blijft over voor de HANDMATIGE doelwissel in
Instellingen.

## §15 Wat Daan vandaag merkt

**NIETS.** Deze ronde raakt geen regel code.
