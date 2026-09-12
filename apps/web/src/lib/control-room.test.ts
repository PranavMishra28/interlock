import assert from "node:assert/strict";
import test from "node:test";
import { fixtureStates, syntheticSnapshot } from "./control-room";

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
  assert.equal(syntheticSnapshot("retired").workflow?.receipt?.observedRevision, "v42");
});
