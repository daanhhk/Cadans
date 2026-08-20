# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-20 — PUNT 44 IS AF, GESLOTEN ZONDER BOUW (item 6e). Docs-only: geen code, geen
engine, geen migratie, geen deploy, geen enkel `wrangler`-commando. Prod en D1 staan waar het blok
hieronder ze noemt.
- **DE MEETLAT WAS HET DEFECT.** GEMETEN in `packages/engine/src/zones.ts`: de engine zet de
  drempelzone op **91 tot 105 procent FTP**. De metingen van punt 44 telden kwaliteit als werk
  BOVEN 100 procent en sneden daarmee de onderste helft van de eigen drempelzone weg. Met de
  zonegrens van de engine verdwijnt het grootste deel van het verschijnsel.
- **M88 BLIJFT STAAN ALS NORM** en wordt niet heropend: frequentie plafonneert (literatuur), dosis
  per kwaliteitsdag daalt niet met het volume (beleid). Geen getal als eis.
- **VIER PUNTEN OP RIJ ZONDER BOUW — 40, 41, 42, 44.** Dat is geen reeks mislukkingen maar een
  bevinding: op de coach-canon doet de app grotendeels het juiste. Wie een vijfde canon-punt opent,
  weegt dat mee.
- **NIEUWE LES** in `docs/WERKWIJZE-LESSEN.md`: een geërfde meetlat is niet getoetst tot je hem
  tegen de bron legt; het predicaat hoort bij elk getal genoemd.
- **NIEUWE REGEL** in `docs/WERKWIJZE.md`: een meting en een voorstel komen nooit in dezelfde
  beurt, en een autorisatie dekt één plek.
- **VLOEREN NU: vitest-totaal 985 over 78 bestanden · engine-selftest-assert-count 1757 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only,
  geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, opnieuw te greppen in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35. Punt 44 hoort er
  niet meer bij.

FOCUS VOLGENDE CHAT: DE CUTOVER, niet de coach-canon. De canon-punten 40, 41, 42 en 44 sloten alle
vier zonder bouw; wat het project AF maakt zijn FASE-C (de Garmin-push via intervals.icu) en de
DocProp-weekplan-migratie. Begin met een RECON, read-only: wat staat er van FASE-C al, wat ontbreekt,
en wat is de kleinste stap die werkend resultaat oplevert. LEVER DE RECON EN STOP — geen bouwvoorstel
in dezelfde beurt. Verse chat.

STAND 2026-08-11 — punt 44: HET BESLUIT STAAT, ER IS NIETS GEBOUWD (item 6e). Docs-only, met ÉÉN
losse code-commit voor een test-defect dat de gate blokkeerde (zie onderaan). Geen engine, geen
migratie, geen deploy, geen enkel `wrangler`-commando — ook geen read. Prod en D1 staan waar het
blok hieronder ze noemt. Punt 44 blijft OPEN: het besluit is de norm, de meting komt nog.
- **M88 STAAT ALS NORM** in `docs/TRAININGSMODEL.md`, twee delen met VERSCHILLENDE herkomst. (a)
  LITERATUUR: het aantal dagen per week met werk boven de drempel groeit niet mee met het volume —
  vanaf circa acht uur zijn het er twee. (b) BELEID, Daan-besluit 11-08-2026: de tijd boven de
  drempel PER kwaliteitsdag daalt niet als het weekvolume stijgt.
- **ER IS GEEN GETAL ALS EIS, EN DAT IS EEN INTREKKING.** De 36 tot 40 minuten boven de drempel bij
  veertien uur zijn voorgelegd én goedgekeurd vóórdat de bron gelezen was. Ze zijn INGETROKKEN als
  eis en staan nog als verwachting. Een volgende ronde die ze tegenkomt: dit is geen norm.
- **HET PLAFOND IS EEN CONSTANTE, GEEN ONTSTAAND GEDRAG.** Het aantal kwaliteitsdagen komt uit één
  veld per doelprofiel met een waarde per macrofase — drie profielen 3/3/3, twee 2/3/2, Test-fase
  geen sleutel dus 0, deload klemt naar 1. Dat veld kent het weekvolume niet. Bij W1 begrenzen de
  dagen het quotum, vanaf W4 begrenst het quotum de dagen.
- **DE 1,75 IS EEN SAMENSTELLINGS-GETAL, en dat verschuift de aangewezen ingreep.** Het predicaat
  van de meting is werk boven 100 procent FTP; sweet-spot op 89-93 procent valt daarbuiten. Tussen
  quotum 2 of 3 en 1,75 dagen boven de drempel zit een stap die nooit geteld is. De ingreep is niet
  "meer kwaliteitsdagen" maar "de dagen die er staan dragen de drempel" — raakt M74 en M81.
- **HET HUIDIGE PLAFOND IS GROTENDEELS TERECHT, en dat hoort hier zodat de volgende ronde het niet
  groter maakt dan het is.** BEREKEND op de reeks van M85, geen eigen meting: 89,0 / 7,9 / 3,2 bij
  veertien uur, binnen de spreiding van drie top-5-Giro-renners. Kwaliteit evenredig met volume
  laten groeien zou het plan buiten die praktijk duwen.
- **EEN GROENE GATE HEEFT EEN HOUDBAARHEIDSDATUM, en dat is de zwaarste vondst van deze ronde.**
  `apps/web/src/lib/pendel.test.ts` was groen op `53fd893` toen CI hem draaide en STABIEL ROOD op
  diezelfde commit toen de close-out hem drie weken later opnieuw draaide — vijf runs, 509 in
  plaats van 530 op `v.minuten.gepland`, zonder dat er een letter aan de repo veranderd was. Oorzaak:
  `const BLOB` riep `buildWeekProposal` aan tijdens de MODULE-EVALUATIE, die aan elke `beforeAll`
  voorafgaat, dus die ene aanroep zag de wandklok terwijl de rest van de test op 2026-07-29 stond.
  CI had niets gemist: op de dag van die run WAS de test groen.
- **DE FIX IS EEN EIGEN COMMIT, `acd46355eaa481499307c6ca3598b55cf8bc818c`** — precies één bestand,
  de klok-pin van `beforeAll` naar module-niveau, geen verwachte waarde aangeraakt. Rood 9/1 vóór,
  groen 10/0 ná. GEGREPT over alle 21 testbestanden met `setSystemTime`: `pendel.test.ts` is de
  ENIGE waar een module-fixture een builder aanroept; de tweede kandidaat `quotaAftrek.test.ts`
  bouwt op een absolute datum en is klok-onafhankelijk.
- **TWEE NIEUWE LESSEN** in `docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md`: de module-fixture boven de
  klok-pin, en `pnpm test -- <naam>` dat NIET filtert maar wel een plausibele uitslag geeft.
- **NIEUWE LES** in `docs/WERKWIJZE-LESSEN.md`: een besluit dat een getal als uitkomst noemt, heeft
  de bron gelezen die dat getal produceert. Norm-vraag en mechanisme-vraag zijn twee vragen.
- **NIEUW OP DE PARKEERLIJST (TOOLING):** er staat geen meetscript voor de plan-metingen in de
  repo; elke ronde bouwt en ijkt zijn eigen esbuild-instrument opnieuw op 21 van de 21.
- **VLOEREN NU: vitest-totaal 985 over 78 bestanden · engine-selftest-assert-count 1757 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Lees ze zelf uit de
  suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 44. Punt 46
  hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 44 — de decompositie-meting, item 6e. READ-ONLY RECON, GEEN BOUW:
tel per volumepunt W1 tot en met W7 de keten quotum → toegewezen kwaliteitsdagen → dagen met werk
boven 100 procent FTP, en zoek uit waarom de dosis per kwaliteitsdag bovenin DAALT (18,3 bij tien
uur naar 14,9 bij twaalf en 15,2 bij veertien). GEEN BOUW IS EEN GELDIGE UITKOMST — dit punt kan
sluiten zoals 40, 41 en 42. De norm ligt vast in M88 en wordt niet heropend; wat openstaat is het
MECHANISME. Engine-terrein: engine-autorisatie is NIET gegeven en voor een read-only meting ook niet
nodig. IJK HET INSTRUMENT EERST op de gepinde waarden en meld de ijkuitslag vóór enige conclusie.
Verse chat.

STAND 2026-08-10 — punt 46 GESLOTEN (item 6f) en NAAR VOREN GEHAALD vóór 6e. De lessen staan nu
in TWEE bestanden die de opener allebei ophaalt; de opener telt zes URL's. Bouw `5de6c3f`, de
omkering `296d065`. Docs-only: geen code, geen engine, geen migratie, geen deploy, en geen enkel
`wrangler`-commando. Prod en D1 staan waar het blok hieronder ze noemt.
DE OMKERING IS EERST VASTGELEGD, en dat was Daans instructie: 6f vóór 6e, met de reden in
`docs/ROADMAP.md` *De volgorde*. GROND: het bestand stond op 110213 bytes met 10787 marge en
groeide 2289 bytes per ronde — vier à vijf rondes — terwijl punt 44 er twee tot drie zou kosten.
Dan had 6f onder tijdsdruk gemoeten, precies wat dit punt hoort te voorkomen.
DE SPLITSING IS VERLIESLOOS BEWEZEN: multiset-gelijkheid over de twee nieuwe rompen tegen de romp
uit `296d065` gaf **0 verschillen op 985 distincte regels**, 986 rompregels aan beide kanten. Een
"precies één keer"-toets zou per constructie zijn gevallen — het bestand draagt één regel die er
twee keer in staat. Dat is de les uit punt 38, nu op het bestand waar diezelfde ronde juist
vaststelde dat alle regels toen nog uniek waren.
DE KNIP LOOPT OP INSTRUMENT TEGEN BEWIJSLAST, en die as bepaalt waar een NIEUWE les landt.
`docs/WERKWIJZE-LESSEN-GEREEDSCHAP.md` draagt de **57** lessen waarvan de grond aan een tool,
bestand, commando of harness in deze repo hangt; die verouderen en worden herijkt zodra dat
gereedschap verandert. `docs/WERKWIJZE-LESSEN.md` houdt de **87** over de VORM van bewijs, die
niet verouderen. De regel staat in *Recon en bewijslast* en in de kop van beide bestanden.
DE VOORGESTELDE AS IS GEMETEN EN AFGEVALLEN, en dat hoort hier zodat een volgende ronde het niet
opnieuw probeert. "Nog dragend voor een openstaand punt" snijdt dit materiaal niet: **89 van de
144** lessen noemen geen enkel puntnummer, en van de 55 die er wél een noemen doen er **50** dat
binnen de AANLEIDING — dus als herkomst en niet als reikwijdte. Slechts **6** raken een open punt.
INKORTEN IS OOK UITGEMETEN EN TE KLEIN. De aanleiding-massa is 56390 bytes (51,5 procent), maar
**99 van de 108** aanleidingen dragen een cijfer en juist dat cijfer is de grond van de regel. Wat
er zonder verlies uit kan is pure provenance: **26 zinnen, 2270 bytes, 2,1 procent**.
Familie-consolidatie idem — 36 distincte families, de meest genoemde vier keer.
DE GROEI IS SCHEEF, en dat is de reden dat de knip daar ligt. Over het nieuwste derde deel van de
oude lijst ging **25470 bytes** naar de gereedschapshelft tegen **15217** naar de bewijslasthelft:
de helft die veroudert is ook de helft die aangroeit. Runway op 2289 per ronde: circa 52 rondes
gereedschap, circa 67 bewijslast.
MARGES OP `5de6c3f`, grens circa 121000: WERKWIJZE 34347 (+86653), LESSEN 64834 (+56166),
LESSEN-GEREEDSCHAP 47404 (+73596), TRAININGSMODEL 37588 (+83412), HANDOFF 63229 (+57771),
DOELEN-SPEC 31808 (+89192). De krapste marge ging van 10787 naar 56166, en het knelpunt verschoof
naar `HANDOFF.md` — die begrenst zichzelf met de rotatie op twaalf blokken, en deze close-out
voert die uit. De bytes ná deze commit staan in het CC-rapport.
VLOEREN NU: vitest-totaal 985 over 78 bestanden · engine-selftest-assert-count 1757 ·
lint-waarschuwingen 20, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only, geen
test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
WAT DAAN MERKT: NIETS aan de app. Wat wél verandert is de opener: zes URL's in plaats van vijf.
DRIE AFWIJKINGEN, alle door CC gemeld en alle goedgekeurd. (1) Vier regels van item 6e in *De
volgorde* zijn opnieuw afgebroken omdat de vervanging de eerste regel op 122 tekens bracht; alleen
regelafbreking. (2) De logregel belandde eerst boven in plaats van onderaan
`docs/WERKWIJZE-LOG.md` en is teruggedraaid. (3) Een NIET-ingreep: de dubbele lege regel tussen
kop en eerste les in `docs/WERKWIJZE-LESSEN.md` stond er al vóór deze ronde en is bewust blijven
staan, want weghalen viel buiten de opdracht.
OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`: 16 · 32 · 34 · 35 · 44. Punt 46 hoort
er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 44 — de kwaliteitsdosis plafonneert vanaf circa acht uur. Item
6e uit *De volgorde* in `docs/ROADMAP.md`; 6f is met deze ronde gesloten, dus dit is GEEN
afwijking van de reeks. LET OP DE SOORT: dit is COACH-CANON en geen meetopdracht. De ronde begint
met een BESLUIT van Daan over hoeveel kwaliteit bij veertien uur hoort — herkomst BELEID — want er
bestaat geen reeks waarop dat te ijken valt, en de eigen historie is per de bewijslast-regels geen
bron voor een regel die gedrag VERVANGT. Zonder dat besluit is er niets om tegen te bouwen. DRAAGT
M85 (BEVINDING): het weekvolume groeit van 180 naar 840 minuten en Z1 van 125 naar 748, terwijl Z2
en Z3 samen van 55 naar 92 gaan en vanaf acht uur stilstaan op 88, 92, 94, 92 — zes extra uren
leveren nul extra kwaliteitsminuten. Het plafond zit in het AANTAL kwaliteitsdagen (1,6 à 1,75) en
niet in de dosis per dag. M45 wordt er niet door geschonden: die noemt acht à tien uur als
ondergrens waaronder polarized zinloos is en zwijgt over wat daarboven hoort. DE VAKLITERATUUR
GAAT VOOR EEN POPUP — dat is de les uit de M86-ronde, en ze geldt hier woordelijk. Verse chat.

STAND 2026-08-10 — punt 43 GESLOTEN (item 6d) EN LIVE. Code 95751a1, recon-doc 16320fd.
De normpoort stond op een midpunt-label dat identiek werk splitste. Blokken dragen nu
`coreWork: true` waar ze een werkprikkel zijn; `werkzoneLabelsVan_` opent voor die blokken
de HELE band op de indeling van `pctZoneBucket_`, en houdt het midpunt-label er
onvoorwaardelijk in. De poort kan daardoor per constructie nooit smaller worden.
DEPLOYED naar prod, Version ID e994c768-3d73-4aec-876b-b614b7fe1302,
https://cadans-api.dtkorteweg.workers.dev — geen migratie, geen remote-D1-mutatie.
Live geverifieerd op BUNDEL-IDENTITEIT, niet op health: de live index.html verwijst naar
assets/index-BoCic_Ah.js en die bundel is byte-identiek aan de lokale build (584155 bytes,
sha256 begint op 2678c3a89933696f).
GEMETEN, eigen instrument, 420 cellen / 1920 sessies / 12965 blokken, weekvorm-as 21 van de 21
voor en na: sweetspot-cellen 266 van de 266 consistent op drempel+tempo (was 161 enkel tempo /
90 enkel drempel / 15 beide). Weekkorrel 116 breder, 0 smaller; dagkorrel 410 breder, 0 smaller.
Verdamping 2866,8 → 509,1 van 30201,6 werkminuten. Sleutelzone-dagen 714 → 980.
Terugval: een bewaarde rij zonder het veld geeft 420 van de 420 weken en 1592 van de 1592 dagen
gelijk aan de VOOR-staat — geen aparte tak, `weekplanBlob.ts:128` draagt de blokken verbatim.
BEGRENZING, structureel: de poort bepaalt WIE moet slagen, niet de norm (`blok.ts:651`/`:671`),
dus `geleverdOk` kan alleen true→false en `dosisTredeVoorstel` alleen naar null. Geen
dosisverhoging die er niet was. De nieuwe eis is nergens dun: over de 116 toegevoegde
(week,zone)-paren minimaal 7 minuten, mediaan 20, nul onder de 7.
VLOEREN 985 tests / 78 bestanden / 1757 engine-asserts / 20 lint-waarschuwingen.
VIJF AFWIJKINGEN, alle goedgekeurd. (1) De emit-helper kreeg een grens bovenop
`kind === "work"`: geen vlag als het midpunt in rust of z2 ligt. Chat-zijde nagemeten — 473
intra-rust-blokken verloren de vlag, ALLE acceptatiegetallen identiek. De spec had hier een gat:
die blokken waren poort-inert (puntbanden) en dat is als "geen probleem" weggeredeneerd in plaats
van als "verkeerd gevlagd". (2) De selftest-assertie landde in `testArchetypeLib` en niet in de
fixture-lus, want `fx_steady_duur` is zone 2 en hoort geen kern te hebben; drie eisen per
archetype, +105 asserts. (3) T4 was eerst groen om de verkeerde reden — de Onderhoud-fixture gaf
een `expandArchetype_`-dag in plaats van een `renderVariant_`-duursessie, en viel dus niet onder
R2. Herschreven zodat hij die sessie EIST. (4) `punt15.test.ts` moest mee: dat geval isoleerde
term 2 van de conjunctie via verdamping, en op FTP/Build dekt de bredere poort sinds deze bouw de
hele vraag (95 van 95). Verplaatst naar Korte beklimmingen/Build — poort {drempel, anaeroob},
gevraagd 69, beoordeelbaar 65. Zelfde claim, ander dragend blok. (5) Bij de deploy bleek
`/api/health` geen versieveld te dragen; CC heeft de verificatie daarom op bundel-identiteit
gezet. Dat is vanaf nu de norm, en het versieveld staat op de parkeerlijst.
LET OP VOOR EEN VOLGENDE POORT-VERBREDING: nog drie blokken dragen die M3-claim, en Lange
beklimmingen/Peak heeft marge 1. Verbreedt een volgend punt de poort verder, dan verliest dat
geval zijn grond en moet het opnieuw verplaatst, niet verzwakt.
ROOD, gedraaid en gevallen: R1 vlag weg bij interval-ON → 4 tests over 2 bestanden (chat-zijde:
sweetspot zakt 266 → 15). R2 low-uitzondering weg op het steady-blok → 2 tests (chat-zijde: 116 →
144 weken breder, het 73-77-lek uit `z2_progressief`).
NIET GEMETEN: het effect op een echt OORDEEL (`activities` leeg gevoed, dus `geleverd` nul) en de
disjunctie in `sleutelinhaal.ts` (`voorgesteldType` is in de opstelling op alle 1920 sessies null,
dus de intent-term is per constructie 0 — niet vergelijkbaar met de 360 van de 360 uit punt 40).
De volume-as W1..W7 is niet gedraaid.
MARGE: `docs/WERKWIJZE-LESSEN.md` stond voor deze close-out op 107224 bytes, 13776 tot de
opener-limiet. Gemeten over de laatste zeven close-outs groeit dat bestand ~2200 bytes per ronde,
dus ruwweg zes rondes runway — krapper dan wat punt 46 in de ROADMAP schat.

FOCUS VOLGENDE CHAT: ROADMAP punt 44 — item 6e uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN
afwijking van de reeks. Verse chat.

**PUNT 43 RONDE 2: DE HERKOMST-KANDIDAAT IS WEERLEGD, DE OPVOLGER HAALT DE EISEN (10 augustus
2026).** Docs-only: geen code, geen engine, geen migratie, geen deploy, en geen enkel
`wrangler`-commando. ÉÉN commit — deze close-out draagt `docs/PUNT43-HERKOMST-RECON.md`, de
ROADMAP-correctie, twee lessen, twee logregels en de HANDOFF-rotatie; hij noemt zijn eigen hash
niet, want die bestaat pas nadat dit blok geschreven is. Prod en D1 staan waar het blok hieronder
ze noemt.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit was een
  meting en een weerlegging.
- **DE METING.** `buildWeekProposal`, `ARCHETYPES` en `pctZoneBucket_` uit een esbuild-bundel,
  `TZ=Europe/Amsterdam`, klok als Proxy op de echte `Date`. Weekvorm-as V1..V7 maal 5 doelen maal
  12 (fase,meso)-paren: **420 cellen, 1920 sessies, 12965 blokken, 40 distincte banden, 150514,2
  blokminuten**. IJking vooraf **21 van de 21**; A/A op de volledige dump **byte-identiek**; de
  twaalf paren AFGELEZEN over zestien `doelStart`-offsets, periode 12.
- **EEN GAT IN DE EIGEN OPSTELLING, GEVONDEN VOOR ER IETS OP GEBOUWD WAS.** De cel-sleutel stond
  op `(vorm, doel, fase, meso)` en collabeerde: bij Onderhoud is `mesoCyclus` false, dus twaalf
  offsets vallen samen — **343 cellen in plaats van 420**. De sleutel staat nu op de OFFSET.
- **DE KANDIDAAT UIT RONDE 1 IS PER CONSTRUCTIE NIET LEESBAAR.** Over alle **14** blok-producenten
  draagt een blok exact VIER velden: `minuten`, `zone`, `pctLo`, `pctHi`. De bedoeling staat op het
  archetype — `sweetspot_3x8` en `sweetspot_4x12` dragen allebei `effectTags: ["sweetspot"]` — en
  reist niet mee. Het defect is daarmee scherp: 88-92 geeft midpunt 90 en label `tempo`, 89-92
  geeft 90,5 en label `drempel`.
- **OP SESSIE-NIVEAU GEPOORT SCHEIDT HIJ DE TWEE GEVALLEN NIET.** Van de 122 cellen met een
  werkzone uitsluitend uit een niet-werkblok blijven er **121** staan; op dagniveau zakt het lek
  van 574 naar 385 en verdwijnt het niet. De vulling zit ook BINNEN werksessies: `55-78` bij
  `threshold_ladder_kort`, `55-80` bij de vo2-archetypes.
- **EN HIJ FAALT OP HET BEGRENZINGSBEWIJS.** 0 cellen maar **84 dagen** SMALLER, doordat **2701**
  werkzone-blokminuten uit sessies ZONDER `archetypeId` komen — `95-102` (1357) en `100-108`
  (1344), geen vulling maar echt drempelwerk. Op die dagen kan hij een tekort verbergen.
- **DE OPVOLGER HAALT ALLES: de raak-poort voor CORE-werkblokken, het midpunt-label voor de rest.**
  Sweetspot **266 van de 266** consistent op `drempel+tempo` tegen 161/90/15 nu; **0 cellen en 0
  dagen SMALLER**; verdamping van **2870 van de 30201 (9,5 procent)** naar **509 (1,7 procent)**;
  en het niet-werkblok-lek op 87 cellen tegen **108 in de VOOR-STAAT**, dus eronder.
- **DEZE REEKS IS NIET DIE VAN RONDE 1, EN DAT HOORT HIER.** Cellen (420), sessies (1920), alle
  negen band-aandelen én band-labels van `docs/PUNT43-POORT-RECON.md` §3 en de band `100-108`
  (1344 minuten) reproduceren exact — maar de cel-verdeling geeft **266 / 161 / 90 / 15** tegen
  **278 / 146 / 117 / 15**. Het verschil is variant-rotatie. Twee onafhankelijke definities van de
  teller gaven identiek 266/161/90/15, dus de definitie was het niet. GEEN ENKEL getal uit ronde 1
  is als eis gebruikt.
- **DE SCOPE VERSCHUIFT NAAR ENGINE.** Het blok moet zijn bedoeling gaan dragen, plus doorvoer naar
  de bewaarde weekplan-rijen. Punt 43 stond als CLIENT en dat is met deze meting onjuist. Rijen
  zonder dat veld vallen terug op het huidige gedrag; die terugval hoort in de bouwspec en in een
  rood-meting.
- **WAT DEZE RONDE NIET DEED, expliciet.** `dosisTredeVoorstel` is NIET op meebewegen getoetst en
  `sleutelinhaal.ts:44` is niet hertoetst. Beide meten het EFFECT op een oordeel en vragen de
  GELEVERDE kant, en die is hier leeg gevoed. De volume-as W1..W7 is niet gedraaid.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **TWEE NIEUWE WERKWIJZE-AFSPRAKEN**, beide in `docs/WERKWIJZE-LESSEN.md`: (1) een kandidaat die
  een eigenschap van een object noemt, toetst eerst of dat object die eigenschap draagt; (2) een
  reeks uit een vorige ronde is pas een ijkpunt als haar SCRIPT in de repo staat — een
  fixture-beschrijving volstaat niet, en dit is de eerste keer dat een volledig gevolgde
  beschrijving tóch niet reproduceerde.
- **VLOEREN NU: vitest-totaal 980 over 77 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only,
  geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit een ouder blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 43 · 44 · 46.
  Punt 43 hoort er nog steeds bij — deze ronde weerlegde een kandidaat, ze repareerde niets.

FOCUS VOLGENDE CHAT: ROADMAP punt 43, ronde 3 — nu de BOUW. Item 6d uit *De volgorde* in
`docs/ROADMAP.md`, dus GEEN afwijking van de reeks. DE KANDIDAAT STAAT VAST en is de monotone
synthese uit `docs/PUNT43-HERKOMST-RECON.md` §5; de aandeel-familie en de sessie-herkomst zijn
allebei uitgemeten en afgevallen, begin daar niet opnieuw. ENGINE, dus RECON-FIRST met een
stop-en-verifieer voordat er één regel engine wordt aangeraakt; een echte engine-bug wordt
geflagd, nooit stilzwijgend gepatcht. DRIE DINGEN HOREN IN DIE RONDE: (a) de terugval voor
bewaarde weekplan-rijen ZONDER het nieuwe veld, met een rood-meting die aantoonbaar valt; (b)
`dosisTredeVoorstel` op meebewegen — blijft dat nul, dan is dat het begrenzingsbewijs dat het punt
vraagt; (c) de hertoets van `sleutelinhaal.ts:44`, want een bredere zone-term verandert de
disjunctie waarop punt 43 hem buiten scope zette. MEET PER PLEK EN IN BEIDE RICHTINGEN over
`weektekort.ts:114`, `blok.ts:413` en `sleutelinhaal.ts:44`. IJK JE EIGEN INSTRUMENT en erf geen
getal uit ronde 1 of 2. Verse chat.

**PUNT 43 IS GEMETEN, NIET GEREPAREERD (10 augustus 2026).** De poort is gekwantificeerd, de voor
de hand liggende reparatie is uitgemeten en loopt vast op een band die geen aandeel-drempel kan
scheiden. Docs-only: geen code, geen engine, geen migratie, geen deploy, en geen enkel
`wrangler`-commando. ÉÉN commit — deze close-out draagt `docs/PUNT43-POORT-RECON.md`, de
ROADMAP-aanvulling, de les en de logregel; hij noemt zijn eigen hash niet, want die bestaat pas
nadat dit blok geschreven is. Prod en D1 staan waar het blok hieronder ze noemt.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit was een
  meting en een tussenverdict.
- **DE METING.** `buildWeekProposal` plus `apps/web/src/lib` uit een esbuild-bundel,
  `TZ=Europe/Amsterdam`, klok als Proxy op de echte `Date`. Weekvorm-as V1..V7 maal 5 doelen maal
  12 (fase,meso)-paren: **420 cellen, 1920 sessies, 13372 blokken, 39 distincte banden, 139462
  blokminuten**. IJking vooraf **21 van de 21**; de twaalf paren zijn AFGELEZEN over zestien
  `doelStart`-offsets, periode 12. Volledige uitwerking in `docs/PUNT43-POORT-RECON.md`.
- **DE PREMISSE HOUDT STAND OP EEN BREDERE AS.** Van de **278 cellen met sweetspot-werk** labelt
  de poort er **146 uitsluitend tempo, 117 uitsluitend drempel, 15 beide**. Punt 43 noemde 48/33/9
  van 90, gemeten met de EVENT-as als variatie — en die zet de macrofase niet, dus daar stond de
  fase vast. Zelfde vorm, ruimere ruimte.
- **DE PRIJS IS NU EEN GETAL: 3578 van de 31474 voorgeschreven WERKminuten (11,4 procent) vallen
  BUITEN de poort.** Norm-massa die verdampt; zelfde vorm als wat punt 14 fase 1 op de totaal-eis
  vond, nu op de zone-eis.
- **DE AANDEEL-KANDIDAAT: EEN BEGRENZINGSBEWIJS EN EEN PLATEAU.** Poorten op het minuten-aandeel
  in plaats van op het midpunt maakt **nul cellen en nul dagen SMALLER** over de hele as t 0 tot
  50 — de ingreep kan dus geen bestaand tekort VERBERGEN, alleen verdampte tekorten zichtbaar
  maken. En er is een plateau op **t 21 tot en met 33**, dertien procentpunt breed, waar alle 278
  sweetspot-cellen consistent zijn en 168 van de 420 cellen bewegen.
- **EN DAAR LOOPT HIJ VAST, OP ÉÉN BAND.** `73-77` draagt aandeel **50/50 over z2 en tempo —
  exact gelijk aan sweetspot-band `88-92`**. Alle 1483 minuten komen uit `Z2 progressief
  (ingekort)`, zonder `archetypeId`: een blok op 75 procent FTP krijgt op
  `packages/engine/src/planner.ts:1377` de band `pct ± 2` en ligt per constructie op de
  Z2/tempo-grens. Over het HELE plateau krijgen **105 van de 1496 dagen** een werkzone uitsluitend
  uit vulling-overloop. Op AANDEEL zijn die twee niet te scheiden — dat is een grens op de
  grootheid, geen keuze tussen waarden.
- **DE GRENZEN ZIJN AAN DE BRON GETOETST EN STAAN GOED**, en dat hoort hier zodat een volgende
  ronde de vraag niet opnieuw stelt. Intervals `power_zones` geeft bij de testcase 55 / 75 / 90 /
  105, identiek aan `ZONE5_GRENZEN_DEFAULT` — app en intervals zijn het per constructie eens. De
  Sweet Spot-band van 84 tot 97 procent die intervals toont is een OVERLAY en geen zone, en loopt
  zelf dwars over de Z3/Z4-grens. Het defect zit niet in de grenzen maar in de vraag: één label
  per blok kan niet uitdrukken dat sweetspot bewust over twee zones ligt.
- **WAT DEZE RONDE NIET DEED, expliciet.** `dosisTredeVoorstel` is NIET op meebewegen getoetst,
  terwijl punt 43 dat als begrenzingsbewijs vraagt. Het EFFECT op een oordeel is niet gemeten,
  alleen het potentieel — de geleverde kant is leeg gevoed. En de volume-as W1..W7 is niet
  gedraaid, dus over volume zegt deze ronde niets.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **ÉÉN NIEUWE WERKWIJZE-AFSPRAAK**, in `docs/WERKWIJZE-LESSEN.md`: een controleregel is zelf een
  commando, en een commando dat niet kan draaien is niet te onderscheiden van een geslaagde
  controle. Aanleiding: een premissenregel droeg tweemaal `-Path`; de vindplaats klopte, dus
  controle 1 gaf groen terwijl de toetsende regel niet kon draaien. Bewust GEEN zesde
  promptcontrole — dat maximum blijft vijf.
- **VLOEREN NU: vitest-totaal 980 over 77 bestanden · engine-selftest-assert-count
  1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde.
  Onbewogen verwacht: docs-only, geen test geraakt. Lees ze zelf uit de suite; neem ze niet over
  uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 43 · 44 · 46.
  Punt 43 hoort er nog steeds bij — deze ronde mat het punt, ze repareerde het niet.

FOCUS VOLGENDE CHAT: ROADMAP punt 43, ronde 2. Item 6d uit *De volgorde* in `docs/ROADMAP.md`,
dus GEEN afwijking van de reeks. DE AANDEEL-FAMILIE IS UITGEMETEN EN AFGEVALLEN; begin daar niet
opnieuw. DE KANDIDAAT IS DE HERKOMST: poorten op wat een blok BEDOELT te zijn — `sweetspot_*`
tegenover een vulblok zonder `archetypeId` — want dat scheidt precies de twee gevallen die op
aandeel samenvallen, en M81 wijst dezelfde kant op. MEET PER PLEK EN IN BEIDE RICHTINGEN over de
drie consumenten: `weektekort.ts:114`, `blok.ts:413` en `sleutelinhaal.ts:44`. Die derde is door
punt 43 buiten scope gezet op grond van 360 van de 360 op de DISJUNCTIE, en dat is een uitspraak
over de poort zoals hij VANDAAG staat — hertoets hem, want een bredere zone-term verandert die
disjunctie. EN HET OPENSTAANDE BEGRENZINGSBEWIJS HOORT ERBIJ: toets of `dosisTredeVoorstel`
meebeweegt; blijft dat nul, dan is dat het bewijs dat het punt vraagt. De meetopstelling ligt
klaar in `docs/PUNT43-POORT-RECON.md` §1 en is met 21 van de 21 geijkt. Verse chat.

**PUNT 39 EN 45 ZIJN AF EN STAAN LIVE (9 augustus 2026).** De herstelweek snijdt eindelijk in het
volume, en hij kort tegen de OPBOUWWEKEN in plaats van tegen zichzelf. Commit `d7b8feb7b92b41955268fe2b6abf3b34b3ab00fc`
(de bouw) plus deze close-out. Worker Version `ef9152dc-5c86-4606-ab97-55df97449877`. GEEN migratie en geen enkel
`wrangler d1`-commando — deze bouw raakt D1 niet.
- **WAT ER GEBOUWD IS, EN HET IS CLIENT-ONLY.** `herstelSchaal_` in `apps/web/src/lib/proposal.ts`
  draagt M86 en M87 samen; de toepassing landt op `sessieMin` in de dag-loop. GEEN engine, GEEN
  worker, GEEN nieuwe route: de historie komt uit drie extra aanroepen van de BESTAANDE
  `GET /api/planner/:monday`, en `laadGelabeld` draait op `Promise.allSettled` dus dat kost geen
  extra rondreis. `git diff --stat HEAD~1 HEAD -- packages/engine` is leeg.
- **DE CONDITIE SPIEGELT DE ENGINE:** `mesoWeek === 4 && !nearTaper`, exact `isRecovery` op
  `packages/engine/src/planner.ts:708`. Zonder de tweede term krimpt de client een week waar de
  engine geen deload draait.
- **HET VERDICT VAN PUNT 45, OP DE ECHTE D1 GEMETEN.** `planner_days` draagt **5 van de 5** weken,
  alle vijf compleet met 7 rijen; de weekplan-blob draagt er **3** en heeft voor 2026-07-06 en
  2026-07-13 niets. Waar beide bestaan wijkt de blob **0, +25,0 en +31,9 procent** af (300/300,
  375/300, 356/270) — geen systematische offset, en een orde groter dan de +0,9 procent van de
  gebouwde duur. DE REFERENT IS DUS `planner_days`, en dat is ook M28: de weekplanner is de
  INVOER, de blob is het vorige VOORSTEL van de app. De twee queries sluiten op elkaar: 21
  traindagen en 1425 minuten aan beide kanten.
- **DE ACCEPTATIE IS GEHAALD, MET DE VOOR-STAAT ALS IJKING.** Instrument eerst geijkt op de
  VOOR-reeks uit `docs/PUNT39-PLEK-RECON.md` §2: **100 / 100 / 100 / 95 / 97 / 92 / 88**, 7 van de
  7. NA: **76 / 75 / 72 / 63 / 56 / 56 / 56** over W1..W7, 84 cellen. Werkband van de deloadweek
  **56 van de 56** op Base+Build en **84 van de 84** over alle paren; opbouwweken **84 van de 84**
  identiek; met en zonder historie **84 van de 84** gelijk.
- **DE EIS "KWALITEITSDAGEN OP 1" WAS TE BREED GEFORMULEERD, NIET GESCHONDEN.** Doel Conditie geeft
  er **0** in 14 van de 84 cellen — óók vóór de bouw. Voor tegen na is **84 van de 84** identiek.
  Zelfde vorm als de Test-familie die de plek-recon al vond: de eis stond op een ABSOLUTE waarde
  waar hij een VERSCHIL hoorde te toetsen.
- **EEN TERM DIE BIJNA TEN ONRECHTE ALS ONBEWEZEN WEGGING.** De vijf bouw-tests dragen geen event,
  dus `nearTaper` kan er per constructie niet true worden en de rood-patch liet niets vallen. Met
  een event in de lopende week bestaan `mesoWeek 4` én `nearTaper true` wél, en met de term uit
  zakt die week van **300,2 naar 231,2** minuten in alle drie de paren. De term is dus gedekt; wat
  ontbrak was een fixture die de conditie kón dragen.
- **M87 BIJT IN BEIDE RICHTINGEN, EN DE TWEEDE IS EEN EIGENSCHAP DIE DAAN MOET WETEN.** Herstelweek
  W1 met historie W3 gaat van 135,6 naar **179,6** minuten — het defect uit M87 is weg. Maar W3 met
  historie W1 gaat van 257,2 naar **157,2**: wie in zijn herstelweek MEER invult dan hij gewend is,
  wordt dieper gekort. Dat volgt uit de norm — de herstelweek is een percentage van je NORMALE
  volume — maar het betekent dat de app beschikbare tijd laat liggen. Geen defect, wel een keuze
  die zichtbaar hoort te zijn.
- **WAT DAAN MERKT:** in een herstelweek worden alle sessies korter terwijl het aantal ritten en de
  intensiteit gelijk blijven. Pendeldagen en dag-overrides krimpen NIET mee.
- **VLOEREN NU: vitest-totaal 980 over 77 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Het vitest-totaal steeg
  met 5 door `apps/web/src/lib/punt39.test.ts`; de engine-vloer is onbewogen. Lees ze zelf uit de
  suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 43 · 44 · 46.
  Punt 39 en 45 horen er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 43 — de normpoort staat op een midpunt-label dat identiek werk
splitst. Item 6d uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. Band
`88-92` en `88-93` verschillen één procentpunt en openen tegengestelde poorten: 48 cellen
uitsluitend tempo, 33 uitsluitend drempel, 9 beide, van de 90 met sweet-spot-werk. NIET
norm-neutraal, dus EERST per plek meten en in BEIDE richtingen — een poort die bepaalt waarop
geoordeeld wordt kan het oordeel omkeren, niet alleen afzwakken. Twee consumenten hangen eraan.
Punt 39 heeft de karakter-as nu samen met zijn eerste consument gebouwd, dus de as ligt er en de
meting gaat over het VERPLAATSEN van de poort. Verse chat.

**DE PLEK VOOR PUNT 39 IS GEMETEN EN BESLIST — NOG NIET GEBOUWD (9 augustus 2026).** Docs-only:
geen code, geen engine, geen migratie, geen deploy, en geen enkel `wrangler`-commando. EEN
commit — deze close-out draagt het plek-recon, M87, de M86-correctie, de ROADMAP en de lessen;
hij noemt zijn eigen hash niet, want die bestaat pas nadat dit blok geschreven is. Prod en D1
staan waar het blok hieronder ze noemt.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd.
- **DE METING.** `buildWeekProposal` uit een esbuild-bundel, `TZ=Europe/Amsterdam`, klok als
  Proxy op de echte `Date`. Volume-as W1..W7 maal 4 doelen met mesocyclus maal 3 deload-paren:
  **84 cellen**. IJking **21 van de 21**; (fase,meso)-as afgelezen over zestien
  `doelStart`-offsets als **twaalf gekoppelde paren, periode 12**. Vergelijker in TWEE
  richtingen geijkt: A/A **84 van de 84** aan beide kanten, tegenrichting **0 van de 84**.
  Volledige uitwerking in `docs/PUNT39-PLEK-RECON.md`.
- **ER ZIJN GEEN TWEE PLEKKEN MAAR DRIE**, en dat hoort hier zodat een volgende ronde de
  aanname niet opnieuw maakt. De keuze valt ook BINNEN `allocateQualityWeek_` via
  `draagkracht_`. De engine-patch NA de allocator gaf **84 van de 84 identiek** aan de
  client-patch — inert, geen bevinding.
- **DE PLEK IS CLIENT-SIDE, EN DE GROND IS M76.** De engine-plek VOOR de allocator haalt de
  curve exact (75 / 75 / 71 / 63 / 55 / 55 / 55) maar kantelt de werkband in **31 van de 56**
  Base+Build-cellen, waarvan **7** over een zone-klasse-grens — `threshold_ladder_kort`
  (100-100) wordt `threshold_2x8` (98-105). Plek A houdt de werkband **56 van de 56** identiek
  en de werkMINUTEN van de prikkel exact gelijk; **86 procent** van de volumekrimp komt uit de
  niet-kwaliteitsdagen. A tegen C: 43 van de 84 identiek, **41 afwijkend, alle 41 op de
  archetype-keuze en nul op alleen duur**. Het `weekV`-neveneffect is geisoleerd en niet
  dragend.
- **DRIE CORRECTIES OP DE OUDE BOUWSPEC.** De acceptatie-reeks is herijkt op
  **76 / 75 / 72 / 63 / 56 / 56 / 56** — het verschil is een systematische **+0,9 procent**
  doordat de gebouwde sessieduur boven de opgegeven duur uitkomt, niet een vloer. De eis
  "kwaliteitsdagen op 1" geldt alleen op Base en Build: bij macrofase Test is het quotum 0 en
  zijn het er 0, in **28 van de 84** cellen. En de drie genoemde vloeren bijten geen van
  drieen — **0** op de recovery-60-cap, **0** op de 30-vloer, **0** op de longZ2-60-vloer.
- **HET DEFECT DAT DEZE RONDE BLOOTLEGDE, EN DE VRAAG KWAM VAN DAAN.** De factor landt op de
  beschikbaarheid van de herstelweek ZELF en stapelt dus op een krimp die de gebruiker al
  droeg: 5x60 ingevuld geeft 225 minuten, 3x60 geeft **135** terwijl 180 het juiste antwoord
  is, en 5x45 geeft 5x34 met de kwaliteitsminuten van 13 naar **10**. Staat nu als **M87
  (NORM)**, herkomst BELEID, en als **ROADMAP punt 45** — in DEZELFDE bouw als de factor.
- **DE BRON BESTAAT, DE APP HEEFT HEM NIET IN HANDEN.** `planner_days`
  (`workers/api/src/db/schema.ts:128`) draagt de ingevulde beschikbaarheid per datum, maar de
  client haalt EEN week op (`apps/web/src/lib/api.ts:79`). De weekplan-blob draagt meerdere
  weken maar zijn `minuten` is de GEBOUWDE sessieduur, niet de invoer.
- **BEGRENZING op twee assen:** weekvorm-as **21 van de 21** onder beide patches, opbouwweken
  **84 van de 84** identiek bij alle patches.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen:
  docs-only, geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 39 · 43 ·
  44 · 45.

FOCUS VOLGENDE CHAT: ROADMAP punt 39 + 45, nu de BOUW. Item 6c uit *De volgorde* in
`docs/ROADMAP.md`, dus GEEN afwijking van de reeks. De plek staat vast en is CLIENT-SIDE op
`sessieMin` (`apps/web/src/lib/proposal.ts:619`) — GEEN engine, en de engine-variant is
gemeten en verworpen op M76. Lees `docs/PUNT39-PLEK-RECON.md` §9 voor de bouwspec; §7 van
`docs/PUNT39-DELOAD-RECON.md` is vervangen en stuurt niets meer. DE RONDE BEGINT BIJ PUNT 45,
niet bij de factor: meet EERST welke referentie-bron bruikbaar is — het ophaalpad verbreden zodat
`planner_days` meerdere weken levert, of de weekplan-blob lezen zoals `recencySeedEntries` dat al
doet — want zonder referent doet de factor in een alledaags geval het verkeerde. Blijkt geen van
beide bruikbaar, dan is dat een VERDICT met een getal en gaat de factor alleen. ACCEPTATIE voor
de factor: reeks 76 / 75 / 72 / 63 / 56 / 56 / 56, werkband 56 van de 56, kwaliteitsdagen 1 op
Base en Build en 0 op Test, opbouwweken 84 van de 84, weekvorm-as 21 van de 21. PENDELDAGEN
KRIMPEN NIET MEE — `DOELEN-SPEC` §2A, en uitdrukkelijk ongemeten. Verse chat.

**PUNT 39 IS GEMETEN, NIET GEBOUWD (9 augustus 2026).** Docs-only: geen code, geen engine, geen
migratie, geen deploy, en geen enkel `wrangler`-commando. ÉÉN commit — deze close-out draagt het
recon-doc, de norm-regel, de ROADMAP en de lessen; hij noemt zijn eigen hash niet, want die
bestaat pas nadat dit blok geschreven is. Prod en D1 staan waar het blok hieronder ze noemt.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd.
- **DE METING.** `buildWeekProposal` uit een esbuild-bundel, `TZ=Europe/Amsterdam`, klok als Proxy
  op de echte `Date`. Volume-as W1..W7 maal 5 doelen maal 5 (fase,meso)-paren: **175 cellen, 825
  sessies**. IJking **21 van de 21** op de weekvorm-as; instrumentcontrole **208** blokloze
  Recovery-sessies, exact het aantal uit de punt-41/42-ronde. Vergelijker in TWEE richtingen
  geijkt: A/A **105 van de 105 identiek**, tegenrichting **56 van de 105 afwijkend**. Volledige
  uitwerking in `docs/PUNT39-DELOAD-RECON.md`.
- **M80 HOUDT STAND EN WORDT BREDER:** het weekvolume krimpt in **28 van de 28** cellen tussen 0,1
  en 10,8 procent waar M79 om 40 tot 60 vraagt, en de langste dag beweegt 0,4 minuut of minder.
  MAAR HET DEFECT IS VOLUME-AFHANKELIJK: het aandeel weekbelasting uit duurdagen gaat van **9
  procent bij 3,0 uur naar 46 bij 14,0**, dus onderin doet de app ongeveer het juiste. De enige
  bestaande volumekrimp is de cap 30/60 in `genericRecovery` op `planner.ts:2042`.
- **BEIDE HENDELS UIT PUNT 39 ZIJN WEERLEGD**, en dat hoort hier zodat een volgende ronde ze niet
  opnieuw aanneemt. De kalendernaam-splitsing is INERT bij quotum 1 — **0 van de 105** — en
  gemaskeerd door het quotum zelf; bij quotum 2 bewegen er **56**. Het quotum verhogen maakt de
  week juist **10 tot 30 minuten LANGER**. Begrenzing: de opbouwweek beweegt **0 van de 35** bij
  alle drie de patches.
- **DE LITERATUUR IS OPGEZOCHT EN CORRIGEERDE HET ADVIES VAN DE CHAT.** Taper-meta-analyses: 41
  tot 60 procent minder volume zonder wijziging van intensiteit of frequentie, en KORTERE SESSIES
  boven MINDER sessies. Coachpraktijk voor herstelweken 40 tot 50 procent met één of twee korte
  prikkels. Geen urendrempel beschreven; bij een basis van vier tot zes uur circa 20 tot 25
  procent.
- **HET BESLUIT STAAT ALS M86 (NORM), HERKOMST BELEID**, Daan-besluit van deze ronde: een
  volumefactor op de SESSIEDUUR, **0,75 tot en met vijf uur aflopend naar 0,55 vanaf tien uur**,
  lineair ertussen, met de frequentie ongemoeid. GEMETEN volume tegenover de opbouwweek:
  **75 / 75 / 71 / 63 / 55 / 55 / 55** procent.
- **DE PRIKKELDOSIS IS GEEN DRAGEND BESLUIT**, en dat is gemeten in plaats van beredeneerd: met
  `mesoFactor(4)` op 1 stijgt de weekbelasting 1 tot 3 procentpunt en gaan de kwaliteitsminuten
  van circa 13 naar 16,5. De ×0,60 blijft staan; M76 en M83 ongemoeid.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only,
  geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 39 · 43 · 44.
  Punt 39 staat er nog steeds bij — deze ronde mat het punt, ze bouwde het niet.

FOCUS VOLGENDE CHAT: ROADMAP punt 39, nu de BOUW. Item 6c uit *De volgorde* in
`docs/ROADMAP.md`, dus GEEN afwijking van de reeks. De meting is gedaan en de norm staat; wat
rest is ÉÉN ingreep — de volumefactor uit M86, 0,75 tot en met vijf uur aflopend naar 0,55 vanaf
tien uur. Quotum en eligibility blijven zoals ze zijn; beide hendels uit het punt zijn weerlegd.
ENGINE-BESLISSING NOG OPEN: `docs/PUNT39-DELOAD-RECON.md` §7 draagt TWEE kandidaat-plekken —
client-side op `sessieMin` (`apps/web/src/lib/proposal.ts:619`) of in de engine vóór de bouwers —
en de bouwronde MEET PER PLEK voordat ze kiest, want `keyIntensity` krijgt `beschikbareTijd:
d.minuten` (`planner.ts:943`) en kiest het archetype dus op de VOLLE dagduur; krimpt alleen de
bouwduur, dan zit de keuze op een andere duurband dan de sessie. Landt de ingreep in de engine,
dan RECON-FIRST met een stop-en-verifieer; een echte engine-bug wordt geflagd, nooit stilzwijgend
gepatcht. DRIE VLOEREN HOREN VOORAF GEGREPT: de cap 30/60 in `genericRecovery`
(`planner.ts:2042`), de `Math.max(60, …)` in `genericLongZ2` en de warm/cool-trim bij `mins <= 75`
in `renderVariant_`. ACCEPTATIE-EIS is de reeks **75 / 75 / 71 / 63 / 55 / 55 / 55** met
kwaliteitsdagen ongewijzigd op 1 en de opbouwweek byte-identiek. Verse chat.

**PUNT 41 EN 42 ZIJN AF — BEIDE GESLOTEN ZONDER BOUW (9 augustus 2026).** Eén meetronde, twee
verdicten, en M78 is ingetrokken. Docs-only: geen code, geen engine, geen migratie, geen deploy,
en geen enkel `wrangler`-commando. ÉÉN commit: deze close-out draagt zowel
`docs/PUNT41-42-RECON.md` als de norm- en ROADMAP-wijzigingen — hij noemt zijn eigen hash niet,
want die bestaat pas nadat hij geschreven is. Prod en D1 staan waar het blok hieronder ze noemt;
grep die twee daar op in plaats van ze hier over te schrijven.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit was een
  meting, twee verdicten en vier norm-regels.
- **DE METING.** `buildWeekProposal` zelf aangeroepen uit een esbuild-bundel,
  `TZ=Europe/Amsterdam`, klok als Proxy op de echte `Date`. Zeven volumevormen maal vijf doelen
  maal twaalf (fase,meso)-paren: **420 cellen, 1980 sessies, 14978 blokken, 42 distincte banden,
  192674 blokminuten**. Instrument eerst geijkt op de weekvorm-as: **21 van de 21** gepinde
  waarden. Volledige uitwerking in `docs/PUNT41-42-RECON.md`.
- **PUNT 42: M78 IS WEERLEGD IN BEIDE TERMEN.** Binnen hetzelfde archetype gemeten — anders meet
  je variant-rotatie. De werkband is identiek in **200 van de 200** groepen over mesoweken en in
  **197 van de 197** over macrofasen; de werkMINUTEN bewegen in 200 van de 200. De factor is uit
  die minuten afgelezen: **1,00 / 1,08 / 1,15 / 0,60**. Staat nu als **M83 (BEVINDING)**; M78 is
  **INGETROKKEN** met de reden.
- **PUNT 41: HET PLAN POLARISEERT NIET, HET VERDUNT.** Seiler-3-zone op de band, opbouwweken,
  gepoold over doelen en fasen: 3,0u 69/20/10 · 4,5u 73/20/8 · 6,0u 78/17/6 · 8,0u 82/12/6 ·
  10,0u 85/11/5 · 12,0u 87/9/4 · 14,0u 89/8/3. De toewijzingsregel is NIET dragend — midpunt,
  proportioneel en meerderheid vallen binnen twee procentpunt samen, want op grens 80 wordt nul
  en op 100 slechts **4,1 procent** van de blokminuten doorgesneden. Staat als **M84 (BEVINDING)**.
- **DE ROTATIE-HYPOTHESE IS WEERLEGD.** Bij vaste weekvorm, doel én fase beweegt het Z3-aandeel
  over de mesoweken gemiddeld **0,9 procentpunt** (maximum 3,3, n=91), tegen **8,7** over de
  doelen en **6,9** over de volumes. De variatie is systematisch, geen sjabloonkeuze.
- **DE VONDST DIE HET PUNT NIET NOEMDE: DE KWALITEITSDOSIS PLAFONNEERT.** Het weekvolume groeit
  van 180 naar 840 minuten (factor 4,67) en Z1 van 125 naar 748 (factor 6,0), terwijl Z2 en Z3
  samen van 55 naar 92 gaan en vanaf acht uur STILSTAAN: **88, 92, 94, 92**. Zes extra uren
  leveren nul extra kwaliteitsminuten. Het plafond zit in het AANTAL kwaliteitsdagen — trainbare
  dagen 3 naar 6, dagen met werk boven 100 procent FTP blijven op **1,6 à 1,75** — en niet in de
  dosis per dag. Staat als **M85 (BEVINDING)** en als **ROADMAP punt 44**. COACH-CANON: of zes
  extra uren extra kwaliteit HOREN te dragen valt niet op deze reeks te ijken; dat is een besluit
  van Daan en er bestaat geen bouw vóór dat besluit. M45 wordt niet geschonden — die noemt acht à
  tien uur als ondergrens en zwijgt over wat daarboven hoort.
- **EEN GECORRIGEERDE AANNAME, en die hoort hier zodat een volgende ronde hem niet opnieuw
  maakt.** De macrofase hangt NIET aan de eventdatum maar aan `doelStart`: over tien eventdata
  van 1 tot 38 weken bleef `macroFase` op Build staan. `effectiveMacroFase_` laat de event-as
  alleen winnen bij Recovery of binnen de overnamegrens MÉT bevestiging. De bereikbare ruimte is
  daarmee **twaalf gekoppelde (fase,meso)-paren**, geen kruisproduct.
- **EEN ANOMALIE IN DE EIGEN MEETUITVOER, VERKLAARD EN NIET WEGGEPOETST.** 208 van de 1980
  sessies dragen geen blokken: alle 208 zijn Recovery-ritten, uitsluitend in mesoweek 4 en nooit
  bij Onderhoud, samen 11960 minuten. Hun intensiteit is uit de TSS AFGELEID en niet aangenomen —
  **46 procent FTP**, dus Z1. Meegeteld of niet verschuift de reeks hoogstens 3 procentpunt.
- **DE VOLUME-AS W1..W7 IS NU VASTGELEGD** in `docs/ROADMAP.md`, want de reeks van punt 41 was
  NIET reproduceerbaar: die weekvormen stonden nergens in de repo.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count
  1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde.
  Onbewogen: docs-only, geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit
  blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 39 · 43 · 44.
  Punt 41 en 42 horen er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 39 — de herstelweek snijdt in de frequentie in plaats van in
het volume. Item 6c uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks.
Draagt M79 (HEURISTIEK) en M80 (BEVINDING). ENGINE, dus RECON-FIRST met een stop-en-verifieer
voordat er één regel engine wordt aangeraakt; een echte engine-bug wordt geflagd, nooit
stilzwijgend gepatcht. TWEE HENDELS: het deload-quotum van 1 en de kalendernaam-splitsing; N en
de volumefactor worden in de bouwronde geijkt, nooit vooraf gekozen. PUNT 19 GAAT HIERIN OP.
DEZE RONDE MAAKT HET VRIJ OP TWEE MANIEREN: M83 stelt vast dat de dosis-hendel werkelijk de
dosis is en niet het percentage — precies wat M79 van een fix vraagt — en M81 geeft de band als
meetgrootheid. De herstelweek is óók de plek waar de 208 Recovery-ritten wonen. Verse chat.

**PUNT 40 IS AF — GESLOTEN ZONDER BOUW (8 augustus 2026).** Het label is gemeten, het meetgat is
als norm-regel gesloten en er is geen letter code veranderd. Docs-only: geen code, geen engine,
geen migratie, geen deploy, en geen enkel `wrangler`-commando. Commits:
`75051f4df7b40cb5ab1d77c48ecbcc62efb6727d` (het recon-doc) plus deze close-out. Prod en D1 staan
waar het blok hieronder ze noemt; grep die twee daar op in plaats van ze hier over te schrijven.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is niets te verschepen — dit was een meting, een
  verdict en twee norm-regels.
- **DE METING.** `buildWeekProposal` en `expandArchetype_` zelf aangeroepen uit een
  esbuild-bundel, `TZ=Europe/Amsterdam`, klok als Proxy op de echte `Date`. Zeven weekvormen maal
  vijf doelen maal vier event-afstanden: **140 cellen, 640 sessies, 38 distincte banden, 39190
  blokminuten**. Instrument eerst geijkt op de weekvorm-as: **21 van de 21** gepinde waarden.
- **DE PREMISSE IS BEVESTIGD OP HET FEIT EN WEERLEGD OP DE KNIP.** Het label `drempel` draagt
  **1824 minuten sweet-spot naast 4578 minuten drempelwerk**. Maar de knip ligt NIET op LT2: op
  **95** loopt nul band dwars, op **100** worden **2742 van de 6402** minuten doorgesneden, dwars
  door `95-102` en `100-108`.
- **HET RASTER EN DE BIBLIOTHEEK ZIJN STRUCTUREEL SCHEEF.** De 38 banden laten precies drie
  binnen-naden vrij: **81-88, 94-95, 109-112**. Het zone-raster knipt op 90 en 105 en die vallen er
  allebei buiten. Twee lekken die het punt niet noemde: sweet-spot lekt ook naar `tempo` (**2172
  van de 2280** nominale tempo-minuten), en er bestaat **geen enkel archetype met tempo als
  bedoeling** — elke tempo-minuut komt uit een sweet-spot-sjabloon.
- **STAAT NU ALS M81 (NORM) EN M82 (BEVINDING)** in `docs/TRAININGSMODEL.md`. M81: een
  karakter-uitspraak rust op de band, niet op het zone-label. Daarmee zijn punt 39, 41 en 42
  gedeblokkeerd — die meten voortaan op de band.
- **EEN EIGEN FOUT, DOOR DE CHAT ZELF GEVANGEN VOOR ER IETS OP GEBOUWD WAS.** De chat mat
  `planDraagtSleutelzone_` LOS en las 108 van de 360 kwaliteitsdagen als een gat. Hij is een van
  TWEE OR-termen: op de disjunctie is het **360 van de 360** — zone-term 252, intent-term 312, nul
  dagen zonder sleutelstatus. De sleutel-inhaal is niet geraakt, en de engine verankert die tweede
  term al bewust en gedocumenteerd. Les toegevoegd in `docs/WERKWIJZE-LESSEN.md`.
- **DAARMEE VERVIEL DE BOUW.** De karakter-as had geen consument die zonder haar stuk is, en een as
  bouwen die niets voedt is vooruit-bedrading. Punt 39 bouwt haar samen met zijn eerste consument.
  Het punt stond als ENGINE en dat is met deze meting onjuist: de banden staan al op elk blok.
- **OPENSTAAND, NIEUW: ROADMAP punt 43** — de normpoort staat op het midpunt-label. Band `88-92` en
  `88-93` verschillen een procentpunt en openen tegengestelde poorten: **48 cellen uitsluitend
  tempo, 33 uitsluitend drempel, 9 beide**, van de 90 met sweet-spot-werk. Twee consumenten hangen
  eraan. NIET norm-neutraal, dus eerst per plek meten en in beide richtingen. Staat als item 6d.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count
  1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde.
  Onbewogen: docs-only, geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit
  blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 39 · 41 · 42 ·
  43. Punt 40 hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 41 + 42 — de weekmix en M78, samen EEN meetronde. Item 6b uit
*De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. NORM en METEN, geen bouw en
geen engine. Beide punten zijn op EEN as gemeten en vragen dezelfde uitbreiding: over doelen en
macrofasen heen. MEET OP DE BAND, NIET OP HET ZONE-LABEL — dat is M81, en het is precies wat punt
40 heeft vrijgemaakt; de drie naden 81-88, 94-95 en 109-112 staan in M82. Punt 41 vraagt of het
plan bij hoger volume hoort te polariseren en of de Z3-reeks variant-rotatie is; punt 42 of
`mesoFactor` %FTP werkelijk schaalt. Eindigt op een VERDICT, geen bouw. Verse chat.

**PUNT 19 IS AF — GESLOTEN ZONDER APARTE BOUW (8 augustus 2026).** De kalendernaam is gemeten en
blijkt een symptoom; wat eronder ligt is groter en staat nu als punt 39 tot en met 42. Docs-only:
geen code, geen engine, geen migratie, geen deploy, en geen enkel `wrangler`-commando. Commits:
`40bf49228f6050accb0a405c71743312575948f1` plus deze close-out. Prod en D1 staan waar het blok
hieronder ze noemt; grep die twee daar op in plaats van ze hier over te schrijven.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit was een
  meetronde, een verdict en twee norm-regels.
- **DE METING.** `buildWeekProposal` zelf aangeroepen uit een esbuild-bundel, `TZ=Europe/Amsterdam`,
  klok als Proxy op de echte `Date`. Zeven weekvormen maal vijf doelen maal vijf
  fase-configuraties maal twaalf doelStart-offsets: **2100 weken, 8700 dag-cellen met sessie**.
  Instrument eerst geijkt met A/A: **0 afwijkende cellen**. De ingreep is puur het LABEL —
  dezelfde dag, dezelfde minuten, `dagtype` van `weekend` naar `vrij`.
- **UITSLAG: 369 CELLEN OVER 291 WEKEN, in twee families zonder rest.** Familie 1, de deload-tak,
  324 cellen: 49680 tegen 19440 minuten, TSS 35640 tegen 6804. Familie 2, de
  allocator-weekendpaarregel, 45 cellen — uitsluitend weekvorm V7, uitsluitend korte (33) en
  lange (12) beklimmingen, de twee profielen met `weekendBlok` true. Die rust op `DOELEN-SPEC`
  §3.4 VASTGESTELD en is buiten scope.
- **TWEE PREMISSEN VAN PUNT 19 ZIJN WEERLEGD**, en dat hoort hier zodat een volgende ronde ze niet
  opnieuw maakt. Verstreken en gereden dagen bereiken de takken NOOIT: `proposal.ts:528` geeft
  `assignWorkouts` alleen `tePlannen`. En de taper-tak behandelt vrij en weekend in ÉÉN conditie
  (`planner.ts:817`), dus die kan per constructie niet uiteenlopen — 0 verschillen over 420
  Recovery-weken. Van de vier genoemde routes leeft alleen **deload**.
- **WAT ER VANDAAG ECHT VERDWIJNT IS KLEIN.** Weekenddagen verliezen **0** minuten, doordeweekse
  dagen **1482 minuten over 76 dagen**, en dat treft alleen dagen boven een uur. Op Daans eigen
  weekvorm nul. Onderhoud geeft 0 cellen (`mesoCyclus: false`). De kalendernaam werkt vandaag dus
  eerder mee dan tegen: hij houdt de lange dag lang. Beide voor de hand liggende reparaties zijn
  gemeten en allebei slechter — alles als weekend geeft TSS 201 met NUL kwaliteitsminuten, alles
  als vrij geeft TSS 100 maar snijdt blind in opgegeven tijd.
- **HET DEFECT ERONDER, en dat is de opbrengst van deze ronde.** Op Daans weekvorm gaat de
  herstelweek van 286 naar 285 minuten terwijl de drempelminuten van 98 naar 10 gaan: het volume
  blijft staan en de hele daling komt uit de prikkel. Kwaliteitsdagen 3 naar 1, belasting 63
  procent. WAT WEL KLOPT: de overgebleven kwaliteitsdag houdt zijn karakter — drempel op 98 tot
  105 procent FTP — en halveert alleen zijn blokduur van 18 naar 10 minuten, precies M76. Wat niet
  klopt is de verdeling eromheen, en de lange rit blijft juist staan omdat de dag weekend heet.
  Staat als **M79 (HEURISTIEK)** en **M80 (BEVINDING)** in `docs/TRAININGSMODEL.md`.
- **TWEE EIGEN FOUTEN, allebei door Daan gevangen, en de les staat in `docs/WERKWIJZE-LESSEN.md`.**
  De chat noemde de herstelweek "grijs rijden" terwijl er nul minuten Z3 in staat, en daarna
  "het karakter verandert" terwijl de kwaliteitsdag zijn zone gewoon behoudt. Beide oordelen
  rustten op `voorgesteldType`; de `blokken` met hun `pctLo`/`pctHi` stonden in dezelfde
  meetuitvoer en zijn niet gelezen.
- **M78 REPRODUCEERT NIET.** Over mesoweek 1 tot 4 staan de blokpercentages stil (99, 100, 98,
  95-99 en 89-92 procent FTP) en beweegt alleen de duur: 5/7/9/12 naar 5/8/10/13 naar 6/8/10/14
  naar 3/4/5. Op DEZE as schaalt `mesoFactor` dus duur en geen %FTP. ÉÉN AS — dat is een
  aanleiding tot hertoetsing en GEEN intrekking. Staat als punt 42.
- **DE TID-BRUG, en die legt het meetgat bloot.** Het app-plan omgerekend naar het Seiler-3-zone-
  model (Z1 onder 80 procent FTP, Z2 80 tot 100, Z3 daarboven), doel FTP in Base: 3,0u 62/38/0 ·
  4,75u 70/24/6 · 5,0u 69/31/0 · 8,0u 76/15/9 · 12,0u 84/12/3. Het plan is piramidaal en wordt dat
  sterker met de uren; er is GEEN polarisatie-kanteling op 8 à 10 uur, en anaeroob verschijnt
  alleen bij 8,0u om bij 10, 12 en 15 uur weer op nul te staan. Maar de uitspraak is niet
  toetsbaar zolang het app-label `drempel` zowel sweetspot (89-92) als bovendrempel (98-105)
  draagt en dus dwars door LT2 loopt. Dat is punt 40, en het blokkeert punt 39 en punt 41.
- **DE PLAN-KANT IS SPLITSBAAR ZONDER NIEUWE DATABRON**, want elk blok draagt `pctLo` en `pctHi`.
  De GELEVERDE kant niet: de zonegrenzen komen uit intervals `power_zones` en staan op
  55/75/90/105 procent (`apps/web/src/lib/zonemunt.ts:41`), waardoor LT2 midden in de vierde
  bucket valt. Punt 40 vraagt dus geen intervals-werk, geen custom zones en geen streams.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only,
  geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 32 · 34 · 35 · 39 · 40 · 41 ·
  42. Punt 19 hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 40 — het drempel-label loopt dwars door de LT2-grens. Item 6 uit
*De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks: punt 19 stond daar en is
vervangen omdat de meting het tot symptoom maakte. NORM-NEUTRAAL: er verandert geen enkele
training, alleen de zichtbaarheid — sweetspot en bovendrempel krijgen ieder hun eigen label zodat
een methodiek-uitspraak überhaupt toetsbaar wordt. ENGINE, dus RECON-FIRST met een
stop-en-verifieer voordat er één regel engine wordt aangeraakt; een echte engine-bug wordt
geflagd, nooit stilzwijgend gepatcht. GEEN intervals-werk nodig: de plan-kant is splitsbaar uit
`pctLo`/`pctHi`. Punt 40 deblokkeert punt 41 (de weekmix-meting) en punt 39 (de herstelweek).
Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWAALF nieuwste blokken; komt er een dertiende bij, dan schuift het oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twaalf is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel.

<!-- EINDE HANDOFF.md -->
