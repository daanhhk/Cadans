# Trainingsmodel - BESLUITEN (review-chat, juli 2026)

Status: besluiten-log, GEEN model-document. docs/TRAININGSMODEL.md IS hieruit
geschreven (juli 2026) en is de norm; dit bestand blijft het log en het bewijs. Dit bestand is de bron; vat het niet samen, citeer het.

## Norm-omslag (wijzigt de werkwijze)
GAS is de REFERENTIE, niet de NORM. Bron van waarheid over wat GAS DOET - dus altijd
de bron lezen, nooit uit geheugen. Maar drie normen naast elkaar:
- Front-end / vormgeving -> GAS is norm. Ongewijzigd.
- Infra (parsers, sync, datums, row-mapping, zone-extractie) -> parity is norm. Drift = bug.
- Trainings-laag -> coaching-deugdelijkheid is norm. GAS is daar herkomst, geen gezag.
De harness is een SORTEERMACHINE, geen rechter.

## STAANDE REGEL - privacy
GEEN persoonlijke trainingsdata in de publieke repo (daanhhk/Cadans is PUBLIEK).
Bevindingen wel, data niet. Analyse-scripts en ruwe uitvoer BUITEN de repo-tree.
Committen is onomkeerbaar (git-history, forks, indexering). Bij twijfel: niet.

## Doel van de app
De beschikbare tijd van de gebruiker zo goed mogelijk benutten door de best mogelijke
trainingen voor te schotelen. Doelfunctie = RENDEMENT PER BESCHIKBAAR UUR.
Positionering: JOIN optimaliseert retentie -> conservatief. Dit optimaliseert opbrengst
per uur. Specifiek en universeel tegelijk: werkt bij 3 uur, werkt bij 15.

## Doelgroep
De amateurfietser die zijn tijd efficient wil benutten en beter wil worden.
NIET begrensd door leeftijd of volume. WEL door wat de app kan zien: vermogensmeter,
intervals.icu, gestructureerd trainen, een doel.
Zones kunnen op HR: actualZoneMinutes_ (zones.ts:17-22) probeert vermogen, valt terug op
tryHrZoneTimes_. Voorschrijven toont bpm (bpmRange/archBpm_ op lthr). MAAR: FTP/eFTP ->
TSS -> CTL/ATL/TSB is vermogen-only. Het BELASTINGSMODEL is de grens, niet de zones.
HR-only is geen modus. Benoemen met die reden -> later een afgebakende klus.

## De vijf doelen (vervangt DOEL_OPTIONS)
1. FTP verbeteren
2. Conditie verbeteren = LANGER KUNNEN DOORRIJDEN (duurvermogen)
3. Lange klimmen verbeteren
4. Korte klimmen verbeteren (slikt VO2max op)
5. Onderhouden = MAXIMAAL FTP-BEHOUD BIJ MINDER UREN
VO2max verdwijnt als DOEL, blijft als MIDDEL. Pools NIET slopen - korte-klimmen leunt erop.
Huidig: DOEL_OPTIONS = FTP/Conditie/Beklimmingen/VO2max/Onderhoud (phase.ts:12).
klimType (lang/kort) komt alleen binnen via een EVENT (planner.ts:697, :862) -> zonder
event kun je niet zeggen welke klimmen. De splitsing repareert die asymmetrie.

## Intensiteits-filosofie
PIRAMIDAAL als norm; sweet-spot als ruggengraat bij weinig uren.
Polarized pas vanaf ~8-10u/week. Dat getal is COACH-HEURISTIEK, geen bevinding - zo
labelen, niet als wetenschap vermommen.
Onderbouwing: Seiler's polarized komt van elite-observaties bij 15-30u/week. Meta-analyses
vinden geen duidelijke superioriteit boven piramidaal/drempel. Wielren-observationeel
(van Erp, Sanders) toont overwegend piramidaal. 80/20 van 6u = 1,2u hard = geen dosis.

## Agency - EEN regel
De app STELT VOOR, de gebruiker BEVESTIGT, en de app zegt altijd WAAROM.
Bij demote: origineel blijft zichtbaar, suggestie ernaast, vraag (doorpakken of afgezwakt),
gebruiker keurt goed.
DEFAULT: het ORIGINEEL blijft staan tot de gebruiker kiest.
Coach-tekst legt de REDENERING uit, geen voorspelling. Vorm: "dit was de beste training,
we zien dat je lichaam het wat zwaarder heeft door een dip in HRV en slaap, wellicht heb
je meer behoefte aan deze training." Het woord "wellicht" MOET blijven staan - zie de
readiness-meting hieronder; dat woord is empirisch verdiend.
Principe: DE CIJFERS WETEN HET NIET. HRV/slaap/readiness zijn ruis-gevoelige proxies; de
renner heeft informatie die het model niet heeft.
GEVOLG: de automatische band-gedreven week-demote is een DEFECT onder deze norm, geen
bewuste divergentie. Dubbel: hij neemt instemming weg EN leunt op een onbewezen premisse.
Plan-transities (doel -> event): coach stelt de wissel voor, gebruiker beslist.

## Capaciteit
Capaciteit = GEDECLAREERDE LIMIET, eigen veld, los van het weekplan. profielPreset is een
volume-preset, geen limiet. Zonder dit veld bestaat de "onder je limiet"-regel niet.
Zondag-prompt: vraag om volgende week in te vullen; bij invullen melding als de gebruiker
onder zijn limiet zit. Trigger = PWA-pushmelding = NIEUWE INFRA, geen engine-werk.
Capaciteit zakt (kind, winterdip) -> gebruiker schakelt ZELF naar Onderhoud en verlaagt
zijn uren. Onderhoud is een ANTWOORD OP CAPACITEIT, geen periodiseringsfase.
Beschikbare tijd is de PRIMAIRE input en is NIET afleidbaar uit data (deed != kon).
weeklyHoursRecent_ meet wat je deed -> leid je het plafond daaruit af, dan bak je het
plateau in. De weekplanner is intentie = de belangrijkste sensor van het model.
AMENDEMENT (uit de historie-analyse): data mag de limiet niet BEPALEN, maar wel
TEGENSPREKEN als hij te laag staat. Daans beste AGR's kwamen uit aanlopen van 9,25 u/week
tegen een gedeclareerd plafond van ~6-7. Een limiet die de historie structureel onderschat
is zelf een bevinding.

## Cutover-regel
Poort = GEEN FUNCTIONELE REGRESSIE T.O.V. GAS.
Bijna alles wat we vonden is GEERFD, niet geintroduceerd (Onderhoud->Base staat
byte-identiek in GAS). De cutover maakt niet slechter - hij maakt fixbaar.
Echte regressies: (1) auto-demote (GAS bood aan), (2) Garmin-push (GAS heeft hem).
Modelfixes NA cutover, op het platform waar ze testbaar zijn.
TWEEDE AS: urgentie != blokkerend. Onderhoud->Base moet weg voor de winterdip,
ongeacht waar de cutover dan staat.

## Multi-user (benoemen, later uitrollen)
Meerdere users aanmaken; intervals-API-gegevens bij ONBOARDING (een flow - NIET het
instellingen-menu; instellingen is waar je het later wijzigt).
Per-gebruiker API-sleutels = credentials met volledige accounttoegang bewaren. Voor een
commercieel product het verkeerde model. OAuth is vermoedelijk de route - TE VERIFIEREN,
niet aannemen. Nu: CURRENT_USER_ID=1, geen auth, een sleutel.

## Vondsten (regelnummers - te bevestigen in R2)
1. effectiveMacroFase_ (planner.ts:87; GAS Algorithm.gs:71 BYTE-IDENTIEK incl. comment):
   doel=Onderhoud -> macroFase gepind op "Base". keyIntensity levert alleen in Build/Peak
   een doel-gedreven kwaliteitsdag -> Onderhoud = zacht trainen = precies verkeerd voor
   FTP-behoud. Docstring toont dat het een LOODGIETERS-FIX was (allocActive/missing-key),
   nooit een trainingsbeslissing. Call-site: apps/web/src/lib/proposal.ts:212.
   HET EXEMPLAAR: harness zegt IDENTIEK, selftest groen, vuurt precies bij een winterdip.
2. long_z2 is een RESTPOST: planner.ts:609 (weekend-default), :672/:680/:728 (fallback),
   :792 (demote-target). Duur komt uit de beschikbaarheids-slider. maxRecentRideH_ is
   DISPLAY-ONLY (Niveau.tsx:127) - de planner leest hem niet. Een bewuste prikkel wordt
   als opvulling behandeld. Blijft een ontwerpfout, ONAFHANKELIJK van Daans eigen geval.
3. Conditie (=duurvermogen) is het ENIGE doel dat de engine structureel niet kan bedienen:
   geen duurvermogen-maat (CTL/TSB zeggen er niets over) + long_z2 als restpost.
4. Garmin-push: HANDOFF's "extern device-traject" is FOUT. GAS POST naar intervals.icu
   (buildEventPayload IntervalsApi.gs:165 -> pushWorkout :222 -> pushAllPendingWorkouts
   Sync.gs:528), ZWO base64 -> intervals.icu maakt FIT -> Garmin. Bladeren GEPORT
   (zwoStepFromRow_/zwoPct_/xmlEscape_/dsl* in zones.ts), ASSEMBLERS NIET
   (buildWorkoutZwo_ Algorithm.gs:1720, buildWorkoutDsl_ :1591, sanitizeFilename_,
   buildWorkoutDescription_, buildEventPayload, pushWorkout). Knop = SoonButton
   (ActionButtons.tsx:93). ZWO-route (primair) is NIET oracle-gedekt; dsl* (fallback) wel.
   -> audit de push-keten VOOR bedrading.
5. loadCarryFactor_ (Algorithm.gs:2038) NIET geport; mesoFactor mist de vermenigvuldiger
   -> geneutraliseerd op x1. D1 heeft wel load_carry (schema.ts:227). = debt (b), open.
6. getGewicht: GAS valt terug op SETTINGS_DEFAULTS.gewicht; Cadans-provider doet
   settings?.gewicht ?? 0. setGewichtProvider alleen op het Niveau-pad (lib/niveau.ts:55,
   pages/Niveau.tsx:98) - proposal-pad te checken.
7. formatDate: GAS gebruikt Utilities.formatDate (platform-API), Cadans herimplementeert
   -> platform-shim met eigen bewijslast.
8. Sensoren GEBOUWD maar NIET AANGESLOTEN: disposition-reden-kiezer (A2) -> agenda-vs-benen;
   expectedRpe_ vs werkelijke RPE (A3) -> intensiteits-appetijt. Zelfde vorm als long_z2:
   geen nieuwe bouw, bedrading.
9. Amstel-datum: Toerversie = ZATERDAG 17-04-2027. Op prod staat 2027-04-18 (= profzondag).
   BEVESTIGD door Daans eigen historie: al zijn AGR's waren zaterdagen (09-04-2022,
   15-04-2023, 13-04-2024, 19-04-2025, 18-04-2026).

## Historie-analyse (n=1, observationeel, GEEN oorzaak - alleen associatie)
Bron: intervals.icu, 739 ritten met vermogen. Ruwe data en scripts BUITEN de repo.

READINESS-FALSIFICATIE (de belangrijkste meting):
getReadinessScore_ over de wellness-historie; uitkomst-proxy icu_rpe op 350 ritdagen,
plus RPE-residu tegen IF-bins. Zonder controle: ready RPE 3,91 / residu +0,06 (n=246);
caution 3,66 / -0,22 (n=71); rest 3,82 / +0,01 (n=33). Gemerkte dagen gingen NIET slechter
- eerder marginaal lichter. Met controle op TSS-gisteren (drempel 100): gisteren licht
(n=315) ready 3,96 vs gemerkt 3,72; gisteren zwaar (n=35) ready 3,26 vs gemerkt 3,69 -
alleen die piepkleine groep draait om, n te klein.
CONCLUSIE: geen consistent "slechtere sessie"-effect; richting nul tot omgekeerd; overleeft
de controle niet.
NIET-BESLISSEND, drie redenen die het document eerlijk moet noemen: (a) RPE is een zwakke
maat voor verminderd vermogen - je kunt je beroerd voelen, zacht rijden, en RPE ziet er
prima uit; (b) circulariteit - de app demote'de, dus de sessie WAS lichter (het residu
vangt de intensiteit, niet de keuze om zacht te rijden); (c) je kunt de waarde van een
opgevolgde waarschuwing niet meten.
VERDICT: readiness verhuist van BESLISSER naar INFORMANT. De bewijslast ligt nu bij
readiness. Betere toets voor later: vermogen bij gelijke RPE, of afgemaakt-vs-voorgeschreven
vermogen - niet RPE zelf.

DUURVERMOGEN-CURVE:
Beste 3-min/5-min per voorafgaande-kJ-bak, als % van de [0-500)-referentie:
500-1500 = 91,0%/96,2% (n=647/636); 1500-2500 = 89,7%/89,4% (n=58/56); 2500+ =
90,2%/87,9% (n=14). Jaartrend 5-min bij 2500+ (2023->2026): 88,6/88,1/83,2/87,9 - stabiel.
~10-12% terugval bij hoge kJ. Voor een amateur respectabel. AGR ~ 3500-4000 kJ.
KANTTEKENING: n=14 in de diepe bak, en "beste 3-min op 2500 kJ" vereist dat hij daar vol
ging - dit is geen gecontroleerde test.
INGETROKKEN: een eerdere kwart-1-vs-kwart-4-opzet mat PACING, geen duurvermogen (in een
fondo rijd je Q1 gecontroleerd en de zwaarste Limburgse hellingen liggen laat). Die
uitkomst (Q4 >= Q1 in alle jaren) bewijst NIETS. Niet hergebruiken.

AANLOOP (12 wk voor elke AGR):
9,25 u/week -> 159W (2026, beste); 7,6 -> 151W (2022); 6,8 -> 149W (2024); verstoorde
aanloop met piek-CTL 35,6 -> 131W (2025, ziekte-gat). Monotoon, n=4.
TOTALE BELASTING voorspelde de AGR's; een losse lange rit deed dat NIET.
INGETROKKEN: de claim dat Daans lange rit zijn schaarste-bron en kernprobleem was. Die was
theorie-gedreven en overleeft zijn eigen historie niet. Vondst 2 en 3 blijven wel staan -
die gaan over de engine, niet over Daan.

## Review-meting (chat-side feasibility-probe - CC bouwt R0 opnieuw met verantwoorde regels)
- Selftest = BEWEZEN-COMPLETE transcriptie van GAS' oracle: alle 50 runSelfTest-suites
  aanwezig; statische assert-call-counts per suite IDENTIEK (528 <-> 528); +71 uit 11
  Cadans-only suites (Fase-1a wellness/readiness). -> port-correctheid is al bewezen
  precies zo ver als GAS het zelf bewees. Oracle-gedekt != correct: bewijst PADEN, geen fns.
- Risico-matrix (transitieve closure over de call-graph): 214 engine-exports, reach* 179,
  cov* 194. Reachable EN niet-oracle-gedekt = 3: TZ, DEKKING_MIN_MIN, setGewichtProvider.
- AST-equivalentie HAALBAAR: TS-compiler-API parst .gs (als JS) + .ts; TypeNodes/parens/
  var-kind strippen -> canonieke AST-string. Ruwe run: 158 naam-matches, 97 AST-identiek
  (61%), 61 afwijkend. Met extra regels (template<->concat, arrow<->function-expr,
  optionele params, var-splitsing) stijgt dat.
- Harness NIET in CI: zou de engine voor eeuwig aan GAS vastvriezen. Wel reproduceerbaar
  onder tools/audit/. Elke equivalentie-regel krijgt een regel onderbouwing en de harness
  print welke regel op welke fn vuurde - Daan reviewt de REGEL-LIJST, niet de code.

## Route
R0 harness -> R1 FASE-B port-correctheid -> R2 end-audit op de matrix -> R3 trainings-review
tegen het model -> R4 verdict-doc met "cutover-blokkerend ja/nee" per item.
Verdict-criterium: toets aan het MODEL, niet aan GAS. Drie normen naast elkaar.
GEEN engine-wijziging in de hele review. Findings -> verdicts -> aparte bouw-chats.

## Open
- docs/TRAININGSMODEL.md GESCHREVEN (juli 2026): de norm, regels M1-M61 met statuslabels.
  Dit bestand blijft de bron voor de afleiding; het model verwijst hierheen.
- Duurvermogen: de vraag "zakt zijn klimvermogen weg" is DEELS beantwoord (~10-12% bij
  2500+ kJ, dunne bak). Niet als "geen probleem" lezen.
- Open-source vs commercieel: Scope B (open-source, geen backend) bijt met "fundering voor
  een commercieel product"; Cadans' schema is wel multi-tenant-klaar. NIET beantwoord.
- "Dit doel past niet bij deze uren" - de app kan dat niet zeggen, volgt wel uit de norm.
- Week-demote vs dag-demote onder de nieuwe agency-regel: niet uitgewerkt.
- Capaciteit-veld, zondag-prompt en push-infra: benoemd, niet ontworpen.
- Readiness: als de bewijslast niet wordt ingelost, wat blijft er dan van de demote-keten
  over? Niet beantwoord - eerst een betere uitkomst-maat.

## Testcase: Daan (invoerwaarden, GEEN regels)
FTP 280 / eFTP 265 / 75 kg / CTL ~47 / ~6u per week, gedeclareerd plafond ~preset+1u -
maar historisch reed hij 9,25 u/week in zijn beste aanloop.
Agenda is de grens, niet de benen. Intensiteits-appetijt: gemiddeld+, JOIN voelt te soft.
Doel nu FTP -> onderhoud -> Amstel. A-event: AGR Toerversie 125/150 km, 17-04-2027.
Doel op de dag: STERK OVER DE HELLINGEN BLIJVEN (niet uitrijden, niet racen).
Lange rit 4u+: 1x per maand, en pas vanaf maart (winter = mix binnen/buiten).
Rijdt de AGR elk jaar en komt er keurig doorheen. Duurvermogen ~10-12% terugval bij hoge
kJ = respectabel. Zijn lever is TOTALE BELASTING, niet de losse lange rit.
