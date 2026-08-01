# Punt 14 fase 1 — de blok-terugblik oordeelt op de zones die het plan voorschrijft

Spec waartegen fase 1 gebouwd wordt. De blok-terugblik zegt vandaag "niet geleverd" over een blok
dat exact volgens plan is gereden, omdat de norm zones vraagt die het plan niet programmeert. Deze
fase repareert het OORDEEL, niet de norm.

## 1. Wat er gemeten is

Gedraaid chat-zijde: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27, A-race 2027-04-17,
`doelStart` 2026-06-29. HET INSTRUMENT IS VOORAF GEVALIDEERD: `bibliotheekSignatuur` reproduceert
0,282137 / 0,562462 / 0,155401 exact — dezelfde signatuur als bij de zone-munt van punt 6.

M1 — DE DERDE KWALITEITSSOORT IS ONBEREIKBAAR. `goalPickIntent_` rangschikt drempel, sweetspot en
vo2; `goalWorkout_` ontwijkt uitsluitend de VÓRIGE intent. De rotatie loopt daarmee over de bovenste
TWEE, en de derde komt per constructie nooit aan de beurt. Uitputtend getoetst over 10800
combinaties (weekomvang 3..14 uur x dagduur 45..120 min x 5 doelen x 3 fases x 4 dekking-varianten
x quotum 2, 3 en 4): 10800 keer hoogstens twee soorten, 0 keer drie. Dit is geen steekproef maar de
volledige ruimte van die zes assen.

M2 — HET PLAN PROGRAMMEERT GEEN ANAEROBE MINUTEN. Gemeten met de app-eigen `buildWeekProposal` over
35 cellen (de 7 weekvormen van `weekvormAs.test.ts` x 5 doelen), gevouwen met `planZone5_` —
dezelfde functie waarmee de norm zijn vorm krijgt, dus beide kanten liggen op één indeling. NUL
anaerobe minuten in 27 van de 35. Onderhoud 7 van 7, Conditie 7 van 7, Lange beklimmingen 7 van 7,
FTP 6 van 7. Alleen Korte beklimmingen programmeert ze altijd; daar staat vo2 wél bovenaan de
rangschikking. In Peak schuift vo2 bij de andere doelen omhoog.

M3 — GEEN HERWEGING VAN DE NORM REPAREERT HET. Vier norm-vormen doorgerekend over dezelfde 35
cellen: de huidige bibliotheek-brede, een doel-gewogen (`intentGewichten`), een doel-plus-fase-
gewogen (`goalEffWeights_`) en een die exact de twee geroteerde intents volgt. ALLE VIER leveren
1 van de 35 cellen waarin het plan zijn eigen per-zone-norm haalt. Anaeroob zakt in 27 tot 34
cellen, tempo in 18 tot 19; alleen drempel houdt stand met 11 tot 12. De norm anders WEGEN lost het
dus niet op — het probleem zit in welke zones er MEEDOEN, niet in hun onderlinge verhouding.

M4 — DE NOMINALE POORT WERKT. Poortset afgeleid uit de zone-labels van de GERENDERDE blokken:
nergens alle drie de werkzones, 0 van de 35. Onderhoud tempo+drempel in 7 van 7, Conditie
tempo+drempel in 7 van 7, Korte beklimmingen drempel+anaeroob in 7 van 7, FTP drempel in 6 van 7 en
drempel+anaeroob in 1 (V3), Lange beklimmingen tempo+drempel in 5 en drempel in 2. Een EXACT
VOLGENS PLAN gereden week leest mét poort als geleverd in 22 van de 35 cellen, tegen 1 van de 35
zonder. Dat verschil is de hele fase.

PREDICAAT bij M2 tot en met M4: gemeten op de LEEG-GEVOEDE weekvorm-as, niet op de levende D1. De
recency-seed kiest in de app andere varianten binnen dezelfde duurband, dus de exacte
sjabloonkeuzes verschillen; de zone-LABELS die eruit komen zijn wat hier telt.

## 2. Het besluit

DE NORM HOUDT ZIJN SCHAAL EN ZIJN VORM ONGEWIJZIGD — prikkels x minuten-per-prikkel x
bibliotheek-signatuur. `blokDosisNorm` wordt niet aangeraakt en er komt geen herweging.

WAT VERANDERT IS UITSLUITEND WELKE ZONES AAN HET OORDEEL MEEDOEN: alleen de zones waarvan het plan
van díé week het nominale label werkelijk voorschreef. Zelfde poort en zelfde grond als de
zone-label-poort in `weektekort.ts`: hij weert BANDOVERLOOP uit de proportionele splitsing, geen
klein tekort. Een zone die het plan wél voorschreef telt mee hoe klein het tekort ook is.

ER KOMT GEEN MINUTEN-DREMPEL BIJ EN GEEN NIEUWE CONSTANTE. De poort is een LABEL-toets op een veld
dat elk engine-blok al draagt (`zone`, gezet door `pctZoneBucket_` op het midden van de band).

## 3. Wat hier NIET in zit

- DE VO2-SLOTVERDELING — fase 2, ENGINE, autorisatie nog NIET gegeven. Het Onderhoud-profiel
  declareert vo2 0,20 bij drie kwaliteitsdagen, ruwweg één prikkel per twee weken, en de rotatie
  gooit dat weg (M1). Of dat gerepareerd moet worden of dat de declaratie zelf fout is, vraagt een
  wat-als-meting vóór de bouw — de 5c-les staat: de opgeruimde inhaal-kaart stelde in 60 van 72
  cellen een LICHTERE week voor.
- NIEUW ROADMAP-PUNT 15, DE DOSIS VAN DE TWEE KLIM-DOELEN. Ook mét poort zakken ze: Korte
  beklimmingen levert 39 werkminuten en Lange beklimmingen 46, tegen een norm van 84. Dat is een
  DOSIS-vraag en geen verdelings-vraag, dus hij hoort niet in deze fase. Korte beklimmingen heeft
  een harde datum in februari 2027.
- DE TEMPO-TERM VAN DE NORM ZELF. Die komt voor bijna de helft uit sweet-spot-banden die over de
  90-procentgrens liggen. Met de label-poort raakt hij het oordeel niet meer zodra het plan geen
  tempo-label voorschrijft, dus de urgentie is eraf. Genoteerd, niet gebouwd.

## 4. Wat er gebouwd wordt

4.1 DE POORTSET PER WEEK. Leid per blokweek af welke nominale WERKZONE-labels het bewaarde weekplan
    van die week voorschreef: de `zone`-eigenschap van elk blok met `minuten > 0`, beperkt tot
    tempo, drempel en anaeroob. DEZELFDE leesroute als `weektekort.ts` (`rauweBlokkenVan_`), en die
    helper wordt daarvoor uitgetrokken naar een gedeelde plek in plaats van gedupliceerd.

4.2 INVOER. `buildBlokReferent` en `buildBlokReview` krijgen `weekplans`. Op `buildBlokReview`
    VERPLICHT, niet optioneel — om dezelfde reden als `grenzen`: een optioneel veld valt bij een
    aanroeper stil weg en dan is het pad dood aan zijn INVOER. Gevoed uit de `weekplans` die in
    `schema.ts` en `Preview.tsx` al in scope staan; geen extra fetch.

4.3 `BlokWeek` krijgt `zonesVoorgeschreven: Zone5Key[]`. De velden
    `gevraagdTempo`/`gevraagdDrempel`/`gevraagdAnaeroob` blijven ONGEWIJZIGD getallen — de norm
    verandert niet, alleen wie eraan meedoet.

4.4 HET OORDEEL. `zonesOpNorm` telt alleen zones uit `zonesVoorgeschreven`; `geleverdOk` wordt
    `zonesOpNorm === zonesVoorgeschreven.length`.

4.5 `telt` krijgt de voorwaarde `zonesVoorgeschreven.length > 0`. Een afgeronde opbouwweek zonder
    bewaard weekplan is een DATAGAT en geen misser — exact dezelfde lijn als de bestaande
    zonedekking-regel, en uitdrukkelijk NIET dezelfde als "ritMinuten 0 telt WEL mee".

4.6 `tekortZones` in `blokUitvoering` telt per week alleen zones die díé week voorgeschreven waren.
    Idem de verschuivings-tak.

4.7 KAART `BlokReviewCard.tsx`: `opNorm` wordt `zonesOpNorm === zonesVoorgeschreven.length`; de
    noemer "n/3" wordt n over het AANTAL VOORGESCHREVEN zones; een niet-voorgeschreven zone toont
    een streepje op de norm-plek, precies zoals Herstel en Duur dat al doen. In het blok-totaal
    krijgt een zone die door GEEN enkele meegetelde week voorgeschreven is norm `null`.

4.8 `coachNarrative.ts` regel 405: de zone-norm-zin noemt alleen voorgeschreven zones.

## 5. Acceptatie

- DE INVARIANT MET DE PRODUCENT IN DE LUS. Bouw met `buildWeekProposal` een week voor doel
  Onderhoud (weekvorm V1: ma60 di60 do60 za120, `doelStart` 2026-06-29, klok gepind), vouw het
  resultaat met `planZone5_` en construeer daaruit een activiteit waarvan de zone-seconden exact
  die minuten dragen. Voed die plus het bewaarde weekplan aan `buildBlokReferent`. Assertie:
  `geleverdOk` true. De vorige waarde wordt NIET met de hand in een nagebouwd object gezet — de
  test roept de producent aan.
- Een assertie dat de POORTSET van diezelfde week exact tempo en drempel is en anaeroob NIET
  bevat, zodat de test niet stil doodgaat als de vouwing verschuift.
- TEGENPROEF: een voorgeschreven zone met een tekort van ÉÉN minuut laat de week wél vallen.
- Een afgeronde opbouwweek zonder bewaard weekplan levert `telt` false, niet `geleverdOk` false.
- ROOD PER TERM: 4.4, 4.5 en 4.6 elk APART terug op het oude gedrag, suite draaien, noteren welke
  tests vallen. Een term die nergens rood wordt is niet gedekt — melden en stoppen.
- BEGRENZINGSBEWIJS uit de shot-harness: warmloop weggooien, dan voor en na op bytecount en
  sha256, zonder werk ertussen dat de lokale D1 raakt.
- CLIENT-ONLY: `git diff --stat HEAD~1 -- packages/engine` leeg. Geen migratie, geen deploy.

## 6. Fase 1b — de poort is een BLOK-eigenschap

AANLEIDING. Fase 1 hing de poort per week aan het BEWAARDE weekplan van díé week. Die rijen zijn er
meestal niet: 2 van de laatste 12 maandagen op prod, 1 van de 4 opbouwweken lokaal. Gevolg: `telt`
werd overal false en de blok-terugblik zweeg volledig — in alle 64 shots. De acceptatie van fase 1
vroeg het begrenzingsbewijs pas ná de bouw, en de suite kon het niet zien omdat elke test zijn eigen
weekplan meelevert.

DE BEWAARDE RIJEN GROEIEN AAN, MAAR VULLEN HET VERLEDEN NOOIT. `weekplans` draagt geen tijdstempel
(`PRAGMA table_info`: `user_id`, `week_monday`, `entries_json`), dus de rijen zijn niet te dateren
uit de tabel. De schrijfroute is `persistWeekplan` in `schema.ts`, die uitsluitend de BEKEKEN week
wegschrijft; er is geen backfill. `git log -S` zet de introductie op `fbbc292`, 2026-07-19 — en er
staan precies twee rijen, 2026-07-20 en 2026-07-27, de twee maandagen sindsdien. Eén rij per week
dat de app opengaat, en weken van vóór 2026-07-19 blijven voor altijd leeg.

DE BLOKPOORT is de VERENIGING van de nominale werkzone-labels over alle weken van het blokvenster
die een bewaard plan dragen, DELOADWEEK INBEGREPEN. Binnen één blok liggen doel en fase vast, dus
dat is bewijs uit dezelfde bron en geen versoepeling. Een week met een EIGEN bewaard plan houdt zijn
eigen poortset — specifieker wint. `poortHerkomst` (`"week"` | `"blok"` | `"geen"`) legt vast waarop
een oordeel rustte. `telt` toetst de EFFECTIEVE poort: alleen een blok dat NERGENS een bewaard plan
draagt zwijgt nog.

GEMETEN NA DE BOUW. Van de 64 shots dragen er 56 de kaart weer; de 8 `overname`-shots zwijgen omdat
hun blokvenster (klok op 2027-02-22) nergens een bewaard plan heeft — `poortHerkomst` "geen", exact
het gespecificeerde datagat. Het oordeel kantelt: v7 ging van "0 van de 3 opbouwweken" naar "2 van
de 3", en het blok-totaal toont een streepje op Tempo (193/—) en Drempel (93/—) omdat geen
meegetelde week die zones voorschreef.

OPEN PUNT, NIET GEBOUWD: DE BEWAARDE RIJ IS GEEN WEEK. `entryFromDay` levert null voor een dag
zonder sessie, dus een rij draagt alleen TRAININGSDAGEN — en lokaal draagt elke bewaarde week er
precies ÉÉN (2026-07-13 → alleen 2026-07-19, een VO2-sessie; 2026-07-20 → alleen 2026-07-22). De
poort is daarmee smaller dan "wat de week voorschreef": in v7 komt hij op `anaeroob` alleen uit, en
het oordeel "2 van de 3 weken op norm" rust op die ene zone. Dat is geen defect in wat hier gebouwd
is — fase 1 las dezelfde deelrijen, en de vereniging verbreedt ze juist — maar het beperkt wat de
poort kan BETEKENEN. Wie hier verder gaat, meet eerst hoeveel dagen een bewaarde rij op PROD draagt.
