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
