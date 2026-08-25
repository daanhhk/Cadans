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

---

## 12. DE REPARATIE VAN HET SCHRIJFPAD — ROADMAP punt 73

De vondst uit §5(1) is hier afgehandeld, in een eigen ronde op 24-08-2026. **Dit was geen fout in
nieuw werk maar een defect in wat Daan vandaag op zijn scherm heeft.**

### Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang cd96414    boom            schoon
claude --version 2.1.208 (Claude Code)
```

Nummering gecontroleerd: `docs/ROADMAP.md:2054` draagt `73.`, en dat klopt met de prompt.
Agent-discovery blijft **NIET GEMETEN**.

### De aanroepers — er zijn er DRIE, en één is een harnas

Gezocht met een grep op `putSettings`, `writeSettings` en `/api/settings` over `apps`, `workers`,
`tools` en `scripts`:

| aanroeper | vindplaats | wat hij stuurt |
| --- | --- | --- |
| de Instellingen-pagina | `apps/web/src/pages/Instellingen.tsx:499` via `settingsFormToBody` | alleen GEVULDE velden; leeglaten = wissen |
| de doel-wissel-kaart | `apps/web/src/components/schema/DoelPassendCard.tsx:42` via `doelPassendSettingsPatch` | het VOLLEDIGE object, inclusief nulls |
| de screenshot-harness | `tools/shots/shot.mjs:397` (`seedSettings`) en `:801` | het volledige object **met de nulls eruit gefilterd** |

**DE DERDE IS DE INTERESSANTSTE**, want die had het al opgelost. `seedSettings` draagt verbatim de
regel én de reden:

```
 * PUT /api/settings is effectively FULL-REPLACE: writeSettings writes `?? null` for every
 * field the patch lacks, and an explicit null is a 400. So carry every field that currently
 * HAS a value, drop the ones that are already null, and apply the overrides on top.
```

en filtert dan met `if (v !== null && v !== undefined) body[k] = v;`. Er is bovendien een LATENTE
vierde: `apps/web/src/pages/Preview.tsx` mount `SchemaView` met een synthetisch settings-object.

Het contract stond dus al twee keer opgeschreven — ook in `apps/web/src/lib/settings.ts`, verbatim:
*"Nooit een sleutel met null/""/NaN (dat zou een 400 triggeren)."* Alleen
`doelPassendSettingsPatch` hield zich er niet aan, en zijn eigen test pint dat vast: het `describe`
heet *"doelPassendSettingsPatch — de FULL-REPLACE-valkuil"* en de fixture draagt `doelDuur: null` en
`fase: null`.

### R1 — HOUDT

Geen migratie en geen engine-wijziging nodig. De reparatie zit in twee helperfuncties en één
component; `git diff --stat packages/engine` is leeg.

### R2 — HOUDT, maar anders dan ik dacht

De verwachting was dat alle aanroepers met één vorm te bedienen zijn. Dat klopt — maar niet via de
vorm die ik eerst ontwierp. **Ik wilde van PUT een MERGE maken (afwezig = ongewijzigd) en die
gedachte is door de weerleggingspas onderuit gehaald**, op drie gronden die ik daarna zelf heb
nagemeten:

1. **De merge maakt een lassing los.** Onder full-replace zijn `doel` en `doelStart` aan elkaar
   vastgeklonken: wie alleen `doel` stuurt, wist `doelStart`. Onder een merge zou een verse doelwissel
   STIL het lopende blok erven — precies het defect waarvoor punt 28 gebouwd is.
2. **Niemand heeft de merge nodig.** Instellingen zou onder een merge expliciete nulls moeten sturen
   en schrijft dan byte-voor-byte dezelfde rij als vandaag; de doel-wissel-kaart stuurt sowieso alle
   zestien velden mee.
3. **De prijs klopt niet.** De merge kantelt negen tests; de gekozen reparatie kantelt er nul.

De merge stond bovendien al één keer op papier, en **niet als afgewezen weg maar als OPEN
BESLISPUNT** — `docs/UI-SYNC-SETTINGS-RECON.md:119-123`, onder het kopje *"Ambiguïteiten / open
beslispunten"*: *"Alternatief = PUT naar partial-merge ombouwen (wijkt af van het gekozen contract).
**Beslispunt.**"* Gekozen is destijds full-replace, en dat is nooit herzien. *(Ik schreef eerst dat
de merge daar "afgewezen" was; dat was een overclaim, gevangen door weerleggingspas 2 en hier
rechtgezet.)*

De vorm die WEL alle drie bedient is veel kleiner: laat full-replace met rust en laat een expliciete
`null` betekenen wat een weggelaten veld al betekent.

### R3 — NIET TE METEN, en dat is geen "houdt"

De verwachting was de prod-rij read-only te meten. Dat kon niet:

```
npx wrangler d1 execute cadans --remote  ->  code 7403
"The given account is not valid or is not authorized to access this service"
```

`npx wrangler whoami` toont een OAuth-token voor `dtkorteweg@gmail.com` op account
`9218229b9be1015defcbacc8c430ca34`, met scopes voor `workers`, `workers_scripts`, `pages` en meer —
maar **`d1` staat er niet bij**. Lezen op remote D1 kan met deze sessie dus niet, en de origin zit
achter een basic-auth-gate waarvan het wachtwoord een deploy-only secret is. **De blootstelling op
prod is dus NIET GEMETEN.**

Wat er wel is, is een sterke AFLEIDING — en zij is als afleiding gelabeld, niet als meting. Het
formulier biedt voor `fase` exact twee keuzes, `""` (Automatisch) en `"maintain"`, en de code zegt
erbij: *"leeg = automatisch (weggelaten uit de body → null)"*. Wie nooit "Onderhoud (maintain)" heeft
gekozen, heeft `fase` op null. Dat is de default-toestand.

### Wat er gebouwd is

**EEN EXPLICIETE `null` IS EEN LEGE WAARDE, GEEN TYPEFOUT.** In
`workers/api/src/routes/api.ts` geven `numField` en `strField` nu `null` terug in plaats van te
gooien; de `doelStart`-tak accepteert `null` naast een geldige ISO-datum; en de drie
presentatie-velden gebruiken `?.slice(0, 24) ?? null` zodat de cap niet op een null klapt.

De grond staat in het wire-type zelf. `packages/shared/src/settings.ts` typeert **elk** veld als
`T | null`, en de docstring beweerde tegelijk *"expliciete null → 400"*. De runtime ging dus tegen
zijn eigen gepubliceerde type in. Die docstring is meegewijzigd.

**WAT NIET IS GEWIJZIGD:** `writeSettings`, de full-replace-semantiek, de lassing tussen `doel` en
`doelStart`, en geen enkele aanroeper. `packages/engine` is niet aangeraakt.

**EN ÉÉN COMMENTAAR IS RECHTGEZET.** De route beweerde *"writeSettings VERVANGT de rij volledig"*.
GEMETEN: de tabel heeft **21 kolommen**, `vals` dekt `user_id` plus **16 velden**.
`threshold_pace`, `ftp_auto_update`, `weight_auto_update` en `email_digest` staan er niet in en
blijven bij een update onaangeroerd. "Volledig" was onjuist; het commentaar zegt nu wat er echt
gebeurt.

### De omvang van het defect, gemeten

```
settings-rij (lokale D1) : 21 kolommen, 5 op NULL
                           threshold_pace · fase · ftp_auto_update · weight_auto_update · email_digest
notNull-kolommen         : GEEN, behalve de primary key
```

Elk van de zestien velden die de route accepteert kon dus een 400 geven. En het was niet `fase` die
als eerste zou gooien in het algemene geval: de negen `numField`-poorten staan op positie 1 tot en met
9 en `fase` pas op 11, dus een leeggelaten `doelDuur` of `lthr` gooit eerder. Dat het op deze rij
`fase` was, is een eigenschap van deze rij en niet van de code.

### Strings

**ÉÉN NIEUWE, en het is de eerste van zijn soort in dat bestand.** In
`apps/web/src/lib/coachNarrative.ts`:

```
export function schrijfMisluktRegel(watNietGebeurde: string): string
  -> "Niet gelukt — je doel is niet gewijzigd. Probeer het zo nog eens."
  -> "Niet gelukt — je antwoord is niet bewaard. Probeer het zo nog eens."
```

Geen bestaande string is gewijzigd. De regel noemt alleen de UITKOMST die uitbleef en geen oorzaak,
want de client kan een 400 niet van een netwerkfout onderscheiden — `putSettings` gooit een kale
`Error`. Hij toont ook de rauwe serverstring niet: die luidt `field 'fase' has wrong type`, Engels en
technisch, en hoort niet in een Nederlandstalige coach-kaart.

### Tests

**ROOD GEMETEN VÓÓR DE REPARATIE.** Vier nieuwe tests in `workers/api/test/routes.writes.test.ts`
faalden alle vier, en de belangrijkste — *"een VOLLEDIG settings-object mét nulls landt — de
doel-wissel van punt 73"* — met precies `expected 400 to be 200`. Dat is het live defect,
gereproduceerd in de harness. Na de reparatie: 20 van 20 groen in dat bestand.

NIEUW: *"null op een NUMERIEK veld wordt aanvaard en cleart, net als weglaten"*, *"null op een
STRING-veld wordt aanvaard en cleart"*, *"null op doelStart wordt aanvaard en cleart"*, en de
regressievangst hierboven. Plus drie in `apps/web/src/lib/coachNarrative.test.ts` op
`schrijfMisluktRegel`.

BESTAANDE TESTS DIE HET CONTRACT VASTPINNEN EN DIE ONGEWIJZIGD MEEGAAN: *"weekUren weggelaten →
FULL-REPLACE cleart naar null"* (`routes.writes.test.ts:105`), de vijf 400-tests op verkeerde TYPES in
hetzelfde bestand, en het hele `describe` *"settingsFormToBody (FULL-REPLACE-serialisatie)"* in
`apps/web/src/lib/settings.test.ts`. **Geen enkele bestaande test is aangepast** — dat is de toets
dat de semantiek niet verschoven is.

### De twee weerleggingspassen

**PAS 1 — VOOROP, vóór er een regel geschreven was. VIER VAN DE VIER LENZEN VOLTOOID, nul gestorven.**
Drie van de vier haalden hun claim onderuit, en zij hebben deze ronde van ontwerp doen veranderen.

| lens | uitkomst |
| --- | --- |
| `null-velden` | **VOLTOOID** · weerlegd: JA — `fase` is niet het enige null-veld en niet de eerste worp |
| `semantiek` | **VOLTOOID** · weerlegd: JA — de merge is de verkeerde vorm |
| `stille-fout` | **VOLTOOID** · weerlegd: JA — het zijn er veertien, niet één |
| `punt69-pasvorm` | **VOLTOOID** · weerlegd: JA — de goedkeuring van punt 69 is TWEE schrijfacties |

Wat kantelde: (1) mijn merge-ontwerp, met de doel/doelStart-lassing als beslissend argument; (2)
"`fase` is het enige null-veld" — het zijn er vijf, en in het algemene geval gooit een numeriek veld
eerder; (3) "één stille catch" — het zijn er veertien; (4) de vondst van een DERDE aanroeper
(`tools/shots/shot.mjs`) die het probleem al had opgelost.

**PAS 2 — op de GEBOUWDE code, vóór de commit. DRIE VAN DE DRIE VOLTOOID, en GEEN ENKELE weerlegde de
reparatie.**

| lens | uitkomst |
| --- | --- |
| `breekt-iets` | **VOLTOOID** · **NIET WEERLEGD** |
| `lost-het-op` | **VOLTOOID** · **NIET WEERLEGD** |
| `zichtbaarheid` | **VOLTOOID** · **NIET WEERLEGD** |

Wat pas 2 wél opleverde, en het is alle drie keer nagemeten en gerepareerd:

1. **Een overclaim van mij.** Ik schreef dat de merge in `docs/UI-SYNC-SETTINGS-RECON.md` "afgewezen"
   was. Hij staat daar onder *"Ambiguïteiten / open beslispunten"* en eindigt op *"**Beslispunt.**"* —
   OPEN, niet afgewezen. Rechtgezet op drie plaatsen.
2. **Drie docstrings die het oude contract bleven verkondigen** — `apps/web/src/lib/api.ts`,
   `apps/web/src/lib/settings.ts` (twee keer) en `docs/UI-SYNC-SETTINGS-RECON.md`. Allemaal bijgewerkt.
3. **Een gat in mijn eigen regressietest**: die stuurde dertien van de zestien sleutels en liet precies
   de drie presentatie-velden weg — de regels die deze ronde herschreef naar `?.slice(0, 24) ?? null`.
   Aangevuld tot alle zestien, plus een assertie dat `coachNaam` en `naam` als null landen in plaats van
   op `null.slice` te klappen.

En één inhoudelijke vondst die bleef staan: **de lege string is iets DERDES.** `""` passeert `strField`
en landt als `''` in D1, niet als NULL. Dat was vóór deze ronde al zo en is niet gewijzigd, maar het is
nu vastgepind met een eigen test — de docstrings beweerden er ten onrechte "geeft 400" over.

Verder bevestigde pas 1 twee dingen zelfstandig die ik daarna heb nagemeten: `numField`/`strField`
hebben precies **twee** aanroepplekken (de settings-PUT en de planner-PUT), en de planner-tak guard't
met `== null` **vóór** de helper, dus die route ziet nooit een null en is byte-identiek gebleven.

### De deploy

**GEDAAN, met Daans akkoord en niet onder auto.** De volledige regel staat in
`docs/PROD-STAND.md`.

```
nieuwe versie  0fcb0ddf-1796-4084-ae6e-0062c7033a28   (100%, 2026-08-24T14:53:25.510Z)
weg terug      npx wrangler rollback 940414c4-be95-4968-9eef-542a188db563
```

De weg terug is VOORAF geverifieerd in `wrangler versions list` (die houdt er tien; het doel stond
er als nieuwste in). Geen migratie, geen D1-mutatie. Na-verificatie: de versie draait op 100 procent
en de geüploade bundelnaam is gelijk aan die in de lokale `apps/web/dist/index.html`. **CC-CHECKS 37
is NIET gedraaid** — de byte-vergelijking vraagt de live `index.html` en de origin zit achter een
basic-auth-gate met een deploy-only secret. Wat Daan moet aanklikken om de reparatie zelf te zien,
staat in `docs/PROD-STAND.md`.

### Wat NIET is gerepareerd, en dat is een bewuste grens

De stille `catch` is niet één plek maar een SJABLOON: gemeten **14 `catch {`-blokken in 12
coach-kaartbestanden**. Er is geen gedeelde foutcomponent — het meldingspatroon staat handmatig
herhaald op de pagina's. Deze ronde repareert de kaart waar het defect zich voordeed en laat de andere
staan; dat is opgenomen als een eigen ROADMAP-punt in plaats van half gedaan.

---

## 13. DE HERKENNER — GEMETEN, EN HIJ BESTAAT NIET

Ronde van 24-08-2026, meten en kalibreren. **Er is geen herkenner gebouwd, en dat is de uitkomst:
alle drie de kandidaten vielen om, en de vierde — mijn eigen alternatief — ook.** Wat er wél uit
kwam is groter dan de vraag: **de staande drempelwaarde wordt door geen enkele rit van het afgelopen
jaar gedragen.**

### Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang 9d99910    boom            schoon
claude --version 2.1.208 (Claude Code)
```

Agent-discovery blijft **NIET GEMETEN**. Nummering: `docs/ROADMAP.md:2014` draagt punt 69, in de
volgorde `11d-9`.

### Het besluit dat deze ronde nodig maakte

Het FTP-voorstel hangt aan de RIT en niet aan de agenda: rijdt Daan een inspanning waar een
drempelwaarde uit te halen valt, dan stelt de app die voor, ook zonder aangeboden test. Twijfelt de
app, dan toont zij NIETS. De grond is goed — de koppeling plan→rit is structureel zwak (§5.2) — en
door de rit zelf te laten beslissen vervalt die koppeling als afhankelijkheid.

**De meting hieronder laat zien dat de VOORWAARDE van dat besluit niet vervuld kan worden.** "Een
inspanning waar een drempelwaarde uit te halen valt" is op deze data niet herkenbaar.

### (a) Welke signalen zijn er, en (b) welk signaal scheidt

**GEEN ENKEL.** Gemeten op **222 fiets-ritten** (`Ride` plus `VirtualRide`, 2025-07-06 t/m
2026-08-04, 394 dagen) uit de lokale D1.

**EERST EEN FOUT VAN MIJZELF, want zij bepaalde de rest.** Ik begon met een filter op `type='Ride'`
en had daarmee **14 rijen** buiten beeld — waaronder de meest test-achtige rit van de hele reeks:
2026-01-13, een `VirtualRide` van **20 minuten op IF 100,77**, de enige rit met IF ≥ 100 van de 222.
Dat filter produceerde ook een VALS LABEL: ik telde 2026-01-17 als sprong, maar daar DAALT
`rolling_ftp` van 277 naar 276; de echte sprong (+10) lag vier dagen eerder, op die VirtualRide.
Gevangen door de weerleggingspas, daarna zelf nagemeten.

**DE SPRONG IN `rolling_ftp`** — Daans kandidaat, en al per rit opgeslagen. Alle 57 veranderingen
over de reeks:

```
-1  achtenveertig keer      +1   EEN keer
-2  vijf keer               +10  een keer
                            +11  een keer
                            +29  een keer
```

Er zijn dus **DRIE** sprongen en niet vier. De vierde die ik meende te zien is een stap van **+1** —
exact even groot als de decay-stap die 48 keer voorkomt. Dat is de ruisvloer als signaal lezen. Drie
sprongen over 394 dagen; over alleen de twee `Ride`-sprongen is dat 197 dagen per sprong, wat
overeenkomt met wat `docs/TRAININGSMODEL.md` zelf al vastlegt ("ongeveer 182 dagen"). Mijn eerdere
"één per 98 dagen" was het artefact.

**DE SPRONGEN EN DE TWINTIGMINUTENWAARDE, en hier moet ik mijn eigen formulering bijstellen.** Ik
schreef eerst dat de sprongen NIET vallen op de ritten die het beste twintigminutenvermogen dragen.
Dat is waar voor de twee VENSTER-beste ritten, maar ONWAAR voor de grootste sprong van de reeks, en
dat weerlegde geval draait de betekenis om. Op 2025-07-17 valt de sprong van +29 wél op de rit met de
hoogste piek van het hele jaar (310 W) — en daar geldt `0,95 × 310 = 294,5` tegenover een
`rolling_ftp` die op **295** uitkomt. **Op die ene rit reproduceert de M93-formule intervals' eigen
schatting tot op een halve watt.** Dat is een onafhankelijke getuige die mijn nieuwe kolom bevestigt
op een waarde die lang vóór de backfill al in D1 stond.

Wat overeind blijft, is de zwakkere maar nog altijd dragende vorm: de ritten die de VENSTERS op
`secs = 1200` aanwijzen, springen niet:

```
1y-venster,  secs=1200 -> 268 W   rit i102823590   2025-10-20  61 min  IF 90,37
                                  rolling_ftp 278 vóór -> 278 op de rit   GEEN SPRONG
90d-venster, secs=1200 -> 268 W   rit i158575314   2026-06-19 120 min  IF 81,82
                                  rolling_ftp 270 vóór -> 270 op de rit   GEEN SPRONG
```

Geen van beide staat in de drie sprongen. En omgekeerd dragen de sprongen zelf middelmatige
twintigminutenwaarden: 2026-01-13 geeft **227 W** ondanks IF 100,77 (een variabele intervalrit, geen
volgehouden inspanning) en 2026-05-21 geeft **225 W**. De detector is niet zwak — hij is
**anti-gecorreleerd** met wat we nodig hebben.

**DE OVERIGE VELDEN.** Op `if_pct` is de overlap grof: 95 van de 202 niet-springers (47 procent)
staan op of boven de laagste springer. En `if_pct` is bovendien een BEWEGENDE maat — het is
`norm_w / ftp` van dát moment, en `ftp` verspringt vier keer binnen de reeks.

### (c) Waar ligt de drempel

**NERGENS, want er is niets om een drempel op te leggen.** Een leave-one-out op de vier labels laat
zien dat de noemer op de beslissende dimensie feitelijk **N=1** is: laat je het (valse) label
2026-06-16 weg, dan schuift de IF-grens van 76,36 naar 81,82 en kantelen 35 van de 202 ritten; laat
je een van de andere weg, dan verschuift er niets. Eén geval draagt de hele drempel, en dat geval is
een tik van één watt op een integer.

### DE ANDERE WEG, en die viel ook om

Ik ontwierp onderweg een alternatief dat de herkenner overbodig leek te maken: **een maximale
inspanning bewijst alleen iets NAAR BOVEN** — je kunt onder je kunnen rijden, nooit erboven — dus
stel alleen een HOGERE drempelwaarde voor en laat een lage waarde niets doen. Elegant, en op deze
data dood.

Gemeten op de volle reeks, met de backfill uit §14 als grondstof:

```
215 ritten met een twintigminutenwaarde
piek_1200_w:  min 118   p25 186   med 208   p75 232   p90 249   p95 258   max 310

staande FTP 280  ->  vuren vraagt een piek boven 294,7 W
ritten die dat halen: 1 van 215   (2025-07-17, 310 W -> voorstel 294 W)
```

Die ene rit heet **"De Ronde Venen - FTP build up"**, duurt 88 minuten op IF 92,22, draagt de grootste
`rolling_ftp`-sprong (+29), en ligt met 310 W **39 watt (14,4 procent)** boven de nummer twee. Drie
onafhankelijke signalen wijzen dezelfde rit aan. Dat is bemoedigend — en het helpt niet:

```
venster 365d (195 ritten)  beste piek 268 W -> 255 W   ritten boven 280: 0
venster  90d ( 51 ritten)  beste piek 268 W -> 255 W   ritten boven 280: 0
venster  42d ( 23 ritten)  beste piek 261 W -> 248 W   ritten boven 280: 0
```

**Die ene vurende rit is 383 dagen oud en valt dus BUITEN het jaarvenster.** In de laatste twaalf
maanden vuurt de regel **nul keer**, en dat is geen schatting maar een bovengrens: het
venstermaximum is per constructie een bovengrens op elke afzonderlijke rit erin.

### WAT DE METING WÉL OPLEVERT — en hier had ik het eerst MIS

Mijn eerste conclusie luidde: *"de staande drempelwaarde van 280 W wordt door geen enkele rit van het
afgelopen jaar gedragen, dus hij staat te hoog."* **Weerleggingspas 2 haalde dat onderuit en ik heb
het zelf nagemeten. De rekensom klopte; de gevolgtrekking niet.**

**EERST DE FOUT DIE ERONDER LAG.** Ik schreef eerder dat `powerModels` op de intervals-respons null
is. Dat was gemeten op de PER-RIT-kromme van één Z2-rit. De GECACHTE VENSTER-krommes dragen hem wél,
en daar staat het antwoord in:

```
venster 1y   FFT_CURVES  ftp 277   (criticalPower 271)
             ECP         ftp 271   (criticalPower 271)
venster 90d  MS_2P       ftp 283
             FFT_CURVES  ftp 266
             MORTON_3P   ftp 249
```

**De staande 280 ligt BINNEN die band en 3 watt van de jaarschatting.** Mijn afgeleide 255 ligt onder
alle modellen. De drempel staat dus niet te hoog — en ik had dat kunnen weten uit data die al in D1
stond. Eén probe op één rustige rit, en ik generaliseerde hem naar de hele bron.

**EN DE TWEE LEZINGEN ZIJN WÉL TE SCHEIDEN**, wat ik ook ten onrechte ontkende. Ik schreef dat de app
niet kan uitmaken of de drempel te hoog staat of dat er niet vol gereden is. Dat kan zij wel, en het
staat in dezelfde tabel:

```
kwartaal   n    max piek   gem piek   ritten IF >= 90   aandeel
2025Q3    57      310       212,5           7           12,3%
2025Q4    49      268       207,9           6           12,2%
2026Q1    36      254       209,2           2            5,6%
2026Q2    54      268       207,8           0            0,0%
2026Q3    19      261       215,4           0            0,0%
```

**In de laatste twee kwartalen staat GEEN ENKELE van de 73 ritten op IF ≥ 90.** Dat is een telling,
geen gevolgtrekking. En de pieken zelf DALEN niet: de regressie over de 195 ritten in het jaarvenster
loopt **+0,0162 W per dag, oftewel +5,9 W per jaar**, en het laatste kwartaal draagt het HOOGSTE
gemiddelde van de vijf.

**Vlakke tot licht stijgende pieken bij nul harde ritten is het patroon van "er is niet vol gegaan",
niet van conditieverlies.** Het jaarbeste van 268 W bevestigt dat van de andere kant: die waarde komt
van een rit van 120 minuten op IF 81,82 met een gemiddelde van 173 W, en diezelfde rit zet ook de
punten op 1800, 2400 én 3600 seconden. Dat is een plak uit een lange duurrit, geen
twintigminuteninspanning.

**DE JUISTE CONCLUSIE IS DUS DE OMGEKEERDE VAN MIJN EERSTE.** Er is geen bewijs dat de drempelwaarde
te hoog staat. Er is bewijs dat er in een jaar geen maximale twintigminuteninspanning is gereden — en
dat is precies de toestand waarvoor het ijkaanbod bestaat.

### De drie verwachtingen

| | uitkomst |
| --- | --- |
| **S1** — er bestaat een signaal dat scheidt, met kleine genoeg overlap | **VALT** |
| **S2** — de herkenner werkt zonder de streams-route | **HOUDT** |
| **S3** — intervals' schatting mag als DETECTOR, want zij bepaalt de waarde niet | **VALT** |

**S3 viel op de norm en niet op de meting, en het antwoord stond er al.** De detector-lezing is op
23-08-2026 BIJ NAAM beoordeeld en verworpen, één dag vóór M93 werd besloten —
`docs/TRAININGSMODEL.md`, verbatim: *"Het detector-argument - een sprong toont dat er hard gereden is
- haalt de eindstreep niet: hij toont niet WELKE waarde het blok moet doseren, en juist die waarde is
het onderwerp van de ijking."* Die grond hangt NIET van de polariteit af: hij geldt even hard of de
proxy het aanbod nu onderdrukt of aanzet. En de code draagt dezelfde grens al dragend —
`apps/web/src/lib/effect.ts:220`, verbatim: *"een sprong als bewijs van gelegenheid gebruiken is
CIRCULAIR. (…) zou een sprong zelf de gelegenheid zijn, dan is "geen sprong" per definitie "geen
gelegenheid""*.

Daarmee valt ook de laatste steun onder "toont de app niets bij twijfel": **een regel die bij twijfel
zwijgt IS een onderdrukkingsregel**, en dat is precies de stille toestand die M91 uitsluit.

### De twee weerleggingspassen

**PAS 1 — VOOROP, vóór de kalibratie. VIER VAN DE VIER VOLTOOID, en alle vier weerlegd.**

| lens | uitkomst |
| --- | --- |
| `scheider` | **VOLTOOID** · weerlegd — mijn labels deugden niet |
| `asymmetrie` | **VOLTOOID** · weerlegd — de alleen-omhoog-variant vuurt nul keer |
| `noemer` | **VOLTOOID** · weerlegd — de noemer is feitelijk N=1 |
| `norm` | **VOLTOOID** · weerlegd — de detector-lezing was al bij naam verworpen |

**PAS 2 — op de KALIBRATIE, vóór de commit. DRIE VAN DE DRIE VOLTOOID; één niet weerlegd, twee wel.**

| lens | uitkomst |
| --- | --- |
| `meting-deugt` | **VOLTOOID** · **NIET WEERLEGD** — de meetketen houdt op elke toets |
| `anker` | **VOLTOOID** · weerlegd — "280 staat te hoog" is niet gerechtvaardigd |
| `aanbeveling` | **VOLTOOID** · weerlegd — mijn advies rustte op een weg die niet bestaat |

**WAT PAS 2 BEVESTIGDE.** De backfill reproduceert wat er onafhankelijk al in D1 stond: beide
gecachte vensters wijzen op `secs = 1200` een rit aan, en diezelfde rit draagt in `activities` exact
dezelfde waarde (268/268, twee treffers op twee). Het venstermaximum klopt in beide vensters; op het
90d-venster is de dekking 50 van 50 en daarmee sluitend. De zes mislukte ritten vallen **één-op-één**
samen met de zes fiets-ritten zónder enige vermogensdata — er is geen kandidaat verloren gegaan. De
ene rit zonder 1200-punt duurt acht minuten, en geen enkele rit korter dan twintig minuten draagt een
waarde. Dekking **215 van 222 = 96,85 procent**.

**WAT PAS 2 OMVER GOOIDE — en het waren mijn conclusies, niet mijn metingen.** Alle drie hierboven
uitgeschreven: `powerModels` is niet null op de vensterkrommes (dus 280 ligt binnen intervals' eigen
band), de twee lezingen zijn wél te scheiden (nul ritten op IF ≥ 90 in twee kwartalen bij een vlakke
tot stijgende piekreeks), en mijn aanbeveling verbood de bouw waar zij naar verwees.

**EEN GRENS DIE BLIJFT STAAN:** de kalibratieset houdt op **2026-08-04** en is dus twintig dagen oud;
de gecachte krommes zijn van 2026-08-07 en 2026-07-28. "De laatste 365 dagen" is gemeten vanaf de
laatste rit en niet vanaf vandaag.

### (d) Wat het kost in gebruik

Weinig, en dat is de enige onbeschadigde uitkomst. De twintigminutenwaarde komt uit
`GET /activity/{id}/power-curve`, **5353 bytes en één verzoek per rit**, tegen 363535 bytes voor de
streams-route. **S2 HOUDT.** En Cadans draagt het venster-antwoord vandaag al: `power_curve_cache`
bevat `secs`/`values`/`activity_id` als parallelle arrays, dus het beste twintigminutenvermogen én
welke rit het zette staan al in D1 zonder enige nieuwe aanroep.

---

## 14. DE BACKFILL — GEDRAAID

**Met Daans akkoord, niet onder auto**, na een droge run op vijf ritten die vijf waarden opleverde
(240 · 184 · 240 · 212 · 173 W), nul mislukt en **niets weggeschreven**.

```
verzoeken aan intervals.icu : 222   (harde bovengrens 230, GOOIT bij overschrijding)
waarde gevonden             : 215
geen exact 1200-punt        :   1
mislukt (HTTP)              :   6
weggeschreven               : 216 rijen
nog open na deze run        :   6   -> HERSTARTBAAR, hervat op piek_gehaald_op IS NULL
```

Het script is `tools/backfill/piek1200.mjs`. De vier randvoorwaarden zitten erin: gedoseerd
(250 ms), teller plus een bovengrens die GOOIT in plaats van door te gaan, herstartbaar, en
uitsluitend GET — met een vangnet op `globalThis.fetch` zodat een verzoek buiten de ene toegestane
functie om stukloopt in plaats van stil te vertrekken.

**DE WAARDE WORDT AFGELEZEN OP `secs = 1200` EN NERGENS ANDERS** — geen naburig duurpunt, geen lopend
maximum (ROADMAP punt 70).

### De migratie

**0013_brown_sage.sql**, forward-only, twee kolommen op `activities`:

```
ALTER TABLE `activities` ADD `piek_1200_w` integer;
ALTER TABLE `activities` ADD `piek_gehaald_op` text;
```

**LOKAAL TOEGEPAST, REMOTE NIET.** Die tweede kolom is wat de backfill herstartbaar maakt: zonder
haar is "geen bruikbare waarde" niet te onderscheiden van "nog niet opgehaald", en probeert elke
herstart de zes mislukte ritten opnieuw. Beide kolommen staan bewust NIET in `actValsFromRow`, dus de
activiteiten-sync raakt ze niet aan en de waarden overleven elke resync.

**REMOTE TOEPASSEN IS NIET GELUKT EN DAT IS PUNT 76:** `wrangler d1 execute --remote` geeft
`code 7403` omdat het token van deze sessie geen `d1`-scope draagt. De migratie staat lokaal en moet
op remote nog worden toegepast zodra dat token er is. Er is niets gedeployd deze ronde.

---

## 15. WAT DE BOUWRONDE MOET WETEN

**BOUW DE HERKENNER NIET.** Er is er geen, en de drie kandidaten zijn niet zwak maar verkeerd: de
sprong is anti-gecorreleerd met de twintigminutenwaarde, IF overlapt op bijna de helft van de reeks,
en de detector-lezing is normatief al verworpen.

**MAAR BOUW HET VOORSTEL WÉL.** Mijn eerste versie van deze sectie raadde dat af, en die aanbeveling
is door weerleggingspas 2 onderuit gehaald op twee punten die ik daarna zelf heb nagelopen.

**FOUT 1 — ik velde een verdict over ontwerp A met de meting van ontwerp C.** "Vuurt nul keer op een
heel jaar" is gemeten op de ALLEEN-OMHOOG-variant die ik zelf bedacht en verwierp. §6 zoals
geschreven kent helemaal geen richtingsbeperking. Er is dus niets gemeten dat §6 diskwalificeert.

**FOUT 2 — de weg die ik als kosteloze uitweg aanwees, bestaat niet.** Ik schreef dat het bestaande
ijkaanbod het probleem oplost "zonder één regel nieuwe code". Dat is aantoonbaar onwaar:
`PUT /api/ijking` draagt exact drie velden — `blok`, `doel`, `antwoord` — en geen enkel
vermogensveld, en nergens in de code staat een omrekening van een twintigminutenpiek naar een
drempelwaarde. **M93 is vandaag een norm zonder uitvoerder.** Rijdt Daan de test op 2026-09-21, dan
eindigt de keten bij een gereden rit en gebeurt er niets. §6 IS die ontbrekende schakel; mijn
aanbeveling verbood precies de bouw waar zij naar verwees.

**EN EEN NEERWAARTS VOORSTEL IS NIET VERBODEN.** Niets in M91, M92 of M93 sluit het uit — M93
randvoorwaarde (2) bestaat juist omdát neerwaartse voorstellen in scope zijn: zij eist een
plausibiliteitsgrens tegen een te lage waarde uit een rustige rit. De asymmetrie was mijn eigen
redenering en niet de norm.

**WAT DE BOUWRONDE DUS MOET DOEN:**

1. **Bouw §6, zonder richtingsbeperking.** Het voorstel toont de afgeleide waarde naast de staande en
   Daan keurt goed; pas dan is er geijkt (M91). Dat is de uitvoerder die M93 mist.
2. **Laat poort (ii) uit §6 stap 3 vervallen** — "de rit hoort bij een aangeboden test". Het
   rit-besluit van deze ronde haalt de agenda uit de keten, en de koppeling was toch al zwak (§5.2).
3. **De plausibiliteitsgrens is de open vraag, en zij is NIET "was dit een maximale inspanning".** Die
   vraag is deze ronde gemeten en onbeantwoordbaar gebleken. Wat er wél is: een grens die een
   ONGELOOFWAARDIGE SPRONG afwijst, in beide richtingen, ten opzichte van wat de reeks draagt. De
   backfill levert daar nu de grondstof voor — 215 waarden, `piek_1200_w` per rit — en intervals'
   eigen modellen (1y: 271 en 277) geven een tweede referentie om tegen te ijken.
4. **Neem de vergelijking mee met wat er al ligt.** Op de enige rit met een echte maximale inspanning
   reproduceerde M93 intervals' schatting tot op een halve watt. Dat is geen bewijs, maar het is de
   scherpste aanwijzing in de reeks dat de formule klopt.

**WAT ER GEEN WEG IS:** een voorstel dat bij twijfel zwijgt. Dat is een onderdrukkingsregel en zij
maakt de app stil in precies het geval waarin er iets te zeggen valt (M91).

**EN WAT DEZE RONDE TERLOOPS HEEFT OPGELOST:** punt 61, de doelcheck, stond geblokkeerd op de
ontbrekende grondstof — het beste twintigminutenvermogen per rit over een venster. Die staat er nu.

---

## 16. DE BOUW IS GESTOPT OP V1 — er moet tóch een getal gekozen worden

Ronde van 25-08-2026. **De migratie is geland, de norm is vastgelegd, en het voorstel is NIET
gebouwd.** V1 viel om, en zijn eigen clausule schrijft dan stoppen voor: *"VALT als er toch een getal
gekozen moet worden; dan stop je, want een drempel wordt op de echte reeks geijkt en niet in een
bouwronde bedacht."*

### Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang 3664e67    boom            schoon
claude --version 2.1.208 (Claude Code)
```

Nummer: punt 69, volgorde `11d-11`. Agent-discovery blijft **NIET GEMETEN**.

### De migratie op remote — GEDAAN

Met Daans akkoord, niet onder auto, en in één poging geslaagd.

```
VÓÓR   0013 open · activities 19 kolommen · 255 rijen (215 fietsritten)
NA     "No migrations to apply!" · activities 21 kolommen · 255 rijen (215 fietsritten)
       piek_1200_w en piek_gehaald_op bestaan · met_piek 0 (de backfill draaide alleen lokaal)
weg terug, VOORAF gemeten: D1 Time Travel, bookmark
       0000012f-00000000-000050d2-4de266acc7b50e97248a245a7c7729b0
```

**Daarmee is de laatste divergentie tussen lokaal en prod gesloten.** Rij-aantal en bestaande waarden
zijn ongewijzigd; de ingreep was puur additief.

### V1 — VALT. Er zijn TWEE getallen nodig, niet nul

Het ontwerp leunde erop dat de richtingsregel elke drempel overbodig maakt: alles hangt op een
vergelijking met de staande waarde. **Op Daans eigen data klopt dat niet, en het gat is groot.**

**(a) DE POORTEN KENNEN GEEN LEEFTIJD, en dat is meteen fataal.** De enige rit die vuurt is
`De Ronde Venen - FTP build up` van 2025-07-17 — **404 dagen oud**. Alle drie de poorten laten hem
door: het doel is FTP, er is een waarde op `secs = 1200`, en 294 W is hoger dan de staande 280. **Bij
oplevering zou de app dus onmiddellijk voorstellen om de drempelwaarde te verhogen op grond van een
rit van meer dan een jaar geleden.**

En het enige tijdstempel dat er is, helpt niet: `piek_gehaald_op` staat bij **alle 216** opgehaalde
ritten op dezelfde dag, `2026-08-24`. Die kolom kan een verse rit niet van een backfill-rit
onderscheiden. Er moet dus een LEEFTIJDSGRENS bij — en dat is een getal.

**(b) HET VOORSTEL IS BOVENDIEN ONGELOOFWAARDIG, en dat is precies wat M93 randvoorwaarde (2) moet
vangen.** De 294 W ligt boven élke schatting die intervals zelf op dezelfde data maakt:

```
venster 1y   FFT_CURVES 277 · ECP 271
venster 90d  MS_2P 283 · FFT_CURVES 272 · ECP 266 · MORTON_3P 249
voorstel     294        -> 11 W boven de hoogste van de zes, 17 W boven de jaarschatting
```

Mijn eigen §6 eiste die grens als poort (iii) — *"een plausibiliteitsgrens, want anders vuurt §5(3)"*
— en het ontwerp dat ik daarna maakte had haar laten vallen, in de veronderstelling dat de
richtingsregel haar verving. Dat doet zij niet: **de richtingsregel dekt alleen de OMLAAG-kant. Naar
boven staat er niets tussen.**

**Twee grenzen dus, allebei een gekozen getal, en M93 zegt met zoveel woorden dat zo'n grens op de
echte reeks geijkt wordt en nooit in een gesprek. Daarom stopt de bouw hier.**

### En nog drie dingen die eerst opgelost moeten worden

**(c) POORT 3 IS GEEN POORT.** M94 onderscheidt ONGEPLAND van BEWUST AANGEGAAN, maar dat onderscheid
staat niet in de gegevens: `day_state` draagt **6 rijen**, alle tussen 2026-07-14 en 2026-07-22, over
een reeks van 394 dagen met 209 dagen waarop gefietst is. Elke rit geldt dus als ongepland — ook de
rit die letterlijk "FTP build up" heet. En omgekeerd zou de meest test-achtige rit van de hele reeks
(2026-01-13, 20 minuten binnen op IF 100,77) als ongepland geweigerd worden. **De richtingsregel klapt
op deze data dicht tot "voorstel groter dan staande".**

**(d) OP 44 DAGEN IS NIET BEPAALD WELKE RIT TELT.** Er zijn 44 dagen met twee fietsritten die allebei
een twintigminutenwaarde dragen. Het ontwerp zegt niet welke het voorstel gebruikt, en het enige
bestaande idiom — `mergeDone`, waar de LANGSTE rit wint — kiest stelselmatig de verkeerde:

```
2025-07-08   75 min, piek 184, IF 67,41   tegenover   64 min, piek 240, IF 83,70
2025-07-11   72 min, piek 173, IF 62,96   tegenover   69 min, piek 249, IF 88,89
```

Dat is 56 respectievelijk 76 watt verschil, en de woon-werkrit wint.

**(e) ER IS GEEN BEWAARPLAATS VOOR "DIT VOORSTEL IS BEANTWOORD".** Migratie 0013 voegt twee kolommen
toe en geen ervan draagt een antwoord. Goedkeuren dooft zichzelf — de staande waarde stijgt naar het
voorgestelde getal, dus de poort wordt vanzelf onwaar — maar AFWIJZEN heeft geheugen nodig, anders
komt het voorstel bij elke laadronde terug. Hergebruik van `sync_state.ijking_*` botst bovendien met
poort (2b): dat drietal vervalt bij een doelwissel, dus een afgewezen voorstel zou daarna terugkomen.
Een eigen kolom vraagt een tweede migratie, en §6 van deze ronde verbiedt die.

### V2 — NIET UITGEPUT

Het schrijfpad uit punt 73 is niet op de proef gesteld, want er is geen goedkeurpad gebouwd. Wat
ervoor pleit staat er wel: sinds punt 73 accepteert `PUT /api/settings` een expliciete `null`, dus een
kaart die het volledige settings-object terugstuurt met een gewijzigde `ftp` landt zonder 400. Dat is
een verwachting en geen meting.

### V3 — VALT, en de vuring is TERECHT

De regressie over alle 215 waarden geeft **1 vuring, niet 0** — tegen de staande 280 én tegen de FTP
die op dat moment gold. V3's eigen clausule schrijft voor die rit te onderzoeken in plaats van de
regel bij te stellen tot hij zwijgt, en dat onderzoek pleit vóór de rit:

```
2025-07-17  "De Ronde Venen - FTP build up"  88 min  IF 92,22
piek 310 W -> voorstel 294 W   (staand 280, toen 270)
```

Vier onafhankelijke signalen wijzen dezelfde rit aan: de hoogste piek van de reeks met **39 W (14,4
procent)** voorsprong op de nummer twee, de grootste `rolling_ftp`-sprong (+29), een naam die de
inspanning benoemt, en een IF van 92,22. **Dit is geen vals alarm — dit is de regel die werkt.** De
premisse onder V3 was dan ook te ruim: punt 77 mat nul maximale inspanningen in de laatste twee
KWARTALEN, niet in de hele reeks van dertien maanden.

**En de marge-structuur is opvallend schoon.** De op een na hoogste kandidaat ligt **28 W ONDER** de
staande waarde, en er is geen enkele rit binnen 5 watt aan weerskanten. De poort staat dus nergens op
een mesrand — wat meteen de zorg wegneemt dat er voorstellen van één watt zouden ontstaan.

### De weerleggingspas

**VOOROP GEDRAAID, vóór er een regel gebouwd was. VIER VAN DE VIER VOLTOOID, nul gestorven, en alle
vier weerlegd.**

| lens | uitkomst |
| --- | --- |
| `vals-alarm` | **VOLTOOID** · weerlegd — de 404 dagen oude rit, en 294 W boven élk model |
| `regressie` | **VOLTOOID** · weerlegd |
| `richting` | **VOLTOOID** · weerlegd |
| `doorwerking` | **VOLTOOID** · weerlegd — §5(e) spreekt de canon tegen |

**PAS 2 IS NIET GEDRAAID**, met dezelfde grond als eerder: er is geen code gebouwd om aan te vallen.

### §5(e) MAG NIET GEBOUWD WORDEN — de opdracht botst hier met de canon

De opdracht vroeg de meetgelegenheid aan de GOEDKEURING te hangen in plaats van aan het RIJDEN, om
punt 66 op te lossen. **Dat spreekt een canon-zin tegen die vandaag al in code staat.**
`docs/TRAININGSMODEL.md` §13, verbatim: *"Valt de opening binnen de meetinterval-afstand van een reeds
gedane maximale inspanning, dan vervalt het aanbod zonder vraag: de drempel is dan vers en er valt
niets te bevestigen."* Dat is poort (7) in `apps/web/src/lib/testvoorstel.ts:533-542`.

Hang je de bron aan goedkeuring, dan telt een GEREDEN maar niet-goedgekeurde test niet meer als
gedane inspanning, vervalt het aanbod niet, en vraagt de app opnieuw om een test die net gereden is —
terwijl dezelfde paragraaf elke herkansing uitsluit. Daar komt bij dat **82 `it`-blokken** op het
huidige gedrag staan.

Punt 66 blijft dus open, en de weg ernaartoe loopt niet via deze ingreep.

### Wat de volgende ronde moet doen

1. **IJK DE TWEE GRENZEN OP DE ECHTE REEKS** — een leeftijdsgrens en een plausibiliteitsgrens. De
   grondstof staat er: 215 waarden in `activities.piek_1200_w`, plus intervals' zes modelschattingen
   als tweede referentie. M93 randvoorwaarde (2) eist dit met zoveel woorden.
2. **BESLIS WELKE RIT TELT** op een dag met twee ritten. Niet de langste — dat is gemeten de verkeerde.
3. **BESLIS WAAR HET ANTWOORD LANDT.** Dat vraagt een kolom en dus een migratie.
4. **LAAT §5(e) LIGGEN** tot punt 66 een weg heeft die de canon niet tegenspreekt.

---

## 17. DE PLAUSIBILITEITSGRENS IS NIET TE LEGGEN — en dat is meetbaar, niet gevoelsmatig

Ronde van 25-08-2026, tweede poging. **Er is opnieuw geen code geschreven, en deze keer op een
sluitende rekensom in plaats van een afweging.** §2 van de opdracht had dit geval voor-geautoriseerd:
*"VALT ER GEEN WERKBARE GRENS TE LEGGEN, dan bouw je het voorstel NIET en meld je dat."*

### Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang 943ec25    boom            schoon
claude --version 2.1.208 (Claude Code)
migratiestand    lokaal 0000-0013 · remote 0000-0013 — GELIJK
```

Nummer: punt 69, volgorde `11d-11b`. Agent-discovery blijft **NIET GEMETEN**.

### De grens uit intervals' modellen — DRIE keer onderuit, en de derde is dodelijk

Het voorstel was: laat de hoogste FTP-schatting uit `powerModels` de bovengrens zijn. Die schatting
ligt al in `power_curve_cache`, dus er is geen extra ophaling nodig. Dat klonk zuinig. Het werkt niet,
en de reden is rekenkundig.

**(1) DE GRENS HEEFT GEEN EIGEN WERKGEBIED.** Het venstermaximum op `secs = 1200` IS precies de
hoogste `piek_1200_w` van de ritten in dat venster. Zelf nagemeten op drie vensters, alle drie gelijk:

```
1y  venster 2025-08-25..2026-08-25  n=180  curve@1200 268  = max piek   GELIJK
90d venster 2026-05-27..2026-08-25  n= 38  curve@1200 268  = max piek   GELIJK
42d venster 2026-07-14..2026-08-25  n= 12  curve@1200 261  = max piek   GELIJK
```

En de hoogste modelschatting ligt op elk van die vensters BOVEN `0,95 × curve@1200`:

```
1y   hoogste model 277  tegenover 0,95 x 268 = 254,6   marge +22,4 W
90d  hoogste model 270  tegenover 0,95 x 268 = 254,6   marge +15,4 W
42d  hoogste model 264  tegenover 0,95 x 261 = 247,9   marge +16,1 W
```

Voor élke rit BINNEN het venster geldt dus `0,95 × piek ≤ 0,95 × curve < hoogste model`. **De grens
kan een rit in het venster nooit tegenhouden.** Hij kan alleen ritten BUITEN het venster raken — en
dat is precies wat het startpunt al doet. Een poort zonder eigen gevallen.

**(2) OP DE REEKS IS HIJ NIET TE IJKEN, alleen te bevestigen.** Van de 215 ritten vuurt er één op M94
(294 W). Alle zes kandidaatgrenzen — 249, 266, 271, 272, 277, 283 — blokkeren precies die ene, en
laten er precies nul over. Tussen 249 en 294,4 ligt geen enkele rit. De meting kan 283 dus niet boven
249 verkiezen; zij geeft voor elke kandidaat hetzelfde antwoord. **Dat is geen ijking maar een
bevestiging van een grens die elders al gekozen is** — precies wat M93 randvoorwaarde (2) uitsluit,
en precies de vorm die CHECK 40 verbiedt: een meting die niet kan falen.

**(3) EN OP VERSE DATA IS DE TOEGESTANE BAND LEEG.** Dit is de dodelijke. Op de ophaling van 24-08
staat de hoogste van de zes modellen op **277** (1y) en **270** (90d), terwijl `settings.ftp` op
**280** staat:

```
M94 eist    : voorstel > 280
de grens eist: voorstel <= 277
```

**Geen enkele waarde voldoet aan allebei.** De functie zou niet zelden vuren maar NOOIT. De 283 uit
het ontwerp bestaat alleen in de GECACHTE 90d-rij; op verse data is datzelfde model naar 253 gezakt.
De enige kandidaat die ooit boven de staande 280 uitkwam, is ook de meest beweeglijke.

**(4) EN HIJ IS CIRCULAIR.** Op een tweejaarsvenster nemen alle vier de modellen het punt
`(1200, 310)` — de rit die beoordeeld moet worden — als INPUTPUNT van hun eigen fit. De grens wordt
dan een functie van zijn eigen invoer, en welk model je pakt bepaalt de uitslag: ECP blokkeert, MORTON
laat door. Dezelfde circulariteit die de code al bij naam verbiedt in `apps/web/src/lib/effect.ts:220`.

**(5) NORMATIEF STAAT HIJ OOK NIET.** `powerModels` is intervals' eigen drempelschatting — dezelfde
grootheid als `rolling_ftp`, die op 23-08-2026 BIJ NAAM is verworpen als proxy in de zin die M91
verbiedt. En §13 van dit document legde al vast dat die grond **niet van de polariteit afhangt**: hij
geldt even hard of de proxy het aanbod onderdrukt of aanzet. Een geblokkeerd voorstel is materieel een
onderdrukt aanbod: geen voorstel, geen antwoord, geen zichtbare staat.

### Waarom de grens ook op de reeks zelf niet te leggen was

De andere weg die §2 openliet — een grens die op de reeks zelf rust — is gemeten en valt op haar eigen
manier. Hoe ver kan één rit boven het beste van de voorafgaande periode liggen?

```
venster 90d, n=209   med 0,769   p90 0,911   p95 0,963   p99 1,008   max 1,245
ritten boven 1,10: 1     boven 1,15: 1     boven 1,20: 1
```

Eén enkele rit overschrijdt het recente beste met meer dan 6 procent, en dat is met **1,245×** juist de
rit die wij op vier onafhankelijke gronden voor echt houden. **Een grens die strak genoeg zit om iets
te betekenen, verwerpt precies de enige echte doorbraak in de reeks.** Er zijn geen valse positieven om
hem van te onderscheiden, want de reeks bevat vrijwel geen maximale inspanningen (punt 77).

**Dat is de kern: kalibreren vraagt twee klassen, en deze reeks heeft er één.**

### De verwachtingen

| | uitkomst |
| --- | --- |
| **W1** — het startpunt is te dragen zonder tweede migratie en zonder nieuwe staat | **VALT** |
| **W2** — met startpunt én grens vuurt het op nul van de 215 | **VALT als TOETS** |
| **W3** — goedkeuren schrijft via de vorm uit punt 73 | **NIET UITGEPUT** |

**W1 VALT**, en de weerleggingspas wees een betere weg. Het project draagt al een vijfvoudig idiom voor
"dit voorstel mag niet terugkomen", en dat is ALTIJD een sleutel in DATA en nooit een constante in
code. Erger: `datum > D` is rekenkundig identiek aan `leeftijd < (vandaag − D)` — de constante ÍS de
leeftijdsgrens die het ontwerp zei te vermijden, en hij groeit elke dag met een dag zonder dat iemand
dat besluit. **Het alternatief kost niets extra:** laat de migratie die er tóch komt de
"beantwoord"-kolom SEEDEN voor elke rit die op dat moment al bestaat. Dan is het startpunt een
datafeit in plaats van een getal in de bron.

**W2 VALT ALS TOETS, en dat is een aparte vondst.** De nul die hij zou meten heeft DRIE onafhankelijke
oorzaken — de grens, het startpunt, en de vergelijkingsreferentie — en elk is in zijn eentje
voldoende. Een toets die één getal rapporteert waar drie oorzaken op uitkomen, onderscheidt niets. Wat
erbij hoort is een POSITIEVE CONTROLE: dezelfde ECHTE functie, met het startpunt verzet en de grens
uit, moet dan precies één keer vuren op een bij naam genoemde rit.

**W3 is opnieuw niet uitgeput**, want er is geen goedkeurpad gebouwd.

### De weerleggingspas

**VOOROP GEDRAAID, vóór er een regel gebouwd was. VIER VAN DE VIER VOLTOOID, nul gestorven, alle vier
weerlegd.**

| lens | uitkomst |
| --- | --- |
| `grens` | **VOLTOOID** · weerlegd — de band is leeg op verse data |
| `startpunt` | **VOLTOOID** · weerlegd — de constante is een vermomde leeftijdsgrens |
| `nul-vuring` | **VOLTOOID** · weerlegd — drie oorzaken, één getal |
| `schrijfpad` | **VOLTOOID** · weerlegd |

**PAS 2 IS NIET GEDRAAID**: er is geen code om aan te vallen.

### Wat er nu voorligt, en het is een keuze voor Daan

De app kan de waarde uitrekenen. Wat zij niet kan, is zelfstandig beoordelen of die waarde geloofwaardig
is — niet uit intervals' modellen (die kunnen het per constructie niet), en niet uit de reeks (die
bevat maar één klasse). Er blijven twee wegen:

**A. BOUW HET VOORSTEL ZONDER GRENS.** De app STELT VOOR en Daan BEVESTIGT — dat is M10, en daarmee is
hij zelf de plausibiliteitstoets. Hij ziet de rit, de duur, het vermogen en de factor naast de staande
waarde staan, en hij weet of hij die dag diep is gegaan. Een grens die het voorstel tegenhoudt, neemt
hem juist dat oordeel af. Wat er dan nog nodig is: het startpunt via de geseede kolom, en de
antwoord-kolom.

**B. WACHT TOT ER EEN ECHTE TEST IN DE DATA ZIT.** Het ijkaanbod komt op **2026-09-21**. Rijdt Daan die
test, dan draagt de reeks voor het eerst een maximale inspanning binnen het venster, en pas dan valt er
iets te kalibreren.

Deze ronde kiest niet tussen A en B — dat is een besluit over Daans eigen training, en de meting geeft
hem de grond eronder.

---

## 18. DE BOUW — WEG A, ZONDER REM (25-08-2026)

Besluit van Daan: **bouw het voorstel ZONDER plausibiliteitsgrens; de renner is de plausibiliteitstoets.**
Weg A uit §17. Deze sectie verantwoordt wat er gebouwd is.

### 18.0 Omgevingsverklaring

```
werkpad          /c/Users/daan/Projects/cadans
git-dir          .git       git-common-dir  .git      -> HOOFDCHECKOUT, geen worktree
branch           main       origin/main     0 achter, 0 vooruit
HEAD bij aanvang c081dce
training         HEAD 3e8090a, gevolgde boom SCHOON
```

**Over `training`.** De gevolgde boom is schoon en HEAD staat op `3e8090a`, zoals voorgeschreven.
`git status` meldt daar wél vier ONGEVOLGDE mappen — `_import-design/`, `_import-design-2/`,
`_import-design-4/` en `design_handoff_cadans/`. Die zijn van 07 en 08-06-2026 en dus twee maanden
ouder dan deze sessie; ze zijn niet door een ronde gemaakt. Vermeld omdat "onaangeroerd" anders een
blindere bewering is dan zij hoort te zijn.

**EEN GAT IN DEZE VERANTWOORDING, en het is beter het te melden dan het glad te strijken.** De prompt
droeg drie genummerde verwachtingen, X1 tot en met X3. Die nummering is bij het omslaan van het
contextvenster verloren gegaan en staat nergens in de repo, dus ik kan ze niet VERBATIM citeren — en
ze parafraseren zou er precies het soort nieuwe regel van maken dat de werkwijze verbiedt. Wat
hieronder staat is dus geordend naar INHOUD en niet naar hun etiket: het startpunt (18.2), de poort op
de echte reeks (18.3) en het schrijfpad (18.4). Wie de nummering terug wil, leest de prompt van
25-08-2026 na.

### 18.1 Wat er gebouwd is

| bestand | rol |
| --- | --- |
| `workers/api/drizzle/0014_mean_reaper.sql` | de kolom plus de SEED |
| `workers/api/src/ftpvoorstel.ts` | de poortlogica, puur |
| `workers/api/src/integrations/ritpiek.ts` | de RUNTIME-vuller van `piek_1200_w` |
| `workers/api/src/db/repo.ts` | lezen, en het goedkeur-schrijfpad |
| `workers/api/src/routes/api.ts` | `GET` en `PUT /api/ftp-voorstel`, plus de sync-inhaak |
| `apps/web/src/components/schema/FtpVoorstelCard.tsx` | de kaart |
| `apps/web/src/lib/coachNarrative.ts` | de zin die de herkomst draagt |

De engine is NIET aangeraakt: `git diff --stat packages/engine` is leeg. `packages/shared` ook niet.

### 18.2 HET STARTPUNT: de migratie SEEDT de antwoord-kolom

De datum-constante uit §16 is vervallen. In haar plaats seedt de migratie zelf:

```sql
ALTER TABLE `activities` ADD `ftp_voorstel_antwoord` text;
UPDATE `activities` SET `ftp_voorstel_antwoord` = 'geseed' WHERE `ftp_voorstel_antwoord` IS NULL;
```

**WAAROM DIT EN NIET EEN DATUM IN DE BRON.** Een grens `datum > D` is rekenkundig identiek aan een
LEEFTIJDSGRENS en groeit elke dag mee zonder dat iemand daar nog een besluit over neemt. Deze seed is
één handeling die daarna nooit meer verandert: wat er op het moment van migreren stond geldt als
beantwoord, wat daarna binnenkomt doorloopt de poorten gewoon.

**VORM-AFWIJKING, bewust en gemeld.** De migraties 0000 t/m 0013 zijn puur schema uit
`drizzle-kit generate`. De `UPDATE` is met de hand toegevoegd en komt dus niet uit `schema.ts` terug.
Dat is veilig omdat de generator alleen NIEUWE migraties schrijft en toegepaste bestanden niet
herschrijft.

**LOKAAL TOEGEPAST:** 262 rijen, 262 geseed, 0 open.

**WAT DE SEED NIET IS.** Zij is een momentopname, geen invariant. Een rit met een OUDE datum die NA de
migratie binnenkomt (late sync, handmatige upload, herstelde activiteit) is een volwaardige kandidaat,
en omdat de hoogste piek wint kan hij een rit van vandaag verslaan. Dat is de bedoelde werking —
kandidatuur hangt aan AANKOMST, niet aan ritdatum — maar het is precies de reden dat de kaart de
DATUM moet tonen. Zie 18.6.

### 18.3 DE POORT OP DE ECHTE REEKS

`kiesFtpVoorstel` heeft vier poorten, in deze volgorde:

1. `doel !== "FTP"` → niets. M93 randvoorwaarde (1).
2. geen bruikbare staande waarde → niets.
3. rit zonder waarde op het duurpunt → overslaan.
4. `voorstel <= staand` → overslaan. **M94: alleen omhoog.**

**POORT (2) IS EEN GEMETEN VAL EN GEEN FORMALITEIT.** `settings.ftp` is nullable — het is naast
`user_id` de enige kolom zonder `NOT NULL` — en in JavaScript is `294 > null` **WAAR**, omdat `null`
naar 0 wordt gedwongen, terwijl `294 > undefined` **ONWAAR** is. Dezelfde afwezigheid, de omgekeerde
poort. Zonder deze expliciete toets zou ELKE rit een voorstel opleveren zodra het FTP-veld leeg staat:
alle 215 tegelijk.

**DE DAGKEUZE GAAT OP DE HOOGSTE PIEK, niet op de langste rit.** Gemeten: op 44 dagen dragen twee
fietsritten allebei een waarde, met een mediaan verschil van 43 watt en een uitschieter van 156. Het
huisidioom `mergeDone` kiest de LANGSTE rit, en dat is stelselmatig de rit met de LAGERE piek — op de
enige dag die in de hele reeks een voorstel oplevert zou dat 154 W zijn in plaats van 310. Bij een
GELIJKE piek wint de nieuwste rit.

**DE REGRESSIE HEEFT TWEE HELFTEN, met opzet.** Een toets die alleen "nul voorstellen" meet, slaagt
ook als de poort per ongeluk ALTIJD zwijgt — een typefout in een kolomnaam zou hem groen laten
(CC-CHECKS CHECK 40).

- **MET de seed:** nul kandidaten, dus nul voorstellen.
- **ZONDER de seed:** precies **ÉÉN** voorstel over de 215 waarden, op **De Ronde Venen - FTP build
  up**, piek **310 W**, voorstel **295 W**. De marge is schoon: geen enkele andere rit komt binnen
  5 watt van de drempel.

Die 295 is bovendien exact wat intervals' eigen `rolling_ftp` na die rit aanwees. Dat is een
BEVESTIGING en geen ijkpunt — één samenval kalibreert niets, en dat is nu juist de grond waarop de
plausibiliteitsgrens in §17 sneuvelde.

### 18.4 HET SCHRIJFPAD

`PUT /api/ftp-voorstel` neemt de WAARDE niet uit de body. Bij `goedgekeurd` berekent de route het
voorstel OPNIEUW en geeft 409 als het niet bij de aangeleverde rit hoort. Een client kan dus geen
willekeurige drempelwaarde wegschrijven en M93 staat op één plek.

De FTP-kant is PARTIEEL. `writeSettings` is FULL-REPLACE — die schrijft `?? null` voor élk veld en zou
vijftien andere instellingen wissen. Dat is exact het defect van punt 73.

### 18.5 DE VULLER — de ontbrekende schakel die de eerste pas vond

`piek_1200_w` werd tot deze ronde UITSLUITEND gevuld door `tools/backfill/piek1200.mjs`, een met de
hand te starten script met `--local` hardcoded op regel 104. **Er was geen enkele runtime-schrijver.**
Zonder vuller zou het voorstel na deployment permanent inert zijn geweest: poort (3) gaat per
constructie nooit open, en op remote — waar de backfill nooit heeft gedraaid — vanaf dag één.
`workers/api/src/integrations/ritpiek.ts` vult nu maximaal 5 ritten per sync-ronde, NIEUWSTE EERST, en
hangt NIET-FATAAL achter de activiteiten-sync: een mislukte piek-ophaling mag een geslaagde sync niet
in een 502 veranderen.

### 18.6 DE TWEEDE WEERLEGGINGSPAS — vijf lenzen op de GEBOUWDE code

Vijf lenzen (schrijfpad, startpunt, vuller, kaart, strings), elk gevolgd door een scepticus per
bevinding met de opdracht te WEERLEGGEN. **Alle vijf VOLTOOID, geen enkele GESTORVEN.** 20 bevindingen,
4 weerlegd, 16 overeind. Na eigen nameting bleven vier ECHTE gebreken over; de rest was dubbeltelling
over lenzen of een verantwoorde ontwerpkeuze.

**(a) DE KAART NOEMDE DE DAG NIET.** Drie lenzen kwamen hier onafhankelijk uit. De zin eindigde met
*"Jij weet of je die dag echt diep ging"* terwijl "die dag" nergens genoemd werd, en bij een lege
ritnaam viel hij terug op *"je laatste rit"* — een RECENTHEIDSCLAIM die de keuze niet waarmaakt, want
de hoogste piek wint en de datum is enkel scheidsrechter. Met twee openstaande ritten krijgt de renner
dus een voorstel toegeschreven aan de verkeerde rit, op de enige plek waar hij zijn oordeel moet
vellen — en dat oordeel is sinds §17 de ENIGE rem die dit ontwerp nog heeft. **De datum staat nu
vooraan in de zin en de fallback is weg.** Zes toetsen in `coachNarrative.test.ts`.

**(b) TWEE LOSSE SCHRIJFACTIES BIJ GOEDKEUREN.** `settings.ftp` en de rit-markering stonden als twee
losse `await`s. Slaagt de eerste en faalt de tweede, dan is de drempelwaarde WEL gewijzigd terwijl de
kaart meldt *"je drempelwaarde is niet gewijzigd"* — een M55-overtreding. Het herstel was erger dan
het gebrek: met de nieuwe waarde weggeschreven en de rit nog open levert de herberekening geen
voorstel meer op (hij is immers niet langer HOGER), dus elke volgende poging kreeg een 409 en de rit
bleef eeuwig open. **Nu één `db.batch`,** de vorm die `repo.ts` al kende.

**(c) DE VULLER KENDE MAAR TWEE UITKOMSTEN.** "Gelukt" en "mislukt", en bij mislukt schreef hij niets
zodat de rit terugkwam. Dat is juist bij een 429, maar bij een rit die op intervals verwijderd is een
val: de wachtrij is ritdatum-aflopend met een venster van 5, dus vijf zulke ritten aan de nieuwe kant
zetten de vuller PERMANENT vast, zonder één zichtbaar teken. Daarbij was `resp.json()` onbewaakt: een
2xx met een onleesbare body sleurde de HELE ronde mee, elke keer opnieuw. **Nu drie uitkomsten** —
`kromme`, `definitief` (403/404/410 en een onleesbare body: stempelen en uit de rij) en `tijdelijk`
(429, 5xx, netwerk: openlaten). Tien toetsen in `ritpiek.test.ts`, waar er nul waren.

**(d) EEN DOCSTRING DIE HET BESLUIT VAN DEZELFDE RONDE TEGENSPRAK.** Zie 18.7.

### 18.7 IS EEN GOEDGEKEURD VOORSTEL EEN IJKING? NEE.

De vraag lag voor de hand: de renner bevestigt daar een drempelwaarde die uit een ECHT gereden
twintigminutenvermogen volgt — waarom telt dat niet als vierde meetgelegenheid-bron?

**Omdat `laatsteGelegenheid` niet meet of de WAARDE klopt, maar of er een MAXIMUM gezet is.** De
voorstel-poort eist geen maximale inspanning; ze eist alleen dat 0,95 × de piek boven de staande
waarde uitkomt. Staat die te laag, dan vuurt ze op een gewone tempo-rit. Goedkeuren betekent dan "mijn
getal stond verkeerd", niet "ik ging vol". Dat is dezelfde grens die M91 trekt, alleen andersom: een
proxy vervangt de ijking niet, en een waardecorrectie vervangt de inspanning niet.

**GEVOLG, en het is het bedoelde gevolg:** na een goedkeuring blijft het testaanbod staan en blijft de
ijk-staat de laatste ECHTE meting noemen. Twee datums op twee schermen, twee grootheden, twee woorden.

Ik had het omgekeerde al in een docstring gezet vóór ik deze afweging maakte, en de pas vond dat terug:
`readLaatsteGoedgekeurdVoorstel` droeg *"Dit is de vierde meetgelegenheid-bron"* terwijl `effect.ts` in
dezelfde ronde het tegendeel vastlegde. De functie werd bovendien bij elke pageload bevraagd en door
niemand gelezen. **Beide zijn weg**, en de grond staat nu bij `MetingBron` in
`apps/web/src/lib/effect.ts` — waar de volgende ronde hem zoekt.

### 18.8 M93 RANDVOORWAARDE (2) IS BIJGEWERKT

`docs/TRAININGSMODEL.md`, **M93** (geen nieuw nummer; M3 gerespecteerd — er is niets hernummerd). De
eis van een plausibiliteitsgrens is VERVALLEN, met de meting eronder: de grens bleek niet te leggen
zolang de reeks geen gemerkte maximale inspanning bevat. Wat de rem moest tegenhouden is intussen van
twee kanten dichtgezet — de LAGE kant door M94 (alleen omhoog), de HOGE kant door M10 (de renner
bevestigt). Herkomst-etiket: **BELEID — een Daan-besluit** van 25-08-2026. Komt er ooit een reeks mét
gemerkte maximale inspanningen, dan is de grens opnieuw te overwegen.

De kruisverwijzing vanuit M94 naar "het geval dat M93 randvoorwaarde (2) noemt" blijft kloppen: het
Z2-geval staat er nog, alleen niet langer als grond voor een grens.

### 18.9 De poort staat, maar hij vuurt voorlopig niet

**Op de huidige gegevens doet deze functie NIETS, en dat hoort zo.** Alles wat er nu staat is geseed;
de staande drempelwaarde is 280 en er is geen openstaande rit die 0,95 × piek daarboven brengt. Het
eerste voorstel kan pas komen na een rit die na de migratie binnenkomt én hard genoeg is. Het
ijkaanbod van **2026-09-21** is de eerstvolgende geplande gelegenheid.

Dat is geen tekortkoming maar de meetbare vorm van het ontwerp: de historie zwijgt, de toekomst
spreekt.

### 18.10 VISUELE VERIFICATIE — en zij ving een gebrek dat GEEN toets kon zien

De kaart is nieuw en was nog nooit gerenderd. Lokaal gezaaid (één open rit, piek 310, staande 280),
beide dev-servers op, en de kaart opgehaald van het schema-scherm.

**WAT ER STOND:**

> Op 24 augustus, in "De Ronde Venen - FTP build up" van 88 minuten, hield je twintig minuten 310 watt
> vol. Dat is 95 procent daarvan: 295 watt, 15 watt boven de 280 die er nu staat. Jij weet of je die
> dag echt diep ging — neem hem over of laat hem staan.

Met de knoppen "Neem 295 watt over" en "Laat staan", en de uitleg eronder. Per verwachting één
uitspraak: de kaart rendert — **KLOPT**. De zin noemt dag, rit, duur, vermogen, factor, oud en nieuw —
**KLOPT**. De knop draagt de waarde — **KLOPT**. Tikken schrijft en de kaart verdwijnt zonder
herlaadslag — **KLOPT** (`settings.ftp` 280 → 295, rit op `goedgekeurd`, en `lthr` 178 plus `doel`
ONGEWIJZIGD, dus het partiële schrijfpad houdt ook buiten de toetsen). Console schoon op één
bestaande 404 na (`/api/checkin/2026-08-25`, geen check-in vandaag — niet van deze ronde).

**MAAR DE EERSTE POGING LAS ANDERS,** en dat is de opbrengst:

> Op 2026-08-24T09:12:00, in "De Ronde Venen - FTP build up" ...

`activities.datum` draagt een VOLLE TIJDSTEMPEL. `datumKort_` matcht op een ANKERD patroon
`^\d{4}-\d{2}-\d{2}$` en geeft bij een tijdstempel de rauwe string terug. **Geen enkele toets kon dit
zien:** de unit-toetsen voeren kale datums in, en de 215-fixture draagt ze ook — de fixture is op dat
punt niet representatief voor de tabel waar hij uit komt. Gerepareerd bij de bron
(`readFtpVoorstelKandidaten` snijdt op tien tekens), met een routetoets die de tijdstempel wél
aanbiedt.

De lokale zaai is daarna teruggedraaid: de rij is weg, `settings.ftp` staat weer op 280, 262 rijen in
`activities` — de stand van vóór de controle.

**LES, en zij hoort bij CHECK 43 en niet los ervan:** een fixture die een kolom NETTER aanlevert dan
de tabel doet, maakt elke toets erop blind voor precies dat verschil.

### 18.11 WAT DAAN MOET BEKIJKEN — één zin die vreemd zal lezen

Op hetzelfde scherm als de kaart staat de ijk-staat-regel, en die luidt vandaag:

> Ik heb je drempel nog nooit gemeten.

Na een goedkeuring blijft die zin staan. **Dat is de bedoelde uitwerking van het besluit in 18.7** —
een goedgekeurd voorstel is geen ijking, want er is geen maximale inspanning vastgesteld — en de zin
is dus letterlijk waar. Maar hij komt direct onder een kaart te staan waarin de app zojuist 295 watt
uit een rit heeft overgenomen, en dat leest wrang.

**Dit is een BESLISPUNT voor Daan en geen defect, en ik heb het daarom niet stilzwijgend veranderd.**
Het gladstrijken vraagt namelijk precies het besluit dat in 18.7 op gronden is afgewezen. De derde weg
— een eigen zin die zegt dat de drempelwaarde is BIJGESTELD zonder te beweren dat er gemeten is — is
niet gebouwd, want zij raakt de ijk-staat-copy en die staat vol met toetsen die deze ronde met rust
moest laten.

**WAAR HIJ KIJKT:** het schema-scherm, direct onder de weekbelasting, zodra hij een voorstel heeft
goedgekeurd. De vraag is of "nog nooit gemeten" daar mag blijven staan.

<!-- EINDE docs/PUNT69-BOUW.md -->
