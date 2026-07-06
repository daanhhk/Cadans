import { useMemo, useState } from "react";
import { CoachReadinessBanner } from "../components/schema/CoachReadinessBanner";
import { DayStrip } from "../components/schema/DayStrip";
import { WeekLoad } from "../components/schema/WeekLoad";
import { WorkoutDetail } from "../components/schema/WorkoutDetail";
import { Card, Overline } from "../components/ui";
import type { ProposalWeek } from "../lib/proposal";
import type { ReadinessResult } from "../lib/readiness";
import { type DayState, deriveSchemaView } from "../lib/schema";

const STATE_LABEL: Record<DayState, string> = {
  today: "Vandaag",
  done: "Voltooid",
  planned: "Voorstel",
  rest: "Rustdag",
};

// Schema-tab — PURE presentation op het ProposalWeek-view-model. Interne state =
// geselecteerde datum (default today). In stap 3 wordt dit door een live-container
// gevoed (getPlanner/getEvents/getRpe/getWeekplans → buildWeekProposal + deriveReadiness).
export function Schema({
  proposalWeek,
  readiness,
  doneTssByDate,
  todayISO,
}: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneTssByDate: Record<string, number>;
  todayISO: string;
}) {
  const view = useMemo(
    () => deriveSchemaView(proposalWeek, doneTssByDate, todayISO),
    [proposalWeek, doneTssByDate, todayISO],
  );
  const [selected, setSelected] = useState(todayISO);
  const day = view.days.find((d) => d.datum === selected) ?? view.days[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingTop: 8,
      }}
    >
      <DayStrip
        days={view.days}
        selected={day?.datum ?? ""}
        onSelect={setSelected}
      />

      {day && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Overline>
              {day.weekday} {day.dayNum} · {STATE_LABEL[day.state]}
            </Overline>
          </div>

          {day.state === "today" && (
            <div style={{ marginTop: 12 }}>
              <CoachReadinessBanner readiness={readiness} />
            </div>
          )}

          {day.reden && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--text-secondary)",
                marginTop: 12,
              }}
            >
              {day.reden}
            </div>
          )}

          {day.sessions.length === 0 ? (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 8px 8px",
                lineHeight: 1.5,
              }}
            >
              Rustdag — van herstel word je beter.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginTop: 14,
              }}
            >
              {day.sessions.map((s, i) => (
                <div
                  key={`${s.naam}-${s.tss}`}
                  style={
                    i > 0
                      ? {
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: 16,
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

      <WeekLoad
        tss={view.tss}
        minuten={view.minuten}
        dagen={view.dagen}
        onRegen={() => {
          /* stap 3: regenereer de week */
        }}
      />
    </div>
  );
}
