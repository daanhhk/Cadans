# R4 — CUTOVER-VERDICT

Status: **VERDICTS.** Sluitstuk van R0 → R1 → R2 → R3 → **R4**. Per vondst uit R1+R2+R3:
cutover-blokkerend ja/nee, getoetst aan het MODEL (`docs/TRAININGSMODEL.md`) — niet aan
GAS-parity op zich. Docs-only; engine/vloeren ongemoeid.

Bronnen (gepind): R1 `docs/R1-PORT-CORRECTHEID.md` @`4b6a877` · R2 `docs/R2-ENGINE-END-AUDIT.md`
@`ecd9530` · R3 `docs/R3-TRAININGSREVIEW.md` @`2e4c4a8` · MODEL @`fc76af2`. Drempel + groepering:
Daan-akkoord (deze review-chat).

## §0 — Het criterium

Drie ONAFHANKELIJKE assen per vondst; geen enkele ja/nee.
1. **HERKOMST** — geërfd / geïntroduceerd / ontbrekend (de regressie-as).
2. **BLOKKEREND** — ja/nee (de cutover-poort).
3. **URGENTIE** — hoog/midden/laag, LOS van de cutover.

**Drempel.** Een vondst is BLOKKEREND ⟺ (a) bereikbaar in de draaiende app onder de HUIDIGE
cutover-config (single-user, doel FTP→onderhoud, A-event AGR actief, prod-data gevuld), én (b) een
echte regressie — GAS deed iets voor de gebruiker dat Cadans slechter of niet doet (niet geërfd,
óf geërfd-maar-Cadans-laat-'t-gevoeliger-vuren), én (c) de verslechtering schaadt de training,
levert een verkeerde workout op het apparaat, óf laat de app een materieel onware claim doen (M5).

Gevolgen: GEËRFD defect → geen regressie → NIET blokkerend (de modelschending zat al in GAS; de
cutover maakt 'm niet slechter, alleen fixbaar — dit is de cutover-regel). Geïntroduceerd/ontbrekend
maar NEUTRAAL of BETER → geen blokkerende regressie. Geïntroduceerd/ontbrekend, slechter, maar
ONBEREIKBAAR voor de huidige config → LANDMIJN of MULTI-USER-voorwaarde, niet de cutover.

Náást de ja/nee-as: **LANDMIJN** (inert vandaag, vuurt FOUT zodra feature X gebouwd wordt —
blokkeert de bouw, niet de cutover) en **MIGRATIE-VOORWAARDE** (dataverlies bij cutover — blokkeert
wél; de fix is een migratie-stap, geen code). Bereikbaarheid getoetst tegen Daans single-user-cutover;
verse-user-lekken → apart als M57/M58-voorwaarde.

## §1 — Draai-het (herverificatie tegen de bevroren GAS-bron)

Vijf checks; twee verschoven het beeld.

1. **Onderhoud-pin vs event-fase — GECHECKT (GAS `Algorithm.gs:71`+`:137`).**
   `effectiveMacroFase_(fase, settings) = settings.doel === 'Onderhoud' ? 'Base' : fase`, gevoed met
   `macro.macroFase` (de event-fase). De pin OVERSCHRIJFT dus de event-fase. Gevolg: (a) met doel FTP
   + AGR actief is het plan event-gedreven → de eeuwige-test-week (T12) en de doel-cyclus-defecten
   vuren NIET voor Daan; (b) op Onderhoud pint de app Base ongeacht het event → de Onderhoud-soft
   (E) vuurt, én overschrijft de race-piek/taper als Daan in Onderhoud blijft richting de AGR.
2. **T22-demote — GECHECKT (GAS `Algorithm.gs:1155-1170`, `:91-92`).** De week-demote is OPGELEGD,
   niet aangeboden: hij herschrijft `d.voorgesteldType` direct, alleen een `reden` achteraf.
   Byte-identiek in Cadans → de automatiek is GEËRFD, en in de praktijk bereikt (vuurt op echt lage
   HRV/slaap). GAS voedt het BOTTE signaal (`getWellnessSignal` = HRV/slaap-drempel + RPE). Cadans
   routeert door `getReadinessScore_` (readiness-band + ochtend-check-in, op de M18-gedegradeerde
   score) = INTRODUCEERD, gevoeliger. NB: BESLUITEN' "auto-demote (GAS bood aan)" sloeg op de APARTE
   today-overlay (T24), die GAS wél aanbood; de WEEK-demote legde GAS óók op.
3. **Pendel — GECHECKT (GAS `Algorithm.gs:191-193`, `genericPendel`-split).** Een pendeldag =
   `pendelAantal` sessies × `pendelDuurMin`, en elke sessie splitst intern in heen (mins/2) + terug.
   Cadans' veld "enkele reis" verdubbelt de invoer (×2) én `pendelAantal` vermenigvuldigt dáár
   overheen. Voor 75+75 = 150: 75/1 → 150 (correct totaal, één gecombineerde rit); 75/2 → 300 (dubbel).
   Het gewenste heen-Z2/terug-best zit in de asymmetrische expansie, maar vereist aantal=2 = precies
   wat verdubbelt. Fix = dubbeltelling weg.
4. **loadCarry ×1 — BESLUITEN (Daan 17-07).** Menu-item niet bijgehouden → DocProp default 1 →
   GAS-ramp in de praktijk vlak. Geen praktisch verlies.
5. **Test-week vs event — volgt uit check 1.** Met AGR actief (doel≠Onderhoud) is de fase
   event-gedreven → `computeMacroPhase` (en de test-week) omzeild. Niet bereikbaar voor Daan.

## §2 — Synthese (de beslis-lijst)

**BLOKKEERT DE OVERSTAP:**
- **Push naar de fietscomputer (FASE C).** ONTBREKEND; zonder dit geen levering (M56). Oude app pusht
  door tot de switch → bouw als eigen fase ervoor.
- **Migratie van de gepland-vs-gedaan-historie.** De weekplan-snapshots leven in DocProps, buiten
  "Sheet→D1"; het gat groeit zolang GAS uit staat. Exporteren vóór de switch (+ preset-vocab, DocProp
  mesoWeek/loadCarry).
- **De twee-richtingen-coach + plan-van-record.** Daan-eis: verzwakking én inhalen via voorstel.
  Bouwt op dezelfde plan-van-record als de migratie → ÉÉN pakket vóór de switch. (Interim, indien de
  flow later komt: de gevoelige band-aansturing terugdraaien naar het botte signaal = parity.)

**URGENT, GEEN BLOKKADE (trainings-defecten, geërfd):**
- **Onderhoud traint te zacht (E):** 36' hard bij 3 én 15u, en de pin overschrijft de race-piek. Weg
  vóór de winter. De belangrijkste.
- **Korte-dag-val (T17):** 35-51' → maximale intervallen, ongeacht doel.
- **Coach-copy overreach (T25):** "sterker straks" (M5) + geen hedge; vervalt met de coach-flow, quick
  fix intussen.
- **Pendel-dubbeltelling (C1):** raakt je echte pendeldagen; 75/rit × 2 ritten moet 2×75 = 150 worden
  (heen Z2 / terug best), niet 300.

**LANDMIJNEN (blokkeren een latere bouw):** de snapshot-laag activeert bij bouw de zones/intent-
misteling, de verleden-reconstructie met de FTP-van-nu (V24) en de recency-seed heeft een 2e ingreep
nodig (V15) — samen bouwen; carry-forward moet 7 rijen leveren (V14); event-veld `hm` vs
`hoogtemeters` (V8); fase 6 `EEE`/`d-M` (V16).

**RAAKT JOU NIET (multi-user-voorwaarde):** verse-user-lek 0-0W (C0/A1/T29 — je rij is gevuld);
test-week + klim-route (T11/T12/T13 — je bent event-gedreven of op Onderhoud). Reële defecten voor een
tweede gebruiker.

## §3 — Cluster-verdicts

**A · Snapshot-laag / plan-van-record (V7).** Draagt R1-B0-i/ii/iii, A2, B2, B7, B8-a/b/c/d, C9,
plannedForDone; R2-V9(onbereikbaar op verstreken dagen), V10, V11, V15, V24, dekking-verrijkings-loop,
zones/intent-landmijn; R3-T23. Herkomst: bewuste fork ("regenereer i.p.v. persisteer"); gevolgen
geïntroduceerd maar grotendeels INERT (signalen vuren niet, niet fout — Cadans' inertheid op de
auto-signalen is neutraal/mild beter voor agency). Verdict: de BOUW van de schrijver is post-cutover;
de MIGRATIE van de snapshots is **BLOKKEREND** (dataverlies, gat groeit). V10 (weekbalans tot 602% van
plan) + V11 (dubbele coach-stem op done-vandaag + "Rustdag" op een gemiste dag) = onware-claim
vormgeving-drift: niet hard-blokkerend (plan klopt), HOOG-urgent, lossen op mét de bouw.
plannedForDone/verleden-vergelijking-reductie = productkeuze, laag. Landmijnen bij de bouw:
zones/intent-misteling, V24 (reconstructie met FTP-van-nu), V15 (recency = 2e ingreep, reader-param
door `assignWorkouts`) — samen bouwen of de helft blijft dood.

**B · Weekplanner-vangnet / carry-forward (V3, V14-slot).** Herkomst: V3 ONTBREKEND (lege week = 0
dagen). Verdict: niet-blokkerend — jouw planner-dagen zijn gevuld en de invoer-UI bestaat. Daan-besluit
staat: carry-forward-fork (GAS niet herstellen). V14 (slot = array-positie i.p.v. weekdag) = LANDMIJN:
de carry-forward moet 7 rijen leveren, niet alleen train-dagen. Urgentie midden.

**C · Doel-lijst & meetlat (T1, T2, T3, T4).** Herkomst GEËRFD. Verdict: niet-blokkerend,
product-richting (groep 3): de vijf échte doelen (VO2max = middel, klimmen lang/kort splitsen) + een
echte duurvermogen-maat ("Conditie" belooft nu iets zonder maat — M39). Bereikbaar voor jou pas op
Onderhoud (T2: gemeten tegen een lange-rit-doel dat 't nooit plant); geërfd → geen regressie.

**D · keyIntensity-dode-tak (T11, T12, T13).** Herkomst GEËRFD. Verdict: niet-blokkerend, NIET
bereikbaar voor jou → groep 5. keyIntensity vuurt alleen in een test-week; jij bent event-gedreven of
op Onderhoud. T13 (lang/kort klimmen heeft geen route) vereist doel=Beklimmingen. Reële defecten voor
een user zónder A-event.

**E · Onderhoud (T8, T9, T10, T19).** Herkomst GEËRFD. Verdict: niet-blokkerend, HOOG-urgent (groep 2)
— de belangrijkste trainings-fix. 36' hard bij elk urenbudget (T10); de 45'-cap begrenst de prikkel
niet de sessie (T8); een extra uur koopt geen prikkel (T19); de fase-pin (T9) = M49-loodgietersfix. En
de kop-check: de pin OVERSCHRIJFT je race-piek/taper als je in Onderhoud blijft richting de AGR. Weg
vóór de winter.

**F · Agency / coach-flow (T14, T22, T23, T24, T27).** Herkomst: opleg-mechanismen GEËRFD;
T22-band-aansturing INTRODUCEERD. Verdict: de M10-schending (automatisch, geen voorstel) is geërfd →
niet zelf blokkerend. Daan-eis: de twee-richtingen-voorstel-coach (§2, het pre-switch-pakket).
T22-automatiek geërfd (interim: band-aansturing → botte signaal = parity); T23 (inhalen, gebouwd maar
uit) = de OMHOOG-richting: aansluiten + door het voorstel-schermpje, hangt aan dezelfde plan-van-record;
T24 (readiness-overlay inert + "ik heb verlicht"-copy) = M55, die copy niet hergebruiken; T14
(event-overname stil) = geërfde agency-defect, de wissel hoort óók een voorstel te worden (M51, mee in
de flow); T27 = vervalt met de test-week-fix (zie D).

**G · Type-filter-de-facto-regel (V4, V22, C7, V17-dashActuals, V10-neven).** Herkomst INTRODUCEERD
(CYCLING_TYPES-filter weg, dag gesommeerd). Verdict: niet-blokkerend. V22 (hardlopen telt mee in de
week-belasting) = onware-claim vormgeving-drift, goedkope fix (fiets-filter op weekTss), midden — raakt
jou als je runs logt. C7-b (som de dag) = BEHOUDEN, is beter (een pendeldag ís twee ritten).
V4-reconcile-helft (auto-vinkje) valt onder de plan-van-record-bouw (het gedaan-veld).

**H · Meso-teller (V2, V14-neven).** Herkomst: teller-divergentie, karakter-drift GEËRFD. Verdict:
niet-blokkerend — GAS' ramp was in de praktijk vlak (check 4), netto TSS-effect ~+1 (T21). Migratie-note:
DocProp mesoWeek bewust mee of niet. Karakter-drift (mesoFactor schaalt vermogens-% → sweet-spot wordt
drempel bij 1,08) = model-vraag, laag.

**I · Settings-defaults / pendel (C0, A1, C1).** C0/A1 (verse-user-lek: ftp/lthr/doel/gewicht leeg →
0-0W, niveau-punten weg): INTRODUCEERD, NIET bereikbaar voor jou (rij gevuld) → multi-user-voorwaarde
(groep 5). C1 (pendel-dubbeltelling): nu bereikbaar → groep 2. Fix: dubbeltelling weg zodat "75 per rit
× 2 ritten" = 2×75 = 150 wordt (heen Z2 / terug best) i.p.v. 300. Model-vraag (één helder veld) blijft;
de oude app is hier zelf inconsistent, geen schoon antwoord om te kopiëren.

**J · Dosering-model-gaps (T15, T16, T17, T18, T20, T21).** Herkomst GEËRFD. Verdict: niet-blokkerend.
T17 (korte-dag-val: 35-51' → geforceerd vo2max, de slechtst herhaalbare dosis) = HOOG-urgent (groep 2),
raakt de tijdgebonden renner. T15/T16/T18/T20/T21 = model-richting (groep 3).

**K · Capaciteit-grens (T5, T28, T29).** Herkomst GEËRFD. Verdict: niet-blokkerend. T29's 0-0W = niet
bereikbaar voor jou (= C0, groep 5). T28 (geen gedeclareerd capaciteit-veld → data vult de gaten, de
uren-schuif op gereden volume = M27 plateau-inbak) + T5 (het "verhoog het volume"-oordeel op afgeleide
uren, M41/M8(a)) = product-richting (het capaciteit-veld, M32; groep 3).

**L · Coach-stem + event-tailoring (T25, T26, T30, V8, V9, V21).** T25 (dag-coach hedge't nooit +
"sterker straks" = M5): INTRODUCEERD, HOOG-urgent (groep 2) — goedkope copy-fix, vervalt met de
coach-flow. T26 (geen strategie-niveau) = GEËRFD, groep 3. T30 (RPE bedraad-om-te-sturen maar
uitgehongerd door A; dispositie gevangen-niet-bedraad + geen benen-optie) = mee in F/A: RPE als
INFORMANT (M30/M15/M18) niet als stille beslisser, en de benen-optie toevoegen aan de dispositie-set.
V8 (event-tailoring: klim-sim-blok ontbreekt) = INTRODUCEERD, MODEL-relevant (M38/M56), bereikbaar voor
jou (AGR) — goedkope adapter, LANDMIJN `hm` vs `hoogtemeters`; groep 3. V9 (coach-ctx = alleen {fase})
= voor jouw RACE-event kost het exact de event-NAAM ("je doel" i.p.v. "Amstel Gold Race"); triviaal,
mee in de coach-polish. V21 (coachPlannedArg_ FIX-4-seam op null) = model-vraag (etiket of blokken; GAS'
eigen fix is defect); mee in de coach-werk.

## §4 — Singleton-verdicts

- **V1** (Volume-stat constant i.p.v. fase-band; `voortgangPct` afwezig) — GAS-norm drift,
  niet-blokkerend, midden. De "4-7u→7u"-correctie was fout (4-7 = de Base-band). Opruim.
- **V5** (`syncAthleteZones` niet geport: FTP/LTHR/HR nooit auto uit intervals gecast; GAS spreekt
  zichzelf tegen) — infra; niet-blokkerend (je zet ze handmatig). FTP-autocast-keuze + migratie-note.
  Groep 3.
- **V6** (acht/negen dode D1-kolommen) — inventaris + migratie-note. Niet-blokkerend.
- **V12** (de "Waarom deze training?"-onthulling ontbreekt — de enige plek waar zone-debt + meso-factor
  zichtbaar waren) — GAS-norm drift, niet-blokkerend, midden; koppelt B4+V2.
- **V13** (goal-CTL: wellness- vs activiteiten-metriek) — model-vraag, niet-blokkerend.
- **V16** (`formatDate` faalt stil op `EEE`/`d-M`) — LANDMIJN fase 6 (groep 4).
- **V17** (vier nul-aanroeper-fns) — drie verklaard, één = V18. n.v.t.
- **V18** (`wkgSince`-label claimt progressie waar GAS zwijgt) — INTRODUCEERD onware-claim, bereikbaar
  na de backfill; niet hard-blokkerend, midden (goedkope fix: gate op het anker zoals GAS).
- **V19** (`getReadinessScore_` — geen gat) · **V20** (`getWellness` 30→60, infra-parity-drift, klein) ·
  **V23** (`tsbZone` identiek, alleen de comment liegt — corrigeren bij de bouw) — niet-blokkerend / n.v.t.
- **G1/G2** (gereedschap: app-bereik-kolom + corpus-grens) — n.v.t.; hints, geen bewijs.
- **R1-C2/C3/C4/C5/C6/C8/C10/C11, B1/B3/B5/B6** — verklaard/parity/dicht/onbereikbaar → n.v.t. (geen
  regressie).

## §5 — Volledigheids-index (elke vondst geadresseerd)

- **BLOKKEREND:** FASE-C-push · migratie-snapshots (V7-cluster A) · de twee-richtingen-coach +
  plan-van-record (A/F, Daan-eis, pre-switch-pakket).
- **URGENT, niet-blokkerend (groep 2):** E (T8/T9/T10/T19) · T17 · T25 · C1.
- **Landmijn (groep 4):** V7-bouw (zones/intent, V24, V15) · V14 · V8-`hm` · V16.
- **Multi-user, niet bereikbaar (groep 5):** C0 · A1 · T29 · D (T11/T12/T13).
- **Product-richting (groep 3):** C (T1-T4) · T5/T28 (capaciteit) · J-rest · T26 · T30 · V1 · V5 · V6 ·
  V12 · V13 · V9 · V21 · H (karakter-drift).
- **n.v.t. (verklaard/parity/dicht/geen gat):** G1 · G2 · V17 · V19 · V20 · V23 · R1-B1/B3/B5/B6 ·
  R1-C2/C3/C4/C5/C6/C8/C10/C11 · R1-B6/B7 (erven A) · C7-b (behouden, beter).
- **Ingetrokken/ongebruikt:** R3-T6 (ongebruikt) · R3-T7 (ingetrokken door T10, staat).

## §6 — Bouw-volgorde (Daan-akkoord)

**VÓÓR de cutover — één pakket:** (1) plan-van-record (weekplans-schrijver + `gedaan` +
`voorgesteldType`) MÉT de drie landmijnen (zones/intent, V24, V15-recency-2e-ingreep + reader-param
door `assignWorkouts`); (2) de twee-richtingen-coach op die basis — verzwakking-voorstel én
inhaal-voorstel, beide via jouw akkoord, standaard origineel behouden, coach zegt waarom; (3)
migratie-export van de DocProp-snapshots + preset-vocab + mesoWeek/loadCarry; (4) FASE-C-push. Interim:
band-aansturing → botte signaal.

**NÁ de cutover, op urgentie:** Onderhoud-fix (E, vóór de winter) → korte-dag-val (T17) →
pendel-dubbeltelling (C1, of eerder) → coach-copy (T25) → product-richting (vijf doelen,
duurvermogen-maat, capaciteit-veld, event-tailoring, RPE-als-informant + dispositie-benen-optie).

**Niet voor de cutover, niet urgent:** multi-user-voorwaarden (C0/A1), dode kolommen (V6),
infra-parity-drifts (V20).

Elke fix is een eigen bouw-chat, na R4. Geen engine-wijziging zonder aparte autorisatie.
