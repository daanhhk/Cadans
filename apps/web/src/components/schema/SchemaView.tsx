import type {
  DispositionReason,
  OverrideEntry,
  SettingsInput,
} from "@cadans/shared";
import { useMemo, useState } from "react";
import type { ProposalWeek } from "../../lib/proposal";
import type { ReadinessResult } from "../../lib/readiness";
import {
  type DayState,
  type DoneEntry,
  deriveSchemaView,
} from "../../lib/schema";
import { Card, Overline } from "../ui";
import { ActionButtons, GarminPushButton } from "./ActionButtons";
import { AlignChip } from "./AlignChip";
import { CoachReadinessBanner } from "./CoachReadinessBanner";
import { DayStrip } from "./DayStrip";
import { DispositionAffordance } from "./DispositionAffordance";
import { DoneCompareCard } from "./DoneCompareCard";
import { DoneDetail } from "./DoneDetail";
import { GemistCard } from "./GemistCard";
import { PeriodTimeline } from "./PeriodTimeline";
import { WeekLoad } from "./WeekLoad";
import { WorkoutDetail } from "./WorkoutDetail";

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
export function SchemaView({
  proposalWeek,
  readiness,
  doneByDate,
  todayISO,
  rpeByDate,
  dispositionByDate,
  overrides,
  settings,
}: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneByDate: Record<string, DoneEntry>;
  todayISO: string;
  rpeByDate: Record<string, number>;
  dispositionByDate: Record<string, DispositionReason>;
  overrides: OverrideEntry[];
  settings: SettingsInput;
}) {
  const view = useMemo(
    () =>
      deriveSchemaView(
        proposalWeek,
        doneByDate,
        todayISO,
        dispositionByDate,
        overrides,
        readiness,
        settings,
      ),
    [
      proposalWeek,
      doneByDate,
      todayISO,
      dispositionByDate,
      overrides,
      readiness,
      settings,
    ],
  );
  const [selected, setSelected] = useState(todayISO);
  const day = view.days.find((d) => d.datum === selected) ?? view.days[0];
  // dag >= vandaag: het knoppen-blok toont alleen op vandaag/toekomst (verleden kun je niet meer plannen).
  const dayFuture = !!day && day.datum >= todayISO;
  // plannbaar (GAS trnPlannable_): dag >= vandaag en niet voltooid -> "Andere training kiezen" mag.
  const dayPlannable = dayFuture && !!day && !day.done;
  // canDispose (GAS canDispose_, Script.html:448): een dag met voorstel, niet voltooid, nog niet
  // gedisponeerd, en datum <= vandaag → toon de "Niet gedaan?"-affordance.
  const canDispose =
    !!day &&
    day.sessions.length > 0 &&
    !day.done &&
    !day.dispositie &&
    day.datum <= todayISO;

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
              {day.weekday} {day.dayNum} · {STATE_LABEL[day.state]}
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

          {day.reden && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-label)",
                color: "var(--text-secondary)",
                marginTop: "var(--s-3)",
              }}
            >
              {day.reden}
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
            // gemist (A4): gedisponeerde dag mét voorstel, niet gereden → GemistCard + "Terug".
            <GemistCard reason={day.dispositie} date={day.datum} />
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
                  key={`${s.naam}-${s.tss}`}
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
          {/* Disposition-affordance (A2, GAS canDispose_): "Niet gedaan?" onder een plannbare,
              niet-gedisponeerde dag ≤ vandaag → flipt de dag naar 'gemist'. */}
          {canDispose && <DispositionAffordance date={day.datum} />}
          {/* Gedeeld knoppen-blok (§5e), alleen op vandaag/toekomst (dayFuture): op een verleden
              dag kun je beschikbaarheid niet meer aanpassen. "Andere training" alleen plannbaar. */}
          {dayFuture && (
            <ActionButtons plannable={dayPlannable} datum={day.datum} />
          )}
        </Card>
      )}
      {/* Tab-niveau "Push naar Garmin" (GAS Index.html:37, act-row): EEN keer onderaan de
          Schema-tab, NIET per-dag. Blijft "binnenkort" tot de Garmin-integratie er is. */}
      <GarminPushButton />
    </div>
  );
}
