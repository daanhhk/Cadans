import { describe, expect, it } from "vitest";
import { engineVersion } from "./index";

describe("engine scaffold", () => {
  it("exposes a version string", () => {
    expect(engineVersion()).toBe("cadans-engine-0.0.0");
  });
});
