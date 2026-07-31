# Cadans — DOEL-LIJST-RECON (punt 7 + punt 8)

Recon voor `docs/ROADMAP.md` *De reeks* punt 7 (de doel-lijst klopt niet) en punt 8 (de
meetlat kent maar twee doelen). Harde datum: half februari 2027. Dit document is de SPEC
waartegen gebouwd wordt; het wijzigt geen code.

## 1. Meetopstelling

Publieke repo read-only gekloond op `1cbe22b`. Engine plus `apps/web/src/lib/proposal.ts`
gebundeld met esbuild BUITEN de repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd op maandag
2026-07-27 08:00 — de klok is een fixture-variabele, `allocateQualityWeek_` en
`weekIndexFromStart_` dateren zich op ambient `new Date()`. Gemeten via `buildWeekProposal`,
de functie die de app zelf aanroept, niet via een nagebouwde lus. Fase gestuurd door de
event-datum (`eventFase_`), afgelezen uit `macroFase` in de uitvoer.

## 2. `DOELEN-SPEC` §1 IS VEROUDERD — de doelen lopen wél uiteen

§1 stelt dat in Base alle vijf doelen 2 kwaliteitsdagen en 45 minuten hoog-intent leveren.
Dat is gemeten op `eee966b`, vóór punt 1, 1b en 2. GEMETEN op `1cbe22b`, weekvorm V1
(ma60 di60 do60 za120, 5,0 u), fase Base: FTP 3 dagen / 93 min / 268 TSS · Conditie 2 / 66 /
245 · Beklimmingen 2 / 69 / 253 · VO2max 2 / 69 / 253 · Onderhoud 3 / 87 / 254.

Een gepind document bewijst zijn eigen geldigheid niet. §1 is een METING, geen VASTGESTELD
besluit, en wordt hier gecorrigeerd — niet heropend.

## 3. DE DRAGENDE BEVINDING — Beklimmingen en VO2max zijn in Base BYTE-IDENTIEK

Zelfde dagen, zelfde sjablonen bij naam, zelfde TSS, op elke gemeten weekvorm:

- V1 5,0 u  — beide 2 dagen, 69 kwaliteitsminuten, 253 TSS.
  Ma `Drempel ladder 5-7-9` · di Z2 · do Z2 · za `Sweet spot 4x12`.
- V3 8,0 u  — beide 2 dagen, 81 kwaliteitsminuten, 389 TSS.
- winter 3x60 — beide 2 dagen, 45 kwaliteitsminuten, 149 TSS.

En GEEN van beide levert in Base ook maar EEN anaerobe minuut. Oorzaak: `GOAL_FASE_MOD_.Base`
zet vo2 op −0,10, waardoor de vo2-intent bij elk profiel achteraan sorteert. Base loopt met
AGR in de agenda tot 2027-02-15, dus dit geldt de hele winter.

In Build en Peak lopen ze wél uiteen (V1 Build: Beklimmingen 3 / 65 / 270 met 14 anaerobe
minuten, VO2max 3 / 55 / 267 met 13). Het klim-doel is daar het ZWAARDERE van de twee.

## 4. DE DODE TAK, EXACT BEGRENSD

`climbTypeWorkout_` (`planner.ts:1051`) staat in `keyIntensity` (`planner.ts:995`) achter
`goalWorkout_`. Er is precies EEN niet-test-aanroeper van `keyIntensity` (`planner.ts:852`)
en die geeft altijd `settings` mee, dus `goalWorkout_` wordt altijd aangeroepen.

GEMETEN over alle 15 combinaties (5 doelen x 3 fases): `goalWorkout_` levert vanaf **33
minuten** een kandidaat, in elke combinatie dezelfde grens. Dat is de ondergrens van de
archetype-bibliotheek. `eligible_` (`planner.ts:237`) kent GEEN minimum-minuten-poort.

CONCLUSIE, scherper dan "in de praktijk onbereikbaar": de tak kan uitsluitend vuren op een
kwaliteits-eligible dag van 32 minuten of korter, in fase Build of Peak, met een `klimType`
op het hoofdevent. Smal, niet nul. Opruimen is dus een GEDRAGSWIJZIGING op die grens en
daarmee toetsbaar — zie de acceptatie-eisen in paragraaf 9.

Wat de tak vandaag oplevert (gemeten): kort → `vo2max`; lang → `sweet_spot` bij dekking leeg,
`threshold` bij dekking vol; gemengd → `vo2max` respectievelijk `threshold`; vlak en null →
null. Na verwijdering valt zo'n dag door naar de categorie-tak eronder.

## 5. BLAST RADIUS — waar de doel-string leeft

ENGINE:
- `phase.ts:12` `DOEL_OPTIONS` — de vijf literals.
- `archetypes.ts:1675` `profileForDoel_` — vijf takken plus klim-fallback.
- `archetypes.ts:1597` `PROFILES` — vijf profielen.
- `planner.ts:983` `doelKey` — voedt `"pendel_" + key + "_intervals"`.
- `planner.ts:1030-1041` `keyIntensity` categorie-tak.
- `planner.ts:1051` `climbTypeWorkout_`.
- `planner.ts:1778-1786` buildWorkout-dispatch naar de doel-libraries.
- `zones.ts:333,342-345` twee doel-takken (pendel-zones en `test`-zones).
- `utils.ts:62` `KWALITEIT_MIN_PER_PRIKKEL` — FTP 28, Onderhoud 22, rest valt op 26.
- `niveau.ts:629` `activeGoalProfile_` — punt 8.

CLIENT: `apps/web/src/lib/settings.ts:103` (labels) en `pages/Instellingen.tsx:706`.

DATA: geen. `settings.doel` is vrije tekst; de worker valideert niet tegen een lijst en er is
GEEN migratie nodig. `sync_state.dosis_trede_doel` bewaart de doel-string, en een doel-wissel
laat de trede per ontwerp vervallen — dat is bestaand, correct gedrag.

NIET geraakt: `TRAINING_CATS_` (`planner.ts:1357`) is een WORKOUT-lijst, geen doel-lijst; de
categorie `vo2max` blijft daar staan. `vo2Pools_` en `workoutForVo2max` blijven bestaan.
`archetypeAllowedForProfile_` gate't op `restrictTo`, en GEEN archetype zet dat veld meer —
nieuwe profiel-id's zijn dus veilig.

## 6. BESLUIT — de vijf doelen

`DOEL_OPTIONS` wordt: `FTP`, `Conditie`, `Korte beklimmingen`, `Lange beklimmingen`,
`Onderhoud`. Nederlandse leesbare strings, want de doel-string LEKT in copy
(`planner.ts:857`: "Sleutelsessie · <doel> — fase <fase>").

VO2max vervalt als DOEL en blijft volledig als MIDDEL (`DOELEN-SPEC` §3.6): pools, type,
archetypes en de trainingskiezer ongemoeid. Dit besluit is niet nieuw — het staat sinds
`DOELEN-SPEC` §3.6 als VASTGESTELD en als open bouwpunt in §6 stap 3; alleen de BOUW is nieuw.

LEGACY-WAARDEN. Niet twee alias-takken in `profileForDoel_`, maar ÉÉN pure normalisatie:
`normalizeDoel_(doel)` in `phase.ts`, direct onder `DOEL_OPTIONS`. Een waarde uit
`DOEL_OPTIONS` geeft zichzelf terug; `"Beklimmingen"` → `"Korte beklimmingen"` (het A-doel van
`DOELEN-SPEC` §3.3); `"VO2max"` → `"FTP"`; al het overige, inclusief `null` en de lege string,
→ `"FTP"` — de referentie volgens §3.1. Daarmee vervalt ook de oude klim-fallback voor een
onbekend doel, gedwongen door de splitsing: een generiek klim-profiel bestaat niet meer.

WAAROM ÉÉN NORMALISATIE EN NIET PER TAK. `settings.doel` is VRIJE TEKST in D1 — de worker
valideert hem niet tegen een lijst, dus elke ooit opgeslagen waarde komt gewoon binnen, en de
UI biedt de oude strings nog aan tot fase B2. De twee consumenten lezen die string bovendien op
verschillende hoogte: `buildWorkout` kiest zijn bibliotheek op de RAUWE string, terwijl
`profileForDoel_` op het PROFIEL werkt. Zonder één gedeelde normalisatie lopen die twee uiteen:
het profiel klopt wel, maar de bibliotheek-dispatch raakt geen tak meer en de dag valt stil door
naar `genericRecovery`. Geen fout, geen rood — een herstelrit waar een sleutelsessie hoort.

WAAR HIJ WORDT AANGEROEPEN. `profileForDoel_`; `doelKey` en `keyIntensity` (allebei worden ook
rechtstreeks met rauwe strings aangeroepen); de twee doel-takken in `zones.ts`; en de drie
`const doel = settings.doel`-bindingen in `planner.ts` (`allocateQualityWeek_`,
`assignWorkouts`, `buildWorkout`). Die laatste drie zijn dragend voor de COPY: de reden
"Sleutelsessie · <doel> — fase <fase>" en de sjabloonnamen "Pendel + <doel> intervallen" en
"Lange rit + <doel> efforts" bouwen de doel-string letterlijk in hun eigen tekst. GEMETEN bij de
bouw: zonder normalisatie op `buildWorkout` is de legacy-week op precies één sjabloonnaam na
identiek aan de canonieke — het soort verschil dat een byte-vergelijking wel ziet en een mens
niet. Eis 7c dekt alle plekken in één meting.

## 7. BESLUIT — de twee profielen

Elk getal draagt zijn herkomst. Alle intent-gewichten en quota zijn PLAN, afgeleid uit
`DOELEN-SPEC` §3.3 en §3.4. GEEN getal komt uit Daans reeks; die reeks is een verslag van
rijden op gevoel en zou hier de gewoonte reproduceren die de coach vervangt.

`klim_kort` (NIEUW):
- `intentGewichten` vo2 0,45 · drempel 0,35 · sweetspot 0,20 — PLAN, §3.3
  ("herhaalbaarheid boven de drempel; 30/15, 40/20, klimherhalingen 2-5 min").
- `kwaliteitPerWeek` Base 3 · Build 3 · Peak 2 — PLAN, §3.3 ("een korte-intervalsessie, een
  drempelsessie, een groeiende lange rit"). In Build en Peak consumeert de efforts-arm er
  een, dus 3 levert daar intervalsessie + drempelsessie + lange rit met efforts.
- `spreiding` midweekMinGap 1 · weekendBlok true · effortsInLangeRit true — PLAN, §3.3 (iii):
  de inspanningen horen LAAT in een lange rit.
- `langeRitPerWeek` 1 — PLAN, §3.3 ("BESCHERMD: de intervalsessie EN de lange rit").
- `archetypeVoorkeuren` vo2_30_15_sets 0,25 · vo2_hill_repeats 0,20 · vo2_40_20 0,15 —
  PLAN, §3.3 noemt deze vormen bij naam.
- `volumeResponse` vo2Slope 0,03 · vo2Cap 0,15 — GEERFD van `PROFILES.klim`, onveranderd
  overgenomen. De splitsing gaat over intent en quotum, niet over de volume-respons.
- `soort` "event", `projectieKey` "klim_kort".

`klim_lang` (de voortzetting van `PROFILES.klim`):
- `intentGewichten` drempel 0,50 · sweetspot 0,35 · vo2 0,15 — PLAN, §3.4 ("aanhoudende
  blokken van 8-30 minuten rond de drempel, plus tempo-volume").
- `kwaliteitPerWeek` Base 2 · Build 3 · Peak 2 — ONVERANDERD van `PROFILES.klim`. §3.4:
  volume-hongerig, beschermd is het weekendpaar, residu is de midweekse kwaliteit.
- `spreiding` midweekMinGap 1 · weekendBlok true · effortsInLangeRit true — ONVERANDERD.
- `langeRitPerWeek` 1 — ONVERANDERD.
- `archetypeVoorkeuren` threshold_long 0,25 · threshold_2x20 0,20 · sweetspot_long_climb 0,20
  — PLAN, §3.4 (aanhoudende blokken 8-30 min).
- `volumeResponse` vo2Slope 0,03 · vo2Cap 0,15 — ONVERANDERD.
- `soort` "event", `projectieKey` "klim_lang".

`PROFILES.klim` en `PROFILES.vo2max` verdwijnen als sleutel; `PROFILES.vo2max` is na het
vervallen van het doel nergens meer bereikbaar.

## 8. PUNT 8 — de meetlat, EIGEN FASE

`activeGoalProfile_` (`niveau.ts:629`) geeft FTP het ftp-profiel en ELK ander doel het
girona-EVENT-profiel; label "Girona" en subtitel "~90 km · 1200 hm/dag · lange klimmen"
staan letterlijk in de Niveau-tab, ook bij doel Onderhoud.

GEMETEN GRENS: `Niveau.tsx:124-128` kent precies DRIE meetgrootheden — `ftpWkg`, `ctl` en
`longRideH`. Elke andere maat vraagt clientwerk.

Daaruit volgt de scope:
- `klim_lang` erft de girona-dims ongewijzigd en wordt alleen HERNOEMD. Girona IS het lange-
  klimmen-profiel; het droeg alleen een reis als naam.
- `klim_kort` en `conditie` krijgen eigen dims binnen die drie grootheden.
- `onderhoud` krijgt een BEHOUD-lat: geen groei-target, en ook geen stilte. `DOELEN-SPEC`
  §3.2 KETEN schrijft hem al voor — bij de overgang naar Build minstens circa 95 procent van
  de FTP waarmee de periode begon. De beginwaarde komt uit `instapNiveau()` (`effect.ts`) op
  de startmaandag van de onderhoudsperiode: bestaande functie, geen nieuwe data, geen
  migratie. Vorm: `metric` ftpWkg, `dir` "up", target = de vloer — `goalGap_` zet `onTrack`
  dan op current >= vloer, precies een vloer.
- VLOER 5 PROCENT. HERKOMST: BELEID (Daan-besluit) PLUS een INSTRUMENT-grens. Fysiologisch is
  bij 6 naar 4 uur met de drie kwaliteitsdagen intact volledig behoud realistisch, dus de
  vloer is GEEN verwachting maar de resolutie van de meter: `rolling_ftp` beweegt over een
  jaar meerdere watts zonder trainingsreden (276 januari, 272 mei, instap 269 tegen maximum
  267 in juni), dus strakker dan circa 3 procent bemonstert ruis.
- DE VLOER SCHUIFT NIET MEE MET DE UREN, expliciet. Zakken de uren zo ver dat de drie
  kwaliteitsdagen niet meer passen, dan is het antwoord NIET een ruimere vloer maar dat het
  doel niet bij de uren past en de coach dat zegt (M40, punt 12). Een meeschuivende vloer
  blijft groen terwijl je zakt en verbergt precies het signaal dat je nodig hebt.
- DE COMPLICATIE die fase C eigen maakt: targets in `GOAL_PROFILES_` zijn vandaag CONSTANTEN,
  en de onderhoud-vloer is AFGELEID van de instapwaarde. Die moet dus berekend en ingespoten
  worden — dat raakt `Niveau.tsx`, en daarom is punt 8 een eigen fase met een eigen commit,
  niet gebundeld met punt 7.
- De echte meters voor korte beklimmingen en conditie (durability, 20-minutenvermogen na
  15 kJ/kg) horen bij punt 11 en worden hier NIET gebouwd.

### CORRECTIE 31-07-2026 — §8 op vijf punten bijgesteld, gemeten vóór de bouw

1. DE METER MOET AAN BEIDE KANTEN DEZELFDE ZIJN. §8 wijst `ftpWkg` aan voor de
onderhoud-vloer. Die grootheid is in `Niveau.tsx` `computeNiveau_(settings.ftp,
settings.gewicht).wkg` — de HANDMATIG INGESTELDE FTP. De vloer komt uit `instapNiveau()`
en dat is `rolling_ftp` uit de ritten. Twee verschillende grootheden tegen elkaar.
GEMETEN: `ftp_auto_update` staat in het schema (`workers/api/src/db/schema.ts:65`) en
heeft NUL lezers, dus `settings.ftp` beweegt alleen als de gebruiker hem overtypt — de
vloer zou de hele periode groen staan op een met de hand ingevuld getal, ongeacht wat er
getraind is. Zelfde familie als "een pad kan dood zijn aan zijn INVOER" (`WERKWIJZE.md`):
het mechanisme (`goalGap_` met dir "up") werkt, de invoer niet. BESLUIT: een VIERDE
meetgrootheid `rollingFtpW`, aan beide kanten `rolling_ftp`, in WATT. Watt en niet W/kg
omdat `DOELEN-SPEC` §3.2 KETEN spreekt van "circa 95 procent van de FTP waarmee de
periode begon", en omdat gewicht anders een tweede bewegend deel wordt in een
behoud-vraag: een paar kilo eraf maskeert dan een FTP-daling. De drie bestaande
grootheden blijven ongemoeid.

2. DE 5 PROCENT, BOVENGRENS-GECHECKT OP DE ECHTE REEKS. Doorgerekend op de 38 gecommitte
weken uit `docs/EFFECT-REFERENT-RECON.md` §4. Winter-analoog 2025-12-01 t/m 2026-02-23:
instap 273 W, vloer 259,35 W, laagste week 267 W (2026-01-05) = 97,8 procent — NUL weken
onder de vloer. Over ELK aaneengesloten venster van twaalf weken in de reeks is de
diepste dip 95,7 procent (start 2026-02-09, instap 276, laagste 264). De 5-procent-vloer
vuurt in de hele reeks GEEN ENKELE keer; 4 procent zou daar wél gevuurd hebben, 2 procent
op één week, 1 procent op twee. Dit is GEEN ijking — de vloer is BELEID plus
instrument-resolutie, zoals §8 zelf vaststelt, en de reeks is gedrag dat de coach
vervangt — maar wel de bovengrens-check die `WERKWIJZE.md` voorschrijft. Behoud hoort de
normale uitkomst te zijn; de kaart meldt dus in de regel "op koers".

3. ER MOET EEN DERDE PROJECTIEMODUS BIJ. `DoelProjectie.tsx` kent `gap` en `test`. De
onderste helft van de kaart (het uren-schuifje plus de projectie) hangt aan `proj`, en
die is null zodra `targetCtl` null is — en `targetCtl` komt uit de ctl-dim, die Onderhoud
per `DOELEN-SPEC` §3.2 juist NIET krijgt ("NIET CTL — die hoort te dalen"). Zonder
ingreep valt die helft terug op de lege-staat-copy over onvoldoende recente ritten, en
dat is ONWAAR: de ritten zijn er en het doel is bekend. Het uren-schuifje blijft
bovendien staan terwijl een behoud-doel niet opbouwt. BESLUIT: `projectieMode: "behoud"`
verbergt het hele blok vanaf de uren-sectie.

4. `projectieKey` WORDT NIET AANGESLOTEN MAAR VERWIJDERD. Het veld staat op twee
planner-profielen (`archetypes.ts:1610` en `:1632`) en heeft NUL lezers. Aansluiten
vraagt dat `niveau.ts` uit `archetypes.ts` leest, en dat sluit een import-ring:
`archetypes.ts` importeert `coach.ts` (regel 7), dat `niveau.ts` importeert (regel 14).
Beide betrokken objecten worden bij module-evaluatie opgebouwd, dus die cyclus is niet
theoretisch. IN PLAATS DAARVAN worden de SLEUTELVERZAMELINGEN gelijkgetrokken:
`GOAL_PROFILES_` krijgt exact de vijf sleutels van `PROFILES` (`ftp`, `klim_kort`,
`klim_lang`, `conditie`, `onderhoud`), en `activeGoalProfile_` mapt via `normalizeDoel_`
met dezelfde vijfweg-tak als `profileForDoel_`. Daarmee doet het veld niets meer wat de
sleutel zelf niet doet — vooruit-bedrading die nooit een lezer kreeg. Tegen drift tussen
de twee mappings komt één mechanische invariant in de selftest.

5. `activeGoalProfile_` GAAT DOOR `normalizeDoel_`. Het is vandaag de ENIGE doel-lezer
die dat niet doet. Vandaag onschadelijk omdat elk niet-FTP-doel toch op girona landt,
maar zodra elk doel zijn eigen lat krijgt landt een opgeslagen legacy-waarde op de
verkeerde.

DE VIJF LATTEN. `ftp` ongewijzigd. `girona` wordt `klim_lang`, dims BYTE-IDENTIEK, alleen
sleutel, label en sub bewegen. `klim_kort` erft die dims met longRideH 4,0 naar 5,0
(HERKOMST: PLAN, `DOELEN-SPEC` §3.3 KETEN (iii): de lange rit groeit naar vier à vijf
uur). `conditie` erft ze ZONDER de klim-dim (HERKOMST: PLAN, §3.5: "BESTEMMING: X watt na
N uur — een durability-getal, geen FTP"). `onderhoud` draagt geen constante target maar
één afgeleide vloer. De echte meters voor korte klimmen en conditie blijven bij punt 11.

DE ANKERDATUM VAN DE VLOER IS `settings.doelStart` — het enige bestaande veld dat een
periodestart draagt (UI-label "Blok-start"). GEVOLG voor de gebruiker, expliciet: wisselt
het doel naar Onderhoud, dan hoort `doelStart` op die datum gezet te worden, anders meet
de vloer tegen de instapwaarde van een vorige periode. Geen nieuw veld, geen migratie.

## 9. ACCEPTATIE-EISEN voor de bouw van punt 7

Geformuleerd NA vaststelling van het mechanisme, en alleen over wat de ingreep kan raken.

CONTAINMENT, per plek:
- De weekvorm-as (`weekvormAs.test.ts`) draait op doel FTP en moet BYTE-IDENTIEK blijven —
  kwaliteitsminuten, week-TSS en kwaliteitsdagen alle drie ongewijzigd.
- Van de 48 vingerafdrukken in `onderhoudInvariance.test.ts` (4 doelen x 3 fases x 4
  weekvormen) blijven de 12 FTP-rijen en de 12 Conditie-rijen byte-identiek. De 12
  VO2max-rijen vervallen; de 12 Beklimmingen-rijen worden vervangen door 12 rijen voor de
  twee nieuwe doelen. Rapporteer het aantal gewijzigde rijen per doel.

EFFECT, gemeten met `buildWeekProposal` op V1 (ma60 di60 do60 za120) en V3
(ma70 di70 do70 za180 zo90), fase Build:
- `Korte beklimmingen` en `Lange beklimmingen` leveren NIET dezelfde week — minstens een
  verschil in anaerobe intentminuten.
- `Korte beklimmingen` levert MEER anaerobe intentminuten dan `Lange beklimmingen`.
- `Lange beklimmingen` levert MEER high-intentminuten dan `Korte beklimmingen`.
Rapporteer beide weken volledig (dagen, high, anaeroob, TSS, sjabloonnamen).

ROOD PER TERM, elke term apart teruggedraaid en de suite gedraaid:
- Zonder de nieuwe `intentGewichten` van `klim_kort` valt minstens een assertie.
- Zonder `kwaliteitPerWeek.Base` 3 op `klim_kort` valt minstens een assertie.
- Voor het VERWIJDEREN van `climbTypeWorkout_` bestaat geen vangnet-in-de-oude-richting; de
  toetsbare kant is de GRENS. Assertie: `keyIntensity` met doel `Korte beklimmingen`, fase
  Build, `beschikbareTijd` 30 en `klimType` "kort" levert na de bouw de categorie-tak in
  plaats van `vo2max` uit de dode tak. Die assertie is per constructie rood zonder de
  verwijdering.

## 10. WAT NIET IN DEZE BOUW ZIT

- Punt 9 (het doel stuurt de fase niet). De fase blijft volledig uit `eventFase_` komen.
  GEMETEN gevolg dat blijft staan: in Base levert ook `klim_kort` nul anaerobe minuten,
  want `GOAL_FASE_MOD_.Base` drukt de vo2-intent omlaag. Half februari 2027 wisselt de fase
  naar Build EN het doel naar korte beklimmingen, dus in de praktijk vallen die samen.
- Punt 11 (durability-meetlat) en punt 12 (doel-passendheid).
- `DOELEN-SPEC` §3.3 beschermt zowel de intervalsessie als de lange rit. Bij vijf uur per
  week passen die twee niet allebei; dat hoort de coach te zeggen (M40) en dat is punt 12,
  niet punt 7.
