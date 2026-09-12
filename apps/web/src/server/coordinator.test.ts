import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCoordinator } from "./coordinator";
import { InterlockStore } from "./interlock-store";

test("loopback coordinator exposes read-only persisted state", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-coordinator-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const server = createCoordinator(store);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/snapshot`);
    assert.equal(response.status, 200);
    const snapshot = await response.json() as {
      coordinator: { connected: boolean };
      listener: { connected: boolean };
      workflow: unknown;
    };
    assert.equal(snapshot.coordinator.connected, true);
    assert.equal(snapshot.listener.connected, false);
    assert.equal(snapshot.workflow, null);

    const mutation = await fetch(
      `http://127.0.0.1:${address.port}/v1/snapshot`,
      { method: "POST" },
    );
    assert.equal(mutation.status, 404);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
