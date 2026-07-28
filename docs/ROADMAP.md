# Cadans — ROADMAP

Dit document draagt de RICHTING; `HANDOFF.md` draagt de STAND. Een stap wordt HIER gesloten,
niet in een chat: zolang een stap hier open staat is hij open, ongeacht wat een rapport of een
gesprek suggereert. Voorrang bij tegenspraak: `docs/WERKWIJZE.md` (werkwijze) >
`docs/DOELEN-SPEC.md` (invulling per doel) > dit document (richting). Dit document wijzigt geen
code.

## Stappen

### STAP 1 — de dosis schaalt verkeerd met tijd · LOOPT

Meer uren leveren vandaag MINDER kwaliteit op. Vanaf 136 beschikbare minuten kwalificeert geen
enkel sjabloon meer en valt de dag door naar duurwerk zonder kwaliteit.

- Spec: `docs/DUUR-SELECTIEREGEL.md` (VASTGESTELD, coach-canon).
- Criterium: geen weekvorm van 6 uur of meer levert minder kwaliteitsminuten dan de weekvorm
  van 5,0 uur.
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

Stap 2, 3 en 4 zijn regelkringen BOVENOP stap 1. Een dosis-trede bovenop 45 kwaliteitsminuten
landt nog steeds onder de norm; een fase-indeling die het doel volgt verdeelt dezelfde te lage
dosis anders. Zolang stap 1 open staat meet elke volgende stap zich tegen een verkeerde basis,
en is elk resultaat daar niet van te scheiden.

## Meetlat

Bij ELKE bouw draait dezelfde weekvorm-as opnieuw, en gaan de kwaliteitsminuten én de week-TSS
in `HANDOFF.md`. Geen nieuwe as per ronde — dezelfde as, zodat de reeks over de stappen heen
vergelijkbaar blijft.

Stand vandaag (doel FTP, fase Base, mesoweek 1): 5,0u 69 · 6,0u 45 · 8,0u 45 · za240 45
kwaliteitsminuten.

## Parkeerlijst

Alles wat nu als OPENSTAAND in `HANDOFF.md` staat, ongewijzigd van strekking en zonder oordeel
over urgentie of volgorde. Deze lijst beoordeelt niet; hij verliest niet.

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
- BOUWITEM 2 STAP 2 EN 4 REIZEN SAMEN: het duur-plafond in de kandidaat-filter van
  `goalWorkout_` staat er bewust nog; eraf zonder selectieregel laat de tie-break het kortste
  sjabloon winnen. De selectieregel komt uit de coach-canon, niet uit de D1-meting.
- De dode `longride`-tak in de redenCode-mapping van `planner.ts`.
- Het commentaar bij de demotie dat in een alloc-actieve week niet meer klopt.
- `weekIndexFromStart_` herhaalt een week bij de voorjaars-DST-sprong (28-03-2027).
- De fase staat volledig in het teken van het event (`eventFase_`).
- Gat-dag-types via meegegeven datum.
- `docs/DOELEN-SPEC.md` §6 stap 3 doel-lijst herzien.

### CLIENT

- DEPLOY VAN `07de9224` WACHT OP DAANS VISUELE CHECK: de weekkaart met een pendeldag moet er
  eerst langs. Pendeldagen krijgen na deploy een zonebalk die er nu niet is — dat is de
  zichtbare verandering, naast het hogere getal.
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
- DE CTL-SIMULATIE MOET OPNIEUW: stond al open op de geijkte weging, nu ook met de pendelweging
  erin. `STAP7-RECON` §6 leunde op de oude getallen en leverde de onhoudbare "negen uur per
  week"-conclusie.
- RESIDU UIT DE MEETOPZET: de ijk-query klonterde Z5, Z6 en Z7 al samen in de kruisproducten,
  dus één tarief 3,08 dekt een mix die in een gepland VO2-blok anders ligt (Daans reeks:
  60/27/12). Splitsen vraagt een NIEUWE read-only meting; uit deze data is het niet te halen.
