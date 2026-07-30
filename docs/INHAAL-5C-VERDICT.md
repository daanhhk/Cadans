# De week-inhaal-kaart wordt opgeruimd, niet gerepareerd — verdict (ROADMAP punt 5c)

Gemeten in de chat op de gecommitte code `e46af55`, engine plus client-lib gebundeld met
esbuild buiten de repo-tree, `TZ=Europe/Amsterdam`, `Date` gestubd per meting. GELEZEN en
GEMETEN staan apart. Dit document stelt GEEN enkele drempel vast; elk getal hieronder is een
meting, geen norm.

Het criterium in `docs/ROADMAP.md` punt 5c kent twee takken: een geleverd tekort levert een
zichtbaar WEEK-voorstel op, OF het mechanisme wordt opgeruimd als punt 10 het opneemt. Dit
document kiest de tweede tak en onderbouwt waarom de eerste niet gebouwd hoort te worden.

## 1. De recon reproduceert exact

GEMETEN op Daans configuratie (doel FTP, `doelStart` 2026-06-29, AGR 17-04-2027, week 27-07 met
maandag en dinsdag gemist, klok gestubd op woensdag 29-07): macroFase Base, mesoWeek 1,
`zoneDebt_` low 57 · high 48 · anaerobic 0, wat-als-run (`planAdaptation: true`) byte-identiek
aan het actieve plan, nul `catchup_*`-codes, `buildInhaalVoorstel` null. Gelijk aan
`docs/INHAAL-5B-RECON.md` §2.

## 2. Er is een DERDE dode plek, en die zit in de rekenregel zelf

GELEZEN. `debtPreferredType_` (`planner.ts:124`) kiest de bucket met de meeste minuten en
vertaalt `low` naar `long_z2`; de debt-pre-claim in de allocator wordt daarop geblokkeerd door
zijn eigen guard (`planner.ts:501`: `dp !== "long_z2" && dp !== "recovery"`).

GEMETEN over 88 geplande sessies (5 weekvormen × 4 doelen, de sessies die `buildWeekProposal`
zelf oplevert): NUL sessies dragen meer high plus anaerobic dan low. Een sessie van 60 minuten
staat rond 24 hoog tegen 36 laag. Bij volledig gemiste dagen is de som van de tekorten dus per
constructie low-dominant, en levert `debtPreferredType_` `long_z2`.

GEVOLG. Ook als de code-poort uit §3 hieronder wél open stond, zou de arm bij een gemiste
sleutelsessie geen intensiteit aanwijzen. Dat is een tweede, ONAFHANKELIJKE reden waarom de
kaart niet verschijnt.

UITZONDERING, gemeten en dus benoemd: de arm vuurt WEL zodra een verstreken dag is gereden mét
volume maar ZONDER intensiteit — dan wordt `debt.low` negatief en wint `high`. Twee gemeten
gevallen op dezelfde week: 120 minuten kaal Z2 op maandag en dinsdag geeft low −183 · high 48
(`dp` = `sweet_spot`); 60 minuten kaal Z2 op maandag geeft low −3 · high 48 (idem).

## 3. De structurele dood in Base, Build en Peak (ongewijzigd t.o.v. de recon)

GELEZEN. De allocator-tak (`planner.ts:776`) staat vóór de pendel-, weekend- en vrij-takken en
de endurance-fill (`planner.ts:553`) claimt elke eligible dag, dus de `catchup_*`-codes op
`planner.ts:819`, `:825` en `:849` zijn in Base, Build en Peak onbereikbaar.
`buildInhaalVoorstel` (`schema.ts:1100`) diff't juist op die codes. Doel Onderhoud raakt het pad
sowieso nooit (`archetypes.ts:1670`, `debtEnabled: false`).

## 4. De debt rekent in de VERVANGEN munt

GEMETEN op dezelfde week, gepland maandag sweet spot 45 minuten en dinsdag sweet spot 60
minuten. Een grijze rit (40 minuten Z2 plus 50 minuten Z3) geeft debt low 17 · high −2. Een
scherpe rit (40 minuten Z2 plus 50 minuten Z4) geeft debt low 17 · high −2. IDENTIEK.

GROND. `actualZoneMinutes_` vouwt Z3 en Z4 samen tot `high`. Het tekort kan tempo dus niet van
drempel onderscheiden — precies de munt die punt 6 fase 1b per zone heeft vervangen. Daans
gemeten patroon is Z3-overschot mét Z4-tekort (`docs/DOSIS-MUNT-RECON.md`: het plan vraagt 26
tegen 74 procent, de uitvoering levert 54 tegen 46), en juist dat patroon leest in deze munt als
"niets in te halen".

## 5. Waar de arm wél bijt, maakt hij de week ZWAKKER

GEMETEN, klok gepind in de levende week zodat de allocator actief is, in de vorm uit §2
(verstreken dagen gereden met volume, nul intensiteit): 72 cellen, 4 weekvormen × 3 doelen ×
3 `doelStart`-waarden × 2 keuzes voor "vandaag". Onderhoud valt af op `debtEnabled`.

- Nul `catchup_*`-codes en nul `buildInhaalVoorstel`-uitkomsten over alle 72 cellen.
- De wat-als-run levert over de resterende dagen MINDER high plus anaerobe intentminuten dan
  het actieve plan in 60 van de 72 cellen, MEER in 12, GELIJK in nul.
- Daans eigen cel: het actieve plan draagt 81 high-minuten over de rest van de week, de
  wat-als-run 41. Week-TSS 306 tegen 281, minuten in beide 360. Het plan verschilt dus wel
  degelijk — de sleutelsessie verhuist van woensdag naar donderdag — maar draagt minder
  intensiteit, en beide kanten dragen `key_session`, dus de diff blijft leeg.

GEVOLG. Het mechanisme zichtbaar maken zou de coach laten aanbieden om een gemiste
intensiteitsprikkel in te halen met een plan dat minder intensiteit bevat.

GRENS BIJ DEZE METING. De fixture voedt de activiteiten- en weekplan-historie leeg op de
geseede ritten na, dus de gekozen sjabloonNAMEN zijn geen prod-claim. De richting — minder,
meer, gelijk — en het aantal codes en voorstellen zijn dat wel.

## 6. De twee tests die het tegendeel lijken te bewijzen, leunen op de ambient klok

GEMETEN. `apps/web/src/lib/debtOptIn.test.ts` draait de volledige pijplijn en asserteert dat het
actieve plan bij opt-in een `catchup`-code draagt. Die test is groen omdat zijn fixture-week
(2026-03-09) in het verleden ligt: `allocateQualityWeek_` dateert zich op ambient `new Date()`,
dus er is geen eligible dag en de allocator is inert. Met de klok gepind op 2026-03-13, ín de
fixture-week, levert dezelfde run NUL catchup-codes — terwijl het plan tussen opt-in en
niet-opt-in nog wél verschilt. `apps/web/src/lib/redenCode.test.ts` gebruikt hetzelfde
verleden-datum-idioom en zegt dat ook in zijn eigen kop; die tests blijven geldig als
parity-toets op de per-dag-takken, maar bewijzen niets over de levende pijplijn.

## 7. Besluit

OPRUIMEN, CLIENT-ZIJDE. Bouwen zou een vierde weekstem toevoegen, gerekend in een vervangen
munt, vóór de consolidatie die zijn toon moet bepalen. `docs/DOELEN-SPEC.md` §2A (VASTGESTELD)
noemt de inhaal-kaart al expliciet een UITING van de weeklus en geen zelfstandig mechanisme met
een eigen drempel; punt 10 neemt hem dus op. Dat is de tweede tak van het criterium.

WAT ER VERDWIJNT. `InhaalCard.tsx` plus de call-sites in `SchemaView` en `Preview`;
`buildInhaalVoorstel`, `CATCHUP_BUCKET` en de types `InhaalVoorstel` en `InhaalVoorstelDag`;
de tweede `buildWeekProposal`-run per render (`voorgesteldeWeek` plus `inhaalBandOk`);
`inhaalAanbodRegel`, `inhaalBucketTerm` en het type `InhaalBucket`; de goedkeur-keten
(`GET`/`PUT /api/debt-opt-in`, `readDebtOptIn`/`writeDebtOptIn`, `getDebtOptIn`/`putDebtOptIn`,
de `optedIn`-afleiding en het doorgeven ervan als `planAdaptation`); en de testbestanden
`inhaal.test.ts`, `debtOptIn.test.ts` en `routes.debt-optin.test.ts`.

WAT BLIJFT STAAN, en waarom. De ENGINE wordt niet aangeraakt: `zoneDebt_` (`weekprep.ts:107`),
`debtPreferredType_` en de `catchup_*`-takken zijn GAS-parity en het ruwe materiaal dat punt 10
nodig heeft als de weeklus ooit een per-zone-tekort wil uitspreken. De `catchup_*`-copy-pools in
`coachNarrative.ts` blijven: die dragen de dagkaart-reden en zijn in fase Test bereikbaar. De
kolom `sync_state.debt_opt_in_week` blijft: migraties zijn forward-only, laten staan kost niets,
en twee andere routetests gebruiken de kolom als isolatie-fixture. De bouw-input
`planAdaptation` blijft bestaan zodat het engine-pad testbaar blijft; de app geeft hem niet meer
mee, dus hij valt terug op `PLAN_ADAPTATION_ENABLED` (`planFlags.ts:28`, false).

PREMISSE-CORRECTIE. `docs/ROADMAP.md` punt 5c stelt dat 5c de allocator raakt en dus
engine-autorisatie vraagt. Dat geldt voor de BOUW-tak. De opruim-tak raakt `packages/engine`
niet en vraagt geen migratie.

GEDRAGSNEUTRAAL, per constructie. `optedIn` kan alleen waar worden door de knop in `InhaalCard`,
en die kaart rendert alleen bij `optedIn || inhaal` — beide altijd onwaar. Het actieve plan
draait dus vandaag al met `planAdaptation` uit. De acceptatie-eis is daarom een
BEGRENZINGSBEWIJS: de shot-harness vóór en ná op dezelfde machine, zonder werk ertussen dat de
lokale D1 raakt, en alle shots byte-identiek.

## 8. Wat niet in deze ronde zit

De week-brede uitspraak over een geleverd tekort. Die hoort bij punt 10, in de nieuwe per-zone
munt en met één stem. Punt 10 krijgt dat in dezelfde close-out expliciet in zijn criterium.
