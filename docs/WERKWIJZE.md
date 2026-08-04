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

DAAN LEEST GEEN BOUWDOCS. Vastgelegd 30 juli 2026. Een recon- of bouwdoc wordt nog steeds geschreven,
gecommit en gepind — het is de spec waartegen CC bouwt en wat een volgende chat leest — maar het is
GEEN review-poort meer. Claude beoordeelt en beslist. Wat Daan moet weten of beslissen komt als
gewone vraag in de chat, in gewone taal, niet als verwijzing naar een paragraaf.

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
- **Een plan eindigt op een BESLUIT, nooit op "of wil je X?".** Claude neemt de keuze en onderbouwt hem; Daan kan er in de review overheen. Is er echte ambiguïteit, dan is een popup mét Claude's advies in de proza de ENIGE vorm waarin een vraag terugkomt. Een open slotvraag kost een ronde en legt het werk terug dat Claude hoort te doen.
- Vraagt Daan "wat is de professionele aanpak?", dan wil hij een **beslissing met onderbouwing**, geen popup.
- Een "volgende stap" in HANDOFF is een voorstel, geen opdracht. Verifieer de premisse tegen de bron vóór je bouwt; recon mag Claude's eigen eerdere advies omgooien.
- Claude signaleert zelf bij ongeveer 70–80% contextgebruik, zodat de overdracht soepel gaat.

## Bronhiërarchie voor parity

`daanhhk/training` is publiek en **bevroren op `3e8090a`**. Lees die bron **direct** als eerste reflex bij elke parity-vraag — architectuur én vormgevingslogica — nooit uit geheugen en nooit uit een samenvatting.

- **Chat-Claude**: kloon de publieke repo's read-only in de container (`git clone --depth 1` van `daanhhk/training` en `daanhhk/Cadans`) en grep. Byte-exact en sneller dan losse fetches. Anders `raw.githubusercontent.com/daanhhk/training/3e8090a/<pad>`.
- **CC**: leest de GAS-bron van schijf (`C:\Users\daan\Projects\training`, read-only) — **nooit via WebFetch**, dat geeft een lossy parafrase.
- De regel "de chat kan de repo niet lezen" geldt **alleen de uncommitte lokale Cadans-staat**. De GAS-bron en de gecommitte Cadans-code lees je gewoon zelf.
- `VORMGEVING-SPEC.md`, `HANDOFF.md` en de recon-docs zijn een gepinde **samenvatting**, geen vervanging. Verifieer elke parity-claim tegen de bron.
- **GAS is een PORT-referentie, geen normbron.** De bevroren bron beantwoordt uitsluitend "hebben we functie X destijds getrouw overgezet". Hij beantwoordt NOOIT "is dit de juiste waarde": waar een getal vandaan komt zegt niets over of het klopt. Is er een meting op de echte reeks, dan wint die, en dan is de herkomst van het oude getal geen bespreking waard — een fork hoeft niet als fork verantwoord te worden. Aanleiding: bij de TSS-ijking werd de GAS-oorsprong van de weging 0,7/0,95/1,05 opgezocht om de wijziging als "bewuste fork" te labelen, terwijl HANDOFF §7 GAS al gesloten had verklaard en de meting het antwoord al gaf. TWEEDE KEER: bij de sweet-spot-sleutelvraag zocht de chat opnieuw de GAS-bron op, ditmaal om vast te stellen of de ontbrekende sleutel-intent een geporte omissie was of Cadans-drift. Die vraag deed er niet toe — de norm stond al in `DOELEN-SPEC` §3.1 en de meting gaf het antwoord — en Daan wees het terecht af. De bron is nooit nodig om een WIJZIGING te verantwoorden.

## Recon en bewijslast

- **De chat leest zelf.** Read-only kloon van de publieke repo's plus grep; **nul CC-prompts voor leeswerk**. Bij een leesronde doet CC alleen de close-out-commit. Acht keer bevestigd. Een gecommitte meetdump rekent de chat door in de CONTAINER, niet in de context: `curl` de gepinde raw-URL binnen, bundel de functie die de app zelf aanroept met esbuild en draai die eroverheen. Zo is de dump van 217 rijen bij de dosis-munt gevouwen met `weekKwaliteitMinuten` uit `blok.ts`, en bleef de context vrij voor het ontwerp.
- **Draai het.** Lezen levert een vermoeden, meten levert bewijs. De zwaarste uitkomsten van de auditrondes waren stuk voor stuk weerleggingen van wat lezen suggereerde: `mesoFactor` bleek vermogen te schalen in plaats van duur, en een off-by-one was met lezen alleen niet zichtbaar. Bundelroute: esbuild, buiten de repo-tree, met `TZ=Europe/Amsterdam`.
- **De klok is een fixture-variabele.** Stub `Date`. Een test die op de echte klok leunt, meet iets anders dan je denkt. TWEEDE AANLEIDING: `debtOptIn.test.ts` draaide de VOLLEDIGE pijplijn en asserteerde een `catchup`-code in het actieve plan — groen, jarenlang, uitsluitend omdat de fixture-week in het verleden lag en `allocateQualityWeek_` zich op ambient `new Date()` dateert, waardoor er geen eligible dag was en de hele week-allocator inert bleef. Een fixture-datum in het verleden zet dus stilzwijgend een hele laag uit; met de klok gepind ín de fixture-week levert dezelfde run nul catchup-codes.
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
  HET FILTER VRAAGT DE VOLLE 40-TEKEN-SHA. Een korte hash matcht niet en geeft `total_count` 0 —
  geen foutmelding, gewoon een lege lijst. En die nul is NIET te onderscheiden van "de run is nog
  niet gestart", dus je rapporteert "CI nog bezig" terwijl er een groene run staat en je hebt geen
  enkel signaal dat je het mis hebt. Dat is dezelfde vorm als de regel zelf: een controle die per
  constructie scheef kan lopen, controleert niets. Draai `git rev-parse HEAD` en filter daarop;
  leest het antwoord 0, behandel dat dan als "nog niet vastgesteld" en nooit als een uitslag.
  Aanleiding: de close-out van punt 15 fase 3c, waar de korte hash 0 gaf en de volle SHA één run.
  Kwam binnen als CC-afwijking.
- **Meet beide kanten in dezelfde eenheid, en bewaar de termen.** Een vergelijking die
  voorgeschreven grootheden van gemeten grootheden aftrekt oogt geldig en is het niet:
  `zoneDebt_` trekt voorgeschreven intent-minuten af van gemeten zonetijd, wat bij een volledig
  gemiste dag onzichtbaar blijft (actual = 0) maar over een blok systematisch scheefloopt. En een
  saldo verbergt zijn termen: vier gemiste plus vier dubbel gereden kwaliteitsdagen leveren exact
  hetzelfde getal als een perfect uitgevoerd blok. Retourneer gevraagd en geleverd apart.
- **Getest is niet aangesloten.** Een functie die geëxporteerd en in isolatie getest is maar nergens wordt aangeroepen, faalt nergens: de tests zijn groen, de gate is groen, en de app doet het niet. Dezelfde vorm als de enumeratie-les — intern consistent, alleen niet verbonden met wat de app doet. Bij elke nieuwe geëxporteerde functie hoort daarom een expliciete grep naar de AANROEP, en het CC-rapport noemt de call-site. Kostte een halve ronde bij 5b-ii: `testResultaat` was compleet gebouwd en getest en hing nergens.
- **Scheid BELEIDSwaarden van GEIJKTE drempels.** Het plateau-criterium geldt voor een grens die een SIGNAAL bemonstert, niet voor een getal dat een voorkeur uitdrukt. "Hoe vaak wil ik testen" valt niet te ijken op een reeks; daar is de bron een besluit van Daan. Label zo'n constante in de code expliciet als beleid, anders gaat een volgende chat 'm op data zoeken die het antwoord niet bevat.
- **IJk een simulatie op een gemeten eindwaarde vóór je hem gebruikt.** Een model dat op een engine-eigen schatting leunt, erft de fout van die schatting en oogt intern consistent. De CTL-simulatie naar AGR leunde op `tssFromZoneMinutes_` en kwam uit op "negen uur per week nodig om het niveau te houden" — een zware conclusie die niet hield. De weging bleek kwaliteitswerk 30 tot 52 procent te laag te begroten; pas toen het model tegen een ONAFHANKELIJK gemeten eindwaarde werd gehouden (de werkelijke week reproduceert de gemeten CTL van 45,7) kwam dat boven. Die validatiestap hoort VOORAF, niet als controle achteraf: zonder ijkpunt meet een simulatie zijn eigen aannames.
- **IJk niet op gedrag dat je wilt vervangen.** Een drempel die een SIGNAAL bemonstert hoort op de echte reeks; een regel die een BEDOELING uitdrukt niet. Gedragsdata van vóór het mechanisme is een verslag van de OUDE GEWOONTE, dus een regel die daarop fit reproduceert die gewoonte en noemt hem vervolgens een norm. Er ontbreekt bovendien per constructie een tegenvoorbeeld: dezelfde omstandigheid is nooit met een andere invulling doorlopen, dus over wat BETER werkt zegt de reeks niets. Aanleiding: de selectieregel voor een lange dag stond in `docs/STAP7-BOUW12-RECON.md` §9 punt 4 toegewezen aan de D1-meting, terwijl Daan vóór Cadans op gevoel trainde — deels groepsritten en een evenement. Zelfde categorie als de testfrequentie: dat is coach-canon, geen geijkte drempel. Wat zulke data WEL levert is een BOVENGRENS-CHECK: wat aantoonbaar verteerd is, mag een voorstel niet onderschrijden. TWEEDE KEER: bij de zone-munt gebruikte de chat Daans 46 gemeten weken om te beslissen wélke zone een week mag laten zakken — "Z3 struikelt nooit als enige, dus laat die poort weg". Die weken zijn een verslag van rijden op gevoel, grijs en drempelarm; een poort die daarop past reproduceert precies de gewoonte die de coach vervangt. De norm hoort uit het PLAN te komen (de bibliotheek-signatuur), en de reeks levert hoogstens een BOVENGRENS-check.
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
- **Een onbeslisbaar deel van een meting is pas een probleem als het OORDEEL eraan hangt.** Toets dat vóór je machinerie voorstelt om de onbeslisbaarheid weg te nemen — anders bouw je een oplossing voor een gat dat de beslissing niet raakt. Aanleiding: de sweet-spot-overlay loopt van 84 tot 97 procent en dus dwars over de Z3/Z4-grens op 90, en intervals levert die splitsing niet. Er lagen drie routes op tafel om dat exact te maken: custom zones, de zone-grenzen verzetten, of ritstreams ophalen. Daan wees ze alle drie af met de vraag waarom de zones van intervals niet gewoon volstonden, en hij had gelijk. Zodra gevraagd en geleverd PER ZONE naast elkaar staan in plaats van op één hoop, verschijnt grijs rijden als een Z3-overschot mét een Z4-tekort — gemeten 26 tegen 74 procent gevraagd tegenover 54 tegen 46 geleverd — en is de splitsing binnen Z3 voor het oordeel niet nodig. De onbeslisbaarheid was echt; ze was alleen niet dragend.
- **Rond ÉÉN keer af, op de grootheid die je rapporteert, en tel nooit afgeronde waarden op.** Een spec die per deel afrondt en de delen daarna optelt, produceert een getal dat nergens uit volgt en maakt een CORRECTE meting rood. De engine draagt de regel al bij `tssFromBlokken_` ("rondt EEN keer aan het eind, nooit per blok"); een spec hoort hem niet te schenden. De reparatie zit in de VORM, niet in het getal: de rekenlaag geeft onafgerond terug, assertie's toetsen onafgerond met tolerantie, en afronden is presentatie. Aanleiding: de ijk-waarde voor anaeroob stond in het fase-1a-prompt op 156 (129 + 27 + 0, per zone afgerond) terwijl de vouwing 156,6000 geeft en dus 157. CC stopte terecht vóór de commit, stelde de assertie NIET bij, en ving dezelfde fout in zijn eigen test (567 + 157 = 724 tegen een Z4+-totaal van 723). Zelfde familie als de `head_sha`-regel bij CI: een controle die per constructie scheef kan lopen, controleert niets. TWEEDE AANLEIDING, en die staat op de WEERGAVE: `expandArchetype_` (`planner.ts:1383`) telt `warm + cool + mainMin` op uit blokken die elk al op één decimaal zijn afgerond, en `WorkoutDetail.tsx:57` rendert `totaalMin` kaal — op Daans scherm staat "59.800000000000004 min". De regel geldt dus aan BEIDE uiteinden: de rekenlaag telt geen afgeronde delen op, en de renderrand rondt één keer af. De reparatie hoort daarom in de FORMATTER en niet in `expandArchetype_` — een ronding in de rekenlaag zou elke vingerafdruk laten bewegen. Staat als ROADMAP-punt 18.
- **Elk getal in een voorstel draagt zijn HERKOMST in één woord.** PLAN (bibliotheek of coach-canon), SIGNAAL (op de echte reeks geijkt, met plateau) of BELEID (een besluit van Daan). Een voorstel zonder die labels is niet reviewbaar: de lezer kan niet zien of een getal geijkt hoort te worden of juist niet. Getallen uit de eigen historie mogen alleen als bovengrens-check optreden, nooit als grond voor een regel. Aanleiding: de per-zone-norm werd als PLAN afgeleid maar de POORT-keuze eromheen sloop als SIGNAAL naar binnen, en dat viel pas op toen Daan het opmerkte.
- **Citeer een meting met het predicaat dat gemeten is.** "Nul weken struikelen ALLEEN op Z3" is niet "Z3 bindt nooit" en al helemaal niet "de Z3-poort is decoratie" — elke herformulering liet een kwalificatie vallen tot de claim onwaar was. Gemeten was 12 van de 46 weken onder de Z3-norm, nooit als enige. Verandert de formulering, dan is de claim niet meer gedekt door de meting; herhaal het predicaat letterlijk of meet opnieuw.
- **Een fixture die een POORT passeert om iets anders te kunnen meten, asserteert die passage.** Anders gaat de test stil dood zodra de poort verschuift: hij blijft groen en meet niets meer. Zelfde familie als "getest is niet aangesloten". Aanleiding: drie fixtures voedden alles in Z4 en moesten voor de per-zone-munt de vorm van de norm gaan dragen; verzet de zone-sync straks de grenzen, dan zakken ze onder norm en verdwijnt de effect-poort uit beeld zonder dat er iets rood wordt.
- **Een gepind document bewijst zijn eigen GELDIGHEID niet.** Toets vóór je op een document
  stuurt of het nog leeft — een commit-hash garandeert dat je leest wat er stond, niet dat
  het nog geldt. Aanleiding, TWEE KEER in één chat en in beide richtingen. Eerst zette de
  FOCUS de zone-sync neer als iets dat "de signatuur en dus de normen verplaatst", terwijl
  `zone5Grenzen` de eerste vier waarden uit `power_zones` neemt en die bij Daan
  [55, 75, 90, 105] zijn — exact `ZONE5_GRENZEN_DEFAULT`, dus per constructie
  gedragsneutraal. Daarna verhief de chat `docs/R4-CUTOVER-VERDICT.md` tot stip aan de
  horizon terwijl de cutover al geweest was; één grep gaf het antwoord dat vooraf gedaan had
  moeten worden: `cutover` komt NUL keer voor in `CLAUDE.md`, `ROADMAP.md`, `WERKWIJZE.md`
  en `DOELEN-SPEC.md`. De R-serie is historisch. Een document dat de levende documenten niet
  meer noemen, stuurt niets.
- **Een pad kan dood zijn aan zijn INVOER of aan zijn UITVOER, niet alleen doordat niemand het aanroept.** "Getest is niet aangesloten" dekt maar één van de drie. Een functie kan keurig aangeroepen én getest zijn terwijl de aanroeper er een vaste `null` in stopt, en een waarde kan correct berekend en in een view-model gezet worden terwijl geen enkele component hem leest. In beide gevallen faalt er niets: de grep naar de aanroep slaagt, de tests zijn groen, en de app doet het niet. Controleer daarom BEIDE uiteinden — wat geeft de aanroeper mee, en wie leest de uitkomst — en niet alleen of de verbinding bestaat. Aanleiding, twee kanten in één ronde: `coachIntentFromZones_` is aangeroepen en getest, maar `coachPlannedArg_` geeft er `segmenten: null` in mee, waardoor de hele zone-afleiding van de geplande prikkel dood is en een chat-diagnose op de verkeerde plek landde; en `adapt` wordt bij een gemiste sleutelsessie berekend en op twee plekken in het view-model gezet zonder ook maar één lezer, waardoor de fix live alleen de copy omzette en niet het voorstel. Die tweede kwam binnen als CC-vondst bij de prod-verificatie.
- **Een test die de UITKOMST van een pijplijn met de hand injecteert, toetst die pijplijn niet.** Zet je de waarde waarop de code beslist rechtstreeks in een nagebouwd invoer-object, dan bewijst groen alleen dat de CONSUMENT werkt — nooit dat de PRODUCENT hem ooit levert. Bij een test die op een geproduceerde waarde leunt hoort dus minstens één assertie die de producent zelf aanroept. Zelfde familie als "getest is niet aangesloten" en "een pad kan dood zijn aan zijn invoer of aan zijn uitvoer", nu op de TEST-kant. Aanleiding: `inhaal.test.ts` zet redenCode `catchup_high` met de hand in een nagebouwde `ProposalWeek` en is altijd groen geweest, terwijl de pijplijn die code in Base, Build en Peak per constructie niet kan produceren — gemeten over 48 combinaties, nul codes.
- **Een dood mechanisme toets je op zijn UITKOMST, niet alleen op zijn bereikbaarheid.** "Deze tak kan niet vuren" is een diagnose, geen verdict: hij zegt wat er niet gebeurt, niet of het gebeuren MOET. Zet de tak daarom kunstmatig aan en meet wat hij dan produceert — pas dat getal beslist tussen repareren en opruimen. Zonder die stap is de gemakkelijke conclusie altijd "bereikbaar maken", want een onbereikbare tak lijkt per definitie een gemis. Aanleiding: de week-inhaal-kaart had drie onafhankelijke redenen om niet te verschijnen, en die drie samen rechtvaardigden hooguit een reparatie. Wat de zaak besliste was de wat-als-run zelf: over 72 cellen leverde die in 60 MINDER high plus anaerobe intentminuten dan het plan dat er al stond, in 12 meer, in nul gelijk. Het mechanisme bood aan een gemiste intensiteitsprikkel in te halen met een lichtere week; bereikbaar maken had dat live gezet. Zelfde familie als "getest is niet aangesloten", maar een stap verder: daar was de vraag of het pad LOOPT, hier of het pad de goede kant OP loopt.
- **Een controle wordt getoetst tegen de payload uit HETZELFDE prompt.** Ging mis op 30 juli: een prompt vroeg te controleren dat het woord "sport-settings" nergens meer in een doc stond, terwijl de verbatim tekst in datzelfde prompt het woord twee keer bewust gebruikte — het afgewezen alternatief en de gemeten gelijkheid van de waarden. CC weigerde terecht de tekst aan te passen om de controle te laten slagen. Lees een acceptatie-eis na tegen wat je meestuurt vóór je hem verstuurt.
- **Vooruit-bedrading is dode code met een nettere naam.** Op 30 juli kreeg `dosisTredeVoorstel` een VERPLICHTE `grenzen`-parameter om dode invoer uit te sluiten. CC mat dat zijn uitvoer alleen de schaal draagt en geen zone-splitsing, dus de parameter kon de uitkomst per constructie niet beïnvloeden — een rood-test erop bestaat niet. Hij is er weer uit. Een verplichte parameter die de uitvoer niet kán raken is geen bescherming maar een belofte die de functie niet waarmaakt: wie de aanroep leest concludeert dat de functie zone-bewust is, en dat is ze niet.
- **Een instructie om iets te BEHOUDEN veronderstelt dat het er staat.** Controleer de vindplaats
  vóór je zo'n instructie meestuurt; anders krijgt de uitvoerder twee eisen die elkaar uitsluiten
  en valt het te behouden punt stilzwijgend weg. Zelfde familie als "een controle wordt getoetst
  tegen de payload uit hetzelfde prompt", maar een stap eerder: daar werd een eis niet tegen de
  MEEGESTUURDE tekst gelegd, hier een behoud-instructie niet tegen de BESTAANDE tekst. Aanleiding:
  het close-out-prompt van de pendel-fix zei "haal het PENDEL-BUG-item eruit, zet er niets voor in
  de plaats" én "laat het item over de gepland-noemer wel staan", terwijl dat item alleen bestond
  als kruisverwijzing bínnen het te verwijderen item. CC meldde het correct als afwijking. De chat
  had de parkeerlijst zelf al gelezen en had het dus kunnen weten.
- **Een 400-test muteer je ZONDER de status te raken.** Zet je de validatie uit om te bewijzen dat
  de test hem dekt, dan SCHADUWT de status-assertie de terugleescheck: de test faalt op
  200-tegen-400 en bereikt de terugleesregel nooit. Je hebt dan de statuscode getoetst en niet de
  schrijfkant — precies het gat dat de terugleescheck moest dichten. Mutateer in plaats daarvan de
  VOLGORDE: schrijf vóór de validatie, zodat de 400 netjes blijft en er tóch weggeschreven wordt.
  Dan vallen de terugleesasserties om en niets anders. Aanleiding: bij de event-overname-route
  vielen zo alle zes de terugleesasserties, de eerste op `event` = '17-04-2027' waar '2027-04-17'
  hoort. De eerste meting (validatie uit) leek genoeg en bewees niets. Kwam binnen als
  CC-afwijking en is strikt beter dan wat het prompt vroeg. Verwant aan "toets een afwijzing op
  zijn effect".
- **Een guard die op ÉÉN plek wordt toegevoegd, ontbreekt op de andere.** Zelfde familie als "een
  halve fix is een vindpatroon", nu op een GUARD in plaats van op een accumulatie: wie een
  voorwaarde toevoegt aan een afgeleide waarde, grept naar elke plek die diezelfde waarde afleidt.
  Aanleiding: in punt 9 fase A kreeg `faseOvergang.ts` de overlay-guard wel en `proposal.ts` niet,
  waardoor de periodiseringsbalk "Build" toonde bóven een kaart die "deze week Base" zei — twee
  uitspraken over dezelfde week op één scherm. 818 tests vonden het niet en de PNG wel. Het beeld
  blijft het controlemiddel op de tekst: een suite toetst wat je hebt bedacht te toetsen, een
  screenshot toont wat er staat.
- **Een nieuwe poort mag alleen liggen over wat hij BEDOELT te poorten.** Zet je een voorwaarde
  vóór een tak, ga dan langs élke waarde die door die tak loopt en vraag of het een KEUZE is. Wat
  geen keuze is maar een constatering, hoort er buiten. Aanleiding: de bevestigingspoort van de
  event-overname lag ook over `Recovery`, waardoor een afgewezen voorstel het herstel binnen de
  raceweek afnam — gemeten: het plan werd op "Build" gebouwd twee dagen na de A-race, terwijl het
  scherm "Recovery" toonde. Herstel en taper zijn constateringen over een rit die al gereden is,
  dezelfde categorie; die horen niet aan een bevestiging te hangen. De poort ging over de
  periodiserings-AS, en Recovery zit daar niet in.
- **De DEV-SERVER is ook een fixture-variabele bij een byte-vergelijking.** Zelfde familie als "het
  lokale beeld is niet het prod-beeld", maar een andere bron: daar draagt de D1 andere historie,
  hier is de APP zelf nog niet klaar. Een harness-run tegen een koude vite fotografeert een
  half-getransformeerde app, en dat lijkt op een verschil dat de bouw zou hebben veroorzaakt. Draai
  eerst een warmloop en GOOI DIE WEG; meet pas daarna. Aanleiding: de eerste nulmeting van punt 10
  fase A gaf 40 van de 40 shots "gewijzigd", met byte-sprongen van 142k naar 244k — volledig
  artefact. Overgedaan met een warmloop en de VOOR-staat via `git checkout <hash> --` op de
  gewijzigde componenten; toen bleven 48 van de 56 byte-identiek en bewogen alleen de acht shots
  van het scenario waar de kaart daadwerkelijk vuurt.
- **Een assertie die twee zinnen vergelijkt, veronderstelt dat ze dezelfde VORM hebben.** Toets die
  aanname vóór je de vergelijkingsoperator kiest. Aanleiding: de ΔCTL-clausule staat in
  `fatigueUpAanbodRegel` VOORAAN en in `fatigueDownAanbodRegel` MIDDEN in de zin, dus de gevraagde
  `endsWith`-vergelijking zou voor UP kloppen en voor DOWN een ONWARE gelijkheid beweren. Herschreven
  naar een vergelijking van het deel ná de clausule. Zelfde familie als "een controle wordt getoetst
  tegen de payload uit hetzelfde prompt", nu op code die de chat zelf al had gelezen. En er hoort een
  tweede helft bij: een vergelijking die twee kanten gelijk noemt, draagt óók een assertie dat ze
  daarbuiten VERSCHILLEN — anders slaagt hij ook als beide kanten leeg of identiek zijn.
- **Een grep die het EIGEN bestand uitfiltert, kan de aanroeper BINNEN dat bestand niet zien.** Wie
  vraagt "is dit aangesloten", sluit de eigen module niet uit. Aanleiding: een bouwdoc stelde als
  premisse dat `planZone5_` NUL aanroepers had buiten zijn eigen test, terwijl `bibliotheekSignatuur`
  hem in DEZELFDE module aanroept (`zonemunt.ts:199`) en via `blokDosisNorm` (`blok.ts:184`) gewoon
  live draait. CC ving het als premissecontrole vóór de bouw en stopte; de eis in het doc was
  daarna te herformuleren naar wat wél ontbrak — een aanroeper die de plan-kant PER DAG uitrekent.
  Zelfde familie als "getest is niet aangesloten", nu op de MEETMETHODE in plaats van op de code.
- **Een proportionele splitsing produceert zones die het plan nooit VOORSCHREEF.** Een blok waarvan
  de band over een zonegrens loopt laat aan de andere kant minuten vallen; die zien eruit als een
  tekort en zijn BANDOVERLOOP. Poort op het NOMINALE label dat het blok al draagt — niet op een
  minuten-drempel, want dan zet je een willekeurige constante op een artefact en weer je meteen ook
  echte kleine tekorten. Aanleiding: de weekstem meldde "1 Tempo-minuut" in een week waarin geen
  enkel blok tempo als label droeg; met de label-poort verdween die regel en bleef "21
  Drempel-minuten" staan.
- **Meet de VOOR-staat alleen vanaf een SCHONE werkboom.** `git checkout <hash> -- <bestanden>`
  gooit ongecommit werk in die bestanden weg. Aanleiding: bij punt 10 fase B verdween zo de nog
  niet gecommitte bouw en moesten zes bestanden opnieuw bewerkt worden. Aanvulling op de
  warmloop-regel: eerst COMMITTEN of stashen, dan pas de voor/na-meting draaien.
- **Twee kaarten die hetzelfde signaal lezen, toets je op wat ze SAMEN op één scherm zeggen.** Beide
  waren apart correct en apart getest; het defect bestond alleen in het PAAR. Het werd pas beslisbaar
  toen de twee zinnen naast elkaar stonden: de terugblik zei "je trainde dit blok genoeg, maar niet
  waar het telt" en de doortrain-kaart "het blok heeft je niet belast", uit hetzelfde getal.
  Zelfde familie als "een halve fix is een vindpatroon" — daar mist een reparatie een plek, hier
  mist een TOETS de combinatie. Vraag bij elke tweede lezer van een signaal: wanneer staan ze samen
  op het scherm, en wat lezen ze dan naast elkaar?
- **Een rood-patch die niets RAAKT, leest als een niet-gedekte term.** Bij punt 14 fase 1b bleef de
  suite groen toen de terugval-term rood gezet werd, en dat zou "term 2 is nergens gedekt — stoppen
  en melden" hebben betekend. De patch had alleen niets veranderd: de formatter had de regel na de
  bouw op één lijn gevouwen, dus het anker matchte niet en de vervanging was stil een no-op. Grep na
  elke rood-patch op de eigen markering vóór je de uitslag leest. Met het echte anker viel de test
  meteen: `['tempo','drempel']` tegen `['drempel']`. Zelfde familie als de inerte assertie — daar is
  de TOETS leeg, hier de INGREEP.
- **Meet nooit voor/na op een bak waar de app zelf in schrijft, zonder eerst te toetsen of hij
  aangroeit.** De shot-harness reset `weekplans` niet, en `persistWeekplan` schrijft de bekeken week
  fire-and-forget weg — dus de VOOR-run zet rijen klaar waar de NA-run van profiteert, en het
  verschil is deels je eigen meting. Draai de voor-staat twee keer op een verzadigde bak en toets op
  gelijkheid: hier gaf dat 64 van 64 byte-identiek, waarmee het verschil van 0 van 64 aan de code
  toeviel en niet aan de aanwas. Zelfde familie als de warmloop-regel: eerst het INSTRUMENT ijken.
- **Een bewaarde rij is niet hetzelfde als de PERIODE die hij heet te dekken.** Meet niet alleen OF
  de data er staat, maar ook WELK DEEL van de periode ze beslaat, en toets dat de afgeleide dezelfde
  SPAN heeft als de grootheid waartegen hij wordt gelegd. Aanleiding: punt 14 fase 1b leidde de
  zone-poort af uit weekplan-rijen die lokaal maar één trainingsdag droegen, waardoor het
  blok-oordeel op één zone kwam te rusten. Op prod bleek de rij wél de hele week te dekken (4
  entries tegenover 4 trainbare planner-dagen, tot en met zaterdag) — de lokale rijen waren een
  harness-artefact. Twee gevolgen: de span-toets hoort bij de recon, en zulke vragen meet je op de
  bak waar de data echt ontstaat.
- **Een harness die zelf schrijft, verzadigt zijn eigen invoer.** De voor-run zet rijen klaar waar
  de na-run van profiteert, dus meet beide kanten op een verzadigde bak en ijk het instrument eerst
  op twee gelijke runs. Aanleiding: dezelfde ronde, CC-vondst — twee runs van a2e1a93 gaven 64 van
  64 identiek, en pas daarmee was het verschil toe te schrijven aan de code. Een tweede controle die
  gratis meekomt: shots waarin niets hoort te veranderen MOETEN byte-identiek blijven; bewegen ze
  mee, dan meet je drift.
- **Een POORT die bepaalt WAAROP geoordeeld wordt kan het oordeel OMKEREN, niet alleen afzwakken.**
  Poort je per ongeluk alleen de zone met het OVERSCHOT, dan leest een tekort als geleverd. Toets een
  nieuwe poort daarom altijd op het geval waarin hij te SMAL uitvalt, niet alleen op het geval
  waarin hij te breed was — dat laatste was de aanleiding, en juist daardoor kijk je de andere kant
  niet op. En: bewijs voor een poort mag niet uit de minst REPRESENTATIEVE periode komen; een
  deloadweek draagt kortere sessies met andere nominale labels. Aanleiding: punt 14 fase 1b/1c liet
  de deloadweek als enige bron de blokpoort bepalen, waardoor Daans grijs-gereden blok als geleverd
  las (tempo 58, 68 en 67 tegen norm 24, drempel 37, 21 en 35 tegen 47) en de app een
  dosisverhoging voorstelde. Volgt hieruit: leg naast elke poort de minimum-bewijslast die het
  OORDEEL al draagt, zodat poort en oordeel dezelfde span hebben.
- **Een term kan GEMASKEERD zijn door een andere term in plaats van ongedekt.** Wordt een rood-toets
  nergens rood, stel dan eerst vast of een TWEEDE voorwaarde het geval al afvangt vóór je
  concludeert dat de term niet gedekt is. Zet die voorwaarde opzij en meet de term LOS. Zelfde
  familie als "landt een fix op N plekken, dan moet de rood-test per plek rood zijn", nu tussen twee
  termen binnen dezelfde functie. Aanleiding: bij punt 14 fase 1d bleef de deload-term rood-loos
  omdat de bewijslast-drempel bij één bewaarde week de poort al blokkeert; met twee opbouwweken viel
  hij direct, op `['tempo','drempel']` tegen `['drempel']`.
- **Een test die de OUDE regel vastpint moet mee wanneer die regel valt.** Dat is geen verzwakking
  maar de herijking die erbij hoort — de regel is vervangen, dus de test die hem vastlegde is
  vervallen. Onderscheid hem scherp van een assertie die een MECHANISME toetst: die wordt NOOIT
  bijgesteld om groen te worden, en een test aanpassen omdat hij faalt is en blijft verboden. De
  vraag is dus niet "faalt hij" maar "pint hij een regel vast die we net expliciet hebben
  ingetrokken". Aanleiding: test F codeerde "één bewaarde week draagt het hele blok", precies wat
  fase 1d afschaft en wat test M sindsdien verbiedt; F is herijkt op twee opbouwweken en behield
  zijn eigenlijke doel — een week zonder eigen plan erft de blokpoort.
- **Een gewicht dat SORTEERT is geen gewicht dat VERDEELT.** Lees af welk mechanisme een getal
  consumeert vóór je zijn bedoeling uit het getal afleidt. Een score die alleen een rangorde bepaalt
  draagt geen quotum, hoe proportioneel hij er ook uitziet. Aanleiding: `intentGewichten.vo2` 0,20
  op `PROFILES.onderhoud` las als "ruwweg een prikkel per twee weken", terwijl `goalEffWeights_`
  niet normaliseert en `goalPickIntent_` uitsluitend sorteert — in Base scoort die term 0,10 tegen
  sweetspot 0,600 en drempel 0,550, en er bestaat geen enkele plek die gewichten als proportie
  uitdeelt.
- **Toets een "per constructie onbereikbaar" op de ruimte waarin de app WERKT, niet op de as waarop
  je hem vond.** Een uitputtende sweep is alleen uitputtend over zijn eigen assen: houdt hij per cel
  één dagduur en één dekkingstoestand vast, dan kan hij het geval waarin de rangorde BINNEN de week
  verschuift niet bevatten, en leest zijn nul als een structurele onmogelijkheid. Zelfde familie als
  "enumereer met de functie die de app zelf aanroept", nu op de vorm van de MEETRUIMTE. Aanleiding:
  M1 van punt 14 mat 0 van 10800 combinaties met drie kwaliteitssoorten; via `buildWeekProposal` met
  ongelijke dagduren binnen één week levert Onderhoud in Peak wél drempel, sweetspot en vo2 — het
  haalbaarheidsfilter weert vo2 van de lange dag en de coverage-boost wisselt van kant zodra high
  gedekt is.
- **Een VLOER is geen DOEL — kies de plek van een test nooit om een getal stabiel te houden.** De
  vloeren in `HANDOFF.md` mogen meestijgen; dat staat al in de gate-paragraaf, en ze zijn er om
  REGRESSIE te betrappen, niet om nagestreefd te worden. Kies de plek van een assertie op wat ze
  NODIG heeft. Aanleiding: de bouwer-assertie van punt 15 fase 1 landde in
  `apps/web/src/lib/punt15.test.ts` en dat is JUIST, maar de opgegeven reden was dat de
  engine-assert-count dan op 1449 blijft. De DRAGENDE reden is een andere en is dwingend: die
  assertie vouwt met `planZone5_`, en die woont in `apps/web/src/lib/zonemunt.ts`, waar
  `packages/engine` per constructie niet uit kan importeren. Een goede uitkomst op een verkeerde
  grond wordt een volgende keer op de verkeerde grond herhaald.
- **Een poort die bepaalt WAAROP geoordeeld wordt, laat de norm-massa van alles daarbuiten
  VERDAMPEN.** Poort de VORM van een eis, nooit stilzwijgend ook het TOTAAL — anders zakt de lat mee
  met de poort en merkt niemand het. Aanleiding: punt 14 fase 1 besliste terecht wélke zones
  meedoen, maar in 98 van de 105 gemeten cellen lag de som van de zone-normen BINNEN die poortset
  onder de totaalnorm, en 24 cellen lazen GELEVERD terwijl de week onder zijn eigen norm zat —
  scherpst Korte beklimmingen in Peak, effectieve eis 34 tegen een norm van 78. De reparatie is een
  TWEEDE, onafhankelijke eis naast de poort, niet een aanpassing ván de poort.
  EN DE VOOR DE HAND LIGGENDE REPARATIE IS HIER GEMETEN EN FOUT: de norm-massa herverdelen over de
  poortset zakte van 92 naar 46 geleverde cellen en trok Onderhoud van 27 van 27 naar 18 van 27 —
  precies het defect dat punt 14 net had weggenomen. De reden is structureel: de poortset draagt
  NOMINALE labels terwijl de meting PROPORTIONEEL splitst, dus de hele norm bij één label leggen
  eist minuten in een zone waar het plan ze door bandoverloop niet legt. Minuten TELLEN lijdt daar
  niet aan; norm bij een LABEL leggen wel.
- **De shot-harness zaait alleen de PLAN-kant.** De GELEVERDE kant komt uit de activiteiten in de
  lokale D1, en daar bestaat geen API-schrijfroute voor: de enige write is `/sync/activities`, en
  die trekt van Intervals. Elk kaart-element waarvan de conditie een TEKORT aan de GELEVERDE kant
  vereist, is dus per constructie niet te fotograferen. Vraag er geen shot voor; zeg meteen wat
  Daan moet openen, op welk scherm en waar hij naar kijkt. Aanleiding: `totaalOpNorm` uit punt 15
  fase 2 komt in 0 van de 72 shots voor. Het Peak-scenario voor Korte beklimmingen is gebouwd en na
  meting weer weggehaald — Daans echte ritten leveren in dat blok 118 werkminuten tegen een
  Peak-norm van circa 53, dus zones én totaal ruim gehaald.
  DE EIGENLIJKE LES ZIT IN DE TWEEDE HELFT: dit is een grens op de ACCEPTATIE-EIS, niet op de bouw.
  Zelfde familie als "een acceptatie-eis toetst alleen wat de ingreep kán raken", nu op het
  MEETINSTRUMENT in plaats van op de ingreep. De ontbrekende schrijfroute stond al in `HANDOFF.md`;
  de eis had daartegen gelegd moeten worden vóór hij verstuurd werd.
- **Een acceptatie-getal hoort bij het ONTWERP waarop het gemeten is.** Verandert het mechanisme
  tussen wat-als en bouw, dan vervalt elk getal uit die wat-als als EIS, en moet de rood-meting op
  het NIEUWE mechanisme opnieuw geformuleerd worden. Aanleiding: het rem-bewijs "105 gevraagd geeft
  109,5 en op trede 4 120,0" kwam uit een wat-als waarin `fixed` met f meegroeide; het gebouwde
  ontwerp ankert `totaalMin` op `fixedNominal` en kan de opgegeven dag per constructie niet
  overschrijden, dus die meting KON niet reproduceren. Het juiste bewijs is een ander: zonder rem
  zakt de Z2-basis van 30 naar 25,5, en op trede 4 naar 15. Zelfde familie als "een controle wordt
  getoetst tegen de payload uit hetzelfde prompt", nu één stap wijder — niet tegen de meegestuurde
  TEKST maar tegen het meegestuurde ONTWERP.
- **Een eis dat een SUITE onaangeraakt blijft, toets je tegen de grootheid die je verandert.** Grep
  die suite op die grootheid vóór je hem onaanraakbaar verklaart; anders geef je twee eisen die
  elkaar uitsluiten. Aanleiding: `onderhoudInvariance.test.ts` moest onaangeraakt ÉN groen blijven,
  terwijl chat-zijde al gemeten was dat de TSS van deze sessie met 2, 4 en 8 verschuift — en die
  vingerafdruk draagt `tss`. De herijking was juist, en is zelf een BEGRENZINGSBEWIJS: 16 van de 48
  cellen bewegen, uitsluitend op `tss`, terwijl `vt`, `naam`, `min`, `zones`, `macroFase` en
  `mesoWeek` alle 48 keer identiek staan. Zelfde familie als "een instructie om iets te BEHOUDEN
  veronderstelt dat het er staat", nu op een testsuite in plaats van op een docregel.
- **Een byte-vergelijking tegen PROD draagt een KLOK.** De shots tonen "Laatst gesynct · <tijd>",
  dus twee runs op verschillende minuten verschillen per constructie. GEMETEN bij de deploy van
  punt 15: 1 van de 8 shots byte-identiek, en de zeven andere verschilden UITSLUITEND op 11:39
  tegen 11:44. Lees zo'n uitslag dus niet als "zeven shots bewogen", maar stel eerst vast WAAROP ze
  bewegen — een verschil dat volledig in een tijdstempel zit, is juist het bewijs dat er niets
  anders bewoog. Zelfde familie als de warmloop-regel en de verzadigde-bak-regel: het instrument
  draagt een variabele die niets met de code te maken heeft.
- **Een uitspraak over WAT DE GEBRUIKER MERKT die op ÉÉN cel gemeten is, mag niet als algemene
  uitspraak in een bouwdoc landen.** Zelfde familie als "citeer een meting met het predicaat dat
  gemeten is", een stap verder: hier viel geen kwalificatie weg, maar werd een uitspraak over een
  ENKELE cel gelezen als uitspraak over de hele meetruimte. Aanleiding: het bouwdoc van het
  Peak-quotum zei dat het oordeel bij Daan niet kantelt — waar voor zijn weekvorm — terwijl over
  negen weekvormen er drie naar niet-geleverd kantelen en twee de andere kant op. Die negen cellen
  waren al gemeten. EN DE TWEEDE HELFT: een kanteling citeer je met BEIDE richtingen, anders leest
  een netto-verschuiving als een eenzijdige verslechtering — FTP ging van 3 van 9 naar 2 van 9,
  maar Korte beklimmingen van 2 van 9 naar 4 van 9 met nul cellen de verkeerde kant op.
- **Het mechanisme dat een SLOT OPENT is niet het mechanisme dat het VULT.** Stel bij een wat-als
  vast welke ingreep het waargenomen gevolg werkelijk VEROORZAAKT, vóór je de ingreep afwijst.
  Aanleiding: quotum 3 haalde bij `klim_lang` in 8 van de 9 weekvormen anaeroob werk binnen dat
  `DOELEN-SPEC` §3.4 niet wil — maar in BUILD levert datzelfde quotum daar 0 anaerobe minuten in 9
  van de 9. De oorzaak is `GOAL_FASE_MOD_.Peak` (vo2 +0,15, sweetspot -0,10), niet het quotum.
  Zelfde familie als "een acceptatie-eis toetst alleen wat de ingreep kán raken".

- **Een SCHRIJFPAD controleer je aan BEIDE uiteinden, net als een leespad.** Een route-guard die
  een afwezige sleutel netjes overslaat zegt NIETS over wat de laag erachter met de rij doet.
  Aanleiding: het bouwdoc van de niveaukaart beloofde in §2.3 dat de bewaarde `doelDuur` blijft
  staan en schreef in §3 voor om het veld uit `NUM_KEYS` te halen. De chat had `api.ts:775`
  (`if ("doelDuur" in body)`) gelezen en was daar gestopt, terwijl `writeSettings`
  (`workers/api/src/db/repo.ts:56`) FULL-REPLACE is met `doelDuur: s.doelDuur ?? null` binnen één
  `onConflictDoUpdate` — de eerstvolgende opslag vanuit Instellingen had de kolom op NULL gezet.
  Bovendien is `SettingsForm` een mapped type over de DTO, dus het had niet eens gecompileerd. CC
  ving beide vóór de bouw en stopte. Zelfde familie als "een pad kan dood zijn aan zijn INVOER of
  aan zijn UITVOER", nu op een SCHRIJFpad.
- **Een grep-EIS toets je tegen de echte trefferverdeling vóór je hem verstuurt.** "Nul treffers"
  is een controle die per constructie kan falen op treffers die er HOREN te staan, en dan stopt de
  uitvoerder terecht op een eis die zelf niet klopte. Aanleiding: dezelfde ronde eiste nul
  treffers op `doelDuur` in `apps/web/src` en `packages/engine/src`, terwijl er 32 stonden in 24
  bestanden waarvan 23 `SettingsInput`-fixtures die de sleutel moeten dragen zolang het DTO-veld
  bestaat. De bereikbare eis was nul op DRIE genoemde bestanden; daar stonden er zes. Zelfde
  familie als "een controle wordt getoetst tegen de payload uit hetzelfde prompt".
- **Een render-conditie die op een BROWSER-DEFAULT leunt, verliest van een inline stijl op
  hetzelfde element.** `hidden={!open}` werkt via de UA-regel `[hidden] { display: none }`, en die
  wordt verslagen door élke expliciete `display`. Aanleiding: het aannames-paneel in
  `DoelProjectie.tsx` droeg `hidden={!assumOpen}` naast een inline `display: "flex"` en stond
  daardoor PERMANENT open, terwijl knop, label en pijl wél kantelden — de toestand was dus zichtbaar
  correct en het paneel niet. Het broertje `WorkoutDetail.tsx:158` draagt geen inline `display` en
  is per constructie in orde; de vindpatroon-toets gaf één treffer, niet twee. EN DE VINDPLAATS IS
  DE EIGENLIJKE LES: 897 tests en 8 prod-shots lieten dit staan, want `apps/web` heeft geen
  render-testinfrastructuur en de shot-harness laadt uitsluitend `/schema`. Daans oog was het enige
  instrument dat erbij kon. Zelfde familie als "het beeld blijft het controlemiddel op de tekst",
  nu op een scherm waar geen camera staat.
- **Een tekort dat op ELKE trede blijft bestaan is geen DOSIS-vraag.** Draai een dosis-hendel tot
  zijn eind en leg plan en norm er samen naast vóór je een dosis-ingreep specificeert. Sluit het
  gat, dan was het dosis; blijft het staan of GROEIT het, dan zit het defect in het PAAR norm-en-plan
  en bouwt een dosis-ingreep aan de verkeerde kant. Aanleiding: punt 15 fase 3c stond gespecificeerd
  als "de dosis van de twee klim-doelen", terwijl de trede-sweep op weekvorm V1 in Build laat zien
  dat FTP zijn norm op trede 0, 2 en 4 haalt (95 tegen 84, 108,2 tegen 96, 121,4 tegen 108) en Korte
  beklimmingen van −9,5 naar −16,5 uit elkaar loopt. De norm stijgt 6 minuten per trede terwijl de
  efforts-arm na één stap tegen zijn ruimte-rem loopt.
- **Een trede-sweep vergelijkt plan en norm op DEZELFDE trede.** `blokDosisNorm` draagt de trede als
  parameter, dus een sweep die het plan opvoert en de norm op 0 laat staan meet twee verschillende
  meetlatten en leest een tekort als geleverd. Zelfde familie als "meet beide kanten in dezelfde
  eenheid", nu op een PARAMETER in plaats van op een eenheid. Aanleiding: chat-zijde gaf een sweep
  eerst "79,6 tegen 78, geleverd" terwijl de norm op die trede 90 is en de cel dus onder norm ligt.
  Gevonden vóór het getal ergens landde, doordat de constante `DOSIS_TREDE_STAP_MIN` alsnog is
  opgezocht in plaats van aangenomen.
- **Een weekvorm uit de meetset is een VERGELIJKINGS-as, geen portret van de gebruiker.** Beantwoord
  een vraag over wat DAAN merkt nooit met de weekvorm die toevallig het scherpst meet; vraag zijn
  werkelijke beschikbaarheid. Aanleiding: "wat gebeurt er als ik dit doel nu instel" werd beantwoord
  op V4 met een zaterdag van 240, terwijl zijn zaterdag 120 is. Dat verschil is niet cosmetisch: ma45
  di60 do60 za120 is 4,75 uur en levert `urenPrikkels` 2 met norm 52, dus GELEVERD bij alle drie de
  doelen, terwijl exact 5,0 uur `urenPrikkels` 3 met norm 78 geeft en hetzelfde plan van 68,5 onder
  norm leest. Zelfde familie als "een fixture die leeg gevoed wordt voorspelt de app niet", nu op de
  INVOER-vorm in plaats van op de invoer-inhoud.
- **Een rood-meting in de selftest hoort PER ASSERTIE, niet per `it`.** `assert_` breekt de test af
  bij de eerste val, dus elke term die verderop in dezelfde `it` staat wordt door de eerste
  gemaskeerd en lijkt ongedekt. Meet die term LOS, met alleen zijn eigen patch. Zelfde familie als
  "een term kan GEMASKEERD zijn door een andere term", nu op het TEST-HARNAS in plaats van op de
  code. Aanleiding: bij punt 15 fase 3c leek T3 niet gedekt omdat R1 alleen T2 liet vallen; los
  gemeten stond er zonder poort 105 minuten op een dag van 104.
- **Een bestaans-grep mag niet getrunceerd worden, en een venster is geen bestand.** `head -n`
  achter een grep met MEERDERE patronen kan alle treffers van één patroon opeten en levert dan een
  ONWARE afwezigheid; en een gelezen fragment draagt geen uitspraak over het hele bestand. Tel
  eerst over álle treffers, lees daarna pas. Aanleiding, twee keer in één chat: de chat
  concludeerde dat "Merckx" nergens in de gecommitte repo stond en dus lokaal-ongecommit moest
  zijn, terwijl het een coach-preset is op `apps/web/src/pages/Instellingen.tsx:178` met negen
  treffers in acht bestanden, inclusief een eigen recon-doc; en de chat verklaarde
  `redenCode.test.ts` groen op grond van ÉÉN gelezen fixture, terwijl drie andere weekend-fixtures
  op een dag van 60 stonden en wél omvielen. Zelfde familie als "een grep die het eigen bestand
  uitfiltert, kan de aanroeper binnen dat bestand niet zien".
- **Opmaak hoort UITSLUITEND op tekst die een MENS leest.** Een waarde die door een PARSER gelezen
  wordt, blijft kaal. Drie plekken in deze repo waar dat dragend is: een CSS-waarde in een
  style-attribuut (een decimaal-formatter zet er "33,3%" neer en de balk klapt stil naar nul
  breedte), de push-DSL naar intervals.icu en Garmin, en `structuur[i][1]` — die cel wordt door
  `dslBlockFromRow_` geparseerd, dus een Nederlandse komma in de BRON laat die parse stilzwijgend
  terugvallen op één enkele lap. Het float-net kan de eerste soort per constructie niet zien, want
  `innerText` leest geen attributen. Vandaar de regel vooraf en niet de meting achteraf: opmaken
  gebeurt op de renderrand, en alleen daar waar een oog kijkt.
- **Het begrenzingsbewijs van de shot-harness gaat op de PNG's, NOOIT op de `.txt`.** Twee dingen in
  die tekstbestanden wisselen aantoonbaar tussen twee runs van dezelfde code: de teller
  `PUT /api/weekplan/<maandag>` (2 of 3) en de gepland-noemer (`/372` tegen `/379`, die uit de
  bewaarde weekplan-rijen komt). Een `.txt`-vergelijking leest dat als een wijziging en je gaat een
  defect zoeken dat er niet is. De PNG's zijn wél deterministisch; die dragen het bewijs.
- **`v7/09-vorm` en `v7/10-trainingen` zijn NIET byte-deterministisch.** Gemeten over meerdere
  runs van ONGEWIJZIGDE code, met telkens identieke `innerText` — het verschil is puur pixel.
  Sluit die twee uit van elke PNG-vergelijking zolang dat niet is opgelost, en zeg in het rapport
  dát je ze uitsluit. Vergelijk dus 77 en niet 79.
- **Geen treffer van het net is GEEN bewijs van afwezigheid.** Negen scenario's dekken een fractie
  van de weekruimte. De blokstructuur-ruis is 51 gevallen over 660 weken en kwam in GEEN ENKELE
  shot voor, terwijl hij aantoonbaar bestaat — hij zat achter een dichtgeklapt onderdeel en in
  weekvormen die de harness niet draait. Generaliseer nooit van de scenario's naar de code: het net
  bewijst een treffer, het bewijst geen schoonheid. Wat de hele code afdekt is een test bij de
  PRODUCENT, niet een steekproef bij de camera.
- **Een AANBOD erft de toestandsruimte van de POORT waaraan het hangt; enumereer die ruimte vóór
  je de actie ontwerpt.** Aanleiding: het aanbod "verschuif deze week de minuten naar Drempel" hing
  aan een weekstem die JUIST eist dat er geen dag meer staat die de prikkel kan dragen. Gemeten
  over 630 cellen: 75 van de 119 vuur-cellen hebben geen trainingsdag meer over, en in de andere
  44 draagt de restdag de tekortzone al — nul cellen waarin het aanbod iets toevoegt. Zelfde
  familie als "een acceptatie-eis toetst alleen wat de ingreep kán raken", nu op een heel
  MECHANISME: het slot bepaalt wat er nog te vullen valt.
- **Een classificatie met een SUBSTRING-terugval geeft ALTIJD een antwoord en meldt dus nooit dat
  ze het niet weet.** Toets zo'n classifier tegen een ONAFHANKELIJKE eigenschap, over álle waarden
  die de producent kan opleveren. Aanleiding: `intentFromType_` valt door naar `indexOf("long")` en
  noemt `combo_long_with_efforts` "duur", terwijl die sessie 30,0 tot 32,4 werkminuten met het
  nominale label `drempel` draagt — één treffer op zes types. EN HET SNIJDT BEIDE KANTEN OP: poort
  1 en poort 2 lezen dezelfde classifier, dus één fout label levert tegelijk een onterecht "je hebt
  niets gemist" en een onterecht "er staat niets meer". Zelfde familie als "een halve fix is een
  vindpatroon", nu op een gedeelde CLASSIFIER in plaats van op een accumulatie.
- **Een klok-stub mag geen `Date`-SUBCLASS zijn.** Een subclass breekt `x instanceof Date` voor elk
  Date-object dat BUITEN de stub gemaakt is, en dat is niet zichtbaar als fout: de meting draait
  gewoon groen en meet iets anders. Aanleiding: bij punt 26 stubde de chat `Date` als subclass,
  waarna `derivePlannerGedaan` (`apps/web/src/lib/activities.ts:87`, `ad instanceof Date`) geen
  enkele rit meer herkende — geen dag werd `gedaan`, elke dag hield zijn sessies, en het te meten
  defect kon per constructie niet verschijnen. Stub met een Proxy op de ECHTE constructor; dan
  blijft `instanceof` werken. Zelfde familie als "een anomalie in je eigen meetuitvoer is een gat
  in je INSTRUMENT".
- **Een defect dat zichzelf herstelt, herstelt zich niet noodzakelijk naar DEZELFDE WAARDE.** Meet
  niet alleen ÓF een mechanisme terugkomt, maar WAARNAAR. Aanleiding: bij punt 26 stond het plan
  van een gereden dag er de volgende dag weer, maar via een reconstructie die de HELE week opnieuw
  plant met lege activities — en die leverde in 4 van de 15 cellen een ANDER plan: `long_z2` naar
  `sweet_spot`, TSS 42 naar 53, intent `high` 0 naar 26. "Hersteld" las als "in orde" terwijl het
  plan-van-record stil herschreven werd, en de blok-terugblik leest juist die velden. Zelfde
  familie als "citeer een meting met het predicaat dat gemeten is".
- **Een lus die op de NOMINALE vorm draait, mist elke as die die vorm MODULEERT.** Dit is scherper
  dan "je toetst maar één parameterwaarde": het gaat om de as die de vorm van de UITVOER bepaalt.
  Aanleiding: beide `push-parse`-lussen in de selftest draaien op `mesoFactor` 1, en daar bestaan
  NUL herhalingscellen met een decimaal werkgetal — terwijl mesoWeek 3 er alleen al 110 levert,
  want dáár rekt de kwaliteits-ramp de werktijd. Drie asserties bleven daardoor over 286 rijen
  ongedekt terwijl beide lussen groen stonden, en de tests draaiden per constructie precies de ENE
  week van de vier waarin het goed gaat. Verzamel bij de PRODUCENT en loop de modulatie-assen mee;
  een as die je niet draait, is een as waarop je niets weet.
- **Een parser die bij foute invoer een ANDER GETAL teruggeeft in plaats van `null`, is met een
  niet-null-assertie per constructie niet te betrappen.** Vier asserties hebben dit jaren laten
  staan: `dslBlockFromRow_` gaf op `"24.7 min"` keurig een blok terug — van 7 minuten. Toets de
  WAARDE, niet het bestaan. Zelfde familie als "een controle die per constructie kan slagen,
  controleert niets", nu op de UITKOMST in plaats van op de selectie.
- **Een test die via de ROUTE binnenkomt, bereikt alleen de PRIMAIRE tak.** `buildEventPayload`
  keert op `push.ts:87` terug zodra het ZWO lukt, dus een fixture die via die functie binnenkomt
  raakt de DSL-terugval NOOIT — precies waarom de nieuwe api-fixture de DSL-edit niet rood kreeg
  en die edit ongedekt de repo in ging. Toets een terugval bij zijn EIGEN functie, niet via de
  aanroeper. En andersom: meet of die terugval überhaupt bereikbaar is voor je hem repareert.
- **Een rood-meting van vóór een herformattering is ONTKRACHT.** Draait biome over het bestand
  tussen je rood-meting en je commit, herhaal die meting daarna. Zelfde familie als de bestaande les
  dat een biome-reformattering een red-patch ongemerkt kan opheffen, nu op de VOLGORDE in plaats van
  op de inhoud: niet de patch verdwijnt, maar het bewijs eronder veroudert.
## Vorm van een CC-prompt

- **Eén plain code-blok**, zonder taal-tag — dat is de één-tap-kopie op mobiel. Nooit proza in het blok mengen; Claude's kader eromheen staat als gewone tekst.
- Te lang voor één blok → splits in **genummerde blokken** (Blok 1/2, 2/2) die CC na elkaar in dezelfde **CC-sessie** draait. Een later blok mag leunen op wat een eerder blok zette. Het gaat om de CC-sessie, niet om een shell: PowerShell is de shell waarin CC zijn commando's uitvoert, geen omgeving waarin Daan zelf werkt.
- De prompt is een **stap-instructie in het Nederlands, geen uitvoerbaar script**. PowerShell-idioom alleen in de kop: `cd` naar de repo, daarna `Get-Location` op een eigen regel. Verder kale, zelf-printende commandoregels (git, pnpm). **Geen** `Write-Host` of `echo`, **geen** here-strings, **geen** loops, **geen** .NET File API. Secties label je met `#`-commentaarregels.
- In te voegen inhoud (een HANDOFF-blok, een doc) mag **verbatim** tussen eigen tekst-delimiters (`=== BEGIN … ===` / `=== EINDE … ===`) óf als strekking-bullets die CC in de huisstijl uitschrijft. Bij artefacten waar de exacte formulering telt: altijd verbatim.
- Inhoud: **spec-gedreven by default** — architectuur, exact gedrag, sleutel-logica en de gate. CC schrijft de code, vindt de call-sites zelf en past aan de **échte** staat aan (geen letterlijke `str_replace`-blokken). Exacte code alleen als **anker** bij fragiele edits: byte-getrouwe GAS-mirrors, TZ-grens-logica, formules en zone-mappings. CC meldt in het rapport de kern-implementatiekeuzes (gekozen conditie, plaatsing), zodat review tegen de spec kan zonder de volledige diff. Verder: verificatiestappen, een harde gate en de commit message.
- Vaste sluitregels waar van toepassing: training onaangeroerd op `3e8090a`; `git diff --stat` op `packages/engine` leeg; vloeren uit de suite lezen in plaats van hardcoden; CI via de publieke GitHub REST API.

VIJF CONTROLES VOOR ELK CC-PROMPT, en ze worden MECHANISCH uit de prompttekst getrokken — nooit
uit een handlijst. Dat is dezelfde grond als de anker-les hierboven: een handlijst dekte 48 van de
70 ankers, en alle drie de fouten zaten in de 22 daarbuiten.

1. Elke **VINDPLAATS** — bestand, regelnummer, inhoud — wordt gegrept vóór hij meegaat.
2. Elke **BEHOUD- of VERWIJDER-instructie**: bestaat het ding, en staat het er in die vorm?
3. Elke aangewezen **ASSERTIE-PLEK**: welke assen varieert die plek, en ligt het te dekken geval op
   een as die hij VASTZET? Een lus die op de nominale vorm draait dekt niets van wat de modulatie
   doet.
4. Elke **ACCEPTATIE-EIS**: kan de ingreep hem mechanisch raken?
5. Elk **GETAL**: uit een meting van deze sessie of uit een gepind document, nooit uit geheugen.

De chat rapporteert de TREFKANS van die controles in de begeleidende proza — "vijf van vijf" —
in plaats van te claimen dat het klopt.

EN ELK BOUW-PROMPT OPENT MET EEN PREMISSEN-BLOK: de beweringen over de repo die de controle hebben
overleefd, met als eerste stap voor CC dat hij ze toetst en bij afwijking STOPT. Dat stond in het
recon-prompt van punt 20 wél en in het bouw-prompt niet, en precies daar landden beide fouten.
Twee netten in plaats van één, en het eerste ligt vóór de CC-ronde.

HET MAXIMUM IS VIJF. Groeit die lijst, dan wordt hij hetzelfde als de lessenlijst in *Recon en
bewijslast*: te lang om te draaien, dus niet gedraaid. Daarom staat dit hier en niet daar —
"raadpleeg de lessen" is geen handeling.

AANLEIDING: twee fouten in één sessie, allebei in punt 20, en allebei al gedekt door een BESTAANDE
les. Het gat zat in de UITVOERING, niet in de dekking. (a) Het bouw-prompt wees de twee
`push-parse`-lussen aan als plek voor de nieuwe assertie, terwijl die op `mesoFactor` 1 draaien —
daar bestaan 0 decimale herhalingscellen tegen 110 bij mesoWeek 3, dus edit B bleef ongedekt en de
ronde eindigde op de stopregel. (b) Het close-out-prompt gaf een correctie-instructie op de zin
"in dezelfde PowerShell-sessie", die in het hele document niet voorkwam. CC ving beide en meldde
ze; ze kostten twee rondes.

## Vorm van een CC-rapport

Platte tekst, **geen code-fences en geen tabellen** (breekt de mobiele kopie), ongeveer 200 woorden. Literals tellen niet mee en worden exact gegeven.

Bevat: commit-hash; de gepinde RAW HANDOFF-URL op die hash; gate-uitslag; CI-conclusie met run-URL; bij code een lege `git diff --stat` op `packages/engine`; bevestiging dat training onaangeroerd is (HEAD `3e8090a`); en elke afwijking van de prompt.

EEN `git diff --stat <pad>` IS NÁ EEN COMMIT TRIVIAAL LEEG en bewijst dan niets: de wijziging zit in de commit, niet meer in de werkboom. Pin hem op `HEAD~1` (`git diff --stat HEAD~1 -- <pad>`) of op de fase-basis. Zelfde familie als de `head_sha`-regel bij CI: een controle die per constructie slaagt, is geen controle. Kwam binnen als CC-verbetering.

CC mag afwijken en moet dat melden. Een flag-en-stop legt het balletje via het rapport terug bij Claude.

## Gate

Geen commit of merge op rood: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — én CI groen. De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren; hardcode die getallen nooit in een prompt, lees ze uit de suite. Een bewuste daling (bijvoorbeeld verwijderde dode-code-tests) is geen regressie, maar wordt expliciet gemeld en in HANDOFF bijgewerkt.

## Prod en veiligheid

Prod-acties zijn approval-gated en gaan nooit stilzwijgend: `wrangler deploy` **vanuit `workers/api`** (niet `pnpm deploy`), met **`pnpm build` ervoor** omdat de assets-binding naar `apps/web/dist` wijst. Remote-D1-mutaties idem, in strikte volgorde: migratie eerst, dan deploy. Nooit prod-D1 met de hand bewerken.

DEPLOY-VOLGORDE: BUILD VÓÓR DEPLOY, NIET ERNA. De Worker `cadans-api` draagt een
assets-binding op `../../apps/web/dist`. `wrangler deploy` uploadt wat daar op dat moment
staat, dus een deploy zonder verse `pnpm build` publiceert de VORIGE front-end-bundel bij een
nieuwe Worker. De volledige gate loopt daarom vóór de deploy, en `wrangler` draait vanuit
`workers/api` (de gepinde versie staat alleen daar; vanaf de repo-root pakt hij een nieuwere).
`apps/web` heeft GEEN eigen publicatiestap — de Worker-deploy neemt de dist mee.

Remote-D1 **lezen** is een ander verhaal dan bewerken: een read-only `SELECT` via `wrangler d1 execute --remote` is approval-gated maar toegestaan, en vaak de zuiverste meetbron — het is exact wat de app ziet, zonder tussenlaag of aanname. De drempel-ijking van de doortrain-kaart leunde op 376 echte CTL-rijen die zo zijn opgehaald. Een MUTATIE op prod-D1 blijft verboden; het onderscheid is lezen versus schrijven, niet de tool.

LET OP bij een meting: `wrangler d1 execute --file` verwerkt het bestand als IMPORT en geeft alleen een SAMENVATTING terug (aantal queries, gelezen en geschreven rijen), GEEN resultaatrijen — met én zonder `--json`. Voor een meting draai je elk statement los met `--command --json`. Gevonden op 27-07-2026 bij de ijk-meting; CC meldde het als afwijking.

CC KAN visuele verificatie doen. `tools/shots/shot.mjs` (Playwright met Chromium) seedt de LOKALE D1 via de API, pint de browser-klok en schiet de weekkaart plus alle zeven dagkaarten weg als PNG met een `.txt` ernaast (console-errors mét falende URL, request-telling, innerText); CC leest die PNG's zelf terug. Twee regels die erbij horen: de klok is ÓÓK in de browser een fixture-variabele (`page.clock.setFixedTime`, vóór de eerste `goto`), en de app is `height: 100dvh` met een eigen scrollende `main` — een `fullPage`-shot snijdt dus af, de viewport wordt op de gemeten scrollhoogte gezet. CC BEOORDEELT ZELF wat uit een screenshot vast te stellen is en geeft een UITSPRAAK: klopt, klopt niet, of niet toetsbaar op dit geval. Beschrijven wat hij ziet is NIET genoeg — dan velt Daan alsnog het oordeel, en dat was precies het werk dat de harness moest overnemen. Kan CC iets niet vaststellen, dan zegt hij EXPLICIET wat Daan moet openen, op welk scherm, en waar hij precies naar kijkt; dat is de enige route naar Daan toe. De harness draait ook TEGEN PROD: doel-URL als argument, geen seed, geen backup, geen enkele schrijf-aanroep van de harness zelf. Prod staat achter een whole-origin Basic-auth-gate, dus hij krijgt `httpCredentials` plus een preflight mét Authorization-header; het wachtwoord komt uit `CADANS_BASIC_AUTH_PASSWORD` of uit het git-ignored `tools/shots/.prod-auth`, en blijft uit prompt, rapport en uitvoer.

BESLUIT, en het blijft staan: er komt GEEN read-only-modus die de mount-sync van de app onderdrukt. Een pageload tegen prod schrijft drie dingen — twee idempotente intervals-syncs en één `PUT /api/weekplan/<maandag>` die via `mergeFrozenWeekplan` geen historie kan herschrijven. Dat is bewust geaccepteerd: een harness die een SPECIALE modus fotografeert, kan liegen over de normale. Hoort de app niet te schrijven bij het laden, dan is dat een app-defect en geen camera-defect, en dan repareer je de app.

BESLUIT — EEN GROENE, GATE-KLARE BOUW GAAT NAAR PROD ZODRA HIJ KAN. "De gebruiker merkt er niets
van" is EXPLICIET GEEN grond om te wachten: een deploy die niets verandert draagt ook geen risico,
terwijl uitstellen wél iets kost. Geldige gronden om te wachten zijn er wel — een migratie die nog
niet remote is, een bouw waarvan de tweede helft nog komt, een effect dat niet te overzien is.
Wacht een deploy toch, dan draagt het STAND-blok de REDEN én de voorwaarde waaronder hij alsnog
gaat.

AANLEIDING: punt 15 fase 1, 2 en 3a zijn elk apart met dezelfde onderbouwing niet gedeployed — bij
doel FTP inert, dus een deploy toont niets — en stapelden zo tot één deploy van drie rondes. PER
RONDE KLOPTE HET, CUMULATIEF NIET. Fase 2 had bovendien een DATUM: Daans Peak begint 2026-08-24 en
daar wordt de meetlat-correctie dragend. En bij één deploy van drie rondes is een probleem op prod
niet meer aan een ronde toe te schrijven.

REKEN OP ÉÉN PROPAGATIE-UITVAL NA EEN DEPLOY. De eerste harness-run tegen prod valt om op
`#root > *` niet zichtbaar binnen 60 s; één herhaling volstaat. Nu TWEE keer gezien, bij de
niveaukaart-deploy en bij punt 15 fase 3c, dus het is een patroon en geen incident. Behandel het
niet als een defect en herhaal ook niet blind: diagnosticeer eerst met vier ophalingen — `/schema`,
de NIEUWE bundel uit de deploy-uitvoer, de CSS en `/api/settings` — en pas als die alle vier 200
geven, draai je de run één keer opnieuw. Geven ze dat niet, dan is er wél iets stuk en is de
uitval de melding.

EEN DRAAIENDE DEV-SERVER IS EEN VERBORGEN VARIABELE IN DE SHOT-HARNESS. De sweep toetst nergens of
de `wrangler dev` op 8787 bij de huidige repo hoort, dus een worker van vóór je commit schiet
gewoon mee. Herstart hem na ELKE worker-wijziging, en vóór de VOOR-meting. Aanleiding: vier NA-runs
op rij vielen om op `expected 7 day-strip buttons, found 0` terwijl er niets mis was met de bouw —
de oude worker gaf 404 op een verse route en het weekscherm toonde `not found`.

VERANDERT HET INSTRUMENT TUSSEN VOOR EN NA, DOE BEIDE METINGEN OPNIEUW op hetzelfde instrument. Een
gemengde reeks is geen vergelijking, ook niet als het verschil klein lijkt: je weet dan niet welk
deel van de diff de bouw is en welk deel de meetopstelling.

NA EEN DEPLOY IS DE EDGE NIET METEEN BIJ. Een 404 op een verse route of een 7403 op een remote
`wrangler`-commando is pas een UITSLAG na herhaling. Gemeten: `GET /api/doel-passend` gaf direct na
de deploy 404 met body `{"error":"not found"}` en circa twintig seconden later 200; en een
`d1 migrations list --remote` viel één keer om op "The given account is not valid or is not
authorized to access this service [code: 7403]" en werkte daarna zonder wijziging.

`pnpm deploy` IS EEN INGEBOUWD PNPM-COMMANDO en draait het script uit `package.json` NIET — het
kopieert een workspace-package naar een map. Deploy met `npx wrangler deploy` vanuit `workers/api`.

Secrets komen nooit in de chat of in een rapport; alleen de NAAM. Lokaal draaien via `.dev.vars` (staat in `.gitignore`).

## Communicatie

Nederlands voor uitwisseling en UI-strings; Engels voor code, commit messages en logging. Direct en technisch, bondig, weinig opmaak, geen overdreven beleefdheid. Daan leest geen code in de chat: bevindingen gaan in documenten, uitleg in gewone taal in de chat. Kopieerbare tekst staat altijd in een één-tap code-blok.

## Close-out van een chat

De HANDOFF-update is **altijd een aparte docs-only commit**, nooit gebundeld met code. CC committe, pusht en print de gepinde RAW-URL op de commit-hash. Een chat is pas klaar voor overgang als die push gedaan is. Nieuwe of gewijzigde werkwijze-afspraken uit die chat gaan in dezelfde close-out naar dit document.

Het nieuwe STAND-blok gaat BOVENAAN in `HANDOFF.md`, boven het vorige, en vervangt of verwijdert niets. Het eindigt ALTIJD op een `FOCUS VOLGENDE CHAT`-regel. Die twee zijn geen stijl maar een afhankelijkheid: de opener draagt de stand niet meer zelf en wijst naar dat blok, dus een blok dat onderaan belandt of geen FOCUS draagt laat de volgende chat met lege handen staan.

Na het close-out-rapport schrijft de chat de opener voor de volgende chat uit, verbatim uit *§ Opener-sjabloon*.

DE FOCUS-REGEL WORDT NIET VRIJ GEFORMULEERD. Hij wijst naar het eerstvolgende open punt uit
de volgorde in `docs/ROADMAP.md`, en noemt dat punt bij naam. Wijkt een chat daarvan af —
en dat mag, een gemeten vondst kan voorrang hebben — dan staat de REDEN in hetzelfde
STAND-blok. Een punt wordt afgevinkt in `ROADMAP.md` in DEZELFDE close-out waarin het af
is, nooit later.

Aanleiding: het openstaande werk leefde op vier plekken — de stappen in ROADMAP, de
parkeerlijst daaronder, `DOELEN-SPEC.md` §6, en de OPENSTAAND-bullets in elk STAND-blok —
en elke chat koos zijn focus uit het laatste blok. Dat is lokaal logisch en globaal
ondoorzichtig: er is per ronde vooruitgang zichtbaar maar nooit de afstand tot de streep.

## Opener-sjabloon

**De afsluitende chat schrijft de opener uit** — verbatim uit dit sjabloon, in één code-blok, ná het close-out-rapport (dan pas is de hash bekend). Er valt nog maar ÉÉN ding in te vullen: `<hash>`, op alle drie de URL's dezelfde close-out-hash. STAND en FOCUS worden NIET overgenomen — de opener WIJST naar het bovenste STAND-blok in `HANDOFF.md` in plaats van het na te vertellen. Verder niets toevoegen: de werkwijze staat hier, niet in de opener. Daan hoeft niets samen te stellen; hij krijgt één kant-en-klaar blok.

Reden voor die vorm: een opener die de stand overschrijft laat dezelfde tekst op twee plekken leven die elk per chat muteren — precies de drift die dit document moest opheffen. Eén bron, en de opener verwijst ernaar.

Dat leunt op twee eisen aan de close-out, en zonder die twee is de verwijzing loos: het nieuwste STAND-blok staat BOVENAAN in `HANDOFF.md`, en élk STAND-blok eindigt op een expliciete `FOCUS VOLGENDE CHAT`-regel. Zie *Close-out van een chat*.

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

Volg de FOCUS uit het bovenste STAND-blok.
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
- 2026-07-29 — het opener-sjabloon vertelt de STAND niet meer na maar WIJST naar het bovenste STAND-blok in `HANDOFF.md`; alleen `<hash>` valt nog in te vullen. De twee eisen die dat draagt — nieuwste blok bovenaan, en elk blok eindigt op een FOCUS-regel — staan nu expliciet in *Close-out van een chat*. Aanleiding: Daan gebruikte deze kortere vorm en hij is strikt beter, want de oude opener kopieerde de stand naar een tweede plek die per chat muteert.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een onbeslisbaar deel van een meting is pas een probleem als het oordeel eraan hangt. Aanleiding: drie routes om de sweet-spot-overlay exact te maken bleken alle drie overbodig zodra gevraagd en geleverd per zone naast elkaar kwamen te staan.
- 2026-07-29 — in *Recon en bewijslast* vastgelegd dat de chat een gecommitte meetdump in de container doorrekent met de app-eigen functie, in plaats van hem in de context te trekken.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: rond één keer af en tel nooit afgeronde waarden op. Aanleiding: een ijk-waarde in een CC-prompt was per zone afgerond (156 in plaats van 157) en maakte een correcte meting rood; CC stopte en corrigeerde dezelfde fout in zijn eigen test.
- 2026-07-29 — "ijk niet op gedrag dat je wilt vervangen" aangevuld met een tweede aanleiding: bij de zone-munt gebruikte de chat Daans 46 gemeten weken om te beslissen wélke zone een week mag laten zakken. Die weken zijn een verslag van rijden op gevoel; een poort die daarop past reproduceert de gewoonte die de coach vervangt. De norm komt uit het plan, de reeks levert hoogstens een bovengrens-check.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: elk getal in een voorstel draagt zijn herkomst in één woord — PLAN, SIGNAAL of BELEID. Aanleiding: de per-zone-norm werd als PLAN afgeleid terwijl de poort-keuze eromheen als SIGNAAL binnensloop, en dat viel pas op toen Daan het opmerkte.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: citeer een meting met het predicaat dat gemeten is. Aanleiding: "nul weken struikelen alléén op Z3" werd via "Z3 bindt nooit" tot "decoratie", terwijl 12 van de 46 weken wél onder de Z3-norm lagen — alleen nooit als enige.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een fixture die een poort passeert om iets anders te kunnen meten, asserteert die passage. Aanleiding: drie fixtures gingen de vorm van de norm dragen; verzet de zone-sync de grenzen, dan zakken ze stil onder norm en meet de effect-poort niets meer zonder rood te worden.
- 2026-07-29 — in *Beslissen* vastgelegd dat een plan op een BESLUIT eindigt en nooit op "of wil je X?". Een open slotvraag kost een ronde en legt het werk terug dat Claude hoort te doen; bij echte ambiguïteit blijft de popup mét advies in de proza de enige vorm.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een pad kan dood zijn aan zijn invoer of aan zijn uitvoer, niet alleen doordat niemand het aanroept. Aanleiding: `coachPlannedArg_` geeft `segmenten: null` mee waardoor de zone-afleiding van de geplande prikkel dood is, en `adapt` wordt berekend en weggeschreven zonder één lezer — beide keren grep-baar aangesloten, groen getest, en toch stil.
- 2026-07-29 — "GAS is een PORT-referentie" aangevuld met een tweede aanleiding: bij de sweet-spot-sleutelvraag werd de bevroren bron opnieuw opgezocht om te bepalen of de ontbrekende sleutel-intent een geporte omissie was of drift, terwijl `DOELEN-SPEC` §3.1 en de meting het antwoord al gaven.
- 2026-07-29 — les toegevoegd in *Recon en bewijslast*: een test die de uitkomst van een pijplijn met de hand injecteert, toetst die pijplijn niet. Aanleiding: `inhaal.test.ts` zet redenCode `catchup_high` met de hand in een nagebouwde `ProposalWeek` en was altijd groen, terwijl de pijplijn die code in Base, Build en Peak per constructie niet kan produceren — 48 combinaties, nul codes.
- 2026-07-30 — les toegevoegd in *Recon en bewijslast*: een dood mechanisme toets je op zijn uitkomst, niet alleen op zijn bereikbaarheid. Aanleiding: de week-inhaal-kaart was op drie manieren onbereikbaar, maar wat het opruim-besluit droeg was de meting dat de wat-als-run in 60 van 72 cellen MINDER intensiteit levert dan het plan dat er al staat.
- 2026-07-30 — de klok-regel in *Recon en bewijslast* aangevuld met een tweede aanleiding: een fixture-datum in het verleden zet de ambient-gedateerde week-allocator stilzwijgend uit, waardoor `debtOptIn.test.ts` een catchup-code kon asserteren die de levende pijplijn nooit produceert.
- 2026-07-30 — in *Rolverdeling* vastgelegd dat Daan geen bouwdocs leest: een recon- of bouwdoc blijft de spec waartegen CC bouwt, maar is geen review-poort meer. Wat Daan moet beslissen komt als gewone vraag in de chat.
- 2026-07-30 — les toegevoegd in *Recon en bewijslast*: een controle wordt getoetst tegen de payload uit hetzelfde prompt. Aanleiding: een acceptatie-eis vroeg dat een woord nergens meer voorkwam, terwijl de verbatim tekst in datzelfde prompt het twee keer bewust gebruikte.
- 2026-07-30 — les toegevoegd in *Recon en bewijslast*: vooruit-bedrading is dode code met een nettere naam. Aanleiding: de verplichte `grenzen`-parameter op `dosisTredeVoorstel` kon zijn uitkomst per constructie niet raken en is er weer uit.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: de dev-server is ook een fixture-variabele bij een byte-vergelijking; warm eerst op en gooi die run weg.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: een assertie die twee zinnen vergelijkt veronderstelt dat ze dezelfde vorm hebben, en hoort een assertie te dragen dat de twee kanten daarbuiten verschillen.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: twee kaarten die hetzelfde signaal lezen, toets je op wat ze samen op één scherm zeggen.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: een grep die het eigen bestand uitfiltert kan de aanroeper binnen dat bestand niet zien.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: een proportionele splitsing produceert zones die het plan nooit voorschreef; poort op het nominale label, niet op een minuten-drempel.
- 2026-08-01 — les toegevoegd in *Recon en bewijslast*: meet de voor-staat alleen vanaf een schone werkboom — eerst committen of stashen, dan meten.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: de shot-harness zaait alleen de plan-kant, dus een kaart-element dat een tekort aan de GELEVERDE kant vereist is per constructie niet te fotograferen; dat is een grens op de acceptatie-eis, niet op de bouw.
- 2026-08-02 — twee lessen toegevoegd in *Recon en bewijslast*: een acceptatie-getal hoort bij het ontwerp waarop het gemeten is, en een eis dat een suite onaangeraakt blijft toets je tegen de grootheid die je verandert.
- 2026-08-02 — besluit toegevoegd in *Prod en veiligheid*: een groene, gate-klare bouw gaat naar prod zodra hij kan, en "de gebruiker merkt er niets van" is geen grond om te wachten. Plus een les in *Recon en bewijslast*: een byte-vergelijking tegen prod draagt een klok.
- 2026-08-02 — twee lessen toegevoegd in *Recon en bewijslast*: een uitspraak over wat de gebruiker merkt die op één cel gemeten is mag niet als algemene uitspraak landen (en een kanteling citeer je met beide richtingen), en het mechanisme dat een slot opent is niet het mechanisme dat het vult.
- 2026-08-02 — blok toegevoegd in *Prod en veiligheid*: build vóór deploy, niet erna — de assets-binding uploadt wat er op dat moment in apps/web/dist staat.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een schrijfpad controleer je aan beide uiteinden — een route-guard die een afwezige sleutel overslaat zegt niets over de laag erachter. Aanleiding: de doelDuur-tegenspraak, waar `writeSettings` full-replace bleek en de eerstvolgende opslag de kolom op NULL had gezet.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een grep-eis toets je tegen de echte trefferverdeling vóór je hem verstuurt; "nul treffers" kan per constructie falen op treffers die er horen te staan.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een render-conditie die op een browser-default leunt verliest van een inline stijl op hetzelfde element. 897 tests en 8 prod-shots lieten het staan; alleen Daans oog kon erbij.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een tekort dat op elke trede blijft bestaan is geen dosis-vraag. Aanleiding: punt 15 fase 3c stond als dosis-ronde gespecificeerd terwijl norm en plan bij de klim-doelen uit elkaar lopen.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een trede-sweep vergelijkt plan en norm op dezelfde trede. Aanleiding: een sweep las "79,6 tegen 78, geleverd" terwijl de norm op die trede 90 is.
- 2026-08-02 — les toegevoegd in *Recon en bewijslast*: een weekvorm uit de meetset is een vergelijkings-as, geen portret van de gebruiker. Aanleiding: een vraag over wat Daan merkt werd op een zaterdag van 240 beantwoord terwijl zijn zaterdag 120 is, en dat verzet de norm van 78 naar 52.
- 2026-08-03 — les toegevoegd in *Recon en bewijslast*: een lus die op de nominale vorm draait mist elke as die die vorm moduleert. Aanleiding: beide push-parse-lussen draaien op mesoFactor 1, waar nul decimale herhalingscellen bestaan terwijl mesoWeek 3 er 110 levert; drie asserties bleven over 286 rijen ongedekt terwijl beide lussen groen stonden.
- 2026-08-03 — les toegevoegd in *Recon en bewijslast*: een parser die bij foute invoer een ander getal teruggeeft in plaats van null, is met een niet-null-assertie niet te betrappen. Aanleiding: `dslBlockFromRow_` gaf op "24.7 min" een blok van 7 minuten, en vier asserties lieten dat staan.
- 2026-08-03 — les toegevoegd in *Recon en bewijslast*: een test die via de route binnenkomt bereikt alleen de primaire tak. Aanleiding: `buildEventPayload` keert op `push.ts:87` terug zodra het ZWO lukt, dus de nieuwe api-fixture kon de DSL-terugval niet rood krijgen.
- 2026-08-03 — correctie in *Vorm van een CC-prompt*: gesplitste blokken draaien in dezelfde CC-SESSIE. De regel zei "dezelfde sessie" zonder meer; PowerShell is de shell waarin CC zijn commando's uitvoert, geen omgeving waarin Daan zelf werkt, en die dubbelzinnigheid is nu weg.
- 2026-08-03 — stap toegevoegd in *Vorm van een CC-prompt*: vijf controles die mechanisch uit de prompttekst worden getrokken, plus de eis dat elk bouw-prompt opent met een premissen-blok dat CC eerst toetst. Aanleiding: twee chat-fouten in punt 20 — het bouw-prompt wees twee lussen aan die op mesoFactor 1 draaien (0 decimale herhalingscellen tegen 110 bij mesoWeek 3), en het close-out-prompt corrigeerde een zin die nergens stond. Beide waren al door een bestaande les gedekt; wat ontbrak was een moment waarop die lessen wórden gedraaid.
- 2026-08-04 — les toegevoegd in *Recon en bewijslast*: een klok-stub mag geen Date-subclass zijn. Aanleiding: bij punt 26 brak zo'n stub `ad instanceof Date` in `derivePlannerGedaan`, waardoor geen enkele dag `gedaan` werd en het te meten defect per constructie niet kon verschijnen — terwijl de meting groen draaide.
- 2026-08-04 — les toegevoegd in *Recon en bewijslast*: een defect dat zichzelf herstelt, herstelt zich niet noodzakelijk naar dezelfde waarde. Aanleiding: bij punt 26 kwam het plan van een gereden dag de volgende dag terug via een reconstructie die in 4 van de 15 cellen een ander plan leverde (long_z2 naar sweet_spot, TSS 42 naar 53, intent high 0 naar 26).
- 2026-08-04 — les toegevoegd in *Recon en bewijslast*: een aanbod erft de toestandsruimte van de poort waaraan het hangt. Aanleiding: het aanbod van punt 10 fase B deel 2 hing aan een weekstem die juist eist dat er geen dag meer staat; over 630 cellen bleek er in geen enkele van de 119 vuur-cellen iets toe te voegen, en het punt is zonder bouw gesloten.
- 2026-08-04 — les toegevoegd in *Recon en bewijslast*: een classificatie met een substring-terugval geeft altijd een antwoord en meldt nooit dat ze het niet weet. Aanleiding: `intentFromType_` noemde `combo_long_with_efforts` "duur" op grond van `indexOf("long")`, waardoor poort 1 en poort 2 van de sleutel-machinerie tegelijk verkeerd stonden.
