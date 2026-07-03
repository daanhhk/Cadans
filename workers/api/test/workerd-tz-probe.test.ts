import { describe, expect, it } from "vitest";
import { toD1Date } from "../src/db/dates";

/**
 * DIAGNOSE (geen groen-forceren): honoreert de workerd-runtime de ambient
 * TZ=Europe/Amsterdam (zoals de node-pool onder de cross-env-pin), of valt hij
 * naar UTC? De uitkomst bepaalt of de datum-gevoelige engine-entrypoints een
 * TZ-expliciete refactor nodig hebben vóór deploy (deploy-blocker-item).
 *
 * Amsterdam: jan offset −60 (CET/UTC+1), jul offset −120 (CEST/UTC+2).
 * UTC: beide 0.
 */
describe("workerd TZ-probe (diagnose)", () => {
  it("rapporteert de ambient-TZ van de workers-runtime", () => {
    const janOffset = new Date(2026, 0, 15).getTimezoneOffset();
    const julOffset = new Date(2026, 6, 15).getTimezoneOffset();
    // DST-relevante datum via de engine/dates.ts-weg (formatDate met lokale getters).
    const midsummer = toD1Date(new Date(2026, 6, 1));
    const isAmsterdam = janOffset === -60 && julOffset === -120;
    const isUtc = janOffset === 0 && julOffset === 0;
    // eslint-disable-next-line no-console
    console.log(
      `[workerd-tz-probe] janOffset=${janOffset} julOffset=${julOffset} ` +
        `midsummer(toD1Date 2026-07-01)=${midsummer} → Amsterdam=${isAmsterdam} UTC=${isUtc}`,
    );
    void isUtc;
    // BEVINDING: de LOKALE/CI miniflare-workerd ERFT de TZ-env van het vitest-proces
    // (cross-env TZ=Europe/Amsterdam) → workerd honoreert Amsterdam. Dit is de
    // regressie-guard dat onze integratietests TZ-correct draaien.
    // DEPLOY-CAVEAT: een GEDEPLOYDE Cloudflare Worker draait UTC-only (geen TZ-env-
    // controle) → daar leunt de engine's ambient-datum-logica op UTC. De
    // TZ-expliciete engine-refactor (HANDOFF-debt (d)) blijft dus een deploy-blocker
    // voor datum-gevoelige entrypoints (weekgeneratie), ondanks deze groene probe.
    expect(isAmsterdam).toBe(true);
    // Kale-datum-round-trip is sowieso TZ-invariant:
    expect(toD1Date(new Date(2026, 6, 1))).toBe("2026-07-01");
  });
});
