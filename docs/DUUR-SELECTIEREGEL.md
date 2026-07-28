# Duur-selectieregel — welke inhoud hoort bij welke ritduur

VASTGESTELD. Dit is COACH-CANON, geen geijkte drempel. Het plateau-criterium uit
`docs/WERKWIJZE.md` is hier NIET van toepassing: de vraag "hoeveel werk hoort bij een rit van
vier uur" valt niet te bemonsteren op een reeks die is gereden voordat het mechanisme bestond.
Herzien gebeurt door dit document te wijzigen, niet in een chat.

## 1. Het probleem

`goalWorkout_` filtert kandidaten op `beschikbareTijd <= a.duurRange[1]`. De bibliotheek loopt
tot 135 minuten, dus vanaf 136 minuten kwalificeert NUL van de 35 sjablonen en valt de dag door
naar duurwerk zonder kwaliteit. Gemeten op de weekvorm-as (27-07-2026, doel FTP, fase Base,
mesoweek 1): 5,0 uur levert 69 kwaliteitsminuten, 8,0 uur levert er 45, en een zaterdag van 240
minuten levert er 45. Meer tijd levert dus MINDER kwaliteit. De norm is 84.

Het plafond eraf halen zonder selectieregel is geen oplossing: de tie-break sorteert oplopend op
`duurRange[0]`, dus dan wint het KORTSTE sjabloon en krijgt een rit van vier uur 24 minuten
drempel.

## 2. Wat de bibliotheek zelf zegt

Nominale werkminuten per intent, gemeten over `ARCHETYPES`:

- drempel: 16 tot 42 minuten (`threshold_2x8` tot `threshold_long`)
- sweetspot: 18 tot 60 minuten (`sweetspot_3x6_kort` tot `sweetspot_long`)
- vo2: 8 tot 20 minuten (`vo2_sandwich` tot `vo2_4x5` / `vo2_long`)

Drempel en hoger worden begrensd door HERSTEL, niet door tijd: een rit van vier uur maakt
2x20 minuten drempel niet verteerbaarder dan een rit van anderhalf uur. Sweetspot en tempo
schalen WEL met de ritduur. De bibliotheek draagt die grens al; er hoeft niets bijgebouwd te
worden.

## 3. De regel

`doelWerkMin_(beschikbareTijd, intent)` levert de gewenste nominale werktijd voor deze dag:

- intent `vo2` (en anaeroob) -> 20 minuten, VAST, schaalt niet met de ritduur
- intent `drempel` -> 40 minuten, VAST, schaalt niet met de ritduur
- intent `sweetspot` (en tempo) -> `min(60, round(0,25 * beschikbareTijd))`
- onbekend intent -> de sweetspot-regel

Uitkomst per ritduur voor sweetspot: 150 min -> 37 · 180 min -> 45 · 210 min -> 52 ·
240 min -> 60 (dak).

BOVENGRENS-CHECK tegen de D1-meting: 45 tot 130 minuten Z3+ in een lange rit is aantoonbaar
verteerd (`docs/STAP7-IJKING-DATA.md`, band d6_240plus: kwal_gem 128,7 · kwal_max 171,8). Een
voorstel van 60 minuten op vier uur onderschrijdt dat ruim en is dus veilig. De meting stelt de
regel niet VAST — hij begrenst hem alleen naar boven.

## 4. De ingreep

1. Het plafond `beschikbareTijd <= a.duurRange[1]` VERVALT uit de kandidaat-filter van
   `goalWorkout_`. De ondergrens `beschikbareTijd >= a.duurRange[0]` BLIJFT.
2. De sorteervolgorde krijgt een nieuwe sleutel op de DERDE plaats, na voorkeur en staleness en
   VOOR `duurRange[0]`: `abs(archetypeWorkMin_(a) - doelWerkMin_(beschikbareTijd, intent))`,
   oplopend. De bestaande sleutels blijven eronder staan als stabiele afmaker.
3. `archetypeWorkMin_(rec)` wordt de ENIGE definitie van nominale werktijd: steady -> `durMin`,
   interval -> `reps * onMin` (of `onSec / 60` als `onMin` ontbreekt). De bestaande lus in
   `expandArchetype_` roept die helper voortaan aan in plaats van het zelf te berekenen.
4. `expandArchetype_` verandert VERDER NIET. De endurance-fill vult een rit al correct tot
   `doelMin`; dat is gemeten op 120, 180 en 240 minuten.

## 5. Acceptatie

Meetbaar, op de vaste weekvorm-as (doel FTP, fase Base, mesoweek 1, klok gepind op 2026-07-27):
GEEN weekvorm van 6 uur of meer levert minder kwaliteitsminuten dan de weekvorm van 5,0 uur.
Vandaag is dat 69 / 45 / 45 / 45; na de bouw mag de reeks niet meer dalen met de uren.
