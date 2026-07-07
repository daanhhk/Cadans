# Niveau-tab — recon: Rijdersprofiel + Doel-projectie (read-only findings)

Feiten, geen bouwbeslissingen. GAS-referentie `daanhhk/training` HEAD `3e8090a`.

## 1. Design-target (`design/src/niveau.jsx`)
`NiveauTab` (regel 625) rendert vier secties top→onder:
1. **VermogenSnapshot** [v1] — FTP-hero + W/kg benadrukt ("Klimvermogen") + eFTP + kg + tier-ladder
   (`TIERS`: Beginner<2.5 / Recreatief<3.0 / Getraind<3.5 / Gevorderd<4.1 / Zeer goed<4.8 / Elite).
2. **ProgressieCard** [v1] — trajectorie-grafiek (metric W/kg·Fitheid, window 1M/6M/12M/Alles, CTL-overlay).
3. **Rijdersprofiel** [Fase 2] — overline "Rijdersprofiel" + sub "Beste inspanning per duur" + `SoonTag`
   "Fase 2". Visueel: (a) power-duration-curve = log-x SVG (area+line, markers 5s/1m/5m/20m/60m, key-highlight
   op 5m/20m/60m, W-labels); (b) type-staaf Sprinter↔Allrounder↔Diesel·klimmer (marker-pos `typePos`) + proza.
   Tokens: `--curve-line/-point/-point-key/-axis/-type-track/-type-marker`, `--accent-soft`.
4. **DoelProjectie** [Fase 2 · Visie] — overline "Doel-gereedheid · Girona" + sub "~90 km · 1200 hm/dag" +
   `SoonTag` "Visie". Onderdelen: 3 **GapRows** (Klimvermogen W/kg·20min 3,8/3,6 ✓op koers · Duurvermogen CTL
   65/72 · Lange-rit 3u10/4u); coach-callout; **"Uren→potentieel"** (`HoursSlider` 4–14u) → SOLIDE
   fitheid-projectiegrafiek (exp-ramp naar plafond + doel-lijn + klaar-marker) + readout "Duurdoel bereikt over
   ~N weken" / onhaalbaar-waarschuwing + "+2u ≈ X weken eerder"; **SPECULATIEVE FTP-band** (gestreept,
   "schatting", lo–hi W over 12 wk) + uitklapbare aannames. Tokens: `--goal-ontrack/-gap/-target-line`,
   `--proj-solid/-ready-marker/-band-fill/-band-border/-band-hatch/-estimate-text`, `--slider-*`.
Elke sectie heeft leeg/laden-varianten.

## 2. Huidige Niveau-v1 (apps/web)
- Pad: `apps/web/src/pages/Niveau.tsx` + `apps/web/src/components/niveau/{VermogenSnapshot,ProgressieCard,NiveauSoonCard}.tsx`.
- ECHT (live): **VermogenSnapshot** + **ProgressieCard**. PLACEHOLDER: **Rijdersprofiel** + **DoelProjectie**
  = `NiveauSoonCard` (tag "Fase 2"/"Visie", Niveau.tsx:145/151).
- Fetcht: `getSettings()` + `getActivities()` — NIET `/api/power-curve`.
- Engine-fns (client-side, `@cadans/engine`): `computeNiveau_`, `dashNiveauReeks_`, `ctlReeksMaandelijks_`,
  `niveauProgressie_`, `eftpFromActivities_`, `setGewichtProvider`.

## 3. Engine-inventaris (`packages/engine/src/niveau.ts`) — BESTAAT ALLES
(a) **Power-duration-curve / best-power** — `pcMarkerAt_(secs,values,wkg,actIds,targetSec)` (:429);
   `pcNormalize_(c, activities?, ftp?)` (:480) → `{ window:{label,days,start,end}, weight, curve:[{secs,watts}],
   markers:[{secs,label,key,watts,wkg,activityId,date}], riderType:{pos,label} }` OF `{empty:true}`.
   `PC_MARKERS_` (:411) = 5s/1m/5m/20m/60m (key op 5m/20m/60m). 60min-cap.
(b) **Sprinter/klimmer-classificatie** — `riderTypeFromCurve_(wkg5,wkg60,wkg300,ftWkg)` (:454) →
   `{ pos:0..1, label:"Diesel · klimmer"|"All-rounder"|"Sprinter" }`. Refs `PP_REF_5S_`[9.7,24]/`_60S_`[5.5,11.5]/
   `_5M_`[3.4,7.6]/`_FT_`[2.8,6.4]; `PP_SENS_`2.0; banden `PP_BAND_LO_`0.42/`_HI_`0.58.
(c) **Doel-projectie uren→potentieel** — `activeGoalProfile_(settings)` (:629) → `GOAL_PROFILES_` (:570:
   girona `projectieMode:"gap"` 3 dims klim(ftpWkg 4.0)/duur(ctl 65)/lang(longRideH 4.0) · ftp `"test"` 1 dim);
   `goalGap_(current,target,dir)` (:636)→`{gap,onTrack,pct}`; `ctlPlateauFromVolume_(weeklyHours,tssPerHour)`
   (:654); `ctlApproachWeeks_(currentCtl,plateauCtl,targetCtl)` (:660); `ctlAtWeek_(currentCtl,plateauCtl,weeks)`
   (:708). Consts `FTP_GAIN_PER_CTL_`0.004 · `FTP_GAIN_CAP_`0.08 · `PROJ_TAU_DAYS_`42.
(d) **FTP-test-voorspelling** — `ftpBandFromProjection_(currentFtp,currentCtl,plateauCtl,gewicht?)` (:678) →
   `{lowW,highW,lowWkg,highWkg,aannames[]}`; `doelTestWeken_(doelStartISO,doelDuurWeeks,todayISO)` (:723).
   Input-helpers: `maxRecentRideH_(actValues,days)` (:767)=longRideH · `tssPerHourRecent_(actValues,days)` (:785)
   · `eftpFromActivities_(actValues)` (:545)=eFTP (idx14 Rolling-FTP). Alles PUUR + getest (in `toBe(957)`).

## 4. Wire + data-beschikbaarheid
- **`GET /api/power-curve`** BESTAAT (`workers/api/src/routes/api.ts:285`; `?window=90d|1y`). Response =
  `readNormalizedPowerCurve` (`integrations/powercurve.ts:116`) = de `pcNormalize_`-output (window/weight/curve/
  markers/riderType) OF `{empty:true}`. Leest D1-cache; stale/missing → live intervals.icu-refetch (vereist
  API-key) + upsert. **`POST /api/sync/power-curve`** (:270) vult de cache.
- **`power_curve_cache`** (`db/schema.ts:232`): id · user_id · window('90d'|'1y') · fetched_on(yyyy-MM-dd) ·
  raw_json(JSON `{list,activities}`); uniq(user_id,window). Repo `upsertPowerCurveCache`/`readPowerCurveCache`
  (`db/repo.ts:449`/`466`).
- **Geen** aparte rider-profile-/projectie-route; **GEEN** shared-DTO voor de power-curve-respons
  (`packages/shared`: 0 hits) → client consumeert de `any`-shape of een nieuwe DTO is nodig.
- **Inputs in D1:**
  - (i) best-power per duur (curve/stats/riderType) → in `power_curve_cache.raw_json` NÁ sync. **LOKAAL LEEG
    (COUNT=0)** → `GET /api/power-curve` geeft nu `{empty:true}` (of live-refetch met API-key). Blokker = sync/seed.
  - (ii) totaal getrainde uren/volume → afleidbaar uit `activities` (idx3 duur, idx8 TSS) via
    `tssPerHourRecent_`/`maxRecentRideH_`; **244 activities lokaal aanwezig**. OK.
  - (iii) historische FTP-test-uitslagen → GEEN aparte tabel/kolom. De FTP-test-voorspelling gebruikt die NIET —
    ze projecteert `currentFtp` + CTL-plateau → band + testdag (uit `settings.doel_start`/`doel_duur`). eFTP =
    Rolling-FTP `activities` idx14. Dus geen ontbrekende test-historie.

## 5. GAS-referentie (`training`, read-only, HEAD 3e8090a)
- **Rijdersprofiel**: `WebApp.gs` — `getPowerCurve` + `pcNormalize_` + `riderTypeFromCurve_` + `pcMarkerAt_`
  (`GOAL_PROFILES_` leeft óók in WebApp.gs, per `Archetypes.gs:487`). Stats = 5s/1m/5m/20m/60m. Classificatie =
  `riderTypeFromCurve_` (refs 5s[9.7,24]/60s[5.5,11.5]/5m[3.4,7.6]/eFTP[2.8,6.4], sens 2.0, banden 0.42/0.58);
  `SelfTest.gs:353-360` asserteert Sprinter/Diesel·klimmer/All-rounder. → 1:1 in cadans `niveau.ts`.
- **Doel-projectie**: `WebApp.gs` — `GOAL_PROFILES_` (girona gap / ftp test) + `ctlPlateauFromVolume_`
  (uren*tss/7) + `ctlApproachWeeks_` (tau 42d) + `ftpBandFromProjection_` (gain/ctl 0.004, cap 0.08) +
  `doelTestWeken_` + `maxRecentRideH_`/`tssPerHourRecent_`. `SelfTest.gs:380` asserteert `ctlPlateauFromVolume_`.
  Inputs = settings (ftp/gewicht/doel/doel_start/doel_duur) + activities (duur/TSS) + CTL. → 1:1 in cadans
  `niveau.ts`. (NB: `Doel.gs` = plan-fase-logica, NIET de projectie — die zit in WebApp.gs/niveau.ts.)

## 6. Branch-conclusie
- **Rijdersprofiel-compute: AL in engine** (`pcNormalize_` + `riderTypeFromCurve_` + `pcMarkerAt_`) ÉN al
  server-side geëxposeerd via `GET /api/power-curve` (`readNormalizedPowerCurve`). → **UI-ONLY** (fetch +
  render, zoals Schema). Engine ongemoeid.
- **Doel-projectie-compute: AL in engine** (`activeGoalProfile_`/`goalGap_`/`ctlPlateauFromVolume_`/
  `ctlApproachWeeks_`/`ctlAtWeek_` + input-helpers). → **UI-ONLY** (client-side op settings+activities). Engine ongemoeid.
- **FTP-test-voorspelling-compute: AL in engine** (`ftpBandFromProjection_` + `doelTestWeken_`). → **UI-ONLY**. Engine ongemoeid.

⇒ Beide secties zijn **UI-ONLY builds** (engine ongemoeid) — GEEN engine-port-eerst-klus.

**Ontbrekende inputs / blokkers (gemarkeerd):**
- ⚠️ **Rijdersprofiel**: `power_curve_cache` LOKAAL LEEG (COUNT=0) → `/api/power-curve` = `{empty:true}` tot een
  `POST /api/sync/power-curve` draait (of live-refetch met intervals.icu-API-key). = OPERATIONELE sync/seed-stap,
  GEEN code-blokker.
- ⚠️ **Shared-DTO** voor de power-curve-respons ontbreekt → client-side typering toevoegen (klein).
- ✓ **Doel-projectie**: alle inputs aanwezig (settings ftp/gewicht/doel + 244 activities → longRideH/tssPerHour/
  CTL). Voor een zinvolle FTP-test-modus-demo: `settings.doel="FTP"` + `doel_start` + `doel_duur` (nu
  doel="Ardennen-trip" → girona gap-modus, werkt met de huidige seed).
