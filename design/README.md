# Handoff: Cadans — wieler-coach-app

> **Dit is het complete pakket.** Alle bron-prototypes, design-docs, tokens en merk-assets
> zitten hierin. Geef deze map (of de zip) + dit README aan Claude (chat); dan kan die de
> juiste, precieze prompt voor **Claude Code** schrijven om Cadans in jullie echte codebase
> te bouwen.

---

## Over de design-bestanden
De bestanden in `src/` zijn **design-referenties, gemaakt in HTML** (React + Babel inline JSX,
één `tokens.css`). Het zijn prototypes die het beoogde uiterlijk en gedrag tonen — **geen
productiecode om 1:1 te kopiëren.** De opdracht voor de developer is: **deze designs natrekken
in de bestaande omgeving van de doel-codebase** (React/Vue/SwiftUI/native — wat jullie ook
gebruiken), met de eigen patronen en componenten. Bestaat er nog geen omgeving, kies dan het
meest geschikte framework en bouw de designs daar.

**Fidelity: high-fidelity.** Kleuren, typografie, spacing en interacties zijn definitief.
`src/tokens.css` is de single source of truth — hardcode nooit een waarde die ook een token heeft.

---

## Wat is Cadans
Donkere, **mobiel-only** (390×844, geen content-frame/max-width) wieler-coach-web-app.
Eén coach-stem door de hele app. Hoofd-event van de gebruiker: **Girona** — lange klimmen,
~90 km / 1200 hm per dag → **duurvermogen/durability**, geen piek-sprint.

**Globale chrome:** app-header (Cadans-merkteken + de door de gebruiker gekozen coach-naam +
ISO-weeknr + avatar) en een vaste bottom-nav met vier tabs:

| Tab | Bezit | Kern |
| --- | --- | --- |
| **Schema** | plan/periodisering, deze week, per-dag workouts, coach-feedback | "wat moet ik doen" |
| **Vorm** | readiness, frisheid/vermoeidheid (TSB), ochtend-check-in | "hoe ben ik nú" |
| **Trainingen** | workout-bibliotheek | "verken/kies een sessie" |
| **Niveau** | langetermijn vermogen & ontwikkeling | "hoe sterk + waarheen" |

De volledige tab-voor-tab opbouw (componenten, states, welke tokens waar) staat in
`docs/FTP-Coach-export.md`. Het interactie-gedrag (READ/WRITE · 💻client/🌐server) staat in
`docs/INTERACTIONS.md`. De visuele beslissingen + tokengebruik staan in `docs/DESIGN.md`.

---

## Merk & identiteit (nieuw — doorvoeren)
- **Naam: Cadans** (trapfrequentie/ritme). Vervang overal "FTP Coach" door "Cadans" in titels,
  footers en `<title>`. De hosts in `src/` heten nog "FTP Coach - …html" als bestandsnaam — de
  inhoud is al Cadans; hernoem desgewenst bij integratie.
- **Merkteken:** drie stijgende schuine balken (gradient `--accent` → `--accent-strong`,
  `skewX(-12deg)`). Component `CadansMark({size})` staat in `src/app.jsx`. Zie ook `src/Cadans - merk.html`.
- **Favicon/app-icoon:** `src/favicon.svg` + `src/icons/cadans-icon-{512,180,32}.png`. Link in elke head:
  ```html
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <link rel="apple-touch-icon" href="icons/cadans-icon-180.png" />
  ```
- **Instelbare coach-naam:** de app-header toont het merkteken + de naam die de gebruiker z'n
  coach geeft (default "Coach"), in uppercase. Instelbaar via **Instellingen → "Jouw coach"**
  (tekstveld + suggestie-chips). Bewaard in `localStorage` (`cadans-coachnaam`). Cadans blijft de
  naam van de app zélf. Al geïmplementeerd in `src/app.jsx` + `src/settings.jsx`.

---

## Schermen / componenten (per tab)
Voor exacte layout, maten en tokens per component: `docs/FTP-Coach-export.md`. Kort overzicht:

- **Schema** — periodisering-tijdlijn + weeklast → dag-strip → dag-detail. Dag-detail kent
  states: *voorstel/vandaag*, *voltooid* (met de gepland-vs-gedaan `ZoneCompare` + coach-feedback),
  *rustdag*. **Nieuw:** `CoachReadinessBanner` bovenaan 'vandaag' (zie verbeterpunt 1).
- **Vorm** — gereedheidsring + conditie-balans (TSB) + ochtend-check-in. Bevat nu nog de
  niveau-grafiek + `LevelCard` (zie Variant A/B en verbeterpunt 2).
- **Trainingen** — categorie-overzicht → varianten → workout-detail (`src/trainingen.jsx`, `src/workout.jsx`).
- **Niveau** — vier elementen (`src/niveau.jsx`):
  1. **Vermogen-snapshot** [v1] — FTP-kopgetal, **W/kg benadrukt**, gewicht, tier (Beginner→Elite).
  2. **Progressie over tijd** [v1] — metric-switch (Niveau · W/kg · Fitheid) + venster (1M/6M/12M/Alles);
     de CTL/fitheid-lijn (weggehaald bij Vorm) landt hier; periode-delta.
  3. **Rijdersprofiel** [Fase 2] — power-duration-curve + sprinter↔diesel-typeschaal.
  4. **Doel-gereedheid + projectie** [Fase 2] — doel-gap vs Girona + what-if uren-slider die een
     **solide, uit-volume-berekende** fitheid-ramp aandrijft, visueel onderscheiden van een
     **gestreepte "schatting"-FTP-band** (eerlijkheid = ontwerp-eis; geen vals-precies enkelgetal).

---

## Data die we hebben (houd viz gegrond)
- **Live:** FTP, W/kg, gewicht, tier, niveau-reeks, readiness/TSB, plan/workouts.
- **Afleidbaar** uit 730d FTP/TSS/gewicht-historie: W/kg-reeks, CTL/fitheid-reeks.
- **Nieuwe fetch:** power curve = intervals.icu mean-max-power.
- **Math:** projectie = uren × intensiteit → CTL-plateau, plus een eerlijke FTP-band.
- **Vereist een definitie:** doel-gap vergt een Girona-target (W/kg + duurvermogen-drempel).

---

## Beslissingen die vaststaan
1. **W/kg is de leidende niveau-maat — "28/50" is losgelaten (✅ doorgevoerd in de mockups).**
   De abstracte score zegt een fietser niets; **W/kg + tier** is nu de enige niveau-taal,
   consistent over Vorm én Niveau. Concreet: `LevelCard` (app.jsx) leidt met "3,8 W/kg" + FTP
   secundair + tier-voortgang ("nog 0,3 tot Zeer goed"); Variant B's grafiek is "W/kg over tijd"
   (`NiveauChart` plot nu W/kg); `VormLevelSummary` toont "3,8 W/kg · Gevorderd · 275 W"; de
   Niveau-progressie-switch is "W/kg · Fitheid" (niveau-optie verwijderd). Voor de developer: hou
   deze taal vast en voer geen "x/50"-score opnieuw in.
2. **Eerlijkheid in de projectie:** solide (volume-gefundeerd) altijd visueel gescheiden van
   speculatief (FTP/W-kg-band, gelabeld "schatting", aannames zichtbaar).
3. **De zone-gestripte interval-blokkenlijst (rit-detail)** + de **vermogenscurve-placeholder**
   blijven zoals ze zijn.
4. **Rit-detail metric-set** (al doorgevoerd): gem. vermogen · W/kg · gem. HR (max als sub) ·
   hoogtewinst · cadans · arbeid (kJ). Geen VI, geen losse max-HR-tegel, geen calorieën.

---

## Verbeterpunten (coaching-lens)
**1 — Brug Vorm → Schema (FLAGSHIP, al in het ontwerp).** De coach reconcilieert de
ochtend-gereedheid met het plan: lage gereedheid (54) → zware VO2max verschuift naar donderdag,
vandaag rustige Z2, met een coach-regel die het uitlegt (`CoachReadinessBanner` in `src/schema.jsx`).
**Te bouwen in de repo:** vervang de mock-`day.coach` door echte koppeling — de Vorm-readiness/check-in
moet het dag-voorstel daadwerkelijk sturen.

**2 — Niveau-getal → W/kg (✅ doorgevoerd in de mockups).** "28/50" is overal vervangen door
W/kg + tier: `LevelCard` (`src/app.jsx`), Variant B-grafiek (`src/chart.jsx` `NiveauChart` plot
nu W/kg), `VormLevelSummary` + de Niveau-progressie-switch (`src/niveau.jsx`). In de repo: zorg dat
W/kg de hero/tendens blijft en de tier de context; FTP + gewicht ondersteunend. Geen "x/50" terug.

**3 — Echte lege/laad-staten op de Niveau-tab (BUG, hoge prio).** In `?s=leeg`/`?s=laden` blijven
`Rijdersprofiel` en `DoelProjectie` volledig gevuld (tonen "✓ op koers" + complete curve voor een
gebruiker zonder data — misleidend). Geef beide een echte lege-/laad-staat, of markeer de inhoud
zichtbaar als voorbeeld ("voorbeeld — jouw curve verschijnt na ~4 weken"). Volg de
`--skeleton-*`/`EmptyState`-conventie die snapshot + progressie al gebruiken.

**4 — Trainingen-positionering (richting, niet per se v1).** Positioneer de bibliotheek meer als
*verkennen/begrijpen* dan als menukaart, of vouw 'm onder de "Doe iets anders"-override-flow, zodat
"vertrouw het plan" sterker is dan "ik kies zelf wel".

**Klein:** "Waarom deze training" deels altijd zichtbaar; dagelijkse Girona-doeldraad op Schema
("nog X wkn · duurvermogen is je laatste stap"); coach-stem in de eerste-run (doel + beschikbaarheid → eerste plan).

---

## Vorm-overlap (te beslissen door product)
- **Variant A** — diepe progressie verhuist naar Niveau; Vorm houdt een compacte `VormLevelSummary`
  + "Progressie →".
- **Variant B** — Vorm ongewijzigd; Niveau draagt de diepe view zelfstandig.
Beide staan in `src/FTP Coach - Vorm-varianten.html`. **Advies:** Variant A — voorkomt duplicatie.

---

## Uitrol-advies Niveau-tab
**Splits het.** v1 = **Vermogen-snapshot + Progressie over tijd** nu (gegrond in live/afleidbare data).
**Rijdersprofiel + Doel-gereedheid/projectie** achterhouden tot (a) de power-curve-fetch live is,
(b) de projectie-math gevalideerd is, en (c) verbeterpunt 3 (echte lege-staten) opgelost is. Label
ze tot dan "binnenkort".

---

## Design tokens
Volledige set in `src/tokens.css` (Engelse token-namen). Rollen: **accent** (oranje→rood, spaarzaam),
**status** (`--success/warning/danger/info`), **zones** (`--zone-1..6`). Aparte component-lagen voor
o.a. coach-feedback (`--coach-*`), readiness (`--readiness-*`), zone-vergelijking (`--zcompare-*`),
en de Niveau-tab (`--tier-*`, `--traj-*`, `--curve-*`, `--goal-*`, `--proj-*`, `--soon-tag-*`).
Zie `docs/DESIGN.md` voor hoe je ze toepast.

---

## Bestanden in dit pakket
```
src/                     de HTML/JSX design-prototypes + tokens + merk-assets
  *.jsx                  app, schema, vorm (conditie), niveau, trainingen, settings,
                         coach-feedback, ride-detail, chart, workout
  tokens.css             single source of truth
  FTP Coach - *.html     render-hosts (open in browser; Niveau-host: ?s=normaal|laden|leeg)
  Cadans - merk.html     merk-/icoon-overzicht
  favicon.svg, icons/    app-iconen
docs/
  DESIGN.md              visuele beslissingen + tokengebruik
  FTP-Coach-export.md    tab-voor-tab opbouw (componenten + states + tokens)
  INTERACTIONS.md        interactie-spec (READ/WRITE · client/server)
```

---

## Wat je aan Claude (chat) doorgeeft om de Claude Code-prompt te laten schrijven
Geef letterlijk dit mee:
1. **Deze map** (of zip) — dat is de volledige context.
2. **De doel-codebase**: welk framework/stack, waar de repo staat, of er al een design-system is.
   Claude Code moet de designs nátrekken in jullie patronen, niet de HTML droppen.
3. **De scope voor déze ronde** — bv. "rebrand naar Cadans + coach-naam + verbeterpunt 1, 2 en 3;
   punt 4 en de kleine punten later." (Verbeterpunt 2 = W/kg staat vast.)
4. **De data-realiteit**: wat is live, wat afleidbaar, wat nieuwe fetch (zie "Data die we hebben").
   Vraag Claude Code expliciet de mock-data te vervangen door echte bronnen — vooral de
   Vorm→Schema-koppeling (verbeterpunt 1).
5. **Constraints**: donker thema + bestaande tokens; mobiel-first 390×844; NL UI-strings, Engelse
   token-namen; nieuwe tokens alleen waar nodig (verbatim aanleveren).
6. **Definition of done**: geüpdatete schermen, eventuele nieuwe tokens, en bijgewerkte
   `FTP-Coach-export.md` + `INTERACTIONS.md`-secties.
```
