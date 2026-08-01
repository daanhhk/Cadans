# Cadans — ÉÉN UITSPRAAK PER BLOK (ROADMAP punt 10, fase A) — BOUWDOC

Spec waartegen gebouwd wordt. De metingen hieronder zijn CHAT-ZIJDE gedraaid op `15172ad`, met de
app-eigen functies en `TZ=Europe/Amsterdam`, tegen de GECOMMITTE dump in
`docs/DOSIS-MUNT-MEETDATA.md` en de GECOMMITTE ΔCTL-reeks in `docs/DOORTRAIN-KAART-RECON.md` §4.
Dit document wijzigt geen code.

## 1. De vraag: twee kaarten, één blok, één getal

Op een deloadweek kunnen er twee kaarten tegelijk op het scherm staan die allebei iets over
HETZELFDE blok beweren, allebei afgeleid uit HETZELFDE getal — de CTL-delta over de drie
opbouwweken.

- De DOORTRAIN-KAART (`FatigueCard`, UP-tak) zegt: "Je CTL ging deze drie weken van A naar B — het
  blok heeft je niet belast."
- De BLOK-TERUGBLIK (`BlokReviewCard`) zegt wat het blok wél of niet geleverd heeft, per zone.

ROADMAP punt 10 stelt het criterium: een blok krijgt ÉÉN uitspraak, niet twee.

## 2. GEMETEN — de twee getallen zijn niet altijd hetzelfde

`schema.ts` roept `computeBlockCtlDelta` TWEE KEER aan, met een ander anker:

- het fatigue-pad op de WEEKMAANDAG (`schema.ts:1431`);
- de terugblik op `blokVenster.ctlAnker` (`schema.ts:1479`).

In BLOKWEEK 4 geeft `blokReviewVenster` fase "lopend" met `ctlAnker` = diezelfde weekmaandag. De
twee ΔCTL-waarden zijn daar dus IDENTIEK. In BLOKWEEK 1 is `ctlAnker` de maandag ervóór; op een
golvende CTL-reeks lopen de twee waarden daar tot 11,2 uiteen en verschillen ze van TEKEN.

Dat verschil is niet het probleem dat deze ronde oplost — in blokweek 4, de enige week waarin de
doortrain-kaart kan vuren, is het getal hetzelfde. Het staat hier omdat het de reden is dat "geef
beide kaarten hetzelfde anker" GEEN oplossing is: de twee ankers beantwoorden verschillende vragen
en horen te verschillen.

## 3. GEMETEN — hoe vaak staan ze samen op het scherm

Op de gemeten reeks uit `docs/DOORTRAIN-KAART-RECON.md` §4 (17 maandagen), geënumereerd met
`blokWeekVanWeek` over alle vier de blokfases: 17 blokweek-4-maandagen, waarvan er 7 door de
ΔCTL-poort van het UP-aanbod komen TERWIJL de terugblik rendert. Ruim een op de drie.

DAANS EIGEN BLOK, `doelStart` 2026-06-29, maandag 2026-07-20 — blokweek 4, ΔCTL −4,9.
`buildBlokReferent` op de gecommitte dump (`docs/DOSIS-MUNT-MEETDATA.md` Q4) geeft 0 van 3
opbouwweken op norm, tekortzone Drempel, verschuiving waar; `blokCheck` geeft `niet_geleverd`. De
twee zinnen die dan samen op het scherm staan SPREKEN ELKAAR TEGEN:

- terugblik: "Je trainde dit blok genoeg, maar niet waar het telt."
- doortrain-kaart: "het blok heeft je niet belast."

## 4. DE BEVINDING — de doortrain-kaart redeneert uit een grover getal

De doortrain-kaart leidt haar blok-uitspraak af uit ΔCTL alleen. CTL is één getal over alle
belasting samen: het kent geen zones. Sinds ROADMAP punt 6 bestaat er een FIJNER oordeel — per
zone, in de munt van de bibliotheek-signatuur — en dat oordeel kan iets zien wat ΔCTL per
constructie niet kan: "genoeg getraind, maar in de verkeerde zone".

Daar staan de twee zinnen dus niet toevallig naast elkaar; ze meten verschillende dingen en de
grovere doet de stelligste uitspraak. Dat is de reden dat de kaart haar BLOK-UITSPRAAK verliest en
niet haar AANBOD: het aanbod (mesoweek-substitutie 4 → 1, doortrainen in plaats van deloaden) is een
WEEKvraag en blijft precies doen wat het doet.

## 5. BESLUIT (Daan, 1 augustus 2026)

Het doortrain-AANBOD blijft bestaan en blijft ongewijzigd werken. Wat verdwijnt is zijn EIGEN
uitspraak over het blok. De TERUGBLIK is de enige stem over het blok; het aanbod hangt eronder als
weekvraag.

## 6. SPEC

6.1 NIEUW: `apps/web/src/lib/fatigueStem.ts` met één pure export
    `fatigueAanbodRegel(fatigue, deltaMin, terugblikOpScherm)`. Hij kiest de UP- of DOWN-regel op
    `fatigue.dir`, en geeft als blok-argument `null` door zodra `terugblikOpScherm` waar is, anders
    `fatigue.blok`.
    GEEN nieuwe copy-strings en GEEN wijziging in `coachNarrative.ts`: de tak die de ΔCTL-zin
    weglaat als het blok-argument null is, bestaat daar AL — in `fatigueUpAanbodRegel` en in
    `fatigueDownAanbodRegel`. Deze bouw zet die bestaande tak aan; hij bedenkt geen tweede copy.

6.2 `FatigueCard` krijgt een prop `terugblikOpScherm` (default `false`) en bouwt zijn aanbod-regel
    via `fatigueAanbodRegel` in plaats van de twee regel-functies rechtstreeks aan te roepen. De
    applied-state, de knoppen, het schrijfpad en de sessie-scoped afwijs-set blijven ONGEWIJZIGD.

6.3 `SchemaView`: is er een `blokReview`, dan rendert de `FatigueCard` NA `BlokReviewCard` en met
    `terugblikOpScherm` waar. Is die er niet, dan blijft hij exact op zijn huidige plek met
    `terugblikOpScherm` onwaar. De guard `!eventOvernameVoorstel` geldt in BEIDE takken. Het
    testvoorstel-blok en zijn guard blijven ongemoeid.

6.4 NIEUW: `apps/web/src/lib/fatigueStem.test.ts`, vier asserties:
    (a) UP met `terugblikOpScherm` waar — de regel bevat NIET "CTL" en NIET "belast";
    (b) UP met `terugblikOpScherm` onwaar — de regel bevat WEL "Je CTL ging";
    (c) hetzelfde paar voor DOWN;
    (d) het deel van de zin NA de ΔCTL-clausule is in beide gevallen identiek — het aanbod zelf
        verandert dus niet, alleen de blok-uitspraak valt weg.

## 7. OPEN — valt BUITEN deze ronde

HET AANBOD "VERSCHUIF DEZE WEEK DE MINUTEN NAAR DREMPEL" hoort bij punt 10 fase B. Als de terugblik
de enige stem over het blok wordt, is de logische volgende stap dat die stem ook een DAAD kan
voorstellen — niet "train door" maar "verschuif de minuten naar de tekortzone". Dat raakt de
ALLOCATOR en dus de engine, met eigen autorisatie en een eigen ronde. Deze bouw verplaatst alleen
een uitspraak; hij verandert geen enkel plan.
