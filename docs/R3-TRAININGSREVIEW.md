# R3 — Trainings-review tegen het model

Status: **FINDINGS, GEEN VERDICTS.** Verdicts zijn R4; het verdict-criterium is het MODEL,
niet GAS. Dit document velt geen oordeel over cutover-blokkering en schrijft geen model-regels.

Norm: `docs/TRAININGSMODEL.md` (M1–M61). Dat is het ENIGE document met gezag in R3.
`docs/TRAININGSMODEL-BESLUITEN.md` is het log — citeerbaar, geen gezag.
GAS (`daanhhk/training` @ `3e8090a`) is in deze laag HERKOMST ZONDER GEZAG: bron van waarheid
over wat GAS DOET, nooit over wat goed is. "Cadans wijkt af van GAS" is hier geen argument;
"Cadans is GAS-identiek" is geen vrijspraak. Herkomst wordt wél per vondst vastgesteld, omdat
R4's cutover-criterium (geen functionele regressie) hem nodig heeft.

Nummering: **T1, T2, …** — append-only, los van R1/R2's V-reeks. Elke vondst noemt de M-regel.

## Scope (Daan akkoord, 17-07-2026)

Inventaris = het model, niet de matrix. 61 regels, mechanisch geteld, geen gaten (max M61).
Verdeling: 47 NORM · 9 OPEN · 2 HEURISTIEK · 1 BEVINDING · 2 INGETROKKEN.

Negen vallen af met reden: **M1–M4** (regels over het document zelf), **M6 · M20 · M59**
(binden de REVIEW, niet de app), **M60 · M61** (INGETROKKEN). Twee vallen buiten de
trainings-laag: **M57 · M58** (multi-user, open-source-vs-commercieel = product-strategie).
Blijft: **50 regels die de app binden.** **M5** (claimregel) is dwarsdoorsnijdend. De andere
**49** verdelen zich over vier brokken:

| brok | §§ | regels | n |
|---|---|---|---|
| **a** — doel → fase → prikkel | §6 + §8 | M33–M42, M49–M52 | 14 |
| **b** — dosering | §1 + §7 | M7–M9, M43–M48 | 9 |
| **c** — agency, bewijslast, coach-stem | §2 + §3 + §9 | M10–M19, M53–M56 | 14 |
| **d** — invoer en grens | §4 + §5 | M21–M32 | 12 |

Twee soorten werk. **Locatie-werk**: het model heeft zijn oordeel al geveld (M13, M18, M50) —
R3 beslist niets, het zoekt élke plek waar de app de claim tóch maakt. **Meet-werk**: de norm
staat er, maar niemand heeft gemeten of de app hem haalt (M9, M38, M43) — dat vraagt DRAAIEN.

Dit document dekt **a1** (de doel-lijst) en **a2** (de fase-keten). **a3 is open** — zie slot.

## Methode

Model-first: begin bij de regel, zoek de plek in de app die de claim maakt. De risico-matrix
helpt hier niet en dat is bewezen, geen vermoeden: `effectiveMacroFase_` is AST-identiek,
bereikbaar én door beide oracles geraakt — de rustigste cel — en tegelijk het zwaarste
trainings-defect.

Alle metingen zijn GEDRAAID, niet gelezen: esbuild-bundel van `packages/engine/src/index.ts`
+ `apps/web/src/lib/*.ts`, buiten de repo-tree, onder `TZ=Europe/Amsterdam`, lokale
datumdelen (nooit `toISOString`). Elke meting draagt een ZELF-CONTROLE die de fixture
uitsluit. Probe-scripts en ruwe uitvoer blijven buiten de repo (staande privacy-regel).

**Standaard-fixture** (tenzij anders vermeld): week van maandag 2026-07-13, `todayISO` =
diezelfde maandag (alle 7 dagen plannbaar); `ftp:280 · lthr:165 · gewicht:75 · hrMax:185 ·
hrRest:48 · doelStart:"2026-06-01" · doelDuur:12 · profielPreset:"Gevorderd 7u" ·
pendelDuurMin:0 · pendelAantal:0`; geen events, activities, weekplans, wellness of rpe.
Planner-week "zomer": di 90 · do 75 · za 180 · zo 60 = 405 min. Alleen `doel` varieert.
Bij deze `doelStart` is de macro-fase **Build** voor alle doelen behalve Onderhoud (T9).

---

## a1 — De doel-lijst

### T1 — De doel-lijst in de app is niet die van het model. *(M34, M35, M36, M42)*

`packages/engine/src/phase.ts:12` — `DOEL_OPTIONS = ["FTP","Conditie","Beklimmingen","VO2max","Onderhoud"]`.
NL-labels: `apps/web/src/lib/settings.ts:100` (`Conditie` → "Duurvermogen", `Beklimmingen` → "Klimmen").

Twee gaten t.o.v. M34: **VO2max staat er als DOEL** terwijl M35 het een MIDDEL noemt; en
**Beklimmingen is één doel** waar M36 er twee eist (lang + kort), met de expliciete motivering
dat het onderscheid niet uitsluitend via een event mag binnenkomen.

M42 stelt al vast dát de lijst niet deze vijf is, en verwijst de ingreep naar verdict/bouw.
T1 voegt de meting toe: **herkomst = geërfd, exact identiek.** GAS `src/Archetypes.gs:556`
(`profileForDoel_`) mapt dezelfde vijf literals; Cadans `packages/engine/src/archetypes.ts:1220`
is 1-op-1, inclusief de `klim`-fallback voor een onbekend doel.

### T2 — Vijf doelen, twee meetlatten. *(M33)*

M33: een doel bestaat in de app alleen als het model het kan MÉTEN en kan BEDIENEN.

`packages/engine/src/niveau.ts:570` — `GOAL_PROFILES_` bevat exact TWEE profielen: `girona`
en `ftp`. `packages/engine/src/niveau.ts:629` — `activeGoalProfile_`: `doel === "FTP"` → het
ftp-profiel; **alles anders → `girona`**. Dus Duurvermogen, Klimmen, VO2max én Onderhoud
worden alle vier gemeten tegen `girona`: "~90 km · 1200 hm/dag · lange klimmen", met dims
klimvermogen 4,0 W/kg · "Duurvermogen" CTL 65 · lange-rit 4,0 u.

**Bij Onderhoud is dat intern tegenstrijdig.** Het onderhoud-profiel zet
`langeRitPerWeek: 0` en `maxDuurMin: 45` (`packages/engine/src/archetypes.ts:1215`) — het plan
plant dus NUL lange ritten — terwijl de meetlat een lange-rit-doel van 4,0 uur toont.

**Herkomst: geërfd, en de oracle bevriest het.** GAS `src/SelfTest.gs:410` assert letterlijk
`activeProfile Conditie->girona`. GAS' eigen commentaar geeft de onvoltooidheid toe:
`src/Archetypes.gs:529` ("GOAL_PROFILES_ is girona-only; niet-klim-profielen verwijzen er niet
naar"). De cel is per constructie permanent groen: de zelftest bewijst dát de terugval wérkt,
en vraagt niet of hij DEUGT.

### T3 — De duurvermogen-maat bestaat niet, maar draagt wel het label. *(M39 + M5)*

M39 (OPEN): er is geen duurvermogen-maat; chronische en acute belasting zeggen niets over of
je langer kunt doorrijden. Conditie is daarmee het enige doel dat het model structureel niet
kan bedienen, en tot die maat er is, is de belofte niet gedekt (M33).

`packages/engine/src/niveau.ts:570` e.v. — de `girona`-dim met `key: "duur"` draagt
`label: "Duurvermogen"`, `metric: "ctl"`, `target: 65`. De app toont dus een balk die
"Duurvermogen" heet en CTL meet. Dat is precies de claim die M39 OPEN verklaart, en M5
verbiedt hem: de app doet geen bewering die niet als regel met een status in het model staat.

### T4 — "Duurvermogen" kiezen koopt drie minuten duur. *(M38)*

M38 eist voor Conditie: **een progressieve duurprikkel**, plus een maat die laat zien of het
duurvermogen groeit.

GEDRAAID (standaard-fixture, zomer-week 405', alleen `doel` varieert). De engine's eigen
intent-boekhouding per week, in minuten:

| doel | duur (low) | kwaliteit (high) | top (anaerobic) | TSS |
|---|---|---|---|---|
| FTP | 339' (84%) | 66' (16%) | 0' | 299 |
| **Conditie** | **336' (83%)** | **69' (17%)** | 0' | 301 |
| Beklimmingen | 315' (79%) | 72' (18%) | 14' (3%) | 327 |
| VO2max | 366' (90%) | 21' (5%) | 19' (5%) | 297 |
| Onderhoud | 310' (77%) | 94' (23%) | 0' | 307 |

Zelf-controle: FTP tweemaal gedraaid → 0 verschil.

**Conditie levert 3 minuten MINDER duur dan FTP, en 3 minuten MEER kwaliteit.** Wat verandert
is uitsluitend wélke kwaliteitssessie valt (`sweet_spot` i.p.v. `threshold`), niet hoeveel
duur er is.

**Oorzaak, en hij ligt dieper dan een instelling:** `packages/engine/src/archetypes.ts:1138` —
`GOAL_KWALITEIT_INTENTS_ = ["drempel","sweetspot","vo2"]`. Er zijn DRIE kwaliteits-intents en
GEEN duur-intent. Elk doelprofiel bestaat uit gewichten over uitsluitend deze drie; Conditie is
`{sweetspot:0.45, drempel:0.35, vo2:0.20}` = het FTP-profiel `{drempel:0.45, sweetspot:0.35,
vo2:0.20}` met de eerste twee omgewisseld. **Een doel kan alleen gewicht verschuiven tússen
kwaliteitsvormen. Duur is geen hendel die een doel kan bedienen.** De enige duur in het plan
komt uit `langeRitPerWeek`, en dat staat voor klim/ftp/vo2max/conditie identiek op 1.

**Herkomst: geërfd.** GAS `src/Archetypes.gs:510` (`PROFILES`) draagt dezelfde vijf profielen
met dezelfde getallen; GAS' eigen comment noemt de conditie-mix "sweetspot-led/endurance" —
dezelfde begripsverwarring die M34 adresseert ("Niet 'algemeen fitter'").

**Nevenmeting:** VO2max als doel levert de MINST intensieve week van de vijf (90% laag; 21'
kwaliteit + 19' top). Onder M35 is dat geen defect maar een gevolg — VO2max hoort geen doel te
zijn. Genoteerd, niet als aparte vondst geteld.

### T5 — Het haalbaarheids-oordeel dat de app volgens het model niet mag vellen. *(M40/M41, M8(a), M27/M29, M5)*

`apps/web/src/components/niveau/DoelProjectie.tsx:742` — zichtbare tekst:
"Bij {hours}u/week blijft je fitheid-plafond onder je duurdoel — zo niet haalbaar. Verhoog het
volume."

Vier regels stapelen hier op elkaar:

1. **M41 (OPEN)** — "dit doel past niet bij deze uren" volgt uit M40, maar het model kan het
   oordeel NIET vellen; tot het zover is doet de app niet alsof (M5). De app velt het.
2. **M39/T3** — het "duurdoel" waartegen geoordeeld wordt is de CTL-dim uit T3.
3. **M8(a)** — volume-maximalisatie is expliciet uitgesloten uit de doelfunctie: "het model
   krijgt de uren, het verzint ze niet." "Verhoog het volume" is een imperatief.
4. **M27** — de `hours` waarop het oordeel rust: `apps/web/src/pages/Niveau.tsx:157` vult
   `weeklyHoursDefault` met `weeklyHoursRecent_(rows, 42)` = het GEREDEN volume van 42 dagen.
   M27: capaciteit is niet afleidbaar uit data — deed is niet kon; wie het plafond uit het
   gereden volume afleidt, bakt het plateau in. Het is een schuif (de gebruiker kan hem
   verzetten), maar de DEFAULT is afgeleid, en het oordeel staat op die default.

M29 geeft de enige toegestane richting: staat de gedeclareerde limiet structureel onder wat de
historie laat zien, dan mag de app dat VOORLEGGEN — als voorstel, onder M10. Hier is het geen
voorstel maar een bevel.

---

## a2 — De fase-keten

### T7 — "Onderhoud = zacht trainen" is ONJUIST — weerlegd door meting. *(M37, M38, M50)*

`docs/TRAININGSMODEL-BESLUITEN.md` (vondst 1) motiveert: "keyIntensity levert alleen in
Build/Peak een doel-gedreven kwaliteitsdag -> Onderhoud = zacht trainen = precies verkeerd voor
FTP-behoud." M50 neemt die motivering over ("dan levert het plan geen doel-gedreven
kwaliteitsdag meer, en traint de gebruiker zacht precies wanneer hij zijn FTP moet vasthouden").

GEDRAAID op drie urenbudgetten (standaard-fixture; winter-weken di 60 · do 60 · za 90 = 210',
en di 60 · do 60 · za 60 = 180'). FTP-dragende intensiteit (high-intent) per week:

| beschikbaar | Onderhoud | FTP |
|---|---|---|
| 405' (6,75u) | **94'** | 66' |
| 210' (3,5u) | **76'** | 45' |
| 180' (3u) | **76'** | 45' |

Zelf-controle: Onderhoud tweemaal gedraaid → 0 verschil.

**Onderhoud is op elk urenbudget INTENSIEVER dan het FTP-doel**, en ruilt bij weinig uren de
lange rit in voor een derde kwaliteitsdag (bij 180': 3× `sweet_spot`, geen `long_z2`; FTP
krijgt `threshold` + `sweet_spot` + `long_z2`). Dat is wat M37/M38 vragen: de intensiteit die
FTP draagt blijft staan terwijl het volume zakt.

**Gevolg voor het model — dit is een bevinding OVER de norm, geen regel-wijziging.** M50's
REGEL ("Onderhouden is geen basisfase") staat niet ter discussie in R3 en wordt door T9
zelfstandig gedragen. Maar M50's MOTIVERING, en BESLUITEN' vondst 1 waar zij uit komt, zijn op
de intensiteits-hoeveelheid empirisch onjuist. R4 weegt opnieuw; R3 neemt niet over. Het
urgentie-argument dat aan deze motivering hing ("moet weg vóór de winterdip") verliest daarmee
zijn onderbouwing en moet zelfstandig opnieuw gemaakt worden — T8 is de kandidaat.

### T8 — De 45-minuten-cap begrenst de PRIKKEL, niet de sessie. *(M46, M37/M38, M5)*

M46: elke sessie heeft een bedoeling, er is geen restpost — "de duur van een prikkel volgt uit
wat de prikkel moet doen, niet uit wat er in het gat past."

Het onderhoud-profiel draagt `maxDuurMin: 45` (`packages/engine/src/archetypes.ts:1215`). De
ENIGE lezer is `packages/engine/src/planner.ts:411` in `allocateQualityWeek_`
(`packages/engine/src/planner.ts:173`):

```
const bt = Math.min(sel.type === "pendel" ? settings.pendelDuurMin || 80 : sel.minuten,
                    (profiel && profiel.maxDuurMin) || Infinity);
const gw = goalWorkout_(profiel, macroFase, bt, rec, cov, weekV);
```

`bt` gaat UITSLUITEND naar `goalWorkout_` — de archetype-KEUZE ("welke vorm past in 45
minuten?"). De sessie zelf wordt daarna gebouwd op `sel.minuten`, de volle geplande duur. De
cap begrenst dus niet wat hij lijkt te begrenzen.

GEDRAAID (doel=Onderhoud; di 60 · do 60 · za variabel):

| za gepland | geleverd type | naam | werk-blokken | opvulling (z2+rust) |
|---|---|---|---|---|
| 45' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 25' |
| 60' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 40' |
| 90' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 70' |
| 120' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 100' |
| 180' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 160' |
| 240' | `sweet_spot` | "Sweet Spot 2×10 kort" | **20'** | 220' |

Zelf-controle: dezelfde reeks bij doel=FTP (profiel zonder `maxDuurMin` → `Infinity`) levert
`long_z2` die WEL meeschaalt (45' "Z2 nuchter (Build, ingekort)" · 180' "Z2 nuchter (Build)")
— de fixture is dus niet de oorzaak.

**Twintig minuten werk, ongeacht de beschikbare tijd.** Dit is M46's restpost-regel op zijn
kop: niet een sessie die als opvulling dient, maar een sessie waarvan de PRIKKEL vastzit en de
REST opvulling is. Bij 240' is 92% van de sessie gat-vulling. Onder M37/M38 (Onderhouden =
FTP-behoud, "een onderhoudsweek is geen zachte week") is dit het mechanisme waardoor het
onderhoudsdoel niet levert wat het belooft — niet te weinig intensiteit (T7 weerlegt dat), maar
een prikkel die niet meegroeit. Onder M5: de sessie heet "kort" bij 240 minuten.

**Herkomst: geërfd, byte-identiek inclusief comment.** GAS `src/Algorithm.gs:943` draagt
dezelfde `Math.min(...)` met dezelfde toelichting ("Fase 2: maxDuurMin-cap (Onderhoud 45); geen
veld → Infinity → 4 doelen byte-identiek").

### T9 — De app plant op een andere fase dan hij toont. *(M49, M50)*

`packages/engine/src/planner.ts:87` — `effectiveMacroFase_` pint `doel === "Onderhoud"` op
`"Base"`. De docstring erboven noemt de reden zelf: "(→ allocActive TRUE + een eerste-klas
fase, geen missing-key)". Dat is exact wat M49 verbiedt: **een fase die gepind wordt om een
intern probleem op te lossen — een ontbrekende toewijzing — is een loodgietersfix die zich
voordoet als een trainingsbeslissing.** De schending is dus bewezen uit de eigen documentatie
van de code, niet uit interpretatie.

Diezelfde docstring claimt: "de payload/display-fase-sites tonen de echte
computeMacroPhase-uitkomst (label = Fase 3)". **GEDRAAID: onwaar.** Bij identieke
`doelStart: "2026-06-01"` draagt de payload:

| doel | `payload.macroFase` | `payload.planModus` |
|---|---|---|
| FTP | `"Build"` | `"Opbouw"` |
| Onderhoud | **`"Base"`** | `"Onderhoud"` |

`apps/web/src/lib/proposal.ts:210` (`macroFaseBase`) is de payload-bron. `planModeLabel_`
(`packages/engine/src/phase.ts:180`) is display-only en geeft wél "Onderhoud" — maar dat is het
MODUS-label, niet de fase. De fase die de rijder ziet is de gepinde.

Dit is de **derde keer** in deze review dat een toelichting een premisse claimt die de bron
tegenspreekt (na R2's V1-(b) "GAS bouwt géén range" en V23 "de engine kent geen 3-zone
TSB-drempelfunctie"). Patroon: de comment beschrijft de bedoeling, niet de uitkomst.

**Wat de pin kost, en wat NIET.** `keyIntensity` (`packages/engine/src/planner.ts:833`) kiest de
doel-gedreven sessie via `goalWorkout_` **alleen in Build/Peak**; daarbuiten valt hij op een
categorie-tak terug, en `doel === "Onderhoud"` matcht geen enkele tak → de anonieme rest-regel
`return "sweet_spot"` — dezelfde die een ONBEKEND doel krijgt. Maar `allocateQualityWeek_`
(`packages/engine/src/planner.ts:173`) is actief in Base/Build/Peak en roept `goalWorkout_` WEL
aan (`packages/engine/src/planner.ts:413`), dus het profiel wordt daar wél gelezen.

GEDRAAID (probe-mutatie op de bundel, geen repo-wijziging): `intentGewichten` van het
onderhoud-profiel naar `{vo2:1.0, drempel:0, sweetspot:0}` → **1 van de 3 kwaliteitsdagen
verandert** (`sweet_spot` → `vo2max`). Zelf-controle: dezelfde mutatie op het ftp-profiel
verandert ÁLLE kwaliteitsdagen — de mutatie komt dus aan. **Het onderhoud-profiel is half
gelezen, niet dood.** De aanvankelijke hypothese ("de pin maakt het profiel dood") is door
draaien weerlegd. Welke helft precies, en wat de fase-modulatie (`GOAL_FASE_MOD_`, Base
`{sweetspot:+0.1, drempel:+0.05, vo2:-0.1}` vs Build `{}`) daarin doet: **a3**.

---

## a3 — het slot van brok a

### Methode-correctie (a3) — de standaard-fixture mat een pad dat de app niet draait

De Methode-sectie hierboven blijft letterlijk staan; deze correctie komt eronder, niet ervoor in de
plaats. Zij raakt T4, T7 en het slot van T9.

`allocateQualityWeek_` dateert zichzelf op de AMBIENT klok: `packages/engine/src/planner.ts:537`
(`const allocToday = stripTime_(new Date())`) voedt de `today`-parameter, en `eligible_` eist
`packages/engine/src/planner.ts:209` (`stripTime_(d.datum).getTime() >= todayT`, met
`packages/engine/src/planner.ts:194` als bron). De rest van de pijplijn dateert zich op
`input.todayISO` (`apps/web/src/lib/proposal.ts:341`, `const todayT = today.getTime()`).

**In de app vallen die twee ALTIJD samen:** `apps/web/src/lib/schema.ts:856` — `const todayISO =
todayIso()`. De app kan `todayISO` niet op iets anders zetten dan vandaag. **In de standaard-fixture
niet:** die zet `todayISO` op maandag 2026-07-13 terwijl de klok op 17/18-07 stond. Gevolg: di 14-07
en do 16-07 zaten wél in `tePlannen` (≥ `todayISO`) maar NIET in de allocator (< `allocToday`) en
vielen door naar de per-dag-takken — dus naar `keyIntensity`. De fixture-regel "alle 7 dagen
plannbaar" klopt voor `tePlannen` en is onwaar voor de allocator.

**Herkomst: dit is een fixture-eigenschap, geen app-eigenschap.** GAS kent de seam niet: daar is er
geen `todayISO`-parameter — `generateProposal` leest `src/Algorithm.gs:93`
(`var today = stripTime_(new Date());`) en de allocator `src/Algorithm.gs:1019`
(`var allocToday = stripTime_(new Date());`) — twee keer dezelfde ambient bron, dus per constructie
gelijk. Cadans voegde `todayISO` toe als test-seam. De scheefstand is dáármee introduceerbaar, en
alleen in een test of een probe.

De discriminant is af te lezen: de allocator schrijft `reden` mét `week-plaatsing`
(`packages/engine/src/planner.ts:622` e.v.), `keyIntensity` zonder.

**GEDRAAID — gecontroleerd, alles gelijk behalve de klok** (zelfde week, zelfde `todayISO`, zelfde
`doelStart`, zelfde `mesoWeek`; `Date` gestubd op bundel-niveau, geen repo-wijziging). Hoog-intent
(FTP-dragende intensiteit) per week:

| week | | klok 18-07 (a1/a2's opstelling) | klok 13-07 (= `todayISO`, zoals de app) |
|---|---|---|---|
| zomer 405' | Onderhoud | **94'** | **36'** |
| | FTP | 66' | 77' |
| winter 210' | Onderhoud | **76'** | **36'** |
| | FTP | 45' | 45' |
| winter 180' | Onderhoud | **76'** | **36'** |
| | FTP | 45' | 45' |

Zelf-controle 1: de a1/a2-kolom reproduceert T4's tabel EXACT (339'/66' · 336'/69' · 315'/72'+14' ·
366'/21'+19' · 310'/94'; TSS 299/301/327/297/307) — de fixture is stabiel en de metingen zijn
vergelijkbaar. Zelf-controle 2: FTP verschuift bij 210'/180' NIET (45' in beide kolommen) — de
klok-verschuiving is dus geen globale ruis; ze raakt Onderhoud en laat FTP staan. Dat is precies het
mechanisme: `keyIntensity` leest het doelprofiel alléén in Build/Peak
(`packages/engine/src/planner.ts:847`), en Onderhoud staat door de pin (T9) op Base → geen tak matcht
→ de anonieme rest-regel `packages/engine/src/planner.ts:878` (`return "sweet_spot"`). FTP staat op
Build en krijgt via `keyIntensity` hetzelfde profiel als via de allocator.

### T10 — T7 is WEERLEGD: onder de klok van de app is Onderhoud op elk urenbudget MINDER intensief dan FTP, en vlak. *(M37, M38, M50 + M7)*

T7 concludeerde het omgekeerde. Die conclusie rust volledig op de twee `keyIntensity`-dagen uit de
Methode-correctie: `keyIntensity` gaf Onderhoud daar een derde en vierde kwaliteitsdag via de
anonieme rest-regel — een pad dat de app niet draait (T11).

**Wat de app wél levert** (zelfde fixture, klok = `todayISO`): **36 minuten hoog-intent per week, bij
405', bij 210' én bij 180'.** Een constante. FTP levert 77' bij 405' en 45' bij 210'/180'.

De week ziet er zo uit (zomer 405', doel=Onderhoud, alles allocator-geplaatst):

| dag | gepland | geleverd | naam |
|---|---|---|---|
| di | 90' | `sweet_spot` | "Sweet Spot 2×10 kort" |
| do | 75' | `long_z2` | "Z2 + hoge cadans (Base, ingekort)" |
| za | 180' | `long_z2` | "Z2 nuchter (Base)" |
| zo | 60' | `threshold` | "Drempel 2×8 kort" |

**Het mechanisme is het profiel zelf, niet `keyIntensity`.** Drie velden doen het werk, alle drie in
`packages/engine/src/archetypes.ts`: `kwaliteitPerWeek: { Base: 2, Build: 2, Peak: 2 }` (`packages/engine/src/archetypes.ts:1207`)
tegenover ftp's `{ Base: 2, Build: 3, Peak: 2 }` → twee kwaliteitsdagen i.p.v. drie;
`langeRitPerWeek: 0` (`packages/engine/src/archetypes.ts:1213`) → stap 1 van de allocator slaat over; en `maxDuurMin: 45` (`packages/engine/src/archetypes.ts:1215`) =
T8's cap → beide kwaliteitsdagen krijgen een "kort"-archetype, ongeacht de dagduur. Gemeten:
"Sweet Spot 2×10 kort" op een dag van 90' levert 20' hoog-intent, "Drempel 2×8 kort" op een dag van
60' levert 16'. 20' + 16' = 36'. Bij 180' beschikbaar levert de app **exact dezelfde twee sessies**
(dezelfde namen, dezelfde 20' en 16') op kortere dagen — vandaar dat de 36' niet beweegt als de uren
bewegen.

**Gevolg voor het model — een bevinding OVER T7, niet over M50.** T7 verklaarde M50's MOTIVERING
("dan levert het plan geen doel-gedreven kwaliteitsdag meer, en traint de gebruiker zacht precies
wanneer hij zijn FTP moet vasthouden") empirisch onjuist. **Die weerlegging vervalt: de motivering is
onder de klok van de app juist.** M50's regel én motivering staan. Wat wél onjuist blijft is het
MECHANISME dat `docs/TRAININGSMODEL-BESLUITEN.md` (vondst 1) ervoor aanwijst —
"keyIntensity levert alleen in Build/Peak een doel-gedreven kwaliteitsdag" — want die functie stuurt
het plan niet (T11). Het urgentie-argument dat aan M50 hing ("moet weg vóór de winterdip") krijgt zijn
onderbouwing hiermee terug; T7's verwijzing naar T8 als vervangende kandidaat is niet meer nodig, maar
T8 blijft zelfstandig staan en verklaart nu de 36'.

**Onder M7** (rendement per beschikbaar uur): bij Onderhoud koopt een extra uur nul extra prikkel —
alleen meer `long_z2`. 405' en 180' leveren dezelfde 36'.

**Herkomst: geërfd.** Alle drie de profielvelden staan identiek in GAS (`src/Archetypes.gs:510` e.v.);
de allocator-keten is byte-identiek (`src/Algorithm.gs:818` · `src/Algorithm.gs:1003` ·
`src/Algorithm.gs:1019` · `src/Algorithm.gs:1070`).

### T11 — `keyIntensity` is in de app geen kwaliteits-kiezer: 400 weken, nul treffers buiten een test-week. *(M49 + M5)*

`allocateQualityWeek_` eindigt met een endurance-fill die ÉLKE eligible dag een plaats geeft
(`packages/engine/src/planner.ts:433`, "4. endurance-fill"). `assignWorkouts` laat de allocator-tak
vóór de per-dag-takken gaan (`packages/engine/src/planner.ts:622`). Omdat `tePlannen`
(`apps/web/src/lib/proposal.ts:341`) en `eligible_` (`packages/engine/src/planner.ts:209`) in de app
op dezelfde datum staan, is elke plannbare vrije dag per constructie allocator-dag → de
`keyIntensity`-tak (`packages/engine/src/planner.ts:697`) komt er niet aan toe.

`allocActive` (`packages/engine/src/planner.ts:513`) is uit bij event-recovery, meso-recovery en
test-week. De eerste twee vangen álle dagen af in een eerdere tak. Blijft over: de test-week.

**GEDRAAID, mechanisch:** 5 doelen × blokweek 1..20 × 4 week-vormen = **400 weken**, klok =
`todayISO`. `keyIntensity`-treffers: **180 — alle 180 in `fase Test`.** Nul in Base, Build of Peak.
Per doel: FTP 45 · Conditie 45 · Beklimmingen 45 · VO2max 45 · **Onderhoud 0** (de pin houdt hem in
Base → allocator). Zelf-controle: dezelfde detector op de standaard-fixture (klok 18-07) geeft exact
de 2 verwachte treffers (di + do) — de detector werkt.

**Wat daaruit volgt.** (a) De `goalWorkout_`-aanroep binnen `keyIntensity`
(`packages/engine/src/planner.ts:847`-tak) vereist Build of Peak; de enige fase waarin `keyIntensity`
draait is Test. **Die tak is onbereikbaar.** (b) Daarmee is óók
`packages/engine/src/planner.ts:862` (`const ct = climbTypeWorkout_(klimType, macroFase, dekking)`)
onbereikbaar — zie T13. (c) De twee eerste regels van de functie zijn dood:
`packages/engine/src/planner.ts:841` (`if (macroFase === "Taper") return "taper_openers"`) — de
docstring van `assignWorkouts` zegt zelf dat macroFase daar nooit 'Taper' is — en
`packages/engine/src/planner.ts:842` (`if (macroFase === "Recovery") return "recovery"`), want
`isEventRecovery` vangt die dagen eerder af. (d) Wat `keyIntensity` in een test-week wél doet, is voor
alle vier de doelen dezelfde categorie-tak zonder profiel.

**Vierde geval van "een toelichting claimt een premisse die de bron tegenspreekt"** (na R2's V1-(b),
V23 en T9): de comment boven de Build/Peak-tak beschrijft een keuze-architectuur die niet draait.

**Herkomst: geërfd, structureel identiek.** GAS `src/Algorithm.gs:1820` (`keyIntensity`),
`src/Algorithm.gs:1859` (`climbTypeWorkout_`) en `src/Algorithm.gs:985` (`assignWorkouts`) dragen
dezelfde volgorde en dezelfde takken.

### T12 — Na blokweek 12 plant de app elke week een FTP-test, voorgoed — voor vier van de vijf doelen. *(M46, M49, M5)*

`computeMacroPhase` (`packages/engine/src/phase.ts:49` e.v.) verdeelt: week 1-4 Base · 5-8 Build ·
9-11 Peak · **daarna** `packages/engine/src/phase.ts:52` (`fase = "Test"`). Er is geen bovengrens: de
docstring zegt het zelf ("Voorbij week 12 → blijft op Test"). `packages/engine/src/planner.ts:496`
(`const isTestWeek = macroFase === "Test"`) zet dan `allocActive` uit — de hele week-allocatie valt
weg.

**GEDRAAID** (klok = `todayISO`, zonder events): blokweken mét een `test`-sessie, per doel — FTP
**12,13,14,15,16,17,18,19,20** · Conditie idem · Beklimmingen idem · VO2max idem · **Onderhoud: geen
enkele.** De meting stopte bij 20 omdat de fase niet meer verandert.

Een voorbeeld-week op blokweek 13 (doel=FTP, zomer 405'): `test` · `sweet_spot` · `long_z2` ·
`long_z2` — elke week opnieuw, met dezelfde test op dezelfde dag.

Onder M46 ("elke sessie heeft een bedoeling; er is geen restpost"): een wekelijkse FTP-test is geen
prikkel, en de drie dagen eromheen zijn wat er overblijft als de kwaliteitsallocatie uit staat. Onder
M49 ("de fase volgt het doel"): de fase volgt hier een teller die na twaalf weken vastloopt. Onder M5:
de app noemt het een test-week.

**Bereikbaarheid is niet theoretisch.** Het settings-veld `doelDuur` (default 12) wordt door
`computeMacroPhase` niet gelezen — de 4/4/3-verdeling staat hard in de functie. Wie zijn blok-start
niet verzet, komt er vanzelf in; wie een blokduur van 16 weken instelt, periodiseert alsnog op 12. Het
zichtbare pad eruit is `doelStart` verzetten, of Onderhoud kiezen.

**Dit is wat de pin van T9 repareert.** Zonder de pin krijgt Onderhoud dezelfde wekelijkse test:
gedraaid met een bundel-mutant (`effectiveMacroFase_` → passthrough, geen repo-wijziging), blokweek 13,
doel=Onderhoud → `test` · `sweet_spot` · `long_z2` · `long_z2`, 45' hoog-intent. Mét pin: `sweet_spot`
· `long_z2` · `long_z2` · `threshold`, 36'. **T9's M49-schending is daarmee niet zwakker maar sterker
bewezen: de pin is een loodgietersfix, en het lek dat hij dicht is echt — voor de andere vier doelen
staat het nog open.**

**Herkomst: geërfd, byte-identiek.** GAS `src/Settings.gs:295` (`function computeMacroPhase`) met
`src/Settings.gs:308` (`else { fase = 'Test'; isTestWeek = true; }`) — dezelfde functie, dezelfde
ontbrekende bovengrens.

### T13 — Lang versus kort klimmen heeft geen enkele route naar het plan. *(M36, M38, M33, M5)*

M36 eist twee doelen en verbiedt expliciet dat het onderscheid uitsluitend via een event binnenkomt.
T1 stelde vast dat de doel-lijst één "Beklimmingen" kent. a3 meet de andere helft: **de event-route
werkt niet.**

Het veld bestaat over de hele keten. De gebruiker kiest het in de events-editor
(`apps/web/src/pages/Events.tsx:350`, `value={row.klimType}` — Lang/Kort/Gemengd/Vlak); de Worker
valideert het (`workers/api/src/routes/api.ts:313`); D1 bewaart het
(`workers/api/src/db/schema.ts:158`, `klimType: text("klim_type")`); de client leest het
(`apps/web/src/lib/proposal.ts:213`) en geeft het door aan `assignWorkouts`, die het doorgeeft aan
`keyIntensity` (`packages/engine/src/planner.ts:697`). Daar, en alleen daar, wordt het gelezen:
`packages/engine/src/planner.ts:862` → `climbTypeWorkout_`
(`packages/engine/src/planner.ts:889`, kort→`vo2max`, lang→`threshold`/`sweet_spot`,
gemengd→`threshold`/`vo2max`). **Die aanroep zit binnen de Build/Peak-tak van een functie die alleen
in een test-week draait (T11) — en hij is daarbinnen bovendien pas fallback, ná `goalWorkout_`.**

**GEDRAAID** (doel=Beklimmingen, A-event over 6 weken, zomer 405', klok = `todayISO`): `klimType` =
vlak / lang / kort / gemengd → **vier byte-identieke weken**, vergeleken op de volledige
vingerafdruk (type + naam + alle blokken + TSS + minuten per sessie), niet op de totalen. Elke keer:
`vo2max` · `threshold` · `combo_long_with_efforts` · `long_z2`, 51' hoog + 14' top. Zelf-controle:
hetzelfde event 3 weken vooruit (→ Peak) levert wél een andere week (`vo2max` · `long_z2` ·
`combo_long_with_efforts` · `long_z2`, 30' + 14') — de harness ziet echte verschillen.

**Wat het ene klim-doel dan wél levert, hangt aan de blokweek** (geen event, zomer 405'):

| fase | hoog | top | week |
|---|---|---|---|
| Base (wk 2) | 66' | 0' | `threshold` "Drempel lang 3×14" · `long_z2` · `long_z2` · `sweet_spot` |
| Build (wk 6) | 51' | 14' | `vo2max` "VO2 Hill Repeats 9×90s" · `threshold` · `combo_long_with_efforts` "Lange rit + Beklimmingen efforts (180 min)" · `long_z2` |
| Peak (wk 10) | 30' | 14' | `vo2max` · `long_z2` · `combo_long_with_efforts` · `long_z2` |

Beide M38-eisen zitten in het profiel, door elkaar: de klim-`intentGewichten` mengen drempel 0,40 +
vo2 0,35 + sweetspot 0,25 (`packages/engine/src/archetypes.ts:1123`), en
`spreiding.effortsInLangeRit` levert in Build/Peak de "vermoeidheid die eraan voorafgaat" die M38 voor
LANGE klimmen vraagt. Maar de mengverhouding volgt de blokweek, niet de keuze: in Base krijgt de
klimmer nul werk boven de drempel (M38-kort niet bediend), in Peak zakt het drempelwerk naar 30'
(M38-lang verzwakt). **Welk van M36's twee doelen je krijgt, bepaalt de kalender.**

Onder M33 (aanbiedbaarheids-regel) en M5: de app VRAAGT de gebruiker om het klim-type en doet er
niets mee.

**Herkomst: geërfd.** `climbTypeWorkout_` staat identiek in GAS (`src/Algorithm.gs:1859`,
`src/Algorithm.gs:1861` `if (klimType === 'kort') return 'vo2max';`) op dezelfde plek in dezelfde
keten. Wat R3 hier meet is niet dat Cadans afwijkt, maar dat de constructie in beide apps niet vuurt.

### T14 — Het event neemt het plan over — meteen, op elke afstand, zonder voorstel. *(M51, M52, M10, M5)*

M51: gaat het plan over van doel-gedreven naar event-gedreven, dan stelt de coach de wissel voor en
beslist de gebruiker. M52 (OPEN): de activeringsdrempel ligt niet vast.

`apps/web/src/lib/proposal.ts:210` — `macroFaseBase = macro?.macroFase ?? computeMacroPhase(...)`.
Zodra `eventFase_` een hoofdevent vindt, VERVANGT de event-aftelling de doel-gedreven cyclus. Het
hoofdevent is het eerstvolgende A-event OF elk trip-event, zonder afstandsgrens
(`packages/engine/src/phase.ts:72`, `if (e.prioriteit === "A" || e.type === "trip") return e`). De
fase-mapping is de aftelling zelf (`packages/engine/src/phase.ts:131`, `wekenTot >= 9` → Base, `>= 5`
→ Build, anders Peak).

**GEDRAAID** (doel=FTP, `doelStart` zó dat de doel-gedreven cyclus **Build** zegt; zomer 405'; klok =
`todayISO`):

| A-race over | macroFase | fase | modus | hoog | top | week |
|---|---|---|---|---|---|---|
| — (geen event) | Build | Build | Opbouw | 77' | 0' | `threshold` · `threshold` · `long_z2` · `sweet_spot` |
| 52 wkn | **Base** | Base | Doel-gericht | **45'** | 0' | `threshold` · `long_z2` · `long_z2` · `sweet_spot` |
| 26 / 12 / 9 wkn | Base | Base | Doel-gericht | 45' | 0' | idem |
| 8 / 5 wkn | Build | Build | Doel-gericht | 77' | 0' | `threshold` · `threshold` · `long_z2` · `sweet_spot` |
| 4 / 2 wkn | Peak | Peak | Doel-gericht | 12' | 14' | `threshold` · `long_z2` · `long_z2` · `vo2max` |
| 1 wk | Peak | **Taper** | Doel-gericht | 0' | 14' | `taper_openers` · `taper_z2_kort` ×3 |
| 0 (deze week gereden) | Recovery | Recovery | Doel-gericht | 0' | 0' | `recovery` ×4 |

**Een A-race die een JAAR weg is, haalt de week van 77' naar 45' hoog-intent — 42% minder — op het
moment dat de gebruiker hem opslaat.** Geen voorstel, geen bevestiging, geen melding. Het enige
zichtbare signaal is de plan-modus-pill die van "Opbouw" naar "Doel-gericht" springt; dat is een
label, geen vraag (M10/M11).

De grens is dag-precies en onaangekondigd: 57 dagen → `wekenTot` 9 → Base; 56 dagen → `wekenTot` 8 →
Build. Op één willekeurige kalenderdag verandert het plan van karakter.

**De prioriteit beschermt niet.** Gedraaid: een B-event en een C-event over 52 weken laten het plan
ongemoeid (byte-identiek aan geen-event) — maar een **C-trip** over 52 weken neemt het plan wél over
naar Base, want `pickMainEvent_` toetst `prioriteit === "A" || type === "trip"`. Een als onbelangrijk
gemarkeerde vakantie stuurt dus een jaar lang de periodisering.

**Onder M52.** De activeringsdrempel ligt in het model niet vast; in de app ligt hij wél vast, en hij
is "onmiddellijk, op elke afstand". Onder M5 mag de app die regel niet hebben zolang het model hem
niet draagt.

**Dit scherpt R2's V8, en corrigeert de samenvatting ervan.** V8 stelde vast dat `eventContextFrom_`
niet geport is → het event raakt de WORKOUT niet. Daaruit is in de overdracht "er is geen overname"
geworden. Dat is te sterk: **de overname bestaat, alleen loopt zij via de macro-fase en niet via de
workout.** De twee bevindingen samen geven de scherpste vorm: het plan wisselt van karakter zonder
toestemming (M51), en de prikkel die je ervoor terugkrijgt is niet op het event afgestemd (V8). Het
event kost agency en levert geen tailoring.

**Herkomst: geërfd.** GAS `src/Doel.gs:201` (`if (e.prioriteit === 'A' || e.type === 'trip') return
e;`) draagt dezelfde selectie; de fase-mapping en de drempels zijn 1-op-1.

### T5 — herkomst (aanvulling uit a3): geërfd, byte-identiek

T5 liet de herkomst open. Beide dragende delen staan letterlijk in de GAS-bron.

De zin: GAS `src/Script.html:1633` draagt hem woord voor woord ("Bij <strong>' + hours + 'u/week</strong>
blijft je fitheid-plafond onder je duurdoel — zo niet haalbaar. Verhoog het volume."); Cadans
`apps/web/src/components/niveau/DoelProjectie.tsx:742` is dezelfde zin.

De afgeleide default waarop het oordeel rust: GAS `src/WebApp.gs:1268` —
`weeklyHoursDefault: weeklyHoursRecent_(actValues, 42)`, met de fallback 8 op `src/Script.html:1673` en de
clamp 4..14 op `src/Script.html:1674`. Cadans `apps/web/src/pages/Niveau.tsx:157` spiegelt dat 1-op-1.

**Nuance die R4 nodig heeft.** De M41/M8(a)/M27-schending is geërfd, maar de BEREIKBAARHEID was in
Cadans een tijd lang gróter: de gap-tak vuurde ook op een FTP-doel, waar GAS hem onderdrukt. Dat is
hersteld (`7308d660`) — de huidige stand is geërfde pariteit, geen geïntroduceerde regressie.

---

## Wat brok a openlaat

**a is af.** Wat hieronder staat is doorgeschoven werk, geen open a-vraag.

- **De blokken-loze combo.** `combo_long_with_efforts` levert wel `structuur` (weergave) maar
  `blokken: undefined` (gemeten, doel=Beklimmingen, za 180'). Raakt M56 (levering) → **c**, en R2's
  V21 (de coach leest het etiket omdat de segmenten null zijn). T13 maakt hem zwaarder: die sessie is
  de enige plek waar M38's "vermoeidheid die eraan voorafgaat" wordt bediend.
- **De vlakke 36'** (T10) is een a-bevinding met een b-vervolg: onder M9 (schaal-eis) en M47 (totale
  belasting is de primaire hendel) hoort b te wegen wat een urenbudget met de dosering hoort te doen.
- **Voor R4, niet voor R3:** T12's test-lus en T14's overname raken beide een BOUW-vraag die R2 al
  open had staan (V7's plaats-en-schrijver-vraag) — een voorstel-en-bevestig-lus vereist een
  plan-van-record om "het vorige plan" tegenover te zetten.

## Vondsten-index

| # | regel(s) | kern | herkomst |
|---|---|---|---|
| T1 | M34/M35/M36/M42 | doel-lijst ≠ de vijf; VO2max als doel; klim niet gesplitst | geërfd |
| T2 | M33 | vijf doelen, twee meetlatten; Onderhoud meet tegen een lange-rit-doel dat hij nul keer plant | geërfd, oracle-bevroren |
| T3 | M39 + M5 | CTL draagt het label "Duurvermogen" | geërfd |
| T4 | M38 | Conditie koopt −3' duur; er is geen duur-intent | geërfd |
| T5 | M40/M41, M8(a), M27/M29, M5 | haalbaarheids-oordeel + "verhoog het volume", op afgeleide uren | **geërfd, byte-identiek (a3)** |
| T7 | M37/M38/M50 | "Onderhoud = zacht" weerlegd; motivering onjuist — **INGETROKKEN, zie T10** | n.v.t. (meting) |
| T8 | M46, M37/M38, M5 | de 45-min-cap begrenst de prikkel, niet de sessie: 20' werk bij elke duur | geërfd, byte-identiek |
| T9 | M49, M50 | fase-pin = loodgietersfix (eigen docstring); payload draagt de gepinde fase — **STAAT; T12 draagt het lek dat hij dicht** | geërfd |
| T10 | M37/M38/M50 + M7 | T7 weerlegd: Onderhoud levert 36' hoog-intent bij 405', 210' én 180' — minder dan FTP, en vlak | geërfd |
| T11 | M49 + M5 | `keyIntensity` stuurt het plan niet: 400 weken, 180 treffers, alle in fase Test; profiel-tak + `climbTypeWorkout_` + 2 guards onbereikbaar | geërfd |
| T12 | M46, M49, M5 | na blokweek 12 elke week een FTP-test, voorgoed — 4 van 5 doelen; `doelDuur` wordt niet gelezen | geërfd, byte-identiek |
| T13 | M36, M38, M33, M5 | lang/kort klimmen heeft geen route: `klimType` wordt gevraagd, opgeslagen en gethreaded — en alleen gelezen door een functie die niet draait | geërfd |
| T14 | M51, M52, M10, M5 | elk A-event/trip neemt de fase over, op elke afstand, zonder voorstel: 77' → 45' door een race over een jaar; C-trip telt mee | geërfd |

T6 is bewust niet uitgegeven (de VO2max-nevenmeting is onder T4 genoteerd); de reeks is
append-only en wordt niet hernummerd. **T7 is INGETROKKEN door T10 en blijft letterlijk staan** —
zoals M3 voorschrijft voor het model, en zoals R1's micro-correctie voor dit soort documenten
vastlegde. Een ingetrokken vondst wordt niet herschreven en niet hergebruikt.
