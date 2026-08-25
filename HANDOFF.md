# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-25 — **ER IS NIETS MIS MET HET TOKEN, EN DAAN HAD GELIJK.** Diagnose-ronde, read-only:
geen mutatie, geen migratie, geen deploy. **ROADMAP punt 76 is INGETROKKEN — mijn diagnose van
gisteren was fout.**
- **DE FOUT, en het is er een van mij.** Ik concludeerde dat het wrangler-token de `d1`-scope miste.
  Dat werd een ROADMAP-punt, stond in een rapport, en blokkeerde een migratie. **Het token draagt
  `d1:write` wél** — de grant telt **28 scopes**. Twee keer dezelfde fout in een andere vorm: eerst
  las ik de scopes uit een met `head`/`tail` AFGEKAPTE `whoami`-uitvoer en concludeerde afwezigheid
  uit een lijst die ik niet heel had gezien; daarna haalde ik ze uit het bestand met het patroon
  `"[a-z_:]+"` — **dat geen CIJFERS toelaat, en `d1:write` draagt er een.** Ik zag er 23 van de 28.
  Vastgelegd als CC-CHECKS **CHECK 42**.
- **LANGS WELKE WEG WRANGLER AUTHENTICEERT.** Niet via een omgevingsvariabele: `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`, `CF_API_TOKEN` en
  `WRANGLER_API_TOKEN` zijn **alle zes NIET GEZET**. En niet via `.dev.vars` — dat draagt alleen
  `INTERVALS_API_KEY` en `INTERVALS_ATHLETE_ID`, en het is sowieso de verkeerde plek: dat bestand
  vult de BINDINGS van de Worker, niet de authenticatie van wrangler zelf. Wat er wél is: een
  **OAuth-login die wrangler zelf bewaart** in `…\.wrangler\config\default.toml` (sleutels
  `oauth_token`, `refresh_token`, `expiration_time`, `scopes`). Dat is de ENIGE credential-bron op
  deze machine — dus deploy en `d1 execute --remote` gebruiken per constructie dezelfde.
- **DE WEIGERING WAS TRANSIENT, en dat is met de logs hard te maken.** Op de dag van de mislukking
  raakte `--remote` het D1-`/query`-endpoint **twaalf keer met `OK 200`** (07:36 t/m 09:19 UTC) en
  precies **één keer met `Forbidden 403`** (14:06:27 UTC). Vandaag: **vijf van vijf geslaagd**, plus
  een geslaagde `d1 migrations list --remote`. Van de vijf logbestanden die ooit `7403` droegen gaan
  er vier over D1 en nooit één over een deploy.
- **N1 HOUDT** (één credential, dus een scope-vraag en geen configuratie-vraag). **N2 VALT op ALLEBEI
  zijn helften**: het lag niet aan de rechten, én niet aan de account of de database — het account-id
  `9218229b9be1015defcbacc8c430ca34` en database-id `aa302c17-915b-44cb-8823-89c416974f50` in het
  mislukte verzoek zijn byte-voor-byte dezelfde als in de verzoeken die nu slagen.
- **DE OORZAAK VAN DIE ENE WEIGERING IS NIET VASTGESTELD**, en dat zeg ik liever dan een verhaal te
  verzinnen: het token-verversen gebeurt in zowel de geslaagde als de mislukte runs, dus dat
  onderscheidt niets. Wat vaststaat is waar het NIET aan lag.
- **MIGRATIE 0013 STAAT NOG NIET OP REMOTE — nu GEMETEN in plaats van afgeleid.**
  `d1 migrations list cadans --remote` toont hem read-only onder "Migrations to be applied". Het is
  een prod-handeling en die vraagt Daans akkoord; er is geen technische blokkade meer.
- **NIEUW BESLUIT VAN DAAN, en het draagt de bouwronde: een ONGEPLANDE diepe rit kan de drempelwaarde
  alleen OMHOOG bijstellen. Omlaag kan uitsluitend na een test die de renner BEWUST is aangegaan.**
  GROND: geen trainer verlaagt een drempel op een slechte dag. En de kalibratie van gisteren liet zien
  dat er geen herkenner te ijken viel — 0 van 73 ritten op IF ≥ 90 in twee kwartalen (punt 77).
  **Daarmee vervalt de behoefte aan een gekozen drempel**: de app vergelijkt met de staande waarde.
  Dit besluit vervangt de open vraag die het vorige blok nog stelde over de richting van het voorstel.
- **NUL MUTATIES.** Geen migratie, geen deploy, geen schrijfactie op remote D1, geen nieuw token. De
  enige remote-aanroepen waren SELECT's en een `migrations list`. **Geen enkele credential-waarde
  staat in dit blok, in het rapport of in een commit** — alleen namen en vindplaatsen.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72 · 74 · 75 · 77.

FOCUS VOLGENDE CHAT, in deze volgorde:
1. **MIGRATIE 0013 OP REMOTE.** Punt 76 is ingetrokken en er is geen blokkade meer; wat rest is de
   handeling zelf, met Daans akkoord en een gemeten weg terug vooraf. Loopt hij tegen die ene
   weigering aan, dan is OPNIEUW PROBEREN het juiste antwoord — geen nieuw token.
2. **DAARNA: ROADMAP punt 69 (2), het VOORSTEL BOUWEN.** M93 is een norm zonder uitvoerder: rijdt Daan
   de aangeboden test op **2026-09-21**, dan eindigt de keten bij een gereden rit en gebeurt er niets.
   `docs/PUNT69-BOUW.md` §6 is die ontbrekende schakel, §15 beschrijft wat eraan verandert.
   **BOUW HEM MET DE RICHTINGSREGEL HIERBOVEN:** een ongeplande rit stelt alleen OMHOOG voor, omlaag
   alleen na een bewust aangegane test. Poort (ii) uit §6 stap 3 vervalt. De grondstof staat er: 215
   waarden in `activities.piek_1200_w`.
   **HET SCHERPSTE HOUVAST:** op de enige rit met een echte maximale inspanning reproduceert M93
   intervals' eigen schatting tot op een halve watt — `0,95 × 310 = 294,5` tegenover `rolling_ftp`
   **295**.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie is ouder dan `.claude/agents/recon.md`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

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
  toegepast; ~~**remote niet — punt 76, het token mist de `d1`-scope.**~~ **DIE GROND IS ONJUIST, zie
  het bovenste blok: het token draagt `d1:write` wél. 0013 staat nog steeds niet op remote, maar
  omdat het een prod-handeling is die Daans akkoord vraagt — niet omdat er iets stuk is.**
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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
