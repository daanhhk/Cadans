# Het CC-harnas — recon

Read-only gemeten op `18b749c`, werkboom schoon. De vraag: wat draagt deze repo vandaag aan
CC-harnas, en wat kost dat elke sessie aan context. Per antwoord de vindplaats en de bronregels
waarop het rust.

De verwachting stond op drie punten. **Eén ervan is GEVALLEN**, en die staat daarom bovenaan.

## 0. GEVALLEN — de gate hangt NIET volledig aan instructies

De verwachting was dat er geen hooks draaien én dat de hele gate aan instructies hangt. De eerste
helft klopt; de tweede niet. Alle vier de gate-stappen draaien **geautomatiseerd in CI**, in
`.github/workflows/ci.yml`:

```
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

Dat is een echte automatisering en geen instructie. Wat wél aan een instructie hangt is de
VOLGORDE-eis — dat de gate vóór de commit draait en dat er geen commit op rood komt. CI draait ná
de push en kan een rode commit niet tegenhouden, alleen melden. De precieze formulering van het
gat: **niet "de gate is niet geautomatiseerd", maar "de gate is niet BLOKKEREND".** Er is geen
pre-commit-hook (`.husky` bestaat niet, `.git/hooks/` draagt alleen `.sample`-bestanden) en geen
`PreToolUse`-hook op `git commit`.

De twee andere verwachtingen HIELDEN: CLAUDE.md draagt feiten en procedures door elkaar (§2), en
de vier procesdocumenten worden geen van alle automatisch geladen — wat wél laadt is nergens in de
repo vastgelegd (§3).

## 1. Wat staat er in `.claude/`

Drie bestanden, geen enkele map.

```
-rw-r--r-- 1 daan 197609   391 Aug  6 10:08 launch.json
-rw-r--r-- 1 daan 197609  2006 Jul  8 09:17 settings.json
-rw-r--r-- 1 daan 197609 47878 Aug 22 17:09 settings.local.json
```

`git ls-files .claude` geeft twee bestanden: `.claude/launch.json` en `.claude/settings.json`.
`settings.local.json` is dus NIET getrackt, en hij is ook echt GENEGEERD — maar niet door de
`.gitignore` van deze repo. `git check-ignore -v` wijst de regel aan:

```
"C:\\Users\\daan/.config/git/ignore":3:**/.claude/settings.local.json	.claude/settings.local.json
```

De uitsluiting staat dus in de GLOBALE git-ignore van deze machine, niet in de repo. Dat telt voor
punt 51: op een andere machine, of bij een verse kloon zonder die globale configuratie, zou
`git add -A` dit bestand van 47878 bytes gewoon meenemen. Een regel in de repo-eigen `.gitignore`
zou dat per constructie afvangen; vandaag hangt het aan een machine-instelling.

**`settings.json` (2006 bytes, getrackt).** Draagt uitsluitend `permissions`, met
`defaultMode: "acceptEdits"`, 51 `allow`-regels en 6 `deny`-regels. De deny-lijst is de enige
plek waar een harde grens machinaal is afgedwongen:

```
    "deny": [
      "Edit(C:\\Users\\daan\\Projects\\training\\**)",
      "Write(C:\\Users\\daan\\Projects\\training\\**)",
      "Edit(../training/**)",
      "Write(../training/**)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)"
    ]
```

De training-grens uit `CLAUDE.md` staat hier dus ECHT als deny-regel. De engine-grens niet:
`packages/engine` komt in `settings.json` niet voor.

**`settings.local.json` (47878 bytes, untracked).** Draagt één sleutel, `permissions`, met alleen
een `allow`-lijst van **442 regels**. Geen `deny`, geen `hooks`. Dit bestand is per machine en per
sessie aangegroeid en is bijna 24 keer zo groot als het getrackte `settings.json`.

**`launch.json` (391 bytes, getrackt).** Twee dev-server-configuraties, `web` op poort 5173 en
`api` op poort 8787 — dezelfde twee die `CLAUDE.md` §Dev-omgeving in proza beschrijft.

**Mappen: geen.** `rules`, `skills`, `agents`, `commands`, `hooks` en `output-styles` bestaan geen
van alle onder `.claude/`. Op gebruikersniveau bestaat `~/.claude/skills/` wél, met tien
plugin-skills (`cloudflare`, `workers-best-practices`, `web-perf`, …) — geen daarvan is van dit
project.

## 2. `CLAUDE.md` — omvang en de scheiding feiten / procedures

**73 regels, 5801 bytes, negen secties.** Per sectie:

```
(kop)                                           5 regels   223 bytes
## De procesdocumenten staan aan JOUW kant     20 regels  1251 bytes
## Harde grenzen                                6 regels   893 bytes
## GAS-bron lezen (parity)                      3 regels   236 bytes
## Gate                                         4 regels   355 bytes
## Commits                                      5 regels   266 bytes
## Rapport                                      5 regels   569 bytes
## Afwijken mag — melden is verplicht           3 regels   314 bytes
## Visuele verificatie                         11 regels  1226 bytes
## Dev-omgeving                                 2 regels   272 bytes
```

**DE VERWACHTING HIELD: feiten en procedures staan door elkaar, en op sectieniveau is de scheiding
niet te maken — vijf van de negen secties dragen ALLEBEI.**

FEITEN, die altijd gelden en die een sessie nodig heeft om iets te kunnen doen:

- `## Dev-omgeving` (272 bytes) — twee processen, twee poorten, de vite-proxy naar 127.0.0.1:8787.
  Volledig feit. Dubbelt bovendien met `.claude/launch.json`, dat dezelfde twee servers machinaal
  declareert.
- `## Gate`, de vier commando's — `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build`. Feit. Dubbelt met `.github/workflows/ci.yml`.
- `## GAS-bron lezen (parity)` (236 bytes) — waar de bevroren bron staat en dat hij van schijf
  gelezen wordt. Feit plus één methode-verbod.
- `## Commits`, de eerste twee bullets — Engels voor code, Nederlands voor UI-strings; één
  onderwerp per commit. Conventie, dus feit.
- Uit `## Harde grenzen`: het pad van de bevroren app plus zijn HEAD `3e8090a`, en dat
  `database_id` geen secret is. Feit.

PROCEDURES, die zeggen hoe een RONDE loopt:

- `## De procesdocumenten staan aan JOUW kant` (1251 bytes, de grootste sectie) — volledig
  procedure: welke documenten CC draagt, dat CC zijn eigen conditie afleidt, dat hij de
  bijbehorende checks draait en meldt welke, en dat een regel op verzoek VERBATIM geciteerd wordt.
- `## Rapport` (569 bytes) — vorm: platte tekst, geen code-fences, geen tabellen, circa 200
  woorden, en de verplichte inhoud.
- `## Afwijken mag — melden is verplicht` (314 bytes) — gedragsregel.
- Uit `## Gate`: "Geen commit op rood" en het lezen van de vloeren uit de suite.
- Uit `## Commits`: dat de HANDOFF-close-out altijd een aparte docs-only commit is.
- Uit `## Visuele verificatie` (1226 bytes): dat CC de shot zelf beoordeelt met per verwachting
  één UITSPRAAK, en wat hij moet zeggen als iets niet uit de PNG volgt. De eerste helft van die
  sectie — waar `tools/shots/shot.mjs` staat en de twee klok- en viewport-regels — is feit.

Ruwweg: **circa 2600 bytes feit tegen circa 3200 bytes procedure**, en de twee grootste secties
(`De procesdocumenten` en `Visuele verificatie`) staan aan weerszijden van die scheiding zonder
dat de kop dat verraadt.

## 3. Wat laadt een sessie automatisch, en wat kost dat

**Automatisch geladen, elke sessie:**

- `CLAUDE.md` — **5801 bytes**. Vindplaats van het bewijs: het staat in de systeemcontext van deze
  sessie, geëtiketteerd als "project instructions, checked into the codebase". De CLI bevestigt
  het mechanisme: `claude --help` beschrijft bij `--bare` dat die vlag onder meer "CLAUDE.md
  auto-discovery" uitzet.
- De auto-memory van dit project — `MEMORY.md` (157 bytes) plus één memory-bestand (1145 bytes),
  in `~/.claude/projects/C--Users-daan-Projects-cadans/memory/`. Samen **1302 bytes**. Ook
  zichtbaar in de systeemcontext van deze sessie; `--bare` noemt "auto-memory" als aparte
  uitschakelbare laag.

**Totaal automatisch: 7103 bytes.**

**NIET automatisch geladen — geen van de vier procesdocumenten:**

```
 38125 docs/WERKWIJZE.md
 67447 docs/WERKWIJZE-LESSEN.md
 50195 docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md
 17389 docs/CC-CHECKS.md
```

Samen **173156 bytes**, oftewel 24 keer het automatisch geladen deel. Alle vier komen alleen in
context wanneer CC ze expliciet leest. `CLAUDE.md` draagt ze op als CC-eigendom —

```
De volledige werkwijze staat in `docs/WERKWIJZE.md` — bij tegenspraak wint dat document.
```

```
De werkwijze, de lessen
en de controles draagt JIJ: `docs/WERKWIJZE.md`, `docs/WERKWIJZE-LESSEN.md`,
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` en `docs/CC-CHECKS.md`.
```

— maar er staat nergens dat ze automatisch geladen worden, en dat gebeurt ook niet. **DE
VERWACHTING HIELD, en scherper dan gesteld: het is niet "niet alle vier", het is GEEN VAN VIER.**
In de praktijk is `docs/CC-CHECKS.md` (17389 bytes) het enige dat elke ronde wél gelezen wordt,
omdat elk prompt daarom vraagt; de andere drie worden zelden of nooit geopend. Dat verschil is
nergens vastgelegd — niet in `CLAUDE.md`, niet in `.claude/settings.json`, nergens in de repo.

DE KOSTEN, eerlijk gesteld: de 173156 bytes zijn GEEN vaste sessiekosten, want ze laden niet
vanzelf. De kosten zijn een RISICO in plaats van een prijs — een regel die CC draagt maar niet
leest, werkt niet. Dat is precies wat `docs/CC-CHECKS.md` heeft opgelost voor de mechanische helft
van `WERKWIJZE-LESSEN`, en wat voor de andere twee documenten open staat.

## 4. Hooks, en wat aan een instructie hangt

**Er draaien GEEN hooks.** Bewijs: `grep -c hooks` geeft 0 op zowel `.claude/settings.json` als
`.claude/settings.local.json`, `~/.claude/settings.json` bevat er evenmin, en `.claude/hooks/`
bestaat niet. Ook geen git-hooks: `.husky` bestaat niet en `.git/hooks/` bevat uitsluitend
`.sample`-bestanden.

**Wat aan een instructie hangt in plaats van aan automatisering** — zie ook §0 voor de correctie:

| wat | vandaag geborgd door | machinaal afdwingbaar? |
| --- | --- | --- |
| training read-only | `.claude/settings.json` deny-regels | JA, al gedaan |
| `git push --force` | `.claude/settings.json` deny-regels | JA, al gedaan |
| `packages/engine` niet wijzigen zonder autorisatie | uitsluitend proza in `CLAUDE.md` | ja, niet gedaan |
| gate vóór de commit, geen commit op rood | uitsluitend proza in `CLAUDE.md` | ja, niet gedaan |
| append-only nummering in `TRAININGSMODEL.md` | uitsluitend proza in het prompt | ja, niet gedaan |
| conditie afleiden en checks draaien | uitsluitend proza in `CLAUDE.md` | deels |
| rapportvorm | uitsluitend proza in `CLAUDE.md` | nee |

De gate zelf draait wél geautomatiseerd, maar ná de push (§0). Van de vier stappen is er dus geen
enkele die een foute commit lokaal tegenhoudt.

## 5. Claude-versie en featureondersteuning

**Versie: `2.1.208 (Claude Code)`**, uit `claude --version`.

Vastgesteld uit de eigen CLI-hulp en het gepubliceerde settings-schema
(`https://json.schemastore.org/claude-code-settings.json`, HTTP 200, 230217 bytes — het schema dat
`.claude/settings.json` zelf in zijn `$schema`-veld aanwijst), niet uit geheugen:

- **Hooks in `settings.json`: ONDERSTEUND.** Het schema draagt een top-level sleutel `hooks`, met
  de beschrijving *"Lifecycle event hooks that run at configurable points during Claude Code
  operation (tool use, session start/end, notifications, prompt submit, message display, and
  more)"*. De 31 gedefinieerde events omvatten `PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
  `PermissionRequest`, `UserPromptSubmit`, `Stop`, `SessionStart`, `SessionEnd`, `PreCompact`,
  `InstructionsLoaded` en `FileChanged`. Er is ook een `disableAllHooks`-sleutel. `claude --help`
  bevestigt het bestaan langs twee kanten: `--bare` "skip hooks" en `--safe-mode` noemt hooks in
  de lijst uitschakelbare customizations.
- **Subagents: ONDERSTEUND.** `claude --help` draagt `--agents <json>` ("JSON object defining
  custom agents") en het schema draagt `agent` ("Name of an agent (built-in or custom) to use for
  the main thread. Applies the agent's system prompt, tool restrictions, and model"). Dat
  definities uit `.claude/agents/*.md` komen staat in de Agent-tool-beschrijving van deze sessie:
  *"Each agent type's model, reasoning effort, and tools come from its definition
  (`.claude/agents/*.md` frontmatter or SDK `agents`)"*.
- **Skills: ONDERSTEUND.** Het schema draagt `skillOverrides` en `disableBundledSkills`;
  `claude --help` zegt bij `--bare` dat "Skills still resolve via /skill-name" en `--safe-mode`
  noemt skills. De conventie van een skills-MAP is op deze machine direct waarneembaar:
  `~/.claude/skills/` bestaat met tien skills. Dat `.claude/skills/` op projectniveau de
  tegenhanger is, volgt uit de Skill-tool-beschrijving van deze sessie, die
  directory-gescopeerde skills noemt (`apps/web:deploy`) — maar het exacte projectpad is in DEZE
  ronde niet uit de documentatie bevestigd.
- **Path-scoped rules in `.claude/rules/`: NIET VASTGESTELD, en waarschijnlijk niet de juiste
  vorm.** Het woord `rules` komt in `claude --help` niet voor, en het settings-schema heeft geen
  top-level `rules`-sleutel (142 sleutels gecontroleerd). Wat het schema WEL draagt is
  `claudeMdExcludes`, met de beschrijving *"Glob patterns for CLAUDE.md files to exclude from
  loading. Useful in monorepos to skip irrelevant instructions from other teams. Patterns match
  against absolute file paths."* Dat impliceert het tegendeel-mechanisme: er worden MEERDERE
  CLAUDE.md-bestanden ontdekt en geladen, per pad. **De path-scoped vorm die deze repo kan
  gebruiken is dus een geneste `CLAUDE.md`** — bijvoorbeeld `packages/engine/CLAUDE.md` — en niet
  een `rules`-map. Wie het tegendeel wil bouwen, verifieert dat eerst tegen de actuele
  documentatie op `https://code.claude.com/docs/en/`.

<!-- EINDE docs/GEREEDSCHAP-RECON.md -->
