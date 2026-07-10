# Brok 3 · coachNaam — RECON + migratie/DTO/endpoint/render-proposal

Read-only recon (GEEN code gewijzigd). Meetlat = `docs/VORMGEVING-SPEC.md` §1 (APP-HEADER) + RECON-CHECKLIST
#1/#2. Cadans HEAD `c68c5f8`; GAS-referentie `C:\Users\daan\Projects\training` HEAD `3e8090a` (read-only).
coachNaam = PRESENTATIE-config, GÉÉN engine-input.

## KERNCONCLUSIE

- **Bron-precedent = `profielPreset`.** Dat is al een NIET-engine presentatie-veld dat via exact dezelfde keten
  loopt (D1-kolom → SettingsInput → EngineSettings-type → GET/PUT). coachNaam kopieert die keten 1:1.
- **Engine leest coachNaam NIET** (grep `packages/engine` op `coachnaam|coachname|coach_naam` = leeg). Het komt
  wél in het `EngineSettings`-TYPE terecht (via `Omit<SettingsInput>&`), net als profielPreset — maar de engine
  RAAKT het niet aan → geen gedragswijziging. Aanname (4) BEVESTIGD.
- **Header-woordmerk is nu hardcoded de app-naam "Cadans"** (`AppShell.tsx:40`); moet coachNaam UPPERCASE worden.
  Aanname (3) BEVESTIGD.
- **Settings-endpoint is de juiste plek** (GAS zet `coach_naam` óók in de settings-sheet). Aanname (2) BEVESTIGD.
- **Één full-stack ketting**: D1-kolom + shared-DTO + repo-map + PUT-whitelist + web-render (header + avatar +
  weeknr) + form-veld. Plus consistentie-fix: de coach-box-kop toont nu hardcoded "Coach".

---

## DEEL A — bevindingen (bestand:regel)

### GAS (read-only, HEAD `3e8090a`)
- **A1 coachNaam-bron:** settings-key **`coach_naam`** — `Settings.gs:42` (`COACH_NAAM {row:54, label:'Naam van je
  coach'}`, comment "header-wordmark + coach-callout"). Geëxposeerd als **`coachName`** (default `'Coach'`) in
  `WebApp.gs:1368`/`:1370`. PUT: trim + `slice(0,24)` + default `'Coach'` → `writeField('coach_naam', row 54)`
  (`WebApp.gs:1528-1530`). Uppercasing: header via **CSS** (`.appbar-brand text-transform:uppercase`,
  `Styles.html:27`; JS zet alleen `s.coachName || 'Coach'`, `Script.html:71`); coach-callout-kop via
  **`.toUpperCase()`** (`Script.html:501`, `:639`). → Dezelfde bron voedt header + callout.
- **A2 avatar-initialen:** **HARDCODED** literal `DK` in de markup — `Index.html:23`
  (`<button class="appbar-avatar">DK</button>`). GÉÉN settings-veld, GÉÉN afleiding. RECON-CHECKLIST #2
  "volledige-initialen-bron": er ís geen GAS-bron → Cadans moet er zelf één kiezen.
- **A3 ISO-week:** client-side pure ISO-8601-calc `isoWeek_(d)` (`Script.html:84`); header
  `appbar-week = 'Week ' + isoWeek_(new Date())` (`Script.html:70`; markup `Index.html:22`).

### Cadans (HEAD `c68c5f8`)
- **A4 shared settings-DTO:** `SettingsInput` (`packages/shared/src/settings.ts:11-25`) = de **WIRE-DTO** voor
  GET/PUT `/api/settings` (12 velden: ftp/lthr/gewicht/doel/doelStart/hrMax/hrRest/doelDuur/fase/**profielPreset**
  /pendelDuurMin/pendelAantal). NIET puur EngineSettings — `EngineSettings = Omit<SettingsInput,"doelStart"> &
  {doelStart: Date}` (`repo.ts:44`) is ervan afgeleid. **profielPreset** is de bestaande niet-engine-precedent.
- **A5 D1 settings-tabel:** `settings` (`workers/api/src/db/schema.ts:42-63`); relevante kolom
  `profielPreset: text("profiel_preset")` (`:56`); presentatie-kolommen bestaan al (`ftpAutoUpdate`,
  `weightAutoUpdate`, `emailDigest` `:59-61`).
- **A6 GET /settings:** `routes/api.ts:124-127` → `readSettings` (`repo.ts:74-94`, row→EngineSettings, o.a.
  `profielPreset: r.profielPreset` `:94`) → `serializeSettings` (`routes/api.ts:111-114`) — **SPREADT** alle
  velden (`...s`) + `doelStart` Date→ISO. Een veld dat in readSettings zit, passt automatisch mee.
- **A7 PUT /settings (FULL-REPLACE):** `routes/api.ts:310-337` — **expliciete whitelist per veld**; profielPreset
  = `if ("profielPreset" in body) patch.profielPreset = strField(...)` (`:328-330`) → `writeSettings`
  (`repo.ts:48-64`, row-map `profielPreset: s.profielPreset ?? null` `:64`). Een nieuw veld vereist HIER een
  expliciete branch.
- **A8 web-header:** `AppShell.tsx` — woordmerk = **hardcoded** `<span>Cadans</span>` (`:40`, app-naam,
  CSS-uppercase); rechts een **tandwiel-`<Link to="/instellingen">`** (`:42-80`). GÉÉN weeknr, GÉÉN
  avatar-initialen.
- **A9 settings-form:** `Instellingen.tsx` — `form.<veld>` + `set("veld")`-patroon; profielPreset-Select
  `:445-447`. Hier landt straks het coachNaam-tekstveld + preset-chips.
- **A10 ISO-weeknr-helper:** `apps/web/src/lib/dates.ts` heeft `todayIso` (`:4`), `weekMondayIso` (`:12`, geeft
  de maandag-DATUM, NIET het nummer), `parseLocalDate` (`:29`). **GEEN weeknummer-helper** → GAS `isoWeek_` moet
  geport worden.
- **A11 coach-box-kop (§6):** `DoneCompareCard.tsx:268` rendert **hardcoded** `{impact ? "Coach · impact" :
  "Coach"}`; comment `:199` zegt "Kop-naam: settings.coachNaam" maar het is NOG NIET bedraad. → consistentie-fix
  bij brok 3.

### Aannames — verdict
1. DTO puur-EngineSettings óf dunne wrapper → **dunne wrapper BEVESTIGD** (SettingsInput = wire-DTO, bevat al de
   niet-engine `profielPreset`; EngineSettings is ervan afgeleid). coachNaam voegt exact zo toe.
2. settings-endpoint is de juiste plek (geen apart endpoint) → **BEVESTIGD**.
3. header rendert nu hardcoded app-naam-woordmerk → **BEVESTIGD** ("Cadans", `AppShell.tsx:40`).
4. engine leest coachNaam NIET → **BEVESTIGD** (grep `packages/engine` leeg).

---

## DEEL B — PROPOSAL (alleen voorstel; NIET nu bouwen)

- **B1 migratie (forward-only drizzle-kit):** kolom op `settings` (`schema.ts`):
  `coachNaam: text("coach_naam")` — **nullable, ZONDER default** (spec: ontbreekt data → expliciete lege staat).
  NB: het migratie-bestand genereren = bouw-scope; `--remote`-apply op productie-D1 = aparte expliciete,
  approval-gated stap (NIET hier).
- **B2 shared-DTO-diff:** voeg `coachNaam: string | null` toe aan `SettingsInput`. Komt via `Omit<>&` in
  `EngineSettings`-type terecht (zoals profielPreset) — engine negeert het; EngineSettings-GEDRAG onaangetast.
- **B3 endpoint:** GET — voeg `coachNaam: r.coachNaam` toe in `readSettings` (`repo.ts`); `serializeSettings`
  hoeft NIET te wijzigen (spread). PUT — voeg `if ("coachNaam" in body) patch.coachNaam = strField(body.coachNaam,
  "coachNaam")` toe (`routes/api.ts`) + `coachNaam: s.coachNaam ?? null` in `writeSettings` (`repo.ts`).
  Overweeg een 24-char-cap + trim (GAS-parity, `WebApp.gs:1529`) — client-`maxLength` + evt. server-trim.
- **B4 web-render (`AppShell.tsx`):**
  - **Woordmerk** = `coachNaam` UPPERCASE (CSS `text-transform:uppercase`, zoals nu). Lege/`null` coachNaam →
    fallback **"COACH"** (GAS-default `'Coach'`, `WebApp.gs:1368`) — een woordmerk kan niet écht leeg; dit is een
    DEFAULT, geen echte lege staat (**flag**).
  - **Avatar-initialen** = AFGELEID uit coachNaam. Regel: eerste letter van elk woord (max 2); bij één woord de
    eerste twee letters; UPPERCASE. Voorbeelden: "Coach Stelvio"→**"CS"**, "Merckx"→**"ME"**. Lege coachNaam →
    "CO" (uit default "Coach") of neutrale glyph. De avatar wordt de settings-entry (opent `/instellingen`,
    vervangt het tandwiel — GAS-parity: avatar opent settings, `Index.html:23`).
  - **ISO-weeknr** = "Week N" rechts in de header; port GAS `isoWeek_` naar een nieuwe pure helper in
    `lib/dates.ts` (levert het NUMMER; `weekMondayIso` blijft voor de datum).
- **B5 settings-form (`Instellingen.tsx`):** sectie "JOUW COACH" — tekstveld `coachNaam` (maxLength 24) +
  preset-chips **Coach · Daan · Merckx · Sven · Anna** (spec `:114`) → `set("coachNaam")` → `settings.coachNaam`.
- **B6 consistentie:** bedraad óók de coach-box-kop (`DoneCompareCard.tsx:268`) op coachNaam (nu hardcoded
  "Coach") — GAS voedt header + callout uit dezelfde `coachName`.

### ≠-afwijkingen van GAS/spec (expliciet)
- **Avatar-initialen ≠ GAS:** GAS toont hardcoded user-initialen **"DK"** (`Index.html:23`); Cadans leidt de
  initialen af uit **coachNaam** (single-source, geen apart user-naam-veld) → toont bv. "CS" i.p.v. "DK".
  RECON-CHECKLIST #2 is hiermee beslecht: er is geen GAS-databron; Cadans kiest coachNaam-afgeleid.
- **coachNaam in EngineSettings-type:** verschijnt via `Omit<>&` (zoals profielPreset) maar wordt niet
  engine-gelezen — type-shape groeit, gedrag niet.
- **Lege-staat-woordmerk:** default "COACH" i.p.v. een écht lege header (een woordmerk moet iets tonen).
