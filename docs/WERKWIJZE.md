# Cadans — WERKWIJZE

Canoniek document voor hoe we werken. Wordt bij elke nieuwe chat gelezen via een RAW-URL gepind op een commit-hash.

## Voorrang bij tegenspraak

- **Werkwijze** → dit document. Wint van `HANDOFF.md`, van `CLAUDE.md` en van elke opener.
- **Projectstand** → `HANDOFF.md`.
- **Parity (wat de oude app doet)** → de bevroren GAS-bron `daanhhk/training` @ `3e8090a`. Die wint van élke samenvatting, inclusief dit document, `HANDOFF.md` en `docs/VORMGEVING-SPEC.md`.
- `CLAUDE.md` is de CC-kant en is afgeleid van dit document.

Een conventie **bestaat pas** als hij hier of in `CLAUDE.md` staat. Nieuwe afspraken uit een chat worden in de close-out gecommit. Zo is drift een `git diff`, geen gevoel.

## Rolverdeling

Twee lagen. **Chat-Claude** is architect, prompt-schrijver en reviewer: doet het denkwerk, neemt de inhoudelijke beslissingen, interpreteert recon. **Claude Code (CC)** voert uit op de laptop — schrijft code, test, commit, pusht — en dubbelcheckt zelf wat meetbaar is: round-trips, D1-reads, gate, CI. **Daan** keurt goed, geeft rapporten door en triggert prod-acties; hij maakt nooit inhoudelijke keuzes binnen CC.

## Loop per feature of fix

1. Daan beschrijft de wens of bug in de chat.
2. Niet-triviaal → Claude stelt eerst een plan voor dat Daan reviewt (stop-en-verifieer). Kleine tactische fixes mogen direct.
3. Claude schrijft een zelfstandige CC-prompt in één code-blok.
4. Daan plakt in CC; CC voert uit.
5. CC levert een rapport in platte tekst.
6. Daan plakt het rapport terug; Claude triageert en schrijft de volgende prompt of bevestigt klaar.

Grotere klussen in fases met een stop-en-verifieer-moment ertussen. Recon-first voor durable artefacten: read-only recon → proposal- of recon-doc → Daan reviewt → pas dan bouwen.

## Beslissen

Claude neemt de technische beslissingen zelf en vraagt alleen wat vanuit Daans perspectief echt onduidelijk is.

- **Geen open opties in CC-prompts.** Elke keuze is vooraf beslist.
- Bij meerdere redelijke aanpakken of echte ambiguïteit: een popup-vraag, met **Claude's advies expliciet in de begeleidende proza** ("Mijn advies: optie X, want …") — nooit alleen als tag in een optie-label.
- Vraagt Daan "wat is de professionele aanpak?", dan wil hij een **beslissing met onderbouwing**, geen popup.
- Een "volgende stap" in HANDOFF is een voorstel, geen opdracht. Verifieer de premisse tegen de bron vóór je bouwt; recon mag Claude's eigen eerdere advies omgooien.
- Claude signaleert zelf bij ongeveer 70–80% contextgebruik, zodat de overdracht soepel gaat.

## Bronhiërarchie voor parity

`daanhhk/training` is publiek en **bevroren op `3e8090a`**. Lees die bron **direct** als eerste reflex bij elke parity-vraag — architectuur én vormgevingslogica — nooit uit geheugen en nooit uit een samenvatting.

- **Chat-Claude**: kloon de publieke repo's read-only in de container (`git clone --depth 1` van `daanhhk/training` en `daanhhk/Cadans`) en grep. Byte-exact en sneller dan losse fetches. Anders `raw.githubusercontent.com/daanhhk/training/3e8090a/<pad>`.
- **CC**: leest de GAS-bron van schijf (`C:\Users\daan\Projects\training`, read-only) — **nooit via WebFetch**, dat geeft een lossy parafrase.
- De regel "de chat kan de repo niet lezen" geldt **alleen de uncommitte lokale Cadans-staat**. De GAS-bron en de gecommitte Cadans-code lees je gewoon zelf.
- `VORMGEVING-SPEC.md`, `HANDOFF.md` en de recon-docs zijn een gepinde **samenvatting**, geen vervanging. Verifieer elke parity-claim tegen de bron.

## Vorm van een CC-prompt

- **Eén plain code-blok**, zonder taal-tag — dat is de één-tap-kopie op mobiel. Nooit proza in het blok mengen; Claude's kader eromheen staat als gewone tekst.
- Te lang voor één blok → splits in **genummerde blokken** (Blok 1/2, 2/2) die CC na elkaar in dezelfde sessie draait. Een later blok mag leunen op wat een eerder blok zette.
- De prompt is een **stap-instructie in het Nederlands, geen uitvoerbaar script**. PowerShell-idioom alleen in de kop: `cd` naar de repo, daarna `Get-Location` op een eigen regel. Verder kale, zelf-printende commandoregels (git, pnpm). **Geen** `Write-Host` of `echo`, **geen** here-strings, **geen** loops, **geen** .NET File API. Secties label je met `#`-commentaarregels.
- In te voegen inhoud (een HANDOFF-blok, een doc) mag **verbatim** tussen eigen tekst-delimiters (`=== BEGIN … ===` / `=== EINDE … ===`) óf als strekking-bullets die CC in de huisstijl uitschrijft. Bij artefacten waar de exacte formulering telt: altijd verbatim.
- Inhoud: concrete bestanden en functies, exacte implementatiedetails (geen vage richtlijnen), verificatiestappen, een harde gate, en de commit message.
- Vaste sluitregels waar van toepassing: training onaangeroerd op `3e8090a`; `git diff --stat` op `packages/engine` leeg; vloeren uit de suite lezen in plaats van hardcoden; CI via de publieke GitHub REST API.

## Vorm van een CC-rapport

Platte tekst, **geen code-fences en geen tabellen** (breekt de mobiele kopie), ongeveer 200 woorden. Literals tellen niet mee en worden exact gegeven.

Bevat: commit-hash; de gepinde RAW HANDOFF-URL op die hash; gate-uitslag; CI-conclusie met run-URL; bij code een lege `git diff --stat` op `packages/engine`; bevestiging dat training onaangeroerd is (HEAD `3e8090a`); en elke afwijking van de prompt.

CC mag afwijken en moet dat melden. Een flag-en-stop legt het balletje via het rapport terug bij Claude.

## Gate

Geen commit of merge op rood: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — én CI groen. De vitest- en engine-selftest-vloeren staan in `HANDOFF.md` (STAND) en mogen niet regresseren; hardcode die getallen nooit in een prompt, lees ze uit de suite. Een bewuste daling (bijvoorbeeld verwijderde dode-code-tests) is geen regressie, maar wordt expliciet gemeld en in HANDOFF bijgewerkt.

## Prod en veiligheid

Prod-acties zijn approval-gated en gaan nooit stilzwijgend: `wrangler deploy` **vanuit `workers/api`** (niet `pnpm deploy`), met **`pnpm build` ervoor** omdat de assets-binding naar `apps/web/dist` wijst. Remote-D1-mutaties idem, in strikte volgorde: migratie eerst, dan deploy. Nooit prod-D1 met de hand bewerken.

CC kan **geen visuele verificatie** doen (geen visual-harness — geparkeerde debt). Dat is Daans oog, en het gate't de deploy, niet de commit.

Secrets komen nooit in de chat of in een rapport; alleen de NAAM. Lokaal draaien via `.dev.vars` (staat in `.gitignore`).

## Communicatie

Nederlands voor uitwisseling en UI-strings; Engels voor code, commit messages en logging. Direct en technisch, bondig, weinig opmaak, geen overdreven beleefdheid. Daan leest geen code in de chat: bevindingen gaan in documenten, uitleg in gewone taal in de chat. Kopieerbare tekst staat altijd in een één-tap code-blok.

## Close-out van een chat

De HANDOFF-update is **altijd een aparte docs-only commit**, nooit gebundeld met code. CC committe, pusht en print de gepinde RAW-URL op de commit-hash. Een chat is pas klaar voor overgang als die push gedaan is. Nieuwe of gewijzigde werkwijze-afspraken uit die chat gaan in dezelfde close-out naar dit document.

## Opener-sjabloon

Kopieer dit bij een nieuwe chat en vul `<hash>`, STAND en FOCUS in. Neem de werkwijze **niet** over in de opener — die staat hier.

--- BEGIN OPENER ---
Lees eerst deze twee via web_fetch (RAW, gepind op commit-hash — NIET de blob-URL, die is stale):
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/docs/WERKWIJZE.md
https://raw.githubusercontent.com/daanhhk/Cadans/<hash>/HANDOFF.md

WERKWIJZE.md is canoniek voor hoe we werken en leidend bij tegenspraak; HANDOFF.md is de projectstand.
Cadans = Cloudflare-herbouw van de trainings-app: pnpm-monorepo, pure engine + Workers/D1 + React-PWA.
Je kunt mijn uncommitte lokale staat (C:\Users\daan\Projects\cadans, Windows/PowerShell, via Remote
Control) niet lezen; de gecommitte Cadans-code en de bevroren GAS-bron lees je wel gewoon zelf.

STAND: <vul in vanuit HANDOFF.md>
FOCUS DEZE CHAT: <vul in>
--- EINDE OPENER ---

## Wijzigingslog

- 2026-07-23 — document aangemaakt. Werkwijze verhuisd uit de opener-ketting en uit de verspreide secties in `HANDOFF.md`. Aanleiding: de werkwijze stond op drie plekken die elk per chat muteerden, waardoor afspraken erodeerden (onder meer de regel dat Claude's advies expliciet in de proza bij een popup hoort).
