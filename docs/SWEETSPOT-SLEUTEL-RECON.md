# Sweet spot als sleutelsessie — recon (ROADMAP punt 5)

Gemeten in de chat op Cadans `3ad242cf`, engine gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`. Elke uitspraak hieronder is GEDRAAID, niet gelezen.

## 1. De premisse van punt 5 is onjuist

`docs/ROADMAP.md` punt 5 stelt dat `plIntent` primair uit `coachIntentFromZones_`
(`coach.ts:114`) komt en dat het type-label alleen fallback is. Dat geldt voor de ENGINE-functie
in isolatie. In de APP is het omgekeerd: `coachPlannedArg_` (`apps/web/src/lib/schema.ts:554`)
zet `segmenten` hard op `null` (regel 564), en dat is de ENIGE constructie van het
planned-argument — gebruikt door zowel de VOLTOOID-tak (regel 581) als de GEMIST-tak (regel 659).
`coachZmFromSegs_(null)` geeft null, dus `plIntent` (`coach.ts:456-458`) komt ALTIJD uit
`intentFromType_` (`coach.ts:38`). De zone-afleiding is dood.

GEMETEN, het geval van Daans scherm gereproduceerd: `ss_overunder`
(`packages/engine/src/workouts/ftp.ts:82`, "Sweet Spot over/under 4×(2-3)") op 45 minuten geeft
45 totaalminuten en 43 TSS — exact wat op 27-07-2026 op het scherm stond — en de app-aanroep
levert plIntent `sweetspot`, `adapt` null en de copy "Geen punt — een aanvullende sessie gemist".
Diezelfde sessie MET segmenten geeft plIntent `drempel`, dus sleutelprikkel-copy MET
inhaalvoorstel. Dat is het bewijs dat het zone-pad niet is aangesloten: was het dat wel, dan had
juist dit geval wél een voorstel gekregen.

GEVOLG: de fix landt NIET in `coachIntentFromZones_`. Die functie aanpassen bouwt op een pad dat
de app niet gebruikt.

## 2. Waar de sweet-spot-minuten liggen (de gevraagde meting)

Gevouwen met `segmentsFromBlokken_` (`niveau.ts:47`) plus `coachZmFromSegs_` over de blokken die
`expandArchetype_` en `renderVariant_` zelf produceren; de grens ligt op 90% FTP
(`pctZoneBucket_`, `zones.ts:200`: tempo t/m 90, drempel 91-105).

DERTIEN sweet-spot-archetypes van de 35. ZEVEN vouwen naar `tempo`, ZES naar `drempel`, en geen
enkele wisselt binnen zijn duurband — gemeten op beide uiteinden van `duurRange`, want de
werkblokken staan vast en alleen de Z2-vulling groeit mee.

- tempo: `sweetspot_short` 24' · `sweetspot_2x10` 20' · `sweetspot_3x8` 24' ·
  `sweetspot_3x6_kort` 18' · `sweetspot_2x15` 30' · `sweetspot_lage_cadans` 21' ·
  `sweetspot_lage_cadans_lang` 36'.
- drempel: `sweetspot_long` 60' · `sweetspot_pyramid` 40' tempo plus 20' drempel ·
  `sweetspot_3x15` 45' · `sweetspot_4x12` 48' · `sweetspot_overunder` 18' plus 18' ·
  `sweetspot_long_climb` 50'.

VIJF varianten in de `sweet_spot`-pool: `ss_2x20`, `ss_2x30` en `ss_pyramide` vouwen naar `tempo`,
`ss_3x15` en `ss_overunder` naar `drempel`.

Zou het zone-pad worden aangesloten, dan verliest MEER DAN DE HELFT van de sweet-spot-bibliotheek
zijn sleutelstatus — precies andersom dan punt 5 aanneemt.

## 3. Het broertje: het zone-pad kan een écht sleutelsjabloon degraderen

`vo2_microburst` draagt over zijn hele band (35 t/m 70 minuten) 5 anaerobe minuten, tegen de
significantiedrempel `max(8, 12% van het totaal)` in `coachIntentFromZones_`. Het zone-pad noemt
die sessie daarom `duur` — geen sleutelprikkel. `coachIntentFromZones_` is geschreven als
classificator voor wat GEREDEN is; als oordeel over wat GEPLAND is draagt hij een drempel die een
korte, harde sessie wegdrukt. De sleutel-vraag hoort niet aan die functie te hangen.

## 4. BESLUIT — de fix, twee termen in `coach.ts`

(1) `COACH_KEY_INTENTS_` (`coach.ts:72`) krijgt `sweetspot`. HERKOMST: PLAN — het volgt uit
`DOELEN-SPEC` §3.1, waar sweet spot bij doel FTP dragend is, en uit de blok-referent die sweet
spot al als kwaliteit telt. Er valt niets aan te ijken op een reeks.

(2) `isKey` (`coach.ts:463`) verankert AANVULLEND op het geplande TYPE: sleutel als de
zone-afgeleide intent in de lijst staat OF als `intentFromType_(planned.type)` erin staat. Strikt
additief — het kan sleutelstatus alleen TOEVOEGEN, nooit wegnemen — en vandaag per constructie
inert, want plIntent is vandaag altijd de type-afgeleide. Hij draagt het criterium uit punt 5
letterlijk: een geplande sweet-spot-sessie is een sleutelsessie, ongeacht waar zijn minuten in de
zone-indeling vallen.

ROOD PER TERM, gemeten met de fix per stuk uit:

- Term 1 uit: type `sweet_spot`, `segmenten` null → `adapt` null. Met term 1 aan → voorstel.
- Term 2 uit: type `sweet_spot` met segmenten die naar `tempo` vouwen → plIntent `tempo` en
  `adapt` null, ook MET term 1 aan. Term 1 dekt die tak per constructie niet.

BLAST RADIUS. `COACH_KEY_INTENTS_` heeft één lezer: `isKey` op `coach.ts:463`. `isKey` voedt
uitsluitend de missed-tak en de lichter- en intensiever-takken van `coachCopy_`; de on-plan-tak en
de different-tak-met-gelijke-intent raken hem niet. Verwachte zichtbare verandering: een gemiste
of lichter gereden sweet-spot-dag krijgt sleutelprikkel-copy plus een inhaalvoorstel.

## 5. Aparte post, NIET in deze bouw — de geplande segmenten komen nooit aan

Omdat het planned-argument zonder segmenten meegaat ligt niet alleen de sleutel-vraag stil maar de
hele zone-afleiding van de geplande prikkel: het type-label, de badge-zone en de
gelijke-intent-tak van de different-copy leunen op het grove type in plaats van op de werkelijke
zone-verdeling. Of dat aangesloten hoort te worden is een eigen vraag. VOLGORDE-EIS als het
gebeurt: pas NA de type-verankering uit paragraaf 4, anders verliezen zeven sweet-spot-archetypes
en `vo2_microburst` stil hun sleutelstatus.
