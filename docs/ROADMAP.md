# Cadans — ROADMAP

Dit document draagt de RICHTING; `HANDOFF.md` draagt de STAND. Een stap wordt HIER gesloten,
niet in een chat: zolang een stap hier open staat is hij open, ongeacht wat een rapport of een
gesprek suggereert. Voorrang bij tegenspraak: `docs/WERKWIJZE.md` (werkwijze) >
`docs/DOELEN-SPEC.md` (invulling per doel) > dit document (richting). Dit document wijzigt geen
code.

## Stappen

### STAP 1 — de dosis schaalt verkeerd met tijd · AF

Meer uren leverden MINDER kwaliteit op: vanaf 136 beschikbare minuten kwalificeerde geen enkel
sjabloon meer en viel de dag door naar duurwerk zonder kwaliteit.

Opgelost door het duur-plafond te LATEN STAAN — binnen de bibliotheek-band doet het echt werk,
het weert korte sjablonen van middellange dagen — en er een fallback boven te zetten. Levert de
kandidaat-filter nul kandidaten, dan volgt een tweede pass zonder plafond, gesorteerd op langste
band eerst en bij gelijke band het zwaarste sjabloon.

- Spec: `docs/DUUR-SELECTIEREGEL.md`. §3 draagt de WEERLEGDE eerste poging (een doelwerktijd-regel
  zonder plafond) met de meting die hem omver haalde.
- Gemeten op de weekvorm-as: kwaliteitsminuten 69 / 45 / 45 / 45 / 64 werd 69 / 81 / 45 / 81 / 64.
  V1, V3 en V5 tot op de minuut ongewijzigd — de fallback vuurt nergens binnen de band.
- Bouw-commit `ff2baf8`. NIET GEDEPLOYED.

### STAP 1b — de lange dag pakt geen kwaliteitsslot · OPEN

Het KWALITEITSQUOTUM bleek een deel van het antwoord, niet alleen de efforts-arm.
`PROFILES.ftp.kwaliteitPerWeek.Base` stond op 2 terwijl `DOELEN-SPEC` §3.1 vanaf vijf
gedeclareerde uren drie sleutelprikkels voorschrijft. Op 3 gezet (commit `f020c2a`) steeg elke
weekvorm, en V3 ging van 45 naar 77 kwaliteitsminuten.

Wat RESTEERT is het oorspronkelijke gat. Ook met drie slots pakt de lange dag geen
kwaliteitsslot: de efforts-arm in `allocateQualityWeek_` vuurt alleen bij macrofase Build of
Peak, dus in Base krijgt een zaterdag van drie uur duurwerk terwijl de kortere dagen de
kwaliteit dragen. `goalWorkout_` komt er niet aan te pas — de duur-selectieregel uit STAP 1 kan
dit dus niet oplossen.

- Gemeten op weekvorm V3 (ma70 di70 do70 za180 zo90, 8,0 uur, doel FTP, fase Base, mesoweek 1):
  77 kwaliteitsminuten, tegen een norm van 84 bij vijf gedeclareerde uren. Als enige van de zes
  vormen blijft V3 onder de norm, en de reden is dat za180 geen kwaliteitsslot krijgt.
- Criterium: een lange dag kan ook in Base een kwaliteitsslot dragen, zonder dat de weken
  daaronder inleveren.
- `spreiding.midweekMinGap` is NIET de hendel: gemeten is dat quotum 3 mét midweekMinGap 0
  byte-identiek is aan quotum 3 met 1.
- DE VO2-GRENS. Boven 135 minuten kan de fallback uit stap 1 bij intent `vo2` hoogstens 28
  nominale werkminuten leveren: de vo2-band houdt op bij 100 minuten en die sjablonen zijn kort
  van ontwerp. Een lange dag met vo2-intent haalt de 45-werkminuten-eis dus niet, en dat is geen
  fout in de fallback maar een grens van de bibliotheek.
- Raakt: ENGINE.

### STAP 2 — er is geen plek waar dosis wordt vastgehouden · OPEN

De blok-check concludeert inmiddels twee blokken achtereen "het plan was te licht", en niets
onthoudt dat. Elk blok begint op hetzelfde niveau; de conclusie verdampt zodra de kaart weg is.

- Vraagt een kolom, en daarmee een migratie.
- Criterium: een blok-check verhoogt aantoonbaar de norm van het volgende blok — als VOORSTEL
  met bevestiging, niet stilzwijgend.
- Raakt: ENGINE, DATA (migratie), CLIENT.

### STAP 3 — het doel stuurt de periodisering niet · OPEN

De fase hangt volledig aan het event (`eventFase_`): dertig weken ononderbroken Base. Het
INGESTELDE doel doet aan de fase-indeling niets.

- Inclusief EVENT als doel-optie.
- Raakt `docs/DOELEN-SPEC.md` — die moet mee wijzigen.
- Criterium: het doel stuurt de fase, en de event-overname is een VOORSTEL.
- Raakt: ENGINE.

### STAP 4 — twee kaarten spreken los over hetzelfde blok · OPEN

De doortrain-kaart en de terugblik doen elk een eigen uitspraak over hetzelfde trainingsblok,
zonder van elkaar te weten.

- Criterium: een blok krijgt ÉÉN uitspraak, niet twee.
- Raakt: CLIENT.

## Waarom deze volgorde

Stap 2, 3 en 4 zijn regelkringen BOVENOP stap 1. Een dosis-trede bovenop een te lage basis landt
nog steeds onder de norm; een fase-indeling die het doel volgt verdeelt dezelfde te lage dosis
alleen anders. Daarom ging stap 1 eerst, en daarom staat de weekvorm-as er nu als test: elke
volgende stap meet zich tegen die basis en tegen niets anders.

Stap 1b is wat er van stap 1 overblijft. De as laat het staan: V3 levert op acht uur nog steeds
45 kwaliteitsminuten, want daar krijgt de lange dag helemaal geen kwaliteitsslot. Dat zit in de
allocator, niet in de sjabloonkeuze.

## Meetlat

Bij ELKE bouw draait dezelfde weekvorm-as opnieuw, en gaan de kwaliteitsminuten én de week-TSS
in `HANDOFF.md`. Geen nieuwe as per ronde — dezelfde as, zodat de reeks over de stappen heen
vergelijkbaar blijft.

De as staat als test in `apps/web/src/lib/weekvormAs.test.ts`, met een HARDE invariant dat V1,
V3 en V5 niet mogen dalen, en de volledige reeks als vingerafdruk. De invariant wordt niet
herijkt; de vingerafdruk mag dat wel, bewust en verantwoord.

De as draagt ZES vormen. V6 meet een week IN UITVOERING — zelfde dagen als V1, maar "vandaag" is
dinsdag en de maandag is verstreken zonder rit. V1 t/m V5 liggen volledig vooruit, dus zonder V6
werd de normale situatie nergens gemeten. V6 staat NIET in de invariant-lijst; die blijft V1, V3
en V5.

Stand na het derde kwaliteitsslot (doel FTP, fase Base, mesoweek 1), kwaliteitsminuten:
V1 5,0u 93 · V2 8,0u 113 · V3 8,0u 77 · V4 7,0u 105 · V5 7,0u 84 · V6 in uitvoering 93.
Week-TSS: 268 · 410 · 437 · 362 · 352 · 227. Norm bij vijf gedeclareerde uren is 84; alleen V3
blijft daaronder.

## Parkeerlijst

Ongewijzigd van strekking en zonder oordeel over urgentie of volgorde. Deze lijst beoordeelt
niet; hij verliest niet. Een punt gaat eruit zodra een STAP het opneemt — niet eerder.

### ENGINE

- REST VAN DE VLAK-TARIEF-FAMILIE (circa 30 builders), niet naïef te behandelen: hun structuur
  draagt reps-notatie ("3x 14 min", "4x 30 sec"), dus de werkminuten zijn niet als platte
  minuten afleesbaar, en hun werkblokken liggen in drempel en anaeroob — juist de twee besmette
  zones. Vraagt per-builder werk.
- `tour_taper_z2`: drie platte regels, maar met een rust-cooldown van 5 min zonder voorafgaand
  hard blok. Besmette categorie, effect circa 1 TSS. Blijft staan.
- `genericRecovery` capt de duur hard op 60 min: een deloaddag met 90 beschikbare minuten wordt
  een rit van 60. Coach-canon, maar de resterende tijd verdwijnt stil uit het plan.
- `combo_long_with_efforts` reist mee met bouwitem 2 stap 2 en 4; `pendel_intervals` is alleen
  in een Test-week bereikbaar.
- De dode `longride`-tak in de redenCode-mapping van `planner.ts`.
- Het commentaar bij de demotie dat in een alloc-actieve week niet meer klopt.
- `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (28-03-2027).
- `kwaliteitPerWeek.Peak` staat voor doel FTP nog op 2 en draagt daarmee hetzelfde norm-gat dat
  in Base is gedicht. Niet geraakt; Base was de gemeten fase.
- Gat-dag-types via meegegeven datum.

### CLIENT

- VISUELE CHECK — DE PENDEL-ZONEBALK. Gedeployd; nog niet met eigen ogen gezien. Een pendeldag
  hoort sinds `07de9224` een zonebalk te dragen die er eerder niet was, naast een hoger getal.
- SCREENSHOTS VANUIT CC LUKTEN NIET: de Browser-pane wordt niet weergegeven, de pagina
  componeert geen frames, elke poging valt na 5 seconden om. Er is niets geïnstalleerd. Voor
  een volgende poging: dev-server `127.0.0.1:5173`, route `/weekplanner` voor de dagkaart en
  `/` voor de weekkaart, lokale API op `8787`.
- UP-fixture in `Preview.tsx` realistischer maken.
- Weken-terug-scrollen in de Schema-tab.
- De weekreeks-fixture staat op drie plekken.

### DATA

- GEMENGDE WEGING, één overgangsweek: bewaarde weekplannen van verstreken dagen houden hun oude
  getal; `workoutFromFrozenEntry` leest opgeslagen TSS verbatim. Precies zoals bij de vorige
  ijking.
- RESIDU UIT DE MEETOPZET: de ijk-query klonterde Z5, Z6 en Z7 al samen in de kruisproducten,
  dus één tarief 3,08 dekt een mix die in een gepland VO2-blok anders ligt (Daans reeks:
  60/27/12). Splitsen vraagt een NIEUWE read-only meting; uit deze data is het niet te halen.
