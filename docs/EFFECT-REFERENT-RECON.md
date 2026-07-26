# Effect-referent per doel — recon (bouwvolgorde stap 5b)

Recon-first bij `docs/DOELEN-SPEC.md` §6 stap 5, tweede helft. De eerste helft (de
uitvoerings-referent) is gebouwd en geijkt — zie `docs/UITVOERINGS-REFERENT-RECON.md`. Dit doc gaat
over de TWEEDE vraag: heeft het blok gedaan wat het moest doen. Metingen via read-only SELECT op
remote D1, systeem-tijdzone Europe/Amsterdam. Geen code gewijzigd.

## 1. De vraag

Voor het doel FTP stelt de KETEN in `docs/DOELEN-SPEC.md` §3.1 dat de effect-meter eFTP of het
20-minutenvermogen is, traag (zes tot twaalf weken) en daarom nooit de weekreferent. Die meter moet
uit bestaande data komen; de vraag is welke.

## 2. De vondst — er staat al een gedateerde reeks

`eftpFromActivities_` (`packages/engine/src/niveau.ts`) berekent GEEN eFTP. De functie pakt de meest
recente geldige Rolling FTP uit `idx14` van de activiteiten-matrix. De naam suggereert een
afleiding, de code doet een lookup.

Dat is geen bezwaar maar een meevaller: het betekent dat er per rit al een Rolling-FTP-waarde in D1
staat (kolom `rolling_ftp` in `activities`), en dus een GEDATEERDE REEKS die je terug kunt lezen.
Voor een effect-referent is precies dat nodig — geen momentopname maar een verloop.

## 3. De meting

Venster 2025-11-01 t/m 2026-07-25, 174 ritten.

DEKKING. 142 van de 174 ritten dragen een geldige `rolling_ftp` (niet leeg, niet null, groter dan
nul); 32 niet. Per week samengevat: van de 39 weken zijn er 38 gevuld en is er één leeg
(02-02-2026). De gaten zitten in de winter (februari 10 met tegen 10 zonder, december 17 tegen 8) en
verdwijnen daarna vrijwel: maart t/m juli hebben samen 9 ritten zonder waarde.

BEWEGING. De weekreeks loopt van 262 tot 276, een spreiding van 14 watt over negen maanden. In 23
van de 37 overgangen verandert de waarde, dus de reeks staat niet stil. De sprongen zijn ASYMMETRISCH:
grootste stap omhoog +10, grootste stap omlaag −3. Dat is het handtekeningpatroon van een rolling
maximum — hij springt op zodra er een betere inspanning in het venster komt en zakt daarna traag weg
zodra de oude inspanning eruit valt.

UITSLAG PER VENSTER, terugkijkend vanaf 26-07-2026:
- vier weken (het blok 29-06 .. 26-07): 269 → 262 = **−7**
- acht weken: 272 → 262 = **−10**
- twaalf weken: 264 → 262 = **−2**

Let op de volgorde: de TWAALF-weekse uitslag is de KLEINSTE. De reeks is niet monotoon (piek 276 in
januari, dip 262 begin mei, sprong terug naar 272 half mei), dus een langer venster kan een echte
daling maskeren in plaats van 'm duidelijker maken.

## 4. De weekreeks (kalibratie-basis)

Laatste geldige `rolling_ftp` per kalenderweek, verbatim. Dit is de reeks waarop een volgende chat
elke drempel moet ijken — niet op een modelcurve (`docs/WERKWIJZE.md`, *Recon en bewijslast*).

```
2025-10-27 276
2025-11-03 276
2025-11-10 276
2025-11-17 276
2025-11-24 273
2025-12-01 273
2025-12-08 273
2025-12-15 273
2025-12-22 271
2025-12-29 270
2026-01-05 267
2026-01-12 276
2026-01-19 276
2026-01-26 276
2026-02-02 (leeg)
2026-02-09 274
2026-02-16 272
2026-02-23 270
2026-03-02 270
2026-03-09 268
2026-03-16 267
2026-03-23 266
2026-03-30 266
2026-04-06 266
2026-04-13 266
2026-04-20 266
2026-04-27 264
2026-05-04 263
2026-05-11 262
2026-05-18 272
2026-05-25 272
2026-06-01 271
2026-06-08 269
2026-06-15 270
2026-06-22 269
2026-06-29 267
2026-07-06 265
2026-07-13 264
2026-07-20 262
```

## 5. Ontwerp-conclusies

1. DE UITVOERINGS-REFERENT IS DE GELDIGHEIDSVOORWAARDE. Een rolling maximum zakt om TWEE redenen:
   je bent achteruitgegaan, óf je hebt simpelweg geen maximum-zettende inspanning meer gereden. Die
   twee zijn aan de reeks zelf niet te onderscheiden. Alleen als vaststaat dat de dosis GELEVERD is,
   betekent een dalende reeks iets over effect. Dat is precies de volgorde die `DOELEN-SPEC.md` §2A
   voorschrijft — hier valt hij niet als principe maar als meettechnische noodzaak.

2. EEN PUNT-TOT-PUNT-DELTA IS NIET AF TE LEZEN. De ruisvloer van de reeks (+10 in één enkele sprong)
   is GROTER dan de blokuitslag (−7). Welk venster je ook kiest, een verschil van twee meetpunten
   verdrinkt daarin. En het venster kiezen dat de grootste uitslag geeft — hier acht weken met −10 —
   is precies de fout die de werkwijze verbiedt: dat is de drempel om de conclusie heen leggen.

3. DE AGGREGATIE MOET BIJ DE GROOTHEID PASSEN. Bij een rolling maximum hoort geen laatste-waarde-
   verschil maar het MAXIMUM over een venster tegenover het maximum over het vorige venster. Dan
   telt "heb je in dit blok een betere inspanning neergezet dan in het vorige" — de vraag die het
   doel FTP werkelijk stelt. Vensterlengte en drempel zijn NOG NIET gekalibreerd; dat gebeurt op de
   reeks in §4 en moet op een plateau uitkomen, niet op een helling.

## 6. Aparte bevinding — de ingestelde FTP klopt niet meer

In ALLE 142 rijen met beide waarden wijkt `rolling_ftp` af van de `ftp`-kolom; er is geen enkele
gelijke rij. De grootste afwijking is −18 op 25-07-2026: `rolling_ftp` 262 tegen `ftp` 280. De
ingestelde 280 wordt dus al maanden niet meer door de ritten gedragen.

Dat raakt meer dan de effect-vraag. De zonegrenzen worden uit de ingestelde FTP afgeleid, dus die
staan te hoog; daardoor vallen dezelfde watts in een lagere zone en worden TSS en (via de PMC) CTL
te LAAG berekend. Een dalende CTL bij ongewijzigde uitvoering — de casus die de doortrain-kaart en
de blok-check nu beoordelen — kan hier deels uit voortkomen.

Er staat een `ftp_auto_update`-vlag in het settings-schema (`workers/api/src/db/schema.ts`,
`ftpAutoUpdate`, bool 0/1). NIET onderzocht is of die vlag uit staat, of aan staat maar niet draait.

Dit is een OPEN BEVINDING, geen besluit. Voordat er iets aan de FTP verandert hoort te worden
vastgesteld welke van de twee waarden de waarheid is en wat de vlag doet — een FTP-wijziging
herschrijft met terugwerkende kracht de betekenis van elke zone-meting in dit document.

### CORRECTIE 26-07-2026 — §6 is weerlegd

Gemeten in `docs/FTP-REFERENT-RECON.md`. Drie claims hierboven houden niet:

1. "In alle 142 rijen wijkt `rolling_ftp` af van de `ftp`-kolom" is waar maar betekenisloos: het
   zijn twee verschillende grootheden (gezette FTP tegen rollende schatting), geen twee metingen
   van hetzelfde.
2. "De zonegrenzen worden uit de ingestelde FTP afgeleid, dus TSS en CTL te laag" is ONJUIST. TSS,
   IF, CTL en zoneminuten komen kant-en-klaar uit intervals.icu; de ingestelde FTP komt daar
   nergens binnen.
3. "De ingestelde 280 wordt al maanden niet door de ritten gedragen" verwart `settings.ftp` met
   `activities.ftp`. De ritten droegen 275 tot 20-07-2026 en 280 daarna — gelijk aan de instelling.

De `ftp_auto_update`-vlag staat op NULL en wordt in Cadans nergens gelezen. §5 blijft ONGEWIJZIGD
geldig.
