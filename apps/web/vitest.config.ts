import { defineConfig } from "vitest/config";

// apps/web unit-tests (pure helpers, bv. parseActivityRows) — node-env, GEEN
// jsdom en GEEN @cloudflare/vitest-pool-workers. Een aparte vitest.config (niet
// vite.config) zodat de PWA-plugin/proxy niet meelaadt in de tests. Lift mee in
// root `pnpm test` via de projects-array in ../../vitest.config.ts; standalone via
// `pnpm --filter @cadans/web test`.
export default defineConfig({
  test: {
    name: "web",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
