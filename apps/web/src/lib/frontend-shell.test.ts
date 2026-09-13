import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import nextConfig, { securityHeaders } from "../../next.config";

test("frontend shell keeps its security and loading contracts", async () => {
  const headers = Object.fromEntries(
    securityHeaders.map(({ key, value }) => [key, value]),
  );
  const rules = await nextConfig.headers!();
  const [loading, css, refresh, page] = await Promise.all([
    readFile(new URL("../app/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/auto-refresh.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(rules[0]?.source, "/:path*");
  assert.match(headers["Content-Security-Policy"]!, /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"]!, /script-src 'self' 'unsafe-inline'/);
  assert.equal(headers["Referrer-Policy"], "no-referrer");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal((loading.match(/role="status"/g) ?? []).length, 1);
  assert.match(loading, /aria-hidden="true"/);
  assert.match(css, /--font-sans: -apple-system/);
  assert.match(css, /--font-mono: ui-monospace/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
  assert.match(css, /\.cr-loading-grid \.cr-card \{\s+min-height:/);
  assert.match(refresh, /router\.refresh\(\)/);
  assert.doesNotMatch(refresh, /location\.reload|httpEquiv/);
  assert.match(page, /dynamic = "force-dynamic"/);
});
