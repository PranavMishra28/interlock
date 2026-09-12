import assert from "node:assert/strict";
import test from "node:test";
import { openSlackSocket } from "./socket-mode";

test("Socket Mode connect fails closed when Slack rejects the app token", async () => {
  await assert.rejects(
    () => openSlackSocket("xapp-x", async () => undefined, async () =>
      new Response(JSON.stringify({ ok: false, error: "invalid_auth" })),
    ),
    /invalid_auth/,
  );
});
