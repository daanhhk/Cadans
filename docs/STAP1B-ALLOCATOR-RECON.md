# Cadans — STAP 1b, de allocator-recon

Meetronde bij ROADMAP stap 1b. Alle "gemeten"-uitspraken zijn GEDRAAID, niet gelezen.

## 0. Meetopstelling

Engine plus `apps/web/src/lib/proposal.ts` gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27. Invoer identiek aan
`apps/web/src/lib/weekvormAs.test.ts`. IJKPUNT: de ongewijzigde engine reproduceert de
gepubliceerde vingerafdruk exact — kwaliteitsminuten 93 / 113 / 77 / 105 / 84 / 93, week-TSS
268 / 410 / 437 / 362 / 352 / 227.

## 1. De premisse van stap 1b is WEERLEGD

ROADMAP stap 1b wees de efforts-arm in `allocateQualityWeek_` aan: die vuurt alleen bij
macrofase Build of Peak, dus in Base zou een lange dag geen kwaliteitsslot kunnen krijgen.
Twee metingen halen dat omver.

METING A — de fase-voorwaarde verruimd naar Base, profiel ongemoeid. Uitkomst BYTE-IDENTIEK
aan de baseline, alle zes weekvormen, minuten én TSS. De arm hangt aan TWEE voorwaarden en
voor doel FTP is de fase niet de bindende: `PROFILES.ftp.spreiding.effortsInLangeRit` is
false. Alleen `PROFILES.klim` draagt de vlag. De voorgestelde ingreep is per constructie inert.

METING B — fase verruimd EN `PROFILES.ftp.spreiding.effortsInLangeRit` op true. Kwaliteits-
minuten 75 / 75 / 75 / 75 / 69 / 75, week-TSS 250 / 392 / 387 / 352 / 337 / 209. ELKE
weekvorm daalt; V3 blijft met 75 onder de norm van 84. Oorzaak: `combo_long_with_efforts`
levert 30 kwaliteitsminuten ongeacht de dagduur — gemeten gelijk op 120, 180, 210 en 240
minuten — en CONSUMEERT een quality-slot. De arm ruilt dus een sjabloon van 60 werkminuten
op de lange dag in voor 30, en kost daarbovenop een midweekse kwaliteitsdag.

De efforts-arm is hiermee gesloten als route voor stap 1b.

## 2. Wat het WEL is — afstand tegenover draagkracht

`pickBestSpread_` rangschikt op: geen weekendpaar vormen, dan MAXIMALE afstand tot de reeds
geplaatste harde dagen, dan pendel-voorkeur, dan laagste dagIdx. Draagkracht komt er niet in
voor. In V3 (ma70 di70 do70 za180 zo90) ligt de zondag verder van de maandag dan de zaterdag,
dus de zondag van 90 minuten wint van de zaterdag van 180 en de grootste dag van de week
draagt nul kwaliteit.

DE DOSIS HANGT AAN DE VOLGORDE, en dat is de diepere vondst. Dezelfde drie dagen leveren een
ander weektotaal naar gelang de VOLGORDE waarin de allocator ze pakt, omdat `goalPickIntent_`
per keuze meeweegt welke bucket nog niet gedekt is en welke intent de vorige keuze had.
Gemeten op de set ma70 + za180 + do70: volgorde ma>za>do geeft 113 kwaliteitsminuten,
ma>do>za en za>ma>do geven 87. Een set zonder de lange dag (ma+di+do) geeft 77 in elke
volgorde. Een verschil van 30 procent zonder trainingsreden.

## 3. Het plafond per weekvorm

Alle geordende drietallen geënumereerd, met de tussenruimte-eis (`gapOK_`) gewoon actief.
Huidig tegenover plafond, in kwaliteitsminuten: V1 93 / 93 · V2 113 / 113 · V3 77 / 113 ·
V4 105 / 105 · V5 84 / 85 · V6 93 / 93. Vier van de zes zitten AL op het plafond, V5 één
minuut eronder. Alleen V3 laat iets liggen: 36 minuten. Het plafondpad heeft in alle zes
dezelfde vorm — weekdag, dan de lange dag, dan weekdag.

## 4. De regel

Vanaf de TWEEDE kwaliteitsdag weegt DRAAGKRACHT zwaarder dan afstand; afstand breekt alleen
de gelijke gevallen. Draagkracht is de effectief trainbare tijd van de dag, dezelfde grootheid
die de allocator al gebruikt bij de sjabloonkeuze (pendeldag → `settings.pendelDuurMin`,
anders de dagminuten, beide afgetopt door `profiel.maxDuurMin`).

Grond: de tussenruimte-eis is een HARDE filter en blijft dat; boven die eis heeft extra
afstand geen trainingswaarde, terwijl draagkracht die wel heeft. Bij de EERSTE keuze bestaat
er geen afstandsvraag (er zijn nog geen ankers), dus daar doet de term niet mee en blijft het
gedrag ongewijzigd. Er komt geen enkele nieuwe constante bij: de vergelijking is tussen twee
grootheden die de allocator al kent. Dit reserveert de lange dag NIET — DOELEN-SPEC 2A blijft
staan — het stopt alleen dat de allocator er blind overheen stapt.

GEMETEN, weekvorm-as: kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93, week-TSS
268 / 410 / 464 / 362 / 352 / 227. Vijf van de zes byte-identiek in minuten EN in TSS; alleen
V3 beweegt, van 77 naar 113, en komt daarmee boven de norm van 84.

BLAST RADIUS, 5 doelen x 3 fases x 6 weekvormen = 90 cellen: 13 bewegen, allemaal V3,
allemaal OMHOOG, nul dalingen. De twee V3-cellen die stil blijven zijn Beklimmingen in Build
en Peak — daar claimt de efforts-arm de lange dag al.

BLAST RADIUS op de vier weekvormen van `onderhoudInvariance`, 5 doelen x 3 fases x 4 = 60
cellen: 39 bewegen, 29 omhoog in kwaliteitsminuten, 0 omlaag, 10 gelijk in minuten met een
andere sessieverdeling. `kort-winter-3x60` blijft volledig onaangeroerd.

## 5. Een afgewezen tussenvariant

Overwogen en GEMETEN: de afstandsterm AFTOPPEN op de vereiste tussenruimte in plaats van de
draagkrachtterm erboven te zetten. Zelfde uitkomst op de weekvorm-as, maar 52 in plaats van 39
bewogen cellen, waaronder twaalf op `kort-winter-3x60` waar de dosis niet verandert en alleen
de sjabloonrotatie verschuift. Zuivere churn; afgewezen.

## 6. Parkeerpunt, niet geraakt in deze stap

`threshold_4x8_seiler` draagt `effectTags: ["drempel"]` en `zone: 4`, maar de core loopt op
103 tot 108 procent FTP, dus de minuten landen in de ANAEROBE bucket. Op een dag van 70
minuten levert dat 32 anaerobe minuten en TSS 124 — onder de geijkte weging (anaeroob 3,045
per minuut) de duurste sessie per minuut in de bibliotheek. Effecttag en zoneboekhouding
spreken elkaar hier tegen. Raakt de dosis-valuta en de weekbelasting; eigen ronde.
