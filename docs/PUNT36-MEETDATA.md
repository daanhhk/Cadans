# PUNT 36 — MEETDATA

**GEMETEN 05 en 06-08-2026.** Drie meetrondes op de shot-harness, telkens met een TIJDELIJK,
vlag-gestuurd instrument in `tools/shots/shot.mjs` dat na afloop is teruggedraaid. De lokale D1 is
uitsluitend READ-ONLY gelezen met `--local`; `--remote` is nooit aangeraakt. Er is GEEN enkele
app-wijziging gedaan: geen engine, geen client, geen worker, geen migratie, geen deploy.

**WAAROM DIT DOCUMENT BESTAAT.** Punt 36 heeft drie rondes gekost, waarvan twee met een
instrumentfout die pas achteraf zichtbaar werd. Zonder deze vastlegging wordt de vraag over een
half jaar opnieuw vanaf nul onderzocht, inclusief dezelfde twee valkuilen. Dit is RUWE UITVOER met
de opzet erbij; het verdict staat in `docs/ROADMAP.md` punt 36.

## 1. Ronde 1 — de A/B-probe

**OPZET.** Per scenario twee lezingen van `document.querySelector("main")?.innerText` op hetzelfde
scherm: A zodra het scherm stond, B nadat beide sync-responsen binnen waren plus een marge. Elf
scenario's, twee volledige runs.

**UITSLAG: alle elf `A GELIJK AAN B: ja`, in beide runs**, met gelijke regelaantallen — doel-passend
92, klim-kort 86, klim-weekstem 81, overname 79, v2 86, v4 86, v7 86, v7-blokweek4 91, v7-midweek
79, v7-pendel 86, v7-weekstem 85.

**DEZE RONDE IS ONGELDIG ALS VOOR/NA-TOETS, en dat is de belangrijkste uitkomst ervan.** A lag
**1723 tot 2825 ms NÁ** de laatste sync-respons van diezelfde pageload, in **22 van de 22**
gevallen. `settle()` keert pas terug als de sync én de daaropvolgende herbouw klaar zijn — de
`PUT /api/weekplan` die eruit volgt staat in de tijdlijn ruim vóór moment A. A en B waren dus
allebei ná-lezingen, en "A gelijk aan B" kon per constructie niet anders dan slagen.

Er zat een TWEEDE fout in: de wachtlus zocht de sync-responsen van de 01-week-load (+10719 en
+10829 in de tijdlijn van `v7-weekstem`) maar matchte op de HELE tijdlijn en pakte die van de
bewijsweken-lus (+1597 en +1727). Hij keerde daardoor onmiddellijk terug zonder ooit te pollen, en
de gerapporteerde marge was tegen de verkeerde respons berekend. De marges hierboven zijn
herberekend uit de tijdlijnen zelf, tegen de laatste sync ná `MARKER goto 01-week`.

**WAT DEZE RONDE WÉL AANTOONT:** ná `settle` staat het scherm stil. De shot die de harness daarna
maakt beweegt niet meer door de sync. Dat sluit NIET uit dat twee verschillende runs een ander
gesettled scherm opleveren.

## 2. Data-beweging over de meetdag

Dezelfde twee `SELECT`s, drie keer gedraaid rond ronde 1.

- `activities`: **stond stil in alle drie de standen** — n=262, mn=2025-07-06T09:03:22,
  mx=2026-08-04T15:15:22, tss=17886.
- `wellness`: groeide **één keer**, tussen stand 1 en stand 2 — van n=397, mx=2026-08-05,
  hrv=20355 naar n=398, mx=2026-08-06, hrv=20414. Stand 3 was identiek aan stand 2.

Binnenkomende ritdata is dus GEEN kandidaat: de activiteiten bewogen op geen enkel moment.

## 3. Ronde 2 — herhaling rug aan rug

**OPZET.** Drie scenario's (`v7-blokweek4`, `v7-weekstem`, `klim-weekstem`) maal vier volledige
sweeps, achter elkaar, in één proces. Elke sweep volledig: settings-PUT, planner-PUTs én de
bewijsweken-lus.

**UITSLAG: 72 van de 72 byte-identiek** (r2, r3 en r4 elk tegen r1, acht shots per paar, op
bytecount én sha256). Nul afwijkingen.

**DEZE RONDE MEET DE VERKEERDE AS.** Punt 36 valt per SCENARIO uiteen; door hetzelfde scenario te
herhalen wordt precies de as vastgezet waarop het verschijnsel leeft. "Identiek" leest hier als
bewijs en is het niet. Zie `docs/ROADMAP.md` punt 36 en de bijbehorende les in
`docs/WERKWIJZE.md`.

## 4. Ronde 3 — drie volledige cycli

**OPZET.** De VOLLEDIGE scenario-lijst drie keer, in één proces en één browser, zodat tussen twee
waarnemingen van hetzelfde scenario de tien andere hebben gedraaid. 95 shots per cyclus, 285 in
totaal.

**DE DRIE PAREN**, telkens 93 vergeleken van de 95 met `v7/09-vorm.png` en `v7/10-trainingen.png`
uitgesloten wegens punt 23:

- c2 tegen c1: **69 van de 95 identiek**, 24 afwijkend — `klim-weekstem`, `v7-blokweek4` en
  `v7-midweek`, elk alle acht shots.
- c3 tegen c2: **77 van de 95 identiek**, 16 afwijkend — `v7-midweek` en `v7-weekstem`, elk alle
  acht.
- c3 tegen c1: **69 van de 95 identiek**, 24 afwijkend — `klim-weekstem`, `v7-blokweek4` en
  `v7-weekstem`, elk alle acht.

**DE LETTERLIJKE REGELS** uit `01-week.txt`, alle vier categorie (c) — het plan zelf. Nul (a)
wellness, nul (b) gereedheids-aanbod, nul stille vervanging.

- `klim-weekstem`, c1 tegen c2: `regel 51: A="/207" B="/269"` — de geplande TSS, met de geplande
  uren mee van `/3:59` naar `/4:59`.
- `v7-blokweek4`, c1 tegen c2: `regel 87: A="0/2" B="3/3"`, en de regel eronder van
  `Tempo 24/51 · Drempel 2/85 · VO2max 1/—` naar `Tempo 24/0 · Drempel 2/0 · VO2max 1/0`. Sinds
  punt 17 IS die rechterkant het bewaarde plan van die week.
- `v7-midweek`, c1 tegen c2: `regel 49: A="/429" B="/375"`.
- `v7-weekstem`, c2 tegen c3: `regel 49: A="/95" B="/41"`.

Bij alle vier verschilt bovendien regel 29, de teller `PUT /api/weekplan/2026-08-03`, tussen 2x en
3x.

**DE EQUIVALENTIEKLASSEN PER SCENARIO.** Er is GEEN vast punt na drie cycli:

- `klim-weekstem`: c1 ≠ c2 = c3 — verzadiging.
- `v7-blokweek4`: c1 ≠ c2 = c3 — verzadiging.
- `v7-weekstem`: c1 = c2 ≠ c3 — pas in cyclus 3 verschoven.
- `v7-midweek`: c1 = c3 ≠ c2 — OSCILLEERT.
- De overige zeven scenario's: identiek in alle drie de cycli.

De drie paar-uitslagen zijn onderling consistent — elk scenario valt in een sluitende klasse — en
dat is losstaand bewijs dat de vergelijking zelf deugt.

**DE WEEKPLAN-TABEL.** Zelfde `SELECT` vóór en ná de run: n bleef **9** en het datumbereik bleef
2026-06-29 tot 2027-02-22, maar `sum(length(entries_json))` groeide van **38822 naar 40061** — de
inhoud van dezelfde negen rijen is met **1239** tekens herschreven. De bak accreteert dus nog na
drie cycli, en een nulmeting erven blijft waardeloos, ook binnen één sessie.

## 5. De sleutel-telling

**AFGELEID UIT DE GECOMMITTE BRON, niet gemeten.** De elf scenario's doen samen **33
weekplan-schrijfacties op 7 unieke week-sleutels**. Week **2026-07-13** wordt door **10 van de 11**
scenario's geschreven, elk met een ander doel, andere plannerdagen of een andere blokweek.
`weekplans` heeft `(user_id, week_monday)` als sleutel, dus elke schrijver overschrijft zijn
voorganger — en elk scenario leest via de recency-seed (`proposal.ts:523`, filter
`datum < weekMonday`) en de blok-terugblik terug wat een ander achterliet.

`overname` is het enige scenario dat dit al ontloopt: het draagt een eigen `monday`
(`2027-02-22`) en deelt zijn sleutels met niemand. Het staat dan ook in alle drie de cycli stil.

## 6. Wat NIET is vastgesteld

**Dat het wegnemen van de sleutel-botsing de variantie wegneemt.** Dat is een verklaring die past
op alle waarnemingen, geen bewezen oorzaak. De uitsluitende toets hoort bij de fix-ronde: geef elk
scenario zijn eigen week-sleutels en herhaal daarna de drie-cycli-meting. Blijven alle 93 dan over
alle drie de paren identiek, dan was de sleutel-botsing de hele oorzaak. Blijft er iets bewegen,
dan is er een tweede bron en is punt 36 niet af.

Evenmin vastgesteld: of de APP-kant hier een defect draagt. Het plan-van-record is INVOER van de
volgende bouw en wordt 2 of 3 keer per pageload geschreven; bij één configuratie raakt dat niets,
bij een wissel van doel, doelStart of plannerdagen mogelijk wél. Dat is punt 28 en een ander punt.
