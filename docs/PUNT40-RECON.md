# Punt 40 — recon en meting: het nominale zone-label draagt geen karakter

Chat-zijdige leesronde, 8 augustus 2026. Read-only kloon op `fd3fdcb`, `buildWeekProposal` en
`expandArchetype_` uit een esbuild-bundel, `TZ=Europe/Amsterdam`, de klok als Proxy op de echte
`Date`. Elke uitspraak hieronder is GEDRAAID, niet gelezen. CC deed alleen de commit.

## 1. IJking en meetruimte

De weekvorm-as uit `apps/web/src/lib/weekvormAs.test.ts` opnieuw gedraaid met dezelfde zeven
vormen: kwaliteitsminuten 93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 /
352 / 227 / 375, kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. **21 van de 21 gepinde waarden
gereproduceerd.**

Meetruimte: 7 weekvormen maal 5 doelen maal 4 event-afstanden (Base, Build, Peak, Taper) —
**140 cellen, 640 sessies, 38 distincte %FTP-banden, 39190 blokminuten.**

## 2. De premisse is BEVESTIGD op het feit en WEERLEGD op de knip

BEVESTIGD. Het nominale label `drempel` draagt beide soorten werk: 6402 minuten over 16 banden,
waarvan **1824 in de sweetspot-band (onder 95 procent FTP) en 4578 in de drempelband (95 en
hoger)**. Dat is geen randgeval maar 28 tegen 72 procent.

WEERLEGD. De knip ligt NIET op LT2. Plateau-sweep over de knipgrens, uitsluitend op blokken met
nominaal label `drempel`:

- knip **95**: **0 banden dwars**, 1824 onder / 4578 boven.
- knip **100**: 2 banden dwars, **2742 van de 6402 minuten doorgesneden — 43 procent.**

Bij 100 loopt de knip midden door `95-102` (2646 min) en `100-108` (630 min). Op de
bibliotheek-kant hetzelfde beeld: over 19 banden en 1659 minuten geeft 94 en 95 nul dwarsliggers,
terwijl 99 er zes geeft en 100 er vijf. Een knip op LT2 is dus per constructie onbruikbaar op de
plan-kant, en de LT2-formulering van punt 40 vervalt als KNIP-plek. Als DIAGNOSE blijft ze staan:
het label loopt inderdaad over de grens heen.

## 3. Het plan en het zone-raster zijn structureel scheef

De 38 banden die het plan produceert laten precies DRIE binnen-naden vrij waar geen enkele band
dwars loopt: **81-88, 94-95, 109-112.** Buiten die drie ligt elke grens middenin minstens een band.

Het zone-raster knipt op 55 / 75 / 90 / 105 (`ZONE5_GRENZEN_DEFAULT`,
`apps/web/src/lib/zonemunt.ts:41`, spiegel van `pctZoneBucket_` op
`packages/engine/src/zones.ts:202`). Van die vier vallen 90 en 105 allebei BUITEN de schone naden:
90 snijdt door `88-92`, `88-93`, `89-92` en `89-93`; 105 snijdt door `100-108` en `103-108`. De
misalignment is dus geen ongeluk van een enkel sjabloon maar een eigenschap van het paar
raster-en-bibliotheek.

## 4. Het nominale label is geen karakter-label — drie lekken

`blok.zone` komt uit `pctZoneBucket_` op het MIDDEN van de band (`archetypes.ts:154`). Dat levert
drie lekken:

- **Sweetspot lekt naar `tempo`.** `sweetspot_short`, `_2x10`, `_3x8`, `_3x6_kort`,
  `_lage_cadans`, `_lage_cadans_lang` dragen band `88-92`, midden 90, dus `tempo`.
- **Sweetspot lekt naar `drempel`.** `sweetspot_long` en `_3x15` dragen `88-93`, `_4x12` draagt
  `89-92`, `_long_climb` draagt `89-93` — midden boven 90, dus `drempel`. Eén procentpunt op de
  bovengrens verzet identiek werk naar een ander label.
- **Drempel lekt naar `anaeroob`.** `threshold_4x8_seiler` draagt `103-108`, midden 105,5.

De splitsing is bovendien DUUR-GECORRELEERD: de korte sweetspot-sjablonen (34 tot 90 minuten)
landen in `tempo`, de lange (82 tot 135) in `drempel`. Precies bij weinig uren — waar M44
sweetspot de ruggengraat noemt — valt de prikkel dus buiten `drempel`.

## 5. Er bestaat geen tempo-intent

Van de 2280 nominale tempo-minuten komen er **2172 uit band `88-92` en 108 uit `86-86`**, en beide
banden komen uitsluitend uit sweetspot-archetypes. `GOAL_KWALITEIT_INTENTS_`
(`packages/engine/src/archetypes.ts:1584`) kent drempel, sweetspot en vo2 — geen tempo, en er is
geen archetype met een tempo-tag. **Het label `tempo` wordt voor 100 procent door sweetspot
gevoed.**

## 6. Het live gevolg zit in de POORT, niet in de weergave

De minuten-kant lijdt hier niet aan: `planZone5_` splitst een blok PROPORTIONEEL over de
zonegrenzen, dus bandoverloop is daar al afgevangen. Wat wel op het midpunt-label rust is de
POORT — `werkzoneLabelsVan_` (`apps/web/src/lib/zonelabels.ts:27`) — met drie consumenten:

- `apps/web/src/lib/weektekort.ts:114` — welke zones de weekstem als voorgeschreven leest.
- `apps/web/src/lib/blok.ts:413` — welke zones de blok-terugblik beoordeelt.
- `apps/web/src/lib/sleutelinhaal.ts:44` — of het plan een sleutelzone draagt.

GEMETEN over de 90 cellen met sweetspot-werk: **48 labelen het uitsluitend `tempo`, 33
uitsluitend `drempel`, 9 dragen beide labels in dezelfde week.** Dezelfde intent, drie
verschillende poort-uitkomsten, bepaald door welk sjabloon de rotatie koos.

`SLEUTELZONES` (`apps/web/src/lib/sleutelinhaal.ts:42`) is drempel plus anaeroob, terwijl
`COACH_KEY_INTENTS_` (`packages/engine/src/coach.ts:75`) vo2, drempel EN sweetspot draagt. In de
48 cellen waar sweetspot als `tempo` landt is een sleutel-intent dus geen sleutelzone. De grond
die daarvoor in het commentaar staat — zou tempo meedoen, dan noemt de app een gewone tempo-rit
een sleutelsessie — is weerlegd door §5: zo'n rit bestaat niet in het plan.

En waar sweetspot als `drempel` landt is het van echt drempelwerk niet te onderscheiden. V1 bij
doel FTP in Base: 48 sweetspot-minuten naast 45 drempelminuten, samen onder één label. V2 bij FTP:
88 tegen 25.

## 7. Verdict

- **De knip is 95, niet 100.** HERKOMST: geijkt op een plateau — nul dwarsliggers op 94 en 95,
  tegen twee banden en 43 procent van de minuten op 100.
- **De drie karakter-naden zijn 85, 95 en 110**, elk gekozen binnen een gemeten schone naad
  (81-88, 94-95, 109-112). Ook deze dragen HERKOMST: geijkt op plateau.
- **GEEN engine-autorisatie nodig.** `pctLo` en `pctHi` staan al op elk blok en de poort woont in
  `apps/web/src/lib`. Punt 40 staat in `docs/ROADMAP.md` als ENGINE en dat is met deze meting
  onjuist geworden.
- **De zone-munt blijft ongemoeid.** De GELEVERDE kant komt uit intervals `power_zones` en kent
  geen grens op 95; een poort op een raster dat de geleverde kant niet heeft, schendt de regel dat
  beide kanten in dezelfde eenheid gemeten worden. De vijf buckets blijven de munt; de karakter-as
  komt ernaast en oordeelt niet over geleverd.
- **Fase B is NIET norm-neutraal**, en dat corrigeert de scope-regel van het punt. De poort
  verplaatsen verandert wélke zones beoordeeld worden, en dat kan een oordeel omkeren. Het
  meetgat en het poort-defect hebben dezelfde oorzaak, dus een karakter-as die de poort niet raakt
  zou vooruit-bedrading zijn.

Ankers in de norm: M74 (karakter is de vermogenszone waarin de hoofdblokken liggen — een label dat
twee zones dekt kan die uitspraak niet dragen), M44 (sweetspot is de ruggengraat bij weinig uren,
precies het geval dat in `tempo` verdwijnt) en M5 (de app doet geen bewering zonder dekking).

## 8. Wat fase B eerst moet meten

1. Per consument de blast radius van de poort-verplaatsing, LOS gemeten: weekstem, blok-terugblik
   en sleutel-inhaal. Elke plek een eigen rood-meting; een gedeelde as kan volledig via een tak
   lopen.
2. Beide richtingen van elke kanteling, met aantallen — een netto-verschuiving mag niet als
   eenzijdige verslechtering lezen.
3. Of de dosis-trede meebeweegt: de blok-check voedt `dosisTredeVoorstel`, dus een poort-wijziging
   kan tot in het plan doorwerken. Blijft dat nul, dan is dat het begrenzingsbewijs.
