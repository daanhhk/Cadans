# CADANS — VORMGEVING-DELTA-RECON

Read-only recon van `apps/web`-NU vs `docs/VORMGEVING-SPEC.md`. Gepind op cadans HEAD
`d70d5d8ff06278f0f8b719de67628a59f787d6a1`; training HEAD `3e8090a` onaangeroerd. Legenda exact
als de spec: ✓ al aanwezig · ○ nog te bouwen · ≠ data/impl-gedwongen afwijking · ⏸ bewust geparkeerd
· → te verifiëren. Onbekend = expliciet zo benoemd. Verzin niets.

## Methode — bestanden gelezen (paden)
- `docs/VORMGEVING-SPEC.md` (meetlat).
- `apps/web/src/App.tsx`, `components/AppShell.tsx`, `components/BottomNav.tsx` (+`CadansMark`/`NavIcon`).
- `components/schema/`: `SchemaView.tsx`, `PeriodTimeline.tsx`, `WeekLoad.tsx`, `DayStrip.tsx`,
  `DoneCompareCard.tsx`, `DoneDetail.tsx`, `ZoneCompare.tsx`, `ZonePill.tsx`, `ZoneBars.tsx`, `AlignChip.tsx`.
- `pages/Instellingen.tsx`, `pages/Weekplanner.tsx`, `pages/Schema.tsx`.
- `lib/schema.ts`, `lib/proposal.ts`, `lib/settings.ts`.
- `packages/engine/src/zones.ts` (`actualZoneMinutes_`/`tryPowerZoneTimes_`), `workers/api/src/db/schema.ts`+`repo.ts`.

## Per spec-sectie

### 1 · APP-HEADER (`components/AppShell.tsx`)
- Logo-icoon — **✓** — `AppShell.tsx:29` (`<CadansMark size={22}/>`).
- Woordmerk = coach-naam UPPERCASE — **○** — `AppShell.tsx:40` toont hardcoded `"Cadans"` (app-naam, uppercased via `textTransform`), NIET `settings.coachNaam`.
- "Week 28" (ISO-weeknr) — **○** — afwezig.
- Avatar-badge (initialen, oranje ring) — **○** — afwezig; enkel een tandwiel-`Link` → `/instellingen` (`AppShell.tsx:42`).

### 2 · PLAN · PERIODISERING-KAART (`components/schema/PeriodTimeline.tsx`)
- Overline "PLAN · PERIODISERING" — **✓** — `PeriodTimeline.tsx:105` ("Plan · periodisering").
- Titel fase + "· geen A-event gepland" — fase **✓** / suffix **○** — `:116` toont `"<fase> · nog <N> wkn tot <eventNaam>"`; geen "geen A-event"-tak.
- Status-pill "Opbouw" (macro-fase) — **○** — geen macro-fase-pill; wel een `ModeChip` "Doel-gericht" (hardcoded, `:167` ← `proposal.ts:179`).
- Chevron → uitklapbaar — **○** — kaart is statisch (geen expand).
- 4-fasenbalk Basis·Build·Peak·**Taper** — **≠** — `FASE_SEQ` = `Basis/Build/Peak` = **3** staven, GEEN Taper (`PeriodTimeline.tsx:6-10`).
- Event-chip + dagen-teller — deels **✓** — `eventNaam`+`wekenTotEvent` (`proposal.ts:175-178`) → "Tot <event>" stat (`:165`); geen dagen-teller/versie-suffix.
- Volume-stat "4–7 u" — **○** — afwezig (geen volume-target in de engine-keten; bekende debt).

### 3 · DEZE WEEK · GEPLAND VS GEDAAN (`components/schema/WeekLoad.tsx`)
- Overline + refresh — **✓** + **≠** — refresh "Werk week bij" (`:132-135`) ÉN een kalender-`Link`→`/weekplanner` (`:91`); GAS toont enkel refresh (extra kalender-ingang).
- 3 metric-kolommen gedaan/gepland + labels — **✓** — `WeekLoad` (view.tss/minuten/dagen).
- "Voortgang" + "% van plan" + gradient-bar — **✓**.
- "Laatst gesynct" — **✓** (`syncNote`).

### 4 · DAG-STRIP (`components/schema/DayStrip.tsx`)
- ✓-glyph / streepje / zone-dot + oranje selectie-outline — **✓** — `DayStrip.tsx` (`Indicator` op `state`, `accentEdge` op `isToday||selected`).

### 5 · DAGKAART (`components/schema/SchemaView.tsx` dispatch)
- Overline volledige dagnaam — deels **✓** / **≠** — `:86` toont `"<weekday> <dayNum> · <STATE_LABEL>"` (bv. "wo 8 · Voltooid"), niet de volledige "Donderdag Do 9 Jul".
- 5a RUSTDAG — **✓** — copy "Rustdag — van herstel word je beter." (`SchemaView.tsx:126`). Knoppen-blok **○** (zie 5e).
- 5b GEPLAND — **✓** — `WorkoutDetail` (type-pill/naam/duur/ZoneBars).
- 5c VOLTOOID-VOLLE (vandaag): overline+AlignChip **✓** (`SchemaView:90/108` + `DoneCompareCard`) · type-pill+titel **✓** (P2) · tabel Type/Duur/IF/TSS **✓** · zone-compare **✓** (`ZoneCompare`) · coach-impact-box **○** (=2c) · "Bekijk ritdetails ›" + knoppen **○**.
- 5d VOLTOOID-VERLEDEN — **⏸** — gereduceerde `DoneDetail`, bewust geparkeerd (ambient-now; zie HANDOFF).
- 5e GEDEELD KNOPPEN-BLOK ("Andere training kiezen"/"Beschikbaarheid aanpassen"/"Push naar Garmin") — **○** — bestaat niet; enkel de losse WeekLoad-kalender + sync-knop.

### 6 · COACH-IMPACT-BOX — **○** — geen "`<COACH>` · IMPACT"-box met `coachFeedback_`-proza (=2c; enkel de state/labels die `DoneCompareCard` al gebruikt).

### 7 · BESCHIKBAARHEID-POPUP (`pages/Weekplanner.tsx`)
- Editor bestaat — **✓** maar **≠** — full-screen route `/weekplanner` (`App.tsx:31`, buiten AppShell/nav), titel "Weekplanner", VRIJE week-nav (`‹/›`) i.p.v. de 3 tabs "Alleen deze dag/Deze week/Volgende week"; geen "Alleen deze dag"-scope.
- Train?-toggle + minuten-slider (30-360/15) + Pendel?-toggle — **✓** — `Weekplanner.tsx:90/123/150`.
- Opslaan — **✓** ("Beschikbaarheid opslaan").

### 8 · RITDETAILS-DRILL-DOWN — **○** — bestaat niet (geen 7-zone-balk / NP·IF·TSS-tegels / intervallen-lijst; =2d).

### 9 · BOTTOM-NAV (`components/BottomNav.tsx` + `components/AppShell.tsx`) — zie DIEPE DUIK 10.
- 4 tabs Schema/Vorm/Trainingen/Niveau — **✓** — `BottomNav.tsx:4-9` (Trainingen → `ComingSoon`, `App.tsx:22`).
- STICKY — **≠** (niet sticky) · safe-area — **✓** · content-padding — n.v.t.

### 10 · INSTELLINGEN + EVENTS (`pages/Instellingen.tsx`)
- Vorm — **≠** — full-screen route `/instellingen` (`App.tsx:28`, geen bottom-nav) + sticky eigen header (`:317`), niet een bottom-sheet.
- AANWEZIG: PROFIEL (FTP/gewicht/W-kg, `:416`) · TRAININGSPROFIEL (volume-dropdown, `:441`) · DOEL & BLOK (5-doel-`Segmented` + blok-start + blok-duur, `:453`) · Geavanceerd hartslag (`:494`) · Geavanceerd pendel&fase (`:514`).
- ONTBREEKT: JOUW COACH (coach-naam + presets) **○** · PROFIEL-naam + "FTP automatisch bijwerken"-toggle **○** · KOPPELINGEN (intervals-status/athlete-id/api-key/garmin) **○** · MELDINGEN (zondag-toggle) **○** · EVENTS-editor **○**.

## 13-punts checklist — harde antwoorden
1. **coach-naam-bron — ○.** Geen `coachNaam`-veld in `lib/settings.ts`/form/header; `AppShell.tsx:40` = hardcoded "Cadans". Feature onbestaand.
2. **volledige-initialen — ○.** Geen avatar-badge (`AppShell` heeft alleen logo+woordmerk+tandwiel).
3. **volume-profiel→uren — ○/→.** `Instellingen` heeft een volume-profiel-dropdown (`PROFIEL_PRESET_OPTIONS`, `:441`), maar PeriodTimeline rendert GEEN Volume-stat "4–7 u"; profiel→uren-render-mapping bestaat niet (mapping in de engine → te verifiëren).
4. **4-fasenbalk incl Taper — ≠.** `PeriodTimeline` FASE_SEQ = 3 (Basis/Build/Peak); Taper NIET als staaf. De engine KENT Taper (`eventFase_`-overlay) maar de balk toont 'm niet.
5. **week-header refresh vs +kalender — ≠.** Cadans heeft BEIDE (refresh `WeekLoad.tsx:132` + kalender→`/weekplanner` `:91`); GAS toont enkel refresh.
6. **ZONE-AANTAL — ≠, NIET data-gedwongen.** Zie DIEPE DUIK 6: done=3 (engine-collapse), gepland=5, compare tekent Z1-Z5; D1 heeft de RAW 7.
7. **event-chip + "geen A-event" — ○ (deels).** `eventNaam`/`wekenTotEvent` uit `proposal.ts:175-178` ✓; GEEN prioriteit-afleiding voor de "geen A-event gepland"-suffix.
8. **rustdag-knoppen — ○.** Geen "Andere training kiezen"/"Beschikbaarheid aanpassen"/"Push naar Garmin"-blok onder rustdag/voltooid.
9. **beschikbaarheid-editor — ✓ (met ≠).** `Weekplanner` bestaat (Train/slider/Pendel), maar full-page + vrije week-nav i.p.v. bottom-sheet + 3 tabs.
10. **bottom-nav sticky — ≠ NEE; safe-area ✓ JA.** Zie DIEPE DUIK 10.
11. **coach-impact-box — ○.** Niet gebouwd (=2c).
12. **ritdetails-drill-down — ○.** Niet gebouwd (=2d).
13. **instellingen+events-editor — ○ (basis ✓).** `Instellingen` heeft 5 secties; events-editor + JOUW COACH + KOPPELINGEN + MELDINGEN + PROFIEL-naam/FTP-auto ONTBREKEN.

## DIEPE DUIK 6 · ZONE-AANTAL
a) **Engine plan-zones** — `lib/schema.ts` `BAR_BUCKET` mapt de engine-blok-buckets naar **5** zones
   (rust→Z1, z2→Z2, tempo→Z3, drempel→Z4, anaeroob→Z5); `ZoneBars`/`ZoneCompare` renderen Z1-Z5.
b) **Activity zone_times in D1** — `workers/api/src/db/schema.ts:87` `zone_times_json = text` (de RAUWE
   `icu_zone_times`-JSON, opgeslagen as-is; `repo.ts:236`). De echte rit `i163855557` bevatte
   `Z1..Z7` + `SS` = **7** power-zones + 1 overlay.
c) **Done → 3 buckets** — `lib/schema.ts buildDoneEntry` → `actualZoneMinutes_` (`packages/engine/src/zones.ts:16`)
   → `tryPowerZoneTimes_` (`zones.ts:30-54`) collapst Z1-Z7 naar **3** buckets: `Z1,Z2→low · Z3,Z4→high ·
   Z5,Z6,Z7→anaerobic` (SS/overlays geskipt). `DoneEntry.zoneMinutes` = `{low,high,anaerobic}`.
d) **ZoneCompare-render** — tekent een Z1-Z5-grid (`schema.ts zoneCompareRows [1..5]`); de done-kant
   mapt via `DONE_ZONE_NUM {low→2,high→4,anaerobic→5}` → done vult ALLEEN Z2/Z4/Z5. Filter plan>0||done>0.
e) **CONCLUSIE** — gepland = **5** zones, gedaan (zoals gebruikt) = **3** buckets (Z2/Z4/Z5), compare-grid =
   Z1-Z5. Dit is de eerdere "3-vs-5" (3 = done-kant, 5 = plan-kant). **NIET data-gedwongen:** de RAUWE
   D1-data heeft 7 zones; de 3-bucket-reductie is de engine-PORT-keuze (`tryPowerZoneTimes_`, GAS-parity),
   niet een datalimiet. GAS toont 5 in de vergelijking + 7 in ritdetails; een 5-(of 7-)zone done-kant is
   uit de raw `zone_times_json` mogelijk maar vergt een rijkere mapping (engine-fn of nieuwe apps/web-mapper).
f) D1-SELECT overgeslagen (niet nodig): de raw 7-zone-shape is al bekend uit de eerdere prod-SELECT van
   `i163855557` (Z1-Z7+SS). Code-afleiding is eenduidig.

## DIEPE DUIK 10 · BOTTOM-NAV STICKY + SAFE-AREA
- **Nav-component** (`components/BottomNav.tsx`): `<nav>` met `flexShrink:0` + `paddingBottom:
  calc(env(safe-area-inset-bottom,0px)+8px)` (`:24`). GEEN `position: sticky/fixed` — de nav is IN-FLOW.
- **Layout** (`components/AppShell.tsx`): outer `div` = `minHeight:"100dvh"` + `flex column` (`:11-19`);
  `<main style={{flex:1, overflowY:"auto"}}>` (`:83`); `<BottomNav/>` als laatste flex-kind (`:87`).
- **Huidige positie / scrollt weg?** JA, scrollt weg. **Oorzaak:** `minHeight:100dvh` (i.p.v. een
  BEGRENSDE `height:100dvh`) capt de container-hoogte niet → `<main flex:1>` groeit mee met z'n inhoud →
  `overflowY:auto` triggert nooit → de WHOLE PAGE (body/viewport) scrollt → de in-flow nav zakt onder de
  vouw mee. (Matcht de spec "nav scrollt mee weg".)
- **safe-area?** JA — `BottomNav.tsx:24` (bottom) + `AppShell.tsx:26` (header top-inset).
- **content-padding?** n.v.t. — de nav is in-flow (geen overlay), dus content valt er niet achter; padding
  is niet de oplossing.
- **CONCREET wat moet veranderen:** begrens de AppShell-container-hoogte zodat `<main>` het ENIGE
  scroll-gebied wordt — bv. `height:100dvh` (of `100svh`/`100dvh` met `min-height:0` op `<main>`) i.p.v.
  `minHeight`. Dan blijft de flex-nav onderaan de viewport plakken; safe-area is al goed. (Alternatief:
  `position:sticky/fixed` op de nav + content bottom-padding — maar de flex-fix is schoner, geen overlay.)

## DELTA-SAMENVATTING — bouwvolgorde, Schema-flow EERST
Gesorteerd (○/≠), Schema-flow bovenaan; per item de betrokken bestanden:
1. **Bottom-nav sticky (≠, layout, hoge waarde/lage kost)** — `components/AppShell.tsx:13,83`. Begrens de hoogte.
2. **Coach-impact-box (○, =2c)** — nieuw component onder `DoneCompareCard`; `coachFeedback_`-proza; `SchemaView.tsx`.
3. **Dagkaart knoppen-blok (○, 5e)** — "Andere training kiezen"/"Beschikbaarheid aanpassen"/"Push naar Garmin"; `SchemaView.tsx` (+ Garmin-push-route ontbreekt in apps/web).
4. **Zone-aantal (≠, punt 6)** — richer done-mapping (5 zones) uit raw `zone_times_json`; `packages/engine/src/zones.ts` of nieuwe apps/web-mapper + `ZoneCompare.tsx` — engine-raakvlak → sign-off.
5. **Periodisering-kaart (≠/○)** — Taper-staaf (4 fasen), status-pill "Opbouw", uitklap, "geen A-event"-suffix, Volume-stat; `PeriodTimeline.tsx` + `proposal.ts` (event-prioriteit + volume-mapping).
6. **App-header (○)** — coach-woordmerk (coachNaam) + ISO-week + avatar-initialen; `AppShell.tsx` + `lib/settings.ts` (coachNaam-veld ontbreekt).
7. **Ritdetails-drill-down (○, =2d)** — nieuw scherm; activity + intervals-data.
8. **Instellingen-uitbreiding (○, punt 13)** — JOUW COACH / KOPPELINGEN / MELDINGEN / PROFIEL-naam+FTP-auto / EVENTS-editor; `pages/Instellingen.tsx` + `lib/settings.ts`.
9. **Beschikbaarheid-vorm (≠, punt 9)** — optioneel naar bottom-sheet + 3-tab-scope; `pages/Weekplanner.tsx` (functioneel al compleet).

Onbekend/te-verifiëren: volume-profiel→uren-mapping in de engine (punt 3); exacte coachNaam/initialen-bron
(punten 1-2, bestaan niet → nieuw settings-veld nodig).
