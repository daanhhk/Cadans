# FASE 2 · §5b RECON — de GEPLAND-kaart (voorstel: train=1, gedaan=0)

Read-only bevinding. Meetlat = `docs/VORMGEVING-SPEC.md` §5b + GAS (`C:\Users\daan\Projects\training`, HEAD
`3e8090af11f146d54bf7116e4d4b4c7d9802ecf2`). Cadans HEAD bij recon: `35024b4`. GEEN code gewijzigd.

## KERNCONCLUSIE

- **(a) Wat rendert §5b nu fout + uit welk veld.** De gepland-kaart (`WorkoutDetail.tsx:104` en `:162` →
  `ZoneBars.tsx`) toont **horizontale per-zone-TOTAAL-bars**: 5 vaste rijen Z1–Z5, elke balkbreedte ∝ de SOM
  van de minuten per zone, geaggregeerd uit `session.blokken` via `minByColor` (`ZoneBars.tsx:20-28`). De
  tijd-volgorde en de per-interval-intensiteit gaan verloren. GAS toont daar géén zone-totalen.
- **(b) Blokdata bestaat al? JA.** Per-interval `session.blokken: SessionBlok[]` = `{ minuten, hoogtePct,
  color }` (`schema.ts:101-105`); `hoogtePct` (25/45/65/85/100, `schema.ts:91-98`) draagt de
  intensiteits-staafhoogte maar wordt NERGENS gerenderd (ZoneBars negeert 'm — dead field in de render-laag).
  Plus `session.structuur` (5-tuples `[label, dur, watt, hr, note]`, `schema.ts:124`) voedt de uitklap
  `BlockList.tsx`. Beide komen client-side uit engine `buildWorkout` (`@cadans/engine`, `proposal.ts:5`) via
  `ProposalWorkout` (open `[k]: unknown`, `proposal.ts:36-42`) → `toSession` (`schema.ts:475-505`). GEEN
  api/shared/D1-round-trip voor de blokstructuur.
- **(c) GAS §5b toont X.** Een **proportionele per-interval workout-bar** `zoneBar(segmenten)`
  (`Script.html:236-252`): elk segment krijgt een `<rect>`, x cumulatief = tijd-volgorde, breedte ∝ minuten,
  **hoogte = `sg.hoogtePct`** (intensiteit) — een workout-silhouet. Plus `zoneLegend_` en een inklapbare
  "Blokstructuur · N blokken" (`zoneBlock_`, `Script.html:370-377`) die per-blok label·duur·watt toont
  (`blokLijstStruct_`, `Script.html:340-346`). Aangeroepen via `voorstelKaart` (`Script.html:395`, render
  `:412`).
- **(d) Meetlat-discrepantie? JA.** `VORMGEVING-SPEC.md:54` zegt letterlijk "zone-bars" met verdict
  "grotendeels ✓". De term is ambigu: hij onderscheidt proportioneel-silhouet (GAS) NIET van zone-totalen
  (Cadans-nu), en noemt de collapsible Blokstructuur-uitklap niet. De FASE-1-§5c-herbouw las 'm als
  zone-totalen → divergentie van GAS. (GEEN spec-wijziging hier — alleen vastgesteld.)
- **(e) Voorgestelde herordening (één regel, NIET implementeren).** Geef §5b een proportionele per-interval
  workout-bar terug (consumeer de al aanwezige `SessionBlok.hoogtePct` + interval-volgorde, à la GAS
  `zoneBar`) en reserveer `ZoneBars` (zone-totalen) / `ZoneCompare` voor de done-kaarten (§5d/§5c) —
  render-only, geen engine/DTO-wijziging.

---

## STAP 1 — §5b-render-boom (apps/web)

De gepland-kaart is de niet-done, `sessions.length>0`-tak in `SchemaView.tsx:156-188` → per sessie een
`WorkoutDetail`. Render-boom + volgorde:

- `SchemaView.tsx` (dispatch) → **`WorkoutDetail.tsx`** (§5b), per sessie.
  - `Overline` (alleen bij multi-sessie: "Sessie i/N", `WorkoutDetail.tsx:28`).
  - naam (`session.naam`, `:39`) + focus (`session.focus`, `:41-52`).
  - duur/TSS-rij (`session.totaalMin` / `session.tss`, `:54-77`).
  - **`ZoneBars.tsx`** (`session.blokken`) — zit in de toggle-`<button>` bij `hasBlocks`
    (`WorkoutDetail.tsx:104`), anders standalone (`:162`).
  - "Blokstructuur / N blokken"-chevron (`:114-155`) → default INGEKLAPT (`openBlocks=false`, `:20`) →
    `<div hidden>` met **`BlockList.tsx`** (`session.structuur`, `:157-159`).
  - eindopmerking (`session.eindopmerking`, `:165-178`).

## STAP 2 — wat §5b NU toont (per element)

| element | bron-veld | bestand:regel |
|---|---|---|
| naam | `session.naam` | `WorkoutDetail.tsx:39` |
| focus (subtitel) | `session.focus` | `WorkoutDetail.tsx:41` |
| duur · TSS | `session.totaalMin` / `session.tss` | `WorkoutDetail.tsx:56/67` |
| zone-weergave | `session.blokken` → **zone-TOTALEN** | `ZoneBars.tsx:20-28` |
| Blokstructuur-uitklap | `session.structuur` (label·dur·meta) | `WorkoutDetail.tsx:157` → `BlockList.tsx:8-11` |

- **Zone-weergave = ZONE-TOTALEN, niet proportionele blokken.** `ZoneBars` bouwt `minByColor` (som per
  zone-kleur) en tekent 5 vaste rijen Z1–Z5, breedte ∝ `minuten/scale` (`ZoneBars.tsx:20-34,84-92`). Geen
  interval-volgorde, `hoogtePct` ongebruikt.
- **Blokstructuur-uitklap** zit in `WorkoutDetail.tsx:79-160`, **default ingeklapt** (`useState(false)`,
  `:20`), teller "N blokken" uit `session.structuur.length` (`:134`); expand toont `BlockList` = per rij
  `label` + `dur` + `meta` (watt·hr·note join, `BlockList.tsx:9-13`).
- **Vermoeden BEVESTIGD:** de horizontale zone-totaal-bars uit de FASE-1-§5c-herbouw lekken op §5b.
  `ZoneBars.tsx:3-8` is expliciet "design-geankerd op de ZoneCompareRow-structuur uit
  `design/src/coach-feedback.jsx`" en "Vervangt de verticale ZoneBar + de losse pill-ZoneLegend" — die
  vervangen "verticale ZoneBar" was het proportionele silhouet. `ZoneBars` wordt gebruikt op §5b
  (`WorkoutDetail.tsx:104/162`) én §5d (`DoneDetail.tsx:55`); §5c gebruikt de aparte `ZoneCompare`
  (`DoneCompareCard.tsx:191`).

## STAP 3 — blokdata-bron door de lagen

- Type: `SessionBlok = { minuten, hoogtePct, color }` (`schema.ts:101-105`), afgeleid door `blokFromEngine`
  uit rauw engine-blok `{ minuten, zone, pctLo?, pctHi? }` (`schema.ts:107-115`); `structuur` = `string[][]`
  5-tuples (`schema.ts:124`).
- Herkomst: engine `buildWorkout` (`@cadans/engine`, geïmporteerd `proposal.ts:5`, aangeroepen `:314`/`:338`)
  emit → `ProposalWorkout` (open index-type `[k]: unknown`, `proposal.ts:36-42`) → `toSession`
  (`schema.ts:475-505`, `blokken`/`structuur` cast op `:479-488`). **Client-side**, geen worker/D1-tussenstap
  voor de blokstructuur.
- /preview-fixture (gepland-dag, "Volle week", Do `2026-07-09`, `Preview.tsx:85-113`): draagt zowel `blokken`
  (arg 5 van `wo()`) als een `structuur`-5-tuple-array (arg 6) → de fixture dekt de volledige blokstructuur.

## STAP 4 — GAS §5b-referentie (read-only, HEAD `3e8090a`)

- `voorstelKaart(v)` (`Script.html:395`) rendert de voorstel/workout-kaart → `zoneBlock_(v.segmenten,
  v.structuur)` (`:412`).
- `zoneBlock_` (`Script.html:370-377`): `<details>` met `<summary>` = `zoneBar(segs)` + `zoneLegend_(segs)` +
  "Blokstructuur · N blokken ⌄"; expand = de blok-lijst (`blokLijstStruct_`, watt) — **default ingeklapt**
  (`<details>` zonder `open`).
- `zoneBar(segmenten)` (`Script.html:236-252`) = **proportioneel per-interval silhouet**: per segment een
  `<rect>`, x cumulatief (tijd-volgorde), breedte ∝ `sg.minuten/totMin`, **hoogte = `sg.hoogtePct`**,
  kleur = zone.
- **Beslecht:** GAS §5b toont de BLOKSTRUCTUUR als proportioneel silhouet + uitklapbare blok-lijst
  (label·dur·watt), NIET horizontale zone-totalen. Bewijs: `Script.html:236-252` (`zoneBar`) + `:340-346`
  (`blokLijstStruct_`) + `:370-377` (`zoneBlock_`) + `:412` (`voorstelKaart`).

## STAP 5 — meetlat-check

- Exact citaat (`docs/VORMGEVING-SPEC.md:54`):
  `5b · GEPLAND (toekomst/train): type-pill + workout-naam + duur + zone-bars = engine voorstel · grotendeels ✓`
- Beoordeling: "zone-bars" matcht NIET eenduidig met wat GAS §5b toont (proportioneel per-interval silhouet +
  Blokstructuur-uitklap). De term is ambigu — leesbaar als "per-zone-totaal-bars" (Cadans-nu) óf als "de
  zone-gekleurde workout-bar" (GAS) — en de spec-regel noemt de collapsible Blokstructuur niet. Het verdict
  "grotendeels ✓" verhulde de proportioneel-vs-totalen-divergentie. **Discrepantie: JA.** (Geen
  spec-wijziging — alleen vastgesteld.)
