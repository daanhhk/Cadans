# T28 FASE 2 — HERSTEL-RECON (per-dag-minuten als PLAFOND)

**Status:** recon. Docs-only, geen engine-code. Alle regel-refs zijn tegen de repo geverifieerd op
de commit waarop dit doc landt; drift staat in §6.

**Norm.** Coaching-deugdelijkheid: de app doet wat een gerenommeerd trainer zou adviseren. GAS heeft
hier geen gezag — `getVolumeTargets` is fase-dosering, geen door-de-gebruiker gedeclareerd plafond.
Waar GAS iets anders doet is dat herkomst, geen meetlat.

---

## §0 — SCOPE + NON-GOALS

**Scope.** De per-dag beschikbare minuten worden een **PLAFOND** in plaats van een vast plan. De
coach mag binnen dat plafond **korter** gaan, of de dag op **rust** zetten, wanneer herstel dat
vraagt. Vandaag kiest de motor uitsluitend het TYPE; de duur is `d.minuten`, punt.

**Non-goals — expliciet buiten deze fase:**

- **Effectief weekdoel** (globaal urengetal ± fase-modulatie, mét uitleg) → fase 3.
- **Durability / back-to-back-opbouw als expliciet doel** → fase 3.
- **De readiness-week-demote komt NIET terug.** Die is in laag 2 bewust verwijderd (R3-T22): één
  matige ochtend mag niet stil de hele week verzachten. Alles in dit doc is **per-dag** en
  **opt-in**.
- **Meso off-by-one (R2-V2)**, de **band-berekening** en de **readiness-banner** blijven ongemoeid.

---

## §1 — HUIDIGE STAAT (geverifieerd)

### 1.1 Readiness raakt het weekplan niet meer

`apps/web/src/lib/proposal.ts:421`:

```ts
  const signal = "normal";
```

Het week-signaal is hard neutraal. De holistische band en `rpeSignal_` voeden `assignWorkouts` niet
meer; de band stuurt uitsluitend het per-dag verlicht-VOORSTEL. Fase 2 mag daar niets aan veranderen
— elke duur-ingreep die uit readiness komt, moet via hetzelfde voorstel-en-bevestig-pad lopen.

### 1.2 De override draagt al een duur

`packages/shared/src/override.ts:40` en `:46` — beide varianten dragen `durMin: number`. De worker
valideert de grenzen op `workers/api/src/routes/api.ts:433`:

```ts
  if (typeof dur !== "number" || !Number.isFinite(dur) || dur < 20 || dur > 360)
```

**Gevolg: "korter" heeft geen nieuw contract nodig.** Een verlicht-akkoord met een kleinere `durMin`
is vandaag al een geldige override. De ondergrens 20 is meteen de reden dat "rust" *niet* als
`durMin: 0` kan — zie §2.1.

### 1.3 Een override zonder workout levert een gewone rustdag — maar zonder pin

`proposal.ts:509-522`:

```ts
    let appliedOverride: DayOverride | null = null;
    if (ov && dayPlannable) {
      const woOv = buildOverrideWorkout_(…) as ProposalWorkout | null;
      if (woOv) {
        sessions.push(woOv);
        appliedOverride = ov;   // ← :521, ALLEEN als er een workout uit kwam
      }
    } else if (…)
```

Levert `buildOverrideWorkout_` null, dan blijft `sessions` leeg **én** blijft `appliedOverride`
null. De dag valt dan in `schema.ts:1034` terug op `state: "rest"` en rendert de generieke
rustdag-copy (`SchemaView.tsx:269`, *"Rustdag — van herstel word je beter."*).

**Dat is bijna wat we willen, maar niet helemaal:** omdat `appliedOverride` null blijft, toont de dag
géén `OverriddenDetail`, géén pin en géén "Terug naar voorstel". De gebruiker ziet een rustdag die
niet van een gewone rustdag te onderscheiden is en die hij niet kan terugdraaien. Dat is het gat dat
§2.1 dicht.

### 1.4 De enige structurele herstel-hook die er al is

`packages/engine/src/planner.ts:730-738` — avoid-consecutive-hard:

```ts
    if (isHard && !debtForced && d.datum && lastHardDate) {
      const prevDay = stripTime_(new Date(d.datum.getTime() - 24 * 60 * 60 * 1000));
      if (prevDay.getTime() === lastHardDate.getTime()) {
        type = d.type === "pendel" ? "pendel_z2" : "long_z2";
        isHard = false;
        archetypeId = null;
        reden = "Rustige duurrit — dag na een zware dag";
```

Alleen het **type** wijzigt; de **duur blijft vol** (`d.minuten`). Een dag na een zware dag wordt dus
een volledige lange Z2 van bijvoorbeeld 3 uur. Dat is de enige plek waar de motor vandaag uit
herstel-overweging ingrijpt — en hij grijpt in op intensiteit, niet op omvang.

### 1.5 Waar de duur vandaan komt

| | Plek | Wat |
|---|---|---|
| Niet-pendel | `proposal.ts:528-530` | `sessieMin = d.minuten` — exact de beschikbare minuten |
| Pendel | idem | `sessieMin = settings.pendelDuurMin \|\| d.minuten` — per-dag-minuten genegeerd |
| Archetype-keuze | `planner.ts:409-413` | `bt = min(sel.minuten, profiel.maxDuurMin ?? ∞)` → `goalWorkout_` |
| Weekvolume | `planner.ts:232-234` | `weekV += Number(d.minuten)`, `/60` → volume-adaptieve intent-weging |

`renderVariant_` (`planner.ts:984`) schaalt het gekozen archetype naar de meegegeven duur. Er is dus
één plek waar de sessieduur ontstaat en één plek waar het weekvolume ontstaat — beide lezen
`d.minuten` rechtstreeks.

---

## §2 — HET ONTWERP

### 2.1 A — HET KANAAL

Drie onderdelen. Het eerste bestaat al, de andere twee zijn nieuw.

**(a) Korter = een kleinere `durMin` op de override.** Geen contract-wijziging (§1.2). Het
verlicht-akkoord schrijft vandaag `durMin = de geplande sessieduur`; korter betekent simpelweg een
lager getal, binnen 20-360.

**(b) NIEUW: `RestOverride`.** Rust kan niet als `durMin: 0` (ondergrens 20). Daarom een derde
variant naast `LibraryOverride` en `FreeOverride`:

```ts
export interface RestOverride extends OverrideMeta {
  type: "rest";
}
export type DayOverride = LibraryOverride | FreeOverride | RestOverride;
```

Geen `durMin` — een rustdag heeft geen duur. Drie plekken moeten mee:

1. **`buildOverrideWorkout_`** (`planner.ts:1307`) geeft voor `type === "rest"` **null** terug. Dat
   is geen nieuw gedrag maar een expliciete tak: null betekent al "geen sessie".
2. **`proposal.ts:509-522`** — `appliedOverride = ov` moet óók gezet worden als er GEEN workout uit
   komt, mits de override een geldige rest-override is. Anders blijft de dag een anonieme rustdag
   zonder pin en zonder terugdraai-knop (§1.3). Concreet: de `if (woOv)`-guard wordt gesplitst in
   "workout → push + appliedOverride" en "rest → alleen appliedOverride".
3. **`isValidOverride`** (`api.ts:432`) accepteert `type: "rest"` zonder `durMin`-eis. De
   `OverrideMeta`-velden (`from`/`src`/`label`) blijven gelden, zodat een rust-akkoord net als het
   verlicht-akkoord `src: 'readiness'` kan dragen.

**(c) NIEUW: `d.durCapMin` — het plafond in de motor.** De motor krijgt een veld waarmee hij de
sessieduur mag verlagen zonder de beschikbaarheid te vervalsen:

```ts
  const sessieMin = isPendel
    ? settings.pendelDuurMin || d.minuten
    : Math.min(d.minuten, d.durCapMin ?? Infinity);
```

Kernpunt: **`d.minuten` blijft de beschikbaarheid, `durCapMin` is het advies.** Daarom blijft `weekV`
(`planner.ts:232`) op `d.minuten` gebaseerd — het weekvolume is wat de gebruiker beschikbaar stelde,
niet wat de coach ervan maakte. Zou `weekV` de cap volgen, dan zou een enkele verkorte dag de
volume-adaptieve intent-weging van de héle week verschuiven; dat is een verborgen tweede effect en
precies wat we niet willen.

Open vraag: of `bt` (`planner.ts:409`, de archetype-keuze) de cap óók moet lezen. Argument vóór: kies
geen archetype dat niet binnen de werkelijke duur past. Argument tegen: `renderVariant_` schaalt toch,
en het koppelt twee dingen die nu los staan. Zie §5.

### 2.2 B — READINESS (per-dag, opt-in, T22-conform)

De bestaande verlicht-keten wordt uitgebreid van "lichter type" naar "lichter type **of** korter
**of** rust". Ongewijzigd blijft: het is een VOORSTEL, per dag, alleen op vandaag, en het muteert
niets tot akkoord.

- **`readinessAdjust_`** (`packages/engine/src/coach.ts:595`) krijgt naast `toType` ook een
  duur-advies. Vandaag: `caution → demoteType_(type)`, `rest → "recovery"`. Straks kan `rest` ook
  `action: "rest"` opleveren, en `caution` een duur-reductie naast of in plaats van de type-demote.
- **`buildVerlichtVoorstel`** (`apps/web/src/lib/schema.ts:796`) vertaalt dat naar de override:
  kleinere `durMin`, of de nieuwe rest-override.
- **`VerlichtCard`** + de verlicht-copy krijgen de bijbehorende varianten. De copy blijft
  voorwaardelijk ("ik kan…", geen daad-claim) — dat is M55/R3-T24 en mag niet verwateren.

De band-poort (M66) en de bestaande guards (alleen vandaag, alleen een harde sessie, niet in
Taper/Recovery, geen bestaande override, geen multi-sessie) blijven één-op-één gelden.

### 2.3 C — DAG-NA-HARD-CAP, met een caveat dat zwaarder weegt dan het voorstel

Het idee: `avoid-consecutive-hard` (`planner.ts:730-738`) zet naast het type óók een `durCapMin`.

**CAVEAT — en dit is de reden dat C apart staat van A en B.** Een rustige rit ná een harde dag is in
de coaching-praktijk vaak precies goed. Twee redenen:

1. **De downgrade doet het werk al.** De intensiteit is er al af (`long_z2`); de stapel-zorg die de
   guard adresseert, is daarmee geadresseerd. Een cap bovenop lost een probleem op dat de guard net
   heeft opgelost.
2. **Duur ná intensiteit is een trainingsdoel, geen restpost.** Rustige volume-uren op een dag met
   voorbelasting zijn hoe duurvermogen (durability) wordt opgebouwd. Een blinde cap knipt precies
   die prikkel weg — en die prikkel is voor Daans A-event (lang, klimmend, hoge cumulatieve kJ)
   waarschijnlijk het meest waardevolle wat de week te bieden heeft.

**Advies: C conservatief, of schrappen.** Conservatief = alleen cappen als de dag-na-hard óók samenvalt
met een tweede signaal (lage readiness, of een weekbudget dat al gehaald is) — dan is het geen blinde
regel maar een samenloop. Schrappen = de guard laten zoals hij is en herstel volledig via A+B lopen.
**Beslissing op review** — ik heb geen basis om dit zonder Daan te kiezen, want het is een
trainingsinhoudelijke afweging, geen implementatiedetail.

---

## §3 — SEQUENCING

**2a — het kanaal + readiness (A + B).** Samen, want ze zijn zonder elkaar niet toonbaar: het kanaal
zonder B heeft geen aanleiding, B zonder het kanaal heeft geen uitdrukking. Levert: `RestOverride`
end-to-end, `durCapMin` in de motor, en het verlicht-voorstel dat korter/rust kan aanbieden.

**2b — de dag-na-hard-cap (C).** Apart, en pas ná de beslissing uit §2.3. Als C geschrapt wordt, is
2b een lege fase en is fase 2 klaar na 2a.

Elke stap eindigt met een STOP-en-verifieer: gate + CI groen, vloeren niet geregresseerd, en Daan
kijkt vóór de volgende.

---

## §4 — BLAST-RADIUS + VLOEREN

| Laag | Wat | Autorisatie |
|---|---|---|
| `packages/engine/src/coach.ts` | `readinessAdjust_` — duur/rust-advies | **ENGINE-AUTORISATIE VEREIST** |
| `packages/engine/src/planner.ts` | `sessieMin`-cap, `buildOverrideWorkout_` rest-tak, evt. C | **ENGINE-AUTORISATIE VEREIST** |
| `packages/shared/src/override.ts` | `RestOverride` in de union | contract |
| `workers/api/src/routes/api.ts` | `isValidOverride` accepteert rest | worker |
| `apps/web/src/lib/{schema,proposal}.ts` | voorstel + `appliedOverride`-splitsing | web |
| `apps/web/src/components/schema/VerlichtCard.tsx` + copy | korter/rust-varianten | web |

**Dit is de eerste bewuste engine-wijziging sinds de M63-fork.** De engine-selftest-assert-count
stijgt (nieuwe asserts voor de cap en de rest-tak); het vitest-totaal stijgt eveneens. Beide vloeren
staan in HANDOFF §STAND — **lees ze uit de suite, hardcode ze niet in prompts**. Geen van beide mag
dalen.

**`weekV` blijft op de beschikbaarheid** (`d.minuten`), niet op de cap — zie §2.1(c).

---

## §5 — OPEN BESLISSINGEN

1. **C: conservatief of schrappen?** (§2.3) De caveat weegt zwaar; mijn advies is schrappen tenzij
   er een tweede signaal aan gekoppeld wordt. Trainingsinhoudelijke keuze → Daan.
2. **Vorm van "rust".** `RestOverride {type:"rest"}` zoals hier voorgesteld, of een `FreeOverride`
   met een rust-intensiteit? De eerste is expliciet en leest goed in de data; de tweede vermijdt een
   nieuwe variant in de union. Voorkeur: de expliciete variant — "rust" is geen rit.
3. **Caution: factor of cap?** Verlaagt `caution` de duur met een percentage (bv. ×0,75) of tot een
   absoluut plafond (bv. max 60 min)? Een factor schaalt mee met de dag; een cap is voorspelbaarder.
   Beide zijn verdedigbaar, geen van beide is uit de literatuur af te leiden.
4. **Leest `bt` de cap?** (§2.1c) Koppelt archetype-keuze aan de verkorte duur, of laat `renderVariant_`
   het schalen?
5. **Sequencing bevestigen.** 2a = A+B, 2b = C — of vervalt 2b met beslissing 1?

---

*Recon, geen bouw. Geen engine-code gewijzigd; de motor blijft ongemoeid tot expliciete autorisatie.*
