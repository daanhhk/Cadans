# PUNT 69 — HET FTP-VOORSTEL NA EEN GEREDEN TEST

Ronde van 24-08-2026. **Deze ronde LEVERT GEEN CODE en dat is de uitkomst, niet een tekortkoming.**
Verwachting Q2 viel om, en de prompt had precies dat geval voor-geautoriseerd: *"VALT als de canon er
niets over zegt; dan is het getal een BESLUIT dat Daan neemt en stop je met een voorstel in plaats van
een implementatie."* Dit document is dat voorstel. Het eindigt in §10 met één vraag aan Daan.

## 0. Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang 37f238b    boom            schoon
claude --version 2.1.208 (Claude Code)
```

Agent-discovery blijft **NIET GEMETEN**: deze sessie is ouder dan `.claude/agents/recon.md`
(2026-08-23 07:48).

**NUMMERING.** Vorige ronde bleek het toegewezen nummer bezet en landde als 70. Deze keer klopt het:
`docs/ROADMAP.md:2014` draagt `69. **HET FTP-VOORSTEL NA EEN GEREDEN TEST**`. Dit punt is 69.

---

## 1. De drie verwachtingen

| | uitkomst |
| --- | --- |
| **Q1** — de 20-minutenwaarde is uit de per-rit-kromme te lezen, zonder stream en zonder engine-wijziging | **HOUDT** |
| **Q2** — de omrekening is ÉÉN regel met ÉÉN bron, en die bron is de CANON | **VALT**, op twee onafhankelijke gronden |
| **Q3** — het voorstel past in de bestaande drager met hoogstens ÉÉN migratie | **HOUDT** op de migratie-eis; niet door een echte migratie uitgeput, en het SCHRIJFPAD voor de goedgekeurde waarde ontbreekt nog (§5.1) |

---

## 2. Q1 — HOUDT, en het is gemeten

Eén GET-verzoek op `/activity/i172391866/power-curve`, 200, **5353 bytes**:

```
velden: id, after_kj, filters, label, ..., secs, values, submax_values, activity_id,
        watts_per_kg, powerModels, ranks, vo2max_5m, compound_score_5m
secs: array[153] van 1 tot 4500
```

De beslissende toets was of het rooster een EXACT punt op twintig minuten draagt — want anders moet
er geïnterpoleerd of een naburig punt geleend worden, en dat laatste is precies wat punt 70 verboden
heeft:

```
secs.indexOf(1200) = 109        values[109] = 195 W
```

**Ja.** Het rooster ligt rond de maat op hele minuten:

```
 900 s : 197 W    1020 s : 195 W    1140 s : 195 W    1260 s : 196 W    1380 s : 197 W
 960 s : 195 W    1080 s : 194 W    1200 s : 195 W    1320 s : 197 W    1440 s : 196 W
```

Dus: geen stream nodig (**5353 bytes tegen 363535**, ongeveer 68 keer zo groot), geen
`packages/engine`-wijziging nodig (een index-lookup in de worker volstaat; `pcMarkerAt_` hoeft er niet
aan te pas te komen), en geen interpolatie.

**EN DE KROMME STIJGT PLAATSELIJK — 13 stijgende stappen van de 152 — EN DAT WORDT NIET GEREPAREERD.**
Dat is een echte eigenschap van een mean-max-kromme en geen fout; zie `docs/RITDATA-RECON.md` §8. Lees
op `secs = 1200` en nergens anders.

---

## 3. Q2 — VALT, op twee onafhankelijke gronden

### Grond 1 — de canon zwijgt

Doorzocht op "95", "drempel", "FTP", "20 min", "omreken". `docs/TRAININGSMODEL.md` en
`docs/DOELEN-SPEC.md` dragen **geen enkele** omrekenregel van een 20-minutenwaarde naar een
drempelwaarde.

Er staan wel twee 95-en in de buurt, en allebei zijn ze iets anders — hier is de valkuil, dus expliciet:

- `docs/TRAININGSMODEL.md:505` en `:509` gaan over ZONEGRENZEN: *"De naad tussen die twee ligt op 95
  procent en NIET op de drempel zelf"*. Een bandgrens, geen omrekening.
- `docs/DOELEN-SPEC.md:252` is een BEHOUD-VLOER voor de doelcheck: *"bij de overgang naar Build nog
  minstens circa 95 procent van de FTP waarmee de winter begon"*. Dat meet of een BESTAANDE FTP
  behouden bleef; het zet geen 20 minuten om in een FTP.

De regel bestaat op één plek in Cadans:

```
packages/engine/src/workouts/ftp.ts:319
  "Nieuwe FTP = 95% van gemiddeld vermogen over de 20 min. Vul in op Instellingen."
```

Dat is de `eindopmerking` van het testprotocol. `grep` op "Nieuwe FTP" over de hele repo geeft precies
deze ene treffer.

**"ZONDER LEZERS" IS TE KORT DOOR DE BOCHT, en de weerleggingspas heeft me daarop gecorrigeerd.** In
CODE leest niemand hem — een uitputtende grep op `0\.95` over `packages`, `apps`, `workers` en `tools`
geeft elf treffers en geen enkele is een omrekening (TSS-weging, IF-classificatie, en
`ONDERHOUD_VLOER_PCT` in `apps/web/src/lib/niveau.ts:175`). Maar de string heeft wél een lezer: hij
RENDERT. `apps/web/src/components/schema/WorkoutDetail.tsx:167` doet `{session.eindopmerking && (` en
`:178` zet hem op het scherm. **Daan krijgt deze zin dus elk testblok te zien.** De app vertelt hem de
regel vandaag al; zij handelt er alleen niet naar.

**HERKOMST-ETIKET.** In de bevroren GAS-bron (`C:\Users\daan\Projects\training`, HEAD `3e8090a`, van
schijf gelezen) staat dezelfde regel TWEE keer, en ook daar uitsluitend als tekst:

```
src/Workouts/Ftp.gs:123   'Nieuwe FTP = 95% van gemiddeld vermogen over de 20 min. Vul in op Instellingen.'
src/Doel.gs:22            Test:  '20-min FTP test (FTP = 95% van 20min avg)'
```

**MAAR HERKOMST IS GEEN GEZAG, en dat staat met zoveel woorden in de werkwijze.**
`docs/WERKWIJZE.md:57`, verbatim: *"**GAS is een PORT-referentie, geen normbron.** De bevroren bron
beantwoordt uitsluitend "hebben we functie X destijds getrouw overgezet". Hij beantwoordt NOOIT "is
dit de juiste waarde": waar een getal vandaan komt zegt niets over of het klopt."* Twee vindplaatsen
in de oude app maken 95 procent dus niet juist — ze maken hem alleen OUD.

**EN DE OUDE APP DEED HET ANDERS DAN ZIJN EIGEN TEKST.** Gezocht naar een codepad dat in GAS uit een
testrit een FTP afleidt: dat bestaat niet. Wat wél bestaat is `src/Sync.gs:696` `setFtp(newFtp)`, en
`newFtp` komt uit `s.mmp_model.ftp` — **intervals' eigen schatting**. Die weg is voor Cadans DICHT, en
niet uit voorkeur: `docs/TRAININGSMODEL.md:630` zegt verbatim dat *"`rolling_ftp` intervals' eigen
schatting van de drempel is en daarmee een proxy in precies de zin die M91 verbiedt"*, en M91
(`:642`) stelt *"Een proxy vervangt de ijking niet"*. Dat sluit meteen de kolom
`activities.rolling_ftp` als bron uit.

*(Terzijde, en het sluit een kring: `sync_state.ftp_last_sync` staat in Cadans dood in de tabel. Het
is de port-schaduw van `setFtpLastSync(new Date())` op de regel ná `setFtp` in GAS — Cadans heeft de
kolom overgenomen en het pad er bewust niet bij.)*

**WAT DE CANON WEL ZEGT.** `docs/TRAININGSMODEL.md` §13 regelt WANNEER er geijkt wordt en dat de app
VOORSTELT — M92 (`:624`) zegt dat de ijkinspanning op de opening van een doelblok valt en *"daar de
drempelwaarde instelt waarop het hele blok doseert"*. Hoe die waarde berekend wordt, staat er niet.
Het gat zit precies tussen "de test stelt de drempel in" en "welk getal".

**EN DE ROADMAP WIST DIT AL.** `docs/ROADMAP.md:2024-2027` noemt de factor zelf *"klassiek circa 95
procent"* en legt vast dat hem kiezen *"een Daan-besluit en geen bouwdetail"* is. Deze ronde bevestigt
dat met metingen; zij ontdekt het niet.

### Grond 2 — het is niet ÉÉN regel, want de test is DOEL-AFHANKELIJK

Dit is de grond die de verwachting het hardst breekt, en hij stond in geen enkel document. De app
biedt niet één test aan maar per doel een andere, en maar één daarvan levert een drempelwaarde op.
`packages/engine/src/planner.ts:2071` kiest de familie op `doel`:

`DOEL_OPTIONS` (`packages/engine/src/phase.ts:12`) draagt vijf waarden: `FTP`, `Conditie`,
`Korte beklimmingen`, `Lange beklimmingen`, `Onderhoud`.

| doel | test-protocol | wat de eindopmerking zegt |
| --- | --- | --- |
| **FTP** | `ftp.ts:293` — "20-min FTP Test", met een TOEGEWIJD blok `20-MIN ALL-OUT` | *"Nieuwe FTP = 95% van gemiddeld vermogen over de 20 min."* |
| **Conditie** | `conditie.ts:239` — "90-min Conditie Test" | *"Kijk naar HR-drift in de tempo finale — bij goede conditie blijft HR stabiel."* — geen vermogensomrekening |
| **Korte / Lange beklimmingen** | `beklimmingen.ts:258` — "Klim PR-poging (manueel)" | *"Vergelijk tijd + gemiddeld vermogen met vorige pogingen. Klim moet je kennen."* — vergelijkend en expliciet manueel |
| **Onderhoud** | de dispatcher kent geen tak; poort (2) laat `Onderhoud` sowieso niet door (`blokCheckEnabled` false, `DOELEN-SPEC` §3.2) | n.v.t. |

`vo2max.ts` kent `type === "test"` helemaal niet, en dat is consistent: `normalizeDoel_`
(`phase.ts:35`) vouwt `VO2max` op `FTP`. Let op de laatste regel van diezelfde functie —
`return "FTP"` voor onbekend, null of leeg. Een gebruiker zonder gezet doel krijgt dus het
FTP-protocol, en dat is de gewenste kant om op te vallen.

De bevroren bron bevestigt dat de omrekening per doel verschilt en niet universeel is —
`src/Doel.gs:22` draagt naast de FTP-regel ook `VO2max.Test: '5-min all-out test (gemiddeld vermogen
= VO2 ref)'`, dus daar is de factor 1,0 op een andere duur.

**Gevolg:** een FTP-voorstel dat na ELKE aangeboden test vuurt, zou onder `Conditie` en
`Beklimmingen` een drempelwaarde afleiden uit een rit die daar niet voor bedoeld is. Het voorstel
moet dus geklemd worden op het FTP-protocol — een randvoorwaarde die de opdracht niet noemde.

### Grond 3 die er GEEN is — intervals.icu levert het niet zelf

Nagegaan of de bron zelf al een schatting meestuurt, wat de hele vraag zou hebben opgelost. Gemeten
op dezelfde respons:

```
powerModels : null        ranks : null
vo2max_5m   : 41.823315   compound_score_5m : 600.0135   weight : 74.2
```

`powerModels` en `ranks` zijn **null**. Er komt geen drempelschatting mee. Die uitweg is dicht.

---

## 4. Q3 — HOUDT op de migratie-eis, met één gat

De ronde stopte vóór de bouw, dus deze verwachting is niet door een echte migratie op de proef
gesteld. Op de eis die zij stelt — hoogstens één migratie, geen nieuwe tabel — wijst alles gunstig.
Het gat zit ergens anders: de goedgekeurde waarde kan vandaag niet weggeschreven worden (§5.1), en dat
is geen migratie-vraag maar een route-vraag.

**(a) De piek per rit kan op `activities` en overleeft een sync.** De tabel heeft vandaag geen
piek-kolom. `upsertActivity` (`workers/api/src/db/repo.ts:266`) doet
`onConflictDoUpdate({ target: [activities.userId, activities.activityIdExt], set: vals })`, en `vals`
komt uit `actValsFromRow` — een VAST object van 17 velden. Een kolom die daar niet in staat wordt door
de upsert **niet aangeraakt** en overleeft dus elke resync. Dat is precies wat §5(a) van de opdracht
vroeg: een opslag waar een latere backfill zonder omweg in past.

**(b) De antwoord-staat kan op `sync_state`, partieel geschreven.** `writeIjking`
(`workers/api/src/db/repo.ts`) zet alleen zijn eigen drie kolommen via
`onConflictDoUpdate({ target: syncState.userId, set: { ijkingBlok, ijkingDoel, ijkingAntwoord } })`.
Dat is het bestaande idiom voor een partiële schrijfactie en het botst niet met §8's verbod op een
schrijfpad dat een volledige rij wegschrijft.

**(c) `power_curve_cache` is GEEN goede drager voor per-rit-krommes.** De kolom `window` is vrije
tekst met een unieke index op `(user_id, window)`, dus het zou technisch kunnen. Maar `fetched_on` is
een dag-bucket-TTL, en een per-rit-kromme is ONVERANDERLIJK — die TTL zou elke dag een overbodige
re-fetch uitlokken op data die nooit wijzigt. Semantisch misbruik met een meetbare prijs.

**(d) Eén migratie is genoeg, en de vorm bestaat al.** Meerdere `ADD COLUMN`-statements in één
migratie is hier de staande praktijk: `workers/api/drizzle/0007_useful_johnny_storm.sql` draagt er
drie op `sync_state`, `0009_amusing_mordo.sql` eveneens, `0011_handy_the_hunter.sql` twee. De hoogste
migratie is vandaag `0012_acoustic_living_mummy.sql`, dus dit wordt **0013** plus snapshot. §8
verbiedt een tweede MIGRATIE en een nieuwe TABEL, niet een tweede kolom.

**(e) De goedgekeurde WAARDE vraagt geen kolom** — `settings.ftp` bestaat sinds `0000`
(`workers/api/src/db/schema.ts:46`). Wat zij wél vraagt is een werkend schrijfpad; zie §5(1).

**(f) `sync_state` draagt vandaag 21 kolommen**, en zes ervan zijn dood — `last_sync`, `meso_week`,
`load_carry`, `ftp_last_sync`, `weight_last_sync` en `debt_opt_in_week` komen in heel `workers/api/src`
alleen in `schema.ts` zelf voor. Let bij het bouwen op `ftp_last_sync`: die naam nodigt uit tot
hergebruik en het is een dode port-schaduw (zie §3). Hem stilzwijgend aansluiten is precies wat
CHECK 27 verbiedt.

---

## 5. HET GEVAAR DAT LOS VAN Q2 BESTAAT

Drie dingen die bij een bouw hoe dan ook geregeld moeten worden. Ze zijn gemeten en ze staan hier
zodat de volgende ronde ze niet opnieuw hoeft te vinden.

**(1) ER IS VANDAAG GÉÉN BRUIKBARE VORM OM DE GOEDGEKEURDE FTP WEG TE SCHRIJVEN — en het bestaande
precedent is al stuk.** Dit is de scherpste vondst van de weerleggingspas en ik heb elke schakel zelf
nagemeten.

`writeSettings` (`workers/api/src/db/repo.ts:56`) is FULL-REPLACE — elk veld krijgt `?? null`:

```
    ftp: s.ftp ?? null,
    lthr: s.lthr ?? null,
    gewicht: s.gewicht ?? null,
    doel: s.doel ?? null,
```

De route bevestigt het verbatim (`workers/api/src/routes/api.ts:879-881`): *"NB: writeSettings
VERVANGT de rij volledig (weggelaten velden → null; PUT-semantiek), geen partial-merge."* En
`PUT /api/settings` bouwt zijn patch uit uitsluitend de AANWEZIGE sleutels. Daarmee zijn er precies
twee mogelijke bodies, en ze falen allebei:

- **Partiële body** `{ ftp: 250 }` → `patch = { ftp }` → `writeSettings` nult `lthr`, `gewicht`,
  `doel`, `doelStart`, `fase` en alle overige velden. Destructief.
- **Volledige body** (het huidige object terugsturen) → de validators klappen op elk null-veld:
  `numField` en `strField` (`api.ts:124-135`) gooien een **400** zodra `typeof v` niet `number`
  respectievelijk `string` is, en `null` is geen van beide.

**En dat tweede geval is geen theorie.** `GET /api/settings` geeft nulls gewoon door —
`serializeSettings` (`api.ts:140`) is `{ ...s }`, en `readSettings` (`repo.ts:106`) doet
`fase: r.fase`. Gemeten op de lokale D1:

```
ftp 280 · lthr 178 · gewicht 75 · doel FTP · doel_start 2027-02-22 · fase NULL · profiel_preset gemiddeld
```

`fase` **is** null. Het enige bestaande precedent voor een kaart die settings schrijft loopt daar dus
vandaag al op stuk: `DoelPassendCard.wissel()`
(`apps/web/src/components/schema/DoelPassendCard.tsx:38-47`) doet
`putSettings(doelPassendSettingsPatch(settings, voorstel))`, en die helper
(`apps/web/src/lib/doelpassend.ts:114`) is `{ ...settings, doel, doelStart }` — inclusief
`fase: null`. De route antwoordt 400 en de `catch { setSaving(false) }` slikt hem. **Stille mislukking
in gedeployde code**, en niet iets dat punt 69 introduceert. Genoteerd als een eigen ROADMAP-punt.

Een FTP-goedkeuring die dit precedent kopieert, faalt mee. Er moet dus een PARTIEEL schrijfpad bij —
in de vorm van `writeIjking`, dat wél alleen zijn eigen kolommen zet.

**(2) DE POORT DIE IK DACHT TE HEBBEN, IS GEEN POORT OP DE RIT.** Ook dit corrigeerde de pas, en het
raakt mijn eigen eerdere formulering. `testResultaat` (`apps/web/src/lib/schema.ts:1004-1016`) neemt
`(override, weekdag)` en niets anders: het matcht op `override.type`, `override.workoutType` en
`override.label`. Het leest **geen enkele activiteit**. Het bevestigt dus dat er een test GEPLAND
stond, niet dat er een test GEREDEN is.

De echte koppeling plan→rit is zwak: een override leeft in `day_state` met sleutel `(user_id, datum)`,
een activiteit draagt zijn eigen `datum`, en er is geen verwijzing van de één naar de ander — geen
activity-id, geen inhoudsvergelijking. In `apps/web/src/lib/effect.ts` komt het neer op dezelfde
kalenderdag plus een vloer van 15 fietsminuten. Gevolgen: rijdt Daan de test een dag later, dan matcht
er niets; rijdt hij die dag iets anders, dan geldt dát als test; rijdt hij twee keer, dan houdt
`done.idExt` de LANGSTE rit (`apps/web/src/lib/schema.ts:437`) — en een woon-werkrit kan langer zijn
dan de test.

**(3) De app kan niet zien of er VOL gereden is.** De kromme geeft altijd een getal, en geen van de 17
kolommen op `activities` draagt maximaliteit. De testoverride staat op 60 minuten terwijl de vloer 15
is, dus wie na 25 minuten inzakt passeert die moeiteloos. In
`docs/RITDATA-RECON.md` staat de meting die dit pijnlijk maakt: de 195 W waarop Q1 rust komt van rit
`i172391866`, en dat is blijkens de activiteitenlijst *"🚴 Coach: Z2 progressief"* — een Z2-rit.
`0,95 × 195 = 185` W tegen een gezette FTP van **280** is een voorgestelde verlaging van **34
procent**, na een rustige duurrit. Dat is norm **M5** — de app zegt "gemeten" waar niets gemeten is —
en het is exact het defect dat dit punt zou repareren.

---

## 6. Het ontwerp dat klaarligt

Zodra de factor beslist is, is dit de bouw. Niets ervan is geschreven.

1. **Lezen.** Bij een rit die als test geldt: `GET /activity/{id}/power-curve`, één verzoek, 5353
   bytes; `values[secs.indexOf(1200)]`. Ontbreekt 1200 in het rooster, dan GEEN voorstel.
2. **Bewaren.** Eén nieuwe kolom op `activities` voor de 20-minutenpiek. Niet in `actValsFromRow`
   opnemen, zodat de sync hem niet wist. Per rit gevuld, niet alleen voor test-ritten — dan past de
   backfill van §9 er zonder wijziging in.
3. **Poorten, en alle drie zijn nodig.** (i) het doel is FTP, dus het aangeboden protocol is het
   20-minutenprotocol; (ii) de rit hoort bij een override met `workoutType === "test"` en
   `label === testBadgeLabel()` — maar let op §5(2): die match toont alleen dat er een test GEPLAND
   stond, en de koppeling naar de GEREDEN rit is niet meer dan dezelfde kalenderdag. Er is geen
   bestaande poort die dit dekt; die moet gebouwd worden; (iii) een plausibiliteitsgrens, want anders
   vuurt §5(3).
4. **Tonen.** Voorgestelde waarde NAAST de staande, met de herkomst erbij: welke rit, welke duur,
   welk vermogen, en welke factor is toegepast. M10 en M12 — de coach legt zijn redenering uit en
   dringt niets op. Strings horen in `apps/web/src/lib/coachNarrative.ts`, want dat is het idiom:
   `TestVoorstelCard` haalt er `testAanbodRegel`, `testActieLabel`, `testBevestigLabel`,
   `testBevestigUitleg` en `testAfwijsLabel` vandaan en zet geen letter inline.
5. **Goedkeuren.** Pas hier is er geijkt. Schrijft de FTP weg — via een pad dat §5(1) respecteert — en
   legt vast dat dit voorstel beantwoord is, zodat het niet terugkomt. Afwijzen legt hetzelfde vast
   zonder te schrijven.
6. **Meetgelegenheid.** Die hangt vanaf dan aan de GOEDKEURING en niet aan het rijden, wat ROADMAP
   punt 66 oplost: daar telt vandaag een geplande test plus 15 gereden minuten al als ijking terwijl
   er niets is vastgesteld.

---

## 7. De weerleggingspassen

**PAS 1 — vooropgedraaid, zodra de diagnose stond en vóór er iets gebouwd werd. VIER VAN DE VIER
LENZEN VOLTOOID, nul gestorven.** Drie van de vier haalden hun claim onderuit. Elke bevinding hieronder
is door mij nagemeten en niet overgenomen.

| lens | uitkomst |
| --- | --- |
| `regel-bestaat` | **VOLTOOID** · weerlegd: NEE op het beslissende punt — er is geen gezaghebbende regel — maar hij corrigeerde mijn formulering op twee punten |
| `protocol` | **VOLTOOID** · weerlegd: JA — "de test die deze app aanbiedt" bestaat niet in het enkelvoud |
| `slechte-rit` | **VOLTOOID** · weerlegd: JA — de poort waar ik op leunde, is geen poort op de rit |
| `drager` | **VOLTOOID** · weerlegd: JA — goedkeuring kan de FTP vandaag niet veilig wegschrijven |

**Wat er kantelde, en het waren mijn eigen zinnen:**

1. *"De regel bestaat alleen als tekst zonder lezers."* → **Onjuist als vindplaats-uitspraak.** Er is
   geen CODE-lezer, maar de string RENDERT op het scherm (`WorkoutDetail.tsx:167`), dus de app vertelt
   Daan de regel elk testblok. §3 is herschreven.
2. *"Het herkomst-etiket is: bestaande productregel uit de bevroren bron."* → **Herkomst is geen
   gezag**, en de werkwijze zegt dat met zoveel woorden (`docs/WERKWIJZE.md:57`). §3 citeert die regel
   nu verbatim in plaats van de GAS-vindplaatsen gewicht te geven.
3. *"`testResultaat` doet die match al."* → **Fout, en dit is de belangrijkste correctie.** Die functie
   leest uitsluitend de override en raakt geen enkele activiteit. §5(2) en §6(3) zijn herschreven.
4. *"De goedkeuring moet lezen-samenvoegen-schrijven."* → **Te mild.** Er is vandaag GEEN werkende
   vorm: partieel nult vijftien velden, volledig geeft 400 omdat `fase` null is. En het bestaande
   precedent is daardoor al stuk. §5(1) draagt nu de meting.
5. *"Beklimmingen"* als doelnaam → de echte waarden zijn `Korte beklimmingen` en `Lange beklimmingen`
   (`packages/engine/src/phase.ts:12`). §3 is gecorrigeerd.

**Wat NIET kantelde:** de kern van Q2. Geen enkele lens vond een gezaghebbende omrekenregel — niet in
de canon, niet in code, niet in de bevroren bron, en niet in de git-historie (`git log -S"95% van"
--all` geeft twee commits: de port zelf en het recon dat hem citeert). De DOELEN-SPEC-val is door twee
lenzen onafhankelijk bevestigd als val: die 95 procent vergelijkt FTP met FTP.

**PAS 2 — NIET GEDRAAID, met grond.** De tweede pas hoort vóór de commit op de GEBOUWDE code. Er is
geen code gebouwd, dus er is niets voor die pas om aan te vallen. De claim die deze ronde wél draagt
— "de factor is niet vastgelegd en moet gekozen worden" — is precies wat pas 1 uitputtend heeft
aangevallen en niet heeft kunnen weerleggen.

---

## 8. Strings

**Geen enkele.** Er is geen copy toegevoegd of gewijzigd; er is deze ronde geen code geschreven.

---

## 9. De backfill

**NIET GEDRAAID, en er is ook niets voor gebouwd.**

De opdracht (§7) zette de volgorde vast: eerst secties 3 tot en met 5 bouwen en testen, dan de
backfill droog draaien op een handvol ritten, dan STOPPEN en Daan om akkoord vragen voor de volle run.
Die volgorde begint bij een bouw die niet heeft plaatsgevonden, en de backfill schrijft in een kolom
die niet bestaat. Er is dus geen droge run om te rapporteren.

De randvoorwaarden staan genoteerd voor de ronde die hem wél bouwt: gedoseerd, met teller en een
HARDE bovengrens die GOOIT; HERSTARTBAAR, zodat een afgebroken run niet opnieuw alles ophaalt; en
uitsluitend lezen. Omvang volgens `docs/RITDATA-RECON.md`: ongeveer **255 ritten**, ongeveer **1,4 MB**,
één verzoek per rit.

De aanleiding voor die eerste randvoorwaarde staat in `HANDOFF.md`: in een eerdere ronde gingen er door
een harnas-fout ongeveer **1536** ongewilde verzoeken uit. Elk meetscript in deze ronde draaide daarom
achter een bovengrens die GOOIT in plaats van door te gaan.

---

## 10. HET BESLUITBLOK — BEANTWOORD OP 24-08-2026

> **DAAN KOOS WEG A: de nieuwe drempelwaarde is 95 procent van het beste twintigminutenvermogen uit
> de testrit**, afgelezen op het duurpunt `secs = 1200`. Het besluit is met zijn herkomst-etiket en
> de drie randvoorwaarden vastgelegd in `docs/TRAININGSMODEL.md` §13, direct onder M92 — dus in de
> CANON, wat precies het gat was dat Q2 deed omvallen. **Q2 is daarmee gesloten en de bouw uit §6 is
> vrijgegeven**; hij is in deze ronde niet meer uitgevoerd, want de ronde was toen al afgesloten en
> een migratie op remote D1 vraagt een eigen goedkeuring.
>
> De tekst hieronder blijft staan zoals hij bij het stellen van de vraag luidde.

De app kan de twintigminutenwaarde uitlezen (§2). Wat zij niet kan, is die waarde in een
drempelwaarde omzetten, want **het getal dat dat doet is nergens met gezag vastgelegd** (§3). Dat is
geen bouwdetail: het bepaalt welke FTP de app straks voorstelt, en daarmee elke zone en elke
trainingsprikkel die eruit volgt.

**A. Neem de bestaande productregel over: 95 procent van de beste twintig minuten uit de rit.**
Dat is wat beide apps al TONEN, twee keer gesteld in de bevroren bron. Voordeel: geen nieuw getal,
volledige continuïteit met wat Daan gewend is. Nadeel: de beste twintig minuten uit de HELE rit is
per definitie ≥ het gemiddelde over het voorgeschreven all-out-blok, dus de uitkomst valt eerder iets
te hoog dan te laag uit.

**B. 95 procent van het gemiddelde over het VOORGESCHREVEN blok.** Dichter bij de letter van het
protocol. Kost een tweede verzoek per rit (`/activity/{id}/intervals`, 2010 bytes gemeten) om het
`20-MIN ALL-OUT`-blok te vinden, en werkt alleen als Daan de structuur ook echt zo rijdt.

**C. Een ander percentage.** Als Daan uit ervaring weet dat 95 voor hem niet klopt.

Bij elke keuze hoort dezelfde tweede helft, en die is niet onderhandelbaar: **het voorstel vuurt
alleen bij doel FTP** (§3), er komt een plausibiliteitsgrens tegen §5(3), en er komt een partieel
schrijfpad voor `settings.ftp` (§5(1)). En het gekozen getal krijgt een herkomst-etiket en een plek in
`docs/TRAININGSMODEL.md`, want dát is precies wat er nu ontbreekt — anders staat de volgende ronde
weer voor dezelfde vraag.

**WAT IK ZOU KIEZEN ALS HET AAN MIJ LAG: A.** De regel staat al twee keer in de bevroren bron, hij
staat vandaag op Daans scherm, en hij is wat hij gewend is. De afwijking tegenover weg B is de
overschatting die ontstaat doordat het beste venster het testblok net niet dekt, en die is klein
tegenover de kosten van een tweede verzoek per rit plus de aanname dat de structuur exact gereden
wordt. Maar dit is een besluit over Daans eigen training en niet over code, dus het is zijn keuze en
niet de mijne.

---

## 11. Wat deze ronde NIET heeft vastgesteld

- Q3 is niet door een echte migratie getoetst; er is geen migratie geschreven.
- Er is geen meting van hoe groot het verschil tussen weg A en weg B in de praktijk is; daarvoor is
  een echte testrit van Daan nodig en die is er in de gemeten periode niet. Wat wél vaststaat is de
  RICHTING: de kromme-waarde is het maximum over alle vensters en dus per constructie ≥ het gemiddelde
  over het voorgeschreven blok. Weg A valt dus nooit lager uit dan weg B, alleen gelijk of hoger.
- Hoe vaak de datum-koppeling in de praktijk misgaat, is NIET gemeten — alleen dat zij structureel
  zwak is (§5.2).
- De stille 400 op `PUT /api/settings` is gemeten op de **lokale** D1, waar `fase` null is. Of de
  PROD-rij ook een null-veld draagt, is **niet gemeten** — daarvoor zou een leesactie op remote D1
  nodig zijn en die viel buiten deze ronde. De faalwijze is dus vastgesteld, de blootstelling op prod
  niet.
- Weerleggingspas 2 is niet gedraaid, met de grond in §7.

<!-- EINDE docs/PUNT69-BOUW.md -->
