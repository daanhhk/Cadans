# Punt 19 — recon en meting: het dagtype weekend, en wat eronder bleek te liggen

Chat-zijdige leesronde, 8 augustus 2026. Read-only kloon, `buildWeekProposal` uit een
esbuild-bundel gedraaid, `TZ=Europe/Amsterdam`, de klok als Proxy op de echte `Date`. Elke
uitspraak hieronder is GEDRAAID, niet gelezen. CC deed alleen de commits.

## 1. Meetopzet

7 weekvormen maal 5 doelen maal 5 fase-configuraties maal 12 doelStart-offsets — **2100 weken,
8700 dag-cellen met een sessie**. IJking A/A op ongewijzigde invoer: **0 afwijkende cellen**.

## 2. De label-flip, en hij splitst zonder rest

Weekend omgezet naar vrij geeft **369 afwijkende cellen over 291 weken**, en die vallen in TWEE
families zonder rest.

**Familie 1, de deload-tak: 324 cellen.** 49680 tegen 19440 minuten, TSS **35640 tegen 6804**. Dit
is de levende route en het onderwerp van §4.

**Familie 2, het allocator-weekendpaar: 45 cellen.** Uitsluitend op V7, en uitsluitend bij korte
beklimmingen (33) en lange beklimmingen (12) — precies de twee profielen met `weekendBlok` true.
Die rust op `DOELEN-SPEC` §3.4 VASTGESTELD en is daarmee **BUITEN SCOPE**: daar is het weekendpaar
de bedoelde training en geen defect.

## 3. Twee premissen van punt 19 zijn WEERLEGD

**(a) Verstreken en gereden dagen bereiken de takken nooit.** `apps/web/src/lib/proposal.ts:528`
geeft `assignWorkouts` uitsluitend `tePlannen` mee. Een dag die al gereden is komt er per
constructie niet doorheen, dus het dagtype kan daar niets verkeerd doen.

**(b) De taper-tak behandelt vrij en weekend in ÉÉN conditie.** `packages/engine/src/planner.ts:817`
splitst niet, en dat is gemeten: **0 verschillen over 420 Recovery-weken**.

Van de vier routes die het punt noemde LEEFT er dus nog één: de deload-tak.

## 4. Wat er vandaag echt verdwijnt

Weekenddagen: **0 minuten**. Doordeweekse dagen: **1482 minuten over 76 dagen**. Op Daans eigen
weekvorm: **nul**. De kalendernaam werkt vandaag dus eerder MEE dan tegen — hij houdt de lange rit
overeind die anders ook zou sneuvelen. Dat maakt punt 19 een symptoom en niet de ziekte.

## 5. De herstelweek zelf, op Daans weekvorm

ma45 di60 do60 za120, doel FTP, macrofase Base.

- **Opbouwweek:** 286 minuten — z2 131', drempel 98', rust 57' — **97 kwaliteitsminuten**, TSS 261.
- **Herstelweek:** 285 minuten — z2 130', drempel 10', rust 25' — **10 kwaliteitsminuten**, TSS 165.

Volume **-1 procent**, kwaliteit **-90 procent**, belasting **63 procent**. Kwaliteitsdagen van
**3 naar 1**.

**WAT AL GOED GAAT:** de overgebleven kwaliteitsdag HOUDT zijn karakter — Drempel 2x8 op 98 tot 105
procent FTP — en halveert alleen zijn blokduur, van 18 naar 10 minuten. Dat is precies wat M76
voorschrijft, en het is geen toeval maar een correcte implementatie van die regel.

**WAT SCHEEF ZIT:** de lange rit blijft op VOLLE duur staan — za 120 minuten Z2, TSS 86 — en dat is
juist de post die als eerste hoort te vervallen. Hij blijft staan OMDAT de dag weekend heet. Punt 19
en dit defect zijn dezelfde plek: `planner.ts:839-841`, met de eligibility op `:304`.

**Breder, en het beeld herhaalt zich.** V2 van 479 naar 420 minuten bij 130 naar 13
kwaliteitsminuten; V3 van 479 naar 460 bij 130 naar 13; V7 van 450 naar 420 bij 103 naar 13. Bij
Onderhoud **0 cellen**, want dat doel draagt geen mesocyclus.

## 6. Twee afgewezen varianten, allebei gemeten

**Alles als weekend:** TSS 201 en **NUL** kwaliteitsminuten — 77 procent van de opbouwweek. Dat is
geen herstelweek maar een week zonder prikkel.

**Alles als vrij:** TSS 100 en 225 minuten, maar dat snijdt BLIND in de opgegeven tijd. De
gebruiker gaf die minuten op; ze zomaar halveren is een andere belofte breken.

Geen van beide is de fix. De fix zit in WAAR de dosisverlaging landt, niet in het label.

## 7. M78 reproduceert NIET op deze as

Over mesoweek 1 tot 4 zijn de blokpercentages **identiek**: 99, 100, 98, 95-99 en 89-92 procent FTP.
Alleen de DUUR beweegt — 5/7/9/12 naar 5/8/10/13 naar 6/8/10/14 naar 3/4/5. Op deze as schaalt
`mesoFactor` dus duur en géén %FTP.

EEN AS. Dit is een aanleiding tot HERTOETSING en uitdrukkelijk **geen intrekking van M78**.

## 8. De TID-brug, en waarom hij nog niets bewijst

Seiler-3-zone op het middelpunt van elk blok — Z1 onder 80 procent FTP, Z2 80 tot 100, Z3 boven
100 — bij doel FTP, Base, mesoweek 1:

3,0u 62/38/0 · 4,0u 74/19/7 · 4,75u 70/24/6 · 5,0u 69/31/0 · 8,0u 76/15/9 · 12,0u 84/12/3.

Het plan is **piramidaal** en wordt dat sterker met de uren. Anaeroob verschijnt alleen bij 8,0u
(7 procent) en is **0 bij 10, 12 en 15 uur**: geen kanteling. De Z3-reeks 6/0/9/3 lijkt bovendien op
**variant-rotatie** in plaats van op ontwerp.

EEN AS — te meten, geen bevinding.

## 9. HET MEETGAT, en dit is de dragende vondst

Het app-label **`drempel` draagt zowel sweetspot (89-92 procent FTP) als bovendrempel (98-105)**.
Het loopt daarmee dwars door de **LT2-grens**, precies de grens waarop de TID-modellen zich van
elkaar onderscheiden. Elke methodiek-uitspraak die op dat label rust, meet niets.

De PLAN-kant is zonder nieuwe databron te splitsen: elk blok draagt `pctLo` en `pctHi`. De
GELEVERDE kant niet — de zonegrenzen komen uit intervals `power_zones` en staan op
**55/75/90/105 procent** (`apps/web/src/lib/zonemunt.ts:41`), waardoor LT2 midden in de vierde
bucket valt.

## 10. Bouwvoorstel, NIET in deze ronde gebouwd

**Punt 39.** De herstelweek snijdt in het DUURvolume, met de lange rit voorop, en houdt één of twee
korte prikkels op hun eigen relatieve intensiteit. Twee hendels: het **deload-quotum van 1** en de
**kalendernaam-splitsing**. N en de volumefactor worden in de bouwronde geijkt, nooit vooraf
gekozen.

**HANGT AAN PUNT 40:** zolang `drempel` twee zones dekt, is er geen toets die de uitkomst kan
beoordelen.
