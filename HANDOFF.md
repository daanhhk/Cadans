# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 (ZESDE BLOK VAN DEZE DAG) — **ER IS GEEN HERKENNER, EN DAT IS DE UITKOMST.** Punt 69
(1), meetronde met een backfill. Geen bouw, geen deploy. **De ronde heeft twee keer haar eigen
conclusie moeten terugnemen, en dat is de waarde ervan.**
- **DE VRAAG WAS: waaraan herkent de app dat er een drempelwaarde uit een rit te halen valt.** Het
  antwoord is: **aan niets dat Cadans vandaag heeft.** S1 VALT, S2 HOUDT, S3 VALT.
- **DE SPRONG IN `rolling_ftp` — Daans kandidaat — DEUGT NIET ALS DETECTOR.** Over 222 fiets-ritten
  (394 dagen) zijn er 57 veranderingen: **48 × −1, 5 × −2, en één elk van +1, +10, +11, +29**. Er zijn
  dus DRIE sprongen. De "vierde" die ik eerst telde is een stap van +1 op een rit van 266 minuten bij
  IF 76,36 — exact de decay-quantum, dus de ruisvloer als signaal gelezen. En de ritten die de
  VENSTERS op `secs = 1200` aanwijzen (268 W, beide) springen HELEMAAL NIET.
- **MIJN EIGEN FILTER MAAKTE EEN VALS LABEL, en dat is nu CHECK 41.** Ik filterde op `type='Ride'` en
  liet daarmee **14 `VirtualRide`-rijen** vallen — óók fietsritten. Gevolg: de scherpste rit van de
  reeks verdween (20 minuten binnen op **IF 100,77**, de enige rit met IF ≥ 100 van de 222), én er
  ontstond een sprong-label 270→276 waar `rolling_ftp` in werkelijkheid DAALT van 277 naar 276. Een
  kwart van mijn labels was een artefact van de WHERE.
- **DE BACKFILL IS GEDRAAID, met akkoord.** 222 verzoeken (harde bovengrens 230, GOOIT), **215
  waarden**, 1 rit zonder 1200-punt (duurt 8 minuten), 6 mislukt, **216 rijen weggeschreven**, 6 open
  en herstartbaar. Migratie **0013** (`piek_1200_w` plus `piek_gehaald_op` op `activities`) is LOKAAL
  toegepast; **remote niet — punt 76, het token mist de `d1`-scope.**
- **DE MEETKETEN IS ONAFHANKELIJK GEVALIDEERD.** Beide gecachte vensters wijzen op `secs = 1200` een
  rit aan, en diezelfde rit draagt in `activities` exact dezelfde waarde — twee treffers op twee. Op
  het 90d-venster is de dekking 50 van 50 en daarmee sluitend. Dekking totaal **215 van 222 = 96,85
  procent**; de 6 mislukkingen vallen één-op-één samen met de 6 fiets-ritten zónder énige
  vermogensdata, dus er is geen kandidaat verloren.
- **TERUGGENOMEN CONCLUSIE 1 — "de staande drempelwaarde staat te hoog". DAT WAS ONJUIST.** De
  rekensom klopte (jaarbeste 268 W → M93 geeft 255, tegen een staande 280), maar
  `power_curve_cache` draagt op de VENSTER-krommes een veld `powerModels` dat ik eerst over het hoofd
  zag: 1y geeft **ftp 277 en 271**, 90d geeft **283 en 266**. **De staande 280 ligt binnen die band,
  3 watt van de jaarschatting.** Mijn eerdere "`powerModels` is null" was gemeten op één per-rit-kromme
  van één Z2-rit en werd door mij ten onrechte veralgemeend.
- **WAT ER WÉL AAN DE HAND IS (punt 77): er is in een JAAR geen maximale twintigminuteninspanning
  gereden.** Het aandeel ritten op IF ≥ 90 zakt per kwartaal **12,3 → 12,2 → 5,6 → 0,0 → 0,0 procent**;
  in 2026Q2 en Q3 samen staat **geen enkele van de 73 ritten** op IF ≥ 90. Tegelijk DALEN de pieken
  niet: **+0,0162 W per dag (+5,9 W per jaar)**, en het laatste kwartaal draagt het hoogste gemiddelde.
  Vlak-tot-stijgend bij nul harde ritten is "niet vol gegaan", niet conditieverlies. Het jaarbeste van
  268 W komt trouwens uit een rit van 120 minuten op IF 81,82 — een plak uit een duurrit.
- **TERUGGENOMEN CONCLUSIE 2 — "bouw het voorstel niet".** Ook onjuist, op twee gronden. Ik velde een
  verdict over §6 met de meting van een ANDER ontwerp (mijn eigen alleen-omhoog-variant, die inderdaad
  nul keer vuurt; §6 kent geen richtingsbeperking). En ik wees het bestaande ijkaanbod aan als weg
  "zonder één regel nieuwe code" — dat bestaat niet: `PUT /api/ijking` draagt alleen `blok`, `doel` en
  `antwoord`, en **M93 is vandaag een norm ZONDER UITVOERDER.**
- **DE WEERLEGGINGSPASSEN: 4 van 4 en 3 van 3 VOLTOOID, nul gestorven.** Pas 1 haalde alle vier de
  claims onderuit (inclusief mijn labels); pas 2 bevestigde de MEETKETEN maar wierp beide CONCLUSIES
  om. Zonder die twee passen was hier een detector gebouwd op verzonnen labels, en daarna een advies
  gegeven dat naar een niet-bestaande weg wees.
- **NUL DEPLOYS, nul remote-mutaties.** 222 GET-verzoeken aan intervals.icu, alle achter een
  bovengrens die GOOIT plus een vangnet op `globalThis.fetch`. De sleutel heet `INTERVALS_API_KEY` en
  zijn waarde staat nergens.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 76 · 77.

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 (2) — HET VOORSTEL BOUWEN.** M93 is een norm zonder uitvoerder:
rijdt Daan de aangeboden test op **2026-09-21**, dan eindigt de keten bij een gereden rit en gebeurt
er niets. `docs/PUNT69-BOUW.md` §6 is die ontbrekende schakel en §15 beschrijft wat eraan verandert.
**DRIE DINGEN HOREN ERBIJ, alle drie gemeten deze ronde:** (1) bouw hem ZONDER richtingsbeperking —
niets in M91, M92 of M93 sluit een neerwaarts voorstel uit, en M93 randvoorwaarde (2) bestaat juist
omdát die in scope zijn; (2) poort (ii) uit §6 stap 3 VERVALT ("de rit hoort bij een aangeboden
test"), want het rit-besluit haalt de agenda uit de keten; (3) **de plausibiliteitsgrens is NIET "was
dit een maximale inspanning"** — die vraag is deze ronde gemeten en onbeantwoordbaar gebleken — maar
een grens tegen een ONGELOOFWAARDIGE SPRONG in beide richtingen. De grondstof staat er nu: 215
waarden in `activities.piek_1200_w`, plus intervals' eigen modellen als tweede referentie.
**HET SCHERPSTE HOUVAST:** op de enige rit met een echte maximale inspanning reproduceert M93
intervals' eigen schatting tot op een halve watt — `0,95 × 310 = 294,5` tegenover `rolling_ftp` **295**.
**EN LET OP PUNT 76:** migratie 0013 staat lokaal en moet nog naar remote.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-24 (VIJFDE BLOK VAN DEZE DAG) — **EEN LIVE DEFECT IS WEG EN PUNT 69 IS ONTBLOKT.**
Punt 73, kleine reparatieronde. De doel-wissel-knop deed sinds zijn bouw niets en zei niets; dat is
gerepareerd, getest en uitgerold.
- **HET DEFECT, in één zin.** `PUT /api/settings` weigerde een expliciete `null` met een 400, terwijl
  het wire-type `Partial<SettingsInput>` elk veld als `T | null` typeert — de route ging tegen zijn
  eigen gepubliceerde type in. Onder FULL-REPLACE betekent een WEGGELATEN veld al "wissen"; een
  expliciete null hoort hetzelfde te betekenen. **De reparatie is dat en niet meer:** `numField` en
  `strField` geven nu `null` terug, de `doelStart`-tak accepteert null, en de drie presentatie-velden
  gebruiken `?.slice(0, 24) ?? null`.
- **DE OMVANG WAS GROTER DAN ÉÉN KOLOM.** GEMETEN op de settings-rij: **21 kolommen, VIJF op NULL**
  (`threshold_pace`, `fase`, `ftp_auto_update`, `weight_auto_update`, `email_digest`), en GEEN ENKELE
  datakolom draagt `.notNull()`. Alle zestien velden die de route accepteert konden dus een 400 geven.
  En `fase` was niet de algemene dader: de negen `numField`-poorten staan op positie 1 t/m 9 en `fase`
  pas op 11, dus een leeggelaten `doelDuur` of `lthr` gooit eerder. Dat het hier `fase` was, is een
  eigenschap van díe rij.
- **ROOD GEMETEN, en dat is de kern van het bewijs.** De regressietest faalde vóór de reparatie met
  precies `expected 400 to be 200` op een volledig settings-object met nulls — het live defect,
  gereproduceerd in de harness. Daarna groen.
- **ER IS GEEN ENKELE BESTAANDE TEST GEWIJZIGD**, en dat is de toets dat de semantiek niet verschoven
  is. Full-replace staat, weglaten cleart nog steeds, en de lassing tussen `doel` en `doelStart` is
  intact — een body met alleen `doel` wist `doelStart`, precies zoals punt 28 nodig heeft.
- **DE WEERLEGGINGSPAS VERANDERDE HET ONTWERP, en dat is de belangrijkste opbrengst.** Ik wilde van
  PUT een MERGE maken. Pas 1 (**4 van 4 VOLTOOID**, drie weerlegd) haalde dat onderuit: een merge
  maakt de doel/doelStart-lassing STIL los, geen van de aanroepers heeft haar nodig, en zij kantelt
  negen tests waar de gekozen vorm er nul kantelt. **DRIE AANROEPERS, niet één** — en de derde,
  `tools/shots/shot.mjs`, had het probleem al opgelost: hij filtert nulls eruit en legt de reden
  erbij uit.
- **PAS 2 (3 van 3 VOLTOOID) WEERLEGDE DE REPARATIE NIET**, maar ving wel drie dingen: een OVERCLAIM
  van mij (ik schreef dat de merge in `docs/UI-SYNC-SETTINGS-RECON.md` "afgewezen" was — hij staat
  daar als OPEN BESLISPUNT), drie docstrings die het oude contract bleven verkondigen, en een gat in
  mijn eigen regressietest (dertien van de zestien sleutels; precies de drie herschreven
  presentatie-velden ontbraken). Alle drie rechtgezet.
- **DE LEGE STRING IS IETS DERDES**, en dat is nu vastgepind: `""` passeert `strField` en landt als
  `''` in D1, niet als NULL. Dat was al zo en is niet gewijzigd; de docstrings beweerden er ten
  onrechte "geeft 400" over.
- **NIEUW: ROADMAP PUNT 75** — er zijn **14 stille `catch`-blokken over 12 coach-kaartbestanden**, een
  gekopieerd sjabloon, en er is GEEN gedeelde foutmelding. Deze ronde repareerde er één (de kaart waar
  het defect zat) en liet de rest bewust staan. `coachNarrative.ts` draagt sinds nu één
  mislukking-regel, `schrijfMisluktRegel` — het begin van het idiom, niet het einde.
- **NIEUW: ROADMAP PUNT 76 — PROD-D1 IS NIET TE LEZEN met deze sessie.** `wrangler d1 execute
  --remote` geeft `code 7403`; `wrangler whoami` toont een token met `workers`- en
  `workers_scripts`-scopes maar **zonder `d1`**. Daardoor is verwachting R3 **NIET GEMETEN**: of de
  PROD-rij ook een null-veld draagt, staat niet vast. De AFLEIDING is sterk — het formulier biedt voor
  `fase` alleen "" (Automatisch) en "maintain", dus wie nooit "maintain" koos heeft null — maar een
  afleiding is geen meting en wordt hier ook niet als meting gepresenteerd.
- **M93 DRAAGT NU EEN EIGEN NUMMER.** Het factor-besluit van vorige ronde leefde als blokquote onder
  M92; het is gepromoveerd tot **M93 (NORM)** — M92 gaat over de PLAATSING van de ijking, M93 over de
  REKENREGEL. Tegelijk rechtgezet: die eerste versie schond **M2** (geen bestandsnamen of
  regelnummers in de canon); de vindplaatsen staan nu in het verdict-document.
- **DE REPARATIE IS UITGEROLD**, met Daans akkoord en niet onder auto. Nieuwe worker-versie
  **`0fcb0ddf-1796-4084-ae6e-0062c7033a28`** (100%, `2026-08-24T14:53:25.510Z`); de weg terug is
  VOORAF geverifieerd en luidt `npx wrangler rollback 940414c4-be95-4968-9eef-542a188db563`. Geen
  migratie, geen D1-mutatie — remote D1 draagt onveranderd 0000 t/m 0012. Volledig in
  `docs/PROD-STAND.md`.
- **WAT NA DE DEPLOY NIET IS VASTGESTELD, en dat is geen detail.** CC-CHECKS 37 is opnieuw NIET
  gedraaid (basic-auth-gate, deploy-only secret); er is alleen een NAAM-vergelijking van de bundel
  (`assets/index-DTgN90UH.js`, gelijk aan de lokale `index.html`). En of de doel-wissel op PROD landt,
  heb ik niet kunnen toetsen — dezelfde gate, én de kaart vuurt alleen bij een doel MET urenvloer,
  dus niet bij `FTP`. Wat Daan moet aanklikken staat in `docs/PROD-STAND.md`.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 76.

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 — HET FTP-VOORSTEL NA EEN GEREDEN TEST BOUWEN.** Alles wat het
blokkeerde is weg: de factor staat als **M93** in de canon (95 procent van het beste
twintigminutenvermogen, afgelezen op `secs = 1200`) en het schrijfpad werkt sinds punt 73, dus een
goedgekeurde FTP kan landen. Het ontwerp ligt volledig in `docs/PUNT69-BOUW.md` §6.
**WAT DIE RONDE NOG MOET OPLOSSEN, en het is allebei GEMETEN:** (1) de koppeling plan→rit is ZWAK —
`testResultaat` leest alleen de override en raakt geen enkele activiteit; de enige koppeling is
dezelfde kalenderdag plus een vloer van 15 fietsminuten, en bij twee ritten houdt `done.idExt` de
LANGSTE. (2) De app kan NIET zien of er vol gereden is: een Z2-rit gaf 195 W, waaruit 185 W zou volgen
tegen een gezette FTP van 280 — een verlaging van **34 procent**. **DE PLAUSIBILITEITSGRENS DIE DAT
MOET VANGEN IS EEN DREMPEL EN WORDT OP DE ECHTE REEKS GEIJKT, nooit in een gesprek gekozen.** De
backfill van ongeveer **255** per-rit-krommes (ongeveer **1,4 MB**, één verzoek per rit) levert
daarvoor de kalibratieset en is daarmee méér dan compleetheid. Randvoorwaarden van Daan: gedoseerd,
teller, HARDE bovengrens die GOOIT, HERSTARTBAAR, alleen lezen.

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
