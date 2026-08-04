# PUNT 26 — de vandaag-gereden dag verliest zijn plan

Recon en ontwerp op `65afe0f`. CLIENT-only: `packages/engine` en `workers/api` blijven
onaangeroerd. De meting is chat-zijde gedraaid op een gebundelde client met een gestubde klok,
onder `TZ=Europe/Amsterdam`, over 4 weekvormen maal elke trainingsdag — 15 cellen.

## §1 De meting

Vier momenten, dezelfde week, dezelfde rit.

- **Op de dag zelf, ná de rit** heeft de gereden dag GEEN sessies en GEEN `plannedForDone`:
  **15 van de 15**. De allocator bouwt sessies alleen voor nog te plannen dagen, en de
  bevroren-entry-tak in `proposal.ts:658` staat op `if (isPast)` — strikt in het verleden.
- **De bewaarde weekplan-entry van die dag wordt door de eerstvolgende PUT VERWIJDERD**:
  **15 van de 15**. De grond staat op twee plekken en allebei zijn ze gegrept.
  `mergeFrozenWeekplan` bevriest uitsluitend `d < todayISO` (`weekplanFreeze.ts:59`), en de
  na-lus die niet-genoemde dagen terugduwt draagt dezelfde grens (`:68`). De verse payload noemt
  de dag niet meer, want `entryFromDay` geeft `null` zodra `!sessions.length`
  (`weekplanBlob.ts:108`). Vandaag valt dus buiten de freeze én buiten de payload.
- **Op de EERSTE render van de volgende dag is het plan er nog steeds niet**: **15 van de 15**.
  De entry is dan al weg, dus er valt niets te lezen.
- **Op de TWEEDE render staat het er wel**, via `hasUnrecordedPastTrainingDay`
  (`schema.ts:1555`) en de reconstructie-run die daarop volgt.
- **Die reconstructie levert in 4 van de 15 cellen een ANDER plan** dan wat er die ochtend stond,
  telkens op de derde trainingsdag: `long_z2` wordt `sweet_spot`, TSS van 42 naar 53, en intent
  `high` van 0 naar 26. DE BLOK-TERUGBLIK LEEST PRECIES DIE VELDEN, dus dit is geen cosmetisch
  verschil: het oordeel over een blok verschuift door een reconstructie die als herstel bedoeld is.

## §2 Het ontwerp

**TERM A — de leestak.** `proposal.ts:658` gaat van `if (isPast)` naar `if (isPast || d.gedaan)`.
De bevroren-entry-tak dekt daarmee ook een dag die VANDAAG gereden is. `gedaan` is hier de uit de
activities AFGELEIDE vlag (`derivePlannerGedaan`), niet `pd.gedaan` van de planner-rij — de
grid-map op `:405` vouwt beide samen via `isGedaan`. De else-tak op `:665` blijft ongemoeid.

**TERM B — de schrijfkant.** Een nieuwe `withDoneTodayEntries` in `weekplanBlob.ts` draagt de
BEWAARDE entry van een vandaag-gereden dag over naar de verse payload, zodat de PUT hem niet stil
laat verdwijnen. De entry gaat VERBATIM mee, niet herbouwd uit `plannedForDone`: die vorm mist
`variantId` en `archetypeId`, en de recency-seed leest juist die velden.

**B LEUNT OP A EN IS ZONDER A INERT.** De poort van B eist `d.plannedForDone !== null`, en dat
veld wordt pas gevuld door term A. Zonder A vindt B nul dagen en verandert er niets. Dat is geen
zwakte maar de reden dat de rood-meting per term uit elkaar te trekken is: R1 raakt de leeskant,
R2 de schrijfkant.

## §3 De wat-als

Vier momenten, vier uitkomsten.

- **Basis** (vandaag): 0 van 15 op de dag zelf.
- **Alleen term A**: 15 van 15 op de eerste render, maar 0 van 15 op de TWEEDE render van
  diezelfde dag — want de eerste render heeft de entry dan al uit de blob geschreven.
- **A plus B**: 15 van 15 op alle vier de momenten, reconstructie-gat 0 van 15, en de eind-entry
  gelijk aan het origineel 15 van 15.

Dat middelste geval is het argument tegen A-alleen: het lijkt te werken tot je het scherm een
tweede keer opent.

## §4 Grenzen

**BEGRENZINGSBEWIJS over 105 cellen** — 5 doelen maal 5 weekvormen maal elke trainingsdag.
Zonder een rit van vandaag is de HELE `ProposalWeek` byte-identiek: **105 van 105**. Met een rit
van vandaag zijn alle ANDERE dagen byte-identiek **105 van 105**, en beweegt uitsluitend de
gereden dag zelf, **105 van 105**.

**DE SHOT-HARNESS KAN DIT GEVAL PER CONSTRUCTIE NIET FOTOGRAFEREN.** Hij zaait alleen de
PLAN-kant; de geleverde kant komt uit `activities` in de lokale D1, en de enige schrijfroute
daarheen is `POST /sync/activities`, die van Intervals trekt. Er is dus geen camera op dit geval —
de dekking moet volledig uit de tests komen, en dat is de reden dat T1 óók `derivePlannerGedaan`
asserteert: valt die poort weg, dan gaat de test stil dood in plaats van rood.

## §5 Naast de bouw gevonden, NIET gerepareerd

**De else-tak op `proposal.ts:665` is in productie DOOD.** Zijn poort eist `d.voorgesteldType`, en
`workers/api/src/db/repo.ts:397` schrijft die kolom bij elke PUT op `null`; de api-route weigert
het veld ook van de client. De tak kan dus alleen vuren op data die de app zelf nooit produceert.
Genoteerd als vindpatroon — zelfde familie als "een pad kan dood zijn aan zijn INVOER" — en
bewust BUITEN SCOPE van deze bouw.
