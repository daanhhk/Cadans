# RECON — mobiele "Beschikbaarheid"-invoer + dagtype-afleiding (GAS)

Vervolg op `docs/PLANNER-DAYTYPE-DONE-RECON.md` (de spreadsheet-Planner-tab + dropdown zijn daar
gedekt — NIET herhaald). Doel: de MOBIELE/aparte beschikbaarheid-invoer + de EXACTE dagtype-afleiding.
Bron: `daanhhk/training` @ `3e8090a` (read-only bevestigd).

## Kern
GAS heeft een **mobiele "Beschikbaarheid"-editor** in de HtmlService-web-app (NIET alleen de
spreadsheet-dropdown). Het invoer-model is **Train? + minuten + Pendel?** — GEEN dagtype-keuze. Dagtype
wordt **client-side AFGELEID**; `recovery` wordt daar NOOIT geproduceerd. Dit bevestigt het door Daan
gekozen ISSUE-1-model exact.

## Q1 — Bestaat er een mobiele/aparte Beschikbaarheid-invoer in 3e8090a? **JA**
- Client: `src/Script.html:950-1044` — de "Beschikbaarheid-editor" (overlay-sheet in de web-app):
  `availDayControls_` (`:973`), `availSheetHtml` (`:985`), `saveAvailEditor` (`:1032`).
- Server: `src/WebApp.gs:1417` `saveAvailability(updates)` schrijft `A3:A9` (Train?), `D3:D9` (Minuten),
  `E3:E9` (Dagtype) — `:1434-1436`. `saveAvailabilityPlus1` (`:1467`) = idem voor de +1-week.
- Bewijs-comment (`Script.html:952-953`): "Dagtype (E) afgeleid … pendel→'pendel', anders Za/Zo→'weekend',
  anders 'vrij'; nooit 'recovery'."

## Q2 — Exact input-model + handler→dagtype-mapping
**Invoervelden per dag** (`availDayControls_`, `Script.html:973-983`):
- **Train?** toggle (`:977`, `availSetTrain` `:1025`).
- **minuten** slider, `[30,360]` step 15, default 120, alleen zichtbaar bij Train-aan (`:965-967`,
  `:978-981`, `availSetMin` `:1027`).
- **Pendel?** toggle (`:982`, `availSetPendel` `:1026`).
- Scope-segment: "Alleen deze dag" / "Deze week" / "Volgende week" (`:986-990`).
Er is GEEN dagtype-dropdown en GEEN recovery-optie in de mobiele editor.

**Afleiding bij opslaan** (`saveAvailEditor`, `Script.html:1034-1036`) — geciteerd:
`var dagtype = d.pendel ? 'pendel' : ((i === 5 || i === 6) ? 'weekend' : 'vrij');`
waarbij `i` = slot 0..6 (Ma..Zo). Dus: **pendel-toggle aan → `pendel`; anders slot 5/6 (Za/Zo) →
`weekend`; anders → `vrij`.** Daarna `saveAvailability(updates)` (`:1043`).
**Round-trip:** bij laden (`availLoad_`, `:1009-1010`) wordt de Pendel-toggle terug-afgeleid uit de opslag:
`pendel: (d.dagtype === 'pendel')`. `weekend`/`vrij` worden NIET naar een toggle teruggemapt — ze worden
elke save opnieuw uit de weekdag berekend.

## Q3 — Port-bron heroverwegen?
**Niet nodig.** De mobiele invoer bestaat in `3e8090a`; de live-app is (voor dit onderdeel) NIET nieuwer
dan de bron-commit. De port-bron voor de dagtype-afleiding = `Script.html:1035`.

## Q4 — Herkomst dagtype `recovery`
**Nooit auto-afgeleid, nooit uit de mobiele flow.** De mobiele editor produceert alleen
`pendel`/`weekend`/`vrij` (`Script.html:1035`, expliciet "nooit 'recovery'" `:953`). `recovery` is UITSLUITEND
een handmatig te kiezen waarde in de spreadsheet-Planner-dropdown (`DAGTYPE_OPTIONS =
['pendel','vrij','weekend','recovery']`, `Planner.gs:28`) en zit NIET in de pattern-seed
(`PLANNER_DEFAULTS` heeft geen recovery — zie Q5). Het is GEEN readiness/HRV/vorm-afgeleid signaal — dat
readiness-pad demoot de WORKOUT (`voorgesteldType` via het `signal`/`demoteType_`-pad), NIET het
dagtype. → dagtype-`recovery` = spreadsheet-only, handmatig.

## Q5 — `materializeWeek_` weekdag→dagtype-tabel (spreadsheet-pattern, fallback-bron)
`materializeWeek_` (`Planner.gs:167`) seed't uit `getPattern()` → `PLANNER_DEFAULTS` (`Planner.gs:30-34`):
- slot 1 = **Di** → `pendel`, 150 min
- slot 3 = **Do** → `vrij`, 90 min
- slot 5 = **Za** → `weekend`, 120 min
- Ma/Wo/Vr/Zo → geen train (geen dagtype)
Ook hier: **geen `recovery`.** De mobiele editor OVERSCHRIJFT dit pattern met zijn eigen afleiding
(pendel-toggle + Za/Zo→weekend + vrij).

## Aanbeveling (feiten-gebaseerd; geen fix)
- **Meest getrouwe port-bron voor Cadans = de mobiele handler** (`Script.html:1035`), niet
  `materializeWeek_`. Regel: `pendel ? 'pendel' : (Za|Zo ? 'weekend' : 'vrij')`, met `i` maandag-geïndexeerd
  (Za=5, Zo=6). Cadans' huidige `dagtype`-`<select>` in de Weekplanner-editor moet dus VERVANGEN worden
  door een Pendel?-toggle + deze afleiding (Train?+minuten+Pendel?), waarbij de `planner_days.dagtype`-kolom
  behouden blijft (engine `assignWorkouts` leest 'm; NIET droppen).
- **Recovery-gat = BEWUST in GAS.** Het Train?+Pendel?-model produceert nooit dagtype-`recovery`; GAS doet
  dat ook niet mobiel. De recovery-behoefte loopt via het readiness-`signal` (workout-demote), niet via
  dagtype. → Cadans hoeft het recovery-gat NIET te dichten in de dagtype-afleiding (GAS-getrouw); een
  aparte beslissing als Cadans later readiness-gedreven rustdagen wil.
