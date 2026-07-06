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
export function SchemaView({
  proposalWeek,
  readiness,
  doneByDate,
  todayISO,
  onRegen,
  regenerating,
}: {
  proposalWeek: ProposalWeek;
  readiness: ReadinessResult;
  doneByDate: Record<string, DoneEntry>;
  todayISO: string;
  onRegen: () => void;
  regenerating: boolean;
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
          <Overline>
            {day.weekday} {day.dayNum} · {STATE_LABEL[day.state]}
          </Overline>

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
        onRegen={onRegen}
        regenerating={regenerating}
      />
    </div>
  );
}
