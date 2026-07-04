import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Worker-integratietests (miniflare + workerd) tegen een echte lokale D1.
 * De drizzle-migraties uit ./drizzle worden per test-worker toegepast via de
 * setup-file (applyD1Migrations). De DB-binding komt uit wrangler.jsonc.
 */
export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(join(here, "drizzle"));
  return {
    test: {
      name: "api-integration",
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          miniflare: {
            compatibilityDate: "2026-07-03",
            compatibilityFlags: ["nodejs_compat"],
            // De migratie-array beschikbaar in de test-worker als env.TEST_MIGRATIONS.
            // Dummy intervals-secrets (de outbound fetch is gemockt via fetchMock →
            // ze verlaten de test nooit; NIET de echte key/.dev.vars).
            bindings: {
              TEST_MIGRATIONS: migrations,
              INTERVALS_API_KEY: "test-key",
              INTERVALS_ATHLETE_ID: "i12345",
            },
          },
          wrangler: { configPath: join(here, "wrangler.jsonc") },
        },
      },
    },
  };
});
