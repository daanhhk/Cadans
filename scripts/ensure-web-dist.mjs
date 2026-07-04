// Ensure apps/web/dist exists before vitest runs.
//
// @cloudflare/vitest-pool-workers reads workers/api/wrangler.jsonc (configPath)
// and EAGERLY validates the `assets.directory` (../../apps/web/dist) — even for
// unit tests that never serve assets. In CI (and any fresh checkout) dist does
// not exist yet, because the gate order is test → build. A stub index.html
// satisfies the directory check; `pnpm build` afterwards overwrites dist with the
// real PWA. The tests only exercise /api/* (run_worker_first → the Hono Worker),
// so this stub is never actually served.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const distDir = new URL("../apps/web/dist/", import.meta.url);
const indexHtml = new URL("../apps/web/dist/index.html", import.meta.url);

if (!existsSync(indexHtml)) {
  mkdirSync(distDir, { recursive: true });
  writeFileSync(indexHtml, "<!doctype html><title>stub</title>\n");
}
