import type { D1Migration } from "@cloudflare/vitest-pool-workers/config";

// Bindings die in de integratietests via `cloudflare:test` beschikbaar zijn.
declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    TEST_MIGRATIONS: D1Migration[];
  }
}
