# Cadans — WERKWIJZE-LESSEN, gereedschap en ronde

De lessen die aan het GEREEDSCHAP of aan de RONDE hangen: de shot-harness, wrangler, de
dev-server, git, pnpm, de klok-stub, de vergelijker, en de vorm van een CC-prompt. VERBATIM
gesplitst uit `docs/WERKWIJZE-LESSEN.md` op 10-08-2026, omdat dat document tegen de afkapgrens
van de opener-fetch aan liep. Er is geen letter gewijzigd.

De NORM staat in `docs/WERKWIJZE.md` en wint bij tegenspraak. `docs/WERKWIJZE-LESSEN.md` draagt
de andere helft: de BEWIJSLAST-regels, die over de VORM van bewijs gaan en aan geen enkel stuk
gereedschap hangen. De opener haalt beide op.

DE KNIP BEPAALT WAAR EEN NIEUWE LES LANDT. Hangt de grond van de les aan een tool, een bestand,
een commando of een harness in deze repo — iets dat met een commit of een versiesprong kan
veranderen — dan hoort hij HIER, en hij wordt herijkt zodra dat gereedschap verandert. Gaat de
les alleen over de vorm van bewijs, dan hoort hij in `docs/WERKWIJZE-LESSEN.md` en veroudert
hij niet. GEMETEN bij de splitsing: 57 lessen hier tegen 87 daar, en de groei is scheef — over
het nieuwste derde deel van de oude lijst kwam 25470 bytes hierheen tegen 15217 daarheen.

Een verwijzing hieronder naar *Prod en veiligheid*, *Beslissen* of het *Opener-sjabloon* wijst
naar `docs/WERKWIJZE.md`. Een verwijzing naar een les die hier niet staat, wijst naar de andere
helft. Nieuwe of gewijzigde lessen krijgen in dezelfde close-out een gedateerde regel in
`docs/WERKWIJZE-LOG.md`.

- **De chat leest zelf.** Read-only kloon van de publieke repo's plus grep; **nul CC-prompts voor leeswerk**. Bij een leesronde doet CC alleen de close-out-commit. Acht keer bevestigd. Een gecommitte meetdump rekent de chat door in de CONTAINER, niet in de context: `curl` de gepinde raw-URL binnen, bundel de functie die de app zelf aanroept met esbuild en draai die eroverheen. Zo is de dump van 217 rijen bij de dosis-munt gevouwen met `weekKwaliteitMinuten` uit `blok.ts`, en bleef de context vrij voor het ontwerp.
- **Locatie-ankers mechanisch extraheren.** Trek ankers (bestand, regel, substring) met een regex uit je eigen tekst en draai ze **allemaal** — nooit via een handgemaakte lijst. Een handlijst dekte 48 van 70 ankers en alle drie de fouten zaten in de 22 daarbuiten; de mechanische toets ving drie foute ankers in de eigen tekst vóór publicatie.
- **Reken je eigen werk na.** Rapporteer de trefkans van je ankers (bijvoorbeeld 18 van 122) in plaats van te claimen dat het klopt.
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
- **Een acceptatie-eis toetst alleen wat de ingreep kán raken.** Stel eerst vast wélk mechanisme het tekort veroorzaakt, en formuleer de eis pas daarna. Anders vraag je iets wat de bouw per constructie niet kan leveren, en stopt CC terecht op een eis die zelf niet klopte. Aanleiding: de eis "geen weekvorm van 6 uur of meer levert minder kwaliteitsminuten dan de 5-uursweek" viel over weekvorm V3 — daar komt het tekort niet uit `goalWorkout_` maar uit de allocator, die de lange dag geen kwaliteitsslot geeft. TWEEDE KEER dezelfde fout: de eis "een dag van 135 minuten of langer draagt een kwaliteitssjabloon" viel over weekvorm V7, waar stap 1b de lange dag juist BEWUST laat liggen omdat hem pakken twee buren kost. De eis hoort pas geformuleerd te worden nádat het mechanisme is vastgesteld — niet ernaast, en niet ervoor.
- **Een byte-vergelijking tussen twee harness-runs geldt alleen zonder werk ertussen.** De harness is deterministisch — 40 van 40 identiek op bytecount en sha256 bij twee runs back-to-back — maar zijn INVOER niet: de lokale D1 draagt historie, en elk tussentijds werk dat haar raakt verandert de shots. Meet je een wijziging, draai dan beide kanten achter elkaar op dezelfde machine zonder iets ertussen. Aanleiding: acht "afwijkende" shots in de vooruit-scenario's reproduceerden onder gecontroleerde meting niet. Zelfde familie als "een fixture die leeg gevoed wordt": de historie in D1 is een verborgen variabele. En andersom levert de gecontroleerde diff meer dan een verschilbewijs — een pixeldiff die 32 van de 40 shots byte-identiek toont en het verschil tot één rechthoek terugbrengt, is een BEGRENZINGSbewijs: hij toont dat de fix niets anders raakt.
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
- **Een controle wordt getoetst tegen de payload uit HETZELFDE prompt.** Ging mis op 30 juli: een prompt vroeg te controleren dat het woord "sport-settings" nergens meer in een doc stond, terwijl de verbatim tekst in datzelfde prompt het woord twee keer bewust gebruikte — het afgewezen alternatief en de gemeten gelijkheid van de waarden. CC weigerde terecht de tekst aan te passen om de controle te laten slagen. Lees een acceptatie-eis na tegen wat je meestuurt vóór je hem verstuurt.
- **Een instructie om iets te BEHOUDEN veronderstelt dat het er staat.** Controleer de vindplaats
  vóór je zo'n instructie meestuurt; anders krijgt de uitvoerder twee eisen die elkaar uitsluiten
  en valt het te behouden punt stilzwijgend weg. Zelfde familie als "een controle wordt getoetst
  tegen de payload uit hetzelfde prompt", maar een stap eerder: daar werd een eis niet tegen de
  MEEGESTUURDE tekst gelegd, hier een behoud-instructie niet tegen de BESTAANDE tekst. Aanleiding:
  het close-out-prompt van de pendel-fix zei "haal het PENDEL-BUG-item eruit, zet er niets voor in
  de plaats" én "laat het item over de gepland-noemer wel staan", terwijl dat item alleen bestond
  als kruisverwijzing bínnen het te verwijderen item. CC meldde het correct als afwijking. De chat
  had de parkeerlijst zelf al gelezen en had het dus kunnen weten.
- **De DEV-SERVER is ook een fixture-variabele bij een byte-vergelijking.** Zelfde familie als "het
  lokale beeld is niet het prod-beeld", maar een andere bron: daar draagt de D1 andere historie,
  hier is de APP zelf nog niet klaar. Een harness-run tegen een koude vite fotografeert een
  half-getransformeerde app, en dat lijkt op een verschil dat de bouw zou hebben veroorzaakt. Draai
  eerst een warmloop en GOOI DIE WEG; meet pas daarna. Aanleiding: de eerste nulmeting van punt 10
  fase A gaf 40 van de 40 shots "gewijzigd", met byte-sprongen van 142k naar 244k — volledig
  artefact. Overgedaan met een warmloop en de VOOR-staat via `git checkout <hash> --` op de
  gewijzigde componenten; toen bleven 48 van de 56 byte-identiek en bewogen alleen de acht shots
  van het scenario waar de kaart daadwerkelijk vuurt.
- **Een grep die het EIGEN bestand uitfiltert, kan de aanroeper BINNEN dat bestand niet zien.** Wie
  vraagt "is dit aangesloten", sluit de eigen module niet uit. Aanleiding: een bouwdoc stelde als
  premisse dat `planZone5_` NUL aanroepers had buiten zijn eigen test, terwijl `bibliotheekSignatuur`
  hem in DEZELFDE module aanroept (`zonemunt.ts:199`) en via `blokDosisNorm` (`blok.ts:184`) gewoon
  live draait. CC ving het als premissecontrole vóór de bouw en stopte; de eis in het doc was
  daarna te herformuleren naar wat wél ontbrak — een aanroeper die de plan-kant PER DAG uitrekent.
  Zelfde familie als "getest is niet aangesloten", nu op de MEETMETHODE in plaats van op de code.
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
- **Meet nooit voor/na op een bak waar de app zelf in schrijft, zonder eerst te toetsen of hij
  aangroeit.** De shot-harness reset `weekplans` niet, en `persistWeekplan` schrijft de bekeken week
  fire-and-forget weg — dus de VOOR-run zet rijen klaar waar de NA-run van profiteert, en het
  verschil is deels je eigen meting. Draai de voor-staat twee keer op een verzadigde bak en toets op
  gelijkheid: hier gaf dat 64 van 64 byte-identiek, waarmee het verschil van 0 van 64 aan de code
  toeviel en niet aan de aanwas. Zelfde familie als de warmloop-regel: eerst het INSTRUMENT ijken.
- **Een harness die zelf schrijft, verzadigt zijn eigen invoer.** De voor-run zet rijen klaar waar
  de na-run van profiteert, dus meet beide kanten op een verzadigde bak en ijk het instrument eerst
  op twee gelijke runs. Aanleiding: dezelfde ronde, CC-vondst — twee runs van a2e1a93 gaven 64 van
  64 identiek, en pas daarmee was het verschil toe te schrijven aan de code. Een tweede controle die
  gratis meekomt: shots waarin niets hoort te veranderen MOETEN byte-identiek blijven; bewegen ze
  mee, dan meet je drift.
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
- **Een grep-EIS toets je tegen de echte trefferverdeling vóór je hem verstuurt.** "Nul treffers"
  is een controle die per constructie kan falen op treffers die er HOREN te staan, en dan stopt de
  uitvoerder terecht op een eis die zelf niet klopte. Aanleiding: dezelfde ronde eiste nul
  treffers op `doelDuur` in `apps/web/src` en `packages/engine/src`, terwijl er 32 stonden in 24
  bestanden waarvan 23 `SettingsInput`-fixtures die de sleutel moeten dragen zolang het DTO-veld
  bestaat. De bereikbare eis was nul op DRIE genoemde bestanden; daar stonden er zes. Zelfde
  familie als "een controle wordt getoetst tegen de payload uit hetzelfde prompt".
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
- **Het begrenzingsbewijs van de shot-harness gaat op de PNG's, NOOIT op de `.txt`.** Twee dingen in
  die tekstbestanden wisselen aantoonbaar tussen twee runs van dezelfde code: de teller
  `PUT /api/weekplan/<maandag>` (2 of 3) en de gepland-noemer (`/372` tegen `/379`, die uit de
  bewaarde weekplan-rijen komt). Een `.txt`-vergelijking leest dat als een wijziging en je gaat een
  defect zoeken dat er niet is. De PNG's zijn wél deterministisch; die dragen het bewijs.
- **`v7/09-vorm` en `v7/10-trainingen` zijn NIET byte-deterministisch.** Gemeten over meerdere
  runs van ONGEWIJZIGDE code, met telkens identieke `innerText` — het verschil is puur pixel.
  Sluit die twee uit van elke PNG-vergelijking zolang dat niet is opgelost, en zeg in het rapport
  dát je ze uitsluit. Vergelijk dus 77 en niet 79.
- **Een meting die door een SHELL-LAAG gaat, toets je eerst op een BEKENDE WAARDE.** Die laag kan
  je invoer stil verbouwen, en dan meet je de laag in plaats van het systeem. Aanleiding: Git Bash
  zette een `/assets/...`-argument om naar een Windows-pad, waardoor een fetch 90 seconden lang
  `-1` gaf en dat las als een propagatievenster van anderhalve minuut; met `MSYS_NO_PATHCONV=1`
  gaf dezelfde aanroep meteen 200. Zelfde soort val, twee keer voorgekomen: een python-heredoc die
  een `\n`-escape tot een echte regelovergang verminkte, gevangen met `node --check`. Zelfde
  familie als "een anomalie in je eigen meetuitvoer is een gat in je INSTRUMENT".
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
- **Bewegen twee bekende verschijnselen op dezelfde meetas, laat de VERGELIJKER het onderscheid
  dragen.** Met de hand is dat een oordeel per shot en dus een handlijst; mechanisch is het een
  kolom. Aanleiding: het ijkpaar van deze ronde gaf ELF bewegende shots, en pas de
  innerText-classificatie in `tools/shots/vergelijk.mjs` splitste ze zonder rest — ACHT met
  VERSCHILLENDE innerText (punt 36, het plan beweegt) en DRIE met GELIJKE innerText (punt 23 en
  de opgeheven cap, dus puur pixel). Zonder die kolom is een uitslag op zo'n as niet toe te
  wijzen, en werd ze per shot met de hand geveld.
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
- **Een prompt met een placeholder is een prompt met een fout.** Past de inhoud niet in één bericht,
  dan genummerde blokken voor dezelfde CC-sessie — nooit een verwijzing naar een bericht dat CC niet
  kan zien. Aanleiding: punt 43 ronde 3 blok 1 verwees naar "mijn volgende bericht"; CC draaide de
  premissen en STOPTE, in plaats van een meetdocument te verzinnen.
- **Een health-endpoint zonder versieveld bewijst dat de Worker LEEFT, niet welke bundel eronder
  zit.** Verifieer een deploy daarom op BUNDEL-IDENTITEIT: haal de live `index.html` op, lees het
  asset waar hij naar wijst, en vergelijk dat byte-voor-byte met de lokale build. Aanleiding: de
  deploy van punt 43 — `/api/health` gaf `{"ok":true,"service":"cadans-api"}` en verder niets;
  `assets/index-BoCic_Ah.js` was 584155 bytes en sha256-identiek aan `apps/web/dist`.
- **Een fixture die op MODULE-NIVEAU een builder aanroept, valt buiten `beforeAll` en ziet de
  wandklok.** ESM evalueert de module vóór elke hook, dus een `vi.setSystemTime` in `beforeAll`
  pint die ene aanroep niet. De test is dan groen zolang de echte datum toevallig dicht bij de
  gepinde ligt en wordt rood door tijdsverloop alleen — een groene gate met houdbaarheidsdatum, en
  CI mist niets want op die dag was hij werkelijk groen. Aanleiding: `apps/web/src/lib/pendel.test.ts`
  was groen op `53fd893` en stabiel rood op diezelfde commit drie weken later, 509 in plaats van
  530 over vijf runs; `const BLOB` riep `buildWeekProposal` aan op module-niveau. Fix in
  `acd46355eaa481499307c6ca3598b55cf8bc818c`: de pin naar module-niveau, boven de fixture. WIE EEN
  KLOK PINT, PINT HEM BOVEN ALLES WAT ERAAN HANGT — en `beforeAll` staat daar niet boven.
- **`pnpm test -- <naam>` FILTERT NIET in deze repo, maar geeft wel een uitslag die er goed
  uitziet.** Het root-script is `node scripts/ensure-web-dist.mjs && cross-env TZ=Europe/Amsterdam
  vitest run`, en het argument bereikt `vitest` niet door de `&&`-keten: alle 78 bestanden draaien.
  Wie daarmee een rood/groen-meting per bestand doet, meet de hele suite en denkt één bestand te
  zien. Gemeten 20-08-2026 bij de pendel-fix. WERKT WEL: `pnpm vitest run --project web <pad>`.
  Let op dat die vorm de TZ-pin van het root-script MIST — zet `TZ=Europe/Amsterdam` erbij zodra de
  uitslag van de tijdzone kan afhangen.

<!-- EINDE docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md -->
