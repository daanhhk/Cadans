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

- drempel: 16 tot 50 minuten (`threshold_2x8` tot `threshold_pyramid`)
- sweetspot: 18 tot 69 minuten (`sweetspot_3x6_kort` tot `sweetspot_pyramid`)
- vo2: 5 tot 28 minuten (`vo2_microburst` tot `vo2_sandwich`)

Geteld over ALLE core-vormen, niet alleen over de intervallen: een ladder, een over-under en
een set staan in `core` als meerdere entries naast elkaar, en `steady` draagt zijn `durMin`.
Er bestaan maar twee core-kinds — `int` en `steady`; wie alleen op `reps` en `onMin` telt,
mist de helft.

De DEKKING per intent is ononderbroken — binnen de band is er geen enkele beschikbare tijd
zonder kandidaat. Het probleem zit uitsluitend aan de bovenkant, waar de band ophoudt:

- drempel: band 33 tot 120 minuten, NUL kandidaten vanaf 121
- sweetspot: band 34 tot 135 minuten, NUL kandidaten vanaf 136
- vo2: band 35 tot 100 minuten, NUL kandidaten vanaf 101

Drempel en hoger worden begrensd door HERSTEL, niet door tijd: een rit van vier uur maakt
2x20 minuten drempel niet verteerbaarder dan een rit van anderhalf uur. Sweetspot en tempo
schalen WEL met de ritduur. De bibliotheek draagt die grens al; er hoeft niets bijgebouwd te
worden.

## 3. WEERLEGD — de doelwerktijd-regel

Hier stond een regel `doelWerkMin_(beschikbareTijd, intent)`: vo2 20 vast, drempel 40 vast,
sweetspot `min(60, round(0,25 * beschikbareTijd))`, met die afstand als sorteersleutel en
zonder plafond. Gebouwd en GEMETEN, en daarmee weerlegd.

Kwaliteitsminuten op de weekvorm-as, voor tegenover na: 69 / 45 / 45 / 45 / 64 werd
62 / 90 / 56 / 92 / 51. De lange staart steeg fors (V2 en V4 van 45 naar 90 en 92), maar V1,
V3 en V5 ZAKTEN — en V1 is juist de referentie waartegen de acceptatie meet.

De oorzaak is exact aanwijsbaar. Bij 120 beschikbare minuten geeft 0,25 × 120 een doel van 30
werkminuten. `sweetspot_2x15` heeft er precies 30 en wint daarmee van `sweetspot_4x12` met 48
— terwijl het plafond `sweetspot_2x15` (duurRange 46 tot 68) juist buiten hield.

CONCLUSIE, en dit is de les: BINNEN de bibliotheek-band DOET het plafond werk. Het weert korte
sjablonen van middellange dagen. Het is geen overblijfsel dat weg kan; het is de enige rem op
een 30-minuten-sjabloon op een rit van twee uur. Alleen BUITEN de band, waar het nul kandidaten
oplevert, is het schadelijk.

## 4. De ingreep — plafond blijft, met een fallback

1. Het plafond `beschikbareTijd <= a.duurRange[1]` BLIJFT in de kandidaat-filter van
   `goalWorkout_`, samen met de ondergrens en `archetypeAllowedForProfile_`. Binnen de band
   verandert er dus NIETS — geen enkele keuze verschuift.
2. Levert die filter NUL kandidaten op, dan volgt een TWEEDE pass met dezelfde filter maar
   ZONDER het plafond. Voorheen viel de dag hier door naar duurwerk zonder kwaliteit.
3. De tweede pass sorteert op `duurRange[1]` AFLOPEND, daarna nominale werktijd AFLOPEND,
   daarna `id`. Dus: het sjabloon dat het dichtst bij de gevraagde duur komt, en bij gelijke
   duur het zwaarste. Voorkeur en staleness spelen in deze pass GEEN rol — er is niets te
   rouleren als er maar één band-overschrijdende keuze overblijft.
4. `archetypeWorkMin_(rec)` wordt de ENIGE definitie van nominale werktijd: steady -> `durMin`,
   interval -> `reps * onMin` (of `onSec / 60` als `onMin` ontbreekt). De bestaande lus in
   `expandArchetype_` roept die helper voortaan aan in plaats van het zelf te berekenen.
5. `expandArchetype_` verandert VERDER NIET. De endurance-fill vult een rit al correct tot
   `doelMin`; dat is gemeten op 120, 180 en 240 minuten.

## 5. Acceptatie

Meetbaar, op de vaste weekvorm-as (doel FTP, fase Base, mesoweek 1, klok gepind op 2026-07-27):

1. GEEN enkele weekvorm daalt ten opzichte van de voor-meting. De fallback vuurt alleen waar
   het plafond nul kandidaten gaf; raakt hij een weekvorm die daar niet onder valt, dan vuurt
   hij waar hij niet hoort.
2. Een dag boven 135 minuten die een kwaliteitsslot krijgt, draagt een archetype met minstens
   45 nominale werkminuten.

V3 valt BUITEN het bereik van deze regel. Daar krijgt de zaterdag van 180 minuten helemaal geen
kwaliteitsslot: de allocator wijst de kwaliteitsdagen aan maandag en zondag toe en maakt
zaterdag de lange duurrit. Dat is een eigen post — zie `docs/ROADMAP.md` stap 1b — en niet met
`goalWorkout_` op te lossen.
