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

## Wat a3 open laat

- **M38** voor de klim-doelen (lang + kort): wat vraagt het plan, wat levert het. T4 dekt
  Conditie/FTP/Onderhoud; klim is niet gemeten.
- **M51/M52** — plan-transities als voorstel, en de activeringsdrempel. R2's V8 stelde vast dat
  `eventContextFrom_` niet geport is en een week MET A-event byte-identiek is aan een week
  zonder. Dat maakt M51's toets ("gaat het plan stilzwijgend over?") scherper, niet losser: er
  is geen overname, dus ook geen voorstel — en het doel wordt niet event-gedreven bediend.
- **De blokken-loze combo.** `combo_long_with_efforts` levert wel `structuur` (weergave) maar
  `blokken: undefined` (gemeten, doel=Beklimmingen, za 180'). Raakt M56 (levering) → **c**,
  en R2's V21 (de coach leest het etiket omdat de segmenten null zijn).
- Welke helft van het onderhoud-profiel gelezen wordt (slot van T9).

## Vondsten-index

| # | regel(s) | kern | herkomst |
|---|---|---|---|
| T1 | M34/M35/M36/M42 | doel-lijst ≠ de vijf; VO2max als doel; klim niet gesplitst | geërfd |
| T2 | M33 | vijf doelen, twee meetlatten; Onderhoud meet tegen een lange-rit-doel dat hij nul keer plant | geërfd, oracle-bevroren |
| T3 | M39 + M5 | CTL draagt het label "Duurvermogen" | geërfd |
| T4 | M38 | Conditie koopt −3' duur; er is geen duur-intent | geërfd |
| T5 | M40/M41, M8(a), M27/M29, M5 | haalbaarheids-oordeel + "verhoog het volume", op afgeleide uren | te bepalen (a3) |
| T7 | M37/M38/M50 | "Onderhoud = zacht" weerlegd; motivering onjuist | n.v.t. (meting) |
| T8 | M46, M37/M38, M5 | de 45-min-cap begrenst de prikkel, niet de sessie: 20' werk bij elke duur | geërfd, byte-identiek |
| T9 | M49, M50 | fase-pin = loodgietersfix (eigen docstring); payload draagt de gepinde fase | geërfd |

T6 is bewust niet uitgegeven (de VO2max-nevenmeting is onder T4 genoteerd); de reeks is
append-only en wordt niet hernummerd.
