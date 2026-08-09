# Punt 39 — recon en meting: waar de herstelweek werkelijk in snijdt

Chat-zijdige meetronde, 9 augustus 2026. Read-only kloon op
`15d14714392e2222a1c0dee24641ee08478b2797`, `buildWeekProposal` uit een esbuild-bundel,
`TZ=Europe/Amsterdam`, de klok als Proxy op de echte `Date`. Elke uitspraak hieronder is
GEDRAAID, niet gelezen. CC deed alleen de commit. Er is geen regel engine aangeraakt.

## 1. IJking en meetruimte

Weekvorm-as uit `apps/web/src/lib/weekvormAs.test.ts` opnieuw gedraaid: kwaliteitsminuten
93 / 113 / 113 / 105 / 84 / 93 / 90, week-TSS 268 / 410 / 464 / 362 / 352 / 227 / 375,
kwaliteitsdagen 3 / 3 / 3 / 3 / 3 / 3 / 3. **21 van de 21 gepinde waarden gereproduceerd.**

Meetruimte: de volume-as W1..W7 uit `docs/ROADMAP.md` *Meetlat* maal 5 doelen maal 5
(fase,meso)-paren — **175 cellen, 825 sessies**. De (fase,meso)-as is empirisch AFGELEZEN en
niet aangenomen: twaalf gekoppelde paren met periode 12 vanaf `doelStart`, deload is meso4.
Instrumentcontrole: **208** blokloze Recovery-sessies, exact het aantal uit de punt-41/42-ronde.

De vergelijker voor de wat-als-rondes is in TWEE richtingen geijkt: A/A patch-nul tegen de
referentiemeting **105 van de 105 identiek**, tegenrichting (quotum 2) **56 van de 105
afwijkend**.

## 2. M80 houdt stand en wordt breder — maar hij is VOLUME-AFHANKELIJK

Deload (meso4) tegenover de opbouwweek ervoor (meso3), Base, over de vier doelen met
mesocyclus: het weekvolume krimpt in **28 van de 28** cellen tussen **−0,1 en −10,8 procent**,
waar M79 om 40 tot 60 vraagt. De langste dag beweegt **−0,4 tot +0,5 minuut** — afrondingsruis,
geen ingreep. De belasting zakt wél, naar **60 tot 73 procent**, volledig uit de
intensiteitskant; Z2+Z3 op de band stort in (W1: 69,2 naar 9,6 minuten) terwijl Z1 stijgt.
Onderhoud geeft 0 cellen, want dat doel draagt geen mesocyclus.

DE KLEINE KRIMP DIE ER WEL IS, HEEFT EEN AANWIJSBARE BRON: de cap `Math.max(30, Math.min(60,
mins || 45))` in `genericRecovery` (`packages/engine/src/planner.ts:2042`). Die raakt alleen
weekdagen boven een uur, en daarom loopt de krimp mee met het volume: nul op W1 tot W3,
−10,6 procent op W7.

EN DAT MAAKT HET DEFECT VOLUME-AFHANKELIJK. Waar de weekbelasting vandaan komt, kantelt met de
uren — aandeel uit duurdagen in de opbouwweek, gepoold over de vier doelen: 3,0u **9 procent** ·
4,5u 22 · 6,0u 20 · 8,0u 31 · 10,0u 37 · 12,0u 42 · 14,0u **46 procent**. Bij drie uur leveren
alle duurdagen samen 16 TSS op een week van 168; daar valt aan de volumekant vrijwel niets weg
te halen, en wat de app onderin doet is inhoudelijk ongeveer juist. Sluit aan op M85: de
kwaliteitsdosis plafonneert vanaf acht uur, dus daarboven groeit de last uitsluitend aan de
volumekant.

## 3. Beide hendels uit punt 39 zijn gemeten en geen van beide raakt het volume

**De kalendernaam-splitsing is INERT bij het huidige quotum.** `!(isDeload && d.type !== "vrij")`
(`planner.ts:304`) vervangen door `true` geeft **0 van de 105** bewegende cellen. De patch is
aantoonbaar raak — regel 304 staat na de patch op `true` en de quotum-regel is onaangeroerd —
dus dit is inertie en geen no-op. De term is GEMASKEERD door het quotum: bij quotum 2 bewegen
er **56 van de 105**.

**Het quotum werkt de verkeerde kant op.** `quota = 1` naar `2` (`planner.ts:282`) levert de
gewenste frequentie (kwaliteitsdagen 1 naar 2 in 28 van de 28 cellen) maar maakt de week
LANGER: **+10 tot +30 minuten** op W4 tot W7, want een quality-dag ontsnapt aan de
60-minutencap van `genericRecovery`. De langste dag beweegt nul.

**Begrenzing:** bij alle drie de patches beweegt de opbouwweek **0 van de 35** cellen.

## 4. De eigenlijke diagnose

Er bestaat vandaag geen enkele VOLUME-hendel in de deload. De dosis krimpt correct — de
nominale werkblokken maal 0,60, M76 en M83 conform — maar de f<1-tak in `renderVariant_` laat
de endurance-fill de vrijgekomen tijd absorberen, en de dagduur blijft `mins`. Gemeten op
Daans weekvorm: het z2-vulblok van de maandag gaat van 16 naar 31 minuten terwijl de
drempelblokken van 5,8/8/10,4 naar 3/4,2/5,4 gaan.

M79 telt drie termen en er faalt er één. Frequentie 3 naar 1 ligt binnen "een tot twee
prikkels", de intensiteit blijft nominaal, en alleen het volume is de schending. De kop van
punt 39 — "snijdt in de frequentie in plaats van in het volume" — is als DIAGNOSE dus te sterk;
de reparatie zit uitsluitend aan de volumekant.

## 5. Wat de vakliteratuur voorschrijft

De taper-meta-analyses zijn eenduidig: Bosquet e.a. (MSSE 2007) vinden de grootste winst bij een
volumereductie van 41 tot 60 procent zonder wijziging van intensiteit of frequentie, en stellen
expliciet dat het volume via KORTERE SESSIES omlaag moet en niet via minder sessies —
frequentie verlagen gaf geen significante winst, met de conservatieve aanbeveling de frequentie
op 80 procent of meer te houden. De replicatie in PLOS ONE (2023, 14 studies) komt op hetzelfde
uit en vindt dat intensiteit VERLAGEN de tijdritprestatie niet verbetert.

De coachpraktijk voor HERSTELWEKEN (geen taper) hanteert dezelfde band: 40 tot 50 procent
volume eraf met een of twee korte prikkels of openers om de neuromusculaire scherpte te houden.

OVER DE LAGE KANT IS ER GEEN URENDREMPEL BESCHREVEN. Wat er staat is dat de STRUCTUUR
volume-onafhankelijk is — minder ritten, kortere sessies, lagere zones, een of twee openers — en
dat alleen het absolute aantal uren meebeweegt. Voor een basis van 4 tot 6 uur luidt het advies
elke sessie 10 tot 15 minuten in te korten en de week op drie of vier ritten te houden, wat op
circa 20 tot 25 procent uitkomt; één bron noemt de band ronduit 20 tot 50 procent afhankelijk
van ervaring en trainingsvolume.

## 6. De gemeten curve, en het besluit dat eronder ligt

BELEID, Daan-besluit 9 augustus 2026: een volumefactor op de SESSIEDUUR die met het weekvolume
meeloopt — 0,75 tot en met 5 uur, aflopend naar 0,55 vanaf 10 uur, lineair ertussen. Geen
urendrempel, dus M9-conform: één regel, alleen de dosering verandert. De frequentie blijft
ongemoeid; er wordt geen dag geschrapt.

GEMETEN, volume tegenover de opbouwweek: W1 **75%** · W2 75% · W3 71% · W4 63% · W5 55% ·
W6 55% · W7 **55%**. Belasting 40 tot 53 procent tegen de 66 tot 73 van vandaag.
Kwaliteitsdagen blijven 1,00 in alle cellen.

DE PRIKKELDOSIS IS GEEN DRAGEND BESLUIT, EN DAT IS GEMETEN IN PLAATS VAN BEREDENEERD. Met
`mesoFactor(4)` op 1 in plaats van 0,60, bovenop dezelfde volumecurve, gaat de weekbelasting
**1 tot 3 procentpunt** omhoog en de kwaliteitsminuten van circa 13 naar **16,5**. De ×0,60
blijft dus staan — niet omdat hij aantoonbaar juist is, maar omdat het verschil niet dragend is
zodra het volume het werk doet. M76 en M83 blijven ongemoeid.

## 7. Bouwspec voor de volgende ronde

DE INGREEP IS ER ÉÉN, NIET TWEE. Het quotum en de eligibility blijven zoals ze zijn.

KANDIDAAT-PLEK A, client-side: `sessieMin` in `apps/web/src/lib/proposal.ts:619-621`. Geen
engine-autorisatie nodig, zelfde vorm als stap 1b uit `DOELEN-SPEC` §6.
KANDIDAAT-PLEK B, engine: de dagduur vóór de bouwers in `assignWorkouts`.

WAT DE BOUWRONDE MOET METEN VOOR ZE KIEST: `keyIntensity` krijgt `beschikbareTijd: d.minuten`
(`planner.ts:943`) en kiest het archetype dus op de VOLLE dagduur. Krimpt alleen de bouwduur,
dan zit de keuze op een andere duurband dan de sessie. Meet dat per plek, en meet in BEIDE
richtingen — een te smalle ingreep laat het volume staan, een te brede raakt de opbouwweek.

VLOEREN DIE KUNNEN BIJTEN en die vooraf gegrept horen te worden: de cap 30/60 in
`genericRecovery` (`planner.ts:2042`), de `Math.max(60, …)` in `genericLongZ2`, en de
warm/cool-trim bij `mins <= 75` in `renderVariant_`.

DE ACCEPTATIE-EIS IS DE CURVE UIT §6, niet een percentage per cel: de reeks 75 / 75 / 71 / 63 /
55 / 55 / 55 met kwaliteitsdagen ongewijzigd op 1 en de opbouwweek byte-identiek.

<!-- EINDE docs/PUNT39-DELOAD-RECON.md -->
