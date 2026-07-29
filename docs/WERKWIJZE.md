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
- **GAS is een PORT-referentie, geen normbron.** De bevroren bron beantwoordt uitsluitend "hebben we functie X destijds getrouw overgezet". Hij beantwoordt NOOIT "is dit de juiste waarde": waar een getal vandaan komt zegt niets over of het klopt. Is er een meting op de echte reeks, dan wint die, en dan is de herkomst van het oude getal geen bespreking waard — een fork hoeft niet als fork verantwoord te worden. Aanleiding: bij de TSS-ijking werd de GAS-oorsprong van de weging 0,7/0,95/1,05 opgezocht om de wijziging als "bewuste fork" te labelen, terwijl HANDOFF §7 GAS al gesloten had verklaard en de meting het antwoord al gaf.

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
- **Een anomalie in je eigen meetuitvoer is een gat in je INSTRUMENT, geen ruis.** Zie je nullen waar getallen horen, of een categorie die je telling niet vangt, dan mag géén enkel getal uit die meting in een spec landen — ook niet de getallen die er wél plausibel uitzien. Meet met de functie die de app zelf gebruikt, óók als de meting in de chat gebeurt en niet in de code. Dit is dezelfde regel als "enumereer met de functie die de app zelf aanroept", nu ook geldend voor metingen die de chat zelf doet. Aanleiding: bij de duur-selectieregel telde een wegwerp-script alleen core-entries van kind `int` via reps × onMin, zette ladders en pyramids daarmee op nul, en dat werd expliciet als onbelangrijk afgedaan — waarna de cap van 60 werkminuten er wél op werd gebouwd. Gemeten met de nominale-werktijd-lus uit `expandArchetype_` zijn de maxima 50 voor drempel, 69 voor sweetspot en 28 voor vo2.
- **Een acceptatie-eis toetst alleen wat de ingreep kán raken.** Stel eerst vast wélk mechanisme het tekort veroorzaakt, en formuleer de eis pas daarna. Anders vraag je iets wat de bouw per constructie niet kan leveren, en stopt CC terecht op een eis die zelf niet klopte. Aanleiding: de eis "geen weekvorm van 6 uur of meer levert minder kwaliteitsminuten dan de 5-uursweek" viel over weekvorm V3 — daar komt het tekort niet uit `goalWorkout_` maar uit de allocator, die de lange dag geen kwaliteitsslot geeft. TWEEDE KEER dezelfde fout: de eis "een dag van 135 minuten of langer draagt een kwaliteitssjabloon" viel over weekvorm V7, waar stap 1b de lange dag juist BEWUST laat liggen omdat hem pakken twee buren kost. De eis hoort pas geformuleerd te worden nádat het mechanisme is vastgesteld — niet ernaast, en niet ervoor.
- **Een omvallende assertie ZONDER hardcoded getal is een fixture-vraag, geen herijk-vraag.** Een relationele mechanisme-check ("A is precies één minder dan B", "X trekt niets af") heeft geen constante om 1-op-1 te verzetten. Valt zo'n assertie om, dan is óf de fixture óf het mechanisme fout — zoek de oorzaak, corrigeer de fixture, en verzwak de assertie niet. Aanleiding: de "rustige" fixture in `quotaAftrek.test.ts` was puur Z2 maar erfde de standaard-IF 0,85 van `act()`, en `recentHardDate_` noemt een rit hard vanaf IF 0,85 — die blokkeerde dus de dinsdag via avoid-consecutive-hard. Bij een quotum van 2 vielen de tellingen toevallig samen en slaagde de test om de VERKEERDE reden; pas bij 3 brak het op.
- **Een keuzeregel die per stap optimaliseert, toets je op wat hij daarna nog toelaat.** Greedy is niet fout omdat hij greedy is, maar omdat hij een keuze kan maken die het resterende budget onplaatsbaar maakt — en dat kost geen minuten maar hele SESSIES, wat een dosis-meting in minuten niet zichtbaar maakt. En de meetset draagt het gat mee: de weekvorm-as en de 48 vingerafdrukken bleven allebei groen terwijl een hele familie weekvormen een kwaliteitsdag verloor, simpelweg omdat die vorm er niet in zat. Bouw je een regel die de SELECTIE verandert, breid dan eerst de meetset uit met de vorm die de regel kan schaden; groen op een set die het geval niet bevat bewijst niets. Aanleiding: de draagkrachtterm uit stap 1b liet een lange weekenddag zijn buren blokkeren — 23 cellen minder kwaliteitsminuten en 14 cellen minder kwaliteitsdagen, alle buiten beide meetsets, gevonden doordat één selftest-fixture toevallig die vorm droeg.
- **Een nieuw vangnet moet aantoonbaar ROOD zijn zonder de fix.** Een meting die je toevoegt om een defect te vangen en die je nooit hebt zien falen, is decoratie: hij kan net zo goed langs het geval heen liggen. Zet de fix tijdelijk uit, meet, en rapporteer beide kanten. Aanleiding: weekvorm V7 werd toegevoegd als vangnet voor de blokkerende lange dag; met de bereikbaarheidsterm uit levert hij 81 kwaliteitsminuten en 2 kwaliteitsdagen, met de term 90 en 3 — pas daarmee stond vast dat de as het defect werkelijk vangt. Kwam binnen als CC-afwijking en is strikt beter dan wat de prompt vroeg.
- **Landt een fix op N PLEKKEN, dan moet de rood-test PER PLEK rood zijn.** Een gedeelde meetas kan volledig via één tak lopen en de andere per constructie verbergen; groen op de as zegt dan niets over de tak die er niet in zit. Meet elke plek los, met alleen díé plek gepatcht. Aanleiding: de weekvorm-as kon `renderVariant_` niet bewijzen — met uitsluitend `expandArchetype_` gepatcht waren de kwaliteitsminuten op trede 2 IDENTIEK en verschilde alleen de TSS met 1 op twee cellen. Per plek gemeten gaat `thr_3x15` op 90 minuten van 45 naar 51, en bewegen zes van zes kwaliteitsvarianten.
- **Toets een AFWIJZING op zijn EFFECT, niet op zijn antwoord.** Een 400-test die alleen de statuscode leest, laat de schrijfkant volledig ongetoetst: een route die netjes 400 antwoordt én tóch wegschrijft, komt er groen doorheen. Lees na de afwijzing terug wat er staat. Aanleiding: bij de dosis-trede-route is naast elke 400 geasserteerd dat er níéts is weggeschreven; kwam binnen als CC-toevoeging en is strikt beter dan wat de prompt vroeg.
- **Tel op een eigenschap die ELKE kandidaat draagt, nooit op het kenmerk van het gezochte geval.** Een filter dat instanties van X zoekt door op een MARKERING van X te matchen, kan de afwezigheid van die markering niet onderscheiden van de afwezigheid van X — en juist die afwezigheid is vaak de vondst. Aanleiding: de kwaliteitsdag-telling uit de screenshot-harness matchte op het type-label, en kaal duurwerk draagt er geen; de zaterdag van 180 minuten viel daardoor stil uit de telling. Het brak op doordat de telling tegen de PNG werd gelegd — het beeld is hier het controlemiddel op de tekst. Tel op duur en TSS, die draagt elke sessie, en classificeer pas daarna.
- **Een fixture die leeg gevoed wordt, voorspelt de app niet.** De weekvorm-as voedt `activities`, `weekplans` en `wellness` leeg; de levende D1 draagt historie, en de recency-seed kiest daardoor ANDERE varianten binnen dezelfde duur-band. Gemeten op dezelfde weekvormen: V2 389 tegen 410, V4 347 tegen 362, V7 367 tegen 375, met overal hetzelfde aantal kwaliteitsdagen — op V7 volledig verklaard door twee dagen die van sjabloon wisselen (−3 en −5). De as blijft geldig als VERGELIJKBARE reeks over bouwen heen, maar een verschil tussen as en app is geen regressie en nooit een herijk-aanleiding. Wie ze naast elkaar zet, zet er de reden bij.
- **Een render-conditie die op een AFWEZIGHEID leunt, is geen STATE.** Vertaal "er is hier niets" niet naar een state-naam zodra meer dan één state die afwezigheid kan dragen — je verliest dan stilzwijgend de andere. Toets vóór de vervanging welke states het geval kunnen dragen. Aanleiding: de rustdag-copy werd van `sessions.length === 0` naar state `rest` gebracht, waarna vandaag-zonder-trainingsdag (state `today`) zijn copy verloor en niets rendeerde. Juiste vorm is dezelfde als het origineel, alleen op de goede bron: `planSessions.length === 0`. Kwam binnen als CC-correctie op een fout in de prompt.
- **Een byte-vergelijking tussen twee harness-runs geldt alleen zonder werk ertussen.** De harness is deterministisch — 40 van 40 identiek op bytecount en sha256 bij twee runs back-to-back — maar zijn INVOER niet: de lokale D1 draagt historie, en elk tussentijds werk dat haar raakt verandert de shots. Meet je een wijziging, draai dan beide kanten achter elkaar op dezelfde machine zonder iets ertussen. Aanleiding: acht "afwijkende" shots in de vooruit-scenario's reproduceerden onder gecontroleerde meting niet. Zelfde familie als "een fixture die leeg gevoed wordt": de historie in D1 is een verborgen variabele. En andersom levert de gecontroleerde diff meer dan een verschilbewijs — een pixeldiff die 32 van de 40 shots byte-identiek toont en het verschil tot één rechthoek terugbrengt, is een BEGRENZINGSbewijs: hij toont dat de fix niets anders raakt.

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

EEN `git diff --stat <pad>` IS NÁ EEN COMMIT TRIVIAAL LEEG en bewijst dan niets: de wijziging zit in de commit, niet meer in de werkboom. Pin hem op `HEAD~1` (`git diff --stat HEAD~1 -- <pad>`) of op de fase-basis. Zelfde familie als de `head_sha`-regel bij CI: een controle die per constructie slaagt, is geen controle. Kwam binnen als CC-verbetering.

CC mag afwijken en moet dat melden. Een flag-en-stop legt het balletje via het rapport terug bij Claude.

## Gate

Geen commit of merge op rood: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — én CI groen. De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren; hardcode die getallen nooit in een prompt, lees ze uit de suite. Een bewuste daling (bijvoorbeeld verwijderde dode-code-tests) is geen regressie, maar wordt expliciet gemeld en in HANDOFF bijgewerkt.

## Prod en veiligheid

Prod-acties zijn approval-gated en gaan nooit stilzwijgend: `wrangler deploy` **vanuit `workers/api`** (niet `pnpm deploy`), met **`pnpm build` ervoor** omdat de assets-binding naar `apps/web/dist` wijst. Remote-D1-mutaties idem, in strikte volgorde: migratie eerst, dan deploy. Nooit prod-D1 met de hand bewerken.

Remote-D1 **lezen** is een ander verhaal dan bewerken: een read-only `SELECT` via `wrangler d1 execute --remote` is approval-gated maar toegestaan, en vaak de zuiverste meetbron — het is exact wat de app ziet, zonder tussenlaag of aanname. De drempel-ijking van de doortrain-kaart leunde op 376 echte CTL-rijen die zo zijn opgehaald. Een MUTATIE op prod-D1 blijft verboden; het onderscheid is lezen versus schrijven, niet de tool.

LET OP bij een meting: `wrangler d1 execute --file` verwerkt het bestand als IMPORT en geeft alleen een SAMENVATTING terug (aantal queries, gelezen en geschreven rijen), GEEN resultaatrijen — met én zonder `--json`. Voor een meting draai je elk statement los met `--command --json`. Gevonden op 27-07-2026 bij de ijk-meting; CC meldde het als afwijking.

CC KAN visuele verificatie doen. `tools/shots/shot.mjs` (Playwright met Chromium) seedt de LOKALE D1 via de API, pint de browser-klok en schiet de weekkaart plus alle zeven dagkaarten weg als PNG met een `.txt` ernaast (console-errors mét falende URL, request-telling, innerText); CC leest die PNG's zelf terug. Twee regels die erbij horen: de klok is ÓÓK in de browser een fixture-variabele (`page.clock.setFixedTime`, vóór de eerste `goto`), en de app is `height: 100dvh` met een eigen scrollende `main` — een `fullPage`-shot snijdt dus af, de viewport wordt op de gemeten scrollhoogte gezet. CC BEOORDEELT ZELF wat uit een screenshot vast te stellen is en geeft een UITSPRAAK: klopt, klopt niet, of niet toetsbaar op dit geval. Beschrijven wat hij ziet is NIET genoeg — dan velt Daan alsnog het oordeel, en dat was precies het werk dat de harness moest overnemen. Kan CC iets niet vaststellen, dan zegt hij EXPLICIET wat Daan moet openen, op welk scherm, en waar hij precies naar kijkt; dat is de enige route naar Daan toe. De harness draait ook TEGEN PROD: doel-URL als argument, geen seed, geen backup, geen enkele schrijf-aanroep van de harness zelf. Prod staat achter een whole-origin Basic-auth-gate, dus hij krijgt `httpCredentials` plus een preflight mét Authorization-header; het wachtwoord komt uit `CADANS_BASIC_AUTH_PASSWORD` of uit het git-ignored `tools/shots/.prod-auth`, en blijft uit prompt, rapport en uitvoer.

BESLUIT, en het blijft staan: er komt GEEN read-only-modus die de mount-sync van de app onderdrukt. Een pageload tegen prod schrijft drie dingen — twee idempotente intervals-syncs en één `PUT /api/weekplan/<maandag>` die via `mergeFrozenWeekplan` geen historie kan herschrijven. Dat is bewust geaccepteerd: een harness die een SPECIALE modus fotografeert, kan liegen over de normale. Hoort de app niet te schrijven bij het laden, dan is dat een app-defect en geen camera-defect, en dan repareer je de app.

Secrets komen nooit in de chat of in een rapport; alleen de NAAM. Lokaal draaien via `.dev.vars` (staat in `.gitignore`).

## Communicatie

Nederlands voor uitwisseling en UI-strings; Engels voor code, commit messages en logging. Direct en technisch, bondig, weinig opmaak, geen overdreven beleefdheid. Daan leest geen code in de chat: bevindingen gaan in documenten, uitleg in gewone taal in de chat. Kopieerbare tekst staat altijd in een één-tap code-blok.

## Close-out van een chat

De HANDOFF-update is **altijd een aparte docs-only commit**, nooit gebundeld met code. CC committe, pusht en print de gepinde RAW-URL op de commit-hash. Een chat is pas klaar voor overgang als die push gedaan is. Nieuwe of gewijzigde werkwijze-afspraken uit die chat gaan in dezelfde close-out naar dit document.

Na het close-out-rapport schrijft de chat de opener voor de volgende chat uit, verbatim uit *§ Opener-sjabloon*.

## Opener-sjabloon

**De afsluitende chat schrijft de opener uit** — verbatim uit dit sjabloon, in één code-blok, ná het close-out-rapport (dan pas is de hash bekend). Invullen: `<hash>` (op ALLE DRIE de URL's dezelfde close-out-hash), STAND uit de HANDOFF, en FOCUS. Verder niets toevoegen: de werkwijze staat hier, niet in de opener. Daan hoeft niets samen te stellen — hij krijgt één kant-en-klaar blok.

--- BEGIN OPENER ---
Lees eerst deze drie via web_fetch (RAW, gepind op commit-hash — NIET de blob-URL, die is stale):
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/WERKWIJZE.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/HANDOFF.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/DOELEN-SPEC.md

WERKWIJZE.md is canoniek voor hoe we werken en leidend bij tegenspraak; HANDOFF.md is de
projectstand; DOELEN-SPEC.md draagt de VASTGESTELDE doel-besluiten en wordt niet heropend.
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
- 2026-07-27 — in *Bronhiërarchie voor parity* vastgelegd dat de bevroren GAS-bron een PORT-referentie is en geen normbron: een op de echte reeks geijkt getal wint van de bron, en een afwijking hoeft niet als fork verantwoord te worden. Aanleiding: bij de TSS-ijking ging een ronde op aan het opzoeken van de GAS-herkomst van 0,7/0,95/1,05 terwijl de meting het antwoord al gaf.
- 2026-07-28 — het opener-sjabloon haalt voortaan ook `docs/DOELEN-SPEC.md` op, als derde verplichte fetch naast WERKWIJZE en HANDOFF. Aanleiding: een VASTGESTELD besluit uit dat document — de gedeclareerde uren zijn een gegeven, de app vraagt niet om meer tijd — kwam deze chat opnieuw ter discussie omdat de opener het document niet ophaalde en het besluit dus nergens in beeld was.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: een omvallende assertie zonder hardcoded getal is een fixture-vraag, geen herijk-vraag. Aanleiding: de rustige fixture in `quotaAftrek.test.ts` erfde de standaard-IF 0,85 en telde daarmee als harde rit, waardoor de test bij quotum 2 om de verkeerde reden slaagde en pas bij 3 opbrak.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: een keuzeregel die per stap optimaliseert toets je op wat hij daarna nog toelaat, en de meetset moet de vorm bevatten die de regel kan schaden. Aanleiding: de draagkrachtterm uit stap 1b kostte een hele familie weekvormen een kwaliteitsdag terwijl beide bestaande meetsets groen bleven, omdat die vorm er niet in zat.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: een nieuw vangnet moet aantoonbaar rood zijn zonder de fix. Aanleiding: weekvorm V7 werd als vangnet toegevoegd en pas met de fix tijdelijk uitgezet — 81 minuten en 2 dagen tegen 90 en 3 — stond vast dat hij het defect werkelijk vangt.
- 2026-07-28 — de alinea over visuele verificatie in *Prod en veiligheid* herschreven: CC KAN het nu wel. Aanleiding: `tools/shots/shot.mjs` (Playwright met Chromium) is er, schiet de week- en dagkaarten weg en CC leest de PNG's zelf terug. De rolverdeling blijft: de harness gate't de commit, Daans oog de deploy.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: tel op een eigenschap die élke kandidaat draagt, nooit op het kenmerk van het gezochte geval. Aanleiding: de kwaliteitsdag-telling matchte op het type-label, en kaal duurwerk draagt er geen — de zaterdag van 180 minuten viel stil uit de telling en dat brak pas op tegen de PNG.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: een fixture die leeg gevoed wordt voorspelt de app niet. Aanleiding: de weekvorm-as gaf V2 410, V4 362 en V7 375 waar de app 389, 347 en 367 toont, bij hetzelfde aantal kwaliteitsdagen — variant-rotatie via de recency-seed, geen dosisverschil.
- 2026-07-28 — de rolverdeling bij visuele verificatie aangescherpt in *Prod en veiligheid*: CC velt zelf een UITSPRAAK (klopt / klopt niet / niet toetsbaar) in plaats van te beschrijven wat hij ziet, en zegt bij twijfel expliciet wat Daan moet openen en waar hij naar kijkt. De harness mag read-only tegen prod. Aanleiding: beschrijven schuift het oordeel terug naar Daan, en dat is precies het werk dat de harness moest overnemen.
- 2026-07-28 — de les "een acceptatie-eis toetst alleen wat de ingreep kán raken" aangevuld met een tweede aanleiding: de eis dat een dag van 135 minuten of langer een kwaliteitssjabloon draagt, viel over V7 waar 1b die dag bewust laat liggen. Tweede keer dezelfde fout, dus de regel staat er nu scherper: eerst het mechanisme vaststellen, dan pas de eis.
- 2026-07-28 — de vangnet-regel in *Recon en bewijslast* aangescherpt: landt een fix op N plekken, dan moet de rood-test PER PLEK rood zijn. Aanleiding: de weekvorm-as gaf op trede 2 identieke kwaliteitsminuten met alleen `expandArchetype_` gepatcht, en kon de `renderVariant_`-tak dus per constructie niet bewijzen.
- 2026-07-28 — les toegevoegd in *Recon en bewijslast*: toets een afwijzing op zijn effect, niet op zijn antwoord. Aanleiding: bij de dosis-trede-route is naast elke 400 geasserteerd dat er niets is weggeschreven — een route die netjes 400 antwoordt én tóch schrijft, komt anders groen door.
- 2026-07-28 — in *Vorm van een CC-rapport* vastgelegd dat `git diff --stat <pad>` ná een commit triviaal leeg is en op `HEAD~1` of de fase-basis gepind hoort te worden. Zelfde familie als de `head_sha`-regel bij CI.
- 2026-07-28 — in *Prod en veiligheid* de Basic-auth-route van de harness vastgelegd, plus het BESLUIT dat er geen read-only-modus komt die de mount-sync onderdrukt: een harness die een speciale modus fotografeert kan liegen over de normale.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een render-conditie die op een afwezigheid leunt is geen state. Aanleiding: de rustdag-copy werd aan state `rest` gehangen en brak daarmee vandaag-zonder-trainingsdag, dat state `today` draagt.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een byte-vergelijking tussen twee harness-runs geldt alleen zonder tussentijds werk dat de lokale D1 raakt, en een gecontroleerde pixeldiff is een begrenzingsbewijs. Aanleiding: acht vermeende afwijkende shots reproduceerden onder gecontroleerde meting niet, terwijl de diff binnen `v7-midweek` het verschil tot twee rechthoeken terugbracht.
