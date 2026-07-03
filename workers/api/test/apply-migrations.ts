import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll } from "vitest";

// Past de drizzle-migraties toe op de lokale D1 vóór alle integratietests.
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
