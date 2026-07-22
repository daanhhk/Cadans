# RITDETAILS + ACTIVITEITEN — RECON/SPEC (read-only, vóór de bouw)

Doel: één rit kunnen openen en z'n details zien — als popup vanuit de Schema-tab (klik op
een rit, exact GAS' interactie) én via een nieuw tabblad **Activiteiten** (rittenlijst →
tik → dezelfde popup). MÉT de vermogens-/HR-grafiek die GAS nooit afmaakte.

Bronnen zelf gelezen (geen geheugen): bevroren GAS `daanhhk/training` @ `3e8090a`,
gecommitte Cadans @ `6fc1288`.

**Kernvondst.** GAS' ritdetail-popup is compleet — behalve de grafiek. Op de plek van de
vermogenscurve staat letterlijk een placeholder: `Script.html:702`
`<div class="rd-curve">Vermogenscurve · binnenkort</div>`. **De grafiek is in GAS nóóit
gebouwd.** Dát is "de grafieken staan niet goed": een nooit-afgemaakte stub. De rest van de
popup (zonebalk, NP/IF/TSS, metrics, intervallen) werkt wél en is de parity-referentie voor
interactie + velden. De grafiek is dus geen port maar nieuwbouw — en meteen goed.

---

## §1 — HOE GAS HET DOET (parity-referentie)

### 1.1 Interactie
`Script.html:664` een knop **"Bekijk ritdetails ›"** onder een voltooide rit in de
dag-detail → `openRideDetail(dISO)` (`:666`). Opent een sheet/drawer met een skeleton, roept
dan de server aan, en rendert `rideSheetHtml_(m)` (`:705`). Cache per datum (`rideCache_`).

### 1.2 Server: `getRideDetail(dISO)` (`WebApp.gs:870`)
1. Matcht de rit **op datum** (`getActivities(40)`, fiets-types) → `hit`.
2. Haalt ON-DEMAND twee intervals-endpoints op:
   - `intervalsRequest_('/activity/' + hit.id)` → volledige activiteit (`detail`).
   - `intervalsRequest_('/activity/' + hit.id + '/intervals')` → interval-breakdown (`ivs`).
3. Resolvet FTP (`icu_ftp` zoals die vóór de rit gold) + gewicht (`icu_weight`).
4. Bouwt het model (`rideDetailModel_(hit, detail, ivs, ftp, gewicht)`), cachet onder
   DocProp `ridedetail_<id>`.
5. **Streams (de tijdreeks voor een grafiek) worden NIET opgehaald** — vandaar de stub.

### 1.3 Wat de popup toont (`rideSheetHtml_`, model-velden)
- **Kop:** klasse-badge (`klasseZone`/`klasseLabel`), datum + tijd, headline (afstand km |
  duur).
- **Zonebalk** (`tiz[]`): tijd-in-zone-verdeling met %-en per zone (`tizBar_`).
- **Hero:** NP · IF · TSS.
- **Metrics-grid:** Gem. vermogen · W/kg · Gem. HR (+ max) · Hoogtewinst · Cadans · Arbeid
  (kJ).
- **Intervallen** (indien aanwezig): per-blok-rijen (label, zone-badge, duur, HR, %FTP,
  watts) + FTP-noot.
- **Vermogenscurve:** `· binnenkort` — de stub.

`intervalsRequest_` (`IntervalsApi.gs`): base-URL + `{id}`→athlete-id-substitutie + Basic
auth (`base64("API_KEY:"+key)`). Dezelfde auth die Cadans al gebruikt.

---

## §2 — WAT CADANS AL HEEFT (en waar het GAS verslaat)

### 2.1 Directe id-lookup i.p.v. datum-matchen
Cadans slaat `activity_id_ext` (het intervals-id) op in D1 (`schema.ts:95`). De popup kan dus
**rechtstreeks op id** ophalen — GAS' fragiele datum-match (`getRideDetail`) is niet nodig.

### 2.2 Deze velden komen GRATIS uit D1 (geen fetch)
De `activities`-tabel (`schema.ts:71-96`) draagt per rit: datum · type · naam · duur · afstand
· gem. vermogen (`gemW`) · NP (`normW`) · IF (`ifPct`) · TSS · gem/max HR · FTP-van-toen ·
gewicht-van-toen · **zone_times** (`zoneTimesJson`). Daarmee zijn de kop, de **zonebalk**
(bestaande parser `zoneTimesFromCell_`, `schema.ts:333`), de hero (NP/IF/TSS), gem. vermogen,
W/kg (`gemW/gewicht`) en gem/max HR al te tonen **zonder enige netwerkcall**.

### 2.3 Wat een on-demand intervals-fetch vereist
Niet in de D1-samenvatting, dus per rit ophalen:
- `/activity/{id}` → **hoogtewinst, cadans, arbeid (kJ)** (de extra metrics-tegels).
- `/activity/{id}/intervals` → de **interval-breakdown**.
- `/activity/{id}/streams` → de **tijdreeks (watts + HR ± hoogte)** voor de grafiek. GAS
  raakte dit nooit aan → geen port-referentie, nieuwbouw.

### 2.4 Grafiek = hand-SVG (geen library)
`apps/web/package.json`: enige runtime-deps zijn react/react-dom/react-router/fonts +
engine/shared. **Geen charting-lib** — alle Cadans-grafieken zijn hand-SVG (net als de
zonebalk `silhouetSegments`). De vermogenscurve wordt dus een hand-getekende SVG-lijngrafiek
(watts primair, HR optioneel op een 2e as), gevoed door **gedownsamplede** stream-data uit de
worker (~300–500 punten voor een vloeiende mobiele grafiek). Geen nieuwe dependency, lean.

---

## §3 — GEFASEERD BOUWPLAN (elk STOP-en-verifieer, gate + CI groen, vloeren niet regresseren)

Geen engine-wijziging. Geen schema-migratie (streams worden on-demand gehaald, niet
opgeslagen). De worker hergebruikt de bestaande intervals-auth (`INTERVALS_API_KEY` +
`INTERVALS_ATHLETE_ID`, beide al remote).

**Fase 1 — worker ritdetail-endpoint.** Nieuwe route `GET /api/ride/:id` die on-demand
`/activity/{id}` + `/activity/{id}/intervals` + `/activity/{id}/streams` uit intervals haalt
(hergebruik `intervalsBasicAuth`/`BASE_URL` uit `integrations/intervals.ts`), FTP/gewicht
resolvet, en één model teruggeeft: metrics-tegels + interval-breakdown + de gedownsamplede
stream-arrays. De D1-samenvatting levert de "gratis" velden; de fetch vult de rest. Model-vorm
spiegelt GAS' `rideDetailModel_` waar zinnig, plus een `streams`-veld dat GAS niet heeft.
CC verifieert de exacte intervals-stream-responsvorm empirisch tegen een echt id van Daan
tijdens de bouw (worker heeft de key). Alleen-worker; geen client, geen schema.

**Fase 2 — de ritdetail-popup (client) + Schema-tap.** Een gedeelde popup-component die het
model rendert: kop, zonebalk (bestaande parser), hero, metrics-grid, interval-breakdown, en de
**werkende vermogens/HR-grafiek** (hand-SVG). Trigger 1: in de Schema-tab een "Bekijk
ritdetails"-affordance onder een voltooide rit → popup (GAS-parity). Client-only.

**Fase 3 — tabblad Activiteiten.** Een 5e bottom-nav-tab met een **rittenlijst** (nieuwste
eerst, uit `/api/activities`), tik → dezelfde popup. Dit is meteen de surface waar de
rit-historie zichtbaar wordt (koppelt aan de eerder besproken intervals-backfill: hoe verder
terug gesynct, hoe langer de lijst). Client-only (+ AppShell-nav).

**Later, los:** de full-history-backfill uit intervals (eerder besproken) — vult de
Activiteiten-lijst met diepe historie. Aparte klus; de lijst werkt al op het recente venster.

---

## §4 — OPEN KEUZES VOOR JOU (met advies)

**1. Grafiek-inhoud.** Vermogen-over-tijd is de kern. HR erbij op een tweede as? Hoogte als
zachte achtergrond?
→ **Advies: watts (primair) + HR (secundair) over tijd; hoogte overslaan voor nu.** Dat is de
standaard die een wielrenner verwacht; hoogte is nice-to-have en te veel ruis op mobiel.

**2. Bouwvolgorde t.o.v. het Activiteiten-tabblad.** Popup-vanuit-Schema eerst (fase 2), dan
het tabblad (fase 3) — of andersom?
→ **Advies: Schema-tap eerst** (dat is exact wat GAS had en jouw directe pijn), het tabblad
erna. De popup-component is gedeeld, dus het tabblad is daarna klein.

**3. Backfill nu of straks.** De full-history-backfill koppelen aan dit werk (zodat het
Activiteiten-tabblad meteen diep terug toont), of eerst de feature en de backfill los?
→ **Advies: eerst de feature op het recente venster, backfill als aparte volgende klus.** Houdt
elke stap klein en toetsbaar; het tabblad werkt sowieso.

---

## §5 — WAT DIT NIET RAAKT (grenzen)
- **Geen engine-wijziging** (`packages/engine` read-only; geen autorisatie nodig).
- **Geen schema-migratie** (streams on-demand, niet opgeslagen; `0006` blijft de laatste).
- **Hergebruikt bestaande secrets** (`INTERVALS_API_KEY` + `INTERVALS_ATHLETE_ID`) — geen
  nieuw secret, geen nieuwe auth.
- **`training` @ `3e8090a` onaangeroerd** (alleen lezen).
- **Geen nieuwe dependency** (hand-SVG-grafiek).

### Regel-ankers (gecontroleerd tegen de bron)
GAS @ `3e8090a`: `Script.html:664` knop · `:666` openRideDetail · `:702` de curve-stub ·
`:705` rideSheetHtml_ · `WebApp.gs:870` getRideDetail (activity + intervals fetch, geen
streams) · `IntervalsApi.gs` intervalsRequest_.
Cadans @ `6fc1288`: `schema.ts:71-96` activities-velden (incl. `activity_id_ext`,
`zoneTimesJson`) · `schema.ts:333` zoneTimesFromCell_ · `integrations/intervals.ts`
intervalsBasicAuth/BASE_URL/fetchActivities · `api.ts:154` GET /api/activities · `App.tsx`
4 tabs (geen Activiteiten) · `package.json` geen charting-lib.
