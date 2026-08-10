# Cadans — WERKWIJZE-LESSEN

De lessen uit recon en bewijslast. VERBATIM verhuisd uit `docs/WERKWIJZE.md` op 08-08-2026, omdat
dat document tegen de afkapgrens van de opener-fetch aan liep. Er is geen letter gewijzigd.

De NORM staat in `docs/WERKWIJZE.md` en wint bij tegenspraak; dit bestand draagt de bewijslast-regels
waarop die norm rust. De opener haalt beide op. Een verwijzing hieronder naar *Prod en veiligheid*,
*Beslissen* of het *Opener-sjabloon* wijst naar `docs/WERKWIJZE.md`.

Nieuwe of gewijzigde lessen komen HIER, met in dezelfde close-out een gedateerde regel in
`docs/WERKWIJZE-LOG.md`.


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
  TWEEDE AANLEIDING, en die ligt op een BOUWSPEC in plaats van op een verwijzing: een HENDEL die
  een roadmap-punt zelf noemt is een PREMISSE en geen gegeven. Punt 39 droeg twee hendels voor
  zijn eigen bouwronde, en gemeten is de kalendernaam-splitsing INERT bij quotum 1 — 0 van de 105
  cellen, gemaskeerd door het quotum zelf, want bij quotum 2 bewegen er 56 — terwijl het quotum
  verhogen de week juist 10 tot 30 minuten LANGER maakt. Geen van beide raakt het volume, dus de
  bouwspec uit het punt was onbruikbaar zoals hij stond. Een punt dat zijn eigen oplossing
  aanwijst, heeft die oplossing niet gemeten; toets elke genoemde hendel afzonderlijk vóór je
  erop bouwt.
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
  TWEEDE AANLEIDING, EN DIE VERBREEDT DE REGEL NAAR ELK GEBRUIK VAN `git checkout <bestand>`:
  dat commando herstelt naar HEAD, NIET naar "de staat van vóór je patch". Draagt de werkboom
  nog ongecommitte bouw, dan wist het die bouw mee. Aanleiding: het bouw-prompt van punt 33
  schreef voor een rood-mutatie zo terug te draaien, terwijl datzelfde blok pas aan het EIND
  committeert — bij M1 verdween daarmee de hele gedeelde functie, en CC bouwde hem opnieuw op.
  Dezelfde instructie werkte in blok 1 wél, want dáár was het gepatchte bestand op alles behalve
  de patch gelijk aan HEAD, en juist dat verschil maakt hem verraderlijk: hij werkt precies zo
  lang tot hij dat niet meer doet. DE TOETS VOORAF is één vraag — is dit bestand op alles NA de
  patch gelijk aan HEAD? Zo niet, draai de mutatie GERICHT terug in plaats van met git.
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
  TWEEDE AANLEIDING, en die snijdt de ANDERE kant op: LOS meten stelt de DEKKING van een term vast,
  de DISJUNCTIE stelt de UITKOMST vast, en die twee zijn niet verwisselbaar. Wie een losse meting
  als uitkomst rapporteert, meldt een defect dat er niet is. Aanleiding: bij punt 40 mat de chat
  `planDraagtSleutelzone_` los, las **108 van de 360** kwaliteitsdagen als een gat en meldde dat als
  LIVE defect. Die term is één van twee OR-termen; op de disjunctie is het **360 van de 360** —
  zone-term 252, intent-term 312, nul dagen zonder sleutelstatus. De chat ving het zelf vóór er iets
  op gebouwd was, maar het had bijna een bouwronde gedragen. Vraag dus expliciet wat je meet: hoort
  deze term gedekt te zijn (los meten), of hoort de UITKOMST te kloppen (de hele conditie meten).
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
  TWEEDE AANLEIDING, en die ligt op een POORT in plaats van op een as: punt 21 erfde uit punt 20
  de premisse dat `buildWorkoutDescription_` alleen bereikbaar is als de rij-parser faalt, en
  0 keer null op rij-niveau las daarmee als onbereikbaar. Er ligt een POORT VÓÓR die rij-lus —
  beide bouwers vallen uit op een lege `structuur` zonder ooit een rij aan te raken — en die was
  nooit gemeten. De uitkomst hield (ook die poort geeft nul), maar de meting dekte hem niet.
  Een bereikbaarheids-premisse noemt dus élke poort op het pad, niet de poort waarop hij is
  gemeten.
- **De noemer van een dekkingsclaim is het aantal distincte INVOERVORMEN, niet de
  steekproefomvang.** Een groot N over een kleine invoerruimte is geen bewijs van dekking maar
  dezelfde meting vele malen herhaald — en het leest juist overtuigend ómdat het getal groot is.
  Normaliseer de invoer tot vormen, tel die, en toets bij de PRODUCENT of er een achtste vorm
  kán bestaan. Pas dan is een nul een uitputting in plaats van een steekproef. Aanleiding: punt
  21 gaf 0 van de 15275 sessies op de description-tak, en de chat wilde daarop een tweede
  meetronde draaien tegen een gevulde D1 omdat de recency-seed andere varianten kiest. Daan wees
  dat af, en terecht: die 64951 rijen dragen 7 duur-vormen en 1 vermogensvorm, en `planner.ts`
  kan er geen achtste maken — een andere variant levert dezelfde vormen met andere getallen.
  Zelfde familie als "een uitslag noemt teller, noemer én uitsluiting met reden", nu op de as
  waarop de noemer hoort te staan.
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
- **Een uitslag noemt ALTIJD teller, noemer én uitsluiting met reden — en de noemer is het TOTAAL,
  nooit wat er na uitsluiting overbleef.** Krimpt de noemer stilletjes mee, dan leest een
  onvolledige meting als een volledige: "85 van 85" klinkt als dekkend terwijl er 93 vergelijkbare
  eenheden waren. Aanleiding: bij punt 30 viel dezelfde denkfout op één middag TWEE kanten op.
  Eerst werd een ijk-run als nulmeting gekozen omdat hij met een andere run overeenkwam — dat is
  de meetlat op de uitkomst kiezen — en daarna werd de noemer 85 in plaats van 93. Beide keren
  verdween precies het deel dat de meting onzeker maakte. Schrijf dus "85 van de 93 identiek, 8
  uitgesloten omdat de ijking daar faalde", en trek een uitslag die op de gunstige helft leunt
  expliciet IN.
- **Een meting die door een SHELL-LAAG gaat, toets je eerst op een BEKENDE WAARDE.** Die laag kan
  je invoer stil verbouwen, en dan meet je de laag in plaats van het systeem. Aanleiding: Git Bash
  zette een `/assets/...`-argument om naar een Windows-pad, waardoor een fetch 90 seconden lang
  `-1` gaf en dat las als een propagatievenster van anderhalve minuut; met `MSYS_NO_PATHCONV=1`
  gaf dezelfde aanroep meteen 200. Zelfde soort val, twee keer voorgekomen: een python-heredoc die
  een `\n`-escape tot een echte regelovergang verminkte, gevangen met `node --check`. Zelfde
  familie als "een anomalie in je eigen meetuitvoer is een gat in je INSTRUMENT".
- **Een IJKING toetst de GROOTHEID die je vergeleek, nooit de AS waarop de rest van je meting
  rust.** Voeg daarom naast de ijking een IDENTITEIT toe die per constructie moet kloppen. Zelfde
  familie als "een controle die per constructie kan slagen, controleert niets", nu op de
  MEETOPSTELLING. Aanleiding: bij punt 11 gaf de arbeid-ijking tegen `icu_joules` 0,00% op de
  VERSTREKEN-tijd-as én op de sample-as — beide keren groen — terwijl de eerste doorrekening op
  de verkeerde as stond en een t_ster van 152 minuten op een rit van 127 opleverde. Wat het ving
  was `t_ster + rest_min = duur_min`, die na correctie op 25 van de 25 klopt. De time-stream van
  intervals.icu is VERSTREKEN tijd met dt-sprongen op de pauzes; het aantal samples is de
  RIJTIJD. Kwam binnen als CC-afwijking en is strikt beter dan wat het prompt vroeg.
- **Een drempel die op een nagenoeg CONSTANT tijdstip valt, is een KLOK en geen gebeurtenis.**
  Meet de spreiding van het TRIGGER-moment vóór je er een oordeel op bouwt: ligt dat moment
  telkens op dezelfde plek, dan draagt het geen informatie en meet alles erachter de VORM van de
  invoer. Aanleiding: de 15 kJ/kg-drempel van de duurvermogen-maat viel over 25 kandidaat-ritten
  tussen 90 en 125 minuten met mediaan 99, waardoor de resterende tijd niets anders was dan
  ritduur min honderd — en het vermogen ná de drempel +0,70 correleerde met die resttijd.
- **Een GOEDKEURPOORT in CC is een prompt-eigenschap en wordt VOORAF in de chat aangekondigd, met
  het antwoord erbij.** Daan beoordeelt in CC niets inhoudelijks: hij herkent alleen of een
  gevraagde goedkeuring aangekondigd was. Is ze dat niet, dan breekt hij af en is dat een fout
  van de chat. Toets bovendien of de poort NODIG is — een overbodige poort kost dezelfde
  onderbreking als een noodzakelijke. Aanleiding: het meet-prompt van punt 11 vroeg een
  remote-D1-lezing voor gewicht en FTP, terwijl het intervals-object ze al draagt: 0 van de 25
  ritten viel terug op `icu_weight`. De deploy blijft het ENE beslismoment waar een echte
  afweging bij hoort.
- **De GATE hoort bij de vaste sluitregels van ELKE CC-prompt, ook bij een docs-only ronde.** Een
  commit zonder gate is een commit op ongemeten grond, ongeacht wat er in de diff staat. Een
  prompt die de gate overslaat is dus een prompt met een fout, geen prompt met een vrijstelling.
- **Een gepind getal over de HUIDIGE VORM van gereedschap is een uitspraak over het HEDEN, niet
  over die commit.** Hoeveel schermen de harness schiet, hoeveel scenario's er zijn, welke
  migratie de laatste is — zulke getallen leid je OPNIEUW af op het moment dat je ze gebruikt.
  Citeren uit een gepind document is er precies naast: het document was waar toen het geschreven
  werd, en dat is niet dezelfde vraag.
- **DE MEETLAT MAG NIET FIJNER ONDERSCHEIDEN DAN DE KAART KAN TONEN.** Toont het scherm hele
  minuten, dan valt het oordeel op hele minuten. Anders kan een zone als GEHAALD lezen en als
  TEKORT tellen, en spreekt de kaart zichzelf tegen op één regel. Aanleiding: `VO2max 8/8` naast
  een teller `0/2`, op het doel-passend-scherm.
- **Een TOLERANTIE hoort net zo goed op een PLATEAU te liggen als een drempel.** De ondergrens
  waaronder hij aantoonbaar fout is, is NIET het antwoord: meet het hele bereik en kies waar
  niets beweegt. Zit de uitkomst over dat hele bereik stil, dan was de vraag welke tolerantie je
  kiest leeg — en is de echte vraag een andere.
- **Een ROOD-FIXTURE die BINNEN de marge valt die hij moet wegnemen, bewijst niets.** Beide
  regels geven daar hetzelfde antwoord, dus de patch gaat er groen doorheen en het rood is een
  illusie. De rood-grens moet BUITEN het mechanisme liggen dat je toetst. Aanleiding: een
  totaal-grens van één seconde onder plan viel binnen een tolerantie van drie seconden.
- **Een MEETOPSTELLING reproduceert de VORM van de productie-invoer, niet alleen de waarden.**
  Levert de bron hele seconden, dan levert je fixture hele seconden. Onafgerond voeden haalt
  precies de kwantisering weg die in productie wél bijt — en dan is groen een eigenschap van de
  fixture geworden in plaats van van het systeem.
- **Geen heredocs voor BESTANDSINHOUD, en na elke bewerking eerst een syntaxcontrole.** DE REMEDIE
  IN DEZE REGEL IS PER 05-08-2026 ACHTERHAALD — zie de laatste bullet van deze sectie: ook een
  patch-BESTAND is een verboden vorm, want de val zit in het idioom en niet in de shell. Wat blijft
  staan is de DIAGNOSE en de syntaxcontrole. Oorspronkelijk luidde de remedie: schrijf een
  patch als BESTAND weg en draai die, in plaats van de inhoud door een shell-heredoc te duwen. En
  na elke bewerking van een `.mjs` of `.ts` volgt `node --check` of de typecheck VÓÓR de meting,
  niet erna: een verminkt bestand dat pas bij het meten omvalt kost een hele meetronde, en een
  verminkt bestand dat NIET omvalt kost er meer.
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
- **Een VOLGORDE-argument dat op het EFFECT van een fix rust, toetst eerst de VORM van die
  fix.** "Doe X eerst, want het maakt de rest eenvoudiger" is een uitspraak over wat X
  oplevert, en die is pas geldig als vaststaat wat X werkelijk doet. Grep de fix vóór je de
  volgorde adviseert. Aanleiding: punt 33 werd naar voren geadviseerd omdat het de andere
  punten eenvoudiger zou maken door een testlaag te consolideren, terwijl
  `apps/web/vitest.config.ts` `environment: "node"` draait met `include: ["src/**/*.test.ts"]`
  en er NUL `.test.tsx`-bestanden en geen jsdom bestaan — er valt daar niets te consolideren,
  dus het gestelde effect bestaat niet. Het advies is teruggenomen vóór er iets gebouwd was.
  Zelfde familie als "een gepind document bewijst zijn eigen GELDIGHEID niet", nu op een
  ADVIES in plaats van op een document.
- **Een GREP-EIS toets je met dezelfde vlaggen als waarmee je hem hebt afgeleid.** Een
  trefferaantal dat case-insensitive is gemeten en vervolgens als hoofdlettergevoelige
  controle wordt verstuurd, is een andere eis dan de gemeten. Aanleiding: een premisse
  beloofde 3 treffers op `copy` in `docs/ROADMAP.md`; hoofdlettergevoelig zijn het er 2,
  want de derde regel draagt `COPY`. CC ving het verschil en de strekking hield stand,
  maar de eis was aantoonbaar niet de gemeten eis. Noteer bij een trefferaantal dus altijd
  de vlag waarmee het is verkregen. TWEEDE AANLEIDING, en die kostte bijna een tegenspraak
  in het document zelf: de chat leidde een BEHOUD-instructie af uit een hoofdlettergevoelige
  grep op "de nummering is de bouwvolgorde" en vond 1 treffer; hoofdletterongevoelig zijn
  het er 2, want een tweede regel draagt "De nummering IS de bouwvolgorde". Het prompt
  droeg daardoor maar één omzetting op, en `docs/ROADMAP.md` zou zichzelf op twee plekken
  hebben tegengesproken. CC ving het en zette ze allebei om. Een grep die bepaalt WAT er
  wordt aangepast is dus even gevoelig voor zijn vlaggen als een grep die iets telt.
- **Een VOOR/NA-vergelijking vraagt dat de VOOR-meting is bewaard vóór de ingreep — dat is
  een STAP in het prompt, geen eigenschap van de harness.** Aanleiding: bij de deploy van
  punt 13 fase A bleek er geen prod-nulmeting te bestaan om tegen te vergelijken, omdat
  `tools/shots/out` bij elke run wordt gewist en de vorige prod-run door latere lokale runs
  was overschreven. CC meldde het gat in plaats van het te omzeilen, en dat is de juiste
  uitkomst — maar de vergelijking was al onmogelijk op het moment dat het prompt erom
  vroeg. Vraag een byte-vergelijking dus alleen als het prompt de nulmeting zelf eerst
  wegschrijft naar een pad dat de volgende run NIET wist. Dit is punt 31 en punt 24 in
  levenden lijve, en de reden dat die twee vóór punt 33 gaan.
- **Een regel die drie keer wordt overtreden is geen naleefprobleem maar een
  GEREEDSCHAPSprobleem.** Het verbod op heredocs voor bestandsinhoud staat er al en werd
  bij punt 13 fase A voor de derde keer geraakt: een patch-script verminkte opnieuw een
  `\n` tot een echte regelovergang. De val zit niet in de onoplettendheid maar in het
  IDIOOM — zodra er een patch-script aan te pas komt, is de verminking een kwestie van
  tijd. Bewerk bestaande bestanden daarom met de Edit-tool en schrijf nieuwe met de
  Write-tool; een shell-script dat broncode genereert of bewerkt is geen toegestane vorm,
  ook niet eenmalig, ook niet als het "even sneller" is. Een `python -c`-append aan een
  wijzigingslog valt hier OOK onder: append-versus-bewerking is geen geldige uitzondering,
  want het idioom is hetzelfde en de verminking dus ook.
- **Schrijf je een regel in een TERRITORIUM waar al een regel staat, lees dan de bestaande
  treffers VOOR je schrijft.** Een trefferaantal bewijst dat er iets STAAT, niet dat het
  VERENIGBAAR is met wat je toevoegt. Aanleiding: bij de close-out van punt 13 werd een
  nieuwe heredoc-les toegevoegd die de REMEDIE van de bestaande regel ongeldig maakte — die
  schreef voor een patch als BESTAND weg te schrijven en te draaien, en juist die vorm is
  met de nieuwe regel verboden. Er was wel gegrept: 4 treffers, op de regels 471, 521, 522
  en 813 van de TOENMALIGE tekst. Die grep bevestigde alleen DAT de regel bestond en las
  niet WAT hij voorschreef. CC ving de tegenstrijdigheid en repareerde de oude bullet
  ongevraagd. Zelfde familie als "een instructie om iets te BEHOUDEN veronderstelt dat het
  er staat", nu op een regel die je VERVANGT in plaats van behoudt.
- **Een RUISVLOER is geen constante en hoort bij de SESSIE waarin je hem meet.** "X van de Y
  byte-identiek" is pas leesbaar naast een ijkpaar uit diezelfde reeks, en zo'n ijkpaar is niet
  overdraagbaar: op ONGEWIJZIGDE code gaven vier paren 16, 8, 24 en 0 afwijkende shots, telkens
  93 vergeleken van 95 met 2 uitgesloten wegens punt 23. Een enkele schone uitslag bewijst dus
  net zo min determinisme als een enkele vuile uitslag chaos bewijst. Zelfde familie als "een
  harness die zelf schrijft verzadigt zijn eigen invoer", nu op de VARIANTIE in plaats van op
  de richting: daar groeide de invoer aan, hier beweegt ze heen en weer. Sinds de rotatie van
  punt 31 kost een eigen ijkpaar bijna niets — twee sweeps achter elkaar vóór de bouw — dus er
  is geen grond meer om er een te erven.
  EN HIJ HOORT OOK NIET BIJ HET SCENARIO. Gemeten over DRIE sessies met exact dezelfde opzet —
  warmloop weggegooid, daarna twee sweeps — zwierf de vloer van ACHT bewegende shots in
  `klim-weekstem` (7 augustus) naar NUL (de punt-37-ronde) naar ACHT in `v7-midweek`. Niet
  alleen het aantal beweegt dus, ook wélk scenario het draagt. DAARMEE IS DE
  WARMLOOP-KANDIDAAT UIT HET PUNT-37-STAND-BLOK WEERLEGD: dezelfde opzet gaf twee verschillende
  uitkomsten, dus de weggegooide warmloop verklaart het verschil niet. Erf een vloer niet, en
  erf al helemaal geen verwachting over wélk scenario zal bewegen.
- **Een premisse over de STAAT VAN DE SCHIJF kan binnen je EIGEN prompt verouderen.** Een blok
  dat draait verandert de grond waarop een later blok staat, en een aanname die bij het
  schrijven klopte is dan al onwaar vóór ze getoetst wordt. Aanleiding: het bouw-prompt van
  punt 31 stelde dat `tools/shots/out` nog de recon-uitvoer droeg, terwijl de rood-toets-runs
  uit het EERSTE blok van datzelfde prompt die map twee keer geroteerd en gewist hadden. De
  voorwaarde die ertoe deed — marker afwezig — hield, en de toets werd er zuiverder van, want
  wat er lag was het restant van twee omgevallen runs en dat is precies het geval dat niet mag
  opschuiven. Leid zo'n premisse dus af op het MOMENT van toetsen in plaats van hem te stellen.
  Zelfde familie als "een gepind getal over de HUIDIGE VORM van gereedschap is een uitspraak
  over het HEDEN", nu binnen één ronde.
- **Een herhaling die de as VASTZET waarop het verschijnsel leeft, meet niets — en "identiek" leest
  dan als bewijs.** Stel eerst vast welke EENHEID varieert, en herhaal op díé as. Aanleiding: punt
  36 valt per SCENARIO uiteen, en vier sweeps van hetzelfde scenario rug aan rug gaven 72 van de 72
  byte-identiek, terwijl dezelfde drie scenario's mét de tien andere ertussen 24 van de 93 lieten
  bewegen — dezelfde code, dezelfde sessie. Zelfde familie als "toets een per constructie
  onbereikbaar op de ruimte waarin de app WERKT": daar was de meetruimte te smal, hier de
  herhaling.
- **Een A/B-meting rond een race moet aantoonbaar AAN WEERSZIJDEN van die race liggen.** Meet de
  afstand tussen je meetmoment en de gebeurtenis die je wilt betrappen vóór je de opzet vertrouwt.
  Aanleiding: `settle()` keert pas terug als de sync én de herbouw klaar zijn — gemeten 1723 tot
  2825 ms ná de laatste sync-respons, in 22 van de 22 gevallen — dus A en B waren allebei
  ná-lezingen en "A gelijk aan B" kon per constructie niet anders dan slagen.
- **Een wachtlus die op de HELE tijdlijn matcht, vindt de gelijksoortige gebeurtenis van een EERDERE
  stap.** Anker een wachtvoorwaarde op het venster ná de markering waar hij bij hoort; anders keert
  hij onmiddellijk terug zonder ooit gepolld te hebben, en meet alles erachter iets anders dan je
  denkt. Aanleiding: de punt-36-probe zocht de sync-responsen van de 01-week-load (+10719 en
  +10829) en pakte die van de bewijsweken-lus (+1597 en +1727). Kwam binnen als CC-vondst.
- **Fixtures die dezelfde OPSLAGSLEUTEL delen, meten elkaar.** Tel vóór een meetreeks hoeveel
  schrijfacties op hoeveel unieke sleutels landen. Aanleiding: de elf harness-scenario's doen 33
  weekplan-schrijfacties op 7 unieke week-sleutels, en week 2026-07-13 krijgt er tien — elk met een
  ander doel, andere plannerdagen of een andere blokweek. Elk scenario leest via de recency-seed en
  de blok-terugblik terug wat het vorige achterliet.
- **Een toets die op ONGEWIJZIGDE code groen staat, beslist niets.** Een gedeelde toestand kan naar
  een VAST PUNT convergeren, en dan meet een herhaal-toets alleen nog dat vaste punt in plaats van
  het verschijnsel. Toets daarom vóór je op zo'n meting stuurt of hij ZONDER ingreep rood is; is
  hij dat niet, dan is er een andere AS nodig. Aanleiding: ROADMAP punt 36, waar de drie-cycli-
  toets uit het punt zelf op ongewijzigde code 93 van de 95 identiek gaf, terwijl diezelfde toets
  een dag eerder 24, 16 en 24 afwijkingen gaf — de weekplan-tabel was intussen op n=9 en 40061
  tekens blijven staan. De as die het wél deed was de VOLGORDE van de scenario's in plaats van het
  aantal herhalingen: omdraaien gaf 77 van de 95 met 16 bewegende shots. Zelfde familie als "een
  nieuw vangnet moet aantoonbaar ROOD zijn zonder de fix", nu op een toets die uit een GEPIND
  DOCUMENT komt in plaats van uit de eigen bouw — en juist daar wordt hij niet meer nagelopen.
- **Een premisse over wat een eerdere bouw ACHTERLAAT, toetst de VOLGORDE van de lussen en niet
  alleen hun bestaan.** Aanleiding: de wis-lus van punt 36 draait VÓÓR de bewijsweken-lus, dus die
  laatste schrijft de weekplan-rijen daarna gewoon terug. De verwachting "nul terugblik-blokken in
  de shots" gaf 88 van de 96. Zelfde familie als "een premisse over de staat van de schijf kan
  binnen je EIGEN prompt verouderen", nu op de volgorde binnen één bestand in plaats van op de
  tijd. EN DE TWEEDE HELFT IS DE REDDING: die verwachting stond als VERWACHTING met een
  stop-conditie en niet als acceptatie-eis, dus een foute voorspelling leverde een MEETING op in
  plaats van een gate op iets dat nooit fout was. Schrijf een voorspelling dus als verwachting,
  niet als eis, zolang je hem niet hebt gemeten.
- **De noemer van een PER-PLEK-eis is het aantal plekken dat de eis KAN raken.** Aanleiding: het
  scenario `v7` las als "bewogen 8 van 13" en dus niet-gehaald, terwijl vijf van die dertien shots
  extra routes zijn — Niveau, Activiteiten, Instellingen, Weekplanner en Events — die het
  blok-terugblik-blok per constructie niet tonen en dus terecht stilstaan. De eis was wél gehaald;
  de noemer was fout. Zelfde familie als "een uitslag noemt teller, noemer en uitsluiting met
  reden", nu op de EIS in plaats van op de uitslag.
- **INERT BIJ HET INGESTELDE DOEL IS GEEN GROND OM EEN BOUW UIT TE STELLEN.** Datzelfde staat al
  onder *Prod en veiligheid* voor de DEPLOY, en het geldt net zo goed voor de BOUWVOLGORDE. De
  canon maakt het model doel-onafhankelijk — M9 (geen aparte modus), M21 en M22 (de doelgroep is
  de amateurfietser), M33 (een doel bestaat alleen als het model het kan meten en bedienen) — dus
  "bij doel X gebeurt er niets" is een grens op het BEWIJS en nooit op de bouw. EN DE TWEEDE HELFT
  IS DE VAL WAARIN DE CHAT LIEP: het verbod op vooruit-bedrading pleit ervoor een guard SAMEN met
  wat hij bewaakt te bouwen, niet ervoor beide uit te stellen. Aanleiding: punt 16 werd op
  07-08-2026 tot februari 2027 geparkeerd op precies die twee gronden, terwijl de meting van
  diezelfde ronde de bouw juist volledig specificeerde. Het was de DERDE keer — punt 11 en punt 13
  fase B gingen voor. Daan wees het patroon af; de bouwvolgorde staat sindsdien in
  `docs/ROADMAP.md` onder *De volgorde*, en de FOCUS-regel van een close-out wijst daarnaar.
- **EEN GENUMMERD BLOK ZEGT ZELF OF HET EEN COMMIT-PUNT IS.** Een prompt dat in Blok 1/2 en 2/2
  wordt gesplitst laat de uitvoerder anders raden of het eerste blok af is, en de canon duwt hem
  dan naar committen — de gate hoort immers vóór elke commit. Elk blok draagt daarom een
  expliciete slotregel: committen, of juist niet en waarom. EN DE TWEEDE HELFT STAAT AAN DE
  CHAT-KANT: leid de uitvoeringsstand nooit af uit een ARTEFACT. Aanleiding: Blok 1 van de
  punt-16-close-out eindigde op `git diff --stat` zonder te zeggen dat het geen commit-punt was;
  CC draaide de gate en committe, wat juist was. De chat las daarna de bestandslijst van die
  commit, zag twee opgedragen bestanden ontbreken en concludeerde dat CC ze had overgeslagen —
  terwijl Blok 2 eenvoudigweg nog niet gedraaid was. Er is toen een reparatie-prompt geschreven
  op een aanleiding die niet bestond; Daan ving het. Zelfde familie als "een premisse over de
  staat van de schijf kan binnen je EIGEN prompt verouderen", nu op de VOLGORDE van de blokken
  in plaats van op de tijd.
- **EEN VERGELIJKER DIE NOOIT IS AANGETOOND EEN VERSCHIL TE KUNNEN MELDEN, CERTIFICEERT GEEN
  GELIJKHEID.** IJk hem in TWEE richtingen, en met HETZELFDE script dat de uitslag levert — een
  ijking op een ander script bewijst niets over de vergelijking die telt. Aanleiding: "nul
  bewegende shots" werd pas een uitspraak nadat `out/v2` tegen `out-vorige/v4` 0 van de 8
  identiek gaf en `out/v2` tegen zichzelf 8 van de 8. Zelfde familie als "een controle die per
  constructie kan slagen, controleert niets", nu op het INSTRUMENT in plaats van op de eis. Dit
  is een LAAG BOVENOP "een harness die zelf schrijft, verzadigt zijn eigen invoer": die regel
  ijkt de HARNESS op twee gelijke runs, deze ijkt de VERGELIJKER die dat oordeel velt.
  EN DE TWEEDE HELFT STAAT OP DE PADEN: de VERSCHIL-richting van zo'n ijking moet op bomen
  liggen die DEZELFDE bestandsnamen dragen, anders vergelijkt hij geen enkele byte. GEMETEN:
  `out-prod` tegen `out` gaf 0 van de 0 vergeleken, met alleen-links 16 en alleen-rechts 96 —
  prod schrijft onder `prod/` en lokaal onder `v7/`, dus er viel niets te vergelijken en er was
  nul bewijs. Met `out-prod/prod` tegen `out/v7` gaf dezelfde vergelijker 4 van de 16 identiek
  en 12 bewegend. Een ijking zonder overlappende paden is precies de LEGE CONTROLE die deze
  regel moest uitsluiten: hij meldt keurig verschillen, maar geen enkel byte-verschil. Kwam
  binnen als CC-afwijking bij de prod-begrenzing van punt 33.
- **ÉÉN CONDITIE KAN MEERDERE FOUTVORMEN DRAGEN.** Plaats een poort op de plek die ze allemaal
  ziet, nooit op de vorm die je toevallig in het veld zag. Aanleiding: punt 37 noemde één
  foutvorm, `still loading after settle`; gereproduceerd gaf dezelfde conditie
  `page.goto: net::ERR_CONNECTION_REFUSED` en `page.waitForSelector: Timeout 60000ms exceeded`
  op `#root > *`, en géén van beide was de punt-24-melding. Een poort binnen `settle()` — de voor
  de hand liggende plek — had er twee van de drie gemist. EN DE TWEEDE HELFT: een NETTE stop
  reproduceert de CONDITIE, niet de OORZAAK. `preview_stop` sluit de poort keurig af; het stille
  sterven in het veld doet dat niet. Citeer zo'n meting dus nooit als bewijs OVER de oorzaak —
  ze zegt wat de harness doet als een origin wegvalt, niet waaróm hij wegviel.
- **Een uniciteits-claim noemt het NIVEAU waarop hij geldt.** Uniek op PAGINA-niveau is niet
  uniek op ELEMENT-niveau, en een eis die op het verkeerde niveau telt is per constructie
  onhaalbaar. Aanleiding: `aria-label="Sluiten"` staat VIER keer in `apps/web/src`, waarvan TWEE
  in `RideDetailSheet.tsx` zelf — de scrim op `:104` en de sluitknop op `:143`, die altijd samen
  renderen zodra de sheet open is. Het prompt noemde alleen `:104` en eiste "precies één
  element", terwijl een correct geopende sheet er twee levert; de shot zou dus altijd gooien op
  precies het geval dat hij moest bewijzen. De grep die dat had moeten vangen WAS gedraaid en gaf
  beide treffers — de kwalificatie viel weg tússen meting en prompt. Zelfde familie als "een
  grep-EIS toets je tegen de echte trefferverdeling vóór je hem verstuurt", nu op het NIVEAU van
  de telling. EN DE VERVANGING IS DE EIGENLIJKE LES: tel geen INCIDENTEEL aantal, bewijs de
  TOESTANDSOVERGANG. "Precies twee" zou de scrim-knop dragend bewijs maken; wat het wél doet is
  nul vóór de klik en meer dan nul erna, plus een uitsluiting van de twee andere takken
  (`loading` `:163`, `error` `:177`, `ready` `:194` zijn uitputtend en sluiten elkaar uit).
  Dat sloot meteen een gat dat de oorspronkelijke assertie liet staan: een sheet die opent maar
  waarvan de fetch faalt, haalde die assertie en had een foutkaart als bewijs gefotografeerd.
  Kwam binnen als CC-stop.
  TWEEDE AANLEIDING, en die ligt in de DOM in plaats van in de codebase. Een render-assertie
  selecteerde op `textContent`, en in JSX draagt een WRAPPER-element dezelfde `textContent` als
  het BLAD-element erbinnen. Alleen het blad draagt de inline stijl, en `querySelectorAll` geeft
  documentvolgorde, dus de eerste treffer is de wrapper met een LEGE kleur: de assertie slaagde
  om de verkeerde reden en pas de tegenkant viel. De reparatie is dezelfde als de eerste keer —
  selecteer het BLAD en eis dat er precies ÉÉN is. En de vindplaats is de eigenlijke les: de
  chat had die JSX gelezen en de wrapper letterlijk zien staan; de kwalificatie viel opnieuw weg
  tussen LEZEN en SCHRIJVEN. Twee keer dezelfde route, twee keer op een ander niveau.
- **Wie een tak van MELDEN naar STOPPEN tilt, ruimt de meld-machinerie op.** Een administratie
  die achter een conditie staat die voortaan per constructie onwaar is, is dode code — en ze
  leest als een levende mogelijkheid. Aanleiding: met de harde stop op een gekapte shot werden
  drie resten dood: het `capped`-veld in het return-object, de `, CAPPED` in de `.txt`-kop en de
  ` CAPPED` in de samenvattingsregel. Ze zijn weg, en de gerenderde uitvoer bewoog er niet door,
  want de `.txt` wordt na de throw nooit meer geschreven. Zelfde familie als "vooruit-bedrading
  is dode code met een nettere naam", nu ACHTERAF in plaats van vooruit. Kwam binnen als
  CC-afwijking.
- **Bewegen twee bekende verschijnselen op dezelfde meetas, laat de VERGELIJKER het onderscheid
  dragen.** Met de hand is dat een oordeel per shot en dus een handlijst; mechanisch is het een
  kolom. Aanleiding: het ijkpaar van deze ronde gaf ELF bewegende shots, en pas de
  innerText-classificatie in `tools/shots/vergelijk.mjs` splitste ze zonder rest — ACHT met
  VERSCHILLENDE innerText (punt 36, het plan beweegt) en DRIE met GELIJKE innerText (punt 23 en
  de opgeheven cap, dus puur pixel). Zonder die kolom is een uitslag op zo'n as niet toe te
  wijzen, en werd ze per shot met de hand geveld.
- **DE INGREDIËNTEN VAN EEN VERSCHIJNSEL ZIJN NIET HET VERSCHIJNSEL.** Een mechanisme waarvan
  alle onderdelen aanwijsbaar aanwezig zijn is juist daarom overtuigend, en dat is precies de
  val: aanwezigheid van de onderdelen bewijst niet dat ze ook samenvallen. Meet het VENSTER
  leeg of vol vóór je er een verklaring op bouwt. Aanleiding: bij punt 36 vond LEZEN een
  fire-and-forget schrijfactie (`schema.ts:1283` en `:1289`) met een navigatie erachter, en de
  conclusie "race" lag voor de hand. METEN gaf 0 na-settle-requests over 25 zaai-loads maal twee
  runs, 0 `PUT /api/weekplan/`, 0 afgebroken, met een sluitende identiteit aan beide kanten. Het
  venster is per constructie leeg; de race bestond niet. Zelfde familie als "draai het", nu op
  een mechanisme dat plausibel is juist ómdat alle onderdelen er zijn.
- **`pnpm --filter <pakket> add -D <dep>` KAN DE WORKSPACE-LINKS BREKEN.** GEMETEN bij punt 33:
  na het toevoegen van `jsdom` aan `apps/web` was `@cloudflare/vitest-pool-workers` in
  `workers/api` onvindbaar en kon vitest GEEN ENKEL project meer initialiseren — de fout leest
  als een kapotte config terwijl er niets aan een config veranderd is. Eén kale `pnpm install`
  herstelt het. REKEN ER OOK OP DAT DE LOCKFILE-DIFF GROTER IS DAN DE ENE DEPENDENCY: 327
  regels voor jsdom alleen. Meld dat in het rapport in plaats van het als afwijking te
  behandelen of de diff te willen inperken — de lockfile hoort de werkelijke resolutie te
  dragen, niet een opgeschoonde versie ervan.
- **EEN DOCUMENT DAT TE GROOT WORDT OM BINNEN TE HALEN, VERLIEST ZIJN STAART ZONDER HET TE
  MELDEN.** GEMETEN: de wijzigingslog-regel is TWEE close-outs op rij door de chat vergeten en
  beide keren door CC aangevuld. De oorzaak is niet onoplettendheid maar een GEPASSEERDE
  DREMPEL — de eis stond NERGENS als instructie (0 treffers in de close-out-sectie, 0 in
  `CLAUDE.md`, 1 in heel dit document en dat was de kop zelf), dus hij leefde uitsluitend als
  IMITATIE van de 106 bestaande logregels. Zolang de fetch die regels haalde, kopieerde elke
  chat de gewoonte. De fetch van 7 augustus 2026 kapte af op regel 1028 van 1092, waarmee alle
  59 augustus-regels buiten beeld vielen en de gewoonte onzichtbaar werd. CC heeft dat probleem
  niet: hij leest van schijf.
  HET ZWAARDERE GEVOLG, en dat is de reden dat dit gerepareerd is in plaats van genoteerd: de
  norm-tekst eindigde op 114607 bytes en de afkap lag rond 121000, dus de marge was ongeveer
  6 kB terwijl de lessenlijst elke ronde groeit. Nog een paar lessen en de opener had de
  GATE-sectie, de vijf promptcontroles en het opener-sjabloon verloren — zonder enig signaal.
  VOLGT HIERUIT ALS WERKREGEL: wat een chat bij elke start MOET lezen blijft in de norm; alles
  wat alleen achteraf verantwoordt, verhuist naar een eigen bestand.
- **EEN "PRECIES ÉÉN KEER"-EIS OVER EEN VERHUIZING VERONDERSTELT DAT DE BRON UNIEK IS.** Wat
  "niets verloren, niets verdubbeld" werkelijk uitdrukt is MULTISET-gelijkheid: de telling per
  distincte regel blijft gelijk over de twee bestanden samen. Draagt de bron al dubbele regels, dan
  meldt de strikte vorm afwijkingen die geen verlies en geen verdubbeling zijn, en stopt de
  uitvoerder terecht op een eis die zelf niet klopte. Aanleiding: bij de HANDOFF-rotatie van punt 38
  stonden NEGEN distincte regels er al 2 tot 5 keer — vooral identieke `OPENSTAAND,
  ONGEWIJZIGD`-bullets — samen 23 voorkomens waarvan 14 overtollig, en de strikte toets meldde die
  23 als fout. De multiset-toets gaf 0. Bij de lessen-helft maakte het geen verschil, want daar zijn
  alle 775 niet-lege regels uniek, en juist DAAROM hield de log-verhuizing met dezelfde formulering
  stand: die 106 regels waren toevallig uniek, dus de vorm was door geluk goed en is overgenomen
  zonder de verdeling te tellen. Tel de verdeling in de BRON vóór je de eis verstuurt. Zelfde
  familie als "een grep-EIS toets je tegen de echte trefferverdeling vóór je hem verstuurt" en "een
  uniciteits-claim noemt het NIVEAU waarop hij geldt". Kwam binnen als CC-afwijking en is strikt
  beter dan wat het prompt vroeg.
- **Een oordeel over KARAKTER leest de BLOKKEN, niet het sessie-TYPE.** Een typenaam zegt welke
  bouwer draaide, niet in welke zone de minuten liggen — en juist de zone draagt elk oordeel over
  karakter-invariantie (M74, M76). Aanleiding: bij punt 19 velde de chat TWEE keer een fout
  karakteroordeel op grond van `voorgesteldType`. Eerst heette de herstelweek "een week grijs
  rijden", terwijl er nul minuten Z3 in staat: de Recovery-ritten liggen rond 59 procent FTP en de
  lange rit op 63 tot 72 procent, dus Z1 en Z2. Daarna heette het "het karakter verandert", terwijl
  de overgebleven kwaliteitsdag zijn drempelblokken op 98 tot 105 procent FTP gewoon behoudt en
  alleen zijn dosis halveert van 18 naar 10 minuten — precies wat M76 voorschrijft. Eén blik op
  `blokken` met hun `pctLo`/`pctHi` had ze allebei voorkomen; die stonden in dezelfde meetuitvoer
  en zijn niet gelezen. Daan ving ze allebei. EN DE TWEEDE HELFT ZIT IN HET LABEL ZELF: `drempel`
  dekt zowel 89-92 als 98-105 procent FTP en loopt dus dwars door de LT2-grens waarop de
  TID-modellen zich onderscheiden — een label dat twee zones dekt kan per constructie geen
  karakteruitspraak dragen. Dat is ROADMAP punt 40. Zelfde familie als "citeer een meting met het
  predicaat dat gemeten is", nu op de GROOTHEID in plaats van op de formulering.
- **Een SIGNATUUR die meer omvat dan de grootheid waarover je claim gaat, meldt afwijkingen
  die er geen zijn.** Definieer hem op precies dat wat de claim draagt, en niets eromheen.
  Aanleiding: bij punt 42 telde de bandsignatuur ALLE distincte banden van een sessie,
  inclusief de Z2-vulblokken, en gaf 8 afwijkende groepen van de 200 — wat leest als
  percentage-schaling en dus als bevestiging van M78. Die acht bleken het aan- of afwezig
  zijn van een `65-65` vulblok bij `sweetspot_long_climb`, `vo2_hill_repeats` en
  `threshold_2x20`, terwijl de werkbanden `89-93`, `112-118` en `95-100` alle drie stilstonden.
  Op de WERKband — het zwaarste blok van de sessie — is het 200 van de 200. De claim ging over
  het karakter van de prikkel; de vulling hoorde er nooit in. Zelfde familie als "citeer een
  meting met het predicaat dat gemeten is", nu op de MEETGROOTHEID in plaats van op de
  formulering.
- **Een as die je denkt te sturen, kan aan een andere variabele hangen — lees hem af vóór je
  hem beweegt.** Aanleiding: de macrofase leek via de eventdatum te sturen, zoals de
  punt-40-meting hem beschrijft. GEMETEN over tien eventdata van 1 tot 38 weken bleef
  `macroFase` onveranderd op "Build"; alleen `fase` kantelde naar Taper op één week. De grond
  staat in `effectiveMacroFase_`: de event-as wint alleen bij Recovery, of binnen
  `EVENT_OVERNAME_WEKEN` ÉN met `overnameBevestigd === true`. Zonder bevestiging stuurt
  `computeMacroPhase` vanaf `doelStart` — die dus fase én mesoweek tegelijk zet, waardoor de
  bereikbare ruimte TWAALF gekoppelde paren is en geen kruisproduct. Een sweep die de
  veronderstelde as beweegt had 420 cellen op één fase gemeten en dat als dekking gelezen.
  Zelfde familie als "enumereer met de functie die de app zelf aanroept", nu op de INVOER-as.
- **Een gerapporteerde reeks zonder haar fixture-definitie is geen ijkpunt.** Ze is niet te
  herhalen, dus niet te weerleggen en niet te vergelijken — en ze leest tóch als een meting.
  Wie een reeks in een document zet, zet de vormen erbij. Aanleiding: de TID-reeks van punt 41
  (3,0u 62/38/0 tot 12,0u 84/12/3) stond in `docs/ROADMAP.md` én in
  `docs/PUNT19-DELOAD-RECON.md`, maar de zes weekvormen waarop ze gemeten was staan NERGENS in
  de repo — één grep op de urenlabels geeft alleen de twee vindplaatsen van de reeks zelf. De
  hertoets moest daarom een eigen volume-as vastleggen, en de oude reeks is geen vergelijkings-
  basis maar alleen een aanleiding. Zelfde familie als "een gepind getal over de HUIDIGE VORM
  van gereedschap is een uitspraak over het HEDEN", nu op de MEETOPSTELLING.
- **Een BEVINDING die op EEN punt van een as is gemeten, kan aan het andere uiteinde van
  RICHTING kanteren.** Dit is scherper dan "een uitspraak over wat de gebruiker merkt die op
  EEN cel gemeten is": daar viel een kwalificatie weg, hier keert het VERDICT om. Toets een
  defect-claim daarom over de hele as vóór je hem als universeel behandelt, en vraag expliciet
  waar het MECHANISME dat het defect draagt vandaan komt. Aanleiding: M80 stelt vast dat de
  herstelweek in de frequentie snijdt in plaats van in het volume, gemeten op Daans weekvorm van
  4,75 uur. Over de volume-as W1..W7 houdt de bevinding stand op de vorm — 28 van de 28 cellen
  krimpen tussen 0,1 en 10,8 procent waar M79 om 40 tot 60 vraagt — maar het aandeel
  weekbelasting uit duurdagen loopt van 9 procent bij 3,0 uur naar 46 bij 14,0. Bij drie uur
  leveren alle duurdagen samen 16 TSS op een week van 168, dus daar is de volume-ingreep
  grotendeels leeg en doet de app ongeveer het juiste. Een fix die op de bevinding alleen was
  gebouwd, had onderin een week van 108 minuten opgeleverd zonder grond.
- **Bij een COACH-CANON-vraag is de VAKLITERATUUR een bron, en die gaat VOOR een popup.** Een
  popup hoort bij een keuze die alleen Daan kan maken; hij hoort NIET bij een vraag waarover een
  vakgebied al geschreven heeft, want dan legt hij leeswerk terug dat de chat had moeten doen.
  Zelfde familie als "een plan eindigt op een BESLUIT" in `docs/WERKWIJZE.md`, nu op de BRON in
  plaats van op de vorm. Aanleiding: op de vraag hoe diep een herstelweek bij vijf uur hoort te
  snijden, stelde de chat een popup met vier opties. Daan wees hem terug met de opmerking dat de
  methodiek gewoon online staat, en dat klopte: de taper-meta-analyses geven 41 tot 60 procent
  minder volume zonder wijziging van intensiteit of frequentie, en wijzen KORTERE SESSIES
  expliciet aan boven MINDER sessies. Dat laatste corrigeerde het advies van de chat — een
  duurcap per dag schrapt bij korte weken feitelijk ritten — naar een factor op de sessieduur.
  De popup had een slechter ontwerp bevroren.
- **Een VINGERAFDRUK die een veldnaam mist, is BLIND voor dat veld — en "identiek" leest dan als
  bewijs.** Een verkeerd gespelde sleutel levert `undefined` aan BEIDE kanten, dus de
  vergelijking blijft formeel geldig terwijl ze de grootheid niet meer ziet; niets faalt, en dat
  is precies het probleem. Dump één voorbeeldrij en LEES hem voor je een reeks vertrouwt.
  Aanleiding: de plek-meting van punt 39 las het blokveld als `min` en het sessieveld als
  `type`, terwijl ze `minuten` en `focus` heten. Elke blokduur stond daardoor als `undefined` in
  elke reeks — en juist de DOSIS was wat de meting moest wegen. Gevonden bij het inspecteren van
  een enkele sessie, niet door een falende toets; alle uitslagen zijn daarna opnieuw gedraaid en
  hielden stand. Zelfde familie als "een anomalie in je eigen meetuitvoer is een gat in je
  INSTRUMENT", nu op een veld dat STIL leeg blijft in plaats van opvallend nul.
- **Een bouwspec die KANDIDAAT-PLEKKEN opsomt, heeft de plekken niet geteld.** Grep waar de
  grootheid werkelijk geconsumeerd wordt vóór je de lijst overneemt: valt een keuze op twee
  plaatsen, dan zijn het drie plekken en niet twee, en de verkeerde ervan is per constructie
  inert. Aanleiding: punt 39 noemde client-side en "engine, vóór de bouwers". Maar de keuze valt
  óók binnen `allocateQualityWeek_` via `draagkracht_`, dus die tweede formulering is ambigu. De
  engine-patch NA de allocator gaf **84 van de 84 identiek** aan de client-patch — de allocator
  had al gekozen. Die "identiek" was geen bevinding maar een te laat geplaatste patch; alleen
  VOOR de allocator beweegt er iets, en juist die plek schendt M76. Zelfde familie als "een
  bereikbaarheids-premisse noemt élke poort op het pad", nu op de INGREEP in plaats van op de
  meting.
- **Een regel die een REDUCTIE voorschrijft, noemt zijn REFERENT.** Een percentage zonder
  referent landt op de grootheid die toevallig voorhanden is, en dat is zelden de bedoelde — hij
  stapelt dan op een krimp die er al was. Aanleiding: M86 legde de factor vast (0,75 aflopend
  naar 0,55) maar niet waaróp. Gemeten landt hij op de INGEVULDE beschikbaarheid van de
  herstelweek zelf, dus wie die week drie uur heeft in plaats van zijn gebruikelijke vijf krijgt
  **2 uur 15** terwijl die drie uur al binnen de band van M79 ligt. De vraag kwam van Daan en
  niet uit de meting: de meetruimte hield het weekvolume PER CEL vast en kon het geval dus per
  constructie niet bevatten. Staat nu als M87 en als ROADMAP punt 45.
- **Een rood-meting die NIETS laat vallen kan betekenen dat de FIXTURE-FAMILIE de conditie niet
  KÁN dragen, in plaats van dat de term ongedekt is.** Toets vóór je een term als onbewezen
  wegzet of er een fixture BESTAAT waarin zijn conditie true kan worden; is die er niet, dan meet
  je niets over de term maar iets over je eigen meetruimte. Aanleiding: de `nearTaper`-term van
  punt 39 liet in de rood-ronde niets vallen, en dat las als NIET-GEDEKT. Geen van de vijf tests
  droeg een event, dus `nearTaper` kon er per constructie niet true worden. Met een event in de
  lopende week bestaan `mesoWeek 4` én `nearTaper true` wél naast elkaar, en met de term uit zakt
  diezelfde week van **300,2 naar 231,2** minuten in alle drie de deload-paren — de term is dus
  gewoon gedekt. Zelfde familie als "een term kan GEMASKEERD zijn door een andere term", nu op de
  MEETRUIMTE in plaats van op een tweede voorwaarde.
- **Een acceptatie-eis die een ABSOLUTE waarde noemt, toets je tegen de VOOR-STAAT en niet tegen
  de eis.** Anders leest een bestaande eigenschap als een regressie van je eigen bouw, en ga je
  repareren wat er al was. Aanleiding: de eis "kwaliteitsdagen ongewijzigd op 1" gaf bij doel
  Conditie **0** in 14 van de 84 cellen — óók vóór de bouw, want voor tegen na is 84 van de 84
  identiek. De eis stond op de WAARDE waar hij op het VERSCHIL hoorde te staan. Dit is de TWEEDE
  familie die zo boven kwam: de plek-recon vond de eerste (macrofase Test, quotum 0) al vóór de
  bouw, en juist dát had de VORM van de eis moeten corrigeren in plaats van er een uitzondering
  bij te schrijven. Eén tegenvoorbeeld op een absolute eis is een signaal over de eis zelf.
- **EEN CONTROLEREGEL IS ZELF EEN COMMANDO, en een commando dat niet kan DRAAIEN is niet te
  onderscheiden van een geslaagde controle.** De vijf promptcontroles toetsen of iets BESTAAT; ze
  toetsen niet of het toetsende commando uitvoerbaar is. Aanleiding: een premissenregel in een
  CC-prompt droeg tweemaal `-Path` en was als PowerShell ongeldig. De VINDPLAATS klopte — de
  gezochte tekst stond er, op de genoemde regel — dus controle 1 was gedraaid en gaf groen,
  terwijl de regel die hem in CC moest toetsen niet kón draaien. CC ving het en las de bedoeling
  correct; het kostte niets. Maar de VORM is het gat: een niet-draaiende controle meldt zichzelf
  niet, en groen-omdat-hij-niet-liep is niet te onderscheiden van groen-omdat-hij-slaagde. Zelfde
  familie als "een controle die per constructie kan slagen, controleert niets", nu op de
  UITVOERBAARHEID in plaats van op de uitkomst. WERKREGEL: elke premissen- of controleregel die
  als commando in een prompt gaat is een GELDIG commando in de doelshell — één `-Path`, geen
  dubbele parameters — en de chat leest hem na ALS COMMANDO, niet alleen als bewering. Dit is
  bewust GEEN zesde promptcontrole: dat maximum staat op vijf met een reden, en dit is een
  eigenschap van hoe controle 1 wordt OPGESCHREVEN, niet een nieuwe controle.
- **Een KANDIDAAT die een EIGENSCHAP van een object noemt, toetst eerst of dat object die
  eigenschap DRAAGT.** Grep de producenten en tel de velden vóór je erop bouwt; anders schrijf je
  een reparatie die op de verkeerde LAAG leeft en die per constructie niet client-only kan zijn.
  Zelfde familie als "een bouwspec die KANDIDAAT-PLEKKEN opsomt heeft de plekken niet geteld", nu
  op de GROOTHEID in plaats van op de plek. Aanleiding: punt 43 ronde 1 wees als kandidaat aan
  "poorten op `sweetspot_*` tegenover een vulblok zonder `archetypeId`", terwijl een blok over alle
  14 producenten exact vier velden draagt — `minuten`, `zone`, `pctLo`, `pctHi` — en de bedoeling
  op het ARCHETYPE staat (`effectTags`) en op de SESSIE (`archetypeId`). Op sessie-niveau gepoort
  bleef 121 van de 122 lek-cellen staan, want de vulling zit ook binnen werksessies, en de poort
  werd op 84 dagen SMALLER doordat 2701 minuten echt drempelwerk uit sessies zonder `archetypeId`
  komen. Het punt had zijn eigen oplossing niet gemeten.
- **Een REEKS uit een vorige ronde is pas een ijkpunt als haar SCRIPT in de repo staat — een
  fixture-BESCHRIJVING is niet genoeg.** Dit is scherper dan "een gerapporteerde reeks zonder haar
  fixture-definitie is geen ijkpunt": daar ONTBRAK de definitie, hier stond ze er, is ze gevolgd,
  en reproduceerde de reeks tóch niet. Aanleiding: `docs/PUNT43-POORT-RECON.md` §1 beschrijft de
  meetopstelling volledig; nagebouwd geeft hij 21 van de 21 op de ijk-as, 420 cellen en 1920
  sessies identiek, alle negen band-aandelen en band-labels van §3 exact — en tóch 266 cellen met
  sweetspot-werk tegen 278, en 161/90/15 tegen 146/117/15. Het verschil is variant-rotatie, en het
  is met de beschrijving alleen niet te herleiden. Twee onafhankelijke definities van de teller
  gaven exact hetzelfde, dus de definitie was het niet. WERKREGEL: wie een reeks in een document
  zet waarop een volgende ronde moet voortbouwen, commit het meetscript erbij; en wie een reeks
  erft, ijkt zijn eigen instrument en gebruikt geen enkel geërfd getal als EIS.
- **Poort-inert is niet hetzelfde als correct gevlagd.** Een veld dat de uitvoer vandaag niet kan
  raken mag daarom nog niet verkeerd staan: de volgende consument erft de SEMANTIEK, niet de
  inertie. Aanleiding: punt 43, de bouwspec zette `coreWork` op elke core-regel, waardoor 473
  intra-rust-blokken van `sweetspot_pyramid` en de over-unders (puntbanden op 50 en 55 procent) de
  werkvlag kregen. Poort-inert, want een puntband in rust opent geen werkzone — en dat is in de
  spec als "geen probleem" weggeredeneerd in plaats van als "verkeerd gevlagd". Grens erbij in
  `packages/engine/src/archetypes.ts`; ALLE acceptatiegetallen bleven identiek.
- **Een metriek hoort op de KORREL van zijn consument.** Aanleiding: punt 43 mat verdamping eerst
  op dagkorrel en kwam op 22,5 procent, terwijl `apps/web/src/lib/blok.ts` op WEEKkorrel oordeelt
  en daar 9,5 procent ziet. Die eerste uitslag is ingetrokken. Meet je fijner dan de consument
  leest, dan meet je een grootheid die niemand gebruikt.
- **Een poort die in de METING via een proxy is gedefinieerd, is niet de poort die zijn naam draagt
  in de IMPLEMENTATIE.** Aanleiding: punt 43 ronde 2 mat `PH_core` op archetype-core-banden; de
  implementatie poort op elk blok met de vlag, en `renderVariant_` levert die ook. De proxy kon die
  producent per constructie niet zien — precies waar het `73-77`-lek uit `z2_progressief` zat.
- **Een fixture waarin een OR-term per constructie leeg is, meet de disjunctie niet.** Aanleiding:
  punt 43, `voorgesteldType` is in de meetopstelling op alle 1920 sessies null, dus de intent-term
  van `sleutelinhaal.ts` is 0 en de 360 van de 360 uit punt 40 is er niet mee vergelijkbaar.
- **Een testgeval dat op VERDAMPING leunt, verliest zijn grond zodra een latere ronde de poort
  verbreedt.** Verplaats het dan naar een blok dat de claim nog draagt; verzwak het nooit.
  Aanleiding: `apps/web/src/lib/punt15.test.ts` isoleert term 2 van de conjunctie op FTP/Build, en
  na punt 43 dekt de poort daar de hele vraag (95 van de 95) — verplaatst naar Korte
  beklimmingen/Build, poort {drempel, anaeroob}, gevraagd 69, beoordeelbaar 65.
- **Een prompt met een placeholder is een prompt met een fout.** Past de inhoud niet in één bericht,
  dan genummerde blokken voor dezelfde CC-sessie — nooit een verwijzing naar een bericht dat CC niet
  kan zien. Aanleiding: punt 43 ronde 3 blok 1 verwees naar "mijn volgende bericht"; CC draaide de
  premissen en STOPTE, in plaats van een meetdocument te verzinnen.
- **Een health-endpoint zonder versieveld bewijst dat de Worker LEEFT, niet welke bundel eronder
  zit.** Verifieer een deploy daarom op BUNDEL-IDENTITEIT: haal de live `index.html` op, lees het
  asset waar hij naar wijst, en vergelijk dat byte-voor-byte met de lokale build. Aanleiding: de
  deploy van punt 43 — `/api/health` gaf `{"ok":true,"service":"cadans-api"}` en verder niets;
  `assets/index-BoCic_Ah.js` was 584155 bytes en sha256-identiek aan `apps/web/dist`.

<!-- EINDE docs/WERKWIJZE-LESSEN.md -->
