# RECON — 3d stap 1: de mesoWeek-teller-correctie

**Status:** recon + fix. GAS-bron van schijf gelezen (`C:\Users\daan\Projects\training` @ `3e8090a`),
nooit via fetch, nooit geschreven. Geen persoonlijke trainingsdata in dit doc.

## De bevinding — off-by-one + nooit-meer-herstel

`weekIndexFromStart_` (`packages/engine/src/utils.ts`) geeft een **0-gebaseerde, monotone,
ONgeklampte** weekindex (weken sinds `doelStart`). `apps/web/src/lib/proposal.ts` gebruikte die
index RECHTSTREEKS als `mesoWeek`, terwijl `MESO_MOD` en `isMesoRecovery` een **cyclische 1..4**-
mesoweek verwachten (GAS `getMesoWeek`: clamp/cyclus 1..4, `advanceMeso` wrapt >4 → 1).

Twee gevolgen:
1. **Off-by-one op de dosis-ramp.** Blokweek 0 → factor `MESO_MOD[0] || 1` = 1.00 (toevallig goed),
   maar blokweek 1 → `MESO_MOD[1]` = 1.00 (hoort 1.08), enz. De ramp loopt één stap achter.
2. **De recovery-week vuurt eenmalig en daarna nooit meer.** `isMesoRecovery = mesoWeek === 4` is
   alleen waar op blokweek 4 (de 5e week, w0===4). Daarna (w0 = 5, 6, 7, …) is `mesoWeek` nooit meer
   exact 4 → **geen deload meer, ooit** → lange-termijn overtrainings-risico. En als de gebruiker
   toevallig op blokweek 4 zit, oogt de week te mager (allocator zet de kwaliteitsplaatsing uit).

### Blokweek → factor → recovery (oud vs na-fix)

| blokweek (w0) | oud mesoWeek | oud factor | oud recovery? | na-fix mesoweek | na-fix factor | na-fix recovery? |
|---|---|---|---|---|---|---|
| 0 | 0 | 1.00 (`\|\|1`) | nee | 1 | 1.00 | nee |
| 1 | 1 | 1.00 | nee | 2 | 1.08 | nee |
| 2 | 2 | 1.08 | nee | 3 | 1.15 | nee |
| 3 | 3 | 1.15 | nee | 4 | 0.60 | **ja (deload)** |
| 4 | 4 | 0.60 | **ja** | 1 | 1.00 | nee (herstelt) |
| 5 | 5 | 1.00 (`\|\|1`) | nee | 2 | 1.08 | nee |
| 6 | 6 | 1.00 | nee | 3 | 1.15 | nee |
| 7 | 7 | 1.00 | nee | 4 | 0.60 | **ja (deload)** |

Oud: deload alleen op w0===4, één keer. Na-fix: elke 4e blokweek (w0 = 3, 7, 11, …) is deload, en
de cyclus herstelt (w0===4 → mesoweek 1), een echte 3:1-mesocyclus.

## Het structurele punt — twee klokken

`mesoWeek` is verankerd aan `doelStart` (een vaste kalenderdatum), terwijl de macro-**fases**
event-gedreven zijn (`eventFase_`/`computeMacroPhase`). Dat zijn TWEE klokken die niet noodzakelijk
uitlijnen: de mesocyclus telt sec weken-sinds-start, de fase kijkt naar het event. Deze fix haalt de
acute bug eruit (cyclus + herstel), maar lost die dubbele-klok NIET structureel op — zie de
uitgestelde items.

## De gekozen fix — `mesoCycleWeek_`

Een pure `int→int`-helper in `utils.ts`, direct naast `MESO_MOD`/`mesoFactor`:

```
mesoCycleWeek_(weekIndex) = (((weekIndex % 4) + 4) % 4) + 1
```

0→1, 1→2, 2→3, 3→4, 4→1, … (3:1-mesocyclus, GAS `getMesoWeek`-pariteit; defensief tegen negatief).
`proposal.ts` componeert: `const mesoWeek = mesoCycleWeek_(weekIndexFromStart_(settingsE));`.
`weekIndexFromStart_` zelf blijft ONgemoeid als monotone **variant-rotatie**-index (`selectVariant_`).
`MESO_MOD`, `mesoFactor`, `isMesoRecovery` en de isRecovery-INHOUD blijven ongewijzigd.

De `int→int`-signatuur (i.p.v. `(settings)`) is bewust: deterministisch testbaar; de datum-afleiding
blijft geïsoleerd in `weekIndexFromStart_`.

## Bewust uitgestelde 3d-proper-items

1. **Blok-verankering van de deload.** Nu een losse 4-weeks-tel vanaf `doelStart`. Beter is een
   deload verankerd aan het BLOK-einde (blok-overgangen + vlak vóór een taper), zodat de deload niet
   toevallig midden in een opbouwblok of pal voor het event valt. Raakt de twee-klokken-uitlijning.
2. **De deload-INHOUD.** De `isRecovery`-tak levert nu een volle easy-week. Trainer-model-vraag:
   volle rustweek versus een verlaagde-belasting-week met behouden structuur (minder volume/intensiteit
   maar wél prikkel). Dat is een inhoudelijke coaching-keuze, los van deze teller-correctie.

---

*3d stap 1: teller-correctie. `weekIndexFromStart_`/`MESO_MOD`/`mesoFactor`/`isMesoRecovery`/de
isRecovery-inhoud ongemoeid; `training` alleen gelezen @ `3e8090a`.*
