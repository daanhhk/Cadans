import { useMemo, useState } from "react";
import type { ProposalWeek } from "../../lib/proposal";
import type { ReadinessResult } from "../../lib/readiness";
import {
  type DayState,
  type DoneEntry,
  deriveSchemaView,
} from "../../lib/schema";
import { Card, Overline } from "../ui";
import { CoachReadinessBanner } from "./CoachReadinessBanner";
import { DayStrip } from "./DayStrip";
import { DoneDetail } from "./DoneDetail";
import { PeriodTimeline } from "./PeriodTimeline";
import { WeekLoad } from "./WeekLoad";
import { WorkoutDetail } from "./WorkoutDetail";

const STATE_LABEL: Record<DayState, string> = {
  today: "Vandaag",
  done: "Voltooid",
  planned: "Voorstel",
  rest: "Rustdag",
};

// PURE Schema-presentatie op het view-model. Interne state = geselecteerde datum
// (default today). Geen fetch/derivatie hier — de container (pages/Schema.tsx) voedt 'm.
// Sectie-volgorde volgt schema.jsx: PeriodTimeline → WeekLoad → DayStrip → dag-detail.
export function SchemaView({
  proposalWeek,
  readiness,
  doneByDate,
  todayISO,
  onRegen,
  regenerating,
  syncNote,
}: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneByDate: Record<string, DoneEntry>;
  todayISO: string;
  onRegen: () => void;
  regenerating: boolean;
  syncNote: { text: string; error: boolean } | null;
}) {
  const view = useMemo(
    () => deriveSchemaView(proposalWeek, doneByDate, todayISO),
    [proposalWeek, doneByDate, todayISO],
  );
  const [selected, setSelected] = useState(todayISO);
  const day = view.days.find((d) => d.datum === selected) ?? view.days[0];

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
        faseLabel={view.macroFaseLabel}
        macroFase={view.macroFase}
        eventNaam={view.eventNaam}
        wekenTotEvent={view.wekenTotEvent}
        planModus={view.planModus}
      />

      <WeekLoad
        tss={view.tss}
        minuten={view.minuten}
        dagen={view.dagen}
        onRegen={onRegen}
        regenerating={regenerating}
        syncNote={syncNote}
      />

      <DayStrip
        days={view.days}
        selected={day?.datum ?? ""}
        onSelect={setSelected}
      />

      {day && (
        <Card>
          <Overline>
            {day.weekday} {day.dayNum} · {STATE_LABEL[day.state]}
          </Overline>

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
            <DoneDetail done={day.done} />
          ) : day.sessions.length === 0 ? (
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
        </Card>
      )}
    </div>
  );
}
