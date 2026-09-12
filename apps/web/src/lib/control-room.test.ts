import assert from "node:assert/strict";
import test from "node:test";
import { fixtureStates, loadSnapshot, syntheticSnapshot } from "./control-room";

test("synthetic Control Room state is explicit and fail-closed", () => {
  const snapshot = syntheticSnapshot();
  assert.equal(snapshot.source, "synthetic");
  assert.equal(snapshot.listener.connected, false);
  assert.equal(snapshot.workflow?.contract.candidateRevision, "v42");
  assert.equal(snapshot.workflow?.status, "OBSERVING");
  assert.equal(snapshot.workflow?.receipt, undefined);
  assert.equal(snapshot.samples.some(({ value }) => value > 1), true);
  assert.equal(snapshot.workflow?.observation?.resets.at(-1)?.reason, "unhealthy");
});

test("required Control Room fixtures stay explicit and non-authoritative", () => {
  for (const state of fixtureStates) {
    assert.equal(syntheticSnapshot(state).source, "synthetic");
  }
  assert.equal(syntheticSnapshot("empty").workflow, null);
  assert.equal(syntheticSnapshot("awaiting-owner").workflow?.status, "PROPOSED");
  assert.equal(syntheticSnapshot("coordinator-offline").coordinator.connected, false);
  assert.equal(syntheticSnapshot("stale").workflow?.observation?.resets.at(-1)?.reason, "stale");
  assert.equal(syntheticSnapshot("gap").workflow?.observation?.resets.at(-1)?.reason, "gap");
  assert.match(syntheticSnapshot("unauthorized").notice ?? "", /rejected/);
  assert.equal(syntheticSnapshot("intervention").workflow?.status, "NEEDS_INTERVENTION");
  assert.equal(
    syntheticSnapshot("intervention").workflow?.verification?.observedRevision,
    "v41",
  );
  assert.equal(syntheticSnapshot("retired").workflow?.receipt?.observedRevision, "v42");
});

test("configured coordinator failure never retains synthetic live evidence", async () => {
  const priorUrl = process.env.INTERLOCK_COORDINATOR_URL;
  const priorFetch = globalThis.fetch;
  process.env.INTERLOCK_COORDINATOR_URL = "http://127.0.0.1:4317";
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  try {
    const snapshot = await loadSnapshot();
    assert.equal(snapshot.source, "coordinator");
    assert.equal(snapshot.coordinator.connected, false);
    assert.equal(snapshot.workflow, null);
    assert.deepEqual(snapshot.samples, []);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorUrl == null) delete process.env.INTERLOCK_COORDINATOR_URL;
    else process.env.INTERLOCK_COORDINATOR_URL = priorUrl;
  }
});
