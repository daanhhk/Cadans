# CLAUDE.md — Cadans

Instructies voor Claude Code in deze repo. Chat-Claude is architect en schrijft de prompts; jij voert uit.
De volledige werkwijze staat in `docs/WERKWIJZE.md` — bij tegenspraak wint dat document.

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

## Wat je niet kunt

Visuele verificatie — er is geen visual-harness (bewust geparkeerde debt). Daans oog gate't de deploy, niet de commit.

## Dev-omgeving

Twee losse processen: `apps/web` → `vite` (poort 5173, open op het LAN) en `workers/api` → `wrangler dev --port 8787` (lokale D1, nooit remote). Vite proxyt `/api` naar `127.0.0.1:8787`; draait de Worker niet, dan toont de app HTTP 502 terwijl de shell gewoon laadt.
