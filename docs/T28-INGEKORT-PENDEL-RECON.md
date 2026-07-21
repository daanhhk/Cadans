# RECON — het "(ingekort)"-label + de pendel-navigatie-leak

**Status:** recon. Geen code gewijzigd; `git diff --stat packages/engine` leeg. GAS van schijf gelezen
(`C:\Users\daan\Projects\training` @ `3e8090a`), nooit via fetch.

**Kern-uitkomsten vooraf:**
- **§1 — GEEN engine-bug.** Het identity-contract is intact; "(ingekort)" vuurt alleen bij een
  échte trim. Het label dat Daan ziet is de normale duur-inpassing (een ~90-min template geschaald
  naar een 60-min dag), NIET een readiness-inkorting. Dat is een belangrijke nuance voor de
  "ongevraagd ingekort bij readiness 95"-melding: het `(ingekort)`-label staat los van readiness.
- **§2 — een echte CLIENT-bug: niet-unieke React-keys.** Eén regel, `SchemaView.tsx:282`.

---

## §1 — het "(ingekort)"-naamlabel

### 1.1 Waar de naam zijn vorm krijgt — de fase ZIT erin (engine-kant)

`packages/engine/src/planner.ts:1114-1117`, `renderVariant_`:

```ts
    naam:
      variant.naam + " (" + macroFase + (ingekort ? ", ingekort" : "") + ")",
```

De engine-port emit de `macroFase` in de naam, exact zoals GAS (`Algorithm.gs:2299`). Er is dus geen
verschil op de engine-kant — de kale weergave die Daan ziet ("… (ingekort)" zonder fase) ontstaat
in de CLIENT (§1.3).

### 1.2 IDENTITY-CONTRACT — INTACT (geen spurious fire)

`packages/engine/src/planner.ts:1021-1023`:

```ts
  const rawBlocks = variant.blocks(adj);
  const blocks = scaleBlocksToFit_(rawBlocks, mins, warm, cool);
  const ingekort = blocks !== rawBlocks;
```

`ingekort` leunt op reference-identity (`!==`), precies als GAS. En `scaleBlocksToFit_`
(`packages/engine/src/zones.ts:118-160`) geeft in het NIET-getrimd-pad **dezelfde array-ref** terug:

```ts
  if (!mins || mins <= 0) return blocks;         // zones.ts:124 — zelfde ref
  ...
  const target = mins - warm - cool;
  if (target <= 0) return blocks;                // :139 — zelfde ref
  if (mainDur(blocks) <= target) return blocks;  // :140 — NIET getrimd → zelfde ref
  const out = blocks.map((b: any) => { … });     // :141 — WEL getrimd → NIEUWE array
```

Alleen het getrimde pad maakt een verse array (`.map`). De port geeft dus **niet** altijd een verse
array terug; het contract is intact. **"(ingekort)" vuurt alleen bij een echte trim — geen
engine-bug, geen FLAG nodig.**

### 1.3 De client transformeert de naam WEL — fase eruit, "ingekort" blijft

`apps/web/src/lib/schema.ts:102-111`, `stripFaseSuffix`:

```ts
// Engine-naam-suffix (planner.ts renderVariant_): "<naam> (<Fase>[, ingekort])".
const FASE_SUFFIX_RE = new RegExp(
  `\\s*\\((?:${Object.keys(MACRO_FASE_NL).join("|")})(,\\s*ingekort)?\\)\\s*$`,
);
export function stripFaseSuffix(naam: string): string {
  return naam.replace(FASE_SUFFIX_RE, (_m, ingekort) =>
    ingekort ? " (ingekort)" : "",
  );
}
```

De regex knipt het fase-token weg maar behoudt "ingekort" (vastgelegd in
`schema.test.ts:54-56`: `"Z2 progressief (Build, ingekort)"` → `"Z2 progressief (ingekort)"`).
**Dus:** de kale `… (ingekort)` die Daan ziet is BY DESIGN — de client toont de fase niet, alleen de
trim-markering. GAS toont de fase wél; dit is een bewuste Cadans-weergavekeuze, geen bug.

### 1.4 De 60-min MA/DI-sessie — TERECHT getrimd

Voor een 60-min dag: `target = mins − warm − cool = 60 − 10 − 5 = 45` min. De vier `long_z2`-templates
(`packages/engine/src/planner.ts:1343-1395`, `genericPools_`) hebben een RAW main-duur die daar ver
overheen gaat:

| template-id | raw main-blocks | raw main-duur |
|---|---|---|
| `z2_steady` | steady 90 | **90 min** |
| `z2_cadans` | steady 50 + 3×(10 on + 5 off) | **95 min** |
| `z2_progressief` | steady 70 + steady 20 | **90 min** |
| `z2_nuchter` | steady 80 | **80 min** |

Elk (80-95 min) > target 45 → `mainDur(blocks) > target` → **terecht getrimd**, GAS-getrouw. De
templates zijn ontworpen voor ~2-uurs ritten; op een 60-min dag worden ze ingekort. `(ingekort)`
klopt hier dus feitelijk.

### 1.5 Conclusie §1

Geen engine-bug. Het label is correct en beschrijft duur-inpassing, niet fatigue. De enige verbeter-
vragen zijn UX: (a) wil je de fase terug in de naam zoals GAS (dan `stripFaseSuffix` aanpassen —
client-only), en (b) is "(ingekort)" nuttig of verwarrend voor de gebruiker? Beide zijn keuzes, geen
defecten. **Belangrijk voor de HOOG-melding "ongevraagd ingekort bij readiness 95": dit label heeft
NIETS met readiness te maken** — het staat er ook bij readiness 95, puur omdat een 90-min template in
een 60-min dag past. Als de "inkorting" die Daan bedoelt dit label IS, dan is er geen readiness-bug;
als het een echte type/duur-demote is, ligt dat elders (aparte recon).

---

## §2 — pendel-sessies "verhuizen mee" bij dag-navigatie

### 2.1 Welke component, en hoe de sessie-lijst ontstaat

`apps/web/src/components/schema/SchemaView.tsx`. De geselecteerde dag:

```ts
const day = view.days.find((d) => d.datum === selected) ?? view.days[0];   // :99
```

`view` is een pure `useMemo` over `(proposalWeek, doneByDate, todayISO, dispositionByDate, readiness,
settings)` (`:74-92`); `day` wordt bij ELKE render vers afgeleid via `.find`. De sessie-render
(`:280-300`):

```tsx
{day.sessions.map((s, i) => (
  <div key={`${s.naam}-${s.tss}`}>            {/* :282 */}
    <WorkoutDetail
      session={s}
      overline={day.sessions.length > 1 ? `Sessie ${i + 1}/${day.sessions.length}` : undefined}
    />
  </div>
))}
```

**Er is GEEN stale state.** `day.sessions` is altijd het correcte, verse array; geen
niet-resettende `useState`, geen aangroeiende array, geen module-level cache. Het probleem zit
uitsluitend in de RENDER-key.

### 2.2 Root-cause — niet-unieke React-key (`:282`)

`key={`${s.naam}-${s.tss}`}` is **niet gegarandeerd uniek binnen de map**. Op een pendeldag:

- de heenrit is geforceerd `pendel_z2` (`proposal.ts:536`);
- de terugrit is `d.voorgesteldType` — en dat is in een Base-week óók vaak `pendel_z2`.

Beide roepen dan `buildWorkout("pendel_z2", sessieMin, …)` → `genericPendelZ2` → **identieke `naam`**
(`"Pendel + Z2 (X min)"`) én **identieke `tss`** (`Math.round(mins * 0.6)`, `planner.ts`). De
3b-copy-wijziging (`bc95df1`) veranderde alleen de `eindopmerking`, níét `naam`/`tss` — dus de keys
botsen nog steeds.

Twee sessies met dezelfde key → React's list-reconciliatie is onbepaald:

- **Duplicaat "SESSIE 1/2" op WO zelf.** De length-2 array levert twee overlines "1/2" en "2/2", maar
  door de key-botsing houdt React een fantoom-child uit een eerdere render vast → visueel drie
  blokken (2× "1/2" + 1× "2/2"). Dat is precies het gemelde beeld.
- **"Verhuizen mee" naar DO tot een harde herlaad.** Bij dag-navigatie verandert de children-lijst,
  maar met botsende/niet-onderscheidbare keys kan React de oude children niet betrouwbaar matchen en
  verwijderen; stale `WorkoutDetail`-DOM blijft hangen. Een harde reload remount de hele boom en
  ruimt het fantoom op — consistent met het symptoom.

### 2.3 Minimale fix-locatie (NIET nu gefixt)

`apps/web/src/components/schema/SchemaView.tsx:282` — de key uniek maken per sessie én per dag, bv.
`key={`${day.datum}-${i}`}`. Het opnemen van `day.datum` forceert bovendien een schone remount van de
sessie-subtree bij dag-wissel, wat de cross-day-leak sluit; de index `i` garandeert uniciteit binnen
de dag (ook bij twee identieke pendel_z2-sessies). Puur een render-key; geen data-/engine-wijziging.

**Neven-observatie (buiten deze recon):** dat twee pendel_z2-sessies exact dezelfde `naam` dragen is
ook inhoudelijk mager (heen en terug heten identiek). Sinds 3b-copy verschilt alleen de
`eindopmerking`. Een richting in de naam zou de key vanzelf uniek maken én de weergave verhelderen —
maar dat is een aparte, engine-rakende keuze, geen onderdeel van de key-fix.

### 2.4 Conclusie §2

Root-cause: **niet-unieke React-key** op `SchemaView.tsx:282` (`${s.naam}-${s.tss}` botst bij twee
identieke pendel_z2-sessies). Minimale fix: één regel, `key={`${day.datum}-${i}`}`. Geen state-reset,
geen engine-wijziging nodig.

---

*Recon, geen bouw. `packages/engine` ongemoeid; `training` alleen gelezen @ `3e8090a`.*
