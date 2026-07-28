# tools/shots — headless screenshot harness

Schiet de app in een echte browser (playwright + chromium, headless) zodat een
wijziging visueel te controleren is zonder te deployen.

## Gebruik

Start eerst de twee dev-servers, elk in een eigen terminal:

    pnpm --filter @cadans/web dev     # vite op 5173
    pnpm --filter @cadans/api dev     # wrangler dev op 8787, lokale D1

Draai dan:

    node tools/shots/shot.mjs

De output staat in `out/`: per pagina een `NN-naam.png` en een `NN-naam.txt`
met de URL, de gebruikte viewport, de console- en page-errors, en de
`innerText` van `main`. `out/` is git-ignored en wordt bij elke run gewist —
een stale shot mag nooit voor een verse doorgaan.

## Grenzen

Alles staat hard op loopback (`127.0.0.1`); remote wordt nooit geraakt. De
Worker op 8787 is optioneel: `/preview` rendert ook zonder, en het script
noteert alleen of de API bereikbaar was. Eerste keer draaien vraagt de browser:

    pnpm exec playwright install chromium
