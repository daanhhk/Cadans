# PUNT 11 — MEETDATA

**GEMETEN 05-08-2026, VOLLEDIG READ-ONLY.** Eén `SELECT` op de REMOTE D1 `cadans` plus
`GET`-calls op intervals.icu. Geen enkele schrijf-actie: de D1-response draagt
`rows_written: 0` en `changed_db: false`. Geen code, geen engine, geen migratie, geen deploy.
Dit document is RUWE UITVOER — geen duiding, geen conclusie, geen afgeleid oordeel. De
criterium-keuze staat als laatste sectie en is VOORAF vastgelegd.

**AUTH EN SECRETS.** HTTP Basic, username `API_KEY`, wachtwoord = `INTERVALS_API_KEY` uit
`workers/api/.dev.vars`. De sleutel staat NERGENS in dit document; de athlete-id is overal
vervangen door `<ATHLETE_ID>`. Van locatie-, GPS- en startvelden is niets overgenomen.

## 1. Meetopzet

**D1, verbatim** (gedraaid vanuit `workers/api`; de databasenaam komt uit `wrangler.jsonc`):

```
npx wrangler d1 execute cadans --remote --json --command "SELECT activity_id_ext, datum, type, duur_min, gem_w, norm_w, if_pct, tss, ftp, gewicht FROM activities WHERE user_id = 1 AND type IN ('Ride','VirtualRide','GravelRide','MountainBikeRide') AND datum >= '2025-09-01' ORDER BY datum;"
```

Response: `rows_written: 0`, `changed_db: false`, `rows_read: 222`, **183 resultaatrijen**.

**intervals.icu, verbatim:**

```
GET https://intervals.icu/api/v1/athlete/<ATHLETE_ID>/activities?oldest=2025-09-01&newest=2026-08-05
GET https://intervals.icu/api/v1/activity/<id>/streams
```

Het LIJST-object draagt de sleutel `icu_joules`: **JA**, op **178 van de 183** fietsritten.
Koppeling op `activity_id_ext`: **183 van de 183** gekoppeld, **0** niet.
HTTP 429's tijdens de hele meting: **0**.

**DE TIJD-AS IS DE RIJ-AS, NIET DE KLOK.** Dit is een eigenschap van het instrument en hoort in
de opzet. GEMETEN op de rit van 2026-07-18: de `time`-stream spant 187,5 minuten terwijl
`duur_min` 127 is, met dt-sprongen van 33, 42 en 43 seconden op de pauzes. Er is GEEN
`moving`-stream. Het aantal samples is 7645 = 127,4 minuten, en dat is exact de rijtijd. Eén
sample is dus één RIJ-seconde. Een eerste doorrekening op de KLOK-as gaf t_ster 152 minuten op
een rit van 127 minuten; die is verworpen. Alle grootheden hieronder tellen samples, en er staat
een controle op: `t_ster + rest_min` hoort `duur_min` te zijn binnen 1,5 minuut. Die controle
klopt op **25 van de 25** gemeten ritten.

**IJKING (stap 3b), de drie langste ritten.** Eigen integratie van de watts-stream tegen
`icu_joules` van diezelfde rit:

- 2026-04-18 (340 min): eigen integratie **3272539 J**, `icu_joules` **3272539 J**, verschil **0.00%**. Samples 341.2 min.
- 2025-10-24 (316 min): eigen integratie **3558781 J**, `icu_joules` **3558781 J**, verschil **0.00%**. Samples 316.1 min.
- 2026-06-16 (266 min): eigen integratie **2599978 J**, `icu_joules` **2600028 J**, verschil **0.00%**. Samples 266.2 min.

Alle drie binnen de 3%-grens, dus de meting is niet zijn eigen aanname.

## 2. De zeven grootheden, in woorden

De drempel is 15 kJ per kilogram lichaamsgewicht. `gewicht` komt uit de D1-rij; ontbreekt die,
dan valt hij terug op `icu_weight` uit het lijst-object en wordt dat per rit gemeld.
Elke grootheid rondt ÉÉN keer af, op het getal dat hier staat; afgeronde delen worden nooit
opgeteld.

- **t_ster** — de eerste RIJ-seconde waarop de cumulatieve arbeid, geïntegreerd uit de
  watts-stream, gelijk is aan of groter dan 15 maal het gewicht in kJ. Gerapporteerd in minuten.
- **rest_min** — de resterende RIJTIJD na t_ster: het aantal samples vanaf t_ster tot het einde
  van de stream, gedeeld door 60.
- **p20_na** — het hoogste voortschrijdend gemiddelde vermogen over 20 aaneengesloten
  rij-minuten NA t_ster. Leeg als rest_min kleiner is dan 20.
- **p20_voor** — hetzelfde, maar over het venster VÓÓR t_ster.
- **p20_rit** — hetzelfde, over de HELE rit.
- **p_gem_na** — het rekenkundig gemiddelde vermogen over alle samples vanaf t_ster tot het
  einde.
- **ftp_rit** — de `ftp`-kolom uit de D1-rij van diezelfde rit, ongewijzigd overgenomen.

## 3. De kandidaat-ritten

Kandidaat = fietsrit met `duur_min` groter dan of gelijk aan 90 EN `icu_joules` gedeeld door
1000 groter dan of gelijk aan 15 maal het gewicht.

- 2025-09-06 · duur_min 157 · arbeid_kj 1921 · t_ster 90 · rest_min 67 · p20_voor 222 · p20_na 245 · p20_rit 245 · p_gem_na 201 · ftp_rit 270
- 2025-10-18 · duur_min 128 · arbeid_kj 1361 · t_ster 102 · rest_min 26 · p20_voor 250 · p20_na 167 · p20_rit 250 · p_gem_na 159 · ftp_rit 270
- 2025-10-24 · duur_min 316 · arbeid_kj 3559 · t_ster 99 · rest_min 217 · p20_voor 221 · p20_na 260 · p20_rit 260 · p_gem_na 188 · ftp_rit 270
- 2025-11-02 · duur_min 105 · arbeid_kj 1241 · t_ster 94 · rest_min 12 · p20_voor 212 · p20_na — · p20_rit 212 · p_gem_na 185 · ftp_rit 270
- 2025-11-16 · duur_min 110 · arbeid_kj 1231 · t_ster 98 · rest_min 12 · p20_voor 204 · p20_na — · p20_rit 204 · p_gem_na 169 · ftp_rit 270
- 2025-12-21 · duur_min 106 · arbeid_kj 1199 · t_ster 98 · rest_min 8 · p20_voor 207 · p20_na — · p20_rit 207 · p_gem_na 179 · ftp_rit 275
- 2026-02-28 · duur_min 162 · arbeid_kj 1739 · t_ster 102 · rest_min 60 · p20_voor 197 · p20_na 181 · p20_rit 197 · p_gem_na 170 · ftp_rit 275
- 2026-03-05 · duur_min 115 · arbeid_kj 1128 · t_ster 114 · rest_min 1 · p20_voor 177 · p20_na — · p20_rit 177 · p_gem_na 61 · ftp_rit 275
- 2026-03-19 · duur_min 145 · arbeid_kj 1538 · t_ster 108 · rest_min 38 · p20_voor 193 · p20_na 192 · p20_rit 193 · p_gem_na 181 · ftp_rit 275
- 2026-04-05 · duur_min 138 · arbeid_kj 1543 · t_ster 100 · rest_min 38 · p20_voor 223 · p20_na 185 · p20_rit 223 · p_gem_na 181 · ftp_rit 275
- 2026-04-11 · duur_min 204 · arbeid_kj 2333 · t_ster 102 · rest_min 102 · p20_voor 199 · p20_na 218 · p20_rit 218 · p_gem_na 198 · ftp_rit 275
- 2026-04-18 · duur_min 340 · arbeid_kj 3273 · t_ster 125 · rest_min 216 · p20_voor 193 · p20_na 225 · p20_rit 225 · p_gem_na 166 · ftp_rit 275
- 2026-05-01 · duur_min 129 · arbeid_kj 1427 · t_ster 97 · rest_min 32 · p20_voor 229 · p20_na 159 · p20_rit 229 · p_gem_na 157 · ftp_rit 275
- 2026-05-18 · duur_min 103 · arbeid_kj 1136 · t_ster 102 · rest_min 1 · p20_voor 192 · p20_na — · p20_rit 192 · p_gem_na 131 · ftp_rit 275
- 2026-05-24 · duur_min 101 · arbeid_kj 1207 · t_ster 94 · rest_min 8 · p20_voor 225 · p20_na — · p20_rit 238 · p_gem_na 179 · ftp_rit 275
- 2026-05-30 · duur_min 103 · arbeid_kj 1163 · t_ster 98 · rest_min 5 · p20_voor 209 · p20_na — · p20_rit 209 · p_gem_na 124 · ftp_rit 275
- 2026-06-07 · duur_min 98 · arbeid_kj 1168 · t_ster 94 · rest_min 4 · p20_voor 243 · p20_na — · p20_rit 243 · p_gem_na 163 · ftp_rit 275
- 2026-06-14 · duur_min 181 · arbeid_kj 1729 · t_ster 99 · rest_min 83 · p20_voor 232 · p20_na 216 · p20_rit 232 · p_gem_na 124 · ftp_rit 275
- 2026-06-15 · duur_min 163 · arbeid_kj 1624 · t_ster 116 · rest_min 47 · p20_voor 243 · p20_na 222 · p20_rit 243 · p_gem_na 181 · ftp_rit 275
- 2026-06-16 · duur_min 266 · arbeid_kj 2600 · t_ster 116 · rest_min 150 · p20_voor 254 · p20_na 227 · p20_rit 254 · p_gem_na 165 · ftp_rit 275
- 2026-06-19 · duur_min 120 · arbeid_kj 1257 · t_ster 102 · rest_min 18 · p20_voor 269 · p20_na — · p20_rit 269 · p_gem_na 131 · ftp_rit 275
- 2026-07-02 · duur_min 105 · arbeid_kj 1181 · t_ster 97 · rest_min 7 · p20_voor 201 · p20_na — · p20_rit 201 · p_gem_na 155 · ftp_rit 275
- 2026-07-06 · duur_min 125 · arbeid_kj 1481 · t_ster 93 · rest_min 32 · p20_voor 209 · p20_na 200 · p20_rit 209 · p_gem_na 191 · ftp_rit 275
- 2026-07-18 · duur_min 127 · arbeid_kj 1500 · t_ster 92 · rest_min 36 · p20_voor 238 · p20_na 197 · p20_rit 238 · p_gem_na 181 · ftp_rit 275
- 2026-07-25 · duur_min 106 · arbeid_kj 1277 · t_ster 91 · rest_min 15 · p20_voor 252 · p20_na — · p20_rit 252 · p_gem_na 182 · ftp_rit 280

## 4. Tellers

- **NOEMER: 183** — alle fietsritten uit de D1-query vanaf 2025-09-01
  (`Ride`, `VirtualRide`, `GravelRide`, `MountainBikeRide`). Dit is het TOTAAL, niet wat er
  na uitsluiting overbleef.
- **TELLER, kandidaten: 25** van de 183 halen beide drempels.
- **TELLER, gemeten: 25** van de 25 kandidaten zijn volledig doorgerekend.
- **TELLER, met p20_na: 14** van de 183 — de ritten met
  rest_min groter dan of gelijk aan 20, dus met een 20-minutenvenster NA de drempel.
- **UITSLUITINGEN MET REDEN.**
  - 158 van de 183 vielen af op de KANDIDAATDREMPEL: duur_min kleiner dan 90, of arbeid kleiner dan 15 kJ/kg, of geen `icu_joules` op het lijst-object (5 fietsritten dragen die sleutel niet).
  - 11 van de 25 kandidaten dragen GEEN p20_na, omdat rest_min kleiner is dan 20 minuten. Hun overige grootheden staan wel in sectie 3.
  - 0 ritten zijn tijdens het doorrekenen uitgesloten door een fout.
  - 0 ritten gebruikten `icu_weight` in plaats van de D1-kolom `gewicht`.
- **SPREIDING van p20_na, ruw en zonder duiding:** 14 waarden, laagste
  159, hoogste 260, mediaan
  216. De volledige reeks, oplopend:
  159, 167, 181, 185, 192, 197, 200, 216, 218, 222, 225, 227, 245, 260.

## 5. Criterium-blok

Vooraf vastgelegd, voor de uitslag bekend was. De meting beslist tussen drie uitkomsten.
A. Bereikbaar en discriminerend — er zijn kandidaat-ritten met rest_min >= 20, en p20_na
   varieert substantieel tussen ritten in plaats van vast te zitten aan het rit-karakter.
   Dan is de maat te bouwen.
B. Bereikbaar maar niet discriminerend — p20_na ligt op vrijwel elke rit op duurtempo. Dan
   meet de maat de RITKEUZE en niet het duurvermogen, hangt hij aan combo_long_with_efforts,
   en kan hij niet bestaan voor het klim-doel actief is. Punt 11 wordt dan afgebakend en
   geparkeerd met datum; M39 blijft OPEN met de reden erbij.
C. Niet bereikbaar — te weinig ritten halen de drempel met 20 minuten over. Dan vervalt de
   primaire maat en is de vervolgvraag of de secundaire maat de meter wordt, of dat Conditie
   per M33 van de doel-lijst af moet.
