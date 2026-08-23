# Punt 51 stap (2) — verdict op `.claude/rules/`

Gemeten 23-08-2026 op `19fb462`, claude-versie `2.1.208 (Claude Code)` (opnieuw gelezen deze ronde;
gelijk aan wat `docs/GEREEDSCHAP-RECON.md` op `aca1cfc5` vond). Deze meting staat BEWUST in een
eigen document en niet als patch in `docs/GEREEDSCHAP-RECON.md`: dat document is gepind op zijn
eigen ronde, en een latere bevinding erin schrijven maakt de herkomst van beide onleesbaar. Wat daar
wel is bijgezet is één regel die hierheen wijst.

## Het verdict

**`.claude/rules/` MET EEN `paths`-FRONTMATTER IS EEN ONDERSTEUNDE, GEDOCUMENTEERDE FEATURE.** De
verwachting van de chat — dat het NIET zou werken en dat een geneste `CLAUDE.md` de terugval zou
worden — is daarmee OMVERGEWORPEN. Dat is de betere uitkomst, en hij verandert de vorm van stap (3):
doel-gescopeerde instructies hoeven niet allemaal naar skills of naar een tweede `CLAUDE.md`, want
er is een mechanisme dat per PAD laadt.

## Waarop dat rust — instrument 1, de officiële documentatie

`https://code.claude.com/docs/en/memory`, HTTP 200. De pagina draagt een eigen sectie *Organize
rules with `.claude/rules/`* met de subsecties *Set up rules*, *Path-specific rules*, *Share rules
across projects with symlinks* en *User-level rules*. Verbatim, de regels die het verdict dragen:

> For larger projects, you can organize instructions into multiple files using the `.claude/rules/`
> directory. This keeps instructions modular and easier for teams to maintain. Rules can also be
> scoped to specific file paths, so they only load into context when Claude works with matching
> files, reducing noise and saving context space.

> Rules load into context every session or when matching files are opened.

> Place markdown files in your project's `.claude/rules/` directory. Each file should cover one
> topic, with a descriptive filename like `testing.md` or `api-design.md`. All `.md` files are
> discovered recursively, so you can organize rules into subdirectories like `frontend/` or
> `backend/`

> Rules without `paths` frontmatter are loaded at launch with the same priority as
> `.claude/CLAUDE.md`.

> Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These
> conditional rules only apply when Claude is working with files matching the specified patterns.

> Rules without a `paths` field are loaded unconditionally and apply to all files. Path-scoped rules
> trigger when Claude reads files matching the pattern, not on every tool use.

De vorm die de documentatie voorschrijft, verbatim:

```
---
paths:
  - "src/api/**/*.ts"
---
```

En de glob-vormen die zij noemt: `**/*.ts` voor alle TypeScript-bestanden, `src/**/*` voor alles
onder een map, `*.md` in de projectroot, en brace-expansie zoals `"src/**/*.{ts,tsx}"`. Er geldt een
begrenzing: *"a rule's whole `paths` list shares one budget of 1,000 expanded patterns and 4 MiB"*.

**TWEE VERSIE-AFHANKELIJKHEDEN, en ze staan er letterlijk:**

> Project rules are skipped if you exclude `project` from `--setting-sources`. Before v2.1.211,
> rules that load on demand, including path-scoped rules and rules in nested `.claude/rules/`
> directories, loaded even when `project` was excluded.

> As of v2.1.198, matching also works when Claude reaches a file through a symlinked path to the
> project directory, for example in a symlinked checkout.

Deze machine draait `2.1.208`. Dat is NÁ `2.1.198` (symlink-matching geldt dus) en VÓÓR `2.1.211`
(de `--setting-sources`-uitsluiting bijt hier nog niet op on-demand-regels). Geen van beide raakt de
vraag of het mechanisme werkt; ze zijn genoteerd omdat een versiesprong ze wél kan raken en dit
document dan herijkt hoort te worden.

## Waarom de eerdere conclusie te ver ging

`docs/GEREEDSCHAP-RECON.md` §5 schreef: *"Path-scoped rules in `.claude/rules/`: NIET VASTGESTELD,
en waarschijnlijk niet de juiste vorm."* De GROND onder die zin was correct — het settings-schema
draagt geen top-level `rules`-sleutel, en `claude --help` noemt het woord niet — maar de CONCLUSIE
die eraan werd geknoopt niet. Regels zijn BESTAND-gebaseerd; hun afwezigheid in een
settings-schema is de verwachte staat en weerlegt niets. Punt 51 stap (2) noteerde die redenering
al expliciet, en zij is hier bevestigd: het schema zei niets, de documentatie zei alles.

DE LES DIE HIERONDER LIGT is dezelfde als bij het rules-schema zelf: *"niet gemeten" en "gemeten
als afwezig" zijn twee antwoorden.* §5 zei "NIET VASTGESTELD" en voegde er toen een vermoeden aan
toe ("waarschijnlijk niet de juiste vorm") dat als half-antwoord ging leven. Het vermoeden had
buiten de zin moeten blijven, of als expliciet vermoeden gelabeld.

## Wat NIET is vastgesteld — instrument 2 en 3

**DE EMPIRISCHE AFLEZING IS INCOMPLEET, NIET NEGATIEF.** Er is een weggooi-regel neergelegd op
`.claude/rules/_wegwerp-probe.md` met `paths: ["packages/engine/src/zones.ts"]` en de merkstring
`RULESTOETS-MERKSTRING-Q7V2XK`, waarna dat bestand is gelezen. **De merkstring verscheen NIET in de
context.** Dat is om drie redenen geen tegenbewijs:

1. **DE REGISTRY IS BEVROREN BIJ SESSIESTART, en dat is deze ronde GEMETEN — niet aangenomen.** Bij
   stap (1) is `.claude/agents/recon.md` aangemaakt en daarna aangeroepen; de Agent-tool antwoordde
   verbatim: `Agent type 'recon' not found. Available agents: claude, claude-code-guide, Explore,
   general-purpose, Plan, statusline-setup`. De map `.claude/agents/` bestond niet toen deze sessie
   startte, en werd niet alsnog ontdekt. `.claude/rules/` bestond evenmin. De meest waarschijnlijke
   verklaring voor de ontbrekende merkstring is dus dat de MAP nooit gescand is, en niet dat het
   mechanisme faalt.
2. **NIET-GELADEN EN GELADEN-MAAR-GENEGEERD ZIJN NIET TE SCHEIDEN** vanuit een uitblijvende
   merkstring. Een merkstring die verschijnt bewijst laden; een merkstring die uitblijft bewijst
   niets.
3. **DE VERSE-SESSIE-ROUTE WAS NIET BESCHIKBAAR.** `claude -p` in dezelfde bash-aanroep gaf
   verbatim: `Failed to authenticate: OAuth session expired and could not be refreshed`. Een
   geneste sessie kan hier dus niet openen, en dat is de enige route die de laadmachinerie werkelijk
   zou meten.

**DE AFLEZING VERSCHUIFT DAARMEE NAAR DE OPENING VAN DE VOLGENDE RONDE.** Die opent per definitie
een verse sessie, en de map bestaat dan al. Concreet: leg vóór die ronde een regel neer met een
merkstring en een `paths`-scope, en laat de openende sessie een bestand op dat pad lezen. Verschijnt
de merkstring, dan is het rond; verschijnt hij niet, dan is dát pas een negatieve uitslag.

## Wat dit betekent voor punt 51

- **STAP (2) IS BEANTWOORD op de vraag "bestaat en werkt het".** Wat rest is de empirische
  bevestiging hierboven, en die is een aflezing van één merkstring — geen ronde.
- **DE TERUGVAL IS NIET NODIG.** Een geneste `CLAUDE.md` blijft mogelijk maar is niet langer het
  vermoedelijke eindstation. `.claude/rules/` is de vorm die de documentatie voorschrijft, met
  `paths`-frontmatter voor de gescopeerde regels.
- **DE TWEE DOELEN UIT STAP (2) ZIJN NU CONCREET TE SCHRIJVEN.** `packages/engine` (autorisatie
  vereist) scoopt op `packages/engine/**`; de append-only nummering van `docs/TRAININGSMODEL.md`
  scoopt op dat ene bestand. Let op de documentatie-eigenschap dat path-scoped regels vuren wanneer
  Claude een MATCHEND BESTAND LEEST — een engine-regel bijt dus zodra de engine gelezen wordt, en
  niet pas bij een schrijfpoging. Voor een harde grens blijft een `PreToolUse`-deny nodig; een regel
  informeert, hij blokkeert niet.
- **STAP (3) VERANDERT VAN VORM.** De procedures uit `CLAUDE.md` hoeven niet allemaal naar skills:
  wat pad-gebonden is kan naar `.claude/rules/` met een `paths`-scope, en alleen wat taak-gebonden
  is hoort in een skill. De documentatie zegt dat verschil zelf: *"For task-specific instructions
  that don't need to be in context all the time, use skills instead, which only load when you invoke
  them or when Claude determines they're relevant to your prompt."* Dat is een scherpere knip dan
  "procedures naar skills", en hij scheelt in stap (3) juist het herschrijfwerk waar dat punt voor
  waarschuwde.

<!-- EINDE docs/PUNT51-RULES-VERDICT.md -->
