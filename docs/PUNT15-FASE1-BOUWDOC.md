# Punt 15 fase 1 — de lange rit met efforts declareert zijn zones

Spec waartegen fase 1 gebouwd wordt. De twee klim-doelen zakken in Build en Peak ver onder hun
norm. Deze fase repareert niet de DOSIS maar het GAT IN DE MUNT dat eronder ligt: de zaterdagsessie
draagt 30 kwaliteitsminuten die de zone-munt per constructie niet kan zien.

## 1. Wat er gemeten is

Chat-zijde gedraaid: engine plus client-lib gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, `Date` gestubd op de fixture-maandag 2026-07-27, A-race 2027-04-17.
HET INSTRUMENT IS VOORAF GEVALIDEERD: `bibliotheekSignatuur` reproduceert 0,282137 / 0,562462 /
0,155401 exact, en de weekvorm-as komt byte-identiek terug op 93 / 113 / 113 / 105 / 84 / 93 / 90
kwaliteitsminuten, 268 / 410 / 464 / 362 / 352 / 227 / 375 TSS en 3 kwaliteitsdagen op alle zeven.

DE FASE IS GESTUURD VIA `doelStart`, NIET VIA HET EVENT. Sinds punt 9 leidt het doel tot de
acht-wekengrens, dus `computeMacroPhase` bepaalt de fase: `doelStart` 2026-07-27 geeft blokweek 1
(Base), 2026-06-29 blokweek 5 (Build) en 2026-06-01 blokweek 9 (Peak). Alle drie liggen op mesoweek
1, want weekIndex 0, 4 en 8 zijn nul modulo vier. De meetruimte is 5 doelen x 3 fases x 7
weekvormen.

M1 — DE PREMISSE VAN PUNT 15 IS GEREPRODUCEERD EN GEPRECISEERD. Op weekvorm V1 in fase BUILD levert
Korte beklimmingen 38,5 werkminuten en Lange beklimmingen 46,0 — exact de 39 en 46 uit
`docs/PUNT14-BOUWDOC.md` §3. TWEE CORRECTIES OP DIE VINDPLAATS. De norm voor deze twee doelen is
78, niet 84: 3 prikkels maal `KWALITEIT_MIN_PER_PRIKKEL_DEFAULT` 26; 84 is de FTP-norm. En het
tekort is FASE-GEBONDEN, niet doel-breed: gemiddeld over de zeven weekvormen levert Korte
beklimmingen in Base 85,0 en Lange beklimmingen 82,4, tegen 42,4 en 56,5 in Build en 20,0 en 27,4
in Peak. Dat is precies de fase waarin korte beklimmingen vanaf 2027-02-22 het actieve doel wordt.

M2 — DE OORZAAK IS EEN GAT IN DE MUNT, GEEN DOSIS. `genericCombo` retourneert voor
`combo_long_with_efforts` (`packages/engine/src/planner.ts`) GEEN `blokken`. De sessie draagt wel
`intent` met `high: 30` en `zones: ["low","high"]`, maar `planZone5_` leest `blokken` — dus die
dertig minuten zijn onzichtbaar voor de zone-munt, en `werkzoneLabelsVan_` ziet ze evenmin, waardoor
de zone niet eens in de poortset van punt 14 belandt. UITPUTTEND over de meetruimte, 480 sessies:
28 sessies zonder blokken, ALLE `combo_long_with_efforts`, alle bij de twee klim-doelen, alle in
Build en Peak, samen 840 gedeclareerde intent-high-minuten. 37 unieke sjabloonnamen dragen hun
blokken wel. Dit is de ENIGE kwaliteitsdragende sessie in de app zonder blokken.

WAAROM ALLEEN KLIM EN ALLEEN BUILD EN PEAK. `spreiding.effortsInLangeRit` staat uitsluitend op
`PROFILES.klim_kort` en `PROFILES.klim_lang`, en de arm hangt daarnaast aan een macrofase ongelijk
aan Base. In Base vuurt hij niet, en daar is er dan ook geen tekort.

M3 — DE WAT-ALS, GEMETEN. Blokken toegevoegd die VERBATIM de `structuur` van dezelfde functie
volgen; de TSS is BEWUST niet aangeraakt, zodat het effect geisoleerd blijft. Build Korte
beklimmingen gaat van 42,4 naar 72,4 en Lange beklimmingen van 56,5 naar 86,5; Peak Korte van 20,0
naar 50,0 en Lange van 27,4 naar 57,4. Per week is dat exact 30,0 werkminuten erbij.
BEGRENZINGSBEWIJS: van de 106 gemeten regels bewegen er 28 en blijven er 78 ongewijzigd, en de 28
zijn precies de vier cellen waarin de arm vuurt. De as-metriek — `intent.high` plus
`intent.anaerobic` — beweegt geen minuut: 65 / 65 / 71 / 65 / 60 / 65 / 86 voor en na. Het PLAN
verandert dus niet; alleen wat het plan over zichzelf declareert.

M4 — DE POORT VAN PUNT 14 KEERT HET OORDEEL OM IN PEAK, EN FASE 1 LOST DAT NIET OP. Vandaag leest
Korte beklimmingen in Peak 7 van de 7 weekvormen als GELEVERD, op 16,5 tot 31,0 werkminuten tegen
een norm van 78. De poortset is daar uitsluitend `anaeroob`, met norm 12 en geleverd 13,5: het enige
wat beoordeeld wordt is precies de zone die klopt. Met de blokken erbij komt `tempo` in de poortset
en blijft de uitkomst 7 van 7. Dit is dus GEEN gevolg van fase 1 en wordt er ook niet door
gerepareerd; het hoort bij fase 2.

## 2. Het besluit

FASE 1 SLUIT HET GAT IN DE MUNT EN RAAKT DE INHOUD VAN HET PLAN NIET. De sessie behoudt haar naam,
haar `structuur`, haar `intent`, haar `zones`, haar `totaalMin` en haar `tss`. Wat erbij komt is
`blokken`, zodat deze sessie haar zones declareert zoals elke andere sessie in de app dat doet.

WAAROM DIT VOOR DE DOSISVRAAG GAAT. Zolang een derde van de kwaliteit buiten de munt valt, is niet
vast te stellen of er te weinig van is. Een dosisregel die op de huidige meting wordt geijkt, ijkt
op een instrument met een gat — dezelfde fout als een meting waarvan de eigen uitvoer nullen toont
waar getallen horen.

ER KOMT GEEN NIEUW GETAL IN DE PLANNER. Alle waarden staan al in de `structuur` van dezelfde
functie: warmup 15 minuten op 55 tot 70 procent, een Z2-basis van `baseMin` minuten op 65 tot 75,
drie inspanningen van 10 minuten op 85 tot 92 met 5 minuten rust ertussen, en 15 minuten uitrijden
op 55 tot 65. De enige waarde die de `structuur` niet noemt is het percentage van de intra-rust; die
is daarom NIET DRAGEND gemaakt: de acceptatie asserteert dat die blokken het label `rust` dragen,
niet welk getal eronder zit. Elke waarde onder 56 procent valt in `rust`, en `rust` doet in geen
enkel oordeel mee.

DE BLOKKEN DEKKEN `totaalMin`, NIET `intent.low`. Die twee lopen vandaag 5 minuten uiteen: `fixed`
rekent 45 minuten voor de efforts-sectie, dus drie rusten van vijf, terwijl `intent.low` er tien
telt, dus twee. Het verschil zit UITSLUITEND in rust en raakt geen enkele werkzone. De blokken
volgen `totaalMin`, want de zone-balk hoort de hele sessie te dekken; `intent` blijft ONGEWIJZIGD,
want dat veld voedt `zoneDebt_` en de dekking-afleiding. De inconsistentie zelf gaat naar de
parkeerlijst.

## 3. Wat hier NIET in zit

- DE TSS. `tss` blijft `Math.round(totaalMin * 0.85)` en gaat NIET naar `tssFromBlokken_`. Dat zou
  wel een gedragswijziging zijn, en de wat-als hierboven meet hem niet. Eigen ronde.
- DE DOSISVRAAG ZELF. Ook met de blokken erbij blijft Build Korte beklimmingen op 68,5 tegen 78 en
  Peak op 46,5 met twee kwaliteitsdagen. Dat is fase 2, en pas dan is een acceptatie-eis te stellen
  die de ingreep kan halen.
- DE POORT-OMKERING IN PEAK uit M4.
- DE INTENSITEIT VAN DE EFFORTS. De band 85 tot 92 procent heeft haar midden op 88,5 en draagt
  daarmee het nominale label `tempo`, terwijl `DOELEN-SPEC` §3.3 voor dit doel juist herhaalbare
  BOVENDREMPEL-inspanningen laat in de lange rit vraagt. Genoteerd, niet gebouwd; hoort bij fase 2.

## 4. Wat er gebouwd wordt

4.1 `genericCombo`, uitsluitend de tak `type === "combo_long_with_efforts"`: voeg `blokken` toe aan
    het retour-object, in de volgorde van de `structuur` en sommerend tot `totaalMin`. Warmup,
    Z2-basis, dan drie keer de combinatie inspanning plus rust, dan uitrijden. Elk blok draagt
    `minuten`, `pctLo`, `pctHi` en `zone`, waarbij `zone` uit `pctZoneBucket_` komt op het midden van
    de eigen band — hetzelfde patroon als `expandArchetype_` en `genericLongZ2`, geen eigen mapping.

4.2 `naam`, `focus`, `zones`, `totaalMin`, `structuur`, `intent`, `tss`, `eindopmerking` en
    `tooLong` blijven ONGEWIJZIGD, byte voor byte.

4.3 GEEN ANDERE TAK VAN `genericCombo` WORDT GERAAKT.

## 5. Acceptatie

- ROOD PER TERM, EN PER PLEK. Draai de bouwer-assertie en de keten-assertie los, met alleen de
  betreffende kant teruggedraaid, en noteer welke tests vallen. Een term die nergens rood wordt is
  niet gedekt: melden en stoppen.
- DE BOUWER. Roep `genericCombo` met type `combo_long_with_efforts` rechtstreeks aan en vouw zijn
  `blokken` met `planZone5_`. Assertie: de som van tempo, drempel en anaeroob is 30,0 binnen een
  tiende minuut, en de som van alle vijf zones is gelijk aan `totaalMin`. Assertie dat de drie
  intra-rust-blokken het label `rust` dragen.
- DE KETEN, MET DE PRODUCENT IN DE LUS. Bouw met `buildWeekProposal` een week voor doel Korte
  beklimmingen op weekvorm V1 (ma60 di60 do60 za120), `doelStart` 2026-06-29, klok gepind op
  2026-07-27, A-race 2027-04-17 — dat geeft fase Build. Vouw het resultaat met `planZone5_` over de
  rauwe blokken van de week. Assertie: de werkminuten zijn 68,5 binnen een tiende, en `tempo` zit in
  de poortset. De vorige waarde wordt NIET met de hand in een nagebouwd object gezet.
- DE VIER CELLEN EN VERDER NIETS. `weekvormAs.test.ts` draait doel FTP en dat profiel draagt
  `effortsInLangeRit: false`, dus de vingerafdruk hoort byte-identiek te blijven. De 48
  vingerafdrukken in `onderhoudInvariance.test.ts` pinnen `vt`, `naam`, `min`, `tss` en `zones` en
  raken `blokken` niet, dus ook die horen ongewijzigd groen te blijven. Beweegt er toch iets:
  melden en stoppen.
