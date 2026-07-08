# RECON — planner-dagtype-model + voltooide-rit-zichtbaarheid

Twee GAS-vs-Cadans-afwijkingen. GAS = spec (training @ 3e8090a, read-only). Bevindingen corrigeren deels
de aanname in de context: GAS HEEFT een dagtype-invoer, en de "Rustdag"-bug zit in de dag-detailkaart.

## Kern
1. **Dagtype is GEEN dead/verkeerde input** — de GAS-Weekplanner heeft een user-input `Dagtype`-dropdown
   (`pendel/vrij/weekend/recovery`) en de engine (`assignWorkouts`) vertakt er zwaar op. "Pendel" is een
   dagtype-WAARDE, geen aparte boolean. Cadans spiegelt dit correct. Geen migratie nodig.
2. **Voltooide-rit-bug** — de Schema-dag-detailkaart rendert ALLEEN geplande sessies; voor een verleden/
   voltooide dag (0 geplande sessies) valt-ie terug op de generieke "Rustdag"-tekst en toont de gereden
   rit NOOIT.

## DEEL A — GAS beschikbaarheid-invoer (`training/src/Planner.gs`)
- **A1 kolommen** (`PLANNER_HEADERS`, A3:H9): A `Train?` (checkbox) · B `Dag` (label) · C `Datum` · D
  `Minuten` · E `Dagtype` (dropdown) · F `Toelichting` · G `Voorgesteld type` (**generator-output**,
  `writeVoorgesteldType`) · H `Gedaan?` (checkbox). `readPlanner` → `{train, datum, minuten, type
  (=dagtype), notitie, voorgesteldType, gedaan}`. Dus invoer = **train + minuten + dagtype + toelichting**.
- **A2:** `Dagtype` (E) IS user-input (dropdown `DAGTYPE_OPTIONS = ['pendel','vrij','weekend','recovery']`,
  `Planner.gs:28`/`:102-106`), pattern-geseed via `materializeWeek_` (`:167`). De trainings-SOORT
  (sweet_spot/vo2/threshold/recovery = `voorgesteldType`, G) is generator-output — dat klopt. Maar dagtype
  (dag-CATEGORIE) ≠ voorgesteldType (workout-type).
- **A3:** "pendel" = een WAARDE van de Dagtype-dropdown, GEEN aparte boolean-kolom. De aanname
  "Train? + Pendel?-toggle" komt niet overeen met de GAS-bron.
- **A4:** minuten = hetzelfde veld (D) voor elke train-dag; pendel-specifieke duur/aantal staan in de
  Settings (`pendelDuurMin`/`pendelAantal`), niet in de planner-rij.

## DEEL B — Cadans planner_days
- **B1 schema** (`schema.ts:122`): `{id, userId, datum, train(0/1), dag, minuten, dagtype, toelichting,
  voorgesteldType, gedaan(0/1)}`. Bevat de `dagtype`-kolom — spiegelt GAS.
- **B2 write:** `PUT /api/planner` + `writePlannerDays` schrijven train/minuten/dagtype/toelichting;
  `voorgesteldType`=null, `gedaan`=0. In de editor is `dagtype` een **blanco `<select>`** ("Dagtype…") —
  GEEN pattern-seed → de gebruiker MOET kiezen. (GAS seed't di=pendel/do=vrij/za=weekend.)
- **B3 generator-gebruik:** `buildWeekProposal` mapt `pd.dagtype → GridDay.type`; `assignWorkouts` vertakt
  op `d.type`: pendel (`planner.ts:344/438/603/632/701/736`), weekend (`:258/281/604/638`), vrij
  (`:592/610/661`), recovery (`:682`). **Dagtype is dus functionele input, NIET dead.**
- **B4 D1-inspectie (read-only, user_id=1, huidige week 07-06..07-12):**
  07-06 train=1 min=75 dagtype=`vrij` · 07-07 train=0 · 07-08 train=1 min=60 `vrij` · 07-09 train=0 ·
  07-10 train=1 min=60 `vrij` · 07-11 train=0 · 07-12 train=1 min=45 `vrij`. `voorgesteld_type`=null,
  `gedaan`=0 overal. → de gebruiker zette ALLE train-dagen op `vrij` (blanco dropdown ingevuld); GAS zou
  di=pendel/za=weekend hebben geseed.

## DEEL C — "Rustdag" toont geen gereden rit
- **C1 kaart-logica:** `deriveSchemaView` (`schema.ts:210-246`) zet `state = today>done>planned>rest`
  (`done` = `doneTss>0`). De dag-detailkaart (`SchemaView.tsx:104-149`) rendert `day.sessions.length===0
  ? "Rustdag — van herstel word je beter." : sessions.map(WorkoutDetail)`. **De kaart toont ENKEL geplande
  sessies.**
- **Waarom 0 sessies op ma 07-06:** `buildWeekProposal` plant alleen `d.train && !d.gedaan && datum ≥
  vandaag` (`proposal.ts:264-270`). 07-06 is VERLEDEN (vandaag=07-08) → niet in `tePlannen` → 0 sessies,
  óók al is het een train-dag. → kaartlichaam = "Rustdag".
- **C2 done-matching:** `doneByDate` (`schema.ts:325-336`) somt activiteiten-TSS per datum, gefilterd op
  `weekDates` (= proposalWeek.days). De 07-06-activiteit (datetime `2026-07-06T19:23:15`, `parseLocalDate`
  → lokaal → `2026-07-06`) MATCHT → `doneTss=118` → state `done` (✓ in DayStrip, meegeteld in WeekLoad).
  MAAR de kaart gebruikt alleen `day.sessions`, niet `doneByDate` → de rit blijft onzichtbaar. `DoneEntry`
  bevat enkel `{tss, minuten}` — geen rit-naam/-type → er is niet eens rit-detail om te tonen.
- **C3 GAS:** `reconcilePlannerWithActivities` (`Sync.gs:567`) tikt `Gedaan` aan voor gematchte train-dagen;
  de rit zelf staat in de Activiteiten-tab/dashboard. GAS' planner markeert done; Cadans markeert done (✓)
  maar de kaart rendert de rit niet.
- **C4 dag-strip:** toont alleen de HUIDIGE week (proposalWeek.days = 7 dagen). De 15 activiteiten
  (12-06..06-07) vallen grotendeels vóór 07-06 → onbereikbaar op de Schema-tab (geen week-navigatie daar;
  wel in de Weekplanner-editor). Alleen 07-06 valt in-week, en die toont "Rustdag".

## DEEL D — Diagnose + gap (feiten, geen fix)
- **Dagtype:** functionele, GAS-getrouwe input (engine vertakt erop). NIET dead, NIET te schrappen zonder
  engine-wijziging. **Geen migratie nodig.** De echte afwijking = UX: Cadans seed't geen dagtype-default
  (blanco dropdown) terwijl GAS di=pendel/do=vrij/za=weekend pattern-seed't. Beslispunt: (a) laten; (b)
  dagtype-defaults seeden (GAS-pattern of Za/Zo→weekend); (c) UI vereenvoudigen naar train+minuten+pendel
  en vrij/weekend/recovery afleiden — dat vergt afleidingslogica of engine-afstemming. **Kolom NIET
  droppen.**
- **Voltooide rit:** ÉÉN oorzaak — de dag-detailkaart rendert alleen geplande sessies; verleden/rust-dagen
  (0 sessies) tonen de generieke "Rustdag"-tekst, de gereden rit wordt nooit gerenderd (en `DoneEntry` mist
  rit-naam/-type). Nodig: (1) de kaart een voltooide rit laten tonen uit de activiteiten (naam/type/tss),
  onafhankelijk van geplande sessies → vereist meer activiteit-velden threaden dan `{tss,minuten}`; (2) om
  óók oudere ritten zichtbaar te maken: week-navigatie/geschiedenis op de Schema-dag-strip (nu current-week-
  only). Beslispunt: kaart-render + al-dan-niet week-nav/geschiedenis-view.
