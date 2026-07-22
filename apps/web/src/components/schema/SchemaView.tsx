import { mesoFactor } from "@cadans/engine";
import type { DispositionReason, SettingsInput } from "@cadans/shared";
import { useMemo, useState } from "react";
import {
  coachNarrative,
  normalizeCoachPersona,
} from "../../lib/coachNarrative";
import { isDayPlannable } from "../../lib/library";
import type { ProposalWeek } from "../../lib/proposal";
import type { ReadinessResult } from "../../lib/readiness";
import {
  type DayState,
  type DoneEntry,
  deriveSchemaView,
  type FatigueVoorstel,
  type InhaalVoorstel,
  verlengResultaat,
  verlichtResultaat,
} from "../../lib/schema";
import { Card, Overline } from "../ui";
import { ActionButtons } from "./ActionButtons";
import { AlignChip } from "./AlignChip";
import { CoachCallout } from "./CoachCallout";
import { CoachReadinessBanner } from "./CoachReadinessBanner";
import { DayStrip } from "./DayStrip";
import { DispositionAffordance } from "./DispositionAffordance";
import { DoneCompareCard } from "./DoneCompareCard";
import { DoneDetail } from "./DoneDetail";
import { FatigueCard, isFatigueAfgewezen } from "./FatigueCard";
import { GarminPushButton } from "./GarminPushButton";
import { GemistCard } from "./GemistCard";
import { InhaalCard } from "./InhaalCard";
import { OverriddenDetail } from "./OverriddenDetail";
import { PeriodTimeline } from "./PeriodTimeline";
import { isVerlengAfgewezen, VerlengCard } from "./VerlengCard";
import { isVerlichtAfgewezen, VerlichtCard } from "./VerlichtCard";
import { WeekLoad } from "./WeekLoad";
import { WorkoutDetail } from "./WorkoutDetail";
import { WorkoutPickerSheet } from "./WorkoutPickerSheet";

const STATE_LABEL: Record<DayState, string> = {
  today: "Vandaag",
  done: "Voltooid",
  planned: "Voorstel",
  rest: "Rustdag",
  gemist: "Niet gereden",
};

// PURE Schema-presentatie op het view-model. Interne state = geselecteerde datum
// (default today). Geen fetch/derivatie hier — de container (pages/Schema.tsx) voedt 'm.
// Sectie-volgorde volgt schema.jsx: PeriodTimeline → WeekLoad → DayStrip → dag-detail.
// Het inhaal-voorstel (2b) staat tussen de dag-strip en de dagkaart: de weekcontext blijft
// erboven, maar het voorstel plakt visueel aan de training waar het over gaat.
export function SchemaView({
  proposalWeek,
  readiness,
  doneByDate,
  todayISO,
  rpeByDate,
  dispositionByDate,
  settings,
  inhaal = null,
  fatigue = null,
  optedIn = false,
  weekMonday,
}: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneByDate: Record<string, DoneEntry>;
  todayISO: string;
  rpeByDate: Record<string, number>;
  dispositionByDate: Record<string, DispositionReason>;
  settings: SettingsInput;
  /** FASE 2b — read-only inhaal-voorstel op weekniveau (null = niets tonen). */
  inhaal?: InhaalVoorstel | null;
  /** 3d stap 4 — fatigue-voorstel op weekniveau (offer/applied), of null. */
  fatigue?: FatigueVoorstel | null;
  /** FASE 3a — is het inhaal-plan voor deze week goedgekeurd? */
  optedIn?: boolean;
  /** Maandag van de getoonde week (sleutel van de goedkeuring); default = view.weekMonday. */
  weekMonday?: string;
}) {
  const view = useMemo(
    () =>
      deriveSchemaView(
        proposalWeek,
        doneByDate,
        todayISO,
        dispositionByDate,
        readiness,
        settings,
      ),
    [
      proposalWeek,
      doneByDate,
      todayISO,
      dispositionByDate,
      readiness,
      settings,
    ],
  );
  const [selected, setSelected] = useState(todayISO);
  const [pickerOpen, setPickerOpen] = useState(false);
  // LAAG 2: her-render-teller voor "Hou origineel". De afwijzing zelf leeft sessie-scoped in
  // VerlichtCard (module-level set, per datum) zodat ze een remount na sync overleeft; deze
  // state dwingt alleen de her-evaluatie af. Geen D1, geen localStorage.
  const [, setVerlichtDismissed] = useState(0);
  // 3d stap 2b: idem voor het VERLENG-aanbod ("Nee, hou X") — sessie-scoped afwijzing leeft in
  // VerlengCard; deze teller dwingt de her-evaluatie af.
  const [, setVerlengDismissed] = useState(0);
  // 3d stap 4: idem voor het FATIGUE-aanbod ("Volg de deload" / "Hou de opbouw") — sessie-scoped
  // afwijzing leeft in FatigueCard; deze teller dwingt de her-evaluatie af.
  const [, setFatigueDismissed] = useState(0);
  const day = view.days.find((d) => d.datum === selected) ?? view.days[0];
  // dag >= vandaag: het knoppen-blok toont alleen op vandaag/toekomst (verleden kun je niet meer plannen).
  const dayFuture = !!day && day.datum >= todayISO;
  // plannbaar (GAS trnPlannable_): dag >= vandaag, niet voltooid én niet gemist -> "Andere training
  // kiezen" mag. Via het gedeelde predicaat: een gemiste dag verliest de knop (GAS-parity).
  const dayPlannable = !!day && isDayPlannable(day, todayISO);
  // 3b: ÉÉN bron voor "toont deze dag de override-kaart?" — gebruikt door zowel de overline-label als
  // de OverriddenDetail-dispatch-tak, zodat ze niet uit elkaar kunnen lopen. Done/gemist winnen (een
  // gereden/gemiste dag is een specifieker feit dan een hangende override).
  const isOverrideCard = !!day?.override && !day.done && day.state !== "gemist";
  // canDispose (GAS canDispose_, Script.html:448): een dag met voorstel, niet voltooid, nog niet
  // gedisponeerd, en datum <= vandaag → toon de "Niet gedaan?"-affordance.
  const canDispose =
    !!day &&
    day.sessions.length > 0 &&
    !day.done &&
    !day.dispositie &&
    day.datum <= todayISO;

  // 2b: per-dag coach-narrative (boven de training). Alleen op een dag mét een reden (plan-dagen;
  // done/gemist-dagen hebben geen redenCode → geen dubbel coach-blok). Op een OVERRIDE-dag onderdrukt
  // (3b, GAS overrideKaart_ toont geen coach-regel — de pin IS de zichtbare reden). null/leeg → niks.
  // NB: de guard is `!day.override`, BEWUST breder dan `isOverrideCard`: ook op een done-dag waar toch
  // een override hangt zou "Handmatig gekozen" als coach-regel onzin zijn. NIET "harmoniseren" naar
  // isOverrideCard.
  // LAAG 2: toon het verlicht-voorstel alleen op de GESELECTEERDE dag (het voorstel geldt
  // per definitie vandaag) en alleen als het deze sessie niet is afgewezen.
  const verlichtVoorstel =
    view.verlicht &&
    day?.datum === view.verlicht.datum &&
    !isVerlichtAfgewezen(view.verlicht.datum)
      ? view.verlicht
      : null;

  // 3d stap 4 — FATIGUE-voorstel op weekniveau. 'applied' toont altijd (de shift is actief);
  // 'offer' alleen als het deze sessie niet is weggeklikt. De maandag is de goedkeur-sleutel.
  const fatigueMonday = weekMonday ?? view.weekMonday;
  const fatigueVoorstel =
    fatigue &&
    (fatigue.state === "applied" ||
      !isFatigueAfgewezen(fatigueMonday, fatigue.dir))
      ? fatigue
      : null;

  // 3d stap 2b — VERLENG-aanbod op een opbouwweek-duurrit. De motor capt de lange rit op de
  // ingestelde dag-minuten; in mesoweek 2/3 (Base/Build/Peak) biedt de coach aan 'm te
  // verlengen als er meer tijd is. Alleen op een plánbare, toekomstige, niet-overschreven
  // long_z2-dag; de verleng-duur = huidige duur × mesoFactor (dezelfde bron als de motor-cap).
  const verlengVanMin = day?.sessions[0]?.totaalMin ?? 0;
  const verlengNaarMin = Math.round(
    verlengVanMin * mesoFactor(proposalWeek.mesoWeek),
  );
  const toonVerleng =
    !!day &&
    (proposalWeek.mesoWeek === 2 || proposalWeek.mesoWeek === 3) &&
    (view.fase === "Base" || view.fase === "Build" || view.fase === "Peak") &&
    day.voorgesteldType === "long_z2" &&
    dayPlannable &&
    dayFuture &&
    !day.done &&
    day.override == null &&
    verlengNaarMin > verlengVanMin &&
    !isVerlengAfgewezen(day.datum);

  const coachText =
    day?.reden && !day.override
      ? coachNarrative(
          day.redenCode,
          day.reden,
          day.datum,
          normalizeCoachPersona(settings.coachPersona),
        )
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
        paddingTop: "var(--s-2)",
      }}
    >
      <PeriodTimeline
        faseLabel={view.faseLabel}
        fase={view.fase}
        eventNaam={view.eventNaam}
        wekenTotEvent={view.wekenTotEvent}
        planModus={view.planModus}
        volumeUren={view.volumeUren}
      />

      <WeekLoad tss={view.tss} minuten={view.minuten} dagen={view.dagen} />

      <DayStrip
        days={view.days}
        selected={day?.datum ?? ""}
        onSelect={setSelected}
      />

      {/* 3d stap 4 — FATIGUE-voorstel op WEEKNIVEAU (offer/applied). Staat vóór de inhaal-kaart;
          een DOWN-voorstel onderdrukt de inhaal al in laag-1 (inhaal=null), en de render-guard
          hieronder houdt ze sowieso uit elkaar (één week-kaart tegelijk). */}
      {fatigueVoorstel && (
        <FatigueCard
          fatigue={fatigueVoorstel}
          baseline={proposalWeek}
          coachNaam={view.coachNaam}
          weekMonday={fatigueMonday}
          onDismiss={() => setFatigueDismissed((n) => n + 1)}
        />
      )}

      {/* FASE 2b — inhaal-voorstel op WEEKNIVEAU (read-only). Onderdrukt zodra er een
          verlicht-voorstel voor vandaag staat: M66 laat herstel winnen van inhalen, dus
          die twee horen elkaar nooit te overlappen. De band-poort in buildInhaalVoorstel
          sluit dat al uit; deze guard is de tweede grendel op de render-kant. Ook onderdrukt
          zodra een fatigue-week-kaart staat (één week-kaart tegelijk). */}
      {(optedIn || inhaal) && !verlichtVoorstel && !fatigueVoorstel && (
        <InhaalCard
          voorstel={inhaal}
          coachNaam={view.coachNaam}
          weekMonday={weekMonday ?? view.weekMonday}
          optedIn={optedIn}
        />
      )}

      {day && (
        <Card>
          {/* P4: align-chip op de overline-rij (GAS Script.html:585 / design DayHead-right). */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--s-2)",
            }}
          >
            <Overline>
              {day.weekday} {day.dayNum} ·{" "}
              {isOverrideCard ? "Gekozen" : STATE_LABEL[day.state]}
            </Overline>
            {day.doneCompare && (
              <AlignChip
                kind={day.doneCompare.chipKind}
                label={day.doneCompare.chipLabel}
              />
            )}
          </div>

          {day.state === "today" && (
            <div style={{ marginTop: "var(--s-3)" }}>
              <CoachReadinessBanner readiness={readiness} />
            </div>
          )}

          {/* 2b: de per-dag coach-stem in het gedeelde coach-blok-formaat (bubble-glyph + coachnaam-
              kop + tekst), EXACT hier (boven de training, na de today-readiness-banner). Persona uit
              settings (guard → "warm"). impact=false (default). */}
          {coachText && (
            <div style={{ marginTop: "var(--s-3)" }}>
              <CoachCallout narrative={coachText} coachNaam={view.coachNaam} />
            </div>
          )}

          {day.done ? (
            day.doneCompare ? (
              // §5c voltooid-volle → volle kaart (incl. ritdetails-link + impact-box). Het gedeelde
              // knoppen-blok volgt NA de state-conditional (een keer, onder elke state).
              <DoneCompareCard
                card={day.doneCompare}
                coachNaam={view.coachNaam}
                date={day.datum}
                rpe={rpeByDate[day.datum] ?? null}
              />
            ) : (
              // §5d voltooid-verleden (gereduceerde kaart-inhoud, bewust geparkeerd).
              <DoneDetail done={day.done} />
            )
          ) : day.state === "gemist" ? (
            // gemist (A4): gedisponeerde dag mét voorstel, niet gereden → GemistCard + "Terug" +
            // de gemist-coach-narrative (missedCoach_) in de gedeelde CoachCallout.
            <GemistCard
              reason={day.dispositie}
              date={day.datum}
              narrative={day.coach?.narrative ?? null}
              coachNaam={view.coachNaam}
            />
          ) : isOverrideCard && day.override ? (
            // 3b: handmatig gekozen training → OverriddenDetail + "Terug naar voorstel". `isOverrideCard`
            // = dezelfde bron als de overline-"Gekozen" (kunnen niet uit elkaar lopen). NA done/gemist
            // (die sluiten voltooid/gereden al uit; GAS zet de override-tak bovenaan via trnPlannable_,
            // hier done/gemist-first = zelfde uitkomst, robuust tegen de gedaan/activity-drift).
            <OverriddenDetail
              override={day.override}
              session={day.sessions[0] ?? null}
              date={day.datum}
              // LAAG 2: alleen een GEACCEPTEERD verlicht-voorstel (src:'readiness') krijgt een
              // coach-resultaatregel; een handmatige keuze niet (GAS overrideKaart_ ook niet).
              coachRegel={
                verlichtResultaat(day.override) ??
                verlengResultaat(day.override)
              }
              coachNaam={view.coachNaam}
            />
          ) : day.sessions.length === 0 ? (
            // §5a rustdag → lege-staat-copy. Knoppen-blok volgt NA de state-conditional.
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "var(--s-5) var(--s-2) var(--s-2)",
                lineHeight: "var(--lh-body)",
              }}
            >
              Rustdag — van herstel word je beter.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-4)",
                marginTop: "var(--s-4)",
              }}
            >
              {day.sessions.map((s, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: statische read-only per-dag-sessielijst (geen reorder) → index-key is veilig. `${s.naam}-${s.tss}` was NIET uniek: pendel heen+terug zijn in een Base-week identiek (beide pendel_z2, zelfde naam én tss) → dubbele keys → React-reconciliatie-fout (duplicaat "SESSIE 1/2" + cross-day-fantoom). `day.datum` forceert een schone remount bij dag-wissel.
                  key={`${day.datum}-${i}`}
                  style={
                    i > 0
                      ? {
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "var(--s-4)",
                        }
                      : undefined
                  }
                >
                  <WorkoutDetail
                    session={s}
                    overline={
                      day.sessions.length > 1
                        ? `Sessie ${i + 1}/${day.sessions.length}`
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
          {/* LAAG 2 — verlicht-VOORSTEL op vandaag (readiness caution/rest + harde sessie).
              Staat NA de sessie-render zodat de gebruiker eerst ziet waar het over gaat, en
              vóór de disposition-affordance. `verlichtVoorstel` is al null zodra de dag done/
              gemist is, een override draagt, of het voorstel deze sessie is afgewezen. */}
          {verlichtVoorstel && (
            <VerlichtCard
              voorstel={verlichtVoorstel}
              coachNaam={view.coachNaam}
              onDismiss={() => setVerlichtDismissed((n) => n + 1)}
            />
          )}
          {/* 3d stap 2b — VERLENG-aanbod op een opbouwweek-duurrit (spiegelt VerlichtCard). */}
          {toonVerleng && day && (
            <VerlengCard
              datum={day.datum}
              vanMin={verlengVanMin}
              naarMin={verlengNaarMin}
              coachNaam={view.coachNaam}
              onDismiss={() => setVerlengDismissed((n) => n + 1)}
            />
          )}
          {/* Disposition-affordance (A2, GAS canDispose_): "Niet gedaan?" onder een plannbare,
              niet-gedisponeerde dag ≤ vandaag → flipt de dag naar 'gemist'. */}
          {canDispose && <DispositionAffordance date={day.datum} />}
          {/* Gedeeld knoppen-blok (§5e), alleen op vandaag/toekomst (dayFuture): op een verleden
              dag kun je beschikbaarheid niet meer aanpassen. "Andere training" alleen plannbaar. */}
          {dayFuture && (
            <ActionButtons
              plannable={dayPlannable}
              datum={day.datum}
              onPickWorkout={() => setPickerOpen(true)}
            />
          )}
        </Card>
      )}
      {/* Tab-niveau "Push naar Garmin" (GAS Index.html:37, act-row): EEN keer onderaan de
          Schema-tab, NIET per-dag. Blijft "binnenkort" tot de Garmin-integratie er is. */}
      <GarminPushButton
        days={view.days}
        todayISO={todayISO}
        ftp={settings.ftp ?? null}
      />
      {/* 3b: workout-picker-sheet (opent via "Andere training kiezen"); voed met de week-context zodat
          de preview == de dagkaart (WYSIWYG). */}
      {day && (
        <WorkoutPickerSheet
          open={pickerOpen}
          date={day.datum}
          dagIdx={day.dagIdx}
          settings={settings}
          mesoWeek={proposalWeek.mesoWeek}
          macroFase={proposalWeek.macroFase}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
