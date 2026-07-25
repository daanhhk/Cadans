# Doel-referent — recon: elk doel moet een meetbare verwachting dragen

Status: RECON, nog niet gebouwd. Fase 1 client-only verwacht; fase 2 raakt de engine (aparte
autorisatie). Ankers geverifieerd tegen de bron op HEAD `2ed1271` en de bevroren GAS op `3e8090a`.

## 1. De vraag

Elk doel dat je voor een periode instelt moet zichtbaar bijdragen aan fitter worden — ook als het
event 38 weken weg ligt. Vandaag stuurt een doel alleen profiel-parameters (quotum, tussenruimte,
archetype-keuze), geen verwachte voortgang. Er bestaat dus geen antwoord op "had mijn CTL deze
periode moeten stijgen". Herkomst: de openstaande post in `HANDOFF.md` plus
`docs/DOORTRAIN-KAART-RECON.md` §10, die exact deze referent als ontbrekend aanwijst.

## 2. Twee lagen, gemeten

Een doel raakt twee lagen, en maar één ervan is per doel.

- De PLANNER-laag WERKT per doel. `profileForDoel_` (`packages/engine/src/archetypes.ts`) mapt elk
  doel naar een eigen `PROFILES`-profiel: FTP → `ftp`, Beklimmingen → `klim`, VO2max → `vo2max`,
  Conditie → `conditie`, Onderhoud → `onderhoud`, onbekend → `klim`. Vijf doelen, vijf profielen.
- De MEETLAT-laag NIET. `activeGoalProfile_` (`packages/engine/src/niveau.ts`) kent maar twee
  uitkomsten: `if (doel === "FTP") return GOAL_PROFILES_.ftp; return GOAL_PROFILES_.girona;`. FTP
  krijgt het ftp-profiel; élk ander doel — Onderhoud, beide beklim-doelen, Conditie, onbekend —
  valt terug op `girona`. Dat is de kern van de vondst: de renner kiest een doel, maar de meetlat
  meet naar Girona tenzij het doel precies "FTP" is.

## 3. De meetlat vandaag

`GOAL_PROFILES_` draagt twee profielen.

- `girona` — `projectieMode: "gap"`, drie dims: Klimvermogen (`ftpWkg`, target 4,0 W/kg),
  Duurvermogen (`ctl`, target 65 CTL), Lange-rit (`longRideH`, target 4,0 u). De gap-modus toont per
  dim de afstand tot het target plus een doel-lijn.
- `ftp` — `projectieMode: "test"`, één dim: Duurvermogen (`ctl`, target 65 CTL). In test-modus is de
  duur-dim ONGEBRUIKT (geen gap-rij, geen target-lijn — zie de bron-comment op de dim); de
  projectie draait op een vaste testdatum + volume, en de `ftpBandFromProjection_`-band IS de
  doel-uitspraak. Het verschil tussen de twee modi is dus niet alleen een andere target maar een
  andere manier van projecteren: "gap tot een duurdoel" tegenover "wat te verwachten op testdag".

## 4. Wat de gebruiker ziet

De Niveau-tab draait de meetlat live. `Niveau.tsx` roept `activeGoalProfile_(settings)` aan;
`DoelProjectie.tsx` toont de kop `Doel-gereedheid · {label}` (het profiel-label) letterlijk, plus de
sub-regel, en de coach-callout noemt het doel bij naam ("Alles op koers voor {label}", "richting
{label}"). NIET ACUUT: het actieve doel is vandaag FTP, dus er staat het FTP-profiel en de tekst
klopt. De girona-terugval bijt pas zodra het doel naar Onderhoud gaat (winter) — dan zegt de kaart
"Doel-gereedheid · Girona" bij een onderhoudsdoel — en opnieuw bij Korte beklimmingen, het A-doel
richting AGR. Het is een latente misclassificatie, geen zichtbare bug vandaag.

## 5. De machinerie bestaat al

De rekenkern voor een procesreferent staat er. `ctlPlateauFromVolume_(weeklyHours, tssPerHour)` =
`uren × tss/uur / 7` levert het CTL-plafond bij een gegeven weekvolume; `ctlApproachWeeks_` geeft via
de PMC-tijdconstante `PROJ_TAU_DAYS_ = 42` het aantal weken tot een target-CTL (null =
onbereikbaar, 0 = al bereikt). Twee beperkingen. Eén: die machinerie leeft alleen in de Niveau-laag,
niet in de dosis- of schema-laag. Twee: ze stelt uitsluitend de VOORUIT-vraag ("hoeveel weken tot
het plateau"). De terugkijk-vraag — "had de CTL deze afgelopen periode moeten stijgen, en deed ze
dat" — is dezelfde formule omgekeerd en wordt nergens gesteld.

## 6. GAS-parity

De bevroren bron draagt dezelfde machinerie in de web-laag: `WebApp.gs` heeft `GOAL_PROFILES_`,
`activeGoalProfile_` (met dezelfde twee uitkomsten FTP/girona), `ctlPlateauFromVolume_`,
`ctlApproachWeeks_` en `PROJ_TAU_DAYS_ = 42` één-op-één; `SelfTest.gs` borgt ze met de asserties
`ctlPlateau 8x56 → 64`, de drie `ctlWeeks`-gevallen (bereikbaar/onbereikbaar/al-bereikt) en
`ftp target ctlWeeks finite`. De referent-vraag ontbreekt dus óók in GAS. Dit is NIEUWBOUW op een
geërfd, oracle-geborgd fundament — geen parity-schuld die we eerst moeten inlossen, maar een gat dat
beide implementaties delen.

## 7. Het ontwerp

Scheid BESTEMMING van WEEKVERWACHTING.

BESTEMMING = waar moet ik uitkomen. Levert het EVENT als er een hoofd-event staat, anders het
doel. Girona blijft bestaan als EVENT-profiel voor een meerdaagse; het is geen fallback-
meetlat voor alles-behalve-FTP meer.

WEEKVERWACHTING = wat had deze periode moeten gebeuren. Komt altijd van het doel plus de
beschikbare weekuren. Dit is de referent.

TWEE VRAGEN, IN DEZE VOLGORDE. Eerst UITVOERING: heb je gedaan wat het plan vroeg
(sleutelsessies, tijd-in-zone)? Dan pas EFFECT: levert het wat het moet leveren. Zonder de
eerste is de tweede betekenisloos; bij een gemiste week zwijgt de app over effect.

CTL IS EEN BELASTINGSMAAT, GEEN VORMMAAT. Bruikbaar als procesreferent bij opbouwdoelen,
nooit als uitspraak dat iemand sterker wordt. Die beperking hoort expliciet in de copy (M5).

Per doel, aansluitend op de VERWACHTING-regels in docs/DOELEN-SPEC.md paragraaf 3:
- FTP verhogen: CTL stijgt richting het plateau bij de ingestelde weekuren (procesreferent).
- Onderhoud: NIET CTL. Bij minder uren HOORT de CTL te dalen — dat is het doel, geen signaal.
  Referent = uitvoering: worden de kwaliteitssessies en de tijd-in-zone gehaald.
- Korte beklimmingen: als FTP; dit is het A-doel richting AGR.
- Lange beklimmingen: als FTP, plus een lange-rit-verwachting.
- Conditie: als FTP, plus de durability-maat; die staat leeg zolang de ritten te kort zijn en
  dan zwijgt de app erover (M5).

## 8. Bouwplan

- FASE 1 (client-only). Een meetlat per doel — `activeGoalProfile_` uitbreiden zodat elk doel zijn
  eigen bestemming/verwachting draagt in plaats van naar girona te vallen — plus de referent
  berekenen (plateau + verwachte CTL-ramp uit de bestaande helpers, of de uitvoerings-referent bij
  Onderhoud) en de coach er iets over laten ZEGGEN. Voorwaardelijke, M5-veilige copy.
- FASE 2 (raakt de engine, aparte autorisatie). De referent koppelen aan de DOSIS, zodat een
  doortrain-week onderbouwd op een hogere opbouw-trede kan landen. Noteer: de UP-override van de
  doortrain-kaart zet vandaag `mesoWeek 1`, de LAAGSTE opbouw-trede — precies het knelpunt dat een
  referent-gestuurde trede-keuze zou oplossen. Selftest-vloer stijgt mee.

## 9. Wat NIET verandert

De planner-profielen (`profileForDoel_` en `PROFILES`), de event-as (`eventFase_`), en het
blok-signaal van de doortrain-kaart (`computeBlockCtlDelta`) blijven ongemoeid. Dit ontwerp voegt
een meetlat-laag toe; het herschrijft de planner niet.

## 10. IJking en open punten

IJK-CASUS. Het actieve doel is FTP, dat verwacht een stijgende CTL, en de CTL zakt vijf weken op rij
van 51,8 naar 45,8 (gemeten, remote D1, read-only). Daar spreekt de referent zich dus als eerste
over uit — een FTP-doel met dalende CTL is precies de mismatch die de kaart moet benoemen. Toets de
referent op die echte reeks vóór je een drempel vastlegt. De UITVOERINGS-referent leunt op de
bewaarde weekplannen en de gepland-vs-gedaan-kaart; die basis ligt er sinds de
plan-van-record-gat-fix (aanpak A). Elke drempel wordt op de ECHTE reeks geijkt en moet op een
plateau liggen, niet op een modelcurve — zie de les daarover in `docs/WERKWIJZE.md`
(*Recon en bewijslast*).
