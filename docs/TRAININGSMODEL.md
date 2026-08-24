# Cadans — Het trainingsmodel

De NORM voor de trainings-laag: wat de app hoort te doen met de tijd, het doel en het
lichaam van de gebruiker, en wat hij daarover mag beweren.

Dit is geen samenvatting van `docs/TRAININGSMODEL-BESLUITEN.md`. Dat bestand is het log
en het bewijs: metingen, vondsten, afleidingen. Dit bestand bevat de regels die daaruit
volgen. Waar een regel empirisch geladen is, staat hier het verdict en de status — de
meting blijft daar. Wie de onderbouwing wil, leest daar; wie de norm wil, leest hier.

## §0 — Status, gezag, gebruik

**M1 (NORM) — Gezag.** Dit document is norm voor de trainings-laag. Het is GEEN norm voor
de vormgeving (daar is de live GAS-app de norm) en niet voor de infra: parsers, sync,
datums, row-mapping, zone-extractie (daar is parity met GAS de norm, en drift is een bug).
Voor déze laag is GAS herkomst zonder gezag — bron van waarheid over wat GAS DOET, nooit
over wat goed is.

**M2 (NORM) — Geen code in dit document.** Geen regelnummers, bestandsnamen of
functienamen uit de codebase. Een norm die naar code wijst, rot met de code mee. Vondsten
en regelnummers horen in het besluiten-log en in het verdict-document.

**M3 (NORM) — Nummering.** Regels heten M-nummer, append-only. Nooit hernummeren, nooit
een nummer hergebruiken. Een regel die vervalt blijft staan met status INGETROKKEN en met
de reden. Een verwijzing van buiten dit document moet over jaren nog kloppen.

**M4 (NORM) — Status.** Elke regel draagt er één:
- **NORM** — volgt uit de doelfunctie of is een expliciet ontwerpbesluit. Geldt tot een
  expliciet nieuw besluit.
- **HEURISTIEK** — een verdedigbare coach-keuze zonder bewijs. Als zodanig te benoemen,
  ook naar de gebruiker.
- **BEVINDING** — een empirische uitspraak, met opzet, omvang en bewijskracht erbij.
- **OPEN** — een vraag die dit model niet beantwoordt. De app mag niet doen alsof hij het
  antwoord heeft.
- **INGETROKKEN** — is geclaimd, is teruggetrokken, niet hergebruiken.

**M5 (NORM) — Claimregel.** De app doet geen bewering — in coach-tekst, in de interface of
naar buiten — die hier niet als regel met een status staat. Een heuristiek wordt niet als
wetenschap gepresenteerd; een bevinding niet sterker dan zijn opzet toelaat.

**M6 (NORM) — Een schending is een bevinding, geen release-gate.** Of een schending de
cutover blokkeert, is een aparte vraag met een eigen criterium (geen functionele regressie
t.o.v. de vorige app). Urgentie is nog een derde as: iets kan dringend zijn zonder
blokkerend te zijn, en andersom.

## §1 — Doelfunctie

**M7 (NORM) — Doelfunctie.** Het model maximaliseert RENDEMENT PER BESCHIKBAAR UUR: de
best haalbare vooruitgang op het doel van de gebruiker, binnen de tijd die hij heeft. Alle
regels hieronder zijn hier ondergeschikt aan.

**M8 (NORM) — Wat de doelfunctie uitsluit.** Twee dingen, allebei gangbaar:
(a) **Volume-maximalisatie.** Meer uren is geen prestatie van het model. Het model krijgt
de uren, het verzint ze niet.
(b) **Conservatisme omwille van retentie.** Een model dat zacht traint omdat zachte
trainingen de gebruiker binnenhouden, optimaliseert de verkeerde grootheid. Dit is de plek
waar dit model bewust anders staat dan producten die op retentie sturen.

**M9 (NORM) — Schaal-eis.** Het model werkt bij 3 uur per week en bij 15. Specifiek en
universeel tegelijk: geen aparte modus voor wie weinig tijd heeft, geen aparte modus voor
wie veel tijd heeft. Wat verandert is de dosering, niet het model.

## §2 — Agency

**M10 (NORM) — De ene regel.** De app STELT VOOR, de gebruiker BEVESTIGT, en de app zegt
altijd WAAROM.

**M11 (NORM) — Default.** Bij een voorgestelde afzwakking blijft het ORIGINEEL staan tot
de gebruiker kiest. Het origineel blijft zichtbaar, de suggestie ligt ernaast, de vraag is
expliciet (doorpakken of afgezwakt), de gebruiker keurt goed. Stilzwijgend vervangen is
geen voorstel.

**M12 (NORM) — De cijfers weten het niet.** HRV, slaap en readiness zijn ruis-gevoelige
proxies. De renner heeft informatie die het model niet heeft: hij weet of hij ziek wordt,
of hij slecht sliep door een kind of door zijn benen, of de dag zwaar wordt. Het model
raadt; hij weet.

**M13 (NORM) — Automatisch ingrijpen is een defect.** Een plan dat zichzelf afzwakt zonder
instemming schendt M10 en M11, en leunt bovendien op een premisse die haar bewijslast niet
heeft ingelost (§3). Dat is een defect, geen bewuste afwijking.

**M14 (OPEN) — Week of dag.** Op welk niveau de voorstel-en-bevestig-lus hoort te draaien,
is niet uitgewerkt. Een weekvoorstel dat maandag om instemming vraagt en een dagvoorstel
dat vrijdagochtend om instemming vraagt zijn verschillende producten. De regel geldt voor
beide; de vorm ligt niet vast.

## §3 — Bewijslast

**M15 (NORM) — Beslisser versus informant.** Een signaal dat het VOORSTEL VERANDERT draagt
bewijslast. Een signaal dat alleen INFORMEERT draagt die niet. Wie het plan stuurt, moet
laten zien dat sturen beter is.

**M16 (NORM) — Wat een signaal zonder ingeloste bewijslast wél mag.** Informeren, en een
alternatief NAAST het voorstel leggen — met een hedge in de copy en met het origineel als
default (M11). Wat het niet mag: het voorstel vervangen, of zelf de default worden.

**M17 (NORM) — Promotiepad.** Een signaal wordt pas beslisser als het zijn bewijslast
inlost: een toets die het effect kán zien, op een uitkomstmaat die niet door de ingreep
zelf besmet is. Tot die tijd is de status niet "nog niet onderzocht" maar "informant".

**M18 (BEVINDING) — Readiness is beslisser af.** De readiness-score is getoetst tegen de
historie van de testcase: gemerkte dagen gingen niet slechter, de richting was nul tot
omgekeerd, en het effect overleefde de controle niet. Opzet, aantallen en de drie redenen
waarom de meting niet beslissend is — RPE is een zwakke maat voor verminderd vermogen; de
meting is circulair (de app zwakte af, dus de sessie wás lichter); de waarde van een
opgevolgde waarschuwing is niet meetbaar — staan in het besluiten-log. Readiness is
informant. De bewijslast ligt nu bij readiness, niet bij wie eraan twijfelt.

**M19 (OPEN) — Wat blijft er van de afzwak-keten over** als die bewijslast niet wordt
ingelost? Niet beantwoord. Eerst een betere uitkomstmaat: vermogen bij gelijke RPE, of
afgemaakt-versus-voorgeschreven vermogen. RPE zelf is de maat niet.

**M20 (NORM) — Eisen aan elke toets in dit model.** (a) De uitkomstmaat moet het effect
kunnen zien. (b) De toets controleert voor wat het effect nabootst. (c) Circulariteit wordt
uitgesloten of benoemd. (d) Een niet-meetbaar mechanisme mag genoemd worden als beperking,
nooit als steun.

## §4 — Grens van het model

**M21 (NORM) — Doelgroep.** De amateurfietser die zijn tijd efficiënt wil benutten en beter
wil worden. Niet begrensd door leeftijd, niveau of volume.

**M22 (NORM) — Zichtbaarheidsgrens.** Wél begrensd door wat de app kan zien: een
vermogensmeter, gesynchroniseerde ritten, gestructureerd trainen, en een doel. Dat is de
doelgroep-grens; daarbuiten is geen doelgroep.

**M23 (NORM) — Het belastingsmodel is de grens, niet de zones.** Zones kunnen op hartslag:
de app haalt zoneminuten uit hartslag als vermogen ontbreekt, en schrijft zelf ook in bpm
voor. Maar de keten van FTP via TSS naar chronische en acute belasting is vermogen-only.
Wat wegvalt zonder vermogensmeter is niet de weergave — het is het model.

**M24 (NORM) — Geen half model.** Hartslag-only is geen modus. Een gebruiker buiten de
zichtbaarheidsgrens krijgt geen uitgeklede versie die doet alsof: een app die zonder
belastingsmodel toch een plan voorschotelt, verkoopt een lege huls. Dit is een afgebakende
keuze met een reden, geen omissie. Wie deze groep ooit wil bedienen, bouwt een tweede
belastingsmodel — geen vlag.

## §5 — Invoer

**M25 (NORM) — Capaciteit is de primaire invoer.** Hoeveel tijd de gebruiker heeft, is de
invoer waar alles op rust: de doelfunctie deelt erdoor.

**M26 (NORM) — Capaciteit is een GEDECLAREERDE LIMIET.** Een eigen veld, los van het
weekplan. Een volume-preset is een dosering, geen limiet. Zonder dit veld bestaat de regel
"je zit onder je limiet" niet — er is dan niets om onder te zitten.

**M27 (NORM) — Capaciteit is niet afleidbaar uit data.** Deed is niet kon. Wie het plafond
uit het gereden volume afleidt, bakt het plateau in: het model verwart de vorige beperking
met de huidige.

**M28 (NORM) — De weekplanner is intentie**, en daarmee de belangrijkste sensor van het
model. Wat de gebruiker van plan is te doen, weet geen enkele andere bron.

**M29 (NORM) — Data mag de limiet niet BEPALEN, wel TEGENSPREKEN.** Staat de gedeclareerde
limiet structureel onder wat de historie laat zien, dan is dat zelf een bevinding, en mag
de app hem voorleggen — als voorstel, onder M10. Dit is de enige richting waarin data aan
de limiet mag komen.

**M30 (NORM) — Sensor-status.** Elke invoer heeft een status, en die bepaalt wat hij mag.
Gedeclareerde capaciteit en weekplan sturen (M25–M28). Uitgevoerde training is feit.
Subjectieve terugkoppeling — RPE, check-in, de reden waarom een training niet doorging —
informeert. Wellness-proxies informeren tot ze hun bewijslast inlossen (§3).

**M31 (OPEN) — Twee sensoren zijn gebouwd maar niet aangesloten:** de reden waarom een
training niet doorging (agenda of benen — dat verschil verandert wat het model hoort te
doen), en het verschil tussen verwachte en gerapporteerde RPE (intensiteits-appetijt). Geen
nieuwe bouw; bedrading.

**M32 (OPEN) — Het capaciteit-veld zelf**, de prompt die erom vraagt en de melding-infra
eromheen zijn benoemd, niet ontworpen.

## §6 — Doelen

**M33 (NORM) — Aanbiedbaarheids-regel.** Een doel bestaat in de app alleen als het model
het kan MÉTEN en kan BEDIENEN. Een doel aanbieden waarvoor geen maat bestaat, is een
belofte zonder dekking: de gebruiker kiest het, en de app kan niet zien of hij vooruitgaat.

**M34 (NORM) — De vijf doelen.**
1. **FTP verbeteren.**
2. **Conditie verbeteren** = LANGER KUNNEN DOORRIJDEN (duurvermogen). Niet "algemeen
   fitter".
3. **Lange klimmen verbeteren.**
4. **Korte klimmen verbeteren.**
5. **Onderhouden** = MAXIMAAL FTP-BEHOUD BIJ MINDER UREN.

**M35 (NORM) — VO2max is een MIDDEL, geen doel.** Als doel is het een fysiologische
grootheid die de gebruiker niet nastreeft — hij wil ergens beter in worden. Als middel
blijft het volledig in gebruik; korte klimmen leunen erop. De pools blijven.

**M36 (NORM) — Lang en kort klimmen zijn twee doelen, geen één.** Het onderscheid mag niet
uitsluitend via een event binnenkomen: zonder event kan het model dan niet zeggen wélke
klimmen, terwijl de gebruiker het wel weet. Een doel dat alleen bestaat als er toevallig
een wedstrijd in de agenda staat, is geen doel.

**M37 (NORM) — Onderhouden is een ANTWOORD OP CAPACITEIT, geen periodiseringsfase.** De
uren zakken — een kind, een winterdip, een drukke periode — en de gebruiker schakelt zelf.
Wat het doel vraagt is FTP-behoud bij minder volume. Dat is een intensiteits-opgave, geen
rustperiode.

**M38 (NORM) — Wat elk doel van het plan vraagt.** Dit legt vast wat het plan moet
BEREIKEN, niet wat het moet bevatten.
- **FTP:** een herhaalbare, progressieve dosis rond de drempel. Bij weinig uren is dat de
  ruggengraat, niet de garnering.
- **Conditie:** een progressieve duurprikkel, plus een maat die laat zien of het
  duurvermogen groeit. Die maat bestaat niet — zie M39.
- **Lange klimmen:** langdurig vermogen rond en boven de drempel, mét de vermoeidheid die
  eraan voorafgaat.
- **Korte klimmen:** herhaalbaar vermogen ver boven de drempel, met herstel ertussen.
- **Onderhouden:** de intensiteit die FTP draagt blijft staan terwijl het volume zakt. Een
  onderhoudsweek is geen zachte week.

**M39 (OPEN) — Er is geen duurvermogen-maat in het model.** Chronische en acute belasting
zeggen niets over of je langer kunt doorrijden. Conditie is daarmee het enige doel dat het
model structureel niet kan bedienen; het staat op OPEN tot die maat er is, en tot dan is de
belofte niet gedekt (M33).

**M40 (NORM) — Een doel moet bij de uren passen.** Uit M7 volgt dat een doel dat binnen het
urenbudget niet haalbaar is, geen goed doel is. Het model hoort dat te kunnen zeggen.

**M41 (OPEN) — De app kan M40 niet uitspreken.** "Dit doel past niet bij deze uren" volgt
uit de norm, maar het model kan het oordeel nu niet vellen. Tot het zover is, doet de app
niet alsof (M5).

**M42 (NORM) — De huidige doel-lijst in de app is niet deze vijf.** Welke ingreep dat vergt
en wanneer die landt, is een verdict- en bouw-vraag, geen model-vraag.

## §7 — Belasting en intensiteit

**M43 (NORM) — Piramidaal is de norm.** Het grootste deel van de tijd laag, een substantieel
middenstuk, een klein hard topje.

**M44 (NORM) — Sweet-spot is de ruggengraat bij weinig uren.** Bij een klein urenbudget is
dat de dosering met de beste opbrengst per uur: hoog genoeg om te tellen, laag genoeg om te
herhalen.

**M45 (HEURISTIEK) — Polarized pas vanaf ongeveer 8 à 10 uur per week.** Dat getal is een
coach-heuristiek, geen bevinding; het wordt zo benoemd en niet als wetenschap vermomd.
Onderbouwing: polarized komt van elite-observaties bij 15 tot 30 uur per week (Seiler);
meta-analyses vinden geen duidelijke superioriteit boven piramidaal of drempel;
observationeel wielrenwerk (van Erp, Sanders) toont overwegend piramidaal. En 80/20 van 6
uur is 1,2 uur hard: dat is geen dosis.

**M46 (NORM) — Elke sessie heeft een bedoeling. Er is geen restpost.** Een sessietype dat in
het plan verschijnt omdat er niets anders paste, is een ontwerpfout — zeker als datzelfde
type elders een bewuste prikkel hoort te zijn. De duur van een prikkel volgt uit wat de
prikkel moet doen, niet uit wat er in het gat past.

**M47 (HEURISTIEK) — Binnen de gedeclareerde capaciteit is TOTALE BELASTING de primaire
hendel; intensiteit is de verdeling ervan.** Weinig uren betekent niet vanzelf "dus
intensiteit" — dat is de standaardfout van producten voor wie tijd tekortkomt. Steun: in de
aanloop-historie van de testcase liep het resultaat monotoon mee met het weekvolume, niet
met een losse zware sessie. Zwakte: één renner, vier aanlopen, observationeel, en uren
correleren met alles (motivatie, gezondheid, leven). Twee grenzen: dit gaat over hoevéél,
niet over hoe verdeeld (M43–M45 gaan over de verdeling); en het geldt BINNEN de limiet — de
app duwt de uren niet omhoog, alleen M29 mag de limiet tegenspreken. Falsificatiepad:
dezelfde toets bij meer gebruikers, met controle voor gezondheid en onderbroken aanlopen.

**M48 (NORM) — Dosering weegt de voorgaande weken mee.** Wat je de weken ervoor deed,
verandert wat deze week hoort te zijn. Een model dat de meegenomen belasting op één zet,
doseert per week in het luchtledige.

## §8 — Periodisering en transities

**M49 (NORM) — De fase volgt het doel.** Welke macro-fase het plan draait, is een
trainingsbeslissing. Een fase die gepind wordt om een intern probleem op te lossen — een
ontbrekende toewijzing, een lege sleutelsessie — is een loodgietersfix die zich voordoet als
een trainingsbeslissing. Dat type fout laat zich niet herkennen: alles blijft groen.

**M50 (NORM) — Onderhouden is geen basisfase.** Volgt uit M37 en M49. Pin je Onderhouden op
een opbouwende basisfase, dan levert het plan geen doel-gedreven kwaliteitsdag meer, en
traint de gebruiker zacht precies wanneer hij zijn FTP moet vasthouden. Dat is het
omgekeerde van wat het doel vraagt, en het vuurt precies wanneer de uren zakken.

**M51 (NORM) — Plan-transities zijn voorstellen.** Gaat het plan over van doel-gedreven naar
event-gedreven, dan stelt de coach de wissel voor en beslist de gebruiker (M10). Een plan
dat onder je handen van karakter verandert zonder goedkeuring is geen plan maar een
verrassing.

**M52 (OPEN) — De activeringsdrempel** — wanneer een event het plan hoort over te nemen —
ligt niet vast.

## §9 — De coach-stem en levering

**M53 (NORM) — De coach legt de REDENERING uit, geen voorspelling.** De vorm: dit was de
beste training; we zien dat je lichaam het wat zwaarder heeft door een dip in HRV en slaap;
wellicht heb je meer behoefte aan deze training.

**M54 (NORM) — "Wellicht" blijft staan.** Dat woord is empirisch verdiend (M18): het model
raadt hier, en de copy hoort dat te laten horen. Stelligheid over een signaal dat zijn
bewijslast niet heeft ingelost, is een claim zonder dekking (M5).

**M55 (NORM) — De coach claimt nooit iets wat niet gebeurd is.** Geen "ik heb je training
verlicht" als er niets verlicht is. Geen tekst die een handeling suggereert die niet
bestaat. Copy die van een ander pad geleend is, liegt makkelijk: hergebruik van een zin is
hergebruik van haar aannames.

**M56 (NORM) — Een voorschrift is pas geleverd als het uitvoerbaar is.** De best mogelijke
training die de gebruiker niet op zijn apparaat krijgt, levert geen rendement — dan is de
doelfunctie niet bediend, hoe goed het plan ook is. Levering hoort bij het model, het is
geen extraatje.

## §10 — Open: wat het model niet weet

Index van alle OPEN-regels. M57 en M58 wonen hier — ze horen bij geen hoofdstuk, maar ze
raken het model wel.

- **M14** — week- of dag-lus onder de agency-regel.
- **M19** — wat blijft er van de afzwak-keten als readiness haar bewijslast niet inlost.
- **M31** — twee gebouwde, niet-aangesloten sensoren.
- **M32** — capaciteit-veld, prompt en melding-infra: benoemd, niet ontworpen.
- **M39** — geen duurvermogen-maat; Conditie is niet gedekt.
- **M41** — "dit doel past niet bij deze uren": de app kan het niet zeggen.
- **M52** — event-activeringsdrempel.

**M57 (OPEN) — Meerdere gebruikers en hun toegang.** Per-gebruiker API-sleutels betekent
credentials met volledige accounttoegang bewaren: voor een commercieel product het
verkeerde model. OAuth is vermoedelijk de route — te verifiëren, niet aannemen.
Toegangsgegevens horen in een onboarding-flow, niet in het instellingen-menu (daar wijzig
je ze later).

**M58 (OPEN) — Open-source zonder backend versus commercieel product.** Die keuze is niet
gemaakt, en hij raakt dit model: zonder backend bestaat de infra voor een prompt op zondag
(M32) niet in de vorm die nu voor de hand ligt, en verandert het antwoord op M57. Het model
neemt die keuze niet vooruit.

## §11 — Testcase

De invoerwaarden staan in het besluiten-log, hoofdstuk Testcase — daar en niet hier: één
bron. Hier staat wat de testcase IS en waarvoor hij dient.

**M59 (NORM) — De testcase is een proefopstelling, geen regel.** Elk model-voorstel wordt
ertegen gehouden: produceert het model hier een niet-triviaal, verdedigbaar plan? Wat de
testcase laat zien wordt nooit vanzelf een regel — n is één, en één renner is een geval,
geen bewijs.

Waarom deze proefopstelling nuttig is — eigenschappen, geen waarden:
- **De grens is de agenda, niet de benen.** Een model dat capaciteit uit de benen afleidt,
  valt hier meteen door de mand (M27).
- **Het gedeclareerde plafond wordt door de eigen historie tegengesproken:** de beste
  aanloop lag ruim boven de gedeclareerde limiet. Precies de spanning die M29 dekt.
- **De doelketen loopt van FTP via Onderhouden naar een A-event.** Alle drie zitten erin,
  inclusief de overgang die M51 dekt en de fase-pin die M50 verbiedt.
- **Het doel op de dag is niet uitrijden en niet racen**, maar sterk over de hellingen
  blijven. Een model dat alleen finish-of-podium kent, mist dit.
- **De lange rit is maandelijks en seizoensgebonden**, niet wekelijks. Een model dat de
  lange rit als vaste weekvulling behandelt, valt hier door M46.
- **Duurvermogen bij hoge voorafgaande belasting is deels gemeten en respectabel.** Niet te
  lezen als "geen probleem": dunne bak, geen gecontroleerde test.
- **Intensiteits-appetijt: gemiddeld-plus.** Een model dat op zeker speelt, voelt hier te
  soft — precies de keuze uit M8(b).

**M60 (INGETROKKEN) — "Een kwart-1-versus-kwart-4-vergelijking meet duurvermogen."** Die
opzet meet pacing. De uitkomst bewijst niets. Niet hergebruiken.

**M61 (INGETROKKEN) — "De losse lange rit is de schaarste-bron van de testcase."**
Theorie-gedreven; overleeft de eigen historie niet. Niet hergebruiken. M46 en M39 blijven
wél staan — die gaan over het model, niet over de renner.

## §12 — Inhalen na een gemiste of te-licht ingevulde sessie

**M62 (NORM) — Inhalen is herverdelen, niet stapelen.** Een gemiste prikkel wordt hersteld
door de resterende week te HERVERDELEN binnen het bestaande urenbudget: een minder
belangrijke resterende sessie wordt vervangen door de prikkel die ontbrak. Belasting boven
op het staande plan leggen is geen inhalen maar opstapelen, en levert meer overbelasting op
dan de gebruiker kan verwerken. Het weekbudget is de grens; wat er niet in past, vervalt
(M64, M66).

**M63 (NORM) — Een niet-geleverde verstreken dag draagt tekort.** Een trainingsdag die
gepland stond en waarvan de prikkel niet is geleverd, telt als tekort — óók als er
helemaal niet gereden is. Dit is een geautoriseerde afwijking van de erfenis, die alleen
dagen meetelde die als gedaan waren aangemerkt en een volledig gemiste dag dus onzichtbaar
liet. Het tekort is het VERSCHIL tussen wat bedoeld was en wat geleverd is; een half
uitgevoerde sessie telt naar rato, niet als volledige misser.

**M64 (NORM) — Alleen een betekenisvol tekort rechtvaardigt een inhaal-advies.** Eén
gemiste sessie of een triviaal volume-verschil wordt niet ingehaald; de gebruiker pakt de
draad gewoon weer op. Pas een gemiste SLEUTELSESSIE — de prikkel die de fase draagt — is
aanleiding voor een voorstel. Een app die elke afwijking wil rechtzetten, leert de
gebruiker dat afwijken een fout is; dat is trainingsinhoudelijk onjuist en pedagogisch
schadelijk.

**M65 (NORM) — Kwaliteit gaat vóór volume bij herverdeling.** Ontbreekt er zowel intensiteit
als duurvolume, dan krijgt de sleutel-/kwaliteitsprikkel voorrang: die draagt de meeste
trainingswaarde en is het slechtst vervangbaar. Een duurvolume-tekort wordt NIET geforceerd
ingehaald — het wordt gespreid over de resterende dagen of losgelaten.

**M66 (NORM) — Inhalen wijkt voor herstel.** Bij lage gereedheid of een rust-vragende reden
(ziekte, bewuste rust) wint verlichten of loslaten van inhalen. De app stelt dan GEEN
inhaal voor. Een tekort is geen schuld die koste wat kost moet worden ingelost; inhalen op
een lichaam dat om rust vraagt, vergroot het gat in plaats van het te dichten.

**M67 (NORM) — Twee kwaliteitsprikkels niet tegen elkaar aan.** Een herverdeelde
kwaliteitssessie wordt niet direct naast een andere harde dag geplaatst. De afstand tussen
zware prikkels is zelf een trainingsvariabele; ze opofferen om een tekort te dichten
ondermijnt precies wat het inhalen moest opleveren.

**M68 (NORM) — Inhalen valt onder de voorstel-regel.** Een inhaal-aanpassing wordt als
ADVIES met uitleg getoond, pas na goedkeuring toegepast, en is omkeerbaar. Op goedkeuring
mag de hele week her-dynamiseren — dat is dan een gevraagde herberekening, geen stille
mutatie. Zonder goedkeuring blijft het originele plan staan (M10, M11).

**M69 (NORM) — Scope-grens: de correctie is per week.** De herverdeling kijkt naar de
huidige week en niet verder. Bij een groot verlies is spreiding over meerdere weken
trainingsinhoudelijk beter; dat kan dit model niet en die claim wordt dus ook niet gedaan
(M5). Bewuste beperking van de eerste versie, geen afgeleide norm.

**M70 (BEVINDING) — De weekend-inhaaltak omzeilt de harde-dagen-afstand.** Gemeten op de
bestaande motor: een tekort-gedreven inhaalsessie die in het weekend wordt geforceerd, is
vrijgesteld van de bewaking die twee zware dagen op rij verhindert, en kan daardoor direct
naast een andere harde dag landen. Dat is een schending van M67. Afbakening: de inhaaltak
op een vrije dag kent die vrijstelling NIET en wordt wél gedowngraded — de bevinding geldt
dus voor de weekend-forcering, niet voor de inhaal-laag als geheel. Opzet: bronlezing plus
een bestaande, slagende test die precies dit gedrag vastlegt; bewijskracht hoog voor die
tak. Per M6 is dit een bevinding, geen release-gate — te adresseren wanneer de inhaal-laag
daadwerkelijk gaat sturen.

**M71 (BEVINDING) — De motor herverdeelt al binnen budget.** Gemeten met een
tekort-scenario tegen een op-plan-controle: weekbelasting, geplande minuten en het aantal
harde dagen bleven exact gelijk; alleen de MOTIVERING van één dag veranderde. De motor
voldoet dus al aan M62 en stapelt niet. Keerzijde: het verschil dat de gebruiker te zien
zou krijgen is daarmee vaak geen ander plan maar een andere uitleg. Opzet: twee fixtures op
één configuratie; bewijskracht indicatief, niet uitputtend.

**M72 (NORM) — Herstel is beschermd.** Een inhaal-herverdeling mag nooit een geplande
hersteldag opeten. Herstel is een actieve trainingscomponent — de adaptatie gebeurt daar,
niet tijdens de prikkel — en geen leeg tijdslot dat toevallig vrij is. Een tekort dichten
door de hersteldag om te zetten in een kwaliteitssessie is geen herverdelen maar verkapt
stapelen: het weekvolume blijft gelijk terwijl de belasting stijgt. Dat is precies wat M62
verbiedt. Waar de week geen ruimte biedt zonder herstel aan te tasten, vervalt de inhaal
(M64, M65).

**M73 (NORM) — De reden weegt mee.** Waarom een sessie niet is geleverd, bepaalt of inhalen
wordt aangeboden. Bewuste rust, of bewust iets anders doen, is een KEUZE — daar valt niets
in te halen, en een aanbod zou de keuze ondermijnen en de gebruiker leren dat afwijken een
fout is (M64). Tijdgebrek is een omstandigheid: dáár is een aanbod op zijn plaats. Is er
geen reden ingevuld, dan wordt niets verondersteld en blijft het aanbod open. Draagt élke
niet-geleverde dag van de week een rust-vragende reden, dan is er geen inhaal-voorstel.
Sluit aan op M66: waar het lichaam of de gebruiker om rust vraagt, wint rust van inhalen.

**M74 (NORM) — Het karakter van een training is invariant onder meso- en fase-modulatie.**
Het karakter van een training — de vermogenszone waarin de hoofdblokken liggen — is invariant
onder meso- en fase-modulatie. Modulatie mag een blok nooit uit de zone tillen die zijn nominale
type voorschrijft; een sweetspot blijft sweetspot, een endurance-rit blijft endurance.

**M75 (NORM) — De meso-cyclus bouwt op via de dosis, niet de intensiteit per blok.**
De meso-cyclus bouwt op via de DOSIS, niet via de intensiteit per blok: langere of meer
intervallen op dezelfde relatieve intensiteit plus meer endurance-volume. De op te bouwen
grootheid is de tijd-in-zone, en daarmee de weekbelasting (TSS).

**M76 (NORM) — De recovery-week verlaagt de dosis, niet het karakter.**
De recovery-week van een meso-cyclus verlaagt de dosis (tijd-in-zone/TSS), niet het karakter;
de relatieve intensiteiten blijven gelijk.

**M77 (NORM) — De mix verschuift op macro-niveau, niet als week-op-week meso-hendel.**
De verhouding tussen trainingstypen (de mix, bijvoorbeeld het aandeel VO2max tegenover
sweetspot) verschuift op MACRO-niveau richting het doel of event (base→build→peak), niet als
week-op-week meso-hendel.

**M78 (INGETROKKEN) — "De huidige intensiteits-modulatie schendt de karakter-invariantie."**
Geclaimd op grond van een leesronde en teruggetrokken op grond van een meting; niet
hergebruiken. De claim was dat de implementatie het %FTP per blok vermenigvuldigt met een
meso-factor plus een fase-offset, en dat elk blok in de piek-mesoweek een zone omhoog
schuift. Beide termen zijn gemeten en weerlegd — zie M83. Wat WEL beweegt is de dosis, en
dat is precies wat M75 en M76 voorschrijven. De duur-schaling van de lange rit blijft
correct; er is geen te verwijderen pct-hendel, want die hendel bestaat niet.

**M79 (HEURISTIEK) — De herstelweek snijdt in het VOLUME, niet in de frequentie van de prikkel.**
De dosisverlaging die M76 vraagt komt uit het duurvolume — de lange rit voorop — terwijl een tot
twee korte prikkels op hun eigen relatieve intensiteit blijven staan. Richtwaarde: 40 tot 60
procent minder volume. Dat getal is coachconventie, breed gedeeld in duursport, en wordt als
zodanig benoemd en niet als wetenschap vermomd. Zwakte, expliciet: het directe bewijs is dun. De
gecontroleerde duursportstudies gaan over drie weken verlaagd volume EN intensiteit zonder
prestatieverlies, of over geintensiveerde blokken bij elite waar zowel behouden als fors verlaagd
volume winst gaf. Over EEN week is detraining onwaarschijnlijk ongeacht de invulling; deze regel
kiest dus de vorm die de prikkel het minst aantast, niet de vorm die aantoonbaar beter is.
Falsificatiepad: dezelfde blokopbouw met twee invullingen, uitkomstmaat het vermogen in de eerste
opbouwweek erna. Bij weinig uren weegt de regel zwaarder, want daar is de kwaliteitsprikkel de
ruggengraat (M44) en het duurvolume het residu.

**M80 (BEVINDING) — De herstelweek van de app snijdt precies andersom.**
Gemeten over 2100 weken met de functie die de app zelf aanroept. Op de testcase-weekvorm gaat het
volume van 286 naar 285 minuten terwijl de drempelminuten van 98 naar 10 gaan; de belasting komt
op 63 procent van de opbouwweek, volledig uit de intensiteitskant. De kwaliteitsdagen gaan van
drie naar een. Wat WEL klopt: de overgebleven kwaliteitsdag houdt zijn karakter — drempelblokken
op 98 tot 105 procent FTP — en halveert alleen zijn blokduur van 18 naar 10 minuten, precies
zoals M76 voorschrijft. Wat niet klopt is de verdeling eromheen: de lange rit blijft op volle duur
staan. Drie andere weekvormen geven hetzelfde beeld. Bij Onderhoud vuurt de tak niet, want dat
doel draagt geen mesocyclus. Opzet: sweep over zeven weekvormen, vijf doelen, alle macrofasen en
alle mesoweken, met een A/A-ijking van nul afwijkende cellen. Bewijskracht hoog voor het gedrag,
geen uitspraak over wat de renner ervan merkt.

**M81 (NORM) — Een uitspraak over KARAKTER rust op de vermogensband van het blok, niet op de zone
waarin dat blok wordt geteld.**
M74 noemt het karakter de vermogenszone waarin de hoofdblokken liggen. De zone-indeling waarin de
app minuten telt is die van de renner zelf en draagt haar eigen grenzen; een blok krijgt daarin
EEN label terwijl zijn band over meerdere zones kan liggen. Zo'n label kan per constructie geen
karakter-uitspraak dragen, en een methodiek-uitspraak die erop rust is niet toetsbaar. Wat de
uitspraak wel draagt is de band zelf: de onder- en bovengrens in procenten van de drempel die het
blok voorschrijft. Dit verbiedt de zone-telling niet en verandert er niets aan — het zegt alleen
waar een karakter-oordeel op mag staan.

**M82 (BEVINDING) — De trainingsbanden en de zone-indeling liggen structureel scheef.**
Gemeten over 140 weken uit zeven weekvormen, vijf doelen en vier event-afstanden, met de
plan-bouwer zelf aangeroepen: het plan levert 38 distincte banden over 39190 blokminuten, en die
laten precies DRIE binnen-naden vrij waar geen enkele band dwars loopt — 81 tot 88, 94 tot 95, en
109 tot 112. De zone-indeling knipt onder meer op 90 en op 105, en die vallen daar allebei buiten.
Gevolg, drie lekken: sweet-spot dat als tempo telt, sweet-spot dat als drempel telt, en drempelwerk
dat als anaeroob telt. De drempelzone draagt 1824 minuten sweet-spot naast 4578 minuten
drempelwerk. De naad tussen die twee ligt op 95 procent en NIET op de drempel zelf: op 95 loopt nul
band dwars, op 100 worden 2742 van de 6402 minuten doorgesneden. En er bestaat geen enkel sjabloon
met tempo als bedoeling — elke minuut die als tempo telt komt uit een sweet-spot-sjabloon. Opzet:
instrument vooraf geijkt op 21 van de 21 gepinde waarden; bewijskracht hoog voor deze bibliotheek,
geen uitspraak over een andere.

**M83 (BEVINDING) — `mesoFactor` schaalt de DOSIS en niet het percentage.**
Gemeten binnen hetzelfde archetype, want een vergelijking over archetypes heen meet
variant-rotatie in plaats van modulatie. Over 200 groepen van weekvorm maal doel maal
macrofase maal archetype met minstens twee mesoweken is de werkband — het zwaarste blok van
de sessie — identiek in 200 van de 200, terwijl de werkminuten in 200 van de 200 bewegen.
Over 197 groepen met minstens twee macrofasen is de werkband identiek in 197 van de 197. De
factor is uit de werkminuten afgelezen en niet aangenomen: 1,00 / 1,08 / 1,15 / 0,60, met de
spreiding verklaard door afronding op één decimaal bij korte blokken. Hiermee vervalt M78.
Opzet: 420 cellen, 1980 sessies, 14978 blokken, instrument vooraf geijkt op 21 van de 21
gepinde waarden; bewijskracht hoog voor deze bibliotheek, geen uitspraak over een andere.

**M84 (BEVINDING) — Het plan polariseert niet bij hoger volume; het verdunt.**
Seiler-3-zone op de band (Z1 onder 80 procent FTP, Z2 80 tot 100, Z3 daarboven), opbouwweken,
gepoold over vijf doelen en drie macrofasen: 3,0u 69/20/10 · 4,5u 73/20/8 · 6,0u 78/17/6 ·
8,0u 82/12/6 · 10,0u 85/11/5 · 12,0u 87/9/4 · 14,0u 89/8/3. Het plan is piramidaal op elk
volume en wordt dat sterker met de uren; van een kanteling naar polarized is geen spoor. De
toewijzingsregel is niet dragend — midpunt, proportioneel en meerderheid vallen binnen twee
procentpunt samen, omdat op grens 80 nul en op grens 100 slechts 4,1 procent van de
blokminuten wordt doorgesneden. De variatie is systematisch en geen variant-rotatie: bij
vaste weekvorm, doel en fase beweegt het Z3-aandeel gemiddeld 0,9 procentpunt over de
mesoweken, tegen 8,7 over de doelen en 6,9 over de volumes.

**M85 (BEVINDING) — De absolute kwaliteitsdosis plafonneert vanaf circa acht uur.**
Absolute minuten per week over dezelfde meetruimte: het weekvolume groeit van 180 naar 840
minuten (factor 4,67) en Z1 van 125 naar 748 (factor 6,0), terwijl Z2 en Z3 samen van 55 naar
92 minuten gaan en vanaf acht uur stilstaan — 88, 92, 94, 92. Zes extra uren leveren nul
extra kwaliteitsminuten. Het plafond zit in het AANTAL kwaliteitsdagen en niet in de dosis
per dag: de trainbare dagen gaan van drie naar zes, maar het aantal dagen met werk boven 100
procent FTP blijft op 1,6 à 1,75, bij 10,4 tot 18,3 zulke minuten per dag. Dit is een
BEVINDING over het gedrag en uitdrukkelijk geen norm-uitspraak: of zes extra uren extra
kwaliteit HOREN te dragen is coach-canon (M7, M43, M44, M45) en valt niet op deze reeks te
ijken. M45 wordt er niet door geschonden — die noemt acht à tien uur als ondergrens waaronder
polarized zinloos is en zwijgt over wat daarboven hoort. Staat als ROADMAP punt 44.

**M86 (NORM) — De herstelweek snijdt in de SESSIEDUUR, met een factor die met het weekvolume
meeloopt.**
De volumeverlaging die M79 vraagt landt op de duur van elke sessie en NOOIT op het aantal
sessies: de frequentie blijft staan. De factor loopt van 0,75 tot en met vijf uur per week naar
0,55 vanaf tien uur, lineair ertussen. HERKOMST BELEID — Daan-besluit van 9 augustus 2026; er
bestaat geen reeks waarop dit te ijken valt, en de eigen historie is per de bewijslast-regels
geen bron voor een regel die gedrag VERVANGT. Onderbouwing: de taper-meta-analyses vinden de
grootste winst bij 41 tot 60 procent minder volume zonder wijziging van intensiteit of
frequentie, en wijzen kortere sessies expliciet aan boven minder sessies; de coachpraktijk voor
herstelweken hanteert 40 tot 50 procent met een of twee korte prikkels. Over de lage kant
beschrijft de literatuur GEEN urendrempel — de structuur is volume-onafhankelijk en alleen het
absolute aantal uren beweegt mee, met circa 20 tot 25 procent bij een basis van vier tot zes
uur. Dat is de reden dat dit een CONTINUE factor is en geen schakelaar: een drempel zou een
aparte modus zijn en M9 verbiedt die. GEMETEN over de volume-as, volume tegenover de
opbouwweek: 76 / 75 / 72 / 63 / 56 / 56 / 56 procent bij 3,0 tot 14,0 uur, met de
karakter-behoudende plek (`docs/PUNT39-PLEK-RECON.md`). De eerder genoteerde reeks
75 / 75 / 71 / 63 / 55 / 55 / 55 hoort bij een ingreep die VOOR de allocator landt en daarmee de
werkband in 31 van de 56 cellen kantelt — M76-schending, dus die curve is geen norm maar een
gemeten eigenschap van een verworpen plek. De prikkeldosis
blijft ×0,60 (M76, M83): met de prikkel vol stijgt de weekbelasting 1 tot 3 procentpunt en de
kwaliteitsminuten van circa 13 naar 16,5 — niet dragend zodra het volume het werk doet.

**M87 (NORM) — De volumekorting van de herstelweek wordt afgezet tegen de OPBOUWWEKEN van
hetzelfde blok, niet tegen de beschikbaarheid van de herstelweek zelf.**
M86 legt de SCHAAL van de factor vast; deze regel legt vast WAAROP hij landt, en dat stond
nergens. De taper-literatuur spreekt over een reductie ten opzichte van het normale
trainingsvolume — de opbouwweken zijn dus de referent. Ligt de beschikbaarheid van de
herstelweek al onder die referentie, dan is de reductie geheel of gedeeltelijk al geleverd en
korten we niet nog eens. HERKOMST BELEID — Daan-besluit van 9 augustus 2026; er bestaat geen
reeks waarop dit te ijken valt. GEMETEN als noodzaak, doel FTP in een herstelweek: vijf dagen
van een uur leveren met de factor 225 minuten, maar wie in diezelfde week drie uur invult
krijgt 135 terwijl die drie uur al 60 procent van zijn normale vijf is en dus al in de band van
M79 ligt; vult hij 5x45 in, dan wordt het 5x34 en zakken de kwaliteitsminuten van 13 naar 10.
De factor stapelt dus op een krimp die de gebruiker zelf al droeg. Staat als ROADMAP punt 45 en
hoort in dezelfde bouw als de factor: zonder deze regel doet M86 in een alledaags geval het
verkeerde.

**M88 (NORM) — De kwaliteitsFREQUENTIE plafonneert; de kwaliteitsDOSIS mag niet met het volume
dalen.**
Twee delen met verschillende herkomst.
(a) HERKOMST LITERATUUR. Het aantal dagen per week waarop boven de drempel wordt gewerkt groeit
niet mee met het beschikbare volume: vanaf circa acht uur horen er TWEE van die dagen te staan, en
meer worden het er niet. Grond: twee intervalsessies per week geven goed getrainde duursporters 2
tot 4 procent winst en verdere frequentieverhoging levert daarbovenop niets, en bij gelijk
totaalvolume bleken twee langere sessies superieur aan vier kortere. DEZE REGEL GAAT OVER
SAMENSTELLING, NIET OVER HET AANTAL KWALITEITSDAGEN. Het plan zet al twee tot drie kwaliteitsdagen
neer; een deel daarvan draagt sweet-spot-werk dat onder de drempel blijft. Wat de regel eist is dat
er vanaf acht uur twee van die dagen ECHT boven de drempel liggen — er komen geen dagen bij.
(b) HERKOMST BELEID — Daan-besluit van 11 augustus 2026. De tijd boven de drempel PER
kwaliteitsdag daalt niet wanneer het weekvolume stijgt. Er bestaat geen grond waarom een sessie
korter zou worden naarmate er meer tijd is; ligt de frequentie vast, dan is de sessieduur de enige
as waarlangs extra beschikbare tijd nog kwaliteit kan dragen.
GEEN GETAL ALS EIS. De uitkomst bij veertien uur ligt niet vast. De eerder genoemde 36 tot 40
minuten boven de drempel was een schatting op de reeks van M85, gemaakt voordat de bron gelezen
was, en is INGETROKKEN als eis; ze blijft een verwachting tot een meting haar draagt.
WAT DE REGEL NIET ZEGT, en dat hoort erbij zodat een volgende ronde de zaak niet groter maakt dan
hij is: dat het huidige plafond fout is. BEREKEND op de reeks van M85 — geen eigen meting — staat
het plan bij veertien uur op 89,0 / 7,9 / 3,2 procent over de drie zones, en dat valt binnen de
spreiding van drie top-5-Giro-renners: 91,3-6,5-2,2 · 83,6-10,6-5,8 · 86,7-8,9-4,4 bij 19,7 · 16,2
· 14,7 uur per week. Kwaliteit evenredig met het volume laten groeien zou het plan buiten die
praktijk duwen. Twee kwalificaties op die vergelijking: die renners rijden 17 tot 29 wedstrijden in
22 weken en halen daar kwaliteit uit die een amateur uit training moet halen, en hun zone-indeling
knipt op circa 85 procent van het drempelvermogen waar M85 op 80 knipt — het app-getal is dus per
constructie het ruimste van de twee.
M9 BLIJFT GELDEN: dit is een continue eigenschap over de hele volume-as en geen aparte modus vanaf
acht uur.

## §13 — IJking en doelcheck

**M89 (NORM) - Aan het eind van een blok staan TWEE vragen, niet een.** IJKING: klopt de drempelwaarde waarop dit plan doseert nog. Die vraag geldt bij ELK doel zonder uitzondering, want elk plan doseert op een percentage van die waarde, en een verlopen drempel verschuift stilzwijgend elke zonegrens en daarmee elke norm waarop de app oordeelt. DOELCHECK: is dit doel vooruitgegaan. Die vraag verschilt per doel en draagt per doel een eigen maat. Bij sommige doelen delen de twee dezelfde meting met een verschillend criterium: bij een behoud-doel is de ijking een schaalvraag en de doelcheck een vloer. Dezelfde meting, twee vragen. Een app die er een van maakt, beantwoordt de andere niet.

**M90 (NORM plus HEURISTIEK) - De ijking hangt aan de doelblokgrens en is een VOORSTEL.** Drie delen met verschillende herkomst. (a) NORM. De ijkinspanning valt op de grens van een doelblok: daar sluit zij de doelcheck van het aflopende blok en zet zij de zones voor het volgende. Een moment, twee opbrengsten. De ijking rijdt daarmee de doelblok-klok en niet de dosis-klok; dat zijn twee klokken met verschillend werk. (b) HEURISTIEK. Een ijkinspanning per doelblok, niet meer. De klassieke leer test elke vier a zes weken, maar die cadans bestaat om een BEWEGENDE drempel bij te houden; bij een doel dat op behoud stuurt is er geen beweging om te volgen, en kost elke extra test frequentie - precies de grootheid die zo'n doel beschermt. Coachconventie, geen bevinding. (c) NORM. De ijking volgt M10 en M11: de app STELT VOOR, de gebruiker bevestigt of wijst af, en het staande plan blijft staan tot hij kiest.

> **DEELREGEL (a) IS OP HET PUNT VAN DE PLAATSING VERVANGEN DOOR M92 (23-08-2026).** Niet ingetrokken en niet herschreven (M3): de tekst hierboven blijft staan als de aanleiding. Wat er niet meer geldt is dat de ijking op het EINDE van een doelblok valt. GROND: bij een doorrollend blok vallen opening en einde samen en verandert er niets, maar bij een DOELWISSEL meet de eind-plaatsing het aflopende doel af terwijl het nieuwe blok twaalf weken lang op een onbevestigde drempelwaarde doseert. De drempel doet zijn werk VOORUIT, dus zij hoort aan het begin van het blok dat zij doseert. Deelregels (b) en (c) gelden ONGEWIJZIGD.

**M92 (NORM) - De ijkinspanning valt op de OPENING van een doelblok.** Daar stelt zij de drempelwaarde in waarop het hele blok doseert; elke zonegrens en elke dosis van de komende twaalf weken hangt eraan. Een vers doelblok ontstaat bij een DOELWISSEL en bij de eerste inrichting; bij een doorrollend blok valt de opening samen met het einde van het vorige, zodat de twee opbrengsten van M90a daar behouden blijven. Het verschil bestaat precies bij de wissel, en dat is het geval dat telt: een ijking aan het eind meet daar een doel af dat niet meer geldt.

**M93 (NORM) - De omrekening van twintig minuten naar een drempelwaarde is 95 procent.** Besloten 24-08-2026. M92 zegt WANNEER er geijkt wordt en DAT de ijkinspanning de drempelwaarde instelt; M93 zegt met WELK GETAL. De nieuwe drempelwaarde is **95 procent van het beste twintigminutenvermogen uit de testrit**, afgelezen op het duurpunt van twintig minuten zelf en niet op een naburig duurpunt. HERKOMST-ETIKET: **BELEID — een Daan-besluit**, geen geijkte drempel en geen meting. Een gekozen waarde verantwoord je; je bemonstert hem niet.

> **WAAROM DIT EEN EIGEN NUMMER DRAAGT en niet als aanhangsel van M92 leeft.** Het is een andere vraag: M92 gaat over de PLAATSING van de ijking in de tijd, M93 over de REKENREGEL. Wie M92 wijzigt raakt de kalender, wie M93 wijzigt raakt elke zone en elke dosis van het hele blok. Ze horen apart citeerbaar te zijn. M3 gerespecteerd: er is niets hernummerd.

> **DE VOORGESCHIEDENIS, want het getal is niet nieuw en dat is precies de valkuil.** 95 procent stond al als eindopmerking op het testprotocol en tweemaal in de bevroren voorganger-app. Dat gaf het GEEN gezag: die app is een port-referentie en geen normbron, en een zin in een toelichting is geen regel. Tot dit besluit leefde de omrekening dus als tekst die de app TOONDE zonder ernaar te handelen. M93 geeft haar het gezag dat zij niet had.

> **DE AANVAARDE AFWIJKING, expliciet aanvaard en niet over het hoofd gezien.** De power-curve levert de beste twintig minuten van de HELE rit, terwijl de protocoltekst slaat op het gemiddelde over het voorgeschreven all-out-blok. Die twee lopen uiteen zodra het beste venster dat blok niet exact dekt, en het maximum over alle vensters is per constructie groter dan of gelijk aan dat blokgemiddelde. De uitkomst valt dus eerder iets te hoog uit dan te laag. Aanvaard, omdat het alternatief een extra ophaalactie per rit kost én ervan uitgaat dat de renner de structuur exact rijdt.

> **DRIE RANDVOORWAARDEN HOREN ONLOSMAKELIJK BIJ M93.** (1) De omrekening geldt ALLEEN bij het doel FTP. De app biedt per doel een ander testprotocol aan en alleen dat ene draagt een omrekening; het conditie-protocol meet hartslagdrift en het klimprotocol is een handmatige vergelijking met vorige pogingen. (2) Er hoort een PLAUSIBILITEITSGRENS bij, want de curve geeft ook voor een rustige duurrit een keurig getal — gemeten geval: een Z2-rit zou een verlaging van 34 procent hebben voorgesteld op een staande drempelwaarde. Zonder die grens zegt de app "gemeten" waar niets gemeten is, en dat is M5. Die grens is een DREMPEL en wordt op de echte reeks geijkt, nooit in een gesprek gekozen. (3) Pas bij GOEDKEURING is er geijkt; het voorstel alleen ijkt niets (M91).

> **VINDPLAATSEN EN METINGEN staan bewust NIET hier** (M2): zij staan in het verdict-document van ROADMAP punt 69. Daar staan de bestandsnamen, de regelnummers en de gemeten getallen die aan dit besluit hangen.


Bij een opening biedt de app de ijking aan met DRIE uitgangen: inplannen, afwijzen, of BEVESTIGEN dat de staande drempelwaarde nog representatief is. De renner weet of zijn waarde nog klopt en de app raadt dat (M12); de app stelt voor en hij beslist (M10). Een bevestiging DEKT het blok maar is GEEN meting: opeenvolgende bevestigingen worden geteld en zichtbaar gemaakt, want de app doet nooit alsof er gemeten is als er niet gemeten is (M5, M91). Afwijzen laat de drempel ONGEIJKT en dat blijft M91.

Valt de opening binnen de meetinterval-afstand van een reeds gedane maximale inspanning, dan vervalt het aanbod zonder vraag: de drempel is dan vers en er valt niets te bevestigen. De dagvloer draagt sindsdien alleen die NABIJHEIDS-vraag; de FREQUENTIE - een ijking per doelblok, M90b - wordt door de plaatsing zelf bewaakt.

> **TOEPASSING VAN M91 OP DE SPRONG, besloten 23-08-2026.** Een "reeds gedane maximale inspanning" is een GEREDEN A/B-wedstrijd of een GEDANE test. Een sprong in `rolling_ftp` telt daar NIET onder en onderdrukt het aanbod dus niet meer. GROND: `rolling_ftp` is intervals' eigen schatting van de drempel en daarmee een proxy in precies de zin die M91 verbiedt. Het detector-argument - een sprong toont dat er hard gereden is - haalt de eindstreep niet: hij toont niet WELKE waarde het blok moet doseren, en juist die waarde is het onderwerp van de ijking. Erger nog, een onderdrukking maakt de app STIL: geen aanbod, geen antwoord, geen zichtbare staat, precies de toestand die M91 wil uitsluiten. GEMETEN vóór de ingreep: bij een sprongtempo van één per ongeveer 182 dagen werd 169 van de 440 doelblok-openingen door een sprong alleen onderdrukt. De sprong blijft INFORMANT (M17, M30) en wordt in de blok-terugblik gewoon genoemd.

> **HOOGSTENS ÉÉN AANBOD PER OPENING, besloten 23-08-2026.** Twee testaanbiedingen rond dezelfde opening is erger dan het gat dat deze reeks moest dichten - de renner vroeg om MINDER testdagen. Een reeds ingepland maar nog niet gereden testaanbod rond een opening onderdrukt dus een nieuw aanbod, ook als het net vóór die opening staat.

> **AANGESCHERPT NAAR PER (OPENING, DOEL), 23-08-2026 - een preciezere formulering van dezelfde regel, geen nieuwe regel (M3: niets hernummerd, de tekst hierboven blijft staan als de aanleiding).** De regel telt per OPENING ÉN DOEL. Wisselt de renner binnen de beantwoorde openingsweek van doel, dan hoort de vraag terug te komen: het is een nieuw blok met een nieuwe doelstelling, en één extra tik is goedkoper dan twaalf weken doseren op een waarde die voor dát doel niemand heeft bevestigd. DE PRIJS IS GEMETEN EN WORDT AANVAARD: wisselt hij binnen die week heen en weer tussen twee doelen en beantwoordt hij telkens, dan komt de vraag opnieuw op DEZELFDE openingsmaandag - gemeten twee aanbiedingen waar het er vóór de aanscherping nul waren. Dat is deze regel twee keer toegepast en niet een gat erin: een doel waarvoor niemand heeft geantwoord, hóórt de vraag te krijgen. Wat de letterlijke tekst hierboven belooft - hoogstens één per opening, punt - is daarmee niet meer waar, en dat is precies waarom zij hier wordt aangescherpt in plaats van stilzwijgend anders gelezen. VINDPLAATS: ROADMAP punt 64, gebouwd 23-08-2026, met de meting in `docs/PUNT47-BOUW.md` §32k.

Er is GEEN herkansing en GEEN inhaalmechanisme voor een gemiste opening. De gebruiker kan een testinspanning altijd zelf inplannen, en een aanbod dat weken te laat komt ijkt een blok dat al loopt. De tegenhanger blijft wel staan: is er niet geijkt, dan hoort de app dat te ZEGGEN (M91).

GEVOLG VOOR M89, en dat is de kern van ROADMAP punt 47: de twee vragen scheiden nu ook in de TIJD. De IJKING staat vooraan en kijkt VOORUIT - waarop gaan we de komende twaalf weken doseren. De DOELCHECK staat achteraan en kijkt TERUG - is dit doel vooruitgegaan. M89 blijft ongewijzigd gelden; wat verandert is dat zijn twee vragen niet langer op hetzelfde moment vallen.

HERKOMST BELEID, Daan-besluit van 23-08-2026, met de meting eronder (RECON `3cc466e5`): op één noemer gemeten - de 440 doelblok-openingen - tilt de verhuizing het aandeel waarvan de drempel bij de opening is vastgesteld van 277 (63,0 procent) naar 440 (100,0 procent), en verkort zij de wachttijd tussen twee ijkingen van gemiddeld 127,5 dagen naar 84,0.

**M91 (NORM) - Een afwijzing is geen meting.** Wijst de gebruiker de ijkinspanning af, dan is de drempelwaarde niet bevestigd maar ONGEIJKT. De app draagt die staat en zegt haar; een afgewezen ijking mag nooit als een geslaagde worden behandeld (M5). Drie afwijzingen op rij is een drempel die drie blokken oud is, en dat hoort zichtbaar te zijn. Een proxy vervangt de ijking niet: de koppeling tussen hartslag en vermogen informeert over grove afbraak, maar haar ruis ligt boven de enkele procenten waarop een behoud-vloer oordeelt. Zij is informant (M17, M30) en mag het aanbod niet onderdrukken.

<!-- EINDE docs/TRAININGSMODEL.md -->
