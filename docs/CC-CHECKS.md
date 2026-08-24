# Cadans — CC-CHECKS

De 53 lessen die in `docs/LESSEN-DOORLOOP.md` als MECHANISCH én gedragen door CC of BEIDE zijn
geclassificeerd, omgezet naar checks die te draaien of na te gaan zijn. Elke check draagt vier
velden: CONDITIE (wanneer hij bijt), TOETS (wat je draait), UITKOMST (wat GROEN is, als afleesbare
waarde) en HERKOMST (welke lesnummers hij dekt).

DIT DOCUMENT VOEGT GEEN REGELS TOE. Elke eis komt uit een van de 53 lessen; waar een les niet
omzetbaar bleek zonder hem te verzwakken, staat dat als NIET OMZETBAAR met de reden — een check
die minder eist dan de les is een intrekking en geen omzetting.

TELLING PER CONDITIE — ALTIJD 4 · METING 12 · HARNESS 5 · DEPLOY 1 · COMMIT 2 · ENGINE 14 ·
NIET OMZETBAAR 1. TOTAAL 39 checks, samen 53 gedekte lessen plus ÉÉN check (39) die niet uit de
lessen komt maar uit een gemeten gat in de gate zelf.

De drie ALTIJD-toetsen zijn in de omzetronde zelf gedraaid en waren uitvoerbaar; een controleregel
die niet kan draaien is niet te onderscheiden van een geslaagde controle.

CHECK 1
CONDITIE : ALTIJD
TOETS    : git status --porcelain
UITKOMST : lege uitvoer. Is ze niet leeg, dan is elke VOOR-meting vanaf deze boom ongeldig en is `git checkout <bestand>` verboden — dat herstelt naar HEAD en wist ongecommitte bouw mee.
HERKOMST : 101

CHECK 2
CONDITIE : ALTIJD
TOETS    : Get-ChildItem -Path tools -Recurse -Filter *.mjs | ForEach-Object { node --check $_.FullName }
UITKOMST : geen uitvoer en exitcode 0 per bestand. Bestandsinhoud wordt bovendien NOOIT via een heredoc, een patch-script of `python -c` geschreven — bestaande bestanden via de Edit-tool, nieuwe via de Write-tool.
HERKOMST : 117

CHECK 3
CONDITIE : ALTIJD
TOETS    : pnpm vitest run --project web apps/web/src/lib/pendel.test.ts
UITKOMST : "Test Files 1 passed (1)" — precies één bestand. `pnpm test -- <naam>` FILTERT NIET: het argument bereikt `vitest` niet door de `&&`-keten in het root-script en alle 78 bestanden draaien, met een uitslag die er plausibel uitziet. Een rood/groen-meting per bestand gebruikt dus deze vorm.
HERKOMST : 148

CHECK 4
CONDITIE : COMMIT
TOETS    : $sha = git rev-parse HEAD; Invoke-RestMethod "https://api.github.com/repos/daanhhk/Cadans/actions/runs?head_sha=$sha"
UITKOMST : total_count minstens 1 en status "completed" met conclusion "success". De VOLLE 40-teken-SHA is verplicht; een korte hash geeft total_count 0, en die nul is niet te onderscheiden van "de run is nog niet gestart" — lees hem dus als "nog niet vastgesteld" en nooit als uitslag.
HERKOMST : 093

CHECK 5
CONDITIE : METING
TOETS    : Select-String -Path packages/engine/src/planner.ts -Pattern "new Date\(\)" | Select-Object -First 5 ; daarna per test of meting die `buildWeekProposal`, `assignWorkouts` of `allocateQualityWeek_` aanroept: staat de klok gepind vóór de eerste aanroep?
UITKOMST : elke zulke test of meting pint de klok op een datum BINNEN de fixture-week. Een fixture-week in het verleden zet de week-allocator stil inert: `quotaPlan` geeft dan op ALLE dagen null en de meting leest nul waar het mechanisme leeft. De pin staat bovendien op MODULE-niveau als een module-fixture zelf een builder aanroept — ESM evalueert de module vóór elke `beforeAll`, dus een pin in die hook dekt zo'n aanroep niet.
HERKOMST : 002, 147, 149

CHECK 6
CONDITIE : METING
TOETS    : Select-String -Path tools -Recurse -Pattern "class .* extends Date" -SimpleMatch
UITKOMST : nul treffers. Een klok-stub is een Proxy op de ECHTE constructor; een subclass breekt `x instanceof Date` voor elk Date-object dat buiten de stub is gemaakt, en dan draait de meting groen terwijl ze iets anders meet.
HERKOMST : 118

CHECK 7
CONDITIE : METING
TOETS    : draai de VOOR-staat TWEE keer achter elkaar op dezelfde machine, zonder werk ertussen, en vergelijk de twee uitvoeren byte voor byte.
UITKOMST : de twee runs zijn identiek — teller gelijk aan noemer. Pas dan is een verschil aan de code toe te schrijven. Dit geldt óók als de bak waarin gemeten wordt door de app zelf wordt beschreven: die groeit aan, dus meet beide kanten op een VERZADIGDE bak. Bij een harness hoort een warmloop die wordt WEGGEGOOID; een run tegen een koude dev-server fotografeert een half-getransformeerde app. En de ruisvloer die hieruit volgt hoort bij DEZE sessie en dit scenario: erf er nooit een.
HERKOMST : 095, 099, 102, 103, 125

CHECK 8
CONDITIE : HARNESS
TOETS    : ijk de vergelijker in TWEE richtingen met HETZELFDE script dat de uitslag levert, op bomen met OVERLAPPENDE bestandsnamen.
UITKOMST : de gelijk-richting geeft N van de N identiek en de verschil-richting geeft 0 van de N, met een vergeleken-aantal groter dan nul. Is het vergeleken-aantal nul, dan liggen de paden niet over elkaar en is er geen enkele byte vergeleken.
HERKOMST : 134

CHECK 9
CONDITIE : HARNESS
TOETS    : vergelijk de PNG's, niet de `.txt`; sluit `v7/09-vorm` en `v7/10-trainingen` expliciet uit.
UITKOMST : het begrenzingsbewijs staat op de PNG's — de `.txt` draagt twee velden die aantoonbaar tussen twee runs van dezelfde code wisselen (de `PUT /api/weekplan/<maandag>`-teller en de gepland-noemer). De twee genoemde shots zijn niet byte-deterministisch bij identieke innerText; de uitslag noemt de uitsluiting mét reden en vergelijkt 77, niet 79.
HERKOMST : 111, 112

CHECK 10
CONDITIE : HARNESS
TOETS    : bewegen twee bekende verschijnselen op dezelfde meetas, lees dan de innerText-classificatiekolom van `tools/shots/vergelijk.mjs`.
UITKOMST : elke bewegende shot is zonder rest toegewezen — verschillende innerText tegenover gelijke innerText — en het totaal van beide groepen is gelijk aan het aantal bewegende shots. Met de hand toewijzen is een oordeel per shot en dus een handlijst.
HERKOMST : 136

CHECK 11
CONDITIE : METING
TOETS    : draai de meting eerst op een BEKENDE WAARDE voordat je hem op het systeem loslaat.
UITKOMST : de bekende waarde komt er onveranderd uit. Een shell-laag kan de invoer stil verbouwen — een `/assets/...`-argument werd op Git Bash naar een Windows-pad omgezet — en dan meet je de laag in plaats van het systeem.
HERKOMST : 113

CHECK 12
CONDITIE : METING
TOETS    : roep in de meting de functie aan die de APP zelf aanroept; bouw geen eigen venster-, blok- of dagraster na.
UITKOMST : de meting gebruikt de echte enumerator, en er staat een assertie dat het ijk-geval uit de recon op datzelfde raster ligt. Een nagebouwd raster is intern consistent en meet iets anders dan de app doet.
HERKOMST : 007

CHECK 13
CONDITIE : METING
TOETS    : sweep de drempel of tolerantie over haar hele bereik en lees per stap de uitkomst af; meet bij een drempel die op een tijdstip valt bovendien de SPREIDING van het triggermoment.
UITKOMST : er is een aaneengesloten reeks waarover de uitkomst stilstaat, en de gekozen waarde ligt ruim binnen die reeks met ondergrens en bovengrens erbij gerapporteerd. Verschuift de uitkomst sterk over een klein bereik, dan bemonster je ruis en is elke waarde even willekeurig. Ligt het triggermoment telkens op dezelfde plek, dan is het een klok en geen gebeurtenis.
HERKOMST : 006, 060, 062

CHECK 14
CONDITIE : METING
TOETS    : schrijf elke uitslag als teller, noemer en uitsluiting met reden.
UITKOMST : de noemer is het TOTAAL en niet wat er na uitsluiting overbleef, en elke uitsluiting draagt haar reden. Krimpt de noemer stilletjes mee, dan leest een onvolledige meting als een volledige.
HERKOMST : 058

CHECK 15
CONDITIE : METING
TOETS    : tel eerst over ALLE treffers voordat je er een leest; zet geen `head -n` achter een grep met meerdere patronen.
UITKOMST : het trefferaantal is over het hele bestand geteld. Een getrunceerde bestaans-grep levert een ONWARE afwezigheid, en een gelezen fragment draagt geen uitspraak over het hele bestand.
HERKOMST : 110

CHECK 16
CONDITIE : METING
TOETS    : bij de vraag "is dit aangesloten": grep ZONDER het eigen bestand uit te sluiten.
UITKOMST : de aanroeper binnen dezelfde module is meegeteld. Een grep die het eigen bestand uitfiltert kan hem per constructie niet zien.
HERKOMST : 100

CHECK 17
CONDITIE : ENGINE
TOETS    : zet de ingreep tijdelijk terug en draai de suite; landt de ingreep op N plekken, doe dat PER PLEK met alleen die plek gepatcht; ligt de rood-meting in de selftest, meet dan PER ASSERTIE en niet per `it`; grep na elke rood-patch op de eigen markering; en herhaal de meting NA een biome-herformattering.
UITKOMST : bij elke plek en elke term valt minstens één benoemde test, met naam en aantal. Valt er niets, dan is de patch mogelijk stil een no-op — `assert_` breekt bovendien af bij de eerste val, dus een term verderop in hetzelfde `it` wordt gemaskeerd. Een toets die op ONGEWIJZIGDE code groen staat beslist niets, en een rood-meting van vóór een herformattering is ontkracht.
HERKOMST : 016, 017, 037, 070, 109, 119

CHECK 18
CONDITIE : ENGINE
TOETS    : Select-String -Path apps,packages,workers -Recurse -Include *.ts -Pattern "<naam van de nieuwe export>" -SimpleMatch
UITKOMST : minstens één treffer BUITEN de eigen module en buiten zijn test — de call-site, en die wordt in het rapport bij naam genoemd. Een functie die geëxporteerd en getest is maar nergens wordt aangeroepen faalt nergens: tests groen, gate groen, app doet het niet.
HERKOMST : 009

CHECK 19
CONDITIE : ENGINE
TOETS    : lees BEIDE uiteinden van het pad — wat geeft de aanroeper mee, en wie leest de uitkomst — en bij een SCHRIJFpad ook de laag achter de route-guard.
UITKOMST : de aanroeper geeft geen vaste `null` mee, er is minstens één lezer van de uitkomst, en de repo-laag overschrijft het veld niet alsnog. Een route-guard die een afwezige sleutel netjes overslaat zegt niets over wat de laag erachter met de rij doet.
HERKOMST : 027, 049

CHECK 20
CONDITIE : ENGINE
TOETS    : grep elke plek die diezelfde afgeleide waarde berekent voordat je de guard commit.
UITKOMST : de guard staat op alle gevonden plekken. Staat hij op één, dan ontbreekt hij op de andere en tonen twee kaarten twee uitspraken over dezelfde week.
HERKOMST : 032

CHECK 21
CONDITIE : ENGINE
TOETS    : leunt een test op een geproduceerde waarde, controleer dan dat hij de PRODUCENT aanroept in plaats van die waarde met de hand in een nagebouwd invoer-object te zetten; en toets een terugval bij zijn EIGEN functie in plaats van via de aanroeper.
UITKOMST : minstens één assertie roept de producent zelf aan, en de terugval-tak wordt rechtstreeks aangeroepen. Groen op een geïnjecteerde waarde bewijst alleen dat de consument werkt, nooit dat de producent hem ooit levert; en een test die via de route binnenkomt raakt alleen de primaire tak.
HERKOMST : 028, 068

CHECK 22
CONDITIE : ENGINE
TOETS    : passeert een fixture een POORT om iets anders te kunnen meten, asserteer dan die passage.
UITKOMST : er staat een expliciete assertie dat de poort gepasseerd wordt. Zonder die assertie gaat de test stil dood zodra de poort verschuift: hij blijft groen en meet niets meer.
HERKOMST : 026

CHECK 23
CONDITIE : ENGINE
TOETS    : tel per OR-term of hij in de meetopstelling true KAN worden.
UITKOMST : elke term is minstens één keer true. Een fixture waarin een OR-term per constructie leeg is meet de disjunctie niet, en de uitkomst zegt dan niets over de conditie als geheel.
HERKOMST : 086

CHECK 24
CONDITIE : ENGINE
TOETS    : bij een 400-test: muteer de VOLGORDE — schrijf vóór de validatie — en niet de status.
UITKOMST : de status-assertie blijft staan en uitsluitend de terugleesasserties vallen om. Zet je de validatie uit, dan schaduwt de status-assertie de terugleescheck en heb je de statuscode getoetst in plaats van de schrijfkant.
HERKOMST : 031

CHECK 25
CONDITIE : ENGINE
TOETS    : bij een parser-assertie: toets de WAARDE, niet het bestaan.
UITKOMST : de assertie noemt de verwachte waarde. Een parser die bij foute invoer een ANDER GETAL teruggeeft in plaats van `null` is met een niet-null-assertie per constructie niet te betrappen.
HERKOMST : 067

CHECK 26
CONDITIE : ENGINE
TOETS    : valt een assertie om, ga dan na of ze een HARDCODED getal draagt.
UITKOMST : draagt ze er geen, dan is het een fixture-vraag en geen herijk-vraag: zoek de oorzaak en corrigeer de fixture. Een relationele mechanisme-check heeft geen constante om 1-op-1 te verzetten, en verzwakken is verboden.
HERKOMST : 014

CHECK 27
CONDITIE : ENGINE
TOETS    : til je een tak van MELDEN naar STOPPEN, grep dan de meld-machinerie die erachter stond.
UITKOMST : nul resten — geen veld in het return-object, geen kop-suffix, geen samenvattingsregel die de conditie nog noemt. Een administratie achter een conditie die voortaan per constructie onwaar is, is dode code die als levende mogelijkheid leest.
HERKOMST : 072

CHECK 28
CONDITIE : ENGINE
TOETS    : toets een classificatie met een substring-terugval tegen een ONAFHANKELIJKE eigenschap, over álle waarden die de producent kan opleveren.
UITKOMST : elk type is tegen die tweede eigenschap gecontroleerd. Zo'n classifier geeft ALTIJD een antwoord en meldt dus nooit dat ze het niet weet; en wordt hij door twee poorten gelezen, dan levert één fout label tegelijk twee tegengestelde onterechte uitspraken.
HERKOMST : 057

CHECK 29
CONDITIE : ENGINE
TOETS    : Select-String -Path apps/web/src -Recurse -Include *.tsx -Pattern "hidden=" -SimpleMatch
UITKOMST : geen enkele treffer staat op een element dat óók een expliciete inline `display` draagt. `hidden` werkt via de UA-regel `[hidden] { display: none }` en verliest van élke expliciete display; de toestand oogt dan correct terwijl het paneel permanent open staat.
HERKOMST : 050

CHECK 30
CONDITIE : ENGINE
TOETS    : grep de formatters op paden die door een PARSER worden gelezen — een CSS-waarde in een style-attribuut, de push-DSL, en `structuur[i][1]`.
UITKOMST : nul opgemaakte waarden op die drie paden. Opmaak hoort uitsluitend op tekst die een MENS leest; een Nederlandse komma in de bron laat de parse stilzwijgend terugvallen, en het float-net kan de attribuut-variant per constructie niet zien.
HERKOMST : 054

CHECK 31
CONDITIE : METING
TOETS    : dump ÉÉN voorbeeldrij van de reeks en lees de veldnamen voordat je de reeks vertrouwt.
UITKOMST : elk gelezen veld bestaat werkelijk op het object. Een verkeerd gespelde sleutel levert `undefined` aan BEIDE kanten, dus de vergelijking blijft formeel geldig terwijl ze de grootheid niet meer ziet — en "identiek" leest dan als bewijs.
HERKOMST : 079

CHECK 32
CONDITIE : METING
TOETS    : draai de dosis-hendel tot zijn eind en leg plan en norm er samen naast, op DEZELFDE trede.
UITKOMST : plan en norm zijn op elke trede tegen elkaar gelegd. Sluit het gat, dan was het dosis; blijft het staan of groeit het, dan zit het defect in het paar norm-en-plan. Een sweep die het plan opvoert en de norm op 0 laat staan meet twee verschillende meetlatten en leest een tekort als geleverd.
HERKOMST : 051, 052

CHECK 33
CONDITIE : HARNESS
TOETS    : tel vóór een meetreeks hoeveel schrijfacties op hoeveel UNIEKE opslagsleutels landen.
UITKOMST : het aantal unieke sleutels staat in het rapport naast het aantal schrijfacties. Fixtures die dezelfde sleutel delen meten elkaar: elk scenario leest via de recency-seed terug wat het vorige achterliet.
HERKOMST : 129

CHECK 34
CONDITIE : HARNESS
TOETS    : anker elke wachtvoorwaarde op het venster NÁ de markering waar hij bij hoort.
UITKOMST : de wachtlus polt minstens één keer en vindt de gebeurtenis van de EIGEN stap. Een lus die op de hele tijdlijn matcht keert onmiddellijk terug op de gelijksoortige gebeurtenis van een eerdere stap, en alles erachter meet dan iets anders.
HERKOMST : 128

CHECK 35
CONDITIE : NIET OMZETBAAR
TOETS    : NIET OMZETBAAR
UITKOMST : NIET OMZETBAAR. Les 148 is als runbare check omgezet in CHECK 3, maar het tweede deel van die les — dat de vervangende vorm `pnpm vitest run --project web <pad>` de TZ-pin van het root-script MIST en dat je `TZ=Europe/Amsterdam` er zelf bij zet — is geen afleesbare uitkomst maar een afweging: hij geldt alleen "zodra de uitslag van de tijdzone kan afhangen", en of dat zo is valt niet zonder oordeel vast te stellen. Er is bewust geen check omheen verzonnen.
HERKOMST : 148

CHECK 36
CONDITIE : COMMIT
TOETS    : is er een dependency toegevoegd met `pnpm --filter <pakket> add -D <dep>`, draai dan daarna een KALE `pnpm install`.
UITKOMST : `pnpm test` initialiseert daarna weer alle projecten. Zonder die kale install kunnen de workspace-links breken en leest de fout als een kapotte config terwijl er niets aan een config veranderd is. Reken er bovendien op dat de lockfile-diff GROTER is dan de ene dependency — meld dat aantal in het rapport in plaats van de diff te willen inperken.
HERKOMST : 137

CHECK 37
CONDITIE : DEPLOY
TOETS    : haal de live `index.html` op, lees het asset waar hij naar wijst, en vergelijk dat byte-voor-byte met de lokale build.
UITKOMST : de sha256 en de bytecount van het live asset zijn gelijk aan die van `apps/web/dist`. Een health-endpoint zonder versieveld bewijst dat de Worker LEEFT, niet welke bundel eronder zit.
HERKOMST : 146
NOTITIE 24-08-2026 : deze check is bij de deploy van 24-08-2026 NIET GEDRAAID en kan door CC ook niet gedraaid worden zolang de origin achter de basic-auth-gate zit — het wachtwoord is een deploy-only secret en CC voert geen wachtwoorden in. WAT ER WÉL WAS: de geuploade bundelnaam kwam overeen met die in de lokale `index.html` (een naam-vergelijking, geen byte-vergelijking), en **Daan heeft de app daarna met de hand gecontroleerd en die deed normaal**. Noteer dat als de verificatie die er is; het vervangt de byte-vergelijking niet.

CHECK 38
CONDITIE : METING
TOETS    : leg de gemeten reeks naast het gepinde ijkpunt voordat je er een conclusie op bouwt.
UITKOMST : het ijkpunt reproduceert exact — teller gelijk aan noemer — en dat getal staat in het rapport vóór enige andere uitslag. Dit is de meetkant van CHECK 7: daar wordt het INSTRUMENT op twee gelijke runs geijkt, hier de UITKOMST tegen een bekend punt.
HERKOMST : 095

CHECK 39
CONDITIE : ALTIJD
TOETS    : cd workers/api ; npx wrangler d1 migrations list cadans --local
UITKOMST : "No migrations to apply!". Staat er iets open, dan draagt de PERSISTENTE lokale D1 een ANDERE migratiestand dan de repo, en is elke dev-waarneming ongeldig voordat je `pnpm db:migrate:local` hebt gedraaid. DIT IS EEN GAT DAT DE GATE PER CONSTRUCTIE NIET KAN ZIEN: `workers/api/vitest.config.ts` draait `readD1Migrations` over `./drizzle` en past ALLE migraties toe op een VERSE database per run, dus de suite ziet altijd het volle schema terwijl `wrangler dev` op 8787 en `tools/shots/shot.mjs` op de persistente database draaien. GEMETEN 23-08-2026: die database liep twee migraties achter, zodat `GET`/`PUT /api/ijking` daar `no such column: ijking_blok` gaf terwijl de suite groen stond — twee rondes lang. Een groene gate sluit een kapotte dev-omgeving dus niet uit. Draai deze check VÓÓR elke ronde die een route of een scherm aanraakt, en ALTIJD in de ronde die een migratie toevoegt: toepassen is twee handelingen, `--local` én `--remote`.
HERKOMST : deze check komt niet uit de 53 lessen maar uit de prod-migratieronde van 23-08-2026; hij staat als ALTIJD omdat de kosten nul zijn en de faalwijze stil.

CHECK 40
CONDITIE : METING
TOETS    : rust de ronde op een claim die begint met "hoort per definitie" of "kan niet" — een wiskundige of definitorische eigenschap — zoek dan eerst het KLEINST MOGELIJKE TEGENVOORBEELD met de hand, vóór je meet en vóór je bouwt.
UITKOMST : ofwel er is geen tegenvoorbeeld en de aanname mag dragen, ofwel je hebt hem in tien seconden omgedraaid. VRAAG JE APART AF OF DE GEPLANDE METING KÁN FALEN op de aanname: een meting die de eigenschap veronderstelt, toetst haar niet. GEMETEN 24-08-2026 in punt 70: de ronde rustte op "een mean-max-kromme hoort niet te stijgen met de duur, want wie X watt over 23 minuten volhield hield per definitie ook 20 minuten ≥X vol". Het signaal `[10, 0, 10]` weerlegt dat met de hand — beste 2s-gemiddelde 5,00 W, beste 3s-gemiddelde 6,67 W — want een langer venster mag het zwakke midden meenemen zolang beide sterke randen erin passen. Bevestigd op echte data: rit `i171448183`, beste 140s 357,643 W over 4268 vensters, beste 165s 366,927 W over 4243. De verwachting die dit had moeten vangen mat "is het lopende maximum ooit lager" — 0 keer op 566 punten, en dat KAN niet anders, want dat is de definitie van een lopend maximum. Een groene meting op een niet-falende toets liet een reparatie door die een correct getal door een onhaalbaar getal zou vervangen.
HERKOMST : punt 70, 24-08-2026 — de ronde die zichzelf introk.

CHECK 41
CONDITIE : METING
TOETS    : bakent een WHERE-clausule of een filter je populatie af, tel dan eerst wat het WEGGOOIT en kijk daarnaar. Draai de groepering één keer ZONDER het filter (`GROUP BY` op de kolom waarop je filtert) en beoordeel per weggevallen groep of hij er echt niet bij hoort.
UITKOMST : ofwel het filter gooit alleen weg wat er niet bij hoort, ofwel je hebt je populatie stilzwijgend versmald. EEN FILTER VERANDERT NIET ALLEEN JE NOEMER MAAR KAN JE LABELS VERZINNEN: valt er een rij tussenuit waar een reeks van veranderde, dan lijkt de volgende verandering groter dan zij is. GEMETEN 24-08-2026 in punt 69: een filter `type='Ride'` op de activiteiten liet 14 `VirtualRide`-rijen vallen — fietsritten, dus wél populatie. Gevolg: (1) de meest test-achtige rit van de hele reeks verdween, 20 minuten binnen op IF 100,77, de enige rit met IF >= 100 van 222; (2) er ontstond een VALS LABEL — een "sprong" van 270 naar 276 op 2026-01-17, terwijl `rolling_ftp` daar in werkelijkheid DAALT van 277 naar 276 en de echte sprong vier dagen eerder op de weggefilterde rit lag. Een kwart van de labels waarop de kalibratie zou rusten, was een artefact van de WHERE.
HERKOMST : punt 69 (1), 24-08-2026 — gevangen door de weerleggingspas, daarna zelf nagemeten.

<!-- EINDE docs/CC-CHECKS.md -->
