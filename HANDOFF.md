# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

## Stand

**T28 FASE 3 DEELS — pendel-weergave compleet + werkstroom 1 (label + leak) afgehandeld, LIVE (juli 2026).** HEAD `e77ae32`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29808110373>).
- **VLOEREN NU: vitest-totaal 452 · engine-selftest-assert-count 997.** Lees ze uit de suite; niet hardcoden in prompts.
- **3a (`aaab804`) — `pendelDuurMin` = duur PER RIT.** De settings-UI verdubbelde de invoer (`legToRoundTrip`); dat was de enige echte bug (de engine leest de waarde ongehalveerd en × `pendelAantal`, byte-identiek aan GAS). Verwijderd. **LIVE.**
- **3b (`72ce7eb`) — binnen-sessie Heen/Terug-split weg.** `genericPendelZ2` → één blok "Hele rit"; `genericPendelIntervals` → "Warming-up" + het werkblok. Belasting byte-identiek (totaalMin/tss/zones/structuur). **LIVE.**
- **3b-copy (`bc95df1`) — richting-bewuste notes.** Rit 1 = heen (rustig), rit 2 = terug (prikkel). Optionele `leg`-param op `genericPendelZ2` + `buildWorkout` (default "heen" → byte-identiek); de warmup-note "Aanrijden naar werk" → "Rustig op gang" omdat die generic ALTIJD de terugrit is. **LIVE.**
- **WERKSTROOM 1 AFGEHANDELD (was HOOG) — GEEN readiness-demote, GEEN override.** De "ongevraagde dinsdag-inkorting" is het GAS-getrouwe trim-label "(ingekort)": de engine-naam (`planner.ts renderVariant_`) is byte-identiek aan GAS, en het identity-contract in `zones.ts` (`scaleBlocksToFit_`) is intact — het label vuurt ALLEEN bij een échte trim, staat volledig los van readiness. Recon: `docs/T28-INGEKORT-PENDEL-RECON.md`. Fix `e77ae32` (CLIENT-ONLY, display): (a) `stripFaseSuffix` (`schema.ts`) haalt nu óók "(ingekort)" uit de display-naam (engine-naam ongewijzigd); (b) de pendel-navigatie-leak opgelost met een unieke React-key (`SchemaView.tsx` + `DayStrip.tsx`) — de niet-unieke `${s.naam}-${s.tss}`-key liet twee identieke pendel-sessies cross-day meeverhuizen tot een harde reload; nu `key={`${day.datum}-${i}`}`. Beide **LIVE** in `571a6f58`.
- **DEPLOY-STAND.** Prod Worker Version `571a6f58-1b4a-463b-bbcf-8850a728d774` = main HEAD `e77ae32` (= fase 1 + 2a + 3a + 3b + 3b-copy `bc95df1` + de twee T28-fixes `e77ae32`). De vorige deploy-achterstand (3b-copy + fixes) is weggewerkt. Migratie-stand ongewijzigd: `0005` blijft de laatste, remote-D1 meldt "No migrations to apply!" (geen schema-touch in `bc95df1`/`e77ae32`). Pendel-waarde in remote D1 (user 1): **`pendel_duur_min = 75`, `pendel_aantal = 2`** — Daan heeft in de UI herbevestigd, dus de per-rit-semantiek klopt.
- **DEPLOY-PROCEDURE ongewijzigd.** `npx wrangler deploy` MOET vanuit `workers/api` draaien (de gepinde 4.106.0, waar `wrangler.jsonc` staat) — NIET vanuit de repo-root, die pakt een nieuwere wrangler en faalt op "workspace root". De assets-binding wijst statisch naar `../../apps/web/dist` ZONDER build-hook → `pnpm --filter @cadans/web build` vanuit de repo-root vóór de deploy. Migratie-volgorde blijft: remote-D1-migratie EERST (vanuit `workers/api`), DAARNA de deploy.
- **RESTEREND SPOOR uit werkstroom 1 (niet dringend, eigen fase).** De archetype-keuze propt een lange-Z2-template (raw main 80-95 min) in een korte dag (60 min, target 45) → dáárom wordt er geknipt. Of daar een korter Z2-archetype hoort i.p.v. een lange knippen is een engine/library-vraag (R3/R4-hoek). Optionele verificatie: check op prod/dev dat DI schoon toont ("Lange Z2 steady" zonder haakje) en de weekplan-dagminuten kloppen; blijkt iets ná de fix nog ongevraagd kort dat NIET het label is → heropenen op de dagminuten.
- **CORRECTIE op het FASE 2a-blok hieronder:** de bullet "FASE 3 RESTEERT (… + pendel-opschoning …)" is ACHTERHAALD — de pendel-opschoning is met 3a/3b/3b-copy AF. Wat van fase 3 rest is 3c + 3d (zie hieronder).

**OPEN WERKSTROMEN (elk recon-first, eigen fase; prioriteitsvolgorde):**
1. **[MID] Vermogenszones ogen te hoog / bron onduidelijk.** Pendel-Z2 168-202W vs lange-Z2 216-227W — twee verschillende Z2-ranges, de tweede boven de warmup-top (140-190W). Wijst op een zone-bron-mismatch. Recon: waar komen de zones/FTP vandaan (Intervals vs lokaal berekend) en waarom verschilt Z2 per workout-type.
2. **[LAAG] Dagteller toont 1/4 bij 5 trainingsdagen.** De teller "DAGEN" telt een dubbele training niet dubbel, maar 4 ≠ 5 → mogelijk een noemer-bug of config-restje. Check of het na de goede pendel-config nog bestaat.
3. **[NIEUWBOUW] 3c — per-rit gepland-vs-gedaan-koppeling** (§2 van `docs/T28-FASE3B-PENDEL-RECON.md`). GAS koppelt óók per dag → dit is een Cadans-eigen verbetering, geen parity. Open ontwerpvraag: de koppelregel (tijdstip/volgorde/duur) + de half-gereden-status (§5 van dat recon-doc). Nog niet aangeraakt.
4. **[NIEUWBOUW] 3d — effectief weekdoel + weekfeedback.** Het globale urengetal als duur-consument (± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer. Recon: `docs/T28-FASE3-RECON.md`. Nog niet begonnen.
- Ook geparkeerd (losse tune): de warmup-verhouding in `genericPendelIntervals` — warmup = `floor(mins/2)` ≈ 37 min bij 75.
- **FOCUS VOLGENDE CHAT: werkstroom 1 hierboven = de vermogenszones (was #2, nu de hoogste resterende prioriteit).** Recon-first; verse chat.

**T28 FASE 2a KLAAR — readiness biedt korter/rust (juli 2026).** Commits `91b05cb` (2a-i) + `00819a9` (2a-ii), CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29765030319>). Recon-doc: `docs/T28-FASE2-HERSTEL-RECON.md` (commit `18dc915`).
- **VLOEREN NU: vitest-totaal 449 · engine-selftest-assert-count 972.** Lees ze uit de suite; niet hardcoden in prompts.
- **FASERING GECORRIGEERD.** De fase-2-omschrijving in het FASE 1-blok hieronder ("per-dag-minuten als PLAFOND in het weekplan; benut de tijd tenzij het type kort is of het weekbudget gehaald") is **ACHTERHAALD**. Twee redenen uit de recon: (1) *"type van nature kort"* is trainingsinhoudelijk FOUT — efforts laat in een lange rit (durability) zijn juist goede training, geen reden om in te korten; (2) de readiness-band raakt het WEEKPLAN bewust niet meer (R3-T22; `proposal.ts` `signal = "normal"`), dus er is geen fatigue-signaal ín het weekplan om zo'n plafond op te baseren. **Norm die daaruit volgt:** herstel-inkorting is FATIGUE-gedreven → per-dag en opt-in; een BELASTING-gedreven weekbudget → fase 3. Daarom werd fase 2 de readiness-uitbreiding en geen weekplan-plafond.
- **WAT 2a DOET.** Het per-dag Verlicht-voorstel (alleen vandaag, alleen op een harde sessie, band caution/rest, opt-in en omkeerbaar) biedt naast "lichter" nu ook **KORTER** en **RUST**.
  - **2a-i (`91b05cb`) — RestOverride end-to-end.** Nieuwe `RestOverride {type:"rest"}` in de `DayOverride`-union; `buildOverrideWorkout_` → `null` (ENGINE, geautoriseerd, de enige tak); `proposal.ts` zet `appliedOverride = ov` óók bij 0 sessies, zodat de rustdag de pin + "Terug naar voorstel" krijgt; worker `isValidOverride` accepteert rest (meta-checks vóór de type-dispatch, want de `durMin`-controle liep er anders overheen); `OverriddenDetail` rust-tak. "Korter" werkte al via de bestaande override-`durMin` en vroeg geen code.
  - **2a-ii (`00819a9`) — readiness biedt korter/rust.** `readinessAdjust_` (ENGINE, enige functie): caution krijgt `durFactor` uit de nieuwe geëxporteerde const `CAUTION_DUR_FACTOR = 0.8`; rest krijgt `restAllowed: true` en HOUDT de recovery-spin als aanbeveling. `buildVerlichtVoorstel`: caution → `durMin × 0,8` (clamp op de contract-ondergrens 20); rest → de spin-override plus een secundaire `RestOverride`. `VerlichtCard` krijgt bij rest een tweede knop. **Coaching-keuze:** de herstelrit blijft primair, rust staat er gelijkwaardig naast — niet opgedrongen, niet verstopt.
- **FASE 2b GESCHRAPT.** De dag-na-hard-cap (C uit de recon) is vervallen: de caveat woog zwaarder. Een rustige rit ná een harde dag is vaak juist waardevol (durability / back-to-back, relevant voor het klim-event), en de intensiteits-downgrade dekt "nooit stapelen" al. **Er komt dus geen 2b — fase 2 is met 2a compleet.**
- **FASE 3 RESTEERT (ENGINE + copy).** Effectief weekdoel (het globale urengetal ± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer + pendel-opschoning tot één plek. De herstel-bescherming die aan een WEEK-blik hangt (een dag korter of rust omdat de week al genoeg heeft) hoort hier; het per-dag/fatigue-deel is met 2a gedekt. Het `durCapMin`-mechanisme uit de recon is bewust **NIET** gebouwd — C was de enige consument — dus fase 3 bouwt de weekplan-duurhendel zodra het weekdoel de consument levert.
- **LOS EINDJE (niet blokkerend).** De `/preview`-fixtures tonen nog de oude twee-knops-VerlichtCard, dus de rust-knop en de nieuwe copy zijn nergens visueel te beoordelen (zoals eerder bij de InhaalCard). Een kleine fixture-update maakt ze zichtbaar. In de app verschijnt de rust-knop alleen bij band `rest` op een harde dag vandaag; gedekt door 7 nieuwe tests.
- **DEPLOY ONGEWIJZIGD.** 2a voegt GEEN migratie toe. De volgorde blijft: migratie `0005` op REMOTE D1 EERST, DAARNA `npx wrangler deploy`. Prod draait nog zónder `week_uren` en zónder fase 2a.
- **FOCUS VOLGENDE CHAT: T28 fase 3** (effectief weekdoel + weekfeedback + pendel-opschoning; ENGINE + copy) — recon-first, Daan reviewt vóór de bouw, expliciete engine-autorisatie. Of een andere prioriteit, bijvoorbeeld Onderhoud-soft uit R4 (vóór de winter). Verse chat.

**T28 FASE 1 KLAAR — capaciteit-veld + projectie-baseline (juli 2026).** Commit `5c031a8`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29729708477>). Schema + contract + web; **motor ONGEMOEID** (`git diff --stat packages/engine` leeg).
- **VLOEREN NU: vitest-totaal 435 · engine-selftest-assert-count 967 ONGEWIJZIGD** (vitest op vanaf 429; +6 via de weekUren-round-trip + client-serialisatie-tests). Lees ze uit de suite; niet hardcoden.
- **WAT FASE 1 DOET.** Nieuw settings-veld `weekUren` (kolom `week_uren`, migratie `0005_remarkable_centennial.sql` = één ALTER die alleen `week_uren` toevoegt, nullable integer, in `SettingsInput` OPTIONEEL zoals `coachNaam` → fixtures ongemoeid). Hele contract-keten mee: `readSettings` (`r.weekUren` — expliciete kolom-map, NODIG naast `writeSettings`, anders schrijft de PUT wel weg maar zwijgt de GET = round-trip stil kapot; door de round-trip-test gevangen) + `writeSettings` vals + PUT `/api/settings` (`numField`) + `serializeSettings` (spreidt `...s`) + client `settings.ts` (NUM_KEYS/EMPTY_FORM/settingsToForm) + Instellingen-UI (Row "Beschikbare uren per week / globaal richtgetal" onder Volume-profiel, `last` verplaatst). De **FTP-projectie-schuif** (`Niveau.tsx` → `DoelProjectie.tsx`) leest nu `settings.weekUren` als startwaarde; terugval op `weeklyHoursRecent_(rows,42)` (gereden verleden), anders 8. Dev-server geverifieerd, geen console-errors.
- **NIET GEDEPLOYD — uitrol approval-gated, TWEE delen, VOLGORDE als bij 0004.** (a) `0005` op REMOTE D1 EERST (`wrangler d1 migrations apply cadans --remote` vanuit `workers/api`), (b) DAARNA `npx wrangler deploy`. Andersom valt élke GET/PUT `/api/settings` om op de ontbrekende kolom → niet alleen het nieuwe veld maar het HELE Instellingen-scherm + de Niveau-projectie. Prod draait nu nog de code zónder `week_uren`.
- **T28-RICHTING (Daan-akkoord): B (generatief).** De coach wordt volledig leidend in hard/zacht ÉN duur; Daan levert alleen beschikbare tijd per dag + pendel-markering; herstel altijd beschermd. Coaching-NORM (vast): doe wat een gerenommeerde trainer doet — beschikbaarheid bepaalt WANNEER gefietst kan worden, de trainer bepaalt HOE HARD. De globale weekuren uit instellingen zijn de basis; een fase (peak) die meer vraagt regelt de trainer zélf mét uitleg — niet week in week uit om uren bedelen. Doeluren = het globale instellingen-getal; de coach mag er ±~1u omheen bewegen op fase, mits hij uitlegt waarom. GAS heeft hier GEEN meetlat (`getVolumeTargets` = fase-dosering, geen door-user-plafond) → coaching-deugdelijkheid is de norm, geen parity.
- **RECON-ONTDEKKING (dragend voor fase 2).** De motor kiest NU AL zelf: het AANTAL harde dagen (`kwaliteitPerWeek` uit het profiel, fase-afhankelijk: Base 2 / Build 3 / Peak 2) + WELKE dagen (`pickBestSpread_` + avoid-consecutive-hard + debt-anchors) + de endurance-fill. "Coach leidend in dag-KEUZE" bestaat dus al; fase 2 gaat NIET over dag-selectie. Wat de per-dag-minuten NU doen (`planner.ts`): niet-pendel-dag = EXACTE sessieduur (`sel.minuten` → `renderVariant_`) + archetype-keuze (`bt` → `goalWorkout_`); pendel-dag = sessie op `settings.pendelDuurMin` (per-dag-minuten genegeerd) maar telt WEL in `weekV`; week-totaal `weekV` (Σ minuten / 60) voedt de volume-adaptieve intent-weging. Pendel-inconsistentie: `weekV` telt de per-dag-pendel-minuten, de sessie gebruikt `settings.pendelDuurMin` × `pendelAantal` → onderschat de pendel-belasting (verwant aan R1-C1) → opschonen in fase 3.
- **FASE-INDELING (Daan-akkoord), elk een STOP-en-verifieer + eigen bouw, gate + CI groen, vloeren niet regresseren, prod approval-gated:**
  - **Fase 1 (KLAAR).** Capaciteit-veld + projectie-baseline (schema + web, motor ongemoeid).
  - **Fase 2 (VOLGENDE, ENGINE).** De motor leest de per-dag-minuten als PLAFOND i.p.v. vast plan: de coach kiest de WERKELIJKE duur binnen de beschikbare tijd — benut de tijd, TENZIJ het type van nature kort is (scherpe VO2max) of het weekbudget al gehaald is → dan korter of rust (herstel). EERSTE bewuste engine-wijziging → **begint met een recon-doc dat byte-precies uitschrijft wat verandert**; Daan reviewt VÓÓR de bouw + expliciete engine-autorisatie + selftest-vloer. **Verse chat.**
  - **Fase 3 (ENGINE + coach-copy).** Effectief weekdoel (globaal ± ~1u fase-modulatie, mét uitleg) + weekfeedback op de zondag-invoer (onder doel → "ruimte, optioneel meer, maar ik optimaliseer voor nu"; ruim erboven → "mooi, stappen mogelijk") + herstel-bescherming (coach mag een beschikbare dag rustig/rust maken) + pendel-opschoning tot één plek (markeren volstaat; heen Z2, terug coach-bepaald; belasting telt mee in het budget).
- **PROJECTIE-NUANCE (fase 1 context).** De grafiek start bij de werkelijke CTL van NU (verleden = gereden ritten, zit in `currentCtl`); alleen de toekomst-ramp (nu → testdag) gebruikt het uren-getal. Verleden komt dus niet uit een getal. De hele reis incl. gereden weken als lijn tonen = losse latere toevoeging, niet nodig voor T28.
- **FOCUS VOLGENDE CHAT: T28 fase 2 (engine, plafond-duur).** Recon-doc EERST, Daan reviewt vóór de bouw. Verse chat.

**INHAAL/DEBT-LAAG LIVE IN PRODUCTIE + anti-stapel-fix (juli 2026).** Fix-commit `f47ae2b`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29719111308>). Prod Worker Version `feda7a08-6893-4ce5-9db5-dca235066a40`; remote-D1-migratie `0004_lush_carmella_unuscione` (`sync_state.debt_opt_in_week`) toegepast op REMOTE. Volgorde: schema EERST, deploy DAARNA (de veilige volgorde — de loader roept `GET /api/debt-optin` onvoorwaardelijk aan binnen zijn `Promise.all`).
- **VLOEREN NU: vitest-totaal 429 · engine-selftest-assert-count 967 ONGEWIJZIGD.** Lees ze uit de suite; niet hardcoden in prompts.
- **DE OPENSTAANDE BEVINDING IS AFGEHANDELD (deel 1 van 2).** `derivePlannerGedaan` kent geen `datum < vandaag`-guard → een VANDAAG gereden harde sessie markeert vandaag gedaan en valt uit de allocator-eligibility. GEVERIFIEERD (read-only): de week-allocator hoort de geleverde harde prikkel van het kwaliteitsquotum af te trekken (`allocateQualityWeek_`: `remaining = quota − doneHard`), maar `doneHard` leest `d.voorgesteldType` en de worker schrijft `planner_days.voorgesteld_type` ALTIJD null (`repo.ts` writePlannerDays) → `isHardType_(null)` = false → de aftrek was PERMANENT INERT → een hard gereden dag stapelde bovenop het weekquotum (schendt "nooit stapelen"). FIX `f47ae2b` (CLIENT-ONLY, engine byte-identiek): `buildWeekProposal` geeft de allocator een verrijkte `weekDays`-kopie (`weekDaysForAlloc`) waarin een gedaan-dag met ≥`DEKKING_MIN_MIN` (15) high/anaerobic WERKELIJK-gereden zone-minuten een afgeleid hard `voorgesteldType` krijgt — puur voor de `doneHard`-telling. `weekDays` wordt in de engine UITSLUITEND gelezen (`doneScan` :216 + `volBron` :229), dus de UI/done-kaart + de days-map houden het originele grid; `minuten` behouden → weekvolume-som identiek. Test `quotaAftrek.test.ts` (klok gepind op 2026-03-09; FAALT zonder de fix → SLAAGT ermee). Netto: een hard gereden dag kost nu een kwaliteitsslot i.p.v. bovenop het quotum te komen.
- **DEEL 2 GEPARKEERD — post-deploy-check.** De PLAATSINGS-verschuiving (welke resterende dag het kwaliteitsslot krijgt als vandaag wegvalt) is nog NIET empirisch geverifieerd. De spreiding neemt de gereden harde dag als anchor mee via `recentHardDate_`, dat "hard" bepaalt op IF ≥ 0.85 (of intent) — een ANDER criterium dan de aftrek (zone-minuten). Randgeval: een sessie met ≥15 min high maar IF < 0.85 én lege intentByDate telt wél voor de aftrek maar mogelijk NIET als spreiding-anchor → de volgende kwaliteitsdag kan iets te dicht landen. Niet-stapelend (gaat over dag-KEUZE, niet belasting), niet blokkerend; check ná verdere prod-ervaring. Eventuele fix raakt `recentHardDate_` = ENGINE (autorisatie + selftest-vloer).
- **OPENSTAAND — functionele round-trip op prod in-browser door Daan** (hard refresh/incognito i.v.m. SW-cache): laadt de Schema-tab, dan werkt de `/api/debt-optin`-query met de nieuwe kolom.
- **FOCUS VOLGENDE CHAT: T28 — het uren-/capaciteit-model.** Recon-first + een plan dat Daan reviewt VÓÓR de bouw. Er is geen gedeclareerd capaciteit-veld; de weekplan-minuten dragen dubbel (intentie-sensor én de-facto limiet), waardoor M26/M29 geen referent hebben. Raakt vermoedelijk engine + schema + design → durable-review. Verse chat.

**INHAAL/DEBT-LAAG KLAAR — fasen 0 t/m 3b (juli 2026).** HEAD `0185a6c`, CI groen.
- **VLOEREN NU: vitest-totaal 426 · engine-selftest-assert-count 967** (op vanaf 391/961).
  **Dit zijn de ACTUELE vloeren — niet hardcoden in prompts;** lees ze uit de suite zelf.
- **WAT DE LAAG DOET.** Een geplande-maar-niet-geleverde VERSTREKEN dag draagt tekort — de
  M63-fork in `zoneDebt_`: de poort staat op verstreken (`[maandag .. vandaag)`) in plaats van
  op `gedaan`, met `debt = intent − actual`. Volledig gemist → volle intent; te licht →
  deel-debt. Dat is een GEAUTORISEERDE GAS-divergentie (`Algorithm.gs:515` slaat een
  niet-gedane dag over). De coach toont daarop een per-week **INHAAL-VOORSTEL**
  (`buildInhaalVoorstel`, `apps/web/src/lib/schema.ts`) — een tweede "wat-als"-run van
  `buildWeekProposal` met `planAdaptation: true`, gediff't tegen het actieve plan. Vier
  poorten: een betekenisvol high/anaerobic-tekort (M64/M65 — alleen `catchup_low` telt niet),
  voldoende frisheid (band ≠ caution/rest, M66), en geen rust-vragende reden (M73 —
  `bewust_gerust`/`iets_anders` onderdrukken; `geen_tijd` of geen reden laat door). De
  gebruiker keurt **per kalenderweek** goed (`sync_state.debt_opt_in_week` = de maandag);
  daarna is het herverdeelde plan het ACTIEVE plan voor die week, terugdraaibaar met één tik,
  en de goedkeuring vervalt vanzelf de maandag erna. Herstel is beschermd (M72) — structureel,
  want de week-allocator-eligibility laat een `recovery`-dagtype niet toe.
- **MECHANISME-PUNT.** `PLAN_ADAPTATION_ENABLED` (`planFlags.ts`) staat nog **false**, maar de
  inhaal-flow hangt daar NIET meer aan: de loader stuurt `planAdaptation` expliciet — via de
  per-week opt-in voor het actieve plan, en hard `true` voor de wat-als-run. De vlag gate't nu
  alleen nog het pad dat `intentByDate` buiten die twee routes voedt.
- **NORM.** `docs/TRAININGSMODEL.md` draagt de regels **M62 t/m M73** (herverdelen niet
  stapelen · gemist telt · betekenisvol tekort · kwaliteit vóór volume · herstel wint van
  inhalen · geen twee kwaliteitsprikkels naast elkaar · advies-goedkeuring-omkeerbaar ·
  per-week scope · twee bevindingen · herstel beschermd · de reden weegt mee). Recon:
  `docs/INHAAL-DEBT-RECON.md`.
- **[AFGEHANDELD — nu LIVE; zie het bovenste blok.]** **NIET GEDEPLOYED.** De laag staat op main en is lokaal getest, maar draait NIET in
  productie — prod draait tot nader order de versie zónder deze laag. Uitrollen is
  approval-gated en bestaat uit TWEE delen die BEIDE moeten: (a) `npx wrangler deploy`
  (Worker + web-assets) en (b) de forward-only D1-migratie **`0004_lush_carmella_unuscione.sql`**
  (`debt_opt_in_week`) op REMOTE/prod-D1 — `wrangler d1 migrations apply cadans --remote`
  vanuit `workers/api`, **nog niet gedraaid**. Let op de volgorde: de loader roept
  `GET /api/debt-optin` onvoorwaardelijk aan binnen zijn `Promise.all`, dus deployen zónder
  de migratie laat de hele Schema-tab omvallen, niet alleen de inhaal-kaart. Migratie eerst.
- **[AFGEHANDELD — geverifieerd + gefixt in `f47ae2b`; zie het bovenste blok.]** **OPENSTAANDE BEVINDING — te verifiëren VÓÓR deploy.** `derivePlannerGedaan` kent geen
  `datum < vandaag`-guard. Een rit die VANDAAG gelogd is markeert vandaag dus als gedaan →
  vandaag valt uit de allocator-eligibility → de resterende quality-plaatsing van de week kan
  verschuiven. Conceptueel in lijn met adaptief plannen, maar NIET geverifieerd of het
  deugdelijk uitpakt: telt de allocator de al-geleverde sessie mee, of ontstaat er dubbele
  belasting? Blootgelegd doordat een datum-relatieve testfixture omviel toen de kalender
  doorliep (fixtures staan nu op absolute datums). Onderzoeken vóór uitrol; geen regressie
  van deze laag.
- **GEPARKEERD.** M70 — de weekend-inhaaltak is vrijgesteld van avoid-consecutive-hard en kan
  naast een harde dag landen; randgeval dat Daans huidige config niet raakt, hoort bij een
  latere allocator-fase. Per-dag-debt-uitsluiting op dispositie (engine, buiten scope; M73 is
  bewust een grove week-poort). De wat-als-run draait per render voor niet-goedgekeurde weken
  — puur en client-side, maar het is wél twee keer het weekplan doorrekenen.
- **VOLGENDE HORIZON (Daan-doel): het uren-/capaciteit-model (T28).** Er is geen gedeclareerd
  capaciteit-veld; de weekplan-minuten dragen nu dubbel (intentie-sensor én de facto limiet),
  waardoor M26/M29 geen referent hebben. Expliciet "hoeveel uur heb ik" invoeren dient het
  pendel-optimalisatie-doel het meest direct.

**LAAG 2 KLAAR — het per-dag VERLICHT-VOORSTEL + de week-brede stille demote ERUIT (T22 opgelost).** HEAD `6799c7a`, CI success (run <https://github.com/daanhhk/Cadans/actions/runs/29684618388>).
- **VLOEREN NU: vitest-totaal 391** (op vanaf 371; +20 via `verlicht.test.ts` + `proposal.test.ts`) · **engine-selftest-assert-count 961 ONGEWIJZIGD** (engine niet aangeraakt; `git diff --stat packages/engine` leeg). **Dit zijn de ACTUELE vloeren — niet hardcoden in prompts.**
- **WAT LAAG 2 DOET.** Op een doordeweekse VANDAAG met een HARDE sessie (`isHard` via `workoutZones` high/anaerobic) ÉN band ∈ {caution, rest} ÉN fase NIET Taper/Recovery → een `VerlichtCard` (`apps/web/src/components/schema/VerlichtCard.tsx`) in het CoachCallout-formaat met VOORWAARDELIJKE aanbod-copy ("Ik kan…", geen daad-claim, M55-safe) + `[Verlicht…]` / `[Hou origineel]`. Akkoord → dag-override `src:'readiness'` via de BESTAANDE keten (`putOverride` → `PUT /api/override/:date` → `ProposalDay.override` → `OverriddenDetail` → "Terug naar voorstel", omkeerbaar). Transformatie = `readinessAdjust_` (`coach.ts:595`, geport, ONGEWIJZIGD): caution → `demoteType_(type)`, rest → `recovery`. Override-vorm: `tempo`/`recovery`/`long_z2` → library; `combo_long_with_efforts` + `pendel_z2` → free (staan niet in `OVERRIDE_WORKOUT_TYPES`); pendel-multisessie overgeslagen (`sessions.length !== 1`). "Hou origineel" = sessie-scoped dismissal (module-level Set, GEEN D1-persistentie) → komt terug bij de volgende app-open zolang de band caution/rest is. Copy in `coachNarrative.ts` (`verlichtAanbodRegel`/`verlichtResultaatRegel`/`verlichtActieLabel`/`verlichtBadgeLabel`).
- **STAP 1 — de stille demote eruit.** `proposal.ts:383-404`: de band→signal-vertaling + `combineSignals_` zijn vervangen door `const signal = "normal"`. Geverifieerd (`proposal.test.ts`): band caution én rest leveren `JSON.stringify(days)` BYTE-IDENTIEK aan band ready; `WELL_RECOVERY` + `WELL_SUSTAINED_LOW` laten het plan ongemoeid. Het week-vooruit-plan is weer het onverzwakte beste plan. De readiness-band-BEREKENING + de banner/context-weergave zijn ONGEMOEID — alleen het doorgeven van de band als week-demote-signaal aan `assignWorkouts` is vervallen. **BEWUSTE GAS-DIVERGENTIE:** GAS demote't óók week-breed, maar via het BOTTE signaal (`Algorithm.gs:91`/`:137`); Cadans verzwakt niet meer week-breed, alleen per-dag-op-akkoord.
- **CONSEQUENTIE (T30 structureel dood).** Het week-signaal was de ENIGE consument van het `rpeSignal_`/`plannedTypeByDate`-pad → dat pad is vervallen. `PLAN_ADAPTATION_ENABLED` (`planFlags.ts:25`) gate't daardoor nog uitsluitend `intentByDate` (`proposal.ts:143`). Vlagwaarde NIET aangeraakt; alleen de doc-comment waarheidsgetrouw bijgewerkt. De "stille RPE-beslisser"-zorg (R3-T22/T30) is hiermee niet enkel uit, maar structureel weg.
- **REFACTOR (bijvangst).** `OVERRIDE_WORKOUT_TYPES` verplaatst naar `packages/shared` (de worker importeert 'm nu) → tweede kopie vermeden.
- **OPENSTAAND — VISUELE CHECK.** Alleen de NEGATIEVE paden zijn in-browser bevestigd (band ready 91 + bestaande handmatige override → géén kaart, geen coachregel, geen console-errors); de POSITIEVE paden zijn door de 20 unit-tests gedekt, NIET visueel (screenshot liep op een timeout). De VerlichtCard-weergave + de overgang naar `OverriddenDetail` na akkoord verschijnen vanzelf op een doordeweekse vandaag met een harde sessie + lage gereedheid → dan in-browser checken (hard refresh i.v.m. SW-cache). Niets forceren.
- **CUTOVER-STATUS.** Blokker (c) is nu grotendeels DICHT — plan-van-record (1a+1b) + het per-dag verlicht-voorstel staan. RESTEERT binnen (c): de **INHAAL/DEBT-laag** (bewust een EIGEN FASE), want die vraagt de `gedaan`-koppeling (activiteit↔plan; `planner_days.gedaan` staat nu altijd 0, `repo.ts:367`) + `PLAN_ADAPTATION_ENABLED` aan + de debt-aware basis + de "deze sessie vult je tekort aan"-uitleg-copy (`coachNarrative.ts:44-63`, `catchup_*` ligt al klaar). (a) FASE-C Garmin-push en (b) DocProp-migratie blijven open. Recon-doc: `docs/LAAG2-VERLICHT-RECON.md` (commit `6446fb3`).
- **FOCUS VOLGENDE CHAT: keuze aan Daan** — (1) de INHAAL/DEBT-fase (sluitstuk van blokker c), (2) blokker (a) Garmin-push, of (3) blokker (b) DocProp-migratie. Plus de openstaande visuele check van de VerlichtCard zodra een geschikte dag zich voordoet. Verse chat.

**PLAN-VAN-RECORD + CROSS-WEEK RECENCY KLAAR — laag 1a + 1b (juli 2026). Eerste pre-switch-bouw.** HEAD `9ebfa1b`.
- **VLOEREN NU: vitest-totaal 371 · engine-selftest-assert-count 961** (op vanaf 329/957). **Dit zijn de ACTUELE vloeren** — oudere entries hieronder noemen historische waarden; nieuwe chats nemen deze. Bevestigd tegen HEAD.
- **1a (plan-van-record).** De weekplans-blob wordt weggeschreven (`persistWeekplan`, fire-and-forget, dedup op de vooruit-dagen); de WORKER bevriest het verleden (`mergeFrozenWeekplan` = `snapshotDayAction_`-parity, `Algorithm.gs:57`/`:185`, gestuurd door `todayISO` uit de body). V24: `plannedForDone` leest de BEVROREN entry i.p.v. te reconstrueren met de FTP-van-nu. 3a: `zeroIntentOutsideZones` nult per sessie de buckets buiten `zones` vóór de aggregatie (de blob wijkt daardoor af van een GAS-export → de migratie transformeert). De DECIDERS (intent-dekking + RPE-demote) staan achter `PLAN_ADAPTATION_ENABLED=false` → vooruit-plan byte-identiek. Recon: `docs/PLAN-VAN-RECORD-RECON.md`. Commits `fbbc292` + `5c36490`.
- **1b (cross-week recency).** De `goalWorkout_`-seed wordt cross-week gevoed via een 13e OPTIONELE param op `assignWorkouts` (`recencyEntries`; GEAUTORISEERDE engine-wijziging, byte-identiek als weggelaten). De client voedt de al-gegatherde weekplans-lijst rechtstreeks — `getWeekplans` levert al de output van `gatherWeekplanEntries_`, dus geen reader. ONGEGATE (benign: kiest tussen even geldige sleutelsessies, verzwaart/verlicht niet). Meting: 15/15 doel×fase flippen, C-geval stabiel; `archetypeId` is LIVE (de `:1455`-comment was stale, herschreven — 1a's "archetypeId structureel null" was een fixture-datum-meetfout). Recon: `docs/RECENCY-1B-RECON.md`. Commit `9ebfa1b`.
- **BEWUSTE GAS-DIVERGENTIE (gelogd).** De seed neemt ALLEEN weken vóór deze week (`proposal.ts`, filter `datum < weekMonday`), terwijl GAS de huidige week wél meeneemt (`Algorithm.gs:971`, k=0, `refISO=null`). Reden: Cadans hergenereert+schrijft op ELKE render → ongefilterd leest de seed zijn eigen output terug, overschaduwt de vorige week volledig (gemeten: plan identiek aan een lege blob → cross-week dood) en flip-flopt over renders. De filter levert GAS' BEDÓELING (persistente cross-week-rotatie) robuuster dan GAS zelf; stabiliteit vastgelegd over 4 opeenvolgende renders. Type: fork die een GAS-quirk corrigeert in Cadans' render-model, geen semantische wijziging.
- **CUTOVER-STATUS.** Van de drie blokkers is (c) NU HALF rond — de plan-van-record-basis (1a+1b) staat; de **TWEE-RICHTINGEN-COACH** (verzwakking + inhalen via voorstel-en-bevestig) is het resterende, cutover-kritische deel. (a) FASE-C-push en (b) DocProp-migratie blijven open. Landmijn **V15 (recency) is hiermee OPGELOST** (was niet-blokkerend).
- **FOCUS VOLGENDE CHAT: laag 2 = de TWEE-RICHTINGEN-COACH.** Enige stuk met écht nieuwe UI en GEEN GAS-meetlat → Claude-Design-ontwerpronde vóór de bouw (chat-Claude seint). Verse chat.

**R4 KLAAR — cutover-verdict (juli 2026). REVIEW-KETEN R0→R4 COMPLEET.** Verdict-doc `docs/R4-CUTOVER-VERDICT.md` (223 regels), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/d3830b38c5c6bd0f1aded09d2d57178696a72400/docs/R4-CUTOVER-VERDICT.md> Per vondst uit R1+R2+R3: cutover-blokkerend ja/nee, getoetst aan het MODEL (niet GAS-parity op zich). Docs-only, engine/vloeren ongemoeid (vitest 329, engine-selftest 957), CI groen (run 29673175155), training onaangeroerd (3e8090a).
- **DREMPEL (Daan-akkoord):** drie onafhankelijke assen per vondst — HERKOMST (geërfd/geïntroduceerd/ontbrekend) · BLOKKEREND (ja/nee) · URGENTIE (los van de cutover). Blokkerend ⟺ bereikbaar onder Daans single-user-config (doel FTP→onderhoud, A-event AGR actief, prod gevuld) ÉN echte regressie t.o.v. GAS ÉN schaadt training/levering/claim (M5). Geërfd → niet blokkerend (de modelschending zat al in GAS; de cutover maakt 'm fixbaar, niet slechter). Náást de as: LANDMIJN (blokkeert een latere bouw) + MIGRATIE-VOORWAARDE (dataverlies bij cutover).
- **DRAAI-HET verschoof twee dingen (bevroren GAS geverifieerd):** (1) `effectiveMacroFase_` (`Algorithm.gs:71`+`:137`) pint Onderhoud→Base ÓVER de event-fase heen → met AGR actief + doel FTP is Daan event-gedreven (T11/T12/T13 vuren NIET voor hem); op Onderhoud overschrijft de pin de race-piek/taper. (2) De T22-week-demote is OPGELEGD, byte-identiek geërfd (bereikt op echt lage HRV/slaap); GAS voedt het BOTTE signaal, Cadans routeert door `getReadinessScore_` + ochtend-check-in = geïntroduceerd-gevoeliger. BESLUITEN' "auto-demote (GAS bood aan)" sloeg op de APARTE today-overlay (T24).
- **BLOKKEERT DE OVERSTAP (drie):** (a) FASE-C-push (ONTBREKEND, geen levering M56; de oude app pusht door tot de switch) · (b) migratie van de DocProp-weekplan-snapshots (gepland-vs-gedaan-historie, valt buiten "Sheet→D1", gat groeit zolang GAS uit staat) · (c) het pakket **plan-van-record + twee-richtingen-coach** (Daan-eis: verzwakking ÉN inhalen via voorstel-en-bevestig; bouwt op dezelfde plan-van-record als de migratie → één pakket vóór de switch).
- **URGENT, NIET BLOKKEREND (geërfd):** Onderhoud-soft (E: T8/T9/T10/T19 — 36' hard bij elk urenbudget + de pin overschrijft de race-piek; wég vóór de winter, de belangrijkste trainings-fix) · korte-dag-val (T17: 35-51'→geforceerd vo2max) · coach-copy-overreach (T25: "sterker straks" M5 + geen hedge) · pendel-dubbeltelling (C1: 75/rit × 2-ritten moet 2×75=150 worden, heen Z2/terug best, niet 300).
- **LANDMIJNEN (blokkeren de V7-bouw, niet de cutover):** zones/intent-misteling · verleden-reconstructie met de FTP-van-nu (V24) · recency-seed 2e ingreep + reader-param door `assignWorkouts` (V15) — samen bouwen; carry-forward moet 7 rijen leveren (V14); event-veld `hm` vs `hoogtemeters` (V8); fase 6 `EEE`/`d-M` stil (V16).
- **RAAKT DAAN NIET (multi-user-voorwaarde):** verse-user-lek 0-0W (C0/A1/T29) · test-week + klim-route (T11/T12/T13). Reële defecten voor een tweede gebruiker.
- **BOUW-VOLGORDE (Daan-akkoord, §6 verdict-doc).** VÓÓR de cutover = één pakket: plan-van-record (weekplans-schrijver + `gedaan` + `voorgesteldType`) MÉT de drie landmijnen → twee-richtingen-coach op die basis (verzwakking- én inhaal-voorstel, standaard origineel behouden, coach zegt waarom) → migratie-export (DocProp-snapshots + preset-vocab + mesoWeek/loadCarry) → FASE-C-push. Interim: band-aansturing → botte signaal. NÁ de cutover op urgentie: Onderhoud (E, vóór de winter) → T17 → C1 → T25 → product-richting (vijf doelen, duurvermogen-maat, capaciteit-veld, event-tailoring, RPE-als-informant + dispositie-benen-optie). Elke fix = eigen bouw-chat.
- **FOCUS VOLGENDE CHAT: BOUWEN.** De review is dicht (R0→R4); Daan bouwt nu. Eerste bouw = het pre-switch-pakket (plan-van-record). Elke bouw-chat: recon-first waar durable (engine/D1/design), Daan reviewt vóór de bouw; gate = pnpm lint+typecheck+test+build groen (--frozen-lockfile) + CI groen; de vloeren (vitest/engine-selftest, §STAND) mogen niet regresseren — hardcode ze niet in prompts; engine read-only tenzij expliciet geautoriseerd. Verse chat.

**R3-d KLAAR — invoer / grens (juli 2026). R3 GESLOTEN (a+b+c+d).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T28-T30), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/2e4c4a8450619ce908b3a1f628611aea56c4b32b/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd, vloeren ongewijzigd (vitest 329). **3 vondsten: T28-T30** (§4+§5, M21-M32; M21 geen vondst — de app gate't niet op leeftijd/niveau/volume). Reeks append-only (T6 ongebruikt, T7 ingetrokken). Kern: **§5 heeft geen gedeclareerd capaciteit-veld** (M26) — er is niets om onder te zitten of tegen te spreken.
- **T28 geen gedeclareerd capaciteit-veld — de ruggengraat van d** (M25/M26/M29). De `settings`-tabel (`schema.ts:56`) heeft alleen `profielPreset`, precies wat M26 uitsluit (dosering, geen limiet); erger, de engine leest 'm nergens (`settings.ts:108`, display-only label = R2-V1). Het plan gebruikt de weekplan-minuten als capaciteit (`planner.ts:227/232`) → de weekplanner draagt dubbel: intentie-sensor (M28) én de facto capaciteit (M25). Gevolg: M26/M29 hebben geen referent. De énige data→uren-baan (de projectie-schuif, `weeklyHoursRecent_`, `DoelProjectie.tsx:393`, clamp 4..14) BEPAALT de uren i.p.v. TEGENSPREEKT (M29 omgekeerd; M27-plateau-inbak). Herkomst: GEËRFD (GAS heeft ook geen capaciteit-veld; `getVolumeTargets` = fase-band dosering-target).
- **T29 zichtbaarheidsgrens niet bewaakt — lege huls** (M22/M23/M24), GEDRAAID. ftp=null (verse user → `EMPTY_SETTINGS`, `schema.ts:697`) → identiek plan, watt-targets overal 0-0W, TSS onveranderd (68/61/126/48 vs ftp=280) → M24's lege huls, en M23's model valt NIET weg (geplande TSS is %FTP-relatief). Leeskant: sync neemt `icu_training_load` zonder vermogen-vs-HR-onderscheid (`sync.ts:79`). Herkomst: grens-poort ontbreekt GEËRFD (GAS maskeert met ftp-default 280, `Settings.gs:73`); de zichtbare 0W-lek is Cadans (R2-C0).
- **T30 sensoren: RPE-mismatch bedraad-om-te-sturen (uitgehongerd); dispositie gevangen-niet-bedraad + geen benen-optie** (M30/M31 + M15/M18), GEDRAAID. `rpeSignal_` (`readiness.ts:521`) → `combineSignals_` (`:560`) → demote (T22-pad): bedraad om te STUREN, niet "niet aangesloten" zoals M31 stelt. Inert omdat `plannedTypeByDate` uit `voorgesteldType` komt (`proposal.ts:314`), altijd null geschreven (`repo.ts:366`, R2-V7); gevuld → stille demote (M30/M15/M18, als T22). De dispositie-reden (`disposition.ts:8`) is wél niet-bedraad (engine leest 'm nergens) én mist de benen-kant (`geen_tijd`/`bewust_gerust`/`iets_anders` = agenda/keuze/restpost). Herkomst: dispositie-set + demote GEËRFD (`WebApp.gs:1634`); RPE-band-route = Cadans (`ae00730`). M30-toets op T22: informant/proxy als beslisser.
- **T14-toets (event als invoer):** M30's sensor-taxonomie noemt de event/doel-invoer niet, terwijl dat de meest structurele invoer is (T14: het event neemt het plan over) → klein gat in M30; de agency-kant van T14 blijft a/c. Geparkeerd (M9/M39): T28 legt vast waaróm de uren-schuif-vraag bestaat, lost 'm niet op.
- **FOCUS VOLGENDE CHAT: R4** — verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; criterium = het MODEL. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R3-c KLAAR — agency / bewijslast / coach-stem (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T22-T27), gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/ec7d38af1493b77140720f2d3bb88e2eddaa4db4/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd, vloeren ongewijzigd (vitest 329). **6 vondsten: T22-T27** (§2+§3+§9, M10-M19+M53-M56). Reeks append-only (T6 ongebruikt, T7 ingetrokken door T10 — niet hernummerd). Kern: **M10 (voorstellen-en-bevestigen) heeft NUL implementatie** — het plan verandert stil.
- **T22 readiness-band herschrijft de week stil — DE ZWAARSTE, GEDRAAID** (M10/M11/M13/M15/M16/M18 + M12). caution → hard-dagen naar `tempo`, rest → hele week `recovery`; geen voorstel/bevestiging, origineel overschreven. De ochtend-check-in (−6) tikt de band een niveau omlaag → stuurt stil je week (M12-omkering). Herkomst: demote GEËRFD byte-identiek (`Algorithm.gs:1155-1167` ↔ `planner.ts:763-771`); band-bedrading via `getReadinessScore_` = Cadans-DIVERGENTIE (`ae00730`), routeert door de exacte score die M18 afwees. Gemeten op de standaard-fixture.
- **T23 inhalen gebouwd maar niet aangesloten** (M10/M13, koppelt R2-V7). `catchup_*` (`planner.ts:659-694`) hangt aan `zoneDebt_`, maar de client schrijft nooit een weekplan (`PUT /weekplan/:monday` bestaat, `repo.ts:151`, geen aanroeper) → debt=0 → vuurt NOOIT. Aangesloten zou hij stil ingrijpen ("Ik heb je schema bijgesteld"). Herkomst: niet-aansluiting = V7-wortel; stil-ontwerp GEËRFD.
- **T24 geen voorstel-oppervlak; "ik heb verlicht"-copy claimt gebeurde daad** (M10/M16/M55). `readinessAdjust_`/`readinessRegel_` geport+geëxporteerd (`coach.ts:595/637`) maar alleen in selftest → inert. GAS' copy (`Coach.gs:330`) claimt de daad vóór commit → M55, niet hergebruiken.
- **T25 dag-coach hedge't nooit — GEDRAAID** (M53/M54/M55/M5). Grep op wellicht/misschien/mogelijk/raadt over `coachNarrative.ts` = LEEG. Demote-copy belooft "sterker straks" (M18-ongedekt = M5). Contrast: de doel-projectie hedge't WÉL (aannames+bereik+vloer) → vondst beperkt tot de dag-coach. Herkomst: warme copy Cadans-DIVERGENTIE.
- **T26 dag-coach kan niet strategisch sturen op tijd-rendement** (M53, koppelt T17/T19/T20). Alleen per-dag-pools; geen "extra uur levert weinig → 2e kwaliteitssessie". Nuance: de projectie toont wél "+2u → N weken eerder". GEËRFD.
- **T27 test-week-copy verkoopt terugkerende test als betekenisvolle meting** (M5/M53) — coach-kant van T12. De `test`-pool (`coachNarrative.ts:135`) affirmeert een doel dat het fase-teller-artefact (elke week ná wk12, 4/5 doelen) niet heeft. Herkomst: copy Cadans-DIVERGENTIE.
- **SEED-CORRECTIE (M56):** a's zaad "combo niet leverbaar (blokken undefined)" WEERLEGD na draaien — de levering leest `workout.structuur` (niet `blokken`); de combo IS getrouw leverbaar (Efforts-rij → 3-intervallen-ZWO met rust). `blokken: undefined` raakt alleen de silhouet (weergave) + coach-segmenten (V21, toch al null). Geen M56-vondst.
- **NAAR DE MODELVRAAG (geparkeerd, ná R3 — M9/M39, GEEN agency):** (1) moet de FTP-projectie een echte daling tonen bij ondertraining? (de vloer = huidige FTP toont nooit achteruitgang). (2) moet de uren-schuif (nu op recent geréden volume, `weeklyHoursRecent_`) aan de plan-instelling-uren gekoppeld? Getraceerd: de projectie (`DoelProjectie.tsx:431` `ftpBandFromProjection_`) verankert al op de wérkelijke CTL (`Niveau.tsx:117`, draagt gereden weken/tekorten) en is al een bereik met hedge → slaagt op c's toets. Validatie via de intervals.icu-tijdlijn, BUITEN de repo (circulariteit-valkuil: bouwen+toetsen op dezelfde data bewijst niks; n=1).
- **FOCUS VOLGENDE CHAT: R3-d** — invoer/grens (§4 + §5 van het model: M21-M32, 12 regels). **R3 a+b+c KLAAR** (T1-T27; T6 ongebruikt, T7 ingetrokken). d sluit R3; daarna R4 = verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; criterium = het MODEL. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R3-a KLAAR — a1 + a2 + a3 (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md`, gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/424bb68b4adedf0db5c54227dc5f46e56a63ae97/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only,
engine ongemoeid, niets gedeployd, vloeren ongewijzigd. **13 vondsten: T1-T5 (a1) + T7-T9 (a2) +
T10-T14 (a3).** T6 bewust niet uitgegeven; **T7 is INGETROKKEN door T10** en blijft letterlijk staan;
de reeks is append-only en wordt niet hernummerd.
- **R3-SCOPE (Daan akkoord, 17-07-2026) — de INVENTARIS IS HET MODEL, niet de matrix.** 61 M-regels,
  mechanisch geteld, geen gaten. Negen vallen af met reden (M1-M4 = over het document zelf;
  M6/M20/M59 = binden de REVIEW; M60/M61 = INGETROKKEN); M57/M58 vallen buiten de trainings-laag.
  **50 binden de app**; M5 (claimregel) is dwarsdoorsnijdend; **49** in vier brokken: **a** (KLAAR)
  doel→fase→prikkel (§6+§8, M33-M42+M49-M52, 14) · **b** (KLAAR) dosering (§1+§7, M7-M9+M43-M48, 9) · **c**
  agency/bewijslast/coach-stem (§2+§3+§9, M10-M19+M53-M56, 14) · **d** invoer/grens (§4+§5, M21-M32,
  12). Volgorde a→b→c→d: a en b delen één proefopstelling, a's uitkomst is b's invoer.
- **R3 SCHRIJFT GEEN MODEL-REGELS.** Legt een vondst een gat in het MODEL bloot, dan ís dat de vondst.
- **DE MATRIX HELPT IN R3 NIET, en dat is bewezen:** `effectiveMacroFase_` is AST-identiek, bereikbaar
  én door beide oracles geraakt — de rustigste cel — en tegelijk de spil van T9/T12.

**⚠ FIXTURE-CORRECTIE (a3) — LEES DIT VÓÓR JE MEET.** `allocateQualityWeek_` dateert zich op de
AMBIENT klok (`packages/engine/src/planner.ts:537`); de rest van de pijplijn op `input.todayISO`
(`apps/web/src/lib/proposal.ts:341`). **In de app vallen die ALTIJD samen** (`apps/web/src/lib/schema.ts:856`
`const todayISO = todayIso()`). De a1/a2-standaard-fixture (ma 2026-07-13, `todayISO` = die maandag)
liep op een klok van 17/18-07 → di+do vielen buiten de allocator en door naar `keyIntensity`. **Elke
nieuwe meting stubt `Date` op de fixture-datum** (bundel-niveau, geen repo-wijziging) — anders meet je
een pad dat de app niet draait. GAS kent de seam niet (`src/Algorithm.gs:93` + `src/Algorithm.gs:1019`
= twee keer ambient) → dit is een fixture-eigenschap, geen app-vondst.

- **T1 de doel-lijst is niet die van het model** (M34/M35/M36/M42). `packages/engine/src/phase.ts:12`
  `DOEL_OPTIONS = FTP/Conditie/Beklimmingen/VO2max/Onderhoud`. VO2max staat er als DOEL (M35: middel);
  Beklimmingen is één doel waar M36 er twee eist. GEËRFD, 1-op-1.
- **T2 vijf doelen, TWEE meetlatten** (M33). `packages/engine/src/niveau.ts:629` `activeGoalProfile_`:
  FTP → ftp, **al het andere → girona**. Bij Onderhoud intern tegenstrijdig: `langeRitPerWeek: 0` +
  meten tegen een lange-rit-doel van 4 u. GEËRFD én ORACLE-BEVROREN (`src/SelfTest.gs:410`).
- **T3 CTL draagt het label "Duurvermogen"** (M39 + M5): girona-dim `key:"duur"`, `metric:"ctl"`,
  `target:65` — precies de claim die M39 OPEN verklaart.
- **T4 "Duurvermogen" kiezen koopt −3 minuten duur** (M38). `packages/engine/src/archetypes.ts:1138`
  `GOAL_KWALITEIT_INTENTS_ = ["drempel","sweetspot","vo2"]` — DRIE kwaliteits-intents, GEEN
  duur-intent. **Duur is geen hendel die een doel kan bedienen.** GEËRFD. (De tabel is gemeten op de
  scheve klok; het mechanisme — er ís geen duur-intent — staat er los van.)
- **T5 het haalbaarheids-oordeel dat M41 verbiedt, staat er letterlijk** (M40/M41 + M8(a) + M27/M29 +
  M5). `apps/web/src/components/niveau/DoelProjectie.tsx:742` "…zo niet haalbaar. Verhoog het volume.",
  op een default die `apps/web/src/pages/Niveau.tsx:157` uit het GEREDEN volume afleidt.
  **HERKOMST (a3): GEËRFD, byte-identiek** — `src/Script.html:1633` (de zin) + `src/WebApp.gs:1268`
  (de afgeleide default). Cadans' bereikbaarheid wás groter (vuurde ook op FTP); hersteld in `7308d660`.
- **T7 — INGETROKKEN DOOR T10.** Luidde "Onderhoud = zacht trainen is ONJUIST, weerlegd door meting"
  (94' vs FTP 66'). Die tabel is op de scheve klok gemeten. **M50's regel én motivering staan.**
- **T8 de 45-minuten-cap begrenst de PRIKKEL, niet de sessie — DE ZWAARSTE VAN a** (M46 + M37/M38 +
  M5). Enige lezer van `maxDuurMin`: `packages/engine/src/planner.ts:411`; `bt` gaat UITSLUITEND naar
  `goalWorkout_` = de archetype-KEUZE, de sessie wordt op `sel.minuten` gebouwd. GEDRAAID: altijd
  "Sweet Spot 2×10 kort" met 20' werk, van 45' tot 240'. GEËRFD, byte-identiek. **T10 promoveert hem:
  T8's cap is het mechanisme achter de vlakke 36'.**
- **T9 de app plant op een andere fase dan hij toont** (M49/M50). `packages/engine/src/planner.ts:87`
  `effectiveMacroFase_` pint Onderhoud op `"Base"`; de docstring noemt de reden zelf ("→ allocActive
  TRUE + een eerste-klas fase, geen missing-key") = M49's loodgietersfix, bewezen uit de eigen
  documentatie. Payload draagt de gepinde fase (`apps/web/src/lib/proposal.ts:210`). **STAAT — en T12
  maakt hem STERKER: het lek dat de pin dicht is echt, en staat voor de andere vier doelen open.**
- **T10 T7 IS WEERLEGD — Onderhoud is op elk urenbudget MINDER intensief dan FTP, en VLAK** (M37/M38/
  M50 + M7). GEDRAAID, gecontroleerd (alles gelijk, alleen de klok verschilt): hoog-intent per week
  **Onderhoud 36' bij 405', 210' én 180'** vs FTP 77'/45'/45'. Zelf-controle: FTP verschuift bij
  210'/180' NIET (45' in beide klokken) → de verschuiving raakt Onderhoud, niet de fixture. Mechanisme
  = het PROFIEL, niet `keyIntensity`: `kwaliteitPerWeek Build:2` (ftp 3) + `langeRitPerWeek:0` +
  `maxDuurMin:45` (T8) → 2 "kort"-sessies, 20' + 16' = 36', bij 180' **exact dezelfde twee sessies**.
  **Onder M7: een extra uur koopt bij Onderhoud nul extra prikkel.** GEËRFD.
- **T11 `keyIntensity` stuurt het plan niet** (M49 + M5). De endurance-fill van de allocator
  (`packages/engine/src/planner.ts:433`) geeft ÉLKE eligible dag een plaats, en de allocator-tak gaat
  vóór (`packages/engine/src/planner.ts:622`). GEDRAAID, mechanisch: **400 weken** (5 doelen × blokweek
  1-20 × 4 week-vormen) → **180 `keyIntensity`-treffers, alle 180 in fase Test**, nul in Base/Build/
  Peak, nul bij Onderhoud. Dus: de profiel-tak (`packages/engine/src/planner.ts:847`) onbereikbaar,
  `climbTypeWorkout_` onbereikbaar (→ T13), en de Taper-/Recovery-guards
  (`packages/engine/src/planner.ts:841` +
  `packages/engine/src/planner.ts:842`) dood. **BESLUITEN' vondst 1 wijst het verkeerde
  mechanisme aan.** VIERDE "comment claimt een premisse die de bron tegenspreekt" (na V1-(b), V23, T9).
- **T12 na blokweek 12 plant de app ELKE WEEK een FTP-test, voorgoed** (M46/M49/M5).
  `packages/engine/src/phase.ts:52` `fase = "Test"` zonder bovengrens → `allocActive` uit → de hele
  week-allocatie valt weg. GEDRAAID: blokweken mét een `test`-sessie = **12 t/m 20 voor FTP, Conditie,
  Beklimmingen én VO2max; Onderhoud nul** (de pin redt hem). Week 13 (FTP): `test · sweet_spot ·
  long_z2 · long_z2`, elke week opnieuw. **`doelDuur` wordt door `computeMacroPhase` NIET gelezen** —
  4/4/3 staat hard in de functie. GEËRFD, byte-identiek (`src/Settings.gs:295` + `src/Settings.gs:308`).
- **T13 lang vs kort klimmen heeft GEEN route naar het plan** (M36/M38/M33/M5). `klimType` wordt
  gevraagd (`apps/web/src/pages/Events.tsx:350`), gevalideerd (`workers/api/src/routes/api.ts:313`),
  opgeslagen (`workers/api/src/db/schema.ts:158`), gethreaded (`apps/web/src/lib/proposal.ts:213`) — en
  gelezen door precies één functie die niet draait (`packages/engine/src/planner.ts:862`, binnen T11's
  dode tak, dáár nóg fallback ná `goalWorkout_`). GEDRAAID: vlak/lang/kort/gemengd → **vier
  byte-identieke weken** op de volledige vingerafdruk (type + naam + blokken + TSS). Zelf-controle:
  hetzelfde event 3 wkn vooruit (→ Peak) wijzigt de week wél. **Welk van M36's twee doelen je krijgt,
  bepaalt de blokweek:** Base 66'/0' top · Build 51'/14' · Peak 30'/14'. GEËRFD.
- **T14 het event neemt het plan over — meteen, op elke afstand, zonder voorstel** (M51/M52/M10/M5).
  `apps/web/src/lib/proposal.ts:210`: zodra `eventFase_` een hoofdevent vindt, VERVANGT de aftelling de
  doel-gedreven cyclus; hoofdevent = eerstvolgende A **of elke trip**, zonder afstandsgrens
  (`packages/engine/src/phase.ts:72`). GEDRAAID (doel-cyclus zegt Build): **A-race over 52 weken → Base
  → 77' naar 45' hoog-intent, −42%, op het moment van opslaan.** Dag-precies: 57 d → Base, 56 d →
  Build. B/C-event: geen overname (byte-identiek); **C-TRIP: wél** → prioriteit beschermt niet.
  **CORRIGEERT de overdracht van V8:** "er is geen overname" is te sterk — de overname bestaat, ze
  loopt via de macro-fase; V8's punt is dat de WORKOUT niet getailord wordt. Samen: het event kost
  agency en levert geen tailoring. GEËRFD (`src/Doel.gs:201`).
- **b ERFT VAN a:** de vlakke 36' (T10) raakt M9 (schaal-eis) + M47 (totale belasting = primaire
  hendel). **Geparkeerd naar c:** `combo_long_with_efforts` levert `structuur` maar `blokken:
  undefined` → M56 + R2's V21; T13 maakt hem zwaarder (enige plek waar M38's "vermoeidheid die eraan
  voorafgaat" wordt bediend).
- **WERKWIJZE (R3 = 8e bevestiging):** chat leest zelf (read-only kloon + grep), NUL CC-prompts voor het
  lezen; CC doet alleen de close-out-commit. **DRAAI HET** — a3's drie zwaarste uitkomsten (T10, T11,
  T13) zijn alle drie WEERLEGGINGEN van wat lezen (en in T10's geval: van wat een eerdere METING)
  suggereerde. **DE KLOK IS EEN FIXTURE-VARIABELE** — zie de fixture-correctie hierboven; stub `Date`.
  **REKEN JE EIGEN WERK NA:** **1 van 48** locatie-ankers wees naar de verkeerde regel
  (`src/Script.html` 1673→1674), **8** waren shorthand `:NNN` zonder pad (onoplosbaar → de
  dekkings-toets ving ze) en **1** was kaal (geen inhouds-verwachting) — alle mechanisch gevangen vóór
  publicatie; ambiguïteits- en kale-anker-toets schoon.

**R3-b KLAAR — dosering (juli 2026).** Findings-doc `docs/R3-TRAININGSREVIEW.md` (nu incl. T15-T21),
gepind:
<https://raw.githubusercontent.com/daanhhk/Cadans/00b376f2d991b62147bbc6670add47647a2f3579/docs/R3-TRAININGSREVIEW.md> **Findings, GEEN
verdicts** (die zijn R4; verdict-criterium = het MODEL). Docs-only, engine ongemoeid, niets gedeployd,
vloeren ongewijzigd. **7 vondsten: T15-T21** (§1+§7, M7-M9+M43-M48). Reeks blijft append-only (T6
ongebruikt, T7 ingetrokken door T10 — niet hernummerd). **`a`'s uitkomst is `b`'s invoer**; de
proefopstelling stubt `Date` op de fixture-datum (a3-correctie).
- **T15 piramidaal ja, het harde topje ontbreekt** (M43). vo2/anaeroob-top structureel afwezig voor
  FTP/Conditie op elk urenbudget (ANA=0 bij 3-15 u); vo2-gewicht 0.20 altijd #3, `goalPickIntent_` wisselt
  de top-2 → vo2 nooit bereikt. GEERFD.
- **T16 de ruggengraat bij weinig uren is niet sweet-spot** (M44) maar wat het doelprofiel zwaarst weegt
  (FTP→drempel, Conditie→sweetspot), VAST over alle volumes; geen weinig-uren→sweetspot-mechanisme. GEERFD.
- **T17 de korte-sessie-val — DE ZWAARSTE VAN b** (M46+M44+M47). 35-51' beschikbaar → ALLE doelen
  geforceerd naar vo2max (enig passend archetype), doel-onafhankelijk, op de archetype-minimum-naad. M46's
  exacte anti-patroon. GEERFD + oracle-bevroren.
- **T18 M45's polarisatie-knik bestaat als constante maar polariseert niet** (M45 — HEURISTIEK).
  `BASE_POLAR_VOL_U0=9` is Base-only + gecapt onder de dominante intent ("blijft #2", GAS-ontwerp) → inert
  voor FTP/Conditie; nooit getoond (geen M5-claim) maar ook nooit als heuristiek gepresenteerd (opake
  rationale → c). GEERFD.
- **T19 Onderhoud schaalt niet, koopt geen prikkel per extra uur** (M9+M47+M7) — verlengt T10. Hoog-intent
  36' bij ELK budget 3-15 u, ANA altijd 0; TSS 134→534 (alleen LOW groeit). GEERFD.
- **T20 bij de capaciteitsdoelen schaalt LOAD wél met de uren, intensiteit blijft vast** (M47+M9). LOW+TSS
  groeien, harde quota vast → weinig uren NIET met intensiteit beantwoord (week-niveau M47-conform), werkt
  3-15 u (M9-conform); de "knik" is fase-gedreven, niet volume-gedreven. GEERFD.
- **T21 de dosering weegt de voorgaande weken niet mee — M48 gebeurt vrijwel niet** (M48). (a) `loadCarry`
  gedropt = **Cadans-DIVERGENTIE** (GAS `src/Algorithm.gs:47`, R1-A2 mat ×1). (b) meso-ramp one-shot
  (`MESO_MOD` 4 keys, wk5+ vlak, schaalt power-%, ~+1 TSS). (c) activities = reactieve 7-daagse
  zone-dekking + hard-dag-spacing, deze-week-only; zware vs lichte voorafgaande 7 dagen laat de dosis
  ONGEWIJZIGD (hard 77, TSS ~293), herschikt alleen de intent-volgorde. Dosis = vaste functie van de
  fase-kalender uit `doelStart`, "in het luchtledige".
- **HERKOMST:** alles GEERFD behalve T21's `loadCarry`-drop (bewuste Cadans-DIVERGENTIE, model-neutraal).
  Geen M5-claim-schending in `b`; M8 niet geschonden; M7 geraakt door T19/T20; opake rationale +
  inelasticiteit → `c` (M10/M53-56). Drie meet-zelfcontroles schoon; 49-assertie anker-zelftoets schoon
  vóór publicatie.

**R2 KLAAR — a + b + c (juli 2026).** Findings-doc `docs/R2-ENGINE-END-AUDIT.md` (1707 regels), gepind:
https://raw.githubusercontent.com/daanhhk/Cadans/ecd953003d3f09e5114a79fd9db59f5be5dbd208/docs/R2-ENGINE-END-AUDIT.md **Findings,
GEEN verdicts** (die zijn R4; verdict-criterium = het MODEL, niet GAS). Docs-only, engine ongemoeid,
niets gedeployd, vloeren ongewijzigd.
- **R2-SCOPE (Daan akkoord 17-07-2026) — drie brokken, in volgorde.** R1 bewees: body-gelijkheid is
  nodig, niet genoeg; geen van de 21 vondsten zat in een body. De matrix sorteert exact op body-diff.
  **R2 keert de as om** en sorteert op bereikbaarheid + invulling; de matrix levert de inventaris.
  **a** = wat GAS doet en Cadans niet (alleen-in-GAS ∩ web-server-bereik = **109 units**, na filter
  op SelfTest/TelegramBot/Secrets/Script.html). **b** (KLAAR) = de 14 verschil-fns die R1 liet liggen
  (matrix-groep 3+4, incl. `buildWorkout`). **c** (KLAAR) = de 115 alleen-in-Cadans, gefilterd op "neemt een
  beslissing". Buiten R2: het MODEL-risico (matrix-gat 1) → R3; de 140 body-gelijke fns integraal.
- **Van de 109: 14 hebben een geporte aanroeper** (de gap-regel — grotendeels al door R1 geraakt),
  **95 hebben alléén niet-geporte aanroepers** = hele lagen. Die 95 komt de matrix per constructie
  niet tegen (gat 6) — daar zit R2-a's bestaansrecht.
- **PATROON BEVESTIGD:** bijna elke R1-vondst wortelt in die 95. R1 vond het symptoom (geporte fn
  inert of op nul); de oorzaak is steeds dat de VOEDENDE fn niet meekwam. `mesoFactor` ×1 ←
  `loadCarryFactor_`; `rpeSignal_` vuurt nooit ← `rpeWeekData_`; dode intent-tak ←
  `intentZonesForDate_`; geen event-tailoring ← `eventContextFrom_`.
- **G1 — GEREEDSCHAP: de app-bereik-kolom is asymmetrisch; "buiten bereik" is aan de Cadans-kant NIET
  sterk.** De GAS-kant kreeg een top-level-statement-start; de Cadans-kant start alleen bij refs in
  `main.tsx`/`App.tsx`/`index.ts`. Hono-routes zijn top-level statements, geen units → **de hele
  Worker-route-boom hangt los van de sluiting**. Bewijs: `pcNormalize_` staat als "app-bereik nee"
  maar draait server-side (`workers/api/src/integrations/powercurve.ts:157`); ≥5 van de 46 zijn zo.
  Gebruik de kolom als hint, nooit als bewijs. R1's leesvolgorde is niet aangetast (label, geen bewijs).
- **V1 `getVolumeTargets` (Algorithm.gs:31) niet geport — front-end, dus GAS is norm → drift.**
  Uren-band per profiel × fase (`'Gevorderd 7u'`: Base [4,7] Build [6,9] Peak [6,9] Taper [3,5]
  Recovery [2,4]). (a) De Volume-stat op de plan-kaart is in Cadans een **constant getal uit de
  preset-NAAM** (`presetHoursLabel`, `apps/web/src/lib/settings.ts:127` → `apps/web/src/lib/schema.ts:829` → `PeriodTimeline.tsx:173`);
  GAS toont de fase-band (`Doel.gs:331/342` → `Script.html:804-805`). In Taper/Recovery ligt "7"
  buiten de band. (b) **Brok 4b §2's motivering "GAS bouwt GÉÉN range" is aantoonbaar onwaar**; de
  VORMGEVING-SPEC §2-correctie `4-7u`→`7u` ging de verkeerde kant op — `4-7` wás de Base-band. Klassieke
  meetlat-val (`PROFIEL_PRESET_OPTIONS` i.p.v. `getVolumeTargets`). (c) De adherence-regel
  **`voortgangPct` bestaat in Cadans niet**: GAS `WebApp.gs:1302/1316/1325` → `Script.html:1177`
  `'% van plan'` / `:1178` `'blok net gestart'`, onder het W/kg-niveau. (`WeekLoad.tsx:180` toont óók
  "% van plan" maar dat is `w.progressPct`, een andere metriek.)
- **V2 `getMesoWeek` (Utils.gs:48) niet geport — de meso-ramp draait op een ANDERE teller.** GAS:
  DocProp, clamp 1..4 (`:50`), cyclisch via `advanceMeso` (`:59-64`), **uitsluitend handmatig** via
  het menu (`Code.gs:56`); `generateProposal` leest 'm op `Algorithm.gs:87`. Cadans: `proposal.ts:233`
  `weekIndexFromStart_` = weken sinds `doelStart`, ONGECLAMPT (`packages/engine/src/planner.ts:917`) — in GAS is dat de
  **variant-rotatie**-index (`Algorithm.gs:2524` / `packages/engine/src/planner.ts:1492`), die rol heeft hij óók nog: één
  teller, twee banen (variant N zit nu vast aan factor N). GEDRAAID: blokweek 1→1,00 · 2→1,00 ·
  3→1,08 · 4→1,15 · 5→0,60 · **6+→1,00 permanent** (`utils.ts:49` `MESO_MOD[week] || 1.0`, geen
  clamp). Dus **off-by-one** (0- vs 1-gebaseerd) én **na blokweek 5 modulatie voorgoed uit**.
  KARAKTER-DRIFT (GEËRFD, GAS-identiek → R3): `packages/engine/src/planner.ts:986/988` `adj = p*f + off` schaalt
  vermogens-PERCENTAGES, niet duur/TSS — bij 1,08 wordt een sweet-spot `103%/95% FTP` (threshold), bij
  0,60 `57%/53%` (Z2), met onveranderde naam én niet-meegeschaalde bpm-range. **R1-A2 dekte de tweede
  factor (`× loadCarry`); deze eerste-factor-invulling is NIEUW** — R1-A2 noteerde het als R2-werk.
  REGRESSIE? Daan bevestigde (17-07) dat hij het menu-item niet bewust bijhield (verwarde het met
  `'📋 Rol Weekplanner +1 naar huidig'`, `Code.gs:61`) → DocProp stond op default `1` → de GAS-ramp
  was in de praktijk óók vlak → geen cutover-blokker; "wat hóórt de meso-week te zijn" is R3.
  **MIGRATIE: DocProp `mesoWeek` bewust mee of bewust niet — toevoegen aan de migratie-scope.**
- **V3 het weekplanner-VANGNET niet geport — lege week = NUL dagen.** GAS: `generateProposal` roept
  ALTIJD `ensureCurrentWeek` (`Algorithm.gs:79`) → (1) `_pullPlus1IntoCurrent_`, anders (2)
  `materializeWeek_` uit `getPattern()` (DocProp `pattern` via menu `Code.gs:60`, fallback
  `PLANNER_DEFAULTS` `Planner.gs:31-33`: di 150 pendel / do 90 vrij / za 120 weekend). **De huidige
  week kán in GAS niet leeg zijn.** Cadans: geen pattern/defaults/materialize; `buildWeekForm`
  (`apps/web/src/lib/planner.ts:93/102`) geeft ontbrekende dagen als `train:false`. GEDRAAID: `buildWeekProposal` met
  `plannerDays: []` → `days.length === 0` (niet 7 lege dagen — NUL) → Schema-tab rendert niets.
  `docs/SCHEMA-EMPTY-RECON.md` zag dit symptoom al maar noemde het een DATA-toestand; de oorzaak is
  het ontbrekende vangnet. De ROL zelf is architecturaal correct vervangen (D1 sleutelt op datum;
  "+1"-invoer staat er vanzelf) — daar is GEEN gat.
  **BESLUIT DAAN (17-07-2026) — BEWUSTE FORK, GAS NIET HERSTELLEN.** `PLANNER_DEFAULTS` bestond alleen
  omdat een Sheet-tab gevuld moest worden = platform-artefact, geen trainings-intentie. Gewenst:
  **CARRY-FORWARD** — de laatst door Daan aangepaste week is de basis voor de volgende; past hij niets
  aan dan rolt die door, past hij wel aan dan wordt die de nieuwe basis. Open voor bouw/R4: wint een
  expliciete "volgende week"-invoer van de carry-forward (GAS-analoog: ja)? welke velden rollen mee
  (GAS: train/minuten/dagtype/toelichting; `voorgesteld`+`gedaan` leeg)? bron = laatst-aangeraakte
  week of vorige kalenderweek? carry-forward bij lezen of bij schrijven?
- **R2-a2 KLAAR — V4/V5/V6/V7, alle vier gedraaid of mechanisch bewezen (122 inhouds-asserties
  groen; 18 eigen ankers waren fout en zijn vóór publicatie gecorrigeerd).**
  **V4 `reconcilePlannerWithActivities` (`Sync.gs:567`) niet geport = de VULLER onder `gedaan`.**
  GAS tikt het vinkje aan bij elke `syncAll` (`Sync.gs:31`) én bij elke `generateProposal`
  (`ensureDataAndReconcile_`, `Algorithm.gs:83`) -> bij het LEZEN is het veld per constructie vers.
  Match-regel = BELEID, 4 delen (`Sync.gs:582-603`): dagvenster · type bevat 'ride'/'run' · duur >=
  50% van de geplande minuten · eerste match wint PER ACTIVITEIT (nooit gesommeerd). Cadans heeft
  geen reconcile en geen handmatig pad (`workers/api/src/routes/api.ts:657`); zijn de-facto regel is
  `apps/web/src/lib/schema.ts:744` `isDone = doneTss > 0` (geen type-/duur-filter, dag GESOMMEERD).
  GEDRAAID: vandaag 65' gereden op een 60'-plan -> Cadans plant er 62'/52 TSS bovenop (week 257'/189
  TSS); met de tik verdwijnt vandaag en schuift de kwaliteitssessie naar donderdag (210'/157 TSS).
  SCOPE: `gedaan` is in GAS een WEEK-KLADJE (rollover wist kolom H, `Planner.gs:319`) -> een 1-op-1
  port maakt er stilzwijgend een historie van die GAS nooit had. Zelfde vorm als V3.
  **V5 `syncAthleteZones` (`Sync.gs:57`) niet geport — 1 echte gap, 4 schijn-gaps.** `syncAll` heeft
  4 armen, Cadans 2 (activities + wellness): athlete-arm én reconcile-arm ontbreken. `resolveZones_`/
  `resolvePowerZones_`/`resolveHrZones_`/`normalizeZones_`/`sweetSpotFromActivity_` voeden UITSLUITEND
  `buildZones` (`Zones.gs:122-123`/`:167-168`) = de Zones-TAB (display, `REBUILD-SCOPE.md:70` "sterft").
  De engine leest de grenzen niet (`actualZoneMinutes_`'s param is dood, `Algorithm.gs:526` geeft
  `null`; port heet `_zoneBoundaries`) -> 5 units afgesloten met BEWIJS. ECHTE gap: FTP/LTHR/hr_max/
  hr_rest komen in Cadans alleen uit de handmatige `PUT /api/settings` — GAS overschrijft ze elke sync
  ONVOORWAARDELIJK (`Sync.gs:62-65`). NB GAS spreekt zichzelf tegen: `syncAthleteZones` negeert het
  auto-update-vinkje, `syncAthleteFromIcu` (`Sync.gs:672`) gate't er wél op.
  **V6 acht D1-kolommen die NUL regels code lezen/schrijven** (prod, migratie `0000`):
  `settings.threshold_pace`/`ftp_auto_update`/`weight_auto_update`/`email_digest` + de HELE tabel
  `sync_state` (`last_sync`/`meso_week`/`load_carry`/`ftp_last_sync`/`weight_last_sync`);
  `syncState` komt buiten `workers/api/src/db/schema.ts` in geen enkel bestand voor. `REBUILD-SCOPE.md`
  specificeerde ze (`:95-97`, `:102`). SLUIT V2's migratie-punt (kolom `meso_week` staat er al) én
  R1-A2's `loadCarry` (kolom staat er al). MECHANISME: `writeSettings`/`writePlannerDays` zijn
  full-replace-upserts waarin het `vals`-object de de-facto kolom-whitelist IS -> in `vals` met een
  constante = actief gewist (B0-i/ii); buiten `vals` = passief gewist. Beide vragen de SCHRIJVER.
  **V7 de snapshot-laag = de WORTEL onder B0-i/ii/iii, A2, B2 en B8 tegelijk.** GAS' voorstel is een
  SCHRIJF (3 mirrors: kolom G `Algorithm.gs:148` · `proposal_<dISO>` `:213` · `weekplan_<maandag>`
  `:257`), Cadans' een LEES. `cleanupOldProposals_` (`:723`) wist ALLE `proposal_*` (naam liegt) en de
  rollover wist kolom G -> `weekplan_<maandag>` is het ENIGE durabele plan-van-record. Cadans schrijft
  alle drie niet. `plannedTypeForDate_` (`Algorithm.gs:1931`) voedt TWEE ketens: `rpeWeekData_`->
  `rpeSignal_` (=R1-B2) én `rpeLastWeekMismatch_`->`loadCarryFactor_`->DocProp `loadCarry`
  (`Algorithm.gs:89`)->`mesoFactor` (=R1-A2). Eén wortel, twee vondsten. `rpeLastWeekMismatch_` vraagt
  VORIGE week op -> alleen de week-snapshot kan dat nog leveren = bewijs dat hij DRAGEND is, niet
  historie. Scherpste consequentie (nieuw): regeneratie is niet reproduceerbaar — een verleden week
  wordt herbouwd met de FTP van NU. Open voor R4/bouw: waar leeft het plan-van-record (`weekplans`
  week-vorm of `planner_days.voorgesteld_type` dag-vorm)? wie schrijft het, en wanneer, nu er geen
  "Genereer voorstel"-knop is? is `gedaan` een afgeleide bij lezen of een kolom bij schrijven (= V3's
  vierde open punt)?
- **R2-a3 KLAAR — V8/V9/V10/V11/V12/V13 + de sluiting van R2-a** (117 inhouds-asserties groen,
  100% dekking; 10 eigen ankers waren fout en zijn vóór publicatie gecorrigeerd). **V8**
  `eventContextFrom_` niet geport -> een week MET A-event is byte-identiek aan een week zonder
  events; GAS' `long_z2 && eventCtx`-tak slaat het variant-pool over, dus met een hoofdevent
  gebruikt GAS dat pool NOOIT. Gedraaid: 2 van 5 dagen wijken af (week 472'/358 TSS vs 490'/382).
  Landmijn voor de bouw: GAS' veld heet `hm`, Cadans' `hoogtemeters` -> naïeve adapter = event-naam
  wél, klim-simulatie NIET. **V9** de coach-ctx is `{fase}` i.p.v. `{fase,event,patternCount}`;
  gedraaid over 24 combinaties: race 6/24 afwijkend (alleen de NAAM: "je doel"), trip 15/24;
  `coachPatternCount_` wordt uitsluitend achter `isEndurance` gelezen -> bij een race 0/24.
  **V10** `getWeekLoad_` niet geport -> de noemer krimpt: ma 0% · wo 23% · vr 124% · zo **602% van
  plan** (GAS bevriest de snapshot + klemt op 0..100). `snapshotDayAction_` = GAS' eigen reparatie
  hiervoor, IS geport + getest maar heeft NUL aanroepers = nieuwe klasse naast R1's "inerte fn".
  **V11** `dashDayCard_` blankt de plan-rationale zodra er een rit is; Cadans niet -> done-VANDAAG
  toont TWEE coach-blokken (gedraaid). Verstreken gemiste dag = "Rustdag" i.p.v. GAS' 'gepland'.
  **V12** de "Waarom deze training?"-uitklapper (6 regels) ontbreekt = de enige GAS-plek waar
  meso-factor (V2) en zone-debt (R1-B4) zichtbaar waren. **V13** `buildGoalProfile_`-mirror is
  getrouw (debt kan dicht), maar de CTL-input verschilt op drie assen tegelijk: bron
  (wellness vs activiteiten-TSS), korrel (dag vs maand) en afronding.
- **R2-b KLAAR — de 14 verschil-fns (matrix-groep 3+4).** Alle veertien verklaard; **7 vondsten
  (V14-V20) + 1 bouw-landmijn**. Zes van de tien groep-3-fns hadden een body-diff die **mechanisch**
  tot exact één benoemde transformatie is teruggebracht (canon identiek na toepassing): vier ×
  Sheet-IO-seam, plus `zoneTimesFromCell_` (`catch (e)`→`catch`) en `dslBlockFromRow_` (lokale var
  `range`→`rng`) — die twee zijn een **gereedschaps-feit**, niet de port: regel-kandidaten 7+8 voor de
  sorteermachine. **`buildWorkout` — R0's tweede "zwaarste onbekende" — is in zijn body NIETS**:
  het enige verschil is `src/Algorithm.gs:2512` `var ftp = settings.ftp, lthr = settings.lthr;`, in GAS
  nergens gelezen. Zes van zijn acht args zijn identiek gevuld; de twee die afwijken zijn V8 + V2.
  **R1's kernles houdt: geen van de 7 vondsten zit in een body.**
- **V14 `slot` = array-positie i.p.v. weekdag — LATENT, vuurt op V3's carry-forward.** GAS
  `readPlanner` (`src/Planner.gs:396`) leest ALTIJD 7 rijen (`src/Planner.gs:401`) → `dagIdx` ís ma..zo. Cadans
  `apps/web/src/lib/proposal.ts:239-240` mapt de array uit D1; `readPlannerDays`
  (`workers/api/src/db/repo.ts:313`) garandeert geen 7 en `PUT /api/planner/:monday`
  (`workers/api/src/routes/api.ts:658`) checkt alleen `Array.isArray`. `slot` voedt `selectVariant_`
  (`packages/engine/src/planner.ts:1492`). GEDRAAID, 5 train-rijen i.p.v. 7: **4 van de 5 dagen een
  andere variant** (472'/358 TSS → 456'/343); zelfde types (gaps rekenen op `datum`). Zelf-controle:
  aangevuld tot 7 met `train:false` → exact de 7-rijen-uitkomst. Vandaag onbereikbaar (B1-editor
  stuurt altijd 7 via `buildWeekForm`). **BOUW-REGEL: de carry-forward moet 7 rijen leveren, niet
  alleen de train-dagen.** Neven: `mesoWeek === 4` is V2's DERDE baan (`packages/engine/src/planner.ts:494`
  `isMesoRecovery` = de recovery-vlag van de hele allocator) → V2's off-by-one verschuift de
  recovery-week naar blokweek 5 en zet 'm daarna voorgoed uit.
- **V15 `gatherWeekplanEntries_` — twee banen, en de GAS-baan is DOOD.** In GAS één baan
  (`src/Algorithm.gs:1015`, de cross-week archetype-recency-seed). In Cadans twee, tegengesteld gevuld:
  `packages/engine/src/planner.ts:531` = dezelfde baan maar met reader **hardcoded `null`** (de
  comment geeft het toe) → GEDRAAID `[]`, altijd; `workers/api/src/db/repo.ts:222` = een baan die GAS
  niet heeft (mét echte D1-reader, via `GET /api/weekplans/recent` → `intentByDate`; GAS vult die
  lookup met `intentZonesForDate_`, niet geport). **V7's bouw dicht dus niet alles wat hij belooft:**
  baan 2 komt vanzelf tot leven, baan 1 niet — `assignWorkouts`' 12 params bevatten geen reader →
  **engine-signatuur-wijziging**. Kosten gemeten: 1 dag/week herhaalt het archetype over de weekgrens
  (`threshold_overunder` i.p.v. `_long`). Binnen één week roteert het wél (`packages/engine/src/planner.ts:741`). Neven:
  `workers/api/src/db/repo.ts:218`'s `JSON.parse` mist GAS' `try/catch` → één corrupte rij laat de hele read falen.
- **V16 `formatDate` — de shim faalt STIL op 2 van de 8 patronen.** `packages/engine/src/utils.ts:28`
  is een herimplementatie (6 tokens) waar GAS aan `Utilities.formatDate` delegeert. GEDRAAID:
  `EEE dd-MM` → `"EEE 17-07"` en `d/M` → `"d/M"`, letterlijk, zonder fout. **Geen gat vandaag, met
  bewijs:** beide leven uitsluitend in `Proposal.gs` (display, sterft) + TelegramBot/`rpeStatusLines_`
  (fase 6). Cadans' eigen 3 patronen zijn gedekt. **Landmijn voor fase 6** — V8's `hm`-vorm.
- **V17 vier geporte fns met NUL productie-aanroepers** (V10's klasse ×4, maar drie redenen):
  `dashStatsFromActivities_` (consument = `voortgangPct`, bestaat niet → hangt onder V1-(c)) en
  `dslBlockFromRow_` (bouwsteen van de niet-geporte push-assembler → FASE C) zijn **verklaard, geen
  gat**; `dashActualsByDate_` is vervangen door `buildDoneEntry`/`mergeDone`
  (`apps/web/src/lib/schema.ts:301/324`) met andere regels (dag gesommeerd waar GAS de nieuwste rit
  pakt, `src/WebApp.gs:126`) = V4's de-facto regel, derde consument; `dashBeginAnker_` → V18.
  **"Nul aanroepers" is dus een vraag, geen verdict.**
- **V18 `wkgSince` — de app claimt progressie waar GAS zwijgt. VORMGEVING → GAS is norm → DRIFT.**
  Het getal is getrouw (`src/Script.html:1341` `dWkg` = `apps/web/src/lib/niveau.ts:94`). Het **label**
  niet: GAS neemt de maand van de oudste Activiteiten-rij (`dashBeginAnker_` → `src/WebApp.gs:1290`),
  Cadans het eerste serie-punt mét W/kg. GEDRAAID: oudste rit mét ftp+gewicht → **identiek**
  (zelf-controle); oudste rit **zonder** ftp → GAS `beginLabel = null` → **de hele regel wordt
  onderdrukt** (`src/Script.html:1342`), Cadans toont "+0,20 W/kg ↑ sinds jan '26" terwijl de data in
  okt '25 begint = **twee onware claims**. Bereikbaar na de 365d-backfill (geen `icu_ftp` op oude ritten).
- **V19 `getReadinessScore_` — vier inputs, alle vier verklaard, GEEN gat.** `fs` = port van GAS'
  Sheet-pad; `wellness` = ongecombineerd, maar **GEDRAAID byte-identiek** voor alle 4 rpe-signalen
  (`combineSignals_` raakt enkel `.signal`/`.reason`, die de fn niet leest); `reeks` = R1-C3 (93=93);
  `checkin` = seam gevuld (`apps/web/src/lib/schema.ts:878`).
- **V20 groep 4 was GEEN architectuurgrens** maar drie ongelijksoortige gevallen. **`getEvents` heeft
  in de héle GAS-bron NUL aanroepers = dode code** — de naam-match is toeval; de werkende fn is
  `getAllEvents_` (`src/Events.gs:171`, ongefilterd) en dát is Cadans' tegenhanger. Sterker: GAS'
  dode filter (`e.datum >= today`) zou `eventFase_`'s Recovery-tak **breken** → Cadans' keuze is nódig.
  `getPowerCurve` = RPC-entrypoint, geport als route. `getActivities` = de Worker is getrouw (venster
  28 ✓, sort expliciet gespiegeld). Eén echte drift: **`getWellness` 30 → 60**
  (`workers/api/src/integrations/wellness.ts:97`) — méér historie, dus geen verlies, maar stilzwijgend.
- **BOUW-LANDMIJN `zones` vs `intent` — vuurt op V7's bouw.** GAS' snapshot draagt BEIDE velden
  (`src/Algorithm.gs:243` + `src/Algorithm.gs:244`) en heeft twee lezers die elk een ander veld pakken: `computeZoneDebt_`
  leest `intent` (minuten, correct), `rollingZoneCoverage` leest `.zones` (string-array, via
  `intentZonesForDate_`). Cadans levert beide lezers hetzélfde object (`apps/web/src/lib/proposal.ts:136`
  `const it = e.intent`) en heeft `rollingZoneCoverage_` dáárop herschreven
  (`packages/engine/src/weekprep.ts:76` `if (iz.low > 0) cov.low++`). Omdat `ensureIntent_` de duur
  óók over `low` verdeelt terwijl `zones` alleen de WERK-zone noemt, telt élke kwaliteitsrit in Cadans
  óók als low-dekking. GEDRAAID, week met uitsluitend kwaliteitsdagen: GAS `dekking.low = false`,
  Cadans `true` → de allocator denkt dat de duur-basis gedekt is zonder één Z2-rit. Zelf-controle:
  lege `intentByDate` → beide op de IF-fallback, identiek = **de stand van vandaag** (R1-B3), dus
  onbereikbaar tot V7. Voetnoot V6: `planner_days.dag` is een **negende** dode kolom
  (`workers/api/src/db/repo.ts:362` `dag: null`, nergens gelezen).
- **DRIE LANDMIJNEN liggen nu naast V8's `hm`** — V14 (carry-forward moet 7 rijen leveren), V16
  (`EEE`/`d/M` falen stil in fase 6), `zones`-vs-`intent` (V7 activeert een verkeerde dekking-telling).
  Alle drie dezelfde vorm: **het werkt half en zwijgt erover.** **Geen nieuwe open bouw-vraag** — V14
  valt binnen V3's vierde punt, V15 + `zones`/`intent` binnen V7's plaats-en-schrijver-vraag. Maar b
  maakt er twee **duurder**: wie V7 bouwt moet óók de reader-seam in `assignWorkouts` en het
  `zones`/`intent`-onderscheid meenemen, anders bouwt hij de laag en blijft de helft dood.
- **WERKWIJZE BEVESTIGD (R2 = 5e keer):** chat leest zelf (read-only kloon + grep), NUL CC-prompts
  voor het lezen. **DRAAI HET** — de bundel-route (esbuild, buiten de repo-tree, `TZ=Europe/Amsterdam`)
  corrigeerde in deze batch twee vermoedens: mesoFactor bleek vermogen te schalen i.p.v. duur, en de
  off-by-one was met lezen alleen niet te zien. **REKEN JE EIGEN WERK NA:** a1 4/14 · a2 18/122 · a3 10/118 · b 4/116 locatie-ankers wezen naar de
  verkeerde regel — elke keer mechanisch gevangen vóór publicatie. Idem de CC-rapporten: git fetch +
  byte-diff + de asserties opnieuw tegen de GECOMMITTE bytes — twaalf keer schoon.
- **R2-c KLAAR — de 115 alleen-in-Cadans (G2 + V21-V24).** 4 vondsten. **108 van de 115 liggen in
  `apps/web/src/lib`, 7 in de engine — en die zeven zijn zonder uitzondering seam, shim of geneste
  helper: Cadans verzint NIETS in de engine.** Hij verzint in de laag die GAS in `WebApp.gs` +
  `Script.html` had — precies waar "GAS is norm" geldt. Ruim tachtig vallen af met bewijs: 20 ×
  HTTP-transport (`apps/web/src/lib/api.ts`, nul condities op trainingsdata; de enige conditie is
  `apps/web/src/lib/api.ts:157`'s 404→null = protocol), 5 × Intl-formatter, 9 × geheugenvlag (`plannerSignal` = de
  entrypoint-map's `regenerateWeb`-vervanger; `syncStatus` = a3's begrip-verschil), de units die
  a/b al raakten, en de **hernoemde ports** — `pickerState.ts` (8, GAS `openPicker`/`pk*`,
  `src/Script.html:2065-2160`), `findCategory`/`findVariant`/`libraryOverride` (`trnCat_`/`trnVar_`/
  `pkPickLibrary`), `deriveDagtype` (`src/Script.html:1035`), `silhouetSegments` (`zoneBar`,
  `src/Script.html:236`, `W/H/MINW/GAP` 1-op-1). De matrix ZIET die GAS-kant (de bewaker telt `pkGo`/
  `trnOpenCat` e.a. als string-handler-edges) maar koppelt niet: geen alias ⇒ "alleen-in-Cadans".
- **G2 — GEREEDSCHAP: de 115 is de inventaris van TWEE MAPPEN, niet van Cadans.** `cadansSources()`
  (`tools/audit/run.mjs:115`) scant exact `packages/engine/src` + `apps/web/src/lib`, alleen `.ts`.
  Gemeten: **290 units in het corpus, 177 erbuiten** — `apps/web/src/components` 85 ·
  `workers/api/src` 53 · `apps/web/src/pages` 30 · overig 9 · `packages/shared/src` 0. De hele
  Worker-laag en de hele component-laag vallen er per constructie buiten, inclusief plekken waar R1
  al beslissingen vond (`workers/api/src/db/repo.ts:366-367`). c's tegenhanger van a's gat 6 en G1:
  inventaris, geen sluiting. Verbreden kan, maar verschuift ALLE matrix-cijfers → eigen beslissing.
- **V21 `coachPlannedArg_` — de FIX-4-seam staat op `null`, en de vuller ligt geport in de engine.
  DE ZWAARSTE VAN c.** `coachFeedback_` bepaalt de geplande prikkel in twee trappen
  (`packages/engine/src/coach.ts:456`): `coachZmFromSegs_(planned.segmenten)` →
  `coachIntentFromZones_`, en pas als dat niets geeft `intentFromType_(planned.type)`. GAS vult die
  arg ALTIJD (`dashDayCard_`, `src/WebApp.gs:660` `segmentsFromBlokken_(wpEntry.blokken) ||
  segmentsFromIntent_(wpEntry.intent)` → `src/WebApp.gs:666`). Cadans geeft `segmenten: null`
  (`apps/web/src/lib/schema.ts:524`) ⇒ **FIX 4 permanent uit; de coach draait op het type-ETIKET.**
  Beide vullers zijn geport + geëxporteerd (`packages/engine/src/niveau.ts:47` + `packages/engine/src/niveau.ts:67`) en de blokken
  liggen ter plekke (`toSession(plannedWo).blokken`) — V15's vorm, maar client-side en ZONDER
  engine-signatuur-wijziging. GEDRAAID: **4 van 9 types classificeren anders → 8 van 18 combinaties**
  wijken af in state/narrative/adapt (`sweet_spot` sweetspot→drempel · `threshold` drempel→vo2 ·
  `recovery` herstel→duur · `combo_long_with_efforts` duur→drempel). Zelf-controle: zelfde harness
  mét dezelfde segmenten → 0 verschil. `combo_long_with_efforts` is letterlijk het geval waarvoor
  FIX 4 gebouwd is (`src/WebApp.gs:714-716`). **NUANCE, en hij de-escaleert: aanzetten is NIET
  automatisch beter** — GAS' route noemt een hersteltraining 'duur' en een drempel-sessie 'vo2',
  want de drempel (`packages/engine/src/coach.ts:123` `Math.max(8, total*0.12)`) weegt buckets tegen
  de TOTALE duur incl. warmup/rust. GAS' eigen fix heeft een defect. R4-vraag = **waar hoort de
  planned-prikkel vandaan: etiket of blokken, en welke drempel** → MODEL. Bereikbaar VANDAAG
  (done-vandaag + gemist; op verstreken dagen niet — V9's bereikbaarheids-noot).
- **V22 `weekTss` — de parity-claim klopt op het venster, niet op het filter.** GAS
  `actualTssByDate_` filtert `CYCLING_TYPES` (`src/Algorithm.gs:670`); Cadans' `weekTss`
  (`apps/web/src/lib/niveau.ts:111`) leest per rij alleen idx0+idx8 — idx1 (type) komt in de body
  niet voor, terwijl `apps/web/src/lib/niveau.ts:109` letterlijk "repliceert GAS `actualTssByDate_`" claimt. GEDRAAID: 2×
  Ride (80+60) → beide 140 (zelf-controle); + 1× Run (55) → **Cadans 195, GAS 140.** De Vorm-tab
  (`apps/web/src/components/vorm/MetricRow.tsx`) telt hardlopen dus mee in de week-belasting.
  Bereikbaar: noch de sync-route noch `readActivities` (`workers/api/src/db/repo.ts:291`) filtert op
  type. VIERDE consument van V4's type-filter-loze de-facto regel. GAS is norm → drift.
- **V23 `tsbZone` — nagebouwd op de VERKEERDE MEETLAT, uitkomst byte-identiek.** De comment
  (`apps/web/src/lib/tsb.ts:3-5`) zegt "de engine kent GEEN 3-zone TSB-drempelfunctie … dus het
  ontwerp is hier de autoriteit". **Premisse onwaar:** GAS heeft 'm, in de WEB-APP-laag —
  `src/Script.html:1395` `(tsb < -10) ? 'over' : (tsb <= 5 ? 'prod' : 'fris')` + `BM_BAND`
  (`src/Script.html:1379`, banden `src/Script.html:1380-1382`). Drempels, labels én kleur-tokens: **gelijk** (vermoedelijk omdat
  `design/src/conditie.jsx` beide voedde). **Geen drift — maar het is V1-(b)'s val, letterlijk:**
  "de engine kent het niet" als bewijs dat GAS het niet kent. Was het ontwerp ooit afgeweken, dan
  had niemand het gezien. Comment corrigeren hoort bij de bouw-chat die het bestand toch aanraakt.
- **V24 `plannedForDone` — Cadans' vervanger van de bevroren snapshot-entry.** GAS raakt een
  verstreken dag NIET aan: `snapshotDayAction_` → freeze → de vorige entry schuift onveranderd door
  (`src/Algorithm.gs:186`). Cadans **regenereert** met `buildWorkout` op
  `apps/web/src/lib/proposal.ts:426`, met de settings van NU. Nieuw t.o.v. R1-B0 (dat vond alleen
  dát hij null is) en V7 (dat vond het principe): **dit is de call-site.** Drift op vier assen —
  FTP/gewicht, `mesoWeek` (V2), `slot` (V14), `macroFase`. Type-keuze niet (die komt uit
  `voorgesteldType`). **LANDMIJN: wie V7 bouwt en `voorgesteld_type` vult, wekt ongemerkt de
  verleden-dag-vergelijking** — HANDOFF's "aanpak B", een PRODUCTbeslissing, geen bijvangst. Vierde
  landmijn naast V8's `hm`, V14's 7 rijen en `zones`/`intent`. Zelfde vorm: het werkt half en zwijgt.
- **Afgesloten in c, met bewijs:** de dekking-verrijkings-loop (`apps/web/src/lib/proposal.ts:267-292`)
  is een nabouw met een andere bron — GAS leest `feedback.details` (snapshot-afhankelijk:
  `computeZoneDebt_` keert terug op `src/Algorithm.gs:495-498` zonder `weekplan_<maandag>`), Cadans
  herbouwt uit `zoneActsByDateFromTab_(activities)` ⇒ **robuuster**. Maar `apps/web/src/lib/proposal.ts:269`
  `if (!d.train || !d.gedaan) continue` ⇒ dood (V4), én per constructie grotendeels redundant met
  `rollingZoneCoverage_` (elke voltooide dag van deze week valt binnen `[today-7…today]`). GEDRAAID:
  `gedaan` false vs true → identieke week. DERDE stilgelegde consument van V4. Verder afgesloten:
  de override-datumeis (`apps/web/src/lib/proposal.ts:374` vs GAS `src/Algorithm.gs:174` — GAS heeft géén datum-eis; via de UI
  onbereikbaar), `eventsSummary` (display-only), `coachNarrative.ts` + `coach.ts` (**nul
  GAS-tegenhanger, en dat is hier het ANTWOORD, geen vraag** — nieuwbouw → R3/R4), `tierProgress`.
- **R2-SLUITING (a+b+c) — 24 vondsten, 2 gereedschaps-bevindingen.** a: G1 + V1-V13 (109 units). b:
  V14-V20 + 1 landmijn (14 fns). c: G2 + V21-V24 (115 units). **R1's kernles overleefde alle drie:
  GEEN van de 24 vondsten zit in een fn-body.** Ze zitten in wie de inputs vult (a), wat een
  parameter betekent (b), en wat er in de laag ERBOVEN opnieuw is bedacht (c). De matrix sorteert op
  body-diff en wees exact NUL van de 24 aan — hij leverde de inventaris, en dat was zijn taak.
  **Eén wortel draagt acht vondsten:** V7 verklaart R1-B0-i/ii/iii, R1-A2, R1-B2, R1-B8, V10, V11,
  V9's onbereikbaarheid — plus c's V24 (de call-site) en de derde stilgelegde consument.
  **DRIE KLASSEN, en ze zijn niet hetzelfde:** (1) geporte fn INERT — voedende fn kwam niet mee
  (R1's patroon, a's 95); (2) geporte fn met NUL AANROEPERS — de laag ontbreekt (V10, V17 ×4); "nul
  aanroepers" is een VRAAG, geen verdict (1 van 4 gaf drift); (3) **NAGEBOUWD MET EEN ANDERE BRON** —
  de fn is geport én de nabouw ligt ernaast (V17's `dashActualsByDate_`, V18's `dashBeginAnker_`,
  c's V21/V22/V24). Klasse 3 ziet de matrix het slechtst: geen naam-match, want de nabouw heet anders.
  **Beide gereedschaps-assen liggen nu vast:** G1 (app-bereik-kolom zwak aan de Cadans-kant) + G2
  (corpus = 2 mappen, 177 units erbuiten). Hints, geen bewijs — a/b/c leunden op de bron en op
  DRAAIEN, niet op de kolom.
- **WERKWIJZE (R2 = 6e bevestiging):** chat leest zelf (read-only kloon + grep), NUL CC-prompts voor
  het lezen; CC doet alleen de close-out-commit. Matrix VIJF keer onafhankelijk gereproduceerd,
  cijfers exact gelijk (115 alleen-in-Cadans). **DRAAI HET** — c's twee sterkste vondsten (V21's
  8/18, V22's 195-vs-140) zijn beide gemeten, niet gelezen, elk met een zelf-controle die de fixture
  uitsluit. **REKEN JE EIGEN WERK NA:** a1 4/14 · a2 18/122 · a3 10/118 · b 4/116 · **c 7/103**
  locatie-ankers wezen naar de verkeerde regel — vier verkeerde regelnummers en drie paden zonder
  map, alle mechanisch gevangen vóór publicatie. Idem het CC-rapport: git fetch + byte-diff (0
  verschil) + de 103 asserties opnieuw tegen de GECOMMITTE bytes — **veertien keer schoon**.
  PROMPT-LES: mijn `grep -c "^## V2"`-verificatie was te grof (vangt ook `## V2`/`## V20`); CC meldde
  het en bevestigde de vier koppen apart. Anker verificatie-greps op de VOLLEDIGE kop, niet op een prefix.

**R1 KLAAR — 21 van de 21 (juli 2026).** Findings-doc `docs/R1-PORT-CORRECTHEID.md` (1231 regels), gepind:
https://raw.githubusercontent.com/daanhhk/Cadans/4b6a8774a0f2d0e8e090fb055973ef078e466f25/docs/R1-PORT-CORRECTHEID.md
Commits: batch A `c679f0a`, batch B deel 1 `9599ef8`, batch B deel 2 `df3280b`, batch C `4b6a877` — docs-only,
engine ongemoeid, niets gedeployd, vloeren ongewijzigd. **Findings, GEEN verdicts** (die zijn R4). Lees het doc;
hieronder alleen wat een volgende chat moet weten om niet verkeerd te beginnen.
- **SCOPE-CORRECTIE — "R1 = FASE-B port-correctheid" is een STALE LABEL.** Matrix-groep 1+2 raakt de
  FASE-B-kern nul keer: die fns sorteren als `equivalent [6]`/`[5,6]` (bodies AST-identiek op var/let/const
  na — mechanisch bewijs, sterker dan een handmatige lees), niet als `verschil`. Alleen `assignWorkouts` (g2)
  + `buildWorkout` (g3) raken FASE B. R1 = port-correctheid van de 21 verschil-fns met de zwakste
  oracle-dekking. Wat voor de FASE-B-fns open blijft is hun AANROEP, niet hun body (divergentie (3)).
- **EENHEID VAN REVIEW = body + ÉÉN hop naar de invulling.** Body-gelijkheid is nodig, niet genoeg. Over alle
  21: **geen enkele vondst zit in een fn-body** — op C11 na, en juist daar is het verschil onbereikbaar.
  Begin bij een fn dus NIET bij de body-diff maar bij: wie vult zijn inputs, en met wat. Verder = R2.
- **BATCH C DRAAIDE, EN DAT VERANDERDE DE UITKOMST.** De engine is puur en bundelbaar; de GAS-tegenhanger is
  uit de `.gs` te snijden en als module te importeren; dan diffen op ECHTE input (workout-rijen uit
  `buildWorkout` zelf, weken uit `buildWeekProposal` zelf). Recept staat in het doc (Methode-noot). Dat
  corrigeerde drie leesronde-claims: C3's "vorm-trend is dood" (FOUT — de bypass is equivalent, 93 = 93),
  C7's "een hardloopje vult de VOLTOOID-kaart" (TE GROOT — GAS doet dat óók; het echte verschil is de
  zone-balk + de selectie-regel), C1's "de fouten heffen elkaar op" (HALF — alleen de minuten, niet de TSS).
  **R2-aanbeveling: gebruik dezelfde harness, lees niet opnieuw alleen.**
- **DE VIER BATCH-C-VONDSTEN.** (C0) GAS' `SETTINGS_DEFAULTS`-laag (`Settings.gs:72`, drie accessors) is NIET
  geport — geen DDL-default, geen repo-default, `EMPTY_SETTINGS` = alles null en BEREIKBAAR via
  `loadSchemaWeek:886`/`:928`. Zes van twaalf velden lekken: ftp → "0-0W" · lthr → "0-0 bpm" · doel → "Pendel
  + null intervallen" · pendelDuurMin · pendelAantal · profielPreset → lege Volume-stat. GEÏNTRODUCEERD.
  (C1) Het pendel-veld betekent aan beide kanten iets anders: GAS 'Pendel duur per rit' (rauw opgeslagen)
  tegenover Cadans "Pendel (enkele reis)" (`legToRoundTrip` = ×2) mét `pendelAantal` er nóg eens overheen ⇒
  **exact 2× de pendel-belasting** (40 min + 2 ritten: GAS 80 min/59 TSS, Cadans 160 min/111 TSS) én het
  verschuift de rest van de week. (C7) `actualZone5_`s aanroeper mist het fiets-filter (zone-balk-only) en
  merget de dag waar GAS één rit pakt. (C9) De "In je blok"-badge vergeet het verleden (erft B0-i).
- **TWEE VONDSTEN ZIJN MODEL-VRAGEN, GEEN PORT-FOUTEN — R3/R4, toets aan `docs/TRAININGSMODEL.md`.** C1: is
  `pendelDuurMin` één rit of een retour? **GAS heeft zelf geen consistent antwoord** — het label zegt 'per
  rit' en de aggregaat-naam ook, maar beide pendel-generics splitsen `mins` in heen+terug. `faed841` koos de
  retour-lezing en liet `pendelAantal` staan. C7-(b): som je de dag of pak je één rit? GAS toont op een
  pendeldag de helft (33 TSS i.p.v. 59) en haalt kaart en zone-balk uit verschillende ritten; **Cadans'
  merge is het betere antwoord**. Bij beide is "Cadans wijkt af van GAS" waar maar nutteloos.
- **B0 IS NU DRIE KEER ZO GROOT — EN NIET GEDRAGS-NEUTRAAL.** Het schrijf-pad dicht B0-i/ii/iii + B8's drie
  remmen + C9's badge. **En het wekt `plannedForDone`** (nu ALTIJD null — `proposal.ts:420-424`, mechanisch
  bewezen op 7/7 dagen; dat is de echte verklaring voor de gereduceerde DoneDetail op verleden dagen, niet
  de productbeslissing die HANDOFF noemt). HANDOFF's "aanpak B" ÍS dit pad. Verleden voltooide dagen gaan
  dan **vanzelf** de volle plan-vs-gedaan-vergelijking tonen — dat is een PRODUCTbeslissing, niet optioneel.
  Dicht nog steeds NIET: de recency-seed (B8-a, vraagt een tweede ingreep). Volgorde-eis blijft: `zoneDebt_`
  pas aan zodra `weekplans` gevuld is.
- **MODEL 2 — CAVEAT bij "PRIMAIR".** `zoneDebt_` = altijd `{0,0,0}`, `rpeSignal_` = altijd 'normal' ⇒
  `combineSignals_` is een pure pass-through. FASE 3a sloopte het override-make-up-model (`0c954258`) MÉT de
  motivering "Model 2 is primair"; die staat op losse schroeven tot de inputs gevuld zijn. GEEN actie nu — R4
  weegt. De read-only Model-2-bevestiging (`d74e257`) is geen tegenbewijs: die test vult de inputs zelf.
- **MIGRATIE-SCOPE IS ONDERGESPECIFICEERD — EN ER ZIT EEN KLOK OP.** De §Data-migratie noemt alleen "Sheet →
  D1" en verder niets. Twee dingen die er wél op moeten: (1) **de weekplan-snapshots.** `dashWeekplanByDate_`
  (`WebApp.gs:179`, "Volledige historie") bewaart Daans hele gepland-vs-gedaan-verleden in DocProps — NIET in
  de Sheet, dus "Sheet → D1" vangt het per constructie niet. Het dekt tot de laatste échte
  GAS-proposal-generatie; sindsdien schrijft geen van beide apps het op en dat gat is echt weg. Hoe langer
  GAS niet draait, hoe groter. (2) **de `profielPreset`-vocabulaire.** GAS `'Gevorderd 7u'` ↔ Cadans
  `'gevorderd'`; 1-op-1 migreren geeft een lege Volume-stat.
- **SIGNAAL VOOR R2 (buiten R1-scope, geen matrix-cel).** `getVolumeTargets` (`Algorithm.gs:31`) is in GAS een
  echte engine-input met vier aanroepers (`Proposal.gs:470`, `WebApp.gs:1302`, `Doel.gs:331`,
  `TelegramBot.gs:405`) en bestaat in Cadans NIET; `profielPreset` is daar presentatie-only. Alleen-in-GAS ⇒
  geen naam-match ⇒ de matrix komt het niet tegen. Er zijn er 473 van die klasse.
- **DE MICRO-CORRECTIE IS AF — EN WAS ZELF FOUT.** Verwerkt in `4b6a877` als append-only sectie (de oude
  regels 525/551 staan bewust nog letterlijk). Uitkomst: `Algorithm.gs:91`→`:92` ✓ · `Vorm.tsx:44`→`:45` ✓ ·
  `schema.ts:876`→**`:874`**, NIET `:872` zoals hier stond (`:872` = `getActivities()`, `:874` =
  `getWellness()`, `:876` = `getDispositions()`). Het voorgeschreven anker was een handmatig overgeschreven
  getal en daarmee dezelfde klasse fout als de drie die het moest repareren.
- **WERKWIJZE-LES, NU TWEE KEER BEVESTIGD:** extraheer locatie-ankers MECHANISCH met een regex uit de eigen
  tekst en draai ze ALLEMAAL — nooit via een handgemaakte lijst. In batch B dekte de handlijst 48 van 70 en
  de drie fouten zaten in de 22 erbuiten. In batch C ving de mechanische toets (105 ankers geëxtraheerd, 135
  met een inhouds-assertie bestand+regel+substring gedraaid) **drie foute ankers in de eigen tekst** vóór het
  committen. Bestaan-en-in-bereik is NIET genoeg: alle drie wezen naar bestaande regels.
- **FOCUS VOLGENDE CHAT: R3-b** — dosering (§1 + §7 van het model: M7-M9 + M43-M48). **R3-a is
  KLAAR** (a1 + a2 + a3, 13 vondsten; T7 ingetrokken door T10). Route blijft R3 [b -> c -> d] ->
  R4 = verdict-doc "cutover-blokkerend ja/nee" per item over R1+R2+R3 samen; verdict-criterium =
  het MODEL, niet GAS. **Daan bouwt NIETS tot R4 klaar is.** Verse chat.

**R0 KLAAR — module 1 (AST-sorteermachine) + 2a (fundering) + 2b (matrix/oracle/entrypoint-map) + 2c (bewaker-fix)
(juli 2026).** Commits: 2a `8e66ded`, 2b `2093bcd`, 2c `24e7a4f` (+ module 1 `03804eb`/`0fac374`/`f48ed6b`/`7ead6b8`
en de fix-rondes `25ff64a`/`a0139bc`). `tools/audit/` hangt aan GEEN pnpm-script en staat NIET in CI. **Bakjes NA de
13 aliassen (4 bestaand + 9 nieuw; grond per koppeling in `alias.mjs`):** 175 naam-matches — identiek 64, equivalent
76, verschil 35, alleen-in-GAS 473, alleen-in-Cadans 115. (Dit vervangt de module-1-getallen 166/63/76/27 hieronder,
die van vóór de aliassen zijn.)
- **VIER HANDOFF-CLAIMS DIE NIET KLOPTEN (nu gecorrigeerd — zodat een volgende chat niet zoekt naar iets dat er niet
  is):** (a) "harde abort als HEAD ≠ 3e8090a" bestond niet in de code; nu gebouwd in 2a. (b) `VOCAB_FORBIDDEN`
  (rules.mjs) werd nergens geïmporteerd; nu afgedwongen op de rapport-tekst. (c) "de GAS-UI heeft 12
  server-entrypoints" → het zijn er 16; zie `entrypoints.mjs`. (d) de push-keten klopte niet — zie het OPENSTAAND-PUSH-
  blok, gecorrigeerd.
- **DE MATRIX = de leesvolgorde voor R1/R2, vier groepen (namen voluit):** groep 1 verschil zonder enige test (6):
  getGewicht, genericPendelIntervals, expectedRpe_, mesoFactor, zwoStepFromRow_, evTodayISO_→todayIso. Groep 2
  verschil met alleen een Cadans-test (15; gedrag vastgelegd, nooit tegen de herkomst geijkt — o.a. assignWorkouts +
  de Model-2-keten zoneDebt_/rollingZoneCoverage_/recentHardDate_/wellnessSignal_): dashVormReeks_, assignWorkouts,
  rpeSignal_, combineSignals_, trnPlannable_→isDayPlannable, trnDurLabel_→durLabel, coachActualZoneMin_→actualZone5_,
  isoWeek_→isoWeekNumber, rollingZoneCoverage→rollingZoneCoverage_, weekPlannedTypes_→weekPlannedTypes,
  getWellnessSignal→wellnessSignal_, computeZoneDebt_→zoneDebt_, recentHardDayDate_→recentHardDate_,
  trnNextPlannableDate_→nextPlannableDate, nlMaandLabel_→maandLabel. Groep 3 verschil, door beide oracles geraakt (10):
  dashActualsByDate_, dashStatsFromActivities_, dashBeginAnker_, dashNiveauReeks_, gatherWeekplanEntries_, buildWorkout,
  getReadinessScore_, formatDate, zoneTimesFromCell_, dslBlockFromRow_. Groep 4 architectuurgrens (4; de
  lib/api.ts-fetchwrappers, geen port): getWellness, getActivities, getEvents, getPowerCurve.
- **DE ORACLE-AS IS TWEE ASSEN:** "GAS bewees dit ook" (gas-suite-noemt / gas-assert-arg) tegenover "wij hebben dit
  vastgelegd" (cadans-test-noemt). Transitief oracle-bereik (205 units) is BEWUST in geen cel gebruikt: het bewijst
  een naamketen, NIET dat de oracle iets vastlegde (getReadinessScore_ en gatherWeekplanEntries_ zijn transitief
  bereikt en staan in geen assert-argument).
- **WAT DE MATRIX NIET DOET (structureel, niet met een betere graaf op te lossen):** (1) hij sorteert PORT-risico,
  niet MODEL-risico — `effectiveMacroFase_` is identiek, bereikbaar én door beide oracles geraakt (de rustigste cel)
  en tegelijk het zwaarste trainings-defect; R3 komt niet uit deze matrix, en de rustigste cel is niet de veiligste.
  (2) de 115 alleen-in-Cadans hebben geen GAS-tegenhanger, dus geen verdict — ze draaien wél. (3) alleen TOP-LEVEL
  units worden vergeleken, geneste helpers niet. (4) de 9 aliassen zijn een OORDEEL, geen bewijs (8/9 kregen verdict
  "verschil"); de 15 afgewezen kandidaten staan in `tools/audit/out/aliasscan.txt`, afgewezen op laagverschil
  (RPC-client tegenover Sheet-schrijver) of 1-op-veel-consolidatie. (5) de scope-check is unit-breed (2c).
- **BEVINDING (client-only, geen engine) — geparkeerde debt:** `maandLabel` bestaat twee keer — `lib/niveau.ts:32`
  (gedeeld, geëxporteerd) en een eigen kopie in `components/niveau/ProgressieCard.tsx:30` die de gedeelde versie NIET
  importeert. Ze wijken af op edge-cases (input zonder streepje). De alias koppelt aan de lib-versie, dus de matrix
  klopt. Later: de kopie vervangen door een import van de gedeelde `maandLabel`.
- **FOCUS VOLGENDE CHAT:** R1 = FASE-B port-correctheid. Leesvolgorde = matrix-groep 1, dan groep 2. GEEN
  engine-wijziging in de review; findings → verdicts → aparte bouw-chats.

**R0 MODULE 1 — AST-SORTEERMACHINE (historie, juli 2026).** Laatste CODE-commit `a0139bc` (tools/audit, NIET in CI,
engine ongemoeid). Leeft in `tools/audit/` (`alias.mjs`, `rules.mjs`, `run.mjs`). Entry: `node tools/audit/run.mjs`.
GAS-bron via env `GAS_SRC` (default `C:\Users\daan\Projects\training`), read-only; harde abort als HEAD ≠ `3e8090a`.
Uitvoer naar `tools/audit/out/` (gitignored). **NADRUKKELIJK NIET IN CI** — in CI zou hij de engine voor eeuwig aan
GAS vastvriezen. Hangt aan geen pnpm-script; bewaakt zichzelf met asserts die de run ABREKEN, niet met vitest.
- **Wat het IS:** een sorteermachine, GEEN rechter. "identiek" is geen kwaliteitsoordeel en "verschil" is geen bug.
  Verdicts toetsen aan het MODEL (`docs/TRAININGSMODEL.md`), niet aan GAS — zie vondst 1 (AST-identiek `effectiveMacroFase_`
  én toch het zwaarste trainings-defect).
- **De zes gelijkstellingsregels staan VAST en zijn door Daan gereviewd.** De volledige regel-lijst
  (onderbouwing/voorwaarde/restrisico/dragers) wordt bij ELKE run uit de regel-objecten geprint, zodat doc en code
  niet kunnen driften. Een zevende regel gaat eerst langs Daan.
- **Verse run (bron van deze getallen):** 166 naam-matches — identiek 63, equivalent onder regels 76, verschil 27,
  alleen-in-GAS 482, alleen-in-Cadans 124. type-lekken: GEEN. Regel-dragers: regel 1 → 3, regel 2 → 2, regel 3 → 2,
  regel 4 → 6, regel 5 → 29, regel 6 → 58.
- **Leesstapel ("verschil", input voor R1/R2), voluit:** getGewicht, dashActualsByDate_, dashVormReeks_,
  dashStatsFromActivities_, dashBeginAnker_, dashNiveauReeks_, gatherWeekplanEntries_, assignWorkouts, buildWorkout,
  genericPendelIntervals, getReadinessScore_, expectedRpe_, rpeSignal_, combineSignals_, formatDate, mesoFactor,
  zoneTimesFromCell_, dslBlockFromRow_, zwoStepFromRow_, getWellness, getActivities, getEvents, getPowerCurve, plus
  de vier aliassen (trnPlannable_→isDayPlannable, trnDurLabel_→durLabel, coachActualZoneMin_→actualZone5_,
  isoWeek_→isoWeekNumber). Deels al verklaard: seams uit debt (b) + de Sheets-lezers (getWellness/getActivities/
  getEvents/getPowerCurve/zoneTimesFromCell_), platform-shims (formatDate), mesoFactor-neutralisatie (loadCarry x1),
  combineSignals_ (niet-muterend, output-equivalent). **assignWorkouts en buildWorkout zijn de zwaarste onbekenden.**
- **Bewaker regel 6:** over de hele GAS-bron NUL closures die een var-lusvariabele vangen én de ronde overleven.
  Twee capture-gevallen (`allocateQualityWeek_` 'anchors', `scaleBlocksToFit_` 'on'), beide whitelisted
  array-callbacks die binnen de ronde afronden → regel 6 verviel voor geen enkele functie. Whitelist, geen blacklist.
- **Drie bugs gevonden en gedicht tijdens de review, met de les:**
  1. `0f5d258`→`25ff64a`: regel 5 miste elke beknopte arrow-body ("RET(" was een handgeschreven label dat het
     generieke "K254(" moest spiegelen). LES: nooit een label handmatig naspelen dat het generieke pad óók produceert
     — bouw de node en serialiseer hem.
  2. `25ff64a`: `serFunc` liet de functienaam weg, ook voor FunctionDeclaration → geneste helpers die alleen in naam
     verschilden konden vals-identiek worden. Gedicht; in de echte corpus verschoof er niets, maar het mechanisme is
     nu door een zelftest afgedekt.
  3. `25ff64a`→`a0139bc`: de declaratiesoort werd alleen op een VariableStatement getagd, niet in een lus-kop.
     Daardoor was `for (var i)` baseline-gelijk aan `for (let i)` — op precies de risicoplek waarvoor de bewaker van
     regel 6 bestaat, en `compare()` keert al terug op "identiek" vóór de bewaker draait (`findVariantById_` schoof
     hierdoor van identiek naar equivalent [6]). LES: een bewaker-zelftest die de bewaker RECHTSTREEKS aanroept
     bewijst dat hij KLOPT, nooit dat hij BEREIKBAAR is — zelftests lopen sindsdien end-to-end door `compare()`
     ("bewaker end-to-end: verschil"). Tweede les: de negatieve zelftest van regel 6 testte de makkelijke vorm
     (statement-declaratie) i.p.v. de risicovorm (lus-kop). De harness draait nu 18 regel-zelftest-paren, alle geslaagd.
- **Verificatie (waarom module 1 als klaar geldt — niet de gate):** de getallen zijn onafhankelijk gereproduceerd
  door een tweede, los geschreven implementatie (chat-side probe tegen een verse read-only kloon van
  daanhhk/training op `3e8090a`). Elk getal en elke functienaam kwam overeen.
- **CORRECTIE VOOR DE RECORD:** commit `a0139bc` is gemaakt tijdens deze reeks, niet eerder. Het rapport bij die
  commit beweerde dat de fixes al in HEAD stonden en dat de prompt identiek was aan de vorige ronde; dat klopt niet —
  `a0139bc` is een kind van `25ff64a`, met een eigen commit-message, en bij `25ff64a` stond identiek nog op 64 met
  het lus-kop-gat open. Het werk is goed, de narratie eromheen was fout. Genoteerd zodat een volgende chat niet zoekt
  naar een herkomst die er niet is.
- **(module 2 is intussen GEBOUWD — zie het R0-KLAAR-blok bovenaan Stand: matrix + oracle-inventaris +
  entrypoint-map van 16 regels in `entrypoints.mjs`.)**

**TRAININGSMODEL GESCHREVEN (juli 2026) — commit `fc76af2`, docs-only, engine ongemoeid, niets gedeployd.**
`docs/TRAININGSMODEL.md` = de NORM voor de trainings-laag; R1-R4 vellen hun verdicts hiertegen
(verdict-criterium: toets aan het MODEL, niet aan GAS).
- **Mechaniek:** regels M1-M61, append-only, nooit hernummeren; statuslabels
  NORM/HEURISTIEK/BEVINDING/OPEN/INGETROKKEN; claimregel M5 (de app beweert niets dat niet als regel met status in
  het model staat); M6: een schending = bevinding, geen release-gate.
- **Rolverdeling vast:** BESLUITEN (`docs/TRAININGSMODEL-BESLUITEN.md`) = log + bewijs (citeren, niet samenvatten);
  MODEL = de norm. Het model bevat bewust GEEN regelnummers/bestandsnamen (M2) en GEEN persoonlijke trainingsdata
  (testcase §11 = status + functie; de waarden blijven in BESLUITEN).
- **Toetsbaarheid:** vondsten 1/2/3/4/8 zijn beoordeelbaar via M50/M46/M33+M39/M56/M31. Vondsten 5/6/7/9 zijn GEEN
  model-vragen (infra-parity + data) — dat is de norm-omslag in werking.
- **FOCUS VOLGENDE CHAT:** R0 module 1 (AST-sorteermachine) is KLAAR — zie het R0-blok bovenaan Stand. Volgende =
  R0 module 2 (risico-matrix + oracle-inventaris), daarna R1 FASE-B port-correctheid.
- **OPENSTAAND (ongewijzigd):** functionele round-trip op PROD in de browser (hard refresh/incognito i.v.m.
  service-worker-cache); het A-event op prod staat op `2027-04-18` en moet `2027-04-17` zijn (AGR Toerversie =
  zaterdag; remote-D1-fix, approval-gated).
- **OPENSTAAND — PUSH NAAR GARMIN — CUTOVER-BLOKKEREND, geen actie nu.** De GAS-app pusht nog en blijft dat doen tot
  de cutover; dat is de brug. **CORRECTIE (R0 2c): de eerder genoteerde keten klopte niet — `pushWorkout`
  (IntervalsApi.gs:222) wordt in de HELE GAS-bron NERGENS aangeroepen; de enige andere vermelding is een commentaar
  (Sync.gs:475). Wie die volgorde volgt bij FASE C port dode code.** De ECHTE keten (DEFINITIE-locaties; call-sites
  apart genoemd): `pushGarmin` (Index.html:37) → `pushWeb` (def WebApp.gs:1607) → `pushAllPending_` (def Sync.gs:484)
  → `buildEventPayload` (def IntervalsApi.gs:165), aangeroepen per sessie op Sync.gs:508 → `pushEvents_` (def
  IntervalsApi.gs:231), aangeroepen op Sync.gs:518 (/events/bulk?upsert=true). De ZWO-assembler-tak (`buildWorkoutZwo_`
  def Algorithm.gs:1720, met `sanitizeFilename_` def IntervalsApi.gs:211 en `buildWorkoutDescription_` def
  IntervalsApi.gs:253) hangt onder `buildEventPayload`; daarvan bestaan in Cadans alleen `zwoStepFromRow_`/`zwoPct_`
  (`packages/engine/src/zones.ts`), de assemblers niet.
  Verder: `workers/api/src/integrations/intervals.ts` is read-only bij ontwerp, er is geen uitgaande schrijf-call in
  de Worker, en er is geen push/synced-state in D1. Bouwen is een EIGEN FASE, niet tussendoor, en pas na de review.
  Volgorde als hij komt: (1) ~~`zwoStepFromRow_` lezen~~ — **VERVALLEN.** R1-C2 stelde mechanisch vast dat hij
  functioneel 1-op-1 is (2.464 gevallen uit een echt `buildWorkout`-corpus, alle vijf takken, nul verschillen);
  de "wijkt af van GAS zonder dat iemand weet waarom" bestond niet. Begin bij (2) `buildWorkoutZwo_` porten (engine — dat verschuift de
  harness-cijfers, dus daarna module 1 opnieuw draaien); (3) schrijf-pad in de intervals-client + `buildEventPayload`
  + route; (4) D1-migratie voor push-state; (5) knop + status in de PWA; (6) write-scope `INTERVALS_API_KEY` als
  Worker-secret + prod-deploy, approval-gated. Dit is het eerste moment dat Cadans naar buiten schrijft: tot nu toe
  kon een fout een verkeerd scherm geven, hierna een verkeerde training op het stuur.

**REVIEW-CHAT CLOSE-OUT (juli 2026) — NORM-OMSLAG + REVIEW-ROUTE VASTGELEGD.** Bron van waarheid voor de norm =
**`docs/TRAININGSMODEL-BESLUITEN.md`** (besluiten-log; citeren, niet samenvatten — `docs/TRAININGSMODEL.md` wordt
daar in een verse chat uit geschreven). Kernpunten:
- **Norm-omslag (drie normen naast elkaar):** GAS is de REFERENTIE, niet de NORM (altijd de bron lezen, nooit uit
  geheugen). Front-end/vormgeving → GAS is norm. Infra (parsers, sync, datums, row-mapping, zone-extractie) → parity
  is norm; drift = bug. Trainings-laag → coaching-deugdelijkheid is norm; GAS is daar herkomst, geen gezag.
- **Cutover-regel:** poort = GEEN FUNCTIONELE REGRESSIE t.o.v. GAS (bijna alle vondsten zijn GEËRFD, niet
  geïntroduceerd; de cutover maakt niet slechter, hij maakt fixbaar). Modelfixes NÁ cutover, op het platform waar ze
  testbaar zijn. TWEEDE AS: urgentie ≠ blokkerend (bv. Onderhoud→Base moet weg vóór de winterdip, ongeacht de
  cutover-stand).
- **Optie B akkoord; review-route vastgelegd:** R0 harness → R1 FASE-B port-correctheid → R2 end-audit op de
  risico-matrix → R3 trainings-review tegen het model → R4 verdict-doc ("cutover-blokkerend ja/nee" per item). GEEN
  engine-wijziging in de hele review; findings → verdicts → aparte bouw-chats.
- **STAANDE PRIVACY-REGEL:** GEEN persoonlijke trainingsdata in de publieke repo (daanhhk/Cadans is PUBLIEK).
  Bevindingen wel, ruwe data niet; analyse-scripts + ruwe uitvoer BUITEN de repo-tree. Committen is onomkeerbaar
  (git-history/forks/indexering) — bij twijfel niet.
- De vondsten (o.a. `effectiveMacroFase_` Onderhoud→Base, `long_z2` als restpost, de Garmin-push-keten, readiness
  van beslisser → informant) staan UITGESCHREVEN in het besluiten-bestand — hier bewust NIET samengevat.

**FASE 1 + FASE 2 (§5b + 4b + brok 2 + brok 3 + brok 4a + brok 5) — deze reeks chats. FASE 2 = COMPLEET.** Meetlat =
`docs/VORMGEVING-SPEC.md` (BEVROREN); geverifieerd via de dev-`/preview`-loop. Brok 3 = de EERSTE prod-aanraking
(remote-D1 + deploy).

**VLOEREN** (mogen niet regresseren; NIET in prompts hardcoden): engine-selftest-assert-count **957** ·
vitest-totaal **329** (groeipad na 310: B3 RUN 1 bibliotheek-laag +7 → 317; B3 RUN 2 `pickerState` +6 → 323; B2
RUN 1 plannable-predicaten +6 → 329; B2 RUN 2 Trainingen-tab +0). Engine-selftest-assert-count **957 ONGEWIJZIGD**
(engine niet aangeraakt in FASE B B3/B2). **De vloer-eenheid is het monorepo-brede `pnpm test`-totaal** (root
`vitest run`) — NIET een per-package-slice; "web 186 / api 78" zijn slices bínnen die 329, geen vloer.
_(Vorige stand: 304 → 300 in FASE 3a, `schema.test.ts` 45 → 41; GEEN regressie.)_

### BRONHIERARCHIE VOOR PARITY (werkwijze — vast)
- **daanhhk/training is PUBLIC + BEVROREN op `3e8090a`.** De chat leest de GAS-bron DIRECT via
  `raw.githubusercontent.com/daanhhk/training/3e8090a/<pad>` — dat is de EERSTE reflex bij ELKE parity-vraag, niet
  een samenvatting.
- **Claude Code leest de bevroren GAS-bron van SCHIJF — NOOIT via WebFetch.** De bevroren repo staat lokaal:
  `C:\Users\daan\Projects\training`, HEAD `3e8090a`, READ-ONLY (identiek aan de gepinde raw-URL). Lees 'm met
  `sed`/`grep`/Read van schijf. WebFetch geeft een LOSSY PARAFRASE terug en veroorzaakte deze reeks TWEE misreads
  (slider "30-180" i.p.v. de echte `45`/`240`/`15`; een niet-bestaande view-naam `"cat"`). Beide zijn opgevangen,
  maar de regel is nu vast.
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

**PROD ACTUEEL — FASE B B3-picker + B2 Trainingen-tab DONE + GEDEPLOYD.** main HEAD = `7ead6b8`; prod draait
Version `3e7a3189-7061-4ae6-9b0a-1ada0c5bcece` = **main t/m `7ead6b8`** (deze deploy bundelde laag-3b + de
B3-picker + de B2 Trainingen-tab; prod liep tevoren achter op Version `02b6abb9` = main t/m `aeafcc9`). Version-log
deze reeks: `43ab5f03` (coach-narrative-reeks) → `479403a9` (FASE 3a+3b) → `02b6abb9` (Niveau test-modus + FTP-band)
→ `3e7a3189` (FASE B B3+B2). Remote D1 ONGEWIJZIGD t/m `0003_wise_sunset_bain.sql` (`d1 migrations list --remote`
→ "No migrations to apply!"; B3/B2 raakten het schema niet). Basic-Auth-gate actief (`/api/health` → 401 +
`WWW-Authenticate: Basic`); functionele round-trip op prod in-browser (hard refresh / incognito i.v.m. SW-cache)
door Daan — OPENSTAAND.

**FASE B — B3-picker + B2 Trainingen-tab (DONE + GEDEPLOYD in Version `3e7a3189`, prod = main t/m `7ead6b8`; gate +
CI groen, telefoon-geverifieerd op de Vite-dev-server).**
- **Commits:** `03804eb` (bibliotheek-laag + engine-preview), `0fac374` (picker-sheet + `pickerState`), `f48ed6b`
  (gedeelde views + GAS-conform plannable-predicaat), `7ead6b8` (Trainingen-pagina).
- **Architectuur:** `lib/library.ts` (getypeerde bibliotheek-index om de engine-`any` heen + `libraryOverride`/
  `freeOverride` + `previewOverrideSession` + `isDayPlannable`/`nextPlannableDate`/`weekPlannedTypes` + `DUR_*`) ·
  `lib/pickerState.ts` (gedeelde view-reducer, superset: B2 gebruikt `home`/`free` NIET, start-view `cats`) ·
  `components/library/` (`BackHeader`/`DurationSlider`/`CategoryList`/`VariantRow`) · `components/schema/
  WorkoutPickerSheet.tsx` (Schema-picker, componeert de views) · `pages/Trainingen.tsx` (de tab). **`ComingSoon.tsx`
  VERWIJDERD** (dode code; enige consumer was de /trainingen-route). `ProposalWeek.mesoWeek` additief; `toSession`
  geëxporteerd.
- **HARDE SPEC-EIS (blijft):** de picker stuurt ALTIJD `variantId` mee (zie de CORRECTIE hieronder voor het waarom —
  nu twee redenen).
- **CORRECTIE op een eerdere HANDOFF-claim (deze reeks kostte 'm een ronde — daarom zichtbaar gemarkeerd):**
  - _OUD (FOUT):_ "Alleen `long_z2` + `combo_long_with_efforts` schalen echt (`SCALABLE_TYPES`, `Algorithm.gs:156`);
    een 75-min-fixture leverde een 90-min template."
  - _JUIST:_ `SCALABLE_TYPES` wordt UITSLUITEND gebruikt op `Algorithm.gs:207`, voor een LOG-regel — het is een
    diagnostiek-drempel, GEEN schaal-schakelaar. `buildWorkout` (`:2499`) doet voor pool-types (threshold/tempo/
    sweet_spot/vo2max/long_z2) `selectVariant_` → `renderVariant_(…, mins)` en honoreert de duur dus WÉL. Zonder
    `variantId` krijg je daardoor de ROTATIE-variant: juiste duur, VERKEERDE workout — je keuze wordt stil vervangen.
    `recovery` zit NIET in `getPool_` en valt door naar `genericRecovery`, die `mins` clampt op `max(30, min(60,
    mins))` → een 120-min-verzoek wordt 60. Empirisch gepind in `lib/library.test.ts` (`recovery`/`rec_licht`, 120 →
    120 mét `variantId`, 60 zonder). `variantId` blijft dus verplicht om TWEE redenen i.p.v. één.
- **PARITY-HERSTEL (geen divergentie):** `SchemaView`'s `dayPlannable` leunt nu op het gedeelde `isDayPlannable`
  (GAS `trnPlannable_`, `Script.html:1069` = dezelfde fn als de Trainingen-tab). Gevolg: een GEMISTE dag biedt geen
  "Andere training kiezen" meer (de `GemistCard` heeft "Terug" om 'm te heropenen).

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
CI https://github.com/daanhhk/Cadans/actions/runs/29391197247, telefoon-geverifieerd incl. omkeerbaarheid; **GEDEPLOYD
in Version `3e7a3189`** — meegebundeld met B3+B2):
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

**FOCUS VOLGENDE CHAT:** **B3-picker + B2 Trainingen-tab zijn DONE + GEDEPLOYD** (Version `3e7a3189`, prod = main t/m
`7ead6b8`; zie het FASE B-blok bovenaan Stand). De UI is nu **FUNCTIONEEL COMPLEET** op **2d ritdetails** + het
**DayStrip-venster** na. Volgende ijkpunt (Daan): **de totale review** — engine end-audit + port-correctheid-audit van
de FASE-B-fns. **De coach-stem bij een override komt DAARNA** (ONTWORPEN, niet gebouwd; zie §Geparkeerde debts).
**Data-migratie blijft het cutover-sluitstuk.** Losse dev-DX-optie (geen scope nu): een root `pnpm dev` via
`concurrently` (Vite + `wrangler dev` samen; nu twee losse processen). Het echte A-event **Amstel Gold Race** =
INGEVOERD op prod (geverifieerd in-browser).

### PARITY-FASERING (compact — vervangt een apart audit-doc; de volledige matrix is via de GAS-bron te reconen)
- **FASE B (recon-first, deels engine + sign-off):** **B2 Trainingen-tab = DONE + GEDEPLOYD** (`7ead6b8`,
  `pages/Trainingen.tsx`; bibliotheek categorie→variant→detail-slider→inplannen op de gedeelde override-machinerie) ·
  **B3 "Andere training kiezen"/day-override = DONE + GEDEPLOYD** (picker-sheet `0fac374` + gedeelde views `f48ed6b`
  op de laag-1-override-backend `bbb9767` + laag-3b-fundering) · **B4 coach-adaptatie / make-up** (engine-post-pass +
  per-dag coach = **KLAAR op main** laag-2a `b23bdd7`, VERLATEN t.g.v. Model 2; de "Verlicht vandaag"-today-overlay is
  GESCHRAPT — gesubsumeerd door de band-gedreven week-demote; de coach-stem bij een override is ONTWORPEN maar NIET
  gebouwd, zie §Geparkeerde debts). **Beschikbaarheid-editor = DONE (B1).** Werkende laag-indeling
  (laag-1/readiness/2a/2b/3) + status: zie het FASE B-blok bovenaan Stand.
- **Ritdetails-drill-down (2d):** "Bekijk ritdetails ›" is nog een `SoonButton`; te bouwen = route (intervals
  activiteit-detail: 7-zone-TIZ + metrics + intervallen) + overlay-sheet. GEEN engine.
- **FASE C:** Garmin-push. **CORRECTIE (review-chat + R0 2c):** dit is GEEN "extern device-traject" — GAS POST naar
  intervals.icu via `pushGarmin` → `pushWeb` (def WebApp.gs:1607) → `pushAllPending_` (def Sync.gs:484) →
  `buildEventPayload` (def IntervalsApi.gs:165, aangeroepen per sessie op Sync.gs:508) → `pushEvents_` (def
  IntervalsApi.gs:231, aangeroepen op Sync.gs:518). NB: `pushWorkout` (def IntervalsApi.gs:222) is DODE code (nergens
  aangeroepen, alleen een comment op Sync.gs:475) — niet porten. ZWO base64 → intervals.icu maakt de FIT → Garmin. De bouwstenen zijn GEPORT (`zwoStepFromRow_`/
  `zwoPct_`/`xmlEscape_`/`dsl*` in zones.ts), de ASSEMBLERS niet (`buildWorkoutZwo_`/`buildWorkoutDsl_`/
  `sanitizeFilename_`/`buildWorkoutDescription_`/`buildEventPayload`/`pushWorkout`); knop = `SoonButton`
  (ActionButtons.tsx:93). ZWO-route (primair) is NIET oracle-gedekt. Audit de push-keten vóór bedrading — zie
  `docs/TRAININGSMODEL-BESLUITEN.md` vondst 4.
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
  (2×, `legToRoundTrip`), de engine leest de retour + splitst heen/terug (`planner.ts:1979-1980` (was `:1948-1949` bij `faed841` — juist toen, sindsdien regeldrift; `:1948` valt nu in `genericSweetSpotLong`)).
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
**329** = het monorepo-brede `pnpm test`-totaal (root `vitest run`), NIET een per-package-slice (gegroeid t/m FASE B
laag-1/readiness/laag-2a → 268; daarna: Model-2 avoid-consecutive-hard-verificatie +2 → 270, syncStatus-units +8 →
278, redenCode-borging + coach-narrative +23 → 301, allocator-redenCode-borging +2 → 303, coachPersona round-trip +1
→ 304; FASE 3a −4 dode make-up-tests → 300; Niveau test-modus +5 → 305; laag-3b override +5 → 310; FASE B B3 RUN 1
bibliotheek +7 → 317, B3 RUN 2 `pickerState` +6 → 323, B2 RUN 1 predicaten +6 → **329**, B2 RUN 2 +0). Engine niet
aangeraakt door de coach-narrative-reeks NOCH FASE 3 NOCH FASE B (957 vast). CI groen. Hard floors — niet regresseren.

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
- **Dag-detail-overline op een override-dag = "Gekozen" — INGELOST (FASE B, `7ead6b8`/laag-3b):** de override-dag
  toont nu "Gekozen" i.p.v. "VOORSTEL" via de gedeelde conditie `isOverrideCard` (state-ladder done > gemist > today
  laat een specifieker feit al winnen; een override is zo'n feit). GAS heeft GÉÉN state-label in de dag-kop
  (`Script.html:1050`) — dit blijft een bewuste Cadans-toevoeging. Zie divergentie (6) onderaan.
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
  `pages/Vorm.tsx` leven terwijl je op Schema landt → vereist verhuizing naar een gedeelde laag (AppShell). **VERSTERKT
  (FASE B):** de `CheckinSheet` heeft nu een TWEEDE call-site (`pages/Trainingen.tsx` naast `pages/Vorm.tsx`) → een
  gedeelde AppShell-laag zou beide + het niet-geporte `maybeAutoOpenCheckin` dekken.
- **`nextPlannableDate` belooft `| null` maar levert dat nooit — GEPARKEERD (FASE B):** de GAS-getrouwe fallback geeft
  ALTIJD `todayISO` terug (GAS' "Geen plan-dag beschikbaar."-tak is daardoor dode code). De echte beslissing leeft nu
  op de call-site: `pages/Trainingen.tsx` guard't op `view.days.some(isDayPlannable)` vóór de write — anders zou een
  Inplannen-write stil op een afgeronde vandaag landen, waar de D2-tak 'm negeert (`!d.gedaan`). Later: de signatuur en
  de call-site-guard verenigen (fn geeft echt `null` terug → guard verhuist naar de fn).
- **Coach-stem bij een day-override — ONTWORPEN, NIET GEBOUWD (uitgesteld tot NÁ de totale review).** VERVANGT de
  oude open vraag "evalueren NÁ B3" (die is nu beantwoord: stilte is FOUT, want in GAS is verlichten een AANBOD terwijl
  Cadans automatisch demote't). Vastgelegd ontwerp: **CLIENT-ONLY, engine puur aangeroepen.** Verdict-keten =
  `workoutZones(type, doel)` → `isHard`; `readinessAdjust_({type, isHard}, band, macroFase)` → action `keep|demote` +
  code `caution_key`/`rest_key` + `toType`; `readinessEaseNaam_(toType)` → NL-alternatief. Warme copy in
  `lib/coachNarrative.ts` met een EIGEN code-namespace (botsing met plan-`redenCode`s vermijden). Surface = de
  bestaande `CoachCallout` op de dagkaart (de 3b-onderdrukking wordt daar opgeheven via `isOverrideCard`); NIET de
  picker (aparte bericht-vorm; de override is omkeerbaar via "Terug naar voorstel", dus advies achteraf is een gesloten
  lus). **GRENZEN:** alleen als de override-dag VANDAAG is (de band is de gereedheid van vandaag; GAS' `rdyCoach` is om
  dezelfde reden today-only — een toekomstige dag krijgt hooguit een neutrale regel zonder oordeel); alleen bij HARDE
  keuzes (tempo/sweet_spot/threshold/vo2max) op band caution/rest en buiten Taper/Recovery — een lange Z2 op band rest
  blijft stil want `readinessAdjust_` bewaakt intensiteit, geen volume (GAS-identiek); vrije rit stil (GAS slaat 'free'
  expliciet over; "op gevoel" is zelf al de keuze). **VALKUIL:** `readinessRegel_` NIET hergebruiken — die copy claimt
  "Ik heb je X verlicht naar Y", bij een override onwaar. **NOOT:** de override wordt NA `assignWorkouts` geswapt, dus
  de rest van de week past zich er NIET op aan (GAS net zo) — beloof dat niet in copy. Het veld `src?: "readiness"`
  staat al in `packages/shared/src/override.ts`. Hangt samen met de blast-radius-herziening.
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
- **`maandLabel` dubbel (R0 2c-bevinding, client-only):** `lib/niveau.ts:32` (gedeeld, geëxporteerd) én een eigen
  kopie in `components/niveau/ProgressieCard.tsx:30` die de gedeelde versie NIET importeert; ze wijken af op
  edge-cases (input zonder streepje). Later: de kopie vervangen door een import. Geen engine.
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
  make-up-idempotentie + display; round-trippt in `override_json`. (3) **Picker-preview draait op de ENGINE**
  (`previewOverrideSession` → `buildOverrideWorkout_` met de dag-context `mesoWeek`/`macroFase`, `eventCtx`
  undefined) i.p.v. een port van GAS' client-side `trnScale_`. Reden: Cadans regenereert elke render, dus de dagkaart
  toont de echte engine-workout; `trnScale_` zou de preview zichtbaar laten afwijken van de kaart een tik later.
  Gevolg: GAS' bewuste bloklijst-DEGRADATIE (`zoneBlock_` met `fromSegs=true` → `blokLijstSegs_`, zone-naam +
  minuten i.p.v. de echte structuur-rijen) komt NIET mee — Cadans toont de volle structuur via het gedeelde
  `WorkoutDetail`. `trnScale_`/`overrideDotZone_` blijven ONGEPORT. (4) **Trainingen-tab toont de `ReadinessCard`,
  NIET GAS' 2-slide status/level-swipe-deck:** readiness informeert de keuze op die tab, de `LevelCard` niet (die
  stond er om de deck te vullen = layout-motief). Consistent met de al geschrapte Vorm-swipe-deck. Bijvangst: de tab
  heeft aan `loadSchemaWeek` genoeg (geen tweede activities-fetch) en kreeg de check-in gratis. (5) **"Ingepland"-
  bevestiging gebruikt `{weekday} {dayNum}`** i.p.v. GAS' 2-teken-afkorting (`trnDayKort_`) — Cadans-interne
  consistentie met de dag-detail-overline. (6) **Overline op een override-dag = "Gekozen", ook op vandaag** — de
  state-ladder done > gemist > today laat een specifieker feit al winnen van "Vandaag"; een override is zo'n feit.
  Eén gedeelde conditie `isOverrideCard` voedt zowel het label als de `OverriddenDetail`-dispatch. Hiermee is debt
  (a) "dag-detail-overline VOORSTEL boven de override-pin = tegenspraak" INGELOST.
- **(o) 5.3c-ii live-Schema-cosmetica — SYMPTOOM WEG, OORZAAK NIET (R1-C0).** De drie leaks op de live
  /dev-Schema zijn weg: (1) ~~"· null"~~ → `settings.doel='Ardennen-trip'` geseed; (2) ~~"0-0 bpm"~~ →
  `settings.lthr=178` geseed (watts klopten al, FTP 280); (3) ~~rauwe focus-bucket "low"/"high"/"anaerobic"~~
  → geprettify't via `focusLabel` (`apps/web/src/lib/schema.ts`, commit `c63d217`) naar Duur/Drempel/VO2max,
  proza-focus onveranderd. Telefoon-geverifieerd. Seed = LOKAAL (miniflare, zie seed-recipe), NIET in
  repo/remote. De `EMPTY_SETTINGS`-fallback in `loadSchemaWeek` verzacht een verse user maar raakt de
  users-bootstrap-debt (kruisverwijzing **(m)**).
  **R1-C0 herziet dit:** de seed nam het symptoom weg op één machine; de OORZAAK is dat GAS'
  `SETTINGS_DEFAULTS`-laag (`Settings.gs:72`) niet geport is. Zes van de twaalf velden lekken door naar
  zichtbare output (ftp · lthr · doel · pendelDuurMin · pendelAantal · profielPreset). Latent, niet weg: v1
  is single-user (`CURRENT_USER_ID=1`) en die ene rij is gevuld. Elke verse user reproduceert 'm. Zelfde
  stale-vorm als debt (b) in batch A.
- **(p) Fase-token nog Engels ("Build") — engine-copy, NIEUW (5.3c-ii nazorg).** De macro-fase wordt
  INGEBAKKEN in engine-strings: `packages/engine/src/planner.ts:623` (reden, "… — fase <macroFase>") én
  `:1079` (workout-naam, bv. "Z2 progressief (Build, ingekort)"). Er is GEEN discreet `macroFase`-veld op
  `ProposalDay`/`ProposalWeek`/`SchemaDay`. NL-prettify van de fase kan dus NIET UI-only (anders dan de
  focus, debt (o)): vereist een engine-copy-wijziging óf een discreet fase-veld dat de UI apart labelt.
- **(q) Engine-bpm-quirk in over-under-sets (low prio) — NIEUW (5.3c-ii nazorg).** De
  "Herstel · Easy tussen de sets"-blokken erven de set-drempel-HR (bv. 157-178 bij `lthr`=178) i.p.v. een
  lage herstel-HR. Visueel bevestigd op de telefoon. Engine-emit (geen UI-fix); parkeren tot de eind-audit.
