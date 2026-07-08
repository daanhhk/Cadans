// Lightweight in-memory signal: bumped whenever planner_days is mutated, so the Schema tab
// can rebuild its proposal from fresh data (no shared store / React Query in this app).
let version = 0;
const listeners = new Set<() => void>();
export function bumpPlannerVersion(): void {
  version += 1;
  for (const l of listeners) l();
}
export function subscribePlannerVersion(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function getPlannerVersion(): number {
  return version;
}
