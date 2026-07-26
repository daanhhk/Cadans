# FTP als meetreferentie — recon

Meetronde 26-07-2026: code-recon in de chat (Cadans @ `0d547b7`, GAS @ `3e8090a`) plus twee
read-only SELECT-rondes op remote D1. Geen code gewijzigd, geen mutatie.

## 1. De openstaande bevinding bestaat niet

GEMETEN: `settings.ftp` = 280, en `activities.ftp` (= `icu_ftp`) = 280 op de drie ritten sinds
21-07-2026. Cadans en intervals.icu lopen dus GELIJK, niet uiteen. Het gat van −18 zat tussen de
instelling (280) en `activities.rolling_ftp` (262), en dat zijn twee verschillende grootheden:
`rolling_ftp` is intervals' eFTP uit de vermogenscurve — een rollend maximum dat wegzakt zodra er
geen maximum-zettende inspanning meer gereden wordt, óók zonder verlies van vermogen.

De post "de ingestelde FTP klopt niet meer" is GESLOTEN. BESLUIT: geen FTP gewijzigd.

## 2. Welke FTP raakt welke consument

De INGESTELDE ftp raakt uitsluitend twee dingen: de wattgetallen in de workoutblokken
(`wattsRange`, engine) en de W/kg-kant van de Niveau-tab (`currentFtp = settings.ftp ?? eftp`).

Hij raakt NIET: TSS (`activityToRow_` idx8 = `icu_training_load`), IF (idx7 = `icu_intensity`),
CTL/ATL/vorm (`wellness.ts` neemt `w.ctl`/`w.atl` letterlijk over), gemeten zoneminuten (idx15 =
`icu_zone_times`, zeven kant-en-klare buckets), en de GEPLANDE TSS (`tssFromZoneMinutes_` = vaste
tarieven 0,7 / 0,95 / 1,05 per zoneminuut, FTP-vrij).

Ook de Garmin-push niet: `buildWorkoutZwo_` schrijft PROCENTEN — `dslPowerRange_` deelt de watts
door dezelfde ftp waarmee ze geschreven zijn, dus de deling valt weg en Garmin past er zijn eigen
FTP op toe.

GEVOLG: "zonegrenzen te hoog dus TSS en CTL te laag" gold nooit voor de ingestelde waarde. Wat de
meters stuurt is de FTP die INTERVALS gebruikt, en die staat per rit in D1 als `activities.ftp`.

## 3. `ftpAutoUpdate` is dood in Cadans

`settings.ftp_auto_update` = NULL (nooit gezet). De kolom staat in `workers/api/src/db/schema.ts`
en in migratie `0000` en wordt in de hele repo nergens gelezen of geschreven; er is geen
athlete-autocast geport. `settings.ftp` wordt uitsluitend via `PUT /api/settings` geschreven.

GAS draagt het mechanisme wél (`Sync.gs` `syncAthleteFromIcu`, wekelijkse trigger): bij vlag aan
schrijft het `sportSettings[Ride].mmp_model.ftp` — intervals' MODEL-schatting, vandaag circa 262 —
stil in Settings, met grenzen 100-500; default `false`. NORM bij een eventuele port:
voorstel-met-bevestiging, nooit stil (M10/M11). Een stille autocast hangt elk voorgeschreven
wattgetal aan een wegzakkende schatting.

## 4. `icu_ftp` is per SPORT, niet één tijdlijn

Gemeten over 250 ritten (210 met `icu_ftp`, 40 zonder — niet-fiets of leeg):

- Ride 270 · 95 rijen · 2025-07-17 tot 2025-12-19
- Ride 275 · 97 rijen · 2025-12-21 tot 2026-07-20
- Ride 280 · 3 rijen · 2026-07-21 tot 2026-07-25
- VirtualRide 260 · 14 rijen · 2025-10-04 tot 2026-02-18
- Ride 260 · 1 rij · 2025-08-21 (duur 0, TSS leeg — kapotte rij, geen tegenvoorbeeld)

De 260 loopt PARALLEL aan 270 en 275, niet erna: het is intervals' aparte indoor-drempel. Bedoeld
gedrag, geen drift.

## 5. Wat wél drift is, en wat dat voor de ijking betekent

De buitenlijn beweegt: 270 → 275 (21-12-2025) → 280 (21-07-2026). De Z4-ondergrens (91% FTP) liep
daarmee van 245,7W via 250,3W naar 254,8W; dezelfde rit levert bij 280 circa 3,5% minder TSS dan
bij 275 en circa 7% minder dan bij 270.

Voor stap 5a valt dat GUNSTIG uit: beide sprongen liggen buiten het ijkvenster (275 kwam vóór
19-01-2026, 280 ná de gemeten blokweken), dus het venster ligt vrijwel geheel op één lat. Drie van
de 27 ijkweken dragen een indoor-rit op 260 (22-01, 11-02, 16-02 plus 18-02) en tellen tegen een
5,5% lagere drempel iets ruimer mee — klein, richting bekend: eerder te ruim dan te krap. De norm
van 84 blijft staan.

VOORUIT: vanaf de week van 20-07-2026 wordt op 280 gemeten. Dezelfde rit levert minder hoge
minuten dan in het ijkvenster. Niet ongeldig, wel een sprong die bij een herijking genoemd hoort
te worden.

## 6. Consequentie voor stap 5b

`rolling_ftp` staat in ABSOLUTE watts en is als enige grootheid in de stapel immuun voor een
instellings-wijziging: TSS, CTL en zoneminuten bewegen mee met de FTP-instelling, `rolling_ftp`
niet. Dat is een ZELFSTANDIG argument voor de keuze uit `EFFECT-REFERENT-RECON.md` §5 om de
effect-vraag op `rolling_ftp` te beantwoorden, naast "de reeks is niet monotoon".
