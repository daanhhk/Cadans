# STAP 7 — bouwitem 1 en 2: meetronde

Meetbank: engine + `apps/web/src/lib/proposal.ts` gebundeld met esbuild buiten de repo-tree,
TZ Europe/Amsterdam, `Date` gestubd per week. Geijkt: reproduceert `docs/STAP7-RECON.md` §3
exact (45 / 49 / 52 / 13 kwaliteitsminuten) en de week-TSS-reeks 220 / 223 / 223 / 172.

## 1. NORM (Daan, dragend) — er bestaat geen beschermde lange rit

De coach vult de beschikbaar gestelde tijd zo optimaal mogelijk in, zodat de belasting past bij
de week. DUUR IS EEN EIGENSCHAP VAN DE DAG, GEEN VOORSCHRIFT VOOR DE INHOUD: een lange dag mag
intensiteit dragen. Het ENIGE vaste element is de heenrit van de pendel (rustig). Al het andere
deelt de coach in op basis van de opgegeven tijd. Deze norm hoort in `docs/DOELEN-SPEC.md`;
hij is meermaals in chats gegeven en nooit vastgelegd.

Deze norm gaat over WIE beslist, niet over WAT de inhoud is. De gebruiker levert uitsluitend
beschikbare tijd; de app bepaalt de invulling. Een regel die de INHOUD vastlegt hoort alleen in
`docs/DOELEN-SPEC.md` als hij op data is geijkt — met de hand gekozen dosisregels horen er niet
in. Zonder dat onderscheid keert deze discussie elke chat terug.

## 2. De derde-prikkel-klem — GEISOLEERD, de vorige diagnose was fout

`docs/STAP7-RECON.md` §3 wees `goalWorkout_` / `goalPickIntent_` aan. Weerlegd: vier
achtereenvolgende aanroepen leveren probleemloos drempel, sweetspot, drempel, sweetspot met
steeds een ander sjabloon. De klem bestaat uit DRIE gestapelde hekken.

HEK 1 — de lange-rit-pre-claim. `allocateQualityWeek_` stap 1 geeft de langste trainbare
niet-pendeldag aan `long_z2` en haalt hem uit de pool, ZONDER `remaining` te verlagen. Gemeten
op ma60 / di60 / do60 / za120, doel FTP, mesoweek 1:

- baseline: 45 kwaliteitsminuten, 2 dagen
- `langeRitPerWeek` 0, quotum 2: 69 minuten, 2 dagen
- `langeRitPerWeek` 0, quotum 3: 93 minuten, 3 dagen
- quotum 3 MET de claim: 45 minuten, 2 dagen — inert

HEK 2 — `gapOK_` met `midweekMinGap` 1 eist twee dagen tussenruimte; ma/di/do draagt er dan twee.

HEK 3 — `demote_recent_hard` (`planner.ts`, avoid-consecutive-hard) zet NA de allocator een
toegewezen kwaliteitsdag terug naar `long_z2` als de vorige kalenderdag hard was, met een vaste
afstand van een dag die het profiel negeert. Met `midweekMinGap` 0 plaatst de allocator wel drie
prikkels; hek 3 gooit de derde weg. Dat is waarom elke hendel bovenstrooms inert meet.

## 3. De omkering FTP tegenover Onderhoud — verklaard

`PROFILES.onderhoud.langeRitPerWeek` is 0, `PROFILES.ftp.langeRitPerWeek` is 1. Dat ene veld is
de reden dat het onderhoudsdoel bijna twee keer zo hard traint als het doel dat de FTP moet
verhogen. Geen dosisregel en geen weging.

## 4. De Onderhoud-verwatering tussen vijf en zes uur — verklaard

De archetype-bibliotheek loopt van 33 tot 135 minuten; GEEN sjabloon dekt meer dan 135. De
kandidaat-filter in `goalWorkout_` eist `beschikbareTijd <= duurRange[1]`, dus bij 180 minuten
kwalificeren er NUL en valt de dag door naar duurwerk. Gemeten, winterweek, doel Onderhoud:

- za 120: 87 kwaliteitsminuten, 3 dagen
- za 180: 45 kwaliteitsminuten, 2 dagen
- dezelfde zes uur als za 120 plus zo 60: 66 minuten, 3 dagen

Zelfde blindevlek als de geparkeerde T17 fase 2, nu gemeten als directe oorzaak.

## 5. De vulling bestaat al — het is een selectiepoort, geen ontbrekende functie

`expandArchetype_` gevoed met `doelMin` ver boven `duurRange[1]` levert een correcte sessie:
warmup, kwaliteitsblokken ongewijzigd, Z2-fill ertussen, cooldown; totaal landt exact op
`doelMin`, geen `tooLong`, blokaantal ongewijzigd.

- `threshold_2x12` doelMin 62 / 120 / 180 / 240 → intent high blijft 24, low 38 / 96 / 156 / 216
- `sweetspot_2x15` idem, high blijft 30
- bij 180 minuten kwalificeren 0 van 35 sjablonen; zonder plafond 35 van 35

LET OP de bekende regressie: de tie-break sorteert OPLOPEND op `duurRange[0]`, dus met het
plafond eraf wint het kortste sjabloon en krijgt een dag van vier uur 24 minuten drempel. Dát is
aantoonbaar fout; welke regel er WEL hoort te staan is een dosisvraag die geijkt moet worden en
niet hier gekozen — zie paragraaf 9, punt 4.

## 6. De TSS-weging — gemeten, nog niet geijkt op eigen data

Exacte referentie = kwadratisch per blok (elk blok draagt `pctLo` / `pctHi`): minuten x IF^2 x
1,6667. Over de 35 sjablonen:

- huidige weging: 17,6 procent te laag, spreiding min 27 tot min 7 procent
- constanten 0,70 / 1,35 / 2,20: 3,3 procent te hoog, spreiding min 9 tot plus 16 procent
- op de weekvorm van 2026-06-29: nu 220, constanten 247, exact 248

Duurgewogen tarieven per minuut, gemeten op de bibliotheek: rust 0,443, z2 0,705, tempo 1,332,
drempel 1,513, anaeroob 2,122. De `low`-bucket mengt rust met z2 (factor 1,6), `high` mengt tempo
met drempel. EEN tarief per bucket kan dus niet voor beide kloppen; de juiste waarde hangt af van
de mix, en die verschilt tussen een intervalsessie en een week.

BESLUIT UITGESTELD tot de ijking op eigen ritten (paragraaf 7). Zonder ijkpunt meet een model
zijn eigen aannames.

## 7. Openstaande meting — read-only SELECT op remote D1

`activities` draagt `tss` (gemeten, uit `icu_training_load`), `zone_times_json`
(array van `{id, secs}`, Z1..Z7) en `duur_min`. Daarmee is de mapping zonetijd naar TSS te fitten
op de echte ritten, met de gemeten TSS als grondwaarheid. Levert de tarieven EN het restant dat
een drie-bucket-model laat liggen. Approval-gated maar toegestaan (`WERKWIJZE.md`, Prod en
veiligheid).

## 8. Bijvangst

`pendel_z2`, `pendel_intervals` en `recovery` geven `intent: null` en een leeg `blokken`-array,
maar dragen wel TSS. Op een pendeldag telt de dosis-valuta dus nul mee, terwijl DOELEN-SPEC
tijd-in-zone als dosis-eenheid aanwijst. Raakt de uitvoerings-referent en de blok-norm.

## 9. Herziene bouwvolgorde voor item 2

De eerste drie ingrepen zijn MECHANISCH — ze halen hekken weg die aantoonbaar niet-bedoeld
gedrag veroorzaken. De vierde is een DOSISVRAAG en wordt geijkt, niet gekozen.

1. Lange-rit-pre-claim vervalt: duur bepaalt de omvang van de dag, niet de inhoud.
2. Duur-plafond uit de kandidaat-filter van `goalWorkout_`.
3. `demote_recent_hard` beperken tot de CROSS-WEEK bescherming (`recentHardDate`), niet als
   tweede oordeel over dagen die de allocator zojuist zelf plaatste.
4. De SELECTIEREGEL voor een lange dag. Met het plafond eraf kwalificeren alle 35 sjablonen en
   wint via de huidige tie-break het KORTSTE — een dag van vier uur krijgt dan 24 minuten
   drempel. Dat is aantoonbaar fout, maar het juiste antwoord staat hier NIET: hoeveel
   kwaliteit een dag van twee, drie of vier uur hoort te dragen is een trainingsvraag, geen
   implementatiekeuze. Die regel wordt AFGELEID uit de meting van paragraaf 7 (wat leverde een
   lange dag in de praktijk aan belasting op) en uit de coach-canon in `docs/DOELEN-SPEC.md`,
   en pas daarna in code gezet. Tot die ijking blijft dit een OPEN punt.

## 10. Wat hier bewust NIET staat

Geen enkele nieuwe trainingsregel. Dit document meet wat de app doet en waarom, en wijst aan
welke keuzes nog geijkt moeten worden. Een dosis- of selectieregel die met de hand is gekozen
in plaats van geijkt hoort niet in dit document en niet in de code.
