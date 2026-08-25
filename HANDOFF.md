# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-25 (VIERDE BLOK VAN DEZE DAG) — **HET FTP-VOORSTEL IS GEBOUWD, ZONDER REM.** Punt 69 AF.
Daan koos weg A; de renner is zelf de plausibiliteitstoets (M10). Commit `8a9c0fa`.
- **MIGRATIE 0014 DRAAGT DE ANTWOORD-KOLOM ÉN SEEDT HAAR.** Alles wat bij het migreren al in de tabel
  stond geldt als beantwoord, dus de historie zwijgt en alleen wat NA de migratie binnenkomt doorloopt
  de poorten. Dat vervangt de datum-constante uit ronde 2, die rekenkundig een MEEGROEIENDE
  leeftijdsgrens was. Lokaal toegepast: 262 rijen, 262 geseed, 0 open. **OP REMOTE STAAT HIJ NOG NIET
  — dat is de eerstvolgende openstaande handeling, met een eigen akkoord.** En daarna pas de deploy;
  nooit omgekeerd.
- **M93 RANDVOORWAARDE (2) IS BIJGEWERKT, geen nieuw nummer** (M3: niets hernummerd). De eis van een
  plausibiliteitsgrens is VERVALLEN, met de meting als grond en herkomst-etiket BELEID. Wat de rem
  moest tegenhouden zit van twee kanten dicht: de LAGE kant door M94, de HOGE kant door de bevestiging
  van de renner. Heropening staat erbij: komt er ooit een reeks mét gemerkte maximale inspanningen,
  dan is de grens opnieuw te overwegen.
- **DE POORT VUURT VANDAAG NIETS, en dat hoort zo.** Alles is geseed, de staande waarde is 280, en er
  is geen openstaande rit die daarboven uitkomt. Eerstvolgende gelegenheid: het ijkaanbod van
  **2026-09-21**. Verwacht dus GEEN kaart op het scherm na de deploy.
- **PAS 1 VOND HET ONTWERPGAT:** `piek_1200_w` had GEEN enkele runtime-schrijver — alleen een handmatig
  script met `--local` hardcoded — dus het voorstel zou na deployment permanent inert zijn geweest, op
  remote vanaf dag één. Nu `workers/api/src/integrations/ritpiek.ts`, 5 ritten per sync-ronde,
  nieuwste eerst, NIET-FATAAL achter de sync.
- **PAS 2, op de GEBOUWDE code, hield VIER gebreken over.** 5 van 5 lenzen VOLTOOID, nul gestorven, 20
  bevindingen, 4 weerlegd. (1) De kaart noemde de DAG niet, terwijl de keuze op de HOOGSTE piek gaat en
  de getoonde rit dus niet de laatste hoeft te zijn; de terugval "je laatste rit" was een
  recentheidsclaim die de selectie niet waarmaakt (M55). Het oordeel van de renner is de enige rem die
  dit ontwerp nog heeft, en hij kon hem niet bedienen. (2) Goedkeuren schreef in TWEE losse statements:
  een halve val maakte de foutmelding onwaar én zette de rit klem achter een 409 die nooit meer opengaat
  — nu één `db.batch`. (3) De vuller kende geen verschil tussen een 429 en een VERWIJDERDE rit, dus vijf
  dode ritten konden zijn venster van vijf permanent blokkeren, geruisloos. (4) Een docstring beweerde
  dat een goedgekeurd voorstel een IJKING is terwijl ik in dezelfde ronde het tegendeel vastlegde.
- **VISUELE VERIFICATIE VING EEN VIJFDE die GEEN toets kon zien.** `activities.datum` draagt een VOLLE
  tijdstempel en `datumKort_` matcht op een ANKERD patroon, dus de kaart las "Op 2026-08-24T09:12:00".
  De unit-toetsen én de 215-rij-fixture dragen allemaal KALE datums — een fixture die netter aanlevert
  dan de tabel maakt elke toets erop blind voor precies dat verschil. Gerepareerd bij de bron.
- **BESLIST: een goedgekeurd voorstel is GEEN vierde meetgelegenheid-bron.** `laatsteGelegenheid` meet
  of er een MAXIMUM gezet is, niet of de WAARDE klopt, en de voorstel-poort eist geen maximale
  inspanning. Goedkeuren betekent "mijn getal stond verkeerd", niet "ik ging vol" — dezelfde grens die
  M91 trekt, andersom. Grond vastgelegd bij `MetingBron` in `apps/web/src/lib/effect.ts`.
- **EEN ZIN OM AAN DAAN VOOR TE LEGGEN, en ik heb hem NIET stilzwijgend veranderd.** Op hetzelfde scherm
  staat de ijk-staat-regel "Ik heb je drempel nog nooit gemeten", en die blijft na een goedkeuring
  staan. Dat is de bedoelde uitwerking van het besluit hierboven en letterlijk waar, maar het leest
  wrang onder een kaart waarin de app net 295 watt uit een rit overnam. Gladstrijken vraagt precies het
  besluit dat op gronden is afgewezen. Zie `docs/PUNT69-BOUW.md` §18.11.
- **PUNT 66 BLIJFT OPEN.** Dit punt lost het pas op zodra er werkelijk een goedkeuring is geweest.
- **CHECK 43 ERBIJ**, conditie ALTIJD: schrijf je een string die de gebruiker een OORDEEL laat vellen,
  controleer dan of elke grootheid die hij daarvoor nodig heeft ook in die zin staat — en of geen
  aanwijzend woord ("die dag") naar iets wijst dat de zin niet noemt.
- **NUL DEPLOYS, NUL REMOTE-MUTATIES, NUL verzoeken aan intervals.icu.** De Worker draait onveranderd
  op `0fcb0ddf-1796-4084-ae6e-0062c7033a28`. De lokale zaai voor de visuele controle is teruggedraaid:
  262 rijen, `settings.ftp` weer op 280.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 71 ·
  72 · 74 · 75 · 77 · 78.

FOCUS VOLGENDE CHAT: **ROADMAP punt 61 (+ 54) — DE DOELCHECK**, de tweede helft van M89 en het enige
deel van punt 47 dat nooit is aangeraakt. Die focus stond al in het vorige blok en punt 69 blokkeert
hem niet meer. Kalendergrond: in februari sluit het onderhoudsblok en dan is de vraag of de FTP het
gehouden heeft, vóór de Amstel-Gold-voorbereiding begint. **Geen backfill nodig.** Wat er wél in de weg
staat: `const ALLOWED_WINDOWS = new Set<string>(["90d", "1y"]);` naast
`export type PowerCurveWindow = "90d" | "1y";`, terwijl `DOELEN-SPEC` §3.2 om ZES WEKEN vraagt — en
§3.2 draagt TWEE criteria op TWEE grootheden terwijl een venster er één levert.

**EERST AFMAKEN WAT HIER OPENSTAAT:** migratie 0014 op remote D1, daarna de deploy. Beide vragen een
expliciet akkoord van Daan en draaien niet onder auto.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main` bij aanvang, boom schoon bij aanvang, HEAD `c081dce`.
`daanhhk/training` staat op `3e8090a` met een SCHONE gevolgde boom; er staan daar wel vier ONGEVOLGDE
mappen (`_import-design/`, `_import-design-2/`, `_import-design-4/`, `design_handoff_cadans/`) van 07
en 08-06-2026 — twee maanden ouder dan deze sessie en niet door een ronde gemaakt.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling.

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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
