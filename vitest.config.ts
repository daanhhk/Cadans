import { defineConfig } from "vitest/config";

/**
 * Multi-project test-setup:
 *  - engine     : de pure-engine-suite (packages/engine, 886/0) — node-pool.
 *  - api-unit   : pure workers/api-units (o.a. de TZ-conversielaag) — node-pool.
 *  - api-integration : Worker-integratietests tegen lokale D1 (miniflare) via
 *    @cloudflare/vitest-pool-workers — zie workers/api/vitest.config.ts.
 *  - web        : apps/web pure helpers (parseActivityRows) — node-pool; zie
 *    apps/web/vitest.config.ts.
 *  - web-render : apps/web render-tests op een echte DOM — jsdom-env; zie
 *    apps/web/vitest.render.config.ts. Gescheiden van `web` op de EXTENSIE:
 *    dit project pakt *.test.tsx, `web` pakt *.test.ts, dus geen dubbele run.
 *
 * De node-pools erven de TZ=Europe/Amsterdam-pin (root `pnpm test` = cross-env).
 * De workers-pool-tests zijn TZ-veilig (readiness-oracle = datumvrij;
 * datum-round-trips zijn TZ-invariant).
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "engine",
          include: ["packages/engine/src/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "api-unit",
          include: ["workers/api/src/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      "./workers/api/vitest.config.ts",
      "./apps/web/vitest.config.ts",
      "./apps/web/vitest.render.config.ts",
    ],
  },
});
