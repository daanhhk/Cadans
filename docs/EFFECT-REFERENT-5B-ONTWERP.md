# Effect-referent (stap 5b) — ontwerp

Volgt op `docs/EFFECT-REFERENT-RECON.md` (recon) en `docs/FTP-REFERENT-RECON.md` (de meter is
drift-immuun). Alle getallen zijn geijkt op de ECHTE reeks: 54 weken, 2025-07-14 tot en met
2026-07-20, dertien beoordeelbare blokken van vier weken. Geen code gewijzigd.

## 1. De meter

`rolling_ftp` uit `activities` (idx14), absolute watts. EEN reeks door alle sport-types heen —
GEMETEN: de indoor-rit van 22-01-2026 draagt `rolling_ftp` 276, gelijk aan de buitenritten van
die week, terwijl zijn `icu_ftp` 260 is tegen hun 275. Niet filteren op type, niet splitsen.

## 2. De aggregatie

GEVRAAGD: het maximum van `rolling_ftp` BINNEN het blok, minus de laatste geldige waarde VOOR
blokstart (het instapniveau).

NIET max-tegen-max van twee opeenvolgende blokken: `rolling_ftp` is zelf al een terugkijkend
maximum over circa zes weken, langer dan het blok van vier, dus dezelfde inspanning kan in beide
blokken het maximum zijn. Doorgerekend levert die variant −6 tot +6 zonder plateau. Dit CORRIGEERT
conclusie 3 van `EFFECT-REFERENT-RECON.md` §5: de richting klopte, de overlap was niet gezien.

NIET punt-tot-punt: de ruisvloer is groter dan de blokuitslag (§3 van dat doc).

## 3. De drempel

STIJGING = opbouw-boven-instap groter dan of gelijk aan 3 watt. Named export, herijkbaar zonder
logica-wijziging.

DE ENUMERATIE KOMT UIT DE APP ZELF. De plateau-toets loopt over NIET-OVERLAPPENDE blokken, en die
blokken worden opgehaald met `blokStartVoorWeek` — de functie die de app gebruikt — op het raster
dat verankerd is op `doelStart`. Niet met een eigen lus van 28 dagen. Een lus reproduceert de
verankering namelijk niet en kan er ongemerkt een kwartslag naast liggen; dat is in de eerste
bouwronde precies gebeurd, waarbij het ijk-blok uit paragraaf 8 buiten het toetsraster viel zonder
dat er iets faalde. Een sweep over ELKE maandag als kandidaat-blokstart is weer iets anders: die
meet de gevoeligheid voor de RASTERFASE, niet voor de drempel, en levert per constructie geen
plateau.

PLATEAU-TOETS. Op de weekreeks van paragraaf 4 van `EFFECT-REFERENT-RECON.md`, geënumereerd op het
live raster, wijst elke drempel van +1 tot en met +8 dezelfde TWEE blokken aan: 2026-01-12 en
2026-05-04. Bij +9 valt 2026-05-04 af. Acht opeenvolgende gehele waarden met identieke uitkomst.

DE TWEE BLOKKEN, MET HUN TERMEN. 2026-01-12 gaat van instap 267 naar maximum 276, dus +9, op drie
gevulde weken; dat blok draagt de indoor test van 13-01. 2026-05-04 gaat van instap 264 naar 272,
dus +8, op vier gevulde weken; dat blok draagt de zware rit van 21-05. Alle overige blokken
komen op nul of negatief uit, met één uitzondering die geen nul is: 2025-10-20
levert GEEN getal, want vóór die datum bestaat er in de reeks geen instapniveau. `buildEffectReferent`
geeft daar null en dat blok valt daarmee buiten elke plateau-set.

De verdeling van de week-op-week stappen verklaart waarom er tussen die grenzen niets ligt: −3 drie
keer, −2 veertien keer, −1 vijftien keer, 0 zeventien keer, +1 een keer, +9 een keer, +10 een keer.
Tussen +1 en +9 zit NIETS.

HET PLATEAU IS RASTERAFHANKELIJK. Verschuift `doelStart`, dan verschuift het raster en moet deze
toets opnieuw. De gekozen 3 ligt met ruime marge naar beide randen midden op het huidige plateau,
dus een verschuiving hoeft de waarde niet meteen te raken — maar de onderbouwing hierboven geldt
alleen voor de rasterfase van `doelStart` 2026-06-29.

REPRODUCEERBAARHEID. Paragraaf 4 van `EFFECT-REFERENT-RECON.md` draagt 39 weken (2025-10-27 tot en
met 2026-07-20); de reeks waarop dit ontwerp oorspronkelijk werd opgesteld liep over 54 weken,
waarvan de eerste vijftien niet in de repo staan. De toets hierboven draait op de 39 gepubliceerde
weken. Dat kan de grenzen niet verschuiven: paragraaf 4 van dit document stelt vast dat de daling
in stapjes van een tot twee watt verloopt zonder enkele sprong groter dan drie, en dat er in de
HELE reeks maar twee stijgingen zijn — beide binnen het gepubliceerde venster. Blokken uit die
eerste vijftien weken tellen dus bij elke drempel van +1 tot en met +9 als niet-gestegen.

## 4. Alleen stijgingen dragen informatie

Een rollend maximum stijgt alleen als er een betere inspanning het venster binnenkomt, en zakt
zodra een oude eruit valt. GEMETEN: de daling van 295 (juli 2025) naar 262 verloopt in stapjes van
een tot twee watt zonder enkele sprong groter dan drie, terwijl beide stijgingen binnen EEN DAG
vallen — op 21-05-2026 zelfs tussen twee ritten van dezelfde dag (07:23 nog 261, 16:23 al 272).

GEVOLG: "gestegen" is aantoonbaar, "gedaald" niet. Een niet-stijging betekent UITSLUITEND dat de
beste inspanning van het voorgaande venster niet is overtroffen.

## 5. DRIE uitkomsten, niet twee

GEMETEN, dragend: van de 28 ritten met `if_pct` 88 of hoger en minstens 15 minuten vallen er TWEE
samen met een stijging; 26 niet. `if_pct` ordent ze bovendien niet — 30-11-2025 op 97,04 gaf geen
stijging, 21-05-2026 op 88,36 wel. Een heuristiek op intensiteit en duur die moet vaststellen of
er een maximale inspanning was, is op deze data NIET te bouwen: dat is fitten op twee gevallen.

De twee stijgingen kwamen niet uit training maar uit GEBEURTENISSEN: een indoor test van 20
minuten op `if_pct` 100,77 (13-01-2026) en een zware rit van 74 minuten met normW 243 en `if_pct`
88,36 (21-05-2026). Dat bevestigt het beeld van de gebruiker: de waarde springt bij een maximale
inspanning en zakt daarna.

CORRECTIE 27-07-2026 (Daan). Die rit van 21-05 stond hier eerder als "wegwedstrijd" — dat klopt
niet: het was een rit tijdens een fietsvakantie. De MEETWAARDEN blijven ongewijzigd (74 minuten,
normW 243, `if_pct` 88,36, sprong 261 → 272 binnen één dag; om 07:23 stond de meter nog op 261 en
om 16:23 op 272). Alleen het etiket was fout. Dat is precies waarom 5b-ii een SPRONG in de reeks
als DERDE meetmoment telt naast een ingeplande test en een A/B-wedstrijd: een maximale inspanning
hoeft niet in de agenda te staan om te tellen, en de app kan achteraf niet weten wát voor rit het
was — alleen dát de meter omhoogging. Die derde bron voedt uitsluitend het MEETINTERVAL van het
testvoorstel, nooit de gelegenheid-vraag van de effect-referent; zie de grens-notitie bij
`sprongDagen` in `apps/web/src/lib/effect.ts`.

Daaruit volgen drie uitkomsten:

1. GESTEGEN — opbouw-boven-instap 3 of meer. Effect aangetoond.
2. NIET GESTEGEN, WEL MEETBAAR — het blok bevatte een gelegenheid om een maximum te zetten. De
   effect-uitspraak is geldig.
3. NIET MEETBAAR — geen gelegenheid. De app ZWIJGT over effect en stelt een test voor.

Zonder uitkomst 3 zou de kaart in ELF van de dertien blokken "geleverd maar niet gestegen"
concluderen en dosis-verhoging voorstellen op grond van AFWEZIG bewijs. Dat is erger dan geen
kaart.

## 6. Geldigheidsvoorwaarden

UITVOERING EERST (`EFFECT-REFERENT-RECON.md` §5 conclusie 1, ongewijzigd geldig): is het blok niet
geleverd, dan zwijgt de app over effect (M5).

DEKKING: het instapniveau moet bestaan en minstens 3 van de 4 blokweken moeten een geldige
`rolling_ftp` dragen. GEMETEN: die poort valt in 0 van 13 blokken aan — dezelfde uitkomst als de
dekkings-poort van 5a.

## 7. Wat de referent teruggeeft

De TERMEN APART, nooit hun saldo (`WERKWIJZE.md`, *Recon en bewijslast*): instapniveau,
blok-maximum, het verschil, het aantal gevulde weken, en de uitkomst uit §5.

## 8. Toegepast op het huidige blok

29-06-2026 tot en met 20-07-2026: instap 269, maximum 267, verschil −2, vier van vier weken
gevuld. Uitvoering geleverd. Uitkomst: geen stijging. Of dat uitkomst 2 of 3 is hangt af van §9a.

## 9. OPEN voor de bouw-chat

a. Hoe stelt de app vast dat een blok een gelegenheid tot een maximum bevatte. NIET uit `if_pct`
   (§5). Kandidaten: een door de coach GEPLANDE test, een event uit de events-tabel, of een
   expliciete bevestiging. Voorkeur: het plan — de app plant de week zelf, en `DOELEN-SPEC.md`
   §3.1 zet de FTP-meter op zes tot twaalf weken, dus twee tot drie blokken. Een test hoort
   ingeroosterd te worden, niet afgewacht.
b. Op WELKE dosis-term een verhoging landt bij uitkomst 2. §2A kent drie termen (tijd-in-zone,
   lange-rit-minuten, week-kJ). Bij 110, 97 en 118 kwaliteitsminuten tegen een norm van 84 en een
   dalende CTL is meer tijd-in-zone niet het antwoord.
c. Doel-dekking. Dit ontwerp geldt voor doel FTP. Onderhoud heeft per §3.2 geen effect-meter. De
   klim- en conditie-doelen vragen power-curve-data die niet als gedateerde reeks in D1 staat;
   buiten scope van 5b.
