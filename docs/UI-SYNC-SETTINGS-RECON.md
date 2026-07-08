# RECON — Sync-trigger (i) + Settings-invoer (ii) UI-gaps

Read-only bevindingen: de twee UI-gaps die "data in de app" blokkeren. Remote D1 is nu leeg → de
app toont "—" tot (a) een sync data uit intervals.icu haalt en (b) een settings-PUT FTP/gewicht zet.
GEEN feature-code in deze recon; enkel dit doc.

## DEEL A — Sync-trigger (i)

### A1. Het ververs-icoon op de Schema-tab
- **Component:** `apps/web/src/components/schema/WeekLoad.tsx:84-127` — een `<button type="button">`
  met `aria-label="Werk week bij"` / `title="Werk week bij"` en een circular-arrow-SVG (regels
  105-125). `onClick={onRegen}`, `disabled={regenerating}`, `opacity 0.5` tijdens regenerating.
- **Wiring:** `SchemaView.tsx:65-71` geeft `onRegen`/`regenerating` door aan `WeekLoad`. De props komen
  uit `pages/Schema.tsx:115` → `onRegen={() => setNonce((n) => n + 1)}` + `regenerating={regenerating}`.
- **Wat het NU doet:** `Schema.tsx:25-46` — `useEffect(…, [nonce])` draait `loadSchemaWeek()` opnieuw.
  Dat is een **client-side her-derivatie** uit reeds-gesyncte D1-data (deterministisch). De klik
  POST'T **NIET** naar `/api/sync/*` → nieuwe data uit intervals.icu wordt nooit opgehaald. Commentaar
  bevestigt: `Schema.tsx:17` "De regenereer-knop draait loadSchemaWeek opnieuw (deterministisch →
  ververst)."
- **GAP:** het icoon "ververst" enkel de berekening, niet de brondata. Een echte sync ontbreekt.

### A2. API/fetch-laag in apps/web
- **Centrale client:** `apps/web/src/lib/api.ts`. `apiGet<T>(path)` (`:33`) = relatieve `/api`-fetch +
  `ApiError`-envelope (`@cadans/shared`). GET-helpers: `getSettings/getWellness/getActivities/
  getPlanner/getEvents/getRpe/getWeekplans/getPowerCurve/getCheckin`.
- **Enige mutatie-helper:** `putCheckin` (`:94`). **Er is GEEN `postSync*`- en GEEN `putSettings`-
  helper.** `POST /api/sync/*` wordt **nergens** in apps/web aangeroepen.

### A3. De drie sync-routes (workers/api/src/routes/api.ts)
Alle drie **POST**, ambient global fetch, `athleteId` uit `c.env.INTERVALS_ATHLETE_ID`. Bad param
gooit BUITEN de try → **400** vóór enige fetch; upstream niet-2xx → **502** "intervals sync failed".
- **`POST /api/sync/activities`** (`:240`): query `?days=` (`parseDays`, `:51` — integer 1..365, anders
  400; weggelaten → `{}` → engine-default `daysBack`). Succes **200** → `{ fetched, upserted }`
  (`intervals.ts:114`).
- **`POST /api/sync/wellness`** (`:255`): idem `?days=`. **200** → `{ fetched, upserted }`
  (`wellness.ts:118`).
- **`POST /api/sync/power-curve`** (`:270`): query `?window=` (`parseWindow`, `:69` — alleen `90d`|`1y`,
  anders 400). **200** → `{ window, fetchedOn, cached }` (`powercurve.ts:110`).

### A4. Herbruikbaar loading/error/feedback-patroon
- **Container-patroon** (`Schema.tsx`): `loading` → "Laden…" (`:48-62`); `error` → melding +
  "Opnieuw"-knop (`:64-104`); `regenerating`-bool → icoon dimt/disabled. Nonce-reload (`setNonce` →
  `useEffect`). Zelfde patroon in `Vorm.tsx`/`Niveau.tsx` ("Opnieuw"-knop, nonce).
- **Mutatie-patroon** (dichtst bij sync/settings): `CheckinSheet.tsx:109-125` `submit()` — `saving`-
  state, `try { await putCheckin } catch { setError }`, knop disabled tijdens `saving`. Dit is het
  te spiegelen mutate-met-feedback-patroon.
- **UI-primitieven:** `components/ui` (`Card/Num/Overline`). GEEN toast/spinner-component (tekst
  "Laden…" + `disabled`/`opacity`).

## DEEL B — Settings-invoer (ii)

### B1. Settings-scherm/route
- **Bestaat NIET.** `App.tsx:14-22`: `/schema`, `/vorm`, `/trainingen` (`<ComingSoon tab="Trainingen"/>`),
  `/niveau`, `*`→`/schema`. `BottomNav.tsx:5-8`: schema/vorm/trainingen/niveau. Geen `/settings` of
  `/instellingen`, geen settings-pagina of -stub.

### B2. Settings-fetch-client
- **GET bestaat:** `getSettings()` (`api.ts:41`) → `apiGet<SettingsInput|null>("/api/settings")`.
  Gebruikt in `Vorm.tsx:28` + `Niveau.tsx:40` (read-only weergave).
- **PUT bestaat NIET** in de client (geen `putSettings` in `api.ts`).

### B3. Het type (letterlijk)
Wire-DTO `SettingsInput` — `packages/shared/src/settings.ts:10-24` — 12 velden, ALLE `| null`:
```
ftp: number | null;  lthr: number | null;  gewicht: number | null;
doel: string | null;  doelStart: string | null; // ISO "yyyy-MM-dd"
hrMax: number | null;  hrRest: number | null;  doelDuur: number | null;
fase: string | null;  profielPreset: string | null;
pendelDuurMin: number | null;  pendelAantal: number | null;
```
Worker-interne vorm `EngineSettings` (`repo.ts:43`) = `Omit<SettingsInput,"doelStart"> & { doelStart:
Date | null }`.

### B4. PUT /api/settings — volledige handler (api.ts:308-337)
- `readJsonObject` (`:79`) → **400** bij kapotte JSON / niet-object / array.
- Whitelist-passthrough: per bekend veld `if ("x" in body)` → `numField`/`strField` typeof-guard
  (verkeerd type → **400**). `doelStart`: moet string + `isIsoDate`, anders **400**. **Onbekende
  velden worden GENEGEERD.**
- `writeSettings(db, CURRENT_USER_ID, patch)` → **FULL-REPLACE**: `repo.ts:47-71` bouwt vals voor ALLE
  12 kolommen via `s.x ?? null` en doet `insert().onConflictDoUpdate({ target: userId, set: vals })`.
  → een **weggelaten veld wordt op `null` gezet** (gecleared).
- Succes → **200** `{ ok: true }`.
- **Expliciete null:** `numField(null)`/`strField(null)` → typeof mismatch → **400**; `doelStart:null`
  → **400**. Dus **expliciete null geeft al 400**.
- **required vs optional:** GEEN veld is verplicht — een leeg body `{}` is 200 en cleart álles naar
  null. Elk aanwezig veld wordt getypecheckt.

### B5. GET /api/settings (api.ts:122-126)
`readSettings` → `serializeSettings` (`doelStart` Date→`yyyy-MM-dd`) → `SettingsInput`-shape, of **`null`**
voor een verse user. Symmetrisch met PUT (dezelfde 12 velden) → schoon voor formulier-prefill.

### B6. Wire-DTO in packages/shared
`packages/shared/src/settings.ts` (`SettingsInput`), geëxporteerd via `packages/shared/src/index.ts:21`.

### B7. D1 settings-tabel (schema.ts:42-62)
PK `userId` (FK → `users.id`), alle overige nullable:
```
ftp, hrMax, hrRest, lthr: integer;  thresholdPace: text;  doel: text;
doelStart: text;  doelDuur: integer;  fase: text;  gewicht: real;
profielPreset: text;  pendelDuurMin, pendelAantal: integer;
ftpAutoUpdate, weightAutoUpdate: integer (0/1 bool);  emailDigest: text;
```
**4 kolommen** (`thresholdPace`, `ftpAutoUpdate`, `weightAutoUpdate`, `emailDigest`) zitten NIET in
`SettingsInput`/`EngineSettings` → niet lees-/schrijfbaar via de API; `writeSettings` raakt ze niet
(insert → default null; update → ongewijzigd want niet in `set`).

## DEEL C — Observaties (feiten, GEEN implementatie)

**PUT-contract vs gewenst (FULL-REPLACE / veld clearen = weglaten / expliciete null → 400):**
- **Al conform.** De huidige handler (B4) + `writeSettings` (B4) doen exact FULL-REPLACE, clearen een
  weggelaten veld naar null, en geven 400 op expliciete null (via de typeof-guards). Er is voor dit
  contract **geen handler-wijziging nodig** — alleen een client-`putSettings` + een formulier.

**Gaps die "data in de app" blokkeren:**
- **(i) Sync:** geen `postSync*`-client + het "Werk week bij"-icoon triggert alleen een client-her-
  derivatie (A1), geen `POST /api/sync/*`. Nodig: 3 client-helpers + een trigger + loading/feedback.
- **(ii) Settings:** geen route, geen formulier, geen `putSettings`-client (B1/B2).

**Ambiguïteiten / open beslispunten (raken de bouw):**
- **FULL-REPLACE + partieel formulier = DATAVERLIES.** Omdat weglaten→null, MOET het formulier alle 12
  velden uit GET pre-fillen en alle 12 terugsturen; anders wist "alleen FTP opslaan" bv. `doel`/
  `doelStart` → breekt de Schema-periodisering. Alternatief = PUT naar partial-merge ombouwen (wijkt af
  van het gekozen contract). **Beslispunt.**
- **Verse user → GET = `null`** (remote D1 nu leeg): het formulier moet `null` aankunnen (blanco/
  defaults).
- **Velden zonder voor-de-hand-liggende default:** `fase`/`profielPreset`/`doel` (enums/strings) — het
  formulier heeft zinnige defaults of optionele UX nodig, maar door FULL-REPLACE moeten ze tóch mee.
- **GET-shape == PUT-shape** op de 12 velden (symmetrisch), MAAR de 4 extra D1-kolommen (B7) vallen
  buiten de DTO. Beslispunt: buiten het formulier laten (GAS-legacy, niet in het engine-pad) of de DTO
  uitbreiden.
- **Sync-param-defaults:** het icoon/scherm moet een `?days=` kiezen (lokale seed gebruikte cap
  `days=365`) en een `?window=` (`90d`|`1y`); weggelaten → engine-defaults. **Beslispunt** welke waarden.
- **Trigger-semantiek:** overlaadt de sync het bestaande "Werk week bij"-icoon (nu = pure her-derivatie)
  of komt er een aparte sync-actie? Overladen verandert de huidige betekenis. **Beslispunt.**
