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

## Scenario's zijn onafhankelijk van hun volgorde

Elk scenario WIST eerst zijn eigen leesvenster: acht weken weekplan-rijen,
geteld terug vanaf de blokstart, worden leeggezet vóór de harness gaat zaaien.
Dat moet, want de scenario's deelden week-sleutels — 33 schrijfacties op 7
unieke weken — en las het ene dus terug wat het andere had achtergelaten.

Een guard dwingt dat per run af: na het wissen moet
`/api/weekplans/recent` op zowel de weekmaandag als de blokstart een lege
lijst geven, anders breekt de run af met het scenario en de maandag erbij.

DE TOETS WAAROP DEZE EIGENSCHAP RUST is de VOLGORDE-toets: draai de
scenario-lus om en eis dat geen enkele shot beweegt. De oude drie-cycli-toets
discrimineert niet meer, want de gedeelde toestand convergeert naar een vast
punt en het defect wordt daar onzichtbaar.

De PLANNER-tabel wordt bewust niet gewist: die wordt alleen voor de bekeken
week gelezen, niet over een venster.

## Grenzen

Alles staat hard op loopback (`127.0.0.1`); remote wordt nooit geraakt. De
Worker op 8787 is optioneel: `/preview` rendert ook zonder, en het script
noteert alleen of de API bereikbaar was.

Valt een dev-server weg tijdens een sweep, dan stopt de harness met een eigen
melding die beide origins meet en het woord `INFRASTRUCTUUR-UITVAL` draagt — in
plaats van dat een dode server als een eeuwig ladende pagina leest en de uitval
als een defect van je bouw wordt gemeld. Die melding vervangt de oorspronkelijke
fout ALLEEN als er aantoonbaar een origin niet antwoordt; antwoorden ze allebei,
dan gaat de fout ongewijzigd door. Elk antwoord telt daarbij als levend, ook een
401 of een 500 — alleen een fetch die gooit of afloopt is "geen antwoord".

Eerste keer draaien vraagt de browser:

    pnpm exec playwright install chromium
