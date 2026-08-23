# Cadans — WERKWIJZE-LESSEN

De lessen uit recon en bewijslast. VERBATIM verhuisd uit `docs/WERKWIJZE.md` op 08-08-2026, omdat
dat document tegen de afkapgrens van de opener-fetch aan liep. Er is geen letter gewijzigd.

De NORM staat in `docs/WERKWIJZE.md` en wint bij tegenspraak; dit bestand draagt de
BEWIJSLAST-regels waarop die norm rust — de regels over de VORM van bewijs, die aan geen enkel
stuk gereedschap hangen en dus niet verouderen. De andere helft staat sinds 10-08-2026 in
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md`: alles wat aan een tool, een bestand, een commando of
een harness in deze repo hangt en herijkt moet worden zodra dat gereedschap verandert. De
opener haalt beide op. Een verwijzing hieronder naar *Prod en veiligheid*, *Beslissen* of het
*Opener-sjabloon* wijst naar `docs/WERKWIJZE.md`; een verwijzing naar een les die hier niet
staat, wijst naar de gereedschapshelft.

Een nieuwe les gaat naar HET BESTAND DAT BIJ ZIJN GROND HOORT — gereedschap daar, bewijslast
hier — met in dezelfde close-out een gedateerde regel in `docs/WERKWIJZE-LOG.md`.


- **Draai het.** Lezen levert een vermoeden, meten levert bewijs. De zwaarste uitkomsten van de auditrondes waren stuk voor stuk weerleggingen van wat lezen suggereerde: `mesoFactor` bleek vermogen te schalen in plaats van duur, en een off-by-one was met lezen alleen niet zichtbaar. Bundelroute: esbuild, buiten de repo-tree, met `TZ=Europe/Amsterdam`.
- **De klok is een fixture-variabele.** Stub `Date`. Een test die op de echte klok leunt, meet iets anders dan je denkt. TWEEDE AANLEIDING: `debtOptIn.test.ts` draaide de VOLLEDIGE pijplijn en asserteerde een `catchup`-code in het actieve plan — groen, jarenlang, uitsluitend omdat de fixture-week in het verleden lag en `allocateQualityWeek_` zich op ambient `new Date()` dateert, waardoor er geen eligible dag was en de hele week-allocator inert bleef. Een fixture-datum in het verleden zet dus stilzwijgend een hele laag uit; met de klok gepind ín de fixture-week levert dezelfde run nul catchup-codes.
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
- **Een omvallende assertie ZONDER hardcoded getal is een fixture-vraag, geen herijk-vraag.** Een relationele mechanisme-check ("A is precies één minder dan B", "X trekt niets af") heeft geen constante om 1-op-1 te verzetten. Valt zo'n assertie om, dan is óf de fixture óf het mechanisme fout — zoek de oorzaak, corrigeer de fixture, en verzwak de assertie niet. Aanleiding: de "rustige" fixture in `quotaAftrek.test.ts` was puur Z2 maar erfde de standaard-IF 0,85 van `act()`, en `recentHardDate_` noemt een rit hard vanaf IF 0,85 — die blokkeerde dus de dinsdag via avoid-consecutive-hard. Bij een quotum van 2 vielen de tellingen toevallig samen en slaagde de test om de VERKEERDE reden; pas bij 3 brak het op.
- **Een keuzeregel die per stap optimaliseert, toets je op wat hij daarna nog toelaat.** Greedy is niet fout omdat hij greedy is, maar omdat hij een keuze kan maken die het resterende budget onplaatsbaar maakt — en dat kost geen minuten maar hele SESSIES, wat een dosis-meting in minuten niet zichtbaar maakt. En de meetset draagt het gat mee: de weekvorm-as en de 48 vingerafdrukken bleven allebei groen terwijl een hele familie weekvormen een kwaliteitsdag verloor, simpelweg omdat die vorm er niet in zat. Bouw je een regel die de SELECTIE verandert, breid dan eerst de meetset uit met de vorm die de regel kan schaden; groen op een set die het geval niet bevat bewijst niets. Aanleiding: de draagkrachtterm uit stap 1b liet een lange weekenddag zijn buren blokkeren — 23 cellen minder kwaliteitsminuten en 14 cellen minder kwaliteitsdagen, alle buiten beide meetsets, gevonden doordat één selftest-fixture toevallig die vorm droeg.
- **Een nieuw vangnet moet aantoonbaar ROOD zijn zonder de fix.** Een meting die je toevoegt om een defect te vangen en die je nooit hebt zien falen, is decoratie: hij kan net zo goed langs het geval heen liggen. Zet de fix tijdelijk uit, meet, en rapporteer beide kanten. Aanleiding: weekvorm V7 werd toegevoegd als vangnet voor de blokkerende lange dag; met de bereikbaarheidsterm uit levert hij 81 kwaliteitsminuten en 2 kwaliteitsdagen, met de term 90 en 3 — pas daarmee stond vast dat de as het defect werkelijk vangt. Kwam binnen als CC-afwijking en is strikt beter dan wat de prompt vroeg.
- **Landt een fix op N PLEKKEN, dan moet de rood-test PER PLEK rood zijn.** Een gedeelde meetas kan volledig via één tak lopen en de andere per constructie verbergen; groen op de as zegt dan niets over de tak die er niet in zit. Meet elke plek los, met alleen díé plek gepatcht. Aanleiding: de weekvorm-as kon `renderVariant_` niet bewijzen — met uitsluitend `expandArchetype_` gepatcht waren de kwaliteitsminuten op trede 2 IDENTIEK en verschilde alleen de TSS met 1 op twee cellen. Per plek gemeten gaat `thr_3x15` op 90 minuten van 45 naar 51, en bewegen zes van zes kwaliteitsvarianten.
- **Toets een AFWIJZING op zijn EFFECT, niet op zijn antwoord.** Een 400-test die alleen de statuscode leest, laat de schrijfkant volledig ongetoetst: een route die netjes 400 antwoordt én tóch wegschrijft, komt er groen doorheen. Lees na de afwijzing terug wat er staat. Aanleiding: bij de dosis-trede-route is naast elke 400 geasserteerd dat er níéts is weggeschreven; kwam binnen als CC-toevoeging en is strikt beter dan wat de prompt vroeg.
- **Tel op een eigenschap die ELKE kandidaat draagt, nooit op het kenmerk van het gezochte geval.** Een filter dat instanties van X zoekt door op een MARKERING van X te matchen, kan de afwezigheid van die markering niet onderscheiden van de afwezigheid van X — en juist die afwezigheid is vaak de vondst. Aanleiding: de kwaliteitsdag-telling uit de screenshot-harness matchte op het type-label, en kaal duurwerk draagt er geen; de zaterdag van 180 minuten viel daardoor stil uit de telling. Het brak op doordat de telling tegen de PNG werd gelegd — het beeld is hier het controlemiddel op de tekst. Tel op duur en TSS, die draagt elke sessie, en classificeer pas daarna.
- **Een fixture die leeg gevoed wordt, voorspelt de app niet.** De weekvorm-as voedt `activities`, `weekplans` en `wellness` leeg; de levende D1 draagt historie, en de recency-seed kiest daardoor ANDERE varianten binnen dezelfde duur-band. Gemeten op dezelfde weekvormen: V2 389 tegen 410, V4 347 tegen 362, V7 367 tegen 375, met overal hetzelfde aantal kwaliteitsdagen — op V7 volledig verklaard door twee dagen die van sjabloon wisselen (−3 en −5). De as blijft geldig als VERGELIJKBARE reeks over bouwen heen, maar een verschil tussen as en app is geen regressie en nooit een herijk-aanleiding. Wie ze naast elkaar zet, zet er de reden bij.
- **Een render-conditie die op een AFWEZIGHEID leunt, is geen STATE.** Vertaal "er is hier niets" niet naar een state-naam zodra meer dan één state die afwezigheid kan dragen — je verliest dan stilzwijgend de andere. Toets vóór de vervanging welke states het geval kunnen dragen. Aanleiding: de rustdag-copy werd van `sessions.length === 0` naar state `rest` gebracht, waarna vandaag-zonder-trainingsdag (state `today`) zijn copy verloor en niets rendeerde. Juiste vorm is dezelfde als het origineel, alleen op de goede bron: `planSessions.length === 0`. Kwam binnen als CC-correctie op een fout in de prompt.
- **Een onbeslisbaar deel van een meting is pas een probleem als het OORDEEL eraan hangt.** Toets dat vóór je machinerie voorstelt om de onbeslisbaarheid weg te nemen — anders bouw je een oplossing voor een gat dat de beslissing niet raakt. Aanleiding: de sweet-spot-overlay loopt van 84 tot 97 procent en dus dwars over de Z3/Z4-grens op 90, en intervals levert die splitsing niet. Er lagen drie routes op tafel om dat exact te maken: custom zones, de zone-grenzen verzetten, of ritstreams ophalen. Daan wees ze alle drie af met de vraag waarom de zones van intervals niet gewoon volstonden, en hij had gelijk. Zodra gevraagd en geleverd PER ZONE naast elkaar staan in plaats van op één hoop, verschijnt grijs rijden als een Z3-overschot mét een Z4-tekort — gemeten 26 tegen 74 procent gevraagd tegenover 54 tegen 46 geleverd — en is de splitsing binnen Z3 voor het oordeel niet nodig. De onbeslisbaarheid was echt; ze was alleen niet dragend.
- **Rond ÉÉN keer af, op de grootheid die je rapporteert, en tel nooit afgeronde waarden op.** Een spec die per deel afrondt en de delen daarna optelt, produceert een getal dat nergens uit volgt en maakt een CORRECTE meting rood. De engine draagt de regel al bij `tssFromBlokken_` ("rondt EEN keer aan het eind, nooit per blok"); een spec hoort hem niet te schenden. De reparatie zit in de VORM, niet in het getal: de rekenlaag geeft onafgerond terug, assertie's toetsen onafgerond met tolerantie, en afronden is presentatie. Aanleiding: de ijk-waarde voor anaeroob stond in het fase-1a-prompt op 156 (129 + 27 + 0, per zone afgerond) terwijl de vouwing 156,6000 geeft en dus 157. CC stopte terecht vóór de commit, stelde de assertie NIET bij, en ving dezelfde fout in zijn eigen test (567 + 157 = 724 tegen een Z4+-totaal van 723). Zelfde familie als de `head_sha`-regel bij CI: een controle die per constructie scheef kan lopen, controleert niets. TWEEDE AANLEIDING, en die staat op de WEERGAVE: `expandArchetype_` (`planner.ts:1383`) telt `warm + cool + mainMin` op uit blokken die elk al op één decimaal zijn afgerond, en `WorkoutDetail.tsx:57` rendert `totaalMin` kaal — op Daans scherm staat "59.800000000000004 min". De regel geldt dus aan BEIDE uiteinden: de rekenlaag telt geen afgeronde delen op, en de renderrand rondt één keer af. De reparatie hoort daarom in de FORMATTER en niet in `expandArchetype_` — een ronding in de rekenlaag zou elke vingerafdruk laten bewegen. Staat als ROADMAP-punt 18.
- **Elk getal in een voorstel draagt zijn HERKOMST in één woord.** PLAN (bibliotheek of coach-canon), SIGNAAL (op de echte reeks geijkt, met plateau) of BELEID (een besluit van Daan). Een voorstel zonder die labels is niet reviewbaar: de lezer kan niet zien of een getal geijkt hoort te worden of juist niet. Getallen uit de eigen historie mogen alleen als bovengrens-check optreden, nooit als grond voor een regel. Aanleiding: de per-zone-norm werd als PLAN afgeleid maar de POORT-keuze eromheen sloop als SIGNAAL naar binnen, en dat viel pas op toen Daan het opmerkte.
- **Citeer een meting met het predicaat dat gemeten is.** "Nul weken struikelen ALLEEN op Z3" is niet "Z3 bindt nooit" en al helemaal niet "de Z3-poort is decoratie" — elke herformulering liet een kwalificatie vallen tot de claim onwaar was. Gemeten was 12 van de 46 weken onder de Z3-norm, nooit als enige. Verandert de formulering, dan is de claim niet meer gedekt door de meting; herhaal het predicaat letterlijk of meet opnieuw.
- **Een fixture die een POORT passeert om iets anders te kunnen meten, asserteert die passage.** Anders gaat de test stil dood zodra de poort verschuift: hij blijft groen en meet niets meer. Zelfde familie als "getest is niet aangesloten". Aanleiding: drie fixtures voedden alles in Z4 en moesten voor de per-zone-munt de vorm van de norm gaan dragen; verzet de zone-sync straks de grenzen, dan zakken ze onder norm en verdwijnt de effect-poort uit beeld zonder dat er iets rood wordt.
- **Een pad kan dood zijn aan zijn INVOER of aan zijn UITVOER, niet alleen doordat niemand het aanroept.** "Getest is niet aangesloten" dekt maar één van de drie. Een functie kan keurig aangeroepen én getest zijn terwijl de aanroeper er een vaste `null` in stopt, en een waarde kan correct berekend en in een view-model gezet worden terwijl geen enkele component hem leest. In beide gevallen faalt er niets: de grep naar de aanroep slaagt, de tests zijn groen, en de app doet het niet. Controleer daarom BEIDE uiteinden — wat geeft de aanroeper mee, en wie leest de uitkomst — en niet alleen of de verbinding bestaat. Aanleiding, twee kanten in één ronde: `coachIntentFromZones_` is aangeroepen en getest, maar `coachPlannedArg_` geeft er `segmenten: null` in mee, waardoor de hele zone-afleiding van de geplande prikkel dood is en een chat-diagnose op de verkeerde plek landde; en `adapt` wordt bij een gemiste sleutelsessie berekend en op twee plekken in het view-model gezet zonder ook maar één lezer, waardoor de fix live alleen de copy omzette en niet het voorstel. Die tweede kwam binnen als CC-vondst bij de prod-verificatie.
- **Een test die de UITKOMST van een pijplijn met de hand injecteert, toetst die pijplijn niet.** Zet je de waarde waarop de code beslist rechtstreeks in een nagebouwd invoer-object, dan bewijst groen alleen dat de CONSUMENT werkt — nooit dat de PRODUCENT hem ooit levert. Bij een test die op een geproduceerde waarde leunt hoort dus minstens één assertie die de producent zelf aanroept. Zelfde familie als "getest is niet aangesloten" en "een pad kan dood zijn aan zijn invoer of aan zijn uitvoer", nu op de TEST-kant. Aanleiding: `inhaal.test.ts` zet redenCode `catchup_high` met de hand in een nagebouwde `ProposalWeek` en is altijd groen geweest, terwijl de pijplijn die code in Base, Build en Peak per constructie niet kan produceren — gemeten over 48 combinaties, nul codes.
- **Een dood mechanisme toets je op zijn UITKOMST, niet alleen op zijn bereikbaarheid.** "Deze tak kan niet vuren" is een diagnose, geen verdict: hij zegt wat er niet gebeurt, niet of het gebeuren MOET. Zet de tak daarom kunstmatig aan en meet wat hij dan produceert — pas dat getal beslist tussen repareren en opruimen. Zonder die stap is de gemakkelijke conclusie altijd "bereikbaar maken", want een onbereikbare tak lijkt per definitie een gemis. Aanleiding: de week-inhaal-kaart had drie onafhankelijke redenen om niet te verschijnen, en die drie samen rechtvaardigden hooguit een reparatie. Wat de zaak besliste was de wat-als-run zelf: over 72 cellen leverde die in 60 MINDER high plus anaerobe intentminuten dan het plan dat er al stond, in 12 meer, in nul gelijk. Het mechanisme bood aan een gemiste intensiteitsprikkel in te halen met een lichtere week; bereikbaar maken had dat live gezet. Zelfde familie als "getest is niet aangesloten", maar een stap verder: daar was de vraag of het pad LOOPT, hier of het pad de goede kant OP loopt.
- **Vooruit-bedrading is dode code met een nettere naam.** Op 30 juli kreeg `dosisTredeVoorstel` een VERPLICHTE `grenzen`-parameter om dode invoer uit te sluiten. CC mat dat zijn uitvoer alleen de schaal draagt en geen zone-splitsing, dus de parameter kon de uitkomst per constructie niet beïnvloeden — een rood-test erop bestaat niet. Hij is er weer uit. Een verplichte parameter die de uitvoer niet kán raken is geen bescherming maar een belofte die de functie niet waarmaakt: wie de aanroep leest concludeert dat de functie zone-bewust is, en dat is ze niet.
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
- **Een assertie die twee zinnen vergelijkt, veronderstelt dat ze dezelfde VORM hebben.** Toets die
  aanname vóór je de vergelijkingsoperator kiest. Aanleiding: de ΔCTL-clausule staat in
  `fatigueUpAanbodRegel` VOORAAN en in `fatigueDownAanbodRegel` MIDDEN in de zin, dus de gevraagde
  `endsWith`-vergelijking zou voor UP kloppen en voor DOWN een ONWARE gelijkheid beweren. Herschreven
  naar een vergelijking van het deel ná de clausule. Zelfde familie als "een controle wordt getoetst
  tegen de payload uit hetzelfde prompt", nu op code die de chat zelf al had gelezen. En er hoort een
  tweede helft bij: een vergelijking die twee kanten gelijk noemt, draagt óók een assertie dat ze
  daarbuiten VERSCHILLEN — anders slaagt hij ook als beide kanten leeg of identiek zijn.
- **Een proportionele splitsing produceert zones die het plan nooit VOORSCHREEF.** Een blok waarvan
  de band over een zonegrens loopt laat aan de andere kant minuten vallen; die zien eruit als een
  tekort en zijn BANDOVERLOOP. Poort op het NOMINALE label dat het blok al draagt — niet op een
  minuten-drempel, want dan zet je een willekeurige constante op een artefact en weer je meteen ook
  echte kleine tekorten. Aanleiding: de weekstem meldde "1 Tempo-minuut" in een week waarin geen
  enkel blok tempo als label droeg; met de label-poort verdween die regel en bleef "21
  Drempel-minuten" staan.
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
- **Een bewaarde rij is niet hetzelfde als de PERIODE die hij heet te dekken.** Meet niet alleen OF
  de data er staat, maar ook WELK DEEL van de periode ze beslaat, en toets dat de afgeleide dezelfde
  SPAN heeft als de grootheid waartegen hij wordt gelegd. Aanleiding: punt 14 fase 1b leidde de
  zone-poort af uit weekplan-rijen die lokaal maar één trainingsdag droegen, waardoor het
  blok-oordeel op één zone kwam te rusten. Op prod bleek de rij wél de hele week te dekken (4
  entries tegenover 4 trainbare planner-dagen, tot en met zaterdag) — de lokale rijen waren een
  harness-artefact. Twee gevolgen: de span-toets hoort bij de recon, en zulke vragen meet je op de
  bak waar de data echt ontstaat.
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
- **Opmaak hoort UITSLUITEND op tekst die een MENS leest.** Een waarde die door een PARSER gelezen
  wordt, blijft kaal. Drie plekken in deze repo waar dat dragend is: een CSS-waarde in een
  style-attribuut (een decimaal-formatter zet er "33,3%" neer en de balk klapt stil naar nul
  breedte), de push-DSL naar intervals.icu en Garmin, en `structuur[i][1]` — die cel wordt door
  `dslBlockFromRow_` geparseerd, dus een Nederlandse komma in de BRON laat die parse stilzwijgend
  terugvallen op één enkele lap. Het float-net kan de eerste soort per constructie niet zien, want
  `innerText` leest geen attributen. Vandaar de regel vooraf en niet de meting achteraf: opmaken
  gebeurt op de renderrand, en alleen daar waar een oog kijkt.
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
- **Een herhaling die de as VASTZET waarop het verschijnsel leeft, meet niets — en "identiek" leest
  dan als bewijs.** Stel eerst vast welke EENHEID varieert, en herhaal op díé as. Aanleiding: punt
  36 valt per SCENARIO uiteen, en vier sweeps van hetzelfde scenario rug aan rug gaven 72 van de 72
  byte-identiek, terwijl dezelfde drie scenario's mét de tien andere ertussen 24 van de 93 lieten
  bewegen — dezelfde code, dezelfde sessie. Zelfde familie als "toets een per constructie
  onbereikbaar op de ruimte waarin de app WERKT": daar was de meetruimte te smal, hier de
  herhaling.
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
- **ÉÉN CONDITIE KAN MEERDERE FOUTVORMEN DRAGEN.** Plaats een poort op de plek die ze allemaal
  ziet, nooit op de vorm die je toevallig in het veld zag. Aanleiding: punt 37 noemde één
  foutvorm, `still loading after settle`; gereproduceerd gaf dezelfde conditie
  `page.goto: net::ERR_CONNECTION_REFUSED` en `page.waitForSelector: Timeout 60000ms exceeded`
  op `#root > *`, en géén van beide was de punt-24-melding. Een poort binnen `settle()` — de voor
  de hand liggende plek — had er twee van de drie gemist. EN DE TWEEDE HELFT: een NETTE stop
  reproduceert de CONDITIE, niet de OORZAAK. `preview_stop` sluit de poort keurig af; het stille
  sterven in het veld doet dat niet. Citeer zo'n meting dus nooit als bewijs OVER de oorzaak —
  ze zegt wat de harness doet als een origin wegvalt, niet waaróm hij wegviel.
- **Wie een tak van MELDEN naar STOPPEN tilt, ruimt de meld-machinerie op.** Een administratie
  die achter een conditie staat die voortaan per constructie onwaar is, is dode code — en ze
  leest als een levende mogelijkheid. Aanleiding: met de harde stop op een gekapte shot werden
  drie resten dood: het `capped`-veld in het return-object, de `, CAPPED` in de `.txt`-kop en de
  ` CAPPED` in de samenvattingsregel. Ze zijn weg, en de gerenderde uitvoer bewoog er niet door,
  want de `.txt` wordt na de throw nooit meer geschreven. Zelfde familie als "vooruit-bedrading
  is dode code met een nettere naam", nu ACHTERAF in plaats van vooruit. Kwam binnen als
  CC-afwijking.
- **DE INGREDIËNTEN VAN EEN VERSCHIJNSEL ZIJN NIET HET VERSCHIJNSEL.** Een mechanisme waarvan
  alle onderdelen aanwijsbaar aanwezig zijn is juist daarom overtuigend, en dat is precies de
  val: aanwezigheid van de onderdelen bewijst niet dat ze ook samenvallen. Meet het VENSTER
  leeg of vol vóór je er een verklaring op bouwt. Aanleiding: bij punt 36 vond LEZEN een
  fire-and-forget schrijfactie (`schema.ts:1283` en `:1289`) met een navigatie erachter, en de
  conclusie "race" lag voor de hand. METEN gaf 0 na-settle-requests over 25 zaai-loads maal twee
  runs, 0 `PUT /api/weekplan/`, 0 afgebroken, met een sluitende identiteit aan beide kanten. Het
  venster is per constructie leeg; de race bestond niet. Zelfde familie als "draai het", nu op
  een mechanisme dat plausibel is juist ómdat alle onderdelen er zijn.
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
- **Een BESLUIT dat een GETAL als uitkomst noemt, heeft de bron gelezen die dat getal
  produceert.** De norm-vraag en de mechanisme-vraag zijn twee vragen — wat er hoort te gebeuren
  is coach-canon, waar het vandaan komt is een grep — en wie ze in één beweging beantwoordt, wijst
  de verkeerde INGREEP aan terwijl de norm gewoon klopt. Aanleiding: bij punt 44 is M88 voorgelegd
  én goedgekeurd met een uitkomst van 36 tot 40 minuten boven de drempel bij veertien uur, vóór
  het quotum-veld gelezen was. Dat veld kent het weekvolume niet en zet 2 of 3 kwaliteitsdagen;
  de gemeten 1,75 is een SAMENSTELLINGS-getal, want sweet-spot op 89-93 procent valt buiten het
  predicaat "boven 100 procent FTP". De regel hield stand, het getal is als eis ingetrokken, en de
  aangewezen ingreep verschoof van "meer kwaliteitsdagen" naar "de dagen die er staan dragen de
  drempel". Zelfde familie als "een bouwspec die KANDIDAAT-PLEKKEN opsomt, heeft de plekken niet
  geteld", nu op de NORM in plaats van op de bouwspec.
- **Een GEËRFDE MEETLAT is niet getoetst tot je hem tegen de bron legt.** Wie een predicaat
  overneemt uit een vorige ronde meet wat die ronde toevallig mat, niet wat de vraag stelt — en
  een verschijnsel dat alleen onder één meetlat bestaat, is een eigenschap van de meetlat.
  Aanleiding: punt 44 draaide drie rondes op "werk boven 100 procent FTP" terwijl
  `packages/engine/src/zones.ts` de drempelzone op 91 tot 105 procent zet; met de eigen zonegrens
  van de engine verdween het grootste deel van het verschijnsel en sloot het punt zonder bouw.
  HET PREDICAAT HOORT BIJ ELK GETAL GENOEMD, en bij twijfel meet je op twee.
- **Een assertie-telling PER BESTAND is geen blast-radius-maat voor ÉÉN STRING.** Wil je weten wat
  er breekt als je een zin wijzigt, dan is de vraag welke asserties op DÍE letterlijke zin staan —
  geteld op de zin, niet op het bestand. Een bestandstelling meet hoe druk het bestand is, en dat
  correleert niet met de ene string die je aanraakt. Aanleiding: bij punt 50 leidde "34
  copy-asserties in `coachNarrative.test.ts`" tot de verwachting dat er TWEE zouden breken; het
  waren er NUL, want de vier treffers op de verwijderde zin bleken alle vier COMMENTAAR. Zelfde
  familie als de geërfde meetlat hierboven: het getal klopte, het predicaat niet. DAT HET NIETS
  KOSTTE IS GEEN VRIJBRIEF — de verwachting was conservatief en de stop-conditie zat aan de veilige
  kant, dus een kanteling zou zijn opgevallen. Was hij de andere kant op geweest, dan had een te
  lage verwachting een bouw laten doorlopen die meer omgooide dan bedoeld.

- **EEN DIAGNOSE DOOR INTERVENTIE VERANDERT PER PROBE PRECIES ÉÉN DING, en de probe die één poort
  onderzoekt mag de invoer van geen enkele andere poort raken.** Wie een keten van poorten wil
  toewijzen, toetst ze ONAFHANKELIJK — niet in een cascade, want dan erft elke stap de verstoring
  van de vorige. AANLEIDING, en het zijn er twee op één dag (23-08-2026, ROADMAP punt 47 ronde 3).
  Eerst werd een residu van 176 gemiste gevallen volledig aan de BESCHIKBAARHEIDSPOORT toegeschreven
  doordat de eerste cascadestap de week verruimde — wat niet alleen de beschikbaarheid verandert
  maar ook de DAGKEUZE, en daarmee de dag-afstand die de volgende poort toetst. De correctie schreef
  ze vervolgens volledig aan de DAGKEUZE toe, met een probe die de onderzochte dag 90 minuten gaf
  terwijl die dag in de echte week 45 minuten droeg — dus opnieuw twee dingen tegelijk. Beide keren
  luidde de uitslag "176 van de 176", allebei met volle overtuiging, en allebei fout: de werkelijke
  week droeg in 176 van de 176 gevallen precies ÉÉN kandidaat, en alle 176 vuurden alsnog zodra de
  vloer op nul stond. De tweede fout is gemaakt tijdens het opschrijven van de eerste. EEN NOEMER
  VAN 176 VAN DE 176 IS GEEN BEWIJS VAN JUISTHEID — hij is even goed het teken van een probe die
  stelselmatig hetzelfde verkeerde ding meet.

<!-- EINDE docs/WERKWIJZE-LESSEN.md -->
