# Cadans — WERKWIJZE

Canoniek document voor hoe we werken. Wordt bij elke nieuwe chat gelezen via een RAW-URL gepind op een commit-hash.

## Voorrang bij tegenspraak

- **Werkwijze** → dit document. Wint van `HANDOFF.md`, van `CLAUDE.md` en van elke opener.
- **Projectstand** → `HANDOFF.md`.
- **Norm-laag (hoe coaching werkt)** → `docs/TRAININGSMODEL.md`. Norm voor de TRAININGSKANT: wat een coach weegt, waarop hij ingrijpt en wat hij bewust laat liggen. `DOELEN-SPEC` draagt de invulling PER DOEL en staat daaronder — dat document zet `TRAININGSMODEL` zelf al boven zichzelf. Een M-regel met status NORM is vastgesteld; een met status OPEN is een erkend gat en mag niet als besluit gelezen worden.
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

- **Een ontwerpbesluit dat de TRAININGSLAAG raakt noemt de M-regel uit `docs/TRAININGSMODEL.md` waarop het rust — of stelt expliciet vast dat de canon daar OPEN is.** Aanleiding: bij punt 17 werd het besluit over de uitvoerings-referent onderbouwd met `DOELEN-SPEC`, terwijl M63 het antwoord al droeg en ongelezen bleef; de coach-bril kwam uit de chat in plaats van uit de bron. DE VORM IS BEWUST GEEN ZESDE PROMPTCONTROLE: dat maximum staat op vijf met een reden — groeit die lijst, dan wordt hij te lang om te draaien. Dit hoort bij het BESLUIT, niet bij de prompt-hygiëne.

Claude neemt de technische beslissingen zelf en vraagt alleen wat vanuit Daans perspectief echt onduidelijk is.

- **Geen open opties in CC-prompts.** Elke keuze is vooraf beslist.
- Bij meerdere redelijke aanpakken of echte ambiguïteit: een popup-vraag, met **Claude's advies expliciet in de begeleidende proza** ("Mijn advies: optie X, want …") — nooit alleen als tag in een optie-label.
- **Een plan eindigt op een BESLUIT, nooit op "of wil je X?".** Claude neemt de keuze en onderbouwt hem; Daan kan er in de review overheen. Is er echte ambiguïteit, dan is een popup mét Claude's advies in de proza de ENIGE vorm waarin een vraag terugkomt. Een open slotvraag kost een ronde en legt het werk terug dat Claude hoort te doen.
- Vraagt Daan "wat is de professionele aanpak?", dan wil hij een **beslissing met onderbouwing**, geen popup.
- Een "volgende stap" in HANDOFF is een voorstel, geen opdracht. Verifieer de premisse tegen de bron vóór je bouwt; recon mag Claude's eigen eerdere advies omgooien.
- Claude signaleert zelf bij ongeveer 70–80% contextgebruik, zodat de overdracht soepel gaat.

## Bronhiërarchie voor parity

`daanhhk/training` is publiek en **bevroren op `3e8090a`**. Lees die bron **direct** als eerste reflex bij elke parity-vraag — architectuur én vormgevingslogica — nooit uit geheugen en nooit uit een samenvatting.

- **Chat-Claude: INGETROKKEN per 21-08-2026.** De regel luidde: kloon de publieke repo's read-only in de container (`git clone --depth 1` van `daanhhk/training` en `daanhhk/Cadans`) en grep; byte-exact en sneller dan losse fetches. REDEN VAN INTREKKING: de chat kan de LEVENDE staat per constructie niet zien — een kloon geeft de gecommitte boom en niet de werkboom, en de uitkomst van een meting hangt aan wat er NU draait. Elke zelfmeting produceerde daarmee aannames die CC daarna moest corrigeren. Parity- en staatvragen lopen sindsdien via een RECON-prompt aan CC. De regel blijft hier staan omdat een verwijderde regel opnieuw wordt uitgevonden.
- **CC**: leest de GAS-bron van schijf (`C:\Users\daan\Projects\training`, read-only) — **nooit via WebFetch**, dat geeft een lossy parafrase. Sinds de intrekking hierboven is dit de ENIGE route naar de bevroren bron.
- De regel "de chat kan de repo niet lezen" geldt sinds 21-08-2026 ZONDER uitzondering. Ze gold eerder alleen de uncommitte lokale Cadans-staat; nu geldt ze ook voor de gecommitte code en de GAS-bron.
- `VORMGEVING-SPEC.md`, `HANDOFF.md` en de recon-docs zijn een gepinde **samenvatting**, geen vervanging. Verifieer elke parity-claim tegen de bron.
- **GAS is een PORT-referentie, geen normbron.** De bevroren bron beantwoordt uitsluitend "hebben we functie X destijds getrouw overgezet". Hij beantwoordt NOOIT "is dit de juiste waarde": waar een getal vandaan komt zegt niets over of het klopt. Is er een meting op de echte reeks, dan wint die, en dan is de herkomst van het oude getal geen bespreking waard — een fork hoeft niet als fork verantwoord te worden. Aanleiding: bij de TSS-ijking werd de GAS-oorsprong van de weging 0,7/0,95/1,05 opgezocht om de wijziging als "bewuste fork" te labelen, terwijl HANDOFF §7 GAS al gesloten had verklaard en de meting het antwoord al gaf. TWEEDE KEER: bij de sweet-spot-sleutelvraag zocht de chat opnieuw de GAS-bron op, ditmaal om vast te stellen of de ontbrekende sleutel-intent een geporte omissie was of Cadans-drift. Die vraag deed er niet toe — de norm stond al in `DOELEN-SPEC` §3.1 en de meting gaf het antwoord — en Daan wees het terecht af. De bron is nooit nodig om een WIJZIGING te verantwoorden.

## Recon en bewijslast

De lessen staan vanaf 08-08-2026 in een eigen bestand, en sinds 10-08-2026 in TWEE:
`docs/WERKWIJZE-LESSEN.md` en `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md`, die de opener als TWEEDE
en DERDE URL ophaalt. De reden is dezelfde als bij het wijzigingslog en ze is gemeten: dit
document wordt door ELKE chat via een RAW-fetch binnengehaald, die fetch kapt af rond 121 kB, en
met de 122 lessen erin stond `WERKWIJZE.md` op 118399 bytes — circa 2,7 kB marge terwijl één
ronde er 1561 kostte. Wat als EERSTE was afgevallen is de STAART van dit document: de vijf
promptcontroles, de gate, *Prod en veiligheid*, de close-out en het opener-sjabloon.

Het verschil met het log zit in wat een chat MOET lezen. Het log verantwoordt achteraf en wordt
bewust niet opgehaald; de lessen zijn werkende discipline en worden WEL opgehaald, alleen in een
eigen fetch, zodat geen van de delen de cap raakt.

DE TWEEDE SPLITSING LIEP OP EEN ANDERE AS DAN DE EERSTE, en die as bepaalt waar een NIEUWE les
landt. Hangt de grond van de les aan een tool, een bestand, een commando of een harness in deze
repo — iets dat met een commit of een versiesprong kan veranderen — dan hoort hij in
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md`, en hij wordt herijkt zodra dat gereedschap verandert.
Gaat de les alleen over de VORM van bewijs, dan hoort hij in `docs/WERKWIJZE-LESSEN.md` en
veroudert hij niet. Nooit hierheen. GEMETEN bij de splitsing: 57 lessen gereedschap tegen 87
bewijslast, en de groei is scheef — over het nieuwste derde deel van de oude lijst ging 25470
bytes naar de gereedschapshelft tegen 15217 naar de bewijslasthelft. De helft die veroudert is
dus ook de helft die aangroeit, en dat is precies waarom de knip daar ligt.

WAT NIET KON, en dat hoort hier zodat een volgende ronde het niet opnieuw probeert. Splitsen op
"nog dragend voor een openstaand punt" snijdt dit materiaal niet: **89 van de 144 lessen noemen
geen enkel puntnummer**, en van de 55 die er wel een noemen doen er **50** dat binnen de
AANLEIDING — dus als herkomst en niet als reikwijdte. Slechts 6 raken een open punt. En inkorten
levert te weinig: de aanleiding-massa is 51,5 procent van het bestand, maar **99 van de 108
aanleidingen dragen een cijfer** en dat is juist het getal waarop de regel rust; wat er zonder
verlies uit kan is pure provenance, gemeten op **26 zinnen en 2270 bytes, 2,1 procent**. Daarom
is de ingreep een VERLIESLOZE splitsing en geen inkorting.

- **EEN METING EN EEN VOORSTEL KOMEN NOOIT IN DEZELFDE BEURT.** Wie om een meting is gevraagd,
  levert de meting en stopt; een ingreep erbij leggen maakt van de mens de verificateur van werk
  dat hij niet heeft kunnen nalezen. Dit is een POORT, geen aansporing: een akkoord op een
  voorstel dat bij een meting zat, telt niet als autorisatie. En een autorisatie dekt ÉÉN plek —
  verschuift de kandidaat naar een andere functie of een ander veld, dan vervalt ze en wordt ze
  opnieuw gevraagd.

## Vorm van een CC-prompt

- **Eén plain code-blok**, zonder taal-tag — dat is de één-tap-kopie op mobiel. Nooit proza in het blok mengen; Claude's kader eromheen staat als gewone tekst.
- Te lang voor één blok → splits in **genummerde blokken** (Blok 1/2, 2/2) die CC na elkaar in dezelfde **CC-sessie** draait. Een later blok mag leunen op wat een eerder blok zette. Het gaat om de CC-sessie, niet om een shell: PowerShell is de shell waarin CC zijn commando's uitvoert, geen omgeving waarin Daan zelf werkt.
- **EEN BLOK MET EEN STOP-CONDITIE IS EEN BESLISMOMENT, GEEN LENGTE-SPLIT.** Draagt een blok een STOP-conditie en vraagt het om een rapport, dan hangt alles erna aan de UITKOMST — dus schrijf de latere blokken pas als dat rapport binnen is. Dat is iets anders dan de lengte-split hierboven, waar een later blok alleen leunt op wat een eerder blok ZETTE en niet op wat het VOND. Aanleiding: in de punt-37-ronde zijn blok 2 en 3 vooruit geschreven terwijl blok 1 drie uitkomsten kon dragen die ze allebei zouden omgooien — een afwijkende premisse, een ijkrun die het eind niet haalt, en een grote ruisvloer. Daan wees het aan; de twee blokken zijn ingetrokken en opnieuw geschreven. Zie ook *een genummerd blok zegt zelf of het een commit-punt is* in `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md`: die regel gaat over de VRAAG of er gecommit wordt, deze over de vraag of het blok er al mag zijn. TWEEDE AANLEIDING, 07-08-2026, en de regel bestond toen al: bij punt 36 ronde 3 is blok 2 opnieuw vooruit geschreven terwijl blok 1 een premissen-STOP droeg. Daan wees het aan vóór hij het plakte; het blok is ingetrokken en pas na het rapport herschreven — en dat rapport veranderde het op drie plekken, waarvan één (de warmloop vóór het ijkpaar) de meting zonder meer had verpest. Twee overtredingen binnen twee rondes betekent dat deze regel niet HERINNERD moet worden maar GEDRAAID: staat er een STOP in een blok, dan bestaat het volgende blok nog niet.
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

De chat noemt in de begeleidende proza WELKE controles hij werkelijk gedraaid heeft en
waarop — niet een score. Een score is claimbaar zonder gedraaid te zijn, en dat is precies
wat er op 07-08-2026 gebeurde: er stond "vijf van vijf" terwijl controle 1 voor één
vindplaats-claim niet gedraaid was. Dan is niet alleen het prompt onbetrouwbaar maar ook de
rapportage erover, en dat is de duurdere van de twee.

EN ELK BOUW-PROMPT OPENT MET EEN PREMISSEN-BLOK: de beweringen over de repo die de controle hebben
overleefd, met als eerste stap voor CC dat hij ze toetst en bij afwijking STOPT. Dat stond in het
recon-prompt van punt 20 wél en in het bouw-prompt niet, en precies daar landden beide fouten.
Twee netten in plaats van één, en het eerste ligt vóór de CC-ronde.

HET MAXIMUM IS VIJF. Groeit die lijst, dan wordt hij hetzelfde als de twee lessenlijsten:
te lang om te draaien, dus niet gedraaid. Daarom staat dit hier en niet daar —
"raadpleeg de lessen" is geen handeling.

AANLEIDING: twee fouten in één sessie, allebei in punt 20, en allebei al gedekt door een BESTAANDE
les. Het gat zat in de UITVOERING, niet in de dekking. (a) Het bouw-prompt wees de twee
`push-parse`-lussen aan als plek voor de nieuwe assertie, terwijl die op `mesoFactor` 1 draaien —
daar bestaan 0 decimale herhalingscellen tegen 110 bij mesoWeek 3, dus edit B bleef ongedekt en de
ronde eindigde op de stopregel. (b) Het close-out-prompt gaf een correctie-instructie op de zin
"in dezelfde PowerShell-sessie", die in het hele document niet voorkwam. CC ving beide en meldde
ze; ze kostten twee rondes.
- **De gate staat VÓÓR de commit in de stap-volgorde, en geen invulplek hangt af van een latere stap.** Een prompt die eerst laat committen en daarna de gate draait, dwingt CC tot herordenen of tot getallen uit het geheugen — en dat laatste is precies wat de vloer-regel verbiedt. Aanleiding: de close-out van punt 36 zette de commit op STAP 7 en de gate op STAP 8, terwijl het STAND-blok twee vloeren uit die gate moest halen. CC keerde de volgorde om en meldde het.
- **DE BRON-UITLEZING HOORT IN DE EERSTE VERSIE VAN EEN PROMPT, NIET IN DE OVERTYPRONDE.** Een prompt dat GROEIT bij het overtypen is een prompt dat te vroeg geschreven is: de correcties die er dan bij komen zijn geen aanscherping maar reparatie van wat er nooit in had mogen ontbreken. Aanleiding: het meet-prompt van punt 36 ronde 3 kreeg pas bij het overtypen drie correcties — de venster-splitsing tussen zaai-markers en de rest, het aantal settle-markers als instrumentcontrole, en de warmloop vóór het ijkpaar — en GÉÉN ervan kwam uit het CC-rapport. Ze kwamen alle drie uit een herlezing van `tools/shots/shot.mjs` die vóór de eerste versie had moeten gebeuren, en die laatste (de warmloop) had de meting zonder meer verpest. Lees de bron dus vóór je schrijft, niet vóór je verstuurt.
- **ELK GETAL IN EEN PROMPT DRAAGT ZIJN HERKOMST, in één label achter het getal.** `RECON <hash>` als het uit een CC-rapport komt en bij welke commit, `GEPIND <document>` als het uit een gepind document komt, `BESLUIT` als het een keuze van Daan of van de chat is. Een getal zonder label is een AANNAME, en sinds de chat niet meer zelf meet is dat het enige onderscheid dat er nog is tussen een gemeten feit en een herinnering. Dit is dezelfde regel als de herkomst-eis op een voorstel, nu op de prompt zelf.
- **CC LEIDT ZIJN EIGEN CONDITIE AF; de chat schrijft die niet voor.** Wat een ronde doet — ALTIJD, METING, HARNESS, DEPLOY, COMMIT of ENGINE — volgt uit de stappen, en CC draait de bijbehorende checks uit `docs/CC-CHECKS.md` en meldt in het rapport welke condities golden en welke checks hij gedraaid heeft. Een prompt die de conditie vóórschrijft zet de uitvoerder op een lijst in plaats van op zijn eigen oordeel, en dan valt een check weg zodra de chat er niet aan dacht.

## Vorm van een CC-rapport

Platte tekst, **geen code-fences en geen tabellen** (breekt de mobiele kopie), ongeveer 200 woorden. Literals tellen niet mee en worden exact gegeven.

Bevat: commit-hash; de gepinde RAW HANDOFF-URL op die hash; gate-uitslag; CI-conclusie met run-URL; bij code een lege `git diff --stat` op `packages/engine`; bevestiging dat training onaangeroerd is (HEAD `3e8090a`); en elke afwijking van de prompt.

EEN `git diff --stat <pad>` IS NÁ EEN COMMIT TRIVIAAL LEEG en bewijst dan niets: de wijziging zit in de commit, niet meer in de werkboom. Pin hem op `HEAD~1` of op de fase-basis, EN GEEF TWEE REFS: `git diff --stat HEAD~1 HEAD -- <pad>`. Met één ref (`git diff --stat HEAD~1 -- <pad>`) vergelijkt git de basis met de WERKBOOM in plaats van met de commit; bij een schone werkboom levert dat toevallig hetzelfde op, bij een vuile liegt het. Zelfde familie als de `head_sha`-regel bij CI: een controle die per constructie slaagt, is geen controle. Beide correcties kwamen binnen als CC-verbetering — de tweede op 6 augustus 2026, toen de één-ref-vorm `.claude/launch.json` toonde alsof die was meegecommit terwijl de commit uitsluitend docs bevatte.

CC mag afwijken en moet dat melden. Een flag-en-stop legt het balletje via het rapport terug bij Claude.

## Gate

Geen commit of merge op rood: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — én CI groen. De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren; hardcode die getallen nooit in een prompt, lees ze uit de suite. Een bewuste daling (bijvoorbeeld verwijderde dode-code-tests) is geen regressie, maar wordt expliciet gemeld en in HANDOFF bijgewerkt.

HET AANTAL LINT-WAARSCHUWINGEN IS OOK EEN VLOER, en hoort dus in het STAND-blok naast de twee
andere. `pnpm lint` geeft exit 0 zolang er alleen waarschuwingen zijn, dus de gate ziet een
stijging niet — het getal moet met de hand tegen de vorige ronde gelegd. Aanleiding: een eerste
bouwversie van punt 37 gaf een 21e waarschuwing (`useOptionalChain`) terwijl de vloer er 20
draagt en de gate groen was; CC ving het en werkte hem weg vóór de meting. Kwam binnen als
CC-afwijking en is strikt beter dan wat het prompt vroeg. Lees het aantal uit de uitvoer van de
eigen run, nooit uit een rapport of uit een STAND-blok.

STOP DE DEV-SERVERS VÓÓR `pnpm test`. Een draaiende `wrangler dev` maakt de gate ROOD op RUNNER-niveau — `EBUSY` op de tijdelijke miniflare-mappen, want `@cloudflare/vitest-pool-workers` gebruikt diezelfde mappen. Dat leest als een kapotte suite terwijl er niets kapot is: op 6 augustus 2026 gaf hij 1 gefaalde test bij 49 van de 75 bestanden en 813 tests, en na het stoppen van de server twee keer achter elkaar 959 van de 959. Elke ronde die de shot-harness draait loopt hier tegenaan, want die eist juist dat beide servers draaien. Kwam binnen als CC-vondst.

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

ELKE NIEUWE OF GEWIJZIGDE WERKWIJZE-AFSPRAAK KRIJGT IN DEZELFDE CLOSE-OUT EEN GEDATEERDE REGEL IN `docs/WERKWIJZE-LOG.md`. Dat is geen administratie maar de HERKOMST: zonder die regel staat er canon in dit document zonder dat iemand kan zien wanneer hij kwam en welke meting hem droeg. De regel noemt de sectie, de strekking en de aanleiding — dezelfde vorm als de 106 regels die er al staan.

Het nieuwe STAND-blok gaat BOVENAAN in `HANDOFF.md`, boven het vorige, en vervangt of verwijdert niets. Het eindigt ALTIJD op een `FOCUS VOLGENDE CHAT`-regel. Die twee zijn geen stijl maar een afhankelijkheid: de opener draagt de stand niet meer zelf en wijst naar dat blok, dus een blok dat onderaan belandt of geen FOCUS draagt laat de volgende chat met lege handen staan.

ELKE CLOSE-OUT RAPPORTEERT DE BYTES VAN DE VIER BESTANDEN DIE DE OPENER OPHAALT, met de marge tot de
afkapgrens van circa 121000. Dat is de vooruitkijkende helft van het vangnet: de eind-marker vangt een
afkap die AL gebeurd is, deze regel ziet hem aankomen. Loopt een bestand binnen twee rondes tegen de
grens, dan is de ingreep dezelfde als bij het log en de lessen — verplaats wat alleen achteraf
verantwoordt, en houd in de fetch wat een chat bij elke start moet lezen.

DIE METING HOORT IN HET CC-RAPPORT EN NIET IN HET STAND-BLOK, en de grond is gemeten. Een STAND-blok
wordt geschreven VÓÓR de commit die het bevat, dus elk byte-getal erin is per constructie te laag
met precies wat die close-out zelf nog toevoegt. Bij de close-out van punt 38 was dat 1296 bytes op
`docs/WERKWIJZE-LESSEN.md` en 1611 op `HANDOFF.md`: het blok noemde 90764 en 55228, terwijl de
gepushte staat 92060 en 56839 droeg. Zelfde vorm als de `head_sha`-regel bij CI — een controle die
per constructie scheef kan lopen, controleert niets — en bij een VOORUITKIJKEND vangnet valt die
scheefte samen met het moment waarop het getal ertoe doet. CC meet dus NA de commit en rapporteert
het daar; herhaalt een STAND-blok het getal, dan noemt het de commit waarop het gemeten is. Een chat
die het getal nodig heeft leest het uit zijn eigen read-only kloon op de gepinde hash. Kwam binnen
als CC-afwijking.
EN DE REGEL IS BREDER DAN BYTES: GEEN ENKEL GETAL IN EEN STAND-BLOK MAG NAAR DE COMMIT WIJZEN
DIE DAT BLOK BEVAT. Bij de close-out van punt 41 en 42 droeg het blok een invulplek voor zijn
eigen commit-hash, en die bestaat per constructie pas nadat het blok geschreven is. CC ving het
en herschreef de regel naar een formulering die de eigen hash niet noemt. Een blok verwijst dus
naar EERDERE commits met hun hash, en naar zichzelf uitsluitend met "deze close-out" — de hash
en de bytes van de eigen commit staan in het CC-rapport, waar ze wél te meten zijn.

`HANDOFF.md` DRAAGT MAXIMAAL TWEE STAND-BLOKKEN, per 21-08-2026 en tot dan twaalf. Komt er een derde
bij, dan verhuizen de oudste in dezelfde close-out verbatim naar `docs/HANDOFF-ARCHIEF.md`, dat de
opener niet ophaalt.

REDEN VOOR DE VERSCHERPING: de opener droeg de stand mee als HISTORIE, en twaalf blokken is een
verslag van drie weken werk waarvan de nieuwe chat er één nodig heeft. De rest kostte fetch-marge
en nodigde uit tot redeneren op een oude stand. Wat een chat moet weten staat in het bovenste blok
en in de FOCUS-regel; wat hij daarnaast nodig heeft vraagt hij op bij CC. De oudere blokken zijn
niet weg — ze staan verbatim in het archief en git houdt sowieso alles.

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

**De afsluitende chat schrijft de opener uit** — verbatim uit dit sjabloon, in één code-blok, ná het close-out-rapport (dan pas is de hash bekend). Er valt nog maar ÉÉN ding in te vullen: `<hash>`, op alle vier de URL's dezelfde close-out-hash. STAND en FOCUS worden NIET overgenomen — de opener WIJST naar het bovenste STAND-blok in `HANDOFF.md` in plaats van het na te vertellen. `docs/TRAININGSMODEL.md` staat er sinds 04-08-2026 bij: dat is de NORM-laag voor de trainingskant, en zonder die URL reconstrueert elke chat de coach-bril in plaats van hem te lezen. `docs/ARCHITECTUUR.md` staat er sinds 21-08-2026 bij en verving de twee LESSEN-bestanden: de chat meet niet meer zelf, dus hij heeft de bewijslast-regels niet nodig maar wél een kaart van wat er per constructie niet kan. Verder niets toevoegen op de marker-regel na: de werkwijze staat aan CC's kant, niet in de opener. Daan hoeft niets samen te stellen; hij krijgt één kant-en-klaar blok.

Reden voor die vorm: een opener die de stand overschrijft laat dezelfde tekst op twee plekken leven die elk per chat muteren — precies de drift die dit document moest opheffen. Eén bron, en de opener verwijst ernaar.

DE OPENER-FETCH KAPT AF ROND 121 kB EN MELDT HET NIET. GEMETEN op 08-08-2026: `HANDOFF.md` kwam
voor 121124 van de 616512 bytes binnen — 358 van de 2970 regels — en eindigde mid-zin zonder enig
signaal; `docs/WERKWIJZE.md` kwam op 118399 bytes nog nét volledig binnen. De grens is NIET exact in
bytes: dezelfde cap gaf 07-08-2026 121196 op een ander bestand, dus reken op een TOKEN-grens en
behandel elke byte-marge als een schatting.

Daarom eindigt elk bestand dat de opener ophaalt op een regel `<!-- EINDE <pad> -->`, en toetst de
opener die marker. Een afgekapte fetch meldt zichzelf niet; een ontbrekende marker wel. De marker
hoort bij het bestand: wie er een sectie aan toevoegt, laat hem de LAATSTE regel blijven. Dit is de
terugkijkende helft van het vangnet — de byte-regel in *Close-out van een chat* is de vooruitkijkende.

Dat leunt op twee eisen aan de close-out, en zonder die twee is de verwijzing loos: het nieuwste STAND-blok staat BOVENAAN in `HANDOFF.md`, en élk STAND-blok eindigt op een expliciete `FOCUS VOLGENDE CHAT`-regel. Zie *Close-out van een chat*.

--- BEGIN OPENER ---
Lees eerst deze vier via web_fetch (RAW, gepind op commit-hash — NIET de blob-URL, die is stale):
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/HANDOFF.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/ARCHITECTUUR.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/TRAININGSMODEL.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/DOELEN-SPEC.md

Elk van deze vier eindigt op een regel `<!-- EINDE <pad> -->`. Zie je die regel bij een bestand
niet staan, dan is de fetch afgekapt: meld dat en werk niet verder op dat document.

HANDOFF.md is de projectstand. ARCHITECTUUR.md beschrijft hoe de app in elkaar zit en wat er
per constructie niet kan. TRAININGSMODEL.md is de NORM voor de trainingskant en gaat vóór
DOELEN-SPEC.md, dat de VASTGESTELDE doel-besluiten draagt en niet heropend wordt.
Cadans = Cloudflare-herbouw van de trainings-app: pnpm-monorepo, pure engine + Workers/D1 + React-PWA.

JOUW ROL — coach en architect.
1. Je denkt mee over wat deze renner nodig heeft, en je schrijft de prompts die Claude Code
   (CC) aan het werk zetten. CC bouwt, meet en commit; jij denkt en stuurt.
2. JE MEET NIET ZELF. Elk feit over de levende repo komt uit een CC-rapport. Je kloont niet,
   je grept niet, je leidt geen staat af uit een document.
3. Elk getal in een prompt draagt zijn herkomst: RECON <hash>, GEPIND <document>, of BESLUIT.
   Een getal zonder label is een aanname en hoort er niet in.
4. Weet je iets niet, dan vraag je het aan CC. Een plausibele aanname is een fout.
5. Een ronde die op de levende staat leunt, opent met een RECON-prompt: read-only, geen commit.
6. Een ronde die een MECHANISME wijzigt, krijgt een WAT-ALS vóór de bouw, met jouw verwachting
   er expliciet in, zodat die toetsbaar is.
7. Je eindigt op een BESLUIT, nooit op "of wil je X?". Bij echte ambiguïteit een popup mét je
   advies in de begeleidende proza.
8. CC-prompt: één plain code-blok zonder taal-tag, stap-instructies in het Nederlands, gate vóór
   de commit, rapport in platte tekst zonder code-fences.
9. CC leidt zelf af welke conditie zijn ronde draagt en draait de bijbehorende checks uit
   docs/CC-CHECKS.md. Jij zet die conditie niet.
10. De volledige werkwijze en de lessen staan aan CC's kant. Heb je een regel nodig, vraag CC
    hem op — haal hem niet uit je geheugen.

Je kunt mijn lokale repo (C:\Users\daan\Projects\cadans, Windows/PowerShell, via Remote Control)
niet lezen. De bevroren GAS-bron daanhhk/training @ 3e8090a is de parity-referentie; vraag CC
ernaar wanneer een parity-vraag speelt.

Volg de FOCUS uit het bovenste STAND-blok.
--- EINDE OPENER ---

## Wijzigingslog

Het log staat vanaf 07-08-2026 in `docs/WERKWIJZE-LOG.md`, en de reden is meetbaar: dit document
wordt door ELKE chat via een RAW-fetch binnengehaald, en met 106 logregels erin was het zo lang
geworden dat die fetch afkapte — zonder enig signaal, want een afgekapte fetch meldt zichzelf
niet. De norm hoort in de opener te passen; de datering hoeft dat niet. Elke nieuwe of gewijzigde
afspraak krijgt daar een gedateerde regel, in dezelfde close-out als de wijziging zelf (zie
*Close-out van een chat*).

<!-- EINDE docs/WERKWIJZE.md -->
