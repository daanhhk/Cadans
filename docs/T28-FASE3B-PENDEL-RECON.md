# T28 FASE 3b — RECON PENDEL-WEERGAVE (read-only)

**Status:** recon. Geen code gewijzigd; `git diff --stat packages/engine` leeg. GAS van schijf
gelezen (`C:\Users\daan\Projects\training` @ `3e8090a`), nooit via WebFetch.

**Vraag:** toont Cadans een pendeldag met 2 ritten als twee trainingen, elk met gepland ÉN gedaan?

**Kort antwoord:** het GEPLANDE deel is al goed — twee losse blokken met "Sessie 1/2" en "Sessie 2/2".
Het GEDANE deel niet: zodra er gereden is, verdwijnt de per-sessie-weergave en zie je één
samengevatte dag-status, vergeleken tegen alléén de laatste geplande sessie. **3b is dus niet
cosmetisch maar een done-koppeling.**

---

## §1 — De geplande weergave: WERKT AL

`SchemaView.tsx:280-300` rendert elke sessie als eigen blok, met scheidingslijn en overline:

```tsx
{day.sessions.map((s, i) => (
  <div key={…} style={i > 0 ? { borderTop: "1px solid var(--border-subtle)", … } : undefined}>
    <WorkoutDetail
      session={s}
      overline={day.sessions.length > 1 ? `Sessie ${i + 1}/${day.sessions.length}` : undefined}
    />
  </div>
))}
```

Rit 1 = geforceerd `pendel_z2`, rit 2 = het coach-type (`proposal.ts:536-537`). Dat deel van de
doel-eindstaat staat er dus al.

**Multisessie-guards elders** (geen van beide is een weergave-probleem, wel goed om te weten):
`schema.ts:817` — `if (day.sessions.length !== 1) return null;` slaat het verlicht-voorstel over op
een pendeldag (bewust, GAS doet hetzelfde: `WebApp.gs:1213`). `weekplanBlob.ts:138-144` vat
multisessie samen in de blob-naam.

## §2 — De gedane weergave: HIER ZIT DE GAP

Drie plekken, samen één probleem:

1. **De done-dispatch komt vóór de sessie-lijst.** `SchemaView.tsx:220`: `day.done ? (DoneCompareCard
   / DoneDetail) : … : day.sessions.length === 0 ? (rustdag) : (sessions.map)`. Zodra de dag "done"
   is, wordt de sessie-lijst **niet meer gerenderd** — je ziet één done-kaart in plaats van twee ritten.
2. **Alle ritten van een dag worden tot één entry samengevoegd.** `schema.ts:1305`:
   `doneByDate[key] = prev ? mergeDone(prev, de) : de;` — `mergeDone` (`:351`) telt zone-minuten op en
   kiest de langste rit als "primary" voor naam/type. Er is per datum precies één `DoneEntry`.
3. **De vergelijking pakt alleen de LAATSTE geplande sessie.** `schema.ts:1077`:
   `const plannedForCompare = d.plannedForDone ?? d.sessions[d.sessions.length - 1] ?? null;`

**Concreet voor twee pendelritten:** je krijgt één gedaan-status voor de hele dag, vergeleken tegen
alleen de terugrit. De heenrit (Z2) heeft géén eigen gepland-vs-gedaan. `isDone = doneTss > 0`
(`schema.ts:1044`) is per dag, dus ook "half gereden" bestaat niet als toestand.

**Scope-gevolg:** 3b vraagt een per-rit-koppeling tussen activiteiten en geplande sessies (welke rit
hoort bij welke sessie — op tijdstip? volgorde? duur?), een done-status per sessie, en een
render-tak die op een done pendeldag alsnog twee blokken toont. Dat is een groter stuk dan de
split-opruiming uit §3.

## §3 — De binnen-sessie heen/terug-split opruimen

**`genericPendelZ2` (`planner.ts:1982`, rit 1 — pure Z2).** `heen = Math.floor(mins/2)`,
`terug = mins − heen`, en de structuur is **twee identieke Z2-blokken** met dezelfde watt-/bpm-range
en dezelfde note ("Rustige Z2"). Onder per-rit-semantiek (fase 3a) beschrijft één rit dus een heen
én een terug — dat klopt niet meer. **Schoonste opruiming: één blok "Hele rit".** `totaalMin: mins`
en `tss: Math.round(mins * 0.6)` staan los van de structuur en blijven ongewijzigd.

**`genericPendelIntervals` (`:2024`, rit 2 — met werkblok).** Structuur is
`["Heen Z2", heen min, …, "Aanrijden naar werk, rustig"]`, dan `blok` (`"Terug-sweetspot"` /
`"Terug-intervallen"` / `"Terug-tempo"` / `"Terug-low-cad"`), dan `["Cooldown", "5 min", …]`.

> **De aanname uit de opdracht klopt half.** "Heen Z2" ís inderdaad functioneel de warmup vóór het
> werkblok — een legitieme opbouw. Maar het probleem is grover dan alleen dat label: **ook het
> WERKBLOK heet "Terug-…"**. Eén rit draagt dus zowel een "Heen" als een "Terug" in zijn structuur.
> Alleen de warmup hernoemen laat de andere helft van het artefact staan.
>
> **Voorstel: beide labels ontdoen van de richting-connotatie** — "Heen Z2" → "Warming-up",
> "Terug-sweetspot" → "Sweet spot"-blok enz. Structuur, `totaalMin` en `tss` ongewijzigd; puur
> labels. Let op: `heen = floor(mins/2)` maakt de warmup de halve rit — bij 75 min is dat ~37 min
> warmup. Dat is als aanrijden-naar-werk verdedigbaar, maar als generieke workout-opbouw fors. Of
> die verhouding mee moet, is een **aparte beslissing** (§4).

**Raakt dit de engine? JA** — beide generics staan in `packages/engine/src/planner.ts`. De fix vraagt
dus engine-autorisatie, en de selftest-assert-count stijgt.

**Betrokken selftest-asserts** (leesbaarheid voor de latere fix): `selftest.test.ts:1641-1643`
(`buildWorkout("pendel_z2", …).focus`), `:1929` (`dW(1,"pendel",0)` in de allocator-fixture),
`:1991-1992` (`alloc klim Build pendel endurance` → `pendel_z2`), `:2064` (`alloc Base pendel kan
quality`). **Geen enkele assert test de structuur-array zelf** — de labels zijn dus vrij te wijzigen
zonder een bestaande assert te breken; de nieuwe asserts moeten de opgeschoonde structuur juist
vastleggen.

## §4 — GAS-vergelijking: Cadans mist niets

`dashDayCard_` (`WebApp.gs:655`) krijgt `actual` als **één waarde per datum**
(`actuals = dashActualsByDate_(…)`, `:1049`; gebruikt als `actuals[dISO]`, `:1132`/`:1137`). De
status is `'voltooid'` zodra er íéts gereden is — precies zoals Cadans' `isDone`.

Op de PLANNED-kant heeft GAS wél een per-sessie-uitsplitsing (`:672-677`,
`if (wpEntry.sessies && wpEntry.sessies.length > 1) voorstel.sessies = …` met eigen zonebar) — het
equivalent van Cadans' `sessions.map` + `WorkoutDetail`.

**Conclusie: GAS koppelt gedaan óók per DAG, niet per rit.** Cadans mist dus niets dat GAS heeft; een
per-rit-done-koppeling zou een Cadans-eigen verbetering zijn, geen parity-herstel. Dat maakt het een
zuivere coaching-deugdelijkheid-afweging, zonder GAS-meetlat.

## §5 — Open beslissingen voor 3b

1. **Scope.** Alleen de split-opruiming (§3, klein, engine-labels) of ook de per-rit-done-koppeling
   (§2, groter)? Ze zijn onafhankelijk.
2. **Koppelregel bij per-rit-done:** hoe wordt een gereden rit aan een geplande sessie gekoppeld —
   op tijdstip (ochtend/avond), op volgorde, of op duur-match?
3. **Half-gereden dag:** één rit gereden van twee — welke status toont de dag dan?
4. **Warmup-verhouding** in `genericPendelIntervals`: blijft de warmup `floor(mins/2)`, of past een
   vaste/kleinere warmup beter nu een sessie één rit is?

---

*Recon, geen bouw. `packages/engine` ongemoeid; `training` alleen gelezen @ `3e8090a`.*
