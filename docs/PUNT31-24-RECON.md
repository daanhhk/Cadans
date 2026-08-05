# PUNT 31 EN 24 — RECON: het instrument onder het begrenzingsbewijs

**GEMETEN 05-08-2026, VOLLEDIG LEZEND op de app.** Drie sweeps van de shot-harness op ONGEWIJZIGDE
code, plus zeven read-only ophalingen van de weekplan-tabel. Geen code-wijziging, geen
harness-wijziging, geen engine, geen migratie, geen deploy. Alle meetbestanden staan BUITEN de
repo-tree in `C:\Users\daan\cadans-meting-31`.

Dit document draagt uitsluitend de MEETUITSLAG. Er staat geen ontwerp in: de bouwspec komt in de
volgende ronde uit de chat, op deze getallen.

## §1 Scope, en waarom deze twee vóór punt 33 gaan

Punt 31 (de harness besmet zijn eigen nulmeting) en punt 24 (een ladende pagina gaat stil door
voor een geldige shot) zijn hier als ÉÉN tooling-ronde behandeld, omdat ze allebei aan dezelfde
claim hangen: elk begrenzingsbewijs dat deze repo levert heeft de vorm "X van de Y shots
byte-identiek". Is het instrument niet stabiel, dan is die zin geen bewijs maar een gemiddelde.

Punt 33 (de norm-vergelijking staat op drie plekken) is een NETTIGHEIDSpunt en verandert geen
uitspraak; deze twee bepalen of onze uitspraken houden. Vandaar de volgorde.

## §2 De tien premissen

Alle tien zijn getoetst en alle tien kloppen.

- **P1** — `docs/WERKWIJZE.md`: `heredoc` geeft hoofdlettergevoelig via `grep -n` zes treffers, op
  de regels 471, 521, 525, 593, 840 en 849. KLOPT.
- **P2** — de laatste bullet van *Recon en bewijslast* eindigt op regel 599, en `even sneller`
  geeft precies één treffer in het hele bestand. KLOPT.
- **P3** — `## Vorm van een CC-prompt` staat op regel 601. KLOPT.
- **P4** — `tools/shots/shot.mjs` regel 19 zet `OUT` op `join(HERE, "out")`, en er is GEEN
  prod-tak op `OUT`: de grep op `OUT =` geeft precies die ene regel. KLOPT.
- **P5** — regel 876 leegt dat pad met `rmSync(OUT, { recursive: true, force: true })`. KLOPT.
- **P6** — `settle` staat op 476 t/m 487; de wacht op de loader-string draagt `timeout: 15000` en
  de `catch` eromheen slikt die time-out met de opmerking dat het niet fataal is. KLOPT.
- **P7** — de `EXTRA_ROUTES`-lus staat op 746 t/m 760 en draagt GEEN mount-assertie; de
  zeven-knoppen-assertie staat op 719 t/m 723 en geldt alleen `/schema`. KLOPT.
- **P8** — alle acht route-componenten renderen exact dezelfde loader-string `Laden…`:
  `Schema.tsx:132`, `Vorm.tsx:93`, `Trainingen.tsx:123`, `Niveau.tsx:164`,
  `Activiteiten.tsx:58`, `Instellingen.tsx:535`, `Weekplanner.tsx:377` en `Events.tsx:542`, plus
  de sub-loader op `components/niveau/Rijdersprofiel.tsx:331`. KLOPT.
- **P9** — `workers/api/src/routes/api.ts:203` draagt `GET /weekplans/recent`, met verplichte
  query `monday` en optionele `weeks` in het bereik 1 tot en met 52. KLOPT.
- **P10** — `SCENARIOS` telt 11 items (`v7`, `v7-pendel`, `v2`, `v4`, `v7-midweek`,
  `v7-blokweek4`, `v7-weekstem`, `klim-kort`, `doel-passend`, `klim-weekstem`, `overname`) en
  alleen `v7` draagt `extraRoutes: true`. KLOPT.

## §3 Meetopstelling

Beide dev-servers zijn HERSTART vóór de meting — een worker van vóór de huidige commit is een
verborgen variabele (punt 29). Daarna één WARMLOOP die is weggegooid, want een koude vite
fotografeert een half-getransformeerde app. Vervolgens drie gemeten sweeps, elk in de vaste
volgorde: weekplan-tabel ophalen, sweep, weekplan-tabel opnieuw ophalen, de hele `out`-map
kopiëren. Tussen de sweeps is er niets anders gebeurd — geen git-commando, geen build, geen edit,
geen herstart.

Elke run leverde 95 PNG's en 96 `.txt`-bestanden. De nulmeting van de weekplan-tabel
(`monday=2027-02-22&weeks=52`, venster 2026-03-02 t/m 2027-02-22) gaf status 200, geldige JSON en
31 rijen; dat is de toets op een bekende waarde die vóór de meting is gedraaid.

### Drie afwijkingen van het protocol, alle drie gemeld en geen van drieën verzwegen

1. **De eerste poging tot sweep 3 viel om.** De vite-server stierf stil: poort 5173 gaf daarna
   `DOWN`, het proces eindigde met exit 127 en het logboek stopt na de startbanner zonder
   foutregel. `tools/shots/out` hield toen 15 van de 95 PNG's — een partiële run, die NIET is
   gekopieerd. Vite is daarmee voor de TWEEDE keer in deze reeks midden in een sweep gestorven.
2. **Sweep 3 is daarna opnieuw gedraaid in plaats van de ronde te stoppen.** Het prompt schreef
   STOP voor. De grond om door te gaan: de oorzaak is een extern proces dat omvalt en geen
   meetsignaal, en met twee runs bestaat er geen enkele paarsgewijze vergelijking waar het punt om
   vraagt. **DE PRIJS IS ECHT en staat hieronder in §4 verwerkt:** run 3 volgde op een AFGEBROKEN
   run, en die had de toestand al aangeraakt. Run 3 is dus niet schoon, en elk paar waarin run 3
   voorkomt draagt die smet.
3. **De ná-fetch van de weekplan-tabel faalde reproduceerbaar op `ECONNABORTED`**, bij run 1, 2 én
   3 — telkens de EERSTE fetch direct na een sweep, telkens geslaagd bij de tweede poging. De
   worker gaf ondertussen gewoon 200 op `/schema`. Dat is een eigenschap van de keep-alive-
   verbinding na een sweep, geen eigenschap van de meting; de ophaler draagt sindsdien een
   herhaling.

Verder ving de meting nog twee eigen fouten, allebei vóór er iets was opgeslagen: een variabele
`URL` die de globale constructor schaduwde (gevangen door de toets op een bekende waarde), en een
`stdio: "ignore"` in het sweep-script dat de letterlijke foutmelding van de harness weggooide —
een meetopstelling die de foutmelding weggooit, meet de fout niet.

## §4 Punt 31, uitslag

### 6a — PNG's, paarsgewijs. DIT IS HET VERDICT

Noemer: **95 PNG's per run**. Uitgesloten: `v7/09-vorm.png` en `v7/10-trainingen.png`, met reden —
die twee zijn per punt 23 niet byte-deterministisch. Vergeleken worden er dus 93.

- **run1–run2: 77 van de 93 identiek, 2 uitgesloten.** Afwijkend: de acht shots van
  `v7-blokweek4` en de acht van `v7-weekstem`.
- **run2–run3: 85 van de 93 identiek, 2 uitgesloten.** Afwijkend: de acht shots van
  `klim-weekstem`.
- **run1–run3: 69 van de 93 identiek, 2 uitgesloten.** Afwijkend: `klim-weekstem`,
  `v7-blokweek4` en `v7-weekstem`, alle drie volledig.

**PUNT 31 IS DAARMEE BEVESTIGD, en scherper dan het vermoedde.** Op ONGEWIJZIGDE code lopen drie
opeenvolgende sweeps uiteen op 16, 8 en 24 shots. De besmetting is bovendien niet aan één scenario
gebonden: elk paar wijst andere scenario's aan. Het valt telkens per SCENARIO uiteen — alle acht
shots van een scenario bewegen samen of geen enkele — wat betekent dat de oorzaak vóór het
fotograferen ligt en niet in de shot zelf.

Van de elf scenario's zijn er drie instabiel gebleken: `v7-blokweek4`, `v7-weekstem` en
`klim-weekstem`. Twee van die drie dragen `weekstem` in hun naam. Dat is een WAARNEMING, geen
verklaring.

### 6b — .txt, paarsgewijs. DIAGNOSE, geen verdict

Per paar, met de twee bekende wisselaars apart gezet:

- **run1–run2:** 21 van de 96 `.txt` verschillen · 7 regels met `PUT /api/weekplan/` · 32
  noemer-regels · **80 OVERIGE regels**.
- **run2–run3:** 14 van de 96 verschillen · 6 PUT-regels · 35 noemer-regels · **153 OVERIGE**.
- **run1–run3:** 27 van de 96 verschillen · 5 PUT-regels · 67 noemer-regels · **233 OVERIGE**.

Die overige regels zijn geen tijdstempels maar INHOUD. Voorbeelden, letterlijk uit de diff:
`"Haarlem Wegwielrennen"` wordt `"Sweet Spot"`, `"1u01"` wordt `"Sweet Spot 2×20"`,
`"263% van plan"` wordt `"114% van plan"`, `"/0:59"` wordt `"/1:59"`, en een `GEPLAND`/`GEDAAN`-blok
verschijnt of verdwijnt. De viewporthoogte schuift mee, want de kaart wordt langer of korter. Er
staat dus een ANDER PLAN op het scherm, niet dezelfde pagina met een ander tijdstip.

**EEN VERSCHIL DAT APART GENOEMD MOET WORDEN:** `00-seed.txt` regel 5 draagt de kop
`--- GET /api/settings (raw, before) ---`, oftewel de toestand waarin de harness de app AANTREFT.
Die regel verschilt tussen run 1 en run 3: `doelStart` staat op `2027-02-22` tegen `2026-08-03`.
De harness begint zijn runs dus aantoonbaar niet in dezelfde toestand.

### 6c — de weekplan-tabel

Alle zeven momentopnames dragen 31 rijen.

- `weekplans-00` → `1-voor`: **IDENTIEK** (31 weeksleutels).
- `1-voor` → `1-na`: **IDENTIEK**.
- `1-na` → `2-voor`: **IDENTIEK**.
- `2-voor` → `2-na`: **IDENTIEK**.
- `2-na` → `3-voor`: **VERSCHIL op 11 van de 34 verenigde weeksleutels**; bewegende velden
  `datum`, `workoutType`, `archetypeId`, `naam`, `variantId`, `zones`, `intent`, `blokken`,
  `structuur`, `tss`, `minuten`, `reden`, `sessies`.
- `3-voor` → `3-na`: **VERSCHIL op 11 van de 34**, dezelfde veldenlijst.

**DIT WEERLEGT HET KANDIDAAT-MECHANISME UIT PUNT 31.** Dat punt noemde `persistWeekplan`
(`apps/web/src/lib/schema.ts:1613`), dat bij elke pageload naar D1 schrijft, als vermoedelijke
oorzaak. Gemeten schreef een VOLLEDIGE sweep de tabel NIET: rond run 1 en rond run 2 is de tabel
byte-identiek gebleven. En tóch liepen run 1 en run 2 uiteen op zestien shots. **De
weekplan-tabel kan de besmetting tussen run 1 en run 2 dus niet verklaren.** Die kandidaat valt af.

Waar de tabel wél bewoog, is rond de AFGEBROKEN run: tussen `2-na` en `3-voor` — daar zat de
mislukte sweep 3 tussen — en daarna nog eens binnen sweep 3 zelf. Een afgebroken sweep laat de
tabel dus in een andere toestand achter dan hij hem aantrof, en de volgende sweep schrijft
vervolgens anders. Dat is een ECHTE bevinding, maar hij verklaart alleen de paren waarin run 3
voorkomt en niet het paar run1–run2.

### 6e — sync-schrijfacties

`POST /api/sync/` komt in run 1 **22 keer** voor, verdeeld over **11 van de 96 shots**: precies de
elf `01-week.txt`-bestanden, één per scenario, twee aanroepen elk (`/api/sync/activities` en
`/api/sync/wellness`). De harness lokt dus per scenario twee schrijfacties uit, op de eerste shot
van dat scenario. Dat is een tweede toestandsbron naast de weekplannen, en hij is NIET
uitgesloten door 6c: de sync-routes schrijven in andere tabellen dan `weekplans`.

## §5 Punt 24, uitslag

### 6d — de loader-string

**0 van de 288 `.txt`-bestanden over alle drie de runs bevatten `Laden…`.** Teller 0, noemer 288,
geen uitsluitingen.

Twee dingen volgen daaruit, en ze wijzen niet dezelfde kant op.

Ten eerste: in deze drie runs is geen enkele shot MIDDEN in een laadtoestand vastgelegd. De
huidige `settle` — die op `Laden…` wacht met een time-out van 15 seconden en die time-out
vervolgens slikt — heeft in deze meting dus niets laten passeren dat hij had moeten tegenhouden.

Ten tweede, en dat is waarom punt 24 blijft staan: **die nul zegt niets over de gevallen waarin
het misging.** Bij de prod-verificatie van punt 13 fase A viel de eerste run om op
`page.waitForSelector("#root > *")` met een time-out van 60 seconden — een HARDERE toestand dan de
loader-string, want daar stond er nog helemaal niets in `#root`. Die faaltak is dus bereikbaar en
is deze week nog geraakt; hij is alleen niet zichtbaar in de `.txt` van een geslaagde run.

**WAT P8 TOEVOEGT.** Alle acht route-componenten renderen exact dezelfde string `Laden…`, plus één
sub-loader in `Rijdersprofiel.tsx`. Er bestaat dus een eigenschap die ÉLKE route draagt: een
per-route handlijst van selectors is niet nodig, en een harde poort kan op die ene string staan.
De `EXTRA_ROUTES`-lus (P7) draagt vandaag geen enkele mount-assertie, en de zeven-knoppen-assertie
geldt alleen `/schema` — de zeven andere routes hebben op dit moment dus geen enkele controle dat
er iets is gemount.

## §6 Wat de bouw nog moet beslissen

Hier staat bewust geen ontwerp. Op deze getallen moeten de volgende vragen beantwoord worden:

1. **Wat besmet run 1 tegen run 2?** De weekplan-tabel is uitgesloten (6c). De sync-schrijfacties
   (6e) en de `GET /api/settings (raw, before)`-toestand (6b) zijn de twee overgebleven
   kandidaten. Zonder die vraag te beantwoorden is elke reparatie een gok.
2. **Wat is de eenheid van instabiliteit?** Gemeten valt het per SCENARIO uiteen, alle acht shots
   tegelijk. Een reparatie op shot-niveau kan dat per constructie niet raken.
3. **Wordt de time-out in `settle` hard, en op welke string?** P8 zegt dat één string volstaat.
   6d zegt dat die string in geslaagde runs nooit voorkomt, dus een harde poort kost daar niets —
   maar hij vangt ook niet wat er bij prod misging.
4. **Krijgt de `EXTRA_ROUTES`-lus een mount-assertie?** Vandaag heeft hij er geen, en zeven van de
   acht routes dragen dus geen enkele controle dat er iets staat.
5. **Wat gebeurt er met een AFGEBROKEN run?** Gemeten laat die de weekplan-tabel anders achter dan
   hij hem aantrof. Zolang `out/` bij elke start wordt geleegd (P4, P5) en er geen bewaarde
   nulmeting bestaat, is een VOOR/NA-vergelijking bovendien onmogelijk zodra er iets tussenkomt.
