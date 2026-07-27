# Cadans — WERKWIJZE

Canoniek document voor hoe we werken. Wordt bij elke nieuwe chat gelezen via een RAW-URL gepind op een commit-hash.

## Voorrang bij tegenspraak

- **Werkwijze** → dit document. Wint van `HANDOFF.md`, van `CLAUDE.md` en van elke opener.
- **Projectstand** → `HANDOFF.md`.
- **Doel-laag (wat elk doel moet leveren)** → `docs/DOELEN-SPEC.md`. Een besluit dat daar als VASTGESTELD staat wordt niet opnieuw ter discussie gesteld; wijzigen gebeurt door dat document te wijzigen, niet in een chat.
- **Parity (wat de oude app doet)** → de bevroren GAS-bron `daanhhk/training` @ `3e8090a`. Die wint van élke samenvatting, inclusief dit document, `HANDOFF.md` en `docs/VORMGEVING-SPEC.md`.
- `CLAUDE.md` is de CC-kant en is afgeleid van dit document.

Een conventie **bestaat pas** als hij hier of in `CLAUDE.md` staat. Nieuwe afspraken uit een chat worden in de close-out gecommit. Zo is drift een `git diff`, geen gevoel.

## Rolverdeling

Twee lagen. **Chat-Claude** is architect, prompt-schrijver en reviewer: doet het denkwerk, neemt de inhoudelijke beslissingen, interpreteert recon. **Claude Code (CC)** voert uit op de laptop — schrijft code, test, commit, pusht — en dubbelcheckt zelf wat meetbaar is: round-trips, D1-reads, gate, CI. **Daan** keurt goed, geeft rapporten door en triggert prod-acties; hij maakt nooit inhoudelijke keuzes binnen CC.

## Loop per feature of fix

1. Daan beschrijft de wens of bug in de chat.
2. Niet-triviaal → Claude stelt eerst een plan voor dat Daan reviewt (stop-en-verifieer). Kleine tactische fixes mogen direct.
3. Claude schrijft een zelfstandige CC-prompt in één code-blok.
4. Daan plakt in CC; CC voert uit.
5. CC levert een rapport in platte tekst.
6. Daan plakt het rapport terug; Claude triageert en schrijft de volgende prompt of bevestigt klaar.

Grotere klussen in fases met een stop-en-verifieer-moment ertussen. Recon-first voor durable artefacten: read-only recon → proposal- of recon-doc → Daan reviewt → pas dan bouwen.

## Beslissen

Claude neemt de technische beslissingen zelf en vraagt alleen wat vanuit Daans perspectief echt onduidelijk is.

- **Geen open opties in CC-prompts.** Elke keuze is vooraf beslist.
- Bij meerdere redelijke aanpakken of echte ambiguïteit: een popup-vraag, met **Claude's advies expliciet in de begeleidende proza** ("Mijn advies: optie X, want …") — nooit alleen als tag in een optie-label.
- Vraagt Daan "wat is de professionele aanpak?", dan wil hij een **beslissing met onderbouwing**, geen popup.
- Een "volgende stap" in HANDOFF is een voorstel, geen opdracht. Verifieer de premisse tegen de bron vóór je bouwt; recon mag Claude's eigen eerdere advies omgooien.
- Claude signaleert zelf bij ongeveer 70–80% contextgebruik, zodat de overdracht soepel gaat.

## Bronhiërarchie voor parity

`daanhhk/training` is publiek en **bevroren op `3e8090a`**. Lees die bron **direct** als eerste reflex bij elke parity-vraag — architectuur én vormgevingslogica — nooit uit geheugen en nooit uit een samenvatting.

- **Chat-Claude**: kloon de publieke repo's read-only in de container (`git clone --depth 1` van `daanhhk/training` en `daanhhk/Cadans`) en grep. Byte-exact en sneller dan losse fetches. Anders `raw.githubusercontent.com/daanhhk/training/3e8090a/<pad>`.
- **CC**: leest de GAS-bron van schijf (`C:\Users\daan\Projects\training`, read-only) — **nooit via WebFetch**, dat geeft een lossy parafrase.
- De regel "de chat kan de repo niet lezen" geldt **alleen de uncommitte lokale Cadans-staat**. De GAS-bron en de gecommitte Cadans-code lees je gewoon zelf.
- `VORMGEVING-SPEC.md`, `HANDOFF.md` en de recon-docs zijn een gepinde **samenvatting**, geen vervanging. Verifieer elke parity-claim tegen de bron.

## Recon en bewijslast

- **De chat leest zelf.** Read-only kloon van de publieke repo's plus grep; **nul CC-prompts voor leeswerk**. Bij een leesronde doet CC alleen de close-out-commit. Acht keer bevestigd.
- **Draai het.** Lezen levert een vermoeden, meten levert bewijs. De zwaarste uitkomsten van de auditrondes waren stuk voor stuk weerleggingen van wat lezen suggereerde: `mesoFactor` bleek vermogen te schalen in plaats van duur, en een off-by-one was met lezen alleen niet zichtbaar. Bundelroute: esbuild, buiten de repo-tree, met `TZ=Europe/Amsterdam`.
- **De klok is een fixture-variabele.** Stub `Date`. Een test die op de echte klok leunt, meet iets anders dan je denkt.
- **Locatie-ankers mechanisch extraheren.** Trek ankers (bestand, regel, substring) met een regex uit je eigen tekst en draai ze **allemaal** — nooit via een handgemaakte lijst. Een handlijst dekte 48 van 70 ankers en alle drie de fouten zaten in de 22 daarbuiten; de mechanische toets ving drie foute ankers in de eigen tekst vóór publicatie.
- **Reken je eigen werk na.** Rapporteer de trefkans van je ankers (bijvoorbeeld 18 van 122) in plaats van te claimen dat het klopt.
- **Een tijd-verschoven herberekening meet alleen tijd-gedreven verandering.** Dezelfde functie op een verschoven klok draaien detecteert wat er met de TIJD verandert, nooit wat er met de DATA verandert. Een gespecificeerde "overgang" die in werkelijkheid bij een invoer-moment hoort, is met die methode per constructie onbereikbaar — controleer welke van de twee je bedoelt vóór je de detectie specificeert. Kostte één bouwronde: de `event_overname`-tak in `faseOvergang.ts` kon niet vuren en is weer verwijderd.
- **Een halve fix is een vindpatroon.** Repareert een fix één van meerdere parallelle accumulaties of takken, controleer dan meteen de broertjes. Werkstroom 3 vond dat `sessions` leeg is voor verstreken dagen en repareerde alleen de Dagen-noemer; TSS en Uren droegen dezelfde bug daarna nog maanden mee. Daans screenshot pinde hem vast: de getallen op zijn scherm zijn een MEETINSTRUMENT, niet alleen een visuele check — waar CC geen visuele verificatie kan doen, kan Daans oog wél een numeriek bewijs leveren.
- **IJk een drempel op de ECHTE reeks, nooit op een modelcurve.** Een simulatie met gelijkmatige load mist de clustering van echte training en leidt naar de verkeerde conclusie. Bij de doortrain-kaart voorspelde de modelredenering dat het 7-daags TSB-gemiddelde rond 0 zou blijven; de echte reeks liep tot 9,14 en zakte binnen acht dagen weer weg. Dat verschil verplaatste de diagnose van "de drempel staat te hoog" naar "het signaal is ruis" — een andere fix, niet een andere waarde.
- **Een drempel hoort op een PLATEAU te liggen.** Toets vóór je een grens vaststelt hoe de uitkomst meebeweegt met die grens: verschuift hij sterk over een klein bereik, dan bemonster je ruis en is elke waarde even willekeurig. Het blok-signaal verschoof over 0,0..+2,5 maar twee van zeventien gevallen; het TSB-signaal bewoog in acht dagen meer dan de hele drempelafstand. Dit criterium vooraf toepassen had de hele +8 → +5-ronde overbodig gemaakt.
- **Enumereer met de functie die de app zelf aanroept.** Een toets die zijn eigen venster- of
  blokraster nabouwt — al is het maar een lus van 28 dagen — reproduceert de verankering niet en
  kan er ongemerkt een kwartslag naast liggen. Er faalt dan niets, want de toets is intern
  consistent; hij meet alleen iets anders dan de app doet. Roep de échte enumerator aan
  (`blokStartVoorWeek`) en asserteer expliciet dat het ijk-blok uit de recon op datzelfde raster
  ligt. Kostte twee bouwrondes bij de 5b-drempel: eerst een sweep over élke maandag, die de
  gevoeligheid voor de RASTERFASE meet in plaats van voor de drempel en per constructie geen
  plateau oplevert; daarna een lus die op een willekeurig blok verankerd was en het ijk-blok uit
  §8 niet eens bevatte. Het oorspronkelijke ontwerp had gelijk; de "correctie" maakte het stuk en
  moest worden teruggedraaid.
- **Pin de CI-run op de commit, niet op "de laatste".** Haal de conclusie op met een `head_sha`-filter
  op de eigen commit-hash in plaats van kaal `per_page=1`: die laatste kan een run van een andere
  commit of branch teruggeven, en dan rapporteer je groen over werk dat je niet gedaan hebt. Kwam
  binnen als CC-afwijking bij de coach-model-commit en is strikt beter dan wat de prompt vroeg.
- **Meet beide kanten in dezelfde eenheid, en bewaar de termen.** Een vergelijking die
  voorgeschreven grootheden van gemeten grootheden aftrekt oogt geldig en is het niet:
  `zoneDebt_` trekt voorgeschreven intent-minuten af van gemeten zonetijd, wat bij een volledig
  gemiste dag onzichtbaar blijft (actual = 0) maar over een blok systematisch scheefloopt. En een
  saldo verbergt zijn termen: vier gemiste plus vier dubbel gereden kwaliteitsdagen leveren exact
  hetzelfde getal als een perfect uitgevoerd blok. Retourneer gevraagd en geleverd apart.
- **Getest is niet aangesloten.** Een functie die geëxporteerd en in isolatie getest is maar nergens wordt aangeroepen, faalt nergens: de tests zijn groen, de gate is groen, en de app doet het niet. Dezelfde vorm als de enumeratie-les — intern consistent, alleen niet verbonden met wat de app doet. Bij elke nieuwe geëxporteerde functie hoort daarom een expliciete grep naar de AANROEP, en het CC-rapport noemt de call-site. Kostte een halve ronde bij 5b-ii: `testResultaat` was compleet gebouwd en getest en hing nergens.
- **Scheid BELEIDSwaarden van GEIJKTE drempels.** Het plateau-criterium geldt voor een grens die een SIGNAAL bemonstert, niet voor een getal dat een voorkeur uitdrukt. "Hoe vaak wil ik testen" valt niet te ijken op een reeks; daar is de bron een besluit van Daan. Label zo'n constante in de code expliciet als beleid, anders gaat een volgende chat 'm op data zoeken die het antwoord niet bevat.
- **IJk een simulatie op een gemeten eindwaarde vóór je hem gebruikt.** Een model dat op een engine-eigen schatting leunt, erft de fout van die schatting en oogt intern consistent. De CTL-simulatie naar AGR leunde op `tssFromZoneMinutes_` en kwam uit op "negen uur per week nodig om het niveau te houden" — een zware conclusie die niet hield. De weging bleek kwaliteitswerk 30 tot 52 procent te laag te begroten; pas toen het model tegen een ONAFHANKELIJK gemeten eindwaarde werd gehouden (de werkelijke week reproduceert de gemeten CTL van 45,7) kwam dat boven. Die validatiestap hoort VOORAF, niet als controle achteraf: zonder ijkpunt meet een simulatie zijn eigen aannames.
- **IJk niet op gedrag dat je wilt vervangen.** Een drempel die een SIGNAAL bemonstert hoort op de echte reeks; een regel die een BEDOELING uitdrukt niet. Gedragsdata van vóór het mechanisme is een verslag van de OUDE GEWOONTE, dus een regel die daarop fit reproduceert die gewoonte en noemt hem vervolgens een norm. Er ontbreekt bovendien per constructie een tegenvoorbeeld: dezelfde omstandigheid is nooit met een andere invulling doorlopen, dus over wat BETER werkt zegt de reeks niets. Aanleiding: de selectieregel voor een lange dag stond in `docs/STAP7-BOUW12-RECON.md` §9 punt 4 toegewezen aan de D1-meting, terwijl Daan vóór Cadans op gevoel trainde — deels groepsritten en een evenement. Zelfde categorie als de testfrequentie: dat is coach-canon, geen geijkte drempel. Wat zulke data WEL levert is een BOVENGRENS-CHECK: wat aantoonbaar verteerd is, mag een voorstel niet onderschrijden.

## Vorm van een CC-prompt

- **Eén plain code-blok**, zonder taal-tag — dat is de één-tap-kopie op mobiel. Nooit proza in het blok mengen; Claude's kader eromheen staat als gewone tekst.
- Te lang voor één blok → splits in **genummerde blokken** (Blok 1/2, 2/2) die CC na elkaar in dezelfde sessie draait. Een later blok mag leunen op wat een eerder blok zette.
- De prompt is een **stap-instructie in het Nederlands, geen uitvoerbaar script**. PowerShell-idioom alleen in de kop: `cd` naar de repo, daarna `Get-Location` op een eigen regel. Verder kale, zelf-printende commandoregels (git, pnpm). **Geen** `Write-Host` of `echo`, **geen** here-strings, **geen** loops, **geen** .NET File API. Secties label je met `#`-commentaarregels.
- In te voegen inhoud (een HANDOFF-blok, een doc) mag **verbatim** tussen eigen tekst-delimiters (`=== BEGIN … ===` / `=== EINDE … ===`) óf als strekking-bullets die CC in de huisstijl uitschrijft. Bij artefacten waar de exacte formulering telt: altijd verbatim.
- Inhoud: **spec-gedreven by default** — architectuur, exact gedrag, sleutel-logica en de gate. CC schrijft de code, vindt de call-sites zelf en past aan de **échte** staat aan (geen letterlijke `str_replace`-blokken). Exacte code alleen als **anker** bij fragiele edits: byte-getrouwe GAS-mirrors, TZ-grens-logica, formules en zone-mappings. CC meldt in het rapport de kern-implementatiekeuzes (gekozen conditie, plaatsing), zodat review tegen de spec kan zonder de volledige diff. Verder: verificatiestappen, een harde gate en de commit message.
- Vaste sluitregels waar van toepassing: training onaangeroerd op `3e8090a`; `git diff --stat` op `packages/engine` leeg; vloeren uit de suite lezen in plaats van hardcoden; CI via de publieke GitHub REST API.

## Vorm van een CC-rapport

Platte tekst, **geen code-fences en geen tabellen** (breekt de mobiele kopie), ongeveer 200 woorden. Literals tellen niet mee en worden exact gegeven.

Bevat: commit-hash; de gepinde RAW HANDOFF-URL op die hash; gate-uitslag; CI-conclusie met run-URL; bij code een lege `git diff --stat` op `packages/engine`; bevestiging dat training onaangeroerd is (HEAD `3e8090a`); en elke afwijking van de prompt.

CC mag afwijken en moet dat melden. Een flag-en-stop legt het balletje via het rapport terug bij Claude.

## Gate

Geen commit of merge op rood: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — én CI groen. De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren; hardcode die getallen nooit in een prompt, lees ze uit de suite. Een bewuste daling (bijvoorbeeld verwijderde dode-code-tests) is geen regressie, maar wordt expliciet gemeld en in HANDOFF bijgewerkt.

## Prod en veiligheid

Prod-acties zijn approval-gated en gaan nooit stilzwijgend: `wrangler deploy` **vanuit `workers/api`** (niet `pnpm deploy`), met **`pnpm build` ervoor** omdat de assets-binding naar `apps/web/dist` wijst. Remote-D1-mutaties idem, in strikte volgorde: migratie eerst, dan deploy. Nooit prod-D1 met de hand bewerken.

Remote-D1 **lezen** is een ander verhaal dan bewerken: een read-only `SELECT` via `wrangler d1 execute --remote` is approval-gated maar toegestaan, en vaak de zuiverste meetbron — het is exact wat de app ziet, zonder tussenlaag of aanname. De drempel-ijking van de doortrain-kaart leunde op 376 echte CTL-rijen die zo zijn opgehaald. Een MUTATIE op prod-D1 blijft verboden; het onderscheid is lezen versus schrijven, niet de tool.

LET OP bij een meting: `wrangler d1 execute --file` verwerkt het bestand als IMPORT en geeft alleen een SAMENVATTING terug (aantal queries, gelezen en geschreven rijen), GEEN resultaatrijen — met én zonder `--json`. Voor een meting draai je elk statement los met `--command --json`. Gevonden op 27-07-2026 bij de ijk-meting; CC meldde het als afwijking.

CC kan **geen visuele verificatie** doen (geen visual-harness — geparkeerde debt). Dat is Daans oog, en het gate't de deploy, niet de commit.

Secrets komen nooit in de chat of in een rapport; alleen de NAAM. Lokaal draaien via `.dev.vars` (staat in `.gitignore`).

## Communicatie

Nederlands voor uitwisseling en UI-strings; Engels voor code, commit messages en logging. Direct en technisch, bondig, weinig opmaak, geen overdreven beleefdheid. Daan leest geen code in de chat: bevindingen gaan in documenten, uitleg in gewone taal in de chat. Kopieerbare tekst staat altijd in een één-tap code-blok.

## Close-out van een chat

De HANDOFF-update is **altijd een aparte docs-only commit**, nooit gebundeld met code. CC committe, pusht en print de gepinde RAW-URL op de commit-hash. Een chat is pas klaar voor overgang als die push gedaan is. Nieuwe of gewijzigde werkwijze-afspraken uit die chat gaan in dezelfde close-out naar dit document.

Na het close-out-rapport schrijft de chat de opener voor de volgende chat uit, verbatim uit *§ Opener-sjabloon*.

## Opener-sjabloon

**De afsluitende chat schrijft de opener uit** — verbatim uit dit sjabloon, in één code-blok, ná het close-out-rapport (dan pas is de hash bekend). Invullen: `<hash>` (beide URL's op de close-out-hash), STAND uit de HANDOFF, en FOCUS. Verder niets toevoegen: de werkwijze staat hier, niet in de opener. Daan hoeft niets samen te stellen — hij krijgt één kant-en-klaar blok.

--- BEGIN OPENER ---
Lees eerst deze twee via web_fetch (RAW, gepind op commit-hash — NIET de blob-URL, die is stale):
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/WERKWIJZE.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/HANDOFF.md

WERKWIJZE.md is canoniek voor hoe we werken en leidend bij tegenspraak; HANDOFF.md is de projectstand.
Cadans = Cloudflare-herbouw van de trainings-app: pnpm-monorepo, pure engine + Workers/D1 + React-PWA.
Je kunt mijn uncommitte lokale staat (C:\Users\daan\Projects\cadans, Windows/PowerShell, via Remote
Control) niet lezen; de gecommitte Cadans-code en de bevroren GAS-bron lees je wel gewoon zelf.

STAND: <vul in vanuit HANDOFF.md>
FOCUS DEZE CHAT: <vul in>
--- EINDE OPENER ---

## Wijzigingslog

- 2026-07-23 — document aangemaakt. Werkwijze verhuisd uit de opener-ketting en uit de verspreide secties in `HANDOFF.md`. Aanleiding: de werkwijze stond op drie plekken die elk per chat muteerden, waardoor afspraken erodeerden (onder meer de regel dat Claude's advies expliciet in de proza bij een popup hoort).
- 2026-07-23 — aangevuld na een gap-check tegen de levende HANDOFF. Prompt-inhoud is spec-gedreven (stond als "exacte implementatiedetails" — een oudere conventie die bij de verhuizing per ongeluk terugkwam). Sectie *Recon en bewijslast* toegevoegd: chat leest zelf, draai het, klok als fixture-variabele, mechanische locatie-ankers.
- 2026-07-23 — expliciet gemaakt dat de afsluitende chat de opener uitschrijft (verbatim uit het sjabloon, na het close-out-rapport). Voorkomt zowel handwerk als een uit het geheugen gereconstrueerde opener.
- 2026-07-23 — les toegevoegd in *Recon en bewijslast*: een tijd-verschoven herberekening meet alleen tijd-gedreven verandering. Aanleiding: een spec beschreef een fase-"overgang" (`event_overname`) die door tijdsverloop niet kan ontstaan — de tak kon niet vuren en is verwijderd.
- 2026-07-23 — `docs/DOELEN-SPEC.md` toegevoegd aan de voorrangslijst. Aanleiding: de verwachting bij een doel — met name Onderhoud — werd chat na chat opnieuw uitgevraagd, omdat er geen document was waarin het besluit stond. Nu is een doel-besluit een `git diff`, geen gevoel.
- 2026-07-24 — een VASTGESTELD besluit in `docs/DOELEN-SPEC.md` wordt niet heropend, en een open DEELvraag binnen zo'n besluit is geen open ONTWERPvraag: beantwoord die zo klein mogelijk. Aanleiding: de open herstelroute-vraag bij Onderhoud groeide uit tot een mechanisme-ontwerp, waarna het hele doel opnieuw ter discussie kwam terwijl het al vastlag.
- 2026-07-24 — les toegevoegd in *Recon en bewijslast*: een halve fix is een vindpatroon. Aanleiding: één wortel (`sessions` leeg voor verstreken dagen) was eerder maar half gerepareerd — alleen de Dagen-noemer, niet TSS/Uren — en die brak pas op via Daans in-app screenshot als meetinstrument.
- 2026-07-25 — drie afspraken toegevoegd n.a.v. het doortrain-kaart-herontwerp: in *Prod en veiligheid* dat remote-D1 LEZEN (read-only `SELECT`) als meetinstrument mag terwijl bewerken verboden blijft; in *Recon en bewijslast* dat een drempel op de echte reeks geijkt hoort (nooit op een modelcurve) en op een plateau moet liggen (toets hoe de uitkomst met de grens meebeweegt). Aanleiding: de drempel leunde op 376 echte CTL-rijen, en het plateau-criterium had de +8 → +5-tussenronde overbodig gemaakt.
- 2026-07-26 — CI-runs worden gepind op de commit-hash (`head_sha`-filter) in plaats van op de laatste run. Aanleiding: CC deed het uit zichzelf zo bij de coach-model-commit en meldde het als afwijking; de kale variant kan een run van een andere commit teruggeven.
- 2026-07-26 — les toegevoegd in *Recon en bewijslast*: meet beide kanten van een vergelijking in dezelfde eenheid en bewaar de termen. Aanleiding: de uitvoerings-referent-recon mat dat `zoneDebt_` voorgeschreven intent van gemeten zonetijd aftrekt, en dat het saldo een chaotisch uitgevoerd blok niet onderscheidt van een perfect uitgevoerd blok.
- 2026-07-26 — les toegevoegd in *Recon en bewijslast*: enumereer met de functie die de app zelf aanroept, niet met een nagebouwd raster. Aanleiding: de 5b-drempelronde kostte twee bouwrondes aan foute enumeraties — een sweep over élke maandag en daarna een eigen lus van 28 dagen die het ijk-blok uit §8 niet bevatte — terwijl het oorspronkelijke ontwerp gelijk had.
- 2026-07-27 — les toegevoegd in *Recon en bewijslast*: ijk een simulatie op een gemeten eindwaarde vóór je hem gebruikt. Aanleiding: de CTL-simulatie naar AGR erfde de onderschatting van `tssFromZoneMinutes_` en leverde een onhoudbare uren-conclusie op.
- 2026-07-27 — les toegevoegd in *Recon en bewijslast*: ijk niet op gedrag dat je wilt vervangen. Aanleiding: de selectieregel voor een lange dag was aan de D1-meting toegewezen, terwijl die ritten een verslag zijn van hoe Daan vóór Cadans op gevoel trainde; een regel die daarop fit reproduceert de oude gewoonte.
- 2026-07-27 — in *Prod en veiligheid* vastgelegd dat `wrangler d1 execute --file` het bestand als import verwerkt en geen resultaatrijen teruggeeft; een meting draait per statement met `--command --json`.
