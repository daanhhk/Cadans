# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-25 (DERDE BLOK VAN DEZE DAG) — **DE PLAUSIBILITEITSGRENS IS NIET TE LEGGEN, EN DAT IS EEN
REKENSOM.** Punt 69 (3). Opnieuw geen code, maar deze keer op een sluitend bewijs in plaats van een
afweging — en **er ligt nu een keuze voor Daan** die de knoop doorhakt.
- **DE GRENS UIT INTERVALS' `powerModels` HEEFT GEEN EIGEN WERKGEBIED.** Gemeten op drie vensters: het
  venstermaximum op `secs = 1200` **IS** de hoogste `piek_1200_w` van de ritten in dat venster (3 van 3
  gelijk). En de hoogste modelschatting ligt daar altijd BOVEN: marge **+22,4 / +15,4 / +16,1 W**. Voor
  elke rit BINNEN het venster geldt dus `0,95 × piek ≤ 0,95 × curve < hoogste model`. **De grens kan een
  rit in het venster per constructie nooit tegenhouden** — hij raakt alleen ritten buiten het venster,
  en dat doet het startpunt al.
- **EN OP VERSE DATA IS DE TOEGESTANE BAND LEEG. Dit is de dodelijke.** Ophaling van 24-08: hoogste
  model **277** (1y) en **270** (90d), tegen een staande `settings.ftp` van **280**. M94 eist een
  voorstel BOVEN 280; de grens eist ONDER 277. **Geen enkele waarde voldoet aan allebei — de functie
  zou nooit vuren.** De 283 uit het ontwerp bestaat alleen in de GECACHTE 90d-rij; datzelfde model staat
  vers op 253.
- **NIET TE IJKEN, alleen te bevestigen.** Alle zes kandidaatgrenzen (249 · 266 · 271 · 272 · 277 · 283)
  blokkeren dezelfde ene rit en laten er nul over; tussen 249 en 294,4 ligt geen enkele rit. De meting
  kan 283 dus niet boven 249 verkiezen — precies wat M93 randvoorwaarde (2) uitsluit en wat CHECK 40
  verbiedt.
- **EN HIJ IS CIRCULAIR:** op een tweejaarsvenster nemen alle vier de modellen het te beoordelen punt
  `(1200, 310)` als INPUTPUNT van hun eigen fit. Normatief staat hij ook niet: `powerModels` is dezelfde
  grootheid als `rolling_ftp`, op 23-08-2026 bij naam verworpen, en die grond hangt niet van de
  polariteit af.
- **DE REEKS-VARIANT VALT OOK.** Eén enkele rit overschrijdt het beste van de voorafgaande 90 dagen met
  meer dan 6 procent, en dat is met **1,245×** juist de rit die we op vier gronden voor echt houden. Een
  grens die strak genoeg zit om iets te betekenen, verwerpt de enige echte doorbraak. **Kalibreren
  vraagt twee klassen en deze reeks heeft er één** (punt 77).
- **W1 VALT, en de pas wees een betere weg.** Het project draagt al een vijfvoudig idiom voor "dit
  voorstel mag niet terugkomen", en dat is ALTIJD een sleutel in DATA, nooit een constante in code.
  Erger: `datum > D` is rekenkundig identiek aan `leeftijd < (vandaag − D)` — de constante ÍS de
  leeftijdsgrens die zij zei te vermijden, en groeit elke dag mee. **Het alternatief kost niets:** laat
  de migratie die er tóch komt de "beantwoord"-kolom SEEDEN voor elke rit die dan al bestaat.
- **W2 VALT ALS TOETS.** De nul die hij zou meten heeft DRIE onafhankelijke oorzaken — de grens, het
  startpunt en de vergelijkingsreferentie — en elk is in zijn eentje voldoende. Er hoort een POSITIEVE
  CONTROLE bij: dezelfde ECHTE functie, startpunt verzet en grens uit, moet dan precies één keer vuren
  op een bij naam genoemde rit. **W3 opnieuw NIET UITGEPUT.**
- **DE WEERLEGGINGSPAS: 4 van 4 VOLTOOID, nul gestorven, alle vier weerlegd** — vooropgedraaid, vóór er
  een regel bestond. **Derde ronde op rij dat de pas een bouw uitspaart die niet had gewerkt.**
- **NUL MUTATIES DEZE RONDE.** Geen migratie (lokaal en remote staan allebei op 0000 t/m 0013), geen
  deploy, geen verzoek aan intervals.icu. De Worker draait onveranderd op
  `0fcb0ddf-1796-4084-ae6e-0062c7033a28`.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 77 · 78.

**EERST DIT AAN DAAN VOORLEGGEN — punt 69 ligt stil tot hij kiest.** De app kan de waarde uitrekenen;
wat zij niet kan is zelf beoordelen of die geloofwaardig is. Twee wegen, uitgeschreven in
`docs/PUNT69-BOUW.md` §17:
**A. BOUW HET VOORSTEL ZONDER GRENS.** De app STELT VOOR en Daan BEVESTIGT — dat is M10, en daarmee is
hij zelf de plausibiliteitstoets. Hij ziet rit, duur, vermogen en factor naast de staande waarde, en hij
weet of hij die dag diep ging. Een grens die het voorstel tegenhoudt, neemt hem juist dat oordeel af.
Nodig: het startpunt via de geseede kolom, plus de antwoord-kolom — samen één migratie.
**B. WACHT TOT ER EEN ECHTE TEST IN DE DATA ZIT.** Het ijkaanbod komt op **2026-09-21**; pas daarna
draagt de reeks een maximale inspanning binnen het venster en valt er iets te kalibreren.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 (+ 54) — DE DOELCHECK**, de tweede helft van M89 en het enige
deel van punt 47 dat nooit is aangeraakt. Grond voor die plek: punt 69 ligt stil op Daans keuze
hierboven, en de doelcheck draagt een KALENDERGROND — in februari sluit het onderhoudsblok en dan is de
vraag of de FTP het gehouden heeft, vóór de Amstel-Gold-voorbereiding begint. **Geen backfill nodig**,
die is gedaan. Wat er wél in de weg staat:
`const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);` naast
`export type PowerCurveWindow = "90d" | "1y";`, terwijl `DOELEN-SPEC` §3.2 om ZES WEKEN vraagt — en §3.2
draagt TWEE criteria op TWEE grootheden terwijl een venster er één levert.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-25 (TWEEDE BLOK VAN DEZE DAG) — **DE MIGRATIE IS GELAND, DE NORM STAAT, EN DE BOUW IS
GESTOPT OP V1.** Punt 69 (2). Er is GEEN regel code geschreven aan het voorstel, en dat is de uitkomst:
het ontwerp bleek tóch twee gekozen getallen nodig te hebben waar er nul begroot waren.
- **MIGRATIE 0013 STAAT OP REMOTE**, met Daans akkoord, niet onder auto, **en in ÉÉN poging** — geen
  spoor van de transiente weigering van eergisteren. VÓÓR: 0013 open, `activities` 19 kolommen, 255
  rijen (215 fietsritten). NA: "No migrations to apply!", **21 kolommen**, 255 rijen (215 fietsritten),
  `met_piek` 0 — precies de verwachte stand, want de backfill draaide alleen lokaal. Weg terug vooraf
  gemeten: D1 Time Travel, bookmark `0000012f-00000000-000050d2-4de266acc7b50e97248a245a7c7729b0`.
  **Hiermee is de laatste divergentie tussen lokaal en prod gesloten**: remote draagt 0000 t/m 0013.
- **NIEUWE NORM M94:** een ONGEPLANDE inspanning stelt de drempelwaarde alleen OMHOOG bij; omlaag kan
  uitsluitend na een inspanning die de renner BEWUST als test is aangegaan. Herkomst BELEID. **Erbij
  vastgelegd dat M94 nog NIET uitvoerbaar is** — zie punt 78 — want de app kan die twee niet scheiden.
  Dat is een beperking van de UITVOERING en geen versoepeling van de norm (M5).
- **V1 VALT, en dat stopte de bouw.** Twee getallen blijken nodig. (1) **EEN LEEFTIJDSGRENS**: de enige
  rit die vuurt is **404 dagen oud**, en de poorten kennen geen leeftijd — bij oplevering zou de app
  dus meteen een verhoging voorstellen op grond van een rit van ruim een jaar terug. `piek_gehaald_op`
  helpt niet: die staat bij **alle 216** ritten op dezelfde dag. (2) **EEN PLAUSIBILITEITSGRENS**: dat
  voorstel van **294 W** ligt **11 W boven de hoogste van intervals' zes eigen modelschattingen**
  (MS_2P 283) en 17 W boven de jaarschatting (277). M93 randvoorwaarde (2) eist die grens én schrijft
  voor hem op de ECHTE reeks te ijken — dus niet in een bouwronde. Mijn eigen §6 eiste haar al als
  poort (iii); het ontwerp dat ik daarna maakte had haar laten vallen in de veronderstelling dat de
  richtingsregel haar verving. **Dat doet zij niet: die dekt alleen de OMLAAG-kant.**
- **V3 VALT ook, maar de vuring is TERECHT.** 1 van 215 in plaats van 0, en het is
  `De Ronde Venen - FTP build up` (88 min, IF 92,22, piek 310 W → voorstel 294 W). Vier onafhankelijke
  signalen wijzen die rit aan: hoogste piek van de reeks met **39 W** voorsprong, de grootste
  `rolling_ftp`-sprong, een naam die de inspanning benoemt, en IF 92,22. De premisse onder V3 was te
  ruim — punt 77 mat nul maximale inspanningen in de laatste twee KWARTALEN, niet in de hele reeks.
  **De marge-structuur is bovendien schoon:** de nummer twee ligt 28 W ONDER de staande waarde en er
  is geen rit binnen 5 W aan weerskanten, dus de poort staat nergens op een mesrand.
- **POORT 3 IS GEEN POORT (punt 78).** `day_state` draagt **6 rijen**, alle tussen 2026-07-14 en
  2026-07-22, over 394 dagen met 209 fietsdagen. Elke rit geldt dus als ongepland — ook die "FTP build
  up" — en de meest test-achtige rit van de reeks (20 min binnen op **IF 100,77**) zou juist als
  ongepland geweigerd worden. M94 klapt op deze data dicht tot "alleen omhoog".
- **OP 44 DAGEN IS NIET BEPAALD WELKE RIT TELT**, en het bestaande idiom kiest gemeten de verkeerde: de
  LANGSTE rit wint, maar op 2025-07-08 draagt die piek 184 tegen 240, en op 2025-07-11 173 tegen 249.
- **§5(e) IS NIET GEBOUWD, en dat is een botsing tussen de opdracht en de canon.** De opdracht vroeg de
  meetgelegenheid aan de GOEDKEURING te hangen; `TRAININGSMODEL` §13 zegt verbatim dat een reeds gedane
  maximale inspanning het aanbod zonder vraag laat vervallen, en dat staat als poort (7) in
  `testvoorstel.ts`. Hang je het om, dan vraagt de app opnieuw om een test die net gereden is terwijl
  dezelfde paragraaf elke herkansing uitsluit. **82 `it`-blokken** staan bovendien op het huidige
  gedrag. Punt 66 blijft open.
- **DE WEERLEGGINGSPAS: 4 van 4 VOLTOOID, nul gestorven, alle vier weerlegd** — en hij draaide VOOROP,
  vóór er een regel gebouwd was. Zonder die pas was hier een voorstel gebouwd dat op dag één een
  verhoging had voorgesteld op een rit van 404 dagen oud. Pas 2 is niet gedraaid: er is geen code om
  aan te vallen.
- **NUL DEPLOYS.** De Worker draait onveranderd op `0fcb0ddf-1796-4084-ae6e-0062c7033a28`. Nul
  verzoeken aan intervals.icu deze ronde.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 77 · 78.

FOCUS VOLGENDE CHAT: **ROADMAP 11d-11b — punt 69 (3), DE TWEE GRENZEN IJKEN. Dat is een MEETRONDE en
geen bouwronde.**

**DIT WIJKT AF VAN DE PROMPT, die de DEPLOY als focus voorschreef.** Die focus ging ervan uit dat het
voorstel gebouwd zou zijn; dat is niet gebeurd, dus er is niets om uit te rollen. De reparatie van punt
73 staat trouwens al sinds 24-08 live.

Wat die meetronde moet opleveren: (1) een **LEEFTIJDSGRENS** — hoe oud mag een rit zijn en toch een
voorstel dragen; (2) een **PLAUSIBILITEITSGRENS** — hoeveel mag een voorstel afwijken van wat de reeks
en intervals' eigen modellen dragen. Allebei op de ECHTE reeks geijkt, zoals M93 randvoorwaarde (2)
voorschrijft. De grondstof staat er: **215 waarden** in `activities.piek_1200_w` plus zes
modelschattingen uit `power_curve_cache`. In dezelfde ronde te beslissen: **welke rit telt** op een dag
met twee ritten, en **waar het antwoord landt** dat een voorstel beantwoord is — dat laatste vraagt een
kolom en dus een migratie. Pas daarna de bouw.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
