# Doortrain-kaart — recon: blok-signaal in plaats van TSB-drempel

Status: RECON, nog niet gebouwd. Client-only verwacht. Gemeten tegen de echte wellness-reeks in
remote D1 (376 rijen met CTL, 2025-07-15 t/m 2026-07-25), read-only opgehaald op 25-07-2026.

## 1. De vraag

De week-brede vermoeidheidskaart (3d stap 4) biedt op een kalender-deload aan door te trainen (UP)
en in een opbouwweek een vervroegde deload (DOWN). Beide takken hangen aan een drempel op het
7-daags gemiddelde van `vorm` (= CTL − ATL = TSB). Daan zat in een kalender-deload met frisse benen
en kreeg geen aanbod. De UP-drempel ging daarop van +8 naar +5 (`4034bdb`) — een tussenstap, geen
antwoord.

## 2. Wat er nu staat

- `apps/web/src/lib/fatigue.ts` — `computeTsbTrend` (7d-gemiddelde van `vorm`), `fatigueMinDataOk`
  (>= 21 rijen binnen 42 dagen), `fatigueTrigger` (de poort), `weekFatigueEnabled` (profiel-gate), en
  de named exports `UP_TSB_THRESHOLD = 5`, `DOWN_TSB_THRESHOLD = -25`,
  `FATIGUE_TREND_WINDOW_DAYS = 7`, `FATIGUE_MIN_ROWS = 21`, `FATIGUE_MIN_WINDOW_DAYS = 42`.
- `apps/web/src/lib/schema.ts` — `loadSchemaWeek` roept de trigger aan met
  `calendarMesoWeek: proposalWeek.mesoWeek`, `macroFase`, `nearTaper`, `tsbTrend`, `minDataOk`.
  Vuurt hij, dan draait een tweede `buildWeekProposal` met `mesoWeekOverride` (up -> 1, down -> 4)
  als wat-als-preview. `FatigueVoorstel` draagt `tsbTrend`.
- `apps/web/src/lib/coachNarrative.ts` — `fatigueUpAanbodRegel` en `fatigueDownAanbodRegel` zetten
  de TSB in de copy.
- `apps/web/src/components/schema/FatigueCard.tsx` — zone-pill via `tsbZone(fatigue.tsbTrend ?? 0)`.
- SEAM (dragend, blijft staan): de parameter heet `calendarMesoWeek` maar krijgt de EFFECTIEVE
  mesoweek. Bij een doel zonder mesocyclus is die altijd 1; `weekFatigueEnabled` gate't dat doel
  al eerder uit.

## 3. Meting 1 — de drempel bemonstert ruis

7-daags gemiddelde van `vorm`, uit de dagelijkse reeks:
17-07 9,14 · 18-07 7,64 · 19-07 7,00 · 20-07 6,29 · 21-07 4,57 · 22-07 4,10 · 23-07 4,00 ·
24-07 3,90 · 25-07 4,43.

Op 17 juli stond het signaal ruim boven +5 — maar dat was opbouwweek 3, waar de UP-tak per definitie
niet vuurt (die vereist mesoWeek 4). In de deloadweek zelf, waar het aanbod betekenis heeft, staat
het op 3,9 a 4,4. De spreiding van het signaal (5,2 punten in acht dagen) is groter dan de afstand
tot de drempel. Die spreiding komt uit ATL (7d-EWMA): een enkele weekendrit verplaatst hem tien
punten.

CONCLUSIE: het NIVEAU van de drempel is niet het probleem. Een drempel op dit signaal is een
muntworp; verder verlagen maakt hem willekeuriger, niet beter.

## 4. Meting 2 — het blok-signaal

ΔCTL over de 21 dagen vóór de weekmaandag, per maandag over het beschikbare jaar:
30-03 -3,3 · 06-04 +6,1 · 13-04 +7,3 · 20-04 +12,0 · 27-04 +2,8 · 04-05 +4,8 · 11-05 -3,2 ·
18-05 -0,4 · 25-05 -4,0 · 01-06 +2,7 · 08-06 +1,0 · 15-06 +2,6 · 22-06 +4,3 · 29-06 +5,4 ·
06-07 +1,7 · 13-07 -5,6 · 20-07 -4,9.

Het huidige blok (doelStart 29-06, opbouwweken t/m 19-07): CTL 50,7 -> 45,7 = -5,0.

GEVOELIGHEID (aantal van 17 maandagen onder de grens): 0,0 -> 6 · +0,5 -> 6 · +1,0 -> 7 ·
+1,5 -> 7 · +2,0 -> 8 · +2,5 -> 8 · +3,0 -> 11. Tussen 0,0 en +2,5 verschuift de uitkomst dus twee
gevallen: de drempel ligt op een PLATEAU, niet op een helling. Dat is precies de eigenschap die het
TSB-signaal mist.

## 5. Het model

Een vraag draagt beide takken: HEEFT HET AFGELOPEN BLOK BELASTING OPGEBOUWD? TSB blijft informant,
niet beslisser.

- UP — kalender-deload (mesoWeek 4) EN geen opbouw in het blok -> de deload heeft geen functie ->
  doortrainen aanbieden.
- DOWN — opbouwweek (mesoWeek 1..3) EN geen opbouw EN een diepe Form-put -> last stapelt zonder
  winst -> vervroegde deload aanbieden.

VALS-VUREN-TOETS: april droeg TSB-dagwaarden van -16,8 tot -18,7, maar ΔCTL van +6,1 tot +12,0 —
productieve overload. De AND-regel houdt DOWN daar stil. Over de 17 maandagen vuurt DOWN nul keer;
dat is het gewenste gedrag van een vangnet, geen dode code.

## 6. Drempels, geijkt

- `BLOCK_WINDOW_DAYS = 21` — het blok = [weekMaandag-22 .. weekMaandag-1]. Bevat deze week NIET:
  het oordeel staat op maandag vast en schuift niet mee, zodat de kaart niet halverwege de week
  omslaat.
- `NO_BUILD_CTL_DELTA = 1,0` — ΔCTL <= 1,0 over 21 dagen (ongeveer 0,33 CTL per week) telt als geen
  opbouw. GRENSGEVAL, expliciet: 08-06-2026 meet exact +1,00 en valt er dus binnen. Zie de
  gevoeligheidstabel in paragraaf 4 — over het hele plateau 0,0..+2,5 verschuift dat twee gevallen.
- Form-put voor DOWN: `tsbTrend < min(-10, -0,25 × CTL_nu)`. Schaal-relatief, want de TSB-amplitude
  schaalt met de load: de vaste -25 vergt bij CTL 45 een week van circa 860 TSS (273% van normaal) en
  is daar dus onbereikbaar. De vloer -10 sluit aan op de bestaande Oververmoeid-grens in `tsb.ts`,
  zodat kaart en gauge hetzelfde zeggen.
- `UP_TSB_THRESHOLD` en `DOWN_TSB_THRESHOLD` vervallen. Beide zijn in tests gepind; die asserties
  gaan 1-op-1 mee naar het nieuwe signaal, dus geen vloerdaling.

## 7. Data-poort

De huidige poort (>= 21 rijen met `vorm` binnen 42 dagen) borgt CTL-rijpheid, maar niet de twee
ankers die het blok-signaal nodig heeft. Erbij: een rij met numerieke `ctl` binnen +/- 3 dagen van
weekMaandag-1 EN binnen +/- 3 dagen van weekMaandag-22. Ontbreekt er een, dan geen voorstel (stil,
geen kaart). De bestaande rijen-poort blijft staan voor de Form-kant van DOWN.

## 8. Bouwplan (client-only)

- `fatigue.ts`: nieuwe pure `computeBlockCtlDelta(wellness, weekMonday)` -> `{ delta, fromCtl, toCtl }`
  of null, met de +/- 3-dagen-ankertolerantie; de nieuwe consts uit paragraaf 6; `fatigueTrigger`
  krijgt `ctlDelta` en `ctlNow` erbij, de UP-tak leest `tsbTrend` niet meer, de DOWN-tak leest beide.
- `schema.ts`: de trigger-aanroep voedt de nieuwe velden; `FatigueVoorstel` krijgt
  `ctlDelta: number | null` naast `tsbTrend` (die blijft, voor de DOWN-copy).
- `coachNarrative.ts`: `fatigueUpAanbodRegel` noemt het GEMETEN BLOK in plaats van de TSB — de coach
  toont waarop hij zijn voorstel baseert. DOWN-copy houdt de Form-put en krijgt het blok erbij.
- `FatigueCard.tsx`: de zone-pill hangt voor de UP-kaart niet langer aan `tsbZone(tsbTrend)`.
- Tests in `fatigue.test.ts`: de ankertolerantie, het plateau-grensgeval, en twee regressie-fixtures
  op echte data — het juli-blok (-5,0 -> UP vuurt) en het april-blok (+12,0 met diepe TSB -> geen
  enkele tak vuurt).

## 9. Wat NIET verandert

Het mechanisme eromheen blijft ongemoeid: de wat-als-preview via `mesoWeekOverride`, de opt-in
`PUT /api/fatigue-shift` met vervaldatum op de maandag erna (M68), de onderdrukking bij Test,
Recovery en `nearTaper`, de profiel-gate `weekFatigueEnabled`, en de DOWN-onderdrukking van de
inhaal-kaart (M66/M72). Engine, D1-schema en worker worden niet geraakt; geen migratie.

## 10. Eigen post, niet in deze bouw

CTL zakt sinds 22-06 vijf weken op rij (51,8 -> 45,8). Een afbouw-signalering heeft een REFERENT
nodig — wat had de CTL in deze periode moeten doen — en die bestaat in de app niet: AGR ligt 38 weken
weg en de fase-keten zet Build pas half februari. Zonder referent alarmeert zo'n kaart zonder te
weten waartegen, en dat is dezelfde val als de TSB-drempel. Aparte post, gekoppeld aan de
fase-referent.
