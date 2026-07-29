# Cadans — DOSIS-MUNT RECON

Meetronde-verslag. Geen bouw. Ruwe meetdata: `docs/DOSIS-MUNT-MEETDATA.md`.

## 1. Instrument

Gereden kant uit de read-only D1-dump (217 rijen vanaf 2025-09-01, 173 fietsritten met
geldige zone-blob), gevouwen met `weekKwaliteitMinuten` uit `apps/web/src/lib/blok.ts` —
de functie die de app zelf aanroept, gebundeld met esbuild buiten de repo-tree onder
TZ=Europe/Amsterdam. Plan-kant met `expandArchetype_` over alle 35 archetypes.

GEVALIDEERD VOOR GEBRUIK. Op het venster van 26 weken vanaf 19-01-2026 reproduceert het
instrument de reeks uit `docs/UITVOERINGS-REFERENT-RECON.md`: mediaan 76 tegen de daar
genoteerde 77,5, maximum 248 exact gelijk.

## 2. De gereden kant, zoals intervals hem levert

Minuten over 173 fietsritten: Z1 2591 · Z2 7402 · Z3 2014 · Z4 979 · Z5-7 765 ·
SS 1111 (overlay). Zone-grenzen uit sport-settings: `power_zones [55,75,90,105,120,150,999]`,
dus Z1 t/m 55 · Z2 56-75 · Z3 76-90 · Z4 91-105 · Z5 106-120 · Z6 121-150 · Z7 boven 150.
`sweet_spot_min` 84, `sweet_spot_max` 97.

## 3. SS is een OVERLAY, en blijft uit de som

Op alle 173 rijen geldt SS kleiner dan of gelijk aan Z3+Z4, en Z1..Z7 sommeert tot de
ritduur binnen 30 seconden. Optellen zou dubbeltellen. SS ligt bovendien dwars over de
Z3/Z4-grens (84-97 tegen een grens op 90) en intervals levert die splitsing niet, dus SS
kan geen zesde band worden. BESLUIT: SS telt nooit mee in een som; hoogstens later als
diagnostisch label.

## 4. De plan-kant op diezelfde zones

Het plan draagt per blok `pctLo` en `pctHi`, dus het is exact op elke zone-indeling te
leggen. Over alle 35 archetypes, gebucket op de zones hierboven: Z1 607 · Z2 428 ·
Z3 251 · Z4 553 · Z5 137 · Z6 33.

NUL van de 35 archetypes schrijft werkminuten onder 84% FTP voor. De grijze band bestaat
in het plan niet.

## 5. De asymmetrie, in één verhouding

Voorgeschreven werk: Z3 251 tegen Z4+ 723 — 26% tegen 74%.
Geleverd werk: Z3 2014 tegen Z4+ 1743 — 54% tegen 46%.

Dat is de hele bevinding, en ze staat volledig in de zones die intervals zelf levert.
Er is GEEN zone-grenswijziging, GEEN custom zone en GEEN SS-splitsing voor nodig: grijs
rijden verschijnt als een Z3-overschot met een Z4-tekort zodra je per zone vergelijkt in
plaats van op één hoop.

## 6. Wat de huidige munt met het oordeel doet

Vandaag telt `weekKwaliteitMinuten` alles vanaf 76% FTP als kwaliteit (`high` = Z3+Z4,
plus `anaerobic`). Over 46 weken met ritten halen er 24 de norm van 84. Rekent men de
kwaliteit vanaf 84% FTP, dan zijn dat er hoogstens 8 en minstens 3; zestien weken kantelen
met zekerheid van GELEVERD naar NIET GELEVERD. Van de 3757 minuten die de app als geleverde
kwaliteit boekt ligt tussen 1068 en 1687 minuut onder 84% FTP — 28 tot 45 procent.

De norm zelf is NIET te hoog. Het plan bevat werkelijk circa 28 minuten boven 84% per
sleutelsessie, dus 3 maal 28 klopt met wat de sjablonen dragen. In jouw zones komt die norm
neer op circa 62 minuten Z4+ per week; geleverd is de mediaan 31, en 6 van de 46 weken halen
de 62. De meetlat was niet te streng, de teller was te gul.

GEVOLG VOOR DE BLOK-CHECK. Waar de app concludeerde "geleverd maar niet gestegen, dus het
plan was te licht, dus dosis omhoog", luidt het antwoord in de juiste munt meestal "niet
geleverd, dus dosis NIET omhoog" (`DOELEN-SPEC` §2A). Het dosis-trede-voorstel dat nu open
staat rekent in de oude munt en hoort niet geaccepteerd te worden vóór deze correctie.

## 7. Correcties op eerdere claims

- HANDOFF stelde dat het plan NUL tempo voorschrijft. Dat gold voor één weekvorm. Zeven
  sweetspot-sjablonen zetten 100% van hun werkminuten in `tempo`, en dat zijn precies de
  korte van 34 tot 56 minuten — de Onderhoud-winterband.
- De oorzaak daarvan is een afrondingsgrens, geen trainingskeuze. `pctZoneBucket_` zet 90 en
  lager op tempo en 91 en hoger op drempel; 88-92 geeft midden 90, 88-93 geeft midden 90,5 en
  daarmee 91. Eén procentpunt op de bovengrens kantelt het label van identiek werk. Dat zit
  ook in de TSS: `tssFromBlokken_` weegt tempo 1,14 en drempel 1,35 per minuut.
- Het commentaar bij `ZONE_TSS_RATE_` (`packages/engine/src/zones.ts`) klopt over de GRENZEN —
  die vallen samen met de gemeten `power_zones`. ONWAAR is uitsluitend de zin dat
  `tryPowerZoneTimes_` Z1..Z7 identiek opvouwt: die vouwt naar DRIE buckets, niet naar vijf.
  Regel aanscherpen bij de volgende aanraking.
- HANDOFF noemde sweet spot 88-97. Gemeten is 84-97.

## 8. Richting van het ontwerp

De zones komen uit de sport-settings van de gebruiker zelf, net zoals FTP dat al doet, en
worden een gesynchroniseerde instelling. Het plan wordt op diezelfde grenzen gebucket — een
mapping op de bestaande `pctLo`/`pctHi`, geen nieuwe data. Gevraagd en geleverd komen per
zone naast elkaar te staan, nooit als saldo (`docs/WERKWIJZE.md`, bewaar de termen). Een
nieuwe gebruiker brengt zijn eigen zones en zijn eigen data mee; er is niets per gebruiker
met de hand vast te leggen.

## 9. Wat open blijft

- De NORM per zone. Vandaag is het één getal in één pot (prikkels maal minuten-per-prikkel).
  Per zone wordt het een vorm. Of die vorm uit het plan zelf gelezen wordt of afgeleid blijft
  uit doel en uren, is een ontwerpvraag; `docs/UITVOERINGS-REFERENT-RECON.md` §2.5 stelde
  eerder vast dat de bewaarde weekblob GEEN weekdosis is.
- `indoor_ftp` 260 tegen `ftp` 280. Intervals scoort een indoor-rit tegen 260 terwijl het plan
  zijn watts uit 280 rekent, dus dezelfde sessie landt indoor een zone hoger. In deze reeks
  14 ritten en 637 minuten. Eigen post.
- De vier andere lezers van de 3-bucket-munt zijn NIET onderzocht in deze ronde:
  `zoneDebt_` (`packages/engine/src/weekprep.ts`), de dekking- en doneHard-afleidingen in
  `apps/web/src/lib/proposal.ts`, en `LOAD_TSS_RATE_`. Blast radius vaststellen hoort bij het
  ontwerp.
- `actualZone5_` (`apps/web/src/lib/schema.ts`) doet de 5-bucket-vouwing van gereden data al,
  getest en met GAS-parity, en voedt de ritdetail- en done-zonebalken. De blok-referent
  gebruikt hem niet. Bij het ontwerp hoort de vraag of die twee samengaan.
