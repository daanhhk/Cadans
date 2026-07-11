# FASE 2 · Brok 5 — zone-bucketing 3→5 RECON (feiten-only, read-only)

Vraag: waar reduceert Cadans de REËLE trainingszones tot < 5 buckets, en raakt het dichten daarvan de PURE
ENGINE (sign-off) of is het client/API-only? Cadans HEAD `f405f9d`; GAS-referentie
`C:\Users\daan\Projects\training` HEAD `3e8090a` (alleen gelezen). GEEN code gewijzigd.

## KERNCONCLUSIE

- **(b) ENGINE-RAKEND.** De 7→3-collaps zit in de PURE engine: `tryPowerZoneTimes_` (`packages/engine/src/
  zones.ts:30-54`) mapt icu_zone_times Z1..Z7 op **3 buckets** {low,high,anaerobic} (`:33-41`) en returnt
  3-bucket (`:53`); `actualZoneMinutes_` (`zones.ts:16`) wrapt 't; `tryHrZoneTimes_` (`zones.ts:56+`) idem
  (HR-fallback). GAS `actualZoneMinutes_` (`Algorithm.gs:364`) mapt DEZELFDE Z1..Z7 op **5 buckets**
  (rust/z2/tempo/drempel/anaeroob). 3→5 dichten = deze engine-fns wijzigen → **SIGN-OFF vereist**.
- **De ruwe data is AANWEZIG** (D1 `zone_times_json` = de per-zone icu_zone_times) — 5-bucket is haalbaar; enkel
  de engine-aggregatie gooit de granulariteit weg.

## GAS 5-bucket-meetlat (read-only geverifieerd @ `3e8090a`)

- Canoniek = 5 buckets rust/z2/tempo/drempel/anaeroob → Z1..Z5 (`--zone-1..5`): `WebApp.gs`
  `DASH_BUCKET_STYLE_` (38-48) + z/v-map (789-790); `Coach.gs` order (104).
- Reële aggregatie: `Algorithm.gs actualZoneMinutes_` (364): icu_zone_times (Z1..Z7 + SS) → 5 buckets;
  `WebApp.gs coachActualZoneMin_` (728) voedt `coachFeedback_`.
- 3-bucket {low/high/anaerobic} = ALLEEN fallback als icu_zone_times ontbreekt (`Coach.gs` 85-90 + 115-121).

## Cadans-huidige staat (per vraag, met bestand:regel)

### 1. Reële-data-vorm = 3 buckets
`DoneEntry.zoneMinutes: Record<ZoneKey, number> | null` (`apps/web/src/lib/schema.ts:199-204`), `ZoneKey` =
**low/high/anaerobic** (`ZONE_META` `:38-41`). `buildDoneEntry` (`:216-232`) zet
`zoneMinutes: { low, high, anaerobic }` (`:227-228`); `mergeDone` (`:236-254`) somt dezelfde 3. → **3 buckets,
sleutels low/high/anaerobic.**

### 2. Aggregatie-herkomst = engine, MAAR 3-bucket-port
GAS `actualZoneMinutes_` IS geport: `packages/engine/src/zones.ts:16`, aangeroepen door de CLIENT
(`buildDoneEntry` `schema.ts:217`, `as { low, high, anaerobic }` gecast `:220`) én de weekprep-laag
(`weekprep.ts:114`). MAAR de port `tryPowerZoneTimes_` (`zones.ts:30-54`) collapst Z1..Z7 → 3 (`:33-41`:
Z1/Z2→low · Z3/Z4→high · Z5/Z6/Z7→anaerobic; SS/overlays→skip) en returnt `{low,high,anaerobic}` (`:53`).
`tryHrZoneTimes_` (`zones.ts:56+`) idem 3-bucket. → **Cadans-engine wijkt af van GAS' 5-bucket-`actualZoneMinutes_`.**
NB: de GEPLANDE zijde IS 5-bucket in de engine (`coach.ts:147` `{rust,z2,tempo,drempel,anaeroob}` via
`pctZoneBucket_`); alleen de REËLE/done-zijde is 3-bucket → interne engine-inconsistentie.

### 3. Sync/opslag = ruwe icu_zone_times AANWEZIG
Engine `sync.ts:100-102` serialiseert `a.icu_zone_times` → idx15 (`ACT_ZONE_TIMES_IDX = 15`, `:40`); worker
`repo.ts:241` schrijft `zoneTimesJson` → D1-kolom `zone_times_json` (`schema.ts:89`). De per-zone Z1..Z7-secs
zijn dus DURABLE opgeslagen (niet weggegooid). `zoneTimesFromCell_` parseert ze terug (`buildDoneEntry`
`:218`). → **5-bucket is mogelijk uit de bestaande data; de collaps gebeurt pas in de engine-aggregatie.**

### 4. Weergave = 5 bars getoond, 3 gevuld (done-zijde)
`ZoneBars.tsx` `ZONE_ROWS` = 5 vaste rijen Z1..Z5 (Herstel/Duur/Tempo/Drempel/VO2max, `:10-16`) → TOONT 5.
De done-buckets (3) worden gemapt via `doneZoneBlokken` (`schema.ts:264-272`, `DONE_BAR_HOOGTE`
{low→z2/high→drempel/anaerobic→anaeroob} `:209-213`) → vullen enkel **zone-2, zone-4, zone-5**. `ZoneCompare`
(`zoneCompareRows` `:380-391`, done-loop over `ZONE_ORDER` = 3 `:81`) idem. → **Z1 (Herstel) + Z3 (Tempo)
blijven op de done-zijde STRUCTUREEL leeg** (rust-tijd in z2, tempo-tijd in drempel gelumpt). Dit is de zichtbare
3-reductie. Het GEPLANDE silhouet (`ZoneBar`/`silhouetSegments`, `:blokken` uit de engine `pctZoneBucket_`) KAN
wél alle 5 vullen.

### 5. Classificatie = (b) ENGINE-RAKEND
De reductie zit in de PURE engine (`zones.ts` `tryPowerZoneTimes_` `:30-54` · `tryHrZoneTimes_` `:56+` ·
`actualZoneMinutes_` `:16`). 5-bucket-pariteit vergt: (i) deze fns → 5-bucket-map (mirror GAS
`Algorithm.gs:364`), (ii) `DoneEntry.zoneMinutes`-shape 3→5 (`schema.ts:204`), (iii) de done-render-mapping
(`doneZoneBlokken`/`zoneCompareRows`/`ZONE_ORDER`). **(i) = `packages/engine` → SIGN-OFF vereist** (bron van
waarheid). NIET client/API-only. De ruwe D1-data (`zone_times_json`) hoeft niet te veranderen.
