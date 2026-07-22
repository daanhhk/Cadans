# FASE-C — Workout-push naar Garmin (via intervals.icu) — RECON

Read-only recon. Bron: bevroren GAS @ `3e8090a` + de gecommitte Cadans-engine.
Status: **findings + open vragen — GEEN bouw.** Daan reviewt dit doc (gepinde RAW
URL) en beantwoordt de open vragen VOOR er ook maar iets gebouwd wordt.

Dit is cutover-poort (a): zolang Cadans geen workouts kan pushen blijft GAS live.

---

## OPEN VRAGEN VOOR DAAN (push-kanaal eerst)

**V1 — PUSH-KANAAL (bevestiging).** De recon toont: GAS pusht via de
**intervals.icu REST API** (`POST /athlete/{id}/events/bulk?upsert=true`), en
intervals.icu zet de ZWO om naar structured FIT die via jouw bestaande
intervals->Garmin-koppeling bij de Epix belandt. Er is GEEN directe
Garmin-integratie in GAS (geen Garmin-OAuth, geen Garmin-API). Bevestig je dat
Cadans hetzelfde kanaal gebruikt, of had je een directe Garmin-push in gedachten?
> Advies: intervals.icu-route 1-op-1 — werkt al voor je, geen OAuth, geen extra
> integratie. De Garmin-kant is jouw bestaande koppeling (buiten de app).

**V2 — ARCHITECTUUR: client-driven vs server-driven push.** Het voorstel wordt
NIET gepersisteerd (regenereert elke render) en de orchestratie
(`buildWeekProposal`/`deriveSchemaView`) leeft UITSLUITEND client-side — de worker
kent ze niet.
- Optie B (LICHT): de client heeft de actieve sessies al (incl. overrides /
  fatigue-shift / debt) via `deriveSchemaView`; hij stuurt
  `[{dateISO, type, sessions:[SchemaSession...]}]` naar `POST /api/push`; de worker
  assembleert ZWO + pusht. Weinig code, geen duplicatie, "waarheid" = precies wat
  je ziet. Nadeel: grotere body; worker vertrouwt de client-payload (prima voor v1).
- Optie A (ZWAAR): de worker regenereert het voorstel — vereist het porten van de
  hele client-side proposal-laag (override-merge, fatigue-shift, debt, readiness)
  naar de worker = grote klus + dubbele code.
> Advies: Optie B. Enige route die past bij "voorstel regenereert, leeft
> client-side" zonder de orchestratie te dupliceren.

**V3 — ASSEMBLER-WRAPPERS: engine of worker?** De ZWO/DSL-wrappers
(`buildWorkoutZwo_` / `buildWorkoutDsl_` / `buildWorkoutDescription_`) zijn puur en
zouden naast de al-geporte primitieven in de engine kunnen (byte-faithful
GAS-mirror, selftest-borging) — maar dat vereist expliciete engine-autorisatie +
een selftest-vloer-stijging. Alternatief: in de worker (geen engine-touch, maar de
wrappers staan dan los van hun primitieven).
> Advies: engine. De primitieven staan er al; de wrappers horen ernaast en de
> selftest borgt de ZWO-XML byte-exact. Kost een engine-autorisatie.

**V4 — FOUTAFHANDELING.** GAS geeft per HTTP-status leesbare NL-errors
(401 key-fout / 403 / 404 athlete / 429 rate-limit / 5xx); de huidige Cadans
sync-routes geven een generieke 502. De push-UI toont de fout aan jou.
> Advies: gedetailleerd (zoals GAS) — je wilt onderscheiden of het een key-fout
> (401) of rate-limit (429) is.

**V5 — STALE-EVENT-OPRUIMING.** GAS ruimt eerder-gepushte events NIET op als een
dag uit de push verdwijnt (bijv. naar rust gezet) — het upsert alleen; het verweesde
intervals-event blijft staan tot je het handmatig wist. Parity = niet opruimen.
> Advies: parity (niet opruimen) voor v1; opruimen is een aparte latere laag.

**Kleinere bevestigingen (default tenzij je anders wilt):**
- Alleen toekomstige, niet-gedane dagen pushen, incl. vandaag als die nog niet
  gedaan is? (GAS: toekomst incl. vandaag.)
- Type = 'Ride' voor alle workouts (fietscoach)? (GAS: ja, hardcoded.)
- Idempotente `external_id = coach_<dateISO>_<type>[_s<n>]` 1-op-1? (Ja.)
- FTP voor de watt->%-conversie: worker leest `settings.ftp` uit D1 (single source,
  matcht de FTP waarmee de client de watt-ranges al berekende)? Advies: ja.

---

## 1. HET PUSH-KANAAL (bewijs uit de bron)

De keten in GAS:

    pushWeb() / pushAllPendingWorkouts()   (WebApp.gs:1607 / Sync.gs)
      -> pushAllPending_(ss)               (Sync.gs) — pakt toekomstige train+!gedaan dagen
        -> readDaySessions_(dateISO)       (Algorithm.gs:733) — leest voorstel uit DocProps
        -> buildEventPayload(wo, dateISO, 'Ride', idx, count)   (IntervalsApi.gs:165)
          -> buildWorkoutZwo_(workout)     (Algorithm.gs:1721) — primary: ZWO-XML
             (fallback: buildWorkoutDsl_ -> DSL in description; dan plain text)
        -> pushEvents_(events)             (IntervalsApi.gs:230)
          -> POST /athlete/{id}/events/bulk?upsert=true   (intervals.icu)

intervals.icu ontvangt de ZWO als `file_contents_base64` op een WORKOUT-event en
zet dit om naar structured FIT. Garmin (Epix) krijgt de multi-step workout via de
BESTAANDE intervals.icu<->Garmin-sync (buiten de app; jouw account-koppeling).
=> Cadans hoeft ALLEEN met intervals.icu te praten. Geen Garmin-code.

## 2. AUTH (al opgelost in Cadans)

GAS (IntervalsApi.gs:30): HTTP Basic, username LETTERLIJK `API_KEY`, password = de
key. Key uit PropertiesService (`INTERVALS_API_KEY`); athlete-ID uit DocProp
`intervals_athlete_id` (geen secret — publieke "i12345"-identifier).

Cadans HEEFT dit al (voor de read-sync, draait in prod):
- `env.INTERVALS_API_KEY` (secret) + `env.INTERVALS_ATHLETE_ID` (env-var).
- `intervalsBasicAuth(apiKey)` (intervals.ts:18) = `Basic btoa("API_KEY:"+key)` —
  byte-identiek aan GAS.
- `requireAuth(env, opts, fn)`-patroon (powercurve.ts:47) leest beide + throwt met
  leesbare error bij ontbreken.
=> GEEN nieuw secret nodig. De push hergebruikt de bestaande credential-infra.
   (Bevestig alleen dat `INTERVALS_API_KEY` remote gezet is — de read-sync draait
   in prod, dus vrijwel zeker ja.)

## 3. WAT AL GEPORT IS

- Assembler-PRIMITIEVEN in `packages/engine/src/zones.ts` (geexporteerd):
  DSL: `dslBlockFromRow_`, `dslPowerRange_`, `dslMidPct_`, `dslDurationSec_`,
       `dslRestFromNote_`.
  ZWO: `zwoStepFromRow_`, `zwoPct_`, `xmlEscape_`.
- Workout-structuur: `SchemaSession.structuur` = `string[][]`, 5-tuples
  `[label, duur, watt-range, hr-range, note]` — BYTE-IDENTIEK aan GAS' `row[0..4]`.
  De reps-vorm ("4x 5 min") matcht de assembler-regex. => primitieven werken 1-op-1.
- De client-sessie (`SchemaSession`) heeft ALLE velden die de assembler + payload
  nodig hebben: `naam`, `focus`, `zones`, `totaalMin`, `tss`, `structuur`,
  `eindopmerking`.
- UI-placeholder: `GarminPushButton` (ActionButtons.tsx:92) = `SoonButton
  label="Push naar Garmin"`, tab-niveau onderaan de Schema-tab (GAS Index.html:37).

## 4. WAT CADANS MIST (de bouw-scope)

1. ZWO/DSL-WRAPPERS (`buildWorkoutZwo_` / `buildWorkoutDsl_` /
   `buildWorkoutDescription_`): itereren over `structuur` -> volledige ZWO-XML /
   DSL-string / plain-text-fallback. Puur. Zie V3 (engine of worker).
2. EVENT-PAYLOAD-bouwer (`buildEventPayload`, IntervalsApi.gs:165): bouwt
   `{category:'WORKOUT', start_date_local, type, name (COACH_NAME_PREFIX +
   workout.naam), external_id, filename, file_contents_base64}`. Incl. sessie-uur
   `[7,17,12,19,6]`, `_s<n>`-suffix (n>=2), idempotente
   `external_id = coach_<dateISO>_<type>[_s<n>]`, ZWO-primary + DSL/description-fallback.
   Worker-laag.
3. PUSH-functie (`pushEvents_`): `POST /athlete/{id}/events/bulk?upsert=true` met de
   events-array + HTTP-error-vertaling (zie V4). Worker-laag (naast intervals.ts).
4. WORKER-ROUTE `POST /api/push`: leest auth uit env + FTP uit D1-settings, ontvangt
   de te-pushen sessies, assembleert + pusht, geeft `{pushedCount, skipped, errors}`
   terug (spiegelt GAS' `pushAllPending_`-retour). Registreren in `api.ts` (Hono).
5. CLIENT-KANT: de placeholder `SoonButton` vervangen door een echte knop die de
   toekomstige geplande sessies verzamelt (uit `deriveSchemaView`) + `POST /api/push`
   aanroept (via `api.ts`) + de uitkomst toont (toast/alert, incl. skipped/errors).

## 5. DE ARCHITECTUUR-KEUZE (V2, uitgewerkt)

GAS persisteert het voorstel in DocProps (`proposal_<dISO>` via `writeDaySessions_`)
en de push LEEST dat (`readDaySessions_`). Cadans persisteert `proposal_*` NIET
(conventie: regenereert) en de orchestratie leeft client-side. Daarom kan de worker
niet zomaar "het voorstel lezen".

- Optie B (client-driven, ADVIES): client -> `POST /api/push` met de sessies; worker
  assembleert + pusht. De client heeft de ACTIEVE sessies (na overrides /
  fatigue-shift / debt) al klaar in `deriveSchemaView` — precies wat je op de
  Schema-tab ziet, dus precies wat gepusht hoort te worden.
- Optie A (server-driven): worker regenereert -> port van `buildWeekProposal` +
  `deriveSchemaView` + de override-/fatigue-/debt-/readiness-laag naar de worker.
  Grote klus, dubbele code, hoog regressie-risico.

## 6. FTP-NUANCE (voor de bouw)

De `structuur`-rijen dragen ABSOLUTE watt-ranges (bijv. "150-200W"). De assembler
(`dslPowerRange_`) deelt door FTP om % te krijgen (ZWO wil decimaal, bijv. 0.55).
=> de FTP die de worker gebruikt MOET dezelfde zijn als waarmee de client de watts
berekende. Beide lezen `settings.ftp` uit dezelfde D1 => match. Advies: worker leest
`settings.ftp` uit D1 (single source); geen FTP via de body nodig.

## 7. SECRET / MIGRATIE-STATUS

- GEEN nieuw secret (hergebruikt `INTERVALS_API_KEY` + `INTERVALS_ATHLETE_ID`).
- GEEN D1-migratie voor de push zelf (leest bestaande `settings.ftp`; athlete-ID
  blijft env-var voor v1). Zou de athlete-ID naar settings verhuizen -> migratie;
  niet nodig voor v1.

## 8. VOORGESTELDE BOUW-FASERING (na Daans antwoorden, elk STOP-en-verifieer)

- C1 — wrappers (`buildWorkoutZwo_`/`buildWorkoutDsl_`/`buildWorkoutDescription_`)
  op de plek uit V3; unit-tests + (indien engine) selftest-vloer.
- C2 — payload + push in de worker (`buildEventPayload` + `pushEvents_` +
  error-vertaling) + `POST /api/push`-route + route-tests tegen een gemockte fetch.
- C3 — client: `GarminPushButton` echt maken + `api.ts`-call + resultaat-UI.
- C4 — end-to-end: één echte push naar jouw intervals.icu-kalender (approval-gated:
  het is een write naar een externe dienst; jij triggert 'm), verifieer de FIT ->
  Garmin-sync.

Elke fase: gate (pnpm lint+typecheck+test+build --frozen-lockfile) + CI groen; de
engine blijft read-only tot je C1-engine expliciet autoriseert; vloeren mogen niet
regresseren.
