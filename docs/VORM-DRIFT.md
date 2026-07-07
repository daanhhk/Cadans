# Vorm-tab — design-reconciliatie + token-scan (read-only findings)

Besluit: **PMC-only** (geen Driehoek/Balans/switcher). Ontwerp = autoriteit. Drift gemeld;
bewuste eerdere cuts (lean v1) expliciet onderscheiden van echte conformiteit-fixes.
Training HEAD `3e8090a` (alleen gelezen).

## 1. Inventaris
- Pagina: `apps/web/src/pages/Vorm.tsx` (route `App.tsx:19`). Volgorde: ReadinessCard · LevelCard · MetricRow · ConditiePmc + CheckinSheet.
- Componenten (`apps/web/src/components/vorm/`): `ReadinessCard.tsx` · `LevelCard.tsx` · `MetricRow.tsx` · `ConditiePmc.tsx` · `CheckinSheet.tsx` · `ProgressRing.tsx`. TSB-zones: `apps/web/src/lib/tsb.ts`. Tokens: `apps/web/src/styles/tokens.css`.
- Ontwerp-bronnen: **`design/src/conditie.jsx`** (variant C = `ConditiePMC` :116-163) · **`design/src/app.jsx`** (`ReadinessCard` :131 · `LevelCard` :229 · `MetricRow` :297 · `StatusDeck` :262) · render-target **`design/src/FTP Coach - Vorm-varianten.html`**.

## 2. Beslispunt (1) gesloten — SWITCHER? 
De Vorm-varianten-HTML is een **ontwerp-VERGELIJKING** (titel "Vorm-varianten A & B") van twee Vorm/Niveau-split-strategieën (A: diepe progressie → Niveau; B: Vorm ongewijzigd), NIET een te bouwen conditie-switcher. Beide delen een **swipe-deck (Readiness + Niveau)** — `Vorm-varianten.html:46` "Readiness-kaart · Niveau-kaart (swipe)", en `app.jsx:262` `StatusDeck` (`.deck` scroll + dot-indicatoren :283-290, gerenderd op Vorm `app.jsx:500`).
**Conclusie:** het ontwerp HEEFT een swipe-carrousel (ReadinessCard↔LevelCard + dots), maar Cadans heeft die **BEWUST gecut** (stacked kaarten; CLAUDE.md-invariant "status-deck SUPERSEDED door de ReadinessCard"). Géén conditie-variant-switcher (PMC-only, besloten). → geen switcher bouwen; consistent met lean-v1.

## 3. ConditiePmc vs variant C (`conditie.jsx:116-163`)
- **Structuur MATCHT**: 12-wk CTL(solid, `--text-secondary`)/ATL(dashed, `--warn`)-lijn + vorm-kloof (`--fresh`) + end-circles + vorm-badge + legenda (Fitheid/Vermoeidheid/Vorm). ✓
- **Cadans-verrijking (niet in variant C):** een **TSB-headline** ("+X · Fris · TSB·vorm-saldo", `ConditiePmc.tsx:177-226`) — geleend uit **variant B** (`ConditieBalans`, conditie.jsx:78-84). Variant C heeft géén headline. Beslispunt: houden (aanbevolen — geeft TSB prominentie die variant C mist) of puur-C. **Prio laag.**
- **Data rijker dan mock:** Cadans `slice(-84)` echte dagelijkse reeks (`ConditiePmc.tsx:139`) vs variant C's 12 mock-punten. ✓ (verbetering).
- **Micro-labeldrift:** as-label "~12 wk" (`:122`) vs variant C "12 wk". **Prio laag.**

## 4. Readiness/Level/MetricRow vs prototype (`app.jsx`) + debt (k)
- **ReadinessCard**: grotendeels conform (Fase 1b, telefoon-goedgekeurd) — ring + verdict + factorpaneel + check-in-regel/effect. Zit in een `Card` i.p.v. `.deck-card` (deck gecut, §2). Detail-conformiteit (Chips "Vorm +X"/"HRV") = visuele check waard. **Prio laag-mid.**
- **LevelCard** — **DEBT (k) OPEN**: mist de **tier-chip** ("Gevorderd", `app.jsx:234`), de **tier-voortgangsbalk** ("nog 0,3 tot <tier>" + `--accent-grad`-bar, `app.jsx:248-256`) én de **"+X ↑ sinds <mnd>"-delta** (`app.jsx:251`). Cadans toont alleen W/kg + FTP (`LevelCard.tsx`, comment bevestigt "DEFERRED"). NB: de data is NU beschikbaar (`TIERS`/`tierIndex` + `niveauProgressie_`-serie, zoals Niveau ze al gebruikt) → **buildbaar, conformiteit-fix, prio HOOG.**
- **MetricRow** — **DEBT (k) OPEN**: 2-koloms (FTP · Gewicht) i.p.v. de prototype-**3-kolom met "Week 480 TSS"** (`app.jsx:301`). Cadans-comment: "Week-TSS DEFERRED". Data beschikbaar (7-daagse `activities` idx8-som) → **buildbaar, conformiteit-fix, prio HOOG.**
- **W/kg-over-tijd-grafiek** (debt (k)): leeft op de **Niveau-tab** (`ProgressieCard`, al gebouwd); de Vorm-`LevelCard` vraagt alleen de tier-progress-bar → **moot voor Vorm.**

## 5. Token-conformiteit
Rauwe numerieke literals (font-size/spacing, NIET via `--s-*/--fs-*/--lh-*/--r-*`) per bestand (token-scan):
- `ReadinessCard.tsx` — **31** (o.a. `fontSize: 17.5`/`11.5`/`12.5`/`12`, `gap: 16/9/6/5`, `marginTop: 12/9/2`, `padding: 12`/`"9px 12px"`).
- `CheckinSheet.tsx` — **20**.
- `ConditiePmc.tsx` — **18** (`fontSize: 11.5`(×2)/`13`/`11`, `Num size="30px"/"13px"`, `gap: 9/5/16`, `marginTop: 4/12/6/10`, `padding: "3px 9px"/"20px 8px"`; SVG-viewBox-coords = grafisch, OK).
- `LevelCard.tsx` — **8** (`fontSize: 16/12`, `gap: 16/5`, `marginTop: 8`, `paddingBottom: 5`, `Num size="52px"/"20px"`).
- `MetricRow.tsx` — **5** (`fontSize: 11`, `gap: 3`, `padding: "14px 12px"`, `Num size="22px"`, `Overline fontSize: 10`).
- `ProgressRing.tsx` — **0** (puur SVG-grafisch). ✓
**Kleur-tokens: GEEN drift** — alle kleur via `--good/--warn/--bad/--fresh(+soft)/--accent(+soft/grad)/--text-*/--bg-*/--zone`-achtige tokens (bestaan in `tokens.css`); geen off-palette hex (color-mix = toegestaan). De drift is puur numeriek (spacing/type) → **tokenize-pass zoals Schema, prio MID** (het ontwerp-mock gebruikt óók rauwe px, maar het UI-kader mandateert de schalen).

## 6. Gecategoriseerde + geprioriteerde totaallijst (fix-build-input)
**HOOG — ontbrekende conformiteit-metrics (data beschikbaar):**
1. `LevelCard.tsx`: tier-chip + tier-voortgangsbalk + "sinds"-delta (debt k) — `app.jsx:234/248-256/251`. Via `TIERS`/`tierIndex`/`niveauProgressie_`.
2. `MetricRow.tsx`: 3e kolom "Week-TSS" (debt k) — `app.jsx:301`. Via 7-daagse activities-idx8-som.

**MID — token-conformiteit (tokenize-pass, geen visuele intentie-wijziging):**
3. Alle vorm-componenten (behalve ProgressRing): rauwe spacing/type-literals → `--s-*/--fs-*/--lh-*/--r-*` (§5).

**LAAG — micro/beslispunt:**
4. `ConditiePmc.tsx`: TSB-headline (variant-B-graft) — houden vs puur-C; as-label "~12 wk".
5. `ReadinessCard.tsx`: detail-conformiteit-check (Chips/labels) tegen `app.jsx:131`.

**BEWUSTE CUT (NIET fixen, lean v1 — bevestigd):**
6. Swipe-**StatusDeck** (ReadinessCard↔LevelCard + dot-indicatoren, `app.jsx:262`) → gecut naar stacked kaarten (CLAUDE.md-invariant). Consistent met "geen switcher".

Onzekerheid: de exacte Chip-set van de design-ReadinessCard (Vorm+X/HRV) vs de Cadans-versie is niet regel-voor-regel vergeleken → visuele check (punt 5).
