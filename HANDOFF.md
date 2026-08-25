# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

STAND 2026-08-25 (EERSTE BLOK VAN DEZE DAG) — **ER IS NIETS MIS MET HET TOKEN, EN DAAN HAD GELIJK.** Diagnose-ronde, read-only:
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
  ~~**Daarmee vervalt de behoefte aan een gekozen drempel**: de app vergelijkt met de staande
  waarde.~~ **DIE GEVOLGTREKKING IS OP 25-08-2026 GEMETEN EN ONJUIST GEBLEKEN — zie het bovenste blok.
  Er zijn tóch TWEE gekozen getallen nodig: een leeftijdsgrens en een plausibiliteitsgrens.** Het
  besluit zelf staat wel, en is nu norm **M94**.
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

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
