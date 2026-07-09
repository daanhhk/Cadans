CADANS — VORMGEVING-MEETLAT · Schema-flow

BEVROREN vormgeving-standaard voor de Schema-tab + instellingen. Meetlat = de LIVE GAS-app
(script.google.com). Styling = de bestaande app-tokens (design/tokens.css). HARDE REGEL: elk
zichtbaar veld komt uit een bron (engine / settings / D1 / intervals) — NOOIT hardcoded; ontbreekt
data -> expliciete lege staat. Afwijkingen die Cadans-data afdwingt staan met ≠ gemarkeerd.

STATUS-LEGENDA: ✓ vermoedelijk al in Cadans · ○ nog te bouwen · ≠ data-gedwongen afwijking ·
⏸ bewust geparkeerd · → recon moet Cadans-nu verifiëren.

--- 1 · APP-HEADER (overlijnend op elk Schema-scherm) ---
- Logo-icoon (oranje bar-chart) links · ○
- Woordmerk = settings.coachNaam, UPPERCASE weergegeven (Daan koos "Stelvio" -> "COACH STELVIO").
  NIET de app-naam; "Cadans" is de app zelf. → recon: exact settings-veld + uppercasing · ○
- "Week 28" = ISO-weeknr (engine/datum) · ○
- Avatar-badge = user-initialen, oranje ring (profiel toont voornaam "Daan"; badge "DK" bevat ook
  achternaam-initiaal -> volledige-initialen-bron te bepalen). → recon: exact veld · ○

--- 2 · PLAN · PERIODISERING-KAART (uitklapbaar) ---
- Overline "PLAN · PERIODISERING" · ✓
- Titel "Basis · geen A-event gepland": fase-naam (engine) + "· geen A-event gepland" AFGELEID van
  event-prioriteit (settings.events; enige event = prioriteit B, geen A). ✓ fase / ○ event-suffix
- Status-pill "Opbouw" (oranje outline) = macro-fase (engine) · ○
- Chevron -> kaart uitklapbaar · ○
- UITGEKLAPT:
  * 4-fasen segmented bar: Basis · Build · Peak · Taper (actief = oranje gevuld + dot) = engine
    periodisering. BEVESTIGD 4 fasen voor Cadans-engine (incl. Taper). · ○
  * Chip "AGR Toerversie · 283d" = EERSTVOLGENDE event + dagen-teller (settings.events; 09-07-2026 ->
    18-04-2027 = 283d). NIET plan-versie. · ○
  * Twee kolommen: "Fase / Basis" (engine) · "Volume / 4–7 u" (engine fase-volume-range; voeding uit
    trainingsprofiel "Gevorderd 7u"). → recon: profiel->uren-mapping · ○

--- 3 · DEZE WEEK · GEPLAND VS GEDAAN ---
- Overline "DEZE WEEK · GEPLAND VS GEDAAN" + refresh-icoon rechts · ✓ (→ recon: ook kalender-icoon? GAS toont enkel refresh)
- 3 metric-kolommen, elk `groot GEDAAN / klein GEPLAND` + label:
  "189 /254 · TSS" · "3:06 /5:45 · UREN" · "2 /4 · DAGEN" = activities-aggregatie / engine weekProposal · ✓
- "Voortgang" + "74% van plan" (rechts) = afgeleid · ✓
- Progress-bar (oranje->rood gradient) = afgeleid · ✓
- "Laatst gesynct · <ts>" = sync_state · ✓
NB DATA (geen vormgeving): 121 vs 254 TSS-verschil tussen omgevingen = gescheiden lokale/prod-D1, GEEN layout-issue.

--- 4 · DAG-STRIP (horizontale scroll) ---
- Per tegel: weekdag + datum ("Wo / 8 jul") + status-glyph: ✓ voltooid (activity aanwezig) ·
  streepje niks · blauwe dot gepland/pending = doneByDate + planner_days · ✓
- Geselecteerde dag = oranje outline + oranje tekst · ✓

--- 5 · DAGKAART (4 states) ---
Overline boven de kaart: volledige dagnaam "Donderdag Do 9 Jul" = datum · ✓

5a · RUSTDAG (train=0):
  - Titel "Rustdag" + subtekst "Geen training gepland vandaag. Herstel is training." = engine/lege-staat-copy · ✓/→
  - GEDEELD KNOPPEN-BLOK (zie 5e)

5b · GEPLAND (toekomst/train): type-pill + workout-naam + duur + proportioneel per-interval silhouet (rects in tijd-volgorde; breedte ∝ minuten, hoogte ∝ hoogtePct-intensiteit, kleur = zone) + inklapbare "Blokstructuur · N blokken" (label · duur · watt; default ingeklapt) = engine voorstel · ✓. Per-zone-TOTAAL-bars horen NIET op §5b — alleen op de done-kaarten §5c/§5d.

5c · VOLTOOID — VOLLE VERGELIJKING (in Cadans: voltooid-VANDAAG):
  - Header-rij: overline "WO 8 JUL · VOLTOOID" (links) + align-chip "● Anders getraind" (rechts) =
    coachFeedback_ align-state (on-plan/deviated/different/missed -> op-plan/afgeweken/anders/gemist).
    Chip op de overline-rij (P4 gebouwd) · ✓ visueel verifiëren
  - Type-pill (gedaan-type) + Titel "Drempel-rit · 1u01" (P2: gedaan-type+duur bij "anders") · ✓ verifiëren
  - Vergelijkingstabel kolommen GEPLAND | GEDAAN: Type · Duur · IF · TSS (gedaan-kolom accent) =
    engine plan | activity · ✓
  - "ZONE-VERGELIJKING · MIN" + legenda (gepland/gedaan)
  - Compare-bars per zone: gepland-balk (donker/onder) + gedaan-balk (kleur/boven) + gedane min (groot)
    + "gepland X'" / "niet gepland" = engine plan-zones | activity zone_times · ✓
    ≠ CRUCIAAL: GAS-vergelijking toont 5 zones (Z1-Z5); GAS-ritdetails toont 7 (Z1-Z7); eerdere
    Cadans-recon noemde "3-vs-5". → recon MOET vastleggen hoeveel zones Cadans-data levert +
    of het aantal een gedwongen afwijking is.
  - Coach-impact-box (zie 6)
  - GEDEELD KNOPPEN-BLOK (zie 5e), met extra "Bekijk ritdetails ›" -> 8

5d · VOLTOOID — VERLEDEN (gereduceerd) ⏸: type + zones zonder volle vergelijking. BEWUST GEPARKEERD
  (engine leest ambient new Date() -> regeneratie flipt het plan -> productbeslissing: vooruitkijken).
  Wijkt bewust af van GAS tot aanpak B (plan PERSISTEREN) ooit gewenst; NOOIT aanpak C (engine-asOf).

5e · GEDEELD KNOPPEN-BLOK (onder rustdag- én voltooid-kaart):
  "Andere training kiezen" · "Beschikbaarheid aanpassen" · "Push naar Garmin".
  "Beschikbaarheid aanpassen" bestaat nu achter het kalender-icoon -> ALS expliciete knop gewenst
  (duidelijker in beeld); kalender-ingang mag blijven. → recon: bestaan "Andere training kiezen" +
  "Push naar Garmin" al? · ○

--- 6 · COACH-IMPACT-BOX (= fase 2c) ---
Oranje-outline box: icoon + kop "<COACH> · IMPACT" (coach-naam uit settings) + proza = engine
coachFeedback_ (NOOIT hardcoded). · ○

--- 7 · BESCHIKBAARHEID-POPUP (bottom-sheet) ---
- Titel "Beschikbaarheid" + 3 tabs: "Alleen deze dag" · "Deze week" · "Volgende week"
- Per dag: "Train?" toggle -> indien aan: minuten-slider + "X min"; "Pendel?" toggle (soms "+")
  = planner_days (train/minuten/pendel) · ○/→ (recon: bestaat deze editor al?)
- "Opslaan" (oranje gradient) + "Annuleren"

--- 8 · RITDETAILS-DRILL-DOWN (= fase 2d) ---
Vanuit "Bekijk ritdetails ›".
- Header: type-pill + "<dag datum · tijd>" + X-sluit = activity
- Groot "<km> | <duur>"
- Zone-verdeling-balk Z1-Z7 met % = activity (7 zones)
- Metric-tegels: NP · IF · TSS / GEM. VERMOGEN · W/KG / GEM. HR (+max) · HOOGTEWINST / CADANS · ARBEID = activity
- "INTERVALLEN" + "FTP <W>" + blok-lijst (naam · zone-pill · duur · bpm · %FTP · watt) = intervals-data
- "Vermogenscurve · binnenkort" (placeholder)

--- 9 · BOTTOM-NAV (STICKY) ---
Schema (actief) · Vorm · Trainingen · Niveau. VAST onderaan het scherm (position sticky/fixed):
altijd zichtbaar terwijl de content erboven scrollt (nu scrollt de nav mee weg = ongewenst).
Content krijgt bodem-padding zodat de laatste kaart-inhoud niet achter de nav valt. PWA: respecteer
de safe-area-inset onderaan (thuisbalk telefoon). · ○ (layout — perfect via preview-loop te checken)

--- 10 · INSTELLINGEN-SCHERM (bottom-sheet) — bron-laag + events-editor ---
Dit scherm VOEDT de andere schermen. Titel "Instellingen" + X. Secties (overlines):
- JOUW COACH: coach-naam-veld + preset-chips (Coach · Daan · Merckx · Sven · Anna) -> settings.coachNaam
- PROFIEL: naam · FTP (W) · gewicht (kg) · W/kg (afgeleid) · "FTP automatisch bijwerken"-toggle -> settings/profiel
- TRAININGSPROFIEL: volume-profiel dropdown ("Gevorderd 7u") -> settings; voedt "Volume 4–7 u" (§2)
- DOEL & BLOK: 5-knops grid (FTP/drempel · Duurvermogen · Klimmen · VO2max · Onderhoud) + startdatum-picker
  + duur (wkn) -> settings.doel (voedt Niveau-tab) + periodisering-start
- KOPPELINGEN: intervals.icu-status · Athlete-ID · API-key (masked) · Garmin-sync-tijd -> settings
- MELDINGEN: zondag-herinnering-toggle -> settings
- EVENTS (= geparkeerde events-editor): per event naam-veld + X · prioriteit-badge (A/B/C) +
  datum-picker · "Details" uitklap: Type segmented (Trip|Race) · Klim-type dropdown · Afstand (km) ·
  Hoogtemeters (hm) · Notitie · "+ Event toevoegen" (dashed) -> settings.events
- "Opslaan" (oranje gradient)

--- RECON-CHECKLIST (verse chat, Cadans-nu tegen elke regel meten) ---
1 coach-naam-bron (veld + uppercasing) · 2 volledige-initialen-bron · 3 volume-profiel->uren-mapping ·
4 4-fasenbalk in engine (incl. Taper) · 5 week-header: refresh vs +kalender · 6 ZONE-AANTAL vergelijking
(5 vs 7 vs 3) — hard vastleggen + gedwongen? · 7 event-chip mapping + "geen A-event"-afleiding ·
8 rustdag-knoppen bestaan? · 9 beschikbaarheid-editor bestaat? · 10 bottom-nav sticky? + safe-area ·
11 coach-impact-box (coachFeedback_) · 12 ritdetails-drill-down bestaat? · 13 instellingen+events-editor bestaan?

--- SCOPE / FASERING ---
Deze meetlat legt het COMPLETE eindbeeld vast; de BOUW blijft gefaseerd. Volgorde: (a) vormgeving-
delta-recon (Cadans-nu vs deze spec) -> (b) bouw de delta naar de spec, Schema-flow EERST (dagkaart-
states + sticky nav + coach-impact 2c), geverifieerd via de preview-loop (dev-only fixtures, geen deploy
per stap) -> (c) ritdetails 2d -> (d) instellingen/events-editor. Compleet vastleggen ≠ alles tegelijk bouwen.
