import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../src/index";

// Whole-origin basic-auth gate (change 2): alleen actief als BASIC_AUTH_PASSWORD in
// de env zit. We roepen de app direct aan (app.fetch) zodat we het secret per-test
// kunnen injecteren — SELF.fetch gebruikt de vaste vitest-config-env (zónder secret),
// wat meteen de "geen secret → open" no-op-conditie is die de bestaande suite dekt.

const PASS = "testpass";
const basic = (user: string, pass: string) =>
  `Basic ${btoa(`${user}:${pass}`)}`;

async function fetchApp(
  path: string,
  envOverride: Record<string, unknown>,
  init?: RequestInit,
): Promise<Response> {
  const req = new Request(`https://cadans.test${path}`, init);
  const ctx = createExecutionContext();
  const resp = await app.fetch(req, { ...env, ...envOverride }, ctx);
  await waitOnExecutionContext(ctx);
  return resp;
}

describe("whole-origin basic-auth gate", () => {
  it("secret gezet, geen Authorization → 401 + WWW-Authenticate", async () => {
    const resp = await fetchApp("/api/health", { BASIC_AUTH_PASSWORD: PASS });
    expect(resp.status).toBe(401);
    expect(resp.headers.get("WWW-Authenticate")).toMatch(/^Basic/);
  });

  it("secret gezet, juiste creds (daan:testpass) → 200", async () => {
    const resp = await fetchApp(
      "/api/health",
      { BASIC_AUTH_PASSWORD: PASS },
      { headers: { Authorization: basic("daan", PASS) } },
    );
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: true, service: "cadans-api" });
  });

  it("secret gezet, foute creds → 401", async () => {
    const resp = await fetchApp(
      "/api/health",
      { BASIC_AUTH_PASSWORD: PASS },
      { headers: { Authorization: basic("daan", "wrong") } },
    );
    expect(resp.status).toBe(401);
  });

  it("geen secret in env → open (no-op) → 200", async () => {
    const resp = await fetchApp("/api/health", {
      BASIC_AUTH_PASSWORD: undefined,
    });
    expect(resp.status).toBe(200);
  });
});
