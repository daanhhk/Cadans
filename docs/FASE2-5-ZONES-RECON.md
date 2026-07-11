# FASE 2 · Brok 5 — zone-bucketing 3→5 RECON (feiten-only) + CORRECTIE

Vraag: waar reduceert Cadans de REËLE done-zones tot < 5 buckets, en raakt het dichten daarvan de PURE ENGINE
(sign-off) of is het client/API-only? Cadans HEAD `f405f9d`; GAS-referentie `C:\Users\daan\Projects\training`
HEAD `3e8090a` (alleen gelezen).

## KERNCONCLUSIE (GECORRIGEERD)

- **(a) CLIENT/API-ONLY.** De zichtbare 5-bar-done-verdeling in GAS wordt gedreven door de **WEB-APP-laag**
  `coachActualZoneMin_` (`WebApp.gs:728`) — NIET door de engine. Die fn mapt icu_zone_times Z1..Z7 op **5 buckets**
  {rust,z2,tempo,drempel,anaeroob} en voedt de dashboard-bars + `coachFeedback_`. Een client-port ervan in
  `apps/web` (pure helper) dicht de reductie **zonder `packages/engine` aan te raken**.
- **De 3-bucket-engine is GAS-GETROUW en blijft.** GAS `actualZoneMinutes_` (`Algorithm.gs:364`) →
  `tryPowerZoneTimes_` (`Algorithm.gs:378`) is `{low,high,anaerobic}` (`map = {Z1:'low',Z2:'low',Z3:'high',
  Z4:'high',Z5:'anaerobic',Z6:'anaerobic',Z7:'anaerobic'}`) en voedt **LOAD/DEBT** (`computeZoneDebt_` 714-788 →
  `debtPreferredType_` 623-634). De Cadans-engine-port (`zones.ts` `tryPowerZoneTimes_` `:30-54`) spiegelt EXACT
  deze 3-bucket-fn → correct, niet aanraken.
- **De ruwe data is AANWEZIG** (D1 `zone_times_json` = per-zone icu_zone_times, bereikt de client via `row[15]` →
  `zoneTimesFromCell_`) → 5-bucket is puur client-side haalbaar. Geen D1-migratie, geen wire-DTO-wijziging.

## ⚠️ CORRECTIE — waarom de eerdere KERNCONCLUSIE (b) FOUT was

De eerste versie van deze recon (commit `cf3fa0c`) concludeerde **(b) ENGINE-RAKEND** op basis van de VERKEERDE
meetlat-functie. De redenering was: "engine `actualZoneMinutes_` = 3-bucket, GAS `actualZoneMinutes_` = 5-bucket →
de engine wijkt af → engine dichten". Beide premissen over GAS klopten niet:

- GAS `actualZoneMinutes_` (`Algorithm.gs:364`) is **óók 3-bucket** {low,high,anaerobic}, GEEN 5-bucket. Het is de
  LOAD/DEBT-aggregatie, niet de display-bron. De engine-port is er byte-getrouw aan → er is GEEN engine-divergentie.
- De 5-bar-display draait op een APARTE fn — `coachActualZoneMin_` (`WebApp.gs:728`, web-app-laag) — die de eerste
  recon over het hoofd zag. GAS heeft dus TWEE aggregaties naast elkaar: 3-bucket (load/debt, engine-laag) én
  5-bucket (display, web-app-laag). Cadans miste alleen de tweede.

Les (→ HANDOFF "BRONHIERARCHIE VOOR PARITY"): bij een parity-vraag ALTIJD de fn identificeren die het GETOONDE
gedrag echt voedt, niet de eerste gelijknamige fn. Meet aan `coachActualZoneMin_` (display), niet aan
`actualZoneMinutes_` (load/debt).

## GAS 5-bucket-meetlat (read-only geverifieerd @ `3e8090a`)

- Display-bron: `WebApp.gs coachActualZoneMin_` (728): `map = {Z1:'rust',Z2:'z2',Z3:'tempo',Z4:'drempel',
  Z5:'anaeroob',Z6:'anaeroob',Z7:'anaeroob'}`; minuten = `secs/60` (rauwe float, GEEN per-bucket-afronding);
  SS/overlay-ids overgeslagen (`if(!bk) return`); leeg/niet-array/enkel-overlay → `null` (`saw ? zm : null`).
  Voedt `getDayCoachZones` → `card.actual.zoneMin` → `coachFeedback_`.
- 5 buckets → Z1..Z5 (`--zone-1..5`): `WebApp.gs DASH_BUCKET_STYLE_` (38-48) + z/v-map (789-790); `Coach.gs`
  order (104).
- 3-bucket {low,high,anaerobic} = load/debt-tak (`Algorithm.gs:364/378`), los van de display.

## Cadans-fix (apps/web ONLY — geïmplementeerd)

### Nieuwe pure helper (mirror van `coachActualZoneMin_`)
`actualZone5_(iczt)` (`apps/web/src/lib/schema.ts`): ruwe icu_zone_times → `Zone5`
{rust,z2,tempo,drempel,anaeroob} via `ZT_TO_ZONE5` (Z1→rust·Z2→z2·Z3→tempo·Z4→drempel·Z5-7→anaeroob), `secs/60`
rauwe float, SS/overlay-skip, leeg → null. Byte-getrouw aan `WebApp.gs:728`. Vitest-dekking:
`describe("actualZone5_")` (Z1..Z7-map, SS/overlay-skip, lege/niet-array/enkel-overlay → null).

### Bedrading (5-bucket naast de 3-bucket load/debt)
`DoneEntry` krijgt `zoneMin5: Zone5 | null` NAAST de behouden `zoneMinutes` 3-bucket. `buildDoneEntry` leest
`row[15]` één keer (`zoneTimesFromCell_`) en vult BEIDE: `zoneMinutes` (3-bucket load/debt, ongewijzigd) +
`zoneMin5` (nieuw). `mergeDone` somt beide. Done-render leest nu `zoneMin5`:
- `doneZoneBlokken(zm: Zone5)` + `doneZones5` → ZoneBars (`DoneDetail`): 5 buckets → elk op eigen zone via
  `DONE5_META` → **Z1 (Herstel) + Z3 (Tempo) niet langer structureel leeg**.
- `zoneCompareRows(planned, doneZm: Zone5)` → ZoneCompare: gedaan-loop over `ZONE5_ORDER`, elke bucket op eigen
  `DONE5_META.zone`.
- `doneBadge`/`doneLabel` → dominante 5-bucket.
- `buildDoneCompare` → `coachFeedback_` krijgt de echte 5-bucket als `actual.zoneMin` (voorheen faakte
  `doneZm5_` een 5-bucket uit de 3-bucket met rust:0/tempo:0 — precies de reductie die nu weg is).

### Onaangeroerd (bewust)
`packages/engine` VOLLEDIG (3-bucket load/debt = GAS-parity), D1-schema (`zone_times_json` bereikte de client al
via `row[15]`), de wire-DTO. Geen migratie, geen nieuwe deps.

### Classificatie = (a) CLIENT/API-ONLY ✓
De reductie zat NIET in de pure engine maar in de client-render-mapping (die de 3-bucket load/debt-uitkomst als
display gebruikte). Fix = nieuwe client-helper + herbedrading in `apps/web`. `packages/engine` ongemoeid → GEEN
sign-off vereist.
