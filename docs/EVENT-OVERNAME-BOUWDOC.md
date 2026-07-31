# Cadans — DE EVENT-OVERNAME ALS VOORSTEL (ROADMAP punt 9, fase B) — BOUWDOC

Spec waartegen gebouwd wordt. Alle metingen hieronder zijn in de chat gedaan op `5a761f0`
met de GEBUNDELDE engine (esbuild, buiten de repo-tree), `TZ=Europe/Amsterdam`.

## 1. Waar dit op staat

Fase A liet het doel de macrofase sturen tot acht weken vóór het hoofdevent
(`EVENT_OVERNAME_WEKEN` = 8, herkomst BELEID, `DOELEN-SPEC` §2B). Op die grens kantelt de
as vandaag AUTOMATISCH naar het event. Fase B maakt er een VOORSTEL van: tot Daan
bevestigt blijft het ingestelde doel de fase sturen. Dat is het criterium dat punt 9 nog
open houdt.

## 2. GEMETEN — de fase-as met en zonder overname

Keten `eventFase_` → `computeMacroPhase` → `effectiveMacroFase_`, doelStart 2026-06-29,
AGR 2027-04-17, doel FTP, alle maandagen 2027-01-04 t/m 2027-05-31. Toonbare fase =
overlay Taper/Recovery wint, anders de effectieve macrofase.

  datum        doelfase (blok/week)  wkTot  event-as  TOON bij JA  TOON bij NEE
  2027-02-15   Peak  (blok3 w10)       9    Base      Peak         Peak
  2027-02-22   Peak  (blok3 w11)       8    Build     Build        Peak
  2027-03-01   Test  (blok3 w12)       7    Build     Build        Test
  2027-03-08   Base  (blok4 w1)        6    Build     Build        Base
  2027-03-15   Base  (blok4 w2)        5    Build     Build        Base
  2027-03-22   Base  (blok4 w3)        4    Peak      Peak         Base
  2027-03-29   Base  (blok4 w4)        3    Peak      Peak         Base
  2027-04-05   Build (blok4 w5)        2    Peak      Peak         Build
  2027-04-12   Build (blok4 w6)        1    Taper     Taper        Taper
  2027-04-19   Build (blok4 w7)        -    -         Build        Build

DRIE DINGEN VOLGEN HIERUIT, en ze horen alle drie in de kaart-copy of in de docs.
1. De TAPERWEEK KOMT ER SOWIESO. 2027-04-12 levert Taper bij beide antwoorden: die overlay
   hangt per dag aan een event binnen zeven dagen, niet aan de macro-as. "Nee" kost geen taper.
2. "NEE" LEVERT EEN FTP-TESTWEEK OP 2027-03-01, vijf weken vóór AGR. Dat is geen defect maar
   de betekenis van het antwoord: het doel-blok loopt gewoon door. Niet wegpoetsen.
3. 2027-04-19 GEEFT WEER BUILD, zonder herstelweek. Dat is fase B2 en valt BUITEN deze bouw.

## 3. GEMETEN — de 15-dagen-grens is onbereikbaar (open punt 4, hiermee GESLOTEN)

`assignWorkouts` heeft precies ÉÉN niet-test-aanroeper: `buildWeekProposal` in
`apps/web/src/lib/proposal.ts`. Die geeft als `days` de lijst `tePlannen` mee — gefilterd op
`datum >= vandaag` — en een `taperCtx` waarvan de datum hoogstens `A_TAPER_DAGEN` = 7 dagen
ná vandaag ligt (of 3 bij een B-event).

Gemeten door de ECHTE keten te draaien met een geïnstrumenteerde bundel: 8556 runs van
`buildWeekProposal` (elke eventdatum 2027-03-01 t/m 2027-05-31 × 0..30 dagen terug × drie
weekvormen). De engine-tak raakte 1840 keer, bereik −1..7. De client-tak 1932 keer,
bereik 1..13. De grens ligt op `7 + venster` = 14. NUL treffers ≥ 14 aan beide kanten.

CONCLUSIE: de rood-test in de engine bewijst het CONTRACT van `assignWorkouts` bij
handgezette invoer, niet de BEREIKBAARHEID via de app. Behandel hem dus niet als
bereikbaarheidsbewijs. Er is geen bouw nodig; de `Math.round`-correctie blijft staan als
consistentie-reparatie.

## 4. BESLUITEN

4.1 DE OVERNAME VERANDERT ALLEEN DE FASE-AS, NIET HET DOEL. Er komt GEEN zesde optie in
    `DOEL_OPTIONS` en geen zesde profiel. `DOELEN-SPEC` §3 legt vijf doelen VASTGESTELD
    vast; het doel blijft bepalen wát er gereden wordt (quotum, bibliotheek, intent-gewichten,
    meetlat), het event bepaalt na bevestiging de opbouw ernaartoe.
4.2 HET ANTWOORD IS PER EVENT ÉN PER BLOK. "Ja" geldt tot dat event voorbij is en de vraag
    komt niet terug. "Nee" geldt voor het HUIDIGE blok; op de volgende blokgrens wordt de
    vraag opnieuw gesteld zolang het event binnen acht weken ligt. Dat spiegelt de
    dosis-trede (sleutel = blokstart) en dekt "hoogstens één keer per blok" uit §2B. Voor
    AGR betekent het: vragen op de acht-wekengrens, en bij "nee" nog één keer op 2027-03-08.
4.3 DE POORT LOOPT OP `wekenTot` VANAF VANDAAG — dezelfde klok als de fase-beslissing zelf,
    niet de weekmaandag. Gevolg: de kaart kan MIDDEN in een week verschijnen. Voor AGR is de
    eerste dag met `wekenTot` = 8 zaterdag 2027-02-20. Dat is bestaand gedrag van `eventFase_`
    en bewust niet naar de maandag verlegd: kaart en effect horen op dezelfde klok te staan.
4.4 GEEN KAART ZOLANG DE TAPER-OVERLAY ACTIEF IS (`taperEvent` != null). Dan stuurt het event
    het plan al per dag en is de vraag zinloos. Mechanisch afgeleid, geen eigen drempel.
4.5 ER KOMT IN DEZE BOUW GEEN NIEUW GETAL BIJ. `EVENT_OVERNAME_WEKEN` = 8 bestaat al en is
    BELEID. Elke andere grens in dit doc is afgeleid uit bestaande constanten.

## 5. DATA — migratie 0009 (drie kolommen op `sync_state`)

Genereren met drizzle-kit; forward-only. Naast de dosis-trede-kolommen, zelfde vorm.

  event_overname_event     TEXT  de DATUM van het event waarvoor geantwoord is (yyyy-MM-dd)
  event_overname_blok      TEXT  de BLOKSTART-maandag waarop het antwoord viel (yyyy-MM-dd)
  event_overname_antwoord  TEXT  'ja' | 'nee'

Drizzle-velden: `eventOvernameEvent`, `eventOvernameBlok`, `eventOvernameAntwoord`.

DE EVENT-DATUM IS DE IDENTITEIT, en dat is geen gemakzucht: `EventItem` (het wire-DTO)
draagt geen id, en `PUT /api/events` is FULL-REPLACE, dus de rij-id's zijn niet stabiel.
Verzet Daan het event, dan is dat een nieuw besluit en hoort de vraag terug te komen —
precies wat een datum-sleutel oplevert.

DE MIGRATIE WORDT IN DEZE RONDE NIET REMOTE GEDRAAID. Lokaal toepassen en testen; remote
migratie en deploy zijn approval-gated en komen apart, in de volgorde migratie-dan-deploy.

## 6. WORKER

`GET /api/event-overname` → `{ event, blok, antwoord }`, drie nullen als er niets staat.
`PUT /api/event-overname` met body `{ event, blok, antwoord }`.

Validatie, spiegelt `/dosis-trede`: `event` en `blok` zijn `yyyy-MM-dd` of null (`isIsoDate`);
`antwoord` is exact 'ja', 'nee' of null. Alles daarbuiten → 400, en er wordt NIETS
weggeschreven. Niet normaliseren, niet clampen: een afwijkende waarde is een client-fout en
stil repareren verbergt hem.

Repo: `readEventOvername` / `writeEventOvername`, upsert op `userId` die UITSLUITEND deze
drie kolommen zet, zodat sync-velden, debt-opt-in, fatigue-shift en dosis-trede intact blijven.

## 7. ENGINE — de ENIGE geautoriseerde plek

`packages/engine/src/planner.ts`, functie `effectiveMacroFase_`. Daan heeft hiervoor
expliciet autorisatie gegeven, en alleen hiervoor. Twee wijzigingen:

7.1 EEN VIJFDE, OPTIONELE PARAMETER `overnameBevestigd`. De event-tak vuurt alleen bij
    `overnameBevestigd === true`; weggelaten, null of false betekent NIET bevestigd en dus
    doel-gestuurd. Strikt op `=== true`, zodat een vergeten argument naar de veilige kant valt.
    REDEN DAT DIT IN DE ENGINE HOORT en niet in de aanroeper: anders staat "acht weken" hier
    en "alleen na bevestiging" client-zijde, en groeien die twee uit elkaar. Bovendien zou de
    aanroeper de bevestiging moeten verstoppen in een leeggemaakt `eventMacroFase`-argument,
    en een aanroeper die een vaste null instopt is precies het patroon uit WERKWIJZE dat een
    tak stil dood maakt.
7.2 DE ONDERHOUD-TAK VERGELIJKT OP DE PROFIEL-ID in plaats van op de UI-string: vervang
    `doel === "Onderhoud"` door `profileForDoel_(settings && settings.doel).id === "onderhoud"`.
    `profileForDoel_` is in dit bestand al geïmporteerd en normaliseert intern.
    EERLIJK OVER HET BEWIJS: dit is GEEN gedragswijziging en er bestaat per constructie geen
    rood-test voor — in fase A is gemeten dat het weghalen van de normalisatie hier de hele
    suite groen laat, want geen enkele legacy-string mapt op Onderhoud. De winst is dat de
    vergelijking niet meer aan een UI-tekst hangt. Assertie: beide schrijfwijzen leveren
    dezelfde uitkomst.

Verder GEEN engine-wijziging. `git diff --stat` op `packages/engine` mag na de bouw exact
deze ene functie plus de selftest tonen.

## 8. CLIENT

8.1 POORT — nieuw bestand `apps/web/src/lib/eventOvername.ts` met
    `eventOvernameVoorstel(...)`. Los van `blok.ts`: die hangt aan de blok-terugblik, deze aan
    het event. Levert null (geen kaart) bij elk van deze condities, en anders een voorstel met
    eventnaam, eventdatum, `wekenTot`, `blokStart`, en de toonbare fase onder BEIDE antwoorden:
      - geen hoofdevent, geen eventdatum, of `wekenTot` is geen getal
      - `wekenTot` > `EVENT_OVERNAME_WEKEN` (import uit de engine, geen eigen 8)
      - de taper-overlay is actief
      - antwoord 'ja' voor DIT event
      - antwoord 'nee' voor DIT event ÉN deze blokstart
    De twee fases komen uit `effectiveMacroFase_` met `true` en met `false` — dezelfde functie
    die de app zelf gebruikt, geen nagebouwde afleiding.

8.2 BEIDE AANROEPERS VAN `effectiveMacroFase_` KRIJGEN DE VLAG. Dit is een halve-fix-valkuil:
    `apps/web/src/lib/proposal.ts` bouwt het plan, `apps/web/src/lib/faseOvergang.ts` bouwt de
    overgangs-aankondiging. Blijft die tweede ongegate, dan kondigt de app een fase-omslag aan
    die het plan niet uitvoert. De vlag loopt dus door `detectFaseOvergang` en `faseBundelVoor_`
    heen tot in `faseVoor_`.

8.3 LAADPAD — `schema.ts` haalt `getEventOvername()` op in dezelfde `Promise.all` als
    `getDosisTrede()`, leidt `overnameBevestigd` af (antwoord 'ja' ÉN event gelijk aan de datum
    van het huidige hoofdevent) en geeft die mee aan `buildWeekProposal`. Staat er nog een rij
    van een ANDER event, dan leest die als niet-bevestigd; niets opruimen bij een read.

8.4 KAART — `apps/web/src/components/schema/EventOvernameCard.tsx`, naar het model van
    `DosisTredeCard`: `CoachCallout` plus twee knoppen, allebei schrijvend, geen sessie-lokale
    afwijzing. Plaatsing in `SchemaView` direct ONDER `FaseOvergangCard` — het gaat over de
    periodisering, dus het hoort bij de balk bovenaan.

8.5 ÉÉN VRAGENDE KAART TEGELIJK. Zolang deze kaart open staat worden de drie andere vragende
    kaarten onderdrukt: het fatigue-voorstel in state `offer`, het testvoorstel en de
    dosis-trede. De terugblik en de fase-overgang blijven staan, die vragen niets.

8.6 NA BEVESTIGEN VERSCHIJNT DE FASE-OVERGANGSKAART IN DEZELFDE WEEK (bij AGR: Peak → Build).
    Dat is gewenst en krijgt GEEN guard: de kaart die de vraag stelde is dan weg, en de
    aankondiging is het antwoord.

8.7 COPY (Nederlands, feitelijk; verfijning staat op de parkeerlijst):
    regel 1: "<eventnaam> is over <n> weken. Vanaf nu kan het plan daarop mikken in plaats van
    je <doel>-blok af te maken."
    regel 2: "Zeg ik ja, dan staat deze week op <faseJa> en loopt de opbouw naar het event toe.
    Zeg je nee, dan blijft je blok leiden — deze week <faseNee> — en komt de taperweek er in de
    laatste week vóór <eventnaam> hoe dan ook."
    knoppen: "Ja, richt op <eventnaam>" en "Nee, maak mijn blok af".

8.8 STALE COMMENTAAR — `apps/web/src/lib/coachNarrative.ts`, boven `faseOvergangRegel`, staat
    "(event_overname bestaat niet — zie detectFaseOvergang)". Die claim klopt na deze bouw niet
    meer: de overname bestaat als expliciet moment. Herschrijf de zin naar wat er wél geldt —
    de aankondiging blijft één vorm, gedreven door het fase-VERSCHIL, en de overname zelf is
    een bevestigde keuze en geen tijdsverloop.

## 9. WAT ROOD MOET ZIJN ZONDER DE FIX

Per plek gemeten, niet per as. Rapporteer beide kanten.
- Engine: de bestaande asserties rond de acht-wekengrens geven vandaag vier argumenten mee en
  MOETEN omvallen zodra de vlag verplicht is; ze worden expliciet op `true` gezet. Daarnaast
  nieuwe asserties dat `false` én een weggelaten vijfde argument de DOEL-fase leveren.
- Poort: elke conditie uit 8.1 los rood — zet er één uit en toon dat de kaart dan verschijnt
  waar hij niet hoort.
- Route: naast elke 400 terugLEZEN dat er niets is weggeschreven. Een route die netjes 400
  antwoordt én tóch schrijft komt anders groen door.
- Aankondiging: een assertie dat plan en aankondiging dezelfde vlag zien — zonder de fix in
  `faseOvergang.ts` kondigt de app een omslag aan die het plan niet doet.
- Beeld: schiet met de shot-harness een scenario met de browserklok gepind binnen het venster
  (hoofdevent 2027-04-17, klok 2027-02-22) en vel zelf een uitspraak: klopt, klopt niet, of
  niet toetsbaar. Lukt het seeden van een event in 2027 niet binnen de bestaande harness-vorm,
  dan is dat een AFWIJKING: meld hem en zeg exact wat Daan moet openen en waar hij naar kijkt.

## 10. BUITEN SCOPE

- HET HERSTEL NA HET EVENT (fase B2). 2027-04-19 levert weer Build; de vraag om een nieuw doel
  en de herstelweek daarna zijn hetzelfde gat en worden samen opgelost, in een eigen ronde.
- COPY-VERFIJNING. De toon van deze kaart komt met de andere coach-copy aan de beurt.
- REMOTE MIGRATIE EN DEPLOY. Approval-gated, apart, migratie strikt vóór deploy.
