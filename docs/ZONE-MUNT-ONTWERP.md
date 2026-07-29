# Cadans — ZONE-MUNT ONTWERP

Ontwerpdoc, GEEN bouw. Voortzetting van `docs/DOSIS-MUNT-RECON.md` §8 en §9: de blast
radius is vastgesteld en het ontwerp staat. Bouwen pas na review.

## 1. Instrument

Engine gebundeld met esbuild buiten de repo-tree, TZ=Europe/Amsterdam, gedraaid tegen
Cadans `8abce1a`. Plan-kant met `expandArchetype_` over alle 35 archetypes bij ftp 280 en
lthr 178, zonder meso- of trede-factor. Zone-grenzen uit de gemeten sport-settings:
`power_zones [55,75,90,105,120,150,999]`.

GEVALIDEERD VOOR GEBRUIK. Met de HUIDIGE bucketing (het afgeronde midden van de band)
reproduceert het instrument `DOSIS-MUNT-RECON` §4 exact: Z1 607 · Z2 428 · Z3 251 ·
Z4 553 · Z5 137 · Z6 33 · Z7 0. Het gemiddelde per sjabloon boven 84% FTP komt op 27,8
minuten, tegen de "circa 28 per sleutelsessie" uit §6.

LOCATIE-ANKERS. De vijftien ankers in dit document zijn mechanisch getoetst op bestand,
regel en substring: veertien raak in één keer, één correctie (`archetypes.ts` 152 → 153).

## 2. Blast radius — zes lezers, twee banen

BAAN 1, DE BLOK-BAAN, BEWEEGT MEE. Eén lezer: `weekKwaliteitMinuten`
(`apps/web/src/lib/blok.ts:178`) telt kwaliteit als `high + anaerobic` en voedt de
uitvoerings-referent, de blok-check en daarmee de dosis-trede. Dat is de bevinding uit §6
van de recon, en verder niets.

BAAN 2, DE WEEK-BAAN, BLIJFT STAAN. Vier lezers, elk met een eigen reden.
- `zoneDebt_` (`packages/engine/src/weekprep.ts:107`) draagt de WEEK-vraag ("niet gedaan")
  met zijn eigen venster [maandag .. vandaag) en de M63-fork. `blok.ts` verklaart die
  scheiding in zijn eigen kop al: week uit de blob, blok uit de norm.
- `rollingZoneCoverage_` (`weekprep.ts:66`) telt DAGEN, niet minuten, en valt zonder intent
  terug op IF (idx7). De munt raakt hem niet.
- De dekking-verfijning (`apps/web/src/lib/proposal.ts:432`) en de doneHard-afleiding
  (`proposal.ts:526`) zijn DREMPEL-checks op `DEKKING_MIN_MIN` 15 (`planner.ts:51`), geen
  dosis-sommen. Een verfijning naar vijf zones verschuift daar hoogstens de rand.
- `LOAD_TSS_RATE_` (`packages/engine/src/zones.ts:256`) voedt `tssFromZoneMinutes_`
  (`zones.ts:282`), en die heeft nog ÉÉN aanroeper: de pendel-TSS (`planner.ts:2381`).
  Alles mét blokken loopt via `tssFromBlokken_` op de vijf-zone-tarieven.

GEVOLG, EN DIT KEERT DE PREMISSE VAN DE HANDOFF-FOCUS OM: fase 1 raakt de ENGINE NIET en
vraagt GEEN migratie.
- De gereden kant heeft de vouwing al: `actualZone5_` (`apps/web/src/lib/schema.ts:349`),
  getest en met GAS-parity op `coachActualZoneMin_`.
- De plan-kant heeft de data al: elk blok draagt `pctLo`/`pctHi` naast `minuten` en `zone`
  (`archetypes.ts:153`), en de bewaarde weekplan-blob draagt `blokken` mee.
- ÉÉN complicatie: `schema.ts:48` importeert uit `blok.ts`, dus `blok.ts` kan
  `actualZone5_` niet terugimporteren. De vouwing verhuist naar een eigen module die BEIDE
  kanten van de munt huisvest — een verplaatsing, geen kopie.

## 3. Twee metingen die het ontwerp beslissen

3.1 DE AFRONDINGSKLIP IS ECHT MAAR NIET DRAGEND. Proportioneel verdelen over
[pctLo .. pctHi] in plaats van op het afgeronde midden geeft Z1 607 · Z2 394 · Z3 284 ·
Z4 567 · Z5 129 · Z6 27 · Z7 0. Z4+ blijft EXACT 723; er verschuift 34 minuten van Z2 naar
Z3. De kopbevinding beweegt van 26/74 naar 28/72, dus niets. Op SJABLOON-niveau kantelt het
wél: onder midpunt zetten ZEVEN sjablonen 100% van hun werk in Z3 (`sweetspot_short`,
`sweetspot_2x10`, `sweetspot_3x8`, `sweetspot_3x6_kort`, `sweetspot_2x15`,
`sweetspot_lage_cadans`, `sweetspot_lage_cadans_lang`), proportioneel nog één
(`sweetspot_2x15`). Hun band ligt dwars over 90 en wordt dan half om half gesplitst.

3.2 DE GEVRAAGDE VORM MAG NIET UIT DE GERENDERDE WEEK KOMEN. `threshold_2x20` vraagt Z3 0,0
en Z4+ 40,0; `sweetspot_2x15` vraagt Z3 30,0 en Z4+ 0,0. Twee even geldige sleutelsessies
binnen hetzelfde doel, met tegengestelde vorm. Een norm die de week uitleest zwaait dus mee
met de variant-rotatie van de recency-seed — ruis bemonsteren, en bovendien circulair
(`UITVOERINGS-REFERENT-RECON` §2.5 sloot de blob al uit als weekdosis).

3.3 BIJVANGST — HET PLAN KENT GEEN GRIJZE BAND. Per sjabloon liggen de minuten boven 84%
en boven 76% vrijwel gelijk; het grootste verschil zit in de vo2-sjablonen
(`vo2_microburst` 5,0 tegen 7,4). Dat bevestigt §4 langs een tweede weg: onder 84% FTP
schrijft het plan geen werk voor.

3.4 DE BANDEN VERSCHILLEN STERK. Winterband 33-56 minuten, 18 sjablonen: mediaan 20,0
minuten boven 84%, mediaan Z4+ 16,0, mediaan Z3 3,0. Lange band vanaf 80 minuten, 6
sjablonen: 50,0 · 36,0 · 18,0. Over alle 35: mediaan 24,0 boven 84%, gemiddeld 27,8.

## 4. Het ontwerp

VIJF ZONES, NIET ZEVEN. Z5 tot en met Z7 vouwen tot anaeroob, zoals `actualZone5_` en
`pctZoneBucket_` (`zones.ts:200`) allebei al doen. Grond: het plan schrijft over de hele
bibliotheek 33 minuten Z6 voor en 0 Z7; een zesde en zevende band blijven per constructie
leeg.

DE GRENZEN KOMEN UIT DE SPORT-SETTINGS, MET DE HUIDIGE WAARDEN ALS DEFAULT. De eerste vier
bovengrenzen uit `power_zones` zijn de vier grenzen van de vijf-zone-indeling. Ontbreken
ze, dan geldt [55, 75, 90, 105] — exact wat `pctZoneBucket_` vandaag hardcodeert. Daarmee
is fase 1 inert tot de sync er is, en brengt een nieuwe gebruiker zijn eigen indeling mee
zonder dat er iets per gebruiker met de hand vastligt.

DE PLAN-KANT WORDT PROPORTIONEEL GEBUCKET, EN UITSLUITEND VOOR DE NIEUWE MUNT. `blok.zone`,
`intent`, `ARCHETYPE_LOAD_FROM_BUCKET_` (`archetypes.ts:35`) en de TSS-ijking blijven
byte-identiek: `ZONE_TSS_RATE_` is op de MIDPUNT-bucketing geijkt en mag niet meeschuiven.
De nieuwe vouwing is een LEESFUNCTIE over `blokken`, geen wijziging aan wat de engine
produceert.

GEVRAAGD EN GELEVERD KOMEN PER ZONE APART, NOOIT ALS SALDO. En het oordeel: EEN OVERSCHOT
IN EEN LAGERE ZONE COMPENSEERT NOOIT EEN TEKORT IN EEN HOGERE. Dat is de
grijs-rijden-diagnose in één regel — een Z3-overschot mét een Z4-tekort — en dezelfde regel
als "bewaar de termen" uit `WERKWIJZE.md`.

DE NORM HOUDT ZIJN SCHAAL EN KRIJGT EEN VORM. De schaal blijft prikkels ×
minuten-per-prikkel × dosis-trede (`blokDosisNorm`, ongewijzigd). De VORM komt uit de
BIBLIOTHEEK-SIGNATUUR van het doel, niet uit de gerenderde week (§3.2). Op de proportionele
bucketing is die signatuur 28/72, dus bij vijf gedeclareerde uren wordt 84 minuten
24 Z3 en 60 Z4+ — binnen een minuut van de 62 uit `DOSIS-MUNT-RECON` §6, die op midpunt
rekende. De methodekeuze verplaatst de norm dus niet.

## 5. Fasering

1. CLIENT-ONLY: de vouwing naar een eigen module, de plan-kant proportioneel, de referent
   per zone, met default-grenzen. Geen engine, geen migratie, geen sync. STOP.
2. DE ZONE-SYNC: read-only GET op de sport-settings, een kolom op `settings`, de migratie,
   en de sync-route naast de bestaande. STOP.
3. DE WEEK-BAAN: alleen als de meting uit fase 1 daar aanleiding toe geeft. Vandaag is er
   geen enkele.

## 6. Wat open blijft

- DE DREMPEL VOOR "GELEVERD" PER ZONE is NIET vastgelegd. Die hoort op de echte reeks
  geijkt en op een plateau te liggen (`WERKWIJZE.md`). Fase 1 levert de termen; de grens
  komt daarna, met de 46 weken uit de dump ernaast.
- `indoor_ftp` 260 tegen `ftp` 280 — ongewijzigd een eigen post. Dezelfde sessie landt
  indoor een zone hoger; 14 ritten en 637 minuten in de gemeten reeks.
- DE HISTORISCHE GRENZEN. Elke activiteit draagt `icu_power_zones` mee — gemeten
  [55,75,90,105,120,150,999] — dus een latere zone-wijziging is per rit te herleiden. Nu
  niet gebouwd: de grenzen staan sinds het begin van de reeks stil. Genoteerd zodat het bij
  een wijziging geen verrassing is.
- HET DOSIS-TREDE-VOORSTEL rekent in de oude munt. BESLUIT (Daan, 29-07-2026): AFWIJZEN.
  Dat legt de blokstart vast zodat het dit blok niet terugkomt; op de volgende blokgrens
  komt de vraag terug in de nieuwe munt.
