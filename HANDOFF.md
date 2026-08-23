# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-23 (DERDE BLOK VAN DEZE DAG) — DE BOUW VAN PUNT 47 IS BEGONNEN EN GESTOPT VÓÓR DE
EERSTE REGEL CODE, EN DAT IS DE OPBRENGST. Docs-only: geen code, geen engine, geen migratie, geen
deploy, geen D1. Prod en D1 staan waar het blok hieronder ze noemt.
- **V1 VIEL, EN DAAROM STAAT ER GEEN REGEL CODE.** De vierweekse klok bindt het ijkaanbod niet op
  ÉÉN plek maar op DRIE, en die drie hangen aan elkaar. (a) Poort (1) van `buildTestVoorstel` in
  `apps/web/src/lib/testvoorstel.ts`. (b) Een tweede gebruik van dezelfde klok in datzelfde
  bestand: `blokStartVoorWeek` plus `BLOK_WEKEN * 7` bouwen het venster waarmee poort (3) een reeds
  ingeplande test onderdrukt. (c) `blokStart` REIST HET BESTAND UIT als veld op de teruggegeven
  `TestVoorstel` en wordt buiten `testvoorstel.ts` gelezen als de AFWIJS-SLEUTEL — in
  `SchemaView.tsx` via `isTestVoorstelAfgewezen` en in `TestVoorstelCard.tsx` via `afgewezen.add`.
  "Niet dit blok" betekent vandaag dus "niet dit VIERWEEKSE blok". **DE VOLGENDE BOUWPROMPT DRAAGT
  DIE DRIE, NIET ÉÉN.**
- **V2, V3 EN V4 HIELDEN — gemeten met de echte functies, niet beredeneerd.** V2: de twaalfweekse
  teller leeft. Vier doelblok-testweken over 52 weekmaandagen vanaf `doelStart` `2026-06-29` —
  `2026-09-14`, `2026-12-07`, `2027-03-01`, `2027-05-24` — en **0 van de 4** wordt door de
  event-fase overschaduwd; `effectiveMacroFase_` geeft in alle vier `Test`. V3: een doelwissel zet
  de nieuwe `doelStart` op blokweek 1 bij 5 van de 5 gemeten wisseldagen, dus het gat is REËEL:
  vandaag drie weken, na een naïeve omhanging ELF. V4: `DOEL_BLOK_WEKEN * 7` is 84 dagen tegen
  `TEST_INTERVAL_DAGEN` 90, dus de dag-vloer onderdrukt elke doelblokgrens die op een vorige ijking
  volgt met precies 6 dagen.
- **GEEN ENGINE-WIJZIGING NODIG, en dat is gemeten en niet aangenomen.** `computeMacroPhase` wordt
  in `apps/web/src/lib` al geïmporteerd door `blok.ts`, `faseOvergang.ts`, `proposal.ts` en
  `schema.ts`, en `buildTestVoorstel` draagt `input.doelStart` en `input.weekMondayISO` al — dat is
  precies de invoer die de functie vraagt.
- **DE OMHANGING IS EEN VERSMALLING, GEEN VERSCHUIVING — dit stond nergens en verandert de prijs.**
  Twaalf is een veelvoud van vier, dus elke twaalfweekse grens IS al een vierweekse blokweek 4
  (gemeten: `blokweek4=4` bij alle vier de testweken). Van dertien openingen per jaar naar vier. Er
  komt geen enkel nieuw aanbodmoment bij.
- **PUNT 52 — GEEN OORDEEL, EN DAT IS DE EERLIJKE UITSLAG.** De proef draaide, maar V1 viel tijdens
  de meting en dus was er geen bouw-helft. De recon-helft verdunde NIET; de zwakke plek zit in de
  ROL: in deze vorm is de uitvoerder óók de scheidsrechter over zijn eigen stop. In een gesplitste
  ronde was de bouwprompt HERSCHREVEN met poort (3) en de afwijs-sleutel erin — dat is de winst die
  de splitsing koopt. Het punt blijft OPEN en verschuift naar de eerstvolgende ronde waarin de
  verwachtingen houden.
- **DE DERDE GESTRANDE AFLEZING OP RIJ, en de oorzaak is nu structureel.** `recon` is opnieuw niet
  ontdekt, verbatim: `Agent type 'recon' not found. Available agents: claude, claude-code-guide,
  Explore, general-purpose, Plan, statusline-setup`. De sessie is 40 dagen OUDER dan het bestand dat
  zij moet lezen (transcript 2026-07-14, het agent-bestand van 2026-08-23). Een sessie kan de
  laadmachinerie die bij háár start draaide niet achteraf meten. **ZOLANG DEZELFDE SESSIE LOOPT IS
  ELKE VOLGENDE POGING DEZELFDE NIET-METING.** De rules-probes gaven om dezelfde reden geen
  uitslag; zij zijn opgeruimd en `.claude/rules/` bestaat niet meer. `.worktreeinclude` blijft
  ONGETOETST: beide probes stonden er wél, maar alleen omdat dit de hoofdcheckout is waarin ze
  gemaakt zijn.
- **VIER NIEUWE PUNTEN, 53 t/m 56, met hun grond.** 53: de ONGEIJKT-staat van M91 heeft geen
  drager — de optie-inventaris staat bij het punt en NIEUWE PERSISTENTE STAAT VRAAGT EEN EIGEN
  AUTORISATIE. 54: de doelcheck-maat per doel is niet gekozen (de §3.2-vraag, nu een eigen
  ontwerpronde). 55: het aanbodvenster is ÉÉN week breed en kan stil missen — vandaag kost dat vier
  weken, na de omhanging een KWARTAAL. 56: `TEST_MIN_BESCHIKBAAR_MIN` en `TEST_DUUR_MIN` staan
  allebei op 60 zonder herkomst-etiket; dat is een OPZOEKRONDE en raden is er verboden.
- **VLOEREN: lees ze zelf uit de suite.** Onbewogen deze ronde — docs-only, geen bronbestand
  geraakt. Het vorige blok noemt de stand waarop ze stonden; neem ze niet over uit een blok maar
  toets ze tegen de suite.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51 (alleen (3)) · 52 · 53 · 54 · 55 · 56.

FOCUS VOLGENDE CHAT: **BOUW-ronde — ROADMAP punt 47, de omhanging naar de doelblok-klok, nu als
DRIEDELIGE ingreep.** De recon is klaar en staat in `docs/PUNT47-BOUW.md`; die hoef je niet over te
doen. Wat de prompt moet dragen: poort (1), het onderdrukkings-venster van poort (3), en de
identiteit van het aanbod (`blokStart` als afwijs-sleutel, met twee lezers buiten het bestand).
Beslis in dezelfde beweging punt 55 — blijft het venster één week breed of blijft het OPEN tot de
ijking gedaan of geweigerd is — want de tweede lezing vraagt de staat uit punt 53, en die vraagt een
eigen autorisatie die er nog niet is. De doelwissel uit V3 hoort erbij: zonder reparatie wordt het
onderdrukkings-gat elf weken.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE, en zij werkte.** Deze ronde: pad
`/c/Users/daan/Projects/cadans` vóór én ná de `cd`-regel, `git rev-parse --git-dir` en
`--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0 achter en 0 vooruit op
`origin/main`, versie `2.1.208 (Claude Code)`. De `cd`-regel bleek hier een no-op; dat is één geval
en geen vrijbrief.

**DE HARNAS-AFLEZING HOORT NIET MEER IN EEN PROMPT.** Drie rondes lang is zij gevraagd en drie keer
niet gelukt, telkens met een andere oorzaak: de sessiegrens, de authenticatie van `claude -p`, en
opnieuw de sessiegrens. Zij hoort in de OPENINGSZIN van een sessie die aantoonbaar ná het
agent-bestand opent, en daar heeft deze kant geen invloed op. Vraag hem niet nog eens als opdracht;
neem hem mee als waarneming zodra hij zich vanzelf voordoet.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

STAND 2026-08-23 (TWEEDE BLOK VAN DEZE DAG) — PUNT 51 (1) EN (2) ZIJN AF, MAAR HET HARNAS IS NOG
GEEN VANGNET: TWEE AFLEZINGEN STAAN OPEN EN DIE ZIJN JOUW EERSTE DAAD. Code-en-config-commit
`e7c3e910`, CI success. NIET GEDEPLOYD — prod en D1 staan waar het blok hieronder ze noemt.
- **HET AGENT-BESTAND STAAT, EN IS NOG GEEN VANGNET.** `.claude/agents/recon.md` draagt de
  recon-helft van een ronde: `model: inherit`, `tools: Read, Glob, Grep, Bash, WebFetch`, en `Edit`
  en `Write` er structureel UIT. DISCOVERY VRAAGT EEN HERSTART, en dat is gemeten, niet aangenomen.
  De aanroep in dezelfde sessie gaf verbatim: `Agent type 'recon' not found. Available agents:
  claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup`.
- **DE TOOLS-BINDING EN HET BASH-RESTGAT ZIJN NIET GEMETEN — en dat is iets anders dan gemeten als
  afwezig.** Of `Edit` en `Write` werkelijk ONBESCHIKBAAR zijn of slechts ontraden, en of `Bash`
  het benoemde restgat werkelijk openlaat, is vanuit een sessie waarvan de registry ouder is dan
  het bestand per constructie niet waarneembaar. **Lees dit niet als geregeld.** Het bestand
  BESCHRIJFT de grens correct — `Edit` en `Write` structureel weg, `Bash` als discipline — maar
  beschrijven is geen binden.
- **DE FRONTMATTER IS AFGELEID, NIET GEGOKT.** Uit 24 echte agent-definities in de geïnstalleerde
  plugins: `model: inherit` komt er zeven keer in voor, en de read-only tools-vorm bij drie
  recon-achtige agents. `WebFetch` heet in drie definities zo en niet anders.
- **RULES: DE DOCUMENTATIE ZEGT JA, DE EMPIRIE IS NIET GEDAAN.** Die twee mogen NERGENS tot één
  uitspraak samenvouwen. Uit `https://code.claude.com/docs/en/memory`, verbatim: *"Rules can be
  scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules
  only apply when Claude is working with files matching the specified patterns."* en *"Rules without
  `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`."* Twee
  versiegrenzen staan er letterlijk bij — `v2.1.198` (symlink-matching) en `v2.1.211`
  (`--setting-sources`) — en deze machine draait `2.1.208`, dus ertussen. DE IN-SESSIE AFLEZING WAS
  NIET CONCLUSIEF: de merkstring verscheen niet, maar die sessie was ouder dan de map, en een
  UITBLIJVENDE merkstring scheidt niet-geladen niet van geladen-maar-genegeerd. Verdict en
  redenering staan in `docs/PUNT51-RULES-VERDICT.md`.
- **HET INSTRUMENT `claude -p` IS VERVALLEN.** Verbatim: `Failed to authenticate: OAuth session
  expired and could not be refreshed`. Een geneste sessie kan hier niet openen, dus de aflezing
  rijdt op een ECHTE sessiegrens — dat wil zeggen: op jouw eerste bericht.
- **DE WERKWIJZE-DIAGNOSE, en die mag niet verdampen.** RECON `aca1cfc5`: **173156 bytes** canon
  over vier procesdocumenten, waarvan er feitelijk ÉÉN elke ronde gelezen wordt
  (`docs/CC-CHECKS.md`, 17389 bytes), tegen **5801 bytes** die automatisch laden (`CLAUDE.md`). De
  lessen zijn APPEND-ONLY en er is NOOIT een intrekkings-pas geweest; dat is de groeimotor en geen
  incident. Punt 51 stap (3) is de plek waar dat gesnoeid wordt, en die stap draagt nu een maat
  (wat blijft staan wordt ook gelezen) en een intrekkings-criterium.
- **DE WANDKLOK VAN DE VOLLE GATE: 49 SECONDEN** — install 0s, lint 2s, typecheck 9s, test 25s,
  build 13s. Op grond daarvan is stap (4) AFGEWAARDEERD: vijftig seconden blokkeren bij elke commit
  terwijl CI hetzelfde vangt, koopt promptzuinigheid met wachttijd. De engine-deny-hook blijft wél
  staan — die kost geen looptijd.
- **NIEUW PUNT 52 — RECON EN BOUW IN ÉÉN RONDE, als eenmalige PROEF op punt 47.** Het
  beoordelingscriterium is NIET "werkte het" maar of het ene rapport dezelfde bewijskracht draagt
  nu het twee rondes werk draagt. Verdunt het, dan splitsen we terug, ook als de bouw slaagde.
- **MEELIFTER GEDAAN.** `.gitignore` dekt nu `.claude/settings.local.json` en
  `.claude/rules/_wegwerp-*.md` vanuit de REPO; `git check-ignore -v` wijst `.gitignore` aan en niet
  de globale ignore van deze machine.
- **DE TWEE WEGGOOI-REGELS LIGGEN KLAAR — hier staan hun literals, want jij leest dit blok en niet
  het rapport.** Regel 1: `.claude/rules/_wegwerp-paths-probe.md`, merkstring
  `RULESPATHS-MERKSTRING-K8T3WQ`, gescoopt op `packages/engine/src/zones.ts`. Regel 2:
  `.claude/rules/_wegwerp-altijd-probe.md`, merkstring `RULESALTIJD-MERKSTRING-R5N9YB`, ZONDER
  `paths`. Beide zijn genegeerd door de repo-regel en staan NIET in de commit.
- **DE WORKTREE-VONDST, en zij ligt onder de twee gestrande aflezingen.** De desktop-app geeft ELKE
  sessie een eigen worktree, op een eigen branch. Verbatim uit
  `https://code.claude.com/docs/en/worktrees`: *"In the desktop app, every new session gets its own
  worktree automatically."* — onder `.claude/worktrees/<naam>/` op een branch `worktree-<naam>`. Een
  worktree is een VERSE checkout, dus GITIGNOREDE bestanden zijn er per constructie niet, en de twee
  weggooi-regels reisden dus niet mee. **DIT STOND NERGENS VASTGELEGD**, in geen enkel document.
  GEREPAREERD: `.worktreeinclude` in de projectroot neemt `.claude/rules/` mee. Diezelfde pagina
  geeft de syntaxis, verbatim: *"The file uses `.gitignore` syntax. Only files that match a pattern
  and are also gitignored are copied, so tracked files are never duplicated."*
- **TWEE OORZAKEN, NIET ÉÉN — en dat verschil telt.** De worktree verklaart de desktop-kant. Van
  één gestrande aflezing is een ANDERE oorzaak GEMETEN: die sessie was zelf ouder dan de bestanden
  die zij moest lezen (transcript aangemaakt 2026-07-14, commit `e7c3e910` van 2026-08-23). Schrijf
  de worktree dus niet als enige oorzaak op; er zijn er twee en ze vragen elk hun eigen controle.
- **`cd C:\Users\daan\Projects\cadans` ALS VASTE EERSTE PROMPTREGEL IS VERDACHT — HERKOMST CHAT,
  NIET GEMETEN.** Draait een sessie in haar eigen worktree, dan kan die regel CC uit zijn werkmap
  naar de HOOFDCHECKOUT tillen, en dan meet en commit hij op een andere branch dan waar de sessie
  hoort. Lees dit NIET als vastgesteld. De meting is goedkoop en hoort bij de eerstvolgende ronde:
  laat de sessie haar eigen pad rapporteren vóór en ná die regel.
- **NIEUWE CANON-REGEL: ELK RAPPORT DRAAGT ZIJN OMGEVING** — pad, worktree ja of nee, branch,
  versie. Staat bij de rapportvorm in `docs/WERKWIJZE.md`. De toets is
  `git rev-parse --git-dir` tegen `--git-common-dir`: gelijk is hoofdcheckout, ongelijk is worktree.
- **`--print` BESTAAT NIET IN DE DESKTOP-APP**, dus `claude -p` is daar geen instrument. Samen met
  de authenticatiefout van de vorige ronde is die route definitief dicht: een geneste sessie leest
  niets af, en de aflezing hoort bij de OPENING van een echte sessie.
- **DE RULES-AFLEZING KRIJGT GEEN EIGEN RONDE MEER — zij rijdt mee.** De twee probes staan klaar en
  reizen nu mee dankzij `.worktreeinclude`, dus een verse sessie beantwoordt de vraag in haar
  openingszin. Ruim ze daarna op.
- **VLOEREN NU: vitest-totaal 1010 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20.** Onbewogen: docs-en-config. Lees ze zelf uit de suite; neem ze niet over
  uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51 (alleen (3)) · 52.

FOCUS VOLGENDE CHAT: **ROADMAP punt 47 — de blok-check valt in twee, ijking tegenover doelcheck.**

**DE RONDE OPENT MET DE OMGEVINGSVERKLARING, EN DIE IS EEN STOP-CONDITIE.** Rapporteer vóór alles:
je werkpad, of dat pad een worktree is (`git rev-parse --git-dir` tegen `--git-common-dir` — gelijk
is hoofdcheckout, ongelijk is worktree), je branch, of die achterloopt op `origin/main`, en
`claude --version`. **Draait de sessie niet waar we denken, dan stopt zij daar** en meldt dat. Doe
dit vóór de `cd`-regel effect heeft, of meld beide paden: die regel is VERDACHT (zie het blok
hierboven) en kan een worktree-sessie naar de hoofdcheckout tillen.

**DE RULES-AFLEZING KRIJGT GEEN EIGEN RONDE MEER — zij rijdt mee in de openingszin.** Dankzij
`.worktreeinclude` reizen de twee probes nu mee naar een verse worktree. Verschijnt
`RULESALTIJD-MERKSTRING-R5N9YB` aan het begin van je eerste antwoord, dan laadt een regel ZONDER
`paths` altijd. Verschijnt `RULESPATHS-MERKSTRING-K8T3WQ` zodra je `packages/engine/src/zones.ts`
leest, dan vuurt een PATH-SCOPED regel op file-read. Verschijnt er niets, dan is dat GEEN bewijs van
het tegendeel — niet-geladen en geladen-maar-genegeerd zijn niet te scheiden. Meld het als vondst,
ruim beide regels op, en ga door. Meet in dezelfde beweging of `recon` nu in je agent-types staat en
of zijn tools BINDEN; lukt dat niet, dan blijft dat NIET GEMETEN en niet gemeten-als-afwezig.

**PUNT 47 DRAAIT ALS DE EENMALIGE PROEF VAN PUNT 52** — recon en bouw in ÉÉN ronde, met de WAT-ALS
als VOOR-AUTORISATIE in plaats van een voorspelling: je meet, leest je eigen bevindingen, en bouwt
door zolang de verwachting HOUDT; valt zij om, dan stop je en rapporteer je. Het
beoordelingscriterium staat bij punt 52 en is nadrukkelijk NIET "werkte het", maar of het ene
rapport nog dezelfde bewijskracht draagt nu het twee rondes werk draagt. DE OPENSTAANDE MEETVRAAG
VAN 47 staat bij het punt: `blokStartBijDoel` herschrijft `doelStart` bij een doelwissel terwijl
poort (1) van `buildTestVoorstel` blokweek gelijk aan `BLOK_WEKEN` eist — VERMOEDEN, HERKOMST CHAT
en NIET GEMETEN, dat een wissel het ijkaanbod drie weken onderdrukt.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
