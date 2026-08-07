# PUNT 28 — BOUWDOC: een doelwissel herstart de cyclus niet

Spec waartegen gebouwd wordt. CLIENT-only: `packages/engine` wordt NIET aangeraakt, en dit
document autoriseert daar ook niets.

## 1. Het defect

`doel` en `doelStart` zijn twee LOSSE velden. `doelStart` heeft één schrijver
(`apps/web/src/lib/settings.ts`), en die schrijft hem alleen wanneer de gebruiker het veld zelf
aanraakt. Wisselt Daan handmatig van doel, dan blijft `doelStart` staan waar hij stond.

GEVOLG: het verse doel landt MIDDEN in het lopende blok. De fase en de mesoweek worden afgeleid
uit `doelStart`, dus die blijven van het OUDE doel. De app plant dan een Peak-week voor een doel
dat gisteren is gekozen, of een deload voor een blok dat nooit is begonnen.

DE CANON IS HIER NIET OPEN. `docs/TRAININGSMODEL.md` M49 stelt dat de fase het DOEL volgt.
`docs/DOELEN-SPEC.md` §2B stelt dat een nieuw gekozen doel een NIEUW BLOK begint. Beide staan er
al; wat ontbreekt is de koppeling in de code.

## 2. Wat NIET het defect is

**HET UITVOERINGS-OORDEEL IS NIET DOEL-BREED BESMET.** Dit is chat-zijde nagerekend en hoort hier
zwart op wit, zodat een volgende ronde die aanname niet opnieuw maakt.

Sinds ROADMAP punt 17 wordt een opbouwweek beoordeeld tegen het BEWAARDE PLAN van díé week:
`apps/web/src/lib/blok.ts:615` legt de geleverde zoneminuten langs `gevraagdTempo` c.s. — de
afgeronde plan-waarden van die week — en `:638` doet hetzelfde op het totaal. Er is geen
doel-breed richtgetal meer in dat oordeel.

Een HYBRIDE wisselweek — half oud doel, half nieuw — wordt dus tegen zijn EIGEN hybride plan
gelegd. Dat is intern consistent. Wie hier een tweede defect vermoedt, meet iets wat sinds punt 17
niet meer bestaat.

## 3. Term 1 — de koppeling

Nieuwe PURE functie in `apps/web/src/lib/settings.ts`:

```
blokStartBijDoel(geladenDoel, geladenBlokStart, nieuwDoel, vandaagISO): string
```

Beide doelen gaan eerst door `normalizeDoel_` uit `@cadans/engine`. Dat is dragend en geen
netheid: een opgeslagen `"Beklimmingen"` en het canonieke `"Lange beklimmingen"` zijn hetzelfde
doel, en zonder normalisatie zou het laden van een oude instelling als een WISSEL lezen.

- **Genormaliseerd GELIJK** → geef `geladenBlokStart` ONVERANDERD terug. Twee eigenschappen volgen
  daaruit, en allebei zijn ze bedoeld: de functie is IDEMPOTENT (nog eens aanroepen verandert
  niets), en terugwisselen naar het oude doel HERSTELT de oude datum in plaats van een derde blok
  te openen.
- **Genormaliseerd VERSCHILLEND** → de maandag van de week van `vandaagISO` wanneer die dag
  maandag, dinsdag of woensdag is; anders de EERSTVOLGENDE maandag.

### De donderdag-grens draagt herkomst BELEID

Het is een besluit van Daan, geen geijkte drempel. Er bestaat geen reeks om dit op te bemonsteren
— er staat geen enkele doelwissel in de Cadans-historie — dus er hoort ook GEEN plateau-toets bij:
een grens die je niet kunt bemonsteren, ijk je niet, je verantwoordt hem. De constante wordt in de
code als BELEID gelabeld.

De redenering erachter: wissel je op maandag, dinsdag of woensdag, dan is er nog genoeg week over
om er een echte trainingsweek van te maken. Wissel je later, dan zou de nieuwe cyclus openen met
twee of drie dagen, en dat leest als een blok dat al mislukt is voor het begon.

## 4. Waarom maandag-uitgelijnd en niet de wisseldag zelf

Chat-zijde GEMETEN met de app-eigen functies, met `doelStart` op vrijdag **2026-08-07**:

- De weekmaandagen **2026-08-03** en **2026-08-10** lezen ALLEBEI blokweek 1. Dat is de gewenste
  oprekking: de wisselweek en de week erna horen bij hetzelfde verse blok.
- MAAR `computeMacroPhase` kantelt dan MIDDEN in de week voor elke aanroeper die de DAG meegeeft
  in plaats van de weekmaandag: w1 naar w2 op **2026-08-13** en w2 naar w3 op **2026-08-21**.
- En `blokStartVoorWeek` geeft binnen ÉÉN blokweek twee verschillende blok-starts, **2026-08-03**
  en **2026-08-10**. Dat is geen cosmetisch verschil: die datum is de SLEUTEL waaronder de
  blokgrens-kaarten hun antwoord wegschrijven, dus dezelfde vraag zou twee keer gesteld worden en
  het antwoord op de ene sleutel zou de andere niet dekken.

Met de EERSTVOLGENDE MAANDAG levert de bestaande ondergrens-klem in `blokWeekVanWeek` en
`computeMacroPhase` exact dezelfde oprekking op, zonder die twee gebreken. Er komt dus geen nieuwe
klem bij; de bestaande doet het werk zodra de datum op een maandag valt.

## 5. Term 2 — de poort op de terugblik

`blokReviewVenster` (`apps/web/src/lib/blok.ts:899`) geeft in de **afgerond-tak** (`bw === 1`,
regel 912) voortaan `null` zodra het beoordeelde blok begint VÓÓR de weekmaandag van `doelStart`.

GROND: dat blok hoort bij een VORIGE doel-periode. En het is niet vrijblijvend — `dosisTredeVoorstel`
hangt aan dat oordeel, dus zonder poort zet de vorige configuratie de dosis van de nieuwe.

**DE LOPEND-TAK BLIJFT ONGEWIJZIGD.** Die vuurt op blokweek 4 en beoordeelt het blok waarin we NU
zitten; dat blok kan per constructie niet vóór `doelStart` liggen, dus daar valt niets te poorten.
Hem toch aanraken zou een tak veranderen die het defect niet draagt.

### Term 2 vuurt ook ZONDER wissel

Chat-zijde gemeten: bij `doelStart` **2026-06-29** geeft `blokReviewVenster` op weekmaandag
**2026-06-29** een afgerond-venster vanaf **2026-06-01** — drie weken VOORDAT het doel bestond.

Dat is belangrijk voor de rood-meting: term 2 is te betrappen zonder dat er ooit een doelwissel
plaatsvindt, dus de toets hangt niet aan term 1.

## 6. Buiten scope — vindplaats, niet gebouwd

`apps/web/src/lib/schema.ts:1411` vergelijkt de bewaarde dosis-trede-rij met de instelling op de
RAUWE string: `dosisTredeRow.doel === (settings?.doel ?? null)`. Er gaat geen `normalizeDoel_`
overheen. Een bewaarde `"Beklimmingen"` naast een ingestelde `"Lange beklimmingen"` leest daar dus
als een ANDER doel, waarna de trede stil op 0 valt.

Dit staat hier als VINDPLAATS en wordt in deze ronde NIET gebouwd: het is een tweede defect met
een eigen rood-meting, en meenemen zou de begrenzing van deze ronde onleesbaar maken.

## 7. Wat deze ronde niet doet

Geen engine-wijziging. Geen migratie — beide velden bestaan al. Geen nieuwe route. Geen deploy in
deze ronde. En geen wijziging aan de lopend-tak van `blokReviewVenster`.
