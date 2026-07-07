# Cadans PWA — UI-kader

Bron van waarheid voor de vormgeving van de PWA. Bij conflict tussen code en dit kader (of de design-autoriteit) wint het ontwerp.

## Lagen & autoriteit
- Design-tokens (live): apps/web/src/styles/tokens.css — de enige token-bron die de app gebruikt. 1-op-1 spiegel van de import-autoriteit design/src/tokens.css (identieke waarden; alleen Biome-formattering verschilt). Token-wijziging = beide bijwerken of naar één bron stroomlijnen.
- Visuele autoriteit per tab: design/src/*.jsx (bv. schema.jsx) + design/docs/FTP-Coach-export.md. Leidend voor layout, componenten en states.
- Dit doc: de brug — hoe React-componenten de tokens consumeren en welke gedrag-regels gelden. Geen nieuwe visuele waarheid; een consumptie-contract.

## Typografie-fundament
- Tekst: IBM Plex Sans (--font-sans). Getallen/metrics: IBM Plex Mono (--font-num).
- Self-hosted via @fontsource (geen CDN, PWA werkt offline, geen externe request, versie-gepind). System-ui-fallback = bug, niet de bedoeling.
- De type-schaal (--fs-*, --lh-*) is op Plex-metrics ontworpen; visuele afstemming van spacing/type gebeurt pas nadat het juiste font laadt.

## Consumptie-regel: alleen schaal-tokens
Componenten gebruiken UITSLUITEND de schaal-tokens, nooit losse numerieke literals in style={{}}:
- spacing (margin/gap/padding): --s-1..8 (4-pt schaal)
- font-size: --fs-*; line-height: --lh-*; font-weight: --fw-* / --fw-num-*
- radius: --r-*
- kleur: reeds gedisciplineerd — alle kleur via tokens, 0 hardcoded hex

Off-scale-beleid: een bestaande off-scale-waarde snapt naar de dichtstbijzijnde schaal-stap. Blijkt een gebruik écht een ontbrekende stap te vereisen (ontwerp-gedreven), dan wordt die stap als token toegevoegd aan de autoriteit — niet ad-hoc inline. Elke snap wordt visueel geverifieerd op de telefoon.

## Gedrag-regels
- Focus vs zone (geen dubbel woord): de zone-pill (ZoneBar) is de canonieke plek voor het zone-woord. De focus-subtitel (WorkoutDetail) toont het focus-doel en mag NIET hetzelfde NL-woord herhalen dat de zone-pill al toont. Exact gedrag volgt schema.jsx.
- Macro-fase-label: de UI toont de macro-fase als apart, NL-gelabeld element, gevoed door een discreet macroFase-veld op de proposal-DTO (niet door Engelse engine-proza te parsen).

## Scope-status (drift t.o.v. dit kader)
- Schema-componenten zijn nu volledig inline-styled met hardcoded spacing/font-size (te migreren naar schaal-tokens — deze ronde).
- Ontwerp-vocabulaire nog niet gebouwd (geparkeerd, aparte feature): PeriodCard/periodisering-status (--phase-*), coach-callout (--coach-*), zone-vergelijking (--zcompare-*).

## Patroon voor andere tabs
Vorm / Trainingen / Niveau volgen ditzelfde consumptie-contract en dezelfde autoriteit-hiërarchie.
