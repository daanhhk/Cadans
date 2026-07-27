# Stap 7 — recon: de coachstem, de dosis en de fase-sturing

Meetronde 27-07-2026. Chat leest zelf (read-only kloon van `daanhhk/Cadans` @ `ae8e512`
en `daanhhk/training` @ `3e8090a`), bundelroute esbuild buiten de repo-tree, TZ
Europe/Amsterdam, klok gestubd per weekmaandag. Geen code gewijzigd.

De aanleiding was de hangende belofte uit 5b-ii ("het plan was te licht, er mag meer
dosis in", zonder mechanisme). Die staat er nog, maar is een SYMPTOOM. De ronde legde
drie diepere oorzaken bloot; de bouwvolgorde onderaan is daarop herzien.

## 1. De twee kaarten lezen hetzelfde venster

In blokweek 4 levert `blokReviewVenster` een `ctlAnker` die GELIJK is aan de
weekmaandag — dezelfde `computeBlockCtlDelta`-aanroep die het fatigue-pad doet.
Gemeten op `doelStart` 2026-06-29, weekmaandag 2026-07-20, CTL 50,7 naar 45,7:

- `blokReviewVenster` geeft `{startMonday 2026-06-29, ctlAnker 2026-07-20, fase lopend}`
- `fatigueTrigger` geeft `up`
- `blokCheck` geeft `geleverd_niet_gestegen`, `gestegen = false`

Eén getal, één drempel (`NO_BUILD_CTL_DELTA` = 1,0), twee kaarten. In `SchemaView`
onderdrukt niets de terugblik bij een fatigue-voorstel, dus ze staan tegelijk.

Extra: de UP-actie zet `mesoWeek` naar 1 = `mesoFactor` 1,00, de LAAGSTE opbouwtrede.
De coach constateert "te licht" en landt op de laagste stand. Mechanisme-
tegenstrijdigheid, niet alleen toon.

## 2. Zes bereikbare copy-combinaties, twee strijdig

`blokCheck` en `dosisTerm` delen dezelfde ctlDelta en dezelfde drempel, dus in fase
"afgerond" met geleverde uitvoering zijn er zes paren. Alle zes gedraaid:

- ΔCTL > 1,0 met effect gestegen — consistent
- ΔCTL > 1,0 met effect niet_gestegen (tijd_in_zone) — lof plus tekort in één kaart
- ΔCTL > 1,0 met effect niet_meetbaar — lof plus zwijgen, aanvaardbaar
- ΔCTL <= 1,0 met effect gestegen — STRIJDIG: "het plan was te licht" naast "precies
  de winst waar dit blok voor bedoeld was"
- ΔCTL <= 1,0 met effect niet_gestegen (volume) — STRIJDIG: "er mag meer dosis in"
  naast "méér drempeltijd is niet het antwoord"
- ΔCTL <= 1,0 met effect niet_meetbaar — tekort plus zwijgen

Alle zes eindigen op een dosis-instructie zonder knop.

## 3. De belofte heeft geen landingsplaats

Kwaliteits-intentminuten (high + anaerobic via `ARCHETYPE_LOAD_FROM_BUCKET_`) van het
Cadans-plan, doel FTP, planner ma60/di60/do60/za120, gepinde klok per week:

- 2026-06-29 mesoweek 1: 45,0
- 2026-07-06 mesoweek 2: 48,5
- 2026-07-13 mesoweek 3: 51,8
- 2026-07-20 mesoweek 4: 12,6

Reproduceert `docs/UITVOERINGS-REFERENT-RECON.md` §2.6 (45/49/52/13) onafhankelijk op
de gecommitte code. De NORM vraagt 84 gemeten zoneminuten (3 prikkels bij >= 5
weekuren); het PLAN geeft er 45 uit.

Quotum-hendel GEMETEN INERT: `PROFILES.ftp.kwaliteitPerWeek.Base` van 2 naar 3 levert
onveranderd 2 kwaliteitsdagen en 45,0 minuten. Ook niet met vijf trainbare dagen. Ook
niet met `midweekMinGap` op 0. De patch komt WEL aan: quotum 1 geeft 1 kwaliteitsdag
en 21,0 minuten. De klem zit dus NA het quotum en na de spreiding, in de
archetype-selectie (`goalWorkout_` / `goalPickIntent_`, `archetypes.ts`). NIET
GEISOLEERD — eerste taak van de bouwronde.

## 4. De TSS-weging onderschat kwaliteitswerk

`tssFromZoneMinutes_` (`packages/engine/src/zones.ts`) rekent per minuut:
low x 0,70 + high x 0,95 + anaerobic x 1,05.

Echte TSS schaalt kwadratisch: per minuut IF^2 x 1,6667.

- low, IF circa 0,65: 0,70 — KLOPT
- high (tempo + drempel), IF circa 0,90: circa 1,35 — engine 30 procent te laag
- anaerobic (boven 105 procent), IF circa 1,15: circa 2,20 — engine 52 procent te laag

Consequentie, doorgerekend met de juiste weging: Daans werkelijke week (circa zes uur,
110 minuten in Z3 en hoger) komt op circa 324 TSS per week, wat een steady-state CTL
van circa 46 geeft — zijn gemeten CTL is 45,7. Het model reproduceert zijn eigen data.
Het Cadans-plan (vijf uur, 45 kwaliteitsminuten) komt op circa 246 TSS, CTL circa 35.
Het gat is elf CTL-punten en zit vooral in kwaliteitsminuten, niet in uren: zes uur met
negentig kwaliteitsminuten geeft circa 310 TSS en houdt CTL rond 44.

Deze weging raakt ook de weekkaart gepland-vs-gedaan (geplande TSS structureel te laag
naast gemeten TSS uit intervals) en de projectie-laag. Engine, autorisatie nodig.

## 5. Wat het plan per doel en urenbudget voorschrijft

Winterweek 2027-01-11, gepinde klok, kwaliteitsminuten en kwaliteitsdagen:

- FTP 3 uur: 34 minuten, 2 dagen
- FTP 5 uur: 45 minuten, 2 dagen
- FTP 8 uur: 45 minuten, 2 dagen
- Onderhoud 3 uur: 59 minuten, 3 dagen
- Onderhoud 4 uur: 87 minuten, 3 dagen
- Onderhoud 5 uur: 87 minuten, 3 dagen
- Onderhoud 6 uur: 66 minuten, 3 dagen
- Onderhoud 8 uur: 69 minuten, 3 dagen

TWEE ANOMALIEEN.
(a) Het onderhoudsdoel traint bijna twee keer zo hard als het doel dat de FTP moet
VERHOGEN: 87 tegen 45 bij dezelfde vijf uur. Dit is de omkering van M37/M38 en is de
wortel van de ervaring dat Cadans te licht voorschrijft.
(b) Onderhoud zakt van 87 naar 66 minuten tussen vijf en zes uur. Extra beschikbare
tijd VERWATERT de sleutelsessie in plaats van er Z2 omheen te leggen — het omgekeerde
van de schaarste-regel (DOELEN-SPEC §2A: beschermd deel staat vast, residu groeit).
Vermoedelijke oorzaak: de selector kiest bij meer minuten een langer sjabloon met
relatief minder tijd-in-zone. Niet geisoleerd.

## 6. De fase-sturing staat volledig in het teken van het event

Twee klokken, en maar één ervan doet wat verwacht wordt.

MESOCYCLUS — werkt. Week-TSS over een blok: 220 / 223 / 223 / 172. Drie weken opbouw,
dan deload, cyclisch, los van het event.

MACRO-FASE — event-gedreven en dominant. `eventFase_` telt kaal de weken tot AGR en
zet Base zolang er negen of meer zijn. Gemeten op de 38 weken tot 2027-04-17: Base tot
en met 2027-02-15, Build vanaf 2027-02-22, Peak vanaf 2027-03-22. Dus dertig weken
ononderbroken Base, dan vier weken Build en vier weken Peak, terwijl er acht maanden
aan eigen doelen (FTP, daarna Onderhoud) op de rol staan.

CTL-simulatie tot AGR per urenbudget (engine-weging, dus systematisch te pessimistisch
door §4; de RICHTING klopt, de absolute waarde niet): 5 uur 27,6 — 6 uur 33,1 — 7 uur
37,5 — 9 uur 48,8 — 11,5 uur 62,7. Startwaarde 45,7.

## 7. GAS — gesloten, geen verdere vergelijking

Voor de volledigheid vastgelegd, daarna afgesloten (Daan-besluit).

GAS schaalt PERCENTAGES met de mesoweek: `adj(p) = Math.round(p * mesoFactor) +
VARIANT_FASE_OFFSET[macroFase]`, met Base = -2 (`Algorithm.gs` en `Archetypes.gs`
`expandArchetype_`). Een drempelinterval op nominaal 95 tot 102 procent komt daardoor
in opbouwweek 3 uit op 107 tot 115 procent FTP — bij FTP 280 is dat 300 tot 322 watt.
Cadans houdt hetzelfde interval op 98 tot 100 procent en geeft circa 15 procent meer
minuten (21,0 naar 24,2 minuten drempel).

Het GAS `PROFILES.ftp` is voor het overige IDENTIEK aan Cadans (quotum Base 2 /
Build 3 / Peak 2, `midweekMinGap` 1, `langeRitPerWeek` 1, `volumeResponse` gelijk).
Het verschil zit dus UITSLUITEND in de intensiteitshendel.

BESLUIT: Cadans' fork is correct (M74-M78 — karakter invariant, alleen de dosis
beweegt); een drempelinterval op 112 procent is geen drempeltraining meer. Er wordt
niet meer met GAS vergeleken. Wel volgt hieruit dat de norm van 84 geijkt is op een
reeks uit het OUDE regime, deels op GAS-sessies boven 110 procent — die lat meet dus
niet wat Cadans voorschrijft.

## 8. Daan-besluiten deze ronde

- Hij VOLGT het voorgestelde plan. Afwijkingen in juli waren omdat Cadans nog in
  ontwikkeling was en GAS zwaarder voorschreef. Uitgangspunt voor alle bouw: elke
  gebruiker volgt de app volledig.
- Niet meer met GAS vergelijken; volledig vanuit Cadans redeneren.
- December en januari: doel Onderhoud, minder uren, HOGERE kwaliteitsdichtheid om de
  FTP vast te houden. "Zwaarder" betekent hier meer tijd-in-zone per beschikbaar uur,
  NOOIT een hoger percentage op dezelfde minuten.
- Incidenteel extra uren in die periode worden gevuld met Z2; de sleutelsessies blijven
  onaangetast staan.
- De app MAG voorstellen wanneer het moment daar is om naar de event-aanloop over te
  stappen; Daan bevestigt dat.
- Nieuw: EVENT als DOEL-optie, zodat de overname een expliciete keuze is in plaats van
  een automatische aftelling. Kan mee in de al openstaande doel-lijst-herziening.
- Daglus-eis: is er een sleutelsessie gepland en wordt er Z2 gereden, dan meldt de
  coach NA de rit wat dat betekent en past hij de rest van de week aan om de
  sleutelsessie in te halen.

## 9. Herziene bouwvolgorde

1. TSS-weging rechtzetten (§4). ENGINE, autorisatie. Zolang die scheef staat liegt elke
   meter: weekkaart, projectie, blok-check, elke simulatie.
2. Dosis per doel herijken (§3 en §5): de derde-prikkel-klem isoleren, FTP zwaarder dan
   Onderhoud, extra uren als Z2-residu met beschermde sleutelsessies. ENGINE.
3. Fase-sturing loskoppelen van het event (§6): EVENT als doel-optie, overname als
   voorstel met melding. ENGINE, raakt DOELEN-SPEC.
4. Daglus: gemiste sleutelsessie herkennen en de week herschikken.
5. Dosis-trede persistent maken — de oorspronkelijke hangende belofte. Vraagt een
   migratie.
6. Eén stem: doortrain-kaart en terugblik samenvoegen tot één blokkaart met één
   voorstel (§1 en §2).

## 10. Open punten

- De derde-prikkel-klem in `goalWorkout_` / `goalPickIntent_` is NIET geisoleerd.
- De verwatering bij Onderhoud tussen vijf en zes uur is NIET geisoleerd.
- Het besluit uit Onderhoud-soft deel A dat een event-gedreven fase de Onderhoud-pin
  OVERLEEFT werkt tegen de winterwens in en moet herzien; dat gaat via
  `docs/DOELEN-SPEC.md`, niet in een chat.
- De uitvoerings-norm van 84 moet herankeren op de sleutelsessies die Cadans zelf
  voorschrijft, zoals DOELEN-SPEC §3.1 al voorschrijft ("uitvoering = sleutelsessies
  geleverd op de voorgeschreven tijd-in-zone"). De huidige weeknorm uit gedeclareerde
  uren is een afwijking van die spec.
- De CTL-simulatie in §6 moet opnieuw met de gecorrigeerde weging uit §4.
