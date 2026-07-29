# Het inhaalvoorstel bereikt het scherm niet — recon (ROADMAP punt 5b)

Gemeten in de chat op de gecommitte code, engine gebundeld met esbuild buiten de repo-tree,
`TZ=Europe/Amsterdam`, klok gestubd op woensdag 29-07-2026. GELEZEN en GEMETEN staan hieronder
apart: wat als gelezen is gemarkeerd komt uit de bron, wat als gemeten is gemarkeerd is
gedraaid.

## 1. Het veld is dood, en renderen is de verkeerde fix

GELEZEN. `coachFeedback_` levert een `adapt`-payload, en `apps/web/src/lib/schema.ts` zet die
op regel 626 (de VOLTOOID-tak) en regel 667 (de GEMIST-tak) in het view-model. Buiten die twee
schrijvers bestaat er alleen de type-declaratie op regel 249. Nul lezers: geen enkele component
raakt het veld aan.

De voor de hand liggende fix — het veld gewoon renderen — is de VERKEERDE. Drie redenen, alle
drie gelezen in de bron.

- DE INHOUD IS GENERIEKE COPY. `adapt` levert een zin van de vorm "Voorstel: een ingekorte
  <intent> op de eerstvolgende verse dag", terwijl het plan iets anders doet. Renderen laat de
  coach dus iets beloven wat de app niet uitvoert — een daad-claim zonder daad.
- `adapt` IS GEEN SLEUTEL-SIGNAAL. Van de vijf takken die `adapt` vullen horen er DRIE bij een
  endurance-ruil, niet bij een gemiste sleutelsessie. Het veld als "het inhaalvoorstel" lezen
  is dus al een misvatting over wat erin zit.
- HET VELD IS EEN RESTANT. De comment op regel 249 zegt zelf dat `planned` en `adapt`
  "beschikbaar blijven voor 2c/3b" — het is nooit aangesloten, niet stukgegaan.

## 2. De week-inhaal-kaart is structureel dood in Base, Build en Peak

MECHANISME, GELEZEN. De allocator-tak (`planner.ts:776`) staat VÓÓR de pendel-, weekend- en
vrij-takken, en de endurance-fill (`planner.ts:553`) claimt elke eligible dag — trainbaar,
vrij/weekend/pendel, niet gedaan, datum ≥ vandaag. De `catchup_*`-codes op `planner.ts:819` en
`planner.ts:849` zijn daardoor onbereikbaar. En `buildInhaalVoorstel` (`schema.ts:1086`) diff't
juist op die codes.

GEMETEN, sweep over 48 combinaties: 4 weekvormen × 4 doelen × 3 doelStarts, met een bewaarde
weekplan-blob die sweet-spot-intent op maandag en dinsdag draagt en zonder activiteiten. In
ELKE Base-, Build- en Peak-cel: nul catchup-codes en nul inhaalvoorstellen. De 24 codes en 18
voorstellen die de sweep wél oplevert liggen ALLE in fase Test. Doel Onderhoud raakt het pad
sowieso nooit, want daar staat `debtEnabled` op false.

GEMETEN, de debt bestaat wel degelijk: `zoneDebt_` over maandag plus dinsdag geeft low 57 ·
high 48 · anaerobic 0. Hij komt alleen nergens uit.

GEMETEN, de wat-als-run (`planAdaptation` true) is byte-identiek aan het actieve plan. Ook
zonder de code-poort zou de diff dus leeg zijn — de kaart heeft twee onafhankelijke redenen om
niet te verschijnen.

GEMETEN op Daans eigen configuratie: doel FTP, doelStart 2026-06-29, AGR op 17-04-2027, week
27-07 met maandag en dinsdag gemist. Uitkomst macroFase Base, wekenTotEvent 38, nul
catchup-codes, `buildInhaalVoorstel` NULL. Het restplan draagt donderdag 30-07 een
`threshold`-`key_session` van 60 minuten en zaterdag 01-08 een `sweet_spot`-`key_session` van
240 minuten.

`apps/web/src/lib/inhaal.test.ts` bewijst het tegendeel NIET: die injecteert redenCode
`catchup_high` met de hand in een nagebouwde `ProposalWeek`. De door de pijplijn GEPRODUCEERDE
code is nergens geasserteerd — precies het patroon waarbij een test groen blijft terwijl het
pad dood is.

GEVOLG VOOR DE ONTWERPVRAAG BIJ PUNT 5b. Er is geen levende week-inhaal-stem om mee samen te
vallen. Punt 10 (twee kaarten spreken los over hetzelfde blok) wordt door deze bouw niet
geraakt.

## 3. Het plan reageert wel, het zegt het alleen niet

MECHANISME, GELEZEN. `allocateQualityWeek_` rekent het quotum als quotum MIN de reeds voltooide
harde dagen. Gereden sleutelsessies verbruiken het quotum; GEMISTE niet. De resterende dagen in
de week krijgen de kwaliteit dus vanzelf toegewezen — het plan herschikt al.

GEMETEN over 23 cellen (4 weekvormen × elke dag-in-de-week): in 10 cellen verschilt de
kwaliteitsverdeling tussen de gereden- en de gemist-variant; in 20 van de 23 draagt het
restplan nog minstens één sleutelsessie; in 3 is de week op en is er geen kandidaat-dag meer.

GRENS BIJ DEZE METING. De fixture voedt `activities` en `weekplans` leeg, dus de recency-seed
kiest andere varianten dan de app op levende data doet. De sjabloonNAMEN uit deze meting zijn
daarom GEEN prod-claim. De structurele uitkomsten — het aantal kwaliteitsdagen, en wel of geen
kandidaat-dag — zijn dat wel.

## 4. Besluit

DE DAGKAART TOONT EEN FEITENBLOK, AFGELEID UIT HET ACTIEVE PLAN. Bij een gemiste sleutelsessie
laat de kaart zien waar de sleutelprikkel deze week nog staat — dag, naam, duur — of doet ze de
eerlijke mededeling dat er geen trainingsdag meer over is.

GEEN NIEUW OVERRIDE-MECHANISME. Het plan herschikt al (§3), en een override zou meestal de ene
sleutelsessie door de andere vervangen. Geen daad-claim in de copy, geen tweede planner-run,
geen engine-wijziging.

`adapt` VERDWIJNT UIT HET CLIENT-VIEW-MODEL en wordt vervangen door `plannedIntent` en
`doneIntent`, die `coachFeedback_` al machineleesbaar teruggeeft. De ENGINE blijft ongemoeid en
de bestaande selftest-asserties op `adapt` blijven staan.

DE SLEUTEL-TOETS LEEST DE ENGINE. `COACH_KEY_INTENTS_` en `intentFromType_` komen uit
`packages/engine/src/coach.ts`; er komt geen eigen lijst client-zijde, want twee lijsten drijven
uit elkaar.

BROERTJE IN DEZELFDE BOUW. Dezelfde dode afleiding hangt onder de VOLTOOID-kaart wanneer een
sleutelsessie LICHTER is gereden: state `different`, en de geleverde intent is geen
sleutel-intent. Ook daar hoort de regel te verschijnen.

## 5. Wat niet in deze ronde zit

De dode week-inhaal-kaart uit §2 repareren vraagt de allocator, en dus de ENGINE plus expliciete
autorisatie. Dat is een eigen punt en geen onderdeel van deze bouw.
