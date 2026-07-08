# RECON — GAS dagkaart-port-spec (alle toestanden) + pendel-generatie-classificatie

Read-only. GAS = spec (`daanhhk/training` @ `3e8090a`). Twee sporen. Geen fix, geen engine-edit.

## SECTIE A — Schema-dagkaart port-spec (GAS HtmlService, `training/src/Script.html`)

De dag-detail wordt per `d.status` gedispatcht (`Script.html:1078-1102`). Toestanden:

**T1 VOLTOOID** (`doneDetailHtml_`, `Script.html:582-589`):
- Overline: "`<datum> · Voltooid`" + **align-chip** (`alignChip_(c.state, c.chipLabel)`) — de "Anders getraind"-chip verschijnt bij `c.state === 'different'` (gereden ≠ gepland).
- Badge: `coachBadge_(c.done.typeLabel, c.done.badgeZone)` (type van de gereden rit).
- Titel (`coachTitle_`, `:581`): `c.state==='different' ? c.done.typeLabel + '-rit · ' + cfDur_(c.done.duurMin) : c.planned.naam` → bv. "Drempel-rit · 1u01" (naam+`1u01`-duur uit de **activity**).
- **Zone-vergelijking** (`coachZonesHtml_`, `:559-573`): `zcSumByZone_(planned.segmenten)` vs `zcSumByZone_(done.segmenten)`, per Z1..Z5 (`ZCOMPARE_ZONES_`), balk gepland+gedaan overlay, alleen zones met gepland óf gedaan > 0; overline "Zone-vergelijking · min".
- **%-balk** (`coachPctHtml_`, `:574-579`): "Uitvoering volgt plan" + `c.score`%, verborgen bij `different`/`missed`.
- **Coach-impact** (`coachCallout_`) + adapt-knop (`coachAdaptBtn_`, `:613`, uit `coachAdaptatie_`) + ride-affordance.

**T1b GEMIST** (`gemistDetailHtml_`, `:591-607`): "`<datum> · Niet gereden`" + missed-chip; plan-rij "Gepland: `cfDur_(duurMin)` · IF `ifv` · `tss` TSS · niet gereden"; reden-chips; callout.

**T2 GEPLAND/VOORSTEL** (`voorstelKaart`, `:1096/1098`): overline "Gepland"/"Voorstel"/"Vandaag" + de geplande sessie (blokstructuur/zones).

**T3 RUSTDAG** (`:1084`): `<h3>Rustdag</h3>` + "Geen training gepland vandaag. Herstel is training."

Knoppen: "Beschikbaarheid aanpassen" per-dag (`:1106`), "Andere training kiezen" (`:1104`), "Push naar Garmin" week-niveau (`:928/:947`).

**Datacontract** (server, `WebApp.gs` getDashboardState → per-dag `d.coach`, `:1160`):
`planned{naam, typeLabel, badgeZone, duurMin, ifv, tss, segmenten}` + `done{typeLabel, badgeZone, duurMin, segmenten, zonesReal}` + `state`/`chipLabel`/`score` + `callout` + `adaptatie`. `planned.segmenten` = `segmentsFromIntent_` (`:678`); `done.segmenten` = `rideTimeInZone_` (`:801`, uit `icu_zone_times`).

**Levert Cadans dit al?** NEE (grootste gat). Cadans' `DoneEntry` = **`{tss, minuten}`** (`lib/schema.ts`) — MIST: done-rit `typeLabel`/naam/`duurMin`, done zone-minuten, planned zone-minuten (voor de vergelijking), alignment `state`/`score`, coach-`callout`/impact, `adaptatie`. Rauwe ingrediënten bestaan engine-kant (`actualZoneMinutes_`, activity idx1 type/idx2 naam/idx15 `zone_times_json`; planned zones via `SchemaSession.zones/blokken`), maar de **planned-vs-done-alignment + coach-impact-laag ontbreekt volledig** (GAS-coach-engine-port). → het datacontract moet fors UITGEBREID worden.

## SECTIE B — Pendel: GAS vs Cadans + classificatie

**GAS-generatie:** pendel-dag = `pendelAantal` sessies × `pendelDuurMin` (`Algorithm.gs:189-193`:
`sessieCount = isPendel ? Math.max(1, Math.round(settings.pendelAantal)||1) : 1; sessieMin = isPendel ?
(settings.pendelDuurMin || d.minuten) : d.minuten`). Per sessie (`genericPendelZ2` `:2798`,
`genericPendelIntervals` `:2819`): `heen = Math.floor(mins/2), terug = mins - heen` → **de sessie-duur IS de
volledige heen+terug, intern in twee helften gesplitst**. TSS zone-gewogen (`:2856-2875`).

**Cadans (engine + apps/web):** `proposal.ts:299` `sessieMin = settings.pendelDuurMin || d.minuten`;
`pendelAantal` sessies; engine `planner.ts:410` `settings.pendelDuurMin || 80` (allocator-duur). De
pendel-workout-builders (geport) splitsen heen/terug identiek. → **spiegelt GAS exact.**

**D1-settings (user_id=1):** `ftp=280, gewicht=75, doel=VO2max, pendel_duur_min=75, pendel_aantal=1`. Dus
pendel-dag = **1 sessie van 75 min** (≈37 heen + 38 terug). De ingevoerde planner-minuten (Vr = 60) worden
**GENEGEERD** (`pendelDuurMin=75` overruled `d.minuten`) → de **minuten-slider is een no-op op een pendel-dag**.
De default-80-fallback (`planner.ts:410`) wordt NIET geraakt (75 is gezet). De pendel-instelling IS geport
(settings-veld aanwezig + gevuld).

**CLASSIFICATIE: (c) GAS-GETROUW.** Cadans doet exact wat GAS doet (pendelDuurMin-round-trip, intern
heen/terug-gesplitst, dag = `pendelAantal` sessies). Jouw model "ingevoerde min = 1 leg, dag = heen+terug
(2×)" is een **GEDRAGSWIJZIGING** t.o.v. GAS (GAS: de duur ÍS de round-trip). Secundair (a) SETTING-nuance:
`pendelDuurMin=75` overruled de slider (GAS-getrouw). NIET (b) engine-divergentie (engine == GAS).

**Laagst-invasieve fix (geen engine-change, GEEN engine-sign-off):** de "×2/leg"-interpretatie zit in de
DUUR-berekening, niet in de split. In `apps/web/proposal.ts` de pendel-`sessieMin` uit de ingevoerde
minuten afleiden (bv. `sessieMin = 2 × d.minuten` = round-trip uit 1 leg) i.p.v. `pendelDuurMin`; de engine
splitst die 150 dan gewoon in 75+75 (ONGEWIJZIGD). Dit is een apps/web + settings-ontwerpbeslissing
(`pendelDuurMin` deprecaten/herduiden) — **akkoord + ontwerp vereist**, maar geen engine-edit.

## SECTIE C — Bouw-volgorde-advies
1. **Pendel-fix EERST** (klein, apps/web-only, geen engine): lost de directe verwarring op (slider = no-op /
   ×2-model). Laag risico, geen sign-off.
2. **Dagkaart-VOLTOOID DAARNA** (groot): vereist eerst een uitgebreid per-dag done-contract (rit
   type/naam/duur + zone-minuten uit de activity) — GEFASEERD: (2a) toon de gereden rit (naam/type/duur +
   zone-balk) uit de activity; (2b) planned-vs-done-alignment (`state`/`score`); (2c) coach-impact/`callout`
   + adaptatie (grootste port). Afhankelijkheid: (2b/2c) bouwen op (2a); onafhankelijk van de pendel-fix.
