# CADANS — FASE 2 BRON-RECON

Read-only bron-recon voor de 5 FASE-2-brokken + een verse §10-instellingen-inventaris. Gepind op
cadans HEAD `d7a2356f5765c539d513090b24f15f7de7068787`; training HEAD `3e8090a` (READ-ONLY, onaangeroerd).
Meetlat = `docs/VORMGEVING-SPEC.md` §1/§2/§5/§10. BRON-status: **bestaat** / **port-uit-GAS** /
**nieuw-te-bouwen**. Onbekend = expliciet zo benoemd.

## Brok 1 — TAPER-ACTIVERING (fase-balk 4e segment oplichten)
- **BRON: bestaat (in de engine-output, maar weggegooid in de web-laag).** `eventFase_` (packages/engine
  `phase.ts:167-174`) retourneert ZOWEL `macroFase` (Base/Build/Peak/Recovery, `phase.ts:169`) ALS
  `fase` (= `taperEvent ? "Taper" : macroFase`, `phase.ts:165` → kan "Taper" zijn). `buildWeekProposal`
  leest `macro.fase` NIET (thread't alleen `macro.macroFase` → `proposalWeek.macroFase`); `ProposalWeek`
  (`apps/web/src/lib/proposal.ts:61`) heeft GEEN `fase`-veld. `PeriodTimeline` keyt de actieve fase op
  `macroFase` (`PeriodTimeline.tsx:87`) → nooit "Taper".
- **LAGEN: web-only.** `proposal.ts` (voeg `fase`/`activeFase` aan `ProposalWeek` + thread `macro.fase` in
  `buildWeekProposal`, `macro` op `:151`) + `PeriodTimeline.tsx:87` (key op het overlay-veld).
- **Engine: NEE** — `eventFase_` levert `fase` al; niets in `packages/engine` te wijzigen.
- **PRODUCTBESLISSING:** balk-actieve-segment volgen op de EFFECTIEVE fase (Taper tijdens taper) i.p.v.
  puur macroFase; beslis Recovery/Test-gedrag (geen actief segment vs macroFase-fallback — beide zitten
  niet in de 4-segment-balk).

## Brok 2 — STATUS-PILL "Opbouw"
- **BRON: port-uit-GAS.** GAS `planModeLabel_` (`src/Doel.gs:294-297`): `doel==='Onderhoud'→'Onderhoud'`
  · else `macro.eventDriven→'Doel-gericht'` · else `fase==='maintain'→'Onderhoud'` · else `'Opbouw'`.
  3 outputs: Onderhoud/Doel-gericht/Opbouw. **"Doel-gericht" is een output → de port VERVANGT de huidige
  hardcoded pill** (`proposal.ts:179` `planModus = macro ? "Doel-gericht" : null` → `PeriodTimeline` ModeChip).
- **Inputs beschikbaar in Cadans:** `settings.doel` ✓, `settings.fase` ✓; `eventDriven` = NIET op de
  Cadans-`macro` (Cadans `eventFase_` `phase.ts:167-174` mist `eventDriven`; GAS voegt 'm pas in de
  wrapper `bepaalFaseVoorDatum_` toe) → af te leiden uit event-presence (`macro != null`/`hoofdEvent`,
  precies hoe `planModus` nu al wordt afgeleid).
- **LAGEN:** web-only PURE port in `proposal.ts` (vervang `:179`) — GEEN bestaande engine-logica geraakt.
  (Alternatief: nieuwe pure fn in `packages/engine/phase.ts` = canonieker maar engine-wijziging → sign-off.)
- **Engine: NEE** (web-port) / optioneel JA (engine-port, keuze).
- **PRODUCTBESLISSING:** web-port (geen sign-off, snel) vs engine-port (canoniek, sign-off).

## Brok 3 — HEADER §1 (coachNaam + avatar-initialen + ISO-week)
- **BRON: nieuw-te-bouwen.** `coachNaam` bestaat NERGENS: niet in `SettingsInput` (`packages/shared/
  src/settings.ts:10`), niet in de D1 `settings`-tabel (`workers/api/src/db/schema.ts:42-62`), niet in
  `SettingsForm`/`EMPTY_FORM` (`apps/web/src/lib/settings.ts:29-42`). Header toont hardcoded "Cadans"
  (`AppShell.tsx:40`).
- **LAGEN: full-stack (geen engine).** D1 (`schema.ts` nieuwe kolom) → shared (`SettingsInput` nieuw veld)
  → api (`repo.ts` readSettings/writeSettings-map + de PUT-route) → web (`settings.ts` form + `Instellingen.tsx`
  JOUW-COACH-sectie + `AppShell.tsx:40` render).
- **Engine: NEE** (display-only, raakt geen periodisering/generatie).
- **Avatar-initialen:** vereist een **USER-naam** (Daan → "DK"), los van coachNaam — er is NU geen
  persoonsnaam-veld → nieuw veld óf productkeuze (initialen uit coachNaam? = onbekend, te beslissen).
- **ISO-week:** pure datum-afleiding in de header-component (`AppShell.tsx`), geen bron nodig.
- **PRODUCTBESLISSING (spec §1/§10):** coachNaam = vrij tekstveld MÉT preset-chips (Coach · Daan · Merckx ·
  Sven · Anna); avatar-naambron apart beslissen.

## Brok 4 — PERIODISERING-UITKLAP (event-chip + Volume-kolom)
### 4a · EVENT-PRIORITEIT + events-editor
- **BRON: model bestaat, editor ontbreekt.** Events = eigen D1-tabel (`workers/api/src/db/schema.ts:142`,
  incl. `prioriteit` A/B/C); DTO `EventItem` (`packages/shared/src/weekgen.ts:38`, `prioriteit` `:44`);
  read via `api.get("/events")` (`api.ts:225` → `readEvents`). **GEEN schrijfroute** (geen `PUT/POST /events`)
  en **GEEN events-editor** in `/instellingen` (§10 EVENTS = ○). De event-chip (spec §2) heeft `eventNaam`
  + `wekenTotEvent` (`proposalWeek`), maar `prioriteit` wordt niet in de chip getoond en er is geen
  "geen A-event"-afleiding.
- **LAGEN:** api (nieuwe `PUT/POST /events` + repo-write) + web (editor-UI in `Instellingen.tsx` + chip-
  verrijking in `PeriodTimeline`). **Engine: NEE** (events voeden `eventFase_`, maar editor/chip = api+web).
- **PRODUCTBESLISSING:** bouw de events-editor (write-pad + UI) → vervangt de handmatige D1-seed.
### 4b · VOLUME → UREN
- **BRON: profiel bestaat, uren-RANGE ontbreekt.** `profielPreset` = settings-string; `PROFIEL_PRESET_
  OPTIONS` (`apps/web/src/lib/settings.ts:104-106`) geeft alleen een PUNT-label (`~3u`/`~5u`/`~7u/wk`),
  GEEN gestructureerde range ("4-7u"). `PeriodTimeline` rendert momenteel GEEN Volume-stat.
- **LAGEN: web-only.** Nieuwe `profielPreset → uren-range`-lookup + Volume-stat renderen in `PeriodTimeline`.
- **Engine: NEE** (de range is een display-constructie; de engine kent geen uren-range — volume komt uit
  planner-minuten, niet uit het profiel).
- **PRODUCTBESLISSING:** range afleiden (bv. ±rond het punt) of vaste ranges per preset; punt vs range.

## Brok 5 — ZONE-MAPPING 3 → 5 (done-kant)
- **BRON: raw 7 zones bestaan; 3-bucket-collapse is de huidige keuze.** D1 bewaart de RAUWE `icu_zone_times`
  (7 zones Z1-Z7, `schema.ts:87` `zone_times_json`). `buildDoneEntry` (`apps/web/src/lib/schema.ts`) →
  `actualZoneMinutes_`/`tryPowerZoneTimes_` (`packages/engine/src/zones.ts:30-54`) collapst Z1-Z7 → **3**
  buckets {low,high,anaerobic} → compare-done vult Z2/Z4/Z5.
- **GAS-CHECK (crux):** GAS toont de DONE-kant óók in **~3 zones** (Z2/Z4/Z5): `ZCOMPARE_ZONES_`
  (`Script.html:531-537`) is een Z1-Z5-grid, maar `coach.done.segmenten` komt in de normale flow uit de
  3-bucket-IF-benadering (`coachActualIntent_`, `Coach.gs`), NIET uit 5-zone-data. (GAS heeft een LAZY
  5-bucket-pad `getDayCoachZones`, `WebApp.gs:728-745`, maar dat voedt de standaard-compare niet.)
- **CONCLUSIE:** Cadans staat NU op GAS-parity (done = 3 zones). Done-kant → 5 zones is GEEN
  parity-herstel maar een **enhancement die van GAS DIVERGEERT**.
- **LAGEN:** web-only mogelijk (`buildDoneEntry` mapt de rauwe `row[15]`-JSON zélf naar 5 zones i.p.v. de
  engine-3-bucket; + `zoneCompareRows`/`ZoneCompare`). **Engine: NEE** voor het web-pad (raw JSON al in D1);
  alternatief = `zones.ts` 5-bucket maken (engine → sign-off).
- **PRODUCTBESLISSING:** GAS-parity (3, niets doen) vs enhancement (5, web-only, diverge van GAS).

## §10-instellingen-inventaris (`apps/web/src/pages/Instellingen.tsx`)
| Spec §10-sectie | Status | Notitie |
|---|---|---|
| JOUW COACH (naam + preset-chips) | ○ | ontbreekt (Brok 3) |
| PROFIEL — FTP · Gewicht · W/kg | ✓ | `Instellingen.tsx:416` |
| PROFIEL — naam + "FTP automatisch bijwerken" | ○ | naam-veld + auto-toggle ontbreken |
| TRAININGSPROFIEL — volume-profiel | ✓ | `:441` (dropdown, punt-uren) |
| DOEL & BLOK — trainingsdoel + blok-start + duur | ✓ | `:453` (5-doel-segmented) |
| Geavanceerd — hartslag (LTHR/max/rust) | ✓ | `:494` (extra t.o.v. spec) |
| Geavanceerd — pendel & fase | ✓ | `:514` (extra t.o.v. spec) |
| KOPPELINGEN (intervals-status/athlete-id/api-key/garmin) | ○ | ontbreekt |
| MELDINGEN (zondag-herinnering) | ○ | ontbreekt |
| EVENTS-editor | ○ | ontbreekt (Brok 4a) |

## EINDTABEL — engine-sign-off
| Brok | Raakt `packages/engine`? | Sign-off nodig? | Bouw-pad |
|---|---|---|---|
| 1 · Taper-activering | NEE | NEE | **web-only**, direct bouwbaar (`proposal.ts` + `PeriodTimeline.tsx`) |
| 2 · Opbouw-pill | NEE (web-port) | NEE | **web-only** (`proposal.ts:179`) · optioneel engine-port = sign-off |
| 3 · Header coachNaam | NEE | NEE | full-stack D1+shared+api+web (geen engine) |
| 4a · Events-editor | NEE | NEE | api (PUT /events) + web (editor) |
| 4b · Volume→uren | NEE | NEE | **web-only** (lookup + `PeriodTimeline`) |
| 5 · Zones 3→5 | NEE (web-pad) | NEE | **web-only** (`schema.ts buildDoneEntry` mapt raw JSON) · optioneel `zones.ts` = sign-off |

**Kern:** GEEN enkele brok VEREIST een `packages/engine`-wijziging — elke brok heeft een web/api/D1/shared-
pad zonder de engine te raken. Engine-sign-off is enkel nodig als bewust gekozen wordt voor de CANONIEKE
engine-port bij Brok 2 (planModeLabel_ in `phase.ts`) of Brok 5 (5-bucket in `zones.ts`). Direct-bouwbaar
zonder sign-off: 1, 2 (web), 3, 4a, 4b, 5 (web). Openstaande beslispunten: Brok 1 Recovery/Test-gedrag ·
Brok 3 avatar-naambron · Brok 5 GAS-parity(3) vs enhancement(5).
