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
`innerText` van `main`. Een stale shot mag nooit voor een verse doorgaan.

## Uitvoerpaden

Elke modus heeft zijn EIGEN pad, en de vorige complete run blijft staan:

- lokaal schrijft naar `out/`, prod naar `out-prod/`;
- de vorige COMPLETE run van diezelfde modus staat in `out-vorige/`
  respectievelijk `out-prod-vorige/`.

Bij de start ROTEERT de harness: droeg de vorige run het bestand
`RUN-COMPLEET.json`, dan schuift hij op naar het `-vorige`-pad; droeg hij het
niet, dan was hij afgebroken en gaat hij weg. Een omgevallen run verdringt dus
nooit een goede nulmeting. De marker wordt als laatste handeling geschreven,
nog vóór de float-net-controle — een run die op het net rood valt is namelijk
wél compleet.

Alle vier de paden zijn git-ignored, elk met een eigen regel in `.gitignore`.
De eerste regel van de samenvatting noemt het huidige en het vorige pad bij
naam, zodat een vergelijking nooit hoeft te raden waar de nulmeting staat.

## Grenzen

Alles staat hard op loopback (`127.0.0.1`); remote wordt nooit geraakt. De
Worker op 8787 is optioneel: `/preview` rendert ook zonder, en het script
noteert alleen of de API bereikbaar was. Eerste keer draaien vraagt de browser:

    pnpm exec playwright install chromium
