import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("D1 smoke (miniflare)", () => {
  it("migratie toegepast — de 11 tabellen bestaan, geen proposal-tabel", async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    ).all<{ name: string }>();
    const names = results.map((r) => r.name);
    for (const t of [
      "activities",
      "checkins",
      "day_state",
      "events",
      "planner_days",
      "rpe",
      "settings",
      "sync_state",
      "users",
      "weekplans",
      "wellness",
    ]) {
      expect(names).toContain(t);
    }
    expect(names).not.toContain("proposal");
  });
});
