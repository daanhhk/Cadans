import { defineConfig } from "vitest/config";

// apps/web RENDER-tests — jsdom, en bewust LOS van `vitest.config.ts` hiernaast.
//
// Die laatste draait op `environment: "node"` en dekt de pure helpers; een render-test heeft een
// DOM nodig en zou daar per constructie omvallen. De scheiding loopt over de EXTENSIE: dit
// project pakt `src/**/*.test.tsx`, het node-project `src/**/*.test.ts`. Een `.test.tsx` matcht
// die laatste glob niet, dus er ontstaat geen dubbele run — het vitest-totaal hoort met precies
// het aantal nieuwe asserties te stijgen en niet met het dubbele.
//
// GEEN @testing-library en GEEN extra render-laag: `createRoot` plus `act` uit react zelf
// volstaan, en elke afhankelijkheid minder is er een die niet kan verouderen.
//
// Lift mee in root `pnpm test` via de projects-array in ../../vitest.config.ts.
export default defineConfig({
  test: {
    name: "web-render",
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
  },
});
