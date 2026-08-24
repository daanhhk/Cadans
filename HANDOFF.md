# Cadans — HANDOFF

Bron van waarheid voor de projectstand. Volgende chats lezen dit eerst
(HANDOFF-fetch = pinned RAW url op commit-hash).

## Project

Cadans — greenfield Cloudflare-herbouw van de FTP-Coach. Repo:
**daanhhk/Cadans** (public). De oude GAS-app (**daanhhk/training**) blijft
live tot cutover.

**Bronnen en voorrang.** Werkwijze: `docs/WERKWIJZE.md` — canoniek, wint bij tegenspraak. Projectstand: dit document. Parity: de bevroren GAS-bron `daanhhk/training` @ `3e8090a` — die wint van élke samenvatting hier. CC-instructies: `CLAUDE.md` in de root (wordt automatisch geladen).

## Stand

STAND 2026-08-24 (DERDE BLOK VAN DEZE DAG) — DE RONDE TROK ZICHZELF IN. Punt 70 bestond om een
leesfout in de power-curve te repareren. **Die leesfout bestaat niet.** De reparatie is geschreven,
groen getest, en daarna volledig teruggedraaid. **Er is deze ronde GEEN REGEL CODE gewijzigd**, en dat
is de opbrengst en geen mislukking.
- **DE PREMISSE WAS FOUT, en zij stond in twee documenten en in een HANDOFF-blok.** Verbatim: *"Een
  mean-max-kromme hoort niet te STIJGEN met de duur: wie X watt over 23 minuten volhield, hield per
  definitie ook ergens 20 minuten ≥X watt vol."* De tweede helft is geen stelling. Tegenvoorbeeld met
  de hand, het signaal `[10, 0, 10]`: beste 2s-gemiddelde **5,00 W**, beste 3s-gemiddelde **6,67 W**.
  Een langer venster mag het ZWAKKE MIDDEN meetellen zolang beide STERKE RANDEN erin passen; een
  korter venster moet één rand opgeven.
- **EN HET GEBEURT ECHT, op Daans eigen data.** Herberekend uit de rauwe 1 Hz-`watts`-stream van rit
  `i171448183` (4407 samples), uitputtend: beste 140s = **357,643 W** over 4268 vensters, beste 165s =
  **366,927 W** over 4243. Beslissend: het beste 140s-blok van de hele rit LIGT IN dat 165s-venster en
  haalt daar 357,643 W. De "reparatie" zou 140s op **366,9 W** zetten — een gemiddelde dat in geen van
  die 4268 vensters bestaat. **Zij verving een JUIST getal door een ONHAALBAAR getal.**
- **`pcMarkerAt_` LAS AL GOED.** Op het 42d-venster is 261 W op 1200 s het beste twintigminutenblok en
  264 W op 1380 s het beste drieëntwintigminutenblok. Twee vragen, twee antwoorden, allebei juist. De
  bestaande niveaukaart is in orde en de doelcheck erft geen leesfout.
- **DE WEERLEGGINGSPAS: 3 VAN 3 LENZEN VOLTOOID — en hij verdiende zichzelf dezelfde ronde terug.**
  Vooropgedraaid, zoals sinds deze ronde de regel is. Was hij als sluitstuk gedraaid, dan was
  `monotoniseerKromme` groen, gecommit en gedeployd geweest. **De volgorde van de pas is geen
  procesdetail; zij was hier het verschil.** Vastgelegd in `docs/WERKWIJZE.md`.
- **DE DIEPERE LES, en die is groter dan deze ronde.** Alle drie de verwachtingen waren toetsbaar en
  twee werden bevestigd door echte metingen op echte data. Toch was de conclusie fout: geen van die
  metingen raakte de AANNAME eronder. P2 mat "is het lopende maximum ooit lager" — 0 keer op 566
  punten over drie vensters — en een lopend maximum KÁN niet lager zijn. Dat is zijn definitie, geen
  bevinding. **Een verwachting die niet kan falen, toetst niets en leest achteraf als bewijs.** Nieuw:
  `docs/CC-CHECKS.md` **CHECK 40** — zoek het kleinste tegenvoorbeeld met de hand vóór je een
  definitorische aanname laat dragen.
- **TWEE BIJVANGSTEN, allebei zelf nagemeten en allebei een nieuw punt.** (71) De `curve`-array in de
  power-curve-DTO heeft **GEEN enkele lezer**: de grafiek komt uit `markers`
  (`Rijdersprofiel.tsx:45` is `function CurveChart({ markers }: { markers: PowerCurveMarker[] })`).
  (72) `scripts/powercurve-smoke.mjs:61` is een **DERDE ingang** naar `pcNormalize_`, buiten
  `workers/api/src/integrations/powercurve.ts` om — in de teruggedraaide code stond een commentaarregel
  dat die grens "de enige ingang" was, en dat was aangenomen en niet getoetst.
- **NUMMERING, en meld dit terug aan de chat.** De prompt heette "punt 68", maar 68 was in
  `docs/ROADMAP.md` al bezet door *"De per-blok-antwoorden dragen TWEE doel-kolommen"* en 69 door
  *"HET FTP-VOORSTEL NA EEN GEREDEN TEST"*. Deze ronde staat daarom als **punt 70**, de bijvangsten
  als 71 en 72.
- **HET BLOK HIERONDER IS OP TWEE PLEKKEN DOORGEHAALD**, want het droeg de fout: de bullet over
  "direct afleesbaar" en de FOCUS-regel die het lopende maximum in ELKE weg voorschreef.
  `docs/RITDATA-RECON.md` §8 is herschreven van reparatie naar intrekking.
- **DRIE GET-VERZOEKEN aan intervals.icu**, alle met een harde bovengrens die GOOIT. Geen mutatie,
  nergens — geen migratie, geen deploy, geen remote-D1-schrijfactie. De sleutel heet
  `INTERVALS_API_KEY` en zijn waarde staat nergens.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 51 (alleen (3)) · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · 69 ·
  71 · 72.

FOCUS VOLGENDE CHAT: **ROADMAP punt 69 — HET FTP-VOORSTEL NA EEN GEREDEN TEST.** Rijdt Daan een
aangeboden ijkinspanning, dan berekent de app een nieuwe drempelwaarde en STELT DIE VOOR met de oude
ernaast; vandaag vraagt de app om een meting en doet niets met de uitslag. De grondstof is gemeten en
bestaat: `GET /activity/{id}/power-curve` geeft de 20-minutenpiek van ÉÉN rit direct, 5353 bytes, één
verzoek — en de athlete-curve kan dat NIET vervangen, want die wijst de BESTE rit in het venster aan
en niet de laatste. **WAT EERST EEN DAAN-BESLUIT VRAAGT: de omrekenregel.** Van 20 minuten naar een
drempelwaarde hoort een factor (klassiek circa 95 procent) en die staat NERGENS in de repo of in
`DOELEN-SPEC` — behalve als UI-tekst in `ftp.ts` met nul lezers in code, en die gaat over het
TESTBLOK en niet over de beste 20 minuten van de rit. Dat zijn twee verschillende getallen en er moet
één gekozen worden. **EN NEEM GEEN LOPEND MAXIMUM:** lees de waarde OP 1200 seconden, zie het
bovenstaande blok. De keuze uit `docs/RITDATA-RECON.md` §7 blijft open voor de doelcheck (punt 61) en
het onderweg-signaal (punt 63).

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

STAND 2026-08-24 (TWEEDE BLOK VAN DEZE DAG) — DE RITDATA IS IN KAART GEBRACHT EN ER LIGT EEN KEUZE
VOOR DAAN. RECON-ronde: geen bouw, geen migratie, geen deploy, read-only op de repo en LEZEND op
intervals.icu. **De deliverable is `docs/RITDATA-RECON.md` en die eindigt met VIJF WEGEN in gewone
taal — Daan leest dat blok en kiest.**
- **DRIE BEHOEFTEN WACHTTEN OP DEZELFDE ONTBREKENDE GRONDSTOF, en ze blijken drie VERSCHILLENDE
  dingen te vragen.** (1) Een piek uit ÉÉN rit, voor het FTP-VOORSTEL na een gereden ijkinspanning
  (nieuw Daan-besluit, ROADMAP punt 69). (2) Een piek over ZES WEKEN, voor de doelcheck. (3) De
  TIJDLIJN binnen een rit, voor het onderweg-signaal.
- **DE ZESWEEKSE GRONDSTOF BESTAAT WÉL, en dat was de open vraag.** `curves=42d` geeft 200;
  `curves=6w` geeft 422 `"Invalid curve: [6w]"`. Het venster is een `<n>d`-vorm en `n` is vrij. **En
  `curves=42d,90d` geeft BEIDE vensters in ÉÉN verzoek**, dus het lift mee op een aanroep die Cadans
  al doet.
- ~~**MAAR "DIRECT AFLEESBAAR" WAS ONJUIST, en dat is de scherpste vondst van de weerleggingspas.**~~
  **INGETROKKEN 24-08-2026 — DEZE BULLET WAS FOUT. ZIE HET BOVENSTE BLOK.** De waarneming klopte (de
  `values`-reeks is niet monotoon dalend; 1200s = 261 W en 1380s = 264 W op rit `i166073333`), maar
  de conclusie eronder niet. "Een echte mean-max-kromme kan niet stijgen met de duur" is wiskundig
  onjuist, en dus onderschat aflezen op `secs 1200` NIETS. `pcMarkerAt_` leest correct. **Neem hier
  geen lopend maximum uit over.**
- **`curves=42d` IS 43 DAGEN.** Gemeten: `label` `"42 days"`, maar `days` **43**, met
  `end_date_local` een dag NA vandaag. Wie letterlijk zes weken wil, stuurt `oldest`/`newest` mee.
- **DE HISTORIE-VRAAG IS BEANTWOORD EN FEBRUARI IS GEEN PROBLEEM.** `oldest`/`newest` begrenzen het
  venster ECHT — gemeten op drie historische bereiken, waarbij niet alleen de DATUM maar ook de
  WATTS per bereik verschilden (254 W in januari, 265 W in het najaar, 231 W in het voorjaar). De
  doelcheck hoeft dus NIET vanaf nu op te bouwen; zij kan met terugwerkende kracht elk venster
  opvragen. Per-rit-krommen zijn ook te backfillen: 255 ritten, ~1,4 MB. Streams zouden ~93 MB zijn.
- **U1 VALT, U2 HOUDT.** U1: de piek-per-rit en de piek-over-zes-weken komen uit TWEE
  endpoint-klassen. Bewijs dat ze niet inwisselbaar zijn: het 42d-venster wees rit `i166073333` aan
  en het 90d-venster `i158575314` — de marker geeft de BESTE rit, niet de LAATSTE. U2: streams zijn
  363535 bytes tegen 5353 voor de per-rit-kromme, ongeveer 68 keer, bij hetzelfde aantal verzoeken.
- **EEN VIERDE WEG DIE OP GEEN ENKELE LIJST STOND, en hij is GRATIS.** De activiteitenlijst die
  Cadans al ophaalt draagt per rit `decoupling` (12/12 ritten), `icu_power_hr_z2` (11/12),
  `icu_power_hr_z2_mins` en `icu_efficiency_factor` (12/12) — 61.412 bytes voor 42 dagen in ÉÉN
  verzoek dat er toch al is. Dat zijn AGGREGATEN per rit en geen tijdlijn, maar het onderweg-signaal
  vraagt een TREND over weken. **Blijkt dat genoeg, dan is het onderweg-signaal de GOEDKOOPSTE van
  de drie behoeften in plaats van de duurste** — en dat verschuift de volgorde.
- **TWEE DINGEN DIE DE WEG NIET DICHT.** (i) §3.2 draagt TWEE criteria op TWEE grootheden: een
  VLOER op "de FTP waarmee de winter begon" (een FTP op een ankerdatum, niet een piek) en een
  DELTA-METER die een basislijn nodig heeft. Een 42d-piek levert alleen de meter-helft. (ii) De
  omrekenregel van 20 minuten naar een drempelwaarde BESTAAT in de repo — `ftp.ts`, verbatim
  *"Nieuwe FTP = 95% van gemiddeld vermogen over de 20 min"* — maar als UI-tekst met nul lezers in
  code, en op het TESTBLOK en niet op de beste 20 minuten van de hele rit. Dat zijn twee getallen en
  er moet één gekozen worden. ROADMAP punt 69 stelde dat de regel nergens staat; rechtgezet.
- **DE POORT VOOR BEHOEFTE 1 BESTAAT AL.** De lens wees erop dat de kromme een getal geeft voor
  ELKE rit — de 195 W kwam van een Z2-rit, en 0,95 × 195 = 185 tegen een gezette FTP van 280. Maar
  Cadans WEET welke dag een test was: de override draagt `workoutType: "test"` plus
  `testBadgeLabel()`, en `testResultaat` herkent die combinatie al. De poort is er; zij is alleen
  niet met de piek verbonden.
- **STREAMS ZIJN GEEN ZUIVERE 1 Hz.** `time` loopt van 0 tot 4544 over 4510 samples: vier gaten,
  35 seconden. Rekenen moet over `time`, niet over de index.
- **NEGENTIEN GET-VERZOEKEN aan intervals.icu**, alle met een harde bovengrens die GOOIT in plaats
  van door te gaan — de les van de vorige ronde. Een dagsync doet er drie, dus dit is ongeveer zes
  dagsyncs. Geen enkele mutatie. De sleutel heet `INTERVALS_API_KEY` en zijn waarde staat nergens.
- **DE WEERLEGGINGSPAS: 1 VAN DE 4 LENZEN VOLTOOID, over TWEE pogingen.** De pas is vroeg gestart om
  te kunnen herstarten; dat was nodig en het hielp niet. Poging 1: één lens klaar, drie stopten met
  schrijven en leverden geen enkel resultaat, ook geen foutrapport. Poging 2 (`resumeFromRunId`):
  vier agents kwamen op gang, schreven ongeveer een minuut en stopten op dezelfde manier. Vorige
  ronde stierven er twee op een expliciete `529 Overloaded`; nu zonder melding. **Dat is een
  omgevingsprobleem en geen uitslag.** Wat NIET is aangevallen: de INVENTARIS van de vijf endpoints
  en de HISTORIE-claim — die rusten op mijn eigen meting alleen. **De historie-claim is de
  gevoeligste, want zij beslist of de doelcheck in februari data heeft; wie hierop verder bouwt doet
  er goed aan die pas alsnog te draaien.** Eindstand in `docs/RITDATA-RECON.md` §6.
- **VLOEREN: lees ze zelf uit de suite.** Neem geen getal over uit een blok.
- **OPENSTAAND, elk item opnieuw te greppen in `docs/ROADMAP.md`:** 32 · 34 (alleen (d)) · 35 · 48 ·
  49 · 53 · 54 · 56 · 61 · 63 · 64 · 65 (alleen de REPARATIE) · 66 · 67 · 68 · **69 (nieuw — het
  FTP-voorstel na een test)**.

FOCUS VOLGENDE CHAT: **DAAN KIEST EERST.** `docs/RITDATA-RECON.md` eindigt met vijf wegen; zonder die
keuze is er niets te bouwen, want de drie behoeften delen hun bron NIET vanzelf. Ligt de keuze er, dan
is de eerstvolgende bouw wat die keuze aanwijst — waarschijnlijk **ROADMAP punt 69 (het FTP-voorstel
na een test)** of **punt 61 (de doelcheck)**, en die twee delen alleen de reken-ingreep hieronder.
~~**EEN DING IS GEEN KEUZE en hoort in ELKE weg:** waar de app een 20-minutenwaarde uit een kromme
haalt, moet zij het lopende MAXIMUM vanaf 1200 seconden nemen en niet de waarde OP 1200 aflezen.~~
**INGETROKKEN 24-08-2026, zie het bovenste blok: dit hoort in GEEN ENKELE weg.** Het lopende maximum
levert een getal op dat de renner niet gereden heeft. Aflezen OP 1200 is de juiste lezing en de
bestaande niveaukaart is in orde.

**DE OMGEVINGSVERKLARING BLIJFT EEN STOP-CONDITIE.** Deze ronde: pad `/c/Users/daan/Projects/cadans`,
`git rev-parse --git-dir` en `--git-common-dir` allebei `.git` dus HOOFDCHECKOUT, branch `main`, 0
achter en 0 vooruit op `origin/main`, versie `2.1.208 (Claude Code)`, boom schoon bij aanvang.
Agent-discovery blijft NIET GEMETEN: deze sessie begon `2026-07-14T07:20:14.850Z` en
`.claude/agents/recon.md` dateert van `2026-08-23 07:48`.

CONTEXT: Daan fietst voorlopig niet, beschikbaarheid 0, planner leeg vanaf 2026-08-09 — **dat is
geen defect.** Daan GEBRUIKT de gedeployde app; prod is geen proefopstelling. Verse chat.

De oudere STAND-blokken en de historische projectsecties staan in `docs/HANDOFF-ARCHIEF.md`.
Dit bestand draagt de TWEE nieuwste blokken; komt er een derde bij, dan schuiven de oudste in
DEZELFDE close-out door naar het archief. HERKOMST BELEID: twee is een keuze over hoeveel historie
de opener meedraagt, geen geijkte drempel. Tot 21-08-2026 stond die grens op twaalf; hij is
aangescherpt omdat de opener de stand als HISTORIE meedroeg terwijl een nieuwe chat aan het
bovenste blok en de FOCUS-regel genoeg heeft.

<!-- EINDE HANDOFF.md -->
