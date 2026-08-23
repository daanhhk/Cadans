# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

STAND 2026-08-23 — HET NORM-BESLUIT VAN PUNT 47 STAAT; DE BOUW STAAT OPEN; EN PUNT 51 SCHUIFT
ERVOOR. Docs-only, geen code, geen engine, geen migratie, geen deploy. Prod en D1 staan waar het
blok hieronder ze noemt.
- **PUNT 47 — HET NORM-BESLUIT IS GENOMEN EN VASTGELEGD.** M89, M90 en M91 in
  `docs/TRAININGSMODEL.md` §13, commit `18b749c4fbbb5086e0d1047002e8a2afb78ce811`. M89: aan het
  eind van een blok staan TWEE vragen — IJKING (klopt de drempelwaarde nog) bij elk doel, DOELCHECK
  (is dit doel vooruitgegaan) per doel. M90: de ijking hangt aan de doelblokgrens en is een
  VOORSTEL, één per doelblok als heuristiek. M91: een afwijzing is geen meting — de app draagt de
  ONGEIJKT-staat en zegt haar.
- **DE CANON-TEGENSPRAAK UIT HET VORIGE BLOK BESTAAT NIET.** Dat blok stelde dat punt 47 en
  `DOELEN-SPEC` §3.2 elkaar tegenspraken over de Onderhoud-maat. Punt 47 weerlegt zijn eigen
  samenvallen-formulering TWEE ALINEA'S VERDER: daar staat dat "samenvallen" waar is over de METER
  en onwaar over de VRAAG. De claim rustte dus op de EERSTE HELFT van het punt. HERKOMST-LES: die
  zin was GEPIND HANDOFF en nooit GEPIND ROADMAP — een samenvatting die zichzelf als bron ging
  gedragen. Wat wél openstaat is de MAAT uit §3.2, en dat is een bouwvraag. Zie
  `docs/PUNT47-RECON.md` §0c.
- **DE BOUW VAN 47 STAAT NOG OPEN**, met een open vraag die deze ronde is toegevoegd:
  `blokStartBijDoel` herschrijft `doelStart` bij een doelwissel, terwijl poort (1) van
  `buildTestVoorstel` blokweek gelijk aan `BLOK_WEKEN` eist. Vermoeden — herkomst CHAT, NIET
  gemeten — dat een wissel het ijkaanbod drie weken onderdrukt, precies op het moment dat M90a het
  vraagt. TE METEN in de bouw-recon, niet aan te nemen.
- **PUNT 51 AANGEMAAKT EN VÓÓR 47 GEZET, als item 10 in *De volgorde*;** 47 en alles daarna schuift
  één op. GROND: rangorde-principe (2) — eerst het ontbrekende vangnet, zodat elke ronde daarna
  goedkoper is. Het punt draagt vier genummerde bouwstappen: de recon-subagent, de empirische
  rules-toets, de `CLAUDE.md`-herschrijving en de hooks. De volgorde is op RISICO gezet en niet op
  prijs.
- **DE TWEE RECON-DOCUMENTEN, met hun gepinde RAW URL.**
  `docs/PUNT47-RECON.md` op `18b749c4fbbb5086e0d1047002e8a2afb78ce811`:
  https://raw.githubusercontent.com/daanhhk/Cadans/18b749c4fbbb5086e0d1047002e8a2afb78ce811/docs/PUNT47-RECON.md
  `docs/GEREEDSCHAP-RECON.md` op `aca1cfc5f2720861b70101686c9bd1bac9a869c3`:
  https://raw.githubusercontent.com/daanhhk/Cadans/aca1cfc5f2720861b70101686c9bd1bac9a869c3/docs/GEREEDSCHAP-RECON.md
- **ZEVEN WERKWIJZE-REGELS ERBIJ** in `docs/WERKWIJZE.md`: de deliverable is een document en geen
  terminaluitvoer; een claim die aan een letterlijke string hangt draagt die string; een prompt is
  vraag, randvoorwaarde en deliverable en geen stappenlijst; verbatim krijgt een scope; de
  vertakking gaat vooraf mee met de verwachting erop; CC doet zijn eigen boekhouding; en de
  FOCUS-regel noemt het soort ronde. De derde AMENDEERT de bestaande regel dat een prompt een
  "stap-instructie" is — die ging over de VORM (Nederlands proza, geen script) en dat blijft staan.
- **VLOEREN NU: vitest-totaal 1010 over 78 bestanden · engine-selftest-assert-count 1772 ·
  lint-waarschuwingen 20.** Herkomst RECON `aca1cfc5`. Onbewogen: docs-only. Lees ze zelf uit de
  suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 47
  · 48 · 49 · 51.

FOCUS VOLGENDE CHAT: **BOUW-ronde — ROADMAP punt 51, stappen (1) en (2) in ÉÉN ronde.** De
recon-subagent in `.claude/agents/`, en de empirische toets of `.claude/rules/` met een
`paths`-frontmatter op versie `2.1.208` werkt. Die tweede is een TOETS en geen aanname: greppen
beantwoordt de vraag niet, want rules zijn bestand-gebaseerd en hun afwezigheid in het
settings-schema is de verwachte staat. Leg een weggooi-regel neer, raak een bestand op dat pad aan,
lees af. Werkt het niet, dan is de terugval een subdirectory-`CLAUDE.md`. Stappen (3) en (4) komen
daarna en elk apart — (4) pas ná een runtime-meting van de volle gate. CONTEXT: Daan is geopereerd
en fietst voorlopig niet, de beschikbaarheid blijft 0, de planner-week is leeg vanaf 2026-08-09 —
**dat is geen defect.** Er komt geen nieuwe ritdata binnen; elke meting draait op de bestaande
historie of op een fixture. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
