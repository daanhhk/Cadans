# CLAUDE.md — Cadans

Instructies voor Claude Code in deze repo. Chat-Claude is architect en schrijft de prompts; jij voert uit.
De volledige werkwijze staat in `docs/WERKWIJZE.md` — bij tegenspraak wint dat document.

## De procesdocumenten staan aan JOUW kant

Sinds 21-08-2026 haalt de opener van chat-Claude ze niet meer op. Hij leest alleen `HANDOFF.md`,
`docs/ARCHITECTUUR.md`, `docs/TRAININGSMODEL.md` en `docs/DOELEN-SPEC.md`. De werkwijze, de lessen
en de controles draag JIJ: `docs/WERKWIJZE.md`, `docs/WERKWIJZE-LESSEN.md`,
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` en `docs/CC-CHECKS.md`.

**Je leidt je eigen CONDITIE af.** Niet de chat. Kijk naar wat de ronde werkelijk doet en bepaal
welke van de zes gelden — ALTIJD, METING, HARNESS, DEPLOY, COMMIT, ENGINE. ALTIJD geldt zonder
uitzondering; de andere vijf gelden zodra de ronde die soort werk raakt. Een ronde draagt er vaak
meer dan één.

**Je draait de bijbehorende checks uit `docs/CC-CHECKS.md`** en meldt in het rapport WELKE condities
golden en WELKE checks je gedraaid hebt. Schrijft een prompt een conditie voor, dan is dat hoogstens
een aanwijzing: klopt hij niet met wat de ronde doet, dan volg je je eigen afleiding en meld je dat
als afwijking. Een lijst die de uitvoerder krijgt aangereikt mist precies de check waar de opsteller
niet aan dacht.

**Vraagt de chat om een regel, citeer hem dan VERBATIM** met zijn vindplaats erbij, en vat hem niet
samen. De chat heeft die tekst niet meer; een parafrase wordt daar de nieuwe regel.

## Harde grenzen

- **Nooit schrijven** in `C:\Users\daan\Projects\training` — de oude, nog live Apps-Script-app, bevroren op HEAD `3e8090a`. Read-only lezen voor recon mag. Elk rapport bevestigt: training onaangeroerd, HEAD `3e8090a`.
- **`packages/engine` is bron van waarheid.** Niet wijzigen tenzij de prompt dat expliciet autoriseert. Een echte engine-bug: **flaggen en stoppen**, niet stilzwijgend patchen. Nooit de engine aanpassen om een test groen te forceren.
- **Prod is approval-gated.** Geen `wrangler deploy` en geen remote-D1-mutatie zonder expliciete stap in de prompt. Deploy = `wrangler deploy` **vanuit `workers/api`** (niet `pnpm deploy`), en **altijd `pnpm build` ervoor** — de assets-binding wijst naar `apps/web/dist`. Migratie eerst, dan deploy.
- **Secrets nooit** in een rapport of in de chat; verwijs alleen naar de NAAM (bv. `INTERVALS_API_KEY`). `database_id` is geen secret.

## GAS-bron lezen (parity)

De bevroren referentie staat lokaal op `C:\Users\daan\Projects\training` (read-only). Lees die **van schijf** met `Get-Content` en grep — **nooit via WebFetch**. WebFetch levert een lossy parafrase en heeft al twee misreads gekost.

## Gate

Geen commit op rood. Volledig: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Plus CI groen, opgehaald via de publieke GitHub REST API (`gh` is niet geïnstalleerd).
De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren. **Lees ze uit de suite** — hardcode ze niet.

## Commits

- Engels voor code, commit messages en logging; Nederlands voor UI-strings.
- Eén onderwerp per commit; samenhangende changes mogen gebundeld — geen geforceerde splits.
- De HANDOFF-close-out is **altijd een aparte docs-only commit**, nooit gebundeld met code.

## Rapport

Platte tekst. **Geen code-fences en geen tabellen** — Daan kopieert het op zijn telefoon. Ongeveer 200 woorden; literals (bestandsnamen, functienamen, commit-hashes, URL's, aantallen) tellen niet mee en geef je exact.

Bevat altijd: commit-hash; de gepinde RAW HANDOFF-URL op die hash (`https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/HANDOFF.md`); gate-uitslag; CI-conclusie met run-URL; bij een code-wijziging een lege `git diff --stat` op `packages/engine`; bevestiging dat training onaangeroerd is (HEAD `3e8090a`); en **elke afwijking van de prompt**.

## Afwijken mag — melden is verplicht

Zie je een betere aanpak, een fout in de prompt, of moet je iets doen wat er niet in staat: doe het als het duidelijk juist is en **meld het expliciet in het rapport**. Is het risicovol of raakt het een harde grens: **stop en meld**. Eerlijke afwijkingen zijn meermaals waardevoller gebleken dan de prompt zelf.

## Visuele verificatie

Die kun je zelf doen. `tools/shots/shot.mjs` seedt de LOKALE D1 via de API, pint de browser-klok en schiet de weekkaart plus alle zeven dagkaarten weg als PNG, met een `.txt` ernaast (console-errors mét falende URL, request-telling, innerText). Je leest die PNG's zelf terug. Draaien: zie `tools/shots/README.md`.

Twee regels die erbij horen: de klok is **ook in de browser** een fixture-variabele (`page.clock.setFixedTime`, vóór de eerste `goto`), en de app is `height: 100dvh` met een eigen scrollende `main` — een `fullPage`-shot snijdt af, dus de viewport gaat op de gemeten scrollhoogte.

**Je beoordeelt de shot zelf.** Per verwachting één UITSPRAAK: klopt, klopt niet, of niet toetsbaar op dit geval. Beschrijven wat je ziet is niet genoeg — dan velt Daan alsnog het oordeel, en dat is precies het werk dat de harness overneemt. Bevat het geval de situatie niet, dan is het "niet toetsbaar", nooit "klopt".

Kun je iets niet uit de PNG vaststellen, zeg dan **expliciet wat Daan moet openen, op welk scherm, en waar hij precies naar kijkt**. Dat is de enige route naar hem toe.

Read-only tegen prod mag: geef `tools/shots/shot.mjs` een doel-URL mee — geen seed, geen backup, geen enkele schrijf-aanroep.

## Dev-omgeving

Twee losse processen: `apps/web` → `vite` (poort 5173, open op het LAN) en `workers/api` → `wrangler dev --port 8787` (lokale D1, nooit remote). Vite proxyt `/api` naar `127.0.0.1:8787`; draait de Worker niet, dan toont de app HTTP 502 terwijl de shell gewoon laadt.
