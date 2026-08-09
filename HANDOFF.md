# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

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

**PUNT 38 IS AF (8 augustus 2026).** De opener-fetch kapt niet meer af, en waar hij dat ooit weer
doet meldt hij het. Docs-only: geen code, geen engine, geen migratie, geen deploy, en geen enkel
`wrangler`-commando. Commits: `fe817efb6b1063f8e2b7976c273de767b3b3d3f8` (de verhuizing) plus deze
close-out. Prod en D1 staan waar het blok hieronder ze noemt; grep die twee daar op in plaats van ze
hier over te schrijven.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit raakt
  uitsluitend de documenten die een chat bij zijn start ophaalt.
- **DE CAP IS HERMETEN IN DEZE CHAT, en dat was de opdracht.** De eigen HANDOFF-fetch kwam binnen
  tot **121124 van de 616512 bytes** — 19,6 procent, **358 van de 2970 regels**, mid-zin, zonder
  signaal. `docs/WERKWIJZE.md` kwam op **118399 bytes** nog volledig binnen; de staart is
  byte-vergeleken met schijf. DE GRENS IS GEEN BYTE-GRENS: 07-08 gaf dezelfde cap 121196 op een
  ander bestand, 08-08 gaf hij 121124. Reken op een TOKEN-grens en behandel elke byte-marge als
  schatting.
- **DE VERHUIZING IS BYTE-EXACT BEWEZEN, beide kanten.** sha256 van de lessen-slice
  `afb4d8b953e65806705d0cabf895b4d1` en van de archief-slice `58b309f0c701180da4237986588bc10f`,
  identiek voor en na. *Recon en bewijslast* was **90136 van 118399 bytes — 76,1 procent, 122
  bullets**; `HANDOFF.md` is geroteerd op twaalf STAND-blokken.
- **BYTES NA DE INGREEP, met marge tot 121000:** `docs/WERKWIJZE.md` **31068** (+89932),
  `docs/WERKWIJZE-LESSEN.md` **90764** (+30236), `docs/TRAININGSMODEL.md` **27779** (+93221),
  `HANDOFF.md` **55228** (+65772), `docs/DOELEN-SPEC.md` **31808** (+89192). Opener-totaal 236647
  bytes over vijf fetches. DE KRAPSTE IS DE LESSEN met 30236: bij circa 1,5 kB per ronde is dat
  ruwweg twintig rondes, en de byte-regel maakt die aankomst zichtbaar vóór hij er is.
- **HET VANGNET IS TWEEDELIG, en die tweede helft stond niet in punt 38.** De eind-marker
  `<!-- EINDE <pad> -->` vangt een afkap die AL gebeurd is en wordt gedetecteerd door de chat die de
  schade lijdt; de byte-rapportage in elke close-out ziet hem aankomen. De marker is aantoonbaar
  ROOD zonder de ingreep — de HANDOFF-fetch van deze chat miste hem — maar DAT ROOD KOMT UIT DE
  CHAT-FETCH EN IS DOOR CC NIET REPRODUCEERBAAR. Dat is een grens op het bewijs, geen omissie.
- **DE MARKER KOST ONDERHOUD, en dat bleek meteen.** Bij de naadreparatie in `docs/WERKWIJZE.md`
  belandde de bestaande lege slotregel ná de marker; CC ving en repareerde het. Wie een sectie
  toevoegt, laat de marker de LAATSTE regel.
- **DE ACCEPTATIE-EIS BIJ DE ROTATIE WAS ONHAALBAAR ZOALS GEFORMULEERD, en dat is de les van deze
  ronde.** "Precies één keer" veronderstelt dat de BRON uniek is. `HANDOFF.md` droeg NEGEN distincte
  regels die er al 2 tot 5 keer stonden — vooral identieke `OPENSTAAND, ONGEWIJZIGD`-bullets — samen
  23 voorkomens waarvan 14 overtollig, en de strikte toets meldde die 23 als fout. De multiset-toets
  — de telling per distincte regel blijft gelijk — gaf **0**, op 2601 niet-lege regels waarvan 2587
  distinct. Bij de lessen-helft maakte het geen verschil (775 niet-lege regels, alle uniek), en juist
  daarom hield de log-verhuizing met dezelfde formulering stand. Kwam binnen als CC-afwijking; staat
  nu in `docs/WERKWIJZE-LESSEN.md`.
- **EEN PROJECTIE OP EEN VERHUIZING TELT OOK WAT DIEZELFDE RONDE TOEVOEGT.** De chat gaf de norm na
  de ingreep op circa 28 kB — de kale slice-verwijdering — terwijl hij op 31068 staat; het verschil
  van 2805 is de stub, de twee nieuwe alinea's, de uitgebreide opener en de marker, allemaal in
  datzelfde prompt opgedragen. Geen gevolg, want er hing geen eis aan. Wel de reden dat
  `docs/ROADMAP.md` de GEMETEN getallen draagt en niet de 88553 uit de meting op `e08763c8`.
- **DE BYTE-BULLET HIERBOVEN MEET `fe817ef` EN NIET DE COMMIT VAN DIT BLOK — precies de fout die de
  bullet erboven beschrijft, nu op zichzelf.** Deze close-out voegde zelf **1296** bytes toe aan
  `docs/WERKWIJZE-LESSEN.md` en **1611** aan `HANDOFF.md`. Op `fa6d5be` staat het dus op
  `docs/WERKWIJZE.md` **31068** (+89932), `docs/WERKWIJZE-LESSEN.md` **92060** (+28940),
  `docs/TRAININGSMODEL.md` **27779** (+93221), `HANDOFF.md` **56839** (+64161), `docs/DOELEN-SPEC.md`
  **31808** (+89192) — opener-totaal **239554**, krapste marge de lessen met **28940**, ruwweg
  negentien rondes. Deze reparatiecommit voegt daar nog aan toe; het exacte getal staat in het
  CC-rapport, want een STAND-blok wordt geschreven vóór de commit die het bevat en meet daarom per
  constructie te laag. *Close-out van een chat* is daarop bijgesteld: CC meet NA de commit. De
  byte-bullet erboven blijft ongewijzigd staan — hij demonstreert waar hij voor waarschuwt. Kwam
  binnen als CC-afwijking.
- **NIET GEDAAN, met reden.** De aanleidingen uit de lessen strippen: 89 losse knipbeslissingen, en
  de aanleiding draagt vaak het getal waarop de regel rust. En `docs/DOELEN-SPEC.md` §150 aanpassen:
  de kop *Recon en bewijslast* blijft in de norm staan als doorverwijzing, dus die verwijzing klopt.
- **HET ARCHIEF IS EEN AFVOER, GEEN LEESBRON.** `docs/HANDOFF-ARCHIEF.md` draagt de oudere blokken
  plus de historische projectsecties, en de opener haalt het bewust niet op. Er is niets weggegooid;
  git houdt alles.
- **WAT DAAN MERKT: NIETS aan de app.** Wat wél verandert is de opener: vijf URL's in plaats van
  vier, met een regel die de eind-marker toetst.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 ·
  lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only,
  geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 32 · 34 · 35. Punt 38
  hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 19 — het dagtype weekend is een kalendernaam, geen eigenschap.
Item 6 uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. ENGINE, dus
RECON-FIRST met een stop-en-verifieer voordat er ook maar één regel engine wordt aangeraakt; een
echte engine-bug wordt geflagd, nooit stilzwijgend gepatcht. HET PUNT SCHRIJFT ZELF EERST EEN METING
VOOR: `deriveDagtype` (`apps/web/src/lib/planner.ts:18`) leidt het type af uit za/zo terwijl de
gebruiker alleen pendel, trainen en minuten opgeeft, en de weekend-tak in `assignWorkouts` is via
`buildWeekProposal` grotendeels onbereikbaar omdat de allocator elke eligible dag claimt. Meet dus
eerst wat het verschil in de praktijk oplevert — het kan zijn dat er niets aan hangt. Raakt
`DOELEN-SPEC` §2A. Verse chat.

**PUNT 21 IS AF — GESLOTEN ZONDER BOUW (7 augustus 2026).** De push-beschrijving draagt de ruis van punt 18, maar de tak die haar schrijft wordt nooit bereikt. Docs-only ronde: de chat mat zelf via een read-only kloon plus een esbuild-bundel van de engine, `apps/web/src/lib` en `workers/api/src/integrations/push.ts`; CC deed alleen de commits. GEEN code, geen engine, geen migratie, geen deploy, en geen enkel `wrangler`-commando — ook geen read. Prod en D1 staan waar het blok hieronder ze noemt.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd; dit was een meting en een verdict.
- **HET INSTRUMENT IS EERST GEIJKT: 21 van de 21 gepinde waarden gereproduceerd** — de volledige weekvorm-as uit `docs/ROADMAP.md` *Meetlat* (kwaliteitsminuten, week-TSS en kwaliteitsdagen over zeven vormen), gedraaid met `buildWeekProposal` zelf, de klok als Proxy op de ECHTE `Date` en `TZ=Europe/Amsterdam`.
- **DE PREMISSE KLOPTE MAAR WAS TE SMAL, en dat hoort hier zodat een volgende ronde de aanname niet opnieuw maakt.** `buildWorkoutDescription_` wordt bereikt als ZWO falsy is ÉN DSL `null`, en dat kan langs TWEE poorten. Punt 20 mat alleen de RIJ-poort. De tweede ligt EERDER: `buildWorkoutZwo_` én `buildWorkoutDsl_` vallen allebei uit op een LEGE of ontbrekende `structuur`, zonder ooit een rij-parser aan te raken. Die poort was nooit gemeten — en geeft eveneens nul.
- **DE UITSLAG: 0 VAN DE 15275.** Gemeten over 5 doelen maal 11 weekvormen maal 13 doelStart-offsets maal 5 dosis-treden: **3575 weken, 15275 sessies, 64951 structuur-rijen**, met dekking Base 1815 / Build 880 / Peak 660 / Test 220 en mesoweek 1 tot en met 4 alle vier bezet — die laatste as is precies wat punt 20 miste. ZWO gelukt **15275 van de 15275**; DSL-terugval **0**; description-tak **0**; lege `structuur` **0**. Op rij-niveau `zwoStepFromRow_` null **0 van 64951** en `dslBlockFromRow_` null **0 van 64951**. En op APP-niveau, met `buildEventPayload` zelf gedraaid over de JSON-grens die de client passeert (`toSession` plus `JSON.stringify`): description-fallback in **0 van de 15275** payloads.
- **DE NOEMER DIE HET VERDICT DRAAGT IS NIET 15275 MAAR ZEVEN, en dat is de eigenlijke uitkomst.** Die 64951 rijen zijn geen 64951 onafhankelijke steekproeven: de parser krijgt **7 distincte duur-vormen** binnen (`N min` 39899x, `N.N min` 17682x, `Nx N.N min` 5034x, `Nx N min` 1086x, `Nx N sec` 770x, `Nx Nmin` 272x, `Nx N.Nmin` 208x) en **1 vermogensvorm** (`N-NW`, 64951 van de 64951). Alle acht parsen. En `packages/engine/src/planner.ts` kan er per constructie geen achtste maken: de duurcel loopt via `+ " min"`, `+ " sec"`, `+ "min"` en het herhalings-voorvoegsel, de vermogenscel heeft precies ÉÉN producent (`wattsRange`, 14 van de 14 structuur-rij-literals). Een andere variant levert dezelfde zeven vormen met andere getallen erin — dus de bekende beperking van de as (lege `activities` en `weekplans`, andere variant-rotatie op de levende D1) kan deze uitkomst niet omgooien. DE CHAT WILDE HIER EEN TWEEDE MEETRONDE OP DRAAIEN en Daan wees dat af; hij had gelijk, en de regel staat nu in `docs/WERKWIJZE.md`.
- **DE VINDPLAATS IN PUNT 21 WAS VEROUDERD.** `buildWorkoutDescription_` staat op `packages/engine/src/zones.ts:613`, niet op `:569`. Gecorrigeerd in `docs/ROADMAP.md`; de twee treffers in oudere STAND-blokken hieronder blijven staan — dat is historie, geen drift.
- **DE TAK BLIJFT STAAN, en dat is een besluit.** Hij is aangeroepen (`workers/api/src/integrations/push.ts:92`) en getest (`selftest.test.ts:2609` en `:2625`); hij vuurt alleen nooit. Opruimen hoort NIET bij dit verdict: dat zou de laatste terugval weghalen bij precies de parser-wijziging die hem nodig kan maken.
- **WAT DAAN MERKT: NIETS.** Er verandert geen letter aan de app.
- **TWEE WERKWIJZE-AFSPRAKEN, beide in `docs/WERKWIJZE.md`:** (1) NIEUWE BULLET — de noemer van een dekkingsclaim is het aantal distincte INVOERVORMEN, niet de steekproefomvang; (2) TWEEDE AANLEIDING onder *toets een "per constructie onbereikbaar" op de ruimte waarin de app WERKT* — een bereikbaarheids-premisse noemt élke poort op het pad, niet de poort waarop hij is gemeten. Eén nieuwe bullet in plaats van twee, met de grond in punt 38: de bytemarge.
- **OPENSTAAND, NIEUW: ROADMAP punt 38 — de opener-fetch kapt af en meldt het niet.** GEMETEN: de cap ligt rond 121200 bytes, `HANDOFF.md` kwam voor **19,8 procent** binnen (121196 van 610760, 2599 van 2954 regels niet), en `docs/WERKWIJZE.md` staat na deze ronde op **118399 bytes** — circa 2,8 kB marge terwijl deze ronde er 1561 kostte. Staat als item 5b in *De volgorde*, met de verliesloze ingreep erbij.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Onbewogen: docs-only, geen test geraakt. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 32 · 34 · 35 · 38. Punt 21 hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 38 — de opener-fetch kapt af en meldt het niet. Item 5b uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks: het punt is daar met reden vóór punt 19 gezet. TOOLING plus norm, geen engine en geen app. DE INGREEP IS EEN VERBATIM VERHUIZING — *Recon en bewijslast* naar `docs/WERKWIJZE-LESSEN.md`, vijfde URL in het opener-sjabloon, plus rotatie van `HANDOFF.md` naar `docs/HANDOFF-ARCHIEF.md` — dus de acceptatie-eis is dat elke verplaatste regel PRECIES ÉÉN KEER voorkomt over de twee bestanden, zoals bij de log-verhuizing. HERMEET DE BYTES ZELF; de getallen in punt 38 zijn een uitspraak over 7 augustus. Verse chat.

**HET WIJZIGINGSLOG IS UIT `WERKWIJZE.md` GEHAALD (7 augustus 2026).** Docs-only reparatie: geen code, geen engine, geen migratie, geen deploy, geen enkel `wrangler`-commando. Prod blijft op Worker Version `b8c6b7fa-e2ab-441f-b4bf-3d1d17a1eec7`, D1 op `0010`.
- **WAT ER STUK WAS, EN HET IS GEMETEN.** De opener haalt `docs/WERKWIJZE.md` bij ELKE chat via een RAW-fetch binnen. Met de 106 logregels erin was dat bestand 1092 regels en 150899 bytes, en de fetch van 7 augustus kapte af op **regel 1028 van 1092** — alle **59** augustus-logregels vielen buiten beeld.
- **HET GEVOLG DAT WE ZAGEN.** De eis "elke afspraak krijgt een gedateerde logregel" stond NERGENS als instructie: 0 treffers in de close-out-sectie, 0 in `CLAUDE.md`, 1 in heel `WERKWIJZE.md` en dat was de kop zelf. Hij leefde uitsluitend als IMITATIE van de bestaande logregels — en zodra de fetch die regels niet meer haalde, verdween de gewoonte. Twee close-outs op rij vergat de chat hem; beide keren vulde CC hem aan. CC heeft dat probleem niet, want hij leest van schijf.
- **HET ZWAARDERE GEVOLG, en dát is de reden dat dit gerepareerd is in plaats van genoteerd.** De norm-tekst eindigde op **114607 bytes** en de afkap lag rond **121000**: een marge van ongeveer 6 kB, terwijl de lessenlijst elke ronde groeit. Nog een paar lessen en de opener had de GATE-sectie, de vijf promptcontroles en het opener-sjabloon verloren — zonder enig signaal, want een afgekapte fetch meldt zichzelf niet.
- **WAT ER NU STAAT.** `docs/WERKWIJZE-LOG.md` draagt de 106 regels VERBATIM plus een kop die zegt dat de norm elders staat en dat de opener dit bestand bewust niet ophaalt. `docs/WERKWIJZE.md` houdt op die plek een alinea met de reden. GEMETEN NA DE VERHUIZING: `WERKWIJZE.md` 1010 regels en **116838 bytes**, `WERKWIJZE-LOG.md` 122 regels en 38376 bytes; de 106 oorspronkelijke logregels komen samen **precies één keer** voor over de twee bestanden — 0 in de norm, 106 in het log, nul die niet exact één keer voorkomt. Geen verdubbeling, geen verlies.
- **DE EIS IS VASTGELEGD** in *Close-out van een chat*: elke nieuwe of gewijzigde werkwijze-afspraak krijgt in DEZELFDE close-out een gedateerde regel in `docs/WERKWIJZE-LOG.md`, met sectie, strekking en aanleiding. Die regel is meteen op zichzelf toegepast: de twee wijzigingen van deze ronde staan er.
- **DE LES STAAT IN *Recon en bewijslast***: een document dat te groot wordt om binnen te halen verliest zijn staart zonder het te melden. Werkregel eruit: wat een chat bij elke start MOET lezen blijft in de norm, alles wat alleen achteraf verantwoordt verhuist naar een eigen bestand.
- **WAT DAAN MERKT: NIETS.** Er is geen letter code geraakt.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Een volgende chat leest ze uit de suite en neemt ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 21 · 32 · 34 · 35.

FOCUS VOLGENDE CHAT: ROADMAP punt 21 — de push-beschrijving. Vijfde item uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. EERST DE BEREIKBAARHEID METEN, en pas daarna beslissen of er iets gebouwd wordt: `buildWorkoutDescription_` wordt alleen bereikt als zowel de ZWO- als de DSL-tak faalt, en bij punt 20 gaf `zwoStepFromRow_` over de hele populatie 0 keer null. Sluit vermoedelijk zonder bouw. ENGINE, dus recon-first met een stop-en-verifieer; een echte engine-bug wordt geflagd, nooit stilzwijgend gepatcht. Verse chat.

**PUNT 33 IS AF EN STAAT LIVE (7 augustus 2026).** Commits: `e55637a` (de render-testlaag), `8288d2b` (de gedeelde functie), plus deze close-out. Worker Version `b8c6b7fa-e2ab-441f-b4bf-3d1d17a1eec7`, 3 van de 3 assets vervangen, bundel `index-DRTXHxtd.js`. GEEN migratie en geen enkel `wrangler d1`-commando — D1 blijft op `0010`.
- **WAT ER GEBOUWD IS.** `haaltNorm(geleverd, norm)` in `apps/web/src/lib/blok.ts` is de ENIGE plek waar de norm-vergelijking valt: vijf aanroepen daar — de drie zones van `opNormPerZone`, `totaalOpNorm` en `zoneOpNorm_` — en twee in `BlokReviewCard.tsx`. GREPS: `Math.round` gevolgd door `>=` in `blok.ts` van **5 naar 1**, `Math.round` in `BlokReviewCard.tsx` van **4 naar 2** — en die twee zijn WEERGAVE en horen te blijven. De onderbouwing uit punt 17 hing aan géén enkele functie en hangt nu aan deze.
- **DE RENDER-TESTLAAG BESTOND NIET EN BESTAAT NU.** Project `web-render` in `apps/web/vitest.render.config.ts`, environment jsdom, include `src/**/*.test.tsx`. ENIGE nieuwe dependency: `jsdom`. GEEN `@testing-library` en GEEN `@vitejs/plugin-react` — chat-zijde gemeten dat renderen lukt met `createRoot` plus `act` uit react zelf, en de JSX-transform had geen plugin nodig. De bestaande node-suite pakt het `.tsx`-bestand niet op: het totaal steeg met precies **4** en niet met 8.
- **DE VOLGORDE VAN HET PUNT IS OMGEKEERD, en dat is de dragende keuze.** Eerst het vangnet, dan de consolidatie: R1 op regel 179 liet **A1** vallen met A2, A3 en A4 overeind, R2 op regel 276 liet **A3** vallen met de rest overeind. Na de consolidatie is dat per constructie niet meer te scheiden — er is dan nog maar één plek — dus andersom was dit bewijs onbereikbaar geweest.
- **ROOD NA DE CONSOLIDATIE, twee mutaties.** `>=` naar `>` liet **17 tests over 5 bestanden** vallen, de ronding weghalen **13 over 4** — en BEIDE keren viel zowel de pure laag (`blok`, `punt15`, `punt17`, `zonepoort`) als de render-laag (A1 en A3). De kaart leest aantoonbaar dezelfde functie als het oordeel.
- **BEGRENZING.** `git diff --stat HEAD~1 HEAD` toont exact **twee bestanden, 20 bij en 11 weg**, en GEEN enkel testbestand: een refactor die zijn tests moet bijstellen is geen refactor. Het vitest-totaal is onveranderd.
- **PROD, VOOR EN NA: 9 van de 16 identiek, 16 vergeleken, 0 uitgesloten.** De zeven bewegende shots (`prod/02-ma` tot en met `prod/08-zo`) verschillen UITSLUITEND op regel 15, `Laatst gesynct · 20:13` tegen `20:16`. Nul innerText-verschillen daarbuiten. Geen propagatie-uitval: de vier ophalingen gaven alle vier 200.
- **DE KAART ZELF IS OP PROD NIET TOETSBAAR, en dat is een grens en geen omissie.** Het lopende blok staat in blokweek 2, dus `blokReviewVenster` levert geen venster: `BLOK · TERUGBLIK` komt in **0 van de 16** `.txt` voor, in beide runs, terwijl datzelfde label in de lokale boom in 16 `.txt` staat — die tegencontrole maakt de afwezigheid een bevinding in plaats van een lege grep.
- **WAT DAAN MERKT: NIETS.** Gedragsneutrale refactor plus testinfra.
- **VIER NIEUWE WERKWIJZE-AFSPRAKEN uit deze ronde**, alle vier in `docs/WERKWIJZE.md`: (1) de uniciteits-regel geldt óók in de DOM — een JSX-wrapper draagt dezelfde `textContent` als het blad, en alleen het blad draagt de stijl; (2) `git checkout <bestand>` herstelt naar HEAD en niet naar de staat van vóór je patch, dus met ongecommitte bouw in de werkboom wist het die bouw mee; (3) de verschil-richting van een vergelijker-ijking moet op bomen liggen met DEZELFDE bestandsnamen, anders vergelijkt hij nul bytes; (4) `pnpm --filter <pakket> add -D <dep>` kan de workspace-links breken en geeft een lockfile-diff die groter is dan de ene dependency.
- **VLOEREN NU: vitest-totaal 975 over 76 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de gate van DEZE ronde. Een volgende chat leest ze uit de suite en neemt ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 21 · 32 · 34 · 35. Punt 33 hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 21 — de push-beschrijving. Vijfde item uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. EERST DE BEREIKBAARHEID METEN, en pas daarna beslissen of er iets gebouwd wordt: `buildWorkoutDescription_` wordt alleen bereikt als zowel de ZWO- als de DSL-tak faalt, en bij punt 20 gaf `zwoStepFromRow_` over de hele populatie 0 keer null. Sluit vermoedelijk zonder bouw. ENGINE, dus recon-first met een stop-en-verifieer; een echte engine-bug wordt geflagd, nooit stilzwijgend gepatcht. Verse chat.

**PUNT 36 IS AF — BEGRENSD UITGESLOTEN (7 augustus 2026).** Docs-only close-out; de meetronde zelf liet NIETS in de repo achter — het tijdelijke instrument is met `git checkout` teruggedraaid en `git status --porcelain` was daarna leeg. Geen engine, geen app, geen migratie, geen deploy, en geen enkel `wrangler`-commando. Prod en D1 staan waar het blok hieronder ze noemt; grep die twee daar op in plaats van ze hier over te schrijven.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** Er is geen letter aan de app veranderd — dit was een meetronde en een verdict, geen bouw.
- **HET IJKPAAR VAN DEZE SESSIE IS SCHOON: 96 van de 96 identiek, 96 vergeleken, NUL uitgesloten.** Nul bewegende shots. De vergelijker is eerst in TWEE richtingen geijkt: `out` tegen zichzelf 96 van de 96, en `out/v2` tegen `out-vorige/v4` 0 van de 8 met alle acht op verschillende innerText. Opzet: warmloop weggegooid, daarna twee sweeps rug aan rug, alle drie exit 0.
- **DE RACE-HYPOTHESE IS GEMETEN EN WEERLEGD.** Het vermoeden was dat `persistWeekplan` fire-and-forget schrijft (`apps/web/src/lib/schema.ts:1283` en `:1289`) terwijl `settle` na 800 ms wegnavigeert. Een passief instrument telde per settle-marker elke `/api/`-request die NA de terugkeer en VOOR de eerstvolgende navigatie startte. Over **25 zaai-loads maal twee runs: NUL** — nul na-settle-requests, nul `PUT /api/weekplan/`, nul afgebroken. De identiteit sluit aan beide kanten (**1906/1906/0/0** en **1903/1903/0/0**) en beide runs dragen **45 settle-markers**, exact 25 zaai plus 11 weekscherm plus 9 in `v7`. Het venster is per constructie leeg: de ingrediënten van een race zijn niet hetzelfde als een race.
- **HET GETAL DAT OPENSTAAT, EN HET LAG VOOR HET OPRAPEN:** 1906 tegen 1903 `/api/`-requests bij BYTE-IDENTIEKE shots. Drie requests meer in de ene run zonder dat het beeld beweegt. WELKE drie, in welke load, en of er een `PUT /api/weekplan/` bij zit is NIET gemeten — het instrument telde alleen het na-settle-venster, en dat is een gat in het ontwerp van de meting. Kandidaat, niet vastgesteld: de post-sync herbouw op `Schema.tsx:116`. Dit is de enige draad die dit punt achterlaat, en hij is BEWUST niet opgepakt: er komt geen derde poging.
- **DE VLOER OVER VIER SESSIES MET DEZELFDE OPZET: 8, 0, 8, 0** — en telkens op een ánder scenario (`klim-weekstem`, dan `v7-midweek`). Twee van de vier vuren. Vuurt het, dan is het één scenario, alle acht shots samen, met VERSCHILLENDE innerText: het plan beweegt, niet de camera. Een schoon ijkpaar bewijst het verschijnsel dus niet weg — deze ronde vuurde het simpelweg niet.
- **DE WERKREGEL WAARMEE DE HARNESS BRUIKBAAR BLIJFT,** en er valt niets bij te bouwen: elke ronde meet zijn EIGEN ijkpaar, erft er nooit een, en sluit een bewegend scenario uit met reden en aantal terwijl de noemer het TOTAAL blijft. `tools/shots/vergelijk.mjs` maakt die toewijzing mechanisch via de innerText-kolom, en staat beschreven in `tools/shots/README.md`.
- **WAT DAAN MERKT: NIETS.**
- **VIER NIEUWE WERKWIJZE-AFSPRAKEN uit deze ronde**, alle vier in `docs/WERKWIJZE.md`: (1) de STOP-conditie-regel kreeg een tweede aanleiding — twee overtredingen in twee rondes, dus die regel moet GEDRAAID worden en niet herinnerd; (2) de chat noemt voortaan WELKE controles hij gedraaid heeft en waarop, niet een score als "vijf van vijf"; (3) de bron-uitlezing hoort in de EERSTE versie van een prompt, want een prompt dat groeit bij het overtypen is te vroeg geschreven; (4) de ingrediënten van een verschijnsel zijn niet het verschijnsel — meet het venster leeg of vol vóór je er een mechanisme op bouwt.
- **VLOEREN NU: vitest-totaal 971 over 75 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle drie afgelezen uit de gate van DEZE ronde. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 21 · 32 · 33 · 34 · 35. Punt 36 hoort er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 33 — de norm-vergelijking naar EEN gedeelde functie, plus een render-testlaag. Vierde item uit *De volgorde* in `docs/ROADMAP.md`, dus GEEN afwijking van de reeks. Die laag BESTAAT NIET: `apps/web/vitest.config.ts` draait op environment "node", er is geen `.test.tsx` en geen jsdom. Dit is TOEVOEGEN, niet consolideren. Verse chat.

**PUNT 25, 22 EN 23 ZIJN AF (7 augustus 2026).** De drie blinde vlekken van de camera, in één ronde. TOOLING-only: geen engine, geen app, geen migratie, geen deploy, en geen enkel `wrangler`-commando. Commits: `6798f16ad580f08ccbfbc0a064390232a6b4abb5` (de bouw) plus deze close-out. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/31189886968>. Prod blijft op Worker Version `82abac49-d032-4847-9b6f-efc90c3ac33d`, D1 op `0010`.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** `tools/shots` zit niet in de bundel en `pnpm build` raakt het niet — er valt hier niets te verschepen.
- **PUNT 23, EN DE PREMISSE VAN HET PUNT WAS FOUT.** Het punt stelde "uitgezette animaties" voor als richting; `reducedMotion: "reduce"` stond al op `shot.mjs:1084` en is per constructie INERT, want de app draagt 0 `prefers-reduced-motion`-regels en 0 `@keyframes` in heel `apps/web/src` — er is niets voor die vlag om uit te zetten. De drager is `ProgressRing.tsx:63`: een `stroke-dashoffset`-transitie van 1,1 s met 250 ms aanloop, samen 1350 ms tegen de 800 ms die `settle` afwacht. Hij hangt via `ReadinessCard` aan precies `/vorm` en `/trainingen` en raakt geen letter `innerText` — dat verklaart alle drie de eigenschappen van het verschijnsel in één keer. GEMETEN: `anim=1` op `v7/09-vorm` en `v7/10-trainingen` en `anim=0` op alle andere, 2 van de 96 lokaal en 2 van de 16 op prod, dezelfde twee. UITSLAG: het ijkpaar MÉT de fix gaf **96 van de 96 identiek, nul uitsluitingen**. DE UITSLUITING VAN DIE TWEE SHOTS VERVALT.
- **PUNT 25.** `HEIGHT_CAP` van 4000 naar 8000, HERKOMST BELEID met de grond gemeten: hoogste `needed` 5882, op één na hoogste 2317. Een gekapte shot is nu een HARDE STOP — stil afkappen was het eigenlijke defect, want zo'n PNG liegt over het scherm en leest als "ongewijzigd". `assertPngSize` toetst daarnaast ná elke screenshot de IHDR van het geschreven bestand tegen viewport maal `DEVICE_SCALE`, zodat een afkapping door de BROWSER er ook niet doorheen komt. `v7/12-activiteiten` staat sindsdien op `used=5882 needed=5882`. Rood-toets letterlijk gedraaid op een tijdelijke cap van 1000, exitcode 1.
- **PUNT 22.** Shot `16-ritdetail`, op `v7` en in prod-modus, ná de `EXTRA_ROUTES`-lus zodat alle bestaande shots al geschoten zijn. Selector `main button[style*="flex-direction: column"]`, **50 treffers tegen 51 buttons** — alleen "Meer laden" valt af. Nul `aria-label="Sluiten"`-elementen vóór de klik, twee erna, en beide verboden teksten afwezig, dus de READY-tak — lokaal én op prod, waar de sheet echte inhoud toont (`INTERVALLEN`, `FTP 280 W`, `75:06 · 146 bpm · 66% FTP`).
- **DE RUISVLOER VAN BLOK 1 WAS 8, EN DAT WEERLEGT DE WARMLOOP-KANDIDAAT UIT HET VORIGE STAND-BLOK.** Het ijkpaar op ONGEWIJZIGDE code gaf 85 van de 95 identiek met tien bewegers: de twee van punt 23, plus alle acht shots van `v7-midweek` met VERSCHILLENDE `innerText` (week-TSS 417 tegen 322, 8:29 tegen 6:30 uur, 5 tegen 3 kwaliteitsdagen). Dezelfde opzet — warmloop weggegooid, daarna twee sweeps — gaf 7 augustus acht bewegers in `klim-weekstem` en in de punt-37-ronde nul. De vloer hoort dus niet bij het SCENARIO, en de warmloop verklaart hem niet.
- **VOOR/NA: 84 van de 95 identiek, 95 vergeleken, 11 bewegend, alleen-links 1** voor de nieuwe shot. De acht `v7-midweek`-shots zijn UITGESLOTEN met reden — punt 36, gemeten op ongewijzigde code in hetzelfde uur — en de noemer blijft het TOTAAL. Dat ze in het tweede ijkpaar stilstonden is GEEN reparatie van punt 36: het verschijnsel vuurde daar simpelweg niet.
- **HET GEREEDSCHAP STAAT NU BESCHREVEN.** `tools/shots/README.md` draagt twee nieuwe secties: één over wat elke shot afwacht en bewaakt, en één over `tools/shots/vergelijk.mjs` met zijn aanroep. Dat script bestond in geen enkel document en zou anders de volgende ronde opnieuw gebouwd zijn.
- **WAT DAAN MERKT: NIETS aan de app.** Dit raakt uitsluitend het meetgereedschap.
- **VLOEREN NU: vitest-totaal 971 over 75 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle drie afgelezen uit de uitvoer van DEZE ronde. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 21 · 32 · 33 · 34 · 35 · 36. Punt 22, 23 en 25 horen er niet meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 36 — het verdict. Ronde 3 van het tooling-blok uit *De volgorde* in `docs/ROADMAP.md`; die paragraaf legt de bouwvolgorde vast LOS van de nummering, dus dit is GEEN afwijking van de reeks. TOOLING, geen engine. Het punt heeft al één bouw achter zich die het verschijnsel niet wegnam, dus de uitkomst is gerepareerd OF begrensd uitgesloten met reden en aantal — geen derde poging. TWEE DINGEN LIGGEN NU KLAAR DIE ER EERDER NIET WAREN: `tools/shots/vergelijk.mjs` classificeert elke bewegende shot op zijn innerText, wat de punt-36-familie mechanisch van pixel-ruis scheidt, en de noemer is compleet nu punt 23 dicht is. MEET JE EIGEN IJKPAAR: de vloer zwierf over drie sessies van acht naar nul naar acht, en op een ander scenario. Verse chat.

**PUNT 37 IS AF (7 augustus 2026).** De shot-harness leest een dode dev-server niet langer als een ladende pagina. TOOLING-only: geen engine, geen app, geen migratie, geen deploy, en geen enkel `wrangler`-commando behalve de lokale dev-servers. Commits: `526ce4ea5e4fe3fd0863c57e2e145b363fe767d9` (de bouw) plus deze close-out. CI success, run <https://github.com/daanhhk/Cadans/actions/runs/31176740420>. Prod blijft op Worker Version `82abac49-d032-4847-9b6f-efc90c3ac33d`, D1 op `0010`.
- **GEEN DEPLOY, EN DAT IS GEEN UITSTEL.** `tools/shots` zit niet in de bundel en `pnpm build` raakt het niet — er valt hier niets te verschepen.
- **WAT ER GEBOUWD IS: ÉÉN POORT OP ÉÉN PLEK.** De bestaande `try … finally` om de scenario-lus in `main()` krijgt een `catch` die `classifyFailure` aanroept. Die meet met ÉÉN fetch per origin (`AbortSignal.timeout(3000)`, geen lus — dit is een postmortem en geen preflight) of `http://127.0.0.1:5173` en `http://127.0.0.1:8787/api/settings` nog antwoorden. Antwoorden ze allebei, dan gaat de oorspronkelijke fout ONGEWIJZIGD door; antwoordt er één niet, dan stopt de run met `INFRASTRUCTUUR-UITVAL`, beide gemeten statussen, de oorspronkelijke melding en de zin dat de geschoten shots niets over de bouw bewijzen. Elk antwoord telt als LEVEND, ook 401, 404 of 500; alleen een gegooide of afgelopen fetch is `null`.
- **DE PREMISSE VAN PUNT 37 WAS TE SMAL, en dat is de dragende uitkomst.** Het punt noemde één foutvorm: `still loading after settle`. Gereproduceerd gaf dezelfde conditie er TWEE ANDERE — zonder de fix `page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5173/instellingen`, met de fix `page.waitForSelector: Timeout 60000ms exceeded` op `#root > *`. Geen van beide is de punt-24-melding. Eén conditie draagt dus minstens DRIE foutvormen, en een poort BINNEN `settle()` — de voor de hand liggende plek — had er twee van de drie gemist.
- **LET OP BIJ HET CITEREN VAN DIE REPRODUCTIE.** `preview_stop` is een NETTE stop: gereproduceerd is de CONDITIE (de origin antwoordt niet meer), niet de OORZAAK (het stille sterven, exit 127 of 1). Dat het veld vijf keer de punt-24-melding gaf en deze reproductie niet, is daarmee niet weerlegd en ook niet bevestigd.
- **ROOD EN GROEN, LOS GEMETEN.** Met de rood-patch bevat de melding `INFRASTRUCTUUR-UITVAL` 0 keer; zonder de patch dragen alle vier de bestanddelen. `classifyFailure` gaf 2 treffers vóór de patch, 1 tijdens, 2 erna — de patch raakte dus iets. Beide runs exitcode 1.
- **DE RUISVLOER VAN DEZE SESSIE IS NUL, EN DAT IS NIEUW.** Twee opeenvolgende volledige sweeps op ONGEWIJZIGDE code: 93 van de 95 identiek, 93 vergeleken, 2 uitgesloten wegens punt 23 (`v7/09-vorm.png` en `v7/10-trainingen.png`), NUL bewegende shots. Op 7 augustus gaf hetzelfde ijkpaar 85 van de 95 met acht bewegende, alle acht in `klim-weekstem`. Het enige verschil in de opzet is de WEGGEGOOIDE WARMLOOP die eraan voorafging. KANDIDAAT, niet vastgesteld — en uitdrukkelijk GEEN uitspraak over punt 36: dit is een HERHALINGStoets, en de toets die dat punt discrimineert is de VOLGORDE-toets.
- **DE VERGELIJKER IS EERST GEIJKT, IN TWEE RICHTINGEN.** `out/v2` tegen `out-vorige/v4` gaf 0 van de 8 identiek, `out/v2` tegen zichzelf 8 van de 8. Zonder die twee is "nul bewegende shots" niet te onderscheiden van een vergelijker die altijd identiek zegt.
- **BEGRENZING.** NA tegen VOOR: 93 van de 95 identiek, 93 vergeleken, 2 uitgesloten wegens punt 23, nul bewegende shots — tegen een ruisvloer van nul, dus toe te schrijven aan de bouw. De diff is 84 regels bij en 1 weg over twee hunks; `settle()`, de vier `goto`/`settle`-paren en `process.exit(1)` zijn onaangeroerd, en `still loading after settle` geeft nog exact 1 treffer.
- **BEIDE AFGEBROKEN RUNS GEDRAGEN ZICH ZOALS PUNT 31 BELOOFT.** Geen `RUN-COMPLEET.json` in `tools/shots/out` (12 respectievelijk 9 PNG's), en `tools/shots/out-vorige` bleef staan met 95 PNG's en zijn marker.
- **NIEUWE VLOER: HET AANTAL LINT-WAARSCHUWINGEN.** Dat stond nergens vastgelegd en sloop er bijna in: een eerste bouwversie gaf een 21e waarschuwing (`useOptionalChain`) terwijl `pnpm lint` exit 0 gaf — de gate zou groen zijn geweest. CC ving het en werkte hem weg vóór de meting. Vanaf nu telt dat aantal mee als vloer.
- **WAT DAAN MERKT: NIETS aan de app.** Dit raakt uitsluitend het meetgereedschap.
- **VLOEREN NU: vitest-totaal 971 over 75 bestanden · engine-selftest-assert-count 1652 · lint-waarschuwingen 20**, alle vier afgelezen uit de uitvoer van DEZE ronde. Onbewogen: deze ronde raakte geen enkele test. Lees ze zelf uit de suite; neem ze niet over uit dit blok.
- **OPENSTAAND, elk item opnieuw gegrept in `docs/ROADMAP.md`:** 16 · 19 · 21 · 22 · 23 · 25 · 32 · 33 · 34 · 35 · 36. Punt 37 staat er NIET meer bij.

FOCUS VOLGENDE CHAT: ROADMAP punt 25 + 22 + 23 — de drie blinde vlekken van de camera, in ÉÉN ronde. Ronde 2 van het tooling-blok uit *De volgorde* in `docs/ROADMAP.md`; die paragraaf legt de bouwvolgorde vast LOS van de nummering, dus dit is GEEN afwijking van de reeks. TOOLING, geen engine. Lukt punt 23 niet met uitgezette animaties, dan blijven die twee shots UITGESLOTEN met reden en aantal — dat staat zo in het punt en is geen mislukking. NEEM DE RUISVLOER-KANDIDAAT MEE: draai eerst een warmloop en gooi die weg, en meet daarna je eigen ijkpaar; deze ronde gaf zo nul bewegende shots waar 7 augustus er acht gaf. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWAALF nieuwste blokken; komt er een dertiende bij, dan schuift het oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twaalf is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel.

<!-- EINDE HANDOFF.md -->
