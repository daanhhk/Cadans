# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**FASE 1 + FASE 2 (§5b + 4b + brok 2 + brok 3 + brok 4a + brok 5) — deze reeks chats. FASE 2 = COMPLEET.** Meetlat =
`docs/VORMGEVING-SPEC.md` (BEVROREN); geverifieerd via de dev-`/preview`-loop. Brok 3 = de EERSTE prod-aanraking
(remote-D1 + deploy).

**VLOEREN** (mogen niet regresseren; NIET in prompts hardcoden): engine-selftest-assert-count **957** ·
vitest-totaal **310** (FASE 3a −4 dode make-up-tests → 300; Niveau test-modus +5 → 305; laag-3b override +5 → 310).
_(Vorige stand: was 304 → daling naar 300 in FASE 3a, `schema.test.ts` 45 → 41; GEEN regressie.)_

### BRONHIERARCHIE VOOR PARITY (werkwijze — vast)
- **daanhhk/training is PUBLIC + BEVROREN op `3e8090a`.** De chat leest de GAS-bron DIRECT via
  `raw.githubusercontent.com/daanhhk/training/3e8090a/<pad>` — dat is de EERSTE reflex bij ELKE parity-vraag, niet
  een samenvatting.
- De regel "de chat kan de repo niet lezen" geldt ALLEEN voor de LEVENDE lokale Cadans-repo (ongecommit werk → via
  Claude Code), NIET voor de bevroren GAS-bron.
- **VORMGEVING-SPEC + HANDOFF = gepinde SAMENVATTING, geen vervanging.** Verifieer elke parity-claim tegen de bron;
  een samenvatting kan de VERKEERDE fn als meetlat nemen.
- **Concreet (brok 5):** een samenvatting claimde "GAS = 3 zones / de port wijkt af van 5-bucket". De bron toonde
  3-bucket in de ENGINE-laag (`Algorithm.gs:364`, load/debt) NAAST 5-bucket in de WEB-APP-laag (`WebApp.gs:728`,
  display). De juiste meetlat was de web-app-fn → de fix werd CLIENT-ONLY i.p.v. engine-rakend.
- **Grens:** puur-VISUELE GAS-rendering (spacing/pixels) → screenshot of eigen oog; de LEVENDE Cadans-repo → CC.

### PROMPT-VORM (werkwijze — deze sessie)
CC-prompts zijn nu **SPEC-GEDREVEN by default**: architectuur + exact gedrag + sleutel-logica + gate; CC schrijft de
code, vindt de call-sites zelf en past aan de ECHTE staat aan (i.p.v. letterlijke str_replace-blokken). EXACTE code
alleen als ANKER bij FRAGIELE edits (byte-getrouwe GAS-mirrors, TZ-grens-logica, formules/zone-mappings). CC meldt
in elk rapport de kern-implementatiekeuzes (gekozen conditie, plaatsing) zodat review tegen de spec kan zonder de
volledige diff.

**FASE A GEDEPLOYD (A1-A4 + B1) — LIVE op prod, Version `171f79fc`** (was `52a51ae9`; de deploy bundelde
A1/B1/A3/A2/A4). A2/A4 laatste: disposition-backend `6929741`, disposition-UI + gemist-kaart `d8c70e4`. Prod =
Basic-Auth-gated (`/api/health` → 401 + `WWW-Authenticate: Basic`); functionele round-trip in-browser door Daan.
- **A2/A4 visuele check — DOORGESCHOVEN naar de live-aankomende-week:** de affordance verschijnt vanzelf op een
  doordeweekse vandaag-zonder-rit (geen LAN-dev-server-checklist meer nodig). **ARCHITECTUUR-NOOT:** "Niet gedaan?"
  toont ALLEEN op vandaag/toekomst — verleden dagen missen een voorstel (`proposal.ts:294` assignt alleen ≥ vandaag;
  GAS bewaart weekplan-snapshots, Cadans niet). Bewezen GAS-conform (`canDispose` spiegelt `Script.html:448`).
  Verleden-dispositie deelt de weekplan-persistentie-fundering (aanpak-B) met de DayStrip-venster-feature.
- **A4 = SIMPELE gemist-kaart (bewust).** De rijke frame-10 (`gemistDetailHtml_`: planregel +
  reden-herkiezer + coach-box) = DOEL, gebouwd IN/NA B4 (deelt B4's coach-adaptatie + de
  plan-only missed-`coachFeedback_`). De A2-plumbing (disposition-map → deriveSchemaView →
  "gemist"-state → SchemaDay.dispositie → affordance) is frame-10-klaar; de upgrade is een
  body-swap.
- **FASE B recon-doc:** `docs/FASE-B-OVERRIDE-ADAPTATIE-RECON.md` — override + picker + B4-
  adaptatie in kaart. KERN: de engine-kern is al geport; ontbreekt = client-orkestratie + UI;
  de override-backend is de gedeelde B3/B4-fundering. Bevat de port-correctheid-caveat.

**PROD LOOPT ACHTER OP MAIN.** main HEAD = `7060bfd` (FASE B **laag-3b**); prod draait nog Version
`02b6abb9-fe02-4a00-bac0-db8253950b4b` = **main t/m `aeafcc9`** (de Niveau-fixes). **laag-3b (`7060bfd`) is NIET
gedeployd** → deploy kan mee met B3 of los. Version-log deze reeks: `43ab5f03` (coach-narrative-reeks) → `479403a9`
(FASE 3a+3b) → `02b6abb9` (Niveau test-modus + FTP-band). Remote D1 ONGEWIJZIGD t/m `0003_wise_sunset_bain.sql`
(geen nieuwe migratie deze reeks). Basic-Auth-gate actief (`/api/health` → 401 + `WWW-Authenticate: Basic`);
functionele round-trip in-browser door Daan.

**NIEUW GEBOUWD & LIVE deze reeks** (samengevat, niet elke commit; canonieke copy-/persona-bron =
`apps/web/src/lib/coachNarrative.ts`):
- **Auto-sync bij app-open** (`155b655`): fire-and-forget intervals-sync bij mount (spiegelt GAS
  onState → refreshActivities → idempotente her-render), ↻-knop VERWIJDERD, "Laatst gesynct"-regel, in-memory
  staleness-guard (`lib/syncStatus.ts`). Selectie-behoud bij de re-derive = by-construction + in-browser bevestigd.
- **Model-2 bevestiging** (read-only test `d74e257`): de weekgen stuurt de dagen ≥ vandaag al bij op basis van
  gereden actuals (dekking/`zoneDebt_`/`recentHardDate_`) + avoid-consecutive-hard (`planner.ts`) mét
  debt-exceptie. Dit VERVANGT het override-make-up-model als PRIMAIR (zie §Geparkeerde debts).
- **Engine `redenCode`** (`83f3740` + `f498163` allocator-takken): additief veld op ProposalDay/GridDay NAAST de
  byte-identieke reden-strings (957 ongemoeid) → **client coach-narrative-laag** (`lib/coachNarrative.ts`): warme,
  gevarieerde per-dag coach-copy met deterministische seed (`datum|code|persona`), persona-gedimensioneerd.
- **coachPersona-instelling** (`36a0b7b`, migratie 0003): settings-kolom + kiezer-UI (warm actief;
  disciplined/statistical "binnenkort", lege pools → fallback warm).
- **Gedeelde `CoachCallout`** (`c800d47`): de per-dag-narrative staat nu in het coach-blok (glyph + coachnaam) boven
  de training i.p.v. een kale regel; byte-identiek met de voltooid-kaart-coach-box.

**FASE 3 (Brok 3) — client-only opruim + gemist-narrative zichtbaar** (gate + CI groen, telefoon-geverifieerd;
GEDEPLOYD in Version `479403a9`):
- **3a — verlaten override-make-up-MODEL verwijderd** (`0c954258`): uit `apps/web/src/lib/schema.ts` weg:
  `applyMakeupAdaptations`-post-pass + aanroep, `MakeupAdaptatie`-type, `SchemaDay.makeupAdaptatie`-veld,
  client-imports `coachAdaptatie_`/`getTrainingLibrary_` (+ de dode `DayOverride`-import). De ENGINE-fns
  `coachAdaptatie_`/`coachFeedback_` (`packages/engine/src/coach.ts`) ONGEMOEID = bron van waarheid; Model 2
  (auto-herplannende weekgen) is primair. `deriveSchemaView`-signatuur behouden; ongebruikte params → `_overrides`/
  `_settings` (conform `_readiness`). CI: https://github.com/daanhhk/Cadans/actions/runs/29353107022
- **3a — BlockList duplicate-React-key gefixt** (`0c954258`): key → blok-index (`biome-ignore noArrayIndexKey`,
  statische read-only lijst).
- **3b — gemist-dag coach-narrative ZICHTBAAR** (`faab52cb`): `missedCoach_`-narrative rendert nu in `GemistCard` in
  het gedeelde `CoachCallout`-formaat, ONDER de "Gemist · <reden>"-rij. Alleen `coach.narrative` — NIET `coach.adapt`
  (hoort bij het verwijderde make-up-model). `impact=false`. De done-box (`DoneCompareCard`) bewust NIET aangeraakt.
  CI: https://github.com/daanhhk/Cadans/actions/runs/29355111917 · telefoon-check (Vite dev `192.168.1.201:5173`,
  Schema-tab): een gemist-dag toont de narrative in het CoachCallout-blok onder de gemist-rij — correct.

**NIVEAU doel-projectie — test-modus + FTP-band-fix (2 commits, CLIENT-ONLY, engine ongemoeid; GEDEPLOYD in Version
`02b6abb9`):**
- **`7308d660` "honour 'test' projection mode for FTP goal" — PORT-OMISSIE HERSTELD:** `DoelProjectie.tsx` gebruikte
  `projectieMode` alleen voor een kop-label; de gap-machinerie draaide onvoorwaardelijk. GAS onderdrukt bij een
  FTP-doel (`GOAL_PROFILES_.ftp`, projectieMode `test`, `WebApp.gs:499`) de HELE gap-tak: geen gap-rijen, geen
  callout, geen duurdoel-lijn (`Script.html:1700-1702`), en toont de testdag-projectie (`:1616-1634`). Daardoor toonde
  Cadans "zo niet haalbaar. Verhoog het volume." op een FTP-doel — in GAS ONBEREIKBaar (die zin zit in de NIET-test-tak,
  `:1633`). Nu: `isTest = projectieMode === "test" && testWeken != null`; band gevoed met `ctlAtTest` (`ctlAtWeek_`).
  Slider-default: `useState(8)` → `weeklyHoursRecent_(rows,42)` geclampt 4..14 (`WebApp.gs:1268` + `Script.html:1673`);
  de engine-fn was al geport (`niveau.ts:804`) maar niet gewired. **BEWUSTE CLIENT-ONLY DIVERGENTIES:** (a) readout-copy
  = richting in mensentaal via de nieuwe pure helper `projectionDirection` (`apps/web/src/lib/niveau.ts`; drempel
  |delta| < 1 CTL → "flat"), GEEN CTL-getal in de copy — GAS toont "~X CTL" + gebruikt de richting alleen als warn;
  (b) band-figuur klapt in tot ÉÉN getal bij low === high.
- **`aeafcc9f` "use configured FTP as band basis and end projection at test day":** BUG — `Niveau.tsx` gaf
  `currentFtp: eftp ?? settings?.ftp` door → de band startte op eFTP (265) terwijl de kop de ingestelde FTP (280) toont
  = interne tegenspraak (fitheid stijgt, FTP daalt). GAS gebruikt `settings.ftp` ONLY (`WebApp.gs:1268`). Nu:
  `settings?.ftp ?? eftp ?? null`. **BEWUSTE DIVERGENTIE:** het x-domein stopt op de testdag in test-modus
  (`weeksDomain = isTest && testWeken != null ? Math.max(4, testWeken) : 16`). GAS hardcodeert `WEEKS=16` óók in
  test-modus (`Script.html:1567`) → de curve liep 5 wkn voorbij een VASTE testdag en suggereerde "langer doortrainen",
  een handeling die niet bestaat. Ticks: nu/+4w/+8w bij domein 11. Geverifieerd (390×844, LAN dev): band 280–283 W bij
  6u, 280–298 W bij 8u (low vast op 280); kop "FTP-test over ~11 weken" blijft bij slider-beweging; geen "+16w"-tick.

**FASE B laag-3b — OverriddenDetail + "Terug naar voorstel" — DONE** (`7060bfd`, CLIENT-ONLY, engine ongemoeid;
CI https://github.com/daanhhk/Cadans/actions/runs/29391197247, telefoon-geverifieerd incl. omkeerbaarheid; **NIET
gedeployd**):
- **PORT-OMISSIE HERSTELD:** de D2-swap (`bbb9767`) zette alleen `sessions`; voorgesteldType/reden/redenCode/
  archetypeId bleven van de VERWORPEN coach-workout. De tak spiegelt nu `overrideWeekplanEntry_` (`Algorithm.gs:2427`):
  voorgesteldType = `"free" | workoutType`, reden `"Handmatig gekozen"`, redenCode/archetypeId null, plus het nieuwe
  veld `ProposalDay.override` (gezet ALLEEN als de swap echt gebeurde).
- **NIEUW:** `SchemaDay.override` (1-op-1 doorgelezen, GEEN eigen conditie), pure helper `durLabel` (`trnDurLabel_`-port),
  component `OverriddenDetail` (pin "Handmatig gekozen" + free-blok óf `WorkoutDetail` + full-width "Terug naar
  voorstel" via `putOverride(date,null)` + `bumpPlannerVersion`). Dispatch in SchemaView NÁ done/gemist, VÓÓR
  rustdag/sessions; coachText onderdrukt op override-dagen (de pin IS de reden).
- **ONTDUBBELD (WIJKT AF van het oude HANDOFF-plan "brengt overrides terug in `deriveSchemaView`"):** `_overrides` uit
  `deriveSchemaView`, `overrides` uit de `loadSchemaWeek`-return + de Schema.tsx/SchemaView-props verwijderd. De
  override reist nu UITSLUITEND via `ProposalWeek.days[].override`. Bewust: een tweede herberekening zou `dayPlannable`
  dupliceren (leunt op `d.gedaan`) = het bekende render-bug-patroon.
- **GAS-analyse (vastgelegd zodat B3 't niet overdoet):** `overrideKaart_` bestaat in GAS omdat `saveDayOverride` NIET
  regenereert → `d.voorstel` stale → eigen library-lookup + client-side `trnScale_` + `overrideDotZone_`. Cadans
  regenereert elke render → `day.sessions` IS al de engine-workout. `trnScale_`/`overrideDotZone_` zijn daarom BEWUST
  NIET geport; de DayStrip-dot volgt `sessions` vanzelf.
- **BEWUSTE GAS-parity (asymmetrie, intentioneel):** free-override toont chips + "Op gevoel — geen vaste
  blokstructuur", GEEN bar/IF/TSS (`freeRideCardHtml_`); library-override toont wél bar + IF/TSS (`zoneBlock_` +
  `inlineMetrics_`). De free-TSS is gesynthetiseerd uit een intensiteit-aanname (`buildFreeRideWorkout_`) en telt wél
  mee in de WeekLoad.

**PROD-DATA-BACKFILL (geen code):** remote D1 via de browser-console op prod bijgewerkt — `POST /api/sync/activities?
days=365` + `POST /api/sync/wellness?days=365`. Reden: prod had ~15 activiteiten (seed 12-06..06-07) terwijl de
GAS-Sheet er ~478 heeft (`WebApp.gs:1593` "bewezen 478→478→478"). Idempotente upsert, niets verwijderd. NEVENEFFECT:
het weekdoel schoof 137 → 132 TSS — `zoneDebt_`/dekking lezen nu een jaar i.p.v. 28 dagen (Model 2). De
Niveau-ProgressieCard ("Alles" = `sliceRange` ongefilterd op maandpunten) toont nu de volle historie; er was GÉÉN
code-bug.

**FASE B laag-1 + readiness-koers (onder) blijven live; laag-2a is VERLATEN (zie §Geparkeerde debts).**
- **laag-1 (override-backend + D2) — KLAAR + gedeployd** (`bbb9767`): day-override-backend
  (`writeOverride`/`readOverrides` + GET/PUT `/api/overrides`, spiegelt de A2-disposition-backend; non-clobber = zet
  alleen `override_json`) + override-DTO (`packages/shared/src/override.ts`: `DayOverride =
  LibraryOverride|FreeOverride`, `OverrideEntry`) + D2 `buildWeekProposal`-wiring (plannbare dag mét override →
  `buildOverrideWorkout_` i.p.v. de coach-tak → telt mee in de WeekLoad). `day_state.override_json` bestond al, geen
  migratie.
- **Readiness-koers (band-gedreven week-demote) — KLAAR + gedeployd** (`ae00730`): het week-plan-demote-signaal leunt
  nu op de HOLISTISCHE readiness-band (`getReadinessScore_` — weegt vorm/HRV/slaap/check-in) i.p.v. de botte
  `wellnessSignal_`-vlag. **BEWUSTE GAS-DIVERGENTIE, CLIENT-ONLY** (`buildWeekProposal` + `loadSchemaWeek`); engine
  (`wellnessSignal_`/`getReadinessScore_`/`combineSignals_`/`assignWorkouts`) + de 957-selftest byte-parity. Mapping:
  band ready→normal · caution→demote · rest→recovery; RPE telt nog mee (`combineSignals_`, zwaarste wint); band null
  (te weinig data) → val terug op de botte wSig-vlag. VERVANGT de `b8b7ef9`-patch (single-bad-night
  demote-verzachting, uit de code verwijderd; commit blijft in historie). Reden: banner-band en plan draaiden op
  overlappende data maar verschillende logica; nu stuurt dezelfde readiness beide, en de ochtend-check-in is de hendel.
- **laag-2a (make-up-post-pass + per-dag coach + DTO-idempotentie) — VERLATEN** (`b23bdd7`): draait latent mee
  maar is verlaten t.g.v. het auto-herplannings-model (Model 2); op te ruimen in "Brok 3" (zie §Geparkeerde debts).
  Historische inhoud: make-up-adaptatie-post-pass (`applyMakeupAdaptations`,
  byte-getrouwe spiegel van `WebApp.gs:1165-1185`, idempotent via `override.from`/`madeFrom`/`claimedTarget`; target =
  strikt ná bron+vandaag, geen override/rit, state planned/rest/today, eerste-match) + per-dag coach-feedback voor
  done ÉN gemist (`buildDoneCompare` gesplitst in `buildDoneCompareFull` + wrapper; `missedCoach_` voor gemist via
  `coachFeedback_` actual=null/isMissed=true) + override-DTO-idempotentie-velden (`from?`/`src?`/`label?` —
  engine-genegeerd, round-trippen in `override_json`) + bedrading (`deriveSchemaView` krijgt
  overrides/readiness/settings; `getTrainingLibrary_(settings)` client-direct, ontwerpkeuze D1).
- **laag-2b (today-Verlicht-overlay) — GESCHRAPT:** gesubsumeerd door de band-gedreven week-demote (die verzacht
  vandaag al; `readinessAdjust_` op de al-verzachte dag hit z'n eigen "toType===type → keep"-guard → de overlay vuurt
  nooit). Als later een BEWUSTE today-hendel gewenst is, is dat de uitgestelde blast-radius-herziening (week-demote
  vandaag NIET auto-raken, Verlicht als user-keuze) — zie §Geparkeerde debts.
- **laag-3 (make-up-UI):**
  - **laag-3a — GESCHRAPT** (frame-10 rijke gemist-kaart + make-up-knop): overbodig door Model 2 (de weekgen
    herplant al automatisch); niet meer gebouwd.
  - **laag-3b — DONE** (`7060bfd`; zie het aparte laag-3b-blok bovenaan Stand). Override-dagen tonen nu
    `OverriddenDetail` + "Terug naar voorstel" (omkeerbaar) → de gedeelde fundering voor de B3-picker.

**FASE 1 (schema-flow zuivere vormgeving):** VOLLEDIG AF + visueel geverifieerd in `/preview`.

**FASE 2 (data/bron-laag, spec-gedreven, geverifieerd via `/preview` dev-fixtures):**
- **brok 1 Taper AF** (`c17a205`): `PeriodTimeline` fase-balk keyt op `fase`; Taper-activering werkt.
- **§5b GEPLAND-kaart AF** (`16cf462` + `1410013`): render terug naar proportioneel per-interval silhouet —
  component `ZoneBar` hersteld uit `c328de5^`, geometrie in de pure helper `silhouetSegments` (`schema.ts`),
  consumeert `session.blokken` `hoogtePct`. `ZoneBars` (meervoud = zone-totalen) blijft op §5c/§5d.
  VORMGEVING-SPEC §5b verduidelijkt. Fixture engine-gedreven gemaakt: de geplande dag roept
  `buildWorkout`→`toSession` aan (variant `ss_2x20`, constante `PREVIEW_FTP` 250) i.p.v. een hand-object →
  twee tempo-pieken = de echte, GAS-conforme vorm; week-aggregaten by construction uit de dag-sessions.
- **4b §2 Volume-stat AF** (`a97d869`): single-target (GAS bouwt GÉÉN range), web-only via nieuwe pure helper
  `presetHoursLabel` op `PROFIEL_PRESET_OPTIONS`; gethreaded via `ProposalWeek.profielPreset` → `view.volumeUren`;
  null/onbekend/Custom → stat weggelaten (omit-conventie). VORMGEVING-SPEC §2 gecorrigeerd (web-only
  single-target, geen range).
- **brok 2 Opbouw-pill + taper-kop-fase AF** (`859905b`): plan-mode-pill via HERGEBRUIK van de
  engine-geëxporteerde `planModeLabel_` (`phase.ts:180`) via de web-wrapper `planModusLabel` — drie labels
  "Onderhoud"/"Doel-gericht"/"Opbouw"; vervangt de hardcoded pill (engine ongemoeid). Taper-kop-bug gefixt:
  kop-regel + FASE-stat + fase-balk keyen nu ALLE op `view.fase` (`macroFaseLabel("Taper")`→"Taper"); was
  GAS-non-conform. VORMGEVING-SPEC §2 gecorrigeerd (pill = plan-mode niet macro-fase; effectieve-fase-regel
  toegevoegd; stale "Volume 4-7u"→"7u").
- **brok 3 header coachNaam + naam AF** (`fd397a2`; **EERSTE prod-deploy**): full-stack. D1-migratie `0002`
  (`coach_naam` + `naam`, nullable) + `SettingsInput` (OPTIONELE niet-engine velden, zoals `profielPreset`;
  engine leest ze niet) + GET/PUT `/api/settings` (per-veld-whitelist + 24-char-cap) + web-render. Header:
  woordmerk = `displayCoach(coachNaam)` UPPERCASE, avatar = `initials(naam)` (oranje ring; leeg → inline
  User-glyph, GEEN lucide-dep), "Week N" via `isoWeekNumber` (GAS-`isoWeek_`-port in `lib/dates.ts`).
  Settings-form: Naam-veld + sectie "Jouw coach" (coachNaam + preset-chips Coach·Daan·Merckx·Sven·Anna).
  Coach-box-kop = `displayCoach(coachNaam)` (was hardcoded "Coach"). Nieuwe helpers `lib/coach.ts`
  (`displayCoach`/`initials`). LOKAAL + **REMOTE D1 gemigreerd** (`0002 --remote`) + **GEDEPLOYD**
  (`cadans-api.dtkorteweg.workers.dev`, Version `c9729e45`). Prod-API = Basic-Auth-gated (user "daan" +
  `BASIC_AUTH_PASSWORD`) → live key-verificatie + round-trip alléén in-browser door Daan.
- **brok 4a events-editor AF** (RUN 1 backend `f08e527`; RUN 2 UI `efbb8f9`; crash-fix + GAS-layout `1b89145`;
  laatste deploy Version `8514899d`) — full-stack, gate-groen + visueel geverifieerd op de dev-server.
  - Backend (RUN 1): `EventInput`-write-DTO (`packages/shared`) + `writeEvents` repo (delete-voor-user +
    `db.batch`-insert, atomisch; lege lijst wist alles) + `PUT /api/events` met per-rij-whitelist-validatie
    (datum/naam/type/prioriteit verplicht; optioneel afstandKm/hoogtemeters/klimType/notitie; ongeldige rij →
    400 met event-index+veld, GEEN write) → `writeEvents` → `readEvents` → verse `EventItem[]`. GEEN
    D1-migratie (tabel `events` was al compleet). engine ONGEMOEID.
  - Frontend (RUN 2 + fix): standalone `/events`-route (`apps/web/src/pages/Events.tsx`, BUITEN AppShell) +
    `putEvents`-client (mirror `putPlanner`) + Instellingen-sectie 'Doelen & events' (`eventsSummary` +
    Beheren-knop) + refetch via `bumpPlannerVersion()`. Editor = GAS-getrouw (`Script.html eventsSectionHtml_`
    als meetlat): primaire rij (naam + verwijder + prioriteit-cycle-badge A→B→C + native datum), inklapbare
    Details default dicht (Type Trip/Race-segment, Klim-type Lang/Kort/Gemengd/Vlak, Afstand km, Hoogtemeters
    hm, Notitie). Nieuw-event-defaults GAS-parity: datum=vandaag (lokale delen, NIET toISOString), type=race,
    prioriteit=C, klimType=vlak.
  - Beslissing (proposal `a87f348`): FULL-REPLACE write (mirror `putPlanner`); nav-ingang via
    `/instellingen`-sectie i.p.v. een contextuele PeriodTimeline-ingang (Cadans knipt het monolithische
    GAS-settings-scherm bewust op in focus-schermen). `id` niet blootgesteld (FULL-REPLACE). Datum end-to-end
    als rauwe yyyy-MM-dd-string (geverifieerd: geen UTC-shift). Editor + round-trip geverifieerd met een
    test-event op de LOKALE dev-D1; het echte A-event op PROD nog in te voeren via de prod-editor (Version
    `8514899d`, Basic-Auth) door Daan.
  - LET OP recon-correctie: mijn eerste proposal nam aan dat GAS enkel een sheet-tab had; de GAS WEB-APP heeft
    wel degelijk een volwaardige events-editor (`Script.html :88-149`) — die is de layout-meetlat. Recons:
    `docs/FASE2-4A-EVENTS-RECON.md` (`0d16faf`) + `docs/FASE2-4A-EVENTS-PROPOSAL.md` (`a87f348`).

- **brok 5 done-zones 3→5 AF** (`6028cfd`; deploy Version `52a51ae9`) — **CLIENT-ONLY, GAS-PARITY-HERSTEL** (GEEN
  divergentie; de eerdere "3→5 divergeert zoals 4b"-aanname was FOUT). De zichtbare 5-bar-done-verdeling in GAS
  draait op de WEB-APP-fn `coachActualZoneMin_` (`WebApp.gs:728`, 5-bucket {rust,z2,tempo,drempel,anaeroob}) — NIET
  op de engine. Nieuwe pure helper `actualZone5_` (`apps/web/src/lib/schema.ts`) spiegelt 'm byte-getrouw
  (Z1→rust·Z2→z2·Z3→tempo·Z4→drempel·Z5-7→anaeroob; `secs/60` rauwe float; SS/overlay-skip; leeg→null).
  `DoneEntry.zoneMin5` NAAST de behouden 3-bucket `zoneMinutes`; ZoneBars/ZoneCompare/doneBadge/doneLabel +
  `buildDoneCompare`→`coachFeedback_` lezen nu `zoneMin5` → **Z1 (Herstel) + Z3 (Tempo) niet langer structureel
  leeg**. De engine-3-bucket (`actualZoneMinutes_`/`tryPowerZoneTimes_`) = GAS `Algorithm.gs:364/378` LOAD/DEBT,
  ONGEMOEID (GAS-parity). Recon gecorrigeerd: `docs/FASE2-5-ZONES-RECON.md` (was (b) engine-rakend op de VERKEERDE
  meetlat → nu (a) CLIENT-ONLY). Vitest +3 (`actualZone5_`). Live op prod (Basic-Auth) → done-bars in-browser door
  Daan te verifiëren.

**FASE 2 = COMPLEET** (§5b · 4b · brok 2 · brok 3 · brok 4a · brok 5 alle AF). Resteert los: 2d ritdetails +
close-out-follow-ups. Het echte A-event **Amstel Gold Race** = INGEVOERD op prod (geverifieerd in-browser;
PeriodTimeline leest 'm, ~40 wkn tot AGR).

**FASE A voortgang (deze sessie) — UI/parity-fixes op de Schema-tab + RPE-persistentie.** Alle commits op main +
CI-groen, en **GEDEPLOYD** (prod Version `171f79fc`; zie het FASE A GEDEPLOYD-blok bovenaan Stand).
- **A1 gedeeld knoppen-blok GAS-conform** (`298f3d9`): `ActionButtons` rendert onder ELKE dagkaart-state
  (§5c/§5a/gepland), niet alleen rustdag/voltooid; "Andere training kiezen" alleen op een plannbare dag
  (`dayPlannable` = dag ≥ vandaag én niet voltooid); "Push naar Garmin" van per-dag → tab-niveau
  (`GarminPushButton`, GAS Index.html:37).
- **zone-vergelijking altijd Z1-Z5** (`d1e3d5c`): `ZoneCompare` toont alle 5 zones incl. onaangeroerde (lege zone =
  gedempt "0′ · —") — **BEWUSTE afwijking** van GAS `coachZonesHtml_` (dat lege zones weglaat), zodat in één
  oogopslag zichtbaar is welke zones leeg bleven.
- **dagkaart-knoppen alleen op vandaag/toekomst** (`ae04c77`): het knoppen-blok is `dayFuture`-gated — een verleden
  dag toont GEEN beschikbaarheid-knop (niet meer te plannen); bewuste afwijking.
- **B1 beschikbaarheid-editor GAS-conform** (`8d5f892`): de vrije ‹/›-week-navigatie vervangen door 3 scope-tabs
  (Alleen deze dag / Deze week / Volgende week), afgeleide maandag; scope "dag" toont enkel de via `?dag=<datum>`
  (uit de dagkaart-knop) geselecteerde dag; save bewaart ALTIJD de hele afgeleide week.
- **A3 RPE-persistentie** — laag-1 backend (`1ab970c`): `PUT /api/rpe/:date` (RPE 1-10, `writeRpe` upsert op
  (user,datum), spiegelt checkin) + 4 round-trip-tests. laag-2 UI (`f5b3b29`): nieuwe `RpeRating` (1-10-strip op de
  done-kaart, optimistische highlight + rollback, `bumpPlannerVersion` na write); `rpeByDate` gethreaded via
  `loadSchemaWeek` → Schema → SchemaView → DoneCompareCard. De engine leest de rpe-rijen al (`readiness.ts`
  `rpeSignal_`); ENGINE ONGEMOEID.
- **FASE A RESTEREND — NU AF:** **A2 disposition** (backend `6929741` + UI `d8c70e4`) · **A4 gemist-kaart**
  (`d8c70e4`, SIMPELE versie; de rijke frame-10 `gemistDetailHtml_` volgt in/na B4). Zie het FASE A
  GEDEPLOYD-blok bovenaan Stand.

**CLOSE-OUT-LIJST / kleine follow-ups** (geen zichtbare bug op default-view):
- Twee hand-geschreven fixtures met silhouet-drift-risico: Za "Lange duurrit" (`2026-07-11`) + Wo-8
  `plannedForDone` "Drempel 3x10" (`2026-07-08`); de 3x10 zou 3 pieken tonen. Overweeg engine-gedreven te maken
  zoals de §5b-geplande dag. (Za duurrit is inherent vlak = laag risico; de 3x10 voedt de §5c-vergelijking via
  zone-TOTALEN, niet het silhouet.)
- eventDriven-synthese-naad: de web-wrapper synthetiseert `eventDriven = (macro != null)` omdat de engine
  `eventFase_` het niet emit; lichte tech-debt (drift als de engine event-driven ooit anders zou bepalen).
- coachNaam-threading via `ProposalWeek`→`view`→`SchemaView` (proposal.ts/schema.ts/SchemaView.tsx) puur voor de
  §6 coach-box-kop — lichte tech-debt (settings-string door de week-proposal-laag; spiegelt `profielPreset`).
- header-refetch loopt via AppShell-REMOUNT (`useEffect` deps `[]`, `getSettings`), GÉÉN settings-invalidatie —
  werkt omdat `/instellingen` BUITEN het AppShell-route-blok staat (return → remount → refetch). Lichte tech-debt
  als `/instellingen` ooit BINNEN het AppShell-blok komt (dan stale tot hard reload).
- **Dev-note:** start de dev-server LAN-breed voor mobiele verificatie: `wrangler dev --ip 0.0.0.0 --port 8787`
  (vanuit workers/api) → bereikbaar op `http://<PC-LAN-IP>:8787` vanaf de telefoon (i.p.v. alleen 127.0.0.1).
- plannerSignal-naamgeneralisatie: events-edits hergebruiken `bumpPlannerVersion()`/`plannerSignal` (events
  voeden dezelfde `loadSchemaWeek`→`buildWeekProposal`→PeriodTimeline-pipeline); de naam "planner" dekt nu
  breder dan planner-dagen. Geen bug (beide invalideren dezelfde pipeline); later hernoemen naar een generiek
  `schemaInputsSignal`.
- **Nazorg-noot:** brok 4a RUN 2 introduceerde per abuis `crypto.randomUUID()` als row-key (secure-context-only)
  → crash op de http-LAN-dev-server; gefixt in `1b89145` met een module-teller `nextRowKey()`. Les: geen
  `crypto.randomUUID()` in client-code die ook op een http-origin (LAN-dev) moet renderen.

**RECON-DOCS** (gepind, referentie): `FASE2-BRON-RECON.md` (`398a9e9`) · `FASE2-5B-RECON.md` (`6d2c18e`) ·
`FASE2-5B-DATA-RECON.md` (`2c7b4dc`) · `FASE2-4A-EVENTS-RECON.md` (`0d16faf`) + `-PROPOSAL.md` (`a87f348`) ·
`FASE2-5-ZONES-RECON.md` (`6028cfd`, GECORRIGEERD → (a) CLIENT-ONLY — zie BRONHIERARCHIE). Het 4b- en het
brok-2-recon waren rapport-only (geen doc).

**FOCUS VOLGENDE CHAT:** **laag-3b is DONE** (`7060bfd`, nog niet gedeployd; prod loopt achter — zie Stand-top). Doel
van de reeks = **FUNCTIONEEL COMPLEET** (elke tab doet íéts), NIET cutover-klaar. Volgorde:
1. **B3-picker (grootste B-brok)** — "Andere training kiezen" (nu `SoonButton`; write-pad = de override-backend, al
   gedeployd; UI-fundering = laag-3b). **HARDE SPEC-EIS (bewezen deze chat):** de picker MOET `variantId` meesturen.
   Zonder `variantId` valt `buildOverrideWorkout_` (`Algorithm.gs:2413`) door naar `buildWorkout(type, dur)` en NEGEERT
   de duur-slider — een 75-min-fixture leverde een 90-min template ("(ingekort)"). Alleen `long_z2` +
   `combo_long_with_efforts` schalen echt (`SCALABLE_TYPES`, `Algorithm.gs:156`); GAS logt de afwijking >30 min. GAS'
   `trnInplannen` stuurt `cat.type + v.variantId + dur`. Picker-bron: `Script.html:2065-2140` (openPicker →
   home/cats/category/workout/free; `pkSliderHtml_` 45-240 step 15; `pkPickLibrary`/`pkPickFree` → `saveDayOverride`).
2. **B2 Trainingen-tab** (nu `<ComingSoon>`; GAS = bibliotheek categorie→variant→detail-slider→inplannen; deelt de
   override-machinerie).
Deploy van laag-3b kan mee met B3 of los. Daarna pas: **2d ritdetails** + het **DayStrip-venster**. NIET in deze reeks
(cutover-sluitstukken, geen review-blockers): engine end-audit + port-correctheid-audit + data-migratie. Losse
dev-DX-optie (geen scope nu): een root `pnpm dev` via `concurrently` (Vite + `wrangler dev` samen; nu twee losse
processen). Het echte A-event **Amstel Gold Race** = INGEVOERD op prod (geverifieerd in-browser).

### PARITY-FASERING (compact — vervangt een apart audit-doc; de volledige matrix is via de GAS-bron te reconen)
- **FASE B (recon-first, deels engine + sign-off):** **B2 Trainingen-tab** (nu `<ComingSoon>`; GAS = volledige
  workout-bibliotheek categorie→variant→detail-slider→inplannen; deelt de override-machinerie) · **B3 "Andere
  training kiezen"/day-override** (write-pad = de override-backend, nu **KLAAR + gedeployd** laag-1 `bbb9767`; de
  UI-picker volgt op de laag-3b-fundering) · **B4 coach-adaptatie / make-up** (engine-post-pass + per-dag coach =
  **KLAAR op main** laag-2a `b23bdd7`, nog niet gedeployd; de "Verlicht vandaag"-today-overlay is GESCHRAPT —
  gesubsumeerd door de band-gedreven week-demote; make-up-UI = laag-3). **Beschikbaarheid-editor = DONE (B1).**
  Werkende laag-indeling (laag-1/readiness/2a/2b/3) + status: zie het FASE B-blok bovenaan Stand.
- **Ritdetails-drill-down (2d):** "Bekijk ritdetails ›" is nog een `SoonButton`; te bouwen = route (intervals
  activiteit-detail: 7-zone-TIZ + metrics + intervallen) + overlay-sheet. GEEN engine.
- **FASE C:** Garmin-push (extern device-traject).
- **EIND-AUDIT geporte engine-fns:** sluitstuk NA UI-completie (bewust uitgesteld).
- **DayStrip-venster (GAS-parity, recon af, NIET gebouwd):** venster **[-28d..+7d]** i.p.v. de huidige 1-week
  (`WebApp.gs:1103`); volgende week = preview-marker (`previewMin` uit Weekplanner+1, GEEN uitgewerkt voorstel);
  verleden = `DoneDetail` (geen gepland-vs-gedaan tenzij aanpak-B). Raakt data-window + proposal-per-dag-assembler +
  UI-scroll. Deelt de weekplan-persistentie-fundering met verleden-dispositie.
- **Watch-note — Settings-race (eenmalig waargenomen):** gelijktijdig een event aanmaken + settings opslaan liet de
  settings-write missen op prod; ná elkaar = goed. FULL-REPLACE-writes; in de gaten houden, geen fix nu.

### OPEN OBSERVATIE (verse chat)
Daan meldde "dag-wisselen nog niet hetzelfde als GAS" — DEELS geadresseerd via B1 (scope-tabs) + A1 (knoppen onder
elke state); de rest is onbekend → een verse chat moet SPECIFICEREN (welke dag-state / welk aspect) en het tegen de
GAS-bron leggen (`raw.githubusercontent.com/daanhhk/training/3e8090a/...`, zie BRONHIERARCHIE).

**ISSUE 2 (dagkaart-VOLTOOID) Fase 2a+2b + DATA-OPSCHOON Fase 1 — DONE + LIVE (deze reeks chats).**
- **2a rit-weergave** (`44ecb65` → Version `3246abc6`): `DoneEntry` uitgebreid (type/naam/zoneMinutes); een
  verleden/vandaag-dag met een gereden rit toont de VOLTOOID-kaart (naam + NL-type-label uit de dominante
  reële zone + duur + zone-bars) i.p.v. "Rustdag".
- **2b-1 horizontale zone-bars** (`c328de5` → Version `c2beed72`): de verticale `ZoneBar` + pill-`ZoneLegend`
  vervangen door één `ZoneBars` (per zone ALTIJD Z1-Z5, horizontale balk + dot + NL-label + minuten),
  design-geankerd op `coach-feedback.jsx` ZoneCompareRow. Oude componenten verwijderd.
- **2b-2 gepland-vs-gedaan-kaart** (`a184859` → **Version `b3781946`**, laatste deploy): `coachFeedback_`
  (engine, PUUR aangeroepen) → state/score/type-labels; nieuwe `DoneCompareCard`/`ZoneCompare`/`ZonePill`
  (badge-pill + titel + AlignChip + %-balk + gepland|gedaan-tabel + compare-bars). Twee dispatch-fixes:
  same-day-flip (voltooide vandaag → done-kaart; nieuwe `SchemaDay.isToday` houdt de dag-strip-markering) +
  no-plan-fallback (done zonder plan → gereduceerde kaart). Geplande workout voor done-dagen gereconstrueerd
  via `proposal.ts` `plannedForDone`.
- **2b-2-render-fix + GAS-getrouwheid** (`baa0762` → **Version `48eb51b6`**, laatste deploy): done-VANDAAG
  plan-bron-fix (P1) — `deriveSchemaView` (`apps/web/src/lib/schema.ts`) gebruikt `plannedForDone ??
  sessions[laatste]`, gerouteerd op de activity-done-staat → volle `DoneCompareCard`. Plus GAS-getrouwheid:
  P2 titel (`coachTitle_`-port: gedaan-type "<type>-rit · <duur>" ALLEEN bij state `different`/"anders", anders
  `planned.naam`), P3 %-balk verborgen bij "anders", P4 align-chip op de overline-rij (nieuw `AlignChip.tsx`).
  +1 regressietest. **STATUS done-vandaag-kaart: nog NIET visueel geverifieerd** (geen done-vandaag-dag tijdens
  de sessie) → verifieer bij de eerstvolgende voltooide training-VANDAAG op PRODUCTIE (incognito/hard refresh,
  SW-cache).
- **VERLEDEN voltooide dagen — BEWUST GEPARKEERD:** tonen de gereduceerde `DoneDetail` i.p.v. de volle
  vergelijking. Reden: de plan-bron is niet reproduceerbaar — de engine-planner leest ambient `new Date()`
  (`planner.ts:537` + kwaliteitspad-keuze `:209`), dus regeneratie vanuit een latere "vandaag" FLIPT het plan
  (WO 8: `long_z2` → `sweet_spot`), semantisch FOUT (de determinisme-guard bewees dat aanpak A fout was).
  **PRODUCTBESLISSING:** de app kijkt vooruit; geen verleden-reconstructie; een nieuwe gebruiker start zonder
  historie. Indien terugkijken later gewenst: **aanpak B** (voorgesteldType/plan PERSISTEREN bij generatie →
  werkt vooruit, dekt bestaande verleden dagen niet retroactief). NOOIT de engine-asOf-refactor (aanpak C —
  afgeblazen als overkill; C loste een niet-nagestreefd geval op). Recon: `docs/DAGKAART-DESIGN-DIFF-RECON.md`
  (GAS-meetlat, verschil-typen D/C/X/=, bug-diagnose).
- **DATA-OPSCHOON Fase 1 (D1-data, GEEN repo/code):** REMOTE D1 (`cadans`, `aa302c17…`) `settings.doel` user 1
  **VO2max → 'FTP'** (`doel_start`/`doel_duur`/`ftp` onveranderd) — verhelpt de girona-fallback in Niveau.
  LOKALE dev-D1: test-event-rij "Ardennen-trip" (id 1) VERWIJDERD — verhelpt de event-fasekaart in Schema.
  GEEN nieuw event geseed (het echte A-event **Amstel Gold Race 2027-04-18** = INGEVOERD op prod via de
  events-editor; geverifieerd in-browser, PeriodTimeline leest 'm).
- **Correctie op eerdere aanname:** de "Ardennen-trip"-vervuiling zat UITSLUITEND op de LOKALE dev-D1; de
  REMOTE was al leeg. "Girona" is een 1-op-1 uit GAS geporte constant (`niveau.ts:573`,
  `GOAL_PROFILES_.ftp`/`girona`), getriggerd door een niet-FTP-doel — GEEN CC-verzinsel. Provenance-audit:
  `docs/DATA-PROVENANCE-SCHEMA.md`.

**ISSUE 1 (dagtype-model) + PENDEL-DUUR — DONE + LIVE (deze sessie).**
- **Dagtype-model** — de Weekplanner vraagt geen dagtype meer: per dag Train? + minuten-**slider**
  (30-360, step 15) + **Pendel?-toggle**; dagtype wordt client-side AFGELEID (`deriveDagtype`: pendel >
  weekend (Za/Zo) > vrij; `recovery` NOOIT uit availability — het wellness-signal dekt dat). Commit
  `0782b1a`.
- **Schema auto-refresh** — een in-memory `plannerSignal` (bump/subscribe) laat Schema het voorstel
  herbouwen na een Weekplanner-save (puur planner-gedreven, GEEN intervals-sync); de ververs-knop
  re-derive't nu ONVOORWAARDELIJK (ontkoppeld van de sync-uitkomst). Commit `937c031`.
- **Pendel-duur = "enkele reis"** — het settings-veld toont de enkele reis; opgeslagen als retour
  (2×, `legToRoundTrip`), de engine leest de retour + splitst heen/terug (`planner.ts:1948-1949`).
  Pendel-dag = leg+leg (bv. 75+75=150). GEEN engine/`proposal.ts`/`planner.ts`-wijziging. Commit `faed841`.
- **Live Version ID `9120970c`**; laatste main-commit = `faed841`. CI groen. Recon-docs deze chat
  (achtergrond): `BESCHIKBAARHEID-MOBILE-RECON`, `ENGINE-DAGTYPE-BRANCHES-RECON`, `DAGKAART-PENDEL-RECON`.

**INVOER-UI + SYNC LIVE (vorige sessie).** De drie data-invoer-gaten zijn gedicht + gedeployed;
remote D1 is nu GEVULD.
- **Settings-invoer** — `/instellingen` via het tandwiel in de AppShell-header; FULL-REPLACE
  `PUT /api/settings`-client + form (alle 12 `EngineSettings`-velden, incl. Geavanceerd
  hartslag/pendel/fase). Commit `d6398dd` → deploy Version `b456867a`. Telefoon-geverifieerd.
- **Schema-sync-knop** — "Werk week bij" gekoppeld aan `POST /api/sync/{activities,wellness}` (parallel
  via `Promise.allSettled`, inline-feedback; power-curve bewust NIET — Niveau laadt die via read-through).
  Commit `0abaf34` → deploy Version `6ff09e3f`. Telefoon-geverifieerd (15 activiteiten gesynct).
- **Weekplanner-invoer** — `PUT /api/planner/:monday` FULL-REPLACE (idempotente upsert op
  `(user_id, datum)`; `voorgesteldType` blijft null → client herberekent live; `gedaan`=0). Editor op
  `/weekplanner` via het kalender-icoon in de WeekLoad-kaartkop, vrije week-navigatie. Commit `2fe521a`
  → deploy Version `2a23798c`. Vitest +13.
- **Allowlist verbreed** (commit `32ac2d3`): 7 read-only allow-patronen (`echo` + `wrangler
  whoami`/`d1 list`/`d1 migrations list`, wrangler+npx). Deny-regels + `wrangler deploy`-prompt ONGEMOEID.
- **Remote D1 GEVULD** (was leeg): 15 activiteiten (user_id=1, datum-range 12-06..06-07), settings
  (FTP 280 / gewicht 75 / doel VO2max / blok-start 29-06 / 12 wk), `planner_days` huidige week ingevuld.

**EERSTE CLOUDFLARE-DEPLOY LIVE (post-deploy).** Worker `cadans-api` draait op
**https://cadans-api.dtkorteweg.workers.dev** (Version ID `bde322ec-017b-4ef2-81ba-2c03812cb18a`);
assets-binding + whole-origin basic-auth actief (username `daan` hardcoded in `src/index.ts`; auth
alleen aan als het secret staat). Auth-afdwinging objectief bevestigd: `GET /api/health` én `GET /`
zónder/foute creds → **401 + `WWW-Authenticate: Basic realm="Secure Area"`**. Remote D1 `cadans`
gemigreerd (`0000` + `0001` → **12 tabellen** live, + interne D1-tabellen). Secrets via het
Cloudflare-dashboard gezet: `BASIC_AUTH_PASSWORD`, `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`
(namen only, nooit waarden). Code deze chat (workers/api): ensure-user middleware = commit
`2cc3f23` (idempotente `INSERT OR IGNORE users(id=1)` op non-GET); whole-origin basic-auth = commit
`d96867c` (`run_worker_first` true + conditionele `basicAuth` + `ASSETS.fetch`-fallback +
`/api`-404-guard); plan-doc `docs/DEPLOY-RECON.md` = commit `87df348`. (Remote D1 was toen nog LEEG;
**inmiddels gevuld** — zie het sessie-blok hierboven.)

**SCHEMA + NIVEAU + VORM-TAB AFGEROND (GAS-niveau) — laatste UI-code-commit `f2d2fa3`, CI groen.**
Fase 0-4 klaar. Fase 5 (de PWA, `apps/web`) loopt; **Schema, Niveau én Vorm zijn nu op GAS-
conformiteit afgewerkt** (telefoon-geverifieerd). **Alle hoofd-tabs (Schema/Niveau/Vorm +
Status/Today) staan op niveau.** Alles apps/web — `packages/engine` ONGEWIJZIGD.
Code-commits deze slag (Vorm): `1a8d354` (feat: LevelCard tier-chip + tier-voortgangsbalk +
"sinds"-delta; MetricRow 3e kolom Week-TSS; nieuwe gedeelde `lib/niveau.ts` — `deriveNiveauSerie`/
`tierProgress`/`wkgSince`/`weekTss` + 10 vitest-units; Vorm.tsx fetcht activities) · `ab8ac1a`
(style: tokenize ReadinessCard/CheckinSheet/ConditiePmc) · `f2d2fa3` (fix: conditie-as "12 wk" —
verdwaalde tilde weg; ab8ac1a's perl-replace nam 10-spatie-inspringing aan terwijl de regel er 8
heeft → vervanging sloeg stil over).

**Gate-vloeren (nooit onder; bron van waarheid — NOOIT hardcoden in een prompt):**
engine-selftest `toBe(957)` (`packages/engine/src/selftest.test.ts:3668`, ongewijzigd) · vitest-totaal
**300** (gegroeid t/m FASE B laag-1/readiness/laag-2a → 268; daarna: Model-2 avoid-consecutive-hard-verificatie
+2 → 270, syncStatus-units +8 → 278, redenCode-borging + coach-narrative +23 → 301, allocator-redenCode-borging
+2 → 303, coachPersona round-trip +1 → 304; FASE 3a −4 dode make-up-tests → **300**). Engine niet aangeraakt door de
coach-narrative-reeks NOCH FASE 3 (957 vast). CI groen. Hard floors — niet regresseren.

**Fundament:** IBM Plex Sans (400/500/600) + Mono (500/600), self-hosted via `@fontsource`,
offline-precached (`main.tsx`). Het UI-kader ligt vast in **`apps/web/docs/UI-KADER.md`**:
`design/src/tokens.css` ↔ `apps/web/src/styles/tokens.css` = bron van waarheid; componenten
consumeren UITSLUITEND `--s-*/--fs-*/--lh-*/--r-*` (kleur was al gedisciplineerd).

**Schema-tab — sectie-volgorde: PeriodTimeline → WeekLoad → DayStrip → dag-detail.**
- **PeriodTimeline** (periodisering-kaart): overline + kop "<NL-fase> · nog X wkn tot
  <eventNaam>" (uit de events-tabel op D1), fase-staven [Basis/Build/Peak] met de huidige
  fase gemarkeerd, Fase-stat + Tot-stat + ModeChip "Doel-gericht". Gethread uit de engine-`macro`
  in `proposal.ts`: `eventNaam`, `wekenTotEvent`, `planModus` (afgeleid).
- **WeekLoad**: 3 stats (TSS/uren/dagen gepland vs gedaan) + voortgangsbalk met `--accent-grad`.
- **Workout-detail**: proportionele SVG-staafgrafiek (`ZoneBar`; breedte ∝ minuten, hoogte via
  bucket-lookup rust 25 / z2 45 / tempo 65 / drempel 85 / anaeroob 100, kleur `--zone-1..5`) →
  `ZoneLegend`-chips → `BlockList` (tekstuele stappen) **DEFAULT INGEKLAPT**, uitklappen via klik op
  de bar/legend (toggle-`button`, `aria-expanded`/`aria-controls`). Blok-extractie in apps/web
  (`blokFromEngine`, `lib/schema.ts`); engine ongewijzigd.
- **macroFase NL** via `MACRO_FASE_NL` (Base→Basis, Recovery→Herstel; Build/Peak/Test blijven Engels
  = byte-identiek aan GAS `Doel.gs:307`). Het fase-token uit het workout-naam-suffix wordt in de UI
  gestript (`stripFaseSuffix`).
- **CoachReadinessBanner** op today (Cadans-toevoeging t.o.v. GAS — behouden).

**Niveau-tab — vier secties, alle LIVE (telefoon-geverifieerd; beide "volgt later"-stubs weg).**
- **VermogenSnapshot** + **ProgressieCard** (v1): FTP / W-kg / tier + trajectorie (W/kg·Fitheid, 1M/6M/12M/Alles).
- **Rijdersprofiel**: power-duration-curve (log-x SVG, markers 5s/1m/5m/20m/60m, key 5m/20m/60m) + stat-boxes
  (W · W/kg · maand) + type-staaf (Sprinter↔Diesel via `riderType.pos`, `(1-pos)` op de Sprinter-links-as) +
  parity-proza. Data uit **`GET /api/power-curve`** (engine `pcNormalize_`, server-side) met **90d|1y-toggle**;
  nieuwe shared-DTO **`PowerCurveResponse`** (`packages/shared`) typeert de worker-route + de client-fetch
  (`any` weg). Lokaal `power_curve_cache` leeg → nette empty-state tot een sync.
- **DoelProjectie**: 3 gap-rows (`activeGoalProfile_`+`goalGap_`, client-side geassembleerd) + uren→potentieel
  (CTL-ramp via `ctlPlateauFromVolume_`/`ctlApproachWeeks_`/`ctlAtWeek_`, SVG) + speculatieve FTP-band
  (`ftpBandFromProjection_`, gestreept, aannames uitklapbaar). Alle compute uit de engine (`niveau.ts`); UI-only.

**Vorm-tab — conformiteit-niveau, telefoon-geverifieerd (conditie-as toont "12 wk").**
- **ReadinessCard** (score + factorpaneel + check-in-regel, engine-`deriveReadiness`) · **LevelCard** (W/kg + FTP
  + **tier-chip** + **tier-voortgangsbalk** + **"+X ↑ sinds <mnd>"-delta**) · **MetricRow** (3 kolommen FTP ·
  Gewicht · **Week-TSS**) · **ConditiePmc** (PMC-variant C: 12-wk CTL/ATL + TSB-headline [variant-B-graft] +
  legenda) · CheckinSheet. StatusDeck-swipe blijft BEWUST gecut (PMC-only, geen switcher).
- LevelCard-tier/-delta + de serie komen uit de **gedeelde Niveau-bron** `lib/niveau.ts` (`deriveNiveauSerie` =
  dezelfde engine-fn-keten die Niveau.tsx gebruikt → identieke waarden).
- **Week-TSS** = kalenderweek `[maandag, maandag+7)` via `weekMondayIso` — **GAS-parity** met `actualTssByDate_`
  (Algorithm.gs:662, Monday-based; NIET trailing-7). Lege week → "—".

### Geparkeerde debts (bewust, niet nu)
- **Override-make-up-model — AFGEROND (FASE 3a, `0c954258`):** de `applyMakeupAdaptations`-post-pass +
  `makeupAdaptatie`-exposure zijn uit de code verwijderd; Model 2 (auto-herplannende weekgen) is primair. De
  laag-3a make-up-UI + make-up-knop VERVALLEN (hingen aan dit verwijderde model). De gemist-narrative is inmiddels
  zichtbaar (3b) → heroverweeg later of een aparte "frame-10 rich missed card" nog nodig is (voorlopig geparkeerd,
  waarschijnlijk niet). Zie het FASE 3-blok bovenaan Stand.
- **BlockList duplicate-React-key — AFGEROND (FASE 3a, `0c954258`):** key → blok-index (`biome-ignore
  noArrayIndexKey`, statische read-only lijst).
- **2c coach-narrative — GEMIST-kant gedaan, DONE-kant bewust NIET:** de GEMIST-narrative is nu zichtbaar (3b,
  `missedCoach_` in `GemistCard`). De DONE-kant is BEWUST NIET "warm vervangen" — de done-box toont de rijke
  engine-`coachFeedback_.narrative`. Zie het geparkeerde item "Warme persona op done = ENGINE-fase" hieronder.
- **Warme persona op done = ENGINE-fase (niet client-only) — GEPARKEERD:** de done-coach-box toont bewust de
  engine-`coachFeedback_.narrative`. Die is rijk + feiten-gedreven: gepland-vs-gereden intensiteitstype, richting
  (lichter/intensiever), sleutelsessie-ja/nee, event-relevantie én patroonherhaling (bv. herhaald
  duur-inruilen-voor-intensiteit → expliciete waarschuwing + voorstel) — de rijkste coaching-output van de app. Een
  client-only "warm vervangen" met een statische pool (zoals de planned-laag op de generieke reden) zou die duiding
  VERARMEN; de compare-tabel toont cijfers, niet de duiding. Zuivere weg = ENGINE-uitbreiding: de engine emit een
  fijnkorrelige done-`redenCode` + losse velden (plType/acType/richting/event/isKey), de client herformuleert warm —
  zoals de planned-laag werkt. Aparte fase, engine-sign-off vereist. De symmetrie "done = planned-aanpak" is
  OPPERVLAKKIG: planned-reden is generiek (vervangen = gratis), done-narrative is rijk (vervangen = verlies).
- **Niveau-tab ↔ Schema-tab doel-gereedheid-consistentie — INGELOST** (`7308d660`): de botsing verdween aan de bron.
  De Niveau-tab claimt niet langer "zo niet haalbaar" op een FTP-doel — dat was de gap-tak die daar (GAS-conform) nooit
  had mogen vuren; test-modus onderdrukt 'm nu. Schema is NIET aangeraakt.
- **FTP-projectiemodel kent geen intensiteit (ENGINE-fase) — GEPARKEERD:** `ftpBandFromProjection_` (`WebApp.gs:544`)
  hangt FTP-winst UITSLUITEND aan de CTL-delta (`gain = FTP_GAIN_PER_CTL_ 0.004 * max(0, plateau − current)`, cap
  0.08). Bij ~6u/week zit Daan al bijna op z'n volume-plafond (~47 vs 49) → +3W over 11 wkn, binnen de meetruis van een
  FTP-test. Twee gerichte sweet-spot-sessies leveren in werkelijkheid meer, maar het model ziet dat niet; de band gaat
  bovendien NOOIT omlaag (`dCtl` geclampt op ≥ 0) → 4u en 6u tonen dezelfde low. BESLISSING: NIET fixen — GAS heeft
  dezelfde beperking (geen cutover-regressie), het is een engine-wijziging met sign-off + 957-risico, en pas empirisch
  te beoordelen na weken data. Evalueren met bewijs, niet nu.
- **Design-schuld Niveau doel-projectie-card — GEPARKEERD:** de card benoemt de testdag DRIE keer ("FTP-test over ~11
  weken" / "Verwachte FTP op de testdag" / "over ~11 wkn tot testdag"). Verzamelen voor een vormgeving-pass; Cadans'
  design-standaard is GAS, dus een herontwerp = bewuste divergentie + een eigen tab-overstijgende fase, NÁ de
  inhoudelijke ronde.
- **Dag-detail-overline "VOORSTEL" boven de override-pin "Handmatig gekozen" = tegenspraak (laag-3b, klein):** op een
  override-dag zou `STATE_LABEL[day.state]` een eigen label moeten geven (bv. "Gekozen"). GAS heeft GÉÉN state-label in
  de dag-kop (`Script.html:1050` = alleen weekdag + kort) — het label is een Cadans-toevoeging. Kan mee in B3.
- **VOLLEDIG-SYNC-PAD ONTBREEKT (oorzaak, niet symptoom) — GEPARKEERD:** GAS heeft TWEE paden: `refreshActivities()` =
  `syncActivitiesIncremental_(7)` (top-up bij app-open, GEEN `last_sync`-stempel, `WebApp.gs:1592`) én `syncAll()` =
  volledige sync + `last_sync`-stempel, achter ↻/`regenerateWeb` (`WebApp.gs:1579-1582`) én in `generateProposal`
  (`Algorithm.gs:699`). Cadans portte alleen de top-up (`155b655`, 28d i.p.v. 7d) en VERWIJDERDE de ↻-knop → het
  syncAll-equivalent is meeverdwenen. Gevolg: `integrations/intervals.ts:88` `daysBack ?? 28` en `wellness.ts:97`
  `daysBack ?? 60` zijn de enige vensters; de client stuurt nooit een `days`-param (→ de prod-backfill hierboven moest
  handmatig via de console). FIX (advies, niet gebouwd): een "Volledige sync"-actie in Instellingen → beide routes met
  `days=365` (`parseDays` cap = 1..365). NIET de default verhogen (fire-and-forget mount).
- **Check-in auto-open NIET geport — GEPARKEERD (recon-first, eigen laagje):** GAS `maybeAutoOpenCheckin()`
  (`Script.html:1302`), aangeroepen in `onState` INITIAL-ONLY (`:56`); guard `checkinAutoOpened`, conditie
  `readiness.checkinDone === false`, `setTimeout(openCheckin, 400)`, dismissbaar. Cadans opent de CheckinSheet alleen
  via de ReadinessCard-knop. De conditie is triviaal (`getCheckin(todayISO) === null`); de klus is dat sheet + state in
  `pages/Vorm.tsx` leven terwijl je op Schema landt → vereist verhuizing naar een gedeelde laag (AppShell).
- **Coach-stem bij een override die een readiness-demote terugdraait — OPEN VRAAG (evalueren NÁ B3):** GAS zwijgt bij
  een handmatige override (`WebApp.gs:1211` `return null`) en geeft alleen een committed-coach bij `override.src ===
  'readiness'` (`:1207`). Maar GAS kent Daans geval niet: daar is verlichten een AANBOD, in Cadans gebeurt de demote
  automatisch (band-gedreven) → tegen een automatisch advies ingaan verdient mogelijk wél een coach-regel. Het veld
  `src?: "readiness"` staat al in `packages/shared/src/override.ts`. Hangt samen met de blast-radius-herziening. Niet
  bouwen vóór B3 — de situatie is nu onbereikbaar (geen picker).
- **Persona-pools disciplined/statistical LEEG** (fallback → warm): copy-werk voor later; de toon-ijk-voorbeelden +
  de structuur staan al in `lib/coachNarrative.ts`. De kiezer-UI toont ze als "binnenkort" (disabled).
- **Blast-radius-herziening (FASE B — benoemde kandidaat voor de "komende weken"-evaluatie):** de band-gedreven
  week-demote raakt vandaag automatisch mee; een BEWUSTE today-hendel ("Verlicht vandaag" als user-keuze) vereist dat
  de week-demote vandaag NIET auto-raakt (anders hit `readinessAdjust_` z'n "toType===type → keep"-guard en vuurt de
  overlay nooit). Dit is waar de geschrapte laag-2b heropgevat zou worden. Zie het FASE B-blok bovenaan Stand.
- **PeriodTimeline**: proportionele fase-breedtes + you-are-here-marker ontbreken (per-fase-weekduur
  zit niet in de engine-output); event-tags B/A; Volume-stat (geen CTL-/volume-target in de keten).
  Vereisen extra engine-threading.
- **Blok-copy blijft Engels** (Warmup/Over/Under/Cooldown/"lactate clearance") = parity met GAS (zit
  in engine `archetypes.ts`, GEEN GAS-vertaallaag). NL-maken = nieuwe keuze + engine-copy → eind-audit.
- **Over-under "Herstel"-blokken** erven de set-drempel-HR i.p.v. een lage herstel-HR (engine-emit) →
  eind-audit.
- **macroFase-proza** in `planner.ts:620-626`/`:680` blijft Engels (reden-string) → eind-audit.
- **Font-subsets**: `@fontsource` trekt alle subsets mee (28 woff2); versmallen naar latin(+ext) =
  kleine optimalisatie.
- **Client-side goal-assembler**: `buildGoalProfile_` (GAS-assembler) zat NIET in engine-core → client-side
  samengesteld uit `activeGoalProfile_`+`goalGap_` (`Niveau.tsx`). Eind-audit: 1-op-1 mirror van de
  GAS-assembler verifiëren.
- **DoelProjectie start-CTL op maand-granulariteit** (`ctlReeksMaandelijks_` laatste maand) i.p.v. GAS
  dag-`vorm.CTL` → de klaar-marker kan ~1 week schuiven; eind-audit.
- **riderType-proza UI-mapped**: parity-mirror van GAS `nvTypeDuiding_` (3 strings); engine levert enkel
  `{pos,label}` → parity-copy-debt, eind-audit.
- **Geen geautomatiseerde interactie-tests + geen reproduceerbare visual-check-harness** (Schema-collapse,
  DoelProjectie uren-slider, Rijdersprofiel 90d|1y-toggle): vereist jsdom + `@testing-library/react` (nieuwe deps +
  config) = aparte test-harness-klus. Uitgebreid (Niveau-reeks): de visual-checks liepen ad-hoc via een in-app browser
  (DOM-tekst + inline-screenshots), niet via een script → geen artefacten op schijf, niet herhaalbaar. Overwogen route
  = Playwright buiten de repo.
- **Debt (k) Vorm-lite INGELOST** (`1a8d354`): LevelCard tier-chip/tier-bar/"sinds"-delta + MetricRow Week-TSS
  gebouwd. Resteert onder (k): `/api/activities` server-side typing.
- **Orchestratie-duplicatie (NIEUW):** `lib/niveau.ts` wrapt dezelfde engine-fn-keten die `Niveau.tsx` inline
  draait; waarden IDENTIEK (geen bug), maar één bron is netter → `Niveau.tsx` later op de helper laten leunen.
- **Token-schaal-gaten (NIEUW, cross-cutting — niet Vorm-specifiek):** er is geen `--fs-num-*`-schaal voor
  20/30/52px, en off-scale font-sizes (17.5/19/14.5/8.5), tight gaps (5/6/10) en chip/knop-padding zijn bewust
  off-scale gelaten (geen tokens verzinnen). Vraagt een aparte schaal-uitbreidings-pass die de hele app raakt.
- **Bredere debts** (detail: §Deferred debts): (g) remote-D1-drift + (m) users-bootstrap = GESLOTEN
  (deploy); OPEN: engine-`any`-cast in apps/web (a)/(l), `/api/activities` server-side typing (k),
  (d) TZ-UTC op de sync-routes (v1-geaccepteerd).

### Volgende fase (grootste gap eerst)
- **EERSTE DEPLOY — GEDAAN.** Worker + assets + remote D1 live achter whole-origin basic-auth (zie Stand).
  De twee geparkeerde deploy-debts zijn GESLOTEN: remote-D1-drift (g) + users-bootstrap (m). No-auth-exposure
  afgedekt. RESTEREND deploy-debt: (d) TZ-UTC op de sync-routes = OPEN, v1-geaccepteerd (aparte chat).
- **FOCUS (i) sync-trigger + (ii) settings-invoer + weekplanner-invoer — GEDAAN (deze sessie):** alle
  drie gebouwd + LIVE + telefoon-geverifieerd; remote D1 gevuld (zie sessie-blok bovenaan Stand).
- **ISSUE 1 (dagtype-model) — DONE + LIVE** (zie Stand): Pendel?-toggle + client-side afleiding, slider,
  Schema auto-refresh, pendel-duur enkele-reis. Bron-recons `BESCHIKBAARHEID-MOBILE-RECON` +
  `ENGINE-DAGTYPE-BRANCHES-RECON`.
- **ISSUE 2 (dagkaart-VOLTOOID) — 2a + 2b-1 + 2b-2 DONE + LIVE** (zie Stand-top). Bron-spec =
  `docs/DAGKAART-PENDEL-RECON.md` SECTIE A + `docs/DATA-PROVENANCE-SCHEMA.md`. RESTEREND: de 2b-2-render-bug,
  2c + 2d — volgorde in de fase-lijst hieronder.

### VORMGEVING-MEETLAT (bevroren)
`docs/VORMGEVING-SPEC.md` = de **BEVROREN Schema-flow vormgeving-standaard** (LIVE GAS = meetlat, app-tokens
= styling, elk veld → zijn bron [engine/settings/D1/intervals], nooit hardcoded; **≠** = data-gedwongen
afwijking). Vastgelegd uit 8 live-GAS-schermen + het instellingen-scherm; bevat een 13-punts
RECON-CHECKLIST + de faseringsvolgorde. Leidend voor de Schema-flow-bouw hieronder.

### Geparkeerde fase-lijst — SPEC-GEDREVEN (grotendeels VOLTOOID → verder in de FASE 2 BOUWPLAN bovenaan Stand)
DONE deze reeks: ~~design-diff-recon + 2b-2-render-bug-diagnose~~ (`docs/DAGKAART-DESIGN-DIFF-RECON.md`) ·
~~2b-2-render-fix (done-vandaag)~~ (`baa0762`) · ~~vormgeving-delta-recon~~ (`9ba0e1a`, `docs/VORMGEVING-DELTA-RECON.md`)
· ~~FASE 1 Schema-flow bouw (dagkaart-states + sticky nav + coach-impact 2c + §5e-knoppen)~~ (zie Stand) ·
~~FASE 2 bron-recon~~ (`398a9e9`) · ~~brok 1 Taper~~ (`c17a205`).
**RESTEREND** — volgorde in de **FASE 2 BOUWPLAN** bovenaan Stand: ~~4b Volume→uren~~ · ~~2 Opbouw-pill~~ ·
~~3 header coachNaam~~ · ~~4a events-editor~~ · ~~5 zones 3→5~~ (alle AF; brok 5 = CLIENT-ONLY parity-herstel via
`coachActualZoneMin_`-port, GEEN divergentie) · **2d ritdetails** (resteert). Losstaand blijven:
**event-activeringsdrempel** (A-event slaapt tot ~8-12 wkn; recon-first, raakt deels de engine → sign-off) ·
**weekdoel-consistentie** (stabiliteit bij dag-selecties; gat naar GAS 254). **Amstel Gold Race** = INGEVOERD op
prod (geverifieerd in-browser).
- **Op de horizon:** Garmin-workout-push (externe device-integratie, apart traject); en de read-only
  **eind-audit** van alle geporte engine-fns (sluitstuk vóór cutover — adresseert de engine/parity-debts
  hierboven). (Beschikbaarheid/weekplanning-bewerken = GEDAAN deze sessie.)

### Lokaal (miniflare `--local`, GEEN remote/deploy)
`settings` via `PUT /api/settings` = ftp 280 / gewicht 75; **244** activities + **366** wellness via
`POST /api/sync/{activities,wellness}` (cap `days=365`). `users(1)` handmatig geseed (FK; zie debt (m)).
**Demo-seed-recipe — HISTORISCH** (de "Ardennen-trip"-event-seed is in **Fase 1 VERWIJDERD**; zie Stand-top).
De seed zat UITSLUITEND op de LOKALE miniflare-D1 (nooit remote). NB: `settings.doel` mag ALLEEN een geldige
`DOEL_OPTIONS`-waarde zijn (FTP/Conditie/Beklimmingen/VO2max/Onderhoud) — een event-naam in `doel` was de oude
fout (→ girona-fallback in Niveau). Een leak-vrije demo vereist GEEN nep-event meer; het echte A-event komt via
de events-editor (fase-lijst #4). Resterend lokaal: `settings` (ftp 280 etc.) + activities/wellness + `planner_days`.

**AANDACHTSPUNT — lokale dev-D1 en remote-D1 liepen uit sync** (lokaal: Ardennen-event + doel=FTP; remote: leeg
+ doel=VO2max). NA Fase 1: **beide doel=FTP, beide geen event.** Bij verificatie ALTIJD weten of je LOKAAL
(`192.168.1.201:5173`) of PRODUCTIE (`cadans-api.dtkorteweg.workers.dev`) bekijkt — ze lezen verschillende D1's.

**Twee geparkeerde fundament-keuzes — BESLOTEN (v1):** (1) GEEN charting-lib (hand-rolled SVG). (2) pure
engine CLIENT-SIDE (TZ-veilig want de browser = Amsterdam; omzeilt de UTC-worker-blocker, debt (d)).

## Stack

- pnpm workspaces, TypeScript strict, vitest, Biome (lint+format),
  GitHub Actions CI. Node >= 22 (CI + lokaal = Node 24; pnpm 11.9 vloer).
- **packages/engine** — pure TS (geen DB/env/fetch).
- **packages/shared** — types-only HTTP-wire-DTO's (geen runtime, geen Drizzle).
- **apps/web** — Vite + React + `react-router-dom` + vite-plugin-pwa
  (PWA-shell + Vorm-lite).
- **workers/api** — Hono + Drizzle op D1 (schema + repo-laag + `/api`-routes +
  same-origin assets-binding).

## Léán scope (v1)

- **Geen auth** deze fase.
- Schema wordt **multi-user-ready** (`user_id` op elke tabel); in v1
  hardcoded op één user.

## Roadmap

| Fase | Inhoud | Status |
|---|---|---|
| 0 | monorepo-scaffold | ✓ |
| 1 | engine-transplant + SelfTest → vitest (assert-vloer in Stand, groeit mee) | ✓ |
| 2 | D1-schema / Drizzle | ✓ |
| 3a | data-access-laag (D1 ↔ engine) + TZ-conversie + Worker-integratietests | ✓ |
| 3b | intervals.icu activiteiten-sync + remote D1 (`database_id`) | ✓ |
| 3c | wellness- + power-curve-sync (engine heeft beide nodig) | ✓ |
| 4 | Worker-API (Hono routes: reads/syncs/writes) | ✓ |
| 5 | React-PWA — shell + Vorm-lite + Niveau-v1 ✓; weekgen-orkestratie geport (5.3) ✓; Schema-UI (5.3c-ii) ✓; Trainingen volgt | ◐ |
| 6 | telegram-webhook | |

## Discipline

- **Gate** = `pnpm lint + typecheck + test + build` groen ÉN CI groen.
- PR-based review.
- Forward-only migraties.
- Secrets extern (Worker-env / `wrangler secret`), NOOIT in de repo.
- HANDOFF-fetch = pinned RAW url op commit-hash.

## Data-migratie

Sheet → D1 + cutover = aparte, mens-geverifieerde stap. Blokkeert de bouw
NIET.

## Deferred debts

Open schulden die bewust naar een latere fase zijn geschoven:

- **(a) Engine type-hardening.** De engine is een getrouwe 1-op-1 port (`var`/
  `any` behouden); Biome relaxeert de port-regels (noExplicitAny, noVar-achtige,
  isFinite, ongebruikte params) enkel voor `packages/engine/**`. Een aparte pass
  scherpt de typing aan (echte interfaces i.p.v. `any`) en her-enabled de regels.
- **(b) Engine-input-seams die de Worker (Fase 3) moet vullen.** De pure engine
  krijgt zijn IO via injecteerbare seams: **check-in** (`getReadinessScore_(…,
  checkin)`), **weekplan-reader** (`gatherWeekplanEntries_(…, readWeekplan)`),
  **gewicht** (`setGewichtProvider`), en **loadCarry/mesoFactor** (nu
  geneutraliseerd op ×1). Fase 3a WIRET de **check-in**- en **weekplan**-seams
  via de repo-laag (D1). RESTEREND: **gewicht** (Worker moet `setGewichtProvider`
  aanroepen met de D1-waarde) en **loadCarry** (nog ×1) — te vullen in Fase 3b/4.
  Zie `docs/SCHEMA-PROPOSAL.md` §1.2.
- **(c) Puurheid-boundary-check in CI.** Nog toe te voegen: een mechanische
  check die faalt zodra `packages/engine` een GAS/IO-global of externe-state-
  read binnensluipt (bv. grep/lint-regel op `SpreadsheetApp`/`PropertiesService`/
  `fetch`/`process.env` in de engine). Borgt de puurheid die de vitest-gate nu
  impliciet aanneemt.
- **(d) Datum-functies TZ-expliciet — BEVESTIGDE DEPLOY-BLOCKER (Fase 3b-probe).**
  De engine leunt op ambient TZ. De workerd-TZ-probe
  (`test/workerd-tz-probe.test.ts`) toont: LOKAAL/CI honoreert workerd de
  `Europe/Amsterdam`-pin (erft de TZ-env), MAAR een gedeployde Cloudflare Worker
  draait UTC-only. Vóór het deployen van datum-gevoelige entrypoints
  (weekgeneratie): geef de engine-datum-logica een expliciete TZ-parameter i.p.v.
  ambient. Datumvrije paden (readiness) + string-round-trips zijn TZ-veilig en
  kunnen eerder deployen. **BLIJFT open (Fase 3c):** de power-curve-**dag-bucket**
  is nu TZ-expliciet via `dates.ts` (goed), maar de datum-gevoelige
  **weekgeneratie** leunt nog op ambient `Europe/Amsterdam` → moet TZ-expliciet
  vóór deploy. **VERFIJND (Fase 4):** de sync-routes + `GET /api/power-curve`
  leunen op ambient-now; de routes geven BEWUST geen `now`/`fetchImpl` door
  (productie = global fetch) → onder een gedeployde UTC-Worker schuiven de
  dag-buckets/vensters. De pure-D1-**reads én writes** zijn TZ-veilig
  (caller-supplied datums via `dates.ts`). De **weekgeneratie** is nu **CLIENT-SIDE geport**
  (Fase 5.3, `buildWeekProposal`) → TZ-veilig in de browser (Amsterdam); `mesoWeek`/`macroFase`
  lezen echter nog ambient `new Date()` (i.p.v. de geïnjecteerde `todayISO` — debt (n)). Vóór een
  SERVER-side weekgen-deploy: runtime-TZ pinnen of `now` expliciet doorgeven. **Client-side (Fase 1b):** `parseLocalDate`
  (`apps/web/src/lib/dates.ts`) is nu de ENE bron voor ISO→lokale-Date, gedeeld door
  `parseActivityRows` + de readiness-converter (nooit UTC) → een stukje client-UTC-risico
  gedicht; de server-side sync-routes blijven de openstaande UTC-blocker. **Post-deploy (v1) BEWUST
  GEACCEPTEERD:** de UTC-sync-buckets (`wellness.ts:98`, `intervals.ts:89`, `powercurve.ts:94`+`124`)
  zijn een bekende near-midnight-NL-misbucket — niet-blokkerend; fix in een aparte vervolgchat.
- **(e) D1-TEXT-datum → Date-mapping — GEDEELTELIJK OPGELOST (Fase 3a).** De
  conversielaag `workers/api/src/db/dates.ts` (`fromD1`/`toD1Date`/`toD1DateTime`)
  is geïmplementeerd + getest (incl. DST-grenzen) en wordt door de repo-laag
  gebruikt. RESTEREND: wanneer de **Worker** in Fase 4 een DATUM-gevoelig
  engine-entrypoint (weekgeneratie) in workerd aanroept, moet de workerd-runtime
  onder `Europe/Amsterdam` draaien (of de engine TZ-expliciet worden — debt (d)),
  want de engine's EIGEN datum-logica leunt nog op ambient TZ. De Fase-3a-oracle
  vermijdt dit bewust via de datumvrije readiness-seam + TZ-invariante
  string-round-trips.
- **(f) Remote D1 — OPGELOST (Fase 3b).** `database_id`
  `aa302c17-915b-44cb-8823-89c416974f50` staat in `workers/api/wrangler.jsonc`.
  Nog niet gemigreerd/geseed op remote (dat is een deploy-stap, Fase 4+); de
  lokale --local/miniflare-flow gebruikt de binding-naam, niet dit id.
- **(g) Remote-D1-migratie-drift — GESLOTEN (eerste deploy).** `0000` + `0001` zijn nu remote
  toegepast (`wrangler d1 migrations apply cadans --remote`); `migrations list --remote` = niets
  pending; de 12 in de migraties gedefinieerde tabellen zijn remote geverifieerd aanwezig. Geen drift meer.
- **(h) Wellness→readiness-afleiding — AFGEROND (Fase 1a port + Fase 1b wiring).**
  `getReadinessScore_` (engine, `readiness.ts`) verwacht AFGELEIDE input:
  `fs.{form,ctl,atl,ramp}` + `wellness.{hrvDeficit,hrvRecent,sleepAvg3,sleepLastNight}`.
  Die afleiding (HRV-deficit vs baseline, slaap-gemiddelden, form-state) is nu geport —
  `wellnessSignal_` + `formStateFromWellness_` (Fase 1a) — en client-side gewired via
  `deriveReadiness` → `getReadinessScore_` (Fase 1b). De ReadinessCard-**score** +
  waarom-factoren zijn LIVE. De check-in (`{slaap,benen,stress}`) blijft de LOSSE 4e
  param (engine-`checkinDelta` ±2, niet de design-demo-adj).
- **(i) NULL→""-conventie bij de readiness-port — NIEUW (notitie).**
  `wellnessRowsToWellValues_` dekt de ""-conventie correct voor idx0/8/9/10 (wat
  `dashVormReeks_` leest). Bij de readiness-port bevestigen dat NULL→"" óók klopt
  voor idx5/6 (readiness, mood), die vaker leeg zijn.
- **(j) Assets-binding + mount — OPGELOST IN CONFIG (Fase 5.1a).** De
  same-origin-keuze is gemaakt: `workers/api/wrangler.jsonc` heeft nu een
  `assets`-binding (Model A: `directory ../../apps/web/dist`, `binding ASSETS`,
  `not_found_handling "single-page-application"`, `run_worker_first ["/api/*"]`) →
  PWA + Worker op één origin, geen CORS nodig. RESTEREND: de echte **prod-deploy**
  is nog niet gedaan (blijft gegated door debt (d)/(g)).
- **(k) Vorm-lite deferred-onderdelen + apps/web-teststrategie — DEELS INGELOST (Fase 5.2).**
  Nog deferred in de PWA: de `LevelCard`-**tier-chip** + "sinds"-delta, de
  `MetricRow`-**Week-TSS**, en de **W/kg-over-tijd**-grafiek. (De ReadinessCard-**score**
  + waarom-factoren zijn INGELOST in **Fase 1b** — zie debt (h).) **INGELOST (5.2):** `apps/web` heeft nu test-infra (vitest
  node-project) + het `parseActivityRows`-parse-contract is vergrendeld (vitest
  **94 → 98**). RESTEREND: de bredere PWA-teststrategie (component/e2e) is nog een open
  beslispunt, en de `/api/activities`-route blijft server-side **`unknown[][]`** (nog
  niet getypeerd naar `ActivitiesResponse` — de client parset idx0 zelf).
- **(l) Twee Niveau-wrinkles — tak (1) AFGEVINKT (visuele check), tak (2) OPEN.**
  (1) ~~De Niveau-CTL uit `ctlReeksMaandelijks_(activities)` (maandbuckets, idx8=TSS) kan
  AFWIJKEN van Vorm's wellness-CTL~~ → **opgelost door de visuele check: Niveau 49 vs Vorm 50
  = granulariteits-artefact (maandbuckets vs wellness-CTL), GEEN engine-unificatie nodig.**
  (2) De engine-fns retourneren `any`
  → `apps/web` cast de resultaten (`as NiveauPoint[]` / `number|null` / `{wkg}`; en sinds
  Fase 1b `deriveReadiness` → lokaal `ReadinessResult`); een engine-shape-drift wordt
  daardoor NIET door TS in apps/web gevangen. Echte fix = de engine-returns typeren (staat
  al onder debt (a) "future typing"; raakt meerdere consumers). BLIJFT OPEN.
- **(m) users-bootstrap — GESLOTEN (commit `2cc3f23`).** `ensureUser(db, userId)` = idempotente
  `INSERT OR IGNORE users(id=1)` (`src/db/client.ts`), gedraaid door een non-GET Hono-middleware in
  `src/index.ts` → elke muterende write self-heal't de FK-rij (dekt de 3 PUT + 3 POST + toekomstige
  muterende routes). Getest: `test/routes.ensure-user.test.ts` (PUT tegen lege D1 → `users(1)` +
  settings-rij bestaan). Geen losse seed-stap meer nodig; `CURRENT_USER_ID = 1` blijft hardcoded.
- **(n) Weekgen-port: open residuen + bewuste parity-divergenties — NIEUW (Fase 5.3).**
  NIEUW open: (1) `eventCtx=undefined` in `buildWeekProposal` (`eventContextFrom_` niet geport)
  → workouts niet event-getailord; screen-free porteerbaar. (2) day-overrides/freeze niet geport
  (handmatige plan-locks; edit/write-pad → hoort bij de UI-fase). (3) `mesoWeek` + `macroFase`
  lezen ambient `new Date()` (niet de geïnjecteerde `todayISO`) — correct voor "genereer deze
  week", latente inconsistentie als `todayISO != vandaag`; verzwakt de deterministische test (die
  zette `doelStart=null`). (4) de weekplans-intent wordt geparsed uit een `unknown[]`-blob in de
  client-pipeline (verwant aan (k)/(l)). (5) debt (l) breidt uit: ook `buildWeekProposal` cast
  engine-returns naar lokale apps/web-types (TS vangt engine-shape-drift daar niet).
  **BEWUSTE parity-divergenties** (impactloos, gelogd voor de parallel-run-validatie):
  `combineSignals_` niet-muterend (GAS muteert de wellness-arg — output-equivalent, caller
  gebruikt `.signal`); `plannedTypeByDate` uit `PlannerDay.voorgesteldType` i.p.v. GAS
  `weekplan_<monday>.workoutType` (Cadans persisteert de huidige week niet mid-week; day-mirror =
  dezelfde waarde); `rollingZoneCoverage_`-venster = 8 dagen `[today-7..today]` uit "days=7"
  (GAS-misnomer, behouden); `rollingZoneCoverage_`/`zoneDebt_` missing-zone-data → `actual=0` (GAS
  sloeg over + live-refetch, niet porteerbaar); `zoneDebt_` zonder clamp (mag negatief, GAS-getrouw).
  **Gecorrigeerd (5.3c-ii):** de in `d8492b7` als "debt n / naamlek" gevlagde "[object Object]" was
  GÉÉN engine-residu — het was de apps/web `computeMacroPhase`-object-fallback in `proposal.ts` (moest
  `.fase`), gefixt in `34d10fe` + regressie-getest. Geen engine-debt.
  **FASE B — BEWUSTE GAS-DIVERGENTIES (gelogd):** (1) band-gedreven week-plan-demote (`ae00730`) — CLIENT-ONLY, engine
  + 957-selftest ongemoeid (het plan leunt op de holistische readiness-band i.p.v. de botte `wellnessSignal_`-vlag;
  zie het FASE B-blok bovenaan Stand). (2) override-DTO draagt `from`/`src`/`label`-metadata (engine-genegeerd) voor
  make-up-idempotentie + display; round-trippt in `override_json`.
- **(o) 5.3c-ii live-Schema-cosmetica — OPGELOST (seed + focus-prettify).** De drie leaks op de live
  /dev-Schema zijn weg: (1) ~~"· null"~~ → `settings.doel='Ardennen-trip'` geseed; (2) ~~"0-0 bpm"~~ →
  `settings.lthr=178` geseed (watts klopten al, FTP 280); (3) ~~rauwe focus-bucket "low"/"high"/"anaerobic"~~
  → geprettify't via `focusLabel` (`apps/web/src/lib/schema.ts`, commit `c63d217`) naar Duur/Drempel/VO2max,
  proza-focus onveranderd. Telefoon-geverifieerd. Seed = LOKAAL (miniflare, zie seed-recipe), NIET in
  repo/remote. De `EMPTY_SETTINGS`-fallback in `loadSchemaWeek` verzacht een verse user maar raakt de
  users-bootstrap-debt (kruisverwijzing **(m)**).
- **(p) Fase-token nog Engels ("Build") — engine-copy, NIEUW (5.3c-ii nazorg).** De macro-fase wordt
  INGEBAKKEN in engine-strings: `packages/engine/src/planner.ts:623` (reden, "… — fase <macroFase>") én
  `:1079` (workout-naam, bv. "Z2 progressief (Build, ingekort)"). Er is GEEN discreet `macroFase`-veld op
  `ProposalDay`/`ProposalWeek`/`SchemaDay`. NL-prettify van de fase kan dus NIET UI-only (anders dan de
  focus, debt (o)): vereist een engine-copy-wijziging óf een discreet fase-veld dat de UI apart labelt.
- **(q) Engine-bpm-quirk in over-under-sets (low prio) — NIEUW (5.3c-ii nazorg).** De
  "Herstel · Easy tussen de sets"-blokken erven de set-drempel-HR (bv. 157-178 bij `lthr`=178) i.p.v. een
  lage herstel-HR. Visueel bevestigd op de telefoon. Engine-emit (geen UI-fix); parkeren tot de eind-audit.
