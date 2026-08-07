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

## Wat elke shot afwacht en bewaakt

VÓÓR DE SLUITER WACHT DE HARNESS DE ANIMATIES UIT. Vlak voor `page.screenshot`
telt hij `document.getAnimations()` op `running` en `pending` en wacht tot dat
nul is, met een bovengrens van 5000 ms die GOOIT in plaats van stil door te
lopen. Dat moet, want `settle` wacht 800 ms af terwijl de ring-transitie op de
Vorm-kaart 1350 ms duurt (1,1 s plus 250 ms aanloop) — precies daardoor
verschilden `09-vorm` en `10-trainingen` tussen twee runs van ongewijzigde code,
bij letterlijk gelijke `innerText`. Het gemeten aantal staat als `anim=` in de
samenvattingsregel; op een normale run is dat overal nul.

EEN GEKAPTE SHOT STOPT DE RUN. Vraagt een pagina meer dan `HEIGHT_CAP` (8000),
dan gooit de harness met het shot-label, de gevraagde hoogte en de cap. Stil
afkappen was het eigenlijke defect: zo'n PNG liegt over het scherm en leest bij
een byte-vergelijking als "ongewijzigd". Direct ná `page.screenshot` leest
`assertPngSize` bovendien de IHDR van het geschreven bestand terug — de eerste
24 bytes — en toetst breedte en hoogte tegen de viewport maal `DEVICE_SCALE`,
zodat een afkapping door de BROWSER er ook niet doorheen komt.

DE RIT-SHEET WORDT GEFOTOGRAFEERD, shot `16-ritdetail`. Hij staat pas ná een
klik in de DOM, dus geen enkele shot toonde hem ooit. De harness navigeert na de
overige schermen naar `/activiteiten`, klikt de eerste activiteitenrij aan en
schiet de open sheet. Wat hij bewijst is de TOESTANDSOVERGANG, niet een aantal:
nul elementen met `aria-label="Sluiten"` vóór de klik, meer dan nul erna, en
géén van de teksten "Ritdetails laden…" of "Ritdetails konden niet geladen
worden." — en omdat die drie takken uitputtend zijn en elkaar uitsluiten, staat
de sheet daarmee per constructie op ready. Zonder die laatste helft zou een
sheet die opent maar waarvan de fetch faalt de controle halen, en fotografeerde
je een foutkaart als bewijs.

## Twee runs vergelijken

    node tools/shots/vergelijk.mjs <linksPad> <rechtsPad>

Vergelijkt UITSLUITEND de `.png`, recursief en op het pad relatief aan elke
wortel, op bytes. De `.txt` blijft er bewust buiten: die draagt het
synctijdstempel en de request-telling, en zou drift melden die er niet is.

DE NOEMER IS HET TOTAAL van wat in beide bomen voorkomt, en de vergelijker
sluit NIETS uit zichzelf uit — een instrument dat vooraf besluit wat het niet
ziet, kan een uitsluiting nooit meer weerleggen. Bestanden die maar aan één kant
staan worden bij naam genoemd in plaats van stil uit de telling te vallen. De
exitcode is altijd 0: dit is een meetinstrument, geen poort.

Per bewegende shot staat er een INNERTEXT-KOLOM, en die draagt het onderscheid
tussen twee verschillende defecten. Pixelverschil bij GELIJKE `innerText` is de
punt-23-familie: hetzelfde scherm, andere bytes. Een VERSCHILLENDE `innerText`
is de punt-36-familie: het plan bewoog, niet de camera. Zonder die kolom is een
uitslag op zo'n as niet toe te wijzen.

MEET JE EIGEN IJKPAAR vóór je een bouw begrenst — twee sweeps achter elkaar op
ongewijzigde code — en erf er nooit een uit een eerdere sessie. De ruisvloer
hoort bij de sessie waarin je hem meet, en zelfs het scenario dat hem draagt
wisselt.

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
