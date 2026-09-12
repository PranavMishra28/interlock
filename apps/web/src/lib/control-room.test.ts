import assert from "node:assert/strict";
import test from "node:test";
import { syntheticSnapshot } from "./control-room";

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
